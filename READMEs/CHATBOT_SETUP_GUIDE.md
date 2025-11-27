# 🤖 AI Chatbot Setup Guide - Azure OpenAI

## ✅ System Overview

Your EHR CareCrypt application now includes an **intelligent AI chatbot** powered by **Azure OpenAI** to provide 24/7 assistance to users.

---

## 📦 What Was Created

### Backend (7 files)

1. ✅ **`config/azureOpenAI.js`** - Azure OpenAI client configuration
2. ✅ **`services/chatbotService.js`** - Chatbot service with AI + fallback
3. ✅ **`models/Conversation.js`** - Conversation history model
4. ✅ **`controllers/chatbotController.js`** - Chatbot API controllers
5. ✅ **`routes/chatbotRoutes.js`** - Chatbot routes
6. ✅ **`app.js`** - Updated with chatbot routes
7. ✅ **`package.json`** - Updated with Azure OpenAI dependency

### Frontend (2 files)

1. ✅ **`frontend/src/components/Chatbot.jsx`** - Beautiful chatbot UI component
2. ✅ **`frontend/src/App.jsx`** - Updated with chatbot integration

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
# Backend
cd server-node-sdk
npm install

# This will install:
# - @azure/openai@^1.0.0-beta.12
# - dotenv@^16.3.1
```

### Step 2: Configure Environment Variables

Create a `.env` file in `server-node-sdk/`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/ehr-carecrypt

# Server
PORT=5000
NODE_ENV=development

# Azure OpenAI Configuration (REQUIRED FOR AI FEATURES)
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Chatbot Settings
CHATBOT_MAX_HISTORY=10
CHATBOT_TEMPERATURE=0.7
CHATBOT_MAX_TOKENS=800
```

### Step 3: Get Azure OpenAI Credentials

#### Option A: Use Azure OpenAI (Recommended)

1. **Create Azure Account**: https://portal.azure.com
2. **Create Azure OpenAI Resource**:
   - Search for "Azure OpenAI"
   - Click "Create"
   - Fill in resource details
   - Wait for deployment
3. **Deploy a Model**:
   - Go to Azure OpenAI Studio
   - Click "Deployments"
   - Deploy GPT-4 or GPT-3.5-turbo
   - Note the deployment name
4. **Get Credentials**:
   - Endpoint: Found in resource overview
   - API Key: Found in "Keys and Endpoint"
   - Deployment Name: From step 3

#### Option B: Use Without Azure OpenAI (Fallback Mode)

The chatbot will work with **rule-based responses** if Azure OpenAI is not configured. Simply skip the Azure setup and the system will use intelligent fallback responses.

### Step 4: Start the Application

```bash
# Backend
cd server-node-sdk
npm run dev

# Frontend (new terminal)
cd frontend
npm run dev
```

### Step 5: Test the Chatbot

1. Open the application: `http://localhost:5173`
2. Login as any user
3. Click the **chatbot icon** in the bottom-right corner
4. Start chatting!

---

## 🎨 Chatbot Features

### ✅ Intelligent Assistance
- **Role-aware responses**: Different guidance for patients, doctors, insurance agents, and admins
- **Contextual help**: Understands user intent and provides relevant information
- **Conversation memory**: Remembers chat history for context
- **Quick suggestions**: Smart follow-up questions

### ✅ Two-Mode Operation

**1. AI Mode (with Azure OpenAI)**
- Natural language understanding
- Context-aware responses
- Learns from conversation
- Professional medical terminology

**2. Fallback Mode (without Azure)**
- Rule-based responses
- Keyword matching
- Instant answers
- No API costs

### ✅ User-Friendly UI
- **Floating button**: Always accessible
- **Minimize/maximize**: Space-saving design
- **Real-time typing**: Smooth animations
- **Quick suggestions**: One-click questions
- **Beautiful gradients**: Modern design
- **Mobile-responsive**: Works on all devices

---

## 📚 API Endpoints

### 1. Start Conversation
```bash
POST /chatbot/start
Headers: { "x-userid": "P-abc123" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "message": "Hello! I'm your EHR assistant...",
    "suggestions": [
      "How do I submit a claim?",
      "What documents do I need?"
    ]
  }
}
```

### 2. Send Message
```bash
POST /chatbot/message
Headers: { "x-userid": "P-abc123" }
Body: {
  "sessionId": "uuid",
  "message": "How do I submit a claim?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "To submit a claim: 1. Go to Claims section...",
    "timestamp": "2025-11-24T10:30:00.000Z",
    "intent": "claim_submission",
    "suggestions": [
      "What documents do I need?",
      "How long does approval take?"
    ],
    "tokensUsed": {
      "prompt": 150,
      "completion": 200,
      "total": 350
    }
  }
}
```

### 3. Get Conversation History
```bash
GET /chatbot/conversation/:sessionId
Headers: { "x-userid": "P-abc123" }
```

### 4. Get All Conversations
```bash
GET /chatbot/conversations?limit=10&active=true
Headers: { "x-userid": "P-abc123" }
```

### 5. End Conversation
```bash
POST /chatbot/conversation/:sessionId/end
Headers: { "x-userid": "P-abc123" }
```

### 6. Get Suggestions
```bash
GET /chatbot/suggestions
Headers: { "x-userid": "P-abc123" }
```

### 7. Get Statistics (Admin)
```bash
GET /chatbot/stats
Headers: { "x-userid": "hospitalAdmin" }
```

---

## 🔧 Configuration Options

### Chatbot Service Settings

**File:** `services/chatbotService.js`

```javascript
// Conversation history length
maxHistoryLength: 10  // Number of previous messages to remember

// Response creativity
temperature: 0.7  // 0.0 = Factual, 1.0 = Creative

// Response length
maxTokens: 800  // Maximum response length
```

### System Prompts

The chatbot uses role-specific prompts:

**Patient Context:**
```
The user is a PATIENT. They can:
- Submit insurance claims
- Upload medical documents
- View their medical records
- Grant/revoke doctor access
```

**Doctor Context:**
```
The user is a DOCTOR. They can:
- Add medical records for patients
- Verify insurance claims
- View assigned patients
```

**Insurance Agent Context:**
```
The user is an INSURANCE AGENT. They can:
- Review pending claims
- Approve or reject claims
- View fraud reports
```

---

## 💡 Example Conversations

### Patient - Submitting a Claim

```
User: How do I submit a claim?
