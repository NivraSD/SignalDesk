# SignalDesk Intelligence Pipeline - Production Architecture

## SYSTEM OVERVIEW

**PURPOSE:** Monitor competitors, stakeholders, and industry news in real-time using AI-powered intelligence gathering.

## COMPLETE DATA FLOW

```
Frontend (Browser)
    ↓ calls with organization_id
MCP Discovery (Supabase Edge Function)
    ↓ fetches sources from
Master Source Registry (~150-200 curated sources)
    ↓ saves to
organizations.company_profile.sources (PostgreSQL)
    ↓ frontend calls
NIV Fireplexity Monitor V2 (Supabase Edge Function)
    ↓ reads from
organizations.company_profile.sources
    ↓ extracts domains
Two-Tier Firecrawl Search
    ↓ returns articles to
Enrichment → Synthesis → Frontend Display
```

## THE BUG WE'RE FIXING

**PROBLEM:**
Monitoring returns 0 articles because it can't find any sources to search.

**ROOT CAUSE:**
MCP Discovery was saving profile to `organization_profiles` table.
Monitoring was reading from `organizations.company_profile` column.
**THEY WERE USING DIFFERENT STORAGE LOCATIONS.**

**IMPACT:**
- Monitoring has no approved domains for TIER 1 searches
- Falls back to TIER 2 only (open web with score >70)
- Firecrawl returns 0 results
- No articles reach enrichment/synthesis
- Users see empty intelligence reports

## COMPONENTS INVOLVED

### 1. Frontend: intelligenceService.ts
**Location:** `src/lib/services/intelligenceService.ts`
**Role:** Orchestrates the entire pipeline
**Key Function:** `startPipeline(organizationId, organizationName, industryHint)`

**CRITICAL FIX APPLIED:**
```typescript
// Line 52-64: Now passes organization_id to Discovery
const payload = {
  tool: 'create_organization_profile',
  arguments: {
    organization_id: organizationId,  // ← ADDED THIS
    organization_name: orgName,
    industry_hint: industry,
    // ... other params
  }
}
```

**STATUS:**
- ✅ Code committed (commit: 93414cd77)
- ✅ Pushed to GitHub
- ⏳ NEEDS: Browser refresh to load new code

### 2. MCP Discovery Function
**Location:** `supabase/functions/mcp-discovery/index.ts`
**Role:** Generate organization profile with competitors, stakeholders, and sources

**DATA FLOW:**
1. Receives `organization_id` from frontend
2. Calls `master-source-registry` with industry
3. Gets ~150-200 sources across categories:
   - competitive (industry news)
   - media (mainstream news)
   - regulatory (government/compliance)
   - market (financial data)
   - specialized (niche publications)
4. Saves complete profile to `organizations.company_profile`

**CRITICAL FIX APPLIED:**
```typescript
// Line 167-178: Now accepts organization_id parameter
const {
  organization_id,  // ← ADDED THIS
  organization_name,
  industry_hint,
  // ... other params
} = args;

// Line 1545-1576: Completely rewrote saveProfile function
async function saveProfile(organizationId: string, profile: any) {
  // Now saves to organizations.company_profile instead of organization_profiles table
  const { data, error } = await supabase
    .from('organizations')
    .update({
      company_profile: profile,  // ← Saves to correct location
      updated_at: new Date().toISOString()
    })
    .eq('id', organizationId)
    .select();
}
```

**STATUS:**
- ✅ Deployed to Supabase
- ⏳ NEEDS: Re-run Discovery with organization_id parameter

### 3. Master Source Registry
**Location:** `supabase/functions/master-source-registry/index.ts`
**Role:** Curated list of ~150-200 news sources by industry

**SOURCE CATEGORIES:**
- TIER1_SOURCES: Critical mainstream sources (WSJ, Reuters, Bloomberg, NYT, FT)
- INDUSTRY_SOURCES: Industry-specific publications by category
  - Commodity Trading: Mining.com, Kitco, S&P Global Commodity Insights
  - Energy: Oil Price, Renewable Energy World
  - Finance: Financial Times, American Banker
  - Technology: TechCrunch, Ars Technica, The Verge

**DATA RETURNED:**
```json
{
  "sources": {
    "competitive": [{ "name": "Mining.com", "url": "https://mining.com/feed", "priority": "high" }],
    "media": [{ "name": "WSJ", "url": "https://feeds.wsj.com/..." }],
    "regulatory": [{ "name": "SEC.gov", "url": "..." }],
    "market": [{ "name": "MarketWatch", "url": "..." }],
    "specialized": [...]
  },
  "total_sources": 121
}
```

**STATUS:** ✅ Working correctly (verified in logs: 121 sources returned)

### 4. NIV Fireplexity Monitor V2
**Location:** `supabase/functions/niv-fireplexity-monitor-v2/index.ts`
**Role:** Search for articles using Firecrawl with two-tier strategy

**DATA FLOW:**
1. Receives `organization_id` from frontend
2. Loads `organizations.company_profile` from database
3. Extracts domains from `profile.sources`
4. Executes TWO-TIER search:
   - **TIER 1:** Domain-restricted to approved sources (15 results/query)
   - **TIER 2:** Open web with score >70 filter (5 results/query)
5. Returns articles to frontend

**DOMAIN EXTRACTION:**
```typescript
// Line 824-854: Extracts domains from all source categories
function extractDomainsFromSources(sources: any): string[] {
  const domains = new Set<string>()

  // Process all categories
  if (sources.media) processSourceList(sources.media)
  if (sources.regulatory) processSourceList(sources.regulatory)
  if (sources.market) processSourceList(sources.market)
  if (sources.competitive) processSourceList(sources.competitive)
  if (sources.specialized) processSourceList(sources.specialized)

  return Array.from(domains)
}

// Line 878-903: Reads sources from profile
const sourcesFromProfile = profile.sources || profile.monitoring_config?.sources_by_category

if (sourcesFromProfile) {
  approvedDomains = extractDomainsFromSources(sourcesFromProfile)
  console.log(`✅ Extracted ${approvedDomains.length} approved domains`)
} else {
  console.log(`⚠️ No sources found in company_profile`)
}
```

**STATUS:**
- ✅ Deployed to Supabase
- ✅ Correctly reads from `profile.sources`
- ⏳ NEEDS: Discovery to save sources first

## VERIFICATION CHECKLIST

### STEP 1: Verify Frontend Deployment
**Action:** Refresh browser, open DevTools Console
**Expected:** When running Discovery, console shows:
```
Calling mcp-discovery with payload: {
  tool: "create_organization_profile",
  arguments: {
    organization_id: "4f9504ea-9ba3-4696-9e75-8f226f23f4ad",  ← MUST BE PRESENT
    organization_name: "Mitsui & Co.",
    ...
  }
}
```

**Verification Command:** Look at browser console when clicking "Run Intelligence"

### STEP 2: Verify MCP Discovery Saves Sources
**Action:** Run Discovery, check Supabase logs
**Expected:** In logs.md, should see:
```
💾 Saving profile to organizations.company_profile for org: 4f9504ea-9ba3-4696-9e75-8f226f23f4ad
   Profile has 6 source categories
   Source categories: competitive, media, regulatory, market, specialized, forward
✅ Profile saved successfully to organizations.company_profile
   Verified sources in saved profile: 6 categories
```

**Should NOT see:**
```
⚠️ Cannot save profile - organization_id not provided
```

**Verification Command:**
```bash
psql "$DATABASE_URL" -c "SELECT
  id,
  name,
  company_profile->'sources'->'media' IS NOT NULL as has_media,
  company_profile->'sources'->'competitive' IS NOT NULL as has_competitive,
  jsonb_array_length(company_profile->'sources'->'media') as media_count
FROM organizations
WHERE id = '4f9504ea-9ba3-4696-9e75-8f226f23f4ad';"
```

**Expected Result:**
```
id                                   | name          | has_media | has_competitive | media_count
-------------------------------------|---------------|-----------|-----------------|------------
4f9504ea-9ba3-4696-9e75-8f226f23f4ad | Mitsui & Co. | t         | t               | 40
```

### STEP 3: Verify Monitoring Finds Sources
**Action:** Run Monitoring, check Supabase logs
**Expected:** In logs.md, should see:
```
📋 Checking for sources in company_profile...
   Profile keys: ... sources ... ← MUST INCLUDE "sources"
✓ Found sources, extracting domains...
   Source categories: competitive, media, regulatory, market, specialized
     - competitive: 20 sources
     - media: 40 sources
     - regulatory: 15 sources
     - market: 25 sources
     - specialized: 21 sources
✅ Extracted 150 approved domains
   Sample domains: mining.com, wsj.com, reuters.com, bloomberg.com, ft.com
```

**Should NOT see:**
```
⚠️ No sources found in company_profile
Falling back to TIER 2 (open web) search only
```

### STEP 4: Verify Firecrawl Returns Articles
**Action:** Check logs.md after monitoring completes
**Expected:**
```
📊 Search tier breakdown:
      TIER 1 (trusted sources): 45 articles
      TIER 2 (open web >70 score): 12 articles
      Total unique articles: 57

✓ Found 57 articles from Firecrawl
```

**Should NOT see:**
```
TIER 1 (trusted sources): 0 articles
TIER 2 (open web >70 score): 0 articles
✓ Found 0 articles from Firecrawl
```

## CURRENT STATUS

### ✅ COMPLETED
1. Identified bug: Discovery saving to wrong table
2. Fixed MCP Discovery to save to `organizations.company_profile`
3. Fixed frontend to pass `organization_id` to Discovery
4. Deployed backend functions to Supabase
5. Committed and pushed frontend code to GitHub

### ⏳ PENDING VERIFICATION
1. Browser refresh to load new frontend code
2. Re-run Discovery with organization_id parameter
3. Verify sources saved to database
4. Run Monitoring and verify it finds sources
5. Verify Monitoring returns articles from Firecrawl

### 🚨 BLOCKERS
- Cannot verify until user refreshes browser and runs Discovery again

## PRODUCTION DEPLOYMENT CHECKLIST

**For ANY future changes:**
- [ ] Make code changes locally
- [ ] Deploy Supabase functions: `supabase functions deploy <function-name>`
- [ ] Commit frontend code: `git add . && git commit -m "..."`
- [ ] Push to GitHub: `git push`
- [ ] Verify in browser: Refresh and check console
- [ ] Run full pipeline and check logs.md
- [ ] Verify database state with SQL queries
- [ ] Confirm articles returned
- [ ] Update this document with results

## TROUBLESHOOTING

### If Discovery still shows "Cannot save profile"
**Check:** Browser console payload includes organization_id
**Fix:** Hard refresh browser (Cmd+Shift+R)

### If Monitoring shows "No sources found"
**Check:** Database query for sources
**Fix:** Re-run Discovery first

### If Monitoring returns 0 articles
**Check:**
1. Sources exist in database
2. Monitoring logs show "Extracted X approved domains"
3. Firecrawl API is not rate-limiting

## KEY LEARNINGS

1. **Storage Location Matters:** Discovery and Monitoring must use the SAME storage location
2. **Verify End-to-End:** Deploy ALL changes before claiming "done"
3. **Check Database State:** SQL queries are truth, logs can lie
4. **Frontend + Backend:** Both must be deployed for changes to work
5. **Use TodoWrite:** Track every step to avoid missing deployments
