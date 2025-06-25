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

Please provide:
1. A score (0-100) for the executive summary
2. A professional example of how the executive summary should be written
3. Specific feedback on the student's executive summary
4. A score (0-100) for the impact analysis
5. A professional example of how the impact analysis should be written
6. Specific feedback on the student's impact analysis
7. An overall score (0-100)

Format your response as JSON with the following structure:
{
  "executiveSummary": {
    "score": number,
    "professionalExample": "string",
    "feedback": "string"
  },
  "impactAnalysis": {
    "score": number,
    "professionalExample": "string",
    "feedback": "string"
  },
  "overallScore": number
}`;
  }

  parseClaudeResponse(responseText, submissionData) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sessionId: submissionData.sessionId,
          timestamp: new Date().toISOString(),
          overallScore: parsed.overallScore || 75,
          executiveSummary: parsed.executiveSummary || {},
          impactAnalysis: parsed.impactAnalysis || {},
          analysisType: 'claude-ai',
          model: 'claude-sonnet-4-20250514'
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

    // Simple scoring based on content length
    const summaryScore = Math.min(100, Math.round((executiveSummary?.length || 0) / 5));
    const analysisScore = Math.min(100, Math.round((impactAnalysis?.length || 0) / 5));
    const overallScore = Math.round((summaryScore + analysisScore) / 2);

    return {
      sessionId: submissionData.sessionId,
      timestamp: new Date().toISOString(),
      overallScore,
      executiveSummary: {
        score: summaryScore,
        professionalExample: "The regulatory document introduces new requirements for financial institutions regarding capital adequacy and risk management procedures.",
        feedback: "This is a placeholder analysis. Connect Claude AI for real feedback."
      },
      impactAnalysis: {
        score: analysisScore,
        professionalExample: "Financial institutions will need to update their compliance frameworks and reporting systems by Q2 2024 to meet the new requirements.",
        feedback: "This is a placeholder analysis. Connect Claude AI for real feedback."
      },
      analysisType: 'placeholder'
    };
  }
}

// Export singleton instance
module.exports = new ClaudeService();