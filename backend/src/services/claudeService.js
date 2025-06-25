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
    
    console.log('📝 Student answers received:', {
      executiveSummaryLength: executiveSummary?.length || 0,
      impactAnalysisLength: impactAnalysis?.length || 0,
      executiveSummaryPreview: executiveSummary?.substring(0, 100) || 'No summary provided',
      impactAnalysisPreview: impactAnalysis?.substring(0, 100) || 'No impact analysis provided'
    });

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

Please provide a comprehensive analysis of the student's submission. 

IMPORTANT INSTRUCTIONS:
1. Writing Quality scores (clarity, conciseness, professionalism) MUST be based on evaluating the STUDENT'S ACTUAL ANSWERS, not generic scores
2. Regulatory Compliance should analyze what compliance requirements are in the DOCUMENT, not the student's understanding
3. Missing Elements should list key compliance points from the document that students should include
4. Next Steps should provide 3 specific writing improvement tips based on the student's actual writing

Format your response as JSON with the following EXACT structure:

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
    "feedback": "Based on the SOURCE DOCUMENT, provide: 
      1. KEY COMPLIANCE POINTS: List 3-5 specific compliance requirements that are either explicitly stated OR can be reasonably inferred from the document's content. If no compliance requirements are evident or can be inferred, state: 'No specific compliance requirements identified in this document.'
      2. RISK LINKAGE: For each identified compliance point, specify the risk type (operational/financial/reputational/legal/systemic)
      3. CRITICAL ELEMENTS: Highlight any deadlines, thresholds, or mandatory actions
      Example format: 'The document requires quarterly stress testing (operational risk) by Q2 2024, with minimum capital ratios of 8.5% (financial risk)'",
    "missingElements": ["List compliance requirements (stated or inferable) from the document that the student missed. If no compliance requirements exist, return empty array. Format: 'Requirement - Risk Type - Why it matters'"]
  },
  "writingQuality": {
    "score": [number 0-100 - overall writing quality based on student's actual text],
    "clarity": [number 0-100 - how clear is the student's actual writing?],
    "conciseness": [number 0-100 - how concise is the student's actual writing?],
    "professionalism": [number 0-100 - how professional is the student's actual tone and style?],
    "feedback": "Specific assessment of the student's writing quality, mentioning actual phrases or patterns from their text"
  },
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3",
    "Actionable recommendation 4"
  ],
  "nextSteps": [
    "Specific writing improvement tip 1 based on student's actual writing weaknesses",
    "Specific writing improvement tip 2 based on student's actual writing weaknesses", 
    "Specific writing improvement tip 3 based on student's actual writing weaknesses"
  ]
}

Evaluation Guidelines:
- Writing Quality: Analyze the ACTUAL text written by the student for clarity, conciseness, and professionalism
- Regulatory Compliance: Identify what compliance requirements are IN THE DOCUMENT, not what the student wrote
- Missing Elements: List specific compliance points from the document that the student should have included
- Next Steps: Provide 3 specific writing tips based on weaknesses in the student's actual submission
- All scores must reflect the student's actual performance, not generic values`;
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

    // Calculate scores based on actual student content
    const summaryScore = this.calculateContentScore(executiveSummary);
    const analysisScore = this.calculateContentScore(impactAnalysis);
    
    // Calculate writing quality scores based on actual text
    const clarityScore = this.calculateClarityScore(executiveSummary, impactAnalysis);
    const concisenessScore = this.calculateConcisenessScore(executiveSummary, impactAnalysis);
    const professionalismScore = this.calculateProfessionalismScore(executiveSummary, impactAnalysis);
    const writingScore = Math.round((clarityScore + concisenessScore + professionalismScore) / 3);
    
    const overallScore = Math.round((summaryScore + analysisScore + writingScore) / 3);

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
        feedback: 'Based on the SOURCE DOCUMENT: Unable to perform detailed compliance analysis without access to the actual document. In a full analysis, this section would identify specific compliance requirements, link them to risk types (operational/financial/reputational/legal/systemic), and highlight critical deadlines or thresholds.',
        missingElements: []
      },
      writingQuality: {
        score: writingScore,
        clarity: clarityScore,
        conciseness: concisenessScore,
        professionalism: professionalismScore,
        feedback: this.generateWritingFeedback(executiveSummary, impactAnalysis, clarityScore, concisenessScore, professionalismScore)
      },
      recommendations: [
        'Incorporate specific regulatory deadlines and milestones',
        'Quantify financial and operational impacts',
        'Develop stakeholder-specific implementation strategies',
        'Include risk assessment and mitigation planning'
      ],
      nextSteps: [
        executiveSummary?.length < 150 ? 'Expand your executive summary to include more comprehensive coverage of key points' : 'Focus on more concise expression of main ideas',
        clarityScore < 80 ? 'Improve clarity by using simpler sentence structures and defining technical terms' : 'Maintain your clear writing style',
        'Use more specific quantitative data and examples to support your analysis'
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

  calculateClarityScore(summary, analysis) {
    const text = `${summary || ''} ${analysis || ''}`;
    if (!text.trim()) return 0;
    
    let score = 50; // Base score
    
    // Check sentence length (shorter sentences = clearer)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    if (avgSentenceLength < 20) score += 20;
    else if (avgSentenceLength < 30) score += 10;
    
    // Check for transition words
    const transitions = ['however', 'therefore', 'furthermore', 'additionally', 'consequently'];
    const hasTransitions = transitions.some(word => text.toLowerCase().includes(word));
    if (hasTransitions) score += 15;
    
    // Paragraph structure
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 1) score += 15;
    
    return Math.min(100, score);
  }

  calculateConcisenessScore(summary, analysis) {
    const text = `${summary || ''} ${analysis || ''}`;
    if (!text.trim()) return 0;
    
    let score = 60; // Base score
    const wordCount = text.split(/\s+/).length;
    
    // Optimal length ranges
    if (summary) {
      const summaryWords = summary.split(/\s+/).length;
      if (summaryWords >= 50 && summaryWords <= 150) score += 20;
      else if (summaryWords < 50) score -= 10;
      else if (summaryWords > 200) score -= 10;
    }
    
    // Check for redundancy (repeated phrases)
    const phrases = text.match(/\b(\w+\s+\w+)\b/g) || [];
    const uniquePhrases = new Set(phrases);
    const redundancyRatio = uniquePhrases.size / phrases.length;
    if (redundancyRatio > 0.8) score += 20;
    
    return Math.min(100, score);
  }

  calculateProfessionalismScore(summary, analysis) {
    const text = `${summary || ''} ${analysis || ''}`;
    if (!text.trim()) return 0;
    
    let score = 70; // Base score
    
    // Check for professional language indicators
    const professionalTerms = ['regulatory', 'compliance', 'implementation', 'framework', 'assessment', 'stakeholder'];
    const termCount = professionalTerms.filter(term => text.toLowerCase().includes(term)).length;
    score += Math.min(20, termCount * 3);
    
    // Check for proper capitalization
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const properlyCapitalized = sentences.filter(s => s.trim()[0] === s.trim()[0].toUpperCase()).length;
    if (properlyCapitalized === sentences.length) score += 10;
    
    return Math.min(100, score);
  }

  generateWritingFeedback(summary, analysis, clarity, conciseness, professionalism) {
    if (!summary && !analysis) {
      return "No content provided to evaluate writing quality.";
    }
    
    const feedback = [];
    
    if (clarity < 70) {
      feedback.push("Improve clarity by using shorter sentences and clearer transitions between ideas.");
    } else {
      feedback.push("Good clarity in presenting ideas.");
    }
    
    if (conciseness < 70) {
      feedback.push("Work on being more concise - eliminate redundant phrases and unnecessary words.");
    } else {
      feedback.push("Effective concise writing demonstrated.");
    }
    
    if (professionalism < 80) {
      feedback.push("Enhance professional tone by using more industry-specific terminology.");
    } else {
      feedback.push("Professional tone well-maintained throughout.");
    }
    
    return feedback.join(' ');
  }
}

// Export singleton instance
module.exports = new ClaudeService();