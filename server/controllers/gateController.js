const sequelize = require('../config/pg');
const { GatePass, Student, User, Warden, Hostel } = require('../models/sql/associations');
const GateLog = require('../models/GateLog');
const redisClient = require('../config/redis');
const { Op } = require('sequelize');
const { emailQueue } = require('../config/queue');

exports.verifyPass = async (req, res) => {
    try {
        const { qrPayload, action } = req.body;
        if (!qrPayload) return res.status(400).json({ message: 'Missing QR Data' });

        let token = qrPayload;
        // If scanned payload is a URL, extract the token part
        if (qrPayload.startsWith('http://') || qrPayload.startsWith('https://')) {
            const urlParts = qrPayload.split('?token=');
            if (urlParts.length > 1) {
                token = urlParts[1];
            } else {
                const pathParts = qrPayload.split('/verify-pass/');
                if (pathParts.length > 1) {
                    token = pathParts[1];
                }
            }
        }

        let passId, signature;
        let isRollNumberVerify = false;
        let pass, studentProfile;

        if (!token.includes(':')) {
            // Treat as student roll number lookup
            isRollNumberVerify = true;
            studentProfile = await Student.findOne({
                where: { rollNumber: token },
                include: [{ model: Hostel, as: 'hostel', attributes: ['name'] }]
            });
            if (!studentProfile) {
                return res.status(404).json({ message: `No student profile found with Roll Number "${token}"` });
            }
            
            // Find active/approved/expired/overdue pass
            const activePass = await GatePass.findOne({
                where: {
                    studentId: studentProfile.userId,
                    status: { [Op.in]: ['Approved', 'Expired', 'Overdue'] }
                },
                include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'photo', 'role'] }]
            });
            if (!activePass) {
                return res.status(404).json({ message: `No active or approved gate pass found for Roll Number "${token}"` });
            }
            
            pass = activePass;
            passId = pass.id;
            signature = pass.qrToken; // Bypass forgery check by matching signature
        } else {
            const parts = token.split(':');
            if (parts.length < 2) {
                 return res.status(400).json({ message: 'Invalid QR Code: Format not recognized' });
            }
            passId = parts[0].trim();
            signature = parts[1].trim();
        }
        
        if (!isRollNumberVerify) {
            // Fast Redis Cache Lookup
            const cacheKey = `pass:cache:${passId}`;
            let cachedData = await redisClient.get(cacheKey);
            
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                pass = parsed.pass;
                studentProfile = parsed.studentProfile;
                console.log('[Redis] Served pass verification from cache');
            } else {
                // Cache Miss: Query SQL DB
                pass = await GatePass.findByPk(passId, {
                    include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'photo', 'role'] }]
                });
                if (!pass) return res.status(404).json({ message: 'Invalid Pass: Not found in database' });

                studentProfile = await Student.findOne({
                    where: { userId: pass.studentId },
                    include: [{ model: Hostel, as: 'hostel', attributes: ['name'] }]
                });
                
                if (studentProfile) {
                    // Save to cache for 1 hour
                    await redisClient.set(cacheKey, JSON.stringify({ pass, studentProfile }), { EX: 3600 });
                }
            }
        }

        if (!pass || !studentProfile) {
            return res.status(404).json({ message: 'Pass or Student Profile not found' });
        }

        if (signature !== pass.qrToken) {
            return res.status(403).json({ message: 'FORGERY DETECTED: Invalid digital signature' });
        }

        // Action-specific validations and Late Return check
        if (action === 'Exit') {
            if (pass.status !== 'Approved') {
                return res.status(400).json({ message: `Pass is currently ${pass.status}` });
            }
            if (new Date() > new Date(pass.returnDate)) {
                return res.status(400).json({ message: 'Pass has expired' });
            }
        } else if (action === 'Return') {
            // Allow returning even if marked Expired or Overdue
            if (!['Approved', 'Expired', 'Overdue'].includes(pass.status)) {
                return res.status(400).json({ message: `Pass is currently ${pass.status}` });
            }
            // Removed strict pass.exitTime check to allow syncing missed exit scans
        }

        // Location warnings
        let locationWarning = null;
        if (action === 'Exit' && studentProfile.currentLocation === 'Outside') {
            locationWarning = 'Missed previous entry scan. Location synced.';
        }
        if (action === 'Return' && (!pass.exitTime || studentProfile.currentLocation === 'Inside')) {
            locationWarning = 'Missed previous exit scan. Location synced.';
        }

        res.status(200).json({
            message: 'Pass Verified',
            warning: locationWarning,
            student: {
                id: pass.student.id,
                name: pass.student.name,
                photo: pass.student.photo,
                rollNumber: studentProfile.rollNumber,
                room: studentProfile.roomNo,
                hostel: studentProfile.hostel ? studentProfile.hostel.name : 'Unknown',
                idCard: studentProfile.idCard
            },
            passDetails: {
                id: pass.id,
                type: pass.purpose,
                destination: pass.destination,
                departureDate: pass.leaveDate,
                expectedReturn: pass.returnDate
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Verification error', error: error.message });
    }
};

exports.confirmPass = async (req, res) => {
    // Implement SQL Transaction
    const t = await sequelize.transaction();
    try {
        const { passId, action } = req.body;
        const pass = await GatePass.findByPk(passId, { transaction: t });
        
        if (!pass) {
            await t.rollback();
            return res.status(404).json({ message: 'Pass not found' });
        }
        
        const studentProfile = await Student.findOne({ 
            where: { userId: pass.studentId },
            transaction: t
        });

        if (!studentProfile) {
            await t.rollback();
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const studentUser = await User.findByPk(pass.studentId, { transaction: t });
        if (!studentUser) {
            await t.rollback();
            return res.status(404).json({ message: 'Student user details not found' });
        }

        if (action === 'Exit') {
            pass.exitTime = new Date();
            pass.exitGate = req.body.gateName || 'Main Gate Checkpoint';
            studentProfile.currentLocation = 'Outside';
        } else if (action === 'Return') {
            pass.entryTime = new Date();
            pass.entryGate = req.body.gateName || 'Main Gate Checkpoint';
            pass.status = 'Completed'; // Mark pass as completed
            studentProfile.currentLocation = 'Inside';
        }

        await pass.save({ transaction: t });
        await studentProfile.save({ transaction: t });

        // Commit transaction before logging and caching events
        await t.commit();

        // Queue SMTP Emails to both student and parents (async via BullMQ)
        const studentEmail = studentUser.email;
        const parentEmail = studentProfile.parentEmail;
        const studentName = studentUser.name;
        const parentName = studentProfile.parentName || 'Parent/Guardian';
        const gate = req.body.gateName || 'Main Gate Checkpoint';
        const timeStr = new Date().toLocaleString();
        
        const emailSubject = action === 'Exit' ? 'CampusPass Notification: Student Checked Out' : 'CampusPass Notification: Student Checked In';
        const actionText = action === 'Exit' ? 'checked out (exited)' : 'checked in (returned)';

        // Queue student notification email
        await emailQueue.add('sendMailJob', {
            to: studentEmail,
            subject: emailSubject,
            text: `Dear ${studentName},\n\nThis is to confirm that you successfully ${actionText} campus through the gate.\nGate: ${gate}\nTime: ${timeStr}\n\nRegards,\nCampusPass Admin`
        });

        // Queue parent notification email
        if (parentEmail) {
            await emailQueue.add('sendMailJob', {
                to: parentEmail,
                subject: emailSubject,
                text: `Dear ${parentName},\n\nThis is to notify you that your ward, ${studentName}, has successfully ${actionText} through the campus gate.\nGate: ${gate}\nTime: ${timeStr}\n\nRegards,\nCampusPass Admin`
            });
        }

        // Evict pass cache from Redis
        const cacheKey = `pass:cache:${passId}`;
        await redisClient.del(cacheKey);

        // Create Gate Log entry inside MongoDB
        await GateLog.create({
            pass: pass.id,
            student: pass.studentId,
            action,
            gateName: req.body.gateName || 'Main Gate Checkpoint',
            deviceId: req.body.deviceId || 'WEB_SCANNER_01',
            ipAddress: req.ip || req.connection.remoteAddress
        });

        if (req.io) {
            req.io.to(pass.studentId.toString()).emit('notification', {
                title: 'Gate Scan Successful',
                message: `Your ${action} scan was recorded.`
            });
            
            // Notify Warden
            const warden = await Warden.findOne({ where: { hostelId: studentProfile.hostelId } });
            if (warden) {
                req.io.to(warden.userId.toString()).emit('notification', {
                    title: 'Student Movement',
                    message: `A student from your hostel scanned ${action}.`
                });
            }
        }

        res.status(200).json({ message: `Successfully logged ${action}` });
    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error confirming scan', error: error.message });
    }
};

exports.logEmergencyPass = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { rollNumber, purpose, destination, expectedReturnDate } = req.body;
        const studentProfile = await Student.findOne({ 
            where: { rollNumber },
            include: [{ model: User, as: 'user' }],
            transaction: t
        });
        
        if (!studentProfile || !studentProfile.user) {
            await t.rollback();
            return res.status(404).json({ message: 'Student profile not found for this roll number.' });
        }

        const pass = await GatePass.create({
            studentId: studentProfile.userId,
            purpose: purpose || 'Emergency Exit',
            destination: destination || 'Emergency Destination',
            leaveDate: new Date(),
            returnDate: expectedReturnDate || new Date(Date.now() + 4 * 60 * 60 * 1000), // Default 4 hrs
            status: 'Approved',
            exitTime: new Date(),
            exitGate: req.body.gateName || 'Main Gate Checkpoint (Emergency)'
        }, { transaction: t });

        studentProfile.currentLocation = 'Outside';
        await studentProfile.save({ transaction: t });

        await t.commit();

        // Create log in MongoDB
        await GateLog.create({
            pass: pass.id,
            student: studentProfile.userId,
            action: 'Exit',
            gateName: req.body.gateName || 'Main Gate Checkpoint (Emergency)',
            deviceId: 'WEB_SCANNER_EMERGENCY',
            ipAddress: req.ip || req.connection.remoteAddress
        });

        if (req.io) {
            req.io.to(studentProfile.userId.toString()).emit('notification', {
                title: 'Emergency Exit Logged',
                message: `An emergency exit was logged by Main Gate Security.`
            });
        }

        res.status(201).json({ message: 'Emergency exit logged successfully', pass });
    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error logging emergency exit', error: error.message });
    }
};

exports.getGateLogs = async (req, res) => {
    try {
        const { action } = req.query; 
        let query = {};
        if (action) query.action = action;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query.scanTime = { $gte: today };

        const logs = await GateLog.find(query).sort({ scanTime: -1 });

        const formattedLogs = await Promise.all(logs.map(async (l) => {
            if (!l.student) return null;
            
            const studentUser = await User.findByPk(l.student);
            if (!studentUser) return null;
            
            const studentProfile = await Student.findOne({ 
                where: { userId: l.student },
                include: [{ model: Hostel, as: 'hostel', attributes: ['name'] }]
            });
            
            const pass = await GatePass.findByPk(l.pass);

            return {
                _id: l._id,
                scanTime: l.scanTime,
                gateName: l.gateName,
                action: l.action,
                student: {
                    name: studentUser.name,
                    email: studentUser.email,
                    rollNumber: studentProfile ? studentProfile.rollNumber : 'N/A',
                    roomNo: studentProfile ? studentProfile.roomNo : 'N/A',
                    hostel: studentProfile && studentProfile.hostel ? studentProfile.hostel.name : 'N/A'
                },
                pass: pass ? {
                    purpose: pass.purpose,
                    destination: pass.destination,
                } : null
            };
        }));

        res.status(200).json(formattedLogs.filter(Boolean));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.searchStudent = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: 'Query parameter q is required' });

        // 1. Search Student model by roll number (PostgreSQL case-insensitive ilike)
        let studentProfile = await Student.findOne({ 
            where: { rollNumber: { [Op.iLike]: `%${q}%` } },
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'email', 'photo', 'status', 'phone'] },
                { model: Hostel, as: 'hostel', attributes: ['name'] }
            ]
        });

        // 2. Fallback: Search User model by name or email
        if (!studentProfile) {
            const user = await User.findOne({
                where: {
                    role: 'Student',
                    [Op.or]: [
                        { name: { [Op.iLike]: `%${q}%` } },
                        { email: { [Op.iLike]: `%${q}%` } }
                    ]
                }
            });
            if (user) {
                studentProfile = await Student.findOne({ 
                    where: { userId: user.id },
                    include: [
                        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'photo', 'status', 'phone'] },
                        { model: Hostel, as: 'hostel', attributes: ['name'] }
                    ]
                });
            }
        }

        if (!studentProfile || !studentProfile.user) {
            return res.status(404).json({ message: 'No student found matching query.' });
        }

        const studentInfo = {
            _id: studentProfile.user.id,
            name: studentProfile.user.name,
            email: studentProfile.user.email,
            photo: studentProfile.user.photo,
            status: studentProfile.user.status,
            rollNumber: studentProfile.rollNumber,
            room: studentProfile.roomNo,
            hostel: studentProfile.hostel ? studentProfile.hostel.name : 'Unknown',
            phone: studentProfile.user.phone,
            branch: studentProfile.branch,
            year: studentProfile.year,
            currentLocation: studentProfile.currentLocation
        };

        // Fetch passes
        const studentPasses = await GatePass.findAll({
            where: { studentId: studentProfile.user.id },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ student: studentInfo, passes: studentPasses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Search error', error: error.message });
    }
};
