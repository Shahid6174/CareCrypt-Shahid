const invoke = require('../invoke');
const query = require('../query');
const responses = require('../utils/responses');
const notificationService = require('../services/notificationService');
const rewardService = require('../services/rewardService');

exports.addRecord = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const { patientId, diagnosis, prescription, notes } = req.body;
    const payload = { patientId, diagnosis, prescription, notes };
    const result = await invoke.invokeTransaction('addRecord', payload, userId);
    
    // Award coins for adding record
    const rewardResult = await rewardService.rewardRecordAdded(userId, result.recordId || 'NEW');
    
    // Notify doctor about successful record addition
    await notificationService.notifyRecordAdded(userId, {
      patientId,
      recordId: result.recordId || 'NEW'
    });
    
    res.status(200).send(responses.ok({
      ...result,
      rewards: rewardResult
    }));
  } catch(err){ next(err); }
};

exports.verifyClaim = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const { claimId, verified, notes } = req.body;
    const payload = { claimId, doctorId: userId, verified, notes };
    const result = await invoke.invokeTransaction('verifyClaimByDoctor', payload, userId);
    
    // Award coins for claim verification (bonus for accurate verification)
    const rewardResult = await rewardService.rewardClaimVerified(userId, claimId, true);
    
    // Notify doctor about claim verification
    await notificationService.notifyClaimVerified(userId, {
      claimId,
      verified
    });
    
    res.status(200).send(responses.ok({
      ...result,
      rewards: rewardResult
    }));
  } catch(err){ next(err); }
};

exports.listPatients = async (req,res,next) => {
  try{
    const doctorId = req.params.doctorId;
    const result = await query.getQuery('getPatientsByDoctor', { doctorId }, doctorId);
    // Parse the JSON string result to return as array
    let patients = [];
    try {
      patients = JSON.parse(result);
      // Ensure patients is an array
      if (!Array.isArray(patients)) {
        patients = [];
      }
    } catch (parseError) {
      console.error('Error parsing patients:', parseError);
      patients = [];
    }
    res.status(200).send(responses.ok(patients));
  } catch(err){ next(err); }
};

exports.getRecordsByPatient = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const patientId = req.params.patientId;
    const result = await query.getQuery('getAllRecordsByPatientId', { patientId }, userId);
    // Parse the JSON string result to return as array
    let records = [];
    try {
      records = JSON.parse(result);
      // Ensure records is an array
      if (!Array.isArray(records)) {
        records = [];
      }
    } catch (parseError) {
      console.error('Error parsing records:', parseError);
      records = [];
    }
    res.status(200).send(responses.ok(records));
  } catch(err){ next(err); }
};

exports.getProfile = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const doctorId = req.params.doctorId;
    const result = await query.getQuery('getDoctorById', { doctorId }, userId);
    // Parse the JSON string result
    let profile = null;
    try {
      profile = JSON.parse(result);
    } catch (parseError) {
      console.error('Error parsing profile:', parseError);
      profile = null;
    }
    res.status(200).send(responses.ok(profile));
  } catch(err){ next(err); }
};