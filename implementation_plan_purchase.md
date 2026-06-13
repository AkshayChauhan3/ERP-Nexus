# ERP-Nexus — Purchase Module Backend & Prisma ORM Integration Plan

This plan details how to implement the **Purchase Module** backend using the **Prisma ORM** and Express. It aligns with the existing codebase architecture by using the universal `Product` table and moving business logic/triggers into the Node.js application layer.

---

## 🔐 Route Permissions & Access Control
We will secure all purchase endpoints under a custom middleware that validates if the user has been granted access to the **Purchase Module**:

```js
// src/middleware/purchaseAccess.middleware.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = async (req, res, next) => {
  // Admin and owner have access automatically
  if (req.user.role === 'admin' || req.user.role === 'owner') {
    return next();
  }

  // Purchase users must be active and have the appropriate role
  if (req.user.role === 'purchase' && req.user.is_active) {
    return next();
  }

  return res.status(403).json({ error: 'Access denied: Purchase Module permissions required.' });
};
```

---

## 🛣️ Route & Transaction Definitions

### 1. Vendors Management (`/api/purchase/vendors`)
* **`GET /`** — List all vendors.
  * Query: `prisma.vendor.findMany({ orderBy: { name: 'asc' } })`
* **`POST /`** — Register a new vendor.
  * Validation: `name` (required), unique `email` (optional).
  * Query: `prisma.vendor.create({ data: { name, email, phone, address } })`
* **`PATCH /:id`** — Update vendor parameters.

---

### 2. Materials Catalog (`/api/purchase/materials`)
* **`GET /`** — List all raw materials (MTS Products).
  * Query: `prisma.product.findMany({ where: { procurement_type: 'MTS' }, orderBy: { name: 'asc' } })`
* **`POST /`** — Create new MTS product.
  * *Note*: If initial stock is lower than `reorder_level`, backend logic automatically places an alert in `procurement_suggestions`.

---

### 3. Purchase Orders (`/api/purchase/orders`)

* **`GET /`** — List POs. Support filter by `status` (draft, confirmed, received).
* **`POST /`** — Create a Purchase Order (Must run inside a **Transaction** to populate PO and PO Lines).

**Request Body:**
```json
{
  "vendor_id": "83776f11-e0f4-e879-bf6f-6fea379227e2",
  "items": [
    { "product_id": "uuid-1", "quantity_ordered": 100, "unit_price": 42.50 },
    { "product_id": "uuid-2", "quantity_ordered": 50, "unit_price": 115.00 }
  ]
}
```

**Transaction Logic:**
```javascript
const result = await prisma.$transaction(async (tx) => {
  // 1. Insert PO Header
  const po = await tx.purchaseOrder.create({
    data: {
      vendor_id: body.vendor_id,
      created_by: req.user.id,
      status: 'draft',
      lines: {
        create: body.items.map(item => ({
          product_id: item.product_id,
          ordered_qty: item.quantity_ordered,
          unit_price: item.unit_price
        }))
      }
    },
    include: { lines: true }
  });
  return po;
});
```

* **`POST /:id/approve`** — Admin-only PO approval.
  * Updates `status` to `'confirmed'`.

---

### 4. Goods Receipts (`/api/purchase/receipts`)

* **`POST /`** — Log a physical delivery.
  * *Note*: Business logic runs inside a transaction, calling stock utilities and checking reorders.

**Request Body:**
```json
{
  "po_id": "po-uuid-here",
  "delivery_note_ref": "BOL-9921",
  "items": [
    { "product_id": "uuid-1", "quantity_received": 40.00 },
    { "product_id": "uuid-2", "quantity_received": 20.00 }
  ]
}
```

**Transaction Logic:**
```javascript
const { addStockOnReceipt } = require('../../utils/stockMutations');

const result = await prisma.$transaction(async (tx) => {
  // 1. Insert goods_receipts header and line items
  const receipt = await tx.goodsReceipt.create({
    data: {
      receipt_number: `GRN-${Date.now()}`,
      po_id: body.po_id,
      received_by: req.user.id,
      delivery_note_ref: body.delivery_note_ref,
      lines: {
        create: body.items.map(item => ({
          product_id: item.product_id,
          qty_received: item.quantity_received
        }))
      }
    }
  });

  // 2. Process each received item
  for (const item of body.items) {
    // Add stock level atomically using existing mutation utility
    const updatedProduct = await addStockOnReceipt(tx, item.product_id, item.quantity_received);

    // Update received quantity on PO Line
    await tx.purchaseOrderLine.updateMany({
      where: { po_id: body.po_id, product_id: item.product_id },
      data: {
        received_qty: { increment: item.quantity_received }
      }
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

    // Check reorder levels
    await checkAndSuggestReorder(tx, updatedProduct);
  }

  // 3. Update PO status to received if all line items are fulfilled
  const lines = await tx.purchaseOrderLine.findMany({ where: { po_id: body.po_id } });
  const allReceived = lines.every(line => parseFloat(line.received_qty) >= parseFloat(line.ordered_qty));
  
  if (allReceived) {
    await tx.purchaseOrder.update({
      where: { id: body.po_id },
      data: { status: 'received' }
    });
  }

  return receipt;
});
```

---

### 5. Vendor Bills & Payments (`/api/purchase/bills`)

* **`POST /`** — Upload an invoice. Uses `multer` middleware to save PDF files to `profile_pic/` or a dedicated uploads directory.
  * Payload requires: `po_id`, `vendor_id`, `bill_number`, `invoice_date`, `due_date`, `subtotal`, `tax`, `total_amount`, and the uploaded file path saved to `attachment_url`.
* **`POST /:id/pay`** — **Owner/Admin Only**.
  * Updates status to `paid`, sets `paid_at = NOW()`, `paid_by = admin_id`, and stores `payment_reference`.
  * Guarded by `authorize(['admin', 'owner'])` to block standard purchase users.

---

### 6. Stock Ledger and Suggestions (`/api/purchase/reports`)
* **`GET /ledger`** — Retrieve stock movements (sorted newest first).
  * Query: `prisma.stockLedger.findMany({ orderBy: { timestamp: 'desc' }, include: { product: true } })`
* **`GET /suggestions`** — List active/pending procurement suggestions from `procurement_suggestions` table.
* **`PATCH /suggestions/:id`** — Mark suggestions as `po_created` or `ignored`.

---

## Complete API Routes Blueprint

```
All routes below prefix with /api/purchase and require JWT Authentication.

GET    /vendors                  → List vendors
POST   /vendors                  → Create vendor
PATCH  /vendors/:id              → Update vendor details

GET    /materials                → List MTS Products
POST   /materials                → Create Product

GET    /orders                   → List purchase orders
POST   /orders                   → Create PO draft (Prisma transaction)
POST   /orders/:id/approve       → Admin approves PO (Sets status to confirmed)

POST   /receipts                 → Log physical delivery (Calls processGoodsReceipt transaction)
GET    /receipts                 → View goods receipts logs

POST   /bills                    → Upload vendor bill invoice (multer upload)
GET    /bills                    → View vendor bills
POST   /bills/:id/pay            → Pay vendor bill (Requires role: admin / owner)

GET    /reports/ledger           → View stock ledger history
GET    /reports/suggestions      → View reorder procurement suggestions
PATCH  /reports/suggestions/:id  → Update suggestion status
```
