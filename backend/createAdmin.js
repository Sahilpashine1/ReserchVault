/**
 * One-time Admin Seed Script
 * Run with: node createAdmin.js
 * Creates the super_admin account in the database.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const ADMIN_EMAIL    = process.env.SUPER_ADMIN_EMAIL || 'admin@college.edu';
const ADMIN_PASSWORD = 'Admin@1234';   // ← change after first login
const ADMIN_NAME     = 'Super Admin';

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        const existing = await User.findOne({ email: ADMIN_EMAIL });
        if (existing) {
            console.log(`ℹ️  Admin user already exists: ${ADMIN_EMAIL}`);
            console.log(`   Role: ${existing.role}  |  Verified: ${existing.isVerified}`);
            // Make sure it is properly set up
            existing.role = 'super_admin';
            existing.isVerified = true;
            existing.isActive = true;
            await existing.save();
            console.log('✅ Admin account updated (role + verified flags fixed).');
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

            const admin = new User({
                name:           ADMIN_NAME,
                email:          ADMIN_EMAIL,
                password:       hashedPassword,
                role:           'super_admin',
                isVerified:     true,
                isActive:       true,
                createdByAdmin: true,
                department:     'Administration'
            });
            await admin.save();
            console.log('✅ Admin user created successfully!');
        }

        console.log('\n📋 Login Credentials:');
        console.log(`   Email   : ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log('\n⚠️  Please change the password after first login!\n');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed();
