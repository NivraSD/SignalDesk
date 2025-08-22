// Intelligence Discovery V2 - Entity & Topic Identification
// This is Claude's initial analysis to identify WHO and WHAT to monitor

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

async function identifyMonitoringTargets(organization: any) {
  console.log(`🎯 Identifying monitoring targets for ${organization.name}`)
  
  const prompt = `You are an intelligence analyst identifying specific entities and topics to monitor for ${organization.name} in the ${organization.industry || 'business'} industry.

Your job is to identify SPECIFIC entities and topics to track, not to analyze the company itself.

Based on ${organization.name}, identify:

1. COMPETITORS - Specific companies competing directly or indirectly
2. REGULATORS - Specific regulatory bodies AND their key officials by name
3. JOURNALISTS - Specific reporters who cover this company/industry (with outlets)
4. ACTIVISTS - Specific organizations or leaders who influence this space
5. INFLUENCERS - Industry analysts, thought leaders, major investors
6. EXECUTIVES - Key executives at competitors or partners
7. TOPICS - Specific trends and topics to monitor (not entities)

For each entity, explain WHY they matter for PR monitoring.

Return ONLY valid JSON in this structure:
{
  "entities_to_monitor": {
    "competitors": [
      {"name": "Company Name", "why": "Direct competitor in X market", "priority": "high/medium/low"}
    ],
    "regulators": [
      {"name": "Agency/Official Name", "role": "Position", "why": "Oversees X", "priority": "high/medium/low"}
    ],
    "journalists": [
      {"name": "Reporter Name", "outlet": "Publication", "beat": "Coverage area", "why": "Covers X", "priority": "high/medium/low"}
    ],
    "activists": [
      {"name": "Organization/Leader", "focus": "Their cause", "why": "Influences X", "priority": "high/medium/low"}
    ],
    "influencers": [
      {"name": "Name", "role": "Analyst/Investor/etc", "platform": "Where they influence", "why": "Impacts X", "priority": "high/medium/low"}
    ],
    "executives": [
      {"name": "Name", "company": "Company", "role": "Position", "why": "Decisions affect X", "priority": "high/medium/low"}
    ]
  },
  "topics_to_track": [
    {"topic": "Topic name", "why": "Impacts our narrative on X", "keywords": ["keyword1", "keyword2"]}
  ],
  "mcp_deployment": {
    "news-intelligence": ["Track mentions of [specific entities]"],
    "regulatory-intelligence": ["Monitor [specific filings/agencies]"],
    "social-intelligence": ["Track @handles and campaigns"],
    "trends-intelligence": ["Monitor [specific metrics/trends]"]
  },
  "monitoring_context": {
    "key_narratives": ["Main narratives to track"],
    "crisis_triggers": ["Events that would require immediate attention"],
    "opportunity_signals": ["Events that would create PR opportunities"]
  }
}`

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
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const result = await response.json()
    const content = result.content[0].text
    
    // Parse JSON from Claude's response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const targets = JSON.parse(jsonMatch[0])
      
      // Add metadata
      targets.metadata = {
        organization: organization.name,
        industry: organization.industry,
        timestamp: new Date().toISOString(),
        version: 'v2-entity-focused'
      }
      
      return targets
    }
    
    throw new Error('Failed to parse monitoring targets')
    
  } catch (error) {
    console.error('Error identifying targets:', error)
    
    // Return fallback structure
    return getFallbackTargets(organization)
  }
}

function getFallbackTargets(organization: any) {
  // Intelligent fallbacks based on industry
  const industryTargets = {
    technology: {
      competitors: ['Microsoft', 'Google', 'Apple', 'Amazon'],
      regulators: ['FTC', 'SEC', 'EU Commission'],
      topics: ['AI regulation', 'data privacy', 'antitrust']
    },
    automotive: {
      competitors: ['Tesla', 'Ford', 'GM', 'Rivian'],
      regulators: ['NHTSA', 'EPA', 'CARB'],
      topics: ['EV adoption', 'autonomous driving', 'charging infrastructure']
    },
    finance: {
      competitors: ['JPMorgan', 'Goldman Sachs', 'Bank of America'],
      regulators: ['SEC', 'Federal Reserve', 'FDIC'],
      topics: ['interest rates', 'digital banking', 'cryptocurrency']
    }
  }
  
  const defaults = industryTargets[organization.industry?.toLowerCase()] || industryTargets.technology
  
  return {
    entities_to_monitor: {
      competitors: defaults.competitors.map(name => ({
        name,
        why: 'Industry competitor',
        priority: 'medium'
      })),
      regulators: defaults.regulators.map(name => ({
        name,
        role: 'Regulatory body',
        why: 'Oversees industry',
        priority: 'high'
      })),
      journalists: [],
      activists: [],
      influencers: [],
      executives: []
    },
    topics_to_track: defaults.topics.map(topic => ({
      topic,
      why: 'Industry trend',
      keywords: [topic]
    })),
    mcp_deployment: {
      'news-intelligence': ['Track competitor mentions'],
      'regulatory-intelligence': ['Monitor regulatory announcements'],
      'trends-intelligence': ['Track industry trends']
    },
    monitoring_context: {
      key_narratives: ['Industry leadership', 'Innovation', 'Compliance'],
      crisis_triggers: ['Regulatory action', 'Major competitor move'],
      opportunity_signals: ['Competitor stumble', 'Regulatory clarity']
    },
    metadata: {
      organization: organization.name,
      industry: organization.industry,
      timestamp: new Date().toISOString(),
      version: 'v2-fallback'
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { organization } = await req.json()
    
    if (!organization?.name) {
      throw new Error('Organization name is required')
    }
    
    console.log(`📊 Processing discovery for ${organization.name}`)
    
    const targets = await identifyMonitoringTargets(organization)
    
    return new Response(
      JSON.stringify({
        success: true,
        monitoring_targets: targets,
        message: `Identified ${Object.keys(targets.entities_to_monitor).reduce((acc, key) => acc + targets.entities_to_monitor[key].length, 0)} entities to monitor`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Discovery error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})