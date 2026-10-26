import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { Role, PurchaseStatus, StockMovementType, PaymentMethod } from "@prisma/client";
import { z } from "zod";

const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantityOrdered: z.number().min(0.01, "Quantity must be greater than zero"),
  quantityReceived: z.number().min(0).default(0),
  unitCost: z.number().min(0, "Unit cost must be non-negative"),
});

const purchaseCreateSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  invoiceNumber: z.string().nullable().optional(),
  purchaseDate: z.string().optional(),
  status: z.enum(["ORDERED", "RECEIVED", "PARTIALLY_RECEIVED", "CANCELLED"]).default("ORDERED"),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
  discount: z.number().min(0).default(0),
  additionalCost: z.number().min(0).default(0),
  paidAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "CHEQUE"]).optional(),
  notes: z.string().nullable().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");

    const where: any = {};
    if (status) where.status = status as PurchaseStatus;
    if (supplierId) where.supplierId = supplierId;

    const purchases = await prisma.purchase.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        createdBy: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error("Purchases GET error:", error);
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, [Role.ADMIN, Role.INVENTORY_STAFF])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const result = purchaseCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    // Calculate subtotal and line totals
    let subtotal = 0;
    const computedItems = data.items.map((item) => {
      const lineTotal = item.quantityOrdered * item.unitCost;
      subtotal += lineTotal;
      return {
        ...item,
        lineTotal,
      };
    });

    const grandTotal = Math.max(0, subtotal - data.discount + data.additionalCost);
    const balanceDue = Math.max(0, grandTotal - data.paidAmount);

    const purchaseNumber = `PO-${Date.now().toString(36).toUpperCase()}`;

    // Execute atomic purchase creation & inventory movement inside a database transaction
    const purchase = await prisma.$transaction(async (tx) => {
      const createdPurchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId: data.supplierId,
          invoiceNumber: data.invoiceNumber || null,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
          status: data.status as PurchaseStatus,
          subtotal,
          discount: data.discount,
          additionalCost: data.additionalCost,
          grandTotal,
          paidAmount: data.paidAmount,
          balanceDue,
          notes: data.notes || null,
          createdById: user.userId,
          items: {
            create: computedItems.map((item) => ({
              productId: item.productId,
              quantityOrdered: item.quantityOrdered,
              quantityReceived: data.status === "RECEIVED" ? item.quantityOrdered : (item.quantityReceived || 0),
              unitCost: item.unitCost,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // If status is RECEIVED, update stock and weighted average cost
      if (data.status === "RECEIVED") {
        for (const item of computedItems) {
          const product = await tx.product.findUniqueOrThrow({
            where: { id: item.productId },
          });

          const currentQty = Number(product.stockQuantity);
          const currentCost = Number(product.buyingCost);
          const receivedQty = item.quantityOrdered;
          const newQty = currentQty + receivedQty;

          // Weighted average cost calculation
          let newAvgCost = item.unitCost;
          if (currentQty > 0 && newQty > 0) {
            newAvgCost = (currentQty * currentCost + receivedQty * item.unitCost) / newQty;
          }

          // Update product stock and average cost
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: newQty,
              buyingCost: Math.round(newAvgCost * 100) / 100,
            },
          });

          // Record Inventory Movement Ledger entry
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              movementType: StockMovementType.PURCHASE_RECEIVE,
              quantityChange: receivedQty,
              previousStock: currentQty,
              newStock: newQty,
              unitCost: item.unitCost,
              referenceDocument: purchaseNumber,
              notes: `Stock received via Purchase ${purchaseNumber}`,
              createdById: user.userId,
            },
          });
        }
      }

      // Update supplier balance
      if (balanceDue > 0) {
        await tx.supplier.update({
          where: { id: data.supplierId },
          data: {
            balanceDue: {
              increment: balanceDue,
            },
          },
        });
      }

      // Record payment if paidAmount > 0
      if (data.paidAmount > 0) {
        await tx.supplierPayment.create({
          data: {
            supplierId: data.supplierId,
            purchaseId: createdPurchase.id,
            amount: data.paidAmount,
            paymentMethod: (data.paymentMethod as PaymentMethod) || PaymentMethod.CASH,
            notes: `Initial payment for PO ${purchaseNumber}`,
            createdById: user.userId,
          },
        });
      }

      return createdPurchase;
    });

    return NextResponse.json({ success: true, purchase }, { status: 201 });
  } catch (error) {
    console.error("Purchase create error:", error);
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
  }
}
