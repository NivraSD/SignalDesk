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
    console.log('❌ CRITICAL: No ANTHROPIC_API_KEY environment variable found!');
    console.log('🔍 Available env vars:', Object.keys(Deno.env.toObject()).filter(k => k.includes('ANTHROPIC') || k.includes('CLAUDE')));
    console.log('⚠️ Claude Competitive Analyst DISABLED - returning basic fallback');
    return existingAnalysis;
  }
  
  console.log('✅ Claude API key found, starting competitive analysis...');

  console.log('🤖 Claude Competitive Analyst starting...', {
    hasMonitoringData: !!monitoringData,
    findingsCount: monitoringData?.findings?.length || 0,
    hasExistingAnalysis: !!existingAnalysis
  })

  // Determine if we have real monitoring data
  const hasRealData = monitoringData?.findings?.length > 0 || monitoringData?.raw_count > 0;
  
  const prompt = `You are Marcus Chen, a Senior Director of Competitive Intelligence with 15 years of experience in ${organization.industry || 'business'} strategy. You've helped Fortune 500 companies identify competitive threats, market opportunities, and strategic positioning.

Your expertise includes:
- Deep industry analysis and competitor benchmarking
- Strategic threat assessment and competitive moat identification  
- Market positioning and differentiation strategy
- Competitive response planning and battle card development

ANALYSIS TARGET:
Organization: ${organization.name}
Industry: ${organization.industry || 'Unknown'}
Known Competitors: ${existingAnalysis?.competitors?.direct?.map(c => c.name).join(', ') || 'Discovery required'}

${hasRealData ? 
  `IMPORTANT: Analyze the following REAL monitoring data collected from our intelligence aggregators:

Monitoring Data:
${JSON.stringify(monitoringData, null, 2)}` : 
  `NOTE: No fresh monitoring data available. Provide strategic competitive analysis based on the organization's industry context and known market dynamics.`}

${hasRealData ? 
  'Based on the actual monitoring data provided, extract competitor-related intelligence and provide deep competitive analysis' : 
  'Based on industry knowledge and strategic analysis, provide competitive intelligence'} in this exact JSON structure:

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
    console.log('📡 Calling Claude API...');
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
      console.error('❌ CLAUDE API FAILED - THIS IS WHY NO ANALYSIS:', {
        status: response.status,
        error: errorText,
        model: 'claude-sonnet-4-20250514',
        apiKeyLength: ANTHROPIC_API_KEY?.length || 0,
        apiKeyPrefix: ANTHROPIC_API_KEY?.substring(0, 10) || 'NO KEY'
      });
      // Log full error for debugging
      console.error('Full error response:', errorText);
      return existingAnalysis;
    }

    const claudeData = await response.json();
    console.log('✅ Claude response received');
    const content = claudeData.content[0].text;
    
    // Extract JSON from Claude's response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const claudeAnalysis = JSON.parse(jsonMatch[0]);
        console.log('✅ Claude analysis parsed successfully', {
          hasCompetitors: !!claudeAnalysis.competitors,
          directCount: claudeAnalysis.competitors?.direct?.length || 0,
          hasOpportunities: !!claudeAnalysis.competitive_opportunities
        });
        
        // Merge Claude's analysis with existing data
        return {
          ...existingAnalysis,
          ...claudeAnalysis,
          metadata: {
            ...existingAnalysis.metadata,
            claude_enhanced: true,
            analyst_personality: 'competitive_intelligence',
            analysis_timestamp: new Date().toISOString(),
            had_monitoring_data: hasRealData
          }
        };
      } catch (parseError) {
        console.error('❌ Failed to parse Claude JSON:', parseError);
        console.log('Raw content:', jsonMatch[0].substring(0, 500));
      }
    } else {
      console.error('❌ No JSON found in Claude response');
      console.log('Raw response:', content.substring(0, 500));
    }
  } catch (error) {
    console.error('❌ Claude analysis error:', error);
    console.error('Error details:', error.message);
  }

  console.log('⚠️ Returning existing analysis as fallback');
  return existingAnalysis;
}