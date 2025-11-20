# Synthesis Event Filtering Issue

## **The Problem**

Enrichment sends 12 events → Synthesis reports "Events about competitors: 0"

The user's concern: **Synthesis is receiving events but not using them in the final output.**

---

## **Root Cause: Entity Matching is Too Strict**

### **How Synthesis Filters Events (Lines 568-642)**

1. **Categorizes all events by entity:**
```typescript
const eventsAboutOrg = allEvents.filter(e => {
  const entityLower = e.entity?.toLowerCase() || '';
  return entityLower.includes(orgName);
});

const eventsAboutCompetitors = allEvents.filter(e => {
  const entityLower = e.entity?.toLowerCase() || '';
  return competitorNames.some(comp => entityLower.includes(comp));
});

const eventsAboutStakeholders = allEvents.filter(e => {
  const entityLower = e.entity?.toLowerCase() || '';
  return stakeholderNames.some(stake => entityLower.includes(stake));
});
```

2. **Applies slot limits (even if more events available):**
```typescript
const orgSlots = Math.min(Math.max(5, Math.floor(eventsAboutOrg.length * 0.3)), 15);
const competitorSlots = Math.min(Math.max(10, Math.floor(eventsAboutCompetitors.length * 0.6)), 20);
const stakeholderSlots = Math.min(Math.max(5, Math.floor(eventsAboutStakeholders.length * 0.5)), 10);
const otherSlots = Math.min(Math.max(5, Math.floor(eventsOther.length * 0.5)), 10);

const topEvents = [
  ...eventsAboutOrg.slice(0, orgSlots),
  ...eventsAboutCompetitors.slice(0, competitorSlots),
  ...eventsAboutStakeholders.slice(0, stakeholderSlots),
  ...eventsOther.slice(0, otherSlots)
].slice(0, maxEvents); // Max 50 events total
```

3. **De-emphasizes old events (Lines 799-804):**
```
Events from 2+ weeks ago = ignore unless ongoing strategic impact
```

---

## **Why KARV Had 0 Competitor Events**

Looking at the KARV logs:
- **Enrichment extracted 12 events**
- **Entity extraction found:** "icr: 3 events", "Adding: 1", "Simultaneously: 1", "Assessing: 1"
- **Competitors configured:** Edelman, Weber Shandwick, FleishmanHillard, Ketchum, etc.

**The matching failed because:**

### Issue #1: Entity Extraction is Broken
Enrichment extracted these "entities":
- ✅ `icr` (matches ICR competitor)
- ❌ `Adding` (a verb)
- ❌ `Simultaneously` (an adverb)
- ❌ `Assessing` (a verb)
- ❌ `With Financier` (nonsense)

Only 1 out of 12 events had a valid entity that matched a competitor.

### Issue #2: Entity Name Doesn't Match Competitor Name
The matching is done with `includes()`:
```typescript
competitorNames.some(comp => entityLower.includes(comp))
```

If enrichment extracts:
- Entity: `icr` → Matches `ICR` ✅
- Entity: `Edelman PR` → Matches `Edelman` ✅
- Entity: `Weber Shandwick New York` → Matches `Weber Shandwick` ✅

But if enrichment extracts:
- Entity: `Nvidia` → Doesn't match any PR firm ❌
- Entity: `Meta` → Doesn't match any PR firm ❌
- Entity: `BBC` → Doesn't match any PR firm ❌

Result: 0 competitor events classified

---

## **The Cascade Effect**

1. **Enrichment extracts entities wrong** → Generic tech company names (Nvidia, Meta)
2. **Synthesis matches entities to competitors** → 0 matches found
3. **Synthesis applies slot allocation** → competitorSlots = 0 (because 0 available)
4. **Final synthesis has no competitor intel** → User sees irrelevant content

---

## **The Real Issue: Entity Extraction in Enrichment**

The problem starts BEFORE synthesis - in the enrichment stage (monitoring-stage-2-enrichment).

Enrichment is supposed to extract structured events with accurate entity fields:
```typescript
{
  type: "partnership",
  entity: "Edelman",  // ← This should be the competitor name
  description: "Edelman announces partnership with tech firm",
  date: "2025-11-20"
}
```

But it's extracting:
```typescript
{
  type: "unknown",
  entity: "Nvidia",  // ← This is from the article content, not related to PR
  description: "Nvidia AI partnership",
  date: "2025-11-20"
}
```

---

## **Additional Filtering Issues**

### 1. **Slot Limits Are Too Restrictive**

Even if we fix entity extraction, synthesis caps:
- Max 15 org events (even if 50 available)
- Max 20 competitor events (even if 50 available)
- Max 10 stakeholder events
- Max 50 events total

For KARV with 10 competitors, this means:
- 20 competitor events ÷ 10 competitors = 2 events per competitor average
- If Edelman has 10 events but Weber Shandwick has 0, distribution is uneven

### 2. **Recency Bias**

Lines 799-1036 heavily prioritize recent events:
- Today/this week → Executive summary
- 1-2 weeks ago → Brief mention if strategic
- 2+ weeks ago → Ignore

If the 12 events are all 3+ weeks old, synthesis might ignore them entirely.

### 3. **Entity Matching is Case-Sensitive String Includes**

```typescript
entityLower.includes(comp)
```

This works for:
- "edelman" includes "edelman" ✅
- "edelman pr" includes "edelman" ✅

But fails for:
- "edelmann" (typo) doesn't include "edelman" ❌
- "ed" (abbreviation) matches "edelman" but too loose ❌

---

## **The Fix Strategy**

### 1. **Fix Entity Extraction in Enrichment** (PRIMARY)
   - Enrichment should extract entities that match intelligence_targets
   - For KARV monitoring, if article mentions "Edelman won Toyota account", entity should be "Edelman" not "Toyota"

### 2. **Loosen Entity Matching in Synthesis** (SECONDARY)
   - Use fuzzy matching or normalized names
   - Match against both entity and article content
   - Accept partial matches with confidence thresholds

### 3. **Remove Artificial Slot Limits** (TERTIARY)
   - If we have 30 competitor events, use all 30 (up to reasonable limit)
   - Don't artificially cap at 20 when we have more relevant intel

### 4. **Better Recency Handling**
   - Don't completely ignore 2-week-old events
   - Adjust prioritization based on event type (major acquisitions still relevant after 2 weeks)

---

## **Immediate Action**

The root cause is in **monitoring-stage-2-enrichment** entity extraction, NOT in synthesis filtering.

Need to check enrichment prompt and entity extraction logic:
1. How is enrichment identifying entities?
2. Why is it extracting "Nvidia" and "Meta" for a PR firm?
3. How can we make it extract competitor names from articles?
