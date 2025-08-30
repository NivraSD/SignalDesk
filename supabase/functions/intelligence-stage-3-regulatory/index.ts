import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { analyzeWithClaudeRegulatory } from './claude-analyst.ts';

/**
 * Stage 3: Regulatory & Stakeholder Analysis - MINIMAL VERSION
 * Only Claude analysis, no fallback bloat
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { organization, previousResults = {}, intelligence } = await req.json();
    console.log(`⚖️ Stage 3: Regulatory & Stakeholder Analysis for ${organization.name}`);
    
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
    const results = await analyzeWithClaudeRegulatory(
      organization,
      monitoringData,
      {
        // Minimal fallback if Claude fails
        regulatory: {
          current_landscape: {},
          recent_developments: [],
          enforcement_trends: {}
        },
        stakeholders: {},
        compliance_requirements: {},
        regulatory_calendar: {},
        risks_and_opportunities: {
          risks: [],
          opportunities: []
        },
        recommendations: {},
        metadata: {
          stage: 3,
          duration: Date.now() - startTime,
          data_source: 'claude_regulatory_expert',
          claude_enhanced: false
        }
      }
    );
    
    results.metadata.duration = Date.now() - startTime;
    console.log(`✅ Stage 3 complete in ${results.metadata.duration}ms`);
    console.log(`📊 Claude enhanced: ${results.metadata?.claude_enhanced || false}`);
    
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
            stage: 'regulatory_analysis',
            stage_data: results,
            metadata: results.metadata
          })
        }
      );
      console.log('💾 Stage 3 results saved');
    } catch (e) {
      console.log('Could not save results:', e);
    }

    // Format for UI display - simplified and safe
    let tabs = {};
    try {
      const regulatoryData = results?.regulatory || {};
      const risksOpps = results?.risks_and_opportunities || {};
      
      tabs = {
        regulatory: {
          developments: regulatoryData?.recent_developments || [],
          compliance_status: regulatoryData?.current_landscape?.compliance_status || 'assessing',
          risks: risksOpps?.risks || [],
          opportunities: risksOpps?.opportunities || [],
          summary: `Tracking ${regulatoryData?.current_landscape?.key_regulators?.length || 0} regulatory bodies`
        }
      };
    } catch (tabError) {
      console.error('Error creating tabs:', tabError);
      tabs = {
        regulatory: {
          developments: [],
          compliance_status: 'assessing',
          risks: [],
          opportunities: [],
          summary: 'Analysis in progress'
        }
      };
    }

    return new Response(JSON.stringify({
      success: true,
      stage: 'regulatory_analysis',
      data: results,
      intelligence: monitoringData, // Pass through monitoring data
      tabs: tabs // UI-formatted data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Stage 3 Error:', error);
    console.error('Error stack:', error.stack);
    
    // Return more detailed error info for debugging
    return new Response(JSON.stringify({
      success: false,
      stage: 'regulatory_analysis',
      error: error.message || 'Unknown error occurred',
      details: error.stack?.substring(0, 500)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});