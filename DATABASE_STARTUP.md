# ERP-Nexus — Database Startup & Setup Guide

This guide walks you through starting, configuring, and seeding the PostgreSQL database for the **ERP-Nexus** application. 

Follow these steps to get your database fully operational.

---

## 📋 Checklist & Prerequisites

- [x] **PostgreSQL** installed and running on your system.
- [ ] Local database `erp_nexus` created.
- [ ] Backend environment file (`.env`) configured.
- [ ] Database tables generated via Prisma.
- [ ] Initial superusers (`admin` and `owner`) and modules seeded.

---

## 🛠️ Step-by-Step Setup

### Step 1: Verify PostgreSQL Service is Running
Your database server must be running. On Linux (Fedora/Ubuntu/Debian), check the status of your PostgreSQL service:

```bash
# Check if active
systemctl status postgresql
```

If it is not active, start it:
```bash
sudo systemctl start postgresql
```

---

### Step 2: Create the Database
Create a new database named `erp_nexus` inside PostgreSQL:

```bash
# Execute directly via terminal (you may be prompted for your postgres password)
createdb -U postgres erp_nexus
```

*Alternatively, connect to the PostgreSQL shell and run the query:*
```bash
psql -U postgres -c "CREATE DATABASE erp_nexus;"
```

---

### Step 3: Configure environment variables
We have created the `.env` file in the `/backend` folder. Open [backend/.env](file:///home/akshaychauhan/Playground/ERP-Nexus/backend/.env) and update the `DATABASE_URL` with your local credentials:

```env
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/erp_nexus
```

*Replace `<username>` and `<password>` with your PostgreSQL user credentials (e.g., `postgres` and your database password).*

---

### Step 4: Generate Tables & Schema (via Prisma)
Navigate to the `backend` directory and run Prisma to automatically construct all tables, relations, and enums:

```bash
cd backend
npx prisma db push
```

> ⚠️ **IMPORTANT**: Do NOT manually execute the files inside the `sql/` directory (like `006_purchase_module.sql`). Pushing the schema through Prisma is the only safe way to avoid triggers and indexing conflicts.

---

### Step 5: Seed Core Data
Populate the database with default modules (`sales`, `purchase`, `manufacturing`, `inventory`) and default superuser accounts:

```bash
npm run seed
```

This will create:
- **Admin account**: Login ID `admin` (password: `admin`)
- **Owner account**: Login ID `owner` (password: `owner`)

---

## 🔍 Verifying the Database

To verify your database was initialized correctly and view the tables visually, you can start **Prisma Studio**:

```bash
cd backend
npx prisma studio
```
This starts a local web service at [http://localhost:5555](http://localhost:5555), where you can view, edit, search, and delete records inside all your database tables.

---

## 🚨 Troubleshooting Common Setup Errors

### 1. "Connection Refused (ECONNREFUSED)"
* **Cause**: PostgreSQL is not running, or is running on a different port.
* **Fix**: Run `systemctl status postgresql` to verify the service is active, and confirm your port is `5432` in the `.env` file.

### 2. "Authentication Failed (password authentication failed)"
* **Cause**: The username or password in `DATABASE_URL` is incorrect.
* **Fix**: Double-check your local PostgreSQL credentials. Try connecting manually in the terminal using: `psql -U <username> -d erp_nexus`.

### 3. "Database does not exist"
* **Cause**: You forgot to run **Step 2** to create the `erp_nexus` database.
* **Fix**: Run `createdb -U postgres erp_nexus`.

### 4. "Relation already exists / Table already exists"
* **Cause**: Manual SQL scripts from the `/sql` directory were executed prior to Prisma run.
* **Fix**: Reset the database using `npx prisma migrate reset` or drop all tables manually via `psql` and run `npx prisma db push` fresh.
