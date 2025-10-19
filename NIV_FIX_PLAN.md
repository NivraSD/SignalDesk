# NIV Emergency Fix Plan
## Get Back to Working State

### What Was Working:
- NIV could do web searches
- NIV could get latest articles
- NIV could monitor companies
- niv-fireplexity was functioning

### What Broke:
- niv-orchestrator-robust is crashing (500 errors)
- Complex Claude understanding is failing
- Strategic intent detection is too aggressive
- Trying to do too much at once

### Immediate Fix:

## Option 1: Revert to Simple Working Version
Create a new simple orchestrator that JUST works:

```typescript
// niv-orchestrator-simple
async function handleNivQuery(message, context) {
  // 1. Simple research flow
  if (needsResearch(message)) {
    const results = await callFireplexity(message)
    return formatResearchResults(results)
  }

  // 2. That's it - just return research
  // No complex understanding
  // No strategic frameworks
  // Just working research
}
```

## Option 2: Fix the Current Orchestrator
Remove the problematic parts:
1. Remove complex Claude understanding
2. Remove aggressive strategic intent detection
3. Just use fireplexity and return results

## Recommended Approach:
1. Create niv-orchestrator-simple (new, clean)
2. Point UI to use the simple version
3. Get basic functionality working again
4. THEN add features incrementally

The architecture document is aspirational - we need working software first!