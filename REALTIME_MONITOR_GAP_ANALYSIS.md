# Real-Time Intelligence Monitor Gap Analysis

**Date:** 2025-10-01
**Analysis:** Comparison between working executive synthesis pipeline and broken real-time monitor

---

## Executive Summary

The **executive synthesis pipeline** (intelligence-orchestrator-v2, monitor-stage-1, monitor-stage-2-relevance, monitor-stage-2-enrichment) produces high-quality, fresh, dated intelligence. The **real-time monitor** (real-time-intelligence-orchestrator, niv-fireplexity-monitor) pulls in stale, low-quality, undated stories with invalid links.

**Root Cause:** The real-time system uses `niv-fireplexity-monitor` which generates keyword-based queries that return generic, non-specific results without proper date validation or source quality checks. Meanwhile, the working pipeline uses curated RSS feeds, explicit date filtering (48-hour window), and robust validation at every stage.

---

## Critical Gaps Identified

### 1. Data Source Quality

#### ✅ WORKING Pipeline (monitor-stage-1)
- **Primary Source:** Curated RSS feeds from `master-source-registry`
- **Prioritized feeds:** Critical → High → Medium → Low
- **Industry-specific sources** for automotive (Tesla): TechCrunch, WSJ, FT, Electrek, InsideEVs
- **Direct scraping** of competitor sites via `mcp-scraper`
- **Fallback only:** Google News RSS, NewsAPI (limited to 10-30 results)
- **Date filtering:** EXPLICIT 48-hour window filter (lines 717-727)
```typescript
// Filter to only keep articles from last 48 hours
const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
allArticlesArray = allArticlesArray.filter(article => {
  const articleDate = new Date(article.published_at || article.publishedAt || 0);
  return articleDate > twoDaysAgo;
});
```

#### ❌ BROKEN Real-Time System (niv-fireplexity-monitor)
- **Primary Source:** Fireplexity search API with generic keyword queries
- **Query generation (lines 395-423):**
  - Crisis terms: `"Tesla" recall`, `"Tesla" lawsuit`, etc.
  - Competitor queries: `"Ford" AND "Tesla"` (vague, not specific)
  - Generic: `"Tesla" breaking news`
- **No RSS feeds** used at all
- **No curated sources** from registry
- **No direct scraping** of reliable sites
- **Weak date filtering:** Relies on Fireplexity's `recency_window` parameter (30min/6hours/24hours) but doesn't validate actual publish dates
- **Date validation is PERMISSIVE** (lines 138-145):
```typescript
const recentResults = rawResults.filter(r => {
  const publishDateStr = r.published || r.date || r.published_at;
  if (!publishDateStr) {
    return true; // Include articles WITHOUT dates!
  }
  const publishDate = new Date(publishDateStr);
  return publishDate > cutoffTime;
});
```
This means articles **without dates are included**, leading to stale content.

---

### 2. Date Extraction and Validation

#### ✅ WORKING Pipeline
**monitor-stage-1** (lines 36-48):
- RSS feeds provide structured `publishedAt` or `pubDate` fields
- Explicit date filter: **ONLY last 48 hours**
- Date distribution logging (lines 876-896) shows exact article age breakdown
- Articles older than 48 hours are **rejected completely**

**monitor-stage-2-relevance** (no additional date filtering needed):
- Receives only 48-hour-filtered articles
- Focuses on relevance scoring, not date validation

**monitor-stage-2-enrichment** (lines 845-874):
- Logs article timeframe for debugging
- Shows newest/oldest articles
- Age distribution: last 24h, 3 days, 7 days
- Already clean due to stage-1 filtering

#### ❌ BROKEN Real-Time System
**niv-fireplexity-monitor**:
- Relies on Fireplexity search API's date parsing
- **Includes articles without dates** (line 141: `return true`)
- No explicit date validation or extraction
- No structured date fields from search results

**real-time-intelligence-orchestrator**:
- Assumes Fireplexity results are dated
- No date validation before processing
- Only validates dates in assessment stage (lines 129-145) but **still includes undated articles**

---

### 3. Source Quality Validation

#### ✅ WORKING Pipeline
**monitor-stage-1**:
- RSS feeds from known, reliable sources (WSJ, FT, Reuters, Bloomberg)
- Source tier classification: `critical`, `high`, `medium`, `low` (line 587)
- Source category: `competitive`, `market`, `regulatory`, `media` (line 588)
- HTML cleaning for Google News (lines 569-572)
- Relevance filtering with `isRelevantArticle()` function (lines 397-479)

**monitor-stage-2-relevance**:
- Sophisticated relevance scoring (lines 296-606)
- Filters by entity mentions, intelligence type, actionable signals
- **Tiered scraping strategy** (lines 780-807):
  - Tier 1 (score 80+): Scrape ALL
  - Tier 2 (score 60-79): Scrape 80%
  - Tier 3 (score 40-59): Scrape 40%
- MCP Firecrawl for **batch content enrichment** (lines 810-936)
- **Content quality validation** (lines 893-912):
```typescript
const hasSubstantialContent = markdown &&
  markdown.length > 500 &&
  !/<[^>]+>/g.test(markdown.substring(0, 200)) &&
  markdown.split(' ').length > 50;
```

**monitor-stage-2-enrichment**:
- **HTML garbage detection** (lines 16-79):
  - Strips HTML tags and entities
  - Filters navigation patterns (`Log In`, `Subscribe`, `Cookie`)
  - Detects UUIDs and URL fragments
  - Validates special character ratio
- `isValidContent()` function ensures quality (lines 26-79)
- `stripHtmlTags()` removes markup (lines 17-24)

#### ❌ BROKEN Real-Time System
**niv-fireplexity-monitor**:
- Basic garbage filtering with `isRealArticle()` (lines 501-543):
  - Some navigation patterns detected
  - Minimal content length check (50 chars)
- **NO HTML cleaning**
- **NO source tier classification**
- **NO tiered scraping strategy**

**real-time-intelligence-orchestrator**:
- No additional source validation
- Relies entirely on Fireplexity's result quality
- No HTML cleaning or garbage detection

---

### 4. Content Enrichment

#### ✅ WORKING Pipeline
**MCP Firecrawl Integration (monitor-stage-2-relevance, lines 810-936)**:
- Batch scraping with tiered priority
- Extract quotes, metrics, entities, key points
- Schema-based extraction:
```typescript
extractSchema: {
  quotes: { type: 'array', items: { type: 'string' } },
  metrics: { type: 'object', properties: { financial: ..., percentages: ... } },
  entities: { type: 'object', properties: { companies: ..., people: ... } },
  key_points: { type: 'array', items: { type: 'string' } }
}
```
- **Quality validation before marking `has_full_content=true`** (lines 893-912)

**Claude Analysis (monitor-stage-2-enrichment, lines 93-250)**:
- Deep analysis of full-content articles
- Extracts events, entities, quotes, metrics, insights
- Discovery target matching
- Strategic implications analysis
- Batch processing (30 articles at once)

#### ❌ BROKEN Real-Time System
**Limited Enrichment**:
- Calls `monitoring-stage-2-enrichment` (lines 262-291)
- But receives **low-quality input** from Fireplexity
- No MCP Firecrawl scraping
- No tiered priority strategy

---

### 5. Intelligence Types and Categorization

#### ✅ WORKING Pipeline
**Sophisticated Intelligence Typing (monitor-stage-2-relevance, lines 307-566)**:
- `competitor_action`: Product launches, strategic moves, crises
- `competitor_mention`: General competitor coverage
- `market_comparison`: Multi-competitor analysis
- `comparative_analysis`: Org vs competitors
- `org_positive`: Organization opportunities
- `org_crisis`: Organization risks
- `regulatory_action`: Regulatory news
- `technology`: Tech innovations
- `financial`: Financial data
- `strategic`: Strategic moves

**Actionable Signal Detection (lines 307-313)**:
- Product launches
- Financial data
- Leadership changes
- Crisis events
- Strategic moves
- Technology updates

#### ❌ BROKEN Real-Time System
**Basic Categorization (real-time-intelligence-orchestrator)**:
- Claude assessment creates simple categories: `crisis`, `opportunity`, `competitive`, `regulatory`, `general` (line 204)
- No sophisticated intelligence typing
- No actionable signal detection
- No tiered urgency system

---

### 6. MCP Tool Usage

#### ✅ WORKING Pipeline Uses:
1. **mcp-discovery**: Organization profiling with intelligence context
2. **master-source-registry**: Curated RSS feed sources
3. **rss-proxy**: RSS feed fetching
4. **mcp-firecrawl**: Batch article scraping with schema extraction
5. **mcp-scraper**: Direct website scraping
6. **mcp-social-intelligence**: Social signals (Twitter, Reddit)

#### ❌ BROKEN Real-Time System Uses:
1. **niv-fireplexity**: Search API (unreliable results)
2. **monitoring-stage-2-enrichment**: But with poor input quality
3. **mcp-opportunity-detector**: But receives garbage data
4. **mcp-crisis**: But receives garbage data

**Missing Critical Tools:**
- **No master-source-registry**
- **No mcp-firecrawl** for content enrichment
- **No rss-proxy** for reliable feeds
- **No mcp-social-intelligence**

---

## Data Flow Comparison

### ✅ WORKING Pipeline Flow

```
1. monitor-stage-1
   ├─ master-source-registry → Curated RSS feeds (TechCrunch, WSJ, etc.)
   ├─ rss-proxy → Fetch RSS articles
   ├─ EXPLICIT 48-hour date filter
   ├─ Claude assessment (priority articles, coverage gaps)
   ├─ Gap-filling searches (Google News, NewsAPI - LIMITED)
   └─ Output: ~100 fresh, dated, categorized articles

2. monitor-stage-2-relevance
   ├─ Input: 100 articles from stage-1
   ├─ Relevance scoring (entity mentions, intelligence types)
   ├─ Coverage gap analysis
   ├─ Tiered scraping strategy (top 30 articles)
   ├─ mcp-firecrawl → Batch scraping with quality validation
   └─ Output: ~50 high-relevance articles with full content

3. monitoring-stage-2-enrichment
   ├─ Input: 50 articles with full content
   ├─ HTML garbage detection and cleaning
   ├─ Claude deep analysis (events, entities, quotes, metrics)
   ├─ Pattern-based extraction fallback
   ├─ Topic clustering
   └─ Output: Organized intelligence (events, entities, quotes, metrics)

4. intelligence-orchestrator-v2
   ├─ Input: Enriched intelligence
   ├─ mcp-executive-synthesis → Comprehensive analysis
   ├─ mcp-opportunity-detector → Opportunity signals
   ├─ opportunity-orchestrator-v2 → Strategic playbooks
   └─ Output: Executive synthesis + opportunities + statistics
```

### ❌ BROKEN Real-Time Flow

```
1. niv-fireplexity-monitor
   ├─ Build generic keyword queries ("Tesla" recall, etc.)
   ├─ niv-fireplexity search → Unreliable results
   ├─ WEAK date filter (includes undated articles!)
   ├─ Basic garbage detection
   ├─ Relevance scoring (keyword matching)
   └─ Output: Mixed quality results (some stale, some invalid)

2. real-time-intelligence-orchestrator
   ├─ Input: Fireplexity results
   ├─ Date filter (but includes undated articles)
   ├─ Deduplication
   ├─ Claude assessment (tries to filter noise)
   ├─ monitoring-stage-2-enrichment (but garbage in → garbage out)
   ├─ Real-time synthesis
   └─ Output: Brief with stale/invalid data
```

---

## Specific Code Fixes Needed

### Fix 1: Replace Fireplexity with RSS Feeds

**Current (broken):**
```typescript
// niv-fireplexity-monitor lines 108-119
let queries = buildCompanySpecificQueries(config.organization_name, config);
const response = await fetch(`${supabaseUrl}/functions/v1/niv-fireplexity`, {
  method: 'POST',
  body: JSON.stringify({ query, searchMode: 'focused', recency: recency_window })
});
```

**Fix (use monitor-stage-1 approach):**
```typescript
// Use master-source-registry for RSS feeds
const sources = await fetch(`${supabaseUrl}/functions/v1/master-source-registry`, {
  method: 'POST',
  body: JSON.stringify({ industry: profile.industry })
});

// Fetch from RSS feeds in parallel
const feedPromises = sources.data.map(source =>
  fetch(`${supabaseUrl}/functions/v1/rss-proxy`, {
    method: 'POST',
    body: JSON.stringify({ url: source.url })
  })
);
```

### Fix 2: Implement Explicit 48-Hour Date Filter

**Current (broken):**
```typescript
// real-time-intelligence-orchestrator lines 138-145
const recentResults = rawResults.filter(r => {
  const publishDateStr = r.published || r.date || r.published_at;
  if (!publishDateStr) {
    return true; // WRONG: Includes undated articles!
  }
  return publishDate > cutoffTime;
});
```

**Fix:**
```typescript
const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

const recentResults = rawResults.filter(r => {
  const publishDateStr = r.published || r.date || r.published_at;

  // STRICT: Reject articles without dates
  if (!publishDateStr) {
    console.log(`⚠️ Rejecting undated article: "${r.title?.substring(0, 50)}"`);
    return false;
  }

  const publishDate = new Date(publishDateStr);

  // Validate date is reasonable (not in future, not too old)
  if (isNaN(publishDate.getTime()) || publishDate > new Date() || publishDate < twoDaysAgo) {
    console.log(`⚠️ Rejecting invalid date: ${publishDateStr} for "${r.title?.substring(0, 50)}"`);
    return false;
  }

  return true;
});
```

### Fix 3: Add HTML Garbage Detection

**Add to real-time-intelligence-orchestrator:**
```typescript
// Import from monitoring-stage-2-enrichment
function stripHtmlTags(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isValidContent(text: string): boolean {
  if (!text || text.length < 50) return false;

  const htmlGarbagePatterns = [
    /<[^>]+>/, /&[^;]+;/, /ft-content-uuid/i,
    /What's included/i, /Log In|Sign Up/i, /Cookie/i
  ];

  const navigationPatterns = [
    /\]\s*\[/, /Stock Lists|IBD 50/i, /Follow topics/i
  ];

  if (htmlGarbagePatterns.some(p => p.test(text))) return false;
  if (navigationPatterns.some(p => p.test(text))) return false;

  const words = text.split(/\s+/).filter(w => w.length > 2);
  if (words.length < 8) return false;

  return true;
}

// Apply to articles
const validArticles = articles.filter(a =>
  isValidContent(a.title) && isValidContent(a.content || a.snippet)
);
```

### Fix 4: Add MCP Firecrawl for Content Enrichment

**Add to real-time-intelligence-orchestrator after Claude assessment:**
```typescript
// Stage 4: Content enrichment via Firecrawl (top articles only)
const topArticles = filteredArticles.slice(0, 20); // Top 20 by relevance

const firecrawlResponse = await fetch(`${SUPABASE_URL}/functions/v1/mcp-firecrawl`, {
  method: 'POST',
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'batch_scrape_articles',
      arguments: {
        articles: topArticles.map(a => ({
          url: a.url,
          priority: a.claude_assessment?.urgency === 'immediate' ? 100 : 80,
          metadata: { title: a.title }
        })),
        formats: ['markdown'],
        extractSchema: {
          quotes: { type: 'array', items: { type: 'string' } },
          metrics: { type: 'object' },
          entities: { type: 'object' },
          key_points: { type: 'array' }
        }
      }
    }
  })
});

// Validate and merge enriched content
const scrapeResults = await firecrawlResponse.json();
for (const result of scrapeResults.results) {
  if (result.success && result.data) {
    const article = topArticles.find(a => a.url === result.url);
    const markdown = result.data.markdown || result.data.content || '';

    // Quality validation (same as monitor-stage-2-relevance)
    const hasSubstantialContent = markdown &&
      markdown.length > 500 &&
      !/<[^>]+>/g.test(markdown.substring(0, 200)) &&
      markdown.split(' ').length > 50;

    if (hasSubstantialContent && article) {
      article.full_content = markdown;
      article.has_full_content = true;
      article.firecrawl_extracted = result.extracted;
    }
  }
}
```

### Fix 5: Add Source Quality Tiers

**Add to niv-fireplexity-monitor:**
```typescript
// Classify sources by tier (like monitor-stage-1)
function classifySource(url: string): { tier: string, category: string } {
  const domain = new URL(url).hostname.toLowerCase();

  // Critical tier sources
  if (['wsj.com', 'ft.com', 'reuters.com', 'bloomberg.com'].some(d => domain.includes(d))) {
    return { tier: 'critical', category: 'market' };
  }

  // High tier sources
  if (['techcrunch.com', 'electrek.co', 'insideevs.com', 'theverge.com'].some(d => domain.includes(d))) {
    return { tier: 'high', category: 'competitive' };
  }

  // Medium tier (news aggregators)
  if (['cnn.com', 'cnbc.com', 'forbes.com'].some(d => domain.includes(d))) {
    return { tier: 'medium', category: 'media' };
  }

  return { tier: 'low', category: 'general' };
}

// Apply to results
const classifiedResults = results.map(r => ({
  ...r,
  ...classifySource(r.url),
  source_reliability: calculateReliability(r)
}));
```

---

## Implementation Plan

### Phase 1: Critical Fixes (Immediate)

1. **Replace Fireplexity with RSS feeds** in `niv-fireplexity-monitor`
   - Use `master-source-registry` for curated sources
   - Implement parallel RSS fetching via `rss-proxy`
   - Add fallback to Fireplexity only for gap-filling

2. **Implement strict 48-hour date filter** in `real-time-intelligence-orchestrator`
   - Reject articles without dates
   - Validate date ranges (not in future, not too old)
   - Log rejected articles for debugging

3. **Add HTML garbage detection** to both files
   - Import `stripHtmlTags()` and `isValidContent()` from enrichment
   - Apply to all content before processing
   - Filter out navigation patterns, UUIDs, subscription prompts

### Phase 2: Content Enrichment (High Priority)

4. **Integrate MCP Firecrawl** for top 20 articles
   - Implement tiered scraping strategy
   - Add content quality validation
   - Extract quotes, metrics, entities via schema

5. **Add source quality tiers**
   - Classify sources as critical/high/medium/low
   - Prioritize critical sources in final output
   - Weight relevance scores by source tier

### Phase 3: Intelligence Typing (Medium Priority)

6. **Enhance categorization** to match working pipeline
   - Add actionable signal detection (launches, crises, moves)
   - Implement intelligence types (competitor_action, regulatory_action, etc.)
   - Add urgency levels (immediate, this_week, informational)

7. **Add MCP Social Intelligence**
   - Integrate `mcp-social-intelligence` for Twitter/Reddit signals
   - Cross-reference social sentiment with news
   - Detect volume spikes and sentiment shifts

### Phase 4: Optimization (Low Priority)

8. **Implement Claude assessment at stage-1** (like monitor-stage-1)
   - Use Claude to prioritize articles
   - Generate coverage reports
   - Identify gaps for targeted searches

9. **Add coverage gap analysis**
   - Track competitor/stakeholder/topic coverage
   - Smart gap-filling with targeted searches
   - Diversity bonus for multi-topic articles

---

## Testing Checklist

After implementing fixes, validate:

- [ ] All articles have valid publish dates (within 48 hours)
- [ ] No HTML garbage in titles or descriptions
- [ ] Articles from reliable sources (WSJ, FT, TechCrunch, etc.)
- [ ] Full content enrichment for top articles
- [ ] Quotes, metrics, entities extracted correctly
- [ ] Intelligence types assigned properly
- [ ] Urgency levels reflect actual time-sensitivity
- [ ] No stale articles (older than 48 hours)
- [ ] No invalid URLs or broken links
- [ ] Source quality tiers applied
- [ ] Coverage of key competitors/stakeholders/topics

---

## Expected Outcomes

After implementing these fixes, the real-time monitor should:

1. **Only return fresh articles** (last 48 hours, dated)
2. **Use high-quality sources** (RSS feeds from curated registry)
3. **Have clean content** (no HTML garbage, navigation elements, or UUIDs)
4. **Provide full article text** for top stories (via MCP Firecrawl)
5. **Extract structured intelligence** (events, entities, quotes, metrics)
6. **Match working pipeline quality** (same validation, enrichment, typing)

---

## Key Learnings

### What the Working Pipeline Does Right:
1. **Curated sources first**, APIs as fallback
2. **Explicit date validation** at every stage
3. **HTML garbage detection** with comprehensive patterns
4. **Tiered content enrichment** based on priority
5. **Quality validation** before marking content as "full"
6. **Sophisticated intelligence typing** for actionable insights
7. **Coverage gap analysis** for complete picture
8. **MCP tool integration** for each specialized task

### What Real-Time System Does Wrong:
1. **Generic search queries** instead of curated feeds
2. **Permissive date handling** (includes undated articles)
3. **No HTML cleaning** or garbage detection
4. **No content enrichment** via Firecrawl
5. **No quality validation** on scraped content
6. **Basic categorization** without intelligence types
7. **Missing MCP tools** (firecrawl, social-intelligence, scraper)
8. **Relies on single unreliable source** (Fireplexity)

---

## Conclusion

The real-time monitor needs to **reuse the working pipeline's components** instead of reimplementing from scratch. Specifically:

1. **Use monitor-stage-1's RSS feed approach** for data collection
2. **Use monitor-stage-2-relevance's Firecrawl integration** for content enrichment
3. **Use monitoring-stage-2-enrichment's HTML cleaning** for quality validation
4. **Maintain explicit 48-hour date filtering** throughout the pipeline

The core issue is **"garbage in, garbage out"** - Fireplexity provides unreliable input, which cascades into poor intelligence. By switching to the curated RSS feed approach and adding proper validation, the real-time monitor will produce the same high-quality results as the executive synthesis pipeline.
