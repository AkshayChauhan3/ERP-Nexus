# ERP Nexus — The Autonomous Factory OS

> Mini ERP for **Shiv Furniture Works** | Full demand-to-delivery flow with intelligent automation

---

## Team & Ownership

| Role | Responsibility | Branch Prefix |
|---|---|---|
| **Backend** | Node.js + Express API | `backend/` |
| **Frontend** | React + TypeScript + Vite | `frontend/` |
| **Database** | PostgreSQL schema review & tuning | `db/` |

---

## Quick Start (Backend)

### Prerequisites
- Node.js >= 18
- PostgreSQL 15 running locally
- A `.env` file (copy from `.env.example`)

### Setup
```bash
# 1. Clone and enter the backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Copy env template and fill in your values
copy .env.example .env
# Edit .env: set DATABASE_URL, JWT secrets, Gmail credentials

# 4. Apply database migrations (after Step 02 is complete)
npm run prisma:migrate

# 5. Start development server
npm run dev
```

### Server will start at:
| URL | Purpose |
|---|---|
| `http://localhost:3000/` | Health check |
| `http://localhost:3000/api` | API base |
| `http://localhost:3000/api/docs` | Swagger UI (available after Step 03) |

---

## For Frontend Developer

- **API Base URL**: `http://localhost:3000/api`
- **Auth**: `Authorization: Bearer <accessToken>` on all protected routes
- **Login**: `POST /api/auth/login` → returns `{ accessToken, refreshToken, user }`
- **Refresh**: `POST /api/auth/refresh` with `{ refreshToken }` → returns `{ accessToken }`
- **Live Docs**: `http://localhost:3000/api/docs` (Swagger UI — interactive)
- **CORS**: Pre-configured for `http://localhost:5173` (Vite default)

---

## For Database Developer

- **Schema file**: [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma)
- **Run migrations**: `cd backend && npx prisma migrate dev`
- **View tables**: `cd backend && npx prisma studio`
- **Migration SQL**: `backend/prisma/migrations/*/migration.sql`

---

## Project Structure

```
ERP-Nexus/
├── backend/                  ← Node.js + Express API (THIS TEAM)
│   ├── src/
│   │   ├── server.js         ← Entry point (starts HTTP server)
│   │   ├── app.js            ← Express config + middleware
│   │   ├── config/
│   │   │   ├── db.js         ← Prisma client singleton
│   │   │   └── jwt.js        ← JWT sign/verify helpers
│   │   ├── middleware/
│   │   │   ├── authenticate.js  ← Bearer token verification
│   │   │   ├── authorize.js     ← Role-based access control
│   │   │   └── errorHandler.js  ← Global error handler
│   │   ├── modules/          ← Feature modules (auth, products, sales, ...)
│   │   └── utils/
│   │       ├── stockMutations.js        ← Stock invariant enforcement
│   │       ├── auditWriter.js           ← Central audit log writer
│   │       └── procurementAutomation.js ← Auto PO/MO creation
│   ├── prisma/
│   │   ├── schema.prisma     ← All DB models (DB dev's source of truth)
│   │   └── migrations/       ← Auto-generated SQL migrations
│   ├── seed/
│   │   └── seed.js           ← npm run seed
│   ├── .env.example          ← Template (commit this, not .env)
│   └── package.json
└── README.md                 ← This file
```

---

## Build Progress

| Step | Status | Description |
|---|---|---|
| 01 | ✅ Done | Project Scaffold |
| 02 | ⏳ Next | Prisma Schema (DB models) |
| 03 | ⏳ | Swagger API Contract |
| 04 | ⏳ | Auth Module (JWT login/refresh/logout) |
| 05 | ⏳ | Products, Vendors, Customers CRUD |
| 06 | ⏳ | Sales Orders + Business Logic |
| 07 | ⏳ | Purchase Orders + Business Logic |
| 08 | ⏳ | BOM + Manufacturing CRUD |
| 09 | ⏳ | Manufacturing Order Business Logic |
| 10 | ⏳ | Stock Ledger + Audit Log |
| 11 | ⏳ | Risk Engine + What-If Simulator |
| 12 | ⏳ | AI Advisor + Digital Twin + Health Score |
| 13 | ⏳ | Dashboard API |
| 14 | ⏳ | Seed Data |
| 15 | ⏳ | Forgot Password Email Reset |

---

## Available Scripts

```bash
npm run dev           # Start dev server with auto-reload (nodemon)
npm start             # Start production server
npm test              # Run jest tests
npm run seed          # Populate DB with test data (after Step 14)
npm run prisma:migrate  # Apply Prisma migrations to PostgreSQL
npm run prisma:studio   # Open Prisma Studio (visual DB browser)
npm run prisma:reset    # Reset DB and re-apply all migrations (DESTRUCTIVE)
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for access tokens (generate with crypto) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (different from access) |
| `GMAIL_USER` | Gmail address for password reset emails |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not your Google password) |
| `FRONTEND_URL` | Frontend URL for password reset links |
| `GEMINI_API_KEY` | Google AI API key (optional — for AI Advisor feature) |

Generate JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
