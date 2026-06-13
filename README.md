# ERP-Nexus — Full-Stack Factory ERP

> [!TIP]
> To get the project set up and running locally, please refer to the **[Quick Start & Startup Guide](STARTUP.md)** first.

> **Project**: Shiv Furniture Works — Autonomous Factory ERP  
> **Stack**: React + Vite · Node.js + Express · Prisma ORM · PostgreSQL  
> **Purpose**: A full-stack, role-based ERP system covering Sales, Purchase, Manufacturing, Inventory, and Owner analytics — with a premium glassmorphism UI.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Project Folder Structure](#2-project-folder-structure)
3. [Frontend Architecture](#3-frontend-architecture)
   - [Design System](#31-design-system)
   - [Layout & Navigation](#32-layout--navigation)
   - [Pages & Modules](#33-pages--modules)
   - [UI Patterns](#34-ui-patterns)
4. [Database Layer — Prisma ORM](#4-database-layer--prisma-orm)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Request Lifecycle](#6-request-lifecycle)
7. [Module Deep-Dives](#7-module-deep-dives)
   - [Purchase Module](#71-purchase-module)
   - [Manufacturing Module](#72-manufacturing-module)
8. [The Stock Engine — `stockMutations.js`](#8-the-stock-engine--stockmutationsjs)
9. [Audit Trail](#9-audit-trail)
10. [Superusers & Seeding](#10-superusers--seeding)
11. [Running the Project](#11-running-the-project)
12. [API Route Reference](#12-api-route-reference)
13. [Critical Architecture Rules](#13-critical-architecture-rules)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)                       │
│                      localhost:5173                             │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Sidebar │  │  TopBar  │  │  Pages   │  │  Owner Portal│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │  HTTP (JSON) via axios
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS API SERVER                           │
│                    localhost:3000                               │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  helmet  │  │   cors   │  │  morgan  │  │ express.json │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│                    (Global Middleware)                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  MODULE ROUTERS                          │  │
│  │  /api/auth  /api/products  /api/purchase-orders  etc.   │  │
│  └──────────────────────────────────────────────────────────┘  │
│          │ authenticate(JWT)  │ authorize(roles)                │
│          ▼                    ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              CONTROLLERS  (thin layer)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│          │                                                       │
│          ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        SERVICES  (ALL business logic lives here)         │  │
│  └──────────────────────────────────────────────────────────┘  │
│          │                                                       │
│          ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        UTILS  (stockMutations.js, etc.)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │  Prisma Client (ORM)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL DATABASE                                 │
│  Schema managed 100% by Prisma — NEVER by manual SQL files      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Project Folder Structure

```
ERP-Nexus/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          ← SINGLE SOURCE OF TRUTH for DB schema
│   │
│   ├── seed/
│   │   └── seed.js                ← Seeds super-users (admin, owner) and ERP modules
│   │
│   ├── public/
│   │   └── uploads/               ← Uploaded product images (served statically)
│   │
│   └── src/
│       ├── server.js              ← Starts HTTP server
│       ├── app.js                 ← Express app setup, all routes mounted here
│       │
│       ├── config/
│       │   ├── db.js              ← Prisma client singleton
│       │   ├── jwt.js             ← signAccessToken / signRefreshToken
│       │   └── swagger.js         ← OpenAPI spec config
│       │
│       ├── middleware/
│       │   ├── authenticate.js    ← Verifies JWT, attaches req.user
│       │   ├── authorize.js       ← Role-based access control (admin, owner)
│       │   └── errorHandler.js    ← Global error catcher (last middleware)
│       │
│       ├── utils/
│       │   ├── stockMutations.js  ← *** ALL stock logic is HERE ***
│       │   └── procurementAutomation.js ← Auto-reorder suggestion logic
│       │
│       └── modules/
│           ├── auth/              ← register, login, refresh, logout
│           ├── admin/             ← Approve/reject users, manage access
│           ├── products/          ← CRUD for products + image upload
│           ├── vendors/           ← Vendor CRUD
│           ├── customers/         ← Customer CRUD
│           ├── sales/             ← Sales Orders (SO): draft → confirmed → delivered
│           ├── purchase/          ← PO + Goods Receipts + Bills + Suggestions
│           ├── manufacturing/     ← BOM + Manufacturing Orders (MO)
│           ├── inventory/         ← Stock Ledger read-only views
│           └── audit/             ← Audit logs
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.jsx                ← Root router (React Router v6)
│       ├── main.jsx               ← React entry point
│       │
│       ├── components/
│       │   └── layout/
│       │       ├── AppShell.jsx   ← Sidebar + page content wrapper
│       │       ├── Sidebar.jsx    ← Collapsible navigation sidebar
│       │       ├── Sidebar.css
│       │       ├── TopBar.jsx     ← Header bar + user profile drawer
│       │       └── TopBar.css
│       │
│       ├── pages/
│       │   ├── Login.jsx / Login.css
│       │   ├── Register.jsx / Register.css
│       │   ├── Dashboard.jsx / Dashboard.css
│       │   ├── Products.jsx / Products.css
│       │   ├── UserManagement.jsx
│       │   ├── Reports.jsx
│       │   ├── AuditLogs.jsx
│       │   ├── InventoryMonitor.jsx
│       │   ├── ManufacturingMonitor.jsx
│       │   ├── ProcurementMonitor.jsx
│       │   ├── PurchaseMonitor.jsx
│       │   ├── SalesMonitor.jsx
│       │   ├── NewSalesOrder.jsx / NewSalesOrder.css
│       │   │
│       │   ├── purchase/          ← Purchase sub-pages
│       │   ├── sales/             ← Sales sub-pages
│       │   ├── manufacturing/     ← Manufacturing sub-pages
│       │   ├── inventory/         ← Inventory sub-pages
│       │   └── owner/             ← Full Owner Portal (14 pages)
│       │       ├── OwnerDashboard.jsx
│       │       ├── OwnerUsers.jsx
│       │       ├── OwnerFinancials.jsx
│       │       ├── OwnerSales.jsx
│       │       ├── OwnerPurchase.jsx
│       │       ├── OwnerManufacturing.jsx
│       │       ├── OwnerInventory.jsx
│       │       ├── OwnerApprovals.jsx
│       │       ├── OwnerReports.jsx
│       │       ├── OwnerAuditLogs.jsx
│       │       ├── OwnerEmployees.jsx
│       │       ├── OwnerNotifications.jsx
│       │       ├── OwnerOverview.jsx
│       │       └── OwnerSettings.jsx
│       │
│       ├── styles/
│       │   ├── tokens.css         ← CSS design tokens (colors, spacing, radius)
│       │   ├── global.css         ← Global resets and base styles
│       │   ├── animations.css     ← Shared keyframe animations
│       │   ├── AdminPages.css     ← Modal overlays, cards, admin UI
│       │   ├── Purchase.css       ← Purchase module styles
│       │   ├── Manufacturing.css  ← Manufacturing module styles
│       │   ├── Inventory.css      ← Inventory module styles
│       │   ├── Sales.css          ← Sales module styles
│       │   └── Owner.css          ← Owner portal styles
│       │
│       └── utils/
│           └── api.js             ← Axios instance with auth interceptors
│
├── README.md                      ← (this file)
└── STARTUP.md                     ← Quick-start guide
```

---

## 3. Frontend Architecture

### 3.1 Design System

The entire frontend uses a **CSS custom property (token) based design system** defined in `styles/tokens.css`. No third-party CSS framework is used.

#### Color Tokens
```css
--color-bg-primary      /* Main dark background */
--color-bg-secondary    /* Card/panel background */
--color-bg-tertiary     /* Input/hover backgrounds */
--color-accent          /* Primary brand accent (indigo/violet) */
--color-accent-hover    /* Hover state of accent */
--color-primary         /* Primary text */
--color-secondary       /* Muted/secondary text */
--color-border          /* Subtle borders */
--color-success / --color-warning / --color-danger
```

#### Spacing & Radius Tokens
```css
--space-1 through --space-8    /* 4px increments */
--radius-sm / --radius-md / --radius-lg / --radius-xl
```

#### Typography
- Font: **Inter** (Google Fonts) — loaded globally
- Text scale tokens: `--text-label-sm-size`, `--text-label-md-size`, etc.

---

### 3.2 Layout & Navigation

#### AppShell
The `AppShell` component wraps every authenticated page. It renders the `Sidebar` on the left and passes the page content on the right.

```
┌─────────────────────────────────────────────┐
│ Sidebar │           Page Content             │
│ (fixed) │    TopBar + main scrollable area   │
└─────────────────────────────────────────────┘
```

#### Sidebar (`Sidebar.jsx` / `Sidebar.css`)
- **Collapsible**: A toggle button collapses it to icon-only mode (icon + tooltip on hover)
- **Role-aware**: Navigation items are filtered by user role — regular users only see modules they've been granted access to; admins see all modules
- **Active state**: Current route highlighted with accent background and left-border indicator
- **Smooth transitions**: Padding and layout are constant between states — no layout shift on click
- **Premium styling**: Glassmorphism panel, gradient logo area, hover micro-animations

#### TopBar (`TopBar.jsx` / `TopBar.css`)
- Displays page title, breadcrumb, and current user info
- **User Profile Drawer**: Clicking the user avatar opens a slide-in drawer from the right with:
  - Full-bleed backdrop blur effect over the entire page
  - ID Card component showing name, role, login ID, and profile photo
  - Action buttons: Edit Profile, Change Password, Logout
- **Background blur on open**: When any modal or drawer is open, the entire background gets a `backdrop-filter: blur(8px)` overlay

---

### 3.3 Pages & Modules

#### Admin Pages

| Page | Route | Description |
|---|---|---|
| `Dashboard` | `/dashboard` | KPI cards, revenue charts, inventory overview, activity feed |
| `Products` | `/products` | Full CRUD with image upload, card/table view toggle, search & filter |
| `UserManagement` | `/users` | List, approve, reject users; assign module access; view user profiles |
| `AuditLogs` | `/audit-logs` | Paginated audit trail with actor, action, and timestamp |
| `Reports` | `/reports` | Cross-module analytics and export |
| `InventoryMonitor` | `/inventory` | Real-time stock levels, free qty, reserved qty |
| `PurchaseMonitor` | `/purchase` | Purchase order status board |
| `SalesMonitor` | `/sales` | Sales order pipeline |
| `ManufacturingMonitor` | `/manufacturing` | MO tracking and work order status |
| `ProcurementMonitor` | `/procurement` | Procurement suggestion queue |
| `NewSalesOrder` | `/sales/new` | Multi-step sales order creation |

#### Owner Portal (`/owner/*`)

A completely separate portal for the business owner, with 14 dedicated pages:

| Page | Description |
|---|---|
| `OwnerDashboard` | High-level business overview |
| `OwnerUsers` | User management with **full user creation card** (glassmorphism modal, same sidebar/blur behavior as other modals) |
| `OwnerFinancials` | Bill payments, P&L, financial KPIs |
| `OwnerSales` | Sales performance analytics |
| `OwnerPurchase` | Procurement spend analysis |
| `OwnerManufacturing` | Production efficiency metrics |
| `OwnerInventory` | Inventory valuation and turnover |
| `OwnerApprovals` | Pending approvals queue (bills, users) |
| `OwnerReports` | Business intelligence reports |
| `OwnerAuditLogs` | Full audit trail |
| `OwnerEmployees` | Employee directory |
| `OwnerNotifications` | System notifications |
| `OwnerOverview` | Quick snapshot of all KPIs |
| `OwnerSettings` | System and business settings |

---

### 3.4 UI Patterns

#### Modal Overlays
All modals and detail cards follow a unified pattern defined in `AdminPages.css`:

```
.admin-modal-overlay        ← Full-screen backdrop (rgba + blur(8px))
  └── .admin-modal-card     ← Centered glassmorphism card (backdrop-filter: blur(20px))
        ├── .admin-modal-header
        ├── .admin-modal-body
        └── .admin-modal-footer
```

- **Background blur**: When any card/modal opens, the sidebar, topbar, and all page content behind the overlay get blurred using `backdrop-filter: blur(8px)` on the overlay itself
- **Sidebar stays visible**: The sidebar remains rendered and visible through the blur — it does NOT hide or collapse when modals open
- **Consistent across all modules**: Products, Users, Purchase, Manufacturing all use the same overlay pattern

#### Card Views
Pages like Products and Users support a **card grid view** alongside a table view:

```
.admin-card-grid            ← CSS grid, responsive columns
  └── .admin-product-card   ← Individual card with image, name, badges, actions
```

#### Select / Dropdown Styling
All `<select>` elements are custom-styled via CSS to match the dark glassmorphism theme — no browser-default arrows or backgrounds.

#### Animations (`animations.css`)
Shared keyframe animations used across the app:
- `fadeInUp` — cards and modals entering from below
- `slideInRight` — drawers sliding in from the right
- `shimmer` — loading skeleton effect
- `pulse` — status indicator pulsing

---

## 4. Database Layer — Prisma ORM

### Why Prisma (not raw SQL)?

| Concern | Raw SQL | Prisma (our approach) |
|---|---|---|
| Schema sync | Manual, error-prone | `npx prisma db push` keeps DB in sync automatically |
| Type safety | None | Full TypeScript-style autocomplete |
| Transactions | Manual `BEGIN/COMMIT` | `prisma.$transaction()` — clean and atomic |
| Migrations | Manual script management | Tracked migration history |

### How to Apply the Schema

```bash
# Push the schema to PostgreSQL (creates/alters all tables)
npx prisma db push

# OR use migrations (for production)
npx prisma migrate dev --name "your_migration_name"
```

> ⚠️ **NEVER run `/sql/*.sql` files manually** against the database. They are reference documents only.

### Database Tables (from `schema.prisma`)

| Table | Description |
|---|---|
| `users` | All users. Contains `is_admin`, `status` (PENDING/APPROVED/REJECTED), and `role` |
| `user_profiles` | Name, position, address, photo — 1:1 with users |
| `modules` | ERP modules (sales, purchase, manufacturing, inventory) |
| `user_module_access` | Which user has access to which module |
| `refresh_tokens` | Hashed JWT refresh tokens for session management |
| `products` | **Universal product table** — raw materials, finished goods, components |
| `vendors` | Supplier records |
| `customers` | Customer records |
| `boms` | Bill of Materials (one BOM per finished product) |
| `bom_lines` | Components for each BOM with qty_per_unit and operation |
| `sales_orders` + `sales_order_lines` | Sales flow |
| `purchase_orders` + `purchase_order_lines` | Purchase flow |
| `goods_receipts` + `goods_receipt_lines` | Physical delivery tracking |
| `vendor_bills` | Invoice management (pending → approved → paid) |
| `procurement_suggestions` | Auto-generated reorder alerts |
| `manufacturing_orders` | Production orders linked to BOMs |
| `work_orders` | Individual operations (assembly, painting, packing) |
| `stock_ledger` | Immutable log of every stock movement |
| `audit_logs` | Who did what and when |
| `risk_alerts` | AI-flagged supply risk for products |
| `password_reset_tokens` | Secure password reset flow |

### Key Product Fields

```
Product
  ├── on_hand_qty    ← Physical stock in warehouse
  ├── reserved_qty   ← Committed to confirmed Sales Orders / MOs
  ├── image_url      ← Uploaded product image (served from /public/uploads/)
  └── free_qty       ← COMPUTED in app layer: on_hand - reserved (NOT stored in DB)
```

---

## 5. Authentication & Authorization

### Flow Step by Step

```
1. User sends POST /api/auth/login  { login_id, password }
2. auth.service.js:
   a. Finds user by login_id
   b. bcrypt.compare(password, hashedPassword)
   c. Checks status = APPROVED (rejects PENDING/REJECTED)
   d. Issues:
      - accessToken  (JWT, 15min)  → sent in response body
      - refreshToken (JWT, 7 days) → hashed with SHA-256, stored in DB
3. Client sends Authorization: Bearer <accessToken> on all subsequent requests
4. authenticate middleware:
   a. Extracts Bearer token
   b. jwt.verify(token)
   c. Attaches decoded { id, login_id, is_admin } to req.user
5. authorize(['owner']) middleware:
   a. Checks req.user.role === 'owner' (or 'admin', etc.)
   b. 403 if role is insufficient
```

### Roles

| Role | `is_admin` | Access |
|---|---|---|
| `admin` | true | All structural operations: approve users, manage products, create POs, BOMs |
| `owner` | true | Everything `admin` can do **plus** financial routes: bill approvals, payments, owner portal |
| Regular user | false | Only the modules explicitly granted by admin |

### New User Registration Flow

```
User fills Register form → POST /api/auth/register
  → Status: PENDING (cannot login yet)
  → Admin sees in UserManagement → POST /api/admin/users/:id/approve
  → Status: APPROVED → user can now login
```

---

## 6. Request Lifecycle

```
POST /api/purchase-orders
  │
  ├─ 1. helmet   → Sets secure HTTP headers
  ├─ 2. cors     → Validates origin (localhost:5173 allowed)
  ├─ 3. morgan   → Logs "POST /api/purchase-orders 201 45ms"
  ├─ 4. express.json → Parses the JSON body
  │
  ├─ 5. authenticate  → Verifies JWT, attaches req.user
  ├─ 6. authorize(['admin', 'owner']) → Confirms user has permission
  │
  ├─ 7. purchase.routes.js → Matches route, calls controller
  ├─ 8. purchase.controller.js → Extracts data, calls service
  ├─ 9. purchase.service.js → prisma.$transaction():
  │       a. Creates PurchaseOrder record
  │       b. Creates PurchaseOrderLine records
  │       c. Returns new PO with lines
  │
  └─ 10. Controller sends res.status(201).json({ success: true, data: po })
```

If any error is thrown:
```
  → errorHandler middleware catches it
  → BusinessLogicError → 422 Unprocessable Entity
  → Prisma "not found" → 404 Not Found
  → JWT errors → 401 Unauthorized
  → Everything else → 500 Internal Server Error
```

---

## 7. Module Deep-Dives

### 7.1 Purchase Module

The Purchase module manages the full procurement lifecycle, split into **4 sub-modules**.

#### Files

```
src/modules/purchase/
  ├── purchase.routes.js      → /api/purchase-orders
  ├── purchase.controller.js
  ├── purchase.service.js
  ├── receipt.routes.js       → /api/purchase/receipts
  ├── receipt.controller.js
  ├── receipt.service.js
  ├── bill.routes.js          → /api/purchase/bills
  ├── bill.controller.js
  ├── bill.service.js
  ├── suggestion.routes.js    → /api/purchase/suggestions
  ├── suggestion.controller.js
  └── suggestion.service.js
```

#### Purchase Order State Machine

```
[draft] ──── confirm ───► [confirmed] ──── receive ───► [received]
   │                           │
   └── cancel ──────────────── ┘
```

| Status | Meaning |
|---|---|
| `draft` | PO created, lines can still be edited |
| `confirmed` | PO sent to vendor, stock is now expected |
| `received` | All goods physically received |

#### Step-by-Step: Creating and Receiving a Purchase Order

**Step 1 — Create a Draft PO**
```
POST /api/purchase-orders
Body: { vendor_id, lines: [{ product_id, ordered_qty, unit_price }] }
```

**Step 2 — Confirm the PO**
```
POST /api/purchase-orders/:id/confirm
```

**Step 3 — Create a Goods Receipt**
```
POST /api/purchase/receipts
Body: { po_id, delivery_note_ref, items: [{ product_id, quantity_received }] }

Service does (in a single transaction):
  1. Validates PO status === 'confirmed'
  2. Creates GoodsReceipt header (generates GRN-{timestamp})
  3. For each item:
     a. Creates GoodsReceiptLine
     b. Increments PurchaseOrderLine.received_qty
     c. Increments Product.on_hand_qty (via stockMutations.addStockOnReceipt)
     d. Creates StockLedger entry (movement_type: 'purchase_in')
  4. Checks if all PO lines fully received → sets PO status to 'received'
```

**Step 4 — Create a Vendor Bill**
```
POST /api/purchase/bills
Body: { po_id, vendor_id, invoice_date, due_date, subtotal, tax, total_amount }

Bill status flow: pending_payment → approved_for_payment → paid
Only 'owner' role can mark a bill as paid.
```

#### Procurement Suggestions (Auto-Reorder Alerts)

When stock drops below `reorder_level`, `procurementAutomation.js` **automatically creates a `ProcurementSuggestion`** record.

```
GET  /api/purchase/suggestions          → see all pending suggestions
POST /api/purchase/suggestions/:id/convert → convert suggestion into a draft PO
```

---

### 7.2 Manufacturing Module

#### Files

```
src/modules/manufacturing/
  ├── bom.routes.js     → /api/boms
  ├── bom.controller.js
  ├── bom.service.js
  ├── mo.routes.js      → /api/manufacturing-orders
  ├── mo.controller.js
  └── mo.service.js
```

#### Manufacturing Order State Machine

```
[draft] ──── confirm ───► [confirmed] ──── start ───► [in_progress] ──── complete ───► [completed]
   │              │              │                                               │
   └── cancel ────┘              └── cancel ─────────────────────────────────── ┘
```

#### Step-by-Step: Manufacturing a Product

**Step 1 — Define the BOM**
```
POST /api/boms
Body: { product_id, lines: [{ component_product_id, qty_per_unit, operation }] }
```

**Step 2 — Create MO**
```
POST /api/manufacturing-orders
Body: { product_id, quantity }
```

**Step 3 — Confirm the MO (Reserve Components)**
```
POST /api/manufacturing-orders/:id/confirm

Service does (in a transaction):
  1. For each BOM line: reserveStock(component, qty × quantity)
  2. Auto-generates Work Orders per unique operation
  3. Updates status to 'confirmed'
```

**Step 4 — Complete the MO**
```
POST /api/manufacturing-orders/:id/complete

Service does (in a transaction):
  1. consumeComponentStock for each BOM line (on_hand -= qty, reserved -= qty)
  2. produceFinishedGoods (on_hand += quantity)
  3. Marks all Work Orders complete
  4. Status → 'completed'
```

---

## 8. The Stock Engine — `stockMutations.js`

**File**: `src/utils/stockMutations.js`

ALL operations that touch `product.on_hand_qty` or `product.reserved_qty` go through this file.

### Invariants (Never Broken)

```
1. on_hand_qty   >= 0          (stock never goes negative)
2. reserved_qty  >= 0          (no negative reservations)
3. reserved_qty  <= on_hand_qty (can't reserve more than you have)
```

### Functions

| Function | Called by | What it does |
|---|---|---|
| `reserveStock(tx, productId, qty)` | SO confirm, MO confirm | `reserved_qty += qty` |
| `releaseReservation(tx, productId, qty)` | SO cancel, MO cancel | `reserved_qty -= qty` |
| `deductStockOnDelivery(tx, productId, qty)` | SO deliver | `on_hand -= qty`, `reserved -= qty` |
| `addStockOnReceipt(tx, productId, qty)` | Goods Receipt | `on_hand += qty` |
| `consumeComponentStock(tx, productId, qty)` | MO complete | `on_hand -= qty`, `reserved -= qty` |
| `produceFinishedGoods(tx, productId, qty)` | MO complete | `on_hand += qty` |

> All functions take `tx` (Prisma transaction client) as first argument — always atomic.

---

## 9. Audit Trail

Every significant action is logged in `audit_logs`:

| Field | Description |
|---|---|
| `user_id` | Who performed the action |
| `model_name` | Which table was affected |
| `record_id` | Which specific record |
| `action` | `create` / `update` / `delete` / `status_change` |
| `old_value` | JSON snapshot before the change |
| `new_value` | JSON snapshot after the change |
| `timestamp` | When it happened |

Stock movements are separately tracked in `stock_ledger`:

| Field | Description |
|---|---|
| `movement_type` | `sale_out` / `purchase_in` / `mfg_consume` / `mfg_produce` / `adjustment` |
| `qty_change` | Positive for incoming, negative for outgoing |
| `reference_model` | Source document (e.g. `GoodsReceipt`, `SalesOrder`) |
| `reference_id` | UUID of the source document |

---

## 10. Superusers & Seeding

| Login ID | Password | Role | Permissions |
|---|---|---|---|
| `admin` | `admin` | `admin` | User management, all module operations |
| `owner` | `owner` | `owner` | Everything admin can do **plus** financial approvals + Owner Portal |

### Run the Seed

```bash
cd backend
npm run seed
# OR: node seed/seed.js
```

The seed script creates the 4 core ERP modules: `sales`, `purchase`, `manufacturing`, `inventory`.

Passwords are hashed with **bcrypt (cost factor 10/12)** — plain text is never stored.

---

## 11. Running the Project

### Prerequisites

- Node.js >= 18
- PostgreSQL running
- `.env` file configured

```env
DATABASE_URL="postgresql://user:password@localhost:5432/erp_nexus"
JWT_SECRET="your-super-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
PORT=3000
NODE_ENV=development
```

### Backend Setup

```bash
cd backend
npm install
npx prisma db push       # Sync schema → PostgreSQL
npm run seed             # Create admin, owner, and modules
npm run dev              # Start dev server (nodemon)
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev              # Start Vite dev server at localhost:5173
```

### All Backend Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start with nodemon (auto-restarts on file change) |
| `npm start` | Start without hot reload (production) |
| `npm run seed` | Seed database with superusers + modules |
| `npx prisma db push` | Sync schema.prisma → PostgreSQL tables |
| `npx prisma studio` | Open visual database browser |
| `npx prisma migrate dev` | Create a tracked migration file |

---

## 12. API Route Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user (status: PENDING) |
| POST | `/api/auth/login` | Public | Login, receive JWT tokens |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| POST | `/api/auth/logout` | Auth | Revoke refresh token |
| GET | `/api/admin/users` | Admin | List all users |
| POST | `/api/admin/users/:id/approve` | Admin | Approve user registration |
| GET | `/api/products` | Auth | List all products |
| POST | `/api/products` | Admin | Create product |
| PATCH | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| POST | `/api/products/:id/image` | Admin | Upload product image |
| GET | `/api/vendors` | Auth | List vendors |
| POST | `/api/vendors` | Admin | Create vendor |
| GET | `/api/customers` | Auth | List customers |
| POST | `/api/customers` | Admin | Create customer |
| GET | `/api/purchase-orders` | Auth | List all POs |
| POST | `/api/purchase-orders` | Admin | Create draft PO |
| POST | `/api/purchase-orders/:id/confirm` | Admin | Confirm PO |
| POST | `/api/purchase/receipts` | Auth | Create Goods Receipt |
| GET | `/api/purchase/bills` | Auth | List vendor bills |
| POST | `/api/purchase/bills` | Admin | Create vendor bill |
| PATCH | `/api/purchase/bills/:id/pay` | **Owner** | Mark bill as paid |
| GET | `/api/purchase/suggestions` | Auth | List procurement suggestions |
| POST | `/api/purchase/suggestions/:id/convert` | Admin | Convert suggestion to PO |
| GET | `/api/boms` | Auth | List BOMs |
| POST | `/api/boms` | Admin | Create BOM |
| GET | `/api/manufacturing-orders` | Auth | List MOs |
| POST | `/api/manufacturing-orders` | Admin | Create MO |
| POST | `/api/manufacturing-orders/:id/confirm` | Admin | Confirm MO (reserves stock) |
| POST | `/api/manufacturing-orders/:id/complete` | Admin | Complete MO |
| POST | `/api/manufacturing-orders/:id/cancel` | Admin | Cancel MO |
| GET | `/api/stock-ledger` | Auth | View stock movements |
| GET | `/api/audit-logs` | Admin | View audit trail |
| GET | `/api/docs` | Public | Swagger API documentation |

---

## 13. Critical Architecture Rules

### ✅ DO

- **Use Prisma for ALL database operations** — `prisma.model.create()`, `prisma.model.update()`, etc.
- **Use `prisma.$transaction()`** for any operation that touches more than one table.
- **Route all stock changes through `stockMutations.js`** — never write raw `on_hand_qty` updates in a service file.
- **Use `npx prisma db push`** to sync schema changes to the database.
- **Put business logic in service files** — controllers only parse requests and call services.
- **Use the CSS token system** on the frontend — never hardcode colors or spacing values.

### ❌ DO NOT

- **Do NOT execute `/sql/*.sql` files manually** against the database.
- **Do NOT write raw `pool.query('INSERT INTO ...')` calls** — we do not use a raw pg pool.
- **Do NOT add stock-altering logic inside controllers** — it must go through `stockMutations.js`.
- **Do NOT create database triggers** to manage stock — the Node.js layer does this already.
- **Do NOT let regular users access financial routes** — bill payments require the `owner` role.
- **Do NOT use inline styles or hardcoded colors** on the frontend — use CSS tokens.

---

*Last updated: June 2026 — ERP-Nexus Team*
