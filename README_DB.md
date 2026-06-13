# ERP-Nexus PostgreSQL Database Setup

This database schema is designed for PostgreSQL and supports user authentication, single admin enforcement, and strict role-based field mutability policies via triggers.

## File Execution Sequence

To initialize the database, run the SQL scripts in the following order:

1. **`sql/001_schema.sql`** — Tables, foreign keys, constraints.
2. **`sql/002_triggers.sql`** — Automated security policies, timestamps, email syncing.
3. **`sql/003_indexes.sql`** — Performance indexes.
4. **`sql/004_seed.sql`** — Pre-seeding modules and the Administrator account.

---

## Initial Seed Admin Credentials

- **Username / Login ID**: `admin`
- **Password**: `admin` (pre-hashed in the DB using bcrypt with 12 rounds)

---

## Database Architecture Rules

### 1. Single Admin Enforcement
Enforced at the DB level via a unique partial index:
```sql
CREATE UNIQUE INDEX unique_single_admin ON users (is_admin) WHERE (is_admin = TRUE);
```
Only one user can have `is_admin = true`. Any attempt to promote another user to admin will be blocked by PostgreSQL.

### 2. Field Mutability Constraints
The system enforces edit rules depending on whether the editor is a standard user or an administrator.

- **For All Users**:
  - `login_id` is **strictly immutable** and cannot be changed by anyone (including admins) after registration.
- **For Non-Admins**:
  - Cannot edit their own `full_name`, `position`, or `email`.
  - Can edit their `address`, `mobile_no`, and `profile_photo`.
- **For Admins**:
  - Can edit **any** field (except `login_id`).
  - Can approve or reject registration requests (`status` = `APPROVED` / `REJECTED`).

---

## Node.js / Express Integration Example

To tell PostgreSQL that the current database action is being performed by an **Admin**, your backend connection must set the `erp.is_admin` session parameter inside a transaction.

Here is an example using `pg` (node-postgres):

### User Updating Profile (Normal Flow)
A standard user updating their own profile does not set `erp.is_admin` to true. If they attempt to change `full_name` or `position`, PostgreSQL will reject the transaction:

```javascript
const { Pool } = require('pg');
const pool = new Pool();

// Normal user updates profile
async function updateProfileByUser(userId, address, mobileNo) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Perform update
    const query = `
      UPDATE user_profiles
      SET address = $1, mobile_no = $2
      WHERE user_id = $3;
    `;
    await client.query(query, [address, mobileNo, userId]);
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

### Admin Updating Profile (Admin-Privileged Flow)
An admin updating a user profile must execute `SET LOCAL erp.is_admin = 'true';` inside the transaction before running the update:

```javascript
// Admin updates profile (allows changing full_name, position, email etc.)
async function updateProfileByAdmin(targetUserId, newName, newPosition, newAddress) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Inform the database that this is an Admin session
    await client.query("SET LOCAL erp.is_admin = 'true';");
    
    // 2. Perform the update on profile fields
    const profileQuery = `
      UPDATE user_profiles
      SET full_name = $1, position = $2, address = $3
      WHERE user_id = $4;
    `;
    await client.query(profileQuery, [newName, newPosition, newAddress, targetUserId]);
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```
