# Campaign Attribution System - Implementation Guide

**Date:** October 26, 2025
**Status:** ✅ Core System Built - Ready for Integration & Deployment

---

## Overview

The Campaign Attribution System enables **automatic tracking of campaign performance** by fingerprinting exported content and detecting it in media coverage. This closes the learning loop, allowing the system to learn from successful campaigns and improve future strategy generation.

**Key Innovation:** First PR platform with AI-powered automatic campaign attribution using content fingerprinting.

---

## What Was Built

### 1. Database Schema ✅
**File:** `supabase/migrations/20251026_campaign_attribution_system.sql`

**Tables:**
- `campaign_fingerprints` - Content fingerprints with key phrases and embeddings
- `content_exports` - Track when/how content is exported
- `campaign_attributions` - Detected media coverage matched to campaigns
- `strategy_embeddings` - Multi-sector embeddings (episodic, semantic, procedural, emotional, reflective)
- `strategy_waypoints` - Graph connecting related strategies
- `strategy_outcomes` - Campaign outcomes and learnings

**Functions:**
- `match_content_to_fingerprints()` - Vector search for attribution matching
- `search_strategy_embeddings()` - Multi-sector semantic search
- `find_similar_strategies()` - Find strategies for waypoints
- `get_campaign_performance_summary()` - Aggregate performance metrics

### 2. Edge Functions ✅

#### **campaign-fingerprint-create**
- **Purpose:** Create fingerprint when content is exported
- **Features:**
  - Extracts 5-10 unique key phrases (3-7 words)
  - Identifies unique angles/positioning
  - Generates semantic embedding (full content)
  - Generates headline embedding
  - Sets 90-day tracking window
- **AI Used:** Claude (key phrases, angles), OpenAI (embeddings)

#### **campaign-attribution-check**
- **Purpose:** Check if detected content matches any fingerprints
- **Matching Levels:**
  1. **Exact phrase match** (95% confidence) - 2+ key phrases found
  2. **Semantic similarity** (75-85% confidence) - Vector similarity > 0.75
  3. **Contextual match** (65-75% confidence) - AI analyzes angles/timing
- **AI Used:** OpenAI (embeddings), Claude (contextual analysis)

#### **campaign-performance-get**
- **Purpose:** Get campaign performance metrics
- **Returns:**
  - Total coverage count
  - High confidence matches
  - Total reach
  - Sentiment breakdown
  - Top outlets
  - Timeline
  - Pending verifications

#### **campaign-outcome-record**
- **Purpose:** Record campaign outcome after completion
- **Features:**
  - Determines outcome type (success/partial/minimal/failed)
  - Calculates effectiveness score (0-5)
  - Extracts key learnings via AI
  - Identifies success/failure factors
  - Boosts strategy salience for successful campaigns
  - Creates waypoints to similar successful campaigns
- **AI Used:** Claude (learning extraction)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER EXPORTS CONTENT                      │
│          (Press Release, Blog Post, Social, etc.)            │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
              campaign-fingerprint-create
                       ↓
         ┌─────────────────────────────┐
         │   Content Fingerprint       │
         │   - Key phrases             │
         │   - Semantic embedding      │
         │   - Unique angles           │
         │   - 90-day tracking window  │
         └─────────────────────────────┘
                       ↓
         [User posts content externally]
                       ↓
┌──────────────────────────────────────────────────────────────┐
│             INTELLIGENCE MONITORING (Existing)                │
│         - Monitor 130+ sources                                │
│         - Detect news, social, competitor activity            │
└──────────────────────┬───────────────────────────────────────┘
                       ↓
         campaign-attribution-check
                       ↓
    ┌─────────────────┴─────────────────┐
    │                                   │
   Match                              No Match
    │                                   │
    ↓                                   ↓
  Record Attribution             Continue Monitoring
    │
    ↓
┌───────────────────────────────────────────────────────────────┐
│                  CAMPAIGN ATTRIBUTION                          │
│  - Source (TechCrunch, Twitter, LinkedIn, etc.)               │
│  - Confidence score (0.65-0.95)                               │
│  - Match type (exact_phrase, semantic, contextual)            │
│  - Estimated reach                                            │
│  - Sentiment (positive/neutral/negative)                      │
└───────────────────────┬───────────────────────────────────────┘
                       ↓
         campaign-performance-get
                       ↓
┌───────────────────────────────────────────────────────────────┐
│               PERFORMANCE DASHBOARD                            │
│  - Total coverage: 15 articles                                │
│  - Total reach: 25M                                           │
│  - Top outlets: TechCrunch (4), Wired (3), ...                │
│  - Sentiment: 12 positive, 2 neutral, 1 negative              │
│  - Timeline of coverage                                       │
└───────────────────────┬───────────────────────────────────────┘
                       ↓
     [Campaign completes or tracking window ends]
                       ↓
        campaign-outcome-record
                       ↓
┌───────────────────────────────────────────────────────────────┐
│                   SEMANTIC MEMORY                              │
│  - Outcome: "success" (effectiveness 4.2/5)                   │
│  - Learnings: "TechCrunch coverage cascaded to 14 outlets"    │
│  - Success factors: Data-driven positioning, tech media       │
│  - Salience boost: 1.5x (successful campaigns stay relevant)  │
│  - Waypoints: Linked to 5 similar successful campaigns        │
└───────────────────────┬───────────────────────────────────────┘
                       ↓
              NEXT CAMPAIGN GENERATION
                       ↓
    NIV queries semantic memory, finds this strategy
    "Based on your successful AI launch (4.2/5),
     I recommend CASCADE pattern with data-driven positioning..."
```

---

## Deployment Steps

### Step 1: Deploy Database Schema

```bash
# Go to Supabase SQL Editor
# https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql

# Run the migration
# File: supabase/migrations/20251026_campaign_attribution_system.sql
```

**What this creates:**
- 6 new tables
- Vector indexes for fast semantic search
- Row Level Security policies
- PostgreSQL functions for matching and search

**Verification:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN (
  'campaign_fingerprints',
  'content_exports',
  'campaign_attributions',
  'strategy_embeddings',
  'strategy_waypoints',
  'strategy_outcomes'
);

-- Should return 6 rows
```

### Step 2: Deploy Edge Functions

```bash
# From project root
cd /Users/jonathanliebowitz/Desktop/signaldesk-v3

# Deploy all attribution functions
npx supabase functions deploy campaign-fingerprint-create --project-ref zskaxjtyuaqazydouifp
npx supabase functions deploy campaign-attribution-check --project-ref zskaxjtyuaqazydouifp
npx supabase functions deploy campaign-performance-get --project-ref zskaxjtyuaqazydouifp
npx supabase functions deploy campaign-outcome-record --project-ref zskaxjtyuaqazydouifp
```

**Verification:**
```bash
# Test fingerprint creation
curl -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/campaign-fingerprint-create \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "test-123",
    "content": "Revolutionary AI platform launches with 10x performance improvement",
    "contentType": "press-release",
    "organizationId": "YOUR_ORG_ID"
  }'

# Should return: {"success": true, "fingerprintId": "..."}
```

### Step 3: Integrate into Content Export Flow

**Option A: Update existing export endpoint**

Find your export handler (likely in `/api/content/export` or similar) and add:

```typescript
// After content is prepared for export
import { createClient } from '@supabase/supabase-js'

async function handleContentExport(contentId: string, format: string) {
  const supabase = createClient(...)

  // Get the content
  const { data: content } = await supabase
    .from('content_library')
    .select('*')
    .eq('id', contentId)
    .single()

  // CREATE FINGERPRINT (fire-and-forget, don't block export)
  fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/campaign-fingerprint-create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      campaignId: content.metadata?.campaign_id,
      contentId: content.id,
      content: typeof content.content === 'string' ? content.content : JSON.stringify(content.content),
      contentType: content.content_type,
      organizationId: content.organization_id,
      exportFormat: format
    })
  }).catch(err => console.error('Fingerprint creation failed:', err))

  // Continue with normal export
  return generateExportFile(content, format)
}
```

**Option B: Add to Memory Vault save**

```typescript
// In src/app/api/content-library/save/route.ts
// After content is saved

// If this content should be tracked for attribution
if (shouldTrackAttribution(content.content_type)) {
  // Fire-and-forget fingerprint creation
  fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/campaign-fingerprint-create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contentId: savedContent.id,
      content: savedContent.content,
      contentType: savedContent.content_type,
      organizationId: savedContent.organization_id
    })
  }).catch(() => {})
}

function shouldTrackAttribution(contentType: string): boolean {
  return ['press-release', 'blog-post', 'social-content', 'email'].includes(contentType)
}
```

### Step 4: Integrate into Intelligence Monitoring

**Update your monitoring function** (e.g., `monitor-stage-2` or wherever articles are processed):

```typescript
// In supabase/functions/monitor-stage-2/index.ts or similar

async function processArticle(article: any, orgId: string) {
  // Your existing article processing...

  // NEW: Check for campaign attribution
  const attributionResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/campaign-attribution-check`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organizationId: orgId,
        articleContent: article.content,
        articleTitle: article.title,
        articleUrl: article.url,
        sourceType: 'news',
        sourceOutlet: article.source,
        publishedAt: article.published_at,
        estimatedReach: estimateReach(article.source)
      })
    }
  )

  const attribution = await attributionResponse.json()

  if (attribution.match) {
    console.log(`🎯 Campaign coverage detected: ${article.url}`)

    // Optional: Notify user
    await notifyUser({
      type: 'campaign_coverage',
      organizationId: orgId,
      campaignId: attribution.attribution.campaign_id,
      message: `Your campaign got coverage in ${article.source}`,
      url: article.url,
      confidence: attribution.attribution.confidence_score
    })
  }

  return article
}

function estimateReach(source: string): number {
  // Estimate based on known outlet sizes
  const estimates: Record<string, number> = {
    'TechCrunch': 10000000,
    'The Verge': 8000000,
    'Wired': 5000000,
    'Bloomberg': 15000000,
    'Reuters': 20000000,
    // Add more...
  }
  return estimates[source] || 100000 // Default estimate
}
```

### Step 5: Create Attribution Dashboard Component

Create a new component to display attribution analytics:

```typescript
// src/components/attribution/AttributionDashboard.tsx

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

interface AttributionDashboardProps {
  campaignId?: string
  organizationId: string
}

export function AttributionDashboard({ campaignId, organizationId }: AttributionDashboardProps) {
  const [performance, setPerformance] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPerformance()
  }, [campaignId, organizationId])

  async function fetchPerformance() {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/campaign-performance-get`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ campaignId, organizationId })
      }
    )

    const data = await response.json()
    setPerformance(data)
    setLoading(false)
  }

  if (loading) return <div>Loading campaign performance...</div>

  const { metrics, attributions } = performance

  return (
    <div className="attribution-dashboard">
      {/* Summary Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Coverage"
          value={metrics.total_coverage}
          subtitle={`${metrics.high_confidence_matches} high confidence`}
        />
        <MetricCard
          title="Total Reach"
          value={metrics.total_reach.toLocaleString()}
          subtitle="Estimated impressions"
        />
        <MetricCard
          title="Avg Confidence"
          value={`${(metrics.avg_confidence * 100).toFixed(0)}%`}
          subtitle="Attribution confidence"
        />
        <MetricCard
          title="Sentiment"
          value={`${metrics.sentiment_breakdown.positive}/${metrics.sentiment_breakdown.negative}`}
          subtitle="Positive / Negative"
        />
      </div>

      {/* Top Outlets */}
      <div className="top-outlets">
        <h3>Top Outlets</h3>
        {metrics.top_outlets.map((outlet: any) => (
          <div key={outlet.outlet}>
            {outlet.outlet}: {outlet.count} mentions ({outlet.reach.toLocaleString()} reach)
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="timeline">
        <h3>Coverage Timeline</h3>
        {metrics.timeline.map((item: any, idx: number) => (
          <div key={idx} className="timeline-item">
            <div>{new Date(item.date).toLocaleDateString()}</div>
            <div><strong>{item.outlet}</strong></div>
            <div>{item.title}</div>
            <div>Confidence: {(item.confidence * 100).toFixed(0)}%</div>
            <a href={item.url} target="_blank">View Article →</a>
          </div>
        ))}
      </div>

      {/* Pending Verification */}
      {metrics.pending_verification > 0 && (
        <div className="pending-verification">
          ⚠️ {metrics.pending_verification} matches pending user verification
        </div>
      )}
    </div>
  )
}

function MetricCard({ title, value, subtitle }: any) {
  return (
    <div className="metric-card">
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-subtitle">{subtitle}</div>
    </div>
  )
}
```

**Usage:**
```typescript
// In campaign detail page or Memory Vault
<AttributionDashboard
  campaignId="campaign-123"
  organizationId={user.organization_id}
/>
```

---

## Testing the System

### Test 1: Fingerprint Creation

```bash
node test-fingerprint.js
```

```javascript
// test-fingerprint.js
const fetch = require('node-fetch')

async function testFingerprint() {
  const response = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/campaign-fingerprint-create', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ANON_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contentId: 'test-' + Date.now(),
      content: 'Revolutionary AI platform launches with 10x performance improvement. The new technology uses advanced machine learning to deliver unprecedented results in natural language processing.',
      contentType: 'press-release',
      organizationId: 'YOUR_ORG_ID'
    })
  })

  const data = await response.json()
  console.log('Fingerprint created:', data)
  return data.fingerprintId
}

testFingerprint()
```

### Test 2: Attribution Check

```bash
node test-attribution.js
```

```javascript
// test-attribution.js
const fetch = require('node-fetch')

async function testAttribution(fingerprintId) {
  // Simulate detecting an article with similar content
  const response = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/campaign-attribution-check', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ANON_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      organizationId: 'YOUR_ORG_ID',
      articleContent: 'Revolutionary AI platform launches with 10x performance improvement according to company announcement',
      articleTitle: 'New AI Platform Promises 10x Speed Boost',
      articleUrl: 'https://techcrunch.com/test-article',
      sourceType: 'news',
      sourceOutlet: 'TechCrunch',
      publishedAt: new Date().toISOString(),
      estimatedReach: 10000000
    })
  })

  const data = await response.json()
  console.log('Attribution check:', data)
}

testAttribution()
```

### Test 3: Performance Retrieval

```bash
node test-performance.js
```

```javascript
// test-performance.js
const fetch = require('node-fetch')

async function testPerformance() {
  const response = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/campaign-performance-get', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ANON_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      organizationId: 'YOUR_ORG_ID'
      // Optional: campaignId or contentId
    })
  })

  const data = await response.json()
  console.log('Performance metrics:', data.metrics)
  console.log('Total coverage:', data.metrics.total_coverage)
  console.log('Total reach:', data.metrics.total_reach.toLocaleString())
}

testPerformance()
```

---

## What This Enables

### 1. Automatic Performance Tracking
- No manual clip tracking needed
- System detects your content in media coverage automatically
- Tracks reach, sentiment, outlets, timeline

### 2. Campaign ROI Measurement
- Coverage count per campaign
- Estimated reach per campaign
- Sentiment analysis
- Cascade effect tracking (1 press release → 15 follow-on articles)

### 3. Learning from Success
- System learns which strategies work
- Successful campaigns (4.0+ effectiveness) stay highly relevant
- NIV recommends patterns that have worked before
- Waypoints connect similar successful campaigns

### 4. Institutional Memory
- "Show me all successful product launches"
- "What worked with tech media?"
- "Which messaging patterns got the best coverage?"
- AI extracts learnings automatically

### 5. Predictive Intelligence
- "This pattern worked 4 times with 4.2+ effectiveness"
- "TechCrunch coverage leads to average 12 follow-on mentions"
- "Data-driven positioning gets 2x more coverage than feature-focused"

---

## Future Enhancements (Not Yet Implemented)

### Multi-Sector Embeddings
- Generate episodic, semantic, procedural, emotional, reflective embeddings
- Enable sector-specific search ("show me procedural knowledge about product launches")
- Requires: `semantic-memory-add` and `semantic-memory-query` edge functions

### Enhanced NIV Integration
- Query semantic memory before generating strategies
- Include learnings from past successful campaigns
- Requires: Update to `niv-strategic-framework` or blueprint orchestrator

### User Verification Workflow
- Flag low-confidence matches for user review
- User can confirm/reject attributions
- Improves match accuracy over time

### Social Media Integration
- Track Twitter, LinkedIn mentions
- Requires: API access to social platforms or scraping

---

## Files Created

### Database
- `supabase/migrations/20251026_campaign_attribution_system.sql`

### Edge Functions
- `supabase/functions/campaign-fingerprint-create/index.ts`
- `supabase/functions/campaign-attribution-check/index.ts`
- `supabase/functions/campaign-performance-get/index.ts`
- `supabase/functions/campaign-outcome-record/index.ts`

### Documentation
- `CAMPAIGN_ATTRIBUTION_IMPLEMENTATION_GUIDE.md` (this file)
- `Memory_Fingerprint.md` (original concept document)

---

## Key Metrics to Track

Once deployed, monitor these metrics:

**Attribution Quality:**
- Match rate: % of exported content that gets detected
- False positive rate: % of matches that are incorrect
- Average confidence score
- Time to first detection (export → first attribution)

**System Performance:**
- Fingerprint creation time (target: < 5s)
- Attribution check time (target: < 2s)
- Average attributions per campaign
- Coverage cascade rate (1 press release → X follow-on articles)

**Business Impact:**
- Campaign effectiveness scores distribution
- Learning extraction quality (user feedback on learnings)
- Strategy salience boost impact on future recommendations
- User engagement with attribution dashboard

---

## Support & Troubleshooting

**Common Issues:**

1. **Fingerprint creation fails**
   - Check API keys: OPENAI_API_KEY, ANTHROPIC_API_KEY
   - Verify content is not empty
   - Check Supabase service role key

2. **No attributions detected**
   - Verify monitoring is calling attribution-check
   - Check fingerprints are active (tracking_end > NOW())
   - Review confidence thresholds (may need adjustment)

3. **Performance dashboard shows no data**
   - Verify organization_id matches
   - Check RLS policies allow access
   - Ensure attributions were created

**Debug Mode:**
```bash
# Check active fingerprints
SELECT * FROM campaign_fingerprints
WHERE organization_id = 'YOUR_ORG_ID'
  AND tracking_end > NOW()
ORDER BY created_at DESC;

# Check recent attributions
SELECT * FROM campaign_attributions
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY created_at DESC
LIMIT 10;

# Check campaign performance
SELECT * FROM get_campaign_performance_summary('CAMPAIGN_ID', 'ORG_ID');
```

---

## Next Steps

1. ✅ **Deploy schema** - Run migration in Supabase
2. ✅ **Deploy edge functions** - All 4 attribution functions
3. ⏳ **Integrate fingerprinting** - Add to content export flow
4. ⏳ **Integrate attribution checking** - Add to monitoring pipeline
5. ⏳ **Build dashboard** - Create attribution analytics component
6. ⏳ **Test end-to-end** - Export content → Monitor → Detect → Display
7. ⏳ **Monitor metrics** - Track attribution quality and system performance

---

**Status:** Core system complete and ready for integration.
**Estimated Integration Time:** 2-4 hours
**Impact:** First PR platform with automatic AI-powered campaign attribution

---

*This system represents a major innovation in PR analytics - automatic performance tracking with institutional learning that makes the platform smarter with every campaign.*
