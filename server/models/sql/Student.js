const { DataTypes } = require('sequelize');
const sequelize = require('../../config/pg');

const Student = sequelize.define('Student', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
            model: 'Users',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    rollNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    hostelId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Hostels',
            key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    },
    roomNo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    branch: {
        type: DataTypes.STRING,
        allowNull: true
    },
    year: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: true
    },
    parentName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    parentEmail: {
        type: DataTypes.STRING,
        allowNull: true
    },
    parentPhone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    idCard: {
        type: DataTypes.STRING,
        allowNull: true
    },
    registrationStatus: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        defaultValue: 'Pending',
        allowNull: false
    },
    currentLocation: {
        type: DataTypes.ENUM('Inside', 'Outside'),
        defaultValue: 'Inside',
        allowNull: false
    }
}, {
    timestamps: true
});

module.exports = Student;
