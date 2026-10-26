import { prisma } from "@/lib/prisma";
import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";
import { CartProvider } from "@/lib/cart-context";
import { FileText } from "lucide-react";

export default async function TermsPage() {
  const content = await prisma.websiteContent.findUnique({
    where: { id: "default" },
  });

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
        <WebsiteHeader />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-1 space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-semibold text-[#B85D4D] uppercase tracking-wider block mb-1">
              Legal Framework
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1817]">
              Terms & Conditions of Service
            </h1>
          </div>

          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#EAE5DD] shadow-xs space-y-6 text-xs text-[#5C5452] leading-relaxed">
            <p className="whitespace-pre-line">
              {content?.termsPolicy ||
                "By using our boutique services and placing orders, you agree to our standard terms and conditions. Promotional codes cannot be combined with clearance pricing."}
            </p>

            <h3 className="font-serif font-bold text-sm text-[#1A1817] pt-4 border-t border-[#F0EBE4]">
              Artisanal Variations
            </h3>
            <p>
              Due to the organic nature of natural soy botanicals, hand-carved olive wood utensils, and preserved floral blooms, slight variations in petal shape, fragrance saturation, and grain are celebrated marks of genuine artisan craftsmanship.
            </p>

            <h3 className="font-serif font-bold text-sm text-[#1A1817] pt-4 border-t border-[#F0EBE4]">
              Pricing & Promotions
            </h3>
            <p>
              All prices are listed in your selected currency and reflect current store rates. Promotional coupons must meet minimum purchase thresholds and cannot be redeemed for cash value.
            </p>
          </div>
        </div>

        <WebsiteFooter />
      </div>
    </CartProvider>
  );
}
