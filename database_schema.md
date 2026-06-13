# ERP-Nexus Database Schema & Integration Guide

This document provides a comprehensive guide to the PostgreSQL database configuration, lifecycle rules, execution sequences, and application backend integration for **ERP-Nexus**.

---

## 🚀 File Execution Sequence

To build the database schema from scratch, run the SQL scripts in the following order:

1. **`sql/001_schema.sql`** — Base tables, relations, and default constraints.
2. **`sql/002_triggers.sql`** — Mutability constraints and automated syncing.
3. **`sql/003_indexes.sql`** — Optimization indexes for basic operations.
4. **`sql/004_seed.sql`** — Seeds the 4 base modules and default administrator account.
5. **`sql/005_amendments.sql`** — Additions required for Node.js backend integration (e.g., JWT `refresh_tokens`, `requested_modules`).
6. **`sql/006_purchase_module.sql`** — Complete Purchase Module schema, optimization indexes, and inventory automation triggers.

---

## 🗄️ Database Architecture Details

```
                                  [users]
                                  /     \
                       (one-to-one)     (one-to-many)
                              /             \
                      [user_profiles]      [user_module_access]
                                                    |
                                               (many-to-one)
                                                    |
                                                [modules]
```

### Module 1: Authentication & Profiles
* **`users`**: Manages credentials, roles, and status.
  * `status`: Enforces standard workflow (`PENDING` -> `APPROVED` / `REJECTED`).
  * `is_admin`: Allows only one administrator via the unique partial index:
    ```sql
    CREATE UNIQUE INDEX unique_single_admin ON users (is_admin) WHERE (is_admin = TRUE);
    ```
* **`user_profiles`**: Separate table storing personal metadata to easily lock field edits for standard users.
  * Synchronizes displaying email (`email_display`) automatically whenever the parent `users.email` is updated.

### Module 2: Access Control
* **`modules`**: Stores registry of ERP modules (`sales`, `purchase`, `product`, `manufacture`).
* **`user_module_access`**: Manages allocations granted to users by the admin.

### Module 3: Purchase Module
* **`vendors`**: Profiles of material suppliers.
* **`raw_materials`**: Catalog of items containing current stock and reorder checkpoints.
* **`purchase_orders`** & **`purchase_order_items`**: Tracks procurement requests.
* **`goods_receipts`** & **`goods_receipt_items`**: Records physical item arrivals.
* **`vendor_bills`**: Invoices received from vendors for approvals and payments.
* **`stock_ledger`**: Automated auditing ledger recording every stock transaction.
* **`procurement_suggestions`**: Automatically suggested replenishment requests.

---

## 🛡️ Business Rules & Trigger Automations

### 1. Account Mutability & Security Constraints
To enforce access control policies at the database layer, triggers verify context via a session variable `erp.is_admin`:
* **`login_id`**: Immutable for all users, including the admin.
* **Locked Profile Fields**: Standard users cannot modify their own `full_name`, `position`, or `email_display`. Admin can modify any fields by setting the session variable.
* **Editable Profile Fields**: Standard users are permitted to update `address`, `mobile_no`, and `profile_photo` (stored in the `/profile_pic` folder).

### 2. Purchase Inventory Automations
* **Goods Receipt Trigger**: When inserting items into `goods_receipt_items`, the database automatically:
  1. Increments `raw_materials.current_stock` by the received quantity.
  2. Creates a log entry in `stock_ledger` with the new running balance.
  3. Increments `purchase_order_items.quantity_received`.
  4. Dynamically shifts the parent `purchase_orders.status` to `PARTIALLY_RECEIVED` or `FULLY_RECEIVED` based on total receipts.
* **Auto-Reorder Check Trigger**: When raw material stock drops below its defined `reorder_level` (during insertion or updates), the database automatically creates a `PENDING` request in `procurement_suggestions` if one does not already exist.

---

## 💻 Node.js / Express Integration Guide

To perform administrative writes on locked fields, the database connection transaction must inform PostgreSQL of the admin context by setting `erp.is_admin = 'true'`.

### User Updating Profile (Normal Flow)
Standard users only update mutable columns. They do not set the session flag.
```javascript
const { Pool } = require('pg');
const pool = new Pool();

async function updateProfileByUser(userId, address, mobileNo) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Updates mutable fields only
    const query = `
      UPDATE user_profiles
      SET address = $1, mobile_no = $2
      WHERE user_id = $3;
    `;
    await client.query(query, [address, mobileNo, userId]);
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

### Admin Performing Privileged Updates
Admin must execute `SET LOCAL erp.is_admin = 'true';` inside the transaction.
```javascript
async function updateProfileByAdmin(targetUserId, newName, newPosition, newAddress) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Tell PostgreSQL that this is an Admin session
    await client.query("SET LOCAL erp.is_admin = 'true';");
    
    // 2. Perform updates to locked fields
    const query = `
      UPDATE user_profiles
      SET full_name = $1, position = $2, address = $3
      WHERE user_id = $4;
    `;
    await client.query(query, [newName, newPosition, newAddress, targetUserId]);
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```
