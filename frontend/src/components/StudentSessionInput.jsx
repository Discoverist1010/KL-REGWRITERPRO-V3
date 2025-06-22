// frontend/src/components/StudentSessionInput.jsx - Minimal Version
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const StudentSessionInput = () => {
  const [sessionId, setSessionId] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!sessionId || sessionId.length < 6) {
      setError('Please enter a valid session ID (minimum 6 characters)')
      return
    }

    // Navigate directly to student interface
    navigate(`/student/${sessionId.toUpperCase()}`)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          margin: '0 0 8px 0', 
          background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent' 
        }}>
          Join Training Session
        </h1>
        
        <p style={{ color: '#94a3b8', marginBottom: '32px' }}>
          Enter your session ID to begin regulatory writing practice
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Enter Session ID (e.g., 0JYS0TRR)"
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '16px',
                textAlign: 'center',
                letterSpacing: '1px',
                fontWeight: '600',
                textTransform: 'uppercase',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              maxLength={10}
              autoFocus
            />
            
            {error && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!sessionId}
            style={{
              width: '100%',
              padding: '16px',
              background: !sessionId 
                ? 'rgba(107, 114, 128, 0.5)' 
                : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: !sessionId ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: !sessionId ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '24px'
            }}
          >
            🎓 Join Session
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#94a3b8',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back to Home
        </button>

        <div style={{ 
          marginTop: '24px', 
          fontSize: '12px', 
          color: 'rgba(255, 255, 255, 0.6)',
          lineHeight: '1.4'
        }}>
          Session IDs are provided by your trainer<br/>
          and are typically 8 characters long
        </div>
      </div>
    </div>
  )
}

export default StudentSessionInput