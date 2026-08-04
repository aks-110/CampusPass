const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const Notification = require('../models/Notification');

router.get('/', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ receiver: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.put('/read-all', protect, async (req, res) => {
    try {
        await Notification.updateMany({ receiver: req.user.id, isRead: false }, { isRead: true });
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
