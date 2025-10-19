// #/usr/bin/env node

/**
 * SignalDesk Monitor MCP Server
 * Provides real-time stakeholder intelligence monitoring with MCP protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Pool } from 'pg';
import { WebSocket } from 'ws';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/signaldesk',
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

// WebSocket for real-time updates
let wsConnection: WebSocket | null = null;

class StakeholderMonitoringServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'signaldesk-monitor',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupErrorHandling();
    this.initializeRealTimeMonitoring();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'start_monitoring',
          description: 'Start real-time stakeholder intelligence monitoring',
          inputSchema: {
            type: 'object',
            properties: {
              organizationId: { type: 'string', description: 'Organization ID to monitor' },
              stakeholders: { type: 'array', items: { type: 'string' }, description: 'List of stakeholder names' },
              keywords: { type: 'array', items: { type: 'string' }, description: 'Keywords to monitor' },
              sources: { type: 'array', items: { type: 'string' }, description: 'Data sources to monitor' }
            },
            required: ['organizationId']
          }
        },
        {
          name: 'stop_monitoring',
          description: 'Stop stakeholder monitoring for organization',
          inputSchema: {
            type: 'object',
            properties: {
              organizationId: { type: 'string', description: 'Organization ID' }
            },
            required: ['organizationId']
          }
        },
        {
          name: 'get_live_intelligence',
          description: 'Get current stakeholder intelligence findings',
          inputSchema: {
            type: 'object',
            properties: {
              organizationId: { type: 'string', description: 'Organization ID' },
              limit: { type: 'number', description: 'Max findings to return', default: 50 },
              timeframe: { type: 'string', enum: ['1h', '6h', '24h', '7d'], default: '24h' }
            },
            required: ['organizationId']
          }
        },
        {
          name: 'analyze_trending_with_sarah',
          description: 'Sarah Rodriguez spots momentum and viral potential in industry trends',
          inputSchema: {
            type: 'object',
            properties: {
              findings: { 
                type: 'array', 
                description: 'News and monitoring findings to analyze for trends' 
              },
              organization: { 
                type: 'object', 
                description: 'Target organization context' 
              },
              analysis_depth: { 
                type: 'string', 
                enum: ['quick', 'standard', 'deep'],
                description: 'Analysis depth (affects timeout)'
              }
            },
            required: ['findings', 'organization']
          }
        },
        {
          name: 'analyze_stakeholder',
          description: 'Analyze specific stakeholder for intelligence and opportunities',
          inputSchema: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string', description: 'Stakeholder name or ID' },
              analysisType: { type: 'string', enum: ['opportunity', 'risk', 'sentiment', 'comprehensive'], default: 'comprehensive' }
            },
            required: ['stakeholder']
          }
        },
        {
          name: 'create_intelligence_alert',
          description: 'Create real-time alert for stakeholder changes',
          inputSchema: {
            type: 'object',
            properties: {
              organizationId: { type: 'string', description: 'Organization ID' },
              stakeholder: { type: 'string', description: 'Stakeholder to monitor' },
              alertType: { type: 'string', enum: ['mention', 'sentiment_change', 'opportunity', 'crisis'] },
              threshold: { type: 'number', description: 'Alert threshold (0-100)', default: 70 }
            },
            required: ['organizationId', 'stakeholder', 'alertType']
          }
        },
        {
          name: 'get_monitoring_status',
          description: 'Get current monitoring status and metrics',
          inputSchema: {
            type: 'object',
            properties: {
              organizationId: { type: 'string', description: 'Organization ID' }
            },
            required: ['organizationId']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'start_monitoring':
            return await this.startMonitoring(args as any);
          case 'stop_monitoring':
            return await this.stopMonitoring(args as any);
          case 'get_live_intelligence':
            return await this.getLiveIntelligence(args as any);
          case 'analyze_trending_with_sarah':
            return await this.analyzeTrendingWithSarah(args as any);
          case 'analyze_stakeholder':
            return await this.analyzeStakeholder(args as any);
          case 'create_intelligence_alert':
            return await this.createAlert(args as any);
          case 'get_monitoring_status':
            return await this.getMonitoringStatus(args as any);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    });
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'signaldesk://monitor/live-intelligence',
          name: 'Live Intelligence Feed',
          description: 'Real-time stakeholder intelligence findings',
          mimeType: 'application/json'
        },
        {
          uri: 'signaldesk://monitor/stakeholder-profiles',
          name: 'Stakeholder Profiles',
          description: 'Detailed profiles of monitored stakeholders',
          mimeType: 'application/json'
        },
        {
          uri: 'signaldesk://monitor/alerts',
          name: 'Intelligence Alerts',
          description: 'Active monitoring alerts and notifications',
          mimeType: 'application/json'
        },
        {
          uri: 'signaldesk://monitor/opportunities',
          name: 'Live Opportunities',
          description: 'Real-time PR opportunities from stakeholder monitoring',
          mimeType: 'application/json'
        }
      ]
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      
      try {
        switch (uri) {
          case 'signaldesk://monitor/live-intelligence':
            return await this.getLiveIntelligenceResource();
          case 'signaldesk://monitor/stakeholder-profiles':
            return await this.getStakeholderProfilesResource();
          case 'signaldesk://monitor/alerts':
            return await this.getAlertsResource();
          case 'signaldesk://monitor/opportunities':
            return await this.getOpportunitiesResource();
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
      } catch (error) {
        return {
          contents: [{
            uri,
            mimeType: 'text/plain',
            text: `Error reading resource: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    });
  }

  // Tool implementations
  private async startMonitoring(args: { organizationId: string; stakeholders?: string[]; keywords?: string[]; sources?: string[] }) {
    const { organizationId, stakeholders = [], keywords = [], sources = [] } = args;

    // Create intelligence targets for each stakeholder
    for (const stakeholder of stakeholders) {
      await pool.query(
        `INSERT INTO intelligence_targets (organization_id, name, type, keywords, active, settings, created_at)
         VALUES ($1, $2, 'stakeholder', $3, true, $4, NOW())
         ON CONFLICT (organization_id, name) DO UPDATE SET
         keywords = $3, active = true, settings = $4, updated_at = NOW()`,
        [organizationId, stakeholder, keywords, JSON.stringify({ sources, monitoring: true })]
      );
    }

    // Start monitoring run
    const monitoringRun = await pool.query(
      `INSERT INTO monitoring_runs (organization_id, status, started_at, metadata)
       VALUES ($1, 'running', NOW(), $2) RETURNING id`,
      [organizationId, JSON.stringify({ stakeholders, keywords, sources })]
    );

    return {
      content: [{
        type: 'text',
        text: `Started monitoring for organization ${organizationId}. Tracking ${stakeholders.length} stakeholders with ${keywords.length} keywords across ${sources.length} sources. Monitoring run ID: ${monitoringRun.rows[0].id}`
      }]
    };
  }

  private async stopMonitoring(args: { organizationId: string }) {
    const { organizationId } = args;

    // Stop active monitoring runs
    await pool.query(
      `UPDATE monitoring_runs SET status = 'stopped', completed_at = NOW() 
       WHERE organization_id = $1 AND status = 'running'`,
      [organizationId]
    );

    // Deactivate targets
    await pool.query(
      `UPDATE intelligence_targets SET active = false 
       WHERE organization_id = $1`,
      [organizationId]
    );

    return {
      content: [{
        type: 'text',
        text: `Stopped monitoring for organization ${organizationId}`
      }]
    };
  }

  private async getLiveIntelligence(args: { organizationId: string; limit?: number; timeframe?: string }) {
    const { organizationId, limit = 50, timeframe = '24h' } = args;

    const timeMapping = {
      '1h': '1 hour',
      '6h': '6 hours', 
      '24h': '24 hours',
      '7d': '7 days'
    };

    const findings = await pool.query(
      `SELECT * FROM intelligence_findings 
       WHERE organization_id = $1 
       AND created_at > NOW() - INTERVAL '${timeMapping[timeframe as keyof typeof timeMapping]}'
       ORDER BY created_at DESC 
       LIMIT $2`,
      [organizationId, limit]
    );

    return {
      content: [{
        type: 'text',
        text: `Found ${findings.rows.length} intelligence findings in the last ${timeframe}:\n\n` +
              findings.rows.map(f => 
                `• ${f.title} (${f.sentiment || 'neutral'} sentiment, relevance: ${f.relevance_score || 0}%)\n  Source: ${f.source}\n  Created: ${new Date(f.created_at).toLocaleString()}`
              ).join('\n\n')
      }]
    };
  }

  private async analyzeTrendingWithSarah(args: { findings: any[]; organization: any; analysis_depth?: string }) {
    const { findings, organization, analysis_depth = 'standard' } = args;
    
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return {
        content: [{
          type: 'text',
          text: '❌ ANTHROPIC_API_KEY not configured. Cannot perform Sarah Rodriguez trending analysis.'
        }]
      };
    }
    
    // Sarah Rodriguez personality - trend spotter extraordinaire
    const personality = `You are Sarah Rodriguez, a trend intelligence analyst who spots what's gaining momentum in the ${organization?.industry || 'business'} industry RIGHT NOW. You identify emerging trends, viral topics, narrative shifts, and cascade patterns before they become obvious. Your superpower is seeing which small signals will become big movements.`;
    
    const prompt = `${personality}

Your approach to TODAY's trending topics:
- FIRST, identify what topics are trending from the news
- Track momentum - what's accelerating vs declining
- Spot industry narrative shifts happening NOW
- Identify viral potential in current stories
- Decode why certain topics are gaining traction
- Find trend-jacking opportunities for positioning

ANALYSIS TARGET:
Organization: ${organization?.name || 'Unknown'}
Industry: ${organization?.industry || 'Unknown'}

News items to analyze for trends:
${findings?.map((f, i) => `${i+1}. "${f.title}" - ${f.source} ${f.date ? `(${f.date})` : ''}`).join('\n') || 'No findings'}

Provide analysis in this exact JSON structure:
{
  "trending_topics": {
    "hot_now": [
      {
        "topic": "Industry trend from headlines",
        "evidence": ["Specific headlines showing this trend"],
        "momentum_score": "1-10 based on coverage volume",
        "viral_potential": "high/medium/low",
        "industry_impact": "How this affects the industry",
        "positioning_opportunity": "How to ride or shape this trend"
      }
    ],
    "emerging_trends": [
      {
        "trend": "What's just starting to gain traction",
        "early_signals": ["News items showing early momentum"],
        "trajectory": "Where this is heading",
        "first_mover_advantage": "Opportunity if we act now"
      }
    ],
    "dying_trends": [
      {
        "trend": "What's losing momentum",
        "evidence": ["Headlines showing decline"],
        "risk": "Risk if we're still associated with this"
      }
    ]
  },
  "cascade_detection": {
    "weak_signals": [
      {
        "signal": "Small trend that could explode",
        "evidence": "Early indicators from news",
        "cascade_potential": "Why this could go big",
        "preparation": "How to prepare for it"
      }
    ]
  },
  "sharp_insights": [
    "Non-obvious connection about trending patterns",
    "What the silence on certain topics reveals",
    "Prediction about next trend cycle"
  ],
  "recommendations": {
    "ride_the_wave": ["Trends to leverage NOW"],
    "avoid": ["Trends to stay away from"],
    "prepare_for": ["Emerging trends to get ready for"]
  }
}`;

    try {
      const timeout = analysis_depth === 'deep' ? 45000 : 
                     analysis_depth === 'quick' ? 15000 : 30000;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
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
          temperature: 0.8, // Higher for creative trend spotting
          messages: [{
            role: 'user',
            content: prompt
          }]
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Claude API failed: ${response.status}`);
      }
      
      const claudeData = await response.json();
      const content = claudeData.content[0].text;
      
      // Extract JSON from Claude's response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        return {
          content: [{
            type: 'text',
            text: `📈 Trending Analysis by Sarah Rodriguez

🔥 HOT RIGHT NOW:
${analysis.trending_topics?.hot_now?.map((topic: any) => 
  `• ${topic.topic} (Momentum: ${topic.momentum_score}/10)
  Viral Potential: ${topic.viral_potential}
  Opportunity: ${topic.positioning_opportunity}`
).join('\n\n') || 'No hot trends detected'}

🌱 EMERGING TRENDS:
${analysis.trending_topics?.emerging_trends?.map((trend: any) => 
  `• ${trend.trend}
  Trajectory: ${trend.trajectory}
  First Mover: ${trend.first_mover_advantage}`
).join('\n\n') || 'No emerging trends detected'}

⚡ CASCADE DETECTION:
${analysis.cascade_detection?.weak_signals?.map((signal: any) => 
  `• Signal: ${signal.signal}
  Potential: ${signal.cascade_potential}`
).join('\n\n') || 'No cascade signals detected'}

💡 SHARP INSIGHTS:
${analysis.sharp_insights?.map((insight: string) => `• ${insight}`).join('\n') || 'No insights generated'}

📋 SARAH'S RECOMMENDATIONS:
Ride: ${analysis.recommendations?.ride_the_wave?.join(', ') || 'None'}
Avoid: ${analysis.recommendations?.avoid?.join(', ') || 'None'}
Prepare: ${analysis.recommendations?.prepare_for?.join(', ') || 'None'}`,
            metadata: {
              analysis,
              personality: 'trending_analyst',
              analysis_depth,
              findings_analyzed: findings?.length || 0
            }
          }]
        };
      } else {
        throw new Error('No JSON found in Claude response');
      }
      
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ Error in Sarah's trending analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }

  private async analyzeStakeholder(args: { stakeholder: string; analysisType?: string }) {
    const { stakeholder, analysisType = 'comprehensive' } = args;

    const target = await pool.query(
      `SELECT * FROM intelligence_targets WHERE name ILIKE $1 LIMIT 1`,
      [`%${stakeholder}%`]
    );

    if (target.rows.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `Stakeholder "${stakeholder}" not found in monitoring targets`
        }]
      };
    }

    const targetData = target.rows[0];
    const findings = await pool.query(
      `SELECT * FROM intelligence_findings 
       WHERE target_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [targetData.id]
    );

    // Analyze findings based on type
    let analysis = '';
    switch (analysisType) {
      case 'opportunity':
        analysis = this.analyzeOpportunities(findings.rows);
        break;
      case 'risk':
        analysis = this.analyzeRisks(findings.rows);
        break;
      case 'sentiment':
        analysis = this.analyzeSentiment(findings.rows);
        break;
      default:
        analysis = this.comprehensiveAnalysis(findings.rows, targetData);
    }

    return {
      content: [{
        type: 'text',
        text: `Analysis for ${stakeholder} (${analysisType}):\n\n${analysis}`
      }]
    };
  }

  private async createAlert(args: { organizationId: string; stakeholder: string; alertType: string; threshold?: number }) {
    const { organizationId, stakeholder, alertType, threshold = 70 } = args;

    const alertId = await pool.query(
      `INSERT INTO monitoring_alerts (organization_id, stakeholder, alert_type, threshold, active, created_at)
       VALUES ($1, $2, $3, $4, true, NOW()) RETURNING id`,
      [organizationId, stakeholder, alertType, threshold]
    );

    return {
      content: [{
        type: 'text',
        text: `Created ${alertType} alert for ${stakeholder} with threshold ${threshold}%. Alert ID: ${alertId.rows[0].id}`
      }]
    };
  }

  private async getMonitoringStatus(args: { organizationId: string }) {
    const { organizationId } = args;

    const [targets, runs, findings] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM intelligence_targets WHERE organization_id = $1 AND active = true`, [organizationId]),
      pool.query(`SELECT * FROM monitoring_runs WHERE organization_id = $1 ORDER BY started_at DESC LIMIT 1`, [organizationId]),
      pool.query(`SELECT COUNT(*) as count FROM intelligence_findings WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '24 hours'`, [organizationId])
    ]);

    const status = {
      activeTargets: parseInt(targets.rows[0].count),
      latestRun: runs.rows[0] || null,
      findingsLast24h: parseInt(findings.rows[0].count),
      isActive: runs.rows[0]?.status === 'running'
    };

    return {
      content: [{
        type: 'text',
        text: `Monitoring Status for ${organizationId}:
        
• Active Targets: ${status.activeTargets}
• Status: ${status.isActive ? 'Running' : 'Stopped'}
• Findings (24h): ${status.findingsLast24h}
• Last Run: ${status.latestRun ? new Date(status.latestRun.started_at).toLocaleString() : 'Never'}`
      }]
    };
  }

  // Resource implementations
  private async getLiveIntelligenceResource() {
    const findings = await pool.query(
      `SELECT * FROM intelligence_findings 
       WHERE created_at > NOW() - INTERVAL '1 hour'
       ORDER BY created_at DESC 
       LIMIT 100`
    );

    return {
      contents: [{
        uri: 'signaldesk://monitor/live-intelligence',
        mimeType: 'application/json',
        text: JSON.stringify(findings.rows, null, 2)
      }]
    };
  }

  private async getStakeholderProfilesResource() {
    const profiles = await pool.query(
      `SELECT t.*, COUNT(f.id) as findings_count,
              AVG(f.relevance_score) as avg_relevance,
              MAX(f.created_at) as last_finding
       FROM intelligence_targets t
       LEFT JOIN intelligence_findings f ON t.id = f.target_id
       WHERE t.active = true
       GROUP BY t.id
       ORDER BY findings_count DESC`
    );

    return {
      contents: [{
        uri: 'signaldesk://monitor/stakeholder-profiles',
        mimeType: 'application/json',
        text: JSON.stringify(profiles.rows, null, 2)
      }]
    };
  }

  private async getAlertsResource() {
    const alerts = await pool.query(
      `SELECT * FROM monitoring_alerts 
       WHERE active = true 
       ORDER BY created_at DESC`
    );

    return {
      contents: [{
        uri: 'signaldesk://monitor/alerts',
        mimeType: 'application/json',
        text: JSON.stringify(alerts.rows, null, 2)
      }]
    };
  }

  private async getOpportunitiesResource() {
    const opportunities = await pool.query(
      `SELECT * FROM opportunity_queue 
       WHERE status = 'pending' 
       ORDER BY score DESC 
       LIMIT 50`
    );

    return {
      contents: [{
        uri: 'signaldesk://monitor/opportunities',
        mimeType: 'application/json',
        text: JSON.stringify(opportunities.rows, null, 2)
      }]
    };
  }

  // Analysis helper methods
  private analyzeOpportunities(findings: any[]): string {
    const opportunities = findings.filter(f => f.sentiment === 'positive' || f.relevance_score > 80);
    return `Found ${opportunities.length} opportunity indicators:\n\n` + 
           opportunities.map(o => `• ${o.title} (Score: ${o.relevance_score}%)`).join('\n');
  }

  private analyzeRisks(findings: any[]): string {
    const risks = findings.filter(f => f.sentiment === 'negative' || (f.keywords && f.keywords.some((k: string) => k.includes('crisis'))));
    return `Identified ${risks.length} potential risks:\n\n` + 
           risks.map(r => `• ${r.title} (Sentiment: ${r.sentiment})`).join('\n');
  }

  private analyzeSentiment(findings: any[]): string {
    const sentiment = findings.reduce((acc, f) => {
      acc[f.sentiment || 'neutral']++;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });

    const total = findings.length;
    return `Sentiment Analysis (${total} findings):
• Positive: ${sentiment.positive} (${Math.round(sentiment.positive/total*100)}%)
• Negative: ${sentiment.negative} (${Math.round(sentiment.negative/total*100)}%)
• Neutral: ${sentiment.neutral} (${Math.round(sentiment.neutral/total*100)}%)`;
  }

  private comprehensiveAnalysis(findings: any[], target: any): string {
    return `Comprehensive Analysis for ${target.name}:

📊 Activity: ${findings.length} findings tracked
🎯 Keywords: ${target.keywords?.length || 0} monitored
📈 Avg Relevance: ${Math.round(findings.reduce((sum, f) => sum + (f.relevance_score || 0), 0) / findings.length) || 0}%
🕐 Last Updated: ${findings[0] ? new Date(findings[0].created_at).toLocaleString() : 'Never'}

${this.analyzeSentiment(findings)}

Recent Activity:
${findings.slice(0, 5).map(f => `• ${f.title} (${new Date(f.created_at).toLocaleDateString()})`).join('\n')}`;
  }

  private initializeRealTimeMonitoring() {
    // Set up real-time monitoring with database triggers or polling
    setInterval(async () => {
      try {
        // Check for new findings and push to WebSocket if connected
        const newFindings = await pool.query(
          `SELECT * FROM intelligence_findings 
           WHERE created_at > NOW() - INTERVAL '5 minutes'
           ORDER BY created_at DESC`
        );

        if (wsConnection && newFindings.rows.length > 0) {
          wsConnection.send(JSON.stringify({
            type: 'new_findings',
            data: newFindings.rows
          }));
        }
      } catch (error) {
        console.error('Real-time monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SignalDesk Monitor MCP server running on stdio');
  }
}

const server = new StakeholderMonitoringServer();
server.run().catch(console.error);