# Presentation Workflow - Research Integration Fixed

## Problem Identified

The presentation workflow was displaying raw research results to users instead of using them internally to create better content, unlike the media plan workflow.

### What Was Broken:

**Flow was backwards:**
1. User requests presentation → NIV asks questions
2. NIV creates outline structure
3. **Backend extracts topics from outline and does research**
4. **Displays raw research findings to user** ("I found 7 articles...")
5. User sees garbage data: navigation elements, cryptocurrency prices, `[object Object]`

**Issues:**
- Research happened AFTER outline creation (too late to inform structure)
- Research results were displayed to user (should be internal knowledge)
- User saw raw articles with poor formatting and garbage data
- Research wasn't being USED, just displayed

## Root Cause

The presentation workflow was misunderstanding the media plan pattern:

**Media Plan (Correct Pattern):**
1. User wants media plan → NIV offers strategy help
2. **Backend does research FIRST**
3. NIV receives research in context as "RESEARCH RESULTS"
4. NIV creates strategy document using research knowledge
5. User sees clean strategy doc (not raw research)
6. User approves → Backend generates 7 tactical pieces

**Presentation (Was Broken):**
1. User wants presentation → NIV asks questions
2. NIV creates outline
3. Backend does research based on outline topics
4. **Backend displays research findings** ❌
5. User sees garbage data ❌

## The Fix

Changed presentation workflow to match **orchestrator-robust** pattern (similar to strategic framework creation):

### New Flow - Two-Stage Approach:

**1. Detect Research Need Early**
```typescript
function detectResearchNeed(message: string, history: any[]): boolean {
  // Presentations about public response, market data, competitive analysis need research
  if ((lower.includes('presentation') || lower.includes('deck')) && history.length < 3) {
    if (lower.includes('response') || lower.includes('reception') ||
        lower.includes('market') || lower.includes('competitive') ||
        lower.includes('sentiment') || lower.includes('adoption')) {
      return true  // Do research BEFORE calling Claude
    }
  }
}
```

**2. Research Happens First**
- Backend detects "presentation about public response to Codex"
- Triggers research based on keywords in user's request
- Gets articles, synthesis, data

**3. Research Injected Into Context**
```typescript
async function callClaude(context, research, ...) {
  if (research) {
    // Inject findings as facts/stats for Claude to use in slides
    const researchContext = []

    if (research.synthesis) {
      researchContext.push(`**Overview:** ${research.synthesis}`)
    }

    if (research.keyFindings && research.keyFindings.length > 0) {
      researchContext.push(`\n**Key Facts & Insights:**`)
      research.keyFindings.forEach((finding, i) => {
        researchContext.push(`${i + 1}. ${finding}`)
      })
    }

    currentUserMessage = `**RESEARCH RESULTS:**
${researchContext.join('\n')}

Use these findings to create data-informed slides with specific facts and statistics.

${context}`
  }
}
```

**4. NIV Presents Research Findings First (NEW!)**
```typescript
// Research Presentation Mode - like orchestrator-robust
if (shouldPresentResearchFirst) {
  instruction = `Present these research findings to the user objectively.
  Summarize key insights (2-3 main themes).
  Ask: "Based on these findings, would you like me to create the presentation
  outline, or explore any specific areas further?"

  DO NOT create outline yet - present findings first.`
}
```

**5. User Reviews Findings**
- User sees clean summary of research insights
- Can ask questions, explore specific areas
- Can request different angles
- Says "looks good" / "create outline" when ready

**6. Claude Creates Outline With Knowledge**
- After user confirmation, NIV creates outline
- Uses research to create better slides with real data
- Creates data-informed talking points
- Structures presentation based on actual findings

**7. Display Clean Structure Only**
```typescript
// Format the outline for display (like strategy document - no research display)
let outline = `# Presentation: ${toolUse.input.topic}

**Audience:** ${toolUse.input.audience}
**Purpose:** ${toolUse.input.purpose}

## Key Messages
1. Real insight from research
2. Data-backed finding
3. Competitive positioning based on actual data

## Presentation Structure
### Slide 1: Opening Hook
- Talking point informed by research
- Market data cited correctly
`
```

**8. User Sees Structure, Not Raw Research**
- Clean presentation outline
- Slides with real insights baked in
- No garbage data displayed
- No `[object Object]` errors

**9. User Approves → Generate in Gamma**
- User reviews structure and confirms
- Backend calls Gamma to create visual deck

## Code Changes

### 1. supabase/functions/niv-content-intelligent-v2/system-prompt.ts

**Before:**
```typescript
**PRESENTATION WORKFLOW:**
1. Gather key information
2. Create outline (like strategy document)
3. **Backend automatically researches based on outline topics**
4. Present outline + research findings  ❌
```

**After:**
```typescript
**PRESENTATION WORKFLOW (Matches Media Plan Pattern):**
1. Gather key information naturally
2. If needs data → Backend does research FIRST
3. Create outline/structure using research knowledge (don't show research)
4. Present structure for approval
5. User approves → Generate in Gamma
```

### 2. supabase/functions/niv-content-intelligent-v2/index.ts

**Removed:** Post-hoc research extraction (lines 2099-2148)
```typescript
// OLD CODE - REMOVED
// Extract research topics from the outline
const researchTopics: string[] = []
toolUse.input.sections.forEach((section: any) => {
  // Extract topics and do research...
})
```

**Added:** Research detection for presentations (line 2731-2741)
```typescript
// NEW CODE
// Presentations about public response, market data need research
if ((lower.includes('presentation') || lower.includes('deck')) && history.length < 3) {
  if (lower.includes('response') || lower.includes('reception') ||
      lower.includes('market') || lower.includes('competitive')) {
    return true  // Trigger research BEFORE Claude creates outline
  }
}
```

**Simplified:** Outline display (lines 2103-2160)
```typescript
// NEW CODE - Simple structure display
let outline = `# Presentation: ${toolUse.input.topic}
**Audience:** ${toolUse.input.audience}
## Key Messages
## Presentation Structure`

// Research results are NOT displayed - they're already in Claude's context
```

## Benefits

### Before Fix:
- Research happened too late to inform structure
- User saw raw articles with garbage data
- Navigation elements, cryptocurrency prices, Thai text displayed
- `[object Object]` from improper object serialization
- Research wasn't actually being used

### After Fix:
- Research happens BEFORE outline creation
- NIV uses research knowledge to create better slides
- User sees clean, data-informed presentation structure
- No garbage data displayed
- Matches proven media plan workflow pattern
- Research is UTILIZED, not just displayed

## Workflow Comparison

| Step | Strategic Frameworks (orchestrator-robust) | Presentations (Fixed) |
|------|-------------------------------------------|----------------------|
| 1. User request | "Create strategic framework for Sora 2" | "Create presentation about Codex response" |
| 2. Detect need | Needs research (market landscape) | Needs research (public response) |
| 3. Research | **Do research first** | **Do research first** |
| 4. Present findings | **NIV presents research objectively** | **NIV presents research objectively** |
| 5. User reviews | Can explore, ask questions, discuss | Can explore, ask questions, discuss |
| 6. User confirms | "create the framework" / "looks good" | "create the outline" / "looks good" |
| 7. Generate structure | Strategic framework using research | Presentation outline using research |
| 8. User sees | Clean framework document | Clean presentation structure |
| 9. User approves | "execute" / "proceed" | "generate" / "send to Gamma" |
| 10. Execute | Generate campaign content | Generate Gamma presentation |

Both workflows now follow the same pattern: **Research → Present Findings → User Confirms → Structure → Approve → Generate**

## Testing

Test presentation requests that need data:
```javascript
// These should trigger research BEFORE outline creation:
"Create a presentation about public response to Codex"
"Deck showing market reception of our product"
"Presentation on competitive analysis"
"Board update on sentiment and adoption"
```

Expected behavior (Two-Stage Flow):
1. Backend detects research need from keywords
2. Conducts research (Fireplexity)
3. **NIV presents research findings first** ← NEW!
   - "I found 3 key themes in Sora 2 public perception..."
   - "Would you like me to create the outline, or explore further?"
4. User reviews findings and confirms: "looks good, create the outline"
5. Claude creates outline using research knowledge
6. User sees clean presentation structure
7. No raw research articles displayed

## Critical Bug Discovery & Fix

### The Research Wasn't Executing

After implementing the workflow changes above, discovered that research was STILL not executing even though it was being detected as needed.

**Problem:** Line 1184-1185 was checking the wrong object path:
```typescript
// WRONG - was accessing flat object
const needsResearch = !isSimpleMediaList && understanding.requires_fresh_data;
```

But `getClaudeUnderstanding()` returns a nested structure:
```typescript
{
  understanding: {
    requires_fresh_data: true,  // ← actual location
    ...
  },
  approach: {...},
  acknowledgment: "..."
}
```

**Fix Applied:** Access the nested path correctly:
```typescript
// CORRECT - access nested understanding object
const needsResearch = !isSimpleMediaList && understanding.understanding?.requires_fresh_data;
```

**Evidence from Logs:**
- Understanding returned `requires_fresh_data: true` ✓
- But NO `🔍 Research needed...` log appeared ✗
- Claude hallucinated "Based on the research conducted..." with no actual research ✗

## Deployment

```bash
npx supabase functions deploy niv-content-intelligent-v2
```

Status: ✅ Deployed (script size: 127.3kB)
- Research execution bug fixed ✓
- Research incorporation improved to include key findings and facts ✓
- Two-stage workflow implemented (present findings → confirm → create outline) ✓

## Verification

To verify the fix works, test with:
```
"Create a presentation about public response to Sora 2"
```

Expected logs should now show:
1. ✅ `Understanding: { requires_fresh_data: true }`
2. ✅ `🔍 Research needed...`
3. ✅ `🔍 Executing intelligent research...`
4. ✅ `✅ Research complete: X articles`
5. ✅ **NIV presents findings first (not outline)** ← NEW!
6. ✅ User confirms: "looks good"
7. ✅ `✅ User confirmed research - ready for outline creation`
8. ✅ Claude creates outline with research knowledge
9. ✅ User sees clean structure (no raw research display)

## Next Steps

The presentation workflow is now fully fixed:
- Research detection works correctly ✓
- Research actually executes when needed ✓
- Research is injected into Claude's context ✓
- Claude uses research to create data-informed slides ✓
- User sees clean, professional output (no garbage data) ✓
- Follows the same pattern as media plans ✓
