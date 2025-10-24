# Gamma Capture Integration - Complete! 🎉

## What We Built

You can now **capture Gamma presentations** into SignalDesk for searchability, reuse, and NIV context integration.

---

## 🗄️ Database Schema

**Table:** `campaign_presentations`

Stores:
- ✅ Gamma presentation metadata (ID, URLs, title, slide count)
- ✅ Full-text content (searchable via PostgreSQL FTS)
- ✅ Structured slide data
- ✅ .pptx file URL (stored in Supabase Storage)
- ✅ Link to campaigns
- ✅ Generation parameters

**Migration:** `supabase/migrations/20251020_create_gamma_presentations_table_fixed.sql`

---

## 🔧 Enhanced Edge Function

**File:** `supabase/functions/gamma-presentation/index.ts`

### New Features:

#### 1. Capture Parameter
```typescript
POST /functions/v1/gamma-presentation
{
  "title": "My Presentation",
  "content": "...",
  "capture": true,  // ← Enable capture!
  "campaign_id": "uuid",  // Optional
  "organization_id": "uuid"  // Required for capture
}
```

#### 2. Automatic Download & Storage
- When `exportPdfPptx: true` is sent to Gamma
- Downloads .pptx file when generation completes
- Uploads to Supabase Storage
- Extracts text content (basic extraction for now)
- Stores everything in `campaign_presentations` table

#### 3. Status Polling with Capture
- Status checks automatically trigger capture when presentation is ready
- Returns `captured: true` and `capturedId` when successful
- Cleans up after completion

---

## 📚 Helper Functions

**File:** `src/lib/gammaCapture.ts`

### Available Functions:

```typescript
// Search presentations
const results = await searchPresentations('AI trends', orgId, 10)

// Get campaign presentations
const presentations = await getCampaignPresentations(campaignId)

// Get organization presentations
const allPresentations = await getOrganizationPresentations(orgId)

// Get single presentation
const presentation = await getPresentation(presentationId)

// Get by Gamma ID
const presentation = await getPresentationByGammaId(gammaId)

// Get relevant presentations for NIV context
const context = await getRelevantPresentationsForTopic('AI', orgId, 5)

// Delete presentation
await deletePresentation(presentationId)

// Update presentation
await updatePresentation(presentationId, { title: 'New Title' })

// Get statistics
const stats = await getPresentationStats(orgId)
```

---

## 🎯 How to Use

### Example 1: Create & Capture a Presentation

```typescript
// From your frontend or NIV orchestrator
const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gamma-presentation`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      title: 'Q4 Marketing Strategy',
      content: 'Create a comprehensive presentation about...',
      capture: true,  // ← Enable capture
      campaign_id: 'your-campaign-id',
      organization_id: 'your-org-id',
      slideCount: 12,
      options: {
        tone: 'professional',
        imageSource: 'ai'
      }
    })
  }
)

const data = await response.json()
console.log('Generation ID:', data.generationId)
console.log('Status endpoint:', data.statusEndpoint)
```

### Example 2: Poll Status (Auto-Captures When Ready)

```typescript
async function pollStatus(generationId) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gamma-presentation?generationId=${generationId}`,
    {
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    }
  )

  const status = await response.json()

  if (status.status === 'completed') {
    console.log('Presentation ready!')
    console.log('Gamma URL:', status.gammaUrl)
    console.log('Captured:', status.captured)
    console.log('Captured ID:', status.capturedId)

    if (status.captured) {
      // Get the full captured data
      const presentation = await getPresentation(status.capturedId)
      console.log('PPTX URL:', presentation.pptx_url)
      console.log('Slides:', presentation.slides)
    }
  }
}
```

### Example 3: Search Past Presentations

```typescript
import { searchPresentations } from '@/lib/gammaCapture'

// User searches for presentations about "AI"
const results = await searchPresentations('AI trends', organizationId, 10)

results.forEach(presentation => {
  console.log(presentation.title)
  console.log(presentation.gamma_url)
  console.log(`${presentation.slide_count} slides`)
})
```

### Example 4: Get Presentation Context for NIV

```typescript
import { getRelevantPresentationsForTopic } from '@/lib/gammaCapture'

// When NIV is generating content about a topic
const topic = 'AI in healthcare'
const context = await getRelevantPresentationsForTopic(topic, orgId, 5)

// Use context in your NIV prompt
const enhancedPrompt = `
Create content about: ${topic}

Context from past presentations:
${context.map(p => `
- ${p.title}
  Created: ${new Date(p.created_at).toLocaleDateString()}
  View: ${p.gamma_url}
`).join('\n')}

Build on these insights while creating fresh content.
`
```

---

## 🔄 Workflow Diagram

```
User Requests Presentation
        ↓
[capture: true, organization_id provided]
        ↓
Gamma API generates presentation
        ↓
Frontend polls status endpoint
        ↓
Presentation completes
        ↓
Edge Function automatically:
  1. Downloads .pptx from Gamma
  2. Extracts text content
  3. Uploads to Supabase Storage
  4. Saves to campaign_presentations table
        ↓
Returns captured: true, capturedId
        ↓
Presentation is now searchable!
```

---

## 🚀 Next Steps

### Immediate Use:
1. ✅ Deploy the updated Edge Function
2. ✅ Add `capture: true` to your Gamma requests
3. ✅ Use search functions to find past presentations

### Future Enhancements:

#### 1. Better PPTX Parsing
The current extraction is basic. Consider:
- Using a proper PPTX parser library
- Extracting individual slide text
- Preserving slide structure
- Extracting images from slides

#### 2. NIV Integration (Todo #6)
- Auto-search for relevant presentations when generating content
- Include presentation context in prompts
- Suggest reusing content from past presentations

#### 3. UI Components (Todo #7)
- Presentation library view
- Search interface
- Preview component
- Download/share buttons

#### 4. Advanced Search
- Filter by date range
- Filter by campaign
- Filter by format (presentation/document/social)
- Sort by relevance/date/slide count

---

## 📝 Files Modified/Created

### Database
- ✅ `supabase/migrations/20251020_create_gamma_presentations_table_fixed.sql`

### Edge Function
- ✅ `supabase/functions/gamma-presentation/index.ts` (enhanced)

### Helper Library
- ✅ `src/lib/gammaCapture.ts` (new)

### Documentation
- ✅ `GAMMA_CAPTURE_COMPLETE.md` (this file)

---

## 🎨 Example: Complete Integration

```typescript
// In your NIV Content Orchestrator or presentation builder

async function createPresentationWithCapture(topic: string, campaignId: string, orgId: string) {
  // 1. Search for relevant past presentations
  const pastPresentations = await getRelevantPresentationsForTopic(topic, orgId, 3)

  // 2. Build context-aware prompt
  const contextPrompt = pastPresentations.length > 0
    ? `\n\nContext from past work:\n${pastPresentations.map(p => `- ${p.title}`).join('\n')}`
    : ''

  // 3. Create presentation with Gamma (with capture enabled)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gamma-presentation`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        topic,
        content: `Create a presentation about ${topic}${contextPrompt}`,
        capture: true,
        campaign_id: campaignId,
        organization_id: orgId,
        slideCount: 12
      })
    }
  )

  const { generationId } = await response.json()

  // 4. Poll for completion
  return pollUntilComplete(generationId)
}

async function pollUntilComplete(generationId: string) {
  let attempts = 0
  const maxAttempts = 60 // 2 minutes max (60 * 2 seconds)

  while (attempts < maxAttempts) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gamma-presentation?generationId=${generationId}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      }
    )

    const status = await response.json()

    if (status.status === 'completed') {
      return {
        gammaUrl: status.gammaUrl,
        capturedId: status.capturedId,
        captured: status.captured
      }
    }

    if (status.status === 'error') {
      throw new Error(status.message)
    }

    // Wait 2 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 2000))
    attempts++
  }

  throw new Error('Presentation generation timed out')
}
```

---

## ✅ Testing Checklist

- [ ] Create presentation with `capture: true`
- [ ] Verify .pptx uploaded to Supabase Storage
- [ ] Verify record in `campaign_presentations` table
- [ ] Search for presentation by text
- [ ] Get presentation by campaign ID
- [ ] Get presentation by Gamma ID
- [ ] Test search function with various queries
- [ ] Verify full-text search ranking
- [ ] Test with and without `organization_id`
- [ ] Test cleanup of pending captures

---

## 🐛 Known Limitations

1. **PPTX Extraction**: Currently uses basic text decoding. Need proper PPTX parser for structured extraction.

2. **In-Memory Storage**: Pending captures are stored in-memory. If Edge Function restarts, pending captures are lost (but this only affects the 30-60 seconds between creation and completion).

3. **Download Links Expiry**: Gamma's download links may expire. We capture immediately when presentation completes to avoid this.

4. **No Image Extraction**: Currently only extracts text, not images from slides.

---

## 🎉 You're Ready!

The Gamma capture integration is complete and ready to use. Start by enabling `capture: true` on your next Gamma presentation request and see it automatically save to SignalDesk!

Need help? Check the examples above or look at the helper functions in `src/lib/gammaCapture.ts`.
