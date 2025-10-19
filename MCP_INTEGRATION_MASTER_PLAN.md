# SignalDesk V3: MCP Integration Master Plan
*Complete roadmap for integrating all unused MCPs into the platform*

**Created:** January 2025
**Status:** Planning Phase
**Goal:** Activate all 24 MCPs and make SignalDesk the most comprehensive PR platform

---

## Current State Assessment

### ✅ ACTIVE - Currently Integrated (7 MCPs)
1. **mcp-discovery** - Company profiling (Intelligence Module)
2. **mcp-executive-synthesis** - 5-analyst synthesis (Intelligence Module)
3. **mcp-opportunity-detector** - Opportunity detection (Opportunities Module)
4. **mcp-social-intelligence** - Social monitoring (Intelligence Module + Pipeline)
5. **master-source-registry** - RSS feed management (Monitor Stage 1)
6. **mcp-firecrawl** - Web scraping (Monitor Stage 2)
7. **niv-orchestrator-robust** - Content generation (MemoryVault + ContentGenerator)

### 🔴 INACTIVE - Not Integrated Yet (17 MCPs)
**High-Value MCPs (Immediate ROI):**
1. **mcp-crisis** - 7 crisis management tools
2. **mcp-stakeholder-groups** - 7 stakeholder engagement tools
3. **mcp-media** - 6 journalist discovery tools
4. **mcp-campaigns** - 6 campaign management tools
5. **mcp-content** - 7 content generation tools

**Strategic MCPs (Medium-term Value):**
6. **mcp-memory** - 6 pattern learning tools
7. **mcp-analytics** - Performance metrics
8. **mcp-narratives** - 7 narrative tracking tools
9. **mcp-regulatory** - 7 compliance tools
10. **mcp-relationships** - 7 network analysis tools

**Infrastructure MCPs (Supporting):**
11. **mcp-entities** - 7 entity extraction tools
12. **mcp-monitor** - Real-time monitoring
13. **mcp-intelligence** - Intelligence synthesis
14. **mcp-opportunities** - Additional opportunity tools
15. **mcp-orchestrator** - Multi-MCP coordination
16. **mcp-bridge** - System integration
17. **mcp-scraper** - Web scraping

---

## Phase 1: Crisis Management Module (Week 1-2)
**Goal:** Port the Crisis Command Center from old SignalDesk to V3

### 1.1 Crisis Command Center UI Module
**File:** `src/components/modules/CrisisCommandCenter.tsx`

**Features to Port:**
- ✅ Crisis status dashboard (monitoring/active)
- ✅ Real-time crisis timer
- ✅ Crisis severity meter (low/medium/high/critical)
- ✅ AI Crisis Assistant chat
- ✅ Crisis documentation timeline
- ✅ Team status & task management
- ✅ Communication drafts panel
- ✅ Quick stats dashboard

**Components to Create:**
```typescript
CrisisCommandCenter.tsx        // Main module (4000+ lines reference)
CrisisPlanGenerator.tsx         // Plan creation wizard
CrisisAIAssistant.tsx          // Chat interface with plan context
CrisisSeverityMeter.tsx        // Visual severity indicator
CrisisTimeline.tsx             // Event documentation
CrisisStakeholderComms.tsx     // Communication drafts
CrisisTeamManager.tsx          // Team & tasks
```

### 1.2 Crisis Plan Generator
**Integration:** `mcp-crisis` + Claude

**Plan Generation Flow:**
1. User fills form: industry, company size, team, key concerns
2. Call `mcp-crisis` tool: `generate_crisis_plan`
3. AI generates comprehensive plan with:
   - Crisis scenarios (data breach, product recall, executive scandal, etc.)
   - Response protocols for each scenario
   - Team roles & responsibilities
   - Communication templates
   - Decision trees
   - Emergency contacts
4. Save to MemoryVault (`content_library` table)
5. Tag as `crisis-plan` for AI Assistant to reference

### 1.3 Crisis Detection Integration
**Integration:** Social Intelligence + Sentiment Analysis

**Auto-Crisis Detection:**
- Use existing `sentiment_spike` pattern from `mcp-opportunity-detector`
- When negative sentiment > 40% + 5+ mentions in 3 hours:
  - Trigger crisis alert in UI
  - Auto-activate Crisis Command Center
  - Load relevant crisis plan from MemoryVault
  - Notify team members

**Crisis Severity Auto-Detection:**
```typescript
calculateSeverity(signals) {
  const keywords = {
    critical: ['viral', 'lawsuit', 'death', 'breach', 'hacked'],
    high: ['angry', 'protest', 'boycott', 'outrage'],
    medium: ['concerned', 'complaints', 'worried']
  }
  // Return: critical/high/medium/low
}
```

### 1.4 AI Crisis Assistant
**Integration:** Claude + Crisis Plans from MemoryVault

**System Prompt:**
```
You are a crisis management expert with 20+ years of experience.
You have access to this organization's crisis plan.

Crisis Plan Context:
{loaded_crisis_plan}

Current Crisis:
- Type: {crisis_type}
- Severity: {severity}
- Time Elapsed: {elapsed_time}
- Social Signals: {recent_signals}

Provide SPECIFIC, ACTIONABLE guidance based on the crisis plan.
Ask ONE question at a time. Reference the plan sections.
```

**Features:**
- Loads crisis plan from MemoryVault
- References specific plan sections in responses
- Tracks decisions made during crisis
- Suggests next actions based on plan
- Quick action buttons (from AIAdvisorHelp.js)

### 1.5 Database Schema
```sql
-- Crisis Plans (use existing content_library)
-- Just tag with type='crisis-plan'

-- Crisis Events (new table)
CREATE TABLE crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  crisis_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL, -- monitoring/active/resolved
  started_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  timeline JSONB[], -- Array of timeline events
  decisions JSONB[], -- Array of decisions made
  communications JSONB[], -- Array of comms sent
  team_status JSONB, -- Team member assignments
  tasks JSONB[], -- Task list
  ai_interactions JSONB[], -- Chat history
  social_signals JSONB[], -- Triggering social signals
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crisis Communications (new table)
CREATE TABLE crisis_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crisis_event_id UUID REFERENCES crisis_events(id),
  organization_id TEXT NOT NULL,
  stakeholder_type TEXT NOT NULL, -- employees/media/investors/customers
  content TEXT NOT NULL,
  status TEXT NOT NULL, -- draft/approved/sent
  approved_by TEXT,
  sent_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Phase 2: Stakeholder Intelligence Module (Week 3-4)
**Goal:** Build comprehensive stakeholder tracking and engagement

### 2.1 Stakeholder Groups Module
**Integration:** `mcp-stakeholder-groups` (7 tools)

**UI Module:** `src/components/modules/StakeholderModule.tsx`

**Features:**
- Stakeholder directory (employees, investors, media, regulators, customers)
- Relationship mapping (who knows who)
- Sentiment tracking per stakeholder group
- Communication history
- Engagement planning

**MCP Tools Available:**
1. `create_stakeholder_group` - Create new stakeholder group
2. `add_stakeholder` - Add individual to group
3. `track_interaction` - Log communication
4. `analyze_sentiment` - Sentiment per group
5. `generate_engagement_plan` - Create outreach strategy
6. `identify_key_influencers` - Find key stakeholders
7. `monitor_stakeholder_concerns` - Track issues

### 2.2 Stakeholder AI Advisor
**Integration:** Claude + Stakeholder Data

**From old SignalDesk:** `StakeholderAIAdvisor.js` had smart recommendations

**Features:**
- Recommends which stakeholders to engage
- Suggests communication strategies per group
- Identifies relationship gaps
- Predicts stakeholder reactions
- Generates personalized messaging

### 2.3 Database Schema
```sql
-- Stakeholder Groups
CREATE TABLE stakeholder_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL, -- employees, investors, media, etc.
  description TEXT,
  priority TEXT, -- critical/high/medium/low
  communication_preferences JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stakeholders
CREATE TABLE stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  group_id UUID REFERENCES stakeholder_groups(id),
  name TEXT NOT NULL,
  role TEXT,
  organization TEXT,
  email TEXT,
  phone TEXT,
  social_profiles JSONB,
  sentiment TEXT, -- positive/neutral/negative
  last_interaction TIMESTAMPTZ,
  interaction_history JSONB[],
  influence_score INTEGER, -- 0-100
  relationship_strength TEXT, -- strong/moderate/weak/none
  concerns JSONB[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stakeholder Interactions
CREATE TABLE stakeholder_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  stakeholder_id UUID REFERENCES stakeholders(id),
  interaction_type TEXT NOT NULL, -- email/call/meeting/social
  content TEXT,
  sentiment TEXT,
  outcome TEXT,
  next_steps JSONB,
  interaction_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Phase 3: Media Relations Module (Week 5-6)
**Goal:** Build journalist database and media outreach

### 3.1 Media Relations Module
**Integration:** `mcp-media` (6 tools)

**UI Module:** `src/components/modules/MediaRelationsModule.tsx`

**Features:**
- Journalist database
- Media list generator
- Pitch tracker
- Coverage monitoring
- Relationship management

**MCP Tools Available:**
1. `find_journalists` - Discover journalists by beat
2. `generate_media_list` - Create targeted lists
3. `track_coverage` - Monitor media coverage
4. `analyze_journalist_interests` - Profile journalist topics
5. `generate_pitch` - Create personalized pitches
6. `monitor_media_opportunities` - Find coverage opportunities

### 3.2 Journalist Discovery
**Integration:** `mcp-media` + Web Search

**Smart Discovery:**
- Search by beat (tech, finance, healthcare)
- Find journalists covering competitors
- Identify trending journalists
- Track journalist social activity
- Map journalist networks

### 3.3 Pitch Generation
**Integration:** `mcp-media` + `niv-orchestrator-robust`

**Flow:**
1. User selects journalists
2. AI analyzes journalist interests/recent articles
3. Generates personalized pitches
4. Tracks pitch status (sent/responded/covered)

### 3.4 Database Schema
```sql
-- Journalists
CREATE TABLE journalists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  outlet TEXT NOT NULL,
  beat TEXT[], -- tech, finance, healthcare, etc.
  email TEXT,
  twitter TEXT,
  linkedin TEXT,
  recent_articles JSONB[],
  interests JSONB[],
  relationship_strength TEXT,
  last_contact TIMESTAMPTZ,
  coverage_history JSONB[],
  response_rate INTEGER, -- 0-100
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media Lists
CREATE TABLE media_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  journalist_ids UUID[],
  campaign_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pitches
CREATE TABLE pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  journalist_id UUID REFERENCES journalists(id),
  media_list_id UUID REFERENCES media_lists(id),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL, -- draft/sent/responded/covered/declined
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  response TEXT,
  coverage_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Phase 4: Campaign Management Module (Week 7-8)
**Goal:** Full campaign lifecycle management

### 4.1 Campaign Manager Module
**Integration:** `mcp-campaigns` (6 tools)

**UI Module:** `src/components/modules/CampaignManagerModule.tsx`

**Features:**
- Campaign creation wizard
- Multi-channel campaigns (PR, social, content)
- Campaign timeline & milestones
- Asset management
- Performance tracking

**MCP Tools Available:**
1. `create_campaign` - Initialize new campaign
2. `add_campaign_asset` - Upload content/assets
3. `track_campaign_performance` - Monitor metrics
4. `generate_campaign_report` - Create reports
5. `schedule_campaign_activity` - Timeline planning
6. `analyze_campaign_effectiveness` - ROI analysis

### 4.2 Campaign Flow
```
Opportunity Detected
  ↓
User clicks "Create Campaign"
  ↓
Campaign Wizard:
  - Set goals
  - Choose channels (PR/social/content)
  - Define timeline
  - Assign team
  ↓
Generate Campaign Assets:
  - Press releases (mcp-content)
  - Social posts (mcp-social-intelligence)
  - Media lists (mcp-media)
  - Stakeholder comms (mcp-stakeholder-groups)
  ↓
Execute & Track:
  - Send pitches
  - Post social
  - Monitor coverage
  - Track metrics
  ↓
Campaign Report:
  - Coverage achieved
  - Engagement metrics
  - ROI analysis
  - Learnings for future
```

### 4.3 Database Schema
```sql
-- Campaigns (already exists, enhance it)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS
  goals JSONB,
  channels JSONB[], -- pr, social, content, email
  timeline JSONB,
  team_members JSONB[],
  assets JSONB[],
  metrics JSONB,
  performance JSONB;
```

---

## Phase 5: Memory & Analytics (Week 9-10)
**Goal:** Learn from past campaigns and track performance

### 5.1 MemoryVault Enhancements
**Integration:** `mcp-memory` (6 tools) + existing MemoryVault

**New Features:**
- Pattern learning from successful campaigns
- Failure analysis from unsuccessful campaigns
- Best practices library
- Journalist response patterns
- Optimal timing analysis

**MCP Tools Available:**
1. `store_pattern` - Save successful pattern
2. `retrieve_similar` - Find similar past situations
3. `learn_from_outcome` - Analyze success/failure
4. `identify_trends` - Spot patterns over time
5. `generate_recommendations` - Suggest based on history
6. `export_learnings` - Create best practices doc

### 5.2 Analytics Dashboard
**Integration:** `mcp-analytics` + existing data

**UI Module:** Enhance existing modules with analytics

**Metrics to Track:**
- Campaign performance (coverage, engagement, ROI)
- Journalist response rates
- Stakeholder sentiment trends
- Crisis response times
- Opportunity conversion rates
- Social signal accuracy

---

## Phase 6: Narrative & Compliance (Week 11-12)
**Goal:** Track narratives and ensure regulatory compliance

### 6.1 Narrative Tracking
**Integration:** `mcp-narratives` (7 tools)

**Features:**
- Track competing narratives in media
- Monitor narrative evolution over time
- Identify narrative threats/opportunities
- Counter-narrative development

### 6.2 Regulatory Compliance
**Integration:** `mcp-regulatory` (7 tools)

**Features:**
- Track regulatory changes
- Compliance monitoring
- Risk assessment
- Filing assistance
- Regulatory stakeholder tracking

---

## Implementation Priority Matrix

### IMMEDIATE (Weeks 1-2) - Crisis Management
**Why:** Crisis = highest urgency, premium feature, $50k+ value
- Crisis Command Center UI
- Crisis plan generator (`mcp-crisis`)
- Crisis detection (social sentiment spike)
- AI Crisis Assistant

### HIGH PRIORITY (Weeks 3-6) - Stakeholder & Media
**Why:** Core PR workflows, daily usage, clear ROI
- Stakeholder tracking (`mcp-stakeholder-groups`)
- Media relations (`mcp-media`)
- Journalist discovery & pitching

### MEDIUM PRIORITY (Weeks 7-10) - Campaigns & Memory
**Why:** Full-stack features, enhance existing modules
- Campaign management (`mcp-campaigns`)
- Memory & pattern learning (`mcp-memory`)
- Analytics dashboard (`mcp-analytics`)

### LOWER PRIORITY (Weeks 11-12) - Narrative & Compliance
**Why:** Nice-to-have, specialized use cases
- Narrative tracking (`mcp-narratives`)
- Regulatory compliance (`mcp-regulatory`)
- Relationship mapping (`mcp-relationships`)

---

## Technical Architecture

### MCP Integration Pattern
```typescript
// Standardized MCP call pattern
async function callMCP(
  mcpName: string,
  toolName: string,
  args: any
) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/${mcpName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        tool: toolName,
        arguments: args
      })
    }
  )
  return response.json()
}
```

### Module Structure
```
src/
  components/
    modules/
      CrisisCommandCenter.tsx       [Phase 1]
      StakeholderModule.tsx          [Phase 2]
      MediaRelationsModule.tsx       [Phase 3]
      CampaignManagerModule.tsx      [Phase 4]

  services/
    crisisService.ts                 [Phase 1]
    stakeholderService.ts            [Phase 2]
    mediaService.ts                  [Phase 3]
    campaignService.ts               [Phase 4]
    memoryService.ts                 [Phase 5]

  hooks/
    useCrisisManagement.ts           [Phase 1]
    useStakeholders.ts               [Phase 2]
    useMediaRelations.ts             [Phase 3]
    useCampaigns.ts                  [Phase 4]
```

---

## Success Metrics

### Phase 1 (Crisis) Success Criteria:
- ✅ Crisis plans can be generated in < 2 minutes
- ✅ Social sentiment spike auto-triggers crisis detection
- ✅ AI Assistant provides plan-specific guidance
- ✅ Crisis documentation auto-tracked
- ✅ Stakeholder comms drafted within 5 minutes

### Phase 2 (Stakeholder) Success Criteria:
- ✅ 100+ stakeholders can be tracked per org
- ✅ Sentiment analysis per stakeholder group
- ✅ Engagement plans generated automatically
- ✅ Interaction history searchable

### Phase 3 (Media) Success Criteria:
- ✅ 50+ journalists discovered per search
- ✅ Personalized pitches generated in < 1 minute
- ✅ Media coverage auto-tracked
- ✅ Response rates calculated

### Phase 4 (Campaigns) Success Criteria:
- ✅ End-to-end campaign created in < 10 minutes
- ✅ All assets generated (PR, social, media lists)
- ✅ Performance tracked in real-time
- ✅ Campaign reports auto-generated

---

## Risk Mitigation

### Risk 1: Scope Creep
**Mitigation:** Stick to phase plan, don't add features mid-phase

### Risk 2: MCP API Changes
**Mitigation:** Version MCPs, maintain compatibility layer

### Risk 3: UI Complexity
**Mitigation:** Keep modules focused, use tabs/sections, progressive disclosure

### Risk 4: Performance
**Mitigation:** Implement caching, pagination, lazy loading

---

## Next Steps

**Immediate Action:**
1. Review and approve this plan
2. Start Phase 1: Crisis Command Center
3. Create crisis_events and crisis_communications tables
4. Port CrisisCommandCenter.tsx from old SignalDesk
5. Integrate mcp-crisis for plan generation

**Questions to Decide:**
1. Should we do Phase 1 (Crisis) first or something else?
2. Do you want to port the exact UI from old SignalDesk or redesign?
3. Should crisis detection auto-activate the Crisis Center?
4. What's the priority: Crisis, Stakeholder, or Media first?

---

*Master Plan created: January 2025*
*Total Implementation Time: 12 weeks (3 months)*
*Expected Value: $100k+ annual subscription value*
