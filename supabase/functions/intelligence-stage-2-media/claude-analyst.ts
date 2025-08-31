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
    console.log('❌ CRITICAL: No ANTHROPIC_API_KEY environment variable found!');
    console.log('🔍 Available env vars:', Object.keys(Deno.env.toObject()).filter(k => k.includes('ANTHROPIC') || k.includes('CLAUDE')));
    console.log('⚠️ Claude Media Analyst DISABLED - returning basic fallback');
    return existingAnalysis;
  }
  
  console.log('✅ Claude API key found, starting media analysis...');

  console.log('🤖 Claude Media Analyst starting...', {
    hasMonitoringData: !!monitoringData,
    findingsCount: monitoringData?.findings?.length || 0
  })

  const hasRealData = monitoringData?.findings?.length > 0 || monitoringData?.raw_count > 0;
  
  const prompt = `You are Sarah Rodriguez, an award-winning PR strategist and media intelligence expert with 12 years of experience in ${organization.industry || 'business'} communications. You've managed media strategies for IPOs, crisis communications, and thought leadership campaigns.

Your expertise includes:
- Media landscape mapping and journalist relationship building
- Narrative development and message positioning
- Crisis communication and reputation management
- Thought leadership strategy and executive positioning
- Media sentiment analysis and competitive narrative tracking

ANALYSIS TARGET:
Organization: ${organization.name}  
Industry: ${organization.industry || 'Unknown'}

${hasRealData ? 
  `IMPORTANT: Analyze the following REAL monitoring data collected from our intelligence aggregators:

Monitoring Data:
${JSON.stringify(monitoringData, null, 2)}` :
  `NOTE: No fresh monitoring data available. Provide strategic media analysis based on the organization's industry context and typical media dynamics.`}

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
    console.log('📡 Calling Claude API for media analysis...');
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout for Claude 4
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
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
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      return existingAnalysis;
    }

    console.log('✅ Claude Media response received');
    const claudeData = await response.json();
    const content = claudeData.content[0].text;
    
    // Extract JSON from Claude's response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const claudeAnalysis = JSON.parse(jsonMatch[0]);
        console.log('✅ Claude media analysis parsed', {
          hasMediaLandscape: !!claudeAnalysis.media_landscape,
          hasOpportunities: !!claudeAnalysis.opportunities,
          opportunityCount: claudeAnalysis.opportunities?.length || 0
        });
        
        // Merge Claude's analysis with existing data
        return {
          ...existingAnalysis,
          ...claudeAnalysis,
          metadata: {
            ...existingAnalysis.metadata,
            claude_enhanced: true,
            analyst_personality: 'media_pr_strategist',
            analysis_timestamp: new Date().toISOString(),
            had_monitoring_data: hasRealData
          }
        };
      } catch (parseError) {
        console.error('❌ Failed to parse Claude JSON:', parseError);
      }
    } else {
      console.error('❌ No JSON found in Claude media response');
    }
  } catch (error) {
    console.error('❌ Claude media analysis error:', error);
  }

  console.log('⚠️ Returning existing analysis as fallback');
  return existingAnalysis;
}