# Zentravo Luxury Gifts — Shop Management & Omnichannel POS System

A complete, production-grade Gift Items Shop Management System featuring three unified interfaces:
1. **Customer-Facing Luxury E-Commerce Website** (`/`)
2. **Operations & Executive Management Dashboard** (`/admin`)
3. **High-Speed Touchscreen & Offline-Ready Point of Sale (POS)** (`/pos`)

Built on a unified Next.js 16 App Router architecture, TypeScript, Tailwind CSS, Prisma ORM 7 with PostgreSQL connection pooling, and real-time inventory ledger accounting.

---

## 🏛 Architecture Overview

```
                                      ┌───────────────────────────────────────────────┐
                                      │              Next.js App Router               │
                                      │        Unified Monorepo Architecture          │
                                      └───────┬───────────────────┬───────────────┬───┘
                                              │                   │               │
                                              ▼                   ▼               ▼
                        ┌───────────────────────────────┐ ┌──────────────┐ ┌──────────────────────────┐
                        │   Customer E-Commerce Store   │ │ Admin Portal │ │     Touchscreen POS      │
                        │             (/)               │ │   (/admin)   │ │          (/pos)          │
                        │ - Luxury Boutique UI          │ │ - KPIs & COGS│ │ - NO SIDEBAR (Top Nav)   │
                        │ - Live Cart & Checkout        │ │ - Purchasing │ │ - Barcode / SKU Auto-Add │
                        │ - Promo Banners & CMS         │ │ - Inventory  │ │ - Multi-tender Payments  │
                        │ - Order Tracking & Account    │ │ - Reports CSV│ │ - 80mm & A4 Receipts     │
                        └──────────────┬────────────────┘ └───────┬──────┘ │ - WhatsApp Sharing       │
                                       │                          │        │ - PWA / Offline Sync     │
                                       │                          │        └────────────┬─────────────┘
                                       ▼                          ▼                     ▼
                        ┌─────────────────────────────────────────────────────────────────────────────┐
                        │                          Unified API & Business Logic                       │
                        │                                  (/api/*)                                   │
                        │  Auth & RBAC • Inventory Ledger • Weighted-Average Cost • Orders & Sales    │
                        └──────────────────────────────────────┬──────────────────────────────────────┘
                                                               │
                                                               ▼
                        ┌─────────────────────────────────────────────────────────────────────────────┐
                        │                          Neon Cloud PostgreSQL                              │
                        │               Prisma ORM 7 with @prisma/adapter-pg Connection Pool          │
                        └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

### 1. Customer E-Commerce Website (`/`)
- **Aesthetic**: Warm ivory (`#FAF7F2`), rose gold (`#B85D4D`), deep charcoal (`#1C1917`), and champagne accents.
- **Dynamic CMS Content**: Hero banner, promotional ribbons, store policies, and footer links are retrieved dynamically from `BusinessSettings` and `WebsiteContent` models.
- **Product Catalog**: Live search, category filtering pills, price sorting, discount percentage badges, and real-time inventory availability.
- **Cart & Checkout**: Drawer cart, coupon code validation (e.g. `GIFT2026`, `WELCOME20`), shipping address form, and instant order tracking generation (`/orders/[orderNumber]`).
- **Customer Portal**: Order history with chronological status badges (`PENDING` ➔ `CONFIRMED` ➔ `PROCESSING` ➔ `READY_FOR_DELIVERY` ➔ `SHIPPED` ➔ `COMPLETED`).

### 2. Operational Admin Dashboard (`/admin`)
- **Live Financial KPIs**: Real-time aggregation of today's sales, month-to-date revenue, gross profit, inventory valuation, active purchase totals, low-stock alerts, and pending online orders.
- **Product & Category CRUD**: SKU/Barcode generator, category assignment, cost price, selling price, discount amounts, and multi-image gallery support.
- **Purchasing & GRN**: Supplier directory, Purchase Orders (PO), and Goods Received Notes (GRN). **Stock is updated strictly upon receiving**, automatically recalculating the product's **Weighted-Average Cost**.
- **Inventory Ledger**: Complete audit trail recording movement types (`OPENING_STOCK`, `PURCHASE_RECEIPT`, `POS_SALE`, `WEBSITE_SALE`, `CUSTOMER_RETURN`, `STOCK_ADJUSTMENT`, `DAMAGED`).
- **Reports & Financials**: Channel-separated revenue (POS vs. Website), line-item Cost of Goods Sold (COGS), operating expenses, net margin, and 1-click CSV export.

### 3. High-Speed Point of Sale (POS) (`/pos`)
- **Layout**: Strictly **NO sidebar**. Features a streamlined top navigation bar with Cashier shift display, register number, online/offline sync status, and active held bills counter.
- **Barcode & SKU Lookup**: Instant scanner capture on `Enter` with auto-increment quantity.
- **Keyboard Shortcuts**:
  - `F2`: Focus product search & barcode input
  - `F4`: Select or add walk-in customer
  - `F8`: Hold active cart bill
  - `F9`: Apply cart discount (percentage or fixed)
  - `F10`: Open Checkout / Payment modal
  - `Esc`: Clear cart / Close modals
- **Multi-Tender Payments**: Cash with automatic change calculation, Card with terminal authorization code, Split Tender (Cash + Card), and Gift Vouchers.
- **Receipt Engine**:
  - **80mm Thermal Receipt**: Formatted with monospace typography, business header, line item table, tax breakdown, and barcode.
  - **A4 Full Invoice**: Professional corporate invoice layout.
  - **WhatsApp Sharing**: Encoded direct messaging link (`https://wa.me/?text=...`) and public digital receipt viewer (`/pos/receipt/[id]`).
- **Sales History & Returns**: View completed sales, reprint receipts, and process line-item customer returns that immediately restore central stock.

### 4. PWA & Durable Offline Mode
- **Service Worker & Manifest**: Installable as a standalone Windows desktop app (`manifest.json` + `sw.js`).
- **IndexedDB Durable Storage** (`src/lib/offline-db.ts`): Caches the product catalogue, customer list, and business settings locally in the browser.
- **Offline Sales Queue**: When disconnected from the internet, the cashier can continue scanning and ringing up sales. Completed offline transactions receive a client-generated UUID (`syncId`) and are queued in IndexedDB.
- **Conflict-Safe Sync**: Once reconnected, clicking **Sync Now** or triggering the background worker sends queued transactions to `/api/pos/sync`, which validates idempotency, prevents duplicate sales, decrements stock transactionally, and flags any stock discrepancies.

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.4.3 (App Router with React 19 & Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + CSS Variables Design System |
| **Database** | PostgreSQL (Neon Cloud Serverless with connection pooling) |
| **ORM** | Prisma ORM 7 with `@prisma/adapter-pg` & `pg.Pool` |
| **Authentication** | Custom Session Tokens via Edge Middleware + `bcryptjs` password hashing |
| **Offline Storage**| IndexedDB (`idb` wrapper) |
| **PWA** | Service Worker API + Web App Manifest |
| **Validation** | Zod schemas for all API payloads |

---

## 🔐 Default User Roles & Credentials

The database comes pre-seeded with four role-specific staff accounts:

| Role | Email | Password | Permissions & Scope |
|---|---|---|---|
| **Super Admin** | `admin@zentravo.com` | `Admin@123456` | Full system access, settings, user management, financial reports, inventory overrides |
| **Cashier** | `cashier@zentravo.com` | `Cashier@123456` | POS register, sales history, customer lookups, receipt printing, offline queue |
| **Inventory Staff** | `inventory@zentravo.com` | `Inventory@123456` | Product CRUD, receiving supplier stock (GRN), inventory ledger adjustments |
| **Accountant** | `accountant@zentravo.com` | `Accountant@123456` | Financial reports, COGS analysis, expense tracking, purchasing audit |

---

## 📦 Setup & Installation

### 1. Clone & Install Dependencies
```bash
git clone <repository_url>
cd gift-shop
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# PostgreSQL Database Connection String (Neon Cloud)
DATABASE_URL="postgresql://neondb_owner:npg_N4xsMADUKa5v@ep-wild-hall-b4mq8kne-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# JWT Secret for Session & API Token Authentication
JWT_SECRET="zentravo-gift-shop-super-secure-production-jwt-secret-2026"

# Application Base URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Cloudinary Image Hosting (Optional: fallback local file storage works if empty)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Currency Configuration
NEXT_PUBLIC_CURRENCY_SYMBOL="$"
NEXT_PUBLIC_CURRENCY_CODE="USD"
```

### 3. Push Database Schema & Seed Data
```bash
# Push schema to PostgreSQL
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed initial categories, suppliers, gift items, coupons, and staff accounts
npm run seed
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the customer store, [http://localhost:3000/pos](http://localhost:3000/pos) for the POS, and [http://localhost:3000/admin](http://localhost:3000/admin) for management.

---

## 🧪 Automated Testing & Verification

A comprehensive end-to-end integration test suite is located in `tests/system-verification.ts`. It exercises all critical business logic directly against the PostgreSQL database:

```bash
npm run verify
```

**Test Coverage (27 Checks — 100% Pass Rate):**
- 🔒 **Database & Driver Adapter**: Neon PostgreSQL connection verification via `PrismaPg`.
- 🔑 **Authentication & Hashing**: `bcryptjs` password hashing and role validation.
- 🛍 **Catalogue Retrieval**: Multi-product and category queries.
- 📦 **Weighted-Average Cost Calculation**: Supplier purchase receipt (GRN) updates stock and recalculates average cost:
  $$\text{New Cost} = \frac{(\text{Existing Qty} \times \text{Existing Cost}) + (\text{Received Qty} \times \text{Received Cost})}{\text{Existing Qty} + \text{Received Qty}}$$
- 💳 **POS Multi-Tender Sale**: Atomic checkout with split tender (Cash + Card), real-time inventory decrement, and movement ledger entry.
- 🌐 **Web Order Inventory Reservation**: Order placement transaction with stock validation and discount coupons (`GIFT2026`).
- 📊 **Financial Reporting & COGS**: Calculation of real Cost of Goods Sold, gross profit, and revenue separation between channels.

---

## 🖨 Printing Thermal Receipts & Invoices

1. On the POS screen, complete any sale or click **Reprint** from the **Sales History** tab.
2. Select **Print 80mm Receipt** or **Print A4 Invoice**.
3. In the Windows/browser print dialog:
   - For **80mm Receipt**: Select your POS thermal printer (e.g. Epson TM-T88, Xprinter, Star Micronics) and set paper size to `80mm x Receipt` or `Roll Paper`.
   - For **A4 Invoice**: Select standard laser/inkjet printer with A4 page size.

---

## 📱 WhatsApp Receipt Integration

- Cashiers can enter the customer's phone number during or after checkout.
- Clicking **Share on WhatsApp** generates a formatted, URL-encoded receipt summary with store branding, invoice number, items purchased, and a secure receipt link (`/pos/receipt/{saleId}`) that launches WhatsApp Web or the WhatsApp desktop application directly.

---

## 🚀 Production Deployment

To create an optimized production build:
```bash
npm run build
npm run start
```
The application will compile all static and dynamic routes cleanly with Turbopack and serve on port 3000.
