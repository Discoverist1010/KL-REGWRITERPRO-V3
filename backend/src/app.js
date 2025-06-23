const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

// 🚨 EMERGENCY CORS - ULTRA PERMISSIVE FOR IMMEDIATE FIX
app.use((req, res, next) => {
  // Set CORS headers manually for maximum compatibility
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-File-Name')
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    console.log(`✅ CORS Preflight handled for ${req.url} from ${req.headers.origin}`)
    return res.status(200).end()
  }
  
  console.log(`📡 Request: ${req.method} ${req.url} from ${req.headers.origin || 'no-origin'}`)
  next()
})

// Basic CORS as backup
app.use(cors({
  origin: true, // Allow all origins temporarily
  credentials: true,
  optionsSuccessStatus: 200
}))

// Basic middleware - EARLY
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check VERY EARLY - before all other routes
app.get('/api/health', (req, res) => {
  console.log(`🔍 Health check from: ${req.headers.origin || 'no-origin'}`)
  res.status(200).json({
    status: 'healthy',
    message: '✅ Connected (healthy)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: 'emergency-override-enabled',
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'KL RegWriter Pro V3 Backend API',
    version: '3.0.0',
    status: 'running',
    cors: 'emergency-override',
    timestamp: new Date().toISOString()
  })
})

// Static file serving with manual CORS
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
}, express.static(path.join(__dirname, '../uploads')))

// Production optimizations - CONDITIONAL
if (process.env.NODE_ENV === 'production') {
  console.log('🔒 Loading production optimizations...')
  
  try {
    const helmet = require('helmet')
    const compression = require('compression')
    
    app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false // Disabled for CORS compatibility
    }))
    
    app.use(compression())
    console.log('✅ Production optimizations loaded')
  } catch (error) {
    console.warn('⚠️ Production optimizations failed:', error.message)
  }
}

// Import routes with error handling
try {
  const uploadRoutes = require('./routes/upload')
  const sessionRoutes = require('./routes/sessions')
  const analysisRoutes = require('./routes/analysis')
  
  app.use('/api/upload', uploadRoutes)
  app.use('/api/sessions', sessionRoutes)
  app.use('/api/analysis', analysisRoutes)
  
  console.log('✅ All routes loaded')
} catch (error) {
  console.error('❌ Route loading failed:', error.message)
}

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`)
  res.status(404).json({
    error: 'Endpoint not found',
    method: req.method,
    url: req.originalUrl,
    availableEndpoints: ['/api/health', '/api/upload', '/api/sessions', '/api/analysis']
  })
})

// Error handling
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error.message)
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 KL RegWriter Pro V3 Backend - EMERGENCY CORS MODE`)
  console.log(`📍 Port: ${PORT}`)
  console.log(`🌐 CORS: FULLY PERMISSIVE (emergency mode)`)
  console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Test: https://kl-regwriterpro-v3-production.up.railway.app/api/health`)
  console.log(`🚨 WARNING: Using permissive CORS for debugging`)
})

module.exports = app