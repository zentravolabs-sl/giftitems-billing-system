import { prisma } from "@/lib/prisma";
import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";
import { CartProvider } from "@/lib/cart-context";
import { Truck, Undo2, ShieldCheck, Clock } from "lucide-react";

export default async function ShippingReturnsPage() {
  const content = await prisma.websiteContent.findUnique({
    where: { id: "default" },
  });

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
        <WebsiteHeader />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-1 space-y-10">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-semibold text-[#8F6B2A] uppercase tracking-wider block mb-1">
              Concierge Care
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1817]">
              Shipping & Returns Policy
            </h1>
          </div>

          <div className="space-y-6 text-xs text-[#5C5452]">
            {/* Delivery Section */}
            <div className="bg-white p-8 rounded-3xl border border-[#EAE5DD] shadow-xs space-y-4">
              <h2 className="font-serif font-bold text-base text-[#1A1817] flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#8F6B2A]" />
                White-Glove Delivery Standards
              </h2>
              <p className="leading-relaxed">
                {content?.deliveryPolicy ||
                  "Standard concierge delivery arrives in 2-4 business days in temperature-controlled vehicles. Express same-day courier dispatch is available for orders confirmed before 1:00 PM."}
              </p>
              <div className="p-4 rounded-2xl bg-[#FAF8F5] space-y-1.5">
                <p>• <strong>Complimentary Shipping:</strong> Automatically granted on all orders over Rs. 75.</p>
                <p>• <strong>Standard Delivery:</strong> Rs. 9.99 flat rate for orders under Rs. 75.</p>
                <p>• <strong>Live GPS Tracking:</strong> A live tracking link is sent via email and WhatsApp upon courier dispatch.</p>
              </div>
            </div>

            {/* Returns Section */}
            <div className="bg-white p-8 rounded-3xl border border-[#EAE5DD] shadow-xs space-y-4">
              <h2 className="font-serif font-bold text-base text-[#1A1817] flex items-center gap-2">
                <Undo2 className="w-5 h-5 text-[#8F6B2A]" />
                14-Day Returns & Exchanges
              </h2>
              <p className="leading-relaxed">
                {content?.returnPolicy ||
                  "We offer a 14-day hassle-free return or exchange policy on all home décor and lighting items in original packaging."}
              </p>
              <p className="leading-relaxed">
                To initiate a return or exchange, contact our Concierge desk via WhatsApp or visit our flagship showroom with your invoice number. Restocked items are immediately credited to your original payment method.
              </p>
            </div>
          </div>
        </div>

        <WebsiteFooter />
      </div>
    </CartProvider>
  );
}
