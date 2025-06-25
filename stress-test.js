// stress-test.js - Simple stress test for 20 concurrent users
const https = require('https');
const http = require('http');

class RegulatorySysStressTest {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'http://localhost:3000';
    this.concurrentUsers = config.concurrentUsers || 20;
    this.testData = this.generateTestData();
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: [],
      startTime: null,
      endTime: null
    };
  }

  // Generate realistic test data
  generateTestData() {
    const summaries = [
      "The new MiFID III regulation introduces enhanced transparency requirements for investment firms, effective January 1, 2026. Key provisions include real-time trade reporting, expanded best execution obligations, and stricter client communication standards.",
      "Basel IV capital requirements mandate increased minimum capital ratios for systemically important banks by March 2025. The regulation affects tier 1 capital calculations and introduces new risk-weighted asset methodologies.",
      "Digital Asset Framework establishes comprehensive custody and trading standards for cryptocurrency services. Implementation deadline is September 30, 2025, with mandatory licensing for all digital asset service providers.",
      "Anti-Money Laundering Enhancement Act requires upgraded transaction monitoring systems across all financial institutions. Compliance timeline extends through December 2025 with quarterly progress reporting to regulators."
    ];

    const analyses = [
      "Primary impacts include: (1) Technology infrastructure upgrades requiring $2-5M investment, (2) Staff training and policy restructuring across compliance teams, (3) Timeline challenges with 18-month implementation window requiring immediate project initiation.",
      "Operational implications encompass: (1) Capital planning adjustments affecting lending capacity and growth strategies, (2) Risk management system overhauls costing approximately $10-15M for mid-tier institutions, (3) Regulatory reporting enhancements requiring new data governance frameworks.",
      "Key considerations include: (1) Custody technology investments ranging from $3-8M for institutional providers, (2) Licensing and compliance infrastructure development over 12-month timeline, (3) Client onboarding process redesign affecting existing relationship management workflows.",
      "Critical impacts involve: (1) Transaction monitoring platform upgrades with vendor selection and implementation phases, (2) Enhanced due diligence procedures requiring additional compliance staff and training programs, (3) Quarterly reporting obligations necessitating new data collection and analysis capabilities."
    ];

    return summaries.map((summary, index) => ({
      executiveSummary: summary,
      impactAnalysis: analyses[index],
      sessionId: `stress_test_${Date.now()}_${index}`
    }));
  }

  // Single user simulation
  async simulateUser(userId, testData) {
    const userResults = {
      userId,
      requests: 0,
      successes: 0,
      failures: 0,
      responseTimes: [],
      errors: []
    };

    console.log(`👤 User ${userId} starting simulation...`);

    try {
      // Test 1: Submit analysis request
      const analysisResult = await this.makeRequest('/api/analysis', 'POST', testData);
      userResults.requests++;
      userResults.responseTimes.push(analysisResult.responseTime);
      
      if (analysisResult.success) {
        userResults.successes++;
        console.log(`✅ User ${userId}: Analysis request completed in ${analysisResult.responseTime}ms`);
      } else {
        userResults.failures++;
        userResults.errors.push(`Analysis failed: ${analysisResult.error}`);
        console.log(`❌ User ${userId}: Analysis request failed - ${analysisResult.error}`);
      }

      // Test 2: Check server health
      const healthResult = await this.makeRequest('/api/health', 'GET');
      userResults.requests++;
      userResults.responseTimes.push(healthResult.responseTime);
      
      if (healthResult.success) {
        userResults.successes++;
      } else {
        userResults.failures++;
        userResults.errors.push(`Health check failed: ${healthResult.error}`);
      }

      // Test 3: Fetch results (if analysis was successful)
      if (analysisResult.success && analysisResult.data.sessionId) {
        const resultsResult = await this.makeRequest(`/api/results/${analysisResult.data.sessionId}`, 'GET');
        userResults.requests++;
        userResults.responseTimes.push(resultsResult.responseTime);
        
        if (resultsResult.success) {
          userResults.successes++;
          console.log(`📊 User ${userId}: Results fetched successfully`);
        } else {
          userResults.failures++;
          userResults.errors.push(`Results fetch failed: ${resultsResult.error}`);
        }
      }

    } catch (error) {
      console.error(`💥 User ${userId} simulation error:`, error.message);
      userResults.errors.push(`Simulation error: ${error.message}`);
    }

    console.log(`🏁 User ${userId} completed: ${userResults.successes}/${userResults.requests} successful`);
    return userResults;
  }

  // Make HTTP request with timing
  makeRequest(endpoint, method, data = null) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const url = new URL(endpoint, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'StressTest/1.0'
        },
        timeout: 30000 // 30 second timeout
      };

      const requestModule = url.protocol === 'https:' ? https : http;
      
      const req = requestModule.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          
          try {
            const parsedData = responseData ? JSON.parse(responseData) : {};
            resolve({
              success: res.statusCode >= 200 && res.statusCode < 300,
              statusCode: res.statusCode,
              responseTime,
              data: parsedData,
              error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null
            });
          } catch (parseError) {
            resolve({
              success: false,
              statusCode: res.statusCode,
              responseTime,
              data: null,
              error: `Parse error: ${parseError.message}`
            });
          }
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        resolve({
          success: false,
          statusCode: 0,
          responseTime,
          data: null,
          error: error.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        resolve({
          success: false,
          statusCode: 0,
          responseTime,
          data: null,
          error: 'Request timeout'
        });
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  // Run the stress test
  async runStressTest() {
    console.log(`🚀 Starting stress test with ${this.concurrentUsers} concurrent users...`);
    console.log(`🎯 Target: ${this.baseUrl}`);
    console.log(`⏰ Start time: ${new Date().toISOString()}\n`);

    this.results.startTime = Date.now();

    // Create promises for all concurrent users
    const userPromises = Array.from({ length: this.concurrentUsers }, (_, i) => {
      const testData = this.testData[i % this.testData.length];
      return this.simulateUser(i + 1, testData);
    });

    // Wait for all users to complete
    const userResults = await Promise.all(userPromises);
    
    this.results.endTime = Date.now();
    
    // Aggregate results
    this.aggregateResults(userResults);
    
    // Display results
    this.displayResults();
    
    return this.results;
  }

  // Aggregate all user results
  aggregateResults(userResults) {
    userResults.forEach(userResult => {
      this.results.totalRequests += userResult.requests;
      this.results.successfulRequests += userResult.successes;
      this.results.failedRequests += userResult.failures;
      this.results.responseTimes.push(...userResult.responseTimes);
      this.results.errors.push(...userResult.errors);
    });
  }

  // Display comprehensive results
  displayResults() {
    const totalTime = this.results.endTime - this.results.startTime;
    const avgResponseTime = this.results.responseTimes.length > 0 
      ? Math.round(this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length)
      : 0;
    const minResponseTime = this.results.responseTimes.length > 0 ? Math.min(...this.results.responseTimes) : 0;
    const maxResponseTime = this.results.responseTimes.length > 0 ? Math.max(...this.results.responseTimes) : 0;
    const successRate = this.results.totalRequests > 0 
      ? (this.results.successfulRequests / this.results.totalRequests * 100).toFixed(2)
      : 0;
    const requestsPerSecond = this.results.totalRequests > 0 
      ? (this.results.totalRequests / (totalTime / 1000)).toFixed(2)
      : 0;

    console.log('\n' + '='.repeat(60));
    console.log('🎯 STRESS TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`👥 Concurrent Users: ${this.concurrentUsers}`);
    console.log(`⏱️  Total Test Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`📊 Total Requests: ${this.results.totalRequests}`);
    console.log(`✅ Successful: ${this.results.successfulRequests}`);
    console.log(`❌ Failed: ${this.results.failedRequests}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`⚡ Requests/Second: ${requestsPerSecond}`);
    console.log('\n📐 RESPONSE TIMES:');
    console.log(`   Average: ${avgResponseTime}ms`);
    console.log(`   Minimum: ${minResponseTime}ms`);
    console.log(`   Maximum: ${maxResponseTime}ms`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      const errorCounts = {};
      this.results.errors.forEach(error => {
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      });
      Object.entries(errorCounts).forEach(([error, count]) => {
        console.log(`   ${error}: ${count} times`);
      });
    }

    console.log('\n🎯 PERFORMANCE ASSESSMENT:');
    if (successRate >= 95) {
      console.log('   🟢 EXCELLENT: System handling load very well');
    } else if (successRate >= 85) {
      console.log('   🟡 GOOD: System stable with minor issues');
    } else if (successRate >= 70) {
      console.log('   🟠 CONCERNING: Performance degradation detected');
    } else {
      console.log('   🔴 CRITICAL: System struggling under load');
    }

    if (avgResponseTime <= 2000) {
      console.log('   ⚡ Response times acceptable');
    } else if (avgResponseTime <= 5000) {
      console.log('   ⏳ Response times slower than ideal');
    } else {
      console.log('   🐌 Response times critically slow');
    }

    console.log('='.repeat(60));
  }
}

// Quick setup configurations
const configs = {
  local: {
    baseUrl: 'http://localhost:3000',
    concurrentUsers: 20
  },
  railway: {
    baseUrl: 'https://kl-regwriterpro-v3-production.up.railway.app',
    concurrentUsers: 20
  },
  staging: {
    baseUrl: 'https://your-staging-app.com',
    concurrentUsers: 20
  },
  production: {
    baseUrl: 'https://kl-regwriterpro-v3-production.up.railway.app',
    concurrentUsers: 10 // Be careful with production!
  }
};

// Run the test
async function runTest() {
  const environment = process.argv[2] || 'local';
  const config = configs[environment];
  
  if (!config) {
    console.error('❌ Invalid environment. Use: local, staging, or production');
    process.exit(1);
  }

  console.log(`🎯 Running stress test against ${environment} environment`);
  
  const stressTest = new RegulatorySysStressTest(config);
  
  try {
    await stressTest.runStressTest();
    console.log('\n✅ Stress test completed successfully');
  } catch (error) {
    console.error('\n💥 Stress test failed:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = RegulatorySysStressTest;

// Run if called directly
if (require.main === module) {
  runTest();
}