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