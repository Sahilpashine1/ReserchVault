const mongoose = require('mongoose');

/**
 * ActivityLog Model
 * Tracks all user actions for audit and monitoring purposes
 * Accessible only to Super Admin
 */
const activityLogSchema = new mongoose.Schema({
    // User information
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userRole: {
        type: String,
        enum: ['user', 'admin_viewer', 'super_admin'],
        required: true
    },

    // Action details
    action: {
        type: String,
        enum: ['login', 'logout', 'view', 'add', 'edit', 'delete', 'upload', 'export', 'role_change', 'user_create', 'user_update', 'user_delete'],
        required: true
    },

    // Entity information (what was acted upon)
    entityType: {
        type: String,
        enum: ['publication', 'user', 'system', 'activity_log'],
        default: 'system'
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    entityDetails: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Technical details
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    ipAddress: {
        type: String,
        default: ''
    },
    userAgent: {
        type: String,
        default: ''
    },

    // Additional metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
});

// Index for efficient querying
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ userRole: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
