// Claude Intelligence Synthesizer V7 - Entity-Focused Analysis
// Analyzes WHO did WHAT rather than general topics

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

async function analyzeWithClaude(intelligence: any, context: any) {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const orgName = context.name || 'the organization'
  const industry = context.industry || 'general'
  
  // Check if this is entity-focused data
  const isEntityFocused = !!(intelligence['entity-actions'] || intelligence['trends'])
  
  try {
    const prompt = isEntityFocused ? `
You are analyzing entity-focused intelligence for ${orgName} in the ${industry} industry.

Entity Actions Tracked:
${JSON.stringify(intelligence['entity-actions'] || {}, null, 2)}

Industry Trends:
${JSON.stringify(intelligence['trends'] || {}, null, 2)}

Summary:
${JSON.stringify(intelligence['summary'] || {}, null, 2)}

Entities being monitored:
${JSON.stringify(context.entities_monitored || {}, null, 2)}

Analyze this intelligence and structure it into these analytical categories:

1. MARKET ACTIVITY - Current entity movements and actions
   - Focus on WHO did WHAT (specific entities and their actions)
   - Highlight critical movements that directly impact ${orgName}
   - Identify patterns in entity behavior

2. COMPETITOR INTELLIGENCE - Competitor entity actions
   - What specific competitors have done
   - Strategic moves and their implications
   - Competitive threats and opportunities from their actions

3. SOCIAL PULSE - Stakeholder entity actions
   - Actions by regulators, journalists, activists
   - Public sentiment from specific influencers
   - Key voices and their positions

4. INDUSTRY SIGNALS - Broader trends and patterns
   - Topic momentum and relevance
   - Emerging opportunities from trends
   - Risk indicators from industry movements

5. MEDIA COVERAGE - Coverage of entity actions
   - Which entities are getting attention
   - Narrative control by different entities
   - PR implications of entity movements

Return ONLY this JSON structure focusing on ENTITY ACTIONS:
{
  "market_activity": {
    "summary": "Executive summary of key entity movements",
    "key_findings": [
      {
        "entity": "Who did this",
        "action": "What they did",
        "impact": "How it affects ${orgName}",
        "urgency": "critical/high/medium/low"
      }
    ],
    "statistics": {
      "total_actions": number,
      "critical_actions": number
    }
  },
  "competitor_intelligence": {
    "competitors_tracked": ["List of competitors with actions"],
    "movements": [
      {
        "competitor": "Name",
        "action": "What they did",
        "strategic_impact": "Implications for ${orgName}"
      }
    ]
  },
  "social_pulse": {
    "regulator_actions": [
      {
        "entity": "Regulator name",
        "action": "What they did/said",
        "compliance_impact": "What ${orgName} needs to do"
      }
    ],
    "influencer_positions": [
      {
        "entity": "Journalist/Activist name",
        "position": "Their stance",
        "reach": "Their influence level"
      }
    ]
  },
  "industry_signals": {
    "hot_topics": ["Topics gaining momentum"],
    "opportunities": [
      {
        "trend": "What's happening",
        "action_required": "What ${orgName} should consider"
      }
    ],
    "risks": [
      {
        "signal": "Warning sign",
        "mitigation": "How to address"
      }
    ]
  },
  "media_coverage": {
    "narrative_control": {
      "dominant_entity": "Who controls narrative",
      "our_position": "Where ${orgName} stands"
    },
    "coverage_analysis": [
      {
        "entity": "Who got coverage",
        "tone": "positive/negative/neutral",
        "volume": "high/medium/low"
      }
    ]
  }
}
` : `
You are analyzing traditional intelligence data for ${orgName} in the ${industry} industry.

Intelligence Data:
${JSON.stringify(intelligence, null, 2)}

Context:
${JSON.stringify(context, null, 2)}

Provide a comprehensive analysis following the V5 analytical structure with market activity, competitor intelligence, social pulse, industry signals, and media coverage.

Return the same JSON structure as above but based on the traditional intelligence data provided.
`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 4000,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', errorText)
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    let content = data.content[0].text

    // Clean and parse response
    if (content.includes('```json')) {
      content = content.replace(/```json\s*/g, '').replace(/```/g, '')
    }
    
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1) {
      content = content.substring(firstBrace, lastBrace + 1)
    }
    
    return JSON.parse(content)
  } catch (error) {
    console.error('Claude analysis error:', error)
    // Return structured fallback for entity-focused data
    if (isEntityFocused) {
      const entityActions = intelligence['entity-actions'] || {}
      const trends = intelligence['trends'] || {}
      
      return {
        market_activity: {
          summary: `Tracked ${entityActions.total_actions || 0} entity actions for ${orgName}`,
          key_findings: entityActions.key_movements || [],
          statistics: {
            total_actions: entityActions.total_actions || 0,
            critical_actions: entityActions.by_relevance?.critical || 0
          }
        },
        competitor_intelligence: {
          competitors_tracked: entityActions.by_entity?.competitors ? 
            Object.keys(entityActions.by_entity.competitors) : [],
          movements: []
        },
        social_pulse: {
          regulator_actions: [],
          influencer_positions: []
        },
        industry_signals: {
          hot_topics: trends.trending_topics?.filter(t => t.relevance === 'high').map(t => t.topic) || [],
          opportunities: trends.implications?.opportunities || [],
          risks: trends.implications?.risks || []
        },
        media_coverage: {
          narrative_control: {
            dominant_entity: "Unknown",
            our_position: "Monitoring"
          },
          coverage_analysis: []
        }
      }
    }
    throw error
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { intelligence, organization } = await req.json()
    
    console.log('🤖 Claude V7 Entity-Focused Synthesis starting...')
    console.log('📊 Organization:', organization?.name)
    console.log('🎯 Entity-focused:', !!(intelligence?.raw_intelligence?.['entity-actions']))
    
    const analysis = await analyzeWithClaude(
      intelligence.raw_intelligence || intelligence,
      intelligence.discovered_context || organization || {}
    )
    
    return new Response(
      JSON.stringify({ 
        success: true,
        analysis,
        version: 'v7-entity-focused'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Synthesis error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        analysis: null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})