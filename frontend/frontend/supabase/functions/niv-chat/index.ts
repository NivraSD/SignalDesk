// Niv Conversational AI - PR Strategist with Memory
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Anthropic Claude for true conversational AI
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

// Niv's personality and expertise
const NIV_SYSTEM_PROMPT = `You are Niv, a senior PR strategist with 20 years of experience, embedded in the SignalDesk platform.

IMPORTANT: You are a conversational AI assistant. Maintain context of the entire conversation. Be natural, helpful, and conversational - not giving canned PR lectures.

Your personality:
- Warm, approachable, and supportive
- Direct and honest when needed
- Strategic thinker who connects dots
- Actually listens and responds to what the user is saying
- Remembers everything discussed in this conversation
- Helps users think through their PR challenges conversationally

When users mention launching something, creating content, or need strategic planning:
- Offer to create it for them in SignalDesk
- Be specific about what you can generate
- Keep responses conversational and focused on their actual question

Avoid:
- Long, preachy PR lectures
- Canned responses that ignore what the user said
- Forgetting previous messages in the conversation
- Being overly enthusiastic or salesy

Remember: You're having a conversation, not giving a presentation.`

// Function to call Claude API with conversation history
async function callClaude(messages: any[], userMessage: string) {
  try {
    // Build conversation history for Claude
    const claudeMessages = messages.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
    
    // Add current message
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
        model: 'claude-3-sonnet-20240229',
        system: NIV_SYSTEM_PROMPT,
        messages: claudeMessages,
        max_tokens: 1000,
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
    // Fallback response if Claude fails
    return "I understand what you're asking. Let me help you with that. Could you tell me a bit more about your specific goals so I can provide the most relevant assistance?"
  }
}

// Detect if Niv should offer to create something
function detectCreationIntent(message: string) {
  const lowerMessage = message.toLowerCase()
  
  const creationPatterns = {
    'content-draft': [
      'press release', 'write', 'draft', 'content', 'blog post', 
      'article', 'announcement', 'statement'
    ],
    'media-list': [
      'journalist', 'media list', 'reporter', 'outreach', 
      'media contacts', 'pitch list'
    ],
    'strategy-plan': [
      'strategy', 'campaign', 'plan', 'launch', 'roadmap', 
      'timeline', 'strategic planning'
    ]
  }

  for (const [type, patterns] of Object.entries(creationPatterns)) {
    if (patterns.some(pattern => lowerMessage.includes(pattern))) {
      return { shouldCreate: true, type }
    }
  }

  return { shouldCreate: false, type: null }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, context = {}, messages = [] } = await req.json()

    // Use Claude for natural conversation with memory
    let response = ''
    
    if (ANTHROPIC_API_KEY) {
      response = await callClaude(messages, message)
    } else {
      // Simple fallback if no Claude API key
      response = "I can help you with that. "
      
      const intent = detectCreationIntent(message)
      if (intent.shouldCreate) {
        if (intent.type === 'content-draft') {
          response += "I'll create a draft for you. What key messages should I include?"
        } else if (intent.type === 'media-list') {
          response += "I'll build a targeted media list. What industry or beat are you targeting?"
        } else if (intent.type === 'strategy-plan') {
          response += "I'll develop a strategic plan. What's your timeline and main objective?"
        }
      } else {
        response += "What specific aspect would you like to explore?"
      }
    }

    // Check if we should signal creation of something
    const creationIntent = detectCreationIntent(message)
    
    return new Response(
      JSON.stringify({
        response,
        showWork: creationIntent.shouldCreate,
        workType: creationIntent.type,
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
        response: "I'm here to help. Could you rephrase your question?",
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})