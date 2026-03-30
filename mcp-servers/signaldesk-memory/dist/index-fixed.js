/**
 * SignalDesk Memory MCP Server - Fixed Version
 * Provides access to MemoryVault for semantic search and knowledge management
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });
// Supabase connection
const SUPABASE_DB_PASSWORD = 'MUmjKBxTiecMPpYVgwGsZEKyFfyFbxqV';
const DATABASE_URL = `postgresql://postgres.zskaxjtyuaqazydouifp:${SUPABASE_DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
// Database connection
let pool = null;
async function initializeDatabase() {
    console.log('SignalDesk Memory MCP Server starting...');
    console.log('Connecting to Supabase database...');
    try {
        pool = new Pool({
            connectionString: DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        // Test the connection
        await pool.query('SELECT 1');
        console.log('✅ Database connected successfully');
        // Verify tables exist
        const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'memoryvault_items'
    `);
        if (tableCheck.rows.length === 0) {
            console.log('⚠️ memoryvault_items table not found. Creating...');
            // Create the table if it doesn't exist
            await pool.query(`
        CREATE TABLE IF NOT EXISTS memoryvault_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(255) NOT NULL DEFAULT 'demo-user',
          title VARCHAR(500) NOT NULL,
          content TEXT NOT NULL,
          category VARCHAR(100) DEFAULT 'general',
          tags TEXT[] DEFAULT '{}',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
            console.log('✅ Table created successfully');
        }
        else {
            console.log('✅ memoryvault_items table exists');
        }
    }
    catch (error) {
        console.error('❌ Database initialization failed:', error);
        console.log('Continuing without persistence');
        pool = null;
    }
}
// Initialize database connection
await initializeDatabase();
// Create MCP server
const server = new Server({
    name: 'signaldesk-memory',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
        resources: {},
    },
});
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
                if (!pool) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    results: [],
                                    count: 0,
                                    searchType: 'keyword',
                                    message: 'Database not available'
                                }, null, 2)
                            }
                        ]
                    };
                }
                // Keyword search (semantic search would require embeddings)
                const searchQuery = `
          SELECT id, title, content, category, tags, created_at
          FROM memoryvault_items
          WHERE (
            title ILIKE $1 
            OR content ILIKE $1
            OR category ILIKE $1
            OR array_to_string(tags, ' ') ILIKE $1
          )
          ORDER BY created_at DESC
          LIMIT $2
        `;
                const result = await pool.query(searchQuery, [
                    `%${query}%`,
                    limit
                ]);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                results: result.rows,
                                count: result.rowCount,
                                searchType: 'keyword'
                            }, null, 2)
                        }
                    ]
                };
            }
            case 'add_to_memory': {
                const { title, content, category = 'general', tags = [] } = args;
                if (!pool) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Memory item would be created (database unavailable): ${JSON.stringify({ title, category }, null, 2)}`
                            }
                        ]
                    };
                }
                const insertQuery = `
          INSERT INTO memoryvault_items (user_id, title, content, category, tags)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, title, category, created_at
        `;
                const result = await pool.query(insertQuery, [
                    'demo-user',
                    title,
                    content,
                    category,
                    tags
                ]);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Memory item created successfully: ${JSON.stringify(result.rows[0], null, 2)}`
                        }
                    ]
                };
            }
            case 'get_memory_context': {
                const { itemId, topic, depth = 1 } = args;
                if (!pool) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'Database not available for context retrieval'
                            }
                        ]
                    };
                }
                let contextQuery;
                let queryParams;
                if (itemId) {
                    // Get specific item
                    contextQuery = `
            SELECT id, title, content, category, tags
            FROM memoryvault_items
            WHERE id = $1
          `;
                    queryParams = [itemId];
                }
                else if (topic) {
                    // Get items related to topic
                    contextQuery = `
            SELECT id, title, content, category, tags
            FROM memoryvault_items
            WHERE (
              category = $1
              OR $1 = ANY(tags)
              OR title ILIKE $2
              OR content ILIKE $2
            )
            LIMIT 20
          `;
                    queryParams = [topic, `%${topic}%`];
                }
                else {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'Please provide either itemId or topic'
                            }
                        ]
                    };
                }
                const result = await pool.query(contextQuery, queryParams);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                context: result.rows,
                                count: result.rowCount,
                                depth
                            }, null, 2)
                        }
                    ]
                };
            }
            case 'list_memory_categories': {
                if (!pool) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'Database not available'
                            }
                        ]
                    };
                }
                const categoryQuery = `
          SELECT DISTINCT category, COUNT(*) as count
          FROM memoryvault_items
          GROUP BY category
          ORDER BY count DESC
        `;
                const result = await pool.query(categoryQuery);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                categories: result.rows,
                                total: result.rowCount
                            }, null, 2)
                        }
                    ]
                };
            }
            default:
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Unknown tool: ${name}`
                        }
                    ]
                };
        }
    }
    catch (error) {
        console.error(`Error executing ${name}:`, error);
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
// Resource handlers (currently empty)
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: []
}));
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('SignalDesk Memory MCP Server is running');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index-fixed.js.map