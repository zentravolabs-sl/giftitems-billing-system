"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, ArrowRight } from "lucide-react";

export function WebsiteFooter() {
  const [settings, setSettings] = useState<any>(null);
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [setRes, conRes] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/content"),
        ]);
        if (setRes.ok) {
          const s = await setRes.json();
          setSettings(s.settings);
        }
        if (conRes.ok) {
          const c = await conRes.json();
          setContent(c.content);
        }
      } catch {
        // Ignore
      }
    }
    loadData();
  }, []);

  return (
    <footer className="bg-[#1F1C1B] text-[#D4CDC7] pt-14 pb-8 border-t border-[#332E2D] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-[#332E2D]">
          {/* Brand & Story */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#C5A059]/40 bg-white/10 flex items-center justify-center flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpg" alt="Oak Bloom Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-serif font-bold text-xl tracking-wider text-white block">
                  OAK BLOOM
                </span>
                <span className="text-[9px] uppercase tracking-widest text-[#C5A059] block -mt-0.5 font-sans">
                  LIGHTS | FLOWERS | HOME DÉCOR
                </span>
              </div>
            </Link>
            <p className="text-xs text-[#A89F98] max-w-sm leading-relaxed">
              {content?.aboutUsContent?.slice(0, 160) ||
                "A thoughtfully curated collection of handcrafted wooden lights, artificial flowers, and elegant home décor pieces – designed to bring warmth, beauty, and timeless charm into your space."}
              ...
            </p>
            <div className="pt-2 text-xs space-y-2 text-[#C0B7B0]">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                <span>{settings?.address || "108 Lotus Boulevard, Cinnamon Gardens"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                <span>{settings?.phone || "+1 (800) 555-4438"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                <span>{settings?.openingHours || "Mon - Sun: 9:00 AM - 9:00 PM"}</span>
              </div>
            </div>
          </div>

          {/* Boutique Navigation */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-white">
              Collections
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/shop" className="hover:text-[#C5A059] transition">
                  All Collections
                </Link>
              </li>
              <li>
                <Link href="/categories/wooden-lights" className="hover:text-[#C5A059] transition">
                  Wooden Lights & Pendants
                </Link>
              </li>
              <li>
                <Link href="/categories/artificial-flowers" className="hover:text-[#C5A059] transition">
                  Artificial Flowers & Vases
                </Link>
              </li>
              <li>
                <Link href="/categories/home-decor" className="hover:text-[#C5A059] transition">
                  Artisanal Home Décor
                </Link>
              </li>
              <li>
                <Link href="/categories/lanterns-ambient-lighting" className="hover:text-[#C5A059] transition">
                  Lanterns & Candleholders
                </Link>
              </li>
              <li>
                <Link href="/categories/boards-tableware" className="hover:text-[#C5A059] transition">
                  Handcrafted Wooden Boards
                </Link>
              </li>
              <li>
                <Link href="/offers" className="hover:text-[#C5A059] transition font-semibold text-[#C5A059]">
                  Special Offers & Sets
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care & Policies */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-white">
              Customer Care
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-[#C5A059] transition">
                  What is Oak Bloom?
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#C5A059] transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className="hover:text-[#C5A059] transition">
                  Delivery & Shipping
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className="hover:text-[#C5A059] transition">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#C5A059] transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#C5A059] transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Social & WhatsApp */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-white">
              Connect With Us
            </h4>
            <p className="text-xs text-[#A89F98] leading-relaxed">
              Have questions regarding custom lighting dimensions, floral styling, or home decor projects? Speak with our artisans directly.
            </p>
            {settings?.whatsappNumber && (
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/30 text-xs font-semibold transition"
              >
                <span>Chat on WhatsApp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
            <div className="pt-2 text-xs text-[#8C827E] space-y-1">
              <p className="text-[#C5A059] font-medium">Glow Naturally, Bloom Beautifully. ♡</p>
              {content?.instagramUrl && (
                <p>
                  <a href={content.instagramUrl} target="_blank" rel="noreferrer" className="hover:underline">
                    Instagram: @oakbloomdecor
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#756C6A] gap-2">
          <p>© 2026 {settings?.shopName || "Oak Bloom"}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <Link href="/shipping-returns" className="hover:underline">
              Delivery
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
