const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const requireUser = require('../middleware/requireUser');

// Role-specific analytics
router.get('/patient', requireUser, analyticsController.getPatientAnalytics);
router.get('/doctor', requireUser, analyticsController.getDoctorAnalytics);
router.get('/insurance-agent', requireUser, analyticsController.getInsuranceAgentAnalytics);
router.get('/admin', requireUser, analyticsController.getAdminAnalytics);

// Lists for dropdowns/selection
router.get('/doctors', requireUser, analyticsController.getDoctorsList);
router.get('/patients', requireUser, analyticsController.getPatientsList);
router.get('/agents', requireUser, analyticsController.getInsuranceAgentsList);
router.get('/hospitals', requireUser, analyticsController.getHospitalsList);
router.get('/companies', requireUser, analyticsController.getInsuranceCompaniesList);

module.exports = router;

