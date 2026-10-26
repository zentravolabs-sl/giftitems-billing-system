"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Upload,
  X,
  Check,
  AlertCircle,
  Eye,
  Star,
  ExternalLink,
} from "lucide-react";
import { formatPrice } from "@/lib/currency";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductImage {
  id?: string;
  url: string;
  publicId?: string | null;
  isPrimary?: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode?: string | null;
  categoryId: string;
  category: Category;
  description?: string | null;
  buyingCost: number;
  sellingPrice: number;
  discountType: "NONE" | "PERCENTAGE" | "FIXED";
  discountValue: number;
  stockQuantity: number;
  minStockLevel: number;
  isActive: boolean;
  showOnWebsite: boolean;
  isFeatured: boolean;
  images: ProductImage[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    categoryId: "",
    description: "",
    buyingCost: 0,
    sellingPrice: 0,
    discountType: "NONE" as "NONE" | "PERCENTAGE" | "FIXED",
    discountValue: 0,
    stockQuantity: 0,
    minStockLevel: 5,
    isActive: true,
    showOnWebsite: true,
    isFeatured: false,
    images: [] as ProductImage[],
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(selectedCategory)}`),
        fetch("/api/categories"),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [search, selectedCategory]);

  function openCreateModal() {
    setEditingProduct(null);
    setFormData({
      name: "",
      sku: `ZGB-${Date.now().toString(36).toUpperCase()}`,
      barcode: "",
      categoryId: categories[0]?.id || "",
      description: "",
      buyingCost: 10,
      sellingPrice: 25,
      discountType: "NONE",
      discountValue: 0,
      stockQuantity: 10,
      minStockLevel: 5,
      isActive: true,
      showOnWebsite: true,
      isFeatured: false,
      images: [],
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(prod: Product) {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode || "",
      categoryId: prod.categoryId,
      description: prod.description || "",
      buyingCost: Number(prod.buyingCost),
      sellingPrice: Number(prod.sellingPrice),
      discountType: prod.discountType,
      discountValue: Number(prod.discountValue),
      stockQuantity: Number(prod.stockQuantity),
      minStockLevel: Number(prod.minStockLevel),
      isActive: prod.isActive,
      showOnWebsite: prod.showOnWebsite,
      isFeatured: prod.isFeatured,
      images: prod.images || [],
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      setFormData((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          {
            url: data.url,
            publicId: data.publicId,
            isPrimary: prev.images.length === 0,
          },
        ],
      }));
    } catch (err: any) {
      alert("Failed to upload image: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage(index: number) {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  }

  function setPrimaryImage(index: number) {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, idx) => ({
        ...img,
        isPrimary: idx === index,
      })),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(id: string, name: string) {
    setDeleteError(null);
    setDeleteTarget({ id, name });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      setDeleteTarget(null);
      setDeleteError(null);
      loadData();
    } catch (err: any) {
      setDeleteError(err.message || "An unexpected error occurred.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Product Catalogue</h1>
          <p className="text-xs text-[#756C6A] mt-0.5">
            Manage your boutique inventory, pricing, SKUs, and imagery
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#8F6B2A] text-white hover:bg-[#755518] shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Add New Product
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE5DD] shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827E]" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#E0D9D1] bg-[#FAF8F5]/50 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#8C827E]" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-[#E0D9D1] bg-[#FAF8F5]/50 focus:outline-none focus:ring-2 focus:ring-[#C5A059] text-[#5C5452]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-[#EAE5DD] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#756C6A] font-semibold border-b border-[#EAE5DD]">
              <tr>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-3">SKU / Barcode</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Cost</th>
                <th className="py-3 px-3 text-right">Price</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3 text-center">Visibility</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE4]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8C827E]">
                    Loading boutique catalogue...
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const primaryImage = p.images.find((img) => img.isPrimary)?.url || p.images[0]?.url || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=200&auto=format&fit=crop";
                  const stockNum = Number(p.stockQuantity);
                  const minStock = Number(p.minStockLevel);

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5]/60 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#FAF5EF] border border-[#EAE5DD] flex-shrink-0 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={primaryImage}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-[#1A1817] line-clamp-1">{p.name}</p>
                            {p.isFeatured && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded mt-0.5">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[#5C5452] block">{p.sku}</span>
                        {p.barcode && <span className="text-[10px] text-[#8C827E] font-mono">{p.barcode}</span>}
                      </td>
                      <td className="py-3 px-3 text-[#5C5452]">{p.category?.name || "Uncategorized"}</td>
                      <td className="py-3 px-3 text-right text-[#756C6A]">
                        {formatPrice(p.buyingCost)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-[#1A1817] block">
                          {formatPrice(p.sellingPrice)}
                        </span>
                        {p.discountType !== "NONE" && (
                          <span className="text-[10px] text-[#8F6B2A] font-medium">
                            {p.discountType === "PERCENTAGE" ? `-${p.discountValue}%` : `-${formatPrice(p.discountValue)}`}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            stockNum <= 0
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : stockNum <= minStock
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {stockNum} units
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              p.isActive ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                            title={p.isActive ? "Active" : "Archived"}
                          />
                          <span className="text-[11px] text-[#756C6A]">
                            {!p.isActive ? "Archived" : p.showOnWebsite ? "Online & POS" : "POS Only"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-[#5C5452] hover:bg-[#FAF8F5] hover:text-[#1A1817] transition"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                            title="Delete or Archive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8C827E]">
                    No items match your search. Click &ldquo;Add New Product&rdquo; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#EAE5DD] shadow-lg max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0EBE4]">
              <h2 className="font-serif font-bold text-lg text-[#1A1817]">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#756C6A] hover:bg-[#F3EFEA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Product Name */}
              <div>
                <label className="block font-semibold text-[#5C5452] mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Imperial Velvet Keepsake Hamper"
                  className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] focus:ring-2 focus:ring-[#C5A059] outline-none"
                />
              </div>

              {/* SKU & Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">SKU / Item Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 font-mono rounded-xl border border-[#E0D9D1] focus:ring-2 focus:ring-[#C5A059] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">Barcode (for Scanner)</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="e.g. 8934521001"
                    className="w-full px-3 py-2 font-mono rounded-xl border border-[#E0D9D1] focus:ring-2 focus:ring-[#C5A059] outline-none"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold text-[#5C5452] mb-1">Category *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] focus:ring-2 focus:ring-[#C5A059] outline-none"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pricing & Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">Buying Cost (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.buyingCost}
                    onChange={(e) => setFormData({ ...formData, buyingCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] focus:ring-2 focus:ring-[#C5A059] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">Selling Price (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] focus:ring-2 focus:ring-[#C5A059] outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">Discount</label>
                  <div className="flex gap-1">
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                      className="px-2 py-2 rounded-xl border border-[#E0D9D1] outline-none text-[11px]"
                    >
                      <option value="NONE">None</option>
                      <option value="PERCENTAGE">% Off</option>
                      <option value="FIXED">Rs. Off</option>
                    </select>
                    {formData.discountType !== "NONE" && (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-2 rounded-xl border border-[#E0D9D1] outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Stock Quantity & Reorder Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">
                    Stock Quantity {editingProduct && "(Managed via Inventory Movements)"}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    disabled={!!editingProduct}
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] focus:ring-2 focus:ring-[#C5A059] outline-none disabled:bg-[#FAF8F5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">
                    Low Stock Alert Level
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] focus:ring-2 focus:ring-[#C5A059] outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-[#5C5452] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details regarding materials, fragrance notes, artisan origin, presentation box..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] focus:ring-2 focus:ring-[#C5A059] outline-none"
                />
              </div>

              {/* Images */}
              <div>
                <label className="block font-semibold text-[#5C5452] mb-1">Product Images</label>
                <div className="flex flex-wrap gap-2 items-center mb-2">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E0D9D1] group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(idx)}
                        className={`absolute bottom-1 left-1 px-1 py-0.5 rounded text-[8px] font-bold ${
                          img.isPrimary ? "bg-[#8F6B2A] text-white" : "bg-black/60 text-white"
                        }`}
                      >
                        {img.isPrimary ? "Primary" : "Make Primary"}
                      </button>
                    </div>
                  ))}

                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-[#D0C7BC] hover:border-[#8F6B2A] flex flex-col items-center justify-center cursor-pointer text-[#756C6A] hover:text-[#8F6B2A] transition">
                    <Upload className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px] font-medium">{uploadingImage ? "..." : "Upload"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-[#F0EBE4] grid grid-cols-3 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-[#8F6B2A] focus:ring-[#8F6B2A]"
                  />
                  <span className="text-xs text-[#5C5452]">Active Item</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showOnWebsite}
                    onChange={(e) => setFormData({ ...formData, showOnWebsite: e.target.checked })}
                    className="w-4 h-4 rounded text-[#8F6B2A] focus:ring-[#8F6B2A]"
                  />
                  <span className="text-xs text-[#5C5452]">Website Store</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-[#8F6B2A] focus:ring-[#8F6B2A]"
                  />
                  <span className="text-xs text-[#5C5452]">Featured</span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-[#F0EBE4] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E0D9D1] text-[#756C6A] hover:bg-[#FAF8F5] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#8F6B2A] text-white font-medium hover:bg-[#755518] transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl border border-[#EAE5DD] shadow-2xl max-w-sm w-full p-6"
            style={{ animation: "fadeScaleIn 0.18s ease" }}
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 border border-rose-100 mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>

            {/* Text */}
            <h2 className="font-serif font-bold text-lg text-[#1A1817] text-center">Delete Product?</h2>
            <p className="mt-2 text-xs text-[#756C6A] text-center leading-relaxed">
              You are about to permanently delete or archive{" "}
              <span className="font-semibold text-[#1A1817]">&ldquo;{deleteTarget.name}&rdquo;</span>.
              This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{deleteError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-xl border border-[#E0D9D1] text-xs font-semibold text-[#756C6A] hover:bg-[#FAF8F5] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>

          <style>{`
            @keyframes fadeScaleIn {
              from { opacity: 0; transform: scale(0.95); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
