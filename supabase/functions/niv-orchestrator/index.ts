import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.27.0'
import { corsHeaders } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// ========================================
// NIV: COMPREHENSIVE PR STRATEGIST SYSTEM
// ========================================
// Multi-modal consultation system supporting advisory, analysis, crisis response, review, and material creation

// Extract Niv's actual generated content from response (FIXED TO WORK FOR ALL TYPES)
function extractNivGeneratedContent(response: string, type: string): any {
  console.log(`🔎 Attempting to extract ${type} from Niv's response`)
  
  // For ANY content type, use the response as the generated content
  // The standardization will happen in the frontend
  if (response && response.trim().length > 0) {
    console.log(`✅ Successfully extracted ${type} content from Niv's response`)
    
    switch (type) {
      case 'media-list':
        return {
          title: 'Strategic Media Plan',
          description: 'Curated list of journalists and outlets',
          content: response,
          journalists: [] // Will be parsed by frontend standardization
        }
      
      case 'content-draft':
        return {
          title: 'Content Draft',
          type: 'press_release',
          body: response,
          content: response
        }
      
      case 'strategy-plan':
        return {
          title: 'Strategic Plan',
          content: response,
          milestones: [] // Will be parsed by frontend standardization
        }
      
      case 'social-content':
        return {
          title: 'Social Media Content',
          content: response
        }
      
      case 'key-messaging':
        return {
          title: 'Key Messaging Framework',
          content: response
        }
      
      case 'faq-document':
        return {
          title: 'FAQ Document',
          content: response
        }
      
      default:
        return {
          title: 'Generated Content',
          content: response
        }
    }
  }
  
  console.log(`⚠️ No content found to extract for ${type}`)
  return null
}

// Intent Classification for Consultation Modes
function classifyConsultationIntent(message: string, conversationHistory: any[]): string {
  const lowerMessage = message.toLowerCase();
  const urgencyWords = ['urgent', 'crisis', 'emergency', 'breaking', 'immediate', 'asap', 'now'];
  const analysisWords = ['analyze', 'review', 'evaluate', 'assess', 'thoughts on', 'opinion', 'what do you think'];
  const advisoryWords = ['advice', 'recommend', 'should i', 'help me decide', 'strategy', 'approach'];
  const reviewWords = ['feedback', 'review this', 'look at', 'check this', 'improve'];
  const materialWords = ['create', 'write', 'draft', 'generate', 'make', 'develop'];
  
  // Crisis Response - highest priority
  if (urgencyWords.some(word => lowerMessage.includes(word)) && 
      (lowerMessage.includes('crisis') || lowerMessage.includes('emergency') || lowerMessage.includes('breaking'))) {
    return 'CRISIS_RESPONSE';
  }
  
  // Review Mode - when reviewing existing materials
  if (reviewWords.some(word => lowerMessage.includes(word)) || 
      lowerMessage.includes('attached') || lowerMessage.includes('here is') || lowerMessage.includes('this is')) {
    return 'REVIEW_MODE';
  }
  
  // Material Creation - explicit creation requests 
  // Note: conversationHistory may include both user and assistant messages
  // Count only the conversation turns (pairs of messages)
  const conversationTurns = Math.floor(conversationHistory.length / 2)
  if (conversationTurns >= 2 && // At least 2 back-and-forth exchanges to ensure consultation
      materialWords.some(word => lowerMessage.includes(word))) {
    console.log('📝 Material creation mode detected after', conversationTurns, 'conversation turns')
    return 'MATERIAL_CREATION';
  }
  
  // Analysis Mode - analytical requests
  if (analysisWords.some(word => lowerMessage.includes(word))) {
    return 'ANALYSIS_MODE';
  }
  
  // Advisory Mode - strategic guidance requests
  if (advisoryWords.some(word => lowerMessage.includes(word))) {
    return 'ADVISORY_MODE';
  }
  
  // Default to Advisory for initial consultations
  return conversationHistory.length === 0 ? 'ADVISORY_MODE' : 'ADVISORY_MODE';
}

// System prompts for different consultation modes
const SYSTEM_PROMPTS = {
  ADVISORY_MODE: `You are Niv, a senior PR strategist with 20 years of experience at top agencies. You are in ADVISORY MODE - providing strategic counsel and guidance.

## ADVISORY MODE PROTOCOL

Your role is to be a strategic advisor who:
1. Asks probing questions to understand the full context
2. Provides expert recommendations based on industry best practices
3. Identifies opportunities and potential challenges
4. Guides clients toward optimal strategic decisions
5. ONLY offers to create materials after thorough consultation

## CONSULTATION APPROACH
- Start with discovery questions to understand objectives, audience, timeline, and constraints
- Provide strategic recommendations with clear rationale
- Highlight potential risks and mitigation strategies
- Suggest next steps and optimal approaches
- Ask if they would like specific materials created only after providing strategic guidance

## RESPONSE STRUCTURE
- **Strategic Assessment:** Brief analysis of their situation
- **Key Recommendations:** 3-4 specific strategic recommendations
- **Considerations:** Important factors to keep in mind
- **Next Steps:** Suggested actions
- **Optional:** Offer to create specific materials if appropriate

Be consultative, insightful, and strategic. Focus on the "why" behind recommendations.`,

  ANALYSIS_MODE: `You are Niv, a senior PR strategist with 20 years of experience. You are in ANALYSIS MODE - providing deep analytical insights and recommendations.

## ANALYSIS MODE PROTOCOL

Your role is to be an analytical expert who:
1. Conducts thorough analysis of situations, markets, or strategies
2. Identifies patterns, trends, and strategic implications
3. Provides data-driven insights and recommendations
4. Evaluates risks, opportunities, and competitive positioning
5. Offers strategic alternatives and trade-offs

## ANALYTICAL FRAMEWORK
- **Situation Analysis:** Current state assessment
- **Market Context:** Industry trends and competitive landscape
- **Stakeholder Impact:** Effects on different audiences
- **Risk Assessment:** Potential challenges and mitigation
- **Opportunity Identification:** Strategic advantages to leverage
- **Recommendations:** Prioritized action items with rationale

## RESPONSE STRUCTURE
- **Executive Summary:** Key findings in 2-3 sentences
- **Detailed Analysis:** Comprehensive breakdown by category
- **Strategic Implications:** What this means for their business
- **Recommendations:** Prioritized next steps
- **Success Metrics:** How to measure outcomes

Provide thorough, insightful analysis that demonstrates deep industry expertise.`,

  CRISIS_RESPONSE: `You are Niv, a senior PR strategist with 20 years of crisis management experience. You are in CRISIS RESPONSE MODE - providing immediate strategic guidance for urgent situations.

## CRISIS RESPONSE PROTOCOL

Your role is to provide rapid, decisive guidance for crisis situations:
1. Quickly assess the crisis severity and immediate risks
2. Provide immediate action steps to contain damage
3. Outline crisis communication strategy
4. Identify key stakeholders who need immediate attention
5. Create rapid response timeline with priorities

## CRISIS MANAGEMENT FRAMEWORK
- **Immediate Actions (0-2 hours):** Critical first steps
- **Short-term Strategy (2-24 hours):** Damage containment
- **Medium-term Plan (1-7 days):** Recovery and rebuilding
- **Stakeholder Communications:** Key messages for each audience
- **Media Strategy:** How to handle press inquiries

## RESPONSE STRUCTURE
- **Crisis Assessment:** Severity level and immediate risks
- **IMMEDIATE ACTIONS:** What to do RIGHT NOW (bulleted list)
- **Crisis Communications Plan:** Key messages and spokespeople
- **Stakeholder Strategy:** Who to contact and how
- **Timeline:** Critical milestones for next 72 hours
- **Escalation Plan:** When to involve legal, executives, or external help

Respond with urgency while maintaining strategic thinking. Prioritize damage containment and stakeholder trust.`,

  REVIEW_MODE: `You are Niv, a senior PR strategist with 20 years of experience. You are in REVIEW MODE - analyzing and providing feedback on existing materials.

## REVIEW MODE PROTOCOL

Your role is to be a thorough reviewer who:
1. Analyzes existing PR materials for effectiveness
2. Identifies strengths and areas for improvement
3. Provides specific, actionable feedback
4. Suggests strategic enhancements
5. Ensures alignment with best practices and objectives

## REVIEW CRITERIA
- **Message Clarity:** Are key messages clear and compelling?
- **Audience Alignment:** Does content resonate with target audiences?
- **Strategic Positioning:** Does it support business objectives?
- **Competitive Differentiation:** Does it stand out in the market?
- **Media Appeal:** Will journalists find this newsworthy?
- **Brand Consistency:** Does it align with brand voice and values?

## RESPONSE STRUCTURE
- **Overall Assessment:** High-level evaluation and grade (A-F)
- **Strengths:** What's working well (2-3 points)
- **Areas for Improvement:** Specific issues with solutions (3-5 points)
- **Strategic Recommendations:** How to enhance effectiveness
- **Next Steps:** Specific actions to improve the material
- **Enhanced Version:** Offer to create improved version if needed

Provide constructive, specific feedback that helps improve the material's strategic impact.`,

  MATERIAL_CREATION: `You are Niv, a senior PR strategist with 20 years of experience. You are in MATERIAL CREATION MODE - creating comprehensive PR materials based on thorough consultation.

## CRITICAL RULE: NEVER PUT THE ACTUAL CONTENT IN YOUR CHAT RESPONSE

When creating materials, you must:
1. ONLY describe what you're creating in your chat message
2. NEVER include the actual media list, press release, or content in the chat
3. Tell the user: "I've created [material type] for you - it's available in the right panel"
4. The actual content will be extracted and shown as an artifact in the right panel

## MATERIAL CREATION PROTOCOL

You should only be in this mode after conducting proper consultation. Your role is to:
1. Synthesize insights from consultation into strategic materials
2. Create comprehensive, professional PR assets (BUT DON'T SHOW THEM IN CHAT)
3. Ensure all materials align with strategic objectives
4. Tell user the materials are ready in the right panel

## CHAT RESPONSE STRUCTURE (DO NOT INCLUDE ACTUAL CONTENT)
- Say what you've created: "I've created a comprehensive media list..."
- Brief strategic rationale (1-2 sentences)
- Tell user: "The full [material] is available in the right panel where you can review and edit it"
- DO NOT include the actual media list, content, or materials in this response

Remember: The actual content will appear as an artifact in the right panel, NOT in the chat.`
}

// Get system prompt based on consultation mode
function getSystemPrompt(consultationMode: string): string {
  return SYSTEM_PROMPTS[consultationMode] || SYSTEM_PROMPTS.ADVISORY_MODE;
}

// Enhanced system prompt with stricter creation controls
const NIV_LEGACY_PROMPT = `You are Niv, a senior PR strategist with 20 years of experience at top agencies.

## CRITICAL BEHAVIOR RULES

### DEFAULT: ADVISORY CONVERSATION MODE
- Have natural strategic conversations about PR and communications
- Ask probing questions to understand company, product, audience, goals
- Provide expert advice, recommendations, and strategic guidance
- Build context through dialogue before any material creation
- NEVER create materials unless user explicitly uses creation language

### STRICT MATERIAL CREATION PROTOCOL

ONLY create materials when user explicitly says:
- "Create [specific item]"
- "Generate [specific item]" 
- "Write [specific item]"
- "Draft [specific item]"
- "Make [specific item]"
- "Develop [specific item]"

AND they specify exactly what they want:
- "Create a press release"
- "Generate a media plan"
- "Write social media content"
- "Draft a strategic plan"

### WHEN YOU DO CREATE:
1. Say exactly: "I'll create [specific item] for you based on our discussion"
2. Use REAL context from conversation (company names, products, details)
3. Generate ONLY what was requested - never multiple items
4. NEVER use placeholders like [Company Name] or [Product]

### WHAT NOT TO DO:
- Don't create materials when user asks for "help" or "advice"
- Don't create multiple items when only one was requested
- Don't offer to create materials unless they specifically ask
- Don't generate content for vague requests like "need PR materials"

## CONVERSATION FLOW EXAMPLES

User: "I need help with PR for my startup"
You: "I'd be happy to help with your startup's PR strategy. Tell me about your company - what do you do and who's your target audience?"

User: "We're TechCorp, we make AI tools for developers"
You: "Excellent! AI developer tools are a hot market. What specific problem does your solution solve? Are you looking to launch something new or build awareness for existing products?"

User: "We're launching CloudAI next month. Create a press release"
You: "I'll create a press release for TechCorp's CloudAI launch based on our discussion. Let me develop that for you now..."
[ONLY NOW create the press release - nothing else]

## CORE PRINCIPLES
- Be a strategic advisor first, content creator second
- Build trust through conversation before creating materials
- Only create exactly what is explicitly requested
- Use real context, never generic placeholders`

// Call Claude API for intelligent responses
async function callClaude(messages: any[], userMessage: string) {
  try {
    console.log('📞 Calling Claude API with:', {
      messageCount: messages.length,
      userMessageLength: userMessage.length,
      hasApiKey: !!ANTHROPIC_API_KEY,
      apiKeyPrefix: ANTHROPIC_API_KEY ? ANTHROPIC_API_KEY.substring(0, 10) + '...' : 'missing'
    })
    
    const formattedMessages = [
      ...messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ]
    
    console.log('📝 Formatted messages for Claude:', {
      count: formattedMessages.length,
      firstMessage: formattedMessages[0]?.content?.substring(0, 50) + '...',
      lastMessage: formattedMessages[formattedMessages.length - 1]?.content?.substring(0, 50) + '...'
    })

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
        system: NIV_LEGACY_PROMPT,
        messages: formattedMessages
      })
    })

    console.log('📡 Claude API response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Claude API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500),
        headers: Object.fromEntries(response.headers.entries())
      })
      throw new Error(`Claude API error: ${response.status} - ${errorText.substring(0, 200)}`)
    }

    const data = await response.json()
    console.log('✅ Claude API success:', {
      hasContent: !!data.content,
      contentLength: data.content?.[0]?.text?.length || 0,
      contentPreview: data.content?.[0]?.text?.substring(0, 100) + '...'
    })
    
    return data.content[0].text
  } catch (error) {
    console.error('🔥 Error in callClaude function:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    })
    console.log('⚠️ Falling back to generateFallbackResponse')
    return generateFallbackResponse(userMessage)
  }
}


// Fallback responses if Claude fails
function generateFallbackResponse(message: string, mode: string = 'ADVISORY_MODE') {
  const lowerMessage = message.toLowerCase()
  
  switch(mode) {
    case 'CRISIS_RESPONSE':
      return "I understand this is an urgent situation requiring immediate strategic guidance. As your PR strategist, I need to quickly assess the situation to provide the most effective crisis response. Can you tell me: 1) What exactly happened? 2) Who knows about it? 3) What's your immediate timeline? This will help me provide targeted crisis management recommendations."

    case 'ANALYSIS_MODE':
      return "I'll provide a comprehensive analysis of your situation. To give you the most valuable strategic insights, I need to understand: 1) What specifically would you like me to analyze? 2) What's the business context? 3) What decisions are you trying to make? This will help me deliver actionable analytical recommendations."

    case 'REVIEW_MODE':
      return "I'd be happy to review your materials and provide strategic feedback. Please share what you'd like me to review, and I'll analyze it from a PR perspective including messaging effectiveness, audience alignment, and strategic recommendations for improvement."

    case 'MATERIAL_CREATION':
      return "I can create comprehensive PR materials for your campaign. Based on our discussion, I'll develop professional materials including media plans, press releases, strategic timelines, and more. What specific materials do you need for your announcement?"

    default: // ADVISORY_MODE
      if (lowerMessage.includes('strategic plan') || lowerMessage.includes('strategy')) {
        return "I'd be happy to help develop a strategic plan for your PR campaign. To provide the most effective strategic guidance, could you tell me more about: 1) What you're launching or announcing? 2) Your target audience and timeline? 3) Your key objectives and success metrics? This will help me craft targeted strategic recommendations."
      }
      if (lowerMessage.includes('media plan') || lowerMessage.includes('media list') || lowerMessage.includes('journalist')) {
        return "I can help you develop a strategic media plan with targeted journalist outreach. To ensure I identify the right media contacts and angles, could you share: 1) What type of announcement is this? 2) Which publications are most important to reach? 3) Your target audience and geographic focus? This will help me create an effective media strategy."
      }
      if (lowerMessage.includes('press release') || lowerMessage.includes('announcement')) {
        return "I'll help you craft a compelling press release that drives coverage. First, let me understand the strategic context: 1) What's the newsworthy angle you're announcing? 2) What makes this timing significant? 3) What proof points or quotes can we include? This will help me create a press release that resonates with media."
      }
      
      return "Hello! I'm Niv, your PR strategist with 20 years of experience. I provide strategic counsel, crisis guidance, market analysis, and create comprehensive PR materials. What PR challenge can I help you with today?"
  }
}

// Enhanced fallback responses based on consultation mode (moved to after enhanced function)
function generateLegacyFallbackResponse(message: string) {
  const lowerMessage = message.toLowerCase()
  
  // Always respond with discovery questions, never jump to creation
  if (lowerMessage.includes('strategic plan') || lowerMessage.includes('strategy') || 
      lowerMessage.includes('media plan') || lowerMessage.includes('press release') ||
      lowerMessage.includes('help') || lowerMessage.includes('create')) {
    
    return `Hello! I'm Niv, a senior PR strategist with 20 years of experience. I'd love to help you develop an effective PR strategy.

To ensure I provide the most valuable strategic counsel for your specific situation, let me understand your needs better:

1. What's the main story or announcement you need PR support for?
2. What's your timeline - when do you need to launch or announce?
3. Who are your key audiences - investors, customers, media, partners?
4. What does success look like for this PR effort?
5. What's your competitive landscape and what makes you different?
6. Are there any sensitivities or past issues I should be aware of?

Understanding these details will help me provide tailored strategic recommendations for your situation.`
  }
  
  return `Hello! I'm Niv, a senior PR strategist with 20 years of experience helping companies craft winning narratives.

Before we dive into any specific materials, I always start by understanding the strategic context. Could you tell me:

1. What's the specific PR challenge or opportunity you're facing?
2. What type of announcement or story are you working on?
3. What are your main objectives with this PR effort?

This will help me provide the most valuable guidance for your situation.`
}

// FIXED: Detect EXPLICIT creation requests only - NO FALLBACKS
function detectExplicitCreationIntent(response: string, messages: any[], consultationMode?: string) {
  try {
    console.log('🔎 detectExplicitCreationIntent called:', {
      responseLength: response?.length || 0,
      messageCount: messages?.length || 0,
      consultationMode
    })
    
    if (!response || typeof response !== 'string') {
      console.error('❌ Invalid response in detectExplicitCreationIntent:', typeof response)
      return []
    }
    
    const lowerResponse = response.toLowerCase()
    
    // Look for phrases that indicate Niv is creating/delivering materials
    const explicitCreationPhrases = [
      "i'll create",
      "i'll now create", 
      "let me create",
      "creating your",
      "here's your",
      "i've created",
      "i've prepared",
      "generating your",
      "i'll generate",
      "i'll develop",
      "i'll draft",
      "i'll write"
    ]
    
    // ALSO look for content patterns that indicate material delivery
    const contentPatterns = [
      "media list:",
      "strategic plan:",
      "press release:",
      "tier 1",
      "tier 2", 
      "tier 3",
      "journalists:",
      "contacts:",
      "outlets:",
      "wall street journal",
      "bloomberg",
      "reuters",
      "techcrunch",
      "automotive news"
    ]
    
    // Check if conversation has enough context (at least 2 back-and-forth exchanges)
    const hasEnoughContext = messages && messages.length >= 2
    
    console.log('📊 Context check:', {
      messageCount: messages?.length || 0,
      hasEnoughContext,
      requiredMessages: 2
    })
    
    // Check if Niv's response indicates they're actually creating something NOW
    const hasExplicitCreation = explicitCreationPhrases.some(phrase => {
      const found = lowerResponse.includes(phrase)
      if (found) {
        console.log(`✅ Found creation phrase: "${phrase}"`)
      }
      return found
    })
    
    // Check if response contains actual content patterns (like media lists)
    const hasContentPatterns = contentPatterns.some(pattern => {
      const found = lowerResponse.includes(pattern)
      if (found) {
        console.log(`✅ Found content pattern: "${pattern}"`)
      }
      return found
    })
    
    console.log('🎯 Creation detection result:', {
      hasExplicitCreation,
      hasContentPatterns,
      hasEnoughContext
    })
    
    // FIXED: Allow creation if EITHER explicit creation OR content patterns found
    if (!hasExplicitCreation && !hasContentPatterns) {
      console.log('❌ No creation phrases or content patterns found - NOT creating materials')
      return []
    }
    
    if (!hasEnoughContext) {
      console.log('❌ Insufficient conversation context - NOT creating materials')
      return []
    }
  
    console.log('✅ Explicit material creation detected with sufficient context!')
    
    // Determine what to create based on BOTH user request AND Niv's response
    const lastUserMessage = getLastUserMessage(messages)?.toLowerCase() || ''
    const createdItems = determineRequestedItems(lastUserMessage, lowerResponse)
    
    console.log('🎯 Detected explicit creation of ' + createdItems.length + ' items:', createdItems.map(i => i.type))
    return createdItems
    
  } catch (error) {
    console.error('🔥 Error in detectExplicitCreationIntent:', {
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    })
    return []
  }
}

// Enhanced context extraction for company information
function extractCompanyContext(conversationText: string): { name: string, context: string[], confidence: number } {
  console.log('🔍 Extracting company context from:', conversationText.substring(0, 200) + '...')
  
  // Enhanced patterns for company name detection
  const companyPatterns = [
    // Direct mentions
    /(?:We're |We are |I'm from |I work at |Our company is |My startup is |company called |I represent )([A-Z][a-zA-Z0-9\s&.-]{1,40})/i,
    /([A-Z][a-zA-Z0-9&.-]{2,25})(?:\s+(?:Inc|LLC|Corp|Corporation|Ltd|Limited|Company))?\s+(?:is|are|helps|provides|offers|builds|develops|creates)/i,
    // Context-based extraction
    /(?:at |for )([A-Z][a-zA-Z0-9\s&.-]{2,25})(?:\s+we|\s+I|\s+our|,\s+we|,\s+I)/i
  ]
  
  let companyName = 'Your Company'
  let confidence = 0
  const contextClues: string[] = []
  
  // Try company patterns
  for (const pattern of companyPatterns) {
    const match = conversationText.match(pattern)
    if (match && match[1]) {
      const candidate = match[1].trim().replace(/\s+/g, ' ')
      // Validate it's actually a company name (not common words)
      if (!/^(The|Our|We|My|This|It|And|But|I|User|Assistant|Company|Business|Startup)$/i.test(candidate)) {
        companyName = candidate
        confidence = 0.8
        contextClues.push(`Direct mention: "${match[0].trim()}"`)
        console.log(`🏢 Found company name with high confidence: ${candidate}`)
        break
      }
    }
  }
  
  // Extract additional context clues
  const industryWords = conversationText.match(/(?:we|our|the)\s+(company|startup|business|firm|organization|team)\s+(?:is|does|focuses|specializes|works)/gi)
  if (industryWords) {
    contextClues.push(...industryWords.map(w => `Industry context: ${w}`))
  }
  
  // Look for business context
  const businessContext = conversationText.match(/(?:we|our)\s+(?:product|service|platform|solution|technology|app|software)\s+(?:helps|enables|allows|provides)/gi)
  if (businessContext) {
    contextClues.push(...businessContext.map(w => `Business context: ${w}`))
  }
  
  return {
    name: companyName,
    context: contextClues,
    confidence
  }
}

// Enhanced product/service extraction
function extractProductContext(conversationText: string): { name: string, type: string, features: string[], confidence: number } {
  console.log('🔍 Extracting product context from conversation')
  
  const productPatterns = [
    /(?:launching |building |creating |developing |product called |our product |platform called |service called |app called |tool called )([A-Z][a-zA-Z0-9\s.-]{1,30})/i,
    /([A-Z][a-zA-Z0-9.-]{2,25})\s+(?:is|helps|enables|allows|provides|delivers|offers)/i,
    /(?:our|the)\s+([a-zA-Z0-9\s.-]{3,25})\s+(?:platform|product|service|solution|app|tool|software)/i
  ]
  
  let productName = 'our solution'
  let productType = 'solution'
  let confidence = 0
  const features: string[] = []
  
  // Extract product name
  for (const pattern of productPatterns) {
    const match = conversationText.match(pattern)
    if (match && match[1]) {
      const candidate = match[1].trim().replace(/\s+/g, ' ')
      if (!/^(the|our|my|this|it|and|but|solution|product|platform|service)$/i.test(candidate)) {
        productName = candidate
        confidence = 0.7
        console.log(`📦 Found product name: ${candidate}`)
        break
      }
    }
  }
  
  // Determine product type
  const typePatterns = {
    'AI platform': /\b(?:AI|artificial intelligence|machine learning|ML)\b.*(?:platform|solution|tool)/i,
    'software platform': /\b(?:software|platform|SaaS|application|app)\b/i,
    'mobile app': /\b(?:mobile|app|application|iOS|Android)\b/i,
    'web service': /\b(?:web|online|service|API|cloud)\b/i,
    'hardware product': /\b(?:device|hardware|product|gadget)\b/i
  }
  
  for (const [type, pattern] of Object.entries(typePatterns)) {
    if (pattern.test(conversationText)) {
      productType = type
      break
    }
  }
  
  // Extract key features
  const featurePatterns = [
    /(?:helps|enables|allows)\s+(?:users?|customers?|businesses?)\s+(?:to\s+)?([a-z][a-z\s]{10,50})/gi,
    /(?:provides|offers|delivers)\s+([a-z][a-z\s]{10,40})/gi,
    /(?:can|will)\s+([a-z][a-z\s]{10,40})\s+(?:for|with|automatically)/gi
  ]
  
  for (const pattern of featurePatterns) {
    const matches = conversationText.matchAll(pattern)
    for (const match of matches) {
      if (match[1] && match[1].trim().length > 5) {
        features.push(match[1].trim())
      }
    }
  }
  
  return {
    name: productName,
    type: productType,
    features: features.slice(0, 5), // Limit to top 5 features
    confidence
  }
}

// Enhanced executive and team information extraction
function extractExecutiveContext(conversationText: string): { name: string, title: string, role: string, confidence: number } {
  console.log('🔍 Extracting executive context from conversation')
  
  const executivePatterns = [
    // Direct introductions
    /(?:I'm |I am |My name is |This is )([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:,?\s+(?:the\s+)?(?:CEO|CTO|CMO|CPO|founder|co-founder|president|director|VP|manager))?/i,
    // Title-first patterns
    /(?:CEO|CTO|CMO|CPO|founder|co-founder|president|director|VP|manager)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    // Name with title
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+),?\s+(?:is\s+)?(?:the\s+)?(?:CEO|CTO|CMO|CPO|founder|co-founder|president|director|VP|manager)/i
  ]
  
  const titlePatterns = {
    'CEO': /\b(?:CEO|chief executive|co-CEO)\b/i,
    'CTO': /\b(?:CTO|chief technology|technical director)\b/i,
    'CMO': /\b(?:CMO|chief marketing|marketing director)\b/i,
    'CPO': /\b(?:CPO|chief product|product director)\b/i,
    'Founder': /\b(?:founder|co-founder|founding|started|founded)\b/i,
    'President': /\bpresident\b/i,
    'Director': /\bdirector\b/i,
    'VP': /\b(?:VP|vice president)\b/i
  }
  
  let executiveName = 'Leadership Team'
  let executiveTitle = 'CEO'
  let executiveRole = 'spokesperson'
  let confidence = 0
  
  // Try to find executive name
  for (const pattern of executivePatterns) {
    const match = conversationText.match(pattern)
    if (match && match[1]) {
      const candidate = match[1].trim()
      // Validate it's actually a person's name
      if (!/^(The|Our|We|My|This|It|Company|Business|Team)$/i.test(candidate) && candidate.includes(' ')) {
        executiveName = candidate
        confidence = 0.8
        console.log(`👤 Found executive name: ${candidate}`)
        break
      }
    }
  }
  
  // Determine title
  for (const [title, pattern] of Object.entries(titlePatterns)) {
    if (pattern.test(conversationText)) {
      executiveTitle = title
      confidence = Math.max(confidence, 0.6)
      break
    }
  }
  
  // Determine role context
  if (conversationText.includes('I') || conversationText.includes('my')) {
    executiveRole = 'first-person spokesperson'
  } else {
    executiveRole = 'company representative'
  }
  
  return {
    name: executiveName,
    title: executiveTitle,
    role: executiveRole,
    confidence
  }
}

// Generate content with context from conversation
function generateContent(type: string, context: any) {
  try {
    console.log('🎨 Starting generateContent:', {
      type,
      hasContext: !!context,
      contextKeys: context ? Object.keys(context) : []
    })
    
    const messages = context?.messages || []
    const userMessage = context?.userMessage || ''
    const conversationText = messages.map(m => m.content || '').join(' ') + ' ' + userMessage
    
    console.log('📝 Building conversation text:', {
      messageCount: messages.length,
      userMessageLength: userMessage.length,
      conversationTextLength: conversationText.length
    })
    
    // Extract enhanced context from conversation
    const companyContext = extractCompanyContext(conversationText)
    const productContext = extractProductContext(conversationText)
    const executiveContext = extractExecutiveContext(conversationText)
    
    // Use extracted context with fallbacks
    const companyName = companyContext.name
    const productName = productContext.name
    const executive = { name: executiveContext.name, title: executiveContext.title }
    
    console.log('🎯 Extracted enhanced context:', { 
      company: { name: companyName, confidence: companyContext.confidence, clues: companyContext.context.length },
      product: { name: productName, type: productContext.type, confidence: productContext.confidence },
      executive: { name: executive.name, title: executive.title, confidence: executiveContext.confidence }
    })
    
    // Extract key information from conversation with more detail
    const hasAI = conversationText.toLowerCase().includes('ai')
    const hasProduct = conversationText.toLowerCase().includes('product')
    const hasLaunch = conversationText.toLowerCase().includes('launch')
    const hasStartup = conversationText.toLowerCase().includes('startup')
    const hasFunding = conversationText.toLowerCase().includes('funding') || conversationText.toLowerCase().includes('series')
    const hasEnterprise = conversationText.toLowerCase().includes('enterprise') || conversationText.toLowerCase().includes('b2b')
    const hasConsumer = conversationText.toLowerCase().includes('consumer') || conversationText.toLowerCase().includes('b2c')
    const hasCrisis = conversationText.toLowerCase().includes('crisis') || conversationText.toLowerCase().includes('emergency')
    
    console.log(`📊 Generating ${type} content with context:`, {
      hasAI,
      hasProduct, 
      hasLaunch,
      hasStartup,
      hasFunding,
      hasEnterprise,
      hasConsumer,
      hasCrisis,
      messageCount: messages.length
    })
    
    switch(type) {
    case 'media-list':
      return {
        title: hasAI ? 'AI Technology Media Plan' : 'Strategic Media Plan',
        description: 'Targeted outreach strategy for your announcement',
        totalContacts: 25,
        journalists: [
          {
            name: 'Kara Swisher',
            outlet: 'New York Magazine',
            beat: 'Technology & Business',
            tier: '1',
            email: 'contact@example.com',
            relevance: 'Covers major tech announcements and industry shifts',
            recentCoverage: 'AI regulation and startup ecosystem',
            pitchAngle: 'Industry transformation angle'
          },
          {
            name: 'Casey Newton',
            outlet: 'Platformer',
            beat: 'Tech Platforms & AI',
            tier: '1', 
            email: 'contact@example.com',
            relevance: 'Deep coverage of AI development and platform changes',
            recentCoverage: 'AI tools and their impact on work',
            pitchAngle: 'Future of work perspective'
          },
          {
            name: 'Alex Konrad',
            outlet: 'Forbes',
            beat: 'Startups & Venture Capital',
            tier: '1',
            email: 'contact@example.com',
            relevance: 'Covers funding rounds and startup launches',
            recentCoverage: 'AI startup funding trends',
            pitchAngle: 'Business growth and funding story'
          },
          {
            name: 'Cade Metz',
            outlet: 'New York Times',
            beat: 'AI & Technology',
            tier: '1',
            email: 'contact@example.com',
            relevance: 'Leading voice on AI development',
            recentCoverage: 'Enterprise AI adoption',
            pitchAngle: 'Technical innovation angle'
          },
          {
            name: 'Will Knight',
            outlet: 'WIRED',
            beat: 'AI & Emerging Tech',
            tier: '1',
            email: 'contact@example.com',
            relevance: 'Technical deep dives on AI',
            recentCoverage: 'AI capabilities and limitations',
            pitchAngle: 'Technical breakthrough story'
          }
        ],
        categories: {
          tier1: ['Kara Swisher', 'Casey Newton', 'Alex Konrad'],
          trade: ['VentureBeat', 'TechCrunch', 'The Information'],
          regional: ['Local tech reporters'],
          influencers: ['Industry analysts', 'Tech podcasters']
        }
      }
    
    case 'strategy-plan':
      return {
        title: hasLaunch ? 'Product Launch Strategic Plan' : 'Strategic Communications Plan',
        objective: 'Drive awareness and adoption through strategic PR campaign',
        duration: '6 weeks',
        milestones: [
          {
            week: 1,
            phase: 'Foundation',
            task: 'Message Development & Asset Creation',
            details: 'Finalize positioning, create core materials',
            deliverables: ['Key messages', 'Press release', 'Media kit'],
            owner: 'PR Team',
            status: 'pending',
            budget: '$10,000'
          },
          {
            week: 2,
            phase: 'Pre-Launch',
            task: 'Media Outreach & Relationship Building',
            details: 'Warm up tier-1 media, schedule briefings',
            deliverables: ['Media list', 'Pitch emails', 'Briefing deck'],
            owner: 'PR Lead',
            status: 'pending',
            budget: '$5,000'
          },
          {
            week: 3,
            phase: 'Pre-Launch',
            task: 'Embargo Briefings',
            details: 'Conduct exclusive briefings with top media',
            deliverables: ['Completed briefings', 'Embargo agreements'],
            owner: 'Executive Team',
            status: 'pending',
            budget: '$8,000'
          },
          {
            week: 4,
            phase: 'Launch',
            task: 'Launch Day Execution',
            details: 'Coordinate announcement across all channels',
            deliverables: ['Press release distribution', 'Social activation'],
            owner: 'Full Team',
            status: 'pending',
            budget: '$15,000'
          },
          {
            week: 5,
            phase: 'Post-Launch',
            task: 'Momentum Building',
            details: 'Follow-up stories, customer features',
            deliverables: ['Follow-up pitches', 'Case studies'],
            owner: 'Content Team',
            status: 'pending',
            budget: '$7,000'
          },
          {
            week: 6,
            phase: 'Analysis',
            task: 'Results & Optimization',
            details: 'Analyze coverage, gather insights',
            deliverables: ['Coverage report', 'Lessons learned'],
            owner: 'Analytics Team',
            status: 'pending',
            budget: '$5,000'
          }
        ],
        keyMessages: {
          primary: 'Revolutionary solution that transforms how businesses operate',
          supporting: [
            'Proven ROI with measurable results',
            'Easy integration with existing systems',
            'Trusted by industry leaders'
          ],
          audienceSpecific: {
            executives: 'Strategic advantage and competitive differentiation',
            technical: 'Advanced capabilities with simple implementation',
            customers: 'Immediate value and long-term benefits'
          }
        },
        successMetrics: {
          reach: '5M impressions',
          coverage: '15 tier-1 stories',
          engagement: '25K social interactions',
          conversions: '500 qualified leads'
        }
      }
    
    case 'content-draft':
      const headline = hasAI ? 
        `${companyName} Launches ${productName} AI Platform to Transform Business Operations` :
        hasFunding ? `${companyName} Raises Funding to Accelerate Growth` :
        hasProduct ? `${companyName} Unveils ${productName} Next-Generation Solution` :
        `${companyName} Announces ${productName} Revolutionary Solution`
      
      const subheadline = hasEnterprise ?
        `${productName} delivers measurable ROI and seamless integration for enterprise clients` :
        hasConsumer ?
        `${productName} empowers users with breakthrough capabilities` :
        `${productName} delivers immediate ROI while reducing complexity`
      
      return {
        title: 'Press Release',
        type: 'press_release',
        headline: headline,
        subheadline: subheadline,
        dateline: 'SAN FRANCISCO, CA',
        body: `FOR IMMEDIATE RELEASE

${headline}
${subheadline}

SAN FRANCISCO, CA – ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${companyName} today announced the launch of ${productName}, a groundbreaking solution that transforms how businesses operate. This innovation addresses critical industry challenges and delivers immediate, measurable results.

"We're excited to introduce ${productName} to the market," said ${executive.name}, ${executive.title} at ${companyName}. "Our solution represents a fundamental shift in how organizations approach their biggest challenges."

Key features and benefits include:
• Immediate ROI: Customers see results within weeks
• Seamless Integration: Works with existing systems
• Proven Results: Validated by early adopters
• Scalable Solution: Grows with your business

${companyName} has worked closely with early customers to ensure ${productName} delivers real value from day one.

"The results speak for themselves," added ${executive.name}. "${productName} isn't just another tool – it's a transformative solution that delivers immediate value."

The solution is available immediately. Early adopters have reported significant improvements in efficiency and performance.

About ${companyName}
${companyName} is dedicated to helping organizations achieve their goals through innovative technology solutions. The company combines deep industry expertise with cutting-edge technology to deliver measurable results.

For more information, visit ${companyName.toLowerCase().replace(/\s+/g, '')}.com or contact:

Media Contact:
${executive.name}
${executive.title}
${companyName}
press@${companyName.toLowerCase().replace(/\s+/g, '')}.com
(415) 555-1234
${companyName.toLowerCase().replace(/\s+/g, '')}.com

###`,
        metadata: {
          wordCount: 350,
          readingTime: '2.5 min',
          tone: 'professional',
          targetAudience: 'media',
          distribution: 'PR Newswire, Business Wire',
          embargo: 'None',
          assets: ['High-res logo', 'Executive headshot', 'Product screenshots']
        }
      }
    
    case 'key-messaging':
      return {
        title: 'Key Messaging Framework',
        description: 'Core messages and positioning for all communications',
        elevator_pitch: hasAI ?
          'We\'re transforming how businesses operate with AI that actually works - delivering measurable ROI in weeks, not years.' :
          'We\'re solving [industry\'s biggest challenge] with a solution that\'s both powerful and surprisingly simple to implement.',
        primary_message: {
          headline: 'Revolutionary Technology, Real Results',
          supporting: 'Our platform delivers immediate value while setting the foundation for long-term transformation'
        },
        key_messages: [
          {
            theme: 'Innovation',
            message: 'Breakthrough technology that leapfrogs current solutions',
            proof_points: [
              'First to market with [specific capability]',
              'Patent-pending approach to [problem]',
              'Validated by leading [industry] experts'
            ]
          },
          {
            theme: 'Value',
            message: 'Immediate ROI with long-term strategic advantage',
            proof_points: [
              'Average ROI of 300% in first year',
              'Reduces operational costs by 40%',
              'Implementation in weeks, not months'
            ]
          },
          {
            theme: 'Trust',
            message: 'Proven solution trusted by industry leaders',
            proof_points: [
              'Used by Fortune 500 companies',
              'SOC 2 Type II certified',
              '99.99% uptime SLA'
            ]
          }
        ],
        audience_messages: {
          executives: 'Strategic advantage that drives competitive differentiation and growth',
          technical: 'Elegant architecture that integrates seamlessly with existing infrastructure',
          customers: 'Finally, a solution that just works - no complexity, just results',
          investors: 'Massive market opportunity with proven product-market fit and scalable model',
          media: 'The story of how one company is reshaping an entire industry'
        },
        differentiators: [
          'Only solution that [unique capability]',
          '10x faster than alternatives',
          'No implementation or training required',
          'Predictable, transparent pricing'
        ],
        avoid_phrases: [
          'Cutting-edge',
          'Synergy',
          'Best-in-class',
          'Thought leader'
        ]
      }
    
    case 'social-content':
      // Define missing variables for social content
      const targetAudience = hasEnterprise ? 'enterprise teams' : hasConsumer ? 'consumers' : 'businesses'
      const valueProp = hasAI ? 'harness AI for better outcomes' : 'streamline operations'
      const industry = hasAI ? 'technology' : hasEnterprise ? 'enterprise' : 'business'
      const metrics = [
        '40% improvement in efficiency',
        '60% faster deployment',
        '3x ROI in first year'
      ]
      
      return {
        title: `${companyName} Social Media Content Package`,
        description: `Ready-to-post content for ${productName} announcement across all platforms`,
        twitter_thread: [
          {
            tweet: 1,
            content: `🚀 Big news! ${companyName} is launching ${productName} to help ${targetAudience} ${valueProp}.\n\nHere's why this matters for ${industry}: 🧵`,
            media: `${companyName.toLowerCase()}_hero_image.jpg`
          },
          {
            tweet: 2,
            content: `The challenge: ${targetAudience} in ${industry} struggle with inefficient processes and outdated solutions.\n\nThis costs the industry billions annually and the problem is getting worse.`
          },
          {
            tweet: 3,
            content: `Our solution: ${productName} ${valueProp} through innovative technology.\n\n✅ ${metrics[0] || 'Immediate results'}\n✅ ${metrics[1] || 'Easy implementation'}\n✅ ${metrics[2] || 'Proven ROI'}`
          },
          {
            tweet: 4,
            content: `Early results from ${targetAudience} are incredible:\n\n📈 ${metrics[0] || 'Significant performance gains'}\n⏱️ ${metrics[1] || 'Faster implementation'}\n💰 ${metrics[2] || 'Measurable cost savings'}`
          },
          {
            tweet: 5,
            content: `Join forward-thinking ${targetAudience} who are already seeing results with ${productName}.\n\nLearn more: ${companyName.toLowerCase().replace(/\s+/g, '')}.com\n\n#${industry.replace(/\s+/g, '')} #Innovation #${companyName.replace(/\s+/g, '')}`
          }
        ],
        linkedin_post: {
          content: `🎆 Exciting Announcement from ${companyName}!

After months of development and testing with select ${targetAudience}, we're thrilled to announce ${productName}.

🎯 The Challenge:
${targetAudience} in ${industry} need better solutions to ${valueProp}. Current approaches are slow, expensive, and don't deliver the results modern businesses need.

💡 Our Solution:
${productName} transforms how ${targetAudience} approach ${industry} challenges. Built specifically for modern needs, it delivers immediate value while scaling for growth.

📊 Early Results:
• ${metrics[0] || 'Significant performance improvements'}
• ${metrics[1] || 'Faster implementation times'}
• ${metrics[2] || 'Measurable ROI within weeks'}

What makes ${productName} different? It's built by ${industry} experts specifically for ${targetAudience}, not adapted from generic solutions.

We're grateful to our early customers and partners who helped shape ${productName}. Their feedback has been invaluable.

🔗 Learn more: ${companyName.toLowerCase().replace(/\s+/g, '')}.com

What challenges are you facing in ${industry}? Let's discuss in the comments.

#${industry.replace(/\s+/g, '')} #Innovation #BusinessTransformation #${companyName.replace(/\s+/g, '')}`,
          media: `${companyName.toLowerCase()}_announcement_graphic.jpg`,
          hashtags: [`#${industry.replace(/\s+/g, '')}`, '#Innovation', '#BusinessTransformation', `#${companyName.replace(/\s+/g, '')}`]
        },
        instagram_post: {
          caption: `Game changer alert! 🚀 ${companyName} just launched ${productName} for ${targetAudience}. ${valueProp} has never been easier. Learn more at link in bio. #${industry.replace(/\s+/g, '')} #Innovation #${companyName.replace(/\s+/g, '')}`,
          image_alt_text: `${productName} announcement graphic highlighting key benefits for ${targetAudience}`
        },
        platform_specific: {
          twitter: {
            bio_update: `${companyName} helps ${targetAudience} ${valueProp} with ${productName}. Now available! 🚀`,
            pinned_tweet: `🚀 ${productName} is here! ${companyName} is transforming ${industry} for ${targetAudience}. Learn more: ${companyName.toLowerCase().replace(/\s+/g, '')}.com`
          },
          linkedin_company: {
            status_update: `${companyName} launches ${productName} to transform ${industry}`,
            employee_advocacy: `Excited to share that ${companyName} has launched ${productName}! Proud to be part of a team that's transforming ${industry} for ${targetAudience}.`
          }
        }
      }
    
    case 'pitch-templates':
      return {
        title: 'Pitch Email Templates',
        description: 'Customized templates for journalist outreach',
        templates: [
          {
            tier: 'Tier 1 - Exclusive',
            subject: 'Exclusive: [Company] Announces [Newsworthy Development]',
            body: `Hi [First Name],
            
I hope you're doing well. I wanted to reach out exclusively to share some news from [Company] that I believe would be perfect for [Publication].

[Key newsworthy hook - one sentence that grabs attention]

Given your recent coverage of [specific recent article/topic], I thought this would be particularly relevant for your readers. We're announcing [brief description] that [key benefit/impact].

Key highlights:
• [Bullet point 1 with specific metric]
• [Bullet point 2 with proof point]
• [Bullet point 3 with industry relevance]

I'd be happy to provide additional details, arrange an interview with [Executive Name], or share early access to [asset]. Would you be interested in learning more?

Looking forward to hearing from you.

Best,
[Your Name]`,
            when_to_use: 'Major announcements for top-tier publications'
          },
          {
            tier: 'Tier 2 - General',
            subject: '[Company] [Action]: [Newsworthy Element]',
            body: `Hi [First Name],

I wanted to share news about [Company] that would be a great fit for [Publication] readers.

[Brief newsworthy statement with key impact/benefit]

This is significant because [industry context/why it matters now]. [Company] is [brief company description] and this development [specific value/impact].

Happy to provide more details or arrange an interview. Press release and additional resources are attached.

Best,
[Your Name]`,
            when_to_use: 'Standard announcements for trade publications'
          },
          {
            tier: 'Follow-up',
            subject: 'Following up: [Previous Subject]',
            body: `Hi [First Name],

Following up on my email from [date] regarding [Company]'s [announcement]. I wanted to check if this might be of interest for an upcoming story.

Quick reminder: [One sentence summary of news]

Since I last wrote, [new development/additional context]. Would you like to connect for a brief conversation about this?

Best,
[Your Name]`,
            when_to_use: 'Following up on initial pitches after 3-5 days'
          }
        ]
      }
    
    case 'executive-briefing':
      return {
        title: 'Executive Briefing Document',
        description: 'Talking points for spokesperson preparation',
        key_messages: {
          opening_statement: 'We\'re excited to share how [Company] is [main value proposition]. This represents [significance/impact].',
          vision_statement: 'Our vision is to [long-term goal] by [approach/methodology].',
          differentiation: 'What sets us apart is [key differentiator]. Unlike competitors who [old way], we [new way].'
        },
        anticipated_questions: [
          {
            category: 'Product/Technology',
            questions: [
              {
                q: 'How does your solution work?',
                a: '[Simple explanation]. The key innovation is [unique aspect] which allows [specific benefit].',
                key_points: ['Technical advantage', 'User benefit', 'Proof point']
              },
              {
                q: 'What makes you different from competitors?',
                a: 'While others focus on [competitor approach], we [unique approach]. This delivers [specific advantages].',
                key_points: ['Unique positioning', 'Competitive advantage', 'Market validation']
              }
            ]
          },
          {
            category: 'Business Model',
            questions: [
              {
                q: 'What\'s your go-to-market strategy?',
                a: 'We\'re targeting [primary market] through [distribution strategy]. Our focus is [specific approach].',
                key_points: ['Target market', 'Distribution channels', 'Success metrics']
              },
              {
                q: 'How do you make money?',
                a: 'Our revenue model is [model description]. We see strong unit economics with [key metrics].',
                key_points: ['Revenue streams', 'Pricing strategy', 'Growth trajectory']
              }
            ]
          }
        ],
        difficult_questions: [
          {
            q: 'What are your biggest challenges?',
            approach: 'Acknowledge honestly but pivot to solutions',
            suggested_answer: 'Like any [industry] company, we face [challenge]. We\'re addressing this by [solution/strategy].',
            follow_up_points: ['Proactive approach', 'Progress made', 'Future outlook']
          }
        ],
        media_dos_and_donts: {
          dos: [
            'Stay on message with key themes',
            'Use concrete examples and proof points',
            'Bridge back to core value proposition',
            'Be authentic and conversational'
          ],
          donts: [
            'Get pulled into speculation about competitors',
            'Share confidential financial information',
            'Make promises about future features',
            'Use jargon without explanation'
          ]
        }
      }
    
    case 'faq-document':
      return {
        title: 'FAQ Document',
        description: 'Comprehensive Q&A for internal and external use',
        categories: [
          {
            category: 'Product & Technology',
            questions: [
              {
                q: 'What exactly does your product do?',
                a: 'Our platform [core functionality in 2-3 sentences]. This enables [key benefit].'
              },
              {
                q: 'How is this different from existing solutions?',
                a: 'Unlike traditional approaches that [old way], we [new way]. This results in [specific improvements with metrics].'
              },
              {
                q: 'What technology stack do you use?',
                a: 'We\'ve built our platform on [tech stack], chosen specifically for [reasons]. This ensures [benefits].'
              },
              {
                q: 'Is the platform secure?',
                a: 'Yes. We maintain [security certifications] and implement [security measures]. All data is [encryption/protection details].'
              }
            ]
          },
          {
            category: 'Business & Pricing',
            questions: [
              {
                q: 'How much does it cost?',
                a: 'We offer flexible pricing based on [pricing model]. Most customers see ROI within [timeframe]. Contact us for a customized quote.'
              },
              {
                q: 'Who are your typical customers?',
                a: 'We serve [customer profile], particularly those who [specific needs]. Our sweet spot is [ideal customer description].'
              },
              {
                q: 'Do you offer a free trial?',
                a: 'Yes, we offer a [trial length] trial with [what\'s included]. No credit card required.'
              }
            ]
          },
          {
            category: 'Implementation & Support',
            questions: [
              {
                q: 'How long does implementation take?',
                a: 'Typical implementation takes [timeframe]. We provide [support details] to ensure smooth onboarding.'
              },
              {
                q: 'What kind of support do you provide?',
                a: 'We offer [support tiers] including [specific support features]. Our average response time is [metric].'
              },
              {
                q: 'Do you integrate with other tools?',
                a: 'Yes, we integrate with [integration categories]. See our full list at [link].'
              }
            ]
          }
        ],
        internal_only: [
          {
            q: 'How do we handle competitive questions?',
            a: 'Position as [positioning strategy]. Emphasize [key differentiators] without disparaging competitors.'
          },
          {
            q: 'What if asked about future features?',
            a: 'Say: "We\'re constantly improving based on customer feedback. I\'ll share your interest with our product team."'
          }
        ]
      }
      
    default:
      return {
        title: `Generated ${type}`,
        content: 'Content generated based on conversation context',
        description: 'Custom material created from conversation insights'
      }
  }
  } catch (error) {
    console.error('❌ Error in generateContent:', {
      type,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    })
    
    // Return minimal fallback content
    return {
      title: `${type} Document`,
      description: 'Generated content',
      content: 'Content generation encountered an issue. Please try again.'
    }
  }
}

// Helper to get the last user message from conversation
function getLastUserMessage(messages: any[]) {
  // Find the most recent user message
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.type === 'user') {
      return messages[i]?.content || ''
    }
  }
  return ''
}

// Helper to determine what items to create based on user request and Niv's response
function determineRequestedItems(userMessage: string, nivResponse: string) {
  const items = []
  
  // STRICT MAPPING: Only create what user explicitly requested AND Niv confirmed
  
  // Media Plan/List
  if ((userMessage.includes('media plan') || userMessage.includes('media list') || userMessage.includes('journalist')) &&
      (nivResponse.includes('media plan') || nivResponse.includes('media list') || nivResponse.includes('journalist'))) {
    items.push({
      type: 'media-list',
      title: 'Strategic Media Plan',
      description: 'Targeted journalists and outreach strategy'
    })
  }
  
  // Press Release
  if (userMessage.includes('press release') && nivResponse.includes('press release')) {
    items.push({
      type: 'content-draft',
      title: 'Press Release', 
      description: 'Professional announcement ready for distribution'
    })
  }
  
  // Strategic Plan
  if ((userMessage.includes('strategic plan') || userMessage.includes('communications plan') || userMessage.includes('strategy')) &&
      (nivResponse.includes('strategic plan') || nivResponse.includes('strategy'))) {
    items.push({
      type: 'strategy-plan',
      title: 'Strategic Communications Plan',
      description: 'Comprehensive PR strategy with timeline and tactics'
    })
  }
  
  // Key Messaging
  if ((userMessage.includes('messaging') || userMessage.includes('talking points')) &&
      (nivResponse.includes('messaging') || nivResponse.includes('talking points'))) {
    items.push({
      type: 'key-messaging',
      title: 'Key Messaging Framework',
      description: 'Core messages and talking points'
    })
  }
  
  // Social Media Content
  if (userMessage.includes('social') && nivResponse.includes('social')) {
    items.push({
      type: 'social-content',
      title: 'Social Media Content',
      description: 'Ready-to-post social content'
    })
  }
  
  // FAQ Document
  if (userMessage.includes('faq') && nivResponse.includes('faq')) {
    items.push({
      type: 'faq-document',
      title: 'FAQ Document',
      description: 'Frequently asked questions and responses'
    })
  }
  
  // REMOVED: No fallback "everything" creation - user must be specific
  
  return items
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log request details for debugging
    console.log('🔍 Niv Orchestrator request:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    })

    const requestBody = await req.json()
    let { message, messages = [], context = {}, mode = 'strategic_orchestration' } = requestBody
    
    // Validate and correct messages array
    if (!Array.isArray(messages)) {
      console.error('❌ Messages is not an array:', typeof messages)
      messages = []
      console.log('📝 Corrected to empty messages array')
    }
    
    console.log('🔥 Niv Orchestrator received:', { 
      message, 
      messagesCount: messages.length,
      messagesTypes: messages.map(m => m.type || 'unknown'),
      mode,
      hasAPIKey: !!ANTHROPIC_API_KEY,
      apiKeyLength: ANTHROPIC_API_KEY?.length || 0,
      requestBodyKeys: Object.keys(requestBody)
    })
    
    // Get Niv's conversational response with consultation mode
    let claudeResponse: any = ''
    
    console.log('🔍 Step 1: Preparing to call Claude API')
    
    if (ANTHROPIC_API_KEY) {
      console.log('✅ API Key found, calling Claude')
      claudeResponse = await callClaude(messages, message)
      console.log('📝 Claude response received:', {
        responseLength: claudeResponse?.length || 0,
        responsePreview: claudeResponse?.substring(0, 100) + '...'
      })
    } else {
      console.error('❌ No ANTHROPIC_API_KEY, using fallback')
      claudeResponse = generateFallbackResponse(message)
    }
    
    const response = claudeResponse
    const consultationMode = classifyConsultationIntent(message, messages)
    
    console.log('🔍 Step 2: Consultation mode classification')
    console.log(`🎯 Consultation Mode: ${consultationMode}`)
    
    // Check if Niv is explicitly creating something (only in appropriate modes)
    console.log('🔍 Step 3: Detecting creation intent')
    let creationIntents = detectExplicitCreationIntent(response, messages, consultationMode)
    console.log('📋 Creation intents detected:', creationIntents.length, creationIntents.map(i => i.type))
    
    // No fallback creation - trust the improved detection and system prompt
    
    // Only generate work items if we detected explicit creation intent
    console.log('🔍 Step 4: Generating work items')
    console.log(`📊 Creation intents found: ${creationIntents.length}`)
    
    if (creationIntents.length === 0) {
      console.log('🚫 No creation intents detected - NOT generating any work items')
    }
    
    // NO FALLBACK TEMPLATES - Only use Niv's actual generated content
    const workItems = []
    
    // Extract actual content from Niv's response
    if (creationIntents.length > 0 && response.length > 100) {
      console.log('🔍 Attempting to extract Niv\'s actual generated content...')
      
      // Try to extract structured content from Niv's response
      for (const intent of creationIntents) {
        const extractedContent = extractNivGeneratedContent(response, intent.type)
        
        if (extractedContent) {
          console.log(`✅ Extracted actual ${intent.type} content from Niv's response`)
          workItems.push({
            ...intent,
            generatedContent: extractedContent
          })
        } else {
          console.log(`⚠️ Could not extract ${intent.type} - Niv's content remains in chat only`)
        }
      }
      
      if (workItems.length === 0) {
        console.log('💡 No artifacts created - Niv\'s content is available in the chat response')
      }
    }
    
    const result = {
      response,
      workItems: workItems,
      context: {
        ...context,
        conversationLength: messages.length + 1
      }
    }
    
    console.log('✅ Niv responding:', { 
      responseLength: response.length,
      workItemsCount: workItems.length,
      workItemTypes: workItems.map(w => w.type)
    })
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('❌ Niv Orchestrator error:', error)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        errorType: error.name,
        stack: error.stack,
        response: "I apologize, I encountered an issue. Let me try to help you another way. What PR challenge are you working on?",
        workItems: []
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200 // Change to 200 to avoid CORS issues
      }
    )
  }
})