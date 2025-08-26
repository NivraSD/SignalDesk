import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-3048810124b640eb99293880a4ab25d0';

/**
 * Stage 1: Deep Competitor Analysis with REAL DATA
 * Uses Firecrawl API for actual web scraping
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { organization, competitors = [] } = await req.json();
    console.log(`🎯 Stage 1: Real Competitor Analysis for ${organization.name}`);
    
    // First, retrieve any existing intelligence from the database
    let enhancedCompetitors = [...competitors];
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
            action: 'getTargets',
            organization_name: organization.name
          })
        }
      );
      
      if (persistResponse.ok) {
        const { targets } = await persistResponse.json();
        if (targets?.competitors) {
          console.log(`📊 Found ${targets.competitors.length} competitors in database`);
          // Merge database competitors with provided ones
          const dbCompetitorNames = targets.competitors.map((c: any) => c.name);
          for (const dbComp of targets.competitors) {
            if (!competitors.some((c: any) => (c.name || c) === dbComp.name)) {
              enhancedCompetitors.push(dbComp);
            }
          }
        }
      }
    } catch (e) {
      console.log('Could not retrieve targets:', e);
    }
    
    console.log(`📊 Total competitors to analyze: ${enhancedCompetitors.length}`);

    const startTime = Date.now();
    const results = {
      organization: await analyzeOrganization(organization),
      competitors: await analyzeAllCompetitorsWithRealData(enhancedCompetitors, organization),
      competitive_landscape: null,
      metadata: {
        stage: 1,
        duration: 0,
        competitors_analyzed: enhancedCompetitors.length,
        data_source: 'firecrawl_api',
        competitors_from_db: enhancedCompetitors.length - competitors.length
      }
    };

    // Deep competitive landscape analysis
    results.competitive_landscape = await analyzeCompetitiveLandscape(
      results.organization,
      results.competitors
    );

    results.metadata.duration = Date.now() - startTime;
    console.log(`✅ Stage 1 complete in ${results.metadata.duration}ms`);

    // Save competitor analysis results to database
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
            stage: 'competitor_analysis',
            data_type: 'competitor_insights',
            content: results,
            metadata: {
              stage: 1,
              competitors_analyzed: enhancedCompetitors.length,
              timestamp: new Date().toISOString()
            }
          })
        }
      );
      console.log('💾 Competitor analysis saved to database');
    } catch (e) {
      console.log('Could not save competitor analysis:', e);
    }

    return new Response(JSON.stringify({
      success: true,
      stage: 'competitor_analysis',
      data: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Stage 1 Error:', error);
    return new Response(JSON.stringify({
      success: false,
      stage: 'competitor_analysis',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function analyzeOrganization(org: any) {
  console.log(`🏢 Analyzing ${org.name} with real data...`);
  
  // Search for real data about the organization
  const orgData = await searchFirecrawl(org.name, 5);
  
  // Extract key information from real search results
  const strengths = [];
  const vulnerabilities = [];
  let marketPerception = 'Unknown';
  let recentMomentum = 'Unknown';
  
  if (orgData && orgData.length > 0) {
    // Analyze real content for insights
    const content = orgData.map(d => `${d.title} ${d.content}`).join(' ').toLowerCase();
    
    // Detect strengths
    if (content.includes('leader') || content.includes('leading')) strengths.push('Market leadership position');
    if (content.includes('innovat') || content.includes('breakthrough')) strengths.push('Innovation capability');
    if (content.includes('growth') || content.includes('expand')) strengths.push('Growth trajectory');
    if (content.includes('partner') || content.includes('collaborat')) strengths.push('Strong partnerships');
    
    // Detect vulnerabilities
    if (content.includes('challeng') || content.includes('struggle')) vulnerabilities.push('Facing challenges');
    if (content.includes('compet') || content.includes('rival')) vulnerabilities.push('Competitive pressure');
    if (content.includes('regulatory') || content.includes('compliance')) vulnerabilities.push('Regulatory scrutiny');
    
    // Detect perception
    if (content.includes('innovative') || content.includes('disrupt')) marketPerception = 'Innovative disruptor';
    else if (content.includes('reliable') || content.includes('trusted')) marketPerception = 'Trusted established player';
    else if (content.includes('emerging') || content.includes('startup')) marketPerception = 'Emerging challenger';
    
    // Detect momentum
    if (content.includes('accelerat') || content.includes('surge')) recentMomentum = 'Accelerating';
    else if (content.includes('steady') || content.includes('consistent')) recentMomentum = 'Steady';
    else if (content.includes('slow') || content.includes('decline')) recentMomentum = 'Slowing';
  }
  
  return {
    deep_profile: {
      name: org.name,
      industry: org.industry,
      description: org.description,
      business_model: org.business_model || 'Unknown',
      market_position: org.market_position || 'Unknown',
      key_products: org.key_products || [],
      target_customers: org.target_customers || [],
      estimated_revenue: org.revenue || 'Private',
      employee_count: org.employees || 'Unknown',
      founding_year: org.founding_year || 'Unknown',
      headquarters: org.headquarters || 'Unknown',
      key_executives: org.executives || [],
      recent_mentions: orgData.slice(0, 3)
    },
    strengths: strengths.length > 0 ? strengths : ['Data limited'],
    vulnerabilities: vulnerabilities.length > 0 ? vulnerabilities : ['Data limited'],
    market_perception: marketPerception,
    recent_momentum: recentMomentum
  };
}

async function analyzeAllCompetitorsWithRealData(competitors: string[], organization: any) {
  console.log(`🎯 Analyzing ${competitors.length} competitors with real data...`);
  
  const competitorAnalysis = {
    direct: [] as any[],
    indirect: [] as any[],
    emerging: [] as any[]
  };

  // Analyze each competitor with real data
  for (const competitor of competitors.slice(0, 5)) { // Limit to 5 for API rate limits
    console.log(`  📍 Fetching real data for ${competitor}...`);
    
    const analysis = await analyzeCompetitorWithRealData(competitor, organization);
    
    // Categorize based on real threat level
    if (analysis.threat_level === 'high' || analysis.competitive_overlap > 0.7) {
      competitorAnalysis.direct.push(analysis);
    } else if (analysis.threat_level === 'medium') {
      competitorAnalysis.indirect.push(analysis);
    } else {
      competitorAnalysis.emerging.push(analysis);
    }
    
    // Rate limit delay for Firecrawl API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return competitorAnalysis;
}

async function analyzeCompetitorWithRealData(competitorName: string, organization: any) {
  console.log(`🔍 Gathering real data for ${competitorName}...`);
  
  // Search for recent news and information about the competitor
  const searchResults = await searchFirecrawl(`${competitorName} latest news announcements 2024 2025`, 10);
  
  // Also search for competitive comparison
  const comparisonResults = await searchFirecrawl(`${competitorName} vs ${organization.name}`, 3);
  
  const allResults = [...(searchResults || []), ...(comparisonResults || [])];
  
  // Extract real recent actions from search results
  const recentActions = extractRecentActions(allResults, competitorName);
  
  // Calculate competitive overlap based on real data
  const competitiveOverlap = calculateRealCompetitiveOverlap(allResults, competitorName, organization);
  
  // Assess threat level based on real activity
  const threatLevel = assessRealThreatLevel(recentActions, competitiveOverlap, allResults);
  
  // Extract real insights
  const advantages = extractCompetitorAdvantages(allResults, competitorName);
  const weaknesses = extractCompetitorWeaknesses(allResults, competitorName);
  const nextMoves = predictNextMovesFromRealData(recentActions, allResults);
  
  return {
    name: competitorName,
    recent_actions: recentActions,
    threat_level: threatLevel,
    competitive_overlap: competitiveOverlap,
    areas_of_conflict: identifyRealConflictAreas(allResults, competitorName, organization),
    competitive_advantages: advantages,
    competitive_weaknesses: weaknesses,
    likely_next_moves: nextMoves,
    pr_implications: generateRealPRImplications(competitorName, recentActions, threatLevel),
    counter_strategies: generateRealCounterStrategies(competitorName, threatLevel, weaknesses),
    data_sources: allResults.slice(0, 3).map(r => ({
      title: r.title,
      url: r.url,
      date: r.published_at
    }))
  };
}

async function searchFirecrawl(query: string, limit: number = 5) {
  try {
    console.log(`  🔥 Firecrawl search: "${query}"`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        limit: limit,
        scrapeOptions: {
          formats: ['markdown', 'html']
        }
      })
    });
    
    if (!response.ok) {
      console.error(`Firecrawl error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data.map((result: any) => ({
        title: result.title || '',
        content: result.markdown || result.content || '',
        url: result.url || '',
        source: result.url ? new URL(result.url).hostname : 'unknown',
        published_at: result.publishedAt || new Date().toISOString(),
        raw: result
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Firecrawl search error:', error);
    return [];
  }
}

function extractRecentActions(searchResults: any[], competitor: string) {
  const actions = [];
  
  for (const result of searchResults) {
    const content = `${result.title} ${result.content}`.toLowerCase();
    
    let actionType = 'general_news';
    let impact = 'medium';
    
    // Detect action types from real content
    if (content.includes('launch') || content.includes('announce') || content.includes('unveil')) {
      actionType = 'product_launch';
      impact = 'high';
    } else if (content.includes('acqui') || content.includes('buy') || content.includes('purchase')) {
      actionType = 'acquisition';
      impact = 'high';
    } else if (content.includes('partner') || content.includes('collaborat') || content.includes('team')) {
      actionType = 'partnership';
      impact = 'high';
    } else if (content.includes('expand') || content.includes('growth') || content.includes('scale')) {
      actionType = 'expansion';
      impact = 'medium';
    } else if (content.includes('ceo') || content.includes('executive') || content.includes('appoint')) {
      actionType = 'leadership_change';
      impact = 'medium';
    } else if (content.includes('funding') || content.includes('raise') || content.includes('investment')) {
      actionType = 'funding_round';
      impact = 'high';
    } else if (content.includes('pivot') || content.includes('strategy') || content.includes('transform')) {
      actionType = 'strategic_pivot';
      impact = 'high';
    }
    
    actions.push({
      type: actionType,
      description: result.title.substring(0, 200),
      date: result.published_at,
      impact: impact,
      source: result.source,
      url: result.url
    });
  }
  
  // Sort by date and return top actions
  return actions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
}

function calculateRealCompetitiveOverlap(results: any[], competitor: string, organization: any) {
  if (!results || results.length === 0) return 0.5;
  
  const content = results.map(r => `${r.title} ${r.content}`).join(' ').toLowerCase();
  const orgName = organization.name.toLowerCase();
  
  let overlap = 0.3; // Base overlap
  
  // Check for direct comparisons
  if (content.includes(`${competitor.toLowerCase()} vs ${orgName}`) || 
      content.includes(`${orgName} vs ${competitor.toLowerCase()}`)) {
    overlap += 0.3;
  }
  
  // Check for same market mentions
  if (content.includes('compet') || content.includes('rival')) {
    overlap += 0.2;
  }
  
  // Check for same industry keywords
  const industryKeywords = organization.keywords || [];
  for (const keyword of industryKeywords) {
    if (content.includes(keyword.toLowerCase())) {
      overlap += 0.1;
      if (overlap >= 1) break;
    }
  }
  
  return Math.min(overlap, 1);
}

function assessRealThreatLevel(actions: any[], overlap: number, results: any[]): 'high' | 'medium' | 'low' {
  const highImpactActions = actions.filter(a => a.impact === 'high').length;
  const content = results.map(r => `${r.title} ${r.content}`).join(' ').toLowerCase();
  
  // Check for aggressive competitive signals
  const aggressiveSignals = ['outpace', 'disrupt', 'challenge', 'overtake', 'dominate'];
  const hasAggressiveSignals = aggressiveSignals.some(signal => content.includes(signal));
  
  if (overlap > 0.7 && (highImpactActions > 1 || hasAggressiveSignals)) return 'high';
  if (overlap > 0.5 || highImpactActions > 0) return 'medium';
  return 'low';
}

function extractCompetitorAdvantages(results: any[], competitor: string) {
  const advantages = [];
  const content = results.map(r => `${r.title} ${r.content}`).join(' ').toLowerCase();
  
  // Detect advantages from real content
  if (content.includes('market leader') || content.includes('dominant')) {
    advantages.push('Market leadership position');
  }
  if (content.includes('funding') || content.includes('billion') || content.includes('investment')) {
    advantages.push('Strong funding and resources');
  }
  if (content.includes('innovat') || content.includes('breakthrough') || content.includes('pioneer')) {
    advantages.push('Innovation leadership');
  }
  if (content.includes('customer') && (content.includes('satisfaction') || content.includes('love'))) {
    advantages.push('Strong customer satisfaction');
  }
  if (content.includes('global') || content.includes('international')) {
    advantages.push('Global presence');
  }
  if (content.includes('patent') || content.includes('proprietary')) {
    advantages.push('Proprietary technology');
  }
  
  return advantages.length > 0 ? advantages : ['Limited public information'];
}

function extractCompetitorWeaknesses(results: any[], competitor: string) {
  const weaknesses = [];
  const content = results.map(r => `${r.title} ${r.content}`).join(' ').toLowerCase();
  
  // Detect weaknesses from real content
  if (content.includes('lawsuit') || content.includes('legal') || content.includes('investigation')) {
    weaknesses.push('Legal or regulatory challenges');
  }
  if (content.includes('layoff') || content.includes('restructur') || content.includes('cuts')) {
    weaknesses.push('Organizational restructuring');
  }
  if (content.includes('criticism') || content.includes('backlash') || content.includes('controversy')) {
    weaknesses.push('Public perception issues');
  }
  if (content.includes('delay') || content.includes('behind schedule') || content.includes('postpone')) {
    weaknesses.push('Execution delays');
  }
  if (content.includes('security') && (content.includes('breach') || content.includes('vulnerability'))) {
    weaknesses.push('Security concerns');
  }
  if (content.includes('expensive') || content.includes('costly') || content.includes('price')) {
    weaknesses.push('Pricing challenges');
  }
  
  return weaknesses.length > 0 ? weaknesses : ['No obvious weaknesses detected'];
}

function predictNextMovesFromRealData(actions: any[], results: any[]) {
  const predictions = [];
  const content = results.map(r => `${r.title} ${r.content}`).join(' ').toLowerCase();
  
  // Based on real signals, predict next moves
  if (actions.some(a => a.type === 'funding_round')) {
    predictions.push('Likely to accelerate hiring and expansion');
  }
  if (actions.some(a => a.type === 'product_launch')) {
    predictions.push('Marketing push and customer acquisition focus');
  }
  if (content.includes('ai') || content.includes('artificial intelligence')) {
    predictions.push('AI feature development and integration');
  }
  if (content.includes('international') || content.includes('expand')) {
    predictions.push('Geographic expansion likely');
  }
  if (content.includes('partner') || content.includes('ecosystem')) {
    predictions.push('Partnership announcements expected');
  }
  
  return predictions.length > 0 ? predictions : ['Maintaining current strategy'];
}

function identifyRealConflictAreas(results: any[], competitor: string, organization: any) {
  const areas = [];
  const content = results.map(r => `${r.title} ${r.content}`).join(' ').toLowerCase();
  
  // Identify real areas of competition
  if (content.includes('customer') || content.includes('user') || content.includes('client')) {
    areas.push('Customer acquisition');
  }
  if (content.includes('talent') || content.includes('hire') || content.includes('recruit')) {
    areas.push('Talent competition');
  }
  if (content.includes('market share') || content.includes('dominan')) {
    areas.push('Market share');
  }
  if (content.includes('innovat') || content.includes('technology')) {
    areas.push('Technology leadership');
  }
  if (content.includes('price') || content.includes('cost')) {
    areas.push('Pricing competition');
  }
  
  return areas.length > 0 ? areas : ['General market competition'];
}

function generateRealPRImplications(competitor: string, actions: any[], threatLevel: string) {
  const implications = [];
  
  if (threatLevel === 'high') {
    implications.push(`Immediate response needed to ${competitor}'s aggressive moves`);
    implications.push('Strengthen differentiation messaging');
    implications.push('Prepare defensive PR strategy');
  }
  
  // Based on real actions
  actions.forEach(action => {
    if (action.type === 'product_launch' && action.impact === 'high') {
      implications.push('Counter with our innovation narrative');
    }
    if (action.type === 'funding_round') {
      implications.push('Emphasize our efficiency and results over funding');
    }
    if (action.type === 'partnership') {
      implications.push('Highlight our ecosystem and partnerships');
    }
  });
  
  return implications.length > 0 ? implications : ['Monitor and maintain current positioning'];
}

function generateRealCounterStrategies(competitor: string, threatLevel: string, weaknesses: string[]) {
  const strategies = [];
  
  if (threatLevel === 'high') {
    strategies.push('Launch preemptive announcement campaign');
    strategies.push('Accelerate product roadmap visibility');
    strategies.push('Strengthen customer success stories');
  } else if (threatLevel === 'medium') {
    strategies.push('Maintain competitive monitoring');
    strategies.push('Reinforce core value propositions');
  }
  
  // Exploit detected weaknesses
  weaknesses.forEach(weakness => {
    if (weakness.includes('Legal') || weakness.includes('regulatory')) {
      strategies.push('Emphasize compliance and trust');
    }
    if (weakness.includes('perception')) {
      strategies.push('Highlight positive customer testimonials');
    }
    if (weakness.includes('Security')) {
      strategies.push('Promote security-first approach');
    }
  });
  
  return strategies.length > 0 ? strategies : ['Continue current strategy'];
}

async function analyzeCompetitiveLandscape(organization: any, competitors: any) {
  console.log('🌍 Analyzing competitive landscape with real data...');
  
  const directCompetitors = competitors.direct || [];
  const allCompetitors = [
    ...directCompetitors,
    ...(competitors.indirect || []),
    ...(competitors.emerging || [])
  ];
  
  return {
    market_dynamics: {
      competition_intensity: directCompetitors.length > 3 ? 'high' : 'moderate',
      market_maturity: detectMarketMaturity(allCompetitors),
      disruption_risk: detectDisruptionRisk(allCompetitors),
      consolidation_likelihood: directCompetitors.length > 5 ? 'high' : 'low'
    },
    power_shifts: identifyRealPowerShifts(allCompetitors),
    narrative_battles: identifyRealNarrativeBattles(allCompetitors),
    opportunity_windows: identifyRealOpportunities(organization, allCompetitors),
    defensive_priorities: identifyRealDefensivePriorities(organization, directCompetitors)
  };
}

function detectMarketMaturity(competitors: any[]) {
  const hasUnicorns = competitors.some(c => 
    c.recent_actions?.some((a: any) => a.description?.toLowerCase().includes('billion'))
  );
  const hasManyPlayers = competitors.length > 10;
  
  if (hasUnicorns && hasManyPlayers) return 'mature';
  if (hasManyPlayers) return 'growth_phase';
  return 'emerging';
}

function detectDisruptionRisk(competitors: any[]) {
  const hasDisruptors = competitors.some(c => 
    c.recent_actions?.some((a: any) => 
      a.description?.toLowerCase().includes('disrupt') ||
      a.description?.toLowerCase().includes('revolutionary')
    )
  );
  
  return hasDisruptors ? 'high' : 'moderate';
}

function identifyRealPowerShifts(competitors: any[]) {
  const shifts = [];
  
  const fundedCompetitors = competitors.filter(c => 
    c.recent_actions?.some((a: any) => a.type === 'funding_round')
  );
  
  if (fundedCompetitors.length > 0) {
    shifts.push(`${fundedCompetitors.length} competitors secured funding - market consolidation likely`);
  }
  
  const expandingCompetitors = competitors.filter(c =>
    c.recent_actions?.some((a: any) => a.type === 'expansion')
  );
  
  if (expandingCompetitors.length > 0) {
    shifts.push('Geographic and market expansion accelerating');
  }
  
  return shifts.length > 0 ? shifts : ['Market dynamics stable'];
}

function identifyRealNarrativeBattles(competitors: any[]) {
  const narratives = new Set<string>();
  
  competitors.forEach(c => {
    c.recent_actions?.forEach((action: any) => {
      const desc = action.description?.toLowerCase() || '';
      if (desc.includes('ai') || desc.includes('artificial')) narratives.add('AI leadership');
      if (desc.includes('sustain') || desc.includes('green')) narratives.add('Sustainability');
      if (desc.includes('privacy') || desc.includes('security')) narratives.add('Trust and security');
      if (desc.includes('innovat')) narratives.add('Innovation leadership');
      if (desc.includes('customer')) narratives.add('Customer success');
    });
  });
  
  return Array.from(narratives);
}

function identifyRealOpportunities(organization: any, competitors: any[]) {
  const opportunities = [];
  
  const weakCompetitors = competitors.filter(c => c.threat_level === 'low');
  if (weakCompetitors.length > 0) {
    opportunities.push(`${weakCompetitors.length} weak competitors creating market opportunity`);
  }
  
  const strugglingCompetitors = competitors.filter(c => 
    c.competitive_weaknesses?.length > 2
  );
  if (strugglingCompetitors.length > 0) {
    opportunities.push('Competitor weaknesses create differentiation opportunity');
  }
  
  opportunities.push('Media seeking fresh perspectives on industry changes');
  
  return opportunities;
}

function identifyRealDefensivePriorities(organization: any, directCompetitors: any[]) {
  const priorities = [];
  
  const highThreatCount = directCompetitors.filter(c => c.threat_level === 'high').length;
  
  if (highThreatCount > 0) {
    priorities.push(`Counter ${highThreatCount} high-threat competitors immediately`);
    priorities.push('Protect core customer base from aggressive poaching');
    priorities.push('Reinforce unique value propositions');
  }
  
  if (directCompetitors.some(c => c.recent_actions?.some((a: any) => a.type === 'product_launch'))) {
    priorities.push('Accelerate product announcements');
  }
  
  return priorities.length > 0 ? priorities : ['Maintain competitive watch'];
}