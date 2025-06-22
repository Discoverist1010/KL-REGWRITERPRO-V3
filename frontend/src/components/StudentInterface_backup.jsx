import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import PDFViewer from './PDFViewer'
import WritingPanel from './WritingPanel'
import Timer from './Timer'

const StudentInterface = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  
  // State management
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState({
    executiveSummary: '',
    impactAnalysis: ''
  })

  // Load session data on component mount
  useEffect(() => {
    loadSession()
  }, [sessionId])

  const loadSession = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get(`/sessions/${sessionId}`)
      
      if (response.data) {
        setSession(response.data)
        console.log('✅ Session loaded:', response.data)
      } else {
        throw new Error('Session not found')
      }
    } catch (error) {
      console.error('❌ Failed to load session:', error)
      if (error.response?.status === 404) {
        setError('Session not found. Please check your session ID.')
      } else if (error.response?.status === 410) {
        setError('This session has expired.')
      } else {
        setError('Failed to load session. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (field, value) => {
    setAnswers(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTimeUp = () => {
    console.log('⏰ Time expired - auto-submitting')
    handleSubmit(true)
  }

  const handleSubmit = async (autoSubmit = false) => {
    if (submitting || submitted) return

    try {
      setSubmitting(true)
      
      // Validate answers
      if (!autoSubmit) {
        if (!answers.executiveSummary.trim()) {
          alert('Please provide an executive summary before submitting.')
          return
        }
        if (!answers.impactAnalysis.trim()) {
          alert('Please provide an impact analysis before submitting.')
          return
        }
      }

      console.log('📤 Submitting answers:', answers)

      const submissionData = {
        sessionId,
        answers,
        submittedAt: new Date().toISOString(),
        autoSubmit
      }

      const response = await api.post('/analysis/submit', submissionData)
      
      if (response.data) {
        console.log('✅ Submission successful:', response.data)
        setSubmitted(true)
        
        // Navigate to feedback page (we'll create this later)
        // For now, show success message
        alert(autoSubmit ? 
          'Time expired! Your answers have been submitted automatically.' : 
          'Your answers have been submitted successfully! Feedback will be displayed shortly.'
        )
      }
    } catch (error) {
      console.error('❌ Submission failed:', error)
      alert('Failed to submit answers. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading session...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Session Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  // Submitted state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-white mb-2">Submission Complete</h2>
          <p className="text-gray-300 mb-6">
            Your regulatory writing practice has been submitted. 
            AI analysis and feedback will be processed shortly.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Practice Session</h1>
            <p className="text-gray-400 text-sm">Session ID: {sessionId}</p>
          </div>
          
          {/* Timer */}
          <Timer
            durationMinutes={session?.timeLimit || 30}
            onTimeUp={handleTimeUp}
            className="text-white"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - PDF Viewer */}
        <div className="w-1/2 border-r border-gray-700">
          <PDFViewer
            documentUrl={session?.documentUrl}
            language={session?.language}
            documentName={session?.documentName}
          />
        </div>

        {/* Right Panel - Writing Areas */}
        <div className="w-1/2 flex flex-col">
          <WritingPanel
            answers={answers}
            onAnswerChange={handleAnswerChange}
            language={session?.language}
            disabled={submitting}
          />
          
          {/* Submit Button */}
          <div className="p-6 bg-gray-800 border-t border-gray-700">
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting || !answers.executiveSummary.trim() || !answers.impactAnalysis.trim()}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                submitting || !answers.executiveSummary.trim() || !answers.impactAnalysis.trim()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </span>
              ) : (
                'Submit Practice Answers'
              )}
            </button>
            
            <p className="text-gray-400 text-xs text-center mt-2">
              Make sure both sections are completed before submitting
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentInterface