import { corsHeaders } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// SIMPLIFIED SYSTEM PROMPT - CLEAR RULES
const NIV_SYSTEM_PROMPT = `You are Niv, a senior PR strategist with 20 years of experience.

## CONVERSATION RULES

1. DEFAULT MODE: Have strategic conversations, ask questions, provide advice
2. DO NOT create materials unless user EXPLICITLY asks with words like:
   - "create a [specific item]"
   - "generate a [specific item]"
   - "write a [specific item]"
   - "draft a [specific item]"

3. WHEN USER ASKS TO CREATE:
   - If they ask for ONE thing (e.g., "create a media plan"), say: "I'll create a media plan for you"
   - If they ask for MULTIPLE things, list them: "I'll create a press release and media plan for you"
   - NEVER say "comprehensive package" or "everything you need"
   - BE SPECIFIC about what you're creating

4. USE REAL CONTEXT:
   - Use actual company names from conversation
   - Use actual product names from conversation
   - Never use placeholders like [Company Name]`

// Detect what user ACTUALLY requested
function detectCreationRequest(message: string, messages: any[]) {
  const userMessage = message.toLowerCase()
  
  // Must have explicit creation words
  const creationWords = ['create', 'generate', 'write', 'draft', 'make', 'develop']
  const hasCreationWord = creationWords.some(word => userMessage.includes(word))
  
  if (!hasCreationWord) {
    return { shouldCreate: false, requestedTypes: [] }
  }
  
  // Determine EXACTLY what they asked for
  const requestedTypes = []
  
  // Check for SPECIFIC requests (order matters - most specific first)
  if (userMessage.includes('media plan') || userMessage.includes('media list')) {
    requestedTypes.push('media-list')
  } else if (userMessage.includes('journalist')) {
    requestedTypes.push('media-list')
  }
  
  if (userMessage.includes('press release')) {
    requestedTypes.push('press-release')
  }
  
  if (userMessage.includes('strategic plan') || userMessage.includes('strategy plan')) {
    requestedTypes.push('strategy-plan')
  } else if (userMessage.includes('communications plan')) {
    requestedTypes.push('strategy-plan')
  }
  
  if (userMessage.includes('social media') || userMessage.includes('social content')) {
    requestedTypes.push('social-content')
  }
  
  if (userMessage.includes('messaging') || userMessage.includes('talking points')) {
    requestedTypes.push('key-messaging')
  }
  
  if (userMessage.includes('faq')) {
    requestedTypes.push('faq')
  }
  
  // Check for "everything" or "all materials"
  if (userMessage.includes('everything') || 
      (userMessage.includes('all') && (userMessage.includes('materials') || userMessage.includes('pr')))) {
    return {
      shouldCreate: true,
      requestedTypes: ['media-list', 'press-release', 'strategy-plan', 'key-messaging']
    }
  }
  
  return {
    shouldCreate: requestedTypes.length > 0,
    requestedTypes
  }
}

// Extract context from conversation
function extractContext(messages: any[]) {
  const allText = messages.map(m => m.content || '').join(' ')
  
  // Find company name (most recent mention wins)
  const companyMatch = allText.match(/(?:we're |we are |i'm from |our company is |company called )([A-Z][a-zA-Z0-9\s&]{1,30})/gi)
  const companyName = companyMatch ? companyMatch[companyMatch.length - 1].replace(/^(we're |we are |i'm from |our company is |company called )/i, '').trim() : 'Your Company'
  
  // Find product name
  const productMatch = allText.match(/(?:launching |product called |our product |platform called )([A-Z][a-zA-Z0-9\s]{1,25})/gi)
  const productName = productMatch ? productMatch[productMatch.length - 1].replace(/^(launching |product called |our product |platform called )/i, '').trim() : 'your solution'
  
  // Find executive
  const execMatch = allText.match(/(?:I'm |I am |My name is )([A-Z][a-z]+ [A-Z][a-z]+)/g)
  const executiveName = execMatch ? execMatch[execMatch.length - 1].replace(/^(I'm |I am |My name is )/i, '').trim() : 'Leadership Team'
  
  return { companyName, productName, executiveName }
}

// Generate ONLY requested content
function generateContent(type: string, context: any) {
  const { companyName, productName, executiveName } = context
  
  switch(type) {
    case 'media-list':
      return {
        title: 'Strategic Media Plan',
        journalists: [
          {
            name: 'Sarah Johnson',
            outlet: 'TechCrunch',
            beat: 'Enterprise Technology',
            relevance: `Covers ${productName} category extensively`
          },
          {
            name: 'Michael Chen',
            outlet: 'Forbes',
            beat: 'Business Technology',
            relevance: `Interested in ${companyName} industry`
          }
        ]
      }
    
    case 'press-release':
      return {
        title: 'Press Release',
        headline: `${companyName} Announces ${productName}`,
        body: `${companyName} today announced ${productName}, a breakthrough solution that transforms how businesses operate.
        
"We're excited to launch ${productName}," said ${executiveName} of ${companyName}.

About ${companyName}:
${companyName} is a leading innovator in the industry.`
      }
    
    case 'strategy-plan':
      return {
        title: 'Strategic Communications Plan',
        objective: `Position ${companyName} as leader with ${productName} launch`,
        timeline: [
          { week: 1, task: 'Media outreach begins' },
          { week: 2, task: 'Launch announcement' }
        ]
      }
    
    case 'social-content':
      return {
        title: 'Social Media Content',
        posts: [
          `🚀 ${companyName} launches ${productName} - transforming the industry!`,
          `Learn how ${productName} is changing the game`
        ]
      }
    
    case 'key-messaging':
      return {
        title: 'Key Messaging',
        messages: [
          `${companyName} leads innovation with ${productName}`,
          `${productName} delivers immediate ROI`
        ]
      }
    
    case 'faq':
      return {
        title: 'FAQ Document',
        questions: [
          { q: `What is ${productName}?`, a: `${productName} is ${companyName}'s latest innovation` },
          { q: 'How does it work?', a: 'Through innovative technology and seamless integration' }
        ]
      }
    
    default:
      return { title: type, content: 'Generated content' }
  }
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
    
    // Step 1: Check what user requested
    const creationRequest = detectCreationRequest(message, messages)
    console.log('🎯 Creation request:', creationRequest)
    
    // Step 2: Get Claude's response
    let nivResponse = ''
    if (ANTHROPIC_API_KEY && messages.length >= 2) {
      // Call Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
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
      }
    }
    
    // Use fallback if no Claude response
    if (!nivResponse) {
      if (creationRequest.shouldCreate) {
        const types = creationRequest.requestedTypes.join(', ')
        nivResponse = `I'll create ${types} for you based on our discussion.`
      } else {
        nivResponse = "I'd be happy to help with your PR strategy. Tell me more about your company and what you're announcing."
      }
    }
    
    // Step 3: Generate ONLY requested content
    const workItems = []
    if (creationRequest.shouldCreate && messages.length >= 2) {
      const extractedContext = extractContext(messages)
      console.log('📦 Context:', extractedContext)
      
      for (const type of creationRequest.requestedTypes) {
        const content = generateContent(type, extractedContext)
        workItems.push({
          type,
          title: content.title,
          description: `Generated ${type}`,
          generatedContent: content
        })
      }
    }
    
    console.log('✅ Response:', {
      workItemCount: workItems.length,
      types: workItems.map(w => w.type)
    })
    
    return new Response(
      JSON.stringify({
        response: nivResponse,
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