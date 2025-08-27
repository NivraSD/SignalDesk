import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { analyzeWithClaudeOpportunities } from './claude-analyst.ts';

/**
 * Opportunity Enhancer - Async enhancement of opportunities from intelligence pipeline
 * Called after main pipeline to provide deeper opportunity analysis
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { 
      organization,
      consolidated_opportunities,
      intelligence_context,
      synthesis_data
    } = requestData;

    console.log(`🎯 Opportunity Enhancement starting for ${organization?.name}`);
    console.log(`📊 Received opportunities:`, {
      from_pipeline: consolidated_opportunities?.prioritized_list?.length || 0,
      has_context: !!intelligence_context,
      has_synthesis: !!synthesis_data
    });

    // Validate we have minimum required data
    if (!organization?.name) {
      throw new Error('Organization name is required');
    }

    if (!consolidated_opportunities && !intelligence_context) {
      throw new Error('Either consolidated opportunities or intelligence context is required');
    }

    const startTime = Date.now();

    // Use Claude to enhance and detect additional opportunities
    const enhancedOpportunities = await analyzeWithClaudeOpportunities(
      organization,
      consolidated_opportunities || {},
      intelligence_context || synthesis_data || {}
    );

    const duration = Date.now() - startTime;
    console.log(`✅ Opportunity enhancement complete in ${duration}ms`);

    // Try to persist enhanced opportunities
    try {
      const persistResponse = await fetch(
        'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            action: 'saveStageData',
            organization_name: organization.name,
            stage: 'opportunity_enhancement',
            stage_data: enhancedOpportunities,
            metadata: {
              duration,
              timestamp: new Date().toISOString(),
              opportunities_found: enhancedOpportunities.immediate_opportunities?.length || 0,
              cascade_predictions: enhancedOpportunities.cascade_opportunities?.length || 0,
              narrative_vacuums: enhancedOpportunities.narrative_vacuums?.length || 0
            }
          })
        }
      );

      if (persistResponse.ok) {
        console.log('💾 Enhanced opportunities saved to database');
      }
    } catch (e) {
      console.log('Could not persist enhanced opportunities:', e);
    }

    return new Response(JSON.stringify({
      success: true,
      opportunities: enhancedOpportunities,
      metadata: {
        duration,
        total_opportunities: countOpportunities(enhancedOpportunities),
        high_priority: countHighPriority(enhancedOpportunities),
        requires_immediate_action: countUrgent(enhancedOpportunities)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Opportunity Enhancement Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      opportunities: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function countOpportunities(opportunities: any): number {
  let count = 0;
  if (opportunities?.immediate_opportunities) count += opportunities.immediate_opportunities.length;
  if (opportunities?.cascade_opportunities) count += opportunities.cascade_opportunities.length;
  if (opportunities?.narrative_vacuums) count += opportunities.narrative_vacuums.length;
  if (opportunities?.competitive_exploitation) count += opportunities.competitive_exploitation.length;
  return count;
}

function countHighPriority(opportunities: any): number {
  let count = 0;
  if (opportunities?.immediate_opportunities) {
    count += opportunities.immediate_opportunities.filter((o: any) => 
      o.urgency === 'HIGH' || o.urgency === 'URGENT'
    ).length;
  }
  return count;
}

function countUrgent(opportunities: any): number {
  let count = 0;
  if (opportunities?.immediate_opportunities) {
    count += opportunities.immediate_opportunities.filter((o: any) => 
      o.urgency === 'URGENT'
    ).length;
  }
  if (opportunities?.opportunity_queue?.urgent_24h) {
    count += opportunities.opportunity_queue.urgent_24h.length;
  }
  return count;
}