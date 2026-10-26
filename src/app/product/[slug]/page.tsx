import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";
import { ProductCard } from "@/components/product-card";
import { CartProvider } from "@/lib/cart-context";
import { ProductDetailsView } from "./product-details-view";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }] },
    },
  });

  if (!product || !product.isActive || !product.showOnWebsite) {
    notFound();
  }

  // Related products in same category
  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      isActive: true,
      showOnWebsite: true,
      NOT: { id: product.id },
    },
    take: 4,
    include: {
      category: true,
      images: { orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }] },
    },
  });

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
        <WebsiteHeader />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#756C6A] mb-8">
            <Link href="/" className="hover:text-[#B85D4D]">
              Home
            </Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-[#B85D4D]">
              Shop
            </Link>
            <span>/</span>
            <Link href={`/categories/${product.category.slug}`} className="hover:text-[#B85D4D]">
              {product.category.name}
            </Link>
            <span>/</span>
            <span className="text-[#1A1817] font-semibold truncate max-w-xs">{product.name}</span>
          </nav>

          {/* Interactive Client View (Gallery + Add To Cart) */}
          <ProductDetailsView
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              sku: product.sku,
              barcode: product.barcode,
              categoryId: product.categoryId,
              description: product.description,
              buyingCost: Number(product.buyingCost),
              sellingPrice: Number(product.sellingPrice),
              discountType: product.discountType,
              discountValue: Number(product.discountValue),
              stockQuantity: Number(product.stockQuantity),
              minStockLevel: Number(product.minStockLevel),
              isActive: product.isActive,
              showOnWebsite: product.showOnWebsite,
              isFeatured: product.isFeatured,
              tags: product.tags,
              weight: product.weight,
              dimensions: product.dimensions,
              category: {
                id: product.category.id,
                name: product.category.name,
                slug: product.category.slug,
                description: product.category.description,
                imageUrl: product.category.imageUrl,
              },
              images: product.images.map((img) => ({
                id: img.id,
                url: img.url,
                publicId: img.publicId,
                isPrimary: img.isPrimary,
                displayOrder: img.displayOrder,
              })),
            }}
          />

          {/* Related Products */}
          {related.length > 0 && (
            <div className="mt-20 pt-12 border-t border-[#EAE5DD]">
              <h2 className="font-serif font-bold text-2xl text-[#1A1817] mb-6">
                You May Also Adore
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {related.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={{
                      id: p.id,
                      name: p.name,
                      slug: p.slug,
                      sku: p.sku,
                      sellingPrice: Number(p.sellingPrice),
                      discountType: p.discountType,
                      discountValue: Number(p.discountValue),
                      stockQuantity: Number(p.stockQuantity),
                      isFeatured: p.isFeatured,
                      category: p.category,
                      images: p.images,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <WebsiteFooter />
      </div>
    </CartProvider>
  );
}
