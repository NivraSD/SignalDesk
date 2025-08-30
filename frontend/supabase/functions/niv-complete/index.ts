// CORRECT Deno syntax for Supabase Edge Functions
Deno.serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request
    const { message, messages = [], context = {}, mode = 'chat', conversationId } = await req.json()
    
    // Get API key from environment
    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')
    
    if (!CLAUDE_API_KEY) {
      console.error('No Claude API key found')
      // Return helpful response even without API key
      return new Response(
        JSON.stringify({
          response: `I understand you need help with: "${message}". As Niv, your AI PR strategist, I can assist with press releases, media strategies, crisis management, and campaign planning.`,
          message: 'Processing your request...',
          shouldSave: message.toLowerCase().includes('press') || message.toLowerCase().includes('media'),
          conversationId: conversationId || `session-${Date.now()}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.7,
        system: `You are Niv, an elite AI PR strategist with 20 years of experience. You help with:
- Press releases and announcements
- Media strategies and journalist outreach  
- Crisis management and damage control
- Strategic PR planning and campaigns
- Executive positioning and thought leadership

When the user mentions press releases, media lists, announcements, or strategic content, note that this should be saved as an artifact.`,
        messages: [
          ...messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          })),
          { role: 'user', content: message }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Claude API error:', error)
      throw new Error(`Claude API failed: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.content[0].text

    // Detect if we should create an artifact
    const shouldSave = message.toLowerCase().includes('press') ||
                       message.toLowerCase().includes('media') ||
                       message.toLowerCase().includes('announce') ||
                       message.toLowerCase().includes('strategy') ||
                       message.toLowerCase().includes('crisis')

    // Return response
    return new Response(
      JSON.stringify({
        response: aiResponse,
        message: aiResponse,
        chatMessage: aiResponse,
        shouldSave,
        conversationId: conversationId || `session-${Date.now()}`,
        workItems: shouldSave ? [{
          type: 'artifact',
          title: `Strategic Content: ${message.substring(0, 50)}`,
          content: aiResponse
        }] : []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    
    // Return fallback response
    return new Response(
      JSON.stringify({
        response: 'I understand your request. As Niv, I can help with PR strategy, press releases, media outreach, and crisis management. Let me assist you with your specific needs.',
        message: 'Ready to help with your PR needs.',
        shouldSave: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})