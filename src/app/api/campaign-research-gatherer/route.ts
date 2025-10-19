import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Campaign Research Gatherer - API Route (No Timeout Constraints)
 *
 * Takes a research plan and executes all the MCP tool calls to gather data.
 * Runs in Next.js API route so it can take as long as needed (no 60s Edge Function limit).
 *
 * Pattern: Like Monitor Stage 1 & 2 - does the heavy data pulling work.
 */

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Campaign Research Gatherer - Starting data collection');
    const { researchPlan, campaignGoal, organizationContext } = await req.json()

    if (!researchPlan) {
      return NextResponse.json({
        success: false,
        error: 'researchPlan is required'
      }, { status: 400 })
    }

    const startTime = Date.now()
    const allResults: any = {
      stakeholder: [],
      narrative: [],
      channel: [],
      historical: []
    }

    // STAGE 1: Stakeholder Research
    if (researchPlan.stakeholderResearch) {
      console.log('📊 Stage 1: Gathering stakeholder data...')
      const { queries, toolsNeeded } = researchPlan.stakeholderResearch

      for (const tool of toolsNeeded || []) {
        for (const query of queries || []) {
          try {
            const result = await callMCPTool(tool, query, organizationContext)
            if (result) {
              allResults.stakeholder.push({ tool, query, data: result })
            }
          } catch (error) {
            console.error(`Error calling ${tool}:`, error)
          }
        }
      }
      console.log(`✅ Stakeholder data: ${allResults.stakeholder.length} results`)
    }

    // STAGE 2: Narrative Research
    if (researchPlan.narrativeResearch) {
      console.log('📰 Stage 2: Gathering narrative data...')
      const { queries, toolsNeeded } = researchPlan.narrativeResearch

      for (const tool of toolsNeeded || []) {
        for (const query of queries || []) {
          try {
            const result = await callMCPTool(tool, query, organizationContext)
            if (result) {
              allResults.narrative.push({ tool, query, data: result })
            }
          } catch (error) {
            console.error(`Error calling ${tool}:`, error)
          }
        }
      }
      console.log(`✅ Narrative data: ${allResults.narrative.length} results`)
    }

    // STAGE 3: Channel Research
    if (researchPlan.channelResearch) {
      console.log('📡 Stage 3: Gathering channel data...')
      const { queries, toolsNeeded } = researchPlan.channelResearch

      for (const tool of toolsNeeded || []) {
        try {
          const result = await callMCPTool(tool, queries?.[0] || '', organizationContext)
          if (result) {
            allResults.channel.push({ tool, data: result })
          }
        } catch (error) {
          console.error(`Error calling ${tool}:`, error)
        }
      }
      console.log(`✅ Channel data: ${allResults.channel.length} results`)
    }

    // STAGE 4: Historical Research
    if (researchPlan.historicalResearch) {
      console.log('📚 Stage 4: Gathering historical data...')
      const { queries, toolsNeeded } = researchPlan.historicalResearch

      for (const tool of toolsNeeded || []) {
        for (const query of queries || []) {
          try {
            const result = await callMCPTool(tool, query, organizationContext)
            if (result) {
              allResults.historical.push({ tool, query, data: result })
            }
          } catch (error) {
            console.error(`Error calling ${tool}:`, error)
          }
        }
      }
      console.log(`✅ Historical data: ${allResults.historical.length} results`)
    }

    const gatheringTime = Date.now() - startTime
    console.log(`🔬 Data gathering complete in ${gatheringTime}ms`)

    return NextResponse.json({
      success: true,
      gatheredData: allResults,
      gatheringTime,
      totalResults: Object.values(allResults).reduce((sum: number, arr: any[]) => sum + arr.length, 0),
      service: 'Campaign Research Gatherer',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Research gathering error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Research gathering failed'
    }, { status: 500 })
  }
}

// Call MCP tool via Supabase Edge Function
async function callMCPTool(tool: string, query: string, orgContext: any) {
  const toolMap: Record<string, string> = {
    'mcp_discovery': 'mcp-discovery',
    'niv_fireplexity': 'niv-fireplexity',
    'journalist_registry': 'journalist-registry',
    'master_source_registry': 'master-source-registry',
    'knowledge_library_registry': 'knowledge-library-registry'
  }

  const functionName = toolMap[tool]
  if (!functionName) {
    console.warn(`Unknown tool: ${tool}`)
    return null
  }

  // Build appropriate payload for each tool
  let payload: any = {}

  if (tool === 'mcp_discovery') {
    payload = {
      organization: orgContext?.name || query,
      industry_hint: orgContext?.industry
    }
  } else if (tool === 'niv_fireplexity') {
    payload = {
      query,
      timeWindow: '7d',
      maxResults: 10
    }
  } else if (tool === 'journalist_registry') {
    payload = {
      industry: orgContext?.industry || query,
      tier: 'tier1',
      count: 20
    }
  } else if (tool === 'master_source_registry') {
    payload = {
      industry: orgContext?.industry || query
    }
  } else if (tool === 'knowledge_library_registry') {
    payload = {
      query,
      limit: 10
    }
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify(payload)
      }
    )

    if (!response.ok) {
      console.error(`${functionName} returned ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error)
    return null
  }
}
