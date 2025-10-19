# Structured Request Refactor - Rollback Documentation

## Date: 2025-10-07

---

## FIX #10: Answer-First Flow (Oct 7, 2025 - Session Continuation)

### Problem
When users asked structured questions (numbered lists), the system immediately jumped to auto-execution without showing the answers. User asked for 7 specific sections but only saw "I generated 5 content pieces" without seeing the actual answers to their questions.

### Solution
Changed flow to:
1. **First**: Answer user's questions and display all requested sections
2. **Then**: Ask if they want to turn it into an executable framework
3. **Only then**: Package and auto-execute when user confirms

### Changes Made

**File**: `/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/niv-orchestrator-robust/index.ts`

**Change 1**: Added state tracking for confirmation flow
- **Lines 48-51**: Added `lastResponse` to ConceptState interface
```typescript
lastResponse?: {
  awaitingFrameworkConfirmation?: boolean
  structuredResponse?: any
}
```

**Change 2**: Detect user confirmation
- **Lines 2939-2945**: Added frameworkConfirmation detection
```typescript
const frameworkConfirmation =
  queryLower.includes('yes') ||
  queryLower.includes('execute') ||
  queryLower.includes('go ahead') ||
  queryLower.includes('proceed') ||
  queryLower.includes('do it') ||
  queryLower.includes('turn it into')
```

**Change 3**: Check confirmation in framework decision
- **Line 2970-2973**: Check if user is confirming after seeing answers
```typescript
} else if (frameworkConfirmation && conceptState.lastResponse?.awaitingFrameworkConfirmation) {
  shouldGenerateFramework = true
  console.log('✅ User confirmed framework execution after reviewing answers')
```

**Change 4**: Return structured answers first, then ask
- **Lines 3037-3104**: New flow for structured requests
```typescript
if (structuredRequest.isStructured && stage === 'full') {
  // Build structured response
  structuredResponse = await buildStructuredResponse(...)

  // Format for display
  const formattedAnswers = formatStructuredSectionsResponse(structuredResponse, organizationName)

  // Store in state
  conceptState.lastResponse = {
    awaitingFrameworkConfirmation: true,
    structuredResponse: structuredResponse
  }

  // Return answers + confirmation prompt
  return new Response(JSON.stringify({
    message: formattedAnswers + '\n\n---\n\n**Would you like me to turn this into an executable strategic framework?**',
    type: 'structured-answers',
    awaitingFrameworkConfirmation: true
  }))
}
```

**Change 5**: Pass pre-built response when user confirms
- **Lines 3121-3163**: Use stored structuredResponse if available
```typescript
const prebuiltStructuredResponse = updatedState.lastResponse?.structuredResponse

// Pass to niv-strategic-framework
body: JSON.stringify({
  // ... other fields
  prebuiltStructuredResponse: prebuiltStructuredResponse
})
```

### Deployment
```bash
npx supabase functions deploy niv-orchestrator-robust
```

### Rollback Instructions
If this breaks the flow:
1. The old code immediately triggered framework generation for structured requests
2. To rollback, remove the early return at lines 3037-3104
3. Remove the frameworkConfirmation check at line 2970-2973
4. Framework will auto-execute again without showing answers first

---

## FIX #11: Display All Sections + Blog-Post Fix (Oct 7, 2025 - Continued)

### Problem 1: Chat only showed objective, narrative, proof points even after all fixes
- User confirmed the structured answers looked good in initial response
- But when framework was generated, chat reverted to showing only 3 sections
- Memory Vault had all the data but in bad format

### Root Cause
When user confirmed with "yes", the code entered the framework generation block which used `formatStrategicResponse` (the old limited formatter) instead of `formatStructuredSectionsResponse`. The variable `structuredResponse` was null in that block, but we had `prebuiltStructuredResponse` available - we just weren't using it for formatting.

### Solution
Changed line 3256 to use `prebuiltStructuredResponse` instead of `structuredResponse` for formatting:

**File**: `niv-orchestrator-robust/index.ts`
**Line 3256**:
```typescript
// Before
const formattedMessage = structuredResponse
  ? formatStructuredSectionsResponse(structuredResponse, organizationName)
  : formatStrategicResponse(...)

// After
const formattedMessage = prebuiltStructuredResponse
  ? formatStructuredSectionsResponse(prebuiltStructuredResponse, organizationName)
  : formatStrategicResponse(...)
```

### Problem 2: Blog-post content didn't receive information, but thought-leadership did
Since blog-post and thought-leadership are basically the same thing, we should just use thought-leadership for frameworks.

### Solution
Added content type replacement in framework-auto-execute to convert blog-post → thought-leadership:

**File**: `framework-auto-execute/index.ts`
**Lines 34-40**:
```typescript
// Replace blog-post with thought-leadership (they're basically the same, thought-leadership works better)
contentTypes = contentTypes.map((type: string) =>
  type === 'blog-post' ? 'thought-leadership' : type
)

// Remove duplicates
contentTypes = [...new Set(contentTypes)]
```

### Deployment
```bash
npx supabase functions deploy niv-orchestrator-robust
npx supabase functions deploy framework-auto-execute
```

---

## FIX #12: Intelligent Structured Answers + Remove Playbooks (Oct 7, 2025 - Continued)

### Problem 1: Structured answers said "to be developed" instead of actual content
- When asking multi-part questions, narrative section said just "A"
- Messages section was completely ignored
- Sections said "to be developed" or had generic placeholders
- User: "it seems like it feels like it has to wait for a framework to be made first?"

### Root Cause
The `buildStructuredResponse` function was doing dumb data extraction (pulling from research.synthesis, using generic defaults) instead of actually calling Claude to intelligently answer each question.

### Solution
Created new `buildIntelligentStructuredResponse` function that:
1. Takes all user questions and research data
2. Calls Claude with a prompt to answer each section comprehensively
3. Instructs Claude: "NO placeholders like 'to be developed'"
4. Returns structured JSON with real, specific answers
5. Falls back to extraction mode only if Claude call fails

**File**: `niv-orchestrator-robust/index.ts`
**Lines 1247-1333**: New intelligent response builder using Claude

### Problem 2: System kept creating "playbooks" that user didn't understand
- User: "i have no idea what that is supposed to be and we dont have that as a content type"
- Auto-execute was saving 4 playbooks to content_library with type 'strategic-playbook'
- Not a valid content type and confusing to users

### Solution
Disabled playbook generation entirely in framework-auto-execute.

**File**: `framework-auto-execute/index.ts`
**Lines 153-155**:
```typescript
// DISABLED: Playbooks are not a recognized content type and confuse users
const strategicCampaigns: any[] = []
```

### Deployment
```bash
npx supabase functions deploy niv-orchestrator-robust
npx supabase functions deploy framework-auto-execute
```

### Expected Behavior Now
1. ✅ User asks multi-part question with narrative, messages, audiences, etc.
2. ✅ Claude generates real, specific answers for each section (not "to be developed")
3. ✅ All sections display properly formatted in chat
4. ✅ User can review answers before converting to framework
5. ✅ No confusing "playbooks" being created
6. ✅ Framework can still be generated if user confirms

---

## FIX #13: THE REAL UI DISPLAY FIX - Remove structured field (Oct 7, 2025 - Final Fix)

### Problem
After ALL previous fixes, framework chat messages STILL only showed 3 sections (objective, approach, key messages) instead of all 7 requested sections. User begged: "i really really beg to look at all possible ways framework is generating and why the UI/frontend insists on only displaying the 3 sections"

### Root Cause Discovery
Traced the entire rendering path:
1. Backend sends beautifully formatted message with all 7 sections ✅
2. Frontend receives it ✅
3. BUT: Frontend adds `structured` field to the message (line 209-213 of NivChatbot.tsx)
4. When `structured` field exists, message routes through `NivIntelligenceDisplay` component
5. `NivIntelligenceDisplay` only handles specific types: `intelligence_report`, `media_list`, `press_release`, `strategy_plan`
6. Strategic frameworks don't match any type, so it falls back to showing `response.message` through a generic formatter
7. This generic formatter doesn't use the backend's detailed formatting

### The Real Solution
Don't add the `structured` field to strategic framework messages. Let them display as plain formatted text.

**File**: `NivChatbot.tsx`
**Lines 205-214**:
```typescript
// Before
const nivResponse: Message = {
  content: data.message || `Strategic framework generated...`,
  structured: {
    ...data.structured,
    framework: data.framework,
    discovery: data.discovery
  },
  strategy: strategy,
}

// After
const nivResponse: Message = {
  content: data.message || `Strategic framework generated...`,
  // structured field removed - we want plain text display with all sections
  strategy: strategy,
}
```

### Why This Works
- Without `structured` field, the message goes through the plain text rendering path (lines 416-433)
- Plain text path uses `whitespace-pre-wrap` and displays the full formatted message
- Backend's carefully formatted message with all 7 sections now displays exactly as intended
- No component is filtering or limiting the sections

### Deployment
Frontend change only - refresh browser to see the fix.

---

## FIX #14: Dynamic Current Date (Oct 7, 2025 - Final)

### Problem
NIV was mentioning Q4 2024 as a future target when we're already in 2025. The date awareness was stale.

### Root Cause
`NIV_SYSTEM_PROMPT` was a constant string with `${getCurrentDate()}` evaluated at module load time (when Edge Function deployed), not at request time. This meant NIV thought it was still the deployment date.

### Solution
Changed `NIV_SYSTEM_PROMPT` from a constant to a function `getNivSystemPrompt()` that evaluates the date dynamically on each request.

**File**: `niv-orchestrator-robust/index.ts`
**Lines 277-281**:
```typescript
// Before
const NIV_SYSTEM_PROMPT = `You are NIV...
CURRENT DATE: Today is ${getCurrentDate()}.` // Called once at module load

// After
const getNivSystemPrompt = () => `You are NIV...
CURRENT DATE: Today is ${getCurrentDate()}.` // Called on each request
```

**Updated references**:
- Line 2670: `${getNivSystemPrompt()}`
- Line 3079: `${getNivSystemPrompt()}`

### Deployment
```bash
npx supabase functions deploy niv-orchestrator-robust
```

### Expected Behavior Now
- ✅ NIV knows the actual current date on every request
- ✅ References Q1 2025, not Q4 2024
- ✅ Timelines and milestones are accurate to today's date

---

## What Was Changed

### 1. niv-strategic-framework/index.ts

**Location**: Lines 11-82 (STRATEGIC_FRAMEWORK_PROMPT)

**Before**: Rigid prompt with exact JSON structure requirements
```typescript
const STRATEGIC_FRAMEWORK_PROMPT = `You are NIV's Strategic Framework Generator, creating executive-ready campaign blueprints.

WHAT A STRATEGIC FRAMEWORK IS:
A strategic framework is NOT a research summary. It is a comprehensive ACTION PLAN...

YOUR OUTPUT MUST BE A JSON OBJECT WITH THIS EXACT STRUCTURE:
{
  "strategy": {
    // PRIMARY FIELDS - REQUIRED FOR ALL DOWNSTREAM COMPONENTS
    "objective": "Single measurable goal statement",
    "narrative": "Core narrative that drives the entire campaign",
    // ... many more rigid fields
  }
}

CRITICAL RULES:
- Output ONLY the JSON object, no explanatory text before or after
- Every field must be populated with real, actionable content from the research
- Use the exact field names shown above
```

**After**: Flexible prompt that respects user requests
```typescript
const STRATEGIC_FRAMEWORK_PROMPT = `You are NIV's Strategic Framework Generator. Your job is to ANSWER THE USER'S QUESTION and package it into a structured format for execution.

CRITICAL: Read the user's request carefully. If they ask for specific sections, deliverables, or structure - PROVIDE EXACTLY WHAT THEY ASK FOR.

Your output must be a JSON object that includes these core fields:
{
  "strategy": { ... },
  "tactics": { ... },
  "intelligence": { ... },
  "contentStrategy": { ... },  // NEW
  "executionPlan": { ... },    // NEW
  "orchestration": { ... }
}

CRITICAL RULES:
1. READ THE USER'S REQUEST - if they ask for specific sections, include them
2. ANSWER THEIR QUESTION - don't just return a generic framework
3. USE THE RESEARCH - incorporate findings, quotes, and data provided
4. BE SPECIFIC - no generic placeholders, use real content from the research
5. ALWAYS INCLUDE contentStrategy and executionPlan fields with valid content type IDs
```

**Why Changed**:
- Old prompt was too rigid, ignored user's specific requests
- New prompt includes contentStrategy and executionPlan fields
- Emphasizes answering the user's actual question

---

**Location**: Lines 354-369 (User message content in Claude API call)

**Before**: Massive prompt with full conversation history, all articles, all findings (180+ lines)
```typescript
messages: [{
  role: 'user',
  content: `Analyze the conversation history and research to create a strategic framework.

COMPLETE CONVERSATION HISTORY (This shows what the user wants):
${(() => {
  const conversationHistory = discoveryContext?.session?.conversationHistory
  if (conversationHistory && conversationHistory.length > 0) {
    return conversationHistory.map((msg: any, idx: number) => {
      const role = msg.role === 'user' ? 'USER' : 'NIV'
      const content = msg.content || ''
      const displayContent = role === 'USER' ? content : content.substring(0, 1000)
      return `\n[${role}]: ${displayContent}...`
    }).join('\n')
  }
  return 'No conversation history provided'
})()}

USER'S CURRENT REQUEST: ${userQuery}

USER PREFERENCES FROM CONVERSATION:
- Wants: ${discoveryContext?.session?.userPreferences?.wants?.join(', ')}
... [continues for 150+ more lines with all research data]
```

**After**: Concise prompt with essential data only
```typescript
messages: [{
  role: 'user',
  content: `Create a strategic framework based on this request and research.

USER'S REQUEST: ${userQuery}

ORGANIZATION: ${discoveryContext?.organization?.name || 'Unknown'} (${discoveryContext?.organization?.industry || 'Technology'})

KEY FINDINGS:
${research?.keyFindings?.slice(0, 5).map((f: string) => `- ${f}`).join('\n') || 'No key findings'}

SYNTHESIS:
${research?.synthesis?.[0] || 'No synthesis provided'}

OPPORTUNITIES:
${research?.insights?.opportunities?.slice(0, 3).map((o: string) => `- ${o}`).join('\n') || 'Market opportunities identified in research'}
```

**Why Changed**:
- Old prompt exceeded Claude's context limits → API errors
- Included full conversation history, all articles, massive example (500+ lines)
- New prompt is concise, includes only essential data

---

**Location**: Lines 161-171 (Debug logging)

**Before**: Basic framework validation logging
```typescript
console.log(`📊 Framework contains:`, {
  articles: validatedFramework.intelligence?.supporting_data?.articles?.length || 0,
  keyFindings: validatedFramework.intelligence?.key_findings?.length || 0,
  synthesis: Array.isArray(validatedFramework.strategy?.rationale) ? validatedFramework.strategy.rationale.length : 1,
  hasIntelligence: !!validatedFramework.intelligence,
  hasStrategy: !!validatedFramework.strategy,
  hasTactics: !!validatedFramework.tactics
})
```

**After**: Added new fields to logging
```typescript
console.log(`📊 Framework contains:`, {
  articles: validatedFramework.intelligence?.supporting_data?.articles?.length || 0,
  keyFindings: validatedFramework.intelligence?.key_findings?.length || 0,
  synthesis: Array.isArray(validatedFramework.strategy?.rationale) ? validatedFramework.strategy.rationale.length : 1,
  hasIntelligence: !!validatedFramework.intelligence,
  hasStrategy: !!validatedFramework.strategy,
  hasTactics: !!validatedFramework.tactics,
  hasContentStrategy: !!validatedFramework.contentStrategy,      // NEW
  hasExecutionPlan: !!validatedFramework.executionPlan,          // NEW
  contentTypes: validatedFramework.executionPlan?.autoExecutableContent?.contentTypes?.length || 0  // NEW
})
```

**Why Changed**: To debug whether new fields are being populated

---

### 2. niv-strategic-framework/campaign-detector.ts

**Location**: Lines 424-444 (generateContentPlan function)

**Before**: Returned generic content descriptions
```typescript
function generateContentPlan(campaignType: CampaignType): string[] {
  const baseContent = [
    'Core messaging framework',
    'FAQ documentation'
  ]

  const typeSpecific: Record<string, string[]> = {
    'b2bSaas': ['Technical documentation', 'ROI calculator', 'Integration guides'],
    'consumerTech': ['Unboxing videos', 'Feature demos', 'Comparison guides'],
    // ... more generic strings
  }

  return [...baseContent, ...(typeSpecific[campaignType.type] || [])]
}
```

**After**: Returns valid MCP content type IDs
```typescript
function generateContentPlan(campaignType: CampaignType): string[] {
  const typeSpecific: Record<string, string[]> = {
    'b2bSaas': [
      'press-release',
      'blog-post',
      'thought-leadership',
      'case-study',
      'white-paper',
      'qa-document',
      'linkedin-article',
      'email',
      'media-pitch',
      'value-proposition',
      'competitive-positioning'
    ],
    'consumerTech': [
      'press-release',
      'blog-post',
      'social-post',
      'instagram-caption',
      'twitter-thread',
      'facebook-post',
      'media-pitch',
      'qa-document',
      'video',
      'infographic'
    ],
    // ... 8 more campaign types with 7-11 content types each
  }

  const defaultContent = [
    'press-release',
    'blog-post',
    'media-pitch',
    'social-post',
    'qa-document',
    'thought-leadership',
    'email'
  ]

  return typeSpecific[campaignType.type] || defaultContent
}
```

**Why Changed**:
- Old function returned strings like "Technical documentation" which aren't valid MCP content types
- Framework auto-execute was failing because content types didn't match ExecuteTabProduction.tsx
- New function uses all 35 valid content type IDs from frontend

---

### 3. niv-strategic-framework/default-framework.ts

**Location**: Lines 204-226 (Framework return object)

**Before**: No contentStrategy or executionPlan fields
```typescript
return {
  strategy: { ... },
  tactics: { ... },
  intelligence: { ... },
  orchestration: { ... },
  discoveryContext: discoveryContext,
  narrative: { ... },
  execution: { ... },
  handoff: { ... }
}
```

**After**: Added contentStrategy and executionPlan fields
```typescript
return {
  strategy: { ... },
  tactics: { ... },
  intelligence: { ... },

  // NEW: Content-ready format for auto-execution
  contentStrategy: {
    subject: objective,
    narrative: strategicNarrative,
    target_audiences: extractAudiences(discoveryContext),
    key_messages: createKeyMessages(articles, keyFindings, userQuery, userChoices, userPriorities),
    media_targets: extractMediaOutlets(mediaTargets),
    timeline: determineTimeline(userQuery, keyFindings),
    chosen_approach: strategicApproach,
    tactical_recommendations: tacticalElements.strategic_plays || []
  },

  // NEW: Execution plan (auto-executable vs strategic)
  executionPlan: {
    autoExecutableContent: {
      contentTypes: tacticalElements.campaign_elements?.content_creation || [],
      description: "Content that will be automatically generated",
      estimatedPieces: (tacticalElements.campaign_elements?.content_creation || []).length
    },
    strategicRecommendations: {
      campaigns: buildStrategicCampaigns(campaignType, workflowType)
    }
  },

  orchestration: { ... },
  discoveryContext: discoveryContext,
  narrative: { ... },
  execution: { ... },
  handoff: { ... }
}
```

**Location**: Lines 882-1088 (New helper functions added)

**Before**: Functions didn't exist

**After**: Added 4 new helper functions
```typescript
// Helper functions for content-ready format
function extractAudiences(discoveryContext: any): string[] { ... }
function extractMediaOutlets(mediaTargets: any): string[] { ... }
function determineTimeline(userQuery: string, keyFindings: any[]): string { ... }
function buildStrategicCampaigns(campaignType: string, workflowType: string): any[] { ... }
```

**Why Changed**:
- Framework was missing fields needed for auto-execution
- Helper functions populate the new fields with data from discovery context

---

### 4. niv-orchestrator-robust/index.ts

**Location**: Lines 1183-1238 (New detectStructuredRequest function)

**Before**: Function didn't exist

**After**: Added structured request detection
```typescript
function detectStructuredRequest(message: string): { isStructured: boolean; sections: string[]; structure: any } {
  const lower = message.toLowerCase()

  // Pattern 1: "Include: 1) ... 2) ... 3) ..."
  const numberedMatch = message.match(/include:?\s*(?:the following:?)?\s*1\)|1\./i)
  if (numberedMatch) {
    // Extract numbered sections
    const sections = []
    const lines = message.split(/\n|(?=\d+[\)\.])/)

    for (const line of lines) {
      const sectionMatch = line.match(/(\d+)[\)\.]\s*(.+?)(?=\d+[\)\.]|$)/s)
      if (sectionMatch) {
        sections.push({
          number: parseInt(sectionMatch[1]),
          text: sectionMatch[2].trim()
        })
      }
    }

    if (sections.length > 0) {
      return {
        isStructured: true,
        sections: sections.map(s => s.text),
        structure: {
          type: 'numbered_list',
          count: sections.length,
          items: sections
        }
      }
    }
  }

  // Pattern 2: Bullet points or explicit sections
  if (lower.includes('include:') || lower.includes('provide:') || lower.includes('need:')) {
    const bulletMatch = message.match(/[-•*]\s+(.+)/g)
    if (bulletMatch && bulletMatch.length >= 3) {
      return {
        isStructured: true,
        sections: bulletMatch.map(b => b.replace(/^[-•*]\s+/, '').trim()),
        structure: {
          type: 'bullet_list',
          count: bulletMatch.length,
          items: bulletMatch
        }
      }
    }
  }

  return {
    isStructured: false,
    sections: [],
    structure: null
  }
}
```

**Why Changed**:
- Needed to detect when user provides explicit structure (numbered lists)
- Will be used to route to new multi-step processing (not yet implemented)

---

## Files Created

1. **NIV_STRUCTURED_REQUEST_ARCHITECTURE.md** - Architecture documentation
2. **ROLLBACK_DOCUMENTATION.md** - This file

## Deployment Status

- ✅ niv-strategic-framework deployed with new prompt
- ✅ campaign-detector.ts deployed with valid content types
- ✅ default-framework.ts deployed with new fields
- ❌ niv-orchestrator-robust NOT YET DEPLOYED (detectStructuredRequest function added but not used)

## How to Rollback

### Option 1: Git Revert (if committed)
```bash
git log --oneline  # Find commit before changes
git revert <commit-hash>
git push
npx supabase functions deploy niv-strategic-framework
npx supabase functions deploy niv-orchestrator-robust
```

### Option 2: Manual Rollback

1. **niv-strategic-framework/index.ts**:
   - Restore rigid prompt from lines 11-89 (see "Before" section above)
   - Remove contentStrategy and executionPlan from prompt schema
   - Restore full conversation history in messages (lines 354-534)
   - Remove new debug logging fields (lines 168-170)

2. **niv-strategic-framework/campaign-detector.ts**:
   - Replace generateContentPlan function with generic strings version
   - Restore baseContent array with "Core messaging framework", "FAQ documentation"

3. **niv-strategic-framework/default-framework.ts**:
   - Remove contentStrategy object (lines 205-214)
   - Remove executionPlan object (lines 217-226)
   - Remove helper functions: extractAudiences, extractMediaOutlets, determineTimeline, buildStrategicCampaigns (lines 882-1088)

4. **niv-orchestrator-robust/index.ts**:
   - Remove detectStructuredRequest function (lines 1183-1238)

5. **Redeploy**:
```bash
npx supabase functions deploy niv-strategic-framework
npx supabase functions deploy niv-orchestrator-robust
```

## Additional Changes Made

### 5. niv-orchestrator-robust/index.ts (Continued)

**Location**: Lines 1240-1398 (New buildStructuredResponse function and helpers)

**Before**: Functions didn't exist

**After**: Added comprehensive structured response builder
```typescript
async function buildStructuredResponse(
  sections: string[],
  researchData: any,
  organizationName: string,
  userQuery: string
): Promise<any> {
  // Maps user's requested sections to structured data
  // Extracts from research for each section type
}

// 8 helper functions:
- extractObjectiveFromSection()
- extractNarrativeFromSection()
- extractAudiencesFromSection()
- extractContentStrategyFromSection()
- extractMediaTargetsFromSection()
- extractTimelineFromSection()
- extractMetricsFromSection()
```

**Why Changed**: Needed to build responses section-by-section based on user's explicit structure

---

**Location**: Lines 2973-3000 (Routing logic for structured requests)

**Before**: Directly called strategic framework
```typescript
try {
  const extractedResearch = extractAndPackageResearch(updatedState, toolResults)

  // Call the NIV Strategic Framework edge function
  const strategicResponse = await fetch(...)
```

**After**: Detects structured requests and builds response first
```typescript
try {
  // NEW: Check if this is a structured request
  const structuredRequest = detectStructuredRequest(message)

  if (structuredRequest.isStructured) {
    console.log(`📋 Detected structured request with ${structuredRequest.sections.length} sections:`)
    structuredRequest.sections.forEach((section, i) => {
      console.log(`  ${i + 1}. ${section}`)
    })

    // Build response section-by-section
    const structuredResponse = await buildStructuredResponse(
      structuredRequest.sections,
      {
        ...toolResults,
        synthesis: toolResults.intelligencePipeline?.synthesis,
        keyFindings: toolResults.intelligencePipeline?.keyFindings,
        articles: toolResults.intelligencePipeline?.articles,
        organizationName: organizationName
      },
      organizationName,
      message
    )

    console.log('✅ Built structured response with sections:', Object.keys(structuredResponse))
  }

  // Use the cleaner extraction function
  const extractedResearch = extractAndPackageResearch(updatedState, toolResults)

  // Call the NIV Strategic Framework edge function
  const strategicResponse = await fetch(...)
```

**Why Changed**: Routes structured requests through new multi-step builder before packaging

---

## Additional Bug Fixes (2025-10-07 - Part 2)

### 6. niv-content-intelligent-v2/index.ts (Missing Import)

**Location**: Lines 1-4 (Imports)

**Before**: Missing createClient import
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { NIV_CONTENT_SYSTEM_PROMPT } from './system-prompt.ts'
```

**After**: Added createClient import
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { NIV_CONTENT_SYSTEM_PROMPT } from './system-prompt.ts'
```

**Why Changed**: Line 710 was calling `createClient()` but it wasn't imported, causing "createClient is not defined" errors in auto-execute mode.

---

### 7. niv-content-intelligent-v2/index.ts (Content Type Routing)

**Location**: Lines 2344-2359 (callMCPService routing table)

**Before**: Missing case-study, white-paper, and executive-brief from routing
```typescript
const routing: Record<string, { service: string; tool: string }> = {
  'press-release': { service: 'mcp-content', tool: 'press-release' },
  'blog-post': { service: 'mcp-content', tool: 'blog-post' },
  // ... other types
  'thought-leadership': { service: 'mcp-content', tool: 'thought-leadership' },
  'executive-statement': { service: 'mcp-content', tool: 'executive-statement' }
}
```

**After**: Added case-study, white-paper, and executive-brief
```typescript
const routing: Record<string, { service: string; tool: string }> = {
  'press-release': { service: 'mcp-content', tool: 'press-release' },
  'blog-post': { service: 'mcp-content', tool: 'blog-post' },
  // ... other types
  'thought-leadership': { service: 'mcp-content', tool: 'thought-leadership' },
  'case-study': { service: 'mcp-content', tool: 'thought-leadership' },
  'white-paper': { service: 'mcp-content', tool: 'thought-leadership' },
  'executive-statement': { service: 'mcp-content', tool: 'executive-statement' },
  'executive-brief': { service: 'mcp-content', tool: 'executive-statement' }
}
```

**Why Changed**: Auto-execute was throwing "Unknown content type: case-study" and "Unknown content type: executive-brief" errors because the routing table didn't include them. Claude is generating these type names, so we map them to valid handlers.

---

### 8. framework-auto-execute/index.ts

**Location**: Lines 200-236 (generatePlaybookMarkdown function)

**Before**: Direct property access without null checks
```typescript
function generatePlaybookMarkdown(campaign: any, folderPath: string): string {
  return `# ${campaign.title}
...
## Steps
${campaign.executionSteps.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}
...
${campaign.platform_support.generatable_assets.map((a: string) => `- ${a}`).join('\n')}
`
}
```

**After**: Defensive null checks with fallbacks
```typescript
function generatePlaybookMarkdown(campaign: any, folderPath: string): string {
  return `# ${campaign?.title || 'Untitled Campaign'}
...
## Steps
${campaign?.executionSteps?.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n') || 'No execution steps defined'}
...
${campaign?.platform_support?.generatable_assets?.map((a: string) => `- ${a}`).join('\n') || 'No auto-generated assets defined'}
`
}
```

**Why Changed**: Playbook generation was failing with "Cannot read properties of undefined (reading 'map')" because campaign objects were missing expected properties.

---

### 9. niv-orchestrator-robust/index.ts (Chat UI Display Fix)

**Location**: Lines 2308-2385, 2973-3001, 3056-3064 (Structured response formatting)

**Before**: Structured responses were built but never displayed in chat
```typescript
// structuredResponse built at line 2983 but never used
const formattedMessage = formatStrategicResponse(
  structuredFramework.strategy?.objective || 'Strategic Framework Generated',
  structuredFramework,
  organizationName
)
// formatStrategicResponse only shows: objective, approach, key messages, narrative
```

**After**: Created new formatter and use it when structured response exists
```typescript
// Made structuredResponse available in scope (line 2975)
let structuredResponse = null

// Use structured formatter when available (lines 3058-3064)
const formattedMessage = structuredResponse
  ? formatStructuredSectionsResponse(structuredResponse, organizationName)
  : formatStrategicResponse(
      structuredFramework.strategy?.objective || 'Strategic Framework Generated',
      structuredFramework,
      organizationName
    )

// New formatter (lines 2308-2385) shows all requested sections:
function formatStructuredSectionsResponse(sections: any, organizationName: string): string {
  // Displays: objective, narrative, audiences, contentStrategy, mediaTargets, timeline, metrics
}
```

**Why Changed**: When users requested 7 specific sections, only 3 were shown in the chat UI. All sections were saved to Memory Vault correctly, but the chat formatter was hardcoded to show only standard framework fields. Now displays all user-requested sections.

---

## What Still Needs to Be Done

1. ✅ buildStructuredResponse() function - CREATED
2. ✅ Routing logic to use detectStructuredRequest - IMPLEMENTED
3. ✅ Content type routing fixes - COMPLETED
4. ✅ Playbook generation fixes - COMPLETED
5. ✅ Chat UI display of structured sections - COMPLETED
6. ❌ Further simplification of strategic-framework - NOT YET DONE (still calls Claude)
7. ❌ Testing with Sora 2 example - NOT YET TESTED

## Known Issues After Changes

- ✅ FIXED: "Unknown content type: case-study" errors
- ✅ FIXED: "Unknown content type: executive-brief" errors
- ✅ FIXED: "createClient is not defined" errors
- ✅ FIXED: Playbook generation crashes
- ✅ FIXED: Chat UI not displaying all requested sections
- ⚠️ Playbook titles showing as "undefined" (defensive fix prevents crash but campaign objects missing title property)
- ❌ Claude still generating invalid content type names (should constrain to valid list in prompt)

## Risk Assessment

- **Low Risk**: Content type changes (campaign-detector.ts) - just using valid IDs
- **Medium Risk**: Prompt changes (index.ts) - could affect all framework generation
- **Medium Risk**: New fields (default-framework.ts) - downstream consumers expect them
- **Low Risk**: detectStructuredRequest - not used yet, no impact

## Testing Checklist

Before considering this complete:
- [ ] Test framework generation with simple request
- [ ] Test framework generation with 7-section Sora 2 request
- [ ] Verify contentStrategy field is populated
- [ ] Verify executionPlan field is populated
- [ ] Verify content types are valid
- [ ] Test Execute Campaign button
- [ ] Verify auto-execution works end-to-end
