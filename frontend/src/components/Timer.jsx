import React, { useState, useEffect, useRef } from 'react'

const Timer = ({ durationMinutes = 30, onTimeUp, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60) // Convert to seconds
  const [isRunning, setIsRunning] = useState(true)
  const [hasWarned5Min, setHasWarned5Min] = useState(false)
  const [hasWarned1Min, setHasWarned1Min] = useState(false)
  const intervalRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    // Initialize timer
    setTimeLeft(durationMinutes * 60)
    setIsRunning(true)
    setHasWarned5Min(false)
    setHasWarned1Min(false)
  }, [durationMinutes])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1
          
          // Warning at 5 minutes
          if (newTime === 300 && !hasWarned5Min) {
            setHasWarned5Min(true)
            showWarning('⚠️ 5 minutes remaining! Please review your answers.')
            playWarningSound()
          }
          
          // Warning at 1 minute
          if (newTime === 60 && !hasWarned1Min) {
            setHasWarned1Min(true)
            showWarning('🚨 1 minute remaining! Your answers will be auto-submitted soon.')
            playWarningSound()
          }
          
          // Time up
          if (newTime <= 0) {
            setIsRunning(false)
            onTimeUp && onTimeUp()
            return 0
          }
          
          return newTime
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isRunning, timeLeft, hasWarned5Min, hasWarned1Min, onTimeUp])

  const showWarning = (message) => {
    // Create a temporary notification
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1f2937;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1000;
      max-width: 300px;
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
    `
    notification.textContent = message
    
    // Add animation keyframes if not already added
    if (!document.getElementById('timer-notifications-style')) {
      const style = document.createElement('style')
      style.id = 'timer-notifications-style'
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `
      document.head.appendChild(style)
    }
    
    document.body.appendChild(notification)
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 5000)
  }

  const playWarningSound = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (error) {
      console.log('Audio notification not available')
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    const totalSeconds = durationMinutes * 60
    return ((totalSeconds - timeLeft) / totalSeconds) * 100
  }

  const getTimeColor = () => {
    if (timeLeft <= 60) return 'text-red-400' // Last minute
    if (timeLeft <= 300) return 'text-yellow-400' // Last 5 minutes
    return 'text-green-400' // Normal time
  }

  const getProgressColor = () => {
    if (timeLeft <= 60) return 'bg-red-500' // Last minute
    if (timeLeft <= 300) return 'bg-yellow-500' // Last 5 minutes
    return 'bg-blue-500' // Normal time
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Timer Display */}
      <div className="text-right">
        <div className={`text-lg font-mono font-bold ${getTimeColor()}`}>
          {formatTime(timeLeft)}
        </div>
        <div className="text-xs text-gray-400">
          {timeLeft <= 0 ? 'Time Up!' : 'Time Remaining'}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-32">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-400 text-center mt-1">
          {Math.round(getProgressPercentage())}% elapsed
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center">
        {timeLeft <= 0 ? (
          <span className="text-red-400 text-xl" title="Time expired">⏰</span>
        ) : timeLeft <= 60 ? (
          <span className="text-red-400 text-xl animate-pulse" title="Critical time">🚨</span>
        ) : timeLeft <= 300 ? (
          <span className="text-yellow-400 text-xl" title="Warning time">⚠️</span>
        ) : (
          <span className="text-green-400 text-xl" title="Normal time">✅</span>
        )}
      </div>
    </div>
  )
}

export default Timer