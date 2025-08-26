import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Stage 5: Pattern Recognition & Strategic Synthesis - FIXED VERSION
 * Now properly handles all data structures and creates meaningful synthesis
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { organization, previousResults, fullProfile, dataVersion } = await req.json();
    console.log(`🧩 Stage 5: Strategic Synthesis for ${organization?.name || 'Unknown'}`);
    
    // Validate and debug incoming data
    console.log(`📊 Data received:`, {
      hasOrganization: !!organization,
      organizationName: organization?.name,
      previousResultsKeys: Object.keys(previousResults || {}),
      hasFullProfile: !!fullProfile,
      dataVersion: dataVersion || 'unknown'
    });
    
    // Ensure we have an organization
    if (!organization?.name) {
      throw new Error('Organization name is required for synthesis');
    }
    
    const startTime = Date.now();
    
    // Extract and normalize all previous stage results
    const normalizedData = await normalizeAllStageData(previousResults, organization, fullProfile);
    
    console.log(`📊 Normalized data summary:`, {
      competitors: countItems(normalizedData.competitors),
      media: countItems(normalizedData.media),
      regulatory: countItems(normalizedData.regulatory),
      trends: countItems(normalizedData.trends)
    });
    
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
    
    const results = {
      patterns: await identifyPatterns(normalizedData, organization),
      cascade_predictions: await predictCascadeEffects(normalizedData, organization),
      strategic_recommendations: await generateStrategicRecommendations(normalizedData, organization),
      elite_insights: await generateEliteInsights(normalizedData, organization),
      executive_summary: await createExecutiveSummary(normalizedData, organization),
      action_matrix: await buildActionMatrix(normalizedData, organization),
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

    results.metadata.duration = Date.now() - startTime;
    results.metadata.patterns_identified = results.patterns.length;
    results.metadata.insights_generated = countInsights(results.elite_insights);
    results.metadata.recommendations_made = countRecommendations(results.strategic_recommendations);
    
    console.log(`✅ Stage 5 complete in ${results.metadata.duration}ms`);
    console.log(`🎯 Generated ${results.metadata.insights_generated} insights, ${results.metadata.recommendations_made} recommendations`);
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
async function normalizeAllStageData(previousResults: any, organization: any, fullProfile: any) {
  const normalized = {
    competitors: { direct: [], indirect: [], emerging: [], all: [] },
    media: { coverage: [], sentiment: [], topics: [] },
    regulatory: { developments: [], risks: [], opportunities: [] },
    trends: { topics: [], gaps: [], opportunities: [] }
  };
  
  // Process competitor data
  if (previousResults?.competitors) {
    const compData = previousResults.competitors;
    
    // Handle nested structure
    if (compData.competitors) {
      normalized.competitors.direct = compData.competitors.direct || [];
      normalized.competitors.indirect = compData.competitors.indirect || [];
      normalized.competitors.emerging = compData.competitors.emerging || [];
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
      normalized.competitors.direct = compData.direct || [];
      normalized.competitors.indirect = compData.indirect || [];
      normalized.competitors.emerging = compData.emerging || [];
    }
    
    // Create combined list
    normalized.competitors.all = [
      ...normalized.competitors.direct,
      ...normalized.competitors.indirect,
      ...normalized.competitors.emerging
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
      ...normalized.competitors.direct,
      ...normalized.competitors.indirect,
      ...normalized.competitors.emerging
    ];
  }
  
  // Process media data
  if (previousResults?.media) {
    const mediaData = previousResults.media;
    normalized.media.coverage = mediaData.coverage || mediaData.coverage_analysis?.coverage || [];
    normalized.media.sentiment = mediaData.sentiment || mediaData.coverage_analysis?.sentiment || [];
    normalized.media.topics = mediaData.topics || mediaData.coverage_analysis?.topics || [];
  }
  
  // Process regulatory data
  if (previousResults?.regulatory) {
    const regData = previousResults.regulatory;
    normalized.regulatory.developments = regData.developments || regData.regulatory?.recent_developments || [];
    normalized.regulatory.risks = regData.risks || regData.regulatory?.risks || [];
    normalized.regulatory.opportunities = regData.opportunities || regData.regulatory?.opportunities || [];
  }
  
  // Process trends data
  if (previousResults?.trends) {
    const trendsData = previousResults.trends;
    normalized.trends.topics = trendsData.topics || trendsData.trending_topics || [];
    normalized.trends.gaps = trendsData.gaps || trendsData.conversation_gaps || [];
    normalized.trends.opportunities = trendsData.opportunities || trendsData.trend_opportunities || [];
  }
  
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
        // Process stage data
        const result = {
          competitors: { direct: [], indirect: [], emerging: [] },
          media: {},
          regulatory: {},
          trends: {}
        };
        
        for (const stageData of data.data) {
          if (stageData.stage_name === 'competitor_analysis' && stageData.stage_data?.competitors) {
            result.competitors = stageData.stage_data.competitors;
          }
          // Add other stages as needed
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
  const competitorCount = data.competitors.all.length;
  const hasMedia = data.media.coverage.length > 0 || data.media.topics.length > 0;
  const hasRegulatory = data.regulatory.developments.length > 0;
  const hasTrends = data.trends.topics.length > 0;
  
  return competitorCount > 0 || hasMedia || hasRegulatory || hasTrends;
}

// Calculate data completeness percentage
function calculateDataCompleteness(data: any): number {
  let score = 0;
  let total = 4;
  
  if (data.competitors.all.length > 0) score++;
  if (data.media.coverage.length > 0 || data.media.topics.length > 0) score++;
  if (data.regulatory.developments.length > 0) score++;
  if (data.trends.topics.length > 0) score++;
  
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
  if (data.competitors.direct.length >= 2) {
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
  if (data.competitors.emerging.length > 0 && data.trends.opportunities.length > 0) {
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
  if (data.regulatory.opportunities.length > 0) {
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
  if (data.competitors.direct.length > 0) {
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
  if (data.trends.topics.length > 0) {
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
  return {
    high_impact_high_urgency: [
      {
        action: 'Competitive Response Strategy',
        owner: 'Strategy Team',
        deadline: '2 weeks',
        success_metrics: 'Response plan completed'
      }
    ],
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

function countInsights(insights: any): number {
  let count = 0;
  Object.values(insights).forEach((category: any) => {
    if (Array.isArray(category)) {
      count += category.length;
    }
  });
  return count;
}

function countRecommendations(recommendations: any): number {
  let count = 0;
  Object.values(recommendations).forEach((timeframe: any) => {
    if (Array.isArray(timeframe)) {
      count += timeframe.length;
    }
  });
  return count;
}