import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.16.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Campaign management tools
const TOOLS = [
  {
    name: "create_campaign",
    description: "Create a new PR campaign with timeline and objectives",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Campaign name" },
        objectives: { type: "array", items: { type: "string" }, description: "Campaign objectives" },
        startDate: { type: "string", description: "Start date (ISO format)" },
        endDate: { type: "string", description: "End date (ISO format)" },
        targetAudience: { type: "string", description: "Target audience" },
        budget: { type: "number", description: "Campaign budget" }
      },
      required: ["name", "objectives"]
    }
  },
  {
    name: "add_campaign_task",
    description: "Add a task or milestone to a campaign",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" },
        taskName: { type: "string", description: "Task name" },
        description: { type: "string", description: "Task description" },
        dueDate: { type: "string", description: "Due date (ISO format)" },
        assignee: { type: "string", description: "Assignee" },
        dependencies: { type: "array", items: { type: "string" }, description: "Task dependencies" }
      },
      required: ["campaignId", "taskName"]
    }
  },
  {
    name: "get_campaign_status",
    description: "Get status and progress of campaigns",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID (optional)" }
      }
    }
  },
  {
    name: "analyze_campaign_timeline",
    description: "Analyze campaign timeline for issues and optimizations",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" }
      },
      required: ["campaignId"]
    }
  },
  {
    name: "orchestrate_campaign_execution",
    description: "Orchestrate campaign execution and status transitions",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" },
        action: { 
          type: "string", 
          enum: ["start", "pause", "resume", "complete", "cancel"],
          description: "Action to perform" 
        }
      },
      required: ["campaignId", "action"]
    }
  },
  {
    name: "generate_campaign_report",
    description: "Generate comprehensive campaign report",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" },
        includeMetrics: { 
          type: "array", 
          items: { type: "string" },
          description: "Metrics to include",
          default: ["progress", "timeline", "tasks", "budget"]
        }
      },
      required: ["campaignId"]
    }
  }
];

// Tool implementations
async function createCampaign(args: any) {
  const { name, objectives = [], startDate, endDate, targetAudience = '', budget = 0 } = args;
  
  // Create campaign in database
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      name,
      objectives: JSON.stringify(objectives),
      start_date: startDate || new Date().toISOString(),
      end_date: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      target_audience: targetAudience,
      budget,
      status: 'planning',
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    campaignId: data.id,
    name: data.name,
    status: data.status,
    message: `Campaign "${name}" created successfully`
  };
}

async function addCampaignTask(args: any) {
  const { campaignId, taskName, description = '', dueDate, assignee = '', dependencies = [] } = args;
  
  const { data, error } = await supabase
    .from('campaign_tasks')
    .insert({
      campaign_id: campaignId,
      name: taskName,
      description,
      due_date: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignee,
      dependencies: JSON.stringify(dependencies),
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    taskId: data.id,
    taskName: data.name,
    dueDate: data.due_date,
    message: `Task "${taskName}" added to campaign`
  };
}

async function getCampaignStatus(args: any) {
  const { campaignId } = args;
  
  if (campaignId) {
    // Get specific campaign
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*, campaign_tasks(*)')
      .eq('id', campaignId)
      .single();
    
    if (error) throw error;
    
    const totalTasks = campaign.campaign_tasks?.length || 0;
    const completedTasks = campaign.campaign_tasks?.filter((t: any) => t.status === 'completed').length || 0;
    
    return {
      ...campaign,
      progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalTasks,
      completedTasks
    };
  } else {
    // Get all campaigns
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*, campaign_tasks(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return campaigns.map((campaign: any) => {
      const totalTasks = campaign.campaign_tasks?.length || 0;
      const completedTasks = campaign.campaign_tasks?.filter((t: any) => t.status === 'completed').length || 0;
      
      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        startDate: campaign.start_date,
        endDate: campaign.end_date
      };
    });
  }
}

async function analyzeCampaignTimeline(args: any) {
  const { campaignId } = args;
  
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*, campaign_tasks(*)')
    .eq('id', campaignId)
    .single();
  
  if (error) throw error;
  
  const tasks = campaign.campaign_tasks || [];
  const issues: string[] = [];
  const opportunities: string[] = [];
  
  // Check for overdue tasks
  const now = new Date();
  tasks.forEach((task: any) => {
    if (task.status !== 'completed' && new Date(task.due_date) < now) {
      issues.push(`Task "${task.name}" is overdue`);
    }
  });
  
  // Check for dependency conflicts
  tasks.forEach((task: any) => {
    if (task.dependencies && task.dependencies.length > 0) {
      const deps = JSON.parse(task.dependencies);
      deps.forEach((depId: string) => {
        const depTask = tasks.find((t: any) => t.id === depId);
        if (depTask && new Date(depTask.due_date) > new Date(task.due_date)) {
          issues.push(`Task "${task.name}" depends on "${depTask.name}" but is scheduled earlier`);
        }
      });
    }
  });
  
  // Identify opportunities
  if (tasks.length === 0) {
    opportunities.push('Add tasks to track campaign progress');
  } else if (tasks.length < 5) {
    opportunities.push('Consider breaking down tasks into smaller milestones');
  }
  
  return {
    campaignId,
    totalTasks: tasks.length,
    issues,
    opportunities,
    timeline: tasks.map((t: any) => ({
      name: t.name,
      dueDate: t.due_date,
      status: t.status,
      assignee: t.assignee
    }))
  };
}

async function orchestrateCampaignExecution(args: any) {
  const { campaignId, action } = args;
  
  let newStatus;
  switch (action) {
    case 'start':
      newStatus = 'active';
      break;
    case 'pause':
      newStatus = 'paused';
      break;
    case 'resume':
      newStatus = 'active';
      break;
    case 'complete':
      newStatus = 'completed';
      break;
    case 'cancel':
      newStatus = 'cancelled';
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
  
  const { data, error } = await supabase
    .from('campaigns')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', campaignId)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    campaignId: data.id,
    name: data.name,
    status: data.status,
    message: `Campaign ${action}ed successfully`
  };
}

async function generateCampaignReport(args: any) {
  const { campaignId, includeMetrics = ['progress', 'timeline', 'tasks', 'budget'] } = args;
  
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*, campaign_tasks(*)')
    .eq('id', campaignId)
    .single();
  
  if (error) throw error;
  
  const report: any = {
    campaignId: campaign.id,
    name: campaign.name,
    status: campaign.status
  };
  
  if (includeMetrics.includes('progress')) {
    const totalTasks = campaign.campaign_tasks?.length || 0;
    const completedTasks = campaign.campaign_tasks?.filter((t: any) => t.status === 'completed').length || 0;
    report.progress = {
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      completedTasks,
      totalTasks
    };
  }
  
  if (includeMetrics.includes('timeline')) {
    report.timeline = {
      startDate: campaign.start_date,
      endDate: campaign.end_date,
      daysRemaining: Math.ceil((new Date(campaign.end_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    };
  }
  
  if (includeMetrics.includes('tasks')) {
    report.tasks = {
      total: campaign.campaign_tasks?.length || 0,
      byStatus: {
        pending: campaign.campaign_tasks?.filter((t: any) => t.status === 'pending').length || 0,
        inProgress: campaign.campaign_tasks?.filter((t: any) => t.status === 'in_progress').length || 0,
        completed: campaign.campaign_tasks?.filter((t: any) => t.status === 'completed').length || 0
      }
    };
  }
  
  if (includeMetrics.includes('budget')) {
    report.budget = {
      allocated: campaign.budget || 0,
      spent: 0, // Would need expense tracking
      remaining: campaign.budget || 0
    };
  }
  
  return report;
}

// HTTP handler
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { tool, arguments: args } = await req.json();
    
    if (tool === 'list_tools') {
      return new Response(
        JSON.stringify({ tools: TOOLS, success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    let result;
    switch(tool) {
      case 'create_campaign':
        result = await createCampaign(args);
        break;
      case 'add_campaign_task':
        result = await addCampaignTask(args);
        break;
      case 'get_campaign_status':
        result = await getCampaignStatus(args);
        break;
      case 'analyze_campaign_timeline':
        result = await analyzeCampaignTimeline(args);
        break;
      case 'orchestrate_campaign_execution':
        result = await orchestrateCampaignExecution(args);
        break;
      case 'generate_campaign_report':
        result = await generateCampaignReport(args);
        break;
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
    
    return new Response(
      JSON.stringify({ ...result, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('MCP Campaigns Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});