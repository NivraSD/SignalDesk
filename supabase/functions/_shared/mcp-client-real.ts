/**
 * Real MCP Client - Connects to deployed MCP Edge Functions
 * This replaces the fake mcp-client.ts that bypassed MCPs
 */

export interface MCPResponse {
  success: boolean;
  analysis?: any;
  profile?: any;
  tools?: any[];
  error?: string;
  content?: any;
  [key: string]: any;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: any;
}

/**
 * MCP Registry - Maps tools to their deployed MCP services
 */
const MCP_REGISTRY = {
  // Discovery & Monitoring
  'create_organization_profile': 'mcp-discovery',
  'get_organization_profile': 'mcp-discovery',
  'assign_sources_to_tabs': 'mcp-discovery',
  
  'start_monitoring': 'mcp-monitor',
  'stop_monitoring': 'mcp-monitor',
  'get_live_intelligence': 'mcp-monitor',
  'analyze_trending_with_sarah': 'mcp-monitor',
  
  // Orchestration
  'orchestrate_parallel_analysis': 'mcp-orchestrator',
  'route_to_specialist': 'mcp-orchestrator',
  
  // Competition Analysis (Marcus Chen)
  'analyze_competition_with_personality': 'mcp-intelligence',
  'analyze_competitive_landscape': 'mcp-intelligence',
  'track_competitor_moves': 'mcp-intelligence',
  
  // Stakeholder Analysis (Victoria Chen)
  'analyze_stakeholders_with_victoria': 'mcp-media',
  'analyze_power_dynamics': 'mcp-media',
  'track_executive_moves': 'mcp-media',
  
  // Market Analysis
  'analyze_market': 'mcp-analytics',
  'analyze_market_dynamics': 'mcp-analytics',
  'track_market_signals': 'mcp-analytics',
  
  // Cascade Detection (Helena Cross)
  'detect_cascades': 'mcp-scraper',
  'analyze_weak_signals': 'mcp-scraper',
  'identify_paradigm_shifts': 'mcp-scraper',
  
  // Executive Synthesis
  'synthesize_intelligence': 'mcp-executive',
  'create_executive_summary': 'mcp-executive',
  'synthesize_executive_intelligence': 'mcp-executive-synthesis',
  
  // Additional MCPs
  'analyze_campaigns': 'mcp-campaigns',
  'analyze_content': 'mcp-content',
  'detect_crisis': 'mcp-crisis',
  'extract_entities': 'mcp-entities',
  'store_memory': 'mcp-memory',
  'track_narratives': 'mcp-narratives',
  'detect_opportunities': 'mcp-opportunities',
  'monitor_regulatory': 'mcp-regulatory',
  'map_relationships': 'mcp-relationships',
  'analyze_social': 'mcp-social',
  'analyze_stakeholder_groups': 'mcp-stakeholder-groups',
};

/**
 * Real MCP Client that calls deployed Edge Functions
 */
export class MCPClient {
  private supabaseUrl: string;
  private supabaseKey: string;
  private baseUrl: string;
  
  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.baseUrl = `${supabaseUrl}/functions/v1`;
  }
  
  /**
   * Call an MCP tool
   */
  async callTool(toolName: string, args: any): Promise<MCPResponse> {
    console.log(`🔧 Calling MCP tool: ${toolName}`);
    
    // Find which MCP handles this tool
    const mcpService = MCP_REGISTRY[toolName];
    if (!mcpService) {
      console.error(`❌ Unknown tool: ${toolName}`);
      return {
        success: false,
        error: `Tool '${toolName}' not found in MCP registry`
      };
    }
    
    console.log(`   → Routing to ${mcpService}`);
    
    try {
      // Call the actual MCP Edge Function
      const response = await fetch(`${this.baseUrl}/${mcpService}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          tool: toolName,
          arguments: args
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ MCP call failed: ${response.status} - ${errorText}`);
        return {
          success: false,
          error: `MCP call failed: ${response.status}`
        };
      }
      
      const result = await response.json();
      console.log(`   ✅ MCP call successful`);
      return result;
      
    } catch (error: any) {
      console.error(`❌ MCP call error:`, error);
      return {
        success: false,
        error: error.message || 'MCP call failed'
      };
    }
  }
  
  /**
   * List available tools from an MCP
   */
  async listTools(mcpService: string): Promise<MCPTool[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${mcpService}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          tool: 'list_tools'
        })
      });
      
      if (!response.ok) {
        console.error(`Failed to list tools from ${mcpService}`);
        return [];
      }
      
      const result = await response.json();
      return result.tools || [];
      
    } catch (error) {
      console.error(`Error listing tools from ${mcpService}:`, error);
      return [];
    }
  }
  
  /**
   * Call multiple MCPs in parallel
   */
  async callParallel(calls: Array<{tool: string, args: any}>): Promise<MCPResponse[]> {
    console.log(`🔀 Calling ${calls.length} MCPs in parallel`);
    
    const promises = calls.map(call => this.callTool(call.tool, call.args));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`MCP call ${index} failed:`, result.reason);
        return {
          success: false,
          error: result.reason?.message || 'Call failed'
        };
      }
    });
  }
  
  /**
   * Orchestrate parallel analysis across multiple MCPs
   */
  async orchestrateAnalysis(args: {
    organization: any;
    findings: any[];
    mcps_to_use?: string[];
    depth?: 'quick' | 'standard' | 'deep';
  }): Promise<MCPResponse> {
    const { organization, findings, mcps_to_use, depth = 'standard' } = args;
    
    console.log(`🎭 Orchestrating parallel analysis for ${organization.name || 'organization'}`);
    
    // Call the orchestrator MCP
    return await this.callTool('orchestrate_parallel_analysis', {
      organization,
      findings,
      analysis_config: {
        parallel: true,
        timeout_per_mcp: 20000,
        mcps_to_use: mcps_to_use || [
          'mcp-intelligence',
          'mcp-monitor', 
          'mcp-media',
          'mcp-analytics',
          'mcp-scraper'
        ],
        depth
      }
    });
  }
  
  /**
   * Route analysis to a specific specialist MCP
   */
  async routeToSpecialist(analysisType: string, data: any): Promise<MCPResponse> {
    return await this.callTool('route_to_specialist', {
      analysis_type: analysisType,
      data,
      depth: 'standard'
    });
  }
  
  /**
   * Helper method for competition analysis (Stage 1)
   */
  async analyzeCompetition(findings: any[], organization: any, competition_context?: any): Promise<MCPResponse> {
    console.log('🎯 MCPClient.analyzeCompetition called with:', {
      findingsCount: findings?.length || 0,
      orgName: organization?.name,
      hasFindings: !!findings && findings.length > 0,
      hasCompetitionContext: !!competition_context
    });
    
    const result = await this.callTool('analyze_competition_with_personality', {
      findings,
      organization,
      competition_context,  // Pass the competition context to MCP
      analysis_depth: 'deep'
    });
    
    console.log('🎯 MCPClient.analyzeCompetition result:', {
      success: result?.success,
      hasContent: !!result?.content,
      error: result?.error
    });
    
    return result;
  }
  
  /**
   * Helper method for trending analysis (Stage 2)
   */
  async analyzeTrending(findings: any[], organization: any): Promise<MCPResponse> {
    return await this.callTool('analyze_trending_with_sarah', {
      findings,
      organization,
      analysis_depth: 'standard'
    });
  }
  
  /**
   * Helper method for stakeholder analysis (Stage 3)
   */
  async analyzeStakeholders(findings: any[], organization: any): Promise<MCPResponse> {
    return await this.callTool('analyze_stakeholders_with_victoria', {
      findings,
      organization,
      analysis_depth: 'deep'
    });
  }
  
  /**
   * Helper method for market analysis (Stage 4)
   */
  async analyzeMarket(findings: any[], organization: any): Promise<MCPResponse> {
    return await this.callTool('analyze_market', {
      findings,
      organization,
      analysis_depth: 'standard'
    });
  }
  
  /**
   * Helper method for cascade detection (Stage 5)
   */
  async detectCascades(findings: any[], organization: any): Promise<MCPResponse> {
    return await this.callTool('detect_cascades', {
      findings,
      organization,
      analysis_depth: 'deep'
    });
  }
  
  /**
   * Helper method for executive synthesis
   */
  async synthesize(analyses: any[]): Promise<MCPResponse> {
    return await this.callTool('synthesize_intelligence', {
      analyses,
      format: 'executive_summary'
    });
  }
}

/**
 * Factory function to create MCP client
 */
export function createMCPClient(authHeader?: string): MCPClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  // Try to use the provided auth header, fallback to service role key, then anon key
  const supabaseKey = authHeader?.replace('Bearer ', '') || 
                      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
                      Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      authHeaderProvided: !!authHeader
    });
    throw new Error('Missing Supabase configuration for MCP client');
  }
  
  console.log('🔑 Creating MCP client with:', {
    url: supabaseUrl,
    keyType: authHeader ? 'from_request' : 'from_env',
    keyLength: supabaseKey.length
  });
  
  return new MCPClient(supabaseUrl, supabaseKey);
}

/**
 * Get list of all available MCPs
 */
export function getAvailableMCPs(): string[] {
  const mcps = new Set(Object.values(MCP_REGISTRY));
  return Array.from(mcps);
}

/**
 * Get MCP for a specific tool
 */
export function getMCPForTool(toolName: string): string | undefined {
  return MCP_REGISTRY[toolName];
}