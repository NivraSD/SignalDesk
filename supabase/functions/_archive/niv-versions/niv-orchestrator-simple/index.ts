import { corsHeaders } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Simple Niv Orchestrator starting...')
    
    const { message = 'Hello', messages = [], context = {}, mode = 'test' } = await req.json()
    
    console.log('📝 Received:', {
      message: message?.substring(0, 50),
      messageCount: messages?.length || 0,
      hasApiKey: !!ANTHROPIC_API_KEY
    })
    
    // Simple fallback response for now
    const response = `Hello! I'm Niv, your PR strategist. You said: "${message}". I'm currently in simplified mode for testing.`
    
    const result = {
      response,
      workItems: [],
      context: {
        ...context,
        mode: 'simplified',
        timestamp: new Date().toISOString()
      }
    }
    
    console.log('✅ Sending response')
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    )
  } catch (error) {
    console.error('❌ Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        response: 'I apologize, I encountered an issue. Please try again.',
        workItems: []
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    )
  }
})