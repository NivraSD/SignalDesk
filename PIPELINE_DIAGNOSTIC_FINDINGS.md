# Pipeline Diagnostic Findings for Mitsui & Co.

## Issues Identified

### Issue 1: No Competitor Data Configured
**Root Cause:** Mitsui & Co. had ZERO competitors configured in the system
- `intelligence_targets` table was empty
- `company_profile.competition` was an empty JSON object `{}`

**Impact:** Executive synthesis had no competitors to report on, even though monitoring was working

**Fix Applied:** Populated 12 major competitors:
- Japanese Sogo Shosha: Mitsubishi Corporation, Sumitomo Corporation, Itochu, Marubeni, Toyota Tsusho, Sojitz
- Global Commodity Traders: Glencore, Trafigura, Vitol, Noble Group, Cargill, Louis Dreyfus
- Plus 3 key stakeholders (METI, FTC Japan, Bank of Japan)

### Issue 2: Monitor Findings - What Is Being Discovered?

**Question:** What is niv-fireplexity-monitor-v2 actually finding?

**Investigation:**
- Monitor uses Firecrawl search API + master-source-registry
- Returns ~50-100 articles per run (limited to prevent timeout)
- Articles are NOT stored in database - passed directly to relevance stage
- No way to inspect what was found without logging or database storage

**Concerns:**
- No persistence of raw monitoring results
- Cannot audit what the monitor is finding
- Cannot debug if wrong articles are being collected

**Recommendation:** Add optional storage of monitoring results to `intelligence_findings` table

### Issue 3: Relevance Filter Aggressiveness

**Question:** Is monitor-stage-2-relevance filtering too aggressively?

**Current Behavior:**
- Logs show: 100 articles → 26 articles (26% keep rate, 74% filtered out)
- Uses Claude Sonnet 4 with "INCLUSIVE" prompt: "Cast a WIDE net. Be INCLUSIVE - when in doubt, include it."

**Filter Criteria (Very Broad):**
✅ Relevant:
- Direct competitor news (launches, hires, partnerships, acquisitions, crises)
- Industry context (even without competitor mention)
- Major industry lawsuits/investigations
- Regulatory changes
- Market trends, commodity prices, supply chain
- Technology innovations in industry
- Stakeholder activity

❌ Not Relevant:
- Articles about the organization themselves
- Completely unrelated industries
- Pure spam/promotional content

**Analysis:**
- 26% keep rate may seem aggressive BUT:
  - Many monitoring results are duplicates, spam, or tangentially related
  - The prompt is already very inclusive
  - Without seeing the actual filtered articles, hard to say if too aggressive

**Recommendation:** Log sample of filtered-out articles to audit decisions

### Issue 4: Events Not Appearing in Synthesis

**Question:** Enrichment sent 12 events to synthesis - why aren't they showing up?

**Event Flow:**
1. **Enrichment** extracts events from articles using Claude
2. Returns in TWO structures:
   - `extracted_data.events[]`
   - `organized_intelligence.events[]`
3. **Synthesis** receives enriched_data and looks for events in:
   - `enriched_data.extracted_data.events` (primary)
   - `enriched_data.organized_intelligence.events` (fallback)

**Synthesis Processing (mcp-executive-synthesis/index.ts):**
```typescript
// Line 86-89: Extracts events from organized_intelligence or extracted_data
const events = (organizedData.events && organizedData.events.length > 0)
  ? organizedData.events
  : (extractedData.events || []);
```

**Event Structure Required:**
```typescript
{
  type: "crisis|product|partnership|funding|regulatory|workforce|acquisition|other",
  entity: "Company or Person name (who this event is about)",
  description: "Clear description of what happened",
  category: "competitive|strategic|market|regulatory",
  date: "Date if mentioned"
}
```

**Possible Issues:**
1. Events might have wrong `entity` field (e.g., "Unknown" or organization itself)
2. Events might be filtered by date recency in synthesis
3. Events about Mitsui (the org) are intentionally excluded
4. Synthesis prompt may be filtering events during Claude processing

**Key Code in Synthesis (lines 568-642):**
- Separates events into categories: org, competitors, stakeholders, other
- Uses BALANCED SELECTION to prevent over-emphasis on org news
- Allocates slots: 15 org max, 20 competitor max, 10 stakeholder, 10 other
- Events older than 2 weeks are de-emphasized

**Recommendation:**
1. Add logging of which events are being excluded and why
2. Verify event.entity field matches competitor names exactly
3. Check if events are too old (synthesis prioritizes recent)

## Pipeline Architecture

```
niv-fireplexity-monitor-v2 (finds 100 articles)
  ↓
monitor-stage-2-relevance (filters to 26 articles)
  ↓
monitoring-stage-2-enrichment (extracts 12 events)
  ↓
mcp-executive-synthesis (synthesizes into executive brief)
  ↓
frontend display
```

## Data Flow Issues

1. **No persistence at Monitor stage** - articles not saved, can't audit
2. **No logging of filtered articles** - can't see why 74% were rejected
3. **Event entity matching unclear** - need to verify competitor names match
4. **Recency bias** - old events might be silently dropped

## Next Steps

1. Run a test pipeline with full logging
2. Check actual event entities vs competitor names
3. Add database persistence for monitoring results
4. Log filtered-out articles for auditing
5. Add event filtering diagnostics to synthesis
