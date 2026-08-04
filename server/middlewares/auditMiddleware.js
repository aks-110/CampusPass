const AuditLog = require('../models/AuditLog');

const logAction = (actionDescription, targetModel = null) => {
    return async (req, res, next) => {
        // We hook into the response finish event to ensure we only log successful actions
        // Or we can just log the attempt immediately. Let's log after finish.
        res.on('finish', async () => {
            if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
                try {
                    // Try to infer targetId from params (e.g., /users/:userId/approve)
                    let targetId = null;
                    if (req.params.userId) targetId = req.params.userId;
                    else if (req.params.passId) targetId = req.params.passId;
                    else if (req.params.hostelId) targetId = req.params.hostelId;

                    const audit = new AuditLog({
                        user: req.user.id,
                        role: req.user.role,
                        action: actionDescription,
                        targetModel,
                        targetId,
                        ipAddress: req.ip || req.connection.remoteAddress,
                        device: req.headers['user-agent']
                    });
                    
                    await audit.save();
                } catch (error) {
                    console.error('Audit Log Failed:', error);
                }
            }
        });
        next();
    };
};

module.exports = { logAction };
