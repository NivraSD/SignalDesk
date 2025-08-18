import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, conversationHistory, sessionId } = await req.json()
    
    console.log('Received message:', message)
    console.log('Session ID:', sessionId)
    
    // Simple response for now - no Claude API call
    const response = {
      response: `I understand you're asking about: "${message}". As Niv, your AI PR strategist, I can help you with media relations, press releases, crisis communications, and strategic PR planning. What specific aspect would you like to explore?`,
      message: `I understand you're asking about: "${message}". Let me help you with that.`,
      shouldSave: false
    }
    
    // Check if this looks like a request for strategic content
    const strategicKeywords = ['strategy', 'plan', 'framework', 'campaign', 'launch', 'media list', 'press release']
    const isStrategic = strategicKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    )
    
    if (isStrategic) {
      response.shouldSave = true
      response.artifacts = [{
        type: 'strategic-content',
        title: 'Strategic PR Framework',
        content: {
          text: 'This is a placeholder for strategic content. In production, this would contain detailed PR strategies.',
          timestamp: new Date().toISOString(),
          sessionId: sessionId
        }
      }]
      response.response = `I've created a strategic framework for your request about "${message}". You can view it in the artifacts panel.`
    }
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Sorry, I encountered an error processing your request.',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})