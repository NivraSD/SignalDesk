/**
 * Claude Competitive Analyst Personality
 * Analyzes competitors with deep strategic insights
 */

export async function analyzeWithClaudeCompetitive(
  organization: any,
  monitoringData: any,
  existingAnalysis: any
) {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) {
    console.log('⚠️ No Claude API key, returning existing analysis');
    return existingAnalysis;
  }

  const prompt = `You are an elite competitive intelligence analyst specializing in ${organization.industry || 'business'} strategy.

Organization: ${organization.name}
Industry: ${organization.industry || 'Unknown'}

IMPORTANT: Analyze the following REAL monitoring data collected from our intelligence aggregators:

Monitoring Data:
${JSON.stringify(monitoringData, null, 2)}

Based on the actual monitoring data provided, extract competitor-related intelligence and provide deep competitive analysis in this exact JSON structure:

{
  "competitors": {
    "direct": [
      {
        "name": "competitor name",
        "threat_level": "high/medium/low",
        "market_share": "estimated percentage or range",
        "strengths": ["key strength 1", "key strength 2"],
        "weaknesses": ["weakness 1", "weakness 2"],
        "recent_moves": ["recent strategic move 1"],
        "likely_next_moves": ["predicted action 1"]
      }
    ],
    "indirect": [similar structure],
    "emerging": [similar structure],
    "disruption_threats": [
      {
        "threat": "description of disruption threat",
        "probability": "high/medium/low",
        "timeline": "0-6 months/6-12 months/12+ months",
        "impact": "description of potential impact"
      }
    ]
  },
  "competitive_dynamics": {
    "market_concentration": "high/medium/low",
    "competitive_intensity": "fierce/moderate/mild",
    "barrier_to_entry": "high/medium/low",
    "switching_costs": "high/medium/low",
    "key_success_factors": ["factor 1", "factor 2", "factor 3"]
  },
  "strategic_positioning": {
    "our_position": "leader/challenger/follower/niche",
    "differentiation_points": ["unique advantage 1", "unique advantage 2"],
    "vulnerability_points": ["weakness 1", "weakness 2"],
    "competitive_moats": ["moat 1", "moat 2"]
  },
  "battle_cards": {
    "[competitor_name]": {
      "win_themes": ["how to win against them"],
      "defend_themes": ["how to defend against them"],
      "key_differentiators": ["our advantages"],
      "objection_handling": ["common objections and responses"]
    }
  },
  "recommendations": {
    "immediate_actions": ["action 1", "action 2"],
    "strategic_initiatives": ["initiative 1", "initiative 2"],
    "monitoring_priorities": ["what to watch for"]
  }
}

Focus on actionable intelligence and specific competitive insights.`;

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
          analyst_personality: 'competitive_intelligence',
          analysis_timestamp: new Date().toISOString()
        }
      };
    }
  } catch (error) {
    console.error('Claude analysis error:', error);
  }

  return existingAnalysis;
}