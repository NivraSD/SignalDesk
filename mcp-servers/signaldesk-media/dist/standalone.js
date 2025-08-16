/**
 * SignalDesk Media MCP Server - Standalone Version
 * No database dependencies - works purely in memory
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
// Create MCP server
const server = new Server({
    name: 'signaldesk-media',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Define media intelligence tools
const TOOLS = [
    {
        name: 'find_journalists',
        description: 'Find relevant journalists based on beat, publication, or topic',
        inputSchema: {
            type: 'object',
            properties: {
                beat: {
                    type: 'string',
                    description: 'Journalist beat or topic area (e.g., technology, healthcare)'
                },
                publication: {
                    type: 'string',
                    description: 'Target publication (optional)'
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of results',
                    default: 10
                }
            },
            required: ['beat']
        }
    },
    {
        name: 'monitor_coverage',
        description: 'Monitor media coverage for specific topics or competitors',
        inputSchema: {
            type: 'object',
            properties: {
                keywords: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Keywords to monitor'
                },
                timeframe: {
                    type: 'string',
                    enum: ['24h', '7d', '30d', 'all'],
                    description: 'Timeframe for monitoring',
                    default: '7d'
                }
            }
        }
    }
];
// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'find_journalists': {
                const { beat, publication, limit = 10 } = args;
                // Mock data for journalists
                const journalists = [
                    {
                        name: "Sarah Chen",
                        publication: publication || "TechCrunch",
                        beat: beat,
                        email: "s.chen@example.com",
                        twitter: "@sarahchen",
                        recentArticle: `Latest developments in ${beat}`,
                        relevanceScore: 9
                    },
                    {
                        name: "Mike Johnson",
                        publication: publication || "The Verge",
                        beat: beat,
                        email: "m.johnson@example.com",
                        twitter: "@mikej",
                        recentArticle: `Breaking news in ${beat}`,
                        relevanceScore: 8
                    }
                ].slice(0, limit);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(journalists, null, 2)
                        }
                    ]
                };
            }
            case 'monitor_coverage': {
                const { keywords = [], timeframe = '7d' } = args;
                const coverage = {
                    timeframe,
                    totalArticles: Math.floor(Math.random() * 50) + 10,
                    keywordMentions: Object.fromEntries(keywords.map((k) => [k, Math.floor(Math.random() * 20) + 1])),
                    topPublications: [
                        { name: "TechCrunch", articles: 8 },
                        { name: "The Verge", articles: 6 },
                        { name: "Wired", articles: 4 }
                    ],
                    sentiment: {
                        positive: 45,
                        neutral: 40,
                        negative: 15
                    }
                };
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(coverage, null, 2)
                        }
                    ]
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error executing ${name}: ${error.message}`
                }
            ],
            isError: true
        };
    }
});
// Start the server
async function main() {
    console.error('Starting SignalDesk Media MCP Server (Standalone)...');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('SignalDesk Media MCP Server is running');
}
main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=standalone.js.map