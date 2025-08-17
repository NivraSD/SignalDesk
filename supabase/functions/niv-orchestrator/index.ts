// Niv AI Assistant - Natural conversational PR strategist
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Anthropic Claude for conversational AI
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

// Log deployment time to force reload
console.log('Niv Orchestrator deployed at:', new Date().toISOString())
console.log('API Key configured:', !!ANTHROPIC_API_KEY)

// Niv's personality - helpful AI assistant with memory
const NIV_SYSTEM_PROMPT = `You are Niv, an AI PR strategy assistant in SignalDesk.

CRITICAL CONTEXT AWARENESS:
- Pay close attention to the conversation history
- Remember what the user has already told you
- Don't ask for information that was already provided
- Build on previous responses rather than repeating yourself
- If you've already asked a question, wait for the answer before asking new ones

IMPROVED WORKFLOW:
- When users express needs like "I need media list" or ask for materials, acknowledge what they want FIRST
- Then offer to create what they requested along with complementary materials
- Ask 1-2 focused questions to improve what you create, not to delay creation
- Be more generous about creating materials when the intent is clear

IMPORTANT RULES:
- Be conversational and helpful
- Ask clarifying questions AFTER acknowledging their request
- Create materials when users express clear intent, even with limited details
- Keep responses concise (2-3 paragraphs max)
- Don't pretend to have years of experience or be human
- Focus on understanding AND delivering value quickly
- NEVER repeat the same response or question twice

When users mention specific needs:
- Acknowledge their request immediately
- Offer to create what they asked for plus related materials
- Ask 1-2 strategic questions to enhance what you create
- Remember and reference information from earlier in the conversation

Good response for "I need media list": "I'll create a targeted media list for you right away. I can also create a strategic plan, press release templates, and pitch email frameworks to support your outreach. Just to make this most effective - what's your main announcement or story angle?"

Bad responses: 
- Asking the same question twice
- Requiring extensive details before creating anything
- Giving the same response repeatedly`

// Call Claude API with conversation history
async function callClaude(messages: any[], userMessage: string) {
  try {
    if (!ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set')
      throw new Error('API key not configured')
    }

    // Filter out work-card messages and only keep user/assistant messages
    const claudeMessages = messages
      .filter(msg => msg.type === 'user' || msg.type === 'assistant')
      .filter(msg => msg.content && msg.content.trim() !== '') // Filter empty messages
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    
    claudeMessages.push({
      role: 'user',
      content: userMessage
    })

    console.log('Calling Claude API with', claudeMessages.length, 'messages (filtered from', messages.length, ')')

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        system: NIV_SYSTEM_PROMPT,
        messages: claudeMessages,
        max_tokens: 400,
        temperature: 0.7
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

// Fallback responses if Claude fails
function generateFallbackResponse(message: string) {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('strategic plan') || lowerMessage.includes('strategy')) {
    return "I can help create a strategic plan for your campaign. Could you tell me more about your goals, timeline, and target audience?"
  }
  if (lowerMessage.includes('media list') || lowerMessage.includes('journalist')) {
    return "I can build a targeted media list. What type of coverage are you looking for and which beats are most relevant?"
  }
  if (lowerMessage.includes('press release') || lowerMessage.includes('content')) {
    return "I can draft content for you. What's the announcement about and when do you plan to release it?"
  }
  
  return "How can I help with your PR needs? I can create strategic plans, media lists, press releases, and more."
}

// Detect what user wants to create - be VERY conservative
function detectCreationIntents(message: string, conversationContext: any) {
  const lowerMessage = message.toLowerCase()
  const intents = []
  const messages = conversationContext?.messages || []
  
  // Smart detection based on conversation context
  const hasMediaListContext = conversationContext?.hasConversationHistory && 
    messages.some(msg => msg.content && (
      msg.content.toLowerCase().includes('media list') ||
      msg.content.toLowerCase().includes('tech reporter') ||
      msg.content.toLowerCase().includes('journalist')
    ))
  
  const hasStrategyContext = conversationContext?.hasConversationHistory &&
    messages.some(msg => msg.content && (
      msg.content.toLowerCase().includes('strategic plan') ||
      msg.content.toLowerCase().includes('pr strategy') ||
      msg.content.toLowerCase().includes('campaign')
    ))
    
  const hasPressReleaseContext = conversationContext?.hasConversationHistory &&
    messages.some(msg => msg.content && (
      msg.content.toLowerCase().includes('press release') ||
      msg.content.toLowerCase().includes('write a press release') ||
      msg.content.toLowerCase().includes('draft a press release') ||
      msg.content.toLowerCase().includes('create a press release')
    ))
  
  // Expanded creation commands to catch natural language
  const explicitCreateCommands = [
    // Direct commands
    'create the media list',
    'generate the media list', 
    'build the media list',
    'make the media list',
    'create media list now',
    'generate media list now',
    'just create it',
    'just generate it',
    'create it now',
    'generate it now',
    'go ahead and create',
    'yes create it',
    'yes generate it',
    
    // Natural need expressions (most common)
    'i need media list',
    'i need the media list',
    'i need a media list',
    'need media list',
    'need the media list',
    'need a media list',
    'i need that media list',
    
    // Want expressions
    'i want media list',
    'i want the media list',
    'i want a media list',
    'want media list',
    'want the media list',
    
    // Can you expressions (polite requests)
    'can you create',
    'can you make',
    'can you build',
    'can you generate',
    'could you create',
    'could you make',
    'would you create',
    'will you create',
    
    // Natural follow-up expressions
    'sounds good',
    'let\'s do it',
    'that works',
    'perfect',
    'great idea',
    'exactly what i need',
    'that\'s what i need',
    
    // Material creation requests
    'create all the materials',
    'make all the materials',
    'build all the materials',
    'generate all the materials',
    'i need all the materials',
    'create the materials',
    'make the materials',
    'all the materials you mentioned',
    'materials you said you could create',
    'materials you offered',
    
    // General creation with context
    'create everything',
    'make everything',
    'build everything',
    'generate everything',
    'create them all',
    'make them all'
  ]
  
  const hasExplicitCommand = explicitCreateCommands.some(cmd => lowerMessage.includes(cmd))
  
  // User confirmation after Niv offers
  const isDirectConfirmation = conversationContext?.offeredToCreate && 
    (lowerMessage === 'yes' || lowerMessage === 'create it' || lowerMessage === 'generate it' ||
     lowerMessage === 'go ahead' || lowerMessage === 'do it' || lowerMessage === 'sure' ||
     lowerMessage.includes('yes, create') || lowerMessage.includes('yes, generate'))
  
  console.log('🔍 Creation Detection:', {
    message: lowerMessage,
    hasExplicitCommand,
    isDirectConfirmation,
    offeredToCreate: conversationContext?.offeredToCreate,
    explicitMatches: explicitCreateCommands.filter(cmd => lowerMessage.includes(cmd))
  })
  
  // DIRECT MATERIAL TYPE REQUESTS - be responsive to specific needs
  const directMaterialRequests = [
    { patterns: ['social media', 'social content', 'social posts', 'twitter', 'linkedin'], type: 'social-content' },
    { patterns: ['key messaging', 'messaging framework', 'talking points', 'key messages'], type: 'key-messaging' },
    { patterns: ['faq', 'q&a', 'questions and answers', 'frequently asked'], type: 'faq-document' },
    { patterns: ['media list', 'journalist list', 'press list', 'reporter list'], type: 'media-list' },
    { patterns: ['press release', 'announcement', 'press statement'], type: 'content-draft' },
    { patterns: ['strategic plan', 'strategy', 'communications plan', 'pr plan'], type: 'strategy-plan' }
  ];

  // Find which specific material type was requested
  const requestedMaterialType = directMaterialRequests.find(request => 
    request.patterns.some(pattern => lowerMessage.includes(pattern))
  );

  const hasDirectRequest = !!requestedMaterialType;

  // Only create if explicitly commanded, confirmed after offer, OR directly requesting specific material type
  if (!hasExplicitCommand && !isDirectConfirmation && !hasDirectRequest) {
    console.log('❌ Not creating - no explicit command, confirmation, or direct material request')
    return [] // Ask for more info instead
  }
  
  // Extract context from conversation for all creation paths
  const isAI = messages.some(msg => msg.content && msg.content.toLowerCase().includes('ai'))
  const isTier1 = messages.some(msg => msg.content && msg.content.toLowerCase().includes('tier'))
  
  // Determine what to create based on context, command, or direct request
  const shouldCreate = hasExplicitCommand || isDirectConfirmation || hasDirectRequest;

  // If there's a specific direct request, only create that material type
  if (hasDirectRequest && requestedMaterialType && !isDirectConfirmation) {
    // Only create the specifically requested material
    if (requestedMaterialType.type === 'media-list') {
      intents.push({
        type: 'media-list',
        title: isAI ? 'AI PR Media List' : 'Targeted Media List',
        description: isTier1 ? 
          'Tier 1, trade, and influential media for AI PR launch' :
          'Curated list of relevant journalists and outlets'
      })
    } else if (requestedMaterialType.type === 'strategy-plan') {
      intents.push({
        type: 'strategy-plan',
        title: 'Strategic Communications Plan',
        description: 'Comprehensive PR strategy with objectives, timeline, and key tactics'
      })
    } else if (requestedMaterialType.type === 'content-draft') {
      intents.push({
        type: 'content-draft',
        title: isAI ? 'AI Product Launch Press Release' : 'Press Release Draft',
        description: 'Professional announcement ready for distribution'
      })
    } else if (requestedMaterialType.type === 'social-content') {
      intents.push({
        type: 'social-content',
        title: 'Social Media Content Package',
        description: 'Ready-to-post content for social platforms'
      })
    } else if (requestedMaterialType.type === 'key-messaging') {
      intents.push({
        type: 'key-messaging',
        title: 'Key Messaging Framework',
        description: 'Core messages, talking points, and positioning statements'
      })
    } else if (requestedMaterialType.type === 'faq-document') {
      intents.push({
        type: 'faq-document',
        title: 'FAQ Document',
        description: 'Frequently asked questions and prepared responses'
      })
    }
  } else if (isDirectConfirmation || hasExplicitCommand) {
    // For confirmations and explicit commands, use the original logic
    // Media List
    if (lowerMessage.includes('media') || lowerMessage.includes('journalist') || hasMediaListContext) {
      intents.push({
        type: 'media-list',
        title: isAI ? 'AI PR Media List' : 'Targeted Media List',
        description: isTier1 ? 
          'Tier 1, trade, and influential media for AI PR launch' :
          'Curated list of relevant journalists and outlets'
      })
    }
    
    // Strategy Plan
    if (lowerMessage.includes('strategy') || lowerMessage.includes('plan') || hasStrategyContext) {
      intents.push({
        type: 'strategy-plan',
        title: 'Strategic Communications Plan',
        description: 'Comprehensive PR strategy with objectives, timeline, and key tactics'
      })
    }
    
    // Press Release
    if (lowerMessage.includes('press release') || lowerMessage.includes('write press') || 
         lowerMessage.includes('draft press') || lowerMessage.includes('create press') || lowerMessage.includes('announcement') || hasPressReleaseContext) {
      intents.push({
        type: 'content-draft',
        title: isAI ? 'AI Product Launch Press Release' : 'Press Release Draft',
        description: 'Professional announcement ready for distribution'
      })
    }

    // Social Media Content
    if (lowerMessage.includes('social') || lowerMessage.includes('twitter') || lowerMessage.includes('linkedin') || lowerMessage.includes('social media')) {
      intents.push({
        type: 'social-content',
        title: 'Social Media Content Package',
        description: 'Ready-to-post content for social platforms'
      })
    }

    // Key Messaging
    if (lowerMessage.includes('messaging') || lowerMessage.includes('key messages') || lowerMessage.includes('talking points')) {
      intents.push({
        type: 'key-messaging',
        title: 'Key Messaging Framework',
        description: 'Core messages, talking points, and positioning statements'
      })
    }

    // FAQ Document
    if (lowerMessage.includes('faq') || lowerMessage.includes('q&a') || lowerMessage.includes('questions')) {
      intents.push({
        type: 'faq-document',
        title: 'FAQ Document',
        description: 'Frequently asked questions and prepared responses'
      })
    }
  }
  
  // Handle comprehensive material requests - be more generous when user asks for "everything" or "all materials"
  const isRequestingAll = lowerMessage.includes('everything') || 
                         lowerMessage.includes('all the materials') ||
                         lowerMessage.includes('materials you mentioned') ||
                         lowerMessage.includes('materials you said') ||
                         lowerMessage.includes('materials you offered') ||
                         lowerMessage.includes('all materials') ||
                         lowerMessage.includes('create them all') ||
                         lowerMessage.includes('make them all') ||
                         lowerMessage.includes('comprehensive') ||
                         lowerMessage.includes('complete set') ||
                         lowerMessage.includes('full package')
  
  if (isRequestingAll && shouldCreate) {
    // Create comprehensive set of materials - be generous with what we include
    const allMaterials = []
    
    // Analyze what Niv mentioned in the conversation
    const conversationText = messages.map(m => m.content || '').join(' ').toLowerCase()
    
    // Always include core materials for comprehensive requests
    allMaterials.push({
      type: 'strategy-plan',
      title: 'Strategic Communications Plan',
      description: 'Comprehensive PR strategy with timeline and key tactics'
    })
    
    allMaterials.push({
      type: 'media-list',
      title: isAI ? 'AI PR Media List' : 'Targeted Media List',
      description: 'Curated list of relevant journalists and outlets'
    })
    
    // Be more generous with additional materials - include if there's ANY indication
    // Key messaging is commonly needed for PR campaigns
    if (conversationText.includes('key messag') || conversationText.includes('messaging') || 
        conversationText.includes('campaign') || conversationText.includes('launch') || isRequestingAll) {
      allMaterials.push({
        type: 'key-messaging',
        title: 'Key Messaging Framework',
        description: 'Core messages, talking points, and positioning statements'
      })
    }
    
    // FAQ is useful for media preparation
    if (conversationText.includes('faq') || conversationText.includes('q&a') || conversationText.includes('questions') ||
        conversationText.includes('media') || conversationText.includes('prepare') || isRequestingAll) {
      allMaterials.push({
        type: 'faq-document',
        title: 'FAQ Document',
        description: 'Frequently asked questions and prepared responses'
      })
    }
    
    // Social content is standard for modern PR
    if (conversationText.includes('social') || conversationText.includes('twitter') || conversationText.includes('linkedin') ||
        conversationText.includes('campaign') || conversationText.includes('launch') || isRequestingAll) {
      allMaterials.push({
        type: 'social-content',
        title: 'Social Media Content',
        description: 'Ready-to-post content for social platforms'
      })
    }
    
    // Only add press release if specifically mentioned (keep this conservative)
    if (conversationText.includes('press release') || conversationText.includes('announcement') ||
        conversationText.includes('launch announcement')) {
      allMaterials.push({
        type: 'content-draft',
        title: isAI ? 'AI Product Launch Press Release' : 'Press Release Draft',
        description: 'Professional announcement ready for distribution'
      })
    }
    
    console.log('🎯 Creating comprehensive materials:', allMaterials.map(m => m.type))
    return allMaterials
  }
  
  // Handle single-item requests
  if (lowerMessage.includes('everything') || lowerMessage.includes('all')) {
    if (intents.length === 0) {
      return [
        {
          type: 'strategy-plan',
          title: 'Strategic Communications Plan',
          description: 'Comprehensive PR strategy'
        },
        {
          type: 'media-list',
          title: 'Media Target List',
          description: 'Key journalists for your campaign'
        },
        {
          type: 'content-draft',
          title: 'Press Release',
          description: 'Launch announcement'
        }
      ]
    }
  }
  
  return intents
}

// Generate more detailed, substantial content
function generateContent(type: string, context: any) {
  const eventDetails = context?.eventDetails || {}
  const company = context?.company || 'the company'
  const timeline = context?.timeline || '4 weeks'
  
  switch(type) {
    case 'strategy-plan':
      return {
        title: eventDetails.name || 'Strategic Communications Plan',
        objective: eventDetails.objective || 'Maximize awareness and engagement for launch',
        timeline: {
          duration: timeline,
          milestones: [
            { 
              week: 1, 
              task: 'Foundation & Preparation',
              details: 'Finalize messaging, identify spokespersons, build media list, prepare materials',
              deliverables: ['Key messages doc', 'Media list', 'Spokesperson briefing'],
              status: 'pending' 
            },
            { 
              week: 2, 
              task: 'Pre-Launch Outreach',
              details: 'Conduct embargoed briefings, secure exclusive coverage, build anticipation',
              deliverables: ['Embargoed pitches', 'Exclusive offers', 'Social teasers'],
              status: 'pending' 
            },
            { 
              week: 3, 
              task: 'Launch Execution',
              details: 'Distribute announcement, conduct interviews, activate social channels',
              deliverables: ['Press release', 'Media interviews', 'Social campaign'],
              status: 'pending' 
            },
            { 
              week: 4, 
              task: 'Momentum & Follow-up',
              details: 'Pursue second-wave coverage, share results, maintain engagement',
              deliverables: ['Follow-up stories', 'Results metrics', 'Thank you notes'],
              status: 'pending' 
            }
          ]
        },
        keyMessages: [
          'Primary: ' + (eventDetails.mainMessage || 'Industry-leading innovation that solves critical challenges'),
          'Supporting: ' + (eventDetails.supportMessage || 'Proven results with measurable impact'),
          'Differentiator: ' + (eventDetails.differentiator || 'Unique approach that sets new standards')
        ],
        targetAudiences: [
          'Primary: ' + (eventDetails.primaryAudience || 'Industry decision-makers and influencers'),
          'Secondary: ' + (eventDetails.secondaryAudience || 'Potential customers and partners'),
          'Tertiary: Broader industry community and analysts'
        ],
        successMetrics: {
          reach: 'Target 10M+ impressions',
          coverage: 'Minimum 15 tier-1 media placements',
          engagement: '50K+ social interactions',
          leads: 'Generate 500+ qualified leads'
        }
      }
    
    case 'media-list':
      // Build NYC Tech/AI focused list based on context
      const isNYC = context?.messages?.some(m => m.content?.toLowerCase().includes('nyc')) || 
                    context?.location === 'NYC'
      const isAI = context?.messages?.some(m => m.content?.toLowerCase().includes('ai')) ||
                   context?.focus === 'AI'
                   
      const journalists = isNYC && isAI ? [
        { name: 'Kyle Wiggers', outlet: 'VentureBeat', beat: 'AI/ML - NYC', priority: 'Tier 1', email: 'kyle@venturebeat.com', lastContact: 'Never', notes: 'Covers AI product launches, based in NYC' },
        { name: 'Natasha Lomas', outlet: 'TechCrunch', beat: 'Enterprise Tech', priority: 'Tier 1', email: 'natasha@techcrunch.com', lastContact: 'Never', notes: 'Enterprise AI focus' },
        { name: 'Amanda Silberling', outlet: 'TechCrunch', beat: 'Consumer Tech/AI', priority: 'Tier 1', email: 'amanda@techcrunch.com', lastContact: 'Never', notes: 'Consumer AI products' },
        { name: 'Crain\'s Tech Team', outlet: 'Crain\'s New York', beat: 'NYC Tech', priority: 'Tier 1', email: 'tech@crainsnewyork.com', lastContact: 'Never', notes: 'Local NYC tech coverage' },
        { name: 'Built In NYC Editors', outlet: 'Built In NYC', beat: 'NYC Startups', priority: 'Tier 2', email: 'editorial@builtin.com', lastContact: 'Never', notes: 'NYC startup ecosystem' }
      ] : [
        { name: 'Sarah Chen', outlet: 'TechCrunch', beat: 'Enterprise & AI', priority: 'Tier 1', email: 'sarah@techcrunch.com', lastContact: 'Never', notes: 'Covers AI infrastructure' },
        { name: 'Michael Roberts', outlet: 'Wall Street Journal', beat: 'Technology', priority: 'Tier 1', email: 'mroberts@wsj.com', lastContact: 'Never', notes: 'Focus on business impact' },
        { name: 'Jennifer Liu', outlet: 'Forbes', beat: 'Startups', priority: 'Tier 1', email: 'jliu@forbes.com', lastContact: 'Never', notes: 'Interested in founder stories' },
        { name: 'David Park', outlet: 'VentureBeat', beat: 'AI/ML', priority: 'Tier 2', email: 'dpark@vb.com', lastContact: 'Never', notes: 'Technical deep-dives' },
        { name: 'Emily Watson', outlet: 'Bloomberg', beat: 'Investment', priority: 'Tier 1', email: 'ewatson@bloomberg.com', lastContact: 'Never', notes: 'VC and funding angles' }
      ]
      
      return {
        title: 'Strategic Media Targets',
        totalContacts: journalists.length,
        byTier: {
          tier1: journalists.filter(j => j.priority === 'Tier 1').length,
          tier2: journalists.filter(j => j.priority === 'Tier 2').length
        },
        journalists: journalists,
        outreachStrategy: {
          tier1: 'Exclusive briefings with embargoed access',
          tier2: 'Day-of announcement with supporting materials',
          timing: 'Begin outreach 2 weeks before launch'
        }
      }
    
    case 'content-draft':
      const headline = context?.headline || 'Company Announces Breakthrough Innovation'
      const location = context?.location || 'NEW YORK'
      const quote = context?.quote || '"This represents a fundamental shift in how our industry operates."'
      
      return {
        title: 'Press Release',
        status: 'Draft',
        wordCount: 450,
        content: `FOR IMMEDIATE RELEASE

${headline}

New Solution Addresses Critical Industry Challenges with Proven Results

${location} – [DATE] – ${company} today announced the launch of its revolutionary platform that transforms how organizations approach their most pressing challenges. The solution, developed over two years of intensive research and customer collaboration, delivers measurable improvements in efficiency, cost savings, and outcomes.

The platform addresses three critical pain points that have long plagued the industry: complexity in implementation, lack of real-time insights, and inability to scale effectively. Early adopters report 40% improvement in operational efficiency and 60% reduction in time-to-value.

${quote}

Key features include:
• Automated workflow optimization that reduces manual tasks by 70%
• Real-time analytics dashboard providing instant visibility
• Scalable architecture supporting organizations from 10 to 10,000+ users
• Enterprise-grade security with SOC 2 Type II certification

The solution is immediately available with flexible deployment options including cloud, on-premise, and hybrid configurations. Pricing starts at $99/month for small teams with enterprise packages available.

Customer momentum is strong with over 50 organizations already signed including three Fortune 500 companies. The company expects to triple its customer base within the next six months.

For more information, visit [website] or contact [email].

About ${company}
${company} is a leader in innovative solutions that help organizations achieve their goals more effectively. Founded in [year], the company serves over [number] customers worldwide.

###

Media Contact:
[Name]
[Title]
[Email]
[Phone]`
      }
    
    case 'key-messaging':
      return {
        title: 'Key Messaging Framework',
        status: 'Draft',
        sections: {
          coreMessage: 'Industry-leading innovation that transforms how organizations approach critical challenges',
          supportingMessages: [
            'Proven results with measurable 40% efficiency improvements',
            'Unique approach that sets new industry standards',
            'Trusted by Fortune 500 companies and growing startups alike'
          ],
          audienceMessaging: {
            executives: 'Strategic solution that drives measurable business outcomes',
            technicalTeams: 'Scalable platform with enterprise-grade security and reliability',
            customers: 'Intuitive solution that saves time and reduces complexity'
          },
          talkingPoints: [
            'Two years of intensive R&D with customer collaboration',
            '60% reduction in time-to-value for early adopters',
            'SOC 2 Type II certified with enterprise-grade security',
            'Flexible deployment: cloud, on-premise, or hybrid'
          ]
        }
      }
    
    case 'faq-document':
      return {
        title: 'FAQ Document',
        status: 'Draft',
        sections: {
          general: [
            {
              q: 'What makes this solution different from existing alternatives?',
              a: 'Our solution addresses three critical pain points that have long plagued the industry: implementation complexity, lack of real-time insights, and scaling challenges. Early adopters report 40% efficiency improvements.'
            },
            {
              q: 'How quickly can we see results?',
              a: 'Most customers see measurable improvements within the first month, with early adopters reporting 60% reduction in time-to-value compared to previous solutions.'
            }
          ],
          technical: [
            {
              q: 'What are the security and compliance features?',
              a: 'The platform includes SOC 2 Type II certification, enterprise-grade security, and supports cloud, on-premise, and hybrid deployments to meet various compliance requirements.'
            },
            {
              q: 'How does the platform scale?',
              a: 'Our scalable architecture supports organizations from 10 to 10,000+ users, with automated workflow optimization and real-time analytics.'
            }
          ],
          business: [
            {
              q: 'What is the pricing model?',
              a: 'Pricing starts at $99/month for small teams with enterprise packages available. We offer flexible deployment options to meet different organizational needs.'
            }
          ]
        }
      }
    
    case 'social-content':
      return {
        title: 'Social Media Content Package',
        status: 'Draft',
        platforms: {
          linkedin: [
            {
              type: 'announcement',
              content: '🚀 Excited to announce our breakthrough platform that\'s transforming how organizations tackle their biggest challenges. Early adopters are seeing 40% efficiency improvements. #Innovation #Technology',
              hashtags: ['#Innovation', '#Technology', '#Efficiency']
            },
            {
              type: 'thought_leadership',
              content: 'After 2 years of R&D and customer collaboration, we\'ve learned that the biggest barrier to success isn\'t technology—it\'s implementation complexity. Here\'s how we solved it: [thread]',
              hashtags: ['#ThoughtLeadership', '#ProblemSolving']
            }
          ],
          twitter: [
            {
              type: 'announcement',
              content: '🎉 Launching our revolutionary platform! 40% efficiency gains, 60% faster time-to-value. Built for teams of 10 to 10,000+. Starting at $99/month.',
              hashtags: ['#Launch', '#Efficiency', '#Innovation']
            }
          ],
          general: [
            {
              type: 'behind_the_scenes',
              content: '2 years of intensive development. Countless customer interviews. 3 Fortune 500 early adopters. Today we launch something that truly changes the game.',
              platforms: ['LinkedIn', 'Twitter', 'Facebook']
            }
          ]
        }
      }
    
    default:
      return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, context = {}, messages = [] } = await req.json()
    console.log('🔥 Niv Orchestrator received:', { message, messagesCount: messages.length, context })

    // Get conversational response
    let response = ''
    
    if (ANTHROPIC_API_KEY) {
      response = await callClaude(messages, message)
    } else {
      console.error('No ANTHROPIC_API_KEY, using fallback')
      response = generateFallbackResponse(message)
    }

    // Check if Niv offered to create something in the response
    const offeredToCreate = response.toLowerCase().includes('i can create') || 
                           response.toLowerCase().includes('i can help create') ||
                           response.toLowerCase().includes('would you like me to') ||
                           response.toLowerCase().includes('shall i create') ||
                           response.toLowerCase().includes('should i create')

    // Check if Niv previously offered to create something
    const previouslyOffered = messages.some(msg => 
      msg.type === 'assistant' && msg.content && (
        msg.content.toLowerCase().includes('i can create') ||
        msg.content.toLowerCase().includes('would you like me to') ||
        msg.content.toLowerCase().includes('shall i create')
      )
    )

    // Detect creation intents with conversation context
    const conversationContext = {
      ...context,
      messages: messages, // Pass messages to context
      offeredToCreate: offeredToCreate || previouslyOffered,
      conversationLength: messages.length,
      hasConversationHistory: messages.length > 0
    }
    
    const creationIntents = detectCreationIntents(message, conversationContext)
    
    // Generate detailed content for each intent with full context
    const workItems = creationIntents.map(intent => ({
      ...intent,
      generatedContent: generateContent(intent.type, { 
        ...context, 
        messages,
        userMessage: message 
      })
    }))
    
    const result = {
      response,
      showWork: creationIntents.length > 0,
      workItems: workItems,
      context: {
        ...context,
        conversationLength: messages.length + 1,
        offeredToCreate: offeredToCreate
      }
    }
    
    console.log('✅ Niv Orchestrator responding:', { 
      hasResponse: !!response, 
      workItemsCount: workItems.length,
      showWork: result.showWork,
      creationIntents: creationIntents.length,
      message: message 
    })
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        response: "I can help with your PR needs. What would you like me to create?",
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})