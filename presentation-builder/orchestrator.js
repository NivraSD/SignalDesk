/**
 * SignalDesk AI Presentation Builder - Main Orchestrator
 * 
 * This orchestrates the entire presentation creation pipeline:
 * 1. Parse user intent
 * 2. Generate outline and structure
 * 3. Generate content for each slide
 * 4. Identify visual needs
 * 5. Generate images (via Vertex AI)
 * 6. Assemble presentation
 */

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs").promises;
const path = require("path");

class PresentationOrchestrator {
  constructor(config = {}) {
    this.anthropic = new Anthropic({
      apiKey: config.anthropicKey || process.env.ANTHROPIC_API_KEY,
    });
    this.vertexAIEndpoint = config.vertexAIEndpoint || process.env.VERTEX_AI_ENDPOINT;
    this.outputDir = config.outputDir || "./output";
  }

  /**
   * Main orchestration method - creates a complete presentation from a prompt
   */
  async createPresentation(userPrompt, options = {}) {
    console.log("🎯 Starting presentation generation...\n");
    console.log(`Prompt: ${userPrompt}\n`);

    try {
      // Step 1: Understand intent and generate outline
      console.log("📋 Step 1: Generating presentation outline...");
      const outline = await this.generateOutline(userPrompt, options);
      console.log(`✓ Generated ${outline.slides.length} slide outline\n`);

      // Step 2: Generate detailed content for each slide
      console.log("✍️  Step 2: Generating slide content...");
      const slides = await this.generateSlideContent(outline, options);
      console.log(`✓ Generated content for ${slides.length} slides\n`);

      // Step 3: Identify which slides need images
      console.log("🎨 Step 3: Identifying visual needs...");
      const visualNeeds = await this.identifyVisualNeeds(slides);
      console.log(`✓ Identified ${visualNeeds.imagesNeeded.length} slides needing images\n`);

      // Step 4: Generate images (if needed and Vertex AI is available)
      let images = [];
      if (visualNeeds.imagesNeeded.length > 0 && this.vertexAIEndpoint) {
        console.log("🖼️  Step 4: Generating images with Vertex AI...");
        images = await this.generateImages(visualNeeds.imagesNeeded);
        console.log(`✓ Generated ${images.length} images\n`);
      } else {
        console.log("⏭️  Step 4: Skipping image generation (no Vertex AI endpoint)\n");
      }

      // Step 5: Prepare presentation data
      const presentationData = {
        title: outline.title,
        slides: slides.map((slide, i) => ({
          ...slide,
          image: images.find(img => img.slideIndex === i),
        })),
        theme: outline.theme || {},
        metadata: {
          createdAt: new Date().toISOString(),
          prompt: userPrompt,
          slideCount: slides.length,
        },
      };

      // Save presentation data
      await this.savePresentationData(presentationData);

      console.log("✅ Presentation generation complete!\n");
      return presentationData;

    } catch (error) {
      console.error("❌ Error generating presentation:", error);
      throw error;
    }
  }

  /**
   * Generate outline and structure from user prompt
   */
  async generateOutline(userPrompt, options = {}) {
    const message = await this.anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: `You are an expert presentation designer. Create a detailed outline for a presentation based on this request:

"${userPrompt}"

${options.context ? `Additional context: ${options.context}` : ''}

Generate a presentation outline in JSON format with:
1. A compelling title
2. 5-12 slides (depending on topic complexity)
3. Each slide should have: title, type (title/content/visual/quote/closing), and key points
4. Suggest a color theme (primary, secondary, accent colors)
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

    const responseText = message.content[0].text;
    // Strip markdown code blocks if present
    const jsonText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(jsonText);
  }

  /**
   * Generate detailed content for each slide
   */
  async generateSlideContent(outline, options = {}) {
    const slides = [];

    for (let i = 0; i < outline.slides.length; i++) {
      const slideOutline = outline.slides[i];
      
      console.log(`  → Generating slide ${i + 1}/${outline.slides.length}: ${slideOutline.title}`);

      const message = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
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

      const responseText = message.content[0].text;
      const jsonText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const slideContent = JSON.parse(jsonText);

      slides.push({
        slideNumber: slideOutline.slideNumber,
        type: slideOutline.type,
        ...slideContent,
      });
    }

    return slides;
  }

  /**
   * Analyze which slides need images and what kind
   */
  async identifyVisualNeeds(slides) {
    const message = await this.anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `Analyze these presentation slides and identify which ones need images:

${JSON.stringify(slides.map((s, i) => ({
  slideIndex: i,
  title: s.title,
  type: s.type,
  visualDescription: s.visualDescription
})), null, 2)}

For each slide that needs an image:
1. Provide the slide index
2. Create a detailed, specific image generation prompt
3. Suggest image style (photo/illustration/abstract/diagram)

Only suggest images where they would significantly enhance the slide.
Title slides, visual-focused slides, and key concept slides usually benefit most.

Respond ONLY with valid JSON:
{
  "imagesNeeded": [
    {
      "slideIndex": 0,
      "prompt": "Detailed image generation prompt",
      "style": "photo"
    }
  ]
}`
      }]
    });

    const responseText = message.content[0].text;
    const jsonText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(jsonText);
  }

  /**
   * Generate images using Vertex AI (placeholder - you'll integrate with your existing endpoint)
   */
  async generateImages(imageRequests) {
    const images = [];

    for (const request of imageRequests) {
      console.log(`  → Generating image for slide ${request.slideIndex + 1}: ${request.prompt.substring(0, 50)}...`);

      // TODO: Replace with actual Vertex AI call
      // This should call your existing /api/supabase/functions/vertex-ai-visual endpoint
      
      // Placeholder response structure
      images.push({
        slideIndex: request.slideIndex,
        prompt: request.prompt,
        style: request.style,
        // In production, this would be the actual image URL or path
        placeholder: true,
        note: "Replace with actual Vertex AI integration"
      });
    }

    return images;
  }

  /**
   * Save presentation data to file
   */
  async savePresentationData(data) {
    const outputPath = path.join(this.outputDir, "presentation-data.json");
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved presentation data to: ${outputPath}`);
    return outputPath;
  }
}

// CLI usage
if (require.main === module) {
  const prompt = process.argv[2] || "Create a 7-slide presentation about the future of AI in strategic communications";
  
  const orchestrator = new PresentationOrchestrator({
    outputDir: "./output"
  });

  orchestrator.createPresentation(prompt)
    .then(result => {
      console.log("\n🎉 Success! Presentation data generated.");
      console.log(`   Slides: ${result.slides.length}`);
      console.log(`   Title: ${result.title}`);
      console.log("\nNext: Run the builder script to create the actual .pptx file");
    })
    .catch(error => {
      console.error("\n❌ Failed:", error.message);
      process.exit(1);
    });
}

module.exports = { PresentationOrchestrator };
