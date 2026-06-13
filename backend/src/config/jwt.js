/**
 * config/jwt.js — JWT Token Utilities
 *
 * What this file does:
 *   Centralizes ALL JSON Web Token operations in one place.
 *   Every other module that needs to create or verify tokens imports from here.
 *
 *   WHY TWO TOKENS?
 *   - Access Token  (short-lived: 15 min): Used on every API request.
 *     If stolen, it expires quickly — low damage window.
 *   - Refresh Token (long-lived: 7 days): Used ONLY to get a new access token.
 *     Stored securely by the client, never sent on normal API requests.
 *     Has its own secret so even if the access secret is compromised,
 *     refresh tokens can't be forged.
 *
 *   TOKEN PAYLOAD (what's inside the JWT):
 *   { id, email, role }  — enough to authorize any request without a DB lookup
 *
 * Functions exported:
 *   signAccessToken(payload)    → returns signed access JWT string
 *   signRefreshToken(payload)   → returns signed refresh JWT string
 *   verifyAccessToken(token)    → returns decoded payload or throws
 *   verifyRefreshToken(token)   → returns decoded payload or throws
 */

const jwt = require('jsonwebtoken');

// Read secrets and expiry from environment variables
// These MUST be set in .env — the app will crash on startup if they're missing
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN = '15m',
  JWT_REFRESH_EXPIRES_IN = '7d',
} = process.env;

// Fail-fast: if secrets are missing, crash immediately with a clear message
// Better to crash on startup than to silently issue unsigned tokens
if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error(
    'FATAL: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in .env\n' +
    'Run: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))" to generate secrets'
  );
}

/**
 * Creates a short-lived access token.
 * @param {object} payload - { id, email, role }
 * @returns {string} Signed JWT string
 */
function signAccessToken(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
    issuer: 'erp-nexus',
    audience: 'erp-nexus-client',
  });
}

/**
 * Creates a long-lived refresh token.
 * @param {object} payload - { id, email, role }
 * @returns {string} Signed JWT string
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'erp-nexus',
    audience: 'erp-nexus-client',
  });
}

/**
 * Verifies an access token. Throws if invalid or expired.
 * @param {string} token
 * @returns {object} Decoded payload { id, email, role, iat, exp }
 */
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET, {
    issuer: 'erp-nexus',
    audience: 'erp-nexus-client',
  });
}

/**
 * Verifies a refresh token. Throws if invalid or expired.
 * @param {string} token
 * @returns {object} Decoded payload
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET, {
    issuer: 'erp-nexus',
    audience: 'erp-nexus-client',
  });
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
