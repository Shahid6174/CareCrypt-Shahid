# 🚀 Quick Start Guide - EHR CareCrypt

**Get up and running in 10 minutes!**

---

## 📋 Prerequisites

Make sure you have these installed:
- ✅ Node.js 14+ ([Download](https://nodejs.org/))
- ✅ Docker Desktop ([Download](https://www.docker.com/))
- ✅ MongoDB ([Download](https://www.mongodb.com/try/download/community))
- ✅ Git ([Download](https://git-scm.com/))

---

## ⚡ 5-Step Setup

### Step 1: Clone & Navigate
```bash
git clone <your-repo-url>
cd EHR-Hyperledger-Fabric-Project
```

### Step 2: Start Blockchain Network
```bash
cd network
./network.sh up createChannel -c mychannel
./network.sh deployCC -ccn ehr -ccp ../chaincode/ehr-chaincode -ccl javascript
cd ..
```

### Step 3: Setup Backend
```bash
cd server-node-sdk
npm install

# Create .env file
cat > .env << 'EOF'
MONGODB_URI=mongodb://localhost:27017/ehr-carecrypt
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
AZURE_OPENAI_API_KEY=your-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview
EOF

# Start server
npm start
```

### Step 4: Setup Frontend
```bash
# Open new terminal
cd frontend
npm install
npm run dev
```

### Step 5: Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

## 👤 Default Accounts

### Admin (Pre-registered)
- **Email**: `admin@ehr.com`
- **Password**: `admin123`
- **Role**: Admin

### Test Users (Register via UI)
- **Patient**: Register at `/register`
- **Doctor**: Admin registers in dashboard
- **Insurance Agent**: Admin registers in dashboard

---

## 🎯 Quick Feature Tour

### 1. Patient Features (5 min)
1. Register as Patient → Login
2. Submit Insurance Claim (with documents)
3. View Fraud Detection Status
4. Grant Doctor Access
5. Check Notifications 🔔

### 2. Doctor Features (3 min)
1. Admin registers doctor
2. Doctor logs in
3. Add Medical Records
4. Verify Claims
5. Check Notifications 🔔

### 3. Insurance Agent Features (3 min)
1. Admin registers agent
2. Agent logs in
3. Review Claims
4. View Fraud Reports
5. Approve/Reject Claims
6. Check Notifications 🔔

### 4. Admin Features (5 min)
1. Login as admin
2. Approve User Registrations
3. View Fraud Dashboard
4. Manage Blocked Users
5. System Monitoring
6. Check Notifications 🔔

---

## 🔔 Notification System

### How to Test
1. **Submit Claim** (Patient) → Check notification bell
2. **Fraud Warning** → Submit fraudulent claim → Check notification
3. **Grant Access** → Grant doctor access → Check notification
4. **Approve Claim** (Agent) → Patient gets notification

### Notification Features
- 🔔 Bell icon in header (all dashboards)
- 🔴 Red badge shows unread count
- 📋 Dropdown shows recent 10 notifications
- ✅ Click to mark as read
- 🗑️ Delete individual notifications
- 🔄 Auto-refresh every 30 seconds
- 🎯 Priority colors (Red/Orange/Blue/Gray)
- 📱 Action buttons to navigate

---

## 🤖 AI Features

### Fraud Detection
1. Patient submits claim with documents
2. System performs OCR on documents
3. Analyzes patterns and medical terminology
4. Calculates fraud score (0-100)
5. If score ≥ 50: Fraud detected! → Warning/Block
6. 3-strike system: Attempt 3 = Account blocked

### Chatbot
1. Click **chat bubble** icon (bottom right)
2. Ask questions:
   - "How do I submit a claim?"
   - "How to upload documents?"
   - "What is fraud detection?"
3. Get instant AI-powered answers
4. Works in **fallback mode** without Azure OpenAI

---

## 📁 Key Files & Directories

### Backend
```
server-node-sdk/
├── app.js                    # Main Express app
├── models/
│   ├── User.js              # User schema
│   └── Notification.js      # Notification schema
├── controllers/             # Route handlers
├── services/                # Business logic
│   ├── fraudDetectionService.js
│   ├── chatbotService.js
│   └── notificationService.js
└── uploads/                 # Document storage
```

### Frontend
```
frontend/
├── src/
│   ├── App.jsx             # Main app
│   ├── components/
│   │   ├── NotificationBell.jsx  # Notification UI
│   │   └── Chatbot.jsx          # Chatbot UI
│   └── pages/              # Dashboards
└── package.json
```

---

## 🔍 API Testing

### Using curl

**1. Register User**
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "P001",
    "email": "patient@test.com",
    "password": "password123",
    "name": "John Doe",
    "role": "patient"
  }'
```

**2. Login**
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "password123"
  }'
```

**3. Get Notifications**
```bash
curl -X GET http://localhost:5000/notifications \
  -H "x-userid: P001"
```

**4. Health Check**
```bash
curl http://localhost:5000/health
```

---

## 🐛 Troubleshooting

### Issue: Blockchain network not starting
**Solution:**
```bash
cd network
./network.sh down
./network.sh up createChannel -c mychannel
```

### Issue: MongoDB connection failed
**Solution:**
```bash
# Start MongoDB
mongod --dbpath /path/to/data/db

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Issue: Frontend not connecting to backend
**Solution:**
- Check backend is running: `http://localhost:5000/health`
- Verify CORS settings in `server-node-sdk/app.js`

### Issue: OCR not working
**Solution:**
- Tesseract.js downloads language files on first run (may take time)
- Check internet connection
- Verify image format is supported (JPG, PNG, PDF)

### Issue: Chatbot not responding
**Solution:**
- Check if Azure OpenAI credentials are correct in `.env`
- Chatbot works in **fallback mode** without Azure OpenAI
- Check backend logs for errors

### Issue: Notifications not appearing
**Solution:**
- Check user is logged in (`x-userid` header)
- Verify MongoDB connection
- Check browser console for errors
- Wait 30 seconds for auto-refresh

---

## 📚 Documentation Quick Links

- 📖 [**Complete README**](README.md) - Full project documentation
- 📊 [**System Summary**](SYSTEM_SUMMARY.md) - Architecture overview
- 🔔 [**Notification Guide**](NOTIFICATION_SYSTEM_README.md) - Notification system
- 🧮 [**Algorithms**](ALGORITHMS_README.md) - Algorithm documentation
- 🤖 [**Chatbot Setup**](CHATBOT_SETUP_GUIDE.md) - Chatbot configuration
- 📡 [**API Docs**](API_DOCUMENTATION.md) - All API endpoints
- 🔍 [**OCR System**](OCR_SYSTEM_GUIDE.md) - Fraud detection details

---

## 🎯 Next Steps

### For Developers
1. Read [SYSTEM_SUMMARY.md](SYSTEM_SUMMARY.md) for architecture
2. Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for endpoints
3. Review [ALGORITHMS_README.md](ALGORITHMS_README.md) for algorithms

### For Users
1. Register and explore dashboards
2. Test claim submission
3. Try fraud detection
4. Use chatbot assistant
5. Check notifications

### For Admins
1. Login with admin account
2. Approve user registrations
3. Monitor fraud dashboard
4. Manage system health

---

## 🔐 Security Notes

### Development Mode
- Uses HTTP (not HTTPS)
- Simplified authentication
- Verbose logging

### Production Mode
- Use HTTPS with SSL certificates
- Implement rate limiting
- Enable security headers
- Use environment variables for secrets
- Set `NODE_ENV=production`

---

## ⚡ Performance Tips

1. **MongoDB Indexing**: Already configured
2. **Blockchain Caching**: Consider Redis for world state
3. **File Storage**: Use cloud storage (AWS S3, Azure Blob) for production
4. **Load Balancing**: Use Nginx for multiple backend instances
5. **CDN**: Serve frontend assets via CDN

---

## 🎓 Learning Resources

### Hyperledger Fabric
- [Official Docs](https://hyperledger-fabric.readthedocs.io/)
- [Fabric Samples](https://github.com/hyperledger/fabric-samples)

### React
- [Official Docs](https://react.dev/)
- [React Router](https://reactrouter.com/)

### MongoDB
- [Official Docs](https://docs.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)

### Azure OpenAI
- [Official Docs](https://learn.microsoft.com/azure/ai-services/openai/)

---

## 💡 Pro Tips

1. **Use VS Code** with extensions:
   - ESLint
   - Prettier
   - React snippets
   - MongoDB for VS Code

2. **Browser DevTools**:
   - Check Network tab for API calls
   - Console for errors
   - React DevTools for component inspection

3. **Postman/Insomnia**:
   - Test API endpoints
   - Save request collections
   - Share with team

4. **Git Workflow**:
   - Create feature branches
   - Commit frequently
   - Write meaningful commit messages

---

## 🎉 You're Ready!

Your EHR CareCrypt system is now running with:
- ✅ Blockchain-based ledger
- ✅ AI-powered fraud detection
- ✅ Intelligent chatbot
- ✅ Real-time notifications
- ✅ Beautiful UI/UX

**Happy Coding! 🚀**

---

## 📞 Need Help?

- 📖 **Documentation**: See `/docs` folder
- 🐛 **Issues**: GitHub Issues
- 💬 **Questions**: Email support@ehr-carecrypt.com

---

**Last Updated:** November 24, 2025  
**Version:** 2.0.0

