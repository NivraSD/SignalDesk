# Sentiment Context Debugging Guide

## Issue
The custom sentiment context (positive/negative scenarios) configured in the AI Config tab is not being used when analyzing mentions.

## What We've Done

### 1. Added Comprehensive Logging
- Frontend: Added logging in `handleSaveConfig`, `analyzeWithClaude`, and config loading
- Backend: Added logging in `saveConfig` and `analyzeSentiment` endpoints
- All logs are prefixed with `===` for easy searching

### 2. Fixed Config Saving
- Updated `handleSaveConfig` to properly include `dataSourceConfig` 
- Ensures keywords are saved correctly from Data Sources tab

### 3. Created Debug Tools

#### A. Debug Script (`debug-sentiment-context.js`)
Run this in the browser console while on the AI Monitoring page:
```javascript
// Copy the entire contents of debug-sentiment-context.js
```

#### B. Test UI (`test-sentiment-ui.html`)
Open this file in a browser to manually test the sentiment context flow:
1. Set your auth token
2. Define sentiment contexts
3. Test the analysis

#### C. Backend Test Script (`test-sentiment-flow.js`)
Run from backend directory:
```bash
# First, get your auth token from browser
# Then update TEST_TOKEN in the script
node test-sentiment-flow.js
```

## How to Debug

### Step 1: Check Console Logs
When using the AI Monitoring feature, look for these logs:

1. **When saving config:**
   - `=== SAVING CONFIG ===`
   - Check if sentiment context is populated

2. **When loading config:**
   - `=== LOADING CLAUDE CONFIG ===`
   - Check if sentiment context is loaded from API

3. **When analyzing:**
   - `=== ANALYZE WITH CLAUDE ===`
   - Check if sentiment context is being sent

4. **Backend logs:**
   - `=== BACKEND: SAVE CONFIG REQUEST ===`
   - `=== BACKEND: ANALYZE SENTIMENT REQUEST ===`

### Step 2: Test the Flow

1. **Clear existing config:**
   ```javascript
   localStorage.removeItem('aiMonitorConfig');
   ```

2. **Go to AI Config tab:**
   - Enter positive scenarios (e.g., "Customer satisfaction, Innovation")
   - Enter negative scenarios (e.g., "Data security concerns, Privacy issues")
   - Click "Save AI Configuration"
   - Check console for save logs

3. **Refresh the page:**
   - Check console for load logs
   - Verify AI Config shows your saved values

4. **Test analysis:**
   - Go to Live Feed tab
   - Click "Fetch Mentions" then "Analyze All"
   - Check console for analysis logs

### Step 3: Verify Backend

Check if config is saved in database:
```sql
SELECT config_data 
FROM monitoring_configs 
WHERE user_id = [YOUR_USER_ID];
```

## Expected Behavior

When properly configured, analyzing text like:
> "Our customer support team received praise for quickly resolving a data security concern."

Should return:
- Sentiment: **Negative** (because "data security concern" is in negative scenarios)
- Score: -60 to -80
- Rationale: Mentioning the negative indicator in the analysis

## Common Issues

1. **Config not saving**: Check network tab for 200 response
2. **Config not loading**: Check if user is authenticated
3. **Context not sent**: Verify claudeConfig state in React DevTools
4. **Analysis ignoring context**: Check backend logs for received context

## Next Steps

If the issue persists after following this guide:

1. Check the network tab for the exact request/response
2. Use React DevTools to inspect `claudeConfig` state
3. Add breakpoints in `analyzeWithClaude` function
4. Check if the issue is with specific text or all analyses

## Quick Fix Test

Run this in the console to test if the backend is working:
```javascript
fetch('http://localhost:5001/api/monitoring/analyze-sentiment', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: "Data security concern mentioned",
    source: "test",
    sentimentContext: {
      negativeScenarios: "data security concerns"
    }
  })
}).then(r => r.json()).then(console.log)
```

This should return negative sentiment if the context is working.