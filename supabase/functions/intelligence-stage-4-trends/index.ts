import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { analyzeWithClaudeTrends } from './claude-analyst.ts';

/**
 * Stage 4: Trend Analysis - MINIMAL VERSION
 * Only Claude analysis, no fallback bloat
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { organization, previousResults = {} } = await req.json();
    console.log(`📈 Stage 4: Trend Analysis for ${organization.name}`);
    
    const startTime = Date.now();
    
    // Get monitoring data
    let monitoringData = {};
    try {
      const response = await fetch(
        'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            action: 'retrieve',
            organization_name: organization.name,
            limit: 50
          })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        monitoringData = {
          findings: data.data?.findings || [],
          previous_results: previousResults
        };
      }
    } catch (e) {
      console.log('Could not retrieve monitoring data:', e);
    }
    
    // Use Claude - that's it!
    const results = await analyzeWithClaudeTrends(
      organization,
      monitoringData,
      {
        // Minimal fallback if Claude fails
        current_trends: {},
        emerging_opportunities: [],
        disruption_signals: [],
        pr_opportunities: [],
        metadata: {
          stage: 4,
          duration: Date.now() - startTime,
          data_source: 'claude_trend_forecaster'
        }
      }
    );
    
    results.metadata.duration = Date.now() - startTime;
    console.log(`✅ Stage 4 complete in ${results.metadata.duration}ms`);
    
    // Save results
    try {
      await fetch(
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
            stage: 'trends_analysis',
            stage_data: results,
            metadata: results.metadata
          })
        }
      );
      console.log('💾 Stage 4 results saved');
    } catch (e) {
      console.log('Could not save results:', e);
    }

    return new Response(JSON.stringify({
      success: true,
      stage: 'trends_analysis',
      data: results,
      intelligence: monitoringData // Pass through monitoring data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Stage 4 Error:', error);
    return new Response(JSON.stringify({
      success: false,
      stage: 'trends_analysis',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});