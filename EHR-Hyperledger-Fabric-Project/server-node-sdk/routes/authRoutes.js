const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const requireUser = require('../middleware/requireUser');

// New registration endpoints (with password)
router.post('/registerPatient', auth.registerPatient);
router.post('/registerDoctor', auth.registerDoctor);
router.post('/registerInsuranceAgent', auth.registerInsuranceAgent);

// Login endpoints (with email/password)
router.post('/loginPatient', auth.loginPatient);
router.post('/loginDoctor', auth.loginDoctor);
router.post('/loginInsuranceAgent', auth.loginInsuranceAgent);
router.post('/loginAdmin', auth.loginAdmin);
router.post('/loginHospitalAdmin', auth.loginHospitalAdmin);
router.post('/loginInsuranceAdmin', auth.loginInsuranceAdmin);

// Admin endpoints to complete blockchain registration (hardcoded identities - no header required)
router.post('/completePatientRegistration', auth.completePatientRegistration);
router.post('/completeDoctorRegistration', auth.completeDoctorRegistration);
router.post('/completeInsuranceAgentRegistration', auth.completeInsuranceAgentRegistration);

// Legacy admin registration endpoints
router.post('/registerHospitalAdmin', auth.registerHospitalAdmin);
router.post('/registerInsuranceAdmin', auth.registerInsuranceAdmin);

// Legacy endpoints for backward compatibility (hardcoded identities - no header required)
router.post('/registerPatientLegacy', auth.registerPatientLegacy);
router.post('/registerDoctorLegacy', auth.registerDoctorLegacy);
router.post('/registerInsuranceAgentLegacy', auth.registerInsuranceAgentLegacy);

module.exports = router;
