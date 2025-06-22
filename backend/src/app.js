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
  
  // Security headers
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.anthropic.com"]
      }
    }
  }))
  
  // Compression
  app.use(compression())
  
  // Rate limiting for API endpoints
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
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
const uploadRoutes = require('./routes/upload')      // NOT ./src/routes/upload
const sessionRoutes = require('./routes/sessions')   // NOT ./src/routes/sessions  
const analysisRoutes = require('./routes/analysis')  // NOT ./src/routes/analysis

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: '✅ Connected (healthy)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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
    availableEndpoints: ['/api/health', '/api/sessions', '/api/analysis']
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 KL RegWriter Pro V3 Backend running on port ${PORT}`)
  console.log(`📁 Upload directory: ${path.join(__dirname, 'uploads')}`)
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
  console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`✅ Upload route enabled`)
  console.log(`✅ Sessions and Analysis routes available`)
  console.log(`🤖 Claude AI integration: ${process.env.CLAUDE_API_KEY ? 'Configured' : 'Missing API key'}`)
})

module.exports = app