# NIV Orchestrator - Issues & Fixes Needed

**Date:** 2025-01-23
**Status:** Critical Issues Identified
**Function:** `supabase/functions/niv-orchestrator-robust/index.ts`

---

## Critical Issues

### 1. Organization Confusion (CRITICAL)
**Problem:** NIV gets confused about who the client is mid-conversation
- Starts correctly: OpenAI is the client
- Mid-conversation: Thinks Anthropic is the client
- Result: Starts analyzing OpenAI as if they were the competition

**Evidence from logs:**
```
Line 75: "Organization context: \"OpenAI\" (validated)" ✅ CORRECT
Line 155: "Competitors: Anthropic, Google DeepMind, Meta AI" ✅ CORRECT

But then user reports it switched and thought Anthropic was the client
```

**Root Cause:** Likely the orchestrator isn't maintaining organization context across conversation turns, or it's inferring organization from conversation content instead of using the passed organizationContext.

---

### 2. Double Responses
**Problem:** NIV sometimes responds twice to the same query

**Symptoms:**
- User asks one question
- Gets two separate answers
- Confusing UX, wastes tokens

**Likely Cause:**
- Acknowledgment stage + research stage both returning full responses
- Or the NIVPanel is calling the API twice
- Or the orchestrator is processing the query in multiple stages and returning each stage as a separate response

---

### 3. Role Confusion
**Problem:** NIV orchestrator was originally designed for strategic campaign planning, but now needs to be a general platform-aware advisor

**Current Role (from original design):**
- "Chief Intelligence Analyst for intelligence module"
- Focused on campaign building
- Research → Blueprint → Execution flow

**New Role Needed:**
- Platform-aware strategic advisor
- Can guide users through ANY workflow (not just campaigns)
- Knows about:
  - Opportunities in the system
  - Active campaigns
  - Executive synthesis
  - Real-time monitoring
  - Crisis alerts
- Can route users to the right module with context
- Maintains conversation persistence across sessions

---

## Investigation Needed

### 1. Check Organization Context Propagation
**Files to inspect:**
- `/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/niv-orchestrator-robust/index.ts`
- Look for how `organizationContext` is used
- Check if it's passed to all sub-functions
- Verify it's not being overwritten by inferred context

**Expected behavior:**
```typescript
// Should use organizationContext from API call
const organizationName = organizationContext.name // "OpenAI"

// Should NOT infer from conversation content
// BAD: if (message.includes("Anthropic")) { org = "Anthropic" }
```

### 2. Check Response Flow
**Investigation:**
- Is the acknowledgment stage returning a full response?
- Is the research stage also returning a full response?
- Are both being displayed to the user?

**Expected flow:**
```typescript
// Stage 1: Acknowledge (quick feedback)
return { message: "I understand, let me research..." }

// Stage 2: Research (actual answer)
return { message: "Based on research, here's...", data: {...} }

// User should only see Stage 2
```

### 3. Check Persona/System Prompt
**Look for:**
- Where the persona is defined ("Chief Intelligence Analyst")
- Where the role/capabilities are described
- Update to reflect new platform-aware role

---

## Proposed Fixes

### Fix 1: Lock Organization Context
```typescript
// At the top of niv-orchestrator-robust
const ORGANIZATION_CONTEXT = {
  name: organizationContext.name,
  industry: organizationContext.industry,
  id: organizationId
}

// Pass this to ALL sub-functions
// NEVER allow it to be overwritten from conversation
```

### Fix 2: Remove Duplicate Responses
**Option A:** Remove acknowledgment stage entirely
```typescript
// Just do research and return final answer
// No separate acknowledgment
```

**Option B:** Make acknowledgment truly minimal
```typescript
// Acknowledgment returns ONLY status
return { status: "processing" }

// Research returns actual answer
return { message: "...", data: {...} }
```

### Fix 3: Redefine NIV Role

**New System Prompt Concept:**
```
You are NIV, SignalDesk's platform-aware strategic advisor.

CORE IDENTITY:
- You work FOR {organization.name} as their strategic communications advisor
- Everything you analyze is in relation to {organization.name}'s goals
- Their competitors are: {competitors}
- NEVER confuse who the client is

CAPABILITIES:
1. Strategic Guidance - help plan campaigns, responses, positioning
2. Platform Navigation - know what's in the system and guide users
3. Intelligence Analysis - interpret monitoring data, opportunities, crises
4. Workflow Orchestration - route users to the right tools with context

PLATFORM AWARENESS:
You have access to:
- Opportunities: {count} detected, {urgent} urgent
- Campaigns: {active} in progress
- Monitoring: Real-time intelligence feeds
- Executive Synthesis: Latest strategic intelligence
- Crisis Alerts: {alerts} active

When users ask questions, you:
1. Understand their goal
2. Check if platform data can help
3. Provide strategic guidance
4. Offer to open relevant modules with context

EXAMPLES:
User: "How should we respond to competitor X?"
You: "I see competitor X made a move in [area]. Based on your opportunities,
     I found [opportunity Y] that positions you well. Want me to open the
     execution plan for that opportunity?"

User: "What's happening in our space?"
You: "Based on real-time monitoring: [summary]. You have 3 urgent opportunities
     and 2 active campaigns. The executive synthesis shows [key trend].
     Where would you like to focus?"
```

---

## Testing Plan

### Test 1: Organization Persistence
1. Start conversation: "I'm working for OpenAI"
2. Ask several questions about competitors
3. Verify NIV never thinks Anthropic/Google is the client
4. Check logs for organization context

### Test 2: No Double Responses
1. Ask a simple question
2. Count responses received
3. Should get exactly ONE answer
4. Check network tab for duplicate API calls

### Test 3: Platform Awareness
1. Create an opportunity in the system
2. Ask NIV "What should I work on?"
3. Verify it mentions the opportunity
4. Verify it offers to open opportunities module

### Test 4: Conversation Persistence
1. Start conversation, ask question A
2. Close NIV
3. Reopen NIV
4. Ask related question B
5. Verify NIV remembers question A's context

---

## Immediate Actions

1. **Read niv-orchestrator-robust source** to understand current flow
2. **Check organization context usage** - find where it might get confused
3. **Check response flow** - understand acknowledgment vs. research stages
4. **Update system prompt** - redefine NIV's role as platform advisor
5. **Add organization locking** - prevent mid-conversation context switches
6. **Test thoroughly** - verify all issues resolved

---

## Files to Modify

```
/supabase/functions/niv-orchestrator-robust/
├── index.ts (main logic)
├── system-prompt.ts (likely exists - update role)
└── types.ts (possibly - verify organization type)

/src/components/niv/
├── NIVPanel.tsx (check for duplicate API calls)
└── ...

/src/app/api/niv-orchestrator/
└── route.ts (verify organizationContext passing)
```

---

## Success Criteria

✅ NIV never confuses organization identity
✅ NIV responds exactly once per query
✅ NIV knows about platform state (opportunities, campaigns, etc.)
✅ NIV can guide users to relevant modules
✅ Conversation context persists across sessions
✅ NIV's role is clear: platform-aware strategic advisor

---

## Notes

- The orchestrator was well-designed for campaign planning
- Now it needs to expand scope to general platform guidance
- Keep the good parts (research capability, strategic thinking)
- Add platform awareness and navigation capabilities
- Fix the bugs (org confusion, double responses)
