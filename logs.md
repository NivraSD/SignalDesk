# Google CSE Integration Status
**Date**: 2025-11-22
**CSE ID**: d103f3ed8289a4917

## Current State

### ✅ What's Working:
1. **niv-google-cse function deployed** - Calling Google Custom Search API successfully
2. **GOOGLE_API_KEY configured** - No API authentication errors
3. **Integration complete** - niv-source-direct-monitor now calls niv-google-cse instead of FireSearch
4. **CSE ID corrected** - Using d103f3ed8289a4917 (right Google account)

### ⚠️ What Needs Configuration:

**CSE Returns Very Limited Results:**
- d1 (24 hours): 0 results
- d7 (7 days): 2-6 results per query
- All results from finance.yahoo.com and fool.com only

**Root Cause**: CSE ID `d103f3ed8289a4917` needs domain configuration:

1. **Add 197 trusted domains** to the CSE:
   - File: `/Users/jonathanliebowitz/Desktop/google_cse_domains.md`
   - Contains domains extracted from master-source-registry
   - Go to: https://cse.google.com/cse?cx=d103f3ed8289a4917
   - Click: Setup → Sites to search
   - Paste domains (lines 13-209 from google_cse_domains.md)

2. **Toggle "Search only included sites" to ON**
   - This restricts searches to only the trusted domains

## Test Results (Before Full Configuration)

### Test 1: d1 (24 hours)
```
Query: "KARV" OR "public relations" OR "crisis management"
Results: 0
```

### Test 2: d7 (7 days)
```
Query: "Marubeni"
Results: 2 (both from finance.yahoo.com)

Query: "trading house Japan"
Results: 3 (all from finance.yahoo.com/fool.com)

Query: "energy transition"
Results: 6 (all from finance.yahoo.com)
```

## Expected Results After Configuration

Based on previous testing with CSE `94cfa49e008ce4349` (which had domains configured):
- **36 high-quality results per day** across all query types
- Coverage: competitors (7), industry trends (10), strategic themes (8), stakeholders (1), topics (10)
- 100% relevance across all categories
- Reliable 24-hour filtering with `dateRestrict: 'd1'`

## Next Steps

Once domains are added to CSE `d103f3ed8289a4917`:
1. Run: `node /tmp/test_niv_source_direct.mjs` (test with KARV)
2. Expect: 30-40 articles from Google CSE
3. Verify: All articles from last 24 hours
4. Confirm: Comprehensive coverage (competitors, trends, themes, stakeholders, topics)

## Technical Details

**CSE Configuration:**
- ID: d103f3ed8289a4917
- Endpoint: https://www.googleapis.com/customsearch/v1
- Date filtering: `dateRestrict: 'd1'` (24 hours)
- Results per query: 20 (via pagination)

**Integration:**
- Function: `supabase/functions/niv-google-cse/index.ts`
- Called by: `supabase/functions/niv-source-direct-monitor/index.ts` (lines 392-435)
- Replaced: FireSearch (unreliable date filtering)
- Version: v2025-11-21-intelligent-queries-v3
