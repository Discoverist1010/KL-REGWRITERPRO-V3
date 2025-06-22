/**
 * Application constants and configuration values for KL RegWriter Pro V3
 */

export const APP_CONFIG = {
    name: 'KL RegWriter Pro V3',
    version: '3.0.0',
    description: 'AI-powered regulatory newsflash training platform'
  }
  
  export const SUPPORTED_LANGUAGES = [
    { value: 'English', label: 'English' },
    { value: 'Bahasa Indonesia', label: 'Bahasa Indonesia' },
    { value: 'Traditional Chinese', label: 'Traditional Chinese' },
    { value: 'Simplified Chinese', label: 'Simplified Chinese' }
  ]
  
  export const TIME_LIMITS = [15, 20, 30] // Minutes
  
  export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
  
  export const SUPPORTED_FILE_TYPES = ['application/pdf']
  
  export const FOCUS_AREAS = {
    executiveSummary: 'Executive Summary',
    impactAnalysis: 'Impact Analysis',
    actionItems: 'Action Items'
  }
  
  export const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  
  export const API_ENDPOINTS = {
    health: '/health',
    upload: '/api/upload',
    sessions: '/api/sessions',
    analysis: '/api/analysis'
  }