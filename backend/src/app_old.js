const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

// 🔧 SURGICAL FIX: Add Railway startup diagnostics
console.log('🚀 KL RegWriter Pro V3 Backend Starting...')
console.log('📊 Startup Diagnostics:')
console.log(`   🔌 PORT: ${PORT} (from ${process.env.PORT ? 'Railway' : 'fallback'})`)
console.log(`   🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
console.log(`   🎯 __dirname: ${__dirname}`)
console.log(`   📁 uploads path: ${path.join(__dirname, '../uploads')}`)
console.log(`   🔑 Claude API: ${process.env.CLAUDE_API_KEY ? 'configured' : 'missing'}`)

// 🚨 EMERGENCY CORS - ULTRA PERMISSIVE FOR IMMEDIATE FIX (KEEP YOUR EXISTING LOGIC)
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

// 🔧 SURGICAL FIX: Enhanced health check with full diagnostics
app.get('/api/health', (req, res) => {
  console.log(`🔍 Health check from: ${req.headers.origin || 'no-origin'}`)
  
  // Test file system access
  let uploadsAccessible = false
  try {
    const fs = require('fs')
    const uploadsPath = path.join(__dirname, '../uploads')
    fs.accessSync(uploadsPath)
    uploadsAccessible = true
  } catch (error) {
    console.warn('⚠️ Uploads directory not accessible:', error.message)
  }
  
  res.status(200).json({
    status: 'healthy',
    message: '✅ Connected (healthy)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: 'emergency-override-enabled',
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    // 🔧 SURGICAL ADD: Detailed diagnostics
    diagnostics: {
      port: PORT,
      nodeVersion: process.version,
      platform: process.platform,
      uploadsAccessible: uploadsAccessible,
      claudeConfigured: !!process.env.CLAUDE_API_KEY,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    }
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

// 🔧 SURGICAL FIX: Enhanced static file serving with diagnostics
app.use('/uploads', (req, res, next) => {
  console.log(`📁 Static file request: ${req.url}`)
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
}, express.static(path.join(__dirname, '../uploads')))

// Production optimizations - CONDITIONAL (KEEP YOUR EXISTING LOGIC)
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

// 🔧 SURGICAL FIX: Enhanced route loading with detailed diagnostics
let routesStatus = {
  upload: false,
  sessions: false,
  analysis: false,
  errors: []
}

try {
  console.log('📁 Loading upload routes...')
  const uploadRoutes = require('./routes/upload')
  app.use('/api/upload', uploadRoutes)
  routesStatus.upload = true
  console.log('✅ Upload routes loaded')
} catch (error) {
  console.error('❌ Upload routes failed:', error.message)
  routesStatus.errors.push(`Upload: ${error.message}`)
}

try {
  console.log('📁 Loading session routes...')
  const sessionRoutes = require('./routes/sessions')
  app.use('/api/sessions', sessionRoutes)
  routesStatus.sessions = true
  console.log('✅ Session routes loaded')
} catch (error) {
  console.error('❌ Session routes failed:', error.message)
  routesStatus.errors.push(`Sessions: ${error.message}`)
}

try {
  console.log('📁 Loading analysis routes...')
  const analysisRoutes = require('./routes/analysis')
  app.use('/api/analysis', analysisRoutes)
  routesStatus.analysis = true
  console.log('✅ Analysis routes loaded')
} catch (error) {
  console.error('❌ Analysis routes failed:', error.message)
  routesStatus.errors.push(`Analysis: ${error.message}`)
}

// 🔧 SURGICAL ADD: Route diagnostics endpoint
app.get('/api/diagnostics', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    routes: routesStatus,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        FRONTEND_URL: process.env.FRONTEND_URL,
        CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ? 'configured' : 'missing'
      }
    },
    performance: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    }
  })
})

// 404 handler (KEEP YOUR EXISTING LOGIC)
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`)
  res.status(404).json({
    error: 'Endpoint not found',
    method: req.method,
    url: req.originalUrl,
    availableEndpoints: ['/api/health', '/api/diagnostics', '/api/upload', '/api/sessions', '/api/analysis']
  })
})

// Error handling (KEEP YOUR EXISTING LOGIC)
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error.message)
  console.error('📊 Error Stack:', error.stack)
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  })
})

// 🔧 SURGICAL FIX: Enhanced server startup with diagnostics
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ================================')
  console.log(`🚀 KL RegWriter Pro V3 Backend - EMERGENCY CORS MODE`)
  console.log(`📍 Port: ${PORT}`)
  console.log(`🌐 CORS: FULLY PERMISSIVE (emergency mode)`)
  console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`📁 Routes Status:`)
  console.log(`   Upload: ${routesStatus.upload ? '✅' : '❌'}`)
  console.log(`   Sessions: ${routesStatus.sessions ? '✅' : '❌'}`)
  console.log(`   Analysis: ${routesStatus.analysis ? '✅' : '❌'}`)
  if (routesStatus.errors.length > 0) {
    console.log(`❌ Route Errors:`)
    routesStatus.errors.forEach(err => console.log(`   ${err}`))
  }
  console.log(`🔗 Health: https://kl-regwriterpro-v3-production.up.railway.app/api/health`)
  console.log(`🔍 Diagnostics: https://kl-regwriterpro-v3-production.up.railway.app/api/diagnostics`)
  console.log(`🚨 WARNING: Using permissive CORS for debugging`)
  console.log('🚀 ================================')
})

// 🔧 SURGICAL ADD: Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🔄 Received SIGINT, shutting down gracefully')
  process.exit(0)
})

module.exports = app