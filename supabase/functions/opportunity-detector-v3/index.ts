// Opportunity Detector V3 - Creates real opportunities from intelligence
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

async function detectOpportunitiesFromIntelligence(intelligence: any, organization: any) {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
  
  if (!ANTHROPIC_API_KEY) {
    console.log('⚠️ No API key, returning minimal opportunities')
    return [{
      title: "API Configuration Required",
      action: "Configure API keys to enable intelligent opportunity detection",
      expected_impact: "Full opportunity detection capabilities",
      urgency: "HIGH",
      persona: "System"
    }]
  }
  
  const opportunities = []
  const { entity_actions, topic_trends } = intelligence
  
  // Analyze entity actions for opportunities
  if (entity_actions?.all?.length > 0) {
    for (const action of entity_actions.all.slice(0, 5)) {
      opportunities.push({
        title: `Respond to ${action.entity}'s ${action.action}`,
        action: `Develop strategic response to ${action.entity}'s recent move`,
        expected_impact: "Maintain competitive position and potentially gain market share",
        source: action.source || "Intelligence gathering",
        url: action.url,
        urgency: "MEDIUM",
        window: "2-4 weeks",
        persona: "Competitive Opportunist"
      })
    }
  }
  
  // Analyze trends for opportunities
  if (topic_trends?.all?.length > 0) {
    for (const trend of topic_trends.all.slice(0, 3)) {
      opportunities.push({
        title: `Capitalize on ${trend.topic} trend`,
        action: `Position as thought leader in ${trend.topic}`,
        expected_impact: "Enhanced brand authority and market positioning",
        urgency: trend.trend === 'increasing' ? "HIGH" : "MEDIUM",
        window: "1-2 months",
        persona: "Narrative Navigator"
      })
    }
  }
  
  // Always add at least one proactive opportunity
  if (opportunities.length === 0) {
    opportunities.push({
      title: "Proactive Market Positioning",
      action: "Launch preemptive campaign to strengthen market position",
      expected_impact: "First-mover advantage in emerging market dynamics",
      urgency: "MEDIUM",
      window: "4-6 weeks",
      persona: "Crisis Preventer"
    })
  }
  
  return opportunities
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organization, intelligence } = await req.json()
    
    const opportunities = await detectOpportunitiesFromIntelligence(
      intelligence || { entity_actions: { all: [] }, topic_trends: { all: [] } },
      organization || { name: "Unknown" }
    )
    
    return new Response(
      JSON.stringify({
        success: true,
        opportunities,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Opportunity detection error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        opportunities: []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
