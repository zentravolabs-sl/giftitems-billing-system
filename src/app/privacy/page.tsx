import { prisma } from "@/lib/prisma";
import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";
import { CartProvider } from "@/lib/cart-context";
import { ShieldCheck } from "lucide-react";

export default async function PrivacyPage() {
  const content = await prisma.websiteContent.findUnique({
    where: { id: "default" },
  });

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
        <WebsiteHeader />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-1 space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-semibold text-[#8F6B2A] uppercase tracking-wider block mb-1">
              Data Protection
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1817]">
              Privacy & Discretion Policy
            </h1>
          </div>

          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#EAE5DD] shadow-xs space-y-6 text-xs text-[#5C5452] leading-relaxed">
            <p className="font-serif text-base font-bold text-[#1A1817]">
              Your Discretion is Paramount to Our House
            </p>

            <p className="whitespace-pre-line">
              {content?.privacyPolicy ||
                "Your privacy is sacred. We never share your personal information with third parties and ensure bank-grade encryption on all transactions."}
            </p>

            <h3 className="font-serif font-bold text-sm text-[#1A1817] pt-4 border-t border-[#F0EBE4]">
              Personal Data Collected
            </h3>
            <p>
              We collect your name, recipient delivery address, contact telephone, and email solely to coordinate white-glove courier dispatch, WhatsApp receipt transmission, and order status tracking.
            </p>

            <h3 className="font-serif font-bold text-sm text-[#1A1817] pt-4 border-t border-[#F0EBE4]">
              Payment Security
            </h3>
            <p>
              Credit and debit card transactions are encrypted with PCI-DSS compliant standards. We never store raw cardholder numbers, CVVs, or bank credentials on our servers.
            </p>
          </div>
        </div>

        <WebsiteFooter />
      </div>
    </CartProvider>
  );
}
