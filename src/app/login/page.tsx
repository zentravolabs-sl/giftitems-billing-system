"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Gift, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "unauthorized" ? "You do not have permission to access that area." : null
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in");
      }

      // Route based on role or original redirect
      if (redirect && redirect !== "/") {
        router.push(redirect);
      } else if (["SUPER_ADMIN", "ADMIN", "INVENTORY_STAFF", "ACCOUNTANT"].includes(data.user.role)) {
        router.push("/admin");
      } else if (data.user.role === "CASHIER") {
        router.push("/pos");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  function setDemoCredentials(role: "admin" | "cashier" | "customer") {
    if (role === "admin") {
      setEmail("admin@zentravo.com");
      setPassword("Admin@123456");
    } else if (role === "cashier") {
      setEmail("cashier@zentravo.com");
      setPassword("Cashier@123456");
    } else {
      setEmail("customer@zentravo.com");
      setPassword("Customer@123456");
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2B2625] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
          <div className="w-12 h-12 rounded-full bg-[#E8998D]/20 border border-[#E8998D]/40 flex items-center justify-center text-[#B85D4D] group-hover:scale-105 transition-transform">
            <Gift className="w-6 h-6" />
          </div>
          <span className="font-serif text-2xl tracking-wider text-[#1A1817] font-semibold">
            ZENTRAVO
          </span>
        </Link>
        <h2 className="text-2xl font-serif font-bold text-[#1A1817] tracking-tight">
          Welcome to the Boutique
        </h2>
        <p className="mt-1 text-sm text-[#756C6A]">
          Sign in to access your orders, admin dashboard, or POS terminal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#EFECE8] rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#756C6A] mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A89F91]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0D9D1] focus:outline-none focus:ring-2 focus:ring-[#E8998D] text-sm bg-[#FAF8F5]/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#756C6A] mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A89F91]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0D9D1] focus:outline-none focus:ring-2 focus:ring-[#E8998D] text-sm bg-[#FAF8F5]/50 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-white bg-[#B85D4D] hover:bg-[#A04E40] active:scale-[0.99] transition shadow-sm disabled:opacity-50"
            >
              {loading ? (
                "Signing In..."
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials helper */}
          <div className="mt-6 pt-6 border-t border-[#F0EBE4]">
            <p className="text-xs font-medium text-[#756C6A] mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#B85D4D]" />
              Quick Fill Demo Accounts:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoCredentials("admin")}
                className="p-2 text-left rounded-lg bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#EBE5DC] text-[#3F3938] transition"
              >
                <span className="font-semibold block text-[#B85D4D]">Admin / Manager</span>
                <span className="text-[11px] text-[#756C6A]">admin@zentravo.com</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("cashier")}
                className="p-2 text-left rounded-lg bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#EBE5DC] text-[#3F3938] transition"
              >
                <span className="font-semibold block text-[#B85D4D]">POS Cashier</span>
                <span className="text-[11px] text-[#756C6A]">cashier@zentravo.com</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-[#756C6A]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-[#B85D4D] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
