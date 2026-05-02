const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    department: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    profilePicture: {
        type: String,
        default: ''
    },

    // ── Academic / professional fields ──────────────────────
    designation: {
        type: String,
        default: ''   // e.g. "Assistant Professor", "Associate Professor"
    },
    specialization: {
        type: String,
        default: ''   // e.g. "Machine Learning, Computer Vision"
    },
    yearsOfExperience: {
        type: Number,
        default: null
    },
    education: {
        type: String,
        default: ''   // e.g. "Ph.D. (CS) - IIT Bombay, 2018"
    },
    googleScholar: {
        type: String,
        default: ''
    },
    orcid: {
        type: String,
        default: ''
    },
    website: {
        type: String,
        default: ''
    },

    // ── Role & Access ────────────────────────────────────────
    role: {
        type: String,
        enum: ['user', 'super_admin'],
        default: 'user'
    },
    createdByAdmin: {
        type: Boolean,
        default: false   // true if created by super admin, false if self-registered
    },
    isActive: {
        type: Boolean,
        default: true
    },

    // ── Email Verification (OTP) ─────────────────────────────
    isVerified: {
        type: Boolean,
        default: false   // user cannot login until email is verified
    },
    otp: {
        type: String,
        default: null    // 6-digit numeric OTP (expires in 10 min)
    },
    otpExpiry: {
        type: Date,
        default: null
    },

    // ── Audit / Timestamps ────────────────────────────────────
    lastLogin: {
        type: Date,
        default: null
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
