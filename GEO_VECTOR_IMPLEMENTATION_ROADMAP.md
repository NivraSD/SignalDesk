# GEO-VECTOR Implementation Roadmap

**Date:** November 3, 2025
**Status:** Ready for Implementation
**Timeline:** 6 weeks to MVP

---

## Executive Summary

This roadmap implements GEO-VECTOR as a **new campaign type** (separate from existing VECTOR campaigns) that optimizes content for AI platform visibility. The system intelligently selects 8-12 content types from ExecuteTabProduction's 44 available types based on campaign objective, industry, and user constraints.

**Key Innovation:** Industry-adaptive content selection algorithm that chooses optimal content mix for each specific use case.

---

## Architecture Overview

### New Campaign Type Flow

```
Campaign Builder
  ↓
[Select Campaign Type]
  ├─ Traditional PR
  ├─ VECTOR (existing)
  └─ GEO-VECTOR (new) ← We're building this
       ↓
[GEO-VECTOR Configuration]
  ├─ Objective: drive_sales | thought_leadership | technical_adoption
  ├─ Industry: B2B SaaS | Investment | Developer Tools | etc.
  ├─ Time Available: hours/week
  ├─ Technical Capability: low | medium | high
  └─ Current Presence: G2, YouTube, docs, etc.
       ↓
[niv-geo-content-selector] ← Selects optimal 8-12 content types
       ↓
[niv-geo-vector-orchestrator] ← Generates blueprint
       ↓
[Strategic Planning Module]
  ├─ Automated Tab (SignalDesk generates, user deploys)
  └─ User-Assisted Tab (SignalDesk provides, user executes)
```

### Components to Build

1. **niv-geo-content-selector** ✅ CREATED
   - Selects 8-12 content types based on objective + constraints
   - Returns automated vs user-assisted breakdown
   - Provides expected impact projections

2. **niv-geo-vector-orchestrator** (NEW)
   - Takes selected content types
   - Generates 12-week tactical plan
   - Creates execution timeline

3. **Strategic Planning UI (GEO mode)** (MODIFY)
   - Two-tier tabs (Automated / User-Assisted)
   - Different from 4-pillar VECTOR structure

4. **Schema Deployment Endpoint** (NEW - CRITICAL)
   - Hosted at signaldesk.com/api/schema/{org-id}.js
   - Makes schemas actually visible to AI platforms

5. **Database Tables** ✅ CREATED
   - geo_content_selections (stores selected content types)
   - geo_reddit_opportunities (already exists)

---

## Phase 1: Content Selection System (Week 1)

### 1.1: Deploy Content Selector Edge Function

**File:** `supabase/functions/niv-geo-content-selector/index.ts` ✅ CREATED

**What it does:**
- Takes objective + industry + constraints
- Filters 24 possible content types to optimal 8-12
- Prioritizes by citation_rate ÷ effort
- Returns automated vs user-assisted split

**Input:**
```typescript
{
  objective: "drive_sales",
  industry: "B2B SaaS",
  constraints: {
    time_per_week: 2,
    budget: "medium",
    technical_capability: "medium"
  },
  current_presence: {
    has_g2_profile: true,
    has_blog: true,
    has_youtube: false
  }
}
```

**Output:**
```typescript
{
  automated: [
    { id: "schema-optimization", citation_rate: 75, effort: "low" },
    { id: "case-study", citation_rate: 55, effort: "medium" },
    { id: "blog-post", citation_rate: 40, effort: "low" },
    // ... 5 more
  ],
  user_assisted: [
    { id: "comparison-copy", citation_rate: 65, time_per_week: 1 },
    { id: "doc-outline", citation_rate: 70, time_per_week: 2 }
  ],
  total_count: 10,
  expected_impact: "35-50% visibility increase in 10 weeks",
  time_investment: "3 hours/week",
  recommendations: ["Create YouTube channel to enable video scripts (45% citation)"]
}
```

**Tasks:**
- [x] Create edge function
- [ ] Deploy to Supabase
- [ ] Test with 3 scenarios (sales, thought leadership, technical)
- [ ] Verify citation rate calculations

### 1.2: Create Database Table

**File:** `supabase/migrations/20250103_geo_content_selections.sql` ✅ CREATED

**Tasks:**
- [ ] Run migration
- [ ] Verify RLS policies
- [ ] Test insert/select operations

### 1.3: Integration Testing

**Test Cases:**
1. B2B SaaS driving sales (2 hours/week available)
   - Should return: 8 automated, 2 user-assisted
   - Should NOT include: Stack Overflow (low time), podcasts (low citation)

2. Investment firm building authority (4 hours/week available)
   - Should return: 8 automated, 4 user-assisted
   - Should include: Media outreach, byline articles

3. Developer tools technical adoption (high technical capability)
   - Should return: 7 automated, 3 user-assisted
   - Should include: Stack Overflow, GitHub docs

---

## Phase 2: GEO-VECTOR Blueprint Generator (Week 2)

### 2.1: Create GEO-VECTOR Orchestrator

**File:** `supabase/functions/niv-geo-vector-orchestrator/index.ts` (NEW)

**What it does:**
- Takes selected content types from Phase 1
- Generates 12-week execution timeline
- Creates tactical plan for each content type
- Estimates resources needed

**Input:**
```typescript
{
  organization_profile: { /* ... */ },
  target_queries: ["best CRM for startups", "affordable project management"],
  selected_content_types: {
    automated: [...],
    user_assisted: [...]
  },
  objective: "drive_sales"
}
```

**Output:**
```typescript
{
  strategicFoundation: {
    primaryObjective: "drive_sales",
    targetQueries: [...],
    successMetrics: ["35-50% visibility increase in 10 weeks"]
  },

  threeTierTacticalPlan: {
    automated: [
      {
        type: "schema-optimization",
        timeline: "Week 1",
        what_signaldesk_does: "Generates Product + FAQ schemas",
        user_action: "Deploy script tag to website",
        execution_method: "one_click",
        citation_rate: 75,
        time_to_impact: "2-4 weeks"
      },
      {
        type: "case-study",
        timeline: "Weeks 2-4",
        what_signaldesk_does: "Writes 3 customer success stories",
        user_action: "Publish to website",
        execution_method: "auto_generate",
        citation_rate: 55,
        time_to_impact: "2-4 weeks",
        deliverables: {
          quantity: 3,
          publishing_schedule: "1 per week"
        }
      },
      // ... more automated actions
    ],

    userAssisted: [
      {
        type: "comparison-copy",
        timeline: "Week 2",
        what_signaldesk_does: [
          "Writes optimized G2 profile description",
          "Lists feature highlights",
          "Creates review request templates"
        ],
        user_action: [
          "Copy-paste to G2/Capterra",
          "Send review requests to customers"
        ],
        citation_rate: 65,
        time_to_impact: "2-4 weeks",
        time_estimate: "1 hour/week",
        deliverables: {
          profile_copy: "...",
          feature_list: [...],
          review_request_template: "..."
        }
      },
      // ... more user-assisted actions
    ]
  },

  executionRoadmap: {
    week1: {
      automated: ["Deploy schemas", "Publish first blog post"],
      user_assisted: ["Setup G2 profile"]
    },
    week2: {
      automated: ["Publish case study 1", "Publish blog posts 2-3"],
      user_assisted: ["Send review requests"]
    },
    // ... weeks 3-12
  },

  resourceRequirements: {
    automated_effort: "Minimal (SignalDesk executes)",
    user_assisted_effort: "3 hours/week",
    total_timeline: "12 weeks",
    expected_impact: "35-50% visibility increase"
  }
}
```

**Blueprint Structure:**

```typescript
interface GeoVectorBlueprint {
  type: 'geo_vector'

  strategicFoundation: {
    primaryObjective: string
    targetQueries: string[]
    aiPlatformPriorities: {
      chatgpt: { importance: string, rationale: string }
      claude: { importance: string, rationale: string }
      perplexity: { importance: string, rationale: string }
      gemini: { importance: string, rationale: string }
    }
    successMetrics: string[]
  }

  threeTierTacticalPlan: {
    automated: AutomatedAction[]
    userAssisted: UserAssistedAction[]
  }

  executionRoadmap: {
    [week: string]: {
      automated: string[]
      user_assisted: string[]
    }
  }

  resourceRequirements: {
    automated_effort: string
    user_assisted_effort: string
    total_timeline: string
    expected_impact: string
  }
}

interface AutomatedAction {
  type: string
  timeline: string
  what_signaldesk_does: string
  user_action: string
  execution_method: 'one_click' | 'auto_generate' | 'scheduled'
  citation_rate: number
  time_to_impact: string
  deliverables?: any
}

interface UserAssistedAction {
  type: string
  timeline: string
  what_signaldesk_does: string[]
  user_action: string[]
  citation_rate: number
  time_to_impact: string
  time_estimate: string
  deliverables: any
}
```

**Tasks:**
- [ ] Create edge function
- [ ] Define prompt for Claude
- [ ] Test blueprint generation
- [ ] Validate output structure

---

## Phase 3: Strategic Planning UI Updates (Week 3)

### 3.1: Detect Campaign Type

**File:** `src/components/modules/StrategicPlanningModuleV3Complete.tsx`

**Add detection logic:**
```typescript
const campaignType = blueprint?.type || 'vector'

if (campaignType === 'geo_vector') {
  return <GeoVectorPlanningView blueprint={blueprint} />
} else {
  return <VectorPlanningView blueprint={blueprint} /> // existing
}
```

### 3.2: Create GeoVectorPlanningView Component

**File:** `src/components/modules/GeoVectorPlanningView.tsx` (NEW)

**Structure:**
```typescript
export function GeoVectorPlanningView({ blueprint }: { blueprint: GeoVectorBlueprint }) {
  const [activeTier, setActiveTier] = useState<'automated' | 'user_assisted'>('automated')

  return (
    <div className="geo-vector-planning">
      {/* Header */}
      <div className="header">
        <h2>GEO-VECTOR Campaign: AI Visibility Optimization</h2>
        <div className="metrics">
          <div>Objective: {blueprint.strategicFoundation.primaryObjective}</div>
          <div>Expected Impact: {blueprint.resourceRequirements.expected_impact}</div>
          <div>Timeline: {blueprint.resourceRequirements.total_timeline}</div>
        </div>
      </div>

      {/* Tier Tabs */}
      <div className="tier-tabs">
        <button
          className={activeTier === 'automated' ? 'active' : ''}
          onClick={() => setActiveTier('automated')}
        >
          ⚡ Automated ({blueprint.threeTierTacticalPlan.automated.length})
          <span className="subtitle">SignalDesk Generates & Deploys</span>
        </button>
        <button
          className={activeTier === 'user_assisted' ? 'active' : ''}
          onClick={() => setActiveTier('user_assisted')}
        >
          🤝 User-Assisted ({blueprint.threeTierTacticalPlan.userAssisted.length})
          <span className="subtitle">You Execute with Our Content</span>
        </button>
      </div>

      {/* Content */}
      {activeTier === 'automated' && (
        <AutomatedActionsView actions={blueprint.threeTierTacticalPlan.automated} />
      )}

      {activeTier === 'user_assisted' && (
        <UserAssistedActionsView actions={blueprint.threeTierTacticalPlan.userAssisted} />
      )}

      {/* Execution Timeline */}
      <ExecutionTimeline roadmap={blueprint.executionRoadmap} />
    </div>
  )
}
```

### 3.3: Automated Actions View

**Component:** `AutomatedActionsView.tsx` (NEW)

**Design:**
```typescript
function AutomatedActionCard({ action }: { action: AutomatedAction }) {
  const [status, setStatus] = useState<'pending' | 'executing' | 'complete'>('pending')

  const handleExecute = async () => {
    setStatus('executing')

    if (action.type === 'schema-optimization') {
      await executeSchemaUpdate(action)
    } else if (action.type === 'case-study') {
      await generateCaseStudy(action)
    }
    // ... other types

    setStatus('complete')
  }

  return (
    <div className="automated-action-card">
      <div className="header">
        <h3>{action.type}</h3>
        <div className="citation-badge">{action.citation_rate}% citation</div>
      </div>

      <div className="what-we-do">
        <strong>SignalDesk will:</strong> {action.what_signaldesk_does}
      </div>

      <div className="what-you-do">
        <strong>You will:</strong> {action.user_action}
      </div>

      <div className="timeline">
        Timeline: {action.timeline} → Impact in {action.time_to_impact}
      </div>

      <button
        onClick={handleExecute}
        disabled={status === 'executing'}
        className={`execute-button ${status}`}
      >
        {status === 'pending' && '⚡ Execute Now'}
        {status === 'executing' && '⏳ Generating...'}
        {status === 'complete' && '✅ Complete'}
      </button>

      {status === 'complete' && action.deliverables && (
        <div className="deliverables">
          <ViewDeliverables deliverables={action.deliverables} />
        </div>
      )}
    </div>
  )
}
```

### 3.4: User-Assisted Actions View

**Component:** `UserAssistedActionsView.tsx` (NEW)

**Design:**
```typescript
function UserAssistedActionCard({ action }: { action: UserAssistedAction }) {
  const [contentGenerated, setContentGenerated] = useState(false)

  const handleGenerate = async () => {
    await generateContent(action.type, action.deliverables)
    setContentGenerated(true)
  }

  return (
    <div className="user-assisted-card">
      <div className="header">
        <h3>{action.type}</h3>
        <div className="badges">
          <span className="citation">{action.citation_rate}% citation</span>
          <span className="time">{action.time_estimate}</span>
        </div>
      </div>

      <div className="two-column">
        <div className="signaldesk-provides">
          <h4>SignalDesk Provides:</h4>
          <ul>
            {action.what_signaldesk_does.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="you-execute">
          <h4>You Execute:</h4>
          <ul>
            {action.user_action.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {!contentGenerated ? (
        <button onClick={handleGenerate} className="generate-button">
          📝 Generate Content
        </button>
      ) : (
        <div className="deliverables">
          <h4>Your Content (Ready to Use)</h4>
          <ViewAndCopyContent deliverables={action.deliverables} />
        </div>
      )}
    </div>
  )
}
```

---

## Phase 4: Schema Deployment Solution (Week 4) - CRITICAL

**Problem:** Schemas exist in Memory Vault but aren't deployed to organization websites, making them invisible to AI platforms.

**Solution:** Hosted schema endpoint

### 4.1: Create Schema API Endpoint

**File:** `src/app/api/schema/[org_id]/route.ts` (NEW)

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { org_id: string } }
) {
  const { org_id } = params

  // Fetch latest schema from Memory Vault
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: schema, error } = await supabase
    .from('content_library')
    .select('content')
    .eq('organization_id', org_id)
    .eq('content_type', 'schema')
    .eq('folder', 'Schemas/Active/')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !schema) {
    return NextResponse.json({ error: 'Schema not found' }, { status: 404 })
  }

  // Return as executable JavaScript
  const schemaContent = typeof schema.content === 'string'
    ? JSON.parse(schema.content)
    : schema.content

  const javascript = `
(function() {
  var schema = ${JSON.stringify(schemaContent, null, 2)};
  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
})();
  `.trim()

  return new Response(javascript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
```

### 4.2: Update Intelligence Module

**File:** `src/components/modules/IntelligenceModule.tsx`

**Add deployment instructions:**
```typescript
function SchemaDeploymentInstructions({ orgId }: { orgId: string }) {
  const scriptTag = `<script src="https://signaldesk.com/api/schema/${orgId}.js"></script>`

  return (
    <div className="deployment-instructions">
      <h3>📤 Deploy Your Schema</h3>
      <p>Add this script tag to your website's &lt;head&gt; section:</p>

      <div className="code-block">
        <code>{scriptTag}</code>
        <button onClick={() => navigator.clipboard.writeText(scriptTag)}>
          Copy
        </button>
      </div>

      <div className="benefits">
        <h4>Benefits:</h4>
        <ul>
          <li>✅ Schema automatically updates when you edit in Memory Vault</li>
          <li>✅ No manual copy-paste needed</li>
          <li>✅ Works on any CMS (Webflow, WordPress, custom)</li>
          <li>✅ AI platforms can see your structured data</li>
        </ul>
      </div>

      <div className="verification">
        <button onClick={verifySchemaDeployment}>
          Verify Deployment
        </button>
      </div>
    </div>
  )
}
```

### 4.3: Schema Verification Tool

```typescript
async function verifySchemaDeployment(websiteUrl: string, orgId: string) {
  // Fetch website HTML
  const response = await fetch(websiteUrl)
  const html = await response.text()

  // Check for script tag
  const hasScriptTag = html.includes(`https://signaldesk.com/api/schema/${orgId}.js`)

  if (!hasScriptTag) {
    return {
      deployed: false,
      message: 'Script tag not found. Please add it to your website.'
    }
  }

  // Check for schema in DOM
  const hasSchema = html.includes('application/ld+json')

  return {
    deployed: hasSchema,
    message: hasSchema
      ? '✅ Schema successfully deployed and visible to AI platforms!'
      : '⚠️ Script tag found but schema not rendering. Check console for errors.'
  }
}
```

---

## Phase 5: Campaign Builder Integration (Week 5)

### 5.1: Add GEO-VECTOR Option

**File:** `src/components/campaigns/CampaignBuilder.tsx`

**Update campaign type selection:**
```typescript
<div className="campaign-type-selection">
  <h2>Select Campaign Type</h2>

  <div className="campaign-types">
    <CampaignTypeCard
      id="traditional_pr"
      title="Traditional PR Campaign"
      description="Press releases, media outreach, crisis response"
      icon={<Megaphone />}
    />

    <CampaignTypeCard
      id="vector"
      title="VECTOR Campaign"
      description="Four-pillar influence: Owned, Relationships, Events, Media"
      icon={<Target />}
    />

    <CampaignTypeCard
      id="geo_vector"
      title="GEO-VECTOR Campaign"
      description="AI visibility optimization across ChatGPT, Claude, Perplexity, Gemini"
      icon={<Brain />}
      badge="NEW"
    />
  </div>
</div>
```

### 5.2: GEO-VECTOR Configuration Step

**File:** `src/components/campaigns/GeoVectorConfiguration.tsx` (NEW)

```typescript
export function GeoVectorConfiguration({ onContinue }: { onContinue: (config: any) => void }) {
  const [objective, setObjective] = useState<'drive_sales' | 'thought_leadership' | 'technical_adoption'>('drive_sales')
  const [timeAvailable, setTimeAvailable] = useState(2)
  const [technicalCapability, setTechnicalCapability] = useState<'low' | 'medium' | 'high'>('medium')
  const [currentPresence, setCurrentPresence] = useState({
    has_g2_profile: false,
    has_technical_docs: false,
    has_blog: false,
    has_youtube: false
  })

  return (
    <div className="geo-vector-config">
      <h2>Configure Your GEO-VECTOR Campaign</h2>

      {/* Objective Selection */}
      <div className="objective-selection">
        <h3>Primary Objective</h3>
        <div className="objectives">
          <ObjectiveCard
            id="drive_sales"
            title="Drive Product Sales"
            description="Get cited when AI recommends products in your category"
            citation_examples={["best CRM for startups", "top project management tools"]}
            selected={objective === 'drive_sales'}
            onClick={() => setObjective('drive_sales')}
          />

          <ObjectiveCard
            id="thought_leadership"
            title="Thought Leadership"
            description="Get cited as industry expert and authority"
            citation_examples={["future of fintech", "renewable energy experts"]}
            selected={objective === 'thought_leadership'}
            onClick={() => setObjective('thought_leadership')}
          />

          <ObjectiveCard
            id="technical_adoption"
            title="Technical Adoption"
            description="Get cited for technical solutions and how-tos"
            citation_examples={["how to implement OAuth", "best API monitoring"]}
            selected={objective === 'technical_adoption'}
            onClick={() => setObjective('technical_adoption')}
          />
        </div>
      </div>

      {/* Time Constraint */}
      <div className="time-constraint">
        <h3>Time Available for User-Assisted Content</h3>
        <input
          type="range"
          min="0"
          max="5"
          value={timeAvailable}
          onChange={(e) => setTimeAvailable(Number(e.target.value))}
        />
        <div className="time-label">{timeAvailable} hours/week</div>
        <p className="help-text">
          More time = more user-assisted content (higher citation rates)
        </p>
      </div>

      {/* Technical Capability */}
      <div className="technical-capability">
        <h3>Technical Capability</h3>
        <select value={technicalCapability} onChange={(e) => setTechnicalCapability(e.target.value as any)}>
          <option value="low">Low (Marketing team)</option>
          <option value="medium">Medium (Product team)</option>
          <option value="high">High (Engineering team)</option>
        </select>
      </div>

      {/* Current Presence */}
      <div className="current-presence">
        <h3>Current Online Presence</h3>
        <label>
          <input
            type="checkbox"
            checked={currentPresence.has_g2_profile}
            onChange={(e) => setCurrentPresence({ ...currentPresence, has_g2_profile: e.target.checked })}
          />
          G2/Capterra Profile
        </label>
        <label>
          <input
            type="checkbox"
            checked={currentPresence.has_technical_docs}
            onChange={(e) => setCurrentPresence({ ...currentPresence, has_technical_docs: e.target.checked })}
          />
          Technical Documentation
        </label>
        <label>
          <input
            type="checkbox"
            checked={currentPresence.has_blog}
            onChange={(e) => setCurrentPresence({ ...currentPresence, has_blog: e.target.checked })}
          />
          Company Blog
        </label>
        <label>
          <input
            type="checkbox"
            checked={currentPresence.has_youtube}
            onChange={(e) => setCurrentPresence({ ...currentPresence, has_youtube: e.target.checked })}
          />
          YouTube Channel
        </label>
      </div>

      <button
        onClick={() => onContinue({
          objective,
          constraints: {
            time_per_week: timeAvailable,
            budget: 'medium',
            technical_capability: technicalCapability
          },
          current_presence: currentPresence
        })}
        className="continue-button"
      >
        Continue to Content Selection →
      </button>
    </div>
  )
}
```

### 5.3: Content Selection Preview

**File:** `src/components/campaigns/ContentSelectionPreview.tsx` (NEW)

```typescript
export function ContentSelectionPreview({ config }: { config: GeoVectorConfig }) {
  const [selection, setSelection] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function selectContent() {
      const response = await fetch('/api/geo/select-content', {
        method: 'POST',
        body: JSON.stringify(config)
      })
      const data = await response.json()
      setSelection(data)
      setLoading(false)
    }
    selectContent()
  }, [config])

  if (loading) return <div>Selecting optimal content types...</div>

  return (
    <div className="content-selection-preview">
      <h2>Your Optimized Content Mix</h2>

      <div className="summary-metrics">
        <div className="metric">
          <div className="value">{selection.total_count}</div>
          <div className="label">Content Types</div>
        </div>
        <div className="metric">
          <div className="value">{selection.automated.length}</div>
          <div className="label">Automated</div>
        </div>
        <div className="metric">
          <div className="value">{selection.user_assisted.length}</div>
          <div className="label">User-Assisted</div>
        </div>
      </div>

      <div className="expected-impact">
        <h3>Expected Impact</h3>
        <p>{selection.expected_impact}</p>
        <p className="time">Your time investment: {selection.time_investment}</p>
      </div>

      <div className="content-types">
        <div className="automated">
          <h3>⚡ Automated (SignalDesk Generates)</h3>
          {selection.automated.map(ct => (
            <ContentTypePreviewCard key={ct.id} contentType={ct} />
          ))}
        </div>

        <div className="user-assisted">
          <h3>🤝 User-Assisted (You Execute)</h3>
          {selection.user_assisted.map(ct => (
            <ContentTypePreviewCard key={ct.id} contentType={ct} />
          ))}
        </div>
      </div>

      {selection.recommendations.length > 0 && (
        <div className="recommendations">
          <h3>💡 Recommendations</h3>
          <ul>
            {selection.recommendations.map(rec => (
              <li key={rec}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={handleContinue} className="continue-button">
        Looks Good! Generate Blueprint →
      </button>
    </div>
  )
}
```

---

## Phase 6: Testing & Polish (Week 6)

### 6.1: End-to-End Testing

**Test Scenarios:**

1. **B2B SaaS Driving Sales**
   - Objective: drive_sales
   - Time: 2 hours/week
   - Has: G2 profile, blog
   - Expected: 8 automated + 2 user-assisted (G2 copy, doc outlines)

2. **Investment Firm Thought Leadership**
   - Objective: thought_leadership
   - Time: 4 hours/week
   - Has: Blog
   - Expected: 8 automated + 4 user-assisted (media, byline, quora)

3. **Developer Tools Technical Adoption**
   - Objective: technical_adoption
   - Time: 1 hour/week
   - Has: GitHub, docs
   - Technical: high
   - Expected: 7 automated + 3 user-assisted (Stack Overflow, GitHub)

**Test Flow:**
1. Create new campaign → Select GEO-VECTOR
2. Configure objective + constraints
3. Verify content selection matches expected
4. Generate blueprint
5. Verify blueprint structure
6. Execute automated action (schema)
7. Generate user-assisted content (G2 copy)
8. Verify deliverables

### 6.2: Performance Optimization

**Targets:**
- Content selection: < 2 seconds
- Blueprint generation: < 30 seconds
- Schema deployment verification: < 5 seconds

### 6.3: Documentation

**Create:**
1. User guide: "Creating a GEO-VECTOR Campaign"
2. Developer docs: "Adding New Content Types"
3. API reference: "GEO-VECTOR Edge Functions"

---

## Success Metrics

### System Performance
- ✅ Content selection completes in < 2 seconds
- ✅ Blueprint generation completes in < 30 seconds
- ✅ 100% of selected content types executable

### User Experience
- ✅ User can create GEO-VECTOR campaign in < 5 minutes
- ✅ Clear differentiation between automated vs user-assisted
- ✅ Schema deployment instructions clear and working

### Business Impact
- ✅ 30-50% AI visibility increase in 8-12 weeks (measurable via GEO Intelligence Monitor)
- ✅ Content types align with actual SignalDesk capabilities
- ✅ Realistic time/effort estimates for users

---

## Risk Mitigation

### Technical Risks

**Risk:** Schema endpoint creates CORS issues
**Mitigation:** Add `Access-Control-Allow-Origin: *` header, test with multiple domains

**Risk:** Content selector picks too many high-effort items
**Mitigation:** Enforce 70/30 automated/user-assisted ratio, cap user-assisted at 4 items

**Risk:** Blueprint generation takes > 30 seconds
**Mitigation:** Cache organization profile, use parallel Claude calls

### Product Risks

**Risk:** Users don't deploy schemas
**Mitigation:** Show deployment verification status, send email reminders

**Risk:** User-assisted content never executed
**Mitigation:** Send weekly digest with ready-to-use content, track completion rates

**Risk:** Expected impact not achieved
**Mitigation:** Set conservative estimates (35-50% vs 50-80%), provide monthly progress reports

---

## Dependencies

### External Services
- ✅ Supabase (database, edge functions)
- ✅ Anthropic Claude (blueprint generation)
- ✅ ExecuteTabProduction (content generation)

### Internal Components
- ✅ Memory Vault (schema storage)
- ✅ GEO Intelligence Monitor (visibility tracking)
- ✅ Campaign Builder (campaign creation)
- ✅ Strategic Planning Module (execution)

---

## Next Steps After MVP

### Phase 7: Advanced Features (Post-MVP)
1. Reddit monitoring integration
2. YouTube video generation (scripts → actual videos via Veo)
3. Podcast pitch automation
4. Industry-specific templates
5. Competitive GEO analysis

### Phase 8: AI Platform Integrations (Future)
1. Direct ChatGPT plugin submission
2. Perplexity source verification
3. Claude data partnerships
4. Gemini structured data integration

---

## Summary

This implementation creates a complete GEO-VECTOR campaign system that:

✅ **Intelligently selects** 8-12 content types based on objective + constraints
✅ **Generates realistic blueprints** with automated + user-assisted tiers
✅ **Provides clear execution path** for each content type
✅ **Solves schema deployment** with hosted endpoint
✅ **Tracks AI visibility** improvements via GEO Intelligence Monitor

**Timeline:** 6 weeks to MVP
**Effort:** 1 developer full-time
**Impact:** 30-50% AI visibility increase for customers in 8-12 weeks

---

*Implementation Roadmap Complete: November 3, 2025*
*Ready to begin Phase 1: Content Selection System*
