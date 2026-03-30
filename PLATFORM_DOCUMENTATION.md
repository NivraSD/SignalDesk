# SignalDesk V3 Platform - Complete Documentation

## Executive Summary

SignalDesk (codenamed "Nivria") is a communications intelligence and campaign management platform built with Next.js/React. It combines AI-driven strategic planning (NIV), real-time intelligence monitoring, crisis management, content execution, and campaign orchestration.

---

## 1. MAIN NAVIGATION TABS

The dashboard provides **7 main navigation tabs**:

| Tab | Icon | Color | Purpose |
|-----|------|-------|---------|
| NIV | Brain | #b8a0c8 | AI Strategic Advisor |
| Intelligence | Brain | #9d84ad | Intelligence Hub |
| Opportunities | Target | #cebcda | Opportunity Engine |
| Campaigns | TrendingUp | #b8a0c8 | Campaign Builder |
| Execute | Rocket | #9d84ad | Content Execution |
| Crisis | Shield | #ff4444 | Crisis Command Center |
| MemoryVault | Database | #cebcda | Organizational Memory |

---

## 2. NIV MODULE

**Location**: `/src/components/niv/`

### Purpose
AI-powered strategic advisor for conversational strategy development.

### Components
- `NivCanvasComponent.tsx` - Draggable chat interface (770x525px)
- `NivCommandCenter.tsx` - Command hub
- `NIVPanel.tsx` - Collapsible side panel
- `NivChatbot.tsx` - Conversation interface
- `NivStrategicDisplay.tsx` - Framework visualization
- `NIVResourcesPanel.tsx` - Capabilities and prompt library

### Capabilities
- Conversational strategic framework generation
- Discovery context capture (organization, competitors, market, assets, history)
- Strategic framework generation:
  - Objective and rationale
  - Narrative architecture (core story, supporting messages, proof points)
  - Execution blueprint (channels, timeline, resources)
  - Intelligence support
- Component handoff to downstream modules

### Data Types (`/src/types/niv-strategic.ts`)
```typescript
NivDiscoveryContext {
  organization, competitors, market, assets, history, session_context
}

NivStrategicFramework {
  discovery, strategy, narrative, execution, intelligence
}

ComponentHandoff {
  // Protocol for passing context to Campaign, Plan, Execute, Opportunity
}
```

---

## 3. INTELLIGENCE MODULE

**Location**: `/src/components/modules/IntelligenceModule.tsx` (85KB)

### Tabs

#### A. Synthesis
- Executive synthesis with Bloomberg-style UI
- Evidence layers with source attribution

#### B. Social Intelligence
- Twitter and Reddit real-time signals
- Sentiment analysis
- Time range filtering (1h, 24h, 7d)

#### C. Real-time Monitor
- Live keyword/topic monitoring
- Alert routing to Opportunities and Crisis
- Event detection and impact assessment

#### D. Predictions
- Stakeholder prediction dashboard
- Confidence scoring (0-100%)
- Impact levels (High/Medium/Low)
- Time horizons (1-week to 1-year)

#### E. Geo Intelligence
- Geographic signal monitoring
- Schema data extraction
- Location-based threat/opportunity assessment

#### F. Connections Dashboard
- Network analysis of entities
- Relationship mapping
- Influence scoring

### Data Types (`/src/types/predictions.ts`)
```typescript
IntelligenceTarget {
  type: 'competitor' | 'topic' | 'keyword' | 'influencer'
  name, description, metadata
}

Prediction {
  id, target_id, prediction_text
  confidence: number (0-100)
  time_horizon: '1-week' | '1-month' | '3-months' | '6-months' | '1-year'
  impact_level: 'high' | 'medium' | 'low'
  status: 'active' | 'validated' | 'invalidated' | 'expired'
}
```

---

## 4. OPPORTUNITIES MODULE

**Location**: `/src/components/modules/OpportunitiesModule.tsx` (48KB)

### V2 Opportunity Structure
```typescript
Opportunity {
  id: string
  title: string
  score: number (0-100)
  urgency: 'high' | 'medium' | 'low'

  strategic_context: {
    trigger_events: string[]
    market_dynamics: string
    why_now: string
    competitive_advantage: string
    time_window: string
    expected_impact: string
    risk_if_missed: string
    media_targeting?: {
      primary_journalist_types: string[]
      target_industries: string[]
      target_outlets: string[]
      beat_keywords: string[]
    }
  }

  execution_plan: {
    stakeholder_campaigns: StakeholderCampaign[]
    execution_timeline: {
      immediate: string[]
      this_week: string[]
      this_month: string[]
      ongoing: string[]
    }
    success_metrics: any[]
  }

  auto_executable?: boolean
  executed?: boolean
  presentation_url?: string
}
```

### Features
- Card-based opportunity browser
- Strategic context panel expansion
- Execution plan visualization
- One-click execution trigger
- Generated content preview/editing
- Download/export capabilities

---

## 5. CAMPAIGNS MODULE

**Location**: `/src/components/campaign-builder/`

### Campaign Builder Wizard - 6 Stages

| Stage | Name | Purpose |
|-------|------|---------|
| 1 | Intent Capture | Goal definition, org context, success criteria |
| 2 | Research | Intelligence gathering, competitive landscape |
| 3 | Positioning | Approach selection (PR, Vector, Geo Vector) |
| 4 | Blueprint | Multi-stage blueprint generation |
| 5 | Presentation | Visual presentation of strategy |
| 6 | Execution Manager | Campaign activation and monitoring |

### Campaign Types
1. **PR_CAMPAIGN** - Traditional media relations
2. **VECTOR_CAMPAIGN** - Strategic influence vectors
3. **GEO_VECTOR_CAMPAIGN** - Geographic targeting

### Components
- `CampaignBuilderWizard.tsx` - Main orchestrator
- `IntentCapture.tsx` - Goal definition
- `ResearchPresentation.tsx` - Research findings
- `BlueprintPresentation.tsx` - Strategy presentation
- `BlueprintV3Presentation.tsx` - Enhanced blueprint
- `PRBriefPresentation.tsx` - Media relations brief
- `GeoVectorBlueprintPresentation.tsx` - Geographic strategy
- `ExecutionManager.tsx` - Execution control

---

## 6. EXECUTE MODULE

**Location**: `/src/components/execute/` (20+ files)

### Tabs

#### A. Execute Tab
- Primary content creation interface
- Workspace switcher
- Quick create buttons

#### B. Content Library
- Folder-based organization
- Filter by type, status, theme, topic
- Execution tracking
- Download/export

#### C. Content Workspace
- Full-featured document editor
- AI assistant integration
- Memory Vault retrieval
- Save with status tracking

#### D. NIV Content Orchestrator
- Intelligent content generation
- Multi-piece batch generation
- Framework context preservation

### Content Types Supported
- Press releases
- Crisis responses
- Social posts
- Media pitches
- Executive statements
- Q&A documents
- Messaging frameworks
- Thought leadership
- Presentations
- Email campaigns
- Business proposals
- Market research
- Competitive analysis
- Partnership briefs
- Strategic recommendations

### Key Components
- `ExecuteTab.tsx` / `ExecuteTabProduction.tsx`
- `ContentLibraryWithFolders.tsx`
- `ContentWorkspace.tsx` (100KB)
- `NIVContentOrchestrator.tsx`
- `NIVContentAssistant.tsx`

---

## 7. CRISIS MODULE

**Location**: `/src/components/crisis/` and `/src/components/modules/CrisisCommandCenter.tsx`

### KEY CONCEPT: SINGLE CRISIS PLAN

The Crisis module is centered around **ONE crisis plan per organization**. This plan is:
- Generated once via CrisisPlanGenerator
- Saved to MemoryVault as content_type: 'crisis-plan'
- The focal point of the Crisis section until an actual crisis is activated
- Contains scenarios, team roles, and response protocols

### Components
- `CrisisCommandCenter.tsx` (34KB) - Main dashboard
- `CrisisPlanGenerator.tsx` - **3-step plan creation wizard**
- `CrisisPlanViewer.tsx` - View the single crisis plan
- `CrisisTimeline.tsx` - Event chronology (during active crisis)
- `CrisisTeamManager.tsx` - Role assignments
- `CrisisCommunications.tsx` - Message drafting
- `CrisisAIAssistant.tsx` - NIV crisis consultant
- `CrisisScenarioSelector.tsx` - Scenario selection for activation

### Crisis Plan Generator - 3 Steps

**Step 1: Basic Information**
- Industry
- Company Size (small/medium/large)
- Key Concerns (tags)
- Existing Protocols (optional)
- Additional Context (optional)

**Step 2: Crisis Team**
Default roles with customization:
- Crisis Response Leader (CEO or designated senior executive)
- Communications Director (Head of PR)
- Operations Manager (COO)
- Custom additional members

Each member has:
- Role
- Title
- Name
- Contact
- Responsibilities[]

**Step 3: Emergency Contacts**
- Name, Role, Phone, Email for external contacts

### Crisis Plan Output
Generated via `mcp-crisis` edge function and saved to MemoryVault:
```typescript
CrisisPlan {
  industry: string
  company_size: string
  team_members: TeamMember[]
  key_concerns: string[]
  existing_protocols: string
  emergency_contacts: EmergencyContact[]
  scenarios: CrisisScenario[]  // AI-generated based on industry
}
```

### Crisis Event Structure (Active Crisis)
```typescript
CrisisEvent {
  id: string
  organization_id: string
  crisis_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'monitoring' | 'active' | 'resolved'
  title: string
  description?: string
  started_at: string
  resolved_at?: string
  crisis_plan_id?: string  // Links to the single plan

  timeline: Array<{
    time: string
    type: string
    content: string
    actor: string
  }>

  decisions: Array<{
    time: string
    decision: string
    rationale: string
    actor: string
  }>

  communications: Array<{
    time: string
    stakeholder: string
    content: string
    status: string
  }>

  tasks: Array<{
    id: string
    title: string
    assignee: string
    status: string
    deadline?: string
  }>

  team_status: Record<string, {
    status: string
    role: string
    tasks?: string[]
  }>

  trigger_source?: string  // 'manual' or 'detection'
  trigger_data?: any
  social_signals: any[]
  media_coverage: any[]
  stakeholder_sentiment: Record<string, number>
}
```

### Two Modes
1. **Monitoring Mode** (Green header)
   - Shows "Crisis plan ready • All systems normal"
   - Buttons: "View Plan", "Generate Plan", "Activate Crisis"
   - Displays potential crisis alerts from intelligence monitoring
   - Polls every 30 seconds for crisis signals

2. **Active Crisis Mode** (Red header with pulse animation)
   - Shows crisis title, severity, elapsed time
   - Tabs: Dashboard, Timeline, Team, Communications, Plan
   - Buttons: "View Plan", "Deactivate"
   - Real-time tracking of decisions, communications, tasks

### Crisis Detection
- Checks `crisis_events` table for 'monitoring' status
- Checks `real_time_intelligence_briefs` for critical alerts
- Emits `crisisAlertsDetected` event for tab notification

---

## 8. MEMORYVAULT MODULE

**Location**: `/src/components/modules/MemoryVaultModule.tsx` (119KB - largest component)

### Tabs

#### A. Library
- Search and discovery
- Folder-based organization
- Content filtering by type, status, themes, topics, entities
- Metadata display (creation date, intelligence status, Gamma links)

#### B. Assets
- Brand asset management
- Logo, guideline, template storage
- Brand voice profile tracking

#### C. Analytics
- Content performance tracking
- Execution rate metrics
- Activity timeline
- Performance by content type

### Content Structure
```typescript
ContentItem {
  id: string
  title: string
  content_type: string
  content: any
  folder?: string
  themes?: string[]
  topics?: string[]
  entities?: any
  intelligence_status: 'pending' | 'processing' | 'complete' | 'failed'

  metadata?: {
    gamma_id?: string
    gamma_url?: string
    gamma_edit_url?: string
    pptx_url?: string
    campaign_presentation_id?: string
    opportunity_id?: string
    blueprint_id?: string
  }

  executed?: boolean
  executed_at?: string
  result?: {
    type: 'media_response' | 'engagement' | 'pickup' | 'other'
    value?: string | number
    notes?: string
  }
}
```

---

## 9. CANVAS SYSTEM

**Location**: `/src/components/canvas/InfiniteCanvas.tsx`

### Features
- Multi-component viewport management
- 14 draggable, resizable component types
- Zoom and pan controls (0.5x to 3x)
- Grid snapping (50px grid)
- Component z-index management
- Lock/unlock canvas state
- Persistent positioning (localStorage)

### Component Types
1. NIV Strategic Advisor (770x525)
2. Intelligence Module (950x730)
3. NIV Strategy (640x480)
4. NIV Resources/Capabilities (900x700)
5. NIV Prompt Library (900x700)
6. Predictions Dashboard (900x700)
7. Opportunities (800x600)
8. Execute (800x600)
9. Workspace (900x700)
10. Campaign Planner (1000x800)
11. Memory Vault (800x600)
12. Planning Module (800x600)
13. Crisis Center (800x600)
14. Crisis Advisor (800x600)

---

## 10. KEY WORKFLOWS

### Workflow 1: Strategic Framework (NIV)
```
User Input → NIV Discovery → Research →
Strategic Framework Generation → Component Handoff →
Execute (Campaign/Content/Planning)
```

### Workflow 2: Campaign Builder
```
Intent Capture → Research Pipeline → Positioning Selection →
Blueprint Generation → Presentation → Execution Activation
```

### Workflow 3: Content Execution
```
Strategic Framework → Content Orchestration →
Workspace Editing → Memory Vault Storage → Execution Tracking
```

### Workflow 4: Crisis Response
```
Crisis Detection → Team Activation → Plan Loading →
Timeline Management → Communication Execution → Resolution
```

### Workflow 5: Intelligence Synthesis
```
Multi-Source Monitoring → Signal Detection → Synthesis →
Opportunity/Prediction Generation → Alert Routing
```

---

## 11. API ENDPOINTS

### Organization Management
- `POST /api/organizations` - Create/list organizations
- `POST /api/organizations/[id]/profile` - Organization profile
- `POST /api/organizations/discover` - Intelligence discovery
- `POST /api/organizations/targets` - Manage intelligence targets

### Intelligence
- `POST /api/intelligence/search` - Intelligence search
- `POST /api/realtime-monitor` - Real-time monitoring
- `POST /api/social-intelligence` - Social signals
- `POST /api/geo/intelligence` - Geographic intelligence

### Content
- `POST /api/content-library` - Content management
- `POST /api/content-library/save` - Save content
- `POST /api/content-library/export-to-word` - Export

### Memory Vault
- `POST /api/memory-vault/save` - Save to vault
- `POST /api/memory-vault/list` - List content
- `GET /api/memory-vault` - Retrieve content

### Campaigns
- `POST /api/campaign-research-gatherer` - Research pipeline
- `POST /api/campaign-research-compiler` - Compile findings
- `POST /api/niv-campaign-orchestrator` - Campaign orchestration

### Content Generation
- `POST /api/build-presentation` - Presentation generation
- `POST /api/finalize-blueprint` - Blueprint finalization
- `POST /api/opportunities` - Opportunity management

---

## 12. TECH STACK

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **UI**: React 18
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI**: Claude API
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Hosting**: Vercel

---

## 13. FILE STRUCTURE

```
/src/
├── /app/
│   ├── /auth/ (login, signup, reset-password)
│   ├── /api/ (40+ endpoints)
│   ├── /settings/
│   └── /dashboard/ (main entry)
├── /components/
│   ├── /niv/ (10 files)
│   ├── /modules/ (13 main, 87 total)
│   ├── /campaign-builder/ (10 files)
│   ├── /execute/ (20+ files)
│   ├── /crisis/ (8 files)
│   ├── /canvas/
│   ├── /workspace/
│   ├── /predictions/ (2 files)
│   └── /command-center/ (4 files)
├── /types/
│   ├── strategic-planning.ts
│   ├── niv-strategic.ts
│   ├── content.ts
│   ├── predictions.ts
│   └── campaign-concept.ts
├── /lib/
│   └── /services/
│       ├── intelligenceService.ts
│       ├── campaignBuilderService.ts
│       ├── predictionTargetService.ts
│       └── embeddingService.ts
└── /stores/
    └── useAppStore.ts
```

---

## 14. LARGEST/MOST COMPLEX COMPONENTS

| Component | Size | Purpose |
|-----------|------|---------|
| MemoryVaultModule.tsx | 119KB | Comprehensive vault system |
| ContentWorkspace.tsx | 100KB | Document editing with AI |
| IntelligenceModule.tsx | 85KB | Multi-tab intelligence |
| StrategicPlanningModuleV3Complete.tsx | 87KB | Planning framework |
| ContentGenerator.tsx | 52KB | Content generation |
| OpportunitiesModule.tsx | 48KB | Opportunity engine |
| CrisisCommandCenter.tsx | 34KB | Crisis management |

---

## Summary

SignalDesk V3 is a complete communications intelligence platform with:

1. **7 main operational modules** (NIV, Intelligence, Opportunities, Campaigns, Execute, Crisis, MemoryVault)
2. **AI-powered strategic advisor** (NIV) for conversational planning
3. **Real-time intelligence synthesis** from web, social, and geographic sources
4. **6-stage campaign builder** from intent to execution
5. **Persistent organizational memory** with analytics
6. **20+ content types** with version control
7. **Crisis response** with team management and real-time coordination
8. **Infinite canvas interface** for multi-module operation
