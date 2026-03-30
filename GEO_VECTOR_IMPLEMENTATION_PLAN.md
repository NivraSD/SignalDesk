# GEO-VECTOR Campaign Implementation Plan
**Created:** October 29, 2025
**Purpose:** Implementation roadmap for integrating GEO (Generative Experience Optimization) into VECTOR campaigns

---

## Executive Summary

GEO-VECTOR campaigns optimize for **AI visibility across all input sources** (Reddit, YouTube, news, schemas, docs, etc.) rather than just traditional PR. This requires:

1. **Enhanced Research** - Identify which AI sources matter for target queries
2. **Expanded Blueprint** - Include schema strategy + multi-platform tactics
3. **Three-Tier Execution** - Automated (schemas/PR) + Assisted (Reddit/video) + Guided (podcasts/forums)
4. **Integrated Monitoring** - Track AI citations alongside traditional metrics

---

## Phase 1: Research Enhancement (Weeks 1-2)

### 1.1 Add GEO Source Analysis to Campaign Research

**Goal:** Identify which platforms AI models check for target queries

**New Edge Function:** `niv-geo-source-analyzer`

```typescript
// supabase/functions/niv-geo-source-analyzer/index.ts

interface GEOSourceAnalysis {
  target_queries: string[]

  source_importance: {
    reddit: {
      importance: 'critical' | 'high' | 'medium' | 'low'
      relevant_communities: string[]
      current_presence: 'strong' | 'moderate' | 'weak' | 'none'
      opportunity_score: number // 0-100
      reasoning: string
    }
    youtube: { /* similar structure */ }
    news_media: { /* similar structure */ }
    documentation: { /* similar structure */ }
    schemas: { /* similar structure */ }
    forums: { /* similar structure */ }
    podcasts: { /* similar structure */ }
    reviews: { /* similar structure */ }
  }

  competitive_analysis: {
    source: string
    competitors_present: string[]
    our_presence: string
    gap_severity: 'critical' | 'high' | 'medium' | 'low'
  }[]

  recommendations: {
    priority_sources: string[] // Top 3-4 sources to target
    quick_wins: string[] // Easy opportunities
    long_term: string[] // Strategic initiatives
  }
}
```

**How it works:**
1. Query AI platforms (ChatGPT, Claude, Perplexity) with target queries
2. Analyze response sources (which URLs/platforms AI cited)
3. Compare against competitor presence
4. Score opportunity by importance + gap size

**Integration Point:**
- Called during `niv-campaign-builder-orchestrator` research phase
- Results stored in campaign session: `geo_source_analysis`
- Displayed in research review step before positioning

### 1.2 Update Campaign Builder UI

**File:** `src/components/campaign-builder/CampaignBuilderWizard.tsx`

**Changes:**
1. Add GEO analysis to research results display
2. Show source importance matrix:
   ```
   AI Source Impact Analysis:

   🔴 CRITICAL (Immediate action needed)
   ├─ Reddit (65% of AI responses cite)
   │  └─ Gap: Not present in r/investing, r/energy
   └─ YouTube (55% of AI responses cite)
      └─ Gap: No educational content

   🟡 HIGH (Important but manageable)
   ├─ Documentation (40% cite)
   │  └─ Gap: Content exists but not optimized
   └─ Schemas (35% cite)
      └─ Gap: Missing FAQ schema

   🟢 MEDIUM (Nice to have)
   └─ Podcasts (15% cite)
      └─ Gap: No podcast presence
   ```

---

## Phase 2: Blueprint Enhancement (Weeks 2-3)

### 2.1 Add Schema Strategy Section to Blueprint

**File:** `supabase/functions/niv-campaign-blueprint-base/index.ts`

**New Blueprint Section:**

```typescript
"schemaStrategy": {
  "target_queries": [
    "best CRM software",
    "CRM for small business",
    "alternatives to Salesforce"
  ],

  "platform_priorities": {
    "chatgpt": {
      "importance": "critical",
      "rationale": "60% of SaaS searches start here",
      "optimization_focus": ["aggregateRating", "review", "offers"]
    },
    "claude": {
      "importance": "high",
      "rationale": "Developer-heavy audience",
      "optimization_focus": ["featureList", "technicalDetails", "documentation"]
    },
    "perplexity": {
      "importance": "medium",
      "rationale": "Citation-focused, emphasizes credibility",
      "optimization_focus": ["sameAs", "review", "awards"]
    }
  },

  "schema_roadmap": {
    "immediate": [
      {
        "type": "Product",
        "priority": "critical",
        "changes": {
          "add_fields": ["aggregateRating", "review", "offers"],
          "enhance_fields": ["description", "featureList"],
          "reasoning": "Missing rating/review schema - competitors all have this"
        }
      },
      {
        "type": "FAQPage",
        "priority": "high",
        "changes": {
          "create_new": true,
          "questions": [
            "What makes your CRM different?",
            "How much does it cost?",
            "What integrations do you support?"
          ],
          "reasoning": "FAQ schema appears in 40% of 'best CRM' responses"
        }
      }
    ],

    "ongoing": [
      {
        "type": "Organization",
        "priority": "medium",
        "changes": {
          "enhance_fields": ["knowsAbout", "awards", "sameAs"],
          "reasoning": "Strengthen brand authority signals"
        }
      }
    ]
  },

  "competitive_schema_analysis": {
    "competitor": "Competitor X",
    "their_schemas": ["Product", "FAQPage", "Review", "Offer"],
    "our_schemas": ["Product", "Organization"],
    "gaps": ["FAQPage", "Review schema"],
    "opportunities": "Add customer testimonials as Review schema"
  }
}
```

### 2.2 Add Multi-Platform Content Strategy

**File:** `supabase/functions/niv-campaign-blueprint-base/index.ts`

**New Section:**

```typescript
"geoContentStrategy": {
  "content_pillars": {
    "automated": [
      {
        "type": "schema_update",
        "target": "Product schema",
        "changes": "Add aggregateRating and review fields",
        "timeline": "Week 1",
        "owner": "SignalDesk (automated)"
      },
      {
        "type": "faq_schema",
        "target": "New FAQPage schema",
        "content": "15 common questions about product/category",
        "timeline": "Week 1",
        "owner": "SignalDesk (automated)"
      },
      {
        "type": "press_release",
        "topic": "New feature announcement",
        "timeline": "Week 2",
        "owner": "SignalDesk (automated)"
      }
    ],

    "user_assisted": [
      {
        "type": "reddit_thread",
        "platform": "reddit",
        "action": "Post AMA in r/investing",
        "priority": "high",
        "timeline": "Week 1",
        "deliverables": [
          "Thread content (SignalDesk provides)",
          "Response framework (SignalDesk provides)",
          "Moderation guidelines (SignalDesk provides)"
        ],
        "time_estimate": "2 hours initial post + 30 min/week maintenance",
        "success_metrics": [
          "100+ upvotes",
          "50+ authentic questions",
          "Cited in AI responses within 30 days"
        ],
        "why": "Reddit cited in 65% of investment-related AI responses"
      },
      {
        "type": "youtube_video",
        "platform": "youtube",
        "action": "Produce 'Hydrogen Investment Guide 2025'",
        "priority": "high",
        "timeline": "Weeks 2-3",
        "deliverables": [
          "Video script (SignalDesk provides)",
          "Talking points (SignalDesk provides)",
          "Thumbnail recommendations (SignalDesk provides)",
          "SEO optimization (SignalDesk provides)"
        ],
        "time_estimate": "1 day production",
        "success_metrics": [
          "1,000+ views in first month",
          "Embedded in AI responses to 'hydrogen investment'"
        ],
        "why": "YouTube is primary source for educational AI responses"
      },
      {
        "type": "reddit_monitoring",
        "platform": "reddit",
        "action": "Monitor and engage in relevant discussions",
        "priority": "medium",
        "timeline": "Ongoing (Weeks 1-12)",
        "deliverables": [
          "Weekly opportunity digest (SignalDesk automated)",
          "Suggested responses (SignalDesk AI-generated)",
          "Engagement guidelines (SignalDesk provides)"
        ],
        "time_estimate": "30-60 min/week",
        "success_metrics": [
          "Engage in 2-3 threads per week",
          "Build positive community reputation",
          "Generate backlinks to content"
        ],
        "why": "Reactive engagement builds authentic presence"
      },
      {
        "type": "documentation",
        "platform": "website",
        "action": "Publish comprehensive product documentation",
        "priority": "high",
        "timeline": "Week 2",
        "deliverables": [
          "Content outlines (SignalDesk provides)",
          "Technical details (user provides)",
          "SEO optimization (SignalDesk provides)"
        ],
        "time_estimate": "4-8 hours",
        "success_metrics": [
          "Indexed by AI platforms",
          "Cited in technical queries"
        ],
        "why": "Documentation cited in 40% of technical AI responses"
      }
    ],

    "strategic_guidance": {
      "podcasts": {
        "priority": "medium",
        "rationale": "Podcast transcripts indexed by AI but require 3-6 month lead time",
        "target_shows": [
          "Invest Like the Best (institutional focus)",
          "The Energy Gang (industry expertise)",
          "All-In Podcast (tech/investing crossover)"
        ],
        "approach": "Position as hydrogen market expert with Japanese perspective",
        "talking_points": [/* provided in blueprint */],
        "pitch_template": "/* provided in blueprint */",
        "timeline": "3-6 months for booking"
      },

      "forums": {
        "priority": "low",
        "rationale": "Forums have declining AI influence but build domain authority",
        "targets": [
          "HackerNews (Show HN, energy discussions)",
          "StackOverflow (energy tag)",
          "Bogleheads (investing forum)"
        ],
        "approach": "Technical, data-driven contributions",
        "guidelines": [/* provided in blueprint */]
      },

      "academic_partnerships": {
        "priority": "low",
        "rationale": "Academic citations add credibility to AI responses",
        "opportunities": [
          "Sponsor research study on hydrogen economics",
          "Co-author whitepaper with university",
          "Present at academic conference"
        ],
        "approach": "Long-term credibility building",
        "timeline": "6-12 months"
      }
    }
  }
}
```

### 2.3 Enhance Orchestrator Blueprint Generation

**File:** `supabase/functions/niv-campaign-blueprint-orchestrator/index.ts`

**Changes:**
1. After generating blueprint base, call `niv-geo-source-analyzer`
2. Merge GEO analysis into blueprint
3. Generate schema recommendations based on gaps

```typescript
// After blueprint base generation
const geoAnalysis = await callFunction('niv-geo-source-analyzer', {
  target_queries: payload.selectedPositioning.targetQueries,
  organization: payload.organizationContext,
  industry: payload.organizationContext.industry
})

blueprintBase.schemaStrategy = geoAnalysis.schema_strategy
blueprintBase.geoContentStrategy = geoAnalysis.content_strategy
```

---

## Phase 3: Strategic Planning Integration (Weeks 3-4)

### 3.1 Schema Recommendation System

**Goal:** Surface schema update recommendations in Strategic Planning execution

**New Table:**

```sql
CREATE TABLE geo_schema_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES campaign_builder_sessions(id),
  organization_id TEXT NOT NULL,

  -- What schema to update
  schema_type VARCHAR(100) NOT NULL, -- 'Product', 'Organization', 'FAQPage'
  action_type VARCHAR(50) NOT NULL, -- 'add_field', 'update_field', 'create_schema'

  -- The recommendation
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  changes JSONB NOT NULL,
  reasoning TEXT NOT NULL,
  expected_impact TEXT,

  -- Execution
  priority VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'dismissed'
  auto_executable BOOLEAN DEFAULT false,

  -- Attribution
  campaign_id TEXT,
  source VARCHAR(50), -- 'blueprint', 'monitoring', 'competitive_analysis'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_geo_recommendations_session ON geo_schema_recommendations(session_id);
CREATE INDEX idx_geo_recommendations_status ON geo_schema_recommendations(status);
```

### 3.2 Generate Schema Recommendations from Blueprint

**New Edge Function:** `niv-geo-schema-recommendations-generator`

```typescript
// supabase/functions/niv-geo-schema-recommendations-generator/index.ts

// Called after blueprint is finalized
async function generateSchemaRecommendations(sessionId: string) {
  const session = await getSession(sessionId)
  const blueprint = session.blueprint

  // Extract schema recommendations from blueprint
  const recommendations = []

  // From schemaStrategy.schema_roadmap.immediate
  for (const schemaRec of blueprint.schemaStrategy.schema_roadmap.immediate) {
    recommendations.push({
      session_id: sessionId,
      organization_id: session.organization_id,
      schema_type: schemaRec.type,
      action_type: schemaRec.changes.add_fields ? 'add_field' : 'create_schema',
      title: `${schemaRec.type}: ${schemaRec.priority} priority update`,
      description: schemaRec.changes.reasoning,
      changes: schemaRec.changes,
      reasoning: schemaRec.changes.reasoning,
      expected_impact: `Improve AI visibility for target queries`,
      priority: schemaRec.priority,
      auto_executable: schemaRec.type === 'FAQPage', // FAQ creation is safe
      source: 'blueprint',
      campaign_id: sessionId
    })
  }

  // Insert into database
  await insertSchemaRecommendations(recommendations)

  return recommendations
}
```

### 3.3 Update Strategic Planning Module

**File:** `src/components/modules/StrategicPlanningModuleV3Complete.tsx`

**Changes:**

1. **Add new tab: "Schema Updates"**

```typescript
const [viewMode, setViewMode] = useState<ViewMode>('execution' | 'blueprint' | 'progress' | 'schemas')
```

2. **Load schema recommendations**

```typescript
useEffect(() => {
  async function loadSchemaRecommendations() {
    const { data } = await supabase
      .from('geo_schema_recommendations')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'pending')
      .order('priority', { ascending: false })

    setSchemaRecommendations(data || [])
  }

  loadSchemaRecommendations()
}, [sessionId])
```

3. **Render schema recommendations**

```typescript
{viewMode === 'schemas' && (
  <div className="schema-recommendations">
    <h2>Schema Updates Recommended</h2>
    <p className="text-gray-400 mb-6">
      These schema updates will improve your visibility in AI responses.
    </p>

    {schemaRecommendations.map(rec => (
      <SchemaRecommendationCard
        key={rec.id}
        recommendation={rec}
        onExecute={handleSchemaUpdate}
        onDismiss={dismissRecommendation}
      />
    ))}
  </div>
)}
```

4. **Schema Recommendation Card Component**

```typescript
function SchemaRecommendationCard({ recommendation, onExecute, onDismiss }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge priority={recommendation.priority} />
            <span className="text-sm text-gray-400">{recommendation.schema_type}</span>
          </div>
          <h3 className="text-lg font-semibold text-white">
            {recommendation.title}
          </h3>
        </div>
        {recommendation.auto_executable && (
          <Badge variant="success">Auto-executable</Badge>
        )}
      </div>

      <p className="text-gray-300 mb-4">{recommendation.description}</p>

      <div className="bg-zinc-800 rounded p-4 mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Changes:</h4>
        <SchemaChangesPreview changes={recommendation.changes} />
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Lightbulb className="w-4 h-4" />
        <span>{recommendation.expected_impact}</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onExecute(recommendation)}
          className="btn-primary flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          {recommendation.auto_executable ? 'Apply Changes' : 'Open Editor'}
        </button>
        <button
          onClick={() => onDismiss(recommendation.id)}
          className="btn-secondary"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
```

### 3.4 Integrate Schema Editor

**Goal:** When user clicks "Open Editor" on schema recommendation, open schema editor with pre-populated changes

**Changes:**

1. **Add schema editor modal state**

```typescript
const [schemaEditorOpen, setSchemaEditorOpen] = useState(false)
const [editingSchema, setEditingSchema] = useState<any>(null)
const [suggestedChanges, setSuggestedChanges] = useState<any>(null)
```

2. **Handle schema update**

```typescript
async function handleSchemaUpdate(recommendation: SchemaRecommendation) {
  if (recommendation.auto_executable) {
    // Auto-apply changes
    await applySchemaChanges(recommendation)
    toast.success('Schema updated successfully')

    // Mark recommendation as completed
    await updateRecommendation(recommendation.id, { status: 'completed' })

  } else {
    // Open editor with suggested changes
    const currentSchema = await fetchSchema(
      recommendation.organization_id,
      recommendation.schema_type
    )

    setEditingSchema(currentSchema)
    setSuggestedChanges(recommendation.changes)
    setSchemaEditorOpen(true)
  }
}
```

3. **Render schema editor modal**

```typescript
{schemaEditorOpen && (
  <SchemaEditorModal
    schema={editingSchema}
    suggestedChanges={suggestedChanges}
    onSave={handleSchemaSave}
    onClose={() => setSchemaEditorOpen(false)}
  />
)}
```

4. **Reuse existing schema editor**

**File:** `src/components/geo/SchemaEditor.tsx` (existing)

**Changes:** Add `suggestedChanges` prop to highlight recommended changes

```typescript
interface SchemaEditorProps {
  schema: Schema
  suggestedChanges?: any // NEW
  onSave: (schema: Schema) => void
  onClose: () => void
}

function SchemaEditor({ schema, suggestedChanges, onSave, onClose }) {
  // Highlight suggested fields in editor
  // Show diff view if suggestedChanges provided
  // User can accept/reject/modify suggestions
}
```

---

## Phase 4: Execution Features (Weeks 4-5)

### 4.1 Reddit Monitoring System

**New Edge Function:** `geo-reddit-monitor`

```typescript
// supabase/functions/geo-reddit-monitor/index.ts

interface RedditMonitorConfig {
  session_id: string
  keywords: string[]
  subreddits: string[]
  engagement_criteria: string
  max_opportunities: number
}

async function scanRedditOpportunities(config: RedditMonitorConfig) {
  // Search Reddit API
  const threads = await searchReddit({
    keywords: config.keywords,
    subreddits: config.subreddits,
    timeframe: 'week',
    min_upvotes: 5
  })

  // AI evaluates each thread
  const opportunities = []
  for (const thread of threads) {
    const analysis = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      messages: [{
        role: 'user',
        content: `Thread: "${thread.title}"

Post: ${thread.body}

Top 3 comments:
${thread.top_comments.slice(0, 3).map(c => `- ${c.body}`).join('\n')}

Our engagement criteria: ${config.engagement_criteria}

Should we engage? If yes:
1. Why is this relevant?
2. What value can we add?
3. What should we say?
4. Tone: Educational, not promotional

Respond in JSON:
{
  "should_engage": true/false,
  "relevance_score": 0-100,
  "reasoning": "...",
  "suggested_comment": "...",
  "talking_points": ["...", "..."],
  "warnings": ["Avoid mentioning price", "Don't be overly promotional"]
}`
      }]
    })

    const result = JSON.parse(analysis.content[0].text)

    if (result.should_engage && result.relevance_score > 70) {
      opportunities.push({
        thread_id: thread.id,
        thread_url: thread.url,
        thread_title: thread.title,
        subreddit: thread.subreddit,
        relevance_score: result.relevance_score,
        reasoning: result.reasoning,
        suggested_comment: result.suggested_comment,
        talking_points: result.talking_points,
        warnings: result.warnings,
        detected_at: new Date()
      })
    }
  }

  // Store opportunities
  await storeRedditOpportunities(config.session_id, opportunities)

  return opportunities
}
```

**New Table:**

```sql
CREATE TABLE geo_reddit_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,

  -- Thread details
  thread_id TEXT NOT NULL,
  thread_url TEXT NOT NULL,
  thread_title TEXT NOT NULL,
  subreddit TEXT NOT NULL,

  -- AI analysis
  relevance_score INTEGER,
  reasoning TEXT,
  suggested_comment TEXT,
  talking_points JSONB,
  warnings JSONB,

  -- Execution
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'posted', 'dismissed'
  user_comment TEXT, -- User's actual comment (may differ from suggestion)
  posted_at TIMESTAMPTZ,

  detected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reddit_opportunities_session ON geo_reddit_opportunities(session_id);
CREATE INDEX idx_reddit_opportunities_status ON geo_reddit_opportunities(status);
```

### 4.2 Reddit Opportunities UI

**File:** `src/components/modules/StrategicPlanningModuleV3Complete.tsx`

**Add Reddit monitoring tab:**

```typescript
{viewMode === 'reddit' && (
  <div className="reddit-opportunities">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2>Reddit Engagement Opportunities</h2>
        <p className="text-gray-400">
          AI-identified threads where you can add value
        </p>
      </div>
      <button
        onClick={refreshOpportunities}
        className="btn-secondary"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Scan for New Threads
      </button>
    </div>

    {redditOpportunities.map(opp => (
      <RedditOpportunityCard
        key={opp.id}
        opportunity={opp}
        onApprove={handleApproveComment}
        onEdit={handleEditComment}
        onDismiss={dismissOpportunity}
      />
    ))}
  </div>
)}
```

**Reddit Opportunity Card:**

```typescript
function RedditOpportunityCard({ opportunity, onApprove, onEdit, onDismiss }) {
  const [editedComment, setEditedComment] = useState(opportunity.suggested_comment)
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge score={opportunity.relevance_score} />
            <span className="text-sm text-gray-400">r/{opportunity.subreddit}</span>
          </div>
          <a
            href={opportunity.thread_url}
            target="_blank"
            className="text-lg font-semibold text-blue-400 hover:text-blue-300"
          >
            {opportunity.thread_title}
          </a>
        </div>
      </div>

      <div className="bg-zinc-800 rounded p-4 mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Why engage:</h4>
        <p className="text-gray-400 text-sm">{opportunity.reasoning}</p>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-300">Suggested comment:</h4>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            {isEditing ? 'Preview' : 'Edit'}
          </button>
        </div>

        {isEditing ? (
          <textarea
            value={editedComment}
            onChange={(e) => setEditedComment(e.target.value)}
            className="w-full h-32 bg-zinc-800 text-white rounded p-3"
          />
        ) : (
          <div className="bg-zinc-800 rounded p-4 text-gray-300 text-sm whitespace-pre-wrap">
            {editedComment}
          </div>
        )}
      </div>

      {opportunity.warnings && opportunity.warnings.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300 mb-1">Guidelines:</p>
              <ul className="text-sm text-amber-200/80 space-y-1">
                {opportunity.warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => onApprove(opportunity.id, editedComment)}
          className="btn-primary"
        >
          Copy Comment & Open Thread
        </button>
        <button
          onClick={() => onDismiss(opportunity.id)}
          className="btn-secondary"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
```

### 4.3 Handle Comment Approval

```typescript
async function handleApproveComment(opportunityId: string, comment: string) {
  const opportunity = redditOpportunities.find(o => o.id === opportunityId)

  // Copy comment to clipboard
  await navigator.clipboard.writeText(comment)
  toast.success('Comment copied to clipboard!')

  // Open thread in new tab
  window.open(opportunity.thread_url, '_blank')

  // Mark as approved (user will post manually)
  await supabase
    .from('geo_reddit_opportunities')
    .update({
      status: 'approved',
      user_comment: comment
    })
    .eq('id', opportunityId)

  // Remove from pending list
  setRedditOpportunities(prev => prev.filter(o => o.id !== opportunityId))
}
```

---

## Phase 5: Content Generation Integration (Week 5)

### 5.1 Generate User Action Content

**Goal:** When blueprint includes user actions (Reddit AMA, YouTube script), generate the content

**New Edge Function:** `niv-geo-content-generator`

```typescript
// supabase/functions/niv-geo-content-generator/index.ts

interface ContentGenerationRequest {
  content_type: 'reddit_ama' | 'youtube_script' | 'reddit_comment' | 'documentation'
  blueprint: any
  context: {
    organization: string
    campaign_goal: string
    key_messages: string[]
    target_audience: string
  }
}

async function generateContent(req: ContentGenerationRequest) {
  const prompts = {
    reddit_ama: `Generate Reddit AMA content for r/investing...`,
    youtube_script: `Generate YouTube video script...`,
    reddit_comment: `Generate Reddit comment...`,
    documentation: `Generate documentation outline...`
  }

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    messages: [{
      role: 'user',
      content: prompts[req.content_type]
    }]
  })

  return response.content[0].text
}
```

### 5.2 Display Generated Content in Strategic Planning

**Add content generation section:**

```typescript
{viewMode === 'content' && (
  <div className="user-action-content">
    <h2>User Action Content</h2>
    <p className="text-gray-400 mb-6">
      SignalDesk has prepared content for your user actions
    </p>

    {userActionContent.map(content => (
      <UserActionContentCard
        key={content.id}
        content={content}
        onCopy={copyToClipboard}
        onEdit={openEditor}
      />
    ))}
  </div>
)}
```

---

## Phase 6: AI Citation Monitoring (Week 6)

### 6.1 GEO Intelligence Monitor

**New Edge Function:** `geo-citation-monitor`

```typescript
// supabase/functions/geo-citation-monitor/index.ts
// Runs daily via cron

async function monitorAICitations(sessionId: string) {
  const session = await getSession(sessionId)
  const blueprint = session.blueprint

  // Test target queries on AI platforms
  const results = []
  for (const query of blueprint.schemaStrategy.target_queries) {
    // Test on each platform
    const chatgptResult = await testQuery('chatgpt', query, session.organization_id)
    const claudeResult = await testQuery('claude', query, session.organization_id)
    const perplexityResult = await testQuery('perplexity', query, session.organization_id)

    results.push({
      query,
      platforms: {
        chatgpt: chatgptResult,
        claude: claudeResult,
        perplexity: perplexityResult
      },
      timestamp: new Date()
    })
  }

  // Store results
  await storeCitationResults(sessionId, results)

  // Detect changes/opportunities
  const insights = await analyzeCitationTrends(sessionId, results)

  return { results, insights }
}

async function testQuery(platform: string, query: string, orgId: string) {
  // Query AI platform
  const response = await queryAIPlatform(platform, query)

  // Check if organization is mentioned
  const orgName = await getOrganizationName(orgId)
  const mentioned = response.includes(orgName)
  const rank = mentioned ? extractRank(response, orgName) : null

  // Extract competitors mentioned
  const competitors = extractCompetitors(response)

  return {
    mentioned,
    rank,
    competitors,
    response_excerpt: response.substring(0, 500)
  }
}
```

### 6.2 Citation Tracking UI

**Add to Strategic Planning:**

```typescript
{viewMode === 'monitoring' && (
  <div className="citation-monitoring">
    <h2>AI Citation Tracking</h2>
    <p className="text-gray-400 mb-6">
      Track how AI platforms respond to your target queries
    </p>

    <div className="grid grid-cols-3 gap-4 mb-6">
      <MetricCard
        title="Citation Rate"
        value="65%"
        change="+15%"
        description="Mentioned in 13/20 target queries"
      />
      <MetricCard
        title="Average Rank"
        value="#2.3"
        change="+0.5"
        description="Across ChatGPT, Claude, Perplexity"
      />
      <MetricCard
        title="New Mentions"
        value="8"
        change="+3"
        description="New citations this week"
      />
    </div>

    <CitationTable results={citationResults} />
  </div>
)}
```

---

## Phase 7: Blueprint Display (Week 7)

### 7.1 Enhance Blueprint Presentation

**File:** `src/components/campaign-builder/BlueprintV3Presentation.tsx`

**Add GEO sections:**

1. **Schema Strategy Section**

```typescript
function SchemaStrategySection({ schemaStrategy }) {
  return (
    <section className="mb-8">
      <h2>Schema Optimization Strategy</h2>

      <div className="mb-4">
        <h3>Target Queries</h3>
        <div className="flex flex-wrap gap-2">
          {schemaStrategy.target_queries.map(query => (
            <Badge key={query}>{query}</Badge>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3>Platform Priorities</h3>
        <div className="space-y-3">
          {Object.entries(schemaStrategy.platform_priorities).map(([platform, config]) => (
            <div key={platform} className="bg-zinc-800 rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium capitalize">{platform}</span>
                <Badge priority={config.importance} />
              </div>
              <p className="text-sm text-gray-400 mb-2">{config.rationale}</p>
              <div className="text-xs text-gray-500">
                Focus: {config.optimization_focus.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3>Schema Roadmap</h3>
        <SchemaRoadmapTimeline roadmap={schemaStrategy.schema_roadmap} />
      </div>
    </section>
  )
}
```

2. **Multi-Platform Content Section**

```typescript
function GEOContentSection({ geoContentStrategy }) {
  return (
    <section className="mb-8">
      <h2>Multi-Platform Execution Strategy</h2>

      <Tabs>
        <Tab label="Automated">
          <ContentList items={geoContentStrategy.content_pillars.automated} />
        </Tab>
        <Tab label="User Actions">
          <UserActionsList items={geoContentStrategy.content_pillars.user_assisted} />
        </Tab>
        <Tab label="Strategic Guidance">
          <StrategicGuidance guidance={geoContentStrategy.content_pillars.strategic_guidance} />
        </Tab>
      </Tabs>
    </section>
  )
}
```

---

## Integration Architecture

```
Campaign Builder (Research)
↓
GEO Source Analyzer
↓
Blueprint Generator
  ├─ Traditional VECTOR sections
  ├─ Schema Strategy (NEW)
  └─ GEO Content Strategy (NEW)
↓
Blueprint Finalized
↓
Schema Recommendations Generator
  └─ Creates pending schema updates
↓
Strategic Planning Module
  ├─ Execution Tab (existing PR/social content)
  ├─ Schemas Tab (NEW - schema recommendations)
  ├─ Reddit Tab (NEW - engagement opportunities)
  ├─ Content Tab (NEW - user action content)
  └─ Monitoring Tab (NEW - AI citation tracking)
↓
User executes:
  ├─ Auto: Schemas, press releases, social
  ├─ Assisted: Reddit, YouTube (with AI help)
  └─ Guided: Podcasts, forums (strategic playbook)
↓
GEO Citation Monitor (cron)
  └─ Tracks AI platform mentions
↓
Performance Attribution
  └─ Links citations to schema changes
```

---

## Success Metrics

**For Each Campaign:**
- Citation rate (% of target queries mentioning brand)
- Average AI rank across platforms
- Coverage by source (Reddit, YouTube, docs, schemas, etc.)
- User action completion rate
- Schema update velocity

**System-Level:**
- Schema recommendation accuracy (% accepted)
- Reddit opportunity relevance (% engaged)
- Time to visibility improvement
- User satisfaction with assisted content

---

## File Changes Summary

### New Files:
- `supabase/functions/niv-geo-source-analyzer/index.ts`
- `supabase/functions/niv-geo-schema-recommendations-generator/index.ts`
- `supabase/functions/geo-reddit-monitor/index.ts`
- `supabase/functions/niv-geo-content-generator/index.ts`
- `supabase/functions/geo-citation-monitor/index.ts`

### Modified Files:
- `supabase/functions/niv-campaign-blueprint-base/index.ts` (add schema strategy sections)
- `supabase/functions/niv-campaign-blueprint-orchestrator/index.ts` (call GEO analyzer)
- `src/components/campaign-builder/CampaignBuilderWizard.tsx` (display GEO analysis)
- `src/components/campaign-builder/BlueprintV3Presentation.tsx` (render GEO sections)
- `src/components/modules/StrategicPlanningModuleV3Complete.tsx` (add tabs + features)
- `src/components/geo/SchemaEditor.tsx` (add suggested changes support)

### New Tables:
```sql
-- Schema recommendations
CREATE TABLE geo_schema_recommendations (...)

-- Reddit opportunities
CREATE TABLE geo_reddit_opportunities (...)

-- Citation tracking
CREATE TABLE geo_citation_results (...)
```

---

## Timeline

**Week 1-2:** Research enhancement (GEO source analyzer)
**Week 2-3:** Blueprint enhancement (schema strategy sections)
**Week 3-4:** Strategic Planning integration (schema recommendations UI)
**Week 4-5:** Execution features (Reddit monitoring)
**Week 5:** Content generation (user action content)
**Week 6:** Monitoring (AI citation tracking)
**Week 7:** Polish & testing

**Total: ~7 weeks for complete GEO-VECTOR integration**

---

## Next Steps

1. Review and approve implementation plan
2. Prioritize phases (can phases be parallelized?)
3. Decide on MVP scope (which phases are must-have vs nice-to-have?)
4. Begin Phase 1: GEO source analyzer
