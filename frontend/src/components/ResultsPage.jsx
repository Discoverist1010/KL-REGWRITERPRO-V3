import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'

const ResultsPage = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('Loading analysis results for session:', sessionId)
        const response = await api.get(`/analysis/results/${sessionId}`)
        
        if (response.data.success) {
          setResults(response.data.data)
        } else {
          throw new Error(response.data.message || 'Failed to load results')
        }
        
      } catch (err) {
        console.error('Failed to load results:', err)
        setError(err.response?.data?.message || err.message || 'Failed to load analysis results')
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      loadResults()
    }
  }, [sessionId])

  // Score color coding
  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981'
    if (score >= 80) return '#3b82f6'
    if (score >= 70) return '#f59e0b'
    if (score >= 60) return '#f97316'
    return '#ef4444'
  }

  // Score circle component
  const ScoreCircle = ({ score, size = 'normal' }) => {
    const radius = size === 'large' ? 45 : 35
    const strokeWidth = size === 'large' ? 6 : 4
    const normalizedRadius = radius - strokeWidth * 2
    const circumference = normalizedRadius * 2 * Math.PI
    const strokeDasharray = `${circumference} ${circumference}`
    const strokeDashoffset = circumference - (score / 100) * circumference

    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <svg
          height={radius * 2}
          width={radius * 2}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            stroke="rgba(255, 255, 255, 0.1)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={getScoreColor(score)}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: size === 'large' ? '18px' : '14px'
        }}>
          {score}
        </div>
      </div>
    )
  }

  // Comparison Table Component
  const ComparisonTable = ({ title, userAnswer, professionalExample, color, improvements }) => (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        color: color, 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center'
      }}>
        {title === 'Executive Summary' ? '📝' : '🎯'} {title} Comparison
      </h3>
      
      {/* Comparison Table */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* User Answer */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <h4 style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            color: '#cbd5e1', 
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            Your Answer
          </h4>
          <div style={{
            fontSize: '13px',
            lineHeight: '1.5',
            color: '#e2e8f0',
            minHeight: '80px',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic'
          }}>
            "{userAnswer || 'No response provided'}"
          </div>
        </div>

        {/* AI Suggested Answer */}
        <div style={{
          background: `rgba(${color === '#60a5fa' ? '59, 130, 246' : '16, 185, 129'}, 0.1)`,
          border: `1px solid rgba(${color === '#60a5fa' ? '59, 130, 246' : '16, 185, 129'}, 0.2)`,
          borderRadius: '12px',
          padding: '16px'
        }}>
          <h4 style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            color: color, 
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            AI Suggested Answer
          </h4>
          <div style={{
            fontSize: '13px',
            lineHeight: '1.5',
            color: '#e2e8f0',
            minHeight: '80px',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            fontFamily: 'Georgia, serif'
          }}>
            "{professionalExample}"
          </div>
        </div>
      </div>

      {/* Key Improvements */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#93c5fd', marginBottom: '12px' }}>
          💡 Key Improvements
        </h4>
        <ul style={{ color: '#cbd5e1', fontSize: '13px', margin: 0, paddingLeft: '20px' }}>
          {improvements.map((improvement, index) => (
            <li key={index} style={{ marginBottom: '6px' }}>{improvement}</li>
          ))}
        </ul>
      </div>
    </div>
  )

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '3px solid transparent',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#cbd5e1', fontSize: '18px', fontWeight: '500' }}>Analyzing your responses...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Analysis in Progress</h2>
          <p style={{ color: '#cbd5e1', marginBottom: '24px' }}>
            Your submission is being analyzed. This may take a few moments.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { analysis, submissionData } = results || {}

  // If no analysis data, show completion message
  if (!analysis) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
          <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Analysis Complete!</h2>
          <p style={{ color: '#cbd5e1', marginBottom: '24px' }}>
            Your submission has been received and analyzed successfully.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Start New Session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              KL-RegWriterPro-V3
            </h1>
            <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>
              Analysis Results • Session {sessionId}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate(`/student/${sessionId}`)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Review Submission
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              New Session
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        
        {/* Overall Score Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
            ⚡ Analysis Complete!
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <ScoreCircle score={analysis.overallScore} size="large" />
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '16px' }}>
            Your regulatory writing demonstrates {analysis.overallScore >= 80 ? 'strong' : analysis.overallScore >= 70 ? 'good' : 'developing'} professional competency
          </p>
          {analysis.analysisType && (
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              border: '1px solid rgba(59, 130, 246, 0.2)', 
              borderRadius: '8px', 
              padding: '12px', 
              marginTop: '16px',
              fontSize: '14px',
              color: '#93c5fd'
            }}>
              {analysis.analysisType.includes('demo') ? 
                '🤖 Demo Mode: Enhanced AI analysis simulation' : 
                '🤖 Powered by Claude AI'}
            </div>
          )}
        </div>

        {/* Comparison Tables */}
        <ComparisonTable
          title="Executive Summary"
          userAnswer={analysis.studentAnswers?.executiveSummary}
          professionalExample={analysis.executiveSummary.professionalExample}
          color="#60a5fa"
          improvements={analysis.executiveSummary.improvements}
        />

        <ComparisonTable
          title="Impact Analysis"
          userAnswer={analysis.studentAnswers?.impactAnalysis}
          professionalExample={analysis.impactAnalysis.professionalExample}
          color="#10b981"
          improvements={analysis.impactAnalysis.improvements}
        />

        {/* Detailed Analysis Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          
          {/* Writing Quality */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>📊 Writing Quality</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <ScoreCircle score={analysis.writingQuality.clarity} />
                <p style={{ color: '#cbd5e1', fontSize: '12px', marginTop: '8px' }}>Clarity</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <ScoreCircle score={analysis.writingQuality.conciseness} />
                <p style={{ color: '#cbd5e1', fontSize: '12px', marginTop: '8px' }}>Conciseness</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <ScoreCircle score={analysis.writingQuality.professionalism} />
                <p style={{ color: '#cbd5e1', fontSize: '12px', marginTop: '8px' }}>Professionalism</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <ScoreCircle score={analysis.writingQuality.score} />
                <p style={{ color: '#cbd5e1', fontSize: '12px', marginTop: '8px' }}>Overall</p>
              </div>
            </div>
            
            <p style={{ color: '#cbd5e1', fontSize: '14px' }}>
              {analysis.writingQuality.feedback}
            </p>
          </div>

          {/* Regulatory Compliance */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>⚖️ Regulatory Compliance</h3>
              <ScoreCircle score={analysis.regulatoryCompliance.score} />
            </div>
            
            <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '16px' }}>
              {analysis.regulatoryCompliance.feedback}
            </p>
            
            {analysis.regulatoryCompliance.missingElements.length > 0 && (
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#f97316', marginBottom: '8px' }}>
                  Missing Elements
                </h4>
                <ul style={{ color: '#cbd5e1', fontSize: '14px', margin: 0, paddingLeft: '20px' }}>
                  {analysis.regulatoryCompliance.missingElements.map((element, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{element}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations & Next Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          
          {/* Recommendations */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#8b5cf6' }}>
              📋 Recommendations
            </h3>
            <ul style={{ color: '#cbd5e1', fontSize: '14px', margin: 0, paddingLeft: '20px' }}>
              {analysis.recommendations.map((recommendation, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>{recommendation}</li>
              ))}
            </ul>
          </div>

          {/* Next Steps */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#06b6d4' }}>
              🎯 Next Steps
            </h3>
            <ul style={{ color: '#cbd5e1', fontSize: '14px', margin: 0, paddingLeft: '20px' }}>
              {analysis.nextSteps.map((step, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>{step}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ResultsPage