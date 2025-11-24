const analyticsService = require('../services/analyticsService');
const responses = require('../utils/responses');

/**
 * Analytics Controller
 * Handles analytics and statistics endpoints
 */

/**
 * Get patient analytics
 */
exports.getPatientAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const analytics = await analyticsService.getPatientAnalytics(userId);
    
    res.status(200).send(responses.ok(analytics));
  } catch (err) {
    next(err);
  }
};

/**
 * Get doctor analytics
 */
exports.getDoctorAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const analytics = await analyticsService.getDoctorAnalytics(userId);
    
    res.status(200).send(responses.ok(analytics));
  } catch (err) {
    next(err);
  }
};

/**
 * Get insurance agent analytics
 */
exports.getInsuranceAgentAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const analytics = await analyticsService.getInsuranceAgentAnalytics(userId);
    
    res.status(200).send(responses.ok(analytics));
  } catch (err) {
    next(err);
  }
};

/**
 * Get admin analytics
 */
exports.getAdminAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getAdminAnalytics();
    
    res.status(200).send(responses.ok(analytics));
  } catch (err) {
    next(err);
  }
};

/**
 * Get doctors list
 */
exports.getDoctorsList = async (req, res, next) => {
  try {
    const doctors = await analyticsService.getDoctorsList();
    
    res.status(200).send(responses.ok(doctors));
  } catch (err) {
    next(err);
  }
};

/**
 * Get patients list
 */
exports.getPatientsList = async (req, res, next) => {
  try {
    const patients = await analyticsService.getPatientsList();
    
    res.status(200).send(responses.ok(patients));
  } catch (err) {
    next(err);
  }
};

/**
 * Get insurance agents list
 */
exports.getInsuranceAgentsList = async (req, res, next) => {
  try {
    const agents = await analyticsService.getInsuranceAgentsList();
    
    res.status(200).send(responses.ok(agents));
  } catch (err) {
    next(err);
  }
};

/**
 * Get hospitals list
 */
exports.getHospitalsList = async (req, res, next) => {
  try {
    const hospitals = await analyticsService.getHospitalsList();
    
    res.status(200).send(responses.ok(hospitals));
  } catch (err) {
    next(err);
  }
};

/**
 * Get insurance companies list
 */
exports.getInsuranceCompaniesList = async (req, res, next) => {
  try {
    const companies = await analyticsService.getInsuranceCompaniesList();
    
    res.status(200).send(responses.ok(companies));
  } catch (err) {
    next(err);
  }
};

