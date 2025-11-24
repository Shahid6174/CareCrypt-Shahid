const githubModels = require('../config/azureOpenAI'); // now returns GitHub Models config
const { isUnexpected } = require("@azure-rest/ai-inference");

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
- Guide users to appropriate features within the system

When users ask about:
1. Claims: Explain the process, required documents, and fraud detection
2. Documents: Guide on upload, formats, and categorization
3. Fraud warnings: Explain the system, appeal process, and prevention
4. Medical records: How to view, share, and manage access
5. Insurance: Policy details, coverage, and claim status

Always maintain a helpful, respectful tone and prioritize user safety and privacy.`;

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
  }

  /**
   * Generate chatbot response using GitHub Models
   */
  async generateResponse(userRole, userMessage) {
    const client = githubModels.getClient();

    if (!githubModels.isReady()) {
      return "⚠️ AI service is not configured. Please try again later.";
    }

    const model = githubModels.getModel();

    const messages = [
      { role: "system", content: this.systemPrompt },
    ];

    if (this.contextPrompts[userRole]) {
      messages.push({ role: "system", content: this.contextPrompts[userRole] });
    }

    messages.push({
      role: "user",
      content: userMessage
    });

    try {
      const response = await client
        .path("/chat/completions")
        .post({
          body: {
            model: model,
            messages: messages,
            temperature: 0.7
          }
        });

      if (isUnexpected(response)) {
        console.error("GitHub Models Error Response:", response.body);
        return "❌ Error communicating with AI model.";
      }

      return response.body.choices[0].message.content;

    } catch (error) {
      console.error("❌ Chatbot error:", error);
      return "❌ The AI assistant encountered an error.";
    }
  }
}

module.exports = new ChatbotService();
