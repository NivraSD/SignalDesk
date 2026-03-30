/**
 * SignalDesk Memory MCP Server - Standalone Version
 * No database dependencies - works purely in memory
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
// Create MCP server
const server = new Server({
    name: 'signaldesk-memory',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// In-memory storage
const memoryVault = new Map();
let idCounter = 1;
// Define available tools
const TOOLS = [
    {
        name: 'search_memory',
        description: 'Search the MemoryVault for relevant information using semantic or keyword search',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The search query'
                },
                searchType: {
                    type: 'string',
                    enum: ['semantic', 'keyword', 'hybrid'],
                    description: 'Type of search to perform',
                    default: 'hybrid'
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of results to return',
                    default: 10
                }
            },
            required: ['query']
        }
    },
    {
        name: 'add_to_memory',
        description: 'Add new information to the MemoryVault',
        inputSchema: {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    description: 'Title of the memory item'
                },
                content: {
                    type: 'string',
                    description: 'Content to store'
                },
                category: {
                    type: 'string',
                    description: 'Category for organization'
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Tags for the memory item'
                }
            },
            required: ['title', 'content']
        }
    },
    {
        name: 'get_memory_context',
        description: 'Get related context for a specific memory item or topic',
        inputSchema: {
            type: 'object',
            properties: {
                itemId: {
                    type: 'string',
                    description: 'ID of the memory item (optional)'
                },
                topic: {
                    type: 'string',
                    description: 'Topic to get context for (optional)'
                },
                depth: {
                    type: 'number',
                    description: 'How many levels of related items to fetch',
                    default: 1
                }
            }
        }
    },
    {
        name: 'list_memory_categories',
        description: 'List all categories in the MemoryVault',
        inputSchema: {
            type: 'object',
            properties: {}
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
            case 'search_memory': {
                const { query, searchType = 'hybrid', limit = 10 } = args;
                // Simple keyword search in memory
                const results = [];
                const queryLower = query.toLowerCase();
                memoryVault.forEach((item, id) => {
                    if (item.title?.toLowerCase().includes(queryLower) ||
                        item.content?.toLowerCase().includes(queryLower) ||
                        item.category?.toLowerCase().includes(queryLower) ||
                        item.tags?.some((tag) => tag.toLowerCase().includes(queryLower))) {
                        results.push({ id, ...item });
                    }
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                results: results.slice(0, limit),
                                count: results.length,
                                searchType: 'keyword'
                            }, null, 2)
                        }
                    ]
                };
            }
            case 'add_to_memory': {
                const { title, content, category = 'general', tags = [] } = args;
                const id = `memory_${idCounter++}`;
                const memoryItem = {
                    title,
                    content,
                    category,
                    tags,
                    created_at: new Date().toISOString()
                };
                memoryVault.set(id, memoryItem);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Memory item created successfully: ${JSON.stringify({ id, title, category, created_at: memoryItem.created_at }, null, 2)}`
                        }
                    ]
                };
            }
            case 'get_memory_context': {
                const { itemId, topic, depth = 1 } = args;
                if (itemId && memoryVault.has(itemId)) {
                    const item = memoryVault.get(itemId);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    context: [{ id: itemId, ...item }],
                                    depth: depth
                                }, null, 2)
                            }
                        ]
                    };
                }
                else if (topic) {
                    const topicLower = topic.toLowerCase();
                    const results = [];
                    memoryVault.forEach((item, id) => {
                        if (item.category?.toLowerCase() === topicLower ||
                            item.tags?.includes(topic) ||
                            item.title?.toLowerCase().includes(topicLower) ||
                            item.content?.toLowerCase().includes(topicLower)) {
                            results.push({ id, ...item });
                        }
                    });
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    context: results.slice(0, 20),
                                    depth: depth
                                }, null, 2)
                            }
                        ]
                    };
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Please provide either itemId or topic'
                        }
                    ]
                };
            }
            case 'list_memory_categories': {
                const categories = new Map();
                memoryVault.forEach((item) => {
                    if (item.category) {
                        categories.set(item.category, (categories.get(item.category) || 0) + 1);
                    }
                });
                const categoryList = Array.from(categories.entries())
                    .map(([category, count]) => ({ category, count }))
                    .sort((a, b) => b.count - a.count);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                categories: categoryList
                            }, null, 2)
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
    console.error('Starting SignalDesk Memory MCP Server (Standalone)...');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('SignalDesk Memory MCP Server is running');
}
main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=standalone.js.map