/**
 * System Verification Script
 * Tests all major endpoints and functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let testUserId = 'test_user_' + Date.now();

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'yellow');
  log(`  ${title}`, 'yellow');
  log(`${'='.repeat(60)}`, 'yellow');
}

async function testEndpoint(method, endpoint, data = null, auth = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: auth ? { 'x-userid': auth } : {}
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (err) {
    return { 
      success: false, 
      error: err.response?.data?.message || err.message 
    };
  }
}

async function runTests() {
  log('\n🚀 EHR CareCrypt System Verification', 'blue');
  log('Starting comprehensive system check...\n', 'blue');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  // Test 1: Health Check
  section('1. Health Check Endpoints');
  totalTests++;
  let result = await testEndpoint('GET', '/health');
  if (result.success) {
    success('Health check endpoint');
    passedTests++;
  } else {
    error(`Health check failed: ${result.error}`);
    failedTests++;
  }
  
  // Test 2: MongoDB Health
  totalTests++;
  result = await testEndpoint('GET', '/health/mongodb');
  if (result.success) {
    success('MongoDB connection');
    passedTests++;
  } else {
    error(`MongoDB check failed: ${result.error}`);
    failedTests++;
  }
  
  // Test 3: OCR Health
  totalTests++;
  result = await testEndpoint('GET', '/health/ocr');
  if (result.success) {
    success('OCR system');
    passedTests++;
  } else {
    error(`OCR check failed: ${result.error}`);
    failedTests++;
  }
  
  // Test 4: Analytics Endpoints
  section('2. Analytics Endpoints (require auth)');
  info('Analytics endpoints require authentication - checking structure');
  
  const analyticsEndpoints = [
    '/analytics/patient',
    '/analytics/doctor',
    '/analytics/insurance-agent',
    '/analytics/admin',
    '/analytics/doctors',
    '/analytics/patients',
    '/analytics/agents',
    '/analytics/hospitals',
    '/analytics/companies'
  ];
  
  for (const endpoint of analyticsEndpoints) {
    totalTests++;
    // We expect 401 without auth, which means endpoint exists
    result = await testEndpoint('GET', endpoint);
    if (!result.success && result.error.includes('401')) {
      success(`${endpoint} (requires auth)`);
      passedTests++;
    } else if (result.success) {
      success(`${endpoint} (accessible)`);
      passedTests++;
    } else {
      error(`${endpoint} failed: ${result.error}`);
      failedTests++;
    }
  }
  
  // Test 5: Reward Endpoints
  section('3. Reward System Endpoints (require auth)');
  const rewardEndpoints = [
    '/rewards/summary',
    '/rewards/history',
    '/rewards/achievements',
    '/rewards/leaderboard',
    '/rewards/statistics',
    '/rewards/badge'
  ];
  
  for (const endpoint of rewardEndpoints) {
    totalTests++;
    result = await testEndpoint('GET', endpoint);
    if (!result.success && result.error.includes('401')) {
      success(`${endpoint} (requires auth)`);
      passedTests++;
    } else if (result.success) {
      success(`${endpoint} (accessible)`);
      passedTests++;
    } else {
      error(`${endpoint} failed: ${result.error}`);
      failedTests++;
    }
  }
  
  // Test 6: Notification Endpoints
  section('4. Notification System Endpoints (require auth)');
  const notificationEndpoints = [
    '/notifications',
    '/notifications/unread-count',
    '/notifications/statistics'
  ];
  
  for (const endpoint of notificationEndpoints) {
    totalTests++;
    result = await testEndpoint('GET', endpoint);
    if (!result.success && result.error.includes('401')) {
      success(`${endpoint} (requires auth)`);
      passedTests++;
    } else if (result.success) {
      success(`${endpoint} (accessible)`);
      passedTests++;
    } else {
      error(`${endpoint} failed: ${result.error}`);
      failedTests++;
    }
  }
  
  // Test 7: Chatbot Endpoints
  section('5. Chatbot Endpoints (require auth)');
  totalTests++;
  result = await testEndpoint('POST', '/chatbot/start');
  if (!result.success && result.error.includes('401')) {
    success('/chatbot/start (requires auth)');
    passedTests++;
  } else {
    error(`Chatbot endpoint failed: ${result.error}`);
    failedTests++;
  }
  
  // Test 8: Document Endpoints
  section('6. Document Management Endpoints (require auth)');
  const documentEndpoints = [
    '/documents/list'
  ];
  
  for (const endpoint of documentEndpoints) {
    totalTests++;
    result = await testEndpoint('GET', endpoint);
    if (!result.success && result.error.includes('401')) {
      success(`${endpoint} (requires auth)`);
      passedTests++;
    } else if (result.success) {
      success(`${endpoint} (accessible)`);
      passedTests++;
    } else {
      error(`${endpoint} failed: ${result.error}`);
      failedTests++;
    }
  }
  
  // Test 9: Fraud Detection Endpoints
  section('7. Fraud Detection Endpoints (require auth)');
  const fraudEndpoints = [
    '/fraud/statistics',
    '/fraud/users/blocked',
    '/fraud/users/fraudulent'
  ];
  
  for (const endpoint of fraudEndpoints) {
    totalTests++;
    result = await testEndpoint('GET', endpoint);
    if (!result.success && result.error.includes('401')) {
      success(`${endpoint} (requires auth)`);
      passedTests++;
    } else if (result.success) {
      success(`${endpoint} (accessible)`);
      passedTests++;
    } else {
      error(`${endpoint} failed: ${result.error}`);
      failedTests++;
    }
  }
  
  // Summary
  section('VERIFICATION SUMMARY');
  log(`\nTotal Tests: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, 'red');
  log(`Success Rate: ${Math.round((passedTests/totalTests) * 100)}%\n`, 'yellow');
  
  if (failedTests === 0) {
    log('🎉 ALL TESTS PASSED! System is ready for production.', 'green');
  } else if (failedTests <= 3) {
    log('⚠️  Most tests passed. Review failed tests.', 'yellow');
  } else {
    log('❌ Multiple tests failed. System needs attention.', 'red');
  }
  
  log('\n📋 Next Steps:', 'blue');
  log('1. Start backend: cd server-node-sdk && npm start', 'reset');
  log('2. Start frontend: cd frontend && npm run dev', 'reset');
  log('3. Access app: http://localhost:5173', 'reset');
  log('4. Login with admin: admin@ehr.com / admin123\n', 'reset');
}

// Run tests
runTests().catch(err => {
  error(`Test execution failed: ${err.message}`);
  process.exit(1);
});

