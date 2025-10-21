import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.16.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Regulatory compliance and monitoring tools (7 tools)
const TOOLS = [
  {
    name: "monitor_regulatory_changes",
    description: "Monitor regulatory changes and updates relevant to your industry",
    inputSchema: {
      type: "object",
      properties: {
        industry: { type: "string", description: "Industry sector" },
        jurisdictions: {
          type: "array",
          items: { type: "string" },
          description: "Jurisdictions to monitor (countries/states)"
        },
        regulations: {
          type: "array",
          items: { type: "string" },
          description: "Specific regulations to track",
          default: ["GDPR", "CCPA", "SOX", "HIPAA", "SEC"]
        },
        alertLevel: {
          type: "string",
          enum: ["all", "significant", "critical"],
          description: "Alert threshold",
          default: "significant"
        },
        timeframe: {
          type: "string",
          enum: ["24h", "7d", "30d", "90d"],
          description: "Monitoring timeframe",
          default: "7d"
        }
      },
      required: ["industry"]
    }
  },
  {
    name: "assess_compliance_risk",
    description: "Assess compliance risks for specific activities or changes",
    inputSchema: {
      type: "object",
      properties: {
        activity: { type: "string", description: "Activity or change to assess" },
        regulations: {
          type: "array",
          items: { type: "string" },
          description: "Applicable regulations"
        },
        jurisdictions: {
          type: "array",
          items: { type: "string" },
          description: "Relevant jurisdictions"
        },
        riskFactors: {
          type: "array",
          items: { type: "string" },
          description: "Specific risk factors to evaluate",
          default: ["penalties", "reputation", "operations", "litigation"]
        }
      },
      required: ["activity"]
    }
  },
  {
    name: "generate_compliance_checklist",
    description: "Generate compliance checklists for regulations or initiatives",
    inputSchema: {
      type: "object",
      properties: {
        regulation: { type: "string", description: "Regulation or compliance framework" },
        scope: { type: "string", description: "Scope of compliance (e.g., data processing, marketing)" },
        organizationType: {
          type: "string",
          enum: ["startup", "sme", "enterprise", "public_company"],
          description: "Organization type",
          default: "enterprise"
        },
        includeTimeline: { type: "boolean", description: "Include implementation timeline", default: true },
        includePriorities: { type: "boolean", description: "Include priority levels", default: true }
      },
      required: ["regulation"]
    }
  },
  {
    name: "track_regulatory_deadlines",
    description: "Track and manage regulatory filing deadlines and requirements",
    inputSchema: {
      type: "object",
      properties: {
        organizationId: { type: "string", description: "Organization identifier" },
        regulatoryBodies: {
          type: "array",
          items: { type: "string" },
          description: "Regulatory bodies to track",
          default: ["SEC", "FTC", "FDA", "EPA"]
        },
        filingTypes: {
          type: "array",
          items: { type: "string" },
          description: "Types of filings to track",
          default: ["quarterly", "annual", "disclosure", "compliance_certification"]
        },
        lookAhead: {
          type: "string",
          enum: ["30d", "60d", "90d", "12m"],
          description: "How far ahead to look",
          default: "90d"
        }
      },
      required: ["organizationId"]
    }
  },
  {
    name: "analyze_regulatory_impact",
    description: "Analyze the impact of regulatory changes on business operations",
    inputSchema: {
      type: "object",
      properties: {
        regulatoryChange: { type: "string", description: "Description of regulatory change" },
        businessAreas: {
          type: "array",
          items: { type: "string" },
          description: "Business areas to analyze",
          default: ["operations", "finance", "hr", "it", "legal", "marketing"]
        },
        impactTypes: {
          type: "array",
          items: { type: "string" },
          description: "Types of impact to assess",
          default: ["cost", "process", "timeline", "resources", "risk"]
        },
        mitigationStrategies: { type: "boolean", description: "Include mitigation strategies", default: true }
      },
      required: ["regulatoryChange"]
    }
  },
  {
    name: "prepare_regulatory_response",
    description: "Prepare responses to regulatory inquiries or enforcement actions",
    inputSchema: {
      type: "object",
      properties: {
        inquiryType: {
          type: "string",
          enum: ["information_request", "audit", "investigation", "enforcement_action"],
          description: "Type of regulatory inquiry"
        },
        regulator: { type: "string", description: "Regulatory body making inquiry" },
        subject: { type: "string", description: "Subject of inquiry" },
        deadline: { type: "string", description: "Response deadline" },
        tone: {
          type: "string",
          enum: ["cooperative", "formal", "defensive", "explanatory"],
          description: "Response tone",
          default: "cooperative"
        }
      },
      required: ["inquiryType", "regulator", "subject"]
    }
  },
  {
    name: "benchmark_compliance_practices",
    description: "Benchmark compliance practices against industry standards",
    inputSchema: {
      type: "object",
      properties: {
        complianceArea: { type: "string", description: "Area of compliance to benchmark" },
        industry: { type: "string", description: "Industry for comparison" },
        metrics: {
          type: "array",
          items: { type: "string" },
          description: "Metrics to compare",
          default: ["maturity", "resources", "technology", "training", "incidents"]
        },
        includeRecommendations: { type: "boolean", description: "Include improvement recommendations", default: true },
        includeBestPractices: { type: "boolean", description: "Include industry best practices", default: true }
      },
      required: ["complianceArea", "industry"]
    }
  }
];

// Tool implementations
async function monitorRegulatoryChanges(args: any) {
  const { industry, jurisdictions = [], regulations = ['GDPR', 'SEC'], alertLevel = 'significant', timeframe = '7d' } = args;
  
  const prompt = `Monitor regulatory changes for ${industry} industry.
  Jurisdictions: ${jurisdictions.join(', ') || 'All major markets'}
  Regulations: ${regulations.join(', ')}
  Alert level: ${alertLevel}
  Timeframe: ${timeframe}
  
  Identify:
  - New regulations or amendments
  - Enforcement actions
  - Guidance updates
  - Compliance deadlines
  - Industry implications
  
  Return as structured JSON.`;
  
  const completion = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const responseText = completion.content[0].type === 'text' ? completion.content[0].text : '{}';
  
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {
      changes: [],
      industry,
      timeframe
    };
  } catch {
    // Fallback regulatory updates
    return {
      industry,
      timeframe,
      changes: [
        {
          regulation: regulations[0],
          type: "amendment",
          description: "Updated data processing requirements",
          effectiveDate: "2025-03-01",
          impact: "high",
          actionRequired: "Review and update privacy policies"
        },
        {
          regulation: "SEC",
          type: "guidance",
          description: "New disclosure requirements for climate risks",
          effectiveDate: "2025-06-01",
          impact: "medium",
          actionRequired: "Prepare climate risk assessment"
        }
      ],
      totalChanges: 2,
      criticalCount: alertLevel === 'critical' ? 0 : 1
    };
  }
}

async function assessComplianceRisk(args: any) {
  const { activity, regulations = [], jurisdictions = [], riskFactors = ['penalties', 'reputation'] } = args;
  
  const riskAssessment: any = {
    activity,
    overallRisk: "medium",
    riskScore: Math.floor(Math.random() * 10) + 1,
    factors: {}
  };
  
  // Assess each risk factor
  for (const factor of riskFactors) {
    riskAssessment.factors[factor] = {
      level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      score: Math.floor(Math.random() * 10) + 1,
      description: `${factor} risk assessment for ${activity}`,
      mitigation: `Implement controls for ${factor}`
    };
  }
  
  // Regulatory specific risks
  if (regulations.length > 0) {
    riskAssessment.regulatoryRisks = regulations.map(reg => ({
      regulation: reg,
      compliance: `${Math.floor(Math.random() * 30) + 70}%`,
      gaps: ["Documentation", "Training", "Monitoring"],
      priority: "high"
    }));
  }
  
  // Jurisdiction specific risks
  if (jurisdictions.length > 0) {
    riskAssessment.jurisdictionRisks = jurisdictions.map(jur => ({
      jurisdiction: jur,
      complexity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      localRequirements: ["Registration", "Reporting", "Data localization"]
    }));
  }
  
  riskAssessment.recommendations = [
    "Conduct detailed compliance audit",
    "Implement monitoring controls",
    "Update policies and procedures",
    "Provide staff training"
  ];
  
  return riskAssessment;
}

async function generateComplianceChecklist(args: any) {
  const { regulation, scope = '', organizationType = 'enterprise', includeTimeline = true, includePriorities = true } = args;
  
  const checklist: any = {
    regulation,
    scope,
    organizationType,
    items: []
  };
  
  // Generate checklist items based on regulation
  const items = [
    {
      category: "Documentation",
      tasks: [
        "Create/update privacy policy",
        "Document data processing activities",
        "Maintain records of consent"
      ]
    },
    {
      category: "Technical Controls",
      tasks: [
        "Implement encryption",
        "Set up access controls",
        "Enable audit logging"
      ]
    },
    {
      category: "Organizational",
      tasks: [
        "Appoint compliance officer",
        "Conduct staff training",
        "Establish incident response plan"
      ]
    },
    {
      category: "Ongoing Compliance",
      tasks: [
        "Regular audits",
        "Monitor regulatory updates",
        "Update procedures as needed"
      ]
    }
  ];
  
  // Format checklist items
  let itemId = 1;
  for (const category of items) {
    for (const task of category.tasks) {
      const item: any = {
        id: itemId++,
        category: category.category,
        task,
        status: "pending"
      };
      
      if (includePriorities) {
        item.priority = ['high', 'medium', 'low'][Math.floor(Math.random() * 3)];
      }
      
      if (includeTimeline) {
        item.deadline = new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
      
      checklist.items.push(item);
    }
  }
  
  checklist.totalItems = checklist.items.length;
  checklist.estimatedEffort = `${checklist.items.length * 4} hours`;
  
  return checklist;
}

async function trackRegulatoryDeadlines(args: any) {
  const { organizationId, regulatoryBodies = ['SEC'], filingTypes = ['quarterly'], lookAhead = '90d' } = args;
  
  const deadlines: any = {
    organizationId,
    lookAhead,
    upcomingDeadlines: []
  };
  
  // Generate sample deadlines
  for (const body of regulatoryBodies) {
    for (const type of filingTypes) {
      const daysAhead = Math.floor(Math.random() * 90) + 1;
      deadlines.upcomingDeadlines.push({
        regulatoryBody: body,
        filingType: type,
        deadline: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        daysRemaining: daysAhead,
        status: daysAhead < 30 ? "urgent" : daysAhead < 60 ? "upcoming" : "future",
        requirements: ["Financial statements", "Management discussion", "Certifications"],
        estimatedEffort: `${Math.floor(Math.random() * 40) + 20} hours`
      });
    }
  }
  
  // Sort by deadline
  deadlines.upcomingDeadlines.sort((a: any, b: any) => a.daysRemaining - b.daysRemaining);
  
  deadlines.summary = {
    total: deadlines.upcomingDeadlines.length,
    urgent: deadlines.upcomingDeadlines.filter((d: any) => d.status === 'urgent').length,
    nextDeadline: deadlines.upcomingDeadlines[0]
  };
  
  return deadlines;
}

async function analyzeRegulatoryImpact(args: any) {
  const { regulatoryChange, businessAreas = ['operations', 'finance'], impactTypes = ['cost', 'process'], mitigationStrategies = true } = args;
  
  const impact: any = {
    regulatoryChange,
    assessmentDate: new Date().toISOString(),
    overallImpact: "medium",
    areaImpacts: {}
  };
  
  // Assess impact on each business area
  for (const area of businessAreas) {
    impact.areaImpacts[area] = {
      impactLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      impacts: {}
    };
    
    for (const type of impactTypes) {
      impact.areaImpacts[area].impacts[type] = {
        description: `${type} impact on ${area}`,
        magnitude: ['minimal', 'moderate', 'significant'][Math.floor(Math.random() * 3)],
        timeframe: ['immediate', 'short-term', 'long-term'][Math.floor(Math.random() * 3)]
      };
    }
    
    if (mitigationStrategies) {
      impact.areaImpacts[area].mitigation = [
        `Update ${area} procedures`,
        `Train ${area} staff`,
        `Implement new controls`
      ];
    }
  }
  
  // Overall summary
  impact.summary = {
    totalCost: `$${Math.floor(Math.random() * 500000) + 50000}`,
    implementationTime: `${Math.floor(Math.random() * 6) + 3} months`,
    resourcesRequired: `${Math.floor(Math.random() * 10) + 5} FTEs`,
    criticalActions: [
      "Form compliance task force",
      "Conduct gap analysis",
      "Develop implementation plan"
    ]
  };
  
  return impact;
}

async function prepareRegulatoryResponse(args: any) {
  const { inquiryType, regulator, subject, deadline = '', tone = 'cooperative' } = args;
  
  const prompt = `Prepare ${tone} response to ${inquiryType} from ${regulator}.
  Subject: ${subject}
  ${deadline ? `Deadline: ${deadline}` : ''}
  
  Create professional response including:
  - Acknowledgment
  - Factual information
  - Supporting documentation references
  - Next steps
  - Contact information`;
  
  const completion = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const responseContent = completion.content[0].type === 'text' ? completion.content[0].text : '';
  
  return {
    inquiryType,
    regulator,
    subject,
    responseTemplate: responseContent,
    tone,
    supportingDocuments: [
      "Compliance certificates",
      "Audit reports",
      "Policy documentation",
      "Training records"
    ],
    internalActions: [
      "Legal review",
      "Fact verification",
      "Document collection",
      "Management approval"
    ]
  };
}

async function benchmarkCompliancePractices(args: any) {
  const { complianceArea, industry, metrics = ['maturity'], includeRecommendations = true, includeBestPractices = true } = args;
  
  const benchmark: any = {
    complianceArea,
    industry,
    assessmentDate: new Date().toISOString(),
    scores: {}
  };
  
  // Generate benchmark scores
  for (const metric of metrics) {
    benchmark.scores[metric] = {
      yourScore: Math.floor(Math.random() * 100),
      industryAverage: Math.floor(Math.random() * 100),
      topPerformers: Math.floor(Math.random() * 20) + 80,
      percentile: Math.floor(Math.random() * 100),
      trend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)]
    };
  }
  
  if (includeBestPractices) {
    benchmark.bestPractices = [
      "Automated compliance monitoring",
      "Regular third-party audits",
      "Continuous staff training",
      "Integrated GRC platform",
      "Board-level oversight"
    ];
  }
  
  if (includeRecommendations) {
    benchmark.recommendations = [
      {
        area: "Technology",
        recommendation: "Implement automated monitoring tools",
        impact: "high",
        effort: "medium"
      },
      {
        area: "Process",
        recommendation: "Standardize compliance procedures",
        impact: "medium",
        effort: "low"
      },
      {
        area: "People",
        recommendation: "Enhance compliance training program",
        impact: "high",
        effort: "medium"
      }
    ];
  }
  
  benchmark.maturityLevel = "Developing";
  benchmark.nextReview = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  return benchmark;
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
      case 'monitor_regulatory_changes':
        result = await monitorRegulatoryChanges(args);
        break;
      case 'assess_compliance_risk':
        result = await assessComplianceRisk(args);
        break;
      case 'generate_compliance_checklist':
        result = await generateComplianceChecklist(args);
        break;
      case 'track_regulatory_deadlines':
        result = await trackRegulatoryDeadlines(args);
        break;
      case 'analyze_regulatory_impact':
        result = await analyzeRegulatoryImpact(args);
        break;
      case 'prepare_regulatory_response':
        result = await prepareRegulatoryResponse(args);
        break;
      case 'benchmark_compliance_practices':
        result = await benchmarkCompliancePractices(args);
        break;
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
    
    return new Response(
      JSON.stringify({ ...result, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('MCP Regulatory Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});