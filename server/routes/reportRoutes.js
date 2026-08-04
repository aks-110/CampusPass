const express = require('express');
const { getDashboardStats } = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/stats', protect, authorize('Admin', 'Warden', 'Main Gate'), getDashboardStats);

module.exports = router;
