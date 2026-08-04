const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user: { type: String, required: true },
    role: { type: String, required: true },
    action: { type: String, required: true }, // e.g. "Deleted Student", "Approved Pass"
    targetModel: { type: String }, // e.g. "User", "Pass", "Hostel"
    targetId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed }, // Any extra info
    ipAddress: { type: String },
    device: { type: String }, // User-Agent string
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
