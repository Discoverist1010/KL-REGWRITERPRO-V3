// Test script to verify the analysis submit endpoint
const axios = require('axios');

// Test both local and production endpoints
const endpoints = [
  'http://localhost:5000',
  'https://kl-regwriterpro-v3-production.up.railway.app'
];

const testData = {
  sessionId: 'TEST123',
  answers: {
    executiveSummary: 'Test executive summary',
    impactAnalysis: 'Test impact analysis'
  },
  submittedAt: new Date().toISOString()
};

async function testEndpoint(baseUrl) {
  console.log(`\n🧪 Testing: ${baseUrl}`);
  
  try {
    // Test health endpoint first
    const health = await axios.get(`${baseUrl}/api/health`);
    console.log('✅ Health check passed:', health.data.status);
    
    // Test analysis submit endpoint
    console.log('📤 Testing POST /api/analysis/submit');
    const response = await axios.post(`${baseUrl}/api/analysis/submit`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Analysis endpoint working!');
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ Error ${error.response.status}: ${error.response.statusText}`);
      console.log('Response data:', error.response.data);
    } else if (error.request) {
      console.log('❌ No response received');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Run tests
async function runTests() {
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
}

runTests();