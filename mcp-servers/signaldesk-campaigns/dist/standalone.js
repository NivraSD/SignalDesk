/**
 * SignalDesk Campaigns MCP Server - Standalone Version
 * No database dependencies - works purely in memory
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
// Create MCP server
const server = new Server({
    name: 'signaldesk-campaigns',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// In-memory storage
const campaigns = new Map();
const tasks = new Map();
let campaignIdCounter = 1;
let taskIdCounter = 1;
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
                const campaignId = `campaign_${campaignIdCounter++}`;
                const campaign = {
                    id: campaignId,
                    name: campaignName,
                    objectives: objectives,
                    start_date: startDate || new Date().toISOString(),
                    end_date: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    target_audience: targetAudience || '',
                    budget: budget || 0,
                    status: 'planning',
                    created_at: new Date().toISOString()
                };
                campaigns.set(campaignId, campaign);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Campaign created successfully:\n${JSON.stringify({
                                id: campaign.id,
                                name: campaign.name,
                                status: campaign.status,
                                created_at: campaign.created_at
                            }, null, 2)}`
                        }
                    ]
                };
            }
            case 'add_campaign_task': {
                const { campaignId, taskName, description, dueDate, assignee, dependencies = [] } = args;
                if (!campaigns.has(campaignId)) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Campaign ${campaignId} not found`
                            }
                        ]
                    };
                }
                const taskId = `task_${taskIdCounter++}`;
                const task = {
                    id: taskId,
                    campaign_id: campaignId,
                    name: taskName,
                    description: description || '',
                    due_date: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    assignee: assignee || '',
                    dependencies: dependencies,
                    status: 'pending',
                    created_at: new Date().toISOString()
                };
                tasks.set(taskId, task);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Task added to campaign:\n${JSON.stringify({
                                id: task.id,
                                name: task.name,
                                status: task.status,
                                due_date: task.due_date
                            }, null, 2)}`
                        }
                    ]
                };
            }
            case 'get_campaign_status': {
                const { campaignId } = args;
                if (campaignId) {
                    const campaign = campaigns.get(campaignId);
                    if (!campaign) {
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `Campaign ${campaignId} not found`
                                }
                            ]
                        };
                    }
                    // Count tasks for this campaign
                    let totalTasks = 0;
                    let completedTasks = 0;
                    let inProgressTasks = 0;
                    tasks.forEach(task => {
                        if (task.campaign_id === campaignId) {
                            totalTasks++;
                            if (task.status === 'completed')
                                completedTasks++;
                            if (task.status === 'in_progress')
                                inProgressTasks++;
                        }
                    });
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    ...campaign,
                                    total_tasks: totalTasks,
                                    completed_tasks: completedTasks,
                                    in_progress_tasks: inProgressTasks,
                                    progress: progress
                                }, null, 2)
                            }
                        ]
                    };
                }
                else {
                    // Return all campaigns
                    const allCampaigns = Array.from(campaigns.values()).map(campaign => {
                        let totalTasks = 0;
                        let completedTasks = 0;
                        tasks.forEach(task => {
                            if (task.campaign_id === campaign.id) {
                                totalTasks++;
                                if (task.status === 'completed')
                                    completedTasks++;
                            }
                        });
                        return {
                            ...campaign,
                            total_tasks: totalTasks,
                            completed_tasks: completedTasks,
                            progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
                        };
                    });
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(allCampaigns, null, 2)
                            }
                        ]
                    };
                }
            }
            case 'generate_campaign_report': {
                const { campaignId, reportType = 'summary' } = args;
                const campaign = campaigns.get(campaignId);
                if (!campaign) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Campaign ${campaignId} not found`
                            }
                        ]
                    };
                }
                // Count tasks
                let totalTasks = 0;
                let completedTasks = 0;
                let inProgressTasks = 0;
                let pendingTasks = 0;
                tasks.forEach(task => {
                    if (task.campaign_id === campaignId) {
                        totalTasks++;
                        if (task.status === 'completed')
                            completedTasks++;
                        else if (task.status === 'in_progress')
                            inProgressTasks++;
                        else if (task.status === 'pending')
                            pendingTasks++;
                    }
                });
                const report = {
                    campaign: {
                        name: campaign.name,
                        status: campaign.status,
                        startDate: campaign.start_date,
                        endDate: campaign.end_date,
                        objectives: campaign.objectives
                    },
                    metrics: {
                        totalTasks: totalTasks,
                        completedTasks: completedTasks,
                        inProgressTasks: inProgressTasks,
                        pendingTasks: pendingTasks,
                        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
                    },
                    reportType: reportType,
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
    console.error('Starting SignalDesk Campaigns MCP Server (Standalone)...');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('SignalDesk Campaigns MCP Server is running');
}
main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=standalone.js.map