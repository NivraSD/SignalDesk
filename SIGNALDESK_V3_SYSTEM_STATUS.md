# SignalDesk V3 - Comprehensive System Status
*Last Updated: November 4, 2025 - Memory Vault Playbook Intelligence System + Voyage AI Semantic Search*

## Executive Summary

SignalDesk V3 is a fully operational AI-powered strategic communications platform that transforms how organizations discover opportunities, generate strategies, and create content. The system leverages multiple AI providers (Claude, Google Vertex AI, Gamma) through a sophisticated orchestration layer to deliver end-to-end strategic communications capabilities.

**Major November 2025 Updates:**
- ✅ **Memory Vault Playbook Intelligence System** - Pre-synthesized content creation guides with 90% token reduction (Nov 4, 2025)
- ✅ **Voyage AI Semantic Search** - 1024-dimensional embeddings with voyage-3-large across all 21 content insertion points (Nov 4, 2025)
- ✅ **NIV Content Agentic Loop Fix** - Memory Vault search now continues conversation automatically (Nov 4, 2025)
- ✅ **Strategic Context for Opportunity Alignment** - Organization profiles now include target_customers, brand_personality, strategic_priorities for better opportunity relevance (Nov 2, 2025)

**Major October 2025 Updates:**
- ✅ **Schema.org Generation Pipeline** - Intelligent website scraping with Firecrawl Map + AI entity extraction + GEO enhancements (Oct 31, 2025)
- ✅ **Campaign Builder** - Complete 5-stage workflow (Research → Positioning → Approach → Blueprint → Execution)
- ✅ **VECTOR Campaigns** - Advanced psychological influence campaigns with 4-phase × 4-pillar orchestration
- ✅ **Blueprint V3 Generation** - 75-second modular pipeline producing 6-part strategic blueprints
- ✅ **ExecutionManager V3 Support** - Auto-extraction of content from Blueprint V3 tactical orchestration
- ✅ **MCP Architecture** - 40+ specialized edge functions following Model Context Protocol pattern
- ✅ **Frontend Integration** - BlueprintV3Presentation with color-coded execution ownership
- ✅ **Stakeholder Prediction System** - Complete tracking with validation and accuracy metrics (Production Ready) - Oct 27, 2025
- ✅ **NIV Advisor & Command Center V2** - Conversational AI advisor with intelligent routing (Oct 24, 2025)
- ✅ **Memory Vault V2** - Complete overhaul with OpenMemory-inspired enhancements (Oct 24-26, 2025)
- ✅ **NIV Memory Vault Integration** - Composite scoring for proven template discovery (Oct 26, 2025)
- ✅ **Campaign Attribution System** - Automatic performance tracking with AI-powered attribution (Oct 26, 2025)
- ✅ **GEO Intelligence Monitor** - AI visibility testing across Claude, Gemini, Perplexity, and ChatGPT with intelligent query generation and citation tracking (Oct 27, 2025)

### Core Capabilities Status
- ✅ **Schema.org Generation** - Complete pipeline with Firecrawl Map discovery, AI entity extraction, and GEO enhancements (Oct 31, 2025)
- ✅ **Campaign Builder** - Complete research → positioning → blueprint generation workflow
- ✅ **VECTOR Campaigns** - Advanced multi-stakeholder psychological influence campaigns (NEW)
- ✅ **Blueprint V3 Generation** - 75-second 6-part blueprint with 4-phase tactical orchestration
- ✅ **NIV Advisor** - 25-year veteran conversational AI advisor with intelligent routing (Oct 24, 2025)
- ✅ **Command Center V2** - NIV Panel with real-time streaming responses and organization context
- ✅ **NIV Strategic Framework Generation** - Using niv-fireplexity for research, 140s timeout
- ✅ **Intelligence Pipeline** - Discovery → Monitor → Enrichment → Synthesis → Opportunities
- ✅ **Real-Time Intelligence** - Frontend-orchestrated monitoring (Oct 3, 2025 - PRODUCTION READY)
- ✅ **GEO Intelligence Monitor** - AI visibility testing across Claude, Gemini, Perplexity, and ChatGPT (Production Ready - Oct 27, 2025)
- ✅ **Stakeholder Predictions** - AI-powered prediction tracking with validation and accuracy metrics (Production Ready - Oct 27, 2025)
- ✅ **Content Generation** - Multi-modal (text, image, video, presentations) with platform-specific formatting
- ✅ **Opportunity Engine V2** - Execution-ready opportunities with real-time content generation
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

### 2. NIV (Neural Intelligence Vehicle) & Command Center ✅

**Status: Fully Operational - NIV Advisor V2 Active (October 24, 2025)**

#### NIV Advisor - NEW October 2025
**The Strategic Communications AI Advisor**

NIV Advisor is a conversational AI with 25+ years of virtual experience in corporate communications and public affairs, designed to advise, research, strategize, and route to specialized content generation functions.

**Core Persona:**
- 25-year veteran in corporate communications and public affairs
- Expertise across technology, healthcare, financial services, consumer goods
- Deep knowledge of academic research (Cialdini, Kahneman, Centola, Berger)
- Real-world case study expertise (J&J Tylenol, ALS Ice Bucket, Old Spice, Boeing 737 MAX)
- Business-first approach to competitive strategy (no moralizing)

**Intelligent Routing System:**
1. **Content Generation Route** → `niv-content-intelligent-v2`
   - Detects content generation intent with confidence scoring
   - Supports 34+ content types with platform-specific formatting
   - Packages proper `campaignContext` for execution

2. **Crisis Management Route** → `niv-crisis-advisor`
   - Keyword-based detection (crisis, emergency, breach, etc.)
   - Specialized crisis planning and real-time guidance

3. **Research & Intelligence Route** → `niv-fireplexity`
   - Deep market research and competitive intelligence
   - Real-time web research with Firecrawl integration

**Key Features:**
- Organization context persistence (fixed Oct 24, 2025)
- Conversation state management with concept tracking
- Professional reframing of competitive strategy language
- Automatic routing based on user intent and conversation stage

#### Command Center V2 (NIV Panel)
**Production UI: `/src/components/niv/NIVPanel.tsx`**

- Real-time streaming responses with two-stage architecture
- Quick acknowledgment (stage: 'acknowledge') for immediate feedback
- Full processing (stage: 'full') for complete analysis
- Organization context integration from user profile
- Support for multi-turn conversations with history
- Markdown rendering with code syntax highlighting
- Typing indicators and loading states

#### Legacy NIV Components (Still Active)
- **niv-orchestrator-robust** - Main orchestration with 140s timeout
- **niv-fireplexity** - Research engine using Firecrawl for web search
- **niv-strategic-framework** - Framework generation from research data
- **campaign-detector** - 20+ campaign type detection system
- **niv-memory-vault** - Strategy persistence and workflow orchestration

#### Content Generation Improvements (October 24, 2025)
- **Press Releases**: Strict 11-step AP format enforcement
  - FOR IMMEDIATE RELEASE header, dateline, headline, subhead
  - Proper executive quote formatting
  - Boilerplate and contact info sections
  - ### end marker
- **Social Posts**: Platform-specific formatting
  - Twitter/X: 280 character limit strictly enforced
  - LinkedIn: 150-300 words professional tone
  - Facebook: 100-250 words conversational
  - Instagram: 125-150 words with hashtag strategy

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

### 2.5 GEO Intelligence Monitor ✅

**Status: Production Ready - October 27, 2025**

The GEO (Generative Experience Optimization) Intelligence Monitor tests brand visibility across AI platforms (Claude, Gemini, ChatGPT, Perplexity) using Claude-powered intelligent query generation. Integrated into the Intelligence Hub as a dedicated tab with organization-aware architecture.

#### Architecture:
```
Organization Context (org_id, org_name, industry)
    ↓
geo-query-discovery (Claude-Powered Query Generation)
    ├── Get organization profile (competitors, description)
    ├── Apply GEOIntelligenceRegistry patterns (17 industries)
    ├── Use Claude to generate 25-30 contextual queries
    └── Categorize by intent (comparison, competitive, transactional, etc.)
    ↓
geo-intelligence-monitor (AI Visibility Testing)
    ├── Test on Claude (5 queries) - Sonnet 4.5
    ├── Test on Gemini 2.0 Flash (5 queries) - Direct API
    ├── Test on Perplexity (5 queries) - Sonar model with citations
    ├── Test on ChatGPT (5 queries) - GPT-4o
    ├── Analyze brand mentions, recommendations, positioning
    └── Generate actionable signals with recommendations
    ↓
geo_intelligence table (Signal Storage)
    ├── Signal types: ai_visibility, visibility_gap, competitor_update
    ├── Platform: claude, gemini, perplexity, chatgpt
    ├── Priority: critical, high, medium
    └── Recommendations: specific actions to improve visibility
```

#### Query Generation Process:
**geo-query-discovery Edge Function:**
- **Inputs**: organization_id, organization_name, industry, competitors (optional)
- **Process**:
  1. Fetches full organization profile from database
  2. Retrieves industry-specific patterns from GEOIntelligenceRegistry
  3. Uses Claude Sonnet 4.5 with date-aware prompts (current year: 2025)
  4. Generates 25-30 diverse queries mixing:
     - Comparison Queries (30%): "best X", "X vs Y", "top X platforms"
     - Competitive Queries (25%): "alternatives to X", "X or Y"
     - Transactional Queries (20%): "buy X", "X pricing"
     - Informational Queries (15%): "how to X", "what is X"
     - Research Queries (10%): "X reviews", "is X good"
  5. Returns categorized queries by priority (critical/high/medium)
- **Output**: 30 queries with intent classification and priority ranking
- **Cost Control**: Tests 10 high-priority queries (4 critical + 4 high + 2 medium)

#### AI Visibility Testing:
**geo-intelligence-monitor Edge Function:**
- **Claude Testing** (5 queries):
  - Model: claude-sonnet-4-20250514
  - Temperature: 0.7, max_tokens: 1024
  - Analyzes: brand mentions, recommendations, competitive positioning
- **Gemini Testing** (5 queries):
  - Model: gemini-2.0-flash-001
  - Direct Gemini API (simple API key, no OAuth)
  - Endpoint: generativelanguage.googleapis.com/v1beta
  - Features: Search grounding with source citations
  - Analyzes: visibility, recommendations, sentiment, cited sources
- **Perplexity Testing** (5 queries):
  - Model: sonar (or sonar-pro)
  - Endpoint: api.perplexity.ai/chat/completions
  - Features: Built-in citations and source URLs
  - Analyzes: brand mentions, competitive positioning, citation sources
- **ChatGPT Testing** (5 queries):
  - Model: gpt-4o
  - Endpoint: api.openai.com/v1/chat/completions
  - Analyzes: brand visibility, recommendation strength, positioning
- **Signal Analysis**:
  - Detects visibility gaps (brand not mentioned)
  - Identifies competitor advantages
  - Measures recommendation strength
  - Extracts citation sources (Gemini & Perplexity)
  - Generates specific improvement actions

#### Signal Types & Recommendations:
1. **ai_visibility**: Brand mentioned with positive context
   - Priority: high/medium
   - Action: "Maintain current positioning"
2. **visibility_gap**: Brand not mentioned in relevant queries
   - Priority: critical/high
   - Action: "Create content targeting [query topic]"
3. **competitor_update**: Competitor mentioned over your brand
   - Priority: high
   - Action: "Review competitor [X] positioning on [topic]"
4. **schema_gap**: Missing structured data opportunities
   - Priority: medium
   - Action: "Add FAQ schema for [query type]"

#### Database Schema:
**geo_intelligence table:**
```sql
- id: UUID (primary key)
- organization_id: UUID (references organizations)
- signal_type: VARCHAR(50) (ai_visibility, visibility_gap, competitor_update, schema_gap)
- platform: VARCHAR(50) (claude, gemini, chatgpt, perplexity)
- priority: VARCHAR(20) (critical, high, medium, low)
- data: JSONB (query, response, mentions, analysis)
- recommendation: JSONB (action, reasoning, urgency)
- status: VARCHAR(20) (new, reviewed, actioned)
- created_at: TIMESTAMPTZ
```

**Indexes:**
- organization_id, signal_type, platform, priority, status, created_at

**Permissions:**
- RLS disabled (service role access only)
- GRANT ALL to service_role, postgres, authenticated, anon

#### GEOIntelligenceRegistry:
**872-line industry pattern registry** (mirrors MasterSourceRegistry):
- **17 Industries**: Technology, SaaS, Finance, Healthcare, Ecommerce, Fashion, Retail, Media, Education, Real Estate, Travel, Food, Automotive, Professional Services, Energy, Legal, Non-profit
- **Schema Priorities**: For each industry (e.g., FAQ, Product, Review, Organization)
- **Query Patterns**: Industry-specific search patterns with intent classification
- **Platform Preferences**: Claude/Gemini/Perplexity guidance per industry
- **Competitor Monitoring**: Key players to track per industry
- **Success Metrics**: Industry-specific KPIs (mention rate, recommendation rate)

#### UI Integration (Intelligence Hub):
**Location:** `/src/components/modules/IntelligenceModule.tsx`

**GEO Tab Features:**
- Tab button with Globe icon
- "Run GEO Monitor" button to trigger analysis
- Loading states with progress messages
- Signal display with:
  - Priority badges (critical/high/medium)
  - Platform tags (Claude/Gemini/Perplexity/ChatGPT)
  - Citation sources (for Gemini & Perplexity results)
  - Expandable recommendations
  - Action buttons (Mark Reviewed, Take Action)
- Organization-aware (passes org_id, org_name, industry)
- Auto-loads on organization change

**State Management:**
```typescript
const [activeTab, setActiveTab] = useState<'synthesis' | 'social' | 'realtime' | 'predictions' | 'geo'>('synthesis')
const [geoLoading, setGeoLoading] = useState(false)
const [geoResults, setGeoResults] = useState<any>(null)
const [geoSignals, setGeoSignals] = useState<any[]>([])
const [geoError, setGeoError] = useState<string | null>(null)
```

#### Edge Functions:
1. **geo-query-discovery**: Claude-powered query generation
   - Model: claude-sonnet-4-20250514
   - Timeout: 120s
   - Date-aware prompts (prevents temporal drift)
2. **geo-intelligence-monitor**: AI visibility testing across 4 platforms
   - Tests 20 queries total (5 per platform)
   - Platforms: Claude, Gemini, Perplexity, ChatGPT
   - Saves signals to database with platform tags
   - Returns summary with recommendations and platform performance

#### Performance Metrics:
- Query Generation: 8-12 seconds (30 queries)
- Claude Testing: 15-20 seconds (5 queries)
- Gemini Testing: 10-15 seconds (5 queries with search grounding)
- Perplexity Testing: 12-18 seconds (5 queries with citations)
- ChatGPT Testing: 10-15 seconds (5 queries)
- Total Runtime: ~60-80 seconds
- Success Rate: >95% query generation, >90% visibility testing
- Cost: ~$0.30-0.40 per full analysis (20 queries across 4 platforms)

#### Key Differentiators:
1. **Claude-Powered Query Generation**: Not static templates, but intelligent contextual queries
2. **4-Platform Coverage**: Claude, Gemini, Perplexity, ChatGPT (most comprehensive in industry)
3. **Citation Tracking**: Extracts sources from Gemini (search grounding) & Perplexity (built-in citations)
4. **Industry-Adaptive**: 17 industries with specific patterns and success metrics
5. **Organization-Aware**: Passes org_id, org_name, industry throughout pipeline
6. **Date-Aware**: Prompts include current date/year to prevent temporal drift
7. **Direct API Integration**: Simple API keys (no complex OAuth flows)
8. **Actionable Signals**: Specific recommendations, not just analytics
9. **PR Intelligence**: Identifies which publications AI platforms cite for competitor coverage
10. **Intelligence Hub Integration**: Tab alongside Synthesis, Social, Real-Time, Predictions

#### Current Status (Production Ready):
- ✅ Edge functions deployed (geo-query-discovery, geo-intelligence-monitor)
- ✅ Database schema created with proper permissions
- ✅ GEOIntelligenceRegistry with 17 industries
- ✅ Intelligence Hub UI integration (GEO tab)
- ✅ Claude Sonnet 4.5 integration working
- ✅ Gemini 2.0 Flash integration (Direct API with search grounding)
- ✅ Perplexity Sonar integration (with built-in citations)
- ✅ ChatGPT GPT-4o integration
- ✅ Organization-aware architecture
- ✅ Date-aware query generation (2025, not 2024)
- ✅ Signal storage with recommendations
- ✅ Platform performance tracking with citation sources
- ✅ 4-platform coverage (20 queries total)

#### Implementation Details:
- **Files**:
  - `/supabase/functions/geo-query-discovery/index.ts` (372 lines)
  - `/supabase/functions/geo-intelligence-monitor/index.ts` (600+ lines)
  - `/src/lib/services/GEOIntelligenceRegistry.ts` (872 lines)
  - `/src/components/modules/IntelligenceModule.tsx` (GEO tab integration)
  - `/supabase/migrations/20251027_create_geo_intelligence_fixed.sql`
  - `/supabase/migrations/20251027_disable_geo_intelligence_rls.sql`

- **API Keys Required**:
  - ANTHROPIC_API_KEY (Claude Sonnet 4.5)
  - GOOGLE_API_KEY (Gemini 2.0 Flash Direct API)
  - PERPLEXITY_API_KEY (Perplexity Sonar)
  - OPENAI_API_KEY (ChatGPT GPT-4o)

#### Future Enhancements:
- Implement automated monitoring (cron job for daily/weekly scans)
- Add trend tracking (visibility over time, historical performance charts)
- Build GEO optimization recommendations (automated schema suggestions)
- Add schema markup suggestions based on visibility gaps
- Implement A/B testing for positioning strategies
- Add SearchGPT integration when API becomes available
- Expand citation analysis (track which publications get cited most)

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

**Status: Production Ready - October 27, 2025**
**Latest Update: Complete Tracking & Validation System with Target Integration - October 27, 2025**

The Stakeholder Prediction System uses AI-powered pattern analysis to predict stakeholder actions before they happen, enabling proactive strategic positioning. Now includes automated outcome monitoring, validation tracking, and accuracy metrics.

#### What It Does:

Unlike reactive intelligence that tells you what happened, the prediction system forecasts **what stakeholders will likely do next** based on historical behavioral patterns and recent intelligence signals.

#### Architecture:

```
Real-Time Intelligence Monitor
    ↓ (stores events and entities)
Real-Time Intelligence Briefs Table
    ↓ (last 90 days of intelligence)
Real-Time Prediction Generator
    ├─→ Matches predictions to intelligence_targets
    ├─→ Tracks trigger events
    ├─→ Generates predictions with confidence scores
    └─→ Creates monitoring records
        ↓
Predictions Table (with target integration)
    ↓
Prediction Monitor (Automated)
    ├─→ Searches for outcome evidence
    ├─→ AI-powered validation (Claude)
    ├─→ Auto-validates or expires predictions
    └─→ Updates monitoring status
        ↓
Prediction Outcomes & Metrics Tables
    ↓
UI Dashboards:
    ├─→ StakeholderPredictionDashboard (validation buttons)
    └─→ PredictionMonitoringDashboard (accuracy tracking)
```

#### Core Components:

**1. Database Tables:**
- `predictions` - AI-generated action predictions (enhanced with target integration)
- `intelligence_targets` - Organized targets (competitors, topics, keywords, influencers)
- `prediction_outcomes` - Validation records (manual and automated)
- `prediction_monitoring` - Monitoring status and signal tracking
- `target_prediction_metrics` - Accuracy aggregates by target
- `prediction_patterns` - Learned patterns from validated predictions
- `predictions_with_monitoring` - View combining predictions with monitoring status
- `target_accuracy_summary` - View showing accuracy by target
- `real_time_intelligence_briefs` - Source data with events and entities
- `content_library` - Intelligence articles for outcome search

**2. Edge Functions:**
- `real-time-prediction-generator` - Generates predictions with target matching and trigger tracking
- `prediction-monitor` - Automated monitoring service (searches for outcomes, validates predictions)
- `stakeholder-pattern-detector` - Pattern-based prediction analysis (original system)
- `stakeholder-profiler` - Creates and updates stakeholder behavioral profiles

**3. Pattern Library (7 Pre-Loaded Patterns):**
1. **Regulator Pre-Enforcement**: Regulatory actions before formal enforcement
2. **Activist Pre-Campaign**: Activist mobilization before public campaigns
3. **Investor Pre-Exit**: Investor positioning before major exits
4. **Competitor Pre-Launch**: Competitive moves before product launches
5. **Employee Pre-Unionization**: Workforce organizing signals
6. **Customer Pre-Boycott**: Customer sentiment shifts toward collective action
7. **Media Pre-Investigation**: Journalist research patterns before major exposés

#### New Features (October 27, 2025):

**Target Integration:**
- Predictions automatically linked to intelligence_targets (competitors, topics, keywords, influencers)
- Target badges displayed on each prediction (🏢 Competitor, 📌 Topic, 🔑 Keyword, 👤 Influencer)
- Filter predictions by target type
- Track accuracy per target
- Trigger event tracking (records which intelligence event triggered each prediction)

**Automated Outcome Monitoring:**
- Background service checks predictions for outcomes automatically
- Searches recent intelligence for validation evidence
- AI-powered outcome matching using Claude
- Monitoring states: watching → signals_detected → outcome_imminent
- Auto-validates predictions when outcome detected with 70%+ confidence
- Auto-expires predictions when deadline passes

**Manual Validation UI:**
- ✅ "Came True" button - Validates prediction with outcome details
- ❌ "Didn't Happen" button - Marks prediction as failed
- Records outcomes in prediction_outcomes table
- Builds validation dataset for learning

**Accuracy Tracking:**
- Overall accuracy percentage
- Accuracy by target (competitor, topic, etc.)
- Accuracy by timeframe (1-week, 1-month, 3-months, etc.)
- Confidence calibration metrics
- Target accuracy table with success rates
- Real-time monitoring dashboard

**Monitoring Dashboard (NEW):**
- Real-time monitoring statistics
- Active predictions count
- Signals detected / Imminent counts
- Daily validations and expirations
- Target accuracy table with color-coded success rates
- Manual monitor trigger button

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
  status: 'active' | 'validated' | 'invalidated' | 'expired',

  // Target Integration (NEW - Oct 27, 2025)
  target_id: uuid,                 // Links to intelligence_targets
  target_name: string,             // "Microsoft", "AI regulation", etc.
  target_type: string,             // competitor, topic, keyword, influencer
  trigger_event_id: uuid,          // Intelligence event that triggered this
  trigger_event_summary: string,   // Brief description of trigger
  pattern_confidence: number,      // How well pattern matched

  // Monitoring Status (NEW - Oct 27, 2025)
  monitoring_status: string,       // watching, signals_detected, outcome_imminent
  supporting_signals_count: number,// Number of supporting signals found
  contradicting_signals_count: number,
  confidence_trend: string,        // increasing, stable, decreasing
  last_checked_at: timestamp,
  next_check_at: timestamp
}
```

#### UI Integration:

**StakeholderPredictionDashboard (Enhanced):**
- Real-time prediction dashboard with auto-refresh (5 min)
- Target badges on each prediction (🏢 Competitor, 📌 Topic, 🔑 Keyword, 👤 Influencer)
- Trigger event information ("Triggered by: Article Title")
- Color-coded confidence levels (red=high, orange=medium, yellow=low)
- Stakeholder type filtering (regulator, activist, investor, competitor, etc.)
- Target type filtering (filter by specific competitors, topics, etc.)
- Priority filters (high-priority, imminent ≤14 days)
- **Validation buttons on each prediction:**
  - ✅ "Came True" - Prompts for outcome details, marks as validated
  - ❌ "Didn't Happen" - Marks as failed, records in outcomes table
- Expandable prediction cards showing:
  - Stakeholder name and type with target badge
  - Predicted action
  - Probability percentage and confidence level
  - Days until expected action
  - Trigger event that spawned prediction
  - Trigger signals (collapsed/expanded view)
  - Pattern match timeline breakdown
- "Refresh Predictions" button to regenerate

**PredictionMonitoringDashboard (NEW - Oct 27, 2025):**
- **Monitoring Stats Grid:**
  - Active predictions count
  - Watching / Signals Detected / Imminent counts
  - Validated today / Expired today
  - Overall accuracy percentage
- **Target Accuracy Table:**
  - Accuracy by target (competitor, topic, keyword, influencer)
  - Total predictions per target
  - Validated count
  - Successful count
  - Color-coded accuracy percentage (green >80%, yellow >60%, red <60%)
- **Manual Monitor Control:**
  - "Run Monitor Now" button - Manually triggers prediction-monitor function
  - Real-time status updates
  - Error handling and feedback
- **Instructions panel** explaining monitoring states

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

#### Current Status (Production Ready):

**✅ Solved (Oct 27, 2025):**
- ✅ **Historical validation system**: Complete validation tracking with manual and automated methods
- ✅ **Accuracy tracking**: Full metrics by target, timeframe, and confidence calibration
- ✅ **Target organization**: Predictions linked to intelligence targets
- ✅ **Outcome monitoring**: Automated monitoring service with AI-powered validation
- ✅ **UI for validation**: Manual validation buttons in prediction dashboard

**Remaining Considerations:**
- **Requires real-time intelligence data**: Must run real-time monitor to generate intelligence
- **Pattern library evolving**: Currently 7 patterns, more being added over time
- **Validation dataset growing**: Accuracy improves as more predictions are validated
- **Migration needed**: Database migration `20251027_prediction_tracking_system.sql` must be applied

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

**October 27, 2025 - Complete Tracking & Validation System:**
- **Target Integration:**
  - Linked predictions table to intelligence_targets
  - Enhanced real-time-prediction-generator with target matching logic
  - Added trigger event tracking (trigger_event_id, trigger_event_summary)
  - Updated StakeholderPredictionDashboard with target badges
  - Modified TargetManagement to show prediction counts per target
- **Outcome Tracking:**
  - Created prediction_outcomes table for validation records
  - Created prediction_monitoring table for monitoring status
  - Created target_prediction_metrics table for accuracy aggregates
  - Created prediction_patterns table for learned patterns
  - Built database views: predictions_with_monitoring, target_accuracy_summary
  - Implemented automatic metric updates via database triggers
- **Automated Monitoring:**
  - Built prediction-monitor edge function
  - AI-powered outcome detection using Claude
  - Automatic validation when outcome detected (70%+ confidence)
  - Automatic expiration when deadline passes
  - Monitoring states: watching → signals_detected → outcome_imminent
  - Smart check frequency based on timeframe and deadline proximity
- **Manual Validation UI:**
  - Added "Came True" and "Didn't Happen" buttons to predictions
  - Outcome recording with details
  - Real-time accuracy updates
- **Monitoring Dashboard:**
  - Built PredictionMonitoringDashboard component
  - Real-time monitoring stats grid
  - Target accuracy table with color-coded success rates
  - Manual monitor trigger
  - Comprehensive documentation (4 files: Architecture, Quick Start, Enhancement Plan, Implementation)
- **Deployment:**
  - Deployed prediction-monitor edge function (Oct 27, 15:55)
  - Deployed real-time-prediction-generator enhancements (Oct 27, 15:55)
  - Committed all code and documentation to git (commit 2a8cbb732)

**Status:** Production Ready - Full prediction tracking system operational (pending migration)

---

### 5. Opportunity Engine V2 ✅

**Status: Production Ready with Real-Time Content Generation (October 24, 2025)**

#### V2 Architecture - Execution-Ready Opportunities

**Major October 24, 2025 Updates:**
- V2 opportunities with full `execution_plan` and `strategic_context`
- Real-time content generation with live progress tracking
- Visual progress bars with platform completion indicators
- Content viewer modal with rich metadata
- Parallel content creation with 3-second polling

#### Two-Column UI (OpportunitiesModule V2):
1. **Left Column (2/5 width)**: Opportunities list
   - Score, urgency, content item count
   - Execute button with gradient progress bar
   - Auto-refresh on execution completion

2. **Right Column (3/5 width)**: Execution details
   - Strategic Context (trigger_events, why_now, competitive_advantage)
   - Execution Plan (stakeholder_campaigns with content_items)
   - Generated Content section with view/copy functionality

#### V2 Opportunity Structure:
```typescript
{
  // V1 Fields (retained for compatibility)
  title: string,
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  score: number,  // 0-100
  category: string,

  // V2 Strategic Context
  strategic_context: {
    trigger_events: string[],
    market_dynamics: string,
    why_now: string,
    competitive_advantage: string,
    time_window: string,
    expected_impact: string,
    risk_if_missed: string
  },

  // V2 Execution Plan
  execution_plan: {
    stakeholder_campaigns: [{
      stakeholder_name: string,
      stakeholder_priority: number,
      lever_name: string,
      lever_priority: number,
      content_items: [{
        type: string,  // press_release, blog_post, etc.
        topic: string,
        target: string,
        platform: string,
        brief: {
          angle: string,
          key_points: string[],
          tone: string,
          length: string,
          cta: string
        },
        urgency: string
      }]
    }],
    execution_timeline: {
      immediate: string[],
      this_week: string[],
      this_month: string[],
      ongoing: string[]
    },
    success_metrics: any[]
  },

  version: 2,  // Distinguishes V2 from V1
  auto_executable: boolean
}
```

#### Real-Time Content Generation:
1. **Progress Tracking**:
   - Gradient progress bar (purple to pink)
   - Percentage display and time-based updates
   - Stage indicators: "Generating content... (~3/7 pieces)"

2. **Live Content Polling**:
   - Polls `content_library` every 3 seconds
   - Content appears as generated (not all at once)
   - Counter badge updates in real-time: "3 pieces" → "7 pieces"

3. **Gamma Presentation**:
   - Extended polling timeout: 60s → 120s
   - Time-based progress: "Gamma generating... (45s / 120s)"
   - Auto-saves presentation URL when complete

4. **Content Display**:
   - Title with full context (e.g., "Opportunity - blog_post - Stakeholder")
   - Type badges, stakeholder info, channel (owned/media)
   - Purpose/topic description
   - View button opens modal with full content + metadata
   - Copy to clipboard functionality

#### MCP Opportunity Detector V2:
- Generates execution-ready opportunities with full strategic_context
- Creates stakeholder_campaigns with detailed content_items
- Each content item includes comprehensive brief
- Saves to database with version: 2 flag
- Auto-executable field for one-click generation

### 6. Memory Vault V2 - Intelligent Content Management System ✅

**Status: Production Ready with Playbook Intelligence System (Nov 4, 2025)**

Memory Vault V2 is SignalDesk's centralized content intelligence and persistence layer, combining brand-specific knowledge management with sophisticated AI-powered organization and retrieval. Now enhanced with the **Playbook Intelligence System**, Memory Vault pre-digests successful content patterns into compact, reusable guides that dramatically improve content generation efficiency and quality.

#### System Overview

Memory Vault V2 represents a complete architectural overhaul from a simple storage system to an intelligent content management platform inspired by cognitive memory systems (OpenMemory) but purpose-built for PR/marketing workflows.

**What Makes It Sophisticated:**
- **Playbook Intelligence System**: Pre-synthesized content creation guides (NEW - Nov 4, 2025)
- **Voyage AI Embeddings**: 1024-dimensional semantic search with voyage-3-large (NEW - Nov 4, 2025)
- **AI-Powered Intelligence Extraction**: Automatic theme, entity, topic, and sentiment analysis
- **Time-Aware Salience Scoring**: Content naturally decays or stays relevant based on usage
- **Composite Retrieval Ranking**: Multi-factor scoring (similarity + salience + recency + execution success)
- **Explainable AI**: Transparent reasoning for why content was retrieved
- **Brand Context Management**: Sub-millisecond brand guideline/template lookup
- **Async Processing**: Never blocks user operations

#### Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   USER-FACING LAYER                         │
├─────────────────┬───────────────────┬───────────────────────┤
│   Save Content  │  Search Content   │  Brand Context Cache  │
│   (< 200ms)     │  (Composite Score)│  (< 1ms hit)          │
└─────────────────┴───────────────────┴───────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              INTELLIGENT PROCESSING LAYER                    │
├─────────────────────────────────────────────────────────────┤
│  Intelligence Extraction  │  Salience Management  │  Scoring │
│  - Themes/Topics/Entities │  - Time Decay         │  - Multi-│
│  - Sentiment Analysis     │  - Access Boosting    │    Factor│
│  - Folder Suggestion      │  - Content-Type Rates │  - Ranks │
│  - Relationship Discovery │  - Brand Asset Boost  │          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    STORAGE & EXECUTION                       │
├───────────────────────────────────────────────────────────────┤
│  Content Library  │  Brand Assets  │  Job Queue  │  Folders  │
│  - Strategies     │  - Templates   │  - Async    │  - Auto   │
│  - Content        │  - Guidelines  │    Workers  │    Org    │
│  - Campaigns      │  - Voice       │  - Retry    │  - Smart  │
└───────────────────────────────────────────────────────────────┘
```

#### Key Capabilities

**1. Persistence & Organization**
- **Universal Storage**: All NIV strategies, generated content, campaigns, templates
- **Smart Foldering**: AI-suggested folders based on themes, types, time periods
- **Version Control**: Auto-incrementing versions for strategies
- **Organization Management**: Auto-converts names to UUIDs, handles multi-org
- **Context Preservation**: Full research data and framework metadata

**2. Brand Intelligence (NEW - Oct 24, 2025)**
- **Template Analysis**: Extracts structure, voice, usage patterns from uploaded files
- **Guideline Extraction**: Parses brand guidelines for Do's/Don'ts, tone, voice
- **Usage Tracking**: Records template usage and success rates
- **Multi-Layer Caching**: < 1ms brand context retrieval after first load
- **Cache Warming**: Pre-loads common content types for instant access

**3. AI-Powered Intelligence (Oct 24, 2025)**
- **Automatic Analysis**: Themes, topics, entities, sentiment, complexity
- **Content Signatures**: 1-2 sentence summaries for similarity matching
- **Keyword Extraction**: 5-10 important keywords per content
- **Folder Suggestion**: AI determines optimal folder placement
- **Relationship Discovery**: Finds similar/related content automatically

**4. OpenMemory-Inspired Enhancements (NEW - Oct 26, 2025)**

##### **A. Salience Scoring with Time-Based Decay**

Content naturally loses relevance over time but gets boosted when accessed:

```typescript
{
  salience_score: 0.85,          // Current relevance (0.0-1.0)
  last_accessed_at: timestamp,   // Last used
  decay_rate: 0.005,             // Daily decay (0.5%)
  access_count: 12               // Usage tracking
}
```

**Content-Type Specific Decay Rates:**
- **Fast** (1%/day): News, opportunities, media lists → Fresh info matters
- **Medium** (0.5%/day): Press releases, blogs, campaigns → Standard decay
- **Slow** (0.2%/day): Templates, guidelines, strategies → Evergreen content

**Auto-Boost on Access:**
- Content retrieved: +5% salience boost
- Brand assets used: Updates last_accessed_at (prevents decay)
- Popular content stays relevant longer

**Daily Decay Application:**
- Edge Function: `apply-salience-decay` (deployed ✅)
- Runs daily (recommended: 2 AM UTC via cron)
- Applies exponential decay based on last access
- Never drops below 10% (minimum relevance floor)

##### **B. Composite Retrieval Scoring**

Multi-factor ranking replaces simple recency/keyword sorting:

**Formula:**
```
score = 0.4 × similarity + 0.2 × salience + 0.1 × recency + 0.1 × relationship + 0.2 × execution_success
```

**Components:**
1. **Similarity (40%)**: Keyword overlap, theme matching, content signature similarity
2. **Salience (20%)**: Current relevance score (time decay adjusted)
3. **Recency (10%)**: Exponential decay curve (e^(-days/90))
4. **Relationship (10%)**: Related content connections (future)
5. **Execution Success (20%)**: Proven performance (executed + feedback)

**Example:**
```typescript
{
  composite_score: 0.87,
  score_breakdown: {
    similarity: 0.9,     // Strong keyword match
    salience: 0.85,      // Recently accessed
    recency: 0.75,       // Created 30 days ago
    relationship: 0.0,   // Not yet implemented
    execution_success: 0.9  // Proven successful
  }
}
```

##### **C. Explainable Retrieval**

Every search result includes transparent reasoning:

```typescript
{
  retrieval_reason: "Strong match: AI safety, product launch • Proven successful • Type: press-release",
  confidence: 0.95,  // How confident (0.5-0.95)
  matched_on: ['AI safety', 'product launch', 'tech industry'],
  why_relevant: 'High-performing template for tech launches with 4 successful executions'
}
```

**Confidence Levels:**
- **0.95**: Strong similarity + good salience
- **0.90**: Proven execution success
- **0.85**: Strong similarity alone
- **0.75**: Good similarity + good salience
- **0.60**: Moderate similarity
- **0.50**: Weak match

##### **D. Playbook Intelligence System (NEW - Nov 4, 2025)**

The Playbook System transforms Memory Vault from a search tool into an intelligent knowledge layer that pre-digests successful patterns into compact, reusable guides.

**The Problem It Solves:**
- NIV Content was analyzing 5,000+ tokens of raw content in real-time
- Every request required expensive Claude analysis of past content
- No way to capture and reuse "what works" across content types
- Content generation was slow and inconsistent

**The Playbook Solution:**
Pre-synthesized guides organized by `content_type` + `topic` that contain:
- **Proven hooks** with success rates
- **Brand voice** and style guidelines
- **Proven structure** (sections, format, flow)
- **Success patterns** (what works)
- **Failure patterns** (what to avoid)
- **Optimal length** and format specs
- **Top performer references** (not full content)

**Token Efficiency:**
- Before: ~5,000 tokens (raw content analysis)
- After: ~300-500 tokens (compact playbook)
- **90% reduction** in context usage per request

**How It Works:**

```typescript
// 1. NIV Content searches Memory Vault
search_memory_vault({ query: "energy infrastructure", content_type: "media-pitch" })

// 2. System infers topic from query
topic = inferTopic("energy infrastructure") // → "energy"

// 3. Fetch or create playbook
playbook = getOrCreatePlaybook({
  organizationId: "...",
  contentType: "media-pitch",
  topic: "energy"
})

// 4. Return compact guidance instead of raw content
return formatPlaybookForClaude(playbook)
```

**Playbook Generation:**
- **Minimum data**: Requires 3+ pieces of content for that type + topic
- **Claude synthesis**: Analyzes patterns using Sonnet 4
- **Caching**: 7-day freshness, auto-regenerates when stale
- **Async**: Generation doesn't block content creation
- **Fallback**: Uses ad-hoc summary if playbook doesn't exist yet

**Example Playbook Output:**
```
📚 Content Playbook: media-pitch about energy

Proven Hooks:
1. Lead with specific regulatory/policy data (85% success)
   Example: "DOE invokes authority over $2B grid modernization..."
2. Connect to current energy crisis/transition (78% success)

Brand Voice: Authoritative but accessible
Style: Active voice, short paragraphs, data-driven
Avoid: Jargon, hype, generic sustainability claims

Proven Structure: Problem → Data → Solution → CTA
Sections:
  - Hook: Policy/regulatory development (1-2 sentences)
  - Context: Industry impact with data (2-3 paragraphs)
  - Client angle: How we're involved (1 paragraph)
  - CTA: Next steps for journalist (1 sentence)

Success Patterns:
  ✓ Include data in first paragraph
  ✓ Reference specific DOE/FERC actions
  ✓ Tie to infrastructure bill provisions

Avoid These:
  ✗ Generic sustainability claims
  ✗ Too much technical jargon
  ✗ Burying the news angle

Optimal Length: 750 words (range: 500-1000)

Top Performers:
1. "DOE Grid Modernization Pitch" - 92% success
2. "FERC Transmission Policy Update" - 87% success

---
*Based on 12 pieces of content (avg 85% success)*
```

**Database Schema:**

```sql
CREATE TABLE playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Identification
  content_type TEXT NOT NULL,  -- "media-pitch", "thought-leadership"
  topic TEXT NOT NULL,         -- "energy", "aviation", "general"

  -- The playbook (JSONB)
  playbook JSONB NOT NULL,  -- guidance, proven_hooks, brand_voice, etc.

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,

  UNIQUE(organization_id, content_type, topic)
);
```

**Playbook JSONB Structure:**
```json
{
  "guidance": {
    "proven_hooks": [
      {"hook": "...", "success_rate": 0.85, "example": "..."}
    ],
    "brand_voice": {
      "tone": "Authoritative but accessible",
      "style_points": ["Active voice", "Short paragraphs"],
      "avoid": ["Jargon", "Hype"]
    },
    "proven_structure": {
      "format": "Problem → Solution → CTA",
      "sections": [
        {"name": "Hook", "purpose": "...", "length": "1-2 sentences"}
      ]
    },
    "success_patterns": ["Include data in first paragraph", ...],
    "failure_patterns": ["Avoid generic claims", ...],
    "typical_length": {"words": {"min": 500, "max": 1000, "optimal": 750}}
  },
  "based_on": {
    "content_count": 12,
    "date_range": {"from": "...", "to": "..."},
    "avg_execution_score": 0.85
  },
  "top_performers": [
    {"id": "...", "title": "...", "execution_score": 0.92}
  ]
}
```

**Integration with NIV Content:**
- Replaced ad-hoc Memory Vault summaries with playbook retrieval
- NIV Content automatically gets best practices for each content type
- No changes needed to NIV workflow - transparent upgrade
- Falls back gracefully if no playbook exists

**Edge Function:**
- `generate-playbook` - Synthesizes playbooks from content patterns
  - Gathers 3-20 relevant content pieces
  - Uses Claude to extract patterns
  - Caches for 7 days
  - Returns INSUFFICIENT_DATA if < 3 pieces available

##### **E. Voyage AI Semantic Search (NEW - Nov 4, 2025)**

**Vector Embeddings:**
- **Model**: `voyage-3-large` (1024 dimensions)
- **Coverage**: 100% of content creation (all 21 insertion points)
- **Quality**: State-of-the-art semantic understanding

**Implementation:**
```typescript
// Generate embedding for all content
const embedding = await generateEmbedding(title + "\n\n" + content)

// Save with metadata
await supabase.from('content_library').insert({
  // ... content fields
  embedding: embedding,
  embedding_model: 'voyage-3-large',
  embedding_updated_at: new Date().toISOString()
})
```

**Embedding Coverage (21/21 insertion points):**
1. ✅ NIV Advisor - strategy saves
2. ✅ NIV Content Intelligent V2 - campaign generation (phase strategy)
3. ✅ NIV Content Intelligent V2 - campaign generation (content pieces)
4. ✅ NIV Content Intelligent V2 - auto-execute mode
5. ✅ NIV Content Intelligent V2 - conversation mode
6. ✅ NIV Campaign Memory - campaign saves
7. ✅ MCP Opportunity Detector V2 - opportunity saves
8. ✅ MCP Executive Synthesis - executive saves
9. ✅ Framework Auto-Execute - content creation
10. ✅ Website Entity Compiler - entity compilation
... (all 21 covered)

**Search Performance:**
- Semantic similarity using pgvector cosine distance
- Combined with composite scoring (similarity + salience + recency + execution)
- Sub-100ms search with ivfflat indexes

#### Database Schema

**Core Tables:**

```sql
-- Universal content storage
content_library (
  id uuid,
  organization_id uuid,
  content_type varchar(100),  -- press-release, blog-post, etc.
  title varchar(500),
  content text,
  metadata jsonb,
  tags text[],

  -- Intelligence fields (Oct 24)
  themes text[],                    -- AI-extracted themes
  topics text[],                    -- Specific subjects
  entities jsonb,                   -- Companies, people, products
  content_signature text,           -- 1-2 sentence summary
  sentiment decimal,                -- -1 to 1
  complexity varchar(50),           -- simple/moderate/complex
  related_content_ids uuid[],       -- Similar content
  intelligence_status varchar(50),  -- pending/processing/complete

  -- Salience scoring (NEW - Oct 26)
  salience_score decimal(3,2) DEFAULT 1.0,
  last_accessed_at timestamptz DEFAULT NOW(),
  decay_rate decimal(4,3) DEFAULT 0.005,
  access_count integer DEFAULT 0,

  -- Execution tracking (Oct 25)
  executed boolean DEFAULT false,
  feedback text,
  execution_score decimal(3,2),       -- 0.0-1.0 success rate

  -- Semantic search (NEW - Nov 4)
  embedding vector(1024),             -- voyage-3-large embeddings
  embedding_model varchar(100),       -- 'voyage-3-large'
  embedding_updated_at timestamptz,

  -- Organization
  folder varchar(500),
  created_by varchar(100),
  status varchar(50),
  created_at timestamptz,
  updated_at timestamptz
)

-- Brand templates and guidelines
brand_assets (
  id uuid,
  organization_id uuid,
  name varchar(500),
  asset_type varchar(100),  -- template-{type}, guidelines-brand
  file_url text,
  folder varchar(500),

  -- Extracted intelligence (Oct 24)
  extracted_guidelines jsonb,
  brand_voice_profile jsonb,
  template_structure jsonb,
  usage_instructions text,

  -- Performance tracking
  usage_count integer DEFAULT 0,
  success_rate decimal,

  -- Salience (NEW - Oct 26)
  salience_score decimal(3,2) DEFAULT 1.0,
  last_accessed_at timestamptz DEFAULT NOW(),
  access_count integer DEFAULT 0,

  status varchar(50),  -- uploading/analyzing/active/failed
  created_at timestamptz
)

-- Content relationships
content_relationships (
  id uuid,
  source_content_id uuid,
  target_content_id uuid,
  relationship_type varchar(50),  -- similar/follow-up/references/part-of-campaign
  confidence_score decimal(3,2),
  created_at timestamptz,
  UNIQUE(source_content_id, target_content_id)  -- Prevent duplicates
)

-- Smart folder organization
folder_index (
  id uuid,
  organization_id uuid,
  folder_path varchar(1000),
  item_count integer DEFAULT 0,
  content_types text[],
  themes text[],
  last_updated timestamptz
)

-- Async job processing
job_queue (
  id uuid,
  job_type varchar(100),  -- analyze-content, analyze-brand-asset, warm-cache
  payload jsonb,
  priority integer DEFAULT 5,
  status varchar(50),  -- pending/processing/completed/failed
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  worker_id varchar(100),
  error_message text,
  created_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz
)

-- Performance monitoring
performance_metrics (
  id uuid,
  metric_type varchar(100),
  metric_value decimal,
  metadata jsonb,
  created_at timestamptz
)

-- Playbook intelligence (NEW - Nov 4)
playbooks (
  id uuid,
  organization_id uuid,
  content_type text,                -- "media-pitch", "thought-leadership"
  topic text,                       -- "energy", "aviation", "general"
  playbook jsonb,                   -- Pre-synthesized guidance
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  version integer DEFAULT 1,
  UNIQUE(organization_id, content_type, topic)
)

-- Legacy NIV strategies (backward compatibility)
niv_strategies (
  -- Full NIV framework structure preserved
  -- Links to content_library via metadata
)
```

**Key Indexes:**
```sql
-- Fast brand context lookup (< 5ms)
idx_brand_assets_fast_lookup ON brand_assets(organization_id, asset_type, status)

-- Salience-based retrieval (NEW - Oct 26)
idx_content_library_salience ON content_library(salience_score DESC, created_at DESC)

-- Intelligence processing
idx_content_intelligence_status ON content_library(intelligence_status)

-- Vector search (NEW - Nov 4)
idx_content_library_embedding ON content_library USING ivfflat(embedding vector_cosine_ops)

-- Playbook lookups (NEW - Nov 4)
idx_playbooks_org_type_topic ON playbooks(organization_id, content_type, topic)
idx_playbooks_updated_at ON playbooks(updated_at)

-- Array/JSONB fields
idx_content_themes_gin ON content_library USING gin(themes)
idx_content_topics_gin ON content_library USING gin(topics)
```

#### Edge Functions

**Intelligence Processing:**
- `niv-memory-intelligence` - AI-powered content analysis
  - Extracts themes, topics, entities, sentiment
  - Suggests optimal folder placement
  - Discovers relationships with similar content
  - Updates intelligence_status: pending → processing → complete

- `analyze-brand-asset` - Brand template/guideline analysis
  - Parses voice profiles and guidelines
  - Extracts template structures
  - Generates usage instructions
  - JSON schema validation

**Salience Management (NEW - Oct 26):**
- `apply-salience-decay` - Time-based relevance decay
  - Applies daily decay to all content
  - Content-type specific decay rates
  - Updates both content_library and brand_assets
  - Dry-run mode for testing
  - Returns statistics (count, avg/min/max salience)

- `warm-brand-cache` - Cache pre-loading
  - Warms cache for active organizations
  - Pre-loads common content types
  - Scheduled via cron (every 5 minutes)
  - Reduces first-access latency to < 1ms

**Storage & Retrieval:**
- `niv-memory-vault` - Main persistence API
  - Universal save/retrieve for all content types
  - Composite scoring for search (NEW - Oct 26)
  - Legacy NIV strategy support
  - Pattern matching for successful content
  - Export functionality

**Playbook Intelligence (NEW - Nov 4):**
- `generate-playbook` - Pattern synthesis for content types
  - Analyzes 3-20 pieces of successful content
  - Uses Claude Sonnet 4 to extract patterns
  - Returns proven hooks, voice, structure, success/failure patterns
  - Caches for 7 days with automatic staleness detection
  - Requires minimum 3 pieces of content
  - INSUFFICIENT_DATA error if < 3 available

#### Frontend Components

**Memory Vault Module** (`MemoryVaultModule.tsx`):
- **Library Tab**: Browse content with folder tree
- **Assets Tab**: Manage templates and guidelines
- **Analytics Tab**: Performance metrics and usage stats

**Features:**
- Folder tree navigation with expand/collapse
- Content preview with themes, topics, entities
- Search and filter by type, folder, tags
- Context menu (move, copy, delete, export)
- Execution tracking (executed, result, feedback)
- Batch operations
- Salience-aware search results (NEW)
- Explainable retrieval reasons (NEW)

#### Performance Characteristics

| Operation | Target | Actual | Method |
|-----------|--------|--------|--------|
| Content save | < 200ms | 106-134ms | Direct INSERT + async queue |
| Brand context (cached) | < 1ms | < 1ms | In-memory Map lookup |
| Brand context (uncached) | < 20ms | < 20ms | DB query with timeout |
| Search (composite scoring) | < 100ms | < 100ms | Scoring + sort |
| Intelligence processing | 5-30s | 5-30s | Background job (non-blocking) |
| Salience decay (batch) | N/A | 2-5s | Daily cron |
| Cache warming | N/A | < 1s | Scheduled background |

**Zero-Latency Guarantees:**
- Content saves never wait for intelligence
- Brand context never blocks generation (returns null if unavailable)
- Salience decay runs in background
- Cache warming is pre-emptive

#### Integration Points

**With NIV Content Generation:**
```typescript
// 1. Fetch brand context (< 1ms if cached)
const brandContext = getBrandContextSync(organizationId, 'press-release')

// 2. Generate content with brand guidelines
const content = await generateContent({
  type: 'press-release',
  brandContext: brandContext?.guidelines,
  template: brandContext?.template
})

// 3. Save to Memory Vault (async intelligence)
await saveContent({
  type: 'press-release',
  content: content,
  organization_id: organizationId
})
// Intelligence extraction happens in background (4-6s)
```

**With Campaign Builder:**
- Saves campaign blueprints to Memory Vault
- Extracts stakeholder learnings for future campaigns
- Finds similar past campaigns for pattern matching
- Suggests proven strategies based on industry/stakeholders

**With Opportunity Engine:**
- Links opportunities to strategies and content
- Tracks execution status and results
- Stores feedback for execution success scoring
- Builds institutional knowledge of what works

#### Intelligence Workflow

```
User saves content → Content Library
                          ↓
                    Queue job (< 10ms)
                          ↓
                    Worker picks up (2s polling)
                          ↓
                    niv-memory-intelligence
                          ↓
            ┌─────────────┼─────────────┐
            ↓             ↓             ↓
        Themes      Entities     Sentiment
        Topics      Keywords     Complexity
            ↓             ↓             ↓
        Content Signature (Summary)
                          ↓
                Folder Suggestion
                          ↓
           Relationship Discovery
                          ↓
    Update content_library (intelligence_status = 'complete')
                          ↓
            Update folder_index
                          ↓
    Create content_relationships
```

**Processing Time:** 4-6 seconds (background, non-blocking)

#### Brand Context Caching

```
First Request:
  getBrandContext(org, type)
      ↓
  Cache miss
      ↓
  Query database (< 20ms with timeout)
      ↓
  Store in Map cache (5min TTL)
      ↓
  Return context

Subsequent Requests:
  getBrandContext(org, type)
      ↓
  Cache hit (< 1ms)
      ↓
  Return context

Cache Invalidation:
  Brand asset uploaded/updated
      ↓
  invalidateBrandContextCache(org)
      ↓
  Clear all content type caches for org
```

#### Salience Decay System

**How It Works:**
```
Content Created:
  salience_score = 1.0
  last_accessed_at = NOW()
  decay_rate = 0.005 (0.5% daily)

After 30 Days (not accessed):
  New salience = 1.0 × (1 - 0.005)^30
               = 1.0 × 0.86
               = 0.86 (14% decay)

After 90 Days (not accessed):
  New salience = 1.0 × (1 - 0.005)^90
               = 1.0 × 0.64
               = 0.64 (36% decay)

When Accessed:
  salience_score = MIN(1.0, 0.64 + 0.05)
                 = 0.69 (boosted)
  last_accessed_at = NOW() (resets decay clock)
  access_count = access_count + 1
```

**Prevents:**
- Stale content dominating search results
- Old templates being recommended over newer ones
- Outdated brand guidelines being used

**Enables:**
- Popular content staying relevant
- Recently-used content prioritized
- Natural content lifecycle management

#### Comparison: Memory Vault vs OpenMemory

**What Memory Vault Does BETTER:**
- ✅ Brand-specific intelligence (voice, guidelines, templates)
- ✅ Real performance tracking (execution results, feedback)
- ✅ Sub-millisecond caching (brand context < 1ms)
- ✅ Async processing (never blocks users)
- ✅ Workflow orchestration (PR/marketing focused)
- ✅ Smart folder organization (AI-suggested hierarchy)
- ✅ Integration with content generation (NIV, Campaign Builder)

**What We Added from OpenMemory:**
- ✅ **Time-based salience** (memory decay prevents stale content)
- ✅ **Composite scoring** (multi-factor ranking for retrieval)
- ✅ **Explainable retrieval** (transparent reasoning)

**Still Available from OpenMemory (Future):**
- **Cognitive categorization** (episodic/semantic/procedural sectors)
- **Multi-dimensional embeddings** (semantic vector search)
- **Concept waypoint graphs** (hierarchical memory clustering)

#### Use Cases

**1. Brand-Consistent Content Generation**
```typescript
// NIV generates press release
const brandContext = getBrandContextSync(org, 'press-release')
// Uses guidelines and template structure automatically
// Content matches brand voice without manual input
```

**2. Finding Proven Content Patterns**
```typescript
// Search with composite scoring
const results = await searchContent({
  query: 'product launch',
  type: 'press-release'
})
// Returns: High-salience, recently-used, proven-successful templates first
// Explains: "Proven successful • High relevance • Recently used"
```

**3. Institutional Knowledge Building**
```typescript
// Campaign completed successfully
await updateContent(id, {
  executed: true,
  feedback: 'Great media pickup, 15+ tier-1 placements'
})
// Future searches boost this pattern
// Execution success score = 0.9 (high impact on composite score)
```

**4. Self-Cleaning Content Library**
```typescript
// Daily cron runs apply-salience-decay
// Content from 6 months ago without access: salience = 0.5
// Content used last week: salience = 0.95
// Old content naturally fades from top results
```

#### Deployment Status

**Deployed Components:**
- ✅ Database schema with all tables and indexes
- ✅ Content save endpoint (< 200ms)
- ✅ Brand asset upload endpoint
- ✅ Intelligence extraction edge function
- ✅ Brand asset analysis edge function
- ✅ Salience decay edge function (NEW - Oct 26)
- ✅ Cache warming edge function
- ✅ Background job worker
- ✅ NIV memory vault API with composite scoring (NEW - Oct 26)
- ✅ Frontend Memory Vault module
- ⏳ Migration for salience columns (needs manual run in Supabase)
- ⏳ Daily cron for salience decay (needs setup)

**Performance Verified:**
- ✅ Sub-200ms content saves
- ✅ Sub-1ms brand context cache hits
- ✅ 4-6s intelligence processing (background)
- ✅ Composite scoring adds < 50ms to search

#### Known Issues & Future Work

**Current Limitations:**
- Relationship scoring (10% weight) not yet implemented - placeholder for future
- Daily salience decay cron needs manual setup
- Migration needs manual execution in Supabase SQL editor

**Planned Enhancements:**
1. **Content relationships**: Populate related_content_ids for relationship scoring
2. **Cognitive sectors**: Categorize content by memory type (episodic/semantic/procedural)
3. **Semantic embeddings**: Vector search for better similarity matching
4. **Concept graphs**: Hierarchical clustering via concept nodes
5. **Custom decay rates**: Per-organization tuning of salience decay

#### Key Differentiators

**Traditional Content Management:**
- Chronological or manual organization
- Keyword-only search
- No brand intelligence
- Manual categorization

**Memory Vault V2:**
- AI-powered auto-organization
- Multi-factor composite scoring
- Brand context with sub-ms lookup
- Intelligent categorization
- Time-aware relevance (salience decay)
- Explainable AI retrieval
- Proven performance tracking

**Impact:**
- **Faster content creation**: Brand context instantly available
- **Better results**: Composite scoring finds proven patterns
- **Self-maintaining**: Salience decay keeps library fresh
- **User trust**: Explainable retrieval builds confidence
- **Institutional memory**: Execution tracking preserves what works

#### Files & Documentation

**Core Implementation:**
- `/supabase/migrations/20250124_memory_vault_v2_schema.sql` - Main schema
- `/supabase/migrations/20251026_add_salience_scoring.sql` - Salience enhancement (NEW)
- `/src/app/api/content-library/save/route.ts` - Save endpoint with salience
- `/src/lib/memory-vault/brand-context-cache.ts` - Multi-layer caching
- `/src/lib/memory-vault/composite-retrieval-scoring.ts` - Scoring library (NEW)
- `/supabase/functions/niv-memory-vault/index.ts` - Main API with composite scoring
- `/supabase/functions/niv-memory-intelligence/index.ts` - AI analysis
- `/supabase/functions/analyze-brand-asset/index.ts` - Brand intelligence
- `/supabase/functions/apply-salience-decay/index.ts` - Decay cron (NEW)
- `/supabase/functions/warm-brand-cache/index.ts` - Cache warming
- `/src/lib/workers/job-worker.ts` - Background processor
- `/src/components/modules/MemoryVaultModule.tsx` - UI component

**Documentation:**
- `MEMORY_VAULT_NIV_INTEGRATION_GUIDE.md` - NIV integration patterns (Original - Oct 24)
- `MEMORY_VAULT_NIV_INTEGRATION_UPDATES.md` - Phase 2 integration guide (NEW - Oct 26)
- `NIV_INTEGRATION_TODO.md` - Implementation checklist (NEW - Oct 26)
- `MEMORY_VAULT_V2_DEPLOYMENT_STATUS.md` - Phase 1 deployment (Oct 24)
- `MEMORY_VAULT_OPENMEMORY_ENHANCEMENTS.md` - OpenMemory features (NEW - Oct 26)

#### NIV Integration with Composite Scoring ✅

**Status: Backend Complete - October 26, 2025**

NIV content generation now integrates with Memory Vault's composite scoring system to find and use proven successful templates automatically.

**How It Works:**

```
User asks NIV to generate content
↓
NIV calls search_memory_vault tool
├─→ Query: "press release for product launch"
├─→ Content type filter (optional)
└─→ Limit results (default 3, max 10)
↓
Memory Vault composite scoring
├─→ 40% Semantic similarity (relevant to query)
├─→ 20% Salience score (time-based relevance)
├─→ 10% Recency score (recently created/used)
├─→ 20% Execution success (proven results)
└─→ 10% Relationship score (connected content)
↓
Returns ranked templates with explainable reasoning
├─→ Rank #1: Score 4.2/5
├─→ Why: "Proven successful • High relevance • Recently used"
├─→ Metrics: 92% relevance, 90% success rate, used 15×
└─→ Full content + preview
↓
NIV mentions template to user
"I found a proven template used 15 times with 90% success rate"
↓
NIV generates content using proven pattern
```

**Backend Implementation:**

**1. New Tool Added**
- Tool: `search_memory_vault` in `niv-content-intelligent-v2/index.ts:730-752`
- Searches Memory Vault via composite scoring API
- Returns templates with explainable retrieval reasons
- Includes success metrics (relevance %, success rate, usage count)

**2. Tool Handler**
- Location: `niv-content-intelligent-v2/index.ts:1706-1770`
- Invokes `niv-memory-vault` edge function with composite scoring
- Formats results for Claude with full context
- Graceful error handling - proceeds without templates if search fails

**3. System Prompt Update**
- Location: `niv-content-intelligent-v2/system-prompt.ts:31-41`
- Guides NIV to search templates before generating content
- Encourages transparent communication about proven patterns
- Emphasizes templates are optional enhancements

**Template Result Format:**
```typescript
{
  rank: 1,
  title: "Product Launch Press Release",
  type: "press-release",
  content_preview: "First 500 chars...",
  score: "4.20",  // Composite score 0-5
  why_recommended: "Proven successful • High relevance • Recently used",
  metrics: {
    relevance: "92%",           // Semantic similarity
    success_rate: "90%",        // Execution score
    times_used: 15,             // Access count
    last_used: "2025-10-20"
  },
  executed: true,
  full_content: "Complete template content..."
}
```

**User Experience:**

**Without Templates (No Data Yet):**
```
User: "Write a press release for our product launch"
NIV: "I'll create a professional press release for your launch..."
[Generates content normally]
```

**With Templates (After Some Usage):**
```
User: "Write a press release for our product launch"
NIV: "I found a proven template that's been used 15 times with 90% success rate.
I'll use its structure while customizing for your specific launch..."
[Generates content based on proven pattern]
```

**Key Benefits:**

1. **Self-Improving System**
   - Successful campaigns automatically rank higher
   - Proven patterns surface first
   - Institutional knowledge preserved

2. **Transparent AI**
   - "Why recommended" builds user trust
   - Success metrics visible (relevance, success rate, usage)
   - Clear reasoning for recommendations

3. **Zero Configuration**
   - Works immediately, no setup required
   - Fail-safe - works perfectly without templates
   - Optional enhancement, never blocks generation

4. **Performance**
   - < 50ms added latency for search
   - Negligible impact on NIV response time
   - Only searches when relevant

**Integration Status:**

**✅ Completed (Oct 26):**
- search_memory_vault tool implementation
- Composite scoring API integration
- System prompt updates
- Error handling and fail-safes
- Documentation and guides

**⏳ Future Enhancements (When Testing with Real Data):**
- Frontend UI to display Memory Vault results
- Execution tracking UI (mark content as complete)
- Attribution analytics links from generated content
- Success metrics badges in template selection

**Performance Verified:**
- Tool search: < 50ms
- Total NIV impact: Negligible
- Fail-safe: Works without templates
- Self-improving: Gets better with usage

---

### 6.6 Campaign Attribution System ✅

**Status: Fully Deployed - October 26, 2025**

The Campaign Attribution System automatically tracks campaign performance by fingerprinting content at export and attributing discovered media coverage back to campaigns. This closes the learning loop, enabling SignalDesk to learn from what works and surface successful patterns for future campaigns.

#### The Learning Loop:

```
Campaign Content Created
↓
FINGERPRINT CREATION (campaign-fingerprint-create)
├─→ Extract 5-10 unique key phrases via Claude
├─→ Generate semantic embeddings (OpenAI text-embedding-3-small)
├─→ Generate headline embeddings separately
├─→ Identify unique angles and messaging patterns
└─→ Store fingerprint with 90-day tracking window
    ↓
Intelligence Monitoring Detects Article
    ↓
ATTRIBUTION CHECK (campaign-attribution-check)
├─→ Level 1: Exact Phrase Matching (95% confidence)
│   └─→ 2+ exact key phrases = HIGH match
├─→ Level 2: Semantic Similarity (75-85% confidence)
│   └─→ Vector search via match_content_to_fingerprints()
└─→ Level 3: Contextual AI Analysis (65-75% confidence)
    └─→ Claude analyzes timing, source, angles
    ↓
Match Found → Attribution Recorded
    ↓
PERFORMANCE TRACKING (campaign-performance-get)
├─→ Total coverage count
├─→ Reach estimation
├─→ Sentiment breakdown (positive/neutral/negative)
├─→ Top outlets and source types
├─→ Timeline visualization
└─→ Confidence distribution
    ↓
Campaign Completed
    ↓
OUTCOME RECORDING (campaign-outcome-record)
├─→ Extract learnings via Claude AI
├─→ Calculate effectiveness score (0-5)
├─→ Categorize outcome (success/partial/minimal/failed)
├─→ Boost salience for successful strategies (1.5x)
└─→ Create waypoints to similar successful campaigns
    ↓
Learnings Stored in Semantic Memory
    ↓
Future Recommendations Improved
```

#### Database Schema (6 Tables):

**1. campaign_fingerprints**
- Core fingerprinting table linking content to campaigns
- Key fields: `key_phrases[]`, `semantic_embedding vector(768)`, `headline_embedding vector(768)`, `unique_angles JSONB`
- Tracks campaign metadata: `campaign_id`, `content_id`, `content_type`, `expected_channels[]`
- Time windows: `exported_at`, `tracking_end` (default 90 days)
- Status tracking: `export_status` (draft/exported/matched)

**2. content_exports**
- Audit trail of all content exports
- Tracks: export method, destinations, user, timestamp
- Links to: `content_id`, `fingerprint_id`

**3. campaign_attributions**
- Records discovered media coverage matching fingerprints
- Match metadata: `confidence_score`, `match_type`, `match_details JSONB`
- Content details: `source_type`, `source_outlet`, `content_title`, `content_text`
- Performance: `estimated_reach`, `sentiment`, `published_at`
- Verification: `user_verified`, `verified_at`

**4. strategy_embeddings**
- Semantic embeddings for successful strategies
- Multi-sector storage: `episodic_embedding`, `semantic_embedding`, `procedural_embedding`, `emotional_embedding`, `reflective_embedding`
- Salience tracking: `salience`, `access_count`, `last_accessed_at`
- Links to: `strategy_id`, `outcome_id`

**5. strategy_waypoints**
- Graph of relationships between similar successful campaigns
- Fields: `from_strategy_id`, `to_strategy_id`, `weight`, `link_type`
- Enables "campaigns like this" recommendations

**6. strategy_outcomes**
- Final campaign results and learnings
- Outcome classification: `outcome_type` (success/partial/minimal/failed)
- Scoring: `effectiveness_score` (0-5)
- Learnings: `key_learnings[]` (AI-extracted insights)
- Performance: `success_factors JSONB`, `failure_factors JSONB`
- Metrics: `total_coverage`, `total_reach`, `avg_confidence`

#### Edge Functions (4 Deployed):

**1. campaign-fingerprint-create** (76.23kB)
- **Trigger**: Called when content is exported (copy, email, download)
- **Process**:
  - Extracts 5-10 unique key phrases via Claude Sonnet 4
  - Identifies unique angles and messaging patterns
  - Generates semantic embeddings (full content, 768 dimensions)
  - Generates headline embeddings (title/hook, 768 dimensions)
  - Creates fingerprint with 90-day tracking window
- **Returns**: Fingerprint ID and tracking metadata

**2. campaign-attribution-check** (78.34kB)
- **Trigger**: Called during intelligence monitoring when new articles detected
- **Multi-Level Matching**:
  - **Exact Phrase** (95% confidence): 2+ exact key phrase matches
  - **Semantic** (75-85% confidence): Vector similarity via `match_content_to_fingerprints()`
  - **Contextual** (65-75% confidence): AI analysis of timing, source, angles
- **Returns**: Match result with attribution ID or no-match reason

**3. campaign-performance-get** (76.13kB)
- **Trigger**: Called when viewing campaign analytics dashboard
- **Metrics Calculated**:
  - Total coverage count and high-confidence matches
  - Total reach estimation
  - Average confidence score
  - Sentiment breakdown (positive/neutral/negative)
  - Coverage by source type (news/twitter/linkedin/blog)
  - Top 10 outlets with reach per outlet
  - Timeline of coverage with match types
  - Verification status (verified vs pending)
- **Returns**: Complete performance object with attributions array

**4. campaign-outcome-record** (78.8kB)
- **Trigger**: Called when campaign marked complete or after tracking period
- **Process**:
  - Fetches all campaign attributions
  - Extracts 3-5 key learnings via Claude AI
  - Calculates effectiveness score (coverage + reach + confidence components)
  - Categorizes outcome type based on performance thresholds
  - Records learnings and success/failure factors
  - **For successful campaigns**:
    - Boosts strategy salience by 1.5x (max 1.0)
    - Creates waypoints to other successful campaigns (top 5 by effectiveness)
- **Returns**: Outcome ID, learnings, effectiveness score

#### Multi-Level Attribution Matching:

**Level 1: Exact Phrase Matching (95% Confidence)**
```typescript
// Find articles with 2+ exact key phrase matches
const exactMatches = findExactPhraseMatches(articleContent, fingerprint.key_phrases)
if (exactMatches.length >= 2) {
  confidence = 0.95
  matchType = 'exact_phrase'
}
```

**Level 2: Semantic Similarity (75-85% Confidence)**
```typescript
// Vector search via PostgreSQL function
const semanticMatches = await supabase.rpc('match_content_to_fingerprints', {
  content_embedding: articleEmbedding,
  org_filter: organizationId,
  match_threshold: 0.75,
  match_count: 3
})
// Filters by timing (published within 30 days of campaign)
```

**Level 3: Contextual AI Analysis (65-75% Confidence)**
```typescript
// Claude analyzes campaign fingerprint vs article
const contextMatch = await checkContextualMatch(
  articleTitle, articleContent, articleSource,
  publishedAt, fingerprint
)
// Returns: is_match, confidence, reasoning, matched_elements
```

#### Learning Loop Integration:

**1. Salience Boosting for Success**
```sql
-- Successful campaigns get 1.5x salience boost
UPDATE strategy_embeddings
SET salience = LEAST(salience * 1.5, 1.0),
    access_count = access_count + 1,
    last_accessed_at = NOW()
WHERE strategy_id = '{successful_strategy_id}'
```

**2. Waypoint Graph Creation**
```typescript
// Link to other successful campaigns (effectiveness >= 3.5)
const waypoints = successfulStrategies.map(s => ({
  from_strategy_id: strategyId,
  to_strategy_id: s.strategy_id,
  weight: s.effectiveness_score / 5, // Normalize 0-1
  link_type: 'successful_pattern'
}))
```

**3. AI-Extracted Learnings**
```typescript
// Claude analyzes outcomes and extracts insights
const learnings = await extractLearnings(performance, strategy)
// Returns: ["High-confidence placements in tier-1 outlets drove 80% of reach", ...]
```

#### Integration Points:

**Content Export Flow** (To Be Implemented):
```typescript
// In content export handlers (copy/email/download)
const fingerprint = await supabase.functions.invoke('campaign-fingerprint-create', {
  body: {
    contentId, campaignId, organizationId,
    content, contentType, exportMethod
  }
})
```

**Intelligence Monitoring** (To Be Implemented):
```typescript
// In article detection flow
const attribution = await supabase.functions.invoke('campaign-attribution-check', {
  body: {
    organizationId, articleContent, articleTitle,
    articleUrl, sourceType, sourceOutlet,
    publishedAt, estimatedReach
  }
})

if (attribution.match) {
  // Show attribution badge in intelligence UI
  // Notify campaign owner of new coverage
}
```

**Analytics Dashboard** (To Be Implemented):
```typescript
// Campaign performance view
const performance = await supabase.functions.invoke('campaign-performance-get', {
  body: { campaignId, organizationId }
})

// Display metrics, timeline, top outlets
// Show attribution confidence distribution
// Enable user verification of matches
```

#### Performance Metrics:

**Outcome Classification:**
- **Success**: 10+ coverage, 80%+ avg confidence
- **Partial**: 5-9 coverage
- **Minimal**: 1-4 coverage
- **Failed**: 0 coverage

**Effectiveness Score (0-5):**
- Coverage component (0-2 points): `min(total_coverage / 10, 1) × 2`
- Reach component (0-2 points): `min(total_reach / 1M, 1) × 2`
- Confidence component (0-1 point): `avg_confidence`

#### Key Differentiators:

1. **Multi-Level Matching**: Three confidence tiers (exact/semantic/contextual) catch different types of attribution
2. **Automatic Learning**: Successful campaigns automatically boost salience and create waypoints
3. **AI-Extracted Insights**: Claude analyzes outcomes to extract actionable learnings
4. **Export-Only Model**: Fingerprinting at export time, no tracking pixels or direct posting required
5. **90-Day Windows**: Automatic tracking periods with configurable extensions
6. **Verification Workflow**: Low-confidence matches flagged for user review

**Deployment Status:**
- ✅ Database migration applied (October 26, 2025)
- ✅ All 4 edge functions deployed (October 26, 2025)
- ✅ Vector indexes created for semantic search
- ✅ PostgreSQL functions for matching operational
- ⏳ Frontend integration (export flow, attribution UI, analytics dashboard)
- ⏳ Monitoring pipeline integration
- ⏳ Notification system for new attributions

**Documentation:**
- `CAMPAIGN_ATTRIBUTION_IMPLEMENTATION_GUIDE.md` - Complete integration guide
- `supabase/migrations/20251026_campaign_attribution_system.sql` - Database schema
- Edge function source: `supabase/functions/campaign-*`

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

### Schema.org Generation Pipeline (Oct 31, 2025):
**PRODUCTION READY - Intelligent Website Scraping + AI Entity Extraction + GEO Enhancements**

1. **Architecture**: Complete end-to-end Schema.org markup generation
   - Firecrawl Map API for intelligent page discovery (no URL guessing)
   - Claude-powered entity extraction from scraped content
   - GEO-optimized schema enhancement (FAQs, keywords, awards)
   - Direct UI pipeline calls (no orchestrator timeout issues)

2. **Complete Pipeline Flow**:
   ```
   Organization (name, domain, industry)
       ↓
   website-entity-scraper - Firecrawl Map discovers real pages
       ├── Extracts base domain from any URL format
       ├── Uses Map endpoint with search filtering
       ├── Filters out 404 pages during scraping
       └── Returns 10-20 actual pages with markdown content
       ↓
   entity-extractor - Claude extracts structured entities
       ├── Processes scraped markdown content
       ├── Extracts: services, products, people, locations, subsidiaries
       └── Returns structured JSON entities
       ↓
   entity-enricher - Validates and deduplicates entities
       ├── Quality checks and validation
       ├── Removes duplicates
       └── Enriches with additional context
       ↓
   schema-graph-generator - Creates base Schema.org graph
       ├── Builds @graph with typed entities
       ├── Links relationships (employees, locations, subsidiaries)
       └── Saves to content_library
       ↓
   geo-schema-enhancer - Adds GEO optimizations
       ├── Claude generates 6-8 FAQPage questions
       ├── Extracts 20+ relevant keywords (knowsAbout)
       ├── Identifies awards and achievements
       ├── Enhances entity descriptions
       └── Updates database with enhanced schema
   ```

3. **Key Innovations**:
   - **Firecrawl Map Discovery**: Uses `/v2/map` endpoint to discover actual pages (vs. guessing URLs)
   - **Zero 404s**: Map only returns pages that exist, filtered by search relevance
   - **Direct Pipeline**: UI calls functions directly, avoids orchestrator timeout
   - **Enhanced Schema Saving**: Updates database with GEO-enhanced version automatically

4. **Results Quality** (Mitsui & Co. Example):
   - **Services**: 2 (Corporate Development, IT & Communication)
   - **Locations**: 3 (New York, Singapore, Tokyo with full addresses)
   - **Subsidiaries**: 3 (USA, Asia Pacific, Canada operations)
   - **People**: 3 executives (with photos and titles)
   - **FAQs**: 6 relevant questions about the company
   - **Keywords**: 22 industry-specific terms

5. **Edge Functions**:
   - `website-entity-scraper` - Firecrawl Map integration
   - `entity-extractor` - Claude entity extraction
   - `entity-enricher` - Validation and deduplication
   - `schema-graph-generator` - Schema.org graph creation
   - `geo-schema-enhancer` - GEO optimization layer

6. **Frontend Integration**:
   - Organization Settings → "Regenerate Schema" button
   - Direct function calls with progress logging
   - Enhanced schema auto-saved to database
   - Displayed in schema editor/viewer

### GEO Intelligence Monitor (Oct 27, 2025):
**PRODUCTION READY - AI Visibility Testing**

1. **Architecture**: Complete GEO monitoring system with Claude-powered query generation
   - Tests brand visibility across Claude, Gemini, Perplexity, and ChatGPT platforms
   - Uses intelligent query generation (not static templates)
   - Organization-aware (passes org_id, org_name, industry throughout)
   - Date-aware prompts (prevents temporal drift to 2024)
   - Citation tracking from Gemini (search grounding) and Perplexity (built-in citations)

2. **Complete Pipeline Flow**:
   ```
   Organization Context (org_id, org_name, industry)
       ↓
   geo-query-discovery - Claude generates 25-30 contextual queries
       ├── Applies GEOIntelligenceRegistry patterns (17 industries)
       ├── Categorizes by intent (comparison, competitive, transactional)
       └── Prioritizes (critical, high, medium)
       ↓
   geo-intelligence-monitor - Tests 20 queries across 4 platforms
       ├── Claude Sonnet 4.5 testing (5 queries)
       ├── Gemini 2.0 Flash testing (5 queries) - Direct API with search grounding
       ├── Perplexity Sonar testing (5 queries) - Built-in citations
       ├── ChatGPT GPT-4o testing (5 queries)
       ├── Analyzes mentions, recommendations, positioning
       ├── Extracts citation sources (Gemini & Perplexity)
       └── Generates actionable signals with recommendations
       ↓
   geo_intelligence table - Stores signals with recommendations
       ├── Signal types: ai_visibility, visibility_gap, competitor_update
       ├── Platform tags: claude, gemini, perplexity, chatgpt
       ├── Citation sources and domains (for PR targeting)
       └── Priority levels: critical, high, medium
   ```

3. **Key Features**:
   - **Intelligent Query Generation**: Claude analyzes organization and generates contextual queries
   - **GEOIntelligenceRegistry**: 872-line registry with 17 industries (mirrors MasterSourceRegistry)
   - **4-Platform Coverage**: Claude, Gemini, Perplexity, ChatGPT (most comprehensive in industry)
   - **Citation Tracking**: Extracts sources from Gemini (search grounding) & Perplexity (built-in citations)
   - **Direct API Integration**: Simple API key authentication (no complex OAuth)
   - **Cost Control**: Tests 20 queries (5 per platform) for ~$0.30-0.40 per analysis
   - **PR Intelligence**: Identifies which publications AI platforms cite for competitor coverage
   - **Actionable Signals**: Specific recommendations like "Create content targeting [topic]"
   - **Intelligence Hub Integration**: Dedicated GEO tab alongside Synthesis, Social, Real-Time, Predictions

4. **Technical Implementation**:
   - Location: `/src/components/modules/IntelligenceModule.tsx` (GEO tab with Globe icon)
   - Edge Functions: geo-query-discovery (query generation), geo-intelligence-monitor (visibility testing)
   - Database: geo_intelligence table with RLS disabled, GRANT permissions for service_role
   - Registry: `/src/lib/services/GEOIntelligenceRegistry.ts` (872 lines, 17 industries)
   - UI: Tab button, loading states, signal display with priority badges and recommendations

5. **Key Fixes**:
   - Fixed Gemini authentication (switched from Vertex AI OAuth to Direct Gemini API)
   - Fixed model name (gemini-2.0-flash-001, not gemini-pro or gemini-1.5-flash)
   - Fixed database permissions (GRANT ALL to service_role, not just RLS policies)
   - Fixed date context (queries reference 2025, not 2024)

6. **Performance**:
   - Query Generation: 8-12 seconds (30 queries via Claude)
   - Claude Testing: 15-20 seconds (5 queries)
   - Gemini Testing: 10-15 seconds (5 queries)
   - Total Runtime: ~40 seconds
   - Success Rate: >95% query generation, >90% visibility testing

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
- Fixed GEO schema updater JSON parsing error (Oct 29, 2025):
  - Schema content stored as JSON string but code expected parsed object
  - Added JSON.parse() when reading schemas from database
  - Added JSON.stringify() when saving updated schemas
  - Resolved "Invalid schema: missing @context or @type" validation error
  - Function: geo-schema-updater

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

**Total Active Edge Functions: 67+**
- Campaign Builder: 8 functions
- Blueprint V3 Pipeline: 6 functions
- Core NIV: 7 functions
- Memory Vault V2: 5 functions (NEW - Oct 24-26)
- Intelligence Pipeline: 8 functions
- GEO Intelligence: 3 functions (NEW - Oct 27, 2025)
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
- framework-auto-execute (framework-to-content bridge)

Memory Vault V2 Functions (NEW - Oct 24-26):
- niv-memory-vault (main persistence API with composite scoring)
- niv-memory-intelligence (AI-powered content analysis)
- analyze-brand-asset (brand template/guideline intelligence)
- apply-salience-decay (time-based relevance decay - cron)
- warm-brand-cache (cache pre-loading - cron)

Intelligence Pipeline:
- mcp-discovery (organization profile generation)
- monitor-stage-1 (article collection ~100 articles)
- monitor-stage-2-relevance (PR scoring, threshold 30+)
- monitoring-stage-2-enrichment (event/entity extraction)
- intelligence-orchestrator-v2 (sequential processing coordinator)
- mcp-executive-synthesis (C-suite analysis with 5 personas)
- mcp-opportunity-detector (8-10 opportunities per run)
- opportunity-orchestrator-v2 (creative campaign enhancement)

GEO Intelligence (Production Ready - Oct 27, 2025):
- geo-query-discovery (Claude-powered query generation - 30 queries)
- geo-intelligence-monitor (AI visibility testing - Claude + Gemini + Perplexity + ChatGPT)
- geo-schema-updater (applies schema recommendations to Memory Vault schemas)

Real-Time Intelligence (Oct 2025):
- real-time-synthesis (UI-optimized breaking summary + alerts)
- niv-fireplexity-monitor (company-specific query generation)
- mcp-crisis (crisis detection, assessment, response)

Stakeholder Predictions (Production Ready - Oct 27, 2025):
- real-time-prediction-generator (generates predictions with target matching and trigger tracking)
- prediction-monitor (automated outcome monitoring and validation)
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

GEO Intelligence:
/api/supabase/functions/geo-query-discovery - Query generation (Claude)
/api/supabase/functions/geo-intelligence-monitor - Visibility testing (Claude + Gemini)
/api/supabase/functions/geo-schema-updater - Schema recommendation application
/api/supabase/functions/mcp-executive-synthesis - C-suite analysis
/api/supabase/functions/mcp-opportunity-detector - Opportunity detection
/api/supabase/functions/opportunity-orchestrator-v2 - Creative enhancement

Real-Time & Crisis:
/api/supabase/functions/real-time-synthesis - Real-time intelligence
/api/supabase/functions/niv-fireplexity-monitor - Company-specific queries
/api/supabase/functions/mcp-crisis - Crisis detection & response
/api/supabase/functions/niv-crisis-consultant - Crisis planning
/api/supabase/functions/niv-crisis-advisor - Real-time guidance

Stakeholder Predictions (Production Ready - Oct 27, 2025):
/api/supabase/functions/real-time-prediction-generator - Prediction generation with target matching
/api/supabase/functions/prediction-monitor - Automated outcome monitoring and validation
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

- **Campaign Builder**: Complete 5-stage workflow from research to VECTOR campaign execution
- **NIV Strategic Brain**: Research via niv-fireplexity, framework generation with 20+ campaign types
- **Intelligence Pipeline**: Discovery → Monitor → Enrichment → Synthesis → Opportunities flow
- **GEO Intelligence Monitor**: AI visibility testing across Claude, Gemini, Perplexity, and ChatGPT with intelligent query generation and citation tracking (Production Ready - Oct 27, 2025)
- **Real-Time Intelligence**: Claude-powered breaking news monitoring with crisis detection
- **Crisis Management**: Automatic detection, severity assessment, response generation
- **Stakeholder Predictions**: Complete tracking system with target integration, validation, and accuracy metrics (Production Ready - Oct 27, 2025)
- **Opportunity Engine**: Detection + creative enhancement transforming insights into ACTION
- **Memory Vault V2**: Intelligent content management with OpenMemory-inspired enhancements (NEW Oct 24-26)
  - AI-powered intelligence extraction (themes, entities, sentiment)
  - Time-aware salience scoring with content decay
  - Composite retrieval scoring (multi-factor ranking)
  - Explainable AI retrieval (transparent reasoning)
  - Brand context caching (< 1ms lookup)
  - Self-cleaning content library
- **Multi-Modal Content**: Text, images (Imagen 3), videos (Veo 3), presentations (Gamma)
- **Export-Only Distribution**: Maintaining compliance and audit trails

The platform transforms intelligence from a cost center into a **REVENUE GENERATOR** by telling organizations not just WHAT is happening, but **WHAT TO DO ABOUT IT**.

**Memory Vault V2** represents a major innovation: the industry's first **self-organizing, time-aware institutional memory system** for PR/marketing, combining brand intelligence with cognitive memory concepts to deliver smarter content retrieval and natural content lifecycle management.

### System Health: 🟢 OPERATIONAL
### NIV Phase: Phase 3 Active (85% Complete)
### Intelligence Pipeline: PRODUCTION READY
### GEO Intelligence Monitor: PRODUCTION READY (Oct 27, 2025)
### Real-Time Intelligence: DEPLOYED
### Memory Vault V2: PRODUCTION READY (OpenMemory Enhanced - Oct 26, 2025)
### Core Differentiator: ACTIVATED

---

*This document serves as the authoritative source for SignalDesk V3 system status and architecture.*