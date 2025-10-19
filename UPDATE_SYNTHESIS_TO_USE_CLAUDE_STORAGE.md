# Update Synthesis Stage to Use Claude Analysis Storage

## The Problem
Currently, the synthesis stage is getting fallback data because the rich Claude analyses from each stage are not being properly passed through. Each stage has its own Claude personality that generates rich insights, but these are getting lost.

## The Solution
Create a separate storage facility just for Claude analyses that:
1. Each stage stores its Claude analysis after generation
2. The synthesis stage retrieves ALL Claude analyses before running
3. Claude synthesis gets the FULL rich analyses, not basic data

## Implementation Steps

### 1. Update Each Stage Function (stages 1-4)
Add this code after Claude analysis completes:

```typescript
// At the top of each stage function, extract or generate request_id
const requestId = requestData.request_id || `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// After Claude analysis (look for "analyzeWithClaude..." calls)
const claudeAnalysis = await analyzeWithClaudeCompetitive(
  organization,
  monitoringData,
  basicFallback
);

// Store the Claude analysis separately
if (claudeAnalysis) {
  try {
    await fetch(
      'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/claude-analysis-storage',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || ''
        },
        body: JSON.stringify({
          action: 'store',
          organization_name: organization.name,
          stage_name: 'competitive', // Change for each stage: 'media', 'regulatory', 'trends'
          claude_analysis: claudeAnalysis,
          request_id: requestId
        })
      }
    );
    console.log('🧠 Claude analysis stored separately for synthesis');
  } catch (e) {
    console.error('Could not store Claude analysis:', e);
  }
}

// IMPORTANT: Pass request_id in the response
return new Response(JSON.stringify({
  success: true,
  data: results,
  request_id: requestId, // Pass this to next stage!
  // ... rest of response
}));
```

### 2. Update Synthesis Stage (stage 5)

```typescript
// At the beginning of synthesis stage, retrieve ALL Claude analyses
const requestId = requestData.request_id;

let allClaudeAnalyses = {};
if (requestId) {
  try {
    const analysisResponse = await fetch(
      'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/claude-analysis-storage',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || ''
        },
        body: JSON.stringify({
          action: 'retrieve',
          organization_name: organization.name,
          request_id: requestId
        })
      }
    );
    
    const analysisData = await analysisResponse.json();
    if (analysisData.success) {
      allClaudeAnalyses = analysisData.analyses;
      console.log('🧠 Retrieved Claude analyses for stages:', Object.keys(allClaudeAnalyses));
    }
  } catch (e) {
    console.error('Could not retrieve Claude analyses:', e);
  }
}

// Now pass the FULL Claude analyses to synthesis
const enrichedData = {
  ...normalizedData,
  // Add the complete Claude analyses from each stage
  fullClaudeAnalyses: {
    competitive: allClaudeAnalyses.competitive || previousResults?.competitive,
    media: allClaudeAnalyses.media || previousResults?.media,
    regulatory: allClaudeAnalyses.regulatory || previousResults?.regulatory,
    trends: allClaudeAnalyses.trends || previousResults?.trends
  }
};

// Pass enriched data to Claude synthesis
claudeAnalysis = await analyzeWithClaudeSynthesis(
  organization,
  enrichedData,  // This now has ALL the rich Claude analyses!
  previousResults,
  null
);
```

### 3. Update Frontend to Generate and Pass request_id

```javascript
// In intelligenceOrchestratorV4.js or wherever the pipeline starts
const requestId = `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Pass request_id to first stage
const stage1Response = await fetch(stageUrl, {
  method: 'POST',
  body: JSON.stringify({
    ...existingPayload,
    request_id: requestId
  })
});

// Extract and pass to next stage
const stage1Data = await stage1Response.json();
const stage2Response = await fetch(stage2Url, {
  method: 'POST',
  body: JSON.stringify({
    ...stage2Payload,
    request_id: stage1Data.request_id || requestId
  })
});
```

## Benefits
1. **Rich Claude insights preserved** - Each stage's Claude analysis is stored completely
2. **No data loss** - Separate storage ensures analyses aren't overwritten or lost
3. **Better synthesis** - Final Claude gets ALL the detailed analyses, not summaries
4. **Debugging** - Can inspect what each Claude personality generated
5. **Caching** - Can reuse Claude analyses if pipeline is re-run

## Files to Update
1. `/supabase/functions/intelligence-stage-1-competitors/index.ts`
2. `/supabase/functions/intelligence-stage-2-media/index.ts`
3. `/supabase/functions/intelligence-stage-3-regulatory/index.ts`
4. `/supabase/functions/intelligence-stage-4-trends/index.ts`
5. `/supabase/functions/intelligence-stage-5-synthesis/index.ts`
6. `/frontend/src/services/intelligenceOrchestratorV4.js`

## Testing
1. Run a full pipeline with all stages
2. Check the claude_analyses table to see stored analyses
3. Verify synthesis is getting rich data (claude_enhanced: true)
4. Confirm opportunities and insights are specific, not generic