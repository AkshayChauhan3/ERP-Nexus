# ERP Nexus — API Contract

> **For the Frontend Developer:**
> This document is a human-readable summary of the API.
> Once the backend is running locally, you can view the **live, interactive documentation** at `http://localhost:3000/api/docs`.

---

## Base Setup

- **Base URL:** `http://localhost:3000/api`
- **Authentication:** Send the JWT in the headers for all protected routes:
  `Authorization: Bearer <your_access_token>`
- **Errors:** All errors share a uniform structure:
  ```json
  {
    "success": false,
    "error": "Error message",
    "details": [] // Only for validation errors (400)
  }
  ```

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Auth Req? | Purpose | Request Body | Success Response |
|---|---|---|---|---|---|
| POST | `/login` | No | Login to get tokens | `{ email, password }` | `{ accessToken, refreshToken, user: { id, name, role } }` |
| POST | `/refresh` | No | Get new access token | `{ refreshToken }` | `{ accessToken }` |
| POST | `/logout` | Yes | Invalidate refresh token | `{ refreshToken }` | `200 OK` |
| POST | `/forgot-password` | No | Send reset email | `{ email }` | `200 OK` (Always) |
| POST | `/reset-password` | No | Set new password | `{ token, newPassword }` | `200 OK` |

---

## 2. Master Data (Products, Vendors, Customers)

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| GET | `/products` | admin, inventory, owner | List all products (includes `free_qty`) |
| GET | `/products/:id` | admin, inventory | Get single product |
| POST | `/products` | admin, inventory, owner | Create product |
| PATCH | `/products/:id` | admin, inventory | Update product |
| DELETE| `/products/:id` | admin, inventory | Delete product |
| GET | `/vendors` | admin, purchase, owner | List vendors |
| GET | `/customers` | admin, sales, owner | List customers |

---

## 3. Sales (`/api/sales-orders`)

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| GET | `/` | admin, sales, owner | List all sales orders |
| POST | `/` | admin, sales | Create a new draft SO |
| POST | `/:id/confirm` | admin, sales | Confirm SO (reserves stock) |
| POST | `/:id/deliver` | admin, inventory | Deliver SO (deducts stock) |
| POST | `/:id/cancel` | admin, sales | Cancel SO (releases stock) |

---

## 4. Purchasing (`/api/purchase-orders`)

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| GET | `/` | admin, purchase, owner | List POs |
| POST | `/` | admin, purchase | Create draft PO |
| POST | `/:id/confirm` | admin, purchase | Confirm PO |
| POST | `/:id/receive` | admin, inventory | Receive PO (adds to `on_hand_qty`) |

---

## 5. Manufacturing (`/api/manufacturing-orders`)

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| GET | `/boms` | admin, mfg | List Bill of Materials |
| GET | `/` | admin, mfg, owner | List MOs |
| POST | `/` | admin, mfg | Create draft MO |
| POST | `/:id/confirm` | admin, mfg | Confirm MO (reserves components, creates WorkOrders) |
| POST | `/:id/complete` | admin, mfg | Complete MO (consumes components, adds finished goods) |
| PATCH | `/work-orders/:id/status` | admin, mfg | Update WO progress |

---

## 6. Inventory & Audit

| Method | Endpoint | Roles | Purpose | Query Params |
|---|---|---|---|---|
| GET | `/stock-ledger` | admin, inventory, owner | View stock movements | `?product_id=123` |
| GET | `/audit-logs` | admin, owner | View system changes | `?model=SalesOrder&record_id=123` |

---

## 7. Intelligence Features

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| GET | `/dashboard` | ALL | Aggregated counts for homepage |
| GET | `/risk-alerts` | admin, inventory, owner | Scan stock levels & return warnings |
| POST | `/simulate` | admin, owner | What-if scenario testing (pure calculation) |
| GET | `/ai-advisor` | admin, owner | Gemini 1.5 Flash insights |
| GET | `/business-health-score` | admin, owner | Composite 0-100 KPI score |
| GET | `/digital-twin` | admin, mfg, owner | WorkOrders aggregated by work center |
