const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

// ⭐ ADD PRODUCTION OPTIMIZATIONS HERE ⭐
// =====================================
if (process.env.NODE_ENV === 'production') {
  console.log('🔒 Enabling production security and performance optimizations...')
  
  const helmet = require('helmet')
  const compression = require('compression')
  const rateLimit = require('express-rate-limit')
  
  // Security headers - CORS-friendly configuration
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.anthropic.com", "https://kl-regwriterpro-v3.vercel.app"]
      }
    }
  }))
  
  // Compression
  app.use(compression())
  
  // Rate limiting for API endpoints
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Increased for CORS preflight requests
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/api/health' // 🔧 ADDED: Don't rate limit health checks
  })
  
  app.use('/api/', limiter)
  
  // Stricter rate limiting for file uploads
  const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 uploads per minute
    message: { error: 'Upload rate limit exceeded' }
  })
  
  app.use('/api/upload', uploadLimiter)
  
  console.log('✅ Production optimizations enabled')
}
// =====================================

// Import routes that we know work
const uploadRoutes = require('./routes/upload')      
const sessionRoutes = require('./routes/sessions')   
const analysisRoutes = require('./routes/analysis')  

// 🔧 ENHANCED CORS CONFIGURATION - KEY FIX
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true)
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://kl-regwriterpro-v3.vercel.app',
      'https://kl-regwriterpro-v3-git-main-discoverist1010.vercel.app', // Git branch deployments
      process.env.FRONTEND_URL
    ].filter(Boolean)
    
    // Check for Vercel preview deployments (dynamic URLs)
    const isVercelPreview = origin.includes('kl-regwriterpro-v3') && origin.includes('vercel.app')
    
    if (allowedOrigins.includes(origin) || isVercelPreview) {
      console.log(`✅ CORS allowed for origin: ${origin}`)
      callback(null, true)
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`)
      console.log(`🔍 Allowed origins:`, allowedOrigins)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control'
  ]
}

app.use(cors(corsOptions))

// 🔧 HANDLE PREFLIGHT REQUESTS EXPLICITLY - KEY FIX
app.options('*', cors(corsOptions))

// Middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 🔧 SERVE UPLOADED FILES WITH CORS HEADERS - KEY FIX
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
}, express.static(path.join(__dirname, '../uploads')))

// Health check endpoint with enhanced logging
app.get('/api/health', (req, res) => {
  console.log(`🔍 Health check from origin: ${req.headers.origin || 'no-origin'}`)
  res.json({
    status: 'healthy',
    message: '✅ Connected (healthy)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: 'enabled',
    origin: req.headers.origin,
    frontend_url: process.env.FRONTEND_URL
  })
})

// API Routes
app.use('/api/upload', uploadRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/analysis', analysisRoutes)

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'KL RegWriter Pro V3 Backend API',
    version: '3.0.0',
    status: 'running',
    note: 'Production-ready with Claude AI integration',
    cors: 'enabled',
    endpoints: {
      health: '/api/health',
      upload: '/api/upload',
      sessions: '/api/sessions',
      analysis: '/api/analysis'
    }
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
    availableEndpoints: ['/api/health', '/api/upload', '/api/sessions', '/api/analysis']
  })
})

// 🔧 ENHANCED ERROR HANDLING WITH CORS DEBUGGING - COMPLETION
app.use((error, req, res, next) => {
  if (error.message === 'Not allowed by CORS') {
    console.error('❌ CORS Error Details:', {
      origin: req.headers.origin,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent']
    })
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed by CORS policy',
      origin: req.headers.origin,
      allowedOrigins: [
        'https://kl-regwriterpro-v3.vercel.app',
        process.env.FRONTEND_URL
      ].filter(Boolean)
    })
  }
  
  console.error('❌ Server Error:', error)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 KL RegWriter Pro V3 Backend running on port ${PORT}`)
  console.log(`📁 Upload directory: ${path.join(__dirname, '../uploads')}`)
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
  console.log(`🔗 Vercel preview deployments: Auto-detected`)
  console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`✅ Upload route enabled`)
  console.log(`✅ Sessions and Analysis routes available`)
  console.log(`🤖 Claude AI integration: ${process.env.CLAUDE_API_KEY ? 'Configured' : 'Missing API key'}`)
  console.log(`🔍 Health check: https://kl-regwriterpro-v3-production.up.railway.app/api/health`)
})

module.exports = app