// Startup fix patch for Railway deployment
// This file adds a readiness delay to the health check

const originalApp = require('./app');

// Add this to the beginning of your app.js file:
let isReady = false;

// Delay readiness for 10 seconds to allow all services to initialize
setTimeout(() => {
  isReady = true;
  console.log('✅ Application ready for health checks');
}, 10000);

// Wrap the original health check
const originalHealthCheck = originalApp.get('/api/health');
originalApp.get('/api/health', (req, res) => {
  if (!isReady) {
    // Return 503 Service Unavailable during startup
    return res.status(503).json({
      status: 'starting',
      message: 'Application is initializing, please wait...',
      readyIn: '10 seconds'
    });
  }
  
  // Call original health check if ready
  if (originalHealthCheck) {
    return originalHealthCheck(req, res);
  } else {
    // Fallback health response
    return res.status(200).json({
      status: 'healthy',
      message: 'Service is running'
    });
  }
});

module.exports = originalApp;