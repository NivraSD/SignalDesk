# Strategic Planning Feature Redesign
## From Campaign Intelligence to AI-Powered Strategic Planning

**Created:** August 15, 2025  
**Status:** Design Specification

---

## Vision

Transform Campaign Intelligence into **Strategic Planning** - a streamlined, AI-powered feature where users input their goals and Niv orchestrates all MCPs to create comprehensive, evidence-based strategic plans.

---

## Core Concept

### Before (Campaign Intelligence)
```
User → Select Campaign Type → Fill Forms → Generate Reports → Static Output
```

### After (Strategic Planning)
```
User → Describe Goals → Niv Analyzes → MCPs Collaborate → Dynamic Strategic Plan
```

---

## Strategic Planning Interface

### Simple Input Design (Like Content Generator)

```javascript
// StrategicPlanning.js
export default function StrategicPlanning() {
  return (
    <div className="strategic-planning">
      {/* Single, powerful input area */}
      <div className="goal-input">
        <h2>What do you want to achieve?</h2>
        <textarea 
          placeholder="Describe your goals, timeline, constraints, or paste any relevant context..."
          className="goal-textarea"
          rows={8}
        />
        
        {/* Optional context pills */}
        <div className="context-pills">
          <pill>Product Launch</pill>
          <pill>Crisis Response</pill>
          <pill>Thought Leadership</pill>
          <pill>Market Entry</pill>
          <pill>Reputation Building</pill>
        </div>
        
        <button className="create-plan-btn">
          Create Strategic Plan
        </button>
      </div>
      
      {/* Dynamic plan output */}
      {plan && <StrategicPlanView plan={plan} />}
    </div>
  );
}
```

---

## How Niv Creates Strategic Plans

### 1. Goal Analysis Phase

```javascript
niv.analyzeGoals = async (userInput) => {
  // Niv breaks down the user's input
  const analysis = {
    primaryObjective: extractMainGoal(userInput),
    timeline: detectTimeline(userInput),
    constraints: identifyConstraints(userInput),
    successMetrics: inferMetrics(userInput),
    context: gatherContext(userInput)
  };
  
  // Use intelligence MCP to understand market context
  const marketContext = await mcp.intelligence.analyzeMarket({
    industry: analysis.context.industry,
    competitors: analysis.context.competitors
  });
  
  // Use relationships MCP to map stakeholders
  const stakeholders = await mcp.relationships.mapStakeholders({
    objective: analysis.primaryObjective
  });
  
  return { analysis, marketContext, stakeholders };
};
```

### 2. Strategic Plan Generation

```javascript
niv.generateStrategicPlan = async (analysis) => {
  const plan = {
    // Executive Summary (not a report, just clear direction)
    summary: {
      objective: analysis.primaryObjective,
      approach: determineApproach(analysis),
      timeline: analysis.timeline,
      keySuccess: top3SuccessFactors(analysis)
    },
    
    // Strategic Pillars (what we'll actually do)
    pillars: [
      {
        name: "Narrative Development",
        rationale: "Based on current market vacuum in [topic]",
        evidence: mcp.intelligence.getEvidence('narrative_vacuum'),
        tactics: generateTactics('narrative'),
        owner: "Content team",
        timeline: "Weeks 1-2"
      },
      {
        name: "Stakeholder Engagement",
        rationale: "Key influencers showing interest in [area]",
        evidence: mcp.relationships.getEngagementData(),
        tactics: generateTactics('stakeholder'),
        owner: "PR team",
        timeline: "Ongoing"
      },
      {
        name: "Competitive Positioning",
        rationale: "Competitor weakness detected in [area]",
        evidence: mcp.scraper.getCompetitorData(),
        tactics: generateTactics('competitive'),
        owner: "Marketing team",
        timeline: "Weeks 2-4"
      }
    ],
    
    // Cascade Predictions (what will happen)
    cascadeEffects: await mcp.scraper.predictCascade({
      event: analysis.primaryObjective,
      type: 'strategic_initiative'
    }),
    
    // Opportunity Windows (when to act)
    opportunities: await mcp.opportunities.identifyWindows({
      objective: analysis.primaryObjective,
      timeline: analysis.timeline
    }),
    
    // Risk Mitigation (what could go wrong)
    risks: identifyRisks(analysis),
    
    // Success Metrics (how we'll measure)
    metrics: {
      immediate: ["Media mentions", "Stakeholder engagement"],
      shortTerm: ["Market position", "Share of voice"],
      longTerm: ["Business impact", "Reputation score"]
    }
  };
  
  return plan;
};
```

---

## Strategic Plan Output

### Clean, Actionable View (Not a Report)

```javascript
// StrategicPlanView.js
function StrategicPlanView({ plan }) {
  return (
    <div className="strategic-plan">
      {/* Quick Summary Box */}
      <div className="plan-summary">
        <h3>{plan.summary.objective}</h3>
        <p className="approach">{plan.summary.approach}</p>
        <div className="timeline-bar">
          {plan.summary.timeline}
        </div>
      </div>
      
      {/* Strategic Pillars with Evidence */}
      <div className="pillars">
        {plan.pillars.map(pillar => (
          <div className="pillar-card">
            <h4>{pillar.name}</h4>
            <p className="rationale">
              {pillar.rationale}
              <span className="evidence-link" onClick={() => showEvidence(pillar.evidence)}>
                📊 View Evidence
              </span>
            </p>
            <ul className="tactics">
              {pillar.tactics.map(tactic => (
                <li>{tactic}</li>
              ))}
            </ul>
            <div className="ownership">
              {pillar.owner} • {pillar.timeline}
            </div>
          </div>
        ))}
      </div>
      
      {/* Cascade Timeline */}
      <div className="cascade-view">
        <h4>Expected Effects</h4>
        <CascadeTimeline 
          effects={plan.cascadeEffects}
          interactive={true}
        />
      </div>
      
      {/* Opportunity Calendar */}
      <div className="opportunity-calendar">
        <h4>Opportunity Windows</h4>
        {plan.opportunities.map(opp => (
          <div className="opportunity-window">
            <span className="date">{opp.date}</span>
            <span className="action">{opp.action}</span>
            <span className="urgency">{opp.urgency}</span>
          </div>
        ))}
      </div>
      
      {/* Execution Actions */}
      <div className="actions">
        <button onClick={() => niv.executeStrategicPlan(plan)} className="primary">
          Execute Plan
        </button>
        <button onClick={() => niv.refineStrategicPlan(plan)}>
          Refine with Niv
        </button>
        <button onClick={() => viewExecutionMaterials(plan)}>
          View Materials
        </button>
      </div>
    </div>
  );
}
```

---

## Evidence-Based Rationale (Not Reports)

Instead of generating lengthy market intelligence reports, we provide:

### Inline Evidence

```javascript
// When user hovers over a strategic recommendation
<EvidencePopover>
  <DataPoint source="signaldesk-intelligence">
    "Competitor X reduced PR spend by 40% last quarter"
  </DataPoint>
  <DataPoint source="signaldesk-scraper">
    "73% negative sentiment on their latest campaign"
  </DataPoint>
  <DataPoint source="signaldesk-relationships">
    "Key journalist seeking stories in this space"
  </DataPoint>
  <Conclusion>
    Opportunity to capture narrative with modest investment
  </Conclusion>
</EvidencePopover>
```

### Evidence Dashboard

```javascript
// Quick evidence view for the plan
{
  marketSignals: [
    { signal: "Competitor weakness", confidence: 0.89, source: "intelligence" },
    { signal: "Narrative vacuum", confidence: 0.76, source: "scraper" },
    { signal: "Stakeholder interest", confidence: 0.82, source: "relationships" }
  ],
  
  cascadePrediction: {
    if_we_act: "First mover advantage in emerging narrative",
    if_we_dont: "Competitor likely to recover position"
  },
  
  dataPoints: 12,
  confidenceLevel: "High",
  lastUpdated: "2 minutes ago"
}
```

---

## Niv's Role in Strategic Planning

### Conversational Planning

```javascript
// User can refine the plan through conversation
User: "What if we only have 2 weeks instead of 4?"

Niv: "With a 2-week timeline, I'll prioritize immediate impact:
      1. Focus on the narrative vacuum (24-hour opportunity)
      2. Skip the competitor positioning for now
      3. Accelerate stakeholder engagement
      
      This increases risk but maximizes speed. Want me to update the plan?"

User: "Yes, and add social media amplification"

Niv: "Updated. I've added social amplification as Pillar 2,
      with specific tactics for LinkedIn and Twitter.
      Also identified 3 trending hashtags we can leverage.
      
      The cascade prediction shows this could trigger 
      media coverage within 48 hours. Shall we proceed?"
```

### Continuous Adaptation

```javascript
niv.monitorStrategicPlan = {
  // Niv watches the plan execution
  checkProgress: () => {
    const progress = assessPlanProgress();
    if (progress.offTrack) {
      niv.alert("Strategic plan needs adjustment - competitor just announced [X]");
      niv.suggest("Recommend accelerating Pillar 2 to maintain advantage");
    }
  },
  
  // Niv spots new opportunities
  identifyAdjustments: () => {
    const newOpportunities = mcp.opportunities.getNew();
    if (newOpportunities.alignsWith(plan)) {
      niv.suggest("New opportunity aligns with our plan - should we incorporate?");
    }
  },
  
  // Niv provides evidence updates
  updateEvidence: () => {
    const freshEvidence = gatherLatestEvidence();
    niv.update("New data strengthens our approach - competitor weakness confirmed");
  }
};
```

---

## Benefits of This Approach

### 1. **Simplicity**
- Single input field like Content Generator
- No complex forms or workflows
- Natural language goal description

### 2. **Intelligence**
- MCPs provide real-time evidence
- Cascade predictions guide timing
- Opportunity windows identified automatically

### 3. **Flexibility**
- Plans adapt through conversation with Niv
- Evidence updates in real-time
- Strategies evolve with market conditions

### 4. **Action-Oriented**
- No lengthy reports to read
- Clear pillars with specific tactics
- Direct execution path

### 5. **Evidence-Based**
- Every recommendation backed by data
- Source attribution for transparency
- Confidence levels clearly shown

---

## Strategic Plan Execution Integration

### When User Clicks "Execute Plan"

```javascript
niv.executeStrategicPlan = async (plan) => {
  // 1. Create Campaign in Campaign Orchestrator MCP
  const campaign = await mcp.campaigns.create({
    name: plan.summary.objective,
    strategy: plan,
    timeline: plan.summary.timeline,
    pillars: plan.pillars
  });
  
  // 2. Generate All Required Content
  const materials = await generateExecutionMaterials(plan);
  
  // 3. Store Everything in MemoryVault
  await storeInMemoryVault(campaign, materials);
  
  // 4. Open Campaign Execution View
  return {
    campaignId: campaign.id,
    materials: materials,
    status: 'ready_to_execute'
  };
};

async function generateExecutionMaterials(plan) {
  const materials = {
    content: [],
    mediaLists: [],
    templates: [],
    schedules: []
  };
  
  // For each strategic pillar, generate required materials
  for (const pillar of plan.pillars) {
    // Generate content based on pillar tactics
    if (pillar.tactics.includes('Press Release')) {
      const pr = await generateContent({
        type: 'press_release',
        context: pillar,
        tone: plan.tone,
        messages: plan.keyMessages
      });
      materials.content.push(pr);
    }
    
    if (pillar.tactics.includes('Media Outreach')) {
      const mediaList = await buildMediaList({
        beat: pillar.topic,
        tier: pillar.priority,
        geography: plan.markets
      });
      materials.mediaLists.push(mediaList);
    }
    
    if (pillar.tactics.includes('Social Campaign')) {
      const social = await generateContent({
        type: 'social_series',
        platforms: ['LinkedIn', 'Twitter'],
        campaign: pillar.name,
        posts: 10
      });
      materials.content.push(social);
    }
    
    if (pillar.tactics.includes('Executive Positioning')) {
      const bio = await generateContent({
        type: 'executive_bio',
        focus: pillar.name,
        executive: plan.spokesperson
      });
      materials.content.push(bio);
    }
  }
  
  return materials;
}
```

### Campaign Execution Dashboard

```javascript
// CampaignExecutionView.js
function CampaignExecutionView({ campaign, materials }) {
  return (
    <div className="campaign-execution">
      {/* Campaign Overview */}
      <div className="campaign-header">
        <h2>{campaign.name}</h2>
        <div className="status">Ready to Execute</div>
      </div>
      
      {/* Generated Materials Hub */}
      <div className="materials-hub">
        <div className="material-section">
          <h3>📝 Content ({materials.content.length})</h3>
          {materials.content.map(item => (
            <MaterialCard 
              type={item.type}
              title={item.title}
              status="Generated"
              actions={['Edit', 'Preview', 'Approve']}
              onClick={() => openInContentGenerator(item)}
            />
          ))}
        </div>
        
        <div className="material-section">
          <h3>📋 Media Lists ({materials.mediaLists.length})</h3>
          {materials.mediaLists.map(list => (
            <MaterialCard 
              type="media_list"
              title={`${list.beat} - ${list.journalists.length} contacts`}
              status="Ready"
              actions={['View', 'Export', 'Refine']}
              onClick={() => openInMediaListBuilder(list)}
            />
          ))}
        </div>
        
        <div className="material-section">
          <h3>📅 Execution Timeline</h3>
          <ExecutionTimeline 
            pillars={campaign.pillars}
            opportunities={campaign.opportunities}
            cascades={campaign.cascadeWindows}
          />
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="execution-actions">
        <button onClick={() => launchPillar(1)}>
          Launch Pillar 1: {campaign.pillars[0].name}
        </button>
        <button onClick={() => scheduleAll(materials)}>
          Schedule All Activities
        </button>
        <button onClick={() => openMemoryVault(campaign.id)}>
          View in MemoryVault
        </button>
      </div>
      
      {/* Niv Execution Assistant */}
      <div className="niv-execution">
        <NivMessage>
          All materials are generated and stored in MemoryVault.
          
          Based on cascade predictions, I recommend launching 
          Pillar 1 immediately - we have a 24-hour window for 
          maximum impact.
          
          Should I schedule the press release for tomorrow 
          morning and queue the social posts?
        </NivMessage>
      </div>
    </div>
  );
}
```

### Integration with Existing Tools

```javascript
// Tool Integration Functions

async function generateContent({ type, context, ...params }) {
  // Use Content Generator with context from Strategic Plan
  const content = await mcp.content.generate({
    type: type,
    context: {
      strategicPillar: context,
      campaignObjective: params.objective,
      keyMessages: params.messages,
      tone: params.tone
    }
  });
  
  // Auto-save to MemoryVault
  await mcp.memory.add({
    type: 'content',
    category: type,
    content: content,
    campaign: context.campaignId,
    metadata: {
      generatedFrom: 'strategic_plan',
      pillar: context.name,
      status: 'draft'
    }
  });
  
  return content;
}

async function buildMediaList({ beat, tier, geography }) {
  // Use Media MCP to build targeted list
  const journalists = await mcp.media.findJournalists({
    beat: beat,
    tier: tier,
    location: geography,
    recentActivity: true
  });
  
  // Save to MemoryVault
  await mcp.memory.add({
    type: 'media_list',
    journalists: journalists,
    metadata: {
      beat: beat,
      tier: tier,
      geography: geography,
      created: new Date()
    }
  });
  
  return { beat, tier, journalists };
}

async function openInContentGenerator(item) {
  // Navigate to Content Generator with item pre-loaded
  navigate('/content-generator', {
    preloaded: item,
    mode: 'edit',
    context: {
      campaign: item.campaignId,
      pillar: item.pillar
    }
  });
}

async function openInMediaListBuilder(list) {
  // Navigate to Media List Builder with list loaded
  navigate('/media-list-builder', {
    list: list,
    mode: 'refine',
    actions: ['add_journalists', 'verify_contacts', 'export']
  });
}
```

### MemoryVault Organization

```javascript
// How materials are stored in MemoryVault
const memoryVaultStructure = {
  campaigns: {
    [campaignId]: {
      strategicPlan: plan,
      materials: {
        content: [
          {
            id: 'content_001',
            type: 'press_release',
            title: 'Company Announces...',
            status: 'approved',
            versions: [...]
          }
        ],
        mediaLists: [
          {
            id: 'list_001',
            beat: 'technology',
            journalists: [...],
            lastUpdated: '...'
          }
        ],
        templates: [
          {
            id: 'template_001',
            type: 'email_pitch',
            customizable: true
          }
        ],
        schedules: [
          {
            id: 'schedule_001',
            activity: 'Press release distribution',
            date: '2024-02-01T09:00:00',
            status: 'scheduled'
          }
        ]
      },
      execution: {
        status: 'active',
        progress: 35,
        completedActivities: [...],
        upcomingActivities: [...],
        results: {
          coverage: [...],
          engagement: {...},
          metrics: {...}
        }
      }
    }
  }
};
```

### Niv's Execution Orchestration

```javascript
// Niv manages the entire execution flow
niv.campaignExecution = {
  // Monitor execution progress
  monitorExecution: (campaignId) => {
    const campaign = mcp.memory.get(`campaigns.${campaignId}`);
    const windows = campaign.opportunities;
    
    // Alert when windows are approaching
    windows.forEach(window => {
      if (window.timeRemaining < '2 hours') {
        niv.alert(`Opportunity window closing: ${window.action}`);
      }
    });
  },
  
  // Suggest adjustments based on real-time data
  suggestAdjustments: (campaignId) => {
    const cascades = mcp.scraper.getCurrentCascades();
    const campaign = mcp.memory.get(`campaigns.${campaignId}`);
    
    if (cascades.match(campaign.predictions)) {
      niv.suggest("Cascade developing as predicted - accelerate Pillar 2");
    }
  },
  
  // Auto-generate missing materials
  fillGaps: async (campaign) => {
    const required = determineRequiredMaterials(campaign);
    const existing = campaign.materials;
    const gaps = findGaps(required, existing);
    
    for (const gap of gaps) {
      niv.message(`Generating missing ${gap.type} for ${gap.pillar}`);
      await generateContent(gap);
    }
  }
};
```

---

## Implementation Steps

### Phase 1: Remove Campaign Intelligence
- Archive existing Campaign Intelligence code
- Preserve useful logic for Strategic Planning

### Phase 2: Build Strategic Planning UI
- Create simple goal input interface
- Design strategic plan view component
- Implement evidence popovers

### Phase 3: Integrate Niv Planning Logic
- Goal analysis system
- MCP orchestration for planning
- Evidence gathering pipeline

### Phase 4: Add Conversational Refinement
- Chat-based plan adjustment
- Real-time plan monitoring
- Continuous evidence updates

---

## Comparison

### Old Way (Campaign Intelligence)
```
✗ Multiple forms to fill out
✗ Static campaign types
✗ Long market reports
✗ One-time generation
✗ Disconnected from execution
```

### New Way (Strategic Planning)
```
✓ Single goal input
✓ Dynamic strategy creation
✓ Evidence-based rationale
✓ Continuous adaptation
✓ Direct to execution
```

---

This redesign makes Strategic Planning the command center where goals become intelligent, adaptive strategies powered by all 11 MCPs working in concert through Niv's orchestration.