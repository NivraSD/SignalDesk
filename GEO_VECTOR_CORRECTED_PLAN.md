# GEO-VECTOR Campaign Implementation (CORRECTED)

**Date:** November 2, 2025
**Understanding:** GEO-VECTOR is a NEW campaign type, not an enhancement to existing VECTOR

---

## The Core Difference

### Traditional VECTOR Campaigns (What You Have)

**Target:** Human audiences
**Channels:** Press, events, owned content, relationships
**Pillars:**
1. Owned Actions (blog posts, whitepapers)
2. Relationships (partners, influencers)
3. Events (speaking, conferences)
4. Media Engagement (press releases, journalist pitches)

**Success Metrics:** Traditional PR (coverage, sentiment, reach)

### GEO-VECTOR Campaigns (What We're Building)

**Target:** AI platforms (ChatGPT, Claude, Perplexity, Gemini)
**Channels:** Schemas, Reddit, YouTube, documentation, podcasts
**Pillars:**
1. **Automated** (schemas, PR distribution) - SignalDesk executes
2. **User-Assisted** (Reddit AMAs, YouTube videos) - SignalDesk provides content/scripts, user executes
3. **Strategic Guidance** (podcasts, forums, academic) - SignalDesk provides strategy/talking points

**Success Metrics:** AI visibility (cited in responses, ranking, platform coverage)

---

## What This Means Architecturally

### You Need NEW Campaign Type

Similar to how you have:
- Traditional PR Campaign (`niv-campaign-pr-blueprint`)
- VECTOR Campaign (`niv-blueprint-orchestrator-v3`)

Now you need:
- **GEO-VECTOR Campaign** (`niv-geo-vector-orchestrator`)

### Different Blueprint Structure

**Current VECTOR Blueprint:**
```
Part 1: Strategic Foundation
Part 2: Psychological Influence Strategy
Part 3: Four-Pillar Tactical Orchestration (4 phases × 4 pillars)
Part 4: Resource Requirements
Part 5: Execution Roadmap
Part 6: Content & Action Inventory
```

**GEO-VECTOR Blueprint:**
```
Part 1: Strategic Foundation (same)
Part 2: GEO Source Analysis
  - Which sources AI platforms check
  - Reddit communities importance
  - YouTube content gaps
  - Schema optimization priority
  - Documentation needs

Part 3: Three-Tier Tactical Plan
  TIER 1: AUTOMATED (SignalDesk auto-executes)
    - Schema updates (Product, FAQ, Organization)
    - Press release distribution
    - Documentation optimization

  TIER 2: USER-ASSISTED (SignalDesk provides content, user executes)
    - Reddit AMAs (script provided)
    - Reddit monitoring (responses provided)
    - YouTube videos (script provided)
    - Documentation publishing (content provided)

  TIER 3: STRATEGIC GUIDANCE (SignalDesk provides strategy)
    - Podcast pitching (talking points provided)
    - Forum engagement (guidelines provided)
    - Academic partnerships (approach provided)

Part 4: Resource Requirements
Part 5: Execution Roadmap
Part 6: Content & Action Inventory
```

### Different Execution Flow

**Current VECTOR:**
```
Campaign Builder → Research → Positioning → VECTOR Blueprint
  ↓
Strategic Planning Module
  ├─ Owned Actions (auto-execute)
  ├─ Relationships (user actions)
  ├─ Events (user actions)
  └─ Media Engagement (auto-execute)
```

**GEO-VECTOR:**
```
Campaign Builder → Research + GEO Analysis → Positioning → GEO-VECTOR Blueprint
  ↓
Strategic Planning Module
  ├─ AUTOMATED Tab
  │   ├─ Schema Updates (one-click execute)
  │   ├─ Press Distribution (one-click execute)
  │   └─ Doc Optimization (one-click execute)
  │
  ├─ USER-ASSISTED Tab
  │   ├─ Reddit Opportunities
  │   │   ├─ AMAs (script provided, copy-paste)
  │   │   └─ Monitoring (suggested responses, copy-paste)
  │   ├─ YouTube Videos (script provided)
  │   └─ Documentation (content provided)
  │
  └─ STRATEGIC GUIDANCE Tab
      ├─ Podcast Outreach (pitch template + talking points)
      ├─ Forum Strategy (guidelines)
      └─ Academic Partnerships (approach)
```

---

## Implementation Roadmap (CORRECTED)

### Phase 1: GEO Source Analyzer (Week 1)

**New Edge Function:** `niv-geo-source-analyzer`

**What it does:**
1. Takes target queries from campaign
2. Tests them on AI platforms
3. Analyzes which sources AI platforms cite (Reddit, YouTube, docs, etc.)
4. Scores opportunity by importance × gap
5. Returns priority ranking

**Output Example:**
```json
{
  "source_importance": {
    "reddit": {
      "importance": "critical",
      "relevant_communities": ["r/investing", "r/energy"],
      "current_presence": "none",
      "opportunity_score": 95,
      "reasoning": "65% of AI responses cite Reddit for investment questions"
    },
    "youtube": {
      "importance": "high",
      "current_presence": "weak",
      "opportunity_score": 78,
      "reasoning": "55% of educational queries cite YouTube"
    },
    "schemas": {
      "importance": "high",
      "current_presence": "moderate",
      "opportunity_score": 71,
      "reasoning": "Missing FAQ and Review schemas"
    }
  }
}
```

**Integration:**
- Called during Campaign Builder research phase
- Results displayed before positioning
- Informs blueprint generation

### Phase 2: GEO-VECTOR Blueprint Generator (Week 2)

**New Edge Function:** `niv-geo-vector-orchestrator`

**What it does:**
1. Takes research + GEO analysis
2. Generates 3-tier tactical plan:
   - Automated actions (schemas, PR)
   - User-assisted actions (Reddit, YouTube)
   - Strategic guidance (podcasts, forums)
3. Creates timeline (Weeks 1-12)
4. Estimates resources

**Blueprint Structure:**
```typescript
{
  strategicFoundation: { /* same as VECTOR */ },

  geoSourceAnalysis: {
    targetQueries: string[],
    platformPriorities: {
      chatgpt: { importance, rationale, optimizationFocus },
      claude: { /* ... */ },
      perplexity: { /* ... */ }
    },
    sourceOpportunities: {
      reddit: { score, communities, currentPresence },
      youtube: { score, contentGaps },
      schemas: { score, missingSchemas }
    }
  },

  threeTierTacticalPlan: {
    automated: [
      {
        type: 'schema_update',
        target: 'Product schema',
        changes: { add_fields: ['aggregateRating', 'review'] },
        timeline: 'Week 1',
        executionMethod: 'one_click'
      },
      {
        type: 'faq_schema',
        questions: [...],
        timeline: 'Week 1',
        executionMethod: 'auto_generate'
      }
    ],

    userAssisted: [
      {
        type: 'reddit_ama',
        subreddit: 'r/investing',
        priority: 'critical',
        timeline: 'Week 2',
        deliverables: {
          threadTitle: '...',
          openingPost: '...',
          responseFramework: [...],
          moderationGuidelines: [...]
        },
        timeEstimate: '2 hours + 30 min/week',
        successMetrics: ['100+ upvotes', '50+ questions', 'Cited in AI within 30 days']
      },
      {
        type: 'reddit_monitoring',
        subreddits: ['r/investing', 'r/energy'],
        keywords: [...],
        timeline: 'Ongoing',
        deliverables: {
          weeklyDigest: 'auto',
          suggestedResponses: 'AI-generated',
          engagementGuidelines: [...]
        }
      },
      {
        type: 'youtube_video',
        title: 'Hydrogen Investment Guide 2025',
        script: '...',
        talkingPoints: [...],
        timeEstimate: '1 day production',
        successMetrics: ['1,000+ views', 'Embedded in AI responses']
      }
    ],

    strategicGuidance: {
      podcasts: {
        priority: 'medium',
        targets: ['Invest Like the Best', 'The Energy Gang'],
        pitchTemplate: '...',
        talkingPoints: [...],
        timeline: '3-6 months'
      },
      forums: {
        priority: 'low',
        targets: ['HackerNews', 'StackOverflow'],
        approach: 'Technical contributions',
        guidelines: [...]
      }
    }
  },

  resourceRequirements: { /* ... */ },
  executionRoadmap: { /* ... */ }
}
```

### Phase 3: Strategic Planning UI Updates (Week 3)

**File:** `src/components/modules/StrategicPlanningModuleV3Complete.tsx`

**Changes:**

**1. Add Campaign Type Detection:**
```typescript
const campaignType = blueprint.type // 'traditional_pr' | 'vector' | 'geo_vector'

if (campaignType === 'geo_vector') {
  // Show 3-tier tabs instead of 4-pillar tabs
}
```

**2. Add Three-Tier Tabs:**
```typescript
const [activeTier, setActiveTier] = useState<'automated' | 'user_assisted' | 'strategic'>('automated')

<div className="tier-tabs">
  <button onClick={() => setActiveTier('automated')}>
    ⚡ Automated (SignalDesk Executes)
  </button>
  <button onClick={() => setActiveTier('user_assisted')}>
    🤝 User-Assisted (You Execute with Our Content)
  </button>
  <button onClick={() => setActiveTier('strategic')}>
    🎯 Strategic Guidance
  </button>
</div>
```

**3. Automated Tier UI:**
```typescript
{activeTier === 'automated' && (
  <div className="automated-actions">
    {blueprint.threeTierTacticalPlan.automated.map(action => (
      <AutomatedActionCard
        action={action}
        onExecute={executeAutomatedAction}
      />
    ))}
  </div>
)}

// AutomatedActionCard shows:
// - Action type (Schema Update, FAQ Generation)
// - What it does
// - "Execute Now" button
// - Status (pending, executing, complete)
```

**4. User-Assisted Tier UI:**
```typescript
{activeTier === 'user_assisted' && (
  <div className="user-assisted-actions">
    <div className="reddit-section">
      <h3>Reddit Engagement</h3>

      {/* AMAs */}
      <AMACard ama={blueprint.userAssisted.find(a => a.type === 'reddit_ama')} />

      {/* Monitoring */}
      <RedditMonitoringSection
        config={blueprint.userAssisted.find(a => a.type === 'reddit_monitoring')}
        opportunities={redditOpportunities}
      />
    </div>

    <div className="youtube-section">
      <h3>YouTube Content</h3>
      <YouTubeVideoCard video={blueprint.userAssisted.find(a => a.type === 'youtube_video')} />
    </div>
  </div>
)}
```

**5. Strategic Guidance UI:**
```typescript
{activeTier === 'strategic' && (
  <div className="strategic-guidance">
    <GuidanceCard
      title="Podcast Outreach"
      priority={blueprint.strategicGuidance.podcasts.priority}
      timeline={blueprint.strategicGuidance.podcasts.timeline}
      targets={blueprint.strategicGuidance.podcasts.targets}
      pitchTemplate={blueprint.strategicGuidance.podcasts.pitchTemplate}
      talkingPoints={blueprint.strategicGuidance.podcasts.talkingPoints}
    />

    <GuidanceCard
      title="Forum Engagement"
      {...}
    />
  </div>
)}
```

### Phase 4: Reddit Monitoring System (Week 4)

**New Edge Function:** `geo-reddit-monitor`

**What it does:**
1. Searches Reddit API for keywords
2. AI evaluates each thread
3. Generates suggested responses
4. Stores opportunities in database

**New Table:**
```sql
CREATE TABLE geo_reddit_opportunities (
  id UUID PRIMARY KEY,
  session_id TEXT,
  thread_id TEXT,
  thread_url TEXT,
  thread_title TEXT,
  subreddit TEXT,
  relevance_score INTEGER,
  reasoning TEXT,
  suggested_comment TEXT,
  talking_points JSONB,
  warnings JSONB,
  status VARCHAR(20), -- 'pending', 'approved', 'posted', 'dismissed'
  detected_at TIMESTAMPTZ
);
```

**UI Component:**
```typescript
<RedditOpportunityCard
  opportunity={opp}
  onCopyComment={() => {
    navigator.clipboard.writeText(opp.suggested_comment)
    window.open(opp.thread_url, '_blank')
  }}
  onEdit={(newComment) => {
    setEditedComment(newComment)
  }}
  onDismiss={() => dismissOpportunity(opp.id)}
/>
```

### Phase 5: Schema Deployment (Week 5) - CRITICAL

**This is what makes everything work!**

**New API Route:** `/api/schema/[org-id].js`

**What it does:**
```typescript
// Returns latest schema from Memory Vault
export async function GET(req: Request, { params }) {
  const { org_id } = params

  const schema = await supabase
    .from('content_library')
    .select('content')
    .eq('organization_id', org_id)
    .eq('content_type', 'schema')
    .eq('folder', 'Schemas/Active/')
    .single()

  // Return as executable JavaScript
  return new Response(`
    (function() {
      const schema = ${JSON.stringify(schema.content)};
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    })();
  `, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
```

**User adds to their website:**
```html
<script src="https://signaldesk.com/api/schema/abc123.js"></script>
```

**Benefits:**
- Schema auto-updates when user edits in SignalDesk
- No manual copy-paste
- No CMS integration needed
- Works on any website

---

## Key Differences from Original Plan

### What Changed

**Original Understanding:**
- GEO-VECTOR is VECTOR + GEO enhancements
- Enhance existing blueprints
- Add schema section to existing campaigns

**Correct Understanding:**
- GEO-VECTOR is a NEW campaign type
- Different tactical structure (3 tiers vs 4 pillars)
- Different target (AI platforms vs human audiences)
- Different metrics (AI citations vs PR coverage)

### What Stayed the Same

**Still Need:**
- ✅ GEO source analyzer
- ✅ Schema deployment solution
- ✅ Reddit monitoring
- ✅ Blueprint generation
- ✅ Strategic Planning UI

**Don't Need:**
- ❌ Modifying existing VECTOR blueprints
- ❌ Complex schema editor (have Memory Vault)
- ❌ Citation dashboard (have GEO tab)

---

## Implementation Timeline

**Week 1:** GEO Source Analyzer
- Build `niv-geo-source-analyzer`
- Test with real queries
- Integrate into Campaign Builder

**Week 2:** GEO-VECTOR Blueprint Generator
- Build `niv-geo-vector-orchestrator`
- Define 3-tier structure
- Test blueprint generation

**Week 3:** Strategic Planning UI
- Add tier tabs
- Build automated actions UI
- Build user-assisted UI
- Build strategic guidance UI

**Week 4:** Reddit Monitoring
- Build `geo-reddit-monitor`
- Create database table
- Build opportunity cards
- Test Reddit API integration

**Week 5:** Schema Deployment
- Create hosted endpoint
- Add deployment instructions
- Test on real website
- Verify AI platforms can see

**Week 6:** Testing & Polish
- End-to-end campaign flow
- Fix bugs
- Polish UI
- Write documentation

---

## Success Criteria

### For GEO-VECTOR Campaign

**User can:**
1. Create new GEO-VECTOR campaign
2. See which sources AI platforms prioritize
3. Get 3-tier tactical plan
4. Execute automated actions (one-click schema updates)
5. Get Reddit AMA script + monitoring
6. Get YouTube video scripts
7. Get podcast pitch templates
8. Track AI visibility improvements

**System generates:**
1. Accurate source importance analysis
2. Actionable schema recommendations
3. Copy-paste ready Reddit content
4. Complete YouTube scripts
5. Podcast talking points
6. Timeline for 12-week campaign

---

*Corrected Understanding: November 2, 2025*
*GEO-VECTOR is a distinct campaign type for AI visibility optimization*
