// #/usr/bin/env node
/**
 * SignalDesk Monitor MCP Server
 * Provides real-time stakeholder intelligence monitoring with MCP protocol
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { Pool } from 'pg';
// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/signaldesk',
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});
// WebSocket for real-time updates
let wsConnection = null;
class StakeholderMonitoringServer {
    server;
    constructor() {
        this.server = new Server({
            name: 'signaldesk-monitor',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
                resources: {},
            },
        });
        this.setupToolHandlers();
        this.setupResourceHandlers();
        this.setupErrorHandling();
        this.initializeRealTimeMonitoring();
    }
    setupToolHandlers() {
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
                        return await this.startMonitoring(args);
                    case 'stop_monitoring':
                        return await this.stopMonitoring(args);
                    case 'get_live_intelligence':
                        return await this.getLiveIntelligence(args);
                    case 'analyze_trending_with_sarah':
                        return await this.analyzeTrendingWithSarah(args);
                    case 'analyze_stakeholder':
                        return await this.analyzeStakeholder(args);
                    case 'create_intelligence_alert':
                        return await this.createAlert(args);
                    case 'get_monitoring_status':
                        return await this.getMonitoringStatus(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
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
    setupResourceHandlers() {
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
            }
            catch (error) {
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
    async startMonitoring(args) {
        const { organizationId, stakeholders = [], keywords = [], sources = [] } = args;
        // Create intelligence targets for each stakeholder
        for (const stakeholder of stakeholders) {
            await pool.query(`INSERT INTO intelligence_targets (organization_id, name, type, keywords, active, settings, created_at)
         VALUES ($1, $2, 'stakeholder', $3, true, $4, NOW())
         ON CONFLICT (organization_id, name) DO UPDATE SET
         keywords = $3, active = true, settings = $4, updated_at = NOW()`, [organizationId, stakeholder, keywords, JSON.stringify({ sources, monitoring: true })]);
        }
        // Start monitoring run
        const monitoringRun = await pool.query(`INSERT INTO monitoring_runs (organization_id, status, started_at, metadata)
       VALUES ($1, 'running', NOW(), $2) RETURNING id`, [organizationId, JSON.stringify({ stakeholders, keywords, sources })]);
        return {
            content: [{
                    type: 'text',
                    text: `Started monitoring for organization ${organizationId}. Tracking ${stakeholders.length} stakeholders with ${keywords.length} keywords across ${sources.length} sources. Monitoring run ID: ${monitoringRun.rows[0].id}`
                }]
        };
    }
    async stopMonitoring(args) {
        const { organizationId } = args;
        // Stop active monitoring runs
        await pool.query(`UPDATE monitoring_runs SET status = 'stopped', completed_at = NOW() 
       WHERE organization_id = $1 AND status = 'running'`, [organizationId]);
        // Deactivate targets
        await pool.query(`UPDATE intelligence_targets SET active = false 
       WHERE organization_id = $1`, [organizationId]);
        return {
            content: [{
                    type: 'text',
                    text: `Stopped monitoring for organization ${organizationId}`
                }]
        };
    }
    async getLiveIntelligence(args) {
        const { organizationId, limit = 50, timeframe = '24h' } = args;
        const timeMapping = {
            '1h': '1 hour',
            '6h': '6 hours',
            '24h': '24 hours',
            '7d': '7 days'
        };
        const findings = await pool.query(`SELECT * FROM intelligence_findings 
       WHERE organization_id = $1 
       AND created_at > NOW() - INTERVAL '${timeMapping[timeframe]}'
       ORDER BY created_at DESC 
       LIMIT $2`, [organizationId, limit]);
        return {
            content: [{
                    type: 'text',
                    text: `Found ${findings.rows.length} intelligence findings in the last ${timeframe}:\n\n` +
                        findings.rows.map(f => `• ${f.title} (${f.sentiment || 'neutral'} sentiment, relevance: ${f.relevance_score || 0}%)\n  Source: ${f.source}\n  Created: ${new Date(f.created_at).toLocaleString()}`).join('\n\n')
                }]
        };
    }
    async analyzeTrendingWithSarah(args) {
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
${findings?.map((f, i) => `${i + 1}. "${f.title}" - ${f.source} ${f.date ? `(${f.date})` : ''}`).join('\n') || 'No findings'}

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
${analysis.trending_topics?.hot_now?.map((topic) => `• ${topic.topic} (Momentum: ${topic.momentum_score}/10)
  Viral Potential: ${topic.viral_potential}
  Opportunity: ${topic.positioning_opportunity}`).join('\n\n') || 'No hot trends detected'}

🌱 EMERGING TRENDS:
${analysis.trending_topics?.emerging_trends?.map((trend) => `• ${trend.trend}
  Trajectory: ${trend.trajectory}
  First Mover: ${trend.first_mover_advantage}`).join('\n\n') || 'No emerging trends detected'}

⚡ CASCADE DETECTION:
${analysis.cascade_detection?.weak_signals?.map((signal) => `• Signal: ${signal.signal}
  Potential: ${signal.cascade_potential}`).join('\n\n') || 'No cascade signals detected'}

💡 SHARP INSIGHTS:
${analysis.sharp_insights?.map((insight) => `• ${insight}`).join('\n') || 'No insights generated'}

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
            }
            else {
                throw new Error('No JSON found in Claude response');
            }
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `❌ Error in Sarah's trending analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                isError: true
            };
        }
    }
    async analyzeStakeholder(args) {
        const { stakeholder, analysisType = 'comprehensive' } = args;
        const target = await pool.query(`SELECT * FROM intelligence_targets WHERE name ILIKE $1 LIMIT 1`, [`%${stakeholder}%`]);
        if (target.rows.length === 0) {
            return {
                content: [{
                        type: 'text',
                        text: `Stakeholder "${stakeholder}" not found in monitoring targets`
                    }]
            };
        }
        const targetData = target.rows[0];
        const findings = await pool.query(`SELECT * FROM intelligence_findings 
       WHERE target_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`, [targetData.id]);
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
    async createAlert(args) {
        const { organizationId, stakeholder, alertType, threshold = 70 } = args;
        const alertId = await pool.query(`INSERT INTO monitoring_alerts (organization_id, stakeholder, alert_type, threshold, active, created_at)
       VALUES ($1, $2, $3, $4, true, NOW()) RETURNING id`, [organizationId, stakeholder, alertType, threshold]);
        return {
            content: [{
                    type: 'text',
                    text: `Created ${alertType} alert for ${stakeholder} with threshold ${threshold}%. Alert ID: ${alertId.rows[0].id}`
                }]
        };
    }
    async getMonitoringStatus(args) {
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
    async getLiveIntelligenceResource() {
        const findings = await pool.query(`SELECT * FROM intelligence_findings 
       WHERE created_at > NOW() - INTERVAL '1 hour'
       ORDER BY created_at DESC 
       LIMIT 100`);
        return {
            contents: [{
                    uri: 'signaldesk://monitor/live-intelligence',
                    mimeType: 'application/json',
                    text: JSON.stringify(findings.rows, null, 2)
                }]
        };
    }
    async getStakeholderProfilesResource() {
        const profiles = await pool.query(`SELECT t.*, COUNT(f.id) as findings_count,
              AVG(f.relevance_score) as avg_relevance,
              MAX(f.created_at) as last_finding
       FROM intelligence_targets t
       LEFT JOIN intelligence_findings f ON t.id = f.target_id
       WHERE t.active = true
       GROUP BY t.id
       ORDER BY findings_count DESC`);
        return {
            contents: [{
                    uri: 'signaldesk://monitor/stakeholder-profiles',
                    mimeType: 'application/json',
                    text: JSON.stringify(profiles.rows, null, 2)
                }]
        };
    }
    async getAlertsResource() {
        const alerts = await pool.query(`SELECT * FROM monitoring_alerts 
       WHERE active = true 
       ORDER BY created_at DESC`);
        return {
            contents: [{
                    uri: 'signaldesk://monitor/alerts',
                    mimeType: 'application/json',
                    text: JSON.stringify(alerts.rows, null, 2)
                }]
        };
    }
    async getOpportunitiesResource() {
        const opportunities = await pool.query(`SELECT * FROM opportunity_queue 
       WHERE status = 'pending' 
       ORDER BY score DESC 
       LIMIT 50`);
        return {
            contents: [{
                    uri: 'signaldesk://monitor/opportunities',
                    mimeType: 'application/json',
                    text: JSON.stringify(opportunities.rows, null, 2)
                }]
        };
    }
    // Analysis helper methods
    analyzeOpportunities(findings) {
        const opportunities = findings.filter(f => f.sentiment === 'positive' || f.relevance_score > 80);
        return `Found ${opportunities.length} opportunity indicators:\n\n` +
            opportunities.map(o => `• ${o.title} (Score: ${o.relevance_score}%)`).join('\n');
    }
    analyzeRisks(findings) {
        const risks = findings.filter(f => f.sentiment === 'negative' || (f.keywords && f.keywords.some((k) => k.includes('crisis'))));
        return `Identified ${risks.length} potential risks:\n\n` +
            risks.map(r => `• ${r.title} (Sentiment: ${r.sentiment})`).join('\n');
    }
    analyzeSentiment(findings) {
        const sentiment = findings.reduce((acc, f) => {
            acc[f.sentiment || 'neutral']++;
            return acc;
        }, { positive: 0, negative: 0, neutral: 0 });
        const total = findings.length;
        return `Sentiment Analysis (${total} findings):
• Positive: ${sentiment.positive} (${Math.round(sentiment.positive / total * 100)}%)
• Negative: ${sentiment.negative} (${Math.round(sentiment.negative / total * 100)}%)
• Neutral: ${sentiment.neutral} (${Math.round(sentiment.neutral / total * 100)}%)`;
    }
    comprehensiveAnalysis(findings, target) {
        return `Comprehensive Analysis for ${target.name}:

📊 Activity: ${findings.length} findings tracked
🎯 Keywords: ${target.keywords?.length || 0} monitored
📈 Avg Relevance: ${Math.round(findings.reduce((sum, f) => sum + (f.relevance_score || 0), 0) / findings.length) || 0}%
🕐 Last Updated: ${findings[0] ? new Date(findings[0].created_at).toLocaleString() : 'Never'}

${this.analyzeSentiment(findings)}

Recent Activity:
${findings.slice(0, 5).map(f => `• ${f.title} (${new Date(f.created_at).toLocaleDateString()})`).join('\n')}`;
    }
    initializeRealTimeMonitoring() {
        // Set up real-time monitoring with database triggers or polling
        setInterval(async () => {
            try {
                // Check for new findings and push to WebSocket if connected
                const newFindings = await pool.query(`SELECT * FROM intelligence_findings 
           WHERE created_at > NOW() - INTERVAL '5 minutes'
           ORDER BY created_at DESC`);
                if (wsConnection && newFindings.rows.length > 0) {
                    wsConnection.send(JSON.stringify({
                        type: 'new_findings',
                        data: newFindings.rows
                    }));
                }
            }
            catch (error) {
                console.error('Real-time monitoring error:', error);
            }
        }, 30000); // Check every 30 seconds
    }
    setupErrorHandling() {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscUJBQXFCO0FBRXJCOzs7R0FHRztBQUVILE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSwyQ0FBMkMsQ0FBQztBQUNuRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwyQ0FBMkMsQ0FBQztBQUNqRixPQUFPLEVBQ0wscUJBQXFCLEVBQ3JCLHNCQUFzQixFQUN0QiwwQkFBMEIsRUFDMUIseUJBQXlCLEdBQzFCLE1BQU0sb0NBQW9DLENBQUM7QUFDNUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLElBQUksQ0FBQztBQUcxQixzQkFBc0I7QUFDdEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUM7SUFDcEIsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksMERBQTBEO0lBQ3hHLEdBQUcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxrQkFBa0IsRUFBRSxLQUFLLEVBQUU7Q0FDN0YsQ0FBQyxDQUFDO0FBRUgsa0NBQWtDO0FBQ2xDLElBQUksWUFBWSxHQUFxQixJQUFJLENBQUM7QUFFMUMsTUFBTSwyQkFBMkI7SUFDdkIsTUFBTSxDQUFTO0lBRXZCO1FBQ0UsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FDdEI7WUFDRSxJQUFJLEVBQUUsb0JBQW9CO1lBQzFCLE9BQU8sRUFBRSxPQUFPO1NBQ2pCLEVBQ0Q7WUFDRSxZQUFZLEVBQUU7Z0JBQ1osS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsU0FBUyxFQUFFLEVBQUU7YUFDZDtTQUNGLENBQ0YsQ0FBQztRQUVGLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxxQkFBcUIsRUFB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