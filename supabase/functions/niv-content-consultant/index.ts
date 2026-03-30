import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

/**
 * NIV Content Consultant - Strategic Content Partner
 *
 * Works EXACTLY like NIV Strategic Framework:
 * 1. Conversational Discovery - Ask questions to understand
 * 2. Research Phase - Build intelligence with niv-fireplexity
 * 3. Strategy Development - Create framework with narrative, messages, goals
 * 4. Refinement - Collaborate with user to perfect strategy
 * 5. Execution - Generate content informed by strategy
 * 6. Orchestration - Suggest next steps
 */

// Orchestration packages (what multi-step content we can create)
const CONTENT_PACKAGES = {
  'media-plan': {
    name: 'Media Plan',
    description: 'Complete media launch package',
    components: ['press-release', 'media-list', 'media-pitch', 'qa-document', 'talking-points', 'social-post', 'email'],
    discoveryQuestions: [
      'What are you announcing or promoting?',
      'Who is your target audience?',
      'What is your main objective? (awareness, leads, positioning, funding?)',
      'What makes this newsworthy? What\'s the hook?',
      'Any key competitors or market context I should know about?',
      'What is your timeline?'
    ]
  },
  'social-campaign': {
    name: 'Social Media Campaign',
    description: 'Multi-channel social content strategy',
    components: ['social-post', 'twitter-thread', 'linkedin-article', 'image', 'video'],
    discoveryQuestions: [
      'What is the campaign about?',
      'Who is your target audience on social?',
      'What action do you want people to take?',
      'What channels are most important? (LinkedIn, Twitter, Instagram, etc.)',
      'What is your campaign timeline?'
    ]
  },
  'product-launch': {
    name: 'Product Launch Package',
    description: 'Complete product launch content suite',
    components: ['press-release', 'blog-post', 'social-post', 'email', 'presentation', 'qa-document'],
    discoveryQuestions: [
      'What product are you launching?',
      'Who is this product for?',
      'What problem does it solve?',
      'What makes it different from competitors?',
      'When does it launch?',
      'What are your launch goals?'
    ]
  }
}

// Single content types
const SINGLE_CONTENT_TYPES = {
  'press-release': { service: 'mcp-content', tool: 'press-release' },
  'blog-post': { service: 'mcp-content', tool: 'blog-post' },
  'social-post': { service: 'mcp-content', tool: 'social-post' },
  'thought-leadership': { service: 'mcp-content', tool: 'thought-leadership' },
  'email': { service: 'mcp-content', tool: 'email-campaign' },
  'image': { service: 'vertex-ai-visual', tool: 'generate_image' },
  'presentation': { service: 'gamma-presentation', tool: 'generate_presentation' }
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
      phase, // discovery, research, strategy, refinement, execution
      userAnswers, // Answers to discovery questions
      approvedStrategy, // User approved the strategy
      context = {}
    } = await req.json()

    console.log('🎯 NIV Content Consultant Request:', {
      message: message?.substring(0, 100),
      phase: phase || 'initial',
      historyLength: conversationHistory.length
    })

    // Detect what the user wants
    const intent = await detectUserIntent(message, conversationHistory)
    console.log('🧠 Intent detected:', intent)

    // PHASE 1: CONVERSATIONAL DISCOVERY
    if (!phase || phase === 'discovery') {
      return await handleDiscoveryPhase(
        message,
        intent,
        conversationHistory,
        organizationContext,
        userAnswers
      )
    }

    // PHASE 2: RESEARCH
    if (phase === 'research') {
      return await handleResearchPhase(
        message,
        intent,
        conversationHistory,
        organizationContext,
        userAnswers
      )
    }

    // PHASE 3: STRATEGY PRESENTATION
    if (phase === 'strategy') {
      return await handleStrategyPhase(
        message,
        intent,
        conversationHistory,
        organizationContext,
        userAnswers
      )
    }

    // PHASE 4: REFINEMENT
    if (phase === 'refinement') {
      return await handleRefinementPhase(
        message,
        conversationHistory,
        approvedStrategy
      )
    }

    // PHASE 5: EXECUTION
    if (phase === 'execution') {
      return await handleExecutionPhase(
        message,
        conversationHistory,
        approvedStrategy,
        organizationContext
      )
    }

    // Default fallback
    return new Response(JSON.stringify({
      error: 'Invalid phase'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })

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

// DETECT USER INTENT
async function detectUserIntent(message: string, conversationHistory: any[]): Promise<any> {
  const messageLower = message.toLowerCase()

  // Check for package requests
  if (messageLower.includes('media plan') || messageLower.includes('pr campaign')) {
    return { type: 'package', package: 'media-plan' }
  }
  if (messageLower.includes('social campaign') || messageLower.includes('social media plan')) {
    return { type: 'package', package: 'social-campaign' }
  }
  if (messageLower.includes('product launch') || messageLower.includes('launch package')) {
    return { type: 'package', package: 'product-launch' }
  }

  // Check for single content requests
  for (const [type, config] of Object.entries(SINGLE_CONTENT_TYPES)) {
    if (messageLower.includes(type.replace('-', ' '))) {
      return { type: 'single', contentType: type }
    }
  }

  // Use Claude to detect if unclear
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
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `User request: "${message}"

CONVERSATION HISTORY:
${conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

What do they want? Return JSON:
{
  "type": "package" or "single" or "unclear",
  "package": "media-plan" or "social-campaign" or "product-launch" (if type is package),
  "contentType": "press-release" or "blog-post" etc (if type is single),
  "topic": "brief description of what it's about"
}`
        }]
      })
    })

    if (response.ok) {
      const data = await response.json()
      const text = data.content[0].text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }
  } catch (error) {
    console.error('Intent detection error:', error)
  }

  return { type: 'unclear' }
}

// PHASE 1: DISCOVERY - Ask questions like a consultant
async function handleDiscoveryPhase(
  message: string,
  intent: any,
  conversationHistory: any[],
  organizationContext: any,
  userAnswers: any
): Promise<Response> {
  console.log('📋 Starting Discovery Phase')

  // If intent is unclear, ask what they want
  if (intent.type === 'unclear') {
    return new Response(JSON.stringify({
      success: true,
      phase: 'clarification',
      message: "I can help you create strategic content. What are you looking to create? For example:\n\n• **Media Plan** - Complete launch package with press release, media list, pitches, Q&A\n• **Social Campaign** - Multi-channel social content strategy\n• **Product Launch** - Full launch content suite\n• **Individual Content** - Press release, blog post, social content, etc.\n\nWhat would you like to work on?"
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const packageDef = intent.type === 'package' ? CONTENT_PACKAGES[intent.package] : null

  // Build discovery questions
  const questions = packageDef?.discoveryQuestions || [
    'What is this content about?',
    'Who is your target audience?',
    'What is your main objective?',
    'Any key context I should know?'
  ]

  // Generate consultant-style discovery message
  const discoveryMessage = await generateDiscoveryMessage(
    intent,
    packageDef,
    questions,
    organizationContext
  )

  return new Response(JSON.stringify({
    success: true,
    phase: 'discovery',
    message: discoveryMessage,
    questions: questions,
    intent: intent,
    nextPhase: 'research'
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// Generate consultant-style discovery message
async function generateDiscoveryMessage(
  intent: any,
  packageDef: any,
  questions: string[],
  organizationContext: any
): Promise<string> {
  const packageName = packageDef?.name || intent.contentType?.replace('-', ' ')

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
        content: `You are NIV, a strategic PR consultant. A client wants help creating a ${packageName}.

ORGANIZATION: ${organizationContext?.name || 'a company'}
INDUSTRY: ${organizationContext?.industry || 'unknown'}

Write a warm, consultant-style message that:
1. Acknowledges what they want
2. Explains you'd love to help
3. Says you need to ask a few questions to develop the RIGHT strategy
4. Lists these questions (numbered):
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

5. Encourages them to take their time - the more context, the better strategy you can create

Be conversational, professional, and genuinely consultative. Not robotic.`
      }]
    })
  })

  if (!response.ok) {
    return `I'd love to help you create a ${packageName}! To develop the right strategy, let me ask you a few questions:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nTake your time - the more context you give me, the better strategy I can develop.`
  }

  const data = await response.json()
  return data.content[0].text
}

// PHASE 2: RESEARCH - Use niv-fireplexity like Strategic Framework does
async function handleResearchPhase(
  message: string,
  intent: any,
  conversationHistory: any[],
  organizationContext: any,
  userAnswers: any
): Promise<Response> {
  console.log('🔍 Starting Research Phase')

  // Extract topic from user answers
  const topic = extractTopic(userAnswers, message)

  // Inform user research is starting
  const researchStartMessage = `Thanks for that context! Let me research the current landscape around ${topic}. I'll look at:

• Competitor activities and positioning
• Media coverage trends
• Market opportunities and gaps
• Key narratives in the space

This will take about 60 seconds...`

  // Call niv-fireplexity for research
  const research = await conductResearch(topic, organizationContext)

  // Build research summary
  const researchSummary = await summarizeResearch(research, topic)

  return new Response(JSON.stringify({
    success: true,
    phase: 'research-complete',
    message: `${researchStartMessage}\n\n---\n\n**Research Complete!**\n\n${researchSummary}\n\nLet me build your strategic framework based on this intelligence...`,
    research: research,
    nextPhase: 'strategy'
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// Conduct research using niv-fireplexity
async function conductResearch(topic: string, organizationContext: any): Promise<any> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        query: `Latest news and trends about ${topic}. Include competitor analysis, market opportunities, and media coverage.`,
        context: organizationContext
      })
    })

    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('Research error:', error)
  }

  return {
    articles: [],
    keyFindings: [],
    summary: 'Research data not available - will proceed with strategic framework based on your input.'
  }
}

// Summarize research findings
async function summarizeResearch(research: any, topic: string): Promise<string> {
  const findings = research.keyFindings || []
  const articleCount = research.articles?.length || 0

  if (findings.length === 0) {
    return 'No specific market intelligence available - I\'ll build your strategy based on your inputs and best practices.'
  }

  return `I found ${articleCount} recent articles about ${topic}. Key insights:

${findings.slice(0, 5).map((f: string, i: number) => `${i + 1}. ${f}`).join('\n')}

${research.opportunities?.length > 0 ? `\n**Opportunities I spotted:**\n${research.opportunities.slice(0, 3).map((o: string) => `• ${o}`).join('\n')}` : ''}`
}

// Extract topic from user answers
function extractTopic(userAnswers: any, message: string): string {
  if (!userAnswers || Object.keys(userAnswers).length === 0) {
    // Extract from message
    const match = message.match(/(?:about|for|on)\s+([^.!?]+)/i)
    return match ? match[1].trim() : 'this topic'
  }

  // Get first answer (usually "what are you announcing/promoting")
  return Object.values(userAnswers)[0] as string || 'your initiative'
}

// PHASE 3: STRATEGY - Present strategic framework like Strategic Framework does
async function handleStrategyPhase(
  message: string,
  intent: any,
  conversationHistory: any[],
  organizationContext: any,
  userAnswers: any
): Promise<Response> {
  console.log('🎯 Generating Strategic Framework')

  // Get research from conversation history
  const research = conversationHistory.find(m => m.research)?.research || {}

  // Build strategic framework (EXACTLY like niv-strategic-framework)
  const framework = await buildStrategicFramework(
    intent,
    userAnswers,
    research,
    organizationContext,
    conversationHistory
  )

  // Present framework to user
  const presentation = await presentStrategicFramework(framework, intent)

  return new Response(JSON.stringify({
    success: true,
    phase: 'strategy-presentation',
    message: presentation,
    framework: framework,
    awaitingApproval: true,
    nextPhase: 'refinement'
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// Build strategic framework (like Strategic Framework does)
async function buildStrategicFramework(
  intent: any,
  userAnswers: any,
  research: any,
  organizationContext: any,
  conversationHistory: any[]
): Promise<any> {
  const packageDef = intent.type === 'package' ? CONTENT_PACKAGES[intent.package] : null

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are NIV, creating a strategic framework for content generation.

PACKAGE: ${packageDef?.name || intent.contentType}
ORGANIZATION: ${organizationContext?.name || 'Unknown'} (${organizationContext?.industry || 'Unknown'})

USER CONTEXT (from discovery):
${JSON.stringify(userAnswers, null, 2)}

RESEARCH FINDINGS:
${research.keyFindings?.slice(0, 10).map((f: string) => `• ${f}`).join('\n') || 'No research data'}

${research.opportunities ? `OPPORTUNITIES:\n${research.opportunities.slice(0, 5).map((o: string) => `• ${o}`).join('\n')}` : ''}

Create a strategic framework with:

{
  "strategy": {
    "objective": "Clear, measurable goal (e.g., 'Achieve 30% share of voice in X by DATE')",
    "coreNarrative": "The story we'll tell - ONE powerful sentence",
    "keyMessages": ["Message 1", "Message 2", "Message 3"],
    "targetAudience": "Specific audience description",
    "positioning": "How we position in the market",
    "rationale": "Why this strategy works based on research"
  },
  "tactics": {
    "components": ${packageDef ? JSON.stringify(packageDef.components) : '["single piece"]'},
    "componentRationale": {
      "press-release": "Why we need this piece",
      "media-list": "Why we need this piece"
    },
    "timeline": {
      "immediate": ["Day 1-2 actions"],
      "week1": ["Week 1 milestones"],
      "ongoing": ["Ongoing actions"]
    }
  },
  "intelligence": {
    "keyFindings": ${research.keyFindings ? JSON.stringify(research.keyFindings.slice(0, 5)) : '[]'},
    "opportunities": ${research.opportunities ? JSON.stringify(research.opportunities.slice(0, 3)) : '[]'},
    "competitorMoves": ["Based on research"]
  }
}

Make it SPECIFIC and ACTIONABLE, not generic.`
      }]
    })
  })

  if (!response.ok) {
    throw new Error('Framework generation failed')
  }

  const data = await response.json()
  const text = data.content[0].text
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  throw new Error('Failed to parse framework')
}

// Present strategic framework to user
async function presentStrategicFramework(framework: any, intent: any): Promise<string> {
  const packageDef = intent.type === 'package' ? CONTENT_PACKAGES[intent.package] : null

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
        content: `You are NIV presenting a strategic framework to a client.

FRAMEWORK:
${JSON.stringify(framework, null, 2)}

Present this framework in a consultant-style format:

1. Start with: "Based on our conversation and my research, here's the strategic framework for your ${packageDef?.name || 'content'}:"

2. Present sections clearly:
**OBJECTIVE**
[The objective]

**CORE NARRATIVE**
[The narrative - in quotes, powerful]

**KEY MESSAGES**
1. [Message]
2. [Message]
3. [Message]

**TARGET AUDIENCE**
[Audience]

**STRATEGIC COMPONENTS I'LL CREATE:**
${framework.tactics?.components?.map((c: string, i: number) => `${i + 1}. **${c.replace('-', ' ')}**: ${framework.tactics?.componentRationale?.[c] || 'Strategic content piece'}`).join('\n')}

**TIMELINE**
[Present timeline in readable format]

**WHY THIS WORKS:**
[Explain rationale based on research and strategy]

3. End with: "Does this strategy align with your vision? Any adjustments needed?"

Be conversational, consultant-like, and confident.`
      }]
    })
  })

  if (!response.ok) {
    return 'Strategic framework generated. Does this align with your vision?'
  }

  const data = await response.json()
  return data.content[0].text
}

// PHASE 4: REFINEMENT - Collaborate with user
async function handleRefinementPhase(
  message: string,
  conversationHistory: any[],
  approvedStrategy: boolean
): Promise<Response> {
  console.log('🔄 Refinement Phase')

  // Check if user approved
  const messageLower = message.toLowerCase()
  const approved = messageLower.includes('yes') ||
                   messageLower.includes('approved') ||
                   messageLower.includes('proceed') ||
                   messageLower.includes('looks good') ||
                   messageLower.includes('perfect')

  if (approved) {
    return new Response(JSON.stringify({
      success: true,
      phase: 'approved',
      message: 'Excellent! Let me generate all the content pieces now using this strategic framework. Each piece will be grounded in our narrative, messages, and intelligence...',
      nextPhase: 'execution'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // User wants changes - use Claude to understand and adjust
  const lastFramework = conversationHistory.find(m => m.framework)?.framework

  const adjustedFramework = await adjustStrategy(message, lastFramework)

  const presentation = await presentStrategicFramework(adjustedFramework, { type: 'package' })

  return new Response(JSON.stringify({
    success: true,
    phase: 'strategy-adjusted',
    message: `Got it! Here's the updated strategy:\n\n${presentation}`,
    framework: adjustedFramework,
    awaitingApproval: true,
    nextPhase: 'refinement'
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// Adjust strategy based on user feedback
async function adjustStrategy(feedback: string, currentFramework: any): Promise<any> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `User feedback: "${feedback}"

Current framework:
${JSON.stringify(currentFramework, null, 2)}

Adjust the framework based on their feedback. Return the FULL updated framework JSON.`
      }]
    })
  })

  if (!response.ok) {
    return currentFramework
  }

  const data = await response.json()
  const text = data.content[0].text
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  return currentFramework
}

// PHASE 5: EXECUTION - Generate content with strategic context
async function handleExecutionPhase(
  message: string,
  conversationHistory: any[],
  approvedStrategy: any,
  organizationContext: any
): Promise<Response> {
  console.log('🚀 Execution Phase - Generating Content')

  const framework = conversationHistory.find(m => m.framework)?.framework
  const components = framework?.tactics?.components || []

  const allContent = []

  for (const componentType of components) {
    console.log(`📝 Generating ${componentType}...`)

    try {
      const content = await generateContentWithStrategy(
        componentType,
        framework,
        organizationContext,
        conversationHistory
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
    phase: 'execution-complete',
    message: `All ${allContent.length} pieces complete! Each one reinforces the same narrative and messages we developed together.`,
    content: allContent,
    orchestration: {
      nextSteps: [
        'Review content for brand voice',
        'Create Gamma presentation packaging this content',
        'Schedule social posts via Social Intelligence',
        'Analyze optimal timing for outreach'
      ],
      canCreatePresentation: true,
      suggestedComponents: ['gamma-presentation', 'social-scheduler', 'content-library']
    }
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// Generate content with strategic context
async function generateContentWithStrategy(
  contentType: string,
  framework: any,
  organizationContext: any,
  conversationHistory: any[]
): Promise<any> {
  const routing = SINGLE_CONTENT_TYPES[contentType]

  if (!routing) {
    throw new Error(`Unknown content type: ${contentType}`)
  }

  // Build strategic context for generation
  const strategicContext = {
    objective: framework.strategy?.objective,
    narrative: framework.strategy?.coreNarrative,
    keyMessages: framework.strategy?.keyMessages,
    audience: framework.strategy?.targetAudience,
    positioning: framework.strategy?.positioning,
    intelligence: framework.intelligence,
    organization: organizationContext,
    conversationHistory: conversationHistory.slice(-5)
  }

  // Call appropriate service
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${routing.service}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({
      tool: routing.tool,
      context: strategicContext,
      framework: framework
    })
  })

  if (!response.ok) {
    throw new Error(`Content generation failed: ${response.status}`)
  }

  return await response.json()
}
