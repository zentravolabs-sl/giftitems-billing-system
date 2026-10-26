// Client-side IndexedDB manager for Offline POS Operations
const DB_NAME = "zentravo_pos_offline_db";
const DB_VERSION = 1;

export interface OfflineSaleRecord {
  id: string; // UUID idempotency key
  invoiceNumber: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineDiscount: number;
    lineTotal: number;
  }>;
  customerId?: string | null;
  customerName?: string | null;
  cartDiscount: number;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  payments: Array<{
    method: string;
    amount: number;
    cardLast4?: string;
    cardTerminalRef?: string;
  }>;
  amountPaid: number;
  changeAmount: number;
  notes?: string | null;
  createdAt: string;
  syncStatus: "PENDING" | "SYNCED" | "FAILED";
  syncError?: string | null;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("products")) {
        const productStore = db.createObjectStore("products", { keyPath: "id" });
        productStore.createIndex("barcode", "barcode", { unique: false });
        productStore.createIndex("sku", "sku", { unique: false });
        productStore.createIndex("categoryId", "categoryId", { unique: false });
      }

      if (!db.objectStoreNames.contains("customers")) {
        const customerStore = db.createObjectStore("customers", { keyPath: "id" });
        customerStore.createIndex("phone", "phone", { unique: false });
      }

      if (!db.objectStoreNames.contains("offlineSales")) {
        const salesStore = db.createObjectStore("offlineSales", { keyPath: "id" });
        salesStore.createIndex("syncStatus", "syncStatus", { unique: false });
        salesStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 1. Cache Products
export async function cacheProducts(products: any[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("products", "readwrite");
    const store = tx.objectStore("products");
    store.clear();
    for (const p of products) {
      store.put(p);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedProducts(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("products", "readonly");
    const store = tx.objectStore("products");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// 2. Cache Customers
export async function cacheCustomers(customers: any[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("customers", "readwrite");
    const store = tx.objectStore("customers");
    store.clear();
    for (const c of customers) {
      store.put(c);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedCustomers(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("customers", "readonly");
    const store = tx.objectStore("customers");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// 3. Cache Store Settings
export async function cacheSettings(settings: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readwrite");
    const store = tx.objectStore("settings");
    store.put({ id: "default", ...settings });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedSettings(): Promise<any | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readonly");
    const store = tx.objectStore("settings");
    const req = store.get("default");
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// 4. Offline Sales Queue
export async function saveOfflineSale(sale: OfflineSaleRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("offlineSales", "readwrite");
    const store = tx.objectStore("offlineSales");
    store.put(sale);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingOfflineSales(): Promise<OfflineSaleRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("offlineSales", "readonly");
    const store = tx.objectStore("offlineSales");
    const req = store.getAll();
    req.onsuccess = () => {
      const all: OfflineSaleRecord[] = req.result || [];
      resolve(all.filter((s) => s.syncStatus === "PENDING" || s.syncStatus === "FAILED"));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAllOfflineSales(): Promise<OfflineSaleRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("offlineSales", "readonly");
    const store = tx.objectStore("offlineSales");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function updateOfflineSaleStatus(
  id: string,
  status: "PENDING" | "SYNCED" | "FAILED",
  error?: string | null
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("offlineSales", "readwrite");
    const store = tx.objectStore("offlineSales");
    const req = store.get(id);
    req.onsuccess = () => {
      const record = req.result;
      if (record) {
        record.syncStatus = status;
        record.syncError = error || null;
        store.put(record);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
