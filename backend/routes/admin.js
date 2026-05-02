const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Publication = require('../models/Publication');
const ActivityLog = require('../models/ActivityLog');
const auth = require('../middleware/auth');
const { requireSuperAdmin, requireAdmin } = require('../middleware/authorize');
const { logUserManagement, logActivity } = require('../middleware/activityLogger');
const { getRoleFromEmail, getRoleDisplayName } = require('../utils/roleChecker');

// ============================================
// USER MANAGEMENT ROUTES (Super Admin Only)
// ============================================

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Super Admin only)
router.get('/users', auth, requireSuperAdmin, async (req, res) => {
    try {
        const { search, role, isActive } = req.query;

        let query = {};

        // Search by name or email
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by role
        if (role) {
            query.role = role;
        }

        // Filter by active status
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const users = await User.find(query)
            .select('-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpires')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user details
// @access  Private (Super Admin only)
router.get('/users/:id', auth, requireSuperAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get user's publication count
        const publicationCount = await Publication.countDocuments({ userId: user._id });

        res.json({
            success: true,
            data: {
                ...user.toObject(),
                publicationCount
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Error fetching user' });
    }
});

// @route   POST /api/admin/users
// @desc    Create new user (Super Admin only)
// @access  Private (Super Admin only)
router.post('/users', auth, requireSuperAdmin, async (req, res) => {
    try {
        const { name, email, password, department, role } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Please provide name, email, and password'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists with this email'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Determine role (admin can override or use email-based)
        const userRole = role || getRoleFromEmail(email);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            department: department || '',
            role: userRole,
            isActive: true,
            createdByAdmin: true // Mark as admin-created to allow viewing all publications
        });

        await user.save();

        // Log user creation
        await logUserManagement(req.user, 'user_create', user, {
            createdBy: req.user.email
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                department: user.department,
                role: user.role,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Error creating user' });
    }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private (Super Admin only)
router.put('/users/:id', auth, requireSuperAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { name, email, department, password } = req.body;
        const changes = {};

        // Update fields
        if (name && name !== user.name) {
            user.name = name;
            changes.name = { old: user.name, new: name };
        }
        if (email && email !== user.email) {
            // Check if email is already taken
            const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
            if (emailExists) {
                return res.status(400).json({
                    message: 'Email already in use'
                });
            }
            changes.email = { old: user.email, new: email };
            user.email = email;
        }
        if (department !== undefined && department !== user.department) {
            changes.department = { old: user.department, new: department };
            user.department = department;
        }

        // Update password if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            changes.password = 'updated';
        }

        await user.save();

        // Log user update
        await logUserManagement(req.user, 'user_update', user, {
            changes,
            updatedBy: req.user.email
        });

        const userObj = user.toObject();
        delete userObj.password;

        res.json({
            success: true,
            message: 'User updated successfully',
            data: userObj
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Change user role
// @access  Private (Super Admin only)
router.put('/users/:id/role', auth, requireSuperAdmin, async (req, res) => {
    try {
        const { role } = req.body;

        if (!role || !['user', 'super_admin'].includes(role)) {
            return res.status(400).json({
                message: 'Invalid role. Must be user or super_admin'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const oldRole = user.role;
        user.role = role;
        await user.save();

        // Log role change
        await logUserManagement(req.user, 'role_change', user, {
            oldRole,
            newRole: role,
            changedBy: req.user.email
        });

        res.json({
            success: true,
            message: `User role changed from ${getRoleDisplayName(oldRole)} to ${getRoleDisplayName(role)}`,
            data: {
                id: user._id,
                email: user.email,
                oldRole,
                newRole: role
            }
        });

    } catch (error) {
        console.error('Change role error:', error);
        res.status(500).json({ message: 'Error changing user role' });
    }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Activate/deactivate user
// @access  Private (Super Admin only)
router.put('/users/:id/status', auth, requireSuperAdmin, async (req, res) => {
    try {
        const { isActive } = req.body;

        if (isActive === undefined) {
            return res.status(400).json({
                message: 'Please provide isActive status'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deactivating yourself
        if (user._id.toString() === req.user._id.toString() && !isActive) {
            return res.status(400).json({
                message: 'You cannot deactivate your own account'
            });
        }

        const oldStatus = user.isActive;
        user.isActive = isActive;
        await user.save();

        // Log status change
        await logUserManagement(req.user, 'user_update', user, {
            statusChange: { old: oldStatus, new: isActive },
            changedBy: req.user.email
        });

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                id: user._id,
                email: user.email,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error('Change status error:', error);
        res.status(500).json({ message: 'Error changing user status' });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Super Admin only)
router.delete('/users/:id', auth, requireSuperAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                message: 'You cannot delete your own account'
            });
        }

        // Log user deletion before deleting
        await logUserManagement(req.user, 'user_delete', user, {
            deletedBy: req.user.email,
            hadPublications: await Publication.countDocuments({ userId: user._id })
        });

        // Delete user's publications
        await Publication.deleteMany({ userId: user._id });

        // Delete user
        await User.deleteOne({ _id: user._id });

        res.json({
            success: true,
            message: 'User and all associated publications deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// ============================================
// ACTIVITY LOG ROUTES (Super Admin Only)
// ============================================

// @route   GET /api/admin/activity-logs
// @desc    Get activity logs with filtering
// @access  Private (Super Admin only)
router.get('/activity-logs', auth, requireSuperAdmin, async (req, res) => {
    try {
        const {
            userEmail,
            role,
            action,
            entityType,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        let query = {};

        // Filter by user email
        if (userEmail) {
            query.userEmail = { $regex: userEmail, $options: 'i' };
        }

        // Filter by role
        if (role) {
            query.userRole = role;
        }

        // Filter by action
        if (action) {
            query.action = action;
        }

        // Filter by entity type
        if (entityType) {
            query.entityType = entityType;
        }

        // Filter by date range
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                query.timestamp.$lte = new Date(endDate);
            }
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const logs = await ActivityLog.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .populate('userId', 'name email');

        const total = await ActivityLog.countDocuments(query);

        // Log the view action
        await logActivity({
            userId: req.user._id,
            userEmail: req.user.email,
            userRole: req.user.role,
            action: 'view',
            entityType: 'activity_log',
            metadata: {
                filters: query,
                resultCount: logs.length
            }
        });

        res.json({
            success: true,
            count: logs.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: logs
        });

    } catch (error) {
        console.error('Get activity logs error:', error);
        res.status(500).json({ message: 'Error fetching activity logs' });
    }
});

// @route   GET /api/admin/activity-logs/export
// @desc    Export activity logs as CSV
// @access  Private (Super Admin only)
router.get('/activity-logs/export', auth, requireSuperAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let query = {};
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const logs = await ActivityLog.find(query).sort({ timestamp: -1 });

        // Convert to CSV
        let csv = 'Timestamp,User Email,Role,Action,Entity Type,Entity ID,Details,IP Address\n';

        logs.forEach(log => {
            const details = JSON.stringify(log.entityDetails).replace(/"/g, '""');
            csv += `"${log.timestamp}","${log.userEmail}","${log.userRole}","${log.action}","${log.entityType}","${log.entityId || ''}","${details}","${log.ipAddress}"\n`;
        });

        // Log export action
        await logActivity({
            userId: req.user._id,
            userEmail: req.user.email,
            userRole: req.user.role,
            action: 'export',
            entityType: 'activity_log',
            metadata: {
                exportedCount: logs.length,
                dateRange: { startDate, endDate }
            }
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${Date.now()}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Export logs error:', error);
        res.status(500).json({ message: 'Error exporting activity logs' });
    }
});

// ============================================
// STATISTICS & DASHBOARD (Admin & Super Admin)
// ============================================

// @route   GET /api/admin/stats
// @desc    Get system statistics
// @access  Private (Admin Viewer & Super Admin)
router.get('/stats', auth, requireAdmin, async (req, res) => {
    try {
        // User statistics
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const usersByRole = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        // Publication statistics
        const totalPublications = await Publication.countDocuments();
        const publicationsByYear = await Publication.aggregate([
            { $group: { _id: '$year', count: { $sum: 1 } } },
            { $sort: { _id: -1 } },
            { $limit: 5 }
        ]);

        // Activity statistics (if super admin)
        let activityStats = null;
        if (req.user.role === 'super_admin') {
            const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
            activityStats = {
                last24Hours: await ActivityLog.countDocuments({
                    timestamp: { $gte: last24Hours }
                }),
                byAction: await ActivityLog.aggregate([
                    { $match: { timestamp: { $gte: last24Hours } } },
                    { $group: { _id: '$action', count: { $sum: 1 } } }
                ])
            };
        }

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    byRole: usersByRole
                },
                publications: {
                    total: totalPublications,
                    byYear: publicationsByYear
                },
                activity: activityStats
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Error fetching statistics' });
    }
});

// @route   GET /api/admin/publications
// @desc    Get all publications (from all users)
// @access  Private (Admin Viewer & Super Admin)
router.get('/publications', auth, requireAdmin, async (req, res) => {
    try {
        const { search, userId, year, sort = 'createdDate', order = 'desc' } = req.query;

        let query = {};

        // Filter by user
        if (userId) {
            query.userId = userId;
        }

        // Search
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { authors: { $regex: search, $options: 'i' } },
                { keywords: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by year
        if (year) {
            query.year = parseInt(year);
        }

        const sortOption = { [sort]: order === 'desc' ? -1 : 1 };

        const publications = await Publication.find(query)
            .sort(sortOption)
            .populate('userId', 'name email department');

        res.json({
            success: true,
            count: publications.length,
            data: publications
        });

    } catch (error) {
        console.error('Get all publications error:', error);
        res.status(500).json({ message: 'Error fetching publications' });
    }
});

module.exports = router;
