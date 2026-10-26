"use client";

import React, { useState } from "react";
import {
  ShoppingBag,
  Check,
  Plus,
  Minus,
  Leaf,
  Truck,
  ShieldCheck,
  Heart,
  Share2,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/currency";

export function ProductDetailsView({ product }: { product: any }) {
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const images = product.images && product.images.length > 0
    ? product.images.map((img: any) => img.url)
    : ["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop"];

  const regularPrice = Number(product.sellingPrice);
  let finalPrice = regularPrice;
  let hasDiscount = false;
  let discountBadge = "";

  if (product.discountType === "PERCENTAGE" && Number(product.discountValue) > 0) {
    hasDiscount = true;
    finalPrice = regularPrice - (regularPrice * Number(product.discountValue)) / 100;
    discountBadge = `Save ${product.discountValue}%`;
  } else if (product.discountType === "FIXED" && Number(product.discountValue) > 0) {
    hasDiscount = true;
    finalPrice = Math.max(0, regularPrice - Number(product.discountValue));
    discountBadge = `Save ${formatPrice(product.discountValue)}`;
  }

  const stockNum = Number(product.stockQuantity);
  const isOutOfStock = stockNum <= 0;

  function handleAddToCart() {
    if (isOutOfStock) return;
    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        sellingPrice: regularPrice,
        discountType: product.discountType,
        discountValue: Number(product.discountValue),
        stockQuantity: stockNum,
        imageUrl: images[0],
        categoryName: product.category?.name,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      {/* Left: Image Gallery */}
      <div className="space-y-4">
        {/* Main Display */}
        <div className="aspect-square rounded-3xl overflow-hidden bg-[#FAF5EF] border border-[#EAE5DD] shadow-md relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[selectedImageIndex] || images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {hasDiscount && (
            <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-[#8F6B2A] text-white shadow-xs">
              {discountBadge}
            </span>
          )}
        </div>

        {/* Thumbnail Carousel */}
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {images.map((img: string, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImageIndex(idx)}
                className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition ${
                  selectedImageIndex === idx ? "border-[#8F6B2A] shadow-xs" : "border-[#EAE5DD] opacity-70 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Product Details & Purchase Form */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF5EF] text-[#8F6B2A] border border-[#C5A059]/40">
              {product.category?.name}
            </span>
            <span className="font-mono text-xs text-[#8C827E]">SKU: {product.sku}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1817] leading-tight">
            {product.name}
          </h1>

          {/* Pricing */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-serif font-bold text-3xl text-[#1A1817]">
              {formatPrice(finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-[#8C827E] line-through font-serif">
                {formatPrice(regularPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Stock Badge */}
        <div className="pt-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isOutOfStock
                ? "bg-red-50 text-red-700 border border-red-200"
                : stockNum <= 5
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOutOfStock ? "bg-red-600" : stockNum <= 5 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
            {isOutOfStock
              ? "Out of Stock - Inquire for backorder"
              : stockNum <= 5
              ? `Limited Edition - Only ${stockNum} pieces remaining`
              : "In Stock - Dispatched within 24 hours"}
          </span>
        </div>

        {/* Description */}
        <div className="pt-4 border-t border-[#EAE5DD]">
          <h3 className="font-serif font-bold text-sm text-[#1A1817] mb-2">Craftsmanship & Presentation</h3>
          <p className="text-xs sm:text-sm text-[#5C5452] leading-relaxed whitespace-pre-line">
            {product.description ||
              "Curated with discerning attention to detail. Every presentation arrives wrapped in bespoke archival paper, finished with hand-tied satin ribbon, and accompanied by a custom calligraphy note."}
          </p>
        </div>

        {/* Quantity Selector & Add to Cart */}
        <div className="pt-6 border-t border-[#EAE5DD] space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-xl border border-[#E0D9D1] bg-white p-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg text-[#5C5452] hover:bg-[#FAF8F5] flex items-center justify-center transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center font-bold text-sm text-[#1A1817]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg text-[#5C5452] hover:bg-[#FAF8F5] flex items-center justify-center transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] ${
                added
                  ? "bg-emerald-600 text-white"
                  : isOutOfStock
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#8F6B2A] text-white hover:bg-[#755518]"
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Shopping Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Shopping Bag</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Artisan Craft Promises */}
        <div className="pt-6 border-t border-[#EAE5DD] grid grid-cols-2 gap-4 text-xs text-[#756C6A]">
          <div className="flex items-start gap-2.5">
            <Leaf className="w-4 h-4 text-[#5F6340] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1A1817] block">Handmade & Local</span>
              <span>Crafted with sustainable natural materials</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Truck className="w-4 h-4 text-[#8F6B2A] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1A1817] block">Express Courier</span>
              <span>Protective cushioned packaging</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
