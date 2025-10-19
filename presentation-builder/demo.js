#!/usr/bin/env node

/**
 * SignalDesk Presentation Builder - Demo Script
 * Generates a sample presentation to demonstrate capabilities
 */

const { PresentationOrchestrator } = require("./orchestrator");
const { PresentationBuilder } = require("./builder");

async function runDemo() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   SignalDesk AI Presentation Builder - DEMO               ║
╚═══════════════════════════════════════════════════════════╝

This demo will generate a sample presentation showing the system's
capabilities. This typically takes 30-60 seconds.
`);

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ Error: ANTHROPIC_API_KEY environment variable is required");
    console.error("\nSet it with:");
    console.error("  export ANTHROPIC_API_KEY='your-api-key-here'");
    console.error("\nOr create a .env file with:");
    console.error("  ANTHROPIC_API_KEY=your-key-here");
    process.exit(1);
  }

  try {
    // Demo prompt
    const demoPrompt = `Create a professional presentation about "The Future of AI in Strategic Communications"

This presentation should cover:
1. Current state of AI in PR and communications
2. Key technologies transforming the industry (LLMs, image generation, etc.)
3. Real-world applications and use cases
4. Benefits and ROI for organizations
5. Challenges and ethical considerations
6. Future trends and predictions
7. How to get started with AI in your organization

Target audience: PR and communications professionals
Tone: Professional but accessible, forward-thinking`;

    const demoContext = `This is a demo presentation for SignalDesk's AI Presentation Builder.
It showcases different slide types, layouts, and content generation capabilities.`;

    console.log("🎯 Generating demo presentation...\n");
    console.log("Topic: The Future of AI in Strategic Communications");
    console.log("Target: 8-10 slides\n");

    // Step 1: Orchestrate content
    const orchestrator = new PresentationOrchestrator({
      outputDir: "./output"
    });

    const presentationData = await orchestrator.createPresentation(demoPrompt, {
      context: demoContext,
      tone: "professional",
    });

    // Step 2: Build PowerPoint
    const builder = new PresentationBuilder({
      templatesDir: "./templates",
      outputDir: "./output",
      workDir: "./output/slides"
    });

    const outputPath = await builder.buildPresentation(
      presentationData, 
      "signaldesk-demo.pptx"
    );

    // Success!
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║   ✅ DEMO COMPLETE                                        ║
╚═══════════════════════════════════════════════════════════╝

📦 Demo Presentation: ${outputPath}
📊 Slides Generated: ${presentationData.slides.length}
📝 Title: ${presentationData.title}

What's Included:
  ✓ Title slide with gradient background
  ✓ Content slides with bullet points
  ✓ Visual slides (with image placeholders)
  ✓ Professional styling and layout
  ✓ Consistent theme colors
  ✓ Speaker notes for each slide

Next Steps:
  1. Open the presentation: open ${outputPath}
  2. Review the different slide types and layouts
  3. Try generating your own presentations
  4. Customize the templates in ./templates/

Example Commands:
  node index.js "Your presentation topic"
  node index.js "Q4 results" --output quarterly.pptx --slides 10
  node index.js "Crisis comms training" --tone professional

System Capabilities Demonstrated:
  ✓ AI content generation (Claude Sonnet 4)
  ✓ Multiple slide layouts (title, content, visual, quote, closing)
  ✓ Theme customization (colors, fonts, spacing)
  ✓ Professional design system
  ✓ PowerPoint export (.pptx)
  ✓ Speaker notes generation

Cost Breakdown for This Demo:
  • Content generation: ~$0.15 (Claude API)
  • Image generation: $0 (placeholder mode)
  • Total cost: ~$0.15

  Compare to Gamma: $10-20 per presentation
  Your savings: 97-99% 💰

Ready to Build More?
  Run: node index.js "Your presentation topic here"

Need Help?
  Run: node index.js --help
  Read: README.md
`);

    // Show slide breakdown
    console.log("\n📋 Slide Breakdown:");
    presentationData.slides.forEach((slide, i) => {
      console.log(`  ${i + 1}. ${slide.title} (${slide.type})`);
    });

    console.log("\n✨ Enjoy your demo presentation!\n");

  } catch (error) {
    console.error("\n❌ Demo failed:", error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run demo
if (require.main === module) {
  runDemo();
}

module.exports = { runDemo };
