# ERP-Nexus Database Documentation

This folder contains the PostgreSQL database configuration, extensions, seed data, and performance indexes for **ERP-Nexus**.

---

## ⚠️ WARNING: DO NOT RUN MANUAL SQL MIGRATIONS
> [!WARNING]
> If you are using the Node.js Express backend, **do not manually execute these SQL scripts (specifically `006_purchase_module.sql`)**.
> The database schema is fully managed by **Prisma ORM** via `npx prisma db push`.
> Running these raw SQL scripts manually will result in duplicate table errors, index conflicts, or double-counting of inventory stock.

---

## 📂 File Directory

If you are maintaining a standalone database or running non-Prisma integrations, these are the schema files in sequence:

1. **[`001_schema.sql`](file:///home/akshaychauhan/Playground/ERP-Nexus/sql/001_schema.sql)**: Core tables and structure.
2. **[`002_triggers.sql`](file:///home/akshaychauhan/Playground/ERP-Nexus/sql/002_triggers.sql)**: Account mutability and profile auto-sync.
3. **[`003_indexes.sql`](file:///home/akshaychauhan/Playground/ERP-Nexus/sql/003_indexes.sql)**: Core optimization indexes.
4. **[`004_seed.sql`](file:///home/akshaychauhan/Playground/ERP-Nexus/sql/004_seed.sql)**: Pre-seeds base modules and superuser accounts.
5. **[`005_amendments.sql`](file:///home/akshaychauhan/Playground/ERP-Nexus/sql/005_amendments.sql)**: Auth and JWT additions.
6. **[`006_purchase_module.sql`](file:///home/akshaychauhan/Playground/ERP-Nexus/sql/006_purchase_module.sql)**: Purchase module table extensions.

---

## 🛡️ Trigger Automations & Business Logic

### 1. Immutability & Safety Triggers (Database Layer)
To protect structural records, database-level triggers in `002_triggers.sql` verify session credentials using the variable `erp.is_admin`:
* If `erp.is_admin` is not set to `'true'`, modifications to user roles, registrations, and core profile metadata are blocked.
* Updates to `users.login_id` are strictly prohibited for all connections.

### 2. Operational Business Logic (Application Layer)
Inventory mutations, stock ledger postings, and order status updates are managed by the **Node.js Express application** (`utils/stockMutations.js` and services) using Prisma transactions to ensure consistent business validations. Do not implement triggers on these tables.
