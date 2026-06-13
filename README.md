# ERP-Nexus — Backend Architecture Guide

> **Project**: Shiv Furniture Works — Autonomous Factory ERP  
> **Stack**: Node.js + Express · Prisma ORM · PostgreSQL  
> **Purpose**: This document explains, step by step, how the entire backend is structured — from the database layer to the API routes — including the Purchase and Manufacturing modules.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Project Folder Structure](#2-project-folder-structure)
3. [Database Layer — Prisma ORM](#3-database-layer--prisma-orm)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Request Lifecycle](#5-request-lifecycle)
6. [Module Deep-Dives](#6-module-deep-dives)
   - [Purchase Module](#61-purchase-module)
   - [Manufacturing Module](#62-manufacturing-module)
7. [The Stock Engine — `stockMutations.js`](#7-the-stock-engine--stockmutationsjs)
8. [Audit Trail](#8-audit-trail)
9. [Superusers & Seeding](#9-superusers--seeding)
10. [Running the Backend](#10-running-the-backend)
11. [Critical Architecture Rules](#11-critical-architecture-rules)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (React/Vite)                     │
│                      localhost:5173                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │  HTTP (JSON)
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
│  │   Parse req → call Service → send res                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│          │                                                       │
│          ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        SERVICES  (ALL business logic lives here)         │  │
│  │   Validation · Stock mutations · Prisma transactions     │  │
│  └──────────────────────────────────────────────────────────┘  │
│          │                                                       │
│          ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        UTILS  (stockMutations.js, etc.)                  │  │
│  │   Atomic stock operations shared across all modules      │  │
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
│   ├── src/
│   │   ├── server.js              ← Starts HTTP server (calls app.listen)
│   │   ├── app.js                 ← Express app setup, all routes mounted here
│   │   │
│   │   ├── config/
│   │   │   ├── db.js              ← Prisma client singleton
│   │   │   ├── jwt.js             ← signAccessToken / signRefreshToken
│   │   │   └── swagger.js         ← OpenAPI spec config
│   │   │
│   │   ├── middleware/
│   │   │   ├── authenticate.js    ← Verifies JWT, attaches req.user
│   │   │   ├── authorize.js       ← Role-based access control (admin, owner)
│   │   │   └── errorHandler.js    ← Global error catcher (last middleware)
│   │   │
│   │   ├── utils/
│   │   │   └── stockMutations.js  ← *** ALL stock logic is HERE ***
│   │   │
│   │   └── modules/
│   │       ├── auth/              ← register, login, refresh, logout
│   │       ├── admin/             ← Approve/reject users, manage access
│   │       ├── products/          ← CRUD for products (universal model)
│   │       ├── vendors/           ← Vendor CRUD
│   │       ├── customers/         ← Customer CRUD
│   │       ├── sales/             ← Sales Orders (SO): draft → confirmed → delivered
│   │       ├── purchase/          ← PO + Goods Receipts + Bills + Suggestions
│   │       ├── manufacturing/     ← BOM + Manufacturing Orders (MO)
│   │       ├── inventory/         ← Stock Ledger read-only views
│   │       └── audit/             ← Audit logs
│   │
│   └── package.json
│
├── sql/                           ← Reference SQL docs ONLY. DO NOT execute manually.
├── implementation_plan.md
├── implementation_plan_purchase.md
└── README.md                      ← (this file)
```

> **Each module follows the same 3-file pattern:**  
> `*.routes.js` → defines endpoints and applies middleware  
> `*.controller.js` → parses request, calls service, sends response  
> `*.service.js` → all business logic and Prisma calls

---

## 3. Database Layer — Prisma ORM

### Why Prisma (not raw SQL)?

The database schema is **100% managed by Prisma**. This is non-negotiable for three reasons:

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

> ⚠️ **NEVER run `/sql/*.sql` files manually** against the database. They are reference documents only. Running them alongside Prisma will cause duplicate tables, conflicting triggers, and double-counted stock.

### Database Tables (from `schema.prisma`)

| Table | Description |
|---|---|
| `users` | All users. Contains `is_admin`, `status` (PENDING/APPROVED/REJECTED), and `role` (admin/owner) |
| `user_profiles` | Name, position, address, photo — 1:1 with users |
| `modules` | ERP modules (sales, purchase, manufacturing, inventory) |
| `user_module_access` | Which user has access to which module |
| `refresh_tokens` | Hashed JWT refresh tokens for session management |
| `products` | **Universal product table** — covers raw materials, finished goods, and components |
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
  └── free_qty       ← COMPUTED in app layer: on_hand - reserved (NOT stored in DB)
```

---

## 4. Authentication & Authorization

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
| `owner` | true | Everything `admin` can do **plus** financial routes: bill approvals, payments |
| Regular user | false | Only the modules explicitly granted by admin |

### New User Registration Flow

```
User fills form → POST /api/auth/register
  → Status: PENDING (cannot login yet)
  → Admin sees in dashboard → POST /api/admin/users/:id/approve
  → Status: APPROVED → user can now login
```

---

## 5. Request Lifecycle

Here is what happens from the moment a request arrives to the moment a response is sent:

```
POST /api/purchase-orders
  │
  ├─ 1. helmet   → Sets secure HTTP headers
  ├─ 2. cors     → Validates origin (localhost:5173 allowed)
  ├─ 3. morgan   → Logs "POST /api/purchase-orders 201 45ms" to console
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

## 6. Module Deep-Dives

### 6.1 Purchase Module

The Purchase module manages the full procurement lifecycle. It is split into **4 sub-modules**, each with their own routes/controller/service.

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
| `received` | All goods physically received (auto-set when all lines fully received) |

#### Step-by-Step: Creating and Receiving a Purchase Order

**Step 1 — Create a Draft PO**
```
POST /api/purchase-orders
Body: { vendor_id, lines: [{ product_id, ordered_qty, unit_price }] }

Service does:
  prisma.$transaction():
    1. Create PurchaseOrder (status: draft)
    2. Create PurchaseOrderLine for each product
```

**Step 2 — Confirm the PO**
```
POST /api/purchase-orders/:id/confirm

Service does:
  prisma.$transaction():
    1. Check status === 'draft' (throws if not)
    2. Update status to 'confirmed'
```

**Step 3 — Create a Goods Receipt (physical delivery arrives)**
```
POST /api/purchase/receipts
Body: { po_id, delivery_note_ref, items: [{ product_id, quantity_received }] }

Service does (in a single transaction):
  1. Validates PO status === 'confirmed'
  2. Creates GoodsReceipt header (generates GRN-{timestamp} number)
  3. For each item:
     a. Creates GoodsReceiptLine
     b. Increments PurchaseOrderLine.received_qty
     c. Increments Product.on_hand_qty (via stockMutations.addStockOnReceipt)
     d. Creates StockLedger entry (movement_type: 'purchase_in')
  4. Checks if all PO lines are now fully received → sets PO status to 'received'
```

**Step 4 — Create a Vendor Bill (invoice)**
```
POST /api/purchase/bills
Body: { po_id, vendor_id, invoice_date, due_date, subtotal, tax, total_amount }

Bill status flow: pending_payment → approved_for_payment → paid
Only 'owner' role can mark a bill as paid.
```

#### Procurement Suggestions (Auto-Reorder Alerts)

When stock drops below the `reorder_level` set on a product, `stockMutations.js` **automatically creates a `ProcurementSuggestion`** record. The purchasing team can then:

```
GET  /api/purchase/suggestions          → see all pending suggestions
POST /api/purchase/suggestions/:id/convert → convert suggestion into a draft PO
```

---

### 6.2 Manufacturing Module

The Manufacturing module handles production from Bill of Materials (BOM) definition through to finished goods.

#### Files

```
src/modules/manufacturing/
  ├── bom.routes.js     → /api/boms
  ├── bom.controller.js
  ├── bom.service.js    → BOM CRUD, BOM line management
  ├── mo.routes.js      → /api/manufacturing-orders
  ├── mo.controller.js
  └── mo.service.js     → MO lifecycle + stock mutations
```

#### Bill of Materials (BOM)

A BOM defines what components are needed to make one unit of a finished product.

```
BillOfMaterials
  └── BOMLine[]
       ├── component_product_id  ← raw material / sub-component
       ├── qty_per_unit          ← how much is needed per finished unit
       └── operation             ← 'assembly' | 'painting' | 'packing'
```

Example: To make 1 unit of "Wooden Chair":
- `2.0 units` of "Timber Board" (assembly operation)
- `0.5 L` of "Wood Varnish" (painting operation)
- `1 unit` of "Packaging Box" (packing operation)

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

**Step 2 — Create a Manufacturing Order**
```
POST /api/manufacturing-orders
Body: { product_id, quantity }

Service does:
  1. Looks up BOM for product_id (throws if no BOM)
  2. Creates ManufacturingOrder (status: draft)
```

**Step 3 — Confirm the MO (Reserve Components)**
```
POST /api/manufacturing-orders/:id/confirm

Service does (in a transaction):
  1. Validates status === 'draft'
  2. For each BOM line:
     → reserveStock(tx, component_product_id, qty_per_unit × quantity)
     → Increments Product.reserved_qty (ensures components can't be sold)
  3. Auto-generates Work Orders for each unique operation (assembly, painting, etc.)
  4. Updates status to 'confirmed'
```

**Step 4 — Complete the MO (Consume & Produce)**
```
POST /api/manufacturing-orders/:id/complete

Service does (in a transaction):
  1. Validates status is 'confirmed' or 'in_progress'
  2. For each BOM line:
     → consumeComponentStock(tx, component_product_id, required_qty)
     → Decrements BOTH on_hand_qty and reserved_qty (components are used up)
  3. produceFinishedGoods(tx, product_id, quantity)
     → Increments on_hand_qty of the finished product
  4. Marks all pending Work Orders as completed
  5. Updates MO status to 'completed'
```

**Cancel Flow (returns reserved stock)**
```
POST /api/manufacturing-orders/:id/cancel

If status was 'confirmed' or 'in_progress':
  → releaseReservation for all BOM components (undoes Step 3)
  → Deletes Work Orders
  → Sets status to 'cancelled'
```

---

## 7. The Stock Engine — `stockMutations.js`

**File**: `src/utils/stockMutations.js`

This is the **single most important utility file** in the backend. ALL operations that touch `product.on_hand_qty` or `product.reserved_qty` go through this file.

### Why a Centralized File?

Without this, stock logic would be copy-pasted in 5 different service files and could easily go out of sync. Bugs in one module wouldn't be caught consistently.

### Invariants (Never Broken)

```
1. on_hand_qty   >= 0          (stock never goes negative)
2. reserved_qty  >= 0          (no negative reservations)
3. reserved_qty  <= on_hand_qty (can't reserve more than you have)
```

If any operation would violate an invariant, a `BusinessLogicError` is thrown and the entire `prisma.$transaction()` is rolled back automatically.

### Functions

| Function | Called by | What it does |
|---|---|---|
| `reserveStock(tx, productId, qty)` | Sales Order confirm, MO confirm | `reserved_qty += qty` |
| `releaseReservation(tx, productId, qty)` | SO cancel, MO cancel | `reserved_qty -= qty` |
| `deductStockOnDelivery(tx, productId, qty)` | Sales Order deliver | `on_hand -= qty`, `reserved -= qty` |
| `addStockOnReceipt(tx, productId, qty)` | Goods Receipt create | `on_hand += qty` |
| `consumeComponentStock(tx, productId, qty)` | MO complete | `on_hand -= qty`, `reserved -= qty` |
| `produceFinishedGoods(tx, productId, qty)` | MO complete | `on_hand += qty` |

> All functions take `tx` (a Prisma transaction client) as first argument, so they always run atomically inside the caller's transaction.

### Auto-Reorder Logic

After `deductStockOnDelivery` and `consumeComponentStock`, the system automatically calls `checkReorderLevel()`:

```js
if (product.on_hand_qty < product.reorder_level) {
  // Create a ProcurementSuggestion if one doesn't already exist
}
```

This means the purchasing team is **automatically notified** whenever stock falls below the configured threshold.

---

## 8. Audit Trail

Every significant action is logged in the `audit_logs` table. The log contains:

| Field | Description |
|---|---|
| `user_id` | Who performed the action |
| `model_name` | Which table was affected (e.g. `PurchaseOrder`) |
| `record_id` | Which specific record |
| `action` | `create` / `update` / `delete` / `status_change` |
| `old_value` | JSON snapshot before the change |
| `new_value` | JSON snapshot after the change |
| `timestamp` | When it happened |

Access audit logs via `GET /api/audit-logs` (admin only).

Similarly, every stock movement is recorded in `stock_ledger`:

| Field | Description |
|---|---|
| `movement_type` | `sale_out` / `purchase_in` / `mfg_consume` / `mfg_produce` / `adjustment` |
| `qty_change` | Positive for incoming, negative for outgoing |
| `reference_model` | Source document (e.g. `GoodsReceipt`, `SalesOrder`) |
| `reference_id` | UUID of the source document |

---

## 9. Superusers & Seeding

The backend ships with two built-in super-users. These are created by the seed script and bypass the normal PENDING → APPROVED registration flow.

| Login ID | Password | Role | Permissions |
|---|---|---|---|
| `admin` | `admin` | `admin` | User management, all module operations |
| `owner` | `owner` | `owner` | Everything admin can do **plus** financial approvals (bill payment, PO financial sign-off) |

### Run the Seed

```bash
cd backend
npm run seed
# OR: node seed/seed.js
```

The seed script also creates the 4 core ERP modules in the `modules` table:
- `sales`
- `purchase`
- `manufacturing`
- `inventory`

Passwords are hashed with **bcrypt (cost factor 10/12)** before storage — plain text is never stored.

---

## 10. Running the Backend

### Prerequisites

- Node.js >= 18
- PostgreSQL running
- `.env` file configured (copy from `.env.example`)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/erp_nexus"
JWT_SECRET="your-super-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
PORT=3000
NODE_ENV=development
```

### Setup Commands

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Push the Prisma schema to PostgreSQL (creates all tables)
npx prisma db push

# 3. Seed the database (creates admin, owner, and modules)
npm run seed

# 4. Start the development server (with hot reload)
npm run dev

# 5. View the API docs (Swagger UI)
# Open: http://localhost:3000/api/docs
```

### All Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start with nodemon (auto-restarts on file change) |
| `npm start` | Start without hot reload (production) |
| `npm run seed` | Seed database with superusers + modules |
| `npx prisma db push` | Sync schema.prisma → PostgreSQL tables |
| `npx prisma studio` | Open visual database browser |
| `npx prisma migrate dev` | Create a tracked migration file |
| `npm test` | Run Jest tests |

---

## 11. Critical Architecture Rules

These rules **must not be broken** by any team member:

### ✅ DO

- **Use Prisma for ALL database operations** — `prisma.model.create()`, `prisma.model.update()`, etc.
- **Use `prisma.$transaction()`** for any operation that touches more than one table.
- **Route all stock changes through `stockMutations.js`** — never write raw `on_hand_qty` updates in a service file.
- **Use `npx prisma db push`** to sync schema changes to the database.
- **Put business logic in service files** — controllers only parse requests and call services.

### ❌ DO NOT

- **Do NOT execute `/sql/*.sql` files manually** against the database. They will conflict with Prisma's state and cause double-counting of stock.
- **Do NOT write raw `pool.query('INSERT INTO ...')` calls** — we do not use a raw pg pool.
- **Do NOT add stock-altering logic inside controllers** — it must go through `stockMutations.js`.
- **Do NOT create database triggers** to manage stock — the Node.js layer does this already. Running both will double-count stock.
- **Do NOT let regular users access financial routes** — bill payments and PO financial approvals require the `owner` role.

---

## API Route Reference

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
| GET | `/api/vendors` | Auth | List vendors |
| POST | `/api/vendors` | Admin | Create vendor |
| GET | `/api/purchase-orders` | Auth | List all POs |
| POST | `/api/purchase-orders` | Admin | Create draft PO |
| POST | `/api/purchase-orders/:id/confirm` | Admin | Confirm PO |
| POST | `/api/purchase/receipts` | Auth | Create Goods Receipt |
| GET | `/api/purchase/bills` | Auth | List vendor bills |
| POST | `/api/purchase/bills` | Admin | Create vendor bill |
| PATCH | `/api/purchase/bills/:id/pay` | **Owner** | Mark bill as paid |
| GET | `/api/purchase/suggestions` | Auth | List procurement suggestions |
| GET | `/api/boms` | Auth | List BOMs |
| POST | `/api/boms` | Admin | Create BOM |
| GET | `/api/manufacturing-orders` | Auth | List MOs |
| POST | `/api/manufacturing-orders` | Admin | Create MO |
| POST | `/api/manufacturing-orders/:id/confirm` | Admin | Confirm MO (reserves stock) |
| POST | `/api/manufacturing-orders/:id/complete` | Admin | Complete MO (consumes + produces) |
| GET | `/api/stock-ledger` | Auth | View stock movements |
| GET | `/api/audit-logs` | Admin | View audit trail |
| GET | `/api/docs` | Public | Swagger API documentation |

---

*Last updated: June 2026 — ERP-Nexus Backend Team*
