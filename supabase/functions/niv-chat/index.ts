// Niv Conversational AI - PR Strategy Assistant
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Anthropic Claude for conversational AI
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

// Niv's personality - helpful AI assistant, not fake human
const NIV_SYSTEM_PROMPT = `You are Niv, an AI PR strategy assistant in the SignalDesk platform.

IMPORTANT: 
- Be helpful, concise, and professional
- Keep responses focused and actionable
- Don't pretend to have years of experience or be a human consultant
- Don't use phrases like "in my experience" or reference past work
- Be conversational but efficient - users want quick help, not long explanations

When users ask for multiple things (e.g., "create a strategic plan, media list, and press release"):
- Acknowledge you'll create all requested items
- Keep response brief
- Focus on what you're creating, not lengthy advice

Good response example:
"I'll create a comprehensive strategic plan, media list, and press release for your NYC AI investment event. Let me generate these for you now."

Avoid:
- Long explanations about PR best practices
- Fake enthusiasm ("*Leaning in with excitement*")
- References to experience or past campaigns
- Overly detailed responses when not requested`

// Function to call Claude API
async function callClaude(messages: any[], userMessage: string) {
  try {
    const claudeMessages = messages.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
    
    claudeMessages.push({
      role: 'user',
      content: userMessage
    })

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
        max_tokens: 500, // Shorter responses
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    return data.content[0].text
  } catch (error) {
    console.error('Error calling Claude:', error)
    return generateFallbackResponse(userMessage)
  }
}

// Generate fallback response if Claude fails
function generateFallbackResponse(message: string) {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('strategic plan') || lowerMessage.includes('strategy')) {
    return "I'll create a strategic plan for your campaign. This will include timeline, objectives, and key milestones."
  }
  if (lowerMessage.includes('media list') || lowerMessage.includes('journalist')) {
    return "I'll build a targeted media list for your announcement."
  }
  if (lowerMessage.includes('press release') || lowerMessage.includes('content')) {
    return "I'll draft that content for you."
  }
  
  return "I can help with that. Let me know what specific PR materials you need."
}

// Detect what the user wants to create
function detectCreationIntents(message: string) {
  const lowerMessage = message.toLowerCase()
  const intents = []
  
  // Check for multiple creation patterns
  if (lowerMessage.includes('strategic plan') || lowerMessage.includes('strategy') || 
      lowerMessage.includes('comms plan') || lowerMessage.includes('campaign')) {
    intents.push({
      type: 'strategy-plan',
      title: 'Strategic Communications Plan',
      description: 'Comprehensive strategy with timeline, objectives, and tactics'
    })
  }
  
  if (lowerMessage.includes('media list') || lowerMessage.includes('media plan') || 
      lowerMessage.includes('journalist') || lowerMessage.includes('reporter')) {
    intents.push({
      type: 'media-list',
      title: 'Media Target List',
      description: 'Curated list of journalists and outlets for your campaign'
    })
  }
  
  if (lowerMessage.includes('press release') || lowerMessage.includes('announcement') || 
      lowerMessage.includes('content') || lowerMessage.includes('draft')) {
    intents.push({
      type: 'content-draft',
      title: 'Press Release',
      description: 'Professional press release for your announcement'
    })
  }

  // Handle "create necessary content" or general content requests
  if (lowerMessage.includes('necessary content') && intents.length === 0) {
    intents.push({
      type: 'content-draft',
      title: 'Campaign Content Package',
      description: 'Essential content for your campaign'
    })
  }
  
  return intents
}

// Generate actual content for each type
function generateContent(type: string, context: any) {
  switch(type) {
    case 'strategy-plan':
      return {
        title: context.title || 'AI Investment Summit - NYC',
        objective: 'Position event as premier gathering for AI investment leaders',
        timeline: {
          start: 'Week 1',
          end: 'Week 4',
          milestones: [
            { week: 1, task: 'Media list finalization & initial outreach', status: 'pending' },
            { week: 2, task: 'Executive interviews & thought leadership placement', status: 'pending' },
            { week: 3, task: 'Embargoed briefings with Tier 1 media', status: 'pending' },
            { week: 4, task: 'Event coverage & live social amplification', status: 'pending' }
          ]
        },
        keyMessages: [
          'Leading investors converge on AI opportunity',
          'BlackRock, Blackstone, OpenAI share unified vision',
          'Exclusive C-suite insights on AI investment landscape'
        ],
        metrics: {
          targetReach: '5M impressions',
          tierOneTargets: '10 major outlets',
          socialEngagement: '25K interactions'
        }
      }
    
    case 'media-list':
      return {
        title: 'AI Investment Summit Media Targets',
        journalists: [
          { name: 'Katie Roof', outlet: 'Bloomberg', beat: 'Venture Capital & AI', priority: 'Tier 1' },
          { name: 'Cade Metz', outlet: 'New York Times', beat: 'AI & Technology', priority: 'Tier 1' },
          { name: 'Gillian Tan', outlet: 'Bloomberg', beat: 'Private Equity', priority: 'Tier 1' },
          { name: 'Ryan Mac', outlet: 'Forbes', beat: 'Tech & Investment', priority: 'Tier 2' },
          { name: 'Berber Jin', outlet: 'Wall Street Journal', beat: 'AI & Markets', priority: 'Tier 1' }
        ]
      }
    
    case 'content-draft':
      return {
        title: 'AI Investment Summit Press Release',
        content: `FOR IMMEDIATE RELEASE

BlackRock, Blackstone, and OpenAI Executives to Convene at Exclusive AI Investment Summit in NYC

NEW YORK, [DATE] – Leading investment firms and AI pioneers will gather for an exclusive summit bringing together 200 C-suite executives to explore the future of AI investment opportunities. The event will feature keynote presentations from senior executives at BlackRock, Blackstone, and OpenAI.

The invitation-only summit will address critical topics including AI infrastructure investment, emerging opportunities in enterprise AI, and the evolving regulatory landscape. Attendees will gain exclusive insights into how leading institutions are approaching AI investments.

"This summit represents a unique convergence of investment expertise and AI innovation," said [SPOKESPERSON]. "The discussions will shape how institutional capital flows into AI technologies."

Key discussion topics include:
• Investment strategies for AI infrastructure
• Risk assessment in emerging AI technologies  
• Building sustainable AI investment portfolios
• Regulatory considerations for AI investments

The summit takes place [DATE] at [VENUE] in New York City.

For media inquiries, contact: [CONTACT]

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

    // Get conversational response from Claude
    let response = ''
    
    if (ANTHROPIC_API_KEY) {
      response = await callClaude(messages, message)
    } else {
      response = generateFallbackResponse(message)
    }

    // Detect what user wants to create (can be multiple things)
    const creationIntents = detectCreationIntents(message)
    
    // Generate actual content for each intent
    const workItems = creationIntents.map(intent => ({
      ...intent,
      generatedContent: generateContent(intent.type, context)
    }))
    
    return new Response(
      JSON.stringify({
        response,
        showWork: creationIntents.length > 0,
        workItems: workItems, // Send all work items to create multiple cards
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
    console.error('Error in niv-chat function:', error)
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