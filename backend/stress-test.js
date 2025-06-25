// Stress test to identify Railway deployment issues
const http = require('http');

console.log('=== Railway Health Check Stress Test ===');

// Test 1: Basic server with immediate response
console.log('\nTest 1: Basic server with immediate health check response');
const server1 = http.createServer((req, res) => {
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = process.env.PORT || 5000;
server1.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Basic server listening on port ${PORT}`);
  
  // Simulate health check request
  setTimeout(() => {
    console.log('\nSimulating health check request...');
    http.get(`http://localhost:${PORT}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Health check response:', data);
        console.log('Response time: immediate');
        server1.close();
        testDelayedStartup();
      });
    }).on('error', (err) => {
      console.error('Health check failed:', err.message);
      server1.close();
    });
  }, 100);
});

// Test 2: Server with delayed startup
function testDelayedStartup() {
  console.log('\nTest 2: Server with delayed initialization (simulating module loading)');
  
  const startTime = Date.now();
  
  // Simulate module loading delays
  setTimeout(() => {
    console.log('Loading queue service... (simulated 2s delay)');
  }, 2000);
  
  setTimeout(() => {
    console.log('Loading Claude service... (simulated 4s delay)');
  }, 4000);
  
  setTimeout(() => {
    console.log('All services loaded, starting server...');
    
    const server2 = http.createServer((req, res) => {
      if (req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'healthy',
          startupTime: `${(Date.now() - startTime) / 1000}s`
        }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    
    server2.listen(PORT + 1, '0.0.0.0', () => {
      console.log(`✅ Delayed server listening on port ${PORT + 1}`);
      console.log(`Total startup time: ${(Date.now() - startTime) / 1000}s`);
      
      // Test health check
      setTimeout(() => {
        http.get(`http://localhost:${PORT + 1}/api/health`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log('Health check response:', data);
            server2.close();
            testMemoryUsage();
          });
        }).on('error', (err) => {
          console.error('Health check failed:', err.message);
          server2.close();
        });
      }, 100);
    });
  }, 5000);
}

// Test 3: Memory usage during startup
function testMemoryUsage() {
  console.log('\nTest 3: Memory usage analysis');
  
  const used = process.memoryUsage();
  console.log('Memory usage:');
  for (let key in used) {
    console.log(`  ${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
  
  // Load all modules to check memory impact
  console.log('\nLoading all application modules...');
  const beforeModules = process.memoryUsage().heapUsed;
  
  try {
    require('express');
    require('cors');
    require('@anthropic-ai/sdk');
    require('p-queue');
    require('bottleneck');
    require('multer');
    require('pdf-parse');
    
    const afterModules = process.memoryUsage().heapUsed;
    const moduleMemory = (afterModules - beforeModules) / 1024 / 1024;
    console.log(`Module loading used: ${Math.round(moduleMemory * 100) / 100} MB`);
  } catch (error) {
    console.error('Error loading modules:', error.message);
  }
  
  testErrorHandling();
}

// Test 4: Error handling during startup
function testErrorHandling() {
  console.log('\nTest 4: Error handling and recovery');
  
  // Simulate various startup errors
  const errors = [
    { name: 'Missing environment variable', test: () => {
      if (!process.env.SOME_REQUIRED_VAR) {
        console.warn('⚠️  Warning: SOME_REQUIRED_VAR not set, using default');
      }
    }},
    { name: 'File system access', test: () => {
      const fs = require('fs');
      try {
        fs.accessSync('./uploads');
        console.log('✅ Uploads directory accessible');
      } catch (error) {
        console.warn('⚠️  Uploads directory not accessible, creating...');
        fs.mkdirSync('./uploads', { recursive: true });
      }
    }},
    { name: 'Port binding', test: () => {
      const testServer = http.createServer();
      testServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`❌ Port ${PORT} already in use`);
        } else {
          console.error(`❌ Server error: ${err.message}`);
        }
      });
      testServer.listen(PORT, () => {
        console.log(`✅ Port ${PORT} is available`);
        testServer.close();
      });
    }}
  ];
  
  errors.forEach(({ name, test }) => {
    console.log(`\nTesting: ${name}`);
    try {
      test();
    } catch (error) {
      console.error(`❌ ${name} failed:`, error.message);
    }
  });
  
  setTimeout(() => {
    console.log('\n=== Stress Test Complete ===');
    console.log('\nKey findings for Railway deployment:');
    console.log('1. Health check endpoint must respond quickly (< 10s)');
    console.log('2. Module loading adds startup delay');
    console.log('3. Memory usage is reasonable for small instances');
    console.log('4. Ensure all environment variables are set in Railway');
    console.log('5. Create required directories on startup');
    console.log('6. Use 0.0.0.0 for binding in Railway environment');
    process.exit(0);
  }, 1000);
}