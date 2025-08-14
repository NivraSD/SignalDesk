// Niv PR Strategist Chat Edge Function for Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Niv's personality and expertise
const NIV_SYSTEM_PROMPT = `You are Niv, SignalDesk's AI PR Strategist. You are an expert in PR strategy with deep knowledge of:
- Narrative Vacuum Score (NVS) methodology for identifying PR opportunities
- Media relations and journalist engagement
- Crisis communication and reputation management
- Content strategy and messaging frameworks
- Competitive intelligence and market positioning

Your personality:
- Direct and strategic in your advice
- Data-driven but understand the art of storytelling
- Proactive in identifying opportunities
- Always thinking about the media angle
- Focused on measurable PR outcomes

When analyzing situations, you use the NVS framework which considers:
1. Media Demand - How much media attention exists for this topic
2. Competitor Absence - Gaps in competitor messaging
3. Client Strength - Your ability to own the narrative
4. Time Decay - Urgency and timing factors
5. Market Saturation - How crowded the narrative space is

Provide actionable, strategic advice that helps PR professionals win.`

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, conversationId, mode = 'chat', context = {} } = await req.json()

    if (!message) {
      throw new Error('Message is required')
    }

    // Get Anthropic API key from environment
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }

    // Build the prompt based on mode
    let systemPrompt = NIV_SYSTEM_PROMPT
    let userPrompt = message

    if (mode === 'analysis') {
      systemPrompt += `\n\nYou are currently in ANALYSIS MODE. Provide detailed strategic analysis using the NVS framework. Structure your response with clear sections and scores.`
    } else if (mode === 'opportunity') {
      systemPrompt += `\n\nYou are currently in OPPORTUNITY IDENTIFICATION MODE. Focus on finding and scoring PR opportunities. Be specific about timing, angles, and execution strategies.`
    } else if (mode === 'campaign') {
      systemPrompt += `\n\nYou are currently in CAMPAIGN PLANNING MODE. Help design comprehensive PR campaigns with timelines, tactics, and success metrics.`
    }

    // Add context if provided
    if (context && Object.keys(context).length > 0) {
      userPrompt = `Context: ${JSON.stringify(context)}\n\nUser Question: ${message}`
    }

    // Call Anthropic Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229', // Using Sonnet for better strategic thinking
        max_tokens: 2000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${error}`)
    }

    const data = await response.json()
    
    // Extract the response text
    const responseText = data.content?.[0]?.text || ''

    // Parse NVS scores if present in response
    let nvsAnalysis = null
    if (mode === 'analysis' || mode === 'opportunity') {
      // Try to extract NVS scores from the response
      const scorePattern = /(?:Media Demand|Competitor Absence|Client Strength|Time Decay|Market Saturation):\s*(\d+)/gi
      const matches = responseText.matchAll(scorePattern)
      const scores = {}
      
      for (const match of matches) {
        const metric = match[0].split(':')[0].trim()
        const score = parseInt(match[1])
        scores[metric.toLowerCase().replace(' ', '_')] = score
      }
      
      if (Object.keys(scores).length > 0) {
        nvsAnalysis = {
          scores,
          overall: Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length)
        }
      }
    }

    // Store conversation in Supabase if conversationId provided
    if (conversationId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      // This would store conversation history - implement based on your needs
      console.log('Storing conversation:', conversationId)
    }

    return new Response(
      JSON.stringify({
        response: responseText,
        nvsAnalysis,
        mode,
        conversationId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in niv-chat function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})