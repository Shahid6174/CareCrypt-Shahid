const notificationService = require('../services/notificationService');
const responses = require('../utils/responses');

/**
 * Notification Controller
 * Handles notification API endpoints
 */

/**
 * Get user notifications
 */
exports.getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      limit = 50,
      skip = 0,
      unreadOnly = false,
      type = null
    } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      unreadOnly: unreadOnly === 'true',
      type
    });

    res.status(200).send(responses.ok(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get unread count
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const Notification = require('../models/Notification');
    
    const count = await Notification.getUnreadCount(userId);
    
    res.status(200).send(responses.ok({ unreadCount: count }));
  } catch (err) {
    next(err);
  }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await notificationService.markAsRead(notificationId);
    
    if (!notification) {
      return res.status(404).send(responses.error('Notification not found'));
    }
    
    res.status(200).send(responses.ok({
      success: true,
      message: 'Notification marked as read'
    }));
  } catch (err) {
    next(err);
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const result = await notificationService.markAllAsRead(userId);
    
    res.status(200).send(responses.ok({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    }));
  } catch (err) {
    next(err);
  }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    
    const result = await notificationService.deleteNotification(notificationId);
    
    if (!result) {
      return res.status(404).send(responses.error('Notification not found'));
    }
    
    res.status(200).send(responses.ok({
      success: true,
      message: 'Notification deleted'
    }));
  } catch (err) {
    next(err);
  }
};

/**
 * Get notification statistics
 */
exports.getStatistics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const stats = await notificationService.getStatistics(userId);
    
    res.status(200).send(responses.ok(stats));
  } catch (err) {
    next(err);
  }
};

/**
 * Create test notification (for development/testing)
 */
exports.createTestNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, title, message, priority } = req.body;
    
    const notification = await notificationService.createNotification({
      userId,
      userRole: req.user.role || 'patient',
      type: type || 'system_alert',
      title: title || 'Test Notification',
      message: message || 'This is a test notification',
      priority: priority || 'low',
      data: { test: true }
    });
    
    res.status(200).send(responses.ok(notification));
  } catch (err) {
    next(err);
  }
};

