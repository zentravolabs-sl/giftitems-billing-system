import { prisma } from "@/lib/prisma";
import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";
import { CartProvider } from "@/lib/cart-context";
import { Sparkles, Heart, Gift, Award } from "lucide-react";

export default async function AboutPage() {
  const content = await prisma.websiteContent.findUnique({
    where: { id: "default" },
  });

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
        <WebsiteHeader />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-1 space-y-12">
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF5EF] text-[#B85D4D] border border-[#E8998D]/40 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Our Heritage & Craft
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1A1817]">
              {content?.aboutUsTitle || "The Art of Thoughtful Gifting"}
            </h1>
          </div>

          {/* Hero Story Banner */}
          {content?.aboutUsImageUrl && (
            <div className="aspect-16/9 rounded-3xl overflow-hidden shadow-lg border border-[#EAE5DD]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.aboutUsImageUrl}
                alt="Zentravo Workshop"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Narrative Content */}
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#EAE5DD] shadow-xs space-y-6 text-sm text-[#5C5452] leading-relaxed">
            <p className="font-serif text-lg text-[#1A1817] font-semibold italic border-l-4 border-[#B85D4D] pl-4">
              &ldquo;We believe a truly extraordinary gift is more than an object—it is a lingering memory, a token of devotion, and a celebration of human connection.&rdquo;
            </p>

            <p className="whitespace-pre-line">
              {content?.aboutUsContent ||
                "Founded with a passion for exceptional aesthetics and artisan traditions, Zentravo brings together master perfumers, chocolatiers, and craftsmen from across the world. Each creation is assembled with meticulous care in our studio, bound in custom silk ribbon, and finished with a hand-poured wax seal."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#F0EBE4]">
              <div className="text-center p-4 rounded-2xl bg-[#FAF8F5]">
                <Award className="w-6 h-6 text-[#B85D4D] mx-auto mb-2" />
                <h4 className="font-serif font-bold text-sm text-[#1A1817]">Master Sourced</h4>
                <p className="text-xs text-[#756C6A] mt-1">Single-origin botanicals & artisanal chocolate</p>
              </div>

              <div className="text-center p-4 rounded-2xl bg-[#FAF8F5]">
                <Heart className="w-6 h-6 text-[#B85D4D] mx-auto mb-2" />
                <h4 className="font-serif font-bold text-sm text-[#1A1817]">Hand Finished</h4>
                <p className="text-xs text-[#756C6A] mt-1">Wax seals & bespoke calligraphy inscription</p>
              </div>

              <div className="text-center p-4 rounded-2xl bg-[#FAF8F5]">
                <Gift className="w-6 h-6 text-[#B85D4D] mx-auto mb-2" />
                <h4 className="font-serif font-bold text-sm text-[#1A1817]">Keepsake Trunks</h4>
                <p className="text-xs text-[#756C6A] mt-1">Reusable velvet trunks designed to endure</p>
              </div>
            </div>
          </div>
        </div>

        <WebsiteFooter />
      </div>
    </CartProvider>
  );
}
