const fraudDetectionService = require('../services/fraudDetectionService');
const User = require('../models/User');
const responses = require('../utils/responses');

/**
 * Get user fraud status
 */
exports.getUserFraudStatus = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    const status = await fraudDetectionService.getUserFraudStatus(userId);
    
    if (!status) {
      return res.status(404).send(responses.error('User not found'));
    }

    res.status(200).send(responses.ok(status));
  } catch (err) {
    next(err);
  }
};

/**
 * Get all users with fraud attempts (Admin only)
 */
exports.getFraudulentUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      'fraudDetection.attemptCount': { $gt: 0 }
    }).select('userId name email role fraudDetection');

    const fraudData = users.map(user => ({
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      attemptCount: user.fraudDetection.attemptCount,
      isBlocked: user.fraudDetection.isBlocked,
      blockedAt: user.fraudDetection.blockedAt,
      lastWarningAt: user.fraudDetection.lastWarningAt,
      warningCount: user.fraudDetection.warnings.length
    }));

    res.status(200).send(responses.ok(fraudData));
  } catch (err) {
    next(err);
  }
};

/**
 * Get blocked users (Admin only)
 */
exports.getBlockedUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      'fraudDetection.isBlocked': true
    }).select('userId name email role fraudDetection');

    const blockedData = users.map(user => ({
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      attemptCount: user.fraudDetection.attemptCount,
      blockedAt: user.fraudDetection.blockedAt,
      warnings: user.fraudDetection.warnings
    }));

    res.status(200).send(responses.ok(blockedData));
  } catch (err) {
    next(err);
  }
};

/**
 * Unblock a user (Admin only)
 */
exports.unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).send(responses.error('User not found'));
    }

    if (!user.fraudDetection || !user.fraudDetection.isBlocked) {
      return res.status(400).send(responses.error('User is not blocked'));
    }

    // Unblock user and reset attempt count
    user.fraudDetection.isBlocked = false;
    user.fraudDetection.attemptCount = 0;
    user.fraudDetection.blockedAt = null;
    
    // Add a note about unblocking
    user.fraudDetection.warnings.push({
      claimId: 'ADMIN_ACTION',
      reason: 'Account unblocked by administrator',
      detectedAt: new Date(),
      fraudScore: 0,
      details: `Unblocked by admin: ${req.user.id}`
    });

    await user.save();

    res.status(200).send(responses.ok({
      success: true,
      message: `User ${userId} has been unblocked`,
      userId: user.userId,
      name: user.name
    }));
  } catch (err) {
    next(err);
  }
};

/**
 * Get fraud statistics (Admin only)
 */
exports.getFraudStatistics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const usersWithAttempts = await User.countDocuments({
      'fraudDetection.attemptCount': { $gt: 0 }
    });
    const blockedUsers = await User.countDocuments({
      'fraudDetection.isBlocked': true
    });

    // Get recent warnings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentWarnings = await User.aggregate([
      { $unwind: '$fraudDetection.warnings' },
      {
        $match: {
          'fraudDetection.warnings.detectedAt': { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgFraudScore: { $avg: '$fraudDetection.warnings.fraudScore' }
        }
      }
    ]);

    const stats = {
      totalUsers,
      usersWithFraudAttempts: usersWithAttempts,
      blockedUsers,
      fraudAttemptRate: totalUsers > 0 ? (usersWithAttempts / totalUsers * 100).toFixed(2) + '%' : '0%',
      blockRate: totalUsers > 0 ? (blockedUsers / totalUsers * 100).toFixed(2) + '%' : '0%',
      recentWarnings: recentWarnings.length > 0 ? {
        count: recentWarnings[0].count,
        avgFraudScore: recentWarnings[0].avgFraudScore.toFixed(2)
      } : {
        count: 0,
        avgFraudScore: 0
      },
      period: 'Last 30 days'
    };

    res.status(200).send(responses.ok(stats));
  } catch (err) {
    next(err);
  }
};

/**
 * Get user warning history
 */
exports.getUserWarnings = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId }).select('userId name email fraudDetection');
    if (!user) {
      return res.status(404).send(responses.error('User not found'));
    }

    const warnings = user.fraudDetection?.warnings || [];

    res.status(200).send(responses.ok({
      userId: user.userId,
      name: user.name,
      email: user.email,
      totalWarnings: warnings.length,
      attemptCount: user.fraudDetection?.attemptCount || 0,
      isBlocked: user.fraudDetection?.isBlocked || false,
      warnings: warnings.map(w => ({
        claimId: w.claimId,
        reason: w.reason,
        detectedAt: w.detectedAt,
        fraudScore: w.fraudScore,
        details: w.details
      }))
    }));
  } catch (err) {
    next(err);
  }
};

