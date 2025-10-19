# Journalist Registry - Setup Guide

## Overview

The journalist_registry is a database of 225+ verified journalists organized by industry/beat. This replaces Claude's hallucinated media lists with REAL journalist data that can be enriched with Firecrawl.

## Architecture

```
User: "10 AI journalists"
  ↓
NIV → Query journalist_registry (beat='AI', tier='tier1', limit=10)
  ↓
Return REAL journalists with contact info
  ↓
(Optional) Enrich with Firecrawl for latest articles
```

## Setup Steps

### 1. Create the Table

**Option A: Run SQL in Supabase Dashboard**
```bash
node setup-journalist-table.js
```
Copy the SQL output and run it here:
👉 https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql/new

**Option B: Use Supabase CLI**
```bash
npx supabase db push
# Answer 'Y' when prompted
```

### 2. Import Journalists

```bash
node import-journalists.js
```

This will import 225+ journalists across 18 industries:
- Technology (31 journalists)
- Artificial Intelligence (8)
- Fintech (10)
- Cryptocurrency (8)
- Healthcare (11)
- Climate (8)
- Automotive (7)
- Retail (7)
- Media (9)
- Advertising (7)
- Real Estate (5)
- Venture Capital (5)
- Cybersecurity (6)
- Space (5)
- Labor (5)
- Food (4)
- Policy (6)
- Business (7)

### 3. Test the Query

```javascript
const { data } = await supabase
  .from('journalist_registry')
  .select('*')
  .eq('industry', 'artificial_intelligence')
  .eq('tier', 'tier1')
  .limit(10);

console.log(`Found ${data.length} AI journalists:`, data);
```

## Database Schema

```sql
CREATE TABLE journalist_registry (
  id UUID PRIMARY KEY,

  -- Basic Info
  name TEXT NOT NULL,
  outlet TEXT NOT NULL,
  beat TEXT NOT NULL,
  industry TEXT NOT NULL,
  tier TEXT DEFAULT 'tier1',

  -- Contact
  twitter_handle TEXT,
  email TEXT,
  linkedin_url TEXT,
  author_page_url TEXT,

  -- Enriched Data
  recent_articles JSONB DEFAULT '[]',
  bio TEXT,
  topics TEXT[],
  follower_count INTEGER,

  -- Metadata
  last_enriched_at TIMESTAMPTZ,
  enrichment_status TEXT DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Next Steps

### Phase 1: Basic Lookup (Immediate)
1. ✅ Create table
2. ✅ Import journalists
3. Update media list generation to query database
4. Return real journalist data instead of hallucinations

### Phase 2: Enrichment (Next)
1. Build journalist-registry edge function
2. Add Firecrawl integration to scrape:
   - Author pages for bio
   - Latest 5 articles with dates
   - Twitter follower count
3. Enrich on-demand when journalist is requested

### Phase 3: Auto-Update (Future)
1. Schedule daily/weekly enrichment
2. Track journalist movement (outlet changes)
3. Monitor article frequency
4. Add new journalists automatically

## Benefits

1. ✅ **Real Data** - No more hallucinated emails/articles
2. ✅ **Fast** - Query database instead of generating
3. ✅ **Reusable** - Build up knowledge over time
4. ✅ **Enrichable** - Can be continuously updated with latest info
5. ✅ **Accurate** - Verified journalists with correct Twitter handles

## Integration with Media List Generation

**Before:**
```typescript
// Claude generates 2 journalists, then says "I can provide 50 more"
const journalists = await claude.generateMediaList({
  beat: 'AI',
  count: 10
});
// Returns hallucinated data
```

**After:**
```typescript
// Query real database
const journalists = await supabase
  .from('journalist_registry')
  .select('*')
  .contains('beat', 'AI')
  .eq('tier', 'tier1')
  .limit(10);

// Returns REAL journalists with verified Twitter handles
```

## Files Created

1. `supabase/migrations/20251006154435_create_journalist_registry.sql` - Table schema
2. `import-journalists.js` - Import script for 225+ journalists
3. `setup-journalist-table.js` - Helper to show SQL
4. `Journalists.md` - Source data (225+ journalists)

## Current Status

- ✅ Table schema designed
- ✅ Migration file created
- ✅ Import script ready
- ⏳ Waiting for table creation
- ⏳ Ready to import data

Run the setup steps above to activate the journalist registry!
