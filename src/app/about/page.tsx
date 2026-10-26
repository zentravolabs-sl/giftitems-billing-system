import { prisma } from "@/lib/prisma";
import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";
import { CartProvider } from "@/lib/cart-context";
import { Leaf, Heart, Home, Flower2, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function AboutPage() {
  const content = await prisma.websiteContent.findUnique({
    where: { id: "default" },
  });

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
        <WebsiteHeader />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-1 space-y-12">
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EFE9DF] text-[#4B5320] border border-[#C5A059]/40 inline-flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5" />
              Handmade & Local
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1A1817]">
              {content?.aboutUsTitle || "What is OAK BLOOM?"}
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#8F6B2A] font-semibold font-sans">
              LIGHTS | FLOWERS | HOME DÉCOR
            </p>
          </div>

          {/* Hero Story Banner Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#FAF6F0] p-6 sm:p-10 rounded-3xl border border-[#E5DFD5] shadow-xs">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpg" alt="Oak Bloom" className="w-9 h-9 rounded-full object-cover border border-[#C5A059]/40" />
                <span className="font-serif font-bold text-xl tracking-wider text-[#1A1817]">
                  OAK BLOOM
                </span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817] leading-snug">
                Designed to bring warmth, beauty, and timeless charm into your space.
              </h2>

              <p className="text-sm text-[#4A443F] leading-relaxed">
                Oak Bloom is a thoughtfully curated collection of handcrafted wooden lights,
                artificial flowers, and elegant home décor pieces – designed to bring warmth,
                beauty, and timeless charm into your space.
              </p>

              <p className="font-serif italic text-2xl text-[#5F6340]">
                Glow Naturally, Bloom Beautifully. ♡
              </p>

              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#635D56] uppercase tracking-wider">
                <Leaf className="w-4 h-4 text-[#5F6340]" />
                <span>Thank you for supporting handmade & local ♥</span>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/about-oak-bloom.jpg"
                alt="Oak Bloom Brand Story & Aesthetic"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* The 4 Core Brand Pillars */}
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#EAE5DD] shadow-xs space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h3 className="font-serif font-bold text-2xl text-[#1A1817]">
                The Four Pillars of Oak Bloom
              </h3>
              <p className="text-xs text-[#756C6A]">
                Our guiding design philosophy for every light we sculpt, every bloom we arrange, and every accent we craft.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 rounded-2xl bg-[#FAF8F5] border border-[#F0EBE4] space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#5F6340] text-white flex items-center justify-center mx-auto shadow-xs">
                  <Leaf className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-sm text-[#1A1817] uppercase tracking-wider">
                  Natural Materials
                </h4>
                <p className="text-xs text-[#756C6A] leading-relaxed">
                  We honor the organic grain of natural oak, birch, and earth-toned ceramic vessels, creating timeless pieces grounded in nature.
                </p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-[#FAF8F5] border border-[#F0EBE4] space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#5F6340] text-white flex items-center justify-center mx-auto shadow-xs">
                  <Heart className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-sm text-[#1A1817] uppercase tracking-wider">
                  Handcrafted with Care
                </h4>
                <p className="text-xs text-[#756C6A] leading-relaxed">
                  Every wooden rib is sanded, assembled, and finished by hand. Every faux floral bouquet is styled with artistic intention.
                </p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-[#FAF8F5] border border-[#F0EBE4] space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#5F6340] text-white flex items-center justify-center mx-auto shadow-xs">
                  <Home className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-sm text-[#1A1817] uppercase tracking-wider">
                  Made to Elevate
                </h4>
                <p className="text-xs text-[#756C6A] leading-relaxed">
                  Infusing living rooms, dining nooks, and cozy corners with soothing ambient light and perpetual botanical charm.
                </p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-[#FAF8F5] border border-[#F0EBE4] space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#5F6340] text-white flex items-center justify-center mx-auto shadow-xs">
                  <Flower2 className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-sm text-[#1A1817] uppercase tracking-wider">
                  Timeless Beauty
                </h4>
                <p className="text-xs text-[#756C6A] leading-relaxed">
                  Designed beyond fleeting trends. Everlasting blooms that never fade and timber lighting that ages gracefully with your home.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-[#F0EBE4] flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-[#756C6A]">
                Explore our full line of wooden pendants, artificial florals, and home accents.
              </span>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#8F6B2A] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#755518] transition shadow-xs"
              >
                <span>Shop All Collections</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <WebsiteFooter />
      </div>
    </CartProvider>
  );
}
