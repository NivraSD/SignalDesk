/**
 * Claude Intelligence Synthesizer Personality
 * Provides comprehensive analysis and PR implications (NOT strategic recommendations)
 */

export async function analyzeWithClaudeSynthesis(
  organization: any,
  allStageData: any,
  monitoringData: any,
  existingAnalysis: any
) {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) {
    console.log('⚠️ No Claude API key, returning existing analysis');
    return existingAnalysis;
  }

  const prompt = `You are an elite intelligence analyst specializing in ${organization.industry || 'business'} intelligence synthesis and PR implications.

Organization: ${organization.name}
Industry: ${organization.industry || 'Unknown'}

You have received intelligence from multiple specialized analysts. Your role is to SYNTHESIZE this intelligence to help users understand:
1. WHAT is happening in their environment
2. WHAT it means for them
3. WHAT the PR implications are

IMPORTANT: You are NOT providing strategic recommendations. You are providing analysis and understanding.

Stage 1 - Competitive Intelligence:
${JSON.stringify(allStageData.stage1 || allStageData.competitors || {}, null, 2)}

Stage 2 - Media Analysis:
${JSON.stringify(allStageData.stage2 || allStageData.media || {}, null, 2)}

Stage 3 - Regulatory Intelligence:
${JSON.stringify(allStageData.stage3 || allStageData.regulatory || {}, null, 2)}

Stage 4 - Trend Analysis:
${JSON.stringify(allStageData.stage4 || allStageData.trends || {}, null, 2)}

Raw Monitoring Data:
${JSON.stringify(monitoringData, null, 2)}

Provide comprehensive synthesis in this exact JSON structure:

{
  "executive_summary": {
    "key_developments": [
      {
        "development": "what happened",
        "source": "which stage/data this came from",
        "significance": "why it matters",
        "pr_implication": "how it affects narrative"
      }
    ],
    "comparative_position": {
      "vs_competitors": "how ${organization.name} compares overall",
      "strengths_highlighted": ["where you're ahead"],
      "gaps_identified": ["where you're behind"],
      "narrative_comparison": "your story vs their story"
    },
    "narrative_health": {
      "current_perception": "how you're perceived",
      "sentiment_trajectory": "improving/stable/declining",
      "narrative_control": "strong/moderate/weak",
      "key_messages_resonance": "which messages are landing"
    },
    "pr_implications": [
      {
        "implication": "specific PR challenge or opportunity",
        "urgency": "immediate/short-term/long-term",
        "affected_stakeholders": ["who cares about this"]
      }
    ]
  },
  "cross_dimensional_insights": {
    "connections": [
      {
        "insight": "how different intelligence pieces connect",
        "supporting_evidence": ["from stage X", "from stage Y"],
        "meaning": "what this connection reveals"
      }
    ],
    "patterns": [
      {
        "pattern": "consistent theme across intelligence",
        "occurrences": ["where we see this"],
        "interpretation": "what it means"
      }
    ],
    "contradictions": [
      {
        "conflict": "where signals disagree",
        "sources": ["source 1 says X", "source 2 says Y"],
        "assessment": "which is likely more accurate and why"
      }
    ]
  },
  "early_signals": {
    "weak_signals": [
      {
        "signal": "subtle indicator",
        "source": "where detected",
        "potential_evolution": "what this could become",
        "monitoring_recommendation": "what to watch"
      }
    ],
    "emerging_narratives": [
      {
        "narrative": "story just beginning",
        "early_advocates": ["who's pushing this"],
        "trajectory": "likely direction",
        "pr_consideration": "how to position"
      }
    ],
    "pre_cascade_indicators": [
      {
        "indicator": "thing that might snowball",
        "trigger_conditions": "what would cause cascade",
        "potential_impact": "if it cascades",
        "early_positioning": "how to prepare narratively"
      }
    ]
  },
  "meaning_and_context": {
    "environmental_assessment": {
      "market_dynamics": "what's happening in your market",
      "competitive_landscape": "how the field is shifting",
      "regulatory_climate": "compliance and policy environment",
      "media_environment": "narrative landscape",
      "technological_shifts": "innovation impacts"
    },
    "organizational_position": {
      "current_standing": "where ${organization.name} sits today",
      "trajectory": "where things are heading",
      "perception_gaps": "reality vs perception",
      "narrative_opportunities": "stories you could better tell"
    },
    "pr_impact_analysis": {
      "immediate_considerations": ["what needs PR attention now"],
      "developing_situations": ["what to prepare for"],
      "narrative_risks": ["stories that could hurt"],
      "narrative_assets": ["stories that help"]
    },
    "stakeholder_implications": {
      "media": "what journalists are thinking",
      "regulators": "what regulators are watching",
      "competitors": "what competitors are doing",
      "market": "what the market believes"
    }
  },
  "intelligence_quality": {
    "coverage_assessment": {
      "well_covered": ["what we know well"],
      "gaps": ["what we're missing"],
      "blind_spots": ["what we can't see"]
    },
    "confidence_levels": {
      "high_confidence": ["what we're sure about"],
      "moderate_confidence": ["what we think is true"],
      "low_confidence": ["what we're guessing"]
    },
    "intelligence_freshness": {
      "current": ["real-time intelligence"],
      "recent": ["last 7 days"],
      "aging": ["needs refresh"]
    }
  },
  "key_takeaways": {
    "what_happened": ["top 3-5 developments"],
    "what_it_means": ["top 3-5 implications"],
    "pr_priorities": ["top 3-5 PR considerations"],
    "watch_items": ["top 3-5 things to monitor"]
  },
  "consolidated_opportunities": {
    "from_media": "Extract opportunities from Stage 2 media analysis",
    "from_regulatory": "Extract opportunities from Stage 3 regulatory analysis",
    "from_trends": "Extract opportunities from Stage 4 trends analysis",
    "prioritized_list": [
      {
        "opportunity": "specific opportunity",
        "source_stage": "which stage identified this",
        "type": "competitive/narrative/regulatory/trend",
        "urgency": "immediate/high/medium/low",
        "confidence": "confidence percentage",
        "pr_angle": "how to leverage this",
        "quick_summary": "one-line description"
      }
    ],
    "total_opportunities": "count of all opportunities found"
  }
}

Remember: Focus on ANALYSIS and UNDERSTANDING, not strategic recommendations. Help users comprehend their environment and PR implications.`;

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
        max_tokens: 4000,
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
          analyst_personality: 'intelligence_synthesizer',
          analysis_timestamp: new Date().toISOString()
        }
      };
    }
  } catch (error) {
    console.error('Claude analysis error:', error);
  }

  return existingAnalysis;
}