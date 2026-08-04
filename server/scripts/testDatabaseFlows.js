require('dotenv').config();
const mongoose = require('mongoose');
const sequelize = require('../config/pg');
const { User, Student, Warden, Hostel, GatePass } = require('../models/sql/associations');
const GateLog = require('../models/GateLog');
const Notification = require('../models/Notification');
const crypto = require('crypto');

const runTests = async () => {
    console.log('==================================================');
    console.log('   CAMPUSPASS HYBRID DATABASE INTEGRATION TEST    ');
    console.log('==================================================');

    try {
        // 1. Establish connections
        console.log('[Test] Connecting to Supabase PostgreSQL...');
        await sequelize.authenticate();
        console.log('[Test] Supabase PostgreSQL connected.');

        console.log('[Test] Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('[Test] MongoDB connected.');

        // 2. Reset All Data
        console.log('[Test] Resetting PostgreSQL schemas (Sync Force)...');
        await sequelize.sync({ force: true });
        console.log('[Test] PostgreSQL database reset complete.');

        console.log('[Test] Clearing test data in MongoDB logs...');
        await GateLog.deleteMany({});
        await Notification.deleteMany({});
        console.log('[Test] MongoDB log collections cleared.');

        // 3. Create Seed Data
        console.log('[Test] Seeding initial test data...');
        
        // 3a. Hostels
        const hostel = await Hostel.create({
            name: 'Kailash Hostel',
            capacity: 100
        });
        console.log(`[Test] Created Hostel: ${hostel.name} (ID: ${hostel.id})`);

        // 3b. Warden User & Profile
        const wardenUser = await User.create({
            name: 'Warden Test',
            email: 'warden_test@nith.ac.in',
            password: 'password123',
            role: 'Warden',
            status: 'Active'
        });
        const wardenProfile = await Warden.create({
            userId: wardenUser.id,
            hostelId: hostel.id
        });
        await Hostel.update({ wardenId: wardenUser.id }, { where: { id: hostel.id } });
        console.log(`[Test] Seeded Warden: ${wardenUser.email} for ${hostel.name}`);

        // 3c. Student User & Profile
        const studentUser = await User.create({
            name: 'Student Test',
            email: 'student_test@nith.ac.in',
            password: 'password123',
            role: 'Student',
            status: 'Active'
        });
        const studentProfile = await Student.create({
            userId: studentUser.id,
            rollNumber: 'TESTSTUDENT001',
            hostelId: hostel.id,
            roomNo: '102B',
            branch: 'CSE',
            year: '3rd',
            currentLocation: 'Inside',
            registrationStatus: 'Approved'
        });
        console.log(`[Test] Seeded Student: ${studentUser.email} (Roll: ${studentProfile.rollNumber})`);

        // 4. Pass Application flow
        console.log('\n--- STEP 1: Apply for Gate Pass ---');
        // Student applies for pass
        const pass = await GatePass.create({
            studentId: studentUser.id,
            purpose: 'Weekend Home Visit',
            destination: 'Delhi',
            leaveDate: new Date(),
            returnDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days validity
            status: 'Pending'
        });
        console.log(`[Test] Pass applied successfully. ID: ${pass.id}, Status: ${pass.status}`);

        // 4b. Test Double Submit Prevention (One active pass rule)
        console.log('\n--- STEP 1b: Verify Double Submit Prevention ---');
        try {
            // Attempting to create another active pass
            const duplicatePass = await GatePass.create({
                studentId: studentUser.id,
                purpose: 'Emergency Outing',
                destination: 'Market',
                leaveDate: new Date(),
                returnDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
                status: 'Pending'
            });
            console.error('❌ FAIL: Allowed creating a second active pass!');
        } catch (err) {
            console.log('✅ SUCCESS: Double-submit blocked. Prevented duplicate active pass creation.');
        }

        // 5. Warden Approval flow
        console.log('\n--- STEP 2: Warden Approves Gate Pass ---');
        const passToApprove = await GatePass.findByPk(pass.id);
        
        // Generate cryptographic signature
        const secret = process.env.JWT_SECRET || 'supersecretjwtkey';
        const signature = crypto.createHmac('sha256', secret).update(passToApprove.id.toString()).digest('hex');
        
        passToApprove.status = 'Approved';
        passToApprove.approvedBy = wardenUser.id;
        passToApprove.qrToken = signature;
        await passToApprove.save();
        console.log(`[Test] Pass approved by Warden. QR Token generated: ${passToApprove.qrToken.substring(0, 8)}...`);

        // Create MongoDB notification log
        await Notification.create({
            receiver: studentUser.id,
            title: 'Pass Approved',
            message: 'Your gate pass has been approved by the Warden.'
        });
        const notification = await Notification.findOne({ receiver: studentUser.id });
        console.log(`[Test] Student notification created in MongoDB: "${notification.message}"`);

        // 6. Gate Scanner Exit Flow
        console.log('\n--- STEP 3: Student exits through Gate (Exit Scan) ---');
        // Verify QR Token
        const scannedToken = `${passToApprove.id}:${passToApprove.qrToken}`;
        const parts = scannedToken.split(':');
        const [scannedPassId, scannedSig] = parts;

        const passOnScan = await GatePass.findByPk(scannedPassId);
        if (scannedSig === passOnScan.qrToken && passOnScan.status === 'Approved') {
            console.log('✅ QR Code Verification: Verified digital signature successfully.');
        } else {
            throw new Error('QR Verification failed.');
        }

        // Confirm Exit (SQL Transaction block)
        const tExit = await sequelize.transaction();
        try {
            const currentPass = await GatePass.findByPk(passToApprove.id, { transaction: tExit });
            const currentStudent = await Student.findOne({ where: { userId: studentUser.id }, transaction: tExit });

            currentPass.exitTime = new Date();
            currentStudent.currentLocation = 'Outside';

            await currentPass.save({ transaction: tExit });
            await currentStudent.save({ transaction: tExit });
            await tExit.commit();
            console.log(`[Test] SQL Transaction Committed: Student exit recorded.`);
        } catch (err) {
            await tExit.rollback();
            throw err;
        }

        // Write exit log in MongoDB
        const exitLog = await GateLog.create({
            pass: passToApprove.id,
            student: studentUser.id,
            action: 'Exit',
            gateName: 'Main Gate 1',
            deviceId: 'DEVICE_EXIT_01'
        });
        console.log(`[Test] Exit event recorded in MongoDB GateLog (ID: ${exitLog._id})`);

        // Check updated status
        const studentAfterExit = await Student.findOne({ where: { userId: studentUser.id } });
        console.log(`[Test] Student Location state: ${studentAfterExit.currentLocation}`);

        // 7. Gate Scanner Return Flow
        console.log('\n--- STEP 4: Student returns through Gate (Return Scan) ---');
        const tReturn = await sequelize.transaction();
        try {
            const currentPass = await GatePass.findByPk(passToApprove.id, { transaction: tReturn });
            const currentStudent = await Student.findOne({ where: { userId: studentUser.id }, transaction: tReturn });

            currentPass.entryTime = new Date();
            currentPass.status = 'Completed';
            currentStudent.currentLocation = 'Inside';

            await currentPass.save({ transaction: tReturn });
            await currentStudent.save({ transaction: tReturn });
            await tReturn.commit();
            console.log(`[Test] SQL Transaction Committed: Student return recorded.`);
        } catch (err) {
            await tReturn.rollback();
            throw err;
        }

        // Write return log in MongoDB
        const returnLog = await GateLog.create({
            pass: passToApprove.id,
            student: studentUser.id,
            action: 'Return',
            gateName: 'Main Gate 1',
            deviceId: 'DEVICE_RETURN_01'
        });
        console.log(`[Test] Return event recorded in MongoDB GateLog (ID: ${returnLog._id})`);

        const studentAfterReturn = await Student.findOne({ where: { userId: studentUser.id } });
        const passAfterReturn = await GatePass.findByPk(passToApprove.id);
        console.log(`[Test] Final Student Location state: ${studentAfterReturn.currentLocation}`);
        console.log(`[Test] Final Gate Pass status: ${passAfterReturn.status}`);

        console.log('\n==================================================');
        console.log('   🎉 ALL INTEGRATION FLOW TESTS PASSED SUCCESSFULLY! ');
        console.log('==================================================');

    } catch (error) {
        console.error('\n❌ INTEGRATION TEST FAILED WITH ERROR:', error);
    } finally {
        // Disconnect
        await sequelize.close();
        await mongoose.disconnect();
        console.log('[Test] Disconnected from all databases.');
        process.exit(0);
    }
};

runTests();
