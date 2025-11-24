const mongoose = require('mongoose');

/**
 * Notification Model
 * Stores notifications for all user types
 */

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userRole: {
    type: String,
    enum: ['patient', 'doctor', 'insuranceAgent', 'admin'],
    required: true
  },
  type: {
    type: String,
    enum: [
      'claim_submitted',
      'claim_approved',
      'claim_rejected',
      'claim_verified',
      'fraud_warning',
      'account_blocked',
      'access_granted',
      'access_revoked',
      'document_uploaded',
      'record_added',
      'registration_approved',
      'registration_rejected',
      'user_unblocked',
      'system_alert'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  actionUrl: String,
  actionLabel: String,
  expiresAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient querying
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

// Methods
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static methods
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ userId, read: false });
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { userId, read: false },
    { read: true, readAt: new Date() }
  );
};

notificationSchema.statics.deleteOldNotifications = async function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return await this.deleteMany({ createdAt: { $lt: cutoffDate } });
};

module.exports = mongoose.model('Notification', notificationSchema);

