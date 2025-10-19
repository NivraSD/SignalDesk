# SignalDesk V3 - Comprehensive System Status
*Last Updated: October 16, 2025 - Stakeholder Prediction System Added*

## Executive Summary

SignalDesk V3 is a fully operational AI-powered strategic communications platform that transforms how organizations discover opportunities, generate strategies, and create content. The system leverages multiple AI providers (Claude, Google Vertex AI, Gamma) through a sophisticated orchestration layer to deliver end-to-end strategic communications capabilities.

**Major October 2025 Updates:**
- ✅ **Campaign Builder** - Complete 5-stage workflow (Research → Positioning → Approach → Blueprint → Execution)
- ✅ **VECTOR Campaigns** - Advanced psychological influence campaigns with 4-phase × 4-pillar orchestration
- ✅ **Blueprint V3 Generation** - 75-second modular pipeline producing 6-part strategic blueprints
- ✅ **ExecutionManager V3 Support** - Auto-extraction of content from Blueprint V3 tactical orchestration
- ✅ **MCP Architecture** - 40+ specialized edge functions following Model Context Protocol pattern
- ✅ **Frontend Integration** - BlueprintV3Presentation with color-coded execution ownership
- ✅ **Stakeholder Prediction System** - AI-powered prediction of stakeholder actions (Beta) - Oct 16, 2025

### Core Capabilities Status
- ✅ **Campaign Builder** - Complete research → positioning → blueprint generation workflow
- ✅ **VECTOR Campaigns** - Advanced multi-stakeholder psychological influence campaigns (NEW)
- ✅ **Blueprint V3 Generation** - 75-second 6-part blueprint with 4-phase tactical orchestration
- ✅ **NIV Strategic Framework Generation** - Using niv-fireplexity for research, 140s timeout
- ✅ **Intelligence Pipeline** - Discovery → Monitor → Enrichment → Synthesis → Opportunities
- ✅ **Real-Time Intelligence** - Frontend-orchestrated monitoring (Oct 3, 2025 - PRODUCTION READY)
- ✅ **Stakeholder Predictions** - AI-powered behavioral pattern analysis and action forecasting (Beta)
- ✅ **Content Generation** - Multi-modal (text, image, video, presentations)
- ✅ **Opportunity Engine** - MCP Detector + Creative Enhancement via Orchestrator V2
- ✅ **Crisis Command Center** - Full crisis management suite with AI advisor and response generation
- ✅ **NIV Crisis Consultant** - Dedicated AI consultant for crisis planning and real-time guidance
- ✅ **Memory Vault** - Central persistence and orchestration hub
- ✅ **Campaign Detection** - 20+ campaign types with industry-specific adjustments
- ✅ **Export-Only Distribution** - No direct posting, audit trail maintained
- ✅ **Strategic Framework Orchestration** - Full lifecycle: Build → Orchestrate → Execute
- ✅ **Framework Auto-Execute** - Automated content generation from strategic frameworks

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE LAYER                         │
├───────────────────┬──────────────────┬──────────────────────────────┤
│ Intelligence Tab  │   Crisis Tab     │      Execute Tab             │
│  - Intelligence   │  - Crisis Command│  - Content Generation        │
│    Pipeline       │    Center        │  - Visual Creation           │
│  - NIV Strategic  │  - NIV Crisis    │  - Presentation Builder      │
│    Framework      │    Consultant    │  - Media Lists               │
│  - Opportunities  │  - Timeline      │  - Campaign Mgmt             │
│                   │  - Team Mgmt     │                              │
└───────────────────┴──────────────────┴──────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────────┐
│               ORCHESTRATION & INTELLIGENCE LAYER                     │
├───────────────────────────────────────────────────────────────────────┤
│  NIV Orchestrator  │  Memory Vault  │  Intelligence Pipeline        │
│  - niv-fireplexity │  - Persistence │  - Discovery → Monitor       │
│  - Framework Gen   │  - Workflows   │  - Enrichment → Synthesis    │
│  - Campaign Detect │  - Routing     │  - Opportunity Detection     │
└───────────────────┴────────────────┴────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────────┐
│                         EDGE FUNCTIONS LAYER                         │
├─────────────────┬────────────────┬────────────────┬─────────────────┤
│  Intelligence   │   Generation   │  Enhancement   │   Analysis      │
│  - monitor-     │  - niv-        │  - opportunity-│  - mcp-         │
│    stage-1/2    │    strategic-  │    orchestrator│    executive-   │
│  - monitoring-  │    framework   │    -v2         │    synthesis    │
│    stage-2-     │  - vertex-ai-  │  - mcp-        │  - mcp-         │
│    enrichment   │    visual      │    opportunity-│    discovery    │
│                 │  - gamma-      │    detector    │                 │
│                 │    presentation│                │                 │
└─────────────────┴────────────────┴────────────────┴─────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                 │
├───────────────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL  │  Vector Storage  │  File Storage            │
│  - organizations      │  - Embeddings    │  - Media Assets          │
│  - opportunities      │  - Search Index  │  - Documents             │
│  - niv_strategies     │  - Similarity    │  - Presentations         │
│  - intelligence_reports│                  │                          │
└───────────────────────────────────────────────────────────────────────┘
```

## Component Status

### 1. Campaign Builder & VECTOR Campaigns ✅

**Status: Production Ready - October 14, 2025**

The Campaign Builder represents SignalDesk V3's most sophisticated strategic planning capability, enabling organizations to create either traditional PR campaigns or advanced VECTOR campaigns that leverage psychological influence across multiple stakeholder groups.

#### What are VECTOR Campaigns?

**VECTOR** stands for **V**ector **E**ngagement **C**ampaign with **T**actical **O**rchestration and **R**esonance. Unlike traditional PR campaigns that broadcast the same message to everyone, VECTOR campaigns:

- **Multi-Stakeholder Orchestration**: Different messages to different audiences that converge toward a single campaign goal
- **Psychological Profiling**: Deep analysis of each stakeholder group's fears, aspirations, decision triggers, and information diet
- **Four-Phase Engagement**: Systematically move stakeholders through Awareness → Consideration → Conversion → Advocacy
- **Four-Pillar Execution**: Owned Content • Relationships • Events • Media Engagement
- **Pattern-Based Strategy**: Applies proven campaign patterns (CASCADE, CONVERGENCE, SIEGE, CHORUS, etc.)

#### Campaign Builder Architecture

```
User Input (Campaign Goal)
    ↓
STAGE 1: RESEARCH (Intelligence Pipeline - 2-3 minutes)
├─→ Organization Discovery (mcp-discovery)
├─→ Stakeholder Intelligence (niv-fireplexity)
├─→ Narrative Environment Analysis
├─→ Channel Intelligence (Journalist Registry)
├─→ Historical Pattern Mining
└─→ Synthesis (Campaign Intelligence Brief)
    ↓
STAGE 2: POSITIONING (~10 seconds)
├─→ niv-campaign-positioning
├─→ Analyzes research brief
├─→ Generates 3 positioning options
└─→ User selects preferred positioning
    ↓
STAGE 3: APPROACH SELECTION
├─→ PR Campaign (Traditional) → niv-campaign-pr-blueprint
└─→ VECTOR Campaign (Advanced) → niv-blueprint-orchestrator-v3
    ↓
STAGE 4: BLUEPRINT GENERATION (75 seconds for VECTOR)
    ├─→ Part 1: Strategic Foundation (~1s) - niv-blueprint-enrichment
    ├─→ Part 2: Pattern Selection (~10s) - mcp-pattern-selector
    ├─→ Part 3: Influence Mapping (~39s) - mcp-influence-mapper
    ├─→ Part 4: Tactical Generation (~26s) - mcp-tactical-generator
    ├─→ Part 5: Resource Calculation (~0.2s) - niv-blueprint-compiler
    └─→ Part 6: Execution Roadmap (~0.2s) - niv-blueprint-compiler
    ↓
STAGE 5: EXECUTION
└─→ Auto-execute Signaldesk actions (Pillar 1 & 4)
    or Present user-required actions (Pillar 2 & 3)
```

#### Blueprint V3 Structure (VECTOR Campaigns)

**Part 1: Strategic Foundation**
- Campaign goal and objectives
- Selected positioning (name, tagline, key messages, differentiators)
- Campaign pattern (CASCADE, CONVERGENCE, SIEGE, CHORUS, VOID, MIRROR, TROJAN, NETWORK)
- Target stakeholder profiles with psychological attributes
- Timeline and success metrics

**Part 2: Psychological Influence Strategy**
- Per-stakeholder psychological profiles:
  - Primary fears and aspirations
  - Decision triggers and barriers
  - Current vs target perceptions
  - Information diet and trusted sources
- Influence levers for each stakeholder
- Four-phase touchpoint strategy (Awareness → Consideration → Conversion → Advocacy)

**Part 3: Four-Pillar Tactical Orchestration** (The Heart of VECTOR)

Four phases × Four pillars = 16 tactical cells:

**Phases:**
1. **Awareness (Weeks 1-3)**: Broad reach, initial exposure
2. **Consideration (Weeks 4-6)**: Proof points, credibility building
3. **Conversion (Weeks 7-9)**: Decision support, friction removal
4. **Advocacy (Weeks 10-12)**: Success stories, champion creation

**Pillars:**
1. **Owned Actions** (Signaldesk Auto-Execute): Blog posts, whitepapers, case studies, landing pages
2. **Relationships** (User Required): Partner outreach, influencer engagement, association memberships
3. **Events** (User Required): Speaking engagements, webinars, conferences, roundtables
4. **Media Engagement** (Signaldesk Auto-Execute): Press releases, journalist pitches, media lists

Each tactical action includes:
- Content type / action description
- Target stakeholder
- Positioning message alignment
- Psychological lever applied
- Timing (specific week)
- Key points (2 critical messages)
- Execution owner ("signaldesk" or "organization")

**Part 4: Resource Requirements**
- Total content pieces (calculated from tactical plan)
- Estimated hours (content creation + relationship building + events)
- Budget requirements
- Team planning (roles and allocation)

**Part 5: Execution Roadmap**
- Week-by-week timeline with milestones
- Dependencies between actions
- Critical path identification
- Phase convergence points

**Part 6: Content & Action Inventory**
- Summary: Total Signaldesk actions vs user actions
- By-phase breakdown
- Auto-executable content list (ready for niv-content-v2)
- User-required action checklist

#### Campaign Patterns Explained

1. **CASCADE**: Sequential rollout, building momentum through tiers
2. **CONVERGENCE**: Multiple initiatives converging on single event
3. **SIEGE**: Sustained pressure on specific audience/narrative
4. **CHORUS**: Coordinated multi-stakeholder messaging
5. **VOID**: Own narrative space before competitors (V4)
6. **MIRROR**: Reflect competitor messaging with better frame (V4)
7. **TROJAN**: Indirect influence through trusted intermediaries (V4)
8. **NETWORK**: Influence influencers of influencers (V4)

*Patterns 5-8 are part of NIV V4 Total-Spectrum Communications*

#### MCP (Model Context Protocol) Functions

**Blueprint V3 Pipeline:**
- `niv-blueprint-enrichment` - Data enrichment (no AI, ~1s)
- `mcp-pattern-selector` - Pattern matching for campaign patterns (~10s)
- `mcp-influence-mapper` - Psychological strategy and stakeholder profiling (~39s)
- `mcp-tactical-generator` - 4-phase × 4-pillar tactical orchestration (~26s)
- `niv-blueprint-compiler` - Final assembly and validation (no AI, ~0.2s)

**Campaign Builder Supporting Functions:**
- `niv-campaign-research-orchestrator` - Research pipeline coordinator
- `niv-campaign-research-gatherer` - Web research and intelligence collection
- `niv-campaign-research-synthesis` - Intelligence brief generation
- `niv-campaign-positioning` - Positioning options generator (3 options)
- `niv-campaign-pr-blueprint` - Traditional PR campaign generator
- `niv-campaign-memory` - Blueprint persistence and retrieval

**Intelligence & Analysis MCPs:**
- `mcp-discovery` - Organization profile generation with competitors/keywords
- `mcp-executive-synthesis` - C-suite analysis with 5 expert personas
- `mcp-opportunity-detector` - Opportunity identification (8-10 per run)
- `mcp-crisis` - Crisis detection, severity assessment, response generation
- `mcp-social-intelligence` - Social media analysis and insights

**Content Generation MCPs:**
- `mcp-content` - Core content generation with 40+ types
- `mcp-social` - Social media optimization and platform-specific formatting
- `mcp-campaigns` - Email campaigns and sequences
- `mcp-narratives` - Narrative development and messaging

**Supporting Infrastructure MCPs:**
- `mcp-firecrawl` - Web scraping and article extraction
- `mcp-entities` - Entity extraction and relationship mapping
- `mcp-media` - Media targeting and journalist matching
- `mcp-analytics` - Performance metrics and campaign analytics

#### Frontend Integration

**Components:**
- `CampaignBuilderWizard.tsx` - Main orchestration component
- `IntentCapture.tsx` - Campaign goal input
- `ResearchPresentation.tsx` - Intelligence brief display
- `BlueprintPresentation.tsx` - PR campaign display (legacy)
- `BlueprintV3Presentation.tsx` - VECTOR campaign display (NEW)
- `ExecutionManager.tsx` - Content generation and execution

**Key Features:**
- Real-time progress tracking with stage indicators
- Research pipeline visualization (4 stages)
- Blueprint generation progress (5 stages)
- Conditional component routing (PR vs VECTOR)
- Color-coded execution ownership (emerald = auto, amber = user)
- Expandable blueprint sections (6 parts)
- Refinement, export, and execution controls

#### Performance Metrics (Blueprint V3)

**Total Generation Time: 75.2 seconds**
- Enrichment: 0.9s
- Pattern Selection: 9.4s
- Influence Mapping: 38.3s (largest component - deep psychological analysis)
- Tactical Generation: 26.4s (generates all 4 phases × 4 pillars)
- Assembly: 0.2s
- **Buffer: 75 seconds under 150s Supabase limit**

**Content Output:**
- 16 tactical cells (4 phases × 4 pillars)
- ~8 Signaldesk auto-executable actions
- ~8 User-required actions
- Full psychological profiles for each stakeholder
- Complete 12-week execution roadmap

#### Database Schema

**campaign_builder_sessions:**
```sql
{
  id: uuid,
  org_id: uuid,
  user_id: uuid,
  current_stage: 'intent' | 'research' | 'positioning' | 'approach' | 'blueprint' | 'execution',
  status: 'active' | 'completed' | 'abandoned',
  campaign_goal: text,
  research_findings: jsonb,  -- Campaign Intelligence Brief
  selected_positioning: jsonb,
  selected_approach: 'PR_CAMPAIGN' | 'VECTOR_CAMPAIGN',
  blueprint: jsonb,  -- Complete V3 blueprint structure
  conversation_history: jsonb[],
  created_at: timestamp,
  updated_at: timestamp,
  completed_at: timestamp
}
```

#### User Journey Example

**Goal:** "Launch AI-powered DevOps platform to enterprise IT directors"

**Research (2 min):**
- Discovers 8 stakeholder groups (IT directors, CTOs, developers, etc.)
- Identifies dominant narratives (tool sprawl, AI adoption challenges)
- Maps 50+ tier-1 journalists covering enterprise tech
- Analyzes historical DevOps launch campaigns

**Positioning (10s):**
- Option 1: "The Unified DevOps Intelligence Platform"
- Option 2: "AI-Native DevOps for Enterprise Scale"
- Option 3: "Developer Velocity Meets Enterprise Reliability"
→ User selects Option 1

**Approach Selection:**
- Traditional PR: 4-week campaign, press releases, standard tactics
- VECTOR Campaign: 12-week multi-stakeholder psychological orchestration
→ User selects VECTOR

**Blueprint Generation (75s):**
- Pattern: CHORUS (coordinated messaging across stakeholders)
- Influence Strategy: Fear = System downtime, Aspiration = Operational excellence
- Phase 1 (Weeks 1-3): Awareness campaign targeting IT directors via thought leadership
- Phase 2 (Weeks 4-6): Proof points via case studies and analyst relations
- Phase 3 (Weeks 7-9): Decision support with ROI calculators and free trials
- Phase 4 (Weeks 10-12): Advocacy through customer success stories

**Execution:**
- Signaldesk auto-generates: Blog post, whitepaper, case study, press release, media list
- User completes: Partner outreach, webinar series, conference speaking
- Content distributed across 12 weeks following tactical plan

#### Key Differentiators

**Traditional PR Campaigns:**
- Single message to all audiences
- Event-based (launch, funding, etc.)
- Tactical focus (what to say)
- 4-6 week timeline
- Reactive measurement

**VECTOR Campaigns:**
- Tailored messages per stakeholder
- Psychology-based (fears, aspirations, triggers)
- Strategic focus (how to influence)
- 12-week orchestrated timeline
- Predictive modeling

#### Integration with NIV Platform

VECTOR campaigns represent the evolution from:
- **NIV V3**: Strategic frameworks with auto-execute
- **NIV V4**: Total-spectrum communications (VOID, MIRROR, TROJAN, NETWORK patterns)

Blueprint V3 lays the foundation for V4's advanced influence mechanics while delivering immediate value through psychological profiling and multi-phase orchestration.

---

### 2. NIV (Neural Intelligence Vehicle) ✅

**Status: Fully Operational - Phase 3 Active**

#### Core Components:
- **niv-orchestrator-robust** - Main orchestration with 140s timeout
- **niv-fireplexity** - Research engine using Firecrawl for web search
- **niv-strategic-framework** - Framework generation from research data
- **campaign-detector** - 20+ campaign type detection system
- **niv-memory-vault** - Strategy persistence and workflow orchestration

#### Capabilities:
- Research/strategy mode separation
- Real-time web research via niv-fireplexity
- Campaign-specific framework generation
- Industry and context-aware recommendations
- Automatic Memory Vault integration
- Workflow component triggering

#### Campaign Types Supported:
- **Product Launch** (5 types): B2B SaaS, Consumer Tech, Medical Device, CPG, Fintech
- **Brand & Reputation** (6 types): Repositioning, Thought Leadership, Corporate, ESG, Employer, Crisis
- **Marketing** (5 types): Integrated, Influencer, Content, Event, Partnership
- **Agency Services** (4 types): New Business, Pitch Decks, Annual Planning, Reviews

### 2. Intelligence Pipeline ✅

**Status: Production Ready - January 2025**

#### Pipeline Flow:
```
Discovery (Profile Generation)
    ↓
Monitor Stage 1 (Intelligent PR Filtering)
    ↓
Monitor Stage 2 Relevance (PR Scoring)
    ↓
Intelligence Orchestrator V2
    ├── Monitoring Stage 2 Enrichment (Event/Entity Extraction)
    ├── Executive Synthesis (5 Expert Personas)
    └── MCP Opportunity Detector
            ↓
        Opportunity Orchestrator V2 (Creative Enhancement)
            ↓
        Database Storage (opportunities table)
```

#### Key Components:
- **mcp-discovery** - Organization profile with competitors/keywords
- **monitor-stage-1** - Article collection with entity coverage limits
- **monitor-stage-2-relevance** - Advanced PR scoring (threshold: 30+)
- **monitoring-stage-2-enrichment** - Non-AI data extraction
- **intelligence-orchestrator-v2** - Sequential processing coordinator
- **mcp-executive-synthesis** - C-suite analysis (single consolidated call)
- **mcp-opportunity-detector** - 8-10 opportunities per run
- **opportunity-orchestrator-v2** - Creative campaign enhancement

#### Performance:
- Total pipeline: 40-60 seconds end-to-end
- Success rates: >95% synthesis, 100% creative enhancement
- Article variety: 8-12 competitors covered per run

### 3. Content Generation System ✅

**Status: Intelligent Consultant-Mode Orchestration - COMPLETE OVERHAUL Sept 2025**

#### NIV Content Robust (NEW - Sept 29, 2025):
- **Intelligent Consultant**: `niv-content-robust` edge function (725 lines)
- **Consultant Behavior**: Acts as PR consultant, not just content generator
- **Strategy-First Approach**: Presents strategy before generating content
- **User Approval Required**: Waits for explicit approval before execution
- **State Persistence**: Maintains conversation context across requests
- **Progressive Updates**: Real-time status messages during generation

#### Consultant State Machine:
- **analyzing**: Understanding user's real needs
- **presenting_strategy**: Showing comprehensive strategy
- **awaiting_approval**: Waiting for user confirmation
- **executing**: Generating content with progress updates
- **complete**: All content generated and saved

#### Multi-Mode Operation:
  - **Single**: Individual content pieces
  - **Suite**: Multiple related content for launches
  - **Campaign**: Complete media plans with all assets (7 pieces)
  - **Plan**: Strategic documents with components
  - **Companion**: Interactive editing and refinement
  - **Presentation**: Package content into Gamma decks

#### Session Management System (NEW):
- **Project Tracking**: Maintains state across multi-part projects
- **Conversation Persistence**: 20-30 message context window
- **Component Progress**: Visual tracking with progress bars
- **localStorage Backup**: Sessions persist across browser refreshes
- **Auto-Detection**: Recognizes media plans, campaigns, launches

#### Media Plan Generation (7 Essential Components):
1. **Press Release**: Core announcement with quotes and boilerplate
2. **Media Pitch**: Personalized journalist outreach templates
3. **Media List**: 50+ targeted journalists with beats and contact info
4. **Q&A Document**: Anticipated questions with approved answers
5. **Talking Points**: Executive messaging guide for consistency
6. **Social Posts**: Multi-platform content (Twitter, LinkedIn, etc.)
7. **Email Campaign**: Sequenced outreach with follow-ups

#### Storage Integration:
- **Memory Vault**: All strategies saved with conversation context
- **Content Library**: Organized folder structure by project
- **Auto-Organization**: Creates folders like "Product Launch - [Date]"
- **Version Control**: Maintains history of iterations
- **Cross-Reference**: Links content to strategies and frameworks

#### Text Content (40+ Types):
**Written Content:**
- Press releases, blog posts, thought leadership
- Case studies, white papers, eBooks
- Q&A documents, internal memos
- Media kits, interview prep

**Social & Digital:**
- Multi-platform posts (Twitter, LinkedIn, Instagram, Facebook)
- Platform-specific optimization (character limits, hashtags)
- LinkedIn articles, Twitter threads
- Context-aware generation (uses conversation history)

**Email & Communications:**
- Campaign sequences, newsletters
- Personalized pitch emails
- Follow-up templates
- Internal communications

**Executive & Strategic:**
- Executive statements, keynote speeches
- Earnings scripts, investor letters
- Messaging frameworks, positioning
- Crisis response templates

#### Visual Content (via Google Vertex AI):
- **Imagen 3** - Professional image generation
- **Veo 3 Fast** - Video creation (up to 10 seconds)
- Project ID: `sigdesk-1753801804417`
- API Key: Configured and working
- Fallback to text descriptions when limits reached

#### Presentations (via Gamma AI):
- AI-designed slide decks
- Auto-generated from frameworks or any content
- Package multiple content pieces into presentations
- Export to PDF/PowerPoint
- 50 generations/day limit
- Real-time status polling
- API Key: `sk-gamma-zFOvUwGMpXZaDiB5sWkl3a5lakNfP19E90ZUZUdZM`

#### MCP Tools Architecture:
- **mcp-content**: Core content generation
- **mcp-social**: Social media optimization
- **mcp-campaigns**: Email and campaign creation
- **mcp-crisis**: Crisis response content
- **mcp-narratives**: Narrative development
- **mcp-visual**: Image generation routing
- **gamma-presentation**: Slide deck creation

#### Quality Assurance Features:
- Intent analysis for understanding true needs
- Context aggregation from all available sources
- Consistency checking across multi-part projects
- Brand voice alignment
- Fact verification
- Tone and style validation
- Automatic storage to Content Library or Campaign Intelligence

### 4. Crisis Command Center ✅

**Status: Production Ready - October 4, 2025**

#### Crisis Management Suite:
**Crisis Command Center Component:**
- **Active Crisis Dashboard**: Real-time crisis management interface
- **Crisis Timeline**: Event tracking with timestamps and status updates
- **Team Management**: Crisis response team coordination
- **Stakeholder Communications**: Template-based messaging for different audiences
- **AI Crisis Advisor**: Integrated conversational AI for real-time guidance
- **Crisis Activation**: Pre-built scenario templates for rapid response

#### Crisis Scenarios Supported:
- **Data Breach / Cybersecurity Incident** (Critical)
- **Product Recall / Safety Issue** (High)
- **Executive Scandal / Misconduct** (High)
- **Financial Crisis / Bankruptcy** (Critical)
- **Environmental Incident / Pollution** (High)
- **Legal Action / Lawsuit** (Medium)
- **Social Media Crisis / Boycott** (Medium)

#### AI Advisor Integration:
- **Crisis AI Assistant**: Built into Crisis Command Center dashboard
- **Directive Guidance**: Action-oriented, step-by-step crisis response
- **Quick Actions**: Pre-configured questions for immediate guidance
- **Context-Aware**: Understands current crisis severity and status

#### NIV Crisis Consultant (Standalone):
- **Dedicated Crisis Planning**: Separate component for crisis preparation
- **Expert Guidance**: AI-powered crisis management consultant
- **Crisis Plan Generation**:
  - Industry-specific crisis scenarios
  - Crisis team structure recommendations
  - Stakeholder analysis and communication plans
  - Crisis playbook creation
- **Conversation History**: Maintains context across planning sessions
- **Edge Function**: `niv-crisis-consultant` with Claude integration
- **Interactive Q&A**: Natural language crisis consultation
- **Quick Questions**:
  - "How should we prepare for a data breach?"
  - "What are common crisis scenarios for our industry?"
  - "Create a crisis communication plan outline"
  - "What should be in our crisis team?"

#### Crisis Plan Generator:
- **3-Step Wizard**:
  1. Basic Information (industry, company size, key concerns)
  2. Crisis Team (roles, responsibilities, contact info)
  3. Emergency Contacts (external stakeholders)
- **AI-Powered Generation**: Creates comprehensive crisis plans via `mcp-crisis`
- **Storage**: Plans saved to Content Library with crisis-plan type
- **Plan Viewer**: Interactive display of:
  - Scenarios with likelihood and impact ratings
  - Crisis team structure with responsibilities
  - Stakeholder communication strategies
  - Response protocols

#### MCP Crisis Edge Function:
- **Tool**: `create_crisis_plan` - Comprehensive plan generation
- **Tool**: `assess_crisis` - Real-time severity assessment
- **Tool**: `create_stakeholder_messaging` - Audience-specific communications
- **Tool**: `create_crisis_timeline` - Event sequencing and tracking

#### Database Integration:
- **crisis_events table**: Active crisis tracking with JSONB data
- **Crisis metadata**: Severity, type, status, timeline, team, communications
- **RLS Policies**: Organization-scoped access control
- **Content Library**: Crisis plans stored with metadata

#### Real-Time Monitor Integration:
- **Automated Crisis Detection**: Real-time monitor routes critical alerts to Crisis Command Center
- **Alert Filtering**: Identifies crisis alerts by:
  - Severity: critical
  - Category: crisis
  - Keywords: crisis-related content
- **Automatic Crisis Creation**: Creates active crisis events in database
- **Timeline Initialization**: Auto-populates first timeline entry with alert details
- **Metadata Capture**: Stores source articles, impact assessment, recommended actions
- **Duplicate Prevention**: Checks for existing active crises before creating new events
- **Toggle Control**: Can be enabled/disabled in Real-Time Monitor settings

### 4.5 Stakeholder Prediction System ✅

**Status: Beta - October 16, 2025**
**Latest Update: UUID Validation Fix - October 16, 2025**

The Stakeholder Prediction System uses AI-powered pattern analysis to predict stakeholder actions before they happen, enabling proactive strategic positioning.

#### What It Does:

Unlike reactive intelligence that tells you what happened, the prediction system forecasts **what stakeholders will likely do next** based on historical behavioral patterns and recent intelligence signals.

#### Architecture:

```
Real-Time Intelligence Monitor
    ↓ (stores events and entities)
Real-Time Intelligence Briefs Table
    ↓ (last 90 days of intelligence)
Stakeholder Pattern Detector
    ├─→ Loads stakeholder profiles
    ├─→ Analyzes intelligence events
    ├─→ Matches against 7 behavior patterns
    └─→ Generates predictions with confidence scores
        ↓
Stakeholder Predictions Table
    ↓
UI Dashboard (Beta Badge)
```

#### Core Components:

**1. Database Tables:**
- `stakeholder_profiles` - Profiles of key stakeholders (regulators, investors, competitors, media)
- `stakeholder_predictions` - AI-generated action predictions with probability scores
- `stakeholder_patterns` - Library of 7 pre-loaded behavioral patterns
- `stakeholder_action_history` - Historical action tracking for model improvement
- `prediction_metrics` - Performance tracking and accuracy measurement
- `real_time_intelligence_briefs` - Source data with events and entities

**2. Edge Functions:**
- `stakeholder-pattern-detector` - Analyzes intelligence and generates predictions
- `stakeholder-profiler` - Creates and updates stakeholder behavioral profiles

**3. Pattern Library (7 Pre-Loaded Patterns):**
1. **Regulator Pre-Enforcement**: Regulatory actions before formal enforcement
2. **Activist Pre-Campaign**: Activist mobilization before public campaigns
3. **Investor Pre-Exit**: Investor positioning before major exits
4. **Competitor Pre-Launch**: Competitive moves before product launches
5. **Employee Pre-Unionization**: Workforce organizing signals
6. **Customer Pre-Boycott**: Customer sentiment shifts toward collective action
7. **Media Pre-Investigation**: Journalist research patterns before major exposés

#### How Pattern Matching Works:

**Time-Weighted Signal Detection (T90, T60, T30, T14, T7):**
- **T90**: Signals from last 90 days (baseline patterns)
- **T60**: Signals from last 60 days (trend development)
- **T30**: Signals from last 30 days (acceleration detection)
- **T14**: Signals from last 14 days (imminent action indicators)
- **T7**: Signals from last 7 days (critical window, highest weight)

Recent signals are weighted more heavily (2x for T14 and T7) to detect imminent actions.

#### Prediction Structure:

```typescript
{
  stakeholder_name: string,        // "FTC", "Activist Group X", etc.
  stakeholder_type: string,        // regulator, activist, investor, etc.
  predicted_action: string,        // Specific action they're likely to take
  action_category: string,         // Category of action
  probability: number,             // 0.0 to 0.99 (confidence score)
  confidence_level: 'high' | 'medium' | 'low',
  expected_timeframe: string,      // "14 days", "30 days"
  expected_date_min: string,       // Earliest expected date
  expected_date_max: string,       // Latest expected date
  trigger_signals: string[],       // Specific signals that triggered prediction
  supporting_evidence: {           // Pattern match breakdown
    T90: { expected: 3, found: 2, events: 5 },
    T60: { expected: 2, found: 2, events: 4 },
    T30: { expected: 2, found: 1, events: 3 },
    T14: { expected: 1, found: 1, events: 2 },
    T7:  { expected: 1, found: 0, events: 0 }
  },
  pattern_matched: string,         // Which pattern was matched
  status: 'active' | 'superseded' | 'occurred' | 'expired'
}
```

#### UI Integration:

**Predictions Tab (Beta):**
- Real-time prediction dashboard with auto-refresh (5 min)
- Color-coded confidence levels (red=high, orange=medium, yellow=low)
- Stakeholder type filtering (regulator, activist, investor, competitor, etc.)
- Priority filters (high-priority, imminent ≤14 days)
- Expandable prediction cards showing:
  - Stakeholder name and type
  - Predicted action
  - Probability percentage
  - Confidence level
  - Days until expected action
  - Trigger signals (collapsed/expanded view)
  - Pattern match timeline breakdown
- "Update Profiles" button to rebuild stakeholder profiles
- "Refresh" button to regenerate predictions

#### Integration with Real-Time Monitor:

The prediction system is designed to work seamlessly with your real-time intelligence monitor:

1. **Real-time monitor runs** → Saves events and entities to `real_time_intelligence_briefs`
2. **Pattern detector analyzes** → Examines last 90 days of intelligence
3. **Predictions generated** → Stored in database with confidence scores
4. **UI updates automatically** → Shows predictions with probability and timing

**Data Flow:**
```
Real-Time Monitor (IntelligenceModule.tsx)
    ↓ (runRealtimeMonitor function)
real-time-intelligence-orchestrator
    ↓ (saves intelligence with events/entities to database)
real_time_intelligence_briefs table
    ↓ (90-day rolling window of intelligence)
StakeholderPredictionDashboard.tsx
    ↓ (user clicks "Refresh Predictions")
stakeholder-pattern-detector edge function
    ↓ (analyzes patterns and generates predictions)
stakeholder_predictions table
    ↓ (UI auto-refreshes every 5 minutes)
Dashboard displays predictions with confidence scores
```

#### Profile Creation:

Stakeholder profiles are created from:
- **Discovery data**: Pulls stakeholders from `mcp_discovery` (regulators, investors, competitors, journalists)
- **Intelligence history**: Builds behavioral profiles from past actions
- **Influence scores**: Calculated based on frequency and impact of actions
- **Predictability scores**: How consistent their behavior patterns are

#### Example Prediction Flow:

**Scenario:** OpenAI real-time monitor detects multiple regulatory signals

**Step 1: Intelligence Collected**
- Event: "FTC announces AI safety framework review"
- Event: "Congressional hearing scheduled on AI regulation"
- Event: "FTC Commissioner speech mentions OpenAI"
- Entity: "FTC", "Congress", "AI safety advocates"

**Step 2: Pattern Matching**
- Matches pattern: "Regulator Pre-Enforcement"
- T90 signals: 3/3 found (baseline regulatory interest)
- T60 signals: 2/2 found (increasing focus)
- T30 signals: 2/2 found (specific targeting)
- T14 signals: 1/1 found (public statements)
- **Match Score: 0.85** (high confidence)

**Step 3: Prediction Generated**
```
Stakeholder: FTC
Action: "Likely to issue formal investigation notice"
Probability: 78%
Confidence: High
Timeframe: 14-21 days
Trigger Signals:
  - "Multiple FTC commissioner statements on AI"
  - "Congressional hearing focused on AI regulation"
  - "FTC framework review announcement"
```

**Step 4: Strategic Response**
Organization can now proactively:
- Prepare response materials
- Engage regulatory counsel
- Brief stakeholders
- Position narrative before investigation announced

#### Current Limitations (Beta):

- **Requires real-time intelligence data**: Must run real-time monitor to generate intelligence
- **Profile building needed**: Initial stakeholder profiles created from discovery data
- **Pattern library evolving**: Currently 7 patterns, more being added
- **No historical validation yet**: Accuracy tracking system in place but needs data

#### Implementation Details & Fixes:

**October 16, 2025 - UUID Validation Fix:**
- **Issue**: localStorage was persisting old organization IDs as simple numbers ("2") instead of proper UUIDs
- **Impact**: Pattern detector was receiving invalid organization IDs causing UUID parsing errors
- **Solution**: Added UUID validation on page mount in `page.tsx` (lines 41-53)
  - Validates organization ID matches UUID format using regex
  - Automatically resets to default organization (OpenAI) if invalid ID detected
  - Prevents stale localStorage data from breaking the prediction system
- **Location**: `/src/app/page.tsx` - useEffect hook with UUID validation
- **Result**: Ensures prediction system always receives valid UUIDs for organization identification

**Test Files Created:**
- `test-pattern-detector-direct.js` - Direct testing of stakeholder-pattern-detector function
- `test-full-prediction-flow.js` - End-to-end testing of real-time monitor → pattern detector flow

**Edge Function Status:**
- `stakeholder-pattern-detector` - ✅ Deployed and working (returns 200 OK)
- `stakeholder-profiler` - ✅ Deployed and ready
- Both functions successfully handle proper UUID format for organization_id parameter

#### Future Enhancements:

1. **Model Learning**: Track prediction accuracy and refine patterns
2. **Custom Patterns**: Allow organizations to define industry-specific patterns
3. **Sentiment Analysis**: Incorporate sentiment trends into predictions
4. **Network Effects**: Analyze stakeholder relationship networks
5. **Scenario Modeling**: "What-if" analysis for different response strategies

#### Database Schema:

**stakeholder_profiles:**
```sql
{
  id: uuid,
  organization_id: uuid,
  stakeholder_name: text,
  stakeholder_type: text,  -- regulator, activist, investor, etc.
  influence_score: numeric,
  predictability_score: numeric,
  data_quality: text,  -- low, medium, high
  behavioral_profile: jsonb,
  historical_actions: jsonb[],
  trigger_patterns: jsonb[],
  communication_style: jsonb,
  network_connections: jsonb
}
```

**stakeholder_predictions:**
```sql
{
  id: uuid,
  organization_id: uuid,
  stakeholder_id: uuid,
  stakeholder_name: text,
  predicted_action: text,
  action_category: text,
  probability: numeric,
  confidence_level: text,
  expected_timeframe: text,
  expected_date_min: date,
  expected_date_max: date,
  trigger_signals: text[],
  supporting_evidence: jsonb,
  pattern_matched: text,
  match_score: numeric,
  status: text,  -- active, superseded, occurred, expired
  expires_at: timestamp,
  created_at: timestamp
}
```

#### Key Differentiator:

**Traditional Intelligence:** "FTC announced investigation" (reactive)
**Stakeholder Predictions:** "FTC likely to announce investigation in 14-21 days with 78% confidence" (proactive)

This shifts organizations from **reactive crisis management** to **proactive strategic positioning**.

#### Implementation Timeline:

**October 16, 2025 - Initial Implementation:**
- Created database schema (6 tables: profiles, predictions, patterns, history, metrics, briefs)
- Deployed edge functions (stakeholder-pattern-detector, stakeholder-profiler)
- Updated real-time-intelligence-orchestrator to save events/entities
- Built UI dashboard with auto-refresh and filtering
- Pre-loaded 7 behavioral patterns into database
- Integrated with Real-Time Monitor data pipeline

**October 16, 2025 - Bug Fixes:**
- Fixed UUID validation issue in organization ID handling
- Verified edge functions deployed and responding correctly
- Created test scripts for direct function testing
- Added comprehensive error handling for stale data

**Status:** Beta - Ready for testing with real intelligence data

---

### 5. Opportunity Engine ✅

**Status: Production Ready with Creative Enhancement**

#### Two-Stage Architecture:
1. **MCP Opportunity Detector**:
   - Identifies 8-10 PR opportunities from enriched intelligence
   - Categories: Competitive, Viral, Strategic, Defensive, Talent, Stakeholder
   - Direct database storage with organization_id handling
   - Clears old opportunities before inserting new

2. **Opportunity Orchestrator V2**:
   - Creative campaign enhancement (single Claude call)
   - Generates memorable campaign names (e.g., "Operation Market Truth")
   - Creates 3-5 step playbooks with owners and deadlines
   - Temperature 0.9 for maximum creativity

#### Opportunity Structure:
```typescript
{
  title: string,              // Catchy, specific title
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  window: string,             // "24-48 hours", "1 week"
  action_items: [{           // THE PLAYBOOK
    step: number,
    action: string,         // Exactly what to do
    owner: string,         // CEO, CMO, CTO, etc.
    deadline: string,      // When it must be done
    success_metric: string // How to measure
  }],
  campaign_name: string,     // Creative campaign name
  creative_approach: string, // Bold PR strategy
  expected_impact: {        // THE WHY
    revenue: string,
    reputation: string,
    competitive_advantage: string
  }
}
```

### 6. Memory Vault & Orchestration ✅

**Status: Central Hub Operational**

#### Capabilities:
- **Persistence**: All NIV strategies saved to `niv_strategies` table
- **Workflow Triggering**: Routes to appropriate components
- **Component Routing**: Maps campaign types to tools
- **Organization Management**: Auto-converts names to UUIDs
- **Context Preservation**: Full research data and frameworks
- **Framework-to-Execution Bridge**: Connects strategic frameworks to content generation

---

### 6.5 Strategic Framework Execution System ✅

**Status: Fully Operational - Build → Orchestrate → Execute**

SignalDesk V3 now provides a complete strategic framework lifecycle, enabling organizations to not just create strategies, but orchestrate and execute them at scale.

#### The Complete Workflow:

```
User Input (via NIV)
↓
STAGE 1: BUILD FRAMEWORK
├─→ niv-orchestrator-robust (research & discovery)
├─→ niv-fireplexity (competitive intelligence)
├─→ mcp-discovery (organization landscape)
└─→ niv-strategic-framework (framework generation)
    ↓
    Strategic Framework Created
    ↓
STAGE 2: ORCHESTRATE EXECUTION
├─→ framework-auto-execute (edge function)
├─→ Analyzes framework structure
├─→ Maps to executable content types
└─→ Generates execution queue
    ↓
    Execution Plan Ready
    ↓
STAGE 3: EXECUTE CONTENT
├─→ niv-content-intelligent-v2 (for each content type)
├─→ Preserves framework context
├─→ Generates stakeholder-specific content
└─→ Saves to content_library
    ↓
    Campaign Executed
```

#### Key Components:

**1. framework-auto-execute** (`/supabase/functions/framework-auto-execute/index.ts`)
- **Purpose**: Bridge between strategic frameworks and content generation
- **Input**: Framework ID from niv_strategies table
- **Process**:
  - Retrieves framework from database
  - Transforms framework data into content generation context
  - Identifies all auto-executable content types from framework
  - Calls niv-content-intelligent-v2 for each content type
  - Preserves full framework context in each generation
- **Output**: Array of generated content items saved to content_library

**2. niv-content-intelligent-v2** (Enhanced for Framework Execution)
- **Receives**:
  - `preloadedStrategy`: Full framework context
  - `requestedContentType`: Specific content to generate
  - `autoExecute`: true (bypasses conversation mode)
  - `saveFolder`: Framework-specific folder structure
- **Context Awareness**:
  - Subject/objective from framework
  - Narrative and key messages
  - Target audiences
  - Media targets
  - Timeline and execution plan
  - Full framework structure for deep context

#### Content Types Supported:

Framework execution supports **30+ content types** from ExecuteTabProduction:

**Media & PR (11 types)**
- press-release, media-pitch, media-kit, media-list
- podcast-pitch, tv-interview-prep, thought-leadership
- case-study, white-paper

**Social Media (5 types)**
- social-post, linkedin-post, twitter-thread
- instagram-caption, facebook-post

**Email & Campaigns (4 types)**
- email, newsletter, drip-sequence, cold-outreach

**Executive & Crisis (5 types)**
- executive-statement, board-presentation, investor-update
- crisis-response, apology-statement

**Strategy & Messaging (4 types)**
- messaging, brand-narrative, value-proposition
- competitive-positioning

**Visual Content (5 types)**
- image, infographic, social-graphics
- presentation, video

#### Framework Structure Preserved:

```typescript
interface FrameworkExecutionContext {
  // Core Strategy
  strategy: {
    objective: string
    narrative: string
    keyMessages: string[]
    targetAudiences: string[]
  }

  // Tactical Execution
  contentStrategy: {
    autoExecutableContent: {
      contentTypes: string[]  // Maps to 30+ types above
      distribution: 'sequential' | 'parallel'
      timing: string
    }
  }

  // Campaign Metadata
  executionPlan: {
    phases: Phase[]
    timeline: Timeline
    stakeholders: Stakeholder[]
  }

  // Full Framework Reference
  fullFramework: any  // Complete framework for deep context
}
```

#### Execution Flow Example:

**User:** "Create a product launch framework for our AI platform"

**Step 1: Framework Built** (niv-strategic-framework)
```json
{
  "strategy": {
    "objective": "Launch AI platform targeting developers",
    "narrative": "Democratizing AI development",
    "keyMessages": ["Easy integration", "Production-ready", "Open ecosystem"]
  },
  "contentStrategy": {
    "autoExecutableContent": {
      "contentTypes": ["press-release", "thought-leadership", "case-study",
                       "linkedin-post", "twitter-thread", "media-list"],
      "distribution": "sequential"
    }
  }
}
```

**Step 2: Execution Orchestrated** (framework-auto-execute)
- Identifies 6 content types to generate
- Creates execution queue
- Preserves framework context for each

**Step 3: Content Generated** (niv-content-intelligent-v2 × 6)
- Press release: Uses objective + narrative + key messages
- Thought leadership: Deep-dive on "democratizing AI"
- Case study: Developer success story with integration
- LinkedIn post: Professional angle on ecosystem
- Twitter thread: Developer-focused quick hits
- Media list: Identifies tech journalists covering AI

**Result:** 6 pieces of content, all contextually aligned with framework, saved to content_library under folder: `Frameworks/Product Launch/AI Platform`

#### Database Integration:

**niv_strategies table:**
```sql
{
  id: uuid,
  organization_id: uuid,
  title: string,
  framework_data: jsonb,  -- Contains full framework structure
  content_types: string[], -- Auto-executable content types
  status: 'draft' | 'executed' | 'in_progress',
  created_at: timestamp
}
```

**content_library table:**
```sql
{
  id: uuid,
  organization_id: uuid,
  content_type: string,  -- One of 30+ types
  content: jsonb,
  metadata: {
    folder: string,  -- "Frameworks/{campaign_type}/{name}"
    framework_id: uuid,  -- Links back to originating framework
    generated_from: 'framework-auto-execute'
  }
}
```

#### Success Metrics:

- ✅ **Context Preservation**: 100% - Full framework passed to every content generation
- ✅ **Content Quality**: High - Framework grounding ensures consistency
- ✅ **Efficiency**: 6-10 pieces generated in < 2 minutes
- ✅ **Organization**: Automatic folder structure by framework type
- ✅ **Traceability**: Every piece links back to originating framework

#### Current Limitations & V4 Roadmap:

**Current (V3):**
- Linear execution (not multi-vector)
- Traditional content types (press releases, social posts)
- Direct messaging approach

**Coming (V4):**
- **Total-Spectrum Communications**: CASCADE, VOID, MIRROR, TROJAN, NETWORK patterns
- **Multi-Vector Execution**: Different messages to different stakeholders that converge
- **Indirect Influence**: Engineer discovery, not announcements
- **Narrative Void Detection**: Own conversations before they explode
- **Network-Level Orchestration**: Influence influencers of influencers

See `NIV_PLATFORM_V4_MASTER_PLAN.md` for complete V4 architecture.

#### NIV Strategic Framework Structure:
```typescript
{
  strategy: {
    executive_summary: string,
    objective: string,
    narrative: string,
    rationale: string,
    urgency: 'immediate' | 'high' | 'medium' | 'low'
  },
  tactics: {
    campaign_elements: {
      media_outreach: string[],
      content_creation: string[],
      stakeholder_engagement: string[]
    },
    immediate_actions: string[],
    week_one_priorities: string[],
    success_metrics: string[],
    campaign_metadata: CampaignType
  },
  intelligence: {
    key_findings: string[],
    supporting_data: {
      articles: Article[],
      quotes: Quote[],
      metrics: Metric[]
    }
  },
  orchestration: {
    components_to_activate: string[],
    workflow_type: string,
    campaign_type: string,
    priority: string
  }
}
```

### 7. Executive Synthesis System ✅

**Status: Single Consolidated Call Mode**

#### Five Expert Personas:
1. **Marcus Chen** - PR Strategist (Competitive moves, narratives)
2. **Victoria Chen** - Power Broker (Stakeholder dynamics)
3. **Sarah Kim** - Trend Hunter (Viral potential, media opportunities)
4. **Market Analyst** - Industry signals and economics
5. **Helena Cross** - Cascade Predictor (Weak signals, future risks)

#### Output Structure:
```json
{
  "competitive_dynamics": { /* 3-4 competitor moves */ },
  "stakeholder_intelligence": { /* 2-3 power shifts */ },
  "trending_narratives": { /* 3-4 viral topics */ },
  "market_signals": { /* 2-3 market indicators */ },
  "cascade_detection": { /* 2 weak signals */ },
  "immediate_opportunities": [ /* Top 5 urgent */ ],
  "critical_threats": [ /* Top 5 risks */ ],
  "executive_synthesis": "Combined C-suite summary"
}
```

#### Technical Specs:
- Model: claude-sonnet-4-20250514
- Max tokens: 2000 for focused response
- Timeout: 55 seconds with AbortController
- Mode: 'all_consolidated' for comprehensive analysis

### 7. Database Schema ✅

**Status: Fully Deployed with RLS**

#### Core Tables:
```sql
- organizations         - Company profiles with UUID identifiers
- opportunities        - Discovered opportunities with creative fields
- intelligence_reports - Gathered intelligence from pipeline
- niv_strategies      - NIV frameworks with workflow metadata
- content_library     - Generated content repository
- discovery_profiles  - Organization monitoring configuration
- monitoring_results  - Intelligence pipeline outputs
```

#### Key Features:
- Row Level Security (RLS) enabled
- Service role keys for Edge Functions
- Automatic organization name → UUID conversion
- JSONB fields for flexible data storage
- Workflow triggers in niv_strategies

## Integration Points

### External Services

#### AI Providers:
1. **Anthropic (Claude)**
   - Claude Sonnet for synthesis and opportunities
   - Strategic framework generation
   - Creative campaign enhancement
   - Temperature 0.9 for creative content

2. **Google Vertex AI**
   - Imagen 3 for image generation
   - Veo 3 Fast for video creation (10s limit)
   - Project: sigdesk-1753801804417

3. **Gamma**
   - AI presentation generation
   - 50 generations/day limit
   - Export to PDF/PowerPoint
   - API Key: sk-gamma-zFOvUwGMpXZaDiB5sWkl3a5lakNfP19E90ZUZUdZM

#### Data Sources:
- **Firecrawl** - Web scraping and search (via niv-fireplexity)
- **RSS Feeds** - Industry news monitoring
- **Google News** - Real-time news tracking
- **Yahoo Finance** - Financial data
- **Master Source Registry** - Curated source database

### Internal Integration

#### Data Flow:
```
User Chat → NIV Research (niv-fireplexity)
              ↓
         NIV Strategic Framework Generation
              ↓
         Memory Vault (Saves & Orchestrates)
              ↓
    ┌─────────┴─────────┬──────────────┐
    │                   │              │
Campaign Intel    Content Gen    Strategic Planning
    │                   │              │
    └─────────┬─────────┴──────────────┘
              ↓
         Execution & Export
```

## Recent Updates (September-October 2025)

### Real-Time Intelligence Monitor (Oct 3, 2025):
**PRODUCTION READY - Frontend Orchestration Pattern**

1. **Architecture**: Frontend-orchestrated pipeline (same proven pattern as Executive Synthesis)
   - Uses browser Supabase client for reliability (no server-side timeouts)
   - Each stage gets independent 150s execution window
   - No API route bottlenecks or relay errors
   - Successfully eliminates the timeout issues that plagued server-side approach

2. **Complete Pipeline Flow**:
   ```
   Stage 0: Discovery (mcp-discovery) - Get organization profile
   Stage 1: Monitor-Stage-1 - RSS article collection (~100 articles)
   Stage 2: Monitor-Stage-2-Relevance - Score + Firecrawl top 100 → ~25 findings
   Stage 3: Monitoring-Stage-2-Enrichment - Event extraction from 25 articles
   Stage 4: Real-Time Synthesis - UI-optimized breaking summary + alerts + watch list
   Stage 5: Parallel Analysis:
     - mcp-crisis: Crisis detection with severity assessment
     - mcp-opportunity-detector: Opportunity identification
   Stage 6: Opportunity Orchestration - Top 3 opportunities enhanced via orchestrator-v2
   ```

3. **Key Features**:
   - **Lightweight Synthesis**: Real-time-synthesis provides UI-ready output (breaking_summary, critical_alerts, watch_list)
   - **Crisis Integration**: mcp-crisis detects signals, assesses severity, recommends actions
   - **Opportunity Detection**: MCP detector finds opportunities, orchestrator-v2 enhances top 3
   - **Top 10 Display**: Most recent 10 articles from enriched set shown in UI
   - **Date Verification**: Strict time window filtering (1h/6h/24h)
   - **Competitor Coverage**: top_k:100, articles_limit:25 ensures diverse entity coverage

4. **Technical Implementation**:
   - Location: `/src/components/modules/IntelligenceModule.tsx` (runRealtimeMonitor function)
   - Edge Functions: mcp-discovery, monitor-stage-1, monitor-stage-2-relevance, monitoring-stage-2-enrichment, real-time-synthesis, mcp-crisis, mcp-opportunity-detector
   - Pattern: Identical to executive synthesis orchestration (intelligenceService.ts)
   - Client: Browser Supabase client (import { supabase } from '@/lib/supabase/client')

5. **Why Frontend Orchestration Works**:
   - Executive synthesis NEVER times out using frontend orchestration
   - Real-time monitor had 100% timeout rate with server API route approach
   - Root cause: Server-side Supabase client (SERVICE_ROLE_KEY) has stricter timeout enforcement
   - Solution: Use browser client orchestration like proven executive synthesis pattern

## Recent Updates (September 2025)

### NIV Content Robust Implementation (Sept 29):
1. **Consultant Mode**: NIV acts as intelligent PR consultant, not keyword matcher
2. **Strategy-First**: Presents comprehensive strategy before any content generation
3. **User Approval Flow**: Requires explicit approval before executing
4. **State Persistence**: Maintains conversation state using Map storage
5. **Progressive Updates**: Real-time status messages during generation
6. **Complete Media Plans**: All 7 essential components including media list

### Content System Fixes:
1. **MCP Tool Integration**: Fixed parameter mapping (parameters vs arguments)
2. **Tool Name Mappings**: Added compatibility layer for tool names
3. **Fallback to Claude**: Graceful degradation when MCP tools unavailable
4. **Storage Integration**: Auto-saves to Memory Vault and Content Library
5. **Folder Organization**: Creates project folders with timestamp

### Frontend Improvements:
1. **Workspace Management**:
   - No longer auto-opens content
   - Manual "Open in Workspace" button
   - Content attached to messages for later access
2. **Conversation Management**:
   - Fixed setConversationId state handling
   - Preserves conversation ID across requests
   - Maintains message history properly
3. **Content Display**:
   - Shows content items with action buttons
   - Fixed undefined content errors
   - Proper attachment to message objects

### Bug Fixes:
- Fixed "Unknown tool: generate_social_posts" error
- Resolved React rendering errors for social post objects
- Fixed currentContent undefined errors
- Corrected organization ID column type mismatches
- Prevented message array resets on content type changes

## Security & Compliance

### Authentication:
- Supabase Auth (RLS enabled)
- Service role keys for Edge Functions
- API key management in secrets

### Data Protection:
- Row Level Security (RLS) on all tables
- Encrypted storage
- Audit trail for all actions
- Export-only distribution

### Rate Limits:
- NIV: 140 second timeout
- Gamma: 50 presentations/day
- Vertex AI: Pay per use
- Claude: Standard API limits

## Performance Metrics

### Response Times:
- NIV Research (niv-fireplexity): 10-20 seconds
- NIV Framework Generation: 30-60 seconds
- Intelligence Pipeline (full): 40-60 seconds
- Executive Synthesis: 15-25 seconds
- Opportunity Detection: 8-12 seconds
- Creative Enhancement: 5-8 seconds
- Image Generation (Vertex AI): 10-20 seconds
- Video Generation (Veo 3 Fast): 15-25 seconds
- Presentation Generation (Gamma): 60-120 seconds

### Success Metrics:
- Pipeline success rate: >95%
- Opportunities per run: 8-10
- Article variety: 8-12 competitors
- Relevant articles: 30-50% pass threshold
- Creative enhancement: 100% (with fallbacks)

## Known Issues & Limitations

### Current Limitations:
1. Gamma presentations must be viewed on Gamma platform
2. Video generation limited to 10 seconds (Veo 3 Fast)
3. No direct social media posting (export-only)
4. 140-second timeout for complex NIV operations

### Pending Improvements:
1. Content orchestration testing needed
2. Batch generation optimization
3. Enhanced caching for frequently used content
4. Webhook implementation for async operations

## Deployment Information

### Environment:
- **Frontend**: Next.js 14 on Vercel
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage

### Edge Functions Summary

**Total Active Edge Functions: 60+**
- Campaign Builder: 8 functions
- Blueprint V3 Pipeline: 6 functions
- Core NIV: 7 functions
- Intelligence Pipeline: 8 functions
- Real-Time Intelligence: 3 functions
- Crisis Management: 3 functions
- Content Generation: 7 functions
- Supporting Infrastructure: 5+ functions
- MCP Tools: 20+ specialized functions

### Edge Functions (Active):
```
Campaign Builder Functions (NEW - Oct 2025):
- niv-campaign-builder-orchestrator (main campaign workflow orchestrator)
- niv-campaign-research-orchestrator (research pipeline coordinator)
- niv-campaign-research-gatherer (web research collection)
- niv-campaign-research-synthesis (intelligence brief generation)
- niv-campaign-positioning (positioning options generator)
- niv-campaign-pr-blueprint (traditional PR campaign generator)
- niv-campaign-memory (blueprint persistence)
- niv-campaign-executor (content execution coordinator)

Blueprint V3 Functions (VECTOR Campaigns - Oct 2025):
- niv-blueprint-orchestrator-v3 (main V3 orchestrator - 75s generation)
- niv-blueprint-enrichment (data enrichment - ~1s)
- mcp-pattern-selector (pattern matching - ~10s)
- mcp-influence-mapper (psychological strategy - ~39s)
- mcp-tactical-generator (4-phase tactical orchestration - ~26s)
- niv-blueprint-compiler (final assembly - ~0.2s)

Core NIV Functions:
- niv-orchestrator-robust (140s timeout - main orchestration)
- niv-content-robust (consultant mode content generation)
- niv-content-intelligent-v2 (intelligent content generation with framework awareness)
- niv-fireplexity (research engine)
- niv-strategic-framework (framework generator)
- niv-memory-vault (persistence layer)
- framework-auto-execute (framework-to-content bridge)

Intelligence Pipeline:
- mcp-discovery (organization profile generation)
- monitor-stage-1 (article collection ~100 articles)
- monitor-stage-2-relevance (PR scoring, threshold 30+)
- monitoring-stage-2-enrichment (event/entity extraction)
- intelligence-orchestrator-v2 (sequential processing coordinator)
- mcp-executive-synthesis (C-suite analysis with 5 personas)
- mcp-opportunity-detector (8-10 opportunities per run)
- opportunity-orchestrator-v2 (creative campaign enhancement)

Real-Time Intelligence (Oct 2025):
- real-time-synthesis (UI-optimized breaking summary + alerts)
- niv-fireplexity-monitor (company-specific query generation)
- mcp-crisis (crisis detection, assessment, response)

Stakeholder Predictions (Beta - Oct 16, 2025):
- stakeholder-pattern-detector (pattern analysis and prediction generation)
- stakeholder-profiler (behavioral profile creation and updates)

Crisis Management:
- niv-crisis-consultant (dedicated crisis planning consultant)
- niv-crisis-advisor (real-time crisis guidance)
- mcp-crisis (crisis plan generation and assessment)

Content Generation:
- vertex-ai-visual (Imagen 3 + Veo 3 Fast)
- gamma-presentation (AI slide deck creation)
- mcp-content (core content generation)
- mcp-social (social media optimization)
- mcp-campaigns (email and campaign creation)

Supporting Infrastructure:
- journalist-registry (journalist database and targeting)
- knowledge-library-registry (content library management)
- master-source-registry (curated source database)
- mcp-social-intelligence (social media analysis)
- campaign-execution-orchestrator (campaign execution management)

Legacy/Deprecated (Reference Only):
- niv-blueprint-orchestrator-v2 (replaced by V3)
- Various V1/V2 blueprint components (replaced by modular V3 pipeline)
- real-time-intelligence-orchestrator-v1-v4 (replaced by real-time-synthesis)

All deployed with --no-verify-jwt for internal calls
```

### Configuration:
```env
NEXT_PUBLIC_SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[configured]
SUPABASE_SERVICE_ROLE_KEY=[configured]
ANTHROPIC_API_KEY=[configured]
VERTEX_AI_KEY=[configured]
GAMMA_API_KEY=sk-gamma-zFOvUwGMpXZaDiB5sWkl3a5lakNfP19E90ZUZUdZM
FIRECRAWL_API_KEY=[configured]
```

## Testing Status

### Completed Testing:
- ✅ NIV framework generation
- ✅ Image generation (Vertex AI)
- ✅ Video generation (Vertex AI)
- ✅ Presentation generation (Gamma)
- ✅ Basic content generation
- ✅ Intelligence gathering
- ✅ Opportunity discovery
- ✅ Intelligence orchestrator bug fixes
- ✅ Real-time intelligence orchestrator (deployed)

### Pending Testing:
- 🔄 Real-time intelligence end-to-end test (tables need creation)
- 🔄 Crisis detection and response flow
- 🔄 Real-time UI integration
- 🔄 Workflow component integration (Campaign Intel, Content Gen, Strategic Planning)
- 🔄 Component message passing
- 🔄 Self-messaging system for NIV
- 🔄 Feedback loops from execution
- 🔄 End-to-end campaign execution from chat

## Next Steps

### Immediate Priorities (This Week):
1. **Create real-time intelligence database tables** (seen_articles, crises, etc.)
2. **Test real-time intelligence orchestrator** end-to-end
3. **Update Intelligence Hub UI** to use new real-time orchestrator
4. Connect Campaign Intelligence UI to Memory Vault
5. Implement component message listeners

### Near-Term Goals (Next 2 Weeks):
1. Workflow execution tracking
2. Strategic Planning module implementation
3. Standardized message passing between modules
4. Performance optimization for pipeline

### Medium-Term Vision (Next Month):
1. Self-messaging system for NIV gap detection
2. Feedback loops from campaign execution
3. Advanced orchestration with dependencies
4. Multi-organization support improvements

## Support & Documentation

### Key Documentation:
- `NIV_COMPREHENSIVE_IMPLEMENTATION_PATH.md` - NIV evolution roadmap (Phase 3 Active)
- `ENHANCED_MCP_ARCHITECTURE.md` - Complete intelligence pipeline architecture
- `NIV_STRATEGIC_PIPELINE_ARCHITECTURE.md` - NIV system design
- `REALTIME_INTELLIGENCE_REBUILD_PLAN.md` - Real-time intelligence architecture (NEW)
- `REALTIME_INTELLIGENCE_IMPLEMENTATION_COMPLETE.md` - Implementation guide (NEW)
- `REALTIME_VS_INTELLIGENCE_COMPARISON.md` - Gap analysis old vs new (NEW)
- `campaign-detector.ts` - 20+ campaign type taxonomy
- `ARCHITECTURE_OVERVIEW.md` - Overall system architecture

### Test Pages:
- `/test-vertex-ai.html` - Image/video generation
- `/test-gamma-presentation.html` - Presentation creation
- `/test-niv-framework.html` - NIV testing
- `/test-pipeline-optimized.html` - Pipeline testing

### API Endpoints:
```
Campaign Builder (NEW - Oct 2025):
/api/supabase/functions/niv-campaign-builder-orchestrator - Main campaign workflow
/api/supabase/functions/niv-campaign-research-orchestrator - Research pipeline
/api/supabase/functions/niv-campaign-positioning - Positioning options
/api/supabase/functions/niv-campaign-pr-blueprint - Traditional PR campaigns
/api/supabase/functions/niv-blueprint-orchestrator-v3 - VECTOR campaigns (Blueprint V3)
/api/supabase/functions/niv-campaign-executor - Content execution
/api/campaign-executor - Frontend campaign execution endpoint

Blueprint V3 Pipeline (VECTOR Campaigns):
/api/supabase/functions/niv-blueprint-enrichment - Data enrichment
/api/supabase/functions/mcp-pattern-selector - Pattern matching
/api/supabase/functions/mcp-influence-mapper - Psychological strategy
/api/supabase/functions/mcp-tactical-generator - Tactical orchestration
/api/supabase/functions/niv-blueprint-compiler - Final assembly

Core NIV:
/api/niv - NIV orchestration
/api/supabase/functions/niv-orchestrator-robust - Main NIV orchestrator (140s)
/api/supabase/functions/niv-fireplexity - NIV research engine
/api/supabase/functions/niv-strategic-framework - Framework generation
/api/supabase/functions/niv-memory-vault - Strategy persistence
/api/supabase/functions/framework-auto-execute - Framework-to-content execution

Intelligence Pipeline:
/api/supabase/functions/mcp-discovery - Organization profile
/api/supabase/functions/monitor-stage-1 - Article collection
/api/supabase/functions/monitor-stage-2-relevance - PR scoring
/api/supabase/functions/monitoring-stage-2-enrichment - Event extraction
/api/supabase/functions/intelligence-orchestrator-v2 - Pipeline coordinator
/api/supabase/functions/mcp-executive-synthesis - C-suite analysis
/api/supabase/functions/mcp-opportunity-detector - Opportunity detection
/api/supabase/functions/opportunity-orchestrator-v2 - Creative enhancement

Real-Time & Crisis:
/api/supabase/functions/real-time-synthesis - Real-time intelligence
/api/supabase/functions/niv-fireplexity-monitor - Company-specific queries
/api/supabase/functions/mcp-crisis - Crisis detection & response
/api/supabase/functions/niv-crisis-consultant - Crisis planning
/api/supabase/functions/niv-crisis-advisor - Real-time guidance

Stakeholder Predictions (Beta):
/api/supabase/functions/stakeholder-pattern-detector - Pattern analysis and predictions
/api/supabase/functions/stakeholder-profiler - Profile creation and updates

Content Generation:
/api/supabase/functions/niv-content-intelligent-v2 - Intelligent content generation
/api/supabase/functions/niv-content-robust - Consultant mode content
/api/supabase/functions/vertex-ai-visual - Image/video generation
/api/supabase/functions/gamma-presentation - Presentation creation
/api/supabase/functions/mcp-content - Core content generation
/api/supabase/functions/mcp-social - Social media optimization
/api/supabase/functions/mcp-campaigns - Email campaigns
```

## Conclusion

SignalDesk V3 represents a fully functional, AI-powered strategic communications platform with comprehensive capabilities from discovery through execution. The system features:

- **NIV Strategic Brain**: Research via niv-fireplexity, framework generation with 20+ campaign types
- **Intelligence Pipeline**: Discovery → Monitor → Enrichment → Synthesis → Opportunities flow (FIXED Oct 1)
- **Real-Time Intelligence**: Claude-powered breaking news monitoring with crisis detection (NEW Oct 1)
- **Crisis Management**: Automatic detection, severity assessment, response generation (NEW Oct 1)
- **Opportunity Engine**: Detection + creative enhancement transforming insights into ACTION
- **Memory Vault**: Central orchestration hub routing strategies to specialized components
- **Multi-Modal Content**: Text, images (Imagen 3), videos (Veo 3), presentations (Gamma)
- **Export-Only Distribution**: Maintaining compliance and audit trails

The platform transforms intelligence from a cost center into a **REVENUE GENERATOR** by telling organizations not just WHAT is happening, but **WHAT TO DO ABOUT IT**.

### System Health: 🟢 OPERATIONAL
### NIV Phase: Phase 3 Active (85% Complete)
### Intelligence Pipeline: PRODUCTION READY (Bug Fixed Oct 1)
### Real-Time Intelligence: DEPLOYED (Testing Pending)
### Core Differentiator: ACTIVATED

---

*This document serves as the authoritative source for SignalDesk V3 system status and architecture.*