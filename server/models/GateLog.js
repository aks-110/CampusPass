const mongoose = require('mongoose');

const gateLogSchema = new mongoose.Schema({
    pass: { type: String, required: true },
    student: { type: String, required: true },
    
    action: { type: String, enum: ['Exit', 'Return'], required: true },
    gateName: { type: String, required: true }, // e.g., 'Gate 1', 'Gate 2'
    
    scanTime: { type: Date, default: Date.now },
    
    deviceId: { type: String }, // Device ID scanning the QR
    ipAddress: { type: String }
}, { timestamps: true });

// TTL Index: Delete documents 30 days after creation
gateLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('GateLog', gateLogSchema);
