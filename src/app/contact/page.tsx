"use client";

import React, { useState, useEffect } from "react";
import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";
import { CartProvider } from "@/lib/cart-context";
import { MapPin, Phone, Mail, Clock, MessageSquare, CheckCircle2, ArrowRight } from "lucide-react";

export default function ContactPage() {
  const [settings, setSettings] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
        }
      } catch {
        // Ignore
      }
    }
    fetchSettings();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
        <WebsiteHeader />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-1">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-semibold text-[#B85D4D] uppercase tracking-wider block mb-1">
              Boutique Concierge
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1817]">
              Contact Our Concierge Team
            </h1>
            <p className="text-xs sm:text-sm text-[#756C6A] mt-2">
              For bespoke gifting commissions, bridal registry, or corporate orders, we invite you to speak with our specialists.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Showroom & Contact Info */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-[#EAE5DD] shadow-xs space-y-6 text-xs text-[#5C5452]">
                <h3 className="font-serif font-bold text-base text-[#1A1817]">
                  Flagship Boutique Showroom
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#B85D4D] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#1A1817] block">Showroom Address</span>
                      <span>{settings?.address || "108 Lotus Boulevard, Cinnamon Gardens"}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-[#B85D4D] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#1A1817] block">Telephone Concierge</span>
                      <span>{settings?.phone || "+1 (800) 555-4438"}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-[#B85D4D] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#1A1817] block">Email Inquiries</span>
                      <span>{settings?.email || "concierge@zentravogifts.com"}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-[#B85D4D] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#1A1817] block">Opening Hours</span>
                      <span>{settings?.openingHours || "Mon - Sun: 9:00 AM - 9:00 PM"}</span>
                    </div>
                  </div>
                </div>

                {settings?.whatsappNumber && (
                  <div className="pt-4 border-t border-[#F0EBE4]">
                    <a
                      href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#20BD5A] transition shadow-xs"
                    >
                      <span>Direct Chat on WhatsApp Concierge</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Inquiry Form */}
            <div className="bg-white p-8 rounded-3xl border border-[#EAE5DD] shadow-xs text-xs">
              <h3 className="font-serif font-bold text-base text-[#1A1817] mb-2">
                Send an Online Inquiry
              </h3>
              <p className="text-[#756C6A] mb-6">
                Our concierge desk will respond to your message within 2 business hours.
              </p>

              {submitted ? (
                <div className="p-8 text-center space-y-3 bg-[#FAF8F5] rounded-2xl border border-[#EAE5DD]">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-serif font-bold text-base text-[#1A1817]">Message Received</h4>
                  <p className="text-xs text-[#756C6A]">
                    Thank you {name}. A boutique concierge has been assigned to your request and will contact you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block font-semibold text-[#5C5452] mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Eleanor Vance"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E0D9D1] outline-none focus:ring-2 focus:ring-[#E8998D]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#5C5452] mb-1">Your Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="eleanor@example.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E0D9D1] outline-none focus:ring-2 focus:ring-[#E8998D]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#5C5452] mb-1">Message / Gifting Requirements *</label>
                    <textarea
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about the occasion, preferred items, estimated recipient count, or custom card inscription..."
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E0D9D1] outline-none focus:ring-2 focus:ring-[#E8998D]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-xl bg-[#B85D4D] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#A04E40] transition shadow-xs"
                  >
                    Send Message to Concierge
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <WebsiteFooter />
      </div>
    </CartProvider>
  );
}
