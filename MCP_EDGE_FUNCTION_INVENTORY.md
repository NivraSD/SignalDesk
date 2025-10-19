# Complete MCP & Edge Function Inventory for SignalDesk V3

## Status Overview
**Last Updated:** January 17, 2025
**Total Edge Functions:** 37 (Active: 8 Core Pipeline + 10 MCPs + 19 Legacy/Supporting)
**Total MCPs:** 21 Active + 1 Duplicate
**Pipeline Status:** FULLY OPERATIONAL with creative enhancement

---

## 🟢 ACTIVE - Currently In Use

### Core Intelligence Pipeline (7 Functions) - DO USE THESE
These are the production pipeline functions currently running:

1. **intelligence-orchestrator-v2** ✅
   - Master pipeline coordinator
   - Orchestrates all 7 stages
   - 2-3 minute execution

2. **monitor-stage-1** ✅
   - PR-focused article filtering
   - Sources: RSS, Google News, Yahoo Finance

3. **monitor-stage-2-relevance** ✅
   - Advanced PR scoring (30+ threshold)
   - Organization: +40, Competitors: +30

4. **monitoring-stage-2-enrichment** ✅
   - Entity/event extraction WITHOUT AI
   - Multiple output formats

5. **mcp-executive-synthesis** ✅
   - 5-analyst strategic synthesis
   - Model: claude-3-5-sonnet-20241022

6. **mcp-opportunity-detector** ✅
   - Generates 8-10 opportunities
   - Scoring and urgency assessment

7. **opportunity-orchestrator-v2** ✅
   - Creative campaign enhancement
   - Focus on executable tactics

### NIV System (1 Active)
- **niv-orchestrator-robust** ✅
  - Strategic PR orchestration
  - Content extraction, media lists, press releases
  - 20 years experience system prompt

---

## 🔵 ACTIVE MCPs (21) - Available for NIV Integration

### Content & Media (4)
- **mcp-content** - 7 tools for content generation
- **mcp-media** - 6 tools for journalist discovery
- **mcp-social** - 7 tools for social orchestration
- **mcp-campaigns** - 6 tools for campaign management

### Analysis & Intelligence (4)
- **mcp-intelligence** - Intelligence synthesis
- **mcp-monitor** - Real-time monitoring
- **mcp-analytics** - Performance metrics
- **mcp-discovery** - Company profiling

### Stakeholder & Crisis (4)
- **mcp-crisis** - 7 tools for crisis management
- **mcp-stakeholder-groups** - 7 tools for stakeholder engagement
- **mcp-narratives** - 7 tools for narrative tracking
- **mcp-regulatory** - 7 tools for compliance

### Data & Relationships (4)
- **mcp-entities** - 7 tools for entity extraction
- **mcp-relationships** - 7 tools for network analysis
- **mcp-memory** - 6 tools for pattern learning
- **mcp-opportunities** - Opportunity detection

### Infrastructure (5)
- **mcp-orchestrator** - Multi-MCP coordination
- **mcp-bridge** - System integration
- **mcp-scraper** - Web scraping
- **mcp-firecrawl** - Advanced web scraping
- **master-source-registry** - RSS feed management

---

## 🔴 DEPRECATED - DO NOT USE

### Legacy Pipeline Functions
- **intelligence-orchestrator** (v1) - Use v2 instead
- **opportunity-orchestrator** (v1) - Use v2 instead
- **claude-discovery** - Use mcp-discovery
- **claude-intelligence-synthesizer** - Use mcp-executive-synthesis
- **claude-analysis-storage** - Legacy storage

### Duplicate MCPs
- **mcp-executive** - Duplicate of mcp-executive-synthesis

### Old NIV Versions
- **agent-niv-pr-strategist** - Legacy NIV implementation
- **niv-mcp-integrated** - Old integration attempt

---

## 📋 Component-to-MCP Mapping

### Intelligence Module
**Primary MCPs:**
- mcp-discovery (company profiling)
- mcp-monitor (real-time monitoring)
- mcp-intelligence (synthesis)
- mcp-executive-synthesis (5 analysts)

**Supporting MCPs:**
- mcp-analytics (metrics)
- mcp-entities (extraction)
- master-source-registry (RSS feeds)

**Edge Functions:**
- intelligence-orchestrator-v2
- monitor-stage-1
- monitor-stage-2-relevance
- monitoring-stage-2-enrichment

### Opportunities Module
**Primary MCPs:**
- mcp-opportunity-detector
- mcp-opportunities
- mcp-campaigns

**Supporting MCPs:**
- mcp-content (creative generation)
- mcp-media (journalist targeting)
- mcp-social (social campaigns)

**Edge Functions:**
- opportunity-orchestrator-v2

### Plan Module
**Primary MCPs:**
- mcp-campaigns (campaign orchestration)
- mcp-stakeholder-groups (engagement planning)
- mcp-narratives (narrative strategy)

**Supporting MCPs:**
- mcp-regulatory (compliance planning)
- mcp-relationships (network mapping)
- mcp-analytics (performance projections)

### Execute Module
**Primary MCPs:**
- mcp-content (all content types)
- mcp-media (media lists)
- mcp-social (social content)

**Supporting MCPs:**
- mcp-crisis (crisis response)
- mcp-campaigns (execution tracking)

**NIV Integration:**
- niv-orchestrator-robust (for strategic oversight)

### MemoryVault Module
**Primary MCPs:**
- mcp-memory (pattern storage)
- mcp-analytics (trend analysis)
- mcp-relationships (connection mapping)

**Supporting MCPs:**
- mcp-entities (entity tracking)
- mcp-narratives (narrative patterns)

---

## 🚀 NIV Integration Strategy

### Adaptive MCP Selection by Module
```typescript
const nivModuleMappings = {
  intelligence: {
    primary: ['discovery', 'monitor', 'intelligence', 'executive-synthesis'],
    supporting: ['analytics', 'entities'],
    edgeFunctions: ['intelligence-orchestrator-v2']
  },

  opportunities: {
    primary: ['opportunities', 'campaigns', 'opportunity-detector'],
    supporting: ['content', 'media', 'social'],
    edgeFunctions: ['opportunity-orchestrator-v2']
  },

  plan: {
    primary: ['campaigns', 'stakeholder-groups', 'narratives'],
    supporting: ['regulatory', 'relationships', 'analytics'],
    edgeFunctions: []
  },

  execute: {
    primary: ['content', 'media', 'social'],
    supporting: ['crisis', 'campaigns'],
    edgeFunctions: ['niv-orchestrator-robust']
  },

  memoryVault: {
    primary: ['memory', 'analytics', 'relationships'],
    supporting: ['entities', 'narratives'],
    edgeFunctions: []
  }
}
```

### Web Search Integration Points
Each module should combine MCPs with external searches:
- **Intelligence:** Breaking news, competitor updates
- **Opportunities:** Trending topics, news hooks
- **Plan:** Industry events, regulatory changes
- **Execute:** Journalist activity, social trends
- **MemoryVault:** Historical patterns, industry benchmarks

---

## 🛠️ Implementation Priorities

### Phase 1: Core Integration
1. Connect NIV to active pipeline functions
2. Map MCPs to modules correctly
3. Avoid all deprecated functions

### Phase 2: Hybrid Intelligence
1. Add web search APIs
2. Implement parallel MCP + Web processing
3. Module-specific synthesis

### Phase 3: Contextual Adaptation
1. Module-aware prompts
2. Dynamic MCP selection
3. Intelligent action suggestions

---

## ⚠️ Critical Notes

### DO NOT USE:
- Any v1 orchestrators
- Claude-* legacy functions (except claude-analysis-storage for storage only)
- mcp-executive (duplicate)
- Old NIV implementations

### ALWAYS USE:
- v2 orchestrators for pipeline
- mcp-* prefixed functions for capabilities
- niv-orchestrator-robust for NIV core

### Model Configuration:
- Executive synthesis: claude-3-5-sonnet-20241022
- NIV: Claude or GPT-4 for flexibility
- Content generation: Mixed models OK

---

## 📊 Statistics

### Active Functions by Category:
- Pipeline Core: 7
- Active MCPs: 21
- NIV System: 1
- Supporting: 8
- **Total Active: 37**

### Deprecated Functions:
- Legacy Pipeline: 5
- Old NIV: 2
- Duplicates: 1
- **Total Deprecated: 8**

### Tool Count by MCP:
- 7-tool MCPs: 11 (crisis, social, stakeholder, narratives, content, entities, regulatory, relationships)
- 6-tool MCPs: 3 (media, campaigns, memory)
- Other: 7
- **Total Tools: 140+**

---

*This inventory represents the current production state as of January 17, 2025. Use this as the definitive guide for NIV integration and component development.*