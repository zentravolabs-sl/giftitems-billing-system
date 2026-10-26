"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingBag,
  Truck,
  ArrowUpRight,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatPrice } from "@/lib/currency";

interface DashboardData {
  metrics: {
    todaySales: number;
    todayOrdersCount: number;
    monthSales: number;
    monthOrdersCount: number;
    grossProfit: number;
    netProfit: number;
    monthPurchases: number;
    inventoryValuation: number;
    lowStockCount: number;
    outOfStockCount: number;
    pendingOrdersCount: number;
  };
  recentSales: any[];
  lowStockAlerts: any[];
  bestSellers: any[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Executive Dashboard</h1>
          <p className="text-xs text-[#756C6A] mt-0.5">
            Real-time business performance and stock valuation metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-[#E0D9D1] bg-white hover:bg-[#FAF8F5] text-[#5C5452] shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
          <Link
            href="/pos"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#8F6B2A] text-white hover:bg-[#755518] shadow-xs transition"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Open POS Register
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DD] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8C827E] uppercase tracking-wider">
              Today&apos;s Sales
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-serif font-bold text-[#1A1817]">
              {formatPrice(data?.metrics.todaySales)}
            </p>
            <p className="text-[11px] text-[#756C6A] mt-1">
              {data?.metrics.todayOrdersCount || 0} completed invoices today
            </p>
          </div>
        </div>

        {/* Month Sales */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DD] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8C827E] uppercase tracking-wider">
              Month Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-serif font-bold text-[#1A1817]">
              {formatPrice(data?.metrics.monthSales)}
            </p>
            <p className="text-[11px] text-[#756C6A] mt-1">
              {data?.metrics.monthOrdersCount || 0} bills this month
            </p>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DD] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8C827E] uppercase tracking-wider">
              Gross Profit
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-serif font-bold text-[#1A1817]">
              {formatPrice(data?.metrics.grossProfit)}
            </p>
            <p className="text-[11px] text-[#756C6A] mt-1">
              Net Revenue minus COGS
            </p>
          </div>
        </div>

        {/* Current Inventory Value */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DD] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8C827E] uppercase tracking-wider">
              Inventory Value
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#C5A059]/20 text-[#8F6B2A] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-serif font-bold text-[#1A1817]">
              {formatPrice(data?.metrics.inventoryValuation)}
            </p>
            <p className="text-[11px] text-[#756C6A] mt-1">
              At current weighted average cost
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Highlights Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#EAE5DD] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#8F6B2A] flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-[#756C6A] block">Stock Alerts</span>
            <span className="font-bold text-sm text-[#1A1817]">
              {data?.metrics.lowStockCount || 0} Low Stock / {data?.metrics.outOfStockCount || 0} Out
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#EAE5DD] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-[#756C6A] block">Pending Online Orders</span>
            <span className="font-bold text-sm text-[#1A1817]">
              {data?.metrics.pendingOrdersCount || 0} Awaiting Fulfillment
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#EAE5DD] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-[#756C6A] block">Purchases This Month</span>
            <span className="font-bold text-sm text-[#1A1817]">
              {formatPrice(data?.metrics.monthPurchases)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Sales & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5DD] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif font-bold text-base text-[#1A1817]">Recent Invoices</h2>
              <p className="text-xs text-[#756C6A]">Latest completed POS & online sales</p>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-semibold text-[#8F6B2A] hover:underline flex items-center gap-1"
            >
              View All Invoices
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#756C6A] font-semibold border-b border-[#EAE5DD]">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE4]">
                {data?.recentSales && data.recentSales.length > 0 ? (
                  data.recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-[#FAF8F5]/60 transition">
                      <td className="py-3 px-3 font-semibold text-[#1A1817]">{sale.invoiceNumber}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            sale.channel === "POS"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {sale.channel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#5C5452]">
                        {sale.customer?.name || "Walk-in Guest"}
                      </td>
                      <td className="py-3 px-3 text-[#756C6A]">{sale.items?.length || 0} lines</td>
                      <td className="py-3 px-3 text-right font-bold text-[#1A1817]">
                        {formatPrice(sale.grandTotal)}
                      </td>
                      <td className="py-3 px-3 text-right text-[#8C827E]">
                        {new Date(sale.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#968E88]">
                      No transactions recorded yet. Complete a checkout in POS to see live data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts & Best Sellers */}
        <div className="space-y-6">
          {/* Low Stock Watchlist */}
          <div className="bg-white rounded-2xl border border-[#EAE5DD] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif font-bold text-sm text-[#1A1817] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Inventory Watchlist
              </h2>
              <Link href="/admin/inventory" className="text-[11px] text-[#8F6B2A] font-medium hover:underline">
                Manage Stock
              </Link>
            </div>

            <div className="space-y-2.5">
              {data?.lowStockAlerts && data.lowStockAlerts.length > 0 ? (
                data.lowStockAlerts.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DD] flex items-center justify-between text-xs"
                  >
                    <div className="truncate pr-2">
                      <p className="font-semibold text-[#1A1817] truncate">{item.name}</p>
                      <p className="text-[10px] text-[#756C6A]">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          Number(item.stockQuantity) <= 0
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {Number(item.stockQuantity)} left
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[#756C6A] bg-[#FAF8F5] rounded-xl">
                  All inventory levels are currently above reorder thresholds.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FAF5EF] to-[#F5EBE1] border border-[#C5A059]/30 shadow-xs">
            <h3 className="font-serif font-bold text-sm text-[#1A1817] flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-[#8F6B2A]" />
              Quick Shop Management
            </h3>
            <p className="text-xs text-[#5C5452] mb-3">
              Add new arrivals, receive supplier orders, or customize the customer boutique.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/admin/products"
                className="py-2 px-3 rounded-lg bg-white border border-[#E0D9D1] text-[#3F3938] font-medium text-center hover:bg-[#FAF8F5] transition"
              >
                + Add Product
              </Link>
              <Link
                href="/admin/purchases"
                className="py-2 px-3 rounded-lg bg-white border border-[#E0D9D1] text-[#3F3938] font-medium text-center hover:bg-[#FAF8F5] transition"
              >
                + Receive GRN
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
