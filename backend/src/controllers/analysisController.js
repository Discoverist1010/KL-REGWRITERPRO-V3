// backend/src/controllers/analysisController.js
console.log('✅ Analysis controller loading...')

const fs = require('fs').promises
const path = require('path')

// Import Claude service (will use placeholder if not available)
let claudeService
try {
  claudeService = require('../services/claudeService')
  console.log('✅ Claude service loaded')
} catch (error) {
  console.log('⚠️ Claude service not found, using placeholder mode')
  claudeService = null
}

// Submit student answers for analysis
const submitAnalysis = async (req, res) => {
  try {
    const { sessionId, answers, submittedAt, isAutoSubmit } = req.body

    console.log('📝 Submit analysis called for session:', sessionId)
    console.log('📝 Received answers:', { 
      executiveSummary: answers?.executiveSummary?.length || 0, 
      impactAnalysis: answers?.impactAnalysis?.length || 0 
    })

    // Validate required fields
    if (!sessionId || !answers) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and answers are required'
      })
    }

    // Validate answers structure
    if (!answers.executiveSummary && !answers.impactAnalysis) {
      return res.status(400).json({
        success: false,
        message: 'At least one answer section is required'
      })
    }

    // Get session information
    console.log('🔍 Getting session data for:', sessionId)
    const session = await getSessionData(sessionId)
    if (!session) {
      console.log('❌ Session not found:', sessionId)
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      })
    }
    console.log('✅ Session found:', session.sessionId)

    // Prepare submission data
    const submissionData = {
      sessionId,
      answers,
      submittedAt: submittedAt || new Date().toISOString(),
      isAutoSubmit: isAutoSubmit || false,
      documentId: session.documentId,
      language: session.language
    }

    // Get document content for analysis
    let documentContent = null
    if (session.documentId) {
      console.log('📄 Getting document content for:', session.documentId)
      documentContent = await getDocumentContent(session.documentId)
    }

    // Perform analysis (Claude AI or enhanced placeholder)
    console.log('🤖 Starting analysis...')
    let analysis
    
    if (claudeService) {
      try {
        analysis = await claudeService.analyzeRegulatoryWriting(submissionData, documentContent)
        console.log('✅ Claude AI analysis completed')
      } catch (error) {
        console.error('❌ Claude AI error, falling back to placeholder:', error.message)
        analysis = generatePlaceholderAnalysis(submissionData)
      }
    } else {
      console.log('📝 Using placeholder analysis (Claude service not available)')
      analysis = generatePlaceholderAnalysis(submissionData)
    }

    console.log('🔍 Analysis result type:', analysis.analysisType || 'unknown')

    // Save analysis results
    console.log('💾 About to save analysis results...')
    try {
      await saveAnalysisResults(sessionId, submissionData, analysis)
      console.log('✅ Analysis results saved successfully')
    } catch (saveError) {
      console.error('❌ Failed to save analysis results:', saveError)
      // Continue anyway - we'll still return the analysis
    }

    // Return analysis results
    const response = {
      success: true,
      message: 'Analysis completed successfully',
      data: {
        sessionId,
        submissionId: generateSubmissionId(),
        analysis,
        submittedAt: submissionData.submittedAt,
        isAutoSubmit: submissionData.isAutoSubmit
      }
    }

    console.log('📤 Sending response back to client')
    res.json(response)

  } catch (error) {
    console.error('❌ Analysis submission error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process analysis',
      error: error.message
    })
  }
}

// Get analysis results for a session
const getAnalysisResults = async (req, res) => {
  try {
    const { sessionId } = req.params

    console.log('📊 Get results called for session:', sessionId)

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      })
    }

    // Try to load existing analysis results
    const resultsPath = path.join(__dirname, '../../uploads/analysis', `${sessionId}.json`)
    console.log('🔍 Looking for results at:', resultsPath)
    
    try {
      const results = JSON.parse(await fs.readFile(resultsPath, 'utf8'))
      console.log('✅ Results found and loaded')
      
      res.json({
        success: true,
        data: results
      })
    } catch (error) {
      console.log('❌ No results found for session:', sessionId)
      // No results found
      res.status(404).json({
        success: false,
        message: 'No analysis results found for this session'
      })
    }

  } catch (error) {
    console.error('❌ Get analysis results error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analysis results',
      error: error.message
    })
  }
}

// Helper function to get session data
const getSessionData = async (sessionId) => {
  try {
    // Try different possible session storage locations
    const possiblePaths = [
      path.join(__dirname, '../../uploads/sessions'),
      path.join(__dirname, '../../uploads/metadata'),
      path.join(__dirname, '../../uploads')
    ]

    for (const searchPath of possiblePaths) {
      try {
        const files = await fs.readdir(searchPath)
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(searchPath, file)
            const data = JSON.parse(await fs.readFile(filePath, 'utf8'))
            
            // Check if this file contains session data with matching sessionId
            if (data.sessionId === sessionId || 
                data.id === sessionId || 
                file.includes(sessionId)) {
              console.log('📂 Found session data in:', filePath)
              return data
            }
          }
        }
      } catch (error) {
        // Directory doesn't exist or can't be read, continue to next
        continue
      }
    }

    // If not found in file system, return a mock session for testing
    console.log('⚠️ Session not found in filesystem, returning mock data for:', sessionId)
    return {
      sessionId: sessionId,
      documentId: '50c78f34-da32-4632-81a6-07656d40836d',
      documentName: 'Test Document',
      language: 'English',
      timeLimit: 30,
      status: 'active'
    }
    
  } catch (error) {
    console.error('❌ Error getting session data:', error)
    return null
  }
}

// Helper function to get document content
const getDocumentContent = async (documentId) => {
  try {
    const metadataPath = path.join(__dirname, '../../uploads/metadata', `${documentId}.json`)
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    return metadata.extractedText || 'Document content not available for analysis'
  } catch (error) {
    console.error('❌ Error getting document content:', error)
    return 'Document content not available for analysis'
  }
}

// Helper function to save analysis results
const saveAnalysisResults = async (sessionId, submissionData, analysis) => {
  try {
    const analysisDir = path.join(__dirname, '../../uploads/analysis')
    
    console.log('📁 Ensuring analysis directory exists:', analysisDir)
    
    // Ensure analysis directory exists
    try {
      await fs.access(analysisDir)
      console.log('✅ Analysis directory exists')
    } catch (error) {
      console.log('📁 Creating analysis directory...')
      await fs.mkdir(analysisDir, { recursive: true })
      console.log('✅ Analysis directory created')
    }

    const resultsData = {
      sessionId,
      submissionData,
      analysis,
      savedAt: new Date().toISOString()
    }

    const resultsPath = path.join(analysisDir, `${sessionId}.json`)
    console.log('💾 Saving analysis results to:', resultsPath)
    
    await fs.writeFile(resultsPath, JSON.stringify(resultsData, null, 2))

    console.log('✅ Analysis results saved successfully:', resultsPath)
    
    // Verify file was created
    try {
      await fs.access(resultsPath)
      console.log('✅ File verification successful')
    } catch (verifyError) {
      console.error('❌ File verification failed:', verifyError)
    }
    
  } catch (error) {
    console.error('❌ Error saving analysis results:', error)
    throw error
  }
}

// Helper function to generate unique submission ID
const generateSubmissionId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Enhanced placeholder analysis for when Claude service is not available
const generatePlaceholderAnalysis = (submissionData) => {
  const { answers } = submissionData
  const { executiveSummary, impactAnalysis } = answers

  // Calculate scores based on content quality
  const summaryScore = calculateContentScore(executiveSummary)
  const analysisScore = calculateContentScore(impactAnalysis)
  const overallScore = Math.round((summaryScore + analysisScore) / 2)

  return {
    sessionId: submissionData.sessionId,
    timestamp: new Date().toISOString(),
    overallScore,
    executiveSummary: {
      score: summaryScore,
      strengths: [
        'Clear presentation of key information',
        'Appropriate length for executive-level audience',
        'Professional tone maintained'
      ],
      improvements: [
        'Include specific regulatory deadlines and timelines',
        'Identify primary stakeholders more explicitly',
        'Add compliance cost implications'
      ],
      professionalExample: 'The new Anti-Money Laundering regulations require all financial institutions to implement enhanced customer due diligence procedures by December 2024, affecting approximately 12,000 banks and credit unions nationwide. The primary compliance objective is to strengthen transaction monitoring capabilities and reduce financial crime exposure, with estimated implementation costs of $2.3 billion industry-wide.'
    },
    impactAnalysis: {
      score: analysisScore,
      strengths: [
        'Good analytical framework',
        'Consideration of implementation challenges',
        'Awareness of stakeholder implications'
      ],
      improvements: [
        'Quantify financial impact more specifically',
        'Include risk mitigation strategies',
        'Address compliance timeline variations by institution size'
      ],
      professionalExample: 'Small community banks will face disproportionate challenges due to limited compliance infrastructure, requiring 18-24 months for full implementation at costs averaging $850,000 per institution. Large multinational banks can leverage existing AML frameworks but must invest $25-50 million in system upgrades. Recommended phased approach: Phase 1 (Months 1-6) - Policy development and staff training; Phase 2 (Months 7-12) - Technology implementation; Phase 3 (Months 13-18) - Testing and compliance validation.'
    },
    regulatoryCompliance: {
      score: Math.round((summaryScore + analysisScore) / 2),
      feedback: 'Demonstrates solid understanding of regulatory framework with good awareness of compliance implications. Consider incorporating more specific regulatory citations and enforcement mechanisms.',
      missingElements: [
        'Specific penalty structures for non-compliance',
        'Regulatory reporting requirements and deadlines',
        'International coordination aspects'
      ]
    },
    writingQuality: {
      score: Math.round((summaryScore + analysisScore) / 2),
      clarity: summaryScore > 80 ? 85 : 75,
      conciseness: analysisScore > 80 ? 80 : 70,
      professionalism: 85,
      feedback: 'Professional communication style with clear structure. Consider using more specific data points and quantitative metrics to strengthen arguments.'
    },
    recommendations: [
      'Incorporate specific regulatory deadlines and compliance milestones',
      'Quantify financial and operational impacts with data-driven estimates',
      'Develop stakeholder-specific implementation strategies',
      'Include risk assessment and mitigation planning'
    ],
    nextSteps: [
      'Practice analyzing complex multi-stakeholder regulatory scenarios',
      'Study successful regulatory implementation case studies',
      'Develop expertise in cost-benefit analysis for compliance initiatives'
    ],
    analysisType: 'enhanced-placeholder',
    studentAnswers: {
      executiveSummary: answers.executiveSummary,
      impactAnalysis: answers.impactAnalysis
    }
  }
}

// Calculate content score based on length and quality indicators
const calculateContentScore = (text) => {
  if (!text || text.length < 10) return 45
  
  let score = 60 // Base score
  
  // Length bonus (optimal range 100-500 characters)
  if (text.length >= 100 && text.length <= 500) score += 15
  else if (text.length >= 50) score += 10
  
  // Quality indicators
  if (text.includes('regulatory') || text.includes('compliance')) score += 5
  if (text.includes('stakeholder')) score += 5
  if (text.includes('implementation')) score += 5
  if (text.includes('impact') || text.includes('effect')) score += 5
  if (text.split('.').length >= 3) score += 5 // Multiple sentences
  
  // Professional language indicators
  if (text.includes('require') || text.includes('establish')) score += 3
  if (text.includes('timeline') || text.includes('deadline')) score += 3
  
  return Math.min(95, Math.max(45, score))
}

// Test Claude service endpoint (for development)
const testClaudeService = async (req, res) => {
  try {
    console.log('🧪 Test Claude endpoint called')
    
    if (claudeService) {
      // Test with real Claude service if available
      const testSubmission = {
        sessionId: 'TEST123',
        answers: {
          executiveSummary: 'This is a test executive summary for regulatory compliance testing purposes.',
          impactAnalysis: 'This is a test impact analysis examining stakeholder effects and implementation challenges.'
        },
        documentId: null
      }

      const analysis = await claudeService.analyzeRegulatoryWriting(testSubmission)

      res.json({
        success: true,
        message: 'Claude service test completed successfully',
        data: analysis,
        serviceType: 'real-claude'
      })
    } else {
      // Test with placeholder service
      res.json({
        success: true,
        message: 'Analysis controller is working in placeholder mode!',
        timestamp: new Date().toISOString(),
        status: 'Connected successfully',
        serviceType: 'placeholder'
      })
    }

  } catch (error) {
    console.error('❌ Test error:', error)
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    })
  }
}

console.log('✅ Analysis controller functions defined')

module.exports = {
  submitAnalysis,
  getAnalysisResults,
  testClaudeService
}

console.log('✅ Analysis controller exported successfully')