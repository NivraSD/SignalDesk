import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Types
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  mcpTools?: string[];
}

interface MCPToolCall {
  mcp: string;
  tool: string;
  params: any;
  result?: any;
}

interface Request {
  message: string;
  conversationHistory: ChatMessage[];
  userId: string;
  sessionId: string;
  context?: any;
}

interface Artifact {
  id: string;
  type: string;
  title: string;
  created: string;
  content: any;
  mcpSources?: string[];
}

interface Response {
  chatMessage: string;
  artifact?: Artifact;
  mcpCalls?: MCPToolCall[];
}

// MCP Registry - Maps user intents to MCPs and their tools
const MCP_REGISTRY = {
  // Crisis Management
  crisis: {
    mcp: 'signaldesk-crisis',
    triggers: ['crisis', 'emergency', 'scandal', 'urgent', 'damage control'],
    tools: ['detect_crisis_signals', 'assess_crisis_severity', 'generate_crisis_response', 'coordinate_war_room']
  },
  
  // Intelligence Gathering
  intelligence: {
    mcp: 'signaldesk-intelligence',
    triggers: ['competitor', 'market analysis', 'industry trends', 'emerging topics'],
    tools: ['gather_intelligence', 'analyze_competitors', 'track_emerging_topics']
  },
  
  // Media Relations
  media: {
    mcp: 'signaldesk-media',
    triggers: ['journalist', 'media list', 'press', 'reporter', 'pitch'],
    tools: ['discover_journalists', 'generate_pitch', 'track_outreach']
  },
  
  // Content Creation
  content: {
    mcp: 'signaldesk-content',
    triggers: ['press release', 'statement', 'content', 'write', 'draft'],
    tools: ['generate_content', 'create_crisis_statement', 'localize_content']
  },
  
  // Social Media
  social: {
    mcp: 'signaldesk-social',
    triggers: ['social media', 'twitter', 'linkedin', 'viral', 'social sentiment'],
    tools: ['monitor_social_sentiment', 'detect_viral_moments', 'generate_social_content']
  },
  
  // Stakeholder Analysis
  stakeholders: {
    mcp: 'signaldesk-stakeholder-groups',
    triggers: ['stakeholder', 'coalition', 'groups', 'alliance', 'opposition'],
    tools: ['detect_coalition_formation', 'predict_group_actions', 'map_stakeholder_networks']
  },
  
  // Regulatory
  regulatory: {
    mcp: 'signaldesk-regulatory',
    triggers: ['regulatory', 'compliance', 'legislation', 'policy', 'lobbying'],
    tools: ['monitor_regulatory_changes', 'analyze_compliance_impact', 'track_lobbying_activity']
  },
  
  // Entity Management
  entities: {
    mcp: 'signaldesk-entities',
    triggers: ['organization', 'company', 'entity', 'profile', 'enrich'],
    tools: ['recognize_entities', 'enrich_entity_profile', 'find_entity_connections']
  },
  
  // Campaign Management
  campaigns: {
    mcp: 'signaldesk-campaigns',
    triggers: ['campaign', 'project', 'timeline', 'milestone', 'task'],
    tools: ['plan_campaign', 'manage_tasks', 'track_milestones']
  },
  
  // Analytics
  analytics: {
    mcp: 'signaldesk-analytics',
    triggers: ['metrics', 'roi', 'performance', 'sentiment', 'analytics'],
    tools: ['calculate_media_value', 'analyze_sentiment', 'measure_roi']
  },
  
  // Narrative Control
  narratives: {
    mcp: 'signaldesk-narratives',
    triggers: ['narrative', 'story', 'messaging', 'counter-narrative'],
    tools: ['track_narrative_evolution', 'measure_narrative_strength', 'create_counter_narrative']
  },
  
  // Opportunities
  opportunities: {
    mcp: 'signaldesk-opportunities',
    triggers: ['opportunity', 'opening', 'chance', 'potential'],
    tools: ['discover_opportunities', 'analyze_opportunity_value']
  },
  
  // Relationships
  relationships: {
    mcp: 'signaldesk-relationships',
    triggers: ['relationship', 'contact', 'network', 'influence'],
    tools: ['track_journalist_relationships', 'assess_relationship_health', 'map_influencer_network']
  },
  
  // Monitoring
  monitor: {
    mcp: 'signaldesk-monitor',
    triggers: ['monitor', 'watch', 'track', 'alert'],
    tools: ['monitor_stakeholders', 'detect_signals', 'generate_alerts']
  },
  
  // Web Automation
  browser: {
    mcp: 'playwright-mcp-server',
    triggers: ['browse', 'screenshot', 'web page', 'website', 'scrape'],
    tools: ['navigate', 'screenshot', 'extract', 'interact']
  }
};

// Configuration
const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

// Detect which MCPs are relevant to the user's request
function detectRelevantMCPs(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  const relevantMCPs: string[] = [];
  
  for (const [key, config] of Object.entries(MCP_REGISTRY)) {
    for (const trigger of config.triggers) {
      if (lowerMessage.includes(trigger)) {
        relevantMCPs.push(config.mcp);
        break;
      }
    }
  }
  
  // If crisis detected, automatically include orchestrator
  if (relevantMCPs.includes('signaldesk-crisis')) {
    relevantMCPs.push('signaldesk-orchestrator');
  }
  
  // Remove duplicates
  return [...new Set(relevantMCPs)];
}

// Simulate MCP tool calls (in production, these would make actual calls)
async function callMCPTool(mcp: string, tool: string, params: any): Promise<any> {
  // Log the MCP call for tracking
  await supabase.from('mcp_calls').insert({
    mcp,
    tool,
    params,
    timestamp: new Date().toISOString()
  });
  
  // In production, this would make actual calls to MCP servers
  // For now, return simulated responses based on the tool
  const simulatedResponses: Record<string, any> = {
    'discover_journalists': {
      journalists: [
        { name: 'Sarah Johnson', outlet: 'TechCrunch', beat: 'AI & ML', relationship: 'warm' },
        { name: 'Mike Chen', outlet: 'Wired', beat: 'Enterprise Tech', relationship: 'new' }
      ]
    },
    'analyze_sentiment': {
      overall: 'positive',
      score: 0.72,
      breakdown: { positive: 65, neutral: 25, negative: 10 }
    },
    'detect_crisis_signals': {
      signals_detected: false,
      risk_level: 'low',
      monitoring_active: true
    },
    'enrich_entity_profile': {
      organization: params.name,
      industry: 'Technology',
      employees: '1000-5000',
      recent_news: ['Product launch', 'Partnership announcement']
    }
  };
  
  return simulatedResponses[tool] || { status: 'completed', mcp, tool, params };
}

// Enhanced Claude call with MCP context
async function callClaudeWithMCPContext(
  messages: ChatMessage[], 
  systemPrompt: string,
  mcpContext?: any
): Promise<string> {
  // Enhance system prompt with MCP capabilities
  const enhancedPrompt = `${systemPrompt}

You have access to the following MCP (Model Context Protocol) tools:
${Object.entries(MCP_REGISTRY).map(([key, config]) => 
  `- ${config.mcp}: ${config.tools.join(', ')}`
).join('\n')}

When responding, you can indicate which MCP tools would be helpful by mentioning them naturally in your response.
${mcpContext ? `\nMCP Context available: ${JSON.stringify(mcpContext)}` : ''}`;

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      temperature: 0.7,
      system: enhancedPrompt,
      messages: messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Generate content using relevant MCPs
async function generateContentWithMCPs(
  type: string,
  context: string,
  relevantMCPs: string[]
): Promise<Artifact> {
  const mcpResults: MCPToolCall[] = [];
  
  // Call relevant MCP tools based on content type
  if (type === 'media-list' && relevantMCPs.includes('signaldesk-media')) {
    const result = await callMCPTool('signaldesk-media', 'discover_journalists', { context });
    mcpResults.push({ mcp: 'signaldesk-media', tool: 'discover_journalists', params: { context }, result });
  }
  
  if (type === 'strategic-plan' && relevantMCPs.includes('signaldesk-campaigns')) {
    const result = await callMCPTool('signaldesk-campaigns', 'plan_campaign', { context });
    mcpResults.push({ mcp: 'signaldesk-campaigns', tool: 'plan_campaign', params: { context }, result });
  }
  
  if (type === 'crisis-response' && relevantMCPs.includes('signaldesk-crisis')) {
    const severity = await callMCPTool('signaldesk-crisis', 'assess_crisis_severity', { context });
    const response = await callMCPTool('signaldesk-crisis', 'generate_crisis_response', { context, severity });
    mcpResults.push(
      { mcp: 'signaldesk-crisis', tool: 'assess_crisis_severity', params: { context }, result: severity },
      { mcp: 'signaldesk-crisis', tool: 'generate_crisis_response', params: { context }, result: response }
    );
  }
  
  // Generate enhanced content using MCP data
  const enhancedContent = await generateContent(type, context, mcpResults);
  
  return {
    id: `artifact-${Date.now()}`,
    type,
    title: generateTitle(type, context),
    created: new Date().toISOString(),
    content: enhancedContent,
    mcpSources: relevantMCPs
  };
}

// Generate content based on type and MCP data
async function generateContent(type: string, context: string, mcpData: MCPToolCall[]): Promise<any> {
  // This would use MCP data to enhance content generation
  const contentTemplates: Record<string, any> = {
    'media-list': {
      title: 'Target Media Contacts',
      journalists: mcpData.find(d => d.tool === 'discover_journalists')?.result?.journalists || [],
      strategy: 'Personalized outreach based on beat alignment'
    },
    'strategic-plan': {
      title: 'PR Strategic Plan',
      phases: ['Research & Analysis', 'Strategy Development', 'Execution', 'Measurement'],
      timeline: '90 days',
      kpis: ['Media mentions', 'Share of voice', 'Sentiment score']
    },
    'crisis-response': {
      title: 'Crisis Response Plan',
      severity: mcpData.find(d => d.tool === 'assess_crisis_severity')?.result || 'medium',
      immediate_actions: ['Assess situation', 'Prepare statement', 'Alert stakeholders'],
      communication_plan: mcpData.find(d => d.tool === 'generate_crisis_response')?.result
    }
  };
  
  return contentTemplates[type] || { content: context };
}

// Generate title for artifact
function generateTitle(type: string, context: string): string {
  const titles: Record<string, string> = {
    'media-list': 'Media Contact List',
    'press-release': 'Press Release',
    'strategic-plan': 'Strategic PR Plan',
    'crisis-response': 'Crisis Response Plan',
    'social-content': 'Social Media Content',
    'key-messaging': 'Key Messages',
    'faq-document': 'FAQ Document'
  };
  
  return titles[type] || 'Generated Content';
}

// Detect content request type
function detectContentType(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('crisis') || lowerMessage.includes('emergency')) {
    return 'crisis-response';
  }
  
  const contentTriggers = {
    'media-list': ['media list', 'journalist list', 'reporter list'],
    'press-release': ['press release', 'announcement'],
    'strategic-plan': ['strategic plan', 'pr strategy', 'campaign plan'],
    'social-content': ['social media', 'social posts'],
    'key-messaging': ['key messages', 'talking points'],
    'faq-document': ['faq', 'frequently asked questions']
  };
  
  for (const [type, triggers] of Object.entries(contentTriggers)) {
    for (const trigger of triggers) {
      if (lowerMessage.includes(trigger)) {
        return type;
      }
    }
  }
  
  return null;
}

// Main handler
serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], userId, sessionId } = await req.json() as Request;
    
    // Detect relevant MCPs for this request
    const relevantMCPs = detectRelevantMCPs(message);
    
    // Detect if this is a content creation request
    const contentType = detectContentType(message);
    
    // Build conversation for Claude
    const messages: ChatMessage[] = [
      ...conversationHistory,
      { role: 'user', content: message, mcpTools: relevantMCPs }
    ];
    
    let response: Response;
    
    if (contentType && conversationHistory.length >= 2) {
      // Generate content with MCP integration
      const context = conversationHistory.map(m => m.content).join('\n');
      const artifact = await generateContentWithMCPs(contentType, context, relevantMCPs);
      
      const chatMessage = await callClaudeWithMCPContext(
        messages,
        `You are Niv, an expert PR strategist with access to SignalDesk's MCP tools. 
        You've just created a ${contentType} using data from: ${relevantMCPs.join(', ')}.
        Briefly explain what you've created and how the MCPs enhanced it.`,
        { artifact, mcps: relevantMCPs }
      );
      
      response = { 
        chatMessage, 
        artifact,
        mcpCalls: relevantMCPs.map(mcp => ({ 
          mcp, 
          tool: 'integrated', 
          params: { message } 
        }))
      };
    } else {
      // Regular consultation with MCP awareness
      const chatMessage = await callClaudeWithMCPContext(
        messages,
        `You are Niv, an expert PR strategist with access to SignalDesk's MCP tools.
        Currently available MCPs for this conversation: ${relevantMCPs.join(', ')}.
        Provide strategic PR consultation while mentioning which MCP tools could help.
        ${contentType ? `Note: The user seems interested in creating a ${contentType}. Guide them toward providing more context.` : ''}`,
        { availableMCPs: relevantMCPs }
      );
      
      response = { 
        chatMessage,
        mcpCalls: relevantMCPs.map(mcp => ({ 
          mcp, 
          tool: 'available', 
          params: { message } 
        }))
      };
    }
    
    // Log the interaction
    await supabase.from('niv_interactions').insert({
      user_id: userId,
      session_id: sessionId,
      message,
      response: response.chatMessage,
      mcps_used: relevantMCPs,
      artifact_created: !!response.artifact,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});