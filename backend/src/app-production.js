const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

// Production security middleware
if (process.env.NODE_ENV === 'production') {
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
}

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '3.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

// Import routes
const uploadRoutes = require('./routes/upload')
const sessionRoutes = require('./routes/sessions')
const analysisRoutes = require('./routes/analysis')

// Use routes
app.use('/api/upload', uploadRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/analysis', analysisRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err)
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    })
  } else {
    res.status(500).json({ 
      error: err.message,
      stack: err.stack
    })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 KL RegWriter Pro V3 Backend`)
  console.log(`📡 Server running on port ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
  console.log(`🤖 Claude API: ${process.env.CLAUDE_API_KEY ? 'Configured' : 'Missing'}`)
})

module.exports = app
