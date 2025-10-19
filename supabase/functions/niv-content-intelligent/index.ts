import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

/**
 * NIV Content Intelligent - Strategic Content Consultant
 *
 * Built using NIV Strategic Framework's approach:
 * - Full conversation awareness
 * - User preference extraction
 * - Discovery context building
 * - Rich Claude prompts
 * - Intelligent type detection
 * - Research integration
 * - Orchestration awareness
 */

// Content type routing map
const CONTENT_ROUTING = {
  'image': { service: 'vertex-ai-visual', tool: 'generate_image' },
  'infographic': { service: 'vertex-ai-visual', tool: 'generate_image' },
  'social-graphics': { service: 'vertex-ai-visual', tool: 'generate_image' },
  'video': { service: 'vertex-ai-visual', tool: 'generate_video' },
  'presentation': { service: 'gamma-presentation', tool: 'generate_presentation' },
  'board-presentation': { service: 'gamma-presentation', tool: 'generate_presentation' },
  'press-release': { service: 'mcp-content', tool: 'press-release' },
  'blog-post': { service: 'mcp-content', tool: 'blog-post' },
  'thought-leadership': { service: 'mcp-content', tool: 'thought-leadership' },
  'case-study': { service: 'mcp-content', tool: 'case-study' },
  'white-paper': { service: 'mcp-content', tool: 'white-paper' },
  'social-post': { service: 'mcp-content', tool: 'social-post' },
  'email': { service: 'mcp-content', tool: 'email-campaign' },
  'executive-statement': { service: 'mcp-content', tool: 'executive-statement' },
  'media-pitch': { service: 'mcp-content', tool: 'media-pitch' },
  'twitter-thread': { service: 'mcp-content', tool: 'social-post' },
  'linkedin-article': { service: 'mcp-content', tool: 'thought-leadership' }
}

// Type aliases for natural language
const TYPE_ALIASES: Record<string, string> = {
  'social media post': 'social-post',
  'social post': 'social-post',
  'tweet': 'twitter-thread',
  'image': 'image',
  'picture': 'image',
  'visual': 'image',
  'graphic': 'social-graphics',
  'video': 'video',
  'presentation': 'presentation',
  'deck': 'presentation',
  'press release': 'press-release',
  'article': 'blog-post',
  'blog': 'blog-post',
  'thought leadership': 'thought-leadership',
  'white paper': 'white-paper',
  'email': 'email',
  'statement': 'executive-statement'
}

// Multi-step orchestration packages
const ORCHESTRATION_PACKAGES = {
  'media-plan': {
    name: 'Media Plan',
    components: ['press-release', 'media-list', 'media-pitch', 'qa-document', 'talking-points', 'social-post', 'email'],
    description: '7-piece media launch package',
    requiresStrategy: true // Must build strategy before generating
  },
  'social-campaign': {
    name: 'Social Media Campaign',
    components: ['social-post', 'twitter-thread', 'linkedin-article', 'image', 'video'],
    description: 'Multi-channel social campaign'
  },
  'product-launch': {
    name: 'Product Launch',
    components: ['press-release', 'blog-post', 'social-post', 'email', 'presentation', 'qa-document'],
    description: 'Complete product launch package'
  },
  'content-package': {
    name: 'Content Package',
    components: [], // Will be determined dynamically
    description: 'Custom content package based on user needs'
  }
}

// Orchestration triggers - detect when user wants a package
const ORCHESTRATION_TRIGGERS = [
  'media plan',
  'pr campaign',
  'launch package',
  'social campaign',
  'social media plan',
  'content package',
  'full campaign',
  'complete package',
  'everything',
  'all content',
  'comprehensive'
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      message,
      contentType,
      conversationHistory = [],
      context = {},
      organizationContext,
      approved,
      awaitingWhat
    } = body

    console.log('📨 NIV Content Intelligent Request:', {
      message: message?.substring(0, 100),
      contentType,
      conversationHistoryLength: conversationHistory.length,
      awaitingWhat,
      approved
    })

    // STEP 1: Build Discovery Context (like Strategic Framework)
    const discoveryContext = buildDiscoveryContext(
      organizationContext || context.organization,
      conversationHistory,
      context
    )

    console.log('🧠 Discovery Context Built:', {
      organization: discoveryContext.organization.name,
      userPreferences: {
        wants: discoveryContext.session.userPreferences.wants.length,
        doesNotWant: discoveryContext.session.userPreferences.doesNotWant.length
      }
    })

    // STEP 1.5: Detect if this is a multi-step orchestration request
    const orchestrationType = detectOrchestrationPackage(message, conversationHistory)

    if (orchestrationType) {
      console.log('🎼 Multi-step orchestration detected:', orchestrationType)

      // Handle orchestration package
      return await handleOrchestrationPackage(
        orchestrationType,
        message,
        conversationHistory,
        discoveryContext,
        awaitingWhat,
        approved
      )
    }

    // STEP 2: Intelligent Content Type Detection (like Strategic's intent detection)
    let targetType = contentType
    if (!targetType) {
      targetType = await detectContentTypeIntelligently(message, conversationHistory, discoveryContext)
      console.log('🎯 Detected content type:', targetType)
    }

    if (!targetType) {
      // Ask user what they want instead of erroring
      return new Response(JSON.stringify({
        success: true,
        mode: 'clarification',
        message: "I can create many types of content for you - social posts, images, press releases, articles, videos, presentations, and more. What would you like me to create?",
        suggestedTypes: ['social-post', 'image', 'blog-post', 'press-release']
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // STEP 3: Handle approval flow (if waiting for approval)
    if (awaitingWhat === 'approval' && approved) {
      console.log('✅ User approved - proceeding with generation')

      // Get stored understanding from last message
      const lastMessage = conversationHistory[conversationHistory.length - 1]
      const storedUnderstanding = lastMessage?.understanding

      if (storedUnderstanding) {
        const content = await generateContentWithFullContext(
          targetType,
          storedUnderstanding,
          discoveryContext,
          conversationHistory,
          message
        )

        return new Response(JSON.stringify({
          success: true,
          mode: 'content-generated',
          content: content,
          contentType: targetType,
          message: `Here's your ${targetType.replace('-', ' ')}!`,
          orchestration: buildOrchestration(targetType, content)
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // STEP 4: Use Claude to deeply understand the request (with FULL conversation context)
    console.log('🧠 Analyzing request with Claude...')

    const understanding = await analyzeRequestWithClaude(
      message,
      targetType,
      conversationHistory,
      discoveryContext
    )

    console.log('✅ Understanding:', understanding)

    // STEP 5: Check if we need to ask follow-up questions
    if (understanding.needsMoreInfo) {
      return new Response(JSON.stringify({
        success: true,
        mode: 'follow-up',
        message: understanding.followUpQuestions.join('\n\n'),
        awaitingResponse: true,
        understanding: understanding
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // STEP 6: Do research if needed (like Strategic Framework)
    let researchResults = {}
    if (understanding.knowledgeGaps && understanding.knowledgeGaps.length > 0) {
      console.log('📚 Conducting research on knowledge gaps...')
      researchResults = await conductResearch(understanding.knowledgeGaps, context)
    }

    // STEP 7: Present strategic brief and wait for approval
    const strategicBrief = await generateStrategicBrief(
      targetType,
      understanding,
      researchResults,
      discoveryContext,
      conversationHistory
    )

    console.log('📋 Strategic Brief:', strategicBrief)

    return new Response(JSON.stringify({
      success: true,
      mode: 'strategic-brief',
      message: strategicBrief,
      awaitingApproval: true,
      understanding: understanding,
      research: researchResults,
      contentType: targetType
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

// BUILD DISCOVERY CONTEXT (from Strategic Framework)
function buildDiscoveryContext(
  organizationContext: any,
  conversationHistory: any[],
  additionalContext: any
): any {
  console.log('📋 Building discovery context...')

  // Extract user preferences from entire conversation
  const userPreferences = extractUserPreferencesFromConversation(conversationHistory)

  const organization = {
    id: organizationContext?.id || organizationContext?.organizationId || 'default',
    name: organizationContext?.name || organizationContext?.organizationName || 'Organization',
    industry: organizationContext?.industry || 'technology',
    positioning: organizationContext?.positioning || 'Industry leader',
    strengths: organizationContext?.strengths || [],
    vulnerabilities: organizationContext?.vulnerabilities || [],
    currentNarratives: organizationContext?.narratives || []
  }

  const session = {
    conversationId: additionalContext?.conversationId || generateId(),
    userIntent: extractUserIntent(conversationHistory),
    previousDecisions: extractDecisions(conversationHistory),
    constraints: extractConstraints(conversationHistory),
    conversationHistory: conversationHistory,
    userPreferences: userPreferences,
    timestamp: new Date().toISOString()
  }

  return {
    organization,
    session,
    market: additionalContext?.market || {},
    competitors: additionalContext?.competitors || {},
    assets: {
      narratives: organization.currentNarratives,
      keyMessages: organizationContext?.keyMessages || [],
      channels: organizationContext?.channels || []
    }
  }
}

// EXTRACT USER PREFERENCES (from Strategic Framework)
function extractUserPreferencesFromConversation(conversationHistory: any[]): any {
  const preferences = {
    wants: [] as string[],
    doesNotWant: [] as string[],
    constraints: [] as string[],
    examples: [] as string[]
  }

  if (!conversationHistory || conversationHistory.length === 0) {
    return preferences
  }

  conversationHistory.forEach((msg: any) => {
    const content = (typeof msg.content === 'string' ? msg.content : msg.content?.text || '').toLowerCase()

    // Extract wants
    if (content.includes('i want') || content.includes('we need') || content.includes('looking for')) {
      const wantMatch = content.match(/(?:i want|we need|looking for)\s+([^.!?]+)/i)
      if (wantMatch) preferences.wants.push(wantMatch[1].trim())
    }

    // Extract doesn't wants
    if (content.includes("don't want") || content.includes('avoid') || content.includes('not interested')) {
      const dontWantMatch = content.match(/(?:don't want|avoid|not interested in)\s+([^.!?]+)/i)
      if (dontWantMatch) preferences.doesNotWant.push(dontWantMatch[1].trim())
    }

    // Extract constraints
    if (content.includes('must') || content.includes('requirement') || content.includes('constraint')) {
      const constraintMatch = content.match(/(?:must|requirement is|constraint is)\s+([^.!?]+)/i)
      if (constraintMatch) preferences.constraints.push(constraintMatch[1].trim())
    }

    // Extract examples
    if (content.includes('for example') || content.includes('like') || content.includes('such as')) {
      const exampleMatch = content.match(/(?:for example|like|such as)\s+([^.!?]+)/i)
      if (exampleMatch) preferences.examples.push(exampleMatch[1].trim())
    }
  })

  // Deduplicate
  preferences.wants = [...new Set(preferences.wants)]
  preferences.doesNotWant = [...new Set(preferences.doesNotWant)]
  preferences.constraints = [...new Set(preferences.constraints)]
  preferences.examples = [...new Set(preferences.examples)]

  return preferences
}

// INTELLIGENT CONTENT TYPE DETECTION
async function detectContentTypeIntelligently(
  message: string,
  conversationHistory: any[],
  discoveryContext: any
): Promise<string | null> {
  // First try aliases
  const messageLower = message.toLowerCase()
  for (const [alias, type] of Object.entries(TYPE_ALIASES)) {
    if (messageLower.includes(alias)) {
      return type
    }
  }

  // Check recent conversation for context
  const recentMessages = conversationHistory.slice(-5).map(m =>
    typeof m.content === 'string' ? m.content : m.content?.text || ''
  ).join(' ').toLowerCase()

  // Check if they're referring to previous content
  if (messageLower.includes('now') || messageLower.includes('also') || messageLower.includes('accompany')) {
    // They want something related to previous request
    if (messageLower.includes('image') || messageLower.includes('visual')) return 'image'
    if (messageLower.includes('post')) return 'social-post'
  }

  // Use Claude to detect if still unclear
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: `Based on this request, what type of content does the user want?

USER REQUEST: "${message}"

RECENT CONVERSATION:
${conversationHistory.slice(-3).map(m =>
  `${m.role === 'user' ? 'USER' : 'NIV'}: ${typeof m.content === 'string' ? m.content : m.content?.text || ''}`
).join('\n')}

Return ONLY one of these content types:
- social-post
- image
- video
- blog-post
- press-release
- thought-leadership
- presentation
- email

Return just the type name, nothing else.`
        }]
      })
    })

    if (response.ok) {
      const data = await response.json()
      const detectedType = data.content[0].text.trim().toLowerCase()
      if (CONTENT_ROUTING[detectedType]) {
        return detectedType
      }
    }
  } catch (error) {
    console.error('Type detection error:', error)
  }

  return null
}

// ANALYZE REQUEST WITH CLAUDE (with FULL context like Strategic)
async function analyzeRequestWithClaude(
  message: string,
  contentType: string,
  conversationHistory: any[],
  discoveryContext: any
): Promise<any> {
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
      messages: [{
        role: 'user',
        content: `You are NIV, a strategic PR consultant analyzing a content request.

COMPLETE CONVERSATION HISTORY (This shows what the user wants):
${conversationHistory.map((msg: any, idx: number) => {
  const role = msg.role === 'user' ? 'USER' : 'NIV'
  const content = typeof msg.content === 'string' ? msg.content : msg.content?.text || ''
  // Show FULL content for user messages, truncate assistant
  const displayContent = role === 'USER' ? content : content.substring(0, 500)
  return `[${role}]: ${displayContent}${role === 'NIV' && content.length > 500 ? '...' : ''}`
}).join('\n\n')}

USER'S CURRENT REQUEST: "${message}"
CONTENT TYPE: ${contentType.replace('-', ' ')}

USER PREFERENCES FROM CONVERSATION:
- Wants: ${discoveryContext.session.userPreferences.wants.join(', ') || 'Not specified'}
- Does NOT want: ${discoveryContext.session.userPreferences.doesNotWant.join(', ') || 'Not specified'}
- Constraints: ${discoveryContext.session.userPreferences.constraints.join(', ') || 'Not specified'}
- Examples provided: ${discoveryContext.session.userPreferences.examples.join(', ') || 'None'}

ORGANIZATION CONTEXT:
- Name: ${discoveryContext.organization.name}
- Industry: ${discoveryContext.organization.industry}
- Positioning: ${discoveryContext.organization.positioning}

CRITICAL ANALYSIS INSTRUCTIONS:
1. Read the ENTIRE conversation to understand what they want
2. Identify if this is a follow-up to previous content (e.g., "now create an image for that")
3. Extract the actual topic from both current request AND conversation history
4. Note any constraints or things they explicitly don't want
5. Determine if you need more information to create high-quality content

Return JSON:
{
  "topic": "clear topic/subject extracted from full conversation context",
  "audience": "target audience",
  "objective": "what they want to achieve",
  "keyPoints": ["point1", "point2", "point3"],
  "tone": "professional/casual/technical/inspirational",
  "requirements": ["specific requirements"],
  "isFollowUp": true/false,
  "referencesContent": "what previous content they're referring to, if any",
  "needsMoreInfo": true/false,
  "followUpQuestions": ["question1", "question2"] if needsMoreInfo is true,
  "knowledgeGaps": [{"area": "gap area", "query": "research query"}] if research needed
}`
      }]
    })
  })

  if (!response.ok) {
    throw new Error('Claude analysis failed')
  }

  const data = await response.json()
  const analysisText = data.content[0].text

  // Extract JSON
  const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  throw new Error('Failed to parse analysis')
}

// CONDUCT RESEARCH (like Strategic Framework)
async function conductResearch(knowledgeGaps: any[], context: any): Promise<any> {
  const results: any = {}

  for (const gap of knowledgeGaps) {
    console.log(`🔍 Researching: ${gap.query}`)

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({
          query: gap.query,
          context: context
        })
      })

      if (response.ok) {
        const data = await response.json()
        results[gap.area] = {
          keyFindings: data.keyFindings || [],
          articles: data.articles || [],
          summary: data.summary || ''
        }
      }
    } catch (error) {
      console.error(`Research error for ${gap.area}:`, error)
      results[gap.area] = { keyFindings: [], articles: [], summary: '' }
    }
  }

  return results
}

// GENERATE STRATEGIC BRIEF (like Strategic Framework presents strategy)
async function generateStrategicBrief(
  contentType: string,
  understanding: any,
  research: any,
  discoveryContext: any,
  conversationHistory: any[]
): Promise<string> {
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
      messages: [{
        role: 'user',
        content: `You are NIV, a strategic PR consultant presenting a content creation plan.

CONTENT TYPE: ${contentType.replace('-', ' ')}
TOPIC: ${understanding.topic}
AUDIENCE: ${understanding.audience}
OBJECTIVE: ${understanding.objective}

KEY POINTS TO COVER:
${understanding.keyPoints?.map((p: string) => `- ${p}`).join('\n')}

TONE: ${understanding.tone}

USER PREFERENCES:
- Wants: ${discoveryContext.session.userPreferences.wants.join(', ') || 'Not specified'}
- Does NOT want: ${discoveryContext.session.userPreferences.doesNotWant.join(', ') || 'Not specified'}

RESEARCH FINDINGS:
${Object.entries(research).map(([area, data]: [string, any]) => `
## ${area}
${data.keyFindings?.slice(0, 3).map((f: string) => `- ${f}`).join('\n') || 'No findings'}
`).join('\n')}

Create a 2-3 sentence strategic brief explaining:
1. What you're going to create and why this approach will work
2. How it aligns with their preferences and objectives
3. What the content will accomplish

Then ask: "Shall I proceed with this approach?"

Be conversational and consultant-like, not robotic.`
      }]
    })
  })

  if (!response.ok) {
    return `I'll create a ${contentType.replace('-', ' ')} about ${understanding.topic} for ${understanding.audience}. This will ${understanding.objective}. Shall I proceed?`
  }

  const data = await response.json()
  return data.content[0].text
}

// GENERATE CONTENT WITH FULL CONTEXT
async function generateContentWithFullContext(
  contentType: string,
  understanding: any,
  discoveryContext: any,
  conversationHistory: any[],
  currentMessage: string
): Promise<any> {
  const routing = CONTENT_ROUTING[contentType]

  if (!routing) {
    throw new Error(`Unknown content type: ${contentType}`)
  }

  // Build rich context for content generation
  const enhancedContext = {
    topic: understanding.topic,
    audience: understanding.audience,
    objective: understanding.objective,
    keyPoints: understanding.keyPoints,
    tone: understanding.tone,
    requirements: understanding.requirements,
    organization: discoveryContext.organization,
    userPreferences: discoveryContext.session.userPreferences,
    conversationContext: conversationHistory.slice(-5).map((m: any) => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : m.content?.text || ''
    }))
  }

  // Route to appropriate service
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${routing.service}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({
      tool: routing.tool,
      context: enhancedContext,
      message: currentMessage,
      conversationHistory: conversationHistory
    })
  })

  if (!response.ok) {
    throw new Error(`Content generation failed: ${response.status}`)
  }

  return await response.json()
}

// BUILD ORCHESTRATION (what should happen next)
function buildOrchestration(contentType: string, content: any): any {
  const orchestration: any = {
    next_steps: [],
    suggested_components: [],
    workflow_type: 'content-execution',
    requires_approval: false,
    distribution_ready: false
  }

  // Determine next steps based on content type
  if (contentType === 'social-post' || contentType === 'twitter-thread') {
    orchestration.next_steps.push('Schedule via Social Intelligence')
    orchestration.suggested_components.push('social-scheduler')
    orchestration.distribution_ready = true
  }

  if (contentType === 'press-release') {
    orchestration.next_steps.push('Send to Media Targets')
    orchestration.next_steps.push('Create media pitch')
    orchestration.suggested_components.push('media-distribution')
    orchestration.requires_approval = true
  }

  if (contentType === 'executive-statement') {
    orchestration.next_steps.push('Executive approval required')
    orchestration.requires_approval = true
  }

  if (contentType === 'image' || contentType === 'video') {
    orchestration.next_steps.push('Add to content library')
    orchestration.next_steps.push('Use in social posts')
    orchestration.suggested_components.push('content-library')
  }

  return orchestration
}

// HELPER FUNCTIONS
function extractUserIntent(history: any[]): string {
  if (!history || history.length === 0) return 'Content creation request'
  const lastMessage = history[history.length - 1]
  const content = typeof lastMessage?.content === 'string' ? lastMessage.content : lastMessage?.content?.text || ''
  return content.substring(0, 200) || 'Content creation request'
}

function extractDecisions(history: any[]): any[] {
  return []
}

function extractConstraints(history: any[]): any[] {
  return []
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// DETECT ORCHESTRATION PACKAGE
function detectOrchestrationPackage(message: string, conversationHistory: any[]): string | null {
  const messageLower = message.toLowerCase()

  // Check for exact triggers
  for (const trigger of ORCHESTRATION_TRIGGERS) {
    if (messageLower.includes(trigger)) {
      // Map to package type
      if (trigger.includes('media plan') || trigger.includes('pr campaign')) return 'media-plan'
      if (trigger.includes('social')) return 'social-campaign'
      if (trigger.includes('launch')) return 'product-launch'
      return 'content-package'
    }
  }

  // Check if user mentions multiple content types (signals they want a package)
  const mentionedTypes = []
  for (const [alias, type] of Object.entries(TYPE_ALIASES)) {
    if (messageLower.includes(alias)) {
      mentionedTypes.push(type)
    }
  }

  // If they mention 3+ content types, they want a package
  if (mentionedTypes.length >= 3) {
    return 'content-package'
  }

  return null
}

// HANDLE ORCHESTRATION PACKAGE
async function handleOrchestrationPackage(
  orchestrationType: string,
  message: string,
  conversationHistory: any[],
  discoveryContext: any,
  awaitingWhat: string | null,
  approved: boolean
): Promise<Response> {
  const packageDef = ORCHESTRATION_PACKAGES[orchestrationType]

  // If user approved, generate all components
  if (awaitingWhat === 'orchestration-approval' && approved) {
    console.log('✅ Orchestration approved - generating all components')

    const lastMessage = conversationHistory[conversationHistory.length - 1]
    const storedComponents = lastMessage?.orchestrationComponents || packageDef.components
    const storedUnderstanding = lastMessage?.understanding

    const allContent = []

    for (const componentType of storedComponents) {
      console.log(`🚀 Generating ${componentType}...`)

      try {
        const content = await generateContentWithFullContext(
          componentType,
          storedUnderstanding,
          discoveryContext,
          conversationHistory,
          message
        )

        allContent.push({
          type: componentType,
          content: content,
          label: componentType.replace('-', ' ')
        })
      } catch (error) {
        console.error(`Error generating ${componentType}:`, error)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      mode: 'orchestration-complete',
      message: `Generated ${allContent.length} pieces for your ${packageDef.name}!`,
      content: allContent,
      packageType: orchestrationType,
      orchestration: {
        next_steps: ['Review all content', 'Schedule distribution', 'Create presentation from assets'],
        suggested_components: ['content-library', 'social-scheduler', 'gamma-presentation'],
        workflow_type: 'package-execution',
        can_create_presentation: true
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // First request - analyze and present orchestration plan
  console.log('📋 Analyzing orchestration request with Claude...')

  const understanding = await analyzeOrchestrationRequest(
    message,
    orchestrationType,
    packageDef,
    conversationHistory,
    discoveryContext
  )

  // Determine final components (could be modified by Claude based on context)
  const finalComponents = understanding.recommendedComponents || packageDef.components

  // Present orchestration brief
  const orchestrationBrief = await generateOrchestrationBrief(
    orchestrationType,
    packageDef,
    finalComponents,
    understanding,
    discoveryContext
  )

  return new Response(JSON.stringify({
    success: true,
    mode: 'orchestration-brief',
    message: orchestrationBrief,
    awaitingApproval: true,
    awaitingWhat: 'orchestration-approval',
    understanding: understanding,
    orchestrationComponents: finalComponents,
    packageType: orchestrationType,
    packageName: packageDef.name
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// ANALYZE ORCHESTRATION REQUEST
async function analyzeOrchestrationRequest(
  message: string,
  orchestrationType: string,
  packageDef: any,
  conversationHistory: any[],
  discoveryContext: any
): Promise<any> {
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
      messages: [{
        role: 'user',
        content: `You are NIV, analyzing a multi-step content orchestration request.

USER REQUEST: "${message}"
PACKAGE TYPE: ${packageDef.name}
DEFAULT COMPONENTS: ${packageDef.components.join(', ')}

COMPLETE CONVERSATION HISTORY:
${conversationHistory.map((msg: any) => {
  const role = msg.role === 'user' ? 'USER' : 'NIV'
  const content = typeof msg.content === 'string' ? msg.content : msg.content?.text || ''
  return `[${role}]: ${content}`
}).join('\n\n')}

USER PREFERENCES:
- Wants: ${discoveryContext.session.userPreferences.wants.join(', ') || 'Not specified'}
- Does NOT want: ${discoveryContext.session.userPreferences.doesNotWant.join(', ') || 'Not specified'}

ORGANIZATION: ${discoveryContext.organization.name} (${discoveryContext.organization.industry})

TASK: Analyze what content package they need. You can modify the default components based on:
1. What they specifically mentioned
2. Their industry and audience
3. The goal they're trying to achieve
4. User preferences

Return JSON:
{
  "topic": "what this package is about",
  "objective": "what they want to achieve",
  "audience": "target audience",
  "recommendedComponents": ["component1", "component2", ...],
  "rationale": "why these components make sense",
  "keyMessages": ["message1", "message2"],
  "tone": "professional/casual/technical"
}`
      }]
    })
  })

  if (!response.ok) {
    return {
      topic: 'Content package',
      objective: 'Create comprehensive content',
      recommendedComponents: packageDef.components
    }
  }

  const data = await response.json()
  const analysisText = data.content[0].text

  const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  return {
    topic: 'Content package',
    objective: 'Create comprehensive content',
    recommendedComponents: packageDef.components
  }
}

// GENERATE ORCHESTRATION BRIEF
async function generateOrchestrationBrief(
  orchestrationType: string,
  packageDef: any,
  components: string[],
  understanding: any,
  discoveryContext: any
): Promise<string> {
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
      messages: [{
        role: 'user',
        content: `You are NIV presenting a multi-step content orchestration plan.

PACKAGE: ${packageDef.name}
TOPIC: ${understanding.topic}
OBJECTIVE: ${understanding.objective}

COMPONENTS TO CREATE:
${components.map((c, i) => `${i + 1}. ${c.replace('-', ' ')}`).join('\n')}

RATIONALE: ${understanding.rationale}

Create a consultant-style brief (2-3 sentences) explaining:
1. What complete package you'll create
2. Why these components work together strategically
3. What this will accomplish for ${discoveryContext.organization.name}

Then list the components you'll generate and ask: "Shall I proceed with creating all ${components.length} pieces?"

Be conversational and strategic, not robotic.`
      }]
    })
  })

  if (!response.ok) {
    return `I'll create a complete ${packageDef.name} with ${components.length} pieces: ${components.map(c => c.replace('-', ' ')).join(', ')}. This package will ${understanding.objective}. Shall I proceed with creating all ${components.length} pieces?`
  }

  const data = await response.json()
  return data.content[0].text
}
