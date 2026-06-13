

const jwt = require('jsonwebtoken');
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN = '15m',
  JWT_REFRESH_EXPIRES_IN = '7d',
} = process.env;
if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error(
    'FATAL: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in .env\n' +
    'Run: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))" to generate secrets'
  );
}

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
    issuer: 'erp-nexus',
    audience: 'erp-nexus-client',
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'erp-nexus',
    audience: 'erp-nexus-client',
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET, {
    issuer: 'erp-nexus',
    audience: 'erp-nexus-client',
  });
}

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
