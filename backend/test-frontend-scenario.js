// Test script that mimics exactly what the frontend is doing
const axios = require('axios');

// Mimic the exact frontend configuration
const API_BASE_URL = 'https://kl-regwriterpro-v3-production.up.railway.app';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Exact data structure from frontend
const submissionData = {
  sessionId: 'TEST123',
  answers: {
    executiveSummary: 'Test executive summary from frontend',
    impactAnalysis: 'Test impact analysis from frontend'
  },
  submittedAt: new Date().toISOString(),
  isAutoSubmit: false
};

async function testFrontendScenario() {
  console.log('\n🎭 Testing exact frontend scenario...');
  console.log('API Base URL:', api.defaults.baseURL);
  console.log('Endpoint: /analysis/submit');
  console.log('Full URL:', `${api.defaults.baseURL}/analysis/submit`);
  console.log('\nRequest data:', JSON.stringify(submissionData, null, 2));
  
  try {
    console.log('\n📤 Making POST request...');
    const response = await api.post('/analysis/submit', submissionData);
    
    console.log('\n✅ SUCCESS! Response received:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ ERROR occurred:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Headers:', error.response.headers);
      console.log('Data:', error.response.data);
      
      if (error.response.status === 404) {
        console.log('\n🔍 404 Details:');
        console.log('Requested URL:', error.config.url);
        console.log('Full URL:', error.config.baseURL + error.config.url);
        console.log('Method:', error.config.method);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received');
      console.log('Request:', error.request);
    } else {
      // Something happened in setting up the request
      console.log('Error message:', error.message);
    }
    
    console.log('\nError config:');
    console.log('URL:', error.config?.url);
    console.log('Base URL:', error.config?.baseURL);
    console.log('Method:', error.config?.method);
  }
}

testFrontendScenario();