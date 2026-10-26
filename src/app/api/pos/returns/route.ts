import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ReturnType, ReturnStatus, ItemCondition, StockMovementType } from "@prisma/client";
import { z } from "zod";

const returnItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
  refundAmount: z.number().min(0),
  condition: z.enum(["RESTOCKABLE", "DAMAGED"]).default("RESTOCKABLE"),
});

const returnSchema = z.object({
  originalSaleId: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  reason: z.string().min(2, "Reason is required"),
  items: z.array(returnItemSchema).min(1, "At least one item is required for return"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const result = returnSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 });
    }

    const { originalSaleId, customerId, reason, items } = result.data;
    const returnNumber = `RET-${Date.now().toString(36).toUpperCase()}`;
    const totalRefundAmount = items.reduce((acc, it) => acc + it.refundAmount, 0);

    const returnRecord = await prisma.$transaction(async (tx) => {
      const createdReturn = await tx.return.create({
        data: {
          returnNumber,
          returnType: ReturnType.CUSTOMER_RETURN,
          originalSaleId: originalSaleId || null,
          customerId: customerId || null,
          totalRefundAmount,
          status: ReturnStatus.APPROVED,
          reason,
          approvedById: user?.userId || null,
          items: {
            create: items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              refundAmount: it.refundAmount,
              condition: it.condition as ItemCondition,
              isRestocked: it.condition === "RESTOCKABLE",
            })),
          },
        },
        include: { items: true },
      });

      // Restore inventory for restockable items
      for (const it of items) {
        if (it.condition === "RESTOCKABLE") {
          const product = await tx.product.findUniqueOrThrow({
            where: { id: it.productId },
          });

          const currentStock = Number(product.stockQuantity);
          const newStock = currentStock + it.quantity;

          await tx.product.update({
            where: { id: it.productId },
            data: { stockQuantity: newStock },
          });

          await tx.inventoryMovement.create({
            data: {
              productId: it.productId,
              movementType: StockMovementType.CUSTOMER_RETURN,
              quantityChange: it.quantity,
              previousStock: currentStock,
              newStock,
              unitCost: product.buyingCost,
              referenceDocument: returnNumber,
              notes: `Customer return restocked: ${reason}`,
              createdById: user?.userId || null,
            },
          });
        }
      }

      return createdReturn;
    });

    return NextResponse.json({ success: true, returnRecord }, { status: 201 });
  } catch (error) {
    console.error("Return error:", error);
    return NextResponse.json({ error: "Failed to process return" }, { status: 500 });
  }
}
