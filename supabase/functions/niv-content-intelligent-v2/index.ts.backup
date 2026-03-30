import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

/**
 * NIV Content - Intelligent Content Consultant
 *
 * Progressive stages (like niv-orchestrator-robust):
 * 1. acknowledge stage - Quick understanding + acknowledgment
 * 2. research stage - Execute research based on understanding
 * 3. decision stage - Present options or generate content
 */

interface ContentConceptState {
  conversationId: string
  stage: 'exploring' | 'defining' | 'refining' | 'ready'

  concept: {
    contentType?: string
    subject?: string
    purpose?: string
    strategy?: string // mass-market, industry, vertical, hybrid
    narrative?: string
    targetMedia?: string[]
    keyMessages?: string[]
  }

  elementsDiscussed: string[]
  elementsConfirmed: string[]
  elementsNeeded: string[]
  confidence: number

  researchHistory: Array<{
    timestamp: Date
    query: string
    results: any
    summarizedText: string
  }>

  userPreferences: {
    wants: string[]
    doesNotWant: string[]
    examples: string[]
    constraints: string[]
  }

  fullConversation: Array<{
    role: string
    content: string
    timestamp: Date
  }>

  lastUpdate: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      message,
      conversationHistory = [],
      organizationContext,
      stage = 'full' // 'acknowledge', 'research', or 'full'
    } = await req.json()

    console.log('🎯 NIV Content:', message?.substring(0, 100), 'Stage:', stage)

    const conversationId = organizationContext?.conversationId ||
                          organizationContext?.organizationId ||
                          'default'

    const organizationId = organizationContext?.organizationId || 'OpenAI'

    // STAGE 1: ACKNOWLEDGE - Quick understanding only
    if (stage === 'acknowledge') {
      console.log('🧠 Acknowledge stage: Understanding query...')
      const understanding = await getClaudeUnderstanding(message, conversationHistory, organizationId)

      return new Response(JSON.stringify({
        success: true,
        stage: 'acknowledgment',
        message: understanding.acknowledgment,
        understanding: understanding.understanding,
        nextStage: understanding.approach.requires_research ? 'research' : 'decision'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // STAGE 2: RESEARCH - Execute research if needed
    if (stage === 'research') {
      console.log('🔍 Research stage: Executing research...')

      // Get org profile
      const orgProfile = await getOrgProfile(organizationId)

      // Get understanding from organizationContext (passed from acknowledge stage)
      const searchQuery = organizationContext?.searchQuery || message

      const research = await executeResearch(searchQuery, organizationId, organizationContext)

      return new Response(JSON.stringify({
        success: true,
        stage: 'research_complete',
        message: `Research complete: ${research.articles?.length || 0} articles found`,
        research: research,
        orgProfile: orgProfile,
        nextStage: 'decision'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // STAGE 3: FULL - Complete processing (default)
    console.log('🎯 Full stage: Complete processing...')

    // Get org profile
    let orgProfile
    try {
      orgProfile = await getOrgProfile(organizationId)
      console.log('✅ Org profile:', orgProfile.organizationName)
    } catch (error) {
      console.error('❌ Org profile failed:', error)
      orgProfile = {
        organizationName: organizationId,
        competitors: [],
        keywords: [organizationId],
        industry: 'Technology'
      }
    }

    // Build initial state to check if research is needed
    const initialToolResults: any = {
      discoveryData: orgProfile,
      intelligencePipeline: organizationContext?.research || { articles: [], keyFindings: [], synthesis: '' },
      keyFindings: organizationContext?.research?.keyFindings || []
    }

    const initialState = buildStateFromConversation(
      conversationId,
      conversationHistory,
      message,
      initialToolResults
    )

    // CRITICAL: If it's a media plan/presentation and NO research, do research FIRST
    const needsResearch = (
      (initialState.concept.contentType === 'media-plan' || initialState.concept.contentType === 'presentation') &&
      initialState.researchHistory.length === 0 &&
      !organizationContext?.research?.articles?.length
    )

    let toolResults = initialToolResults

    if (needsResearch && initialState.concept.subject) {
      console.log('🔍 Media plan needs research first. Researching:', initialState.concept.subject)

      const researchQuery = `${initialState.concept.subject} ${initialState.concept.purpose || ''} market landscape competitors news`
      const research = await executeResearch(researchQuery, organizationId, organizationContext)

      toolResults = {
        ...initialToolResults,
        intelligencePipeline: research,
        keyFindings: research.keyFindings
      }

      console.log('✅ Research complete:', research.articles?.length || 0, 'articles')
    }

    // Rebuild state with research if we just did it
    const state = buildStateFromConversation(
      conversationId,
      conversationHistory,
      message,
      toolResults
    )

    // Build comprehensive message
    const comprehensiveMessage = buildComprehensiveMessage(
      message,
      state,
      toolResults,
      conversationHistory
    )

    // Call Claude for decision
    const decision = await callClaudeWithFullContext(comprehensiveMessage, state)
    console.log('💡 Decision:', decision.decision)

    // Execute based on decision
    if (decision.decision === 'ask_question') {
      return new Response(JSON.stringify({
        success: true,
        mode: 'question',
        message: decision.response,
        awaitingResponse: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (decision.decision === 'ask_if_needs_help') {
      return new Response(JSON.stringify({
        success: true,
        mode: 'question',
        message: decision.response,
        question: decision.question,
        awaitingResponse: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (decision.decision === 'present_strategy_options') {
      return new Response(JSON.stringify({
        success: true,
        mode: 'strategy_options',
        message: decision.response,
        strategyOptions: decision.strategyOptions,
        awaitingChoice: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (decision.decision === 'generate_content') {
      return await orchestrateContentGeneration(state, orgProfile)
    }

    if (decision.decision === 'generate_framework') {
      return await generateStrategicFramework(
        state,
        toolResults,
        message,
        conversationHistory,
        organizationId,
        orgProfile
      )
    }

    // Default response
    return new Response(JSON.stringify({
      success: true,
      mode: 'conversation',
      message: decision.response
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

// Initial Understanding Call (fast)
async function getClaudeUnderstanding(
  message: string,
  conversationHistory: any[],
  organizationId: string
): Promise<any> {
  const understandingPrompt = `You are NIV, a strategic content consultant for ${organizationId}.

**YOUR CONTENT EXPERTISE:**

**MEDIA PLAN** (Complex - multi-piece orchestration)
- Components: Press Release + Media List + Media Pitch + Q&A Doc + Social Posts
- When: Product launches, major announcements, campaigns
- Process: Research market landscape → Present narrative angles → Generate all pieces
- Example: "media plan for Sora 2 launch" → Research AI video market → Present 3 narrative options → Generate 5 pieces

**PRESENTATION/DECK** (Complex - structured delivery)
- Components: Multi-slide deck with story arc
- When: Board meetings, investor pitches, conferences
- Process: Research topic → Present structure options → Generate slides
- Example: "deck about AI safety" → Research current AI safety landscape → Present structure options

**PRESS RELEASE** (Medium)
- Single piece: Headline + body + quotes + boilerplate
- When: News announcements, partnerships
- Research if: Need market context, competitive positioning

**SOCIAL POST** (Simple)
- Single piece: Platform-optimized post
- When: Quick announcements, engagement
- Usually: Direct generation with brand voice

**ARTICLE/BLOG** (Medium)
- Single piece: Long-form thought leadership
- When: Industry insights, trend analysis
- Research if: Need current data, expert perspectives

${conversationHistory.length > 0 ? `**CONVERSATION CONTEXT:**
${conversationHistory.slice(-5).map(msg => `${msg.role === 'user' ? 'User' : 'NIV'}: ${msg.content.substring(0, 250)}`).join('\n')}
` : ''}

**CURRENT REQUEST:** "${message}"

Analyze deeply: What content type? What's the subject? Does this need market research? What's the strategic goal?

Return JSON:
{
  "understanding": {
    "what_user_wants": "clear description of the request",
    "content_type": "media-plan/presentation/press-release/social-post/article/blog",
    "subject": "the specific subject/product/announcement",
    "purpose": "why they need this (launch/announcement/thought-leadership)",
    "audience": "who this is for (if mentioned or obvious)",
    "complexity": "simple/medium/complex",
    "requires_research": true/false,
    "why_research": "specific reason if true (e.g., 'need competitive landscape for Sora 2 to position narrative')",
    "entities": ["key companies/products/people mentioned"],
    "timeframe": "launch date/timing if mentioned"
  },
  "approach": {
    "requires_research": true/false,
    "search_query": "specific targeted query (e.g., 'Sora 2 AI video market competitors 2024 2025' not just 'Sora 2')",
    "next_step": "research/generate_content/ask_question",
    "confidence": 0.0-1.0
  },
  "acknowledgment": "Natural, consultative response that shows deep understanding (e.g., 'Got it - creating a media plan for the Sora 2 launch. Let me research the AI video generation landscape to identify the best narrative angles.')"
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 400,
      messages: [{ role: 'user', content: understandingPrompt }]
    }),
  })

  if (!response.ok) {
    throw new Error('Understanding call failed')
  }

  const data = await response.json()
  const text = data.content[0].text

  try {
    let jsonText = text.trim()

    // Remove markdown code blocks
    const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) ||
                     jsonText.match(/```\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    }

    // Clean control characters that break JSON
    jsonText = jsonText
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\r/g, '') // Remove carriage returns
      .replace(/\t/g, ' ') // Replace tabs with spaces

    return JSON.parse(jsonText)
  } catch (e) {
    console.error('JSON parse error:', e.message)
    console.error('Raw text:', text.substring(0, 500))

    // Try extracting JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        let cleanJson = jsonMatch[0]
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          .replace(/\n/g, ' ')
          .replace(/\r/g, '')
          .replace(/\t/g, ' ')
        return JSON.parse(cleanJson)
      } catch (e2) {
        console.error('Second parse attempt failed:', e2.message)
      }
    }

    // Fallback
    return {
      understanding: { what_user_wants: 'Content creation', requires_research: true },
      approach: { requires_research: true, search_query: message, next_step: 'research' },
      acknowledgment: 'Let me help with that.'
    }
  }
}

// Get Org Profile
async function getOrgProfile(organizationId: string): Promise<any> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-discovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        action: 'get_discovery',
        organization: organizationId
      })
    })

    if (response.ok) {
      const data = await response.json()
      return {
        organizationName: data.organization_name || organizationId,
        competitors: data.competition?.direct_competitors?.slice(0, 5) || [],
        keywords: data.keywords?.slice(0, 10) || [],
        industry: data.industry || 'Technology'
      }
    }
  } catch (error) {
    console.error('Org profile error:', error)
  }

  return {
    organizationName: organizationId,
    competitors: [],
    keywords: [organizationId],
    industry: 'Technology'
  }
}

// Execute Research
async function executeResearch(
  searchQuery: string,
  organizationId: string,
  context: any
): Promise<any> {
  try {
    console.log('🔍 Researching:', searchQuery)

    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        query: searchQuery,
        context: { ...context, organizationId }
      })
    })

    if (response.ok) {
      const data = await response.json()

      // niv-fireplexity returns results in 'results' field, not 'articles'
      const articles = data.results || data.articles || []

      const keyFindings: string[] = []
      if (articles && Array.isArray(articles)) {
        articles.forEach((article: any) => {
          if (article.title || article.headline) {
            keyFindings.push(article.title || article.headline)
          }
        })
      }

      return {
        articles: articles,
        keyFindings: keyFindings,
        synthesis: data.summary || ''
      }
    }
  } catch (error) {
    console.error('Research error:', error)
  }

  return { articles: [], keyFindings: [], synthesis: '' }
}

// Build State from Conversation
function buildStateFromConversation(
  conversationId: string,
  conversationHistory: Array<{role: string, content: string}>,
  currentMessage: string,
  toolResults: any
): ContentConceptState {

  const state: ContentConceptState = {
    conversationId,
    stage: 'exploring',
    concept: {},
    elementsDiscussed: [],
    elementsConfirmed: [],
    elementsNeeded: ['contentType', 'subject'],
    confidence: 0,
    researchHistory: [],
    userPreferences: {
      wants: [],
      doesNotWant: [],
      examples: [],
      constraints: []
    },
    fullConversation: [],
    lastUpdate: Date.now()
  }

  const allMessages = [
    ...conversationHistory,
    { role: 'user', content: currentMessage }
  ]

  allMessages.forEach((msg) => {
    state.fullConversation.push({
      role: msg.role,
      content: msg.content,
      timestamp: new Date()
    })

    if (msg.role !== 'user') return

    const content = msg.content
    const contentLower = content.toLowerCase()

    // Extract wants
    if (contentLower.includes('i want') || contentLower.includes('we need')) {
      const match = content.match(/(?:i want|we need)\s+([^.!?]+)/i)
      if (match) state.userPreferences.wants.push(match[1].trim())
    }

    if (contentLower.includes("don't want") || contentLower.includes('avoid')) {
      state.userPreferences.doesNotWant.push(content)
    }

    if (contentLower.includes('constraint') || contentLower.includes('must')) {
      state.userPreferences.constraints.push(content)
    }

    if (contentLower.includes('like') || contentLower.includes('example')) {
      state.userPreferences.examples.push(content)
    }

    // Extract content type
    if (!state.concept.contentType) {
      if (contentLower.includes('media plan')) {
        state.concept.contentType = 'media-plan'
        if (!state.elementsDiscussed.includes('contentType')) {
          state.elementsDiscussed.push('contentType')
        }
      } else if (contentLower.includes('presentation') || contentLower.includes('deck') || contentLower.includes('slides')) {
        state.concept.contentType = 'presentation'
        if (!state.elementsDiscussed.includes('contentType')) {
          state.elementsDiscussed.push('contentType')
        }
      } else if (contentLower.includes('social post')) {
        state.concept.contentType = 'social-post'
        if (!state.elementsDiscussed.includes('contentType')) {
          state.elementsDiscussed.push('contentType')
        }
      } else if (contentLower.includes('press release')) {
        state.concept.contentType = 'press-release'
        if (!state.elementsDiscussed.includes('contentType')) {
          state.elementsDiscussed.push('contentType')
        }
      } else if (contentLower.includes('article') || contentLower.includes('blog')) {
        state.concept.contentType = 'article'
        if (!state.elementsDiscussed.includes('contentType')) {
          state.elementsDiscussed.push('contentType')
        }
      }
    }

    // Extract subject - multiple patterns
    if (!state.concept.subject) {
      // Try multiple extraction patterns
      let extracted = null

      // Pattern 1: "for X" or "about X"
      const forMatch = content.match(/(?:for|about)\s+([^.!?,]+)/i)
      if (forMatch) {
        extracted = forMatch[1].trim()
      }

      // Pattern 2: "launch of X" or "announcement of X"
      if (!extracted) {
        const ofMatch = content.match(/(?:launch|announcement|release)\s+of\s+([^.!?,]+)/i)
        if (ofMatch) {
          extracted = ofMatch[1].trim()
        }
      }

      // Pattern 3: Capitalized product names (Sora 2, ChatGPT, etc.)
      if (!extracted) {
        const productMatch = content.match(/\b([A-Z][a-zA-Z]*(?:\s+\d+)?)\b/)
        if (productMatch && productMatch[1].length > 2) {
          extracted = productMatch[1].trim()
        }
      }

      // Pattern 4: "to support X" or "to promote X"
      if (!extracted) {
        const supportMatch = content.match(/to\s+(?:support|promote|announce|publicize)\s+(?:the\s+)?(?:launch\s+of\s+)?([^.!?,]+)/i)
        if (supportMatch) {
          extracted = supportMatch[1].trim()
        }
      }

      if (extracted) {
        state.concept.subject = extracted
        if (!state.elementsDiscussed.includes('subject')) {
          state.elementsDiscussed.push('subject')
        }
      }
    }

    // Extract purpose
    if (!state.concept.purpose && contentLower.includes('launch')) {
      state.concept.purpose = 'launch'
      if (!state.elementsDiscussed.includes('purpose')) {
        state.elementsDiscussed.push('purpose')
      }
    }

    // Detect strategy choice
    if (!state.concept.strategy) {
      // Pattern 1: "I choose strategy 2" or "strategy 2"
      const strategyMatch = content.match(/(?:choose|pick|select)?\s*(?:strategy|option)?\s*#?(\d+)/i)
      if (strategyMatch) {
        state.concept.strategy = `option-${strategyMatch[1]}`
        if (!state.elementsDiscussed.includes('strategy')) {
          state.elementsDiscussed.push('strategy')
        }
      }
      // Pattern 2: Named strategy mentions
      else if (contentLower.includes('mass market') || contentLower.includes('enterprise') || contentLower.includes('creative industry')) {
        const strategyName = contentLower.includes('mass market') ? 'mass-market' :
                            contentLower.includes('enterprise') ? 'enterprise' :
                            contentLower.includes('creative industry') ? 'creative-industry' : null
        if (strategyName) {
          state.concept.strategy = strategyName
          if (!state.elementsDiscussed.includes('strategy')) {
            state.elementsDiscussed.push('strategy')
          }
        }
      }
    }

    // Detect user agreement signals (sounds good, yes, let's do it)
    if (contentLower === 'sounds good' || contentLower === 'yes' || contentLower === 'go ahead' ||
        contentLower === "let's do it" || contentLower === 'proceed') {
      // Mark as ready to generate if we have strategy
      if (state.concept.strategy) {
        state.stage = 'ready'
        state.confidence = 100
      }
    }
  })

  // Add research to history
  if (toolResults.intelligencePipeline && toolResults.intelligencePipeline.articles?.length > 0) {
    const summary = toolResults.intelligencePipeline.synthesis ||
                   `Found ${toolResults.intelligencePipeline.articles?.length || 0} articles`

    state.researchHistory.push({
      timestamp: new Date(),
      query: currentMessage,
      results: toolResults.intelligencePipeline,
      summarizedText: summary.substring(0, 200)
    })
  }

  // Update confidence
  const elementCount = Object.keys(state.concept).length
  state.confidence = Math.min(100, elementCount * 25)

  // Update stage
  if (state.confidence < 25) state.stage = 'exploring'
  else if (state.confidence < 75) state.stage = 'defining'
  else if (state.confidence < 100) state.stage = 'refining'
  else state.stage = 'ready'

  if (state.fullConversation.length > 20) {
    state.fullConversation = state.fullConversation.slice(-20)
  }

  console.log('📊 State:', {
    contentType: state.concept.contentType,
    subject: state.concept.subject,
    confidence: state.confidence,
    researchRounds: state.researchHistory.length
  })

  return state
}

// Build Comprehensive Message
function buildComprehensiveMessage(
  userMessage: string,
  state: ContentConceptState,
  toolResults: any,
  conversationHistory: any[]
): string {
  let message = ""

  // START WITH CLIENT CONTEXT (like orchestrator lines 1228-1242)
  if (toolResults.discoveryData) {
    const data = toolResults.discoveryData
    message += `**CLIENT PROFILE - ${data.organizationName}:**\n`
    message += `• Industry: ${data.industry}\n`

    if (data.competitors && data.competitors.length > 0) {
      message += `• Competitors: ${data.competitors.slice(0, 5).join(', ')}\n`
    }

    if (data.keywords && data.keywords.length > 0) {
      message += `• Keywords: ${data.keywords.slice(0, 8).join(', ')}\n`
    }

    message += `\nNOTE: Use this as baseline context for the client.\n\n`
  }

  // FULL CONVERSATION CONTEXT (like orchestrator lines 1244-1263)
  if (conversationHistory && conversationHistory.length > 0) {
    const truncated = conversationHistory.slice(-10) // Keep last 10 messages
    message += "**COMPLETE CONVERSATION HISTORY:**\n"
    message += `(Showing last ${truncated.length} messages)\n\n`

    truncated.forEach(msg => {
      let content = msg.content || ''
      if (content.length > 1000) {
        content = content.substring(0, 1000) + '...[truncated]'
      }
      message += `[${msg.role === 'user' ? 'USER' : 'NIV'}]: ${content}\n\n`
    })
    message += "\n**CURRENT USER QUERY:**\n"
  }

  message += `"${userMessage}"\n\n`

  // CONTENT CONCEPT PROGRESS (like orchestrator lines 1268-1333)
  message += `**CONTENT CONCEPT PROGRESS:**\n`
  message += `Stage: ${state.stage} (${state.confidence}% complete)\n`

  if (state.concept.contentType) {
    message += `Content Type: ${state.concept.contentType}\n`
  }
  if (state.concept.subject) {
    message += `Subject: ${state.concept.subject}\n`
  }
  if (state.concept.purpose) {
    message += `Purpose: ${state.concept.purpose}\n`
  }
  if (state.concept.narrative) {
    message += `Narrative Chosen: ${state.concept.narrative}\n`
  }

  // USER PREFERENCES (like orchestrator lines 1286-1298)
  if (state.userPreferences.wants.length > 0) {
    message += `\n**What user WANTS:**\n`
    state.userPreferences.wants.forEach(want => {
      message += `- ${want}\n`
    })
  }

  if (state.userPreferences.doesNotWant.length > 0) {
    message += `\n**What user DOES NOT WANT:**\n`
    state.userPreferences.doesNotWant.forEach(noWant => {
      message += `- ${noWant}\n`
    })
  }

  if (state.userPreferences.constraints.length > 0) {
    message += `\n**Constraints:**\n`
    state.userPreferences.constraints.forEach(constraint => {
      message += `- ${constraint}\n`
    })
  }

  // RESEARCH HISTORY (like orchestrator lines 1300-1314)
  if (state.researchHistory.length > 0) {
    const recentResearch = state.researchHistory.slice(-3)
    message += `\n**RESEARCH COMPLETED:**\n`
    message += `Total rounds: ${state.researchHistory.length}\n`
    message += `Recent rounds:\n`

    recentResearch.forEach((research, idx) => {
      const actualIdx = state.researchHistory.length - recentResearch.length + idx + 1
      message += `Round ${actualIdx}: ${research.summarizedText}\n`
    })
  }

  // CURRENT RESEARCH RESULTS (like orchestrator lines 1457-1491)
  if (toolResults.intelligencePipeline?.articles && toolResults.intelligencePipeline.articles.length > 0) {
    message += `\n**CURRENT RESEARCH RESULTS:**\n`

    if (toolResults.intelligencePipeline.synthesis) {
      message += `**Synthesis:** ${toolResults.intelligencePipeline.synthesis}\n\n`
    }

    message += `**Articles Found (${toolResults.intelligencePipeline.articles.length}):**\n`
    toolResults.intelligencePipeline.articles.slice(0, 5).forEach((article: any, i: number) => {
      message += `${i + 1}. **${article.title || 'Untitled'}**\n`
      if (article.description) {
        message += `   ${article.description.substring(0, 150)}...\n`
      }
      if (article.source?.name) {
        message += `   Source: ${article.source.name}\n`
      }
    })
  }

  // WHAT'S STILL NEEDED (like orchestrator lines 1316-1320)
  const missing = state.elementsNeeded.filter(e => !state.elementsDiscussed.includes(e))
  if (missing.length > 0) {
    message += `\n**Still need to discuss:** ${missing.join(', ')}\n`
  }

  // CONSULTATION APPROACH (like orchestrator lines 1322-1333)
  message += `\n**YOUR ROLE AS STRATEGIC CONTENT CONSULTANT:**\n`
  message += `You are helping the user build a complete content concept through intelligent dialogue.\n`
  message += `1. Acknowledge what's been discussed and build on it\n`
  message += `2. Bring relevant insights from research to inform the concept\n`
  message += `3. DON'T ask about things they've already told you\n`
  message += `4. ONLY ask about genuine gaps if needed to proceed\n`
  message += `5. Propose strategic options based on research when appropriate\n`
  message += `6. Guide toward a complete, actionable content concept\n`

  if (state.stage === 'ready') {
    message += `\n**The concept is complete. Ready to generate content.**\n`
  }

  return message
}

// Call Claude with Full Context
async function callClaudeWithFullContext(
  comprehensiveMessage: string,
  state: ContentConceptState
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
        content: `${comprehensiveMessage}

**YOUR JOB AS NIV CONTENT CONSULTANT:**

Read the COMPLETE conversation history above. Understand what the user ACTUALLY wants based on EVERYTHING they've said.

**CRITICAL COMPREHENSION RULES:**

1. **UNDERSTAND FIRST** - Read what they've told you:
   - If they said "we are launching Sora 2" → You KNOW the subject is Sora 2
   - If they said "media plan" → You KNOW they want a media plan
   - If they said "it's a product launch" → You KNOW the purpose

2. **DON'T ASK FOR WHAT YOU KNOW:**
   - If conversation shows subject = "Sora 2", DON'T ask "what are you launching?"
   - If conversation shows contentType = "media plan", DON'T ask "what type of content?"
   - If research was done, DON'T ask for market info - USE the research

3. **PROPOSE STRATEGIC OPTIONS BASED ON RESEARCH:**
   - User: "we are launching sora 2"
   - Your response: "Got it - Sora 2 launch. Based on market research, I see 3 narrative approaches: 1) Democratizing video creation... 2) Enterprise-grade AI... 3) Creator empowerment... Which direction resonates?"
   - NOT: "What's your target audience? What's your budget? When's the launch date?"

**DECISION OPTIONS:**

**A) ask_question** - ONLY if genuinely missing critical info
   - Example: They said "media plan" but research shows 3 completely different markets - need to pick one
   - Example: Simple social post but subject is completely unclear
   - Question should be: "I see X, Y, Z in the research. Which matters most for this launch?"

**B) present_narratives** - After research for complex content
   - For MEDIA PLANS: Present 2-3 narrative angles based on research
   - For PRESENTATIONS: Present 2-3 structure/approach options
   - Show OPTIONS derived from research, not questions about basics

**C) generate_content** - Have everything needed
   - For simple content (social post) with clear subject: Generate
   - For complex content AFTER narrative chosen: Generate all pieces

**D) generate_framework** - User wants complete strategic framework
   - Only if explicitly requested

**CONTENT TYPE WORKFLOWS:**

**MEDIA PLAN:**
1. User says "media plan for X"
2. Ask: "Do you have your strategy, messaging, and targets figured out, or would you like my help developing them?"
3. If user wants help: Do research → Present 2-3 strategy options
4. User chooses strategy → GENERATE IMMEDIATELY (Press Release + Media List + Pitch + Q&A + Social)

NO refinement questions after strategy choice. User picking a strategy = ready to generate.

**SIMPLE CONTENT (Social Post/Press Release):**
1. User says "social post about X"
2. If you know X: Generate directly
3. If X unclear: Ask 1 specific question

**CURRENT SITUATION ANALYSIS:**
- Stage: ${state.stage}
- Content Type: ${state.concept.contentType || 'not specified'}
- Subject: ${state.concept.subject || 'not specified'}
- Strategy chosen: ${state.concept.strategy || 'not chosen'}
- Narrative developed: ${state.concept.narrative || 'not yet'}
- Research done: ${state.researchHistory.length > 0 ? 'YES' : 'NO'}
- Confidence: ${state.confidence}%

**WHAT TO DO NOW:**
Read the current user query and conversation. Based on what you ACTUALLY know:
- If it's media plan and NO strategy chosen yet → ask_if_needs_help
- If user wants help and NO research done → do research first
- If research done and NO strategy chosen → present_strategy_options
- If user chose a strategy OR said "sounds good"/"yes"/"let's do it" → generate_content
- If simple content (social/press release) and you know the subject → generate_content
- If you're genuinely missing ONE critical piece → ask_question
- If they want strategic framework → generate_framework

**IMPORTANT USER SIGNALS:**
- User picks a strategy option → GENERATE (don't ask more questions)
- User says "sounds good", "yes", "let's do it", "go ahead" → GENERATE
- User provides additional details after strategy → INCORPORATE and GENERATE

Return ONLY JSON:
{
  "decision": "ask_if_needs_help|ask_question|present_strategy_options|generate_content|generate_framework",
  "reasoning": "why based on conversation",
  "response": "conversational message",
  "question": "specific question" (only if ask_question or ask_if_needs_help),
  "strategyOptions": [
    {
      "id": 1,
      "name": "Mass Market",
      "description": "Broad consumer tech media",
      "targetMedia": ["outlets"],
      "rationale": "why this works"
    }
  ] (only if present_strategy_options)
}`
      }]
    })
  })

  if (!response.ok) {
    throw new Error('Claude decision failed')
  }

  const data = await response.json()
  const text = data.content[0].text

  try {
    let jsonText = text.trim()

    // Remove markdown code blocks
    const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) ||
                     jsonText.match(/```\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    }

    // Clean control characters
    jsonText = jsonText
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .replace(/\t/g, ' ')

    const parsed = JSON.parse(jsonText)
    console.log('✅ Parsed decision:', JSON.stringify(parsed, null, 2))
    return parsed
  } catch (e) {
    console.error('Decision JSON parse error:', e.message)
    console.error('Raw decision text:', text.substring(0, 500))

    // Try extracting JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        let cleanJson = jsonMatch[0]
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          .replace(/\n/g, ' ')
          .replace(/\r/g, '')
          .replace(/\t/g, ' ')
        return JSON.parse(cleanJson)
      } catch (e2) {
        console.error('Second decision parse failed:', e2.message)
      }
    }

    throw new Error('Failed to parse Claude decision response')
  }
}

// Orchestrate Content Generation
async function orchestrateContentGeneration(
  state: ContentConceptState,
  orgProfile: any
): Promise<Response> {
  console.log('🎨 Generating content...')

  const planResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Create complete content plan with specific parameters.

**CONTEXT:**
Organization: ${orgProfile.organizationName}
Content Type: ${state.concept.contentType}
Subject: ${state.concept.subject}
Narrative/Angle: ${state.concept.narrative || 'Not specified'}
Research Summary: ${state.researchHistory.map(r => r.summarizedText).join(' | ')}

**REQUIRED PIECES BY TYPE:**

**media-plan** requires ALL 5 pieces:
1. press-release (tool: generate_press_release)
2. media-list (tool: generate_media_list)
3. media-pitch (tool: generate_media_pitch)
4. qa-document (tool: generate_qa_document)
5. social-posts (tool: generate_social_posts)

**presentation** requires:
1. presentation-deck (tool: generate_presentation)

**press-release** requires:
1. press-release (tool: generate_press_release)

**social-post** requires:
1. social-posts (tool: generate_social_posts)

**article** or **blog** requires:
1. article (tool: generate_article)

For EACH required piece, create SPECIFIC parameters based on the context.

Example for media-plan:
{
  "acknowledgment": "Generating complete media plan for ${state.concept.subject} with '${state.concept.narrative}' narrative...",
  "pieces": [
    {
      "type": "press-release",
      "service": "mcp-content",
      "tool": "generate_press_release",
      "parameters": {
        "headline": "Specific headline based on subject and narrative",
        "keyPoints": ["Point from research", "Point from narrative"],
        "quotes": [{"speaker": "CEO/Spokesperson", "quote": "Relevant quote"}],
        "tone": "professional/exciting/authoritative"
      }
    },
    {
      "type": "media-list",
      "service": "mcp-media",
      "tool": "generate_media_list",
      "parameters": {
        "targetOutlets": ["Specific outlets from research"],
        "beatCategories": ["Relevant beats"],
        "focus": "Launch/announcement focus"
      }
    }
  ]
}

Return ONLY JSON with ALL required pieces for the content type:`
      }]
    })
  })

  if (!planResponse.ok) {
    throw new Error('Content plan failed')
  }

  const planData = await planResponse.json()
  const planText = planData.content[0].text

  let plan
  try {
    let jsonText = planText.trim()

    const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) ||
                     jsonText.match(/```\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    }

    jsonText = jsonText
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .replace(/\t/g, ' ')

    plan = JSON.parse(jsonText)
  } catch (e) {
    console.error('Plan JSON parse error:', e.message)
    const jsonMatch = planText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        let cleanJson = jsonMatch[0]
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          .replace(/\n/g, ' ')
          .replace(/\r/g, '')
          .replace(/\t/g, ' ')
        plan = JSON.parse(cleanJson)
      } catch (e2) {
        throw new Error('Failed to parse plan')
      }
    } else {
      throw new Error('Failed to parse plan')
    }
  }

  const generationPromises = (plan.pieces || []).map((piece: any) =>
    fetch(`${SUPABASE_URL}/functions/v1/${piece.service}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        tool: piece.tool,
        parameters: piece.parameters
      })
    }).then(r => r.json()).catch(err => ({ error: err.message }))
  )

  const results = await Promise.allSettled(generationPromises)

  const generatedContent: any[] = []
  results.forEach((result, idx) => {
    if (result.status === 'fulfilled' && !result.value.error) {
      generatedContent.push({
        type: plan.pieces[idx].type,
        content: result.value
      })
    }
  })

  return new Response(JSON.stringify({
    success: true,
    mode: 'generation_complete',
    message: plan.acknowledgment || `Generated ${generatedContent.length} pieces`,
    generatedContent: generatedContent
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// Generate Strategic Framework
async function generateStrategicFramework(
  state: ContentConceptState,
  toolResults: any,
  userMessage: string,
  conversationHistory: any[],
  organizationId: string,
  orgProfile: any
): Promise<Response> {
  console.log('🎯 Generating framework...')

  const extractedResearch = {
    articles: toolResults.intelligencePipeline?.articles || [],
    keyFindings: toolResults.keyFindings || [],
    synthesis: toolResults.intelligencePipeline?.synthesis || '',
    themes: [],
    insights: { opportunities: [], risks: [], trends: [] }
  }

  const strategicResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/niv-strategic-framework`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        research: extractedResearch,
        userQuery: userMessage,
        organizationContext: {
          organizationName: orgProfile.organizationName,
          organizationId: organizationId,
          discovery: orgProfile,
          competitors: orgProfile.competitors || [],
          keywords: orgProfile.keywords || [],
          industry: orgProfile.industry,
          conceptState: state,
          conversationId: state.conversationId
        },
        conversationHistory: conversationHistory,
        targetComponent: 'auto-detect'
      })
    }
  )

  if (!strategicResponse.ok) {
    throw new Error(`Framework failed: ${strategicResponse.statusText}`)
  }

  const strategicData = await strategicResponse.json()

  return new Response(JSON.stringify({
    success: true,
    mode: 'framework_complete',
    message: `Framework generated for ${state.concept.subject}`,
    framework: strategicData.framework
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
