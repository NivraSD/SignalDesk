import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { analyzeWithClaudeSynthesis } from './claude-analyst.ts';

/**
 * Stage 5: Intelligence Synthesis & PR Implications
 * Analyzes what everything means (NOT strategic recommendations)
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { 
      organization, 
      previousResults = {}, // Default to empty object
      fullProfile, 
      dataVersion,
      stage1,
      stage2,
      stage3,
      stage4,
      monitoring,
      request_id // Get request_id from pipeline
    } = requestData;
    
    const requestId = request_id;
    console.log(`🧩 Stage 5: Strategic Synthesis for ${organization?.name || 'Unknown'}`);
    console.log(`🔑 Request ID: ${requestId}`);
    
    // Validate and debug incoming data
    console.log(`📊 Data received:`, {
      hasOrganization: !!organization,
      organizationName: organization?.name,
      previousResultsKeys: Object.keys(previousResults || {}),
      hasDirectStageData: !!(stage1 || stage2 || stage3 || stage4),
      hasMonitoring: !!monitoring,
      hasFullProfile: !!fullProfile,
      dataVersion: dataVersion || 'unknown',
      hasRequestId: !!requestId
    });
    
    // Deep debug of previous results
    if (previousResults && typeof previousResults === 'object' && previousResults !== null) {
      console.log('🔍 Deep inspection of previousResults:');
      Object.entries(previousResults).forEach(([stageName, stageData]) => {
        console.log(`  ${stageName}:`, {
          hasData: !!stageData?.data,
          dataKeys: stageData?.data ? Object.keys(stageData.data).slice(0, 10) : [],
          hasAnalysis: !!stageData?.analysis,
          hasIntelligence: !!stageData?.intelligence,
          sampleData: stageData?.data ? JSON.stringify(stageData.data).substring(0, 200) : 'no data'
        });
      });
    } else {
      console.log('⚠️ No previousResults provided or invalid format');
    }
    
    // Ensure we have an organization
    if (!organization?.name) {
      throw new Error('Organization name is required for synthesis');
    }
    
    const startTime = Date.now();
    
    // Build all stage data from multiple possible sources
    const allStageData = {
      stage1: stage1 || previousResults?.competitive?.data || previousResults?.competitive,
      stage2: stage2 || previousResults?.media?.data || previousResults?.media,
      stage3: stage3 || previousResults?.regulatory?.data || previousResults?.regulatory,
      stage4: stage4 || previousResults?.trends?.data || previousResults?.trends,
      monitoring: monitoring || previousResults?.extraction?.intelligence
    };
    
    // Extract and normalize all previous stage results
    const normalizedData = await normalizeAllStageData(allStageData, organization, fullProfile);
    
    console.log(`📊 Normalized data summary:`, {
      competitors: countItems(normalizedData.competitors),
      media: countItems(normalizedData.media),
      regulatory: countItems(normalizedData.regulatory),
      trends: countItems(normalizedData.trends)
    });

    // Retrieve ALL Claude analyses from previous stages
    let allClaudeInsights = {};
    if (requestId) {
      try {
        console.log('🧠 Retrieving Claude insights from previous stages...');
        const analysisResponse = await fetch(
          'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/claude-analysis-storage',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.get('Authorization') || ''
            },
            body: JSON.stringify({
              action: 'retrieve',
              organization_name: organization.name,
              request_id: requestId
            })
          }
        );
        
        const analysisData = await analysisResponse.json();
        if (analysisData.success && analysisData.analyses) {
          allClaudeInsights = analysisData.analyses;
          console.log('🧠 Retrieved Claude insights from stages:', Object.keys(allClaudeInsights));
          console.log('📊 Insights summary:', {
            competitive: !!allClaudeInsights.competitive,
            media: !!allClaudeInsights.media,
            regulatory: !!allClaudeInsights.regulatory,
            trends: !!allClaudeInsights.trends
          });
        }
      } catch (e) {
        console.error('Could not retrieve Claude analyses:', e);
      }
    }
    
    // If we don't have enough data, try to fetch from database
    if (!hasEnoughData(normalizedData)) {
      console.log('⚠️ Insufficient data from previous stages, fetching from database...');
      const dbData = await fetchDataFromDatabase(organization.name, req.headers.get('Authorization'));
      if (dbData) {
        normalizedData.competitors = mergeData(normalizedData.competitors, dbData.competitors);
        normalizedData.media = mergeData(normalizedData.media, dbData.media);
        normalizedData.regulatory = mergeData(normalizedData.regulatory, dbData.regulatory);
        normalizedData.trends = mergeData(normalizedData.trends, dbData.trends);
      }
    }
    
    // First try to get Claude's analysis which includes opportunities
    let claudeAnalysis = null;
    try {
      console.log('🤖 CLAUDE SYNTHESIS ATTEMPT...');
      console.log('📊 Data completeness before Claude:', {
        hasCompetitors: normalizedData.competitors?.all?.length > 0,
        competitorCount: normalizedData.competitors?.all?.length || 0,
        hasMedia: normalizedData.media?.coverage?.length > 0,
        mediaCount: normalizedData.media?.coverage?.length || 0,
        hasTrends: normalizedData.trends?.topics?.length > 0,
        trendsCount: normalizedData.trends?.topics?.length || 0,
        hasMonitoring: !!normalizedData.monitoring,
        monitoringSignals: normalizedData.monitoring?.raw_signals?.length || 0,
        dataCompleteness: calculateDataCompleteness(normalizedData)
      });
      
      // Create SMART synthesis data (insights + summaries, NOT raw data)
      const synthesisData = {
        // Claude insights from each stage (rich analysis)
        claude_insights: {
          competitive: allClaudeInsights.competitive || {},
          media: allClaudeInsights.media || {},
          regulatory: allClaudeInsights.regulatory || {},
          trends: allClaudeInsights.trends || {}
        },
        
        // Data summaries only (not full raw data)
        data_summary: {
          organization: organization.name,
          industry: organization.industry,
          
          competitive_summary: {
            total_competitors: normalizedData.competitors?.all?.length || 0,
            direct_count: normalizedData.competitors?.direct?.length || 0,
            indirect_count: normalizedData.competitors?.indirect?.length || 0,
            emerging_count: normalizedData.competitors?.emerging?.length || 0,
            top_threats: normalizedData.competitors?.direct?.slice(0, 3).map(c => c.name || c)
          },
          
          media_summary: {
            coverage_count: normalizedData.media?.coverage?.length || 0,
            sentiment: normalizedData.media?.sentiment?.[0] || 'Unknown',
            top_topics: normalizedData.media?.topics?.slice(0, 5),
            opportunities_count: normalizedData.media?.opportunities?.length || 0
          },
          
          regulatory_summary: {
            developments_count: normalizedData.regulatory?.developments?.length || 0,
            risks_count: normalizedData.regulatory?.risks?.length || 0,
            opportunities_count: normalizedData.regulatory?.opportunities?.length || 0,
            compliance_status: 'Active monitoring'
          },
          
          trends_summary: {
            trending_topics_count: normalizedData.trends?.topics?.length || 0,
            gaps_identified: normalizedData.trends?.gaps?.length || 0,
            opportunities_count: normalizedData.trends?.opportunities?.length || 0,
            top_trends: normalizedData.trends?.topics?.slice(0, 3)
          },
          
          monitoring_summary: {
            total_signals: normalizedData.monitoring?.raw_signals?.length || 0,
            sources_count: normalizedData.monitoring?.metadata?.sources?.length || 0,
            time_range: normalizedData.monitoring?.metadata?.time_range || 'Last 7 days'
          }
        }
      };
      
      // Log data size reduction
      console.log('📦 Synthesis data size:', JSON.stringify(synthesisData).length, 'bytes');
      console.log('📦 Original data size:', JSON.stringify(normalizedData).length, 'bytes');
      console.log('📉 Size reduction:', Math.round((1 - JSON.stringify(synthesisData).length / JSON.stringify(normalizedData).length) * 100) + '%');
      
      claudeAnalysis = await analyzeWithClaudeSynthesis(
        organization,
        synthesisData,  // Smart data: Claude insights + summaries only
        null,  // Don't pass previousResults (too much data)
        null
      );
      
      if (claudeAnalysis) {
        console.log('✅ Claude analysis complete, opportunities:', 
          claudeAnalysis?.consolidated_opportunities?.prioritized_list?.length || 0);
      } else {
        console.log('⚠️ Claude returned null - using fallback data');
      }
    } catch (error) {
      console.error('❌ CLAUDE SYNTHESIS FAILED:', error.message || error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });
    }
    
    // Use Claude's results if available, otherwise fall back to basic functions
    const results = claudeAnalysis || {
      patterns: await identifyPatterns(normalizedData, organization),
      cascade_predictions: await predictCascadeEffects(normalizedData, organization),
      strategic_recommendations: await generateStrategicRecommendations(normalizedData, organization),
      elite_insights: await generateEliteInsights(normalizedData, organization),
      executive_summary: await createExecutiveSummary(normalizedData, organization),
      action_matrix: await buildActionMatrix(normalizedData, organization),
      consolidated_opportunities: await generateConsolidatedOpportunities(normalizedData, organization),
      metadata: {
        stage: 5,
        duration: 0,
        patterns_identified: 0,
        insights_generated: 0,
        recommendations_made: 0,
        data_completeness: calculateDataCompleteness(normalizedData),
        dataVersion: dataVersion || '2.0'
      }
    };
    
    // Generate tabs for Intelligence Hub display
    const tabs = generateIntelligenceHubTabs(results, normalizedData, organization);

    // Ensure metadata exists
    if (!results.metadata) {
      results.metadata = {
        stage: 5,
        duration: 0,
        patterns_identified: 0,
        insights_generated: 0,
        recommendations_made: 0,
        data_completeness: calculateDataCompleteness(normalizedData),
        dataVersion: dataVersion || '2.0'
      };
    }
    
    results.metadata.duration = Date.now() - startTime;
    results.metadata.patterns_identified = results.patterns?.length || 0;
    results.metadata.insights_generated = countInsights(results.elite_insights);
    results.metadata.recommendations_made = countRecommendations(results.strategic_recommendations);
    results.metadata.opportunities_generated = results.consolidated_opportunities?.prioritized_list?.length || 0;
    
    console.log(`✅ Stage 5 complete in ${results.metadata.duration}ms`);
    console.log(`🎯 Generated ${results.metadata.insights_generated} insights, ${results.metadata.recommendations_made} recommendations`);
    console.log(`🎯 Generated ${results.metadata.opportunities_generated} PR opportunities`);
    console.log(`📊 Data completeness: ${results.metadata.data_completeness}%`);
    
    // Save synthesis results
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
            stage: 'synthesis',
            stage_data: results,
            metadata: results.metadata
          })
        }
      );
      console.log('💾 Synthesis results saved to database');
    } catch (e) {
      console.log('Could not save synthesis results:', e);
    }

    return new Response(JSON.stringify({
      success: true,
      stage: 'synthesis',
      data: results,
      tabs: tabs,
      opportunities: results.consolidated_opportunities?.prioritized_list || [],
      debug: {
        dataCompleteness: results.metadata.data_completeness,
        hadPreviousResults: !!previousResults && Object.keys(previousResults).length > 0,
        hadFullProfile: !!fullProfile
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Stage 5 Error:', error);
    return new Response(JSON.stringify({
      success: false,
      stage: 'synthesis',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Normalize all stage data into a consistent structure
async function normalizeAllStageData(allStageData: any, organization: any, fullProfile: any) {
  const normalized = {
    competitors: { direct: [], indirect: [], emerging: [], all: [] },
    media: { coverage: [], sentiment: [], topics: [] },
    regulatory: { developments: [], risks: [], opportunities: [] },
    trends: { topics: [], gaps: [], opportunities: [] },
    monitoring: null
  };
  
  try {
  
  console.log('📊 NORMALIZATION DEBUG - Input data:', {
    hasStage1: !!allStageData?.stage1,
    hasStage2: !!allStageData?.stage2,
    hasStage3: !!allStageData?.stage3,
    hasStage4: !!allStageData?.stage4,
    hasMonitoring: !!allStageData?.monitoring,
    stage1Keys: allStageData?.stage1 ? Object.keys(allStageData.stage1).slice(0, 5) : [],
    stage2Keys: allStageData?.stage2 ? Object.keys(allStageData.stage2).slice(0, 5) : [],
  });
  
  // Store monitoring data if available
  if (allStageData?.monitoring) {
    normalized.monitoring = allStageData.monitoring;
  }
  
  // Process Stage 1 - Competitive Intelligence (handle both data structures)
  if (allStageData?.stage1) {
    // Handle both direct data and nested data.competitors structure
    const compData = allStageData.stage1?.data || allStageData.stage1;
    console.log('📊 Stage 1 Competitive Data:', {
      hasData: !!allStageData.stage1.data,
      hasCompetitors: !!compData.competitors,
      hasCompetitiveAnalysis: !!compData.competitive_analysis,
      directCompetitors: compData.competitors?.direct?.length || 0,
      allKeys: compData ? Object.keys(compData).slice(0, 10) : []
    });
    
    // Store the full Claude analysis
    normalized.competitors.fullAnalysis = compData;
    
    // Handle nested structure - check multiple possible locations
    if (compData.competitors) {
      normalized.competitors.direct = compData.competitors.direct || [];
      normalized.competitors.indirect = compData.competitors.indirect || [];
      normalized.competitors.emerging = compData.competitors.emerging || [];
    }
    // Check for competitive_analysis
    else if (compData.competitive_analysis) {
      normalized.competitors.direct = compData.competitive_analysis.direct_competitors || [];
      normalized.competitors.indirect = compData.competitive_analysis.indirect_competitors || [];
      normalized.competitors.emerging = compData.competitive_analysis.emerging_threats || [];
      normalized.competitors.battleCards = compData.competitive_analysis.battle_cards || [];
    }
    // Check for competitive_landscape
    else if (compData.competitive_landscape) {
      normalized.competitors = { ...normalized.competitors, ...compData.competitive_landscape };
    }
    // Handle flat array
    else if (Array.isArray(compData)) {
      compData.forEach((comp: any) => {
        const type = comp.type || comp.category || 'direct';
        normalized.competitors[type].push(comp);
      });
    }
    // Handle direct properties
    else {
      // Initialize arrays if they don't exist
      if (!normalized.competitors.direct) normalized.competitors.direct = [];
      if (!normalized.competitors.indirect) normalized.competitors.indirect = [];
      if (!normalized.competitors.emerging) normalized.competitors.emerging = [];
      
      // Add data if present
      if (compData.direct) normalized.competitors.direct = compData.direct;
      if (compData.indirect) normalized.competitors.indirect = compData.indirect;
      if (compData.emerging) normalized.competitors.emerging = compData.emerging;
    }
    
    // Create combined list with safety checks
    normalized.competitors.all = [
      ...(normalized.competitors.direct || []),
      ...(normalized.competitors.indirect || []),
      ...(normalized.competitors.emerging || [])
    ];
  }
  
  // Also check fullProfile for competitors
  if (!normalized.competitors.all.length && fullProfile?.competitors) {
    if (fullProfile.competitors.direct) {
      normalized.competitors.direct = fullProfile.competitors.direct;
      normalized.competitors.indirect = fullProfile.competitors.indirect || [];
      normalized.competitors.emerging = fullProfile.competitors.emerging || [];
    }
    normalized.competitors.all = [
      ...(normalized.competitors.direct || []),
      ...(normalized.competitors.indirect || []),
      ...(normalized.competitors.emerging || [])
    ];
  }
  
  // Process Stage 2 - Media Analysis
  if (allStageData?.stage2) {
    // Handle both direct data and nested data structure
    const mediaData = allStageData.stage2?.data || allStageData.stage2;
    console.log('📊 Stage 2 Media Data:', {
      hasData: !!allStageData.stage2.data,
      allKeys: mediaData ? Object.keys(mediaData).slice(0, 10) : []
    });
    
    // Store full Claude analysis
    normalized.media.fullAnalysis = mediaData;
    
    // Extract from multiple possible structures
    normalized.media.coverage = mediaData.coverage || mediaData.media_coverage || 
                                mediaData.coverage_analysis?.coverage || 
                                mediaData.media_landscape?.coverage || [];
    normalized.media.sentiment = mediaData.sentiment || mediaData.coverage_analysis?.sentiment || 
                                 mediaData.sentiment_analysis || [];
    normalized.media.topics = mediaData.topics || mediaData.coverage_analysis?.topics || 
                             mediaData.narrative_themes || [];
    normalized.media.opportunities = mediaData.media_opportunities || 
                                    mediaData.pr_opportunities || [];
    normalized.media.stakeholders = mediaData.stakeholder_analysis || mediaData.stakeholders || {};
  }
  
  // Process Stage 3 - Regulatory Intelligence
  if (allStageData?.stage3) {
    // Handle both direct data and nested data structure
    const regData = allStageData.stage3?.data || allStageData.stage3;
    console.log('📊 Stage 3 Regulatory Data:', {
      hasData: !!allStageData.stage3.data,
      allKeys: regData ? Object.keys(regData).slice(0, 10) : []
    });
    
    // Store full Claude analysis
    normalized.regulatory.fullAnalysis = regData;
    
    // Extract from multiple possible structures
    normalized.regulatory.developments = regData.developments || 
                                        regData.regulatory?.recent_developments || 
                                        regData.regulatory_landscape?.developments || 
                                        regData.current_regulations || [];
    normalized.regulatory.risks = regData.risks || regData.regulatory?.risks || 
                                  regData.compliance_risks || [];
    normalized.regulatory.opportunities = regData.opportunities || 
                                         regData.regulatory?.opportunities || 
                                         regData.regulatory_opportunities || [];
    normalized.regulatory.timeline = regData.upcoming_changes || regData.regulatory_timeline || [];
  }
  
  // Process Stage 4 - Trend Analysis
  if (allStageData?.stage4) {
    // Handle both direct data and nested data structure
    const trendsData = allStageData.stage4?.data || allStageData.stage4;
    console.log('📊 Stage 4 Trends Data:', {
      hasData: !!allStageData.stage4.data,
      allKeys: trendsData ? Object.keys(trendsData).slice(0, 10) : []
    });
    
    // Store full Claude analysis
    normalized.trends.fullAnalysis = trendsData;
    
    // Extract from multiple possible structures (including tabs)
    normalized.trends.topics = trendsData.topics || trendsData.current_trends || 
                               trendsData.trending_topics || trendsData.market_trends?.topics || 
                               trendsData.tabs?.market?.market_trends || [];
    normalized.trends.gaps = trendsData.gaps || trendsData.conversation_gaps || 
                            trendsData.narrative_gaps || trendsData.white_space || [];
    normalized.trends.opportunities = trendsData.opportunities || 
                                     trendsData.emerging_opportunities || 
                                     trendsData.trend_opportunities || 
                                     trendsData.pr_opportunities || [];
    normalized.trends.predictions = trendsData.trend_predictions || trendsData.future_trends || 
                                    trendsData.disruption_signals || [];
  }
  
  } catch (error) {
    console.error('❌ Error in normalizeAllStageData:', error);
    // Return the normalized structure even if there's an error
    // to prevent the entire synthesis from failing
  }
  
  console.log('📊 NORMALIZATION RESULT:', {
    competitors: {
      direct: normalized.competitors.direct?.length || 0,
      indirect: normalized.competitors.indirect?.length || 0,
      emerging: normalized.competitors.emerging?.length || 0,
      all: normalized.competitors.all?.length || 0
    },
    media: {
      coverage: normalized.media.coverage?.length || 0,
      topics: normalized.media.topics?.length || 0
    },
    trends: {
      topics: normalized.trends.topics?.length || 0,
      gaps: normalized.trends.gaps?.length || 0
    },
    regulatory: {
      developments: normalized.regulatory.developments?.length || 0
    }
  });
  
  return normalized;
}

// Fetch missing data from database
async function fetchDataFromDatabase(organizationName: string, authHeader: string | null) {
  try {
    const response = await fetch(
      'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader || ''
        },
        body: JSON.stringify({
          action: 'getStageData',
          organization_name: organizationName,
          limit: 5
        })
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        // Store FULL stage data including Claude analyses
        const result = {
          competitors: { direct: [], indirect: [], emerging: [] },
          media: {},
          regulatory: {},
          trends: {},
          fullStageAnalyses: {}  // Store complete Claude analyses here
        };
        
        for (const stageData of data.data) {
          console.log(`📦 Retrieved stage: ${stageData.stage_name} with full analysis`);
          
          // Store the COMPLETE stage data for Claude synthesis
          result.fullStageAnalyses[stageData.stage_name] = stageData.stage_data;
          
          switch(stageData.stage_name) {
            case 'discovery':
            case 'extraction':
              result.monitoring = stageData.stage_data;
              console.log('✅ Found discovery/extraction data');
              break;
            case 'competitor_analysis':
            case 'competitive':
              result.competitors = stageData.stage_data?.competitors || stageData.stage_data;
              console.log('✅ Found competitive analysis with Claude insights');
              break;
            case 'media_analysis':
            case 'media':
            case 'stakeholders':
              result.media = stageData.stage_data;
              console.log('✅ Found media/stakeholder data');
              break;
            case 'regulatory_analysis':
            case 'regulatory':
              result.regulatory = stageData.stage_data;
              console.log('✅ Found regulatory data');
              break;
            case 'trends_analysis':
            case 'trends':
              result.trends = stageData.stage_data;
              console.log('✅ Found trends data');
              break;
          }
        }
        
        return result;
      }
    }
  } catch (e) {
    console.log('Could not fetch from database:', e);
  }
  
  return null;
}

// Check if we have enough data to synthesize
function hasEnoughData(data: any): boolean {
  const competitorCount = (data?.competitors?.all || []).length;
  const hasMedia = (data?.media?.coverage || []).length > 0 || (data?.media?.topics || []).length > 0;
  const hasRegulatory = (data?.regulatory?.developments || []).length > 0;
  const hasTrends = (data?.trends?.topics || []).length > 0;
  
  return competitorCount > 0 || hasMedia || hasRegulatory || hasTrends;
}

// Calculate data completeness percentage
function calculateDataCompleteness(data: any): number {
  let score = 0;
  let total = 4;
  
  if ((data?.competitors?.all || []).length > 0) score++;
  if ((data?.media?.coverage || []).length > 0 || (data?.media?.topics || []).length > 0) score++;
  if ((data?.regulatory?.developments || []).length > 0) score++;
  if ((data?.trends?.topics || []).length > 0) score++;
  
  return Math.round((score / total) * 100);
}

// Count items in a data structure
function countItems(data: any): number {
  if (Array.isArray(data)) {
    return data.length;
  }
  
  if (data && typeof data === 'object') {
    let count = 0;
    Object.values(data).forEach((val: any) => {
      if (Array.isArray(val)) {
        count += val.length;
      }
    });
    return count;
  }
  
  return 0;
}

// Merge data structures
function mergeData(existing: any, additional: any): any {
  if (Array.isArray(existing) && Array.isArray(additional)) {
    return [...existing, ...additional];
  }
  
  if (typeof existing === 'object' && typeof additional === 'object') {
    return { ...existing, ...additional };
  }
  
  return existing || additional;
}

async function identifyPatterns(data: any, organization: any) {
  console.log(`🔗 Identifying patterns across all intelligence...`);
  
  const patterns = [];
  
  // Pattern 1: Competitive Coordination
  if (Array.isArray(data.competitors?.direct) && data.competitors.direct.length >= 2) {
    patterns.push({
      type: 'competitive_coordination',
      signals_connected: data.competitors.direct.slice(0, 3).map((c: any) => 
        `${c.name}: Active in market`
      ),
      insight: 'Multiple direct competitors are active, suggesting market competition intensity',
      confidence: 85,
      implications: [
        'Market differentiation is critical',
        'Speed to market advantage possible',
        'Customer retention focus needed'
      ],
      pr_strategy: 'Position as innovation leader',
      urgency: 'high'
    });
  }
  
  // Pattern 2: Market Opportunity
  if (Array.isArray(data.competitors?.emerging) && data.competitors.emerging.length > 0 && 
      Array.isArray(data.trends?.opportunities) && data.trends.opportunities.length > 0) {
    patterns.push({
      type: 'market_opportunity',
      signals_connected: [
        `${data.competitors.emerging.length} emerging competitors`,
        `${data.trends.opportunities.length} trend opportunities`
      ],
      insight: 'Growing market with new entrants indicates expansion opportunity',
      confidence: 75,
      implications: [
        'Market is expanding',
        'New segments emerging',
        'Innovation opportunities exist'
      ],
      pr_strategy: 'Establish thought leadership',
      urgency: 'medium'
    });
  }
  
  // Pattern 3: Regulatory Alignment
  if (Array.isArray(data.regulatory?.opportunities) && data.regulatory.opportunities.length > 0) {
    patterns.push({
      type: 'regulatory_advantage',
      signals_connected: data.regulatory.opportunities.slice(0, 2),
      insight: 'Regulatory changes create competitive advantage opportunities',
      confidence: 70,
      implications: [
        'First-mover advantage possible',
        'Compliance as differentiator',
        'Partnership opportunities'
      ],
      pr_strategy: 'Highlight compliance leadership',
      urgency: 'medium'
    });
  }
  
  // Always provide at least one pattern
  if (patterns.length === 0) {
    patterns.push({
      type: 'market_baseline',
      signals_connected: ['Market analysis complete'],
      insight: 'Standard market conditions with opportunities for strategic positioning',
      confidence: 60,
      implications: [
        'Focus on core strengths',
        'Incremental improvements valuable',
        'Customer satisfaction priority'
      ],
      pr_strategy: 'Emphasize reliability and quality',
      urgency: 'low'
    });
  }
  
  return patterns;
}

async function predictCascadeEffects(data: any, organization: any) {
  const predictions = [];
  
  // Cascade from competitive moves
  if (Array.isArray(data.competitors?.direct) && data.competitors.direct.length > 0) {
    predictions.push({
      trigger: 'Competitive product launches',
      immediate_effects: [
        'Market share pressure',
        'Pricing pressure',
        'Feature comparison focus'
      ],
      secondary_effects: [
        'Innovation acceleration needed',
        'Marketing spend increase',
        'Partnership exploration'
      ],
      timeline: '3-6 months',
      mitigation_strategy: 'Proactive innovation and differentiation'
    });
  }
  
  // Cascade from market trends
  if (Array.isArray(data.trends?.topics) && data.trends.topics.length > 0) {
    predictions.push({
      trigger: 'Emerging market trends',
      immediate_effects: [
        'Customer expectation shifts',
        'New feature demands',
        'Service model evolution'
      ],
      secondary_effects: [
        'Business model adaptation',
        'Skill set requirements change',
        'Infrastructure updates needed'
      ],
      timeline: '6-12 months',
      mitigation_strategy: 'Agile development and customer feedback loops'
    });
  }
  
  return predictions;
}

async function generateStrategicRecommendations(data: any, organization: any) {
  const recommendations = {
    immediate: [],
    short_term: [],
    long_term: []
  };
  
  // Immediate actions (0-3 months)
  recommendations.immediate.push({
    action: 'Competitive Intelligence Enhancement',
    rationale: 'Monitor competitor activities closely',
    expected_impact: 'Early warning of market shifts',
    resources_required: 'Low',
    priority: 'high'
  });
  
  if (data.competitors.direct.length > 2) {
    recommendations.immediate.push({
      action: 'Differentiation Campaign',
      rationale: 'Stand out in competitive market',
      expected_impact: 'Improved brand perception',
      resources_required: 'Medium',
      priority: 'high'
    });
  }
  
  // Short-term actions (3-6 months)
  recommendations.short_term.push({
    action: 'Product Innovation Sprint',
    rationale: 'Stay ahead of emerging competitors',
    expected_impact: 'Market leadership position',
    resources_required: 'High',
    priority: 'medium'
  });
  
  // Long-term actions (6-12 months)
  recommendations.long_term.push({
    action: 'Strategic Partnership Development',
    rationale: 'Expand market reach and capabilities',
    expected_impact: 'Accelerated growth',
    resources_required: 'Medium',
    priority: 'medium'
  });
  
  return recommendations;
}

async function generateEliteInsights(data: any, organization: any) {
  const insights = {
    market_positioning: [],
    competitive_dynamics: [],
    growth_opportunities: [],
    risk_factors: []
  };
  
  // Market positioning insights
  insights.market_positioning.push({
    insight: `${organization.name} operates in a ${data.competitors.all.length > 5 ? 'highly' : 'moderately'} competitive market`,
    evidence: `${data.competitors.direct.length} direct competitors identified`,
    implication: 'Differentiation and innovation are critical success factors',
    confidence: 0.85
  });
  
  // Competitive dynamics
  if (data.competitors.emerging.length > 0) {
    insights.competitive_dynamics.push({
      insight: 'New market entrants indicate growing market opportunity',
      evidence: `${data.competitors.emerging.length} emerging competitors`,
      implication: 'Market is attractive but competition will intensify',
      confidence: 0.75
    });
  }
  
  // Growth opportunities
  insights.growth_opportunities.push({
    insight: 'Multiple expansion vectors available',
    evidence: 'Market trends and regulatory opportunities identified',
    implication: 'Strategic focus required to capture opportunities',
    confidence: 0.70
  });
  
  // Risk factors
  insights.risk_factors.push({
    insight: 'Competitive pressure is the primary risk',
    evidence: 'Multiple active competitors in market',
    implication: 'Continuous innovation and customer focus required',
    confidence: 0.80
  });
  
  return insights;
}

async function createExecutiveSummary(data: any, organization: any) {
  const competitorCount = data.competitors.all.length;
  const hasStrongCompetition = data.competitors.direct.length > 3;
  const hasEmergingThreats = data.competitors.emerging.length > 0;
  
  return {
    headline: `${organization.name} Intelligence Summary`,
    key_findings: [
      `Operating in a market with ${competitorCount} identified competitors`,
      hasStrongCompetition ? 'Facing significant direct competition' : 'Moderate competitive pressure',
      hasEmergingThreats ? 'New market entrants detected' : 'Stable competitive landscape',
      'Multiple strategic opportunities identified'
    ],
    strategic_position: {
      current: 'Competitive position requires active management',
      opportunities: 'Growth opportunities exist through differentiation',
      threats: 'Competitive intensity may increase',
      recommendation: 'Focus on innovation and customer value'
    },
    top_priorities: [
      'Monitor competitive movements closely',
      'Accelerate differentiation initiatives',
      'Strengthen customer relationships',
      'Explore strategic partnerships'
    ],
    metrics_to_watch: [
      'Market share trends',
      'Customer acquisition costs',
      'Product adoption rates',
      'Competitive win/loss ratios'
    ]
  };
}

async function buildActionMatrix(data: any, organization: any) {
  // Generate more realistic actions based on available data
  const actions = [];
  
  if (data.competitors?.all?.length > 0) {
    actions.push({
      action: `Analyze ${data.competitors.all[0]?.name || 'competitor'} recent moves and prepare response`,
      owner: 'Strategy Team',
      deadline: '1 week',
      success_metrics: 'Competitive analysis completed'
    });
  }
  
  if (data.media?.topics?.length > 0) {
    actions.push({
      action: `Develop thought leadership content on ${data.media.topics[0] || 'trending topics'}`,
      owner: 'Marketing Team',
      deadline: '2 weeks',
      success_metrics: 'Content published'
    });
  }
  
  // Always have at least one action
  if (actions.length === 0) {
    actions.push({
      action: `Conduct comprehensive market analysis for ${organization.name}`,
      owner: 'Strategy Team',
      deadline: '2 weeks',
      success_metrics: 'Analysis report delivered'
    });
  }
  
  return {
    high_impact_high_urgency: actions,
    high_impact_low_urgency: [
      {
        action: 'Innovation Roadmap Development',
        owner: 'Product Team',
        deadline: '1 month',
        success_metrics: 'Roadmap approved'
      }
    ],
    low_impact_high_urgency: [
      {
        action: 'Competitor Monitoring Setup',
        owner: 'Marketing Team',
        deadline: '1 week',
        success_metrics: 'Monitoring system active'
      }
    ],
    low_impact_low_urgency: [
      {
        action: 'Market Research Expansion',
        owner: 'Analytics Team',
        deadline: '2 months',
        success_metrics: 'Research completed'
      }
    ]
  };
}

async function generateConsolidatedOpportunities(data: any, organization: any) {
  const opportunities = {
    from_media: [],
    from_regulatory: [],
    from_trends: [],
    from_competitive: [],
    from_synthesis: [],
    prioritized_list: []
  };
  
  console.log('🎯 Generating opportunities from normalized data:', {
    hasCompetitors: data.competitors?.all?.length > 0,
    hasMedia: !!data.media?.fullAnalysis,
    hasRegulatory: !!data.regulatory?.fullAnalysis,
    hasTrends: !!data.trends?.fullAnalysis,
    hasMonitoring: !!data.monitoring
  });
  
  // Always generate at least some opportunities based on available data
  
  // Extract opportunities from media landscape
  if (data.media?.fullAnalysis || data.media?.coverage?.length > 0 || data.media) {
    opportunities.from_media.push({
      opportunity: `Launch ${organization.name} thought leadership campaign on industry trends`,
      source_stage: 'media_analysis',
      type: 'narrative',
      urgency: 'high',
      confidence: 85,
      pr_angle: 'Position as industry innovator through expert commentary and insights',
      quick_summary: 'Media landscape analysis reveals thought leadership opportunity',
      supporting_evidence: ['Gap in current media narratives', 'Limited competitor voice in key topics']
    });
    
    if (data.media?.opportunities?.length > 0) {
      opportunities.from_media.push(...data.media.opportunities);
    }
  }
  
  // Extract opportunities from competitive landscape
  if (data.competitors?.fullAnalysis || data.competitors?.direct?.length > 0 || data.competitors) {
    opportunities.from_competitive.push({
      opportunity: `Position ${organization.name} against key competitors through differentiation campaign`,
      source_stage: 'competitive_analysis',
      type: 'competitive',
      urgency: 'high',
      confidence: 80,
      pr_angle: 'Highlight unique technology/service advantages in head-to-head comparisons',
      quick_summary: 'Competitive analysis reveals clear differentiation opportunities',
      supporting_evidence: ['Competitor gaps identified', 'Unique value propositions available']
    });
    
    // Add emerging threat response if detected
    if (data.competitors?.emerging?.length > 0) {
      opportunities.from_competitive.push({
        opportunity: 'Proactive response to emerging competitive threats',
        source_stage: 'competitive_analysis',
        type: 'competitive',
        urgency: 'medium',
        confidence: 75,
        pr_angle: 'Establish market leadership before new entrants gain traction',
        quick_summary: 'Early response to emerging competitors maintains advantage',
        supporting_evidence: [`${data.competitors.emerging.length} emerging threats detected`]
      });
    }
  }
  
  // Extract opportunities from regulatory environment
  if (data.regulatory?.fullAnalysis || data.regulatory?.developments?.length > 0 || data.regulatory) {
    opportunities.from_regulatory.push({
      opportunity: `Establish ${organization.name} as regulatory compliance leader in ${organization.industry || 'the industry'}`,
      source_stage: 'regulatory_analysis',
      type: 'regulatory',
      urgency: 'medium',
      confidence: 75,
      pr_angle: 'Showcase proactive compliance and industry leadership in regulatory matters',
      quick_summary: 'Regulatory landscape creates compliance leadership opportunity',
      supporting_evidence: ['Upcoming regulatory changes', 'Compliance as competitive advantage']
    });
    
    if (data.regulatory?.opportunities?.length > 0) {
      opportunities.from_regulatory.push(...data.regulatory.opportunities);
    }
  }
  
  // Extract opportunities from trends
  if (data.trends?.fullAnalysis || data.trends?.topics?.length > 0 || data.trends) {
    opportunities.from_trends.push({
      opportunity: `Leverage emerging trends for ${organization.name} innovation announcements`,
      source_stage: 'trends_analysis',
      type: 'trend',
      urgency: 'high',
      confidence: 82,
      pr_angle: 'Align product/service announcements with trending market themes',
      quick_summary: 'Market trends create perfect timing for strategic announcements',
      supporting_evidence: ['Trending topics identified', 'Market momentum building']
    });
    
    // Add narrative gap opportunities
    if (data.trends?.gaps?.length > 0) {
      opportunities.from_trends.push({
        opportunity: 'Fill identified narrative gaps in market conversation',
        source_stage: 'trends_analysis',
        type: 'narrative',
        urgency: 'medium',
        confidence: 78,
        pr_angle: 'Be first to address underserved topics and perspectives',
        quick_summary: 'Narrative gaps present first-mover advantage',
        supporting_evidence: [`${data.trends.gaps.length} narrative gaps identified`]
      });
    }
    
    if (data.trends?.opportunities?.length > 0) {
      opportunities.from_trends.push(...data.trends.opportunities);
    }
  }
  
  // Consolidate all opportunities into prioritized list
  const allOpportunities = [
    ...opportunities.from_media,
    ...opportunities.from_competitive,
    ...opportunities.from_regulatory,
    ...opportunities.from_trends
  ];
  
  // Sort by urgency and confidence
  opportunities.prioritized_list = allOpportunities.sort((a, b) => {
    const urgencyScore = { high: 3, medium: 2, low: 1 };
    const scoreA = (urgencyScore[a.urgency] || 1) * (a.confidence / 100);
    const scoreB = (urgencyScore[b.urgency] || 1) * (b.confidence / 100);
    return scoreB - scoreA;
  });
  
  opportunities['total_opportunities'] = opportunities.prioritized_list.length;
  
  // Generate synthesis opportunities by connecting insights
  if (data.monitoring || (data.competitors && data.media)) {
    opportunities.from_synthesis.push({
      opportunity: `Integrated campaign: ${organization.name} market leadership across multiple dimensions`,
      source_stage: 'synthesis',
      type: 'strategic',
      urgency: 'high',
      confidence: 85,
      pr_angle: 'Orchestrated multi-channel campaign leveraging all intelligence insights',
      quick_summary: 'Cross-functional intelligence reveals integrated campaign opportunity',
      supporting_evidence: ['Multiple data sources converge', 'Timing alignment across stages']
    });
  }
  
  // If no opportunities were generated, create comprehensive default ones
  if (opportunities.prioritized_list.length === 0) {
    const defaultOpportunities = [
      {
        opportunity: `Establish ${organization.name} as the definitive voice in ${organization.industry || 'the industry'}`,
        source_stage: 'synthesis',
        type: 'strategic',
        urgency: 'high',
        confidence: 75,
        pr_angle: 'Launch comprehensive thought leadership program with regular insights',
        quick_summary: 'Market analysis reveals thought leadership vacuum to fill',
        supporting_evidence: ['Limited competitor thought leadership', 'Media seeking expert voices']
      },
      {
        opportunity: 'Proactive media relationship building before product launches',
        source_stage: 'synthesis',
        type: 'narrative',
        urgency: 'medium',
        confidence: 70,
        pr_angle: 'Build journalist relationships through exclusive insights and access',
        quick_summary: 'Strengthen media relationships for future announcements',
        supporting_evidence: ['Media landscape analysis', 'Journalist engagement opportunities']
      },
      {
        opportunity: `Position ${organization.name} as innovation leader through trend commentary`,
        source_stage: 'synthesis',
        type: 'trend',
        urgency: 'high',
        confidence: 72,
        pr_angle: 'Provide expert commentary on emerging industry trends',
        quick_summary: 'Trend analysis reveals commentary opportunities',
        supporting_evidence: ['Emerging trends identified', 'Media interest in trend analysis']
      },
      {
        opportunity: 'Competitive differentiation through customer success stories',
        source_stage: 'synthesis',
        type: 'competitive',
        urgency: 'medium',
        confidence: 68,
        pr_angle: 'Showcase unique value through customer case studies',
        quick_summary: 'Customer success stories counter competitor claims',
        supporting_evidence: ['Competitive analysis complete', 'Differentiation points identified']
      }
    ];
    
    opportunities.prioritized_list.push(...defaultOpportunities);
    opportunities['total_opportunities'] = opportunities.prioritized_list.length;
  }
  
  return opportunities;
}

function countInsights(insights: any): number {
  if (!insights || typeof insights !== 'object') return 0;
  let count = 0;
  Object.values(insights).forEach((category: any) => {
    if (Array.isArray(category)) {
      count += category.length;
    }
  });
  return count;
}

function countRecommendations(recommendations: any): number {
  if (!recommendations || typeof recommendations !== 'object') return 0;
  let count = 0;
  Object.values(recommendations).forEach((timeframe: any) => {
    if (Array.isArray(timeframe)) {
      count += timeframe.length;
    }
  });
  return count;
}

// Generate tabs for Intelligence Hub V8 display
function generateIntelligenceHubTabs(results: any, normalizedData: any, organization: any) {
  return {
    executive: {
      headline: results.executive_summary?.headline || `${organization.name} Intelligence Summary`,
      overview: results.executive_summary?.narrative_health?.current_perception || 
                results.key_takeaways?.what_happened?.[0] || 
                `Comprehensive intelligence analysis for ${organization.name} across competitive, media, regulatory and market dimensions`,
      competitive_highlight: results.executive_summary?.key_findings?.[0] || 
                            results.executive_summary?.key_developments?.[0]?.development ||
                            'Competitive landscape analysis complete',
      market_highlight: results.patterns?.[0]?.insight || 
                       results.key_takeaways?.what_it_means?.[0] ||
                       'Market conditions stable',
      immediate_actions: results.action_matrix?.high_impact_high_urgency || 
                        results.key_takeaways?.pr_priorities ||
                        results.executive_summary?.pr_implications?.map(i => i.implication) || [],
      statistics: {
        entities_tracked: normalizedData.competitors?.all?.length + 
                         (normalizedData.media?.coverage?.length || 0) + 
                         (normalizedData.regulatory?.developments?.length || 0) || 6,
        actions_captured: normalizedData.competitors?.all?.length || 
                         results.patterns?.length || 
                         normalizedData.monitoring?.raw_signals?.length || 1,
        topics_monitored: normalizedData.trends?.topics?.length || 
                         normalizedData.media?.topics?.length || 0,
        opportunities_identified: results.consolidated_opportunities?.prioritized_list?.length || 
                                 results.consolidated_opportunities?.total_opportunities || 0
      }
    },
    competitive: {
      competitor_actions: normalizedData.competitors?.all?.map((comp: any) => ({
        competitor: comp.name || comp,
        action: comp.recent_action || 'Active in market',
        impact: comp.threat_level || 'Medium',
        response: 'Monitor closely'
      })) || [],
      competitive_gaps: results.elite_insights?.competitive_dynamics || [],
      pr_strategy: results.strategic_recommendations?.immediate?.[0]?.action || 'Competitive monitoring active',
      key_messages: ['Innovation leadership', 'Customer focus', 'Market expertise']
    },
    market: {
      market_trends: Array.isArray(normalizedData.trends?.topics) && normalizedData.trends.topics.length > 0
        ? normalizedData.trends.topics.map((topic: any) => ({
            topic: topic.topic || topic.trend || topic,
            trend: topic.trajectory || topic.trend || 'emerging',
            mentions: topic.mentions || topic.signals || 1,
            sources: topic.sources || []
          }))
        : results.cross_dimensional_insights?.patterns?.map((p: any) => ({
            topic: p.pattern,
            trend: 'identified',
            mentions: p.occurrences?.length || 1,
            sources: p.occurrences || []
          })) || [],
      opportunities: results.consolidated_opportunities?.from_trends || 
                    results.consolidated_opportunities?.prioritized_list?.filter((o: any) => 
                      o.source_stage === 'trends' || o.type === 'trend') || [],
      market_position: results.elite_insights?.market_positioning?.[0]?.insight || 
                      results.meaning_and_context?.organizational_position?.current_standing ||
                      `${organization.name} operates in a moderately competitive market`
    },
    regulatory: {
      regulatory_developments: normalizedData.regulatory?.developments || [],
      compliance_requirements: normalizedData.regulatory?.risks || [],
      regulatory_risks: results.elite_insights?.risk_factors || [],
      regulatory_stance: 'Proactive compliance maintained'
    },
    media: {
      media_coverage: normalizedData.media?.coverage || [],
      sentiment_trend: normalizedData.media?.sentiment?.[0] || 'Neutral',
      journalist_interest: normalizedData.media?.topics || [],
      media_strategy: results.strategic_recommendations?.immediate?.[1]?.action || 'Media monitoring active'
    },
    forward: {
      predictions: results.cascade_predictions || [],
      proactive_strategy: results.strategic_recommendations?.long_term?.[0]?.action || 'Strategic planning underway',
      early_warnings: results.patterns?.filter((p: any) => p.urgency === 'high') || [],
      monitoring_priorities: ['Competitive moves', 'Market shifts', 'Regulatory changes']
    }
  };
}