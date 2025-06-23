// backend/src/app.js - WORKING RAILWAY FIX WITH ALL ENDPOINTS
const express = require('express')

console.log('🚀 WORKING RAILWAY FIX STARTING...')
console.log('📊 Environment Check:')
console.log(`   NODE_VERSION: ${process.version}`)
console.log(`   PORT: ${process.env.PORT || 'NOT_SET'}`)
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'NOT_SET'}`)

const app = express()
const PORT = process.env.PORT || 5000

// Trust Railway proxy
app.set('trust proxy', 1)

// Basic middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS - Ultra permissive for testing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Access-Control-Allow-Headers', '*')
  
  if (req.method === 'OPTIONS') {
    console.log(`✅ OPTIONS ${req.url}`)
    return res.status(200).end()
  }
  
  console.log(`📡 ${req.method} ${req.url}`)
  next()
})

// Root endpoint (WORKING)
app.get('/', (req, res) => {
  console.log('✅ Root endpoint accessed')
  res.status(200).json({
    message: 'KL RegWriter Pro V3 Backend - WORKING',
    status: 'OPERATIONAL',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  })
})

// Health endpoints - Multiple formats
app.get('/health', (req, res) => {
  console.log('✅ /health accessed')
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

app.get('/api/health', (req, res) => {
  console.log('✅ /api/health accessed')
  res.status(200).json({
    status: 'healthy',
    message: 'Backend operational and ready for frontend connection',
    timestamp: new Date().toISOString(),
    railway: 'SUCCESS',
    cors: 'enabled'
  })
})

app.get('/healthz', (req, res) => {
  console.log('✅ /healthz accessed')
  res.status(200).send('OK')
})

// Test endpoint
app.get('/test', (req, res) => {
  console.log('✅ Test endpoint accessed')
  res.status(200).json({
    message: 'TEST ENDPOINT WORKING',
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    railway: 'operational'
  })
})

// API endpoints for frontend connection
app.get('/api/test', (req, res) => {
  console.log('✅ API test endpoint accessed')
  res.status(200).json({
    message: 'API endpoints working',
    timestamp: new Date().toISOString(),
    ready_for_frontend: true
  })
})

// Placeholder upload endpoint for testing
app.post('/api/upload', (req, res) => {
  console.log('✅ Upload endpoint accessed')
  res.status(200).json({
    message: 'Upload endpoint accessible (placeholder)',
    timestamp: new Date().toISOString(),
    ready_for_implementation: true
  })
})

// Placeholder session endpoint
app.get('/api/sessions/:sessionId', (req, res) => {
  console.log(`✅ Session endpoint accessed: ${req.params.sessionId}`)
  res.status(200).json({
    message: 'Session endpoint accessible (placeholder)',
    sessionId: req.params.sessionId,
    timestamp: new Date().toISOString()
  })
})

// Catch all
app.use('*', (req, res) => {
  console.log(`❓ Unknown: ${req.method} ${req.originalUrl}`)
  res.status(404).json({
    error: 'Endpoint not found',
    method: req.method,
    url: req.originalUrl,
    availableEndpoints: [
      '/',
      '/health',
      '/api/health', 
      '/test',
      '/api/test',
      '/api/upload',
      '/api/sessions/:id'
    ]
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message)
  res.status(500).json({
    error: 'Server error',
    message: err.message
  })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ================================')
  console.log('🚀 KL REGWRITER PRO V3 - WORKING!')
  console.log(`🚀 PORT: ${PORT}`)
  console.log(`🚀 HOST: 0.0.0.0`)
  console.log(`🚀 TIME: ${new Date().toISOString()}`)
  console.log('🚀 ENDPOINTS READY:')
  console.log('🚀   GET /')
  console.log('🚀   GET /health')
  console.log('🚀   GET /api/health')  
  console.log('🚀   GET /test')
  console.log('🚀   GET /api/test')
  console.log('🚀   POST /api/upload')
  console.log('🚀   GET /api/sessions/:id')
  console.log('🚀 READY FOR FRONTEND CONNECTION!')
  console.log('🚀 ================================')
})

module.exports = app