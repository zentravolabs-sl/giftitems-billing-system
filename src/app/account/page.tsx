"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Package, LogOut, ArrowRight, Clock, Star, Phone, Mail } from "lucide-react";
import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";
import { CartProvider } from "@/lib/cart-context";
import { formatPrice } from "@/lib/currency";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccount() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          router.push("/login?redirect=/account");
          return;
        }

        const authData = await authRes.json();
        setUser(authData.user);

        // Fetch customer's orders
        const ordersRes = await fetch(`/api/orders?email=${encodeURIComponent(authData.user.email)}`);
        if (ordersRes.ok) {
          const ordData = await ordersRes.json();
          setOrders(ordData.orders || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAccount();
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
        <WebsiteHeader />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-8">
          {/* Account Profile Header */}
          <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#FAF5EF] border border-[#C5A059]/40 text-[#8F6B2A] flex items-center justify-center font-bold text-xl uppercase font-serif">
                {user?.name?.[0] || "U"}
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#8F6B2A] uppercase tracking-wider block">
                  Boutique Member
                </span>
                <h1 className="font-serif text-2xl font-bold text-[#1A1817]">{user?.name}</h1>
                <p className="text-xs text-[#756C6A] mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-2xl bg-[#FAF5EF] border border-[#C5A059]/30 text-right">
                <span className="text-[10px] text-[#756C6A] block">Loyalty Points</span>
                <span className="font-serif font-bold text-lg text-[#8F6B2A] flex items-center gap-1 justify-end">
                  <Star className="w-3.5 h-3.5 fill-[#8F6B2A]" />
                  {orders.reduce((acc, o) => acc + Math.floor(Number(o.grandTotal)), 0)} pts
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-2.5 rounded-xl border border-[#E0D9D1] text-[#756C6A] hover:bg-red-50 hover:text-red-600 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Orders Section */}
          <div className="space-y-4">
            <h2 className="font-serif font-bold text-xl text-[#1A1817] flex items-center gap-2">
              <Package className="w-5 h-5 text-[#8F6B2A]" />
              Your Order History ({orders.length})
            </h2>

            {orders.length > 0 ? (
              <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-xs divide-y divide-[#F0EBE4] overflow-hidden">
                {orders.map((o) => (
                  <div key={o.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1A1817]">{o.orderNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-800"
                              : o.status === "PENDING"
                              ? "bg-amber-50 text-amber-800"
                              : "bg-blue-50 text-blue-800"
                          }`}
                        >
                          {o.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-[#756C6A] text-[11px] mt-1">
                        Placed on {new Date(o.createdAt).toLocaleDateString()} • {o.items?.length || 0} items
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-serif font-bold text-base text-[#1A1817]">
                        {formatPrice(o.grandTotal)}
                      </span>
                      <Link
                        href={`/orders/${o.orderNumber}`}
                        className="px-4 py-2 rounded-xl bg-[#FAF5EF] text-[#8F6B2A] hover:bg-[#F0EBE4] font-semibold text-xs inline-flex items-center gap-1.5 transition"
                      >
                        <span>Track Status</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-[#EAE5DD] space-y-3">
                <Package className="w-8 h-8 text-[#8F6B2A] mx-auto opacity-40" />
                <h3 className="font-serif font-bold text-base text-[#1A1817]">No orders placed yet</h3>
                <p className="text-xs text-[#756C6A]">
                  When you purchase lights, flowers, or décor items, your tracking and digital receipts will appear here.
                </p>
                <div className="pt-2">
                  <Link
                    href="/shop"
                    className="px-5 py-2.5 rounded-xl bg-[#8F6B2A] text-white font-semibold text-xs inline-flex items-center gap-1.5"
                  >
                    <span>Explore Boutique</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <WebsiteFooter />
      </div>
    </CartProvider>
  );
}
