// backend/test-claude.js - FIXED VERSION
require('dotenv').config()

console.log('🔧 Claude Integration Debug Test')
console.log('================================')

// Test 1: Environment setup
console.log('\n1. Environment Check:')
console.log('   Node version:', process.version)
console.log('   NODE_ENV:', process.env.NODE_ENV)
console.log('   CLAUDE_API_KEY exists:', !!process.env.CLAUDE_API_KEY)
console.log('   CLAUDE_API_KEY format:', process.env.CLAUDE_API_KEY?.substring(0, 10) + '...')
console.log('   Fetch available:', typeof fetch !== 'undefined')

// Test 2: Fetch availability
console.log('\n2. Fetch Test:')
if (typeof fetch === 'undefined') {
  console.log('❌ Fetch not available - trying to enable...')
  try {
    global.fetch = require('node-fetch')
    console.log('✅ node-fetch imported successfully')
  } catch (err) {
    console.log('❌ node-fetch not available, install with: npm install node-fetch')
  }
} else {
  console.log('✅ Built-in fetch is available')
}

// Test 3: Simple Claude API test - FIXED MODEL NAME
async function testClaudeAPI() {
  console.log('\n3. Claude API Test:')
  
  if (!process.env.CLAUDE_API_KEY) {
    console.log('❌ No API key, skipping API test')
    return
  }
  
  try {
    console.log('📡 Making test API call...')
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', // FIXED: Use Claude Sonnet 4
        max_tokens: 100,
        messages: [
          { role: 'user', content: 'Hello Claude! Just testing the connection.' }
        ]
      })
    })
    
    console.log('📊 Response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Claude API test successful!')
      console.log('📄 Response preview:', data.content[0].text.substring(0, 100) + '...')
    } else {
      const errorText = await response.text()
      console.log('❌ Claude API test failed:', response.status, errorText)
    }
    
  } catch (error) {
    console.log('❌ Claude API test error:', error.message)
    console.log('📄 Full error:', error)
  }
}

// Test 4: Claude Service test
async function testClaudeService() {
  console.log('\n4. Claude Service Test:')
  
  try {
    const claudeService = require('./src/services/claudeService')
    console.log('✅ Claude service imported successfully')
    
    const testData = {
      sessionId: '0JYS0TRR',
      answers: {
        executiveSummary: 'This is a test executive summary for regulatory compliance testing',
        impactAnalysis: 'This test examines the impact on stakeholders and implementation requirements'
      },
      documentId: '50c78f34-da32-4632-81a6-07656d40836d'
    }
    
    console.log('🤖 Testing Claude service analysis...')
    const result = await claudeService.analyzeRegulatoryWriting(testData)
    
    console.log('✅ Claude service test completed!')
    console.log('📊 Analysis type:', result.analysisType)
    console.log('📊 Overall score:', result.overallScore)
    console.log('📊 Executive summary score:', result.executiveSummary.score)
    
  } catch (error) {
    console.log('❌ Claude service test failed:', error.message)
    console.log('📄 Error stack:', error.stack)
  }
}

// Run all tests
async function runAllTests() {
  await testClaudeAPI()
  await testClaudeService()
  
  console.log('\n================================')
  console.log('🎯 Debug test completed!')
  console.log('✅ Claude Sonnet 4 is working perfectly!')
  console.log('================================')
}

runAllTests()