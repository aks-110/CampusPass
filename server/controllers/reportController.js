const { GatePass, Student, Warden, User, Hostel } = require('../models/sql/associations');
const GateLog = require('../models/GateLog');
const { Op } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let pendingWhere = { registrationStatus: 'Pending' };
        let passesWhere = { 
            status: { [Op.in]: ['Approved', 'Completed', 'Expired', 'Overdue'] }, 
            createdAt: { [Op.gte]: today } 
        };
        let outsideWhere = { currentLocation: 'Outside' };
        let logsQuery = { scanTime: { $gte: today } };

        if (req.user.role === 'Warden') {
            const wardenProfile = await Warden.findOne({ where: { userId: req.user.id } });
            if (wardenProfile && wardenProfile.hostelId) {
                const students = await Student.findAll({ where: { hostelId: wardenProfile.hostelId } });
                const userIds = students.map(s => s.userId);
                
                pendingWhere = { registrationStatus: 'Pending', hostelId: wardenProfile.hostelId };
                passesWhere.studentId = { [Op.in]: userIds };
                outsideWhere = { currentLocation: 'Outside', hostelId: wardenProfile.hostelId };
                logsQuery.student = { $in: userIds };
            } else {
                return res.status(200).json({
                    pendingApprovals: 0,
                    passesToday: 0,
                    outsideStudents: 0,
                    gateActivity: []
                });
            }
        }

        // 1. Total Pending Approvals from PostgreSQL
        const pendingApprovals = await Student.count({ where: pendingWhere });
        const pendingApprovalsList = await Student.findAll({
            where: pendingWhere,
            include: [{ model: User, as: 'user', attributes: ['name', 'email', 'phone'] }, { model: Hostel, as: 'hostel', attributes: ['name'] }]
        });

        // 2. Passes issued today from PostgreSQL
        const passesToday = await GatePass.count({ where: passesWhere });
        const rawPassesTodayList = await GatePass.findAll({
            where: passesWhere,
            include: [{ model: User, as: 'student', attributes: ['name', 'email', 'phone'] }]
        });

        const passStudentIds = rawPassesTodayList.map(p => p.studentId);
        const passStudentProfiles = await Student.findAll({
            where: { userId: { [Op.in]: passStudentIds } },
            include: [{ model: Hostel, as: 'hostel', attributes: ['name'] }]
        });

        const passesTodayList = rawPassesTodayList.map(p => {
            const pObj = p.toJSON();
            const profile = passStudentProfiles.find(s => s.userId === p.studentId);
            if (profile) {
                pObj.studentProfile = {
                    ...profile.toJSON(),
                    hostel: profile.hostel ? profile.hostel.name : 'Unknown'
                };
            }
            return pObj;
        });

        // 3. Students Currently Outside from PostgreSQL
        const outsideStudents = await Student.count({ where: outsideWhere });
        const outsideStudentsList = await Student.findAll({
            where: outsideWhere,
            include: [{ model: User, as: 'user', attributes: ['name', 'email', 'phone'] }, { model: Hostel, as: 'hostel', attributes: ['name'] }]
        });

        // 4. GateLogs for today (Peak Activity) from MongoDB
        const gateActivity = await GateLog.aggregate([
            { $match: logsQuery },
            { $group: {
                _id: { $hour: { date: "$scanTime", timezone: "Asia/Kolkata" } },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            pendingApprovals,
            passesToday,
            outsideStudents,
            gateActivity,
            pendingApprovalsList,
            passesTodayList,
            outsideStudentsList
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
