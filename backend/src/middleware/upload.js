const multer = require('multer')
const path = require('path')
const fs = require('fs').promises  // ← CHANGE: Use promises version
const { v4: uuidv4 } = require('uuid')

/**
 * Multer configuration for file uploads
 * Handles PDF file uploads with proper validation and storage
 */

// Ensure upload directory exists - ASYNC VERSION
const uploadDir = path.join(__dirname, '../../uploads')
const metadataDir = path.join(__dirname, '../../uploads/metadata')

const ensureDirectories = async () => {
  try {
    await fs.access(uploadDir)
  } catch {
    await fs.mkdir(uploadDir, { recursive: true })
  }
  
  try {
    await fs.access(metadataDir)
  } catch {
    await fs.mkdir(metadataDir, { recursive: true })
  }
}

// Initialize directories
ensureDirectories().catch(console.error)

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Generate UUID-based filename to match the metadata system
    const fileExtension = path.extname(file.originalname)
    const uuid = uuidv4()  // ← CHANGE: Store UUID for metadata
    const uniqueName = `${uuid}${fileExtension}`
    
    // Store UUID in request for metadata creation
    req.fileUuid = uuid
    
    cb(null, uniqueName)
  }
})

// File filter for PDF validation
const fileFilter = (req, file, cb) => {
  console.log(`📁 File upload attempt: ${file.originalname}`)
  console.log(`📎 MIME type: ${file.mimetype}`)
  
  // Check file type
  if (file.mimetype !== 'application/pdf') {
    console.log(`❌ Invalid file type: ${file.mimetype}`)
    return cb(new Error('Only PDF files are allowed'), false)
  }
  
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase()
  if (ext !== '.pdf') {
    console.log(`❌ Invalid file extension: ${ext}`)
    return cb(new Error('File must have .pdf extension'), false)
  }
  
  console.log(`✅ File validation passed`)
  cb(null, true)
}

// Configure multer with v2 compatibility
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  },
  // ← CHANGE: Add Multer v2 specific options
  preservePath: false,
  onError: function(err, next) {
    console.error('❌ Multer error:', err)
    next(err)
  }
})

/**
 * Middleware for handling single file upload
 */
const uploadSingleDocument = upload.single('document')

/**
 * Enhanced upload middleware with error handling
 */
const handleUpload = (req, res, next) => {
  uploadSingleDocument(req, res, (error) => {
    if (error) {
      console.error('❌ Upload middleware error:', error)
      
      if (error instanceof multer.MulterError) {
        switch (error.code) {
          case 'LIMIT_FILE_SIZE':
            return res.status(400).json({
              error: 'File too large',
              message: 'File size must be less than 10MB'
            })
          case 'LIMIT_FILE_COUNT':
            return res.status(400).json({
              error: 'Too many files',
              message: 'Please upload only one file at a time'
            })
          case 'LIMIT_UNEXPECTED_FILE':
            return res.status(400).json({
              error: 'Unexpected field',
              message: 'Please use the correct file upload field'
            })
          default:
            return res.status(400).json({
              error: 'Upload error',
              message: error.message
            })
        }
      }
      
      // Custom validation errors
      if (error.message.includes('Only PDF files')) {
        return res.status(400).json({
          error: 'Invalid file type',
          message: 'Only PDF files are supported'
        })
      }
      
      // Generic error
      return res.status(400).json({
        error: 'Upload failed',
        message: error.message || 'File upload failed'
      })
    }
    
    // Log successful upload
    if (req.file) {
      console.log(`✅ File uploaded successfully: ${req.file.filename}`)
      console.log(`📊 File size: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`)
      console.log(`🆔 File UUID: ${req.fileUuid}`)  // ← CHANGE: Log UUID
    }
    
    next()
  })
}

module.exports = {
  handleUpload,
  uploadSingleDocument
}