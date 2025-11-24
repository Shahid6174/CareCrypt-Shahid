const mongoose = require('mongoose');

/**
 * Conversation Model
 * Stores chatbot conversation history
 */

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  tokensUsed: {
    prompt: Number,
    completion: Number,
    total: Number
  },
  intent: String,
  fallback: {
    type: Boolean,
    default: false
  }
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userRole: {
    type: String,
    enum: ['patient', 'doctor', 'insuranceAgent', 'admin'],
    required: true
  },
  messages: [messageSchema],
  active: {
    type: Boolean,
    default: true
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: Date,
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // Auto-delete after 30 days
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps
conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Update metadata
  this.metadata.totalMessages = this.messages.length;
  this.metadata.totalTokens = this.messages.reduce(
    (sum, msg) => sum + (msg.tokensUsed?.total || 0),
    0
  );
  
  next();
});

// Methods
conversationSchema.methods.addMessage = function(role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    timestamp: new Date(),
    ...metadata
  });
  
  return this;
};

conversationSchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages.slice(-limit);
};

conversationSchema.methods.endSession = function() {
  this.active = false;
  this.metadata.endTime = new Date();
  return this;
};

module.exports = mongoose.model('Conversation', conversationSchema);

