// Intelligence Discovery V3 - Clean Entity-Focused Discovery
// Uses Claude Sonnet 4 to identify WHO and WHAT to monitor

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

console.log('🔑 Discovery V3 - ANTHROPIC_API_KEY exists:', !!ANTHROPIC_API_KEY)
console.log('🔑 API Key length:', ANTHROPIC_API_KEY?.length || 0)

async function discoverEntities(organization: any) {
  console.log(`🎯 V3 Discovery: Identifying entities for ${organization.name}`)
  
  const prompt = `You are an intelligence analyst identifying DIVERSE entities to monitor for ${organization.name} in the ${organization.industry || 'business'} industry.

Your task: Cast a WIDE NET to identify ALL categories of entities that could impact ${organization.name}'s narrative and reputation.

CRITICAL: Be comprehensive and diverse. Don't just focus on business and regulation - think about ALL forces that shape perception.

For ${organization.name}, identify:

1. TOP COMPETITORS (5-7 companies)
   - Direct competitors in their primary market
   - Emerging disruptors and tech challengers
   - Adjacent market players who could pivot into their space
   
2. REGULATORY & GOVERNMENT (4-6 entities)
   - Specific agencies that regulate them
   - Key officials and committee chairs
   - International regulatory bodies if applicable
   
3. ACTIVISTS & ADVOCACY GROUPS (3-5 groups)
   - Environmental activists targeting the industry
   - Labor organizations and unions
   - Consumer advocacy groups
   - Social justice organizations relevant to their sector
   
4. GEOPOLITICAL ACTORS (3-5 entities)
   - Foreign governments affecting their markets
   - Trade organizations and tariff authorities
   - International sanctions bodies
   - Geopolitical events in key markets
   
5. INFLUENTIAL VOICES (4-6 people/outlets)
   - Industry journalists and reporters
   - Influential analysts and thought leaders
   - Podcast hosts and social media influencers
   - Academic researchers publishing on the industry
   
6. FINANCIAL STAKEHOLDERS (3-5 entities)
   - Major institutional investors
   - Activist investors and short sellers
   - Credit rating agencies
   - Key analysts who move stock prices

7. DIVERSE TOPICS (10-15 different themes)
   - Technology disruptions
   - ESG and sustainability pressures
   - Geopolitical tensions and trade wars
   - Labor movements and unionization
   - Climate change impacts
   - Supply chain vulnerabilities
   - Cybersecurity threats
   - Consumer behavior shifts
   - Regulatory changes across jurisdictions
   - Economic indicators and recession risks
   - Social movements affecting the industry
   - Emerging market dynamics

Return ONLY valid JSON:
{
  "entities": {
    "competitors": [
      {"name": "Actual Company Name", "importance": "critical/high/medium", "watch_for": "What actions to monitor"}
    ],
    "regulators": [
      {"name": "Agency or Official Name", "role": "Their position", "importance": "critical/high/medium"}
    ],
    "activists": [
      {"name": "Group Name", "focus": "Their cause", "tactics": "How they operate", "importance": "high/medium"}
    ],
    "geopolitical": [
      {"name": "Country/Organization", "relevance": "How they impact", "importance": "high/medium"}
    ],
    "media": [
      {"name": "Reporter/Influencer Name", "platform": "Where they publish", "reach": "Audience size", "importance": "high/medium"}
    ],
    "investors": [
      {"name": "Fund/Investor Name", "type": "institutional/activist/short", "influence": "Market impact", "importance": "high/medium"}
    ]
  },
  "topics": [
    {"name": "Specific trend/topic", "category": "tech/regulatory/geopolitical/social/environmental/economic", "urgency": "immediate/short-term/long-term"}
  ],
  "monitoring_strategy": {
    "primary_focus": "What matters most for ${organization.name} right now",
    "crisis_triggers": ["Specific events that would require immediate attention"],
    "opportunity_signals": ["Events that would create opportunities"],
    "blind_spots": ["Areas often overlooked but could surprise"]
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
        model: 'claude-3-5-sonnet-20241022',
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
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const discovery = JSON.parse(jsonMatch[0])
      
      // Add metadata
      return {
        success: true,
        organization: organization.name,
        industry: organization.industry,
        timestamp: new Date().toISOString(),
        discovery,
        statistics: {
          total_entities: Object.values(discovery.entities).reduce((acc: number, arr: any) => acc + arr.length, 0),
          total_topics: discovery.topics?.length || 0
        }
      }
    }
    
    throw new Error('Failed to parse Claude response')
  } catch (error) {
    console.error('Discovery error:', error)
    return {
      success: false,
      error: error.message,
      // Return minimal fallback
      discovery: {
        entities: {
          competitors: [],
          regulators: [],
          media: [],
          stakeholders: []
        },
        topics: [],
        monitoring_strategy: {
          primary_focus: `Monitor ${organization.name} industry developments`,
          crisis_triggers: [],
          opportunity_signals: []
        }
      }
    }
  }
}

serve(async (req) => {
  console.log('🚀 Intelligence Discovery V3 - Request received:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured in environment')
    }
    
    const { organization } = await req.json()
    console.log('📋 Discovery V3 - Organization:', organization)
    
    if (!organization?.name) {
      throw new Error('Organization name is required')
    }
    
    const result = await discoverEntities(organization)
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('❌ Discovery V3 error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      hasApiKey: !!ANTHROPIC_API_KEY
    })
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