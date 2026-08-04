const express = require('express');
const { applyPass, approvePass, rejectPass, getPasses, deletePass, getPublicPassDetails } = require('../controllers/passController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/apply', protect, authorize('Student'), applyPass);
router.put('/:passId/approve', protect, authorize('Warden', 'Chief Warden', 'Admin'), approvePass);
router.put('/:passId/reject', protect, authorize('Warden', 'Chief Warden', 'Admin'), rejectPass);
router.get('/', protect, getPasses);
router.delete('/:passId', protect, authorize('Student', 'Admin'), deletePass);
router.get('/public-verify/:token', getPublicPassDetails);

module.exports = router;
