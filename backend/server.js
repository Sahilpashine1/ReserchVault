/**
 * ResearchVault — Production-Ready Server
 * =========================================
 * Security: helmet, rate-limiting, CORS restriction, NoSQL sanitization
 * Logging:  morgan (dev) / combined (prod)
 * Auth:     JWT via middleware
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const publicationRoutes = require('./routes/publications');
const chatbotRoutes = require('./routes/chatbot');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');
const userRoutes = require('./routes/users');
const { validateAdminConfig } = require('./utils/roleChecker');

// ── Enforce critical env vars at startup ─────────────────────────────────
const REQUIRED_VARS = ['JWT_SECRET', 'MONGODB_URI'];
const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
    console.error(`\n❌  Missing required environment variables: ${missing.join(', ')}`);
    console.error('   Please check your .env file.\n');
    process.exit(1);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('\n❌  JWT_SECRET must be at least 32 characters long for security.\n');
    process.exit(1);
}

const app = express();

// ── Connect to MongoDB ────────────────────────────────────────────────────
connectDB();

// ── Validate admin configuration ──────────────────────────────────────────
const adminConfig = validateAdminConfig();
console.log('\n🔐 Role-Based Access Control Configuration:');
if (adminConfig.isValid) {
    console.log(`✅ Super Admin: ${adminConfig.config.superAdmin}`);
    console.log(`ℹ️  Admin Viewers: ${adminConfig.config.adminViewersCount} configured`);
} else {
    adminConfig.warnings.forEach(warning => console.log(warning));
}

// ── Security Headers (Helmet) ─────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: false, // Disabled to allow inline scripts in HTML pages
    crossOriginEmbedderPolicy: false
}));

// ── HTTP Request Logging (Morgan) ─────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── CORS Configuration ────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true
}));

// ── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── NoSQL Injection Sanitization ──────────────────────────────────────────
// Strips $ and . from user-supplied data to prevent MongoDB operator injection
app.use(mongoSanitize());

// ── Global Rate Limiting ──────────────────────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 300,                   // max 300 requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', globalLimiter);

// ── Strict Rate Limiting for Auth endpoints ────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 20,                    // max 20 auth attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Please wait 15 minutes and try again.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/resend-otp', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// ── Static File Serving ───────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/publications', publicationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);

// ── Health Check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        app: 'Faculty Publications Management System',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        features: {
            authentication: true,
            emailVerification: true,
            roleBasedAccess: true,
            activityLogging: true,
            aiChatbot: !!process.env.GROQ_API_KEY,
            emailService: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
        }
    });
});

// ── SPA Fallback (serve index.html for all non-API routes) ───────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Global Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
    // CORS errors
    if (err.message && err.message.startsWith('CORS:')) {
        return res.status(403).json({ message: err.message });
    }
    console.error('Server Error:', err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ResearchVault — Faculty Publications Management System  ║
║   Version 2.0.0  |  ${process.env.NODE_ENV || 'development'} mode                     ║
║                                                            ║
║   🚀 Server:    http://localhost:${PORT}                      ║
║   📡 API:       http://localhost:${PORT}/api                  ║
║   🔐 RBAC:      ENABLED                                    ║
║   🛡️  Security:  helmet + rate-limit + sanitize            ║
║   📧 Email OTP: ${process.env.EMAIL_USER ? '✅ Configured' : '⚠️  Not configured'}                    ║
║   🤖 AI:        ${process.env.GROQ_API_KEY ? '✅ Configured' : '⚠️  Not configured'}                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});

// ── Crash Guards — keep server alive on unexpected errors ─────────────────
process.on('uncaughtException', (err) => {
    console.error('\n🔴 Uncaught Exception — server staying alive:');
    console.error(err.stack || err);
});

process.on('unhandledRejection', (reason) => {
    console.error('\n🔴 Unhandled Promise Rejection — server staying alive:');
    console.error(reason);
});
