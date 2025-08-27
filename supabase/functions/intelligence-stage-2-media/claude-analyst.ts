/**
 * Claude Media Analyst Personality
 * Analyzes media landscape with journalistic expertise
 */

export async function analyzeWithClaudeMedia(
  organization: any,
  monitoringData: any,
  existingAnalysis: any
) {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) {
    console.log('⚠️ No Claude API key, returning existing analysis');
    return existingAnalysis;
  }

  const prompt = `You are an elite media analyst and PR strategist specializing in ${organization.industry || 'business'} media coverage.

Organization: ${organization.name}
Industry: ${organization.industry || 'Unknown'}

IMPORTANT: Analyze the following REAL monitoring data collected from our intelligence aggregators:

Monitoring Data:
${JSON.stringify(monitoringData, null, 2)}

Provide comprehensive media analysis in this exact JSON structure:

{
  "media_landscape": {
    "outlets": [
      {
        "name": "outlet name",
        "type": "tier1/trade/regional/digital/broadcast",
        "relevance": "high/medium/low",
        "coverage_frequency": "daily/weekly/monthly/rare",
        "sentiment": "positive/neutral/negative",
        "relationship_status": "strong/developing/weak/none",
        "key_beats": ["beat 1", "beat 2"],
        "engagement_strategy": "specific approach for this outlet"
      }
    ],
    "priority_targets": ["top outlets to engage"],
    "coverage_gaps": ["outlets not covering us"],
    "competitive_advantages": ["where we outperform competitors"]
  },
  "journalists": [
    {
      "name": "journalist name",
      "outlet": "their publication",
      "beat": "what they cover",
      "influence_score": "high/medium/low",
      "coverage_history": "past coverage of our org/industry",
      "sentiment_tendency": "positive/neutral/critical",
      "topics_of_interest": ["topic 1", "topic 2"],
      "best_approach": "how to engage them",
      "story_preferences": "what types of stories they prefer"
    }
  ],
  "coverage_analysis": {
    "volume_trends": "increasing/stable/declining",
    "share_of_voice": "percentage vs competitors",
    "narrative_control": "strong/moderate/weak",
    "message_penetration": "high/medium/low",
    "key_themes": ["theme 1", "theme 2"],
    "missing_narratives": ["stories we should be telling"],
    "competitive_positioning": {
      "vs_competitor_1": "ahead/behind/equal",
      "narrative_gaps": ["where competitors win"]
    }
  },
  "sentiment_analysis": {
    "overall": "positive/neutral/negative",
    "trend": "improving/stable/declining",
    "drivers": {
      "positive": ["what drives positive coverage"],
      "negative": ["what drives negative coverage"]
    },
    "by_topic": {
      "product": "positive/neutral/negative",
      "leadership": "positive/neutral/negative",
      "financial": "positive/neutral/negative"
    }
  },
  "opportunities": [
    {
      "type": "exclusive/trend_jacking/thought_leadership/crisis_response",
      "headline": "proposed story angle",
      "target_outlets": ["outlet 1", "outlet 2"],
      "target_journalists": ["journalist 1"],
      "timing": "immediate/next_week/next_month",
      "effort": "low/medium/high",
      "impact": "high/medium/low",
      "narrative_benefit": "how this helps our story"
    }
  ],
  "risks": [
    {
      "type": "negative_coverage/competitive_threat/narrative_vacuum",
      "description": "specific risk description",
      "likelihood": "high/medium/low",
      "impact": "severe/moderate/minor",
      "early_indicators": ["what to watch for"],
      "mitigation": "how to prevent or respond",
      "response_protocol": "if it happens, do this"
    }
  ],
  "recommendations": {
    "immediate_actions": ["action 1", "action 2"],
    "media_strategy": ["strategic initiative 1", "strategic initiative 2"],
    "message_development": ["key message 1", "key message 2"],
    "relationship_building": ["journalist/outlet to cultivate"],
    "content_calendar": {
      "next_week": ["story opportunity"],
      "next_month": ["planned announcement"],
      "next_quarter": ["major narrative push"]
    }
  }
}

Provide actionable media intelligence and specific PR recommendations.`;

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
          analyst_personality: 'media_pr_strategist',
          analysis_timestamp: new Date().toISOString()
        }
      };
    }
  } catch (error) {
    console.error('Claude analysis error:', error);
  }

  return existingAnalysis;
}