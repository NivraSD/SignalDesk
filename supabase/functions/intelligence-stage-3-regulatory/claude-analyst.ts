/**
 * Claude Regulatory Expert Personality
 * Analyzes regulatory and compliance landscape
 */

export async function analyzeWithClaudeRegulatory(
  organization: any,
  monitoringData: any,
  existingAnalysis: any
) {
  console.log('🚀 analyzeWithClaudeRegulatory CALLED!');
  
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  console.log('🔑 API Key check:', {
    hasKey: !!ANTHROPIC_API_KEY,
    keyLength: ANTHROPIC_API_KEY?.length,
    keyPrefix: ANTHROPIC_API_KEY?.substring(0, 10)
  });
  
  if (!ANTHROPIC_API_KEY) {
    console.log('❌ CRITICAL: No ANTHROPIC_API_KEY environment variable found!');
    console.log('🔍 Available env vars:', Object.keys(Deno.env.toObject()).filter(k => k.includes('ANTHROPIC') || k.includes('CLAUDE')));
    console.log('⚠️ Claude Regulatory Analyst DISABLED - returning basic fallback');
    return existingAnalysis;
  }
  
  console.log('✅ Claude API key found, starting regulatory analysis...');

  console.log('🤖 Claude Regulatory Analyst starting...', {
    hasMonitoringData: !!monitoringData,
    findingsCount: monitoringData?.findings?.length || 0
  })

  const hasRealData = monitoringData?.findings?.length > 0 || monitoringData?.raw_count > 0;
  
  const prompt = `You are Dr. James Wellington, a Senior Regulatory Affairs Director with 18 years of experience in ${organization.industry || 'business'} compliance and government relations. You've guided companies through major regulatory transitions, enforcement actions, and policy development.

Your expertise includes:
- Regulatory landscape analysis and compliance strategy
- Government relations and stakeholder engagement
- Risk assessment and regulatory impact analysis  
- Enforcement trend monitoring and response planning
- Policy development participation and industry advocacy

ANALYSIS TARGET:
Organization: ${organization.name}
Industry: ${organization.industry || 'Unknown'}

${hasRealData ? 
  `IMPORTANT: Analyze the following REAL monitoring data collected from our intelligence aggregators:

Monitoring Data:
${JSON.stringify(monitoringData, null, 2)}` :
  `NOTE: No fresh monitoring data available. Provide strategic regulatory analysis based on the organization's industry context and typical compliance landscape.`}

Extract regulatory and stakeholder intelligence and provide analysis in this exact JSON structure:

{
  "regulatory": {
    "current_landscape": {
      "active_regulations": ["regulation 1", "regulation 2"],
      "pending_changes": ["upcoming change 1"],
      "compliance_status": "compliant/at_risk/non_compliant",
      "key_regulators": ["regulator 1", "regulator 2"]
    },
    "recent_developments": [
      {
        "development": "what happened",
        "regulator": "who initiated",
        "impact": "high/medium/low",
        "timeline": "when it takes effect",
        "action_required": "what we need to do"
      }
    ],
    "enforcement_trends": {
      "focus_areas": ["area 1", "area 2"],
      "penalty_trends": "increasing/stable/decreasing",
      "scrutiny_level": "high/medium/low"
    }
  },
  "stakeholders": {
    "regulators": [
      {
        "name": "regulator name",
        "jurisdiction": "where they operate",
        "stance": "supportive/neutral/adversarial",
        "recent_actions": ["action 1"],
        "engagement_strategy": "how to work with them"
      }
    ],
    "analysts": [
      {
        "name": "analyst name",
        "firm": "their company",
        "influence": "high/medium/low",
        "recent_coverage": "what they've said",
        "sentiment": "positive/neutral/negative"
      }
    ],
    "investors": [
      {
        "type": "institutional/retail/activist",
        "concerns": ["concern 1"],
        "expectations": ["expectation 1"]
      }
    ]
  },
  "compliance_requirements": {
    "immediate": ["requirement 1", "requirement 2"],
    "upcoming": ["future requirement 1"],
    "best_practices": ["practice 1"],
    "gap_analysis": [
      {
        "area": "where we're lacking",
        "risk": "high/medium/low",
        "remediation": "how to fix"
      }
    ]
  },
  "regulatory_calendar": {
    "deadlines": [
      {
        "date": "YYYY-MM-DD",
        "requirement": "what's due",
        "status": "on_track/at_risk/behind"
      }
    ],
    "upcoming_hearings": [],
    "comment_periods": []
  },
  "risks_and_opportunities": {
    "risks": [
      {
        "type": "regulatory/reputational/operational",
        "description": "specific risk",
        "likelihood": "high/medium/low",
        "impact": "severe/moderate/minor",
        "mitigation": "how to address"
      }
    ],
    "opportunities": [
      {
        "type": "competitive_advantage/market_access/partnership",
        "description": "specific opportunity",
        "requirements": "what's needed",
        "timeline": "when to act"
      }
    ]
  },
  "recommendations": {
    "immediate_actions": ["action 1", "action 2"],
    "compliance_improvements": ["improvement 1"],
    "stakeholder_engagement": ["engagement strategy 1"],
    "monitoring_priorities": ["what to watch"]
  }
}

Focus on actionable regulatory intelligence from the monitoring data.`;

  try {
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
      console.error('Model used:', 'claude-sonnet-4-20250514');
      console.error('API Key prefix:', ANTHROPIC_API_KEY?.substring(0, 15));
      return existingAnalysis;
    }

    const claudeData = await response.json();
    const content = claudeData.content[0].text;
    
    // Extract JSON from Claude's response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const claudeAnalysis = JSON.parse(jsonMatch[0]);
        console.log('✅ Claude regulatory analysis parsed', {
          hasRegulatory: !!claudeAnalysis.regulatory,
          hasStakeholders: !!claudeAnalysis.stakeholders,
          opportunityCount: claudeAnalysis.regulatory?.opportunities?.length || 0
        });
        
        // Merge Claude's analysis with existing data
        return {
          ...existingAnalysis,
          ...claudeAnalysis,
          metadata: {
            ...existingAnalysis.metadata,
            claude_enhanced: true,
            analyst_personality: 'regulatory_compliance_expert',
            analysis_timestamp: new Date().toISOString(),
            had_monitoring_data: hasRealData
          }
        };
      } catch (parseError) {
        console.error('❌ Failed to parse Claude JSON:', parseError);
      }
    } else {
      console.error('❌ No JSON found in Claude regulatory response');
    }
  } catch (error) {
    console.error('❌ Claude regulatory analysis error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 500)
    });
  }

  return existingAnalysis;
}