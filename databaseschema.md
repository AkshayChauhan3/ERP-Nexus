# ERP-Nexus — Database Schema Reference Manual

This document provides a comprehensive detail of all PostgreSQL tables, data types, constraints, relationships, and enumerations utilized in **ERP-Nexus**. The database is fully managed via **Prisma ORM**.

---

## ─── Database Enumerations (Enums) ───

The system defines PostgreSQL enum types to restrict states and actions across modules:

| Enum Name | Values | Used In | Description |
|---|---|---|---|
| **`RegistrationStatus`** | `PENDING`, `APPROVED`, `REJECTED` | `User` | User account request approval state |
| **`ProcureType`** | `MTS`, `MTO` | `Product` | Supply path: Make To Stock (Buy) or Make To Order (Manufacture) |
| **`SOStatus`** | `draft`, `confirmed`, `delivered`, `cancelled` | `SalesOrder` | Sales Order status progression |
| **`POStatus`** | `draft`, `confirmed`, `received` | `PurchaseOrder` | Purchase Order status progression |
| **`MOStatus`** | `draft`, `confirmed`, `in_progress`, `completed`, `cancelled` | `ManufacturingOrder` | Production order status progression |
| **`WOStatus`** | `pending`, `in_progress`, `completed`, `waiting` | `WorkOrder` | Shop floor routing routing status |
| **`Operation`** | `assembly`, `painting`, `packing` | `BOMLine`, `WorkOrder` | Types of manufacturing operations |
| **`MoveType`** | `sale_out`, `purchase_in`, `mfg_consume`, `mfg_produce`, `adjustment` | `StockLedger` | Types of inventory stock movements |
| **`AuditAction`** | `create`, `update`, `delete`, `status_change` | `AuditLog` | Type of data modification logged |
| **`Severity`** | `high`, `medium`, `low` | `RiskAlert` | AI product supply risk tier |
| **`BillStatus`** | `pending_payment`, `approved_for_payment`, `paid`, `void` | `VendorBill` | Supplier invoice payment tracking states |
| **`SuggestionStatus`** | `pending`, `po_created`, `ignored` | `ProcurementSuggestion` | Automatic inventory replenishment alert states |

---

## ─── Detailed Table Definitions ───

### 1. User & Authentication Module

#### `users`
Represents registered users in the system.
* **Columns**:
  * `user_id` (`UUID`): Primary Key.
  * `login_id` (`VARCHAR(50)`): Unique, required identifier.
  * `email` (`VARCHAR(255)`): Unique, required email address.
  * `password` (`TEXT`): Hashed user password.
  * `is_admin` (`BOOLEAN`): Admin flag (default: `false`).
  * `status` (`RegistrationStatus`): User state (default: `PENDING`).
  * `requested_modules` (`INT[]`): Array of module IDs requested.
  * `rejected_reason` (`TEXT`): Details of rejection if `REJECTED`.
  * `last_login_at` (`TIMESTAMPTZ`): Timestamp of last active login.
  * `created_at` (`TIMESTAMPTZ`): Record creation time (default: `now()`).
  * `updated_at` (`TIMESTAMPTZ`): Auto-updated on record changes.
* **Indexes**:
  * `users_email_idx` (`email`)
  * `users_login_id_idx` (`login_id`)

#### `user_profiles`
Contains profile data linked 1:1 to a system user.
* **Columns**:
  * `profile_id` (`UUID`): Primary Key.
  * `user_id` (`UUID`): Unique foreign key referencing `users(user_id)` (Cascade delete).
  * `full_name` (`VARCHAR(150)`): User's legal name.
  * `position` (`VARCHAR(100)`): Job title/role.
  * `email_display` (`VARCHAR(255)`): Email address shown to other users.
  * `address` (`TEXT`): Mailing address.
  * `mobile_no` (`VARCHAR(15)`): Contact number.
  * `profile_photo` (`TEXT`): Path or URL to profile picture.
  * `updated_at` (`TIMESTAMPTZ`): Auto-updated on record changes.

#### `modules`
The registry of system-wide ERP modules.
* **Columns**:
  * `module_id` (`INT`): Primary Key, Auto-increment.
  * `module_name` (`VARCHAR(50)`): Unique name of the module.
  * `description` (`TEXT`): Functional details.
  * `is_active` (`BOOLEAN`): Active flag (default: `true`).
  * `created_at` (`TIMESTAMPTZ`): Creation timestamp (default: `now()`).

#### `user_module_access`
Tracks permissions linking users to specific modules.
* **Columns**:
  * `access_id` (`INT`): Primary Key, Auto-increment.
  * `user_id` (`UUID`): Foreign key referencing `users(user_id)` (Cascade delete).
  * `module_id` (`INT`): Foreign key referencing `modules(module_id)` (Cascade delete).
  * `granted_at` (`TIMESTAMPTZ`): Timestamp of permission grant (default: `now()`).
  * `granted_by` (`UUID`): Foreign key referencing `users(user_id)` (Set null on delete).
* **Constraints**:
  * Unique constraint on `(user_id, module_id)`.

#### `refresh_tokens`
Stores hashed JWT refresh tokens to manage persistent sessions.
* **Columns**:
  * `token_id` (`UUID`): Primary Key.
  * `user_id` (`UUID`): Foreign key referencing `users(user_id)` (Cascade delete).
  * `token_hash` (`TEXT`): SHA-256 hashed refresh token string.
  * `is_revoked` (`BOOLEAN`): Revocation flag (default: `false`).
  * `issued_at` (`TIMESTAMPTZ`): Token issue timestamp (default: `now()`).
  * `expires_at` (`TIMESTAMPTZ`): Expiration threshold.
* **Indexes**:
  * `refresh_tokens_user_id_idx` (`user_id`)

#### `password_reset_tokens`
Stores one-time use secure tokens for password resets.
* **Columns**:
  * `id` (`INT`): Primary Key, Auto-increment.
  * `user_id` (`UUID`): Foreign key referencing `users(user_id)` (Cascade delete).
  * `token` (`VARCHAR(128)`): Unique hashed token string.
  * `expires_at` (`TIMESTAMPTZ`): Expiration threshold.
  * `used` (`BOOLEAN`): Used flag (default: `false`).
  * `created_at` (`TIMESTAMPTZ`): Token issue timestamp (default: `now()`).
* **Indexes**:
  * `password_reset_tokens_token_idx` (`token`)
  * `password_reset_tokens_user_id_idx` (`user_id`)

---

### 2. Product Catalog & Partners

#### `products`
The core catalog representing raw materials, assemblies, and finished products.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `name` (`VARCHAR(200)`): Product name.
  * `sales_price` (`DECIMAL(12,2)`): Default customer selling price.
  * `cost_price` (`DECIMAL(12,2)`): Default supplier purchase cost.
  * `on_hand_qty` (`DECIMAL(12,3)`): Actual physical inventory (default: `0`).
  * `reserved_qty` (`DECIMAL(12,3)`): Stock allocated to confirmed orders (default: `0`).
  * `procurement_type` (`ProcureType`): `MTS` (purchase) or `MTO` (manufacture) (default: `MTS`).
  * `procure_on_demand` (`BOOLEAN`): Skip warehousing checks (default: `false`).
  * `reorder_level` (`DECIMAL(12,3)`): Minimum inventory trigger level (default: `0`).
  * `vendor_id` (`UUID`): Primary supplier; foreign key referencing `vendors(id)` (Set null on delete).
  * `bom_id` (`UUID`): Production structure; foreign key referencing `boms(id)` (Set null on delete).
  * `created_at` (`TIMESTAMPTZ`): Creation timestamp (default: `now()`).
  * `updated_at` (`TIMESTAMPTZ`): Auto-updated on record changes.
* **Indexes**:
  * `products_name_idx` (`name`)
  * `products_vendor_id_idx` (`vendor_id`)
  * `products_procurement_type_idx` (`procurement_type`)

#### `vendors`
Suppliers of purchased products.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `name` (`VARCHAR(200)`): Supplier name.
  * `email` (`VARCHAR(254)`): Unique email.
  * `phone` (`VARCHAR(20)`): Telephone number.
  * `address` (`TEXT`): Business location.
  * `created_at` (`TIMESTAMPTZ`): Record creation time (default: `now()`).

#### `customers`
Buyers of finished products.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `name` (`VARCHAR(200)`): Customer name.
  * `email` (`VARCHAR(254)`): Unique email.
  * `phone` (`VARCHAR(20)`): Telephone number.
  * `address` (`TEXT`): Delivery/billing location.
  * `created_at` (`TIMESTAMPTZ`): Record creation time (default: `now()`).

---

### 3. Sales Module

#### `sales_orders`
Customer orders.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `customer_id` (`UUID`): Foreign key referencing `customers(id)` (Restrict delete).
  * `status` (`SOStatus`): Order state (default: `draft`).
  * `created_by` (`UUID`): Foreign key referencing `users(user_id)` (Set null on delete).
  * `created_at` (`TIMESTAMPTZ`): Timestamp (default: `now()`).
  * `updated_at` (`TIMESTAMPTZ`): Timestamp auto-update.
* **Indexes**:
  * `sales_orders_customer_id_idx` (`customer_id`)
  * `sales_orders_status_idx` (`status`)
  * `sales_orders_created_by_idx` (`created_by`)

#### `sales_order_lines`
Individual products included in a Sales Order.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `so_id` (`UUID`): Foreign key referencing `sales_orders(id)` (Cascade delete).
  * `product_id` (`UUID`): Foreign key referencing `products(id)` (Restrict delete).
  * `ordered_qty` (`DECIMAL(12,3)`): Quantity ordered by the customer.
  * `delivered_qty` (`DECIMAL(12,3)`): Quantity physically shipped (default: `0`).
  * `unit_price` (`DECIMAL(12,2)`): Price per unit.
  * `shortage_qty` (`DECIMAL(12,3)`): Computed shortage during order validation (default: `0`).
* **Indexes**:
  * `sales_order_lines_so_id_idx` (`so_id`)
  * `sales_order_lines_product_id_idx` (`product_id`)

---

### 4. Purchase Module

#### `purchase_orders`
Vendor supply orders.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `vendor_id` (`UUID`): Foreign key referencing `vendors(id)` (Restrict delete).
  * `status` (`POStatus`): Order state (default: `draft`).
  * `created_by` (`UUID`): Foreign key referencing `users(user_id)` (Set null on delete).
  * `created_at` (`TIMESTAMPTZ`): Timestamp (default: `now()`).
  * `updated_at` (`TIMESTAMPTZ`): Timestamp auto-update.
* **Indexes**:
  * `purchase_orders_vendor_id_idx` (`vendor_id`)
  * `purchase_orders_status_idx` (`status`)
  * `purchase_orders_created_by_idx` (`created_by`)

#### `purchase_order_lines`
Individual items included in a Purchase Order.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `po_id` (`UUID`): Foreign key referencing `purchase_orders(id)` (Cascade delete).
  * `product_id` (`UUID`): Foreign key referencing `products(id)` (Restrict delete).
  * `ordered_qty` (`DECIMAL(12,3)`): Quantity requested.
  * `received_qty` (`DECIMAL(12,3)`): Quantity physically received (default: `0`).
  * `unit_price` (`DECIMAL(12,2)`): Cost per unit.
* **Indexes**:
  * `purchase_order_lines_po_id_idx` (`po_id`)
  * `purchase_order_lines_product_id_idx` (`product_id`)

#### `goods_receipts`
Physical delivery entries checking off incoming vendor stock.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `receipt_number` (`VARCHAR(50)`): Unique identifier (e.g. `GRN-1234567`).
  * `po_id` (`UUID`): Foreign key referencing `purchase_orders(id)` (Restrict delete).
  * `received_by` (`UUID`): Foreign key referencing `users(user_id)` (Set null on delete).
  * `delivery_note_ref` (`VARCHAR(100)`): External reference code.
  * `received_at` (`TIMESTAMPTZ`): Physical delivery date (default: `now()`).
  * `created_at` (`TIMESTAMPTZ`): Timestamp (default: `now()`).

#### `goods_receipt_lines`
Quantities checked off per goods receipt.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `receipt_id` (`UUID`): Foreign key referencing `goods_receipts(id)` (Cascade delete).
  * `product_id` (`UUID`): Foreign key referencing `products(id)` (Restrict delete).
  * `qty_received` (`DECIMAL(12,3)`): Checked off amount.
  * `remarks` (`TEXT`): Verification comments.

#### `vendor_bills`
Invoices from suppliers representing procurement expenses.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `bill_number` (`VARCHAR(100)`): Unique invoice identifier.
  * `po_id` (`UUID`): Foreign key referencing `purchase_orders(id)` (Restrict delete).
  * `vendor_id` (`UUID`): Foreign key referencing `vendors(id)` (Restrict delete).
  * `invoice_date` (`DATE`): Date bill was issued.
  * `due_date` (`DATE`): Payment deadline.
  * `subtotal` (`DECIMAL(12,2)`): Cost excluding tax.
  * `tax` (`DECIMAL(12,2)`): Applied tax (default: `0`).
  * `total_amount` (`DECIMAL(12,2)`): Final invoice amount.
  * `status` (`BillStatus`): Invoice state (default: `pending_payment`).
  * `attachment_url` (`TEXT`): Link to digital invoice.
  * `paid_at` (`TIMESTAMPTZ`): Timestamp of transaction completion.
  * `paid_by` (`UUID`): Foreign key referencing `users(user_id)` (Set null on delete).
  * `payment_reference` (`VARCHAR(100)`): Transaction code.
  * `created_at` (`TIMESTAMPTZ`): Creation timestamp (default: `now()`).
  * `updated_at` (`TIMESTAMPTZ`): Auto-updated on record changes.

#### `procurement_suggestions`
Inventory replenishment suggestions generated automatically.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `product_id` (`UUID`): Foreign key referencing `products(id)` (Cascade delete).
  * `suggested_qty` (`DECIMAL(12,3)`): Suggested buy amount.
  * `reason` (`TEXT`): Logic detail (e.g. falling below reorder level).
  * `status` (`SuggestionStatus`): Suggestion state (default: `pending`).
  * `created_at` (`TIMESTAMPTZ`): Record creation time (default: `now()`).
  * `updated_at` (`TIMESTAMPTZ`): Auto-updated on record changes.

---

### 5. Manufacturing Module

#### `boms` (Bill of Materials)
Product recipe headers.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `product_id` (`UUID`): Unique foreign key referencing `products(id)` (Cascade delete).

#### `bom_lines`
Required ingredients/raw materials for a BOM.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `bom_id` (`UUID`): Foreign key referencing `boms(id)` (Cascade delete).
  * `component_product_id` (`UUID`): Foreign key referencing `products(id)` (Restrict delete).
  * `qty_per_unit` (`DECIMAL(12,3)`): Ingredient amount required per finished unit.
  * `operation` (`Operation`): Routing step.
* **Indexes**:
  * `bom_lines_bom_id_idx` (`bom_id`)
  * `bom_lines_component_product_id_idx` (`component_product_id`)

#### `manufacturing_orders`
Production execution orders.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `product_id` (`UUID`): Foreign key referencing `products(id)` (Restrict delete).
  * `bom_id` (`UUID`): Foreign key referencing `boms(id)` (Restrict delete).
  * `quantity` (`DECIMAL(12,3)`): Target output amount.
  * `status` (`MOStatus`): Order state (default: `draft`).
  * `created_by` (`UUID`): Foreign key referencing `users(user_id)` (Set null on delete).
  * `created_at` (`TIMESTAMPTZ`): Order timestamp (default: `now()`).
  * `updated_at` (`TIMESTAMPTZ`): Auto-updated on record changes.
* **Indexes**:
  * `manufacturing_orders_product_id_idx` (`product_id`)
  * `manufacturing_orders_status_idx` (`status`)

#### `work_orders`
Operations details required to complete an active Manufacturing Order.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `mo_id` (`UUID`): Foreign key referencing `manufacturing_orders(id)` (Cascade delete).
  * `operation` (`Operation`): Type of routing step.
  * `work_center` (`VARCHAR(100)`): Assigned shop floor work area.
  * `duration_mins` (`INT`): Standard setup/run time (default: `0`).
  * `status` (`WOStatus`): Work order progress (default: `pending`).
  * `started_at` (`TIMESTAMPTZ`): Operation start.
  * `completed_at` (`TIMESTAMPTZ`): Operation completion.
* **Indexes**:
  * `work_orders_mo_id_idx` (`mo_id`)
  * `work_orders_work_center_idx` (`work_center`)
  * `work_orders_status_idx` (`status`)

---

### 6. System Logging & AI Diagnostics

#### `stock_ledger`
Immutable logs of all inventory changes.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `product_id` (`UUID`): Foreign key referencing `products(id)` (Restrict delete).
  * `movement_type` (`MoveType`): Log category.
  * `qty_change` (`DECIMAL(12,3)`): Net inventory delta (+ve for additions, -ve for deductions).
  * `reference_model` (`VARCHAR(100)`): Calling module table name (e.g. `GoodsReceipt`).
  * `reference_id` (`UUID`): Linked transaction document primary key.
  * `created_by` (`UUID`): Foreign key referencing `users(user_id)` (Set null on delete).
  * `timestamp` (`TIMESTAMPTZ`): Posting date (default: `now()`).
* **Indexes**:
  * `stock_ledger_product_id_timestamp_idx` (`product_id`, `timestamp DESC`)
  * `stock_ledger_movement_type_idx` (`movement_type`)
  * `stock_ledger_reference_model_reference_id_idx` (`reference_model`, `reference_id`)

#### `audit_logs`
Tracks database transaction updates.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `user_id` (`UUID`): Foreign key referencing `users(user_id)` (Set null on delete).
  * `model_name` (`VARCHAR(100)`): Affected table name.
  * `record_id` (`UUID`): Modified record primary key.
  * `action` (`AuditAction`): Modification type.
  * `old_value` (`JSON`): Record snapshot before change.
  * `new_value` (`JSON`): Record snapshot after change.
  * `timestamp` (`TIMESTAMPTZ`): Transaction timestamp (default: `now()`).
* **Indexes**:
  * `audit_logs_model_name_record_id_idx` (`model_name`, `record_id`)
  * `audit_logs_user_id_idx` (`user_id`)
  * `audit_logs_timestamp_idx` (`timestamp DESC`)

#### `risk_alerts`
Product supply shortage and lead time warnings.
* **Columns**:
  * `id` (`UUID`): Primary Key.
  * `product_id` (`UUID`): Unique foreign key referencing `products(id)` (Cascade delete).
  * `current_stock` (`DECIMAL(12,3)`): Measured inventory at warning.
  * `required_stock` (`DECIMAL(12,3)`): Minimum demanded inventory.
  * `deficit` (`DECIMAL(12,3)`): Shortage delta.
  * `severity` (`Severity`): Risk category.
  * `recommended_supplier` (`VARCHAR(200)`): Sourced supplier alternative.
  * `lead_time_days` (`INT`): Estimated vendor transit duration.
  * `is_resolved` (`BOOLEAN`): Status flag (default: `false`).
  * `updated_at` (`TIMESTAMPTZ`): Auto-updated on record changes.

---

## ─── Setup & Maintenance Commands ───

### Update Database Tables to Match Schema
If changes are made to the schema file `backend/prisma/schema.prisma`, sync the PostgreSQL tables using:
```bash
cd backend
npx prisma db push
```

### Reset and Clean All Data
```bash
cd backend
npx prisma db push --force-reset
```