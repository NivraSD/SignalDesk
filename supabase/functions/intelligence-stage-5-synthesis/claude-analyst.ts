/**
 * Claude Intelligence Synthesizer Personality
 * Provides comprehensive analysis and PR implications (NOT strategic recommendations)
 */

export async function analyzeWithClaudeSynthesis(
  organization: any,
  normalizedData: any,
  previousResults: any,
  existingAnalysis: any
) {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) {
    console.log('⚠️ No Claude API key, returning existing analysis');
    return existingAnalysis;
  }

  console.log('🤖 Claude Synthesis Analyst starting...', {
    hasNormalizedData: !!normalizedData,
    hasCompetitors: normalizedData?.competitors?.all?.length > 0,
    hasMedia: normalizedData?.media?.coverage?.length > 0,
    hasRegulatory: normalizedData?.regulatory?.developments?.length > 0,
    hasTrends: normalizedData?.trends?.topics?.length > 0,
    hasMonitoring: !!normalizedData?.monitoring
  })

  const prompt = `You are an elite intelligence analyst specializing in ${organization.industry || 'business'} intelligence synthesis and PR implications.

Organization: ${organization.name}
Industry: ${organization.industry || 'Unknown'}

You have received intelligence from multiple specialized analysts. Your role is to SYNTHESIZE this intelligence to help users understand:
1. WHAT is happening in their environment
2. WHAT it means for them
3. WHAT the PR implications are

IMPORTANT: You are NOT providing strategic recommendations. You are providing analysis and understanding.

Stage 1 - Competitive Intelligence (COMPLETE CLAUDE ANALYSIS):
${JSON.stringify(normalizedData.fullAnalyses?.stage1_competitive || normalizedData.competitors || {}, null, 2)}

Stage 2 - Media Analysis (COMPLETE CLAUDE ANALYSIS):
${JSON.stringify(normalizedData.fullAnalyses?.stage2_media || normalizedData.media || {}, null, 2)}

Stage 3 - Regulatory Intelligence (COMPLETE CLAUDE ANALYSIS):
${JSON.stringify(normalizedData.fullAnalyses?.stage3_regulatory || normalizedData.regulatory || {}, null, 2)}

Stage 4 - Trend Analysis (COMPLETE CLAUDE ANALYSIS):
${JSON.stringify(normalizedData.fullAnalyses?.stage4_trends || normalizedData.trends || {}, null, 2)}

Raw Monitoring Data (100+ signals collected):
${JSON.stringify(normalizedData.monitoring ? {
  signal_count: normalizedData.monitoring.raw_signals?.length || 0,
  sources: normalizedData.monitoring.metadata?.sources || [],
  sample_signals: normalizedData.monitoring.raw_signals?.slice(0, 10) || [],
  full_data_available: true
} : {}, null, 2)}

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
    "from_media": "Extract ALL media opportunities from Stage 2 analysis - look for gaps, narratives, coverage opportunities",
    "from_regulatory": "Extract ALL regulatory opportunities from Stage 3 analysis - compliance advantages, first-mover opportunities",
    "from_trends": "Extract ALL trend opportunities from Stage 4 analysis - emerging topics, conversation gaps",
    "from_competitive": "Extract ALL competitive opportunities from Stage 1 analysis - differentiation points, weaknesses to exploit",
    "from_synthesis": "Create NEW opportunities by connecting insights across all stages",
    "prioritized_list": [
      {
        "opportunity": "specific actionable PR/marketing opportunity (be specific and detailed)",
        "source_stage": "which stage(s) identified this",
        "type": "competitive/narrative/regulatory/trend/strategic",
        "urgency": "immediate/high/medium/low",
        "confidence": 70-95,
        "pr_angle": "specific approach to leverage this opportunity",
        "quick_summary": "one-line actionable description",
        "supporting_evidence": ["specific data point 1", "specific data point 2"]
      }
    ],
    "total_opportunities": "MUST generate at least 4-8 opportunities based on the intelligence"
  }
}

Remember: Focus on ANALYSIS and UNDERSTANDING, not strategic recommendations. Help users comprehend their environment and PR implications.

CRITICAL REQUIREMENTS - YOU MUST GENERATE RICH, DETAILED CONTENT:

1. EXECUTIVE SUMMARY MUST HAVE:
   - At least 3-5 key_developments with SPECIFIC details from the data
   - DETAILED comparative_position analysis (not generic statements)
   - SPECIFIC narrative_health assessment based on actual signals
   - At least 3-5 SPECIFIC pr_implications with urgency levels

2. CROSS-DIMENSIONAL INSIGHTS MUST HAVE:
   - At least 3-5 connections showing how different data points relate
   - At least 2-3 patterns identified from the intelligence
   - Any contradictions found in the data

3. OPPORTUNITIES - GENERATE AT LEAST 6-10 SPECIFIC OPPORTUNITIES:
   - Each with SPECIFIC PR angle and supporting evidence
   - Draw from EVERY stage of analysis
   - Include immediate, short-term, and long-term opportunities
   - Be SPECIFIC - name competitors, cite trends, reference regulations

4. KEY TAKEAWAYS MUST BE COMPREHENSIVE:
   - 5+ specific things that happened
   - 5+ implications of what it means
   - 5+ PR priorities to address
   - 5+ items to watch

DO NOT GENERATE GENERIC CONTENT. Every item must reference SPECIFIC data from the intelligence provided.
If you generate generic placeholders, you have failed the task.

USE THE FULL 8000 TOKENS AVAILABLE. Generate COMPREHENSIVE, ELITE-LEVEL analysis.`;

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
        model: 'claude-3-5-sonnet-20241022',  // Latest Claude 3.5 Sonnet
        max_tokens: 8000,  // DOUBLE THE OUTPUT CAPACITY
        temperature: 0.7,  // MORE CREATIVE AND COMPREHENSIVE
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
      return existingAnalysis || null;
    }

    const claudeData = await response.json();
    console.log('🔍 Claude API response structure:', {
      hasContent: !!claudeData.content,
      contentType: typeof claudeData.content,
      contentLength: Array.isArray(claudeData.content) ? claudeData.content.length : 0,
      topLevelKeys: Object.keys(claudeData).slice(0, 10)
    });
    
    // Check if we have an error response
    if (claudeData.error) {
      console.error('❌ Claude API error:', claudeData.error);
      return null;
    }
    
    // Safely access content
    if (!claudeData.content || !Array.isArray(claudeData.content) || claudeData.content.length === 0) {
      console.error('❌ Invalid Claude response structure:', claudeData);
      return null;
    }
    
    const content = claudeData.content[0]?.text;
    if (!content) {
      console.error('❌ No text content in Claude response');
      return null;
    }
    
    // Extract JSON from Claude's response (handle potential formatting issues)
    let claudeAnalysis;
    try {
      // First try to parse the entire content as JSON
      claudeAnalysis = JSON.parse(content);
    } catch (e) {
      // If that fails, try to extract JSON from the text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          // Clean up common JSON issues
          let cleanJson = jsonMatch[0]
            .replace(/,\s*}/g, '}')  // Remove trailing commas
            .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
            .replace(/"\s*:\s*undefined/g, '": null')  // Replace undefined with null
            .replace(/'\s*:\s*'/g, '": "')  // Fix single quotes if any
            .trim();
          
          claudeAnalysis = JSON.parse(cleanJson);
        } catch (parseError) {
          console.error('❌ Failed to parse Claude JSON:', parseError);
          console.log('Raw content (first 500 chars):', content.substring(0, 500));
          return null;
        }
      } else {
        console.error('❌ No JSON found in Claude response');
        return null;
      }
    }
    
    if (!claudeAnalysis) {
      console.error('❌ No valid analysis from Claude');
      return null;
    }
    
    // Merge Claude's analysis with existing data
    return {
      ...existingAnalysis,
      ...claudeAnalysis,
      metadata: {
        ...existingAnalysis?.metadata,
        claude_enhanced: true,
        analyst_personality: 'intelligence_synthesizer',
        analysis_timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Claude analysis error:', error);
  }

  return existingAnalysis;
}