require('dotenv').config();
const sequelize = require('./config/pg');
// Import models through associations to register all relations
const { User, Hostel } = require('./models/sql/associations');

const seedSqlAdmin = async () => {
    try {
        console.log('[Supabase] Syncing PostgreSQL schemas (re-creating tables)...');
        await sequelize.sync({ force: true });
        console.log('[Supabase] Database schemas synchronized successfully.');

        // Seed Admin
        const adminEmail = 'aksfromup93@gmail.com';
        await User.create({
            name: 'Super Admin',
            email: adminEmail,
            password: '1234567890', // will be hashed automatically by beforeSave hook
            role: 'Admin',
            status: 'Active'
        });

        console.log('[Supabase] Admin user seeded successfully.');
        console.log(`Email: ${adminEmail}`);
        console.log('Password: 1234567890');

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
        console.log('[Supabase] Seeded all 12 default hostels.');

        process.exit(0);
    } catch (error) {
        console.error('[Supabase] Error seeding SQL database:', error);
        process.exit(1);
    }
};

seedSqlAdmin();
