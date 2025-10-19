# SignalDeck Creative Orchestrator Design

## Problem Statement

Current SignalDeck presentation generation:
- ❌ Vertex AI image generation failing (missing `type: 'image'` in API call)
- ❌ No artistic/creative design direction
- ❌ Generic placeholder approach
- ❌ Charts work but visuals are disabled
- ❌ No coordination between content, design, and visual generation

**Root Issue**: The presentation generator is just a simple pipeline. It doesn't have creative direction or orchestration.

## Solution: Creative Orchestration Agent

### Architecture

```
User Request → Creative Orchestrator (Claude Sonnet)
                ↓
        ┌───────┴────────┐
        ↓                ↓
   Design Brief    Content Structure
        ↓                ↓
   Visual Direction  Slide Outline
        ↓                ↓
    ┌───┴────────────────┴───┐
    ↓           ↓             ↓
Vertex Images  Charts    Typography
    ↓           ↓             ↓
        PowerPoint Builder
                ↓
         Final Presentation
```

### Agent Responsibilities

**1. Creative Director Agent** (Claude Sonnet 4)
- Analyzes user request, audience, and purpose
- Generates design brief with:
  - Visual style (modern, corporate, playful, dramatic)
  - Color palette (primary, secondary, accent, supporting colors)
  - Typography direction (bold, elegant, tech, traditional)
  - Image style (photorealistic, illustration, abstract, diagrams)
  - Mood/tone (professional, inspiring, urgent, friendly)
- Creates visual hierarchy for each slide
- Decides which slides need:
  - Hero images (Vertex AI)
  - Data visualizations (charts)
  - Diagrams/infographics
  - Text-only with creative typography

**2. Visual Generator** (Vertex AI + Imagen 3)
- Takes creative direction from Creative Director
- Generates images that match:
  - Color palette
  - Visual style
  - Mood/tone
  - Specific slide content
- Creates consistent visual language across all slides
- Generates multiple variations for key slides

**3. Chart & Data Agent** (Current implementation - already working)
- Generates realistic chart data
- Formats charts professionally
- Integrates with design theme

**4. Layout Compositor** (PptxGenJS)
- Takes all elements (images, charts, text, design brief)
- Creates professional layouts
- Applies typography rules
- Ensures visual consistency
- Implements design system

## Implementation Plan

### Phase 1: Fix Vertex AI Integration ✅
**File**: `/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/signaldeck-presentation/index.ts`

**Line 155-159**: Add missing `type` field
```typescript
body: JSON.stringify({
  type: 'image',  // ADD THIS
  prompt,
  organizationId,
  aspectRatio: '16:9'
})
```

### Phase 2: Create Creative Director Agent
**New File**: `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/agents/signaldeck-creative-director.ts`

```typescript
interface DesignBrief {
  visualStyle: 'modern' | 'corporate' | 'playful' | 'dramatic' | 'minimal' | 'bold'
  colorPalette: {
    primary: string      // Hex color for headers, important elements
    secondary: string    // Hex color for body text
    accent: string       // Hex color for highlights, CTAs
    background: string   // Slide background
    supporting: string[] // Additional colors for charts/variety
  }
  typography: {
    titleFont: string
    bodyFont: string
    style: 'bold' | 'elegant' | 'tech' | 'traditional' | 'playful'
  }
  imageStyle: {
    type: 'photorealistic' | 'illustration' | 'abstract' | 'diagram' | 'mixed'
    mood: string[]  // ['professional', 'inspiring', 'dynamic']
    subjects: string[]  // What to show in images
  }
  slideVisuals: Array<{
    slideNumber: number
    visualType: 'hero_image' | 'chart' | 'diagram' | 'text_only' | 'split_visual'
    imagePrompt?: string  // If hero_image or split_visual
    chartData?: any       // If chart
    layout: 'full_bleed' | 'side_by_side' | 'centered' | 'layered'
  }>
}

export async function generateDesignBrief(
  topic: string,
  audience: string,
  purpose: string,
  sections: Array<{title: string, talking_points: string[]}>
): Promise<DesignBrief> {
  // Call Claude Sonnet to analyze and create comprehensive design brief
  const prompt = `You are a professional presentation designer. Create a comprehensive design brief for this presentation:

Topic: ${topic}
Audience: ${audience}
Purpose: ${purpose}

Sections:
${sections.map((s, i) => `${i + 1}. ${s.title}\n   Points: ${s.talking_points.join('; ')}`).join('\n')}

Generate a design brief that includes:

1. VISUAL STYLE
   - Overall aesthetic (modern/corporate/playful/dramatic/minimal/bold)
   - Justification for this choice based on audience and purpose

2. COLOR PALETTE
   - Primary color (hex) - for titles and key elements
   - Secondary color (hex) - for body text
   - Accent color (hex) - for highlights and CTAs
   - Background color (hex) - slide backgrounds
   - Supporting colors (array of hex) - for charts and variety
   - Explain color psychology and why these work for the audience

3. TYPOGRAPHY
   - Title font family
   - Body font family
   - Overall typographic style (bold/elegant/tech/traditional/playful)
   - Rationale

4. IMAGE STYLE
   - Type (photorealistic/illustration/abstract/diagram/mixed)
   - Mood keywords (3-5 adjectives)
   - Subject matter for images

5. SLIDE-BY-SLIDE VISUAL PLAN
   For EACH slide, specify:
   - Slide number and title
   - Visual type (hero_image, chart, diagram, text_only, split_visual)
   - If hero_image or split_visual: detailed image prompt following the design brief
   - If chart: what data to visualize
   - Layout approach (full_bleed, side_by_side, centered, layered)

Return as JSON matching the DesignBrief interface.`

  // Make Claude API call
  // Parse response
  // Validate design brief

  return designBrief
}
```

### Phase 3: Orchestrated Generation Pipeline
**Update**: `/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/signaldeck-presentation/index.ts`

```typescript
async function generatePresentation(generationId: string, request: SignalDeckRequest) {
  const orgId = request.organization_id || 'default'

  try {
    // Step 0: Generate Design Brief (NEW)
    console.log('Step 0: Creative Director generating design brief...')
    const designBrief = await generateDesignBrief(
      request.approved_outline.topic,
      request.approved_outline.audience,
      request.approved_outline.purpose,
      request.approved_outline.sections
    )

    await setGenerationStatus({
      generationId,
      status: 'processing',
      progress: 5
    }, orgId, { designBrief })

    // Step 1: Generate content with Claude (using design brief)
    console.log('Step 1: Generating content...')
    const presentationData = await generatePresentationData(
      request.approved_outline,
      designBrief  // Pass design brief to Claude
    )

    await setGenerationStatus({
      generationId,
      status: 'processing',
      progress: 30
    }, orgId)

    // Step 2: Generate all visuals in parallel (NEW)
    console.log('Step 2: Generating visuals...')
    const visualPromises = designBrief.slideVisuals
      .filter(sv => sv.visualType === 'hero_image' || sv.visualType === 'split_visual')
      .map(sv => generateAIImage(sv.imagePrompt!, orgId, designBrief.imageStyle))

    const generatedImages = await Promise.all(visualPromises)

    // Map images back to slides
    const slideImages = new Map()
    generatedImages.forEach((img, i) => {
      const slideVisual = designBrief.slideVisuals.filter(
        sv => sv.visualType === 'hero_image' || sv.visualType === 'split_visual'
      )[i]
      slideImages.set(slideVisual.slideNumber, img)
    })

    await setGenerationStatus({
      generationId,
      status: 'processing',
      progress: 60
    }, orgId)

    // Step 3: Build PowerPoint with design brief + images
    console.log('Step 3: Building PowerPoint with creative direction...')
    const fileInfo = await buildPresentation(
      presentationData,
      designBrief,
      slideImages,
      generationId,
      orgId
    )

    // ... rest of pipeline
  }
}

// Updated image generation with design brief
async function generateAIImage(
  prompt: string,
  organizationId: string,
  imageStyle: DesignBrief['imageStyle']
): Promise<string | null> {
  try {
    console.log('🎨 Generating AI image with Vertex AI:', prompt)

    // Enhance prompt with design brief style
    const enhancedPrompt = `${prompt}. Style: ${imageStyle.type}, mood: ${imageStyle.mood.join(', ')}`

    const response = await fetch(`${SUPABASE_URL}/functions/v1/vertex-ai-visual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        type: 'image',  // FIX: Add type field
        prompt: enhancedPrompt,
        style: imageStyle.type === 'photorealistic' ? 'photorealistic' : 'digital_art',
        organizationId,
        aspectRatio: '16:9'
      })
    })

    if (!response.ok) {
      console.error('Vertex AI error:', response.statusText)
      return null
    }

    const data = await response.json()
    return data.imageUrl || data.images?.[0]?.url || null
  } catch (error) {
    console.error('Error generating AI image:', error)
    return null
  }
}
```

### Phase 4: Enhanced PowerPoint Builder
**Update**: `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/app/api/build-presentation/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    presentationData,
    designBrief,      // NEW
    slideImages,      // NEW
    organizationId
  } = body

  const pptx = new PptxGenJS()

  // Apply design brief to presentation
  pptx.author = 'SignalDesk'
  pptx.company = organizationId || 'SignalDesk'
  pptx.title = presentationData.title

  // Define theme from design brief
  const { colorPalette, typography } = designBrief

  for (let i = 0; i < presentationData.slides.length; i++) {
    const slideData = presentationData.slides[i]
    const slideVisual = designBrief.slideVisuals[i]
    const slide = pptx.addSlide()

    // Set background based on design brief
    slide.background = { color: colorPalette.background.replace('#', '') }

    if (slideVisual.layout === 'full_bleed' && slideImages.has(i)) {
      // Full-bleed image background
      slide.addImage({
        path: slideImages.get(i),
        x: 0,
        y: 0,
        w: '100%',
        h: '100%'
      })

      // Overlay title with semi-transparent background
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0,
        y: 0,
        w: '100%',
        h: 2,
        fill: { color: '000000', transparency: 50 }
      })

      slide.addText(slideData.title, {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 1,
        fontSize: 44,
        bold: typography.style === 'bold',
        color: 'FFFFFF',
        fontFace: typography.titleFont
      })

    } else if (slideVisual.layout === 'side_by_side') {
      // Content on left, visual on right
      slide.addText(slideData.title, {
        x: 0.5,
        y: 0.5,
        w: 4,
        h: 0.8,
        fontSize: 32,
        bold: true,
        color: colorPalette.primary.replace('#', ''),
        fontFace: typography.titleFont
      })

      // Bullets on left
      if (slideData.body) {
        const bulletText = slideData.body.map(point => ({
          text: point,
          options: {
            bullet: true,
            color: colorPalette.secondary.replace('#', ''),
            fontSize: 16,
            fontFace: typography.bodyFont
          }
        }))

        slide.addText(bulletText, {
          x: 0.5,
          y: 1.5,
          w: 4,
          h: 4.5
        })
      }

      // Image or chart on right
      if (slideImages.has(i)) {
        slide.addImage({
          path: slideImages.get(i),
          x: 5,
          y: 1.5,
          w: 4.5,
          h: 4.5,
          sizing: { type: 'contain' }
        })
      } else if (slideVisual.visualType === 'chart') {
        // Add chart with design brief colors
        slide.addChart(pptx.ChartType.bar, [...], {
          x: 5,
          y: 1.5,
          w: 4.5,
          h: 4.5,
          chartColors: [
            colorPalette.accent.replace('#', ''),
            ...colorPalette.supporting.map(c => c.replace('#', ''))
          ]
        })
      }

    } else if (slideVisual.layout === 'centered') {
      // Centered text-only slide (closing, section breaks)
      slide.addText(slideData.title, {
        x: 1,
        y: 2.5,
        w: 8,
        h: 2,
        fontSize: 54,
        bold: true,
        color: colorPalette.primary.replace('#', ''),
        align: 'center',
        valign: 'middle',
        fontFace: typography.titleFont
      })
    }

    // Add speaker notes if present
    if (slideData.notes) {
      slide.addNotes(slideData.notes)
    }
  }

  // Generate and return
  const pptxData = await pptx.write({ outputType: 'base64' }) as string
  // ... rest
}
```

## Benefits of Creative Orchestration

### 1. Professional Design Quality
- Consistent visual language across all slides
- Color psychology matched to audience
- Typography that supports message
- Professional layouts, not generic templates

### 2. Artistic & Creative
- AI-generated images that match presentation theme
- Custom visual style for each presentation
- Creative direction based on content and audience
- Mix of images, charts, and creative typography

### 3. Intelligent Automation
- Agent decides which slides need visuals
- Generates appropriate prompts for each slide
- Coordinates color, typography, and imagery
- Creates cohesive narrative flow

### 4. Working Vertex AI
- Fixes missing `type` field bug
- Properly authenticated calls
- Enhanced prompts with design direction
- Fallbacks for when API unavailable

## Example Flow

**Input**:
```
Topic: "Launching Our Creator Economy Platform"
Audience: "Venture Capital Investors"
Purpose: "Secure Series A funding"
```

**Creative Director Output**:
```json
{
  "visualStyle": "modern",
  "colorPalette": {
    "primary": "#1a1a2e",      // Dark blue - trust, professionalism
    "secondary": "#16213e",    // Navy - supporting text
    "accent": "#e94560",       // Coral - energy, innovation
    "background": "#f9f9f9",   // Off-white - clean
    "supporting": ["#0f3460", "#533483", "#f39c12"]
  },
  "typography": {
    "titleFont": "Montserrat",
    "bodyFont": "Open Sans",
    "style": "bold"
  },
  "imageStyle": {
    "type": "photorealistic",
    "mood": ["dynamic", "innovative", "professional"],
    "subjects": ["technology", "creators", "growth"]
  },
  "slideVisuals": [
    {
      "slideNumber": 0,
      "visualType": "hero_image",
      "imagePrompt": "Modern creator workspace with multiple screens showing content creation, vibrant lighting, professional photography, dynamic composition",
      "layout": "full_bleed"
    },
    {
      "slideNumber": 1,
      "visualType": "chart",
      "layout": "side_by_side"
    },
    {
      "slideNumber": 2,
      "visualType": "split_visual",
      "imagePrompt": "Diverse content creators collaborating in modern studio environment, bright natural lighting, professional setting",
      "layout": "side_by_side"
    }
  ]
}
```

**Result**: Professional presentation with:
- Stunning hero image on title slide
- Consistent coral accent color throughout
- Bold Montserrat titles
- Charts with matching color palette
- Professional creator imagery
- Cohesive design language

## Next Steps

1. **Immediate**: Fix Vertex AI `type` field bug (5 min)
2. **Phase 1**: Create Creative Director agent (2-3 hours)
3. **Phase 2**: Update generation pipeline with orchestration (1-2 hours)
4. **Phase 3**: Enhance PowerPoint builder with design brief support (2-3 hours)
5. **Testing**: Generate test presentations with different styles (1 hour)

## Files to Modify

1. ✅ `/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/signaldeck-presentation/index.ts` - Add `type: 'image'`
2. 🆕 `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/agents/signaldeck-creative-director.ts` - New agent
3. 🔄 `/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/signaldeck-presentation/index.ts` - Orchestration pipeline
4. 🔄 `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/app/api/build-presentation/route.ts` - Design brief integration

## Estimated Time
- Quick fix (Vertex AI): **5 minutes**
- Full creative orchestration: **6-8 hours**
- Testing and refinement: **2-3 hours**

**Total**: ~1 day of development for production-quality creative presentation generation
