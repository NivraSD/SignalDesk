# IMMEDIATE FIX: Extract Niv's Actual Content

## The Problem Line
In `/supabase/functions/niv-orchestrator/index.ts` at line 1470:
```typescript
const generatedContent = generateContent(intent.type, { ...context })
```

This line **throws away Niv's actual content** and generates generic templates instead.

## The Fix Needed

Replace the `generateContent` call with extraction from Niv's actual response. Here's what needs to happen:

### Option 1: Quick Fix (Modify existing orchestrator)
1. After getting `nivResponse` from Claude
2. Extract the actual content Niv generated
3. Use that instead of calling `generateContent()`

### Option 2: Use the Two-Phase System
1. Deploy `niv-consultant` for conversation
2. Deploy `niv-generator` for structured generation
3. Update frontend to use these endpoints

## What's Happening Now

```
User: "Create a media list"
     ↓
Niv: "Here's your media list: [REAL JOURNALISTS]"
     ↓
System: Ignores Niv's list, calls generateContent()
     ↓
Artifact: Shows generic template journalists
```

## What Should Happen

```
User: "Create a media list"
     ↓
Niv: "Here's your media list: [REAL JOURNALISTS]"
     ↓
System: Extracts Niv's actual list
     ↓
Artifact: Shows the SAME journalists Niv created
```

## Emergency Patch

To fix this RIGHT NOW, we need to modify the niv-orchestrator to:

1. Have Niv include structured data in response
2. Extract that structured data
3. Use it instead of generateContent()

This is exactly what `niv-orchestrator-fixed` does - it ensures Niv's actual content makes it to the artifacts.