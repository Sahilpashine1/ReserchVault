const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { attachUser } = require('../middleware/authorize');
const { logActivity } = require('../middleware/activityLogger');

// Configure multer for profile picture upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/profiles');

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: userId_timestamp_originalname
        const uniqueName = `${req.userId}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images only
        const fileTypes = /jpeg|jpg|png|gif/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// @route   GET /api/profile
// @desc    Get current user's profile
// @access  Private
router.get('/', auth, attachUser, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Don't send password
        const userProfile = {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            department: req.user.department,
            phone: req.user.phone,
            bio: req.user.bio,
            profilePicture: req.user.profilePicture,
            role: req.user.role,
            isActive: req.user.isActive,
            lastLogin: req.user.lastLogin,
            createdAt: req.user.createdAt
        };

        res.json({
            success: true,
            data: userProfile
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', auth, attachUser, async (req, res) => {
    try {
        const { name, email, department, phone, bio } = req.body;

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const oldData = { ...user.toObject() };

        // Update fields
        if (name) user.name = name;
        if (email && email !== user.email) {
            // Check if email is already taken
            const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = email;
        }
        if (department !== undefined) user.department = department;
        if (phone !== undefined) user.phone = phone;
        if (bio !== undefined) user.bio = bio;

        await user.save();

        // Log profile update
        await logActivity({
            userId: user._id,
            userEmail: user.email,
            userRole: user.role,
            action: 'update',
            entityType: 'profile',
            entityId: user._id.toString(),
            entityDetails: {
                changes: {
                    name: oldData.name !== user.name,
                    email: oldData.email !== user.email,
                    department: oldData.department !== user.department,
                    phone: oldData.phone !== user.phone,
                    bio: oldData.bio !== user.bio
                }
            }
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                department: user.department,
                phone: user.phone,
                bio: user.bio,
                profilePicture: user.profilePicture,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// @route   POST /api/profile/picture
// @desc    Upload profile picture
// @access  Private
router.post('/picture', auth, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete old profile picture if exists
        if (user.profilePicture) {
            const oldPicturePath = path.join(__dirname, '..', user.profilePicture);
            if (fs.existsSync(oldPicturePath)) {
                fs.unlinkSync(oldPicturePath);
            }
        }

        // Save relative path to database
        user.profilePicture = `/uploads/profiles/${req.file.filename}`;
        await user.save();

        // Log profile picture upload
        await logActivity({
            userId: user._id,
            userEmail: user.email,
            userRole: user.role,
            action: 'update',
            entityType: 'profile_picture',
            entityId: user._id.toString(),
            entityDetails: {
                filename: req.file.filename
            }
        });

        res.json({
            success: true,
            message: 'Profile picture uploaded successfully',
            data: {
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {
        console.error('Upload profile picture error:', error);

        // Delete uploaded file if error occurs
        if (req.file) {
            const filePath = req.file.path;
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.status(500).json({ message: 'Error uploading profile picture' });
    }
});

// @route   DELETE /api/profile/picture
// @desc    Delete profile picture
// @access  Private
router.delete('/picture', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.profilePicture) {
            return res.status(400).json({ message: 'No profile picture to delete' });
        }

        // Delete file from filesystem
        const picturePath = path.join(__dirname, '..', user.profilePicture);
        if (fs.existsSync(picturePath)) {
            fs.unlinkSync(picturePath);
        }

        // Remove from database
        user.profilePicture = '';
        await user.save();

        // Log profile picture deletion
        await logActivity({
            userId: user._id,
            userEmail: user.email,
            userRole: user.role,
            action: 'delete',
            entityType: 'profile_picture',
            entityId: user._id.toString()
        });

        res.json({
            success: true,
            message: 'Profile picture deleted successfully'
        });

    } catch (error) {
        console.error('Delete profile picture error:', error);
        res.status(500).json({ message: 'Error deleting profile picture' });
    }
});

// @route   PUT /api/profile/password
// @desc    Change password
// @access  Private
router.put('/password', auth, attachUser, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Please provide both current and new password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'New password must be at least 6 characters long'
            });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        // Log password change
        await logActivity({
            userId: user._id,
            userEmail: user.email,
            userRole: user.role,
            action: 'update',
            entityType: 'password',
            entityId: user._id.toString(),
            entityDetails: {
                message: 'Password changed successfully'
            }
        });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Error changing password' });
    }
});

module.exports = router;
