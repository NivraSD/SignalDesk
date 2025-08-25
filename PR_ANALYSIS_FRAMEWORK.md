# Elite PR Analysis Framework

## The Problem
- 60-second timeout limit on Supabase Edge Functions
- Currently doing shallow processing (just titles/descriptions)
- Not making strategic connections
- Missing deep analysis

## The Solution: Distributed Analysis Architecture

### Phase 1: Fast Collection (Edge Function - 10s)
**intelligence-gathering-v3**
- Collect raw signals from RSS/Firecrawl/APIs
- Basic categorization by entity
- Return immediately with raw data
- NO analysis here

### Phase 2: Deep Analysis (MCP Server - No timeout)
**signaldesk-analyst MCP**
```javascript
// Runs locally, no timeout constraints
async function analyzeSignals(rawIntelligence) {
  const analysis = {
    micro: analyzeMicroLevel(rawIntelligence),
    macro: analyzeMacroLevel(rawIntelligence),
    dynamics: analyzeMarketDynamics(rawIntelligence),
    implications: analyzeImplications(rawIntelligence),
    opportunities: identifyOpportunities(rawIntelligence),
    risks: identifyRisks(rawIntelligence)
  }
  return analysis
}
```

### Phase 3: Strategic Synthesis (Claude via MCP - No timeout)
**signaldesk-strategist MCP**
- Uses Claude API directly
- Applies PR strategic thinking
- Makes non-obvious connections
- Generates elite-level insights

## The PR Analysis Formula

### 1. SIGNAL ANALYSIS (What happened)
For each signal/news item:
```
{
  signal: "Competitor launched AI product",
  
  // Immediate Analysis
  direct_impact: "Market share threat",
  timing: "First mover advantage",
  magnitude: "High - category defining",
  
  // Context Mapping
  market_context: "AI arms race intensifying",
  competitive_position: "We're now behind",
  stakeholder_reaction: {
    customers: "Will question our innovation",
    investors: "May see us as lagging",
    media: "Story writes itself - David vs Goliath"
  }
}
```

### 2. PATTERN RECOGNITION (Connecting dots)
```
{
  patterns: [
    {
      type: "competitive_acceleration",
      signals: ["Competitor A launch", "Competitor B announcement", "VC funding round"],
      insight: "Industry consolidating around AI - 6 month window before market leaders established"
    },
    {
      type: "narrative_shift", 
      signals: ["Media coverage shifting", "Analyst reports", "Social sentiment"],
      insight: "Public narrative moving from 'AI potential' to 'AI delivery' - execution matters now"
    }
  ]
}
```

### 3. STAKEHOLDER IMPACT MATRIX
```
{
  customers: {
    perception_shift: "From leader to follower",
    behavior_change: "May delay purchases",
    messaging_need: "Reassurance about roadmap"
  },
  
  investors: {
    concern_level: "High",
    key_questions: ["What's our AI strategy?", "How quickly can we respond?"],
    proof_points_needed: ["Concrete timeline", "Differentiation strategy"]
  },
  
  media: {
    likely_angle: "Company falls behind in AI race",
    counter_narrative: "Quality over speed - our approach is more thoughtful",
    proactive_pitches: ["Our unique AI philosophy", "Customer success stories"]
  },
  
  employees: {
    morale_impact: "May question leadership",
    retention_risk: "Top talent may look elsewhere",
    internal_messaging: "Rally the troops - David vs Goliath"
  }
}
```

### 4. STRATEGIC IMPLICATIONS
```
{
  reputation: {
    risk_level: "Medium-High",
    trajectory: "Declining if no response",
    intervention_required: "Immediate"
  },
  
  market_position: {
    current: "Leader under threat",
    projected_6mo: "Challenger unless action taken",
    defendable_ground: "Customer trust, proven reliability"
  },
  
  narrative_control: {
    we_control: ["Customer success", "Our unique approach"],
    they_control: ["Innovation narrative", "Future vision"],
    battlegrounds: ["Practical AI vs Hype", "Real results vs promises"]
  }
}
```

### 5. RESPONSE STRATEGY
```
{
  immediate: {
    actions: ["CEO statement", "Customer communication"],
    messaging: "We're focused on what matters",
    channels: ["Earned media", "Owned channels"],
    timing: "Within 24 hours"
  },
  
  short_term: {
    actions: ["Product roadmap reveal", "Customer showcase"],
    messaging: "Our AI is already delivering value",
    proof_points: ["Case studies", "ROI data"],
    timeline: "Next 2 weeks"
  },
  
  long_term: {
    positioning: "The thoughtful AI leader",
    narrative: "We put customers first, not headlines",
    initiatives: ["Thought leadership campaign", "Strategic partnerships"],
    timeline: "Next quarter"
  }
}
```

## Implementation Architecture

### Option 1: MCP-Based Processing (Recommended)
```
Frontend -> Edge Function (collect) -> MCP Analyst (analyze) -> MCP Strategist (synthesize) -> Frontend
```

**Advantages:**
- No timeout issues
- Can use Claude directly
- Deep analysis possible
- Real-time processing

### Option 2: Async Processing with Webhooks
```
Frontend -> Edge Function (queue) -> Background Worker -> Webhook -> Frontend
```

**Advantages:**
- Scalable
- Can process large volumes
- No timeout constraints

### Option 3: Hybrid Approach
```
Quick Analysis: Edge Function (30s) -> Basic insights
Deep Analysis: MCP Server (no limit) -> Strategic insights
```

## The Elite PR Analysis Formula

### For Every Signal:
1. **What** - What literally happened?
2. **So What** - Why does this matter?
3. **Now What** - What should we do?

### Through These Lenses:
1. **Reputation Impact** - How does this affect how we're seen?
2. **Competitive Dynamics** - How does this change the game?
3. **Stakeholder Reactions** - How will each audience respond?
4. **Narrative Control** - What story will be told?
5. **Opportunity Cost** - What happens if we don't act?

### Resulting In:
1. **Risk Assessment** - What could go wrong?
2. **Opportunity Identification** - How can we win?
3. **Strategic Response** - What's our move?
4. **Messaging Framework** - What's our story?
5. **Action Plan** - What do we do now?

## Next Steps

1. **Create signaldesk-analyst MCP** for deep analysis
2. **Create signaldesk-strategist MCP** for Claude synthesis  
3. **Modify intelligence-gathering-v3** to just collect data
4. **Update frontend** to call MCP servers for analysis
5. **Test with real scenarios**