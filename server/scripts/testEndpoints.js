require('dotenv').config();
const mongoose = require('mongoose');
const sequelize = require('../config/pg');
const { User, Hostel, Student, Warden } = require('../models/sql/associations');

const baseUrl = 'http://localhost:5000/api';

const runApiTests = async () => {
    console.log('================================================================');
    console.log('    CAMPUSPASS FULL API ENDPOINT END-TO-END VERIFICATION TEST    ');
    console.log('================================================================\n');

    try {
        // 1. Reset all data
        console.log('[Setup] Connecting databases...');
        await sequelize.authenticate();
        await mongoose.connect(process.env.MONGO_URI);

        console.log('[Setup] Dropping MongoDB database...');
        await mongoose.connection.db.dropDatabase();
        console.log('[Setup] MongoDB database dropped.');

        console.log('[Setup] Syncing Supabase PostgreSQL (Sync Force)...');
        await sequelize.sync({ force: true });
        console.log('[Setup] Supabase PostgreSQL tables re-created.');

        // 2. Seed Initial Pending Users & Hostels
        console.log('\n[Setup] Seeding initial test data directly in DB...');
        
        const hostel = await Hostel.create({ name: 'Kailash Hostel', capacity: 150 });
        
        // Admin: active on seed
        const adminUser = await User.create({
            name: 'System Admin',
            email: 'admin_test@nith.ac.in',
            password: '1234567890',
            role: 'Admin',
            status: 'Active'
        });

        // Warden: starts as Pending
        const wardenUser = await User.create({
            name: 'Warden Test',
            email: 'warden_test@nith.ac.in',
            password: '1234567890',
            role: 'Warden',
            status: 'Pending'
        });
        await Warden.create({ userId: wardenUser.id, hostelId: hostel.id });

        // Guard: starts as Pending
        const guardUser = await User.create({
            name: 'Guard Test',
            email: 'guard_test@nith.ac.in',
            password: '1234567890',
            role: 'Main Gate',
            status: 'Pending'
        });

        // Student: starts as Pending
        const studentUser = await User.create({
            name: 'Student Test',
            email: 'student_test@nith.ac.in',
            password: '1234567890',
            role: 'Student',
            status: 'Pending'
        });
        await Student.create({
            userId: studentUser.id,
            rollNumber: 'TESTSTUDENT999',
            hostelId: hostel.id,
            roomNo: '101',
            registrationStatus: 'Pending',
            currentLocation: 'Inside'
        });

        console.log('✅ Seed complete. Ready to run API requests.');

        // --- HTTP FLOW TESTING ---

        // Helper fetch wrapper
        const apiRequest = async (path, method = 'GET', body = null, token = null) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const options = {
                method,
                headers,
            };
            if (body) options.body = JSON.stringify(body);

            const response = await fetch(`${baseUrl}${path}`, options);
            const data = await response.json();
            return { status: response.status, data };
        };

        // Step 1: Admin Login
        console.log('\n--- Step 1: Admin Login ---');
        const loginRes = await apiRequest('/auth/login', 'POST', {
            identifier: 'admin_test@nith.ac.in',
            password: '1234567890'
        });
        if (loginRes.status !== 200) throw new Error(`Admin login failed: ${JSON.stringify(loginRes.data)}`);
        const adminToken = loginRes.data.accessToken;
        console.log(`✅ Admin logged in. Token acquired: ${adminToken.substring(0, 15)}...`);

        // Step 2: Admin approves Warden and Guard
        console.log('\n--- Step 2: Admin Approves Warden & Gate Guard ---');
        const approveWardenRes = await apiRequest(`/admin/users/${wardenUser.id}/approve`, 'PUT', null, adminToken);
        if (approveWardenRes.status !== 200) throw new Error('Failed to approve Warden');
        console.log('✅ Warden approved by Admin.');

        const approveGuardRes = await apiRequest(`/admin/users/${guardUser.id}/approve`, 'PUT', null, adminToken);
        if (approveGuardRes.status !== 200) throw new Error('Failed to approve Gate Guard');
        console.log('✅ Gate Guard approved by Admin.');

        // Step 3: Warden Login & Student Registration Approval
        console.log('\n--- Step 3: Warden Logins & Approves Student ---');
        const wardenLoginRes = await apiRequest('/auth/login', 'POST', {
            identifier: 'warden_test@nith.ac.in',
            password: '1234567890'
        });
        if (wardenLoginRes.status !== 200) throw new Error('Warden login failed');
        const wardenToken = wardenLoginRes.data.accessToken;
        console.log(`✅ Warden logged in. Token: ${wardenToken.substring(0, 15)}...`);

        const approveStudentRes = await apiRequest(`/admin/users/${studentUser.id}/approve`, 'PUT', null, wardenToken);
        if (approveStudentRes.status !== 200) throw new Error('Failed to approve Student');
        console.log('✅ Student registration approved by Warden.');

        // Step 4: Student Logins & Applies for Pass
        console.log('\n--- Step 4: Student Logins & Applies for Gate Pass ---');
        const studentLoginRes = await apiRequest('/auth/login', 'POST', {
            identifier: 'student_test@nith.ac.in',
            password: '1234567890'
        });
        if (studentLoginRes.status !== 200) throw new Error('Student login failed');
        const studentToken = studentLoginRes.data.accessToken;
        console.log(`✅ Student logged in. Token: ${studentToken.substring(0, 15)}...`);

        // Apply for pass
        const applyPassRes = await apiRequest('/pass/apply', 'POST', {
            passType: 'Outing',
            destination: 'Market',
            reason: 'Emergency Purchase',
            departureDate: new Date(),
            expectedReturnDate: new Date(Date.now() + 4 * 60 * 60 * 1000)
        }, studentToken);
        if (applyPassRes.status !== 201) throw new Error('Failed to apply for pass');
        const passId = applyPassRes.data.pass.id;
        console.log(`✅ Pass applied successfully. Pass ID: ${passId}`);

        // Step 5: Double Submit check
        console.log('\n--- Step 5: Test Double Submit Block ---');
        const doubleSubmitRes = await apiRequest('/pass/apply', 'POST', {
            passType: 'Outing',
            destination: 'Hospital',
            reason: 'Medical checkup',
            departureDate: new Date(),
            expectedReturnDate: new Date(Date.now() + 2 * 60 * 60 * 1000)
        }, studentToken);
        
        if (doubleSubmitRes.status === 400 || doubleSubmitRes.status === 429) {
            console.log(`✅ Success: Double-submit blocked. Status returned: ${doubleSubmitRes.status} (Msg: "${doubleSubmitRes.data.message}")`);
        } else {
            throw new Error(`FAIL: Allowed duplicate active pass! Status: ${doubleSubmitRes.status}`);
        }

        // Step 6: Warden Approves Gate Pass
        console.log('\n--- Step 6: Warden Approves Student Gate Pass ---');
        const approvePassRes = await apiRequest(`/pass/${passId}/approve`, 'PUT', { remarks: 'Approved for outing' }, wardenToken);
        if (approvePassRes.status !== 200) throw new Error('Failed to approve Gate Pass');
        const qrToken = approvePassRes.data.pass.qrToken;
        console.log(`✅ Gate Pass approved. QR Signature Token: ${qrToken.substring(0, 15)}...`);

        // Step 7: Gate Guard Logins & Scans QR (Exit Scan)
        console.log('\n--- Step 7: Guard Login & QR Exit Scan Verification ---');
        const guardLoginRes = await apiRequest('/auth/login', 'POST', {
            identifier: 'guard_test@nith.ac.in',
            password: '1234567890'
        });
        if (guardLoginRes.status !== 200) throw new Error('Gate Guard login failed');
        const guardToken = guardLoginRes.data.accessToken;
        console.log(`✅ Gate Guard logged in. Token: ${guardToken.substring(0, 15)}...`);

        // Verify pass
        const qrPayload = `${passId}:${qrToken}`;
        const verifyRes = await apiRequest('/gate/verify', 'POST', { qrPayload, action: 'Exit' }, guardToken);
        if (verifyRes.status !== 200) throw new Error('Failed to verify QR scan');
        console.log('✅ QR verification succeeded. Student info returned:', JSON.stringify(verifyRes.data.student));

        // Confirm Exit
        const confirmExitRes = await apiRequest('/gate/confirm', 'POST', { passId, action: 'Exit', gateName: 'Main Checkpoint 1' }, guardToken);
        if (confirmExitRes.status !== 200) throw new Error('Failed to confirm Exit scan');
        console.log('✅ Student exit confirmed by Guard.');

        // Step 8: Verify Location State (Should be Outside)
        console.log('\n--- Step 8: Verify Student Location Is Outside ---');
        const checkStudentRes = await apiRequest('/gate/search-student?q=TESTSTUDENT999', 'GET', null, guardToken);
        const currentLocation = checkStudentRes.data.student.currentLocation;
        if (currentLocation === 'Outside') {
            console.log('✅ Success: Student is recorded as "Outside".');
        } else {
            throw new Error(`FAIL: Location mismatch. Current location: ${currentLocation}`);
        }

        // Step 9: Gate Guard Scans QR (Return Scan)
        console.log('\n--- Step 9: Student returns through Gate (Return Scan) ---');
        const verifyReturnRes = await apiRequest('/gate/verify', 'POST', { qrPayload, action: 'Return' }, guardToken);
        if (verifyReturnRes.status !== 200) throw new Error('Failed to verify Return scan');
        console.log('✅ Return QR verification succeeded.');

        const confirmReturnRes = await apiRequest('/gate/confirm', 'POST', { passId, action: 'Return', gateName: 'Main Checkpoint 1' }, guardToken);
        if (confirmReturnRes.status !== 200) throw new Error('Failed to confirm Return scan');
        console.log('✅ Student return confirmed by Guard.');

        // Step 10: Verify Final Location State (Should be Inside & Completed)
        console.log('\n--- Step 10: Verify Final Student Location & Pass State ---');
        const checkStudentFinalRes = await apiRequest('/gate/search-student?q=TESTSTUDENT999', 'GET', null, guardToken);
        const finalLocation = checkStudentFinalRes.data.student.currentLocation;
        const passStatus = checkStudentFinalRes.data.passes[0].status;
        
        if (finalLocation === 'Inside' && passStatus === 'Completed') {
            console.log('✅ Success: Student is recorded as "Inside". Pass status is "Completed".');
        } else {
            throw new Error(`FAIL: Mismatch. Location: ${finalLocation}, Pass Status: ${passStatus}`);
        }

        console.log('\n================================================================');
        console.log('    🎉 ALL ENDPOINT FLOW TESTS COMPLETED SUCCESSFULLY! (100% OK) ');
        console.log('================================================================');

    } catch (error) {
        console.error('\n❌ API ENDPOINT TEST FAILED:', error.message);
    } finally {
        await sequelize.close();
        await mongoose.disconnect();
        process.exit(0);
    }
};

runApiTests();
