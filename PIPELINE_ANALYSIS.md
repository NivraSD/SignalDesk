# Intelligence Pipeline Context Flow Analysis

## Problem Statement
Mitsui & Co. is the CLIENT receiving intelligence about their COMPETITORS.
The synthesis output says "limited direct competitive intelligence for Mitsui & Co." - treating Mitsui as the monitoring target instead of the client.

## Pipeline Stages Analysis

### STAGE 1: mcp-discovery
**Purpose:** Learn about the client organization (Mitsui)
**Input:** organization_name, industry_hint, product_lines, key_markets, business_model
**Claude Prompt Receives:** YES - business_model, product_lines, key_markets are in the prompt
**Output Structure:** Saves to `organization_profiles.profile_data` (JSON blob)
**What Gets Saved:**
- organization_name
- industry
- description
- competition.direct_competitors
- competition.indirect_competitors
- stakeholders.regulators
- stakeholders.key_analysts
- market.key_markets
- monitoring_config

**CRITICAL MISSING:** Discovery does NOT save a structured `company_profile` field with:
- business_model
- product_lines
- key_markets
- strategic_goals

These are passed to Claude but NOT preserved in the database!

---

### STAGE 2: niv-fireplexity-monitor-v2
**Purpose:** Search for news about competitors/stakeholders
**Context Needed:**
- Who is the client?
- What do they do?
- Why do they care about these competitors?

**Context Actually Received:** Need to check what orchestrator passes

**What It Does:**
- Searches Perplexity for news using discovery_context queries
- Returns ~200 articles with title + description

**Context Passed Forward:** Articles with relevance scores

---

### STAGE 3: monitor-stage-2-relevance
**Purpose:** Score articles based on relevance to client's interests
**Context Needed:**
- Client's business model
- Client's markets
- Why each competitor matters to the client

**Context Actually Received:** Need to check

**What It Does:**
- Scores articles
- Scrapes top articles for full content
- Adds pr_extraction with intelligence signals

**Context Passed Forward:** Scored articles

---

### STAGE 4: monitoring-stage-2-enrichment
**Purpose:** Extract structured intelligence (events, entities, quotes)
**Context Needed:**
- Client's business model (to understand what matters)
- Client's products/markets (to contextualize events)
- Client's strategic goals (to assess implications)

**Context Actually Received:**
- Receives: `profile` (from organization_profiles), `organization_name`
- TRIES to load: `organizations.company_profile` WHERE `name = organization_name`
- PROBLEM: Discovery saves to `organization_profiles`, not `organizations`
- PROBLEM: Even if it found the org, `company_profile` field doesn't exist!

**Code Issues:**
```typescript
// Line 1502-1506 in enrichment
const { data: orgData } = await supabase
  .from('organizations')  // ❌ WRONG TABLE
  .select('company_profile')  // ❌ FIELD DOESN'T EXIST
  .eq('name', organization_name)  // ❌ Looking up by wrong field
  .single();
```

**What Gets Passed to Claude:**
- analyzeSummariesWithClaude: Gets companyProfile (always empty {})
- createExecutiveIntelligenceSummary: Gets companyProfile (always empty {})
- Prompts say "Business Model: Not specified"

---

### STAGE 5: mcp-executive-synthesis
**Purpose:** Write executive brief FOR the client ABOUT competitors
**Context Needed:**
- WHO the client is (Mitsui)
- WHAT they do (commodity trading)
- WHY they care about competitors
- WHAT the client should do with this intelligence

**Context Actually Received:**
- organization?.name: "Mitsui & Co."
- profile?.description: Some generic text
- discoveryTargets.competitors: List of competitor names
- NO business model, NO products, NO markets, NO strategic context

**What the Prompt Says:**
```
ORGANIZATION CONTEXT:
- Organization: Mitsui & Co.
- Industry: Unknown
- What Mitsui & Co. Does: See discovery profile for details  // ❌ USELESS

Mitsui & Co.'s DIRECT COMPETITORS (companies in the SAME industry):
Glencore, Trafigura, Vitol, etc.
```

**What Claude Understands:**
- Mitsui is an organization being monitored
- Here are some competitors (no context why)
- Here are some events about various companies
- ❌ NO IDEA that Mitsui is the CLIENT
- ❌ NO IDEA what business Mitsui is in
- ❌ NO IDEA why Mitsui cares about these events

**Output:**
> "Today's monitoring reveals limited direct competitive intelligence for Mitsui & Co..."

Claude thinks it's supposed to find news ABOUT Mitsui, not FOR Mitsui!

---

## Root Causes

### 1. CONTEXT STORAGE BROKEN
- Discovery collects business_model, product_lines, key_markets
- Discovery passes them to Claude for analysis
- Discovery does NOT save them in a retrievable format
- They're lost after discovery finishes

### 2. CONTEXT RETRIEVAL BROKEN
- Enrichment tries to load `organizations.company_profile`
- But discovery saves to `organization_profiles.profile_data`
- Table mismatch = always returns null
- Even if table was correct, field name is wrong

### 3. CONTEXT USAGE BROKEN
- Synthesis receives empty company context
- Synthesis prompt doesn't explain the PURPOSE of the brief
- Synthesis prompt treats client as monitoring subject, not recipient
- Claude has no idea why Mitsui cares about competitors

### 4. SEMANTIC CONFUSION
- System confuses "organization being monitored" with "organization receiving intelligence"
- Events are categorized as "about org" vs "about competitors"
- But Mitsui IS the org AND should read about competitors!
- Architecture assumes monitoring someone ELSE, not monitoring FOR someone

---

## Required Fixes

### Fix 1: Discovery Must Save Company Profile
```typescript
// In structureFinalProfile, ADD:
company_profile: {
  business_model: profileData.business_model || business_model,
  product_lines: product_lines,
  key_markets: key_markets,
  strategic_goals: profileData.strategic_goals || []
}
```

### Fix 2: Create company_profile in organizations table
```sql
ALTER TABLE organizations ADD COLUMN company_profile JSONB;

-- Copy from organization_profiles
UPDATE organizations o
SET company_profile = op.profile_data->'company_profile'
FROM organization_profiles op
WHERE o.name = op.organization_name;
```

### Fix 3: Enrichment Must Load from Correct Source
```typescript
// Try organization_profiles first (where discovery saves)
const { data: profileData } = await supabase
  .from('organization_profiles')
  .select('profile_data')
  .eq('organization_name', organization_name)
  .single();

const companyProfile = profileData?.profile_data?.company_profile || {};
```

### Fix 4: Synthesis Must Understand Its Purpose
```typescript
// Synthesis prompt needs:
`You are writing an EXECUTIVE INTELLIGENCE BRIEF FOR ${organization?.name}.

${organization?.name} is YOUR CLIENT. They are a ${companyProfile.business_model} company
operating in ${companyProfile.key_markets.join(', ')}.

Your job: Tell ${organization?.name} what their COMPETITORS are doing so they can make
informed business decisions.

DO NOT write about ${organization?.name} - they know their own news.
DO NOT say "limited intelligence for ${organization?.name}" - you're writing TO them, not ABOUT them.

COMPETITORS TO REPORT ON:
${competitors.map(c => `- ${c.name}: Why ${organization?.name} cares - ${c.strategic_relevance}`).join('\n')}
`
```

### Fix 5: Remove "Events About Org" Logic
The synthesis code filters for "eventsAboutOrg" assuming the client wants to read about themselves.
This is wrong for competitive intelligence. Remove this categorization or flip the logic.

---

## Implementation Plan

1. **Update Discovery** - Save company_profile in output
2. **Update Database** - Ensure organizations.company_profile exists
3. **Update Enrichment** - Load profile from correct source, pass to all Claude calls
4. **Update Synthesis** - Rewrite prompt to clarify purpose and client identity
5. **Test End-to-End** - Run full pipeline and verify synthesis understands client vs subject

---

## Expected Outcome After Fixes

**Before:**
> "Today's monitoring reveals limited direct competitive intelligence for Mitsui & Co..."

**After:**
> "Competitive Intelligence Brief for Mitsui & Co.'s Commodity Trading Operations
>
> Key Competitor Moves:
> - Glencore announced X (impact: affects your metals trading division)
> - Trafigura did Y (impact: competes with your oil logistics)
>
> Strategic Implications for Mitsui:
> - Consider expanding in Z market before Glencore
> - Monitor Trafigura's logistics partnerships for counter-moves"
