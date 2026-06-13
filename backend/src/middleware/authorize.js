/**
 * middleware/authorize.js — Role-Based Access Control (RBAC) Middleware
 *
 * What this file does:
 *   A FACTORY function that returns Express middleware.
 *   You pass in the list of allowed roles, and it produces a middleware
 *   that checks req.user.role (set by authenticate.js) against that list.
 *   If the user's role is in the allowed list → proceed.
 *   If not → 403 Forbidden.
 *
 *   WHY A FACTORY?
 *   Different routes have different role requirements.
 *   Instead of writing a new middleware for every combination, we call:
 *     authorize('admin', 'sales')
 *   and it returns the right middleware for that specific route.
 *
 *   IMPORTANT: authorize() must always come AFTER authenticate()
 *   because it reads req.user which authenticate() sets.
 *
 * Valid roles (from Prisma schema):
 *   admin | sales | purchase | manufacturing | inventory | owner
 *
 * Usage examples:
 *   // Only admins can delete products
 *   router.delete('/:id', authenticate, authorize('admin'), controller.delete);
 *
 *   // Sales and admin can confirm orders
 *   router.post('/:id/confirm', authenticate, authorize('admin', 'sales'), controller.confirm);
 *
 *   // All authenticated users can access dashboard
 *   router.get('/dashboard', authenticate, authorize('admin','sales','purchase','manufacturing','inventory','owner'), controller.dashboard);
 */

/**
 * authorize — RBAC middleware factory
 * @param {...string} roles - List of roles that are allowed to access the route
 * @returns {Function} Express middleware
 */
function authorize(...roles) {
  return (req, res, next) => {
    // authenticate() must have run first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required before authorization check',
      });
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: `Your role '${userRole}' does not have permission to perform this action`,
        required_roles: roles,
      });
    }

    next(); // Role check passed — proceed to route handler
  };
}

// ─── Pre-built role groups (convenience exports) ──────────────────────────────
// These cover the most common RBAC combinations in the RBAC matrix.
// Import whichever combination you need rather than listing roles every time.

/** All 6 roles — used for dashboard and read-only public endpoints */
authorize.ALL_ROLES = ['admin', 'sales', 'purchase', 'manufacturing', 'inventory', 'owner'];

/** Admin + Business Owner — full visibility + intelligence features */
authorize.ADMIN_OWNER = ['admin', 'owner'];

/** Admin + Inventory — stock operations */
authorize.ADMIN_INVENTORY = ['admin', 'inventory'];

/** Admin + Sales — sales order management */
authorize.ADMIN_SALES = ['admin', 'sales'];

/** Admin + Purchase — purchase order management */
authorize.ADMIN_PURCHASE = ['admin', 'purchase'];

/** Admin + Manufacturing — production management */
authorize.ADMIN_MANUFACTURING = ['admin', 'manufacturing'];

module.exports = authorize;
