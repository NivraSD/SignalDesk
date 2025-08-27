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
    console.log('⚠️ No Claude API key, returning existing analysis');
    return existingAnalysis;
  }

  const prompt = `You are an elite trend forecaster and strategic futurist specializing in ${organization.industry || 'business'} innovation.

Organization: ${organization.name}
Industry: ${organization.industry || 'Unknown'}

IMPORTANT: Analyze the following REAL monitoring data collected from our intelligence aggregators:

Monitoring Data:
${JSON.stringify(monitoringData, null, 2)}

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
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 3000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

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
          analysis_timestamp: new Date().toISOString()
        }
      };
    }
  } catch (error) {
    console.error('Claude analysis error:', error);
  }

  return existingAnalysis;
}