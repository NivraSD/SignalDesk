import { corsHeaders } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// System prompt that returns STRUCTURED content
const NIV_SYSTEM_PROMPT = `You are Niv, a senior PR strategist with 20 years of experience.

CRITICAL RULES FOR CONTENT GENERATION:

1. When user asks to CREATE something, you must:
   - First confirm what you're creating
   - Then include the actual content in your response using this EXACT format:

[BEGIN_ARTIFACT:media-list]
{
  "journalists": [
    {"name": "Real Name", "outlet": "Real Outlet", "beat": "Their Beat"},
    ...
  ]
}
[END_ARTIFACT:media-list]

[BEGIN_ARTIFACT:press-release]
{
  "headline": "Actual Headline",
  "body": "Full press release text..."
}
[END_ARTIFACT:press-release]

[BEGIN_ARTIFACT:strategy-plan]
{
  "title": "Strategic Plan Title",
  "milestones": [...]
}
[END_ARTIFACT:strategy-plan]

2. ONLY create what the user explicitly asked for
3. Use REAL context from the conversation
4. Include the artifact IN your response so it can be extracted`

// Extract artifacts from Niv's response
function extractArtifacts(response: string) {
  const artifacts = []
  const artifactPattern = /\[BEGIN_ARTIFACT:([\w-]+)\]([\s\S]*?)\[END_ARTIFACT:\1\]/g
  
  let match
  while ((match = artifactPattern.exec(response)) !== null) {
    const type = match[1]
    const contentStr = match[2].trim()
    
    try {
      const content = JSON.parse(contentStr)
      artifacts.push({
        type,
        generatedContent: content
      })
      console.log(`✅ Extracted artifact: ${type}`)
    } catch (e) {
      console.error(`Failed to parse artifact ${type}:`, e)
    }
  }
  
  return artifacts
}

// Determine what user actually requested
function determineUserRequest(message: string) {
  const lower = message.toLowerCase()
  const requested = []
  
  // Be VERY specific about matching
  if (lower.includes('media list') || lower.includes('media plan')) {
    requested.push('media-list')
  }
  
  if (lower.includes('press release')) {
    requested.push('press-release')
  }
  
  if (lower.includes('strategic plan') || lower.includes('strategy plan')) {
    requested.push('strategy-plan')
  }
  
  return requested
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, messages = [], context = {} } = await req.json()
    
    console.log('📝 Request:', { 
      message: message?.substring(0, 100),
      messageCount: messages.length
    })
    
    // Determine what user requested
    const requestedTypes = determineUserRequest(message)
    console.log('🎯 User requested:', requestedTypes)
    
    // Get Niv's response with structured artifacts
    let nivResponse = ''
    
    if (ANTHROPIC_API_KEY) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: NIV_SYSTEM_PROMPT,
          messages: [
            ...messages.map(m => ({
              role: m.type === 'user' ? 'user' : 'assistant',
              content: m.content
            })),
            { role: 'user', content: message }
          ]
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        nivResponse = data.content[0].text
        console.log('✅ Got Niv response with length:', nivResponse.length)
      }
    }
    
    // Fallback response if no API
    if (!nivResponse) {
      nivResponse = "I'll help you with your PR strategy. Please provide more context about your company and goals."
    }
    
    // Extract artifacts from Niv's response
    const artifacts = extractArtifacts(nivResponse)
    console.log(`📦 Extracted ${artifacts.length} artifacts from Niv's response`)
    
    // Create work items from artifacts
    const workItems = artifacts.map(artifact => ({
      type: artifact.type,
      title: getTitle(artifact.type),
      description: getDescription(artifact.type),
      generatedContent: artifact.generatedContent // Use Niv's ACTUAL content
    }))
    
    // Remove artifact markers from display response
    const cleanResponse = nivResponse.replace(/\[BEGIN_ARTIFACT:[\w-]+\][\s\S]*?\[END_ARTIFACT:[\w-]+\]/g, '').trim()
    
    console.log('✅ Response ready:', {
      workItemCount: workItems.length,
      types: workItems.map(w => w.type)
    })
    
    return new Response(
      JSON.stringify({
        response: cleanResponse,
        workItems,
        context: { ...context, timestamp: new Date().toISOString() }
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
    'strategy-plan': 'Strategic Communications Plan'
  }
  return titles[type] || type
}

function getDescription(type: string) {
  const descriptions = {
    'media-list': 'Targeted journalists and outreach strategy',
    'press-release': 'Professional announcement ready for distribution',
    'strategy-plan': 'Comprehensive PR strategy with timeline'
  }
  return descriptions[type] || 'Generated content'
}