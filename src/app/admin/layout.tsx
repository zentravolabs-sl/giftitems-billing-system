"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  Truck,
  ClipboardList,
  ShoppingCart,
  BarChart3,
  Globe,
  Sliders,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Store,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch {
        // User will be caught by middleware
      }
    }
    loadUser();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: Layers },
    { name: "Purchases & GRN", href: "/admin/purchases", icon: Truck },
    { name: "Inventory Ledger", href: "/admin/inventory", icon: ClipboardList },
    { name: "Online Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Reports & Financials", href: "/admin/reports", icon: BarChart3 },
    { name: "Website CMS", href: "/admin/cms", icon: Globe },
    { name: "Store Settings", href: "/admin/settings", icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#2B2625] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-[#EAE5DD] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-[#756C6A] hover:bg-[#F3EFEA]"
            aria-label="Toggle Navigation"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-[#C5A059]/40 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="Oak Bloom" className="w-full h-full object-cover" />
            </div>
            <span className="font-serif font-bold text-sm tracking-wide text-[#1A1817]">
              OAK BLOOM ADMIN
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pos"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#8F6B2A] text-white flex items-center gap-1"
          >
            <Store className="w-3.5 h-3.5" />
            POS
          </Link>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-[#EAE5DD] flex flex-col justify-between z-40 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* Brand Logo */}
          <div className="p-5 border-b border-[#F0EBE4] flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#C5A059]/40 flex items-center justify-center shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpg" alt="Oak Bloom" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-serif font-bold text-base tracking-wider block text-[#1A1817]">
                  OAK BLOOM
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-widest text-[#968E88] block">
                  Management
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Portal Switcher */}
          <div className="p-3 mx-3 my-2 bg-[#FAF8F5] rounded-xl border border-[#EAE5DD] flex items-center justify-between">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-[#756C6A] hover:text-[#8F6B2A] font-medium flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Customer Shop
            </Link>
            <Link
              href="/pos"
              className="text-xs font-semibold px-2 py-0.5 rounded bg-[#8F6B2A] text-white hover:bg-[#755518] transition flex items-center gap-1"
            >
              <Store className="w-3 h-3" />
              Launch POS
            </Link>
          </div>

          {/* Menu Items */}
          <nav className="px-3 py-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? "bg-[#8F6B2A] text-white shadow-xs"
                      : "text-[#5C5452] hover:bg-[#F8F5F0] hover:text-[#1A1817]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#8E8684]"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-[#F0EBE4] bg-[#FAF8F5]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#C5A059]/30 text-[#8F6B2A] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                {currentUser?.name?.[0] || "A"}
              </div>
              <div className="truncate text-xs">
                <p className="font-semibold text-[#1A1817] truncate">{currentUser?.name || "Administrator"}</p>
                <p className="text-[10px] text-[#756C6A] uppercase tracking-wide truncate">
                  {currentUser?.role?.replace("_", " ") || "ADMIN"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-[#756C6A] hover:bg-red-50 hover:text-red-600 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
