# Intelligence System Testing Strategy

## CRITICAL FINDINGS

### System Architecture Discovery
1. **V3 Orchestrator (PRODUCTION)**: Simple 3-phase system at `/frontend/src/services/intelligenceOrchestratorV3.js`
   - Phase 1: Discovery → `intelligence-discovery-v3`
   - Phase 2: Gathering → `intelligence-gathering-v3`
   - Phase 3: Synthesis → `intelligence-synthesis-v3`
   - **ISSUE**: V3 synthesis does NOT save to `intelligence_stage_data` table

2. **V4 System (EXISTS BUT NOT USED)**: 6-stage elaborate system
   - Located at `IntelligenceHubV4.js` but not in active routing
   - Stage 1-6 functions DO save to `intelligence_stage_data`
   - Uses different stage naming convention

3. **Data Storage Reality**:
   - V3 Discovery saves to `organization_profiles` via `intelligence-persistence`
   - V3 Synthesis returns data directly without persistence
   - V4 stages save to `intelligence_stage_data` with stage names like "stage-1-competitors"
   - MemoryVault is a separate system, not integrated with main flow

## TEST PLAN

### Test 1: Verify V3 Data Persistence
**Purpose**: Confirm V3 is NOT saving synthesis results to database

```javascript
// Run in browser console on Intelligence tab
console.log('🔍 TEST 1: V3 Data Persistence Check');

// 1. Clear cache and trigger fresh intelligence fetch
localStorage.removeItem('signaldesk_intelligence_cache');
console.log('✅ Cache cleared');

// 2. Monitor network requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (url.includes('intelligence')) {
    console.log('📡 Intelligence API call:', url);
  }
  return originalFetch.apply(this, args).then(response => {
    if (url.includes('intelligence-persistence')) {
      console.log('💾 PERSISTENCE CALL DETECTED:', url);
      response.clone().json().then(data => {
        console.log('Persistence data:', data);
      });
    }
    return response;
  });
};

// 3. Click refresh button on Intelligence tab
console.log('👆 Now click the refresh button on Intelligence tab');
```

**Expected Result**: 
- Should see calls to discovery-v3, gathering-v3, synthesis-v3
- Should NOT see persistence calls from synthesis-v3

### Test 2: Check Database for V3 Data
**Purpose**: Verify what's actually in intelligence_stage_data table

```sql
-- Run in Supabase SQL editor
-- Check what stage names exist
SELECT DISTINCT 
  stage_name,
  COUNT(*) as record_count,
  MAX(created_at) as latest_record
FROM intelligence_stage_data
GROUP BY stage_name
ORDER BY latest_record DESC;

-- Check for V3-specific stages (should be empty)
SELECT * FROM intelligence_stage_data 
WHERE stage_name IN ('discovery-v3', 'gathering-v3', 'synthesis-v3')
LIMIT 10;

-- Check what organization profiles exist (V3 saves here)
SELECT 
  organization_name,
  created_at,
  jsonb_pretty(profile_data->'metadata') as metadata
FROM organization_profiles
ORDER BY created_at DESC
LIMIT 5;
```

### Test 3: V4 Pipeline Direct Access
**Purpose**: Test if V4 pipeline works when called directly

```javascript
// Test V4 edge functions directly
async function testV4Pipeline() {
  console.log('🚀 Testing V4 Pipeline Direct Access');
  
  const org = JSON.parse(localStorage.getItem('signaldesk_organization'));
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0';
  
  // Test Stage 1: Competitors
  console.log('📊 Testing Stage 1: Competitors');
  const stage1Response = await fetch(
    'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-1-competitors',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ organization: org })
    }
  );
  
  const stage1Data = await stage1Response.json();
  console.log('Stage 1 Response:', stage1Data);
  
  // Check if it saved to database
  if (stage1Data.success) {
    console.log('✅ Stage 1 completed, checking persistence...');
    
    // Query database for stage 1 data
    const checkResponse = await fetch(
      'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          action: 'getStageData',
          organization_name: org.name,
          stage: 'stage-1-competitors',
          limit: 1
        })
      }
    );
    
    const checkData = await checkResponse.json();
    console.log('📊 Stage 1 Database Check:', checkData);
  }
  
  return stage1Data;
}

// Run the test
testV4Pipeline();
```

### Test 4: Stage Name Mismatch Detection
**Purpose**: Identify all stage naming patterns in use

```javascript
// Monitor all stage-related activity
function monitorStageActivity() {
  console.log('👁️ Monitoring all stage activity...');
  
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options] = args;
    
    if (url.includes('intelligence') && options?.body) {
      try {
        const body = JSON.parse(options.body);
        if (body.stage || body.stage_name) {
          console.log('🏷️ STAGE DETECTED:', {
            url: url.split('/').pop(),
            stage: body.stage || body.stage_name,
            action: body.action
          });
        }
      } catch (e) {}
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Stage monitoring active. Now use the Intelligence features.');
}

monitorStageActivity();
```

### Test 5: MemoryVault Integration Check
**Purpose**: Verify MemoryVault's actual vs intended role

```javascript
// Check MemoryVault data
async function checkMemoryVault() {
  console.log('🧠 Checking MemoryVault Integration');
  
  // Check localStorage for any MemoryVault data
  const memoryKeys = Object.keys(localStorage).filter(k => 
    k.toLowerCase().includes('memory') || 
    k.toLowerCase().includes('vault')
  );
  
  console.log('📦 MemoryVault localStorage keys:', memoryKeys);
  
  memoryKeys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`${key}:`, value ? JSON.parse(value) : 'empty');
  });
  
  // Check if MemoryVault service is being used
  if (window.MemoryVaultService) {
    console.log('✅ MemoryVault service found');
    console.log('Methods:', Object.getOwnPropertyNames(window.MemoryVaultService));
  } else {
    console.log('❌ MemoryVault service not found in window');
  }
  
  // Check Supabase for MemoryVault tables
  const supabase = window.__SIGNALDESK_SUPABASE__;
  if (supabase) {
    const { data, error } = await supabase
      .from('memory_vault')
      .select('*')
      .limit(5);
    
    console.log('🗄️ MemoryVault database check:', {
      hasData: !!data?.length,
      recordCount: data?.length || 0,
      error: error?.message
    });
  }
}

checkMemoryVault();
```

### Test 6: Full Data Flow Verification
**Purpose**: Track data from input to display

```javascript
// Complete data flow tracker
function trackFullDataFlow() {
  console.log('🔄 Starting Full Data Flow Tracking');
  
  // Track all intelligence-related state changes
  const intelligenceStates = new Map();
  
  // Monitor React DevTools if available
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools detected - monitoring component updates');
  }
  
  // Monitor fetch calls
  const originalFetch = window.fetch;
  let requestId = 0;
  
  window.fetch = function(...args) {
    const [url, options] = args;
    const currentId = ++requestId;
    
    if (url.includes('intelligence') || url.includes('supabase')) {
      const startTime = Date.now();
      console.log(`📤 [${currentId}] Request to:`, url.split('/').slice(-2).join('/'));
      
      if (options?.body) {
        try {
          const body = JSON.parse(options.body);
          console.log(`   Body preview:`, {
            action: body.action,
            stage: body.stage,
            organization: body.organization?.name
          });
        } catch (e) {}
      }
      
      return originalFetch.apply(this, args).then(async response => {
        const duration = Date.now() - startTime;
        const responseClone = response.clone();
        
        try {
          const data = await responseClone.json();
          console.log(`📥 [${currentId}] Response (${duration}ms):`, {
            status: response.status,
            success: data.success,
            hasData: !!data.tabs || !!data.intelligence,
            dataKeys: Object.keys(data).filter(k => k !== 'metadata')
          });
          
          // Track synthesis results specifically
          if (url.includes('synthesis')) {
            console.log('🎯 SYNTHESIS DATA STRUCTURE:', {
              tabs: data.tabs ? Object.keys(data.tabs) : 'none',
              alerts: data.alerts?.length || 0,
              fromCache: data.fromCache || false
            });
            
            // Store for comparison
            intelligenceStates.set('latest_synthesis', data);
          }
        } catch (e) {}
        
        return response;
      });
    }
    
    return originalFetch.apply(this, args);
  };
  
  // Monitor localStorage changes
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    if (key.includes('intelligence')) {
      console.log('💾 LocalStorage Update:', key);
      try {
        const parsed = JSON.parse(value);
        console.log('   Data structure:', {
          keys: Object.keys(parsed).slice(0, 5),
          timestamp: parsed.timestamp
        });
      } catch (e) {}
    }
    return originalSetItem.apply(this, arguments);
  };
  
  console.log('✅ Full data flow tracking active');
  console.log('👉 Now refresh the Intelligence tab to see complete flow');
  
  return intelligenceStates;
}

const flowTracker = trackFullDataFlow();
```

## CONSOLE COMMANDS SUMMARY

```javascript
// Quick test suite - copy and run in console
const testSuite = {
  // 1. Clear and refresh
  clearAndRefresh: () => {
    localStorage.removeItem('signaldesk_intelligence_cache');
    console.log('Cache cleared. Click refresh button now.');
  },
  
  // 2. Check current state
  checkState: () => {
    console.log('Organization:', JSON.parse(localStorage.getItem('signaldesk_organization')));
    console.log('Has cache:', !!localStorage.getItem('signaldesk_intelligence_cache'));
    console.log('Supabase connected:', !!window.__SIGNALDESK_SUPABASE__);
  },
  
  // 3. Test V4 directly
  testV4: async () => {
    const org = JSON.parse(localStorage.getItem('signaldesk_organization'));
    const response = await fetch(
      'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-1-competitors',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0'
        },
        body: JSON.stringify({ organization: org })
      }
    );
    const data = await response.json();
    console.log('V4 Stage 1 Test:', data);
    return data;
  },
  
  // 4. Check database
  checkDB: async () => {
    const supabase = window.__SIGNALDESK_SUPABASE__;
    if (!supabase) {
      console.log('Supabase not available');
      return;
    }
    
    const { data: stages } = await supabase
      .from('intelligence_stage_data')
      .select('stage_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log('Recent stage data:', stages);
    
    const { data: profiles } = await supabase
      .from('organization_profiles')
      .select('organization_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('Recent profiles:', profiles);
  }
};

// Make it globally available
window.intelligenceTests = testSuite;
console.log('✅ Test suite loaded. Use: window.intelligenceTests.<method>()');
console.log('Available methods:', Object.keys(testSuite));
```

## EXPECTED FINDINGS

### V3 System (Production)
- ✅ Saves organization profile during Discovery phase
- ❌ Does NOT save synthesis results to intelligence_stage_data
- ✅ Returns data directly to frontend
- ✅ Frontend caches in localStorage

### V4 System (Dormant)
- ✅ All 6 stages save to intelligence_stage_data
- ✅ Uses stage names like "stage-1-competitors"
- ❌ Not accessible through current UI routing
- ✅ Can be called directly via edge functions

### MemoryVault
- ❓ Separate system, not integrated with main intelligence flow
- ❓ May have its own tables and storage mechanism
- ❓ Role unclear in current architecture

## ACTION ITEMS

1. **Immediate**: Run tests 1-3 to confirm V3 behavior
2. **Validation**: Run test 4 to verify V4 functionality
3. **Discovery**: Run tests 5-6 to understand full system
4. **Decision Required**: 
   - Should V3 save to intelligence_stage_data?
   - Should we activate V4 system?
   - How should MemoryVault integrate?

## DATABASE QUERIES TO RUN

```sql
-- 1. What's in intelligence_stage_data?
SELECT stage_name, COUNT(*) 
FROM intelligence_stage_data 
GROUP BY stage_name;

-- 2. What's in organization_profiles?
SELECT COUNT(*), MAX(created_at) 
FROM organization_profiles;

-- 3. Check for orphaned data
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%intelligence%';
```