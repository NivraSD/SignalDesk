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
  const {
    sources = ['social', 'news'],
    keywords,
    sensitivity = 'medium',
    timeWindow = '3h',
    articles = [],
    organization_name = keywords?.[0] || 'the organization',
    profile = {}
  } = args;

  console.log(`🚨 Crisis Signal Detection for ${organization_name}`);
  console.log(`   Analyzing ${articles.length} articles`);
  console.log(`   Sensitivity: ${sensitivity}`);

  // If no articles, return low risk
  if (!articles || articles.length === 0) {
    console.log('   ℹ️  No articles to analyze');
    return {
      signalsDetected: 0,
      riskLevel: 0,
      status: 'monitoring',
      warningSignals: [],
      message: 'No articles available for crisis analysis'
    };
  }

  // Prepare article summaries for Claude
  const articleSummaries = articles.slice(0, 20).map((a: any, i: number) => ({
    index: i + 1,
    title: a.title,
    source: a.source,
    published: a.published_at || a.published,
    snippet: a.content?.substring(0, 300) || a.description?.substring(0, 300) || '',
    url: a.url
  }));

  // Use Claude to analyze potential crisis signals with ACTUAL article data
  const prompt = `You are a crisis detection AI analyzing news articles for ${organization_name}.

# YOUR TASK
Analyze these articles and identify ANY crisis signals, warning signs, or negative developments that could harm ${organization_name}'s reputation, operations, or stakeholder relationships.

# ARTICLES TO ANALYZE (${articleSummaries.length} articles from last ${timeWindow})
${JSON.stringify(articleSummaries, null, 2)}

# ORGANIZATION CONTEXT
${JSON.stringify({
  name: organization_name,
  industry: profile.industry || 'Technology',
  competitors: profile.competition?.direct_competitors?.slice(0, 3) || [],
  stakeholders: [
    ...(profile.stakeholders?.major_investors?.slice(0, 2) || []),
    ...(profile.stakeholders?.regulators?.slice(0, 2) || [])
  ]
}, null, 2)}

# CRISIS CATEGORIES TO CHECK
Look for signals in these categories:
- **Legal/Regulatory**: Lawsuits, investigations, regulatory actions, compliance issues
- **Operational**: Outages, failures, security breaches, product issues
- **Reputational**: Scandals, controversies, executive misconduct, PR disasters
- **Financial**: Losses, fraud, bankruptcy concerns, stock crashes
- **Competitive**: Aggressive competitive moves, market share losses, pricing wars
- **Stakeholder**: Employee protests, customer backlash, investor concerns, partner exits

# DETECTION RULES
- **High sensitivity**: Flag even minor negative signals (criticism, complaints, concerns)
- **Medium sensitivity**: Flag moderate issues (incidents, negative trends, emerging risks)
- **Low sensitivity**: Only flag major crises (scandals, breaches, lawsuits, failures)

Current sensitivity: ${sensitivity}

# OUTPUT FORMAT
Return ONLY a JSON object:
{
  "signalsDetected": <number of crisis signals found>,
  "riskLevel": <1-10, where 1=no risk, 10=critical crisis>,
  "status": "monitoring|concerning|critical",
  "warningSignals": ["Array of specific crisis signals detected"],
  "crisisCategory": "legal|operational|reputational|financial|competitive|stakeholder|none",
  "affectedStakeholders": ["List of stakeholder groups affected"],
  "urgency": "low|medium|high|critical",
  "recommendedActions": ["Specific actions to take"],
  "evidence": [
    {
      "article_title": "Title of article",
      "crisis_signal": "What crisis signal was detected",
      "severity": "low|medium|high|critical"
    }
  ]
}

IMPORTANT:
- Be specific about what crisis signals you detect
- Reference specific articles in evidence
- If NO crisis signals found, return riskLevel: 0-2
- If minor concerns, return riskLevel: 3-5
- If moderate crisis, return riskLevel: 6-7
- If major crisis, return riskLevel: 8-10
- Base your analysis ONLY on the articles provided`;

  console.log('   🤖 Calling Claude for crisis analysis...');

  const completion = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }]
  });

  const responseText = completion.content[0].type === 'text' ? completion.content[0].text : '{}';

  console.log('   📝 Claude response received');

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      signalsDetected: 0,
      riskLevel: 1,
      status: 'monitoring',
      warningSignals: []
    };

    console.log(`   ✅ Analysis complete: ${parsed.signalsDetected} signals, risk level ${parsed.riskLevel}/10`);

    // If risk level is significant (>=5), save to crisis_events table
    const organization_id = args.organization_id;
    if (parsed.riskLevel >= 5 && organization_id) {
      console.log(`   ⚠️ Significant risk detected (${parsed.riskLevel}/10), saving to crisis_events...`);

      // Map risk level to severity
      const getSeverity = (riskLevel: number): string => {
        if (riskLevel >= 8) return 'critical';
        if (riskLevel >= 6) return 'high';
        if (riskLevel >= 4) return 'medium';
        return 'low';
      };

      // Check if there's already an active/monitoring crisis for this org
      const { data: existingCrisis } = await supabase
        .from('crisis_events')
        .select('id, title, severity')
        .eq('organization_id', organization_id)
        .in('status', ['monitoring', 'active'])
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (existingCrisis) {
        // Update existing crisis with new signals
        console.log(`   🔄 Updating existing crisis: ${existingCrisis.id}`);
        const { error: updateError } = await supabase
          .from('crisis_events')
          .update({
            severity: getSeverity(parsed.riskLevel),
            description: parsed.warningSignals?.join('; ') || 'Crisis signals detected',
            social_signals: parsed.evidence || [],
            metadata: {
              last_updated: new Date().toISOString(),
              risk_level: parsed.riskLevel,
              crisis_category: parsed.crisisCategory,
              urgency: parsed.urgency,
              affected_stakeholders: parsed.affectedStakeholders,
              recommended_actions: parsed.recommendedActions
            }
          })
          .eq('id', existingCrisis.id);

        if (updateError) {
          console.error(`   ❌ Failed to update crisis: ${updateError.message}`);
        } else {
          console.log(`   ✅ Crisis updated successfully`);
          parsed.crisis_event_id = existingCrisis.id;
          parsed.crisis_action = 'updated';
        }
      } else {
        // Create new crisis event
        const crisisTitle = parsed.crisisCategory
          ? `${parsed.crisisCategory.charAt(0).toUpperCase() + parsed.crisisCategory.slice(1)} Alert: ${organization_name}`
          : `Crisis Alert for ${organization_name}`;

        const { data: newCrisis, error: insertError } = await supabase
          .from('crisis_events')
          .insert({
            organization_id: organization_id,
            crisis_type: parsed.crisisCategory || 'other',
            severity: getSeverity(parsed.riskLevel),
            status: parsed.riskLevel >= 7 ? 'active' : 'monitoring',
            title: crisisTitle,
            description: parsed.warningSignals?.join('; ') || 'Crisis signals detected from news monitoring',
            started_at: new Date().toISOString(),
            trigger_source: 'intelligence_pipeline',
            timeline: [{
              time: new Date().toISOString(),
              event_type: 'detection',
              content: `Crisis detected by intelligence pipeline with risk level ${parsed.riskLevel}/10`,
              actor: 'system'
            }],
            decisions: [],
            communications: [],
            ai_interactions: [],
            team_status: {},
            tasks: parsed.recommendedActions?.map((action: string, idx: number) => ({
              id: `task-${Date.now()}-${idx}`,
              title: action,
              status: 'pending',
              priority: parsed.urgency || 'medium',
              created_at: new Date().toISOString()
            })) || [],
            social_signals: parsed.evidence || [],
            media_coverage: [],
            stakeholder_sentiment: {},
            metadata: {
              risk_level: parsed.riskLevel,
              crisis_category: parsed.crisisCategory,
              urgency: parsed.urgency,
              affected_stakeholders: parsed.affectedStakeholders,
              recommended_actions: parsed.recommendedActions,
              detected_by: 'mcp-crisis-detector'
            }
          })
          .select()
          .single();

        if (insertError) {
          console.error(`   ❌ Failed to create crisis event: ${insertError.message}`);
        } else {
          console.log(`   ✅ Crisis event created: ${newCrisis?.id}`);
          parsed.crisis_event_id = newCrisis?.id;
          parsed.crisis_action = 'created';
        }
      }
    }

    return parsed;
  } catch (parseError) {
    console.error('   ❌ Failed to parse Claude response:', parseError);
    console.error('   Response text:', responseText);

    // Fallback
    return {
      signalsDetected: 0,
      riskLevel: 1,
      status: 'monitoring',
      warningSignals: [],
      error: 'Failed to parse crisis analysis'
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
    model: 'claude-sonnet-4-20250514',
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
    model: 'claude-sonnet-4-20250514',
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
      model: 'claude-sonnet-4-20250514',
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
    model: 'claude-sonnet-4-20250514',
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

// Generate comprehensive crisis plan with company profile and pre-drafted communications
async function generateCrisisPlan(args: any) {
  const {
    industry,
    company_size,
    team_members = [],
    key_concerns = [],
    existing_protocols = '',
    additional_context = '',
    emergency_contacts = [],
    organization_id,
    organization_name = 'the organization',
    company_profile = null,
    generate_communications = false
  } = args;

  console.log('🚀 Generating crisis plan for', organization_name || industry, company_size);
  console.log('📋 Company profile provided:', !!company_profile);

  // Build company context from profile
  const companyContext = company_profile ? `
**COMPANY PROFILE:**
- Organization: ${organization_name}
- Industry: ${industry}
- Business Model: ${company_profile.business_model || 'Not specified'}
- Key Markets: ${company_profile.key_markets?.join(', ') || 'Not specified'}
- Product Lines: ${company_profile.product_lines?.join(', ') || 'Not specified'}
- Strategic Goals: ${company_profile.strategic_goals?.join('; ') || 'Not specified'}
- Leadership: ${company_profile.leadership?.map((l: any) => `${l.name} (${l.title})`).join(', ') || 'Not specified'}
- Headquarters: ${company_profile.headquarters?.city ? `${company_profile.headquarters.city}, ${company_profile.headquarters.country || ''}` : 'Not specified'}
- Company Size: ${company_profile.company_size?.employees || company_size || 'Not specified'}
` : `
**COMPANY PROFILE:**
- Industry: ${industry}
- Company Size: ${company_size}
`;

  // Generate industry-specific scenarios with company context
  const scenariosPrompt = `For ${organization_name} in the ${industry} industry, generate 5 specific crisis scenarios that could realistically occur.

${companyContext}

Focus on industry-specific crises relevant to this company's profile, markets, and product lines.

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
    model: 'claude-sonnet-4-20250514',
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
    model: 'claude-sonnet-4-20250514',
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
    model: 'claude-sonnet-4-20250514',
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

  // Generate purpose and guiding principles
  const purposePrompt = `For a ${industry} company (${company_size}), write a concise crisis management plan purpose statement and 5-7 guiding principles.

Return ONLY a valid JSON object:
{
  "purpose": "2-3 sentences explaining the purpose of this crisis management plan",
  "guidingPrinciples": [
    "Principle 1: Clear, actionable principle",
    "Principle 2: Clear, actionable principle",
    ...
  ]
}`;

  const purposeCompletion = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    temperature: 0.7,
    messages: [{ role: 'user', content: purposePrompt }]
  });

  const purposeText = purposeCompletion.content[0].type === 'text' ? purposeCompletion.content[0].text : '{}';
  let purpose = 'This crisis management plan provides a structured framework for responding to potential crises.';
  let guidingPrinciples: string[] = ['Protect people first', 'Communicate transparently', 'Act decisively'];

  try {
    const jsonMatch = purposeText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { purpose: '', guidingPrinciples: [] };
    if (parsed.purpose) purpose = parsed.purpose;
    if (parsed.guidingPrinciples?.length > 0) guidingPrinciples = parsed.guidingPrinciples;
  } catch (e) {
    console.error('Failed to parse purpose/principles:', e);
  }

  // Build complete crisis plan
  const allScenarios = [...scenarios.map((s: any) => ({ ...s, isUniversal: false })), ...universalScenarios];

  const crisisPlan = {
    industry,
    company_size,
    organization_id,
    organization_name,
    generatedDate: new Date().toLocaleDateString(),
    purpose,
    guidingPrinciples,
    scenarios: allScenarios,
    stakeholders,
    communicationPlans,
    crisisTeam: team_members,
    emergencyContacts: emergency_contacts,
    keyConcerns: key_concerns,
    existingProtocols: existing_protocols,
    additionalContext: additional_context,
    companyProfile: company_profile,
    isAIGenerated: true
  };

  console.log('✅ Crisis plan generated with', allScenarios.length, 'scenarios');

  // Generate pre-drafted communications if requested (parallel orchestration)
  let predraftedCommunications: any[] = [];

  if (generate_communications && allScenarios.length > 0 && stakeholders.length > 0) {
    console.log('📝 Generating pre-drafted communications in parallel...');

    // Define stakeholder groups for communication
    const stakeholderGroups = ['customers', 'employees', 'investors', 'media', 'regulators', 'partners'];

    // Select top 3 most critical scenarios for pre-drafting
    const criticalScenarios = allScenarios
      .filter((s: any) => s.impact === 'Critical' || s.impact === 'Major')
      .slice(0, 3);

    if (criticalScenarios.length === 0) {
      // Fallback to first 3 scenarios
      criticalScenarios.push(...allScenarios.slice(0, 3));
    }

    console.log(`   📋 Pre-drafting for ${criticalScenarios.length} scenarios x ${stakeholderGroups.length} stakeholders`);

    // Generate communications in parallel batches
    const communicationTasks: Promise<any>[] = [];

    for (const scenario of criticalScenarios) {
      for (const stakeholder of stakeholderGroups) {
        communicationTasks.push(
          generatePreDraftedCommunication(
            scenario,
            stakeholder,
            organization_name,
            industry,
            companyContext
          )
        );
      }
    }

    // Execute in parallel with batching (6 at a time to avoid rate limits)
    const batchSize = 6;
    for (let i = 0; i < communicationTasks.length; i += batchSize) {
      const batch = communicationTasks.slice(i, i + batchSize);
      const results = await Promise.all(batch);
      predraftedCommunications.push(...results.filter(r => r !== null));
      console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(communicationTasks.length / batchSize)} complete`);
    }

    console.log(`✅ Generated ${predraftedCommunications.length} pre-drafted communications`);
  }

  return { plan: crisisPlan, predraftedCommunications };
}

// Generate a single pre-drafted communication
async function generatePreDraftedCommunication(
  scenario: any,
  stakeholder: string,
  organizationName: string,
  industry: string,
  companyContext: string
): Promise<any> {
  const stakeholderConcerns: Record<string, string[]> = {
    customers: ['Service availability', 'Data security', 'Resolution timeline', 'Compensation'],
    employees: ['Job security', 'Safety', 'Company stability', 'Action steps'],
    investors: ['Financial impact', 'Stock implications', 'Recovery plan', 'Leadership response'],
    media: ['Facts', 'Timeline', 'Company response', 'Contact information'],
    regulators: ['Compliance', 'Incident details', 'Remediation steps', 'Timeline'],
    partners: ['Business continuity', 'Support available', 'Communication plan', 'Next steps']
  };

  const channels: Record<string, string> = {
    customers: 'Email/Website/App notification',
    employees: 'Internal email/Slack/Town hall',
    investors: 'Press release/Investor call',
    media: 'Press release/Media briefing',
    regulators: 'Formal letter/Regulatory filing',
    partners: 'Direct communication/Partner portal'
  };

  const prompt = `You are a crisis communications expert. Generate a COMPLETE, ready-to-use communication draft.

${companyContext}

**CRISIS SCENARIO:**
${scenario.title}: ${scenario.description}
Severity: ${scenario.impact || 'Major'}

**TARGET AUDIENCE:** ${stakeholder.charAt(0).toUpperCase() + stakeholder.slice(1)}
**THEIR KEY CONCERNS:** ${stakeholderConcerns[stakeholder]?.join(', ') || 'General concerns'}
**COMMUNICATION CHANNEL:** ${channels[stakeholder] || 'Email'}

Generate a COMPLETE communication (500-800 words) that:
1. Opens with acknowledgment of the situation
2. Clearly states what happened (use [SPECIFIC DETAILS] placeholders for unknown facts)
3. Explains the impact on this stakeholder
4. Details the company's immediate response actions
5. Provides a clear timeline for resolution
6. Lists specific next steps for the audience
7. Ends with contact information and commitment to updates

Use a tone appropriate for ${stakeholder}: ${stakeholder === 'media' ? 'factual and professional' : stakeholder === 'employees' ? 'supportive and transparent' : stakeholder === 'customers' ? 'empathetic and reassuring' : 'formal and informative'}.

IMPORTANT: Generate the FULL message. Do not truncate or abbreviate. Include ALL sections.`;

  try {
    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }]
    });

    const message = completion.content[0].type === 'text' ? completion.content[0].text : '';

    return {
      scenario: scenario.title,
      stakeholder: stakeholder,
      message: message,
      channel: channels[stakeholder] || 'email',
      tone: stakeholder === 'media' ? 'factual' : stakeholder === 'customers' ? 'empathetic' : 'transparent',
      concerns: stakeholderConcerns[stakeholder] || []
    };
  } catch (error) {
    console.error(`Failed to generate communication for ${scenario.title}/${stakeholder}:`, error);
    return null;
  }
}

// Generate communications for a single scenario (for on-demand generation)
async function generateScenarioComms(args: any) {
  const {
    scenario,
    organization_id,
    organization_name = 'the organization',
    industry = 'general'
  } = args;

  if (!scenario || !organization_id) {
    throw new Error('scenario and organization_id are required');
  }

  console.log(`📝 Generating communications for scenario: ${scenario.title}`);

  const stakeholderGroups = ['customers', 'employees', 'investors', 'media', 'regulators', 'partners'];
  const companyContext = `
**COMPANY PROFILE:**
- Organization: ${organization_name}
- Industry: ${industry}
`;

  // Generate communications in parallel
  const communicationTasks = stakeholderGroups.map(stakeholder =>
    generatePreDraftedCommunication(
      scenario,
      stakeholder,
      organization_name,
      industry,
      companyContext
    )
  );

  // Execute all in parallel
  const results = await Promise.all(communicationTasks);
  const communications = results.filter(r => r !== null);

  console.log(`✅ Generated ${communications.length} communications for ${scenario.title}`);

  // Save each communication to content_library
  for (const comm of communications) {
    try {
      const { error } = await supabase
        .from('content_library')
        .insert({
          organization_id: organization_id,
          type: 'crisis-communication',
          title: `[${comm.scenario}] ${comm.stakeholder} Communication`,
          content: comm.message,
          tags: ['crisis-communication', 'pre-drafted', comm.scenario.toLowerCase().replace(/\s+/g, '-'), comm.stakeholder.toLowerCase()],
          metadata: {
            generated_at: new Date().toISOString(),
            scenario: comm.scenario,
            stakeholder: comm.stakeholder,
            tone: comm.tone || 'transparent',
            channel: comm.channel || 'email',
            source: 'crisis-scenario-generator'
          }
        });

      if (error) {
        console.error(`Failed to save communication for ${comm.stakeholder}:`, error);
      }
    } catch (err) {
      console.error(`Error saving communication for ${comm.stakeholder}:`, err);
    }
  }

  return { communications, scenario: scenario.title };
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

    // Handle generate_scenario_comms action (generate comms for a single scenario)
    if (action === 'generate_scenario_comms') {
      const result = await generateScenarioComms(body);
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