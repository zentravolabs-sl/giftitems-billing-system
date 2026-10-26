"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  DollarSign,
  PieChart,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  FileSpreadsheet,
} from "lucide-react";

export default function AdminReportsPage() {
  const [range, setRange] = useState("month");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/financial?range=${range}`);
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
    loadReports();
  }, [range]);

  function exportCSV() {
    if (!data?.productSales) return;
    const headers = "Product Name,SKU,Units Sold,Revenue,COGS,Gross Margin\n";
    const rows = data.productSales
      .map(
        (p: any) =>
          `"${p.name}","${p.sku}",${p.qty},${p.revenue.toFixed(2)},${p.cogs.toFixed(2)},${(p.revenue - p.cogs).toFixed(2)}`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Zentravo_Sales_Report_${range}_${Date.now()}.csv`;
    a.click();
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Financial & Sales Reports</h1>
          <p className="text-xs text-[#756C6A] mt-0.5">
            Real-time profit & loss, COGS accounting, and multi-channel metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Range Pills */}
          <div className="p-1 rounded-xl bg-[#FAF8F5] border border-[#EAE5DD] flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setRange("today")}
              className={`px-3 py-1 rounded-lg transition ${
                range === "today" ? "bg-[#B85D4D] text-white" : "text-[#756C6A] hover:text-[#1A1817]"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setRange("week")}
              className={`px-3 py-1 rounded-lg transition ${
                range === "week" ? "bg-[#B85D4D] text-white" : "text-[#756C6A] hover:text-[#1A1817]"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRange("month")}
              className={`px-3 py-1 rounded-lg transition ${
                range === "month" ? "bg-[#B85D4D] text-white" : "text-[#756C6A] hover:text-[#1A1817]"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setRange("all")}
              className={`px-3 py-1 rounded-lg transition ${
                range === "all" ? "bg-[#B85D4D] text-white" : "text-[#756C6A] hover:text-[#1A1817]"
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-[#E0D9D1] text-[#5C5452] hover:bg-[#FAF8F5] shadow-2xs flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-[#B85D4D]" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#EAE5DD] shadow-2xs">
          <span className="text-[10px] font-bold text-[#8C827E] uppercase tracking-wider">Net Sales Revenue</span>
          <p className="text-2xl font-serif font-bold text-[#1A1817] mt-2">
            ${data?.summary.totalNetSales.toFixed(2) || "0.00"}
          </p>
          <p className="text-[11px] text-[#756C6A] mt-1">{data?.summary.invoicesCount || 0} completed invoices</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#EAE5DD] shadow-2xs">
          <span className="text-[10px] font-bold text-[#8C827E] uppercase tracking-wider">Cost of Goods Sold (COGS)</span>
          <p className="text-2xl font-serif font-bold text-[#5C5452] mt-2">
            ${data?.summary.totalCOGS.toFixed(2) || "0.00"}
          </p>
          <p className="text-[11px] text-[#756C6A] mt-1">Based on snapshot unit cost at sale</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#EAE5DD] shadow-2xs">
          <span className="text-[10px] font-bold text-[#8C827E] uppercase tracking-wider">Gross Profit</span>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-2">
            ${data?.summary.grossProfit.toFixed(2) || "0.00"}
          </p>
          <p className="text-[11px] text-[#756C6A] mt-1">
            Margin:{" "}
            {data?.summary.totalNetSales > 0
              ? `${((data.summary.grossProfit / data.summary.totalNetSales) * 100).toFixed(1)}%`
              : "0%"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#EAE5DD] shadow-2xs">
          <span className="text-[10px] font-bold text-[#8C827E] uppercase tracking-wider">Average Bill Value</span>
          <p className="text-2xl font-serif font-bold text-[#B85D4D] mt-2">
            ${data?.summary.averageBillValue.toFixed(2) || "0.00"}
          </p>
          <p className="text-[11px] text-[#756C6A] mt-1">Per transaction average</p>
        </div>
      </div>

      {/* Channel & Tender Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Channel Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DD] shadow-2xs space-y-3">
          <h3 className="font-serif font-bold text-sm text-[#1A1817] flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-[#B85D4D]" />
            Sales Channel Breakdown
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5]">
              <span className="font-semibold text-[#1A1817]">Point of Sale (POS Terminal)</span>
              <span className="font-bold text-[#1A1817]">
                ${data?.channelBreakdown.POS ? data.channelBreakdown.POS.toFixed(2) : "0.00"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5]">
              <span className="font-semibold text-[#1A1817]">Website E-Commerce Orders</span>
              <span className="font-bold text-[#1A1817]">
                ${data?.channelBreakdown.WEBSITE ? data.channelBreakdown.WEBSITE.toFixed(2) : "0.00"}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DD] shadow-2xs space-y-3">
          <h3 className="font-serif font-bold text-sm text-[#1A1817] flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-[#B85D4D]" />
            Payment Tender Breakdown
          </h3>
          <div className="space-y-2 text-xs">
            {data?.paymentBreakdown && Object.keys(data.paymentBreakdown).length > 0 ? (
              Object.entries(data.paymentBreakdown).map(([method, amount]: any) => (
                <div key={method} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5]">
                  <span className="font-semibold text-[#1A1817]">{method}</span>
                  <span className="font-bold text-[#1A1817]">${amount.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-[#8C827E]">No payment records in selected period</p>
            )}
          </div>
        </div>
      </div>

      {/* Product-wise Sales Table */}
      <div className="bg-white rounded-2xl border border-[#EAE5DD] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#EAE5DD] flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-[#1A1817]">Item-wise Sales & Profit Contribution</h3>
          <span className="text-[11px] text-[#756C6A]">{data?.productSales?.length || 0} unique gift items sold</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#756C6A] font-semibold border-b border-[#EAE5DD]">
              <tr>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3 text-center">Units Sold</th>
                <th className="py-3 px-3 text-right">Revenue</th>
                <th className="py-3 px-3 text-right">COGS</th>
                <th className="py-3 px-4 text-right">Gross Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE4]">
              {data?.productSales && data.productSales.length > 0 ? (
                data.productSales.map((p: any) => {
                  const profit = p.revenue - p.cogs;
                  return (
                    <tr key={p.sku} className="hover:bg-[#FAF8F5]/60 transition">
                      <td className="py-3 px-4 font-semibold text-[#1A1817]">{p.name}</td>
                      <td className="py-3 px-3 font-mono text-[#756C6A]">{p.sku}</td>
                      <td className="py-3 px-3 text-center font-bold text-[#1A1817]">{p.qty}</td>
                      <td className="py-3 px-3 text-right text-[#1A1817]">${p.revenue.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right text-[#756C6A]">${p.cogs.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">${profit.toFixed(2)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#8C827E]">
                    No product sales recorded in this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
