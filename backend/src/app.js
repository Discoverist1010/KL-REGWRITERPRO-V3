// backend/src/app.js - EMERGENCY RAILWAY FIX
const express = require('express')

console.log('🚀 EMERGENCY RAILWAY FIX STARTING...')
console.log('📊 Environment Check:')
console.log(`   NODE_VERSION: ${process.version}`)
console.log(`   PORT: ${process.env.PORT || 'NOT_SET'}`)
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'NOT_SET'}`)
console.log(`   PWD: ${process.cwd()}`)

const app = express()
const PORT = process.env.PORT || 5000

// Minimal middleware only
app.use(express.json())

// CORS - Ultra simple
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Access-Control-Allow-Headers', '*')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  next()
})

// Basic endpoints
app.get('/', (req, res) => {
  console.log('✅ Root endpoint accessed')
  res.json({
    message: 'EMERGENCY RAILWAY FIX',
    status: 'WORKING',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  })
})

app.get('/api/health', (req, res) => {
  console.log('✅ Health check accessed')
  res.json({
    status: 'healthy',
    message: 'EMERGENCY FIX WORKING',
    timestamp: new Date().toISOString(),
    railway: 'SUCCESS'
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

// Start server with detailed logging
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ================================')
  console.log('🚀 EMERGENCY RAILWAY FIX STARTED')
  console.log(`🚀 PORT: ${PORT}`)
  console.log(`🚀 HOST: 0.0.0.0`)
  console.log(`🚀 TIME: ${new Date().toISOString()}`)
  console.log('🚀 READY FOR REQUESTS')
  console.log('🚀 ================================')
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err.message)
  process.exit(1)
})

module.exports = app