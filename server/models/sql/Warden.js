const { DataTypes } = require('sequelize');
const sequelize = require('../../config/pg');

const Warden = sequelize.define('Warden', {
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
    hostelId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Hostels',
            key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    }
}, {
    timestamps: true
});

module.exports = Warden;
