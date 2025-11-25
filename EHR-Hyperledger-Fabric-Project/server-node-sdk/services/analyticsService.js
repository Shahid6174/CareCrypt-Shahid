const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Analytics Service
 * Provides analytics and statistics for all user roles
 */

class AnalyticsService {
  /**
   * Patient Analytics
   */
  async getPatientAnalytics(userId) {
    const user = await User.findOne({ userId });
    if (!user) throw new Error('User not found');
    
    const stats = user.rewards?.statistics || {};
    const fraudStatus = user.fraudDetection || {};
    
    return {
      overview: {
        totalClaims: stats.claimsSubmitted || 0,
        genuineClaims: stats.genuineClaims || 0,
        documentsUploaded: stats.documentsUploaded || 0,
        totalCoins: user.rewards?.totalCoins || 0,
        level: user.rewards?.level || 1,
        badge: user.rewards?.badge || 'Beginner',
        streak: user.rewards?.streak?.currentStreak || 0
      },
      claimMetrics: {
        approvalRate: this.calculateRate(stats.genuineClaims, stats.claimsSubmitted),
        averageProcessingTime: '2-3 days', // This would come from claim data
        pendingClaims: 0, // Would come from blockchain query
        approvedClaims: stats.genuineClaims || 0,
        rejectedClaims: (stats.claimsSubmitted || 0) - (stats.genuineClaims || 0)
      },
      fraudMetrics: {
        attemptCount: fraudStatus.attemptCount || 0,
        isBlocked: fraudStatus.isBlocked || false,
        warnings: fraudStatus.warnings?.length || 0,
        cleanRecord: (fraudStatus.attemptCount || 0) === 0
      },
      activityMetrics: {
        lastActivity: user.rewards?.streak?.lastActivity || user.updatedAt,
        currentStreak: user.rewards?.streak?.currentStreak || 0,
        longestStreak: user.rewards?.streak?.longestStreak || 0,
        achievements: user.rewards?.achievements?.length || 0
      },
      recentActivity: user.rewards?.history?.slice(-5).reverse() || []
    };
  }
  
  /**
   * Doctor Analytics
   */
  async getDoctorAnalytics(userId) {
    const user = await User.findOne({ userId });
    if (!user) throw new Error('User not found');
    
    const stats = user.rewards?.statistics || {};
    
    return {
      overview: {
        recordsAdded: stats.recordsAdded || 0,
        claimsVerified: stats.claimsVerified || 0,
        accurateVerifications: stats.accurateVerifications || 0,
        totalCoins: user.rewards?.totalCoins || 0,
        level: user.rewards?.level || 1,
        badge: user.rewards?.badge || 'Beginner',
        streak: user.rewards?.streak?.currentStreak || 0
      },
      performanceMetrics: {
        accuracyRate: this.calculateRate(stats.accurateVerifications, stats.claimsVerified),
        averageVerificationTime: '1-2 hours',
        patientsServed: 0, // Would come from blockchain
        recordsThisMonth: this.filterThisMonth(user.rewards?.history || [], 'RECORD_ADDED').length
      },
      activityMetrics: {
        lastActivity: user.rewards?.streak?.lastActivity || user.updatedAt,
        currentStreak: user.rewards?.streak?.currentStreak || 0,
        longestStreak: user.rewards?.streak?.longestStreak || 0,
        achievements: user.rewards?.achievements?.length || 0
      },
      recentActivity: user.rewards?.history?.slice(-5).reverse() || []
    };
  }
  
  /**
   * Insurance Agent Analytics
   */
  async getInsuranceAgentAnalytics(userId) {
    const user = await User.findOne({ userId });
    if (!user) throw new Error('User not found');
    
    const stats = user.rewards?.statistics || {};
    
    return {
      overview: {
        claimsReviewed: stats.claimsReviewed || 0,
        accurateDecisions: stats.accurateDecisions || 0,
        fraudsDetected: this.countFraudDetections(user.rewards?.history || []),
        totalCoins: user.rewards?.totalCoins || 0,
        level: user.rewards?.level || 1,
        badge: user.rewards?.badge || 'Beginner',
        streak: user.rewards?.streak?.currentStreak || 0
      },
      performanceMetrics: {
        accuracyRate: this.calculateRate(stats.accurateDecisions, stats.claimsReviewed),
        averageReviewTime: '2-4 hours',
        approvalRate: 75, // Would come from claim data
        reviewsThisMonth: this.filterThisMonth(user.rewards?.history || [], 'CLAIM_REVIEWED').length
      },
      fraudMetrics: {
        fraudsDetected: this.countFraudDetections(user.rewards?.history || []),
        falsePositives: 0, // Would need tracking
        detectionAccuracy: 92
      },
      activityMetrics: {
        lastActivity: user.rewards?.streak?.lastActivity || user.updatedAt,
        currentStreak: user.rewards?.streak?.currentStreak || 0,
        longestStreak: user.rewards?.streak?.longestStreak || 0,
        achievements: user.rewards?.achievements?.length || 0
      },
      recentActivity: user.rewards?.history?.slice(-5).reverse() || []
    };
  }
  
  /**
   * Admin Analytics
   */
  async getAdminAnalytics() {
    // System-wide statistics
    const totalUsers = await User.countDocuments();
    const patientCount = await User.countDocuments({ role: 'patient' });
    const doctorCount = await User.countDocuments({ role: 'doctor' });
    const agentCount = await User.countDocuments({ role: 'insuranceAgent' });
    const onChainUsers = await User.countDocuments({ registeredOnChain: true });
    
    const approvalAggregation = await User.aggregate([
      { $group: { _id: '$approvalStatus', total: { $sum: 1 } } }
    ]);
    const approvalMap = approvalAggregation.reduce((acc, bucket) => {
      const key = bucket?._id || 'pending';
      acc[key] = bucket.total;
      return acc;
    }, {});
    const pendingApprovals = approvalMap.pending || 0;
    const approvedUsers = approvalMap.approved || 0;
    const rejectedApprovals = approvalMap.rejected || 0;
    
    const blockedUsers = await User.countDocuments({ 'fraudDetection.isBlocked': true });
    const fraudAttempts = await User.countDocuments({ 'fraudDetection.attemptCount': { $gt: 0 } });
    
    const totalNotifications = await Notification.countDocuments();
    const unreadNotifications = await Notification.countDocuments({ read: false });
    
    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRegistrations = await User.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });
    
    // Top users by coins
    const topUsers = await User.find({ 'rewards.totalCoins': { $gt: 0 } })
      .sort({ 'rewards.totalCoins': -1 })
      .limit(5)
      .select('userId name role rewards.totalCoins rewards.badge');
    
    const transactionTypes = ['claim_submitted', 'claim_approved', 'claim_rejected', 'claim_verified'];
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const totalTransactions = await Notification.countDocuments({ type: { $in: transactionTypes } });
    const transactions24h = await Notification.countDocuments({
      type: { $in: transactionTypes },
      createdAt: { $gte: last24Hours }
    });
    
    const pendingUsers = await User.find({ approvalStatus: 'pending' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('userId name role email createdAt city hospitalId insuranceId');
    
    return {
      overview: {
        totalUsers,
        patientCount,
        doctorCount,
        agentCount,
        recentRegistrations,
        pendingApprovals,
        onChainUsers
      },
      fraudMetrics: {
        blockedUsers,
        usersWithAttempts: fraudAttempts,
        fraudRate: this.calculateRate(fraudAttempts, totalUsers),
        systemHealth: blockedUsers < 10 ? 'Healthy' : 'Attention Required'
      },
      notificationMetrics: {
        totalNotifications,
        unreadNotifications,
        readRate: this.calculateRate(totalNotifications - unreadNotifications, totalNotifications)
      },
      engagementMetrics: {
        activeUsers: await this.getActiveUsersCount(),
        averageCoinsPerUser: await this.getAverageCoins(),
        topUsers: topUsers.map(u => ({
          userId: u.userId,
          name: u.name,
          role: u.role,
          coins: u.rewards?.totalCoins || 0,
          badge: u.rewards?.badge || 'Beginner'
        }))
      },
      approvalMetrics: {
        pending: pendingApprovals,
        approved: approvedUsers,
        rejected: rejectedApprovals,
        pendingUsers
      },
      transactionMetrics: {
        totalTransactions,
        transactions24h,
        registeredOnChain: onChainUsers
      },
      systemMetrics: {
        databaseSize: 'N/A', // Would need system query
        apiResponseTime: '< 500ms',
        uptime: '99.9%',
        lastBackup: 'N/A'
      }
    };
  }
  
  /**
   * Get list of all doctors
   */
  async getDoctorsList() {
    const doctors = await User.find({ role: 'doctor', registeredOnChain: true })
      .select('userId name hospitalId metadata rewards.badge rewards.level')
      .sort({ name: 1 });
    
    return doctors.map(d => ({
      userId: d.userId,
      name: d.name,
      hospitalId: d.hospitalId || 'N/A',
      specialization: d.metadata?.specialization || 'General',
      badge: d.rewards?.badge || 'Beginner',
      level: d.rewards?.level || 1,
      verified: d.registeredOnChain
    }));
  }
  
  /**
   * Get list of all patients
   */
  async getPatientsList() {
    const patients = await User.find({ role: 'patient', registeredOnChain: true })
      .select('userId name city metadata rewards.badge fraudDetection.isBlocked')
      .sort({ name: 1 });
    
    return patients.map(p => ({
      userId: p.userId,
      name: p.name,
      city: p.city || 'N/A',
      badge: p.rewards?.badge || 'Beginner',
      isBlocked: p.fraudDetection?.isBlocked || false,
      verified: p.registeredOnChain
    }));
  }
  
  /**
   * Get list of insurance agents
   */
  async getInsuranceAgentsList() {
    const agents = await User.find({ role: 'insuranceAgent', registeredOnChain: true })
      .select('userId name insuranceId metadata rewards.badge rewards.level')
      .sort({ name: 1 });
    
    return agents.map(a => ({
      userId: a.userId,
      name: a.name,
      insuranceId: a.insuranceId || 'N/A',
      company: a.metadata?.company || 'N/A',
      badge: a.rewards?.badge || 'Beginner',
      level: a.rewards?.level || 1,
      verified: a.registeredOnChain
    }));
  }
  
  /**
   * Get list of hospitals
   */
  async getHospitalsList() {
    // Extract unique hospitals from doctors
    const doctors = await User.find({ role: 'doctor', hospitalId: { $exists: true } })
      .select('hospitalId metadata.hospitalName')
      .distinct('hospitalId');
    
    // In a real system, this would be from a separate Hospital collection
    return doctors.map(hId => ({
      hospitalId: hId,
      name: `Hospital ${hId}`,
      location: 'N/A',
      verified: true
    }));
  }
  
  /**
   * Get list of insurance companies
   */
  async getInsuranceCompaniesList() {
    // Extract unique insurance companies from agents
    const agents = await User.find({ role: 'insuranceAgent', insuranceId: { $exists: true } })
      .select('insuranceId metadata.company')
      .distinct('insuranceId');
    
    return agents.map(iId => ({
      insuranceId: iId,
      name: `Insurance ${iId}`,
      verified: true
    }));
  }
  
  /**
   * Helper: Calculate percentage rate
   */
  calculateRate(numerator, denominator) {
    if (!denominator || denominator === 0) return 0;
    return Math.round((numerator / denominator) * 100);
  }
  
  /**
   * Helper: Filter activities from this month
   */
  filterThisMonth(history, action) {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    return history.filter(h => {
      if (action && h.action !== action) return false;
      const date = new Date(h.timestamp);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });
  }
  
  /**
   * Helper: Count fraud detections
   */
  countFraudDetections(history) {
    return history.filter(h => 
      h.description && h.description.toLowerCase().includes('fraud')
    ).length;
  }
  
  /**
   * Helper: Get active users count (activity in last 7 days)
   */
  async getActiveUsersCount() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return await User.countDocuments({
      'rewards.streak.lastActivity': { $gte: sevenDaysAgo }
    });
  }
  
  /**
   * Helper: Get average coins per user
   */
  async getAverageCoins() {
    const result = await User.aggregate([
      { $match: { 'rewards.totalCoins': { $exists: true } } },
      { $group: { _id: null, avgCoins: { $avg: '$rewards.totalCoins' } } }
    ]);
    
    return result.length > 0 ? Math.round(result[0].avgCoins) : 0;
  }
}

module.exports = new AnalyticsService();

