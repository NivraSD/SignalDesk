# Crisis & MCP Implementation Roadmap
*Complete task breakdown for Crisis Command Center, Firecrawl Observer, and MCP integrations*

**Created:** January 2025
**Status:** Ready to Execute
**Timeline:** 4-6 weeks

---

## Phase 1: Crisis Command Center (Weeks 1-2)

### 1.1 Import Crisis UI from Old SignalDesk

**Source Files to Port:**
```
FROM: /Users/jonathanliebowitz/Desktop/SignalDesk/frontend/src/components/

Files to Import:
✅ CrisisCommandCenter.js (4651 lines) → CrisisCommandCenter.tsx
✅ AIAdvisorHelp.js → CrisisAIAssistant.tsx
✅ crisisController.js → crisisService.ts
```

**What We're Importing:**

#### Core Crisis UI Components (from CrisisCommandCenter.js)
- [ ] **Crisis Status Dashboard**
  - Crisis timer (elapsed time display)
  - Crisis severity meter (low/medium/high/critical)
  - Status toggle (monitoring/active/resolved)
  - Quick stats panel (team active, tasks completed, comms sent, decisions made)

- [ ] **AI Crisis Assistant Panel**
  - Chat interface with crisis context
  - Quick action buttons (from AIAdvisorHelp.js)
  - Example questions popup
  - Crisis severity auto-detection from keywords
  - Conversation history tracking

- [ ] **Crisis Documentation System**
  - Timeline view (chronological event tracking)
  - Decision log (major decisions with rationale)
  - Communications log (all stakeholder communications)
  - AI interactions log (chat history with AI)

- [ ] **Team & Task Management**
  - Team status tracking (who's active, their roles)
  - Task assignment & completion
  - Team member availability status
  - Role-based task routing

- [ ] **Communication Drafts Panel**
  - Pre-written templates by stakeholder type:
    - Employees
    - Media
    - Investors
    - Customers
    - Regulators
  - Draft editing interface
  - Approval workflow
  - Send tracking

- [ ] **Crisis Plan Management**
  - Plan generator modal
  - Plan form (industry, company size, team, concerns)
  - Plan viewer with editable sections
  - Plan export/import

- [ ] **Crisis Scenarios Library**
  - Pre-built scenarios:
    - Data breach
    - Product recall
    - Executive scandal
    - Financial crisis
    - Environmental incident
    - Safety incident
    - Legal issues
  - Scenario selector modal
  - Scenario activation flow

#### State Management (from CrisisCommandCenter.js)
- [ ] Crisis status state (monitoring/active/resolved)
- [ ] Crisis timer (start time, elapsed calculation)
- [ ] Crisis severity (low/medium/high/critical)
- [ ] Selected scenario
- [ ] Team status object
- [ ] Tasks array
- [ ] Decision log array
- [ ] Communication drafts object
- [ ] Crisis documentation object (timeline, decisions, comms)
- [ ] AI conversation history
- [ ] Plan form state
- [ ] Current crisis plan

#### Functions to Port
- [ ] `handleAPIError()` - Error handling wrapper
- [ ] `analyzeCrisisSeverity()` - Keyword-based severity detection
- [ ] `documentAction()` - Add to timeline/log
- [ ] `sendMessage()` - AI chat interaction
- [ ] `generateCrisisPlan()` - Call MCP to create plan
- [ ] `activateScenario()` - Load scenario, start timer
- [ ] `saveCommunicationDraft()` - Save stakeholder comms
- [ ] `exportCrisisReport()` - Generate report
- [ ] Timer interval management
- [ ] Auto-save documentation

#### Styling to Preserve
- [ ] Crisis timer display (monospace, red when active)
- [ ] Severity meter color coding
- [ ] Status badge styling
- [ ] Timeline visualization
- [ ] Chat message styling (user vs AI)
- [ ] Communication draft cards
- [ ] Quick stats layout
- [ ] Modal designs (plan generator, scenario selector)

---

### 1.2 Create Crisis Database Schema

**New Tables to Create:**

#### `crisis_events` Table
```sql
CREATE TABLE crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,

  -- Crisis Details
  crisis_type TEXT NOT NULL, -- data_breach, product_recall, etc.
  severity TEXT NOT NULL, -- low, medium, high, critical
  status TEXT NOT NULL, -- monitoring, active, resolved
  title TEXT NOT NULL,
  description TEXT,

  -- Timeline
  started_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  duration_minutes INTEGER, -- Auto-calculated

  -- Documentation
  timeline JSONB[] DEFAULT '{}', -- [{time, type, content, actor}]
  decisions JSONB[] DEFAULT '{}', -- [{time, decision, rationale, actor}]
  communications JSONB[] DEFAULT '{}', -- [{time, stakeholder, content, status}]
  ai_interactions JSONB[] DEFAULT '{}', -- [{time, user_msg, ai_response}]

  -- Team
  team_status JSONB DEFAULT '{}', -- {user_id: {status, role, tasks}}
  tasks JSONB[] DEFAULT '{}', -- [{id, title, assignee, status, deadline}]

  -- Context
  trigger_source TEXT, -- social_spike, observer_alert, manual
  trigger_data JSONB, -- Source data (social signals, observer change, etc.)
  crisis_plan_id UUID, -- Reference to loaded crisis plan

  -- Metrics
  social_signals JSONB[], -- Social signals during crisis
  media_coverage JSONB[], -- Media coverage tracked
  stakeholder_sentiment JSONB, -- Sentiment by stakeholder group

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crisis_events_org ON crisis_events(organization_id);
CREATE INDEX idx_crisis_events_status ON crisis_events(status);
CREATE INDEX idx_crisis_events_severity ON crisis_events(severity);
CREATE INDEX idx_crisis_events_started ON crisis_events(started_at DESC);
```

#### `crisis_communications` Table
```sql
CREATE TABLE crisis_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crisis_event_id UUID REFERENCES crisis_events(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL,

  -- Communication Details
  stakeholder_type TEXT NOT NULL, -- employees, media, investors, customers, regulators
  stakeholder_name TEXT, -- Specific person/outlet if applicable
  subject TEXT,
  content TEXT NOT NULL,

  -- Status
  status TEXT NOT NULL, -- draft, approved, sent, responded
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_via TEXT, -- email, phone, social, press_release

  -- Response Tracking
  response_received BOOLEAN DEFAULT false,
  response_content TEXT,
  response_at TIMESTAMPTZ,
  response_sentiment TEXT, -- positive, neutral, negative

  -- Version Control
  version INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES crisis_communications(id),

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crisis_comms_event ON crisis_communications(crisis_event_id);
CREATE INDEX idx_crisis_comms_status ON crisis_communications(status);
CREATE INDEX idx_crisis_comms_stakeholder ON crisis_communications(stakeholder_type);
```

#### `crisis_plans` Table (use existing `content_library`)
```sql
-- Just add to content_library with type='crisis-plan'
-- Structure:
{
  id: uuid,
  organization_id: text,
  title: "Crisis Management Plan - [Company Name]",
  content_type: "crisis-plan",
  content: {
    industry: "Electric Vehicles",
    company_size: "10000+",
    team_members: [{name, role, contact}],

    scenarios: [
      {
        type: "data_breach",
        title: "Data Breach Response",
        severity: "critical",
        response_protocol: {
          immediate_actions: ["Isolate systems", "Notify legal"],
          hour_1: ["Assess scope", "Notify key stakeholders"],
          hour_24: ["Public statement", "Media response"],
          week_1: ["Recovery plan", "Ongoing communications"]
        },
        stakeholder_comms: {
          employees: "Template text...",
          customers: "Template text...",
          media: "Template text..."
        },
        team_roles: {
          incident_commander: "Name, contact",
          legal_lead: "Name, contact",
          pr_lead: "Name, contact"
        },
        decision_tree: [{question, yes_action, no_action}]
      }
      // ... more scenarios
    ],

    emergency_contacts: [{name, role, phone, email}],
    escalation_paths: [{trigger, notify}],
    legal_considerations: ["..."],
    regulatory_requirements: ["..."]
  },
  metadata: {
    tags: ["crisis-plan"],
    generated_at: timestamp,
    last_updated: timestamp
  }
}
```

---

### 1.3 Create Crisis NIV (NEW)

**File:** `supabase/functions/niv-crisis-advisor/index.ts`

#### Core Features
- [ ] Simple, directive-focused system prompt (no strategic framework)
- [ ] Crisis plan loading from content_library
- [ ] ONE action per response (max 100 words)
- [ ] Reference specific plan sections
- [ ] Low temperature (0.3) for consistency
- [ ] Fast response (< 5 seconds target)

#### System Prompt Template
```typescript
const CRISIS_SYSTEM_PROMPT = `
You are an experienced crisis management expert providing immediate, actionable guidance during an active crisis.

CRISIS CONTEXT:
- Type: {crisis_type}
- Severity: {severity}
- Status: {status}
- Time Elapsed: {elapsed_time}
- Triggering Event: {trigger_event}

LOADED CRISIS PLAN:
{crisis_plan_content}

RECENT SOCIAL SIGNALS:
{recent_social_signals}

TEAM STATUS:
{team_status}

YOUR DIRECTIVE:
1. Provide ONE specific action to take right now
2. Reference the crisis plan section if applicable
3. Keep responses under 100 words
4. Be directive ("Do X") not exploratory ("You could...")
5. Include WHO should do it and WHEN

RESPONSE FORMAT:
ACTION: [Specific action]
WHO: [Person/role]
WHEN: [Timeframe]
WHY: [Brief rationale - 1 sentence]
PLAN REFERENCE: [Section if applicable]

EXAMPLES:
Bad: "You could consider reaching out to stakeholders or maybe drafting a statement..."
Good: "ACTION: Call crisis team lead (John Smith, 555-1234) immediately. WHO: You. WHEN: Next 5 minutes. WHY: Plan Section 2.1 requires team activation within 15 minutes of crisis declaration. PLAN REFERENCE: Section 2.1 - Crisis Team Activation"

Remember: ONE action, be directive, reference the plan.
`

// Implementation
serve(async (req) => {
  const {
    crisis_event_id,
    message,
    organization_id
  } = await req.json()

  // Load crisis event
  const crisisEvent = await loadCrisisEvent(crisis_event_id)

  // Load crisis plan from content_library
  const crisisPlan = await loadCrisisPlan(
    crisisEvent.crisis_plan_id,
    organization_id
  )

  // Build context
  const systemPrompt = CRISIS_SYSTEM_PROMPT
    .replace('{crisis_type}', crisisEvent.crisis_type)
    .replace('{severity}', crisisEvent.severity)
    .replace('{status}', crisisEvent.status)
    .replace('{elapsed_time}', calculateElapsedTime(crisisEvent.started_at))
    .replace('{trigger_event}', crisisEvent.trigger_data?.summary || 'Unknown')
    .replace('{crisis_plan_content}', formatCrisisPlan(crisisPlan))
    .replace('{recent_social_signals}', formatSocialSignals(crisisEvent.social_signals))
    .replace('{team_status}', formatTeamStatus(crisisEvent.team_status))

  // Call Claude with crisis context
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0.3, // Low temp for consistent crisis response
      system: systemPrompt,
      messages: [
        ...buildConversationHistory(crisisEvent.ai_interactions),
        { role: 'user', content: message }
      ]
    })
  })

  const aiResponse = await response.json()
  const content = aiResponse.content[0].text

  // Log interaction to crisis event
  await logCrisisInteraction(crisis_event_id, message, content)

  // Return response
  return new Response(JSON.stringify({
    response: content,
    crisis_context: {
      type: crisisEvent.crisis_type,
      severity: crisisEvent.severity,
      elapsed_time: calculateElapsedTime(crisisEvent.started_at)
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

#### Helper Functions to Implement
- [ ] `loadCrisisEvent()` - Get crisis from DB
- [ ] `loadCrisisPlan()` - Get plan from content_library
- [ ] `formatCrisisPlan()` - Format plan for system prompt
- [ ] `formatSocialSignals()` - Format recent signals
- [ ] `formatTeamStatus()` - Format team availability
- [ ] `calculateElapsedTime()` - Human-readable elapsed time
- [ ] `buildConversationHistory()` - Format AI interactions
- [ ] `logCrisisInteraction()` - Save to crisis_events.ai_interactions

---

### 1.4 Crisis Plan Generator (using mcp-crisis)

**Integration:** `mcp-crisis` + Claude

**File:** `src/services/crisisService.ts`

#### Plan Generation Flow
```typescript
async function generateCrisisPlan(formData: {
  organization_name: string
  industry: string
  company_size: string
  team_members: Array<{name: string, role: string, contact: string}>
  key_concerns: string[]
  existing_protocols?: string
  additional_context?: string
  emergency_contacts: Array<{name: string, role: string, phone: string, email: string}>
}) {

  // Step 1: Call mcp-crisis to generate plan
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/mcp-crisis`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        tool: 'generate_crisis_plan',
        arguments: {
          organization: formData.organization_name,
          industry: formData.industry,
          company_size: formData.company_size,
          team: formData.team_members,
          concerns: formData.key_concerns,
          context: formData.additional_context
        }
      })
    }
  )

  const crisisPlan = await response.json()

  // Step 2: Enhance with emergency contacts
  const enhancedPlan = {
    ...crisisPlan,
    emergency_contacts: formData.emergency_contacts,
    team_members: formData.team_members,
    generated_at: new Date().toISOString()
  }

  // Step 3: Save to content_library
  const saved = await fetch('/api/content-library/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: formData.organization_name,
      title: `Crisis Management Plan - ${formData.organization_name}`,
      content_type: 'crisis-plan',
      content: enhancedPlan,
      metadata: {
        tags: ['crisis-plan'],
        industry: formData.industry,
        generated_at: new Date().toISOString()
      }
    })
  })

  return saved.data
}
```

#### Crisis Scenarios to Generate
- [ ] Data breach / cybersecurity incident
- [ ] Product recall / safety issue
- [ ] Executive scandal / misconduct
- [ ] Financial crisis / bankruptcy
- [ ] Environmental incident / pollution
- [ ] Workplace accident / safety incident
- [ ] Legal action / lawsuit
- [ ] Regulatory investigation
- [ ] Social media crisis / boycott
- [ ] Natural disaster / facility damage

Each scenario should include:
- [ ] Immediate actions (first 15 minutes)
- [ ] Hour 1 actions
- [ ] First 24 hours
- [ ] First week
- [ ] Stakeholder communication templates
- [ ] Team roles & responsibilities
- [ ] Decision trees
- [ ] Escalation paths
- [ ] Legal considerations
- [ ] Media response protocols

---

### 1.5 Crisis Detection & Auto-Activation

#### Integration Points

**A. Social Sentiment Spike → Crisis Detection**
```typescript
// In mcp-opportunity-detector/social-patterns.ts
// Already exists: sentimentSpikePattern

// Enhancement: Also trigger crisis alert
export const sentimentSpikePattern = {
  detector: (signals, orgName) => {
    const negativeCount = ...
    const negativePercentage = (negativeCount / recentSignals.length) * 100

    if (negativePercentage >= 40 && recentSignals.length >= 5) {
      // TRIGGER CRISIS ALERT
      return {
        opportunity: {...}, // Existing opportunity
        crisis_alert: {
          severity: negativePercentage >= 60 ? 'high' : 'medium',
          trigger_type: 'social_sentiment_spike',
          signals: recentSignals,
          recommended_action: 'activate_crisis_center'
        }
      }
    }
  }
}
```

**B. Firecrawl Observer Alert → Crisis Detection**
```typescript
// In observer webhook handler
async function handleObserverAlert(change) {
  // Analyze significance
  if (isCrisisRelated(change)) {
    // Create crisis event
    await createCrisisEvent({
      organization_id: change.organization_id,
      crisis_type: determineCrisisType(change),
      severity: 'medium',
      status: 'monitoring',
      title: `Observer Alert: ${change.summary}`,
      trigger_source: 'observer_alert',
      trigger_data: change
    })

    // Send UI notification
    await sendCrisisAlert(change.organization_id)
  }
}
```

**C. Manual Crisis Activation**
```typescript
// User clicks "Activate Crisis" button
async function activateCrisis(scenarioType: string) {
  // Load crisis plan
  const plan = await loadCrisisPlan(organization_id)

  // Create crisis event
  const crisisEvent = await createCrisisEvent({
    organization_id,
    crisis_type: scenarioType,
    severity: 'medium', // User can adjust
    status: 'active',
    started_at: new Date(),
    crisis_plan_id: plan.id
  })

  // Start timer
  // Load team
  // Activate UI
}
```

---

### 1.6 Crisis Command Center UI Components

**Files to Create:**

#### `src/components/modules/CrisisCommandCenter.tsx` (Main Module)
- [ ] Header with crisis timer, severity, status
- [ ] 3-column layout:
  - Left: AI Assistant + Quick Stats
  - Center: Timeline + Documentation
  - Right: Team + Tasks + Communications

#### `src/components/crisis/CrisisHeader.tsx`
- [ ] Crisis timer display
- [ ] Severity meter
- [ ] Status toggle (monitoring/active/resolved)
- [ ] Crisis type badge

#### `src/components/crisis/CrisisAIAssistant.tsx`
- [ ] Chat interface
- [ ] Crisis context display
- [ ] Quick action buttons
- [ ] Plan reference links
- [ ] Calls niv-crisis-advisor

#### `src/components/crisis/CrisisTimeline.tsx`
- [ ] Chronological event list
- [ ] Add timeline entry form
- [ ] Event type icons (decision, communication, ai_interaction)
- [ ] Export timeline

#### `src/components/crisis/CrisisTeamManager.tsx`
- [ ] Team member cards (status, role, contact)
- [ ] Task assignment
- [ ] Task completion tracking
- [ ] Quick contact buttons

#### `src/components/crisis/CrisisCommunications.tsx`
- [ ] Communication draft cards by stakeholder type
- [ ] Edit/approve/send workflow
- [ ] Template library
- [ ] Send tracking

#### `src/components/crisis/CrisisPlanGenerator.tsx`
- [ ] Multi-step form
- [ ] Industry selector
- [ ] Team member inputs
- [ ] Emergency contacts
- [ ] Generate button
- [ ] Plan preview

#### `src/components/crisis/CrisisScenarioSelector.tsx`
- [ ] Scenario cards (data breach, product recall, etc.)
- [ ] Scenario descriptions
- [ ] Activate scenario button
- [ ] Load pre-defined plan for scenario

#### `src/services/crisisService.ts`
- [ ] `generateCrisisPlan()`
- [ ] `createCrisisEvent()`
- [ ] `loadCrisisEvent()`
- [ ] `updateCrisisTimeline()`
- [ ] `saveCommunicationDraft()`
- [ ] `assignTask()`
- [ ] `exportCrisisReport()`

---

## Phase 2: Firecrawl Observer Integration (Week 3)

### 2.1 Observer Infrastructure Setup

**File:** `supabase/functions/firecrawl-observer-manager/index.ts`

#### Core Features (with OFF switch)
```typescript
const OBSERVER_ENABLED = Deno.env.get('ENABLE_OBSERVER') === 'true' // Default: false
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')

serve(async (req) => {
  if (!OBSERVER_ENABLED) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Observer is disabled (ENABLE_OBSERVER=false)'
    }), { status: 200 })
  }

  // Observer logic...
})
```

#### Observer Configuration Management
- [ ] `create_observer()` - Set up new website monitor
- [ ] `list_observers()` - Get all active monitors
- [ ] `pause_observer()` - Temporarily stop monitoring
- [ ] `delete_observer()` - Remove monitor
- [ ] `get_observer_status()` - Check monitor health

#### Observer Targets Database
```sql
CREATE TABLE observer_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,

  -- Target Details
  url TEXT NOT NULL,
  target_type TEXT NOT NULL, -- competitor, regulator, media, stakeholder
  target_name TEXT NOT NULL,
  description TEXT,

  -- Monitoring Config
  check_interval TEXT NOT NULL, -- hourly, daily, weekly
  ai_enabled BOOLEAN DEFAULT true,
  selector TEXT, -- CSS selector for specific content

  -- Observer Integration
  observer_id TEXT, -- Firecrawl observer ID
  webhook_url TEXT,

  -- Status
  status TEXT NOT NULL, -- active, paused, error
  last_check TIMESTAMPTZ,
  last_change TIMESTAMPTZ,
  change_count INTEGER DEFAULT 0,

  -- Alerts
  alert_threshold TEXT, -- immediate, significant, all
  notify_channels TEXT[], -- email, slack, ui

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_observer_targets_org ON observer_targets(organization_id);
CREATE INDEX idx_observer_targets_type ON observer_targets(target_type);
CREATE INDEX idx_observer_targets_status ON observer_targets(status);
```

#### Observer Changes Database
```sql
CREATE TABLE observer_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observer_target_id UUID REFERENCES observer_targets(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL,

  -- Change Details
  change_type TEXT NOT NULL, -- content_change, structure_change, new_page
  summary TEXT NOT NULL,
  diff TEXT, -- What actually changed
  full_content TEXT,

  -- Analysis
  significance_score INTEGER, -- 0-100 from AI
  ai_analysis TEXT,
  keywords_detected TEXT[],

  -- Crisis Detection
  crisis_related BOOLEAN DEFAULT false,
  crisis_type TEXT,
  crisis_severity TEXT,

  -- Opportunity Detection
  opportunity_related BOOLEAN DEFAULT false,
  opportunity_type TEXT,

  -- Actions Taken
  alert_sent BOOLEAN DEFAULT false,
  crisis_activated BOOLEAN DEFAULT false,
  opportunity_created BOOLEAN DEFAULT false,

  -- Source
  detected_at TIMESTAMPTZ NOT NULL,
  url TEXT NOT NULL,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_observer_changes_target ON observer_changes(observer_target_id);
CREATE INDEX idx_observer_changes_significance ON observer_changes(significance_score DESC);
CREATE INDEX idx_observer_changes_crisis ON observer_changes(crisis_related);
CREATE INDEX idx_observer_changes_detected ON observer_changes(detected_at DESC);
```

---

### 2.2 Observer Webhook Handler

**File:** `supabase/functions/observer-webhook/index.ts`

#### Webhook Processing Flow
```typescript
serve(async (req) => {
  const change = await req.json()

  // Step 1: Save raw change
  const savedChange = await saveObserverChange(change)

  // Step 2: AI Analysis (if enabled)
  if (change.ai_enabled) {
    const analysis = await analyzeChangeSignificance(change)

    // Update with analysis
    await updateChangeAnalysis(savedChange.id, analysis)

    // Step 3: Crisis Detection
    if (analysis.crisis_related) {
      await handleCrisisDetection(change, analysis)
    }

    // Step 4: Opportunity Detection
    if (analysis.opportunity_related) {
      await handleOpportunityDetection(change, analysis)
    }
  }

  // Step 5: Send alerts
  if (analysis.significance_score >= 70) {
    await sendObserverAlert(change, analysis)
  }

  return new Response('OK', { status: 200 })
})
```

#### Crisis Detection from Observer
```typescript
async function handleCrisisDetection(change, analysis) {
  if (analysis.crisis_severity === 'critical' || analysis.crisis_severity === 'high') {
    // Auto-create crisis event
    const crisisEvent = await createCrisisEvent({
      organization_id: change.organization_id,
      crisis_type: analysis.crisis_type,
      severity: analysis.crisis_severity,
      status: 'monitoring', // Don't auto-activate, just alert
      title: `Observer Alert: ${change.summary}`,
      trigger_source: 'observer_alert',
      trigger_data: {
        url: change.url,
        change: change.diff,
        analysis: analysis.ai_analysis
      }
    })

    // Send UI notification
    await sendCrisisAlert({
      organization_id: change.organization_id,
      crisis_event_id: crisisEvent.id,
      message: `🚨 Potential crisis detected: ${change.summary}`,
      action: 'Review in Crisis Command Center'
    })
  }
}
```

---

### 2.3 Observer UI Module

**File:** `src/components/modules/ObserverModule.tsx`

#### Features (Read-Only when OBSERVER_ENABLED=false)
- [ ] Observer targets list
- [ ] Add new target form (disabled if not enabled)
- [ ] Recent changes feed
- [ ] Change significance visualization
- [ ] Crisis/opportunity indicators
- [ ] Target status (active/paused/error)

#### UI States
```typescript
const ObserverModule = () => {
  const observerEnabled = useObserverStatus() // Check env var

  if (!observerEnabled) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">Observer Disabled</h3>
        <p className="text-gray-400 mb-4">
          Firecrawl Observer is currently disabled to conserve API costs.
        </p>
        <p className="text-sm text-gray-500">
          Set ENABLE_OBSERVER=true in environment to activate.
        </p>
      </div>
    )
  }

  // Normal observer UI...
}
```

---

### 2.4 Pre-Configured Observer Targets (Ready to Activate)

**Competitor Intelligence Targets:**
- [ ] About Us / Leadership pages (executive changes)
- [ ] Product pages (feature launches)
- [ ] Careers pages (hiring signals)
- [ ] Newsroom pages (announcements)
- [ ] Investor relations (financial moves)

**Regulatory Monitoring Targets:**
- [ ] NHTSA investigations page
- [ ] SEC litigation releases
- [ ] FTC enforcement actions
- [ ] Industry-specific regulator sites

**Media Opportunity Targets:**
- [ ] Reporter beat pages (coverage changes)
- [ ] Editorial calendars (upcoming themes)
- [ ] "Call for sources" pages

**Stakeholder Tracking Targets:**
- [ ] Labor union campaign pages
- [ ] Activist organization initiatives
- [ ] Industry association position papers

---

## Phase 3: Additional MCP Integrations (Weeks 4-6)

### 3.1 Stakeholder Intelligence (`mcp-stakeholder-groups`)

**File:** `src/components/modules/StakeholderModule.tsx`

#### Features
- [ ] Stakeholder directory
- [ ] Group management (employees, investors, media, regulators, customers)
- [ ] Relationship tracking
- [ ] Sentiment analysis per group
- [ ] Interaction logging
- [ ] Communication planning

#### Database Schema
```sql
CREATE TABLE stakeholder_groups (...)
CREATE TABLE stakeholders (...)
CREATE TABLE stakeholder_interactions (...)
```

#### MCP Integration
- [ ] `create_stakeholder_group`
- [ ] `add_stakeholder`
- [ ] `track_interaction`
- [ ] `analyze_sentiment`
- [ ] `generate_engagement_plan`
- [ ] `identify_key_influencers`
- [ ] `monitor_stakeholder_concerns`

---

### 3.2 Media Relations (`mcp-media`)

**File:** `src/components/modules/MediaRelationsModule.tsx`

#### Features
- [ ] Journalist database
- [ ] Beat-based discovery
- [ ] Media list builder
- [ ] Pitch tracker
- [ ] Coverage monitoring
- [ ] Relationship strength scoring

#### Database Schema
```sql
CREATE TABLE journalists (...)
CREATE TABLE media_lists (...)
CREATE TABLE pitches (...)
```

#### MCP Integration
- [ ] `find_journalists`
- [ ] `generate_media_list`
- [ ] `track_coverage`
- [ ] `analyze_journalist_interests`
- [ ] `generate_pitch`
- [ ] `monitor_media_opportunities`

---

### 3.3 Campaign Management (`mcp-campaigns`)

**File:** `src/components/modules/CampaignManagerModule.tsx`

#### Features
- [ ] Campaign wizard
- [ ] Multi-channel campaigns (PR, social, content)
- [ ] Timeline planning
- [ ] Asset management
- [ ] Performance tracking
- [ ] Campaign reports

#### Enhancement to Existing Table
```sql
ALTER TABLE campaigns ADD COLUMN
  goals JSONB,
  channels TEXT[],
  timeline JSONB,
  team_members JSONB[],
  assets JSONB[],
  performance JSONB;
```

#### MCP Integration
- [ ] `create_campaign`
- [ ] `add_campaign_asset`
- [ ] `track_campaign_performance`
- [ ] `generate_campaign_report`
- [ ] `schedule_campaign_activity`
- [ ] `analyze_campaign_effectiveness`

---

### 3.4 Memory & Analytics (`mcp-memory` + `mcp-analytics`)

**Enhancements to MemoryVault Module:**

#### Memory Features
- [ ] Pattern storage from successful campaigns
- [ ] Failure analysis
- [ ] Best practices library
- [ ] Journalist response patterns
- [ ] Optimal timing analysis

#### Analytics Dashboard
- [ ] Campaign performance metrics
- [ ] Journalist response rates
- [ ] Stakeholder sentiment trends
- [ ] Crisis response time tracking
- [ ] Opportunity conversion rates

#### MCP Integration
**Memory:**
- [ ] `store_pattern`
- [ ] `retrieve_similar`
- [ ] `learn_from_outcome`
- [ ] `identify_trends`
- [ ] `generate_recommendations`
- [ ] `export_learnings`

**Analytics:**
- [ ] `track_metric`
- [ ] `generate_report`
- [ ] `compare_periods`
- [ ] `identify_trends`
- [ ] `calculate_roi`

---

## Implementation Checklist

### Week 1: Crisis Foundation
- [ ] Create crisis database tables (crisis_events, crisis_communications)
- [ ] Port CrisisCommandCenter.tsx from old SignalDesk
- [ ] Port AIAdvisorHelp.tsx components
- [ ] Create niv-crisis-advisor edge function
- [ ] Test crisis plan generation with mcp-crisis

### Week 2: Crisis Core Features
- [ ] Implement crisis plan generator UI
- [ ] Build crisis timeline component
- [ ] Build team & task manager
- [ ] Build communication drafts panel
- [ ] Integrate social sentiment spike → crisis detection
- [ ] Test end-to-end crisis flow

### Week 3: Firecrawl Observer (Dormant Setup)
- [ ] Create observer database tables
- [ ] Create firecrawl-observer-manager edge function
- [ ] Create observer-webhook handler
- [ ] Build ObserverModule UI (with disabled state)
- [ ] Pre-configure target templates
- [ ] Test with ENABLE_OBSERVER=false (should show disabled message)
- [ ] Document activation process for when ready

### Week 4: Stakeholder Intelligence
- [ ] Create stakeholder database tables
- [ ] Build StakeholderModule UI
- [ ] Integrate mcp-stakeholder-groups
- [ ] Implement stakeholder tracking
- [ ] Build relationship mapping

### Week 5: Media Relations
- [ ] Create media database tables
- [ ] Build MediaRelationsModule UI
- [ ] Integrate mcp-media
- [ ] Implement journalist discovery
- [ ] Build pitch tracker

### Week 6: Campaign Management & Analytics
- [ ] Enhance campaigns table
- [ ] Build CampaignManagerModule UI
- [ ] Integrate mcp-campaigns
- [ ] Add analytics to MemoryVault
- [ ] Integrate mcp-memory and mcp-analytics

---

## Environment Variables Needed

```bash
# Existing
ANTHROPIC_API_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# New for Crisis
ENABLE_CRISIS_DETECTION=true  # Default: true

# New for Observer (DEFAULT: FALSE)
ENABLE_OBSERVER=false         # Keep disabled until ready
FIRECRAWL_API_KEY=...        # Add when ready to activate
OBSERVER_WEBHOOK_URL=...     # Generated when deploying observer-webhook
```

---

## Testing Plan

### Crisis Testing
- [ ] Generate crisis plan for test organization
- [ ] Manually activate crisis scenario
- [ ] Test AI crisis advisor responses
- [ ] Test timeline logging
- [ ] Test communication drafts
- [ ] Test crisis resolution workflow

### Observer Testing (When Enabled)
- [ ] Test with own website as target (free/low-cost)
- [ ] Verify webhook receives changes
- [ ] Test AI analysis of changes
- [ ] Test crisis detection from observer alert
- [ ] Test opportunity detection from observer alert

### Integration Testing
- [ ] Social sentiment spike → auto crisis detection
- [ ] Observer alert → crisis activation
- [ ] Crisis → stakeholder notifications
- [ ] Opportunity → campaign creation
- [ ] Campaign → performance analytics

---

## Success Metrics

### Crisis Module Success
- ✅ Crisis plan generated in < 2 minutes
- ✅ Crisis activated from social spike in < 30 seconds
- ✅ AI provides plan-specific guidance within 5 seconds
- ✅ Timeline auto-documented
- ✅ Communication drafts generated for all stakeholder groups

### Observer Success (When Activated)
- ✅ Website changes detected within monitoring interval
- ✅ AI significance analysis < 80% accuracy
- ✅ Crisis-related changes auto-trigger alerts
- ✅ False positive rate < 20%

### Overall Integration Success
- ✅ All MCPs accessible via unified interface
- ✅ Data flows between modules (crisis → stakeholder → media)
- ✅ No duplicate functionality
- ✅ Performance: module load < 2 seconds

---

## Cost Management

### Current Costs
- Social Intelligence: Twitter + Reddit APIs (rate-limited/free tiers)
- Firecrawl: Used for scraping in monitoring

### New Costs (When Activated)
- **Firecrawl Observer**: ~$200-500/month depending on targets
  - Start with 5-10 high-value targets
  - Expand based on ROI
  - Can pause individual monitors

### Cost Controls
- [ ] ENABLE_OBSERVER environment flag (default: false)
- [ ] Per-target pause/resume controls
- [ ] Usage monitoring dashboard
- [ ] Budget alerts

---

## Documentation Needed

### User Documentation
- [ ] Crisis Command Center user guide
- [ ] Crisis plan generation tutorial
- [ ] Crisis AI assistant best practices
- [ ] Observer setup guide (for when activated)

### Developer Documentation
- [ ] Crisis NIV system prompt documentation
- [ ] Observer webhook API reference
- [ ] MCP integration patterns
- [ ] Database schema documentation

---

## Future Enhancements (Post-Phase 3)

### Crisis Enhancements
- [ ] Crisis playbooks library (industry-specific)
- [ ] Crisis simulation/drills
- [ ] Multi-organization crisis coordination
- [ ] Crisis performance benchmarking

### Observer Enhancements
- [ ] Screenshot comparison (visual changes)
- [ ] Competitive intelligence dashboards
- [ ] Narrative shift tracking
- [ ] Predictive crisis detection

### MCP Enhancements
- [ ] Narrative tracking module (`mcp-narratives`)
- [ ] Regulatory compliance module (`mcp-regulatory`)
- [ ] Relationship network visualization (`mcp-relationships`)
- [ ] Advanced entity extraction (`mcp-entities`)

---

## Questions to Resolve

1. **Crisis Plan Storage:** Confirm using `content_library` table with `type='crisis-plan'` is sufficient?
2. **Observer Costs:** What's acceptable monthly spend for Observer when activated? (Current rec: $200-500)
3. **Crisis Activation:** Should social sentiment spike auto-activate crisis (status='active') or just alert (status='monitoring')?
4. **UI Priority:** Port exact UI from old SignalDesk or redesign for V3 aesthetic?
5. **Team Access:** Should crisis module have role-based permissions (crisis lead, team member, observer)?

---

*Roadmap Created: January 2025*
*Total Timeline: 6 weeks*
*Estimated Value: $150k+ annual subscription value*
*Status: Ready to execute Phase 1*
