/**
 * Claude Opportunity Hunter Personality
 * Enhances and prioritizes opportunities for execution
 */

export async function analyzeWithClaudeOpportunities(
  organization: any,
  consolidatedOpportunities: any,
  intelligenceContext: any
) {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) {
    console.log('⚠️ No Claude API key, returning original opportunities');
    return consolidatedOpportunities;
  }

  const prompt = `You are an elite PR opportunity strategist specializing in ${organization.industry || 'business'} opportunity detection and exploitation.

Organization: ${organization.name}
Industry: ${organization.industry || 'Unknown'}

You have received consolidated opportunities from our intelligence pipeline:
${JSON.stringify(consolidatedOpportunities, null, 2)}

Intelligence Context (for additional opportunity detection):
${JSON.stringify(intelligenceContext, null, 2)}

Your mission: Enhance, prioritize, and operationalize these opportunities. Also detect additional opportunities including:
- Narrative vacuums (unowned conversation spaces)
- Competitive weaknesses to exploit
- Cascade predictions (what happens next)
- First-mover advantages

Provide enhanced opportunity analysis in this exact JSON structure:

{
  "immediate_opportunities": [
    {
      "opportunity": "specific opportunity description",
      "type": "competitive_weakness/narrative_vacuum/cascade_effect/trend_leadership/regulatory_advantage",
      "confidence": 85,
      "urgency": "URGENT/HIGH/MEDIUM/LOW",
      "window": "24 hours/48 hours/1 week/2 weeks/1 month",
      "why_now": "why this timing matters",
      "what_to_do": "specific actions to take",
      "pr_angle": "how to position this",
      "content_needed": ["press release", "executive LinkedIn post", "media pitch"],
      "target_journalists": ["Reporter name - Outlet", "Beat reporter - Publication"],
      "success_metrics": ["metric 1", "metric 2"],
      "risk_if_delayed": "what happens if we wait",
      "competitive_advantage": "why we can win this"
    }
  ],
  "cascade_opportunities": [
    {
      "trigger_event": "what's happening now",
      "cascade_prediction": {
        "immediate": "what happens in 1-3 days",
        "near_term": "what happens in 1-2 weeks",
        "medium_term": "what happens in 1-3 months"
      },
      "first_mover_actions": {
        "now": "what to do immediately",
        "next": "what to prepare for next phase",
        "position": "how to own the narrative"
      },
      "confidence": 75,
      "evidence": ["signal 1", "signal 2"],
      "competitive_landscape": "who else might see this"
    }
  ],
  "narrative_vacuums": [
    {
      "topic": "unowned conversation space",
      "evidence": {
        "search_volume": "trending up/stable/emerging",
        "media_interest": "X journalists seeking experts",
        "competitor_silence": "no clear leader",
        "audience_demand": "what people want to know"
      },
      "opportunity_size": "large/medium/small",
      "effort_required": "low/medium/high",
      "positioning_strategy": "how to own this space",
      "content_strategy": ["thought leadership piece", "research report", "executive visibility"],
      "timeline_to_dominate": "2 weeks/1 month/3 months",
      "success_indicators": ["owned search results", "go-to expert status", "media relationships"]
    }
  ],
  "competitive_exploitation": [
    {
      "competitor": "competitor name",
      "weakness_detected": "what vulnerability we found",
      "exploitation_strategy": "how to capitalize",
      "messaging": "our counter-narrative",
      "channels": ["media", "social", "direct"],
      "timing": "when to strike",
      "expected_impact": "high/medium/low"
    }
  ],
  "pattern_based_opportunities": [
    {
      "pattern": "what we've noticed works",
      "success_rate": "X% based on history",
      "recommended_action": "replicate what works",
      "customization": "how to adapt for current situation"
    }
  ],
  "opportunity_queue": {
    "urgent_24h": [
      {
        "action": "specific task",
        "owner": "who should do this",
        "resources": "what's needed",
        "deadline": "specific time"
      }
    ],
    "high_48h": ["opportunity summaries"],
    "medium_1week": ["opportunity summaries"],
    "strategic_1month": ["opportunity summaries"]
  },
  "execution_packages": {
    "[opportunity_id]": {
      "ready_to_deploy": {
        "press_release": "draft if appropriate",
        "social_posts": ["post 1", "post 2"],
        "email_templates": ["pitch 1", "pitch 2"],
        "talking_points": ["point 1", "point 2"]
      },
      "media_targets": [
        {
          "journalist": "name",
          "outlet": "publication",
          "beat": "their focus",
          "angle": "why they'd care",
          "relationship": "existing/new",
          "pitch": "customized approach"
        }
      ],
      "measurement_plan": {
        "kpis": ["metric 1", "metric 2"],
        "timeline": "when to measure",
        "success_threshold": "what success looks like"
      }
    }
  },
  "meta_analysis": {
    "total_opportunities": 25,
    "high_confidence": 8,
    "unique_advantages": ["what only we can do"],
    "resource_requirements": "minimal/moderate/significant",
    "recommended_focus": "top 3 to pursue immediately"
  }
}

Focus on ACTIONABLE opportunities with clear execution paths. Think like a PR operator, not a strategist.`;

  try {
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
        temperature: 0.4, // Slightly higher for creative opportunity detection
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return consolidatedOpportunities;
    }

    const claudeData = await response.json();
    const content = claudeData.content[0].text;
    
    // Extract JSON from Claude's response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const enhancedOpportunities = JSON.parse(jsonMatch[0]);
      
      return {
        ...enhancedOpportunities,
        original_opportunities: consolidatedOpportunities,
        metadata: {
          enhanced_by: 'claude_opportunity_hunter',
          enhancement_timestamp: new Date().toISOString(),
          model: 'claude-sonnet-4-20250514'
        }
      };
    }
  } catch (error) {
    console.error('Claude opportunity analysis error:', error);
  }

  return consolidatedOpportunities;
}