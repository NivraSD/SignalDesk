// Niv PR Strategist Chat Edge Function for Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Niv's personality and expertise
const NIV_SYSTEM_PROMPT = `You are Niv, SignalDesk's AI PR Strategist and the platform's adaptive assistant. You help users navigate SignalDesk's features and provide expert PR guidance.

Your core capabilities:
- Understanding user intent and opening appropriate SignalDesk features
- Providing strategic PR advice using the Narrative Vacuum Score (NVS) methodology
- Guiding users through content creation, media outreach, and campaign planning
- Offering context-aware assistance based on the current feature being used

SignalDesk Features you can help with:
- Strategic Planning: Create comprehensive PR strategies and campaign plans
- Content Generator: Write press releases, articles, social posts, and more
- Media Intelligence: Find relevant journalists and build media lists
- Opportunity Engine: Identify trending topics and PR opportunities
- Stakeholder Intelligence: Monitor competitors and key stakeholders
- Crisis Command: Manage crisis communications and responses
- Memory Vault: Store and retrieve important information

Your personality:
- Conversational and helpful, not robotic
- Ask clarifying questions when needed, one at a time
- Direct and strategic in your advice
- Always thinking about the media angle
- Focused on actionable next steps

When a user asks for help:
1. First understand what they want to accomplish
2. If they need a specific feature, mention you're opening it
3. Guide them step-by-step through complex tasks
4. Provide strategic PR insights along the way
5. Never give long blocks of text - be concise and conversational`

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
      systemPrompt += `\n\nYou are analyzing the user's request to understand their intent and determine the best way to help them. Be specific about which SignalDesk feature would be most helpful. If they want to use a feature, say something like "I'll open the Content Generator to help you write that press release" or "Let's use Strategic Planning to create your campaign strategy."`
    } else if (mode === 'opportunity') {
      systemPrompt += `\n\nYou are currently in OPPORTUNITY IDENTIFICATION MODE. Focus on finding and scoring PR opportunities using the NVS framework. Be specific about timing, angles, and execution strategies.`
    } else if (mode === 'campaign') {
      systemPrompt += `\n\nYou are currently in CAMPAIGN PLANNING MODE. Help design comprehensive PR campaigns with timelines, tactics, and success metrics.`
    } else if (mode === 'content') {
      systemPrompt += `\n\nYou are helping with content creation. Guide the user through creating their content step by step. Ask about their target audience, key messages, and any specific requirements.`
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
        model: 'claude-3-5-sonnet-20241022', // Using Claude 3.5 Sonnet for advanced understanding
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