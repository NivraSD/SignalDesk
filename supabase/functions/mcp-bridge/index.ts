import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { mcp, tool, params } = await req.json()

    // Route to appropriate MCP handler
    let result;
    switch(mcp) {
      case 'intelligence':
        result = await handleIntelligenceMCP(supabase, tool, params)
        break
      case 'relationships':
        result = await handleRelationshipsMCP(supabase, tool, params)
        break
      case 'analytics':
        result = await handleAnalyticsMCP(supabase, tool, params)
        break
      case 'content':
        result = await handleContentMCP(supabase, tool, params)
        break
      default:
        throw new Error(`Unknown MCP: ${mcp}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('MCP Bridge Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function handleIntelligenceMCP(supabase: any, tool: string, params: any) {
  switch(tool) {
    case 'market_narrative_tracking':
      // Track market narratives
      const narratives = await supabase
        .from('intelligence_findings')
        .select('*')
        .ilike('content', `%${params.keywords}%`)
        .order('created_at', { ascending: false })
        .limit(10)
      
      return {
        tool: 'market_narrative_tracking',
        narratives: narratives.data || [],
        keywords: params.keywords,
        timestamp: new Date().toISOString()
      }

    case 'stakeholder_sentiment_analysis':
      // Analyze stakeholder sentiment
      const sentiments = await supabase
        .from('sentiment_analysis')
        .select('*')
        .eq('target_id', params.stakeholder_id)
        .order('created_at', { ascending: false })
        .limit(5)
      
      return {
        tool: 'stakeholder_sentiment_analysis',
        sentiments: sentiments.data || [],
        stakeholder_id: params.stakeholder_id
      }

    default:
      return { message: `Intelligence tool ${tool} not implemented yet` }
  }
}

async function handleRelationshipsMCP(supabase: any, tool: string, params: any) {
  switch(tool) {
    case 'find_best_journalists':
      // Find journalists for a specific beat
      const journalists = await supabase
        .from('media_contacts')
        .select('*')
        .contains('beats', [params.beat])
        .order('influence_score', { ascending: false })
        .limit(10)
      
      return {
        tool: 'find_best_journalists',
        journalists: journalists.data || [],
        beat: params.beat
      }

    case 'analyze_journalist_preferences':
      // Get journalist preferences
      const preferences = await supabase
        .from('journalist_interactions')
        .select('*')
        .eq('journalist_id', params.journalist_id)
        .order('created_at', { ascending: false })
      
      return {
        tool: 'analyze_journalist_preferences',
        preferences: preferences.data || [],
        journalist_id: params.journalist_id
      }

    default:
      return { message: `Relationships tool ${tool} not implemented yet` }
  }
}

async function handleAnalyticsMCP(supabase: any, tool: string, params: any) {
  switch(tool) {
    case 'generate_performance_dashboard':
      // Get performance metrics
      const metrics = await supabase
        .from('campaign_metrics')
        .select('*')
        .gte('created_at', params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
      
      return {
        tool: 'generate_performance_dashboard',
        metrics: metrics.data || [],
        period: params.period || '30d'
      }

    case 'opportunity_scoring':
      // Score opportunities
      const opportunities = await supabase
        .from('opportunities')
        .select('*')
        .order('score', { ascending: false })
        .limit(params.limit || 10)
      
      return {
        tool: 'opportunity_scoring',
        opportunities: opportunities.data || [],
        scoring_criteria: params.criteria
      }

    default:
      return { message: `Analytics tool ${tool} not implemented yet` }
  }
}

async function handleContentMCP(supabase: any, tool: string, params: any) {
  switch(tool) {
    case 'generate_pitch':
      // Generate a pitch based on opportunity
      const opportunity = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', params.opportunity_id)
        .single()
      
      // Get relevant templates
      const templates = await supabase
        .from('content_templates')
        .select('*')
        .eq('type', 'pitch')
        .limit(3)
      
      return {
        tool: 'generate_pitch',
        opportunity: opportunity.data,
        templates: templates.data || [],
        customization: params.customization
      }

    case 'optimize_press_release':
      // Optimize a press release
      return {
        tool: 'optimize_press_release',
        original: params.content,
        optimizations: [
          'Add more compelling headline',
          'Include relevant statistics',
          'Strengthen call-to-action',
          'Optimize for SEO keywords'
        ],
        seo_keywords: params.keywords
      }

    default:
      return { message: `Content tool ${tool} not implemented yet` }
  }
}