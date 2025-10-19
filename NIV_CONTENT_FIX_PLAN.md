# NIV CONTENT ORCHESTRATOR - COMPLETE FIX PLAN
## EVERYTHING IS BROKEN - HERE'S HOW TO FIX IT

---

## CURRENT PROBLEMS (EVERYTHING IS FUCKED)

1. **NIV DOESN'T ACKNOWLEDGE CONTENT TYPE SELECTION**
   - User clicks "Press Release" - NIV says nothing
   - User has to type to get any response

2. **NIV DOESN'T KNOW WHO IT WORKS FOR**
   - Should know it's OpenAI
   - Should have organization context

3. **NIV DOESN'T KNOW THE DATE**
   - No current date awareness
   - Can't reference time-sensitive content

4. **IMAGES DON'T WORK AT ALL**
   - Says it's creating images but doesn't
   - No actual Imagen integration
   - No image display

5. **SAVE TO MEMORY VAULT DOESN'T WORK**
   - Says "saving" but doesn't actually save
   - ContentGenerationService not connected properly

6. **RESEARCH (NIV-FIREPLEXITY) 404 ERROR**
   - Wrong URL for edge function
   - Not using proper Supabase URL

7. **CLAUDE CONNECTION STILL BROKEN**
   - System messages error
   - Not actually conversational

---

## THE FIX PLAN - STEP BY STEP

### ISSUE 1: NIV NOT ACKNOWLEDGING CONTENT TYPE
**PROBLEM:** The useEffect isn't triggering when content type is selected
**ROOT CAUSE:** Component might be re-mounting or selectedContentType not being passed correctly

**FIX:**
```typescript
// Add immediate acknowledgment without any conditions
useEffect(() => {
  if (selectedContentType) {
    // IMMEDIATELY add acknowledgment - no checking previous state
    const acknowledgment = getAcknowledgment(selectedContentType)
    const message = {
      id: `ack-${Date.now()}`,
      role: 'assistant',
      content: acknowledgment,
      timestamp: new Date()
    }
    setMessages([message]) // Reset and show acknowledgment
  }
}, [selectedContentType])
```

**TEST:**
1. Click "Press Release"
2. Should IMMEDIATELY see: "I'll help you create a press release. What's the announcement?"
3. Check console for logs

---

### ISSUE 2: NIV DOESN'T KNOW THE ORGANIZATION
**PROBLEM:** Not loading organization context from useAppStore

**FIX:**
```typescript
import { useAppStore } from '@/stores/useAppStore'

// In component:
const { organization } = useAppStore()

// In system prompt:
const NIV_SYSTEM_PROMPT = `
You are NIV, Content Orchestrator for ${organization?.name || 'OpenAI'}.
Today's date is ${new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}.
`
```

**TEST:**
1. Ask NIV "Who am I working for?"
2. Should respond "OpenAI" or current org

---

### ISSUE 3: IMAGE GENERATION NOT WORKING
**PROBLEM:** Using wrong endpoints, not actually calling Vertex AI

**FIX:**
```typescript
// Correct service URLs with full Supabase path
const CONTENT_SERVICE_MAP = {
  'image': {
    label: 'Image',
    icon: ImageIcon,
    service: 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/vertex-ai-visual',
    params: {
      type: 'image',
      model: 'imagen-3',
      prompt: '', // Will be filled from user input
      aspectRatio: '16:9'
    }
  }
}

// When generating image:
const generateImage = async (prompt: string) => {
  const response = await fetch(CONTENT_SERVICE_MAP.image.service, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      ...CONTENT_SERVICE_MAP.image.params,
      prompt: prompt,
      organization: organization?.name
    })
  })

  if (response.ok) {
    const result = await response.json()
    // Display the actual image
    return {
      type: 'image',
      content: {
        url: result.imageUrl || result.url,
        prompt: prompt
      }
    }
  }
}
```

**TEST:**
1. Type "Create an image of a futuristic city"
2. Should see "Generating image with Google Imagen..."
3. Should display actual image in chat

---

### ISSUE 4: SAVE TO MEMORY VAULT NOT WORKING
**PROBLEM:** ContentGenerationService not being called correctly

**FIX:**
```typescript
import { ContentGenerationService } from '@/services/ContentGenerationService'

const handleSave = async (content: any) => {
  try {
    // Actually call the service
    const saved = await ContentGenerationService.saveToMemoryVault(
      {
        type: content.type,
        content: content.content,
        metadata: {
          ...content.metadata,
          organization: organization?.name,
          createdBy: 'NIV Content Orchestrator',
          timestamp: new Date().toISOString()
        }
      },
      'completed'
    )

    if (saved) {
      setMessages(prev => [...prev, {
        id: `save-${Date.now()}`,
        role: 'assistant',
        content: '✅ Saved to Memory Vault successfully!',
        timestamp: new Date()
      }])
    }
  } catch (error) {
    console.error('Save failed:', error)
    // Show actual error to user
  }
}
```

**TEST:**
1. Generate any content
2. Click "Save"
3. Check Supabase dashboard for saved content
4. Should see success message

---

### ISSUE 5: NIV-FIREPLEXITY 404
**PROBLEM:** Using wrong URL structure

**FIX:**
```typescript
const orchestrateResearch = async (query: string) => {
  const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
  const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      query,
      organizationId: organization?.id || 'OpenAI',
      searchMode: 'focused'
    })
  })
}
```

**TEST:**
1. Ask "What are competitors saying about AI?"
2. Should trigger research without 404
3. Should get actual results

---

### ISSUE 6: CLAUDE CONNECTION
**PROBLEM:** System messages handled incorrectly

**FIX:**
Already fixed in `/api/claude-direct/route.ts` - need to verify it's working:
```typescript
// This should already be working:
const { messages, system: directSystem, max_tokens = 1000 } = body

// System passed separately
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  system: system,
  messages: userMessages, // No system roles here
  max_tokens,
  temperature
})
```

**TEST:**
1. Type any message
2. Check console - should not see "Unexpected role system" error
3. Should get actual Claude response

---

## IMPLEMENTATION ORDER

### Step 1: Fix Organization & Date Awareness
```typescript
const { organization } = useAppStore()
const currentDate = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})
```

### Step 2: Fix Content Type Acknowledgment
- Remove complex conditions
- Just acknowledge immediately when selectedContentType changes

### Step 3: Fix All Service URLs
- Add full Supabase URLs
- Add Authorization headers
- Test each endpoint

### Step 4: Fix Image Generation & Display
- Correct Vertex AI endpoint
- Parse response correctly
- Display with MediaDisplay component

### Step 5: Fix Save to Memory Vault
- Connect ContentGenerationService properly
- Add error handling
- Show real success/failure

### Step 6: Test Everything
1. Select "Press Release" → Should acknowledge
2. Ask "Who am I?" → Should say "OpenAI"
3. Ask "What's today?" → Should know date
4. Request image → Should generate and display
5. Save content → Should actually save
6. Ask complex question → Should research without 404

---

## VERIFICATION CHECKLIST

- [ ] NIV acknowledges content type selection IMMEDIATELY
- [ ] NIV knows it's working for OpenAI
- [ ] NIV knows current date and day
- [ ] Images actually generate and display
- [ ] Save to Memory Vault actually works
- [ ] Research doesn't 404
- [ ] Claude responds without errors
- [ ] All content types work
- [ ] Response time < 2 seconds for simple content

---

## WHAT SUCCESS LOOKS LIKE

```
User: [Clicks "Press Release"]
NIV: "I'll help you create a press release. What's the announcement?"

User: "Who are you working for?"
NIV: "I'm working for OpenAI."

User: "Create an image of our new AI model"
NIV: "I'll create an image using Google Imagen..."
[ACTUAL IMAGE DISPLAYS]

User: "Save this"
NIV: "✅ Saved to Memory Vault successfully!"
[ACTUALLY SAVED IN DATABASE]
```

THIS IS WHAT SHOULD HAPPEN. EVERY TIME. NO EXCEPTIONS.