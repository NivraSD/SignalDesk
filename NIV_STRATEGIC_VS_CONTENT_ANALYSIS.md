# NIV Strategic Framework vs NIV Content: Key Differences

## WHY NIV STRATEGIC WORKS BETTER

NIV Strategic Framework is **conversation-aware**, **context-rich**, and acts like a **real strategic consultant**. NIV Content feels "brain dead" because it's missing these critical components.

---

## 1. CONVERSATION HISTORY AWARENESS

### ✅ NIV Strategic Framework
```typescript
// Lines 362-376: Passes FULL conversation history to Claude
COMPLETE CONVERSATION HISTORY (This shows what the user wants):
${conversationHistory.map((msg: any, idx: number) => {
  const role = msg.role === 'user' ? 'USER' : 'NIV'
  const content = msg.content || ''
  // Show full content for user messages
  const displayContent = role === 'USER' ? content : content.substring(0, 1000)
  return `\n[${role}]: ${displayContent}`
}).join('\n')}

USER'S CURRENT REQUEST: ${userQuery}
```

**What this does**: Claude sees the ENTIRE conversation, not just the last message. It understands follow-ups like "now create an image for that" because it knows what "that" refers to.

### ❌ NIV Content (Current)
```typescript
// Lines 715-717: Only sends last 3 messages, truncated
const recentContext = conversationHistory.slice(-3).map(msg =>
  `${msg.role === 'user' ? 'User' : 'Me'}: ${msg.content.substring(0, 100)}`
).join('\n')
```

**Problem**: Only 100 characters from last 3 messages. No full context. Can't understand complex requests or follow-ups.

**FIX NEEDED**:
```typescript
// Send FULL conversation history like Strategic does
COMPLETE CONVERSATION HISTORY:
${conversationHistory.map((msg, idx) => {
  const role = msg.role === 'user' ? 'USER' : 'NIV'
  return `[${role}]: ${msg.content}` // Full content, not truncated
}).join('\n')}
```

---

## 2. USER PREFERENCE EXTRACTION

### ✅ NIV Strategic Framework
```typescript
// Lines 275-330: Extracts user preferences from conversation
function extractUserPreferencesFromConversation(conversationHistory: any[]): any {
  const preferences = {
    wants: [] as string[],
    doesNotWant: [] as string[],
    constraints: [] as string[],
    examples: [] as string[]
  }

  conversationHistory.forEach((msg: any) => {
    const content = msg.content?.toLowerCase() || ''

    // Extract wants
    if (content.includes('i want') || content.includes('we need')) {
      const wantMatch = content.match(/(?:i want|we need|looking for)\s+([^.!?]+)/i)
      if (wantMatch) preferences.wants.push(wantMatch[1].trim())
    }

    // Extract doesn't wants
    if (content.includes("don't want") || content.includes('avoid')) {
      const dontWantMatch = content.match(/(?:don't want|avoid)\s+([^.!?]+)/i)
      if (dontWantMatch) preferences.doesNotWant.push(dontWantMatch[1].trim())
    }

    // Extract constraints
    if (content.includes('must') || content.includes('requirement')) {
      const constraintMatch = content.match(/(?:must|requirement is)\s+([^.!?]+)/i)
      if (constraintMatch) preferences.constraints.push(constraintMatch[1].trim())
    }
  })

  return preferences
}
```

**What this does**: Builds a profile of what the user wants/doesn't want across the ENTIRE conversation. This gets passed to Claude so it remembers "no competitor attacks" or "must be authentic" from 10 messages ago.

### ❌ NIV Content (Current)
```typescript
// MISSING COMPLETELY
// No preference extraction at all
```

**FIX NEEDED**: Add `extractUserPreferencesFromConversation()` function and pass to Claude:
```typescript
USER PREFERENCES FROM CONVERSATION:
- Wants: ${preferences.wants.join(', ')}
- Does NOT want: ${preferences.doesNotWant.join(', ')}
- Constraints: ${preferences.constraints.join(', ')}
- Examples: ${preferences.examples.join(', ')}
```

---

## 3. DISCOVERY CONTEXT BUILDING

### ✅ NIV Strategic Framework
```typescript
// Lines 193-272: Builds rich discovery context
const discoveryContext = await generateDiscoveryContext(
  organizationContext,
  research,
  conversationHistory
)

// Returns structured context:
{
  organization: {
    id, name, industry, positioning, strengths, vulnerabilities, currentNarratives
  },
  competitors: {
    direct: [], indirect: [], emerging: []
  },
  market: {
    trends: [], opportunities: [], threats: [], regulatory: []
  },
  assets: {
    narratives: [], keyMessages: [], channels: [], stakeholders: []
  },
  history: {
    recentCampaigns: [], successPatterns: [], lessonsLearned: []
  },
  session: {
    conversationId,
    userIntent,
    previousDecisions,
    constraints,
    conversationHistory,
    userPreferences: { wants, doesNotWant, constraints, examples },
    timestamp
  }
}
```

**What this does**: Creates a comprehensive strategic context about the organization, market, and conversation. This is what makes NIV "aware" of the bigger picture.

### ❌ NIV Content (Current)
```typescript
// Lines 621-626: Minimal context
const enhancedContext = {
  ...context,
  understanding: storedUnderstanding,
  research: storedResearch || {},
  event: storedUnderstanding.topic,
  extractedRequirements: storedUnderstanding.requirements
}
```

**Problem**: Only basic fields. No organization profile, no market context, no user preferences.

**FIX NEEDED**: Build discovery context like Strategic:
```typescript
const discoveryContext = {
  organization: {
    id: organization.id,
    name: organization.name,
    industry: organization.industry,
    positioning: organization.positioning,
    strengths: organization.strengths || [],
    currentNarratives: organization.narratives || []
  },
  session: {
    conversationHistory: conversationHistory,
    userPreferences: extractUserPreferencesFromConversation(conversationHistory),
    userIntent: extractUserIntent(conversationHistory),
    previousDecisions: extractDecisions(conversationHistory),
    constraints: extractConstraints(conversationHistory)
  },
  market: extractMarketEnvironment(research),
  competitors: extractCompetitors(research)
}
```

---

## 4. STRUCTURED CLAUDE PROMPTS

### ✅ NIV Strategic Framework
```typescript
// Lines 360-538: MASSIVE, detailed Claude prompt
content: `Analyze the conversation history and research to create a strategic framework.

COMPLETE CONVERSATION HISTORY (This shows what the user wants):
${fullConversationHistory}

USER'S CURRENT REQUEST: ${userQuery}

USER PREFERENCES FROM CONVERSATION:
- Wants: ${discoveryContext.session.userPreferences.wants.join(', ')}
- Does NOT want: ${discoveryContext.session.userPreferences.doesNotWant.join(', ')}
- Constraints: ${discoveryContext.session.userPreferences.constraints.join(', ')}

RESEARCH DATA PROVIDED:
- Articles: ${research.articles.length} articles
- Key Findings: ${research.keyFindings.length} findings
- Synthesis: ${research.synthesis.length} synthesis items

KEY ARTICLE TITLES:
${research.articles.slice(0, 5).map(a => `- ${a.title}`).join('\n')}

KEY FINDINGS FROM RESEARCH:
${research.keyFindings.slice(0, 10).map(f => `- ${f}`).join('\n')}

SYNTHESIS INSIGHTS:
${research.synthesis.slice(0, 2).join('\n\n')}

ORGANIZATION CONTEXT:
- Name: ${discoveryContext.organization.name}
- Industry: ${discoveryContext.organization.industry}
- Positioning: ${discoveryContext.organization.positioning}

CRITICAL FRAMEWORK GENERATION INSTRUCTIONS:

1. UNDERSTAND THE USER'S ACTUAL GOAL:
   - Read the ENTIRE conversation to understand what campaign they want
   - Identify the specific problem they're trying to solve
   - Note any constraints or things they explicitly don't want

2. CREATE A REAL STRATEGY (not a summary):
   - The objective should be MEASURABLE and TIME-BOUND
   - Example: "Achieve 30% share of voice in EdTech media by March 2025"
   - NOT: "Enhance our position in the market"

3. DESIGN EXECUTABLE TACTICS:
   - Media Outreach: Name specific publications
   - Content: Specific pieces with real titles
   - Stakeholder: Named targets with actual actions

4. EXTRACT REAL INTELLIGENCE:
   - Pull ACTUAL findings from the research articles
   - Quote specific competitor moves mentioned in articles
   - Identify concrete opportunities from the data
`
```

**What this does**: Gives Claude EVERYTHING it needs to make intelligent decisions. It's not guessing - it has full context.

### ❌ NIV Content (Current)
```typescript
// Lines 730-742: Vague, minimal prompt
content: `You are NIV, a strategic PR consultant in an ongoing conversation.

RECENT CONVERSATION:
${recentContext} // Only last 3 messages, truncated

USER'S CURRENT REQUEST: "${message}"

Acknowledge their request professionally and briefly explain what you'll do next.
- If they're asking for follow-up content, reference what you just created
- If it's a new request, acknowledge it fresh

Format: "I understand you want [what they want]. Let me [what you'll do first]."`
```

**Problem**:
- No research data shown to Claude
- No organization context
- No user preferences
- No detailed instructions
- Generic, not specific

**FIX NEEDED**: Create detailed prompts like Strategic with:
- Full conversation history
- User preferences extracted
- Organization profile
- Research data snippets
- Specific instructions for content type
- Examples of good vs bad outputs

---

## 5. INTELLIGENT TYPE DETECTION

### ✅ NIV Strategic Framework
```typescript
// Lines 721-746: Extracts user intent from conversation
function extractUserIntent(history: any[]): string {
  if (!history || history.length === 0) return 'General strategic planning'
  const lastMessage = history[history.length - 1]
  return lastMessage?.content?.substring(0, 200) || 'Strategic planning'
}

// Lines 764-781: Auto-detects target component
function detectTargetComponent(query: string): 'campaign' | 'plan' | 'execute' | 'opportunity' {
  const queryLower = query.toLowerCase()

  if (queryLower.includes('campaign') || queryLower.includes('launch')) return 'campaign'
  if (queryLower.includes('plan') || queryLower.includes('timeline')) return 'plan'
  if (queryLower.includes('content') || queryLower.includes('write')) return 'execute'
  if (queryLower.includes('opportunity') || queryLower.includes('respond')) return 'opportunity'

  return 'campaign'
}
```

**What this does**: Automatically detects user intent and routes to the right component. The user doesn't have to explicitly say "content" or "campaign" - NIV figures it out.

### ❌ NIV Content (Current)
```typescript
// Lines 697: Simple extraction
const targetType = contentType || extractContentType(message)

if (!targetType) {
  return { error: 'No content type specified' }
}
```

**Problem**: If type isn't found, it errors out. Doesn't intelligently detect from conversation context.

**FIX NEEDED**: Add intelligent detection:
```typescript
function detectContentTypeFromIntent(message: string, conversationHistory: any[]): string {
  // Check conversation for context
  const recentContent = conversationHistory.slice(-5).map(m => m.content).join(' ')
  const combined = `${recentContent} ${message}`.toLowerCase()

  // Intelligent detection
  if (combined.includes('image') || combined.includes('visual') || combined.includes('picture')) {
    return 'image'
  }
  if (combined.includes('post') && combined.includes('social')) {
    return 'social-post'
  }
  if (combined.includes('article') || combined.includes('thought leadership')) {
    return 'thought-leadership'
  }

  // Ask Claude to detect
  return await askClaudeToDetectType(combined)
}
```

---

## 6. RESEARCH INTEGRATION

### ✅ NIV Strategic Framework
```typescript
// Lines 386-405: Shows research data to Claude
RESEARCH DATA PROVIDED:
- Articles: ${research.articles.length} articles
- Key Findings: ${research.keyFindings.length} findings
- Synthesis: ${research.synthesis.length} synthesis items

KEY ARTICLE TITLES:
${research.articles.slice(0, 5).map(a => `- ${a.title}`).join('\n')}

KEY FINDINGS FROM RESEARCH:
${research.keyFindings.slice(0, 10).map(f => `- ${f}`).join('\n')}

SYNTHESIS INSIGHTS:
${research.synthesis.slice(0, 2).join('\n\n')}

OPPORTUNITIES IDENTIFIED:
${research.insights.opportunities.slice(0, 5).map(o => `- ${o}`).join('\n')}

RISKS IDENTIFIED:
${research.insights.risks.slice(0, 5).map(r => `- ${r}`).join('\n')}
```

**What this does**: Claude sees actual research findings, not just "we did research". It can reference specific articles, quote findings, and ground its strategy in real data.

### ❌ NIV Content (Current)
```typescript
// Lines 820-850: Calls Fireplexity but doesn't show results to Claude properly
for (const gap of knowledgeGaps) {
  const research = await callFireplexity(gap.query, context)
  researchResults[gap.area] = research
}

// Then later just passes research object without showing actual content
```

**Problem**: Research happens but Claude doesn't see the actual findings in its prompt. It's like doing homework but not looking at the answers.

**FIX NEEDED**: Show research to Claude:
```typescript
// After getting research
RESEARCH FINDINGS:
${Object.entries(researchResults).map(([area, data]) => `
## ${area}
${data.keyFindings?.slice(0, 5).map(f => `- ${f}`).join('\n')}

Top Articles:
${data.articles?.slice(0, 3).map(a => `- ${a.title}: ${a.summary}`).join('\n')}
`).join('\n')}
```

---

## 7. STATE MANAGEMENT

### ✅ NIV Strategic Framework
**Frontend: NivChatbot.tsx (Lines 84-88)**
```typescript
// Passes last 5 messages as context
const conversationHistory = messages.slice(-5).map(msg => ({
  role: msg.role,
  content: msg.content
}))
```

**Backend: index.ts (Lines 97-103)**
```typescript
const {
  research,
  userQuery,
  organizationContext,
  conversationHistory,  // ← Receives full history
  targetComponent
} = await req.json()
```

**What this does**: Frontend sends history, backend uses it. State persists across conversation.

### ❌ NIV Content (Current)
**Frontend: NIVContentOrchestratorSimplified.tsx (Lines 130-136)**
```typescript
conversationHistory: messages.slice(-10).map(msg => ({
  role: msg.role,
  content: typeof msg.content === 'string' ? msg.content : msg.content?.text || '',
  strategy: msg.strategy,
  understanding: storedUnderstanding,  // ← Always same stored understanding
  research: storedResearch              // ← Always same stored research
}))
```

**Problem**: Sends same `storedUnderstanding` and `storedResearch` with every message. Doesn't update as conversation evolves. It's stuck in the first analysis.

**FIX NEEDED**: Update understanding as conversation progresses:
```typescript
conversationHistory: messages.slice(-10).map(msg => ({
  role: msg.role,
  content: msg.content,
  understanding: msg.understanding,  // ← Each message has its own understanding
  research: msg.research,            // ← Each message has its own research context
  timestamp: msg.timestamp
}))
```

---

## 8. RESPONSE HANDLING (ORCHESTRATION AWARENESS)

### ✅ NIV Strategic Framework
```typescript
// Lines 170-176: Returns complete package
return new Response(JSON.stringify({
  success: true,
  framework: validatedFramework,  // Complete strategic framework
  discovery: discoveryContext,    // Full context used
  readyForHandoff: true           // Signal for next component
}))

// Lines 656-669: Has orchestration section
orchestration: {
  next_components: ['media', 'content', 'campaign'],
  workflow_type: 'execution',
  dependencies: ['Legal review', 'Student testimonials'],
  success_criteria: ['25+ media stories', '100K+ engagement']
}
```

**What this does**: Knows what should happen next. It's self-aware about the workflow and can hand off to other components intelligently.

### ❌ NIV Content (Current)
```typescript
// Lines 684-693: Returns content but no orchestration
return new Response(JSON.stringify({
  success: true,
  mode: 'multi-content',
  message: `Generated ${allContent.length} content pieces for you!`,
  content: allContent,
  deliverables: deliverables.map(d => d.replace('-', ' '))
}))
```

**Problem**: Just returns content. No awareness of "what next?". Doesn't know if it should route to social scheduler, send to approval, create follow-up tasks, etc.

**FIX NEEDED**: Add orchestration awareness:
```typescript
return new Response(JSON.stringify({
  success: true,
  mode: 'content-generated',
  content: allContent,
  orchestration: {
    next_steps: [
      'Schedule social posts via Social Intelligence',
      'Send press release to Media Targets',
      'Create approval workflow for executive statement'
    ],
    suggested_components: ['social-scheduler', 'media-distribution'],
    workflow_type: 'content-execution',
    requires_approval: contentType === 'press-release' || contentType === 'executive-statement',
    distribution_ready: true
  },
  metadata: {
    contentTypes: allContent.map(c => c.type),
    totalPieces: allContent.length,
    generatedAt: new Date().toISOString()
  }
}))
```

---

## SUMMARY: WHAT NIV CONTENT NEEDS TO BECOME SELF-AWARE

### 1. **Full Conversation Context** (CRITICAL)
   - Send ALL messages to Claude, not just last 3
   - Don't truncate to 100 characters
   - Show full user messages, truncate only assistant messages if needed

### 2. **User Preference Extraction**
   - Extract wants/doesn't want/constraints from conversation
   - Pass to Claude so it remembers user requirements
   - Build user profile across conversation

### 3. **Discovery Context Building**
   - Organization profile
   - Market context
   - Competitor intelligence
   - Strategic assets
   - User preferences
   - Session state

### 4. **Rich Claude Prompts**
   - Show research findings
   - Show organization context
   - Show user preferences
   - Give specific instructions
   - Provide examples

### 5. **Intelligent Type Detection**
   - Don't just error when type not found
   - Detect from conversation context
   - Ask Claude to infer intent
   - Auto-route to right content type

### 6. **Research Integration**
   - Show actual research findings to Claude
   - Include article titles, key findings, synthesis
   - Ground content in real data

### 7. **Evolving State Management**
   - Each message has its own understanding
   - Each message has its own research context
   - Don't reuse first understanding forever

### 8. **Orchestration Awareness**
   - Know what should happen next
   - Suggest follow-up actions
   - Route to appropriate components
   - Signal approval needs
   - Indicate distribution readiness

---

## IMPLEMENTATION PRIORITY

1. **IMMEDIATE (Critical for basic awareness)**:
   - Full conversation history to Claude (not truncated)
   - User preference extraction
   - Show research findings in prompts

2. **HIGH (Makes it intelligent)**:
   - Discovery context building
   - Rich Claude prompts with examples
   - Intelligent type detection

3. **MEDIUM (Makes it orchestrator-aware)**:
   - Evolving state management
   - Orchestration section in responses
   - Next-step suggestions

4. **NICE TO HAVE (Polish)**:
   - Success criteria tracking
   - Dependency detection
   - Approval workflow intelligence
