"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, Search, Filter, CheckCircle2, Clock, Truck, X, Eye, Package, Phone, Mail } from "lucide-react";
import { formatPrice } from "@/lib/currency";

interface OrderItem {
  id: string;
  productId: string;
  product: { name: string; sku: string };
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface WebsiteOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode?: string | null;
  orderNotes?: string | null;
  status: string;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  trackingNumber?: string | null;
  items: OrderItem[];
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<WebsiteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<WebsiteOrder | null>(null);
  const [updating, setUpdating] = useState(false);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  async function handleStatusChange(orderId: string, newStatus: string) {
    if (newStatus === "CANCELLED" && !confirm("Cancelling this order will restore reserved stock to inventory. Proceed?")) {
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Online Orders Fulfillment</h1>
          <p className="text-xs text-[#756C6A] mt-0.5">
            Manage customer website orders, shipping status, and dispatch tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8C827E]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-[#E0D9D1] bg-white outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Orders</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing / Packing</option>
            <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
            <option value="SHIPPED">Shipped</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#EAE5DD] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#756C6A] font-semibold border-b border-[#EAE5DD]">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Destination</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE4]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8C827E]">
                    Loading online orders...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF8F5]/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#1A1817]">{o.orderNumber}</td>
                    <td className="py-3 px-3 text-[#5C5452]">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-[#1A1817] block">{o.customerName}</span>
                      <span className="text-[10px] text-[#756C6A]">{o.customerPhone}</span>
                    </td>
                    <td className="py-3 px-3 text-[#5C5452] truncate max-w-xs">
                      {o.shippingCity}, {o.shippingAddress}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#1A1817]">
                      {formatPrice(o.grandTotal)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          o.status === "PENDING"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : o.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : o.status === "CANCELLED"
                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                            : "bg-blue-50 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {o.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="px-3 py-1 rounded-lg border border-[#E0D9D1] bg-[#FAF8F5] text-[#5C5452] hover:bg-[#F0EBE4] font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8C827E]">
                    No customer orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Status Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-2xl max-w-lg w-full p-6 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE4]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1A1817]">
                  Order {selectedOrder.orderNumber}
                </h3>
                <span className="text-[10px] text-[#756C6A]">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 rounded-lg text-[#756C6A] hover:bg-[#F3EFEA]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Update Ribbon */}
            <div className="mt-4 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DD] space-y-2">
              <label className="block font-semibold text-[#1A1817]">Fulfillment Status</label>
              <select
                disabled={updating}
                value={selectedOrder.status}
                onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] bg-white font-bold text-xs outline-none"
              >
                <option value="PENDING">PENDING (Review Order)</option>
                <option value="CONFIRMED">CONFIRMED (Payment Verified)</option>
                <option value="PROCESSING">PROCESSING (Packing in Boutique)</option>
                <option value="READY_FOR_DELIVERY">READY FOR DELIVERY (Courier Dispatched)</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="COMPLETED">COMPLETED (Delivered to Customer)</option>
                <option value="CANCELLED">CANCELLED (Restore Stock to Inventory)</option>
              </select>
            </div>

            {/* Customer & Shipping Details */}
            <div className="mt-4 grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FAF5EF] border border-[#EAE5DD]">
              <div>
                <span className="text-[10px] text-[#756C6A] uppercase font-semibold">Customer Info</span>
                <p className="font-bold text-[#1A1817] mt-0.5">{selectedOrder.customerName}</p>
                <p className="text-[#5C5452] flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-[#8F6B2A]" />
                  {selectedOrder.customerPhone}
                </p>
                <p className="text-[#5C5452] flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 text-[#8F6B2A]" />
                  {selectedOrder.customerEmail}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#756C6A] uppercase font-semibold">Delivery Address</span>
                <p className="text-[#1A1817] mt-0.5">{selectedOrder.shippingAddress}</p>
                <p className="text-[#5C5452] font-semibold">{selectedOrder.shippingCity}</p>
                {selectedOrder.orderNotes && (
                  <p className="text-[10px] text-[#8F6B2A] italic mt-1">Note: {selectedOrder.orderNotes}</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="mt-4 space-y-2 border-t border-[#F0EBE4] pt-3">
              <span className="font-semibold text-[#1A1817] block">Ordered Items</span>
              <div className="space-y-1.5">
                {selectedOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-[#F8F5F0]">
                    <div>
                      <span className="font-semibold text-[#1A1817] block">{it.product?.name || "Item"}</span>
                      <span className="text-[10px] text-[#756C6A]">
                        {formatPrice(it.unitPrice)} x {Number(it.quantity)}
                      </span>
                    </div>
                    <span className="font-bold text-[#1A1817]">{formatPrice(it.lineTotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="mt-4 pt-3 border-t border-[#F0EBE4] space-y-1">
              <div className="flex justify-between text-[#756C6A]">
                <span>Subtotal:</span>
                <span>{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              {Number(selectedOrder.deliveryFee) > 0 && (
                <div className="flex justify-between text-[#756C6A]">
                  <span>Delivery Fee:</span>
                  <span>{formatPrice(selectedOrder.deliveryFee)}</span>
                </div>
              )}
              {Number(selectedOrder.discountAmount) > 0 && (
                <div className="flex justify-between text-[#8F6B2A]">
                  <span>Coupon Discount:</span>
                  <span>-{formatPrice(selectedOrder.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-[#1A1817] pt-1 border-t border-[#EAE5DD]">
                <span>Grand Total:</span>
                <span className="text-[#8F6B2A]">{formatPrice(selectedOrder.grandTotal)}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-[#8F6B2A] text-white font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
