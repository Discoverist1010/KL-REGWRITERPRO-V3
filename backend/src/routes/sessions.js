const express = require('express')
const router = express.Router()
const { createSession, getSession, listSessions, closeSession } = require('../controllers/sessionController')

// Create new session (matches frontend expectation)
router.post('/', createSession)

// Get session by ID (for students joining)
router.get('/:sessionId', getSession)

// List all active sessions
router.get('/', listSessions)

// Close a session
router.patch('/:sessionId/close', closeSession)

module.exports = router