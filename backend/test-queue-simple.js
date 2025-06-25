// Simple test to verify queue is working
const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testQueue() {
  console.log('🧪 Testing queue implementation...\n');
  
  try {
    // 1. Check health
    console.log('1️⃣ Checking server health...');
    const health = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Server is healthy:', health.data.status);
    
    // 2. Check queue status
    console.log('\n2️⃣ Checking queue status...');
    const queueStatus = await axios.get(`${API_URL}/api/queue/status`);
    console.log('✅ Queue status:', JSON.stringify(queueStatus.data.data, null, 2));
    
    // 3. Check wait time
    console.log('\n3️⃣ Checking wait time...');
    const waitTime = await axios.get(`${API_URL}/api/queue/wait-time`);
    console.log('✅ Wait time:', waitTime.data.data);
    
    // 4. Submit a test analysis
    console.log('\n4️⃣ Submitting test analysis...');
    const startTime = Date.now();
    
    try {
      const analysis = await axios.post(`${API_URL}/api/analysis/submit`, {
        sessionId: 'test-session-001',
        answers: {
          executiveSummary: 'Test summary for queue verification',
          impactAnalysis: 'Test impact analysis'
        }
      });
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`✅ Analysis completed in ${duration.toFixed(2)}s`);
      console.log('Analysis type:', analysis.data.data.analysis.analysisType);
    } catch (error) {
      console.log('⚠️  Analysis failed (expected if no session exists):', error.response?.data?.message || error.message);
    }
    
    // 5. Final queue status
    console.log('\n5️⃣ Final queue status...');
    const finalStatus = await axios.get(`${API_URL}/api/queue/status`);
    console.log('✅ Final status:', JSON.stringify(finalStatus.data.data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Make sure the backend server is running on port 5000');
      console.error('Run: cd backend && npm run dev');
    }
  }
}

// Run the test
testQueue();