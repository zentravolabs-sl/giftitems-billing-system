"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Check, Eye, Star } from "lucide-react";
import { useCart, CartProduct } from "@/lib/cart-context";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    sellingPrice: number;
    discountType: string;
    discountValue: number;
    stockQuantity: number;
    isFeatured?: boolean;
    category?: { name: string; slug: string };
    images?: Array<{ url: string; isPrimary?: boolean }>;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=400&auto=format&fit=crop";

  const regularPrice = Number(product.sellingPrice);
  let finalPrice = regularPrice;
  let hasDiscount = false;
  let discountBadge = "";

  if (product.discountType === "PERCENTAGE" && Number(product.discountValue) > 0) {
    hasDiscount = true;
    finalPrice = regularPrice - (regularPrice * Number(product.discountValue)) / 100;
    discountBadge = `-${product.discountValue}%`;
  } else if (product.discountType === "FIXED" && Number(product.discountValue) > 0) {
    hasDiscount = true;
    finalPrice = Math.max(0, regularPrice - Number(product.discountValue));
    discountBadge = `-$${product.discountValue}`;
  }

  const stockNum = Number(product.stockQuantity);
  const isOutOfStock = stockNum <= 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      sellingPrice: regularPrice,
      discountType: product.discountType,
      discountValue: Number(product.discountValue),
      stockQuantity: stockNum,
      imageUrl: primaryImage,
      categoryName: product.category?.name,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="group bg-white rounded-2xl border border-[#EAE5DD] overflow-hidden flex flex-col justify-between hover:border-[#E8998D] hover:shadow-md transition-all duration-300">
      {/* Image Container with Badges */}
      <Link href={`/product/${product.slug}`} className="relative aspect-square overflow-hidden bg-[#FAF5EF] block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {hasDiscount && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B85D4D] text-white shadow-xs">
              {discountBadge}
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-200 shadow-xs flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
              Curated
            </span>
          )}
        </div>

        {/* Stock Badge */}
        <div className="absolute bottom-2.5 left-2.5">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md shadow-2xs ${
              isOutOfStock
                ? "bg-red-900/80 text-white"
                : stockNum <= 5
                ? "bg-amber-900/80 text-white"
                : "bg-black/60 text-white"
            }`}
          >
            {isOutOfStock ? "Out of Stock" : stockNum <= 5 ? `Only ${stockNum} Left` : "In Stock"}
          </span>
        </div>
      </Link>

      {/* Product Details */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-center justify-between text-[11px] text-[#8C827E] mb-1">
            <span>{product.category?.name || "Boutique Gift"}</span>
            <span className="font-mono text-[10px]">{product.sku}</span>
          </div>

          <Link href={`/product/${product.slug}`} className="block group-hover:text-[#B85D4D] transition">
            <h3 className="font-serif font-bold text-sm text-[#1A1817] line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price & Add to Cart button */}
        <div className="mt-4 pt-3 border-t border-[#F0EBE4] flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif font-bold text-base text-[#1A1817]">
                ${finalPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-[#8C827E] line-through">
                  ${regularPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
              added
                ? "bg-emerald-600 text-white"
                : isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#FAF5EF] text-[#B85D4D] hover:bg-[#B85D4D] hover:text-white"
            }`}
            title={isOutOfStock ? "Out of Stock" : "Add to Shopping Cart"}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
