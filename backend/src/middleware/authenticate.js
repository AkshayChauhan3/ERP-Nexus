

const { verifyAccessToken } = require('../config/jwt');

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        hint: 'Include "Authorization: Bearer <token>" in your request headers',
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization format',
        hint: 'Use "Authorization: Bearer <your-access-token>"',
      });
    }

    const token = parts[1];
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();

  } catch (error) {
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
    next(error);
  }
}

module.exports = authenticate;
