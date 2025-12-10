# Batch Scraper V5 - Split Orchestrator Architecture

## Overview

Batch Scraper V5 is a complete rewrite that splits discovery into multiple separate Edge Functions to avoid timeout issues and leverages mcp-firecrawl for parallel batch scraping. The system uses a queue-based architecture with priority scheduling, followed by metadata extraction for intelligent article filtering.

## Why V5?

**V4 Problems:**
- Single orchestrator tried to process RSS + Google CSE in one run
- Timed out after ~2:30 minutes processing 44 RSS sources
- Never reached Google CSE phase where premium Tier 1 sources (Bloomberg, WSJ, Reuters) are discovered
- Result: Missing all major financial news sources

**V5 Solutions:**
- Split into four independent discovery orchestrators (RSS, CSE, Sitemap, Fireplexity)
- Each completes quickly without timeout
- Queue-based scraping via separate worker
- Metadata extraction for topics, entities, and summaries
- Leverages existing mcp-firecrawl for parallel batching

## Architecture

### Six Edge Functions

#### 1. `batch-scraper-v5-orchestrator-rss`
**Purpose:** Discover article URLs from RSS feeds only

**Process:**
- Queries `source_registry` for sources where `monitor_method='rss'`
- Tries common RSS URL patterns (`/rss`, `/feed`, `/rss.xml`, etc.)
- Parses XML to extract article metadata
- Inserts new URLs into `raw_articles` with `scrape_status='pending'`
- Deduplicates against existing URLs

**Performance:**
- Processes ~44 RSS sources
- Completes in ~60 seconds
- Discovers 500-800 articles per run

**Trigger:** Manual or scheduled (2-4x per day)

#### 2. `batch-scraper-v5-orchestrator-cse`
**Purpose:** Discover article URLs from Google Custom Search Engine

**Process:**
- Queries `source_registry` for sources where `monitor_method='google_cse'`
- Calls `niv-google-cse` Edge Function for each source
- Searches for `site:{domain} after:{7_days_ago}`
- Processes in batches of 10 with 2-second delays (API quota)
- Inserts discovered URLs into `raw_articles` with `scrape_status='pending'`

**Performance:**
- Processes ~44 Google CSE sources (Tier 1 premium sources)
- Completes in ~13 seconds for first batch of 44 sources
- Discovers 200-300 articles per run
- Includes Bloomberg, WSJ, Reuters, Financial Times, Forbes, CNBC

**Trigger:** Manual or scheduled (2-4x per day)

#### 3. `batch-scraper-v5-orchestrator-sitemap`
**Purpose:** Discover article URLs from XML sitemaps

**Process:**
- Queries `source_registry` for sources where `monitor_method='sitemap'`
- Fetches and parses sitemap.xml or sitemap-news.xml
- Filters URLs by lastmod date (last 7 days)
- Inserts discovered URLs into `raw_articles` with `scrape_status='pending'`
- Deduplicates against existing URLs

**Performance:**
- Processes ~13 sitemap sources
- Completes in ~2-5 seconds
- Discovers 20-50 articles per run

**Trigger:** Manual or scheduled (2-4x per day)

#### 4. `batch-scraper-v5-orchestrator-fireplexity`
**Purpose:** Discover article URLs via Fireplexity integration

**Process:**
- Uses Fireplexity API for specialized source discovery
- Targets sources not accessible via RSS or CSE
- Inserts discovered URLs into `raw_articles` with `scrape_status='pending'`

**Trigger:** Manual or scheduled (2-4x per day)

#### 5. `batch-scraper-v5-worker`
**Purpose:** Scrape full content for articles in the queue

**Process:**
- Queries `raw_articles` for articles where:
  - `full_content IS NULL`
  - `scrape_status IN ('pending', 'failed')`
  - `scrape_attempts < 3`
- Orders by `scrape_priority ASC, created_at DESC` (Tier 1 first)
- Processes 10 articles per run
- Calls `mcp-firecrawl` with `batch_scrape_articles` tool
- mcp-firecrawl handles parallel batching (5 at a time) internally
- Updates `raw_articles` with scraped content or error

**Performance:**
- Processes 10 articles per run in ~8 seconds
- High success rate with automatic retries
- mcp-firecrawl provides 24hr caching and intelligent rate limiting

**Trigger:** Loop script or scheduled (runs until queue empty)

#### 6. `batch-metadata-orchestrator`
**Purpose:** Extract metadata (topics, entities, summaries) from scraped articles

**Process:**
- Queries `raw_articles` where `scrape_status='completed'` AND `extracted_metadata IS NULL`
- Spawns parallel calls to `extract-article-metadata` function
- Processes 10 articles per batch, 5 batches in parallel
- Uses Claude to extract:
  - Topics/categories
  - Named entities (people, companies, locations)
  - Article summary
  - Signals (paywall detection, content quality)

**Performance:**
- Processes 50 articles per orchestrator run
- ~30 seconds per run
- 95%+ success rate

**Trigger:** After worker completes, or scheduled

### Supporting Function

#### `extract-article-metadata`
**Purpose:** Extract metadata from a batch of articles using Claude

**Process:**
- Receives batch of article IDs
- Fetches full_content for each article
- Sends to Claude Haiku for extraction
- Updates `extracted_metadata` JSONB column

**Output Schema:**
```json
{
  "topics": ["technology", "ai"],
  "summary": "Brief article summary...",
  "entities": {
    "people": ["John Smith"],
    "companies": ["Acme Corp"],
    "locations": ["New York"],
    "technologies": ["GPT-4"]
  },
  "signals": {
    "has_content": true,
    "has_paywall": false,
    "word_count": 1500,
    "confidence": "high"
  },
  "temporal": {
    "age_hours": 12.5
  }
}
```

## Database Schema

### `raw_articles` Table - New V5 Fields

```sql
-- Queue Management Fields (added in V5)
scrape_priority INTEGER DEFAULT 2
  -- Priority for scraping based on source tier
  -- 1 = High (Tier 1 sources: Bloomberg, WSJ, Reuters)
  -- 2 = Medium (Tier 2 sources: Industry publications)
  -- 3 = Low (Tier 3 sources: General news)

scrape_status TEXT DEFAULT 'pending'
  -- Queue status tracking
  -- 'pending' = Waiting to be scraped
  -- 'processing' = Currently being scraped
  -- 'completed' = Successfully scraped
  -- 'failed' = Scraping failed (will retry if attempts < 3)
  -- 'metadata_only' = URL/title/date captured, no content scrape (for blocked sources like Bloomberg)

scrape_attempts INTEGER DEFAULT 0
  -- Number of times scraping was attempted
  -- Worker retries up to 3 times before giving up

last_scrape_attempt TIMESTAMPTZ
  -- Timestamp of most recent scrape attempt
  -- Used for monitoring and retry logic

-- Existing Fields (from V4)
id UUID PRIMARY KEY
source_id UUID REFERENCES source_registry(id)
source_name TEXT
url TEXT UNIQUE
title TEXT
description TEXT
author TEXT
published_at TIMESTAMPTZ
full_content TEXT  -- Populated by worker
content_length INTEGER
scraped_at TIMESTAMPTZ
processed BOOLEAN DEFAULT FALSE
raw_metadata JSONB
  -- Contains:
  -- - discovery_method: 'rss', 'google_cse', 'sitemap', or 'fireplexity'
  -- - scraping_method: 'mcp_firecrawl' (V5)
  -- - cached: boolean (from mcp-firecrawl)
  -- - rss_feed or cse_snippet

extracted_metadata JSONB
  -- Populated by batch-metadata-orchestrator
  -- Contains:
  -- - topics: string[] (article categories)
  -- - summary: string (brief article summary)
  -- - entities: {people, companies, locations, technologies}
  -- - signals: {has_content, has_paywall, word_count, confidence}
  -- - temporal: {age_hours}
```

### Indexes for Performance

```sql
-- V5: Queue processing (worker queries)
CREATE INDEX idx_raw_articles_scrape_queue
  ON raw_articles(scrape_status, scrape_priority, created_at)
  WHERE full_content IS NULL;

-- V5: Retry queries
CREATE INDEX idx_raw_articles_scrape_retry
  ON raw_articles(scrape_status, scrape_attempts, last_scrape_attempt)
  WHERE full_content IS NULL AND scrape_attempts < 3;
```

### `source_registry` Table

```sql
id UUID PRIMARY KEY
source_name TEXT UNIQUE
source_url TEXT
monitor_method TEXT
  -- 'rss' = RSS feed scraping (batch-scraper-v5-orchestrator-rss)
  -- 'google_cse' = Google Custom Search (batch-scraper-v5-orchestrator-cse)
  -- 'sitemap' = XML sitemap scraping (batch-scraper-v5-orchestrator-sitemap)
  -- 'fireplexity' = Fireplexity integration (batch-scraper-v5-orchestrator-fireplexity)

tier INTEGER
  -- 1 = Premium sources (Bloomberg, WSJ, Reuters, Financial Times)
  -- 2 = Industry publications (TechCrunch, Wired, Semafor)
  -- 3 = General news

active BOOLEAN DEFAULT TRUE
industries TEXT[]
last_successful_scrape TIMESTAMPTZ
consecutive_failures INTEGER
```

### `batch_scrape_runs` Table

```sql
id UUID PRIMARY KEY
run_type TEXT
  -- 'rss_discovery' = RSS orchestrator run
  -- 'cse_discovery' = Google CSE orchestrator run
  -- 'worker' = Not tracked (continuous operation)

status TEXT
  -- 'running', 'completed', 'partial', 'failed'

triggered_by TEXT
sources_targeted INTEGER
sources_successful INTEGER
sources_failed INTEGER
articles_discovered INTEGER
articles_new INTEGER
duration_seconds INTEGER
error_summary JSONB
created_at TIMESTAMPTZ
completed_at TIMESTAMPTZ
```

## Workflow

### Daily Batch Scraping (Recommended)

```bash
# Step 1: Discover URLs from all sources (run in parallel)
curl -X POST "https://{project}.supabase.co/functions/v1/batch-scraper-v5-orchestrator-rss" \
  -H "Authorization: Bearer {service_key}"

curl -X POST "https://{project}.supabase.co/functions/v1/batch-scraper-v5-orchestrator-cse" \
  -H "Authorization: Bearer {service_key}"

curl -X POST "https://{project}.supabase.co/functions/v1/batch-scraper-v5-orchestrator-sitemap" \
  -H "Authorization: Bearer {service_key}"

curl -X POST "https://{project}.supabase.co/functions/v1/batch-scraper-v5-orchestrator-fireplexity" \
  -H "Authorization: Bearer {service_key}"

# Step 2: Scrape all queued articles (loop until queue empty)
# See /tmp/scrape_loop.sh for automated loop
curl -X POST "https://{project}.supabase.co/functions/v1/batch-scraper-v5-worker" \
  -H "Authorization: Bearer {service_key}"

# Step 3: Extract metadata from scraped articles
curl -X POST "https://{project}.supabase.co/functions/v1/batch-metadata-orchestrator" \
  -H "Authorization: Bearer {service_key}" \
  -d '{"limit": 500}'
```

### Query Queue Status

```bash
node /tmp/check_v5_queue.mjs
```

Output:
```
📊 V5 Scrape Queue Status:
   Total articles: 1000
   ⏳ Pending: 0
   🔄 Processing: 31
   ✅ Completed: 969
   ❌ Failed: 0

   Priority Distribution:
   🔥 Tier 1 (High): 254
   ⚡ Tier 2 (Medium): 746
   📄 Tier 3 (Low): 0
```

## Key Benefits

### 1. No Timeout Issues
- RSS orchestrator: ~60 seconds
- CSE orchestrator: ~13 seconds
- Worker: ~20 seconds per 25 articles
- All stay well under 2:30 Edge Function limit

### 2. Premium Source Coverage
- Now captures Bloomberg, WSJ, Reuters, Financial Times, Forbes, CNBC
- V4 missed all Google CSE sources due to timeout
- V5 has 19 Tier 1 sources vs V4's 7

### 3. Scalability
- Queue-based: Can discover 1000s of URLs without scraping them immediately
- Worker processes backlog gradually
- Deduplication prevents re-scraping

### 4. Reliability
- mcp-firecrawl handles parallel batching (5 at a time)
- Built-in 24hr caching reduces API costs
- Automatic retry logic (up to 3 attempts)
- 100% success rate in testing

### 5. Cost Efficiency
- Discovers URLs via RSS (free) first
- Google CSE only for premium sources (10 results per source)
- mcp-firecrawl caching reduces duplicate scraping
- Priority-based ensures important articles scraped first

## Performance Metrics (Actual Production Data - Dec 2024)

### Discovery Phase (Single Run)
| Orchestrator | Sources Processed | Sources Failed | Articles Found | New URLs | Duration |
|--------------|-------------------|----------------|----------------|----------|----------|
| **RSS** | 22-23 | 30-32 | 400-500 | 20-50 | ~60 seconds |
| **Sitemap** | 2 | 0 | 600-700 | 100-350 | ~2 seconds |
| **Fireplexity** | 27-30 | 3 | 1000-1200 | 50-100 | ~40 seconds |
| **CSE** | 3 | 0 | 10-30 | 0-10 | ~5 seconds |

**Notes:**
- RSS has ~30 failed sources due to missing `rss_url` configs (need to add feed URLs)
- Sitemap is now the most productive after fixing Bloomberg + PR Newswire configs
- Fireplexity provides good coverage for firecrawl-based sources

### Scraping Phase (Worker)
- **Per run:** 10 articles processed, 2-10 successful (varies by source difficulty)
- **Duration:** 4-10 seconds per run
- **Best sources:** PR Newswire, Bloomberg (high success rate)
- **Difficult sources:** Paywalled sites show 0-30% success rate
- **Throughput:** ~50-150 articles/hour depending on source mix

### Metadata Extraction Phase
- **Per run:** 140-150 articles processed
- **Duration:** ~20-30 seconds per batch
- **Success rate:** 95%+ (140/148 in recent test)

### Overall Pipeline Stats (Current State)
```
Queue Status:
  Completed: 4,346 articles
  Pending: 1,069 articles
  Failed: 1,187 articles
  With Metadata: 4,338 articles

Success Rates:
  Discovery: ~90% of sources work
  Scraping: ~60% overall (varies by source)
  Metadata: 95%+
```

### Content Quality
- **Average article length:** 15,000-50,000 characters
- **Articles with full content:** 75-80%
- **Articles blocked by paywall:** 15-20%
- **Articles with extraction errors:** 5%

## Monitoring

### Check Queue Status
```sql
SELECT
  scrape_status,
  COUNT(*) as count,
  scrape_priority
FROM raw_articles
WHERE full_content IS NULL
GROUP BY scrape_status, scrape_priority
ORDER BY scrape_priority, scrape_status;
```

### Check Recent Discoveries
```sql
SELECT
  source_name,
  COUNT(*) as articles,
  MAX(created_at) as last_discovered
FROM raw_articles
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY source_name
ORDER BY articles DESC;
```

### Check Scraping Progress
```sql
SELECT
  scrape_status,
  COUNT(*) as count,
  MIN(content_length) as min_length,
  MAX(content_length) as max_length,
  AVG(content_length)::int as avg_length
FROM raw_articles
WHERE full_content IS NOT NULL
GROUP BY scrape_status;
```

## Scheduling (Future)

### Cron Setup (Supabase)

```sql
-- Run RSS discovery 4x per day (every 6 hours)
SELECT cron.schedule(
  'batch-scraper-rss-discovery',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://{project}.supabase.co/functions/v1/batch-scraper-v5-orchestrator-rss',
    headers := '{"Authorization": "Bearer {service_key}"}'::jsonb
  );
  $$
);

-- Run CSE discovery 4x per day (every 6 hours, offset by 5 minutes)
SELECT cron.schedule(
  'batch-scraper-cse-discovery',
  '5 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://{project}.supabase.co/functions/v1/batch-scraper-v5-orchestrator-cse',
    headers := '{"Authorization": "Bearer {service_key}"}'::jsonb
  );
  $$
);

-- Run worker every 30 minutes to process queue
SELECT cron.schedule(
  'batch-scraper-worker',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://{project}.supabase.co/functions/v1/batch-scraper-v5-worker',
    headers := '{"Authorization": "Bearer {service_key}"}'::jsonb
  );
  $$
);
```

## Troubleshooting

### No articles discovered from RSS sources
- **Check `monitor_config` format:** Must use `rss_url` key, not `feed_url`
- **Verify RSS feed is accessible:** `curl -s "https://feeds.example.com/rss.xml" | head`
- **Check source is active:** `SELECT * FROM source_registry WHERE monitor_method='rss' AND active=true`

### "No valid RSS feed" error for specific source
```sql
-- Check the current config
SELECT source_name, monitor_config FROM source_registry WHERE source_name = 'Wall Street Journal';

-- Fix: Use rss_url key
UPDATE source_registry
SET monitor_config = '{"rss_url": "https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml"}'::jsonb
WHERE source_name = 'Wall Street Journal';
```

### Sitemap discovery returns 0 new articles but sources exist
1. **Check for duplicate key errors in logs** - May need batched duplicate checking
2. **Verify sitemap URL returns XML:** `curl -s "https://example.com/sitemap-news.xml" | head`
3. **Check URL validation rules** - Source may need custom validation in `isValidArticleUrl()`

### Duplicate key constraint errors on insert
**Cause:** Supabase `.in()` query with 500+ URLs returns incomplete results

**Fix:** Batch duplicate checks (already implemented in sitemap orchestrator):
```typescript
const checkBatchSize = 50;
for (let i = 0; i < urls.length; i += checkBatchSize) {
  const batch = urls.slice(i, i + checkBatchSize);
  // ... check each batch
}
```

### Worker processing but 0 successful scrapes
- **Paywalled sources:** Many premium sources block scrapers; use authenticated cookies or switch to firecrawl
- **Rate limiting:** Add delays between requests or reduce batch size
- **Check mcp-firecrawl logs:** May show specific error messages

### High failure rate (> 50%)
- **Review failed articles:**
  ```sql
  SELECT source_name, processing_error, COUNT(*)
  FROM raw_articles
  WHERE scrape_status = 'failed' AND created_at > NOW() - INTERVAL '1 day'
  GROUP BY source_name, processing_error
  ORDER BY COUNT(*) DESC;
  ```
- **Common causes:**
  - 403 Forbidden: Source blocking scrapers
  - 404 Not Found: URL structure changed
  - Timeout: Source too slow, increase timeout or use firecrawl
  - Paywall: Need auth cookie or switch method

### Pending queue keeps growing
- **Worker can't keep up:** Increase worker frequency (every 10 min instead of 15)
- **Too many failed retries:** Articles stuck in retry loop; may need to mark as permanently failed
- **Check worker is running:** Verify cron job is executing

### Metadata extraction failing
- **Claude API issues:** Check Anthropic API key and rate limits
- **Content too long:** Some articles exceed context window; truncate in extraction function
- **Check extraction logs:** `SELECT id, processing_error FROM raw_articles WHERE extracted_metadata IS NULL AND scrape_status = 'completed'`

## Migration from V4

V5 is backward compatible with V4 data:

1. Run migration: `20251122194226_add_scrape_queue_columns.sql`
2. Existing articles get default values: `scrape_priority=2`, `scrape_status='pending'`
3. Completed articles automatically marked: `scrape_status='completed'`
4. Priority updated from source tier

No data loss - all V4 articles remain accessible.

## Industry Tagging (Post-Scrape Classification)

### The Problem: Filtering Tier 1 Sources

**Challenge:** Tier 1 sources (Bloomberg, WSJ, Reuters) cover ALL industries. Without pre-filtering, you'd need to enrich 200+ articles per org to find relevant ones = inefficient and slow.

**Solution:** Add lightweight industry classification AFTER scraping, BEFORE enrichment.

### batch-article-tagger Edge Function

**Purpose:** Tag articles with industries using Claude Haiku for efficient filtering

**How It Works:**
1. Fetches untagged articles (where `raw_metadata.industries` is null)
2. Sends title + description to Claude Haiku (cheap: $0.25/1M tokens)
3. Gets back industry classifications with confidence level
4. Stores in `raw_metadata.industries` array

**Performance:**
- Processes 20 articles per batch
- ~4 seconds per batch
- High accuracy classifications

**Industries Detected:**
- technology, healthcare, finance, construction
- manufacturing, retail, energy, transportation
- telecommunications, media, education, agriculture
- government, professional_services, real_estate

**Example Classifications:**
```json
{
  "industries": ["technology"],
  "classification_confidence": "high",
  "classified_at": "2025-11-22T21:25:00Z"
}
```

### Filtering Articles by Industry

**Query by Industry:**
```sql
-- Get technology articles for tech orgs
SELECT * FROM raw_articles
WHERE raw_metadata->'industries' ? 'technology'
  AND scrape_status = 'completed'
  AND created_at > NOW() - INTERVAL '7 days';

-- Get construction articles for construction orgs
SELECT * FROM raw_articles
WHERE raw_metadata->'industries' ? 'construction'
  AND scrape_status = 'completed';
```

**Combined Strategy:**
```sql
-- Step 1: Trade publications (automatic match by source)
SELECT ra.* FROM raw_articles ra
JOIN source_registry sr ON ra.source_id = sr.id
WHERE sr.industries @> ARRAY['technology']::text[]
  AND ra.scrape_status = 'completed';

-- Step 2: Tier 1 sources (filter by article industries)
SELECT * FROM raw_articles
WHERE raw_metadata->'industries' ? 'technology'
  AND scrape_status = 'completed'
  AND source_name IN ('Bloomberg', 'Wall Street Journal', 'Reuters');
```

**Result:** Only enrich relevant articles, avoiding waste of processing 200+ irrelevant Tier 1 articles per org.

## Files

```
supabase/functions/
├── batch-scraper-v5-orchestrator-rss/
│   └── index.ts                    # RSS discovery
├── batch-scraper-v5-orchestrator-cse/
│   └── index.ts                    # Google CSE discovery
├── batch-scraper-v5-orchestrator-sitemap/
│   └── index.ts                    # Sitemap discovery
├── batch-scraper-v5-orchestrator-fireplexity/
│   └── index.ts                    # Fireplexity discovery
├── batch-scraper-v5-worker/
│   └── index.ts                    # mcp-firecrawl batch scraper
├── batch-metadata-orchestrator/
│   └── index.ts                    # Metadata extraction orchestrator
├── extract-article-metadata/
│   └── index.ts                    # Claude-based metadata extraction
├── batch-article-tagger/
│   └── index.ts                    # Industry classification
├── mcp-firecrawl/
│   └── index.ts                    # Parallel batch scraping tool
└── niv-google-cse/
    └── index.ts                    # Google CSE wrapper

supabase/migrations/
├── 20251122194226_add_scrape_queue_columns.sql
└── 20251125_add_extracted_metadata.sql

/tmp/
├── scrape_loop.sh                  # Automated worker loop
├── tag_all_articles.sh             # Automated tagging loop
└── check_v5_queue.mjs              # Queue status checker
```

## Daily Workflow

```bash
# Step 1: Discover URLs from all sources (can run in parallel)
curl -X POST "https://{project}.supabase.co/functions/v1/batch-scraper-v5-orchestrator-rss" \
  -H "Authorization: Bearer {service_key}"

curl -X POST "https://{project}.supabase.co/functions/v1/batch-scraper-v5-orchestrator-cse" \
  -H "Authorization: Bearer {service_key}"

curl -X POST "https://{project}.supabase.co/functions/v1/batch-scraper-v5-orchestrator-sitemap" \
  -H "Authorization: Bearer {service_key}"

curl -X POST "https://{project}.supabase.co/functions/v1/batch-scraper-v5-orchestrator-fireplexity" \
  -H "Authorization: Bearer {service_key}"

# Step 2: Scrape all queued articles (loop until queue empty)
/tmp/scrape_loop.sh

# Step 3: Extract metadata from scraped articles
curl -X POST "https://{project}.supabase.co/functions/v1/batch-metadata-orchestrator" \
  -H "Authorization: Bearer {service_key}" \
  -d '{"limit": 500}'

# Step 4: Tag articles with industries (optional, for advanced filtering)
curl -X POST "https://{project}.supabase.co/functions/v1/batch-article-tagger" \
  -H "Authorization: Bearer {service_key}"
```

## Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      DISCOVERY PHASE                             │
├─────────────────────────────────────────────────────────────────┤
│  RSS Orchestrator ──┐                                           │
│  CSE Orchestrator ──┼──> raw_articles (scrape_status='pending') │
│  Sitemap Orchestrator┤                                           │
│  Fireplexity ───────┘                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SCRAPING PHASE                              │
├─────────────────────────────────────────────────────────────────┤
│  batch-scraper-v5-worker                                        │
│  - Fetches pending articles                                     │
│  - Calls mcp-firecrawl for content                              │
│  - Updates full_content, scrape_status='completed'              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   METADATA EXTRACTION PHASE                      │
├─────────────────────────────────────────────────────────────────┤
│  batch-metadata-orchestrator                                    │
│  - Fetches completed articles without metadata                  │
│  - Spawns extract-article-metadata calls                        │
│  - Updates extracted_metadata JSONB column                      │
│    (topics, entities, summary, signals)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DOWNSTREAM USAGE                              │
├─────────────────────────────────────────────────────────────────┤
│  article-selector-v4                                            │
│  - Queries raw_articles by source industry                      │
│  - Returns articles for company-specific intelligence           │
│  - Downstream: relevance filter → enrichment → synthesis        │
└─────────────────────────────────────────────────────────────────┘
```

## Premium Source Configurations (Verified Working)

### Tier 1 Sources - Recommended Methods

| Source | Method | Configuration | Notes |
|--------|--------|---------------|-------|
| **Bloomberg** | `sitemap` | `monitor_config: { sitemap_url: "https://www.bloomberg.com/feeds/sitemap_news.xml" }` | **Metadata-only** - URL/title/date stored, content not scraped (blocked by anti-bot) |
| **Wall Street Journal** | `rss` | `monitor_config: { rss_url: "https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml" }` | ~20-30 articles/day via RSS |
| **CNBC** | `rss` | `monitor_config: { rss_url: "https://www.cnbc.com/id/100003114/device/rss/rss.html" }` | ~30-50 articles/day |
| **PR Newswire** | `sitemap` | `monitor_config: { sitemap_url: "https://www.prnewswire.com/sitemap-news.xml?page=1" }` | ~100-200 press releases/day |
| **Reuters** | `firecrawl` | Default firecrawl method | Via Fireplexity orchestrator |
| **Business Wire** | `firecrawl` | Default firecrawl method | Via Fireplexity orchestrator |

### RSS Configuration Format

**IMPORTANT:** The RSS orchestrator expects `rss_url` inside `monitor_config`:

```sql
-- Correct format
UPDATE source_registry
SET monitor_method = 'rss',
    monitor_config = '{"rss_url": "https://feeds.example.com/rss.xml"}'::jsonb
WHERE source_name = 'Example Source';

-- Wrong format (will fail with "No valid RSS feed")
-- monitor_config = '{"feed_url": "..."}'  -- WRONG key name
```

### Sitemap Configuration Format

```sql
UPDATE source_registry
SET monitor_method = 'sitemap',
    monitor_config = '{"sitemap_url": "https://example.com/sitemap-news.xml"}'::jsonb
WHERE source_name = 'Example Source';
```

## Reliability Fixes Applied (Dec 2024)

### 1. Batched Duplicate Checking (Sitemap Orchestrator)

**Problem:** When discovering 500+ URLs, the duplicate check query `.in('url', urls)` hit Supabase limits and returned incomplete results, causing duplicate key constraint errors on insert.

**Fix:** Batch duplicate checks into groups of 50 URLs:

```typescript
// In batch-scraper-v5-orchestrator-sitemap/index.ts
const existingUrlSet = new Set<string>();
const urls = articles.map(a => a.url);
const checkBatchSize = 50;

for (let i = 0; i < urls.length; i += checkBatchSize) {
  const batch = urls.slice(i, i + checkBatchSize);
  const { data: existingUrls } = await supabase
    .from('raw_articles')
    .select('url')
    .in('url', batch);

  if (existingUrls) {
    for (const r of existingUrls) {
      existingUrlSet.add(r.url);
    }
  }
}
```

### 2. URL Validation Rules (Sitemap Orchestrator)

**Problem:** Sitemaps contain non-article URLs (homepages, category pages, etc.)

**Fix:** Added source-specific URL validation:

```typescript
// PR Newswire - only /news-releases/ URLs
if (sourceName === 'PR Newswire') {
  return urlLower.includes('/news-releases/');
}

// Business Wire - only press release URLs
if (sourceName === 'Business Wire') {
  return urlLower.includes('/news/home/') || urlLower.includes('/en/');
}

// Bloomberg - filter out non-article paths
if (sourceName === 'Bloomberg') {
  const invalidPaths = ['/audio/', '/video/', '/podcasts/', '/live/'];
  return !invalidPaths.some(p => urlLower.includes(p));
}
```

### 3. Error Tracking (All Orchestrators)

Added `error_summary` JSONB field to `batch_scrape_runs` table to track per-source failures:

```typescript
const sourceErrors: { source: string, error: string }[] = [];
// ... in catch block:
sourceErrors.push({ source: source.source_name, error: error.message });
// ... at end:
await supabase.from('batch_scrape_runs').update({
  error_summary: sourceErrors.length > 0 ? sourceErrors : null
});
```

### 4. Metadata-Only Sources (Sitemap Orchestrator)

**Problem:** Some premium sources (Bloomberg, South China Morning Post) block scrapers with anti-bot protection, causing all articles to fail with timeouts.

**Fix:** Added `METADATA_ONLY_SOURCES` array to store only URL/title/date without attempting content scraping:

```typescript
// In batch-scraper-v5-orchestrator-sitemap/index.ts
const METADATA_ONLY_SOURCES = ['Bloomberg', 'South China Morning Post'];

// When inserting, check if source is metadata-only
const isMetadataOnly = METADATA_ONLY_SOURCES.includes(source.source_name);
const scrapeStatus = isMetadataOnly ? 'metadata_only' : 'pending';
```

Articles from these sources get `scrape_status: 'metadata_only'` and are skipped by the worker.

### 5. PR Newswire URL Validation Fix (Worker)

**Problem:** Quality check incorrectly flagged valid PR Newswire press releases as "category pages" because they contain `/news-releases/` in the URL path.

**Fix:** Added article ID pattern detection to skip category check for URLs with numeric identifiers:

```typescript
// In batch-scraper-v5-worker/index.ts
const hasPRNewswireId = urlLower.match(/prnewswire\.com.*-\d{6,}\.html$/);
const hasArticleId = urlLower.match(/\d{6,}\.html$/) || urlLower.match(/\/\d{7,}$/);

if (!hasDatePattern && !hasPRNewswireId && !hasArticleId) {
  // Only flag as category page if no article identifier present
  return { is_valid: false, reason: 'Category page URL pattern' };
}
```

### 6. XML Archive Filter (Worker)

**Problem:** *Dive sites (Payments Dive, BioPharma Dive, etc.) sitemap discovery was picking up XML archive index files instead of actual article URLs (e.g., `/news/archive/2022/may.xml`).

**Fix:** Added early rejection for XML/archive files in quality check:

```typescript
// In batch-scraper-v5-worker/index.ts
if (urlLower.endsWith('.xml') || urlLower.includes('/archive/') && urlLower.match(/\d{4}\/\w+\.xml$/)) {
  return {
    is_valid: false,
    reason: 'Not an article URL (XML/archive file)',
    confidence: 1.0
  };
}
```

## Autonomous Cron Operation

### Recommended Cron Schedule

```sql
-- Discovery: Run 4x per day (every 6 hours)
-- Stagger by 2 minutes to avoid conflicts

SELECT cron.schedule('scraper-rss', '0 */6 * * *', $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-rss',
    headers := '{"Authorization": "Bearer SERVICE_KEY"}'::jsonb
  );
$$);

SELECT cron.schedule('scraper-sitemap', '2 */6 * * *', $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-sitemap',
    headers := '{"Authorization": "Bearer SERVICE_KEY"}'::jsonb
  );
$$);

SELECT cron.schedule('scraper-fireplexity', '4 */6 * * *', $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-fireplexity',
    headers := '{"Authorization": "Bearer SERVICE_KEY"}'::jsonb
  );
$$);

SELECT cron.schedule('scraper-cse', '6 */6 * * *', $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-cse',
    headers := '{"Authorization": "Bearer SERVICE_KEY"}'::jsonb
  );
$$);

-- Worker: Run every 15 minutes to process queue
SELECT cron.schedule('scraper-worker', '*/15 * * * *', $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-worker',
    headers := '{"Authorization": "Bearer SERVICE_KEY"}'::jsonb
  );
$$);

-- Metadata: Run every 30 minutes
SELECT cron.schedule('scraper-metadata', '10,40 * * * *', $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-metadata-orchestrator',
    headers := '{"Authorization": "Bearer SERVICE_KEY"}',
    body := '{"limit": 200}'::jsonb
  );
$$);
```

### Expected Daily Throughput

Based on actual production runs (Dec 2024):

| Orchestrator | Sources | Articles/Run | New/Run | Runs/Day | Daily New |
|--------------|---------|--------------|---------|----------|-----------|
| RSS | 22-25 | 400-500 | 20-50 | 4 | 80-200 |
| Sitemap | 2 | 600-700 | 100-300 | 4 | 400-1200 |
| Fireplexity | 27-30 | 1000-1200 | 50-100 | 4 | 200-400 |
| CSE | 3 | 10-30 | 0-10 | 4 | 0-40 |
| **Total** | | | | | **700-1800** |

### Worker Performance Expectations

- **Best case:** 10 successful scrapes per run (~8 seconds)
- **Typical case:** 2-6 successful scrapes per run (paywalled/blocked sources)
- **Failed articles:** Move to `failed` status after 3 attempts
- **Processing rate:** ~100-200 articles/hour with 15-minute worker intervals

### Failure Modes to Monitor

1. **"No valid RSS feed" errors** - Check `monitor_config.rss_url` format
2. **Duplicate key constraint errors** - Batched check may need smaller batch size
3. **Low success rate on worker** - Many sources are paywalled; consider switching to firecrawl
4. **Sitemap 403/404 errors** - Source changed sitemap URL; update `monitor_config`

### Health Check Query

```sql
-- Run daily to check pipeline health
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE scrape_status = 'completed') as completed,
  COUNT(*) FILTER (WHERE scrape_status = 'failed') as failed,
  COUNT(*) FILTER (WHERE scrape_status = 'pending') as pending,
  COUNT(*) FILTER (WHERE extracted_metadata IS NOT NULL) as with_metadata,
  ROUND(100.0 * COUNT(*) FILTER (WHERE scrape_status = 'completed') / NULLIF(COUNT(*), 0), 1) as success_rate
FROM raw_articles
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Alerting Thresholds

Set up alerts for:
- **Discovery:** < 100 new URLs per day (pipeline stalled)
- **Worker success rate:** < 30% (source issues)
- **Pending queue:** > 5000 (worker can't keep up)
- **Failed rate:** > 50% of daily articles (widespread scraping issues)

## Next Steps

1. **Set up cron scheduling** using the SQL above
2. **Monitor queue metrics** via health check query
3. **Add alerting** via Supabase webhooks or external monitoring
4. **Expand source registry** - add more RSS feeds for Tier 2 sources
5. **Tune metadata extraction** prompts for better entity/topic accuracy
