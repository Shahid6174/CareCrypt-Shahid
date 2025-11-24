const User = require('../models/User');

/**
 * Reward Service
 * Handles coin rewards and gamification for all user roles
 */

class RewardService {
  constructor() {
    // Reward points for different actions
    this.REWARDS = {
      // Patient rewards
      PATIENT_CLAIM_SUBMITTED: 10,
      PATIENT_GENUINE_CLAIM: 25,
      PATIENT_DOCUMENT_UPLOADED: 5,
      PATIENT_CLEAN_RECORD_BONUS: 50,
      PATIENT_STREAK_BONUS: 15,
      
      // Doctor rewards
      DOCTOR_RECORD_ADDED: 10,
      DOCTOR_CLAIM_VERIFIED: 15,
      DOCTOR_ACCURATE_VERIFICATION: 25,
      DOCTOR_MONTHLY_EXCELLENCE: 100,
      
      // Insurance Agent rewards
      AGENT_CLAIM_REVIEWED: 15,
      AGENT_ACCURATE_DECISION: 20,
      AGENT_FRAUD_DETECTED: 30,
      AGENT_FAST_PROCESSING: 10,
      
      // Admin rewards
      ADMIN_USER_APPROVED: 10,
      ADMIN_FRAUD_MANAGED: 30,
      ADMIN_SYSTEM_MAINTENANCE: 50
    };
    
    // Badge thresholds
    this.BADGE_THRESHOLDS = {
      Beginner: 0,
      Bronze: 100,
      Silver: 500,
      Gold: 1500,
      Platinum: 3000,
      Diamond: 6000,
      Legend: 10000
    };
    
    // Level calculation (every 100 coins = 1 level)
    this.COINS_PER_LEVEL = 100;
  }
  
  /**
   * Award coins to user
   */
  async awardCoins(userId, coins, action, description, relatedId = null) {
    try {
      const user = await User.findOne({ userId });
      if (!user) throw new Error('User not found');
      
      // Initialize rewards if not exists
      if (!user.rewards) {
        user.rewards = {
          totalCoins: 0,
          level: 1,
          badge: 'Beginner',
          streak: { currentStreak: 0, longestStreak: 0 },
          achievements: [],
          history: [],
          statistics: {}
        };
      }
      
      // Add coins
      user.rewards.totalCoins += coins;
      
      // Update level
      const newLevel = Math.floor(user.rewards.totalCoins / this.COINS_PER_LEVEL) + 1;
      const leveledUp = newLevel > user.rewards.level;
      user.rewards.level = newLevel;
      
      // Update badge
      const newBadge = this.calculateBadge(user.rewards.totalCoins);
      const badgeUpgraded = newBadge !== user.rewards.badge;
      user.rewards.badge = newBadge;
      
      // Add to history
      user.rewards.history.push({
        action,
        coins,
        timestamp: new Date(),
        description,
        relatedId
      });
      
      // Update streak
      this.updateStreak(user);
      
      // Check for achievements
      const newAchievements = await this.checkAchievements(user, action, coins);
      
      await user.save();
      
      return {
        success: true,
        coinsAwarded: coins,
        totalCoins: user.rewards.totalCoins,
        level: user.rewards.level,
        leveledUp,
        badge: user.rewards.badge,
        badgeUpgraded,
        newAchievements
      };
    } catch (error) {
      console.error('Error awarding coins:', error);
      throw error;
    }
  }
  
  /**
   * Calculate badge based on total coins
   */
  calculateBadge(totalCoins) {
    if (totalCoins >= this.BADGE_THRESHOLDS.Legend) return 'Legend';
    if (totalCoins >= this.BADGE_THRESHOLDS.Diamond) return 'Diamond';
    if (totalCoins >= this.BADGE_THRESHOLDS.Platinum) return 'Platinum';
    if (totalCoins >= this.BADGE_THRESHOLDS.Gold) return 'Gold';
    if (totalCoins >= this.BADGE_THRESHOLDS.Silver) return 'Silver';
    if (totalCoins >= this.BADGE_THRESHOLDS.Bronze) return 'Bronze';
    return 'Beginner';
  }
  
  /**
   * Update user streak
   */
  updateStreak(user) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!user.rewards.streak.lastActivity) {
      user.rewards.streak.currentStreak = 1;
      user.rewards.streak.longestStreak = 1;
      user.rewards.streak.lastActivity = today;
      return;
    }
    
    const lastActivity = new Date(user.rewards.streak.lastActivity);
    lastActivity.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, don't update streak
      return;
    } else if (daysDiff === 1) {
      // Consecutive day, increase streak
      user.rewards.streak.currentStreak += 1;
      user.rewards.streak.longestStreak = Math.max(
        user.rewards.streak.longestStreak,
        user.rewards.streak.currentStreak
      );
    } else {
      // Streak broken, reset
      user.rewards.streak.currentStreak = 1;
    }
    
    user.rewards.streak.lastActivity = today;
  }
  
  /**
   * Check and award achievements
   */
  async checkAchievements(user, action, coins) {
    const newAchievements = [];
    
    // First claim achievement
    if (action === 'CLAIM_SUBMITTED' && user.rewards.statistics.claimsSubmitted === 1) {
      const achievement = {
        name: 'First Claim',
        description: 'Submitted your first insurance claim',
        coinsEarned: 50,
        earnedAt: new Date(),
        category: 'milestone'
      };
      user.rewards.achievements.push(achievement);
      user.rewards.totalCoins += 50;
      newAchievements.push(achievement);
    }
    
    // Perfect record achievement (10 genuine claims)
    if (user.rewards.statistics.genuineClaims === 10) {
      const achievement = {
        name: 'Perfect Record',
        description: '10 genuine claims submitted',
        coinsEarned: 100,
        earnedAt: new Date(),
        category: 'excellence'
      };
      user.rewards.achievements.push(achievement);
      user.rewards.totalCoins += 100;
      newAchievements.push(achievement);
    }
    
    // Century achievement (100+ claims)
    if (user.rewards.statistics.claimsSubmitted === 100) {
      const achievement = {
        name: 'Century',
        description: '100 claims submitted',
        coinsEarned: 200,
        earnedAt: new Date(),
        category: 'milestone'
      };
      user.rewards.achievements.push(achievement);
      user.rewards.totalCoins += 200;
      newAchievements.push(achievement);
    }
    
    // Streak achievements
    if (user.rewards.streak.currentStreak === 7) {
      const achievement = {
        name: 'Week Warrior',
        description: '7 day activity streak',
        coinsEarned: 75,
        earnedAt: new Date(),
        category: 'streak'
      };
      user.rewards.achievements.push(achievement);
      user.rewards.totalCoins += 75;
      newAchievements.push(achievement);
    }
    
    if (user.rewards.streak.currentStreak === 30) {
      const achievement = {
        name: 'Monthly Master',
        description: '30 day activity streak',
        coinsEarned: 300,
        earnedAt: new Date(),
        category: 'streak'
      };
      user.rewards.achievements.push(achievement);
      user.rewards.totalCoins += 300;
      newAchievements.push(achievement);
    }
    
    return newAchievements;
  }
  
  /**
   * Patient: Reward for claim submission
   */
  async rewardClaimSubmitted(userId, claimId, isGenuine = false, genuineScore = 0) {
    const user = await User.findOne({ userId });
    if (!user) return;
    
    // Update statistics
    if (!user.rewards.statistics) user.rewards.statistics = {};
    user.rewards.statistics.claimsSubmitted = (user.rewards.statistics.claimsSubmitted || 0) + 1;
    
    let coins = this.REWARDS.PATIENT_CLAIM_SUBMITTED;
    let description = 'Submitted insurance claim';
    
    // Bonus for genuine claim
    if (isGenuine && genuineScore >= 90) {
      coins += this.REWARDS.PATIENT_GENUINE_CLAIM;
      description = `Submitted genuine claim (${genuineScore}% confidence)`;
      user.rewards.statistics.genuineClaims = (user.rewards.statistics.genuineClaims || 0) + 1;
    }
    
    // Bonus for clean record (no fraud attempts)
    if (!user.fraudDetection || user.fraudDetection.attemptCount === 0) {
      if (user.rewards.statistics.claimsSubmitted % 5 === 0) {
        coins += this.REWARDS.PATIENT_CLEAN_RECORD_BONUS;
        description += ' + Clean record bonus';
      }
    }
    
    await user.save();
    
    return await this.awardCoins(userId, coins, 'CLAIM_SUBMITTED', description, claimId);
  }
  
  /**
   * Patient: Reward for document upload
   */
  async rewardDocumentUploaded(userId, documentId) {
    const user = await User.findOne({ userId });
    if (!user) return;
    
    if (!user.rewards.statistics) user.rewards.statistics = {};
    user.rewards.statistics.documentsUploaded = (user.rewards.statistics.documentsUploaded || 0) + 1;
    await user.save();
    
    return await this.awardCoins(
      userId,
      this.REWARDS.PATIENT_DOCUMENT_UPLOADED,
      'DOCUMENT_UPLOADED',
      'Uploaded medical document',
      documentId
    );
  }
  
  /**
   * Doctor: Reward for adding medical record
   */
  async rewardRecordAdded(userId, recordId) {
    const user = await User.findOne({ userId });
    if (!user) return;
    
    if (!user.rewards.statistics) user.rewards.statistics = {};
    user.rewards.statistics.recordsAdded = (user.rewards.statistics.recordsAdded || 0) + 1;
    await user.save();
    
    return await this.awardCoins(
      userId,
      this.REWARDS.DOCTOR_RECORD_ADDED,
      'RECORD_ADDED',
      'Added medical record',
      recordId
    );
  }
  
  /**
   * Doctor: Reward for claim verification
   */
  async rewardClaimVerified(userId, claimId, isAccurate = false) {
    const user = await User.findOne({ userId });
    if (!user) return;
    
    if (!user.rewards.statistics) user.rewards.statistics = {};
    user.rewards.statistics.claimsVerified = (user.rewards.statistics.claimsVerified || 0) + 1;
    
    let coins = this.REWARDS.DOCTOR_CLAIM_VERIFIED;
    let description = 'Verified insurance claim';
    
    if (isAccurate) {
      coins += this.REWARDS.DOCTOR_ACCURATE_VERIFICATION;
      description = 'Accurately verified claim';
    }
    
    await user.save();
    
    return await this.awardCoins(userId, coins, 'CLAIM_VERIFIED', description, claimId);
  }
  
  /**
   * Insurance Agent: Reward for claim review
   */
  async rewardClaimReviewed(userId, claimId, isAccurate = false, fraudDetected = false) {
    const user = await User.findOne({ userId });
    if (!user) return;
    
    if (!user.rewards.statistics) user.rewards.statistics = {};
    user.rewards.statistics.claimsReviewed = (user.rewards.statistics.claimsReviewed || 0) + 1;
    
    let coins = this.REWARDS.AGENT_CLAIM_REVIEWED;
    let description = 'Reviewed insurance claim';
    
    if (isAccurate) {
      coins += this.REWARDS.AGENT_ACCURATE_DECISION;
      description = 'Accurately reviewed claim';
      user.rewards.statistics.accurateDecisions = (user.rewards.statistics.accurateDecisions || 0) + 1;
    }
    
    if (fraudDetected) {
      coins += this.REWARDS.AGENT_FRAUD_DETECTED;
      description = 'Detected fraudulent claim';
    }
    
    await user.save();
    
    return await this.awardCoins(userId, coins, 'CLAIM_REVIEWED', description, claimId);
  }
  
  /**
   * Admin: Reward for user approval
   */
  async rewardUserApproved(userId, approvedUserId) {
    return await this.awardCoins(
      userId,
      this.REWARDS.ADMIN_USER_APPROVED,
      'USER_APPROVED',
      'Approved new user registration',
      approvedUserId
    );
  }
  
  /**
   * Admin: Reward for fraud management
   */
  async rewardFraudManaged(userId, fraudUserId) {
    return await this.awardCoins(
      userId,
      this.REWARDS.ADMIN_FRAUD_MANAGED,
      'FRAUD_MANAGED',
      'Managed fraudulent user',
      fraudUserId
    );
  }
  
  /**
   * Get user rewards summary
   */
  async getRewardsSummary(userId) {
    const user = await User.findOne({ userId });
    if (!user) throw new Error('User not found');
    
    if (!user.rewards) {
      return {
        totalCoins: 0,
        level: 1,
        badge: 'Beginner',
        streak: { currentStreak: 0, longestStreak: 0 },
        achievements: [],
        recentHistory: [],
        statistics: {},
        nextBadge: 'Bronze',
        coinsToNextBadge: 100,
        coinsToNextLevel: 100
      };
    }
    
    // Calculate progress
    const nextBadge = this.getNextBadge(user.rewards.badge);
    const coinsToNextBadge = nextBadge 
      ? this.BADGE_THRESHOLDS[nextBadge] - user.rewards.totalCoins 
      : 0;
    const coinsToNextLevel = (user.rewards.level * this.COINS_PER_LEVEL) - user.rewards.totalCoins;
    
    return {
      totalCoins: user.rewards.totalCoins,
      level: user.rewards.level,
      badge: user.rewards.badge,
      streak: user.rewards.streak,
      achievements: user.rewards.achievements,
      recentHistory: user.rewards.history.slice(-10).reverse(),
      statistics: user.rewards.statistics,
      nextBadge,
      coinsToNextBadge,
      coinsToNextLevel
    };
  }
  
  /**
   * Get next badge
   */
  getNextBadge(currentBadge) {
    const badges = ['Beginner', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legend'];
    const currentIndex = badges.indexOf(currentBadge);
    return currentIndex < badges.length - 1 ? badges[currentIndex + 1] : null;
  }
  
  /**
   * Get leaderboard
   */
  async getLeaderboard(role = null, limit = 10) {
    const query = role ? { role } : {};
    
    const users = await User.find(query)
      .sort({ 'rewards.totalCoins': -1 })
      .limit(limit)
      .select('userId name role rewards.totalCoins rewards.level rewards.badge');
    
    return users.map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      name: user.name,
      role: user.role,
      totalCoins: user.rewards?.totalCoins || 0,
      level: user.rewards?.level || 1,
      badge: user.rewards?.badge || 'Beginner'
    }));
  }
}

module.exports = new RewardService();

