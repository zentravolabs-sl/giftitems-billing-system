import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";
import { ProductCard } from "@/components/product-card";
import { CartProvider } from "@/lib/cart-context";
import { Sparkles, Tag, ArrowRight } from "lucide-react";

export default async function OffersPage() {
  const [discountedProducts, coupons] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        showOnWebsite: true,
        discountType: { not: "NONE" },
      },
      include: {
        category: true,
        images: { orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }] },
      },
    }),
    prisma.discountCoupon.findMany({
      where: { isActive: true },
    }),
  ]);

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
        <WebsiteHeader />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF5EF] text-[#B85D4D] border border-[#E8998D]/40 inline-flex items-center gap-1.5 mb-2">
              <Tag className="w-3.5 h-3.5" />
              Limited Promotional Privileges
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1817]">
              Special Offers & Keepsake Baskets
            </h1>
            <p className="text-xs sm:text-sm text-[#756C6A] mt-2">
              Privilege pricing on hand-selected gift arrangements and complimentary luxury packaging
            </p>
          </div>

          {/* Active Promo Coupon Cards */}
          {coupons.length > 0 && (
            <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-white border border-[#E8998D]/40 shadow-xs flex items-center justify-between gap-4 relative overflow-hidden"
                >
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF5EF] text-[#B85D4D] font-mono">
                      CODE: {c.code}
                    </span>
                    <h3 className="font-serif font-bold text-sm text-[#1A1817]">
                      {c.description || `${c.value}% Off Your Order`}
                    </h3>
                    <p className="text-[11px] text-[#756C6A]">
                      Minimum purchase of ${Number(c.minPurchase).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-serif font-bold text-[#B85D4D]">
                      {c.discountType === "PERCENTAGE" ? `${c.value}%` : `$${c.value}`}
                    </span>
                    <span className="text-[10px] text-[#8C827E] block">OFF</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Products Grid */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg text-[#1A1817]">
              Discounted Gift Selections ({discountedProducts.length})
            </h2>
          </div>

          {discountedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {discountedProducts.map((p) => (
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
              <p className="text-sm">No promotional items at this moment. Check back soon!</p>
            </div>
          )}
        </div>

        <WebsiteFooter />
      </div>
    </CartProvider>
  );
}
