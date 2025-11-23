# Batch Scraper V4 Architecture

## Problem with V3

**V3 was misusing Firecrawl Extract API:**
- Extract API is designed for **structured data extraction** (products, team members), NOT article discovery
- Using `domain.com/*` crawls entire domain expensively with poor results
- 58 out of 88 sources had no RSS feeds, including Bloomberg, WSJ, Reuters, Forbes
- Extract API returned 0 articles for most sources (not designed for "find recent news")

## V4 Solution: Multi-Step Pipeline

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1: Discovery Phase (batch-scraper-v4-discovery)  │
│  Finds article URLs using RSS + Google CSE              │
│  Stores URLs in raw_articles table                      │
│  Runs every 4-6 hours via cron                          │
└──────────────────────────┬──────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 2: Content Extraction (batch-content-extractor)  │
│  Scrapes full content from discovered URLs              │
│  Uses Firecrawl Scrape API (not Extract!)              │
│  Processes 100 articles per run                         │
│  Runs continuously in background                        │
└──────────────────────────┬──────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 3: AI Processing (future)                        │
│  Categorizes articles by industry, topics, entities    │
│  Stores in processed_articles table                     │
└─────────────────────────────────────────────────────────┘
```

## Discovery Methods

### Tier 1: RSS (30 sources)
- **Sources**: TechCrunch, MIT Tech Review, Semafor, etc.
- **Method**: Parse XML feeds
- **Cost**: Free
- **Speed**: ~1-2 seconds per source
- **Reliability**: High for sources with feeds

### Tier 2: Google Custom Search Engine (58 sources)
- **Sources**: Bloomberg, WSJ, Reuters, Forbes, The Verge, etc.
- **Method**: `site:bloomberg.com after:2025-11-21`
- **Cost**: 100 queries/day free, then $5/1000
- **Speed**: ~500ms per search
- **Reliability**: High, finds recent articles

### Tier 3: Firecrawl Observer (11 sources)
- **Sources**: McKinsey, BCG, Gartner, PR industry pubs
- **Method**: Still using Firecrawl Extract for specialized content
- **Cost**: Variable based on content
- **Use case**: Industry research, consulting reports

## Database Flow

```sql
-- Discovery phase populates this:
raw_articles {
  url (UNIQUE),          -- Deduplication
  title,
  description,
  published_at,
  full_content (NULL),   -- Filled by content extractor
  processed (false)      -- Filled by AI processor
}

-- Content extraction fills:
raw_articles.full_content = markdown from Firecrawl Scrape

-- AI processing fills:
processed_articles {
  industries,
  topics,
  companies_mentioned,
  sentiment,
  quality_score
}
```

## API Comparison

| Feature | Extract API (V3) | Scrape API (V4) |
|---------|------------------|-----------------|
| Purpose | Extract structured data | Get page content |
| Input | Domain pattern | Specific URLs |
| Use case | "Get all products" | "Get this article" |
| Cost | High (crawls everything) | Low (targeted) |
| Speed | Slow (discovers + scrapes) | Fast (just scrapes) |
| Best for | E-commerce, directories | News, articles |

## Deployment

### Edge Functions
1. **batch-scraper-v4-discovery**
   - Discovers URLs via RSS + Google CSE
   - Stores in `raw_articles` with `full_content = NULL`
   - Runs every 4-6 hours

2. **batch-content-extractor**
   - Queries `raw_articles WHERE full_content IS NULL`
   - Uses Firecrawl Scrape API to get content
   - Updates `raw_articles.full_content`
   - Runs continuously, processes 100 articles per run

### Cron Jobs (Recommended)
```
# Discovery: Every 6 hours
0 */6 * * * curl -X POST https://[...]/batch-scraper-v4-discovery

# Content extraction: Every 15 minutes
*/15 * * * * curl -X POST https://[...]/batch-content-extractor
```

## Benefits

1. **Separation of Concerns**
   - Discovery is lightweight and fast
   - Content extraction can retry failures
   - No timeout issues

2. **Cost Optimization**
   - RSS is free
   - Google CSE is cheap (100 free/day)
   - Only scrape what we discovered

3. **Better Error Handling**
   - Failed discovery doesn't block content extraction
   - Failed content extraction doesn't lose discovered URLs
   - Can retry content extraction independently

4. **Scalability**
   - Discovery runs infrequently (every 4-6 hours)
   - Content extraction runs often (every 15 min)
   - Can process backlog of URLs gradually

## Migration Path

1. ~~Deploy new Edge Functions~~ ✅
2. Update `source_registry` with correct `monitor_method`
3. Run discovery phase to populate URLs
4. Run content extractor to fill article content
5. Decommission V3 batch-scraper-orchestrator

## Google CSE Setup

✅ **Already configured!**
- Edge Function: `niv-google-cse`
- CSE ID: `d103f3ed8289a4917`
- Uses existing `GOOGLE_API_KEY` env var
- Supports 360+ news domains
- V4 discovery function calls this Edge Function internally
