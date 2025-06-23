// frontend/src/utils/api.js - Updated for working Railway backend
import axios from 'axios'

// Railway backend is now working!
const API_BASE_URL = 'https://kl-regwriterpro-v3-production.up.railway.app'

console.log('🔗 API Configuration - Backend Working!', {
  baseURL: API_BASE_URL,
  timestamp: new Date().toISOString()
})

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  withCredentials: false, // Railway backend has permissive CORS
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Health check function - WORKING
export const checkHealth = async () => {
  try {
    console.log('🔍 Testing backend connection...')
    const response = await api.get('/health')
    console.log('✅ Backend connection successful:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message)
    throw error
  }
}

// Document upload function - WORKING BACKEND
export const uploadDocument = async (file, language) => {
  try {
    console.log(`📤 Uploading to working backend: ${file.name}`)
        
    const formData = new FormData()
    formData.append('document', file)
    formData.append('language', language)

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000
    })

    console.log(`✅ Upload successful to Railway backend:`, response.data)
    return response.data
      
  } catch (error) {
    console.error('❌ Upload failed:', error.message)
    
    if (error.response?.status === 413) {
      throw new Error('File too large. Please use a file smaller than 10MB.')
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Invalid file or request.')
    } else if (error.message.includes('Network Error')) {
      throw new Error('Cannot connect to backend. Please check if Railway backend is running.')
    }
    
    throw new Error('Upload failed. Please try again.')
  }
}

// Session creation function - WORKING BACKEND
export const createSession = async (sessionData) => {
  try {
    console.log(`📝 Creating session on working backend:`, sessionData)
    
    const backendSessionData = {
      language: sessionData.language,
      timeLimit: sessionData.timeLimit,
      documentId: sessionData.documentId,
      documentName: sessionData.title
    }
    
    const response = await api.post('/sessions', backendSessionData)
        
    console.log(`✅ Session created on Railway backend:`, response.data)
    return response.data
      
  } catch (error) {
    console.error('❌ Session creation failed:', error.message)
    
    if (error.response?.status === 404) {
      throw new Error('Document not found. Please upload the document again.')
    } else if (error.message.includes('Network Error')) {
      throw new Error('Cannot connect to backend. Railway backend connection failed.')
    }
    
    throw new Error('Failed to create session. Please try again.')
  }
}

// Test connection function
export const testConnection = async () => {
  try {
    console.log('🔗 Testing Railway backend connection...')
    const health = await checkHealth()
    return {
      success: true,
      message: 'Railway backend connection successful!',
      data: health
    }
  } catch (error) {
    return {
      success: false,
      message: error.message,
      suggestion: 'Railway backend appears to be down'
    }
  }
}

export default api