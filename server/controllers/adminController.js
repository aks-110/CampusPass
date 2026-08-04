const { User, Student, Warden, Hostel } = require('../models/sql/associations');
const { Op } = require('sequelize');
const { sendEmail } = require('../utils/emailService');
const AuditLog = require('../models/AuditLog');

// ==========================
// REGISTRATION APPROVALS
// ==========================

exports.getPendingUsers = async (req, res) => {
    try {
        let pendingList = [];
        
        if (req.user.role === 'Admin') {
            // Admin approves Everyone (Warden, Main Gate, Student)
            const pendingUsers = await User.findAll({ 
                where: {
                    role: { [Op.in]: ['Warden', 'Main Gate', 'Student'] }, 
                    status: 'Pending'
                },
                attributes: { exclude: ['password'] }
            });
            
            pendingList = await Promise.all(pendingUsers.map(async (u) => {
                let assignedTo = u.assignedLocation || '';
                if (u.role === 'Warden') {
                    const warden = await Warden.findOne({ 
                        where: { userId: u.id },
                        include: [{ model: Hostel, as: 'hostel', attributes: ['name'] }]
                    });
                    if (warden && warden.hostel) assignedTo = warden.hostel.name;
                } else if (u.role === 'Student') {
                    const student = await Student.findOne({ 
                        where: { userId: u.id },
                        include: [{ model: Hostel, as: 'hostel', attributes: ['name'] }]
                    });
                    if (student && student.hostel) assignedTo = student.hostel.name;
                }
                
                return {
                    _id: u.id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone,
                    photo: u.photo,
                    role: u.role,
                    assignedTo: assignedTo,
                    isStaff: u.role !== 'Student'
                };
            }));

        } else if (req.user.role === 'Warden') {
            // Warden approves Students for their specific hostel
            const wardenProfile = await Warden.findOne({ where: { userId: req.user.id } });
            if (wardenProfile && wardenProfile.hostelId) {
                const pendingStudents = await Student.findAll({ 
                    where: {
                        registrationStatus: 'Pending', 
                        hostelId: wardenProfile.hostelId 
                    },
                    include: [
                        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'photo', 'role'] },
                        { model: Hostel, as: 'hostel', attributes: ['name'] }
                    ]
                });

                pendingList = pendingStudents.map(s => {
                    if (!s.user) return null;
                    return {
                        _id: s.user.id, // Base user ID
                        studentProfileId: s.id,
                        name: s.user.name,
                        email: s.user.email,
                        phone: s.user.phone,
                        photo: s.user.photo,
                        role: s.user.role,
                        rollNumber: s.rollNumber,
                        hostel: s.hostel ? s.hostel.name : 'Unknown',
                        roomNo: s.roomNo,
                        room: s.roomNo, // Compatibility with client
                        branch: s.branch,
                        year: s.year,
                        parentName: s.parentName,
                        parentEmail: s.parentEmail,
                        parentPhone: s.parentPhone,
                        idCard: s.idCard,
                        idCardUrl: s.idCard, // Compatibility with client
                        isStaff: false
                    };
                }).filter(Boolean);
            }
        }
        
        res.status(200).json(pendingList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.approveUser = async (req, res) => {
    try {
        const { userId } = req.params; 
        
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'Student') {
            const student = await Student.findOne({ where: { userId } });
            if (student) {
                student.registrationStatus = 'Approved';
                await student.save();
            }
        }
        
        user.status = 'Active';
        await user.save();

        await sendEmail({
            to: user.email,
            subject: 'CampusPass Account Approved!',
            text: `Dear ${user.name},\n\nYour CampusPass account has been approved. You can now log in.\n\nRegards,\nCampusPass Admin`
        });

        res.status(200).json({ message: 'User approved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.rejectUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'Student') {
            const student = await Student.findOne({ where: { userId } });
            if (student) {
                student.registrationStatus = 'Rejected';
                await student.save();
            }
        }
        
        user.status = 'Rejected';
        await user.save();

        await sendEmail({
            to: user.email,
            subject: 'CampusPass Account Rejected',
            text: `Dear ${user.name},\n\nYour CampusPass account registration was rejected. Please contact administration for details.\n\nRegards,\nCampusPass Admin`
        });

        res.status(200).json({ message: 'User rejected successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ==========================
// USER MANAGEMENT SYSTEM
// ==========================

exports.createAdmin = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const admin = await User.create({
            name,
            email,
            password,
            role: 'Admin',
            phone,
            status: 'Active' // Admins created by an Admin are instantly active
        });

        res.status(201).json({ message: 'Administrator created successfully', user: admin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        let whereClause = {};
        if (role) whereClause.role = role;
        
        // Scoping for Warden role
        if (req.user.role === 'Warden') {
            const wardenProfile = await Warden.findOne({ where: { userId: req.user.id } });
            if (wardenProfile && wardenProfile.hostelId) {
                const students = await Student.findAll({ where: { hostelId: wardenProfile.hostelId } });
                const userIds = students.map(s => s.userId);
                whereClause.id = { [Op.in]: userIds };
                whereClause.role = 'Student'; // Warden can only view students
            } else {
                return res.status(200).json([]);
            }
        }
        
        const users = await User.findAll({ 
            where: whereClause,
            attributes: { exclude: ['password'] },
            include: [
                { 
                    model: Student, 
                    as: 'studentProfile',
                    include: [{ model: Hostel, as: 'hostel', attributes: ['name'] }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        // Map _id for client compatibility
        const mappedUsers = users.map(u => {
            const json = u.toJSON();
            json._id = json.id;
            if (json.studentProfile) {
                json.rollNumber = json.studentProfile.rollNumber;
                json.roomNo = json.studentProfile.roomNo;
                json.hostel = json.studentProfile.hostel ? json.studentProfile.hostel.name : 'Unknown';
                json.branch = json.studentProfile.branch;
                json.year = json.studentProfile.year;
                json.parentName = json.studentProfile.parentName;
                json.parentPhone = json.studentProfile.parentPhone;
                json.parentEmail = json.studentProfile.parentEmail;
            }
            return json;
        });

        res.status(200).json(mappedUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body; // 'Active', 'Suspended', 'Deleted'
        
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.status = status;
        await user.save();
        
        const userJson = user.toJSON();
        delete userJson.password;
        userJson._id = userJson.id;

        res.status(200).json({ message: `User account marked as ${status}`, user: userJson });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Delete user
        await User.destroy({ where: { id: userId } });
        // Cascade delete profiles
        await Student.destroy({ where: { userId } });
        await Warden.destroy({ where: { userId } });
        
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.resetUserPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const tempPassword = Math.random().toString(36).slice(-8);
        user.password = tempPassword; 
        await user.save(); // password hashes automatically by model hook

        await sendEmail({
            to: user.email,
            subject: 'CampusPass Password Reset',
            text: `Dear ${user.name},\n\nYour password has been reset by the Administrator.\nYour new temporary password is: ${tempPassword}\n\nPlease log in and change this immediately.\n\nRegards,\nCampusPass Admin`
        });

        res.status(200).json({ message: 'Password reset and emailed to user' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(100);
            
        const formattedLogs = await Promise.all(logs.map(async (l) => {
            const user = await User.findByPk(l.user, { attributes: ['name', 'email', 'role'] });
            return {
                _id: l._id,
                action: l.action,
                targetModel: l.targetModel,
                targetId: l.targetId,
                details: l.details,
                ipAddress: l.ipAddress,
                device: l.device,
                createdAt: l.createdAt,
                user: user ? { name: user.name, email: user.email, role: user.role } : null
            };
        }));
        
        res.status(200).json(formattedLogs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
