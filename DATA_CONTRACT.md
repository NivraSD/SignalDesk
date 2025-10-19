# SignalDesk Data Contract

## What Each Tab MUST Receive

### 1. Overview Tab
```javascript
{
  executive_summary: "STRING - The actual summary text",
  key_insights: ["array", "of", "insight", "strings"],
  critical_alerts: ["array", "of", "alerts"],
  recommended_actions: ["array", "of", "actions"]
}
```

### 2. Competition Tab  
```javascript
{
  competitive_landscape: {
    summary: "STRING - Competitive landscape overview",
    competitor_profiles: {
      "CompanyName": {
        threat_level: "high/medium/low",
        market_position: { position: "leader/challenger/follower" },
        latest_developments: [],
        opportunities: []
      }
    },
    opportunities: []
  }
}
```

### 3. Stakeholders Tab
```javascript
{
  groups: ["investors", "customers", "employees", "media", "regulators"],
  sentiment: {
    "investors": { sentiment: "positive/neutral/negative", concerns: [] },
    "customers": { sentiment: "positive/neutral/negative", concerns: [] }
  },
  concerns: [],
  communications: []
}
```

### 4. Topics Tab
```javascript
{
  trending_topics: [],
  media_coverage: [],
  sentiment_analysis: {},
  key_narratives: []
}
```

### 5. Predictions Tab
```javascript
{
  trends: [],
  scenarios: [],
  timeline: [],
  confidence: {}
}
```

## Current Problem

The orchestrator returns data but it gets transformed MULTIPLE times:
1. Orchestrator Edge Function → returns raw intelligence
2. intelligenceOrchestratorService → transforms to insights/tabIntelligence
3. claudeIntelligenceServiceV2 → transforms AGAIN
4. Display component → expects specific structure

Each transformation layer is breaking the data structure!

## Solution

Create a SINGLE transformation function that ensures correct format for ALL tabs.