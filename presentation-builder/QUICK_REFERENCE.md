# Quick Reference Card

## Installation
```bash
cd signaldesk-presentation-builder
./setup.sh
export ANTHROPIC_API_KEY="your-key"
```

## Basic Commands
```bash
# Demo
npm run demo

# Simple presentation
node index.js "Your topic here"

# With options
node index.js "Topic" --output file.pptx --slides 10 --tone professional

# Help
node index.js --help
```

## File Structure
```
signaldesk-presentation-builder/
├── index.js                     # Main CLI (run this)
├── orchestrator.js              # Content generation (Claude)
├── builder.js                   # PowerPoint creation
├── demo.js                      # Demo script
├── setup.sh                     # Setup script
├── templates/
│   └── shared-styles.css        # Design system
├── edge-function-template.ts    # Supabase integration
└── output/                      # Generated files
```

## Integration Patterns

### Edge Function
```typescript
// Deploy to Supabase
cp edge-function-template.ts supabase/functions/signaldesk-presentation/

// Call from frontend
fetch('/api/supabase/functions/signaldesk-presentation', {
  method: 'POST',
  body: JSON.stringify({ prompt, slides: 10 })
})
```

### Direct Integration
```javascript
const { PresentationOrchestrator } = require('./orchestrator');
const orchestrator = new PresentationOrchestrator();
const data = await orchestrator.createPresentation(prompt, options);
```

### NIV Integration
```javascript
// Auto-generate from Blueprint
const context = `Campaign: ${blueprint.title}\nGoal: ${blueprint.goal}`;
const presentation = await orchestrator.createPresentation(
  "Campaign presentation",
  { context }
);
```

## Customization

### Colors (templates/shared-styles.css)
```css
:root {
  --color-primary: #1a1a2e;
  --color-secondary: #16213e;
  --color-accent: #0f3460;
  --color-text: #ffffff;
}
```

### Fonts
```css
:root {
  --font-heading: 'Your-Font', sans-serif;
  --font-body: 'Your-Font', sans-serif;
}
```

### Add New Slide Type (builder.js)
```javascript
generateNewSlideType(slide, css) {
  return `<!DOCTYPE html>...`;
}

// Add to switch statement
case "new-type":
  html = this.generateNewSlideType(slide, customCSS);
  break;
```

## Environment Variables
```bash
ANTHROPIC_API_KEY=sk-ant-...     # Required
VERTEX_AI_ENDPOINT=https://...   # Optional (for images)
```

## Costs
- Gamma: $10-20 per presentation
- SignalDesk AI: $2.50-6 per presentation
- Savings: 70%

## Slide Types
1. **title** - Hero slide with gradient
2. **content** - Bullets or paragraphs
3. **visual** - Two-column (text + image)
4. **quote** - Large quote with attribution
5. **closing** - Call to action

## Typical Workflow
```
1. User enters prompt
   ↓
2. Claude generates outline (10s)
   ↓
3. Claude generates content per slide (30s)
   ↓
4. Vertex AI generates images (optional, 20s)
   ↓
5. html2pptx builds PowerPoint (10s)
   ↓
6. Download .pptx file
```

## Troubleshooting

### "Cannot find module @ant/html2pptx"
```bash
npm install -g /mnt/skills/public/pptx/html2pptx.tgz
```

### "API key not found"
```bash
export ANTHROPIC_API_KEY="your-key"
```

### Slides look wrong
1. Edit `templates/shared-styles.css`
2. Regenerate presentation
3. Check `output/slides/*.html`

## Resources
- README.md - Complete guide
- GAMMA_COMPARISON.md - vs Gamma analysis
- PROJECT_SUMMARY.md - What's included
- setup.sh - Installation script
- demo.js - Working example

## Next Steps
1. Run demo: `npm run demo`
2. Customize colors/fonts
3. Integrate Vertex AI
4. Deploy edge function
5. Connect to NIV

---

📖 Full documentation: README.md
🎯 See comparison: GAMMA_COMPARISON.md
📦 Download: [computer:///mnt/user-data/outputs/signaldesk-presentation-builder](computer:///mnt/user-data/outputs/signaldesk-presentation-builder)
