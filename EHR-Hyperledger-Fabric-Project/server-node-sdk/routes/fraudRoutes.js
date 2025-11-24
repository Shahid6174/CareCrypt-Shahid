const express = require('express');
const router = express.Router();
const fraudController = require('../controllers/fraudController');
const requireUser = require('../middleware/requireUser');

// User endpoints
router.get('/status/:userId', requireUser, fraudController.getUserFraudStatus);
router.get('/warnings/:userId', requireUser, fraudController.getUserWarnings);

// Admin endpoints
router.get('/users/fraudulent', requireUser, fraudController.getFraudulentUsers);
router.get('/users/blocked', requireUser, fraudController.getBlockedUsers);
router.post('/users/unblock/:userId', requireUser, fraudController.unblockUser);
router.get('/statistics', requireUser, fraudController.getFraudStatistics);

module.exports = router;

