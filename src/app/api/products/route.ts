import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { Role, StockMovementType, DiscountType } from "@prisma/client";
import { z } from "zod";

const productCreateSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  slug: z.string().optional(),
  sku: z.string().min(2, "SKU is required"),
  barcode: z.string().nullable().optional(),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().nullable().optional(),
  buyingCost: z.number().min(0, "Buying cost must be non-negative"),
  sellingPrice: z.number().min(0.01, "Selling price must be greater than zero"),
  discountType: z.enum(["NONE", "PERCENTAGE", "FIXED"]).default("NONE"),
  discountValue: z.number().min(0).default(0),
  stockQuantity: z.number().min(0).default(0),
  minStockLevel: z.number().min(0).default(5),
  isActive: z.boolean().default(true),
  showOnWebsite: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category");
    const isFeatured = searchParams.get("featured") === "true";
    const lowStock = searchParams.get("lowStock") === "true";
    const outOfStock = searchParams.get("outOfStock") === "true";
    const websiteOnly = searchParams.get("websiteOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (websiteOnly) {
      where.isActive = true;
      where.showOnWebsite = true;
    }

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (isFeatured) {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }],
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Apply low stock filter if requested
    let filteredProducts = products;
    if (lowStock) {
      filteredProducts = products.filter(
        (p) => Number(p.stockQuantity) <= Number(p.minStockLevel) && Number(p.stockQuantity) > 0
      );
    } else if (outOfStock) {
      filteredProducts = products.filter((p) => Number(p.stockQuantity) <= 0);
    }

    return NextResponse.json({
      products: filteredProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, [Role.ADMIN, Role.INVENTORY_STAFF])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const result = productCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 });
    }

    const data = result.data;
    const slug = data.slug || `${generateSlug(data.name)}-${Date.now().toString(36)}`;

    // Verify SKU uniqueness
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });
    if (existingSku) {
      return NextResponse.json({ error: `SKU "${data.sku}" is already in use` }, { status: 409 });
    }

    // Verify barcode uniqueness if provided
    if (data.barcode) {
      const existingBarcode = await prisma.product.findUnique({
        where: { barcode: data.barcode },
      });
      if (existingBarcode) {
        return NextResponse.json({ error: `Barcode "${data.barcode}" is already in use` }, { status: 409 });
      }
    }

    // Transaction to create product + images + opening stock movement
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: data.name,
          slug,
          sku: data.sku,
          barcode: data.barcode || null,
          categoryId: data.categoryId,
          description: data.description || null,
          buyingCost: data.buyingCost,
          sellingPrice: data.sellingPrice,
          discountType: data.discountType as DiscountType,
          discountValue: data.discountValue,
          stockQuantity: data.stockQuantity,
          minStockLevel: data.minStockLevel,
          isActive: data.isActive,
          showOnWebsite: data.showOnWebsite,
          isFeatured: data.isFeatured,
          weight: data.weight || null,
          dimensions: data.dimensions || null,
          images: data.images && data.images.length > 0
            ? {
                create: data.images.map((img, idx) => ({
                  url: img.url,
                  publicId: img.publicId || null,
                  isPrimary: img.isPrimary || idx === 0,
                  displayOrder: img.displayOrder || idx + 1,
                })),
              }
            : undefined,
        },
        include: {
          category: true,
          images: true,
        },
      });

      if (data.stockQuantity > 0) {
        await tx.inventoryMovement.create({
          data: {
            productId: created.id,
            movementType: StockMovementType.OPENING_STOCK,
            quantityChange: data.stockQuantity,
            previousStock: 0,
            newStock: data.stockQuantity,
            unitCost: data.buyingCost,
            referenceDocument: `INIT-${created.sku}`,
            notes: "Initial product stock upon creation",
            createdById: user.userId,
          },
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
