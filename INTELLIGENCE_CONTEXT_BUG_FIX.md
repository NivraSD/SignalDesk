# Intelligence Context Bug Fix

## **BUG FOUND AND FIXED** ✅

MCP Discovery WAS creating `intelligence_context`, but the structure was wrong so monitoring couldn't find the key fields.

---

## The Bug

**MCP Discovery was creating:**
```typescript
intelligence_context: {
  monitoring_prompt: "...",
  extraction_focus: [...],
  synthesis_guidance: {           // ← nested
    key_questions: [...],         // ← monitoring couldn't find this
    analysis_perspective: "...",  // ← monitoring couldn't find this
    output_focus: "..."
  }
}
```

**Monitoring was looking for:**
```typescript
const keyQuestions = intelligenceContext?.key_questions || []
const analysisPerspective = intelligenceContext?.analysis_perspective || ''
```

**Result:**
- `keyQuestions` = `[]` (empty array)
- `analysisPerspective` = `''` (empty string)
- Strategic query generation fell back to old keyword approach

---

## The Fix

**File: `supabase/functions/mcp-discovery/index.ts` (Lines 1177-1186)**

Flattened the structure so monitoring can find the fields:

```typescript
intelligence_context: {
  monitoring_prompt: "...",

  // FLATTEN: Move to top level for monitoring
  key_questions: [
    "What moves are Edelman, Weber Shandwick, FleishmanHillard making?",
    "How is KARV positioned relative to competitors?",
    "What regulatory changes affect the Public Relations industry?",
    "What market opportunities are emerging?",
    "What risks or threats are developing?"
  ],

  analysis_perspective: "Analyze from the perspective of KARV's executive team making strategic decisions",

  extraction_focus: [...]
}
```

---

## What Needs to Happen Next

### 1. **Re-run MCP Discovery for KARV**

The fixed MCP Discovery has been deployed, but KARV's profile still has the OLD structure with nested synthesis_guidance.

**Run Discovery:**
```bash
# Trigger via API or UI
POST /mcp-discovery
{
  "organization_id": "d9a93509-77d2-4367-860b-50a5343f2b0b",
  "organization_name": "KARV",
  "save_to_persistence": true
}
```

This will update KARV's `company_profile` with the corrected `intelligence_context` structure.

### 2. **Run Monitoring Again**

After Discovery completes, run monitoring:

**Expected logs:**
```
🎯 Intelligence-driven query generation for KARV
Strategic context available: {
  hasMonitoringPrompt: true,
  keyQuestions: 5,              // ← Should be 5, not 0
  extractionFocus: 9,
  hasAnalysisPerspective: true
}
✅ Using 5 strategic questions from MCP Discovery

📋 Generated 17 strategic intelligence questions
Sample questions: [
  "What moves are Edelman, Weber Shandwick, FleishmanHillard making?",
  "How is KARV positioned relative to competitors?",
  "What recent strategic moves has Edelman made in the Public Relations market that could affect KARV?"
]
```

### 3. **Verify Intelligent Search Works**

Check that:
- Strategic questions (not keywords) are being generated
- Context is included in Firecrawl searches
- PR industry-specific articles are returned
- Entity extraction finds competitor names
- Synthesis has relevant competitive intelligence

---

## Why This Happened

**Root cause:** MCP Discovery was designed to have synthesis guidance as a nested object, but monitoring was written to expect a flat structure. The two functions weren't in sync.

**Why didn't we catch it sooner:** KARV likely ran an old version of Discovery before the `intelligence_context` feature was added. When we added it, we used a nested structure but monitoring expected flat.

---

## Status

- ✅ MCP Discovery fixed and deployed
- ⏳ KARV needs to re-run Discovery
- ⏳ Monitoring needs to be tested with corrected intelligence_context

Once KARV re-runs Discovery, the intelligent search will work as designed.
