/**
 * SignalDesk Edge Function: AI Presentation Generator
 * 
 * Drop-in replacement for gamma-presentation edge function
 * Uses Claude for content generation instead of Gamma API
 * 
 * Deploy to: /api/supabase/functions/signaldesk-presentation
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.20.0";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, slides, tone, context } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Claude
    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
    });

    // Step 1: Generate outline
    console.log("Generating presentation outline...");
    const outlineMessage = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: `You are an expert presentation designer. Create a detailed outline for a presentation based on this request:

"${prompt}"

${context ? `Additional context: ${context}` : ''}
${tone ? `Desired tone: ${tone}` : ''}
${slides ? `Target slide count: approximately ${slides} slides` : ''}

Generate a presentation outline in JSON format with:
1. A compelling title
2. ${slides || '6-10'} slides (depending on topic complexity)
3. Each slide should have: title, type (title/content/visual/quote/closing), and key points
4. Suggest a color theme (primary, secondary, accent colors in hex format)
5. Recommend overall tone (professional/casual/creative/technical)

Respond ONLY with valid JSON in this exact format:
{
  "title": "Presentation Title",
  "slideCount": 8,
  "theme": {
    "primary": "#1a1a2e",
    "secondary": "#16213e",
    "accent": "#0f3460",
    "text": "#ffffff"
  },
  "tone": "professional",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "type": "title",
      "keyPoints": ["Main message or tagline"]
    }
  ]
}`
      }]
    });

    const outlineText = outlineMessage.content[0].text;
    const outline = JSON.parse(outlineText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());

    // Step 2: Generate content for each slide
    console.log(`Generating content for ${outline.slides.length} slides...`);
    const slides_content = [];

    for (let i = 0; i < outline.slides.length; i++) {
      const slideOutline = outline.slides[i];
      
      const contentMessage = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: `Generate detailed content for this presentation slide:

**Presentation Title:** ${outline.title}
**Slide ${slideOutline.slideNumber} of ${outline.slideCount}**
**Slide Title:** ${slideOutline.title}
**Slide Type:** ${slideOutline.type}
**Key Points:** ${JSON.stringify(slideOutline.keyPoints)}
**Tone:** ${outline.tone}

Generate:
1. Polished slide title (if needed, improve the draft title)
2. Body content (3-5 bullet points or 2-3 short paragraphs, depending on type)
3. Speaker notes (2-3 sentences of what to say)
4. Suggested visual (if applicable): describe what image would enhance this slide

Keep content concise and impactful. For "${slideOutline.type}" slides:
- title: Bold opening, minimal text, strong visual
- content: Clear structure, scannable bullets
- visual: Focus on image with minimal text
- quote: Attribution and context
- closing: Call to action, next steps

Respond ONLY with valid JSON:
{
  "title": "Polished Title",
  "body": ["Bullet 1", "Bullet 2", "Bullet 3"],
  "speakerNotes": "What to say when presenting this slide",
  "visualDescription": "Description of ideal image (or null if no image needed)"
}`
        }]
      });

      const contentText = contentMessage.content[0].text;
      const slideContent = JSON.parse(contentText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());

      slides_content.push({
        slideNumber: slideOutline.slideNumber,
        type: slideOutline.type,
        ...slideContent,
      });
    }

    // Step 3: Return presentation data
    const presentation = {
      success: true,
      title: outline.title,
      slideCount: slides_content.length,
      theme: outline.theme,
      slides: slides_content,
      metadata: {
        createdAt: new Date().toISOString(),
        generator: "SignalDesk AI",
        model: "claude-haiku-4-5-20251001",
      },
    };

    console.log(`✓ Generated ${slides_content.length}-slide presentation`);

    return new Response(
      JSON.stringify(presentation),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error generating presentation:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
