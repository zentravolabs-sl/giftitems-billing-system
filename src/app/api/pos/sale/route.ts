import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { StockMovementType, SaleChannel, PaymentMethod, PaymentStatus, SaleStatus } from "@prisma/client";
import { z } from "zod";

const paymentItemSchema = z.object({
  method: z.enum(["CASH", "CARD", "SPLIT", "GIFT_VOUCHER", "OTHER"]),
  amount: z.number().min(0.01, "Payment amount must be greater than zero"),
  cardLast4: z.string().optional(),
  cardTerminalRef: z.string().optional(),
  transactionRef: z.string().optional(),
});

const saleItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than zero"),
  unitPrice: z.number().min(0, "Price must be non-negative"),
  lineDiscount: z.number().min(0).default(0),
});

const createSaleSchema = z.object({
  customerId: z.string().nullable().optional(),
  items: z.array(saleItemSchema).min(1, "At least one item is required in cart"),
  cartDiscount: z.number().min(0).default(0),
  payments: z.array(paymentItemSchema).min(1, "At least one payment method is required"),
  amountPaid: z.number().min(0),
  changeAmount: z.number().min(0).default(0),
  notes: z.string().nullable().optional(),
  syncId: z.string().nullable().optional(), // Idempotency key from offline queue
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const result = createSaleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    // Check for idempotency if syncId is provided (prevents duplicate submission from offline queue)
    if (data.syncId) {
      const existingSale = await prisma.sale.findUnique({
        where: { syncId: data.syncId },
        include: {
          items: { include: { product: true } },
          payments: true,
          customer: true,
        },
      });

      if (existingSale) {
        return NextResponse.json({
          success: true,
          sale: existingSale,
          isDuplicate: true,
          message: "Transaction already synced previously",
        });
      }
    }

    // Load store settings for tax & prefix
    const settings = await prisma.businessSettings.findUnique({
      where: { id: "default" },
    });
    const prefix = settings?.invoicePrefix || "ZGB-";
    const enableTax = settings?.enableTax ?? false;
    const taxRate = enableTax ? Number(settings?.taxPercentage || 0) / 100 : 0;

    // Calculate subtotal and verify stock
    let subtotal = 0;
    const computedItems: Array<{
      productId: string;
      quantity: number;
      unitCost: number;
      unitPrice: number;
      lineDiscount: number;
      lineTotal: number;
      currentStock: number;
      productName: string;
    }> = [];

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || !product.isActive) {
        return NextResponse.json(
          { error: `Product not found or inactive: ${item.productId}` },
          { status: 400 }
        );
      }

      const currentStock = Number(product.stockQuantity);
      if (currentStock < item.quantity) {
        // Stock warning: still allow checkout if offline sync, but log conflict
        console.warn(`Stock shortage for ${product.name}: stock is ${currentStock}, ordered ${item.quantity}`);
      }

      const lineTotal = Math.max(0, item.quantity * item.unitPrice - item.lineDiscount);
      subtotal += lineTotal;

      computedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: Number(product.buyingCost),
        unitPrice: item.unitPrice,
        lineDiscount: item.lineDiscount,
        lineTotal,
        currentStock,
        productName: product.name,
      });
    }

    const discountedSubtotal = Math.max(0, subtotal - data.cartDiscount);
    const taxAmount = Math.round(discountedSubtotal * taxRate * 100) / 100;
    const grandTotal = Math.round((discountedSubtotal + taxAmount) * 100) / 100;

    // Validate payments reconciliation
    const totalPayments = data.payments.reduce((acc, p) => acc + p.amount, 0);
    if (Math.abs(totalPayments - grandTotal) > 0.05 && totalPayments < grandTotal) {
      return NextResponse.json(
        { error: `Payment total (Rs. ${totalPayments.toFixed(2)}) does not match bill grand total (Rs. ${grandTotal.toFixed(2)})` },
        { status: 400 }
      );
    }

    const invoiceNumber = `${prefix}${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // Database transaction: create sale, decrement stock, write inventory movement ledger
    const sale = await prisma.$transaction(async (tx) => {
      const createdSale = await tx.sale.create({
        data: {
          invoiceNumber,
          channel: SaleChannel.POS,
          customerId: data.customerId || null,
          cashierId: user?.userId || null,
          status: SaleStatus.COMPLETED,
          subtotal,
          cartDiscount: data.cartDiscount,
          taxAmount,
          grandTotal,
          paidAmount: data.amountPaid,
          changeAmount: data.changeAmount,
          notes: data.notes || null,
          syncId: data.syncId || null,
          isOfflineSynced: !!data.syncId,
          items: {
            create: computedItems.map((ci) => ({
              productId: ci.productId,
              quantity: ci.quantity,
              unitCost: ci.unitCost,
              unitPrice: ci.unitPrice,
              lineDiscount: ci.lineDiscount,
              lineTotal: ci.lineTotal,
            })),
          },
          payments: {
            create: data.payments.map((p) => ({
              method: p.method as PaymentMethod,
              amount: p.amount,
              status: PaymentStatus.CONFIRMED,
              cardLast4: p.cardLast4 || null,
              cardTerminalRef: p.cardTerminalRef || null,
              transactionRef: p.transactionRef || null,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          payments: true,
          customer: true,
          cashier: { select: { id: true, name: true } },
        },
      });

      // Update stock levels and record inventory movements atomically
      for (const ci of computedItems) {
        const newStock = ci.currentStock - ci.quantity;

        await tx.product.update({
          where: { id: ci.productId },
          data: { stockQuantity: newStock },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: ci.productId,
            movementType: StockMovementType.POS_SALE,
            quantityChange: -ci.quantity,
            previousStock: ci.currentStock,
            newStock,
            unitCost: ci.unitCost,
            referenceDocument: invoiceNumber,
            notes: `POS Checkout ${invoiceNumber}`,
            createdById: user?.userId || null,
          },
        });
      }

      // Add customer loyalty points if customer selected ($1 = 1 point)
      if (data.customerId) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: {
            loyaltyPoints: {
              increment: Math.floor(grandTotal),
            },
          },
        });
      }

      return createdSale;
    });

    return NextResponse.json({ success: true, sale }, { status: 201 });
  } catch (error) {
    console.error("POS Sale error:", error);
    return NextResponse.json({ error: "Failed to process sale" }, { status: 500 });
  }
}
