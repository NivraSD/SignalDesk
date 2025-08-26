import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Stage 5: Pattern Recognition & Strategic Synthesis
 * Takes 45 seconds to connect all dots and find hidden insights
 * This is where the magic happens - connecting data from all previous stages
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { organization, previousResults } = await req.json();
    console.log(`🧩 Stage 5: Strategic Synthesis for ${organization.name}`);
    console.log(`📊 Synthesizing data from ${Object.keys(previousResults).length} previous stages`);
    
    const startTime = Date.now();
    
    // Extract all previous stage results
    const competitorData = previousResults.competitors || {};
    const mediaData = previousResults.media || {};
    const regulatoryData = previousResults.regulatory || {};
    const trendsData = previousResults.trends || {};
    
    const results = {
      patterns: await identifyPatterns(previousResults),
      cascade_predictions: await predictCascadeEffects(previousResults),
      strategic_recommendations: await generateStrategicRecommendations(previousResults, organization),
      elite_insights: await generateEliteInsights(previousResults),
      executive_summary: await createExecutiveSummary(previousResults, organization),
      action_matrix: await buildActionMatrix(previousResults),
      metadata: {
        stage: 5,
        duration: 0,
        patterns_identified: 0,
        insights_generated: 0,
        recommendations_made: 0
      }
    };

    results.metadata.duration = Date.now() - startTime;
    results.metadata.patterns_identified = results.patterns.length;
    results.metadata.insights_generated = countInsights(results.elite_insights);
    results.metadata.recommendations_made = countRecommendations(results.strategic_recommendations);
    
    console.log(`✅ Stage 5 complete in ${results.metadata.duration}ms`);
    console.log(`🎯 Generated ${results.metadata.insights_generated} insights, ${results.metadata.recommendations_made} recommendations`);

    return new Response(JSON.stringify({
      success: true,
      stage: 'synthesis',
      data: results
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

async function identifyPatterns(allData: any) {
  console.log(`🔗 Identifying patterns across all intelligence...`);
  
  const patterns = [];
  
  // Pattern 1: Competitive Coordination
  if (allData.competitors?.competitors?.direct?.length > 2) {
    const simultaneousActions = allData.competitors.competitors.direct
      .filter((c: any) => c.recent_actions?.some((a: any) => 
        new Date(a.date).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
      ));
    
    if (simultaneousActions.length > 2) {
      patterns.push({
        type: 'competitive_coordination',
        signals_connected: simultaneousActions.map((c: any) => 
          `${c.name}: ${c.recent_actions[0]?.type}`
        ),
        insight: 'Multiple competitors moving simultaneously suggests industry inflection point',
        confidence: 85,
        implications: [
          'Market is about to shift significantly',
          'Window for differentiation is closing',
          'Need immediate strategic response'
        ],
        pr_strategy: 'Position as industry thought leader before others',
        urgency: 'critical'
      });
    }
  }
  
  // Pattern 2: Media-Regulatory Alignment
  const mediaFocus = allData.media?.coverage_analysis?.topics || [];
  const regulatoryFocus = allData.regulatory?.regulatory?.recent_developments || [];
  
  if (mediaFocus.length > 0 && regulatoryFocus.length > 0) {
    const alignment = findTopicAlignment(mediaFocus, regulatoryFocus);
    if (alignment) {
      patterns.push({
        type: 'media_regulatory_convergence',
        signals_connected: [
          `Media covering: ${alignment.topic}`,
          `Regulators acting on: ${alignment.regulatory}`
        ],
        insight: 'Media and regulatory attention converging creates reputation risk/opportunity',
        confidence: 75,
        implications: [
          'Heightened scrutiny incoming',
          'Opportunity to shape narrative',
          'Proactive engagement critical'
        ],
        pr_strategy: 'Get ahead with transparency and thought leadership',
        urgency: 'high'
      });
    }
  }
  
  // Pattern 3: Narrative Vacuum
  const trendingTopics = allData.trends?.trending_topics || [];
  const competitorActivity = allData.competitors?.competitors?.direct || [];
  const conversationGaps = allData.trends?.conversation_gaps || [];
  
  const unclaimedNarratives = trendingTopics.filter((t: any) => 
    t.your_position === 'not engaged' && 
    t.competitive_activity?.includes('Low')
  );
  
  if (unclaimedNarratives.length > 0) {
    patterns.push({
      type: 'narrative_vacuum',
      signals_connected: unclaimedNarratives.map((n: any) => n.topic),
      insight: 'Significant narratives lack clear owners - first-mover opportunity',
      confidence: 90,
      implications: [
        'Can establish thought leadership',
        'Low competition for mindshare',
        'Platform for differentiation'
      ],
      pr_strategy: 'Aggressively claim narrative space',
      urgency: 'high'
    });
  }
  
  // Pattern 4: Stakeholder Divergence
  const investorSentiment = allData.regulatory?.stakeholder_sentiment?.by_group?.investors?.sentiment;
  const activistSentiment = allData.regulatory?.stakeholder_sentiment?.by_group?.activists?.sentiment;
  
  if (investorSentiment && activistSentiment && 
      ((investorSentiment === 'positive' && activistSentiment === 'critical') ||
       (investorSentiment === 'negative' && activistSentiment === 'positive'))) {
    patterns.push({
      type: 'stakeholder_divergence',
      signals_connected: [
        `Investors: ${investorSentiment}`,
        `Activists: ${activistSentiment}`
      ],
      insight: 'Conflicting stakeholder expectations create strategic complexity',
      confidence: 70,
      implications: [
        'Cannot satisfy all stakeholders',
        'Must choose strategic priority',
        'Risk of being caught in middle'
      ],
      pr_strategy: 'Develop nuanced multi-stakeholder messaging',
      urgency: 'medium'
    });
  }
  
  // Pattern 5: Cascade Trigger Identified
  if (allData.regulatory?.regulatory?.upcoming_considerations?.length > 0 &&
      allData.trends?.emerging_themes?.length > 0) {
    patterns.push({
      type: 'cascade_trigger',
      signals_connected: [
        'Regulatory change pending',
        'Emerging theme gaining traction',
        'Competitive repositioning detected'
      ],
      insight: 'Multiple factors aligning could trigger cascade of industry changes',
      confidence: 65,
      implications: [
        'Major disruption possible',
        'Early positioning advantage available',
        'Need scenario planning'
      ],
      pr_strategy: 'Prepare multiple response scenarios',
      urgency: 'medium'
    });
  }
  
  // Add delay to simulate deep analysis
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return patterns;
}

function findTopicAlignment(mediaTopics: any[], regulatoryDevelopments: any[]) {
  // Find if media and regulatory are focusing on same themes
  const commonThemes = ['AI', 'privacy', 'data', 'safety', 'compliance', 'governance'];
  
  for (const theme of commonThemes) {
    const mediaMatch = mediaTopics.find((t: any) => 
      typeof t === 'string' ? t.toLowerCase().includes(theme) : t.topic?.toLowerCase().includes(theme)
    );
    const regMatch = regulatoryDevelopments.find((d: any) => 
      d.development?.toLowerCase().includes(theme)
    );
    
    if (mediaMatch && regMatch) {
      return {
        topic: theme,
        media: mediaMatch,
        regulatory: regMatch.development
      };
    }
  }
  
  return null;
}

async function predictCascadeEffects(allData: any) {
  console.log(`🌊 Predicting cascade effects...`);
  
  const predictions = [];
  
  // Cascade 1: Competitive Response Chain
  const highThreatCompetitors = allData.competitors?.competitors?.direct
    ?.filter((c: any) => c.threat_level === 'high') || [];
  
  if (highThreatCompetitors.length > 0) {
    const competitor = highThreatCompetitors[0];
    predictions.push({
      trigger: `${competitor.name} announces major initiative`,
      immediate: {
        timeframe: '24-48 hours',
        effects: [
          'Media seeks industry response',
          'Analysts update assessments',
          'Customers ask questions'
        ],
        pr_response: 'Ready statement emphasizing differentiation'
      },
      near_term: {
        timeframe: '1-2 weeks',
        effects: [
          'Other competitors follow suit',
          'Industry narrative shifts',
          'Pressure to respond grows'
        ],
        pr_response: 'Launch counter-initiative with media blitz'
      },
      long_term: {
        timeframe: '1-3 months',
        effects: [
          'Market dynamics permanently altered',
          'New competitive baseline established',
          'Customer expectations reset'
        ],
        pr_response: 'Establish new narrative high ground'
      },
      probability: 75,
      impact: 'high'
    });
  }
  
  // Cascade 2: Regulatory Domino Effect
  if (allData.regulatory?.regulatory?.upcoming_considerations?.length > 0) {
    const regulation = allData.regulatory.regulatory.upcoming_considerations[0];
    predictions.push({
      trigger: `${regulation.topic} regulation enacted`,
      immediate: {
        timeframe: '1-7 days',
        effects: [
          'Compliance scramble across industry',
          'Media coverage intensifies',
          'Activist groups mobilize'
        ],
        pr_response: 'Position as already compliant/prepared'
      },
      near_term: {
        timeframe: '2-4 weeks',
        effects: [
          'Similar regulations in other jurisdictions',
          'Industry standards emerge',
          'Competitive advantage to compliant companies'
        ],
        pr_response: 'Thought leadership on compliance best practices'
      },
      long_term: {
        timeframe: '3-6 months',
        effects: [
          'Industry restructuring',
          'New business models emerge',
          'Permanent cost structure changes'
        ],
        pr_response: 'Lead industry transformation narrative'
      },
      probability: 60,
      impact: 'very high'
    });
  }
  
  // Cascade 3: Media Narrative Shift
  const trendingTopics = allData.trends?.trending_topics || [];
  const acceleratingTopics = trendingTopics.filter((t: any) => t.momentum === 'accelerating');
  
  if (acceleratingTopics.length > 0) {
    const topic = acceleratingTopics[0];
    predictions.push({
      trigger: `${topic.topic} reaches mainstream tipping point`,
      immediate: {
        timeframe: '48-72 hours',
        effects: [
          'Every company asked for position',
          'Thought leaders emerge',
          'Media seeks experts'
        ],
        pr_response: 'Claim expert status immediately'
      },
      near_term: {
        timeframe: '1-3 weeks',
        effects: [
          'Industry divides into camps',
          'Best practices emerge',
          'Winners and losers identified'
        ],
        pr_response: 'Demonstrate leadership through action'
      },
      long_term: {
        timeframe: '2-6 months',
        effects: [
          'New industry norms established',
          'Laggards permanently disadvantaged',
          'Market leaders redefined'
        ],
        pr_response: 'Consolidate thought leadership position'
      },
      probability: 80,
      impact: 'medium'
    });
  }
  
  // Cascade 4: Crisis Contagion
  predictions.push({
    trigger: 'Major competitor faces crisis',
    immediate: {
      timeframe: '6-12 hours',
      effects: [
        'Industry-wide scrutiny',
        'Guilty by association risk',
        'Media seeks industry comment'
      ],
      pr_response: 'Distance and differentiate immediately'
    },
    near_term: {
      timeframe: '3-7 days',
      effects: [
        'Regulatory investigation expands',
        'Customer confidence shaken',
        'Activist campaigns launch'
      ],
      pr_response: 'Proactive transparency campaign'
    },
    long_term: {
      timeframe: '1-2 months',
      effects: [
        'New regulations imposed',
        'Industry reputation damaged',
        'Business model questioned'
      ],
      pr_response: 'Lead industry reform efforts'
    },
    probability: 40,
    impact: 'very high'
  });
  
  return predictions;
}

async function generateStrategicRecommendations(allData: any, organization: any) {
  console.log(`📋 Generating strategic recommendations...`);
  
  const recommendations = {
    immediate_24h: [],
    this_week: [],
    this_month: [],
    this_quarter: [],
    defensive: [],
    offensive: []
  };
  
  // Immediate actions (24 hours)
  if (allData.trends?.pr_opportunities?.some((o: any) => o.urgency === 'immediate')) {
    recommendations.immediate_24h.push({
      action: 'Newsjack trending AI governance debate',
      rationale: 'Topic at peak attention, low competition',
      resources_needed: 'Executive statement, social media',
      expected_outcome: 'Thought leadership visibility',
      success_metrics: 'Media mentions, social engagement'
    });
  }
  
  if (allData.competitors?.competitors?.direct?.some((c: any) => c.threat_level === 'high')) {
    recommendations.immediate_24h.push({
      action: 'Prepare competitive response materials',
      rationale: 'High-threat competitor activity detected',
      resources_needed: 'Messaging doc, FAQ, sales enablement',
      expected_outcome: 'Minimize competitive damage',
      success_metrics: 'Customer retention, win rate'
    });
  }
  
  // This week actions
  recommendations.this_week.push({
    action: 'Launch media engagement campaign',
    rationale: `${allData.media?.journalists?.length || 0} key journalists identified`,
    resources_needed: 'PR team, executive time, content',
    expected_outcome: 'Increased favorable coverage',
    success_metrics: 'Articles published, sentiment improvement'
  });
  
  if (allData.trends?.conversation_gaps?.length > 0) {
    recommendations.this_week.push({
      action: `Claim conversation gap: "${allData.trends.conversation_gaps[0].gap}"`,
      rationale: 'Unclaimed narrative territory identified',
      resources_needed: 'Content creation, thought leadership',
      expected_outcome: 'Own new narrative space',
      success_metrics: 'Share of voice, thought leadership positioning'
    });
  }
  
  // This month actions
  recommendations.this_month.push({
    action: 'Develop comprehensive ESG narrative',
    rationale: 'Stakeholder expectations diverging',
    resources_needed: 'ESG team, communications, data',
    expected_outcome: 'Unified stakeholder messaging',
    success_metrics: 'Stakeholder sentiment scores'
  });
  
  if (allData.regulatory?.regulatory?.upcoming_considerations?.length > 0) {
    recommendations.this_month.push({
      action: 'Engage proactively with regulators',
      rationale: 'Regulatory changes imminent',
      resources_needed: 'Legal, government affairs, executives',
      expected_outcome: 'Shape regulatory outcome',
      success_metrics: 'Favorable regulatory position'
    });
  }
  
  // This quarter actions
  recommendations.this_quarter.push({
    action: 'Execute industry leadership summit',
    rationale: 'Position for thought leadership',
    resources_needed: 'Events team, executives, content',
    expected_outcome: 'Industry leader positioning',
    success_metrics: 'Attendee quality, media coverage'
  });
  
  // Defensive priorities
  if (allData.media?.risks?.length > 0) {
    recommendations.defensive.push({
      action: 'Strengthen crisis preparedness',
      threat: allData.media.risks[0].description,
      preparation_needed: 'Crisis protocols, holding statements',
      trigger_indicators: 'Media inquiries, social mentions',
      response_plan: 'Rapid response team activation'
    });
  }
  
  if (allData.competitors?.competitive_landscape?.defensive_priorities?.length > 0) {
    recommendations.defensive.push({
      action: allData.competitors.competitive_landscape.defensive_priorities[0],
      threat: 'Competitive encroachment',
      preparation_needed: 'Customer retention program',
      trigger_indicators: 'Customer inquiries, RFP losses',
      response_plan: 'Account protection protocol'
    });
  }
  
  // Offensive opportunities
  if (allData.competitors?.competitive_landscape?.opportunity_windows?.length > 0) {
    recommendations.offensive.push({
      action: 'Exploit competitive weakness',
      opportunity: allData.competitors.competitive_landscape.opportunity_windows[0],
      resources_needed: 'Sales, marketing, PR',
      timing: 'Next 30 days',
      expected_gain: 'Market share capture'
    });
  }
  
  if (allData.trends?.narrative_analysis?.available_to_claim?.length > 0) {
    const narrative = allData.trends.narrative_analysis.available_to_claim[0];
    recommendations.offensive.push({
      action: `Claim narrative: ${narrative.narrative}`,
      opportunity: narrative.rationale,
      resources_needed: narrative.requirements,
      timing: 'Next 60 days',
      expected_gain: 'Thought leadership position'
    });
  }
  
  return recommendations;
}

async function generateEliteInsights(allData: any) {
  console.log(`💎 Generating elite insights...`);
  
  const insights = {
    hidden_connections: [],
    non_obvious_risks: [],
    asymmetric_opportunities: [],
    narrative_leverage_points: [],
    strategic_blindspots: [],
    black_swan_scenarios: []
  };
  
  // Hidden Connections
  insights.hidden_connections.push({
    connection: 'Regulatory focus aligns with competitor vulnerability',
    elements: [
      'Upcoming AI regulations',
      'Top competitor lacks AI governance',
      'Media increasingly covering AI ethics'
    ],
    implication: 'Regulatory compliance could become competitive weapon',
    action: 'Accelerate compliance and publicize leadership',
    window: '3-6 months before regulations hit'
  });
  
  if (allData.media?.journalists?.some((j: any) => j.competitor_coverage?.length > 0)) {
    insights.hidden_connections.push({
      connection: 'Key journalists already covering competitors',
      elements: [
        'Journalists have existing relationships',
        'Coverage patterns established',
        'Narrative frames already set'
      ],
      implication: 'Must break through established narrative frames',
      action: 'Offer contrarian or complementary angle',
      window: 'Immediate engagement required'
    });
  }
  
  // Non-Obvious Risks
  insights.non_obvious_risks.push({
    risk: 'Success theater among competitors masks industry weakness',
    indicators: [
      'All competitors claiming AI leadership',
      'No concrete implementation examples',
      'Media starting to question authenticity'
    ],
    potential_trigger: 'First major AI failure could taint entire industry',
    mitigation: 'Differentiate with concrete, measurable outcomes',
    probability: 60
  });
  
  if (allData.trends?.declining_topics?.some((t: any) => t.decline_rate > -50)) {
    insights.non_obvious_risks.push({
      risk: 'Rapid narrative shifts leaving companies exposed',
      indicators: [
        'Topics declining faster than ever',
        'Investment in soon-to-be-obsolete narratives',
        'Reputation tied to declining themes'
      ],
      potential_trigger: 'Next trend shift could strand investments',
      mitigation: 'Maintain narrative flexibility, avoid over-commitment',
      probability: 70
    });
  }
  
  // Asymmetric Opportunities
  insights.asymmetric_opportunities.push({
    opportunity: 'Mid-market positioning while giants fight',
    leverage: [
      'Major competitors focused on each other',
      'Mid-market narrative unclaimed',
      'Different success metrics apply'
    ],
    potential_return: '10x visibility in underserved segment',
    investment_required: 'Minimal - repositioning only',
    timing: 'Next 60 days'
  });
  
  if (allData.regulatory?.stakeholders?.research?.length > 0) {
    insights.asymmetric_opportunities.push({
      opportunity: 'Academic partnership for credibility arbitrage',
      leverage: [
        'Research institutions seek industry partners',
        'Academic validation worth more than PR',
        'Long-term credibility compound effect'
      ],
      potential_return: 'Unassailable thought leadership position',
      investment_required: 'Research funding and time',
      timing: 'Begin immediately, payoff in 6-12 months'
    });
  }
  
  // Narrative Leverage Points
  insights.narrative_leverage_points.push({
    leverage_point: 'Industry at "peak hype" for AI',
    opportunity: 'Reality check narrative',
    mechanism: [
      'Everyone claiming AI transformation',
      'Few showing real results',
      'Media hungry for contrarian view'
    ],
    execution: 'Launch "AI Reality Report" with hard data',
    impact: 'Instant thought leadership credibility'
  });
  
  // Strategic Blindspots
  insights.strategic_blindspots.push({
    blindspot: 'Assuming media sentiment is stakeholder sentiment',
    reality: 'Different stakeholders consume different media',
    evidence: [
      'Investor sentiment diverges from media',
      'Employees have different information sources',
      'Customers trust peers over media'
    ],
    correction: 'Multi-channel stakeholder intelligence system',
    urgency: 'medium'
  });
  
  // Black Swan Scenarios
  insights.black_swan_scenarios.push({
    scenario: 'Major AI model failure causes industry-wide trust crisis',
    probability: 15,
    impact: 'catastrophic',
    early_warnings: [
      'Increasing AI hallucination incidents',
      'Growing technical debt in AI systems',
      'Pressure to deploy before ready'
    ],
    preparation: 'AI failure response protocol',
    opportunity: 'Position as "responsible AI" leader before crisis'
  });
  
  if (allData.competitors?.competitors?.direct?.length > 5) {
    insights.black_swan_scenarios.push({
      scenario: 'Industry consolidation wave',
      probability: 25,
      impact: 'transformative',
      early_warnings: [
        'Too many competitors for market size',
        'Funding environment tightening',
        'Customers demanding consolidation'
      ],
      preparation: 'M&A readiness - buy or be bought',
      opportunity: 'Consolidator or consolidation target positioning'
    });
  }
  
  return insights;
}

async function createExecutiveSummary(allData: any, organization: any) {
  console.log(`📝 Creating executive summary...`);
  
  // Count key metrics
  const totalCompetitors = 
    (allData.competitors?.competitors?.direct?.length || 0) +
    (allData.competitors?.competitors?.indirect?.length || 0);
  
  const highThreatCount = allData.competitors?.competitors?.direct
    ?.filter((c: any) => c.threat_level === 'high').length || 0;
  
  const mediaOpportunities = allData.media?.opportunities?.length || 0;
  const conversationGaps = allData.trends?.conversation_gaps?.length || 0;
  const trendingTopics = allData.trends?.trending_topics?.length || 0;
  
  return {
    headline: `${organization.name}: ${highThreatCount} critical threats, ${mediaOpportunities + conversationGaps} immediate opportunities`,
    
    key_findings: [
      {
        finding: `${totalCompetitors} competitors analyzed, ${highThreatCount} pose immediate threat`,
        implication: highThreatCount > 2 ? 'Defensive posture required' : 'Offensive opportunity available',
        action: highThreatCount > 2 ? 'Strengthen differentiation' : 'Capture market share'
      },
      {
        finding: `${trendingTopics} trending topics identified, ${conversationGaps} gaps unclaimed`,
        implication: 'Multiple narrative opportunities available',
        action: 'Claim 1-2 narrative territories immediately'
      },
      {
        finding: `Media sentiment ${allData.media?.sentiment_analysis?.overall || 'neutral'}, ${allData.media?.journalists?.length || 0} key journalists mapped`,
        implication: 'Media relationships need cultivation',
        action: 'Launch targeted journalist engagement'
      },
      {
        finding: `Regulatory intensity: ${allData.regulatory?.regulatory?.regulatory_intensity || 'moderate'}`,
        implication: 'Compliance as competitive advantage',
        action: 'Proactive regulatory engagement'
      }
    ],
    
    critical_actions: [
      'Respond to high-threat competitor moves within 48 hours',
      `Claim unclaimed narrative: "${allData.trends?.conversation_gaps?.[0]?.gap || 'Innovation leadership'}"`,
      'Engage top 3 journalists this week',
      'Prepare for upcoming regulatory changes'
    ],
    
    strategic_position: {
      strengths: [
        'Agility vs larger competitors',
        'Clean reputation slate',
        'Innovation credibility'
      ],
      vulnerabilities: [
        'Limited media relationships',
        'Competitors better funded',
        'Regulatory scrutiny increasing'
      ],
      opportunities: [
        'Multiple narrative vacuums',
        'Competitor vulnerabilities exposed',
        'Media seeking fresh perspectives'
      ],
      threats: [
        'Coordinated competitive moves',
        'Regulatory changes imminent',
        'Narrative windows closing'
      ]
    },
    
    success_metrics: {
      week_1: [
        'Media mentions increase 25%',
        'Claim 1 narrative territory',
        'Engage 3 key journalists'
      ],
      month_1: [
        'Share of voice improve 15%',
        'Sentiment shift to positive',
        'Thought leadership piece published'
      ],
      quarter_1: [
        'Industry leader positioning',
        'Regulatory relationship established',
        'Competitive win rate improved'
      ]
    }
  };
}

async function buildActionMatrix(allData: any) {
  console.log(`📊 Building action priority matrix...`);
  
  const actions = [];
  
  // Extract all recommended actions and score them
  const allRecommendations = allData.strategic_recommendations || {};
  
  // Score immediate actions
  if (allRecommendations.immediate_24h) {
    allRecommendations.immediate_24h.forEach((action: any) => {
      actions.push({
        ...action,
        urgency_score: 10,
        impact_score: assessImpact(action),
        effort_score: assessEffort(action),
        total_priority: 10 * assessImpact(action) / assessEffort(action)
      });
    });
  }
  
  // Score weekly actions
  if (allRecommendations.this_week) {
    allRecommendations.this_week.forEach((action: any) => {
      actions.push({
        ...action,
        urgency_score: 7,
        impact_score: assessImpact(action),
        effort_score: assessEffort(action),
        total_priority: 7 * assessImpact(action) / assessEffort(action)
      });
    });
  }
  
  // Sort by priority and create matrix
  const sortedActions = actions.sort((a, b) => b.total_priority - a.total_priority);
  
  return {
    high_priority_high_impact: sortedActions
      .filter(a => a.urgency_score >= 7 && a.impact_score >= 7)
      .slice(0, 3),
    
    quick_wins: sortedActions
      .filter(a => a.effort_score <= 3 && a.impact_score >= 5)
      .slice(0, 3),
    
    strategic_investments: sortedActions
      .filter(a => a.effort_score >= 7 && a.impact_score >= 8)
      .slice(0, 2),
    
    maintenance_tasks: sortedActions
      .filter(a => a.urgency_score <= 5 && a.impact_score <= 5)
      .slice(0, 2),
    
    top_5_overall: sortedActions.slice(0, 5)
  };
}

function assessImpact(action: any): number {
  // Score impact 1-10 based on expected outcome
  if (action.expected_outcome?.includes('leadership') || 
      action.expected_outcome?.includes('market share')) {
    return 9;
  }
  if (action.expected_outcome?.includes('visibility') || 
      action.expected_outcome?.includes('coverage')) {
    return 7;
  }
  if (action.expected_outcome?.includes('relationship') || 
      action.expected_outcome?.includes('engagement')) {
    return 5;
  }
  return 3;
}

function assessEffort(action: any): number {
  // Score effort 1-10 based on resources needed
  if (action.resources_needed?.includes('executive') || 
      action.resources_needed?.includes('significant')) {
    return 8;
  }
  if (action.resources_needed?.includes('team') || 
      action.resources_needed?.includes('content')) {
    return 5;
  }
  if (action.resources_needed?.includes('minimal') || 
      action.resources_needed?.includes('social')) {
    return 2;
  }
  return 4;
}

function countInsights(eliteInsights: any): number {
  let count = 0;
  Object.values(eliteInsights).forEach((category: any) => {
    if (Array.isArray(category)) {
      count += category.length;
    }
  });
  return count;
}

function countRecommendations(recommendations: any): number {
  let count = 0;
  Object.values(recommendations).forEach((category: any) => {
    if (Array.isArray(category)) {
      count += category.length;
    }
  });
  return count;
}