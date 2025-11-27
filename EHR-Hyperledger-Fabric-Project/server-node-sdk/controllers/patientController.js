const invoke = require('../invoke');
const query = require('../query');
const responses = require('../utils/responses');
const fraudDetectionService = require('../services/fraudDetectionService');
const notificationService = require('../services/notificationService');
const rewardService = require('../services/rewardService');
const User = require('../models/User');
const path = require('path');

exports.submitClaim = async (req,res,next) => {
  try{
    const userId = req.user.id;

    // Check if user is blocked due to fraud attempts
    const isBlocked = await fraudDetectionService.isUserBlocked(userId);
    if (isBlocked) {
      return res.status(403).send(responses.error(
        'Your account has been blocked due to multiple fraudulent claim attempts. Please contact support.'
      ));
    }

    // Validate that documents are provided (COMPULSORY)
    if (!req.body.documentIds || req.body.documentIds.length === 0) {
      return res.status(400).send(responses.error(
        'Medical documents are required for claim submission. Please attach at least one document.'
      ));
    }

    // Get fraud status for user
    const fraudStatus = await fraudDetectionService.getUserFraudStatus(userId);

    // Prepare claim payload
    const payload = {
      patientId: userId,
      doctorId: req.body.doctorId,
      policyId: req.body.policyId,
      hospitalId: req.body.hospitalId,
      claimAmount: req.body.claimAmount,
      medicalRecordIds: req.body.medicalRecordIds || [],
      claimType: req.body.claimType,
      description: req.body.description,
      documents: req.body.documents || []
    };

    // Perform fraud detection with documents
    let verificationResults = null;
    let documentPaths = [];

    // Get document paths from user's uploaded documents
    const user = await User.findOne({ userId });
    if (user && user.documents) {
      documentPaths = req.body.documentIds
        .map(docId => {
          const doc = user.documents.find(d => d.documentId === docId);
          return doc ? doc.filePath : null;
        })
        .filter(p => p !== null);
    }

    if (documentPaths.length === 0) {
      return res.status(400).send(responses.error(
        'Unable to find the attached documents. Please try uploading them again.'
      ));
    }

    // Run fraud detection
    if (documentPaths.length > 0) {
      console.log(`Running fraud detection for user ${userId} with ${documentPaths.length} documents`);
      
      verificationResults = await fraudDetectionService.verifyClaimDocuments(
        payload,
        documentPaths
      );

      console.log(`Fraud detection score: ${verificationResults.overallScore}`);
      console.log(`Genuine confidence: ${100 - verificationResults.overallScore}%`);

      // If claim is fraudulent (score >= 50)
      if (verificationResults.isFraudulent) {
        // Record fraud attempt
        const fraudRecord = await fraudDetectionService.recordFraudAttempt(
          userId,
          'PENDING',
          verificationResults
        );

        // Notify patient about fraud warning
        await notificationService.notifyFraudWarning(userId, {
          attemptCount: fraudRecord.attemptCount,
          remainingAttempts: fraudRecord.remainingAttempts,
          fraudScore: verificationResults.overallScore
        });

        // Notify patient if account is blocked
        if (fraudRecord.isBlocked) {
          await notificationService.notifyAccountBlocked(
            userId,
            'multiple fraudulent claim attempts'
          );
        }

        // Return fraud detection response
        return res.status(400).send({
          success: false,
          fraudDetected: true,
          message: fraudRecord.isBlocked 
            ? 'ACCOUNT BLOCKED: This is your third fraudulent claim attempt. Your account has been blocked. Contact support immediately.'
            : `WARNING: Fraudulent claim detected! Attempt ${fraudRecord.attemptCount} of 3. Your claim has been rejected.`,
          details: {
            fraudScore: verificationResults.overallScore,
            confidence: verificationResults.confidence,
            attemptCount: fraudRecord.attemptCount,
            remainingAttempts: fraudRecord.remainingAttempts,
            isBlocked: fraudRecord.isBlocked,
            recommendations: verificationResults.recommendations,
            verificationSummary: {
              documentsAnalyzed: verificationResults.documents.length,
              issues: verificationResults.documents.map(doc => ({
                fileName: doc.fileName,
                fraudScore: doc.fraudScore,
                indicators: doc.textAnalysis?.indicators || []
              }))
            }
          }
        });
      }
    }

    // Calculate genuineness score (100 - fraud score)
    // Score is already normalized to 10-90 range, so genuine score is also 10-90
    let genuineScore = verificationResults ? (100 - verificationResults.overallScore) : 50;
    // Ensure genuineScore is also in 10-90 range (mean-centric, never 0 or 100)
    genuineScore = Math.max(10, Math.min(90, genuineScore));
    
    const isHighlyGenuine = genuineScore >= 75; // 75%+ confidence (adjusted for 10-90 scale)
    const isModeratelyGenuine = genuineScore >= 55 && genuineScore < 75; // 55-74% confidence
    
    // Determine claim status and action
    let claimStatus = 'PENDING_DOCTOR_VERIFICATION';
    let autoApproved = false;
    let requiresVerification = true;
    let statusMessage = '';
    
    if (isHighlyGenuine) {
      // AUTO-APPROVE: Highly genuine claims (75%+ confidence on adjusted scale)
      claimStatus = 'INSURANCE_APPROVED';
      autoApproved = true;
      statusMessage = `Auto-approved (${genuineScore.toFixed(1)}% confidence)`;
      console.log(`🎉 AUTO-APPROVING claim - ${genuineScore.toFixed(1)}% genuine`);
    } else if (isModeratelyGenuine) {
      // WAIT FOR DOCTOR VERIFICATION: Moderate claims (55-74% confidence)
      claimStatus = 'PENDING_DOCTOR_VERIFICATION';
      requiresVerification = true;
      statusMessage = `Pending doctor verification (${genuineScore.toFixed(1)}% confidence)`;
      console.log(`⏳ PENDING VERIFICATION - ${genuineScore.toFixed(1)}% genuine`);
    } else {
      // LOW CONFIDENCE: Requires verification
      claimStatus = 'PENDING_DOCTOR_VERIFICATION';
      requiresVerification = true;
      statusMessage = `Pending verification (${genuineScore.toFixed(1)}% confidence - requires review)`;
      console.log(`⚠️ LOW CONFIDENCE - ${genuineScore.toFixed(1)}% genuine - requires review`);
    }

    // Submit claim to blockchain with status
    payload.status = claimStatus;
    payload.autoApproved = autoApproved;
    payload.genuineScore = genuineScore;
    const result = await invoke.invokeTransaction('submitClaim', payload, userId);

    // Award coins for claim submission
    const rewardResult = await rewardService.rewardClaimSubmitted(
      userId,
      result.claimId || 'PENDING',
      isHighlyGenuine || isModeratelyGenuine,
      genuineScore
    );

    // Notify patient about claim submission
    if (autoApproved) {
      await notificationService.notifyClaimApproved(userId, {
        claimId: result.claimId || 'PENDING',
        amount: payload.claimAmount,
        amountApproved: payload.claimAmount
      });
    } else {
      await notificationService.notifyClaimSubmitted(userId, {
        claimId: result.claimId || 'PENDING',
        claimAmount: payload.claimAmount
      });
    }
    
    // Notify doctor if verification required
    if (requiresVerification && payload.doctorId) {
      await notificationService.notifyClaimToVerify(payload.doctorId, {
        claimId: result.claimId || 'PENDING',
        amount: payload.claimAmount
      });
    }

    // Include verification info and rewards in response
    res.status(200).send(responses.ok({
      ...result,
      status: claimStatus,
      autoApproved,
      requiresVerification,
      statusMessage,
      verification: verificationResults ? {
        verified: true,
        fraudScore: verificationResults.overallScore,
        genuineScore: genuineScore,
        confidence: verificationResults.confidence,
        documentsAnalyzed: verificationResults.documents.length,
        isHighlyGenuine,
        isModeratelyGenuine
      } : {
        verified: false,
        genuineScore: 50,
        message: 'No documents provided for verification'
      },
      rewards: rewardResult,
      fraudStatus: {
        previousAttempts: fraudStatus.attemptCount,
        remainingAttempts: fraudStatus.remainingAttempts
      }
    }));
  } catch(err){ next(err); }
};

exports.grantAccess = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const { doctorIdToGrant } = req.body;
    const payload = { patientId: userId, doctorIdToGrant };
    const result = await invoke.invokeTransaction('grantAccess', payload, userId);
    
    // Notify patient about access grant
    await notificationService.notifyAccessGranted(userId, {
      doctorId: doctorIdToGrant,
      doctorName: doctorIdToGrant
    });
    
    // Notify doctor about new patient access
    await notificationService.notifyNewPatientAccess(doctorIdToGrant, {
      patientId: userId,
      patientName: 'Patient'
    });
    
    res.status(200).send(responses.ok(result));
  } catch(err){ next(err); }
};

exports.revokeAccess = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const { doctorIdToRevoke } = req.body;
    const payload = { patientId: userId, doctorIdToRevoke };
    const result = await invoke.invokeTransaction('revokeAccess', payload, userId);
    
    // Notify patient about access revocation
    await notificationService.notifyAccessRevoked(userId, {
      doctorId: doctorIdToRevoke,
      doctorName: doctorIdToRevoke
    });
    
    res.status(200).send(responses.ok(result));
  } catch(err){ next(err); }
};

exports.getClaims = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const patientId = req.params.patientId;
    const result = await query.getQuery('getClaimsByPatient', { patientId }, userId);
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

exports.getRecords = async (req,res,next) => {
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
    const patientId = req.params.patientId;
    const result = await query.getQuery('getPatientById', { patientId }, userId);
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

exports.updateClaimDocuments = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const { claimId, documents } = req.body;
    if(!claimId || !documents) throw new Error('Missing claimId or documents');
    
    // Get current claim
    const claimResult = await query.getQuery('getClaimById', { claimId }, userId);
    const claim = JSON.parse(claimResult);
    
    // Update documents
    claim.documents = documents;
    claim.updatedAt = new Date().toISOString();
    
    // Update claim on ledger (this requires a new chaincode function or we use getByKey and putState)
    // For now, we'll need to add an updateClaimDocuments function to chaincode
    const payload = { claimId, documents };
    const result = await invoke.invokeTransaction('updateClaimDocuments', payload, userId);
    res.status(200).send(responses.ok(result));
  } catch(err){ next(err); }
};

// Get all doctors for patient to select when granting access or submitting claims
exports.listDoctors = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const result = await query.getQuery('getAllDoctors', {}, userId);
    // Parse the JSON string result to return as array
    let doctors = [];
    try {
      doctors = JSON.parse(result);
      // Ensure doctors is an array
      if (!Array.isArray(doctors)) {
        doctors = [];
      }
    } catch (parseError) {
      console.error('Error parsing doctors:', parseError);
      doctors = [];
    }
    res.status(200).send(responses.ok(doctors));
  } catch(err){ next(err); }
};