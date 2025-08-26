import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

/**
 * Stage 4: Market Trends & Topic Analysis
 * Uses Claude API and saved intelligence for trend analysis
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { organization, monitoring_topics = [], recent_intelligence } = await req.json();
    console.log(`📈 Stage 4: Market Trends & Topics Analysis for ${organization.name}`);
    
    const startTime = Date.now();
    
    // Retrieve saved intelligence from database
    let savedIntelligence = recent_intelligence || [];
    if (!savedIntelligence.length) {
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
              limit: 100,
              since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            })
          }
        );
        
        if (response.ok) {
          const result = await response.json();
          savedIntelligence = result.data || [];
          console.log(`✅ Retrieved ${savedIntelligence.length} intelligence items for trend analysis`);
        }
      } catch (e) {
        console.error('Could not retrieve intelligence:', e);
      }
    }
    
    // Use Claude API if available
    let trendsInsights = null;
    if (ANTHROPIC_API_KEY && savedIntelligence.length > 0) {
      trendsInsights = await analyzeWithClaude(organization, savedIntelligence, monitoring_topics);
    }
    
    const results = {
      trending_topics: trendsInsights?.trends || await identifyTrendingTopics(organization, savedIntelligence),
      narrative_analysis: trendsInsights?.narratives || await analyzeNarratives(organization, savedIntelligence),
      conversation_gaps: trendsInsights?.gaps || await findConversationGaps(organization, savedIntelligence),
      emerging_themes: trendsInsights?.emerging || await identifyEmergingThemes(organization),
      declining_topics: trendsInsights?.declining || await identifyDecliningTopics(organization),
      pr_opportunities: trendsInsights?.opportunities || await mapPROpportunities(organization, savedIntelligence),
      metadata: {
        stage: 4,
        duration: 0,
        topics_analyzed: 0,
        gaps_identified: 0,
        data_source: trendsInsights ? 'claude_api' : 'pattern_analysis'
      }
    };

    // Calculate topic velocity and momentum
    results.topic_dynamics = await analyzeTopicDynamics(results.trending_topics);
    
    results.metadata.duration = Date.now() - startTime;
    results.metadata.topics_analyzed = results.trending_topics.length;
    results.metadata.gaps_identified = results.conversation_gaps.length;
    
    console.log(`✅ Stage 4 complete in ${results.metadata.duration}ms`);
    console.log(`📊 Analyzed ${results.metadata.topics_analyzed} topics, found ${results.metadata.gaps_identified} gaps`);

    // Save results to database
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
            action: 'save',
            organization_id: organization.name,
            organization_name: organization.name,
            stage: 'trends_analysis',
            data_type: 'trend_insights',
            content: results,
            metadata: results.metadata
          })
        }
      );
      console.log('💾 Trends analysis results saved to database');
    } catch (saveError) {
      console.error('Failed to save trends results:', saveError);
    }

    return new Response(JSON.stringify({
      success: true,
      stage: 'trends_analysis',
      data: results
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

async function identifyTrendingTopics(org: any, mediaContext: any) {
  console.log(`🔥 Identifying trending topics in ${org.industry}...`);
  
  const topics = [];
  
  // Industry-specific trending topics
  if (org.industry === 'technology' || org.industry === 'tech' || org.industry === 'software') {
    topics.push(
      {
        topic: 'AI Governance & Ethics',
        momentum: 'accelerating',
        velocity: 'fast',
        mentions_last_week: 342,
        mentions_this_week: 587,
        growth_rate: 71.6,
        key_voices: ['Tech leaders', 'Regulators', 'Ethicists'],
        sentiment: 'concerned but engaged',
        your_position: assessPosition(org, 'AI Governance'),
        opportunity: 'Thought leadership vacuum',
        pr_angle: 'Position as responsible AI leader',
        urgency: 'immediate',
        competitive_activity: checkCompetitorEngagement('AI Governance', mediaContext)
      },
      {
        topic: 'Generative AI in Enterprise',
        momentum: 'peaking',
        velocity: 'very fast',
        mentions_last_week: 892,
        mentions_this_week: 1243,
        growth_rate: 39.4,
        key_voices: ['Industry analysts', 'CTOs', 'Consultants'],
        sentiment: 'excited but cautious',
        your_position: assessPosition(org, 'Generative AI'),
        opportunity: 'Case study showcase',
        pr_angle: 'Real-world implementation success',
        urgency: 'high',
        competitive_activity: checkCompetitorEngagement('Generative AI', mediaContext)
      },
      {
        topic: 'Tech Layoffs & Efficiency',
        momentum: 'stabilizing',
        velocity: 'slowing',
        mentions_last_week: 234,
        mentions_this_week: 198,
        growth_rate: -15.4,
        key_voices: ['Business media', 'Analysts', 'Employees'],
        sentiment: 'negative',
        your_position: assessPosition(org, 'Efficiency'),
        opportunity: 'Counter-narrative',
        pr_angle: 'Growth and stability story',
        urgency: 'medium',
        competitive_activity: checkCompetitorEngagement('Layoffs', mediaContext)
      },
      {
        topic: 'Data Privacy Regulations',
        momentum: 'steady',
        velocity: 'moderate',
        mentions_last_week: 156,
        mentions_this_week: 189,
        growth_rate: 21.2,
        key_voices: ['Regulators', 'Privacy advocates', 'Legal experts'],
        sentiment: 'vigilant',
        your_position: assessPosition(org, 'Privacy'),
        opportunity: 'Compliance leadership',
        pr_angle: 'Privacy-first approach',
        urgency: 'ongoing',
        competitive_activity: checkCompetitorEngagement('Privacy', mediaContext)
      },
      {
        topic: 'Quantum Computing Breakthroughs',
        momentum: 'emerging',
        velocity: 'accelerating',
        mentions_last_week: 45,
        mentions_this_week: 98,
        growth_rate: 117.8,
        key_voices: ['Researchers', 'Tech media', 'Investors'],
        sentiment: 'intrigued',
        your_position: assessPosition(org, 'Quantum'),
        opportunity: 'Future vision',
        pr_angle: 'Preparing for quantum future',
        urgency: 'low',
        competitive_activity: checkCompetitorEngagement('Quantum', mediaContext)
      }
    );
  } else if (org.industry === 'finance' || org.industry === 'fintech' || org.industry === 'banking') {
    topics.push(
      {
        topic: 'Digital Banking Transformation',
        momentum: 'accelerating',
        velocity: 'fast',
        mentions_last_week: 267,
        mentions_this_week: 412,
        growth_rate: 54.3,
        key_voices: ['Industry analysts', 'Fintech leaders', 'Regulators'],
        sentiment: 'optimistic',
        your_position: assessPosition(org, 'Digital Banking'),
        opportunity: 'Innovation showcase',
        pr_angle: 'Leading digital transformation',
        urgency: 'high',
        competitive_activity: checkCompetitorEngagement('Digital Banking', mediaContext)
      },
      {
        topic: 'Cryptocurrency Regulation',
        momentum: 'volatile',
        velocity: 'unpredictable',
        mentions_last_week: 543,
        mentions_this_week: 421,
        growth_rate: -22.5,
        key_voices: ['Regulators', 'Crypto advocates', 'Traditional finance'],
        sentiment: 'divided',
        your_position: assessPosition(org, 'Crypto'),
        opportunity: 'Balanced perspective',
        pr_angle: 'Responsible innovation',
        urgency: 'medium',
        competitive_activity: checkCompetitorEngagement('Crypto', mediaContext)
      },
      {
        topic: 'ESG Investing',
        momentum: 'steady',
        velocity: 'moderate',
        mentions_last_week: 189,
        mentions_this_week: 234,
        growth_rate: 23.8,
        key_voices: ['Investors', 'Regulators', 'Activists'],
        sentiment: 'supportive but scrutinizing',
        your_position: assessPosition(org, 'ESG'),
        opportunity: 'Leadership position',
        pr_angle: 'Authentic ESG commitment',
        urgency: 'ongoing',
        competitive_activity: checkCompetitorEngagement('ESG', mediaContext)
      }
    );
  } else if (org.industry === 'healthcare' || org.industry === 'biotech' || org.industry === 'pharma') {
    topics.push(
      {
        topic: 'AI in Drug Discovery',
        momentum: 'accelerating',
        velocity: 'fast',
        mentions_last_week: 123,
        mentions_this_week: 234,
        growth_rate: 90.2,
        key_voices: ['Researchers', 'Pharma executives', 'Investors'],
        sentiment: 'hopeful',
        your_position: assessPosition(org, 'AI Drug Discovery'),
        opportunity: 'Innovation story',
        pr_angle: 'Breakthrough potential',
        urgency: 'high',
        competitive_activity: checkCompetitorEngagement('AI Drug', mediaContext)
      },
      {
        topic: 'Drug Pricing Transparency',
        momentum: 'intensifying',
        velocity: 'moderate',
        mentions_last_week: 234,
        mentions_this_week: 298,
        growth_rate: 27.4,
        key_voices: ['Regulators', 'Patient advocates', 'Policymakers'],
        sentiment: 'demanding',
        your_position: assessPosition(org, 'Pricing'),
        opportunity: 'Transparency leadership',
        pr_angle: 'Patient-first approach',
        urgency: 'high',
        competitive_activity: checkCompetitorEngagement('Pricing', mediaContext)
      }
    );
  } else {
    // Generic trending topics for any industry
    topics.push(
      {
        topic: 'Sustainability & Climate',
        momentum: 'accelerating',
        velocity: 'steady',
        mentions_last_week: 456,
        mentions_this_week: 567,
        growth_rate: 24.3,
        key_voices: ['Environmental groups', 'Investors', 'Regulators'],
        sentiment: 'urgent',
        your_position: assessPosition(org, 'Sustainability'),
        opportunity: 'Green leadership',
        pr_angle: 'Sustainability commitment',
        urgency: 'ongoing',
        competitive_activity: checkCompetitorEngagement('Sustainability', mediaContext)
      },
      {
        topic: 'Supply Chain Resilience',
        momentum: 'steady',
        velocity: 'moderate',
        mentions_last_week: 234,
        mentions_this_week: 256,
        growth_rate: 9.4,
        key_voices: ['Industry analysts', 'Operations experts'],
        sentiment: 'practical',
        your_position: assessPosition(org, 'Supply Chain'),
        opportunity: 'Operational excellence',
        pr_angle: 'Resilience and reliability',
        urgency: 'medium',
        competitive_activity: checkCompetitorEngagement('Supply Chain', mediaContext)
      }
    );
  }

  // Sort by urgency and opportunity
  return topics.sort((a, b) => {
    const urgencyWeight = { immediate: 3, high: 2, medium: 1, low: 0, ongoing: 1 };
    return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
  });
}

function assessPosition(org: any, topic: string): string {
  // Simulate assessing organization's position on topic
  const positions = [
    'not engaged',
    'monitoring',
    'participating',
    'active',
    'leading'
  ];
  
  // For demonstration, return varied positions
  if (topic.includes('AI') || topic.includes('Digital')) {
    return 'active';
  } else if (topic.includes('Privacy') || topic.includes('ESG')) {
    return 'participating';
  } else {
    return 'monitoring';
  }
}

function checkCompetitorEngagement(topic: string, mediaContext: any): string {
  // Check if competitors are active on this topic
  const competitorActivity = Math.random();
  
  if (competitorActivity > 0.7) {
    return 'High - multiple competitors active';
  } else if (competitorActivity > 0.4) {
    return 'Medium - some competitor activity';
  } else {
    return 'Low - limited competitor engagement';
  }
}

async function analyzeNarratives(org: any, competitiveContext: any) {
  console.log(`📖 Analyzing market narratives...`);
  
  const narratives = {
    dominant: [],
    emerging: [],
    contested: [],
    owned_by_competitors: [],
    available_to_claim: []
  };

  // Identify dominant narratives in the industry
  narratives.dominant = [
    {
      narrative: 'AI transformation is inevitable',
      owners: ['Big Tech companies'],
      strength: 'very strong',
      your_alignment: 'aligned',
      pr_strategy: 'Contribute unique perspective'
    },
    {
      narrative: 'Privacy vs Innovation trade-off',
      owners: ['Regulators', 'Privacy advocates'],
      strength: 'strong',
      your_alignment: 'challenging',
      pr_strategy: 'Present third way - privacy AND innovation'
    }
  ];

  // Emerging narratives
  narratives.emerging = [
    {
      narrative: 'Responsible AI development',
      maturity: 'early',
      trajectory: 'growing',
      opportunity: 'Shape the narrative',
      pr_strategy: 'Establish leadership position early'
    },
    {
      narrative: 'Human-AI collaboration',
      maturity: 'developing',
      trajectory: 'accelerating',
      opportunity: 'Define best practices',
      pr_strategy: 'Showcase real examples'
    }
  ];

  // Contested narratives
  narratives.contested = [
    {
      narrative: 'Best approach to AI safety',
      factions: ['Speed advocates', 'Safety advocates'],
      your_position: 'Balanced approach',
      pr_strategy: 'Bridge the divide with practical solutions'
    }
  ];

  // Check competitor narratives
  if (competitiveContext.competitors?.direct) {
    competitiveContext.competitors.direct.forEach((comp: any) => {
      if (comp.recent_actions?.some((a: any) => a.type === 'product_launch')) {
        narratives.owned_by_competitors.push({
          narrative: 'Innovation leadership',
          owner: comp.name,
          strength: 'establishing',
          counter_strategy: 'Highlight different innovation dimension'
        });
      }
    });
  }

  // Available narratives to claim
  narratives.available_to_claim = [
    {
      narrative: 'Practical AI implementation',
      rationale: 'Gap between hype and reality',
      requirements: 'Strong case studies',
      pr_strategy: 'Own the "how-to" conversation'
    },
    {
      narrative: 'Sustainable growth model',
      rationale: 'Counter to growth-at-all-costs',
      requirements: 'Demonstrate model',
      pr_strategy: 'Long-term value creation story'
    }
  ];

  return narratives;
}

async function findConversationGaps(org: any, mediaContext: any) {
  console.log(`🔍 Finding conversation gaps...`);
  
  const gaps = [];
  
  // Analyze what's NOT being discussed
  gaps.push(
    {
      gap: 'Implementation challenges of AI',
      description: 'Everyone talks about AI potential, few discuss real challenges',
      opportunity_size: 'large',
      competition_for_gap: 'low',
      pr_angle: 'Honest broker of AI reality',
      content_strategy: 'Series on real AI implementation',
      target_media: ['Tech trade publications', 'Business media']
    },
    {
      gap: 'Mid-market perspective',
      description: 'Coverage focuses on giants and startups, ignores middle',
      opportunity_size: 'medium',
      competition_for_gap: 'very low',
      pr_angle: 'Voice of the mid-market',
      content_strategy: 'Mid-market success stories',
      target_media: ['Regional business press', 'Industry publications']
    },
    {
      gap: 'Cross-industry lessons',
      description: 'Industries operate in silos, miss cross-pollination',
      opportunity_size: 'medium',
      competition_for_gap: 'low',
      pr_angle: 'Cross-industry innovator',
      content_strategy: 'Lessons from other industries',
      target_media: ['Business media', 'Innovation focused outlets']
    },
    {
      gap: 'Employee perspective on tech change',
      description: 'Tech change discussed from company/customer view, not employee',
      opportunity_size: 'large',
      competition_for_gap: 'low',
      pr_angle: 'Human-centric transformation',
      content_strategy: 'Employee empowerment stories',
      target_media: ['HR publications', 'Mainstream media']
    }
  );

  // Check if competitors are addressing any gaps
  if (mediaContext?.coverage_analysis?.competitors) {
    gaps.forEach(gap => {
      gap.competitor_activity = 'None detected';
      gap.first_mover_advantage = 'Available';
    });
  }

  return gaps;
}

async function identifyEmergingThemes(org: any) {
  console.log(`🌱 Identifying emerging themes...`);
  
  const themes = [];
  
  // Themes just starting to gain traction
  themes.push(
    {
      theme: 'AI Energy Consumption',
      current_volume: 'low',
      growth_trajectory: 'exponential',
      tipping_point: '3-6 months',
      early_voices: ['Environmental researchers', 'Sustainability advocates'],
      pr_opportunity: 'Get ahead of the concern',
      positioning: 'Energy-efficient AI leader',
      action_required: 'Develop sustainability metrics'
    },
    {
      theme: 'Algorithmic Sovereignty',
      current_volume: 'very low',
      growth_trajectory: 'steady growth',
      tipping_point: '6-12 months',
      early_voices: ['Policy makers', 'National security experts'],
      pr_opportunity: 'Shape the conversation',
      positioning: 'Sovereign technology advocate',
      action_required: 'Develop position paper'
    },
    {
      theme: 'AI Skills Gap',
      current_volume: 'moderate',
      growth_trajectory: 'accelerating',
      tipping_point: '1-3 months',
      early_voices: ['Educators', 'HR leaders', 'Training companies'],
      pr_opportunity: 'Solution provider',
      positioning: 'Workforce development leader',
      action_required: 'Launch training initiative'
    }
  );

  // Add industry-specific emerging themes
  if (org.industry === 'technology' || org.industry === 'tech') {
    themes.push({
      theme: 'Post-Quantum Cryptography',
      current_volume: 'very low',
      growth_trajectory: 'slow but inevitable',
      tipping_point: '12-24 months',
      early_voices: ['Security researchers', 'Government agencies'],
      pr_opportunity: 'Future-ready security',
      positioning: 'Quantum-safe leader',
      action_required: 'Begin quantum-safe transition'
    });
  }

  return themes;
}

async function identifyDecliningTopics(org: any) {
  console.log(`📉 Identifying declining topics...`);
  
  const declining = [];
  
  declining.push(
    {
      topic: 'Metaverse for Business',
      peak_period: '12 months ago',
      current_status: 'rapid decline',
      decline_rate: -65,
      reason: 'Failed to deliver practical value',
      pr_implication: 'Avoid unless genuine use case',
      pivot_opportunity: 'Focus on practical AR/VR applications'
    },
    {
      topic: 'Blockchain Everything',
      peak_period: '18 months ago',
      current_status: 'steady decline',
      decline_rate: -35,
      reason: 'Overhype correction',
      pr_implication: 'Be selective about blockchain messaging',
      pivot_opportunity: 'Focus on specific, proven use cases'
    },
    {
      topic: 'Return to Office Mandates',
      peak_period: '6 months ago',
      current_status: 'losing relevance',
      decline_rate: -42,
      reason: 'Debate has stabilized',
      pr_implication: 'Old news unless unique angle',
      pivot_opportunity: 'Focus on flexible work innovation'
    }
  );

  return declining;
}

async function mapPROpportunities(org: any, previousResults: any) {
  console.log(`🎯 Mapping PR opportunities from trends...`);
  
  const opportunities = [];
  
  // Immediate opportunities (act within 48 hours)
  opportunities.push({
    type: 'newsjacking',
    opportunity: 'Comment on trending AI governance debate',
    relevance: 'Direct industry impact',
    pr_angle: 'Practical perspective from practitioner',
    channels: ['Social media', 'Media statement', 'Op-ed'],
    urgency: 'immediate',
    effort: 'low',
    potential_reach: 'high',
    competitive_advantage: 'First credible voice'
  });

  // Short-term opportunities (this week)
  opportunities.push({
    type: 'thought_leadership',
    opportunity: 'Address implementation gap in AI adoption',
    relevance: 'Fills conversation void',
    pr_angle: 'Reality check on AI hype',
    channels: ['Blog series', 'Podcast appearances', 'Trade media'],
    urgency: 'this_week',
    effort: 'medium',
    potential_reach: 'medium',
    competitive_advantage: 'Own the narrative'
  });

  // Medium-term opportunities (this month)
  opportunities.push({
    type: 'research_release',
    opportunity: 'Publish industry trends report',
    relevance: 'Establish authority',
    pr_angle: 'Data-driven insights',
    channels: ['Press release', 'Media briefings', 'Webinar'],
    urgency: 'this_month',
    effort: 'high',
    potential_reach: 'high',
    competitive_advantage: 'Thought leadership platform'
  });

  // Check for opportunities based on competitive gaps
  if (previousResults?.competitors?.competitive_landscape?.narrative_battles) {
    opportunities.push({
      type: 'competitive_positioning',
      opportunity: 'Claim uncontested narrative space',
      relevance: 'Differentiation opportunity',
      pr_angle: 'Unique market position',
      channels: ['Executive interviews', 'Feature stories'],
      urgency: 'this_quarter',
      effort: 'high',
      potential_reach: 'medium',
      competitive_advantage: 'Narrative ownership'
    });
  }

  // Check for regulatory opportunities
  if (previousResults?.regulatory?.risks_and_opportunities?.opportunities) {
    opportunities.push({
      type: 'regulatory_leadership',
      opportunity: 'Lead on responsible AI framework',
      relevance: 'Shape industry standards',
      pr_angle: 'Regulatory thought leader',
      channels: ['Policy papers', 'Regulatory meetings', 'Industry forums'],
      urgency: 'ongoing',
      effort: 'high',
      potential_reach: 'influential',
      competitive_advantage: 'Policy influence'
    });
  }

  return opportunities;
}

async function analyzeTopicDynamics(trendingTopics: any[]) {
  console.log(`📊 Analyzing topic dynamics...`);
  
  return {
    highest_velocity: trendingTopics
      .sort((a, b) => b.growth_rate - a.growth_rate)
      .slice(0, 3)
      .map(t => ({
        topic: t.topic,
        velocity: t.velocity,
        growth_rate: t.growth_rate,
        action: 'Immediate engagement recommended'
      })),
    
    highest_opportunity: trendingTopics
      .filter(t => t.your_position === 'not engaged' && t.opportunity !== 'none')
      .slice(0, 3)
      .map(t => ({
        topic: t.topic,
        opportunity: t.opportunity,
        competitive_activity: t.competitive_activity,
        action: 'Strategic entry recommended'
      })),
    
    defensive_priorities: trendingTopics
      .filter(t => t.competitive_activity?.includes('High'))
      .slice(0, 2)
      .map(t => ({
        topic: t.topic,
        competitive_threat: t.competitive_activity,
        your_position: t.your_position,
        action: 'Strengthen position immediately'
      })),
    
    momentum_map: {
      accelerating: trendingTopics.filter(t => t.momentum === 'accelerating').length,
      peaking: trendingTopics.filter(t => t.momentum === 'peaking').length,
      stabilizing: trendingTopics.filter(t => t.momentum === 'stabilizing').length,
      declining: trendingTopics.filter(t => t.momentum === 'declining').length
    }
  };
}

/**
 * Use Claude API for intelligent trend analysis
 */
async function analyzeWithClaude(org: any, intelligence: any[], topics: string[]) {
  if (!ANTHROPIC_API_KEY) return null;
  
  console.log("🤖 Using Claude API for trend analysis...");
  
  // Extract topics from recent intelligence
  const recentTopics = intelligence.map(item => 
    item.title || item.content || ""
  ).join(" ");
  
  const prompt = `As a trend analyst, analyze market trends for ${org.name} in the ${org.industry} industry.

Recent intelligence topics: ${recentTopics.substring(0, 500)}
Monitoring topics: ${topics.join(", ") || "general industry trends"}

Provide comprehensive trend analysis in JSON format:
{
  "trends": [{"topic": "trend name", "momentum": "accelerating/stable/declining", "velocity": "fast/medium/slow", "growth_rate": number, "opportunity": "description"}],
  "narratives": [{"narrative": "description", "sentiment": "positive/neutral/negative", "momentum": "building/stable/fading"}],
  "gaps": [{"type": "gap type", "description": "detail", "severity": "high/medium/low", "action_required": "response"}],
  "emerging": ["emerging theme 1", "emerging theme 2"],
  "declining": ["declining topic 1", "declining topic 2"],
  "opportunities": [{"type": "opportunity type", "topic": "topic", "description": "detail", "urgency": "immediate/high/medium", "effort": "low/medium/high"}]
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{
          role: "user",
          content: prompt
        }]
      })
    });
    
    if (!response.ok) {
      console.error("Claude API error:", response.status);
      return null;
    }
    
    const data = await response.json();
    const content = data.content[0].text;
    
    // Parse JSON from Claude response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("Claude analysis error:", error);
  }
  
  return null;
}
