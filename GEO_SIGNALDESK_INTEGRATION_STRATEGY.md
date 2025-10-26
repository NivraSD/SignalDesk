# GEO Integration Strategy for SignalDesk
**Created:** October 26, 2025
**Purpose:** Strategic plan for integrating GEO (Generative Experience Optimization) into SignalDesk leveraging Memory Vault V2 capabilities

---

## Executive Summary

GEO integration transforms SignalDesk from PR-only to **omnichannel reputation orchestration** (Traditional PR + Social + AI Agents). By leveraging Memory Vault's composite scoring, salience decay, and campaign attribution, we can create a self-improving system that learns which schema optimizations drive AI visibility.

**Key Insight:** Schemas are just structured content. Everything we built for Memory Vault applies to schemas too.

---

## 1. GEO-Specific Intelligence Monitor ("Executive Synthesis for Schemas")

### Problem
MCP-discovery is optimized for news/media monitoring. GEO needs different signals:
- AI platform queries (ChatGPT, Claude, Perplexity, Gemini)
- Competitor schema changes
- Industry query pattern shifts
- Schema performance degradation

### Solution: GEO Intelligence Pipeline

**New Edge Function:** `geo-executive-synthesis`

```typescript
// supabase/functions/geo-executive-synthesis/index.ts

interface GEOIntelligenceSignal {
  type: 'schema_gap' | 'competitor_update' | 'query_trend' | 'performance_drop' | 'new_opportunity'
  priority: 'critical' | 'high' | 'medium' | 'low'
  platform: 'chatgpt' | 'claude' | 'perplexity' | 'gemini' | 'all'

  // The signal data
  data: {
    // For schema gaps
    missingField?: string
    competitorHas?: string
    impact?: string

    // For competitor updates
    competitor?: string
    schemaChange?: any
    ourPosition?: 'ahead' | 'behind' | 'equal'

    // For query trends
    query?: string
    volume?: number
    trend?: 'rising' | 'falling'
    currentRank?: number

    // For performance drops
    schemaId?: string
    metric?: string
    oldValue?: number
    newValue?: number
    percentChange?: number
  }

  // AI-generated recommendation
  recommendation: {
    action: 'update_schema' | 'create_faq' | 'add_field' | 'test_variant'
    schemaType: string
    suggestedChanges: any
    reasoning: string
    expectedImpact: string
    autoExecutable: boolean // Can this be auto-applied?
  }

  // Like opportunity engine
  autoExecute?: boolean
  executedAt?: string
}
```

**Intelligence Sources (Industry-Adaptable):**

```typescript
// Industry-specific query patterns
const INDUSTRY_QUERIES = {
  saas: [
    'best [category] software',
    '[problem] solution',
    'alternatives to [competitor]',
    '[industry] tools comparison'
  ],
  ecommerce: [
    'buy [product]',
    '[product] reviews',
    'best [product] for [use case]',
    '[product] vs [product]'
  ],
  healthcare: [
    '[condition] treatment',
    'find [specialist]',
    '[procedure] cost',
    'best [provider] near me'
  ],
  finance: [
    'best [service]',
    '[product] rates',
    'how to [financial goal]',
    '[service] comparison'
  ]
}

// Industry-specific schema priorities
const SCHEMA_PRIORITIES = {
  saas: ['SoftwareApplication', 'Product', 'FAQPage', 'Organization', 'Review'],
  ecommerce: ['Product', 'Offer', 'Review', 'FAQPage', 'Organization'],
  healthcare: ['MedicalBusiness', 'Physician', 'Service', 'FAQPage'],
  finance: ['FinancialProduct', 'Service', 'Organization', 'FAQPage']
}

// Adaptive monitoring based on industry
async function getIndustryQueries(organizationId: string) {
  const org = await getOrganization(organizationId)
  const industry = org.industry || 'saas'

  const baseQueries = INDUSTRY_QUERIES[industry] || INDUSTRY_QUERIES.saas

  // Personalize with brand name and competitors
  return baseQueries.map(q =>
    q.replace('[category]', org.category)
     .replace('[problem]', org.solves)
     .replace('[competitor]', org.competitors[0])
  )
}
```

**Workflow:**

```
Daily Cron: geo-executive-synthesis
↓
1. Query AI platforms with industry-specific searches
   - ChatGPT: "best CRM software" (if SaaS)
   - Perplexity: "buy running shoes" (if ecommerce)
   - Claude: "best cardiologist NYC" (if healthcare)
↓
2. Analyze responses
   - Are we mentioned?
   - What rank?
   - What competitors are mentioned?
   - What attributes do they cite?
↓
3. Extract competitor schemas (via Firecrawl)
   - What fields do they have that we don't?
   - What's their FAQ structure?
   - What data points are they emphasizing?
↓
4. Generate intelligence signals
   {
     type: 'schema_gap',
     data: {
       missingField: 'aggregateRating',
       competitorHas: 'Competitor X has 4.8★ with 150 reviews',
       impact: 'Rating schema increases citation 3x'
     },
     recommendation: {
       action: 'add_field',
       schemaType: 'Product',
       suggestedChanges: { aggregateRating: {...} },
       autoExecutable: true
     }
   }
↓
5. Store in geo_intelligence table
↓
6. User sees in GEO Intelligence Panel
   - Like opportunities, but for schema optimization
   - "Auto-execute" button for safe changes
```

---

## 2. Auto-Executable Schema Updates (Like Opportunity Engine)

### Problem
Users need to quickly apply recommended schema changes without manual editing.

### Solution: Schema Recommendations with Auto-Execute

**Database Table:**
```sql
CREATE TABLE geo_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,

  -- Source of recommendation
  intelligence_signal_id UUID REFERENCES geo_intelligence(id),
  source_type VARCHAR(50), -- 'competitor_gap', 'performance_drop', 'query_trend'

  -- What to change
  schema_id UUID REFERENCES schemas(id), -- Existing schema to update
  schema_type VARCHAR(100), -- Or create new schema of this type
  action_type VARCHAR(50), -- 'update_field', 'add_field', 'create_schema', 'create_faq'

  -- The actual changes
  changes JSONB NOT NULL,
  reasoning TEXT NOT NULL,
  expected_impact TEXT,

  -- Auto-execution
  auto_executable BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT true,
  risk_level VARCHAR(20) DEFAULT 'low', -- low, medium, high

  -- Execution tracking
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, executed, rejected
  executed_at TIMESTAMPTZ,
  result_schema_id UUID REFERENCES schemas(id), -- New schema created

  -- Attribution (learning loop)
  performance_before JSONB,
  performance_after JSONB,
  effectiveness_score DECIMAL(3,2), -- 0-1 score

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Auto-Execute Logic:**

```typescript
// Determine if recommendation is auto-executable
function isAutoExecutable(recommendation: GEORecommendation): boolean {
  // Safe changes that can be auto-applied
  const safeActions = [
    'add_field', // Adding new fields is safe
    'update_description', // Updating descriptions is safe
    'add_faq' // Adding FAQ entries is safe
  ]

  const riskyActions = [
    'remove_field', // Removing fields might break things
    'change_price', // Price changes need approval
    'update_url' // URL changes are risky
  ]

  if (riskyActions.includes(recommendation.action_type)) {
    return false
  }

  if (safeActions.includes(recommendation.action_type)) {
    return true
  }

  // Check if change is in approved field list
  const approvedFields = [
    'description', 'keywords', 'sameAs', 'knowsAbout',
    'faqPage', 'review', 'aggregateRating'
  ]

  const fieldPath = recommendation.changes.field
  return approvedFields.some(f => fieldPath.includes(f))
}

// Execute recommendation
async function executeRecommendation(recommendationId: string) {
  const rec = await getRecommendation(recommendationId)

  // Apply changes to schema
  const updatedSchema = await applySchemaChanges(
    rec.schema_id,
    rec.changes,
    {
      reason: `Auto-applied GEO recommendation: ${rec.reasoning}`,
      triggeredBy: 'geo_intelligence',
      triggerData: { recommendation_id: recommendationId }
    }
  )

  // Mark as executed
  await updateRecommendation(recommendationId, {
    status: 'executed',
    executed_at: new Date(),
    result_schema_id: updatedSchema.id
  })

  // Start tracking performance (for learning loop)
  await trackSchemaPerformance(updatedSchema.id, rec.id)

  return updatedSchema
}
```

**UI Component:**

```typescript
// Like OpportunityCard, but for schema recommendations
function GEORecommendationCard({ recommendation }: Props) {
  return (
    <div className="recommendation-card">
      <div className="header">
        <Badge type={recommendation.source_type} />
        <span className="priority">{recommendation.priority}</span>
      </div>

      <h3>{recommendation.reasoning}</h3>

      <div className="changes-preview">
        <h4>Proposed Changes:</h4>
        <SchemaD diff={recommendation.changes} />
      </div>

      <div className="impact">
        <Lightbulb className="w-4 h-4" />
        <span>{recommendation.expected_impact}</span>
      </div>

      <div className="actions">
        {recommendation.auto_executable ? (
          <button
            onClick={() => autoExecute(recommendation.id)}
            className="btn-primary"
          >
            ⚡ Auto-Execute
          </button>
        ) : (
          <button
            onClick={() => openEditor(recommendation.schema_id)}
            className="btn-secondary"
          >
            Review & Apply
          </button>
        )}

        <button onClick={() => reject(recommendation.id)}>
          Dismiss
        </button>
      </div>
    </div>
  )
}
```

---

## 3. VECTOR Campaign Integration

### Option A: New GEO-VECTOR Campaign Type

**New campaign type:** `geo-vector`

```typescript
interface GEOVectorCampaign {
  type: 'geo-vector'

  // Traditional VECTOR elements
  goal: string
  target_audiences: string[]
  phases: Phase[]

  // GEO-specific elements
  schema_strategy: {
    primary_schemas: string[] // ['Product', 'FAQPage', 'Organization']
    competitive_positioning: string
    target_queries: string[]
    platforms: string[] // ['chatgpt', 'claude', 'perplexity']
  }

  // Integrated orchestration
  content_pillars: {
    traditional_pr: ContentPiece[] // Press releases, media pitches
    social_content: ContentPiece[] // Social posts
    schema_updates: SchemaUpdate[] // Schema optimizations aligned with campaign
  }
}
```

**Workflow:**
```
User creates GEO-VECTOR campaign
↓
Campaign Builder generates:
1. Traditional PR content (press releases, pitches)
2. Social content (posts, threads)
3. Schema updates (FAQ entries matching key messages)
↓
Everything deployed in sync:
- PR content → Memory Vault (with fingerprinting)
- Social content → Scheduled posts
- Schema updates → Auto-deployed to website
↓
Unified tracking:
- Traditional media coverage (campaign attribution)
- Social engagement
- AI visibility (GEO monitoring)
↓
Composite performance score:
- 40% Traditional media coverage
- 30% AI visibility/rank
- 30% Social engagement
```

### Option B: Enhance Existing VECTOR with Schema Module

**Better approach - don't create new type:**

Add "Schema Alignment" as a module in Strategic Planning phase:

```
VECTOR Campaign Phases:
1. Research
2. Positioning
3. Approach
4. Blueprint
   ├─ Tactical Phases 1-2 (PR/Social content)
   ├─ Tactical Phases 3-4 (Amplification)
   └─ Schema Alignment (NEW)  ← Add here
5. Execution
```

**Schema Alignment Module:**

```typescript
// Part of blueprint generation
async function generateSchemaAlignment(blueprint: Blueprint) {
  const campaign = {
    goal: blueprint.goal,
    key_messages: blueprint.key_messages,
    target_audiences: blueprint.target_audiences
  }

  // AI generates aligned schema updates
  const alignment = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    messages: [{
      role: 'user',
      content: `Given this campaign:

${JSON.stringify(campaign, null, 2)}

What schema updates would support these key messages for AI visibility?

Consider:
1. FAQ entries that answer questions about our positioning
2. Product description updates emphasizing key differentiators
3. Organization schema updates highlighting campaign themes

Return JSON with suggested schema updates.`
    }]
  })

  return {
    faq_additions: [...], // FAQ entries matching key messages
    product_updates: {...}, // Product schema enhancements
    organization_updates: {...}, // Org schema updates
    implementation_plan: 'Deploy schemas before content launch'
  }
}
```

**Benefits:**
- ✅ Single unified campaign type
- ✅ Schema updates aligned with content strategy
- ✅ Simpler UX - no choosing between campaign types
- ✅ Holistic performance tracking

**Recommendation:** Option B - enhance existing VECTOR with Schema Alignment module.

---

## 4. Memory Vault Storage for Schemas + NIV Schema Assistant

### Schema Storage in Memory Vault

**Add schema as new content type:**

```typescript
// Extend content_library table
content_type: 'schema' // New type

// Schema-specific metadata
metadata: {
  schema_type: 'Organization' | 'Product' | 'FAQPage' | ...,
  target_platform: 'all' | 'chatgpt' | 'claude' | 'perplexity',
  deployment_url: string,
  field_structure: any
}
```

**Memory Vault Benefits for Schemas:**

1. **Composite Scoring for Schema Templates**
   ```typescript
   // Search for proven schema patterns
   const templates = await searchMemoryVault({
     query: 'Product schema for SaaS',
     type: 'schema',
     limit: 5
   })

   // Results ranked by:
   // - Similarity (40%): Semantic match to query
   // - Salience (20%): Time-based relevance
   // - Execution success (20%): Proven AI visibility improvement
   // - Recency (10%): Recently updated
   // - Relationship (10%): Connected to successful campaigns
   ```

2. **Salience Decay**
   ```typescript
   // Old schemas automatically fade from recommendations
   // Schemas that improve AI rankings stay relevant (access boost)
   ```

3. **Campaign Attribution for Schemas**
   ```typescript
   // Track which schemas drive AI visibility
   // "This Product schema led to 15 ChatGPT mentions"
   // Successful schemas automatically boost salience 1.5x
   ```

4. **Explainable Retrieval**
   ```
   "Found: Product Schema Template
   Why: Proven successful • High AI visibility • Used 8× with 90% success"
   ```

### NIV Schema Assistant ("Schema Workspace")

**New NIV Mode:** `schema-assistant`

```typescript
// supabase/functions/niv-schema-assistant/index.ts

const SCHEMA_ASSISTANT_TOOLS = [
  {
    name: "search_schema_templates",
    description: "Search Memory Vault for proven schema templates"
  },
  {
    name: "extract_competitor_schema",
    description: "Extract and analyze competitor schemas via Firecrawl"
  },
  {
    name: "generate_schema",
    description: "Generate optimized schema based on brand context"
  },
  {
    name: "optimize_existing_schema",
    description: "Suggest improvements to existing schema"
  },
  {
    name: "generate_faq_schema",
    description: "Generate FAQ schema from common queries"
  },
  {
    name: "validate_schema",
    description: "Validate schema against schema.org standards"
  },
  {
    name: "preview_ai_response",
    description: "Simulate how AI platforms might use this schema"
  }
]
```

**User Experience:**

```
User: "Help me optimize my Product schema for AI visibility"

NIV: "I'll help you optimize your Product schema. Let me first check what you currently have..."

[Searches Memory Vault for existing schemas]

NIV: "I found your current Product schema. I also found 3 proven templates:
1. SaaS Product Schema (used 12×, 95% AI visibility rate)
2. B2B Software Schema (used 8×, 90% AI visibility rate)
3. Enterprise Product Schema (used 5×, 85% AI visibility rate)

Your current schema is missing:
- aggregateRating (competitors have this)
- offers.priceRange (helps with pricing queries)
- review excerpts (builds credibility)

Let me also analyze your top competitor..."

[Extracts competitor schema]

NIV: "Your competitor has:
✅ Detailed feature list in 'featureList'
✅ Customer testimonials in 'review'
✅ Pricing tiers in 'offers'

I recommend:
1. Add aggregateRating: 4.8 stars (from your reviews)
2. Add featureList: [your key features]
3. Update description to emphasize [differentiator]

Would you like me to generate the updated schema?"

User: "Yes"

NIV: [Generates optimized schema]

NIV: "Here's your optimized Product schema. Key changes:
✅ Added rating schema
✅ Enhanced description (from 50 to 200 chars, emphasizes speed)
✅ Added featureList with 8 key features
✅ Structured offers with clear pricing

Save to Memory Vault? This will:
- Version your existing schema
- Apply these changes
- Track performance for learning loop"
```

**Schema Workspace UI:**

```typescript
function SchemaWorkspace() {
  return (
    <div className="schema-workspace">
      <div className="left-panel">
        <NIVSchemaChat
          mode="schema-assistant"
          context={{
            organization_id: orgId,
            current_schemas: schemas
          }}
        />
      </div>

      <div className="middle-panel">
        <JSONEditor
          value={currentSchema}
          onChange={setCurrentSchema}
          suggestions={nivSuggestions}
        />
      </div>

      <div className="right-panel">
        <SchemaTemplates
          templates={templateResults}
          onApply={applyTemplate}
        />

        <CompetitorSchemas
          competitors={competitorSchemas}
          onCompare={compareSchemas}
        />
      </div>
    </div>
  )
}
```

---

## 5. Schema Organization Strategy

### Folder Structure in Memory Vault

```
Memory Vault/
└── Schemas/
    ├── Active/ (currently deployed)
    │   ├── Universal/
    │   │   ├── Organization Schema
    │   │   ├── FAQPage Schema
    │   │   └── WebSite Schema
    │   │
    │   ├── ChatGPT-Optimized/
    │   │   ├── Product Schema (ChatGPT variant)
    │   │   └── Service Schema (ChatGPT variant)
    │   │
    │   ├── Claude-Optimized/
    │   │   └── Product Schema (Claude variant)
    │   │
    │   └── Perplexity-Optimized/
    │       └── Product Schema (Perplexity variant)
    │
    ├── Drafts/ (being edited)
    ├── Templates/ (proven patterns)
    │   └── [Industry]/
    │       ├── SaaS-Product-Schema.json
    │       ├── Ecommerce-Product-Schema.json
    │       └── Healthcare-Service-Schema.json
    │
    └── Archive/ (old versions)
```

**Platform-Specific Schema Metadata:**

```typescript
interface SchemaMetadata {
  // Universal fields
  schema_type: string
  version: number
  last_updated: string

  // Platform targeting
  platform_specific: boolean
  target_platforms: string[] // ['chatgpt', 'claude', 'perplexity', 'all']

  // Platform optimizations
  platform_notes: {
    chatgpt?: {
      optimization: string
      fields_emphasized: string[]
      reasoning: string
    }
    claude?: {
      optimization: string
      fields_emphasized: string[]
      reasoning: string
    }
  }

  // Performance by platform
  performance_by_platform: {
    chatgpt?: { citation_rate: number, avg_rank: number }
    claude?: { citation_rate: number, avg_rank: number }
    perplexity?: { citation_rate: number, avg_rank: number }
  }
}
```

**Platform-Specific Optimizations:**

Different AI platforms prefer different schema elements:

```typescript
const PLATFORM_PREFERENCES = {
  chatgpt: {
    prefers: ['aggregateRating', 'review', 'price', 'offers'],
    format: 'detailed_descriptions',
    max_description_length: 200,
    reasoning: 'ChatGPT emphasizes social proof and pricing'
  },

  claude: {
    prefers: ['description', 'featureList', 'knowsAbout', 'sameAs'],
    format: 'comprehensive_features',
    max_description_length: 300,
    reasoning: 'Claude values detailed capabilities and context'
  },

  perplexity: {
    prefers: ['url', 'sameAs', 'aggregateRating', 'review'],
    format: 'citations_focused',
    max_description_length: 150,
    reasoning: 'Perplexity emphasizes credible sources and ratings'
  },

  gemini: {
    prefers: ['image', 'video', 'offers', 'review'],
    format: 'multimedia_rich',
    max_description_length: 180,
    reasoning: 'Gemini emphasizes visual content and offers'
  }
}
```

**Auto-Generate Platform Variants:**

```typescript
// NIV generates platform-specific variants automatically
async function generatePlatformVariants(baseSchema: Schema) {
  const variants = {}

  for (const [platform, prefs] of Object.entries(PLATFORM_PREFERENCES)) {
    const variant = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      messages: [{
        role: 'user',
        content: `Optimize this schema for ${platform}:

BASE SCHEMA:
${JSON.stringify(baseSchema, null, 2)}

PLATFORM PREFERENCES:
${JSON.stringify(prefs, null, 2)}

Rules:
1. Emphasize preferred fields: ${prefs.prefers.join(', ')}
2. Use ${prefs.format} format
3. Keep description under ${prefs.max_description_length} chars
4. Maintain schema.org compliance

Return optimized schema variant.`
      }]
    })

    variants[platform] = JSON.parse(variant.content[0].text)
  }

  return variants
}
```

---

## 6. Schema Publishing Strategy

### Deployment Methods

**Option 1: Direct Website Integration (Ideal)**

```html
<!-- User adds to website <head> -->
<script type="application/ld+json" id="signaldesk-schema-organization">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company",
  ...
}
</script>

<!-- SignalDesk can update this via API or webhook -->
```

**Implementation:**
```typescript
// Website has SignalDesk snippet
<script src="https://cdn.signaldesk.com/schema-loader.js"
        data-org-id="org_123"></script>

// schema-loader.js fetches latest schemas
fetch(`https://api.signaldesk.com/v1/schemas/${orgId}/active`)
  .then(res => res.json())
  .then(schemas => {
    schemas.forEach(schema => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(schema.content)
      document.head.appendChild(script)
    })
  })
```

**Option 2: CDN Hosting**

```html
<!-- User includes from SignalDesk CDN -->
<script type="application/ld+json"
        src="https://schemas.signaldesk.com/org_123/organization.json"></script>
<script type="application/ld+json"
        src="https://schemas.signaldesk.com/org_123/product.json"></script>
```

**Option 3: API Endpoint**

```typescript
// SignalDesk provides API endpoint
GET https://api.signaldesk.com/v1/schemas/org_123/active

Response:
{
  schemas: [
    { "@context": "https://schema.org", "@type": "Organization", ... },
    { "@context": "https://schema.org", "@type": "Product", ... }
  ],
  lastUpdated: "2025-10-26T14:00:00Z"
}

// User's website fetches and injects
```

**Option 4: WordPress/Shopify/Webflow Plugins**

```typescript
// SignalDesk WordPress Plugin
- One-click installation
- Auto-syncs schemas from SignalDesk
- Updates in real-time when changed in platform
- Shows schema validation in WP admin
```

**Option 5: Manual Export**

```typescript
// For users who want full control
// Export as:
- JSON-LD file
- HTML snippet
- Google Tag Manager tag
```

### Recommended Approach: Multi-Method

```typescript
interface SchemaDeployment {
  method: 'cdn' | 'api' | 'direct' | 'manual'
  status: 'pending' | 'active' | 'error'
  url?: string // Where it's deployed
  lastSync?: string
  errors?: string[]
}

// User chooses deployment method per schema
// SignalDesk tracks deployment status
// Auto-validates schema is actually on page
```

**Validation System:**

```typescript
// Verify schema is live on website
async function validateSchemaDeployment(deployment: SchemaDeployment) {
  // Fetch the page
  const html = await fetch(deployment.url).then(r => r.text())

  // Extract schemas
  const schemas = extractSchemas(html)

  // Check if our schema is present
  const isDeployed = schemas.some(s =>
    JSON.stringify(s) === JSON.stringify(deployment.schema)
  )

  if (!isDeployed) {
    return {
      status: 'error',
      error: 'Schema not found on page'
    }
  }

  return {
    status: 'active',
    lastValidated: new Date()
  }
}
```

---

## 7. Leveraging Memory Vault V2 Capabilities

### 7.1 Schema Performance Attribution

**Just like campaign attribution, but for schemas:**

```typescript
// When AI platforms cite brand
// → Record which schemas were active
// → Track correlation between schema and citation

CREATE TABLE schema_attributions (
  id UUID PRIMARY KEY,
  schema_id UUID REFERENCES schemas(id),
  platform VARCHAR(50), -- 'chatgpt', 'claude', 'perplexity'

  query TEXT, -- What query led to citation
  citation_type VARCHAR(50), -- 'mentioned', 'recommended', 'ranked'
  rank INTEGER, -- Position in results
  context TEXT, -- How was brand mentioned

  confidence_score DECIMAL(3,2), -- How sure are we this schema helped

  detected_at TIMESTAMPTZ DEFAULT NOW()
);

// Learning loop
const successfulSchemas = await getSchemas({
  where: {
    attributions: { count: { gt: 10 } },
    avg_rank: { lt: 3 }
  }
})

// Boost salience of successful schemas
successfulSchemas.forEach(schema => {
  await boostSalience(schema.id, 1.5)
})
```

### 7.2 Composite Scoring for Schema Templates

```typescript
// When NIV searches for schema templates
const templates = await searchMemoryVault({
  query: 'Product schema for SaaS platform',
  type: 'schema',
  limit: 5
})

// Ranked by:
// 40% Semantic similarity (matches SaaS product)
// 20% Salience (recently used, not stale)
// 20% Execution success (drove AI visibility)
// 10% Recency (recently created/updated)
// 10% Relationships (used in successful campaigns)

// Results:
[
  {
    title: "SaaS Product Schema Template",
    score: 4.5,
    why_recommended: "Proven successful • High AI visibility • Used 15×",
    metrics: {
      relevance: "95%",
      success_rate: "90%", // Citation rate
      times_used: 15,
      avg_ai_rank: 2.3
    }
  }
]
```

### 7.3 Waypoint Graphs for Schema Patterns

```typescript
// Link related successful schemas
CREATE TABLE schema_waypoints (
  id UUID PRIMARY KEY,
  from_schema_id UUID REFERENCES schemas(id),
  to_schema_id UUID REFERENCES schemas(id),

  relationship_type VARCHAR(50), -- 'variant_of', 'complements', 'upgrades_to'
  weight DECIMAL(3,2), -- Connection strength

  reasoning TEXT -- Why they're connected
);

// Example relationships:
{
  from: "Product Schema v1",
  to: "Product Schema v2",
  type: "upgrades_to",
  weight: 0.95,
  reasoning: "v2 added aggregateRating and improved AI visibility by 40%"
}

{
  from: "Product Schema",
  to: "FAQPage Schema",
  type: "complements",
  weight: 0.85,
  reasoning: "Product + FAQ together improve ChatGPT citations by 65%"
}

// NIV can traverse waypoints:
"I see you're using Product Schema v1.
I found that Product Schema v2 (an upgrade) improved AI visibility by 40%.
Also, adding a complementary FAQ schema increased citations by 65%."
```

### 7.4 Explainable Schema Recommendations

```typescript
// Every schema recommendation includes reasoning
{
  recommendation: "Add aggregateRating field",
  why: [
    "Proven successful: 3 similar brands saw 3x citation increase",
    "High relevance: You have 150 reviews on G2 (source available)",
    "Recently used: Added to 8 SaaS schemas this month",
    "Competitor gap: 4/5 competitors have rating schemas"
  ],
  retrieval_reason: "Proven successful • High impact • Low effort"
}
```

### 7.5 Salience Decay for Schema Templates

```typescript
// Old schema patterns automatically fade
// Unless they're still being used successfully

// Example:
"Product Schema v1" created Jan 2024
- Initially popular (salience = 1.0)
- Used 20 times (access_count boost)
- But newer v2 performs better
- v1 gradually decays (salience = 0.6)
- Still accessible, but v2 appears first

// Prevents recommending outdated patterns
// While preserving institutional knowledge
```

### 7.6 Integration with NIV Content Generation

```typescript
// When NIV generates content, also update schemas

User: "Generate a press release for our new feature"

NIV: [Generates press release]

NIV: "I also recommend updating your Product schema:
- Add this feature to 'featureList'
- Update description to mention new capability
- Create FAQ entry: 'What's new in version 2.0?'

This aligns your schemas with the PR campaign for maximum AI visibility.

Shall I update the schemas?"

// Unified content + schema orchestration
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- ✅ Database schema for GEO (from geo.md)
- ✅ Schema extraction via Firecrawl
- ✅ Schema storage in Memory Vault (new content type)
- ✅ Basic schema editing UI

### Phase 2: Intelligence (Weeks 3-4)
- GEO intelligence monitor (geo-executive-synthesis)
- Industry-adaptable query patterns
- Competitor schema extraction
- Intelligence signal generation
- GEO recommendations table

### Phase 3: Auto-Execution (Week 5)
- Auto-executable recommendations
- Risk assessment logic
- Execution tracking
- Performance attribution

### Phase 4: NIV Integration (Week 6)
- NIV schema assistant mode
- Schema workspace UI
- Template search integration
- Composite scoring for schemas

### Phase 5: Campaign Integration (Week 7)
- Add "Schema Alignment" to VECTOR blueprint
- Generate aligned schema updates
- Unified deployment workflow
- Integrated performance tracking

### Phase 6: Platform Variants (Week 8)
- Platform-specific optimizations
- Auto-generate variants
- A/B testing framework
- Deployment system

---

## Key Architectural Decisions

### ✅ Recommended Approaches:

1. **Intelligence Monitor:** Build geo-executive-synthesis separate from MCP-discovery (different signals)
2. **Auto-Execute:** Mirror opportunity engine UX (proven pattern)
3. **Campaign Type:** Enhance existing VECTOR with Schema Alignment module (simpler)
4. **Storage:** Store schemas in Memory Vault as content type='schema' (leverages all v2 features)
5. **Organization:** Folder per platform variant (Active/ChatGPT-Optimized/, etc.)
6. **Publishing:** Multi-method with CDN as primary (easiest for users)
7. **NIV:** New schema-assistant mode with workspace UI

### 🎯 Unique Value Props:

1. **Self-Improving:** Successful schemas automatically boost salience
2. **Explainable:** Every recommendation shows why (proven patterns)
3. **Integrated:** Schemas aligned with PR campaigns (unique!)
4. **Adaptive:** Industry-specific query patterns
5. **Multi-Platform:** ChatGPT/Claude/Perplexity variants
6. **Zero-Config:** Auto-executable recommendations

---

## Success Metrics

**Schema Performance:**
- Citation rate (% of queries where brand is mentioned)
- Average rank (position in AI responses)
- Coverage (% of target queries with citations)

**System Performance:**
- Auto-execution rate (% of recommendations auto-applied)
- Template reuse rate (institutional knowledge capture)
- Time to deployment (how fast schemas update)

**Business Impact:**
- AI visibility improvement (citations over time)
- Competitive positioning (rank vs competitors)
- Campaign amplification (schema-aligned content performs better)

---

This strategy leverages ALL Memory Vault V2 capabilities (composite scoring, salience, attribution, explainability) while creating a cohesive GEO system that's unique in the market.
