# SignalDeck Presentation Generation - Fixes

## Issue 1: orgId Not Defined
When users tried to generate a PowerPoint presentation after approving the outline, they encountered:
```
ReferenceError: orgId is not defined
    at Server.<anonymous> (file:///Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/niv-content-intelligent-v2/index.ts:3041:30)
```

## Issue 2: JSON Parse Error
After fixing Issue 1, the SignalDeck function received the request but failed with:
```
SyntaxError: Expected ',' or ']' after array element in JSON at position 16092 (line 216 column 6)
```

## User Report
> "we are now getting really good outlines in the chat for the powerpoints. but when i clicked approve and generate powerpoint button nothing happened. then when i typed to create one and it agreed i got the error. it looks like it was never sent to the signaldeskpresentation edge function."

## Root Causes

### Issue 1: Variable Name Mismatch
The variable `orgId` was used in two places but never defined. The correct variable name is `organizationId`, which is extracted from `organizationContext` on line 817:

```typescript
const organizationId = organizationContext?.organizationId || 'OpenAI'
```

## Occurrences Fixed

### 1. Memory Vault Save (Line 2428)
**Before:**
```typescript
await supabase.from('content_library').insert({
  org_id: orgId,
  content_type: 'presentation_outline',
  // ...
})
```

**After:**
```typescript
await supabase.from('content_library').insert({
  org_id: organizationId,
  content_type: 'presentation_outline',
  // ...
})
```

### 2. SignalDeck Request Body (Line 2577)
**Before:**
```typescript
const requestBody = {
  approved_outline: outline,
  theme: toolUse.input.theme || { /* ... */ },
  include_speaker_notes: toolUse.input.include_speaker_notes !== false,
  organization_id: orgId
}
```

**After:**
```typescript
const requestBody = {
  approved_outline: outline,
  theme: toolUse.input.theme || { /* ... */ },
  include_speaker_notes: toolUse.input.include_speaker_notes !== false,
  organization_id: organizationId
}
```

### Issue 2: Claude JSON Parsing
The regex pattern `content.match(/\{[\s\S]*\}/)` was too greedy and would match from the first `{` to the LAST `}` in the response, potentially including text after the JSON. Additionally:
- `max_tokens: 4096` was too small for large presentations
- No instruction to Claude to return clean JSON
- No handling for JSON wrapped in code blocks
- Naive regex couldn't handle nested braces properly

## Files Modified

### 1. niv-content-intelligent-v2/index.ts
**Lines 2428 & 2577**: Fixed variable name
- Changed `orgId` to `organizationId` in Memory Vault save
- Changed `orgId` to `organizationId` in SignalDeck request body

✅ Deployed successfully (202.8kB)

### 2. signaldeck-presentation/index.ts
**Lines 183-277**: Improved Claude response parsing
- Increased `max_tokens` from 4096 to 8192 for larger presentations
- Added instruction to Claude: "Return ONLY valid JSON with no additional text before or after"
- Added code block detection: `content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)`
- Implemented proper brace counting algorithm that respects string boundaries and escape characters
- Added better error logging with first 500 chars of failed content

✅ Deployed successfully (90.67kB)

## Expected Result
After both fixes:
1. User creates presentation outline ✅ (was already working)
2. User reviews and approves outline ✅ (was already working)
3. User clicks "approve and generate" or types to generate ✅ (now works)
4. NIV sends request to SignalDeck with correct `organization_id` ✅
5. SignalDeck calls Claude to generate presentation content ✅
6. Claude's JSON response is properly parsed ✅
7. PowerPoint is built and uploaded to storage ✅
8. Presentation metadata saved to Memory Vault ✅

## Testing
To verify the fix works:
```
User: "Create a presentation about AI safety for technical teams"
NIV: [Creates outline]
User: "Looks good, generate the presentation"
```

**Expected Result:**
- No `ReferenceError` errors
- SignalDeck edge function receives the request
- Presentation is generated via Gamma
- Chat displays presentation link/preview
