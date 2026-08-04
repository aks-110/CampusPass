const express = require('express');
const { createHostel, getAllHostels, deleteHostel, assignWarden } = require('../controllers/hostelController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { logAction } = require('../middlewares/auditMiddleware');
const router = express.Router();

router.post('/', protect, authorize('Admin'), logAction('Created Hostel', 'Hostel'), createHostel);
router.get('/', getAllHostels); // Public or protect? Protect is safer, but sometimes registration form needs it
router.delete('/:hostelId', protect, authorize('Admin'), logAction('Deleted Hostel', 'Hostel'), deleteHostel);
router.put('/:hostelId/assign', protect, authorize('Admin'), logAction('Assigned Warden to Hostel', 'Hostel'), assignWarden);

module.exports = router;
