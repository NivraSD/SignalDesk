/**
 * SignalDeck Creative Director Agent
 *
 * This agent acts as a professional presentation designer, analyzing the presentation
 * requirements and generating comprehensive design briefs that guide visual creation,
 * layout, and overall aesthetic direction.
 */

export interface DesignBrief {
  visualStyle: 'modern' | 'corporate' | 'playful' | 'dramatic' | 'minimal' | 'bold' | 'elegant'
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
    style: 'bold' | 'elegant' | 'tech' | 'traditional' | 'playful' | 'minimal'
  }
  imageStyle: {
    type: 'photorealistic' | 'illustration' | 'abstract' | 'diagram' | 'mixed'
    mood: string[]  // e.g., ['professional', 'inspiring', 'dynamic']
    subjects: string[]  // What to show in images
  }
  slideVisuals: Array<{
    slideNumber: number
    slideTitle: string
    visualType: 'hero_image' | 'chart' | 'diagram' | 'text_only' | 'split_visual' | 'layered'
    imagePrompt?: string  // If hero_image, split_visual, or layered
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
Create a comprehensive design brief that will guide the creation of this presentation. Consider:
- WHO is the audience? (investors, executives, consumers, technical team, etc.)
- WHAT is the purpose? (persuade, inform, inspire, sell, educate)
- WHAT mood should the presentation convey? (professional, innovative, urgent, friendly, bold)
- WHAT visual style matches the content and audience?

DESIGN BRIEF STRUCTURE:

1. VISUAL STYLE
Choose ONE: modern, corporate, playful, dramatic, minimal, bold, elegant
Consider the audience and purpose. Examples:
- VCs/Investors → modern, bold (show innovation and confidence)
- Enterprise clients → corporate, elegant (trust and professionalism)
- Consumers → playful, dramatic (emotional connection)
- Technical teams → minimal, modern (clarity and focus)

2. COLOR PALETTE
Generate 5 colors (all in hex format with #):
- Primary: Main color for titles and key elements (consider color psychology)
- Secondary: Supporting text and elements
- Accent: Highlights, CTAs, important callouts (should pop!)
- Background: Slide backgrounds (usually light or dark)
- Supporting: Array of 3-4 colors for charts, variety, visual interest

Color Psychology Guide:
- Blue: Trust, professionalism, stability (corporate, finance)
- Red/Coral: Energy, passion, urgency (sales, launches)
- Green: Growth, sustainability, health (environment, wellness)
- Purple: Innovation, luxury, creativity (tech, premium)
- Orange: Enthusiasm, creativity, fun (consumer, creative)
- Dark colors: Sophistication, premium, serious
- Bright colors: Energy, youth, approachable

3. TYPOGRAPHY
Suggest:
- Title font: Font family for slide titles (e.g., Montserrat, Playfair Display, Roboto)
- Body font: Font family for body text (e.g., Open Sans, Lato, Georgia)
- Style: bold/elegant/tech/traditional/playful/minimal

Font pairing guide:
- Bold + Modern: Montserrat + Open Sans
- Elegant + Classic: Playfair Display + Lato
- Tech + Clean: Roboto + Inter
- Traditional: Georgia + Arial
- Playful: Quicksand + Nunito

4. IMAGE STYLE
Define:
- Type: photorealistic, illustration, abstract, diagram, or mixed
- Mood: 3-5 adjectives describing the feel (e.g., "dynamic", "professional", "inspiring")
- Subjects: What should images show? (e.g., "technology", "teamwork", "data visualization")

5. SLIDE-BY-SLIDE VISUAL PLAN
For EACH slide (including title slide), specify:

SLIDE 0 (Title Slide):
- Always use "hero_image" or "full_bleed" to make strong first impression
- Generate detailed image prompt that captures the essence of the presentation topic
- Use dramatic, eye-catching imagery

SLIDES 1-N (Content Slides):
For each section, choose the appropriate visual type:

- hero_image: Full-slide background image with text overlay
  * Use for: Emotional slides, section breaks, powerful messages
  * Provide detailed image prompt following the image style

- chart: Data visualization
  * Use for: Statistics, trends, comparisons, growth metrics
  * Specify chart type (bar, line, pie, column, area)
  * Describe what data should be shown

- split_visual: Content on one side, image on other
  * Use for: Balancing information with visual interest
  * Provide image prompt for the visual side

- text_only: Just text with creative typography
  * Use for: Quotes, key messages, conclusions
  * Use centered or creative_grid layouts

- layered: Image background with content boxes/cards on top
  * Use for: Complex slides with multiple elements
  * Provide background image prompt

Layout guidelines:
- full_bleed: Image covers entire slide (for hero_image)
- side_by_side: Split 50/50 (for split_visual, chart)
- centered: Centered text (for text_only, quotes)
- layered: Background image with overlays (for layered)
- creative_grid: Asymmetric, modern layouts (for variety)

IMAGE PROMPT REQUIREMENTS:
When generating image prompts, be SPECIFIC and DETAILED:
❌ Bad: "office workspace"
✅ Good: "Modern tech startup office with glass walls, natural lighting, diverse team collaborating around large monitor displaying analytics dashboards, vibrant atmosphere, contemporary interior design, shot from dynamic angle"

Include in prompts:
- Specific subject/scene
- Lighting (natural, dramatic, soft, bright)
- Mood/atmosphere
- Composition (wide shot, close-up, dynamic angle)
- Style details (modern, minimalist, vibrant, professional)
- Colors that match palette (if relevant)

6. RATIONALE
Explain your design choices:
- Why this visual style for this audience?
- How do the colors support the message?
- Why this typography approach?
- What's the image direction trying to achieve?

RETURN FORMAT:
Return ONLY valid JSON matching this exact structure (no markdown, no extra text):

{
  "visualStyle": "modern",
  "colorPalette": {
    "primary": "#1a1a2e",
    "secondary": "#16213e",
    "accent": "#e94560",
    "background": "#f9f9f9",
    "supporting": ["#0f3460", "#533483", "#f39c12", "#2ecc71"]
  },
  "typography": {
    "titleFont": "Montserrat",
    "bodyFont": "Open Sans",
    "style": "bold"
  },
  "imageStyle": {
    "type": "photorealistic",
    "mood": ["dynamic", "innovative", "professional", "inspiring"],
    "subjects": ["technology", "collaboration", "growth", "innovation"]
  },
  "slideVisuals": [
    {
      "slideNumber": 0,
      "slideTitle": "Title Slide",
      "visualType": "hero_image",
      "imagePrompt": "Detailed, specific image prompt here...",
      "layout": "full_bleed"
    },
    {
      "slideNumber": 1,
      "slideTitle": "Growth Metrics",
      "visualType": "chart",
      "chartType": "bar",
      "chartDescription": "Year-over-year revenue growth",
      "layout": "side_by_side"
    }
  ],
  "rationale": {
    "styleChoice": "Modern style chosen because...",
    "colorPsychology": "Dark blue for trust, coral accent for innovation...",
    "typographyReason": "Bold Montserrat conveys confidence...",
    "imageDirection": "Photorealistic images showing actual use cases..."
  }
}

IMPORTANT:
- Return ONLY the JSON object
- No markdown code blocks
- No additional text before or after
- Ensure all hex colors start with #
- Generate specific, detailed image prompts
- Include slideVisuals for title slide (0) + all ${outline.sections.length} content slides + closing slide
- Total slides: ${outline.sections.length + 2} (title + content + closing)`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 12000,  // Large context for detailed design brief
        temperature: 0.8,    // Creative but focused
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Claude API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    let content = data.content?.[0]?.text

    if (!content) {
      throw new Error('No content in Claude response')
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response')
    }

    content = jsonMatch[0]

    console.log('📝 Parsing design brief JSON...')
    const designBrief: DesignBrief = JSON.parse(content)

    // Validate structure
    if (!designBrief.visualStyle || !designBrief.colorPalette || !designBrief.slideVisuals) {
      throw new Error('Invalid design brief structure')
    }

    console.log('✅ Design brief created:', {
      style: designBrief.visualStyle,
      colors: designBrief.colorPalette.primary,
      slides: designBrief.slideVisuals.length,
      imageSlides: designBrief.slideVisuals.filter(s =>
        s.visualType === 'hero_image' || s.visualType === 'split_visual' || s.visualType === 'layered'
      ).length,
      chartSlides: designBrief.slideVisuals.filter(s => s.visualType === 'chart').length
    })

    return designBrief
  } catch (error) {
    console.error('❌ Creative Director error:', error)

    // Fallback to basic design brief
    console.log('⚠️ Using fallback design brief')
    return createFallbackDesignBrief(outline)
  }
}

function createFallbackDesignBrief(outline: PresentationOutline): DesignBrief {
  // Create a basic but professional design brief
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
      mood: ['professional', 'clean', 'modern'],
      subjects: ['business', 'technology', 'collaboration']
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
        visualType: (section.visual_suggestion?.toLowerCase().includes('chart') ? 'chart' : 'text_only') as any,
        chartType: 'bar' as const,
        chartDescription: section.visual_suggestion || '',
        layout: 'side_by_side' as const
      })),
      {
        slideNumber: outline.sections.length + 1,
        slideTitle: 'Thank You',
        visualType: 'text_only',
        layout: 'centered'
      }
    ],
    rationale: {
      styleChoice: 'Modern style for professional appearance',
      colorPsychology: 'Blue tones for trust and professionalism',
      typographyReason: 'Clean, readable fonts for clarity',
      imageDirection: 'Professional imagery to support key messages'
    }
  }
}
