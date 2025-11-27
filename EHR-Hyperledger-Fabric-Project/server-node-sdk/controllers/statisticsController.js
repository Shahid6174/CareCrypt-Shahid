const query = require('../query');
const responses = require('../utils/responses');
const User = require('../models/User');

/**
 * Get insurance agent statistics
 */
exports.getInsuranceAgentStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const agentId = req.params.agentId || userId;

    // Get all claims assigned to this agent
    const result = await query.getQuery('getClaimsByAgent', { agentId }, userId);
    const claims = JSON.parse(result) || [];

    const stats = {
      totalClaims: claims.length,
      pendingReview: claims.filter(c => 
        c.status === 'PENDING_INSURANCE_REVIEW'
      ).length,
      pendingApproval: claims.filter(c => 
        c.status === 'PENDING_INSURANCE_APPROVAL'
      ).length,
      approved: claims.filter(c => 
        c.status === 'INSURANCE_APPROVED'
      ).length,
      rejected: claims.filter(c => 
        c.status === 'INSURANCE_REJECTED'
      ).length,
      totalApprovedAmount: claims
        .filter(c => c.status === 'INSURANCE_APPROVED')
        .reduce((sum, c) => sum + (c.approvedAmount || 0), 0),
      averageProcessingTime: calculateAverageProcessingTime(claims),
      claimsThisMonth: claims.filter(c => 
        isThisMonth(c.createdAt)
      ).length,
      claimsThisWeek: claims.filter(c => 
        isThisWeek(c.createdAt)
      ).length,
      highValueClaims: claims.filter(c => 
        c.claimAmount > 10000
      ).length,
      autoApprovedClaims: claims.filter(c => 
        c.autoApproved === true
      ).length,
      fraudulentAttempts: claims.filter(c => 
        c.genuineScore && c.genuineScore < 50
      ).length
    };

    res.status(200).send(responses.ok(stats));
  } catch (err) {
    next(err);
  }
};

/**
 * Get doctor statistics
 */
exports.getDoctorStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const doctorId = req.params.doctorId || userId;

    // Get all patients
    const patientsResult = await query.getQuery('getPatientsByDoctor', { doctorId }, userId);
    const patients = JSON.parse(patientsResult) || [];

    // Get all claims for this doctor
    const claimsResult = await query.getQuery('getClaimsByDoctor', { doctorId }, userId);
    const claims = JSON.parse(claimsResult) || [];

    // Get all records added by this doctor
    const recordsCount = await User.countDocuments({
      'medicalRecords.doctorId': doctorId
    });

    const stats = {
      totalPatients: patients.length,
      totalClaims: claims.length,
      pendingVerification: claims.filter(c => 
        c.status === 'PENDING_DOCTOR_VERIFICATION'
      ).length,
      verified: claims.filter(c => 
        c.doctorVerified === true
      ).length,
      rejected: claims.filter(c => 
        c.status === 'DOCTOR_REJECTED'
      ).length,
      claimsThisMonth: claims.filter(c => 
        isThisMonth(c.createdAt)
      ).length,
      claimsThisWeek: claims.filter(c => 
        isThisWeek(c.createdAt)
      ).length,
      totalRecordsAdded: recordsCount,
      averageVerificationTime: calculateAverageProcessingTime(claims.filter(c => c.doctorVerified)),
      highValueClaims: claims.filter(c => 
        c.claimAmount > 10000
      ).length,
      approvedAfterVerification: claims.filter(c => 
        c.doctorVerified && (c.status === 'INSURANCE_APPROVED' || c.status === 'PENDING_INSURANCE_REVIEW' || c.status === 'PENDING_INSURANCE_APPROVAL')
      ).length,
      rejectedAfterVerification: claims.filter(c => 
        c.doctorVerified && c.status === 'INSURANCE_REJECTED'
      ).length,
      activePatients: patients.filter(p => 
        claims.some(c => c.patientId === p.patientId && isThisMonth(c.createdAt))
      ).length
    };

    res.status(200).send(responses.ok(stats));
  } catch (err) {
    next(err);
  }
};

/**
 * Get hospital admin statistics
 */
exports.getHospitalAdminStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const hospitalId = req.body.hospitalId || req.query.hospitalId;

    // Get all doctors in this hospital
    const doctorsResult = await query.getQuery('getAllDoctors', {}, userId);
    const allDoctors = JSON.parse(doctorsResult) || [];
    const hospitalDoctors = hospitalId 
      ? allDoctors.filter(d => d.hospitalId === hospitalId)
      : allDoctors;

    // Get all claims for this hospital
    let allClaims = [];
    if (hospitalId) {
      const claimsResult = await query.getQuery('getClaimsByHospital', { hospitalId }, userId);
      allClaims = JSON.parse(claimsResult) || [];
    } else {
      // Get all claims if no specific hospital
      const pendingResult = await query.getQuery('getClaimsByStatus', { status: 'PENDING_DOCTOR_VERIFICATION' }, userId);
      const reviewResult = await query.getQuery('getClaimsByStatus', { status: 'PENDING_INSURANCE_REVIEW' }, userId);
      const approvedResult = await query.getQuery('getClaimsByStatus', { status: 'INSURANCE_APPROVED' }, userId);
      const rejectedResult = await query.getQuery('getClaimsByStatus', { status: 'INSURANCE_REJECTED' }, userId);
      
      allClaims = [
        ...JSON.parse(pendingResult),
        ...JSON.parse(reviewResult),
        ...JSON.parse(approvedResult),
        ...JSON.parse(rejectedResult)
      ];
    }

    // Get all patients
    const patientsResult = await query.getQuery('getAllPatients', {}, userId);
    const allPatients = JSON.parse(patientsResult) || [];

    const stats = {
      totalDoctors: hospitalDoctors.length,
      totalPatients: allPatients.length,
      totalClaims: allClaims.length,
      pendingClaims: allClaims.filter(c => 
        c.status === 'PENDING_DOCTOR_VERIFICATION' || 
        c.status === 'PENDING_INSURANCE_REVIEW' ||
        c.status === 'PENDING_INSURANCE_APPROVAL'
      ).length,
      approvedClaims: allClaims.filter(c => 
        c.status === 'INSURANCE_APPROVED'
      ).length,
      rejectedClaims: allClaims.filter(c => 
        c.status === 'INSURANCE_REJECTED' || c.status === 'DOCTOR_REJECTED'
      ).length,
      totalClaimAmount: allClaims.reduce((sum, c) => 
        sum + (c.claimAmount || 0), 0
      ),
      totalApprovedAmount: allClaims
        .filter(c => c.status === 'INSURANCE_APPROVED')
        .reduce((sum, c) => sum + (c.approvedAmount || 0), 0),
      claimsThisMonth: allClaims.filter(c => 
        isThisMonth(c.createdAt)
      ).length,
      claimsThisWeek: allClaims.filter(c => 
        isThisWeek(c.createdAt)
      ).length,
      averageClaimAmount: allClaims.length > 0 
        ? allClaims.reduce((sum, c) => sum + (c.claimAmount || 0), 0) / allClaims.length 
        : 0,
      highValueClaims: allClaims.filter(c => 
        c.claimAmount > 10000
      ).length,
      autoApprovedClaims: allClaims.filter(c => 
        c.autoApproved === true
      ).length,
      doctorVerificationRate: allClaims.length > 0
        ? (allClaims.filter(c => c.doctorVerified).length / allClaims.length) * 100
        : 0,
      insuranceApprovalRate: allClaims.filter(c => c.doctorVerified).length > 0
        ? (allClaims.filter(c => c.status === 'INSURANCE_APPROVED').length / allClaims.filter(c => c.doctorVerified).length) * 100
        : 0
    };

    res.status(200).send(responses.ok(stats));
  } catch (err) {
    next(err);
  }
};

/**
 * Get insurance company admin statistics
 */
exports.getInsuranceCompanyStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const insuranceId = req.body.insuranceId || req.query.insuranceId;

    // Get all agents
    const agentsResult = await query.getQuery('getAllAgents', {}, userId);
    const allAgents = JSON.parse(agentsResult) || [];
    const companyAgents = insuranceId 
      ? allAgents.filter(a => a.insuranceId === insuranceId)
      : allAgents;

    // Get all claims
    const pendingResult = await query.getQuery('getClaimsByStatus', { status: 'PENDING_INSURANCE_REVIEW' }, userId);
    const approvalResult = await query.getQuery('getClaimsByStatus', { status: 'PENDING_INSURANCE_APPROVAL' }, userId);
    const approvedResult = await query.getQuery('getClaimsByStatus', { status: 'INSURANCE_APPROVED' }, userId);
    const rejectedResult = await query.getQuery('getClaimsByStatus', { status: 'INSURANCE_REJECTED' }, userId);
    
    const allClaims = [
      ...JSON.parse(pendingResult),
      ...JSON.parse(approvalResult),
      ...JSON.parse(approvedResult),
      ...JSON.parse(rejectedResult)
    ];

    const stats = {
      totalAgents: companyAgents.length,
      totalClaims: allClaims.length,
      pendingReview: allClaims.filter(c => 
        c.status === 'PENDING_INSURANCE_REVIEW'
      ).length,
      pendingApproval: allClaims.filter(c => 
        c.status === 'PENDING_INSURANCE_APPROVAL'
      ).length,
      approved: allClaims.filter(c => 
        c.status === 'INSURANCE_APPROVED'
      ).length,
      rejected: allClaims.filter(c => 
        c.status === 'INSURANCE_REJECTED'
      ).length,
      totalClaimAmount: allClaims.reduce((sum, c) => 
        sum + (c.claimAmount || 0), 0
      ),
      totalApprovedAmount: allClaims
        .filter(c => c.status === 'INSURANCE_APPROVED')
        .reduce((sum, c) => sum + (c.approvedAmount || 0), 0),
      totalSavings: allClaims
        .filter(c => c.status === 'INSURANCE_APPROVED')
        .reduce((sum, c) => sum + (c.claimAmount - (c.approvedAmount || 0)), 0),
      claimsThisMonth: allClaims.filter(c => 
        isThisMonth(c.createdAt)
      ).length,
      claimsThisWeek: allClaims.filter(c => 
        isThisWeek(c.createdAt)
      ).length,
      averageClaimAmount: allClaims.length > 0 
        ? allClaims.reduce((sum, c) => sum + (c.claimAmount || 0), 0) / allClaims.length 
        : 0,
      averageApprovedAmount: allClaims.filter(c => c.status === 'INSURANCE_APPROVED').length > 0
        ? allClaims.filter(c => c.status === 'INSURANCE_APPROVED').reduce((sum, c) => sum + (c.approvedAmount || 0), 0) / allClaims.filter(c => c.status === 'INSURANCE_APPROVED').length
        : 0,
      approvalRate: allClaims.length > 0
        ? (allClaims.filter(c => c.status === 'INSURANCE_APPROVED').length / allClaims.length) * 100
        : 0,
      rejectionRate: allClaims.length > 0
        ? (allClaims.filter(c => c.status === 'INSURANCE_REJECTED').length / allClaims.length) * 100
        : 0,
      autoApprovedClaims: allClaims.filter(c => 
        c.autoApproved === true
      ).length,
      highValueClaims: allClaims.filter(c => 
        c.claimAmount > 10000
      ).length,
      fraudDetectionRate: allClaims.filter(c => c.genuineScore).length > 0
        ? (allClaims.filter(c => c.genuineScore && c.genuineScore < 50).length / allClaims.filter(c => c.genuineScore).length) * 100
        : 0
    };

    res.status(200).send(responses.ok(stats));
  } catch (err) {
    next(err);
  }
};

// Helper functions
function isThisMonth(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  return date.getMonth() === now.getMonth() && 
         date.getFullYear() === now.getFullYear();
}

function isThisWeek(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return date >= weekAgo && date <= now;
}

function calculateAverageProcessingTime(claims) {
  const processedClaims = claims.filter(c => 
    c.createdAt && c.updatedAt && c.createdAt !== c.updatedAt
  );

  if (processedClaims.length === 0) return 0;

  const totalTime = processedClaims.reduce((sum, c) => {
    const created = new Date(c.createdAt);
    const updated = new Date(c.updatedAt);
    return sum + (updated - created);
  }, 0);

  // Return average in hours
  return (totalTime / processedClaims.length) / (1000 * 60 * 60);
}

module.exports = exports;

