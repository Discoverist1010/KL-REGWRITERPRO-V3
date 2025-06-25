// Diagnostic script to understand 404 issue
const express = require('express');
const app = express();

// Import the existing app configuration
const mainApp = require('./src/app');

// List all registered routes
function printRoutes(app) {
  const routes = [];
  
  app._router.stack.forEach(function(middleware) {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        method: Object.keys(middleware.route.methods).join(', ').toUpperCase()
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach(function(handler) {
        if (handler.route) {
          const path = middleware.regexp.toString()
            .replace('/^', '')
            .replace('\\/?(?=\\/|$)/i', '')
            .replace(/\\/g, '');
          
          routes.push({
            path: path + handler.route.path,
            method: Object.keys(handler.route.methods).join(', ').toUpperCase()
          });
        }
      });
    }
  });
  
  return routes;
}

console.log('\n📋 Registered Routes in Backend:\n');
console.log('=====================================');

const routes = printRoutes(mainApp);
routes.forEach(route => {
  console.log(`${route.method.padEnd(8)} ${route.path}`);
});

console.log('=====================================\n');

// Specifically check for analysis routes
const analysisRoutes = routes.filter(r => r.path.includes('analysis'));
if (analysisRoutes.length > 0) {
  console.log('✅ Analysis routes found:');
  analysisRoutes.forEach(r => console.log(`   ${r.method} ${r.path}`));
} else {
  console.log('❌ No analysis routes found!');
}

// Check if the specific endpoint exists
const submitRoute = routes.find(r => r.path.includes('analysis/submit'));
if (submitRoute) {
  console.log(`\n✅ Submit endpoint exists: ${submitRoute.method} ${submitRoute.path}`);
} else {
  console.log('\n❌ Submit endpoint NOT found!');
}

process.exit(0);