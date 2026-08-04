const { DataTypes } = require('sequelize');
const sequelize = require('../../config/pg');

const GatePass = sequelize.define('GatePass', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    purpose: {
        type: DataTypes.STRING,
        allowNull: false
    },
    destination: {
        type: DataTypes.STRING,
        allowNull: true
    },
    leaveDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    returnDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Draft', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Expired', 'Completed', 'Overdue'),
        defaultValue: 'Pending',
        allowNull: false
    },
    qrToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    approvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    },
    exitTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    entryTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    exitGate: {
        type: DataTypes.STRING,
        allowNull: true
    },
    entryGate: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        {
            name: 'unique_active_pass_per_student',
            unique: true,
            fields: ['studentId'],
            where: {
                status: ['Pending', 'Approved']
            }
        }
    ]
});

module.exports = GatePass;
