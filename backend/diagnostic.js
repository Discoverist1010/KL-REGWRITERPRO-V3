// Diagnostic script to test Railway deployment issues
const path = require('path');

console.log('=== Railway Deployment Diagnostic ===');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('');

// Check environment variables
console.log('Environment Variables:');
console.log('  PORT:', process.env.PORT || 'NOT SET');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('  CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? 'SET (hidden)' : 'NOT SET');
console.log('  FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');
console.log('');

// Check required modules
console.log('Module Loading Test:');
const modules = [
  'express',
  'cors',
  '@anthropic-ai/sdk',
  'p-queue',
  'bottleneck',
  'multer',
  'pdf-parse',
  'uuid'
];

let allModulesLoaded = true;
for (const mod of modules) {
  try {
    require(mod);
    console.log(`  ✅ ${mod}: loaded`);
  } catch (error) {
    console.log(`  ❌ ${mod}: ${error.message}`);
    allModulesLoaded = false;
  }
}
console.log('');

// Test queue service initialization
console.log('Queue Service Test:');
try {
  const queueService = require('./src/services/queueService');
  const status = queueService.getQueueStatus();
  console.log('  ✅ Queue service loaded successfully');
  console.log('  Queue status:', JSON.stringify(status, null, 2));
} catch (error) {
  console.log('  ❌ Queue service error:', error.message);
  console.log('  Stack trace:', error.stack);
}
console.log('');

// Test uploads directory
console.log('Uploads Directory Test:');
const fs = require('fs');
const uploadsPath = path.join(__dirname, 'uploads');
try {
  fs.accessSync(uploadsPath);
  console.log('  ✅ Uploads directory accessible');
} catch (error) {
  console.log('  ❌ Uploads directory not accessible:', error.message);
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('  ✅ Created uploads directory');
  } catch (mkdirError) {
    console.log('  ❌ Failed to create uploads directory:', mkdirError.message);
  }
}
console.log('');

// Test server startup
console.log('Server Startup Test:');
try {
  // Set minimal env vars for testing
  process.env.PORT = process.env.PORT || '5000';
  
  const app = require('./src/app');
  console.log('  ✅ App module loaded successfully');
  
  // Don't actually start the server, just check if it loads
  if (typeof app.listen === 'function') {
    console.log('  ✅ Express app configured correctly');
  } else {
    console.log('  ❌ Express app not configured correctly');
  }
} catch (error) {
  console.log('  ❌ App startup error:', error.message);
  console.log('  Stack trace:', error.stack);
}

console.log('');
console.log('=== Diagnostic Complete ===');