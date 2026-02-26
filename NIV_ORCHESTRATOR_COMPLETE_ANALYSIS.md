# NIV Orchestrator Robust - Complete Line-by-Line Analysis

## READING IN PROGRESS - BUILDING COMPREHENSIVE DOCUMENTATION

---

## PART 1: STATE MANAGEMENT & CONVERSATION TRACKING (Lines 1-174)

### Lines 15-47: ConceptState Interface - THE CORE STATE ARCHITECTURE

```typescript
interface ConceptState {
  conversationId: string
  stage: 'exploring' | 'defining' | 'refining' | 'finalizing' | 'ready'
  concept: {
    goal?: string
    audience?: string
    narrative?: string
    timeline?: string
    budget?: string
    channels?: string[]
    content?: any
    triggers?: any
  }
  elementsDiscussed: string[]
  elementsConfirmed: string[]
  elementsNeeded: string[]
  confidence: number
  researchHistory: any[]
  userPreferences: {
    wants: string[]
    doesNotWant: string[]
    examples: string[]
    constraints: string[]
  }
  fullConversation: Array<{role: string, content: string, timestamp: Date}>
  lastUpdate: number
}
```

**WHAT THIS IS:**
- Complete memory structure tracking conversation evolution
- Stores EVERYTHING: concept elements, research, preferences, full conversation
- Tracks confidence and stage based on information gathered

**WHY IT MATTERS:**
- This is how NIV "remembers" across messages
- Builds understanding incrementally message-by-message
- Creates context for intelligent decision-making

**NIV CONTENT MUST HAVE:**
- Same state structure adapted for content (contentType, subject, purpose, narrative)
- Same tracking of wants/doesn't want/constraints
- Same fullConversation array
- Same confidence/stage progression

---

### Lines 50: State Storage

```typescript
const conceptStates = new Map<string, ConceptState>()
```

**CRITICAL ISSUE DISCOVERED:**
- Edge functions are STATELESS - this Map gets destroyed
- **SOLUTION ALREADY IMPLEMENTED:** NIV Content rebuilds state from conversationHistory

---

### Lines 53-75: getConceptState() - State Initialization

```typescript
function getConceptState(conversationId: string): ConceptState {
  if (!conceptStates.has(conversationId)) {
    conceptStates.set(conversationId, {
      conversationId,
      stage: 'exploring',
      concept: {},
      elementsDiscussed: [],
      elementsConfirmed: [],
      elementsNeeded: ['goal', 'audience', 'narrative', 'timeline'],
      confidence: 0,
      researchHistory: [],
      userPreferences: {
        wants: [],
        doesNotWant: [],
        examples: [],
        constraints: []
      },
      fullConversation: [],
      lastUpdate: Date.now()
    })
  }
  return conceptStates.get(conversationId)!
}
```

**WHAT THIS DOES:**
- Creates initial empty state if doesn't exist
- Sets default elementsNeeded: goal, audience, narrative, timeline
- Starts at 'exploring' stage with 0 confidence

**NIV CONTENT EQUIVALENT:**
- Already implemented in buildStateFromConversation()
- Sets elementsNeeded: ['contentType', 'subject']
- Same initialization pattern

---

### Lines 78-174: updateConceptState() - THE INTELLIGENCE EXTRACTION ENGINE

**Lines 82-93: Conversation Storage with Limits**
```typescript
state.fullConversation.push({
  role: 'user',
  content: message,
  timestamp: new Date()
})

// Keep only last 20 to prevent memory accumulation
const MAX_CONVERSATION_HISTORY = 20
if (state.fullConversation.length > MAX_CONVERSATION_HISTORY) {
  state.fullConversation = state.fullConversation.slice(-MAX_CONVERSATION_HISTORY)
}
```

**WHAT IT DOES:** Stores every message, keeps last 20 to prevent bloat

**NIV CONTENT:** Already implemented, same pattern

---

**Lines 96-109: Research History Storage with Limits**
```typescript
if (toolResults && Object.keys(toolResults).length > 0) {
  state.researchHistory.push({
    timestamp: new Date(),
    query: message,
    results: toolResults
  })

  const MAX_RESEARCH_HISTORY = 10
  if (state.researchHistory.length > MAX_RESEARCH_HISTORY) {
    state.researchHistory = state.researchHistory.slice(-MAX_RESEARCH_HISTORY)
  }
}
```

**WHAT IT DOES:** Stores research results, keeps last 10 rounds

**NIV CONTENT:** Already implemented, same pattern

---

**Lines 115-135: REGEX EXTRACTION - User Preferences Intelligence**

```typescript
// Track what user wants
if (messageLower.includes('want to') || messageLower.includes('need to') || messageLower.includes('looking to')) {
  const wantMatch = message.match(/(want to|need to|looking to)\s+([^.,;]+)/i)
  if (wantMatch) {
    state.userPreferences.wants.push(wantMatch[2].trim())
  }
}

// Track what user doesn't want
if (messageLower.includes("don't want") || messageLower.includes("avoid") || messageLower.includes("not interested") || messageLower.includes("no ")) {
  state.userPreferences.doesNotWant.push(message)
}

// Track examples
if (messageLower.includes('like') || messageLower.includes('similar to') || messageLower.includes('example')) {
  state.userPreferences.examples.push(message)
}

// Track constraints
if (messageLower.includes('budget') || messageLower.includes('deadline') || messageLower.includes('constraint') || messageLower.includes('limitation')) {
  state.userPreferences.constraints.push(message)
}
```

**EXTRACTION PATTERNS:**
1. **Wants:** Regex: `/(want to|need to|looking to)\s+([^.,;]+)/i`
2. **Doesn't Want:** Keywords: "don't want", "avoid", "not interested", "no "
3. **Examples:** Keywords: "like", "similar to", "example"
4. **Constraints:** Keywords: "budget", "deadline", "constraint", "limitation"

**NIV CONTENT:** Already implemented, same patterns

---

**Lines 138-153: Concept Element Extraction**

```typescript
// Check for goal/objective
if ((messageLower.includes('want to') || messageLower.includes('goal') || messageLower.includes('objective')) && !state.concept.goal) {
  state.concept.goal = message
  state.elementsDiscussed.push('goal')
}

// Check for audience
if ((messageLower.includes('audience') || messageLower.includes('target') || messageLower.includes('reach')) && !state.concept.audience) {
  state.concept.audience = message
  state.elementsDiscussed.push('audience')
}

// Check for timeline
if ((messageLower.includes('when') || messageLower.includes('timeline') || messageLower.includes('launch')) && !state.concept.timeline) {
  state.concept.timeline = message
  state.elementsDiscussed.push('timeline')
}
```

**ELEMENT DETECTION:**
- **Goal:** Keywords + stores FULL message
- **Audience:** Keywords + stores FULL message
- **Timeline:** Keywords + stores FULL message
- Tracks in elementsDiscussed array

**NIV CONTENT:** Adapted for contentType, subject, purpose - same pattern

---

**Lines 156-168: Confidence & Stage Progression**

```typescript
// Update confidence based on elements collected
const elementCount = Object.keys(state.concept).length
state.confidence = Math.min(100, elementCount * 20)

// Update stage based on progress
if (state.confidence < 25) {
  state.stage = 'exploring'
} else if (state.confidence < 50) {
  state.stage = 'defining'
} else if (state.confidence < 75) {
  state.stage = 'refining'
} else {
  state.stage = 'finalizing'
}
```

**PROGRESSION LOGIC:**
- Confidence = elementCount * 20 (max 100)
- Stage based on confidence thresholds
- exploring → defining → refining → finalizing

**NIV CONTENT:** Already implemented, same logic

---

## PART 2: DECISION LOGIC & INTELLIGENCE (Lines 176-259)

### Lines 177-201: hasMinimumInformation() - Readiness Check

```typescript
function hasMinimumInformation(state: ConceptState): boolean {
  const hasGoal = state.concept.goal ||
    state.userPreferences.wants.length > 0 ||
    state.elementsDiscussed.includes('goal')

  const hasAudience = state.concept.audience ||
    state.elementsDiscussed.includes('audience') ||
    state.fullConversation.some(msg =>
      msg.content.toLowerCase().includes('reach') ||
      msg.content.toLowerCase().includes('target') ||
      msg.content.toLowerCase().includes('audience')
    )

  const hasContext = state.concept.timeline ||
    state.userPreferences.constraints.length > 0 ||
    state.researchHistory.length > 0 ||
    state.confidence >= 40

  return hasGoal && hasAudience && hasContext
}
```

**INTELLIGENCE:**
- Doesn't just check concept.goal - also checks wants array and elementsDiscussed
- Searches fullConversation for audience keywords
- Considers research history as "context"
- Multiple ways to satisfy each requirement

**NIV CONTENT NEEDS:**
- Same multi-source checking
- Adapt for content: hasContentType, hasSubject, hasContext

---

### Lines 204-231: shouldGenerateProposals() - Proposal Trigger Logic

```typescript
function shouldGenerateProposals(state: ConceptState, message: string): boolean {
  const messageLower = message.toLowerCase()

  const explicitProposalRequest =
    (messageLower.includes('proposal') && messageLower.includes('options')) ||
    (messageLower.includes('give me') && messageLower.includes('options')) ||
    messageLower.includes('3 approaches') ||
    messageLower.includes('three approaches') ||
    messageLower.includes('different strategies') ||
    messageLower.includes('alternative approaches') ||
    (messageLower.includes('propose') && messageLower.includes('different'))

  const hasNumberedList = /\d+\.\s+\w+/g.test(message)

  // Don't trigger if:
  if (hasNumberedList) return false  // User has specific tasks
  if (messageLower.includes('brainstorm')) return false
  if (messageLower.includes('framework')) return false
  if (message.endsWith('?')) return false  // Questions

  return explicitProposalRequest
}
```

**SMART DETECTION:**
- Only triggers on EXPLICIT request for multiple options
- Detects numbered lists → user wants tasks, not proposals
- Detects questions → answer, don't propose
- Detects "framework" → generate framework, not proposals

**NIV CONTENT NEEDS:**
- Same explicit detection
- Adapt for narrative options vs proposals

---

### Lines 234-259: getNextStrategicQuestion() - Gap-Based Questions

```typescript
function getNextStrategicQuestion(state: ConceptState): string {
  const missing = state.elementsNeeded.filter(e => !state.elementsDiscussed.includes(e))

  if (missing.includes('goal') && !state.concept.goal) {
    return "Let's start with the big picture..."
  }

  if (missing.includes('audience') && !state.concept.audience) {
    return "Who exactly are we trying to reach?..."
  }

  if (missing.includes('narrative') && !state.concept.narrative) {
    return "What's the core story you want to tell?..."
  }

  if (missing.includes('timeline') && !state.concept.timeline) {
    return "What's your timeline for this campaign?..."
  }

  if (state.stage === 'refining') {
    return "What makes your approach different?..."
  }

  return "Tell me more about what you're envisioning..."
}
```

**INTELLIGENT QUESTIONING:**
- Asks about what's MISSING, not everything
- Priority order: goal → audience → narrative → timeline
- Changes questions based on stage

**NIV CONTENT:** Already implemented same pattern

---

## PART 3: NIV SYSTEM PROMPT (Lines 273-400)

### CRITICAL INSTRUCTIONS TO CLAUDE

**Lines 273-283: Current Date Awareness**
- Always reference LATEST models (GPT-4o, o1, NOT older)
- Recent events from 2024-2025
- Present-tense language
- Current market dynamics

**Lines 285-303: Discovery Profile Intelligence**
- Profile is just FOUNDATION, not constraint
- MUST research MORE beyond profile
- Profile may be incomplete/outdated
- Research CURRENT developments
- Each query deepens understanding

**Lines 306-313: Professional Background (Persona)**
- Former VP Communications
- 100+ organizations consulted
- 50+ crises managed
- Deep media relationships
- Competitive positioning expert

**Lines 315-322: Consultative Approach**
```
1. Immediately assess what they're trying to achieve
2. Proactively research to bring insights TO them
3. Guide conversation toward complete concept
4. Ask smart questions that refine concept
5. Build progressively - each exchange adds substance
```

**Lines 337-352: Response Patterns by Request Type**
- Vague: Research + "Here's what I'm seeing..." + options
- Partial: "Three narrative vacuums we could fill..."
- Clear: Validate + enhance + "Here's the landscape..."

**Lines 355-395: Adaptive Response System**
- Numbered lists? Fulfill each completely
- Questions? Answer with substance
- Brainstorming? Explore ideas
- Framework? Build complete one

---

---

## PART 4: MODULE PERSONAS - ADAPTIVE INTELLIGENCE (Lines 436-562)

### The Complete Persona System

NIV has **5 DIFFERENT PERSONAS** based on the module/mode:

**1. Intelligence Mode (Lines 437-461)**
- Title: "Chief Intelligence Analyst"
- Mindset: "Forensically objective", "triangulate everything", "timestamp + confidence levels"
- Methodology: COLLECTION → VERIFICATION → PATTERN RECOGNITION → GAP ANALYSIS → CONFIDENCE SCORING
- Tools: intelligence_pipeline, fireplexity_targeted
- Response: analytical_brief

**2. Opportunities Mode (Lines 463-486)**
- Title: "Strategic Opportunities Advisor"
- Mindset: "See opportunity in chaos", "risk/reward calculation", "second/third-order effects"
- Framework: MAGNITUDE → TIMING → COMPETITION → RESOURCES → RISK
- Tools: intelligence_pipeline, contextual_response
- Response: strategic_recommendation

**3. Plan Mode (Lines 488-511)**
- Title: "Campaign Architect"
- Mindset: "Integrated campaigns", "sequence for narrative impact", "anticipate counter-moves"
- Methodology: NARRATIVE ARC → STAKEHOLDER MAP → CHANNEL STRATEGY → TIMELINE → METRICS
- Tools: contextual_response, intelligence_pipeline
- Response: tactical_playbook

**4. Execute Mode (Lines 513-536)**
- Title: "Tactical Operations Commander"
- Mindset: "Speed and precision", "think in 15-min increments", "first mover owns narrative"
- Principles: SPEED → CONSISTENCY → VERIFICATION → ESCALATION → DOCUMENTATION
- Tools: fireplexity_targeted, contextual_response
- Response: action_oriented

**5. MemoryVault Mode (Lines 538-561)**
- Title: "Institutional Knowledge Keeper"
- Mindset: "Recall similar situations", "remember failed strategies", "track narrative evolution"
- Framework: PRECEDENTS → PATTERNS → PLAYERS → LESSONS → EVOLUTION
- Tools: contextual_response, intelligence_pipeline
- Response: institutional_wisdom

**NIV CONTENT IMPLICATION:**
- Should have content-specific persona: "Content Strategy Director"
- Should adapt mindset based on content type (media plan vs social post)
- Should have different approaches for simple vs complex content

---

## PART 5: QUERY PATTERN DETECTION (Lines 570-671)

### Lines 579-640: QUERY_PATTERNS - Pattern Matching Intelligence

**6 PATTERN TYPES WITH REGEX:**

**1. campaign_proposal** (Line 580-589)
```typescript
regex: /campaign|proposal|strategy|approach|create.*plan|develop.*message|need.*journalist|amplify|get.*message.*out/i
tools: ['intelligence_pipeline', 'fireplexity_targeted']
approach: 'generate_proposals'
toolNarration: {
  intelligence_pipeline: "Let me research the landscape and develop strategic options...",
  fireplexity_targeted: "I'll analyze the current environment to build proposals..."
}
```

**2. situational** (Line 590-599)
```typescript
regex: /what's happening|current situation|status|latest|update|today|recent/i
tools: ['intelligence_pipeline', 'fireplexity_targeted']
approach: 'scan_and_assess'
```

**3. competitive** (Line 600-609)
```typescript
regex: /competitor|rival|market position|vs|versus|competition/i
tools: ['intelligence_pipeline', 'mcp-discovery']
approach: 'competitive_analysis'
```

**4. opportunity** (Line 610-619)
```typescript
regex: /opportunity|chance|should I|can we|potential|leverage|capitalize/i
tools: ['intelligence_pipeline', 'contextual_response']
approach: 'opportunity_identification'
```

**5. crisis** (Line 620-629)
```typescript
regex: /crisis|problem|urgent|breaking|emergency|damage|scandal/i
tools: ['fireplexity_targeted', 'intelligence_pipeline']
approach: 'crisis_assessment'
```

**6. strategic** (Line 630-639)
```typescript
regex: /strategy|plan|approach|how should|recommend|advice|what do you think/i
tools: ['contextual_response', 'intelligence_pipeline']
approach: 'strategic_counsel'
```

**Lines 643-659: detectQueryPattern() - Pattern Detection**
```typescript
function detectQueryPattern(message: string): { pattern: string; confidence: number } {
  const lower = message.toLowerCase()

  for (const [patternName, pattern] of Object.entries(QUERY_PATTERNS)) {
    if (pattern.regex.test(lower)) {
      const wordCount = message.split(' ').length
      const confidence = wordCount > 10 ? 0.95 : 0.85
      return { pattern: patternName, confidence }
    }
  }

  return { pattern: 'situational', confidence: 0.7 }
}
```

**INTELLIGENCE:**
- Tests message against 6 regex patterns
- Higher confidence for longer messages (>10 words = 0.95, else 0.85)
- Defaults to 'situational' if no match

**NIV CONTENT NEEDS:**
- Content-specific patterns:
  - media_plan: /media plan|press.*launch|media.*strategy|journalist.*list/i
  - presentation: /presentation|deck|slides|pitch.*deck/i
  - social_post: /social.*post|tweet|linkedin.*post/i
  - press_release: /press release|announcement/i

---

## PART 6: INTELLIGENT QUERY ANALYSIS (Lines 684-799)

### Lines 684-703: analyzeQueryStrategy() - Claude-Powered Decision Making

**THE CRITICAL ANALYSIS FUNCTION:**

```typescript
async function analyzeQueryStrategy(message: string, organizationId: string, context: any) {
  const persona = getModulePersona(context.activeModule)  // Get persona
  const { pattern, confidence: patternConfidence } = detectQueryPattern(message)  // Detect pattern
  const queryPattern = QUERY_PATTERNS[pattern]

  if (!ANTHROPIC_API_KEY) {
    // Fallback: use pattern + persona tools
    return {
      approach: queryPattern.tools[0] || persona.tools_preference[0],
      confidence: patternConfidence,
      reasoning: `Pattern-based: ${pattern} query detected in ${context.activeModule} module`
    }
  }

  // ... Claude analysis ...
}
```

**Lines 705-744: The Claude Analysis Prompt**

```typescript
const analysisPrompt = `You are ${persona.title} - NIV's strategic decision engine with 20 years of PR experience, currently operating in ${context.activeModule?.toUpperCase() || 'INTELLIGENCE'} mode.

${persona.mindset}

QUERY: "${message}"
ORGANIZATION: ${organizationId}
CONTEXT: User is in ${context.activeModule || 'intelligence'} module
PATTERN DETECTED: ${pattern} (${patternConfidence} confidence)

MY AVAILABLE STRATEGIES:

1. "intelligence_pipeline" - My Full Strategic Intelligence Workup
   USE WHEN: CEO asks "what's happening?", competitor makes a move, market shifts
   WHY: This is how I prep for board meetings - complete intelligence with synthesis

2. "fireplexity_targeted" - My Rapid Response Intel
   USE WHEN: Breaking news, specific company updates, "what did X announce?", time-sensitive
   WHY: When a reporter calls with 30 min deadline, I need answers NOW

3. "contextual_response" - My Strategic Counsel
   USE WHEN: Strategy questions, "what should we do?", analysis requests
   WHY: Sometimes they don't need more data - they need my 20 years of experience

DECISION CRITERIA:
- Crisis brewing or competitor movement? → intelligence_pipeline (need full picture)
- Specific news or "just happened" queries? → fireplexity_targeted (need speed)
- Strategic guidance or "how should we respond"? → contextual_response (need wisdom)

Respond with JSON only:
{
  "approach": "intelligence_pipeline|fireplexity_targeted|contextual_response",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "focus_areas": ["area1", "area2"],
  "timeframe": "24h|48h|7d|general",
  "persona": "${persona.title}",
  "pattern": "${pattern}"
}
```

**THIS IS THE INTELLIGENCE:**
- Shows Claude the persona mindset
- Shows Claude the detected pattern
- Gives Claude 3 tool options with USE WHEN/WHY
- Asks Claude to decide which tool based on criteria
- Returns structured decision

**Lines 747-775: Claude Call + Parsing**
```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  model: 'claude-sonnet-4-20250514',
  max_tokens: 300,
  messages: [{ role: 'user', content: analysisPrompt }]
})

const data = await response.json()
const analysisText = data.content[0].text
const strategy = JSON.parse(analysisText.trim())
console.log(`🧠 Intelligent analysis: ${strategy.reasoning}`)
return strategy
```

**Lines 777-799: Fallback Logic**
```typescript
// If Claude fails, use rule-based detection
const lower = message.toLowerCase()

if (lower.includes('latest') || lower.includes('news') || lower.includes('update') || lower.includes('happening')) {
  return {
    approach: 'intelligence_pipeline',
    confidence: 0.9,
    reasoning: 'Rule-based: detected news/update query',
    focus_areas: ['news', 'competitive'],
    timeframe: '48h'
  }
}

return {
  approach: 'contextual_response',
  confidence: 0.7,
  reasoning: 'Rule-based: general query'
}
```

**NIV CONTENT NEEDS:**
- Same analyzeQueryStrategy() pattern
- Content-specific decisions:
  - "content_research_generation" - Complex content needs research first
  - "direct_generation" - Simple content, generate immediately
  - "narrative_presentation" - Research done, present options
- Adapt the decision prompt for content types

---

---

## PART 7: THE COMPLETE MAIN ORCHESTRATION FLOW (Lines 2122-2920)

### THE CRITICAL serve() FUNCTION - HOW EVERYTHING WORKS

**Lines 2128-2152: Request Handling & Input Parsing**
```typescript
const {
  message = body.query,
  query = body.message,
  sessionId = 'default',
  conversationId = 'default-conversation',
  context = {},
  stage = 'full',
  conversationHistory = []
} = body

const userMessage = message || query
```

**Supports both "message" and "query" for backwards compatibility**

---

### STEP 1: INITIAL UNDERSTANDING (Lines 2189-2300)

**Lines 2194-2248: Claude Understanding Prompt**

```typescript
const understandingPrompt = `${NIV_SYSTEM_PROMPT}

You are analyzing this user query to understand what they need and how to get it.

${conversationHistory.length > 0 ? `Recent Conversation:
${conversationHistory.map(msg => `${msg.role === 'user' ? 'User' : 'NIV'}: ${msg.content}`).join('\n')}
` : ''}

Current User Query: "${userMessage}"
Organization Context: ${organizationId}

Think step by step:
1. What is the user really asking for?
2. Do I need fresh, real-time information?
3. What specific search terms would find best results?
4. Should I search quality sources only, or cast wider net?
5. Should I generate a strategic framework now?

Respond with JSON only:
{
  "understanding": {
    "what_user_wants": "brief description",
    "entities": ["companies", "people", "products"],
    "timeframe": "latest/recent/specific date",
    "topics": ["specific topics"],
    "requires_fresh_data": true/false,
    "why_fresh_data": "explanation"
  },
  "approach": {
    "strategy": "fireplexity_targeted|intelligence_pipeline|contextual_response",
    "reasoning": "why this approach",
    "search_query": "specific targeted query",
    "search_domains": "quality_first/quality_only/all_web",
    "confidence": 0.0-1.0,
    "generate_framework": false
  },
  "acknowledgment": "Natural acknowledgment message"
}
```

**WHAT THIS DOES:**
- Shows Claude the FULL conversation history
- Asks Claude to UNDERSTAND what user wants
- Asks Claude to DECIDE which tool to use
- Asks Claude to CREATE specific search query
- Returns structured decision

**THIS IS THE MISSING INTELLIGENCE IN NIV CONTENT**

---

### STEP 2: ACKNOWLEDGE STAGE (Lines 2322-2342)

```typescript
if (stage === 'acknowledge') {
  const acknowledgment = claudeUnderstanding?.acknowledgment ||
                       generateAcknowledgment(message, queryStrategy, persona)

  return {
    success: true,
    stage: 'acknowledgment',
    message: acknowledgment,
    strategy: queryStrategy?.approach || 'fireplexity_targeted',
    understanding: claudeUnderstanding?.understanding,
    sessionId: sessionId
  }
}
```

**FAST ACKNOWLEDGMENT:** Returns immediately with understanding, actual research happens in next stage

---

### STEP 3: GET/UPDATE CONCEPT STATE (Lines 2347-2596)

```typescript
// Get concept state BEFORE orchestration decision
const conceptState = getConceptState(conversationId)

// Check if requires multi-step orchestration
const isComplexQuery = checkQueryComplexity(userMessage, claudeUnderstanding, conceptState)

if (isComplexQuery && ANTHROPIC_API_KEY) {
  // ORCHESTRATED RESEARCH (lines 2353-2475)
  const researchPlan = await decomposeQuery(userMessage, context, ANTHROPIC_API_KEY)

  const orchestrationTools = {
    fireplexity: async (query: string) => {...},
    intelligencePipeline: async (query: string) => {...},
    mcpDiscovery: async (org: string) => {...}
  }

  const orchestrationResult = await orchestrateResearch(researchPlan, orchestrationTools, callback)

  toolResults = {
    orchestrated: true,
    researchPlan: researchPlan,
    completedSteps: orchestrationResult.completedSteps,
    keyFindings: orchestrationResult.keyFindings,
    intelligencePipeline: {...}
  }
} else {
  // SINGLE-STEP RESEARCH (lines 2476-2543)
  if (queryStrategy.approach === 'intelligence_pipeline') {
    toolResults.intelligencePipeline = await callEnhancedIntelligencePipeline(...)
  } else if (queryStrategy.approach === 'fireplexity_targeted') {
    toolResults = await executeTargetedFireplexity(...)
  } else {
    toolResults = await executeContextualResponse(...)
  }
}

// ALWAYS get organization profile
orgProfile = await getMcpDiscovery(organizationId)
toolResults.discoveryData = {...}

// Update concept state with research results
updateConceptState(conversationId, userMessage, toolResults, conversationHistory)
```

**THE INTELLIGENCE FLOW:**
1. Get/create ConceptState for conversation
2. Check if complex (requires orchestration)
3. Execute research (orchestrated OR single-step)
4. Get organization profile
5. Update ConceptState with results

---

### STEP 4: BUILD COMPREHENSIVE MESSAGE (Lines 2654-2710)

```typescript
// Build message for Claude
const claudeMessage = buildClaudeMessage(
  userMessage,
  toolResults,
  queryType,
  queryStrategy,
  conversationHistory,
  shouldGenerateFramework,
  conceptState
)

// Validate token count
const systemPromptTokens = estimateTokenCount(moduleEnhancedPrompt)
const messageTokens = estimateTokenCount(claudeMessage)
const totalTokens = systemPromptTokens + messageTokens

if (totalTokens > MAX_SAFE_TOKENS) {
  throw new Error(`Message too long (${totalTokens} tokens)`)
}

// Call Claude
const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
  model: 'claude-sonnet-4-20250514',
  max_tokens: 2000,
  system: moduleEnhancedPrompt,
  messages: [{
    role: 'user',
    content: claudeMessage
  }]
})

let responseText = claudeData.content[0].text
responseText = cleanClaudeResponse(responseText)
responseText = formatNivResponse(responseText, orgName)
```

**buildClaudeMessage() INCLUDES:**
- Organization profile (baseline context)
- Full conversation history (truncated to fit)
- Current user query
- Concept state (stage, confidence, what's discussed)
- User preferences (wants, doesn't want)
- Research history (summarized)
- Research results from current query
- Mode-specific instructions (research vs framework)

**THIS IS THE COMPREHENSIVE CONTEXT THAT MAKES CLAUDE INTELLIGENT**

---

### STEP 5: FRAMEWORK GENERATION (Lines 2612-2907)

```typescript
// Determine if should generate framework
const explicitFrameworkRequest =
  queryLower.includes('create a framework') ||
  queryLower.includes('strategic framework') ||
  queryLower.includes('build a framework') ||
  ...

const afterDiscussionRequest = (
  conceptState.fullConversation.length > 2 &&
  (queryLower.includes('let\'s finalize') ||
   queryLower.includes('create the framework') ||
   ...)
)

if (claudeUnderstanding?.approach?.generate_framework === true) {
  shouldGenerateFramework = true
} else if (explicitFrameworkRequest) {
  shouldGenerateFramework = true
} else if (afterDiscussionRequest) {
  shouldGenerateFramework = true
} else if (conceptState.stage === 'ready' && conceptState.confidence >= 80) {
  if (queryLower.includes('what\'s next') || queryLower.includes('ready')) {
    shouldGenerateFramework = true
  }
}

if (shouldGenerateFramework && stage === 'full') {
  // Extract and package all research
  const extractedResearch = extractAndPackageResearch(updatedState, toolResults)

  // Call Strategic Framework edge function
  const strategicResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/niv-strategic-framework`,
    {
      method: 'POST',
      body: JSON.stringify({
        research: extractedResearch,
        userQuery: message,
        organizationContext: {
          organizationName: organizationName,
          discovery: toolResults.discoveryData,
          competitors: toolResults.discoveryData?.competitors,
          conceptState: updatedState,
          conversationId: conversationId
        },
        conversationHistory: conversationHistory,
        targetComponent: 'auto-detect'
      })
    }
  )

  const strategicData = await strategicResponse.json()
  const structuredFramework = strategicData.framework

  // Save to Memory Vault
  await fetch(`${SUPABASE_URL}/functions/v1/niv-memory-vault?action=save`, {
    body: JSON.stringify({
      strategy: {
        organization_id: organizationId,
        title: structuredFramework.strategy?.objective,
        research_sources: structuredFramework.intelligence?.supporting_data?.articles,
        research_key_findings: structuredFramework.intelligence?.key_findings,
        strategy_objective: structuredFramework.strategy?.objective,
        strategy_narratives: structuredFramework.narrative?.story_elements,
        workflow_campaign_intelligence: {...},
        workflow_content_generation: {...},
        ...
      }
    })
  })

  return {
    success: true,
    type: 'strategic-framework',
    framework: structuredFramework,
    discovery: toolResults.discoveryData,
    readyForHandoff: true,
    conceptState: {
      stage: 'ready',
      confidence: 100,
      readyForOrchestration: true
    }
  }
}
```

**FRAMEWORK HANDOFF:**
1. Detect if framework should be generated
2. Extract ALL research from conceptState + toolResults
3. Call niv-strategic-framework edge function
4. Pass complete context (research, org, conversation, conceptState)
5. Save resulting framework to Memory Vault
6. Return framework with readyForHandoff flag

---

## THE COMPLETE INTELLIGENCE FLOW - SUMMARY

```
USER MESSAGE
    ↓
[1] INITIAL UNDERSTANDING (Claude analyzes query)
    - What does user want?
    - Needs fresh data?
    - Which tool to use?
    - Specific search query
    → Returns strategy decision
    ↓
[2] ACKNOWLEDGE (if stage='acknowledge')
    - Return quick understanding
    - Tell user what we'll do
    → Frontend shows acknowledgment
    ↓
[3] GET/CREATE CONCEPTSTATE
    - getConceptState(conversationId)
    - Loads existing state OR creates new
    ↓
[4] EXECUTE RESEARCH
    IF complex:
      - decomposeQuery() → research plan
      - orchestrateResearch() → multi-step execution
      - Aggregate results
    ELSE:
      - Single tool execution
      - intelligence_pipeline OR fireplexity OR contextual
    ↓
[5] GET ORG PROFILE
    - getMcpDiscovery(organizationId)
    - Load org context
    ↓
[6] UPDATE CONCEPTSTATE
    - updateConceptState(conversationId, message, toolResults, history)
    - Extract preferences via regex
    - Store research
    - Update confidence/stage
    ↓
[7] BUILD COMPREHENSIVE MESSAGE
    - buildClaudeMessage()
    - Includes: org profile, conversation history, concept state,
      user preferences, research history, current results
    - Validates token count
    ↓
[8] CALL CLAUDE WITH FULL CONTEXT
    - System prompt: NIV_SYSTEM_PROMPT + module persona
    - User message: comprehensive built message
    - Claude responds with full understanding
    ↓
[9] FRAMEWORK DECISION
    IF shouldGenerateFramework:
      - extractAndPackageResearch()
      - Call niv-strategic-framework
      - Pass ALL context
      - Save to Memory Vault
      - Return framework
    ELSE:
      - Return Claude's response
      - Update conceptState
      - Return conversational response
```

---

## WHAT NIV CONTENT IS COMPLETELY MISSING

### 1. **Initial Understanding Call**
NIV Orchestrator asks Claude to UNDERSTAND the query BEFORE doing anything.
NIV Content should do the same:
```typescript
"What does user want to create?"
"Is it simple (social post) or complex (media plan)?"
"Does it need research first?"
"What specific research would help?"
→ Returns decision: direct_generation | research_then_generate | present_narratives
```

### 2. **Organization Profile Integration**
NIV Orchestrator ALWAYS loads org profile for context.
NIV Content should do the same - content should be org-specific.

### 3. **ConceptState Building**
NIV Orchestrator builds state message-by-message.
NIV Content should track:
- contentType, subject, purpose
- wants, doesn't want
- research history
- confidence/stage

### 4. **Comprehensive Message Building**
NIV Orchestrator's buildClaudeMessage() shows Claude EVERYTHING:
- Org profile
- Full conversation (truncated)
- Concept state progress
- User preferences
- Research history
- Current research results

NIV Content needs same comprehensive context building.

### 5. **Smart Questioning Based on Gaps**
NIV Orchestrator asks questions about what's MISSING.
NIV Content should analyze state and ask about actual gaps, not generic questions.

### 6. **Framework-Style Handoff**
NIV Orchestrator packages complete context for Strategic Framework.
NIV Content should package complete context for content services:
```typescript
await fetch('niv-content-generator', {
  research: extractedResearch,
  contentType: state.concept.contentType,
  subject: state.concept.subject,
  narrative: state.concept.narrative,
  organizationContext: {...},
  conversationHistory: [...],
  userPreferences: {...}
})
```

---

## THE KEY INSIGHT

**NIV Orchestrator's intelligence comes from:**

1. **Understanding BEFORE acting** - Claude analyzes query first
2. **Building context message-by-message** - ConceptState accumulates everything
3. **Showing Claude EVERYTHING** - Comprehensive message with all context
4. **Making smart decisions** - Based on state, not just current message
5. **Proper handoff** - Complete context passed to next service

**NIV Content needs ALL of this.**

It's not about the tools or functions - it's about the INTELLIGENCE FLOW:
- Understand → Build Context → Show Everything → Decide → Execute

---

## IMMEDIATE ACTIONS FOR NIV CONTENT

1. **Add Initial Understanding Call** - Like lines 2194-2300
2. **Build Comprehensive Message** - Like buildClaudeMessage()
3. **Pass Complete Context** - Like framework handoff (lines 2749-2764)
4. **Stop Asking Dumb Questions** - Analyze state for real gaps
5. **Propose Based on Research** - Like proposal mode (lines 2438-2448)

The intelligence is in HOW it processes, not WHAT it does.