import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { Client } from "pg";
const TOOLS = [
    {
        name: "discover_opportunities",
        description: "Discover PR opportunities based on trends, news, and industry events",
        inputSchema: {
            type: "object",
            properties: {
                industry: {
                    type: "string",
                    description: "Industry or sector to focus on (e.g., 'technology', 'healthcare')"
                },
                keywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "Keywords related to your company or expertise"
                },
                limit: {
                    type: "number",
                    description: "Maximum number of opportunities to return (default: 10)"
                }
            }
        }
    },
    {
        name: "analyze_opportunity",
        description: "Analyze a specific PR opportunity for relevance and impact",
        inputSchema: {
            type: "object",
            properties: {
                opportunity_id: {
                    type: "string",
                    description: "ID of the opportunity to analyze"
                }
            },
            required: ["opportunity_id"]
        }
    },
    {
        name: "create_opportunity",
        description: "Create a custom PR opportunity based on specific criteria",
        inputSchema: {
            type: "object",
            properties: {
                title: {
                    type: "string",
                    description: "Title of the opportunity"
                },
                type: {
                    type: "string",
                    enum: ["trending", "news_hook", "award", "speaking", "journalist_interest", "competitor_gap", "editorial_calendar"],
                    description: "Type of opportunity"
                },
                description: {
                    type: "string",
                    description: "Detailed description of the opportunity"
                },
                urgency: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Urgency level"
                },
                deadline: {
                    type: "string",
                    description: "Deadline for the opportunity (e.g., '3 days', '1 week')"
                },
                keywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "Related keywords"
                }
            },
            required: ["title", "type", "description"]
        }
    },
    {
        name: "track_opportunity",
        description: "Track an opportunity for monitoring and updates",
        inputSchema: {
            type: "object",
            properties: {
                opportunity_id: {
                    type: "string",
                    description: "ID of the opportunity to track"
                },
                notes: {
                    type: "string",
                    description: "Notes about tracking this opportunity"
                }
            },
            required: ["opportunity_id"]
        }
    },
    {
        name: "get_opportunity_trends",
        description: "Get trending PR opportunity types and topics",
        inputSchema: {
            type: "object",
            properties: {
                timeframe: {
                    type: "string",
                    enum: ["today", "week", "month"],
                    description: "Timeframe for trends (default: week)"
                }
            }
        }
    },
    {
        name: "suggest_pitch",
        description: "Suggest a pitch approach for a specific opportunity",
        inputSchema: {
            type: "object",
            properties: {
                opportunity_id: {
                    type: "string",
                    description: "ID of the opportunity"
                },
                company_context: {
                    type: "string",
                    description: "Brief context about your company"
                }
            },
            required: ["opportunity_id"]
        }
    }
];
class OpportunitiesServer {
    server;
    db = null;
    constructor() {
        this.server = new Server({
            name: "signaldesk-opportunities",
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
            // Create opportunities table if it doesn't exist
            await this.db.query(`
        CREATE TABLE IF NOT EXISTS opportunities (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          description TEXT,
          score INTEGER DEFAULT 0,
          urgency VARCHAR(20),
          deadline VARCHAR(50),
          keywords TEXT[],
          relevant_journalists TEXT[],
          suggested_action TEXT,
          metadata JSONB,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Create opportunity_tracking table
            await this.db.query(`
        CREATE TABLE IF NOT EXISTS opportunity_tracking (
          id SERIAL PRIMARY KEY,
          opportunity_id INTEGER REFERENCES opportunities(id),
          user_id VARCHAR(255),
          notes TEXT,
          status VARCHAR(50) DEFAULT 'tracking',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
        }
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
                    case "discover_opportunities": {
                        const { industry, keywords, limit = 10 } = args;
                        // In production, this would connect to news APIs, social media trends, etc.
                        // For now, we'll query our database and generate some opportunities
                        let query = `
              SELECT * FROM opportunities 
              WHERE status = 'active'
            `;
                        const queryParams = [];
                        if (keywords && keywords.length > 0) {
                            query += ` AND keywords && $${queryParams.length + 1}::text[]`;
                            queryParams.push(keywords);
                        }
                        query += ` ORDER BY score DESC, created_at DESC LIMIT $${queryParams.length + 1}`;
                        queryParams.push(limit);
                        const result = await this.db.query(query, queryParams);
                        // If no opportunities exist, create some sample ones
                        if (result.rows.length === 0) {
                            await this.createSampleOpportunities();
                            const retryResult = await this.db.query(query, queryParams);
                            return {
                                content: [
                                    {
                                        type: "text",
                                        text: `Found ${retryResult.rows.length} PR opportunities:\n\n${retryResult.rows.map((opp) => `${opp.title} (${opp.type})\nScore: ${opp.score}/100\nUrgency: ${opp.urgency}\n${opp.description}\n`).join('\n---\n')}`
                                    }
                                ]
                            };
                        }
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `Found ${result.rows.length} PR opportunities:\n\n${result.rows.map((opp) => `${opp.title} (${opp.type})\nScore: ${opp.score}/100\nUrgency: ${opp.urgency}\n${opp.description}\n`).join('\n---\n')}`
                                }
                            ]
                        };
                    }
                    case "analyze_opportunity": {
                        const { opportunity_id } = args;
                        const result = await this.db.query("SELECT * FROM opportunities WHERE id = $1", [opportunity_id]);
                        if (result.rows.length === 0) {
                            throw new McpError(ErrorCode.InvalidRequest, "Opportunity not found");
                        }
                        const opp = result.rows[0];
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `Opportunity Analysis: ${opp.title}
                  
Type: ${opp.type}
Score: ${opp.score}/100
Urgency: ${opp.urgency}
Deadline: ${opp.deadline || 'No specific deadline'}

Description:
${opp.description}

Suggested Action:
${opp.suggested_action || 'Consider how this aligns with your current PR strategy'}

Keywords: ${opp.keywords?.join(', ') || 'None specified'}

Relevant Journalists: ${opp.relevant_journalists?.join(', ') || 'Research needed'}

Recommendation: ${opp.score >= 80 ? 'HIGH PRIORITY - Act quickly' : opp.score >= 60 ? 'MEDIUM PRIORITY - Worth pursuing' : 'LOW PRIORITY - Monitor for now'}`
                                }
                            ]
                        };
                    }
                    case "create_opportunity": {
                        const { title, type, description, urgency = 'medium', deadline, keywords = [] } = args;
                        const result = await this.db.query(`INSERT INTO opportunities (title, type, description, urgency, deadline, keywords, score)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               RETURNING *`, [title, type, description, urgency, deadline, keywords, 75] // Default score
                        );
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `Created opportunity: ${result.rows[0].title} (ID: ${result.rows[0].id})`
                                }
                            ]
                        };
                    }
                    case "track_opportunity": {
                        const { opportunity_id, notes } = args;
                        await this.db.query(`INSERT INTO opportunity_tracking (opportunity_id, notes)
               VALUES ($1, $2)`, [opportunity_id, notes || '']);
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `Now tracking opportunity ID ${opportunity_id}`
                                }
                            ]
                        };
                    }
                    case "get_opportunity_trends": {
                        const { timeframe = 'week' } = args;
                        let interval = '7 days';
                        if (timeframe === 'today')
                            interval = '1 day';
                        if (timeframe === 'month')
                            interval = '30 days';
                        const result = await this.db.query(`
              SELECT type, COUNT(*) as count, AVG(score) as avg_score
              FROM opportunities
              WHERE created_at >= NOW() - INTERVAL '${interval}'
              GROUP BY type
              ORDER BY count DESC
            `);
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `PR Opportunity Trends (${timeframe}):\n\n${result.rows.map((row) => `${row.type}: ${row.count} opportunities (avg score: ${Math.round(row.avg_score)})`).join('\n')}`
                                }
                            ]
                        };
                    }
                    case "suggest_pitch": {
                        const { opportunity_id, company_context } = args;
                        const result = await this.db.query("SELECT * FROM opportunities WHERE id = $1", [opportunity_id]);
                        if (result.rows.length === 0) {
                            throw new McpError(ErrorCode.InvalidRequest, "Opportunity not found");
                        }
                        const opp = result.rows[0];
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `Pitch Suggestion for: ${opp.title}

Angle: Position your company as a thought leader on ${opp.keywords?.[0] || 'this topic'}

Key Messages:
1. Unique perspective based on ${company_context || 'your expertise'}
2. Timely relevance to ${opp.description}
3. Actionable insights for the audience

Pitch Structure:
- Hook: Reference the ${opp.type === 'trending' ? 'trending topic' : 'current news'}
- Bridge: Connect to your expertise
- Value: What unique insight you can provide
- Call to Action: Offer interview, data, or expert commentary

Timing: ${opp.urgency === 'high' ? 'Send immediately' : 'Send within 24-48 hours'}`
                                }
                            ]
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
    async createSampleOpportunities() {
        const samples = [
            {
                title: "AI Regulation Discussion Heating Up",
                type: "trending",
                description: "Senate hearings on AI safety creating media opportunities",
                score: 95,
                urgency: "high",
                deadline: "2 days",
                keywords: ["AI safety", "regulation", "ethics"],
                relevant_journalists: ["Sarah Chen - TechCrunch", "Michael Roberts - The Verge"],
                suggested_action: "Prepare thought leadership piece on responsible AI"
            },
            {
                title: "Earth Day 2025 Coverage",
                type: "editorial_calendar",
                description: "Major publications planning Earth Day features",
                score: 78,
                urgency: "medium",
                deadline: "2 weeks",
                keywords: ["sustainability", "environment", "climate"],
                relevant_journalists: ["Environmental beat reporters"],
                suggested_action: "Pitch sustainability initiatives and green tech innovations"
            },
            {
                title: "Tech Industry Layoffs Story",
                type: "news_hook",
                description: "Opportunity to discuss company growth and stability",
                score: 82,
                urgency: "high",
                deadline: "3 days",
                keywords: ["tech industry", "employment", "growth"],
                relevant_journalists: ["Business reporters"],
                suggested_action: "Highlight positive hiring or stability story"
            }
        ];
        for (const opp of samples) {
            await this.db.query(`INSERT INTO opportunities (title, type, description, score, urgency, deadline, keywords, relevant_journalists, suggested_action)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [opp.title, opp.type, opp.description, opp.score, opp.urgency, opp.deadline,
                opp.keywords, opp.relevant_journalists, opp.suggested_action]);
        }
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("SignalDesk Opportunities MCP server running");
    }
}
const server = new OpportunitiesServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map