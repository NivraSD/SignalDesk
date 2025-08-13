# API Response Structure Fixes for SignalDesk

## Problem Analysis

Based on the code review, the main issues are:

1. **Backend returning mock/fallback data** when Claude service is not available
2. **Response structure mismatches** between what frontend expects and what backend returns
3. **Environment variables** may not be properly configured in Vercel

## Immediate Fixes Required

### 1. Frontend Environment Variable Configuration

**Issue**: The frontend deployed on Vercel may not have the correct API URL.

**Fix in Vercel Dashboard**:
1. Go to: https://vercel.com/dashboard
2. Select your SignalDesk project
3. Go to Settings → Environment Variables
4. Add/Update:
   ```
   Key: REACT_APP_API_URL
   Value: https://signaldesk-production.up.railway.app/api
   Scope: Production, Preview, Development
   ```
5. **IMPORTANT**: After adding, you must redeploy:
   - Go to Deployments
   - Click "..." on the latest deployment
   - Click "Redeploy"

### 2. Backend CORS Configuration

**Current Issue**: CORS is set to allow all origins which should work, but may need specific configuration.

**Update in Railway Backend** (`/backend/server.js`):

```javascript
// Replace the current CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'https://signaldesk-frontend.vercel.app',
      /^https:\/\/signaldesk-frontend-.*\.vercel\.app$/, // Regex for preview deployments
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Check if the origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));
```

### 3. Fix Response Structure Issues

**Issue**: The backend's `enhancedClaudeRoutes.js` returns mock data that may not match frontend expectations.

**Key Endpoints to Fix**:

#### A. Media Search Endpoint
Frontend expects specific journalist object structure. Update the mock response:

```javascript
// In /backend/src/routes/enhancedClaudeRoutes.js
// Update the getMockJournalists function to ensure it returns the exact structure
function getMockJournalists() {
  return {
    success: true,
    journalists: [
      {
        id: 1,
        name: "Sarah Johnson",
        publication: "TechCrunch",
        beat: "Enterprise Technology",
        email: "sarah.j@techcrunch.com",
        bio: "Covers enterprise software, cloud computing, and digital transformation",
        twitter: "@sarahtechwriter",
        recentArticles: [
          "How AI is Transforming Enterprise Software",
          "The Future of Cloud Computing in 2025",
          "Top 10 Tech Trends to Watch"
        ]
      },
      // ... more journalists
    ],
    total: 5,
    source: "mock_data"
  };
}
```

#### B. Crisis Advisor Endpoint
Frontend expects JSON object, not string:

```javascript
// Update the crisis advisor response
router.post("/crisis/advisor", async (req, res) => {
  try {
    const response = {
      success: true,
      advice: {
        immediate_actions: [
          "Assess the situation thoroughly",
          "Activate crisis response team",
          "Prepare initial statement"
        ],
        communication_strategy: "Be transparent and timely in communications",
        key_messages: [
          "We are aware of the situation",
          "We are taking it seriously",
          "We will provide updates as available"
        ],
        stakeholders_to_notify: [
          "Executive team",
          "Communications team",
          "Legal counsel"
        ]
      },
      timestamp: new Date().toISOString()
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

### 4. Railway Environment Variables

**Ensure these are set in Railway**:

```bash
# Claude API Configuration
ANTHROPIC_API_KEY=your-actual-api-key-here

# Database Configuration (if using)
DATABASE_URL=your-database-url

# Node Environment
NODE_ENV=production

# Port (Railway provides this automatically)
PORT=3000
```

### 5. Frontend API Call Updates

**Ensure consistent error handling** in `/frontend/src/services/api.js`:

```javascript
// Update the handleResponse function to better handle different response types
const handleResponse = async (response) => {
  // First check if response is ok
  if (!response.ok) {
    // Try to get error details
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      // If JSON parsing fails, get text
      errorData = { message: await response.text() };
    }
    
    console.error("API Error:", {
      status: response.status,
      statusText: response.statusText,
      data: errorData
    });
    
    throw new Error(errorData.error || errorData.message || `API request failed: ${response.status}`);
  }
  
  // Try to parse JSON response
  try {
    const data = await response.json();
    return data;
  } catch {
    // If not JSON, return as text
    const text = await response.text();
    return { data: text };
  }
};
```

### 6. Testing Steps

1. **Test Backend Directly**:
   ```bash
   # Health check
   curl https://signaldesk-production.up.railway.app/api/health
   
   # Test CORS headers
   curl -H "Origin: https://signaldesk-frontend.vercel.app" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: X-Requested-With" \
        -X OPTIONS \
        https://signaldesk-production.up.railway.app/api/health -v
   ```

2. **Test Frontend API Calls**:
   - Open browser console on deployed site
   - Run: `console.log(process.env.REACT_APP_API_URL)`
   - Should show: `https://signaldesk-production.up.railway.app/api`

3. **Use the Test Dashboard**:
   - Open `/backend/src/agents/test-all-features.html` in browser
   - Configure with your URLs
   - Run all tests
   - Check which ones fail

### 7. Quick Fix Script

Run this in the browser console on your deployed frontend to test API connectivity:

```javascript
// Test API connectivity from frontend
async function testAPI() {
  const tests = [
    { name: 'Health Check', url: '/health' },
    { name: 'Media Search', url: '/media/search-reporters', method: 'POST', body: { beat: 'tech' } },
    { name: 'Crisis Advisor', url: '/crisis/advisor', method: 'POST', body: { scenario: 'test' } }
  ];
  
  const baseURL = 'https://signaldesk-production.up.railway.app/api';
  
  for (const test of tests) {
    try {
      const options = {
        method: test.method || 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (test.body) {
        options.body = JSON.stringify(test.body);
      }
      
      const response = await fetch(baseURL + test.url, options);
      const data = await response.json();
      
      console.log(`✅ ${test.name}:`, data);
    } catch (error) {
      console.error(`❌ ${test.name}:`, error.message);
    }
  }
}

testAPI();
```

## Deployment Order

1. **First**: Update Railway backend with CORS fixes
2. **Second**: Set environment variables in Vercel
3. **Third**: Redeploy Vercel frontend
4. **Fourth**: Test all features using the test dashboard

## Expected Outcomes

After implementing these fixes:
- ✅ All API calls should return proper JSON responses
- ✅ No CORS errors in browser console
- ✅ Environment variables properly loaded
- ✅ All features working as they did locally
- ✅ Proper error messages when things fail

## Verification Commands

```bash
# Check if frontend has correct API URL
curl https://signaldesk-frontend.vercel.app/ | grep -o "signaldesk-production.up.railway.app"

# Test backend health
curl https://signaldesk-production.up.railway.app/api/health

# Test a specific endpoint
curl -X POST https://signaldesk-production.up.railway.app/api/media/search-reporters \
  -H "Content-Type: application/json" \
  -d '{"beat":"technology"}'
```

## If Issues Persist

1. Check Railway logs for backend errors
2. Check Vercel build logs for frontend issues
3. Use browser DevTools Network tab to inspect requests/responses
4. Verify Claude API key is set in Railway
5. Test with the provided test dashboard HTML file