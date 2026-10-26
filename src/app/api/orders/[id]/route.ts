import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { Role, OrderStatus, StockMovementType, PaymentStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.websiteOrder.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: {
          include: {
            product: {
              include: { images: { take: 1 } },
            },
          },
        },
        customer: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Order fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, [Role.ADMIN, Role.INVENTORY_STAFF])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, paymentStatus, trackingNumber } = body;

    const currentOrder = await prisma.websiteOrder.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: { items: true },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Transaction to update order status and restore inventory if cancelled
    const updated = await prisma.$transaction(async (tx) => {
      // If moving to CANCELLED or RETURNED from an active state, restock items
      if (
        (status === "CANCELLED" || status === "RETURNED") &&
        currentOrder.status !== "CANCELLED" &&
        currentOrder.status !== "RETURNED"
      ) {
        for (const it of currentOrder.items) {
          const product = await tx.product.findUniqueOrThrow({
            where: { id: it.productId },
          });

          const currentStock = Number(product.stockQuantity);
          const newStock = currentStock + Number(it.quantity);

          await tx.product.update({
            where: { id: it.productId },
            data: { stockQuantity: newStock },
          });

          await tx.inventoryMovement.create({
            data: {
              productId: it.productId,
              movementType: StockMovementType.CUSTOMER_RETURN,
              quantityChange: Number(it.quantity),
              previousStock: currentStock,
              newStock,
              unitCost: product.buyingCost,
              referenceDocument: currentOrder.orderNumber,
              notes: `Order ${status.toLowerCase()}: restored to inventory`,
              createdById: user.userId,
            },
          });
        }
      }

      return tx.websiteOrder.update({
        where: { id: currentOrder.id },
        data: {
          status: status as OrderStatus | undefined,
          paymentStatus: paymentStatus as PaymentStatus | undefined,
          trackingNumber: trackingNumber !== undefined ? trackingNumber : undefined,
        },
        include: { items: true, customer: true },
      });
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error("Order status update error:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
