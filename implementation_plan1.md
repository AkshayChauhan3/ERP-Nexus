# Phase 5: Complete System Migration to PostgreSQL

The goal of this phase is to eliminate all remaining traces of the frontend mock APIs (`salesApi.js`, `purchaseApi.js`, `inventoryApi.js`, `ownerApi.js`) and fully integrate all auxiliary screens with the PostgreSQL backend.

## User Review Required

> [!WARNING]
> This is a massive operation. It requires heavily updating the Prisma schema (`schema.prisma`) to add over a dozen new tables for concepts that currently only exist in the frontend mock data (e.g., Invoices, Payments, Quotations, Settings, Multi-Warehouse configurations). 
> It will also require writing over 20 new backend controller functions and rewriting around 25 frontend React components.

## Open Questions

> [!IMPORTANT]  
> 1. Do you want to build **all** of these modules at once, or should we break Phase 5 down into smaller sub-phases (e.g., Phase 5A: Sales Auxiliaries, Phase 5B: Purchase Auxiliaries)? yes lets go part by part and i want to test each function and each table from frontend to backend 
> 2. For Owner Approvals, should we create a generic `ApprovalRequest` table, or should approvals just be status flags on existing documents (e.g., PO status = 'pending_approval')? yes let's do that

---

## Proposed Changes

### Database Schema Updates (`schema.prisma`)
We will need to add the following Prisma models to support the remaining frontend features:
- **Sales Add-ons:** `SalesQuotation`, `SalesInvoice`, `SalesPayment`, `SalesReturn`
- **Purchase Add-ons:** `PurchaseSuggestion`, `PurchasePayment`, `PurchaseReturn` (Receipts and Bills already exist but need wiring)
- **Inventory Add-ons:** `Warehouse`, `StockTransfer`, `StockAdjustment` (Warehouses will require updating `Inventory` and `StockLedger` to track stock *per warehouse*)
- **Owner Add-ons:** `SystemSettings`, `ApprovalRequest`

### Backend Controllers & Routes
- Create new controllers and routes in the respective modules to handle CRUD operations for the new tables.
- e.g., `POST /api/sales-invoices`, `POST /api/payments`, `POST /api/stock-transfers`, `GET /api/settings`.

### Frontend Component Refactoring
We will completely rewrite the data-fetching and form-submission logic (replacing `mockApi.get()` with `api.get()`) for the following components:

#### Sales Module
- [MODIFY] [SalesQuotations.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/sales/SalesQuotations.jsx)
- [MODIFY] [SalesInvoices.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/sales/SalesInvoices.jsx)
- [MODIFY] [SalesPayments.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/sales/SalesPayments.jsx)
- [MODIFY] [SalesReturns.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/sales/SalesReturns.jsx)
- [MODIFY] [SalesReports.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/sales/SalesReports.jsx)

#### Purchase Module
- [MODIFY] [PurchaseReceipts.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/purchase/PurchaseReceipts.jsx)
- [MODIFY] [PurchaseBills.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/purchase/PurchaseBills.jsx)
- [MODIFY] [PurchasePayments.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/purchase/PurchasePayments.jsx)
- [MODIFY] [PurchaseReturns.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/purchase/PurchaseReturns.jsx)
- [MODIFY] [PurchaseSuggestions.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/purchase/PurchaseSuggestions.jsx)

#### Inventory Module
- [MODIFY] [InvWarehouses.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/inventory/InvWarehouses.jsx)
- [MODIFY] [InvStockTransfers.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/inventory/InvStockTransfers.jsx)
- [MODIFY] [InvStockAdjustments.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/inventory/InvStockAdjustments.jsx)
- [MODIFY] [InvDashboard.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/inventory/InvDashboard.jsx)
- [MODIFY] [InvOverview.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/inventory/InvOverview.jsx)

#### Owner Module
- [MODIFY] [OwnerSettings.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/owner/OwnerSettings.jsx)
- [MODIFY] [OwnerEmployees.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/owner/OwnerEmployees.jsx)
- [MODIFY] [OwnerApprovals.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/owner/OwnerApprovals.jsx)

#### Utils
- [DELETE] [salesApi.js](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/utils/salesApi.js)
- [DELETE] [purchaseApi.js](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/utils/purchaseApi.js)
- [DELETE] [inventoryApi.js](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/utils/inventoryApi.js)
- [DELETE] [ownerApi.js](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/utils/ownerApi.js)

## Verification Plan
### Automated Testing
- Since the backend lacks a test suite, we will verify by running `npx prisma db push` to ensure the schema updates apply correctly to Postgres.
### Manual Verification
- Launch the application and click through the remaining Sales, Purchase, and Inventory auxiliary menus to verify they no longer error out and successfully hit the `/api` layer in the Network tab.
