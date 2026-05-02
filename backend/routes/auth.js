/**
 * Auth Routes — ResearchVault
 * ──────────────────────────────────────────────────────────────────────────
 *  POST /api/auth/register           Register + send OTP email
 *  POST /api/auth/verify-otp         Verify OTP → activate account
 *  POST /api/auth/resend-otp         Resend a fresh OTP
 *  POST /api/auth/login              Login (blocked if not verified)
 *  POST /api/auth/logout             Logout (log activity)
 *  GET  /api/auth/me                 Get current user info
 *  POST /api/auth/forgot-password    Send password-reset OTP via email
 *  POST /api/auth/reset-password     Reset password with OTP
 * ──────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const User = require('../models/User');
const { getRoleFromEmail } = require('../utils/roleChecker');
const { logLogin, logLogout } = require('../middleware/activityLogger');
const auth = require('../middleware/auth');
const { attachUser } = require('../middleware/authorize');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/emailService');

// ── Helper: generate a 6-digit numeric OTP ───────────────────────────────
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // always 6 digits
}

// ── Helper: sign JWT ─────────────────────────────────────────────────────
function signToken(userId) {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
        { expiresIn: '7d' }
    );
}

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, department } = req.body;

        // ── 1. Basic field presence ──────────────────────────────────────
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email and password.' });
        }

        // ── 2. Strict email format validation ───────────────────────────
        const cleanEmail = email.toLowerCase().trim();
        if (!validator.isEmail(cleanEmail)) {
            return res.status(400).json({
                message: 'Please provide a valid email address (e.g. name@university.edu).'
            });
        }

        // ── 3. Password strength ─────────────────────────────────────────
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        // ── 4. Duplicate email check ─────────────────────────────────────
        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
            if (!existingUser.isVerified) {
                // Resend OTP if they registered but never verified
                const otp = generateOTP();
                const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
                existingUser.otp = otp;
                existingUser.otpExpiry = otpExpiry;
                await existingUser.save();
                try { await sendOTPEmail(cleanEmail, existingUser.name, otp); } catch (emailErr) {
                    console.error('OTP email error (resend on duplicate):', emailErr.message);
                }
                return res.status(200).json({
                    message: 'Account already exists but is not verified. A new OTP has been sent to your email.',
                    requiresVerification: true,
                    email: cleanEmail
                });
            }
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        // ── 5. Hash password ─────────────────────────────────────────────
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ── 6. Determine role ────────────────────────────────────────────
        const role = getRoleFromEmail ? getRoleFromEmail(cleanEmail) : 'user';

        // ── 7. Generate OTP ──────────────────────────────────────────────
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // ── 8. Save user (unverified) ────────────────────────────────────
        const user = new User({
            name,
            email: cleanEmail,
            password: hashedPassword,
            department: department || '',
            role,
            isVerified: false,
            otp,
            otpExpiry
        });
        await user.save();

        // ── 9. Send OTP email (non-blocking on failure) ──────────────────
        let emailSent = false;
        try {
            await sendOTPEmail(cleanEmail, name, otp);
            emailSent = true;
        } catch (emailErr) {
            console.error('❌ OTP email send failed:', emailErr.message);
            // Do NOT delete the user — allow manual retry via /resend-otp
        }

        return res.status(201).json({
            message: emailSent
                ? 'Registration successful! Please check your email for the OTP to verify your account.'
                : 'Account created. Email delivery failed — please use Resend OTP to try again.',
            requiresVerification: true,
            email: cleanEmail,
            emailSent
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration. Please try again.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// ─────────────────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required.' });
        }

        const cleanEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(404).json({ message: 'No account found with this email.' });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: 'This account is already verified. Please log in.' });
        }
        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({ message: 'No OTP found. Please use Resend OTP.' });
        }
        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }
        if (user.otp !== otp.toString().trim()) {
            return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
        }

        // ── Mark as verified, clear OTP fields ───────────────────────────
        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        // Issue JWT immediately so user is logged in right after verification
        const token = signToken(user._id);

        return res.json({
            message: '✅ Email verified successfully! Welcome to ResearchVault.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                department: user.department,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Server error during verification. Please try again.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/resend-otp
// ─────────────────────────────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required.' });

        const cleanEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: cleanEmail });

        if (!user) return res.status(404).json({ message: 'No account found with this email.' });
        if (user.isVerified) return res.status(400).json({ message: 'Account is already verified.' });

        // Rate-limit: only allow resend if existing OTP is > 1 min old (or expired)
        if (user.otpExpiry && new Date() < new Date(user.otpExpiry.getTime() - 9 * 60 * 1000)) {
            return res.status(429).json({ message: 'Please wait at least 1 minute before requesting a new OTP.' });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        let emailSent = false;
        try {
            await sendOTPEmail(cleanEmail, user.name, otp);
            emailSent = true;
        } catch (emailErr) {
            console.error('Resend OTP email error:', emailErr.message);
        }

        return res.json({
            message: emailSent
                ? 'A new OTP has been sent to your email (valid for 10 minutes).'
                : 'OTP generated but email delivery failed. Please check server logs.',
            emailSent
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password.' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // ── Block unverified accounts ──────────────────────────────────────
        // KEY: Legacy users (created before OTP feature) have isVerified=false
        // BUT otp=null because they never went through the OTP registration flow.
        // Only block users who registered via the new flow and still have a pending OTP.
        const isAdminCreated = user.createdByAdmin === true;
        const isLegacyUser = !user.isVerified && !user.otp; // no OTP = never registered via new flow

        if (!isLegacyUser && !isAdminCreated && !user.isVerified) {
            return res.status(403).json({
                message: 'Please verify your email before logging in.',
                requiresVerification: true,
                email: user.email
            });
        }
        // Auto-mark legacy/admin-created users as verified so they are never blocked again
        if (isLegacyUser || isAdminCreated) {
            user.isVerified = true;
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: 'Your account has been deactivated. Please contact the administrator.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        user.lastLogin = new Date();
        await user.save();
        await logLogin(user, req);

        const token = signToken(user._id);

        return res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                department: user.department,
                role: user.role,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────
router.post('/logout', auth, attachUser, async (req, res) => {
    try {
        if (req.user) await logLogout(req.user, req);
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error during logout.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────
router.get('/me', auth, attachUser, async (req, res) => {
    try {
        if (!req.user) return res.status(404).json({ message: 'User not found.' });
        res.json({
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                department: req.user.department,
                role: req.user.role,
                lastLogin: req.user.lastLogin,
                createdAt: req.user.createdAt
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Error fetching user info.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password   — now sends real OTP via email
// ─────────────────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Please provide your email address.' });

        const cleanEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: cleanEmail });

        // Always return success to prevent email enumeration
        if (!user) {
            return res.json({ message: 'If an account with that email exists, a reset OTP has been sent.' });
        }

        const otp = generateOTP();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.resetPasswordToken = otp;
        user.resetPasswordExpires = expires;
        await user.save();

        let emailSent = false;
        try {
            await sendPasswordResetEmail(cleanEmail, user.name, otp);
            emailSent = true;
        } catch (emailErr) {
            console.error('Password reset email error:', emailErr.message);
        }

        res.json({
            message: emailSent
                ? 'A password reset OTP has been sent to your email.'
                : 'OTP generated but email delivery failed. Check server configuration.',
            emailSent,
            // Only expose the token in development (never in production)
            ...(process.env.NODE_ENV === 'development' && { resetToken: otp })
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;

        if (!email || !token || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP code, and new password are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            resetPasswordToken: token.trim(),
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new one.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ message: 'Password reset successfully! You can now sign in with your new password.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

module.exports = router;
