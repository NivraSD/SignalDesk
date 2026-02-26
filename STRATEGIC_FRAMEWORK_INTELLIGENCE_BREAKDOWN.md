# Strategic Framework Intelligence - Line by Line Analysis

## THE CORE INTELLIGENCE MECHANISM

Strategic Framework is NOT just executing functions. Here's what ACTUALLY makes it intelligent:

---

## 1. IT RECEIVES RESEARCH FIRST (Lines 97-103)

```typescript
const {
  research,           // ← CRITICAL: Already has intelligence
  userQuery,
  organizationContext,
  conversationHistory,
  targetComponent
} = await req.json()
```

**KEY INSIGHT**: Strategic Framework is called AFTER research is done. It receives:
- Research articles
- Key findings
- Synthesis
- Opportunities/risks

**This means the CALLER (NIV Orchestrator) did research BEFORE calling Strategic Framework.**

---

## 2. IT EXTRACTS INTELLIGENCE FROM CONVERSATION (Lines 200-330)

```typescript
// Line 201: Extract preferences from conversation
const extractedPreferences = extractUserPreferencesFromConversation(conversationHistory)

// Lines 287-320: REGEX EXTRACTION from conversation
if (content.includes('i want') || content.includes('we need')) {
  const wantMatch = content.match(/(?:i want|we need|looking for)\s+([^.!?]+)/i)
  if (wantMatch) {
    preferences.wants.push(wantMatch[1].trim())
  }
}
```

**KEY INSIGHT**: Before talking to Claude, it READS the conversation and extracts:
- What user wants
- What user doesn't want
- Constraints
- Examples

**This preprocessing INFORMS Claude about user preferences.**

---

## 3. IT BUILDS DISCOVERY CONTEXT (Lines 193-272)

```typescript
const organization = {
  id: organizationContext?.organizationId || 'default',
  name: organizationContext?.organizationName || 'Organization',
  industry: organizationContext?.industry || 'technology',
  positioning: organizationContext?.positioning || 'Industry leader',
  strengths: organizationContext?.strengths || [],
  vulnerabilities: organizationContext?.vulnerabilities || [],
  currentNarratives: organizationContext?.narratives || []
}

const competitors = extractCompetitors(research)
const market = extractMarketEnvironment(research)

const session = {
  conversationId: organizationContext?.conversationId || generateId(),
  userIntent: extractUserIntent(conversationHistory),
  previousDecisions: extractDecisions(conversationHistory),
  constraints: extractConstraints(conversationHistory),
  conversationHistory: conversationHistory || [],
  userPreferences: extractedPreferences,
  timestamp: new Date().toISOString()
}
```

**KEY INSIGHT**: It builds a COMPLETE picture of:
- Organization profile
- Competitive landscape
- Market environment
- User session context
- Extracted preferences

**This context is what makes Claude intelligent - it has the FULL picture.**

---

## 4. THE MASSIVE CLAUDE PROMPT (Lines 360-538)

### Part A: Shows FULL Conversation (Lines 362-376)

```typescript
COMPLETE CONVERSATION HISTORY (This shows what the user wants):
${conversationHistory.map((msg: any, idx: number) => {
  const role = msg.role === 'user' ? 'USER' : 'NIV'
  const content = msg.content || ''
  const displayContent = role === 'USER' ? content : content.substring(0, 1000)
  return `\n[${role}]: ${displayContent}`
}).join('\n')}
```

**Shows ALL user messages in FULL** - not truncated

### Part B: Shows Extracted Preferences (Lines 380-384)

```typescript
USER PREFERENCES FROM CONVERSATION:
- Wants: ${discoveryContext?.session?.userPreferences?.wants?.join(', ')}
- Does NOT want: ${discoveryContext?.session?.userPreferences?.doesNotWant?.join(', ')}
- Constraints: ${discoveryContext?.session?.userPreferences?.constraints?.join(', ')}
- Examples provided: ${discoveryContext?.session?.userPreferences?.examples?.length || 0}
```

**Highlights what was extracted** - Claude sees both raw conversation AND interpreted preferences

### Part C: Shows Research Data (Lines 386-405)

```typescript
RESEARCH DATA PROVIDED:
- Articles: ${research?.articles?.length || 0} articles
- Key Findings: ${research?.keyFindings?.length || 0} findings

KEY ARTICLE TITLES:
${research?.articles?.slice(0, 5).map((a: any) => `- ${a.title}`).join('\n')}

KEY FINDINGS FROM RESEARCH:
${research?.keyFindings?.slice(0, 10).map((f: string) => `- ${f}`).join('\n')}

SYNTHESIS INSIGHTS:
${research?.synthesis?.slice(0, 2).join('\n\n')}

OPPORTUNITIES IDENTIFIED:
${research?.insights?.opportunities?.slice(0, 5).map((o: string) => `- ${o}`).join('\n')}
```

**Shows ACTUAL research content** - not just "we did research", but the actual findings

### Part D: Critical Instructions (Lines 412-437)

```typescript
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
```

**TELLS CLAUDE HOW TO THINK** - explicit instructions on what "understanding" means

### Part E: Examples (Lines 439-537)

```typescript
Generate a complete strategic framework in JSON format. Here's the EXACT structure with EXAMPLES:
{
  "strategy": {
    "objective": "Establish OpenAI as the #1 trusted AI for education by achieving 40% market share among college students by Q2 2025",
    ...
  },
  "tactics": {
    "campaign_elements": {
      "media_outreach": [
        "Exclusive to TechCrunch on Study Mode 2.0 launch with usage data",
        "Education Week feature on AI transforming homework with teacher interviews"
      ]
    }
  }
}
```

**SHOWS EXAMPLES of good vs bad** - teaches Claude what quality looks like

---

## 5. VALIDATION & ENHANCEMENT (Lines 572-699)

```typescript
function validateAndEnhanceFramework(framework: any, discoveryContext: any): any {
  if (!framework.discoveryContext) {
    framework.discoveryContext = discoveryContext
  }

  // Ensures all required fields exist
  if (!framework.strategy?.objective) {
    framework.strategy = {
      ...framework.strategy,
      objective: 'Strategic objective to be defined',
      rationale: 'Based on market analysis and opportunities'
    }
  }

  // ... validates every section
}
```

**ADDS FALLBACKS** - ensures framework is always complete even if Claude misses something

---

## WHAT NIV CONTENT IS MISSING:

### ❌ No Pre-Processing
NIV Content doesn't extract preferences, build discovery context, or analyze conversation BEFORE calling Claude

### ❌ No Research Integration
NIV Content calls niv-fireplexity but doesn't SHOW the findings to Claude in the prompt

### ❌ No Instructions on How to Think
NIV Content doesn't tell Claude "UNDERSTAND THE USER'S ACTUAL GOAL" - it just asks generic questions

### ❌ No Examples
NIV Content doesn't show Claude what good looks like

### ❌ No Context Building
NIV Content doesn't build organization profile, market environment, competitive landscape

---

## THE INTELLIGENCE FLOW IN STRATEGIC FRAMEWORK:

```
1. RECEIVE (research already done by caller)
   ↓
2. EXTRACT (preferences from conversation via regex)
   ↓
3. BUILD CONTEXT (org, market, competitors, session)
   ↓
4. SHOW CLAUDE EVERYTHING:
   - Full conversation
   - Extracted preferences
   - Research findings (actual content)
   - Organization context
   - Instructions on HOW to think
   - Examples of quality
   ↓
5. CLAUDE GENERATES (with all context)
   ↓
6. VALIDATE (ensure completeness)
   ↓
7. RETURN (framework + context)
```

---

## WHAT NIV CONTENT SHOULD DO:

### When user says: "I want to create a media plan to support the launch of Sora 2"

**STEP 1: EXTRACT INFORMATION (before asking Claude anything)**

```typescript
const extractedInfo = {
  contentType: 'media plan',
  subject: 'Sora 2',
  context: 'launch',
  purpose: 'support the launch',
  organization: 'OpenAI' (inferred from context),
  product: 'Sora 2' (video AI tool)
}
```

**STEP 2: ASK CLAUDE TO ANALYZE WHAT'S MISSING**

```typescript
const analysis = await analyzeWithClaude(`
User said: "I want to create a media plan to support the launch of Sora 2"

EXTRACTED INFORMATION:
- Content type: media plan
- Product: Sora 2
- Purpose: launch support
- Organization: OpenAI
- Industry: AI/Technology

WHAT WE KNOW:
- Sora is OpenAI's video generation AI
- This is a product launch
- They want a complete media plan

WHAT'S MISSING:
- Launch date/timeline
- Target audience (consumers? creators? businesses?)
- Specific goals (awareness? signups? market position?)
- Key differentiation points

DECISION:
- Do I need to ask questions? YES
- Which SPECIFIC questions? [list 3-4 targeted questions]
- Can I start research now? YES - research AI video market landscape

Return JSON:
{
  "understood": {what we extracted},
  "missing": {what's genuinely missing},
  "questionsToAsk": [specific questions],
  "canStartResearch": true/false,
  "researchQuery": "specific research query"
}
`)
```

**STEP 3: RESPOND INTELLIGENTLY**

```
"Got it - a media plan for the Sora 2 launch. Let me ask a few specific questions
while I research the AI video landscape:

1. What's your target launch date?
2. Primary audience - consumers, creators, or businesses?
3. Main goal - awareness, signups, or market positioning?

I'm researching the current AI video market while you answer..."

[Starts niv-fireplexity research in parallel]
```

---

## THE MISSING INTELLIGENCE:

**Current NIV Content**:
- Sees "media plan" → execute phase 1
- Doesn't READ what user said about Sora 2
- Asks generic questions

**What it SHOULD do**:
- Extract info from message
- Ask Claude "what's missing?"
- Ask SPECIFIC questions based on what's actually missing
- Start research in parallel

**The intelligence is in the PREPROCESSING and ANALYSIS, not just executing phases.**

---

## KEY TAKEAWAY:

Strategic Framework works because:
1. **Research happens FIRST** (before framework generation)
2. **Conversation is ANALYZED** (extract preferences via regex)
3. **Context is BUILT** (org, market, competitors, session)
4. **Claude gets EVERYTHING** (full conversation, research findings, context, instructions, examples)
5. **Claude is told HOW TO THINK** ("UNDERSTAND THE USER'S ACTUAL GOAL")
6. **Validation ensures completeness**

NIV Content needs to do the SAME preprocessing, context building, and intelligent analysis BEFORE asking questions or generating content.
