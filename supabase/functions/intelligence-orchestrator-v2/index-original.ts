import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Intelligence Orchestrator - Runs all stages in PARALLEL
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { organization, organization_name, monitoring_data } = requestData;
    
    // Handle both organization object and organization_name string
    if (!organization && !organization_name) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Organization data is required',
        service: 'Intelligence Orchestrator',
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const orgData = organization || { name: organization_name };

    console.log(`🎭 PARALLEL ORCHESTRATION: Running all 5 stages simultaneously for ${orgData.name || organization_name}`);
    console.log(`📊 Monitoring data received:`, {
      has_monitoring_data: !!monitoring_data,
      findings_count: monitoring_data?.findings?.length || 0,
      total_articles: monitoring_data?.total_articles || 0,
      first_finding: monitoring_data?.findings?.[0]?.title || 'none'
    });
    
    const startTime = Date.now();

    // Run ALL stages in parallel
    const [stage1, stage2, stage3, stage4, stage5] = await Promise.allSettled([
      // Stage 1: Competition (Marcus Chen)
      fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-1-competitors', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || ''
        },
        body: JSON.stringify({ 
          organization: orgData,
          organization_name: orgData.name || organization_name,
          monitoring_data,
          use_mcp: true,   // Use rich personality MCPs
          analysis_depth: 'standard'
        })
      }).then(r => r.json()),
      
      // Stage 2: Trending (Sarah Rodriguez)
      fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-2-trending', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || ''
        },
        body: JSON.stringify({ 
          organization: orgData,
          organization_name: orgData.name || organization_name,
          monitoring_data,
          use_mcp: true,   // Use rich personality MCPs
          analysis_depth: 'standard'
        })
      }).then(r => r.json()),
      
      // Stage 3: Stakeholders (Victoria Chen)
      fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-3-stakeholders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || ''
        },
        body: JSON.stringify({ 
          organization: orgData,
          organization_name: orgData.name || organization_name,
          monitoring_data,
          use_mcp: true,   // Use rich personality MCPs
          analysis_depth: 'standard'
        })
      }).then(r => r.json()),
      
      // Stage 4: Market Intelligence
      fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-4-market', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || ''
        },
        body: JSON.stringify({ 
          organization: orgData,
          organization_name: orgData.name || organization_name,
          monitoring_data,
          use_mcp: true,   // Use rich personality MCPs
          analysis_depth: 'standard'
        })
      }).then(r => r.json()),
      
      // Stage 5: Cascade Detection
      fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-5-forward-looking', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || ''
        },
        body: JSON.stringify({ 
          organization: orgData,
          organization_name: orgData.name || organization_name,
          monitoring_data,
          use_mcp: true
        })
      }).then(r => r.json())
    ]);

    const duration = Date.now() - startTime;

    // Combine results
    const results = {
      competition: stage1.status === 'fulfilled' ? stage1.value : null,
      trending: stage2.status === 'fulfilled' ? stage2.value : null,
      stakeholders: stage3.status === 'fulfilled' ? stage3.value : null,
      market: stage4.status === 'fulfilled' ? stage4.value : null,
      forward_looking: stage5.status === 'fulfilled' ? stage5.value : null,  // Fixed: was 'cascade'
      metadata: {
        parallel_execution: true,
        total_duration: duration,
        stages_completed: [stage1, stage2, stage3, stage4, stage5].filter(s => s.status === 'fulfilled').length,
        personalities_used: [
          'marcus_chen',
          'sarah_rodriguez',
          'victoria_chen',
          'market_intelligence_expert',
          'cascade_detection_specialist'
        ]
      }
    };

    console.log(`✅ PARALLEL ORCHESTRATION COMPLETE in ${duration}ms`);
    console.log(`   Stages completed: ${results.metadata.stages_completed}/5`);
    
    // Log each stage result for debugging
    console.log('📊 Stage Results Summary:');
    if (stage1.status === 'fulfilled') {
      const s1Data = stage1.value;
      console.log(`  Stage 1 (Competition): ${s1Data?.success ? '✅' : '❌'} - Has tabs: ${!!s1Data?.tabs}, Tab keys: ${s1Data?.tabs ? Object.keys(s1Data.tabs).join(', ') : 'none'}`);
    } else {
      console.log(`  Stage 1 (Competition): ❌ Failed - ${stage1.reason}`);
    }
    
    if (stage2.status === 'fulfilled') {
      const s2Data = stage2.value;
      console.log(`  Stage 2 (Trending): ${s2Data?.success ? '✅' : '❌'} - Has tabs: ${!!s2Data?.tabs}, Tab keys: ${s2Data?.tabs ? Object.keys(s2Data.tabs).join(', ') : 'none'}`);
    } else {
      console.log(`  Stage 2 (Trending): ❌ Failed - ${stage2.reason}`);
    }
    
    if (stage3.status === 'fulfilled') {
      const s3Data = stage3.value;
      console.log(`  Stage 3 (Stakeholders): ${s3Data?.success ? '✅' : '❌'} - Has tabs: ${!!s3Data?.tabs}, Tab keys: ${s3Data?.tabs ? Object.keys(s3Data.tabs).join(', ') : 'none'}`);
    } else {
      console.log(`  Stage 3 (Stakeholders): ❌ Failed - ${stage3.reason}`);
    }
    
    if (stage4.status === 'fulfilled') {
      const s4Data = stage4.value;
      console.log(`  Stage 4 (Market): ${s4Data?.success ? '✅' : '❌'} - Has tabs: ${!!s4Data?.tabs}, Tab keys: ${s4Data?.tabs ? Object.keys(s4Data.tabs).join(', ') : 'none'}`);
    } else {
      console.log(`  Stage 4 (Market): ❌ Failed - ${stage4.reason}`);
    }
    
    if (stage5.status === 'fulfilled') {
      const s5Data = stage5.value;
      console.log(`  Stage 5 (Forward): ${s5Data?.success ? '✅' : '❌'} - Has tabs: ${!!s5Data?.tabs}, Tab keys: ${s5Data?.tabs ? Object.keys(s5Data.tabs).join(', ') : 'none'}`);
    } else {
      console.log(`  Stage 5 (Forward): ❌ Failed - ${stage5.reason}`);
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      metadata: results.metadata
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
