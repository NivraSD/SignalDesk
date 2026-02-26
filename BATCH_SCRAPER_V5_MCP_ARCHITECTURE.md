# Batch Scraper V5 - MCP-Firecrawl Architecture

## Why V5?

**V4 Problem**: Even with separated discovery/extraction, processing 44+ Google CSE sources sequentially exceeded Edge Function 2:30 timeout.

**V5 Solution**: Use existing `mcp-firecrawl` Edge Function which has:
- ✅ Parallel batch scraping (5 articles at a time)
- ✅ Built-in 24hr caching
- ✅ Priority-based processing
- ✅ Intelligent rate limiting

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│  ORCHESTRATOR (batch-scraper-v5-orchestrator)           │
│  Runs: Every 4-6 hours via cron                          │
│  Time: <60 seconds                                       │
│  ────────────────────────────────────────────────────    │
│  1. Discovers URLs via RSS (44 sources)                  │
│  2. Discovers URLs via Google CSE (44 sources)           │
│  3. Inserts into raw_articles with:                      │
│     - full_content = NULL                                │
│     - scrape_priority = tier (1=high, 3=low)            │
│     - scrape_status = 'pending'                          │
└──────────────────────┬───────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│  WORKER (batch-scraper-v5-worker)                       │
│  Runs: Every 5-15 minutes continuously                   │
│  Time: ~2 minutes per run                                │
│  ────────────────────────────────────────────────────    │
│  1. Query raw_articles WHERE:                            │
│     - full_content IS NULL                               │
│     - scrape_status IN ('pending', 'failed')            │
│     - ORDER BY scrape_priority ASC, created_at DESC      │
│     - LIMIT 25                                           │
│                                                           │
│  2. Call mcp-firecrawl batch_scrape_articles:            │
│     {                                                     │
│       articles: [...],  // 25 articles                   │
│       formats: ['markdown'],                             │
│       maxTimeout: 10000                                  │
│     }                                                     │
│                                                           │
│  3. mcp-firecrawl processes internally:                  │
│     - Splits into batches of 5                           │
│     - Scrapes 5 in parallel                              │
│     - Adds 500ms delay between batches                   │
│     - Returns all results                                │
│                                                           │
│  4. Update raw_articles with results:                    │
│     - full_content = markdown                            │
│     - scrape_status = 'completed' or 'failed'           │
│     - scraped_at = NOW()                                 │
└──────────────────────────────────────────────────────────┘
```

## Database Schema

```sql
-- raw_articles table (already exists, add new columns)
ALTER TABLE raw_articles ADD COLUMN IF NOT EXISTS scrape_priority INTEGER DEFAULT 2;
ALTER TABLE raw_articles ADD COLUMN IF NOT EXISTS scrape_status TEXT DEFAULT 'pending';
ALTER TABLE raw_articles ADD COLUMN IF NOT EXISTS scrape_attempts INTEGER DEFAULT 0;
ALTER TABLE raw_articles ADD COLUMN IF NOT EXISTS last_scrape_attempt TIMESTAMPTZ;

-- Indexes for worker queries
CREATE INDEX IF NOT EXISTS idx_raw_articles_scrape_queue
  ON raw_articles(scrape_status, scrape_priority, created_at)
  WHERE full_content IS NULL;
```

## Benefits Over V4

| Feature | V4 | V5 |
|---------|----|----|
| Discovery Speed | ✅ Fast | ✅ Fast |
| Parallel Scraping | ❌ Sequential | ✅ 5 at a time |
| Timeout Risk | ⚠️  High with CSE | ✅ None |
| Caching | ❌ None | ✅ 24hr TTL |
| Priority System | ❌ None | ✅ Tier-based |
| Rate Limiting | ⚠️  Manual | ✅ Intelligent |
| Retry Logic | ⚠️  Complex | ✅ Built-in queue |
| MCP Integration | ❌ None | ✅ Native |

## MCP-Firecrawl Batch Scraping Flow

When worker calls `mcp-firecrawl` with 25 articles:

```javascript
// Worker sends to mcp-firecrawl
POST /functions/v1/mcp-firecrawl
{
  "method": "tools/call",
  "params": {
    "name": "batch_scrape_articles",
    "arguments": {
      "articles": [
        { url: "...", priority: 1, metadata: {...} },  // Tier 1 source
        { url: "...", priority: 2, metadata: {...} },  // Tier 2 source
        // ... 25 total
      ],
      "formats": ["markdown"],
      "maxTimeout": 10000
    }
  }
}

// mcp-firecrawl processes internally:
// Batch 1: Articles 0-4  (5 parallel) → 500ms delay
// Batch 2: Articles 5-9  (5 parallel) → 500ms delay
// Batch 3: Articles 10-14 (5 parallel) → 500ms delay
// Batch 4: Articles 15-19 (5 parallel) → 500ms delay
// Batch 5: Articles 20-24 (5 parallel) → done

// Returns after ~15-20 seconds:
{
  "results": [
    { url: "...", success: true, data: { markdown: "...", ... }, cached: false },
    { url: "...", success: true, data: { markdown: "...", ... }, cached: true },
    // ... 25 results
  ],
  "stats": {
    "total_requested": 25,
    "successful": 23,
    "failed": 2,
    "cached": 8,
    "freshly_scraped": 15
  }
}
```

## Deployment

### 1. Create Database Migration

```bash
supabase migration new add_scrape_queue_columns
```

Add columns to `raw_articles` for queue management.

### 2. Deploy Edge Functions

```bash
supabase functions deploy batch-scraper-v5-orchestrator
supabase functions deploy batch-scraper-v5-worker
```

### 3. Set Up Cron Jobs

```bash
# Orchestrator: Discover new URLs every 6 hours
0 */6 * * * curl -X POST https://.../batch-scraper-v5-orchestrator

# Worker: Process scrape queue every 10 minutes
*/10 * * * * curl -X POST https://.../batch-scraper-v5-worker
```

## Performance Estimates

### Orchestrator (Discovery)
- 44 RSS sources: ~2 seconds each = 88 seconds
- 44 Google CSE sources: ~500ms each = 22 seconds
- Database inserts: ~5 seconds
- **Total: ~2 minutes** ✅ Well under timeout

### Worker (Scraping via MCP-Firecrawl)
- 25 articles = 5 batches of 5
- Each batch: ~2-3 seconds scraping + 500ms delay
- **Total: ~15-20 seconds per 25 articles** ✅ Can process 150+ articles per run

### Full System
- Discovery every 6 hours: ~200-300 new URLs
- Worker every 10 minutes: ~150 articles processed
- **Scrape queue cleared in ~20-30 minutes after discovery** ✅

## Migration from V4

1. ~~Deploy V5 functions~~ (pending)
2. Run database migration
3. Update cron jobs
4. Run orchestrator once to populate queue
5. Start worker on cron schedule
6. Monitor `raw_articles` scrape_status column
7. Decommission V4 functions

## Error Handling

### Orchestrator Errors
- RSS feed failures: Log, continue to next source
- Google CSE quota exceeded: Gracefully degrade, retry next run
- Database connection issues: Retry with exponential backoff

### Worker Errors
- Individual article scrape failures: Mark as 'failed', retry later
- MCP-Firecrawl timeout: Reduce batch size to 10-15
- Database update failures: Log, leave in queue for retry

### Retry Strategy
```sql
-- Articles to retry (failed < 3 times)
WHERE scrape_status = 'failed'
  AND scrape_attempts < 3
  AND last_scrape_attempt < NOW() - INTERVAL '1 hour'
```

## Monitoring

Key metrics to track:
1. Orchestrator run frequency and discovery count
2. Worker queue depth (`raw_articles` with `full_content IS NULL`)
3. MCP-Firecrawl cache hit rate
4. Average scrape time per article
5. Failure rate by source
6. Content extraction success rate

## Future Enhancements

1. **Dynamic batch sizing** - Adjust based on performance
2. **Source-specific timeouts** - Some sites slower than others
3. **Intelligent retry** - Exponential backoff for persistent failures
4. **Quality scoring** - Track which sources provide best content
5. **Real-time triggers** - Process high-priority articles immediately
