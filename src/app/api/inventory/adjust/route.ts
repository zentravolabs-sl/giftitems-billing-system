import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { Role, StockMovementType, AdjustmentStatus } from "@prisma/client";
import { z } from "zod";

const adjustSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  adjustedStock: z.number().min(0, "Stock cannot be negative"),
  reason: z.string().min(2, "Reason is required"),
  notes: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, [Role.ADMIN, Role.INVENTORY_STAFF])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const result = adjustSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 });
    }

    const { productId, adjustedStock, reason, notes } = result.data;

    const adjustment = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUniqueOrThrow({
        where: { id: productId },
      });

      const previousStock = Number(product.stockQuantity);
      const difference = adjustedStock - previousStock;
      const adjustmentNumber = `ADJ-${Date.now().toString(36).toUpperCase()}`;

      // Update product stock
      await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: adjustedStock },
      });

      // Record StockAdjustment
      const createdAdj = await tx.stockAdjustment.create({
        data: {
          adjustmentNumber,
          productId,
          previousStock,
          adjustedStock,
          difference,
          reason,
          notes: notes || null,
          status: AdjustmentStatus.APPROVED,
          createdById: user.userId,
          approvedById: user.userId,
        },
      });

      // Determine movement type
      let movementType: StockMovementType = StockMovementType.STOCK_ADJUSTMENT;
      if (reason.toLowerCase().includes("damage")) {
        movementType = StockMovementType.DAMAGED;
      }

      // Record InventoryMovement
      await tx.inventoryMovement.create({
        data: {
          productId,
          movementType,
          quantityChange: difference,
          previousStock,
          newStock: adjustedStock,
          unitCost: product.buyingCost,
          referenceDocument: adjustmentNumber,
          notes: `${reason} - ${notes || "Manual stock adjustment"}`,
          createdById: user.userId,
        },
      });

      return createdAdj;
    });

    return NextResponse.json({ success: true, adjustment }, { status: 201 });
  } catch (error) {
    console.error("Adjustment error:", error);
    return NextResponse.json({ error: "Failed to adjust stock" }, { status: 500 });
  }
}
