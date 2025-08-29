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
    const { organization, previousResults = {}, intelligence } = await req.json();
    console.log(`📈 Stage 4: Trend Analysis for ${organization.name}`);
    
    const startTime = Date.now();
    
    // Extract monitoring data from intelligence prop passed from previous stages
    let monitoringData = intelligence || {};
    
    // If monitoring data not passed, fetch it from database
    if (!monitoringData.findings && !monitoringData.raw_count) {
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

    // Format for UI display - simplified and safe
    let tabs = {};
    try {
      const trendsList = results?.current_trends || [];
      const whiteSpaceList = results?.white_space || [];
      
      tabs = {
        market: {
          market_trends: Array.isArray(trendsList) ? trendsList.map((t: any) => ({
            topic: String(t?.trend || t?.topic || 'Unknown'),
            mentions: Number(t?.signals || t?.mentions || 0),
            trend: String(t?.trajectory || 'stable'),
            sentiment: String(t?.sentiment || 'neutral')
          })) : [],
          summary: `Tracking ${Array.isArray(trendsList) ? trendsList.length : 0} emerging trends`
        },
        thought: {
          topics: Array.isArray(whiteSpaceList) ? whiteSpaceList.map((w: any) => ({
            topic: String(w?.area || w?.topic || 'Unknown'),
            opportunity: String(w?.opportunity || 'Analyzing')
          })) : [],
          recommended_angles: results?.narrative_opportunities || []
        }
      };
    } catch (tabError) {
      console.error('Error creating tabs:', tabError);
      tabs = {
        market: { market_trends: [], summary: 'Analysis in progress' },
        thought: { topics: [], recommended_angles: [] }
      };
    }

    return new Response(JSON.stringify({
      success: true,
      stage: 'trends_analysis',
      data: results,
      intelligence: monitoringData, // Pass through monitoring data
      tabs: tabs // UI-formatted data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Stage 4 Error:', error);
    console.error('Error stack:', error.stack);
    
    // Return more detailed error info for debugging
    return new Response(JSON.stringify({
      success: false,
      stage: 'trends_analysis',
      error: error.message || 'Unknown error occurred',
      errorType: error.name || 'Error',
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});