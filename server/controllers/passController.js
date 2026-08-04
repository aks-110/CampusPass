const { GatePass, Student, Warden, User, Hostel } = require('../models/sql/associations');
const Notification = require('../models/Notification');
const { Op } = require('sequelize');
const crypto = require('crypto');
const redisClient = require('../config/redis');
const { emailQueue } = require('../config/queue');

exports.applyPass = async (req, res) => {
    // Implement Redis Distributed Lock to prevent double submits
    const lockKey = `lock:applyPass:${req.user.id}`;
    let lockAcquired = false;
    try {
        // Try to set key with EX (expire) 2 seconds, NX (set if not exists)
        const reply = await redisClient.set(lockKey, 'locked', { NX: true, EX: 2 });
        if (!reply) {
            return res.status(429).json({ message: 'A request is already in progress. Please wait.' });
        }
        lockAcquired = true;

        const { passType, reason, destination, departureDate, expectedReturnDate } = req.body;
        
        // Rule: Students with suspended accounts cannot request passes
        const user = await User.findByPk(req.user.id);
        if (!user || user.status === 'Suspended') {
            return res.status(403).json({ message: 'Your account is suspended. You cannot request a pass.' });
        }

        const studentProfile = await Student.findOne({ where: { userId: req.user.id } });
        if (!studentProfile || studentProfile.registrationStatus !== 'Approved') {
            return res.status(403).json({ message: 'Only approved students can apply for passes' });
        }

        // Rule: Only one active gate pass per student
        const activePass = await GatePass.findOne({ 
            where: {
                studentId: req.user.id, 
                status: { [Op.in]: ['Pending', 'Approved'] } 
            }
        });
        
        if (activePass) {
            return res.status(400).json({ message: 'You already have an active or pending gate pass.' });
        }

        const pass = await GatePass.create({
            studentId: req.user.id,
            purpose: passType || reason,
            destination,
            leaveDate: departureDate,
            returnDate: expectedReturnDate,
            status: 'Pending'
        });

        const passJson = pass.toJSON();
        passJson._id = passJson.id;

        res.status(201).json({ message: 'Pass application submitted successfully', pass: passJson });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        if (lockAcquired) {
            await redisClient.del(lockKey);
        }
    }
};

exports.getPasses = async (req, res) => {
    try {
        let passes = [];
        if (req.user.role === 'Student') {
            const rawPasses = await GatePass.findAll({ 
                where: { studentId: req.user.id }, 
                order: [['createdAt', 'DESC']] 
            });
            passes = rawPasses.map(pass => {
                const passObj = pass.toJSON();
                passObj._id = passObj.id;
                return passObj;
            });
        } else if (req.user.role === 'Warden') {
            const wardenProfile = await Warden.findOne({ where: { userId: req.user.id } });
            if (wardenProfile && wardenProfile.hostelId) {
                const studentsInHostel = await Student.findAll({ 
                    where: { hostelId: wardenProfile.hostelId },
                    include: [{ model: Hostel, as: 'hostel', attributes: ['name'] }]
                });
                
                const studentIds = studentsInHostel.map(s => s.userId);
                
                const rawPasses = await GatePass.findAll({
                    where: { studentId: { [Op.in]: studentIds } },
                    include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'phone', 'photo'] }],
                    order: [['createdAt', 'DESC']]
                });

                passes = rawPasses.map((pass) => {
                    const passObj = pass.toJSON();
                    passObj._id = passObj.id;
                    passObj.studentId = passObj.student; // Populate studentId with User object
                    const student = studentsInHostel.find(s => s.userId === pass.studentId);
                    if (student) {
                        passObj.studentProfile = {
                            ...student.toJSON(),
                            hostel: student.hostel ? student.hostel.name : 'Unknown'
                        };
                    }
                    return passObj;
                });
            }
        } else if (req.user.role === 'Admin') {
            const rawPasses = await GatePass.findAll({
                include: [{ model: User, as: 'student', attributes: ['name', 'email'] }],
                order: [['createdAt', 'DESC']]
            });
            passes = rawPasses.map(pass => {
                const passObj = pass.toJSON();
                passObj._id = passObj.id;
                passObj.studentId = passObj.student;
                return passObj;
            });
        }
        
        res.status(200).json(passes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.approvePass = async (req, res) => {
    try {
        const { passId } = req.params;
        const { remarks } = req.body;

        const pass = await GatePass.findByPk(passId, {
            include: [{ model: User, as: 'student' }]
        });
        if (!pass) return res.status(404).json({ message: 'Pass not found' });
        if (pass.status !== 'Pending') return res.status(400).json({ message: 'Pass is not pending' });

        // Rule: Warden can approve only students from their assigned hostel
        if (req.user.role === 'Warden') {
            const warden = await Warden.findOne({ where: { userId: req.user.id } });
            const student = await Student.findOne({ where: { userId: pass.studentId } });
            
            if (!warden || !student || warden.hostelId !== student.hostelId) {
                return res.status(403).json({ message: 'You can only approve passes for students in your assigned hostel.' });
            }
        }

        pass.status = 'Approved';
        pass.approvedBy = req.user.id;
        
        // Generate cryptographic QR signature (PassID:Secret)
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        const signature = crypto.createHmac('sha256', secret).update(pass.id.toString()).digest('hex');
        pass.qrToken = signature;

        await pass.save();

        // Save Notification inside MongoDB
        await Notification.create({
            receiver: pass.studentId,
            title: 'Pass Approved',
            message: `Your pass to ${pass.destination || 'leave'} has been approved!`
        });

        // Real-time notification over WebSockets
        if (req.io) {
            req.io.to(pass.studentId).emit('notification', {
                title: 'Pass Approved',
                message: `Your pass to ${pass.destination || 'leave'} has been approved!`
            });
        }

        const passJson = pass.toJSON();
        passJson._id = passJson.id;
        passJson.studentId = passJson.student;

        res.status(200).json({ message: 'Pass approved successfully', pass: passJson });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.rejectPass = async (req, res) => {
    try {
        const { passId } = req.params;
        const { remarks } = req.body;

        const pass = await GatePass.findByPk(passId, {
            include: [{ model: User, as: 'student' }]
        });
        if (!pass) return res.status(404).json({ message: 'Pass not found' });
        if (pass.status !== 'Pending') return res.status(400).json({ message: 'Pass is not pending' });

        pass.status = 'Rejected';
        pass.approvedBy = req.user.id;
        await pass.save();

        // Save Notification in MongoDB
        await Notification.create({
            receiver: pass.studentId,
            title: 'Pass Rejected',
            message: `Your pass request was rejected. Reason: ${remarks}`
        });

        if (req.io) {
            req.io.to(pass.studentId).emit('notification', {
                title: 'Pass Rejected',
                message: `Your pass request was rejected. Reason: ${remarks}`
            });
        }

        const passJson = pass.toJSON();
        passJson._id = passJson.id;
        passJson.studentId = passJson.student;

        res.status(200).json({ message: 'Pass rejected successfully', pass: passJson });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deletePass = async (req, res) => {
    try {
        const { passId } = req.params;
        const pass = await GatePass.findByPk(passId);

        if (!pass) {
            return res.status(404).json({ message: 'Pass not found' });
        }

        // Rule: Only the student who applied for the pass or Admin can delete it
        if (pass.studentId !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to delete this pass' });
        }

        const originalStatus = pass.status;
        const studentUserId = pass.studentId;

        // Perform deletion in SQL
        await GatePass.destroy({ where: { id: passId } });

        // Evict pass cache from Redis
        const cacheKey = `pass:cache:${passId}`;
        await redisClient.del(cacheKey);

        // If the pass was pending review or approved, alert the Warden via socket to remove it in real-time
        if (['Pending', 'Approved'].includes(originalStatus) && req.io) {
            const studentProfile = await Student.findOne({ where: { userId: studentUserId } });
            if (studentProfile && studentProfile.hostelId) {
                const warden = await Warden.findOne({ where: { hostelId: studentProfile.hostelId } });
                if (warden) {
                    req.io.to(warden.userId).emit('pass_deleted', { passId });
                }
            }
        }

        res.status(200).json({ message: 'Pass deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getPublicPassDetails = async (req, res) => {
    try {
        const { token } = req.params;
        if (!token) return res.status(400).json({ message: 'Missing verification token.' });

        const parts = token.split(':');
        if (parts.length < 2) {
            return res.status(400).json({ message: 'Invalid token format.' });
        }

        const [passId, signature] = parts.map(p => p.trim());

        const pass = await GatePass.findByPk(passId, {
            include: [{ model: User, as: 'student', attributes: ['name', 'email', 'photo'] }]
        });
        if (!pass) return res.status(404).json({ message: 'Pass details not found.' });

        if (signature !== pass.qrToken) {
            return res.status(403).json({ message: 'Pass verification failed: signature is invalid.' });
        }

        const studentProfile = await Student.findOne({
            where: { userId: pass.studentId },
            include: [{ model: Hostel, as: 'hostel', attributes: ['name'] }]
        });

        res.status(200).json({
            student: {
                name: pass.student?.name,
                photo: pass.student?.photo,
                rollNumber: studentProfile ? studentProfile.rollNumber : 'N/A',
                hostel: studentProfile && studentProfile.hostel ? studentProfile.hostel.name : 'Unknown',
                room: studentProfile ? studentProfile.roomNo : 'N/A'
            },
            passDetails: {
                id: pass.id,
                purpose: pass.purpose,
                destination: pass.destination,
                leaveDate: pass.leaveDate,
                returnDate: pass.returnDate,
                status: pass.status,
                exitTime: pass.exitTime,
                entryTime: pass.entryTime
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
