const express = require('express')
const router = express.Router()

// Try to import dependencies with error handling
let uploadController = null
let handleUpload = null

try {
  uploadController = require('../controllers/uploadController')
  console.log('✅ uploadController loaded successfully')
} catch (error) {
  console.error('❌ Failed to load uploadController:', error.message)
}

try {
  const uploadMiddleware = require('../middleware/upload')
  handleUpload = uploadMiddleware.handleUpload
  console.log('✅ upload middleware loaded successfully')
} catch (error) {
  console.error('❌ Failed to load upload middleware:', error.message)
}

/**
 * Upload routes for document processing
 */
if (uploadController && handleUpload) {
  // Both dependencies available - use full functionality
  router.post('/', handleUpload, uploadController.uploadDocument)
  console.log('✅ Full upload route configured')
} else {
  // Missing dependencies - create placeholder
  router.post('/', (req, res) => {
    res.status(501).json({
      error: 'Upload dependencies missing',
      message: 'uploadController or upload middleware not found',
      missingController: !uploadController,
      missingMiddleware: !handleUpload
    })
  })
  console.log('⚠️ Placeholder upload route configured due to missing dependencies')
}

module.exports = router