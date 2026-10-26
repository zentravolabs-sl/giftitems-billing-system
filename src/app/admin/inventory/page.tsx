"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  X,
  CheckCircle,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
}

interface InventoryMovement {
  id: string;
  productId: string;
  product: { id: string; name: string; sku: string };
  movementType: string;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  unitCost: number;
  referenceDocument?: string | null;
  notes?: string | null;
  createdBy?: { name: string; role: string } | null;
  createdAt: string;
}

export default function AdminInventoryPage() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [movementTypeFilter, setMovementTypeFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState("");
  const [adjustedStock, setAdjustedStock] = useState<number>(0);
  const [reason, setReason] = useState("PHYSICAL_COUNT");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [movRes, prodRes] = await Promise.all([
        fetch(`/api/inventory/movements?movementType=${movementTypeFilter}`),
        fetch("/api/products?limit=200"),
      ]);

      if (movRes.ok) {
        const movData = await movRes.json();
        setMovements(movData.movements || []);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [movementTypeFilter]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  function openAdjustmentModal() {
    const first = products[0];
    setSelectedProductId(first?.id || "");
    setAdjustedStock(Number(first?.stockQuantity || 0));
    setReason("PHYSICAL_COUNT");
    setNotes("");
    setFormError(null);
    setIsModalOpen(true);
  }

  async function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProductId) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          adjustedStock,
          reason,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to adjust stock");

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Inventory Movement Ledger</h1>
          <p className="text-xs text-[#756C6A] mt-0.5">
            Immutable audit trail of all stock receiving, POS sales, web orders, and manual adjustments
          </p>
        </div>

        <button
          onClick={openAdjustmentModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#8F6B2A] text-white hover:bg-[#755518] shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Stock Adjustment
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE5DD] shadow-xs flex items-center gap-3">
        <Filter className="w-4 h-4 text-[#8C827E]" />
        <select
          value={movementTypeFilter}
          onChange={(e) => setMovementTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-[#E0D9D1] bg-[#FAF8F5]/50 outline-none text-[#5C5452]"
        >
          <option value="">All Movement Types</option>
          <option value="PURCHASE_RECEIVE">Purchase Receiving (GRN)</option>
          <option value="POS_SALE">POS Sales</option>
          <option value="WEB_SALE">Website Sales</option>
          <option value="STOCK_ADJUSTMENT">Stock Adjustment</option>
          <option value="DAMAGED">Damaged Goods</option>
          <option value="CUSTOMER_RETURN">Customer Returns</option>
          <option value="OPENING_STOCK">Opening Stock</option>
        </select>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-[#EAE5DD] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#756C6A] font-semibold border-b border-[#EAE5DD]">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Reference</th>
                <th className="py-3 px-3 text-center">Change</th>
                <th className="py-3 px-3 text-center">Previous → New</th>
                <th className="py-3 px-3 text-right">Cost</th>
                <th className="py-3 px-4">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE4]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8C827E]">
                    Loading inventory ledger...
                  </td>
                </tr>
              ) : movements.length > 0 ? (
                movements.map((m) => {
                  const changeNum = Number(m.quantityChange);
                  const isPositive = changeNum > 0;

                  return (
                    <tr key={m.id} className="hover:bg-[#FAF8F5]/60 transition">
                      <td className="py-3 px-4 text-[#5C5452]">
                        <span className="block font-medium">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-[#8C827E]">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-[#1A1817] block line-clamp-1">
                          {m.product?.name}
                        </span>
                        <span className="font-mono text-[10px] text-[#8C827E]">
                          SKU: {m.product?.sku}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            m.movementType === "PURCHASE_RECEIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : m.movementType.includes("SALE")
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : m.movementType === "DAMAGED"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {m.movementType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#5C5452]">
                        {m.referenceDocument || "—"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-0.5 font-bold ${
                            isPositive ? "text-emerald-700" : "text-rose-600"
                          }`}
                        >
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {isPositive ? `+${changeNum}` : `${changeNum}`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[#5C5452]">
                        {Number(m.previousStock)} → <span className="font-bold text-[#1A1817]">{Number(m.newStock)}</span>
                      </td>
                      <td className="py-3 px-3 text-right text-[#756C6A]">
                        ${Number(m.unitCost).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-[#756C6A]">
                        <span className="block font-medium text-[#1A1817]">
                          {m.createdBy?.name || "System"}
                        </span>
                        {m.notes && <span className="text-[10px] text-[#8C827E] block truncate max-w-xs">{m.notes}</span>}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8C827E]">
                    No inventory movements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#EAE5DD] shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE4]">
              <h2 className="font-serif font-bold text-base text-[#1A1817]">
                Record Physical Stock Adjustment
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#756C6A] hover:bg-[#F3EFEA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#5C5452] mb-1">Product *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const p = products.find((x) => x.id === e.target.value);
                    if (p) setAdjustedStock(Number(p.stockQuantity));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current: {Number(p.stockQuantity)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DD] flex items-center justify-between">
                <span className="text-[#756C6A]">Recorded System Stock:</span>
                <span className="font-bold text-[#1A1817]">
                  {selectedProduct ? Number(selectedProduct.stockQuantity) : 0} units
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#5C5452] mb-1">
                  Actual Physical Stock Count *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustedStock}
                  onChange={(e) => setAdjustedStock(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] font-bold text-base outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#5C5452] mb-1">Reason for Difference *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
                >
                  <option value="PHYSICAL_COUNT">Routine Physical Stock Count</option>
                  <option value="DAMAGED">Damaged / Broken in Showroom</option>
                  <option value="THEFT">Shrinkage / Unexplained Loss</option>
                  <option value="EXPIRY">Expired Confectionery / Scent</option>
                  <option value="CORRECTION">Data Entry Correction</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#5C5452] mb-1">Audit Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Broken cloche glass bell during display reset"
                  className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[#F0EBE4] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E0D9D1] text-[#756C6A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#8F6B2A] text-white font-medium hover:bg-[#755518] disabled:opacity-50"
                >
                  {submitting ? "Writing Ledger..." : "Apply Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
