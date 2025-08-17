import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.27.0'
import { corsHeaders } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// Enhanced system prompt with conversation persistence awareness
const NIV_SYSTEM_PROMPT = `You are Niv, a senior PR strategist with 20 years of experience at top agencies. You are a CONSULTATIVE STRATEGIST who MUST follow a strict consultation process.

## CONVERSATION PERSISTENCE AWARENESS
You have access to conversation history and strategic context that persists across sessions. Use this to:
- Reference previous discussions intelligently
- Build upon established strategic insights
- Avoid re-asking questions you already know the answers to
- Provide continuity in ongoing strategic relationships

## CRITICAL INSTRUCTION: THREE-PHASE APPROACH (MANDATORY)

You MUST follow these phases IN ORDER. NEVER skip phases or jump to creation without proper consultation.

### PHASE 1: DISCOVERY (MANDATORY - MINIMUM 2 EXCHANGES)
You MUST gather comprehensive information BEFORE offering to create anything. In your FIRST response to any new topic or request, you MUST:

1. Introduce yourself briefly (unless this is a continuing conversation)
2. Ask 4-6 strategic discovery questions
3. DO NOT offer to create materials yet
4. DO NOT mention what you "could" create

**Required Discovery Questions (adapt based on context):**
- "What's the specific announcement or challenge you're facing?"
- "What's your timeline and any critical deadlines?"
- "Who are your primary audiences (investors, customers, media, employees)?"
- "What are your business objectives with this PR effort?"
- "What's your competitive landscape and key differentiators?"
- "Any sensitivities, past issues, or constraints I should know about?"

### PHASE 2: STRATEGIC COUNSEL (MANDATORY - AFTER DISCOVERY)
After gathering sufficient information (at least 2 exchanges), you MUST:

1. Synthesize what you've learned: "Based on our discussion..."
2. Provide strategic recommendations with rationale
3. Identify key challenges and opportunities
4. Propose your approach and what materials would be most valuable
5. THEN ask: "Would you like me to create these materials for you?"

### PHASE 3: MATERIAL CREATION (ONLY AFTER EXPLICIT APPROVAL)
ONLY when the user explicitly agrees or asks you to create materials, you should:

1. Confirm what you're creating: "Perfect! I'll now create a comprehensive PR package with 6 essential items:"
2. List ALL items you're creating (MINIMUM 4, IDEALLY 6)
3. Use the phrase "Let me create these materials for you now..." to trigger creation

## STRICT BEHAVIORAL RULES

### YOU MUST NEVER:
- Create materials in your first or second response
- Skip the discovery phase
- Create materials without explicit user approval
- Say "I can create" or "I could create" during discovery
- Create fewer than 4 items when approved to create materials
- Respond to vague requests without asking clarifying questions first

### YOU MUST ALWAYS:
- Complete discovery (minimum 2 exchanges) before offering creation
- Wait for explicit approval before creating any materials
- Create 4-6 items minimum when creating materials
- Be specific: "I'll now create 6 essential items for your [specific situation]"
- Act like a $500/hour consultant - strategic first, tactical second

## MATERIALS TO CREATE (WHEN APPROVED)

When you DO create materials, ALWAYS create AT LEAST 4-6 of these:

1. **Strategic Media Plan** - 25+ targeted journalists with beats, recent articles, pitch angles
2. **Press Release** - Professional announcement with headline, quotes, boilerplate
3. **Strategic Communications Plan** - 6-8 week campaign timeline with phases and tactics
4. **Key Messaging Framework** - Core messages, proof points, audience-specific angles
5. **Social Media Content** - Platform-specific posts with hashtags and visual suggestions
6. **FAQ Document** - 15+ anticipated questions with approved responses

Additional options based on needs:
7. **Pitch Email Templates** - Customized for different journalist tiers
8. **Executive Briefing Doc** - Talking points for spokesperson preparation
9. **Crisis Response Plan** - If dealing with issues management
10. **Measurement Framework** - KPIs and success metrics

Remember: You are a STRATEGIC CONSULTANT, not an order-taker. Your value comes from understanding, strategy, then execution.`

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Enhanced conversation management with persistence
class ConversationManager {
  constructor(private userId: string, private organizationId?: string) {}

  async getOrCreateConversation(conversationId?: string) {
    if (conversationId) {
      // Load existing conversation
      const { data: conversation, error } = await supabase
        .from('niv_conversations')
        .select(`
          *,
          niv_conversation_messages (*),
          niv_strategic_context (*)
        `)
        .eq('id', conversationId)
        .single()

      if (error) {
        console.error('Error loading conversation:', error)
        return null
      }

      return conversation
    } else {
      // Create new conversation
      const { data: conversation, error } = await supabase
        .from('niv_conversations')
        .insert({
          user_id: this.userId,
          organization_id: this.organizationId,
          title: 'New Strategic Consultation',
          conversation_phase: 'discovery',
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating conversation:', error)
        return null
      }

      return conversation
    }
  }

  async saveMessage(conversationId: string, role: string, content: string, messageType = 'chat') {
    const { data, error } = await supabase
      .from('niv_conversation_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        message_type: messageType
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving message:', error)
      return null
    }

    return data
  }

  async updateConversationPhase(conversationId: string, phase: string) {
    const { error } = await supabase
      .from('niv_conversations')
      .update({ 
        conversation_phase: phase,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    if (error) {
      console.error('Error updating conversation phase:', error)
    }
  }

  async saveStrategicContext(conversationId: string, contextType: string, data: any, confidence = 0.8) {
    const { error } = await supabase
      .from('niv_strategic_context')
      .upsert({
        conversation_id: conversationId,
        context_type: contextType,
        extracted_data: data,
        confidence_score: confidence
      })

    if (error) {
      console.error('Error saving strategic context:', error)
    }
  }

  async saveWorkItems(conversationId: string, workItems: any[]) {
    const workItemsToInsert = workItems.map(item => ({
      conversation_id: conversationId,
      user_id: this.userId,
      organization_id: this.organizationId,
      title: item.title,
      description: item.description,
      work_item_type: item.type,
      generated_content: item.generatedContent,
      generation_context: {
        prompt: item.prompt || '',
        timestamp: new Date().toISOString()
      },
      status: 'generated'
    }))

    const { data, error } = await supabase
      .from('niv_work_items')
      .insert(workItemsToInsert)
      .select()

    if (error) {
      console.error('Error saving work items:', error)
      return []
    }

    return data
  }

  formatMessagesForClaude(messages: any[]) {
    return messages.map(msg => ({
      type: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
  }

  extractStrategicContext(messages: any[], response: string) {
    const context: any = {}
    const fullConversation = messages.map(m => m.content).join(' ') + ' ' + response

    // Extract company information
    const companyPattern = /company|organization|startup|business/gi
    if (companyPattern.test(fullConversation)) {
      context.company_mentioned = true
    }

    // Extract announcement type
    const announcementPattern = /launch|funding|partnership|acquisition|product|service/gi
    const announcementMatches = fullConversation.match(announcementPattern)
    if (announcementMatches) {
      context.announcement_type = announcementMatches[0]
    }

    // Extract industry
    const industryPattern = /tech|technology|ai|saas|fintech|healthcare|biotech|enterprise/gi
    const industryMatches = fullConversation.match(industryPattern)
    if (industryMatches) {
      context.industry = industryMatches[0]
    }

    // Extract audience mentions
    const audiencePattern = /investors|customers|media|employees|partners|users/gi
    const audienceMatches = fullConversation.match(audiencePattern)
    if (audienceMatches) {
      context.target_audiences = [...new Set(audienceMatches)]
    }

    return context
  }
}

// Enhanced Claude API caller with context awareness
async function callClaude(messages: any[], userMessage: string, strategicContext?: any) {
  try {
    let systemPrompt = NIV_SYSTEM_PROMPT

    // Enhance system prompt with strategic context if available
    if (strategicContext && Object.keys(strategicContext).length > 0) {
      systemPrompt += `\n\n## STRATEGIC CONTEXT FROM PREVIOUS CONVERSATIONS:\n${JSON.stringify(strategicContext, null, 2)}\n\nUse this context to provide more personalized and relevant guidance.`
    }

    const formattedMessages = [
      ...messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ]

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
        temperature: 0.8,
        system: systemPrompt,
        messages: formattedMessages,
        top_p: 0.9,
        top_k: 40,
        stop_sequences: [],
        metadata: {
          user_id: 'niv-orchestrator-enhanced'
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', response.status, errorText)
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    return data.content[0].text
  } catch (error) {
    console.error('Error calling Claude:', error)
    return generateFallbackResponse(userMessage)
  }
}

// Fallback response with discovery questions
function generateFallbackResponse(message: string) {
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

// Enhanced work item creation with better content generation
function generateContent(type: string, context: any) {
  const conversationContext = context?.conversationContext || {}
  const strategicContext = context?.strategicContext || {}
  
  switch(type) {
    case 'media-list':
      return {
        title: 'Strategic Media Plan',
        description: 'Targeted outreach strategy with tier-1 journalists',
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
            pitchAngle: strategicContext.industry === 'ai' ? 'AI transformation angle' : 'Industry innovation angle'
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
            pitchAngle: strategicContext.announcement_type === 'funding' ? 'Funding and growth story' : 'Business innovation story'
          }
        ],
        categories: {
          tier1: ['Top tech and business journalists'],
          trade: ['Industry-specific publications'],
          regional: ['Local market coverage'],
          influencers: ['Industry analysts and podcasters']
        }
      }

    case 'content-draft':
      const headline = strategicContext.announcement_type === 'funding' 
        ? 'Company Raises $XX Million to Accelerate Growth'
        : strategicContext.industry === 'ai'
        ? 'Company Launches AI Platform to Transform Business Operations'
        : 'Company Announces Revolutionary Solution for Industry Challenge'
      
      return {
        title: 'Press Release',
        type: 'press_release',
        headline: headline,
        subheadline: 'New solution delivers immediate ROI while reducing complexity',
        dateline: 'SAN FRANCISCO, CA',
        body: `FOR IMMEDIATE RELEASE

${headline}
New solution delivers immediate ROI while reducing complexity

[CITY, State] – [Date] – [Company Name], a leader in [industry], today announced ${strategicContext.announcement_type || 'the launch of [product/service name]'}, a groundbreaking solution that [key value proposition]. This innovation addresses [problem being solved] and has already demonstrated [key proof point] in early customer deployments.

"[Executive quote about vision and impact]," said [Executive Name], [Title] at [Company Name]. "[Additional context about why this matters now]."

Key features and benefits include:
• [Benefit 1]: [Brief description with specific metric or outcome]
• [Benefit 2]: [Brief description with specific metric or outcome]  
• [Benefit 3]: [Brief description with specific metric or outcome]
• [Benefit 4]: [Brief description with specific metric or outcome]

[Customer or partner validation paragraph with quote if available]

"[Customer testimonial about impact and results]," said [Customer Name], [Title] at [Customer Company]. "[Specific benefits realized]."

The solution is available immediately and includes [availability details]. Early adopters have reported [specific positive outcomes with percentages or metrics].

About [Company Name]
[Company boilerplate - 2-3 sentences about the company, mission, and achievements. Include founding year, key metrics, notable customers or investors]

For more information, visit [website] or contact:

Media Contact:
[Name]
[Title]
[Company Name]
[Email]
[Phone]
[Website]

###`,
        metadata: {
          wordCount: 350,
          readingTime: '2.5 min',
          tone: 'professional',
          targetAudience: 'media'
        }
      }

    case 'strategy-plan':
      return {
        title: 'Strategic Communications Plan',
        objective: `Drive awareness and adoption through strategic PR campaign for ${strategicContext.announcement_type || 'launch'}`,
        duration: '6 weeks',
        phases: [
          {
            phase: 'Foundation (Week 1)',
            activities: ['Message development', 'Asset creation', 'Media list building'],
            deliverables: ['Key messages', 'Press release', 'Media kit']
          },
          {
            phase: 'Pre-Launch (Weeks 2-3)',
            activities: ['Media outreach', 'Embargo briefings', 'Relationship building'],
            deliverables: ['Completed briefings', 'Embargo agreements']
          },
          {
            phase: 'Launch (Week 4)',
            activities: ['Announcement coordination', 'Media interviews', 'Social activation'],
            deliverables: ['Press coverage', 'Social engagement']
          },
          {
            phase: 'Post-Launch (Weeks 5-6)',
            activities: ['Follow-up stories', 'Thought leadership', 'Results analysis'],
            deliverables: ['Coverage report', 'Strategic insights']
          }
        ]
      }

    case 'key-messaging':
      return {
        title: 'Key Messaging Framework',
        description: 'Core messages and positioning for all communications',
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
              'Validated by leading industry experts'
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
          }
        ],
        audience_messages: {
          executives: 'Strategic advantage that drives competitive differentiation',
          technical: 'Elegant architecture with seamless integration',
          customers: 'Finally, a solution that just works - no complexity, just results',
          media: 'The story of how one company is reshaping an industry'
        }
      }

    case 'social-content':
      return {
        title: 'Social Media Content Package',
        description: 'Ready-to-post content for multiple platforms',
        platforms: {
          linkedin: {
            post: `🎆 Exciting Announcement!

After months of development and testing, we're thrilled to announce ${strategicContext.announcement_type || '[product/news]'}.

🎯 The Challenge:
[Problem being solved with specific context]

💡 Our Solution:
[Solution description tailored to conversation context]

📊 Early Results:
• [Metric 1 based on industry]
• [Metric 2 based on announcement type]
• [Metric 3 based on target audience]

What makes this different? [Key differentiator based on strategic context]

🔗 Learn more: [link]

#Innovation #Technology #BusinessTransformation`,
            hashtags: ['#Innovation', '#Technology', '#BusinessTransformation']
          },
          twitter: [
            { content: `🚀 Big news! We're ${strategicContext.announcement_type || 'launching [product]'} to solve [problem].

Here's why this matters: 🧵` },
            { content: `The problem: [Current situation based on conversation context]

It's costing businesses significantly and getting worse.` },
            { content: `Our solution: [Simple explanation based on strategic context]

✅ [Benefit 1]
✅ [Benefit 2]
✅ [Benefit 3]` }
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
                a: `Our platform [core functionality based on conversation context]. This enables [key benefit from strategic context].`
              },
              {
                q: 'How is this different from existing solutions?',
                a: `Unlike traditional approaches that [old way], we [new way based on strategic context]. This results in [specific improvements].`
              }
            ]
          },
          {
            category: 'Business & Implementation',
            questions: [
              {
                q: 'Who are your typical customers?',
                a: `We serve ${strategicContext.target_audiences?.join(', ') || '[customer profile]'}, particularly those who [specific needs].`
              },
              {
                q: 'How long does implementation take?',
                a: 'Typical implementation takes [timeframe based on complexity]. We provide comprehensive support to ensure smooth onboarding.'
              }
            ]
          }
        ]
      }

    default:
      return {
        title: `Generated ${type}`,
        content: 'Content generated based on conversation context',
        description: 'Custom material created from strategic insights'
      }
  }
}

// Detection logic for creation intent (reusing existing logic but enhanced)
function detectExplicitCreationIntent(response: string, messages: any[]) {
  const lowerResponse = response.toLowerCase()
  
  const strongCreationPhrases = [
    "i'll now create a comprehensive pr package",
    "let me create these materials for you now",
    "i'm now creating",
    "perfect! based on",
    "perfect! i'll now create",
    "excellent! i'll now create",
    "great! i'll now create"
  ]
  
  const consultationPhrases = [
    "let me understand",
    "tell me about", 
    "could you share",
    "what's your",
    "before we",
    "first, let me",
    "to better help",
    "few questions",
    "help me understand",
    "more about",
    "context",
    "to ensure i provide",
    "let me dig",
    "let me ask",
    "would you like me to create"
  ]
  
  if (consultationPhrases.some(phrase => lowerResponse.includes(phrase))) {
    console.log('🤔 Still in consultation phase - no creation yet')
    return []
  }
  
  const hasSubstantialContext = messages.length >= 4
  const userSharedDetails = messages.filter(m => 
    m.role === 'user' && m.content && m.content.length > 50
  ).length >= 2
  
  if (!hasSubstantialContext || !userSharedDetails) {
    console.log('📋 Not enough context yet - need more conversation')
    return []
  }
  
  const isCreating = strongCreationPhrases.some(phrase => lowerResponse.includes(phrase))
  const hasNumberedItems = /\d[)\.]\s*[A-Z]/g.test(response)
  
  if (!isCreating || !hasNumberedItems) {
    console.log('❌ No explicit creation commitment detected')
    return []
  }
  
  console.log('✅ Explicit creation commitment detected!')
  
  // Parse numbered items from response
  const createdItems = []
  const numberedPattern = /\d[)\.]\s*([^0-9\n]+?)(?=\d[)\.]|$)/gi
  const numberedMatches = response.matchAll(numberedPattern)
  
  for (const match of numberedMatches) {
    const item = match[1].toLowerCase().trim()
    
    if (item.includes('media plan') || item.includes('media list')) {
      createdItems.push({
        type: 'media-list',
        title: 'Strategic Media Plan',
        description: 'Targeted journalists and outreach strategy'
      })
    }
    
    if (item.includes('press release') || item.includes('announcement')) {
      createdItems.push({
        type: 'content-draft',
        title: 'Press Release',
        description: 'Professional announcement ready for distribution'
      })
    }
    
    if (item.includes('timeline') || item.includes('campaign') || item.includes('strategic') && item.includes('plan')) {
      createdItems.push({
        type: 'strategy-plan',
        title: 'Strategic Communications Plan',
        description: 'Comprehensive PR strategy with timeline'
      })
    }
    
    if (item.includes('messaging') || item.includes('talking points')) {
      createdItems.push({
        type: 'key-messaging',
        title: 'Key Messaging Framework',
        description: 'Core messages and talking points'
      })
    }
    
    if (item.includes('social') || item.includes('posts')) {
      createdItems.push({
        type: 'social-content',
        title: 'Social Media Content',
        description: 'Ready-to-post social content'
      })
    }
    
    if (item.includes('faq') || item.includes('question')) {
      createdItems.push({
        type: 'faq-document',
        title: 'FAQ Document',
        description: 'Frequently asked questions and responses'
      })
    }
  }
  
  // Ensure minimum of 4 items
  if (createdItems.length > 0 && createdItems.length < 4) {
    const defaultItems = [
      { type: 'media-list', title: 'Strategic Media Plan', description: 'Targeted journalists and outreach strategy' },
      { type: 'content-draft', title: 'Press Release', description: 'Professional announcement ready for distribution' },
      { type: 'strategy-plan', title: 'Strategic Communications Plan', description: 'Comprehensive PR strategy with timeline' },
      { type: 'key-messaging', title: 'Key Messaging Framework', description: 'Core messages and talking points' }
    ]
    
    defaultItems.forEach(defaultItem => {
      if (!createdItems.some(item => item.type === defaultItem.type)) {
        createdItems.push(defaultItem)
      }
    })
  }
  
  console.log('🎯 Detected creation of ' + createdItems.length + ' items:', createdItems.map(i => i.type))
  return createdItems
}

// Main Edge Function handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      message, 
      messages = [], 
      context = {}, 
      conversationId,
      userId,
      organizationId 
    } = await req.json()
    
    console.log('🔥 Enhanced Niv Orchestrator received:', { 
      message, 
      messagesCount: messages.length,
      conversationId,
      userId
    })

    // Initialize conversation manager
    const conversationManager = new ConversationManager(userId, organizationId)
    
    // Get or create conversation
    const conversation = await conversationManager.getOrCreateConversation(conversationId)
    if (!conversation) {
      throw new Error('Failed to load or create conversation')
    }

    const activeConversationId = conversation.id

    // Build strategic context from previous conversations
    let strategicContext = {}
    if (conversation.niv_strategic_context) {
      strategicContext = conversation.niv_strategic_context.reduce((acc, ctx) => {
        acc[ctx.context_type] = ctx.extracted_data
        return acc
      }, {})
    }

    // Use existing messages if loading conversation, or passed messages for new ones
    const conversationMessages = conversation.niv_conversation_messages || 
      conversationManager.formatMessagesForClaude(messages)

    // Get Niv's response with strategic context
    const response = await callClaude(conversationMessages, message, strategicContext)

    // Save user message
    await conversationManager.saveMessage(activeConversationId, 'user', message)
    
    // Save assistant response  
    await conversationManager.saveMessage(activeConversationId, 'assistant', response)

    // Extract and save strategic context
    const newStrategicContext = conversationManager.extractStrategicContext(
      [...conversationMessages, { content: message }, { content: response }], 
      response
    )
    
    if (Object.keys(newStrategicContext).length > 0) {
      await conversationManager.saveStrategicContext(
        activeConversationId, 
        'extracted_insights', 
        newStrategicContext
      )
    }

    // Detect conversation phase
    const messageCount = (conversation.niv_conversation_messages?.length || 0) + 2 // +2 for current exchange
    let phase = 'discovery'
    if (messageCount >= 4) {
      if (response.toLowerCase().includes('would you like me to create')) {
        phase = 'strategy'
      } else if (response.toLowerCase().includes("i'll now create") || response.toLowerCase().includes("let me create")) {
        phase = 'creation'
      }
    }
    
    await conversationManager.updateConversationPhase(activeConversationId, phase)

    // Check for work item creation
    const creationIntents = detectExplicitCreationIntent(response, conversationMessages)
    
    let workItems = []
    let savedWorkItems = []
    
    if (creationIntents.length > 0) {
      // Generate work items with enhanced context
      workItems = creationIntents.map(intent => {
        const generatedContent = generateContent(intent.type, { 
          conversationContext: context,
          strategicContext: { ...strategicContext, ...newStrategicContext },
          messages: conversationMessages,
          userMessage: message 
        })
        
        return {
          ...intent,
          generatedContent,
          prompt: message
        }
      })

      // Save work items to database
      savedWorkItems = await conversationManager.saveWorkItems(activeConversationId, workItems)
      
      // Update conversation to completed if work items created
      await conversationManager.updateConversationPhase(activeConversationId, 'completed')
    }

    const result = {
      response,
      workItems,
      conversationId: activeConversationId,
      conversationPhase: phase,
      strategicContext: { ...strategicContext, ...newStrategicContext },
      savedWorkItems: savedWorkItems.map(item => item.id),
      context: {
        ...context,
        conversationLength: messageCount
      }
    }
    
    console.log('✅ Enhanced Niv responding:', { 
      responseLength: response.length,
      workItemsCount: workItems.length,
      conversationId: activeConversationId,
      phase,
      savedWorkItemsCount: savedWorkItems.length
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
    console.error('Enhanced Niv Orchestrator error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: "I apologize, I encountered an issue. Let me try to help you another way. What PR challenge are you working on?",
        workItems: []
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    )
  }
})