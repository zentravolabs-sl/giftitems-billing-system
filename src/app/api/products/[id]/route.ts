import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { Role, DiscountType } from "@prisma/client";
import { z } from "zod";

const productUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  sku: z.string().min(2).optional(),
  barcode: z.string().nullable().optional(),
  categoryId: z.string().optional(),
  description: z.string().nullable().optional(),
  buyingCost: z.number().min(0).optional(),
  sellingPrice: z.number().min(0.01).optional(),
  discountType: z.enum(["NONE", "PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().min(0).optional(),
  minStockLevel: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  showOnWebsite: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  weight: z.string().nullable().optional(),
  dimensions: z.string().nullable().optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        publicId: z.string().nullable().optional(),
        isPrimary: z.boolean().default(false),
        displayOrder: z.number().default(0),
      })
    )
    .optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { sku: id }],
      },
      include: {
        category: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }],
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product get error:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
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
    const result = productUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    // Check SKU collision
    if (data.sku) {
      const existingSku = await prisma.product.findFirst({
        where: { sku: data.sku, NOT: { id } },
      });
      if (existingSku) {
        return NextResponse.json({ error: `SKU "${data.sku}" is already in use by another item` }, { status: 409 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If images array is provided, replace product images
      if (data.images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (data.images.length > 0) {
          await tx.productImage.createMany({
            data: data.images.map((img, idx) => ({
              productId: id,
              url: img.url,
              publicId: img.publicId || null,
              isPrimary: img.isPrimary || idx === 0,
              displayOrder: img.displayOrder || idx + 1,
            })),
          });
        }
      }

      const { images: _ignored, ...productFields } = data;
      return tx.product.update({
        where: { id },
        data: {
          ...productFields,
          discountType: productFields.discountType as DiscountType | undefined,
        },
        include: {
          category: true,
          images: true,
        },
      });
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, [Role.ADMIN, Role.INVENTORY_STAFF])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Check if the product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const archiveOnly = searchParams.get("archive") === "true";

    if (archiveOnly) {
      const archived = await prisma.product.update({
        where: { id },
        data: { isActive: false, showOnWebsite: false },
      });
      return NextResponse.json({
        success: true,
        archived: true,
        message: `Product "${product.name}" was archived.`,
        product: archived,
      });
    }

    // Completely remove the product and related records in a safe transaction
    await prisma.$transaction(async (tx) => {
      await tx.inventoryMovement.deleteMany({ where: { productId: id } });
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.saleItem.deleteMany({ where: { productId: id } });
      await tx.orderItem.deleteMany({ where: { productId: id } });
      await tx.purchaseItem.deleteMany({ where: { productId: id } });
      await tx.returnItem.deleteMany({ where: { productId: id } });
      await tx.stockAdjustment.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: `Product "${product.name}" deleted successfully.` });
  } catch (error: any) {
    console.error("Product delete error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
