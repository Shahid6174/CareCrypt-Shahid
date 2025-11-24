const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const requireUser = require('../middleware/requireUser');

// Get user rewards summary
router.get('/summary', requireUser, rewardController.getRewardsSummary);

// Get rewards history
router.get('/history', requireUser, rewardController.getRewardsHistory);

// Get achievements
router.get('/achievements', requireUser, rewardController.getAchievements);

// Get leaderboard
router.get('/leaderboard', requireUser, rewardController.getLeaderboard);

// Get statistics
router.get('/statistics', requireUser, rewardController.getStatistics);

// Get badge info
router.get('/badge', requireUser, rewardController.getBadgeInfo);

module.exports = router;

