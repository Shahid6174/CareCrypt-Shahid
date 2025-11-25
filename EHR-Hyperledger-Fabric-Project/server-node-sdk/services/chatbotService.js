const llmGateway = require('../config/azureOpenAI');

/**
 * Chatbot Service
 * Provides intelligent assistance using GitHub Models (OpenAI GPT-4.1 etc.)
 */

class ChatbotService {
  constructor() {
    this.systemPrompt = `You are an intelligent medical assistant for the EHR CareCrypt healthcare system. You help patients, doctors, and insurance agents navigate the platform and answer their questions.

Your capabilities:
- Guide users through claim submission
- Explain medical document requirements
- Assist with profile management
- Explain fraud detection warnings
- Help with appointment scheduling
- Clarify insurance policies
- Provide general navigation help

Important guidelines:
- Be professional, empathetic, and clear
- Use simple language for medical terms
- Never provide actual medical advice or diagnoses
- Always recommend consulting healthcare professionals for medical decisions
- Respect patient privacy and confidentiality
- Guide users to appropriate features within the system`;

    this.contextPrompts = {
      patient: `The user is a PATIENT. They can:
- Submit insurance claims
- Upload medical documents
- View their medical records
- Grant/revoke doctor access
- Check claim status
- Manage their profile`,

      doctor: `The user is a DOCTOR. They can:
- Add medical records for patients
- Verify insurance claims
- View assigned patients
- Access patient records (with permission)
- Manage their profile`,

      insuranceAgent: `The user is an INSURANCE AGENT. They can:
- Review pending claims
- Approve or reject claims
- View claim details and medical records
- Check fraud detection reports
- Manage their profile`,

      admin: `The user is an ADMIN. They can:
- Manage user registrations
- Register doctors and insurance agents
- View fraud statistics
- Unblock users
- Monitor system health`
    };

    this.suggestionMap = {
      patient: [
        'How do I submit a claim?',
        'What documents are required?',
        'How do I check my fraud warnings?'
      ],
      doctor: [
        'How do I add a medical record?',
        'How do I verify a claim?',
        'How do I view patient documents?'
      ],
      insuranceAgent: [
        'Show me pending claims',
        'How do I approve a claim?',
        'How do I flag fraud?'
      ],
      admin: [
        'Show pending approvals',
        'How do I unblock a user?',
        'Show me system stats'
      ]
    };
  }

  getQuickSuggestions(role = 'patient') {
    return this.suggestionMap[role] || this.suggestionMap.patient;
  }

  analyzeIntent(message = '') {
    const text = message.toLowerCase();
    if (/claim|approve|status/.test(text)) return 'claim_submission';
    if (/document|upload|file/.test(text)) return 'document_upload';
    if (/fraud|warning|blocked/.test(text)) return 'fraud_help';
    if (/access|permission|grant/.test(text)) return 'access_control';
    return 'general';
  }

  buildMessages(userRole, history, userMessage) {
    const roleKey = this.contextPrompts[userRole] ? userRole : 'patient';
    const baseMessages = [
      { role: 'system', content: this.systemPrompt },
      { role: 'system', content: this.contextPrompts[roleKey] }
    ];

    const sanitizedHistory = Array.isArray(history)
      ? history.slice(-8).map(msg => ({
          role: msg.role === 'assistant' || msg.role === 'user' ? msg.role : 'user',
          content: msg.content || ''
        })).filter(msg => msg.content)
      : [];

    return [
      ...baseMessages,
      ...sanitizedHistory,
      { role: 'user', content: userMessage }
    ];
  }

  buildFallbackResponse(userMessage, userRole, { intent, customMessage } = {}) {
    const detectedIntent = intent || this.analyzeIntent(userMessage);
    const defaultMessage = customMessage || this.getOfflineResponse(detectedIntent, userRole);
    return {
      message: defaultMessage,
      timestamp: new Date().toISOString(),
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      fallback: true,
      suggestions: this.getQuickSuggestions(userRole)
    };
  }

  getOfflineResponse(intent, role) {
    const roleKey = ['patient', 'doctor', 'insuranceAgent', 'admin'].includes(role) ? role : 'patient';
    const responses = {
      claim_submission: {
        patient: 'Open the Claims tab, click “Submit New Claim”, attach your documents, and monitor the status cards for approvals.',
        doctor: 'Head to “Claims to Verify” to review pending requests. Approve or reject after checking medical records.',
        insuranceAgent: 'Go to Claims → Pending to review submissions. Approve/reject with notes so patients get notified.',
        admin: 'Use the analytics dashboard to monitor claim load and pending approvals.'
      },
      document_upload: {
        patient: 'Use Documents → Upload Document, choose the category, and add a short description. PDF and image files up to 10 MB are supported.',
        doctor: 'Attach supporting files inside each patient record so claims reviewers can see them immediately.',
        insuranceAgent: 'Download patient evidence from the claim drawer; upload annotated documents if you need to add context.',
        admin: 'Admins can filter uploaded files from the analytics → documents list.'
      },
      fraud_help: {
        patient: 'Fraud warnings appear at the top of your dashboard. Avoid duplicate submissions and make sure scans are clear. Contact support if you get blocked.',
        doctor: 'Ensure diagnoses, treatment notes, and attached documents align before verifying claims to prevent fraud flags.',
        insuranceAgent: 'Use Fraud Management to see flagged claims and mark them resolved once reviewed.',
        admin: 'Admins can unblock or flag accounts from the Fraud Management console.'
      },
      access_control: {
        patient: 'Open Access Control → enter the doctor ID → Grant Access. Revoke access the same way when you’re done.',
        doctor: 'Ask patients to grant you access from their dashboard. Once granted, records show up under “My Patients”.',
        insuranceAgent: 'Agents automatically see documents tied to each assigned claim.',
        admin: 'Admins can override access via the ledger tools if required.'
      },
      general: {
        default: 'I can help with claims, documents, access control, fraud alerts, and analytics. Let me know what you need!'
      }
    };

    const intentBucket = responses[intent] || responses.general;
    return intentBucket[roleKey] || intentBucket.default || responses.general.default;
  }

  async callModel(messages) {
    const response = await llmGateway.chatCompletion(messages, { temperature: 0.7 });
    const choice = response?.choices?.[0]?.message?.content;
    return {
      content: choice || 'I am sorry, I do not have a response right now.',
      usage: response?.usage || {}
    };
  }

  async chat(userMessage, history = [], userRole = 'patient') {
    const intent = this.analyzeIntent(userMessage);
    try {
      if (!llmGateway.isReady()) {
        throw new Error('LLM_NOT_CONFIGURED');
      }

      const messages = this.buildMessages(userRole, history, userMessage);
      const { content, usage } = await this.callModel(messages);
      return {
        message: content,
        timestamp: new Date().toISOString(),
        tokensUsed: {
          prompt: usage.prompt_tokens || usage.promptTokens || 0,
          completion: usage.completion_tokens || usage.completionTokens || 0,
          total: usage.total_tokens || usage.totalTokens || 0
        },
        fallback: false
      };
    } catch (error) {
      console.error('❌ Chatbot error:', error.message);
      const customMessage = error.message === 'LLM_NOT_CONFIGURED'
        ? 'The AI model is not configured yet. Please ask an admin to add the GitHub/Azure credentials. Meanwhile, here is a quick tip:'
        : undefined;
      return this.buildFallbackResponse(userMessage, userRole, {
        intent,
        customMessage
      });
    }
  }
}

module.exports = new ChatbotService();
