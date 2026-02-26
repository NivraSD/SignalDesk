# SignalDesk Enhancement Workplan
## Integrating MCP Intelligence into Platform Features

**Created:** August 15, 2025  
**Version:** 2.0 - Post-MCP Integration  
**Status:** Ready for Implementation

---

## Executive Summary

This workplan outlines how to integrate the 11 MCP servers, cascade intelligence, and opportunity detection engine into the SignalDesk platform UI/UX, using the Content Generator as the design model and making Niv adaptive to user context.

---

## Core Implementation Principles

### 1. Content Generator as UI/UX Model

The Content Generator's successful pattern:
- **Clean, focused interface** with type selection
- **Contextual options** that appear based on selection
- **Preview/Edit modes** for content refinement
- **Seamless Niv integration** for AI assistance

### 2. Niv's Adaptive Behavior

```javascript
// Niv adapts based on context
if (user.selectedFeature === 'OpportunityEngine') {
  niv.personality = 'opportunity_hunter';
  niv.focus = 'identifying_and_scoring_opportunities';
  niv.suggestions = opportunitySpecific;
} else if (user.selectedFeature === 'IntelligenceMonitoring') {
  niv.personality = 'intelligence_analyst';
  niv.focus = 'pattern_detection_and_insights';
  niv.suggestions = intelligenceSpecific;
}
```

### 3. Intent Detection for Feature Access

```javascript
// Niv detects user intent and opens features
nivIntentDetection: {
  "I need to monitor Stripe": → Opens Intelligence Monitoring with Stripe pre-filled
  "Show me cascade effects": → Opens Cascade Predictor interface
  "Find PR opportunities": → Opens Opportunity Engine
  "Track competitor moves": → Opens Competitor Intelligence
}
```

---

## Phase 1: Core MCP Integration (Week 1-2)

### 1.1 Opportunity Engine Enhancement

**UI Updates** (Following Content Generator Model):

```javascript
// New OpportunityEngine.js structure
{
  modes: [
    'Discover',     // Find new opportunities
    'Monitor',      // Track specific patterns
    'Cascade',      // Predict cascade effects
    'Action'        // Execute on opportunities
  ],
  
  // Like Content Generator's type selection
  opportunityTypes: [
    'Competitor Weakness',
    'Narrative Vacuum',
    'Cascade Event',
    'Breaking News',
    'Trending Topic'
  ],
  
  // Contextual options appear based on type
  contextualActions: {
    'Competitor Weakness': ['Analyze Impact', 'Draft Response', 'Track Changes'],
    'Cascade Event': ['Predict Effects', 'Identify Windows', 'Plan Response']
  }
}
```

**Backend Integration**:
- Connect to `signaldesk-scraper` for real-time monitoring
- Use `signaldesk-intelligence` for market analysis
- Leverage cascade predictor for effect prediction

**Niv Integration**:
```javascript
// When Opportunity Engine is selected
niv.loadContext({
  mcps: ['opportunities', 'intelligence', 'scraper'],
  focus: 'opportunity_detection',
  proactiveAlerts: true,
  suggestions: [
    "I'm monitoring for competitor weaknesses",
    "I've detected a narrative vacuum forming",
    "There's a cascade event you should know about"
  ]
});
```

### 1.2 Intelligence Monitoring Upgrade

**New Intelligence Dashboard** (Content Generator Style):

```javascript
// IntelligenceMonitoring.js
{
  views: [
    'Competitor Health',    // Overall competitor status
    'Market Narratives',    // Trending topics and themes
    'Cascade Tracker',      // Active cascade events
    'Executive Moves'       // Leadership changes
  ],
  
  // Clean card-based interface like Content Generator
  monitoringCards: {
    layout: 'grid',
    expandable: true,
    realTimeUpdates: true,
    cascadeIndicators: true
  }
}
```

**Real-time Cascade Alerts**:
```javascript
// Cascade alert component
<CascadeAlert>
  <EventType>Regulatory Change</EventType>
  <Confidence>85%</Confidence>
  <Effects>
    <FirstOrder timing="24 hours">Media seeking comment</FirstOrder>
    <SecondOrder timing="1 week">Other jurisdictions follow</SecondOrder>
    <ThirdOrder timing="1 month">Industry restructuring</ThirdOrder>
  </Effects>
  <OpportunityWindow>6 hours remaining</OpportunityWindow>
  <SuggestedAction>Position as already compliant</SuggestedAction>
</CascadeAlert>
```

### 1.3 Strategic Planning Transformation with Complete Execution

**Redesign Campaign Intelligence → Strategic Planning**:

```javascript
// StrategicPlanning.js (Replacing Campaign Intelligence)
{
  interface: 'single_input',  // Like Content Generator
  
  workflow: [
    'Input Goals',          // Natural language description
    'Niv Analysis',         // AI breaks down objectives
    'MCP Orchestration',    // All MCPs gather evidence
    'Plan Generation',      // Strategic pillars with rationale
    'Execute Plan',         // One-click execution
    'Materials Generation', // Auto-generate all content
    'MemoryVault Storage'   // Organize everything
  ],
  
  // Complete execution integration
  execution: {
    campaignOrchestrator: 'Creates campaign structure',
    contentGenerator: 'Generates all materials',
    mediaListBuilder: 'Builds targeted journalist lists',
    memoryVault: 'Stores and organizes everything'
  }
}
```

**Strategic Plan → Execution Flow**:
```javascript
// When user clicks "Execute Plan"
async function executeStrategicPlan(plan) {
  // 1. Create campaign in Orchestrator MCP
  const campaign = await mcp.campaigns.create({
    name: plan.objective,
    strategy: plan,
    pillars: plan.pillars
  });
  
  // 2. Generate all materials automatically
  for (const pillar of plan.pillars) {
    // Generate content based on tactics
    if (pillar.tactics.includes('Press Release')) {
      await generateContent({
        type: 'press_release',
        context: pillar,
        tool: 'ContentGenerator'
      });
    }
    
    if (pillar.tactics.includes('Media Outreach')) {
      await buildMediaList({
        beat: pillar.topic,
        tool: 'MediaListBuilder'
      });
    }
    
    if (pillar.tactics.includes('Social Campaign')) {
      await generateContent({
        type: 'social_series',
        platforms: ['LinkedIn', 'Twitter'],
        posts: 10
      });
    }
  }
  
  // 3. Store in MemoryVault
  await mcp.memory.add({
    type: 'campaign',
    id: campaign.id,
    plan: plan,
    materials: materials,
    status: 'ready_to_execute'
  });
  
  // 4. Open Campaign Execution Dashboard
  return openExecutionDashboard(campaign);
}
```

**Campaign Execution Dashboard**:
```javascript
{
  sections: [
    'Generated Materials',    // All content ready to use
    'Media Lists',           // Journalist contacts built
    'Execution Timeline',    // When to launch what
    'Opportunity Windows',   // Cascade-based timing
    'Quick Actions'          // Launch, Schedule, Edit
  ],
  
  integration: {
    contentGenerator: 'Click any content to edit',
    mediaListBuilder: 'Click any list to refine',
    memoryVault: 'All materials stored and versioned'
  }
}
```

---

## Phase 2: Cascade Intelligence UI (Week 3-4)

### 2.1 Cascade Predictor Interface

**New Component**: `CascadePredictor.js`

```javascript
// Following Content Generator's clean design
export default function CascadePredictor() {
  const [event, setEvent] = useState('');
  const [eventType, setEventType] = useState('auto-detect');
  const [prediction, setPrediction] = useState(null);
  
  return (
    <div className="cascade-predictor">
      {/* Input Section - Like Content Generator's input */}
      <div className="cascade-input">
        <textarea 
          placeholder="Paste news event or describe situation..."
          value={event}
          onChange={(e) => setEvent(e.target.value)}
        />
        
        <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
          <option value="auto-detect">Auto-detect event type</option>
          <option value="regulatory_change">Regulatory Change</option>
          <option value="competitor_crisis">Competitor Crisis</option>
          <option value="technology_breakthrough">Technology Breakthrough</option>
          <option value="supply_chain_disruption">Supply Chain Disruption</option>
          <option value="data_breach">Data Breach</option>
        </select>
      </div>
      
      {/* Prediction Display - Visual timeline */}
      {prediction && (
        <CascadeTimeline 
          firstOrder={prediction.firstOrder}
          secondOrder={prediction.secondOrder}
          thirdOrder={prediction.thirdOrder}
          opportunities={prediction.opportunities}
        />
      )}
    </div>
  );
}
```

**Visual Cascade Timeline**:
```
[Event] → [24hrs: First Order] → [1 week: Second Order] → [1 month: Third Order]
   ↓            ↓                        ↓                         ↓
[Action]  [Opportunity #1]        [Opportunity #2]         [Position for future]
```

### 2.2 Niv's Cascade Intelligence

```javascript
// Niv becomes cascade-aware
niv.cascadeIntelligence = {
  proactiveAlerts: [
    "I've detected cascade indicators in today's news",
    "A competitor crisis is unfolding - here are the likely effects",
    "This regulatory change will cascade - we should position now"
  ],
  
  guidedAnalysis: (event) => {
    // Niv guides through cascade analysis
    return `
      Based on this ${event.type}, here's what I predict:
      
      IMMEDIATE (24-48 hours):
      - ${event.firstOrder.map(e => e.effect).join('\n- ')}
      
      We should ${event.immediateAction} within ${event.window}.
      
      Want me to draft the response?
    `;
  }
};
```

---

## Phase 3: Opportunity Orchestration (Week 5-6)

### 3.1 Opportunity Action Center

**New Feature**: Automated Opportunity Response

```javascript
// OpportunityActionCenter.js
{
  workflow: [
    'Detect',      // MCP scraper finds signal
    'Analyze',     // Intelligence MCP analyzes
    'Predict',     // Cascade predictor forecasts
    'Score',       // Opportunity engine scores
    'Draft',       // Content MCP creates response
    'Execute'      // Campaign MCP orchestrates
  ],
  
  automationLevels: [
    'Full Auto',   // Niv handles everything
    'Semi-Auto',   // Niv drafts, user approves
    'Assisted',    // Niv suggests, user acts
    'Manual'       // User controls, Niv advises
  ]
}
```

### 3.2 Integrated Monitoring Dashboard

```javascript
// UnifiedMonitoringDashboard.js
{
  layout: 'railway-style-panels',
  
  panels: [
    {
      title: 'Live Opportunities',
      source: 'signaldesk-opportunities',
      updateFrequency: 'real-time',
      nixAlerts: true
    },
    {
      title: 'Competitor Moves',
      source: 'signaldesk-intelligence',
      cascadeIndicators: true
    },
    {
      title: 'Cascade Predictions',
      source: 'signaldesk-scraper',
      confidenceThreshold: 0.7
    },
    {
      title: 'Action Queue',
      source: 'multiple-mcps',
      prioritized: true
    }
  ]
}
```

---

## Phase 4: Niv Intelligence Evolution (Week 7-8)

### 4.1 Niv's Contextual Adaptation

```javascript
class NivAdapter {
  adaptToFeature(feature) {
    switch(feature) {
      case 'OpportunityEngine':
        return {
          greeting: "I'm hunting for opportunities. What should we focus on?",
          tools: ['scraper', 'intelligence', 'cascade'],
          personality: 'proactive_hunter',
          suggestions: this.getOpportunitySuggestions()
        };
        
      case 'CascadePredictor':
        return {
          greeting: "Let's predict the ripple effects. What event are we analyzing?",
          tools: ['cascade', 'intelligence'],
          personality: 'strategic_analyst',
          suggestions: this.getCascadeSuggestions()
        };
        
      case 'IntelligenceMonitoring':
        return {
          greeting: "I'm monitoring all channels. Here's what's happening...",
          tools: ['intelligence', 'scraper', 'relationships'],
          personality: 'vigilant_observer',
          realTimeAlerts: true
        };
    }
  }
  
  detectIntent(message) {
    // Smart intent detection
    if (message.includes('monitor') || message.includes('track')) {
      this.openFeature('IntelligenceMonitoring');
    } else if (message.includes('cascade') || message.includes('predict')) {
      this.openFeature('CascadePredictor');
    } else if (message.includes('opportunity') || message.includes('chance')) {
      this.openFeature('OpportunityEngine');
    }
  }
}
```

### 4.2 Niv's Proactive Intelligence

```javascript
// Niv proactively surfaces insights
niv.proactiveIntelligence = {
  
  morningBriefing: () => {
    // Uses all MCPs to create morning brief
    const opportunities = mcp.opportunities.getOvernight();
    const cascades = mcp.scraper.getActiveCascades();
    const competitors = mcp.intelligence.getCompetitorMoves();
    
    return `
      Good morning! Here's your intelligence brief:
      
      🎯 ${opportunities.length} new opportunities detected overnight
      🔄 ${cascades.length} cascade events in progress
      🏢 ${competitors.length} competitor moves to review
      
      The highest priority is: ${opportunities[0].title}
      Window closes in: ${opportunities[0].timeRemaining}
      
      Should we act on this now?
    `;
  },
  
  continuousMonitoring: () => {
    // Niv continuously monitors and alerts
    setInterval(() => {
      const urgent = this.checkForUrgentOpportunities();
      if (urgent) {
        this.alert(`URGENT: ${urgent.title} - ${urgent.window} remaining`);
      }
    }, 60000); // Check every minute
  }
};
```

---

## Phase 5: Complete Integration (Week 9-10)

### 5.1 Feature Interconnection

```javascript
// All features work together seamlessly
const FeatureOrchestrator = {
  
  // Opportunity detected → Cascade predicted → Content generated → Campaign planned
  orchestrateResponse: async (opportunity) => {
    // 1. Predict cascade effects
    const cascade = await mcp.scraper.predictCascade(opportunity);
    
    // 2. Analyze stakeholder impact
    const stakeholders = await mcp.relationships.analyzeImpact(cascade);
    
    // 3. Generate response content
    const content = await mcp.content.generateResponse({
      opportunity,
      cascade,
      stakeholders
    });
    
    // 4. Plan campaign
    const campaign = await mcp.campaigns.planResponse({
      content,
      timing: cascade.windows,
      channels: stakeholders.preferredChannels
    });
    
    // 5. Present to user via Niv
    niv.present({
      title: "Opportunity Response Ready",
      opportunity,
      cascade,
      content,
      campaign,
      action: "Review and execute?"
    });
  }
};
```

### 5.2 Unified Interface

```javascript
// RailwayDraggable.js updates
{
  leftPanel: {
    component: 'Niv',
    adaptive: true,
    contextAware: true,
    intentDetection: true
  },
  
  centerPanel: {
    component: 'DynamicFeature',
    features: [
      'OpportunityEngine',
      'CascadePredictor',
      'IntelligenceMonitoring',
      'ContentGenerator',
      'StrategicPlanning'  // Replaced CampaignManager
    ],
    transitions: 'smooth',
    nivControlled: true
  },
  
  rightPanel: {
    component: 'LiveIntelligence',
    feeds: [
      'opportunities',
      'cascades',
      'competitors',
      'alerts'
    ],
    realTime: true
  }
}
```

---

## Implementation Timeline

### Week 1-2: Core MCP Integration & Strategic Planning
- [ ] Update OpportunityEngine with new UI
- [ ] Transform Campaign Intelligence → Strategic Planning
  - [ ] Single input interface for goals
  - [ ] Evidence-based rationale (no reports)
  - [ ] Strategic pillars generation
- [ ] Integrate Campaign Orchestrator MCP for execution
- [ ] Connect Content Generator for auto-generation
- [ ] Setup Media List Builder integration
- [ ] Configure MemoryVault campaign storage
- [ ] Integrate cascade predictor
- [ ] Connect scraper MCP
- [ ] Update Niv's context system

### Week 3-4: Cascade Intelligence UI
- [ ] Build CascadePredictor component
- [ ] Create cascade timeline visualization
- [ ] Implement cascade alerts
- [ ] Add Niv cascade guidance

### Week 5-6: Execution & Orchestration
- [ ] Build Campaign Execution Dashboard
  - [ ] Materials hub with all generated content
  - [ ] Media lists section
  - [ ] Execution timeline view
  - [ ] Quick launch actions
- [ ] Implement auto-generation workflow
  - [ ] Press releases from pillars
  - [ ] Social content series
  - [ ] Email templates
  - [ ] Executive positioning materials
- [ ] Create MemoryVault organization structure
- [ ] Build Opportunity Action Center
- [ ] Test complete execution flow

### Week 7-8: Niv Evolution
- [ ] Implement contextual adaptation
- [ ] Add intent detection
- [ ] Build proactive intelligence
- [ ] Create morning briefings

### Week 9-10: Complete Integration
- [ ] Connect all features
- [ ] Test feature orchestration
- [ ] Refine UI/UX
- [ ] Performance optimization

---

## Complete Integration Architecture

### Strategic Planning as Central Hub

```javascript
// Strategic Planning connects everything
StrategicPlanning {
  inputs: 'User Goals',
  
  orchestrates: [
    'OpportunityEngine',      // Identifies opportunities
    'CascadePredictor',       // Predicts effects
    'IntelligenceMonitoring', // Gathers evidence
    'ContentGenerator',       // Creates materials
    'MediaListBuilder',       // Builds contacts
    'CampaignOrchestrator',   // Manages execution
    'MemoryVault'            // Stores everything
  ],
  
  outputs: {
    strategicPlan: 'Evidence-based pillars',
    campaignMaterials: 'All content generated',
    executionDashboard: 'Ready to launch',
    memoryVault: 'Everything organized'
  }
}
```

### Execution Flow Architecture

```
User Input Goals
    ↓
Niv Analyzes (All MCPs)
    ↓
Strategic Plan Generated
    ↓
[Execute Button]
    ↓
┌─────────────────────────────────────┐
│  Parallel Material Generation       │
├─────────────────────────────────────┤
│  • Content Generator → Press/Social │
│  • Media List Builder → Journalists │
│  • Template Generator → Emails      │
│  • Campaign MCP → Structure         │
└─────────────────────────────────────┘
    ↓
MemoryVault Storage
    ↓
Execution Dashboard
    ↓
Launch & Monitor
```

### Tool Integration Map

```javascript
{
  'Strategic Planning': {
    creates: 'Strategic Plan',
    triggers: 'Campaign Orchestrator'
  },
  
  'Campaign Orchestrator': {
    receives: 'Strategic Plan',
    coordinates: ['Content', 'Media', 'Timeline']
  },
  
  'Content Generator': {
    receives: 'Pillar Context',
    generates: 'All Materials',
    stores: 'MemoryVault'
  },
  
  'Media List Builder': {
    receives: 'Topic/Beat',
    builds: 'Journalist Lists',
    stores: 'MemoryVault'
  },
  
  'MemoryVault': {
    organizes: 'All Materials',
    versions: 'Content History',
    retrieves: 'On Demand'
  },
  
  'Execution Dashboard': {
    displays: 'All Materials',
    enables: 'Quick Actions',
    tracks: 'Progress'
  }
}
```

---

## Success Metrics

1. **Opportunity Detection Rate**: >90% of relevant opportunities caught
2. **Cascade Prediction Accuracy**: >80% accuracy on first-order effects
3. **Response Time**: <5 minutes from detection to draft response
4. **User Engagement**: >70% of detected opportunities acted upon
5. **Niv Effectiveness**: >80% of Niv suggestions accepted

---

## Technical Requirements

### Frontend Updates
- React components for new features
- State management for real-time updates
- WebSocket connections for live data
- Smooth transitions between features

### Backend Integration
- MCP server connections
- Real-time data pipelines
- Cascade prediction API
- Opportunity scoring engine

### Niv Enhancements
- Context-aware responses
- Intent detection system
- Proactive monitoring
- Feature control capabilities

---

## Risk Mitigation

1. **Performance**: Implement caching and throttling for MCP calls
2. **Complexity**: Phase rollout to ensure stability
3. **User Experience**: A/B test new features
4. **Data Overload**: Smart filtering and prioritization

---

## Next Steps

1. **Immediate** (Today):
   - Review and approve workplan
   - Prioritize Phase 1 features
   - Set up development environment

2. **This Week**:
   - Begin OpportunityEngine UI updates
   - Test cascade predictor integration
   - Update Niv's context system

3. **Next Week**:
   - Deploy Phase 1 to staging
   - Begin Phase 2 development
   - Gather initial user feedback

---

## Key Benefits of Integrated Approach

### 1. **Complete Workflow Automation**
- Strategic planning automatically generates all materials
- One click from strategy to execution-ready campaign
- All tools work together seamlessly

### 2. **Intelligent Material Generation**
- Content contextually aware of strategic pillars
- Media lists targeted to campaign objectives
- Templates customized for each tactic

### 3. **Centralized Organization**
- MemoryVault stores everything in one place
- Version control for all materials
- Easy retrieval and reuse

### 4. **Execution Efficiency**
- No manual content creation needed
- No searching for journalist contacts
- No organizing campaign materials

### 5. **Niv's Orchestration**
- Coordinates all MCPs automatically
- Monitors execution progress
- Alerts for opportunity windows
- Suggests timing adjustments

---

This workplan transforms SignalDesk from a powerful toolset into an intelligent, adaptive PR command center where:
- **Strategic Planning** is the central hub connecting all features
- **Niv orchestrates 11 MCPs** to detect, predict, and act on opportunities
- **Execution is automatic** - from goals to ready-to-launch campaigns
- **Everything is connected** - Content Generator, Media List Builder, and MemoryVault work as one system