const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// Public health check endpoints
router.get('/', healthController.healthCheck);
router.get('/ocr', healthController.ocrHealthCheck);
router.get('/fraud', healthController.fraudSystemCheck);
router.get('/stats', healthController.systemStats);

module.exports = router;

