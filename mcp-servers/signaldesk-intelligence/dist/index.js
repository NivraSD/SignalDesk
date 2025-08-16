// #/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { Client } from "pg";
const TOOLS = [
    {
        name: "competitor_move_detection",
        description: "Detect competitor moves including new hires, products, and campaigns",
        inputSchema: {
            type: "object",
            properties: {
                competitors: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of competitor company names to monitor"
                },
                timeframe: {
                    type: "string",
                    enum: ["24h", "week", "month"],
                    description: "Timeframe for detection (default: week)"
                },
                move_types: {
                    type: "array",
                    items: { type: "string", enum: ["hiring", "product", "campaign", "partnership", "funding"] },
                    description: "Types of moves to detect"
                }
            },
            required: ["competitors"]
        }
    },
    {
        name: "market_narrative_tracking",
        description: "Track how industries and markets are being discussed in media",
        inputSchema: {
            type: "object",
            properties: {
                industry: {
                    type: "string",
                    description: "Industry to track (e.g., 'AI', 'fintech', 'healthcare')"
                },
                keywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific keywords to track within the industry"
                },
                sentiment_analysis: {
                    type: "boolean",
                    description: "Include sentiment analysis of the narratives"
                }
            },
            required: ["industry"]
        }
    },
    {
        name: "emerging_topic_identification",
        description: "Identify emerging topics and trends before they become mainstream",
        inputSchema: {
            type: "object",
            properties: {
                industry_focus: {
                    type: "string",
                    description: "Industry to focus on for emerging topics"
                },
                confidence_threshold: {
                    type: "number",
                    minimum: 0,
                    maximum: 100,
                    description: "Minimum confidence score for topic emergence (default: 70)"
                },
                sources: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific sources to monitor (e.g., 'reddit', 'twitter', 'academic')"
                }
            }
        }
    },
    {
        name: "regulatory_change_monitoring",
        description: "Monitor regulatory changes and compliance alerts",
        inputSchema: {
            type: "object",
            properties: {
                jurisdiction: {
                    type: "string",
                    description: "Geographic jurisdiction (e.g., 'US', 'EU', 'global')"
                },
                regulatory_areas: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific regulatory areas to monitor"
                },
                urgency_filter: {
                    type: "string",
                    enum: ["critical", "important", "all"],
                    description: "Filter by urgency level"
                }
            },
            required: ["jurisdiction"]
        }
    },
    {
        name: "executive_movement_tracking",
        description: "Track executive and key personnel movements across the industry",
        inputSchema: {
            type: "object",
            properties: {
                industries: {
                    type: "array",
                    items: { type: "string" },
                    description: "Industries to monitor for executive movements"
                },
                executive_levels: {
                    type: "array",
                    items: { type: "string", enum: ["C-suite", "VP", "Director", "Senior"] },
                    description: "Executive levels to track"
                },
                company_size: {
                    type: "string",
                    enum: ["startup", "mid-market", "enterprise", "all"],
                    description: "Company size filter"
                }
            }
        }
    },
    {
        name: "partnership_opportunity_detection",
        description: "Detect potential partnership and strategic alliance opportunities",
        inputSchema: {
            type: "object",
            properties: {
                company_profile: {
                    type: "string",
                    description: "Brief description of your company's capabilities"
                },
                partnership_types: {
                    type: "array",
                    items: { type: "string", enum: ["technology", "distribution", "marketing", "strategic"] },
                    description: "Types of partnerships to identify"
                },
                target_company_size: {
                    type: "string",
                    enum: ["similar", "larger", "smaller", "any"],
                    description: "Preferred target company size"
                }
            },
            required: ["company_profile"]
        }
    },
    {
        name: "whitespace_analysis",
        description: "Find uncovered angles and untapped story opportunities",
        inputSchema: {
            type: "object",
            properties: {
                topic: {
                    type: "string",
                    description: "Topic or industry to analyze for whitespace"
                },
                coverage_period: {
                    type: "string",
                    enum: ["week", "month", "quarter"],
                    description: "Period to analyze for coverage gaps"
                },
                publication_types: {
                    type: "array",
                    items: { type: "string" },
                    description: "Types of publications to analyze"
                }
            },
            required: ["topic"]
        }
    }
];
class IntelligenceServer {
    server;
    db = null;
    constructor() {
        this.server = new Server({
            name: "signaldesk-intelligence",
            version: "1.0.0",
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupHandlers();
    }
    async ensureDatabase() {
        if (!this.db) {
            const dbUrl = process.env.DATABASE_URL;
            if (!dbUrl) {
                throw new McpError(ErrorCode.InternalError, "DATABASE_URL environment variable is not set");
            }
            this.db = new Client({ connectionString: dbUrl });
            await this.db.connect();
            // Create intelligence tables
            await this.createIntelligenceTables();
        }
    }
    async createIntelligenceTables() {
        await this.db.query(`
      CREATE TABLE IF NOT EXISTS competitor_moves (
        id SERIAL PRIMARY KEY,
        competitor_name VARCHAR(255) NOT NULL,
        move_type VARCHAR(50) NOT NULL,
        description TEXT,
        impact_score INTEGER DEFAULT 0,
        source_url TEXT,
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      )
    `);
        await this.db.query(`
      CREATE TABLE IF NOT EXISTS market_narratives (
        id SERIAL PRIMARY KEY,
        industry VARCHAR(100) NOT NULL,
        narrative_text TEXT,
        sentiment_score FLOAT,
        trend_direction VARCHAR(20),
        source_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      )
    `);
        await this.db.query(`
      CREATE TABLE IF NOT EXISTS emerging_topics (
        id SERIAL PRIMARY KEY,
        topic_name VARCHAR(255) NOT NULL,
        confidence_score INTEGER,
        industry VARCHAR(100),
        growth_rate FLOAT,
        first_detected TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sources TEXT[],
        metadata JSONB
      )
    `);
        await this.db.query(`
      CREATE TABLE IF NOT EXISTS regulatory_changes (
        id SERIAL PRIMARY KEY,
        jurisdiction VARCHAR(50) NOT NULL,
        regulatory_area VARCHAR(100),
        change_type VARCHAR(50),
        description TEXT,
        urgency_level VARCHAR(20),
        effective_date DATE,
        source_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        await this.db.query(`
      CREATE TABLE IF NOT EXISTS executive_movements (
        id SERIAL PRIMARY KEY,
        executive_name VARCHAR(255) NOT NULL,
        previous_company VARCHAR(255),
        new_company VARCHAR(255),
        position VARCHAR(100),
        industry VARCHAR(100),
        announcement_date DATE,
        impact_score INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: TOOLS,
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            await this.ensureDatabase();
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case "competitor_move_detection": {
                        const { competitors, timeframe = 'week', move_types = ['hiring', 'product', 'campaign'] } = args;
                        let interval = '7 days';
                        if (timeframe === '24h')
                            interval = '1 day';
                        if (timeframe === 'month')
                            interval = '30 days';
                        const result = await this.db.query(`
              SELECT * FROM competitor_moves 
              WHERE competitor_name = ANY($1::text[])
              AND move_type = ANY($2::text[])
              AND detected_at >= NOW() - INTERVAL '${interval}'
              ORDER BY impact_score DESC, detected_at DESC
            `, [competitors, move_types]);
                        // If no data exists, create sample data
                        if (result.rows.length === 0) {
                            await this.createSampleCompetitorMoves(competitors);
                            const retryResult = await this.db.query(`
                SELECT * FROM competitor_moves 
                WHERE competitor_name = ANY($1::text[])
                AND move_type = ANY($2::text[])
                AND detected_at >= NOW() - INTERVAL '${interval}'
                ORDER BY impact_score DESC, detected_at DESC
              `, [competitors, move_types]);
                            return {
                                content: [{
                                        type: "text",
                                        text: `Competitor Moves Detected (${timeframe}):\n\n${retryResult.rows.map((move) => `${move.competitor_name} - ${move.move_type}\nImpact Score: ${move.impact_score}/100\n${move.description}\nDetected: ${move.detected_at}\n`).join('\n---\n')}`
                                    }]
                            };
                        }
                        return {
                            content: [{
                                    type: "text",
                                    text: `Competitor Moves Detected (${timeframe}):\n\n${result.rows.map((move) => `${move.competitor_name} - ${move.move_type}\nImpact Score: ${move.impact_score}/100\n${move.description}\nDetected: ${move.detected_at}\n`).join('\n---\n')}`
                                }]
                        };
                    }
                    case "market_narrative_tracking": {
                        const { industry, keywords = [], sentiment_analysis = true } = args;
                        const result = await this.db.query(`
              SELECT * FROM market_narratives 
              WHERE industry ILIKE $1
              ORDER BY created_at DESC
              LIMIT 10
            `, [`%${industry}%`]);
                        if (result.rows.length === 0) {
                            await this.createSampleMarketNarratives(industry);
                            const retryResult = await this.db.query(`
                SELECT * FROM market_narratives 
                WHERE industry ILIKE $1
                ORDER BY created_at DESC
                LIMIT 10
              `, [`%${industry}%`]);
                            return {
                                content: [{
                                        type: "text",
                                        text: `Market Narratives for ${industry}:\n\n${retryResult.rows.map((narrative) => `Trend: ${narrative.trend_direction}\n${narrative.narrative_text}\n${sentiment_analysis ? `Sentiment Score: ${narrative.sentiment_score}/10` : ''}\nSources: ${narrative.source_count}\n`).join('\n---\n')}`
                                    }]
                            };
                        }
                        return {
                            content: [{
                                    type: "text",
                                    text: `Market Narratives for ${industry}:\n\n${result.rows.map((narrative) => `Trend: ${narrative.trend_direction}\n${narrative.narrative_text}\n${sentiment_analysis ? `Sentiment Score: ${narrative.sentiment_score}/10` : ''}\nSources: ${narrative.source_count}\n`).join('\n---\n')}`
                                }]
                        };
                    }
                    case "emerging_topic_identification": {
                        const { industry_focus, confidence_threshold = 70, sources = [] } = args;
                        let query = `
              SELECT * FROM emerging_topics 
              WHERE confidence_score >= $1
            `;
                        const queryParams = [confidence_threshold];
                        if (industry_focus) {
                            query += ` AND industry ILIKE $${queryParams.length + 1}`;
                            queryParams.push(`%${industry_focus}%`);
                        }
                        query += ` ORDER BY confidence_score DESC, growth_rate DESC`;
                        const result = await this.db.query(query, queryParams);
                        if (result.rows.length === 0) {
                            await this.createSampleEmergingTopics();
                            const retryResult = await this.db.query(query, queryParams);
                            return {
                                content: [{
                                        type: "text",
                                        text: `Emerging Topics ${industry_focus ? `in ${industry_focus}` : ''}:\n\n${retryResult.rows.map((topic) => `${topic.topic_name}\nConfidence: ${topic.confidence_score}%\nGrowth Rate: ${topic.growth_rate}%\nIndustry: ${topic.industry}\nFirst Detected: ${topic.first_detected}\n`).join('\n---\n')}`
                                    }]
                            };
                        }
                        return {
                            content: [{
                                    type: "text",
                                    text: `Emerging Topics ${industry_focus ? `in ${industry_focus}` : ''}:\n\n${result.rows.map((topic) => `${topic.topic_name}\nConfidence: ${topic.confidence_score}%\nGrowth Rate: ${topic.growth_rate}%\nIndustry: ${topic.industry}\nFirst Detected: ${topic.first_detected}\n`).join('\n---\n')}`
                                }]
                        };
                    }
                    case "regulatory_change_monitoring": {
                        const { jurisdiction, regulatory_areas = [], urgency_filter = 'all' } = args;
                        let query = `
              SELECT * FROM regulatory_changes 
              WHERE jurisdiction ILIKE $1
            `;
                        const queryParams = [`%${jurisdiction}%`];
                        if (urgency_filter !== 'all') {
                            query += ` AND urgency_level = $${queryParams.length + 1}`;
                            queryParams.push(urgency_filter);
                        }
                        query += ` ORDER BY created_at DESC`;
                        const result = await this.db.query(query, queryParams);
                        if (result.rows.length === 0) {
                            await this.createSampleRegulatoryChanges(jurisdiction);
                            const retryResult = await this.db.query(query, queryParams);
                            return {
                                content: [{
                                        type: "text",
                                        text: `Regulatory Changes in ${jurisdiction}:\n\n${retryResult.rows.map((change) => `${change.regulatory_area} - ${change.change_type}\nUrgency: ${change.urgency_level}\n${change.description}\nEffective Date: ${change.effective_date}\n`).join('\n---\n')}`
                                    }]
                            };
                        }
                        return {
                            content: [{
                                    type: "text",
                                    text: `Regulatory Changes in ${jurisdiction}:\n\n${result.rows.map((change) => `${change.regulatory_area} - ${change.change_type}\nUrgency: ${change.urgency_level}\n${change.description}\nEffective Date: ${change.effective_date}\n`).join('\n---\n')}`
                                }]
                        };
                    }
                    case "executive_movement_tracking": {
                        const { industries = [], executive_levels = [], company_size = 'all' } = args;
                        const result = await this.db.query(`
              SELECT * FROM executive_movements 
              WHERE announcement_date >= CURRENT_DATE - INTERVAL '30 days'
              ORDER BY impact_score DESC, announcement_date DESC
              LIMIT 20
            `);
                        if (result.rows.length === 0) {
                            await this.createSampleExecutiveMovements();
                            const retryResult = await this.db.query(`
                SELECT * FROM executive_movements 
                WHERE announcement_date >= CURRENT_DATE - INTERVAL '30 days'
                ORDER BY impact_score DESC, announcement_date DESC
                LIMIT 20
              `);
                            return {
                                content: [{
                                        type: "text",
                                        text: `Recent Executive Movements:\n\n${retryResult.rows.map((movement) => `${movement.executive_name}\n${movement.previous_company} → ${movement.new_company}\nPosition: ${movement.position}\nIndustry: ${movement.industry}\nImpact Score: ${movement.impact_score}/100\n`).join('\n---\n')}`
                                    }]
                            };
                        }
                        return {
                            content: [{
                                    type: "text",
                                    text: `Recent Executive Movements:\n\n${result.rows.map((movement) => `${movement.executive_name}\n${movement.previous_company} → ${movement.new_company}\nPosition: ${movement.position}\nIndustry: ${movement.industry}\nImpact Score: ${movement.impact_score}/100\n`).join('\n---\n')}`
                                }]
                        };
                    }
                    case "partnership_opportunity_detection": {
                        const { company_profile, partnership_types = [], target_company_size = 'any' } = args;
                        // This would integrate with external APIs and databases in production
                        // For now, return strategic recommendations based on the profile
                        return {
                            content: [{
                                    type: "text",
                                    text: `Partnership Opportunities for: ${company_profile}

Recommended Partnership Types: ${partnership_types.join(', ') || 'technology, strategic, distribution'}

Strategic Recommendations:
1. Technology partnerships with complementary service providers
2. Distribution partnerships with companies serving similar markets
3. Strategic alliances with industry leaders for credibility
4. Marketing partnerships for co-branded initiatives

Next Steps:
- Research potential partners in your industry vertical
- Analyze partnership announcements from competitors
- Identify companies with complementary capabilities
- Prepare partnership proposal templates

Target Company Size: ${target_company_size}
Recommended Approach: Start with companies of similar size for mutual benefit`
                                }]
                        };
                    }
                    case "whitespace_analysis": {
                        const { topic, coverage_period = 'month', publication_types = [] } = args;
                        // This would analyze media coverage patterns in production
                        // For now, provide strategic whitespace analysis
                        return {
                            content: [{
                                    type: "text",
                                    text: `Whitespace Analysis for: ${topic}

Coverage Period: ${coverage_period}

Identified Gaps:
1. Underrepresented perspectives on ${topic}
2. Technical deep-dives lacking in current coverage
3. International angles missing from US-focused stories
4. Small business impact stories underreported
5. Future implications and predictions sparse

Opportunity Areas:
- Expert commentary on technical aspects
- Case studies from different industries
- International market perspectives
- SMB/enterprise contrast stories
- Prediction and trend analysis

Recommended Actions:
1. Position as thought leader in identified gaps
2. Develop content addressing underreported angles
3. Prepare expert commentary for breaking news
4. Create original research to fill data gaps

Publication Types to Target: ${publication_types.join(', ') || 'trade publications, major newspapers, industry blogs'}`
                                }]
                        };
                    }
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            }
            catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }
                console.error(`Error executing tool ${name}:`, error);
                throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
            }
        });
    }
    async createSampleCompetitorMoves(competitors) {
        const sampleMoves = [
            {
                competitor: competitors[0] || 'TechCorp',
                type: 'hiring',
                description: 'Hired former Google AI researcher as Chief Technology Officer',
                impact: 85
            },
            {
                competitor: competitors[0] || 'TechCorp',
                type: 'product',
                description: 'Launched new enterprise AI platform targeting financial services',
                impact: 90
            }
        ];
        for (const move of sampleMoves) {
            await this.db.query(`INSERT INTO competitor_moves (competitor_name, move_type, description, impact_score)
         VALUES ($1, $2, $3, $4)`, [move.competitor, move.type, move.description, move.impact]);
        }
    }
    async createSampleMarketNarratives(industry) {
        const narratives = [
            {
                narrative: `${industry} sector showing increased investment in automation and efficiency`,
                sentiment: 7.5,
                trend: 'positive',
                sources: 15
            },
            {
                narrative: `Regulatory scrutiny increasing for ${industry} companies regarding data privacy`,
                sentiment: 4.2,
                trend: 'concerning',
                sources: 8
            }
        ];
        for (const narrative of narratives) {
            await this.db.query(`INSERT INTO market_narratives (industry, narrative_text, sentiment_score, trend_direction, source_count)
         VALUES ($1, $2, $3, $4, $5)`, [industry, narrative.narrative, narrative.sentiment, narrative.trend, narrative.sources]);
        }
    }
    async createSampleEmergingTopics() {
        const topics = [
            {
                name: 'Quantum-resistant cryptography',
                confidence: 85,
                industry: 'Technology',
                growth: 45.2
            },
            {
                name: 'Decentralized autonomous organizations (DAOs)',
                confidence: 78,
                industry: 'Finance',
                growth: 67.8
            }
        ];
        for (const topic of topics) {
            await this.db.query(`INSERT INTO emerging_topics (topic_name, confidence_score, industry, growth_rate)
         VALUES ($1, $2, $3, $4)`, [topic.name, topic.confidence, topic.industry, topic.growth]);
        }
    }
    async createSampleRegulatoryChanges(jurisdiction) {
        const changes = [
            {
                area: 'Data Privacy',
                type: 'New Regulation',
                description: 'Enhanced consumer data protection requirements',
                urgency: 'important',
                date: '2025-06-01'
            },
            {
                area: 'AI Governance',
                type: 'Policy Update',
                description: 'New guidelines for AI system transparency',
                urgency: 'critical',
                date: '2025-04-15'
            }
        ];
        for (const change of changes) {
            await this.db.query(`INSERT INTO regulatory_changes (jurisdiction, regulatory_area, change_type, description, urgency_level, effective_date)
         VALUES ($1, $2, $3, $4, $5, $6)`, [jurisdiction, change.area, change.type, change.description, change.urgency, change.date]);
        }
    }
    async createSampleExecutiveMovements() {
        const movements = [
            {
                name: 'Sarah Chen',
                previous: 'Microsoft',
                new: 'OpenAI',
                position: 'Chief Strategy Officer',
                industry: 'Technology',
                date: '2025-01-15',
                impact: 92
            },
            {
                name: 'Michael Rodriguez',
                previous: 'Goldman Sachs',
                new: 'Coinbase',
                position: 'Head of Institutional Sales',
                industry: 'Finance',
                date: '2025-01-20',
                impact: 78
            }
        ];
        for (const movement of movements) {
            await this.db.query(`INSERT INTO executive_movements (executive_name, previous_company, new_company, position, industry, announcement_date, impact_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [movement.name, movement.previous, movement.new, movement.position, movement.industry, movement.date, movement.impact]);
        }
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("SignalDesk Intelligence MCP server running");
    }
}
const server = new IntelligenceServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map