import React from 'react'

/**
 * Reusable loading spinner component with customizable messages
 * Provides consistent loading states across the application
 */
const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'medium',
  overlay = false 
}) => {
  const getSpinnerClass = () => {
    let baseClass = 'loading-spinner'
    
    switch (size) {
      case 'small':
        baseClass += ' loading-spinner-small'
        break
      case 'large':
        baseClass += ' loading-spinner-large'
        break
      default:
        baseClass += ' loading-spinner-medium'
    }
    
    return baseClass
  }

  const content = (
    <div className="loading-content">
      <div className={getSpinnerClass()}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      
      {message && (
        <p className="loading-message">{message}</p>
      )}
    </div>
  )

  if (overlay) {
    return (
      <div className="loading-overlay">
        {content}
      </div>
    )
  }

  return (
    <div className="loading-screen">
      {content}
    </div>
  )
}

export default LoadingSpinner
