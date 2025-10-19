# NIV Content - EVERY Missing Piece from NIV Orchestrator Robust

## COMPLETE FLOW COMPARISON

### NIV ORCHESTRATOR ROBUST (What Works)

```
1. USER MESSAGE ARRIVES
   ↓
2. CLAUDE UNDERSTANDING CALL (lines 2194-2300)
   - Shows: conversation history, user query, organization context
   - Asks Claude: "What is user asking for? Need fresh data? What search query? Which approach?"
   - Returns: understanding + strategy + search_query + confidence + generate_framework decision
   ↓
3. EXECUTE RESEARCH (lines 2353-2543)
   - If complex: decomposeQuery → orchestrateResearch with multiple tools
   - If simple: intelligence_pipeline OR fireplexity_targeted OR contextual_response
   - Fills information gaps
   ↓
4. GET ORG PROFILE (lines 2547-2582)
   - Calls getMcpDiscovery(organizationId)
   - Gets: competitors, keywords, industry
   - Adds to toolResults.discoveryData
   ↓
5. UPDATE CONCEPT STATE (line 2591)
   - updateConceptState(conversationId, message, toolResults, conversationHistory)
   - Accumulates research history
   - Extracts preferences via regex
   ↓
6. BUILD COMPREHENSIVE MESSAGE (lines 1216-1400)
   - Org profile (baseline)
   - Conversation history (truncated to prevent overflow)
   - Current query
   - Concept progress (stage, confidence, goal, audience, narrative, timeline)
   - User preferences (wants, doesn't want)
   - Research summary (truncated recent rounds)
   - Missing elements
   - Consultation approach instructions
   - Mode-specific instructions (research mode vs framework mode)
   ↓
7. CALL CLAUDE WITH EVERYTHING (lines 2669-2698)
   - System: NIV_SYSTEM_PROMPT + module persona
   - Message: buildClaudeMessage output (full context)
   - Max tokens: 2000
   - Returns: strategic response
   ↓
8. IF FRAMEWORK NEEDED (lines 2715-2789)
   - Store assistant response in conceptState
   - Extract and package research
   - Call niv-strategic-framework edge function
   - Pass: research + organizationContext + conversationHistory + conceptState
   - Returns: complete framework
   ↓
9. RETURN TO USER
```

### NIV CONTENT INTELLIGENT V2 (Current - Broken)

```
1. USER MESSAGE ARRIVES
   ↓
2. REBUILD STATE FROM HISTORY
   - buildStateFromConversation(conversationId, conversationHistory, message)
   - Extracts via regex only
   ↓
3. CALL CLAUDE TO DECIDE
   - Shows: conversation, state, confidence
   - Returns: decision (ask_question, do_research, present_narratives, generate_content)
   ↓
4. IF RESEARCH NEEDED
   - Call niv-fireplexity directly
   - Call Claude again to decide next step
   ↓
5. RETURN RESPONSE
```

---

## EVERY MISSING PIECE

### 1. ❌ NO INITIAL UNDERSTANDING CALL

**NIV Orchestrator:**
```typescript
// Lines 2194-2300
const understandingPrompt = `You are analyzing this user query...

Think step by step:
1. What is the user really asking for?
2. Do I need fresh, real-time information?
3. What specific search terms would find the best results?
4. Should I search quality sources only, or cast a wider net?
5. Should I generate a strategic framework now?

Respond with JSON:
{
  "understanding": {
    "what_user_wants": "...",
    "entities": [...],
    "requires_fresh_data": true/false,
    "why_fresh_data": "..."
  },
  "approach": {
    "strategy": "fireplexity_targeted/intelligence_pipeline/contextual_response",
    "reasoning": "...",
    "search_query": "specific targeted query",
    "search_domains": "quality_first/quality_only/all_web",
    "confidence": 0.0-1.0,
    "generate_framework": false
  },
  "acknowledgment": "..."
}
```

**NIV Content:** ❌ MISSING - Goes straight to decision without understanding query first

---

### 2. ❌ NO ORGANIZATION PROFILE FROM MCP-DISCOVERY

**NIV Orchestrator:**
```typescript
// Lines 2547-2582
console.log(`🎯 Getting organization profile for: ${organizationId}`)

orgProfile = await getMcpDiscovery(organizationId)
organizationName = orgProfile?.organization_name || organizationId

toolResults.discoveryData = {
  organizationName: organizationName,
  competitors: orgProfile.competition?.direct_competitors?.slice(0, 5) || [],
  keywords: orgProfile.keywords?.slice(0, 10) || [],
  industry: orgProfile.industry
}
```

**NIV Content:** ❌ MISSING - No org profile, no competitors, no keywords

---

### 3. ❌ NO COMPREHENSIVE MESSAGE BUILDING

**NIV Orchestrator (buildClaudeMessage lines 1216-1400):**
```typescript
// Shows client baseline profile
message += `**BASELINE CLIENT PROFILE - ${data.organizationName}:**
• Industry: ${data.industry}
• Known Competitors: ${data.competitors.join(', ')}
• Initial Keywords: ${data.keywords.join(', ')}

IMPORTANT: This is just baseline data. Research CURRENT developments...`

// Shows conversation history (truncated)
message += `**Recent Conversation History:**
(Showing last ${truncatedHistory.length} messages)
${truncatedHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`

// Shows current query
message += `**Current User Query:**
${userMessage}`

// Shows concept progress
message += `**Campaign Concept Progress:**
Stage: ${conceptState.stage} (${conceptState.confidence}% complete)
Goal: ${conceptState.concept.goal}
Audience: ${conceptState.concept.audience}
Narrative: ${conceptState.concept.narrative}
Timeline: ${conceptState.concept.timeline}`

// Shows user preferences
message += `**What the user WANTS:**
${conceptState.userPreferences.wants.map(w => `- ${w}`).join('\n')}`

message += `**What the user DOES NOT WANT:**
${conceptState.userPreferences.doesNotWant.map(w => `- ${w}`).join('\n')}`

// Shows research summary
message += `**Recent Research Summary:**
${conceptState.researchHistory.map((r, i) =>
  `Research Round ${i+1}: ${r.summarizedText}`
).join('\n')}`

// Shows what's missing
message += `Still need to discuss: ${missing.join(', ')}`

// Shows consultation approach
message += `**Consultation Approach:**
As a strategic consultant, you should:
1. Acknowledge what's been discussed and build on it
2. Bring relevant insights and research to inform the concept
3. Ask ONE strategic question to move the concept forward
4. Guide toward a complete, actionable campaign concept`

// Mode-specific instructions
if (!shouldGenerateFramework) {
  message += `**Research Mode Instructions:**
Present the research findings clearly and objectively.
Focus on facts, trends, and newsworthy developments.
Summarize what's happening without strategic interpretation.`
} else {
  message += `**🎯 STRATEGIC FRAMEWORK GENERATION:**
Generate a COMPLETE strategic framework based on all research...`
}
```

**NIV Content:** ❌ MISSING - Only shows conversation + basic state, no comprehensive context

---

### 4. ❌ NO RESEARCH HISTORY SHOWN TO CLAUDE

**NIV Orchestrator:**
```typescript
// Lines 1301-1314
if (conceptState.researchHistory.length > 0) {
  const truncatedResearch = truncateResearchHistory(conceptState.researchHistory, 2000)
  message += `**Recent Research Summary:**
  (Showing last ${truncatedResearch.length} research rounds)
  ${truncatedResearch.forEach((research, idx) => {
    message += `Research Round ${idx}: ${research.summarizedText}\n`
  })}`
}
```

**NIV Content:** ❌ Shows research count only, NOT actual findings

---

### 5. ❌ NO USER PREFERENCES EXTRACTION SHOWN

**NIV Orchestrator:**
```typescript
// Lines 1286-1298
if (conceptState.userPreferences.wants.length > 0) {
  message += `**What the user WANTS:**
  ${conceptState.userPreferences.wants.forEach(want => {
    message += `- ${want}\n`
  })}`
}

if (conceptState.userPreferences.doesNotWant.length > 0) {
  message += `**What the user DOES NOT WANT:**
  ${conceptState.userPreferences.doesNotWant.forEach(noWant => {
    message += `- ${noWant}\n`
  })}`
}
```

**NIV Content:** ❌ Extracts but doesn't SHOW to Claude in the prompt

---

### 6. ❌ NO CONCEPT PROGRESS TRACKING

**NIV Orchestrator:**
```typescript
// Lines 1268-1283
message += `**Campaign Concept Progress:**
Stage: ${conceptState.stage} (${conceptState.confidence}% complete)
Goal: ${conceptState.concept.goal}
Audience: ${conceptState.concept.audience}
Narrative: ${conceptState.concept.narrative}
Timeline: ${conceptState.concept.timeline}`
```

**NIV Content:** ❌ Has state but doesn't show it comprehensively to Claude

---

### 7. ❌ NO STRATEGIC INSTRUCTIONS ABOUT CONSULTATION

**NIV Orchestrator:**
```typescript
// Lines 1322-1332
message += `**Consultation Approach:**
As a strategic consultant, you should:
1. Acknowledge what's been discussed and build on it
2. Bring relevant insights and research to inform the concept
3. Ask ONE strategic question to move the concept forward
4. Guide toward a complete, actionable campaign concept

If stage is 'finalizing' or 'ready':
  The concept is nearly complete. Help refine and finalize it for orchestration.`
```

**NIV Content:** ❌ MISSING - Just asks generic "decide what to do next"

---

### 8. ❌ NO FRAMEWORK GENERATION MODE

**NIV Orchestrator:**
```typescript
// Lines 2612-2650
const explicitFrameworkRequest =
  queryLower.includes('create a framework') ||
  queryLower.includes('strategic framework') ||
  queryLower.includes('build a framework')

if (explicitFrameworkRequest || claudeUnderstanding?.approach?.generate_framework === true) {
  shouldGenerateFramework = true
}

// Lines 2715-2789
if (shouldGenerateFramework && stage === 'full') {
  const extractedResearch = extractAndPackageResearch(updatedState, toolResults)

  const strategicResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/niv-strategic-framework`,
    {
      body: JSON.stringify({
        research: extractedResearch,
        userQuery: message,
        organizationContext: {...},
        conversationHistory: conversationHistory,
        targetComponent: 'auto-detect'
      })
    }
  )

  return strategicData.framework
}
```

**NIV Content:** ❌ MISSING - No framework generation, just content orchestration

---

### 9. ❌ NO ORCHESTRATED RESEARCH WITH MULTIPLE TOOLS

**NIV Orchestrator:**
```typescript
// Lines 2353-2475
if (isComplexQuery && ANTHROPIC_API_KEY) {
  // Decompose query into research steps
  const researchPlan = await decomposeQuery(userMessage, context, ANTHROPIC_API_KEY)

  // Create tools for self-orchestration
  const orchestrationTools = {
    fireplexity: async (query: string) => {...},
    intelligencePipeline: async (query: string) => {...},
    mcpDiscovery: async (org: string) => {...}
  }

  // Execute the research plan
  const orchestrationResult = await orchestrateResearch(
    researchPlan,
    orchestrationTools,
    onStepComplete
  )

  // Detect information gaps
  const gaps = await detectInformationGaps(orchestrationResult, message, ANTHROPIC_API_KEY)

  // Fill critical gaps
  for (const gap of criticalGaps) {
    const gapResult = await orchestrationTools.fireplexity(gap.query)
    toolResults.intelligencePipeline.articles.push(...gapResult.data)
  }
}
```

**NIV Content:** ❌ MISSING - Only calls niv-fireplexity once, no orchestration

---

### 10. ❌ NO INFORMATION GAP DETECTION

**NIV Orchestrator:**
```typescript
// Lines 2456-2475
const gaps = await detectInformationGaps(
  orchestrationResult.aggregatedResults,
  message,
  ANTHROPIC_API_KEY
)

if (gaps.length > 0) {
  const criticalGaps = gaps.filter(g => g.priority === 'critical')
  for (const gap of criticalGaps) {
    console.log(`🔍 Filling critical gap: ${gap.topic}`)
    const gapResult = await orchestrationTools.fireplexity(gap.query)
    toolResults.intelligencePipeline.articles.push(...gapResult.data)
  }
}
```

**NIV Content:** ❌ MISSING - No gap detection or filling

---

### 11. ❌ NO ACKNOWLEDGMENT STAGE

**NIV Orchestrator:**
```typescript
// Lines 2322-2342
if (stage === 'acknowledge') {
  const acknowledgment = claudeUnderstanding?.acknowledgment ||
                        generateAcknowledgment(message, queryStrategy, persona)

  return {
    success: true,
    stage: 'acknowledgment',
    message: acknowledgment,
    strategy: queryStrategy?.approach,
    understanding: claudeUnderstanding?.understanding
  }
}
```

**NIV Content:** ❌ MISSING - No acknowledgment stage separation

---

### 12. ❌ NO QUERY STRATEGY SELECTION

**NIV Orchestrator:**
```typescript
// Lines 2304-2316
queryStrategy = {
  approach: claudeUnderstanding.approach.strategy, // 'fireplexity_targeted' or 'intelligence_pipeline' or 'contextual_response'
  confidence: claudeUnderstanding.approach.confidence,
  reasoning: claudeUnderstanding.approach.reasoning,
  searchQuery: claudeUnderstanding.approach.search_query,
  understanding: claudeUnderstanding.understanding
}
```

**NIV Content:** ❌ MISSING - No strategy selection, just hardcoded niv-fireplexity

---

### 13. ❌ NO MODULE PERSONA SYSTEM

**NIV Orchestrator:**
```typescript
// Lines 2182-2183
const persona = getModulePersona(context.activeModule)
console.log(`🎭 Active persona: ${persona.title} for ${context.activeModule} module`)

// Lines 2604-2610
const moduleEnhancedPrompt = `${NIV_SYSTEM_PROMPT}

CURRENT CONTEXT: Operating as ${persona.title}
${persona.mindset}

Remember to maintain natural conversation flow...`
```

**NIV Content:** ❌ MISSING - No persona system

---

### 14. ❌ NO TOKEN COUNT VALIDATION

**NIV Orchestrator:**
```typescript
// Lines 2655-2667
const systemPromptTokens = estimateTokenCount(moduleEnhancedPrompt)
const messageTokens = estimateTokenCount(claudeMessage)
const totalTokens = systemPromptTokens + messageTokens

const MAX_SAFE_TOKENS = 180000
if (totalTokens > MAX_SAFE_TOKENS) {
  throw new Error(`Message too long (${totalTokens} tokens)`)
}
```

**NIV Content:** ❌ MISSING - No token validation

---

### 15. ❌ NO RESPONSE FORMATTING

**NIV Orchestrator:**
```typescript
// Lines 2698-2709
responseText = cleanClaudeResponse(responseText)
const orgName = toolResults.discoveryData?.organizationName || context.organizationId
responseText = formatNivResponse(responseText, orgName)
const structuredContent = extractStructuredContent(responseText, queryType)
```

**NIV Content:** ❌ MISSING - No response cleaning or formatting

---

## EXAMPLE: "Create a media plan for Sora 2 launch"

### NIV ORCHESTRATOR WOULD DO:

```
1. UNDERSTANDING CALL:
   Claude analyzes: "User wants media plan for Sora 2 (OpenAI's video AI).
   Need fresh market data on AI video landscape, competitors, recent launches."
   Returns: {
     approach: "fireplexity_targeted",
     search_query: "AI video generation market 2024 Sora Runway Pika launches",
     requires_fresh_data: true,
     generate_framework: false
   }

2. GET ORG PROFILE:
   getMcpDiscovery("OpenAI") → {
     competitors: ["Runway", "Pika", "Stability AI"],
     keywords: ["AI", "video generation", "Sora"],
     industry: "AI/Technology"
   }

3. EXECUTE RESEARCH:
   decomposeQuery("media plan Sora 2") → [
     "AI video generation market size 2024",
     "Sora 2 vs Runway Gen-3 comparison",
     "Recent AI video product launches",
     "Media coverage AI video tools"
   ]
   orchestrateResearch() → calls fireplexity for each
   detectInformationGaps() → fills any missing info

4. UPDATE STATE:
   updateConceptState() extracts:
   - contentType: "media-plan"
   - subject: "Sora 2 launch"
   - purpose: "launch"

5. BUILD COMPREHENSIVE MESSAGE:
   **BASELINE CLIENT PROFILE - OpenAI:**
   • Industry: AI/Technology
   • Competitors: Runway, Pika, Stability AI

   **Current User Query:** "create a media plan for Sora 2 launch"

   **Campaign Concept Progress:**
   Stage: defining (50% complete)
   Goal: Launch Sora 2

   **Recent Research Summary:**
   Research Round 1: AI video market $2B, growing 40% YoY
   Research Round 2: Runway Gen-3 launched June 2024, targets creators
   Research Round 3: Pika 1.5 focuses on ease of use

   **Consultation Approach:**
   1. Acknowledge what's been discussed
   2. Bring research insights
   3. Ask ONE strategic question
   4. Guide toward complete campaign

6. CLAUDE RESPONDS:
   "Based on my research of the AI video landscape, I see 3 strategic narratives:

   1. **Democratizing Hollywood** - Position Sora 2 as making studio-quality video
      accessible. Target: TechCrunch, The Verge (creator economy angle)

   2. **Enterprise Grade** - Focus on business use cases vs consumer toys.
      Target: WSJ, Bloomberg (enterprise tech angle)

   3. **Creator Empowerment** - Compete directly with Pika on creator tools.
      Target: The Information, Protocol (creator platform angle)

   Which narrative aligns with your launch goals?"

7. USER CHOOSES → NIV CALLS STRATEGIC FRAMEWORK:
   Passes: research + organizationContext + conversationHistory
   Returns: Complete framework with tactics mapped to narrative
```

### NIV CONTENT CURRENTLY DOES:

```
1. REBUILD STATE:
   Extracts: contentType="media-plan", subject="Sora 2 launch"

2. CALL CLAUDE:
   "User said 'media plan for Sora 2 launch'
   State: contentType=media-plan, subject=Sora 2 launch

   Decision?"

3. CLAUDE DECIDES: ask_question
   Returns: "What's your launch date?"

4. USER FRUSTRATED: "I already told you Sora 2!!!"
```

---

## WHAT NIV CONTENT NEEDS

### Implement EXACT Same Flow:

1. **Initial Understanding Call** - Ask Claude to analyze query BEFORE research
2. **Get Org Profile** - Call getMcpDiscovery for competitors/keywords
3. **Orchestrated Research** - decomposeQuery + orchestrateResearch + gap detection
4. **Comprehensive Message Building** - buildClaudeMessage with ALL context
5. **Strategic Response** - Claude with full context generates intelligent response
6. **Framework Generation** - Call niv-strategic-framework when appropriate

### The Core Intelligence Is:

**PREPROCESSING → RESEARCH → CONTEXT BUILDING → INTELLIGENT RESPONSE**

Not just:
~~"Here's the message, decide what to do"~~
