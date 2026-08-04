require('dotenv').config();
const { User, Student, Warden, Hostel } = require('../models/sql/associations');

const seedBrowserData = async () => {
    try {
        console.log('[Supabase] Seeding browser test accounts...');
        
        // Find or create hostel
        let hostel = await Hostel.findOne({ where: { name: 'Kailash Boys Hostel' } });
        if (!hostel) {
            hostel = await Hostel.create({ name: 'Kailash Boys Hostel', capacity: 150 });
        }

        // 1. Seed Warden: Pending
        await User.destroy({ where: { email: 'warden_browser@nith.ac.in' } });
        const wardenUser = await User.create({
            name: 'Warden Browser Test',
            email: 'warden_browser@nith.ac.in',
            password: '1234567890',
            role: 'Warden',
            status: 'Pending'
        });
        await Warden.create({ userId: wardenUser.id, hostelId: hostel.id });
        console.log('✅ Seeded Warden Browser Test User.');

        // 2. Seed Guard: Pending
        await User.destroy({ where: { email: 'guard_browser@nith.ac.in' } });
        await User.create({
            name: 'Guard Browser Test',
            email: 'guard_browser@nith.ac.in',
            password: '1234567890',
            role: 'Main Gate',
            status: 'Pending'
        });
        console.log('✅ Seeded Guard Browser Test User.');

        // 3. Seed Student: Pending
        await User.destroy({ where: { email: 'student_browser@nith.ac.in' } });
        const studentUser = await User.create({
            name: 'Student Browser Test',
            email: 'student_browser@nith.ac.in',
            password: '1234567890',
            role: 'Student',
            status: 'Pending'
        });
        await Student.create({
            userId: studentUser.id,
            rollNumber: 'BROWSERSTUDENT001',
            hostelId: hostel.id,
            roomNo: '101A',
            branch: 'ECE',
            year: '4th',
            gender: 'Male',
            registrationStatus: 'Pending',
            currentLocation: 'Inside'
        });
        console.log('✅ Seeded Student Browser Test User.');

        console.log('[Supabase] Seeding browser test accounts complete.');
        process.exit(0);
    } catch (error) {
        console.error('[Supabase] Seeding browser data failed:', error);
        process.exit(1);
    }
};

seedBrowserData();
