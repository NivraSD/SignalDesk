# Intelligent Search Upgrade - Strategic Positioning Analysis

## **DEPLOYED** ✅

We've completely rewritten the monitoring system to use **strategic intelligence questions** instead of dumb keyword scraping.

---

## What Was Wrong

### Old Approach (Keyword Scraper):
```typescript
// Generated 70+ dumb queries like:
"Edelman announced"
"Weber Shandwick (hire OR appointed)"
"PR agency acquisition"

// Problems:
// - No strategic context
// - Just grep on steroids
// - Returns "Edelman opens Dubai office" with no analysis of what it means
// - Not using MCP Discovery intelligence at all
```

**Result:** Generic news with zero strategic value. Old content (2023/2024) passing through because Firecrawl returns articles without publishedTime, so they default to "now".

---

## New Approach (Strategic Intelligence)

### 1. **Query Generation Uses MCP Discovery Context**

**Before:**
- Ignored `intelligence_context` completely
- Generated keyword boolean queries

**After:**
```typescript
intelligenceContext = {
  monitoring_prompt: "Strategic intelligence about...",
  key_questions: [
    "What competitive threats...",
    "How are market dynamics..."
  ],
  analysis_perspective: "KARV's executive team making decisions"
}

// Generate strategic questions:
queries = [
  "What recent strategic moves has Edelman made in the Public Relations market that could affect KARV?",
  "What vulnerabilities or opportunities has Weber Shandwick created through recent announcements?",
  "What critical developments or narrative shifts are happening in the PR industry that KARV should be aware of?"
]
```

### 2. **Every Search Includes Strategic Context**

**Firecrawl now receives:**
```typescript
query: "What recent strategic moves has Edelman made..."
context: {
  organization: "KARV",
  analysis_goal: "Strategic positioning analysis for executive intelligence",
  key_focus: [
    "Competitive positioning shifts",
    "Emerging opportunities and risks",
    "Market narrative changes",
    "Critical developments affecting business strategy"
  ],
  perspective: "KARV executive team making strategic decisions"
}
```

This tells Firecrawl **WHY** we're searching and **WHAT** we care about.

### 3. **Query Types Now Generated**

From MCP Discovery's `intelligence_context`:

**A. MCP Discovery Key Questions** (if available)
- Uses the strategic questions Discovery generated based on org profile

**B. Competitor Positioning Questions** (top 5 competitors)
```
"What recent strategic moves or positioning changes has {competitor} made that could affect {org}?"
"What vulnerabilities or opportunities has {competitor} created?"
```

**C. Industry Dynamics Questions**
```
"What critical developments or narrative shifts are happening in {industry}?"
"What emerging opportunities or risks are appearing in the market landscape?"
```

**D. Stakeholder Questions** (top 3 stakeholders)
```
"What positions or actions is {stakeholder} taking that could impact {org}'s positioning?"
```

**Typical result:** 15-25 strategic questions instead of 70+ keyword queries

---

## Key Changes

### File: `niv-fireplexity-monitor-v2/index.ts`

**Lines 774-852: Rewrote `generateRealtimeQueries()`**
- Now extracts and uses `intelligence_context` from profile
- Generates strategic questions focused on positioning/opportunities/risks
- Uses MCP Discovery's `key_questions` as foundation
- Creates competitor positioning questions
- Adds industry dynamics and stakeholder questions

**Lines 225-229: Removed Keyword Query Additions**
```diff
- // ALWAYS add competitor-specific queries for precision targeting
- allCompetitors.forEach(competitor => {
-   queries.push(`${competitor} announced`)
-   queries.push(`${competitor} (acquisition OR partnership OR merger)`)
-   ...
- })
+ // Strategic queries now generated inside generateRealtimeQueries
+ // No more dumb keyword additions - everything is intelligence-driven
```

**Lines 313-327: Build Strategic Context**
```typescript
const strategicContext = {
  organization: orgName,
  industry: profile.industry,
  analysis_goal: "Strategic positioning analysis for executive intelligence",
  key_focus: [
    "Competitive positioning shifts",
    "Emerging opportunities and risks",
    "Market narrative changes",
    "Critical developments affecting business strategy"
  ],
  perspective: intelligenceContext?.analysis_perspective,
  monitoring_prompt: intelligenceContext?.monitoring_prompt
}
```

**Lines 1081-1093: Context Included in Searches**
```typescript
const contextualQuery = `${query} [Strategic intelligence for ${org}: ${key_focus}]`
```

**Lines 1047-1057: Enhanced Logging**
- Now logs strategic context and questions
- Shows first 3 strategic questions instead of keyword samples

### File: `monitoring-stage-2-enrichment/index.ts`

**Lines 140-146: Debug Logging for Targets**
```typescript
console.log(`🎯 Intelligence targets loaded:`, {
  organization: targets.organization,
  competitors: targets.competitors,
  stakeholders: targets.stakeholders.slice(0, 5)
})
```

**Lines 273-278: Debug Entity Extraction Rules**
- Logs what rules are being sent to Claude
- Shows competitors list in prompt

**Lines 306-311: Debug Claude's Extracted Entities**
```typescript
console.log(`🔍 Claude extracted ${events.length} events with entities:`, uniqueEntities)
```

---

## Expected Results

### In Logs:
```
🎯 Intelligence-driven query generation for KARV
Strategic context available: {
  hasMonitoringPrompt: true,
  keyQuestions: 5,
  extractionFocus: 9
}
✅ Using 5 strategic questions from MCP Discovery
📋 Generated 17 strategic intelligence questions
Sample questions: [
  "What recent strategic moves has Edelman made in the Public Relations market that could affect KARV?",
  "What vulnerabilities has Weber Shandwick created?",
  ...
]

📍 Example TIER 1 contextual query:
   Question: What recent strategic moves has Edelman made...
   Context: Strategic intelligence for KARV
   Full query: (site:prweek.com OR site:holmesreport.com...) What recent strategic moves has Edelman made... [Strategic intelligence for KARV: Competitive positioning shifts]
```

### Better Articles:
- PR industry-specific sources (PRWeek, Holmes Report, PR Newswire)
- Recent developments (not 2023/2024 surveys)
- Strategic moves, not generic news
- Actual competitor intelligence

### Better Entity Extraction:
- Debug logs show what competitors were loaded
- Debug logs show what Claude extracted
- We can diagnose if problem is:
  - Profile loading (competitors list empty)
  - Prompt construction (competitors not in prompt)
  - Claude ignoring instructions (prompt correct but extraction wrong)

---

## Next Steps

1. **Run KARV monitoring pipeline**
2. **Check logs for:**
   - Strategic questions being generated
   - Context being included in searches
   - What articles Firecrawl returns
   - What entities enrichment extracts
3. **If still getting bad results:**
   - Check if MCP Discovery has populated `intelligence_context`
   - Verify Firecrawl is finding PR-specific sources
   - Diagnose entity extraction with new debug logs

---

## The Philosophy Shift

**Before:** "Find me articles about Edelman"
**After:** "What does Edelman's positioning mean for KARV's strategy?"

**Before:** Keyword scraper
**After:** Strategic intelligence analyst

**Before:** 70+ boolean queries → 200+ random articles → synthesis fails
**After:** 15 strategic questions → targeted intelligence → actionable insights
