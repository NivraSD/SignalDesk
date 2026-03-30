# Fix Role Separation Between Research and Strategy

## The Problem
1. **niv-fireplexity** is correctly returning just search results
2. **niv-orchestrator-robust** uses Claude with a "PR Strategist" persona that naturally gives strategic advice even during research
3. **niv-strategic-framework** gets called but may not have the full research context

## The Current Flow
```
User: "What's happening with OpenAI?"
  → niv-fireplexity: Returns articles
  → niv-orchestrator (Claude): "As a PR Strategist, here's what I see..." [GIVES STRATEGIC ADVICE]

User: "Develop a strategy"
  → niv-strategic-framework: Gets called but research context is unclear
```

## The Solution

### Option 1: Mode-Based Persona (Quick Fix)
Modify `buildClaudeMessage` to have different instructions based on whether we're doing research or strategy:

```typescript
// In buildClaudeMessage function
if (!shouldGenerateFramework) {
  // RESEARCH MODE - Just present findings
  message += `Present the research findings clearly and objectively. `
  message += `Summarize what's happening without strategic interpretation. `
  message += `Focus on facts, trends, and newsworthy developments. `
  message += `Save strategic analysis for when explicitly requested.`
} else {
  // STRATEGY MODE - Give strategic guidance
  message += `Now provide strategic analysis and recommendations. `
  message += `Share insights as you would in a strategy meeting. `
  message += `Identify patterns, opportunities, and risks. `
  message += `Recommend specific strategic actions.`
}
```

### Option 2: Separate Research Presenter (Better Architecture)
Create a separate, simpler function for presenting research that doesn't use the PR Strategist persona:

```typescript
async function presentResearchFindings(toolResults, queryType) {
  // Use a neutral researcher persona, not PR strategist
  const researchPrompt = `You are presenting research findings.
    Summarize the key information from these sources objectively.
    Focus on: what's happening, when, who's involved, and why it matters.
    Do NOT provide strategic recommendations unless explicitly asked.`

  // Call Claude with research-only prompt
}
```

### Option 3: Pass Full Context to Strategic Framework
Ensure niv-strategic-framework receives ALL the research:

```typescript
// In niv-orchestrator-robust when calling strategic framework
body: JSON.stringify({
  research: toolResults,  // ✓ Already doing this
  researchSummary: responseText,  // ADD: The research summary Claude created
  userQuery: message,
  conversationHistory: conversationHistory,  // ✓ Already doing this
  allSearchResults: toolResults.fireplexityData || [],  // ADD: Raw search results
  organizationContext: {
    // ... existing context
  }
})
```

## Recommended Implementation
1. **Immediate**: Implement Option 1 (mode-based persona) to stop strategic advice during research
2. **Next**: Enhance strategic framework data passing (Option 3)
3. **Future**: Consider Option 2 for cleaner architecture

This will give you:
- Clear research presentations without premature strategy
- Strategic frameworks that build on the full research context
- Better separation of concerns between components