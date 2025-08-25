# SignalDesk Data Flow Architecture

## Complete Pipeline: Onboarding → Intelligence → Opportunities → Execution

### 1. ONBOARDING PHASE
**Purpose:** Collect organization profile and stakeholders  
**Components:** `OnboardingV3.js`

**Data Collected:**
```javascript
{
  organization: {
    name: "Company Name",
    industry: "Technology",
    description: "What we do"
  },
  stakeholders: {
    competitors: ["Competitor A", "Competitor B"],
    media_outlets: ["TechCrunch", "Forbes"],
    regulators: ["FTC", "SEC"],
    investors: ["VC Fund A"],
    analysts: ["Gartner", "Forrester"],
    activists: ["Privacy Group"]
  },
  monitoring_topics: ["AI safety", "data privacy"]
}
```

**Storage:** Saved to `localStorage` via `cacheManager.saveCompleteProfile()`

---

### 2. INTELLIGENCE HUB PHASE  
**Purpose:** Monitor stakeholders and gather intelligence
**Components:** `IntelligenceHubV5.js` → `intelligenceOrchestratorV3.js`

**Data Flow:**
1. **Loads Profile:** `cacheManager.getCompleteProfile()` 
2. **Calls Orchestrator:** `intelligenceOrchestratorV3.orchestrate(profile)`
3. **Orchestrator Phases:**

#### Phase 1: Discovery (intelligence-discovery-v3)
- **Input:** Organization + stakeholders from onboarding
- **Output:** Structured entities and topics to monitor
```javascript
{
  entities: {
    competitors: [...],
    media: [...],
    regulators: [...]
  },
  topics: ["AI safety", "privacy regulations"]
}
```

#### Phase 2: Gathering (intelligence-gathering-v3)
- **Input:** Entities from discovery
- **Output:** Raw intelligence data
```javascript
{
  entity_actions: {
    all: [
      {
        entity: "Competitor A",
        action: "Launched new AI product",
        type: "competitor",
        impact: "high",
        source: "TechCrunch"
      }
    ]
  },
  topic_trends: {
    all: [
      {
        topic: "AI safety",
        trend: "increasing",
        mentions: 45
      }
    ]
  }
}
```

#### Phase 3: Synthesis (intelligence-synthesis-v4)
- **Input:** Raw intelligence from gathering
- **Output:** Structured intelligence + opportunities
```javascript
{
  success: true,
  tabs: {
    executive: {
      headline: "5 competitor actions | 3 trending topics",
      competitive_highlight: "Competitor A launched AI product",
      market_highlight: "AI safety trending up",
      immediate_actions: ["Respond to competitor launch"]
    },
    competitive: {
      competitor_actions: [...],
      pr_strategy: "Position as innovation leader",
      key_messages: ["We pioneered this technology"]
    },
    market: {
      market_trends: [...],
      opportunities: [...]
    },
    regulatory: {...},
    media: {...},
    forward: {
      predictions: [...]
    }
  },
  opportunities: [
    {
      id: "opp-123",
      type: "competitive_response",
      title: "Counter Competitor A's AI launch",
      description: "Opportunity to showcase our superior technology",
      urgency: "critical",
      score: 95,
      action_plan: ["Draft response", "Media outreach"],
      pr_angle: "Industry leader responds"
    }
  ]
}
```

**Display:** IntelligenceHubV5 shows 5 tabs:
- Executive Summary
- Competitors 
- Stakeholders
- Trending Topics
- Cascade Predictions

---

### 3. OPPORTUNITY ENGINE PHASE
**Purpose:** Convert intelligence into actionable PR opportunities
**Components:** `OpportunityModulePR.js`

**Data Flow:**
1. **Receives from Intelligence Hub:** Full synthesis result with opportunities
2. **Processes Opportunities:** Maps to PR-specific actions
3. **Display Format:**
```javascript
{
  title: "Counter Competitor Launch",
  description: "Immediate response needed",
  urgency: "critical",
  impact: "high",
  timing: "Next 24 hours",
  action_items: ["Draft release", "Contact media"],
  metrics: {
    reach: "5M potential",
    sentiment: "Defensive to offensive"
  }
}
```

---

### 4. EXECUTION PHASE
**Purpose:** Execute PR campaigns based on opportunities
**Components:** `ExecutionModule.js`

**Actions:**
- Create campaign from opportunity
- Generate content with AI personas
- Track execution status
- Measure results

---

## Key Data Storage Points

### localStorage Keys (via cacheManager):
- `signaldesk_organization` - Organization basic info (persists)
- `signaldesk_complete_profile` - Full onboarding data (persists) 
- `signaldesk_last_synthesis` - Latest synthesis result (cleared on new search)
- `signaldesk_intelligence_cache` - Cached intelligence (cleared on new search)

### Cache Management:
- **New Search:** Clears all intelligence/synthesis but keeps organization/profile
- **Refresh:** Re-runs intelligence gathering with same profile

---

## MCPs and Edge Functions

### MCP Servers Available:
- `signaldesk-intelligence` - General intelligence gathering
- `signaldesk-opportunities` - Opportunity detection and scoring
- `signaldesk-orchestrator` - Workflow orchestration
- `signaldesk-media` - Media monitoring
- `signaldesk-market` - Market analysis
- `signaldesk-competitive` - Competitor tracking
- `signaldesk-regulatory` - Regulatory monitoring

### Supabase Edge Functions:
- `intelligence-discovery-v3` - Identifies entities to monitor
- `intelligence-gathering-v3` - Gathers real-time intelligence
- `intelligence-synthesis-v4` - Analyzes with Claude, creates opportunities
- `opportunity-detector-v3` - Additional opportunity detection
- `monitoring-intelligence-v3` - Continuous monitoring

### Claude Personas:
1. **Strategic PR Advisor** - High-level strategy
2. **Crisis Manager** - Risk mitigation
3. **Media Relations** - Press engagement
4. **Content Creator** - Messaging and content
5. **Analytics Expert** - Performance measurement

---

## Current Issues & Fixes Needed

### ✅ Working:
- Onboarding saves complete profile
- Discovery identifies stakeholders
- Gathering gets some real data
- Synthesis creates structured output with opportunities

### ❌ Issues to Fix:
1. **Data not displaying in all tabs** - IntelligenceHubV5 needs to properly process synthesis-v4 output
2. **Opportunities not loading** - Need to ensure synthesis opportunities are passed correctly
3. **Cache accumulation** - Old searches mixing with new ones
4. **Deployment lag** - Changes not appearing on live site immediately

### 🔧 Next Steps:
1. Verify each phase is passing data correctly
2. Ensure IntelligenceHubV5 processes synthesis-v4 structure
3. Test opportunity flow from synthesis → Intelligence Hub → Opportunity Engine
4. Deploy and verify changes are live