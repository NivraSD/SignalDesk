// Niv AI Assistant - Natural conversational PR strategist
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Anthropic Claude for conversational AI
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

// Log deployment time to force reload
console.log('Niv Orchestrator deployed at:', new Date().toISOString())
console.log('API Key configured:', !!ANTHROPIC_API_KEY)

// Niv's personality - helpful AI assistant
const NIV_SYSTEM_PROMPT = `You are Niv, an AI PR strategy assistant in SignalDesk.

IMPORTANT RULES:
- Be concise and helpful
- Keep responses under 3 paragraphs unless specifically asked for more detail
- Don't pretend to have "20 years of experience" or be a human
- Don't use phrases like "in my experience" or "I've seen"
- Be conversational and natural, not overly enthusiastic
- Focus on the user's actual request

When users ask to create multiple things:
- Acknowledge briefly what you'll create
- Don't give long explanations about each item

Good response: "I'll create a strategic plan, media list, and press release for your event."
Bad response: "*Leaning in with 20 years of experience* Let me share my expertise..."`

// Call Claude API with conversation history
async function callClaude(messages: any[], userMessage: string) {
  try {
    if (!ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set')
      throw new Error('API key not configured')
    }

    const claudeMessages = messages.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
    
    claudeMessages.push({
      role: 'user',
      content: userMessage
    })

    console.log('Calling Claude API with', claudeMessages.length, 'messages')

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        system: NIV_SYSTEM_PROMPT,
        messages: claudeMessages,
        max_tokens: 400, // Keep responses short
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', response.status, errorText)
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    return data.content[0].text
  } catch (error) {
    console.error('Error calling Claude:', error)
    return generateFallbackResponse(userMessage)
  }
}

// Fallback responses if Claude fails
function generateFallbackResponse(message: string) {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('strategic plan') || lowerMessage.includes('strategy')) {
    return "I'll create a strategic plan for your campaign."
  }
  if (lowerMessage.includes('media list') || lowerMessage.includes('journalist')) {
    return "I'll build a media list for you."
  }
  if (lowerMessage.includes('press release') || lowerMessage.includes('content')) {
    return "I'll draft that content."
  }
  if (lowerMessage.includes('create') && lowerMessage.includes('necessary')) {
    return "I'll create a strategic plan, media list, and press release for you."
  }
  
  return "How can I help with your PR needs?"
}

// Detect what user wants to create
function detectCreationIntents(message: string) {
  const lowerMessage = message.toLowerCase()
  const intents = []
  
  if (lowerMessage.includes('strategic plan') || lowerMessage.includes('strategy') || 
      lowerMessage.includes('comms plan') || lowerMessage.includes('campaign')) {
    intents.push({
      type: 'strategy-plan',
      title: 'Strategic Communications Plan',
      description: 'Comprehensive strategy with timeline and milestones'
    })
  }
  
  if (lowerMessage.includes('media list') || lowerMessage.includes('media plan') || 
      lowerMessage.includes('journalist') || lowerMessage.includes('reporter')) {
    intents.push({
      type: 'media-list',
      title: 'Media Target List',
      description: 'Curated journalists for your campaign'
    })
  }
  
  if (lowerMessage.includes('press release') || lowerMessage.includes('announcement') || 
      lowerMessage.includes('draft') || (lowerMessage.includes('content') && !lowerMessage.includes('strategy'))) {
    intents.push({
      type: 'content-draft',
      title: 'Press Release',
      description: 'Professional press release draft'
    })
  }

  // Handle "necessary content" requests
  if (lowerMessage.includes('necessary content') && intents.length === 0) {
    intents.push({
      type: 'content-draft',
      title: 'Campaign Content',
      description: 'Essential PR content for your campaign'
    })
  }
  
  return intents
}

// Generate actual content
function generateContent(type: string, context: any) {
  switch(type) {
    case 'strategy-plan':
      return {
        title: 'AI Investment Summit - NYC',
        objective: 'Position event as premier AI investment gathering',
        timeline: {
          milestones: [
            { week: 1, task: 'Media list building & outreach prep', status: 'pending' },
            { week: 2, task: 'Executive interviews & content creation', status: 'pending' },
            { week: 3, task: 'Tier 1 media briefings', status: 'pending' },
            { week: 4, task: 'Launch day execution', status: 'pending' }
          ]
        },
        keyMessages: [
          'Leading investors converge on AI opportunities',
          'BlackRock, Blackstone, OpenAI share vision',
          'Exclusive C-suite insights'
        ]
      }
    
    case 'media-list':
      return {
        title: 'Target Media List',
        journalists: [
          { name: 'Katie Roof', outlet: 'Bloomberg', beat: 'VC & AI', priority: 'Tier 1' },
          { name: 'Cade Metz', outlet: 'New York Times', beat: 'AI', priority: 'Tier 1' },
          { name: 'Gillian Tan', outlet: 'Bloomberg', beat: 'PE', priority: 'Tier 1' }
        ]
      }
    
    case 'content-draft':
      return {
        title: 'Press Release',
        content: `FOR IMMEDIATE RELEASE

BlackRock, Blackstone, OpenAI Executives to Convene at AI Investment Summit

NEW YORK – Leading investment firms and AI pioneers will gather for an exclusive summit featuring 200 C-suite executives exploring AI investment opportunities.

Key topics include AI infrastructure investment, emerging opportunities, and regulatory considerations.

###`
      }
    
    default:
      return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, context = {}, messages = [] } = await req.json()

    // Debug: Check if API key is loaded
    console.log('ANTHROPIC_API_KEY exists:', !!ANTHROPIC_API_KEY)
    console.log('API key first 10 chars:', ANTHROPIC_API_KEY ? ANTHROPIC_API_KEY.substring(0, 10) + '...' : 'NOT SET')

    // Get conversational response
    let response = ''
    
    if (ANTHROPIC_API_KEY) {
      response = await callClaude(messages, message)
    } else {
      console.error('No ANTHROPIC_API_KEY, using fallback')
      response = generateFallbackResponse(message)
    }

    // Detect creation intents
    const creationIntents = detectCreationIntents(message)
    
    // Generate content for each intent
    const workItems = creationIntents.map(intent => ({
      ...intent,
      generatedContent: generateContent(intent.type, context)
    }))
    
    return new Response(
      JSON.stringify({
        response,
        showWork: creationIntents.length > 0,
        workItems: workItems,
        context: {
          ...context,
          conversationLength: messages.length + 1
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        response: "I can help with that. What would you like me to create?",
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})