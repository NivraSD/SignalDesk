#!/usr/bin/env node
/**
 * SignalDesk Campaigns MCP Server
 * Provides campaign management, planning, and orchestration capabilities
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../backend/.env') });
// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
// Create MCP server
const server = new Server({
    name: 'signaldesk-campaigns',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Define campaign management tools
const TOOLS = [
    {
        name: 'create_campaign',
        description: 'Create a new PR campaign with timeline and objectives',
        inputSchema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Campaign name'
                },
                objectives: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Campaign objectives'
                },
                startDate: {
                    type: 'string',
                    description: 'Campaign start date (ISO format)'
                },
                endDate: {
                    type: 'string',
                    description: 'Campaign end date (ISO format)'
                },
                targetAudience: {
                    type: 'string',
                    description: 'Target audience description'
                },
                budget: {
                    type: 'number',
                    description: 'Campaign budget (optional)'
                }
            },
            required: ['name', 'objectives']
        }
    },
    {
        name: 'add_campaign_task',
        description: 'Add a task or milestone to an existing campaign',
        inputSchema: {
            type: 'object',
            properties: {
                campaignId: {
                    type: 'string',
                    description: 'Campaign ID'
                },
                taskName: {
                    type: 'string',
                    description: 'Task name'
                },
                description: {
                    type: 'string',
                    description: 'Task description'
                },
                dueDate: {
                    type: 'string',
                    description: 'Task due date (ISO format)'
                },
                assignee: {
                    type: 'string',
                    description: 'Person or team assigned (optional)'
                },
                dependencies: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Task IDs this task depends on'
                }
            },
            required: ['campaignId', 'taskName']
        }
    },
    {
        name: 'get_campaign_status',
        description: 'Get the current status and progress of a campaign',
        inputSchema: {
            type: 'object',
            properties: {
                campaignId: {
                    type: 'string',
                    description: 'Campaign ID (optional, returns all if not provided)'
                }
            }
        }
    },
    {
        name: 'analyze_campaign_timeline',
        description: 'Analyze campaign timeline for conflicts, dependencies, and optimization opportunities',
        inputSchema: {
            type: 'object',
            properties: {
                campaignId: {
                    type: 'string',
                    description: 'Campaign ID to analyze'
                }
            },
            required: ['campaignId']
        }
    },
    {
        name: 'orchestrate_campaign_execution',
        description: 'Execute campaign tasks automatically based on timeline and dependencies',
        inputSchema: {
            type: 'object',
            properties: {
                campaignId: {
                    type: 'string',
                    description: 'Campaign ID'
                },
                action: {
                    type: 'string',
                    enum: ['start', 'pause', 'resume', 'complete'],
                    description: 'Orchestration action'
                }
            },
            required: ['campaignId', 'action']
        }
    },
    {
        name: 'generate_campaign_report',
        description: 'Generate a comprehensive campaign performance report',
        inputSchema: {
            type: 'object',
            properties: {
                campaignId: {
                    type: 'string',
                    description: 'Campaign ID'
                },
                reportType: {
                    type: 'string',
                    enum: ['summary', 'detailed', 'metrics', 'timeline'],
                    description: 'Type of report to generate',
                    default: 'summary'
                }
            },
            required: ['campaignId']
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
            case 'create_campaign': {
                const { name: campaignName, objectives, startDate, endDate, targetAudience, budget } = args;
                const insertQuery = `
          INSERT INTO campaigns (
            user_id, name, objectives, start_date, end_date, 
            target_audience, budget, status, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'planning', NOW())
          RETURNING id, name, status, created_at
        `;
                const result = await pool.query(insertQuery, [
                    'demo-user',
                    campaignName,
                    JSON.stringify(objectives),
                    startDate || new Date(),
                    endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
                    targetAudience || '',
                    budget || 0
                ]);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Campaign created successfully:\n${JSON.stringify(result.rows[0], null, 2)}`
                        }
                    ]
                };
            }
            case 'add_campaign_task': {
                const { campaignId, taskName, description, dueDate, assignee, dependencies = [] } = args;
                const insertQuery = `
          INSERT INTO campaign_tasks (
            campaign_id, name, description, due_date, 
            assignee, dependencies, status, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
          RETURNING id, name, status, due_date
        `;
                const result = await pool.query(insertQuery, [
                    campaignId,
                    taskName,
                    description || '',
                    dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
                    assignee || '',
                    JSON.stringify(dependencies)
                ]);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Task added to campaign:\n${JSON.stringify(result.rows[0], null, 2)}`
                        }
                    ]
                };
            }
            case 'get_campaign_status': {
                const { campaignId } = args;
                let query;
                let params;
                if (campaignId) {
                    query = `
            SELECT 
              c.id, c.name, c.status, c.start_date, c.end_date,
              COUNT(t.id) as total_tasks,
              COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
              COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks
            FROM campaigns c
            LEFT JOIN campaign_tasks t ON c.id = t.campaign_id
            WHERE c.id = $1 AND c.user_id = $2
            GROUP BY c.id
          `;
                    params = [campaignId, 'demo-user'];
                }
                else {
                    query = `
            SELECT 
              c.id, c.name, c.status, c.start_date, c.end_date,
              COUNT(t.id) as total_tasks,
              COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
            FROM campaigns c
            LEFT JOIN campaign_tasks t ON c.id = t.campaign_id
            WHERE c.user_id = $1
            GROUP BY c.id
            ORDER BY c.created_at DESC
          `;
                    params = ['demo-user'];
                }
                const result = await pool.query(query, params);
                const campaigns = result.rows.map(row => ({
                    ...row,
                    progress: row.total_tasks > 0
                        ? Math.round((row.completed_tasks / row.total_tasks) * 100)
                        : 0
                }));
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(campaigns, null, 2)
                        }
                    ]
                };
            }
            case 'analyze_campaign_timeline': {
                const { campaignId } = args;
                // Get all tasks for the campaign
                const tasksQuery = `
          SELECT id, name, due_date, dependencies, status
          FROM campaign_tasks
          WHERE campaign_id = $1
          ORDER BY due_date
        `;
                const tasksResult = await pool.query(tasksQuery, [campaignId]);
                const tasks = tasksResult.rows;
                // Analyze for issues
                const issues = [];
                const opportunities = [];
                // Check for dependency conflicts
                tasks.forEach(task => {
                    if (task.dependencies && task.dependencies.length > 0) {
                        const deps = JSON.parse(task.dependencies);
                        deps.forEach((depId) => {
                            const depTask = tasks.find(t => t.id === depId);
                            if (depTask && new Date(depTask.due_date) > new Date(task.due_date)) {
                                issues.push(`Task "${task.name}" depends on "${depTask.name}" but is scheduled earlier`);
                            }
                        });
                    }
                });
                // Check for overdue tasks
                const now = new Date();
                tasks.forEach(task => {
                    if (task.status !== 'completed' && new Date(task.due_date) < now) {
                        issues.push(`Task "${task.name}" is overdue`);
                    }
                });
                // Identify optimization opportunities
                if (tasks.length > 0) {
                    const taskDates = tasks.map(t => new Date(t.due_date).getTime());
                    const avgGap = (Math.max(...taskDates) - Math.min(...taskDates)) / tasks.length;
                    if (avgGap > 7 * 24 * 60 * 60 * 1000) { // More than 7 days average gap
                        opportunities.push('Consider adding intermediate milestones for better tracking');
                    }
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                totalTasks: tasks.length,
                                issues,
                                opportunities,
                                timeline: tasks.map(t => ({
                                    name: t.name,
                                    dueDate: t.due_date,
                                    status: t.status
                                }))
                            }, null, 2)
                        }
                    ]
                };
            }
            case 'orchestrate_campaign_execution': {
                const { campaignId, action } = args;
                let updateQuery;
                let statusMessage;
                switch (action) {
                    case 'start':
                        updateQuery = `
              UPDATE campaigns 
              SET status = 'active', start_date = NOW() 
              WHERE id = $1 AND user_id = $2
              RETURNING name, status
            `;
                        statusMessage = 'Campaign started';
                        break;
                    case 'pause':
                        updateQuery = `
              UPDATE campaigns 
              SET status = 'paused' 
              WHERE id = $1 AND user_id = $2
              RETURNING name, status
            `;
                        statusMessage = 'Campaign paused';
                        break;
                    case 'resume':
                        updateQuery = `
              UPDATE campaigns 
              SET status = 'active' 
              WHERE id = $1 AND user_id = $2
              RETURNING name, status
            `;
                        statusMessage = 'Campaign resumed';
                        break;
                    case 'complete':
                        updateQuery = `
              UPDATE campaigns 
              SET status = 'completed', end_date = NOW() 
              WHERE id = $1 AND user_id = $2
              RETURNING name, status
            `;
                        statusMessage = 'Campaign completed';
                        break;
                    default:
                        throw new Error(`Unknown action: ${action}`);
                }
                const result = await pool.query(updateQuery, [campaignId, 'demo-user']);
                if (result.rowCount === 0) {
                    throw new Error('Campaign not found');
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: `${statusMessage}: ${result.rows[0].name}\nStatus: ${result.rows[0].status}`
                        }
                    ]
                };
            }
            case 'generate_campaign_report': {
                const { campaignId, reportType = 'summary' } = args;
                // Get campaign details
                const campaignQuery = `
          SELECT * FROM campaigns 
          WHERE id = $1 AND user_id = $2
        `;
                const campaignResult = await pool.query(campaignQuery, [campaignId, 'demo-user']);
                if (campaignResult.rowCount === 0) {
                    throw new Error('Campaign not found');
                }
                const campaign = campaignResult.rows[0];
                // Get tasks summary
                const tasksQuery = `
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
          FROM campaign_tasks
          WHERE campaign_id = $1
        `;
                const tasksResult = await pool.query(tasksQuery, [campaignId]);
                const tasksSummary = tasksResult.rows[0];
                const report = {
                    campaign: {
                        name: campaign.name,
                        status: campaign.status,
                        startDate: campaign.start_date,
                        endDate: campaign.end_date,
                        objectives: JSON.parse(campaign.objectives || '[]')
                    },
                    metrics: {
                        totalTasks: tasksSummary.total,
                        completedTasks: tasksSummary.completed,
                        inProgressTasks: tasksSummary.in_progress,
                        pendingTasks: tasksSummary.pending,
                        completionRate: tasksSummary.total > 0
                            ? Math.round((tasksSummary.completed / tasksSummary.total) * 100)
                            : 0
                    },
                    reportType,
                    generatedAt: new Date().toISOString()
                };
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(report, null, 2)
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
    console.log('Starting SignalDesk Campaigns MCP Server...');
    // Test database connection
    try {
        await pool.query('SELECT 1');
        console.log('Database connected successfully');
    }
    catch (error) {
        console.error('Database connection failed:', error);
        console.log('Server will continue but database operations will fail');
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('SignalDesk Campaigns MCP Server is running');
}
main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map