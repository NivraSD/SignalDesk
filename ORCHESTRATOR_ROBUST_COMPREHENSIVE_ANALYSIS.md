# COMPREHENSIVE ANALYSIS: orchestrator-robust vs niv-advisor

**Date:** October 24, 2025
**Issue:** NIV Advisor completely broken - outdated data, researching user commands, premature framework dumps
**Root Cause:** NIV Advisor does NOT follow orchestrator-robust's proven patterns

---

## CRITICAL DIFFERENCES

### 1. **TEMPORAL AWARENESS**

#### orchestrator-robust (CORRECT):
```typescript
// Line 267-275
const getCurrentDate = () => {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Line 279: FUNCTION that calls getCurrentDate() at REQUEST TIME
const getNivSystemPrompt = () => `You are NIV...

CURRENT DATE: Today is ${getCurrentDate()}. You have full awareness of current events up to this date.

**CRITICAL - FOCUS ON CURRENT INFORMATION:**
- Always reference the LATEST models and products (GPT-4o, o1, o1-mini for OpenAI - NOT older GPT-4 or GPT-5)
- Discuss RECENT events from 2024-2025, not outdated news from 2023 or earlier
- Use present-tense language about current market dynamics
- When mentioning competitors, focus on their CURRENT offerings and recent moves
- If you mention dates, be specific and accurate to 2024-2025 timeframe
```

#### niv-advisor (BROKEN):
```typescript
// NIV_SYSTEM_PROMPT is a CONSTANT defined at MODULE LOAD TIME
// getCurrentDate() is called ONCE when the module loads, NOT per request
const NIV_SYSTEM_PROMPT = `You are NIV...
CURRENT DATE: Today is ${getCurrentDate()}.
```

**Problem:** NIV Advisor's system prompt is created ONCE when the Edge Function initializes, so `getCurrentDate()` always returns the DEPLOYMENT DATE, not the CURRENT DATE.

**Result:** NIV thinks it's March/April 2025 and creates strategic frameworks targeting "March 2025" when it's October 2025.

---

### 2. **FRAMEWORK GENERATION LOGIC**

#### orchestrator-robust (CORRECT):
```typescript
// Lines 3264-3319
// Initialize at top
let shouldGenerateFramework = false

// Check Claude's decision FIRST
if (claudeUnderstanding?.approach?.generate_framework === true) {
  shouldGenerateFramework = true
  console.log('🤖 Claude detected framework request')
} else if (frameworkConfirmation && previousMessageAskedForConfirmation) {
  shouldGenerateFramework = true
  console.log('✅ User confirmed framework execution after reviewing answers')
} else if (explicitFrameworkRequest) {
  shouldGenerateFramework = true
  console.log('🎯 Explicit framework request detected:', queryLower.substring(0, 100))
} else if (afterDiscussionRequest) {
  shouldGenerateFramework = true
  console.log('📝 Framework requested after discussion')
} else if (conceptState.stage === 'ready' && conceptState.confidence >= 80) {
  // Only auto-trigger if user seems to want closure
  if (queryLower.includes('what\'s next') || queryLower.includes('ready')) {
    shouldGenerateFramework = true
    console.log('🚀 Concept ready - auto-triggering framework')
  }
}

// NO research context check - trust Claude's judgment
```

#### niv-advisor (BROKEN):
```typescript
// Lines 4077-4117
// Complex hasResearchInConversation check added
const hasResearchInConversation = conceptState.researchHistory.length > 0 ||
                                  conceptState.fullConversation.some(msg =>
                                    msg.role === 'assistant' &&
                                    (msg.content.includes('Research Findings') ||
                                     msg.content.includes('Key findings') ||
                                     msg.content.includes('analysis shows')))

// EVERY check now requires hasResearchInConversation
if (claudeUnderstanding?.approach?.generate_framework === true && hasResearchInConversation) {
  shouldGenerateFramework = true
} else if (hasStrategicIntent && hasResearchInConversation) {
  shouldGenerateFramework = true
} else if (explicitFrameworkRequest && hasResearchInConversation) {
  shouldGenerateFramework = true
  console.log('🎯 Explicit framework request detected with research context:', queryLower.substring(0, 100))
} else if (explicitFrameworkRequest && !hasResearchInConversation) {
  console.log('⚠️ Framework requested but no research context - will do research first')
  shouldGenerateFramework = false  // ❌ BLOCKS FRAMEWORK GENERATION
}
```

**Problem:** NIV Advisor's "fix" adds complex research context checks that orchestrator-robust does NOT have. When Claude says `generate_framework: false` (correctly), NIV Advisor ALSO checks `hasResearchInConversation` and double-blocks it.

**From logs.md:**
- Line 315: Claude says `"generate_framework": false` ✅ CORRECT
- Line 163: But NIV sets `shouldGenerateFramework = true` ❌ BROKEN

---

### 3. **CLAUDE'S FRAMEWORK DECISION**

#### orchestrator-robust (CORRECT):
```typescript
// Lines 2870-2875
IMPORTANT: Strategic framework generation:
- Set generate_framework to FALSE if user is asking for research, analysis, or information
- Set generate_framework to FALSE if this is the first message about a topic
- Only set generate_framework to TRUE if user explicitly says "create a strategy", "develop a plan", "build a framework" AFTER seeing research
- Example: "We need analysis on AI education landscape" → generate_framework: false (they want research first)
- Example: "Based on that analysis, create our launch strategy" → generate_framework: true (follow-up request)
```

**Claude correctly understands:**
- First message about a topic → `generate_framework: false`
- Do research FIRST
- User can ask for framework AFTER seeing research

#### niv-advisor (BROKEN):
```typescript
// No clear instructions in the understandingPrompt
// Just tells Claude to decide but doesn't explain the research-first pattern
```

**Problem:** NIV Advisor's prompt doesn't clearly explain the research → framework pattern, so Claude makes the decision but NIV overrides it with complex hasResearchInConversation logic.

---

### 4. **RESEARCH MODE VS STRATEGY MODE**

#### orchestrator-robust (CORRECT):
```typescript
// Lines 1834-1925
if (!shouldGenerateFramework) {
  // RESEARCH MODE - Present findings objectively
  message += `\n\n**Research Mode Instructions:**
Present the research findings clearly and objectively.
Focus on facts, trends, and newsworthy developments.
Summarize what's happening without strategic interpretation.
If the user wants strategic analysis, they'll ask for it explicitly.
Save strategic recommendations for when explicitly requested.\n`
} else {
  // FRAMEWORK GENERATION MODE - Generate complete strategic framework
  message += `\n\n**🎯 STRATEGIC FRAMEWORK GENERATION:**\n`
  message += `Generate a COMPLETE strategic framework based on all research and conversation history.\n\n`

  // Detailed instructions follow...
}
```

**Separation is CLEAR:**
- Research Mode: Just present facts
- Framework Mode: Generate complete strategy

#### niv-advisor (BROKEN):
```typescript
// No clear mode separation in buildClaudeMessage
// Just passes shouldGenerateFramework but doesn't give clear mode instructions
```

---

### 5. **SEARCH QUERY HANDLING**

#### orchestrator-robust (CORRECT):
```typescript
// Lines 3128-3139
// Standard single-step research (non-orchestrated path)
// IMPORTANT: Don't search for "strategic framework" - that's a command, not a search term
let searchQuery = queryStrategy.searchQuery || userMessage

// If this is a framework generation request, don't search for framework articles
if (shouldGenerateFramework ||
    searchQuery.toLowerCase().includes('strategic framework') ||
    searchQuery.toLowerCase().includes('generate a framework') ||
    searchQuery.toLowerCase().includes('create a framework')) {
  console.log('🎯 Framework request detected - will use existing research, not searching for framework articles')
  // Skip new search, use existing research from conceptState
  searchQuery = '' // Empty search to prevent searching for "strategic framework"
}
```

**Pattern:** If user wants a framework, DON'T search for framework articles - use existing conversation research.

#### niv-advisor (BROKEN):
```typescript
// Lines 3907-3913
// Standard single-step research (non-orchestrated path)
// IMPORTANT: Don't search for "strategic framework" - that's a command, not a search term
let searchQuery = queryStrategy.searchQuery || userMessage

// If this is a framework generation request, don't search for framework articles
if (shouldGenerateFramework ||
    searchQuery.toLowerCase().includes('framework') ||
    searchQuery.toLowerCase().includes('create a strategy')) {
```

**Problem:** Same pattern exists but the complex hasResearchInConversation check (added in my "fix") breaks it because shouldGenerateFramework is set to false when it should be true.

---

### 6. **CONVERSATION HISTORY LIMITS**

#### orchestrator-robust (CORRECT):
```typescript
// Line 94-97
const MAX_CONVERSATION_HISTORY = 20
if (state.fullConversation.length > MAX_CONVERSATION_HISTORY) {
  state.fullConversation = state.fullConversation.slice(-MAX_CONVERSATION_HISTORY)
  console.log(`🧹 Trimmed conversation history to last ${MAX_CONVERSATION_HISTORY} entries`)
}

// Line 109-113
const MAX_RESEARCH_HISTORY = 10
if (state.researchHistory.length > MAX_RESEARCH_HISTORY) {
  state.researchHistory = state.researchHistory.slice(-MAX_RESEARCH_HISTORY)
  console.log(`🧹 Trimmed research history to last ${MAX_RESEARCH_HISTORY} rounds`)
}
```

**Memory management:** Explicit limits prevent bloat.

#### niv-advisor (BROKEN):
```typescript
// No explicit trimming of conversation or research history
// ConceptState grows unbounded
```

---

## WHAT ORCHESTRATOR-ROBUST DOES RIGHT

### 1. **Trust Claude's Judgment**
orchestrator-robust checks `claudeUnderstanding?.approach?.generate_framework` FIRST and TRUSTS it. No complex override logic.

### 2. **Clear Mode Separation**
Research Mode vs Framework Mode instructions are EXPLICIT in the prompt.

### 3. **getCurrentDate() as a FUNCTION**
Called at request time, not module load time, ensuring temporal accuracy.

### 4. **Clean Framework Decision Logic**
Simple boolean checks, no complex "hasResearchInConversation" validation that can block valid framework requests.

### 5. **Memory Management**
Explicit trimming of conversation and research history to prevent token bloat.

---

## WHAT NIV ADVISOR DOES WRONG

### 1. **Ignores Claude's Framework Decision**
Claude says `generate_framework: false` but NIV overrides with complex hasResearchInConversation logic and sets it to true anyway.

### 2. **No Temporal Awareness**
System prompt created at module load time with stale getCurrentDate(), causing frameworks to target past dates.

### 3. **Over-Engineered Checks**
My "fix" added `hasResearchInConversation` checks that orchestrator-robust doesn't have, creating bugs.

### 4. **No Clear Mode Instructions**
buildClaudeMessage doesn't give explicit Research Mode vs Framework Mode instructions.

### 5. **No Memory Management**
ConceptState grows unbounded, causing token bloat and potential failures.

---

## THE FIX

### Critical Changes Needed:

1. **Make NIV_SYSTEM_PROMPT a FUNCTION**
   ```typescript
   const getNivSystemPrompt = () => `You are NIV...
   CURRENT DATE: Today is ${getCurrentDate()}...`
   ```

2. **Remove hasResearchInConversation Checks**
   Trust Claude's `generate_framework` decision. Remove all the complex validation logic I added.

3. **Add Clear Mode Separation**
   Copy orchestrator-robust's Research Mode vs Framework Mode instructions into buildClaudeMessage.

4. **Add Memory Management**
   Implement MAX_CONVERSATION_HISTORY and MAX_RESEARCH_HISTORY trimming.

5. **Copy Claude Understanding Prompt**
   Use orchestrator-robust's exact prompt that explains research-first pattern.

---

## LOGS.MD ANALYSIS

**Query:** "we know google gemini 3 will be coming out in the coming months. we want to create a strategy to pro"

**What Happened:**

1. **Line 315:** Claude correctly decides `"generate_framework": false` - "Framework generation should come after research"
2. **Line 251:** Firecrawl returns 0 results for "Google Gemini 3 leak preview capabilities benchmark OpenAI competitive last 30 days 2025"
3. **Line 235:** "Orchestrated research complete: 0 articles, 0 findings"
4. **Line 123:** But NIV detects "Explicit framework request detected: we know google gemini 3 will be coming out in the coming months. we want to create a strategy to pro"
5. **Line 163:** "Framework generation decision: true" ❌
6. **Line 43:** Framework says "Secure 40% share of voice by **March 2025**" - but it's **October 2025**!

**Root Causes:**

1. Claude said `generate_framework: false` but NIV's `shouldGenerateFramework` logic override it to true
2. Research returned 0 results but framework was generated anyway
3. System prompt has stale date from deployment time, not current time
4. No research context check (the one thing my fix got RIGHT) was bypassed

---

## CONCLUSION

NIV Advisor is fundamentally broken because it does NOT follow orchestrator-robust's proven patterns:

1. ❌ No dynamic temporal awareness
2. ❌ Overrides Claude's framework decisions
3. ❌ No clear Research/Framework mode separation
4. ❌ No memory management
5. ❌ Over-engineered validation logic

The fix is to **COPY orchestrator-robust's patterns exactly**, not invent new validation logic.
