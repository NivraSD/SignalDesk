// Intelligence Discovery V3 - Clean Entity-Focused Discovery
// Uses Claude Sonnet 4 to identify WHO and WHAT to monitor

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

async function discoverEntities(organization: any) {
  console.log(`🎯 V3 Discovery: Identifying entities for ${organization.name}`)
  
  const prompt = `You are an intelligence analyst identifying SPECIFIC entities to monitor for ${organization.name} in the ${organization.industry || 'business'} industry.

Your task: Identify the MOST IMPORTANT entities that ${organization.name} needs to track for strategic intelligence.

Focus on REAL, SPECIFIC entities that exist TODAY. Be precise with names.

For ${organization.name}, identify:

1. TOP COMPETITORS (5-7 most important)
   - Direct competitors in their primary market
   - Emerging threats they should watch
   
2. KEY REGULATORS (3-5 most relevant)
   - Specific agencies that regulate them
   - Key officials making decisions that affect them
   
3. INFLUENTIAL MEDIA (3-5 journalists/outlets)
   - Reporters who actually cover this company/industry
   - Media outlets that shape narrative
   
4. CRITICAL STAKEHOLDERS (3-5 key ones)
   - Activist groups that target this industry
   - Key investors or analysts who move markets
   - Industry associations or standards bodies

5. STRATEGIC TOPICS (5-7 trends)
   - Technology shifts affecting the industry
   - Regulatory changes being discussed
   - Market trends to monitor

Return ONLY valid JSON:
{
  "entities": {
    "competitors": [
      {"name": "Actual Company Name", "importance": "critical/high/medium", "watch_for": "What actions to monitor"}
    ],
    "regulators": [
      {"name": "Agency or Official Name", "role": "Their position", "importance": "critical/high/medium"}
    ],
    "media": [
      {"name": "Reporter/Outlet Name", "outlet": "Publication", "beat": "What they cover", "importance": "high/medium"}
    ],
    "stakeholders": [
      {"name": "Organization/Person", "type": "activist/investor/analyst", "influence": "How they impact", "importance": "high/medium"}
    ]
  },
  "topics": [
    {"name": "Specific trend/topic", "category": "tech/regulatory/market", "urgency": "immediate/short-term/long-term"}
  ],
  "monitoring_strategy": {
    "primary_focus": "What matters most for ${organization.name} right now",
    "crisis_triggers": ["Specific events that would require immediate attention"],
    "opportunity_signals": ["Events that would create opportunities"]
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
        model: 'claude-sonnet-4-20250514',
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { organization } = await req.json()
    
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
    console.error('Request error:', error)
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