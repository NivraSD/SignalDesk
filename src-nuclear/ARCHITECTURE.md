# 🚀 SignalDesk Nuclear Architecture - NIV as Master Orchestrator

## Core Concept: NIV is the Brain
Niv is not a feature - it's the PRIMARY INTERFACE that orchestrates all platform capabilities.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    NIV MASTER BRAIN                      │
│         "Ask anything, orchestrate everything"           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              ORCHESTRATION LAYER                         │
│  • Prompt Parser (understands user intent)               │
│  • Capability Router (knows what tools to use)           │
│  • Context Manager (maintains conversation state)        │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴─────────┬──────────┬──────────┬──────────┐
        ▼               ▼          ▼          ▼          ▼
┌──────────────┐ ┌──────────┐ ┌─────────┐ ┌────────┐ ┌─────────┐
│ INTELLIGENCE │ │ CONTENT  │ │  MEDIA  │ │ CRISIS │ │OPPORTUN │
│   PIPELINE   │ │GENERATOR │ │  LISTS  │ │COMMAND │ │ ENGINE  │
├──────────────┤ ├──────────┤ ├─────────┤ ├────────┤ ├─────────┤
│MultiStage    │ │AI Content│ │Journalist│ │Real-time│ │PR Opps  │
│Competitive   │ │Blog/PR   │ │Database  │ │Monitor  │ │Detection│
│Stakeholder   │ │Social    │ │Outreach  │ │Response │ │Strategy │
│Regulatory    │ │Reports   │ │Targeting │ │Scenarios│ │Timing   │
└──────────────┘ └──────────┘ └─────────┘ └────────┘ └─────────┘
        │               │          │          │          │
        └───────────────┴──────────┴──────────┴──────────┘
                                │
                    ┌───────────▼────────────┐
                    │   SUPABASE + MCPs      │
                    │  • Edge Functions       │
                    │  • Vector Search        │
                    │  • Real-time Data      │
                    └────────────────────────┘
```

## NIV Capabilities Matrix

| User Says | NIV Orchestrates | Output |
|-----------|------------------|--------|
| "What's happening with Nike?" | Intelligence Pipeline → Competitive Analysis → Media Monitoring | Full competitive brief |
| "Find me 10 journalists for our launch" | Media Lists → Intelligence → Outreach Strategy | Targeted media list with pitch angles |
| "Generate a crisis response for X" | Crisis Command → Intelligence → Content Generator | Complete response package |
| "What PR opportunities exist today?" | Opportunity Engine → Trend Analysis → Content Ideas | Actionable opportunities |
| "Create a thought leadership campaign" | Intelligence → Content Generator → Media Lists | Full campaign package |

## Implementation Structure

```
src-nuclear/
├── App.js (100 lines max)
├── core/
│   └── NivMasterBrain.js         # The orchestrator
│
├── capabilities/                  # What Niv can do
│   ├── intelligence/
│   │   ├── MultiStageIntelligence.js
│   │   ├── IntelligenceOrchestrator.js
│   │   └── IntelligenceDisplay.js
│   │
│   ├── content/
│   │   ├── ContentGenerator.js
│   │   ├── ContentTemplates.js
│   │   └── ContentOptimizer.js
│   │
│   ├── media/
│   │   ├── MediaListBuilder.js
│   │   ├── JournalistDatabase.js
│   │   └── OutreachStrategy.js
│   │
│   ├── crisis/
│   │   ├── CrisisCommandCenter.js
│   │   ├── RealTimeMonitor.js
│   │   └── ResponseGenerator.js
│   │
│   └── opportunities/
│       ├── OpportunityEngine.js
│       ├── OpportunityDetector.js
│       └── OpportunityStrategy.js
│
├── orchestration/
│   ├── PromptParser.js          # Understands what user wants
│   ├── CapabilityRouter.js      # Routes to right tools
│   ├── ContextManager.js        # Maintains state
│   └── ResponseBuilder.js       # Formats output
│
├── services/
│   ├── supabase.js              # Single instance
│   ├── mcpOrchestrator.js       # Manages all MCPs
│   └── intelligenceAPI.js       # All intel calls
│
└── ui/
    ├── NivChat.js               # The main interface
    ├── NivFloating.js           # Always available
    ├── Dashboard.js             # Visual overview
    └── components/
        ├── Loading.js
        ├── ErrorBoundary.js
        └── ResultDisplay.js
```

## The Magic: Prompt Library Integration

```javascript
// NivMasterBrain.js
class NivMasterBrain {
  async processPrompt(userInput) {
    // 1. Parse intent
    const intent = await this.parseIntent(userInput);
    
    // 2. Determine capabilities needed
    const capabilities = this.routeToCapabilities(intent);
    
    // 3. Execute orchestration
    const results = await this.orchestrate(capabilities);
    
    // 4. Format response
    return this.formatResponse(results);
  }

  async orchestrate(capabilities) {
    // Examples of orchestration:
    
    if (capabilities.includes('competitive_intel')) {
      // Run intelligence pipeline
      const intel = await this.intelligence.analyze();
      
      if (capabilities.includes('content_generation')) {
        // Generate content based on intel
        const content = await this.content.generate(intel);
        return { intel, content };
      }
    }
    
    if (capabilities.includes('media_outreach')) {
      // Get journalists
      const journalists = await this.media.findJournalists();
      
      // Get intelligence on what they write about
      const topics = await this.intelligence.analyzeJournalists(journalists);
      
      // Generate pitches
      const pitches = await this.content.generatePitches(topics);
      
      return { journalists, pitches };
    }
  }
}
```

## Example User Flows

### Flow 1: Morning Briefing
```
User: "Give me my morning briefing"
Niv: 
  1. Runs intelligence pipeline for overnight developments
  2. Checks opportunity engine for PR opportunities
  3. Monitors crisis indicators
  4. Generates executive summary via content generator
  5. Returns formatted briefing with action items
```

### Flow 2: Product Launch Prep
```
User: "Prepare for our product launch next week"
Niv:
  1. Analyzes competitor launches (intelligence)
  2. Identifies media opportunities (opportunity engine)
  3. Builds journalist list (media lists)
  4. Generates announcement content (content generator)
  5. Creates crisis scenarios (crisis command)
  6. Returns complete launch package
```

### Flow 3: Crisis Response
```
User: "We have a PR crisis about data breach"
Niv:
  1. Activates crisis command center
  2. Monitors real-time sentiment
  3. Generates holding statements
  4. Identifies key stakeholders to address
  5. Creates response timeline
  6. Returns crisis playbook
```

## The Key Insight

**Niv doesn't just answer questions - it orchestrates entire workflows across all platform capabilities to deliver complete solutions.**

Instead of:
- User navigates to Intelligence → runs analysis
- User goes to Content → generates content
- User opens Media → finds journalists

Now:
- User asks Niv: "Help me respond to competitor's announcement"
- Niv orchestrates everything and returns complete package

## Next Steps

1. Build NivMasterBrain.js as the central orchestrator
2. Create clean interfaces for each capability
3. Implement prompt parser to understand intent
4. Connect to existing MCPs and Edge Functions
5. Add conversation memory for context
```