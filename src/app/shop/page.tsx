import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";
import { ProductCard } from "@/components/product-card";
import { CartProvider } from "@/lib/cart-context";
import { SlidersHorizontal, Sparkles } from "lucide-react";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>;
}) {
  const { category, search, sort } = await searchParams;

  const categories = await prisma.category.findMany({
    where: { isActive: true, showOnWebsite: true },
    orderBy: { displayOrder: "asc" },
  });

  const where: any = {
    isActive: true,
    showOnWebsite: true,
  };

  if (category) {
    where.category = { slug: category };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price-asc") orderBy = { sellingPrice: "asc" };
  if (sort === "price-desc") orderBy = { sellingPrice: "desc" };
  if (sort === "featured") orderBy = { isFeatured: "desc" };

  const products = await prisma.product.findMany({
    where,
    orderBy,
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
          {/* Header Banner */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1817]">
              The Boutique Collection
            </h1>
            <p className="text-xs sm:text-sm text-[#756C6A] mt-1">
              Explore hand-selected artisanal keepsakes, scented candles, and luxury hampers
            </p>
          </div>

          {/* Filters & Search Row */}
          <div className="mb-8 p-4 rounded-2xl bg-white border border-[#EAE5DD] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none pb-2 md:pb-0">
              <Link
                href="/shop"
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  !category
                    ? "bg-[#B85D4D] text-white shadow-2xs"
                    : "bg-[#FAF8F5] text-[#5C5452] hover:bg-[#F0EBE4]"
                }`}
              >
                All Gifts ({products.length})
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/shop?category=${c.slug}`}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    category === c.slug
                      ? "bg-[#B85D4D] text-white shadow-2xs"
                      : "bg-[#FAF8F5] text-[#5C5452] hover:bg-[#F0EBE4]"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>

            {/* Sort Dropdown & Item Count */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <span className="text-xs text-[#756C6A] hidden sm:inline">
                Showing {products.length} items
              </span>
              <div className="flex items-center gap-1 text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#8C827E]" />
                <span className="text-[#756C6A]">Sort:</span>
                <Link
                  href={`/shop?${category ? `category=${category}&` : ""}sort=price-asc`}
                  className={`px-2 py-1 rounded-lg ${sort === "price-asc" ? "font-bold text-[#B85D4D]" : "text-[#5C5452]"}`}
                >
                  Price: Low
                </Link>
                <Link
                  href={`/shop?${category ? `category=${category}&` : ""}sort=price-desc`}
                  className={`px-2 py-1 rounded-lg ${sort === "price-desc" ? "font-bold text-[#B85D4D]" : "text-[#5C5452]"}`}
                >
                  Price: High
                </Link>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p) => (
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
            <div className="py-24 text-center text-[#8C827E] bg-white rounded-3xl border border-[#EAE5DD]">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-[#B85D4D] opacity-40" />
              <h3 className="font-serif font-bold text-lg text-[#1A1817]">No Gift Items Found</h3>
              <p className="text-xs text-[#756C6A] mt-1 max-w-sm mx-auto">
                No products match this category filter. Try clearing filters to view our full collection.
              </p>
              <div className="mt-4">
                <Link
                  href="/shop"
                  className="px-5 py-2.5 rounded-xl bg-[#B85D4D] text-white text-xs font-semibold"
                >
                  View All Products
                </Link>
              </div>
            </div>
          )}
        </div>

        <WebsiteFooter />
      </div>
    </CartProvider>
  );
}
