const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['patient', 'doctor', 'insuranceAgent', 'hospital', 'insuranceAdmin']
  },
  // Role-specific fields
  name: {
    type: String,
    required: true
  },
  // Patient fields
  dob: String,
  city: String,
  // Doctor fields
  hospitalId: String,
  // Insurance Agent fields
  insuranceId: String,
  // Hospital/Insurance Admin fields
  address: String,
  // Registration status
  registeredOnChain: {
    type: Boolean,
    default: false
  },
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Patient documents
  documents: [{
    documentId: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      enum: ['medical_record', 'prescription', 'lab_report', 'scan', 'insurance', 'other'],
      default: 'other'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  // Fraud detection
  fraudDetection: {
    attemptCount: {
      type: Number,
      default: 0
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    blockedAt: Date,
    warnings: [{
      claimId: String,
      reason: String,
      detectedAt: {
        type: Date,
        default: Date.now
      },
      fraudScore: Number,
      details: String
    }],
    lastWarningAt: Date
  },
  // Rewards & Gamification System
  rewards: {
    totalCoins: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    badge: {
      type: String,
      enum: ['Beginner', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legend'],
      default: 'Beginner'
    },
    streak: {
      currentStreak: {
        type: Number,
        default: 0
      },
      longestStreak: {
        type: Number,
        default: 0
      },
      lastActivity: Date
    },
    achievements: [{
      name: String,
      description: String,
      coinsEarned: Number,
      earnedAt: {
        type: Date,
        default: Date.now
      },
      category: String
    }],
    history: [{
      action: String,
      coins: Number,
      timestamp: {
        type: Date,
        default: Date.now
      },
      description: String,
      relatedId: String
    }],
    statistics: {
      claimsSubmitted: { type: Number, default: 0 },
      genuineClaims: { type: Number, default: 0 },
      documentsUploaded: { type: Number, default: 0 },
      recordsAdded: { type: Number, default: 0 },
      claimsVerified: { type: Number, default: 0 },
      claimsReviewed: { type: Number, default: 0 },
      accurateDecisions: { type: Number, default: 0 }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

