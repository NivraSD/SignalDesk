# Article Deduplication System

## Problem Solved

When monitoring runs **every 24 hours** with a **24-hour recency window**, you want:
- **Day 1:** Articles from last 24 hours
- **Day 2:** NEW articles from last 24 hours (no duplicates from Day 1)
- **Day 3:** NEW articles from last 24 hours (no duplicates from Day 1 or 2)

Without deduplication, you'd reprocess the same articles multiple times, creating:
- Duplicate executive syntheses
- Duplicate opportunity alerts
- Duplicate crisis notifications
- Wasted API calls and processing time

## Solution: `processed_articles` Tracking Table

### Database Schema

**Table:** `processed_articles`

```sql
CREATE TABLE processed_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  article_url text NOT NULL,
  article_title text,
  processed_at timestamptz DEFAULT now(),
  source text,
  stage text DEFAULT 'monitor-stage-1',
  created_at timestamptz DEFAULT now(),

  -- Prevent duplicate URL processing per org
  UNIQUE(organization_id, article_url)
);
```

**Indexes:**
- `idx_processed_articles_org_url` - Fast lookups during deduplication
- `idx_processed_articles_created` - Fast cleanup of old entries
- `idx_processed_articles_org_recent` - Quick recent articles query

**Retention:** 7 days (batch) or 24 hours (real-time)

### How It Works

#### 1. Before Processing (Deduplication Check)
```typescript
// Get article URLs from current batch
const articleUrls = articles.map(a => a.url)

// Check which ones we've already processed
const { data: processedArticles } = await supabase
  .from('processed_articles')
  .select('article_url')
  .eq('organization_id', orgName)
  .in('article_url', articleUrls)
  .gte('created_at', cutoffDate) // Last 7 days (batch) or 24 hours (real-time)

// Filter out already processed
const newArticles = articles.filter(a => !processedUrls.has(a.url))
```

#### 2. After Processing (Mark as Processed)
```typescript
// Mark articles as processed for future runs
await supabase.from('processed_articles').upsert(
  articles.map(a => ({
    organization_id: orgName,
    article_url: a.url,
    article_title: a.title,
    source: a.source,
    stage: 'monitor-stage-1-fireplexity',
    processed_at: new Date().toISOString()
  })),
  { onConflict: 'organization_id,article_url' }
)
```

## Implementation

### monitor-stage-1-fireplexity (Batch Pipeline)

**Default Window:** 24 hours
**Deduplication Window:** 7 days (prevents reprocessing articles from last week)
**Default:** Deduplication ENABLED

```typescript
// Usage with default 24-hour window
fetch('monitor-stage-1-fireplexity', {
  body: JSON.stringify({
    organization: 'Tesla'
    // recency_window defaults to '24hours'
    // skip_deduplication defaults to false
  })
})

// Output includes deduplication stats
{
  "articles": [...],
  "metadata": {
    "deduplication": {
      "enabled": true,
      "total_found": 85,
      "already_processed": 35,
      "new_articles": 50
    }
  }
}
```

### niv-fireplexity-monitor-v2 (Real-time)

**Default Window:** 6 hours
**Deduplication Window:** 24 hours (prevents duplicate alerts)
**Default:** Deduplication ENABLED

```typescript
// Usage with default 6-hour window
fetch('niv-fireplexity-monitor-v2', {
  body: JSON.stringify({
    organization_id: 'Tesla'
    // recency_window defaults to '6hours'
    // skip_deduplication defaults to false
  })
})

// Output includes deduplication stats
{
  "articles": [...],
  "deduplication": {
    "enabled": true,
    "total_scored": 42,
    "already_processed": 12,
    "new_articles": 30
  }
}
```

## Benefits

### 1. Zero Duplicate Processing
- Articles processed once per organization
- Prevents duplicate alerts/notifications
- Saves API costs (no wasted enrichment calls)

### 2. Configurable Per Use Case
- **Batch (24hr):** 7-day deduplication window (longer memory)
- **Real-time (6hr):** 24-hour deduplication window (shorter, more dynamic)

### 3. Transparent Reporting
```json
{
  "deduplication": {
    "enabled": true,
    "total_found": 100,
    "already_processed": 40,
    "new_articles": 60
  }
}
```

You can see exactly how many duplicates were filtered.

### 4. Easy to Disable (For Testing)
```typescript
// Disable deduplication for testing/debugging
fetch('monitor-stage-1-fireplexity', {
  body: JSON.stringify({
    organization: 'Tesla',
    skip_deduplication: true  // Get ALL articles, even if processed before
  })
})
```

## Example Scenarios

### Scenario 1: Daily Batch Run (Executive Synthesis)

**Day 1 (Monday 9am):**
```
Recency: Last 24 hours (Sunday 9am - Monday 9am)
Found: 80 articles
Already processed: 0 (first run)
New articles: 80
→ Process all 80 articles
```

**Day 2 (Tuesday 9am):**
```
Recency: Last 24 hours (Monday 9am - Tuesday 9am)
Found: 85 articles
Already processed: 35 (overlap from yesterday's 9am-9am window)
New articles: 50
→ Process only 50 NEW articles
```

**Day 3 (Wednesday 9am):**
```
Recency: Last 24 hours (Tuesday 9am - Wednesday 9am)
Found: 90 articles
Already processed: 38 (overlap from yesterday)
New articles: 52
→ Process only 52 NEW articles
```

### Scenario 2: Real-time Monitoring (Every 6 Hours)

**Run 1 (Monday 12am):**
```
Recency: Last 6 hours (Mon 6pm - Mon 12am)
Found: 25 articles
Already processed: 0
New articles: 25
→ Alert on 25 articles
```

**Run 2 (Monday 6am):**
```
Recency: Last 6 hours (Mon 12am - Mon 6am)
Found: 30 articles
Already processed: 0 (no overlap, different time window)
New articles: 30
→ Alert on 30 NEW articles
```

**Run 3 (Monday 12pm):**
```
Recency: Last 6 hours (Mon 6am - Mon 12pm)
Found: 28 articles
Already processed: 0
New articles: 28
→ Alert on 28 NEW articles
```

### Scenario 3: Article Updated/Republished

**Original Article:**
- URL: `https://reuters.com/tesla-gigafactory-article`
- Published: Monday 8am
- Processed: Monday 9am batch run

**Updated Article:**
- URL: `https://reuters.com/tesla-gigafactory-article` (SAME URL)
- Updated: Monday 2pm
- Next run: Tuesday 9am batch

**Result:**
```
Already processed: YES (same URL)
Skipped: YES
→ Won't be processed again
```

**Why?** We deduplicate by URL, not by publish date. If content updates are important, the article needs a new URL or you need to manually invalidate the cache.

## Maintenance

### Automatic Cleanup (7 Days)

The migration includes a cleanup function:

```sql
CREATE OR REPLACE FUNCTION cleanup_old_processed_articles()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM processed_articles
  WHERE created_at < now() - interval '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Run via cron:**
```sql
-- Run cleanup daily at 3am
SELECT cron.schedule(
  'cleanup-processed-articles',
  '0 3 * * *',
  'SELECT cleanup_old_processed_articles()'
);
```

### Manual Cleanup

```sql
-- Delete processed articles older than 7 days
DELETE FROM processed_articles
WHERE created_at < now() - interval '7 days';

-- Or run the function
SELECT cleanup_old_processed_articles();
```

### Clear for Specific Organization

```sql
-- Clear all processed articles for Tesla
DELETE FROM processed_articles
WHERE organization_id = 'Tesla';

-- Clear articles older than 24 hours for Tesla
DELETE FROM processed_articles
WHERE organization_id = 'Tesla'
  AND created_at < now() - interval '24 hours';
```

## Performance

### Query Performance
- **Lookup:** O(1) via unique index on (organization_id, article_url)
- **Batch insert:** 100 articles per batch to avoid query size limits
- **Cleanup:** Indexed on created_at for fast deletion

### Storage Estimates
- **Per article:** ~200 bytes
- **100 articles/day:** 20 KB/day
- **7-day retention:** 140 KB per organization
- **1000 organizations:** ~140 MB total

Very lightweight!

## Migration

```bash
# Run the migration
supabase migration up 20251023_create_processed_articles_tracking

# Or apply directly
psql $DATABASE_URL -f supabase/migrations/20251023_create_processed_articles_tracking.sql
```

## Monitoring

Track deduplication effectiveness:

```sql
-- Deduplication rate per organization (last 24 hours)
SELECT
  organization_id,
  COUNT(*) as total_processed,
  COUNT(DISTINCT article_url) as unique_articles,
  ROUND(100.0 * (COUNT(*) - COUNT(DISTINCT article_url)) / COUNT(*), 2) as duplicate_rate
FROM processed_articles
WHERE created_at > now() - interval '24 hours'
GROUP BY organization_id
ORDER BY duplicate_rate DESC;

-- Most processed sources
SELECT
  source,
  COUNT(*) as article_count
FROM processed_articles
WHERE created_at > now() - interval '7 days'
GROUP BY source
ORDER BY article_count DESC
LIMIT 20;

-- Processing by stage
SELECT
  stage,
  COUNT(*) as processed_count
FROM processed_articles
WHERE created_at > now() - interval '24 hours'
GROUP BY stage;
```

## Troubleshooting

### Issue: Too Many Articles Being Skipped

**Check retention window:**
```sql
-- See what's in the deduplication cache
SELECT
  organization_id,
  COUNT(*) as cached_articles,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM processed_articles
WHERE organization_id = 'Tesla'
GROUP BY organization_id;
```

**Solution:** If cache is too old, clear it:
```sql
DELETE FROM processed_articles
WHERE organization_id = 'Tesla'
  AND created_at < now() - interval '24 hours';
```

### Issue: Same Article Appearing Multiple Times

**Check for URL variations:**
```sql
-- Find potential duplicate URLs
SELECT
  article_url,
  COUNT(*) as count
FROM processed_articles
WHERE organization_id = 'Tesla'
GROUP BY article_url
HAVING COUNT(*) > 1;
```

**Common causes:**
- URL with/without trailing slash
- URL with different query parameters
- URL with different protocols (http vs https)

**Solution:** Normalize URLs before checking:
```typescript
function normalizeUrl(url: string): string {
  const normalized = new URL(url)
  normalized.search = '' // Remove query params
  return normalized.toString().replace(/\/$/, '') // Remove trailing slash
}
```

### Issue: Deduplication Not Working

**Check if deduplication is enabled:**
```json
// Response should show:
{
  "deduplication": {
    "enabled": true,  // ← Should be true
    ...
  }
}
```

**Check database permissions:**
```sql
-- Verify RLS policies
SELECT * FROM processed_articles LIMIT 1;
```

**Check function logs:**
```
🔍 Step 4: Checking for previously processed articles...
   ✓ Filtered: 85 found → 50 new (35 already processed)
```

## Future Enhancements

### 1. Content-Based Deduplication
Beyond URL matching, detect duplicate content:
```typescript
// Hash article content
const contentHash = sha256(article.title + article.content)
// Check for duplicate hashes
```

### 2. Smart Re-processing
Allow re-processing if article was significantly updated:
```typescript
// Check if article content changed significantly
if (article.updated_at > lastProcessedAt && contentChanged > 30%) {
  // Re-process even though URL matches
}
```

### 3. Deduplication Analytics Dashboard
Track:
- Deduplication rate trends
- Most duplicated sources
- Cost savings from deduplication

---

**Status:** ✅ Implemented
**Last Updated:** 2025-10-23
**Migration:** `20251023_create_processed_articles_tracking.sql`
**Functions Updated:**
- `monitor-stage-1-fireplexity`
- `niv-fireplexity-monitor-v2`
