const Notification = require('../models/Notification');

/**
 * Notification Service
 * Handles creating and managing notifications for all user types
 */

class NotificationService {
  /**
   * Create a notification
   */
  async createNotification({
    userId,
    userRole,
    type,
    title,
    message,
    priority = 'medium',
    data = {},
    actionUrl = null,
    actionLabel = null,
    expiresAt = null
  }) {
    try {
      const notification = new Notification({
        userId,
        userRole,
        type,
        title,
        message,
        priority,
        data,
        actionUrl,
        actionLabel,
        expiresAt
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Patient Notifications
   */
  async notifyClaimSubmitted(patientId, claimData) {
    return await this.createNotification({
      userId: patientId,
      userRole: 'patient',
      type: 'claim_submitted',
      title: '✅ Claim Submitted Successfully',
      message: `Your insurance claim for $${claimData.claimAmount} has been submitted and is pending review.`,
      priority: 'medium',
      data: { claimId: claimData.claimId, amount: claimData.claimAmount },
      actionUrl: '/patient/claims',
      actionLabel: 'View Claim'
    });
  }

  async notifyClaimApproved(patientId, claimData) {
    return await this.createNotification({
      userId: patientId,
      userRole: 'patient',
      type: 'claim_approved',
      title: '🎉 Claim Approved!',
      message: `Great news! Your claim for $${claimData.amount} has been approved. Amount: $${claimData.amountApproved}`,
      priority: 'high',
      data: claimData,
      actionUrl: '/patient/claims',
      actionLabel: 'View Details'
    });
  }

  async notifyClaimRejected(patientId, claimData) {
    return await this.createNotification({
      userId: patientId,
      userRole: 'patient',
      type: 'claim_rejected',
      title: '❌ Claim Rejected',
      message: `Your claim has been rejected. Reason: ${claimData.reason}`,
      priority: 'high',
      data: claimData,
      actionUrl: '/patient/claims',
      actionLabel: 'View Details'
    });
  }

  async notifyFraudWarning(patientId, fraudData) {
    return await this.createNotification({
      userId: patientId,
      userRole: 'patient',
      type: 'fraud_warning',
      title: '⚠️ Fraud Warning',
      message: `Fraud detected! Attempt ${fraudData.attemptCount} of 3. Please ensure your documents are genuine.`,
      priority: 'urgent',
      data: fraudData,
      actionUrl: '/patient/profile',
      actionLabel: 'View Status'
    });
  }

  async notifyAccountBlocked(patientId, reason) {
    return await this.createNotification({
      userId: patientId,
      userRole: 'patient',
      type: 'account_blocked',
      title: '🚫 Account Blocked',
      message: `Your account has been blocked due to ${reason}. Please contact support.`,
      priority: 'urgent',
      data: { reason, blockedAt: new Date() },
      actionUrl: '/patient/support',
      actionLabel: 'Contact Support'
    });
  }

  async notifyAccessGranted(patientId, doctorData) {
    return await this.createNotification({
      userId: patientId,
      userRole: 'patient',
      type: 'access_granted',
      title: '🔓 Access Granted',
      message: `You granted access to Dr. ${doctorData.doctorName} to view your medical records.`,
      priority: 'low',
      data: doctorData,
      actionUrl: '/patient/access',
      actionLabel: 'Manage Access'
    });
  }

  async notifyAccessRevoked(patientId, doctorData) {
    return await this.createNotification({
      userId: patientId,
      userRole: 'patient',
      type: 'access_revoked',
      title: '🔒 Access Revoked',
      message: `You revoked access from Dr. ${doctorData.doctorName}.`,
      priority: 'low',
      data: doctorData,
      actionUrl: '/patient/access',
      actionLabel: 'Manage Access'
    });
  }

  /**
   * Doctor Notifications
   */
  async notifyNewPatientAccess(doctorId, patientData) {
    return await this.createNotification({
      userId: doctorId,
      userRole: 'doctor',
      type: 'access_granted',
      title: '🔓 New Patient Access',
      message: `${patientData.patientName} granted you access to their medical records.`,
      priority: 'medium',
      data: patientData,
      actionUrl: '/doctor/patients',
      actionLabel: 'View Patient'
    });
  }

  async notifyClaimToVerify(doctorId, claimData) {
    return await this.createNotification({
      userId: doctorId,
      userRole: 'doctor',
      type: 'claim_submitted',
      title: '📋 Claim Verification Needed',
      message: `A new claim for $${claimData.amount} requires your verification.`,
      priority: 'high',
      data: claimData,
      actionUrl: '/doctor/claims',
      actionLabel: 'Review Claim'
    });
  }

  async notifyClaimVerified(doctorId, claimData) {
    return await this.createNotification({
      userId: doctorId,
      userRole: 'doctor',
      type: 'claim_verified',
      title: '✅ Claim Verified',
      message: `You successfully verified claim ${claimData.claimId}.`,
      priority: 'low',
      data: claimData,
      actionUrl: '/doctor/claims',
      actionLabel: 'View Claim'
    });
  }

  async notifyRecordAdded(doctorId, recordData) {
    return await this.createNotification({
      userId: doctorId,
      userRole: 'doctor',
      type: 'record_added',
      title: '📝 Medical Record Added',
      message: `Medical record for patient ${recordData.patientId} has been added successfully.`,
      priority: 'low',
      data: recordData,
      actionUrl: '/doctor/records',
      actionLabel: 'View Records'
    });
  }

  /**
   * Insurance Agent Notifications
   */
  async notifyNewClaimForReview(agentId, claimData) {
    return await this.createNotification({
      userId: agentId,
      userRole: 'insuranceAgent',
      type: 'claim_submitted',
      title: '📋 New Claim for Review',
      message: `New claim submitted for $${claimData.amount}. Patient: ${claimData.patientName}`,
      priority: 'high',
      data: claimData,
      actionUrl: '/insurance/claims',
      actionLabel: 'Review Claim'
    });
  }

  async notifyClaimApprovedByAgent(agentId, claimData) {
    return await this.createNotification({
      userId: agentId,
      userRole: 'insuranceAgent',
      type: 'claim_approved',
      title: '✅ Claim Approved',
      message: `You approved claim ${claimData.claimId} for $${claimData.amount}.`,
      priority: 'medium',
      data: claimData,
      actionUrl: '/insurance/claims',
      actionLabel: 'View Claim'
    });
  }

  async notifyClaimRejectedByAgent(agentId, claimData) {
    return await this.createNotification({
      userId: agentId,
      userRole: 'insuranceAgent',
      type: 'claim_rejected',
      title: '❌ Claim Rejected',
      message: `You rejected claim ${claimData.claimId}. Reason: ${claimData.reason}`,
      priority: 'medium',
      data: claimData,
      actionUrl: '/insurance/claims',
      actionLabel: 'View Claim'
    });
  }

  async notifyFraudDetected(agentId, fraudData) {
    return await this.createNotification({
      userId: agentId,
      userRole: 'insuranceAgent',
      type: 'fraud_warning',
      title: '⚠️ Fraud Detected',
      message: `Fraudulent claim detected from patient ${fraudData.patientId}. Score: ${fraudData.fraudScore}/100`,
      priority: 'urgent',
      data: fraudData,
      actionUrl: '/insurance/fraud',
      actionLabel: 'Review Details'
    });
  }

  /**
   * Admin Notifications
   */
  async notifyNewRegistration(adminId, userData) {
    return await this.createNotification({
      userId: adminId,
      userRole: 'admin',
      type: 'registration_approved',
      title: '👤 New Registration Request',
      message: `New ${userData.role} registration: ${userData.name} (${userData.email})`,
      priority: 'high',
      data: userData,
      actionUrl: '/admin/requests',
      actionLabel: 'Review Request'
    });
  }

  async notifyUserBlocked(adminId, userData) {
    return await this.createNotification({
      userId: adminId,
      userRole: 'admin',
      type: 'account_blocked',
      title: '🚫 User Blocked',
      message: `User ${userData.userId} has been automatically blocked due to fraud attempts.`,
      priority: 'urgent',
      data: userData,
      actionUrl: '/admin/fraud',
      actionLabel: 'View Details'
    });
  }

  async notifyFraudAlert(adminId, fraudData) {
    return await this.createNotification({
      userId: adminId,
      userRole: 'admin',
      type: 'fraud_warning',
      title: '⚠️ Fraud Alert',
      message: `Multiple fraud attempts detected today: ${fraudData.count} attempts across ${fraudData.users} users.`,
      priority: 'urgent',
      data: fraudData,
      actionUrl: '/admin/fraud',
      actionLabel: 'View Dashboard'
    });
  }

  async notifySystemAlert(adminId, alertData) {
    return await this.createNotification({
      userId: adminId,
      userRole: 'admin',
      type: 'system_alert',
      title: '🔔 System Alert',
      message: alertData.message,
      priority: alertData.priority || 'high',
      data: alertData,
      actionUrl: alertData.actionUrl,
      actionLabel: 'View Details'
    });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, options = {}) {
    const {
      limit = 50,
      skip = 0,
      unreadOnly = false,
      type = null
    } = options;

    const query = { userId };
    if (unreadOnly) query.read = false;
    if (type) query.type = type;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const unreadCount = await Notification.countDocuments({ userId, read: false });
    const totalCount = await Notification.countDocuments({ userId });

    return {
      notifications,
      unreadCount,
      totalCount
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    const notification = await Notification.findById(notificationId);
    if (notification) {
      return await notification.markAsRead();
    }
    return null;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    return await Notification.markAllAsRead(userId);
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    return await Notification.findByIdAndDelete(notificationId);
  }

  /**
   * Get notification statistics
   */
  async getStatistics(userId) {
    const total = await Notification.countDocuments({ userId });
    const unread = await Notification.countDocuments({ userId, read: false });
    const byType = await Notification.aggregate([
      { $match: { userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const byPriority = await Notification.aggregate([
      { $match: { userId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    return {
      total,
      unread,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  }
}

module.exports = new NotificationService();

