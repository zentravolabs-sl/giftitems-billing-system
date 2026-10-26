"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, ShoppingBag, User, Search, Menu, X, ArrowRight, Store, ShieldCheck } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function WebsiteHeader() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [content, setContent] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [contentRes, authRes] = await Promise.all([
          fetch("/api/content"),
          fetch("/api/auth/me"),
        ]);
        if (contentRes.ok) {
          const c = await contentRes.json();
          setContent(c.content);
        }
        if (authRes.ok) {
          const a = await authRes.json();
          if (a.authenticated) setCurrentUser(a.user);
        }
      } catch {
        // Ignore
      }
    }
    loadData();
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop All", href: "/shop" },
    { name: "Categories", href: "/categories" },
    { name: "Special Offers", href: "/offers" },
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EFECE8]">
      {/* Top Announcement Ribbon */}
      {content?.promoBannerActive && content?.promoBannerText && (
        <div className="bg-[#B85D4D] text-white py-1.5 px-4 text-center text-[11px] font-medium tracking-wide">
          <Link
            href={content.promoBannerLink || "/offers"}
            className="hover:underline inline-flex items-center gap-1.5 justify-center"
          >
            <span>{content.promoBannerText}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-[#5C5452] hover:bg-[#FAF8F5]"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-[#1A1817]" />}
        </button>

        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-full bg-[#FAF5EF] border border-[#E8998D]/40 text-[#B85D4D] flex items-center justify-center shadow-xs group-hover:scale-105 transition">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif font-bold text-xl tracking-wider text-[#1A1817] block">
              ZENTRAVO
            </span>
            <span className="text-[9px] uppercase tracking-widest text-[#8C827E] block -mt-1 font-sans">
              Luxury Gifts & Hampers
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-[#5C5452]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`transition hover:text-[#B85D4D] relative py-1 ${
                  isActive ? "text-[#B85D4D]" : ""
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B85D4D] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Staff Portal Link */}
          {currentUser && ["SUPER_ADMIN", "ADMIN", "INVENTORY_STAFF", "ACCOUNTANT"].includes(currentUser.role) && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF5EF] border border-[#EAE5DD] text-[11px] font-semibold text-[#B85D4D] hover:bg-[#F0EBE4]"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}

          {/* POS Terminal quick launcher */}
          {currentUser && ["SUPER_ADMIN", "ADMIN", "CASHIER"].includes(currentUser.role) && (
            <Link
              href="/pos"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#B85D4D] text-[11px] font-semibold text-white hover:bg-[#A04E40]"
            >
              <Store className="w-3.5 h-3.5" />
              Launch POS
            </Link>
          )}

          {/* Account Link */}
          <Link
            href={currentUser ? "/account" : "/login"}
            className="p-2 rounded-xl text-[#5C5452] hover:bg-[#FAF8F5] hover:text-[#1A1817] transition"
            title={currentUser ? `Account (${currentUser.name})` : "Sign In"}
          >
            <User className="w-5 h-5" />
          </Link>

          {/* Shopping Cart Button with Dynamic Badge */}
          <Link
            href="/cart"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF5EF] hover:bg-[#F3EFEA] border border-[#EAE5DD] text-[#1A1817] transition group"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-[#B85D4D] group-hover:scale-105 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[#B85D4D] text-white text-[10px] font-bold flex items-center justify-center animate-in zoom-in">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-[#5C5452]">Cart</span>
          </Link>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#EAE5DD] px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2 text-xs font-semibold text-[#5C5452]">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-[#FAF8F5] hover:text-[#B85D4D]"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-2 border-t border-[#F0EBE4] flex items-center justify-between">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#B85D4D] py-1 font-bold"
              >
                {currentUser ? `Signed in as ${currentUser.name}` : "Sign In / Register"}
              </Link>
              <Link
                href="/pos"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2.5 py-1 text-xs rounded-lg bg-[#B85D4D] text-white font-semibold flex items-center gap-1"
              >
                <Store className="w-3.5 h-3.5" />
                POS
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
