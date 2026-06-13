# ERP-Nexus — Purchase Module Backend & DB Integration Plan

This plan outlines the routes, controller logic, database queries, and transaction flows required to connect the **Purchase Module** (vendors, raw materials, purchase orders, goods receipts, bills, inventory tracking) to the Express backend.

---

## 🔐 Route Permissions & Access Control
We will secure all purchase endpoints under a custom middleware that validates if the user has been granted access to the **Purchase Module**:

```js
// src/middleware/purchaseAccess.middleware.js
const pool = require('../config/db');

module.exports = async (req, res, next) => {
  if (req.user.is_admin) return next(); // Admin has override access

  try {
    const result = await pool.query(
      `SELECT 1 FROM user_module_access a
       JOIN modules m ON a.module_id = m.module_id
       WHERE a.user_id = $1 AND m.module_name = 'purchase' AND m.is_active = TRUE`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied: Purchase Module not allocated or inactive.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database access validation error.' });
  }
};
```

---

## 🛣️ Route & Transaction Definitions

### 1. Vendors Management (`/api/purchase/vendors`)
* **`GET /`** — List all vendors.
  * Query: `SELECT * FROM vendors ORDER BY name ASC;`
* **`POST /`** — Register a new vendor.
  * Validation: Alphanumeric `vendor_code` (unique), `name` (required).
  * Query: `INSERT INTO vendors (vendor_code, name, contact_name, email, phone, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`
* **`PATCH /:id`** — Update vendor parameters.

---

### 2. Raw Materials / Inventory Catalog (`/api/purchase/materials`)
* **`GET /`** — List all raw materials with current stocks and UoM.
  * Query: `SELECT * FROM raw_materials ORDER BY name ASC;`
* **`POST /`** — Create new raw material.
  * *Note*: If stock is lower than `reorder_level`, DB trigger `trigger_check_low_stock` automatically places a row in `procurement_suggestions`.
  * Query: `INSERT INTO raw_materials (material_code, name, description, unit_of_measure, unit_price, reorder_level, current_stock) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`

---

### 3. Purchase Orders (`/api/purchase/orders`)

* **`GET /`** — List POs. Support filter by `status`.
* **`POST /`** — Create a Purchase Order (Must run inside a **Transaction** to populate PO and PO Items).

**Request Body:**
```json
{
  "vendor_id": "83776f11-e0f4-e879-bf6f-6fea379227e2",
  "expected_delivery": "2026-07-01",
  "items": [
    { "material_id": "uuid-1", "quantity_ordered": 100, "unit_price": 42.50 },
    { "material_id": "uuid-2", "quantity_ordered": 50, "unit_price": 115.00 }
  ]
}
```

**Transaction Query Logic:**
```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  // 1. Generate unique PO number (e.g. PO-YYYYMMDD-seq)
  const poNumber = `PO-${Date.now()}`;
  
  // 2. Insert PO Header
  const poResult = await client.query(
    `INSERT INTO purchase_orders (po_number, vendor_id, expected_delivery, created_by, status)
     VALUES ($1, $2, $3, $4, 'DRAFT') RETURNING po_id`,
    [poNumber, body.vendor_id, body.expected_delivery, req.user.user_id]
  );
  const poId = poResult.rows[0].po_id;
  
  // 3. Insert PO Line Items
  let totalAmount = 0;
  for (const item of body.items) {
    const itemTotal = item.quantity_ordered * item.unit_price;
    totalAmount += itemTotal;
    await client.query(
      `INSERT INTO purchase_order_items (po_id, material_id, quantity_ordered, unit_price)
       VALUES ($1, $2, $3, $4)`,
      [poId, item.material_id, item.quantity_ordered, item.unit_price]
    );
  }
  
  // 4. Update PO total amount
  await client.query(
    `UPDATE purchase_orders SET total_amount = $1 WHERE po_id = $2`,
    [totalAmount, poId]
  );
  
  await client.query('COMMIT');
  res.status(201).json({ message: 'PO created in DRAFT status.', po_id: poId });
} catch (err) {
  await client.query('ROLLBACK');
  res.status(500).json({ error: err.message });
} finally {
  client.release();
}
```

* **`POST /:id/approve`** — Admin-only PO approval.
  * Backend must run: `SET LOCAL erp.is_admin = 'true';`
  * Updates `status` to `'APPROVED'`, sets `approved_by` and `approved_at`.

---

### 4. Goods Receipts (`/api/purchase/receipts`)

* **`POST /`** — Log a physical delivery.
  * *Note*: DB trigger `trigger_process_goods_receipt` does the heavy lifting: increments `current_stock`, updates `quantity_received` on PO items, logs to `stock_ledger`, and updates PO status (`PARTIALLY_RECEIVED` / `FULLY_RECEIVED`).

**Request Body:**
```json
{
  "po_id": "po-uuid-here",
  "delivery_note_ref": "BOL-9921",
  "items": [
    { "material_id": "uuid-1", "quantity_received": 40.00 },
    { "material_id": "uuid-2", "quantity_received": 20.00 }
  ]
}
```

**Transaction Query Logic:**
```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const grnNumber = `GRN-${Date.now()}`;
  
  // 1. Insert goods_receipts header
  const receiptResult = await client.query(
    `INSERT INTO goods_receipts (receipt_number, po_id, received_by, delivery_note_ref)
     VALUES ($1, $2, $3, $4) RETURNING receipt_id`,
    [grnNumber, body.po_id, req.user.user_id, body.delivery_note_ref]
  );
  const receiptId = receiptResult.rows[0].receipt_id;
  
  // 2. Insert items (Triggers automatically process stock, ledger, and PO quantities)
  for (const item of body.items) {
    await client.query(
      `INSERT INTO goods_receipt_items (receipt_id, material_id, quantity_received)
       VALUES ($1, $2, $3)`,
      [receiptId, item.material_id, item.quantity_received]
    );
  }
  
  await client.query('COMMIT');
  res.status(201).json({ message: 'Goods receipt processed successfully.' });
} catch (err) {
  await client.query('ROLLBACK');
  res.status(500).json({ error: err.message });
} finally {
  client.release();
}
```

---

### 5. Vendor Bills & Payments (`/api/purchase/bills`)

* **`POST /`** — Upload an invoice. Uses `multer` middleware to save PDF files to `profile_pic/` or a dedicated uploads directory.
  * Payload requires: `po_id`, `vendor_id`, `bill_number`, `invoice_date`, `due_date`, `subtotal`, `tax`, `total_amount`, and the uploaded file path saved to `attachment_url`.
* **`POST /:id/pay`** — **Owner/Admin Only**.
  * Updates status to `PAID`, sets `paid_at = NOW()`, `paid_by = admin_id`, and stores `payment_reference`.
  * Guarded by `admin.middleware.js` to ensure non-admin purchase users cannot execute payments.

---

### 6. Stock Ledger and Suggestions (`/api/purchase/reports`)
* **`GET /ledger`** — Retrieve stock movements (sorted newest first).
* **`GET /suggestions`** — List active/pending procurement suggestions from `procurement_suggestions` table.
* **`PATCH /suggestions/:id`** — Mark suggestions as `PO_CREATED` or `IGNORED`.

---

## Complete API Routes Blueprint

```
All routes below prefix with /api/purchase and require JWT Authentication + Purchase Module allocation.

GET    /vendors                  → List vendors
POST   /vendors                  → Create vendor
PATCH  /vendors/:id              → Update vendor details

GET    /materials                → List raw materials
POST   /materials                → Create raw material

GET    /orders                   → List purchase orders
POST   /orders                   → Create PO draft (Transaction: po & items)
POST   /orders/:id/approve       → Admin approves PO (Requires admin.middleware)

POST   /receipts                 → Log physical delivery (Transaction: triggers update inventory)
GET    /receipts                 → View goods receipts logs

POST   /bills                    → Upload vendor bill invoice (multer upload)
GET    /bills                    → View vendor bills
POST   /bills/:id/pay            → Pay vendor bill (Requires admin.middleware)

GET    /reports/ledger           → View stock ledger history
GET    /reports/suggestions      → View reorder procurement suggestions
PATCH  /reports/suggestions/:id  → Update suggestion status
```
