import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Health check function (FIXED URL)
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`)  // ← Added /api/
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Health check failed:', error)
    throw error
  }
}

// Real document upload function
export const uploadDocument = async (file, language) => {
  try {
    console.log(`📤 Uploading document: ${file.name}`)
        
    const formData = new FormData()
    formData.append('document', file)
    formData.append('language', language)

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // Longer timeout for file upload
    })

    console.log(`✅ Upload successful:`, response.data)
    return response.data  // ← Return full response, not just data
      
  } catch (error) {
    console.error('❌ Upload failed:', error)
    if (error.response?.status === 413) {
      throw new Error('File too large. Please use a file smaller than 10MB.')
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Invalid file or request.')
    }
    throw new Error('Upload failed. Please try again.')
  }
}

// Create training session function (FIXED PARAMETERS)
export const createSession = async (sessionData) => {
  try {
    console.log(`📝 Creating session:`, sessionData)
    
    // Transform frontend data to match backend expectations
    const backendSessionData = {
      language: sessionData.language,
      timeLimit: sessionData.timeLimit,
      documentId: sessionData.documentId,
      documentName: sessionData.title  // ← Map 'title' to 'documentName'
    }
    
    const response = await api.post('/sessions', backendSessionData)
        
    console.log(`✅ Session created:`, response.data)
    return response.data  // ← Return just the data
      
  } catch (error) {
    console.error('❌ Session creation failed:', error)
    if (error.response?.status === 404) {
      throw new Error('Document not found. Please upload the document again.')
    }
    throw new Error('Failed to create session. Please try again.')
  }
}

export default api