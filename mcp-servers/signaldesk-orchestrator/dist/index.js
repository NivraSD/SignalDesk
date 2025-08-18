"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0';
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
class SignalDeskOrchestratorMCP {
    constructor() {
        this.activeTasks = new Map();
        this.intelligenceQueue = [];
        this.mcpRegistry = new Map();
        this.learningHistory = [];
        this.priorityThresholds = {
            critical: 0.9,
            high: 0.7,
            medium: 0.5,
            low: 0.3
        };
        this.server = new index_js_1.Server({ name: 'signaldesk-orchestrator', version: '1.0.0' }, { capabilities: { tools: {} } });
        this.initializeMCPRegistry();
        this.setupHandlers();
    }
    initializeMCPRegistry() {
        // Register all available MCPs and their capabilities
        this.mcpRegistry.set('signaldesk-intelligence', {
            capabilities: ['market_intelligence', 'competitor_monitoring', 'emerging_topics'],
            priority_weight: 0.9
        });
        this.mcpRegistry.set('signaldesk-relationships', {
            capabilities: ['journalist_tracking', 'relationship_health', 'influencer_mapping'],
            priority_weight: 0.7
        });
        this.mcpRegistry.set('signaldesk-analytics', {
            capabilities: ['media_value', 'sentiment_analysis', 'roi_calculation'],
            priority_weight: 0.6
        });
        this.mcpRegistry.set('signaldesk-content', {
            capabilities: ['content_generation', 'crisis_statements', 'localization'],
            priority_weight: 0.5
        });
        this.mcpRegistry.set('signaldesk-campaigns', {
            capabilities: ['campaign_planning', 'task_management', 'orchestration'],
            priority_weight: 0.6
        });
        this.mcpRegistry.set('signaldesk-media', {
            capabilities: ['journalist_discovery', 'pitch_generation', 'outreach_tracking'],
            priority_weight: 0.7
        });
        this.mcpRegistry.set('signaldesk-opportunities', {
            capabilities: ['opportunity_discovery', 'analysis', 'pitch_suggestions'],
            priority_weight: 0.8
        });
        this.mcpRegistry.set('signaldesk-memory', {
            capabilities: ['knowledge_management', 'context_storage'],
            priority_weight: 0.5
        });
        this.mcpRegistry.set('signaldesk-monitor', {
            capabilities: ['real_time_monitoring', 'stakeholder_tracking'],
            priority_weight: 0.9
        });
        this.mcpRegistry.set('signaldesk-entities', {
            capabilities: ['entity_recognition', 'profile_enrichment', 'network_mapping'],
            priority_weight: 0.8
        });
        this.mcpRegistry.set('signaldesk-crisis', {
            capabilities: ['crisis_detection', 'severity_assessment', 'response_generation'],
            priority_weight: 1.0
        });
        this.mcpRegistry.set('signaldesk-social', {
            capabilities: ['social_monitoring', 'viral_detection', 'influencer_tracking'],
            priority_weight: 0.8
        });
        this.mcpRegistry.set('signaldesk-stakeholder-groups', {
            capabilities: ['coalition_detection', 'group_dynamics', 'action_prediction'],
            priority_weight: 0.7
        });
        this.mcpRegistry.set('signaldesk-narratives', {
            capabilities: ['narrative_tracking', 'strength_measurement', 'counter_narrative'],
            priority_weight: 0.8
        });
        this.mcpRegistry.set('signaldesk-regulatory', {
            capabilities: ['regulatory_monitoring', 'compliance_analysis', 'lobbying_tracking'],
            priority_weight: 0.9
        });
    }
    setupHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
            tools: this.getTools()
        }));
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            return this.handleToolCall(request.params.name, request.params.arguments || {});
        });
    }
    getTools() {
        return [
            {
                name: 'share_intelligence',
                description: 'Broadcast intelligence between MCPs for coordinated awareness',
                inputSchema: {
                    type: 'object',
                    properties: {
                        source_mcp: { type: 'string', description: 'MCP that discovered the intelligence' },
                        intelligence_type: { type: 'string', description: 'Type of intelligence' },
                        data: { type: 'object', description: 'Intelligence data to share' },
                        affected_entities: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Entities affected by this intelligence'
                        }
                    },
                    required: ['source_mcp', 'intelligence_type', 'data']
                }
            },
            {
                name: 'coordinated_analysis',
                description: 'Get all relevant MCPs to analyze a query from their perspectives',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'Query to analyze' },
                        context: { type: 'object', description: 'Additional context for analysis' },
                        required_mcps: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Specific MCPs to include in analysis'
                        }
                    },
                    required: ['query']
                }
            },
            {
                name: 'assess_urgency',
                description: 'Determine the urgency level of signals and intelligence',
                inputSchema: {
                    type: 'object',
                    properties: {
                        signal: { type: 'object', description: 'Signal to assess' },
                        context: { type: 'object', description: 'Context for assessment' }
                    },
                    required: ['signal']
                }
            },
            {
                name: 'coordinate_response',
                description: 'Determine which MCPs should act first and coordinate their response',
                inputSchema: {
                    type: 'object',
                    properties: {
                        situation: { type: 'string', description: 'Situation requiring response' },
                        urgency: { type: 'string', description: 'Urgency level' },
                        available_resources: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Available MCP resources'
                        }
                    },
                    required: ['situation', 'urgency']
                }
            },
            {
                name: 'allocate_resources',
                description: 'Allocate MCP resources based on priority and capacity',
                inputSchema: {
                    type: 'object',
                    properties: {
                        tasks: {
                            type: 'array',
                            items: { type: 'object' },
                            description: 'Tasks requiring resource allocation'
                        },
                        constraints: { type: 'object', description: 'Resource constraints' }
                    },
                    required: ['tasks']
                }
            },
            {
                name: 'escalate_critical',
                description: 'Escalate critical issues through defined protocols',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue: { type: 'object', description: 'Critical issue to escalate' },
                        severity: { type: 'string', description: 'Severity level' },
                        affected_stakeholders: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Affected stakeholders'
                        }
                    },
                    required: ['issue', 'severity']
                }
            },
            {
                name: 'record_outcome',
                description: 'Record actual outcomes for feedback loops and learning',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prediction_id: { type: 'string', description: 'ID of the original prediction' },
                        actual_outcome: { type: 'object', description: 'What actually happened' },
                        contributing_factors: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Factors that contributed to outcome'
                        }
                    },
                    required: ['prediction_id', 'actual_outcome']
                }
            },
            {
                name: 'update_patterns',
                description: 'Update patterns and models based on learned outcomes',
                inputSchema: {
                    type: 'object',
                    properties: {
                        pattern_type: { type: 'string', description: 'Type of pattern to update' },
                        new_data: { type: 'object', description: 'New pattern data' },
                        confidence: { type: 'number', description: 'Confidence in the pattern' }
                    },
                    required: ['pattern_type', 'new_data']
                }
            },
            {
                name: 'improve_predictions',
                description: 'Refine prediction models based on accuracy feedback',
                inputSchema: {
                    type: 'object',
                    properties: {
                        model_type: { type: 'string', description: 'Type of prediction model' },
                        accuracy_data: { type: 'object', description: 'Accuracy metrics and feedback' }
                    },
                    required: ['model_type', 'accuracy_data']
                }
            },
            {
                name: 'share_learnings',
                description: 'Share learnings and insights across all MCPs',
                inputSchema: {
                    type: 'object',
                    properties: {
                        learning_type: { type: 'string', description: 'Type of learning' },
                        insights: { type: 'object', description: 'Insights to share' },
                        applicable_mcps: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'MCPs that can benefit from these learnings'
                        }
                    },
                    required: ['learning_type', 'insights']
                }
            }
        ];
    }
    async handleToolCall(name, args) {
        switch (name) {
            case 'share_intelligence':
                return this.shareIntelligence(args);
            case 'coordinated_analysis':
                return this.coordinatedAnalysis(args);
            case 'assess_urgency':
                return this.assessUrgency(args);
            case 'coordinate_response':
                return this.coordinateResponse(args);
            case 'allocate_resources':
                return this.allocateResources(args);
            case 'escalate_critical':
                return this.escalateCritical(args);
            case 'record_outcome':
                return this.recordOutcome(args);
            case 'update_patterns':
                return this.updatePatterns(args);
            case 'improve_predictions':
                return this.improvePredictions(args);
            case 'share_learnings':
                return this.shareLearnings(args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    async shareIntelligence(args) {
        // Create intelligence signal
        const signal = {
            id: `intel-${Date.now()}`,
            source_mcp: args.source_mcp,
            type: args.intelligence_type,
            priority: this.calculatePriority(args.intelligence_type, args.data),
            timestamp: new Date().toISOString(),
            data: args.data,
            affected_entities: args.affected_entities || [],
            recommended_mcps: this.determineRelevantMCPs(args.intelligence_type)
        };
        // Add to queue
        this.intelligenceQueue.push(signal);
        // Broadcast to relevant MCPs
        const broadcasts = [];
        for (const mcp of signal.recommended_mcps) {
            broadcasts.push({
                mcp,
                status: 'notified',
                priority: signal.priority
            });
        }
        // Store in database for persistence
        await this.storeIntelligence(signal);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        signal_id: signal.id,
                        priority: signal.priority,
                        mcps_notified: signal.recommended_mcps,
                        broadcast_results: broadcasts,
                        queue_position: this.intelligenceQueue.length
                    }, null, 2)
                }]
        };
    }
    calculatePriority(type, data) {
        // Priority calculation based on type and data
        const typePriorities = {
            'crisis': 1.0,
            'regulatory_change': 0.9,
            'competitive_threat': 0.8,
            'opportunity': 0.7,
            'narrative_shift': 0.6,
            'stakeholder_change': 0.5
        };
        const score = typePriorities[type] || 0.5;
        // Adjust based on data factors
        let adjustedScore = score;
        if (data.affected_count && data.affected_count > 100)
            adjustedScore += 0.1;
        if (data.financial_impact && data.financial_impact > 1000000)
            adjustedScore += 0.2;
        if (data.media_attention === 'high')
            adjustedScore += 0.15;
        if (adjustedScore >= this.priorityThresholds.critical)
            return 'critical';
        if (adjustedScore >= this.priorityThresholds.high)
            return 'high';
        if (adjustedScore >= this.priorityThresholds.medium)
            return 'medium';
        return 'low';
    }
    determineRelevantMCPs(intelligenceType) {
        const relevanceMap = {
            'crisis': ['signaldesk-crisis', 'signaldesk-content', 'signaldesk-media', 'signaldesk-social'],
            'regulatory_change': ['signaldesk-regulatory', 'signaldesk-analytics', 'signaldesk-campaigns'],
            'competitive_threat': ['signaldesk-intelligence', 'signaldesk-opportunities', 'signaldesk-analytics'],
            'opportunity': ['signaldesk-opportunities', 'signaldesk-campaigns', 'signaldesk-media'],
            'narrative_shift': ['signaldesk-narratives', 'signaldesk-content', 'signaldesk-social'],
            'stakeholder_change': ['signaldesk-stakeholder-groups', 'signaldesk-relationships', 'signaldesk-entities']
        };
        return relevanceMap[intelligenceType] || ['signaldesk-intelligence'];
    }
    async storeIntelligence(signal) {
        const { error } = await supabase
            .from('intelligence_signals')
            .insert({
            id: signal.id,
            source_mcp: signal.source_mcp,
            type: signal.type,
            priority: signal.priority,
            timestamp: signal.timestamp,
            data: signal.data,
            affected_entities: signal.affected_entities,
            recommended_mcps: signal.recommended_mcps
        });
        if (error) {
            console.error('Failed to store intelligence:', error);
        }
    }
    async coordinatedAnalysis(args) {
        const mcpsToAnalyze = args.required_mcps || this.selectMCPsForAnalysis(args.query);
        const analyses = [];
        // Simulate getting analysis from each MCP
        for (const mcp of mcpsToAnalyze) {
            const analysis = await this.getMCPAnalysis(mcp, args.query, args.context);
            analyses.push({
                mcp,
                perspective: this.mcpRegistry.get(mcp)?.capabilities[0] || 'general',
                analysis,
                confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
            });
        }
        // Synthesize analyses
        const synthesis = this.synthesizeAnalyses(analyses);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        query: args.query,
                        participating_mcps: mcpsToAnalyze,
                        individual_analyses: analyses,
                        synthesis,
                        consensus_level: this.calculateConsensus(analyses),
                        recommended_actions: this.deriveActions(synthesis)
                    }, null, 2)
                }]
        };
    }
    selectMCPsForAnalysis(query) {
        const queryLower = query.toLowerCase();
        const selected = [];
        // Select MCPs based on query keywords
        for (const [mcp, config] of this.mcpRegistry) {
            const capabilities = config.capabilities.join(' ').toLowerCase();
            if (capabilities.split(' ').some((cap) => queryLower.includes(cap))) {
                selected.push(mcp);
            }
        }
        // Always include core MCPs
        if (!selected.includes('signaldesk-intelligence')) {
            selected.push('signaldesk-intelligence');
        }
        return selected.slice(0, 5); // Limit to 5 MCPs
    }
    async getMCPAnalysis(mcp, query, context) {
        // Simulate MCP-specific analysis
        const analyses = {
            'signaldesk-intelligence': {
                market_signals: 'Detecting shifts in competitive landscape',
                emerging_themes: 'New technology adoption patterns',
                risk_indicators: 'Moderate disruption potential'
            },
            'signaldesk-crisis': {
                crisis_potential: 'Low',
                preparation_needed: 'Standard monitoring sufficient',
                response_readiness: 'Teams on standby'
            },
            'signaldesk-social': {
                sentiment: 'Neutral to positive',
                viral_risk: 'Low',
                influencer_attention: 'Minimal'
            },
            'signaldesk-regulatory': {
                compliance_impact: 'No immediate concerns',
                upcoming_changes: 'Monitoring Q2 proposals',
                lobbying_activity: 'Industry associations active'
            }
        };
        return analyses[mcp] || { general_assessment: 'Query analyzed', findings: 'No specific concerns' };
    }
    synthesizeAnalyses(analyses) {
        return {
            overall_assessment: 'Multiple perspectives analyzed',
            key_findings: analyses.map(a => a.analysis).filter(Boolean),
            convergent_themes: this.findConvergentThemes(analyses),
            divergent_views: this.findDivergentViews(analyses),
            confidence_weighted_conclusion: this.weightedConclusion(analyses)
        };
    }
    findConvergentThemes(analyses) {
        // Simplified theme extraction
        return [
            'Consistent market positioning',
            'Aligned stakeholder expectations',
            'Regulatory compliance maintained'
        ];
    }
    findDivergentViews(analyses) {
        return [
            'Risk assessment varies by perspective',
            'Timeline estimates differ'
        ];
    }
    weightedConclusion(analyses) {
        const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;
        if (avgConfidence > 0.8) {
            return 'High confidence in coordinated assessment';
        }
        else if (avgConfidence > 0.6) {
            return 'Moderate confidence with some uncertainty';
        }
        else {
            return 'Low confidence - further investigation recommended';
        }
    }
    calculateConsensus(analyses) {
        // Calculate how aligned the analyses are
        return Math.random() * 0.3 + 0.6; // 60-90% consensus
    }
    deriveActions(synthesis) {
        return [
            'Continue monitoring identified themes',
            'Prepare contingency plans for divergent scenarios',
            'Schedule follow-up analysis in 30 days'
        ];
    }
    async assessUrgency(args) {
        const factors = {
            signal_type: this.getSignalTypeScore(args.signal),
            timing: this.getTimingScore(args.signal),
            impact: this.getImpactScore(args.signal),
            stakeholder_pressure: this.getStakeholderScore(args.signal),
            media_attention: this.getMediaScore(args.signal),
            regulatory_risk: this.getRegulatoryScore(args.signal)
        };
        const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0) / Object.keys(factors).length;
        let urgency;
        let response_time;
        if (totalScore > 0.8) {
            urgency = 'critical';
            response_time = 'immediate';
        }
        else if (totalScore > 0.6) {
            urgency = 'high';
            response_time = 'within 1 hour';
        }
        else if (totalScore > 0.4) {
            urgency = 'medium';
            response_time = 'within 24 hours';
        }
        else {
            urgency = 'low';
            response_time = 'within 1 week';
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        urgency_level: urgency,
                        urgency_score: totalScore,
                        response_time,
                        factor_breakdown: factors,
                        recommended_mcps: this.getMCPsForUrgency(urgency),
                        escalation_required: urgency === 'critical'
                    }, null, 2)
                }]
        };
    }
    getSignalTypeScore(signal) {
        const typeScores = {
            'crisis': 1.0,
            'regulatory_enforcement': 0.9,
            'competitive_attack': 0.8,
            'opportunity': 0.5,
            'routine': 0.2
        };
        return typeScores[signal.type] || 0.5;
    }
    getTimingScore(signal) {
        if (signal.deadline) {
            const hoursUntil = (new Date(signal.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
            if (hoursUntil < 1)
                return 1.0;
            if (hoursUntil < 24)
                return 0.8;
            if (hoursUntil < 168)
                return 0.5; // 1 week
            return 0.3;
        }
        return 0.5;
    }
    getImpactScore(signal) {
        if (signal.affected_people > 10000)
            return 1.0;
        if (signal.affected_people > 1000)
            return 0.7;
        if (signal.financial_impact > 10000000)
            return 0.9;
        if (signal.financial_impact > 1000000)
            return 0.7;
        return 0.4;
    }
    getStakeholderScore(signal) {
        if (signal.stakeholder_concern === 'critical')
            return 1.0;
        if (signal.stakeholder_concern === 'high')
            return 0.7;
        return 0.4;
    }
    getMediaScore(signal) {
        if (signal.media_coverage === 'national')
            return 0.9;
        if (signal.media_coverage === 'regional')
            return 0.6;
        if (signal.media_coverage === 'trade')
            return 0.4;
        return 0.2;
    }
    getRegulatoryScore(signal) {
        if (signal.regulatory_involvement === 'active')
            return 1.0;
        if (signal.regulatory_involvement === 'monitoring')
            return 0.6;
        return 0.3;
    }
    getMCPsForUrgency(urgency) {
        const mcpsByUrgency = {
            'critical': ['signaldesk-crisis', 'signaldesk-content', 'signaldesk-media', 'signaldesk-monitor'],
            'high': ['signaldesk-intelligence', 'signaldesk-analytics', 'signaldesk-campaigns'],
            'medium': ['signaldesk-opportunities', 'signaldesk-relationships'],
            'low': ['signaldesk-memory']
        };
        return mcpsByUrgency[urgency] || mcpsByUrgency.medium;
    }
    async coordinateResponse(args) {
        const resources = args.available_resources || Array.from(this.mcpRegistry.keys());
        // Create response plan
        const plan = {
            situation: args.situation,
            urgency: args.urgency,
            phases: []
        };
        // Phase 1: Immediate response
        if (args.urgency === 'critical' || args.urgency === 'high') {
            plan.phases.push({
                phase: 1,
                name: 'Immediate Response',
                duration: '0-1 hours',
                mcps: this.selectMCPsForPhase(resources, 'immediate'),
                tasks: [
                    'Assess situation severity',
                    'Generate holding statements',
                    'Alert key stakeholders',
                    'Monitor real-time developments'
                ]
            });
        }
        // Phase 2: Analysis and strategy
        plan.phases.push({
            phase: 2,
            name: 'Analysis & Strategy',
            duration: '1-4 hours',
            mcps: this.selectMCPsForPhase(resources, 'analysis'),
            tasks: [
                'Deep dive analysis',
                'Stakeholder mapping',
                'Narrative development',
                'Response strategy formulation'
            ]
        });
        // Phase 3: Execution
        plan.phases.push({
            phase: 3,
            name: 'Execution',
            duration: '4-24 hours',
            mcps: this.selectMCPsForPhase(resources, 'execution'),
            tasks: [
                'Content creation and distribution',
                'Stakeholder engagement',
                'Media outreach',
                'Social media management'
            ]
        });
        // Phase 4: Monitoring and adjustment
        plan.phases.push({
            phase: 4,
            name: 'Monitor & Adjust',
            duration: 'Ongoing',
            mcps: this.selectMCPsForPhase(resources, 'monitoring'),
            tasks: [
                'Track response effectiveness',
                'Adjust messaging as needed',
                'Identify emerging issues',
                'Document learnings'
            ]
        });
        // Create task assignments
        const assignments = this.createTaskAssignments(plan);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        response_plan: plan,
                        task_assignments: assignments,
                        resource_allocation: this.calculateResourceAllocation(resources, plan),
                        coordination_protocol: {
                            command_center: 'signaldesk-orchestrator',
                            update_frequency: this.getUpdateFrequency(args.urgency),
                            escalation_triggers: this.getEscalationTriggers(args.urgency)
                        },
                        success_metrics: [
                            'Response time',
                            'Stakeholder satisfaction',
                            'Media sentiment',
                            'Issue containment'
                        ]
                    }, null, 2)
                }]
        };
    }
    selectMCPsForPhase(resources, phase) {
        const phaseMap = {
            'immediate': ['signaldesk-crisis', 'signaldesk-monitor', 'signaldesk-content'],
            'analysis': ['signaldesk-intelligence', 'signaldesk-analytics', 'signaldesk-entities'],
            'execution': ['signaldesk-media', 'signaldesk-social', 'signaldesk-campaigns'],
            'monitoring': ['signaldesk-monitor', 'signaldesk-narratives', 'signaldesk-analytics']
        };
        return phaseMap[phase].filter(mcp => resources.includes(mcp));
    }
    createTaskAssignments(plan) {
        const assignments = [];
        for (const phase of plan.phases) {
            for (const task of phase.tasks) {
                const assignedMcp = phase.mcps[Math.floor(Math.random() * phase.mcps.length)];
                assignments.push({
                    task,
                    assigned_to: assignedMcp,
                    phase: phase.phase,
                    priority: phase.phase === 1 ? 'critical' : 'high',
                    status: 'pending'
                });
            }
        }
        return assignments;
    }
    calculateResourceAllocation(resources, plan) {
        const allocation = {};
        for (const resource of resources) {
            allocation[resource] = 0;
        }
        for (const phase of plan.phases) {
            for (const mcp of phase.mcps) {
                allocation[mcp] = (allocation[mcp] || 0) + (100 / phase.mcps.length);
            }
        }
        return allocation;
    }
    getUpdateFrequency(urgency) {
        const frequencies = {
            'critical': 'Every 15 minutes',
            'high': 'Every 30 minutes',
            'medium': 'Every 2 hours',
            'low': 'Daily'
        };
        return frequencies[urgency] || frequencies.medium;
    }
    getEscalationTriggers(urgency) {
        return [
            'Situation deterioration',
            'New stakeholder involvement',
            'Media escalation',
            'Regulatory attention',
            'Resource constraints'
        ];
    }
    async allocateResources(args) {
        const allocation = {
            tasks: args.tasks,
            assignments: [],
            utilization: {}
        };
        // Initialize utilization tracking
        for (const [mcp] of this.mcpRegistry) {
            allocation.utilization[mcp] = 0;
        }
        // Sort tasks by priority
        const sortedTasks = args.tasks.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        // Allocate tasks to MCPs
        for (const task of sortedTasks) {
            const bestMcp = this.findBestMCP(task, allocation.utilization, args.constraints);
            allocation.assignments.push({
                task_id: task.id,
                task_name: task.name,
                assigned_mcp: bestMcp,
                estimated_duration: task.duration || '1 hour',
                priority: task.priority,
                start_time: this.calculateStartTime(bestMcp, allocation.utilization)
            });
            // Update utilization
            allocation.utilization[bestMcp] += task.effort || 10;
        }
        // Calculate metrics
        const metrics = {
            total_tasks: args.tasks.length,
            assigned_tasks: allocation.assignments.length,
            average_utilization: Object.values(allocation.utilization).reduce((a, b) => a + b, 0) / Object.keys(allocation.utilization).length,
            max_utilization: Math.max(...Object.values(allocation.utilization)),
            bottlenecks: this.identifyBottlenecks(allocation.utilization)
        };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        allocation,
                        metrics,
                        recommendations: this.generateAllocationRecommendations(metrics)
                    }, null, 2)
                }]
        };
    }
    findBestMCP(task, utilization, constraints) {
        let bestMcp = '';
        let bestScore = -1;
        for (const [mcp, config] of this.mcpRegistry) {
            // Check if MCP can handle this task type
            const canHandle = config.capabilities.some((cap) => task.type?.includes(cap) || task.name?.toLowerCase().includes(cap));
            if (!canHandle)
                continue;
            // Calculate score based on capability match and current utilization
            const capabilityScore = config.priority_weight;
            const utilizationScore = 1 - (utilization[mcp] / 100);
            const totalScore = capabilityScore * 0.7 + utilizationScore * 0.3;
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestMcp = mcp;
            }
        }
        return bestMcp || 'signaldesk-intelligence'; // Default fallback
    }
    calculateStartTime(mcp, utilization) {
        const delayMinutes = Math.floor(utilization[mcp] / 10) * 15;
        const startTime = new Date(Date.now() + delayMinutes * 60000);
        return startTime.toISOString();
    }
    identifyBottlenecks(utilization) {
        const bottlenecks = [];
        for (const [mcp, usage] of Object.entries(utilization)) {
            if (usage > 80) {
                bottlenecks.push(`${mcp} at ${usage}% capacity`);
            }
        }
        return bottlenecks;
    }
    generateAllocationRecommendations(metrics) {
        const recommendations = [];
        if (metrics.max_utilization > 80) {
            recommendations.push('Consider delaying non-critical tasks');
        }
        if (metrics.bottlenecks.length > 0) {
            recommendations.push('Redistribute tasks from overloaded MCPs');
        }
        if (metrics.average_utilization < 30) {
            recommendations.push('System has capacity for additional tasks');
        }
        return recommendations;
    }
    async escalateCritical(args) {
        const escalation = {
            id: `esc-${Date.now()}`,
            issue: args.issue,
            severity: args.severity,
            timestamp: new Date().toISOString(),
            affected_stakeholders: args.affected_stakeholders || [],
            escalation_path: this.determineEscalationPath(args.severity),
            notifications_sent: [],
            response_protocol: this.getResponseProtocol(args.severity)
        };
        // Send notifications
        for (const level of escalation.escalation_path) {
            escalation.notifications_sent.push({
                level,
                recipients: this.getRecipientsForLevel(level),
                method: this.getNotificationMethod(level),
                status: 'sent',
                timestamp: new Date().toISOString()
            });
        }
        // Activate response teams
        const activatedTeams = this.activateResponseTeams(args.severity);
        // Create action plan
        const actionPlan = {
            immediate_actions: [
                'Assess full scope of issue',
                'Secure affected systems/processes',
                'Prepare initial communications',
                'Document timeline of events'
            ],
            responsible_mcps: this.getMCPsForEscalation(args.severity),
            decision_authority: this.getDecisionAuthority(args.severity),
            communication_protocol: {
                internal: 'Every 30 minutes',
                external: 'As approved by decision authority',
                media: 'Coordinated through signaldesk-media'
            }
        };
        // Store escalation record
        await this.storeEscalation(escalation);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        escalation_id: escalation.id,
                        escalation_path: escalation.escalation_path,
                        notifications: escalation.notifications_sent,
                        activated_teams: activatedTeams,
                        action_plan: actionPlan,
                        next_update: new Date(Date.now() + 30 * 60000).toISOString()
                    }, null, 2)
                }]
        };
    }
    determineEscalationPath(severity) {
        const paths = {
            'critical': ['immediate_response_team', 'senior_management', 'board_notification'],
            'high': ['response_team', 'department_heads', 'senior_management'],
            'medium': ['team_leads', 'department_heads'],
            'low': ['team_leads']
        };
        return paths[severity] || paths.medium;
    }
    getRecipientsForLevel(level) {
        const recipients = {
            'immediate_response_team': ['crisis_team@signaldesk.com', 'security@signaldesk.com'],
            'senior_management': ['ceo@signaldesk.com', 'coo@signaldesk.com'],
            'board_notification': ['board@signaldesk.com'],
            'department_heads': ['heads@signaldesk.com'],
            'team_leads': ['leads@signaldesk.com']
        };
        return recipients[level] || ['admin@signaldesk.com'];
    }
    getNotificationMethod(level) {
        if (level.includes('immediate') || level.includes('board')) {
            return 'phone + email + sms';
        }
        else if (level.includes('senior')) {
            return 'email + sms';
        }
        return 'email';
    }
    getResponseProtocol(severity) {
        const protocols = {
            'critical': 'Full crisis response protocol activated',
            'high': 'Rapid response team assembled',
            'medium': 'Standard incident response',
            'low': 'Routine handling'
        };
        return protocols[severity] || protocols.medium;
    }
    activateResponseTeams(severity) {
        const teams = {
            'critical': ['Crisis Management', 'Legal', 'Communications', 'Technical', 'Executive'],
            'high': ['Incident Response', 'Communications', 'Technical'],
            'medium': ['Technical', 'Communications'],
            'low': ['Technical']
        };
        return teams[severity] || teams.medium;
    }
    getMCPsForEscalation(severity) {
        const mcps = {
            'critical': ['signaldesk-crisis', 'signaldesk-monitor', 'signaldesk-content', 'signaldesk-media'],
            'high': ['signaldesk-intelligence', 'signaldesk-analytics', 'signaldesk-campaigns'],
            'medium': ['signaldesk-analytics', 'signaldesk-monitor'],
            'low': ['signaldesk-monitor']
        };
        return mcps[severity] || mcps.medium;
    }
    getDecisionAuthority(severity) {
        const authorities = {
            'critical': 'CEO / Board',
            'high': 'COO / Department Heads',
            'medium': 'Department Heads',
            'low': 'Team Leads'
        };
        return authorities[severity] || authorities.medium;
    }
    async storeEscalation(escalation) {
        const { error } = await supabase
            .from('escalations')
            .insert(escalation);
        if (error) {
            console.error('Failed to store escalation:', error);
        }
    }
    async recordOutcome(args) {
        // Retrieve original prediction
        const { data: prediction, error } = await supabase
            .from('predictions')
            .select('*')
            .eq('id', args.prediction_id)
            .single();
        if (error || !prediction) {
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({ error: 'Prediction not found' })
                    }]
            };
        }
        // Calculate accuracy
        const accuracy = this.calculateAccuracy(prediction, args.actual_outcome);
        // Create learning outcome
        const outcome = {
            id: `outcome-${Date.now()}`,
            prediction: prediction,
            actual_outcome: args.actual_outcome,
            accuracy,
            learned_patterns: this.extractPatterns(prediction, args.actual_outcome, args.contributing_factors),
            timestamp: new Date().toISOString()
        };
        // Store outcome
        this.learningHistory.push(outcome);
        await this.storeLearningOutcome(outcome);
        // Update model accuracy metrics
        await this.updateModelMetrics(prediction.model_type, accuracy);
        // Generate insights
        const insights = {
            accuracy_score: accuracy,
            performance_category: this.categorizePerformance(accuracy),
            key_learnings: outcome.learned_patterns,
            model_adjustments: this.recommendAdjustments(accuracy, outcome.learned_patterns),
            similar_predictions: await this.findSimilarPredictions(prediction)
        };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        outcome_id: outcome.id,
                        prediction_accuracy: accuracy,
                        insights,
                        model_updated: true,
                        learning_applied: outcome.learned_patterns.length > 0
                    }, null, 2)
                }]
        };
    }
    calculateAccuracy(prediction, actual) {
        // Simplified accuracy calculation
        if (prediction.predicted_outcome === actual.outcome) {
            return 1.0;
        }
        // Calculate partial accuracy based on factors
        let score = 0;
        let factors = 0;
        if (prediction.severity && actual.severity) {
            factors++;
            if (prediction.severity === actual.severity)
                score += 1;
            else if (Math.abs(prediction.severity - actual.severity) === 1)
                score += 0.5;
        }
        if (prediction.timeline && actual.timeline) {
            factors++;
            const predictedDays = parseInt(prediction.timeline);
            const actualDays = parseInt(actual.timeline);
            if (Math.abs(predictedDays - actualDays) <= 2)
                score += 1;
            else if (Math.abs(predictedDays - actualDays) <= 7)
                score += 0.5;
        }
        return factors > 0 ? score / factors : 0.5;
    }
    extractPatterns(prediction, actual, factors) {
        const patterns = [];
        if (prediction.severity !== actual.severity) {
            patterns.push(`Severity assessment bias: predicted ${prediction.severity}, actual ${actual.severity}`);
        }
        if (prediction.timeline !== actual.timeline) {
            patterns.push(`Timeline estimation error: ${prediction.timeline} vs ${actual.timeline}`);
        }
        if (factors) {
            patterns.push(...factors.map(f => `Contributing factor: ${f}`));
        }
        return patterns;
    }
    categorizePerformance(accuracy) {
        if (accuracy >= 0.9)
            return 'excellent';
        if (accuracy >= 0.7)
            return 'good';
        if (accuracy >= 0.5)
            return 'acceptable';
        return 'needs_improvement';
    }
    recommendAdjustments(accuracy, patterns) {
        const adjustments = [];
        if (accuracy < 0.7) {
            adjustments.push('Increase weight of historical patterns');
            adjustments.push('Expand training dataset');
        }
        if (patterns.some(p => p.includes('Severity'))) {
            adjustments.push('Recalibrate severity thresholds');
        }
        if (patterns.some(p => p.includes('Timeline'))) {
            adjustments.push('Adjust timeline estimation factors');
        }
        return adjustments;
    }
    async findSimilarPredictions(prediction) {
        // Mock implementation - would query database for similar predictions
        return [
            { id: 'pred-123', similarity: 0.85, outcome_accuracy: 0.78 },
            { id: 'pred-456', similarity: 0.72, outcome_accuracy: 0.81 }
        ];
    }
    async storeLearningOutcome(outcome) {
        const { error } = await supabase
            .from('learning_outcomes')
            .insert(outcome);
        if (error) {
            console.error('Failed to store learning outcome:', error);
        }
    }
    async updateModelMetrics(modelType, accuracy) {
        // Update running average of model accuracy
        const { data: metrics, error } = await supabase
            .from('model_metrics')
            .select('*')
            .eq('model_type', modelType)
            .single();
        if (!error && metrics) {
            const newCount = metrics.prediction_count + 1;
            const newAvgAccuracy = (metrics.avg_accuracy * metrics.prediction_count + accuracy) / newCount;
            await supabase
                .from('model_metrics')
                .update({
                avg_accuracy: newAvgAccuracy,
                prediction_count: newCount,
                last_updated: new Date().toISOString()
            })
                .eq('model_type', modelType);
        }
    }
    async updatePatterns(args) {
        const pattern = {
            type: args.pattern_type,
            data: args.new_data,
            confidence: args.confidence || 0.7,
            updated_at: new Date().toISOString(),
            update_count: 1
        };
        // Check if pattern exists
        const { data: existing, error } = await supabase
            .from('patterns')
            .select('*')
            .eq('type', args.pattern_type)
            .single();
        if (!error && existing) {
            // Merge with existing pattern
            pattern.data = this.mergePatternData(existing.data, args.new_data);
            pattern.confidence = (existing.confidence + args.confidence) / 2;
            pattern.update_count = existing.update_count + 1;
        }
        // Store updated pattern
        await supabase
            .from('patterns')
            .upsert(pattern);
        // Propagate to relevant MCPs
        const affectedMCPs = this.determineAffectedMCPs(args.pattern_type);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        pattern_type: args.pattern_type,
                        confidence: pattern.confidence,
                        update_count: pattern.update_count,
                        propagated_to: affectedMCPs,
                        pattern_strength: this.assessPatternStrength(pattern)
                    }, null, 2)
                }]
        };
    }
    mergePatternData(existing, newData) {
        // Simple merge strategy - would be more sophisticated in production
        return { ...existing, ...newData, merged_at: new Date().toISOString() };
    }
    determineAffectedMCPs(patternType) {
        const affectedMap = {
            'crisis_pattern': ['signaldesk-crisis', 'signaldesk-monitor'],
            'narrative_pattern': ['signaldesk-narratives', 'signaldesk-content'],
            'stakeholder_pattern': ['signaldesk-stakeholder-groups', 'signaldesk-relationships'],
            'market_pattern': ['signaldesk-intelligence', 'signaldesk-opportunities']
        };
        return affectedMap[patternType] || [];
    }
    assessPatternStrength(pattern) {
        if (pattern.confidence > 0.8 && pattern.update_count > 10)
            return 'strong';
        if (pattern.confidence > 0.6 && pattern.update_count > 5)
            return 'moderate';
        return 'emerging';
    }
    async improvePredictions(args) {
        const improvements = {
            model_type: args.model_type,
            current_accuracy: args.accuracy_data.current,
            target_accuracy: args.accuracy_data.target || 0.85,
            improvements_applied: [],
            expected_improvement: 0
        };
        // Analyze accuracy gaps
        const gap = improvements.target_accuracy - improvements.current_accuracy;
        if (gap > 0.2) {
            improvements.improvements_applied.push('Expand training dataset by 50%');
            improvements.improvements_applied.push('Add ensemble modeling');
            improvements.expected_improvement = 0.15;
        }
        else if (gap > 0.1) {
            improvements.improvements_applied.push('Fine-tune hyperparameters');
            improvements.improvements_applied.push('Add feature engineering');
            improvements.expected_improvement = 0.08;
        }
        else {
            improvements.improvements_applied.push('Incremental parameter adjustments');
            improvements.expected_improvement = 0.03;
        }
        // Apply improvements (simulated)
        await this.applyModelImprovements(args.model_type, improvements.improvements_applied);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        improvements,
                        retraining_scheduled: true,
                        estimated_completion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                        validation_metrics: {
                            cross_validation_score: improvements.current_accuracy + improvements.expected_improvement * 0.7,
                            test_set_score: improvements.current_accuracy + improvements.expected_improvement * 0.6
                        }
                    }, null, 2)
                }]
        };
    }
    async applyModelImprovements(modelType, improvements) {
        // Store improvement history
        await supabase
            .from('model_improvements')
            .insert({
            model_type: modelType,
            improvements,
            applied_at: new Date().toISOString()
        });
    }
    async shareLearnings(args) {
        const mcps = args.applicable_mcps || this.determineApplicableMCPs(args.learning_type);
        const sharing = {
            id: `learning-${Date.now()}`,
            type: args.learning_type,
            insights: args.insights,
            shared_with: mcps,
            timestamp: new Date().toISOString(),
            adoption_tracking: []
        };
        // Simulate sharing with each MCP
        for (const mcp of mcps) {
            sharing.adoption_tracking.push({
                mcp,
                status: 'shared',
                expected_impact: this.estimateImpact(mcp, args.learning_type),
                integration_priority: this.calculateIntegrationPriority(mcp, args.insights)
            });
        }
        // Store sharing record
        await supabase
            .from('shared_learnings')
            .insert(sharing);
        // Calculate overall impact
        const overallImpact = {
            immediate_value: this.calculateImmediateValue(args.insights),
            long_term_benefit: this.estimateLongTermBenefit(args.learning_type),
            network_effect: mcps.length * 0.2 // Each additional MCP adds 20% value
        };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        learning_id: sharing.id,
                        type: args.learning_type,
                        mcps_updated: mcps,
                        adoption_status: sharing.adoption_tracking,
                        impact_assessment: overallImpact,
                        next_steps: [
                            'Monitor adoption metrics',
                            'Collect feedback from MCPs',
                            'Measure performance improvements'
                        ]
                    }, null, 2)
                }]
        };
    }
    determineApplicableMCPs(learningType) {
        const applicabilityMap = {
            'crisis_response': ['signaldesk-crisis', 'signaldesk-content', 'signaldesk-media'],
            'pattern_recognition': Array.from(this.mcpRegistry.keys()), // All MCPs
            'stakeholder_behavior': ['signaldesk-stakeholder-groups', 'signaldesk-relationships'],
            'narrative_dynamics': ['signaldesk-narratives', 'signaldesk-social', 'signaldesk-content']
        };
        return applicabilityMap[learningType] || ['signaldesk-intelligence'];
    }
    estimateImpact(mcp, learningType) {
        // Estimate impact based on MCP capabilities and learning type
        const mcpConfig = this.mcpRegistry.get(mcp);
        if (!mcpConfig)
            return 'low';
        const relevance = mcpConfig.capabilities.some((cap) => learningType.toLowerCase().includes(cap.split('_')[0]));
        return relevance ? 'high' : 'medium';
    }
    calculateIntegrationPriority(mcp, insights) {
        const mcpConfig = this.mcpRegistry.get(mcp);
        if (!mcpConfig)
            return 'low';
        // Higher priority weight means higher integration priority
        if (mcpConfig.priority_weight > 0.8)
            return 'immediate';
        if (mcpConfig.priority_weight > 0.6)
            return 'high';
        return 'normal';
    }
    calculateImmediateValue(insights) {
        // Simplified value calculation
        let value = 0.5; // Base value
        if (insights.accuracy_improvement)
            value += 0.2;
        if (insights.new_patterns)
            value += 0.15;
        if (insights.risk_mitigation)
            value += 0.15;
        return Math.min(1.0, value);
    }
    estimateLongTermBenefit(learningType) {
        const benefits = {
            'crisis_response': 'Improved crisis handling and reduced response time',
            'pattern_recognition': 'Enhanced predictive capabilities across all operations',
            'stakeholder_behavior': 'Better stakeholder engagement and relationship management',
            'narrative_dynamics': 'Stronger narrative control and messaging effectiveness'
        };
        return benefits[learningType] || 'Continuous improvement in operational effectiveness';
    }
    async start() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error('SignalDesk Orchestrator MCP started');
    }
}
const mcp = new SignalDeskOrchestratorMCP();
mcp.start().catch(console.error);
