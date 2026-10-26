"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Save, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return <div className="p-8 text-center text-[#8C827E]">Loading store settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Boutique Settings & POS Configuration</h1>
          <p className="text-xs text-[#756C6A] mt-0.5">
            Configure business identity, tax calculation, receipt branding, and thresholds
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#B85D4D] text-white hover:bg-[#A04E40] shadow-xs transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Settings successfully applied!</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-[#EAE5DD] shadow-xs space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">Shop Name *</label>
            <input
              type="text"
              required
              value={settings.shopName || ""}
              onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none font-semibold text-sm"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">Legal Entity Name</label>
            <input
              type="text"
              value={settings.legalName || ""}
              onChange={(e) => setSettings({ ...settings, legalName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#5C5452] mb-1">Tagline</label>
          <input
            type="text"
            value={settings.tagline || ""}
            onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-[#5C5452] mb-1">Showroom Address</label>
          <input
            type="text"
            value={settings.address || ""}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">Phone Number</label>
            <input
              type="text"
              value={settings.phone || ""}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">WhatsApp Number (e.g. 18005554438)</label>
            <input
              type="text"
              value={settings.whatsappNumber || ""}
              onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">Contact Email</label>
            <input
              type="email"
              value={settings.email || ""}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">Opening Hours</label>
            <input
              type="text"
              value={settings.openingHours || ""}
              onChange={(e) => setSettings({ ...settings, openingHours: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">Currency Symbol</label>
            <input
              type="text"
              value={settings.currencySymbol || "$"}
              onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none font-bold"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">Invoice Prefix</label>
            <input
              type="text"
              value={settings.invoicePrefix || "ZGB-"}
              onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none font-mono"
            />
          </div>
        </div>

        {/* Tax Configuration */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DD] space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enableTax"
              checked={settings.enableTax}
              onChange={(e) => setSettings({ ...settings, enableTax: e.target.checked })}
              className="w-4 h-4 rounded text-[#B85D4D]"
            />
            <label htmlFor="enableTax" className="font-semibold text-[#1A1817]">
              Apply Sales Tax / VAT to POS and Website Invoices
            </label>
          </div>

          {settings.enableTax && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-medium text-[#756C6A] mb-1">Tax Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={settings.taxPercentage || 0}
                  onChange={(e) => setSettings({ ...settings, taxPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] bg-white outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-[#756C6A] mb-1">Tax Registration Number</label>
                <input
                  type="text"
                  value={settings.taxNumber || ""}
                  onChange={(e) => setSettings({ ...settings, taxNumber: e.target.value })}
                  placeholder="e.g. TAX-9988231-A"
                  className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] bg-white outline-none font-mono"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block font-semibold text-[#5C5452] mb-1">Receipt Footer Message</label>
          <input
            type="text"
            value={settings.receiptFooterMessage || ""}
            onChange={(e) => setSettings({ ...settings, receiptFooterMessage: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
          />
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-[#B85D4D] text-white hover:bg-[#A04E40] shadow-sm transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
