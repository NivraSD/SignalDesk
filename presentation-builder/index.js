#!/usr/bin/env node

/**
 * SignalDesk AI Presentation Generator
 * Complete end-to-end CLI tool
 */

const { PresentationOrchestrator } = require("./orchestrator");
const { PresentationBuilder } = require("./builder");
const fs = require("fs").promises;
const path = require("path");

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║   SignalDesk AI Presentation Generator                   ║
╚═══════════════════════════════════════════════════════════╝

Usage:
  node index.js "<prompt>" [options]

Examples:
  node index.js "Create a pitch deck for an AI startup"
  node index.js "Presentation about Q4 results" --output quarterly-review.pptx
  node index.js "Training deck on crisis communications" --slides 12

Options:
  --output <filename>    Output filename (default: presentation.pptx)
  --slides <number>      Approximate number of slides (AI will adjust)
  --tone <style>         Tone: professional/casual/creative/technical
  --context "<text>"     Additional context for the AI
  --help, -h             Show this help message

Environment Variables:
  ANTHROPIC_API_KEY      Your Anthropic API key (required)
  VERTEX_AI_ENDPOINT     Your Vertex AI endpoint URL (optional)

Examples with options:
  node index.js "AI in healthcare" --tone professional --slides 10
  node index.js "Company overview" --context "For investor meeting" --output pitch.pptx
`);
    process.exit(0);
  }

  const prompt = args[0];
  
  // Parse options
  const options = {
    output: getOption(args, "--output", "signaldesk-presentation.pptx"),
    slides: parseInt(getOption(args, "--slides", "0")),
    tone: getOption(args, "--tone", ""),
    context: getOption(args, "--context", ""),
  };

  // Validate API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ Error: ANTHROPIC_API_KEY environment variable is required");
    console.error("\nSet it with:");
    console.error("  export ANTHROPIC_API_KEY='your-api-key-here'");
    process.exit(1);
  }

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   SignalDesk AI Presentation Generator                   ║
╚═══════════════════════════════════════════════════════════╝
`);

  console.log(`📝 Prompt: "${prompt}"`);
  if (options.context) console.log(`📋 Context: "${options.context}"`);
  if (options.tone) console.log(`🎨 Tone: ${options.tone}`);
  if (options.slides > 0) console.log(`📊 Target slides: ~${options.slides}`);
  console.log("");

  try {
    // Step 1: Orchestrate content generation
    const orchestrator = new PresentationOrchestrator({
      outputDir: "./output"
    });

    const presentationData = await orchestrator.createPresentation(prompt, {
      context: options.context,
      tone: options.tone,
      targetSlides: options.slides > 0 ? options.slides : undefined,
    });

    // Step 2: Build PowerPoint
    const builder = new PresentationBuilder({
      templatesDir: "./templates",
      outputDir: "./output",
      workDir: "./output/slides"
    });

    const outputPath = await builder.buildPresentation(presentationData, options.output);

    // Success summary
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║   ✅ GENERATION COMPLETE                                  ║
╚═══════════════════════════════════════════════════════════╝

📦 File: ${outputPath}
📊 Slides: ${presentationData.slides.length}
📝 Title: ${presentationData.title}

Next steps:
  1. Open the presentation in PowerPoint or Google Slides
  2. Review and customize content as needed
  3. Replace image placeholders with actual images
  4. Adjust theme colors in the master slide

Pro tips:
  • Use --tone to match your audience (professional/casual/creative)
  • Use --context to provide background information
  • Use --slides to control presentation length
`);

    // Cost estimate (approximate)
    const estimatedCost = (presentationData.slides.length * 0.05).toFixed(2);
    console.log(`💰 Estimated API cost: ~$${estimatedCost} (Claude only)\n`);

  } catch (error) {
    console.error("\n❌ Generation failed:", error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function getOption(args, flag, defaultValue) {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return defaultValue;
}

// Run
if (require.main === module) {
  main();
}

module.exports = { main };
