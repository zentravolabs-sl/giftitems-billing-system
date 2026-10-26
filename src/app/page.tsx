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
  Leaf,
  Home,
  Flower2,
  Lamp,
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
    "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=1400&auto=format&fit=crop";

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
        <WebsiteHeader />

        {/* 1. HERO BANNER */}
        <section className="relative overflow-hidden bg-[#FAF6F0] border-b border-[#E5DFD5]">
          {/* Soft ambient glows */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -left-40 w-150 h-150 rounded-full bg-[#C5A059]/5 blur-3xl" />
            <div className="absolute -bottom-32 -right-24 w-125 h-125 rounded-full bg-[#5F6340]/5 blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

                {/* Left Brand Editorial */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Main H1 Headline */}
                  <div>
                    <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#24211D] tracking-tight leading-[1.15]">
                      Handcrafted Wooden <br/> Lights,
                      <span className="text-[#8F6B2A]">Artificial Flowers</span> <br/>
                      &amp; Home Décor
                    </h1>
                    <div className="w-16 h-0.5 bg-[#8F6B2A]/50 mt-4 rounded-full" />
                  </div>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-[#4A443F] leading-relaxed max-w-xl">
                    Oak Bloom is a thoughtfully curated collection of handcrafted wooden lights,
                    artificial flowers, and elegant home décor pieces – designed to bring warmth,
                    beauty, and timeless charm into your space.
                  </p>

                  {/* Signature Cursive Motto */}
                  <p className="font-serif italic text-xl sm:text-2xl text-[#5F6340] tracking-wide">
                    Glow Naturally, Bloom Beautifully. ♡
                  </p>

                  {/* CTA Button */}
                  <div>
                    <Link
                      href={content?.heroButtonLink || "/shop"}
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#8F6B2A] hover:bg-[#755518] text-white text-xs font-bold uppercase tracking-wider shadow-md transition active:scale-[0.99]"
                    >
                      <span>{content?.heroButtonText || "Explore Collections"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* 4 Feature Badges */}
                  <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-[#E8E2D8] text-center shadow-2xs">
                      <div className="w-10 h-10 rounded-full bg-[#5F6340] text-white flex items-center justify-center mx-auto mb-2">
                        <Leaf className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#24211D] block">Natural Materials</span>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-[#E8E2D8] text-center shadow-2xs">
                      <div className="w-10 h-10 rounded-full bg-[#5F6340] text-white flex items-center justify-center mx-auto mb-2">
                        <Heart className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#24211D] block">Handcrafted with Care</span>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-[#E8E2D8] text-center shadow-2xs">
                      <div className="w-10 h-10 rounded-full bg-[#5F6340] text-white flex items-center justify-center mx-auto mb-2">
                        <Home className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#24211D] block">Made to Elevate</span>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-[#E8E2D8] text-center shadow-2xs">
                      <div className="w-10 h-10 rounded-full bg-[#5F6340] text-white flex items-center justify-center mx-auto mb-2">
                        <Flower2 className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#24211D] block">Timeless Beauty</span>
                    </div>
                  </div>
                </div>

                {/* Right Hero Image */}
                <div className="lg:col-span-5 relative">
                  <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/hero.webp"
                      alt="Oak Bloom Handcrafted Wooden Lights and Home Décor"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Floating Badge */}
                  <div className="absolute -bottom-4 -left-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#EAE5DD] shadow-lg flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#5F6340]/10 text-[#5F6340] flex items-center justify-center">
                      <Lamp className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="font-serif font-bold text-[11px] text-[#1A1817] block">Curved Oak Slatted Pendants</span>
                      <span className="text-[10px] text-[#756C6A]">Warm architectural ambient glow</span>
                    </div>
                  </div>
                </div>

            </div>
          </div>
        </section>

        {/* 2. OUR PROMISE RIBBON */}
        <section className="bg-[#1A1817] py-10 border-b border-[#2E2B29]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#8F6B2A]/20 border border-[#8F6B2A]/30 text-[#C5A059] flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-white mb-0.5">
                    Free Delivery
                  </h4>
                  <p className="text-[12px] text-[#9E9690] leading-relaxed">On all orders — delivered safely to your door</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#8F6B2A]/20 border border-[#8F6B2A]/30 text-[#C5A059] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-white mb-0.5">
                    Quality Assured
                  </h4>
                  <p className="text-[12px] text-[#9E9690] leading-relaxed">Every piece inspected before it leaves our studio</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#8F6B2A]/20 border border-[#8F6B2A]/30 text-[#C5A059] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-white mb-0.5">
                    Artisan Packaging
                  </h4>
                  <p className="text-[12px] text-[#9E9690] leading-relaxed">Cushioned, eco-friendly wrapping on every order</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#8F6B2A]/20 border border-[#8F6B2A]/30 text-[#C5A059] flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-white mb-0.5">
                    Locally Handmade
                  </h4>
                  <p className="text-[12px] text-[#9E9690] leading-relaxed">Supporting local artisans — made with love & care</p>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* 4. SHOP BY COLLECTION */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-semibold text-[#8F6B2A] uppercase tracking-wider block mb-1">
                Curated Categories
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817]">
                Shop by Collection
              </h2>
            </div>
            <Link
              href="/categories"
              className="text-xs font-bold text-[#8F6B2A] hover:underline flex items-center gap-1"
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
                className="group flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-[#EAE5DD] hover:border-[#8F6B2A] hover:shadow-md transition"
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#FAF5EF] mb-3 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.imageUrl || "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=300&auto=format&fit=crop"}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-serif font-bold text-xs text-[#1A1817] group-hover:text-[#8F6B2A] transition line-clamp-1">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>

        {/* 5. SIGNATURE HIGHLIGHTS (FEATURED PRODUCTS) */}
        {featuredProducts.length > 0 && (
          <section className="py-12 bg-white border-y border-[#EAE5DD]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                  <span className="text-xs font-semibold text-[#8F6B2A] uppercase tracking-wider block mb-1">
                    Signature Artisanal Pieces
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817]">
                    Most Loved Wooden Lights & Décor
                  </h2>
                </div>
                <Link
                  href="/shop"
                  className="text-xs font-bold text-[#8F6B2A] hover:underline flex items-center gap-1"
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

        {/* 6. NEW ARRIVALS GRID */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-semibold text-[#8F6B2A] uppercase tracking-wider block mb-1">
                Fresh Drops
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817]">
                New Lights, Flowers & Accents
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold text-[#8F6B2A] hover:underline flex items-center gap-1"
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

        {/* 7. CUSTOM INTERIOR & LIGHTING BANNER */}
        <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="rounded-3xl bg-gradient-to-r from-[#24211D] to-[#141211] text-white p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
            <div className="space-y-4 max-w-lg z-10">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#5F6340] text-white">
                Bespoke Interior & Lighting Studio
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
                Looking for Custom Wooden Lighting or Styling Advice?
              </h3>
              <p className="text-xs text-[#D4CDC7] leading-relaxed">
                Whether you need tailored pendant cord lengths, wholesale floral installations, or curated home décor packages for residential and commercial spaces, our studio is here to assist.
              </p>
              <div className="pt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#1A1817] font-bold text-xs uppercase tracking-wider hover:bg-[#FAF8F5] transition shadow-xs"
                >
                  <span>Inquire with Our Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="relative w-full md:w-80 aspect-square rounded-2xl overflow-hidden border-2 border-white/20 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1536626071326-72cd66f4b28f?q=80&w=600&auto=format&fit=crop"
                alt="Bespoke Wooden Lighting Studio"
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
