/**
 * middleware/authenticate.js — JWT Authentication Middleware
 *
 * What this file does:
 *   Protects routes by verifying the JWT access token in the request header.
 *   If the token is valid, it attaches the decoded user info to req.user
 *   so downstream route handlers know WHO is making the request.
 *   If the token is missing or invalid, it returns 401 immediately.
 *
 *   HOW THE CLIENT SENDS THE TOKEN:
 *   Every protected API request must include this HTTP header:
 *     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *   WHAT req.user CONTAINS AFTER THIS MIDDLEWARE:
 *   { id: 'uuid', email: 'user@example.com', role: 'sales' }
 *   All subsequent middleware and route handlers can trust this.
 *
 * Usage:
 *   const authenticate = require('../middleware/authenticate');
 *   router.get('/protected', authenticate, (req, res) => {
 *     res.json({ message: `Hello ${req.user.email}` });
 *   });
 */

const { verifyAccessToken } = require('../config/jwt');

/**
 * authenticate — Express middleware
 * Verifies Bearer token and attaches req.user
 */
function authenticate(req, res, next) {
  try {
    // Extract the Authorization header
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        hint: 'Include "Authorization: Bearer <token>" in your request headers',
      });
    }

    // Authorization header format: "Bearer <token>"
    // Split on space and take the second part
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization format',
        hint: 'Use "Authorization: Bearer <your-access-token>"',
      });
    }

    const token = parts[1];

    // verifyAccessToken throws if the token is expired, tampered, or invalid
    const decoded = verifyAccessToken(token);

    // Attach user info to the request object for downstream handlers
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next(); // Token valid — proceed to the route handler

  } catch (error) {
    // jwt.verify throws specific errors we can handle gracefully
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Access token expired',
        hint: 'Use POST /api/auth/refresh with your refresh token to get a new access token',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid access token',
        hint: 'Please log in again',
      });
    }

    // Unexpected error — pass to global error handler
    next(error);
  }
}

module.exports = authenticate;
