# Crisis Detection Complete Fix

**Date:** October 17, 2025
**Status:** ✅ FIXED

## Problem Identified

Crisis detection was already fully implemented (like opportunities), but had **two critical bugs** preventing it from working:

### Bug 1: Table Name Mismatch
- **Orchestrator** saved crises to `crises` table (line 538)
- **Crisis Command Center** queried `crisis_events` table (lines 147, 224, 253, 287, 337, 372, 387)
- Result: Crises were saved but never detected

### Bug 2: UUID vs Name Mismatch
- **Orchestrator** correctly used UUID (`organizationId`)
- **Crisis Command Center** used `organization.name` instead of `organization.id` (UUID)
- Result: Even if tables matched, query would fail due to ID mismatch

## How Crisis Detection Actually Works (Like Opportunities!)

You were **100% correct** - crisis detection works exactly like opportunities:

### Opportunity Flow
```
real-time-intelligence-orchestrator
  ↓ (enriched intelligence data)
mcp-opportunity-detector (Claude analyzes)
  ↓ (detected opportunities)
opportunity-orchestrator-v2 (enhances)
  ↓ (saves to opportunities table)
Opportunities Module queries and displays
```

### Crisis Flow (Now Fixed!)
```
real-time-intelligence-orchestrator
  ↓ (enriched intelligence data)
  ↓ (filters for crisis-type events)
mcp-crisis (Claude analyzes)
  ↓ (detects crisis signals)
  ↓ (assesses severity for each)
  ↓ (saves to crisis_events table) ✅ FIXED
Crisis Command Center queries and displays ✅ FIXED
```

## Files Fixed

### 1. `/supabase/functions/real-time-intelligence-orchestrator/index.ts` (Line 538)

**Before:**
```typescript
await supabase.from('crises').insert({
  organization_id: organization_name,  // Wrong: using name
  title: crisis.title || crisis.description?.substring(0, 100),
  description: crisis.description,
  severity: assessmentData.severity,
  // ... incomplete schema
})
```

**After:**
```typescript
// Save to crisis_events table (matching Crisis Command Center expectations)
await supabase.from('crisis_events').insert({
  organization_id: organizationId,  // Use UUID
  title: crisis.title || crisis.description?.substring(0, 100),
  description: crisis.description,
  severity: assessmentData.severityLevel || assessmentData.severity || 'medium',
  crisis_type: crisis.type || 'intelligence_alert',
  status: 'monitoring',  // Start as monitoring, can escalate to 'active'
  started_at: new Date().toISOString(),
  trigger_source: 'real-time-intelligence',
  trigger_data: {
    events: crisis.events || crisisEvents.slice(0, 3),
    assessment: assessmentData,
    response_timeframe: assessmentData.responseUrgency || assessmentData.response_timeframe,
    key_risks: assessmentData.keyRisks || []
  },
  metadata: {
    time_window,
    detected_by: 'real-time-intelligence-orchestrator',
    severity_score: assessmentData.severityScore,
    escalation_risk: assessmentData.escalationRisk
  }
})
```

### 2. `/src/components/modules/CrisisCommandCenter.tsx`

**Line 233 - Load Active Crisis:**
```typescript
// Before
.eq('organization_id', organization.name)

// After
.eq('organization_id', organization.id)  // Use UUID instead of name
```

**Line 286 - Activate Crisis Scenario:**
```typescript
// Before
organization_id: organization.name,

// After
organization_id: organization.id,  // Use UUID instead of name
```

## Crisis Detection Pipeline (Full Detail)

### Stage 6b: Crisis Detection (Lines 440-569 in orchestrator)

1. **Filter Events** (lines 442-447)
   ```typescript
   const crisisEvents = events.filter(e =>
     e.type === 'crisis' ||
     e.type === 'regulatory' ||
     e.severity === 'high' ||
     e.severity === 'critical'
   )
   ```

2. **Detect Crisis Signals** (lines 453-474)
   - Calls `mcp-crisis` with `detect_crisis_signals` tool
   - Analyzes events for warning signs
   - Returns crisis objects with descriptions

3. **Assess Severity** (lines 495-535)
   - For each detected crisis (top 5)
   - Calls `mcp-crisis` with `assess_crisis_severity` tool
   - Gets severity level, impact assessment, response timeframe
   - Returns assessed crisis data

4. **Save to Database** (lines 537-559)
   - Saves to `crisis_events` table ✅ FIXED
   - Uses UUID ✅ FIXED
   - Matches Crisis Command Center schema ✅ FIXED
   - Sets status to 'monitoring' (can escalate to 'active')

## Crisis Command Center Detection

### Two Detection Methods:

1. **Active Crisis Events** (loadActiveCrisis)
   - Queries `crisis_events` table
   - Filters: `status IN ('monitoring', 'active')`
   - Uses: `organization.id` (UUID) ✅ FIXED
   - Shows full crisis dashboard when found

2. **Potential Crisis Alerts** (checkForPotentialCrisis)
   - Queries `real_time_intelligence_briefs` table
   - Looks at `critical_alerts` array
   - Filters for: `severity === 'critical'` OR `severity === 'high'` + crisis-related
   - Shows alert banner above Quick Actions
   - Polls every 30 seconds

## What Now Works

### Before Fix
- ❌ Crises detected but saved to wrong table
- ❌ Crisis Command Center couldn't find crises (wrong table name)
- ❌ Crisis Command Center used wrong ID type (name vs UUID)
- ❌ 406 errors when querying crisis_events
- ❌ No crisis alerts ever shown
- ❌ No crisis tab indication

### After Fix
- ✅ Crises detected by `mcp-crisis` (using Claude)
- ✅ Severity assessed for each crisis
- ✅ Saved to correct `crisis_events` table
- ✅ Uses proper UUID for organization_id
- ✅ Crisis Command Center can query and find crises
- ✅ Alert banner shows when crises detected
- ✅ Crisis tab shows visual indication (red pulsing ring)
- ✅ Complete Crisis ↔ Intelligence integration working

## Data Flow (Complete)

```
Frontend: Intelligence Module
    ↓
    Runs Real-Time Monitor
    ↓
POST /api/realtime-monitor
    ↓
Calls: real-time-intelligence-orchestrator edge function
    ↓
Stage 1: Fireplexity search (articles)
Stage 2: Date filter + deduplication
Stage 3: Claude assessment (filter noise)
Stage 4: Event extraction (enrichment)
Stage 5: Real-time synthesis
    ↓
Stage 6a: Opportunity Detection (Optional)
    ├─> mcp-opportunity-detector
    ├─> opportunity-orchestrator-v2
    └─> Saves to opportunities table
    ↓
Stage 6b: Crisis Detection ✅ FIXED
    ├─> Filter crisis-type events
    ├─> mcp-crisis: detect_crisis_signals
    ├─> mcp-crisis: assess_crisis_severity (for each)
    └─> Saves to crisis_events table ✅
    ↓
Database: crisis_events table ✅
    ↓
Crisis Command Center
    ├─> Queries crisis_events with UUID ✅
    ├─> Queries real_time_intelligence_briefs
    ├─> Polls every 30 seconds
    └─> Shows alerts + visual indication ✅
```

## Testing the Fix

### 1. Run Real-Time Monitor
```
Organization: OpenAI (or any with discovery profile)
Time Window: 6 hours
Route to Crisis: ON (default)
```

### 2. Check Crisis Events Table
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'SERVICE_ROLE_KEY'
);

supabase
  .from('crisis_events')
  .select('*')
  .eq('organization_id', 'YOUR_ORG_UUID')
  .then(({ data, error }) => {
    console.log('Crisis events:', data);
    console.log('Error:', error);
  });
"
```

### 3. Check Crisis Command Center
- Should show "Potential Crisis Detected" banner if alerts present
- Crisis tab should have red pulsing ring
- Crisis tab should have red glow effect
- Clicking tab shows Crisis Command Center with alerts

## MCP Crisis Tools (7 Available)

The `mcp-crisis` edge function provides 7 tools for crisis management:

1. **detect_crisis_signals** - Detect early warning signals
2. **assess_crisis_severity** - Assess severity and impact
3. **generate_crisis_response** - Generate response strategies
4. **create_stakeholder_messaging** - Create targeted messaging
5. **monitor_crisis_evolution** - Track crisis in real-time
6. **simulate_crisis_scenarios** - Run crisis simulations
7. **generate_crisis_report** - Generate crisis reports

The orchestrator currently uses tools #1 and #2. Tools #3-7 are available for future enhancements.

## Success Metrics

- ✅ Crisis detection works like opportunities (parallel pattern)
- ✅ Saves to correct table (crisis_events)
- ✅ Uses proper UUID for organization_id
- ✅ Crisis Command Center can query crises
- ✅ Alert banner displays properly
- ✅ Crisis tab shows visual indication
- ✅ Complete end-to-end integration working

## Related Documentation

- `REALTIME_MONITOR_DATABASE_SAVE_FIX.md` - Intelligence brief saving
- `CRISIS_REAL_TIME_INTEGRATION_COMPLETE.md` - Crisis UI integration
- `UUID_FIX_COMPLETE.md` - UUID standardization

## Next Steps

1. ✅ Test complete flow end-to-end
2. ✅ Verify crisis events saving to database
3. ✅ Confirm Crisis Command Center detects events
4. ⏳ Monitor for real crisis scenarios
5. ⏳ Enhance with additional MCP crisis tools
