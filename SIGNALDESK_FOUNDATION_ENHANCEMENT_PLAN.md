# SignalDesk Foundation Enhancement Plan

## Building True PR Intelligence from the Ground Up

**Version:** 1.0  
**Date:** August 025  
**Status:** Foundation Architecture Phase

---

## Executive Summary

After extensive debugging and analysis, we've identified that SignalDesk's core problems stem from attempting to build features (like Niv) without the underlying intelligence foundation. This plan outlines a complete architectural rebuild focusing on four foundational pillars that must work together from the start: **Onboarding**, **MemoryVault**, **MCP Integration**, and the **Opportunity Engine**. Only after these foundations are solid will we integrate Niv as a truly intelligent PR strategist.

---

## Updated Vision: From Zero to Intelligence

### The Core Philosophy

**"Start with nothing, build everything through intelligence"**

Instead of pre-loading company information or using static templates, SignalDesk will:

1. Begin with zero knowledge about the organization
2. Learn everything through the onboarding process
3. Continuously gather intelligence via 17+ MCP servers
4. Store all knowledge permanently in MemoryVault
5. Detect opportunities through pattern recognition
6. Generate strategies based on accumulated intelligence
7. Execute campaigns automatically with learned context

### The Intelligence Stack

```
┌─────────────────────────────────────────┐
│            Niv (Final Layer)            │ ← Intelligent PR Strategist
├─────────────────────────────────────────┤
│         Opportunity Engine              │ ← Detects & Scores Opportunities
├─────────────────────────────────────────┤
│          MCP Integration                │ ← 17+ Intelligence Gatherers
├─────────────────────────────────────────┤
│           MemoryVault                   │ ← Persistent Knowledge Base
├─────────────────────────────────────────┤
│           Onboarding                    │ ← Initial Context Capture
└─────────────────────────────────────────┘
```

---

## The Four Foundational Pillars

### 1. Onboarding System

**Purpose:** Capture complete organizational context from zero

**Components:**

- Company profile configuration
- PR objectives definition
- Opportunity preferences setting
- MCP activation selection
- Material import and pattern learning

**Key Features:**

- Five-step wizard interface
- Progressive context building
- Immediate storage in MemoryVault
- MCP configuration based on needs

### 2. MemoryVault

**Purpose:** Persistent, growing knowledge base aligned with all MCPs

**Architecture:**

```javascript
MemoryVault {
  // Core Domains (One per MCP)
  domains: {
    intelligence: {},      // signaldesk-intelligence
    relationships: {},     // signaldesk-relationships
    crisis: {},           // signaldesk-crisis
    social: {},           // signaldesk-social
    narratives: {},       // signaldesk-narratives
    regulatory: {},       // signaldesk-regulatory
    entities: {},         // signaldesk-entities
    opportunities: {},    // signaldesk-opportunities
    // ... all 17 MCPs
  },

  // Cross-Domain Intelligence
  patterns: {
    cascade_effects: [],
    successful_strategies: [],
    timing_patterns: []
  },

  // Organizational Context
  organization: {
    profile: {},
    objectives: {},
    preferences: {}
  }
}
```

**Database Design:**

- Partitioned tables for scale
- Vector embeddings for semantic search
- JSONB for flexible schema evolution
- Row-level security for multi-tenancy

### 3. MCP Integration Layer

**Purpose:** Connect 17+ specialized intelligence servers

**Core MCPs to Integrate:**

1. `signaldesk-intelligence` - Market monitoring
2. `signaldesk-monitor` - Real-time tracking
3. `signaldesk-opportunities` - Opportunity detection
4. `signaldesk-orchestrator` - Cross-MCP coordination
5. `signaldesk-crisis` - Crisis detection
6. `signaldesk-social` - Social monitoring
7. `signaldesk-narratives` - Narrative tracking
8. `signaldesk-regulatory` - Compliance monitoring
9. `signaldesk-entities` - Entity recognition
10. `signaldesk-relationships` - Stakeholder mapping

**Integration Architecture:**

- MCP → API Bridge → Supabase → MemoryVault
- Real-time synchronization
- Pattern detection across MCPs
- Shared learning distribution

### 4. Opportunity Engine

**Purpose:** Transform intelligence into actionable opportunities

**Core Components:**

```javascript
OpportunityEngine {
  // Detection Layer
  detection: {
    competitor_weakness: {},
    narrative_vacuum: {},
    cascade_events: {},
    trending_topics: {}
  },

  // Analysis Layer
  analysis: {
    cascade_prediction: {},  // 2nd/3rd order effects
    window_calculation: {},  // Time remaining
    impact_assessment: {}    // Potential reach
  },

  // Scoring Layer
  scoring: {
    CRS: 0-100,  // Client Reality Score
    NVS: 0-100,  // Narrative Vacuum Score
    priority: {}  // Urgency ranking
  },

  // Action Layer
  action: {
    strategy_generation: {},
    campaign_creation: {},
    material_generation: {},
    media_list_building: {}
  }
}
```

---

## Implementation Plan

### Phase 1: Infrastructure Foundation (Week 1)

#### 1.1 Supabase Database Setup

```sql
-- Core tables with optimizations
- organizations (RLS enabled)
- memory_vault (partitioned by date)
- mcp_sync_status
- opportunity_queue
- cascade_history
- pattern_library
```

#### 1.2 Vercel API Structure

```
/api/
├── memory-vault/
│   ├── store.js
│   ├── retrieve.js
│   └── search.js
├── mcp-bridge/
│   ├── sync.js
│   └── status.js
├── opportunities/
│   ├── detect.js
│   ├── score.js
│   └── execute.js
└── cron/
    ├── process-opportunities.js
    └── sync-mcps.js
```

#### 1.3 Edge Functions Setup

- Embedding generation for semantic search
- Long-running opportunity processing
- Pattern detection algorithms

### Phase 2: Onboarding & MemoryVault (Week 2)

#### 2.1 Onboarding UI Components

```javascript
// Five-step wizard
1. OrganizationProfile.js
2. PRObjectives.js
3. OpportunityConfiguration.js
4. CampaignOrchestration.js
5. MCPActivation.js
```

#### 2.2 MemoryVault Implementation

- Database schema creation
- API endpoints for CRUD operations
- Pattern detection system
- Cross-domain correlation engine

#### 2.3 Initial Data Storage

- Store onboarding data
- Import existing materials
- Extract initial patterns
- Build base knowledge

### Phase 3: MCP Integration (Week 3)

#### 3.1 MCP Bridge API

- Authentication layer
- Data transformation
- Batch processing
- Error handling & retries

#### 3.2 Core MCP Connections

- Start with 4-5 essential MCPs
- Implement sync mechanisms
- Set up monitoring
- Test data flow

#### 3.3 Pattern Recognition

- Cross-MCP pattern detection
- Learning distribution
- Success pattern storage
- Feedback loops

### Phase 4: Opportunity Engine (Week 4)

#### 4.1 Detection System

```javascript
// Real-time opportunity detection
- Monitor MCP feeds
- Apply detection rules
- Check against patterns
- Queue for processing
```

#### 4.2 Cascade Intelligence

```javascript
// Predict ripple effects
- First order (24-48 hours)
- Second order (1 week)
- Third order (1 month)
- Window calculation
```

#### 4.3 Scoring Algorithm

```javascript
// Prioritize opportunities
- Calculate CRS
- Calculate NVS
- Assess urgency
- Rank by potential
```

#### 4.4 Action Generation

```javascript
// Automatic response creation
- Generate strategy
- Create campaign plan
- Build media list
- Draft content
```

### Phase 5: Integration & Testing (Week 5)

#### 5.1 System Integration

- Connect all components
- Test data flow
- Verify pattern detection
- Validate opportunity scoring

#### 5.2 Performance Optimization

- Database indexing
- Query optimization
- Caching strategy
- Connection pooling

#### 5.3 Security & Compliance

- RLS policies
- API authentication
- Data encryption
- Audit logging

### Phase 6: Niv Integration (Week 6)

#### 6.1 Intelligence Connection

- Connect Niv to MemoryVault
- Access pattern library
- Query opportunity history
- Retrieve success patterns

#### 6.2 Context Awareness

```javascript
// Niv becomes truly intelligent
- Read organizational context
- Access MCP intelligence
- Understand opportunities
- Leverage historical data
```

#### 6.3 Orchestration Capabilities

- Coordinate MCPs
- Generate campaigns
- Create materials
- Execute strategies

---

## Technical Architecture

### Supabase Configuration

```javascript
{
  database: {
    pooling: true,
    rls: true,
    partitioning: "monthly",
    indexes: "optimized"
  },
  realtime: {
    subscriptions: "limited",
    channels: "per-org"
  },
  storage: {
    buckets: ["materials", "templates", "archives"]
  },
  edge_functions: {
    embeddings: true,
    processing: true
  }
}
```

### Vercel Configuration

```javascript
{
  functions: {
    maxDuration: 60,  // Pro plan
    regions: ["iad1"],
    runtime: "nodejs18.x"
  },
  cron: {
    jobs: [
      "0 */15 * * *",  // Process opportunities
      "*/5 * * * *",    // Sync MCPs
      "0 3 * * *"       // Daily patterns
    ]
  },
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    DATABASE_URL: process.env.DATABASE_URL // Pooled
  }
}
```

### MCP Bridge Architecture

```javascript
// Bridge between local MCPs and cloud platform
MCPBridge {
  // Local (Claude Desktop)
  local: {
    mcps: [17 servers],
    execution: "user machine",
    interface: "Claude"
  },

  // Cloud (Vercel/Supabase)
  cloud: {
    api: "Vercel functions",
    storage: "Supabase",
    processing: "Edge functions"
  },

  // Sync mechanism
  sync: {
    method: "API polling",
    frequency: "5 minutes",
    batch_size: 100
  }
}
```

---

## Success Metrics

### Phase 1-2: Foundation

- [ ] Database schema deployed
- [ ] Onboarding flow captures all context
- [ ] MemoryVault stores and retrieves data
- [ ] Basic pattern detection working

### Phase 3-4: Intelligence

- [ ] 5+ MCPs successfully integrated
- [ ] Opportunities detected in real-time
- [ ] Cascade predictions 70%+ accurate
- [ ] Scoring algorithm validated

### Phase 5-6: Integration

- [ ] End-to-end data flow working
- [ ] Opportunities → Campaigns automated
- [ ] Niv has full context access
- [ ] System learns from outcomes

---

## Risk Mitigation

### Technical Risks

1. **Supabase connection limits** → Use connection pooling
2. **Vercel timeout constraints** → Use Edge Functions for long processes
3. **MCP sync failures** → Implement retry logic and queuing
4. **Data volume growth** → Partition tables, implement archiving

### Architecture Risks

1. **Pattern detection accuracy** → Start simple, iterate based on results
2. **Cascade prediction complexity** → Begin with first-order effects
3. **Cross-MCP coordination** → Use orchestrator MCP as central hub
4. **MemoryVault scaling** → Design for sharding from start

---

## Current Challenges Summary

### 1. Niv's Broken State

**Problem:** Niv creates artifacts for everything, has no real intelligence

- Scope detection always returns 'quick'
- No connection to actual data or patterns
- Multi-mode system attempted but failed
- System has gotten "dumber" over time

**Root Cause:** No underlying intelligence foundation - Niv is trying to be smart without any actual knowledge base

### 2. Missing Foundation

**Problem:** Built features without core infrastructure

- No persistent memory system
- MCPs not actually integrated
- No pattern recognition
- No learning from outcomes

**Solution:** This plan - build foundation first, then features

### 3. Platform Fragmentation

**Problem:** Multiple attempts have created scattered code

- Backend-orchestrator partially deployed
- Frontend expecting different data structures
- Vercel/Supabase integration incomplete
- Multiple conflicting implementations

**Solution:** Clean architecture with clear data flow

### 4. Intelligence Gap

**Problem:** System has no real intelligence

- MCPs exist but aren't connected
- No pattern detection across domains
- No cascade prediction capability
- No opportunity scoring mechanism

**Solution:** Implement complete MCP integration with MemoryVault

### 5. Execution Inability

**Problem:** Can't go from opportunity to execution

- No automatic strategy generation
- No campaign creation from opportunities
- No material generation based on context
- No media list building from intelligence

**Solution:** Build Opportunity Engine with action layer

### 6. Context Amnesia

**Problem:** System doesn't remember or learn

- No persistent storage of patterns
- No learning from successful campaigns
- No improvement over time
- Starts from zero every session

**Solution:** MemoryVault as permanent, growing knowledge base

---

## Next Immediate Steps

1. **Stop trying to fix Niv directly** - It can't work without foundation
2. **Create MemoryVault database schema** - Start storing knowledge
3. **Build Onboarding flow** - Capture organizational context
4. **Connect first MCPs** - Begin gathering intelligence
5. **Implement basic Opportunity Engine** - Detect and score
6. **Then integrate Niv** - With real intelligence to work with

---

## Conclusion

SignalDesk's vision is powerful: an autonomous PR command center that transforms intelligence into action. However, the current implementation tried to build the roof before the foundation. This plan corrects that by establishing four foundational pillars that must work together from the start. Only after we have real intelligence gathering (MCPs), persistent memory (MemoryVault), context understanding (Onboarding), and opportunity detection (Engine) can Niv become the intelligent PR strategist it was meant to be.

The path forward is clear: **Foundation → Intelligence → Action → Then Niv**.

---

_Last Updated: January 2025_  
_Status: Ready for Implementation_  
_Next Action: Create MemoryVault Database Schema_
