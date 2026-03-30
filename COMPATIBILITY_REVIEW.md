# Frontend-Backend Compatibility Review

**Date: August 29, 2025**
**Status: IN PROGRESS**

## Executive Summary

Comprehensive review of data flow compatibility between frontend (React/Vercel) and backend (Supabase Edge Functions) for the SignalDesk Intelligence Pipeline.

## Stage-by-Stage Analysis

### Stage 1: Organization Data Extraction (intelligence-discovery-v3)

**Frontend Sends:**

```javascript
// From intelligenceOrchestratorV4.js (lines 163-196)
{
  organization: Object,
  entities: {
    competitors: Array,
    regulators: Array,
    activists: Array,
    media_outlets: Array,
    investors: Array,
    analysts: Array
  }
}
```

**Backend Expects:**

```typescript
// From intelligence-discovery-v3/index.ts
{
  organization: string | Object,
  organizationInfo?: Object
}
```

**ISSUE #1:** Frontend sends `entities` but backend expects `organizationInfo`
**IMPACT:** Entities data not being used in discovery

---

### Stage 2: Competitive Intelligence (intelligence-stage-1-competitors)

**Frontend Sends:**

```javascript
// From intelligenceOrchestratorV4.js (line 183)
{
  organization: Object,
  entities: Object,
  monitoringData: Object  // <-- WRONG PROPERTY NAME
}
```

**Backend Expects:**

```typescript
// From intelligence-stage-1-competitors/index.ts (line 34-43)
{
  organization: Object,
  competitors: Array,
  competitorsNested: Object,
  stakeholders: Object,
  fullProfile: Object,
  savedProfile: Object,
  dataVersion: string,
  previousResults: Object,
  intelligence: Object  // <-- EXPECTS 'intelligence' not 'monitoringData'
}
```

**ISSUE #2:** Frontend sends `monitoringData` but backend expects `intelligence`
**ISSUE #3:** Frontend doesn't pass `competitors`, `fullProfile`, etc.
**IMPACT:** Monitoring data not being passed, competitors returning "0"

---

### Stage 3: Stakeholder Analysis (intelligence-stage-2-media)

**Frontend Sends:**

```javascript
{
  organization: Object,
  entities: Object,
  monitoringData: Object  // <-- WRONG
}
```

**Backend Expects:**

```typescript
// From intelligence-stage-2-media/index.ts (line 20)
{
  organization: Object,
  previousResults: Object,
  intelligence: Object  // <-- EXPECTS 'intelligence'
}
```

**ISSUE #4:** Same property name mismatch
**ISSUE #5:** Frontend doesn't pass `previousResults`
**IMPACT:** Stakeholder analysis gets no data

---

### Stage 4: Media Landscape (intelligence-stage-2-media)

**Note:** Uses same endpoint as Stage 3
**ISSUE #6:** Same issues as Stage 3

---

### Stage 5: Regulatory Environment (intelligence-stage-3-regulatory)

**Frontend Sends:**

```javascript
{
  organization: Object,
  entities: Object,
  monitoringData: Object  // <-- WRONG
}
```

**Backend Expects:**

```typescript
// From intelligence-stage-3-regulatory/index.ts (line 18)
{
  organization: Object,
  regulators: Array,
  analysts: Array,
  investors: Array,
  previousResults: Object,
  intelligence: Object  // <-- EXPECTS 'intelligence'
}
```

**ISSUE #7:** Property name mismatch
**ISSUE #8:** Frontend sends `entities` object but backend expects individual arrays
**IMPACT:** 500 error (now fixed) but still no data flow

---

### Stage 6: Trends Analysis (intelligence-stage-4-trends)

**Frontend Sends:**

```javascript
{
  organization: Object,
  entities: Object,
  monitoringData: Object  // <-- WRONG
}
```

**Backend Expects:**

```typescript
// From intelligence-stage-4-trends/index.ts (line 16)
{
  organization: Object,
  previousResults: Object,
  intelligence: Object  // <-- EXPECTS 'intelligence'
}
```

**ISSUE #9:** Same issues as above

---

### Stage 7: Synthesis (intelligence-stage-5-synthesis)

**Frontend Sends:**

```javascript
// From intelligenceOrchestratorV4.js (lines 134-144)
{
  organization: Object,
  previousResults: Object,  // ✅ CORRECT
  stage1: Object,
  stage2: Object,
  stage3: Object,
  stage4: Object,
  monitoring: Object  // ✅ CORRECT NAME
}
```

**Backend Expects:**

```typescript
// From intelligence-stage-5-synthesis/index.ts (lines 17-27)
{
  organization: Object,      // ✅ MATCH
  previousResults: Object,   // ✅ MATCH
  fullProfile: Object,       // ❌ NOT SENT
  dataVersion: string,       // ❌ NOT SENT
  stage1: Object,           // ✅ MATCH
  stage2: Object,           // ✅ MATCH
  stage3: Object,           // ✅ MATCH
  stage4: Object,           // ✅ MATCH
  monitoring: Object        // ✅ MATCH
}
```

**ISSUE #10:** Frontend doesn't send `fullProfile` and `dataVersion`
**NOTE:** Synthesis stage is mostly compatible!

---

## Data Flow Issues Summary

### Critical Issues:

1. **Property Name Mismatch**: Frontend sends `monitoringData` but backend expects `intelligence`
2. **Missing Previous Results**: Most stages expect `previousResults` but frontend doesn't pass it
3. **Entities Structure**: Frontend wraps in `entities` object, backend expects flat arrays
4. **Missing Competitor Data**: Frontend doesn't pass competitors array separately

### Data Propagation Issues:

- Intelligence data from Stage 1 (extraction) is not properly passed to subsequent stages
- Each stage result should include `intelligence` property to pass through
- Frontend should accumulate and pass `previousResults` to each stage

## Frontend Code Issues

### intelligenceOrchestratorV4.js

**Line 183:**

```javascript
requestBody.monitoringData = previousStageResults.extraction.intelligence;
```

**Should be:**

```javascript
requestBody.intelligence = previousStageResults.extraction.intelligence;
```

**Lines 164-173:** Entities structure doesn't match backend expectations
**Lines 176-188:** Missing logic to pass previousResults to stages 2-6

### MultiStageIntelligence.js

Need to check how it calls orchestrator and passes data between stages

## Backend Response Issues

### All Stage Functions Should Return:

```javascript
{
  success: true,
  stage: 'stage_name',
  data: Object,
  intelligence: Object  // <-- Pass through for next stage
}
```

Currently some stages return `intelligence` but it's not consistent.

## Compatibility Matrix

| Stage         | Frontend Property | Backend Expects    | Status       | Impact              |
| ------------- | ----------------- | ------------------ | ------------ | ------------------- |
| 1-Extraction  | `entities`        | `organizationInfo` | ❌ Mismatch  | Entities not used   |
| 2-Competitive | `monitoringData`  | `intelligence`     | ❌ Mismatch  | No data flow        |
| 2-Competitive | `entities`        | `competitors[]`    | ❌ Structure | Missing competitors |
| 3-Stakeholder | `monitoringData`  | `intelligence`     | ❌ Mismatch  | No data flow        |
| 3-Stakeholder | -                 | `previousResults`  | ❌ Missing   | No context          |
| 4-Media       | `monitoringData`  | `intelligence`     | ❌ Mismatch  | No data flow        |
| 5-Regulatory  | `monitoringData`  | `intelligence`     | ❌ Mismatch  | 500 error (fixed)   |
| 5-Regulatory  | `entities`        | `regulators[]`     | ❌ Structure | No regulator data   |
| 6-Trends      | `monitoringData`  | `intelligence`     | ❌ Mismatch  | No data flow        |
| 7-Synthesis   | `monitoring`      | `monitoring`       | ✅ Match     | Working             |
| 7-Synthesis   | `previousResults` | `previousResults`  | ✅ Match     | Working             |

## Critical Fix Priority

### PRIORITY 1: Fix Property Name (intelligenceOrchestratorV4.js)

**File:** `src/services/intelligenceOrchestratorV4.js`
**Line 183:**

```javascript
// CURRENT (WRONG):
requestBody.monitoringData = previousStageResults.extraction.intelligence;

// FIXED:
requestBody.intelligence = previousStageResults.extraction?.intelligence || {};
```

### PRIORITY 2: Pass Previous Results (intelligenceOrchestratorV4.js)

**After Line 173, Add:**

```javascript
// Pass previous results for context
if (previousStageResults && Object.keys(previousStageResults).length > 0) {
  requestBody.previousResults = previousStageResults;
}
```

### PRIORITY 3: Flatten Entities Structure (intelligenceOrchestratorV4.js)

**Lines 164-173, Replace with:**

```javascript
const requestBody = {
  organization,
  // Flatten entities for backend compatibility
  competitors: config.competitors || organization.competitors || [],
  regulators: config.regulators || organization.regulators || [],
  activists: config.activists || organization.activists || [],
  media_outlets: config.media_outlets || organization.media_outlets || [],
  investors: config.investors || organization.investors || [],
  analysts: config.analysts || organization.analysts || [],
};
```

### PRIORITY 4: Ensure Intelligence Pass-through

**All backend stages should return:**

```javascript
return new Response(JSON.stringify({
  success: true,
  stage: 'stage_name',
  data: results,
  intelligence: monitoringData, // Pass through for next stage
  organization: organization    // Pass through organization
}), { ... });
```

## Recommended Complete Fix

### Frontend (intelligenceOrchestratorV4.js) - Lines 162-196

```javascript
// For other stages, pass config and any monitoring data
const requestBody = {
  organization,
  // Flatten entities for backend compatibility
  competitors: config.competitors || organization.competitors || [],
  regulators: config.regulators || organization.regulators || [],
  activists: config.activists || organization.activists || [],
  media_outlets: config.media_outlets || organization.media_outlets || [],
  investors: config.investors || organization.investors || [],
  analysts: config.analysts || organization.analysts || [],

  // Pass previous results for context
  previousResults: previousStageResults || {},

  // Pass intelligence data with correct property name
  intelligence: previousStageResults?.extraction?.intelligence || {},
};

// Remove the old monitoringData logic (lines 175-188)
console.log(`📊 Stage ${stageId} request:`, {
  hasIntelligence: !!requestBody.intelligence,
  hasPreviousResults: !!requestBody.previousResults,
  competitors: requestBody.competitors?.length || 0,
});
```

## Testing Plan

### Test 1: Individual Stage Testing

Create test HTML file to test each stage with correct data structure

### Test 2: Data Flow Verification

Monitor console logs for:

- Intelligence data propagation
- Previous results accumulation
- Competitor count at each stage

### Test 3: Full Pipeline Test

Run complete pipeline and verify:

- All stages complete
- Data flows between stages
- Final synthesis has all data

## Deployment Checklist

1. ✅ Backend functions updated with `intelligence` parameter support
2. ⬜ Frontend orchestrator fixed (property names, structure)
3. ⬜ Test locally with correct data flow
4. ⬜ Deploy frontend to Vercel
5. ⬜ Verify in production

## Expected Outcome After Fixes

- Stage 2 (Competitive) will show actual competitor count instead of "0"
- Stage 3 (Stakeholder) will have monitoring data and show stakeholders
- Stage 5 (Regulatory) will not throw 500 error (already fixed)
- All stages will have access to monitoring data from extraction
- Synthesis will have complete data from all stages

Main Problems:

1. Property Name Mismatch (CRITICAL):


    - Frontend sends monitoringData but backend expects intelligence
    - This breaks data flow to ALL stages 2-6
    - Result: Stages get no data → return "0" results

2. Intelligence Hub Display Issues:


    - Stages 2-4 return data in data property
    - Intelligence Hub expects tabs property
    - Result: Hub shows empty/fallback content

3. Missing Context Between Stages:


    - previousResults not being passed
    - Each stage runs in isolation
    - Result: No data accumulation

Why You're Seeing "0" in the Platform:

The chain is broken at multiple points:

1. Monitoring data doesn't reach stages 2-6 (property mismatch)
2. Stages return minimal results without data
3. Synthesis gets limited input → generates few/no opportunities
4. UI falls back to mock data or shows "0"

Required Fixes Before Deployment:

Frontend (intelligenceOrchestratorV4.js):

1. Change monitoringData to intelligence (line 183)
2. Add previousResults to request body
3. Flatten entities structure

Backend (optional but recommended):

- Add tabs property to stage responses for UI display

Files to Review:

- /COMPATIBILITY_REVIEW.md - Complete frontend-backend compatibility matrix
- /UI_DATA_FLOW_REVIEW.md - UI component data flow analysis

Without these fixes, the platform will continue showing "0" results even though the backend is collecting data successfully.
