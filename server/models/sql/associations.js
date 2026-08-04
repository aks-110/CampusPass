const User = require('./User');
const Student = require('./Student');
const Warden = require('./Warden');
const Hostel = require('./Hostel');
const GatePass = require('./Pass');

// User <-> Student (One-to-One)
User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Warden (One-to-One)
User.hasOne(Warden, { foreignKey: 'userId', as: 'wardenProfile' });
Warden.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Hostel <-> Warden/User (WardenId refers to User ID)
Hostel.belongsTo(User, { foreignKey: 'wardenId', as: 'wardenUser' });
User.hasMany(Hostel, { foreignKey: 'wardenId', as: 'managedHostels' });

// Student <-> Hostel (Many-to-One)
Student.belongsTo(Hostel, { foreignKey: 'hostelId', as: 'hostel' });
Hostel.hasMany(Student, { foreignKey: 'hostelId', as: 'hostelStudents' });

// Warden <-> Hostel (Many-to-One)
Warden.belongsTo(Hostel, { foreignKey: 'hostelId', as: 'hostel' });
Hostel.hasMany(Warden, { foreignKey: 'hostelId', as: 'hostelWardens' });

// GatePass <-> User (Student) (Many-to-One)
GatePass.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
User.hasMany(GatePass, { foreignKey: 'studentId', as: 'passes' });

// GatePass <-> User (ApprovedBy) (Many-to-One)
GatePass.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
User.hasMany(GatePass, { foreignKey: 'approvedBy', as: 'approvedPasses' });

module.exports = {
    User,
    Student,
    Warden,
    Hostel,
    GatePass
};
