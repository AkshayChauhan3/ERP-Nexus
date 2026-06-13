-- ERP-Nexus Database Amendments
-- Component 5: Changes required for Node.js/Express backend integration

-- 1. Store which modules the user requested during registration
--    Admin uses this to grant access when approving.
--    Array of module_id integers (e.g. {1, 3} = sales + product)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS requested_modules INT[] DEFAULT '{}';

-- 2. Allow admin to record a reason when rejecting a registration
ALTER TABLE users
ADD COLUMN IF NOT EXISTS rejected_reason TEXT;

-- 3. Track when a user last successfully logged in
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 4. Refresh token store for JWT-based session management
--    Stores hashed refresh tokens linked to a user
CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,                     -- Store bcrypt hash, not raw token
    issued_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE NOT NULL
);

-- Index for fast lookup of all tokens belonging to a user
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- Index for fast lookup during token refresh validation
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked ON refresh_tokens(is_revoked) WHERE is_revoked = FALSE;
