const prisma = require('../../config/db');

/**
 * authorize — RBAC middleware factory (Updated for DB Sync)
 * @param {...string} requiredModules - List of module names that are allowed
 * @returns {Function} Express middleware
 */
function authorize(...requiredModules) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required before authorization check',
        });
      }

      // Admins bypass all module checks
      if (req.user.is_admin) {
        return next();
      }

      // If route doesn't require specific modules, allow
      if (requiredModules.length === 0) {
        return next();
      }

      // Fast DB lookup for user's granted modules
      const userAccess = await prisma.userModuleAccess.findMany({
        where: { user_id: req.user.id },
        include: { module: true }
      });

      const grantedModuleNames = userAccess.map(a => a.module.module_name);

      // Check if user has at least one of the required modules (or 'owner' which implies full read access usually)
      const hasAccess = requiredModules.some(mod => grantedModuleNames.includes(mod));

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: `You do not have access to the required modules`,
          required_modules: requiredModules,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = authorize;
