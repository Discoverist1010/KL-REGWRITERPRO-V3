const fs = require('fs').promises
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const pdfService = require('../services/pdfService')

/**
 * Store document metadata - standalone function
 */
const storeDocumentMetadata = async (documentData) => {
  try {
    const metadataPath = path.join(__dirname, '../../uploads/metadata')
    
    // Ensure metadata directory exists
    await fs.mkdir(metadataPath, { recursive: true })
    
    const metadataFile = path.join(metadataPath, `${documentData.id}.json`)
    await fs.writeFile(metadataFile, JSON.stringify(documentData, null, 2))
    
    console.log(`💾 Metadata stored: ${metadataFile}`)
    
  } catch (error) {
    console.error('Failed to store document metadata:', error)
    throw error
  }
}

/**
 * Retrieve document metadata by ID - standalone function
 */
const getDocumentMetadata = async (documentId) => {
  try {
    const metadataPath = path.join(__dirname, '../../uploads/metadata', `${documentId}.json`)
    const metadataContent = await fs.readFile(metadataPath, 'utf8')
    return JSON.parse(metadataContent)
  } catch (error) {
    console.error('Failed to retrieve document metadata:', error)
    throw new Error('Document not found')
  }
}

/**
 * Handle document upload and processing - main function
 */
const uploadDocument = async (req, res) => {
  try {
    console.log('📤 Upload request received')
    
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a PDF file to upload'
      })
    }

    const { language } = req.body
    const file = req.file

    console.log(`📄 Processing file: ${file.originalname}`)
    console.log(`🌐 Language: ${language}`)

    // Validate file type
    if (file.mimetype !== 'application/pdf') {
      await fs.unlink(file.path).catch(console.error)
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only PDF files are supported'
      })
    }

    // Generate unique document ID
    const documentId = uuidv4()
    
    console.log(`🆔 Document ID: ${documentId}`)

    // Extract text content from PDF
    const textContent = await pdfService.extractTextFromPDF(file.path)
    
    if (!textContent || textContent.trim().length === 0) {
      await fs.unlink(file.path).catch(console.error)
      return res.status(400).json({
        error: 'PDF processing failed',
        message: 'Could not extract text from PDF. Please ensure the file is not corrupted.'
      })
    }

    console.log(`✅ Text extraction successful: ${textContent.length} characters`)

    // Create document metadata
    const documentData = {
      id: documentId,
      originalName: file.originalname,
      filename: file.filename,
      filepath: file.path,
      language: language || 'English',
      textContent: textContent,
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
      textLength: textContent.length,
      url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
    }

    // Store document metadata using the standalone function
    await storeDocumentMetadata(documentData)

    console.log(`✅ Document processed successfully`)

    // Return success response
    res.status(200).json({
      message: 'Document uploaded and processed successfully',
      data: {
        id: documentData.id,
        originalName: documentData.originalName,
        language: documentData.language,
        url: documentData.url,
        textLength: textContent.length,
        uploadedAt: documentData.uploadedAt
      }
    })

  } catch (error) {
    console.error('❌ Upload processing error:', error)

    // Clean up file if it exists
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(console.error)
    }

    res.status(500).json({
      error: 'Upload processing failed',
      message: 'An error occurred while processing your document. Please try again.'
    })
  }
}

// Export functions
module.exports = {
  uploadDocument,
  getDocumentMetadata,
  storeDocumentMetadata
}