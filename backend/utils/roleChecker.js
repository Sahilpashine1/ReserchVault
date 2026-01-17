/**
 * Role Checker Utility
 * Helper functions to determine user roles from email
 */

/**
 * Get configured admin emails from environment
 */
const getAdminEmails = () => {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || '';
    const adminViewerEmails = process.env.ADMIN_VIEWER_EMAILS || '';

    return {
        superAdmin: superAdminEmail.toLowerCase().trim(),
        adminViewers: adminViewerEmails
            .split(',')
            .map(email => email.toLowerCase().trim())
            .filter(email => email.length > 0)
    };
};

/**
 * Determine role based on email address
 * @param {String} email - User email
 * @returns {String} - Role (user, admin_viewer, or super_admin)
 */
const getRoleFromEmail = (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    const { superAdmin, adminViewers } = getAdminEmails();

    // Check if super admin
    if (normalizedEmail === superAdmin) {
        return 'super_admin';
    }

    // Check if admin viewer
    if (adminViewers.includes(normalizedEmail)) {
        return 'admin_viewer';
    }

    // Default to regular user (faculty)
    return 'user';
};

/**
 * Check if email is configured as super admin
 */
const isSuperAdmin = (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    const { superAdmin } = getAdminEmails();
    return normalizedEmail === superAdmin;
};

/**
 * Check if email is configured as admin viewer
 */
const isAdminViewer = (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    const { adminViewers } = getAdminEmails();
    return adminViewers.includes(normalizedEmail);
};

/**
 * Check if email is configured as any type of admin
 */
const isAdmin = (email) => {
    return isSuperAdmin(email) || isAdminViewer(email);
};

/**
 * Validate admin configuration
 */
const validateAdminConfig = () => {
    const { superAdmin, adminViewers } = getAdminEmails();

    const warnings = [];

    if (!superAdmin) {
        warnings.push('⚠️  SUPER_ADMIN_EMAIL not configured in .env');
    }

    if (adminViewers.length === 0) {
        warnings.push('ℹ️  No ADMIN_VIEWER_EMAILS configured (optional)');
    }

    return {
        isValid: superAdmin.length > 0,
        warnings,
        config: {
            superAdmin,
            adminViewersCount: adminViewers.length
        }
    };
};

/**
 * Get role display name
 */
const getRoleDisplayName = (role) => {
    const roleNames = {
        'user': 'Faculty User',
        'admin_viewer': 'Admin Viewer',
        'super_admin': 'Super Administrator'
    };
    return roleNames[role] || 'Unknown Role';
};

/**
 * Get role permissions description
 */
const getRolePermissions = (role) => {
    const permissions = {
        'user': {
            canViewOwn: true,
            canViewAll: false,
            canAdd: true,
            canEdit: true,
            canDelete: true,
            canUpload: true,
            canManageUsers: false,
            canViewLogs: false
        },
        'admin_viewer': {
            canViewOwn: true,
            canViewAll: true,
            canAdd: false,
            canEdit: false,
            canDelete: false,
            canUpload: false,
            canManageUsers: false,
            canViewLogs: false
        },
        'super_admin': {
            canViewOwn: true,
            canViewAll: true,
            canAdd: true,
            canEdit: true,
            canDelete: true,
            canUpload: true,
            canManageUsers: true,
            canViewLogs: true
        }
    };
    return permissions[role] || permissions['user'];
};

module.exports = {
    getRoleFromEmail,
    isSuperAdmin,
    isAdminViewer,
    isAdmin,
    validateAdminConfig,
    getRoleDisplayName,
    getRolePermissions,
    getAdminEmails
};
