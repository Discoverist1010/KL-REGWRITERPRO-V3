// backend/src/services/claudeService.js - REAL CLAUDE AI VERSION
const fs = require('fs').promises
const path = require('path')

class ClaudeService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY
    this.apiUrl = 'https://api.anthropic.com/v1/messages'
    
    if (this.apiKey) {
      console.log('🤖 Claude AI service initialized with API key')
    } else {
      console.log('⚠️ Claude AI service initialized in demo mode (no API key)')
    }
  }

  // Main analysis function
  async analyzeRegulatoryWriting(submissionData, documentContent = null) {
    try {
      console.log('🤖 Starting Claude AI analysis for session:', submissionData.sessionId)

      if (!this.apiKey) {
        console.warn('⚠️ Claude API key not found, using enhanced demo mode')
        return this.generateEnhancedDemo(submissionData)
      }

      // Get document content if available
      let documentText = documentContent
      if (!documentText && submissionData.documentId) {
        documentText = await this.getDocumentContent(submissionData.documentId)
      }

      // Create comprehensive analysis prompt
      const prompt = this.createAnalysisPrompt(submissionData, documentText)

      // Call Claude API
      console.log('📡 Calling Claude API for real analysis...')
      const response = await this.callClaudeAPI(prompt)

      // Parse and structure the response
      const analysis = this.parseClaudeResponse(response, submissionData)

      console.log('✅ Real Claude AI analysis completed successfully')
      return analysis

    } catch (error) {
      console.error('❌ Claude AI analysis error:', error.message)
      console.log('🔄 Falling back to enhanced demo mode')
      // Fallback to enhanced demo on error
      return this.generateEnhancedDemo(submissionData, `Claude API Error: ${error.message}`)
    }
  }

  // Create sophisticated regulatory writing analysis prompt
  createAnalysisPrompt(submissionData, documentText) {
    const { answers, sessionId } = submissionData
    const { executiveSummary, impactAnalysis } = answers

    return `You are an expert regulatory writing trainer with 15+ years of experience in financial services compliance. Your role is to provide constructive, professional feedback to help students improve their regulatory writing skills.

DOCUMENT CONTEXT:
${documentText ? `Document Content: "${documentText.substring(0, 2000)}${documentText.length > 2000 ? '...' : ''}"` : 'No specific document context provided. Analyze based on general regulatory writing principles.'}

STUDENT SUBMISSION:
Executive Summary: "${executiveSummary}"
Impact Analysis: "${impactAnalysis}"

Please provide a comprehensive analysis in this EXACT JSON structure (no markdown formatting):

{
  "overallScore": [number 1-100],
  "executiveSummary": {
    "score": [number 1-100],
    "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
    "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"],
    "professionalExample": "Write a 2-3 sentence professional executive summary that demonstrates best practices for this type of regulatory content. Make it specific to the document context if available."
  },
  "impactAnalysis": {
    "score": [number 1-100],
    "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
    "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"],
    "professionalExample": "Write a professional paragraph (3-4 sentences) demonstrating excellent impact analysis for this regulatory context. Include stakeholder considerations and implementation timelines."
  },
  "regulatoryCompliance": {
    "score": [number 1-100],
    "feedback": "Provide specific assessment of regulatory understanding and compliance awareness",
    "missingElements": ["specific missing element 1", "specific missing element 2"]
  },
  "writingQuality": {
    "score": [number 1-100],
    "clarity": [number 1-100],
    "conciseness": [number 1-100],
    "professionalism": [number 1-100],
    "feedback": "Provide specific writing quality assessment with actionable advice"
  },
  "recommendations": [
    "Specific, actionable recommendation 1",
    "Specific, actionable recommendation 2",
    "Specific, actionable recommendation 3",
    "Specific, actionable recommendation 4"
  ],
  "nextSteps": [
    "Concrete next step 1",
    "Concrete next step 2"
  ]
}

ANALYSIS CRITERIA:
- Evaluate regulatory compliance understanding and accuracy
- Evaluate the length and quality of the executive summary and impact analysis
- Executive summary must be concise, focused on the main points and not too long or too short
- Impact analysis must be focused on main impacts relevant to the identified stakeholders and not to the writer
- Assess stakeholder identification and impact analysis which must be specific to the document context and relevant to the identified stakeholders
- Check for inclusion of implementation feasibility and timeline awareness
- Review professional communication style and clarity
- Provide specific, actionable feedback for improvement
- Create realistic professional examples that demonstrate best practices
- Focus on constructive, educational feedback that helps students grow

The professional examples should based on the document, be realistic, specific to regulatory writing, and demonstrate the level of quality expected in professional financial services environments. Make them contextually relevant to the document if available.

Respond with ONLY the JSON object, no additional text or formatting.`
  }

  // Call Claude API
  async callClaudeAPI(prompt) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Claude API HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response format from Claude API')
    }
    
    return data.content[0].text
  }

  // Parse Claude response and structure it properly
  parseClaudeResponse(response, submissionData) {
    try {
      // Clean the response - remove any markdown formatting
      let cleanResponse = response.trim()
      
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      // Parse JSON
      const analysis = JSON.parse(cleanResponse)
      
      // Validate and ensure all required fields exist with defaults
      const validatedAnalysis = {
        sessionId: submissionData.sessionId,
        timestamp: new Date().toISOString(),
        overallScore: this.validateScore(analysis.overallScore),
        executiveSummary: {
          score: this.validateScore(analysis.executiveSummary?.score),
          strengths: Array.isArray(analysis.executiveSummary?.strengths) 
            ? analysis.executiveSummary.strengths.slice(0, 3)
            : ['Clear structure', 'Professional tone'],
          improvements: Array.isArray(analysis.executiveSummary?.improvements) 
            ? analysis.executiveSummary.improvements.slice(0, 3)
            : ['More specific details needed'],
          professionalExample: analysis.executiveSummary?.professionalExample || 
            'Professional example requires document context for optimal relevance.'
        },
        impactAnalysis: {
          score: this.validateScore(analysis.impactAnalysis?.score),
          strengths: Array.isArray(analysis.impactAnalysis?.strengths) 
            ? analysis.impactAnalysis.strengths.slice(0, 3)
            : ['Good analytical approach'],
          improvements: Array.isArray(analysis.impactAnalysis?.improvements) 
            ? analysis.impactAnalysis.improvements.slice(0, 3)
            : ['Consider broader implications'],
          professionalExample: analysis.impactAnalysis?.professionalExample || 
            'Professional example requires document context for optimal relevance.'
        },
        regulatoryCompliance: {
          score: this.validateScore(analysis.regulatoryCompliance?.score),
          feedback: analysis.regulatoryCompliance?.feedback || 
            'Shows understanding of regulatory context with opportunities for deeper analysis.',
          missingElements: Array.isArray(analysis.regulatoryCompliance?.missingElements) 
            ? analysis.regulatoryCompliance.missingElements.slice(0, 3)
            : []
        },
        writingQuality: {
          score: this.validateScore(analysis.writingQuality?.score),
          clarity: this.validateScore(analysis.writingQuality?.clarity),
          conciseness: this.validateScore(analysis.writingQuality?.conciseness),
          professionalism: this.validateScore(analysis.writingQuality?.professionalism),
          feedback: analysis.writingQuality?.feedback || 
            'Professional writing style with opportunities for enhancement.'
        },
        recommendations: Array.isArray(analysis.recommendations) 
          ? analysis.recommendations.slice(0, 4)
          : [
            'Review regulatory requirements more thoroughly',
            'Include specific implementation details',
            'Consider stakeholder perspectives more broadly'
          ],
        nextSteps: Array.isArray(analysis.nextSteps) 
          ? analysis.nextSteps.slice(0, 2)
          : [
            'Practice with additional regulatory scenarios',
            'Focus on concise professional communication'
          ],
        analysisType: 'claude-ai-real',
        studentAnswers: {
          executiveSummary: submissionData.answers.executiveSummary,
          impactAnalysis: submissionData.answers.impactAnalysis
        }
      }
      
      console.log('✅ Claude response parsed and validated successfully')
      return validatedAnalysis
      
    } catch (parseError) {
      console.error('❌ Failed to parse Claude response:', parseError.message)
      console.log('📄 Raw Claude response:', response.substring(0, 500) + '...')
      
      // Create structured response from raw text as fallback
      return this.createStructuredFromText(response, submissionData)
    }
  }

  // Enhanced demo mode with realistic professional examples
  generateEnhancedDemo(submissionData, errorMessage = null) {
    const { answers } = submissionData
    const { executiveSummary, impactAnalysis } = answers

    // Calculate scores based on content quality
    const summaryScore = this.calculateContentScore(executiveSummary)
    const analysisScore = this.calculateContentScore(impactAnalysis)
    const overallScore = Math.round((summaryScore + analysisScore) / 2)

    console.log(`📊 Enhanced demo analysis - Summary: ${summaryScore}, Analysis: ${analysisScore}, Overall: ${overallScore}`)

    return {
      sessionId: submissionData.sessionId,
      timestamp: new Date().toISOString(),
      overallScore,
      executiveSummary: {
        score: summaryScore,
        strengths: [
          'Clear presentation of key information',
          'Appropriate length for executive-level audience',
          'Professional tone maintained throughout'
        ],
        improvements: [
          'Include specific regulatory deadlines and compliance timelines',
          'Identify primary stakeholders and their roles more explicitly',
          'Add quantitative impact estimates and cost implications'
        ],
        professionalExample: 'The new Anti-Money Laundering Enhancement Act requires all financial institutions to implement advanced customer due diligence procedures by December 31, 2024, affecting approximately 12,000 banks and credit unions nationwide. The primary compliance objective is to strengthen transaction monitoring capabilities and reduce financial crime exposure, with estimated industry-wide implementation costs of $2.3 billion and enhanced reporting requirements to FinCEN.'
      },
      impactAnalysis: {
        score: analysisScore,
        strengths: [
          'Systematic analytical framework applied',
          'Recognition of implementation challenges',
          'Awareness of multi-stakeholder implications'
        ],
        improvements: [
          'Quantify financial and operational impacts more specifically',
          'Include detailed risk mitigation strategies and contingency planning',
          'Address compliance timeline variations based on institution size and complexity'
        ],
        professionalExample: 'Small community banks will face disproportionate implementation challenges due to limited compliance infrastructure, requiring 18-24 months for full deployment at estimated costs of $750,000-$1.2M per institution. Large multinational banks can leverage existing AML frameworks but must invest $25-50 million in system upgrades and staff training. Recommended phased implementation: Phase 1 (Q1-Q2 2024) - Policy development and regulatory mapping; Phase 2 (Q3-Q4 2024) - Technology deployment and integration testing; Phase 3 (Q1 2025) - Staff training and compliance validation.'
      },
      regulatoryCompliance: {
        score: Math.round((summaryScore + analysisScore) / 2),
        feedback: 'Demonstrates solid foundational understanding of regulatory framework with good awareness of compliance implications. To strengthen analysis, incorporate more specific regulatory citations, enforcement mechanisms, and cross-jurisdictional considerations.',
        missingElements: [
          'Specific penalty structures and enforcement timelines for non-compliance',
          'Detailed regulatory reporting requirements and submission deadlines',
          'International coordination aspects and cross-border compliance considerations'
        ]
      },
      writingQuality: {
        score: Math.round((summaryScore + analysisScore) / 2),
        clarity: summaryScore > 80 ? 85 : 75,
        conciseness: analysisScore > 80 ? 80 : 70,
        professionalism: 85,
        feedback: 'Professional communication style with clear structure and appropriate tone for regulatory context. To enhance effectiveness, incorporate more specific quantitative data points, strengthen transitions between key concepts, and ensure consistent terminology throughout.'
      },
      recommendations: [
        'Incorporate specific regulatory deadlines, compliance milestones, and enforcement timelines',
        'Quantify financial and operational impacts with data-driven estimates and cost-benefit analysis',
        'Develop comprehensive stakeholder-specific implementation strategies and communication plans',
        'Include detailed risk assessment matrix with mitigation strategies and contingency planning'
      ],
      nextSteps: [
        'Practice analyzing complex multi-stakeholder regulatory scenarios with quantitative impact modeling',
        'Study successful regulatory implementation case studies and develop expertise in compliance project management'
      ],
      analysisType: errorMessage ? 'enhanced-demo-error' : 'enhanced-demo',
      studentAnswers: {
        executiveSummary: answers.executiveSummary,
        impactAnalysis: answers.impactAnalysis
      },
      ...(errorMessage && { errorMessage })
    }
  }

  // Calculate content score based on length and quality indicators
  calculateContentScore(text) {
    if (!text || text.length < 10) return 45
    
    let score = 60 // Base score
    
    // Length bonus (optimal range 100-500 characters)
    if (text.length >= 100 && text.length <= 500) score += 15
    else if (text.length >= 50) score += 10
    
    // Quality indicators
    if (text.toLowerCase().includes('regulatory') || text.toLowerCase().includes('compliance')) score += 5
    if (text.toLowerCase().includes('stakeholder')) score += 5
    if (text.toLowerCase().includes('implementation')) score += 5
    if (text.toLowerCase().includes('impact') || text.toLowerCase().includes('effect')) score += 5
    if (text.split('.').length >= 3) score += 5 // Multiple sentences
    
    // Professional language indicators
    if (text.toLowerCase().includes('require') || text.toLowerCase().includes('establish')) score += 3
    if (text.toLowerCase().includes('timeline') || text.toLowerCase().includes('deadline')) score += 3
    
    return Math.min(95, Math.max(45, score))
  }

  // Validate score is between 1-100
  validateScore(score) {
    const num = parseInt(score)
    if (isNaN(num) || num < 1 || num > 100) return 75
    return num
  }

  // Get document content for analysis context
  async getDocumentContent(documentId) {
    try {
      const metadataPath = path.join(__dirname, '../../uploads/metadata', `${documentId}.json`)
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
      return metadata.extractedText || 'Document content not available for analysis'
    } catch (error) {
      console.error('Error reading document content:', error)
      return 'Document content not available for analysis'
    }
  }

  // Create structured response from unstructured text (fallback)
  createStructuredFromText(text, submissionData) {
    console.log('🔄 Creating structured response from unstructured Claude output')
    
    return {
      sessionId: submissionData.sessionId,
      timestamp: new Date().toISOString(),
      overallScore: 78,
      executiveSummary: {
        score: 80,
        strengths: ['Professional communication style', 'Clear structural approach'],
        improvements: ['More specific regulatory details needed', 'Include compliance timelines'],
        professionalExample: 'The regulatory framework requires systematic implementation across affected institutions with clear milestone tracking, stakeholder engagement protocols, and comprehensive compliance validation procedures.'
      },
      impactAnalysis: {
        score: 76,
        strengths: ['Good stakeholder awareness', 'Implementation considerations included'],
        improvements: ['Quantify impacts more specifically', 'Include detailed risk mitigation strategies'],
        professionalExample: 'Implementation will require coordinated efforts across legal, operations, and technology teams with estimated costs ranging from $500K-$2M depending on institution size, phased rollout over 12-18 months, and comprehensive staff training programs.'
      },
      regulatoryCompliance: {
        score: 75,
        feedback: 'Shows good regulatory understanding. Claude provided detailed feedback but in unstructured format requiring additional processing.',
        missingElements: ['Specific compliance deadlines', 'Penalty structure considerations']
      },
      writingQuality: {
        score: 78,
        clarity: 80,
        conciseness: 75,
        professionalism: 82,
        feedback: 'Professional writing style with opportunities for more specific quantitative analysis and regulatory citations.'
      },
      recommendations: [
        'Include specific regulatory citations and compliance deadlines',
        'Quantify financial and operational impacts with supporting data',
        'Develop comprehensive risk assessment and mitigation strategies',
        'Enhance stakeholder communication and change management planning'
      ],
      nextSteps: [
        'Practice with additional complex regulatory scenarios',
        'Develop expertise in quantitative compliance impact analysis'
      ],
      analysisType: 'claude-ai-fallback',
      studentAnswers: {
        executiveSummary: submissionData.answers.executiveSummary,
        impactAnalysis: submissionData.answers.impactAnalysis
      },
      rawClaudeResponse: text.substring(0, 500) + '...'
    }
  }
}

module.exports = new ClaudeService()