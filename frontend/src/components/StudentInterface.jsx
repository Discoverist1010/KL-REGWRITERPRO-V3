import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'

const StudentInterface = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  
  // State management
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [answers, setAnswers] = useState({
    executiveSummary: '',
    impactAnalysis: ''
  })

  // Load session data on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('Loading session:', sessionId)
        const response = await api.get(`/sessions/${sessionId}`)
        const sessionData = response.data
        
        console.log('Session loaded:', sessionData)
        
        if (!sessionData || sessionData.status !== 'active') {
          throw new Error('Session not found or expired')
        }
        
        setSession(sessionData)
        setTimeRemaining(sessionData.timeRemaining || sessionData.timeLimit * 60)
        
      } catch (err) {
        console.error('Failed to load session:', err)
        setError(err.response?.data?.message || err.message || 'Failed to load session')
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      loadSession()
    }
  }, [sessionId])

  // Timer countdown effect
  useEffect(() => {
    if (!session || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [session, timeRemaining])

  // Handle answer changes
  const handleAnswerChange = (field, value) => {
    setAnswers(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle time expiry
  const handleTimeUp = async () => {
    console.log('Time expired - auto-submitting')
    await handleSubmit(true)
  }

  // Handle form submission
  const handleSubmit = async (isAutoSubmit = false) => {
    if (submitting) return

    try {
      setSubmitting(true)
      
      const submissionData = {
        sessionId,
        answers,
        submittedAt: new Date().toISOString(),
        isAutoSubmit
      }

      console.log('Submitting answers:', submissionData)
      
      // Submit to analysis endpoint
      const response = await api.post('/analysis/submit', submissionData)
      
      console.log('Submission successful:', response.data)
      
      // Navigate to results immediately 
      console.log('Navigating to results page...') //for debugging
      navigate(`/results/${sessionId}`)
      
    } catch (err) {
      console.error('Submission failed:', err)
      setError(err.response?.data?.message || 'Failed to submit answers')
    } finally {
      setSubmitting(false)
    }
  }

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <p style={{ color: '#cbd5e1', fontSize: '18px', fontWeight: '500' }}>Loading session...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Session Error</h2>
          <p style={{ color: '#cbd5e1', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  // Main interface - Clean Design Matching Mockup
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Header - Matching Trainer Dashboard Style */}
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
              Session {sessionId} • {session?.documentName}
            </p>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              fontFamily: 'monospace',
              color: timeRemaining < 300 ? '#ef4444' : timeRemaining < 600 ? '#f59e0b' : '#10b981'
            }}>
              {formatTime(timeRemaining)}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Time Remaining</div>
          </div>
        </div>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '24px',
        display: 'flex',
        gap: '24px',
        height: 'calc(100vh - 120px)'
      }}>
        
        {/* Left Side - Document */}
        <div style={{ flex: '1', minWidth: '0' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Document</h2>
              {session?.documentUrl && (
                <button
                  onClick={() => window.open(session.documentUrl, '_blank')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#60a5fa',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Open in New Tab ↗
                </button>
              )}
            </div>
            
            <div style={{ 
              flex: 1, 
              background: 'rgba(0, 0, 0, 0.2)', 
              borderRadius: '12px', 
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {session?.documentUrl ? (
                <iframe
                  src={session.documentUrl}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    border: 'none',
                    minHeight: '500px'
                  }}
                  title="Document Viewer"
                />
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: '#94a3b8'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>📄</div>
                    <p>Document not available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Summary Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            flex: 1
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>
              Executive Summary
            </h3>
            
            {/* Writing Hints */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '12px', color: '#93c5fd', fontWeight: '500', marginBottom: '6px' }}>
                💡 Writing Tips:
              </div>
              <ul style={{ 
                fontSize: '11px', 
                color: '#cbd5e1', 
                margin: 0, 
                paddingLeft: '16px',
                lineHeight: '1.4'
              }}>
                <li>Summarize key regulatory requirements in 2-3 sentences</li>
                <li>Identify primary stakeholders affected</li>
                <li>State the main compliance objective clearly</li>
                <li>Keep it concise and executive-level appropriate</li>
              </ul>
            </div>
            
            <textarea
              value={answers.executiveSummary}
              onChange={(e) => handleAnswerChange('executiveSummary', e.target.value)}
              placeholder="Write your executive summary here..."
              maxLength={5000}
              disabled={submitting}
              style={{
                width: '100%',
                height: '160px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '16px',
                color: 'white',
                fontSize: '14px',
                lineHeight: '1.5',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
            />
            <div style={{ 
              textAlign: 'right', 
              color: '#94a3b8', 
              fontSize: '12px', 
              marginTop: '8px',
              fontFamily: 'monospace'
            }}>
              {answers.executiveSummary.length}/5000
            </div>
          </div>

          {/* Analysis Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            flex: 1
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>
              Impact Analysis
            </h3>
            
            {/* Writing Hints */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '12px', color: '#6ee7b7', fontWeight: '500', marginBottom: '6px' }}>
                💡 Writing Tips:
              </div>
              <ul style={{ 
                fontSize: '11px', 
                color: '#cbd5e1', 
                margin: 0, 
                paddingLeft: '16px',
                lineHeight: '1.4'
              }}>
                <li>Analyze impact on different stakeholder groups</li>
                <li>Consider implementation timeline and phases</li>
                <li>Identify potential risks and mitigation strategies</li>
                <li>Suggest practical implementation steps</li>
              </ul>
            </div>
            
            <textarea
              value={answers.impactAnalysis}
              onChange={(e) => handleAnswerChange('impactAnalysis', e.target.value)}
              placeholder="Write your impact analysis here..."
              maxLength={5000}
              disabled={submitting}
              style={{
                width: '100%',
                height: '160px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '16px',
                color: 'white',
                fontSize: '14px',
                lineHeight: '1.5',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
            />
            <div style={{ 
              textAlign: 'right', 
              color: '#94a3b8', 
              fontSize: '12px', 
              marginTop: '8px',
              fontFamily: 'monospace'
            }}>
              {answers.impactAnalysis.length}/5000
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting || timeRemaining <= 0}
            style={{
              background: submitting || timeRemaining <= 0 
                ? 'rgba(107, 114, 128, 0.5)' 
                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: submitting || timeRemaining <= 0 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: submitting || timeRemaining <= 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              transform: submitting ? 'none' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (!submitting && timeRemaining > 0) {
                e.target.style.transform = 'scale(1.02)'
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting && timeRemaining > 0) {
                e.target.style.transform = 'scale(1)'
              }
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Answers'}
          </button>
        </div>
      </div>

      {/* CSS Animation for Loading Spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default StudentInterface