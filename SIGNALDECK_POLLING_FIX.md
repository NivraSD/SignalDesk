# SignalDeck PowerPoint Generation - Polling Fix

## Issue
When users requested PowerPoint presentations via SignalDeck:
1. ✅ NIV said "Perfect! I'll generate your SignalDeck PowerPoint presentation"
2. ✅ Backend tool executed and called SignalDeck service
3. ✅ SignalDeck service responded with `200 OK` and generation ID
4. ❌ **Frontend never polled for completion status**
5. ❌ User saw "Your PowerPoint presentation is being created! This usually takes 15-30 seconds" but **nothing happened after that**

## Root Cause

The frontend had a handler for `signaldeck_generating` mode but **did not start polling** for the generation status.

Compare this to the Gamma presentation handler:

### Working: Gamma Presentation (lines 1137-1156)
```typescript
else if (response.mode === 'presentation_generating') {
  console.log('⏳ PRESENTATION GENERATING - Starting to poll')

  const pollingMessageId = `msg-${Date.now()}`
  setMessages(prev => [...prev, { ... }])

  // ✅ STARTS POLLING
  pollPresentationStatus(response.generationId, pollingMessageId, response.metadata.topic)
}
```

### Broken: SignalDeck PowerPoint (lines 1196-1210 BEFORE fix)
```typescript
else if (response.mode === 'signaldeck_generating') {
  console.log('⏳ SIGNALDECK GENERATING')

  setMessages(prev => [...prev, { ... }])
  // ❌ NO POLLING - just displays message and stops
}
```

## Fixes Applied

### File: `src/components/execute/NIVContentOrchestratorProduction.tsx`

### 1. Added SignalDeck Polling Function (lines 1961-2037)
```typescript
// Poll SignalDeck PowerPoint status
const pollSignalDeckStatus = async (generationId: string, messageId: string, topic: string) => {
  let attempts = 0
  const maxAttempts = 40 // 40 attempts * 3 seconds = 2 minutes max

  const pollInterval = setInterval(async () => {
    attempts++

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/signaldeck-presentation/status/${generationId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log(`📊 SignalDeck Poll ${attempts}/${maxAttempts}:`, data.status)

        if (data.status === 'completed' && data.downloadUrl) {
          clearInterval(pollInterval)

          // Update the message with download link
          setMessages(prev => prev.map(msg =>
            msg.id === messageId
              ? {
                  ...msg,
                  content: `✅ Your PowerPoint presentation "${topic}" is ready!\n\n[Download PowerPoint](${data.downloadUrl})`,
                  metadata: {
                    ...msg.metadata,
                    status: 'completed',
                    downloadUrl: data.downloadUrl,
                    presentationTopic: topic
                  }
                }
              : msg
          ))

          console.log('🎯 SignalDeck PowerPoint complete!')
        } else if (data.status === 'failed' || data.status === 'error') {
          clearInterval(pollInterval)

          setMessages(prev => prev.map(msg =>
            msg.id === messageId
              ? {
                  ...msg,
                  content: `❌ PowerPoint generation failed: ${data.message || data.error || 'Unknown error'}`,
                  error: true
                }
              : msg
          ))
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollInterval)
        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? {
                ...msg,
                content: `⏱️ PowerPoint is still generating. This may take a few more moments for complex presentations with many slides.`,
                metadata: {
                  ...msg.metadata,
                  status: 'timeout'
                }
              }
            : msg
        ))
      }
    } catch (error) {
      console.error('SignalDeck polling error:', error)
    }
  }, 3000) // Poll every 3 seconds
}
```

**Key Features:**
- Polls SignalDeck status endpoint every 3 seconds
- Maximum 40 attempts (2 minutes total)
- Updates UI when complete with download link
- Handles errors and timeouts gracefully
- Shows clear status messages to user

### 2. Updated Handler to Start Polling (lines 1196-1217)
```typescript
else if (response.mode === 'signaldeck_generating') {
  console.log('⏳ SIGNALDECK GENERATING - Starting to poll')

  // Show initial message
  const pollingMessageId = `msg-${Date.now()}`
  setMessages(prev => [...prev, {
    id: pollingMessageId,
    role: 'assistant',
    content: response.message,
    timestamp: new Date(),
    metadata: {
      type: 'signaldeck',
      status: 'generating',
      generationId: response.generationId,
      pollUrl: response.pollUrl
    }
  }])

  // ✅ NOW STARTS POLLING
  const topic = response.metadata?.topic || 'your presentation'
  pollSignalDeckStatus(response.generationId, pollingMessageId, topic)
}
```

## What Was Already Working

1. **Backend Tool Execution**: NIV correctly called `generate_signaldeck` tool
2. **SignalDeck Service**: Service received request and started generation
3. **Generation ID**: Backend correctly returned `generationId` and `pollUrl`
4. **Status Endpoint**: SignalDeck status endpoint was ready and working

## What This Fix Enables

### Complete User Flow (Now Working)
1. User: "Create a presentation about AI safety"
2. NIV: Creates outline and shows for review ✅
3. User: "Looks good, generate the presentation"
4. NIV: "Perfect! I'll generate your SignalDeck PowerPoint presentation" ✅
5. **Backend**: Tool executes → SignalDeck receives request ✅
6. **Frontend**: Shows "Your PowerPoint presentation is being created! This usually takes 15-30 seconds" ✅
7. **Frontend**: NOW POLLS every 3 seconds for status ✅ **← NEW**
8. **Frontend**: Updates message when complete with download link ✅ **← NEW**
9. User: Downloads PowerPoint file ✅ **← NOW POSSIBLE**

## Expected User Experience

### Before Fix:
```
NIV: Perfect! I'll generate your SignalDeck PowerPoint presentation based on the approved outline.

NIV: Your PowerPoint presentation is being created! This usually takes 15-30 seconds. I'll let you know when it's ready to download.

[Nothing happens... user waits... nothing updates... presentation is actually generated but user never finds out]
```

### After Fix:
```
NIV: Perfect! I'll generate your SignalDeck PowerPoint presentation based on the approved outline.

NIV: Your PowerPoint presentation is being created! This usually takes 15-30 seconds. I'll let you know when it's ready to download.

[3 seconds later]
📊 SignalDeck Poll 1/40: pending

[3 seconds later]
📊 SignalDeck Poll 2/40: pending

[... polling continues ...]

[15 seconds later]
📊 SignalDeck Poll 5/40: completed

NIV: ✅ Your PowerPoint presentation "Strategic Framework to Attract Developers to OpenAI Codex" is ready!

[Download PowerPoint](https://storage.url/presentation.pptx)
```

## Testing

To verify the fix works:
```
User: "Create a presentation about quantum computing"
NIV: [Creates outline]
User: "Generate the PowerPoint"
```

**Expected Result:**
1. NIV says "Perfect! I'll generate your SignalDeck PowerPoint presentation"
2. Message appears: "Your PowerPoint presentation is being created..."
3. **Console logs polling attempts every 3 seconds**
4. After 15-30 seconds, message updates to show download link
5. User can click link to download .pptx file

## Files Modified

1. `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/components/execute/NIVContentOrchestratorProduction.tsx`
   - Lines 1961-2037: Added `pollSignalDeckStatus` function
   - Lines 1196-1217: Updated `signaldeck_generating` handler to start polling

## Deployment Status

✅ Changes committed
⏳ Pending: Push to trigger Vercel deployment

## Related Documentation

- `SIGNALDESK_ORGID_FIX.md` - Previous fixes for variable naming and JSON parsing
- `MEDIA_LIST_DISPLAY_FIXES.md` - Similar frontend display fixes
