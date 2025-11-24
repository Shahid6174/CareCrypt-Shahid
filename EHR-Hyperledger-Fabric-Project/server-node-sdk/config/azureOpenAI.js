const ModelClient = require("@azure-rest/ai-inference").default;
const { AzureKeyCredential } = require("@azure/core-auth");

/**
 * GitHub Models Configuration (using Azure REST Inference SDK)
 */

class GitHubModelsConfig {
  constructor() {
    this.apiKey = process.env.GITHUB_TOKEN;
    this.endpoint = process.env.GITHUB_MODELS_ENDPOINT || "https://models.github.ai/inference";
    this.model = process.env.GITHUB_MODELS_MODEL || "openai/gpt-4.1";

    this.client = null;
    this.initialized = false;
  }

  /**
   * Initialize GitHub Models client
   */
  initialize() {
    try {
      if (!this.apiKey) {
        console.warn("⚠️  GitHub Models API token not set. Chatbot will use fallback mode.");
        this.initialized = false;
        return false;
      }

      this.client = ModelClient(
        this.endpoint,
        new AzureKeyCredential(this.apiKey)
      );

      this.initialized = true;
      console.log("✅ GitHub Models client initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize GitHub Models client:", error.message);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Get client instance
   */
  getClient() {
    if (!this.initialized) {
      this.initialize();
    }
    return this.client;
  }

  /**
   * Check if client is ready
   */
  isReady() {
    return this.initialized && this.client !== null;
  }

  /**
   * Get model ID
   */
  getModel() {
    return this.model;
  }
}

module.exports = new GitHubModelsConfig();
