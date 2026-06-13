# ERP-Nexus — Node.js / Express Backend Implementation Plan

> **For the backend developer.** This document covers all the API routes, middleware, and database changes required to implement the Admin login, User Registration + Approval workflow, and User login for the ERP-Nexus system.

---

## System Flow Overview

```
[User Registers] → status: PENDING
      ↓
[Admin Reviews Registration Request]
      ↓
[Admin Approves / Rejects]
      ↓
[If APPROVED → User can Login]
[If REJECTED → User cannot Login, gets error]
```

---

## Required Database Changes

> [!IMPORTANT]
> Apply these changes before writing any backend code.  
> Add them to a new file: `sql/005_amendments.sql`

### Change 1 — Add `requested_modules` to `users` table
During registration, the user selects which ERP modules they need. These are stored here until the admin reviews and approves them.

```sql
ALTER TABLE users
ADD COLUMN requested_modules INT[] DEFAULT '{}';
-- Stores an array of module_id integers e.g. {1, 3} = sales + product
```

### Change 2 — Add `rejected_reason` to `users` table
Allows the admin to provide an optional message when rejecting a registration.

```sql
ALTER TABLE users
ADD COLUMN rejected_reason TEXT;
```

### Change 3 — Add `last_login_at` to `users` table
Track the last time a user successfully logged in (good for admin dashboard and security).

```sql
ALTER TABLE users
ADD COLUMN last_login_at TIMESTAMPTZ;
```

### Change 4 — Add `refresh_tokens` table
Required for secure JWT refresh token management.

```sql
CREATE TABLE refresh_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,                  -- Store hashed refresh token, not raw
    issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE NOT NULL
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
```

---

## Tech Stack

| Purpose | Package |
|---|---|
| Framework | `express` |
| PostgreSQL Client | `pg` (node-postgres) |
| Password Hashing | `bcrypt` |
| Authentication | `jsonwebtoken` (JWT) |
| Input Validation | `express-validator` |
| File Uploads | `multer` |
| Environment Config | `dotenv` |
| Logging (optional) | `morgan` |

Install everything:
```bash
npm install express pg bcrypt jsonwebtoken express-validator multer dotenv morgan
npm install --save-dev nodemon
```

---

## Project Structure

```
src/
├── config/
│   └── db.js                  ← PostgreSQL connection pool
├── middleware/
│   ├── auth.middleware.js      ← JWT verification
│   └── admin.middleware.js     ← Admin-only route guard
├── routes/
│   ├── auth.routes.js          ← /api/auth/* (login, register, logout)
│   └── admin.routes.js         ← /api/admin/* (approval, user management)
├── controllers/
│   ├── auth.controller.js
│   └── admin.controller.js
├── services/
│   ├── auth.service.js         ← Business logic for auth
│   └── admin.service.js        ← Business logic for admin actions
├── validators/
│   ├── register.validator.js
│   └── login.validator.js
└── app.js                      ← Express app entry point
```

---

## Database Connection — `src/config/db.js`

```js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
```

**`.env` file:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_nexus
DB_USER=erp_admin
DB_PASSWORD=your_password

JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

PORT=3000
```

---

## Middleware

### `src/middleware/auth.middleware.js`
Verifies the JWT token on every protected route.

```js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // { user_id, login_id, is_admin, status }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
```

### `src/middleware/admin.middleware.js`
Allows only the Admin to access specific routes.

```js
module.exports = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

---

## Routes

### Auth Routes — `src/routes/auth.routes.js`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | User submits registration | ❌ Public |
| `POST` | `/api/auth/login` | Admin OR User login | ❌ Public |
| `POST` | `/api/auth/refresh` | Get new access token using refresh token | ❌ Public |
| `POST` | `/api/auth/logout` | Revoke refresh token | ✅ Auth |

### Admin Routes — `src/routes/admin.routes.js`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/admin/registrations` | List all PENDING registrations | ✅ Admin |
| `POST` | `/api/admin/approve/:userId` | Approve a user + grant their requested modules | ✅ Admin |
| `POST` | `/api/admin/reject/:userId` | Reject a registration with a reason | ✅ Admin |
| `GET` | `/api/admin/users` | List all users with their module access | ✅ Admin |
| `PATCH` | `/api/admin/users/:userId` | Edit any user profile field | ✅ Admin |

---

## Controller Logic — Detailed

### 1. `POST /api/auth/register`

**Input Validation Rules:**
- `login_id`: 3–50 characters, alphanumeric + underscores only. No spaces.
- `email`: Must be a valid email format.
- `password`: Minimum 8 characters. Must contain at least:
  - 1 uppercase letter (A–Z)
  - 1 lowercase letter (a–z)
  - 1 number (0–9)
  - 1 special character (`!@#$%^&*`)
- `full_name`: Required
- `position`: Required
- `requested_modules`: Array of module IDs (e.g. `[1, 3]`). At least 1 required.

**Request Body:**
```json
{
  "login_id": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "full_name": "John Doe",
  "position": "Sales Executive",
  "address": "123 MG Road, Mumbai",
  "mobile_no": "9876543210",
  "requested_modules": [1, 2]
}
```

**Logic:**
```
1. Validate inputs (express-validator)
2. Check login_id not already taken → 409 Conflict
3. Check email not already taken → 409 Conflict
4. Hash password using bcrypt (salt rounds: 12)
5. BEGIN transaction:
   a. INSERT into users (status = 'PENDING', requested_modules = [1,2])
   b. INSERT into user_profiles (full_name, position, email_display, address, mobile_no)
   c. COMMIT
6. Return 201: { message: "Registration submitted. Awaiting admin approval." }
```

---

### 2. `POST /api/auth/login`

**Request Body:**
```json
{
  "login_id": "john_doe",
  "password": "SecurePass@123"
}
```

**Logic:**
```
1. Find user by login_id → 404 if not found
2. Compare password with bcrypt → 401 if mismatch
3. Check user.status:
   - 'PENDING'  → 403: "Registration is awaiting admin approval"
   - 'REJECTED' → 403: "Your registration was rejected: <rejected_reason>"
   - 'APPROVED' → proceed
4. Generate tokens:
   - Access Token (JWT):  { user_id, login_id, is_admin } — expires 15 min
   - Refresh Token (JWT): { user_id } — expires 7 days
5. Hash refresh token and store in refresh_tokens table
6. UPDATE users SET last_login_at = NOW() WHERE user_id = ...
7. Return 200:
   {
     "access_token": "...",
     "refresh_token": "...",
     "user": { "login_id", "is_admin", "status" }
   }
```

> [!IMPORTANT]
> **Admin login uses the exact same `/api/auth/login` endpoint.** The admin logs in with `login_id: admin` and `password: admin`. The JWT payload will contain `is_admin: true`. The frontend should read this flag to show the admin dashboard vs the user dashboard.

---

### 3. `POST /api/admin/approve/:userId`

**Auth**: JWT required + `is_admin = true`

**Logic:**
```
1. Fetch user from DB by userId
2. Verify status is 'PENDING' → 400 if already processed
3. BEGIN transaction (with SET LOCAL erp.is_admin = 'true'):
   a. UPDATE users SET status = 'APPROVED' WHERE user_id = :userId
   b. INSERT INTO user_module_access for each module in user.requested_modules
      (granted_by = admin's user_id)
   c. INSERT INTO audit_log (action = 'REGISTRATION_APPROVED', ...)
   d. COMMIT
4. Return 200: { message: "User approved successfully" }
```

---

### 4. `POST /api/admin/reject/:userId`

**Auth**: JWT required + `is_admin = true`

**Request Body:**
```json
{
  "reason": "Invalid employee details provided."
}
```

**Logic:**
```
1. Fetch user from DB by userId
2. Verify status is 'PENDING' → 400 if already processed
3. BEGIN transaction (with SET LOCAL erp.is_admin = 'true'):
   a. UPDATE users SET status = 'REJECTED', rejected_reason = :reason
   b. INSERT INTO audit_log (action = 'REGISTRATION_REJECTED', ...)
   c. COMMIT
4. Return 200: { message: "User registration rejected" }
```

---

## Key Design Notes

### Why SET LOCAL `erp.is_admin = 'true'`?
Your PostgreSQL triggers (`002_triggers.sql`) use this session variable to decide if a protected field update is allowed. The backend **must always** set this inside a transaction whenever the admin is making a privileged change.

```js
// Admin transaction pattern (always use this for admin writes)
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query("SET LOCAL erp.is_admin = 'true';"); // ← Required!
  await client.query('UPDATE users SET status = $1 WHERE user_id = $2', ['APPROVED', userId]);
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

### Password Validation Regex (for `express-validator`)
```js
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
body('password').matches(passwordRegex).withMessage(
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
)
```

---

## Complete API Summary

```
POST   /api/auth/register              → Submit registration (public)
POST   /api/auth/login                 → Login for admin & users (public)
POST   /api/auth/refresh               → Refresh access token (public)
POST   /api/auth/logout                → Revoke session (auth)

GET    /api/admin/registrations        → See pending registrations (admin)
POST   /api/admin/approve/:userId      → Approve user + grant modules (admin)
POST   /api/admin/reject/:userId       → Reject user with reason (admin)
GET    /api/admin/users                → List all users (admin)
PATCH  /api/admin/users/:userId        → Edit any user field (admin)
```
