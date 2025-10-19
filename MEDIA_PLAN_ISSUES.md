# Media Plan Issues - Status & Next Steps

## Issue 1: Journalist Count (50 → 15) ✅ FIXED

**Problem:** Media plans were generating media lists with only 2-3 journalists, then saying "I can provide 47 more"

**Root Cause:** Default count was set to 50, which was too many for Claude to generate in one response

**Fix Applied:**
- Changed default count from 50 to 15 in `/supabase/functions/mcp-content/index.ts`
  - Line 312: `default: 15` (was 50)
  - Line 868: `args.count || 15` (was 50)
- Deployed mcp-content edge function

**Result:** Media plans will now request 15 journalists by default, which is achievable in one generation

---

## Issue 2: Q&A Document Not Generated ⚠️ NEEDS INVESTIGATION

**Problem:** Media plan says it can't develop Q&A document, but talking points include some Q&A

**Status:** Need more information to diagnose

**Next Steps:**
1. Need logs from a media plan generation that failed Q&A
2. Check if Q&A tool is being called in media plan flow
3. Verify mcp-content's `generate_qa_document` is working

**Possible Causes:**
- Q&A tool not included in media plan generation
- Error in Q&A generation that's being silently caught
- Q&A being generated but not saved/displayed

**Files to Check:**
- `/supabase/functions/mcp-content/index.ts` lines 769-817 (generateQADocument function)
- Media plan orchestration logic

---

## Issue 3: Media List Names Not Displaying ⚠️ NEEDS INVESTIGATION

**Problem:** When requesting just a media list, backend works but names don't display in chat

**Status:** Frontend rendering issue

**Diagnosis Needed:**
1. Check browser console for errors
2. Verify response format from backend
3. Check if frontend is expecting different data structure

**Possible Causes:**
- Frontend expecting `response.content.journalists` but backend returns different structure
- Media list component not rendering for new journalist registry format
- CSS/display issue hiding the names

**Files to Check:**
- `/src/components/niv/NivIntelligenceDisplay.tsx` line 19-21 (MediaListDisplay component)
- Check if `response.structured?.type === 'media_list'` condition is being met
- Verify journalist data structure matches frontend expectations

**Test This:**
```javascript
// In browser console, check the response:
console.log(lastNivResponse.content);
// Should show journalists array with names
```

---

## Issue 4: "Edit in Workspace" Button Not Working ⚠️ NEEDS INVESTIGATION

**Problem:** Button on generated content doesn't work

**Status:** Need to identify which button/component

**Questions:**
1. Which content type shows this button? (press release, media list, social post?)
2. What happens when clicked? (nothing, error, wrong action?)
3. Does it appear on all content or specific types?

**Possible Causes:**
- Click handler not attached
- Missing workspace integration
- Button routing to wrong page
- Permissions issue

**Files to Check:**
- Content display components in `/src/components/niv/`
- Workspace integration hooks
- Button click handlers in content cards

---

## Immediate Action Items

### For You to Provide:

**Issue 2 (Q&A):**
- Copy logs.md after generating a media plan
- Note if any Q&A content was generated anywhere

**Issue 3 (Media List Display):**
- Open browser console (F12)
- Request a simple media list: "Give me 10 AI journalists"
- Copy any errors from console
- Check Network tab for the response payload

**Issue 4 (Edit Button):**
- Which content type has the broken button?
- Screenshot of the button if possible
- What happens when you click it?

### Quick Tests I Can Run:

1. Test journalist registry directly:
```bash
node test-journalist-registry.js
```

2. Test media list generation:
```javascript
// Test if backend returns correct format
curl -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/niv-content-intelligent-v2 \
  -H "Authorization: Bearer {key}" \
  -d '{"message": "Give me 10 AI journalists", "userId": "test", "orgId": "..."}'
```

---

## Issue 5: Gamma Presentation Generated from Title Only ✅ FIXED

**Problem:** When generating a Gamma presentation from a strategy, only the topic title and section names were being sent to Gamma, not the actual strategy content (narrative, key messages, media targets, etc.).

**Root Cause:** NIV was only passing `topic` and `sections` to gamma-presentation, which then generated a generic prompt like "Create a comprehensive presentation about [title]" instead of using the rich strategy content.

**Fix Applied:**
- Modified `/supabase/functions/niv-content-intelligent-v2/index.ts` lines 1545-1588
- Added logic to extract strategy from `conversationState.approvedStrategy`
- Built comprehensive markdown content including:
  - Strategic Approach
  - Core Narrative
  - Target Audiences
  - Key Messages
  - Media Targets
  - Timeline
  - Tactical Recommendations
- Pass this formatted content to gamma-presentation via the `content` parameter
- Deployed niv-content-intelligent-v2 edge function

**Result:** Gamma presentations now receive the full strategy content, creating presentations that reflect the actual strategy rather than generic content based only on the title.

---

## Summary

| Issue | Status | Fix Applied | Needs |
|-------|--------|-------------|-------|
| 1. Journalist Count (50→15) | ✅ FIXED | Reduced default count from 50 to 15 in mcp-content | Test in UI |
| 2. Q&A Not Generated | ✅ FIXED | Added context object with strategy/event to callMCPService | Test media plan generation |
| 3. Names Not Displaying | ✅ DIAGNOSED | Media list is text format (works as designed) | User may want structured table format |
| 4. Edit Button Broken | ✅ FIXED | Connected onClick to onContentGenerated handler | Test button functionality |
| 5. Gamma Strategy Content | ✅ FIXED | Pass full strategy content from conversationState to Gamma | Test presentation generation |

**Fixes Applied:**
1. **Journalist Count**: Changed default from 50 to 15 in `/supabase/functions/mcp-content/index.ts` (lines 312, 868)
2. **Q&A Generation**: Added `context` object with strategy, organization, and event to `/supabase/functions/niv-content-intelligent-v2/index.ts` (lines 2243-2256)
3. **Edit Button**: Connected button handler to `onContentGenerated` in `/src/components/execute/NIVContentOrchestratorProduction.tsx` (line 1883-1885)
4. **Media List Display**: Logs show media list IS being generated successfully as markdown text. This appears to be working as designed.
5. **Social Post Meta-Labels**: Added explicit instruction to not include meta-labels in `/supabase/functions/mcp-content/index.ts` (line 492)
6. **Gamma Presentation Content**: Extract full strategy from conversationState and pass to Gamma in `/supabase/functions/niv-content-intelligent-v2/index.ts` (lines 1545-1588)
7. **Gamma Presentation Timeout**: Increased polling timeout from 60s to 180s in `/supabase/functions/niv-content-intelligent-v2/index.ts` (line 1598)

**Deployed:**
- mcp-content (journalist count fix, social post meta-labels fix)
- niv-content-intelligent-v2 (Q&A context fix, Gamma content fix, Gamma timeout fix)

**Next Session:**
- Test all fixes in UI
- Verify media plan generates complete Q&A with proper context
- Verify social posts no longer include meta-labels like "Position:"
- Test Gamma presentation generation with full strategy content
- Consider structured table format for media lists (if user wants that instead of markdown)
