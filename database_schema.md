# ERP-Nexus Database Schema Setup & Integration

This document outlines the PostgreSQL database structure, script execution sequence, and Express backend transaction integrations for **ERP-Nexus**.

---

## 🚀 Script Execution Sequence

To build the database, execute the SQL files in the following order:

1. **`sql/001_schema.sql`** — Base tables, relations, and default constraints.
2. **`sql/002_triggers.sql`** — Mutability constraints and profile email syncing.
3. **`sql/003_indexes.sql`** — Core optimization indexes.
4. **`sql/004_seed.sql`** — Seeds the 4 base modules and default administrator credentials.
5. **`sql/005_amendments.sql`** — JWT `refresh_tokens` and registration flow amendments.
6. **`sql/006_purchase_module.sql`** — Creates tables for `goods_receipts`, `goods_receipt_lines`, `vendor_bills`, and `procurement_suggestions`, and adds the `reorder_level` column to `products`.

---

## 🗄️ Database Architecture (Prisma Mapped)

The database schema aligns directly with the models defined in the Prisma schema:

* **`users`** & **`user_profiles`**: Linked via a one-to-one relationship.
* **`products`**: Universal catalog table storing both raw materials and finished goods, tracking `on_hand_qty` (current stock), `reserved_qty`, and `reorder_level`.
* **`purchase_orders`** & **`purchase_order_lines`**: Tracks orders placed to suppliers.
* **`goods_receipts`** & **`goods_receipt_lines`**: Logs actual deliveries against a purchase order.
* **`vendor_bills`**: Invoices received from vendors for approvals and payments.
* **`stock_ledger`**: Logs every historical movement of raw materials for absolute inventory auditability.
* **`procurement_suggestions`**: Automatically suggested replenishment requests.

---

## 🛡️ Business Rules & Trigger Automations

### 1. Immutability & Safety Triggers
Triggers in `002_triggers.sql` verify session credentials using the variable `erp.is_admin`:
* If `erp.is_admin` is not set to `'true'`, updates to the core fields (`full_name`, `position`, `email`) in `user_profiles` are blocked.
* Updates to `users.login_id` are strictly prohibited for all connections.

### 2. Operational Inventory Business Logic
All inventory movements, PO line increments, and reorder suggestion logs are managed by the **Node.js Express application** (using your `utils/stockMutations.js` helper and controllers) inside Prisma transactions (`prisma.$transaction()`) to ensure complete reliability.

---

## 💻 Express / Prisma Transaction Example

To register physical deliveries, update stock, and audit logs programmatically inside your backend controller:

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

      // 2. Process items
      for (const item of items) {
        // Increment stock level via stock mutations helper
        const updatedProduct = await addStockOnReceipt(tx, item.product_id, item.quantity_received);

        // Update the received quantity on PO Line
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
      }

      return receipt;
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
```
