import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { StockMovementType, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
});

const createOrderSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email required"),
  customerPhone: z.string().min(5, "Phone number is required"),
  shippingAddress: z.string().min(5, "Shipping address is required"),
  shippingCity: z.string().min(2, "City is required"),
  shippingPostalCode: z.string().optional(),
  orderNotes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
  deliveryFee: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER"]).default("CASH"),
  couponCode: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const email = searchParams.get("email");

    const where: any = {};
    if (status) where.status = status as OrderStatus;
    if (email) where.customerEmail = email;

    const orders = await prisma.websiteOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, images: { take: 1 } },
            },
          },
        },
        customer: true,
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    // Verify stock and calculate subtotal
    let subtotal = 0;
    const computedItems: Array<{
      productId: string;
      quantity: number;
      unitCost: number;
      unitPrice: number;
      lineTotal: number;
      currentStock: number;
    }> = [];

    for (const it of data.items) {
      const prod = await prisma.product.findUnique({
        where: { id: it.productId },
      });

      if (!prod || !prod.isActive) {
        return NextResponse.json({ error: `Product unavailable: ${it.productId}` }, { status: 400 });
      }

      const currentStock = Number(prod.stockQuantity);
      if (currentStock < it.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${prod.name}". Only ${currentStock} available.` },
          { status: 400 }
        );
      }

      const lineTotal = it.quantity * it.unitPrice;
      subtotal += lineTotal;

      computedItems.push({
        productId: it.productId,
        quantity: it.quantity,
        unitCost: Number(prod.buyingCost),
        unitPrice: it.unitPrice,
        lineTotal,
        currentStock,
      });
    }

    const grandTotal = Math.max(0, subtotal - data.discountAmount + data.deliveryFee);
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // Database transaction: create order, decrement stock, log inventory movements
    const order = await prisma.$transaction(async (tx) => {
      // Find or create customer
      let customer = await tx.customer.findFirst({
        where: { email: data.customerEmail },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: data.customerName,
            email: data.customerEmail,
            phone: data.customerPhone,
            address: data.shippingAddress,
            city: data.shippingCity,
            postalCode: data.shippingPostalCode || null,
          },
        });
      }

      const createdOrder = await tx.websiteOrder.create({
        data: {
          orderNumber,
          customerId: customer.id,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          shippingAddress: data.shippingAddress,
          shippingCity: data.shippingCity,
          shippingPostalCode: data.shippingPostalCode || null,
          orderNotes: data.orderNotes || null,
          status: OrderStatus.PENDING,
          subtotal,
          deliveryFee: data.deliveryFee,
          discountAmount: data.discountAmount,
          grandTotal,
          paymentMethod: data.paymentMethod as PaymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          items: {
            create: computedItems.map((ci) => ({
              productId: ci.productId,
              quantity: ci.quantity,
              unitCost: ci.unitCost,
              unitPrice: ci.unitPrice,
              lineTotal: ci.lineTotal,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });

      // Decrement stock and record WEB_SALE inventory movements
      for (const ci of computedItems) {
        const newStock = ci.currentStock - ci.quantity;

        await tx.product.update({
          where: { id: ci.productId },
          data: { stockQuantity: newStock },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: ci.productId,
            movementType: StockMovementType.WEB_SALE,
            quantityChange: -ci.quantity,
            previousStock: ci.currentStock,
            newStock,
            unitCost: ci.unitCost,
            referenceDocument: orderNumber,
            notes: `Online Order Checkout ${orderNumber}`,
          },
        });
      }

      // If coupon used, increment coupon usage
      if (data.couponCode) {
        await tx.discountCoupon.updateMany({
          where: { code: data.couponCode.toUpperCase() },
          data: { usageCount: { increment: 1 } },
        });
      }

      return createdOrder;
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
