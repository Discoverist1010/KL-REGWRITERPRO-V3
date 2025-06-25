// backend/src/app.js - RAILWAY COMPATIBLE WITH ORIGINAL ROUTE STRUCTURE
const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

// Add readiness flag for health checks
let isAppReady = false
setTimeout(() => {
  isAppReady = true
  console.log('✅ Application ready for health checks')
}, 5000) // 5 second delay for all services to initialize

console.log('🚀 KL RegWriter Pro V3 Backend - RESTORED ARCHITECTURE')
console.log('📊 Startup Diagnostics:')
console.log(`   🔌 PORT: ${PORT}`)
console.log(`   🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
console.log(`   🔑 Claude API: ${process.env.CLAUDE_API_KEY ? 'configured' : 'missing'}`)

// Trust Railway proxy
app.set('trust proxy', 1)

// CORS - Permissive but structured (based on your original)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-File-Name')
  
  if (req.method === 'OPTIONS') {
    console.log(`✅ CORS Preflight handled for ${req.url}`)
    return res.status(200).end()
  }
  
  console.log(`📡 ${req.method} ${req.url}`)
  next()
})

// Basic CORS as backup
app.use(cors({
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200
}))

// Middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Static file serving (from your original)
app.use('/uploads', (req, res, next) => {
  console.log(`📁 Static file request: ${req.url}`)
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
}, express.static(path.join(__dirname, '../uploads')))

// Health check (enhanced from your original)
app.get('/api/health', (req, res) => {
  console.log(`🔍 Health check from: ${req.headers.origin || 'no-origin'}`)
  
  // Return 503 if app is still initializing
  if (!isAppReady) {
    return res.status(503).json({
      status: 'starting',
      message: 'Application is initializing, please wait...',
      timestamp: new Date().toISOString()
    })
  }
  
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
    cors: 'enabled',
    diagnostics: {
      port: PORT,
      nodeVersion: process.version,
      uploadsAccessible: uploadsAccessible,
      claudeConfigured: !!process.env.CLAUDE_API_KEY
    }
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'KL RegWriter Pro V3 Backend API',
    version: '3.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  })
})

// RESTORED ROUTE LOADING with Railway compatibility
let routesStatus = {
  upload: false,
  sessions: false,
  analysis: false,
  errors: []
}

// Load Upload Routes (your original structure)
try {
  console.log('📁 Loading upload routes...')
  const uploadRoutes = require('./routes/upload')
  app.use('/api/upload', uploadRoutes)
  routesStatus.upload = true
  console.log('✅ Upload routes loaded')
} catch (error) {
  console.error('❌ Upload routes failed:', error.message)
  routesStatus.errors.push(`Upload: ${error.message}`)
  
  // Fallback upload endpoint if routes fail
  app.post('/api/upload', (req, res) => {
    console.log('⚠️ Using fallback upload endpoint')
    res.status(503).json({
      error: 'Upload service temporarily unavailable',
      message: 'Upload controller dependencies missing',
      details: error.message
    })
  })
}

// Load Session Routes (your original structure)
try {
  console.log('📁 Loading session routes...')
  const sessionRoutes = require('./routes/sessions')
  app.use('/api/sessions', sessionRoutes)
  routesStatus.sessions = true
  console.log('✅ Session routes loaded')
} catch (error) {
  console.error('❌ Session routes failed:', error.message)
  routesStatus.errors.push(`Sessions: ${error.message}`)
  
  // Fallback session endpoints if routes fail
  app.post('/api/sessions', (req, res) => {
    console.log('⚠️ Using fallback session creation')
    res.status(503).json({
      error: 'Session service temporarily unavailable',
      message: 'Session controller dependencies missing'
    })
  })
  
  app.get('/api/sessions/:sessionId', (req, res) => {
    console.log('⚠️ Using fallback session retrieval')
    res.status(503).json({
      error: 'Session service temporarily unavailable',
      sessionId: req.params.sessionId
    })
  })
}

// Load Analysis Routes (your original structure)
try {
  console.log('📁 Loading analysis routes...')
  const analysisRoutes = require('./routes/analysis')
  app.use('/api/analysis', analysisRoutes)
  routesStatus.analysis = true
  console.log('✅ Analysis routes loaded')
} catch (error) {
  console.error('❌ Analysis routes failed:', error.message)
  routesStatus.errors.push(`Analysis: ${error.message}`)
  
  // Fallback analysis endpoints if routes fail
  app.post('/api/analysis/submit', (req, res) => {
    console.log('⚠️ Using fallback analysis submission')
    res.status(503).json({
      error: 'Analysis service temporarily unavailable',
      message: 'Claude service dependencies missing'
    })
  })
}

// Queue Status Endpoints
const queueService = require('./services/queueService')

// Get queue status
app.get('/api/queue/status', (req, res) => {
  console.log('📊 Queue status requested')
  try {
    const status = queueService.getQueueStatus()
    res.json({
      success: true,
      data: status
    })
  } catch (error) {
    console.error('❌ Queue status error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get queue status'
    })
  }
})

// Get estimated wait time
app.get('/api/queue/wait-time', (req, res) => {
  console.log('⏱️ Wait time requested')
  try {
    const waitTime = queueService.getEstimatedWaitTime()
    res.json({
      success: true,
      data: waitTime
    })
  } catch (error) {
    console.error('❌ Wait time error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get wait time'
    })
  }
})

// Pause queue (admin only - add auth in production!)
app.post('/api/queue/pause', (req, res) => {
  console.log('⏸️ Queue pause requested')
  try {
    queueService.pauseQueue()
    res.json({
      success: true,
      message: 'Queue paused successfully'
    })
  } catch (error) {
    console.error('❌ Queue pause error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to pause queue'
    })
  }
})

// Resume queue (admin only - add auth in production!)
app.post('/api/queue/resume', (req, res) => {
  console.log('▶️ Queue resume requested')
  try {
    queueService.resumeQueue()
    res.json({
      success: true,
      message: 'Queue resumed successfully'
    })
  } catch (error) {
    console.error('❌ Queue resume error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to resume queue'
    })
  }
})

// Diagnostics endpoint (from your original)
app.get('/api/diagnostics', (req, res) => {
  const queueStatus = queueService.getQueueStatus()
  res.json({
    timestamp: new Date().toISOString(),
    routes: routesStatus,
    queue: {
      size: queueStatus.queueSize,
      pending: queueStatus.pending,
      totalProcessed: queueStatus.totalProcessed,
      totalErrors: queueStatus.totalErrors
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        FRONTEND_URL: process.env.FRONTEND_URL,
        CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ? 'configured' : 'missing'
      }
    }
  })
})

// 404 handler (your original)
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`)
  res.status(404).json({
    error: 'Endpoint not found',
    method: req.method,
    url: req.originalUrl,
    availableEndpoints: ['/api/health', '/api/diagnostics', '/api/upload', '/api/sessions', '/api/analysis']
  })
})

// Error handling (your original)
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error.message)
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  })
})

// Start server (Railway compatible)
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ================================')
  console.log('🚀 KL REGWRITER PRO V3 - RESTORED')
  console.log(`🚀 PORT: ${PORT}`)
  console.log(`🚀 Routes Status:`)
  console.log(`   Upload: ${routesStatus.upload ? '✅' : '❌'}`)
  console.log(`   Sessions: ${routesStatus.sessions ? '✅' : '❌'}`)
  console.log(`   Analysis: ${routesStatus.analysis ? '✅' : '❌'}`)
  if (routesStatus.errors.length > 0) {
    console.log(`❌ Route Errors:`)
    routesStatus.errors.forEach(err => console.log(`   ${err}`))
  }
  console.log('🚀 ================================')
})

// Graceful shutdown (your original)
process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🔄 Received SIGINT, shutting down gracefully')
  process.exit(0)
})

module.exports = app