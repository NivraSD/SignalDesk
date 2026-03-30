import { corsHeaders } from '../_shared/cors.ts'

// Simple NIV function for testing
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, sessionId, stage } = await req.json()

    console.log('NIV Simple Processing:', { message, sessionId, stage })

    // Simple acknowledgment response
    if (stage === 'acknowledge') {
      return new Response(
        JSON.stringify({
          success: true,
          stage: 'acknowledgment',
          message: `I understand your query. Let me gather the relevant intelligence.`,
          sessionId: sessionId
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Simple full response
    return new Response(
      JSON.stringify({
        success: true,
        type: 'intelligence-response',
        message: `Based on my analysis: ${message}. I would need the full intelligence pipeline to provide detailed insights.`,
        queryType: 'general',
        sessionId: sessionId
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('NIV Simple Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})