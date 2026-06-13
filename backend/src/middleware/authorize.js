const prisma = require('../config/db');

function authorize(...requiredModules) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required before authorization check',
        });
      }
      if (req.user.role === 'admin' || req.user.role === 'owner') {
        return next();
      }
      if (requiredModules.length === 0) {
        return next();
      }
      const userAccess = await prisma.userModuleAccess.findMany({
        where: { user_id: req.user.id },
        include: { module: true }
      });

      const grantedModuleNames = userAccess.map(a => a.module.module_name);
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
