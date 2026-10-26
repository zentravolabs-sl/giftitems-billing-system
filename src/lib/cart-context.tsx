"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  sellingPrice: number;
  discountType: string;
  discountValue: number;
  stockQuantity: number;
  imageUrl: string;
  categoryName?: string;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: CartProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  appliedCoupon: string | null;
  couponDiscount: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zentravo_customer_cart");
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch {
      // Ignore
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("zentravo_customer_cart", JSON.stringify(cart));
      } catch {
        // Ignore
      }
    }
  }, [cart, isLoaded]);

  function addToCart(product: CartProduct, quantity: number = 1) {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx].quantity += quantity;
        return next;
      }
      return [...prev, { product, quantity }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }

  function clearCart() {
    setCart([]);
    setAppliedCoupon(null);
    setCouponDiscount(0);
  }

  async function applyCoupon(code: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(code)}&subtotal=${subtotal}`);
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || "Invalid coupon code" };
      }
      setAppliedCoupon(code.toUpperCase());
      setCouponDiscount(data.discountAmount);
      return { success: true, message: data.message || "Coupon applied!" };
    } catch {
      return { success: false, message: "Failed to validate coupon" };
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  }

  const totalItems = cart.reduce((acc, it) => acc + it.quantity, 0);

  // Compute subtotal considering item-level promotional discounts
  const subtotal = cart.reduce((acc, it) => {
    let price = Number(it.product.sellingPrice);
    if (it.product.discountType === "PERCENTAGE") {
      price = price - (price * Number(it.product.discountValue)) / 100;
    } else if (it.product.discountType === "FIXED") {
      price = Math.max(0, price - Number(it.product.discountValue));
    }
    return acc + price * it.quantity;
  }, 0);

  const grandTotal = Math.max(0, subtotal - couponDiscount);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        discountTotal: couponDiscount,
        grandTotal,
        appliedCoupon,
        couponDiscount,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
