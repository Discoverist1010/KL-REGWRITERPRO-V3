// diagnostic.js - Quick diagnosis and fixes
const http = require('http');

class SystemDiagnostic {
  constructor(baseUrl = 'https://kl-regwriterpro-v3-production.up.railway.app') {
    this.baseUrl = baseUrl;
  }

  async runDiagnostic() {
    console.log('🔍 Running system diagnostic...\n');

    // Test 1: Basic server connectivity
    console.log('1. Testing server connectivity...');
    const serverTest = await this.testEndpoint('/', 'GET');
    console.log(`   Server reachable: ${serverTest.success ? '✅' : '❌'}`);
    if (!serverTest.success) {
      console.log(`   Error: ${serverTest.error}`);
    }

    // Test 2: Health endpoint
    console.log('\n2. Testing health endpoint...');
    const healthTest = await this.testEndpoint('/api/health', 'GET');
    console.log(`   Health endpoint: ${healthTest.success ? '✅' : '❌'}`);
    if (!healthTest.success) {
      console.log(`   Error: ${healthTest.error}`);
      console.log('   🔧 Fix: Check if /api/health route exists');
    }

    // Test 3: Analysis endpoint structure
    console.log('\n3. Testing analysis endpoint...');
    const analysisTest = await this.testEndpoint('/api/analysis', 'POST', {
      answers: {
        executiveSummary: "Test summary",
        impactAnalysis: "Test analysis"
      },
      sessionId: "diagnostic_test"
    });
    console.log(`   Analysis endpoint: ${analysisTest.success ? '✅' : '❌'}`);
    if (!analysisTest.success) {
      console.log(`   Error: ${analysisTest.error}`);
    }

    // Test 4: Environment variables
    console.log('\n4. Environment check...');
    this.checkEnvironmentVariables();

    console.log('\n' + '='.repeat(50));
    console.log('🎯 RECOMMENDED FIXES:');
    console.log('='.repeat(50));
    
    if (!serverTest.success) {
      console.log('🔴 CRITICAL: Server not running');
      console.log('   → Start your server: npm start or node server.js');
    }
    
    if (!healthTest.success) {
      console.log('🟠 MISSING: Health endpoint');
      console.log('   → Add health route to your Express app');
    }
    
    if (!analysisTest.success) {
      console.log('🟡 ISSUE: Analysis endpoint problems');
      console.log('   → Check route handler and request body parsing');
    }
  }

  async testEndpoint(path, method, data = null) {
    return new Promise((resolve) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 3000,
        path: url.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 400,
            statusCode: res.statusCode,
            data: responseData,
            error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          statusCode: 0,
          data: null,
          error: error.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          statusCode: 0,
          data: null,
          error: 'Timeout'
        });
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  checkEnvironmentVariables() {
    const requiredVars = [
      'CLAUDE_API_KEY',
      'NODE_ENV',
      'PORT'
    ];

    requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`   ✅ ${varName}: Set`);
        if (varName === 'CLAUDE_API_KEY') {
          console.log(`      Format: ${value.startsWith('sk-ant-') ? '✅ Valid' : '❌ Invalid'}`);
        }
      } else {
        console.log(`   ❌ ${varName}: Missing`);
      }
    });
  }
}

// Quick server health check
async function quickHealthCheck() {
  const diagnostic = new SystemDiagnostic();
  await diagnostic.runDiagnostic();
}

if (require.main === module) {
  quickHealthCheck();
}

module.exports = SystemDiagnostic;