import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.16.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Relationship mapping and management tools
const TOOLS = [
  {
    name: "map_organizational_relationships",
    description: "Map relationships between organizations, people, and entities",
    inputSchema: {
      type: "object",
      properties: {
        centralEntity: { type: "string", description: "Central entity to map from" },
        relationshipTypes: {
          type: "array",
          items: { type: "string" },
          description: "Types of relationships to map",
          default: ["partnership", "competitor", "supplier", "customer", "investor", "advisor"]
        },
        depth: {
          type: "number",
          description: "Degrees of separation to explore",
          default: 2
        },
        includeStrength: {
          type: "boolean",
          description: "Include relationship strength metrics",
          default: true
        }
      },
      required: ["centralEntity"]
    }
  },
  {
    name: "analyze_influence_network",
    description: "Analyze influence networks and power dynamics",
    inputSchema: {
      type: "object",
      properties: {
        entities: {
          type: "array",
          items: { type: "string" },
          description: "Entities to analyze"
        },
        networkType: {
          type: "string",
          enum: ["business", "political", "media", "academic", "social"],
          description: "Type of influence network",
          default: "business"
        },
        metrics: {
          type: "array",
          items: { type: "string" },
          description: "Influence metrics to calculate",
          default: ["centrality", "reach", "authority", "connectivity"]
        }
      },
      required: ["entities"]
    }
  },
  {
    name: "identify_key_connectors",
    description: "Identify key connectors and bridge relationships",
    inputSchema: {
      type: "object",
      properties: {
        sourceEntity: { type: "string", description: "Starting entity" },
        targetEntity: { type: "string", description: "Target entity to reach" },
        connectionTypes: {
          type: "array",
          items: { type: "string" },
          description: "Types of connections to consider",
          default: ["professional", "personal", "board", "investor", "advisor"]
        },
        maxPaths: {
          type: "number",
          description: "Maximum number of paths to find",
          default: 5
        }
      },
      required: ["sourceEntity", "targetEntity"]
    }
  },
  {
    name: "track_relationship_changes",
    description: "Track changes in relationships over time",
    inputSchema: {
      type: "object",
      properties: {
        entities: {
          type: "array",
          items: { type: "string" },
          description: "Entities to monitor"
        },
        changeTypes: {
          type: "array",
          items: { type: "string" },
          description: "Types of changes to track",
          default: ["new", "ended", "strengthened", "weakened", "transformed"]
        },
        timeframe: {
          type: "string",
          enum: ["7d", "30d", "90d", "1y"],
          description: "Timeframe for tracking",
          default: "30d"
        },
        alertThreshold: {
          type: "string",
          enum: ["all", "significant", "critical"],
          description: "Alert threshold for changes",
          default: "significant"
        }
      },
      required: ["entities"]
    }
  },
  {
    name: "assess_relationship_risks",
    description: "Assess risks in business relationships and partnerships",
    inputSchema: {
      type: "object",
      properties: {
        relationship: {
          type: "object",
          properties: {
            entity1: { type: "string" },
            entity2: { type: "string" },
            type: { type: "string" }
          },
          description: "Relationship to assess"
        },
        riskCategories: {
          type: "array",
          items: { type: "string" },
          description: "Risk categories to evaluate",
          default: ["financial", "reputational", "operational", "strategic", "compliance"]
        },
        includeScenarios: {
          type: "boolean",
          description: "Include risk scenarios",
          default: true
        }
      },
      required: ["relationship"]
    }
  },
  {
    name: "generate_relationship_insights",
    description: "Generate strategic insights from relationship analysis",
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string", description: "Entity to analyze" },
        focusAreas: {
          type: "array",
          items: { type: "string" },
          description: "Areas to focus insights on",
          default: ["opportunities", "threats", "gaps", "strengths"]
        },
        competitiveContext: {
          type: "boolean",
          description: "Include competitive context",
          default: true
        },
        actionable: {
          type: "boolean",
          description: "Generate actionable recommendations",
          default: true
        }
      },
      required: ["entity"]
    }
  },
  {
    name: "visualize_relationship_graph",
    description: "Generate data for relationship network visualization",
    inputSchema: {
      type: "object",
      properties: {
        entities: {
          type: "array",
          items: { type: "string" },
          description: "Entities to include in visualization"
        },
        layout: {
          type: "string",
          enum: ["force", "hierarchical", "circular", "geographic"],
          description: "Graph layout type",
          default: "force"
        },
        filters: {
          type: "object",
          properties: {
            minStrength: { type: "number", description: "Minimum relationship strength" },
            types: { type: "array", items: { type: "string" }, description: "Relationship types to show" }
          },
          description: "Visualization filters"
        },
        includeMetadata: {
          type: "boolean",
          description: "Include entity metadata",
          default: true
        }
      },
      required: ["entities"]
    }
  }
];

// Tool implementations
async function mapOrganizationalRelationships(args: any) {
  const { centralEntity, relationshipTypes = ['partnership', 'competitor'], depth = 2, includeStrength = true } = args;
  
  const relationshipMap: any = {
    centralEntity,
    depth,
    nodes: [{ id: centralEntity, type: 'central', level: 0 }],
    edges: []
  };
  
  // Generate first degree relationships
  const firstDegree = [
    { entity: "Partner Corp", type: "partnership", strength: 0.8 },
    { entity: "Competitor Inc", type: "competitor", strength: 0.6 },
    { entity: "Supplier Co", type: "supplier", strength: 0.7 },
    { entity: "Major Customer", type: "customer", strength: 0.9 }
  ];
  
  for (const rel of firstDegree) {
    if (relationshipTypes.includes(rel.type)) {
      relationshipMap.nodes.push({
        id: rel.entity,
        type: rel.type,
        level: 1
      });
      
      relationshipMap.edges.push({
        source: centralEntity,
        target: rel.entity,
        type: rel.type,
        strength: includeStrength ? rel.strength : undefined
      });
    }
  }
  
  // Generate second degree if depth >= 2
  if (depth >= 2) {
    for (const firstNode of firstDegree) {
      const secondEntity = `${firstNode.entity} Partner`;
      relationshipMap.nodes.push({
        id: secondEntity,
        type: 'indirect',
        level: 2
      });
      
      relationshipMap.edges.push({
        source: firstNode.entity,
        target: secondEntity,
        type: 'partnership',
        strength: includeStrength ? 0.5 : undefined
      });
    }
  }
  
  relationshipMap.summary = {
    totalNodes: relationshipMap.nodes.length,
    totalEdges: relationshipMap.edges.length,
    relationshipTypes: [...new Set(relationshipMap.edges.map((e: any) => e.type))]
  };
  
  return relationshipMap;
}

async function analyzeInfluenceNetwork(args: any) {
  const { entities, networkType = 'business', metrics = ['centrality', 'reach'] } = args;
  
  const analysis: any = {
    networkType,
    entities: {},
    networkMetrics: {}
  };
  
  // Analyze each entity
  for (const entity of entities) {
    analysis.entities[entity] = {
      metrics: {}
    };
    
    if (metrics.includes('centrality')) {
      analysis.entities[entity].metrics.centrality = (Math.random() * 0.9 + 0.1).toFixed(2);
    }
    if (metrics.includes('reach')) {
      analysis.entities[entity].metrics.reach = Math.floor(Math.random() * 10000) + 1000;
    }
    if (metrics.includes('authority')) {
      analysis.entities[entity].metrics.authority = (Math.random() * 0.9 + 0.1).toFixed(2);
    }
    if (metrics.includes('connectivity')) {
      analysis.entities[entity].metrics.connectivity = Math.floor(Math.random() * 50) + 10;
    }
    
    analysis.entities[entity].influenceScore = (Math.random() * 90 + 10).toFixed(0);
    analysis.entities[entity].ranking = Math.floor(Math.random() * 10) + 1;
  }
  
  // Network-wide metrics
  analysis.networkMetrics = {
    density: (Math.random() * 0.5 + 0.3).toFixed(2),
    clustering: (Math.random() * 0.6 + 0.2).toFixed(2),
    averageDegree: (Math.random() * 10 + 5).toFixed(1),
    diameter: Math.floor(Math.random() * 5) + 3
  };
  
  analysis.insights = [
    `${entities[0]} has the highest centrality in the ${networkType} network`,
    "Network shows moderate clustering indicating tight-knit groups",
    "Opportunity for bridge connections between isolated clusters"
  ];
  
  return analysis;
}

async function identifyKeyConnectors(args: any) {
  const { sourceEntity, targetEntity, connectionTypes = ['professional'], maxPaths = 5 } = args;
  
  const paths: any[] = [];
  const pathCount = Math.min(maxPaths, Math.floor(Math.random() * 3) + 2);
  
  for (let i = 0; i < pathCount; i++) {
    const intermediaries = Math.floor(Math.random() * 2) + 1;
    const path: any = {
      pathId: i + 1,
      length: intermediaries + 1,
      strength: (Math.random() * 0.6 + 0.4).toFixed(2),
      nodes: [sourceEntity]
    };
    
    // Add intermediary nodes
    for (let j = 0; j < intermediaries; j++) {
      path.nodes.push(`Connector ${i + 1}-${j + 1}`);
    }
    path.nodes.push(targetEntity);
    
    // Add connection details
    path.connections = [];
    for (let j = 0; j < path.nodes.length - 1; j++) {
      path.connections.push({
        from: path.nodes[j],
        to: path.nodes[j + 1],
        type: connectionTypes[Math.floor(Math.random() * connectionTypes.length)],
        strength: (Math.random() * 0.6 + 0.4).toFixed(2)
      });
    }
    
    paths.push(path);
  }
  
  // Sort by path length and strength
  paths.sort((a, b) => a.length - b.length || parseFloat(b.strength) - parseFloat(a.strength));
  
  return {
    sourceEntity,
    targetEntity,
    paths,
    shortestPath: paths[0],
    strongestPath: paths.reduce((max, p) => parseFloat(p.strength) > parseFloat(max.strength) ? p : max),
    keyConnectors: [...new Set(paths.flatMap(p => p.nodes.slice(1, -1)))],
    recommendation: `Best connection through ${paths[0].nodes[1]} (${paths[0].length} degrees)`
  };
}

async function trackRelationshipChanges(args: any) {
  const { entities, changeTypes = ['new', 'ended'], timeframe = '30d', alertThreshold = 'significant' } = args;
  
  const changes: any = {
    timeframe,
    alertThreshold,
    changes: [],
    alerts: []
  };
  
  // Generate sample changes
  for (const entity of entities) {
    for (const changeType of changeTypes) {
      if (Math.random() > 0.5) {
        const change = {
          entity,
          changeType,
          relatedEntity: `${changeType === 'new' ? 'New' : 'Former'} Partner ${Math.floor(Math.random() * 100)}`,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          significance: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          impact: `${changeType} relationship affecting ${entity}`
        };
        
        changes.changes.push(change);
        
        // Generate alert if meets threshold
        if ((alertThreshold === 'all') ||
            (alertThreshold === 'significant' && change.significance !== 'low') ||
            (alertThreshold === 'critical' && change.significance === 'high')) {
          changes.alerts.push({
            entity: change.entity,
            message: `${change.significance} priority: ${change.changeType} relationship with ${change.relatedEntity}`,
            action: "Review and assess impact"
          });
        }
      }
    }
  }
  
  changes.summary = {
    totalChanges: changes.changes.length,
    byType: changeTypes.reduce((acc: any, type: string) => {
      acc[type] = changes.changes.filter((c: any) => c.changeType === type).length;
      return acc;
    }, {}),
    alertCount: changes.alerts.length
  };
  
  return changes;
}

async function assessRelationshipRisks(args: any) {
  const { relationship, riskCategories = ['financial', 'reputational'], includeScenarios = true } = args;
  
  const assessment: any = {
    relationship,
    overallRisk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    riskScore: Math.floor(Math.random() * 10) + 1,
    categoryRisks: {}
  };
  
  // Assess each risk category
  for (const category of riskCategories) {
    assessment.categoryRisks[category] = {
      level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      score: Math.floor(Math.random() * 10) + 1,
      factors: [
        `${category} exposure from ${relationship.entity2}`,
        `Dependency risk in ${category} area`,
        `Market conditions affecting ${category}`
      ],
      mitigation: [
        `Diversify ${category} exposure`,
        `Implement ${category} controls`,
        `Monitor ${category} indicators`
      ]
    };
  }
  
  if (includeScenarios) {
    assessment.scenarios = [
      {
        scenario: "Partner financial distress",
        probability: "medium",
        impact: "high",
        response: "Activate contingency plan, seek alternative partners"
      },
      {
        scenario: "Reputational crisis at partner",
        probability: "low",
        impact: "medium",
        response: "Distance messaging, emphasize independence"
      },
      {
        scenario: "Regulatory action against partner",
        probability: "low",
        impact: "high",
        response: "Legal review, compliance audit"
      }
    ];
  }
  
  assessment.recommendations = [
    "Regular relationship health checks",
    "Diversify critical dependencies",
    "Update contingency plans",
    "Enhance monitoring systems"
  ];
  
  return assessment;
}

async function generateRelationshipInsights(args: any) {
  const { entity, focusAreas = ['opportunities', 'threats'], competitiveContext = true, actionable = true } = args;
  
  const insights: any = {
    entity,
    analysisDate: new Date().toISOString(),
    insights: {}
  };
  
  if (focusAreas.includes('opportunities')) {
    insights.insights.opportunities = [
      "Potential strategic partnership with emerging player",
      "Underutilized connection to key industry influencer",
      "Gap in competitor's partner network to exploit"
    ];
  }
  
  if (focusAreas.includes('threats')) {
    insights.insights.threats = [
      "Increasing competitor partnerships in key market",
      "Dependency on single supplier relationship",
      "Weakening ties with critical stakeholder group"
    ];
  }
  
  if (focusAreas.includes('gaps')) {
    insights.insights.gaps = [
      "No direct relationships in emerging market segment",
      "Weak connections to regulatory bodies",
      "Limited reach in academic/research networks"
    ];
  }
  
  if (focusAreas.includes('strengths')) {
    insights.insights.strengths = [
      "Strong central position in industry network",
      "Diverse partnership portfolio",
      "Deep relationships with key customers"
    ];
  }
  
  if (competitiveContext) {
    insights.competitiveAnalysis = {
      position: "Strong but threatened",
      networkAdvantages: ["Better supplier relationships", "Stronger brand partnerships"],
      networkDisadvantages: ["Fewer media connections", "Limited government relations"],
      recommendations: ["Strengthen media relationships", "Expand government affairs"]
    };
  }
  
  if (actionable) {
    insights.recommendations = [
      {
        priority: "high",
        action: "Initiate partnership discussions with identified targets",
        timeline: "Q1 2025",
        impact: "Expand market reach by 20%"
      },
      {
        priority: "medium",
        action: "Diversify supplier relationships",
        timeline: "Q2 2025",
        impact: "Reduce supply chain risk"
      },
      {
        priority: "low",
        action: "Strengthen academic partnerships",
        timeline: "Q3 2025",
        impact: "Enhance innovation pipeline"
      }
    ];
  }
  
  return insights;
}

async function visualizeRelationshipGraph(args: any) {
  const { entities, layout = 'force', filters = {}, includeMetadata = true } = args;
  
  const graphData: any = {
    layout,
    nodes: [],
    edges: [],
    metadata: {}
  };
  
  // Create nodes
  for (let i = 0; i < entities.length; i++) {
    const node: any = {
      id: entities[i],
      label: entities[i],
      x: layout === 'circular' ? Math.cos(2 * Math.PI * i / entities.length) * 100 : Math.random() * 200 - 100,
      y: layout === 'circular' ? Math.sin(2 * Math.PI * i / entities.length) * 100 : Math.random() * 200 - 100,
      size: Math.random() * 20 + 10,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    };
    
    if (includeMetadata) {
      node.metadata = {
        type: ['company', 'person', 'organization'][Math.floor(Math.random() * 3)],
        industry: ['tech', 'finance', 'healthcare'][Math.floor(Math.random() * 3)],
        importance: Math.floor(Math.random() * 10) + 1
      };
    }
    
    graphData.nodes.push(node);
  }
  
  // Create edges (random connections for demo)
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      if (Math.random() > 0.6) {
        const strength = Math.random();
        
        // Apply filters
        if (filters.minStrength && strength < filters.minStrength) continue;
        
        const edgeType = ['partnership', 'competitor', 'supplier', 'customer'][Math.floor(Math.random() * 4)];
        if (filters.types && !filters.types.includes(edgeType)) continue;
        
        graphData.edges.push({
          source: entities[i],
          target: entities[j],
          type: edgeType,
          strength,
          weight: strength * 10
        });
      }
    }
  }
  
  graphData.statistics = {
    nodeCount: graphData.nodes.length,
    edgeCount: graphData.edges.length,
    density: (2 * graphData.edges.length) / (graphData.nodes.length * (graphData.nodes.length - 1)),
    avgDegree: (2 * graphData.edges.length) / graphData.nodes.length
  };
  
  return graphData;
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
      case 'map_organizational_relationships':
        result = await mapOrganizationalRelationships(args);
        break;
      case 'analyze_influence_network':
        result = await analyzeInfluenceNetwork(args);
        break;
      case 'identify_key_connectors':
        result = await identifyKeyConnectors(args);
        break;
      case 'track_relationship_changes':
        result = await trackRelationshipChanges(args);
        break;
      case 'assess_relationship_risks':
        result = await assessRelationshipRisks(args);
        break;
      case 'generate_relationship_insights':
        result = await generateRelationshipInsights(args);
        break;
      case 'visualize_relationship_graph':
        result = await visualizeRelationshipGraph(args);
        break;
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
    
    return new Response(
      JSON.stringify({ ...result, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('MCP Relationships Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});