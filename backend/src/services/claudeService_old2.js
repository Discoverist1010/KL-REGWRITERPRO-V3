// backend/src/services/claudeService.js - OPTIMIZED for Speed
const fs = require('fs').promises
const path = require('path')

// Ensure environment variables are loaded
require('dotenv').config()

class ClaudeService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY
    this.apiUrl = 'https://api.anthropic.com/v1/messages'
    
    // Reduced logging for production performance
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Claude Service Initialization:')
      console.log('   API Key exists:', !!this.apiKey)
      console.log('   API Key format valid:', this.apiKey?.startsWith('sk-ant-'))
    }
    
    if (!this.apiKey) {
      console.log('⚠️ Claude AI service initialized in demo mode (no API key)')
    }
  }

  // Main analysis function - OPTIMIZED
  async analyzeRegulatoryWriting(submissionData, documentContent = null) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Starting Claude AI analysis for session:', submissionData.sessionId)
      }

      if (!this.apiKey) {
        return this.generateEnhancedDemo(submissionData)
      }

      // Parallel document fetch and prompt creation when possible
      const [documentText, prompt] = await Promise.all([
        documentContent || (submissionData.documentId ? this.getDocumentContent(submissionData.documentId) : Promise.resolve(null)),
        Promise.resolve(this.createOptimizedPrompt(submissionData, documentContent))
      ])

      // Update prompt with document text if we fetched it
      const finalPrompt = documentContent ? prompt : this.createOptimizedPrompt(submissionData, documentText)

      // Call Claude API with optimized settings
      const response = await this.callClaudeAPI(finalPrompt)

      // Fast response parsing
      const analysis = this.parseClaudeResponseFast(response, submissionData)

      return analysis

    } catch (error) {
      console.error('❌ Claude AI analysis error:', error.message)
      // Fast fallback without detailed error logging
      return this.generateEnhancedDemo(submissionData, `Claude API Error: ${error.message}`)
    }
  }

  // OPTIMIZED: Shorter, more focused prompt for faster processing
  createOptimizedPrompt(submissionData, documentText) {
    const { answers } = submissionData
    const { executiveSummary, impactAnalysis } = answers

    // Truncate document text more aggressively for speed
    const truncatedDoc = documentText ? 
      (documentText.length > 1500 ? documentText.substring(0, 1500) + '...' : documentText) 
      : null

    return `Expert regulatory writing analysis. Provide feedback in JSON format only.

${truncatedDoc ? `DOCUMENT: "${truncatedDoc}"` : 'CONTEXT: General regulatory writing principles'}

SUBMISSION:
Executive Summary: "${executiveSummary || 'Not provided'}"
Impact Analysis: "${impactAnalysis || 'Not provided'}"

Return ONLY this JSON structure:

{
  "overallScore": [1-100],
  "executiveSummary": {
    "score": [1-100],
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"],
    "professionalExample": "Brief 2-3 sentence example"
  },
  "impactAnalysis": {
    "score": [1-100],
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"],
    "professionalExample": "Brief 3-4 sentence example"
  },
  "regulatoryCompliance": {
    "score": [1-100],
    "feedback": "Brief compliance assessment",
    "missingElements": ["element1", "element2"]
  },
  "writingQuality": {
    "score": [1-100],
    "clarity": [1-100],
    "conciseness": [1-100],
    "professionalism": [1-100],
    "feedback": "Brief writing assessment"
  },
  "recommendations": ["rec1", "rec2", "rec3"],
  "nextSteps": ["step1", "step2"]
}

Focus on: compliance requirements, stakeholder impacts, implementation timelines, professional communication.`
  }

  // OPTIMIZED: Reduced token count and faster API call
  async callClaudeAPI(prompt) {
    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500, // Reduced from 4000 for faster response
      temperature: 0.2, // Slightly lower for more consistent/faster output
      messages: [{ role: 'user', content: prompt }]
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Claude API HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.content?.[0]?.text) {
      throw new Error('Invalid response format from Claude API')
    }
    
    return data.content[0].text
  }

  // OPTIMIZED: Faster response parsing with minimal validation
  parseClaudeResponseFast(response, submissionData) {
    try {
      // Quick cleanup
      let cleanResponse = response.trim()
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
      
      const analysis = JSON.parse(cleanResponse)
      
      // Fast validation with defaults
      return {
        sessionId: submissionData.sessionId,
        timestamp: new Date().toISOString(),
        overallScore: this.fastValidateScore(analysis.overallScore),
        executiveSummary: {
          score: this.fastValidateScore(analysis.executiveSummary?.score),
          strengths: this.fastValidateArray(analysis.executiveSummary?.strengths, 2, ['Clear structure', 'Professional tone']),
          improvements: this.fastValidateArray(analysis.executiveSummary?.improvements, 2, ['More specific details needed']),
          professionalExample: analysis.executiveSummary?.professionalExample || 'Professional example requires document context.'
        },
        impactAnalysis: {
          score: this.fastValidateScore(analysis.impactAnalysis?.score),
          strengths: this.fastValidateArray(analysis.impactAnalysis?.strengths, 2, ['Good analytical approach']),
          improvements: this.fastValidateArray(analysis.impactAnalysis?.improvements, 2, ['Consider broader implications']),
          professionalExample: analysis.impactAnalysis?.professionalExample || 'Professional example requires document context.'
        },
        regulatoryCompliance: {
          score: this.fastValidateScore(analysis.regulatoryCompliance?.score),
          feedback: analysis.regulatoryCompliance?.feedback || 'Shows understanding with opportunities for deeper analysis.',
          missingElements: this.fastValidateArray(analysis.regulatoryCompliance?.missingElements, 3, [])
        },
        writingQuality: {
          score: this.fastValidateScore(analysis.writingQuality?.score),
          clarity: this.fastValidateScore(analysis.writingQuality?.clarity),
          conciseness: this.fastValidateScore(analysis.writingQuality?.conciseness),
          professionalism: this.fastValidateScore(analysis.writingQuality?.professionalism),
          feedback: analysis.writingQuality?.feedback || 'Professional writing with enhancement opportunities.'
        },
        recommendations: this.fastValidateArray(analysis.recommendations, 3, [
          'Review regulatory requirements thoroughly',
          'Include specific implementation details',
          'Consider stakeholder perspectives broadly'
        ]),
        nextSteps: this.fastValidateArray(analysis.nextSteps, 2, [
          'Practice with additional regulatory scenarios',
          'Focus on concise professional communication'
        ]),
        analysisType: 'claude-ai-real',
        studentAnswers: {
          executiveSummary: submissionData.answers.executiveSummary,
          impactAnalysis: submissionData.answers.impactAnalysis
        }
      }
      
    } catch (parseError) {
      // Fast fallback without detailed logging
      return this.createStructuredFromText(response, submissionData)
    }
  }

  // OPTIMIZED: Pre-calculated demo responses for maximum speed
  generateEnhancedDemo(submissionData, errorMessage = null) {
    const { answers } = submissionData
    const summaryScore = this.fastCalculateScore(answers.executiveSummary)
    const analysisScore = this.fastCalculateScore(answers.impactAnalysis)
    const overallScore = Math.round((summaryScore + analysisScore) / 2)

    return {
      sessionId: submissionData.sessionId,
      timestamp: new Date().toISOString(),
      overallScore,
      executiveSummary: {
        score: summaryScore,
        strengths: [
          'Clear presentation of key information',
          'Professional tone maintained throughout'
        ],
        improvements: [
          'Include specific regulatory deadlines',
          'Identify primary stakeholders explicitly'
        ],
        professionalExample: 'The new regulation requires all financial institutions to implement enhanced procedures by December 31, 2024, affecting compliance costs and operational workflows.'
      },
      impactAnalysis: {
        score: analysisScore,
        strengths: [
          'Systematic analytical framework applied',
          'Recognition of implementation challenges'
        ],
        improvements: [
          'Quantify financial impacts more specifically',
          'Include detailed risk mitigation strategies'
        ],
        professionalExample: 'Small banks will face implementation challenges requiring 18-24 months and $750K-$1.2M investment, while large banks need $25-50M for system upgrades and staff training.'
      },
      regulatoryCompliance: {
        score: Math.round((summaryScore + analysisScore) / 2),
        feedback: 'Demonstrates solid understanding with opportunities for more specific regulatory citations.',
        missingElements: [
          'Specific penalty structures',
          'Detailed reporting requirements'
        ]
      },
      writingQuality: {
        score: Math.round((summaryScore + analysisScore) / 2),
        clarity: Math.min(85, summaryScore + 5),
        conciseness: Math.min(80, analysisScore),
        professionalism: 85,
        feedback: 'Professional communication with opportunities for more quantitative data.'
      },
      recommendations: [
        'Incorporate specific regulatory deadlines',
        'Quantify financial and operational impacts',
        'Develop comprehensive stakeholder strategies'
      ],
      nextSteps: [
        'Practice with complex regulatory scenarios',
        'Study compliance implementation case studies'
      ],
      analysisType: errorMessage ? 'enhanced-demo-error' : 'enhanced-demo',
      studentAnswers: {
        executiveSummary: answers.executiveSummary,
        impactAnalysis: answers.impactAnalysis
      },
      ...(errorMessage && { errorMessage })
    }
  }

  // OPTIMIZED: Faster scoring algorithm
  fastCalculateScore(text) {
    if (!text || text.length < 10) return 45
    
    const len = text.length
    const lower = text.toLowerCase()
    
    let score = 60
    
    // Quick length check
    if (len >= 100 && len <= 500) score += 15
    else if (len >= 50) score += 10
    
    // Fast keyword scoring using single pass
    const keywords = ['regulatory', 'compliance', 'stakeholder', 'implementation', 'impact', 'effect']
    for (const keyword of keywords) {
      if (lower.includes(keyword)) score += 5
    }
    
    // Sentence count (approximate)
    if ((text.match(/\./g) || []).length >= 3) score += 5
    
    return Math.min(95, Math.max(45, score))
  }

  // Fast helper functions
  fastValidateScore(score) {
    const num = parseInt(score)
    return (isNaN(num) || num < 1 || num > 100) ? 75 : num
  }

  fastValidateArray(arr, maxLength, defaultValue) {
    return Array.isArray(arr) ? arr.slice(0, maxLength) : defaultValue
  }

  // OPTIMIZED: Async file reading with better error handling
  async getDocumentContent(documentId) {
    try {
      const metadataPath = path.join(__dirname, '../../uploads/metadata', `${documentId}.json`)
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
      return metadata.extractedText || null
    } catch (error) {
      // Silent fail for speed
      return null
    }
  }

  // OPTIMIZED: Minimal fallback response
  createStructuredFromText(text, submissionData) {
    return {
      sessionId: submissionData.sessionId,
      timestamp: new Date().toISOString(),
      overallScore: 75,
      executiveSummary: {
        score: 75,
        strengths: ['Professional communication style'],
        improvements: ['More specific regulatory details needed'],
        professionalExample: 'Regulatory framework requires systematic implementation with clear milestone tracking.'
      },
      impactAnalysis: {
        score: 75,
        strengths: ['Good stakeholder awareness'],
        improvements: ['Quantify impacts more specifically'],
        professionalExample: 'Implementation requires coordinated efforts with estimated costs and phased rollout.'
      },
      regulatoryCompliance: {
        score: 75,
        feedback: 'Shows good regulatory understanding requiring additional processing.',
        missingElements: ['Specific compliance deadlines']
      },
      writingQuality: {
        score: 75,
        clarity: 75,
        conciseness: 75,
        professionalism: 80,
        feedback: 'Professional writing with opportunities for quantitative analysis.'
      },
      recommendations: [
        'Include specific regulatory citations',
        'Quantify financial impacts',
        'Develop risk assessment strategies'
      ],
      nextSteps: [
        'Practice with regulatory scenarios',
        'Develop compliance expertise'
      ],
      analysisType: 'claude-ai-fallback',
      studentAnswers: {
        executiveSummary: submissionData.answers.executiveSummary,
        impactAnalysis: submissionData.answers.impactAnalysis
      }
    }
  }
}

module.exports = new ClaudeService()