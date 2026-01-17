const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const publicationRoutes = require('./routes/publications');
const chatbotRoutes = require('./routes/chatbot');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');
const { validateAdminConfig } = require('./utils/roleChecker');

const app = express();

// Connect to MongoDB
connectDB();

// Validate admin configuration
const adminConfig = validateAdminConfig();
console.log('\n🔐 Role-Based Access Control Configuration:');
if (adminConfig.isValid) {
    console.log(`✅ Super Admin: ${adminConfig.config.superAdmin}`);
    console.log(`ℹ️  Admin Viewers: ${adminConfig.config.adminViewersCount} configured`);
} else {
    adminConfig.warnings.forEach(warning => console.log(warning));
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (profile pictures)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/publications', publicationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Faculty Publications Management System API is running',
        timestamp: new Date().toISOString(),
        features: {
            authentication: true,
            roleBasedAccess: true,
            activityLogging: true
        }
    });
});

// Serve frontend for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Faculty Publications Management System                  ║
║   Server running on port ${PORT}                              ║
║   🔐 Role-Based Access Control: ENABLED                    ║
║   📊 Activity Logging: ENABLED                             ║
║                                                            ║
║   API Endpoint: http://localhost:${PORT}/api                  ║
║   Frontend: http://localhost:${PORT}                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
