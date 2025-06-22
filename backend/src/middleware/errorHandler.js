/**
 * Global error handling middleware
 * Provides consistent error responses and logging
 */

const errorHandler = (error, req, res, next) => {
    console.error('🚨 Global error handler triggered:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    })
  
    // Default error response
    let status = 500
    let message = 'Internal server error'
    let details = null
  
    // Handle specific error types
    if (error.name === 'ValidationError') {
      status = 400
      message = 'Validation failed'
      details = error.details
    } else if (error.name === 'CastError') {
      status = 400
      message = 'Invalid data format'
    } else if (error.message.includes('ENOENT')) {
      status = 404
      message = 'File not found'
    } else if (error.message.includes('EACCES')) {
      status = 403
      message = 'Permission denied'
    } else if (error.message.includes('EMFILE') || error.message.includes('ENFILE')) {
      status = 503
      message = 'Server temporarily overloaded'
    }
  
    // Production vs development error responses
    const isDevelopment = process.env.NODE_ENV === 'development'
  
    const errorResponse = {
      error: message,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method
    }
  
    // Add additional details in development
    if (isDevelopment) {
      errorResponse.details = details || error.message
      errorResponse.stack = error.stack
    }
  
    // Send error response
    res.status(status).json(errorResponse)
  }
  
  module.exports = errorHandler