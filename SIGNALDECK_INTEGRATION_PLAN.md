# SignalDeck Integration Plan

**Goal**: Integrate the AI presentation builder as a new content type "signaldeck" to replace/complement Gamma, with professional-grade features including charts, timelines, and data visualizations.

## Current Architecture Analysis

### Content Type System
- **Location**: `niv-content-intelligent-v2/index.ts`
- **Format**: Tools array with name, description, input_schema
- **Existing Types**: image, social_post, press_release, blog_post, presentation_outline, presentation (Gamma)

### Gamma Workflow (Current)
1. **create_presentation_outline** - Creates structured outline with visual suggestions
2. **User Review** - User approves/edits outline
3. **generate_presentation** - Calls Gamma API with approved outline
4. **Polling** - Returns generationId, frontend polls for completion
5. **Export** - Gamma provides PDF/PPTX export URLs

### MemoryVault Integration
- **Table**: `content_library`
- **Fields**: id, organization_id, content_type, title, content, metadata, tags, status, folder
- **API**: `/api/content-library/save` (POST/GET/DELETE)
- **Hook**: `useMemoryVault.ts`

---

## SignalDeck Integration Design

### Phase 1: Core Integration

#### 1.1 Copy Presentation Builder
```bash
# Copy to project structure
cp -r ~/Downloads/signaldesk-presentation-builder/* \
  ~/Desktop/signaldesk-v3/presentation-builder/
```

**Files to copy**:
- `orchestrator.js` - Claude-powered content generator
- `builder.js` - PowerPoint creator (fixed for pptxgenjs)
- `index.js` - CLI tool
- `templates/` - Design system
- `package.json` - Dependencies

#### 1.2 Add to niv-content-intelligent-v2

**New Tools**:

```typescript
{
  name: "create_signaldeck_outline",
  description: "Create a detailed presentation outline for SignalDeck (our AI presentation builder). Use this when user requests a presentation. Creates structured outline with sections, talking points, and visual elements (charts, timelines, images).",
  input_schema: {
    type: "object",
    properties: {
      topic: { type: "string" },
      audience: { type: "string" },
      purpose: { type: "string" },
      key_messages: { type: "array", items: { type: "string" } },
      slide_count: { type: "number", default: 10 },
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            talking_points: { type: "array", items: { type: "string" } },
            visual_element: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["chart", "timeline", "image", "diagram", "quote", "data_table"]
                },
                description: { type: "string" },
                data: { type: "object" } // For charts/tables
              }
            }
          }
        }
      }
    },
    required: ["topic", "audience", "purpose", "key_messages", "sections"]
  }
},
{
  name: "generate_signaldeck",
  description: "Generate a PowerPoint presentation using SignalDeck based on approved outline. ONLY use after user approves the outline. Creates .pptx file with professional layouts, charts, and visuals.",
  input_schema: {
    type: "object",
    properties: {
      approved_outline: {
        type: "object",
        description: "The complete approved presentation outline"
      },
      theme: {
        type: "object",
        properties: {
          primary: { type: "string" },
          secondary: { type: "string" },
          accent: { type: "string" }
        }
      },
      include_speaker_notes: { type: "boolean", default: true }
    },
    required: ["approved_outline"]
  }
}
```

#### 1.3 Create Supabase Edge Function

**Location**: `supabase/functions/signaldeck-presentation/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface SignalDeckRequest {
  approved_outline: any
  theme?: {
    primary: string
    secondary: string
    accent: string
  }
  include_speaker_notes?: boolean
  organization_id?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const request: SignalDeckRequest = body.parameters || body

    // Call the presentation builder
    // 1. Generate presentation data using Claude (orchestrator)
    // 2. Build PowerPoint using pptxgenjs (builder)
    // 3. Upload to Supabase Storage
    // 4. Save metadata to content_library

    const generationId = crypto.randomUUID()

    // Start generation in background
    // Return immediately with pending status

    return new Response(
      JSON.stringify({
        success: true,
        generationId,
        status: 'pending',
        contentType: 'signaldeck',
        estimatedTime: '15-30 seconds',
        statusEndpoint: `/functions/v1/signaldeck-presentation/status/${generationId}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
```

---

### Phase 2: Professional Features

#### 2.1 Chart Generation

**Add to builder.js**:

```javascript
addChartSlide(slide, data, colors) {
  // Create chart using pptxgenjs chart capabilities
  const chartData = data.visual_element?.data || {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    values: [65, 70, 80, 85]
  }

  slide.addChart(pptx.ChartType.bar, chartData, {
    x: 1,
    y: 1.5,
    w: 8,
    h: 4,
    chartColors: [colors.accent],
    showTitle: false,
    showLegend: true
  })
}
```

**Supported Chart Types**:
- Bar charts
- Line charts
- Pie charts
- Column charts
- Area charts

#### 2.2 Timeline Visualization

```javascript
addTimelineSlide(slide, data, colors) {
  const events = data.visual_element?.data?.events || []

  // Create visual timeline using shapes and text
  events.forEach((event, index) => {
    const yPos = 2 + (index * 0.8)

    // Timeline marker
    slide.addShape('circle', {
      x: 1,
      y: yPos,
      w: 0.3,
      h: 0.3,
      fill: { color: colors.accent }
    })

    // Date
    slide.addText(event.date, {
      x: 1.5,
      y: yPos,
      w: 2,
      h: 0.3,
      fontSize: 14,
      bold: true,
      color: colors.primary
    })

    // Description
    slide.addText(event.description, {
      x: 3.7,
      y: yPos,
      w: 5,
      h: 0.3,
      fontSize: 12,
      color: colors.primary
    })
  })
}
```

#### 2.3 Data Table Generation

```javascript
addDataTableSlide(slide, data, colors) {
  const tableData = data.visual_element?.data?.table || []

  slide.addTable(tableData, {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 4,
    fontSize: 14,
    color: colors.primary,
    fill: { color: colors.background },
    border: { pt: 1, color: colors.secondary }
  })
}
```

#### 2.4 Diagram/Flowchart Support

```javascript
addDiagramSlide(slide, data, colors) {
  const nodes = data.visual_element?.data?.nodes || []

  nodes.forEach((node, index) => {
    const xPos = 1 + (index * 2.5)

    // Node box
    slide.addShape('roundRect', {
      x: xPos,
      y: 2.5,
      w: 2,
      h: 1,
      fill: { color: colors.accent },
      line: { color: colors.primary, width: 2 }
    })

    // Node text
    slide.addText(node.label, {
      x: xPos,
      y: 2.7,
      w: 2,
      h: 0.6,
      fontSize: 14,
      color: colors.text,
      align: 'center',
      valign: 'middle'
    })

    // Arrow to next node
    if (index < nodes.length - 1) {
      slide.addShape('rightArrow', {
        x: xPos + 2,
        y: 2.9,
        w: 0.5,
        h: 0.3,
        fill: { color: colors.primary }
      })
    }
  })
}
```

---

### Phase 3: MemoryVault Integration

#### 3.1 Save to Content Library

**After presentation generation**:

```typescript
// In signaldeck-presentation edge function
const { data: savedContent, error } = await supabase
  .from('content_library')
  .insert({
    organization_id: request.organization_id,
    content_type: 'signaldeck',
    title: presentationData.title,
    content: presentationFileUrl, // URL to .pptx in storage
    metadata: {
      outline: request.approved_outline,
      theme: request.theme,
      slide_count: presentationData.slides.length,
      generated_at: new Date().toISOString(),
      has_charts: presentationData.slides.some(s => s.type === 'chart'),
      has_timelines: presentationData.slides.some(s => s.type === 'timeline'),
      visual_elements: presentationData.slides
        .filter(s => s.visual_element)
        .map(s => s.visual_element.type)
    },
    tags: ['presentation', 'signaldeck', presentationData.topic],
    status: 'completed',
    created_by: 'niv',
    folder: 'presentations'
  })
  .select()
  .single()
```

#### 3.2 Load from Content Library

**Frontend component**:

```typescript
const { saveContent } = useMemoryVault()

// Save presentation
await saveContent({
  title: presentation.title,
  content: presentation.fileUrl,
  content_type: 'signaldeck',
  folder: 'presentations',
  metadata: {
    outline: approvedOutline,
    slideCount: presentation.slides.length,
    theme: selectedTheme
  },
  tags: ['presentation', 'ai-generated']
})
```

---

### Phase 4: Visual Guidance Enhancement

#### 4.1 Enhanced Outline with Visual Specifications

```typescript
// In orchestrator's outline generation
const enhancedOutline = {
  topic: "Q4 Results",
  audience: "Board of Directors",
  purpose: "Quarterly update",
  key_messages: ["Revenue up 25%", "New product launch success"],
  sections: [
    {
      title: "Executive Summary",
      talking_points: [
        "Q4 exceeded targets by 15%",
        "Customer acquisition doubled"
      ],
      visual_element: {
        type: "chart",
        description: "Q4 vs Q3 revenue comparison",
        data: {
          type: "bar",
          labels: ["Q3", "Q4"],
          datasets: [{
            label: "Revenue ($M)",
            data: [12, 15]
          }]
        }
      }
    },
    {
      title: "Product Milestones",
      talking_points: [
        "Beta launch in September",
        "General availability in November",
        "1,000+ early adopters"
      ],
      visual_element: {
        type: "timeline",
        description: "Product launch timeline",
        data: {
          events: [
            { date: "Sep 2024", description: "Beta Launch" },
            { date: "Oct 2024", description: "Testing Phase" },
            { date: "Nov 2024", description: "GA Release" }
          ]
        }
      }
    }
  ]
}
```

#### 4.2 Intelligent Visual Selection

**Add to orchestrator.js**:

```javascript
// Claude analyzes content and suggests appropriate visual types
async determineVisualElements(sections) {
  const prompt = `
    For each section, suggest the most effective visual element:

    ${sections.map((s, i) => `
      Section ${i + 1}: ${s.title}
      Points: ${s.talking_points.join(', ')}
    `).join('\n')}

    For each section, respond with:
    {
      "section_index": 0,
      "visual_type": "chart|timeline|diagram|image|quote|data_table",
      "reasoning": "Why this visual works best",
      "data_structure": {...} // Specific data format for the visual
    }
  `

  // Claude determines best visual for each section
}
```

---

### Phase 5: Workflow Integration

#### 5.1 User Flow

```
User: "Create a presentation about our Q4 results"
  ↓
NIV Content Intelligent v2
  → Detects presentation request
  → Calls create_signaldeck_outline tool
  ↓
Claude generates outline with:
  - Suggested sections
  - Talking points
  - Visual element recommendations (charts, timelines, etc.)
  ↓
User reviews outline in UI
  - Edits sections
  - Approves visual suggestions
  - Selects theme
  ↓
User approves → NIV calls generate_signaldeck tool
  ↓
SignalDeck Edge Function:
  1. Calls orchestrator (content generation)
  2. Calls builder (PowerPoint creation)
  3. Uploads to Supabase Storage
  4. Saves to content_library
  ↓
Returns generationId → Frontend polls status
  ↓
Presentation ready:
  - Download .pptx
  - View in browser
  - Edit in PowerPoint
  - Save to MemoryVault
```

#### 5.2 Frontend Components

**Create `src/components/signaldeck/SignalDeckOrchestrator.tsx`**:

```typescript
export function SignalDeckOrchestrator() {
  const [outline, setOutline] = useState(null)
  const [status, setStatus] = useState<'outline' | 'generating' | 'complete'>('outline')
  const [generationId, setGenerationId] = useState<string | null>(null)
  const { saveContent } = useMemoryVault()

  const handleApproveOutline = async () => {
    setStatus('generating')

    // Call edge function
    const response = await fetch('/api/supabase/functions/signaldeck-presentation', {
      method: 'POST',
      body: JSON.stringify({
        approved_outline: outline,
        theme: selectedTheme
      })
    })

    const result = await response.json()
    setGenerationId(result.generationId)

    // Poll for completion
    pollStatus(result.generationId)
  }

  const pollStatus = async (genId: string) => {
    // Poll every 3 seconds
    const interval = setInterval(async () => {
      const status = await checkStatus(genId)
      if (status.status === 'completed') {
        clearInterval(interval)
        setStatus('complete')

        // Auto-save to MemoryVault
        await saveContent({
          title: outline.topic,
          content: status.fileUrl,
          content_type: 'signaldeck',
          folder: 'presentations'
        })
      }
    }, 3000)
  }

  return (
    <div>
      {status === 'outline' && (
        <OutlineEditor outline={outline} onApprove={handleApproveOutline} />
      )}
      {status === 'generating' && (
        <GenerationProgress generationId={generationId} />
      )}
      {status === 'complete' && (
        <PresentationViewer presentationUrl={fileUrl} />
      )}
    </div>
  )
}
```

---

## Implementation Checklist

### Immediate (Week 1-2)
- [ ] Copy presentation builder to signaldesk-v3/presentation-builder/
- [ ] Install dependencies (pptxgenjs, @anthropic-ai/sdk)
- [ ] Add create_signaldeck_outline tool to niv-content-intelligent-v2
- [ ] Add generate_signaldeck tool to niv-content-intelligent-v2
- [ ] Create signaldeck-presentation edge function (basic version)
- [ ] Test outline generation
- [ ] Test basic PowerPoint generation

### Short-term (Week 3-4)
- [ ] Implement chart generation in builder.js
- [ ] Implement timeline generation in builder.js
- [ ] Add diagram/flowchart support
- [ ] Enhance visual element detection in orchestrator
- [ ] Create SignalDeckOrchestrator component
- [ ] Implement status polling
- [ ] Add MemoryVault save/load
- [ ] Test with real strategic frameworks

### Medium-term (Week 5-6)
- [ ] Add data table generation
- [ ] Implement theme customization UI
- [ ] Add presentation preview/thumbnails
- [ ] Integrate with Blueprint/VECTOR campaigns
- [ ] Add batch generation support
- [ ] Performance optimization
- [ ] Error handling and retry logic

### Future Enhancements
- [ ] Real-time collaboration on outlines
- [ ] Template library (pitch decks, reports, etc.)
- [ ] Custom fonts and brand kits
- [ ] Animation support
- [ ] Video embed support
- [ ] PDF export option
- [ ] Analytics (which slides are most viewed)

---

## Cost Analysis

### Current (Gamma)
- **Cost per presentation**: $10-20
- **At 100/month**: $1,000-2,000

### With SignalDeck
- **Claude API**: ~$0.15-0.30 per presentation
- **Vertex AI images**: ~$0.10 per image × 5 images = $0.50
- **Total per presentation**: ~$0.65-0.80
- **At 100/month**: $65-80
- **Savings**: **$920-1,920/month** (92-96% reduction)

### Annual Savings
- **Conservative**: $11,040
- **Aggressive**: $23,040

---

## Risk Mitigation

### Technical Risks
1. **PowerPoint compatibility** - Test with multiple PowerPoint versions
2. **Chart rendering** - Fallback to images if pptxgenjs charts fail
3. **File size** - Optimize images and compress presentations

### Business Risks
1. **Quality vs Gamma** - Run parallel with Gamma for 2-4 weeks
2. **User adoption** - Comprehensive training and documentation
3. **Edge cases** - Collect user feedback and iterate quickly

---

## Success Metrics

### Technical
- [ ] Presentation generation time < 30 seconds
- [ ] 95%+ success rate
- [ ] File size < 10MB per presentation
- [ ] Support all major chart types

### Business
- [ ] 70%+ cost savings vs Gamma
- [ ] 80%+ user satisfaction
- [ ] 100+ presentations generated/month
- [ ] Zero critical bugs in production

### User Experience
- [ ] Outline approval in < 2 minutes
- [ ] Generation completion notification
- [ ] One-click save to MemoryVault
- [ ] PowerPoint-compatible output

---

## Next Steps

1. **Review this plan** - Confirm approach and priorities
2. **Set up environment** - Copy files, install dependencies
3. **Start with MVP** - Basic outline → generation → save flow
4. **Iterate based on feedback** - Add professional features incrementally
5. **Run parallel with Gamma** - Validate quality and reliability
6. **Full rollout** - Replace Gamma once validated

**Estimated Timeline**: 6-8 weeks to production-ready system
