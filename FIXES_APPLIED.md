# Executive Synthesis Fix - PR/Strategic Intelligence System

## Problem Summary

The executive synthesis was generating completely irrelevant content for KARV (a PR firm), talking about financial services enforcement (FINRA fines, broker-dealers, AML violations) instead of PR industry intelligence.

### Root Cause Chain

1. **Discovery Phase** - Claude suggested "SEC, FTC, FINRA" as regulators for KARV
2. **Onboarding Phase** - Auto-selected ALL regulators without context or review
3. **Monitoring Phase** - Matched ANY article mentioning SEC (including irrelevant financial enforcement)
4. **Entity Disambiguation Failure** - "Ketchum" PR firm matched "Ketchum, Idaho" city articles
5. **Synthesis Phase** - Received 57 events about financial services, 0 about PR industry

## Core Philosophy Shift

**This is a PR/COMMUNICATIONS INTELLIGENCE SYSTEM, not a generic news monitor.**

Every target must answer:
- How does this impact our **NARRATIVE**?
- How does this affect our **REPUTATION**?
- How does this inform our **STRATEGIC POSITIONING**?

---

## Changes Applied

### 1. Database Schema ✅

Added three columns to `intelligence_targets`:

```sql
ALTER TABLE intelligence_targets
ADD COLUMN monitoring_context TEXT,
ADD COLUMN relevance_filter JSONB,
ADD COLUMN industry_context TEXT;
```

**Purpose:**
- `monitoring_context`: Explains WHY we monitor this target from a PR/strategic perspective
- `relevance_filter`: Include/exclude patterns to prevent noise
- `industry_context`: Helps disambiguate entities (e.g., "Ketchum PR firm" not "Ketchum Idaho")

---

### 2. Discovery Function (mcp-discovery) ✅

**File:** `supabase/functions/mcp-discovery/index.ts`

**Changes:**

#### A. Prompt Updates (lines 526-763)

Added PR/strategic intelligence focus:
```typescript
🎯 CRITICAL: THIS IS A PR/STRATEGIC INTELLIGENCE SYSTEM
This is NOT a generic news monitor. Every target must be justified by PR/strategic value:
- How does monitoring this target impact ${organization_name}'s NARRATIVE?
- How does it affect ${organization_name}'s REPUTATION?
- How does it inform ${organization_name}'s STRATEGIC POSITIONING?

⚠️ FOR REGULATORS/STAKEHOLDERS:
- Only include if their activity DIRECTLY impacts ${organization_name}'s industry/reputation
- Provide clear monitoring_context explaining WHY from a PR perspective
- Include relevance_filter to prevent noise from unrelated enforcement/activity
```

#### B. Structured Output Format (lines 615-649)

Changed from simple strings to rich objects:

**Old Format:**
```json
{
  "competition": {
    "direct_competitors": ["Edelman", "Ketchum", "Weber Shandwick"]
  },
  "stakeholders": {
    "regulators": ["SEC", "FTC", "FINRA"]
  }
}
```

**New Format:**
```json
{
  "competition": {
    "direct_competitors": [
      {
        "name": "Ketchum",
        "monitoring_context": "Major global PR firm competitor - monitor for client wins/losses, executive hires, crisis work, strategic positioning changes",
        "industry_context": "Public Relations & Communications - Ketchum PR firm, NOT Ketchum Idaho city"
      }
    ]
  },
  "stakeholders": {
    "regulators": [
      {
        "name": "SEC",
        "monitoring_context": "Monitor ONLY SEC communications/disclosure regulations affecting PR industry - NOT general enforcement",
        "relevance_filter": {
          "include_patterns": ["investor relations", "disclosure requirements", "communications regulations"],
          "exclude_patterns": ["broker-dealer", "AML violations", "general enforcement"],
          "strategic_angle": "Only relevant when SEC rules change how companies communicate publicly"
        },
        "industry_context": "Public Relations & Communications Services"
      }
    ]
  }
}
```

#### C. Good vs Bad Examples (lines 729-763)

Added clear examples showing proper vs improper regulator monitoring.

#### D. Response Parser Updates (lines 807, 837, 859-870)

Updated to handle both old format (strings) and new format (objects with context):

```typescript
const extractNames = (items: any[]) =>
  items.map(item => typeof item === 'string' ? item : item.name);
```

**Status:** Deployed to Supabase ✅

---

### 3. Onboarding Component ✅

**File:** `src/components/onboarding/OrganizationOnboarding.tsx`

**Changes:**

#### A. Stop Auto-Selecting Stakeholders (lines 136-145)

**Old Code:**
```typescript
// Pre-select stakeholders too (regulators, influencers, customers)
const allStakeholders = [
  ...(data.discovered.stakeholders?.regulators || []),
  ...(data.discovered.stakeholders?.influencers || []),
  ...(data.discovered.stakeholders?.major_customers || [])
]
setSelectedStakeholders(new Set(allStakeholders))
```

**New Code:**
```typescript
// Pre-select ONLY competitors (users should review stakeholders for relevance)
setSelectedCompetitors(new Set(data.discovered.competitors.map(c =>
  typeof c === 'string' ? c : c.name
)))

// DO NOT auto-select stakeholders - they need strategic review
// Regulators especially can create noise if not properly scoped
setSelectedStakeholders(new Set())
```

#### B. Show Monitoring Context in UI (lines 946-985)

**Old UI:** Just showed stakeholder names

**New UI:** Shows name + WHY it matters:

```typescript
<button className="...">
  <div className="flex items-start justify-between gap-2">
    <div className="flex-1">
      <span className="text-sm font-medium block mb-1">{name}</span>
      {context && (
        <span className="text-xs text-gray-400 block leading-relaxed">
          {context}
        </span>
      )}
    </div>
    {selected && <Check />}
  </div>
</button>
```

**Example Display:**
```
✓ SEC
  Monitor ONLY SEC communications/disclosure regulations affecting PR
  industry - NOT general enforcement actions.
```

#### C. Save Context to Database (lines 203-259)

Added helper function to extract monitoring context from discovery data and include it when saving targets:

```typescript
const findTargetContext = (name: string, type: 'competitor' | 'stakeholder') => {
  // Find the full object from discovery data
  const found = fullProfile?.stakeholders?.regulators?.find(...)

  if (found && typeof found === 'object') {
    return {
      monitoring_context: found.monitoring_context,
      industry_context: found.industry_context,
      relevance_filter: found.relevance_filter
    }
  }
  return {}
}

const targets = [
  ...allStakeholders.map(name => ({
    name,
    type: 'stakeholder',
    priority: 'medium',
    active: true,
    ...findTargetContext(name, 'stakeholder') // ← Include context
  }))
]
```

---

## What's Next (Still TODO)

### 4. Relevance Scoring Update (Pending)

**File:** `supabase/functions/niv-fireplexity-monitor-v2/index.ts` or relevance scoring function

**Need to:**
- Load `monitoring_context` and `relevance_filter` from intelligence_targets
- Apply relevance_filter patterns when scoring articles
- Use industry_context for entity disambiguation

**Example Logic:**
```typescript
// Load target with context
const target = await supabase
  .from('intelligence_targets')
  .select('name, monitoring_context, relevance_filter, industry_context')
  .eq('name', 'SEC')
  .single()

// Apply filters
if (target.relevance_filter) {
  const includeMatch = target.relevance_filter.include_patterns.some(pattern =>
    article.content.includes(pattern)
  )
  const excludeMatch = target.relevance_filter.exclude_patterns.some(pattern =>
    article.content.includes(pattern)
  )

  if (excludeMatch || !includeMatch) {
    return 0 // Not relevant
  }
}
```

### 5. Entity Disambiguation (Pending)

Add logic to prevent "Ketchum city" from matching "Ketchum PR firm":

```typescript
// When checking if article mentions "Ketchum"
if (target.industry_context?.includes('PR') || target.industry_context?.includes('Communications')) {
  // Look for PR/communications context in article
  const hasPRContext = article.content.match(/\b(PR firm|public relations|communications agency)\b/i)
  const hasCityContext = article.content.match(/\b(Idaho|city council|municipal)\b/i)

  if (hasCityContext && !hasPRContext) {
    return false // This is about Ketchum city, not Ketchum PR
  }
}
```

### 6. Synthesis Prompt Enhancement (Pending)

**File:** `supabase/functions/mcp-executive-synthesis/index.ts`

Update synthesis prompt to clearly separate:

```typescript
ORGANIZATION CONTEXT:
- Name: ${organization.name}
- Industry: ${organization.industry}
- What ${organization.name} does: ${organization.description}
- ${organization.name}'s Competitors: ${competitors.join(', ')}

MONITORING TARGETS (what ${organization.name} is tracking):
- Stakeholders being monitored: ${stakeholders.map(s => s.name).join(', ')}
- Why we monitor each:
  ${stakeholders.map(s => `  • ${s.name}: ${s.monitoring_context}`).join('\n')}

CRITICAL: When analyzing competitive moves, focus on OTHER ${organization.industry} COMPANIES competing with ${organization.name}.
When analyzing stakeholder/regulatory news, only include if it relates to ${organization.industry}, not general enforcement.
```

### 7. End-to-End Testing (Pending)

Test with KARV:
1. Run discovery - verify structured output with monitoring_context
2. Complete onboarding - verify stakeholders not auto-selected, context shown
3. Run monitoring - verify relevance filtering works
4. Check synthesis - verify it talks about PR industry, not financial services

---

## Expected Outcome

For KARV (PR firm), synthesis should now discuss:
- ✅ Competitor PR firm wins/losses (Edelman, Ketchum, Weber Shandwick)
- ✅ Major corporate crises creating demand for PR services
- ✅ PR industry reputation events
- ✅ Changes in communications regulations affecting PR industry
- ❌ NOT: Generic FINRA enforcement on broker-dealers
- ❌ NOT: Articles about Ketchum, Idaho city council

---

## Files Modified

1. **Database:** `intelligence_targets` table (3 new columns)
2. **Backend:** `supabase/functions/mcp-discovery/index.ts` (deployed)
3. **Frontend:** `src/components/onboarding/OrganizationOnboarding.tsx`
4. **Migration:** `supabase/migrations/20251031_add_monitoring_context_to_intelligence_targets.sql`

## Files Still Need Updates

1. `supabase/functions/niv-fireplexity-monitor-v2/index.ts` (relevance scoring)
2. `supabase/functions/mcp-executive-synthesis/index.ts` (synthesis prompt)
3. Any other relevance scoring/filtering logic

---

## Testing Checklist

- [ ] Discovery generates structured targets with monitoring_context
- [ ] Onboarding shows context and doesn't auto-select stakeholders
- [ ] Targets saved to DB include monitoring_context fields
- [ ] Relevance scoring uses relevance_filter to exclude noise
- [ ] Entity disambiguation prevents city/company confusion
- [ ] Synthesis separates org industry from monitoring targets
- [ ] End-to-end test with KARV shows relevant PR industry intelligence
