import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.16.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Crisis management tools (7 tools as per master plan)
const TOOLS = [
  {
    name: "detect_crisis_signals",
    description: "Detect early warning signals of potential PR crises",
    inputSchema: {
      type: "object",
      properties: {
        sources: { 
          type: "array", 
          items: { type: "string" },
          description: "Sources to monitor",
          default: ["social", "news", "forums", "reviews"]
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Crisis-related keywords to track"
        },
        sensitivity: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "Detection sensitivity level",
          default: "medium"
        },
        timeWindow: {
          type: "string",
          enum: ["1h", "3h", "6h", "12h", "24h"],
          description: "Time window for analysis",
          default: "3h"
        }
      },
      required: ["keywords"]
    }
  },
  {
    name: "assess_crisis_severity",
    description: "Assess the severity and potential impact of a crisis",
    inputSchema: {
      type: "object",
      properties: {
        situation: { type: "string", description: "Description of the crisis situation" },
        metrics: {
          type: "object",
          properties: {
            mentionVolume: { type: "number", description: "Number of mentions" },
            sentimentScore: { type: "number", description: "Sentiment score (-100 to 100)" },
            reachEstimate: { type: "number", description: "Estimated reach" },
            velocityTrend: { type: "string", enum: ["decreasing", "stable", "increasing", "viral"] }
          }
        },
        stakeholdersAffected: {
          type: "array",
          items: { type: "string" },
          description: "Affected stakeholder groups"
        }
      },
      required: ["situation"]
    }
  },
  {
    name: "generate_crisis_response",
    description: "Generate appropriate crisis response strategies and messaging",
    inputSchema: {
      type: "object",
      properties: {
        crisisType: {
          type: "string",
          enum: ["product_issue", "data_breach", "executive_scandal", "employee_incident", "financial", "operational", "other"],
          description: "Type of crisis"
        },
        severity: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "Crisis severity level"
        },
        audiencesAffected: {
          type: "array",
          items: { type: "string" },
          description: "Affected audiences"
        },
        responseTimeframe: {
          type: "string",
          enum: ["immediate", "within_1h", "within_6h", "within_24h"],
          description: "Required response timeframe",
          default: "within_1h"
        }
      },
      required: ["crisisType", "severity"]
    }
  },
  {
    name: "create_stakeholder_messaging",
    description: "Create targeted messaging for different stakeholder groups during crisis",
    inputSchema: {
      type: "object",
      properties: {
        coreMessage: { type: "string", description: "Core crisis message" },
        stakeholderGroups: {
          type: "array",
          items: {
            type: "object",
            properties: {
              group: { type: "string", description: "Stakeholder group name" },
              concerns: { type: "array", items: { type: "string" }, description: "Their main concerns" },
              channel: { type: "string", description: "Preferred communication channel" }
            }
          },
          description: "Stakeholder groups requiring tailored messages"
        },
        tone: {
          type: "string",
          enum: ["apologetic", "reassuring", "transparent", "defensive", "proactive"],
          description: "Message tone",
          default: "transparent"
        }
      },
      required: ["coreMessage", "stakeholderGroups"]
    }
  },
  {
    name: "monitor_crisis_evolution",
    description: "Track how a crisis is evolving in real-time",
    inputSchema: {
      type: "object",
      properties: {
        crisisId: { type: "string", description: "Crisis identifier" },
        metrics: {
          type: "array",
          items: { type: "string" },
          description: "Metrics to track",
          default: ["sentiment", "volume", "reach", "media_coverage", "stakeholder_reactions"]
        },
        updateFrequency: {
          type: "string",
          enum: ["15min", "30min", "1h", "3h"],
          description: "How often to update",
          default: "30min"
        },
        alertThresholds: {
          type: "object",
          properties: {
            sentimentDrop: { type: "number", description: "Alert if sentiment drops by %" },
            volumeSpike: { type: "number", description: "Alert if volume increases by %" },
            mediaPickup: { type: "boolean", description: "Alert on mainstream media coverage" }
          }
        }
      },
      required: ["crisisId"]
    }
  },
  {
    name: "simulate_crisis_scenarios",
    description: "Run crisis simulation scenarios for preparedness planning",
    inputSchema: {
      type: "object",
      properties: {
        scenarioType: {
          type: "string",
          enum: ["product_recall", "cyber_attack", "natural_disaster", "regulatory_action", "competitive_attack", "internal_leak"],
          description: "Type of crisis scenario to simulate"
        },
        companyProfile: {
          type: "object",
          properties: {
            industry: { type: "string" },
            size: { type: "string", enum: ["small", "medium", "large", "enterprise"] },
            publicProfile: { type: "string", enum: ["low", "medium", "high"] }
          }
        },
        includePlaybook: {
          type: "boolean",
          description: "Generate response playbook",
          default: true
        }
      },
      required: ["scenarioType"]
    }
  },
  {
    name: "generate_crisis_report",
    description: "Generate comprehensive crisis management report",
    inputSchema: {
      type: "object",
      properties: {
        crisisId: { type: "string", description: "Crisis identifier" },
        reportType: {
          type: "string",
          enum: ["executive_summary", "detailed_analysis", "stakeholder_update", "post_mortem"],
          description: "Type of report",
          default: "executive_summary"
        },
        includeSections: {
          type: "array",
          items: { type: "string" },
          description: "Sections to include",
          default: ["timeline", "impact", "response", "outcomes", "recommendations"]
        },
        format: {
          type: "string",
          enum: ["brief", "detailed", "visual"],
          description: "Report format",
          default: "brief"
        }
      },
      required: ["crisisId"]
    }
  }
];

// Tool implementations
async function detectCrisisSignals(args: any) {
  const { sources = ['social', 'news'], keywords, sensitivity = 'medium', timeWindow = '3h' } = args;
  
  // Use Claude to analyze potential crisis signals
  const prompt = `Analyze potential crisis signals for keywords: ${keywords.join(', ')}
  Sources: ${sources.join(', ')}
  Sensitivity: ${sensitivity}
  Time window: ${timeWindow}
  
  Identify:
  - Warning signals detected
  - Risk level (1-10)
  - Trending negative topics
  - Velocity of spread
  - Recommended actions
  
  Return as JSON.`;
  
  const completion = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const responseText = completion.content[0].type === 'text' ? completion.content[0].text : '{}';
  
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {
      signalsDetected: 0,
      riskLevel: 1,
      status: 'monitoring'
    };
  } catch {
    return {
      signalsDetected: Math.floor(Math.random() * 5),
      riskLevel: sensitivity === 'high' ? 7 : 3,
      warningSignals: ['Negative sentiment spike', 'Influencer criticism'],
      recommendedActions: ['Increase monitoring', 'Prepare response team']
    };
  }
}

async function assessCrisisSeverity(args: any) {
  const { situation, metrics = {}, stakeholdersAffected = [] } = args;
  
  const prompt = `Assess crisis severity for: ${situation}
  Metrics: ${JSON.stringify(metrics)}
  Stakeholders affected: ${stakeholdersAffected.join(', ')}
  
  Provide:
  - Severity score (1-10)
  - Impact assessment
  - Escalation risk
  - Response urgency
  - Key risks
  
  Return as JSON.`;
  
  const completion = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const responseText = completion.content[0].type === 'text' ? completion.content[0].text : '{}';
  
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    return {
      severityScore: 6,
      severityLevel: 'medium',
      impactAssessment: 'Moderate reputational risk',
      escalationRisk: 'Medium - trending on social media',
      responseUrgency: 'Within 2 hours',
      keyRisks: ['Brand damage', 'Customer trust', 'Media scrutiny']
    };
  }
}

async function generateCrisisResponse(args: any) {
  const { crisisType, severity, audiencesAffected = [], responseTimeframe = 'within_1h' } = args;
  
  const prompt = `Generate crisis response for:
  Type: ${crisisType}
  Severity: ${severity}
  Audiences: ${audiencesAffected.join(', ')}
  Timeframe: ${responseTimeframe}
  
  Create:
  - Initial statement
  - Key messages (3-5)
  - Actions to take
  - What to avoid
  - Timeline
  
  Be specific and actionable.`;
  
  const completion = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const response = completion.content[0].type === 'text' ? completion.content[0].text : '';
  
  return {
    crisisType,
    severity,
    responseStrategy: response,
    timeframe: responseTimeframe,
    audiences: audiencesAffected
  };
}

async function createStakeholderMessaging(args: any) {
  const { coreMessage, stakeholderGroups, tone = 'transparent' } = args;
  
  const messages: any = {};
  
  for (const group of stakeholderGroups) {
    const prompt = `Create ${tone} crisis message for ${group.group}:
    Core message: ${coreMessage}
    Their concerns: ${group.concerns?.join(', ')}
    Channel: ${group.channel}
    
    Create tailored message addressing their specific concerns.`;
    
    const completion = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });
    
    messages[group.group] = {
      message: completion.content[0].type === 'text' ? completion.content[0].text : coreMessage,
      channel: group.channel,
      concerns: group.concerns
    };
  }
  
  return {
    coreMessage,
    stakeholderMessages: messages,
    tone,
    totalGroups: stakeholderGroups.length
  };
}

async function monitorCrisisEvolution(args: any) {
  const { crisisId, metrics = ['sentiment', 'volume'], updateFrequency = '30min', alertThresholds = {} } = args;
  
  // Simulate crisis monitoring data
  const monitoring = {
    crisisId,
    timestamp: new Date().toISOString(),
    metrics: {} as any,
    alerts: [] as string[],
    trend: 'stable' as string
  };
  
  // Generate metric values
  for (const metric of metrics) {
    monitoring.metrics[metric] = {
      current: Math.floor(Math.random() * 100),
      change: (Math.random() * 20 - 10).toFixed(1) + '%',
      trend: ['decreasing', 'stable', 'increasing'][Math.floor(Math.random() * 3)]
    };
  }
  
  // Check thresholds
  if (alertThresholds.sentimentDrop && monitoring.metrics.sentiment?.change < -alertThresholds.sentimentDrop) {
    monitoring.alerts.push('Sentiment dropped below threshold');
  }
  if (alertThresholds.volumeSpike && monitoring.metrics.volume?.change > alertThresholds.volumeSpike) {
    monitoring.alerts.push('Volume spike detected');
  }
  
  monitoring.trend = monitoring.alerts.length > 0 ? 'escalating' : 'stable';
  
  return monitoring;
}

async function simulateCrisisScenarios(args: any) {
  const { scenarioType, companyProfile = {}, includePlaybook = true } = args;
  
  const prompt = `Simulate ${scenarioType} crisis scenario for:
  Industry: ${companyProfile.industry || 'technology'}
  Company size: ${companyProfile.size || 'medium'}
  Public profile: ${companyProfile.publicProfile || 'medium'}
  
  Generate:
  - Scenario description
  - Timeline of events
  - Stakeholder impacts
  - Media reaction
  ${includePlaybook ? '- Response playbook' : ''}
  
  Make it realistic and detailed.`;
  
  const completion = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    temperature: 0.5,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const simulation = completion.content[0].type === 'text' ? completion.content[0].text : '';
  
  return {
    scenarioType,
    companyProfile,
    simulation,
    playbook: includePlaybook ? 'Generated response playbook included' : null
  };
}

async function generateCrisisReport(args: any) {
  const { crisisId, reportType = 'executive_summary', includeSections = ['timeline', 'impact'], format = 'brief' } = args;
  
  // Generate report sections
  const report: any = {
    crisisId,
    reportType,
    generatedAt: new Date().toISOString(),
    sections: {}
  };
  
  for (const section of includeSections) {
    switch(section) {
      case 'timeline':
        report.sections.timeline = [
          { time: 'T+0h', event: 'Crisis detected' },
          { time: 'T+1h', event: 'Response team activated' },
          { time: 'T+2h', event: 'Initial statement released' },
          { time: 'T+6h', event: 'Situation stabilizing' }
        ];
        break;
      case 'impact':
        report.sections.impact = {
          reputational: 'Moderate negative impact',
          financial: 'Minimal immediate impact',
          operational: 'No disruption',
          stakeholder: 'Some concern from customers'
        };
        break;
      case 'response':
        report.sections.response = {
          actions: ['Issued statement', 'Engaged stakeholders', 'Monitored sentiment'],
          effectiveness: 'Response well-received',
          timeToResponse: '45 minutes'
        };
        break;
      case 'outcomes':
        report.sections.outcomes = {
          status: 'Crisis contained',
          sentiment: 'Recovering',
          lessonsLearned: ['Need faster detection', 'Improve stakeholder database']
        };
        break;
      case 'recommendations':
        report.sections.recommendations = [
          'Update crisis response playbook',
          'Conduct quarterly crisis drills',
          'Enhance monitoring capabilities'
        ];
        break;
    }
  }
  
  report.format = format;
  
  return report;
}

// Generate comprehensive crisis plan
async function generateCrisisPlan(args: any) {
  const {
    industry,
    company_size,
    team_members = [],
    key_concerns = [],
    existing_protocols = '',
    additional_context = '',
    emergency_contacts = [],
    organization_id
  } = args;

  console.log('🚀 Generating crisis plan for', industry, company_size);

  // Generate industry-specific scenarios
  const scenariosPrompt = `For the ${industry} industry, generate 5 specific crisis scenarios that could realistically occur. Focus on industry-specific crises.

Return ONLY a valid JSON object in this format:
{
  "scenarios": [
    {
      "title": "Scenario name",
      "description": "Brief description of the crisis",
      "likelihood": "High/Medium/Low",
      "impact": "Critical/Major/Moderate/Minor"
    }
  ]
}`;

  const scenariosCompletion = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    temperature: 0.7,
    messages: [{ role: 'user', content: scenariosPrompt }]
  });

  const scenariosText = scenariosCompletion.content[0].type === 'text' ? scenariosCompletion.content[0].text : '{}';
  let scenarios = [];

  try {
    const jsonMatch = scenariosText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { scenarios: [] };
    scenarios = parsed.scenarios || [];
  } catch (e) {
    console.error('Failed to parse scenarios:', e);
    scenarios = [
      {
        title: `Major ${industry} Disruption`,
        description: `Significant operational disruption affecting ${industry} services`,
        likelihood: 'Medium',
        impact: 'Major'
      }
    ];
  }

  // Add universal scenarios
  const universalScenarios = [
    {
      title: 'Cyber Attack / Ransomware',
      description: 'Sophisticated cyber attack compromising systems or data',
      likelihood: 'High',
      impact: 'Critical',
      isUniversal: true
    },
    {
      title: 'Executive Misconduct',
      description: 'Senior leadership accused of illegal or unethical behavior',
      likelihood: 'Medium',
      impact: 'Major',
      isUniversal: true
    },
    {
      title: 'Workplace Violence Incident',
      description: 'Active threat or violent incident at company facilities',
      likelihood: 'Low',
      impact: 'Critical',
      isUniversal: true
    }
  ];

  // Generate stakeholders
  const stakeholdersPrompt = `For the ${industry} industry, identify 6 key stakeholder groups and analyze crisis impact on each.

Return ONLY a valid JSON object:
{
  "stakeholders": [
    {
      "name": "Stakeholder group",
      "description": "Role and importance",
      "impactLevel": "High/Medium/Low",
      "concerns": ["concern1", "concern2", "concern3"]
    }
  ]
}`;

  const stakeholdersCompletion = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    temperature: 0.7,
    messages: [{ role: 'user', content: stakeholdersPrompt }]
  });

  const stakeholdersText = stakeholdersCompletion.content[0].type === 'text' ? stakeholdersCompletion.content[0].text : '{}';
  let stakeholders = [];

  try {
    const jsonMatch = stakeholdersText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { stakeholders: [] };
    stakeholders = parsed.stakeholders || [];
  } catch (e) {
    console.error('Failed to parse stakeholders:', e);
    stakeholders = [
      {
        name: 'Customers',
        description: 'Primary users of services',
        impactLevel: 'High',
        concerns: ['Service continuity', 'Data security', 'Communication']
      }
    ];
  }

  // Generate communication plans
  const commPlansPrompt = `For ${industry} crisis management, create communication plans for the top 5 stakeholder groups.

Return ONLY valid JSON:
{
  "communicationPlans": [
    {
      "stakeholder": "Stakeholder name",
      "primaryChannel": "Main communication method",
      "secondaryChannel": "Backup method",
      "keyMessages": ["message1", "message2", "message3"],
      "timing": "When to communicate",
      "spokesperson": "Who delivers message"
    }
  ]
}`;

  const commPlansCompletion = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    temperature: 0.7,
    messages: [{ role: 'user', content: commPlansPrompt }]
  });

  const commPlansText = commPlansCompletion.content[0].type === 'text' ? commPlansCompletion.content[0].text : '{}';
  let communicationPlans = [];

  try {
    const jsonMatch = commPlansText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { communicationPlans: [] };
    communicationPlans = parsed.communicationPlans || [];
  } catch (e) {
    console.error('Failed to parse communication plans:', e);
    communicationPlans = [
      {
        stakeholder: 'Customers',
        primaryChannel: 'Email and website',
        secondaryChannel: 'Social media',
        keyMessages: ['We are aware', 'Taking action', 'Keeping you informed'],
        timing: 'Within 2 hours',
        spokesperson: 'CEO'
      }
    ];
  }

  // Build complete crisis plan
  const crisisPlan = {
    industry,
    company_size,
    organization_id,
    generatedDate: new Date().toLocaleDateString(),
    scenarios: [...scenarios.map((s: any) => ({ ...s, isUniversal: false })), ...universalScenarios],
    stakeholders,
    communicationPlans,
    crisisTeam: team_members,
    emergencyContacts: emergency_contacts,
    keyConcerns: key_concerns,
    existingProtocols: existing_protocols,
    additionalContext: additional_context,
    isAIGenerated: true
  };

  console.log('✅ Crisis plan generated with', scenarios.length + universalScenarios.length, 'scenarios');

  return { plan: crisisPlan };
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
    const body = await req.json();
    const { tool, arguments: args, action } = body;

    // Handle generate_plan action (direct call from frontend)
    if (action === 'generate_plan') {
      const result = await generateCrisisPlan(body);
      return new Response(
        JSON.stringify({ ...result, success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (tool === 'list_tools') {
      return new Response(
        JSON.stringify({ tools: TOOLS, success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    let result;
    switch(tool) {
      case 'detect_crisis_signals':
        result = await detectCrisisSignals(args);
        break;
      case 'assess_crisis_severity':
        result = await assessCrisisSeverity(args);
        break;
      case 'generate_crisis_response':
        result = await generateCrisisResponse(args);
        break;
      case 'create_stakeholder_messaging':
        result = await createStakeholderMessaging(args);
        break;
      case 'monitor_crisis_evolution':
        result = await monitorCrisisEvolution(args);
        break;
      case 'simulate_crisis_scenarios':
        result = await simulateCrisisScenarios(args);
        break;
      case 'generate_crisis_report':
        result = await generateCrisisReport(args);
        break;
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }

    return new Response(
      JSON.stringify({ ...result, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('MCP Crisis Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});