const fs = require('fs').promises
const path = require('path')

// Create session (existing function enhanced)
const createSession = async (req, res) => {
  try {
    const { language, timeLimit, documentId, documentName } = req.body

    // Validate input
    if (!language || !timeLimit || !documentId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Language, timeLimit, and documentId are required'
      })
    }

    // Generate unique session ID
    const sessionId = generateSessionId()
    const createdAt = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

    // Get document metadata to find the actual filename
    let documentUrl
    try {
      const { getDocumentMetadata } = require('./uploadController')
      const documentData = await getDocumentMetadata(documentId)
      documentUrl = `/uploads/${documentData.filename}`  // ← Use actual filename!
    } catch (error) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'The specified document does not exist'
      })
    }
    // Create session data
    const sessionData = {
      sessionId,
      language,
      timeLimit: parseInt(timeLimit),
      documentId,
      documentName: documentName || 'Regulatory Document',
      documentUrl,  // ← Now uses correct filename!
      createdAt,
      expiresAt,
      status: 'active',
      participants: 0,
      maxParticipants: 100
  }

    // Save session metadata
    const metadataPath = path.join(__dirname, '../../uploads/metadata', `session_${sessionId}.json`)
    await fs.writeFile(metadataPath, JSON.stringify(sessionData, null, 2))

    console.log('✅ Session created:', sessionId)
    
    res.json({
      success: true,
      sessionId,
      sessionData,
      joinUrl: `/student/${sessionId}`
    })

  } catch (error) {
    console.error('❌ Session creation failed:', error)
    res.status(500).json({
      error: 'Session creation failed',
      message: error.message
    })
  }
}

// Get session (new function)
const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID required',
        message: 'Please provide a valid session ID'
      })
    }

    // Load session metadata
    const metadataPath = path.join(__dirname, '../../uploads/metadata', `session_${sessionId}.json`)
    
    try {
      const sessionData = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
      
      // Check if session has expired
      const now = new Date()
      const expiresAt = new Date(sessionData.expiresAt)
      
      if (now > expiresAt) {
        return res.status(410).json({
          error: 'Session expired',
          message: 'This practice session has expired'
        })
      }

      // Check if session is active
      if (sessionData.status !== 'active') {
        return res.status(403).json({
          error: 'Session inactive',
          message: 'This practice session is no longer active'
        })
      }

      // Increment participant count
      sessionData.participants = (sessionData.participants || 0) + 1
      
      // Save updated metadata
      await fs.writeFile(metadataPath, JSON.stringify(sessionData, null, 2))

      console.log(`✅ Session loaded: ${sessionId} (${sessionData.participants} participants)`)

      // Return session data (ensure documentUrl is absolute)
      const responseData = {
        ...sessionData,
        documentUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}${sessionData.documentUrl}`,
        timeRemaining: Math.max(0, Math.floor((expiresAt - now) / 1000 / 60)) // minutes remaining
      }

      res.json(responseData)

    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        return res.status(404).json({
          error: 'Session not found',
          message: 'The requested session does not exist'
        })
      }
      throw fileError
    }

  } catch (error) {
    console.error('❌ Session retrieval failed:', error)
    res.status(500).json({
      error: 'Session retrieval failed',
      message: error.message
    })
  }
}

// List active sessions (new function)
const listSessions = async (req, res) => {
  try {
    const metadataDir = path.join(__dirname, '../../uploads/metadata')
    
    // Ensure metadata directory exists
    try {
      await fs.access(metadataDir)
    } catch {
      // Directory doesn't exist, return empty list
      return res.json({
        success: true,
        sessions: [],
        total: 0
      })
    }
    
    // Get all session files
    const files = await fs.readdir(metadataDir)
    const sessionFiles = files.filter(file => file.startsWith('session_') && file.endsWith('.json'))
    
    const sessions = []
    const now = new Date()
    
    for (const file of sessionFiles) {
      try {
        const filePath = path.join(metadataDir, file)
        const sessionData = JSON.parse(await fs.readFile(filePath, 'utf8'))
        
        // Check if session is still active and not expired
        const expiresAt = new Date(sessionData.expiresAt)
        if (now <= expiresAt && sessionData.status === 'active') {
          sessions.push({
            sessionId: sessionData.sessionId,
            language: sessionData.language,
            documentName: sessionData.documentName,
            timeLimit: sessionData.timeLimit,
            participants: sessionData.participants || 0,
            createdAt: sessionData.createdAt,
            expiresAt: sessionData.expiresAt
          })
        }
      } catch (parseError) {
        console.warn(`⚠️ Skipping invalid session file: ${file}`)
      }
    }

    res.json({
      success: true,
      sessions,
      total: sessions.length
    })

  } catch (error) {
    console.error('❌ Session listing failed:', error)
    res.status(500).json({
      error: 'Session listing failed',
      message: error.message
    })
  }
}

// Helper function to generate session ID
function generateSessionId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Validate session ID format
const validateSessionId = (sessionId) => {
  return /^[A-Z0-9]{8}$/.test(sessionId)
}

// Close session (new function)
const closeSession = async (req, res) => {
  try {
    const { sessionId } = req.params

    if (!validateSessionId(sessionId)) {
      return res.status(400).json({
        error: 'Invalid session ID format',
        message: 'Session ID must be 8 characters (A-Z, 0-9)'
      })
    }

    const metadataPath = path.join(__dirname, '../../uploads/metadata', `session_${sessionId}.json`)
    
    try {
      const sessionData = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
      
      // Mark session as closed
      sessionData.status = 'closed'
      sessionData.closedAt = new Date().toISOString()
      
      await fs.writeFile(metadataPath, JSON.stringify(sessionData, null, 2))
      
      console.log(`✅ Session closed: ${sessionId}`)
      
      res.json({
        success: true,
        message: 'Session closed successfully',
        sessionId
      })

    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        return res.status(404).json({
          error: 'Session not found',
          message: 'The requested session does not exist'
        })
      }
      throw fileError
    }

  } catch (error) {
    console.error('❌ Session closure failed:', error)
    res.status(500).json({
      error: 'Session closure failed',
      message: error.message
    })
  }
}

module.exports = {
  createSession,
  getSession,
  listSessions,
  closeSession
}