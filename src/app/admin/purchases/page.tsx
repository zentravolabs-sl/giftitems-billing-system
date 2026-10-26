"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  X,
  AlertCircle,
  FileText,
  DollarSign,
  Trash2,
} from "lucide-react";
import { formatPrice } from "@/lib/currency";

interface Supplier {
  id: string;
  name: string;
  phone?: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  buyingCost: number;
}

interface PurchaseItem {
  id?: string;
  productId: string;
  product?: Product;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  lineTotal: number;
}

interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplier: Supplier;
  invoiceNumber?: string | null;
  purchaseDate: string;
  status: "ORDERED" | "RECEIVED" | "PARTIALLY_RECEIVED" | "CANCELLED";
  subtotal: number;
  discount: number;
  additionalCost: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  notes?: string | null;
  items: PurchaseItem[];
  createdBy?: { name: string };
  createdAt: string;
}

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<"ORDERED" | "RECEIVED">("RECEIVED");
  const [discount, setDiscount] = useState(0);
  const [additionalCost, setAdditionalCost] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Array<{ productId: string; quantityOrdered: number; unitCost: number }>>([
    { productId: "", quantityOrdered: 10, unitCost: 15 },
  ]);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [purRes, supRes, prodRes] = await Promise.all([
        fetch("/api/purchases"),
        fetch("/api/suppliers"),
        fetch("/api/products?limit=200"),
      ]);

      if (purRes.ok) {
        const purData = await purRes.json();
        setPurchases(purData.purchases || []);
      }
      if (supRes.ok) {
        const supData = await supRes.json();
        setSuppliers(supData.suppliers || []);
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
  }, []);

  function openCreateModal() {
    setSupplierId(suppliers[0]?.id || "");
    setInvoiceNumber(`INV-${Date.now().toString(36).toUpperCase()}`);
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setStatus("RECEIVED");
    setDiscount(0);
    setAdditionalCost(0);
    setPaidAmount(0);
    setPaymentMethod("CASH");
    setNotes("");
    setItems([
      {
        productId: products[0]?.id || "",
        quantityOrdered: 20,
        unitCost: Number(products[0]?.buyingCost || 15),
      },
    ]);
    setFormError(null);
    setIsModalOpen(true);
  }

  function addItemRow() {
    setItems([
      ...items,
      {
        productId: products[0]?.id || "",
        quantityOrdered: 10,
        unitCost: Number(products[0]?.buyingCost || 10),
      },
    ]);
  }

  function removeItemRow(index: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  }

  function updateItemRow(index: number, field: string, val: any) {
    const next = [...items];
    if (field === "productId") {
      next[index].productId = val;
      const matchedProd = products.find((p) => p.id === val);
      if (matchedProd) {
        next[index].unitCost = Number(matchedProd.buyingCost);
      }
    } else if (field === "quantityOrdered") {
      next[index].quantityOrdered = parseFloat(val) || 0;
    } else if (field === "unitCost") {
      next[index].unitCost = parseFloat(val) || 0;
    }
    setItems(next);
  }

  const subtotal = items.reduce((acc, it) => acc + it.quantityOrdered * it.unitCost, 0);
  const grandTotal = Math.max(0, subtotal - discount + additionalCost);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const validItems = items.filter((it) => it.productId && it.quantityOrdered > 0);
    if (validItems.length === 0) {
      setFormError("Please select at least one valid product and quantity.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          invoiceNumber,
          purchaseDate,
          status,
          items: validItems,
          discount,
          additionalCost,
          paidAmount,
          paymentMethod,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create purchase order");

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
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Purchasing & GRN</h1>
          <p className="text-xs text-[#756C6A] mt-0.5">
            Receive supplier shipments, calculate weighted-average costs, and update inventory
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#8F6B2A] text-white hover:bg-[#755518] shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Receive Stock (GRN)
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-[#EAE5DD] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#756C6A] font-semibold border-b border-[#EAE5DD]">
              <tr>
                <th className="py-3 px-4">PO / GRN #</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Items Count</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-right">Paid / Due</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE4]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8C827E]">
                    Loading purchase records...
                  </td>
                </tr>
              ) : purchases.length > 0 ? (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF8F5]/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#8F6B2A]" />
                        <div>
                          <span className="font-bold text-[#1A1817] block font-mono">{p.purchaseNumber}</span>
                          {p.invoiceNumber && (
                            <span className="text-[10px] text-[#756C6A]">Inv: {p.invoiceNumber}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-[#1A1817] block">{p.supplier?.name}</span>
                      <span className="text-[10px] text-[#756C6A]">{p.supplier?.phone || "No phone"}</span>
                    </td>
                    <td className="py-3 px-3 text-[#5C5452]">
                      {new Date(p.purchaseDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-[#FAF5EF] text-[#5C5452] font-medium">
                        {p.items?.length || 0} product lines
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#1A1817]">
                      {formatPrice(p.grandTotal)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-emerald-700 block font-semibold">
                        Paid: {formatPrice(p.paidAmount)}
                      </span>
                      {Number(p.balanceDue) > 0 && (
                        <span className="text-rose-600 text-[10px] block">
                          Due: {formatPrice(p.balanceDue)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === "RECEIVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : p.status === "ORDERED"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.status === "RECEIVED" && <CheckCircle2 className="w-3 h-3" />}
                        {p.status === "ORDERED" && <Clock className="w-3 h-3" />}
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8C827E]">
                    No purchase orders recorded yet. Click &ldquo;Receive Stock (GRN)&rdquo; to record shipments.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receive Stock Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#EAE5DD] shadow-lg max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE4]">
              <h2 className="font-serif font-bold text-lg text-[#1A1817]">
                Record Goods Received Note (GRN)
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#756C6A] hover:bg-[#F3EFEA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">Supplier *</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">Supplier Invoice #</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">Receiving Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] outline-none font-semibold text-[#8F6B2A]"
                  >
                    <option value="RECEIVED">RECEIVED (Updates Stock & Weighted Avg Cost)</option>
                    <option value="ORDERED">ORDERED (Pending Delivery)</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-[#1A1817]">Received Product Items</span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs text-[#8F6B2A] font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Product Line
                  </button>
                </div>

                <div className="space-y-2 border border-[#EAE5DD] rounded-xl p-3 bg-[#FAF8F5]/50">
                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <select
                          required
                          value={it.productId}
                          onChange={(e) => updateItemRow(idx, "productId", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#E0D9D1] bg-white outline-none text-xs"
                        >
                          <option value="">Select Product...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={it.quantityOrdered}
                          onChange={(e) => updateItemRow(idx, "quantityOrdered", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#E0D9D1] bg-white outline-none text-xs text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="Unit Cost (Rs.)"
                          value={it.unitCost}
                          onChange={(e) => updateItemRow(idx, "unitCost", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#E0D9D1] bg-white outline-none text-xs"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length <= 1}
                          className="p-1 rounded text-red-500 hover:bg-red-50 disabled:opacity-20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-[#756C6A] mb-1">Discount (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E0D9D1] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#756C6A] mb-1">Shipping / Fees (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={additionalCost}
                    onChange={(e) => setAdditionalCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E0D9D1] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#756C6A] mb-1">Amount Paid (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E0D9D1] outline-none font-bold text-emerald-700"
                  />
                </div>
                <div className="bg-[#FAF5EF] p-2 rounded-xl text-right">
                  <span className="text-[10px] text-[#756C6A] block">Grand Total</span>
                  <span className="font-serif font-bold text-base text-[#1A1817]">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#5C5452] mb-1">Purchase Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Received shipment in pristine condition via air freight"
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
                  {submitting ? "Processing Transaction..." : "Confirm & Receive Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
