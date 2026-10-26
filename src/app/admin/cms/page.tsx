"use client";

import React, { useState, useEffect } from "react";
import { Globe, Save, CheckCircle, AlertCircle, Upload, Eye } from "lucide-react";

export default function AdminCmsPage() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadContent() {
    setLoading(true);
    try {
      const res = await fetch("/api/content");
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContent();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(false);

    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      if (!res.ok) throw new Error("Failed to save website content");
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>, field: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setContent({ ...content, [field]: data.url });
    } catch (err: any) {
      alert("Failed to upload: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading || !content) {
    return <div className="p-8 text-center text-[#8C827E]">Loading CMS settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Website Content & CMS</h1>
          <p className="text-xs text-[#756C6A] mt-0.5">
            Modify promotional banners, story pages, and boutique policies in real-time
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#B85D4D] text-white hover:bg-[#A04E40] shadow-xs transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Publishing Changes..." : "Publish to Boutique"}
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Website content updated and published live!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Top Announcement Bar */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DD] shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-sm text-[#1A1817] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B85D4D]" />
            Promotional Announcement Banner (Navbar Ribbon)
          </h2>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="promoActive"
              checked={content.promoBannerActive}
              onChange={(e) => setContent({ ...content, promoBannerActive: e.target.checked })}
              className="w-4 h-4 rounded text-[#B85D4D]"
            />
            <label htmlFor="promoActive" className="font-medium text-[#5C5452]">
              Enable announcement bar at top of website
            </label>
          </div>

          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">Banner Announcement Text</label>
            <input
              type="text"
              value={content.promoBannerText || ""}
              onChange={(e) => setContent({ ...content, promoBannerText: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">Banner Link (e.g. /offers or /shop)</label>
            <input
              type="text"
              value={content.promoBannerLink || ""}
              onChange={(e) => setContent({ ...content, promoBannerLink: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none font-mono"
            />
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DD] shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-sm text-[#1A1817] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B85D4D]" />
            Homepage Hero Showcase
          </h2>

          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">Hero Main Heading</label>
            <input
              type="text"
              value={content.heroTitle || ""}
              onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none font-serif text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">Hero Subtitle</label>
            <textarea
              rows={2}
              value={content.heroSubtitle || ""}
              onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#5C5452] mb-1">Button Text</label>
              <input
                type="text"
                value={content.heroButtonText || ""}
                onChange={(e) => setContent({ ...content, heroButtonText: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5C5452] mb-1">Button Link</label>
              <input
                type="text"
                value={content.heroButtonLink || ""}
                onChange={(e) => setContent({ ...content, heroButtonLink: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">Hero Background Image</label>
            <div className="flex items-center gap-3">
              {content.heroImageUrl && (
                <div className="w-24 h-14 rounded-lg overflow-hidden border border-[#E0D9D1]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={content.heroImageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <input
                type="text"
                placeholder="Image URL or upload below"
                value={content.heroImageUrl || ""}
                onChange={(e) => setContent({ ...content, heroImageUrl: e.target.value })}
                className="flex-1 px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
              />
              <label className="px-3 py-2 rounded-xl border border-[#D0C7BC] hover:border-[#B85D4D] cursor-pointer text-[#5C5452] font-medium flex items-center gap-1.5 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleBannerUpload(e, "heroImageUrl")}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* About Us Story */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DD] shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-sm text-[#1A1817] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B85D4D]" />
            About Us & Brand Heritage Story
          </h2>

          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">About Us Title</label>
            <input
              type="text"
              value={content.aboutUsTitle || ""}
              onChange={(e) => setContent({ ...content, aboutUsTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none font-serif"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">About Us Narrative</label>
            <textarea
              rows={4}
              value={content.aboutUsContent || ""}
              onChange={(e) => setContent({ ...content, aboutUsContent: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
            />
          </div>
        </div>

        {/* Policies */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DD] shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-sm text-[#1A1817] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B85D4D]" />
            Store Policies & Customer Commitments
          </h2>

          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">Delivery & Shipping Policy</label>
            <textarea
              rows={2}
              value={content.deliveryPolicy || ""}
              onChange={(e) => setContent({ ...content, deliveryPolicy: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">Return & Refund Policy</label>
            <textarea
              rows={2}
              value={content.returnPolicy || ""}
              onChange={(e) => setContent({ ...content, returnPolicy: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">Privacy Policy Overview</label>
            <textarea
              rows={2}
              value={content.privacyPolicy || ""}
              onChange={(e) => setContent({ ...content, privacyPolicy: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5C5452] mb-1">Terms & Conditions Overview</label>
            <textarea
              rows={2}
              value={content.termsPolicy || ""}
              onChange={(e) => setContent({ ...content, termsPolicy: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DD] shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-sm text-[#1A1817] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B85D4D]" />
            Social Media & Community Handles
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#5C5452] mb-1">Instagram URL</label>
              <input
                type="text"
                value={content.instagramUrl || ""}
                onChange={(e) => setContent({ ...content, instagramUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5C5452] mb-1">Facebook URL</label>
              <input
                type="text"
                value={content.facebookUrl || ""}
                onChange={(e) => setContent({ ...content, facebookUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5C5452] mb-1">TikTok URL</label>
              <input
                type="text"
                value={content.tiktokUrl || ""}
                onChange={(e) => setContent({ ...content, tiktokUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5C5452] mb-1">Pinterest URL</label>
              <input
                type="text"
                value={content.pinterestUrl || ""}
                onChange={(e) => setContent({ ...content, pinterestUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 text-xs font-semibold rounded-xl bg-[#B85D4D] text-white hover:bg-[#A04E40] shadow-sm transition disabled:opacity-50"
          >
            {saving ? "Publishing Changes..." : "Publish Website Content"}
          </button>
        </div>
      </form>
    </div>
  );
}
