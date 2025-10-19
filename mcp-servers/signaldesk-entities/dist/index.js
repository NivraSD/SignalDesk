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
class SignalDeskEntitiesMCP {
    constructor() {
        this.organizationCache = new Map();
        this.industryTaxonomy = new Map();
        this.server = new index_js_1.Server({ name: 'signaldesk-entities', version: '1.0.0' }, { capabilities: { tools: {} } });
        this.initializeTaxonomy();
        this.setupHandlers();
    }
    initializeTaxonomy() {
        this.industryTaxonomy.set('technology', {
            subcategories: ['enterprise_software', 'consumer_software', 'infrastructure', 'ai_ml', 'data_analytics'],
            keywords: ['tech', 'software', 'digital', 'cloud', 'platform', 'app', 'saas', 'ai', 'machine learning']
        });
        this.industryTaxonomy.set('financial_services', {
            subcategories: ['banking', 'insurance', 'investment_management', 'fintech', 'payments'],
            keywords: ['bank', 'financial', 'investment', 'insurance', 'capital', 'fund', 'payment', 'fintech']
        });
        this.industryTaxonomy.set('healthcare', {
            subcategories: ['pharma', 'biotech', 'medical_devices', 'health_insurance', 'hospitals'],
            keywords: ['health', 'medical', 'pharma', 'bio', 'clinical', 'therapeutic', 'hospital', 'care']
        });
        this.industryTaxonomy.set('energy', {
            subcategories: ['oil_gas', 'renewable', 'utilities', 'nuclear', 'coal'],
            keywords: ['energy', 'oil', 'gas', 'solar', 'wind', 'renewable', 'power', 'electric', 'utility']
        });
        this.industryTaxonomy.set('retail', {
            subcategories: ['ecommerce', 'brick_mortar', 'luxury', 'discount', 'specialty'],
            keywords: ['retail', 'store', 'shop', 'commerce', 'consumer', 'brand', 'fashion', 'market']
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
                name: 'recognize_entities',
                description: 'Extract and identify entities from any text',
                inputSchema: {
                    type: 'object',
                    properties: {
                        text: { type: 'string', description: 'Text to extract entities from' },
                        entity_types: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Types of entities to extract (organizations, people, locations, etc.)'
                        }
                    },
                    required: ['text']
                }
            },
            {
                name: 'enrich_entity_profile',
                description: 'Get or create a comprehensive profile for an organization',
                inputSchema: {
                    type: 'object',
                    properties: {
                        organization_name: { type: 'string', description: 'Name of the organization' },
                        deep_enrich: { type: 'boolean', description: 'Perform deep enrichment from multiple sources' }
                    },
                    required: ['organization_name']
                }
            },
            {
                name: 'track_entity_evolution',
                description: 'Monitor how an entity has changed over time',
                inputSchema: {
                    type: 'object',
                    properties: {
                        entity_id: { type: 'string', description: 'Entity identifier' },
                        timeframe: { type: 'string', description: 'Time period to analyze (e.g., "30d", "6m", "1y")' }
                    },
                    required: ['entity_id']
                }
            },
            {
                name: 'find_entity_connections',
                description: 'Discover relationships between entities',
                inputSchema: {
                    type: 'object',
                    properties: {
                        entity_id: { type: 'string', description: 'Primary entity identifier' },
                        connection_types: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Types of connections to find (competitors, partners, investors, etc.)'
                        },
                        depth: { type: 'number', description: 'How many degrees of separation to explore' }
                    },
                    required: ['entity_id']
                }
            },
            {
                name: 'match_entities_to_org',
                description: 'Auto-match relevant entities to an organization',
                inputSchema: {
                    type: 'object',
                    properties: {
                        organization_id: { type: 'string', description: 'Organization identifier' },
                        entity_list: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'List of entities to match'
                        }
                    },
                    required: ['organization_id', 'entity_list']
                }
            },
            {
                name: 'update_entity_intelligence',
                description: 'Update entity profiles with new intelligence',
                inputSchema: {
                    type: 'object',
                    properties: {
                        entity_id: { type: 'string', description: 'Entity identifier' },
                        intelligence_type: { type: 'string', description: 'Type of intelligence update' },
                        data: { type: 'object', description: 'Intelligence data to add' }
                    },
                    required: ['entity_id', 'intelligence_type', 'data']
                }
            },
            {
                name: 'predict_entity_behavior',
                description: 'Predict entity reactions and behaviors based on history',
                inputSchema: {
                    type: 'object',
                    properties: {
                        entity_id: { type: 'string', description: 'Entity identifier' },
                        scenario: { type: 'string', description: 'Scenario to predict reaction to' }
                    },
                    required: ['entity_id', 'scenario']
                }
            },
            {
                name: 'classify_industry',
                description: 'Classify an organization into industry categories',
                inputSchema: {
                    type: 'object',
                    properties: {
                        organization_name: { type: 'string', description: 'Name of the organization' },
                        context: { type: 'string', description: 'Additional context about the organization' }
                    },
                    required: ['organization_name']
                }
            },
            {
                name: 'map_organization_network',
                description: 'Map the complete network of relationships for an organization',
                inputSchema: {
                    type: 'object',
                    properties: {
                        organization_id: { type: 'string', description: 'Organization identifier' },
                        depth: { type: 'number', description: 'Network depth to explore' }
                    },
                    required: ['organization_id']
                }
            },
            {
                name: 'calculate_influence_score',
                description: 'Calculate the influence score of an organization',
                inputSchema: {
                    type: 'object',
                    properties: {
                        organization_id: { type: 'string', description: 'Organization identifier' }
                    },
                    required: ['organization_id']
                }
            }
        ];
    }
    async handleToolCall(name, args) {
        switch (name) {
            case 'recognize_entities':
                return this.recognizeEntities(args.text, args.entity_types);
            case 'enrich_entity_profile':
                return this.enrichEntityProfile(args.organization_name, args.deep_enrich);
            case 'track_entity_evolution':
                return this.trackEntityEvolution(args.entity_id, args.timeframe);
            case 'find_entity_connections':
                return this.findEntityConnections(args.entity_id, args.connection_types, args.depth);
            case 'match_entities_to_org':
                return this.matchEntitiesToOrg(args.organization_id, args.entity_list);
            case 'update_entity_intelligence':
                return this.updateEntityIntelligence(args.entity_id, args.intelligence_type, args.data);
            case 'predict_entity_behavior':
                return this.predictEntityBehavior(args.entity_id, args.scenario);
            case 'classify_industry':
                return this.classifyIndustry(args.organization_name, args.context);
            case 'map_organization_network':
                return this.mapOrganizationNetwork(args.organization_id, args.depth);
            case 'calculate_influence_score':
                return this.calculateInfluenceScore(args.organization_id);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    async recognizeEntities(text, entityTypes) {
        const entities = {
            organizations: [],
            people: [],
            locations: [],
            products: [],
            events: []
        };
        // Pattern matching for organizations
        const orgPatterns = [
            /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Inc|Corp|LLC|Ltd|Company|Co|Group|Partners|LP|LLP)\b/g,
            /\b[A-Z]{2,}\b/g // Acronyms
        ];
        for (const pattern of orgPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                entities.organizations.push(...matches);
            }
        }
        // Pattern matching for people
        const personPattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g;
        const personMatches = text.match(personPattern);
        if (personMatches) {
            entities.people.push(...personMatches.filter(m => !entities.organizations.includes(m)));
        }
        // Remove duplicates
        for (const key in entities) {
            entities[key] = [...new Set(entities[key])];
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        entities,
                        total_found: Object.values(entities).flat().length,
                        confidence_scores: this.calculateConfidenceScores(entities)
                    }, null, 2)
                }]
        };
    }
    calculateConfidenceScores(entities) {
        const scores = {};
        for (const [type, list] of Object.entries(entities)) {
            scores[type] = list.map(entity => ({
                entity,
                confidence: Math.random() * 0.3 + 0.7 // Placeholder: 70-100% confidence
            }));
        }
        return scores;
    }
    async enrichEntityProfile(organizationName, deepEnrich = false) {
        const id = this.generateId(organizationName);
        // Check cache first
        if (this.organizationCache.has(id)) {
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(this.organizationCache.get(id), null, 2)
                    }]
            };
        }
        // Check database
        const { data: existing, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single();
        if (existing && !deepEnrich) {
            this.organizationCache.set(id, existing);
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(existing, null, 2)
                    }]
            };
        }
        // Create or enrich profile
        const profile = await this.createOrEnrichProfile(organizationName, existing);
        // Store in database
        const { error: upsertError } = await supabase
            .from('organizations')
            .upsert(profile);
        if (!upsertError) {
            this.organizationCache.set(id, profile);
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(profile, null, 2)
                }]
        };
    }
    async createOrEnrichProfile(name, existing) {
        const id = this.generateId(name);
        const industry = await this.classifyIndustryInternal(name);
        return {
            id,
            name,
            aliases: await this.findAliases(name),
            industry,
            metadata: existing?.metadata || {
                founded: '',
                headquarters: '',
                employees: '',
                revenue: '',
                public_private: 'private',
                website: '',
                social_handles: {}
            },
            stakeholders: existing?.stakeholders || {
                executives: [],
                board_members: [],
                major_investors: [],
                key_customers: [],
                main_competitors: [],
                regulators: [],
                media_outlets: [],
                activist_groups: []
            },
            monitoring_config: {
                keywords: [name, ...this.generateKeywords(name)],
                rss_feeds: [],
                api_endpoints: [],
                social_accounts: [],
                regulatory_filings: industry.primary === 'financial_services',
                executive_changes: true,
                ma_activity: true,
                crisis_indicators: this.defineCrisisIndicators(industry.primary)
            },
            intelligence: existing?.intelligence || {
                narrative_themes: [],
                recent_developments: [],
                upcoming_catalysts: [],
                risk_factors: [],
                opportunities: [],
                cascade_triggers: []
            },
            relationships: existing?.relationships || {
                subsidiaries: [],
                joint_ventures: [],
                strategic_partnerships: []
            },
            last_updated: new Date().toISOString(),
            enrichment_status: 'partial'
        };
    }
    async classifyIndustryInternal(name) {
        const keywords = name.toLowerCase().split(' ');
        for (const [industry, data] of this.industryTaxonomy) {
            for (const keyword of keywords) {
                if (data.keywords.some((k) => keyword.includes(k))) {
                    return {
                        primary: industry,
                        secondary: [],
                        subcategories: data.subcategories.slice(0, 2)
                    };
                }
            }
        }
        return {
            primary: 'technology',
            secondary: [],
            subcategories: []
        };
    }
    async classifyIndustry(organizationName, context) {
        const classification = await this.classifyIndustryInternal(organizationName);
        // If context provided, refine classification
        if (context) {
            const contextLower = context.toLowerCase();
            for (const [industry, data] of this.industryTaxonomy) {
                const matchCount = data.keywords.filter((k) => contextLower.includes(k)).length;
                if (matchCount > 2) {
                    classification.primary = industry;
                    classification.subcategories = data.subcategories;
                    break;
                }
            }
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(classification, null, 2)
                }]
        };
    }
    generateId(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
    async findAliases(name) {
        const aliases = [];
        // Add common abbreviations
        const words = name.split(' ');
        if (words.length > 1) {
            aliases.push(words.map(w => w[0]).join(''));
        }
        // Remove common suffixes
        const suffixes = ['Inc', 'Corp', 'LLC', 'Ltd', 'Company', 'Co'];
        for (const suffix of suffixes) {
            if (name.includes(suffix)) {
                aliases.push(name.replace(suffix, '').trim());
            }
        }
        return [...new Set(aliases)];
    }
    generateKeywords(name) {
        const keywords = [];
        const words = name.split(' ');
        // Add individual words
        keywords.push(...words.map(w => w.toLowerCase()));
        // Add without common words
        const commonWords = ['the', 'and', 'of', 'in', 'for'];
        const significantWords = words.filter(w => !commonWords.includes(w.toLowerCase()) && w.length > 2);
        if (significantWords.length > 1) {
            keywords.push(significantWords.join(' ').toLowerCase());
        }
        return [...new Set(keywords)];
    }
    defineCrisisIndicators(industry) {
        const baseIndicators = [
            'breach', 'lawsuit', 'scandal', 'investigation', 'recall',
            'bankruptcy', 'layoffs', 'protest', 'boycott'
        ];
        const industrySpecific = {
            technology: ['data breach', 'hack', 'privacy violation', 'antitrust'],
            financial_services: ['fraud', 'regulatory fine', 'market manipulation', 'insider trading'],
            healthcare: ['FDA warning', 'clinical trial failure', 'patient death', 'contamination'],
            energy: ['spill', 'explosion', 'environmental violation', 'safety incident'],
            retail: ['supply chain', 'product recall', 'labor dispute', 'store closures']
        };
        return [...baseIndicators, ...(industrySpecific[industry] || [])];
    }
    async trackEntityEvolution(entityId, timeframe) {
        const { data: history, error } = await supabase
            .from('entity_history')
            .select('*')
            .eq('entity_id', entityId)
            .order('timestamp', { ascending: false });
        if (error) {
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({ error: 'Failed to retrieve entity history' })
                    }]
            };
        }
        const evolution = {
            entity_id: entityId,
            timeframe,
            changes: history || [],
            trend_analysis: this.analyzeTrends(history),
            key_milestones: this.identifyMilestones(history)
        };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(evolution, null, 2)
                }]
        };
    }
    analyzeTrends(history) {
        if (!history || history.length === 0)
            return { trend: 'stable' };
        return {
            trend: 'evolving',
            direction: 'positive',
            velocity: 'moderate',
            key_changes: history.slice(0, 5).map(h => h.change_type)
        };
    }
    identifyMilestones(history) {
        if (!history || history.length === 0)
            return [];
        return history
            .filter(h => h.significance === 'high')
            .slice(0, 10)
            .map(h => ({
            date: h.timestamp,
            event: h.description,
            impact: h.impact_score
        }));
    }
    async findEntityConnections(entityId, connectionTypes, depth = 2) {
        const connections = {
            direct: [],
            indirect: [],
            network_map: {}
        };
        // Get organization data
        const { data: org, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', entityId)
            .single();
        if (error || !org) {
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({ error: 'Entity not found' })
                    }]
            };
        }
        // Extract direct connections
        connections.direct = [
            ...org.relationships.subsidiaries.map((s) => ({ entity: s, type: 'subsidiary' })),
            ...org.relationships.joint_ventures.map((j) => ({ entity: j, type: 'joint_venture' })),
            ...org.relationships.strategic_partnerships.map((p) => ({ entity: p, type: 'partnership' })),
            ...org.stakeholders.main_competitors.map((c) => ({ entity: c, type: 'competitor' }))
        ];
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(connections, null, 2)
                }]
        };
    }
    async matchEntitiesToOrg(organizationId, entityList) {
        const matches = {
            strong_matches: [],
            potential_matches: [],
            no_match: []
        };
        for (const entity of entityList) {
            const relevanceScore = await this.calculateRelevance(organizationId, entity);
            if (relevanceScore > 0.7) {
                matches.strong_matches.push({ entity, score: relevanceScore });
            }
            else if (relevanceScore > 0.3) {
                matches.potential_matches.push({ entity, score: relevanceScore });
            }
            else {
                matches.no_match.push(entity);
            }
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(matches, null, 2)
                }]
        };
    }
    async calculateRelevance(orgId, entity) {
        // Simplified relevance calculation
        const entityLower = entity.toLowerCase();
        const orgIdLower = orgId.toLowerCase();
        if (entityLower.includes(orgIdLower) || orgIdLower.includes(entityLower)) {
            return 0.9;
        }
        // Check for common words
        const orgWords = orgIdLower.split('_');
        const entityWords = entityLower.split(' ');
        const commonWords = orgWords.filter(w => entityWords.includes(w));
        return commonWords.length / Math.max(orgWords.length, entityWords.length);
    }
    async updateEntityIntelligence(entityId, intelligenceType, data) {
        const { data: org, error: fetchError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', entityId)
            .single();
        if (fetchError || !org) {
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({ error: 'Entity not found' })
                    }]
            };
        }
        // Update intelligence based on type
        switch (intelligenceType) {
            case 'narrative_theme':
                org.intelligence.narrative_themes.push(data);
                break;
            case 'development':
                org.intelligence.recent_developments.push(data);
                break;
            case 'catalyst':
                org.intelligence.upcoming_catalysts.push(data);
                break;
            case 'risk':
                org.intelligence.risk_factors.push(data);
                break;
            case 'opportunity':
                org.intelligence.opportunities.push(data);
                break;
            case 'cascade_trigger':
                org.intelligence.cascade_triggers.push(data);
                break;
        }
        org.last_updated = new Date().toISOString();
        const { error: updateError } = await supabase
            .from('organizations')
            .update(org)
            .eq('id', entityId);
        if (updateError) {
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({ error: 'Failed to update intelligence' })
                    }]
            };
        }
        this.organizationCache.set(entityId, org);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        entity_id: entityId,
                        intelligence_type: intelligenceType,
                        updated: new Date().toISOString()
                    })
                }]
        };
    }
    async predictEntityBehavior(entityId, scenario) {
        const { data: org, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', entityId)
            .single();
        if (error || !org) {
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({ error: 'Entity not found' })
                    }]
            };
        }
        // Analyze historical patterns
        const prediction = {
            entity_id: entityId,
            scenario,
            likely_reaction: this.predictReaction(org, scenario),
            probability: Math.random() * 0.3 + 0.6, // 60-90% confidence
            key_factors: this.identifyKeyFactors(org, scenario),
            recommended_approach: this.recommendApproach(org, scenario)
        };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(prediction, null, 2)
                }]
        };
    }
    predictReaction(org, scenario) {
        const scenarioLower = scenario.toLowerCase();
        if (scenarioLower.includes('crisis') || scenarioLower.includes('scandal')) {
            return 'Defensive response with rapid PR campaign';
        }
        else if (scenarioLower.includes('opportunity') || scenarioLower.includes('partnership')) {
            return 'Cautious exploration with due diligence';
        }
        else if (scenarioLower.includes('competition') || scenarioLower.includes('threat')) {
            return 'Aggressive counter-positioning';
        }
        return 'Measured response with internal assessment';
    }
    identifyKeyFactors(org, scenario) {
        return [
            'Historical response patterns',
            'Current market position',
            'Leadership style',
            'Stakeholder pressure',
            'Financial capacity'
        ];
    }
    recommendApproach(org, scenario) {
        return 'Proactive engagement with transparent communication';
    }
    async mapOrganizationNetwork(organizationId, depth = 2) {
        const network = {
            nodes: [],
            edges: [],
            clusters: []
        };
        const visited = new Set();
        const queue = [{ id: organizationId, level: 0 }];
        while (queue.length > 0 && queue[0].level < depth) {
            const current = queue.shift();
            if (visited.has(current.id))
                continue;
            visited.add(current.id);
            const { data: org, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', current.id)
                .single();
            if (!error && org) {
                network.nodes.push({
                    id: org.id,
                    name: org.name,
                    industry: org.industry?.primary || 'unknown',
                    level: current.level,
                    influence: await this.calculateInfluenceScoreInternal(org)
                });
                // Add relationships
                const relationships = [
                    ...(org.relationships?.subsidiaries || []).map((id) => ({ id, type: 'subsidiary' })),
                    ...(org.relationships?.joint_ventures || []).map((id) => ({ id, type: 'joint_venture' })),
                    ...(org.relationships?.strategic_partnerships || []).map((id) => ({ id, type: 'partnership' }))
                ];
                for (const rel of relationships) {
                    network.edges.push({
                        source: org.id,
                        target: rel.id,
                        type: rel.type,
                        weight: this.calculateRelationshipWeight(rel.type)
                    });
                    if (current.level < depth - 1) {
                        queue.push({ id: rel.id, level: current.level + 1 });
                    }
                }
            }
        }
        network.clusters = this.identifyClusters(network.nodes, network.edges);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(network, null, 2)
                }]
        };
    }
    calculateRelationshipWeight(type) {
        const weights = {
            subsidiary: 1.0,
            parent: 1.0,
            joint_venture: 0.7,
            partnership: 0.5,
            competitor: 0.3
        };
        return weights[type] || 0.1;
    }
    identifyClusters(nodes, edges) {
        // Simple clustering based on industry
        const clusters = {};
        for (const node of nodes) {
            if (!clusters[node.industry]) {
                clusters[node.industry] = [];
            }
            clusters[node.industry].push(node.id);
        }
        return Object.entries(clusters).map(([industry, members]) => ({
            industry,
            members,
            size: members.length
        }));
    }
    async calculateInfluenceScore(organizationId) {
        const { data: org, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', organizationId)
            .single();
        if (error || !org) {
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({ error: 'Organization not found' })
                    }]
            };
        }
        const score = await this.calculateInfluenceScoreInternal(org);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        organization_id: organizationId,
                        influence_score: score,
                        factors: {
                            size: org.metadata?.revenue ? 30 : 0,
                            public_status: org.metadata?.public_private === 'public' ? 20 : 0,
                            media_coverage: (org.stakeholders?.media_outlets?.length || 0) * 5,
                            regulatory_attention: (org.stakeholders?.regulators?.length || 0) * 10
                        }
                    }, null, 2)
                }]
        };
    }
    async calculateInfluenceScoreInternal(org) {
        let score = 0;
        // Size factors
        if (org.metadata?.revenue?.includes('B'))
            score += 30;
        else if (org.metadata?.revenue?.includes('M'))
            score += 10;
        // Public company bonus
        if (org.metadata?.public_private === 'public')
            score += 20;
        // Media coverage
        score += (org.stakeholders?.media_outlets?.length || 0) * 5;
        // Regulatory attention
        score += (org.stakeholders?.regulators?.length || 0) * 10;
        return Math.min(100, score);
    }
    async start() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error('SignalDesk Entities MCP started');
    }
}
const mcp = new SignalDeskEntitiesMCP();
mcp.start().catch(console.error);
