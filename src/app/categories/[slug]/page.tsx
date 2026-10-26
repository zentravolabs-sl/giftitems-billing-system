import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";
import { ProductCard } from "@/components/product-card";
import { CartProvider } from "@/lib/cart-context";
import { ArrowLeft } from "lucide-react";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isActive: true, showOnWebsite: true },
        include: {
          category: true,
          images: { orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }] },
        },
      },
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
        <WebsiteHeader />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
          {/* Breadcrumb / Back button */}
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-xs text-[#756C6A] hover:text-[#B85D4D] font-medium mb-6 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </Link>

          {/* Category Banner */}
          <div className="rounded-3xl bg-white border border-[#EAE5DD] p-8 mb-10 flex flex-col md:flex-row items-center gap-8 shadow-xs">
            <div className="flex-1 space-y-3">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF5EF] text-[#B85D4D] border border-[#E8998D]/40">
                Collection
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1817]">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-xs sm:text-sm text-[#5C5452] leading-relaxed max-w-xl">
                  {category.description}
                </p>
              )}
              <p className="text-xs font-semibold text-[#8C827E] pt-1">
                {category.products.length} artisanal pieces available
              </p>
            </div>

            {category.imageUrl && (
              <div className="w-full md:w-64 aspect-4/3 rounded-2xl overflow-hidden bg-[#FAF5EF] border border-[#EAE5DD] flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Products Grid */}
          {category.products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {category.products.map((p) => (
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
          ) : (
            <div className="py-20 text-center text-[#8C827E] bg-white rounded-3xl border border-[#EAE5DD]">
              <p className="text-sm">No items in this category currently.</p>
            </div>
          )}
        </div>

        <WebsiteFooter />
      </div>
    </CartProvider>
  );
}
