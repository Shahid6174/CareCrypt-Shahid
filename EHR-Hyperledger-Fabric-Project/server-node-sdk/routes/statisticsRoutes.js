const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const requireUser = require('../middleware/requireUser');

// Insurance agent statistics
router.get('/insurance/agent/:agentId?', requireUser, statisticsController.getInsuranceAgentStats);

// Doctor statistics
router.get('/doctor/:doctorId?', requireUser, statisticsController.getDoctorStats);

// Hospital admin statistics
router.get('/hospital', requireUser, statisticsController.getHospitalAdminStats);

// Insurance company admin statistics
router.get('/insurance/company', requireUser, statisticsController.getInsuranceCompanyStats);

module.exports = router;

