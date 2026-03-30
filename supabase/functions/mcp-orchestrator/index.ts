import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MCPClient {
  name: string;
  functionName: string;
}

const mcpClients: MCPClient[] = [
  { name: 'signaldesk-intelligence', functionName: 'mcp-intelligence' },
  { name: 'signaldesk-monitor', functionName: 'mcp-monitor' }, 
  { name: 'signaldesk-media', functionName: 'mcp-media' },
  { name: 'signaldesk-analytics', functionName: 'mcp-analytics' },
  { name: 'signaldesk-scraper', functionName: 'mcp-scraper' }
];

async function callMCP(client: MCPClient, tool: string, args: any): Promise<any> {
  console.log(`🚀 Calling ${client.name}.${tool}`);
  
  try {
    const response = await fetch(`https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/${client.functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        tool,
        arguments: args
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ${client.name} call failed:`, response.status, errorText);
      throw new Error(`${client.name} API call failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✅ ${client.name} call completed successfully`);
    
    return {
      success: true,
      mcp: client.name,
      tool,
      data: result,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`❌ Error calling ${client.name}.${tool}:`, error);
    return {
      success: false,
      mcp: client.name,
      tool,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

function calculateRelevance(finding: any, type: string): number {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log('🎭 Orchestrator received request:', JSON.stringify(requestBody).substring(0, 500));
    
    // Handle different request formats - direct orchestrator call vs monitoring data
    let organization, findings, analysis_config = {};
    
    if (requestBody.monitoring_data && requestBody.monitoring_data.findings) {
      // Format from HTML: { organization_name, organization, monitoring_data: { findings: [...] } }
      organization = requestBody.organization;
      findings = requestBody.monitoring_data.findings;
      console.log(`📊 Found findings in monitoring_data: ${findings?.length || 0} items`);
    } else if (requestBody.findings) {
      // Direct format: { organization, findings: [...] }
      organization = requestBody.organization;
      findings = requestBody.findings;
      console.log(`📊 Found findings in direct format: ${findings?.length || 0} items`);
    } else {
      console.log('❌ No findings found in request. Keys:', Object.keys(requestBody));
      console.log('❌ monitoring_data structure:', JSON.stringify(requestBody.monitoring_data));
      throw new Error('No findings provided in request');
    }
    
    const { 
      parallel = true, 
      timeout_per_mcp = 20000,
      mcps_to_use = ['intelligence', 'monitor', 'media', 'analytics', 'scraper'],
      depth = 'standard'
    } = analysis_config;

    console.log(`🎭 Orchestrating parallel analysis for ${organization?.name}`);
    console.log(`📊 MCPs to coordinate: ${mcps_to_use.join(', ')}`);
    console.log(`📰 Findings to analyze: ${findings?.length || 0} items`);

    // Tag findings with multi-dimensional relevance
    const taggedFindings = findings?.map((f: any) => ({
      ...f,
      relevance: {
        competition: calculateRelevance(f, 'competition'),
        trending: calculateRelevance(f, 'trending'),
        stakeholder: calculateRelevance(f, 'stakeholder'),
        market: calculateRelevance(f, 'market'),
        cascade: calculateRelevance(f, 'cascade')
      }
    })) || [];

    // Create analysis promises for each MCP
    const analysisPromises = [];

    if (mcps_to_use.includes('intelligence')) {
      const client = mcpClients.find(c => c.name === 'signaldesk-intelligence')!;
      analysisPromises.push(
        callMCP(client, 'analyze_competition_with_personality', {
          findings: taggedFindings.filter((f: any) => f.relevance.competition > 0.5),
          organization,
          analysis_depth: depth
        })
      );
    }

    if (mcps_to_use.includes('monitor')) {
      const client = mcpClients.find(c => c.name === 'signaldesk-monitor')!;
      analysisPromises.push(
        callMCP(client, 'analyze_trending_with_sarah', {
          findings: taggedFindings.filter((f: any) => f.relevance.trending > 0.5),
          organization,
          analysis_depth: depth
        })
      );
    }

    if (mcps_to_use.includes('media')) {
      const client = mcpClients.find(c => c.name === 'signaldesk-media')!;
      analysisPromises.push(
        callMCP(client, 'analyze_stakeholders_with_victoria', {
          findings: taggedFindings.filter((f: any) => f.relevance.stakeholder > 0.5),
          organization,
          analysis_depth: depth
        })
      );
    }

    if (mcps_to_use.includes('analytics')) {
      const client = mcpClients.find(c => c.name === 'signaldesk-analytics')!;
      analysisPromises.push(
        callMCP(client, 'analyze_market', {
          findings: taggedFindings.filter((f: any) => f.relevance.market > 0.5),
          organization,
          analysis_depth: depth
        })
      );
    }

    if (mcps_to_use.includes('scraper')) {
      const client = mcpClients.find(c => c.name === 'signaldesk-scraper')!;
      analysisPromises.push(
        callMCP(client, 'detect_cascades', {
          findings: taggedFindings.filter((f: any) => f.relevance.cascade > 0.7),
          organization,
          analysis_depth: 'deep' // Always deep for cascade detection
        })
      );
    }

    console.log(`🚀 Starting ${analysisPromises.length} MCP analyses in ${parallel ? 'PARALLEL' : 'SEQUENCE'}`);

    // Execute all analyses in parallel
    const startTime = Date.now();
    const results = parallel 
      ? await Promise.allSettled(analysisPromises)
      : await executeSequentially(analysisPromises);

    const duration = Date.now() - startTime;

    // Combine and format results
    const combinedResults = combineAnalysisResults(results);

    console.log(`✅ Orchestration complete: ${combinedResults.mcps_completed} successful, ${combinedResults.mcps_failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        results: combinedResults,
        orchestration_metadata: {
          total_duration: duration,
          parallel_execution: parallel,
          mcps_used: mcps_to_use,
          findings_analyzed: findings?.length || 0,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Orchestrator error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function executeSequentially(promises: Promise<any>[]) {
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

function combineAnalysisResults(results: any[]) {
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
