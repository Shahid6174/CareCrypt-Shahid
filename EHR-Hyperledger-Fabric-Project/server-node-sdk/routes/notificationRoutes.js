const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const requireUser = require('../middleware/requireUser');

// Get user notifications
router.get('/', requireUser, notificationController.getUserNotifications);

// Get unread count
router.get('/unread-count', requireUser, notificationController.getUnreadCount);

// Get statistics
router.get('/statistics', requireUser, notificationController.getStatistics);

// Mark notification as read
router.put('/:notificationId/read', requireUser, notificationController.markAsRead);

// Mark all as read
router.put('/read-all', requireUser, notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', requireUser, notificationController.deleteNotification);

// Create test notification (development only)
router.post('/test', requireUser, notificationController.createTestNotification);

module.exports = router;

