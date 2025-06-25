# Debugging 404 Error After Submission

## Issue
After submission, getting "fail to load resource. server responded with 404"

## Backend Status: ✅ WORKING
The backend endpoint `POST /api/analysis/submit` is correctly configured and working.

## Most Likely Causes

### 1. Frontend API Base URL Configuration
The frontend might be pointing to the wrong backend URL.

**Check in frontend code:**
```javascript
// Look for axios configuration
const api = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:5000/api'
});
```

**On Railway, the frontend needs to use your Railway backend URL:**
```
https://your-app-name.up.railway.app/api
```

### 2. Frontend Environment Variables
Make sure the frontend has the correct environment variable set:
- In Vercel: Add `VITE_API_URL=https://your-railway-backend.up.railway.app/api`
- Don't include trailing slash

### 3. Check Browser Network Tab
1. Open Developer Tools > Network tab
2. Submit the form
3. Look for the failed request
4. Check the exact URL being called
5. It should be: `https://your-railway-backend.up.railway.app/api/analysis/submit`

### 4. Frontend Code Issues
The 404 might be from navigation after submission:
```javascript
// After successful submission, if it navigates to:
navigate(`/results/${sessionId}`)
// But sessionId is undefined, it could cause 404
```

## Quick Fixes to Try

### Fix 1: Update Frontend API Configuration
In your frontend's `api/config.js` or wherever axios is configured:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add logging
api.interceptors.request.use(request => {
  console.log('Starting Request:', request.url);
  console.log('Full URL:', request.baseURL + request.url);
  return request;
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);
```

### Fix 2: Debug the Submission Function
In your StudentInterface.jsx or wherever submission happens:
```javascript
const handleSubmit = async (isAutoSubmit = false) => {
  console.log('=== SUBMISSION DEBUG ===');
  console.log('Session ID:', sessionId);
  console.log('API Base URL:', api.defaults.baseURL);
  console.log('Submitting to:', api.defaults.baseURL + '/analysis/submit');
  
  try {
    const response = await api.post('/analysis/submit', {
      sessionId,
      answers: {
        executiveSummary,
        impactAnalysis
      },
      submittedAt: new Date().toISOString(),
      isAutoSubmit
    });
    
    console.log('Submission successful:', response.data);
    
    // Check if navigation is causing 404
    if (response.data.success) {
      console.log('Navigating to results...');
      navigate(`/results/${sessionId}`);
    }
  } catch (error) {
    console.error('Submission error:', error);
    console.error('Error URL:', error.config?.url);
    console.error('Error status:', error.response?.status);
  }
};
```

### Fix 3: Test the API Directly
Use curl or Postman to test the Railway backend directly:
```bash
curl -X POST https://your-railway-backend.up.railway.app/api/analysis/submit \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "answers": {
      "executiveSummary": "Test summary",
      "impactAnalysis": "Test impact"
    }
  }'
```

## Verification Steps

1. **Check Railway Logs**
   - Look for incoming requests
   - Should see: `📝 Submit analysis called for session: XXX`

2. **Check Frontend Console**
   - Look for the exact URL being called
   - Check for CORS errors
   - Verify sessionId is not undefined

3. **Check Network Tab**
   - Look at Request URL
   - Check Request Headers
   - Look at Response (might give more details)

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Frontend using localhost URL in production | Set VITE_API_URL in Vercel |
| SessionId is undefined | Check session creation/storage |
| CORS blocking request | Backend CORS is permissive, shouldn't be issue |
| Wrong endpoint path | Should be `/api/analysis/submit` not `/analysis/submit` |
| Frontend routing 404 | Check React Router configuration |

## Need More Help?

1. Share the exact URL shown in Network tab
2. Share the browser console errors
3. Share the Railway logs during submission