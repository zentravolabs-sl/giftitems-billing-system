"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Tag,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";
import { useCart, CartProvider } from "@/lib/cart-context";
import { formatPrice } from "@/lib/currency";

function CartPageInner() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    subtotal,
    discountTotal,
    grandTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [loadingCoupon, setLoadingCoupon] = useState(false);

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setLoadingCoupon(true);
    setCouponMsg(null);

    const res = await applyCoupon(couponInput.trim());
    setCouponMsg({ success: res.success, text: res.message });
    if (res.success) setCouponInput("");
    setLoadingCoupon(false);
  }

  const deliveryFee = subtotal >= 75 || subtotal === 0 ? 0 : 9.99;
  const finalTotal = grandTotal + deliveryFee;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
      <WebsiteHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="mb-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs text-[#756C6A] hover:text-[#8F6B2A] font-medium mb-3 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1817]">
            Your Shopping Bag
          </h1>
        </div>

        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Left: Cart Items List (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-xs divide-y divide-[#F0EBE4] overflow-hidden">
                {cart.map((item) => {
                  const linePrice = Number(item.product.sellingPrice);
                  const lineTotal = linePrice * item.quantity;

                  return (
                    <div key={item.product.id} className="p-4 sm:p-6 flex items-center gap-4 text-xs">
                      {/* Product Thumbnail */}
                      <div className="w-20 h-20 rounded-2xl bg-[#FAF5EF] border border-[#EAE5DD] overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 pr-2">
                        <span className="text-[10px] text-[#8C827E] font-mono">{item.product.sku}</span>
                        <Link
                          href={`/product/${item.product.slug}`}
                          className="font-serif font-bold text-sm text-[#1A1817] hover:text-[#8F6B2A] block line-clamp-1 transition"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-[#756C6A] mt-1 font-semibold">
                          {formatPrice(linePrice)} each
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center rounded-xl border border-[#E0D9D1] bg-[#FAF8F5] p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg text-[#5C5452] hover:bg-white flex items-center justify-center transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-bold text-xs text-[#1A1817]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg text-[#5C5452] hover:bg-white flex items-center justify-center transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Total & Remove */}
                      <div className="text-right pl-3 flex flex-col items-end gap-2 w-20">
                        <span className="font-serif font-bold text-sm text-[#1A1817]">
                          {formatPrice(lineTotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[#8C827E] hover:text-rose-600 transition p-1"
                          title="Remove Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Protective artisanal packaging notice */}
              <div className="p-4 rounded-2xl bg-[#FAF5EF] border border-[#C5A059]/30 flex items-center gap-3 text-xs">
                <ShieldCheck className="w-5 h-5 text-[#8F6B2A] flex-shrink-0" />
                <p className="text-[#5C5452]">
                  <strong className="text-[#1A1817]">Protective Handcrafted Packaging:</strong> Every light, faux floral arrangement, and home accent is safely cushioned with eco-friendly protective materials.
                </p>
              </div>
            </div>

            {/* Right: Order Summary & Coupon (1 col) */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-xs p-6 space-y-4 text-xs">
                <h2 className="font-serif font-bold text-base text-[#1A1817]">Order Summary</h2>

                {/* Promo Coupon Form */}
                <form onSubmit={handleApplyCoupon} className="space-y-2 pt-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon Code (e.g. GIFT2026)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-[#E0D9D1] uppercase font-mono text-xs outline-none focus:ring-2 focus:ring-[#C5A059]"
                    />
                    <button
                      type="submit"
                      disabled={loadingCoupon}
                      className="px-4 py-2 rounded-xl bg-[#FAF5EF] border border-[#E0D9D1] text-[#1A1817] font-semibold hover:bg-[#F0EBE4] transition disabled:opacity-50"
                    >
                      {loadingCoupon ? "..." : "Apply"}
                    </button>
                  </div>

                  {couponMsg && (
                    <p
                      className={`text-[11px] font-semibold flex items-center gap-1 ${
                        couponMsg.success ? "text-emerald-700" : "text-rose-600"
                      }`}
                    >
                      {couponMsg.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      <span>{couponMsg.text}</span>
                    </p>
                  )}

                  {appliedCoupon && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-medium">
                      <span>Applied: <strong>{appliedCoupon}</strong></span>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </form>

                {/* Subtotals */}
                <div className="pt-3 border-t border-[#F0EBE4] space-y-2">
                  <div className="flex justify-between text-[#756C6A]">
                    <span>Items Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  {discountTotal > 0 && (
                    <div className="flex justify-between text-[#8F6B2A] font-semibold">
                      <span>Coupon Savings</span>
                      <span>-{formatPrice(discountTotal)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#756C6A]">
                    <span>Concierge Delivery</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-700 font-bold">Complimentary</span>
                      ) : (
                        formatPrice(deliveryFee)
                      )}
                    </span>
                  </div>

                  {subtotal < 75 && (
                    <p className="text-[10px] text-[#8C827E]">
                      Add {formatPrice(75 - subtotal)} more for complimentary delivery!
                    </p>
                  )}

                  <div className="pt-3 border-t border-[#EAE5DD] flex justify-between items-baseline font-bold">
                    <span className="font-serif text-base text-[#1A1817]">Grand Total</span>
                    <span className="font-serif text-2xl text-[#8F6B2A]">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full py-3.5 px-6 rounded-xl bg-[#8F6B2A] hover:bg-[#755518] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.99] block text-center"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center text-[#8C827E] bg-white rounded-3xl border border-[#EAE5DD] max-w-lg mx-auto p-8">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-[#8F6B2A] opacity-40" />
            <h2 className="font-serif font-bold text-xl text-[#1A1817]">Your Bag is Currently Empty</h2>
            <p className="text-xs text-[#756C6A] mt-1 max-w-xs mx-auto">
              Explore our collection of handcrafted wooden lights, artificial flowers, and elegant home décor pieces.
            </p>
            <div className="mt-6">
              <Link
                href="/shop"
                className="px-6 py-3 rounded-xl bg-[#8F6B2A] text-white font-semibold text-xs inline-flex items-center gap-2"
              >
                <span>Browse All Collections</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      <WebsiteFooter />
    </div>
  );
}

export default function CartPage() {
  return (
    <CartProvider>
      <CartPageInner />
    </CartProvider>
  );
}
