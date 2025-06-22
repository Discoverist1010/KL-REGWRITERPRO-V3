import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkHealth, uploadDocument, createSession } from '../utils/api'

const TrainerDashboard = () => {
  const [formData, setFormData] = useState({
    title: 'Newsflash',
    timeLimit: 20,
    language: 'English',
    focusAreas: {
      executiveSummary: true,
      impactAnalysis: true,
      actionItems: false
    }
  })
  const [backendStatus, setBackendStatus] = useState('checking...')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedDocument, setUploadedDocument] = useState(null)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [createdSession, setCreatedSession] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const testConnection = async () => {
      try {
        const health = await checkHealth()
        setBackendStatus(`✅ Connected (${health.status})`)
      } catch (error) {
        setBackendStatus('❌ Backend not accessible')
      }
    }
    testConnection()
  }, [])

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setUploadStatus('❌ Please select a PDF file only')
      setSelectedFile(null)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus('❌ File size must be less than 10MB')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    setUploadedDocument(null) // Reset uploaded document
    setUploadStatus(`📄 Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('❌ Please select a PDF file first')
      return
    }

    setIsUploading(true)
    setUploadStatus('📤 Uploading and processing document...')

    try {
      const response = await uploadDocument(selectedFile, formData.language)

      // ADD THESE DEBUG LINES:
      console.log('🐛 FULL UPLOAD RESPONSE:', response)
      console.log('🐛 response.data:', response.data)
      console.log('🐛 response.data.id:', response.data.id)
      console.log('🐛 typeof response.data:', typeof response.data)

      setUploadedDocument(response.data)
      setUploadStatus(`✅ Upload successful! Document processed: ${response.data.textLength} characters extracted`)
    } catch (error) {
      setUploadStatus(`❌ Upload failed: ${error.message}`)
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreateSession = async () => {
    if (!uploadedDocument) {
      alert('Please upload a PDF document first!')
      return
    }
  
    setIsCreatingSession(true)
  
    try {
      const sessionData = {
        title: formData.title,
        timeLimit: formData.timeLimit,
        language: formData.language,
        focusAreas: formData.focusAreas,
        documentId: uploadedDocument.id
      }
  
      const response = await createSession(sessionData)
      
      // Store session ID for navigation
      setCreatedSession(response)
      
      // Show success with session details
      alert(`🎉 Training session created successfully!
      
  Session ID: ${response.sessionId}
  Session URL: ${response.joinUrl}
  
  You can now test the student interface!`)
      
    } catch (error) {
      alert(`❌ Failed to create session: ${error.message}`)
      console.error('Session creation error:', error)
    } finally {
      setIsCreatingSession(false)
    }
  }

  const handleFocusAreaChange = (area) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: {
        ...prev.focusAreas,
        [area]: !prev.focusAreas[area]
      }
    }))
  }

  return (
    <div className="trainer-dashboard">
      <div className="container">
        <header className="page-header">
          <h1>Create Training Session</h1>
          <p>Upload regulatory documents and configure training parameters</p>
          <div className="status">Backend Status: {backendStatus}</div>
        </header>
        
        <div className="dashboard-grid">
          {/* Document Upload Section */}
          <div className="form-section">
            <h3>📄 Document Upload</h3>
            
            <div className="upload-area">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="file-input"
                id="file-upload"
                disabled={isUploading}
              />
              <label htmlFor="file-upload" className="upload-label">
                <div className="upload-icon">📤</div>
                <div className="upload-text">
                  {selectedFile ? selectedFile.name : 'Drop your PDF here or click to browse'}
                </div>
                <div className="upload-info">
                  Supports PDF files up to 10MB
                </div>
              </label>
            </div>

            {uploadStatus && (
              <div className="upload-status">{uploadStatus}</div>
            )}

            <button 
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="upload-btn"
            >
              {isUploading ? '⏳ Processing...' : '📤 Upload & Process Document'}
            </button>

            <div className="form-group">
              <label>Document Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData(prev => ({...prev, language: e.target.value}))}
                className="form-select"
              >
                <option value="English">English</option>
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="Traditional Chinese">Traditional Chinese</option>
                <option value="Simplified Chinese">Simplified Chinese</option>
              </select>
            </div>
          </div>

          {/* Session Configuration */}
          <div className="form-section">
            <h3>⚙️ Session Configuration</h3>
            
            <div className="form-group">
              <label>Session Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Time Limit</label>
              <div className="time-buttons">
                {[15, 20, 30].map(time => (
                  <button
                    key={time}
                    className={`time-btn ${formData.timeLimit === time ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({...prev, timeLimit: time}))}
                  >
                    {time} min
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Focus Areas</label>
              <div className="checkbox-group">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.focusAreas.executiveSummary}
                    onChange={() => handleFocusAreaChange('executiveSummary')}
                  />
                  <span>Executive Summary</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.focusAreas.impactAnalysis}
                    onChange={() => handleFocusAreaChange('impactAnalysis')}
                  />
                  <span>Impact Analysis</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.focusAreas.actionItems}
                    onChange={() => handleFocusAreaChange('actionItems')}
                  />
                  <span>Action Items</span>
                </label>
              </div>
            </div>

            <button 
              className="create-btn"
              onClick={handleCreateSession}
              disabled={!uploadedDocument || isCreatingSession}
            >
              {isCreatingSession ? '⏳ Creating...' : '🚀 Create Training Session'}
            </button>
          </div>
        </div>

        {/* Session Success Section - ADD THIS ENTIRE BLOCK */}
        {createdSession && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '20px',
            maxWidth: '800px',
            margin: '20px auto 0 auto'
          }}>
            <h4 style={{ color: '#22c55e', marginBottom: '12px' }}>
              ✅ Session Created Successfully!
            </h4>
            <p style={{ marginBottom: '16px', fontSize: '14px', color: '#e2e8f0' }}>
              Session ID: <strong>{createdSession.sessionId}</strong>
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => navigate(`/student/${createdSession.sessionId}`)}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🎓 Test Student Interface
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`http://localhost:3000/student/${createdSession.sessionId}`)
                  alert('Session URL copied to clipboard!')
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📋 Copy URL
              </button>
            </div>
          </div>
        )}
        <div className="back-button">
          <button onClick={() => window.history.back()}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default TrainerDashboard
