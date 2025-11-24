const chatbotService = require('../services/chatbotService');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const responses = require('../utils/responses');
const { v4: uuidv4 } = require('uuid');

/**
 * Chatbot Controller
 * Handles chatbot interactions
 */

/**
 * Start a new conversation
 */
exports.startConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user to determine role
    let user = await User.findOne({ userId });
    // Allow env-configured admin (local/testing) to start conversation even if not in MongoDB
    const ADMIN_USERID = process.env.ADMIN_USERID || 'hospitalAdmin';
    if (!user) {
      if (userId === ADMIN_USERID) {
        user = { role: 'admin', name: 'System Admin', userId: ADMIN_USERID };
      } else {
        return res.status(404).send(responses.error('User not found'));
      }
    }

    // Create new conversation
    const sessionId = uuidv4();
    const conversation = new Conversation({
      userId,
      sessionId,
      userRole: user.role,
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress
      }
    });

    // Add welcome message
    const welcomeMessage = getWelcomeMessage(user.role, user.name);
    conversation.addMessage('assistant', welcomeMessage, { fallback: true });

    await conversation.save();

    res.status(200).send(responses.ok({
      sessionId,
      message: welcomeMessage,
      suggestions: chatbotService.getQuickSuggestions(user.role)
    }));
  } catch (err) {
    next(err);
  }
};

/**
 * Send message to chatbot
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).send(responses.error('Session ID and message are required'));
    }

    // Get conversation
    let conversation = await Conversation.findOne({ userId, sessionId, active: true });
    
    if (!conversation) {
      return res.status(404).send(responses.error('Conversation not found or expired'));
    }

    // Add user message to history
    conversation.addMessage('user', message);

    // Get conversation history for context
    const history = conversation.getRecentMessages(10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Analyze intent
    const intent = chatbotService.analyzeIntent(message);

    // Get chatbot response
    const botResponse = await chatbotService.chat(
      message,
      history.slice(0, -1), // Exclude the message we just added
      conversation.userRole
    );

    // Add assistant message to history
    conversation.addMessage('assistant', botResponse.message, {
      tokensUsed: botResponse.tokensUsed,
      intent: intent,
      fallback: botResponse.fallback
    });

    await conversation.save();

    res.status(200).send(responses.ok({
      message: botResponse.message,
      timestamp: botResponse.timestamp,
      intent: intent,
      suggestions: getContextualSuggestions(intent, conversation.userRole),
      tokensUsed: botResponse.tokensUsed
    }));
  } catch (err) {
    next(err);
  }
};

/**
 * Get conversation history
 */
exports.getConversationHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const conversation = await Conversation.findOne({ userId, sessionId });
    
    if (!conversation) {
      return res.status(404).send(responses.error('Conversation not found'));
    }

    res.status(200).send(responses.ok({
      sessionId: conversation.sessionId,
      messages: conversation.messages,
      active: conversation.active,
      metadata: conversation.metadata
    }));
  } catch (err) {
    next(err);
  }
};

/**
 * Get all conversations for user
 */
exports.getUserConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 10, active } = req.query;

    const query = { userId };
    if (active !== undefined) {
      query.active = active === 'true';
    }

    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .select('sessionId userRole active metadata createdAt updatedAt');

    res.status(200).send(responses.ok(conversations));
  } catch (err) {
    next(err);
  }
};

/**
 * End conversation
 */
exports.endConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const conversation = await Conversation.findOne({ userId, sessionId, active: true });
    
    if (!conversation) {
      return res.status(404).send(responses.error('Active conversation not found'));
    }

    conversation.endSession();
    await conversation.save();

    res.status(200).send(responses.ok({
      message: 'Conversation ended',
      sessionId: conversation.sessionId,
      totalMessages: conversation.metadata.totalMessages,
      duration: conversation.metadata.endTime - conversation.metadata.startTime
    }));
  } catch (err) {
    next(err);
  }
};

/**
 * Get quick suggestions
 */
exports.getSuggestions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    let user = await User.findOne({ userId });
    const ADMIN_USERID = process.env.ADMIN_USERID || 'hospitalAdmin';
    if (!user && userId === ADMIN_USERID) {
      user = { role: 'admin', name: 'System Admin', userId: ADMIN_USERID };
    }
    if (!user) return res.status(404).send(responses.error('User not found'));

    const suggestions = chatbotService.getQuickSuggestions(user.role);

    res.status(200).send(responses.ok({
      suggestions,
      role: user.role
    }));
  } catch (err) {
    next(err);
  }
};

/**
 * Get chatbot statistics (Admin only)
 */
exports.getChatbotStats = async (req, res, next) => {
  try {
    const totalConversations = await Conversation.countDocuments({});
    const activeConversations = await Conversation.countDocuments({ active: true });
    
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentConversations = await Conversation.countDocuments({
      createdAt: { $gte: last24Hours }
    });

    // Get average messages per conversation
    const avgMessagesResult = await Conversation.aggregate([
      {
        $group: {
          _id: null,
          avgMessages: { $avg: '$metadata.totalMessages' },
          avgTokens: { $avg: '$metadata.totalTokens' }
        }
      }
    ]);

    const stats = {
      totalConversations,
      activeConversations,
      recentConversations24h: recentConversations,
      averageMessagesPerConversation: avgMessagesResult[0]?.avgMessages.toFixed(2) || 0,
      averageTokensPerConversation: avgMessagesResult[0]?.avgTokens.toFixed(0) || 0
    };

    res.status(200).send(responses.ok(stats));
  } catch (err) {
    next(err);
  }
};

/**
 * Helper: Get welcome message based on user role
 */
function getWelcomeMessage(role, name) {
  const messages = {
    patient: `Hello ${name}! 👋 I'm your EHR CareCrypt assistant. I can help you with submitting claims, uploading documents, managing your medical records, and understanding the system. What would you like to know?`,
    
    doctor: `Hello Dr. ${name}! 👋 I'm here to assist you with adding medical records, verifying claims, and managing your patients. How can I help you today?`,
    
    insuranceAgent: `Hello ${name}! 👋 I'm your assistant for reviewing claims, checking fraud reports, and managing approvals. What do you need help with?`,
    
    admin: `Hello ${name}! 👋 I'm here to help you manage the system, monitor fraud statistics, and oversee user registrations. What would you like to do?`
  };

  return messages[role] || messages.patient;
}

/**
 * Helper: Get contextual suggestions based on intent
 */
function getContextualSuggestions(intent, role) {
  const suggestions = {
    claim_submission: [
      'What documents do I need?',
      'How long does approval take?',
      'Can I edit my claim after submission?'
    ],
    document_upload: [
      'What file formats are supported?',
      'How do I categorize documents?',
      'Can I delete uploaded documents?'
    ],
    fraud_help: [
      'How can I avoid fraud warnings?',
      'What happens after 3 warnings?',
      'How do I appeal a fraud decision?'
    ],
    access_control: [
      'How do I grant access to a new doctor?',
      'Can I revoke access anytime?',
      'Who can see my medical records?'
    ],
    general: chatbotService.getQuickSuggestions(role)
  };

  return suggestions[intent] || suggestions.general;
}

