const express = require('express');
const { verifyPass, confirmPass, logEmergencyPass, getGateLogs, searchStudent } = require('../controllers/gateController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();

// Search student manually by name, email, or roll number
router.get('/search-student', protect, authorize('Main Gate', 'Warden', 'Admin'), searchStudent);

// Fetch gate logs
router.get('/logs', protect, authorize('Main Gate', 'Admin'), getGateLogs);

// Step 1: Scan and verify details (returns info to guard UI)
router.post('/verify', protect, authorize('Main Gate', 'Admin'), verifyPass);

// Step 2: Guard manually confirms the action (logs to DB)
router.post('/confirm', protect, authorize('Main Gate', 'Admin'), confirmPass);

// Step 3: Guard manually registers an emergency entry/exit
router.post('/emergency', protect, authorize('Main Gate', 'Admin'), logEmergencyPass);

module.exports = router;
