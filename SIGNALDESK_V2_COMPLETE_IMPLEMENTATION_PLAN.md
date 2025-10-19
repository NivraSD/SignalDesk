# SignalDesk V2: Complete Implementation Plan
## Combining Foundation Building with Simplified Architecture

**Version:** 2.0  
**Date:** January 2025  
**Status:** Unified Implementation Strategy

---

## Overview: Foundation + Four Pillars

The complete implementation combines:
1. **Foundation Building** (Onboarding, MemoryVault setup, MCP integration)
2. **Four-Pillar Architecture** (Intelligence, Opportunity, Execution, MemoryVault)
3. **Niv as Strategic Advisor** (Not executor)

```
Step 1: Onboarding (Captures Context)
            ↓
Step 2: Foundation (MemoryVault + MCP Setup)
            ↓
Step 3: Four Pillars (Intelligence, Opportunity, Execution, Memory)
            ↓
Step 4: Niv Integration (Strategic Advisor)
```

---

## Phase 1: Onboarding System (Week 1)
**Purpose: From Zero to Full Context**

### 1.1 Five-Step Onboarding Flow

#### Step 1: Organization Profile
```javascript
// Captures company basics
{
  name: "Your Company",
  industry: "Technology",
  position: "Market Leader | Challenger | Disruptor",
  differentiators: ["First AI solution", "10x faster"],
  competitors: ["Competitor A", "Competitor B"]
}
→ Stores in MemoryVault.organization
```

#### Step 2: PR Objectives
```javascript
// What are you trying to achieve?
{
  primary_objectives: [
    "Thought Leadership",
    "Product Launches", 
    "Crisis Preparedness"
  ],
  success_metrics: [
    "Tier 1 media monthly",
    "20% share of voice"
  ]
}
→ Stores in MemoryVault.objectives
```

#### Step 3: Opportunity Configuration
```javascript
// What opportunities to track?
{
  opportunity_types: {
    competitor_weakness: true,
    narrative_vacuum: true,
    cascade_events: true,
    trending_topics: true
  },
  response_time: "< 4 hours",
  risk_tolerance: "balanced"
}
→ Configures Opportunity Module
```

#### Step 4: Intelligence Sources
```javascript
// What to monitor?
{
  competitors_to_track: ["Stripe", "Square"],
  topics_to_monitor: ["AI regulation", "fintech"],
  journalists_to_follow: ["Tech beat", "Finance beat"],
  keywords: ["payment processing", "embedded finance"]
}
→ Configures Intelligence Module MCPs
```

#### Step 5: MCP Activation
```javascript
// Which intelligence systems to activate?
{
  activated_mcps: [
    "intelligence",     // Market monitoring
    "monitor",         // Real-time tracking
    "crisis",          // Crisis detection
    "social",          // Social monitoring
    "opportunities"    // Opportunity detection
  ]
}
→ Activates selected MCPs
```

### 1.2 Material Upload (Optional)
```javascript
// Import existing PR materials
{
  press_releases: [...],
  case_studies: [...],
  executive_bios: [...],
  crisis_templates: [...]
}
→ Stores in MemoryVault.materials
→ Extracts patterns for future use
```

---

## Phase 2: MemoryVault Foundation (Week 2)
**Purpose: Build the Persistent Knowledge Base**

### 2.1 Database Schema Creation

```sql
-- Core MemoryVault Tables
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  profile JSONB,
  objectives JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE memory_intelligence (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  domain TEXT, -- 'competitor', 'market', 'stakeholder'
  data JSONB,
  patterns JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE memory_opportunities (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  opportunity JSONB,
  score INTEGER,
  outcome JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE memory_execution (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  campaign JSONB,
  materials JSONB,
  performance JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE memory_patterns (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  pattern_type TEXT,
  pattern_data JSONB,
  success_rate FLOAT,
  last_seen TIMESTAMPTZ
);
```

### 2.2 Initial Population from Onboarding

```javascript
// Store onboarding data immediately
async function populateMemoryVault(onboardingData) {
  // Store organization profile
  await supabase.from('organizations').insert({
    profile: onboardingData.profile,
    objectives: onboardingData.objectives
  });
  
  // Store initial patterns from uploaded materials
  if (onboardingData.materials) {
    await extractAndStorePatterns(onboardingData.materials);
  }
  
  // Configure monitoring based on preferences
  await configureIntelligence(onboardingData.sources);
}
```

---

## Phase 3: Four-Pillar Module Setup (Week 3-4)

### 3.1 Intelligence Module Implementation

```javascript
// Intelligence Module connects to MCPs
const IntelligenceModule = {
  // Data sources (from onboarding config)
  mcps: {
    intelligence: 'Market monitoring',
    monitor: 'Real-time tracking',
    social: 'Social listening',
    regulatory: 'Compliance tracking'
  },
  
  // Gather intelligence
  async gatherIntelligence() {
    const data = await Promise.all([
      this.mcps.intelligence.gather(),
      this.mcps.monitor.track(),
      this.mcps.social.listen()
    ]);
    
    // Store in MemoryVault
    await storeIntelligence(data);
    
    // Send signals to Opportunity Module
    await sendSignals(data);
  }
}
```

### 3.2 Opportunity Module Implementation

```javascript
// Opportunity Module detects and scores
const OpportunityModule = {
  // Detection based on onboarding preferences
  detectionRules: {
    competitor_weakness: true,
    narrative_vacuum: true,
    cascade_events: true
  },
  
  // Process signals from Intelligence
  async processSignals(signals) {
    const opportunities = [];
    
    for (const signal of signals) {
      if (this.matchesRules(signal)) {
        const opportunity = {
          type: signal.type,
          data: signal.data,
          cascade: await this.predictCascade(signal),
          window: this.calculateWindow(signal),
          score: this.calculateScore(signal) // CRS & NVS
        };
        opportunities.push(opportunity);
      }
    }
    
    // Store in MemoryVault
    await storeOpportunities(opportunities);
    
    return this.rankOpportunities(opportunities);
  }
}
```

### 3.3 Execution Module Implementation

```javascript
// Execution Module - the ONLY place content is created
const ExecutionModule = {
  tools: {
    contentGenerator: ContentGeneratorUI,
    mediaListBuilder: MediaListBuilderUI,
    campaignPlanner: CampaignPlannerUI,
    templateLibrary: TemplateLibraryUI
  },
  
  // Create campaign from opportunity
  async executeOpportunity(opportunity) {
    // Get relevant templates from MemoryVault
    const templates = await getRelevantTemplates(opportunity);
    
    // User creates content using dedicated UIs
    const campaign = {
      materials: await this.tools.contentGenerator.create(),
      mediaList: await this.tools.mediaListBuilder.build(),
      timeline: await this.tools.campaignPlanner.plan()
    };
    
    // Store execution in MemoryVault
    await storeExecution(campaign);
    
    return campaign;
  }
}
```

### 3.4 MemoryVault Module Interface

```javascript
// MemoryVault Module - accessible from all modules
const MemoryVaultModule = {
  // Query patterns
  async queryPatterns(context) {
    return await supabase
      .from('memory_patterns')
      .select('*')
      .match({ pattern_type: context.type })
      .order('success_rate', { ascending: false });
  },
  
  // Store new learnings
  async storeLearning(outcome) {
    // Extract pattern from outcome
    const pattern = extractPattern(outcome);
    
    // Update or create pattern
    await supabase
      .from('memory_patterns')
      .upsert({
        pattern_type: pattern.type,
        pattern_data: pattern.data,
        success_rate: pattern.success_rate
      });
  },
  
  // Provide context to Niv
  async getContextForNiv(query) {
    const context = {
      organization: await this.getOrgContext(),
      patterns: await this.queryPatterns(query),
      history: await this.getRelevantHistory(query)
    };
    return context;
  }
}
```

---

## Phase 4: MCP Integration (Week 5)

### 4.1 MCP Bridge Setup

```javascript
// Connect MCPs to Intelligence Module
const MCPBridge = {
  // MCPs configured during onboarding
  activeMCPs: [],
  
  async initialize(config) {
    // Activate MCPs based on onboarding choices
    for (const mcp of config.activated_mcps) {
      this.activeMCPs.push(await this.connectMCP(mcp));
    }
  },
  
  async syncWithPlatform() {
    // Gather from all active MCPs
    const intelligence = await Promise.all(
      this.activeMCPs.map(mcp => mcp.gather())
    );
    
    // Send to Intelligence Module
    await IntelligenceModule.processIntelligence(intelligence);
  }
}
```

### 4.2 Real-time Monitoring Setup

```javascript
// Continuous monitoring based on onboarding config
const MonitoringEngine = {
  targets: [], // From onboarding
  
  async startMonitoring() {
    // Set up monitoring for configured targets
    this.targets = await getMonitoringTargets();
    
    // Poll MCPs every 5 minutes
    setInterval(async () => {
      await MCPBridge.syncWithPlatform();
    }, 5 * 60 * 1000);
    
    // Real-time for critical events
    this.setupRealtimeListeners();
  }
}
```

---

## Phase 5: Niv as Strategic Advisor (Week 6)

### 5.1 Niv Redefinition

```javascript
// Niv - Strategic Advisor Only
const NivAdvisor = {
  // NO artifact creation
  capabilities: [
    'interpret_intelligence',
    'validate_opportunities',
    'guide_execution',
    'connect_patterns'
  ],
  
  // Process user question
  async advise(userQuery) {
    // Get context from MemoryVault
    const context = await MemoryVaultModule.getContextForNiv(userQuery);
    
    // Interpret based on current state
    const interpretation = await this.interpret(userQuery, context);
    
    // Provide strategic advice
    return {
      advice: interpretation.advice,
      reasoning: interpretation.reasoning,
      suggestedAction: interpretation.action,
      similarPatterns: context.patterns
    };
  },
  
  // Guide to appropriate module
  suggestModule(intent) {
    const moduleMap = {
      'check_competitors': 'Intelligence',
      'review_opportunities': 'Opportunity',
      'create_content': 'Execution',
      'what_worked': 'MemoryVault'
    };
    return moduleMap[intent];
  }
}
```

---

## Complete Implementation Timeline

### Week 1: Onboarding System
- [ ] Build 5-step wizard UI
- [ ] Create onboarding data models
- [ ] Design material upload interface
- [ ] Set up initial MemoryVault storage

### Week 2: MemoryVault Foundation
- [ ] Create database schema
- [ ] Build storage APIs
- [ ] Implement pattern extraction
- [ ] Set up retrieval system

### Week 3: Intelligence & Opportunity Modules
- [ ] Build Intelligence Module UI
- [ ] Connect to MCP bridge
- [ ] Create Opportunity Module
- [ ] Implement scoring algorithms

### Week 4: Execution Module
- [ ] Port Content Generator
- [ ] Port Media List Builder
- [ ] Create Campaign Planner
- [ ] Build Template Library

### Week 5: MCP Integration
- [ ] Build MCP bridge API
- [ ] Connect active MCPs
- [ ] Set up monitoring
- [ ] Test data flow

### Week 6: Niv Integration
- [ ] Redefine Niv as advisor
- [ ] Remove artifact creation
- [ ] Connect to all modules
- [ ] Implement strategic interpretation

---

## Data Flow: From Onboarding to Action

```
1. ONBOARDING
   ├── Organization Profile → MemoryVault
   ├── PR Objectives → MemoryVault
   ├── Opportunity Config → Opportunity Module
   ├── Intelligence Sources → Intelligence Module
   └── MCP Selection → MCP Bridge

2. FOUNDATION
   ├── MemoryVault stores everything
   └── MCPs start gathering intelligence

3. OPERATION
   Intelligence Module (gathers) 
        ↓
   Opportunity Module (detects)
        ↓
   Niv (advises on opportunity)
        ↓
   Execution Module (user creates)
        ↓
   MemoryVault (stores outcome)
        ↓
   Pattern Recognition (learns)
        ↓
   Better Future Decisions
```

---

## Key Integration Points

### Onboarding → Modules
- Organization data → MemoryVault
- Opportunity preferences → Opportunity Module config
- Intelligence sources → Intelligence Module config
- MCP selection → MCP Bridge activation

### Modules → MemoryVault
- Intelligence Module → Stores all gathered data
- Opportunity Module → Stores detected opportunities
- Execution Module → Stores campaigns and results
- All modules → Query for patterns and history

### MemoryVault → Niv
- Provides full context for strategic advice
- Shows relevant patterns
- Supplies historical success data
- Enables intelligent recommendations

---

## Success Criteria

### Phase 1 (Onboarding)
- ✓ Complete profile captured
- ✓ Objectives defined
- ✓ MCPs configured
- ✓ Initial data in MemoryVault

### Phase 2 (Foundation)
- ✓ MemoryVault operational
- ✓ Pattern storage working
- ✓ Retrieval system functional

### Phase 3 (Modules)
- ✓ Four modules operational
- ✓ Clean separation of concerns
- ✓ Data flowing between modules

### Phase 4 (MCPs)
- ✓ MCPs connected
- ✓ Real-time monitoring active
- ✓ Intelligence feeding system

### Phase 5 (Niv)
- ✓ Niv provides strategic advice only
- ✓ No artifact creation
- ✓ Connects all modules intelligently

---

## Conclusion

This plan unifies:
1. **The Foundation** (Onboarding + MemoryVault setup)
2. **The Architecture** (Four clean modules)
3. **The Intelligence** (MCP integration)
4. **The Advisor** (Niv as strategist, not executor)

Starting from zero knowledge, the system builds up through onboarding, establishes its memory, connects intelligence sources, and provides a clean four-pillar architecture where each module has a clear purpose and Niv guides strategy without creating artifacts.

---

*Version: 2.0 Complete*  
*Status: Ready for Implementation*  
*First Step: Build Onboarding Wizard*