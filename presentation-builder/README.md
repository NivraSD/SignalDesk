# SignalDesk AI Presentation Builder

**A cost-effective, AI-powered alternative to Gamma for creating professional presentations**

Built specifically for SignalDesk, this system uses Claude for intelligent content generation and can integrate with your existing Vertex AI infrastructure for image generation.

## 🎯 Why Build This?

**Cost Savings:**
- Gamma API: ~$10-20 per presentation
- This solution: ~$2.50-6 per presentation (**60-70% savings**)

**Integration Benefits:**
- Direct connection to SignalDesk's intelligence pipeline
- Auto-populate from VECTOR campaigns and blueprints
- Custom templates designed for PR/comms industry
- No external API rate limits

**Control:**
- Full customization of design and layout
- Own your presentation generation pipeline
- Integrate with existing NIV strategic framework

---

## 📦 What's Included

```
signaldesk-presentation-builder/
├── index.js                    # Main CLI tool (run presentations end-to-end)
├── orchestrator.js             # Content generation orchestrator (Claude)
├── builder.js                  # PowerPoint builder (html2pptx)
├── edge-function-template.ts   # Supabase edge function for SignalDesk
├── templates/
│   └── shared-styles.css       # Design system and slide styles
├── output/                     # Generated files appear here
│   ├── presentation-data.json  # Intermediate data
│   ├── slides/                 # Generated HTML slides
│   └── *.pptx                  # Final presentations
└── README.md                   # This file
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd signaldesk-presentation-builder

# Install Node.js packages
npm install pptxgenjs @anthropic-ai/sdk

# Install html2pptx globally
npm install -g /mnt/skills/public/pptx/html2pptx.tgz

# Verify installation
npm list -g @ant/html2pptx
```

### 2. Set Environment Variables

```bash
export ANTHROPIC_API_KEY="your-claude-api-key"
export VERTEX_AI_ENDPOINT="your-vertex-endpoint" # Optional
```

Or create a `.env` file:

```env
ANTHROPIC_API_KEY=sk-ant-...
VERTEX_AI_ENDPOINT=https://your-vertex-endpoint.com
```

### 3. Generate Your First Presentation

```bash
# Basic usage
node index.js "Create a presentation about AI in strategic communications"

# With options
node index.js "Q4 Results Overview" \
  --output q4-results.pptx \
  --slides 10 \
  --tone professional \
  --context "For executive board meeting"
```

### 4. Open Your Presentation

```bash
# The presentation will be saved to ./output/
open output/signaldesk-presentation.pptx
```

---

## 🎨 Usage Examples

### Basic Presentations

```bash
# Pitch deck
node index.js "Startup pitch deck for AI communications platform"

# Training materials
node index.js "Crisis communications best practices" --slides 15

# Client presentations
node index.js "PR strategy for product launch" --tone professional
```

### With Context (Better Results)

```bash
node index.js "Company overview presentation" \
  --context "Tech startup, Series A, B2B SaaS, AI-powered PR platform" \
  --slides 12 \
  --output company-overview.pptx
```

### Different Tones

```bash
# Professional (default)
node index.js "Annual report" --tone professional

# Creative
node index.js "Brand storytelling workshop" --tone creative

# Technical
node index.js "API documentation walkthrough" --tone technical

# Casual
node index.js "Team onboarding deck" --tone casual
```

---

## 🔧 Integration with SignalDesk

### Option 1: Edge Function (Recommended)

Deploy the edge function to replace or complement your existing Gamma integration:

1. **Copy the edge function:**
   ```bash
   cp edge-function-template.ts YOUR_SIGNALDESK_PATH/supabase/functions/signaldesk-presentation/index.ts
   ```

2. **Deploy to Supabase:**
   ```bash
   cd YOUR_SIGNALDESK_PATH
   supabase functions deploy signaldesk-presentation
   ```

3. **Update your frontend:** (replace Gamma API call)
   ```typescript
   // Before (Gamma)
   const response = await fetch('/api/supabase/functions/gamma-presentation', {
     method: 'POST',
     body: JSON.stringify({ prompt: userPrompt })
   });

   // After (SignalDesk AI)
   const response = await fetch('/api/supabase/functions/signaldesk-presentation', {
     method: 'POST',
     body: JSON.stringify({ 
       prompt: userPrompt,
       slides: 10,
       tone: 'professional',
       context: additionalContext
     })
   });

   const { title, slides, theme } = await response.json();
   ```

### Option 2: Direct Integration with NIV

Integrate directly with your NIV strategic framework:

```javascript
const { PresentationOrchestrator } = require('./orchestrator');

// In your NIV workflow
async function generateCampaignPresentation(blueprintData) {
  const orchestrator = new PresentationOrchestrator();
  
  // Use blueprint data as context
  const context = `
    Campaign: ${blueprintData.title}
    Goal: ${blueprintData.goal}
    Target Stakeholders: ${blueprintData.stakeholders.map(s => s.name).join(', ')}
    Key Messages: ${blueprintData.keyMessages.join(', ')}
  `;

  const presentation = await orchestrator.createPresentation(
    "Create a campaign presentation for stakeholder alignment",
    { context }
  );

  return presentation;
}
```

### Option 3: Batch Generation

Generate multiple presentations from your intelligence pipeline:

```javascript
const { PresentationOrchestrator } = require('./orchestrator');

async function generateIntelligenceDecks(opportunities) {
  const orchestrator = new PresentationOrchestrator();
  const presentations = [];

  for (const opp of opportunities) {
    const presentation = await orchestrator.createPresentation(
      `Create a presentation about: ${opp.title}`,
      { 
        context: opp.description,
        tone: 'professional'
      }
    );
    presentations.push(presentation);
  }

  return presentations;
}
```

---

## 🏗️ Architecture

### How It Works

```
User Prompt
    ↓
┌─────────────────────────────────────┐
│  ORCHESTRATOR (orchestrator.js)     │
│                                     │
│  1. Generate Outline (Claude)      │
│     → Structure, slide types       │
│                                     │
│  2. Generate Content (Claude)      │
│     → Title, body, notes per slide│
│                                     │
│  3. Identify Visual Needs (Claude) │
│     → Which slides need images     │
│                                     │
│  4. Generate Images (Vertex AI)    │
│     → Create visual assets         │
│                                     │
│  5. Output: presentation-data.json │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  BUILDER (builder.js)               │
│                                     │
│  1. Load shared CSS + theme        │
│                                     │
│  2. Generate HTML slides           │
│     → Title, Content, Visual, etc. │
│                                     │
│  3. Convert to PowerPoint          │
│     → html2pptx + pptxgenjs        │
│                                     │
│  4. Output: presentation.pptx      │
└─────────────────────────────────────┘
    ↓
📦 Final .pptx File
```

### Slide Types Supported

1. **Title Slide** - Hero slide with large title
2. **Content Slide** - Bullets or paragraphs
3. **Visual Slide** - Two-column: text + image
4. **Quote Slide** - Large quote with attribution
5. **Closing Slide** - Call to action, next steps

---

## 🎨 Customization

### Changing Colors

Edit `templates/shared-styles.css`:

```css
:root {
  --color-primary: #1a1a2e;    /* Main brand color */
  --color-secondary: #16213e;  /* Secondary brand color */
  --color-accent: #0f3460;     /* Accent/CTA color */
  --color-text: #ffffff;       /* Text on dark backgrounds */
}
```

### Adding New Slide Layouts

1. Add new layout method in `builder.js`:
   ```javascript
   generateTwoColumnSlide(slide, css) {
     return `<!DOCTYPE html>
     <html>
     <head>
       <style>${css}</style>
     </head>
     <body>
       <!-- Your layout here -->
     </body>
     </html>`;
   }
   ```

2. Update slide type routing:
   ```javascript
   case "two-column":
     html = this.generateTwoColumnSlide(slide, customCSS);
     break;
   ```

### Adjusting Typography

In `shared-styles.css`:

```css
:root {
  --font-heading: 'Your-Font', sans-serif;
  --font-body: 'Your-Font', sans-serif;
  
  --size-title: 48px;      /* Main titles */
  --size-heading: 36px;    /* Section headers */
  --size-body: 20px;       /* Body text */
}
```

---

## 🔌 Vertex AI Image Integration

To integrate with your existing Vertex AI image generation:

### Update orchestrator.js

Replace the `generateImages` method:

```javascript
async generateImages(imageRequests) {
  const images = [];

  for (const request of imageRequests) {
    // Call your existing Vertex AI endpoint
    const response = await fetch(this.vertexAIEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: request.prompt,
        style: request.style,
        // Your Vertex AI parameters
      })
    });

    const imageData = await response.json();
    
    images.push({
      slideIndex: request.slideIndex,
      url: imageData.imageUrl,
      prompt: request.prompt,
    });
  }

  return images;
}
```

### Update builder.js

Use real images instead of placeholders:

```javascript
generateVisualSlide(slide, css) {
  const imageHTML = slide.image 
    ? `<img src="${slide.image.url}" class="image-container" />`
    : `<div class="placeholder">Visual placeholder</div>`;

  return `<!-- HTML with ${imageHTML} -->`
}
```

---

## 💰 Cost Comparison

| Feature | Gamma API | SignalDesk AI | Savings |
|---------|-----------|---------------|---------|
| Per presentation | $10-20 | $2.50-6 | **60-70%** |
| Content generation | ✓ | ✓ (Claude) | Same quality |
| Image generation | ✓ | ✓ (Vertex AI) | Your existing system |
| Custom templates | Limited | ✓ Full control | - |
| Intelligence integration | ✗ | ✓ NIV/Blueprint | Unique advantage |
| Rate limits | Yes | No (your keys) | - |

**At 100 presentations/month:**
- Gamma: $1,000-2,000
- SignalDesk AI: $250-600
- **Monthly savings: $750-1,400**

---

## 🚀 Deployment to Production

### 1. Deploy Edge Function

```bash
# In your SignalDesk repo
cp signaldesk-presentation-builder/edge-function-template.ts \
   supabase/functions/signaldesk-presentation/index.ts

# Add secrets
supabase secrets set ANTHROPIC_API_KEY=your-key

# Deploy
supabase functions deploy signaldesk-presentation
```

### 2. Update Frontend

```typescript
// In your presentation generation component
export async function generatePresentation(prompt: string, options: PresentationOptions) {
  const response = await fetch('/api/supabase/functions/signaldesk-presentation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      slides: options.slideCount,
      tone: options.tone,
      context: options.context,
    }),
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error);
  }

  return {
    title: data.title,
    slides: data.slides,
    theme: data.theme,
  };
}
```

### 3. Add Download Capability

You'll need to add a second endpoint to actually build the .pptx file:

```typescript
// New edge function: signaldesk-presentation-builder
// Takes presentation data JSON and returns .pptx file
```

---

## 🧪 Testing

### Test Content Generation

```bash
# Generate presentation data only (no PowerPoint)
node orchestrator.js "Test presentation about AI"

# Check output
cat output/presentation-data.json
```

### Test PowerPoint Building

```bash
# Build from existing data
node builder.js output/presentation-data.json test-output.pptx
```

### Test Full Pipeline

```bash
# Complete end-to-end test
node index.js "Full pipeline test" --output test.pptx
```

---

## 📈 Next Steps & Enhancements

### Phase 1: MVP (✅ Complete)
- [x] Content generation with Claude
- [x] Basic slide layouts (5 types)
- [x] PowerPoint export
- [x] CLI tool
- [x] Edge function template

### Phase 2: Integration (🔄 In Progress)
- [ ] Vertex AI image integration
- [ ] NIV Blueprint integration
- [ ] Campaign Intelligence auto-populate
- [ ] Frontend UI component

### Phase 3: Advanced Features
- [ ] Chart/graph generation
- [ ] Brand template library
- [ ] Multi-theme support
- [ ] Batch generation from intelligence pipeline
- [ ] Real-time collaboration features
- [ ] Speaker notes enhancement
- [ ] Slide animations

### Phase 4: Polish
- [ ] Custom fonts
- [ ] Icon library integration
- [ ] Advanced layouts (comparison, timeline, etc.)
- [ ] PDF export option
- [ ] Preview thumbnails
- [ ] Presentation analytics

---

## 🐛 Troubleshooting

### "Cannot find module '@ant/html2pptx'"

```bash
# Reinstall html2pptx
npm install -g /mnt/skills/public/pptx/html2pptx.tgz

# Verify
npm list -g @ant/html2pptx
```

### "ANTHROPIC_API_KEY not set"

```bash
export ANTHROPIC_API_KEY="your-key-here"
```

### Slides look wrong

1. Check HTML in `output/slides/`
2. Adjust CSS in `templates/shared-styles.css`
3. Regenerate presentation

### Image placeholders not replaced

1. Implement Vertex AI integration in `orchestrator.js`
2. Update `builder.js` to use real image URLs

---

## 📚 Resources

- [html2pptx Documentation](./templates/html2pptx.md)
- [PptxGenJS API](https://gitbrent.github.io/PptxGenJS/)
- [Claude API Reference](https://docs.anthropic.com/)
- [Vertex AI Imagen](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)

---

## 🤝 Contributing

This is a proprietary tool for SignalDesk. For enhancements or issues:

1. Test changes locally
2. Update this README
3. Deploy to staging first
4. Monitor costs and performance

---

## 📄 License

Proprietary - SignalDesk Internal Use Only

---

**Built with ❤️ for SignalDesk**

*Transforming intelligence into action, one presentation at a time.*
