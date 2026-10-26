"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  CreditCard,
  Banknote,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Truck,
  Share2,
  AlertCircle,
} from "lucide-react";
import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";
import { useCart, CartProvider } from "@/lib/cart-context";
import { formatPrice } from "@/lib/currency";

function CheckoutPageInner() {
  const router = useRouter();
  const { cart, subtotal, discountTotal, grandTotal, appliedCoupon, clearCart } = useCart();

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("San Francisco");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "BANK_TRANSFER">("CASH");

  // Mock Card Form State
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  const deliveryFee = subtotal >= 75 || subtotal === 0 ? 0 : 9.99;
  const finalTotal = grandTotal + deliveryFee;

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;

    setError(null);
    setLoading(true);

    try {
      const payload = {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
        orderNotes,
        items: cart.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
          unitPrice: Number(it.product.sellingPrice),
        })),
        deliveryFee,
        discountAmount: discountTotal,
        paymentMethod,
        couponCode: appliedCoupon || undefined,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      setConfirmedOrder(data.order);
      clearCart();
    } catch (err: any) {
      setError(err.message || "An error occurred during order submission");
    } finally {
      setLoading(false);
    }
  }

  function shareWhatsAppOrder() {
    if (!confirmedOrder) return;
    const cleanPhone = confirmedOrder.customerPhone.replace(/[^0-9]/g, "");
    const msg = `✨ *Oak Bloom Order Confirmation* ✨\n` +
      `Thank you ${confirmedOrder.customerName}! Your order *#${confirmedOrder.orderNumber}* has been received.\n\n` +
      `📦 *Total:* ${formatPrice(confirmedOrder.grandTotal)}\n` +
      `🚚 *Destination:* ${confirmedOrder.shippingCity}, ${confirmedOrder.shippingAddress}\n\n` +
      `🔍 *Track Status:* ${window.location.origin}/orders/${confirmedOrder.orderNumber}`;

    window.open(`https://wa.me/${cleanPhone || "18005554438"}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  if (confirmedOrder) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
        <WebsiteHeader />

        <div className="max-w-2xl mx-auto px-4 py-16 w-full flex-1 text-center">
          <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-sm p-8 sm:p-12 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold text-[#8F6B2A] uppercase tracking-wider block mb-1">
                Thank You For Your Order
              </span>
              <h1 className="font-serif text-3xl font-bold text-[#1A1817]">
                Order Confirmed
              </h1>
              <p className="font-mono text-sm font-bold text-[#5C5452] mt-2">
                Order Reference: {confirmedOrder.orderNumber}
              </p>
              <p className="text-xs text-[#756C6A] mt-2 max-w-md mx-auto">
                A confirmation email has been sent to <strong>{confirmedOrder.customerEmail}</strong>. Our team is now preparing your handcrafted order with care.
              </p>
            </div>

            {/* Order Highlights */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DD] text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#756C6A]">Delivery To:</span>
                <span className="font-semibold text-[#1A1817]">
                  {confirmedOrder.customerName}, {confirmedOrder.shippingCity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#756C6A]">Payment Tender:</span>
                <span className="font-semibold text-[#1A1817]">{confirmedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#EAE5DD] font-bold">
                <span>Grand Total:</span>
                <span className="text-[#8F6B2A]">{formatPrice(confirmedOrder.grandTotal)}</span>
              </div>
            </div>

            {/* WhatsApp & Tracking Links */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={shareWhatsAppOrder}
                className="px-5 py-3 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#20BD5A] transition"
              >
                <Share2 className="w-4 h-4" />
                <span>Save / Share on WhatsApp</span>
              </button>

              <Link
                href={`/orders/${confirmedOrder.orderNumber}`}
                className="px-5 py-3 rounded-xl bg-[#8F6B2A] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#755518] transition"
              >
                <span>Track Order Status</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <WebsiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
      <WebsiteHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs text-[#756C6A] hover:text-[#8F6B2A] font-medium mb-4 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Shopping Bag</span>
        </Link>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1817] mb-8">
          Boutique Checkout
        </h1>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Customer & Delivery Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Recipient Information */}
            <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-xs p-6 space-y-4 text-xs">
              <h2 className="font-serif font-bold text-base text-[#1A1817] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#FAF5EF] text-[#8F6B2A] flex items-center justify-center text-xs font-bold">1</span>
                Recipient & Contact Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Lady Catherine de Bourgh"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E0D9D1] outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="catherine@example.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E0D9D1] outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#5C5452] mb-1">Phone Number (for Courier & WhatsApp Updates) *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 (415) 555-7788"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E0D9D1] outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>
            </div>

            {/* 2. Delivery Address */}
            <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-xs p-6 space-y-4 text-xs">
              <h2 className="font-serif font-bold text-base text-[#1A1817] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#FAF5EF] text-[#8F6B2A] flex items-center justify-center text-xs font-bold">2</span>
                White-Glove Delivery Address
              </h2>

              <div>
                <label className="block font-semibold text-[#5C5452] mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="e.g. 77 Crestview Terrace, Suite 400"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E0D9D1] outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E0D9D1] outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">Postal / ZIP Code</label>
                  <input
                    type="text"
                    value={shippingPostalCode}
                    onChange={(e) => setShippingPostalCode(e.target.value)}
                    placeholder="94108"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E0D9D1] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#5C5452] mb-1">Order Notes & Delivery Instructions</label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Special delivery instructions, gate code, or specific requests for your items..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
                />
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-xs p-6 space-y-4 text-xs">
              <h2 className="font-serif font-bold text-base text-[#1A1817] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#FAF5EF] text-[#8F6B2A] flex items-center justify-center text-xs font-bold">3</span>
                Select Payment Tender
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`p-4 rounded-2xl border flex flex-col justify-between cursor-pointer transition ${
                    paymentMethod === "CASH"
                      ? "border-[#8F6B2A] bg-[#FAF5EF]"
                      : "border-[#E0D9D1] hover:bg-[#FAF8F5]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Banknote className="w-5 h-5 text-[#8F6B2A]" />
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "CASH"}
                      onChange={() => setPaymentMethod("CASH")}
                      className="text-[#8F6B2A]"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-[#1A1817] block">Cash on Delivery</span>
                    <span className="text-[10px] text-[#756C6A]">Pay upon concierge arrival</span>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-2xl border flex flex-col justify-between cursor-pointer transition ${
                    paymentMethod === "CARD"
                      ? "border-[#8F6B2A] bg-[#FAF5EF]"
                      : "border-[#E0D9D1] hover:bg-[#FAF8F5]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <CreditCard className="w-5 h-5 text-[#8F6B2A]" />
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "CARD"}
                      onChange={() => setPaymentMethod("CARD")}
                      className="text-[#8F6B2A]"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-[#1A1817] block">Credit / Debit Card</span>
                    <span className="text-[10px] text-[#756C6A]">Visa, Mastercard, Amex</span>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-2xl border flex flex-col justify-between cursor-pointer transition ${
                    paymentMethod === "BANK_TRANSFER"
                      ? "border-[#8F6B2A] bg-[#FAF5EF]"
                      : "border-[#E0D9D1] hover:bg-[#FAF8F5]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Building2 className="w-5 h-5 text-[#8F6B2A]" />
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "BANK_TRANSFER"}
                      onChange={() => setPaymentMethod("BANK_TRANSFER")}
                      className="text-[#8F6B2A]"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-[#1A1817] block">Direct Bank Wire</span>
                    <span className="text-[10px] text-[#756C6A]">Invoice transfer details</span>
                  </div>
                </label>
              </div>

              {paymentMethod === "CARD" && (
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DD] space-y-3 pt-3">
                  <div>
                    <label className="block font-semibold text-[#5C5452] mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="4242 •••• •••• 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] bg-white font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#5C5452] mb-1">Expiry</label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] bg-white text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#5C5452] mb-1">CVC / CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] bg-white text-center font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Order Summary Breakdown (1 col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-xs p-6 space-y-4 text-xs">
              <h2 className="font-serif font-bold text-base text-[#1A1817]">Your Presentation</h2>

              <div className="space-y-2.5 max-h-56 overflow-y-auto divide-y divide-[#F0EBE4]">
                {cart.map((it) => (
                  <div key={it.product.id} className="pt-2 flex justify-between items-center text-xs">
                    <div className="pr-2">
                      <p className="font-semibold text-[#1A1817] line-clamp-1">{it.product.name}</p>
                      <span className="text-[10px] text-[#756C6A]">Qty: {it.quantity}</span>
                    </div>
                    <span className="font-bold text-[#1A1817]">
                      {formatPrice(Number(it.product.sellingPrice) * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#F0EBE4] space-y-2">
                <div className="flex justify-between text-[#756C6A]">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-[#8F6B2A] font-bold">
                    <span>Coupon Savings</span>
                    <span>-{formatPrice(discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#756C6A]">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? "Complimentary" : formatPrice(deliveryFee)}</span>
                </div>
                <div className="pt-2 border-t border-[#EAE5DD] flex justify-between items-baseline font-bold text-sm">
                  <span>Grand Total</span>
                  <span className="text-xl font-serif text-[#8F6B2A]">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || cart.length === 0}
                className="w-full py-4 px-6 rounded-xl bg-[#8F6B2A] hover:bg-[#755518] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] disabled:opacity-50"
              >
                <span>{loading ? "Confirming Order..." : `Place Order — ${formatPrice(finalTotal)}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      <WebsiteFooter />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <CartProvider>
      <CheckoutPageInner />
    </CartProvider>
  );
}
