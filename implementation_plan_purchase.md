# ERP-Nexus — Integrated Implementation Plan (Auth & Purchase)

This document covers:
1. **User Authentication & Signup Approval Flow** (Express API + Prisma Mappings)
2. **Purchase Module Integration Plan** (Controllers, Routes, and Stock Mutations)
3. **Super User & Role Permissions** (`admin` and `owner` definitions)

---

## 🔐 1. Super User Roles & Permissions

The system defines **two separate super users** with distinct scopes of authority:

### A. The Admin Account (`role: admin`)
* **Login Identifier**: `admin` (or `admin@erp-nexus.local`)
* **Default Password**: `admin`
* **Privileges**:
  * View pending registrations.
  * Approve or Reject new registrations.
  * Manage users (activate/deactivate).
  * Edit core user profile fields (`full_name`, `position`).
  * Cannot approve payments or view sensitive financial documents/reports.

### B. The Owner Account (`role: owner`)
* **Login Identifier**: `owner` (or `owner@erp-nexus.local`)
* **Default Password**: `owner`
* **Privileges**:
  * **All administrative tasks** (Approvals, user management, profile edits).
  * **Financial operations**:
    * Review and Approve Purchase Orders.
    * Process Vendor Bill Payments (approving bills, registering payment references).
    * View financial reports.

---

## 🔑 2. User Authentication & Approval Flow

### System Workflow
```
[User Registers] → status: PENDING
      ↓
[Admin / Owner reviews user request]
      ↓
[If Approved → status: APPROVED, is_active: true]
[If Rejected → status: REJECTED, is_active: false]
```

### Prisma Schema Adjustments (Auth)
Add a `UserStatus` enum and update the `User` model to track registration workflow:

```prisma
enum UserStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id                String             @id @default(uuid()) @db.Uuid
  name              String             @db.VarChar(150)
  email             String             @unique @db.VarChar(254)
  login_id          String             @unique @db.VarChar(50) // Mapped login ID
  password          String             @db.VarChar(128)
  role              Role
  is_active         Boolean            @default(false)        // False until approved
  status            UserStatus         @default(PENDING)
  requested_modules Int[]              @default([])
  rejected_reason   String?            @db.Text
  last_login_at     DateTime?          @db.Timestamptz()
  created_at        DateTime           @default(now()) @db.Timestamptz()
  // ... relations ...
}
```

### Auth API Endpoints

#### `POST /api/auth/register` (Public)
* Registers a new user. Default role is `purchase`, `sales`, etc.
* Sets `status = PENDING` and `is_active = false`.
* Requires password check: 8+ chars, containing uppercase, lowercase, number, and special character.

#### `POST /api/auth/login` (Public)
* Logs in all users, including `admin` and `owner`.
* **Block login** if `status` is not `APPROVED` or `is_active` is `false`.
* Returns JWT access token (payload: `{ id, role, email }`) and refresh token.

#### `POST /api/admin/approve/:userId` (Admin / Owner Only)
* Sets `status = APPROVED` and `is_active = true`.
* Links requested modules inside `user_module_access`.

#### `POST /api/admin/reject/:userId` (Admin / Owner Only)
* Sets `status = REJECTED`, `is_active = false`, and logs `rejected_reason`.

---

## 📦 3. Purchase Module Express & Prisma Integration

### Route Permissions
Endpoints under `/api/purchase` will require:
1. Valid JWT Authentication.
2. Authorization validation for the appropriate role:
   * **General Purchase Task**: `role` must be `purchase`, `admin`, or `owner`.
   * **Financial Task (Payment/PO Approval)**: `role` must be `owner` (or `admin` where allowed; payments require `owner`).

```javascript
// src/middleware/authorize.js
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    // Admin & Owner override general module checks
    if (req.user.role === 'owner') return next();
    if (req.user.role === 'admin' && !allowedRoles.includes('owner_only')) return next();
    
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access Denied: Insufficient permissions.' });
    }
    next();
  };
};
```

---

### Endpoints and Business Logic

#### A. Vendors & Materials CRUD
* **`GET /vendors`** — List suppliers.
* **`POST /vendors`** — Create supplier (Prisma write).
* **`GET /materials`** — List products where `procurement_type = MTS`.

#### B. Purchase Orders
* **`POST /orders`** — Create a PO draft (Prisma transaction creating PO and PO lines).
* **`POST /orders/:id/confirm`** — Confirm PO (Moves status from `draft` to `confirmed`).
* **`POST /orders/:id/approve`** — **Owner Only** (Approve PO values for payment/receipt readiness).
  * Middleware: `authorize(['owner'])`

#### C. Goods Receipts (`POST /receipts`)
Physical arrivals are logged using a Prisma transaction. All inventory and status mutations run inside the transaction using JavaScript logic:

```javascript
const { addStockOnReceipt } = require('../../utils/stockMutations');

async function processGoodsReceipt(req, res) {
  const { po_id, delivery_note_ref, items } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Goods Receipt
      const receipt = await tx.goodsReceipt.create({
        data: {
          receipt_number: `GRN-${Date.now()}`,
          po_id,
          received_by: req.user.id,
          delivery_note_ref,
          lines: {
            create: items.map(item => ({
              product_id: item.product_id,
              qty_received: item.quantity_received,
            }))
          }
        }
      });

      // 2. Process each received line
      for (const item of items) {
        // Increment stock level via stock mutations helper
        const updatedProduct = await addStockOnReceipt(tx, item.product_id, item.quantity_received);

        // Update received quantity on PO Line
        await tx.purchaseOrderLine.updateMany({
          where: { po_id, product_id: item.product_id },
          data: { received_qty: { increment: item.quantity_received } }
        });

        // Write Stock Ledger entry
        await tx.stockLedger.create({
          data: {
            product_id: item.product_id,
            movement_type: 'purchase_in',
            qty_change: item.quantity_received,
            reference_model: 'GoodsReceipt',
            reference_id: receipt.id,
            created_by: req.user.id
          }
        });

        // Check if stock fell below reorder level and suggest purchase
        await checkAndSuggestReorder(tx, updatedProduct);
      }

      // 3. Update PO status to received if complete
      const lines = await tx.purchaseOrderLine.findMany({ where: { po_id } });
      const allReceived = lines.every(line => parseFloat(line.received_qty) >= parseFloat(line.ordered_qty));
      if (allReceived) {
        await tx.purchaseOrder.update({
          where: { id: po_id },
          data: { status: 'received' }
        });
      }

      return receipt;
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
```

#### D. Vendor Bills & Payments (`/api/purchase/bills`)
* **`POST /`** — Upload bill (Multer PDF upload + Prisma create).
* **`POST /:id/pay`** — **Owner Only**. Approved payments are processed by the owner only.
  * Middleware: `authorize(['owner'])`
  * Updates status to `paid`, sets `paid_at = NOW()`, `paid_by = owner_id`, and saves `payment_reference`.

---

## 📊 Pre-Seeded Super Users (Bcrypt Hashed)

Include these in the database seed script:

### 1. Admin
* **Email / Username**: `admin`
* **Role**: `admin`
* **Status**: `APPROVED` / `is_active = true`
* **Bcrypt Hash**: `$2b$12$Iv9O1AIHgZRKZ1wFkCrvF.FBq9/ixBL1/vWOLCOwUFsFmeA/zTXRC`

### 2. Owner
* **Email / Username**: `owner`
* **Role**: `owner`
* **Status**: `APPROVED` / `is_active = true`
* **Bcrypt Hash**: `$2b$12$ZrtHjrExoUFZrb1mV9uI/uSZ1.dupHVse5Yktvm6IvGp/veOHR84C`
