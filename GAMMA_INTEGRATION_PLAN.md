# Gamma API Integration Plan for SignalDesk V3

## Overview
Integrate Gamma's AI presentation generation API to enhance our content creation capabilities, allowing users to automatically generate professional presentations, documents, and social media content from NIV frameworks and intelligence data.

## Gamma API Capabilities

### Core Features
- **Multi-format Generation**: Presentations, documents, and social media posts
- **AI-Powered Design**: Automatic theme selection and intelligent layouts
- **AI Image Generation**: Built-in AI image creation for visual content
- **Export Options**: PDF and PPTX export capabilities
- **Multi-language Support**: 60+ languages supported
- **Rate Limits**: 50 generations/day for Pro/Ultra users (Beta)

### API Workflow
1. **POST Request**: Send content to `/v0.2/generations` endpoint
2. **Poll Status**: Check generation status until complete
3. **Retrieve Output**: Get Gamma URL and export options

### Request Parameters
```javascript
{
  inputText: string,        // 1-750,000 characters
  textMode: string,         // "generate" | "condense" | "preserve"
  format: string,           // "presentation" | "document" | "social"
  themeName?: string,       // Optional theme selection
  numCards?: number,        // Number of slides/cards
  cardSplit?: string,       // How to split content across cards
  imageSource?: string,     // "ai" | "unsplash" | "web"
  tone?: string,           // Content tone
  audience?: string        // Target audience
}
```

## Integration Strategy

### 1. Add Presentation Content Type

```typescript
// src/types/content.ts
export type ContentType =
  | 'press-release'
  | 'social-post'
  | 'presentation'  // NEW
  | 'exec-statement'
  | 'crisis-response'
  // ... other types

// Add to content type mappings
CONTENT_TYPE_ICONS['presentation'] = '📊'
CONTENT_TYPE_LABELS['presentation'] = 'Presentation'
```

### 2. Create Gamma Service Module

```typescript
// src/services/GammaService.ts
export class GammaService {
  private static GAMMA_API_URL = 'https://public-api.gamma.app/v0.2'
  private static API_KEY = process.env.NEXT_PUBLIC_GAMMA_API_KEY

  static async generatePresentation(request: {
    title: string
    content: string
    framework?: any
    format?: 'presentation' | 'document' | 'social'
    options?: {
      numCards?: number
      themeName?: string
      imageSource?: 'ai' | 'unsplash' | 'web'
      tone?: string
      audience?: string
    }
  }) {
    // Step 1: Prepare content for Gamma
    const gammaInput = this.prepareGammaContent(request)

    // Step 2: Create generation
    const response = await fetch(`${this.GAMMA_API_URL}/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.API_KEY
      },
      body: JSON.stringify({
        inputText: gammaInput,
        textMode: 'generate',
        format: request.format || 'presentation',
        numCards: request.options?.numCards || 10,
        themeName: request.options?.themeName || 'auto',
        imageSource: request.options?.imageSource || 'ai'
      })
    })

    const result = await response.json()

    // Step 3: Poll for completion (implement webhook later)
    return {
      generationId: result.id,
      gammaUrl: result.url,
      creditsUsed: result.creditsUsed,
      status: 'processing'
    }
  }

  private static prepareGammaContent(request: any): string {
    // Transform framework or raw content into Gamma-optimized format
    if (request.framework) {
      return this.frameworkToPresentation(request.framework)
    }
    return request.content
  }

  private static frameworkToPresentation(framework: any): string {
    // Convert NIV framework to presentation outline
    return `
Title: ${framework.strategy?.objective}

${framework.proofPoints?.map((point: any, i: number) => `
Slide ${i + 1}: ${point.title}
- ${point.description}
- Key metrics: ${point.metrics?.join(', ')}
`).join('\n')}

${framework.tactics?.content_creation?.map((tactic: any) => `
- ${tactic}
`).join('\n')}
    `.trim()
  }
}
```

### 3. Enhance ContentGenerationService

```typescript
// In ContentGenerationService.ts
case 'presentation':
  // Generate presentation outline with Claude
  const presentationContent = await this.generateWithClaude({
    type: 'presentation',
    prompt,
    context
  })

  // Send to Gamma for visual presentation
  const gammaResult = await GammaService.generatePresentation({
    title: prompt.split('\n')[0],
    content: presentationContent,
    framework: context.framework,
    options: {
      numCards: 10,
      imageSource: 'ai',
      tone: options.tone,
      audience: options.audience?.[0]
    }
  })

  return {
    success: true,
    content: presentationContent,
    metadata: {
      ...metadata,
      gammaUrl: gammaResult.gammaUrl,
      generationId: gammaResult.generationId,
      exportFormats: ['pdf', 'pptx']
    }
  }
```

### 4. NIV Assistant Enhancement

```typescript
// In NIVContentAssistantV2.tsx
else if (typeToUse === 'presentation') {
  // Gather presentation details
  if (!conversationContext.hasPresentationContext) {
    addNivMessage(
      `I'll create a presentation for ${organization?.name || 'OpenAI'}. To make it impactful:\n\n` +
      `• What's the topic or main message?\n` +
      `• Who's the audience (investors, customers, team)?\n` +
      `• How many slides do you need?\n` +
      `• Any specific data or metrics to include?\n` +
      `• Visual style preference (professional, creative, minimal)?\n\n` +
      `Share what you need and I'll create your presentation.`,
      []
    )
    setConversationContext({
      ...conversationContext,
      contentType: typeToUse,
      needsMoreInfo: true,
      hasPresentationContext: true
    })
  } else {
    // Generate with gathered context
    await generateContent(typeToUse, userInput)
  }
}
```

### 5. Create Supabase Edge Function

```typescript
// supabase/functions/mcp-gamma-presentation/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { framework, topic, audience, format } = await req.json()

    // Transform framework into presentation structure
    const presentationStructure = {
      title: framework?.strategy?.objective || topic,
      slides: [
        {
          title: 'Executive Summary',
          content: framework?.strategy?.rationale || ''
        },
        ...framework?.proofPoints?.map((point: any) => ({
          title: point.title,
          content: point.description,
          metrics: point.metrics
        })) || [],
        {
          title: 'Next Steps',
          content: framework?.tactics?.next_steps || ''
        }
      ]
    }

    // Generate via Gamma API
    const gammaResponse = await fetch('https://public-api.gamma.app/v0.2/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': Deno.env.get('GAMMA_API_KEY')
      },
      body: JSON.stringify({
        inputText: JSON.stringify(presentationStructure),
        textMode: 'generate',
        format: format || 'presentation',
        audience: audience
      })
    })

    const result = await gammaResponse.json()

    // Save to Memory Vault
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    await supabase.from('content_library').insert({
      title: presentationStructure.title,
      content_type: 'presentation',
      content_text: JSON.stringify(presentationStructure),
      metadata: {
        gammaUrl: result.url,
        generationId: result.id,
        frameworkId: framework?.id
      },
      status: 'completed'
    })

    return new Response(
      JSON.stringify({
        success: true,
        gammaUrl: result.url,
        generationId: result.id,
        creditsUsed: result.creditsUsed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

### 6. UI Components

```typescript
// src/components/execute/PresentationGenerator.tsx
export function PresentationGenerator({ framework, onGenerated }) {
  const [generating, setGenerating] = useState(false)
  const [presentationUrl, setPresentationUrl] = useState(null)

  const generatePresentation = async () => {
    setGenerating(true)

    const response = await fetch('/api/supabase/functions/mcp-gamma-presentation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        framework,
        format: 'presentation',
        audience: 'investors'
      })
    })

    const data = await response.json()
    setPresentationUrl(data.gammaUrl)
    setGenerating(false)
    onGenerated(data)
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3>Generate Presentation</h3>
      <p>Transform your strategic framework into a professional presentation</p>

      <button
        onClick={generatePresentation}
        disabled={generating}
        className="btn-primary"
      >
        {generating ? 'Generating...' : 'Create Presentation'}
      </button>

      {presentationUrl && (
        <div className="mt-4">
          <a href={presentationUrl} target="_blank" rel="noopener">
            View Presentation in Gamma
          </a>
          <div className="flex gap-2 mt-2">
            <button>Export as PDF</button>
            <button>Export as PPTX</button>
          </div>
        </div>
      )}
    </div>
  )
}
```

## Use Cases

### 1. Framework to Investor Deck
- Transform NIV strategic frameworks into investor presentations
- Include market analysis, competitive positioning, and growth projections
- Auto-generate supporting visuals and charts

### 2. Intelligence to Board Presentation
- Convert discovery/intelligence data into executive briefings
- Highlight key insights, trends, and recommendations
- Professional formatting with data visualizations

### 3. Crisis Response Package
- Generate crisis communication deck
- Include stakeholder messaging, timeline, and action items
- Export for immediate distribution

### 4. Product Launch Materials
- Create launch presentation from product framework
- Generate matching social posts and press materials
- Consistent messaging across all formats

### 5. Campaign Reports
- Transform campaign results into presentation format
- Include metrics, achievements, and next steps
- Share with stakeholders via Gamma link or PDF

## Implementation Timeline

### Phase 1: Core Integration (Week 1)
- [ ] Add Gamma API key to environment variables
- [ ] Create GammaService.ts
- [ ] Add presentation content type
- [ ] Basic generation functionality

### Phase 2: NIV Integration (Week 2)
- [ ] Enhance NIV assistant for presentations
- [ ] Add conversational flow for gathering presentation details
- [ ] Connect to Memory Vault

### Phase 3: Advanced Features (Week 3)
- [ ] Framework to presentation conversion
- [ ] Batch generation (presentation + supporting materials)
- [ ] Export functionality
- [ ] Webhook integration for completion notifications

### Phase 4: UI/UX Enhancement (Week 4)
- [ ] Presentation preview component
- [ ] Template selection
- [ ] Edit and regenerate functionality
- [ ] Share and collaboration features

## Environment Variables Required

```env
# Add to .env.local
NEXT_PUBLIC_GAMMA_API_KEY=sk-gamma-xxxxxxxx
GAMMA_WEBHOOK_URL=https://yourapp.com/api/webhooks/gamma
```

## Benefits

1. **Professional Output**: AI-designed presentations with consistent branding
2. **Time Savings**: Generate complete presentations in minutes
3. **Multi-format**: Single content source for presentations, documents, and social
4. **Export Flexibility**: PDF and PPTX for any use case
5. **Collaboration**: Share via Gamma links or download for editing
6. **Integration**: Seamless connection with NIV frameworks and intelligence

## Considerations

- **Beta Limitations**: API is in beta, expect changes
- **Rate Limits**: 50 generations/day per account
- **Content Length**: Maximum 750,000 characters input
- **Authentication**: Currently API key only, OAuth coming
- **Webhooks**: Optional but recommended for async processing

## Next Steps

1. Obtain Gamma API key - obtained = sk-gamma-zFOvUwGMpXZaDiB5sWkl3a5lakNfP19E90ZUZUdZM
2. Set up development environment
3. Implement basic generation test
4. Integrate with existing content workflow
5. Add UI components
6. Test with real frameworks
7. Deploy to production