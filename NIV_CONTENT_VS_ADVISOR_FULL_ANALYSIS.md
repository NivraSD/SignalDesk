# NIV Content vs NIV Advisor - Complete Research Architecture Comparison

## EXECUTIVE SUMMARY

NIV Advisor gets correct research. NIV Content gets garbage. Here's EVERY single fucking difference:

---

## 1. RESEARCH QUERY CONSTRUCTION

### NIV Advisor (CORRECT)
```typescript
// Line 4466-4467
const researchQuery = queryStrategy?.searchQuery || claudeUnderstanding?.approach?.search_query || userMessage
```

**Claude builds the query**, NOT code. Claude gets:
- Full system prompt with persona
- Conversation history
- Organization context
- **EXPLICIT instruction**: "Include 2025 in every search query"
- **EXPLICIT instruction**: "Don't just search for announcements - search for leaks, rumors, API changes"

**Understanding prompt (lines 4273-4349):**
```typescript
**CRITICAL - CURRENT DATE & YEAR AWARENESS:**
- TODAY IS: ${getCurrentDate()}
- CURRENT YEAR: ${new Date().getFullYear()}
- **YOU MUST INCLUDE "${new Date().getFullYear()}" IN EVERY SEARCH QUERY**
- Example: NOT "OpenAI education market" → CORRECT: "OpenAI education market 2025"

**CRITICAL - SEARCH QUERY TEMPORAL CONTEXT:**
- For "recent": Be SPECIFIC - use "last 2 weeks" or "past 30 days"
- For "latest": Include "past 14 days" or "last month" for precision
- ALWAYS include "2025" to filter out 2024/2023 results
- DON'T focus only on "announcements" - tech news breaks via LEAKS, RUMORS, PREVIEWS
- Example GOOD: "Gemini 3 leak rumor preview last 2 weeks 2025"
- Example BAD: "Google Gemini 3 announcement October 2025"
```

### NIV Content (BROKEN)
```typescript
// Lines 1512-1526 - FIXED but still missing guidance
const topics = understanding.understanding?.topics || []

let researchQuery = ''
if (topics.length > 0) {
  researchQuery = topics.slice(0, 5).join(' ')
}

if (!researchQuery.trim()) {
  researchQuery = message
}
```

**Understanding prompt (lines 3252-3320):**
```typescript
// NO DATE GUIDANCE
// NO YEAR GUIDANCE
// NO TEMPORAL CONTEXT INSTRUCTIONS
// NO "INCLUDE 2025" REQUIREMENT
// NO "SEARCH FOR LEAKS NOT JUST ANNOUNCEMENTS"

// Just basic questions:
"1. What is the user really asking for?"
"2. Is this a media plan, presentation, social post, press release, or something else?"
"3. Do I need fresh market intelligence?"
```

**RESULT**: NIV Content searches "thought leadership event production" while NIV Advisor searches "tech company event production spending trends corporate experiential marketing 2025"

---

## 2. TIMEFRAME DETECTION

### NIV Advisor (CORRECT)
```typescript
// Lines 1408-1441
let timeframe = 'week' // default

if (queryLower.match(/breaking|just|today|current|right now|this morning/i)) {
  timeframe = 'current' // past HOUR
} else if (queryLower.match(/latest|recent|new/i)) {
  timeframe = 'recent' // past 3 DAYS
} else if (queryLower.match(/this week/i)) {
  timeframe = 'week'
} else if (queryLower.match(/this month|past month|market share|revenue|analysis|landscape|positioning/i)) {
  timeframe = 'month'
}

const tbsMap: Record<string, string> = {
  'current': 'qdr:h',    // Last hour
  'recent': 'qdr:d3',    // Last 3 days
  'week': 'qdr:w',       // Last week
  'month': 'qdr:m',      // Last month
  'year': ''             // No filter
}
```

### NIV Content (IDENTICAL BUT USELESS WITHOUT QUERY GUIDANCE)
```typescript
// Lines 3660-3681 - SAME CODE
// But doesn't matter because query is "thought leadership event production"
// which doesn't match any timeframe patterns!

// NIV Advisor query: "tech company event production spending trends 2025"
// NIV Content query: "thought leadership event production"
// Result: Both get qdr:d3 (3 days) but NIV Content is searching for wrong things
```

---

## 3. UNDERSTANDING PHASE MODEL

### NIV Advisor
```typescript
// Line 4360
model: 'claude-sonnet-4-20250514',  // Sonnet 4
max_tokens: 500
```

### NIV Content
```typescript
// Line 3331
model: 'claude-sonnet-4-5-20250929',  // Sonnet 4.5
max_tokens: 500
```

**Same token limit, newer model. This is FINE.**

---

## 4. GENERATION PHASE MODEL

### NIV Advisor
```typescript
// Multiple models depending on task:
model: 'claude-sonnet-4-20250514'  // Strategy frameworks
model: 'claude-haiku-4-5-20251001' // Quick responses
```

### NIV Content
```typescript
// Line 3684 in callClaude
model: 'claude-haiku-4-5-20251001'
max_tokens: 4096
```

**NIV Content uses Haiku for EVERYTHING. Advisor uses Sonnet for strategy.**

---

## 5. RESEARCH ORCHESTRATION

### NIV Advisor (ORCHESTRATED MULTI-STEP)
```typescript
// Lines 4463-4627
const researchPlan = await decomposeQuery(researchQuery, context, ANTHROPIC_API_KEY)
console.log(`📋 Research plan created: ${researchPlan.steps.length} steps`)

// Execute MULTI-STEP orchestrated research
const orchestrationResult = await orchestrateResearch(
  researchPlan,
  context,
  {
    firesearch: async (query: string) => {
      // Calls Firecrawl for each step
    }
  },
  ANTHROPIC_API_KEY,
  organizationName
)

toolResults.intelligencePipeline = {
  articles: allArticles,
  synthesis: synthesis,
  sources: allArticles.map(a => a.source),
  searchQueries: researchPlan.steps.map(s => s.query)
}
```

**Has self-orchestration.ts with:**
- `decomposeQuery()` - breaks complex queries into steps
- `detectInformationGaps()` - finds what's missing
- `orchestrateResearch()` - executes multi-step research
- `SelfMessagingQueue` - manages research iterations

### NIV Content (SINGLE SIMPLE CALL)
```typescript
// Lines 1530-1543 - ONE CALL, NO ORCHESTRATION
researchResults = await executeResearch(researchQuery.trim(), organizationId)

// executeResearch is just:
// 1. Call Firecrawl once
// 2. Return results
// That's it.
```

**NO orchestration. NO decomposition. NO multi-step. NO gap detection.**

---

## 6. RESEARCH RESULT SYNTHESIS

### NIV Advisor
```typescript
// Lines 4575-4625
// After orchestration, synthesizes ALL research steps:

toolResults.intelligencePipeline = {
  articles: allArticles,  // Combined from all steps
  synthesis: synthesis,   // AI-generated synthesis
  sources: allArticles.map(a => a.source),
  searchQueries: researchPlan.steps.map(s => s.query),  // Shows what was searched
  methodology: 'orchestrated_multi_step'
}

toolResults.keyFindings = allArticles.slice(0, 10).map(article => {
  // Formats findings with title + description
})
```

### NIV Content
```typescript
// Lines 3753-3781
// Just formats raw Firecrawl results:

const keyFindings = articles.slice(0, 5).map(article => {
  return description
    ? `**${title}** - ${description}`
    : `**${title}**`
})

return {
  articles: articles,
  synthesis: '',  // EMPTY - no synthesis
  keyFindings: keyFindings
}
```

**NO synthesis. NO methodology tracking. Just raw results.**

---

## 7. CONCEPT STATE MANAGEMENT

### NIV Advisor (FULL STATE TRACKING)
```typescript
// Lines 19-54
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
  researchHistory: any[]  // Stores ALL research rounds
  userPreferences: {
    wants: string[]
    doesNotWant: string[]
    examples: string[]
    constraints: string[]
  }
  fullConversation: Array<{role: string, content: string, timestamp: Date}>
  lastUpdate: number
  lastResponse?: {
    awaitingFrameworkConfirmation?: boolean
    structuredResponse?: any
  }
}

// Lines 95-114 - Limits memory
const MAX_CONVERSATION_HISTORY = 20
const MAX_RESEARCH_HISTORY = 10

if (state.fullConversation.length > MAX_CONVERSATION_HISTORY) {
  state.fullConversation = state.fullConversation.slice(-MAX_CONVERSATION_HISTORY)
}
if (state.researchHistory.length > MAX_RESEARCH_HISTORY) {
  state.researchHistory = state.researchHistory.slice(-MAX_RESEARCH_HISTORY)
}
```

### NIV Content (MINIMAL STATE)
```typescript
// Lines 692-699
interface ConversationState {
  conversationId: string
  stage: 'understanding' | 'research' | 'strategy' | 'strategy_review' | 'generation' | 'complete'
  strategyChosen?: string
  approvedStrategy?: any
  researchResults?: any  // Just stores ONE research result
}

// NO conversation history limit
// NO research history tracking
// NO user preferences
// NO confidence tracking
// NO elements tracking
```

---

## 8. SYSTEM PROMPT QUALITY

### NIV Advisor (EXTENSIVE PERSONA)
**5,537 lines total**, system prompt is ~2000 lines with:

```typescript
// Lines 286-591
- Backstory and career arc (20 years at Edelman)
- Personal examples and war stories
- Specific frameworks (STEPPS, CASCADE, tipping point theory)
- Exactly how to structure responses
- When to use each tool
- How to present research findings
- Response formatting with examples
- Mindset switches for different modes
```

**Key excerpts:**
```
I immediately research the landscape and return with:
"Based on my research, here's what I see..."

• "Centola's research proves you need 25% adoption before reaching tipping point..."
• "I've researched your competitors and here's the strategic gap..."

**Research Findings:**
- Clear headers
- Bullet points
- 2-3 sentence summaries
```

### NIV Content (BASIC INSTRUCTIONS)
**4,876 lines total**, system prompt is ~360 lines:

```typescript
// Lines 1-359
- Basic role description
- List of 34 content types
- Workflow for presentations
- Workflow for media plans
- Some cliché warnings
- Tool descriptions
```

**NO persona. NO backstory. NO frameworks. NO specific examples. NO formatting guidance beyond basic markdown.**

---

## 9. CLAUDE CONTEXT BUILDING

### NIV Advisor
```typescript
// Lines 2423-2632
// Builds RICH context for Claude:

message += `ORGANIZATION: ${data.organizationName}`
message += `INDUSTRY: ${data.industry}`

if (data.competitors && data.competitors.length > 0) {
  message += `COMPETITORS: ${data.competitors.join(', ')}`
}

if (data.keywords && data.keywords.length > 0) {
  message += `KEYWORDS: ${data.keywords.join(', ')}`
}

message += `IMPORTANT: This is just baseline data. You should actively research CURRENT developments about ${data.organizationName}`

// Add concept state with ALL research
if (conceptState.researchHistory.length > 0) {
  const truncatedResearch = truncateResearchHistory(conceptState.researchHistory, 2000)
  message += `\n**Recent Research Summary:**\n`
  truncatedResearch.forEach((research, idx) => {
    message += `Research Round ${idx}: ${research.summarizedText}\n`
  })
}

// Add proposal generation instructions if research completed
if (toolResults.proposalContext) {
  message += `Research complete (${toolResults.proposalContext.articlesAnalyzed} sources analyzed)`
  message += `[2-3 paragraphs on what you discovered in the research]`
}

// Fallback to FireSearch data if available
if (toolResults.firesearchData && toolResults.firesearchData.length > 0) {
  message += `\n\n**FIRESEARCH TOOL RESULTS (Validated Sources):**\n`
  toolResults.firesearchData.forEach((article: any, i: number) => {
    message += `${i + 1}. **${article.title}** - ${article.description}\n`
  })
}
```

### NIV Content
```typescript
// Lines 3543-3612
// Minimal context:

if (research) {
  if (research.synthesis) {
    researchContext.push(`**Research Overview:**`)
    researchContext.push(research.synthesis)
  }

  if (research.keyFindings && research.keyFindings.length > 0) {
    researchContext.push(`**Sources Found:**`)
    research.keyFindings.forEach((finding: string, i: number) => {
      researchContext.push(`${i + 1}. ${finding}`)
    })
  }
}

// That's it. No methodology, no query tracking, no synthesis process
```

---

## 10. RESEARCH RESULT HANDLING

### NIV Advisor (SHOWS METHODOLOGY)
```typescript
toolResults.intelligencePipeline = {
  articles: allArticles,
  synthesis: synthesis,
  sources: allArticles.map(a => a.source),
  searchQueries: researchPlan.steps.map(s => s.query),  // ← Shows WHAT was searched
  methodology: 'orchestrated_multi_step',
  stepsCompleted: researchPlan.steps.length,
  articlesAnalyzed: allArticles.length
}
```

Claude sees:
- What queries were used
- How many steps
- Which sources
- Full methodology

### NIV Content (DUMPS RAW DATA)
```typescript
return {
  articles: articles,      // Just the articles
  synthesis: '',          // EMPTY
  keyFindings: keyFindings // Formatted titles
}
```

Claude sees:
- Some articles
- NO explanation of how they were found
- NO query used
- NO methodology

---

## 11. RESEARCH PRESENTATION TO USER

### NIV Advisor (STRUCTURED)
```typescript
// System prompt lines 541-586
**Research Findings:**
- **Market Dynamics**: [2-3 sentences on competitive landscape]
- **Key Trends**: [Bullet points with specific data]
- **Strategic Implications**: [What this means for you]

**Strategic Angles:**
1. **[Approach Name]** - [Description with supporting data]
2. **[Approach Name]** - [Description with supporting data]
3. **[Approach Name]** - [Description with supporting data]

Which resonates with your goals?
```

### NIV Content (CONFUSED)
```typescript
// Lines 3572-3590 in callClaude
currentUserMessage = `**RESEARCH COMPLETED**

${researchContext.join('\n')}

**INSTRUCTIONS FOR PRESENTING RESEARCH:**

You just received research findings.

1. **Start with a brief context** (1-2 sentences about what you researched)
2. **Present 2-3 key themes/insights** you discovered
3. **DO NOT dump the raw article data**
4. **Then propose 2-3 strategic angles** based on the research
5. **Ask which angle resonates**
```

**BUT** - research context is just article titles, NO synthesis, NO methodology. So Claude has to guess what's important.

---

## 12. ERROR HANDLING & RETRIES

### NIV Advisor
```typescript
// Lines 4472-4545 in orchestration
// Robust error handling with:
- Try/catch for each research step
- Fallback to empty results
- Logs every failure
- Continues even if one step fails
- Returns partial results
```

### NIV Content
```typescript
// Lines 3683-3799
// Basic retry:
const maxRetries = 2
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    // Call Firecrawl
  } catch (error) {
    // If last attempt, return empty
  }
}

// If ALL attempts fail, returns:
return {
  articles: [],
  synthesis: '',
  keyFindings: []
}
```

**Problem**: If Firecrawl fails ONCE, NIV Content gives up after 2 tries. NIV Advisor has multi-step with each step retrying independently.

---

## SUMMARY: WHAT'S BROKEN

| Feature | NIV Advisor | NIV Content | Impact |
|---------|-------------|-------------|---------|
| **Research Query** | Claude builds with date/year guidance | Code joins topics | CRITICAL - Wrong searches |
| **Year in Query** | Always includes 2025 | Never includes year | CRITICAL - Gets old data |
| **Temporal Context** | "last 2 weeks 2025" | Generic timeframe | HIGH - Misses recent news |
| **Query Type Guidance** | "Search leaks, rumors, APIs" | None | HIGH - Misses non-announcement news |
| **Orchestration** | Multi-step decomposition | Single call | HIGH - Shallow research |
| **Synthesis** | AI-generated overview | None | HIGH - No context |
| **Concept State** | Full tracking with history | Minimal | MEDIUM - Loses context |
| **System Prompt** | Extensive persona + examples | Basic instructions | MEDIUM - Generic responses |
| **Context Building** | Rich with all research rounds | Minimal | MEDIUM - Claude lacks info |
| **Result Presentation** | Structured with methodology | Raw dump | MEDIUM - Confusing |
| **Error Handling** | Step-by-step fallbacks | Simple retry | LOW - Fails faster |
| **Model Choice** | Sonnet for strategy | Haiku for everything | LOW - Cheaper but less smart |

---

## IMMEDIATE FIXES NEEDED

1. **Update understanding prompt** to match Advisor's date/year/leak guidance
2. **Add orchestration** from self-orchestration.ts
3. **Add synthesis** after research
4. **Upgrade model** to Sonnet for strategy/research phases
5. **Improve context building** to include methodology
6. **Track concept state** like Advisor
7. **Better error handling** with step-by-step fallbacks

---

## FILES TO REVIEW

1. `/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/niv-advisor/self-orchestration.ts` - Multi-step research
2. `/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/niv-advisor/index.ts` - Lines 4200-4700 (Understanding + Research)
3. `/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/niv-content-intelligent-v2/index.ts` - Lines 3234-3800 (Needs complete rewrite)
