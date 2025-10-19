import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Enhanced Intelligence Orchestrator - Category-based routing with staggered execution
 */

// Source category to stage mapping
const CATEGORY_TO_STAGE_MAP = {
  'competitive': 'competition',
  'media': 'trending', 
  'regulatory': 'stakeholders',
  'market': 'market',
  'forward': 'forward_looking',
  'specialized': ['competition', 'trending'], // Can go to multiple
  'profile': 'all' // Custom feeds go everywhere
};

// Identify cross-cutting stories that appear in multiple relevance categories
function identifyCrossCuttingStories(findings: any[]) {
  return findings.filter(f => {
    if (!f.relevance) return false;
    const scores = Object.values(f.relevance);
    const highScores = scores.filter((score: any) => score > 0.6);
    return highScores.length >= 3; // Story relevant to 3+ stages
  });
}

// Route findings to appropriate stages based on source category and relevance
function routeFindingsToStages(monitoring_data: any) {
  const findings = monitoring_data?.findings || [];
  console.log(`📋 Routing ALL ${findings.length} findings to ALL stages (no filtering, just prioritization)...`);
  
  if (findings.length === 0) {
    console.log('⚠️ No findings to route');
    return {
      competition: [],
      stakeholders: [],
      market: [],
      trending: [],
      forward_looking: []
    };
  }
  
  // Map stage names to relevance keys
  const stageKeyMap = {
    'competition': 'competition',
    'trending': 'trending',
    'stakeholders': 'stakeholder',  // Note: singular in relevance
    'market': 'market',
    'forward_looking': 'forward'     // Note: shortened in relevance
  };
  
  // Initialize stage data - ALL stories go to ALL stages
  const stageData = {};
  
  Object.keys(stageKeyMap).forEach(stage => {
    // Clone all findings for this stage
    stageData[stage] = findings.map(finding => {
      // Mark cross-cutting stories (relevant to 3+ stages at >0.5 threshold)
      let is_cross_cutting = false;
      if (finding.relevance) {
        const relevanceValues = Object.values(finding.relevance);
        const highRelevanceCount = relevanceValues.filter((score: any) => score > 0.5).length;
        if (highRelevanceCount >= 3) {
          is_cross_cutting = true;
        }
      }
      
      return {
        ...finding,
        is_cross_cutting,
        routing_reason: 'universal_routing_with_prioritization'
      };
    });
    
    // Sort by relevance for this specific stage
    stageData[stage].sort((a, b) => {
      // Prioritize cross-cutting stories
      if (a.is_cross_cutting && !b.is_cross_cutting) return -1;
      if (!a.is_cross_cutting && b.is_cross_cutting) return 1;
      
      // Then sort by stage-specific relevance
      const stageKey = stageKeyMap[stage];
      const aScore = a.relevance?.[stageKey] || 0;
      const bScore = b.relevance?.[stageKey] || 0;
      return bScore - aScore;
    });
    
    // Cap at 25 stories per stage
    stageData[stage] = stageData[stage].slice(0, 25);
  });
  
  // Log routing results
  console.log('📊 Universal Routing Results (top 25 per stage):');
  Object.entries(stageData).forEach(([stage, stageFindings]) => {
    const topScore = stageFindings[0]?.relevance?.[stageKeyMap[stage]] || 0;
    const avgScore = stageFindings.length > 0 
      ? stageFindings.reduce((sum, f) => sum + (f.relevance?.[stageKeyMap[stage]] || 0), 0) / stageFindings.length 
      : 0;
    console.log(`  ${stage}: ${stageFindings.length} findings (top: ${topScore.toFixed(3)}, avg: ${avgScore.toFixed(3)})`);
  });
  
  return stageData;
}

// Create monitoring data for a specific stage
function createStageMonitoringData(monitoring_data: any, stageName: string, routedFindings: any[]) {
  return {
    findings: routedFindings,
    raw_signals: routedFindings, // Competition stage also looks for raw_signals
    total_articles: routedFindings.length,
    raw_count: routedFindings.length,
    routing_metadata: {
      stage: stageName,
      original_count: monitoring_data?.findings?.length || 0,
      routed_count: routedFindings.length,
      cross_cutting_count: routedFindings.filter(f => f.is_cross_cutting).length
    },
    // Include some context from original monitoring_data if needed
    organization: monitoring_data?.organization,
    analysis_directive: monitoring_data?.analysis_directive || `Analyze competitive intelligence from ${routedFindings.length} findings`
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { organization, organization_name, profile, monitoring_data, use_staggered = true, stagger_delay = 2000, quick_mode = false } = requestData;
    
    // Handle both organization object and organization_name string
    if (!organization && !organization_name) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Organization data is required',
        service: 'Enhanced Intelligence Orchestrator',
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const orgData = organization || { name: organization_name };
    
    console.log(`🎭 ENHANCED ORCHESTRATION: ${orgData.name || organization_name}`);
    console.log(`📊 Profile data:`, {
      has_profile: !!profile,
      industry: profile?.industry,
      competitors_count: profile?.competition?.direct_competitors?.length || 0,
      first_competitors: profile?.competition?.direct_competitors?.slice(0, 3) || []
    });
    console.log(`📊 Monitoring data:`, {
      has_monitoring_data: !!monitoring_data,
      findings_count: monitoring_data?.findings?.length || 0,
      use_staggered,
      stagger_delay,
      first_finding: monitoring_data?.findings?.[0] ? {
        title: monitoring_data.findings[0].title,
        has_relevance: !!monitoring_data.findings[0].relevance,
        relevance: monitoring_data.findings[0].relevance
      } : 'NO FINDINGS'
    });
    
    // Route findings to appropriate stages
    const routedData = routeFindingsToStages(monitoring_data);
    
    console.log(`📊 Routed data summary:`, {
      competition_count: routedData.competition?.length || 0,
      stakeholders_count: routedData.stakeholders?.length || 0,
      market_count: routedData.market?.length || 0,
      trending_count: routedData.trending?.length || 0,
      forward_looking_count: routedData.forward_looking?.length || 0
    });
    
    const startTime = Date.now();
    const authorization = req.headers.get('Authorization') || '';
    
    // Stage execution functions
    const executeStage = async (stageName: string, stageUrl: string, stageFindings: any[]) => {
      console.log(`🚀 Executing ${stageName} with ${stageFindings.length} findings`);
      
      // Skip stages with no findings to avoid unnecessary API calls
      if (stageFindings.length === 0) {
        console.log(`⏭️ Skipping ${stageName} - no findings routed to this stage`);
        return {
          success: true,
          skipped: true,
          reason: 'No findings routed to this stage',
          tabs: {}
        };
      }
      
      // Log what we're sending
      const monitoringDataForStage = createStageMonitoringData(monitoring_data, stageName, stageFindings);
      console.log(`📦 Sending to ${stageName}:`, {
        findings_count: monitoringDataForStage.findings?.length || 0,
        has_organization: !!orgData,
        use_mcp: true,
        first_finding_title: monitoringDataForStage.findings?.[0]?.title || 'NO FINDINGS',
        first_finding_relevance: monitoringDataForStage.findings?.[0]?.relevance || 'NO RELEVANCE',
        routing_metadata: monitoringDataForStage.routing_metadata
      });
      
      // Extra detailed logging for Competition stage
      if (stageName === 'Competition') {
        console.log(`🔍 DETAILED Competition stage data:`, {
          findings_sample: monitoringDataForStage.findings?.slice(0, 2).map(f => ({
            title: f.title,
            relevance: f.relevance,
            source: f.source,
            has_content: !!f.content
          })),
          total_findings: monitoringDataForStage.findings?.length,
          has_raw_signals: !!monitoringDataForStage.raw_signals,
          raw_signals_count: monitoringDataForStage.raw_signals?.length
        });
      }
      
      try {
        const response = await fetch(stageUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': authorization
          },
          body: JSON.stringify({ 
            organization: typeof orgData === 'string' ? { name: orgData } : orgData,
            organization_name: typeof orgData === 'string' ? orgData : (orgData.name || organization_name),
            profile: profile,  // Pass the discovery profile with competitors
            monitoring_data: createStageMonitoringData(monitoring_data, stageName, stageFindings),
            use_mcp: true,  // RE-ENABLED - MCP intelligence now properly deployed
            analysis_depth: quick_mode ? 'minimal' : 'standard'
          })
        });
        
        const result = await response.json();
        console.log(`✅ ${stageName} complete`);
        return result;
      } catch (error) {
        console.error(`❌ ${stageName} failed:`, error);
        return {
          success: false,
          error: error.message || 'Stage execution failed',
          stage: stageName
        };
      }
    };
    
    // Initialize all stages with default values
    let stage1 = { status: 'pending', value: null };
    let stage2 = { status: 'pending', value: null };
    let stage3 = { status: 'pending', value: null };
    let stage4 = { status: 'pending', value: null };
    let stage5 = { status: 'pending', value: null };
    
    if (use_staggered) {
      console.log('🎯 TESTING MODE: Only running Competition stage');
      
      // TEMPORARY: Only run Competition stage for testing
      console.log('📦 Running Competition ONLY');
      const batch1 = await Promise.allSettled([
        executeStage('Competition', 
          'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-1-competitors',
          routedData.competition)
      ]);
      stage1 = batch1[0];
      // Fake the other stages as skipped
      stage2 = { status: 'fulfilled', value: { success: true, skipped: true, reason: 'Testing mode - only Competition enabled' } };
      
      // TEMPORARY: Skip other batches for testing
      console.log('⏭️ Skipping Batch 2 & 3 for testing mode');
      stage3 = { status: 'fulfilled', value: { success: true, skipped: true, reason: 'Testing mode - only Competition enabled' } };
      stage4 = { status: 'fulfilled', value: { success: true, skipped: true, reason: 'Testing mode - only Competition enabled' } };
      stage5 = { status: 'fulfilled', value: { success: true, skipped: true, reason: 'Testing mode - only Competition enabled' } };
      
    } else {
      console.log('🚀 TESTING MODE: Only running Competition stage (non-staggered)');
      
      // TEMPORARY: Only run Competition for testing
      [stage1] = await Promise.allSettled([
        executeStage('Competition', 
          'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-1-competitors',
          routedData.competition)
      ]);
      // Fake the other stages as skipped
      stage2 = { status: 'fulfilled', value: { success: true, skipped: true, reason: 'Testing mode - only Competition enabled' } };
      stage3 = { status: 'fulfilled', value: { success: true, skipped: true, reason: 'Testing mode - only Competition enabled' } };
      stage4 = { status: 'fulfilled', value: { success: true, skipped: true, reason: 'Testing mode - only Competition enabled' } };
      stage5 = { status: 'fulfilled', value: { success: true, skipped: true, reason: 'Testing mode - only Competition enabled' } };
    }

    const duration = Date.now() - startTime;

    // Combine results (same as original)
    const results = {
      competition: stage1.status === 'fulfilled' ? stage1.value : null,
      trending: stage2.status === 'fulfilled' ? stage2.value : null,
      stakeholders: stage3.status === 'fulfilled' ? stage3.value : null,
      market: stage4.status === 'fulfilled' ? stage4.value : null,
      forward_looking: stage5.status === 'fulfilled' ? stage5.value : null,
      metadata: {
        execution_mode: use_staggered ? 'staggered' : 'parallel',
        stagger_delay: use_staggered ? stagger_delay : 0,
        total_duration: duration,
        stages_completed: [stage1, stage2, stage3, stage4, stage5].filter(s => s.status === 'fulfilled').length,
        routing_summary: {
          total_findings: monitoring_data?.findings?.length || 0,
          cross_cutting_stories: identifyCrossCuttingStories(monitoring_data?.findings || []).length,
          competition_routed: routedData.competition.length,
          trending_routed: routedData.trending.length,
          stakeholders_routed: routedData.stakeholders.length,
          market_routed: routedData.market.length,
          forward_looking_routed: routedData.forward_looking.length
        }
      }
    };

    console.log(`✅ ORCHESTRATION COMPLETE in ${duration}ms`);
    console.log(`   Mode: ${use_staggered ? 'STAGGERED' : 'PARALLEL'}`);
    console.log(`   Stages completed: ${results.metadata.stages_completed}/5`);
    
    // Log detailed stage status
    console.log('Stage Status Details:');
    console.log(`  Competition: ${stage1.status} - Has value: ${!!stage1.value}`);
    console.log(`  Trending: ${stage2.status} - Has value: ${!!stage2.value}`);
    console.log(`  Stakeholders: ${stage3.status} - Has value: ${!!stage3.value}`);
    console.log(`  Market: ${stage4.status} - Has value: ${!!stage4.value}`);
    console.log(`  Forward: ${stage5.status} - Has value: ${!!stage5.value}`);

    const responseData = {
      success: true,
      results,
      metadata: results.metadata
    };
    
    console.log('Sending response with size:', JSON.stringify(responseData).length, 'bytes');

    return new Response(JSON.stringify(responseData), {
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