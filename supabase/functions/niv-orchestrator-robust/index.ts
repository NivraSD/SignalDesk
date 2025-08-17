import { corsHeaders } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// MORE EXPLICIT SYSTEM PROMPT
const NIV_SYSTEM_PROMPT = `You are Niv, a senior PR strategist with 20 years of experience.

CRITICAL: When user asks you to CREATE something, you MUST include it in your response using this EXACT format:

For media lists:
[BEGIN_MEDIA_LIST]
Journalist Name | Outlet | Beat | Contact
Sarah Chen | TechCrunch | AI & Startups | sarah@techcrunch.com
Michael Brown | Forbes | Enterprise Tech | mbrown@forbes.com
[END_MEDIA_LIST]

For press releases:
[BEGIN_PRESS_RELEASE]
HEADLINE: Your actual headline here
DATE: City, State - Date
BODY: The actual press release text...
[END_PRESS_RELEASE]

For strategic plans:
[BEGIN_STRATEGY_PLAN]
Week 1: Task description
Week 2: Task description
[END_STRATEGY_PLAN]

IMPORTANT:
1. ALWAYS include the content blocks when creating materials
2. Use REAL company names from the conversation
3. Only create what the user explicitly asked for
4. The content blocks are IN ADDITION to your conversational response`

// More flexible extraction
function extractContent(response: string, type: string) {
  console.log(`🔍 Extracting ${type} from response...`)
  
  // Try structured extraction first
  if (type === 'media-list') {
    // Look for the media list block
    const mediaMatch = response.match(/\[BEGIN_MEDIA_LIST\]([\s\S]*?)\[END_MEDIA_LIST\]/i)
    if (mediaMatch) {
      const lines = mediaMatch[1].trim().split('\n').filter(line => line.trim())
      const journalists = []
      
      for (const line of lines) {
        const parts = line.split('|').map(p => p.trim())
        if (parts.length >= 3 && !line.includes('Journalist Name')) {
          journalists.push({
            name: parts[0],
            outlet: parts[1],
            beat: parts[2],
            email: parts[3] || 'contact@outlet.com'
          })
        }
      }
      
      if (journalists.length > 0) {
        console.log(`✅ Extracted ${journalists.length} journalists`)
        return { journalists }
      }
    }
    
    // Fallback: Try to extract from natural language
    const journalistMatches = response.matchAll(/([A-Z][a-z]+ [A-Z][a-z]+) (?:from |at |with |of )([A-Z][a-zA-Z\s]+?)(?:,|\.|who| covers| writes)/g)
    const journalists = []
    for (const match of journalistMatches) {
      journalists.push({
        name: match[1],
        outlet: match[2].trim(),
        beat: 'Technology',
        email: 'contact@outlet.com'
      })
    }
    
    if (journalists.length > 0) {
      console.log(`✅ Extracted ${journalists.length} journalists from natural language`)
      return { journalists }
    }
  }
  
  if (type === 'press-release') {
    // Look for press release block
    const prMatch = response.match(/\[BEGIN_PRESS_RELEASE\]([\s\S]*?)\[END_PRESS_RELEASE\]/i)
    if (prMatch) {
      const content = prMatch[1].trim()
      const headlineMatch = content.match(/HEADLINE:\s*(.+)/i)
      const bodyMatch = content.match(/BODY:\s*([\s\S]+)/i)
      
      return {
        headline: headlineMatch ? headlineMatch[1] : 'Press Release',
        body: bodyMatch ? bodyMatch[1] : content
      }
    }
    
    // Fallback: Look for headline patterns
    const headlineMatch = response.match(/(?:headline|title|announcing):\s*"?([^"\n]+)"?/i)
    if (headlineMatch) {
      return {
        headline: headlineMatch[1],
        body: response
      }
    }
  }
  
  if (type === 'strategy-plan') {
    // Look for strategy block
    const strategyMatch = response.match(/\[BEGIN_STRATEGY_PLAN\]([\s\S]*?)\[END_STRATEGY_PLAN\]/i)
    if (strategyMatch) {
      const lines = strategyMatch[1].trim().split('\n').filter(line => line.trim())
      const milestones = []
      
      for (const line of lines) {
        const weekMatch = line.match(/Week (\d+):\s*(.+)/i)
        if (weekMatch) {
          milestones.push({
            week: parseInt(weekMatch[1]),
            task: weekMatch[2]
          })
        }
      }
      
      return {
        title: 'Strategic Communications Plan',
        milestones
      }
    }
  }
  
  // If we couldn't extract structured content, return the whole response
  console.log(`⚠️ Could not extract structured ${type}, using full response`)
  return {
    content: response,
    note: 'Niv generated this content but not in structured format'
  }
}

// Determine what user is asking for (more precise)
function detectRequestType(message: string) {
  const lower = message.toLowerCase()
  
  // Be very specific about what we're looking for
  if (lower.includes('media list') || lower.includes('media plan') || lower.includes('journalist')) {
    return 'media-list'
  }
  
  if (lower.includes('press release')) {
    return 'press-release'
  }
  
  if (lower.includes('strategic plan') || lower.includes('strategy plan') || lower.includes('communications plan')) {
    return 'strategy-plan'
  }
  
  if (lower.includes('social media') || lower.includes('social content')) {
    return 'social-content'
  }
  
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, messages = [], context = {} } = await req.json()
    
    console.log('📝 Request received:', { 
      message: message?.substring(0, 100),
      messageCount: messages.length
    })
    
    // Detect what user is asking for
    const requestType = detectRequestType(message)
    console.log(`🎯 User requested: ${requestType || 'nothing specific'}`)
    
    // Check if this is a creation request
    const isCreationRequest = message.toLowerCase().includes('create') || 
                             message.toLowerCase().includes('generate') ||
                             message.toLowerCase().includes('write') ||
                             message.toLowerCase().includes('draft')
    
    let nivResponse = ''
    let workItems = []
    
    if (ANTHROPIC_API_KEY) {
      // Build conversation for Claude
      const formattedMessages = messages.map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
      
      // Add explicit instruction if creating
      let finalMessage = message
      if (isCreationRequest && requestType) {
        finalMessage += `\n\nREMINDER: Include the actual ${requestType} content in your response using the appropriate format markers.`
      }
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          system: NIV_SYSTEM_PROMPT,
          messages: [
            ...formattedMessages,
            { role: 'user', content: finalMessage }
          ]
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        nivResponse = data.content[0].text
        console.log('✅ Got Niv response, length:', nivResponse.length)
        
        // If this was a creation request, extract the content
        if (isCreationRequest && requestType && messages.length >= 2) {
          const extractedContent = extractContent(nivResponse, requestType)
          
          if (extractedContent) {
            workItems.push({
              type: requestType,
              title: getTitle(requestType),
              description: getDescription(requestType),
              generatedContent: extractedContent
            })
            console.log(`✅ Created work item: ${requestType}`)
          }
        }
      }
    }
    
    // Fallback if no API
    if (!nivResponse) {
      nivResponse = isCreationRequest ? 
        "I'll help you create that. Please provide more context about your company and goals." :
        "I'm here to help with your PR strategy. What would you like to discuss?"
    }
    
    // Clean response for display (remove content blocks)
    const cleanResponse = nivResponse
      .replace(/\[BEGIN_MEDIA_LIST\][\s\S]*?\[END_MEDIA_LIST\]/gi, '')
      .replace(/\[BEGIN_PRESS_RELEASE\][\s\S]*?\[END_PRESS_RELEASE\]/gi, '')
      .replace(/\[BEGIN_STRATEGY_PLAN\][\s\S]*?\[END_STRATEGY_PLAN\]/gi, '')
      .replace(/REMINDER: Include the actual[\s\S]*?format markers\./g, '')
      .trim()
    
    console.log('✅ Response ready:', {
      hasResponse: !!cleanResponse,
      workItemCount: workItems.length,
      types: workItems.map(w => w.type)
    })
    
    return new Response(
      JSON.stringify({
        response: cleanResponse,
        workItems,
        context: { 
          ...context, 
          requestType,
          wasCreationRequest: isCreationRequest,
          timestamp: new Date().toISOString() 
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: 'I encountered an issue. Please try again.',
        workItems: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})

function getTitle(type: string) {
  const titles = {
    'media-list': 'Strategic Media Plan',
    'press-release': 'Press Release',
    'strategy-plan': 'Strategic Communications Plan',
    'social-content': 'Social Media Content'
  }
  return titles[type] || type
}

function getDescription(type: string) {
  const descriptions = {
    'media-list': 'Targeted journalists and outreach strategy',
    'press-release': 'Professional announcement ready for distribution',
    'strategy-plan': 'Comprehensive PR strategy with timeline',
    'social-content': 'Ready-to-post social media content'
  }
  return descriptions[type] || 'Generated content'
}