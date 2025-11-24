const rewardService = require('../services/rewardService');
const responses = require('../utils/responses');

/**
 * Reward Controller
 * Handles reward and gamification endpoints
 */

/**
 * Get user rewards summary
 */
exports.getRewardsSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const summary = await rewardService.getRewardsSummary(userId);
    
    res.status(200).send(responses.ok(summary));
  } catch (err) {
    next(err);
  }
};

/**
 * Get rewards history
 */
exports.getRewardsHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query;
    
    const summary = await rewardService.getRewardsSummary(userId);
    
    res.status(200).send(responses.ok({
      history: summary.recentHistory,
      totalCoins: summary.totalCoins
    }));
  } catch (err) {
    next(err);
  }
};

/**
 * Get user achievements
 */
exports.getAchievements = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const summary = await rewardService.getRewardsSummary(userId);
    
    res.status(200).send(responses.ok({
      achievements: summary.achievements,
      totalAchievements: summary.achievements.length
    }));
  } catch (err) {
    next(err);
  }
};

/**
 * Get leaderboard
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { role, limit = 10 } = req.query;
    
    const leaderboard = await rewardService.getLeaderboard(role, parseInt(limit));
    
    res.status(200).send(responses.ok({
      leaderboard,
      count: leaderboard.length
    }));
  } catch (err) {
    next(err);
  }
};

/**
 * Get user statistics
 */
exports.getStatistics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const summary = await rewardService.getRewardsSummary(userId);
    
    res.status(200).send(responses.ok({
      statistics: summary.statistics,
      streak: summary.streak
    }));
  } catch (err) {
    next(err);
  }
};

/**
 * Get badge info
 */
exports.getBadgeInfo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const summary = await rewardService.getRewardsSummary(userId);
    
    res.status(200).send(responses.ok({
      currentBadge: summary.badge,
      nextBadge: summary.nextBadge,
      coinsToNextBadge: summary.coinsToNextBadge,
      currentLevel: summary.level,
      coinsToNextLevel: summary.coinsToNextLevel,
      totalCoins: summary.totalCoins
    }));
  } catch (err) {
    next(err);
  }
};

