"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Gift, Printer, CheckCircle2, Store } from "lucide-react";

export default function PublicReceiptPage() {
  const params = useParams();
  const id = params?.id as string;
  const [sale, setSale] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReceipt() {
      if (!id) return;
      try {
        const res = await fetch(`/api/pos/sales/${id}`);
        if (res.ok) {
          const data = await res.json();
          setSale(data.sale);
          setSettings(data.settings);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchReceipt();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-xs text-[#756C6A]">
        Retrieving digital boutique invoice...
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4 text-center">
        <Gift className="w-10 h-10 text-[#B85D4D] mb-3" />
        <h1 className="font-serif text-xl font-bold text-[#1A1817]">Receipt Not Found</h1>
        <p className="text-xs text-[#756C6A] mt-1 mb-4">This invoice reference is invalid or has expired.</p>
        <Link href="/" className="px-4 py-2 rounded-xl bg-[#B85D4D] text-white text-xs font-semibold">
          Visit Zentravo Boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#EAE5DD] shadow-sm p-6 text-xs text-[#1A1817]">
        {/* Brand Header */}
        <div className="text-center pb-4 border-b border-dashed border-[#D0C7BC]">
          <div className="w-12 h-12 rounded-full bg-[#E8998D]/20 text-[#B85D4D] flex items-center justify-center mx-auto mb-2">
            <Gift className="w-6 h-6" />
          </div>
          <h1 className="font-serif font-bold text-lg tracking-wider text-[#1A1817] uppercase">
            {settings?.shopName || "Zentravo Luxury Gifts"}
          </h1>
          <p className="text-[11px] text-[#756C6A] mt-0.5">{settings?.address}</p>
          <p className="text-[11px] text-[#756C6A]">Tel: {settings?.phone}</p>
          {settings?.taxNumber && (
            <p className="text-[10px] text-[#8C827E] mt-0.5 font-mono">Tax ID: {settings.taxNumber}</p>
          )}
        </div>

        {/* Invoice Meta */}
        <div className="py-3 border-b border-dashed border-[#D0C7BC] space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-[#756C6A]">Invoice Number:</span>
            <span className="font-mono font-bold text-[#1A1817]">{sale.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#756C6A]">Date:</span>
            <span>{new Date(sale.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#756C6A]">Customer:</span>
            <span className="font-semibold">{sale.customer?.name || "Walk-in Guest"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#756C6A]">Payment Channel:</span>
            <span>{sale.channel} Checkout</span>
          </div>
        </div>

        {/* Line Items */}
        <div className="py-3 border-b border-dashed border-[#D0C7BC] space-y-2">
          {sale.items?.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-start text-xs">
              <div className="pr-3">
                <p className="font-semibold text-[#1A1817]">{item.product?.name || "Gift Item"}</p>
                <p className="text-[10px] text-[#756C6A]">
                  ${Number(item.unitPrice).toFixed(2)} x {Number(item.quantity)}
                </p>
              </div>
              <span className="font-bold text-[#1A1817]">${Number(item.lineTotal).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="py-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-[#756C6A]">
            <span>Subtotal</span>
            <span>${Number(sale.subtotal).toFixed(2)}</span>
          </div>
          {Number(sale.cartDiscount) > 0 && (
            <div className="flex justify-between text-[#B85D4D]">
              <span>Discount</span>
              <span>-${Number(sale.cartDiscount).toFixed(2)}</span>
            </div>
          )}
          {Number(sale.taxAmount) > 0 && (
            <div className="flex justify-between text-[#756C6A]">
              <span>Tax</span>
              <span>${Number(sale.taxAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-2 border-t border-[#1A1817] font-bold text-sm">
            <span>Total Paid</span>
            <span className="text-base text-[#B85D4D]">${Number(sale.grandTotal).toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-dashed border-[#D0C7BC] text-[10px] text-[#756C6A] space-y-1">
          <p className="font-medium text-[#1A1817]">
            {settings?.receiptFooterMessage || "Thank you for shopping at Zentravo!"}
          </p>
          <p>This is an official digital copy of your receipt.</p>
        </div>

        {/* Print Button */}
        <div className="mt-5 flex gap-2 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 py-2.5 rounded-xl border border-[#E0D9D1] bg-[#FAF8F5] text-[#1A1817] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#F0EBE4] transition"
          >
            <Printer className="w-4 h-4 text-[#B85D4D]" />
            Print Receipt
          </button>
          <Link
            href="/"
            className="py-2.5 px-4 rounded-xl bg-[#B85D4D] text-white font-semibold flex items-center justify-center hover:bg-[#A04E40] transition"
          >
            Shop Boutique
          </Link>
        </div>
      </div>
    </div>
  );
}
