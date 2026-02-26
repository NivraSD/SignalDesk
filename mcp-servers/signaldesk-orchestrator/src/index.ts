/**
 * SignalDesk Orchestrator MCP
 * Coordinates parallel analysis across all specialized MCPs
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Real MCP Client - Makes actual HTTP calls to deployed Supabase Functions
class MCPClient {
  private baseUrl: string;
  private apiKey: string;
  
  constructor(public name: string) {
    this.baseUrl = process.env.SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
    this.apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ANTHROPIC_API_KEY || '';
  }
  
  async call(tool: string, args: any): Promise<any> {
    console.log(`🚀 Calling real ${this.name}.${tool} with args:`, JSON.stringify(args).substring(0, 200) + '...');
    
    try {
      // Map MCP names to actual deployed MCP functions
      const functionMap: { [key: string]: string } = {
        'signaldesk-intelligence': 'mcp-intelligence',
        'signaldesk-monitor': 'mcp-monitor', 
        'signaldesk-media': 'mcp-media',
        'signaldesk-analytics': 'mcp-analytics',
        'signaldesk-scraper': 'mcp-scraper'
      };
      
      const functionName = functionMap[this.name];
      if (!functionName) {
        throw new Error(`No function mapping found for MCP: ${this.name}`);
      }
      
      const url = `${this.baseUrl}/functions/v1/${functionName}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          tool,
          arguments: args
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ${this.name} call failed:`, response.status, errorText);
        throw new Error(`${this.name} API call failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ ${this.name} call completed successfully`);
      
      return {
        success: true,
        mcp: this.name,
        tool,
        data: result, // The actual result from the MCP
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Error calling ${this.name}.${tool}:`, error);
      return {
        success: false,
        mcp: this.name,
        tool,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Initialize MCP connections
const mcpClients = {
  intelligence: new MCPClient('signaldesk-intelligence'),
  monitor: new MCPClient('signaldesk-monitor'),
  media: new MCPClient('signaldesk-media'),
  analytics: new MCPClient('signaldesk-analytics'),
  scraper: new MCPClient('signaldesk-scraper')
};

const TOOLS: Tool[] = [
  {
    name: 'orchestrate_parallel_analysis',
    description: 'Coordinate multiple MCPs in parallel for comprehensive analysis',
    inputSchema: {
      type: 'object',
      properties: {
        organization: { type: 'object', description: 'Target organization' },
        findings: { type: 'array', description: 'Monitoring findings to analyze' },
        analysis_config: {
          type: 'object',
          properties: {
            parallel: { type: 'boolean', default: true },
            timeout_per_mcp: { type: 'number', default: 20000 },
            mcps_to_use: { type: 'array' },
            depth: { type: 'string', enum: ['quick', 'standard', 'deep'] }
          }
        }
      },
      required: ['organization', 'findings']
    }
  },
  {
    name: 'route_to_specialist',
    description: 'Route specific analysis to the appropriate specialist MCP',
    inputSchema: {
      type: 'object',
      properties: {
        analysis_type: { 
          type: 'string',
          enum: ['competition', 'trending', 'stakeholder', 'market', 'cascade']
        },
        data: { type: 'object' },
        depth: { type: 'string', enum: ['quick', 'standard', 'deep'] }
      },
      required: ['analysis_type', 'data']
    }
  }
];

class OrchestratorServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'signaldesk-orchestrator',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'orchestrate_parallel_analysis':
            return await this.orchestrateParallelAnalysis(args as any);
          case 'route_to_specialist':
            return await this.routeToSpecialist(args as any);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    });
  }

  private async orchestrateParallelAnalysis(args: any) {
    const { organization, findings, analysis_config = {} } = args;
    const { 
      parallel = true, 
      timeout_per_mcp = 20000,
      mcps_to_use = ['intelligence', 'monitor', 'media', 'analytics', 'scraper'],
      depth = 'standard'
    } = analysis_config;

    console.log(`🎭 Orchestrating parallel analysis for ${organization.name}`);
    console.log(`📊 MCPs to coordinate: ${mcps_to_use.join(', ')}`);
    console.log(`⏱️ Timeout per MCP: ${timeout_per_mcp}ms`);

    // Tag findings with multi-dimensional relevance
    const taggedFindings = findings.map((f: any) => ({
      ...f,
      relevance: {
        competition: this.calculateRelevance(f, 'competition'),
        trending: this.calculateRelevance(f, 'trending'),
        stakeholder: this.calculateRelevance(f, 'stakeholder'),
        market: this.calculateRelevance(f, 'market'),
        cascade: this.calculateRelevance(f, 'cascade')
      }
    }));

    // Create analysis promises for each MCP
    const analysisPromises = [];

    if (mcps_to_use.includes('intelligence')) {
      analysisPromises.push(
        this.callWithTimeout(
          mcpClients.intelligence.call('analyze_competition_with_personality', {
            findings: taggedFindings.filter((f: any) => f.relevance.competition > 0.5),
            organization,
            analysis_depth: depth
          }),
          timeout_per_mcp,
          'intelligence'
        )
      );
    }

    if (mcps_to_use.includes('monitor')) {
      analysisPromises.push(
        this.callWithTimeout(
          mcpClients.monitor.call('analyze_trending_with_sarah', {
            findings: taggedFindings.filter((f: any) => f.relevance.trending > 0.5),
            organization,
            analysis_depth: depth
          }),
          timeout_per_mcp,
          'monitor'
        )
      );
    }

    if (mcps_to_use.includes('media')) {
      analysisPromises.push(
        this.callWithTimeout(
          mcpClients.media.call('analyze_stakeholders_with_victoria', {
            findings: taggedFindings.filter((f: any) => f.relevance.stakeholder > 0.5),
            organization,
            analysis_depth: depth
          }),
          timeout_per_mcp,
          'media'
        )
      );
    }

    if (mcps_to_use.includes('analytics')) {
      analysisPromises.push(
        this.callWithTimeout(
          mcpClients.analytics.call('analyze_market', {
            findings: taggedFindings.filter((f: any) => f.relevance.market > 0.5),
            organization,
            analysis_depth: depth
          }),
          timeout_per_mcp,
          'analytics'
        )
      );
    }

    if (mcps_to_use.includes('scraper')) {
      analysisPromises.push(
        this.callWithTimeout(
          mcpClients.scraper.call('detect_cascades', {
            findings: taggedFindings.filter((f: any) => f.relevance.cascade > 0.7),
            organization,
            analysis_depth: 'deep' // Always deep for cascade detection
          }),
          timeout_per_mcp,
          'scraper'
        )
      );
    }

    // Execute all analyses in parallel
    const startTime = Date.now();
    const results = parallel 
      ? await Promise.allSettled(analysisPromises)
      : await this.executeSequentially(analysisPromises);

    const duration = Date.now() - startTime;

    // Combine and format results
    const combinedResults = this.combineAnalysisResults(results);

    return {
      content: [{
        type: 'text',
        text: `🎯 Parallel Analysis Complete
        
Organization: ${organization.name}
MCPs Used: ${mcps_to_use.join(', ')}
Execution Mode: ${parallel ? 'PARALLEL' : 'SEQUENTIAL'}
Total Duration: ${duration}ms
Average per MCP: ${Math.round(duration / mcps_to_use.length)}ms

Results Summary:
${JSON.stringify(combinedResults, null, 2)}`,
        metadata: {
          ...combinedResults,
          orchestration_metadata: {
            total_duration: duration,
            parallel_execution: parallel,
            mcps_used: mcps_to_use,
            findings_analyzed: findings.length,
            timestamp: new Date().toISOString()
          }
        }
      }]
    };
  }

  private async routeToSpecialist(args: any) {
    const { analysis_type, data, depth = 'standard' } = args;
    
    const mcpMap: any = {
      competition: 'intelligence',
      trending: 'monitor',
      stakeholder: 'media',
      market: 'analytics',
      cascade: 'scraper'
    };

    const targetMCP = mcpMap[analysis_type];
    if (!targetMCP) {
      throw new Error(`Unknown analysis type: ${analysis_type}`);
    }

    const client = mcpClients[targetMCP as keyof typeof mcpClients];
    const result = await client.call(`analyze_${analysis_type}`, {
      ...data,
      analysis_depth: depth
    });

    return {
      content: [{
        type: 'text',
        text: `Routed to ${targetMCP} for ${analysis_type} analysis`,
        metadata: result
      }]
    };
  }

  private calculateRelevance(finding: any, type: string): number {
    const text = `${finding.title || ''} ${finding.content || ''}`.toLowerCase();
    
    switch (type) {
      case 'competition':
        const competitorTerms = ['competitor', 'rival', 'versus', 'market share', 'compete'];
        return competitorTerms.some(term => text.includes(term)) ? 0.9 : 0.3;
      
      case 'trending':
        const trendTerms = ['trending', 'viral', 'momentum', 'growing', 'surge'];
        return trendTerms.some(term => text.includes(term)) ? 0.9 : 0.4;
      
      case 'stakeholder':
        const stakeholderTerms = ['ceo', 'executive', 'board', 'investor', 'partner'];
        return stakeholderTerms.some(term => text.includes(term)) ? 0.9 : 0.3;
      
      case 'market':
        const marketTerms = ['market', 'industry', 'growth', 'revenue', 'forecast'];
        return marketTerms.some(term => text.includes(term)) ? 0.9 : 0.4;
      
      case 'cascade':
        const cascadeTerms = ['breakthrough', 'disruption', 'shift', 'transform', 'revolution'];
        return cascadeTerms.some(term => text.includes(term)) ? 0.8 : 0.2;
      
      default:
        return 0.5;
    }
  }

  private async callWithTimeout(promise: Promise<any>, timeout: number, mcpName: string) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`${mcpName} timeout after ${timeout}ms`)), timeout)
      )
    ]);
  }

  private async executeSequentially(promises: Promise<any>[]) {
    const results = [];
    for (const promise of promises) {
      try {
        results.push({ status: 'fulfilled', value: await promise });
      } catch (error) {
        results.push({ status: 'rejected', reason: error });
      }
    }
    return results;
  }

  private combineAnalysisResults(results: any[]) {
    const combined: any = {
      competition: null,
      trending: null,
      stakeholder: null,
      market: null,
      cascade: null,
      mcps_completed: 0,
      mcps_failed: 0
    };

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value && result.value.success) {
        combined.mcps_completed++;
        
        const mcpName = result.value.mcp;
        const mcpData = result.value.data;
        
        // Map MCP names to result keys and extract actual data
        if (mcpName === 'signaldesk-intelligence') {
          combined.competition = mcpData;
        } else if (mcpName === 'signaldesk-monitor') {
          combined.trending = mcpData;
        } else if (mcpName === 'signaldesk-media') {
          combined.stakeholder = mcpData;
        } else if (mcpName === 'signaldesk-analytics') {
          combined.market = mcpData;
        } else if (mcpName === 'signaldesk-scraper') {
          combined.cascade = mcpData;
        }
      } else {
        combined.mcps_failed++;
        console.error('MCP call failed:', result.reason || result.value?.error);
      }
    });

    return combined;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("SignalDesk Orchestrator MCP running");
  }
}

const server = new OrchestratorServer();
server.run().catch(console.error);
