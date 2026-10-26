import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";
import { CartProvider } from "@/lib/cart-context";
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  Printer,
  Gift,
  MapPin,
  Calendar,
} from "lucide-react";

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const order = await prisma.websiteOrder.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          product: {
            include: { images: { take: 1 } },
          },
        },
      },
      customer: true,
    },
  });

  if (!order) {
    notFound();
  }

  const steps = [
    { key: "PENDING", label: "Order Placed" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "PROCESSING", label: "Gift Preparation" },
    { key: "READY_FOR_DELIVERY", label: "Dispatched" },
    { key: "COMPLETED", label: "Delivered" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);
  const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 1;

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
        <WebsiteHeader />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-8">
          {/* Header */}
          <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#B85D4D] uppercase tracking-wider block mb-1">
                Live Order Tracker
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817]">
                Order {order.orderNumber}
              </h1>
              <p className="text-xs text-[#756C6A] mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Placed on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#756C6A] block">Total Amount</span>
              <span className="font-serif font-bold text-2xl text-[#B85D4D]">
                ${Number(order.grandTotal).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Visual Milestone Progress Tracker */}
          <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-xs p-6 sm:p-8 space-y-6">
            <h2 className="font-serif font-bold text-base text-[#1A1817]">Fulfillment Progress</h2>

            <div className="relative">
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-[#FAF5EF]">
                <div
                  style={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#B85D4D] transition-all duration-500"
                />
              </div>

              <div className="grid grid-cols-5 text-center text-xs">
                {steps.map((step, idx) => {
                  const isDone = idx <= activeIndex;
                  return (
                    <div key={step.key} className="space-y-1">
                      <div
                        className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold ${
                          isDone ? "bg-[#B85D4D] text-white" : "bg-[#FAF5EF] text-[#8C827E]"
                        }`}
                      >
                        {isDone ? "✓" : idx + 1}
                      </div>
                      <span className={`block font-medium ${isDone ? "text-[#1A1817]" : "text-[#8C827E]"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Shipping & Purchased Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-xs p-6 space-y-3 text-xs">
              <h3 className="font-serif font-bold text-sm text-[#1A1817] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#B85D4D]" />
                Destination & Recipient
              </h3>
              <p className="font-bold text-[#1A1817]">{order.customerName}</p>
              <p className="text-[#5C5452]">{order.shippingAddress}</p>
              <p className="text-[#5C5452] font-semibold">{order.shippingCity}</p>
              <p className="text-[#756C6A] pt-1">Contact: {order.customerPhone}</p>
              {order.orderNotes && (
                <div className="p-3 rounded-xl bg-[#FAF5EF] border border-[#E8998D]/30 mt-2">
                  <span className="font-semibold block text-[#B85D4D]">Gift Inscription:</span>
                  <span className="italic text-[#5C5452]">{order.orderNotes}</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-xs p-6 space-y-3 text-xs">
              <h3 className="font-serif font-bold text-sm text-[#1A1817] flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-[#B85D4D]" />
                Gift Items ({order.items.length})
              </h3>
              <div className="space-y-2 divide-y divide-[#F0EBE4] max-h-48 overflow-y-auto">
                {order.items.map((it) => (
                  <div key={it.id} className="pt-2 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-[#1A1817] block">{it.product.name}</span>
                      <span className="text-[10px] text-[#756C6A]">
                        ${Number(it.unitPrice).toFixed(2)} x {Number(it.quantity)}
                      </span>
                    </div>
                    <span className="font-bold text-[#1A1817]">${Number(it.lineTotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <WebsiteFooter />
      </div>
    </CartProvider>
  );
}
