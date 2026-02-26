# Intelligence Tab Objectives & Data Flow

## Tab Objectives

### 1. Executive Overview Tab
**Purpose**: High-level strategic summary for executives
**Should Display**:
- Executive summary text (1-2 paragraphs synthesizing the situation)
- Key insights (3-5 bullet points of most important findings)
- Critical alerts (urgent items requiring immediate attention)
- Recommended actions (prioritized next steps)

**Data Structure Expected**:
```javascript
{
  executive_summary: "string - the actual summary text",
  key_insights: ["array of insight strings or objects"],
  critical_alerts: ["array of alerts"],
  recommended_actions: ["array of actions"]
}
```

### 2. Competition Tab
**Purpose**: Competitive landscape analysis
**Should Display**:
- Competitive landscape summary
- Competitor profiles (with threat levels, recent activity)
- Competitive opportunities
- Strategic positioning

**Data Structure Expected**:
```javascript
{
  competitive_landscape: {
    summary: "overview text",
    competitor_profiles: {
      "CompanyName": {
        threat_level: "high/medium/low",
        latest_developments: [],
        opportunities: []
      }
    }
  }
}
```

### 3. Stakeholders Tab
**Purpose**: Stakeholder sentiment and engagement priorities
**Should Display**:
- Key stakeholder groups
- Sentiment analysis per group
- Concerns and priorities
- Engagement recommendations

### 4. Topics & Trends Tab
**Purpose**: Media narratives and trending topics
**Should Display**:
- Trending topics in the industry
- Media coverage analysis
- Key narratives
- Content opportunities

### 5. Predictions Tab
**Purpose**: Forward-looking analysis
**Should Display**:
- Likely future scenarios
- Emerging trends
- Risk cascade analysis
- Timeline of expected events

## Current Problems

1. **Orchestrator** creates executive_summary but doesn't use Claude's synthesis:
   - It just puts basic stats instead of actual analysis
   - The synthesized content is stored but not properly extracted

2. **Frontend transformation** expects wrong structure:
   - It's looking for nested objects when it should look for direct fields
   - The overview tab gets an object instead of the expected structure

3. **Display component** can't find the data:
   - It looks for `executive_summary` as a string but gets an object
   - Falls back to "No executive summary available"

## Solution Approach

1. Fix orchestrator to properly extract and use the synthesized analysis
2. Ensure each tab gets properly formatted data
3. Make the data flow clear and consistent throughout the chain