const { DataTypes } = require('sequelize');
const sequelize = require('../../config/pg');

const Hostel = sequelize.define('Hostel', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    capacity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    wardenId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    }
}, {
    timestamps: true
});

module.exports = Hostel;
