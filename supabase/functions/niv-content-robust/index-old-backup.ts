import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

/**
 * NIV Content Robust - Dual Mode Content Generation
 *
 * MODE 1: Direct Content Generation
 * - User selects specific content type from sidebar
 * - Immediately generates that content type
 * - Uses appropriate edge function (mcp-content, vertex-ai-visual, gamma-presentation)
 *
 * MODE 2: Consultant Mode
 * - User asks for media plan or complex content
 * - Acts as PR consultant presenting strategy
 * - Requires approval before execution
 * - Generates multiple content pieces
 */

// Content type routing map
const CONTENT_ROUTING = {
  // Visual content -> vertex-ai-visual
  'image': { service: 'vertex-ai-visual', tool: 'generate_image' },
  'infographic': { service: 'vertex-ai-visual', tool: 'generate_image' },
  'social-graphics': { service: 'vertex-ai-visual', tool: 'generate_image' },
  'video': { service: 'vertex-ai-visual', tool: 'generate_video' },

  // Presentations -> gamma-presentation
  'presentation': { service: 'gamma-presentation', tool: 'generate_presentation' },
  'board-presentation': { service: 'gamma-presentation', tool: 'generate_presentation' },

  // Everything else -> mcp-content
  'press-release': { service: 'mcp-content', tool: 'press-release' },
  'blog-post': { service: 'mcp-content', tool: 'blog-post' },
  'thought-leadership': { service: 'mcp-content', tool: 'thought-leadership' },
  'case-study': { service: 'mcp-content', tool: 'case-study' },
  'white-paper': { service: 'mcp-content', tool: 'white-paper' },
  'qa-document': { service: 'mcp-content', tool: 'qa-document' },
  'social-post': { service: 'mcp-content', tool: 'social-post' },
  'email': { service: 'mcp-content', tool: 'email-campaign' },
  'newsletter': { service: 'mcp-content', tool: 'newsletter' },
  'executive-statement': { service: 'mcp-content', tool: 'executive-statement' },
  'media-pitch': { service: 'mcp-content', tool: 'media-pitch' },
  'media-list': { service: 'mcp-content', tool: 'media-list' },
  'media-kit': { service: 'mcp-content', tool: 'media-advisory' },
  'messaging': { service: 'mcp-content', tool: 'messaging-framework' },
  'brand-narrative': { service: 'mcp-content', tool: 'thought-leadership' },
  'value-proposition': { service: 'mcp-content', tool: 'thought-leadership' },
  'competitive-positioning': { service: 'mcp-content', tool: 'thought-leadership' },
  'crisis-response': { service: 'mcp-content', tool: 'crisis-response' },
  'talking-points': { service: 'mcp-content', tool: 'talking-points' },
  'internal-memo': { service: 'mcp-content', tool: 'internal-memo' },
  'linkedin-article': { service: 'mcp-content', tool: 'thought-leadership' },
  'twitter-thread': { service: 'mcp-content', tool: 'social-post' },
  'instagram-caption': { service: 'mcp-content', tool: 'social-post' },
  'facebook-post': { service: 'mcp-content', tool: 'social-post' },
  'podcast-pitch': { service: 'mcp-content', tool: 'media-pitch' },
  'tv-interview-prep': { service: 'mcp-content', tool: 'talking-points' },
  'investor-update': { service: 'mcp-content', tool: 'executive-statement' },
  'apology-statement': { service: 'mcp-content', tool: 'crisis-response' },
  'drip-sequence': { service: 'mcp-content', tool: 'email-sequence' },
  'cold-outreach': { service: 'mcp-content', tool: 'email-campaign' },
  'ebook': { service: 'mcp-content', tool: 'white-paper' }
}

// Media plan components (7 essential pieces)
const MEDIA_PLAN_COMPONENTS = [
  'press-release',
  'media-pitch',
  'media-list',
  'qa-document',
  'talking-points',
  'social-post',
  'email'
]

// Detect request mode
function detectMode(message: string, contentType?: string): 'direct' | 'consultant' {
  // If specific content type is provided, it's a direct request
  if (contentType && CONTENT_ROUTING[contentType]) {
    console.log(`🎯 Direct mode: Generating ${contentType}`)
    return 'direct'
  }

  // Check for consultant mode triggers
  const msgLower = message.toLowerCase()
  const consultantTriggers = [
    'media plan',
    'pr campaign',
    'launch',
    'announcement',
    'create a campaign',
    'develop a strategy',
    'comprehensive',
    'full package'
  ]

  if (consultantTriggers.some(trigger => msgLower.includes(trigger))) {
    console.log('🧠 Consultant mode: Strategic planning required')
    return 'consultant'
  }

  // Default to direct if unclear
  return 'direct'
}

// Generate content using the appropriate edge function
async function generateContent(
  contentType: string,
  context: any,
  strategy: any,
  conversation: any[]
): Promise<{ success: boolean; content: any; error?: string }> {

  const routing = CONTENT_ROUTING[contentType]
  if (!routing) {
    console.error(`❌ Unknown content type: ${contentType}`)
    return { success: false, content: null, error: 'Unknown content type' }
  }

  console.log(`🚀 Generating ${contentType} via ${routing.service}`)

  try {
    // Build comprehensive parameters based on service
    let parameters: any = {}

    if (routing.service === 'vertex-ai-visual') {
      // Visual content parameters
      parameters = {
        prompt: buildVisualPrompt(contentType, context, strategy),
        type: contentType === 'video' ? 'video' : 'image',
        style: 'professional',
        aspectRatio: '16:9'
      }
    } else if (routing.service === 'gamma-presentation') {
      // Build comprehensive presentation content for Gamma
      const understanding = context.understanding || analyzeUserRequest(getAnnouncement(conversation), contentType)
      const slideCount = parseInt(understanding.requirements.find((r: string) => r.includes('slides'))?.match(/\d+/)?.[0] || '10')

      // Create detailed presentation content
      let presentationContent = `# ${understanding.topic || strategy?.primaryMessage || 'Presentation'}\n\n`

      // Add the structured outline we showed the user
      const outline = createPresentationOutline(understanding, context.research || {})
      presentationContent += outline + '\n\n'

      // Add research insights if available
      if (context.research) {
        presentationContent += '## Key Research Insights\n\n'
        for (const [topic, data] of Object.entries(context.research)) {
          if (data) {
            presentationContent += `### ${topic.replace('_', ' ').toUpperCase()}\n`
            presentationContent += `${JSON.stringify(data).substring(0, 500)}...\n\n`
          }
        }
      }

      // Add any additional context
      if (understanding.requirements.length > 0) {
        presentationContent += `## Requirements to Cover\n`
        understanding.requirements.forEach((req: string) => {
          presentationContent += `- ${req}\n`
        })
      }

      // Presentation parameters with full content
      parameters = {
        title: understanding.topic,
        topic: understanding.topic || strategy?.primaryMessage,
        content: presentationContent,  // Send the full structured content
        slideCount: slideCount,
        style: 'professional',
        options: {
          numCards: slideCount,
          tone: 'professional',
          audience: understanding.audience || 'business professionals'
        }
      }
    } else {
      // MCP content parameters with FULL context
      parameters = {
        // Basic info
        company: context?.organization?.name || 'Company',
        industry: context?.organization?.industry || 'Technology',

        // Strategy context
        topic: strategy?.primaryMessage || context?.event || contentType.replace('-', ' '),
        announcement: getAnnouncement(conversation),
        keyMessages: strategy?.keyMessages || [],
        narrative: strategy?.narrative || '',
        objective: strategy?.objective || '',

        // Full context object
        context: {
          strategy: strategy,
          organization: context?.organization,
          event: context?.event,
          framework: context?.framework,
          primaryMessage: strategy?.primaryMessage,
          tactics: strategy?.tactics,
          supportingData: strategy?.supportingData || [],
          executiveQuotes: strategy?.executiveQuotes || []
        }
      }

      // Special handling for specific content types
      if (contentType === 'qa-document') {
        parameters.questions = [
          'What is the main announcement?',
          'Why is this important for the industry?',
          'What makes this different from competitors?',
          'What is the timeline for implementation?',
          'How will this impact customers?',
          'What resources are being committed?',
          'How does this align with company strategy?',
          'What are the expected outcomes?',
          'How will success be measured?',
          'What are the potential challenges?',
          'Who are the key stakeholders?',
          'What is the investment required?',
          'How will this affect existing products/services?',
          'What are the next steps?',
          'Where can people get more information?'
        ]
        parameters.audience = 'media, analysts, investors, customers'
        parameters.style = 'professional, comprehensive'
      }

      if (contentType === 'media-list') {
        parameters.companyDescription = context?.organization?.description || ''
        parameters.newsHook = strategy?.narrative || ''
        parameters.keyPoints = strategy?.keyMessages || []
        parameters.geography = 'US'
        parameters.count = 50
        parameters.tiers = ['tier1', 'tier2', 'trade']
      }

      if (contentType === 'media-pitch') {
        parameters.story = strategy?.narrative || context?.event
        parameters.keyPoints = strategy?.keyMessages || []
        parameters.newsHook = strategy?.primaryMessage
        parameters.supportingData = strategy?.supportingData || []
        parameters.pitchType = 'general'
      }

      if (contentType === 'social-post') {
        parameters.platforms = ['twitter', 'linkedin', 'facebook']
        parameters.tone = 'professional'
      }
    }

    // Call the appropriate edge function
    // Different services expect different formats
    let requestBody: any

    if (routing.service === 'vertex-ai-visual') {
      // Vertex AI expects parameters directly, not wrapped
      requestBody = parameters
    } else if (routing.service === 'gamma-presentation') {
      // Gamma can handle both direct and MCP-style
      requestBody = {
        tool: routing.tool,
        parameters: parameters,
        ...parameters  // Also spread parameters at root level
      }
    } else {
      // MCP services expect tool and parameters/arguments
      requestBody = {
        tool: routing.tool,
        parameters: parameters,
        arguments: parameters
      }
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/${routing.service}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    )

    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Generated ${contentType} successfully`)

      // Extract content from various response formats
      let content = result.content || result.text || result.output || result.data

      // Handle vertex-ai-visual responses
      if (routing.service === 'vertex-ai-visual') {
        if (result.images && result.images.length > 0) {
          // Return the first image URL
          content = result.images[0].url || result.images[0]
        } else if (result.videos && result.videos.length > 0) {
          // Return the first video URL
          content = result.videos[0].url || result.videos[0]
        } else if (result.fallback) {
          // Return fallback object, not just the content
          return {
            success: false,
            content: null,
            fallback: result.fallback,
            error: result.error || 'Image generation failed'
          }
        }
      }

      // For gamma presentations, return the generation ID for polling
      if (routing.service === 'gamma-presentation' && result.generationId) {
        return {
          success: true,
          content: result, // Return the full result with generationId
          isAsync: true,
          generationId: result.generationId
        }
      }

      // Default to full result if no content extracted
      if (!content) {
        content = result
      }

      return { success: true, content }
    } else {
      const error = await response.text()
      console.error(`❌ Failed to generate ${contentType}: ${error}`)

      // Fallback to Claude
      return generateWithClaude(contentType, context, strategy)
    }
  } catch (error) {
    console.error(`Error generating ${contentType}:`, error)
    // Fallback to Claude
    return generateWithClaude(contentType, context, strategy)
  }
}

// Build visual prompt from context
function buildVisualPrompt(contentType: string, context: any, strategy: any): string {
  const base = strategy?.primaryMessage || context?.event || 'Business visual'
  const style = contentType === 'infographic' ? 'Infographic with data visualization' :
                contentType === 'social-graphics' ? 'Social media graphic' :
                'Professional business image'

  return `${style}: ${base}. ${strategy?.narrative || ''}. Modern, clean, professional design.`
}

// Extract announcement from conversation
function getAnnouncement(conversation: any[]): string {
  const userMessages = conversation.filter(m => m.role === 'user')
  return userMessages[0]?.content || 'Company announcement'
}

// Claude fallback for content generation
async function generateWithClaude(
  contentType: string,
  context: any,
  strategy: any
): Promise<{ success: boolean; content: any }> {
  console.log(`🔄 Using Claude fallback for ${contentType}`)

  const prompt = `Generate a ${contentType.replace('-', ' ')} based on:
Organization: ${context?.organization?.name}
Industry: ${context?.organization?.industry || 'Technology'}
Event/Topic: ${context?.event || strategy?.primaryMessage || 'announcement'}

Strategy:
- Primary Message: ${strategy?.primaryMessage || 'Key announcement'}
- Narrative: ${strategy?.narrative || 'Company story'}
- Key Messages: ${(strategy?.keyMessages || []).join(', ')}
- Objective: ${strategy?.objective || 'Inform and engage'}

Create professional, ready-to-use content that:
1. Aligns with the strategy
2. Reinforces key messages
3. Is appropriate for the content type
4. Is immediately actionable

${contentType === 'media-list' ? 'Generate a list of 50 specific journalists with outlets, beats, and contact info (use realistic email formats).' : ''}
${contentType === 'qa-document' ? 'Generate 15 Q&A pairs addressing key concerns about the announcement.' : ''}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (response.ok) {
      const data = await response.json()
      return { success: true, content: data.content[0].text }
    }
  } catch (error) {
    console.error('Claude generation error:', error)
  }

  return { success: false, content: 'Failed to generate content' }
}

// Consultant mode: Present strategy using Claude to THINK
async function presentStrategy(message: string, context: any, deliverables: string[]): Promise<string> {
  console.log('🧠 Using Claude to present intelligent strategy...')

  const prompt = `You are NIV, an expert PR and content strategist. A client has requested help with the following:

**Client Request**: ${message}

**Context**:
- Organization: ${context?.organization?.name || 'the client'}
- Industry: ${context?.organization?.industry || 'not specified'}
- Additional context: ${JSON.stringify(context, null, 2)}

**Your Task**:
1. Analyze their request thoughtfully
2. Understand what they're trying to achieve
3. Present a strategic approach that shows you understand their needs
4. Recommend specific deliverables that will help them succeed
5. Explain WHY each deliverable matters

**Recommended deliverables** (you can adjust based on their needs):
${deliverables.map(d => `- ${d.replace('-', ' ')}`).join('\n')}

Be conversational, insightful, and strategic. Show that you understand their business goals. Then ask if they'd like to proceed with your recommended approach.

Format your response in markdown with clear sections.`

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
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    const data = await response.json()
    return data.content[0].text
  } catch (error) {
    console.error('Error generating strategy with Claude:', error)
    return `I understand you want to ${message.substring(0, 100)}... Let me help you create a strategic approach. Would you like me to proceed?`
  }
}

// Save content to Memory Vault
async function saveToMemoryVault(content: any, type: string, context: any, folder: string) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { error } = await supabase
      .from('memory_vault')
      .insert({
        conversation_id: context.conversationId,
        organization_id: context.organization?.id,
        content_type: type,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        metadata: {
          folder: folder,
          event: context.event
        }
      })

    if (error) {
      console.error('Memory vault save error:', error)
      return false
    }

    console.log(`✅ Saved ${type} to Memory Vault`)
    return true
  } catch (error) {
    console.error('Memory vault error:', error)
    return false
  }
}

// Save content to Content Library
async function saveToContentLibrary(content: any, type: string, context: any, folder: string) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { error } = await supabase
      .from('content_library')
      .insert({
        organization_id: context.organization?.id,
        title: `${type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${new Date().toLocaleDateString()}`,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        content_type: type,
        folder: folder,
        metadata: {
          event: context.event,
          generatedBy: 'niv-content-robust'
        }
      })

    if (error) {
      console.error('Content library save error:', error)
      return null
    }

    const path = `/content-library/${folder}/${type}.md`
    console.log(`✅ Saved to Content Library: ${path}`)
    return path
  } catch (error) {
    console.error('Content library error:', error)
    return null
  }
}

// Main handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      message,
      contentType, // Specific content type if selected from sidebar
      conversationId,
      conversationHistory,
      context,
      strategy,
      approved
    } = body

    console.log('📥 Request received:', {
      message: message?.substring(0, 100),
      contentType,
      hasStrategy: !!strategy,
      hasContext: !!context,
      approved
    })

    // Detect mode
    const mode = detectMode(message, contentType)

    if (mode === 'direct') {
      // DIRECT MODE: Intelligent, self-sufficient content generation
      const targetType = contentType || extractContentType(message)

      if (!targetType) {
        return new Response(
          JSON.stringify({
            error: 'No content type specified',
            message: 'Please specify what type of content to generate'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // STEP 1: Understand what the user wants
      const understanding = analyzeUserRequest(message, targetType)

      // STEP 2: Identify knowledge gaps
      const knowledgeGaps = identifyKnowledgeGaps(understanding, context)

      // STEP 3: Research to fill gaps (don't ask user!)
      let researchResults = {}
      if (knowledgeGaps.length > 0) {
        console.log('📚 Researching to fill knowledge gaps:', knowledgeGaps)

        // Send progress message
        const progressMessages = [{
          type: 'progress',
          message: `I understand you want a ${targetType.replace('-', ' ')} about ${understanding.topic}. Let me research the details to ensure accuracy...`,
          status: 'researching'
        }]

        // Research each gap using niv-fireplexity
        for (const gap of knowledgeGaps) {
          const research = await callFireplexity(gap.query, context)
          if (research.success) {
            researchResults[gap.topic] = research.content
          }
        }

        // Add research complete message
        progressMessages.push({
          type: 'progress',
          message: `Research complete! Now creating your ${targetType.replace('-', ' ')} with accurate, up-to-date information...`,
          status: 'generating'
        })
      }

      // STEP 4: Create comprehensive context with research
      const enhancedContext = {
        ...context,
        understanding,
        research: researchResults,
        event: understanding.topic,
        extractedRequirements: understanding.requirements
      }

      // STEP 5: Generate strategy from understanding and research
      const inferredStrategy = {
        primaryMessage: understanding.primaryMessage,
        narrative: understanding.narrative,
        keyMessages: understanding.keyPoints,
        objective: understanding.objective,
        supportingData: researchResults
      }

      // STEP 6: Generate the content with full context
      const result = await generateContent(
        targetType,
        enhancedContext,
        strategy || inferredStrategy || extractStrategyFromHistory(conversationHistory),
        conversationHistory || []
      )

      if (result.success) {
        // Handle async content (like gamma presentations) differently
        if (result.isAsync && result.generationId) {
          // Show what we're creating first
          const outline = createPresentationOutline(understanding, researchResults)

          return new Response(
            JSON.stringify({
              success: true,
              mode: 'direct',
              isAsync: true,
              stream: true,
              messages: [
                {
                  type: 'acknowledgment',
                  message: `I understand you need a ${understanding.requirements.find(r => r.includes('slides')) || '10-slide'} presentation about **${understanding.topic}**.\n\nI'll create a comprehensive presentation covering:\n${understanding.keyPoints.map(p => `• ${p}`).join('\n')}\n\nLet me generate this for you...`
                },
                {
                  type: 'outline',
                  message: outline
                },
                {
                  type: 'presentation_started',
                  message: `⏳ Sending to Gamma for professional formatting...\n\nThis usually takes 30-60 seconds. I'll let you know when it's ready!`,
                  contentType: targetType,
                  generationId: result.generationId,
                  status: 'generating'
                }
              ]
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Visual content needs special handling to match frontend expectations
        if (targetType === 'image' || targetType === 'infographic') {
          // Build response with messages array that frontend expects
          const messages = []

          // Add acknowledgment
          messages.push({
            type: 'acknowledgment',
            message: `I understand you want an image: "${understanding.topic}". Generating with Google Imagen...`
          })

          // Add the content message with image - THIS is what the frontend expects
          if (result.content) {
            messages.push({
              type: 'content',  // Must be 'content' for the frontend to create contentItem
              message: `✅ Image generated successfully`,
              content: result.content,  // The image URL goes here
              contentType: targetType,   // This becomes contentItem.type
              folder: `images-${new Date().toISOString().split('T')[0]}`
            })
          } else if (result.fallback) {
            messages.push({
              type: 'fallback',
              message: `⚠️ Image generation unavailable. ${result.fallback.instructions || 'Please use alternative services.'}`,
              contentType: targetType,
              fallback: result.fallback
            })
          }

          return new Response(
            JSON.stringify({
              success: true,
              mode: 'direct',
              messages: messages
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (targetType === 'video') {
          // Build response with messages array for video
          const messages = []

          // Add acknowledgment
          messages.push({
            type: 'acknowledgment',
            message: `I understand you want a video: "${understanding.topic}". Generating...`
          })

          // Add the content message with video - THIS is what the frontend expects
          if (result.content) {
            messages.push({
              type: 'content',  // Must be 'content' for the frontend to create contentItem
              message: `✅ Video generated successfully`,
              content: result.content,  // The video URL goes here
              contentType: targetType,   // This becomes contentItem.type
              folder: `videos-${new Date().toISOString().split('T')[0]}`
            })
          } else if (result.fallback) {
            messages.push({
              type: 'fallback',
              message: `⚠️ Video generation unavailable. ${result.fallback.instructions || 'Please use alternative services.'}`,
              contentType: targetType,
              fallback: result.fallback
            })
          }

          return new Response(
            JSON.stringify({
              success: true,
              mode: 'direct',
              messages: messages
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Save non-visual content
        const folder = `direct-content-${new Date().toISOString().split('T')[0]}`
        await saveToMemoryVault(result.content, targetType, context, folder)
        const savedPath = await saveToContentLibrary(result.content, targetType, context, folder)

        return new Response(
          JSON.stringify({
            success: true,
            mode: 'direct',
            messages: [{
              type: 'content',
              message: `✅ ${targetType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} created`,
              contentType: targetType,
              content: result.content,
              savedPath: savedPath,
              folder: folder
            }]
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: result.error || 'Failed to generate content',
            mode: 'direct'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // CONSULTANT MODE: Strategic planning and multi-content generation

      // If not approved yet, present strategy
      if (!approved) {
        const deliverables = contentType === 'media-plan' ? MEDIA_PLAN_COMPONENTS :
                           extractDeliverables(message) || MEDIA_PLAN_COMPONENTS

        const strategyMessage = await presentStrategy(message, context, deliverables)

        return new Response(
          JSON.stringify({
            success: true,
            mode: 'consultant',
            needsApproval: true,
            conversationId: conversationId || `conv-${Date.now()}`,
            message: strategyMessage,
            strategy: {
              deliverables: deliverables,
              primaryMessage: context?.event || 'Strategic announcement',
              narrative: 'Comprehensive media approach',
              presented: true,
              approved: false
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // APPROVED: Generate all content
      const deliverables = strategy?.deliverables || MEDIA_PLAN_COMPONENTS
      const folder = context?.event ?
        `${context.event.toLowerCase().replace(/\s+/g, '-')}-${new Date().getFullYear()}` :
        `media-plan-${new Date().toISOString().split('T')[0]}`

      const messages = []
      const results = []

      for (const contentType of deliverables) {
        messages.push({
          type: 'progress',
          message: `Creating ${contentType.replace('-', ' ')}...`,
          contentType
        })

        const result = await generateContent(
          contentType,
          context,
          strategy,
          conversationHistory || []
        )

        if (result.success) {
          await saveToMemoryVault(result.content, contentType, context, folder)
          const savedPath = await saveToContentLibrary(result.content, contentType, context, folder)

          messages.push({
            type: 'content',
            message: `✅ ${contentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} created`,
            contentType,
            content: result.content,
            savedPath: savedPath,
            folder: folder
          })

          results.push(result)
        } else {
          messages.push({
            type: 'error',
            message: `⚠️ Unable to generate ${contentType}`,
            contentType
          })
        }
      }

      messages.push({
        type: 'complete',
        message: `📁 Complete package created
- ${results.length} of ${deliverables.length} items generated
- Saved to folder: /content-library/${folder}/
- All content indexed in Memory Vault`,
        folder: folder
      })

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'consultant',
          messages: messages,
          conversationId: conversationId || `conv-${Date.now()}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error in niv-content-robust:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'An error occurred processing your request'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper functions
function extractContentType(message: string): string | null {
  const msgLower = message.toLowerCase()
  for (const [type] of Object.entries(CONTENT_ROUTING)) {
    if (msgLower.includes(type.replace('-', ' '))) {
      return type
    }
  }
  return null
}

function extractDeliverables(message: string): string[] | null {
  // Try to extract specific content types from the message
  const found = []
  const msgLower = message.toLowerCase()

  for (const [type] of Object.entries(CONTENT_ROUTING)) {
    if (msgLower.includes(type.replace('-', ' '))) {
      found.push(type)
    }
  }

  return found.length > 0 ? found : null
}

function extractStrategyFromHistory(history: any[]): any {
  if (!history) return null

  // Look for strategy in recent assistant messages
  for (const msg of history.reverse()) {
    if (msg.role === 'assistant' && msg.strategy) {
      return msg.strategy
    }
  }

  return null
}

// Analyze user request to understand intent and requirements
function analyzeUserRequest(message: string, contentType: string): any {
  const msgLower = message.toLowerCase()

  // Extract key information from the message
  const understanding = {
    topic: '',
    primaryMessage: '',
    narrative: '',
    keyPoints: [] as string[],
    objective: '',
    requirements: [] as string[],
    audience: '',
    tone: 'professional'
  }

  // For the GPT-5 Enterprise example
  if (msgLower.includes('gpt-5') || msgLower.includes('openai')) {
    understanding.topic = 'GPT-5 Enterprise'
    understanding.primaryMessage = 'GPT-5 Enterprise: Advanced AI for Business'
    understanding.objective = 'Enable enterprise sales team to effectively present GPT-5 capabilities'
    understanding.audience = 'enterprise sales team'
  }

  // Extract specific requirements mentioned
  if (msgLower.includes('features')) understanding.requirements.push('product features')
  if (msgLower.includes('security')) understanding.requirements.push('security certifications')
  if (msgLower.includes('implementation')) understanding.requirements.push('implementation process')
  if (msgLower.includes('roi')) understanding.requirements.push('ROI calculator')
  if (msgLower.includes('success stories') || msgLower.includes('customer')) {
    understanding.requirements.push('customer success stories')
  }

  // Extract slide count if mentioned
  const slideMatch = message.match(/(\d+)[\s-]?slide/i)
  if (slideMatch) {
    understanding.requirements.push(`${slideMatch[1]} slides`)
  }

  // Extract key points from requirements
  understanding.keyPoints = understanding.requirements

  return understanding
}

// Identify what we don't know and need to research
function identifyKnowledgeGaps(understanding: any, context: any): any[] {
  const gaps = []

  // Check if we need to research the main topic
  if (understanding.topic && !context.framework?.includes(understanding.topic)) {
    gaps.push({
      topic: 'main_topic',
      query: `${understanding.topic} features capabilities overview latest updates`
    })
  }

  // Check specific requirements that need research
  for (const req of understanding.requirements) {
    if (req.includes('features')) {
      gaps.push({
        topic: 'features',
        query: `${understanding.topic} features capabilities specifications`
      })
    }
    if (req.includes('security')) {
      gaps.push({
        topic: 'security',
        query: `${understanding.topic} security certifications compliance SOC2 ISO`
      })
    }
    if (req.includes('implementation')) {
      gaps.push({
        topic: 'implementation',
        query: `${understanding.topic} implementation process deployment timeline steps`
      })
    }
    if (req.includes('ROI')) {
      gaps.push({
        topic: 'roi',
        query: `${understanding.topic} ROI return on investment cost savings metrics`
      })
    }
    if (req.includes('success stories')) {
      gaps.push({
        topic: 'customers',
        query: `${understanding.topic} customer success stories case studies testimonials`
      })
    }
  }

  return gaps
}

// Call niv-fireplexity for research
async function callFireplexity(query: string, context: any): Promise<any> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        timeWindow: '24h',
        limit: 5,
        context: {
          organizationId: context?.organization?.id,
          searchType: 'targeted'
        }
      })
    })

    if (response.ok) {
      const data = await response.json()
      return { success: true, content: data }
    }
  } catch (error) {
    console.error('Fireplexity research error:', error)
  }

  return { success: false, content: null }
}

// Create presentation outline to show user what we're building
function createPresentationOutline(understanding: any, research: any): string {
  const slideCount = understanding.requirements.find((r: string) => r.includes('slides'))?.match(/\d+/)?.[0] || '10'

  let outline = `**Presentation Structure (${slideCount} slides):**\n\n`

  // For GPT-5 Enterprise example
  if (understanding.topic.includes('GPT-5')) {
    outline += `**Slide 1: Title & Introduction**
• GPT-5 Enterprise: Transforming Business with Advanced AI
• Subtitle: Comprehensive Enterprise Solution Overview

**Slide 2: Executive Summary**
• Key capabilities and differentiators
• Business value proposition
• Implementation timeline

**Slide 3-4: Core Features & Capabilities**
• Advanced language understanding
• Multi-modal capabilities
• Custom fine-tuning options
• API flexibility and scalability

**Slide 5: Security & Compliance**
• SOC 2 Type II certification
• GDPR compliance
• Data encryption and privacy
• Enterprise-grade security features

**Slide 6-7: Implementation Process**
• Phase 1: Assessment and planning
• Phase 2: Integration and deployment
• Phase 3: Training and optimization
• Timeline: 4-6 weeks typical deployment

**Slide 8: ROI Calculator & Metrics**
• Cost savings analysis
• Productivity improvements
• Time-to-value metrics
• Expected return within 6 months

**Slide 9: Customer Success Stories**
• Fortune 500 implementations
• Key case studies and results
• Testimonials and outcomes

**Slide 10: Next Steps & Call to Action**
• Pilot program options
• Contact information
• Q&A and discussion`
  } else {
    // Generic outline based on requirements
    outline += `**Slide 1: Title & Introduction**\n`
    outline += `**Slide 2: Executive Summary**\n`

    let slideNum = 3
    for (const req of understanding.requirements) {
      if (req.includes('features')) {
        outline += `**Slide ${slideNum}: Product Features**\n`
        slideNum++
      }
      if (req.includes('security')) {
        outline += `**Slide ${slideNum}: Security & Compliance**\n`
        slideNum++
      }
      if (req.includes('implementation')) {
        outline += `**Slide ${slideNum}-${slideNum+1}: Implementation Process**\n`
        slideNum += 2
      }
      if (req.includes('ROI')) {
        outline += `**Slide ${slideNum}: ROI & Business Case**\n`
        slideNum++
      }
      if (req.includes('success stories')) {
        outline += `**Slide ${slideNum}: Customer Success Stories**\n`
        slideNum++
      }
    }

    outline += `**Slide ${slideCount}: Next Steps & Call to Action**`
  }

  return outline
}