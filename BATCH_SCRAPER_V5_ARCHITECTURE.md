# Batch Scraper V5 - Split Orchestrator Architecture

## Overview

Batch Scraper V5 is a complete rewrite that splits discovery into two separate Edge Functions to avoid timeout issues and leverages mcp-firecrawl for parallel batch scraping. The system uses a queue-based architecture with priority scheduling.

## Why V5?

**V4 Problems:**
- Single orchestrator tried to process RSS + Google CSE in one run
- Timed out after ~2:30 minutes processing 44 RSS sources
- Never reached Google CSE phase where premium Tier 1 sources (Bloomberg, WSJ, Reuters) are discovered
- Result: Missing all major financial news sources

**V5 Solutions:**
- Split into two independent orchestrators (RSS + CSE)
- Each completes quickly without timeout
- Queue-based scraping via separate worker
- Leverages existing mcp-firecrawl for parallel batching

## Architecture

### Three Edge Functions

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

#### 3. `batch-scraper-v5-worker`
**Purpose:** Scrape full content for articles in the queue

**Process:**
- Queries `raw_articles` for articles where:
  - `full_content IS NULL`
  - `scrape_status IN ('pending', 'failed')`
  - `scrape_attempts < 3`
- Orders by `scrape_priority ASC, created_at DESC` (Tier 1 first)
- Processes 25 articles per run
- Calls `mcp-firecrawl` with `batch_scrape_articles` tool
- mcp-firecrawl handles parallel batching (5 at a time) internally
- Updates `raw_articles` with scraped content or error

**Performance:**
- Processes 25 articles per run in ~20 seconds
- 100% success rate with 0 failures
- mcp-firecrawl provides 24hr caching and intelligent rate limiting

**Trigger:** Loop script or scheduled (runs until queue empty)

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
  -- - discovery_method: 'rss' or 'google_cse'
  -- - scraping_method: 'mcp_firecrawl' (V5)
  -- - cached: boolean (from mcp-firecrawl)
  -- - rss_feed or cse_snippet
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
  -- 'firecrawl_observer' = Not used in V5

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
# Step 1: Discover URLs from RSS sources (~60s)
curl -X POST "https://{project}.supabase.co/functions/v1/batch-scraper-v5-orchestrator-rss" \
  -H "Authorization: Bearer {service_key}"

# Step 2: Discover URLs from Google CSE sources (~13s)
curl -X POST "https://{project}.supabase.co/functions/v1/batch-scraper-v5-orchestrator-cse" \
  -H "Authorization: Bearer {service_key}"

# Step 3: Scrape all queued articles (loop until queue empty)
# See /tmp/scrape_loop.sh for automated loop
curl -X POST "https://{project}.supabase.co/functions/v1/batch-scraper-v5-worker" \
  -H "Authorization: Bearer {service_key}"
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

## Performance Metrics

### Discovery Phase
- **RSS:** 44 sources → 500-800 URLs → ~60 seconds
- **Google CSE:** 44 sources → 200-300 URLs → ~13 seconds
- **Total:** 88 sources → ~1000 URLs → ~73 seconds

### Scraping Phase
- **Worker:** 25 articles → ~20 seconds → ~75 articles/minute
- **1000 articles:** ~40 worker runs → ~13 minutes total
- **Success rate:** 100% (0 failures)

### Content Stats
- **Total articles:** 969 completed
- **Total content:** ~15 MB
- **Average article:** ~15,800 characters
- **Range:** 642 - 180,117 characters

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

### No articles discovered
- Check `source_registry` has active sources
- Verify RSS URLs are valid
- Check Google CSE API quota

### Worker not processing queue
- Verify `scrape_status='pending'` articles exist
- Check `scrape_attempts < 3`
- Review mcp-firecrawl function logs

### High failure rate
- Check Firecrawl API key and quota
- Review `processing_error` field in failed articles
- Verify source URLs are still valid

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
├── batch-scraper-v5-worker/
│   └── index.ts                    # mcp-firecrawl batch scraper
├── batch-article-tagger/
│   └── index.ts                    # Industry classification (NEW)
├── mcp-firecrawl/
│   └── index.ts                    # Parallel batch scraping tool
└── niv-google-cse/
    └── index.ts                    # Google CSE wrapper

supabase/migrations/
└── 20251122194226_add_scrape_queue_columns.sql

/tmp/
├── scrape_loop.sh                  # Automated worker loop
├── tag_all_articles.sh             # Automated tagging loop (NEW)
└── check_v5_queue.mjs              # Queue status checker
```

## Daily Workflow

```bash
# Step 1: Discover URLs from RSS sources (~60s)
curl -X POST "https://{project}.supabase.co/functions/v1/batch-scraper-v5-orchestrator-rss" \
  -H "Authorization: Bearer {service_key}"

# Step 2: Discover URLs from Google CSE sources (~13s)
curl -X POST "https://{project}.supabase.co/functions/v1/batch-scraper-v5-orchestrator-cse" \
  -H "Authorization: Bearer {service_key}"

# Step 3: Scrape all queued articles (loop until queue empty, ~13 minutes for 1000 articles)
/tmp/scrape_loop.sh

# Step 4: Tag articles with industries (~4s per 20 articles)
curl -X POST "https://{project}.supabase.co/functions/v1/batch-article-tagger" \
  -H "Authorization: Bearer {service_key}"
```

## Next Steps

1. **Set up cron scheduling** for automated discovery + scraping + tagging
2. **Monitor queue metrics** to tune worker frequency
3. **Add alerting** for high failure rates or empty discovery
4. **Expand source registry** with more Tier 1 sources
5. **Build downstream pipeline** for article enrichment (using industry filters)
