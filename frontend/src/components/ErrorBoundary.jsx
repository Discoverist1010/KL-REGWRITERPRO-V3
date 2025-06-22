import React from 'react'

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Prevents complete app crashes and provides recovery options
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error Boundary caught an error:', {
      error: error.toString(),
      errorInfo,
      timestamp: new Date().toISOString()
    })

    this.setState({
      error,
      errorInfo
    })
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))

    if (this.state.retryCount < 3) {
      window.location.reload()
    }
  }

  handleRestart = () => {
    localStorage.clear()
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            
            <h1>Something went wrong</h1>
            
            <p className="error-message">
              We encountered an unexpected error. Don't worry - your work might still be saved.
            </p>

            <div className="error-actions">
              {this.state.retryCount < 3 ? (
                <button 
                  onClick={this.handleRetry}
                  className="btn-primary error-retry"
                >
                  Try Again ({3 - this.state.retryCount} attempts left)
                </button>
              ) : (
                <button 
                  onClick={this.handleRestart}
                  className="btn-primary error-restart"
                >
                  Restart Application
                </button>
              )}
              
              <button 
                onClick={this.handleRestart}
                className="btn-secondary error-home"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
