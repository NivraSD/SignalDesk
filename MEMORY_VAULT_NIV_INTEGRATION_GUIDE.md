# Memory Vault V2 - NIV Integration Guide

**Purpose:** Show how to integrate Memory Vault's brand context and intelligence with NIV content generation

---

## Overview

Memory Vault V2 provides:
1. **Brand Context** - Templates, guidelines, voice profiles
2. **Content Intelligence** - Themes, topics, related content
3. **Smart Storage** - Auto-categorized content library

NIV can use this to:
- Generate content matching brand voice
- Reference existing content
- Auto-save with intelligence extraction
- Suggest related opportunities

---

## Step 1: Import Brand Context Cache

```typescript
// In your NIV content generation file
import { getBrandContextSync } from '@/lib/memory-vault/brand-context-cache'
```

---

## Step 2: Fetch Brand Context Before Generation

```typescript
async function generatePressRelease(params: {
  organizationId: string
  opportunity: any
  framework: any
}) {
  // FAST: Get brand context from cache (< 1ms if cached)
  const brandContext = getBrandContextSync(
    params.organizationId,
    'press-release'
  )

  // Brand context contains:
  // - guidelines: { brand_voice_profile, extracted_guidelines }
  // - template: { template_structure, usage_instructions }
  // - performance: { usage_count, success_rate }

  console.log('📋 Brand context loaded:', brandContext ? 'Yes' : 'No')

  // Continue with generation...
}
```

---

## Step 3: Include Brand Context in Claude Prompt

```typescript
const systemPrompt = `You are a professional PR content writer.

${brandContext?.guidelines?.extracted_guidelines ? `
BRAND GUIDELINES:
${JSON.stringify(brandContext.guidelines.extracted_guidelines, null, 2)}

BRAND VOICE:
${JSON.stringify(brandContext.guidelines.brand_voice_profile, null, 2)}
` : ''}

Generate a press release that ${brandContext ? 'matches the brand guidelines above' : 'is professional and engaging'}.
`

const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4000,
  system: systemPrompt,
  messages: [{
    role: 'user',
    content: `Generate a press release about: ${params.opportunity.title}`
  }]
})
```

---

## Step 4: Auto-Save Generated Content

```typescript
// After generating content
const generatedText = response.content[0].text

// Save to Memory Vault (will auto-extract intelligence in background)
const saveResponse = await fetch('/api/content-library/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: {
      type: 'press-release',
      title: params.opportunity.title,
      content: generatedText,
      organization_id: params.organizationId
    },
    metadata: {
      opportunity_id: params.opportunity.id,
      framework_id: params.framework.id,
      generated_by: 'niv',
      brand_context_used: !!brandContext
    }
  })
})

const { id, intelligenceStatus } = await saveResponse.json()

console.log(`✅ Content saved: ${id}`)
console.log(`📊 Intelligence: ${intelligenceStatus}`) // 'pending' - will complete in background
```

---

## Step 5: Subscribe to Intelligence Completion (Optional)

```typescript
import { subscribeToContentIntelligence } from '@/lib/memory-vault/realtime-subscriptions'

// In your UI component
useEffect(() => {
  const channel = subscribeToContentIntelligence((update) => {
    if (update.id === savedContentId) {
      console.log('🎉 Intelligence complete!')
      console.log('📁 Auto-filed in:', update.folder)
      console.log('🏷️ Extracted themes:', update.themes)
      console.log('📌 Related content:', update.related_content_ids)

      // Update UI
      setContent(prev => ({ ...prev, ...update }))
    }
  }, params.organizationId)

  return () => unsubscribe(channel)
}, [savedContentId])
```

---

## Complete Integration Example

```typescript
// File: src/lib/niv/generate-press-release.ts
import { anthropic } from '@/lib/anthropic'
import { getBrandContextSync } from '@/lib/memory-vault/brand-context-cache'

export async function generatePressRelease(params: {
  organizationId: string
  opportunity: any
  framework: any
}) {
  const startTime = Date.now()

  // 1. Get brand context (< 1ms if cached, won't block if not)
  const brandContext = getBrandContextSync(
    params.organizationId,
    'press-release'
  )

  console.log('🎨 Brand context:', brandContext ? 'Using guidelines' : 'No guidelines')

  // 2. Build system prompt with optional brand context
  const systemPrompt = buildSystemPrompt(brandContext, params.framework)

  // 3. Generate with Claude
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: buildUserPrompt(params.opportunity)
    }]
  })

  const generatedText = response.content[0].text
  const generationTime = Date.now() - startTime

  // 4. Save to Memory Vault (async intelligence extraction)
  const saved = await saveToMemoryVault({
    type: 'press-release',
    title: params.opportunity.title,
    content: generatedText,
    organization_id: params.organizationId,
    metadata: {
      opportunity_id: params.opportunity.id,
      framework_id: params.framework.id,
      generation_time_ms: generationTime,
      brand_context_used: !!brandContext,
      template_id: brandContext?.template?.id
    }
  })

  // 5. Return immediately (intelligence happens in background)
  return {
    content: generatedText,
    contentId: saved.id,
    intelligenceStatus: 'pending', // Will be 'complete' in 4-6 seconds
    brandContextUsed: !!brandContext,
    generationTime
  }
}

function buildSystemPrompt(brandContext: any, framework: any): string {
  let prompt = `You are a professional PR content writer creating press releases.`

  if (brandContext?.guidelines) {
    prompt += `\n\nBRAND GUIDELINES:\n`
    prompt += `Tone: ${brandContext.guidelines.brand_voice_profile?.tone || 'professional'}\n`
    prompt += `Voice: ${brandContext.guidelines.brand_voice_profile?.voice || 'authoritative'}\n`

    if (brandContext.guidelines.extracted_guidelines?.dos) {
      prompt += `\nDO:\n${brandContext.guidelines.extracted_guidelines.dos.join('\n')}\n`
    }

    if (brandContext.guidelines.extracted_guidelines?.donts) {
      prompt += `\nDON'T:\n${brandContext.guidelines.extracted_guidelines.donts.join('\n')}\n`
    }
  }

  prompt += `\n\nFollow the ${framework.name} framework.`

  return prompt
}

function buildUserPrompt(opportunity: any): string {
  return `Generate a press release for this opportunity:

Title: ${opportunity.title}
Description: ${opportunity.description}
Key Points: ${opportunity.key_points?.join(', ') || 'None provided'}

Create a compelling press release that captures media attention.`
}

async function saveToMemoryVault(content: any) {
  const response = await fetch('/api/content-library/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, metadata: content.metadata })
  })

  if (!response.ok) {
    throw new Error('Failed to save to Memory Vault')
  }

  return response.json()
}
```

---

## Performance Impact

| Operation | Time | Impact on NIV |
|-----------|------|---------------|
| Get brand context (cached) | < 1ms | ✅ None |
| Get brand context (uncached) | Returns null immediately | ✅ None (fail-safe) |
| Save to Memory Vault | 106-200ms | ✅ Minimal (happens after generation) |
| Intelligence extraction | 4-6s | ✅ None (background job) |

**Total added latency to NIV:** < 200ms (only the save operation)

---

## Testing the Integration

```bash
# 1. Generate content with NIV (your existing flow)
# 2. Check if it was saved
curl http://localhost:3001/api/content-library?organization_id=YOUR_ORG_ID

# 3. Wait 5-10 seconds for intelligence
# 4. Check again - should have themes, topics, folder
curl http://localhost:3001/api/content-library?organization_id=YOUR_ORG_ID
```

---

## Benefits for NIV

1. **Brand Consistency** - Auto-apply brand guidelines when available
2. **Zero Friction** - Works perfectly without guidelines (most orgs won't have them)
3. **Content Library** - All NIV content auto-saved and organized
4. **Smart Discovery** - Find related content and opportunities
5. **Performance Tracking** - See which templates work best
6. **No Latency** - Brand context is cached, intelligence is async

---

## Key Principles

1. **Optional Enhancement** - Brand context improves output but isn't required
2. **Fail-Safe** - Never block generation if context unavailable
3. **Async Intelligence** - Never make users wait for analysis
4. **Smart Caching** - First lookup might take 20ms, then < 1ms forever
5. **Real-time Updates** - UI can subscribe to intelligence completion

---

## Next Steps

1. Add `getBrandContextSync()` to your NIV generation functions
2. Include brand context in system prompts (when available)
3. Auto-save generated content to `/api/content-library/save`
4. Optional: Subscribe to Realtime updates in UI
5. Monitor performance metrics to ensure no latency impact

**The integration is designed to be invisible to users while providing massive value!**
