/**
 * SignalDeck Creative Director - Deno Edge Function Version
 *
 * Generates comprehensive design briefs for presentations
 */

export interface DesignBrief {
  visualStyle: 'modern' | 'corporate' | 'playful' | 'dramatic' | 'minimal' | 'bold' | 'elegant'
  colorPalette: {
    primary: string
    secondary: string
    accent: string
    background: string
    supporting: string[]
  }
  typography: {
    titleFont: string
    bodyFont: string
    style: 'bold' | 'elegant' | 'tech' | 'traditional' | 'playful' | 'minimal'
  }
  imageStyle: {
    type: 'photorealistic' | 'illustration' | 'abstract' | 'diagram' | 'mixed'
    mood: string[]
    subjects: string[]
  }
  slideVisuals: Array<{
    slideNumber: number
    slideTitle: string
    visualType: 'hero_image' | 'chart' | 'diagram' | 'text_only' | 'split_visual' | 'layered'
    imagePrompt?: string
    chartType?: 'bar' | 'line' | 'pie' | 'column' | 'area'
    chartDescription?: string
    layout: 'full_bleed' | 'side_by_side' | 'centered' | 'layered' | 'creative_grid'
  }>
  rationale: {
    styleChoice: string
    colorPsychology: string
    typographyReason: string
    imageDirection: string
  }
}

interface PresentationOutline {
  topic: string
  audience: string
  purpose: string
  key_messages: string[]
  sections: Array<{
    title: string
    talking_points: string[]
    visual_suggestion?: string
  }>
}

export async function generateDesignBrief(
  outline: PresentationOutline,
  anthropicApiKey: string
): Promise<DesignBrief> {
  console.log('🎨 Creative Director: Analyzing presentation requirements...')

  const totalSlides = outline.sections.length + 2 // title + sections + closing

  const prompt = `You are a world-class presentation designer with expertise in visual communication, color theory, typography, and brand strategy. You're creating a design brief for a PowerPoint presentation.

PRESENTATION DETAILS:
Topic: ${outline.topic}
Audience: ${outline.audience}
Purpose: ${outline.purpose}

Key Messages:
${outline.key_messages.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Sections (${outline.sections.length} content slides):
${outline.sections.map((s, i) => `
Slide ${i + 2}: ${s.title}
Talking Points: ${s.talking_points.join('; ')}
Visual Suggestion: ${s.visual_suggestion || 'none provided'}
`).join('\n')}

YOUR TASK:
Create a comprehensive design brief that will guide the creation of this presentation. Total slides: ${totalSlides} (title slide + ${outline.sections.length} content slides + closing slide)

Consider:
- WHO is the audience? (investors, executives, consumers, technical team)
- WHAT is the purpose? (persuade, inform, inspire, sell)
- WHAT mood should it convey? (professional, innovative, urgent, friendly)

Generate a design brief with:

1. VISUAL STYLE: modern/corporate/playful/dramatic/minimal/bold/elegant
2. COLOR PALETTE: 5 colors in hex format (#RRGGBB)
   - Primary, Secondary, Accent, Background, Supporting (array of 3-4 colors)
3. TYPOGRAPHY: Title font, Body font, Style
4. IMAGE STYLE: Type, Mood (array), Subjects (array)
5. SLIDE-BY-SLIDE VISUAL PLAN (${totalSlides} slides total)

IMAGE PROMPTS MUST BE DETAILED:
✅ Good: "Modern tech startup office with glass walls, natural lighting, diverse team collaborating around large monitor displaying analytics, vibrant atmosphere, contemporary interior design"
❌ Bad: "office workspace"

Return ONLY valid JSON (no markdown, no extra text):
{
  "visualStyle": "modern",
  "colorPalette": {
    "primary": "#1a1a2e",
    "secondary": "#16213e",
    "accent": "#e94560",
    "background": "#f9f9f9",
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
    "subjects": ["technology", "collaboration", "growth"]
  },
  "slideVisuals": [
    {
      "slideNumber": 0,
      "slideTitle": "Title Slide",
      "visualType": "hero_image",
      "imagePrompt": "Detailed image prompt...",
      "layout": "full_bleed"
    }
  ],
  "rationale": {
    "styleChoice": "Modern style because...",
    "colorPsychology": "Blue for trust...",
    "typographyReason": "Bold fonts for confidence...",
    "imageDirection": "Photorealistic to show reality..."
  }
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 12000,
        temperature: 0.8,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    let content = data.content?.[0]?.text

    if (!content) {
      throw new Error('No content in Claude response')
    }

    // Extract JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const designBrief: DesignBrief = JSON.parse(jsonMatch[0])

    console.log('✅ Design brief created:', {
      style: designBrief.visualStyle,
      colors: designBrief.colorPalette.primary,
      slides: designBrief.slideVisuals.length,
      imageSlides: designBrief.slideVisuals.filter(s =>
        s.visualType === 'hero_image' || s.visualType === 'split_visual'
      ).length
    })

    return designBrief
  } catch (error) {
    console.error('❌ Creative Director error:', error)
    console.log('⚠️ Using fallback design brief')
    return createFallbackDesignBrief(outline)
  }
}

function createFallbackDesignBrief(outline: PresentationOutline): DesignBrief {
  return {
    visualStyle: 'modern',
    colorPalette: {
      primary: '#1a1a2e',
      secondary: '#16213e',
      accent: '#0f3460',
      background: '#ffffff',
      supporting: ['#4A90E2', '#50C878', '#FF6B6B', '#FFD93D']
    },
    typography: {
      titleFont: 'Arial',
      bodyFont: 'Arial',
      style: 'bold'
    },
    imageStyle: {
      type: 'photorealistic',
      mood: ['professional', 'clean'],
      subjects: ['business', 'technology']
    },
    slideVisuals: [
      {
        slideNumber: 0,
        slideTitle: outline.topic,
        visualType: 'text_only',
        layout: 'centered'
      },
      ...outline.sections.map((section, i) => ({
        slideNumber: i + 1,
        slideTitle: section.title,
        visualType: 'text_only' as const,
        layout: 'side_by_side' as const
      })),
      {
        slideNumber: outline.sections.length + 1,
        slideTitle: 'Thank You',
        visualType: 'text_only' as const,
        layout: 'centered' as const
      }
    ],
    rationale: {
      styleChoice: 'Modern style for professional appearance',
      colorPsychology: 'Blue tones for trust',
      typographyReason: 'Clean fonts for clarity',
      imageDirection: 'Professional imagery'
    }
  }
}
