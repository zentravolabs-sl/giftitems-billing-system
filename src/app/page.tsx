import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";
import { ProductCard } from "@/components/product-card";
import { CartProvider } from "@/lib/cart-context";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Heart,
  Gift,
  Star,
  CheckCircle2,
} from "lucide-react";

export default async function HomePage() {
  const [content, categories, featuredProducts, newArrivals] = await Promise.all([
    prisma.websiteContent.findUnique({ where: { id: "default" } }),
    prisma.category.findMany({
      where: { isActive: true, showOnWebsite: true },
      orderBy: { displayOrder: "asc" },
      take: 6,
    }),
    prisma.product.findMany({
      where: { isActive: true, showOnWebsite: true, isFeatured: true },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        images: { orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }] },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true, showOnWebsite: true },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        images: { orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }] },
      },
    }),
  ]);

  const heroImage =
    content?.heroImageUrl ||
    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1400&auto=format&fit=crop";

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
        <WebsiteHeader />

        {/* 1. HERO PROMOTIONAL BANNER */}
        <section className="relative overflow-hidden bg-[#FAF5EF] border-b border-[#EAE5DD]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Narrative */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF5EF] border border-[#E8998D]/40 text-[#B85D4D] text-xs font-semibold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Art of Thoughtful Gifting</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1A1817] leading-[1.15]">
                {content?.heroTitle || "Artisanal Gifts for Life's Cherished Moments"}
              </h1>

              <p className="text-sm sm:text-base text-[#5C5452] max-w-xl leading-relaxed">
                {content?.heroSubtitle ||
                  "Discover hand-crafted gift hampers, bespoke jewellery, luxury candles, and personalized keepsakes curated with elegance."}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href={content?.heroButtonLink || "/shop"}
                  className="px-7 py-3.5 rounded-xl bg-[#B85D4D] hover:bg-[#A04E40] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.99]"
                >
                  <span>{content?.heroButtonText || "Explore Collections"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/offers"
                  className="px-7 py-3.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#1A1817] border border-[#E0D9D1] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xs transition"
                >
                  <span>Special Offers</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 border-t border-[#EAE5DD] grid grid-cols-3 gap-4 text-left">
                <div>
                  <span className="font-serif font-bold text-lg text-[#1A1817] block">100%</span>
                  <span className="text-[11px] text-[#756C6A]">Master Artisanal</span>
                </div>
                <div>
                  <span className="font-serif font-bold text-lg text-[#1A1817] block">Same Day</span>
                  <span className="text-[11px] text-[#756C6A]">Courier Delivery</span>
                </div>
                <div>
                  <span className="font-serif font-bold text-lg text-[#1A1817] block">Complimentary</span>
                  <span className="text-[11px] text-[#756C6A]">Handwritten Note</span>
                </div>
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-4/3 border-4 border-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroImage}
                  alt="Zentravo Luxury Gifts"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-5 -left-5 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#EAE5DD] shadow-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF5EF] text-[#B85D4D] flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-serif font-bold text-xs text-[#1A1817] block">
                    Curated Keepsake Trunks
                  </span>
                  <span className="text-[10px] text-[#756C6A]">Finished with satin ribbon</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. VALUE PROPOSITIONS STRIP */}
        <section className="bg-white py-10 border-b border-[#EAE5DD]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF5EF] text-[#B85D4D] flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-xs text-[#1A1817]">Signature Packaging</h4>
                  <p className="text-[11px] text-[#756C6A]">Embossed gift boxes & silk tassels</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF5EF] text-[#B85D4D] flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-xs text-[#1A1817]">Calligraphy Gift Card</h4>
                  <p className="text-[11px] text-[#756C6A]">Personalized message included free</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF5EF] text-[#B85D4D] flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-xs text-[#1A1817]">Concierge Express</h4>
                  <p className="text-[11px] text-[#756C6A]">White-glove climate delivery</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF5EF] text-[#B85D4D] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-xs text-[#1A1817]">100% Happiness Promise</h4>
                  <p className="text-[11px] text-[#756C6A]">Hassle-free 14-day exchange</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CATEGORIES SHOWCASE */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-semibold text-[#B85D4D] uppercase tracking-wider block mb-1">
                Curated Occasions
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817]">
                Shop by Gift Collection
              </h2>
            </div>
            <Link
              href="/categories"
              className="text-xs font-bold text-[#B85D4D] hover:underline flex items-center gap-1"
            >
              <span>View All Categories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-[#EAE5DD] hover:border-[#B85D4D] hover:shadow-md transition"
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#FAF5EF] mb-3 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.imageUrl || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=300&auto=format&fit=crop"}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-serif font-bold text-xs text-[#1A1817] group-hover:text-[#B85D4D] transition line-clamp-1">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. CURATED BEST SELLERS (DATABASE-BACKED) */}
        {featuredProducts.length > 0 && (
          <section className="py-12 bg-white border-y border-[#EAE5DD]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                  <span className="text-xs font-semibold text-[#B85D4D] uppercase tracking-wider block mb-1">
                    Signature Highlights
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817]">
                    Most Loved Gift Keepsakes
                  </h2>
                </div>
                <Link
                  href="/shop"
                  className="text-xs font-bold text-[#B85D4D] hover:underline flex items-center gap-1"
                >
                  <span>Explore Entire Catalogue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((p) => (
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
          </section>
        )}

        {/* 5. NEW ARRIVALS GRID */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-semibold text-[#B85D4D] uppercase tracking-wider block mb-1">
                Just Arrived
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817]">
                New Boutique Treasures
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold text-[#B85D4D] hover:underline flex items-center gap-1"
            >
              <span>View All Items</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {newArrivals.map((p) => (
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
        </section>

        {/* 6. PROMOTIONAL CALLOUT BANNER */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="rounded-3xl bg-gradient-to-r from-[#2B2625] to-[#1A1817] text-white p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
            <div className="space-y-4 max-w-lg z-10">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B85D4D] text-white">
                VIP Concierge Gifting
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
                Planning a Wedding or Corporate Celebration?
              </h3>
              <p className="text-xs text-[#D4CDC7] leading-relaxed">
                Our bespoke concierge service crafts customized hampers, wax seals, monogrammed leather tags, and curated gourmet pairings for milestones.
              </p>
              <div className="pt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#1A1817] font-bold text-xs uppercase tracking-wider hover:bg-[#FAF8F5] transition shadow-xs"
                >
                  <span>Inquire with Concierge</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="relative w-full md:w-80 aspect-square rounded-2xl overflow-hidden border-2 border-white/20 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=600&auto=format&fit=crop"
                alt="Bespoke Concierge"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        <WebsiteFooter />
      </div>
    </CartProvider>
  );
}
