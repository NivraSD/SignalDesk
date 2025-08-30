/**
 * Claude Trend Forecaster Personality
 * Analyzes trends and future opportunities
 */

export async function analyzeWithClaudeTrends(
  organization: any,
  monitoringData: any,
  existingAnalysis: any
) {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) {
    console.log('❌ CRITICAL: No ANTHROPIC_API_KEY environment variable found!');
    console.log('🔍 Available env vars:', Object.keys(Deno.env.toObject()).filter(k => k.includes('ANTHROPIC') || k.includes('CLAUDE')));
    console.log('⚠️ Claude Trends Analyst DISABLED - returning basic fallback');
    return existingAnalysis;
  }
  
  console.log('✅ Claude API key found, starting trends analysis...');
  
  // Determine if we have real monitoring data
  const hasRealData = monitoringData?.findings?.length > 0 || monitoringData?.raw_count > 0;

  const prompt = `You are Dr. Alexandra Kim, a renowned Strategic Futurist and Innovation Intelligence Director with 14 years of experience in ${organization.industry || 'business'} trend analysis. You've advised C-suite executives on disruptive technologies, market shifts, and strategic positioning for the future.

Your expertise includes:
- Emerging technology assessment and adoption forecasting
- Market trend analysis and disruption pattern recognition
- Strategic foresight and scenario planning
- Innovation opportunity identification and timing analysis
- Competitive advantage development through trend leverage

ANALYSIS TARGET:
Organization: ${organization.name}
Industry: ${organization.industry || 'Unknown'}

${hasRealData ? 
  `IMPORTANT: Analyze the following REAL monitoring data collected from our intelligence aggregators:

Monitoring Data:
${JSON.stringify(monitoringData, null, 2)}` : 
  `NOTE: No fresh monitoring data available. Provide strategic trend analysis based on the organization's industry context and current market dynamics.`}

${hasRealData ? 
  'Based on the actual monitoring data provided, extract trend insights and future opportunities' : 
  'Based on industry knowledge and strategic analysis, provide trend intelligence'}

Extract trend insights and future opportunities from the monitoring data. Provide analysis in this exact JSON structure:

{
  "current_trends": {
    "market_trends": [
      {
        "trend": "trend name",
        "strength": "emerging/growing/mature/declining",
        "relevance": "high/medium/low",
        "evidence": ["data point 1", "data point 2"],
        "implications": "what this means for us"
      }
    ],
    "technology_trends": [
      {
        "technology": "tech name",
        "adoption_stage": "experimental/early/mainstream/late",
        "impact_timeline": "0-6 months/6-12 months/1-2 years/2+ years",
        "competitive_advantage": "how we can leverage this"
      }
    ],
    "consumer_trends": [
      {
        "behavior": "what's changing",
        "drivers": ["why it's happening"],
        "opportunity": "how to capitalize"
      }
    ]
  },
  "emerging_opportunities": [
    {
      "opportunity": "specific opportunity",
      "type": "market_expansion/product_innovation/partnership/acquisition",
      "confidence": "high/medium/low",
      "requirements": ["what's needed"],
      "first_movers": ["who's already moving"],
      "window": "time window to act",
      "potential_roi": "high/medium/low"
    }
  ],
  "disruption_signals": [
    {
      "signal": "what we're seeing",
      "source": "where it's coming from",
      "threat_level": "high/medium/low",
      "timeline": "when it might hit",
      "preparation": "how to prepare"
    }
  ],
  "innovation_radar": {
    "breakthrough_technologies": ["tech 1", "tech 2"],
    "emerging_competitors": ["company 1", "company 2"],
    "new_business_models": ["model 1", "model 2"],
    "regulatory_shifts": ["shift 1", "shift 2"]
  },
  "strategic_foresight": {
    "scenarios": [
      {
        "scenario": "scenario name",
        "probability": "high/medium/low",
        "impact": "transformative/significant/moderate/minor",
        "key_indicators": ["what to watch"],
        "strategic_response": "how to prepare"
      }
    ],
    "weak_signals": ["signal 1", "signal 2"],
    "wildcards": ["unexpected event 1"]
  },
  "opportunity_pipeline": {
    "immediate": [
      {
        "action": "what to do now",
        "rationale": "why it matters",
        "resources": "what's needed"
      }
    ],
    "short_term": ["3-6 month opportunities"],
    "medium_term": ["6-12 month opportunities"],
    "long_term": ["1-2 year opportunities"]
  },
  "recommendations": {
    "strategic_pivots": ["potential pivot 1"],
    "innovation_priorities": ["priority 1", "priority 2"],
    "investment_areas": ["area 1", "area 2"],
    "partnership_targets": ["potential partner 1"],
    "capability_gaps": ["what to develop"],
    "monitoring_focus": ["what to track closely"]
  }
}

Focus on actionable trend intelligence and future opportunities from the monitoring data.`;

  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return existingAnalysis;
    }

    const claudeData = await response.json();
    const content = claudeData.content[0].text;
    
    // Extract JSON from Claude's response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const claudeAnalysis = JSON.parse(jsonMatch[0]);
      
      // Merge Claude's analysis with existing data
      return {
        ...existingAnalysis,
        ...claudeAnalysis,
        metadata: {
          ...existingAnalysis.metadata,
          claude_enhanced: true,
          analyst_personality: 'trend_forecaster',
          analysis_timestamp: new Date().toISOString(),
          had_monitoring_data: hasRealData,
          model_used: 'claude-3-5-sonnet-20241022'
        }
      };
    }
  } catch (error) {
    console.error('Claude analysis error:', error);
  }

  return existingAnalysis;
}