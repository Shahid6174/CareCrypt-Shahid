const invoke = require('../invoke');
const query = require('../query');
const responses = require('../utils/responses');
const notificationService = require('../services/notificationService');
const rewardService = require('../services/rewardService');

exports.reviewClaim = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const { claimId, notes } = req.body;
    const payload = { claimId, agentId: userId, notes };
    const result = await invoke.invokeTransaction('reviewClaimByAgent', payload, userId);
    res.status(200).send(responses.ok(result));
  } catch(err){ next(err); }
};

exports.approveClaim = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const { claimId, approvedAmount, notes } = req.body;
    const payload = { claimId, insuranceAgentId: userId, approvedAmount, notes };
    const result = await invoke.invokeTransaction('approveClaimByInsurance', payload, userId);
    
    // Get claim to find patient ID
    let claim = null;
    try {
      const claimResult = await query.getQuery('getClaimById', { claimId }, userId);
      claim = JSON.parse(claimResult);
    } catch(e) {
      console.error('Error fetching claim for notification:', e);
    }
    
    // Award coins for reviewing claim (with accuracy bonus)
    const rewardResult = await rewardService.rewardClaimReviewed(userId, claimId, true, false);
    
    // Notify patient about claim approval
    if (claim && claim.patientId) {
      await notificationService.notifyClaimApproved(claim.patientId, {
        claimId,
        amount: claim.claimAmount,
        amountApproved: approvedAmount
      });
    }
    
    // Notify agent
    await notificationService.notifyClaimApprovedByAgent(userId, {
      claimId,
      amount: approvedAmount
    });
    
    res.status(200).send(responses.ok({
      ...result,
      rewards: rewardResult
    }));
  } catch(err){ next(err); }
};

exports.rejectClaim = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const { claimId, reason } = req.body;
    const payload = { claimId, insuranceAgentId: userId, reason };
    const result = await invoke.invokeTransaction('rejectClaimByInsurance', payload, userId);
    
    // Get claim to find patient ID
    let claim = null;
    try {
      const claimResult = await query.getQuery('getClaimById', { claimId }, userId);
      claim = JSON.parse(claimResult);
    } catch(e) {
      console.error('Error fetching claim for notification:', e);
    }
    
    // Check if rejection was due to fraud
    const fraudDetected = reason && reason.toLowerCase().includes('fraud');
    
    // Award coins for reviewing claim (with fraud detection bonus)
    const rewardResult = await rewardService.rewardClaimReviewed(userId, claimId, true, fraudDetected);
    
    // Notify patient about claim rejection
    if (claim && claim.patientId) {
      await notificationService.notifyClaimRejected(claim.patientId, {
        claimId,
        reason
      });
    }
    
    // Notify agent
    await notificationService.notifyClaimRejectedByAgent(userId, {
      claimId,
      reason
    });
    
    res.status(200).send(responses.ok({
      ...result,
      rewards: rewardResult
    }));
  } catch(err){ next(err); }
};

exports.getClaim = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const claimId = req.params.claimId;
    const result = await query.getQuery('getClaimById', { claimId }, userId);
    // Parse the JSON string result
    let claim = null;
    try {
      claim = JSON.parse(result);
    } catch (parseError) {
      console.error('Error parsing claim:', parseError);
      claim = null;
    }
    res.status(200).send(responses.ok(claim));
  } catch(err){ next(err); }
};

exports.getClaimRecords = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const claimId = req.params.claimId;
    
    // Get claim first
    const claimResult = await query.getQuery('getClaimById', { claimId }, userId);
    let claim = null;
    try {
      claim = JSON.parse(claimResult);
    } catch (parseError) {
      console.error('Error parsing claim:', parseError);
      return res.status(200).send(responses.ok([]));
    }
    
    // Get records for the medical record IDs in the claim
    const recordIds = claim.medicalRecordIds || [];
    const records = [];
    for(const recordId of recordIds){
      try{
        const recordResult = await query.getQuery('getRecordById', { patientId: claim.patientId, recordId }, userId);
        records.push(JSON.parse(recordResult));
      } catch(e){
        // Skip if record not found
        console.error('Error fetching record:', e);
      }
    }
    res.status(200).send(responses.ok(records));
  } catch(err){ next(err); }
};

exports.getAgentProfile = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const agentId = req.params.agentId;
    const result = await query.getQuery('getAgentById', { agentId }, userId);
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

exports.getAssignedClaims = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const result = await query.getQuery('getClaimsByAgent', { agentId: userId }, userId);
    // Parse the JSON string result to return as array
    let claims = [];
    try {
      claims = JSON.parse(result);
      // Ensure claims is an array
      if (!Array.isArray(claims)) {
        claims = [];
      }
    } catch (parseError) {
      console.error('Error parsing claims:', parseError);
      claims = [];
    }
    res.status(200).send(responses.ok(claims));
  } catch(err){ next(err); }
};