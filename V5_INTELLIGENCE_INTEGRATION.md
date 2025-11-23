# V5 Batch Scraper → Intelligence Pipeline Integration

## Overview

V5 batch scraper pre-scrapes articles daily from 88 sources. This replaces the old search-on-demand approach with a simpler, faster pipeline.

## What Changed

### Old Pipeline (Search-Based)
```
1. niv-source-direct-monitor → search web for articles
2. monitor-stage-2-relevance → AI scoring
3. monitor-stage-3-quality-control → gap detection/filling
4. monitoring-stage-2-enrichment → extract events/entities
5. mcp-executive-synthesis → create summary
6. mcp-opportunities → generate opportunities
```

### New Pipeline (Pre-Scraped)
```
1. article-selector → query raw_articles by industry
2. monitoring-stage-2-enrichment → extract events/entities
3. mcp-executive-synthesis → create summary
4. mcp-opportunities → generate opportunities
```

## New Function

### `article-selector`
**Location:** `supabase/functions/article-selector/index.ts`

**Purpose:** Select relevant articles from `raw_articles` table based on organization industry

**Input:**
```json
{
  "organization_id": "uuid",
  "organization_name": "KARV"
}
```

**Process:**
1. Get org industry from database
2. Query `raw_articles` with two strategies:
   - **Trade publications**: Auto-match by `source_registry.industries`
   - **Tier 1 sources**: Filter by `raw_metadata.industries` tag
3. Combine, deduplicate, limit to 50 articles
4. Return in format compatible with enrichment

**Output:**
```json
{
  "success": true,
  "total_articles": 45,
  "articles": [...],
  "sources": ["Bloomberg", "TechCrunch", ...],
  "industry": "technology",
  "time_window_days": 7
}
```

## Frontend Integration

Call functions separately from frontend (no orchestrator):

```typescript
// 1. Get company profile
const { data: org } = await supabase
  .from('organizations')
  .select('*')
  .eq('id', orgId)
  .single();

// 2. Select articles from V5 scraper
const articleResponse = await fetch('/functions/v1/article-selector', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    organization_id: orgId,
    organization_name: org.name
  })
});
const articles = await articleResponse.json();

// 3. Enrich articles
const enrichmentResponse = await fetch('/functions/v1/monitoring-stage-2-enrichment', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    organization_id: orgId,
    organization_name: org.name,
    profile: org.company_profile,
    articles: articles.articles  // Pass selected articles
  })
});
const enriched = await enrichmentResponse.json();

// 4. Generate synthesis
const synthesisResponse = await fetch('/functions/v1/mcp-executive-synthesis', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tool: 'synthesize_executive_intelligence',
    arguments: {
      organization_id: orgId,
      organization_name: org.name,
      enriched_data: enriched
    }
  })
});
const synthesis = await synthesisResponse.json();

// 5. Detect opportunities
const opportunityResponse = await fetch('/functions/v1/mcp-opportunities', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tool: 'detect_opportunities',
    arguments: {
      organization_id: orgId,
      organization_name: org.name,
      synthesis: synthesis.content?.[0] || synthesis,
      enriched_data: enriched
    }
  })
});
const opportunities = await opportunityResponse.json();
```

## Functions No Longer Needed

- ❌ `niv-source-direct-monitor` - Replaced by article-selector
- ❌ `monitor-stage-2-relevance` - Industry filter already applied by article-selector
- ❌ `monitor-stage-3-quality-control` - No more gap detection needed (pre-scraped everything)
- ❌ `intelligence-pipeline-simple` - Not using orchestrators (timeout issues)

## Daily Workflow

### Phase 1: Global Scraping (Once Daily)
```bash
# Run these once per day to populate raw_articles
curl -X POST "$SUPABASE_URL/functions/v1/batch-scraper-v5-orchestrator-rss"
curl -X POST "$SUPABASE_URL/functions/v1/batch-scraper-v5-orchestrator-cse"
/tmp/scrape_loop.sh  # Process queue
/tmp/tag_all_articles.sh  # Tag with industries
```

**Result:** ~1000 articles scraped and tagged with industries

### Phase 2: Per-Org Intelligence (On Demand)
```bash
# Run whenever user requests intelligence for an org
# Frontend calls the 4 functions in sequence:
# 1. article-selector
# 2. monitoring-stage-2-enrichment
# 3. mcp-executive-synthesis
# 4. mcp-opportunities
```

## Benefits

1. **Faster:** No waiting for web searches
2. **Cheaper:** Only pay for enrichment, not discovery
3. **Simpler:** Fewer functions, no orchestrators, no timeout issues
4. **Better quality:** Tier 1 sources (Bloomberg, WSJ, Reuters) now included
5. **Industry filtering:** Pre-filter before enrichment to avoid processing irrelevant articles

## Performance

**Old Pipeline:**
- Search: ~60-120s
- Relevance: ~20-30s
- Quality control: ~15-30s
- Enrichment: ~30-40s
- **Total: 2-4 minutes**

**New Pipeline:**
- Article selection: ~2s (database query)
- Enrichment: ~30-40s
- Synthesis: ~20s
- Opportunities: ~15s
- **Total: ~70-80 seconds**

## Next Steps

1. ✅ Deploy `article-selector` function
2. Update frontend to call new pipeline
3. Test with one organization
4. Remove old functions once confirmed working
5. Schedule daily V5 scraping via cron

## Testing

```bash
# Test article selector
curl -X POST "https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/article-selector" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "29a1be32-5692-473b-8c05-5dd57764f328",
    "organization_name": "KARV"
  }'
```
