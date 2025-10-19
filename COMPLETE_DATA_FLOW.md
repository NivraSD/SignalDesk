# Complete SignalDesk Data Flow Analysis

## Current Architecture (What Actually Happens)

### 1. USER CLICKS "Analyze" in IntelligenceHub
```javascript
// IntelligenceDisplayV2.js
fetchIntelligence() -> claudeIntelligenceServiceV2.gatherAndAnalyze(config, timeframe)
```

### 2. CLAUDE SERVICE DECIDES: Orchestrator or Multi-Step?
```javascript
// claudeIntelligenceServiceV2.js
const useOrchestrator = localStorage.getItem('signaldesk_use_orchestrator') !== 'false'

if (useOrchestrator) {
  -> intelligenceOrchestratorService.orchestrateIntelligence()
     -> Calls Edge Function: intelligence-orchestrator
} else {
  -> Multi-step flow with personas
}
```

### 3A. ORCHESTRATOR PATH (Current Default)
```
intelligence-orchestrator Edge Function:
  Phase 1: intelligent-discovery -> {competitors, keywords, industry}
  Phase 2: source-mapper -> {sources to query}
  Phase 3: Parallel gathering:
    - news-intelligence -> {articles, trends, alerts}
    - web-scraper -> {website content}
    - reddit-intelligence -> {discussions}
  Phase 4: claude-intelligence-synthesizer-v2 -> {analysis}
  
  Returns: {
    intelligence: {
      synthesized: {?}, // What does Claude actually return?
      executive_summary: {?}, // What format?
      key_insights: [],
      competitors: [],
      ...
    }
  }
```

### 3B. MULTI-STEP PATH (When Orchestrator Disabled)
```
Multiple separate calls to different personas
Each returns specific analysis
Combined into final result
```

### 4. FRONTEND TRANSFORMATION
```javascript
// intelligenceOrchestratorService.js
_processOrchestrationResult() {
  // Extracts insights for tabs
  insights: {
    overview: _extractOverviewInsights(),
    competitive: _extractCompetitiveInsights(),
    ...
  }
}

// claudeIntelligenceServiceV2.js  
transformOrchestratedResult() {
  // Another transformation layer!
  // Creates overview, competition, stakeholders, topics, predictions
}

// Returns to IntelligenceDisplayV2
```

### 5. DISPLAY COMPONENT
```javascript
// IntelligenceDisplayV2.js
renderOverviewTab(data) {
  // Expects: data.executive_summary as STRING
  // Gets: ??? (seems to be getting wrong structure)
}
```

## PROBLEMS IDENTIFIED

### Problem 1: Multiple Transformation Layers
- orchestratorService transforms once
- claudeIntelligenceServiceV2 transforms again
- Each transformation expects different input/output

### Problem 2: Unclear Synthesizer Output
- What does claude-intelligence-synthesizer-v2 ACTUALLY return?
- Is it returning JSON or text?
- What's the structure of synthesisResult.analysis?

### Problem 3: Executive Summary Format Confusion
- Sometimes it's a string
- Sometimes it's an object {organization, total_articles, ...}
- Display expects string, but gets object

### Problem 4: Tab Data Mismatch
- Display expects: overview, competition, stakeholders, topics, predictions
- Service provides: Different names and structures
- No clear mapping between service data and display expectations

## WHAT SHOULD HAPPEN (Ideal Flow)

### Step 1: Orchestrator Gathers Data
- Returns raw intelligence data from all sources

### Step 2: Synthesizer Creates Analysis
- Should return STRUCTURED data for each tab:
```javascript
{
  overview: {
    executive_summary: "Text summary here",
    key_insights: ["insight 1", "insight 2"],
    critical_alerts: ["alert 1"],
    recommended_actions: ["action 1"]
  },
  competition: {
    landscape_summary: "Text",
    competitor_profiles: {...}
  },
  stakeholders: {...},
  topics: {...},
  predictions: {...}
}
```

### Step 3: Frontend Passes Through
- NO TRANSFORMATION needed if synthesizer returns correct format
- Just pass through to display

### Step 4: Display Shows Data
- Each tab gets its expected structure directly

## NEXT STEPS

1. Check what synthesizer ACTUALLY returns (add logging)
2. Make synthesizer return the RIGHT format for display
3. Remove unnecessary transformations
4. Test end-to-end