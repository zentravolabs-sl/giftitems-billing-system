"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Search,
  Barcode,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  Percent,
  CreditCard,
  Banknote,
  Layers,
  Clock,
  Printer,
  Share2,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  History,
  Undo2,
  FileSpreadsheet,
  Settings as SettingsIcon,
  X,
  ArrowRight,
  LogOut,
  Maximize,
  HelpCircle,
} from "lucide-react";
import { formatPrice } from "@/lib/currency";
import {
  cacheProducts,
  getCachedProducts,
  cacheCustomers,
  getCachedCustomers,
  cacheSettings,
  getCachedSettings,
  saveOfflineSale,
  getPendingOfflineSales,
  updateOfflineSaleStatus,
  OfflineSaleRecord,
} from "@/lib/offline-db";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  categoryId: string;
  category?: Category;
  buyingCost: number;
  sellingPrice: number;
  discountType: "NONE" | "PERCENTAGE" | "FIXED";
  discountValue: number;
  stockQuantity: number;
  images: Array<{ url: string; isPrimary?: boolean }>;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  lineDiscount: number;
}

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  loyaltyPoints?: number;
}

interface HeldBill {
  id: string;
  timestamp: string;
  items: CartItem[];
  customer: Customer | null;
  cartDiscount: number;
}

export default function PosPage() {
  const router = useRouter();

  // Navigation State (POS has NO sidebar; clean top-bar tabs)
  const [activeTab, setActiveTab] = useState<"register" | "history" | "returns" | "summary">("register");

  // Core Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const currencySymbol = storeSettings?.currencySymbol || "Rs.";
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Connectivity & Sync
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Register State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [cartDiscountType, setCartDiscountType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isHeldBillsOpen, setIsHeldBillsOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Checkout Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "SPLIT" | "GIFT_VOUCHER">("CASH");
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitCard, setSplitCard] = useState<number>(0);
  const [cardTerminalRef, setCardTerminalRef] = useState<string>("");
  const [cardLast4, setCardLast4] = useState<string>("");
  const [checkoutNotes, setCheckoutNotes] = useState<string>("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Completed Sale / Receipt State
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [receiptType, setReceiptType] = useState<"thermal" | "a4">("thermal");
  const [whatsAppPhone, setWhatsAppPhone] = useState<string>("");

  // Customer Fast-Create Form State
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");

  // Past Sales History
  const [pastSales, setPastSales] = useState<any[]>([]);
  const [salesHistorySearch, setSalesHistorySearch] = useState("");

  // References
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial Load & Network Status Monitoring
  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    loadInitialData();
    checkPendingQueue();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 2. Global Keyboard Shortcuts (F2, F4, F8, F9, F10, Esc)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        setIsCustomerModalOpen(true);
      } else if (e.key === "F8") {
        e.preventDefault();
        handleHoldBill();
      } else if (e.key === "F9") {
        e.preventDefault();
        setIsDiscountModalOpen(true);
      } else if (e.key === "F10") {
        e.preventDefault();
        if (cart.length > 0) openCheckout();
      } else if (e.key === "Escape") {
        setIsCheckoutOpen(false);
        setIsCustomerModalOpen(false);
        setIsDiscountModalOpen(false);
        setIsHeldBillsOpen(false);
        setIsReceiptOpen(false);
        setIsShortcutsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, selectedCustomer, cartDiscount]);

  // Load Data: Online first with IndexedDB cache fallback
  async function loadInitialData() {
    try {
      const [userRes, setRes, prodRes, catRes, custRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/settings"),
        fetch("/api/products?limit=300"),
        fetch("/api/categories"),
        fetch("/api/customers"),
      ]);

      if (userRes.ok) {
        const u = await userRes.json();
        setCurrentUser(u.user);
      }
      if (setRes.ok) {
        const s = await setRes.json();
        setStoreSettings(s.settings);
        cacheSettings(s.settings);
      }
      if (prodRes.ok) {
        const p = await prodRes.json();
        setProducts(p.products || []);
        cacheProducts(p.products || []);
      }
      if (catRes.ok) {
        const c = await catRes.json();
        setCategories(c.categories || []);
      }
      if (custRes.ok) {
        const cu = await custRes.json();
        setCustomers(cu.customers || []);
        cacheCustomers(cu.customers || []);
      }
    } catch {
      // Offline fallback: load from IndexedDB
      console.warn("Network unreachable, restoring from IndexedDB offline storage");
      const [cachedProds, cachedCusts, cachedSets] = await Promise.all([
        getCachedProducts(),
        getCachedCustomers(),
        getCachedSettings(),
      ]);
      setProducts(cachedProds);
      setCustomers(cachedCusts);
      if (cachedSets) setStoreSettings(cachedSets);
    }
  }

  async function checkPendingQueue() {
    try {
      const pending = await getPendingOfflineSales();
      setPendingSyncCount(pending.length);
    } catch {
      // IndexedDB not ready
    }
  }

  // Trigger safe sync of offline queue
  async function triggerSync() {
    try {
      const pending = await getPendingOfflineSales();
      if (pending.length === 0) return;

      setIsSyncing(true);
      const res = await fetch("/api/pos/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sales: pending }),
      });

      if (res.ok) {
        const data = await res.json();
        for (const item of data.results || []) {
          if (item.status === "SYNCED" || item.status === "DUPLICATE") {
            await updateOfflineSaleStatus(item.id, "SYNCED");
          } else {
            await updateOfflineSaleStatus(item.id, "FAILED", item.error);
          }
        }
        checkPendingQueue();
        loadInitialData();
      }
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setIsSyncing(false);
    }
  }

  // Load Sales History
  async function loadSalesHistory() {
    try {
      const res = await fetch(`/api/pos/sales?search=${encodeURIComponent(salesHistorySearch)}`);
      if (res.ok) {
        const data = await res.json();
        setPastSales(data.sales || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (activeTab === "history") {
      loadSalesHistory();
    }
  }, [activeTab, salesHistorySearch]);

  // Product Selection & Barcode Scanning Handling
  function addToCart(product: Product) {
    if (product.stockQuantity <= 0) {
      alert(`Warning: "${product.name}" is currently out of stock. You can still bill, but stock will go negative.`);
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }

      // Check product-level discount
      let price = Number(product.sellingPrice);
      let lineDiscount = 0;
      if (product.discountType === "PERCENTAGE") {
        lineDiscount = (price * Number(product.discountValue)) / 100;
      } else if (product.discountType === "FIXED") {
        lineDiscount = Number(product.discountValue);
      }

      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: price,
          lineDiscount,
        },
      ];
    });
  }

  function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Search exact barcode or SKU first
    const matched = products.find(
      (p) =>
        p.barcode?.trim().toLowerCase() === searchQuery.trim().toLowerCase() ||
        p.sku.trim().toLowerCase() === searchQuery.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setSearchQuery("");
    }
  }

  function updateQuantity(index: number, delta: number) {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  }

  function setDirectQuantity(index: number, qty: number) {
    if (qty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      updated[index].quantity = qty;
      return updated;
    });
  }

  function removeFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  function clearCart() {
    if (cart.length === 0) return;
    if (confirm("Clear current cart?")) {
      setCart([]);
      setSelectedCustomer(null);
      setCartDiscount(0);
    }
  }

  // Hold & Resume Bills
  function handleHoldBill() {
    if (cart.length === 0) return;
    const newHold: HeldBill = {
      id: `HOLD-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: [...cart],
      customer: selectedCustomer,
      cartDiscount,
    };
    setHeldBills((prev) => [newHold, ...prev]);
    setCart([]);
    setSelectedCustomer(null);
    setCartDiscount(0);
    alert(`Bill held successfully as ${newHold.id}`);
  }

  function resumeBill(held: HeldBill) {
    if (cart.length > 0 && !confirm("Replace current active cart with this held bill?")) {
      return;
    }
    setCart(held.items);
    setSelectedCustomer(held.customer);
    setCartDiscount(held.cartDiscount);
    setHeldBills((prev) => prev.filter((h) => h.id !== held.id));
    setIsHeldBillsOpen(false);
  }

  // Financial Computations
  const subtotal = cart.reduce(
    (acc, it) => acc + Math.max(0, it.quantity * it.unitPrice - it.lineDiscount * it.quantity),
    0
  );

  const calculatedDiscount =
    cartDiscountType === "PERCENTAGE" ? (subtotal * cartDiscount) / 100 : cartDiscount;

  const discountedSubtotal = Math.max(0, subtotal - calculatedDiscount);
  const taxRate = storeSettings?.enableTax ? Number(storeSettings.taxPercentage || 0) / 100 : 0;
  const taxAmount = Math.round(discountedSubtotal * taxRate * 100) / 100;
  const grandTotal = Math.round((discountedSubtotal + taxAmount) * 100) / 100;

  // Checkout Initiation
  function openCheckout() {
    if (cart.length === 0) return;
    setCashTendered(grandTotal);
    setSplitCash(Math.floor(grandTotal / 2));
    setSplitCard(Math.round((grandTotal - Math.floor(grandTotal / 2)) * 100) / 100);
    setCardTerminalRef("");
    setCardLast4("");
    setCheckoutError(null);
    setIsCheckoutOpen(true);
  }

  // Checkout Execution (Online API with safe fallback to offline queue)
  async function handleCompleteCheckout() {
    setCheckoutError(null);
    setCheckoutLoading(true);

    try {
      // Build payments structure
      let payments: any[] = [];
      let amountPaid = 0;
      let changeAmount = 0;

      if (paymentMethod === "CASH") {
        if (cashTendered < grandTotal) {
          throw new Error(`Tendered cash (${formatPrice(cashTendered, currencySymbol)}) is less than total (${formatPrice(grandTotal, currencySymbol)})`);
        }
        amountPaid = cashTendered;
        changeAmount = Math.round((cashTendered - grandTotal) * 100) / 100;
        payments = [{ method: "CASH", amount: grandTotal }];
      } else if (paymentMethod === "CARD") {
        amountPaid = grandTotal;
        changeAmount = 0;
        payments = [
          {
            method: "CARD",
            amount: grandTotal,
            cardLast4,
            cardTerminalRef: cardTerminalRef || `AUTH-${Date.now().toString(36).toUpperCase()}`,
          },
        ];
      } else if (paymentMethod === "SPLIT") {
        const splitSum = Math.round((splitCash + splitCard) * 100) / 100;
        if (Math.abs(splitSum - grandTotal) > 0.05) {
          throw new Error(`Split tender (${formatPrice(splitSum, currencySymbol)}) does not match bill total (${formatPrice(grandTotal, currencySymbol)})`);
        }
        amountPaid = splitSum;
        changeAmount = 0;
        payments = [
          { method: "CASH", amount: splitCash },
          {
            method: "CARD",
            amount: splitCard,
            cardLast4,
            cardTerminalRef: cardTerminalRef || `AUTH-${Date.now().toString(36).toUpperCase()}`,
          },
        ];
      } else {
        amountPaid = grandTotal;
        payments = [{ method: "GIFT_VOUCHER", amount: grandTotal }];
      }

      const clientUuid = crypto.randomUUID();
      const localInvoice = `${storeSettings?.invoicePrefix || "ZGB-"}${Date.now().toString(36).toUpperCase()}`;

      const salePayload = {
        customerId: selectedCustomer?.id || null,
        items: cart.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          lineDiscount: it.lineDiscount * it.quantity,
        })),
        cartDiscount: calculatedDiscount,
        payments,
        amountPaid,
        changeAmount,
        notes: checkoutNotes,
        syncId: clientUuid,
      };

      let finalizedSale: any = null;

      if (isOnline) {
        try {
          const res = await fetch("/api/pos/sale", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(salePayload),
          });

          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.error || "Failed to process online checkout");
          }

          const resData = await res.json();
          finalizedSale = resData.sale;
        } catch (onlineErr: any) {
          console.warn("Online checkout request failed; falling back to offline IndexedDB queue:", onlineErr);
        }
      }

      // If online failed or currently offline, persist to durable IndexedDB queue
      if (!finalizedSale) {
        const offlineRecord: OfflineSaleRecord = {
          id: clientUuid,
          invoiceNumber: localInvoice,
          items: cart.map((it) => ({
            productId: it.product.id,
            productName: it.product.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            lineDiscount: it.lineDiscount * it.quantity,
            lineTotal: it.quantity * it.unitPrice - it.lineDiscount * it.quantity,
          })),
          customerId: selectedCustomer?.id || null,
          customerName: selectedCustomer?.name || "Walk-in Guest",
          cartDiscount: calculatedDiscount,
          subtotal,
          taxAmount,
          grandTotal,
          payments,
          amountPaid,
          changeAmount,
          notes: checkoutNotes,
          createdAt: new Date().toISOString(),
          syncStatus: "PENDING",
        };

        await saveOfflineSale(offlineRecord);
        await checkPendingQueue();

        finalizedSale = {
          ...offlineRecord,
          isOffline: true,
          cashier: { name: currentUser?.name || "Cashier" },
          customer: selectedCustomer,
        };
      }

      // Prepare receipt
      setCompletedSale(finalizedSale);
      setWhatsAppPhone(selectedCustomer?.phone || "");
      setIsCheckoutOpen(false);
      setIsReceiptOpen(true);

      // Reset cart
      setCart([]);
      setSelectedCustomer(null);
      setCartDiscount(0);
      setCheckoutNotes("");

      // Update local product stocks
      loadInitialData();
    } catch (err: any) {
      setCheckoutError(err.message || "Failed to complete checkout");
    } finally {
      setCheckoutLoading(false);
    }
  }

  // Quick Customer Creation
  async function handleQuickCustomerCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustName,
          phone: newCustPhone,
          email: newCustEmail,
        }),
      });

      if (!res.ok) throw new Error("Failed to create customer");
      const data = await res.json();

      setCustomers((prev) => [data.customer, ...prev]);
      setSelectedCustomer(data.customer);
      setIsCustomerModalOpen(false);
      setNewCustName("");
      setNewCustPhone("");
      setNewCustEmail("");
    } catch (err: any) {
      alert(err.message);
    }
  }

  // WhatsApp Message Generator
  function openWhatsAppReceipt() {
    if (!completedSale) return;
    const cleanPhone = whatsAppPhone.replace(/[^0-9]/g, "");
    if (!cleanPhone) {
      alert("Please enter a valid customer WhatsApp number with country code (e.g. 14155557788)");
      return;
    }

    const itemsSummary = completedSale.items
      .map(
        (it: any) =>
          `• ${it.product?.name || it.productName || "Item"} x${it.quantity} - ${formatPrice(it.lineTotal, currencySymbol)}`
      )
      .join("\n");

    const message = `✨ *${storeSettings?.shopName || "Oak Bloom"}* ✨\n` +
      `Thank you for shopping with us!\n\n` +
      `🧾 *Invoice:* ${completedSale.invoiceNumber}\n` +
      `📅 *Date:* ${new Date(completedSale.createdAt).toLocaleDateString()}\n` +
      `👤 *Customer:* ${completedSale.customer?.name || "Valued Guest"}\n\n` +
      `*Items Purchased:*\n${itemsSummary}\n\n` +
      `💰 *Subtotal:* ${formatPrice(completedSale.subtotal, currencySymbol)}\n` +
      (Number(completedSale.cartDiscount) > 0 ? `🏷️ *Discount:* -${formatPrice(completedSale.cartDiscount, currencySymbol)}\n` : "") +
      (Number(completedSale.taxAmount) > 0 ? `🏛️ *Tax:* ${formatPrice(completedSale.taxAmount, currencySymbol)}\n` : "") +
      `*Grand Total:* ${formatPrice(completedSale.grandTotal, currencySymbol)}\n\n` +
      `🔗 *View Digital Receipt:* ${window.location.origin}/pos/receipt/${completedSale.invoiceNumber}\n\n` +
      `${storeSettings?.receiptFooterMessage || "Glow Naturally, Bloom Beautifully. Thank you for supporting handmade & local ♥"}`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  }

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "all" || p.category?.slug === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="h-screen flex flex-col bg-[#F8F6F2] text-[#2B2625] select-none overflow-hidden">
      {/* 1. TOP NAVBAR (NO SIDEBAR - Clean Operational POS Bar) */}
      <nav className="h-14 bg-white border-b border-[#EAE5DD] px-4 flex items-center justify-between z-30 flex-shrink-0 shadow-2xs">
        {/* Left: Brand & Navigation Tabs */}
        <div className="flex items-center gap-6">
          <Link href="/pos" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#C5A059]/40 flex items-center justify-center font-bold">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="Oak Bloom" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-serif font-bold text-sm tracking-wider block text-[#1A1817]">
                OAK BLOOM POS
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#8C827E] block leading-none">
                Register #01
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1 border-l border-[#EAE5DD] pl-4">
            <button
              onClick={() => setActiveTab("register")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === "register"
                  ? "bg-[#8F6B2A] text-white shadow-2xs"
                  : "text-[#5C5452] hover:bg-[#FAF8F5]"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Register (F10)
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === "history"
                  ? "bg-[#8F6B2A] text-white shadow-2xs"
                  : "text-[#5C5452] hover:bg-[#FAF8F5]"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Sales History
            </button>

            <button
              onClick={() => setActiveTab("returns")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === "returns"
                  ? "bg-[#8F6B2A] text-white shadow-2xs"
                  : "text-[#5C5452] hover:bg-[#FAF8F5]"
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
              Returns
            </button>

            <button
              onClick={() => setActiveTab("summary")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === "summary"
                  ? "bg-[#8F6B2A] text-white shadow-2xs"
                  : "text-[#5C5452] hover:bg-[#FAF8F5]"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Day Summary
            </button>
          </div>
        </div>

        {/* Right: Connectivity, Sync, Cashier, Shortcuts, and Exit */}
        <div className="flex items-center gap-3">
          {/* Online / Offline Status Badge */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isOnline
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-300 animate-pulse"
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
            <span>{isOnline ? "Online" : "Offline Mode"}</span>
          </div>

          {/* Sync Queue Badge */}
          {pendingSyncCount > 0 && (
            <button
              onClick={triggerSync}
              disabled={!isOnline || isSyncing}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 flex items-center gap-1 transition"
              title="Click to sync offline transactions"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{pendingSyncCount} Pending Sync</span>
            </button>
          )}

          {/* Held Bills Counter */}
          {heldBills.length > 0 && (
            <button
              onClick={() => setIsHeldBillsOpen(true)}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 flex items-center gap-1 transition"
            >
              <Clock className="w-3 h-3" />
              <span>{heldBills.length} Held (F8)</span>
            </button>
          )}

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="p-1.5 rounded-lg text-[#756C6A] hover:bg-[#FAF8F5] transition"
            title="Keyboard Shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Cashier Badge */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#EAE5DD]">
            <div className="w-7 h-7 rounded-full bg-[#C5A059]/20 text-[#8F6B2A] flex items-center justify-center font-bold text-xs uppercase">
              {currentUser?.name?.[0] || "C"}
            </div>
            <div className="text-left text-xs leading-none">
              <span className="font-semibold text-[#1A1817] block truncate max-w-[120px]">
                {currentUser?.name || "Sophia (Cashier)"}
              </span>
              <span className="text-[10px] text-[#756C6A]">Active Shift</span>
            </div>
          </div>

          {/* Admin Switcher & Exit */}
          <Link
            href="/admin"
            className="p-1.5 rounded-lg text-[#756C6A] hover:bg-[#FAF8F5] hover:text-[#1A1817] transition"
            title="Back to Admin Dashboard"
          >
            <SettingsIcon className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* 2. MAIN REGISTER SCREEN */}
      {activeTab === "register" && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Area: Product Catalogue, Barcode & Category Grid (65% width) */}
          <div className="flex-1 flex flex-col border-r border-[#EAE5DD] overflow-hidden bg-white">
            {/* Search & Barcode Input Bar */}
            <div className="p-3 bg-white border-b border-[#EAE5DD] flex items-center gap-2">
              <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C827E]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Scan barcode, enter SKU, or search item... (F2)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-[#E0D9D1] bg-[#FAF8F5]/60 focus:outline-none focus:ring-2 focus:ring-[#C5A059] text-[#1A1817] font-medium"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#8C827E] hover:text-[#8F6B2A]"
                  title="Barcode scan submit"
                >
                  <Barcode className="w-5 h-5" />
                </button>
              </form>

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-2.5 py-2 text-xs rounded-xl border border-[#E0D9D1] text-[#756C6A] hover:bg-[#FAF8F5]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="px-3 py-2 bg-[#FAF8F5] border-b border-[#EAE5DD] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === "all"
                    ? "bg-[#8F6B2A] text-white shadow-2xs"
                    : "bg-white text-[#5C5452] border border-[#E0D9D1] hover:bg-[#F3EFEA]"
                }`}
              >
                All Items ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === c.slug
                      ? "bg-[#8F6B2A] text-white shadow-2xs"
                      : "bg-white text-[#5C5452] border border-[#E0D9D1] hover:bg-[#F3EFEA]"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Product Card Grid */}
            <div className="flex-1 overflow-y-auto p-3.5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 bg-[#FAF8F5]/30">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const img = p.images[0]?.url || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=200&auto=format&fit=crop";
                  const stockNum = Number(p.stockQuantity);
                  const isOutOfStock = stockNum <= 0;

                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="bg-white rounded-xl border border-[#EAE5DD] p-2.5 text-left flex flex-col justify-between hover:border-[#8F6B2A] hover:shadow-xs transition active:scale-[0.98] group relative"
                    >
                      {/* Image Thumbnail */}
                      <div className="w-full aspect-square rounded-lg bg-[#FAF5EF] overflow-hidden mb-2 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        {p.discountType !== "NONE" && (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#8F6B2A] text-white">
                            {p.discountType === "PERCENTAGE" ? `-${p.discountValue}%` : `-${formatPrice(p.discountValue, currencySymbol)}`}
                          </span>
                        )}
                        <span
                          className={`absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isOutOfStock
                              ? "bg-red-600 text-white"
                              : stockNum <= 5
                              ? "bg-amber-600 text-white"
                              : "bg-black/60 text-white"
                          }`}
                        >
                          {stockNum} in stock
                        </span>
                      </div>

                      {/* Info */}
                      <div>
                        <h4 className="font-semibold text-xs text-[#1A1817] line-clamp-2 leading-tight">
                          {p.name}
                        </h4>
                        <span className="font-mono text-[10px] text-[#8C827E] block mt-0.5">
                          {p.sku}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="mt-2 pt-2 border-t border-[#F0EBE4] flex items-center justify-between">
                        <span className="font-serif font-bold text-sm text-[#1A1817]">
                          {formatPrice(p.sellingPrice, currencySymbol)}
                        </span>
                        <div className="w-6 h-6 rounded-md bg-[#FAF5EF] text-[#8F6B2A] flex items-center justify-center group-hover:bg-[#8F6B2A] group-hover:text-white transition">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="col-span-full py-16 text-center text-[#8C827E]">
                  <Store className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No products matched &ldquo;{searchQuery}&rdquo;</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Area: Shopping Cart & Checkout Panel (35% width) */}
          <div className="w-full md:w-96 lg:w-[420px] bg-white flex flex-col justify-between flex-shrink-0 shadow-lg border-l border-[#EAE5DD]">
            {/* Cart Header & Customer Assignment */}
            <div className="p-3 border-b border-[#EAE5DD] bg-[#FAF8F5]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#1A1817]">
                  Current Order ({cart.reduce((a, b) => a + b.quantity, 0)} items)
                </span>
                <button
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="text-[11px] font-semibold text-rose-600 hover:underline disabled:opacity-30"
                >
                  Clear Cart
                </button>
              </div>

              {/* Customer Selector Ribbon */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E0D9D1]">
                <div className="flex items-center gap-2 overflow-hidden">
                  <User className="w-4 h-4 text-[#8F6B2A] flex-shrink-0" />
                  <div className="truncate text-xs">
                    {selectedCustomer ? (
                      <>
                        <span className="font-bold text-[#1A1817] block truncate">
                          {selectedCustomer.name}
                        </span>
                        <span className="text-[10px] text-[#756C6A]">
                          {selectedCustomer.phone || "No phone"} • {selectedCustomer.loyaltyPoints || 0} pts
                        </span>
                      </>
                    ) : (
                      <span className="text-[#8C827E]">Walk-in Guest (F4)</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {selectedCustomer && (
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="p-1 rounded text-[#756C6A] hover:bg-[#F3EFEA]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-[#FAF5EF] text-[#8F6B2A] hover:bg-[#F0EBE4]"
                  >
                    {selectedCustomer ? "Change" : "+ Customer"}
                  </button>
                </div>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#F0EBE4] p-3 space-y-2">
              {cart.length > 0 ? (
                cart.map((item, idx) => {
                  const lineTotal = item.quantity * item.unitPrice - item.lineDiscount * item.quantity;
                  return (
                    <div key={item.product.id} className="pt-2 flex items-center justify-between gap-2 text-xs">
                      <div className="flex-1 pr-2">
                        <p className="font-semibold text-[#1A1817] line-clamp-1">{item.product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-[#756C6A]">{formatPrice(item.unitPrice, currencySymbol)} each</span>
                          {item.lineDiscount > 0 && (
                            <span className="text-[10px] text-[#8F6B2A]">
                              -{formatPrice(item.lineDiscount * item.quantity, currencySymbol)} off
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(idx, -1)}
                          className="w-6 h-6 rounded bg-[#FAF5EF] text-[#5C5452] flex items-center justify-center hover:bg-[#EAE5DD]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => setDirectQuantity(idx, parseInt(e.target.value) || 0)}
                          className="w-8 py-0.5 text-center font-bold text-xs rounded border border-[#E0D9D1]"
                        />
                        <button
                          onClick={() => updateQuantity(idx, 1)}
                          className="w-6 h-6 rounded bg-[#FAF5EF] text-[#5C5452] flex items-center justify-center hover:bg-[#EAE5DD]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Total & Remove */}
                      <div className="text-right pl-2 flex items-center gap-2">
                        <span className="font-bold text-[#1A1817] w-14">
                          {formatPrice(lineTotal, currencySymbol)}
                        </span>
                        <button
                          onClick={() => removeFromCart(idx)}
                          className="text-[#8C827E] hover:text-red-600 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center text-[#8C827E]">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Cart is currently empty</p>
                  <p className="text-[11px] text-[#A89F91] mt-0.5">
                    Click any product or scan barcode to begin billing
                  </p>
                </div>
              )}
            </div>

            {/* Cart Totals & Checkout Actions */}
            <div className="p-4 bg-[#FAF8F5] border-t border-[#EAE5DD] space-y-2 text-xs">
              <div className="flex justify-between text-[#756C6A]">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, currencySymbol)}</span>
              </div>

              {calculatedDiscount > 0 && (
                <div className="flex justify-between text-[#8F6B2A] font-medium">
                  <span>Cart Discount</span>
                  <span>-{formatPrice(calculatedDiscount, currencySymbol)}</span>
                </div>
              )}

              {taxRate > 0 && (
                <div className="flex justify-between text-[#756C6A]">
                  <span>Tax ({storeSettings?.taxPercentage}%)</span>
                  <span>{formatPrice(taxAmount, currencySymbol)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#EAE5DD] flex justify-between items-baseline">
                <span className="font-serif font-bold text-sm text-[#1A1817]">Grand Total</span>
                <span className="font-serif font-bold text-xl text-[#8F6B2A]">
                  {formatPrice(grandTotal, currencySymbol)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(true)}
                  disabled={cart.length === 0}
                  className="py-2 px-3 rounded-xl border border-[#E0D9D1] bg-white text-[#5C5452] font-semibold hover:bg-[#F3EFEA] flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  <Percent className="w-3.5 h-3.5" />
                  Discount (F9)
                </button>
                <button
                  type="button"
                  onClick={handleHoldBill}
                  disabled={cart.length === 0}
                  className="py-2 px-3 rounded-xl border border-[#E0D9D1] bg-white text-[#5C5452] font-semibold hover:bg-[#F3EFEA] flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Hold (F8)
                </button>
              </div>

              <button
                type="button"
                onClick={openCheckout}
                disabled={cart.length === 0}
                className="w-full mt-1 py-3 px-4 rounded-xl bg-[#8F6B2A] hover:bg-[#755518] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-40 active:scale-[0.99]"
              >
                <span>Pay / Checkout (F10)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SALES HISTORY TAB */}
      {activeTab === "history" && (
        <div className="flex-1 p-6 overflow-y-auto max-w-6xl w-full mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-xl text-[#1A1817]">POS Sales History</h2>
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827E]" />
              <input
                type="text"
                placeholder="Search invoice # or customer phone..."
                value={salesHistorySearch}
                onChange={(e) => setSalesHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#E0D9D1] bg-white outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EAE5DD] shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#756C6A] font-semibold border-b border-[#EAE5DD]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Receipt & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE4]">
                {pastSales.length > 0 ? (
                  pastSales.map((s) => (
                    <tr key={s.id} className="hover:bg-[#FAF8F5]/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#1A1817]">{s.invoiceNumber}</td>
                      <td className="py-3 px-3 text-[#5C5452]">
                        {new Date(s.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-[#1A1817] block">{s.customer?.name || "Walk-in Guest"}</span>
                        {s.customer?.phone && <span className="text-[10px] text-[#756C6A]">{s.customer.phone}</span>}
                      </td>
                      <td className="py-3 px-3 text-[#5C5452]">{s.items?.length || 0} items</td>
                      <td className="py-3 px-3 text-right font-bold text-[#1A1817]">
                        {formatPrice(s.grandTotal, currencySymbol)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setCompletedSale(s);
                            setWhatsAppPhone(s.customer?.phone || "");
                            setIsReceiptOpen(true);
                          }}
                          className="px-3 py-1 rounded-lg border border-[#E0D9D1] text-[#5C5452] hover:bg-[#FAF8F5] text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#8F6B2A]" />
                          Reprint / WhatsApp
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#8C827E]">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. RETURNS TAB */}
      {activeTab === "returns" && (
        <div className="flex-1 p-6 overflow-y-auto max-w-4xl w-full mx-auto space-y-4">
          <h2 className="font-serif font-bold text-xl text-[#1A1817]">Customer Item Returns</h2>
          <p className="text-xs text-[#756C6A]">
            Restock customer returned items with automatic inventory balance reconciliation
          </p>

          <div className="bg-white p-6 rounded-2xl border border-[#EAE5DD] shadow-xs space-y-4 text-xs">
            <p className="text-[#5C5452]">
              To process a return, find the customer&apos;s invoice in the &ldquo;Sales History&rdquo; tab, or enter the invoice number below:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Invoice # (e.g. ZGB-...)"
                className="flex-1 px-3 py-2 rounded-xl border border-[#E0D9D1] font-mono outline-none"
              />
              <button
                type="button"
                onClick={() => alert("Invoice lookup: Returns can be performed directly on confirmed invoice records.")}
                className="px-4 py-2 bg-[#8F6B2A] text-white rounded-xl font-semibold"
              >
                Lookup Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. REGISTER SUMMARY TAB */}
      {activeTab === "summary" && (
        <div className="flex-1 p-6 overflow-y-auto max-w-4xl w-full mx-auto space-y-6">
          <h2 className="font-serif font-bold text-xl text-[#1A1817]">Cash Register & Shift Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#EAE5DD] shadow-xs">
              <span className="text-xs text-[#756C6A] uppercase font-semibold">Today&apos;s POS Invoices</span>
              <p className="text-2xl font-serif font-bold text-[#1A1817] mt-2">{pastSales.length}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#EAE5DD] shadow-xs">
              <span className="text-xs text-[#756C6A] uppercase font-semibold">Total Revenue</span>
              <p className="text-2xl font-serif font-bold text-emerald-700 mt-2">
                {formatPrice(pastSales.reduce((a, b) => a + Number(b.grandTotal), 0), currencySymbol)}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#EAE5DD] shadow-xs">
              <span className="text-xs text-[#756C6A] uppercase font-semibold">Current Cashier</span>
              <p className="text-base font-bold text-[#1A1817] mt-2">{currentUser?.name || "Sophia Brooks"}</p>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODALS ---------------- */}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-2xl max-w-lg w-full p-6 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE4]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1A1817]">Checkout Tender</h3>
                <p className="text-[11px] text-[#756C6A]">Select payment method and confirm tender</p>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-1 rounded-lg text-[#756C6A] hover:bg-[#F3EFEA]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutError && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Total Display */}
            <div className="mt-4 p-4 rounded-2xl bg-[#FAF5EF] border border-[#C5A059]/30 text-center">
              <span className="text-xs text-[#756C6A] uppercase font-semibold">Grand Total Due</span>
              <p className="text-3xl font-serif font-bold text-[#8F6B2A] mt-1">
                {formatPrice(grandTotal, currencySymbol)}
              </p>
            </div>

            {/* Tender Method Selector */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`py-2.5 px-3 rounded-xl border flex flex-col items-center gap-1 font-bold transition ${
                  paymentMethod === "CASH"
                    ? "bg-[#8F6B2A] text-white border-[#8F6B2A]"
                    : "bg-white text-[#5C5452] border-[#E0D9D1] hover:bg-[#FAF8F5]"
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={`py-2.5 px-3 rounded-xl border flex flex-col items-center gap-1 font-bold transition ${
                  paymentMethod === "CARD"
                    ? "bg-[#8F6B2A] text-white border-[#8F6B2A]"
                    : "bg-white text-[#5C5452] border-[#E0D9D1] hover:bg-[#FAF8F5]"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Card Terminal</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("SPLIT")}
                className={`py-2.5 px-3 rounded-xl border flex flex-col items-center gap-1 font-bold transition ${
                  paymentMethod === "SPLIT"
                    ? "bg-[#8F6B2A] text-white border-[#8F6B2A]"
                    : "bg-white text-[#5C5452] border-[#E0D9D1] hover:bg-[#FAF8F5]"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Split Tender</span>
              </button>
            </div>

            {/* Cash Payment Details */}
            {paymentMethod === "CASH" && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">Cash Tendered ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-base font-bold rounded-xl border border-[#E0D9D1] outline-none"
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTendered(amt)}
                      className="py-1.5 rounded-lg border border-[#E0D9D1] bg-[#FAF8F5] font-bold text-[#1A1817] hover:bg-[#F0EBE4]"
                    >
                      {currencySymbol} {amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashTendered(grandTotal)}
                    className="py-1.5 rounded-lg border border-[#E0D9D1] bg-[#FAF8F5] font-bold text-[#8F6B2A] hover:bg-[#F0EBE4]"
                  >
                    Exact
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DD] flex items-center justify-between">
                  <span className="font-semibold text-[#5C5452]">Change Due to Customer:</span>
                  <span className="font-serif font-bold text-base text-emerald-700">
                    {formatPrice(Math.max(0, cashTendered - grandTotal), currencySymbol)}
                  </span>
                </div>
              </div>
            )}

            {/* Card Payment Details */}
            {paymentMethod === "CARD" && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">Terminal Authorization / Ref #</label>
                  <input
                    type="text"
                    value={cardTerminalRef}
                    onChange={(e) => setCardTerminalRef(e.target.value)}
                    placeholder="e.g. TXN-884920"
                    className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5C5452] mb-1">Card Last 4 Digits (Optional)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value)}
                    placeholder="e.g. 4242"
                    className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] font-mono outline-none"
                  />
                </div>
              </div>
            )}

            {/* Split Tender Details */}
            {paymentMethod === "SPLIT" && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#5C5452] mb-1">Cash Component ({currencySymbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      value={splitCash}
                      onChange={(e) => setSplitCash(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#5C5452] mb-1">Card Component ({currencySymbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      value={splitCard}
                      onChange={(e) => setSplitCard(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E0D9D1] font-bold outline-none"
                    />
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF8F5] text-center">
                  <span className="text-[11px] text-[#756C6A]">
                    Reconciled: {formatPrice(splitCash + splitCard, currencySymbol)} of {formatPrice(grandTotal, currencySymbol)}
                  </span>
                </div>
              </div>
            )}

            {/* Note */}
            <div className="mt-3">
              <label className="block font-medium text-[#756C6A] mb-1">Receipt Note (Optional)</label>
              <input
                type="text"
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                placeholder="e.g. Custom décor arrangement with ribbon"
                className="w-full px-3 py-1.5 rounded-xl border border-[#E0D9D1] outline-none"
              />
            </div>

            <div className="mt-5 pt-3 border-t border-[#F0EBE4] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E0D9D1] text-[#756C6A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteCheckout}
                disabled={checkoutLoading}
                className="px-6 py-2.5 rounded-xl bg-[#8F6B2A] text-white font-bold hover:bg-[#755518] transition disabled:opacity-50"
              >
                {checkoutLoading ? "Processing Sale..." : "Confirm & Print Receipt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DUAL RECEIPT & WHATSAPP MODAL */}
      {isReceiptOpen && completedSale && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-2xl max-w-lg w-full p-6 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE4]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif font-bold text-base text-[#1A1817]">Transaction Complete</h3>
              </div>
              <button onClick={() => setIsReceiptOpen(false)} className="p-1 rounded-lg text-[#756C6A] hover:bg-[#F3EFEA]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Preview (80mm Thermal Format) */}
            <div className="mt-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DD] font-mono text-[11px] leading-tight text-[#1A1817]">
              <div id="printable-receipt" className="space-y-2">
                <div className="text-center pb-2 border-b border-dashed border-[#A89F91]">
                  <h4 className="font-serif font-bold text-sm tracking-wider uppercase">
                    {storeSettings?.shopName || "Oak Bloom"}
                  </h4>
                  <p className="text-[10px] text-[#756C6A]">{storeSettings?.address}</p>
                  <p className="text-[10px] text-[#756C6A]">Tel: {storeSettings?.phone}</p>
                  {storeSettings?.taxNumber && (
                    <p className="text-[10px] text-[#756C6A]">Tax #: {storeSettings.taxNumber}</p>
                  )}
                </div>

                <div className="text-[10px] space-y-0.5 pt-1">
                  <div className="flex justify-between">
                    <span>Invoice:</span>
                    <span className="font-bold">{completedSale.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(completedSale.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{completedSale.cashier?.name || "Sophia"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{completedSale.customer?.name || "Walk-in Guest"}</span>
                  </div>
                </div>

                <div className="py-2 border-t border-b border-dashed border-[#A89F91] space-y-1">
                  {completedSale.items?.map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate max-w-[180px]">
                        {it.product?.name || it.productName || "Item"} x{it.quantity}
                      </span>
                      <span>{formatPrice(it.lineTotal, currencySymbol)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-[10px] pt-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(completedSale.subtotal, currencySymbol)}</span>
                  </div>
                  {Number(completedSale.cartDiscount) > 0 && (
                    <div className="flex justify-between text-[#8F6B2A]">
                      <span>Discount:</span>
                      <span>-{formatPrice(completedSale.cartDiscount, currencySymbol)}</span>
                    </div>
                  )}
                  {Number(completedSale.taxAmount) > 0 && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatPrice(completedSale.taxAmount, currencySymbol)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-[#A89F91]">
                    <span>Total Paid:</span>
                    <span>{formatPrice(completedSale.grandTotal, currencySymbol)}</span>
                  </div>
                  {completedSale.changeAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Change:</span>
                      <span>{formatPrice(completedSale.changeAmount, currencySymbol)}</span>
                    </div>
                  )}
                </div>

                <div className="text-center pt-3 border-t border-dashed border-[#A89F91] text-[9px] text-[#756C6A]">
                  <p>{storeSettings?.receiptFooterMessage || "Thank you for shopping with us!"}</p>
                </div>
              </div>
            </div>

            {/* Print & Share Action Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-3 rounded-xl border border-[#E0D9D1] bg-white hover:bg-[#FAF8F5] font-semibold text-[#1A1817] flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-4 h-4 text-[#8F6B2A]" />
                <span>Print 80mm Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-3 rounded-xl border border-[#E0D9D1] bg-white hover:bg-[#FAF8F5] font-semibold text-[#1A1817] flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-4 h-4 text-[#8F6B2A]" />
                <span>Print A4 Invoice</span>
              </button>
            </div>

            {/* WhatsApp Receipt Sharing */}
            <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 no-print">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Share2 className="w-4 h-4 text-emerald-700" />
                <span>Send Digital Receipt via WhatsApp</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="e.g. 14155557788 (Country code + phone)"
                  value={whatsAppPhone}
                  onChange={(e) => setWhatsAppPhone(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-emerald-300 bg-white font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={openWhatsAppReceipt}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
                >
                  Send
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end no-print">
              <button
                type="button"
                onClick={() => setIsReceiptOpen(false)}
                className="px-6 py-2 rounded-xl bg-[#8F6B2A] text-white font-bold hover:bg-[#755518]"
              >
                Done / Next Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK CUSTOMER ASSIGN MODAL */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-2xl max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE4]">
              <h3 className="font-serif font-bold text-base text-[#1A1817]">Select or Register Customer</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="p-1 rounded-lg text-[#756C6A] hover:bg-[#F3EFEA]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Search List */}
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCustomer(c);
                    setIsCustomerModalOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DD] hover:border-[#8F6B2A] flex items-center justify-between text-left transition"
                >
                  <div>
                    <span className="font-bold text-[#1A1817] block">{c.name}</span>
                    <span className="text-[10px] text-[#756C6A]">{c.phone || "No phone"}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold">
                    {c.loyaltyPoints || 0} pts
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Register New Customer Form */}
            <form onSubmit={handleQuickCustomerCreate} className="mt-4 pt-4 border-t border-[#F0EBE4] space-y-2">
              <span className="font-semibold text-[#1A1817] block">+ Quick Add New Customer</span>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#E0D9D1] outline-none"
              />
              <input
                type="tel"
                placeholder="Phone (for WhatsApp receipts)"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#E0D9D1] outline-none"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#8F6B2A] text-white font-semibold hover:bg-[#755518]"
              >
                Create & Attach Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CART DISCOUNT MODAL */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-2xl max-w-sm w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE4]">
              <h3 className="font-serif font-bold text-base text-[#1A1817]">Apply Bill Discount (F9)</h3>
              <button onClick={() => setIsDiscountModalOpen(false)} className="p-1 rounded-lg text-[#756C6A] hover:bg-[#F3EFEA]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCartDiscountType("FIXED")}
                  className={`py-2 rounded-xl font-bold border transition ${
                    cartDiscountType === "FIXED"
                      ? "bg-[#8F6B2A] text-white border-[#8F6B2A]"
                      : "bg-[#FAF8F5] text-[#5C5452] border-[#E0D9D1]"
                  }`}
                >
                  Fixed ($) Off
                </button>
                <button
                  type="button"
                  onClick={() => setCartDiscountType("PERCENTAGE")}
                  className={`py-2 rounded-xl font-bold border transition ${
                    cartDiscountType === "PERCENTAGE"
                      ? "bg-[#8F6B2A] text-white border-[#8F6B2A]"
                      : "bg-[#FAF8F5] text-[#5C5452] border-[#E0D9D1]"
                  }`}
                >
                  Percentage (%) Off
                </button>
              </div>

              <div>
                <label className="block font-semibold text-[#5C5452] mb-1">Discount Value</label>
                <input
                  type="number"
                  min="0"
                  value={cartDiscount}
                  onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-base font-bold rounded-xl border border-[#E0D9D1] outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#8F6B2A] text-white font-bold hover:bg-[#755518]"
              >
                Apply to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELD BILLS DRAWER */}
      {isHeldBillsOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-2xl max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE4]">
              <h3 className="font-serif font-bold text-base text-[#1A1817]">Held Orders ({heldBills.length})</h3>
              <button onClick={() => setIsHeldBillsOpen(false)} className="p-1 rounded-lg text-[#756C6A] hover:bg-[#F3EFEA]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {heldBills.map((h) => (
                <div key={h.id} className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DD] flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-[#1A1817] block">{h.id}</span>
                    <span className="text-[10px] text-[#756C6A]">
                      {h.customer?.name || "Walk-in Guest"} • {h.items.length} items • Held at {h.timestamp}
                    </span>
                  </div>
                  <button
                    onClick={() => resumeBill(h)}
                    className="px-3 py-1.5 rounded-lg bg-[#8F6B2A] text-white font-semibold hover:bg-[#755518]"
                  >
                    Resume Bill
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS MODAL */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAE5DD] shadow-2xl max-w-sm w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE4]">
              <h3 className="font-serif font-bold text-base text-[#1A1817]">POS Keyboard Hotkeys</h3>
              <button onClick={() => setIsShortcutsOpen(false)} className="p-1 rounded-lg text-[#756C6A] hover:bg-[#F3EFEA]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between py-1.5 border-b border-[#F0EBE4]">
                <span className="text-[#5C5452]">Focus Product Search</span>
                <kbd className="px-2 py-0.5 rounded bg-[#FAF5EF] border border-[#E0D9D1] font-mono font-bold">F2</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F0EBE4]">
                <span className="text-[#5C5452]">Select / Add Customer</span>
                <kbd className="px-2 py-0.5 rounded bg-[#FAF5EF] border border-[#E0D9D1] font-mono font-bold">F4</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F0EBE4]">
                <span className="text-[#5C5452]">Hold Active Cart</span>
                <kbd className="px-2 py-0.5 rounded bg-[#FAF5EF] border border-[#E0D9D1] font-mono font-bold">F8</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F0EBE4]">
                <span className="text-[#5C5452]">Apply Bill Discount</span>
                <kbd className="px-2 py-0.5 rounded bg-[#FAF5EF] border border-[#E0D9D1] font-mono font-bold">F9</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F0EBE4]">
                <span className="text-[#5C5452]">Open Payment Tender</span>
                <kbd className="px-2 py-0.5 rounded bg-[#FAF5EF] border border-[#E0D9D1] font-mono font-bold">F10</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#5C5452]">Close Modals / Clear</span>
                <kbd className="px-2 py-0.5 rounded bg-[#FAF5EF] border border-[#E0D9D1] font-mono font-bold">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
