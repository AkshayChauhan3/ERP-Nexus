# ERP-Nexus Database Schema Setup & Integration

This document outlines the PostgreSQL database structure, script execution sequence, and Express backend transaction integrations for **ERP-Nexus**.

---

## 🚀 Recommended Setup (Prisma ORM)

The Express backend uses **Prisma ORM** as its data access layer. All database tables and columns are defined in the Prisma schema file:
[`backend/prisma/schema.prisma`](file:///home/akshaychauhan/Playground/ERP-Nexus/backend/prisma/schema.prisma)

### ⚠️ IMPORTANT: DO NOT RUN MANUAL SQL MIGRATIONS
> [!WARNING]
> Do **NOT** manually execute `sql/006_purchase_module.sql` or create tables directly inside PostgreSQL.
> Doing so will conflict with Prisma ORM and cause errors during table creation or double-counting inventory stock.

### Setup Steps:
1. **Initialize Environment**:
   Configure your `DATABASE_URL` in `backend/.env`.
2. **Push Schema via Prisma**:
   Run the following command inside the `backend/` directory to automatically build all tables and structures:
   ```bash
   npx prisma db push
   ```
3. **Seed Database**:
   Pre-seed the admin, owner, and modules data:
   ```bash
   npm run seed
   ```

---

## 🛡️ Trigger Automations (Database Layer)

Only if you require **strict database-level constraints** (such as immutable usernames or user profiles), you may apply the trigger function file manually:

* **[`sql/002_triggers.sql`](file:///home/akshaychauhan/Playground/ERP-Nexus/sql/002_triggers.sql)**:
  * Restricts normal users from changing `full_name`, `position`, or `email_display`.
  * Restricts all users from modifying `login_id`.
  * Automatically propagates email modifications to profiles.

To bypass these triggers for admin-only actions, the database transaction context setting `SET LOCAL erp.is_admin = 'true';` must be invoked inside the query connection block.
