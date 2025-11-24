const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const requireUser = require('../middleware/requireUser');

// Start new conversation
router.post('/start', requireUser, chatbotController.startConversation);

// Send message
router.post('/message', requireUser, chatbotController.sendMessage);

// Get conversation history
router.get('/conversation/:sessionId', requireUser, chatbotController.getConversationHistory);

// Get all user conversations
router.get('/conversations', requireUser, chatbotController.getUserConversations);

// End conversation
router.post('/conversation/:sessionId/end', requireUser, chatbotController.endConversation);

// Get suggestions
router.get('/suggestions', requireUser, chatbotController.getSuggestions);

// Get chatbot statistics (Admin)
router.get('/stats', requireUser, chatbotController.getChatbotStats);

module.exports = router;

