const express = require('express');
const { 
    getPendingUsers, approveUser, rejectUser,
    getAllUsers, updateUserStatus, deleteUser, resetUserPassword, getAuditLogs
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { logAction } = require('../middlewares/auditMiddleware');
const router = express.Router();

// Approval Routes
router.get('/pending-users', protect, authorize('Admin', 'Warden'), getPendingUsers);
router.put('/users/:userId/approve', protect, authorize('Admin', 'Warden'), logAction('Approved User', 'User'), approveUser);
router.put('/users/:userId/reject', protect, authorize('Admin', 'Warden'), logAction('Rejected User', 'User'), rejectUser);

// User Management Routes
router.get('/users', protect, authorize('Admin', 'Warden'), getAllUsers);
router.get('/audit-logs', protect, authorize('Admin'), getAuditLogs);
router.put('/users/:userId/status', protect, authorize('Admin', 'Warden'), logAction('Updated User Status', 'User'), updateUserStatus);
router.put('/users/:userId/reset-password', protect, authorize('Admin'), logAction('Reset User Password', 'User'), resetUserPassword);
router.delete('/users/:userId', protect, authorize('Admin'), logAction('Deleted User', 'User'), deleteUser);

module.exports = router;
