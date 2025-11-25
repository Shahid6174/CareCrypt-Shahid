const DEFAULT_GITHUB_ENDPOINT = 'https://models.inference.ai.azure.com';
let cachedFetch = typeof fetch === 'function' ? fetch : null;

async function getFetch() {
  if (cachedFetch) return cachedFetch;
  const { default: dynamicFetch } = await import('node-fetch');
  cachedFetch = dynamicFetch;
  return cachedFetch;
}

class ModelGateway {
  constructor() {
    this.refreshConfig();
  }

  refreshConfig() {
    const preferredProvider = process.env.LLM_PROVIDER || process.env.GITHUB_MODELS_PROVIDER;
    this.provider = (preferredProvider || (process.env.AZURE_OPENAI_API_KEY ? 'azure' : 'github')).toLowerCase();

    this.github = {
      token: process.env.GITHUB_TOKEN,
      endpoint: process.env.GITHUB_MODELS_ENDPOINT || DEFAULT_GITHUB_ENDPOINT,
      model: process.env.GITHUB_MODELS_MODEL || 'gpt-4o-mini'
    };

    this.azure = {
      key: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT || process.env.AZURE_OPENAI_MODEL,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
      temperature: process.env.AZURE_OPENAI_TEMPERATURE
    };
  }

  isReady() {
    this.refreshConfig();
    if (this.provider === 'azure') {
      return Boolean(this.azure.key && this.azure.endpoint && this.azure.deployment);
    }
    return Boolean(this.github.token);
  }

  async chatCompletion(messages, options = {}) {
    this.refreshConfig();
    if (!this.isReady()) {
      throw new Error('LLM credentials are not configured. Please set GITHUB_TOKEN or Azure OpenAI env vars.');
    }

    if (this.provider === 'azure') {
      return this.callAzure(messages, options);
    }
    return this.callGitHub(messages, options);
  }

  async callGitHub(messages, options = {}) {
    const fetchFn = await getFetch();
    const endpoint = (this.github.endpoint || DEFAULT_GITHUB_ENDPOINT).replace(/\/$/, '');
    const url = `${endpoint}/chat/completions`;
    const response = await fetchFn(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.github.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        model: this.github.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        top_p: options.topP,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub Models error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async callAzure(messages, options = {}) {
    const fetchFn = await getFetch();
    const endpoint = this.azure.endpoint.replace(/\/$/, '');
    const url = `${endpoint}/openai/deployments/${this.azure.deployment}/chat/completions?api-version=${this.azure.apiVersion}`;
    const response = await fetchFn(url, {
      method: 'POST',
      headers: {
        'api-key': this.azure.key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages,
        temperature: options.temperature ?? this.azure.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        top_p: options.topP,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI error (${response.status}): ${errorText}`);
    }

    return response.json();
  }
}

module.exports = new ModelGateway();
