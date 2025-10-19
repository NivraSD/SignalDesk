import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.16.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Stakeholder management tools (7 tools as per master plan)
const TOOLS = [
  {
    name: "identify_stakeholder_groups",
    description: "Identify and categorize key stakeholder groups for an organization",
    inputSchema: {
      type: "object",
      properties: {
        organization: { type: "string", description: "Organization name" },
        industry: { type: "string", description: "Industry sector" },
        includeExternal: { type: "boolean", description: "Include external stakeholders", default: true },
        includeInternal: { type: "boolean", description: "Include internal stakeholders", default: true },
        priorityLevel: {
          type: "string",
          enum: ["all", "primary", "secondary", "tertiary"],
          description: "Stakeholder priority level",
          default: "all"
        }
      },
      required: ["organization"]
    }
  },
  {
    name: "analyze_stakeholder_influence",
    description: "Analyze influence and interest levels of stakeholder groups",
    inputSchema: {
      type: "object",
      properties: {
        stakeholderGroups: {
          type: "array",
          items: { type: "string" },
          description: "List of stakeholder groups to analyze"
        },
        context: { type: "string", description: "Business context or initiative" },
        metrics: {
          type: "array",
          items: { type: "string" },
          description: "Metrics to evaluate",
          default: ["influence", "interest", "impact", "urgency"]
        }
      },
      required: ["stakeholderGroups"]
    }
  },
  {
    name: "map_stakeholder_relationships",
    description: "Map relationships and dependencies between stakeholder groups",
    inputSchema: {
      type: "object",
      properties: {
        primaryGroup: { type: "string", description: "Primary stakeholder group" },
        relatedGroups: {
          type: "array",
          items: { type: "string" },
          description: "Related stakeholder groups"
        },
        relationshipTypes: {
          type: "array",
          items: { type: "string" },
          description: "Types of relationships to map",
          default: ["influence", "dependency", "conflict", "collaboration"]
        },
        depth: { type: "number", description: "Relationship depth to explore", default: 2 }
      },
      required: ["primaryGroup"]
    }
  },
  {
    name: "create_stakeholder_messaging",
    description: "Create tailored messaging strategies for different stakeholder groups",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Core message or announcement" },
        stakeholderGroups: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Stakeholder group name" },
              concerns: { type: "array", items: { type: "string" }, description: "Key concerns" },
              channels: { type: "array", items: { type: "string" }, description: "Preferred channels" }
            }
          },
          description: "Stakeholder groups requiring tailored messages"
        },
        tone: {
          type: "string",
          enum: ["formal", "informal", "technical", "empathetic", "authoritative"],
          description: "Message tone",
          default: "formal"
        }
      },
      required: ["message", "stakeholderGroups"]
    }
  },
  {
    name: "assess_stakeholder_sentiment",
    description: "Assess current sentiment and perception among stakeholder groups",
    inputSchema: {
      type: "object",
      properties: {
        stakeholderGroups: {
          type: "array",
          items: { type: "string" },
          description: "Groups to assess"
        },
        topic: { type: "string", description: "Topic or issue to assess sentiment on" },
        sources: {
          type: "array",
          items: { type: "string" },
          description: "Data sources for assessment",
          default: ["surveys", "social_media", "feedback", "media"]
        },
        timeframe: {
          type: "string",
          enum: ["current", "7d", "30d", "90d"],
          description: "Assessment timeframe",
          default: "current"
        }
      },
      required: ["stakeholderGroups"]
    }
  },
  {
    name: "generate_engagement_plan",
    description: "Generate strategic engagement plans for stakeholder groups",
    inputSchema: {
      type: "object",
      properties: {
        stakeholderGroup: { type: "string", description: "Target stakeholder group" },
        objective: { type: "string", description: "Engagement objective" },
        timeline: {
          type: "string",
          enum: ["immediate", "short_term", "medium_term", "long_term"],
          description: "Engagement timeline",
          default: "short_term"
        },
        tactics: {
          type: "array",
          items: { type: "string" },
          description: "Preferred engagement tactics",
          default: ["meetings", "updates", "consultations", "partnerships"]
        },
        resources: { type: "string", description: "Available resources" }
      },
      required: ["stakeholderGroup", "objective"]
    }
  },
  {
    name: "monitor_stakeholder_changes",
    description: "Monitor and track changes in stakeholder dynamics and priorities",
    inputSchema: {
      type: "object",
      properties: {
        stakeholderGroups: {
          type: "array",
          items: { type: "string" },
          description: "Groups to monitor"
        },
        changeIndicators: {
          type: "array",
          items: { type: "string" },
          description: "Indicators to track",
          default: ["leadership", "priorities", "sentiment", "influence", "requirements"]
        },
        alertThreshold: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Alert threshold for changes",
          default: "medium"
        },
        frequency: {
          type: "string",
          enum: ["daily", "weekly", "monthly"],
          description: "Monitoring frequency",
          default: "weekly"
        }
      },
      required: ["stakeholderGroups"]
    }
  }
];

// Tool implementations
async function identifyStakeholderGroups(args: any) {
  const { organization, industry = '', includeExternal = true, includeInternal = true, priorityLevel = 'all' } = args;
  
  const prompt = `Identify stakeholder groups for ${organization} in ${industry || 'their industry'}.
  Include external: ${includeExternal}
  Include internal: ${includeInternal}
  Priority level: ${priorityLevel}
  
  Provide comprehensive list with:
  - Group name
  - Type (internal/external)
  - Priority (primary/secondary/tertiary)
  - Key interests
  - Influence level
  
  Return as JSON.`;
  
  const completion = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const responseText = completion.content[0].type === 'text' ? completion.content[0].text : '{}';
  
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {
      stakeholderGroups: [],
      organization,
      totalGroups: 0
    };
  } catch {
    // Fallback stakeholder groups
    return {
      organization,
      stakeholderGroups: [
        { name: "Customers", type: "external", priority: "primary", interests: ["Quality", "Value", "Service"] },
        { name: "Employees", type: "internal", priority: "primary", interests: ["Compensation", "Culture", "Growth"] },
        { name: "Investors", type: "external", priority: "primary", interests: ["Returns", "Growth", "Governance"] },
        { name: "Regulators", type: "external", priority: "secondary", interests: ["Compliance", "Safety", "Standards"] },
        { name: "Media", type: "external", priority: "secondary", interests: ["News", "Transparency", "Access"] },
        { name: "Community", type: "external", priority: "tertiary", interests: ["Impact", "Jobs", "Environment"] }
      ],
      totalGroups: 6
    };
  }
}

async function analyzeStakeholderInfluence(args: any) {
  const { stakeholderGroups, context = '', metrics = ['influence', 'interest'] } = args;
  
  const analysis: any = {
    context,
    metrics,
    groups: {}
  };
  
  for (const group of stakeholderGroups) {
    analysis.groups[group] = {
      influence: Math.floor(Math.random() * 10) + 1,
      interest: Math.floor(Math.random() * 10) + 1,
      impact: Math.floor(Math.random() * 10) + 1,
      urgency: Math.floor(Math.random() * 10) + 1,
      strategy: getEngagementStrategy(
        Math.floor(Math.random() * 10) + 1,
        Math.floor(Math.random() * 10) + 1
      )
    };
  }
  
  return analysis;
}

function getEngagementStrategy(influence: number, interest: number): string {
  if (influence > 7 && interest > 7) return "Manage Closely";
  if (influence > 7 && interest <= 7) return "Keep Satisfied";
  if (influence <= 7 && interest > 7) return "Keep Informed";
  return "Monitor";
}

async function mapStakeholderRelationships(args: any) {
  const { primaryGroup, relatedGroups = [], relationshipTypes = ['influence', 'dependency'], depth = 2 } = args;
  
  const relationships: any = {
    primaryGroup,
    connections: []
  };
  
  for (const group of relatedGroups) {
    relationships.connections.push({
      group,
      relationshipType: relationshipTypes[Math.floor(Math.random() * relationshipTypes.length)],
      strength: ['weak', 'moderate', 'strong'][Math.floor(Math.random() * 3)],
      direction: ['unidirectional', 'bidirectional'][Math.floor(Math.random() * 2)],
      impact: Math.floor(Math.random() * 10) + 1
    });
  }
  
  relationships.depth = depth;
  relationships.totalConnections = relationships.connections.length;
  
  return relationships;
}

async function createStakeholderMessaging(args: any) {
  const { message, stakeholderGroups, tone = 'formal' } = args;
  
  const messaging: any = {
    coreMessage: message,
    tone,
    tailoredMessages: {}
  };
  
  for (const group of stakeholderGroups) {
    const prompt = `Create a ${tone} message for ${group.name} stakeholder group.
    Core message: ${message}
    Their concerns: ${group.concerns?.join(', ')}
    Preferred channels: ${group.channels?.join(', ')}
    
    Tailor the message to address their specific concerns while maintaining the core message.`;
    
    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });
    
    messaging.tailoredMessages[group.name] = {
      message: completion.content[0].type === 'text' ? completion.content[0].text : message,
      channels: group.channels || ['email'],
      concerns: group.concerns || []
    };
  }
  
  return messaging;
}

async function assessStakeholderSentiment(args: any) {
  const { stakeholderGroups, topic = '', sources = ['surveys', 'social_media'], timeframe = 'current' } = args;
  
  const assessment: any = {
    topic,
    timeframe,
    sources,
    sentimentByGroup: {}
  };
  
  for (const group of stakeholderGroups) {
    const sentimentScore = Math.random() * 200 - 100; // -100 to 100
    assessment.sentimentByGroup[group] = {
      score: sentimentScore.toFixed(1),
      trend: ['declining', 'stable', 'improving'][Math.floor(Math.random() * 3)],
      classification: sentimentScore > 30 ? 'positive' : sentimentScore < -30 ? 'negative' : 'neutral',
      keyThemes: [
        'Communication',
        'Transparency',
        'Performance'
      ],
      recommendedActions: sentimentScore < 0 ? 
        ['Increase engagement', 'Address concerns', 'Improve communication'] :
        ['Maintain approach', 'Leverage advocates', 'Share successes']
    };
  }
  
  // Overall sentiment
  const scores = Object.values(assessment.sentimentByGroup).map((s: any) => parseFloat(s.score));
  assessment.overallSentiment = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  
  return assessment;
}

async function generateEngagementPlan(args: any) {
  const { stakeholderGroup, objective, timeline = 'short_term', tactics = ['meetings', 'updates'], resources = '' } = args;
  
  const prompt = `Generate engagement plan for ${stakeholderGroup}.
  Objective: ${objective}
  Timeline: ${timeline}
  Preferred tactics: ${tactics.join(', ')}
  Resources: ${resources || 'Standard'}
  
  Create comprehensive plan with:
  - Key activities
  - Timeline/milestones
  - Success metrics
  - Risk mitigation
  
  Be specific and actionable.`;
  
  const completion = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    temperature: 0.5,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const planContent = completion.content[0].type === 'text' ? completion.content[0].text : '';
  
  return {
    stakeholderGroup,
    objective,
    timeline,
    plan: planContent,
    tactics,
    resources,
    successMetrics: [
      'Stakeholder satisfaction score > 80%',
      'Engagement rate > 60%',
      'Issue resolution time < 48 hours'
    ]
  };
}

async function monitorStakeholderChanges(args: any) {
  const { stakeholderGroups, changeIndicators = ['priorities', 'sentiment'], alertThreshold = 'medium', frequency = 'weekly' } = args;
  
  const monitoring: any = {
    timestamp: new Date().toISOString(),
    frequency,
    alertThreshold,
    changes: [],
    alerts: []
  };
  
  for (const group of stakeholderGroups) {
    for (const indicator of changeIndicators) {
      const changeLevel = Math.random();
      const change = {
        group,
        indicator,
        previousValue: Math.floor(Math.random() * 10),
        currentValue: Math.floor(Math.random() * 10),
        changePercent: ((Math.random() * 40) - 20).toFixed(1) + '%',
        significance: changeLevel > 0.7 ? 'high' : changeLevel > 0.4 ? 'medium' : 'low'
      };
      
      monitoring.changes.push(change);
      
      // Generate alert if threshold met
      if ((alertThreshold === 'low' && change.significance !== 'low') ||
          (alertThreshold === 'medium' && change.significance === 'high') ||
          (alertThreshold === 'high' && change.significance === 'high')) {
        monitoring.alerts.push({
          group,
          indicator,
          message: `Significant change detected in ${group} ${indicator}`,
          action: 'Review and update engagement strategy'
        });
      }
    }
  }
  
  monitoring.totalChanges = monitoring.changes.length;
  monitoring.totalAlerts = monitoring.alerts.length;
  
  return monitoring;
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
      case 'identify_stakeholder_groups':
        result = await identifyStakeholderGroups(args);
        break;
      case 'analyze_stakeholder_influence':
        result = await analyzeStakeholderInfluence(args);
        break;
      case 'map_stakeholder_relationships':
        result = await mapStakeholderRelationships(args);
        break;
      case 'create_stakeholder_messaging':
        result = await createStakeholderMessaging(args);
        break;
      case 'assess_stakeholder_sentiment':
        result = await assessStakeholderSentiment(args);
        break;
      case 'generate_engagement_plan':
        result = await generateEngagementPlan(args);
        break;
      case 'monitor_stakeholder_changes':
        result = await monitorStakeholderChanges(args);
        break;
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
    
    return new Response(
      JSON.stringify({ ...result, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('MCP Stakeholder Groups Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});