# Pipeline Fix Analysis - Synthesis & Opportunity Detection Failures

## The Problem

**Symptoms:**
- mcp-executive-synthesis failing
- mcp-opportunity-detector returning 0 opportunities
- Pipeline runs but synthesis doesn't display
- Opportunities engine empty

**Root Cause:**
Frontend was passing RAW enrichment data to synthesis/opportunity detector instead of properly formatted data.

## How It Used To Work (intelligence-orchestrator-v2)

### Flow:
```
Frontend
  ↓
Enrichment (monitoring-stage-2-enrichment)
  ↓
intelligence-orchestrator-v2
  ├─ Reformats enrichment data (lines 456-480)
  ├─ Calls mcp-executive-synthesis (with formatted data)
  └─ Calls mcp-opportunity-detector (with formatted data)
  ↓
Returns to frontend
```

### Data Formatting (orchestrator-v2 lines 456-480):
```typescript
const enrichedDataForSynthesis = {
  enriched_articles: enrichedData.enriched_articles || enrichedData.articles || [],
  knowledge_graph: enrichedData.knowledge_graph || {},
  executive_summary: enrichedData.executive_summary || {},
  organized_intelligence: enrichedData.organized_intelligence || {},  // ← CRITICAL
  extracted_data: enrichedData.extracted_data,
  statistics: enrichedData.statistics,
  profile: enrichedData.profile || profile,
  monitoring_data: {
    total_articles: articleCount,
    articles_processed: enrichedData.articles_processed || 0,
    deep_analyzed: enrichedData.statistics?.deep_analyzed || 0,
    events_extracted: eventCount,
    entities_found: entityCount,
    topics_found: topicCount
  }
}
```

**Why it was removed:** Timeouts (orchestrator was doing too much in one function)

## How It Broke (frontend direct calls)

### Flow:
```
Frontend
  ↓
Enrichment
  ↓
Frontend calls mcp-executive-synthesis directly
  ↓ (passes enrichmentResponse.data RAW) ← PROBLEM
Synthesis fails or generates bad output
  ↓
Frontend calls mcp-opportunity-detector directly
  ↓ (passes enrichmentResponse.data RAW) ← PROBLEM
Detector returns 0 opportunities
```

### What Was Wrong:
```typescript
// BEFORE FIX - intelligenceService.ts line 125
const synthesisResponse = await supabase.functions.invoke('mcp-executive-synthesis', {
  body: {
    method: 'tools/call',
    params: {
      name: 'synthesize_executive_intelligence',
      arguments: {
        enriched_data: enrichmentResponse.data,  // ❌ RAW DATA
        // ...
      }
    }
  }
})
```

**Why it failed:**
1. Synthesis expects `organized_intelligence` and other formatted fields
2. Raw enrichment response has different structure
3. Missing fields cause synthesis to fail or generate empty output

## My Fix (frontend formatting)

### Flow:
```
Frontend
  ↓
Enrichment
  ↓
Frontend formats data (copying orchestrator-v2 logic)
  ↓
Frontend calls mcp-executive-synthesis
  ↓ (passes FORMATTED data) ← FIXED
Synthesis works
  ↓
Frontend calls mcp-opportunity-detector
  ↓ (passes FORMATTED data) ← FIXED
Detector works
```

### Code Changes (intelligenceService.ts lines 121-142):
```typescript
// STEP 2: Format enriched data like orchestrator-v2 does
const enrichedDataForSynthesis = {
  enriched_articles: enrichmentResponse.data.enriched_articles || enrichmentResponse.data.articles || [],
  knowledge_graph: enrichmentResponse.data.knowledge_graph || {},
  executive_summary: enrichmentResponse.data.executive_summary || {},
  organized_intelligence: enrichmentResponse.data.organized_intelligence || {},  // ✓ INCLUDED
  extracted_data: enrichmentResponse.data.extracted_data,
  statistics: enrichmentResponse.data.statistics,
  profile: enrichmentResponse.data.profile || data.profile,
  monitoring_data: {
    total_articles: enrichmentResponse.data.enriched_articles?.length || 0,
    articles_processed: enrichmentResponse.data.articles_processed || 0,
    deep_analyzed: enrichmentResponse.data.statistics?.deep_analyzed || 0
  }
}

// STEP 3: Call synthesis with formatted data
const synthesisResponse = await supabase.functions.invoke('mcp-executive-synthesis', {
  body: {
    method: 'tools/call',
    params: {
      name: 'synthesize_executive_intelligence',
      arguments: {
        enriched_data: enrichedDataForSynthesis,  // ✓ FORMATTED DATA
        synthesis_focus: 'all_consolidated'
      }
    }
  }
})

// STEP 4: Call opportunity detector with formatted data
const opportunityDetectorResponse = await supabase.functions.invoke('mcp-opportunity-detector', {
  body: {
    organization_id: organizationId,
    organization_name: orgName,
    enriched_data: enrichedDataForSynthesis,  // ✓ FORMATTED DATA
    executive_synthesis: synthesisResponse.data,
    profile: data.profile
  }
})
```

## Verification Checklist

### ✓ Structure Match
- [x] enriched_articles: matches orchestrator
- [x] knowledge_graph: matches orchestrator
- [x] executive_summary: matches orchestrator
- [x] organized_intelligence: matches orchestrator (CRITICAL)
- [x] extracted_data: matches orchestrator
- [x] statistics: matches orchestrator
- [x] profile: matches orchestrator
- [x] monitoring_data: similar (missing some counts but not critical)

### ✓ Data Flow
- [x] Format data after enrichment
- [x] Pass formatted data to synthesis
- [x] Pass formatted data to opportunity detector
- [x] Unwrap MCP response from synthesis
- [x] Return synthesis and opportunities to frontend

### Potential Issues to Check

1. **monitoring_data counts:** Orchestrator calculates eventCount, entityCount, topicCount. I'm not including those in monitoring_data.
   - **Impact:** Low - synthesis doesn't use monitoring_data for analysis, only for metadata
   - **Verification needed:** Check if synthesis logs show missing data

2. **Profile propagation:** Using `data.profile` vs orchestrator's `profile` variable
   - **Impact:** Low - should be same data
   - **Verification needed:** Check logs show profile is present

3. **MCP unwrapping:** Added unwrapping logic for synthesis response
   - **Impact:** Critical - without this, synthesis stays wrapped
   - **Verification needed:** Check synthesisData.synthesis exists

## Test Plan

1. Run pipeline for Tesla
2. Check browser console for:
   ```
   📤 Formatted enriched data for synthesis:
     has_organized_intelligence: true
     organized_events: [number] > 0
   ```
3. Check synthesis completes without errors
4. Check synthesis displays in UI
5. Check opportunities are detected (> 0)
6. Check opportunities display in engine

## What Could Still Be Wrong

1. **Enrichment not returning organized_intelligence**
   - If enrichment doesn't create this field, synthesis will fail
   - Check: enrichment logs should show organized_intelligence being created

2. **Synthesis receiving data but Claude failing**
   - Data structure correct but Claude API failing
   - Check: synthesis logs should show Claude call succeeding

3. **Opportunity detector receiving data but Claude failing**
   - Data structure correct but Claude API failing
   - Check: opportunity detector logs should show Claude call succeeding

4. **MCP unwrapping failing**
   - synthesis.data.content[0].text exists but JSON.parse fails
   - Check: logs should show "✅ MCP format unwrapped successfully"
