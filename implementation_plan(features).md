# ERP Nexus - Phase 2 "Wow" Factor Implementation Plan

This plan details the implementation for the highly visual "Executive Story Mode" and "Digital Twin Factory" features, alongside the "What-If Simulator". Since the AI backend integration is being handled by another developer, these features will rely on dynamic template generation and robust frontend state management to deliver the required impact immediately.

## 1. Feature 7: Executive Story Mode (CEO Dashboard)

We will integrate the highly requested "Generate Business Summary" button into the `OwnerDashboard.jsx`.

### Proposed Changes
#### [MODIFY] [frontend/src/pages/owner/OwnerDashboard.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/owner/OwnerDashboard.jsx)
- **Add Button:** Place a "Generate Business Summary" button prominently at the top of the dashboard.
- **Dynamic Story Generation:** We will write a utility function that parses the existing `stats` object (which we already fetch from the backend) and injects it into a smart, CEO-style template.
  - *Example Logic:* If `stats.profit > 0`, use positive terminology. If `stats.pendingApprovals > 5`, mention an administrative bottleneck.
- **Story Output UI:** Upon clicking, a beautiful, typography-rich modal or expanded card will appear, rendering the generated paragraph (e.g., *"This week demand increased by X%... Recommended action is procurement of Y units..."*).
- **Handoff:** When the other developer finishes the LLM backend, they can simply swap out our template generation function with their API call!

## 2. Feature 4: Digital Twin Factory

We will transform the `ManufacturingMonitor.jsx` from a standard Kanban board into a visual representation of a real Industry 4.0 factory floor.

### Proposed Changes
#### [MODIFY] [frontend/src/pages/ManufacturingMonitor.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/ManufacturingMonitor.jsx)
- **Digital Twin Layout:** Create a new visual component at the top of the Pipeline tab that renders "Work Centers" as physical nodes:
  - `[ Assembly 🟢 ]`
  - `[ Painting 🟡 ]`
  - `[ Packing 🔴 ]`
- **Real-Time State Mapping:** 
  - 🟢 **Running:** If a Manufacturing Order is currently `In Progress` at this center.
  - 🟡 **Waiting:** If an order is queued for this center.
  - 🔴 **Blocked:** If there is a material shortage or delay flagged.
- We will use existing `KANBAN` data arrays (and later real API data) to dynamically calculate the status colors of each Work Center.

## 3. What-If Simulator

We will build a sandbox tool for owners to test supply chain resilience.

### Proposed Changes
#### [NEW] [frontend/src/pages/owner/WhatIfSimulator.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/owner/WhatIfSimulator.jsx)
- **Input:** A simple form where the owner selects a Product and inputs a hypothetical "Rush Order Quantity" (e.g., 500 Dining Tables).
- **Engine Logic:** A frontend/backend utility that traverses the Bill of Materials for that product and subtracts the required components from the `Free to Use` inventory.
- **Output:** A visual breakdown showing exactly which raw materials will hit a shortage and what new Purchase Orders would be required to fulfill the demand.

## 4. Feature 14: Seed Script (Test Data)

We will build a comprehensive database seeder to instantly populate the application with realistic data for presentations or fresh deployments.

### Proposed Changes
#### [NEW] [backend/src/scripts/seed.js](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/backend/src/scripts/seed.js)
- **Data Generation:** Write a Prisma script to inject a realistic hierarchy of data:
  - Users (Admin, Owner, floor staff)
  - Products & Categories (Wood, Screws, Tables)
  - Vendors & Customers
  - BoMs and active Manufacturing Orders
- **CLI Command:** Add `"seed": "node src/scripts/seed.js"` to `backend/package.json`.

## 5. Feature 15: Forgot Password Flow

We will complete the end-to-end security flow allowing users to recover lost accounts.

### Proposed Changes
#### [NEW] [backend/src/modules/auth/auth.controller.js](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/backend/src/modules/auth/auth.controller.js) (Update)
- **Generate Token:** Create a `/forgot-password` endpoint that generates a secure crypto token, saves it to the `PasswordResetToken` table with a 15-minute expiration, and uses `nodemailer` to dispatch it.
- **Reset Password:** Create a `/reset-password` endpoint that validates the token and securely hashes the new password using `bcrypt`.
#### [MODIFY] [frontend/src/pages/ForgotPassword.jsx](file:///c:/Users/Krish/project/New%20folder/ERP-Nexus/frontend/src/pages/ForgotPassword.jsx)
- **UI Flow:** Build the screens for entering an email address and entering the new password if a valid token is present in the URL.

## User Review Required

> [!IMPORTANT]
> Because the AI Operations Advisor is being built by another developer, I will build the **Executive Story Mode** using a highly dynamic "template string generator" that reads real database numbers to write the story. Once the other developer finishes the AI logic, they can easily plug it into the beautiful UI we build. Does this approach work for you?

> [!TIP]
> Would you like me to replace the entire Kanban board with the Digital Twin Factory, or show the Digital Twin *above* the Kanban board so floor supervisors can see both the visual layout and the individual cards?
