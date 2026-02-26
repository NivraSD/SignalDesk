# Root Cause: Onboarding/Discovery Disconnect

## **The Problem**

User completed onboarding for KARV (PR firm) but:
1. **KARV organization doesn't exist in database** (org_id `d9a93509-77d2-4367-860b-50a5343f2b0b` not found)
2. **Zero competitors saved to `intelligence_targets` table**
3. **Executive synthesis generated completely irrelevant content** (AI/healthcare news instead of PR firm news)
4. **Synthesis showed competitors exist** (logs: "competitors: 10" with Edelman, Weber Shandwick, etc.)

## **Where Competitors Come From**

The logs show synthesis reading competitors from TWO sources:

### Primary: `intelligence_targets` table (lines 225-246 in mcp-executive-synthesis)
```typescript
const { data: intelligenceTargets } = await supabase
  .from('intelligence_targets')
  .select('*')
  .eq('organization_id', organization_id)
  .eq('active', true);
```

### Fallback: `company_profile.competition` (lines 256-276)
```typescript
discoveryTargets = {
  competitors: [
    ...(profile?.competition?.direct_competitors || []),
    ...(profile?.competition?.indirect_competitors || []),
    ...(profile?.competition?.emerging_threats || [])
  ].filter(Boolean),
  // ...
}
```

## **Onboarding Flow** (OrganizationOnboarding.tsx)

1. **Line 207-226**: Creates organization via `/api/organizations` POST
2. **Line 281-290**: Updates `company_profile` via `/api/organizations/profile` PUT
   - Saves `competitors: Array.from(selectedCompetitors)` to company_profile
3. **Line 404-422**: Saves targets via `/api/organizations/targets` POST
   - Prepares `targets` array with competitors and stakeholders
   - Calls API with `organization.id` and `targets`

## **The Disconnect**

### Issue #1: Organization Doesn't Exist
KARV (org_id `d9a93509-77d2-4367-860b-50a5343f2b0b`) was never created or was deleted.

**Possibilities:**
- `/api/organizations` POST failed silently
- Organization was created but then deleted
- Frontend is using a cached/stale org_id

### Issue #2: Competitors Not in intelligence_targets
Even though onboarding calls `/api/organizations/targets`, the intelligence_targets table is empty for KARV.

**Possible causes:**
- `/api/organizations/targets` endpoint doesn't exist or is broken
- The API call failed but error was swallowed
- The endpoint exists but doesn't actually insert into `intelligence_targets`
- There's a database constraint preventing the inserts

### Issue #3: Irrelevant Synthesis Content
Because `intelligence_targets` is empty AND `company_profile` is empty (org doesn't exist), the monitoring has:
- **No competitor names to search for**
- **No industry context to filter by**
- **No stakeholder names to track**

Result: Generic broad queries that return random tech news (Nvidia, Meta, etc.)

## **Evidence from KARV Logs**

```
🎯 Final Discovery Targets to Track: {
  competitors: 10,
  stakeholders: 3,
  topics: 0,
  sampleCompetitors: [
    "Edelman",
    "Weber Shandwick",
    "FleishmanHillard",
    "Ketchum",
    "Burson Cohn & Wolfe"
  ]
}
```

This means:
1. Synthesis IS reading competitors (from `company_profile` fallback)
2. BUT monitoring found 0 competitor events: `"Events about direct competitors: 0"`
3. All 28 events were generic tech news (Nvidia, Meta, BBC, etc.)

## **Why Monitoring Failed**

Even with competitors in the fallback profile, monitoring still failed because:

1. **generateIntelligentQueries** (niv-fireplexity-monitor-v2/index.ts:615-723)
   - Uses `discoveryTargets.competitors` to generate queries
   - Prompt says "COMPETITORS TO MONITOR: {competitors.join(', ')}"
   - If competitors list is empty/wrong, queries will be generic

2. **Monitor-stage-2-relevance filtering**
   - Filters based on competitor/stakeholder names
   - If names don't match events, everything gets filtered out
   - Result: 0 competitor events passed through

## **The Real Problem**

**mcp-discovery is NOT populating intelligence_targets table**

Looking at mcp-discovery/index.ts:
- Line 1574-1580: Updates `organizations.company_profile`
- **NO code to insert into `intelligence_targets`**

The discovery function ONLY updates `company_profile`, but the monitoring pipeline reads from `intelligence_targets` as the primary source.

## **Solution**

Need to ensure BOTH tables are populated:

1. **mcp-discovery** should populate:
   - `organizations.company_profile` ✅ (already does)
   - `intelligence_targets` table ❌ (MISSING)

2. **Onboarding** should populate:
   - `organizations` table via `/api/organizations` POST
   - `intelligence_targets` via `/api/organizations/targets` POST
   - Need to verify this API endpoint actually works

3. **Monitoring** should:
   - Read from `intelligence_targets` as primary
   - Fall back to `company_profile` if targets missing
   - Log warnings when fallback is used

## **Immediate Actions**

1. ✅ Check if `/api/organizations/targets` endpoint exists
2. ⚠️ Verify it actually inserts into `intelligence_targets`
3. ❌ Make mcp-discovery also populate `intelligence_targets`
4. ❌ Add error handling so onboarding fails loudly if targets don't save
5. ❌ Add database check: "Do you have competitors configured?" before running pipeline
