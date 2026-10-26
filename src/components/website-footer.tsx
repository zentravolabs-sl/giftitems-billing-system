"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Gift, Phone, Mail, MapPin, Clock, ArrowRight } from "lucide-react";

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
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-full bg-[#B85D4D]/20 border border-[#B85D4D]/40 text-[#E8998D] flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <span className="font-serif font-bold text-xl tracking-wider text-white block">
                ZENTRAVO
              </span>
            </Link>
            <p className="text-xs text-[#A89F98] max-w-sm leading-relaxed">
              {content?.aboutUsContent?.slice(0, 160) ||
                "Curating unforgettable gifting moments through artisanal luxury hampers, handcrafted botanical candles, eternal preserved blooms, and bespoke keepsakes."}
              ...
            </p>
            <div className="pt-2 text-xs space-y-2 text-[#C0B7B0]">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#E8998D] flex-shrink-0" />
                <span>{settings?.address || "108 Lotus Boulevard, Cinnamon Gardens"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#E8998D] flex-shrink-0" />
                <span>{settings?.phone || "+1 (800) 555-4438"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#E8998D] flex-shrink-0" />
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
                <Link href="/shop" className="hover:text-[#E8998D] transition">
                  All Gift Items
                </Link>
              </li>
              <li>
                <Link href="/categories/luxury-gift-hampers" className="hover:text-[#E8998D] transition">
                  Luxury Hampers
                </Link>
              </li>
              <li>
                <Link href="/categories/scented-candles" className="hover:text-[#E8998D] transition">
                  Artisanal Candles
                </Link>
              </li>
              <li>
                <Link href="/categories/eternal-blooms" className="hover:text-[#E8998D] transition">
                  Preserved Blooms
                </Link>
              </li>
              <li>
                <Link href="/categories/gourmet-chocolates" className="hover:text-[#E8998D] transition">
                  Gourmet Confections
                </Link>
              </li>
              <li>
                <Link href="/offers" className="hover:text-[#E8998D] transition font-semibold text-[#E8998D]">
                  Special Offers & Baskets
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care & Policies */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-white">
              Concierge Care
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-[#E8998D] transition">
                  Our Story & Heritage
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#E8998D] transition">
                  Contact Concierge
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className="hover:text-[#E8998D] transition">
                  Delivery & Shipping
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className="hover:text-[#E8998D] transition">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#E8998D] transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#E8998D] transition">
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
              Have questions regarding personalized gift engraving or corporate orders? Speak with our team directly.
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
              {content?.instagramUrl && (
                <p>
                  <a href={content.instagramUrl} target="_blank" rel="noreferrer" className="hover:underline">
                    Instagram: @zentravogifts
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#756C6A] gap-2">
          <p>© 2026 {settings?.shopName || "Zentravo Luxury Gifts"}. All rights reserved.</p>
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
