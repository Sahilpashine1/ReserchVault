const ActivityLog = require('../models/ActivityLog');

/**
 * Activity Logger Middleware
 * Automatically logs user actions for audit trail
 * Can be used as middleware or called directly
 */

/**
 * Log an activity
 * @param {Object} params - Activity parameters
 */
const logActivity = async (params) => {
    try {
        const {
            userId,
            userEmail,
            userRole,
            action,
            entityType = 'system',
            entityId = null,
            entityDetails = {},
            ipAddress = '',
            userAgent = '',
            metadata = {}
        } = params;

        const activityLog = new ActivityLog({
            userId,
            userEmail,
            userRole,
            action,
            entityType,
            entityId,
            entityDetails,
            ipAddress,
            userAgent,
            metadata
        });

        await activityLog.save();
        return activityLog;
    } catch (error) {
        // Don't throw error - logging should not break the application
        console.error('Activity logging error:', error);
        return null;
    }
};

/**
 * Middleware to automatically log actions
 * Usage: router.post('/path', auth, logAction('add', 'publication'), handler)
 */
const logAction = (action, entityType = 'system') => {
    return async (req, res, next) => {
        // Store original res.json to intercept response
        const originalJson = res.json.bind(res);

        res.json = function (data) {
            // Log the action (fire and forget)
            if (req.user) {
                const entityId = data?.data?._id || req.params.id || null;
                const entityDetails = {};

                // Capture relevant details based on action
                if (action === 'add' && data?.data) {
                    entityDetails.title = data.data.title;
                    entityDetails.created = true;
                } else if (action === 'edit' && data?.data) {
                    entityDetails.title = data.data.title;
                    entityDetails.changes = req.body;
                } else if (action === 'delete') {
                    entityDetails.deleted = true;
                } else if (action === 'upload') {
                    entityDetails.fileName = req.file?.originalname;
                    entityDetails.recordCount = data?.stats?.inserted || 0;
                }

                logActivity({
                    userId: req.user._id,
                    userEmail: req.user.email,
                    userRole: req.user.role,
                    action,
                    entityType,
                    entityId,
                    entityDetails,
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('user-agent') || '',
                    metadata: {
                        path: req.path,
                        method: req.method
                    }
                });
            }

            // Call original json method
            return originalJson(data);
        };

        next();
    };
};

/**
 * Log login activity
 */
const logLogin = async (user, req) => {
    return await logActivity({
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        action: 'login',
        entityType: 'system',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent') || '',
        metadata: {
            loginTime: new Date()
        }
    });
};

/**
 * Log logout activity
 */
const logLogout = async (user, req) => {
    return await logActivity({
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        action: 'logout',
        entityType: 'system',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent') || '',
        metadata: {
            logoutTime: new Date()
        }
    });
};

/**
 * Log user management actions
 */
const logUserManagement = async (admin, action, targetUser, details = {}) => {
    return await logActivity({
        userId: admin._id,
        userEmail: admin.email,
        userRole: admin.role,
        action,
        entityType: 'user',
        entityId: targetUser._id,
        entityDetails: {
            targetUserEmail: targetUser.email,
            targetUserName: targetUser.name,
            ...details
        },
        metadata: {
            managementAction: action
        }
    });
};

module.exports = {
    logActivity,
    logAction,
    logLogin,
    logLogout,
    logUserManagement
};
