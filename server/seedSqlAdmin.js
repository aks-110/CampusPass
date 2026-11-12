const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const sequelize = require('./config/pg');
// Import models through associations to register all relations
const { User, Hostel } = require('./models/sql/associations');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');
const GateLog = require('./models/GateLog');
const { emailQueue } = require('./config/queue');

const seedSqlAdmin = async () => {
    try {
        console.log('[PostgreSQL] Syncing PostgreSQL schemas (dropping and re-creating tables)...');
        await sequelize.sync({ force: true });
        console.log('[PostgreSQL] Database schemas synchronized successfully.');

        // Seed Admin
        const adminEmail = 'admin@gmail.com';
        const adminPassword = 'admin123';
        await User.create({
            name: 'Super Admin',
            email: adminEmail,
            password: adminPassword, // will be hashed automatically by beforeSave hook
            role: 'Admin',
            status: 'Active'
        });

        console.log('[PostgreSQL] Admin user created successfully.');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);

        // Seed default hostels matching the Register page dropdown list exactly
        const hostels = [
            { name: 'Kailash Boys Hostel', capacity: 200 },
            { name: 'Himgiri Boys Hostel', capacity: 150 },
            { name: 'Udaygiri Boys Hostel', capacity: 200 },
            { name: 'Neelkanth Boys Hostel', capacity: 250 },
            { name: 'Dhauladhar Boys Hostel', capacity: 200 },
            { name: 'Vindhyachal Boys Hostel', capacity: 200 },
            { name: 'Shivalik Boys Hostel', capacity: 200 },
            { name: 'Ambika Girls Hostel', capacity: 150 },
            { name: 'Parvati Girls Hostel', capacity: 150 },
            { name: 'Mani-Mahesh Girls Hostel', capacity: 150 },
            { name: 'Aravali Girls Hostel', capacity: 150 },
            { name: 'Satpura Hostel', capacity: 200 }
        ];

        for (const h of hostels) {
            await Hostel.create(h);
        }
        console.log('[PostgreSQL] Seeded all 12 default hostels.');

        // Clean MongoDB data
        if (process.env.MONGO_URI) {
            console.log('[MongoDB] Connecting to MongoDB...');
            await mongoose.connect(process.env.MONGO_URI);
            console.log('[MongoDB] Connected.');

            const deletedNotifications = await Notification.deleteMany({});
            console.log(`[MongoDB] Deleted ${deletedNotifications.deletedCount} notifications.`);

            const deletedAuditLogs = await AuditLog.deleteMany({});
            console.log(`[MongoDB] Deleted ${deletedAuditLogs.deletedCount} audit logs.`);

            const deletedGateLogs = await GateLog.deleteMany({});
            console.log(`[MongoDB] Deleted ${deletedGateLogs.deletedCount} gate logs.`);

            // Also clear any legacy collections if present
            await mongoose.connection.db.collection('users').deleteMany({}).catch(() => {});
            await mongoose.connection.db.collection('students').deleteMany({}).catch(() => {});
            console.log('[MongoDB] All legacy collections cleared.');

            await mongoose.disconnect();
            console.log('[MongoDB] Disconnected.');
        }

        // Clean BullMQ Email Queue if connected
        try {
            console.log('[Redis/BullMQ] Draining email queue...');
            await emailQueue.drain();
            await emailQueue.clean(0, 1000, 'completed');
            await emailQueue.clean(0, 1000, 'failed');
            await emailQueue.close();
            console.log('[Redis/BullMQ] Email queue cleared.');
        } catch (queueErr) {
            console.warn('[Redis/BullMQ] Could not clear queue (non-fatal):', queueErr.message);
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        console.log('\n==============================================');
        console.log(' DATABASE RESET AND ADMIN SETUP COMPLETE');
        console.log('==============================================');
        console.log(`Admin Login URL:     ${frontendUrl}/login`);
        console.log(`Admin Dashboard URL: ${frontendUrl}/admin`);
        console.log(`Admin Email:         ${adminEmail}`);
        console.log(`Admin Password:      ${adminPassword}`);
        console.log('==============================================\n');

        process.exit(0);
    } catch (error) {
        console.error('[Error] Seeding failed:', error);
        process.exit(1);
    }
};

seedSqlAdmin();
