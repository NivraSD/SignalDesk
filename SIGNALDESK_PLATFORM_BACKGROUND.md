# SignalDesk Platform Background & Current State
## Complete Technical Documentation

**Version:** 1.0  
**Date:** January 2025  
**Purpose:** Comprehensive platform overview and current state analysis

---

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [Current Architecture](#current-architecture)
3. [MCP Ecosystem](#mcp-ecosystem)
4. [Existing Components](#existing-components)
5. [Database Structure](#database-structure)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Current Issues](#current-issues)
9. [Integration Points](#integration-points)
10. [Development History](#development-history)

---

## Platform Overview

### Core Concept
SignalDesk is an AI-powered PR intelligence and campaign automation platform designed to transform competitive intelligence into executable PR strategies. It combines real-time market monitoring, AI-driven analysis, and automated campaign generation.

### Original Vision
- **"From Intelligence to Impact"** - Bridge the gap between knowing what's happening and knowing what to do about it
- Move from insight to action in minutes, not weeks
- Autonomous PR command center with minimal human intervention

### Current Reality
- Platform partially implemented with disconnected components
- Niv AI assistant creates artifacts indiscriminately
- MCPs exist but aren't integrated
- No persistent memory or learning capability
- Multiple deployment attempts have created fragmentation

---

## Current Architecture

### Deployment Infrastructure

```
Current Deployments:
├── Frontend
│   ├── Platform: Vercel
│   ├── URL: https://signaldesk.vercel.app
│   ├── Framework: React 18.x
│   └── Status: Deployed but disconnected from intelligence
│
├── Backend (Multiple Attempts)
│   ├── backend-orchestrator/
│   │   ├── Platform: Vercel
│   │   ├── URL: https://backend-orchestrator.vercel.app
│   │   └── Status: Partially functional
│   │
│   ├── Supabase Edge Functions
│   │   ├── niv-simple/
│   │   ├── niv-multimode/
│   │   ├── niv-realtime/
│   │   └── Status: Various states of completion
│   │
│   └── Legacy Backends
│       ├── Railway (abandoned)
│       └── Local Node.js servers
│
└── Database
    ├── Platform: Supabase
    ├── URL: https://zskaxjtyuaqazydouifp.supabase.co
    └── Status: Operational but underutilized
```

### Technology Stack

**Frontend:**
- React 18.x with Hooks
- Context API for state management
- Lucide React for icons
- Tailwind CSS for styling
- Real-time WebSocket connections (configured but unused)

**Backend:**
- Node.js with Express (various implementations)
- Vercel Serverless Functions
- Supabase Edge Functions (Deno)
- PostgreSQL via Supabase
- Redis for caching (configured but not implemented)

**AI Integration:**
- Claude API (claude-3-5-sonnet-20241022)
- Model Context Protocol (MCP) servers
- Local execution via Claude Desktop

---

## MCP Ecosystem

### Complete MCP Inventory (17 Servers + Playwright)

#### Core Intelligence MCPs

**1. signaldesk-intelligence**
- Purpose: Market intelligence, competitor monitoring, emerging topics
- Tools: 4 specialized functions
- Priority: 0.9 (Critical)
- Status: Built but not connected

**2. signaldesk-relationships**
- Purpose: Journalist tracking, relationship health, influencer mapping
- Tools: 4 functions
- Priority: 0.7 (High)
- Status: Built but not connected

**3. signaldesk-analytics**
- Purpose: Media value calculation, sentiment analysis, ROI
- Tools: 4 functions
- Priority: 0.6 (Medium)
- Status: Built but not connected

#### Content & Campaign MCPs

**4. signaldesk-content**
- Purpose: Content generation, crisis statements, localization
- Tools: 4 functions
- Priority: 0.5 (Medium)
- Status: Built but not connected

**5. signaldesk-campaigns**
- Purpose: Campaign planning, task management, orchestration
- Tools: 4 functions
- Priority: 0.6 (Medium)
- Status: Built but not connected

**6. signaldesk-media**
- Purpose: Journalist discovery, pitch generation, outreach
- Tools: 4 functions
- Priority: 0.7 (High)
- Status: Built but not connected

#### Opportunity & Monitoring MCPs

**7. signaldesk-opportunities**
- Purpose: Opportunity discovery, analysis, pitch suggestions
- Tools: 4 functions
- Priority: 0.8 (High)
- Status: Built but not connected

**8. signaldesk-memory**
- Purpose: Knowledge management and context storage
- Tools: 4 functions
- Priority: 0.5 (Medium)
- Status: Built but not connected

**9. signaldesk-monitor**
- Purpose: Real-time stakeholder monitoring and alerts
- Tools: 4 functions
- Priority: 0.9 (Critical)
- Status: Built but not connected

**10. signaldesk-scraper**
- Purpose: Web scraping and cascade prediction
- Tools: 4 functions
- Database: Uses Supabase
- Status: Built but not connected

#### Enhanced MCPs (New Generation)

**11. signaldesk-entities**
- Purpose: Entity management and recognition
- Tools: 10 functions
- Priority: 0.8 (High)
- Status: Built but not connected

**12. signaldesk-crisis**
- Purpose: Crisis management and response
- Tools: 7 functions
- Priority: 1.0 (Maximum)
- Status: Built but not connected

**13. signaldesk-social**
- Purpose: Social media monitoring
- Tools: 7 functions
- Priority: 0.8 (High)
- Status: Built but not connected

**14. signaldesk-stakeholder-groups**
- Purpose: Coalition tracking and group dynamics
- Tools: 7 functions
- Priority: 0.7 (High)
- Status: Built but not connected

**15. signaldesk-narratives**
- Purpose: Narrative management and control
- Tools: 7 functions
- Priority: 0.8 (High)
- Status: Built but not connected

**16. signaldesk-regulatory**
- Purpose: Regulatory intelligence and compliance
- Tools: 7 functions
- Priority: 0.9 (Critical)
- Status: Built but not connected

**17. signaldesk-orchestrator**
- Purpose: Cross-MCP intelligence sharing
- Tools: 10 functions
- Priority: Central coordinator
- Status: Built but not connected

**18. playwright-mcp-server**
- Purpose: Browser automation
- Location: /Users/jonathanliebowitz/Desktop/playwright-mcp-server
- Status: Available but not integrated

### MCP Configuration

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Current State:**
- All MCPs are configured in Claude Desktop
- Can be accessed directly through Claude
- No API bridge to web platform
- No data persistence from MCP operations

---

## Existing Components

### Frontend Components Structure

```
/frontend/src/
├── components/
│   ├── Layout/
│   │   ├── RailwayDraggable.js    # Main layout (3-panel)
│   │   └── Navigation.js
│   │
│   ├── Intelligence/
│   │   ├── IntelligenceDashboard.js
│   │   ├── CompetitorAnalysis.js
│   │   ├── TopicMomentum.js
│   │   └── UnifiedAnalysis.js
│   │
│   ├── Opportunity/
│   │   ├── OpportunityEngine.js    # Currently basic
│   │   ├── PositionAnalyzer.js
│   │   └── ConceptGenerator.js
│   │
│   ├── Campaign/
│   │   ├── CampaignIntelligence.js
│   │   └── BriefGenerator.js
│   │
│   ├── Content/
│   │   ├── ContentGenerator.js     # Working well
│   │   └── MediaListBuilder.js     # Functional
│   │
│   ├── Niv/
│   │   ├── NivChat.js             # Basic chat
│   │   ├── NivLayout.js
│   │   ├── NivWorkspace.js
│   │   └── NivSimple.js           # Latest attempt
│   │
│   └── MemoryVault/
│       └── MemoryVault.js         # UI only, no backend
│
├── services/
│   ├── supabaseApiService.js      # Main API service
│   ├── mcpIntegrationService.js   # Stub only
│   └── intelligenceService.js
│
└── config/
    └── supabase.js                # Database config
```

### Backend API Structure

```
/backend-orchestrator/api/
├── niv-complete.js          # Multi-mode attempt (deployed)
├── niv-multimode.js         # Advanced multi-mode (not deployed)
├── niv-strategic.js         # Strategic analysis
├── intelligence/
│   ├── analysis.js
│   ├── targets.js
│   └── sources.js
├── campaigns/
│   ├── briefs.js
│   └── templates.js
└── content/
    ├── generate.js
    └── optimize.js
```

---

## Database Structure

### Current Supabase Tables

```sql
-- Niv Related Tables
niv_conversations               # Chat sessions
niv_conversation_messages       # Message history
niv_work_items                 # Generated artifacts
niv_user_preferences           # User settings

-- Core Business Tables
organizations                  # Company profiles
projects                       # PR projects
users                         # User accounts

-- Intelligence Tables (Partially Implemented)
intelligence_targets           # Monitoring targets
intelligence_findings          # Gathered intelligence (empty)
opportunity_queue             # Detected opportunities (unused)

-- Placeholder Tables (Created but unused)
stakeholder_intelligence      # Relationship data
cascade_predictions          # Effect predictions
memory_vault                # Knowledge storage (empty)
```

### Missing Critical Tables
- Pattern recognition storage
- MCP sync status
- Campaign outcomes
- Learning history
- Cross-domain correlations

---

## API Endpoints

### Currently Active Endpoints

**Niv Endpoints:**
```
POST /api/niv-complete         # Main Niv endpoint (creates too many artifacts)
POST /api/niv-multimode        # Attempted fix (not deployed)
POST /api/niv-strategic        # Strategic analysis
```

**Intelligence Endpoints:**
```
GET  /api/intelligence/analysis/unified/:orgId
POST /api/intelligence/analysis/competitor
POST /api/intelligence/analysis/topic
GET  /api/intelligence/sources
```

**Campaign Endpoints:**
```
POST /api/campaigns/briefs/generate
GET  /api/campaigns/templates
POST /api/campaigns/performance
```

**Content Endpoints:**
```
POST /api/content/generate
POST /api/content/optimize
GET  /api/content/templates
```

### Missing Critical Endpoints
- MCP bridge endpoints
- MemoryVault CRUD operations
- Pattern detection APIs
- Opportunity processing
- Cascade prediction

---

## Frontend Components

### Working Components

**1. Content Generator**
- Status: Fully functional
- Features: Multiple content types, tone adjustment, AI generation
- Issue: Not connected to intelligence

**2. Media List Builder**
- Status: Functional
- Features: Journalist discovery, beat analysis
- Issue: No real journalist data

**3. Intelligence Dashboard**
- Status: UI complete
- Features: Competitor tracking, topic momentum
- Issue: Mock data only

### Broken Components

**1. Niv Chat System**
- Status: Creates artifacts for everything
- Problem: No scope detection, no intelligence
- Attempted fixes: Multi-mode system (failed)

**2. Opportunity Engine**
- Status: Basic UI only
- Problem: No real opportunity detection
- Missing: Cascade prediction, scoring

**3. MemoryVault**
- Status: UI shell only
- Problem: No backend implementation
- Missing: Everything

---

## Current Issues

### 1. Architectural Issues

**Fragmentation:**
- Multiple backend attempts in different locations
- Inconsistent data structures
- No clear data flow
- Disconnected components

**No Foundation:**
- Built features without infrastructure
- No persistent storage
- No learning capability
- No pattern recognition

### 2. Integration Issues

**MCP Disconnection:**
- 17 MCPs built but not connected
- No bridge between Claude Desktop and web
- No data persistence from MCPs
- No cross-MCP coordination

**Database Underutilization:**
- Tables exist but aren't used
- No data flow to/from database
- No real-time subscriptions active
- No RLS policies configured

### 3. Functional Issues

**Niv Problems:**
- Creates artifacts for every message
- Scope detection always returns 'quick'
- No connection to real data
- Has gotten "dumber" over time

**No Intelligence:**
- Mock data throughout
- No real monitoring
- No pattern detection
- No opportunity discovery

---

## Integration Points

### Required Integrations

```javascript
IntegrationMap {
  // MCP → Platform
  mcp_to_platform: {
    method: "API Bridge",
    frequency: "Real-time or polling",
    data_flow: "MCP → API → Supabase → MemoryVault"
  },
  
  // Platform → Niv
  platform_to_niv: {
    method: "Context injection",
    data: "MemoryVault → Niv context",
    intelligence: "Real-time from all sources"
  },
  
  // Opportunity → Execution
  opportunity_to_execution: {
    detection: "MCP monitoring",
    scoring: "Opportunity Engine",
    execution: "Campaign Orchestrator",
    materials: "Content Generator"
  }
}
```

### Current Integration Attempts

**Supabase-Vercel:**
- Basic connection established
- No connection pooling
- No Edge Functions deployed
- No cron jobs configured

**Frontend-Backend:**
- API calls work
- Data structure mismatches
- No real-time updates
- No state persistence

---

## Development History

### Timeline of Attempts

**Phase 1: Initial Build**
- Basic platform structure
- Mock intelligence dashboard
- Simple Niv chat

**Phase 2: Railway Deployment**
- Attempted backend on Railway
- Failed due to complexity
- Abandoned

**Phase 3: Vercel Migration**
- Moved to Vercel serverless
- Partial success
- Backend-orchestrator created

**Phase 4: Niv "Fixes"**
- Multiple attempts to fix artifacts
- Multi-mode system
- Scope detection (broken)
- Made problem worse

**Phase 5: MCP Development**
- Built 17 MCP servers
- Configured in Claude Desktop
- Never integrated with platform

**Phase 6: Current State**
- Recognizing need for foundation
- Planning complete rebuild
- Focus on MemoryVault first

---

## Critical Path Forward

### What We Have
1. **UI Components** - Mostly built, need connection to real data
2. **MCP Servers** - All 17 built, need integration
3. **Database** - Supabase ready, needs proper schema
4. **Deployment** - Vercel/Supabase working, needs configuration

### What We Need
1. **MemoryVault** - Persistent storage and learning
2. **MCP Bridge** - Connect MCPs to platform
3. **Opportunity Engine** - Real detection and scoring
4. **Pattern Recognition** - Learn from outcomes
5. **Niv Intelligence** - Connect to real data

### The Foundation Gap

```
Current State:                    Needed State:
┌──────────┐                     ┌──────────┐
│   Niv    │ ← No intelligence   │   Niv    │ ← Full context
├──────────┤                     ├──────────┤
│    ???   │ ← Missing layer     │ Opp Eng  │ ← Detects/scores
├──────────┤                     ├──────────┤
│   MCPs   │ ← Not connected     │   MCPs   │ ← Integrated
├──────────┤                     ├──────────┤
│    ???   │ ← No memory         │  Memory  │ ← Persistent
├──────────┤                     ├──────────┤
│    UI    │ ← Mock data         │Onboarding│ ← Real context
└──────────┘                     └──────────┘
```

---

## Component Readiness Assessment

### Ready to Use (with integration)
- ✅ Content Generator UI
- ✅ Media List Builder UI
- ✅ Intelligence Dashboard UI
- ✅ All 17 MCP servers
- ✅ Supabase database
- ✅ Vercel deployment

### Needs Major Work
- ⚠️ Niv (complete rebuild after foundation)
- ⚠️ Opportunity Engine (needs real detection)
- ⚠️ MemoryVault (backend implementation)
- ⚠️ MCP Bridge (doesn't exist)

### Must Build from Scratch
- ❌ Onboarding system
- ❌ Pattern recognition
- ❌ Cascade prediction
- ❌ Learning system
- ❌ Cross-MCP coordination

---

## Environment Variables

### Currently Configured

```bash
# Frontend (.env.local)
REACT_APP_SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
REACT_APP_BACKEND_URL=https://backend-orchestrator.vercel.app

# Backend (Vercel)
CLAUDE_API_KEY=sk-ant-...
SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

### Needs Configuration

```bash
# Missing but needed
SUPABASE_SERVICE_KEY=...        # For server operations
DATABASE_URL=...?pgbouncer=true # Pooled connection
CRON_SECRET=...                 # For scheduled jobs
REDIS_URL=...                   # For caching
```

---

## File System Structure

```
/SignalDesk/
├── frontend/                    # React app (Vercel)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend-orchestrator/        # Current backend (Vercel)
│   ├── api/
│   ├── package.json
│   └── vercel.json
│
├── mcp-servers/                # All 17 MCP servers
│   ├── signaldesk-intelligence/
│   ├── signaldesk-relationships/
│   ├── ... (15 more)
│   └── signaldesk-orchestrator/
│
├── backend/                    # Legacy/reference code
│   ├── UserOnboarding.md      # Onboarding vision
│   ├── MCPEnhancement.md      # MCP plans
│   └── various documentation
│
└── Documentation/
    ├── PLATFORM_STATUS_REPORT.md
    ├── MCP_CONFIGURATION_GUIDE.md
    └── SIGNALDESK_FOUNDATION_ENHANCEMENT_PLAN.md
```

---

## Summary

SignalDesk has all the pieces needed for a powerful PR intelligence platform, but they're disconnected and built without foundation. The platform attempted to create smart features (Niv) without the underlying intelligence infrastructure (MemoryVault, MCP integration, Opportunity Engine). This led to a system that appears sophisticated but operates on mock data and creates artifacts indiscriminately.

The path forward requires building the foundation first:
1. **MemoryVault** for persistent knowledge
2. **Onboarding** to capture context
3. **MCP Integration** for real intelligence
4. **Opportunity Engine** for detection and action
5. Only then can **Niv** become truly intelligent

All components exist in some form, but need proper integration and the missing foundational layer to function as intended.

---

*Document Version: 1.0*  
*Last Updated: January 2025*  
*Purpose: Complete platform background for development planning*