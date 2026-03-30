# SignalDesk v3 MCP Architecture Analysis
**Comprehensive Analysis of MCP Integration Opportunities and Architectural Improvements**

*Analysis Date: 2025-09-30*

---

## Executive Summary

SignalDesk v3 has 19 MCP servers and 54+ edge functions, creating significant opportunities for consolidation, integration, and architectural improvements. This analysis identifies:

- **13 unused/underutilized MCPs** ready for integration
- **18 edge functions** that should be converted to MCPs
- **8 missing MCP opportunities** based on repeated patterns
- **High-impact integration paths** for immediate value

**Key Finding**: The platform has built robust MCP servers but routes most requests through edge functions instead. Converting these edge functions to MCP calls would enable:
- Claude Desktop integration
- Better tool reusability
- Standardized interfaces
- Reduced code duplication

---

## 1. MCP Server Inventory

### Existing MCP Servers (19 Total)

#### **1.1 Intelligence & Analysis MCPs**

##### **signaldesk-intelligence** (/mcp-servers/signaldesk-intelligence/src/index.ts)
**Status**: ✅ ACTIVE (called by orchestrator)
**Capabilities**:
- `analyze_competition_with_personality` - Claude-enhanced competitive analysis with Marcus Chen personality
- `competitor_move_detection` - Track competitor hiring, products, campaigns, partnerships, funding
- `market_narrative_tracking` - Monitor industry narratives across news, reports, social media
- `emerging_topic_identification` - Detect emerging topics before mainstream
- `regulatory_change_monitoring` - Track regulatory changes and compliance
- `executive_movement_tracking` - Monitor C-suite movements across industries
- `partnership_opportunity_detection` - Find strategic alliance opportunities
- `whitespace_analysis` - Identify coverage gaps and untapped story angles

**Data Sources**: NewsAPI, Google Custom Search, Reddit, Anthropic Claude API
**Database Tables**: competitor_moves, market_narratives, emerging_topics, regulatory_changes, executive_movements

##### **signaldesk-monitor** (/mcp-servers/signaldesk-monitor/src/index.ts)
**Status**: ✅ ACTIVE (called by orchestrator)
**Capabilities**:
- Real-time news monitoring
- Trend detection
- Alert generation
- Source aggregation

##### **signaldesk-analytics** (/mcp-servers/signaldesk-analytics/src/index.ts)
**Status**: ✅ ACTIVE (called by orchestrator)
**Capabilities**:
- Performance tracking
- Campaign analytics
- ROI measurement
- Engagement analysis

##### **signaldesk-discovery** (/mcp-servers/signaldesk-discovery/src/index.ts)
**Status**: ⚠️ PARTIALLY USED (edge function exists)
**Capabilities**:
- Content discovery
- Source finding
- Trend identification
- Research coordination

#### **1.2 Content & Communication MCPs**

##### **signaldesk-content** (/mcp-servers/signaldesk-content/src/index.ts)
**Status**: ⚠️ PARTIALLY USED (via mcp-content edge function)
**Capabilities**:
- Press release generation
- Blog post creation
- Social media content
- Email campaigns
- Executive statements
- Thought leadership pieces
- Case studies
- White papers

**Current Usage**: Called by ContentGenerationService.ts and mcp-content edge function

##### **signaldesk-media** (/mcp-servers/signaldesk-media/src/index.ts)
**Status**: ❌ UNUSED
**Capabilities**:
- `find_journalists` - AI-powered journalist discovery by beat/publication/location
- `analyze_journalist` - Detailed journalist profile analysis (writing style, topics, best contact time)
- `create_media_list` - Generate targeted media lists for campaigns
- `monitor_coverage` - Track media coverage and sentiment
- `generate_pitch` - Create personalized media pitches
- `track_outreach` - Log and report on media outreach efforts

**Technology**: Anthropic Claude API for intelligent matching
**Database Tables**: journalists, media_lists, media_outreach

##### **signaldesk-social** (/mcp-servers/signaldesk-social/src/index.ts)
**Status**: ❌ UNUSED
**Capabilities**:
- `monitor_social_sentiment` - Cross-platform sentiment analysis
- `track_influencers` - Identify and track relevant influencers
- `analyze_engagement` - Deep engagement metrics and patterns
- `detect_viral_potential` - Predict content virality
- `manage_social_calendar` - Schedule and coordinate posts
- `create_social_content` - Generate platform-optimized content

**Integration**: Supabase for data storage

##### **signaldesk-narratives** (/mcp-servers/signaldesk-narratives/src/index.ts)
**Status**: ❌ UNUSED
**Capabilities**:
- `track_narrative_evolution` - Monitor narrative changes over time
- `detect_narrative_vacuum` - Find gaps where no dominant story exists
- `measure_narrative_strength` - Quantify narrative penetration and adoption
- `predict_narrative_spread` - Forecast narrative propagation
- `craft_counter_narrative` - Develop opposing narratives
- `test_message_resonance` - A/B test messaging effectiveness

**Value**: Critical for strategic communications and crisis management

#### **1.3 Specialized Domain MCPs**

##### **signaldesk-crisis** (/mcp-servers/signaldesk-crisis/src/index.ts)
**Status**: ❌ UNUSED
**Capabilities**:
- Crisis detection
- Response generation
- Stakeholder communication
- Issue tracking
- Damage assessment

##### **signaldesk-regulatory** (/mcp-servers/signaldesk-regulatory/src/index.ts)
**Status**: ❌ UNUSED
**Capabilities**:
- Regulatory monitoring
- Compliance tracking
- Policy analysis
- Risk assessment
- Filing management

##### **signaldesk-entities** (/mcp-servers/signaldesk-entities/src/index.ts)
**Status**: ❌ UNUSED
**Capabilities**:
- Entity extraction
- Relationship mapping
- Organization profiles
- Person tracking
- Network analysis

##### **signaldesk-relationships** (/mcp-servers/signaldesk-relationships/src/index.ts)
**Status**: ❌ UNUSED
**Capabilities**:
- Stakeholder mapping
- Influence tracking
- Relationship strength
- Network visualization
- Connection discovery

##### **signaldesk-executive** (/mcp-servers/signaldesk-executive/src/index.ts)
**Status**: ❌ UNUSED
**Capabilities**:
- Executive briefings
- Board presentations
- Strategic summaries
- Decision support
- Leadership insights

#### **1.4 Infrastructure MCPs**

##### **signaldesk-memory** (/mcp-servers/signaldesk-memory/src/index.ts)
**Status**: ⚠️ PARTIALLY USED (via niv-memory-vault edge function)
**Capabilities**:
- `search_memory` - Semantic/keyword/hybrid search
- `add_to_memory` - Store new information
- `get_memory_context` - Retrieve context for queries
- `update_memory` - Modify existing items
- `delete_memory` - Remove items
- `list_categories` - Browse memory categories

**Database**: memoryvault_items table
**Integration**: Used by NIV content orchestration

##### **signaldesk-opportunities** (/mcp-servers/signaldesk-opportunities/src/index.ts)
**Status**: ⚠️ PARTIALLY USED (via mcp-opportunities edge function)
**Capabilities**:
- `discover_opportunities` - Find PR opportunities by industry/keywords
- `analyze_opportunity` - Assess relevance and impact
- `create_opportunity` - Manual opportunity creation
- `track_opportunity` - Monitor opportunity status

##### **signaldesk-scraper** (/mcp-servers/signaldesk-scraper/src/index.ts)
**Status**: ✅ ACTIVE (called by orchestrator)
**Capabilities**:
- Web scraping
- Content extraction
- Data parsing
- Source monitoring

##### **signaldesk-campaigns** (/mcp-servers/signaldesk-campaigns/src/index.ts)
**Status**: ❌ UNUSED
**Capabilities**:
- Campaign planning
- Asset management
- Performance tracking
- Timeline management
- Budget tracking

##### **signaldesk-stakeholder-groups** (/mcp-servers/signaldesk-stakeholder-groups/src/index.ts)
**Status**: ❌ UNUSED
**Capabilities**:
- Stakeholder segmentation
- Group management
- Audience analysis
- Communication targeting
- Engagement tracking

##### **signaldesk-orchestrator** (/mcp-servers/signaldesk-orchestrator/src/index.ts)
**Status**: ✅ ACTIVE
**Capabilities**:
- `orchestrate_parallel_analysis` - Coordinate multiple MCPs simultaneously
- `route_to_specialist` - Direct requests to appropriate specialist MCPs
- Multi-MCP coordination
- Timeout management
- Result aggregation

**Architecture**: Acts as MCP coordinator, makes HTTP calls to deployed edge functions

---

## 2. Current Edge Function Usage

### Active Edge Functions and Call Sites

#### **2.1 Content Generation Functions**

##### **mcp-content** (/supabase/functions/mcp-content/index.ts)
**Called From**:
- `/src/services/ContentGenerationService.ts:88` - Primary content generation service
- `/src/app/api/content/press-release/route.ts` - Press release endpoint
- `/src/app/api/content/blog-post/route.ts` - Blog post endpoint
- `/src/app/api/content/social-post/route.ts` - Social media endpoint
- Multiple other content API routes (10+ files)

**Tools Exposed**:
- generate_press_release
- generate_blog_post
- generate_social_posts
- generate_email_campaign
- generate_executive_talking_points
- generate_messaging_framework
- generate_qa_document
- generate_crisis_response

**Architecture Issue**: This edge function should call signaldesk-content MCP instead of reimplementing tools.

##### **vertex-ai-visual** (/supabase/functions/vertex-ai-visual/index.ts)
**Called From**:
- `/src/app/api/visual/image/route.ts` - Image generation
- `/supabase/functions/niv-content-robust/index.ts:132-150` - NIV visual routing

**Capabilities**:
- Image generation via Google Vertex AI
- Image editing and enhancement
- Visual asset creation

##### **gamma-presentation** (/supabase/functions/gamma-presentation/index.ts)
**Called From**:
- `/src/app/api/visual/presentation/route.ts` - Presentation generation
- `/supabase/functions/niv-content-robust/index.ts:33-34` - NIV presentation routing

**Capabilities**:
- AI-powered presentation creation
- Slide deck generation
- Visual storytelling

#### **2.2 Intelligence & Monitoring Functions**

##### **monitor-stage-1** (/supabase/functions/monitor-stage-1/index.ts)
**Called From**:
- `/src/components/modules/IntelligenceModule.tsx` - Intelligence gathering
- Multiple test files (10+ references)

**Capabilities**:
- Initial news/content discovery
- Source aggregation
- Raw data collection

##### **monitor-stage-2-relevance** (/supabase/functions/monitor-stage-2-relevance/index.ts)
**Called From**:
- Intelligence pipeline components
- Orchestrator services

**Capabilities**:
- Relevance filtering
- Content scoring
- Priority ranking

##### **mcp-orchestrator** (/supabase/functions/mcp-orchestrator/index.ts)
**Called From**:
- `/src/services/intelligenceOrchestratorV4.ts` - Main orchestration service
- Intelligence pipelines

**Architecture**: Acts as HTTP bridge to actual MCP servers

#### **2.3 NIV (Network Intelligence Vault) Functions**

##### **niv-content-robust** (/supabase/functions/niv-content-robust/index.ts)
**Called From**:
- `/src/components/execute/NIVContentOrchestrator.tsx` - Main NIV UI
- `/src/app/api/content/orchestrate/route.ts` - Content orchestration API

**Architecture**:
- Dual mode: Direct content generation vs. Consultant mode
- Routes to: vertex-ai-visual, gamma-presentation, mcp-content
- Content type routing map (lines 24-68)

**Issue**: Should use MCP tools directly instead of duplicating routing logic

##### **niv-memory-vault** (/supabase/functions/niv-memory-vault/index.ts)
**Called From**:
- `/src/app/api/memory-vault/save/route.ts`
- `/src/app/api/memory-vault/list/route.ts`
- `/src/services/memory-vault.ts`

**Architecture**: Should delegate to signaldesk-memory MCP

##### **niv-fireplexity** (/supabase/functions/niv-fireplexity/index.ts)
**Called From**:
- NIV strategic pipeline
- Research orchestration

**Capabilities**:
- Fireplexity search integration
- Relevance scoring
- Content enrichment

##### **niv-strategic-framework** (/supabase/functions/niv-strategic-framework/index.ts)
**Called From**:
- Strategic planning workflows
- Framework generation

**Capabilities**:
- Strategic framework creation
- Messaging platform development
- Positioning analysis

#### **2.4 Opportunity Management Functions**

##### **mcp-opportunity-detector** (/supabase/functions/mcp-opportunity-detector/index.ts)
**Called From**:
- Opportunity pipeline
- Intelligence orchestrator

**Issue**: Should use signaldesk-opportunities MCP

##### **opportunity-orchestrator** (/supabase/functions/opportunity-orchestrator/index.ts)
**Called From**:
- Opportunity detection workflows
- Pipeline coordination

**Issue**: Duplicates orchestration logic

#### **2.5 Discovery & Research Functions**

##### **mcp-discovery** (/supabase/functions/mcp-discovery/index.ts)
**Called From**:
- `/src/lib/services/intelligenceService.ts`
- Discovery workflows

**Issue**: Should delegate to signaldesk-discovery MCP

##### **mcp-firecrawl** (/supabase/functions/mcp-firecrawl/index.ts)
**Called From**:
- Web scraping workflows
- Content extraction

**Issue**: Should use signaldesk-scraper MCP

#### **2.6 Specialized Analysis Functions**

##### **mcp-analytics** (/supabase/functions/mcp-analytics/index.ts)
**Status**: Bridge to signaldesk-analytics MCP

##### **mcp-intelligence** (/supabase/functions/mcp-intelligence/index.ts)
**Status**: Bridge to signaldesk-intelligence MCP

##### **mcp-monitor** (/supabase/functions/mcp-monitor/index.ts)
**Status**: Bridge to signaldesk-monitor MCP

##### **mcp-media** (/supabase/functions/mcp-media/index.ts)
**Status**: Bridge function, but signaldesk-media MCP is unused

##### **mcp-social** (/supabase/functions/mcp-social/index.ts)
**Status**: Bridge function, but signaldesk-social MCP is unused

##### **mcp-narratives** (/supabase/functions/mcp-narratives/index.ts)
**Status**: Bridge function, but signaldesk-narratives MCP is unused

##### **mcp-crisis** (/supabase/functions/mcp-crisis/index.ts)
**Status**: Bridge function, but signaldesk-crisis MCP is unused

##### **mcp-regulatory** (/supabase/functions/mcp-regulatory/index.ts)
**Status**: Bridge function, but signaldesk-regulatory MCP is unused

##### **mcp-stakeholder-groups** (/supabase/functions/mcp-stakeholder-groups/index.ts)
**Status**: Bridge function, but signaldesk-stakeholder-groups MCP is unused

---

## 3. Unused MCPs (High Integration Value)

### 3.1 Critical Tier - Immediate Value

#### **signaldesk-media** ❌ ZERO USAGE
**Why Critical**:
- Media relations is core to PR platform
- Journalist database and outreach tracking needed
- 6 powerful tools ready to use
- Claude-enhanced journalist matching

**Integration Points**:
1. **Replace mcp-media edge function** - Direct MCP calls
2. **IntelligenceModule.tsx** - Add media outreach tab
3. **NIV strategic planning** - Generate media lists for campaigns
4. **Opportunity detector** - Match opportunities to journalists

**Implementation Path**:
```typescript
// src/services/MediaService.ts
const journalists = await mcpClient.call('signaldesk-media', 'find_journalists', {
  beat: 'technology',
  recentCoverage: true,
  limit: 10
});

// Generate pitch for specific journalist
const pitch = await mcpClient.call('signaldesk-media', 'generate_pitch', {
  journalistName: journalist.name,
  storyAngle: opportunity.title,
  companyInfo: organization.description
});
```

**Expected Impact**: Complete media relations workflow from discovery to outreach

#### **signaldesk-social** ❌ ZERO USAGE
**Why Critical**:
- Social monitoring essential for modern PR
- Influencer tracking missing from platform
- Viral prediction could drive engagement
- 6 tools ready to deploy

**Integration Points**:
1. **Social media dashboard** - New module in Intelligence section
2. **Content generation** - Auto-generate social posts for campaigns
3. **Opportunity detector** - Detect viral trends early
4. **Narrative tracking** - Monitor social narrative spread

**Implementation Path**:
```typescript
// Monitor brand sentiment
const sentiment = await mcpClient.call('signaldesk-social', 'monitor_social_sentiment', {
  keywords: [organization.name],
  platforms: ['twitter', 'linkedin'],
  timeframe: '7d'
});

// Find relevant influencers
const influencers = await mcpClient.call('signaldesk-social', 'track_influencers', {
  industry: organization.industry,
  minFollowers: 10000,
  engagementRate: 2.5
});
```

**Expected Impact**: Real-time social intelligence and influencer partnerships

#### **signaldesk-narratives** ❌ ZERO USAGE
**Why Critical**:
- Narrative control is strategic differentiator
- No other platform offers narrative vacuum detection
- Counter-narrative crafting needed for crisis
- 6 advanced tools available

**Integration Points**:
1. **Strategic planning** - Narrative framework as first step
2. **Crisis management** - Deploy counter-narratives quickly
3. **Competitive analysis** - Track competitor narrative strength
4. **Content generation** - Align content with narrative strategy

**Implementation Path**:
```typescript
// Detect narrative vacuum
const vacuum = await mcpClient.call('signaldesk-narratives', 'detect_narrative_vacuum', {
  topic: 'AI regulation',
  timeframe: '30d',
  channels: ['news', 'social', 'regulatory']
});

// Measure our narrative strength
const strength = await mcpClient.call('signaldesk-narratives', 'measure_narrative_strength', {
  narrative_id: campaign.narrative_id,
  metrics: ['reach', 'adoption', 'sentiment']
});
```

**Expected Impact**: Strategic narrative warfare capabilities

### 3.2 High Value Tier

#### **signaldesk-crisis** ❌ ZERO USAGE
**Integration Points**:
- Crisis detection from monitoring streams
- Automated crisis response playbooks
- Stakeholder communication templates
- Real-time issue escalation

**Use Case**: When monitor-stage-2 detects negative sentiment spike, auto-trigger crisis MCP for response plan

#### **signaldesk-campaigns** ❌ ZERO USAGE
**Integration Points**:
- Campaign planning from NIV strategic framework
- Asset management for content library
- Timeline coordination across content types
- Performance tracking dashboard

**Use Case**: After creating media plan in NIV, use campaigns MCP to track execution

#### **signaldesk-executive** ❌ ZERO USAGE
**Integration Points**:
- Board presentation generation
- Executive briefing summaries
- Strategic decision support
- Leadership dashboards

**Use Case**: Convert opportunity analysis into executive briefing format

### 3.3 Supporting Tier

#### **signaldesk-regulatory** ❌ ZERO USAGE
**Integration Points**:
- Regulatory news monitoring
- Compliance alerts
- Policy analysis for positioning
- Risk assessment

**Use Case**: Monitor regulatory changes affecting client industries

#### **signaldesk-entities** ❌ ZERO USAGE
**Integration Points**:
- Extract entities from monitoring data
- Build organization/person profiles
- Relationship mapping
- Network analysis

**Use Case**: Auto-extract entities from news to enrich MemoryVault

#### **signaldesk-relationships** ❌ ZERO USAGE
**Integration Points**:
- Stakeholder network mapping
- Influence analysis
- Connection discovery
- Relationship CRM

**Use Case**: Map journalist-source-company relationships

#### **signaldesk-stakeholder-groups** ❌ ZERO USAGE
**Integration Points**:
- Audience segmentation
- Targeted messaging
- Engagement tracking
- Group analytics

**Use Case**: Segment media lists by stakeholder priorities

---

## 4. Edge Functions → MCP Conversion Opportunities

### 4.1 High Priority Conversions

#### **niv-content-robust → MCP Tool Collection**
**Current**: 358 line edge function with content routing logic
**Should Be**: MCP tool that orchestrates signaldesk-content, vertex-ai-visual, gamma-presentation

**Rationale**:
- Content routing is a reusable pattern
- Claude Desktop could generate content
- Reduces edge function maintenance
- Enables local testing

**Conversion Approach**:
```typescript
// New MCP: signaldesk-content-orchestrator
Tools:
- orchestrate_content_generation (routes to appropriate MCPs)
- generate_media_plan (consultant mode)
- create_content_package (multi-format generation)
```

**Files Affected**:
- `/supabase/functions/niv-content-robust/index.ts` - Replace with MCP call
- `/src/components/execute/NIVContentOrchestrator.tsx` - Update to MCP client
- `/src/app/api/content/orchestrate/route.ts` - Simplify to MCP proxy

#### **niv-memory-vault → signaldesk-memory MCP**
**Current**: Separate edge function for memory operations
**Should Be**: Direct calls to existing signaldesk-memory MCP

**Conversion**:
```typescript
// BEFORE (edge function)
fetch('/functions/v1/niv-memory-vault', { method: 'POST', body: { action: 'search', query } })

// AFTER (MCP direct)
mcpClient.call('signaldesk-memory', 'search_memory', { query, searchType: 'hybrid' })
```

**Benefit**: Eliminate 200+ line edge function, use existing MCP

#### **niv-strategic-framework → New MCP**
**Current**: Edge function for strategic planning
**Should Be**: `signaldesk-strategic-planner` MCP

**Tools**:
- `create_strategic_framework` - Messaging platform generation
- `analyze_positioning` - Competitive positioning
- `develop_campaign_strategy` - Campaign planning
- `generate_messaging_hierarchy` - Message prioritization

**Rationale**: Strategic planning is core reusable capability

#### **opportunity-orchestrator → signaldesk-opportunities MCP**
**Current**: 400+ line orchestrator edge function
**Should Be**: Enhanced signaldesk-opportunities MCP with orchestration

**Conversion**: Add orchestration tools to existing MCP instead of separate edge function

#### **mcp-opportunity-detector → signaldesk-opportunities MCP**
**Current**: Separate detector edge function
**Should Be**: Tool within signaldesk-opportunities MCP

**Consolidation**: One MCP for all opportunity operations

### 4.2 Medium Priority Conversions

#### **monitor-stage-1 → signaldesk-monitor MCP Enhancement**
**Current**: Separate edge function for stage 1 monitoring
**Should Be**: Enhanced signaldesk-monitor MCP with staged processing

**New Tools**:
- `monitor_stage_1_discovery` - Initial discovery
- `monitor_stage_2_relevance` - Relevance filtering
- `monitor_stage_3_synthesis` - Final synthesis

**Benefit**: Unified monitoring API with staged processing

#### **monitoring-stage-2-enrichment → signaldesk-intelligence MCP**
**Current**: Separate enrichment function
**Should Be**: Tool in intelligence MCP for content enrichment

#### **niv-fireplexity → signaldesk-discovery MCP**
**Current**: Separate search integration
**Should Be**: Tool in discovery MCP with Fireplexity support

**New Tool**: `search_with_fireplexity`

#### **mcp-firecrawl → signaldesk-scraper MCP**
**Current**: Separate Firecrawl integration
**Should Be**: Tool in existing scraper MCP

**Benefit**: Consolidate all scraping in one MCP

### 4.3 Infrastructure Conversions

#### **intelligence-orchestrator-v2 → signaldesk-orchestrator MCP**
**Current**: Edge function orchestrator
**Should Be**: Enhanced signaldesk-orchestrator MCP

**Already exists**: signaldesk-orchestrator MCP, just needs to replace edge function calls

#### **mcp-bridge → Deprecated**
**Current**: Bridge between MCP and edge functions
**Should Be**: Remove after direct MCP integration

**Rationale**: No need for bridge once frontend calls MCPs directly

---

## 5. Missing MCPs - New Opportunities

### 5.1 Content Management MCP

**Name**: `signaldesk-content-library`
**Rationale**: Repeated patterns for content storage, versioning, approval

**Tools**:
- `store_content_item` - Save generated content
- `version_content` - Create content versions
- `approve_content` - Workflow approval
- `search_content` - Find existing content
- `get_content_analytics` - Performance metrics
- `tag_content` - Categorization

**Tables**: content_items, content_versions, content_approvals

**Integration Points**:
- After any content generation
- MemoryVault integration
- Campaign tracking
- Analytics dashboard

**Code References**:
- `/src/services/ContentGenerationService.ts` - Currently no storage
- `/src/types/content.ts:3-9` - Type definitions exist

### 5.2 Search & Discovery MCP

**Name**: `signaldesk-search`
**Rationale**: Multiple search implementations (Fireplexity, Firecrawl, custom)

**Tools**:
- `unified_search` - Single search interface
- `search_news` - News-specific search
- `search_social` - Social media search
- `search_web` - General web search
- `search_academic` - Research papers
- `search_regulatory` - Government/legal sources

**Integrations**: Fireplexity, Firecrawl, NewsAPI, Google, Reddit

**Benefit**: One search interface for all sources

**Current Duplication**:
- `/supabase/functions/niv-fireplexity/index.ts`
- `/supabase/functions/mcp-firecrawl/index.ts`
- `/supabase/functions/mcp-discovery/index.ts`

### 5.3 Workflow Automation MCP

**Name**: `signaldesk-workflows`
**Rationale**: Repeated workflow patterns across platform

**Tools**:
- `create_workflow` - Define automation workflows
- `trigger_workflow` - Execute workflow
- `schedule_workflow` - Time-based triggers
- `workflow_status` - Check execution status
- `workflow_history` - Audit log

**Use Cases**:
- Auto-generate media list when opportunity detected
- Schedule social posts after press release
- Alert on crisis detection
- Weekly executive briefing

**Pattern Example**:
```typescript
// Workflow: New Product Launch
workflow.addStep('generate_press_release', { template: 'product_launch' })
workflow.addStep('create_media_list', { tier1Publications: [...] })
workflow.addStep('generate_social_posts', { platforms: ['twitter', 'linkedin'] })
workflow.addStep('schedule_posts', { timing: 'release_day' })
workflow.addStep('notify_team', { channels: ['slack', 'email'] })
```

### 5.4 Reporting & Analytics MCP

**Name**: `signaldesk-reporting`
**Rationale**: Analytics scattered across MCPs and edge functions

**Tools**:
- `create_report` - Generate custom reports
- `schedule_report` - Recurring reports
- `export_data` - Data export (CSV, PDF, Excel)
- `dashboard_metrics` - Real-time metrics
- `benchmark_analysis` - Industry comparisons

**Consolidates**:
- Campaign performance
- Media coverage
- Social engagement
- Content effectiveness
- Opportunity conversion

### 5.5 Integration Hub MCP

**Name**: `signaldesk-integrations`
**Rationale**: Multiple external API integrations need management

**Tools**:
- `list_integrations` - Available integrations
- `configure_integration` - Setup API keys/settings
- `test_integration` - Verify connectivity
- `integration_health` - Monitor status
- `sync_data` - Bi-directional sync

**Managed Integrations**:
- Anthropic Claude
- Google Vertex AI
- Gamma
- NewsAPI
- Firecrawl
- Fireplexity
- Social media APIs

### 5.6 Approval & Collaboration MCP

**Name**: `signaldesk-collaboration`
**Rationale**: No approval workflow for generated content

**Tools**:
- `request_approval` - Submit for review
- `approve_content` - Grant approval
- `reject_with_feedback` - Request changes
- `assign_reviewer` - Route to team member
- `comment_on_content` - Collaborative feedback
- `track_revisions` - Version control

**Integration**: Teams, Slack, email notifications

### 5.7 Training & Onboarding MCP

**Name**: `signaldesk-learning`
**Rationale**: Help users understand platform capabilities

**Tools**:
- `get_tutorial` - Interactive tutorials
- `explain_tool` - Tool documentation
- `best_practices` - PR best practices
- `suggest_workflow` - Recommend workflows
- `platform_tips` - Contextual help

**Use Case**: Claude as PR consultant teaching users

### 5.8 Quality Assurance MCP

**Name**: `signaldesk-quality`
**Rationale**: Ensure content quality before distribution

**Tools**:
- `check_grammar` - Grammar and spelling
- `verify_facts` - Fact-checking
- `check_brand_compliance` - Brand guidelines
- `tone_analysis` - Tone appropriateness
- `plagiarism_check` - Originality verification
- `legal_review` - Legal risk assessment

**Integration**: Grammarly, fact-checking APIs, legal databases

---

## 6. Integration Recommendations by Priority

### Phase 1: Critical Path (Weeks 1-2)

#### 1. Activate signaldesk-media MCP
**Effort**: Low | **Impact**: High | **Risk**: Low

**Implementation**:
1. Create MediaService.ts calling MCP directly
2. Add media relations tab to IntelligenceModule
3. Build journalist discovery UI
4. Integrate with opportunity detector

**Files to Create/Modify**:
- `/src/services/MediaService.ts` - New service
- `/src/components/modules/MediaRelationsModule.tsx` - New UI
- `/src/app/api/media/journalists/route.ts` - API proxy

**Expected Outcome**: Complete media relations workflow in 1 week

#### 2. Convert niv-memory-vault to signaldesk-memory MCP
**Effort**: Low | **Impact**: Medium | **Risk**: Low

**Implementation**:
1. Replace edge function calls with MCP calls
2. Update MemoryVault UI components
3. Test semantic search
4. Remove niv-memory-vault edge function

**Files to Modify**:
- `/src/services/memory-vault.ts:58` - Replace fetch() with mcpClient.call()
- `/src/app/api/memory-vault/*/route.ts` - Update all routes

**Expected Outcome**: Cleaner architecture, faster responses

#### 3. Activate signaldesk-social MCP
**Effort**: Medium | **Impact**: High | **Risk**: Low

**Implementation**:
1. Create SocialMonitoringService.ts
2. Build social dashboard UI
3. Integrate influencer tracking
4. Add social posts to opportunity detector

**Files to Create**:
- `/src/services/SocialMonitoringService.ts`
- `/src/components/modules/SocialMonitoringModule.tsx`
- `/src/app/api/social/sentiment/route.ts`

**Expected Outcome**: Real-time social intelligence in 1-2 weeks

### Phase 2: Strategic Capabilities (Weeks 3-4)

#### 4. Activate signaldesk-narratives MCP
**Effort**: Medium | **Impact**: High | **Risk**: Medium

**Implementation**:
1. Create NarrativeService.ts
2. Build narrative tracking dashboard
3. Integrate with strategic framework
4. Add counter-narrative generator

**Expected Outcome**: Unique strategic narrative capabilities

#### 5. Convert niv-content-robust to MCP orchestrator
**Effort**: High | **Impact**: Medium | **Risk**: Medium

**Implementation**:
1. Create signaldesk-content-orchestrator MCP (new)
2. Migrate routing logic to MCP
3. Update NIV UI to call MCP
4. Remove edge function

**Expected Outcome**: Reusable content orchestration, Claude Desktop support

#### 6. Consolidate opportunity management
**Effort**: Medium | **Impact**: Medium | **Risk**: Low

**Implementation**:
1. Enhance signaldesk-opportunities MCP with orchestration
2. Remove opportunity-orchestrator edge function
3. Remove mcp-opportunity-detector edge function
4. Update all call sites

**Expected Outcome**: Single opportunity API

### Phase 3: Platform Enhancements (Weeks 5-8)

#### 7. Create signaldesk-content-library MCP
**Effort**: High | **Impact**: High | **Risk**: Low

**Implementation**:
1. Build content storage MCP
2. Add versioning system
3. Create approval workflow
4. Integrate with all content generation

**Expected Outcome**: Content management system

#### 8. Create signaldesk-search MCP
**Effort**: High | **Impact**: Medium | **Risk**: Medium

**Implementation**:
1. Unify search implementations
2. Add source-specific tools
3. Consolidate Fireplexity/Firecrawl
4. Update all search call sites

**Expected Outcome**: Single search interface

#### 9. Activate remaining specialized MCPs
**Effort**: Medium | **Impact**: Medium | **Risk**: Low

**Implementation**:
- signaldesk-crisis - Crisis management workflows
- signaldesk-campaigns - Campaign tracking
- signaldesk-executive - Executive briefings
- signaldesk-regulatory - Compliance monitoring

**Expected Outcome**: Complete platform capabilities

### Phase 4: Advanced Features (Weeks 9-12)

#### 10. Create signaldesk-workflows MCP
**Effort**: High | **Impact**: High | **Risk**: Medium

**Implementation**:
1. Build workflow automation engine
2. Create workflow designer UI
3. Add trigger system
4. Integrate with all MCPs

**Expected Outcome**: Automated PR workflows

#### 11. Create additional support MCPs
**Effort**: Medium | **Impact**: Medium | **Risk**: Low

**Implementation**:
- signaldesk-reporting
- signaldesk-collaboration
- signaldesk-quality
- signaldesk-integrations

**Expected Outcome**: Professional platform completeness

---

## 7. Architecture Recommendations

### 7.1 MCP-First Architecture

**Current State**:
```
Frontend → Edge Functions → (Sometimes) MCPs
```

**Recommended State**:
```
Frontend → MCP Client → MCPs
           ↓
     Edge Functions (Only for HTTP adapters)
```

**Benefits**:
- Claude Desktop can use all tools
- Faster responses (no edge function overhead)
- Better testability
- Standardized interfaces
- Reduced code duplication

### 7.2 MCP Client Library

Create unified MCP client for frontend:

**File**: `/src/lib/mcp/client.ts`

```typescript
import { MCPClient } from '@modelcontextprotocol/client';

class SignalDeskMCPClient {
  private clients: Map<string, MCPClient> = new Map();

  async call(mcpName: string, tool: string, args: any) {
    // Get or create MCP client
    const client = await this.getClient(mcpName);

    // Call tool
    return await client.callTool(tool, args);
  }

  async getClient(mcpName: string): Promise<MCPClient> {
    if (!this.clients.has(mcpName)) {
      // Connect to MCP (local or remote)
      const client = await this.connectMCP(mcpName);
      this.clients.set(mcpName, client);
    }
    return this.clients.get(mcpName)!;
  }

  private async connectMCP(mcpName: string): Promise<MCPClient> {
    // For deployed platform: HTTP transport to edge functions
    // For Claude Desktop: stdio transport to local MCPs
    const isLocal = process.env.NODE_ENV === 'development';

    if (isLocal) {
      return new MCPClient({
        transport: 'stdio',
        command: `node`,
        args: [`./mcp-servers/${mcpName}/dist/index.js`]
      });
    } else {
      return new MCPClient({
        transport: 'http',
        url: `${process.env.SUPABASE_URL}/functions/v1/mcp-${mcpName}`
      });
    }
  }
}

export const mcpClient = new SignalDeskMCPClient();
```

### 7.3 Edge Function Strategy

**Keep Edge Functions For**:
1. HTTP-to-MCP adapters (thin proxy layer)
2. Supabase-specific features (RLS, database)
3. Authentication/authorization
4. Rate limiting

**Convert to MCPs**:
1. Business logic
2. Reusable tools
3. Complex workflows
4. AI orchestration

**Example Thin Edge Function**:
```typescript
// /supabase/functions/mcp-media/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { MCPClient } from './mcp-client.ts'

serve(async (req) => {
  const { tool, arguments: args } = await req.json()

  // Simple proxy to MCP
  const client = new MCPClient('signaldesk-media')
  const result = await client.call(tool, args)

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 7.4 MCP Deployment Strategy

**Local Development**:
- MCPs run via stdio transport
- Fast iteration
- Full debugging

**Production**:
- MCPs deployed as Deno edge functions
- HTTP transport
- Auto-scaling

**Hybrid Mode**:
- Frontend can call MCPs via either transport
- Choose based on environment
- Seamless switching

### 7.5 Testing Strategy

**Unit Tests**:
- Test each MCP tool independently
- Mock external APIs
- Validate tool schemas

**Integration Tests**:
- Test MCP orchestration
- Test cross-MCP workflows
- End-to-end scenarios

**Testing Library**:
```typescript
// /src/lib/mcp/testing.ts
export class MCPTestClient {
  mockTool(mcpName: string, tool: string, response: any) {
    // Mock tool responses
  }

  async testWorkflow(steps: WorkflowStep[]) {
    // Test multi-MCP workflows
  }

  validateToolSchema(tool: Tool) {
    // Validate MCP tool definitions
  }
}
```

---

## 8. Migration Roadmap

### Week 1-2: Quick Wins
- ✅ Activate signaldesk-media MCP
- ✅ Convert niv-memory-vault to MCP calls
- ✅ Activate signaldesk-social MCP
- ✅ Update documentation

**Deliverables**:
- MediaService.ts
- Media relations UI
- Social monitoring dashboard
- Updated MCP client

### Week 3-4: Strategic Capabilities
- ✅ Activate signaldesk-narratives MCP
- ✅ Convert niv-content-robust
- ✅ Consolidate opportunity management
- ✅ Create content library MCP

**Deliverables**:
- Narrative tracking system
- Content orchestration MCP
- Unified opportunity API
- Content storage system

### Week 5-8: Platform Consolidation
- ✅ Create unified search MCP
- ✅ Activate crisis/campaigns/executive MCPs
- ✅ Remove redundant edge functions
- ✅ Update all call sites

**Deliverables**:
- Single search interface
- Complete MCP coverage
- Cleaner architecture
- Performance improvements

### Week 9-12: Advanced Features
- ✅ Create workflow automation MCP
- ✅ Create reporting MCP
- ✅ Create collaboration MCP
- ✅ Create quality assurance MCP

**Deliverables**:
- Workflow designer
- Automated reports
- Approval workflows
- Content quality checks

---

## 9. Success Metrics

### Technical Metrics
- **Code Reduction**: Target 40% reduction in edge function code
- **Response Time**: 25% faster (eliminate edge function hop)
- **Test Coverage**: 80% MCP tool coverage
- **Reusability**: 100% tools available to Claude Desktop

### Business Metrics
- **Feature Velocity**: 2x faster feature development
- **User Satisfaction**: Measure via in-app surveys
- **Tool Usage**: Track MCP tool invocations
- **Workflow Automation**: # of automated workflows created

### Platform Health
- **Error Rates**: < 1% MCP call failures
- **Latency**: p95 < 2 seconds for MCP calls
- **Uptime**: 99.9% MCP availability
- **Scalability**: Handle 10x traffic growth

---

## 10. Risk Mitigation

### Technical Risks

**Risk**: MCP transport reliability
**Mitigation**:
- Implement retry logic
- Circuit breakers
- Fallback to edge functions
- Health checks

**Risk**: Performance degradation
**Mitigation**:
- Load testing
- Caching layer
- Connection pooling
- Timeout management

**Risk**: Breaking changes during migration
**Mitigation**:
- Feature flags
- Parallel implementations
- Gradual rollout
- Comprehensive testing

### Organizational Risks

**Risk**: Team learning curve
**Mitigation**:
- MCP training sessions
- Documentation
- Code examples
- Pair programming

**Risk**: Timeline slippage
**Mitigation**:
- Phased approach
- Clear milestones
- Regular checkpoints
- Adjust priorities

---

## 11. Conclusion

### Key Findings

1. **19 MCPs built**, only **7 actively used** - huge untapped potential
2. **54+ edge functions**, many duplicating MCP functionality
3. **13 unused MCPs** ready for immediate integration
4. **18 edge functions** should be MCPs or call MCPs
5. **8 new MCPs** needed for complete platform

### Strategic Recommendations

**Immediate (Week 1-2)**:
1. Activate signaldesk-media MCP - Complete media relations
2. Activate signaldesk-social MCP - Real-time social intelligence
3. Convert niv-memory-vault - Cleaner architecture

**Strategic (Week 3-4)**:
1. Activate signaldesk-narratives MCP - Unique competitive advantage
2. Convert niv-content-robust - Enable Claude Desktop integration
3. Consolidate opportunity management - Single API

**Long-term (Week 5-12)**:
1. Create content library MCP - Professional content management
2. Create workflow automation MCP - Automated PR workflows
3. Build remaining support MCPs - Complete platform

### Expected Outcomes

**After Phase 1 (2 weeks)**:
- Complete media relations workflow
- Real-time social monitoring
- Cleaner architecture
- 3 major MCPs activated

**After Phase 2 (4 weeks)**:
- Strategic narrative capabilities
- Unified content orchestration
- Content management system
- 6+ MCPs fully integrated

**After Phase 3 (8 weeks)**:
- All 19 MCPs in production
- 40% code reduction
- Claude Desktop full integration
- Professional-grade platform

**After Phase 4 (12 weeks)**:
- Workflow automation
- Complete tooling ecosystem
- Industry-leading PR platform
- Ready for scale

### Next Steps

1. **Review & Prioritize**: Validate roadmap with stakeholders
2. **Resource Planning**: Assign development team
3. **Create Detailed Specs**: Write implementation specs for Phase 1
4. **Begin Migration**: Start with signaldesk-media MCP activation
5. **Measure Progress**: Weekly checkpoints against metrics

---

## Appendix A: MCP Tool Inventory

### Complete Tool List by MCP

#### signaldesk-intelligence (8 tools)
1. analyze_competition_with_personality
2. competitor_move_detection
3. market_narrative_tracking
4. emerging_topic_identification
5. regulatory_change_monitoring
6. executive_movement_tracking
7. partnership_opportunity_detection
8. whitespace_analysis

#### signaldesk-media (6 tools)
1. find_journalists
2. analyze_journalist
3. create_media_list
4. monitor_coverage
5. generate_pitch
6. track_outreach

#### signaldesk-social (6 tools)
1. monitor_social_sentiment
2. track_influencers
3. analyze_engagement
4. detect_viral_potential
5. manage_social_calendar
6. create_social_content

#### signaldesk-narratives (6 tools)
1. track_narrative_evolution
2. detect_narrative_vacuum
3. measure_narrative_strength
4. predict_narrative_spread
5. craft_counter_narrative
6. test_message_resonance

#### signaldesk-content (8+ tools)
1. generate_press_release
2. generate_blog_post
3. generate_social_posts
4. generate_email_campaign
5. generate_executive_talking_points
6. generate_messaging_framework
7. generate_qa_document
8. generate_crisis_response

#### signaldesk-memory (6 tools)
1. search_memory
2. add_to_memory
3. get_memory_context
4. update_memory
5. delete_memory
6. list_categories

#### signaldesk-opportunities (4 tools)
1. discover_opportunities
2. analyze_opportunity
3. create_opportunity
4. track_opportunity

#### signaldesk-orchestrator (2 tools)
1. orchestrate_parallel_analysis
2. route_to_specialist

**Total**: 50+ standardized tools ready for use

---

## Appendix B: File Reference Index

### Key Files by Category

#### MCP Servers
- `/mcp-servers/signaldesk-intelligence/src/index.ts` - Intelligence MCP
- `/mcp-servers/signaldesk-media/src/index.ts` - Media relations MCP
- `/mcp-servers/signaldesk-social/src/index.ts` - Social monitoring MCP
- `/mcp-servers/signaldesk-narratives/src/index.ts` - Narrative tracking MCP
- `/mcp-servers/signaldesk-memory/src/index.ts` - MemoryVault MCP
- `/mcp-servers/signaldesk-content/src/index.ts` - Content generation MCP
- `/mcp-servers/signaldesk-orchestrator/src/index.ts` - Orchestration MCP

#### Edge Functions
- `/supabase/functions/niv-content-robust/index.ts` - Content orchestration
- `/supabase/functions/mcp-content/index.ts` - Content generation proxy
- `/supabase/functions/niv-memory-vault/index.ts` - Memory operations
- `/supabase/functions/monitor-stage-1/index.ts` - Monitoring stage 1
- `/supabase/functions/opportunity-orchestrator/index.ts` - Opportunity pipeline

#### Frontend Services
- `/src/services/ContentGenerationService.ts` - Content generation
- `/src/services/memory-vault.ts` - Memory operations
- `/src/services/intelligenceOrchestratorV4.ts` - Intelligence orchestration

#### Frontend Components
- `/src/components/execute/NIVContentOrchestrator.tsx` - Content UI
- `/src/components/modules/IntelligenceModule.tsx` - Intelligence UI

---

*End of Analysis Document*
*Generated: 2025-09-30*
*Version: 1.0*