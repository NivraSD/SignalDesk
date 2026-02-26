# SignalDesk V3: Master Implementation Plan

## Complete Architecture, Features & 8-Week Workplan

### Your Single Source of Truth

<<<<<<< HEAD
**Version:** 3.1 (Updated with Phase 0 Completion)  
**Start Date:** February 1, 2025  
**Launch Date:** April 1, 2025  
**Status:** Phase 0 Complete, Ready for Phase 1

### 🎯 Current State Summary
- **Phase 0:** ✅ COMPLETE (Technical debt cleaned, bugs fixed, schema ready)
- **Intelligence Pipeline:** ✅ FULLY WORKING (7 stages, 2-3 min execution)
- **Opportunity Engine:** ✅ FULLY WORKING (5 personas, database storage)
- **Edge Functions:** ✅ CONSOLIDATED (97 → 71 functions)
- **Database:** ✅ V3 SCHEMA COMPLETE (12 tables with RLS)
- **Next Step:** Begin Phase 1 - Foundation & UI (Week 1)
=======
**Version:** 3.0 Master  
**Start Date:** February 1, 2025  
**Launch Date:** April 1, 2025  
**Status:** Ready for Implementation
>>>>>>> cb4c36f5bcebe01f9c38384c2055b4bc392323bb

---

# PART 1: THE VISION

## What We're Building

### The Core Promise

**One-Click Autonomous PR Execution**: From opportunity detection to complete campaign deployment.

### The Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NIV ORCHESTRATOR                          │
│            (Strategic Brain - Coordinates Everything)         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  INTELLIGENCE     OPPORTUNITIES      EXECUTION      MEMORY   │
│    MODULE           ENGINE           MODULE         VAULT    │
│                                                               │
│  ▪ 7-Stage        ▪ Detection      ▪ Content      ▪ Patterns │
│  ▪ 2-3 min run   ▪ Scoring       ▪ Visuals      ▪ Learning │
│  ▪ Extraction    ▪ Auto-Execute  ▪ Export Only  ▪ Attachments│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### The Stack

- **Frontend:** Next.js 14 (App Directory), TypeScript, Tailwind
- **State:** Zustand + React Query
- **Backend:** Supabase Edge Functions (Deno)
- **Database:** Supabase Postgres with RLS
- **AI:** Claude 3, GPT-4, DALL-E 3, Synthesia
- **Testing:** Vitest, Playwright (80% coverage)

---

# PART 2: TECHNICAL ARCHITECTURE

## System Architecture

```
CLIENT LAYER (Next.js 14)
    ↓
EDGE FUNCTION LAYER (Supabase Functions)
    ↓
MCP SERVER LAYER (17 Specialized Servers)
    ↓
DATA LAYER (Postgres + Vector DB)
```

## Existing Components Integration Map

### ✅ WHAT YOU ALREADY HAVE

<<<<<<< HEAD
#### Intelligence Pipeline (FULLY WORKING)
- **7-Stage Pipeline:** intelligence-discovery-v3 → stage-5-synthesis
- **Timing:** 2-3 minutes execution (confirmed)
- **Status:** Backend functional, UI rendering issue FIXED in Phase 0
- **Integration:** Ready for V3
- **Components:**
  - Discovery (profile generation)
  - Monitor Stage 1 (intelligent PR filtering)
  - Monitor Stage 2 Relevance (PR scoring)
  - Monitoring Stage 2 Enrichment (event/entity extraction)
  - Intelligence Orchestrator V2 (parallel synthesis coordination)
  - Executive Synthesis (5 analyst personas)
  - Intelligence Persistence (storage layer)

#### Opportunity Engine V2 (FULLY WORKING)
- **Status:** Complete and tested in production
- **Features:**
  - Transform intelligence into actionable playbooks
  - 5 analyst personas creating different opportunity types
  - Claude enhancement for action items (with markdown wrapper handling)
  - Database storage working (opportunities table)
  - Integrated into Intelligence Orchestrator V2
- **Technical Fixes Applied:**
  - JSON parsing for Claude responses
  - RLS permissions configured
  - CORS handling implemented
  - Service role authentication working
=======
#### Intelligence Pipeline (WORKING)
- **7-Stage Pipeline:** intelligence-discovery-v3 → stage-5-synthesis
- **Timing:** 2-3 minutes execution (confirmed)
- **Status:** Backend functional, UI rendering issue needs fix
- **Integration:** Ready for V3
>>>>>>> cb4c36f5bcebe01f9c38384c2055b4bc392323bb

#### MCP Servers (17 Total)
**Complete (4):**
- signaldesk-crisis (7 tools)
- signaldesk-social (7 tools)
- signaldesk-stakeholder-groups (7 tools)
- signaldesk-narratives (7 tools)

**Functional (11):**
<<<<<<< HEAD
- signaldesk-opportunities (integrated with pipeline)
=======
- signaldesk-opportunities
>>>>>>> cb4c36f5bcebe01f9c38384c2055b4bc392323bb
- signaldesk-content
- signaldesk-media
- signaldesk-campaigns
- signaldesk-memory
- signaldesk-analytics
- signaldesk-entities
- signaldesk-relationships
- signaldesk-scraper
- signaldesk-intelligence
- signaldesk-monitor

**In Progress (2):**
- signaldesk-regulatory (needs 7 tools)
- signaldesk-orchestrator (needs coordination logic)

<<<<<<< HEAD
#### Edge Functions (71 after Phase 0 cleanup)
- **Phase 0 Cleanup:** Reduced from 97 to 71 functions (26% reduction)
- **Archived:** 15 Niv versions, 5 Claude synthesizer versions, 6 intelligence versions
- **Production Functions:** 
  - Core Pipeline (7): intelligence-discovery-v3, stages 1-5, persistence
  - Niv System (1): niv-orchestrator-robust (selected as production)
  - Opportunity System (5): orchestrator, detector-v3, enhancer, executor
  - Content & Media (4): content, media, campaigns, social intelligence
=======
#### Edge Functions (100+)
- **Issue:** Too many variants (17 Niv versions!)
- **Action:** Consolidate to core set
>>>>>>> cb4c36f5bcebe01f9c38384c2055b4bc392323bb
- **DECISION:** Use `niv-orchestrator-robust` as production version

#### Selected Niv: niv-orchestrator-robust
- **Location:** `/supabase/functions/niv-orchestrator-robust/`
- **Features:** Content extraction, strategic planning, media lists
- **System Prompt:** Senior PR strategist with 20 years experience
- **Output Formats:** Structured blocks for press releases, media lists, strategies

### ❌ WHAT'S MISSING FOR V3

<<<<<<< HEAD
#### Critical Gaps (Remaining)
=======
#### Critical Gaps
>>>>>>> cb4c36f5bcebe01f9c38384c2055b4bc392323bb
1. **Visual Content Generation**
   - DALL-E 3 integration
   - Synthesia video API
   - Infographic builder

2. **Export System (LIABILITY CRITICAL)**
   - PDF/Word/Social export
<<<<<<< HEAD
   - Audit trail (exports_log table ready)
   - No direct posting implementation

3. **Onboarding Intelligence**
   - Live extraction during setup
   - Asset analysis (memoryvault_attachments table ready)
   - Goal integration

4. **Alert Manager**
   - Frontend for monitoring_alerts table
   - Multi-channel delivery system
   - Real-time notifications

5. **Context-Aware Niv**
   - Module awareness implementation
   - Overlay assistant UI
   - Proactive suggestions based on context

6. **Infinite Canvas UI**
   - Draggable/resizable components
   - State persistence (canvas_states table ready)
   - Tab-based focus system
=======
   - Audit trail
   - No direct posting

3. **Onboarding Intelligence**
   - Live extraction during setup
   - Asset analysis
   - Goal integration

4. **Alert Manager**
   - Opportunities/Crisis/Deadlines only
   - Multi-channel delivery

5. **Context-Aware Niv**
   - Module awareness
   - Overlay assistant
   - Proactive suggestions
>>>>>>> cb4c36f5bcebe01f9c38384c2055b4bc392323bb

## Directory Structure

```
signaldesk-v3/
├── app/                          # Next.js App Directory
│   ├── (auth)/                   # Auth routes
│   ├── (dashboard)/              # Main app
│   │   ├── intelligence/
│   │   ├── opportunities/
│   │   ├── campaigns/
│   │   └── niv/
│   └── api/                      # Minimal API routes
├── components/
│   ├── intelligence/             # Intelligence UI
│   ├── opportunities/            # Opportunity cards
│   ├── execution/                # Content tools
│   ├── niv/                      # Command center
│   └── shared/                   # Reusable UI
├── lib/
│   ├── supabase/                # Supabase clients
│   ├── api/                     # API calls
│   └── utils/                   # Utilities
├── stores/                       # Zustand stores
├── supabase/
│   ├── functions/               # Edge functions
│   │   ├── _shared/            # Shared utilities
│   │   ├── niv-orchestrator/   # Master brain
│   │   ├── intelligence-pipeline/
│   │   ├── opportunity-engine/
│   │   ├── execution-tools/
│   │   └── memoryvault/
│   └── migrations/              # Database schema
└── tests/                       # All tests
```

<<<<<<< HEAD
## Database Schema (COMPLETE - Phase 0)

```sql
-- Core Tables (12 total - all created in schema_v3.sql)
organizations                    -- Multi-tenant support
profiles                         -- User management with roles
intelligence_runs               -- Pipeline execution tracking
intelligence_stage_results      -- Individual stage tracking
opportunities                   -- Strategic opportunities (WORKING)
campaigns                       -- Content campaigns
memoryvault                     -- Knowledge base with vectors (1536 dimensions)
memoryvault_attachments         -- File attachments with AI analysis
monitoring_alerts               -- 3 types: opportunity, crisis, deadline
canvas_states                   -- Infinite canvas UI state persistence
exports_log                     -- Audit trail for liability protection
niv_interactions               -- Context-aware assistant history

-- All with RLS enabled and proper indexes
-- Vector support configured for semantic search
-- Update triggers for timestamp management
=======
## Database Schema

```sql
-- Core Tables
organizations
profiles
intelligence_runs
opportunities
campaigns
memoryvault (with vector embeddings)
memoryvault_attachments (user uploads from onboarding)
visual_assets
monitoring_alerts (opportunities, crisis, deadlines only)

-- All with RLS enabled
>>>>>>> cb4c36f5bcebe01f9c38384c2055b4bc392323bb
```

## State Management

```typescript
// Zustand store structure
interface AppState {
  // Auth & Org
  user: User | null;
  organization: Organization | null;

  // Modules
  intelligenceData: IntelligenceData | null;
  opportunities: Opportunity[];
  activeCampaigns: Campaign[];

  // UI
  activeModule: ModuleType;

  // Actions
  loadIntelligence: () => Promise<void>;
  executeOpportunity: (id: string) => Promise<void>;
  switchModule: (module: ModuleType) => void;
}
```

---

# PART 3: ENHANCED FEATURES

## 1. Autonomous Opportunity Execution

### The Heart of SignalDesk

**One-Click Flow:**

```
Opportunity Detected → User Clicks "Execute" → System Generates:
├── Strategic Plan (2 sec)
├── Written Content (10 sec)
│   ├── Press Release
│   ├── Blog Post
│   ├── Email Pitches
│   └── Social Posts
├── Visual Content (15 sec)
│   ├── Hero Images (DALL-E 3)
│   ├── Infographics
│   └── Videos (Synthesia)
├── Media Strategy (5 sec)
│   ├── Targeted List
│   ├── Personalized Pitches
│   └── Optimal Timing
└── Social Campaign (3 sec)
    ├── LinkedIn Post
    ├── Twitter Thread
    └── Instagram Content

TOTAL: 35 seconds → Complete Campaign Ready
```

## 2. Visual Content System

```typescript
capabilities = {
  generation: {
    images: "DALL-E 3",
    videos: "Synthesia",
    infographics: "D3.js + Canvas",
    charts: "Recharts",
  },
  management: {
    upload: "User images",
    analysis: "GPT-4 Vision",
    tagging: "Auto-categorization",
    library: "Searchable asset bank",
  },
};
```

## 3. Social Media Orchestration

```typescript
platforms = {
  twitter: { threads, scheduling, hashtags },
  linkedin: { posts, articles, targeting },
  instagram: { posts, stories, reels },
  tiktok: { videos, sounds, effects },
  youtube: { descriptions, tags, thumbnails },
};
```

## 4. Niv's Role: Strategic Orchestrator

```typescript
niv = {
  sees: "All intelligence data",
  thinks: "Strategic implications",
  orchestrates: "All modules in harmony",
  predicts: "Outcomes and cascades",
  learns: "From every execution",
};

// Not a chatbot, but a command center showing:
// - What's happening (interpretation)
// - What to do (recommendations)
// - Click to execute (orchestration)
// - What will happen (predictions)
```

## 5. MemoryVault: Continuous Learning

```typescript
memoryVault = {
  patterns: "What works repeatedly",
  failures: "What to avoid",
  relationships: "Journalist preferences",
  timing: "Optimal windows",
  content: "High-performing templates",
  attachments: "User uploaded materials with AI analysis",
};
```

## 6. Crisis Command Center

```typescript
crisisManagement = {
  detection: "Real-time threat monitoring",
  scenarios: "Pre-built response templates",
  stakeholders: "Targeted messaging by group",
  timeline: "Phased response strategy",
  integration: "Leverages existing CrisisCommandCenter.js",
};
```

## 7. Export System (No Direct Posting)

```typescript
exportSystem = {
  formats: ["PDF", "Word", "Social drafts", "Media kits"],
  liability: "NEVER posts directly to platforms",
  audit: "Complete trail for compliance",
  smartCopy: "Platform-specific formatting",
};
```

## 8. Context-Aware Niv

```typescript
nivContext = {
  awareness: "Sees what module user is in",
  suggestions: "Contextual help based on screen",
  overlay: "Floating assistant, not separate chat",
  proactive: "Suggests actions based on visible data",
};
```

## 9. Focused Alert System

```typescript
alerts = {
  opportunities: "High-score or time-sensitive only",
  crisis: "Immediate threats only",  
  deadlines: "Expiring opportunities/campaigns",
  // NO general monitoring or news alerts
};
```

## 10. Infinite Canvas UI System

### Revolutionary Workspace Design

```typescript
// Infinite scrollable canvas with draggable components
infiniteCanvasUI = {
  // Fixed header with 5 main tabs
  tabs: [
    "Intelligence",   // 🧠 Run pipeline, view analysis
    "Opportunities",  // 🎯 See scored opportunities
    "Plan",          // 📋 Strategic planning
    "Execute",       // 🚀 Content & campaign creation
    "MemoryVault"    // 💾 Patterns & learning
  ],
  
  // Canvas behavior
  canvas: {
    type: "infinite-scroll",
    components: "Keep multiple open simultaneously",
    interaction: "Drag, resize, minimize, maximize",
    grid: "Optional 20px snap-to-grid",
    persistence: "Save layout per user"
  },
  
  // Tab click behavior
  tabBehavior: {
    click: "Focus or create component",
    exists: "Scroll to and highlight",
    new: "Create at center of viewport",
    dim: "Other components fade to 60%"
  },
  
  // Niv Integration
  niv: {
    type: "Context-aware overlay",
    position: "Floating assistant",
    awareness: "Knows visible components",
    suggestions: "Based on current view"
  }
}
```

### Benefits
- Never lose context between modules
- Visual workflow representation
- Personalized workspace layouts
- Compare items side-by-side
- See data flow in real-time

## 11. The Wow Factor Onboarding

### 5-Phase Experience (3-4 minutes total)

```typescript
// Phase 1: Instant Intelligence Start (30 seconds)
phase1_InstantStart = {
  userInput: {
    email: string,
    password: string,
    company: string,  // "Tesla"
    website: string   // "tesla.com" - THAT'S ALL WE NEED!
  },
  
  // Pipeline immediately starts extracting
  whileTheyWatch: [
    "🔍 Analyzing tesla.com...",
    "🏢 Found: Tesla, Inc. - Electric Vehicles & Clean Energy",
    "📍 Located: Austin, Texas, 140,000 employees",
    "📊 Public company: NASDAQ:TSLA",
    "🔗 Social profiles discovered"
  ]
};

// Phase 2: Smart Goal Setting (45 seconds)
phase2_GoalsWhilePipelineRuns = {
  display: "Interactive goal cards with live updates",
  whenUserSelects: "Thought Leadership",
  showFromLiveData: "Finding speaking opportunities...",
  preview: "3 conferences identified so far..."
};

// Phase 3: Optional Asset Upload (45 seconds)
phase3_AssetIntelligence = {
  message: "Have existing materials? We'll make them intelligent (optional)",
  upload: "CEO_Bio.pdf",
  instant: [
    "✓ Extracting expertise areas...",
    "✓ Matching to opportunities...",
    "✓ Creating speaker pitch angles..."
  ]
};

// Phase 4: Live Intelligence Preview (60 seconds)  
phase4_LiveIntelligence = {
  liveDisplay: "Pipeline Progress + Live discoveries",
  liveFeed: [
    "✓ 5 direct competitors identified",
    "✓ 127 relevant journalists discovered",
    "✓ 8 key stakeholder groups mapped",
    "✓ 12 trending topics in your space",
    "⚡ Detecting PR opportunities..."
  ]
};

// Phase 5: The Magic Reveal (30 seconds)
phase5_MagicReveal = {
  headline: "We discovered 18 PR opportunities for Tesla",
  topOpportunities: [
    {
      opportunity: "Rivian production delays - positioning window",
      score: 95,
      urgency: "48 hour window",
      action: "View campaign strategy"
    }
  ],
  finalCTA: {
    button: "Enter Your Command Center",
    urgency: "⚡ High-priority opportunity expires in 4 hours"
  }
};
```

### Live Intelligence Sidebar

```typescript
// Shows throughout entire onboarding
liveIntelligenceSidebar = {
  display: "Right sidebar with live updates",
  updates: [
    "🔍 Extracting company profile from tesla.com",
    "✓ Found: Tesla, Inc - Austin, Texas",
    "🏢 Identifying competitors...",
    "✓ Found: Rivian, Lucid, BYD, NIO",
    "📰 Discovering media landscape...",
    "✓ 127 journalists cover your industry",
    "🎯 Detecting opportunities...",
    "⚡ 18 PR opportunities found!"
  ],
  purpose: "Users see intelligence building while they complete setup"
};
```

### MemoryVault Integration from Day 1

```typescript
// Store everything from onboarding
onboardingMemoryVault = {
  store: {
    goals: "User's strategic objectives",
    uploads: "Any materials provided",
    firstIntelligence: "Baseline intelligence snapshot",
    firstOpportunities: "Initial opportunities for pattern learning"
  },
  attachmentSupport: {
    types: ["PDF", "DOCX", "PPTX", "Images"],
    analysis: "AI extracts key points and patterns",
    embeddings: "Vector storage for semantic search"
  }
};
```

---

# PART 4: IMPLEMENTATION WORKPLAN

<<<<<<< HEAD
## PHASE 0: PREPARATION & CONSOLIDATION ✅ COMPLETE

### Phase 0 Achievements (Completed January 2025)

#### Technical Debt Resolution ✅
- **Edge Functions:** Reduced from 97 to 71 (26% reduction)
- **Archived:** 26 duplicate functions organized in _archive/
- **Production Set:** Clear separation of production vs archived functions
- **Selected Versions:**
  - NIV: niv-orchestrator-robust
  - Intelligence: intelligence-discovery-v3 through stage-5
  - Opportunity: opportunity-orchestrator with Claude enhancement

#### Bug Fixes ✅
- **MultiStageIntelligence.js:** Fixed rendering issue with synthesis stage
- **Pipeline Completion:** Now properly shows results after all 7 stages
- **Test File:** Created test-pipeline-rendering.html for verification

#### Database Schema ✅
- **Complete V3 Schema:** 12 tables with RLS and indexes
- **Vector Support:** Configured for semantic search (1536 dimensions)
- **Verification Script:** verify-database-schema.js created
- **Ready for V3:** All tables, triggers, and functions in place
=======
## PHASE 0: PREPARATION & CONSOLIDATION

### Before February 1 - CRITICAL CLEANUP

#### Technical Debt Resolution
```bash
# MUST DO FIRST: Consolidate 100+ edge functions
# Current: 17 Niv versions, multiple duplicates
# Target: Single production set

# 1. Choose production functions
PRODUCTION_NIV="niv-orchestrator-robust"
PRODUCTION_INTELLIGENCE="intelligence-discovery-v3 through stage-5"
PRODUCTION_OPPORTUNITY="opportunity-orchestrator"

# 2. Archive duplicates
mkdir supabase/functions/_archive
mv supabase/functions/niv-* _archive/ # Keep only chosen one
mv supabase/functions/intelligence-*-v[1-2] _archive/
mv supabase/functions/claude-intelligence-synthesizer-v[1-6] _archive/

# 3. Document function mapping
echo "See SIGNALDESK_V3_TECHNICAL_INTEGRATION.md for component mapping"
```
>>>>>>> cb4c36f5bcebe01f9c38384c2055b4bc392323bb

### Before February 1 - Standard Setup

#### Setup Checklist

```bash
# 1. New repository
git init signaldesk-v3

# 2. Next.js 14 with TypeScript
npx create-next-app@latest . --typescript --tailwind --app

# 3. New Supabase project
npx supabase init

# 4. Core dependencies
npm install @supabase/supabase-js zustand @tanstack/react-query
npm install lucide-react framer-motion react-window
npm install -D vitest @playwright/test
```

#### Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# .env.local (server only)
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

---

## WEEK 1: FOUNDATION (Feb 1-7)

### Day 1-2: Database & Auth

```sql
-- Core schema
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  config JSONB
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  role TEXT DEFAULT 'member'
);

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
```

**Deliverables:**

- [ ] Database deployed with RLS
- [ ] Auth flow (login/logout/register)
- [ ] Protected routes
- [ ] Test user account

### Day 3: Onboarding Flow

```typescript
// app/(onboarding)/layout.tsx - Onboarding layout
// components/onboarding/WowOnboarding.tsx - 5-phase flow
// components/onboarding/LiveIntelligenceSidebar.tsx
// components/onboarding/GoalSelector.tsx
```

**Deliverables:**

- [ ] 5-phase onboarding UI
- [ ] Live intelligence sidebar
- [ ] Goal selection interface
- [ ] Asset upload with processing

### Day 4: Layout & Navigation

```typescript
// app/layout.tsx - Root layout
// app/(dashboard)/layout.tsx - Dashboard layout
// components/shared/Navigation.tsx
// components/shared/Sidebar.tsx
```

**Deliverables:**

- [ ] App shell with navigation
- [ ] Module switching (Intelligence/Opportunities/Execution/Niv)
- [ ] Loading states
- [ ] Error boundaries

### Day 5: State Management

```typescript
// stores/useAppStore.ts
// Complete Zustand store with persistence
```

**Deliverables:**

- [ ] Zustand store configured
- [ ] Local storage persistence
- [ ] DevTools integration
- [ ] Initial state hydration

### Weekend Review

- [ ] All foundation components working
- [ ] No console errors
- [ ] Basic auth flow test passing

---

## WEEK 2: INTELLIGENCE PIPELINE (Feb 8-14)

<<<<<<< HEAD
### Day 1: Integrate Existing Pipeline

```typescript
// Pipeline FULLY WORKS - backend and UI (fixed in Phase 0)
// Just need to integrate into V3 UI
// 7 stages complete in 2-3 minutes
=======
### Day 1: Fix Existing Pipeline UI

```typescript
// Fix MultiStageIntelligence.js rendering issue
// Pipeline backend ALREADY WORKS (2-3 minutes)
// Just need to fix completion handler
>>>>>>> cb4c36f5bcebe01f9c38384c2055b4bc392323bb
```

**Deliverables:**

<<<<<<< HEAD
- [ ] Port MultiStageIntelligence.js to V3
- [ ] Connect to new Zustand store
- [ ] Test full 7-stage flow in new UI
=======
- [ ] Fix UI rendering bug in MultiStageIntelligence.js
- [ ] Ensure pipeline results display properly
- [ ] Test full 7-stage flow (already exists)
>>>>>>> cb4c36f5bcebe01f9c38384c2055b4bc392323bb
- [ ] Verify 2-3 minute execution time

### Day 2: Consolidate Niv Functions

```typescript
// Pick ONE Niv version from 17 variants
// Recommended: niv-orchestrator-robust
// Remove duplicate functions
```

**Deliverables:**

- [ ] Select production Niv version
- [ ] Remove 16 duplicate Niv functions
- [ ] Test selected version thoroughly
- [ ] Update all references

### Day 3-4: Intelligence UI

```typescript
// components/intelligence/IntelligenceDashboard.tsx
// components/intelligence/CompetitorCard.tsx
// components/intelligence/TrendAnalysis.tsx
// hooks/useIntelligence.ts
```

**Deliverables:**

- [ ] Intelligence dashboard
- [ ] Real-time progress indicators
- [ ] Data visualizations
- [ ] Export functionality

### Day 5: Integration Testing

- [ ] Full pipeline run successful
- [ ] UI updates correctly
- [ ] Data persists properly
- [ ] Cache implementation

---

## WEEK 3: OPPORTUNITY ENGINE (Feb 15-21)

<<<<<<< HEAD
### Day 1-2: Integrate Working Opportunity System

```typescript
// FULLY WORKING in current system:
// - opportunity-orchestrator (with Claude enhancement)
// - Database storage (opportunities table)
// - 5 analyst personas creating opportunities
// - Integrated with Intelligence Orchestrator V2
// Just need V3 UI integration!
=======
### Day 1-2: Integrate Existing Opportunity System

```typescript
// Already have:
// - opportunity-orchestrator (real detection, no fallbacks)
// - signaldesk-opportunities MCP (6 tools)
// - assess-opportunities-simple (scoring)
// Just need integration!
>>>>>>> cb4c36f5bcebe01f9c38384c2055b4bc392323bb
```

**Deliverables:**

<<<<<<< HEAD
- [ ] Port opportunity components to V3 UI
- [ ] Connect to Zustand store
- [ ] Test opportunity generation from pipeline
- [ ] Verify database storage
=======
- [ ] Connect opportunity-orchestrator to UI
- [ ] Wire signaldesk-opportunities MCP
- [ ] Test scoring system (already exists)
- [ ] Verify real-time detection
>>>>>>> cb4c36f5bcebe01f9c38384c2055b4bc392323bb

### Day 3-4: One-Click Execution Integration

```typescript
// Wire existing components:
// - signaldesk-campaigns MCP (create/execute)
// - signaldesk-content MCP (5 content types)
// - signaldesk-media MCP (list building)
// - signaldesk-social MCP (social content)
// Missing: Visual generation (DALL-E, Synthesia)
```

**Deliverables:**

- [ ] Wire campaign orchestration
- [ ] Connect content generation MCPs
- [ ] Integrate media list builder
- [ ] Add visual generation (NEW)

### Day 5: Opportunity UI

```typescript
// components/opportunities/OpportunityCenter.tsx
// components/opportunities/OpportunityCard.tsx
// components/opportunities/ExecutionReview.tsx
```

**Deliverables:**

- [ ] Opportunity cards with scores
- [ ] Execute button (one-click)
- [ ] Progress tracking
- [ ] Campaign review modal

---

## WEEK 4: NIV ORCHESTRATOR (Feb 22-28)

### Day 1-2: Niv Brain

```typescript
// supabase/functions/niv-orchestrator/
export async function orchestrate(request: NivRequest) {
  // Access everything
  const context = await gatherFullContext();

  // Think strategically
  const strategy = await analyzeStrategy(context);

  // Orchestrate all modules
  const plan = await coordinateModules(strategy);

  // Execute or recommend
  return executePlan(plan);
}
```

**Deliverables:**

- [ ] Niv orchestrator function
- [ ] Multi-module coordination
- [ ] Strategic analysis
- [ ] Predictive modeling

### Day 3-4: Command Center UI

```typescript
// components/niv/NivCommandCenter.tsx
// Not a chat, but a strategic dashboard showing:
// - Current situation analysis
// - Recommended actions
// - Active orchestrations
// - Predictions
```

**Deliverables:**

- [ ] Command center layout
- [ ] Strategic overview panel
- [ ] Recommendations panel
- [ ] Orchestration status

### Day 5: Integration

- [ ] Niv coordinating all modules
- [ ] Strategic plans generating
- [ ] Predictions working
- [ ] UI fully connected

---

## WEEK 5: NEW COMPONENTS & GAPS (Mar 1-7)

### Day 1-2: Visual Content System (NEW)

```typescript
// NEW: supabase/functions/visual-generator/
visualCapabilities = {
  dalle3: "OpenAI image generation",
  synthesia: "AI video creation",
  infographics: "Data visualization",
  charts: "Dynamic graphics"
}
```

**Deliverables:**

- [ ] DALL-E 3 integration
- [ ] Synthesia API setup
- [ ] Infographic builder
- [ ] Chart generator

### Day 3-4: Export System (CRITICAL - LIABILITY)

```typescript
// NEW: supabase/functions/export-system/
exportCapabilities = {
  formats: ["PDF", "Word", "CSV", "Social drafts"],
  watermark: "DRAFT - Not for distribution",
  audit: "Complete export trail",
  noDirectPost: "NEVER post to platforms"
}
```

**Deliverables:**

- [ ] PDF export with watermark
- [ ] Word doc generation
- [ ] Social media draft exports
- [ ] Audit trail system

### Day 5: Alert System & Onboarding Intelligence

```typescript
// NEW: supabase/functions/alert-manager/
// NEW: supabase/functions/onboarding-intelligence/
```

**Deliverables:**

- [ ] Alert manager (opportunities/crisis/deadlines)
- [ ] Onboarding live extraction
- [ ] Asset analysis during setup
- [ ] Goal-based scoring integration

---

## WEEK 6: MEMORYVAULT & LEARNING (Mar 8-14)

### Day 1-2: Vector Database

```sql
-- MemoryVault with embeddings
CREATE TABLE memoryvault (
  id UUID PRIMARY KEY,
  organization_id UUID,
  type TEXT,
  content JSONB,
  embedding vector(1536),
  metadata JSONB
);

CREATE INDEX ON memoryvault USING ivfflat (embedding);
```

**Deliverables:**

- [ ] Vector database setup
- [ ] Embedding generation
- [ ] Semantic search (<500ms)
- [ ] Pattern storage

### Day 3-4: Learning System

```typescript
// supabase/functions/learning-engine/
// Learns from every campaign
export async function learn(campaign, results) {
  const patterns = await extractPatterns();
  const insights = await generateInsights();
  await updateStrategies(patterns);
  await storeInMemory(insights);
}
```

**Deliverables:**

- [ ] Pattern recognition
- [ ] Success/failure analysis
- [ ] Strategy updates
- [ ] Continuous improvement

### Day 5: User Organization

```typescript
// Smart organization features
features = {
  folders: "Auto-categorization",
  tags: "AI-generated + custom",
  priorities: "Urgent/ThisWeek/Planned",
  search: "Unified across everything",
};
```

**Deliverables:**

- [ ] Smart folders
- [ ] Auto-tagging
- [ ] Priority management
- [ ] Unified search (<2 sec)

---

## WEEK 7: TESTING & OPTIMIZATION (Mar 15-21)

### Day 1-2: Unit Tests

```typescript
// 80% coverage target
// tests/unit/
- components/
- hooks/
- utils/
- stores/
```

**Deliverables:**

- [ ] Component tests
- [ ] Hook tests
- [ ] Utility tests
- [ ] 80% coverage achieved

### Day 3-4: Integration Tests

```typescript
// tests/integration/
-intelligence -
  pipeline.test.ts -
  opportunity -
  execution.test.ts -
  niv -
  orchestration.test.ts -
  content -
  generation.test.ts;
```

**Deliverables:**

- [ ] API integration tests
- [ ] Edge function tests
- [ ] Data flow validation
- [ ] Error recovery tests

### Day 5: E2E Tests

```typescript
// tests/e2e/
// Critical user journeys
-login -
  to -
  dashboard.spec.ts -
  run -
  intelligence.spec.ts -
  execute -
  opportunity.spec.ts -
  full -
  campaign -
  flow.spec.ts;
```

**Deliverables:**

- [ ] Critical paths covered
- [ ] Performance benchmarks met
- [ ] Load testing complete
- [ ] Accessibility tests passing

---

## WEEK 8: DEPLOYMENT (Mar 22-28)

### Day 1: Staging

```bash
# Deploy to staging environment
vercel --env=staging
supabase functions deploy --project=staging
```

**Checklist:**

- [ ] Frontend deployed
- [ ] All edge functions live
- [ ] Database migrated
- [ ] Auth working
- [ ] Monitoring active

### Day 2-3: Beta Testing

- [ ] 10 beta users onboarded
- [ ] Feedback collected
- [ ] Critical bugs fixed
- [ ] Performance optimized

### Day 4: Production Prep

```bash
# Final checklist
- [ ] Security audit complete
- [ ] Performance targets met
- [ ] Backup strategy ready
- [ ] Rollback plan documented
- [ ] Support team briefed
```

### Day 5: LAUNCH

```bash
# Production deployment
vercel --prod
supabase functions deploy --project=production
```

**Launch Validation:**

- [ ] All systems operational
- [ ] Monitoring dashboards green
- [ ] First users migrated
- [ ] Support channels active

---

# PART 5: SUCCESS METRICS

## Technical Targets

- **Bundle Size:** < 500KB initial
- **Lighthouse Score:** > 90
- **Pipeline Speed:** < 30 seconds
- **Campaign Generation:** < 60 seconds
- **Test Coverage:** > 80%
- **Zero Runtime Errors**

## Performance Targets

- **Page Load:** < 2 seconds
- **API Response:** < 200ms p50
- **Image Generation:** < 10 seconds
- **Search Results:** < 500ms
- **Memory Usage:** < 100MB

## Business Metrics

- **Time to Value:** < 5 min to first insight
- **Campaign Creation:** 10x faster than manual
- **User Satisfaction:** > 4.5/5
- **Feature Adoption:** > 60%
- **System Uptime:** 99.9%

## Onboarding Metrics

- **Completion Rate:** > 85%
- **Time to Complete:** 3-4 minutes
- **Wow Factor:** "This is amazing!" feedback
- **Immediate Action:** 60% act on first opportunity
- **Setup Satisfaction:** > 4.5/5 rating

---

# PART 6: MIGRATION STRATEGY

## Data Migration (Week 7-8)

```typescript
// scripts/migrate-v3.ts
async function migrateToV3() {
  // 1. Export from old system
  const oldData = await exportLegacyData();

  // 2. Transform to new schema
  const transformed = await transformData(oldData);

  // 3. Import to V3
  await importToV3(transformed);

  // 4. Validate
  await validateMigration();
}
```

## User Migration Plan

- **Week 6:** Email announcement
- **Week 7:** Beta access (10 users)
- **Week 8:** Gradual rollout
  - Day 1: 10% of users
  - Day 3: 50% of users
  - Day 5: 100% of users
- **Week 9:** Deprecate old system

---

# PART 7: RISK MITIGATION

## Technical Risks & Solutions

### 1. Edge Function Timeouts

- **Risk:** Functions exceed 30s limit
- **Solution:** Implement queue system
- **Backup:** Split into smaller functions

### 2. API Rate Limits

- **Risk:** Hit OpenAI/Claude limits
- **Solution:** Implement caching layer
- **Backup:** Queue with retry logic

### 3. Database Performance

- **Risk:** Slow queries at scale
- **Solution:** Proper indexing
- **Backup:** Read replicas

### 4. Visual Generation Costs

- **Risk:** High API costs
- **Solution:** Smart caching
- **Backup:** Usage limits per org

## Business Risks & Solutions

### 1. User Adoption

- **Risk:** Users resist change
- **Solution:** Gradual migration
- **Backup:** Maintain old system

### 2. Data Loss

- **Risk:** Migration failures
- **Solution:** Complete backups
- **Backup:** Point-in-time recovery

---

# PART 8: DAILY EXECUTION

## Daily Standup Format

```markdown
### Date: [DATE]

### Sprint: Week [N] Day [N]

#### ✅ Completed Yesterday

- [ ] Specific deliverable 1
- [ ] Specific deliverable 2

#### 🎯 Today's Goals

- [ ] Specific deliverable 1
- [ ] Specific deliverable 2

#### 🚧 Blockers

- None / [Specific blocker]

#### 📊 Metrics

- Code coverage: X%
- Bundle size: XKB
- Lighthouse: X/100
```

## Weekly Review Format

```markdown
### Week [N] Review

#### ✅ Completed

- Major milestone 1
- Major milestone 2

#### ⚠️ Delayed

- Item 1 (new date)

#### 📈 Metrics

- Features complete: X/Y
- Tests passing: X/Y
- Coverage: X%

#### 🎯 Next Week Focus

- Priority 1
- Priority 2
```

---

# PART 9: POST-LAUNCH ROADMAP

## Month 1: Stabilization

- Bug fixes from user feedback
- Performance optimization
- Documentation updates
- Support process refinement

## Month 2: Enhancement

- Mobile optimization
- Advanced AI features
- Additional integrations
- Power user features

## Month 3: Scale

- Enterprise features
- API for developers
- White-label options
- International expansion

---

# CONCLUSION: YOUR NORTH STAR

This master plan is your single source of truth for SignalDesk V3. It combines:

1. **The Vision:** Autonomous PR execution in one click
2. **The Architecture:** Modern, scalable, testable
3. **The Features:** AI-powered everything
4. **The Workplan:** 8 weeks to launch
5. **The Metrics:** Clear success criteria

**Remember the Core Promise:**
_From opportunity detection to complete campaign deployment in under 60 seconds._

Every decision should support this goal. When in doubt, refer back to this document.

**Start Date:** February 1, 2025  
**Launch Date:** April 1, 2025  
**Result:** The world's first truly autonomous PR platform

---

_This document is your North Star. Update it as you learn, but never lose sight of the vision._
