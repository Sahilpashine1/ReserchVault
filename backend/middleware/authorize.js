const User = require('../models/User');

/**
 * Authorization Middleware
 * Checks if the authenticated user has the required role(s)
 * Must be used after the auth middleware
 */

/**
 * Check if user has one of the allowed roles
 * @param {Array} allowedRoles - Array of roles that are allowed
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // Ensure user is authenticated first
            if (!req.userId) {
                return res.status(401).json({
                    message: 'Authentication required'
                });
            }

            // Get user from database
            const user = await User.findById(req.userId).select('-password');

            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            // Check if user is active
            if (!user.isActive) {
                return res.status(403).json({
                    message: 'Your account has been deactivated. Please contact administrator.'
                });
            }

            // Check if user has required role
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    message: 'Access denied. Insufficient permissions.',
                    required: allowedRoles,
                    current: user.role
                });
            }

            // Attach user object to request for use in route handlers
            req.user = user;
            next();

        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({
                message: 'Error checking permissions'
            });
        }
    };
};

/**
 * Check if user is Super Admin
 */
const requireSuperAdmin = requireRole(['super_admin']);

/**
 * Check if user is any type of admin (Super Admin or Admin Viewer)
 */
const requireAdmin = requireRole(['super_admin', 'admin_viewer']);

/**
 * Check if user is Super Admin or regular user (for creating own content)
 */
const requireSuperAdminOrUser = requireRole(['super_admin', 'user']);

/**
 * Get user info and attach to request (without role restriction)
 */
const attachUser = async (req, res, next) => {
    try {
        if (!req.userId) {
            return next();
        }

        const user = await User.findById(req.userId).select('-password');
        if (user) {
            req.user = user;
        }
        next();
    } catch (error) {
        console.error('Error attaching user:', error);
        next();
    }
};

module.exports = {
    requireRole,
    requireSuperAdmin,
    requireAdmin,
    requireSuperAdminOrUser,
    attachUser
};
