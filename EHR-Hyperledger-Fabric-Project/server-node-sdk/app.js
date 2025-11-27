const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const insuranceRoutes = require('./routes/insuranceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const claimRoutes = require('./routes/claimRoutes');
const ledgerRoutes = require('./routes/ledgerRoutes');
const documentRoutes = require('./routes/documentRoutes');
const fraudRoutes = require('./routes/fraudRoutes');
const healthRoutes = require('./routes/healthRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use('/health', healthRoutes);
app.use('/chatbot', chatbotRoutes);
app.use('/notifications', notificationRoutes);
app.use('/rewards', rewardRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/statistics', statisticsRoutes);
app.use('/auth', authRoutes);
app.use('/patient', patientRoutes);
app.use('/doctor', doctorRoutes);
app.use('/insurance', insuranceRoutes);
app.use('/admin', adminRoutes);
app.use('/claims', claimRoutes);
app.use('/ledger', ledgerRoutes);
app.use('/documents', documentRoutes);
app.use('/fraud', fraudRoutes);

app.get('/', (req, res) => res.send({ 
  status: 'EHR Server Running',
  version: '1.0.0',
  endpoints: {
    health: '/health',
    auth: '/auth',
    patient: '/patient',
    doctor: '/doctor',
    insurance: '/insurance',
    admin: '/admin',
    claims: '/claims',
    ledger: '/ledger',
    documents: '/documents',
    fraud: '/fraud'
  }
}));

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.status || 400).send({ success: false, message: err.message || 'Bad Request' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
module.exports = app;
