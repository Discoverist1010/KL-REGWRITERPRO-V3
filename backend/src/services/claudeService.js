// Claude AI Service for Regulatory Writing Analysis
const Anthropic = require('@anthropic-ai/sdk');

class ClaudeService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.client = this.apiKey ? new Anthropic({ apiKey: this.apiKey }) : null;
    this.initialized = !!this.client;
    
    if (this.initialized) {
      console.log('✅ Claude AI service initialized');
    } else {
      console.log('⚠️  Claude AI service not initialized - API key missing');
    }
  }

  async analyzeRegulatoryWriting(submissionData, documentText) {
    console.log('🤖 Claude AI analyzing regulatory writing...');
    
    // If no API key, return placeholder
    if (!this.initialized) {
      return this.generatePlaceholderAnalysis(submissionData);
    }

    const { answers, language = 'english' } = submissionData;
    const { executiveSummary, impactAnalysis } = answers;

    try {
      // Prepare the prompt for Claude
      const prompt = this.buildAnalysisPrompt(
        documentText || '',
        executiveSummary || '',
        impactAnalysis || '',
        language
      );

      // Call Claude API
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      // Parse Claude's response
      const analysisText = response.content[0].text;
      const analysis = this.parseClaudeResponse(analysisText, submissionData);
      
      console.log('✅ Claude AI analysis completed');
      return analysis;

    } catch (error) {
      console.error('❌ Claude API error:', error.message);
      throw error; // Let the queue handle retries
    }
  }

  buildAnalysisPrompt(documentText, executiveSummary, impactAnalysis, language) {
    // Truncate document to manage token usage
    const truncatedDoc = documentText.substring(0, 1500);
    
    return `You are an expert regulatory analyst. Analyze the following student submission for a regulatory writing exercise.

Language: ${language}

DOCUMENT EXCERPT:
${truncatedDoc}

STUDENT'S EXECUTIVE SUMMARY:
${executiveSummary}

STUDENT'S IMPACT ANALYSIS:
${impactAnalysis}

Please provide a comprehensive analysis with scores and detailed feedback. Format your response as JSON with the following EXACT structure:

{
  "overallScore": [number 0-100],
  "executiveSummary": {
    "score": [number 0-100],
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "improvements": ["improvement 1", "improvement 2", "improvement 3"],
    "professionalExample": "A 2-3 sentence professional executive summary demonstrating best practices"
  },
  "impactAnalysis": {
    "score": [number 0-100],
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "improvements": ["improvement 1", "improvement 2", "improvement 3"],
    "professionalExample": "A professional paragraph demonstrating excellent impact analysis"
  },
  "regulatoryCompliance": {
    "score": [number 0-100],
    "feedback": "Specific assessment of regulatory understanding",
    "missingElements": ["missing element 1", "missing element 2"]
  },
  "writingQuality": {
    "score": [number 0-100],
    "clarity": [number 0-100],
    "conciseness": [number 0-100],
    "professionalism": [number 0-100],
    "feedback": "Specific writing quality assessment"
  },
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3",
    "Actionable recommendation 4"
  ],
  "nextSteps": [
    "Next step 1",
    "Next step 2"
  ]
}

Evaluate based on:
- Regulatory compliance understanding
- Executive summary conciseness and focus
- Impact analysis relevance to stakeholders
- Professional communication style
- Implementation feasibility awareness`;
  }

  parseClaudeResponse(responseText, submissionData) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Ensure all required fields exist with proper structure
        return {
          sessionId: submissionData.sessionId,
          timestamp: new Date().toISOString(),
          overallScore: parsed.overallScore || 75,
          executiveSummary: {
            score: parsed.executiveSummary?.score || 75,
            strengths: parsed.executiveSummary?.strengths || ['Clear structure', 'Professional tone', 'Good summary'],
            improvements: parsed.executiveSummary?.improvements || ['More specific details needed', 'Include timelines', 'Quantify impacts'],
            professionalExample: parsed.executiveSummary?.professionalExample || 'Professional example not provided'
          },
          impactAnalysis: {
            score: parsed.impactAnalysis?.score || 75,
            strengths: parsed.impactAnalysis?.strengths || ['Good analysis', 'Stakeholder awareness', 'Clear impacts'],
            improvements: parsed.impactAnalysis?.improvements || ['More depth needed', 'Include mitigation', 'Quantify impacts'],
            professionalExample: parsed.impactAnalysis?.professionalExample || 'Professional example not provided'
          },
          regulatoryCompliance: {
            score: parsed.regulatoryCompliance?.score || 75,
            feedback: parsed.regulatoryCompliance?.feedback || 'Shows understanding of regulatory context',
            missingElements: parsed.regulatoryCompliance?.missingElements || []
          },
          writingQuality: {
            score: parsed.writingQuality?.score || 75,
            clarity: parsed.writingQuality?.clarity || 75,
            conciseness: parsed.writingQuality?.conciseness || 75,
            professionalism: parsed.writingQuality?.professionalism || 75,
            feedback: parsed.writingQuality?.feedback || 'Professional writing style demonstrated'
          },
          recommendations: parsed.recommendations || [
            'Review regulatory requirements thoroughly',
            'Include specific implementation details',
            'Consider stakeholder perspectives',
            'Quantify impacts where possible'
          ],
          nextSteps: parsed.nextSteps || [
            'Practice with additional regulatory scenarios',
            'Focus on concise professional communication'
          ],
          analysisType: 'claude-ai',
          model: 'claude-sonnet-4-20250514',
          studentAnswers: {
            executiveSummary: submissionData.answers.executiveSummary,
            impactAnalysis: submissionData.answers.impactAnalysis
          }
        };
      }
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
    }

    // Fallback if parsing fails
    return this.generatePlaceholderAnalysis(submissionData);
  }

  generatePlaceholderAnalysis(submissionData) {
    const { answers } = submissionData;
    const { executiveSummary, impactAnalysis } = answers || {};

    // Calculate scores based on content quality
    const summaryScore = this.calculateContentScore(executiveSummary);
    const analysisScore = this.calculateContentScore(impactAnalysis);
    const overallScore = Math.round((summaryScore + analysisScore) / 2);

    return {
      sessionId: submissionData.sessionId,
      timestamp: new Date().toISOString(),
      overallScore,
      executiveSummary: {
        score: summaryScore,
        strengths: [
          'Clear presentation of key information',
          'Appropriate length for executive audience',
          'Professional tone maintained'
        ],
        improvements: [
          'Include specific regulatory deadlines',
          'Identify primary stakeholders explicitly',
          'Add compliance cost implications'
        ],
        professionalExample: "The new Anti-Money Laundering regulations require all financial institutions to implement enhanced customer due diligence procedures by December 2024, affecting approximately 12,000 banks nationwide. Primary compliance objectives include strengthening transaction monitoring capabilities with estimated implementation costs of $2.3 billion industry-wide."
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
          'Address compliance timeline variations'
        ],
        professionalExample: "Small community banks will face disproportionate challenges due to limited compliance infrastructure, requiring 18-24 months for full implementation at costs averaging $850,000 per institution. Large banks can leverage existing frameworks but must invest $25-50 million in system upgrades. Recommended phased approach: Phase 1 (Months 1-6) - Policy development; Phase 2 (Months 7-12) - Technology implementation; Phase 3 (Months 13-18) - Testing and validation."
      },
      regulatoryCompliance: {
        score: Math.round((summaryScore + analysisScore) / 2),
        feedback: 'Demonstrates understanding of regulatory framework with opportunities for deeper analysis. Consider incorporating specific regulatory citations and enforcement mechanisms.',
        missingElements: [
          'Specific penalty structures for non-compliance',
          'Regulatory reporting requirements',
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
        'Incorporate specific regulatory deadlines and milestones',
        'Quantify financial and operational impacts',
        'Develop stakeholder-specific implementation strategies',
        'Include risk assessment and mitigation planning'
      ],
      nextSteps: [
        'Practice analyzing complex regulatory scenarios',
        'Study successful regulatory implementation case studies'
      ],
      analysisType: 'placeholder',
      studentAnswers: {
        executiveSummary: executiveSummary || '',
        impactAnalysis: impactAnalysis || ''
      }
    };
  }

  // Calculate content score based on length and quality indicators
  calculateContentScore(text) {
    if (!text || text.length < 10) return 45;
    
    let score = 60; // Base score
    
    // Length bonus (optimal range 100-500 characters)
    if (text.length >= 100 && text.length <= 500) score += 15;
    else if (text.length >= 50) score += 10;
    
    // Quality indicators
    if (text.toLowerCase().includes('regulatory') || text.toLowerCase().includes('compliance')) score += 5;
    if (text.toLowerCase().includes('stakeholder')) score += 5;
    if (text.toLowerCase().includes('implementation')) score += 5;
    if (text.toLowerCase().includes('impact') || text.toLowerCase().includes('effect')) score += 5;
    if (text.split('.').length >= 3) score += 5; // Multiple sentences
    
    return Math.min(95, Math.max(45, score));
  }
}

// Export singleton instance
module.exports = new ClaudeService();