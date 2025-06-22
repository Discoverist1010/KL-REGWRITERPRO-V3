import React from 'react'

/**
 * Component to display AI feedback and comparison with professional answers
 * Shows detailed analysis and suggestions for improvement
 */
const FeedbackDisplay = ({ feedback, session, answers }) => {
  return (
    <div className="feedback-display">
      <div className="container">
        {/* Header */}
        <div className="feedback-header">
          <h1>Training Complete!</h1>
          <p>Here's your analysis and feedback</p>
        </div>

        {/* Performance Summary */}
        <div className="performance-summary">
          <div className="summary-card">
            <h3>Overall Score</h3>
            <div className="score-display">
              <span className="score">{feedback.overallScore}</span>
              <span className="score-max">/100</span>
            </div>
          </div>
          
          <div className="summary-card">
            <h3>Time Used</h3>
            <div className="time-display">
              {Math.floor(feedback.timeUsed / 60)}:{(feedback.timeUsed % 60).toString().padStart(2, '0')}
            </div>
          </div>
          
          <div className="summary-card">
            <h3>Areas for Improvement</h3>
            <div className="improvement-count">
              {feedback.improvementAreas?.length || 0} areas identified
            </div>
          </div>
        </div>

        {/* Detailed Feedback Sections */}
        <div className="feedback-sections">
          {/* Executive Summary Feedback */}
          {answers.summary && feedback.summaryFeedback && (
            <div className="feedback-section">
              <h2>Executive Summary Analysis</h2>
              
              <div className="comparison-view">
                <div className="student-answer">
                  <h4>Your Answer</h4>
                  <div className="answer-text">{answers.summary}</div>
                  <div className="score-badge">Score: {feedback.summaryFeedback.score}/100</div>
                </div>
                
                <div className="professional-answer">
                  <h4>Professional Example</h4>
                  <div className="answer-text">{feedback.summaryFeedback.professionalExample}</div>
                </div>
              </div>
              
              <div className="feedback-details">
                <h4>Detailed Feedback</h4>
                <div className="feedback-points">
                  <div className="strengths">
                    <h5>✅ Strengths:</h5>
                    <ul>
                      {feedback.summaryFeedback.strengths?.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="improvements">
                    <h5>📈 Areas for Improvement:</h5>
                    <ul>
                      {feedback.summaryFeedback.improvements?.map((improvement, index) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Impact Analysis Feedback */}
          {answers.impactAnalysis && feedback.impactFeedback && (
            <div className="feedback-section">
              <h2>Impact Analysis Assessment</h2>
              
              <div className="comparison-view">
                <div className="student-answer">
                  <h4>Your Answer</h4>
                  <div className="answer-text">{answers.impactAnalysis}</div>
                  <div className="score-badge">Score: {feedback.impactFeedback.score}/100</div>
                </div>
                
                <div className="professional-answer">
                  <h4>Professional Example</h4>
                  <div className="answer-text">{feedback.impactFeedback.professionalExample}</div>
                </div>
              </div>
              
              <div className="feedback-details">
                <h4>Detailed Feedback</h4>
                <div className="feedback-points">
                  <div className="strengths">
                    <h5>✅ Strengths:</h5>
                    <ul>
                      {feedback.impactFeedback.strengths?.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="improvements">
                    <h5>📈 Areas for Improvement:</h5>
                    <ul>
                      {feedback.impactFeedback.improvements?.map((improvement, index) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Items */}
        <div className="action-items">
          <h2>Next Steps</h2>
          <div className="recommendations">
            {feedback.recommendations?.map((recommendation, index) => (
              <div key={index} className="recommendation-card">
                <h4>{recommendation.title}</h4>
                <p>{recommendation.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="feedback-actions">
          <button 
            onClick={() => window.location.href = '/'}
            className="btn-secondary"
          >
            Start New Session
          </button>
          
          <button 
            onClick={() => window.print()}
            className="btn-primary"
          >
            Print Results
          </button>
        </div>
      </div>
    </div>
  )
}

export default FeedbackDisplay