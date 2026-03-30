# THE PASSTHROUGH PROBLEM - ROOT CAUSE IDENTIFIED

## The Fundamental Issue

When you ask Niv for a media list:

1. **Niv (Claude) generates REAL content** with actual journalists, outlets, etc. in the conversation
2. **The Edge Function IGNORES this content** and calls `generateContent()` which creates FALLBACK templates
3. **Wrong content types get triggered** - asking for "media list" also creates "strategy plan" due to word matching
4. **Artifacts show FALLBACK content**, not what Niv actually created

## The Broken Flow

```
User: "Create a media list"
    ↓
Niv/Claude: "I'll create a comprehensive media strategy..." 
            [GENERATES REAL JOURNALIST LIST IN RESPONSE]
    ↓
determineRequestedItems(): 
    - Sees "media" → creates media-list ✓
    - Sees "strategy" → ALSO creates strategy-plan ✗
    ↓
generateContent(): 
    - Creates FALLBACK media list (fake journalists)
    - Creates FALLBACK strategy plan (template content)
    ↓
Artifacts: Show FALLBACK content, not Niv's real content
```

## Why This Approach is Fundamentally Broken

The current system:
1. **Has Niv generate content in conversation** (good)
2. **Then throws it away** and generates different content (bad)
3. **Uses word matching** that creates wrong artifacts (terrible)

## The Fix We Need

### Option 1: Extract Content from Niv's Response
- Parse Niv's actual response for the generated content
- Create artifacts with Niv's content, not templates
- Only create what user explicitly asked for

### Option 2: Have Niv Return Structured Data
- Modify system prompt so Niv returns JSON with content
- Parse the JSON and use that for artifacts
- Ensures perfect alignment between chat and artifacts

### Option 3: Two-Phase Approach
- Phase 1: Conversation to gather context
- Phase 2: Explicit generation request that returns structured content
- Never mix conversation and generation

## The Current Code Problems

### Problem 1: Word Matching Creates Wrong Items
```typescript
// Line 1353-1354 in niv-orchestrator/index.ts
if ((userMessage.includes('strategic plan') || userMessage.includes('communications plan') || userMessage.includes('strategy')) &&
    (nivResponse.includes('strategic plan') || nivResponse.includes('strategy'))) {
```
When Niv says "media strategy", this triggers strategy-plan creation!

### Problem 2: generateContent() Ignores Niv's Work
```typescript
// Line 1470
const generatedContent = generateContent(intent.type, { 
  ...context, 
  messages,
  userMessage: message 
})
```
This creates NEW content instead of using what Niv generated!

### Problem 3: No Connection Between Response and Artifacts
- Niv's response contains the real content
- But artifacts get filled with template/fallback content
- Complete disconnect between chat and workspace

## What We Need to Rethink

**Current approach**: Niv generates content in conversation, then we generate different content for artifacts

**Better approach**: 
1. Niv generates structured content that can be directly used
2. OR we parse Niv's response to extract the actual content
3. OR we make generation completely separate from conversation

The passthrough problem exists because we're not actually passing through Niv's content - we're replacing it with fallback templates!