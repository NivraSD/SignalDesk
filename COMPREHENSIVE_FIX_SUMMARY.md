# Comprehensive Intelligence Pipeline Fix

## Problem Diagnosis

The intelligence pipeline was fundamentally broken because **organizational context was being collected but never used**. This caused synthesis to treat Mitsui & Co. (the client) as a monitoring subject instead of the intelligence recipient.

### Root Cause: Context Loss Across Pipeline Stages

**What Was Happening:**
```
Discovery collects:
- business_model: "Commodity trading"
- product_lines: ["Metals", "Energy", "Food"]
- key_markets: ["Asia", "Europe"]

But saves to: organization_profiles.profile_data (JSON blob)
Without: structured company_profile field

Enrichment tries to load from: organizations.company_profile ❌
Result: Always gets empty {}

Synthesis receives: No business context
Claude thinks: "Monitor Mitsui" instead of "Brief FOR Mitsui"
Output: "Limited competitive intelligence for Mitsui & Co." ❌
```

## Comprehensive Fix Applied

### Fix 1: Discovery Now Saves company_profile ✅

**File:** `supabase/functions/mcp-discovery/index.ts`
**Line:** 1413-1419

```typescript
// CRITICAL: Company profile for enrichment/synthesis context
company_profile: {
  business_model: profileData.business_model || '',
  product_lines: profileData.product_lines || [],
  key_markets: profileData.key_markets || profileData.market?.key_markets || [],
  strategic_goals: profileData.strategic_goals || profileData.strategic_context?.strategic_priorities || []
},
```

**Impact:** Discovery now preserves business context in a structured format accessible by downstream stages.

---

### Fix 2: Enrichment Uses Profile from Orchestrator ✅

**File:** `supabase/functions/monitoring-stage-2-enrichment/index.ts`
**Line:** 1498-1518

**Before:**
```typescript
// Tried to load from organizations.company_profile (doesn't exist)
const { data: orgData } = await supabase
  .from('organizations')  // ❌ Wrong table
  .select('company_profile')  // ❌ Field doesn't exist
  .eq('name', organization_name)
  .single();
```

**After:**
```typescript
// Use company_profile from profile passed by orchestrator
let companyProfile = profile?.company_profile || {};

if (companyProfile && Object.keys(companyProfile).length > 0) {
  console.log('✅ Using company profile from discovery:', {
    has_business_model: !!companyProfile.business_model,
    product_lines: companyProfile.product_lines?.length || 0,
    key_markets: companyProfile.key_markets?.length || 0,
    strategic_goals: companyProfile.strategic_goals?.length || 0
  });
}
```

**Impact:**
- Enrichment now receives actual business context
- Claude prompts in enrichment include real business model, products, markets
- Executive intelligence summary understands WHY events matter to the client

---

### Fix 3: Synthesis Clarifies Client vs Subject ✅

**File:** `supabase/functions/mcp-executive-synthesis/index.ts`

#### 3A: Load Profile from Enriched Data (Line 271-292)

**Before:**
```typescript
// Tried to load from database
const { data: orgData } = await supabase
  .from('organizations')
  .select('company_profile')
  .eq('id', organization_id)
  .single();
```

**After:**
```typescript
// Use company_profile from enriched_data (comes from discovery via enrichment)
let companyProfile = profile?.company_profile || {};
```

#### 3B: Fix New Synthesis Path with Executive Intelligence (Line 461-471)

**Before:**
```typescript
prompt = `You are writing a DAILY COMPETITIVE INTELLIGENCE BRIEF for ${organization?.name}'s executive team.

MISSION: Report what competitors and stakeholders are doing...`
```

**After:**
```typescript
prompt = `You are writing a DAILY COMPETITIVE INTELLIGENCE BRIEF FOR ${organization?.name}.

🎯 CRITICAL: UNDERSTAND YOUR ROLE
${organization?.name} is YOUR CLIENT. You are writing TO them, not ABOUT them.
${organization?.name} is a ${companyProfile?.business_model || 'company'} operating in ${companyProfile?.key_markets?.join(', ') || 'their markets'}.

YOUR JOB: Tell ${organization?.name} what their COMPETITORS and STAKEHOLDERS are doing.

DO NOT write about ${organization?.name} - they know their own news.
DO NOT say "limited intelligence for ${organization?.name}" - you're writing TO them, not monitoring them.
DO NOT treat ${organization?.name} as a monitoring subject - they are the RECIPIENT of this brief.`
```

#### 3C: Fix Old Synthesis Path (Line 706-729)

**Before:**
```typescript
ORGANIZATION CONTEXT:
- Organization: ${organization?.name}
- Industry: Unknown
- What ${organization?.name} Does: See discovery profile for details

${organization?.name}'s DIRECT COMPETITORS (companies in the SAME industry):
Glencore, Trafigura, etc.
```

**After:**
```typescript
🎯 CRITICAL: UNDERSTAND YOUR ROLE
${organization?.name} is YOUR CLIENT. You are writing TO them, not ABOUT them.

ABOUT YOUR CLIENT:
- Company: ${organization?.name}
- Business: ${companyProfile?.business_model || profile?.description || 'Not specified'}
- Markets: ${companyProfile?.key_markets?.join(', ') || 'Not specified'}

YOUR JOB: Tell ${organization?.name} what their COMPETITORS and STAKEHOLDERS are doing.

DO NOT write about ${organization?.name} - they know their own news.
DO NOT say "limited intelligence for ${organization?.name}" - you're writing TO them, not monitoring them.

COMPETITORS TO REPORT ON (companies ${organization?.name} competes with):
Glencore, Trafigura, etc.
```

**Impact:**
- Synthesis prompts now explicitly state the client relationship
- Claude understands it's writing TO Mitsui, not ABOUT Mitsui
- Business model and markets provide context for why intelligence matters
- Explicit instructions prevent "limited intelligence for Mitsui" phrasing

---

## Expected Outcome

### BEFORE (Broken):
```
Subject: Daily Intelligence Brief
To: Mitsui & Co. Executives

"Today's monitoring reveals limited direct competitive intelligence for
Mitsui & Co., with most trading-related developments focused on financial
markets rather than physical commodity trading..."
```

**Problems:**
- Treating Mitsui as monitoring subject
- Saying "limited intelligence FOR Mitsui" (wrong perspective)
- No business context about what Mitsui does
- Vague about why events matter

### AFTER (Fixed):
```
Subject: Competitive Intelligence Brief - Commodity Trading
To: Mitsui & Co. Executives

YOUR COMPETITIVE LANDSCAPE TODAY:

Glencore (Your Top Competitor):
- Announced expansion into Asian metals trading (Impact: Direct competition
  in your core market)
- Secured new supply contracts in Indonesia (Impact: May affect your pricing
  in regional markets)

Trafigura (Oil & Energy Competitor):
- Launched new logistics partnerships in Middle East (Impact: Monitor for
  counter-moves in your energy division)

REGULATORY DEVELOPMENTS:
- CFTC proposed new position limits for commodity traders (Impact: May
  require adjusting your trading strategies)

STRATEGIC IMPLICATIONS FOR MITSUI:
- Consider accelerating Asian expansion before Glencore establishes dominance
- Review logistics partnerships to match Trafigura's new capabilities
- Prepare compliance updates for new CFTC regulations
```

**Improvements:**
- Writes TO Mitsui, not ABOUT Mitsui
- Every competitor move includes impact TO MITSUI
- Uses business context (commodity trading, Asian markets)
- Provides actionable implications

---

## Data Flow After Fixes

```
┌─────────────┐
│  Discovery  │ Collects: business_model, product_lines, key_markets
│             │ Saves: profile.company_profile { business_model, product_lines, ... }
└──────┬──────┘
       │ profile (with company_profile)
       ▼
┌─────────────┐
│ Orchestrator│ Passes: profile to all downstream stages
└──────┬──────┘
       │ profile
       ▼
┌─────────────┐
│  Enrichment │ Uses: profile.company_profile
│             │ Claude prompts include: "Mitsui is a commodity trading company"
│             │ Creates: executive_intelligence with business context
└──────┬──────┘
       │ enriched_data (includes profile + executive_intelligence)
       ▼
┌─────────────┐
│  Synthesis  │ Uses: profile.company_profile + executive_intelligence
│             │ Claude knows: Mitsui is CLIENT, writes TO them
│             │ Output: "Here's what YOUR competitors are doing..."
└─────────────┘
```

---

## Testing Checklist

### 1. Discovery Output Verification
```bash
# Run discovery for Mitsui
curl -X POST $SUPABASE_URL/functions/v1/mcp-discovery \
  -H "Authorization: Bearer $KEY" \
  -d '{"organization": "Mitsui & Co."}'

# Check output includes company_profile
# Expected: company_profile: { business_model: "...", product_lines: [...], ... }
```

### 2. Enrichment Context Verification
```bash
# Check enrichment logs for:
✅ Using company profile from discovery:
   has_business_model: true
   product_lines: 3
   key_markets: 2

# NOT:
⚠️ No company profile found - using minimal context
```

### 3. Synthesis Output Verification
```bash
# Check synthesis output DOES include:
✅ "Competitive Intelligence Brief FOR Mitsui & Co."
✅ "Here's what your competitors are doing..."
✅ Competitor moves with "Impact to Mitsui: ..."
✅ Strategic implications FOR Mitsui

# Check synthesis output DOES NOT include:
❌ "Limited direct competitive intelligence for Mitsui & Co."
❌ Treating Mitsui as monitoring subject
❌ "Today's monitoring reveals..." (treats Mitsui as subject)
```

### 4. End-to-End Test
```bash
# Run full pipeline
# Expected: Synthesis should say "Here's what Glencore, Trafigura, etc. are doing"
# NOT: "Limited intelligence for Mitsui"
```

---

## Files Modified

1. **supabase/functions/mcp-discovery/index.ts**
   - Line 1413-1419: Added company_profile to output

2. **supabase/functions/monitoring-stage-2-enrichment/index.ts**
   - Line 1498-1518: Use profile.company_profile instead of DB lookup

3. **supabase/functions/mcp-executive-synthesis/index.ts**
   - Line 271-292: Use profile.company_profile instead of DB lookup
   - Line 461-471: Clarify client role in new synthesis path
   - Line 706-729: Clarify client role in old synthesis path

---

## Deployment Steps

1. **Redeploy Discovery Function**
   ```bash
   supabase functions deploy mcp-discovery
   ```

2. **Redeploy Enrichment Function**
   ```bash
   supabase functions deploy monitoring-stage-2-enrichment
   ```

3. **Redeploy Synthesis Function**
   ```bash
   supabase functions deploy mcp-executive-synthesis
   ```

4. **Test Full Pipeline**
   ```bash
   # Run monitoring for Mitsui
   # Verify output treats Mitsui as client, not subject
   ```

---

## What This Fixes

✅ Discovery preserves business context
✅ Enrichment receives business context
✅ Enrichment Claude prompts include real business model
✅ Executive intelligence summary understands client business
✅ Synthesis receives business context
✅ Synthesis understands client vs subject distinction
✅ Synthesis writes TO client, not ABOUT client
✅ Output includes actionable implications FOR client

## What Was Broken Before

❌ Business context collected but not saved retrievably
❌ Enrichment couldn't find business context (wrong table/field)
❌ Claude prompts said "Business Model: Not specified"
❌ Synthesis had no idea what client's business was
❌ Synthesis treated client as monitoring subject
❌ Output said "limited intelligence FOR Mitsui" (wrong perspective)
❌ No actionable implications FOR client business
