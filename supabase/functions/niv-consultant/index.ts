import { corsHeaders } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// PURE CONSULTATION PROMPT - NO GENERATION
const NIV_CONSULTANT_PROMPT = `You are Niv, a senior PR strategist with 20 years of experience.

Your role is CONSULTATION ONLY:
- Guide users through understanding their PR needs
- Ask clarifying questions to gather context
- Provide strategic advice and recommendations
- Help users refine their messaging and goals

IMPORTANT: You do NOT generate final deliverables. When the user is ready to create something, you should:
1. Confirm they have provided enough context
2. Summarize what will be created
3. Let them know they can generate the content when ready

Focus on:
- Understanding the company and product
- Identifying target audiences
- Clarifying goals and objectives
- Developing key messages
- Recommending appropriate PR materials

Be conversational, helpful, and strategic. You're building understanding, not creating artifacts.`

interface ConsultationContext {
  companyName?: string
  productName?: string
  industry?: string
  goals?: string[]
  targetAudience?: string[]
  keyMessages?: string[]
  stage?: 'discovery' | 'refinement' | 'ready'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, messages = [], context = {} } = await req.json()
    
    console.log('💬 Consultation request:', {
      message: message?.substring(0, 100),
      messageCount: messages.length,
      hasContext: !!context.companyName
    })

    // Build conversation context
    let consultationContext: ConsultationContext = extractContextFromConversation(messages, context)
    
    // Determine consultation stage
    const stage = determineConsultationStage(consultationContext, message)
    consultationContext.stage = stage
    
    console.log('📊 Consultation context:', {
      stage,
      hasCompany: !!consultationContext.companyName,
      hasProduct: !!consultationContext.productName,
      goalsCount: consultationContext.goals?.length || 0
    })

    // Get Niv's consultation response
    let nivResponse = ''
    
    if (ANTHROPIC_API_KEY) {
      // Format messages for Claude
      const formattedMessages = messages.map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
      
      // Add context reminder if we have substantial context
      let enhancedMessage = message
      if (stage === 'ready' && isGenerationRequest(message)) {
        enhancedMessage += '\n\n[Context: User has provided sufficient information and may be ready to generate content. Confirm and summarize what would be created.]'
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
          max_tokens: 1024,
          system: NIV_CONSULTANT_PROMPT,
          messages: [
            ...formattedMessages,
            { role: 'user', content: enhancedMessage }
          ],
          temperature: 0.7
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        nivResponse = data.content[0].text
        console.log('✅ Got consultation response')
      }
    }
    
    // Fallback response
    if (!nivResponse) {
      nivResponse = getfallbackConsultationResponse(stage, consultationContext)
    }
    
    // Check if user is ready to generate content
    const readyToGenerate = stage === 'ready' && isGenerationRequest(message)
    
    // Build response
    const responseData = {
      response: nivResponse,
      context: consultationContext,
      stage,
      readyToGenerate,
      availableActions: getAvailableActions(stage, consultationContext),
      metadata: {
        timestamp: new Date().toISOString(),
        messageCount: messages.length + 1
      }
    }
    
    // If ready to generate, include generation options
    if (readyToGenerate) {
      responseData['generationOptions'] = {
        types: detectPossibleContentTypes(message, consultationContext),
        endpoint: '/functions/v1/niv-generator',
        context: consultationContext
      }
    }
    
    console.log('✅ Consultation response ready:', {
      stage: responseData.stage,
      readyToGenerate: responseData.readyToGenerate,
      actionsCount: responseData.availableActions.length
    })
    
    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('❌ Consultation error:', error)
    return new Response(
      JSON.stringify({
        response: 'I apologize, I encountered an issue. Could you please rephrase your question?',
        context: {},
        stage: 'discovery',
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})

function extractContextFromConversation(messages: any[], existingContext: any): ConsultationContext {
  const context: ConsultationContext = { ...existingContext }
  
  // Analyze conversation to extract context
  const fullConversation = messages.map(m => m.content).join(' ')
  
  // Extract company name
  if (!context.companyName) {
    const companyMatch = fullConversation.match(/(?:company|organization|we are|I work for|representing)\s+(?:is\s+)?([A-Z][A-Za-z0-9\s]+?)(?:\.|,|\s+and|\s+is|\s+are)/i)
    if (companyMatch) {
      context.companyName = companyMatch[1].trim()
    }
  }
  
  // Extract product name
  if (!context.productName) {
    const productMatch = fullConversation.match(/(?:product|service|launching|announce|introducing)\s+(?:called\s+)?([A-Z][A-Za-z0-9\s]+?)(?:\.|,|\s+which|\s+that|\s+is)/i)
    if (productMatch) {
      context.productName = productMatch[1].trim()
    }
  }
  
  // Extract industry
  if (!context.industry) {
    const industries = ['technology', 'healthcare', 'finance', 'retail', 'education', 'manufacturing', 'AI', 'software', 'biotech']
    for (const industry of industries) {
      if (fullConversation.toLowerCase().includes(industry)) {
        context.industry = industry
        break
      }
    }
  }
  
  // Initialize arrays if not present
  context.goals = context.goals || []
  context.targetAudience = context.targetAudience || []
  context.keyMessages = context.keyMessages || []
  
  return context
}

function determineConsultationStage(context: ConsultationContext, message: string): 'discovery' | 'refinement' | 'ready' {
  // Check how much context we have
  const hasBasics = context.companyName && (context.productName || context.industry)
  const hasGoals = context.goals && context.goals.length > 0
  const hasAudience = context.targetAudience && context.targetAudience.length > 0
  
  if (!hasBasics) {
    return 'discovery'
  } else if (!hasGoals || !hasAudience) {
    return 'refinement'
  } else {
    return 'ready'
  }
}

function isGenerationRequest(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('create') ||
    lower.includes('generate') ||
    lower.includes('write') ||
    lower.includes('draft') ||
    lower.includes('make') ||
    lower.includes('build')
  )
}

function detectPossibleContentTypes(message: string, context: ConsultationContext): string[] {
  const lower = message.toLowerCase()
  const types = []
  
  if (lower.includes('media') || lower.includes('journalist') || lower.includes('reporter')) {
    types.push('media-list')
  }
  if (lower.includes('press release') || lower.includes('announcement')) {
    types.push('press-release')
  }
  if (lower.includes('strategy') || lower.includes('plan') || lower.includes('timeline')) {
    types.push('strategy-plan')
  }
  if (lower.includes('social') || lower.includes('tweet') || lower.includes('post')) {
    types.push('social-content')
  }
  
  // If no specific type mentioned but user wants to create something
  if (types.length === 0 && isGenerationRequest(message)) {
    // Suggest based on context
    if (context.stage === 'ready') {
      types.push('media-list', 'press-release', 'strategy-plan')
    }
  }
  
  return types
}

function getAvailableActions(stage: string, context: ConsultationContext): string[] {
  const actions = []
  
  switch (stage) {
    case 'discovery':
      actions.push('Provide company information', 'Describe your product/service', 'Explain your industry')
      break
    case 'refinement':
      actions.push('Define your goals', 'Identify target audience', 'Clarify key messages')
      break
    case 'ready':
      actions.push('Generate media list', 'Create press release', 'Build strategy plan', 'Refine context')
      break
  }
  
  return actions
}

function getfallbackConsultationResponse(stage: string, context: ConsultationContext): string {
  switch (stage) {
    case 'discovery':
      return "I'm Niv, your PR strategist. To help you effectively, I need to understand your company and goals. Could you tell me about your organization and what you're looking to announce or promote?"
    case 'refinement':
      return `I understand you're ${context.companyName || 'working on something interesting'}. To create the most effective PR strategy, could you help me understand your specific goals and target audience?`
    case 'ready':
      return `Great! I have enough context about ${context.companyName || 'your company'}. I can help you create media lists, press releases, or strategic plans. What would you like to work on first?`
    default:
      return "I'm here to help with your PR strategy. What would you like to discuss?"
  }
}