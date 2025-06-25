#!/usr/bin/env node

/**
 * Load Testing Script for Queue Implementation
 * This script simulates 30 concurrent users submitting analysis requests
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const CONCURRENT_USERS = 30;
const STAGGER_DELAY_MS = 100; // Delay between each user starting

// Test data
const testSession = {
  sessionId: 'test-session-001',
  documentId: 'test-doc-001',
  language: 'english'
};

const testAnswers = {
  executiveSummary: 'This is a test executive summary for load testing the queue system. The regulatory document introduces new requirements for financial institutions.',
  impactAnalysis: 'The impact on financial institutions will be significant, requiring updates to compliance procedures and reporting systems.'
};

// Helper function to create a test user
async function simulateUser(userId) {
  const startTime = Date.now();
  console.log(`👤 User ${userId} starting analysis submission...`);
  
  try {
    // Submit analysis
    const response = await axios.post(`${API_BASE_URL}/api/analysis/submit`, {
      sessionId: testSession.sessionId,
      answers: testAnswers,
      submittedAt: new Date().toISOString(),
      isAutoSubmit: false
    }, {
      timeout: 600000 // 10 minute timeout
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ User ${userId} completed in ${duration.toFixed(2)}s`);
    
    return {
      userId,
      success: true,
      duration,
      response: response.data
    };
    
  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.error(`❌ User ${userId} failed after ${duration.toFixed(2)}s:`, error.message);
    
    return {
      userId,
      success: false,
      duration,
      error: error.message
    };
  }
}

// Monitor queue status
async function monitorQueueStatus(intervalMs = 5000) {
  const monitoring = setInterval(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/queue/status`);
      const status = response.data.data;
      
      console.log(`\n📊 Queue Status:`);
      console.log(`   - Queue Size: ${status.queueSize}`);
      console.log(`   - Pending: ${status.pending}`);
      console.log(`   - Total Processed: ${status.totalProcessed}`);
      console.log(`   - Total Errors: ${status.totalErrors}`);
      console.log(`   - Estimated Wait: ${status.estimatedWaitTime}s`);
      console.log(`   - Rate Limiter: ${status.limiterStatus.queued} queued, ${status.limiterStatus.running} running\n`);
      
      // Stop monitoring when queue is empty and all done
      if (status.isIdle && status.totalProcessed >= CONCURRENT_USERS) {
        clearInterval(monitoring);
        console.log('✅ All jobs processed. Stopping monitor.');
      }
    } catch (error) {
      console.error('❌ Monitor error:', error.message);
    }
  }, intervalMs);
  
  return monitoring;
}

// Main test function
async function runLoadTest() {
  console.log(`🚀 Starting load test with ${CONCURRENT_USERS} concurrent users`);
  console.log(`📍 API URL: ${API_BASE_URL}`);
  console.log(`⏱️ Stagger delay: ${STAGGER_DELAY_MS}ms between users\n`);
  
  // Start monitoring
  const monitor = monitorQueueStatus(3000);
  
  // Create promises for all users
  const userPromises = [];
  
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    // Stagger the starts slightly to avoid thundering herd
    await new Promise(resolve => setTimeout(resolve, STAGGER_DELAY_MS));
    userPromises.push(simulateUser(i));
  }
  
  console.log(`\n⏳ All ${CONCURRENT_USERS} users started. Waiting for completion...\n`);
  
  // Wait for all users to complete
  const results = await Promise.all(userPromises);
  
  // Stop monitoring
  setTimeout(() => clearInterval(monitor), 10000);
  
  // Analyze results
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const maxDuration = Math.max(...results.map(r => r.duration));
  const minDuration = Math.min(...results.map(r => r.duration));
  
  console.log('\n📊 Test Results Summary:');
  console.log(`   - Total Users: ${CONCURRENT_USERS}`);
  console.log(`   - Successful: ${successful} (${(successful/CONCURRENT_USERS*100).toFixed(1)}%)`);
  console.log(`   - Failed: ${failed} (${(failed/CONCURRENT_USERS*100).toFixed(1)}%)`);
  console.log(`   - Average Duration: ${avgDuration.toFixed(2)}s`);
  console.log(`   - Min Duration: ${minDuration.toFixed(2)}s`);
  console.log(`   - Max Duration: ${maxDuration.toFixed(2)}s`);
  
  // Save detailed results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(__dirname, `load-test-results-${timestamp}.json`);
  await fs.writeFile(resultsFile, JSON.stringify({
    testConfig: {
      concurrentUsers: CONCURRENT_USERS,
      staggerDelay: STAGGER_DELAY_MS,
      apiUrl: API_BASE_URL
    },
    summary: {
      successful,
      failed,
      avgDuration,
      minDuration,
      maxDuration
    },
    details: results
  }, null, 2));
  
  console.log(`\n💾 Detailed results saved to: ${resultsFile}`);
  
  // Final queue status
  try {
    const finalStatus = await axios.get(`${API_BASE_URL}/api/queue/status`);
    console.log('\n📊 Final Queue Status:', finalStatus.data.data);
  } catch (error) {
    console.error('❌ Failed to get final status:', error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${API_BASE_URL}/api/health`);
    return true;
  } catch (error) {
    console.error(`❌ Server not responding at ${API_BASE_URL}`);
    console.error('Please ensure the backend server is running on port 3001');
    return false;
  }
}

// Run the test
async function main() {
  // Check server first
  const serverOk = await checkServer();
  if (!serverOk) {
    process.exit(1);
  }
  
  // Run the load test
  try {
    await runLoadTest();
    console.log('\n✅ Load test completed successfully');
  } catch (error) {
    console.error('\n❌ Load test failed:', error);
    process.exit(1);
  }
}

// Handle CLI arguments
if (process.argv.includes('--help')) {
  console.log(`
Load Test Script for Queue Implementation

Usage: node test-queue-load.js [options]

Options:
  --help     Show this help message
  
Environment Variables:
  API_URL    Base URL for the API (default: http://localhost:3001)

Example:
  API_URL=https://api.example.com node test-queue-load.js
  `);
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { simulateUser, runLoadTest };