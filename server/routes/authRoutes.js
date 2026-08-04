const express = require('express');
const { register, login, refresh, logout, changePassword, updateProfile, forgotPassword, resetPassword, getMe } = require('../controllers/authController');
const upload = require('../config/multer');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/register', upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'idCard', maxCount: 1 }
]), register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refresh);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/update-profile', protect, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
