# 🚀 ERP-Nexus — Quick Start & Startup Guide

Welcome to **ERP-Nexus**, the Autonomous Factory OS built for **Shiv Furniture Works**. This repository houses both the backend API server and the frontend client dashboard.

Follow this guide to set up, initialize, and run the complete ERP-Nexus application on your local machine.

---

## 🏗️ Architecture & Port Map

ERP-Nexus operates on a standard two-tier client-server structure:

```mermaid
graph TD
    Client[React/Vite Frontend<br>Port 5173] -->|API Requests| API[Express Server<br>Port 3000]
    API -->|Prisma Client| DB[(PostgreSQL Database<br>Port 5432)]
```

*   **Frontend**: `http://localhost:5173`
*   **Backend API**: `http://localhost:3000/api`
*   **API Documentation (Swagger)**: `http://localhost:3000/api/docs`

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your system:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **PostgreSQL** database service (running locally or accessible via network)

---

## ⚡ Step-by-Step Setup

### Step 1: Clone the Repository & Configure Environment

1. Navigate to the backend directory and copy the example environment template:
   ```bash
   cd backend
   cp .env.example .env
   ```
2. Open `backend/.env` in your editor and configure your variables:
   - Make sure your database URL matches your local PostgreSQL credentials:
     ```env
     DATABASE_URL="postgresql://postgres:postgresql@localhost:5432/erp_nexus"
     ```
   - Customize or generate your security secrets:
     ```env
     JWT_ACCESS_SECRET="your-super-secret-key"
     JWT_REFRESH_SECRET="your-refresh-secret-key"
     ```

---

### Step 2: Initialize the Backend

Run these commands inside the `backend` directory to install packages, sync the database structure, and seed default roles/users:

```bash
# 1. Install all backend dependencies
npm install

# 2. Synchronize the PostgreSQL schema using Prisma (no manual SQL execution)
npx prisma db push

# 3. Seed the database with modules, default permissions, and admin accounts
npm run seed
```

> [!WARNING]
> **Do not run `sql/*.sql` files manually** against the PostgreSQL database.
> The database schema is fully managed by Prisma. Manual imports will cause conflicts, duplicate tables, and database synchronization issues.

---

### Step 3: Initialize the Frontend

Open a new terminal session, navigate to the `frontend` directory, and run the following commands:

```bash
# 1. Navigate to frontend folder
cd ../frontend

# 2. Install all frontend dependencies
npm install
```

---

## 🏃 Running the Application

For a full local environment, run both backend and frontend development servers.

### 🟢 Start the Backend
From the `backend` directory:
```bash
npm run dev
```
*The server will start at `http://localhost:3000`, using nodemon for automatic hot reloading when code changes.*

### 🔵 Start the Frontend
From the `frontend` directory:
```bash
npm run dev
```
*The React dashboard will start at `http://localhost:5173`.*

---

## 🔐 Default Credentials

The seeding process generates two default super-users with full permissions:

| Login ID | Password | Role | Access Level |
|---|---|---|---|
| `admin` | `admin` | `admin` | Full user approval, PO, BOM, and manufacturing access |
| `owner` | `owner` | `owner` | Everything `admin` has, plus financial actions (Bill Payments) |

> [!TIP]
> After logging in for the first time, you can register new users through the frontend signup form. These users will remain in a `PENDING` state until approved by an administrator logging in with the credentials above.

---

## 🧪 Testing and Verification

To make sure everything is running smoothly, you can run the built-in test suites:

```bash
cd backend
npm test
```

To explore the backend API endpoints and try out requests, open the Swagger interactive documentation in your browser:
🔗 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

---

*Last Updated: June 2026 — ERP-Nexus Technical Team*
