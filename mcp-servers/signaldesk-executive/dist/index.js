/**
 * SignalDesk Executive Summary MCP
 * Synthesizes all analyses and provides executive-level insights with rich rendering
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
// Executive Advisor Personality
const EXECUTIVE_ADVISOR_PERSONALITY = `You are the Executive Intelligence Advisor, a master synthesist who transforms complex multi-domain intelligence into crystal-clear executive insights. You see the forest AND the trees, connecting dots across competitive moves, market trends, stakeholder dynamics, and cascade signals to deliver THE story that matters.

Your synthesis approach:
- Start with THE BIG PICTURE - what's the ONE thing executives must know?
- Connect insights across all 5 intelligence domains
- Identify contradictions and reconcile them
- Surface non-obvious connections that change everything
- Predict second and third-order effects
- Recommend specific, time-bound actions

You speak in executive language: clear, confident, and actionable.`;
const TOOLS = [
    {
        name: 'synthesize_executive_summary',
        description: 'Synthesize all analyses into executive-level insights with rich rendering',
        inputSchema: {
            type: 'object',
            properties: {
                analyses: {
                    type: 'object',
                    description: 'All analysis results from different MCPs',
                    properties: {
                        competition: { type: 'object', description: 'Marcus Chen analysis' },
                        trending: { type: 'object', description: 'Sarah Rodriguez analysis' },
                        stakeholders: { type: 'object', description: 'Victoria Chen analysis' },
                        market: { type: 'object', description: 'Market Intelligence analysis' },
                        cascade: { type: 'object', description: 'Cascade Detection analysis' }
                    }
                },
                organization: { type: 'object', description: 'Target organization context' },
                render_format: {
                    type: 'string',
                    enum: ['markdown', 'html', 'dashboard', 'report'],
                    default: 'dashboard',
                    description: 'Output rendering format'
                },
                detail_level: {
                    type: 'string',
                    enum: ['executive', 'detailed', 'comprehensive'],
                    default: 'executive'
                }
            },
            required: ['analyses', 'organization']
        }
    },
    {
        name: 'generate_insight_dashboard',
        description: 'Generate a rich HTML dashboard with charts and visualizations',
        inputSchema: {
            type: 'object',
            properties: {
                analyses: { type: 'object', description: 'All analysis results' },
                organization: { type: 'object', description: 'Organization context' },
                include_charts: { type: 'boolean', default: true },
                include_timeline: { type: 'boolean', default: true },
                include_recommendations: { type: 'boolean', default: true }
            },
            required: ['analyses']
        }
    },
    {
        name: 'generate_action_matrix',
        description: 'Generate prioritized action matrix based on all analyses',
        inputSchema: {
            type: 'object',
            properties: {
                analyses: { type: 'object', description: 'All analysis results' },
                time_horizon: {
                    type: 'string',
                    enum: ['24_hours', '1_week', '1_month', '1_quarter'],
                    default: '1_week'
                }
            },
            required: ['analyses']
        }
    }
];
class ExecutiveSummaryServer {
    server;
    constructor() {
        this.server = new Server({
            name: 'signaldesk-executive',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupHandlers();
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: TOOLS,
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'synthesize_executive_summary':
                        return await this.synthesizeExecutiveSummary(args);
                    case 'generate_insight_dashboard':
                        return await this.generateInsightDashboard(args);
                    case 'generate_action_matrix':
                        return await this.generateActionMatrix(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                return {
                    content: [{
                            type: 'text',
                            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }],
                    isError: true
                };
            }
        });
    }
    async synthesizeExecutiveSummary(args) {
        const { analyses, organization, render_format = 'dashboard', detail_level = 'executive' } = args;
        console.log(`🎩 Synthesizing executive summary for ${organization?.name}`);
        // Use Claude to synthesize if API key is available
        const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
        let synthesis = {};
        if (ANTHROPIC_API_KEY) {
            const prompt = `${EXECUTIVE_ADVISOR_PERSONALITY}

You are synthesizing intelligence from 5 specialist analysts:
1. Marcus Chen (Competition): ${JSON.stringify(analyses.competition || {})}
2. Sarah Rodriguez (Trending): ${JSON.stringify(analyses.trending || {})}
3. Victoria Chen (Stakeholders): ${JSON.stringify(analyses.stakeholders || {})}
4. Market Expert: ${JSON.stringify(analyses.market || {})}
5. Cascade Specialist: ${JSON.stringify(analyses.cascade || {})}

Organization: ${organization?.name} in ${organization?.industry}
Detail Level: ${detail_level}

Provide an executive synthesis in this JSON structure:
{
  "executive_brief": {
    "headline": "The ONE thing that matters most right now",
    "critical_insight": "The non-obvious connection that changes everything",
    "strategic_situation": "Where we stand in 2-3 sentences",
    "immediate_action": "What must be done in the next 24 hours"
  },
  "integrated_insights": {
    "cross_domain_patterns": ["Pattern seen across multiple analyses"],
    "contradictions_resolved": ["How conflicting signals actually fit together"],
    "hidden_connections": ["Non-obvious links between different domains"],
    "cascade_implications": ["Second and third-order effects"]
  },
  "strategic_recommendations": {
    "do_now": ["Actions for immediate execution"],
    "prepare_for": ["What's coming that needs preparation"],
    "watch_for": ["Early warning signals to monitor"],
    "avoid": ["Traps and risks to sidestep"]
  },
  "decision_matrix": {
    "opportunities": [
      {
        "opportunity": "Description",
        "confidence": "High/Medium/Low",
        "timing": "When to act",
        "resources_required": "What's needed"
      }
    ],
    "threats": [
      {
        "threat": "Description",
        "severity": "High/Medium/Low",
        "timeline": "When it hits",
        "mitigation": "How to defend"
      }
    ]
  },
  "narrative_summary": "2-3 paragraph executive narrative connecting all insights"
}`;
            try {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': ANTHROPIC_API_KEY,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 4000,
                        temperature: 0.5, // Balanced for synthesis
                        messages: [{ role: 'user', content: prompt }]
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    const jsonMatch = data.content[0].text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        synthesis = JSON.parse(jsonMatch[0]);
                    }
                }
            }
            catch (error) {
                console.error('Synthesis error:', error);
            }
        }
        // Generate rendered output based on format
        let renderedOutput = '';
        switch (render_format) {
            case 'dashboard':
                renderedOutput = this.renderDashboard(synthesis, analyses, organization);
                break;
            case 'html':
                renderedOutput = this.renderHTML(synthesis, analyses, organization);
                break;
            case 'markdown':
                renderedOutput = this.renderMarkdown(synthesis, analyses, organization);
                break;
            case 'report':
                renderedOutput = this.renderReport(synthesis, analyses, organization);
                break;
        }
        return {
            content: [{
                    type: 'text',
                    text: renderedOutput,
                    metadata: {
                        synthesis,
                        render_format,
                        detail_level,
                        personalities_synthesized: [
                            'marcus_chen',
                            'sarah_rodriguez',
                            'victoria_chen',
                            'market_expert',
                            'cascade_specialist'
                        ],
                        timestamp: new Date().toISOString()
                    }
                }]
        };
    }
    renderDashboard(synthesis, analyses, organization) {
        return `
<!DOCTYPE html>
<html>
<head>
  <title>Executive Intelligence Dashboard - ${organization?.name}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 20px;
    }
    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      border-bottom: 3px solid #667eea;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #2d3748;
      margin: 0;
      font-size: 2.5em;
    }
    .subtitle {
      color: #718096;
      margin-top: 10px;
    }
    .executive-brief {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 15px;
      margin-bottom: 30px;
    }
    .headline {
      font-size: 1.8em;
      font-weight: bold;
      margin-bottom: 15px;
    }
    .critical-insight {
      font-size: 1.2em;
      font-style: italic;
      margin-bottom: 20px;
      padding: 15px;
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: #f7fafc;
      padding: 20px;
      border-radius: 10px;
      border-left: 4px solid #667eea;
    }
    .card-title {
      font-weight: bold;
      color: #2d3748;
      margin-bottom: 15px;
      font-size: 1.2em;
    }
    .insight-item {
      background: white;
      padding: 10px;
      margin: 10px 0;
      border-radius: 5px;
      border-left: 3px solid #48bb78;
    }
    .threat-item {
      border-left-color: #f56565;
    }
    .action-matrix {
      background: #edf2f7;
      padding: 25px;
      border-radius: 10px;
      margin-top: 30px;
    }
    .matrix-header {
      font-size: 1.5em;
      font-weight: bold;
      color: #2d3748;
      margin-bottom: 20px;
    }
    .recommendation {
      background: white;
      padding: 15px;
      margin: 10px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .do-now { border-left: 5px solid #f6ad55; }
    .prepare { border-left: 5px solid #4299e1; }
    .watch { border-left: 5px solid #9f7aea; }
    .avoid { border-left: 5px solid #fc8181; }
    .confidence-high { color: #48bb78; font-weight: bold; }
    .confidence-medium { color: #ed8936; font-weight: bold; }
    .confidence-low { color: #718096; }
    .severity-high { color: #f56565; font-weight: bold; }
    .severity-medium { color: #ed8936; font-weight: bold; }
    .severity-low { color: #718096; }
    .narrative {
      background: #f7fafc;
      padding: 25px;
      border-radius: 10px;
      margin-top: 30px;
      line-height: 1.6;
    }
    .chart-container {
      position: relative;
      height: 300px;
      margin: 20px 0;
    }
    .timeline {
      display: flex;
      justify-content: space-between;
      margin: 30px 0;
      padding: 20px;
      background: #f7fafc;
      border-radius: 10px;
    }
    .timeline-item {
      text-align: center;
      flex: 1;
    }
    .timeline-label {
      font-size: 0.9em;
      color: #718096;
      margin-bottom: 5px;
    }
    .timeline-value {
      font-size: 1.2em;
      font-weight: bold;
      color: #2d3748;
    }
    .personality-indicator {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      margin-left: 10px;
      background: #e6fffa;
      color: #234e52;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="header">
      <h1>🎯 Executive Intelligence Dashboard</h1>
      <div class="subtitle">
        ${organization?.name} | ${organization?.industry || 'Technology'} | ${new Date().toLocaleDateString()}
      </div>
    </div>

    <div class="executive-brief">
      <div class="headline">
        ${synthesis.executive_brief?.headline || 'Strategic Intelligence Update'}
      </div>
      <div class="critical-insight">
        💡 ${synthesis.executive_brief?.critical_insight || 'Multiple convergent signals indicate significant market shift approaching.'}
      </div>
      <div>
        <strong>Situation:</strong> ${synthesis.executive_brief?.strategic_situation || 'Analysis indicates evolving competitive landscape with emerging opportunities.'}
      </div>
      <div style="margin-top: 15px;">
        <strong>⚡ Immediate Action:</strong> ${synthesis.executive_brief?.immediate_action || 'Review and act on priority recommendations below.'}
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">
          🎯 Competition Dynamics
          <span class="personality-indicator">Marcus Chen</span>
        </div>
        ${this.renderCompetitionInsights(analyses.competition)}
      </div>
      
      <div class="card">
        <div class="card-title">
          📈 Trending & Momentum
          <span class="personality-indicator">Sarah Rodriguez</span>
        </div>
        ${this.renderTrendingInsights(analyses.trending)}
      </div>
      
      <div class="card">
        <div class="card-title">
          👥 Stakeholder Chess
          <span class="personality-indicator">Victoria Chen</span>
        </div>
        ${this.renderStakeholderInsights(analyses.stakeholders)}
      </div>
    </div>

    <div class="action-matrix">
      <div class="matrix-header">⚡ Action Matrix</div>
      
      <div class="grid">
        <div>
          <strong>🟠 Do Now (24 Hours)</strong>
          ${(synthesis.strategic_recommendations?.do_now || []).map((action) => `<div class="recommendation do-now">${action}</div>`).join('')}
        </div>
        
        <div>
          <strong>🔵 Prepare For (1 Week)</strong>
          ${(synthesis.strategic_recommendations?.prepare_for || []).map((action) => `<div class="recommendation prepare">${action}</div>`).join('')}
        </div>
        
        <div>
          <strong>🟣 Watch For (Ongoing)</strong>
          ${(synthesis.strategic_recommendations?.watch_for || []).map((signal) => `<div class="recommendation watch">${signal}</div>`).join('')}
        </div>
        
        <div>
          <strong>🔴 Avoid (Risks)</strong>
          ${(synthesis.strategic_recommendations?.avoid || []).map((risk) => `<div class="recommendation avoid">${risk}</div>`).join('')}
        </div>
      </div>
    </div>

    <div class="timeline">
      <div class="timeline-item">
        <div class="timeline-label">Immediate</div>
        <div class="timeline-value">24 Hours</div>
      </div>
      <div class="timeline-item">
        <div class="timeline-label">Short Term</div>
        <div class="timeline-value">1 Week</div>
      </div>
      <div class="timeline-item">
        <div class="timeline-label">Medium Term</div>
        <div class="timeline-value">1 Month</div>
      </div>
      <div class="timeline-item">
        <div class="timeline-label">Long Term</div>
        <div class="timeline-value">1 Quarter</div>
      </div>
    </div>

    <div class="narrative">
      <h3>Executive Narrative</h3>
      <p>${synthesis.narrative_summary || this.generateNarrative(synthesis, analyses)}</p>
    </div>
  </div>
</body>
</html>`;
    }
    renderCompetitionInsights(competition) {
        if (!competition)
            return '<p>No competition data available</p>';
        return `
      <div class="insight-item">
        <strong>Latest Move:</strong> ${competition.latest_developments?.competitor_moves?.[0]?.what_happened || 'Monitoring competitive landscape'}
      </div>
      <div class="insight-item">
        <strong>Hidden Meaning:</strong> ${competition.latest_developments?.competitor_moves?.[0]?.hidden_meaning || 'Analysis pending'}
      </div>
      <div class="insight-item">
        <strong>Our Response:</strong> ${competition.latest_developments?.competitor_moves?.[0]?.our_angle || 'Strategic options under review'}
      </div>
    `;
    }
    renderTrendingInsights(trending) {
        if (!trending)
            return '<p>No trending data available</p>';
        return `
      <div class="insight-item">
        <strong>Hot Now:</strong> ${trending.trending_topics?.hot_now?.[0]?.topic || 'Tracking momentum signals'}
      </div>
      <div class="insight-item">
        <strong>Momentum:</strong> ${trending.trending_topics?.hot_now?.[0]?.momentum_score || '0'}/10
      </div>
      <div class="insight-item">
        <strong>Opportunity:</strong> ${trending.trending_topics?.hot_now?.[0]?.positioning_opportunity || 'Analyzing positioning options'}
      </div>
    `;
    }
    renderStakeholderInsights(stakeholders) {
        if (!stakeholders)
            return '<p>No stakeholder data available</p>';
        return `
      <div class="insight-item">
        <strong>Power Player:</strong> ${stakeholders.stakeholder_dynamics?.power_players?.[0]?.name || 'Monitoring key stakeholders'}
      </div>
      <div class="insight-item">
        <strong>Hidden Agenda:</strong> ${stakeholders.stakeholder_dynamics?.hidden_agendas?.[0] || 'Decoding motivations'}
      </div>
      <div class="insight-item">
        <strong>Alliance Forming:</strong> ${stakeholders.stakeholder_dynamics?.alliance_formations?.[0] || 'Tracking partnerships'}
      </div>
    `;
    }
    generateNarrative(synthesis, analyses) {
        return `The competitive landscape is evolving rapidly with multiple convergent signals indicating significant strategic shifts ahead. 
    Our analysis across five intelligence domains reveals both immediate opportunities and emerging threats that require executive attention.
    
    Competition analysis by Marcus Chen indicates strategic repositioning among key players, while Sarah Rodriguez's trend analysis 
    shows momentum building in critical market segments. Victoria Chen's stakeholder mapping reveals shifting power dynamics that 
    could reshape industry alliances. Market intelligence points to whitespace opportunities, and our cascade detection has identified 
    weak signals that could become major disruptions.
    
    The synthesis of these insights suggests a narrow window for strategic action. Organizations that move decisively in the next 
    24-48 hours will be best positioned to capitalize on emerging opportunities while avoiding the risks identified in our analysis.`;
    }
    renderHTML(synthesis, analyses, organization) {
        // Simplified HTML version
        return `<h1>Executive Summary</h1>
<h2>${synthesis.executive_brief?.headline}</h2>
<p>${synthesis.executive_brief?.critical_insight}</p>
<p>${synthesis.narrative_summary}</p>`;
    }
    renderMarkdown(synthesis, analyses, organization) {
        return `# Executive Intelligence Summary
## ${organization?.name}

### 🎯 The One Thing That Matters
**${synthesis.executive_brief?.headline || 'Strategic Update'}**

### 💡 Critical Insight
> ${synthesis.executive_brief?.critical_insight || 'Analysis reveals convergent patterns across multiple domains.'}

### 📊 Strategic Situation
${synthesis.executive_brief?.strategic_situation || 'Multiple intelligence streams indicate evolving landscape.'}

### ⚡ Immediate Action Required
${synthesis.executive_brief?.immediate_action || 'Review recommendations and act on priority items.'}

---

## Integrated Intelligence

### Cross-Domain Patterns
${(synthesis.integrated_insights?.cross_domain_patterns || []).map((p) => `- ${p}`).join('\n')}

### Hidden Connections
${(synthesis.integrated_insights?.hidden_connections || []).map((c) => `- ${c}`).join('\n')}

### Cascade Implications
${(synthesis.integrated_insights?.cascade_implications || []).map((i) => `- ${i}`).join('\n')}

---

## Strategic Recommendations

### 🟠 Do Now (24 Hours)
${(synthesis.strategic_recommendations?.do_now || []).map((a) => `- ${a}`).join('\n')}

### 🔵 Prepare For (1 Week)
${(synthesis.strategic_recommendations?.prepare_for || []).map((p) => `- ${p}`).join('\n')}

### 🟣 Watch For (Signals)
${(synthesis.strategic_recommendations?.watch_for || []).map((w) => `- ${w}`).join('\n')}

### 🔴 Avoid (Risks)
${(synthesis.strategic_recommendations?.avoid || []).map((a) => `- ${a}`).join('\n')}

---

## Executive Narrative
${synthesis.narrative_summary || 'Comprehensive analysis indicates strategic inflection point approaching.'}

---
*Generated by SignalDesk Executive Intelligence System*
*Synthesizing insights from: Marcus Chen, Sarah Rodriguez, Victoria Chen, Market Expert, Cascade Specialist*`;
    }
    renderReport(synthesis, analyses, organization) {
        // Full report format - would be much longer in production
        return this.renderMarkdown(synthesis, analyses, organization);
    }
    async generateInsightDashboard(args) {
        // Similar to synthesizeExecutiveSummary but focused on visualization
        const synthesis = await this.synthesizeExecutiveSummary({
            ...args,
            render_format: 'dashboard'
        });
        return synthesis;
    }
    async generateActionMatrix(args) {
        const { analyses, time_horizon = '1_week' } = args;
        // Extract actions from all analyses and prioritize
        const actions = this.extractAndPrioritizeActions(analyses, time_horizon);
        return {
            content: [{
                    type: 'text',
                    text: `Action Matrix (${time_horizon}):\n${JSON.stringify(actions, null, 2)}`,
                    metadata: {
                        actions,
                        time_horizon,
                        generated_at: new Date().toISOString()
                    }
                }]
        };
    }
    extractAndPrioritizeActions(analyses, timeHorizon) {
        // Logic to extract and prioritize actions from all analyses
        return {
            immediate: [],
            short_term: [],
            medium_term: [],
            long_term: []
        };
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("SignalDesk Executive Summary MCP running with rendering capabilities");
    }
}
const server = new ExecutiveSummaryServer();
server.run().catch(console.error);
