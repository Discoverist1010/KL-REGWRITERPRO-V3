// backend/src/routes/analysis.js
const express = require('express')
const router = express.Router()
const { submitAnalysis, getAnalysisResults, testClaudeService } = require('../controllers/analysisController')

// Submit student answers for Claude AI analysis
router.post('/submit', submitAnalysis)

// Get analysis results for a session
router.get('/results/:sessionId', getAnalysisResults)

// Test Claude service (development only)
router.get('/test-claude', testClaudeService)

module.exports = router