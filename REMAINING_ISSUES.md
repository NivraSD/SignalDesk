# Remaining Issues - Strategic Framework & Media Lists

## ✅ COMPLETED
- Framework display in chat now shows complete structure (Objective, Core Narrative, Proof Points, Key Messages, Target Audiences, Media Targets, Timeline, KPIs, Auto-Executable Content)
- Framework saves correctly to Memory Vault with complete data
- Backend generates complete framework with all fields
- Frontend uses backend-formatted message instead of building custom display

## 🔧 Issue 1: Memory Vault Formatting Not Clean

**Problem:** When viewing strategic frameworks in Memory Vault, the formatting is not very clean/readable.

**Location:** `/src/components/modules/MemoryVaultModule.tsx` lines 930-970

**Current State:**
- Memory Vault DOES display framework fields (narrative, proof_points, media_targets, etc.)
- Fields are rendered as raw text without nice formatting
- Could be improved with better visual hierarchy and styling

**Recommended Fix:**
1. Add markdown rendering for strategy narrative (it can be multiple paragraphs)
2. Format proof points as bulleted list with icons
3. Format key messages as numbered list with emphasis
4. Add visual cards/sections for each major component
5. Use color-coding for different sections (narrative=blue, proof_points=green, media_targets=purple, etc.)

**Priority:** Medium (functional but not polished)

---

## 🔧 Issue 2: Media List Generation Issues

### Problem 2A: Limited Number of Journalists

**Description:** Media list generation seems to have a limit on the number of journalists/information it will give.

**Location:** `/supabase/functions/mcp-content/index.ts` lines 1050-1150 (generateMediaList function)

**Current Settings:**
- Default count: 15 journalists (line 1057: `const count = args.count || 15`)
- Prompt explicitly says: `Generate exactly ${count} journalist contacts. DO NOT stop early.` (line 1110)

**Possible Causes:**
1. **Claude output truncation** - Claude may stop generating before completing all 15 contacts due to:
   - Token limits in Claude response
   - Claude interpreting the request as "optional" despite explicit instructions

2. **Max tokens too low** - Check the Claude API call settings

3. **Response parsing** - Generated content might be truncated during parsing/storage

**Recommended Fixes:**

**Option A: Reduce default count**
```typescript
const count = args.count || 10; // Reduce from 15 to 10 to ensure completion
```

**Option B: Increase max_tokens in Claude API call**
Find the Claude API call in generateMediaList and increase max_tokens:
```typescript
max_tokens: 8000  // Increase from default to allow longer responses
```

**Option C: Split into multiple requests**
Generate media list in batches:
- Request 5 Tier 1 journalists
- Request 5 Tier 2 journalists
- Request 5 Tier 3 journalists
- Combine results

### Problem 2B: Recent Stories Not Actually Recent

**Description:** "Recent Articles" section shows stories that are not actually recent, or the method for determining what stories to show is flawed.

**Root Cause:** Claude is **generating fictional articles** - it does NOT have access to real-time data or actual journalist article history.

**Current Implementation:**
Line 1124-1126 asks Claude to list "recent relevant articles" but Claude:
- Has knowledge cutoff (January 2025)
- Cannot browse the web or access real article databases
- Will **make up plausible-sounding article titles and dates**

**Why This Happens:**
The prompt says "Recent Articles - List 2-3 recent relevant articles they've written (with publication dates)" but Claude has NO WAY to know what articles journalists actually wrote. It will generate plausible-sounding fake articles.

**Recommended Fixes:**

**Option 1: Remove "Recent Articles" field entirely**
```typescript
// Remove lines 1138-1141 from prompt
// Don't ask for recent articles since we can't verify them
```

**Option 2: Change to "Typical Coverage Areas"**
Instead of asking for specific recent articles (which will be fake), ask for typical coverage themes:
```typescript
**Typical Coverage:**
- [General topic area they cover]
- [Type of stories they usually write]
- [Beat/industry focus]
```

**Option 3: Add Firecrawl/web search integration**
To get REAL recent articles, integrate with journalist research:
```typescript
// Before generating media list, search for each outlet's recent articles
const recentArticles = await searchRecentArticles(outlet, journalist);
// Pass real article data to Claude for context
```

**Option 4: Use Journalist Registry MCP**
Check if journalist_registry table has recent article data and pass it to the prompt:
```typescript
// Query journalist_registry for real data
const { data: journalistData } = await supabase
  .from('journalist_registry')
  .select('recent_articles, bio, coverage_areas')
  .eq('name', journalistName)
```

**Priority:** HIGH (affects credibility of generated media lists)

---

## Recommended Action Plan

### Immediate Fixes (Today):

1. **Media List - Remove Fake Articles** ✅ Quick Fix
   - Edit generateMediaList prompt to remove "Recent Articles" requirement
   - Replace with "Typical Coverage Areas" or "Beat History"
   - Deploy mcp-content function

2. **Media List - Reduce Count** ✅ Quick Fix
   - Change default count from 15 to 10
   - Increases likelihood of complete lists
   - Deploy mcp-content function

### Short-term Improvements (This Week):

3. **Memory Vault Formatting** 🎨 Polish
   - Add markdown rendering for narrative
   - Add visual cards for each framework section
   - Use color-coding and icons
   - Improve typography hierarchy

4. **Media List - Increase Max Tokens** ⚙️ Config
   - Find Claude API call in generateMediaList
   - Increase max_tokens to 6000-8000
   - Test with count=15 to see if it completes

### Long-term Enhancements (Future):

5. **Real Journalist Data Integration** 🔍 Research
   - Integrate Firecrawl to fetch real recent articles
   - Build journalist database with verified contact info
   - Add social media verification
   - Update journalist_registry with real data

6. **Media List Quality Improvements** 📊 Enhancement
   - Add journalist verification workflow
   - Include confidence scores for contact info
   - Add "last updated" dates for contacts
   - Implement journalist research agent that uses web search

---

## Files to Modify

### For Media List Fixes:
- `/supabase/functions/mcp-content/index.ts` (lines 1050-1150)
  - Change default count to 10
  - Modify prompt to remove "Recent Articles"
  - Add "Typical Coverage" field
  - Increase max_tokens in Claude call

### For Memory Vault Formatting:
- `/src/components/modules/MemoryVaultModule.tsx` (lines 900-1000)
  - Add ReactMarkdown for narrative
  - Create StrategyCard component
  - Add visual formatting for each section
  - Improve color scheme and typography

---

## Testing Checklist

- [ ] Generate media list - verify it produces 10 complete contacts
- [ ] Check "Recent Articles" is replaced with "Typical Coverage"
- [ ] Verify contact info looks realistic
- [ ] Test Memory Vault displays strategies with better formatting
- [ ] Confirm narrative is readable with proper line breaks
- [ ] Check proof points display as bulleted list

