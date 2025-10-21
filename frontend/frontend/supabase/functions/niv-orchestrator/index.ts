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

IMPORTANT: Your responses should be CONVERSATIONAL ONLY. Do NOT include the actual content like journalist lists, press releases, or detailed strategy plans in your response text. That content will be generated separately as work items.

IMPROVED WORKFLOW:
- When users express needs like "I need media list" or ask for materials, acknowledge what they want FIRST
- Then offer to create what they requested along with complementary materials
- Ask 1-2 focused questions to improve what you create, not to delay creation
- Be more generous about creating materials when the intent is clear

IMPORTANT RULES:
- Be conversational and helpful - DO NOT output actual content in your response
- Your response should just be conversational acknowledgment and guidance
- The actual generated content (media lists, press releases, etc.) will be created as work items
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
- Including actual journalist names, press release text, or detailed content in your response
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
        model: 'claude-haiku-4-5-20251001',
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
    return "I'll create a strategic plan for your campaign. To make this most effective, could you tell me more about your goals, timeline, and target audience?"
  }
  if (lowerMessage.includes('media list') || lowerMessage.includes('journalist')) {
    return "I'll build a targeted media list for you. What type of coverage are you looking for and which beats are most relevant to your announcement?"
  }
  if (lowerMessage.includes('press release') || lowerMessage.includes('content')) {
    return "I'll draft content for you. What's the announcement about and when do you plan to release it?"
  }
  
  return "How can I help with your PR needs? I can create strategic plans, media lists, press releases, and more."
}

// Detect what user wants to create - SIMPLIFIED AND MORE RELIABLE
function detectCreationIntents(message: string, conversationContext: any) {
  const lowerMessage = message.toLowerCase()
  const intents = []
  const messages = conversationContext?.messages || []
  
  console.log('🔍 SIMPLIFIED Creation Detection for message:', lowerMessage)
  
  // Extract context info
  const isAI = messages.some(msg => msg.content && msg.content.toLowerCase().includes('ai'))
  const isTier1 = messages.some(msg => msg.content && msg.content.toLowerCase().includes('tier'))
  
  // SIMPLIFIED DETECTION: Check for creation keywords + material types
  const isCreationRequest = 
    lowerMessage.includes('create') || 
    lowerMessage.includes('make') || 
    lowerMessage.includes('build') || 
    lowerMessage.includes('generate') || 
    lowerMessage.includes('need') || 
    lowerMessage.includes('want') || 
    lowerMessage.includes('can you') ||
    lowerMessage.includes('help me') ||
    lowerMessage === 'yes' ||
    lowerMessage === 'sure' ||
    lowerMessage === 'go ahead' ||
    lowerMessage.includes('sounds good') ||
    lowerMessage.includes('let\'s do it') ||
    conversationContext?.offeredToCreate
  
  console.log('🔍 Is creation request?', isCreationRequest)
  
  if (!isCreationRequest) {
    console.log('❌ Not a creation request - returning empty')
    return []
  }
  
  // MATERIAL TYPE DETECTION - Check what they want
  const materialTypes = [
    {
      keywords: ['media list', 'journalist', 'press list', 'reporter', 'media contact', 'press contact'],
      type: 'media-list',
      title: isAI ? 'AI PR Media List' : 'Targeted Media List',
      description: isTier1 ? 'Tier 1, trade, and influential media for AI PR launch' : 'Curated list of relevant journalists and outlets'
    },
    {
      keywords: ['strategic plan', 'strategy', 'communications plan', 'pr plan', 'campaign plan'],
      type: 'strategy-plan',
      title: 'Strategic Communications Plan',
      description: 'Comprehensive PR strategy with objectives, timeline, and key tactics'
    },
    {
      keywords: ['press release', 'announcement', 'press statement', 'news release'],
      type: 'content-draft',
      title: isAI ? 'AI Product Launch Press Release' : 'Press Release Draft',
      description: 'Professional announcement ready for distribution'
    },
    {
      keywords: ['social media', 'social content', 'social posts', 'twitter', 'linkedin'],
      type: 'social-content',
      title: 'Social Media Content Package',
      description: 'Ready-to-post content for social platforms'
    },
    {
      keywords: ['key messaging', 'messaging framework', 'talking points', 'key messages'],
      type: 'key-messaging',
      title: 'Key Messaging Framework',
      description: 'Core messages, talking points, and positioning statements'
    },
    {
      keywords: ['faq', 'q&a', 'questions and answers', 'frequently asked'],
      type: 'faq-document',
      title: 'FAQ Document',
      description: 'Frequently asked questions and prepared responses'
    }
  ]
  
  // Check if they want everything/all materials
  const wantsEverything = 
    lowerMessage.includes('everything') || 
    lowerMessage.includes('all') || 
    lowerMessage.includes('comprehensive') ||
    lowerMessage.includes('complete set') ||
    lowerMessage.includes('materials') && (lowerMessage.includes('all') || lowerMessage.includes('mentioned'))
  
  if (wantsEverything) {
    console.log('🎯 User wants everything - creating all materials')
    return materialTypes.map(mat => ({
      type: mat.type,
      title: mat.title,
      description: mat.description
    }))
  }
  
  // Check for specific material types requested
  const requestedMaterials = materialTypes.filter(material => 
    material.keywords.some(keyword => lowerMessage.includes(keyword))
  )
  
  if (requestedMaterials.length > 0) {
    console.log('🎯 Found specific materials:', requestedMaterials.map(m => m.type))
    return requestedMaterials.map(mat => ({
      type: mat.type,
      title: mat.title,
      description: mat.description
    }))
  }
  
  // If it's a creation request but no specific type, check conversation history
  const conversationText = messages.map(m => m.content || '').join(' ').toLowerCase()
  
  // Look for context clues in conversation
  const contextualMaterials = materialTypes.filter(material => 
    material.keywords.some(keyword => conversationText.includes(keyword))
  )
  
  if (contextualMaterials.length > 0) {
    console.log('🎯 Found contextual materials from conversation:', contextualMaterials.map(m => m.type))
    return contextualMaterials.map(mat => ({
      type: mat.type,
      title: mat.title,
      description: mat.description
    }))
  }
  
  // Fallback: if they said create/make but no specific type, offer media list as default
  if (isCreationRequest) {
    console.log('🎯 Fallback: creating default media list')
    return [{
      type: 'media-list',
      title: isAI ? 'AI PR Media List' : 'Targeted Media List',
      description: 'Curated list of relevant journalists and outlets'
    }]
  }
  
  console.log('❌ No materials detected - returning empty')
  return []
}

// Generate more detailed, substantial content
function generateContent(type: string, context: any) {
  const eventDetails = context?.eventDetails || {}
  const company = context?.company || 'the company'
  const timeline = context?.timeline || '4 weeks'
  
  switch(type) {
    case 'strategy-plan':
      // Determine campaign type based on context
      const isAIStrategy = context?.messages?.some(m => m.content?.toLowerCase().includes('ai')) ||
                          context?.userMessage?.toLowerCase().includes('ai')
      const isFintechStrategy = context?.messages?.some(m => m.content?.toLowerCase().includes('fintech')) ||
                               context?.userMessage?.toLowerCase().includes('fintech')
      const isProductLaunch = context?.messages?.some(m => 
        m.content?.toLowerCase().includes('launch') || 
        m.content?.toLowerCase().includes('product') ||
        m.content?.toLowerCase().includes('announcement')
      )
      
      const strategyConfig = isAIStrategy ? {
        objective: 'Establish market leadership in AI innovation and drive enterprise adoption',
        primaryAudience: 'Enterprise CTOs, IT Directors, and AI/ML decision-makers',
        secondaryAudience: 'Tech industry analysts, AI researchers, and developer communities',
        keyMessage: 'Revolutionary AI platform that transforms enterprise operations with proven 40% efficiency gains',
        industryContext: 'AI/ML enterprise solutions market',
        competitiveAdvantage: 'First-to-market enterprise AI platform with proven ROI and seamless integration'
      } : isFintechStrategy ? {
        objective: 'Disrupt payment processing market and capture fintech innovator mindshare',
        primaryAudience: 'Financial services executives, payment processors, and fintech founders',
        secondaryAudience: 'Banking technology leaders, regulatory compliance officers, and investors',
        keyMessage: 'Next-generation payment platform reducing costs by 60% while improving security and compliance',
        industryContext: 'Financial technology and payment processing market',
        competitiveAdvantage: 'Only payment platform combining cost reduction, security, and regulatory compliance'
      } : {
        objective: 'Maximize market awareness and drive customer acquisition for technology platform',
        primaryAudience: 'Enterprise technology decision-makers and business operations leaders',
        secondaryAudience: 'Industry analysts, technology media, and potential partners',
        keyMessage: 'Breakthrough technology platform delivering measurable efficiency improvements',
        industryContext: 'Enterprise technology solutions market',
        competitiveAdvantage: 'Unique combination of ease-of-use, scalability, and proven business results'
      }

      return {
        title: eventDetails.name || `Strategic Communications Plan - ${isAIStrategy ? 'AI Platform Launch' : isFintechStrategy ? 'Fintech Platform Launch' : 'Technology Platform Launch'}`,
        objective: strategyConfig.objective,
        executiveSummary: `Comprehensive 8-week communications strategy to ${strategyConfig.objective.toLowerCase()}. This plan leverages multi-channel approach targeting ${strategyConfig.primaryAudience.toLowerCase()} through strategic media relations, thought leadership, and digital engagement.`,
        
        timeline: {
          duration: '8 weeks',
          phases: [
            {
              phase: 'Pre-Launch Foundation',
              weeks: '1-2',
              goal: 'Establish foundation and build anticipation',
              milestones: [
                { 
                  week: 1, 
                  task: 'Strategy Foundation & Asset Creation',
                  details: 'Finalize messaging framework, create core materials, identify spokespersons, build comprehensive media list',
                  deliverables: [
                    'Key messaging framework document',
                    'Comprehensive media contact database (150+ journalists)',
                    'Executive spokesperson training materials',
                    'Press release draft',
                    'FAQ document',
                    'Demo video script'
                  ],
                  owner: 'PR Team + Marketing',
                  status: 'pending',
                  budget: '$15,000'
                },
                { 
                  week: 2, 
                  task: 'Content Development & Stakeholder Alignment',
                  details: 'Complete all content creation, conduct stakeholder reviews, finalize go-to-market materials',
                  deliverables: [
                    'Final press release',
                    'Social media content calendar (4 weeks)',
                    'Analyst briefing deck',
                    'Customer case study materials',
                    'Website launch page updates',
                    'Sales enablement materials'
                  ],
                  owner: 'Full Marketing Team',
                  status: 'pending',
                  budget: '$25,000'
                }
              ]
            },
            {
              phase: 'Pre-Launch Outreach',
              weeks: '3-4',
              goal: 'Generate anticipation and secure key coverage commitments',
              milestones: [
                { 
                  week: 3, 
                  task: 'Tier-1 Media & Analyst Briefings',
                  details: 'Conduct embargoed briefings with top-tier media and analysts, secure exclusive coverage commitments',
                  deliverables: [
                    'Completed briefings with 15 tier-1 journalists',
                    'Analyst briefings (Gartner, Forrester, IDC)',
                    'Exclusive coverage commitments from 5+ major outlets',
                    'Embargo agreements and timeline confirmations',
                    'Executive interview scheduling'
                  ],
                  owner: 'PR Lead + Executives',
                  status: 'pending',
                  budget: '$10,000'
                },
                { 
                  week: 4, 
                  task: 'Influencer & Community Engagement',
                  details: 'Engage industry influencers, activate beta customer advocates, build community anticipation',
                  deliverables: [
                    'Industry influencer outreach (20+ key voices)',
                    'Beta customer case study interviews',
                    'LinkedIn thought leadership content series launch',
                    'Industry newsletter placements',
                    'Conference speaking opportunity confirmations'
                  ],
                  owner: 'PR Team + Customer Success',
                  status: 'pending',
                  budget: '$8,000'
                }
              ]
            },
            {
              phase: 'Launch Execution',
              weeks: '5-6',
              goal: 'Execute coordinated launch and maximize immediate impact',
              milestones: [
                { 
                  week: 5, 
                  task: 'Launch Day Execution',
                  details: 'Coordinate press release distribution, media interviews, social activation, and stakeholder communications',
                  deliverables: [
                    'Press release distribution (PR Newswire + targeted)',
                    '10+ executive media interviews',
                    'Social media campaign launch (all platforms)',
                    'Customer testimonial video releases',
                    'Partner co-marketing activations',
                    'Sales team enablement session'
                  ],
                  owner: 'Full Team',
                  status: 'pending',
                  budget: '$20,000'
                },
                { 
                  week: 6, 
                  task: 'Momentum Amplification',
                  details: 'Amplify initial coverage, conduct follow-up interviews, maintain social engagement',
                  deliverables: [
                    'Follow-up interviews with 8+ additional outlets',
                    'Industry podcast appearances (3+ shows)',
                    'Webinar series launch',
                    'Customer success story amplification',
                    'Thought leadership article publications',
                    'First-week results summary'
                  ],
                  owner: 'PR + Content Teams',
                  status: 'pending',
                  budget: '$12,000'
                }
              ]
            },
            {
              phase: 'Sustaining Momentum',
              weeks: '7-8',
              goal: 'Maintain visibility and drive continued engagement',
              milestones: [
                { 
                  week: 7, 
                  task: 'Second-Wave Coverage & Thought Leadership',
                  details: 'Pursue follow-up stories, analysis pieces, and establish ongoing thought leadership',
                  deliverables: [
                    'Industry trend analysis articles',
                    'Competitive comparison stories',
                    'Use case deep-dive features',
                    'Conference presentation confirmations',
                    'Industry award submissions',
                    'Analyst report briefings'
                  ],
                  owner: 'PR Team + Executives',
                  status: 'pending',
                  budget: '$15,000'
                },
                { 
                  week: 8, 
                  task: 'Results Analysis & Ongoing Strategy',
                  details: 'Analyze campaign performance, document results, plan ongoing communications strategy',
                  deliverables: [
                    'Comprehensive results analysis report',
                    'Media coverage compilation and analysis',
                    'Lead generation and conversion tracking',
                    'Ongoing communications calendar',
                    'Lessons learned documentation',
                    'Next quarter strategy recommendations'
                  ],
                  owner: 'Marketing Leadership',
                  status: 'pending',
                  budget: '$5,000'
                }
              ]
            }
          ]
        },
        
        keyMessages: {
          primary: strategyConfig.keyMessage,
          supporting: [
            'Proven results with measurable ROI from Fortune 500 early adopters',
            'Enterprise-grade security, scalability, and compliance built-in',
            'Seamless integration with existing workflows and systems',
            'Industry-leading customer support and implementation success'
          ],
          differentiators: [
            strategyConfig.competitiveAdvantage,
            'Two years of customer-driven development and validation',
            'Immediate value delivery with measurable business impact',
            'Comprehensive solution addressing industry-wide challenges'
          ],
          audienceSpecific: {
            executives: 'Strategic technology investment that delivers immediate ROI and competitive advantage',
            technicalTeams: 'Advanced platform built with enterprise requirements and developer experience in mind',
            analysts: 'Market-defining innovation that addresses fundamental industry transformation needs',
            customers: 'Intuitive solution that eliminates complexity while delivering powerful capabilities'
          }
        },
        
        targetAudiences: {
          primary: {
            segment: strategyConfig.primaryAudience,
            tactics: [
              'Direct executive interviews with tier-1 business media',
              'Industry conference keynotes and panel participation',
              'LinkedIn thought leadership content targeting decision-makers',
              'Analyst briefings and research participation',
              'Customer advisory board testimonials'
            ],
            channels: ['WSJ, Forbes, Bloomberg', 'TechCrunch, VentureBeat', 'Industry publications', 'LinkedIn, Twitter', 'Industry conferences'],
            messaging: 'Strategic technology investment delivering measurable business transformation'
          },
          secondary: {
            segment: strategyConfig.secondaryAudience,
            tactics: [
              'Technical deep-dive articles and whitepapers',
              'Developer community engagement and documentation',
              'Industry trade publication features',
              'Webinar series and educational content',
              'Partner ecosystem collaboration'
            ],
            channels: ['Technical publications', 'Developer communities', 'Trade media', 'Webinars', 'Partner channels'],
            messaging: 'Innovative technical solution solving real industry challenges'
          },
          tertiary: {
            segment: 'Broader industry community, potential talent, and general tech audience',
            tactics: [
              'Company culture and team spotlight content',
              'Behind-the-scenes development stories',
              'Industry trend analysis and commentary',
              'Community engagement and support',
              'Recruiting and talent acquisition content'
            ],
            channels: ['Social media', 'Company blog', 'Industry forums', 'Talent platforms', 'Community events'],
            messaging: 'Innovative company building the future of technology solutions'
          }
        },
        
        tacticalExecution: {
          mediaRelations: {
            tier1Strategy: 'Exclusive access and embargoed briefings 1 week before announcement',
            tier2Strategy: 'Day-of announcement with comprehensive materials and interview availability',
            tier3Strategy: 'Follow-up outreach with additional angles and expert availability',
            keyTactics: [
              'Executive media training and message discipline',
              'Embargo management and exclusive offer coordination',
              'Real-time media monitoring and rapid response',
              'Follow-up interview scheduling and coordination',
              'Media relationship building for ongoing coverage'
            ]
          },
          digitalStrategy: {
            socialMedia: 'Coordinated multi-platform campaign with platform-specific content',
            contentMarketing: 'Thought leadership articles, case studies, and educational content',
            seoStrategy: 'Optimized content for key industry search terms and trends',
            paidAmplification: 'Targeted LinkedIn and Twitter promotion for key content',
            communityEngagement: 'Active participation in industry forums and discussions'
          },
          eventStrategy: {
            ownedEvents: 'Launch webinar series and virtual customer showcases',
            industryEvents: 'Conference speaking opportunities and booth presence',
            mediaEvents: 'Press briefings and analyst days',
            partnerEvents: 'Joint launches and co-marketing opportunities',
            awards: 'Industry award submissions and recognition campaigns'
          }
        },
        
        successMetrics: {
          reach: {
            target: 'Achieve 25M+ total impressions across all channels',
            breakdown: {
              tier1Media: '15M+ impressions from major outlet coverage',
              socialMedia: '5M+ impressions from social content',
              digitalContent: '3M+ impressions from owned content',
              paidAmplification: '2M+ impressions from paid promotion'
            }
          },
          coverage: {
            target: 'Secure 25+ high-quality media placements',
            breakdown: {
              tier1: '8+ major business/tech publication features',
              tier2: '12+ industry trade publication coverage',
              tier3: '5+ additional industry and regional coverage'
            }
          },
          engagement: {
            target: 'Generate 100K+ total engagements',
            breakdown: {
              social: '75K+ social media engagements',
              website: '15K+ website visits from PR efforts',
              video: '10K+ video views and demo requests'
            }
          },
          businessImpact: {
            leads: 'Generate 1,000+ qualified marketing leads',
            pipeline: 'Create $2M+ in qualified sales pipeline',
            trials: 'Drive 200+ product trial sign-ups',
            customers: 'Convert 25+ new enterprise customers'
          }
        },
        
        budgetBreakdown: {
          total: '$110,000',
          distribution: {
            mediaRelations: '$30,000 (PR agency fees, media events)',
            contentCreation: '$25,000 (Video, design, copywriting)',
            distribution: '$20,000 (Wire services, paid amplification)',
            events: '$15,000 (Virtual events, conference participation)',
            analytics: '$10,000 (Monitoring tools, measurement)',
            miscellaneous: '$10,000 (Travel, materials, contingency)'
          }
        },
        
        riskMitigation: {
          competitorResponse: 'Monitor competitor activities and prepare rapid response messaging',
          negativeReception: 'Develop crisis communication protocols and response messaging',
          techIssues: 'Ensure technical stability with backup communication plans',
          mediaGatekeeping: 'Diversify media relationships and develop alternative channels',
          marketTiming: 'Monitor market conditions and adjust timing as needed'
        }
      }
    
    case 'media-list':
      // Build comprehensive media list based on context
      const isNYC = context?.messages?.some(m => m.content?.toLowerCase().includes('nyc')) || 
                    context?.location === 'NYC'
      const isAI = context?.messages?.some(m => m.content?.toLowerCase().includes('ai')) ||
                   context?.focus === 'AI' ||
                   context?.userMessage?.toLowerCase().includes('ai')
      const isFintech = context?.messages?.some(m => m.content?.toLowerCase().includes('fintech')) ||
                        context?.focus === 'Fintech' ||
                        context?.userMessage?.toLowerCase().includes('fintech')
                   
      let journalists = []
      
      // AI-focused media list
      if (isAI) {
        journalists = [
          { 
            name: 'Kyle Wiggers', 
            outlet: 'VentureBeat', 
            beat: 'AI/ML', 
            priority: 'Tier 1', 
            email: 'kyle@venturebeat.com', 
            phone: '+1-555-0101',
            twitter: '@kyle_l_wiggers',
            lastContact: 'Never', 
            notes: 'Leading AI product launch coverage, focuses on enterprise AI applications',
            recentStories: ['OpenAI Enterprise Launch', 'Google AI Updates', 'Microsoft Copilot Analysis'],
            preferredPitchStyle: 'Technical details with clear business value proposition'
          },
          { 
            name: 'Natasha Lomas', 
            outlet: 'TechCrunch', 
            beat: 'Enterprise AI & Privacy', 
            priority: 'Tier 1', 
            email: 'natasha@techcrunch.com', 
            phone: '+1-555-0102',
            twitter: '@riptari',
            lastContact: 'Never', 
            notes: 'Enterprise AI focus with strong privacy angle, EU perspective',
            recentStories: ['GDPR AI Compliance', 'Enterprise AI Adoption', 'Data Privacy in AI'],
            preferredPitchStyle: 'Privacy and compliance angles, enterprise impact'
          },
          { 
            name: 'Amanda Silberling', 
            outlet: 'TechCrunch', 
            beat: 'Consumer AI & Social Impact', 
            priority: 'Tier 1', 
            email: 'amanda@techcrunch.com', 
            phone: '+1-555-0103',
            twitter: '@asilberling',
            lastContact: 'Never', 
            notes: 'Consumer AI products, social media, creator economy',
            recentStories: ['AI Creator Tools', 'Social Media AI Features', 'Consumer AI Safety'],
            preferredPitchStyle: 'User experience focus, social impact angle'
          },
          { 
            name: 'Ron Miller', 
            outlet: 'TechCrunch', 
            beat: 'Enterprise SaaS & AI', 
            priority: 'Tier 1', 
            email: 'ron@techcrunch.com', 
            phone: '+1-555-0104',
            twitter: '@ron_miller',
            lastContact: 'Never', 
            notes: 'Enterprise AI platforms, B2B automation, workflow tools',
            recentStories: ['Salesforce AI Features', 'Enterprise Automation', 'B2B AI Tools'],
            preferredPitchStyle: 'Enterprise ROI, automation benefits'
          },
          { 
            name: 'Frederic Lardinois', 
            outlet: 'TechCrunch', 
            beat: 'Developer Tools & AI Infrastructure', 
            priority: 'Tier 2', 
            email: 'frederic@techcrunch.com', 
            phone: '+1-555-0105',
            twitter: '@fredericl',
            lastContact: 'Never', 
            notes: 'AI developer tools, APIs, cloud infrastructure',
            recentStories: ['Azure AI Services', 'OpenAI API Updates', 'AI Development Platforms'],
            preferredPitchStyle: 'Technical depth, developer experience'
          },
          { 
            name: 'Emil Protalinski', 
            outlet: 'VentureBeat', 
            beat: 'AI Research & Analysis', 
            priority: 'Tier 1', 
            email: 'emil@venturebeat.com', 
            phone: '+1-555-0106',
            twitter: '@emilprotalinski',
            lastContact: 'Never', 
            notes: 'AI research breakthroughs, deep technical analysis',
            recentStories: ['GPT-4 Analysis', 'AI Research Papers', 'Model Performance Studies'],
            preferredPitchStyle: 'Research-backed claims, technical innovation'
          },
          { 
            name: 'Khari Johnson', 
            outlet: 'VentureBeat', 
            beat: 'AI Ethics & Responsible AI', 
            priority: 'Tier 2', 
            email: 'khari@venturebeat.com', 
            phone: '+1-555-0107',
            twitter: '@kharijohnson',
            lastContact: 'Never', 
            notes: 'AI ethics, bias mitigation, responsible AI deployment',
            recentStories: ['AI Bias Studies', 'Responsible AI Frameworks', 'Ethics in AI Development'],
            preferredPitchStyle: 'Ethics angle, responsible development practices'
          },
          { 
            name: 'Dean Takahashi', 
            outlet: 'VentureBeat', 
            beat: 'AI in Gaming & Entertainment', 
            priority: 'Tier 2', 
            email: 'dean@venturebeat.com', 
            phone: '+1-555-0108',
            twitter: '@deantak',
            lastContact: 'Never', 
            notes: 'AI applications in gaming, entertainment, and media',
            recentStories: ['AI Game Development', 'Entertainment AI Tools', 'Gaming Industry AI'],
            preferredPitchStyle: 'Entertainment angle, gaming applications'
          }
        ]
        
        // Add NYC-specific AI journalists if relevant
        if (isNYC) {
          journalists.push(
            { 
              name: 'Crain\'s Tech Team', 
              outlet: 'Crain\'s New York Business', 
              beat: 'NYC Tech & AI', 
              priority: 'Tier 1', 
              email: 'tech@crainsnewyork.com', 
              phone: '+1-212-555-0109',
              twitter: '@crainsnewyork',
              lastContact: 'Never', 
              notes: 'Local NYC tech coverage, AI startups, business impact',
              recentStories: ['NYC AI Startups', 'Tech Industry NYC', 'AI Business Impact'],
              preferredPitchStyle: 'Local NYC angle, business impact'
            },
            { 
              name: 'Built In NYC Editorial', 
              outlet: 'Built In NYC', 
              beat: 'NYC Startup Ecosystem', 
              priority: 'Tier 2', 
              email: 'editorial@builtin.com', 
              phone: '+1-212-555-0110',
              twitter: '@builtinnyc',
              lastContact: 'Never', 
              notes: 'NYC startup ecosystem, tech hiring, company culture',
              recentStories: ['NYC Startup Growth', 'Tech Hiring NYC', 'Company Spotlights'],
              preferredPitchStyle: 'Startup story, hiring angle, company culture'
            }
          )
        }
      } else if (isFintech) {
        // Fintech-focused media list
        journalists = [
          { 
            name: 'Mary Ann Azevedo', 
            outlet: 'TechCrunch', 
            beat: 'Fintech & Payments', 
            priority: 'Tier 1', 
            email: 'maryann@techcrunch.com', 
            phone: '+1-555-0201',
            twitter: '@m_azevedo',
            lastContact: 'Never', 
            notes: 'Leading fintech coverage, payments, lending, investment platforms',
            recentStories: ['Stripe Updates', 'Fintech Funding Rounds', 'Payment Innovation'],
            preferredPitchStyle: 'Market impact, user adoption metrics'
          },
          { 
            name: 'Ryan Lawler', 
            outlet: 'TechCrunch', 
            beat: 'Financial Services Tech', 
            priority: 'Tier 1', 
            email: 'ryan@techcrunch.com', 
            phone: '+1-555-0202',
            twitter: '@ryanlawler',
            lastContact: 'Never', 
            notes: 'Banking tech, wealth management, financial infrastructure',
            recentStories: ['Banking API Innovation', 'Wealth Tech Platforms', 'Financial Infrastructure'],
            preferredPitchStyle: 'Infrastructure innovation, banking partnerships'
          },
          { 
            name: 'Alex Johnson', 
            outlet: 'American Banker', 
            beat: 'Banking Technology', 
            priority: 'Tier 1', 
            email: 'alex.johnson@americanbanker.com', 
            phone: '+1-555-0203',
            twitter: '@alexh_johnson',
            lastContact: 'Never', 
            notes: 'Banking technology, regulatory compliance, digital transformation',
            recentStories: ['Digital Banking Adoption', 'Regulatory Technology', 'Bank Tech Partnerships'],
            preferredPitchStyle: 'Regulatory compliance, bank adoption'
          }
        ]
      } else {
        // General tech media list
        journalists = [
          { 
            name: 'Sarah Perez', 
            outlet: 'TechCrunch', 
            beat: 'Consumer Tech & Mobile', 
            priority: 'Tier 1', 
            email: 'sarah@techcrunch.com', 
            phone: '+1-555-0301',
            twitter: '@sarahintampa',
            lastContact: 'Never', 
            notes: 'Consumer tech, mobile apps, social platforms',
            recentStories: ['App Store Updates', 'Social Media Features', 'Mobile Innovation'],
            preferredPitchStyle: 'Consumer adoption, user experience'
          },
          { 
            name: 'Alex Wilhelm', 
            outlet: 'TechCrunch+', 
            beat: 'Venture Capital & Funding', 
            priority: 'Tier 1', 
            email: 'alex@techcrunch.com', 
            phone: '+1-555-0302',
            twitter: '@alex',
            lastContact: 'Never', 
            notes: 'Venture funding, startup valuations, market analysis',
            recentStories: ['VC Funding Trends', 'Startup Valuations', 'Market Analysis'],
            preferredPitchStyle: 'Funding angle, market opportunity'
          },
          { 
            name: 'Emily Watson', 
            outlet: 'Bloomberg Technology', 
            beat: 'Tech Investment & Markets', 
            priority: 'Tier 1', 
            email: 'ewatson@bloomberg.com', 
            phone: '+1-555-0303',
            twitter: '@emily_watson',
            lastContact: 'Never', 
            notes: 'Tech investments, IPOs, public market analysis',
            recentStories: ['Tech IPO Performance', 'Investment Trends', 'Market Analysis'],
            preferredPitchStyle: 'Financial metrics, market impact'
          },
          { 
            name: 'Jordan Novet', 
            outlet: 'CNBC', 
            beat: 'Enterprise Technology', 
            priority: 'Tier 1', 
            email: 'jordan.novet@cnbc.com', 
            phone: '+1-555-0304',
            twitter: '@jordannovet',
            lastContact: 'Never', 
            notes: 'Enterprise tech, cloud computing, large tech companies',
            recentStories: ['Cloud Computing Growth', 'Enterprise Software', 'Big Tech News'],
            preferredPitchStyle: 'Enterprise adoption, cloud strategy'
          },
          { 
            name: 'Lauren Feiner', 
            outlet: 'CNBC', 
            beat: 'Tech Policy & Regulation', 
            priority: 'Tier 2', 
            email: 'lauren.feiner@cnbc.com', 
            phone: '+1-555-0305',
            twitter: '@lauren_feiner',
            lastContact: 'Never', 
            notes: 'Tech regulation, privacy, antitrust, policy impact',
            recentStories: ['Tech Regulation Updates', 'Privacy Legislation', 'Antitrust Cases'],
            preferredPitchStyle: 'Regulatory compliance, policy implications'
          }
        ]
      }
      
      return {
        title: 'Strategic Media Targets',
        totalContacts: journalists.length,
        byTier: {
          tier1: journalists.filter(j => j.priority === 'Tier 1').length,
          tier2: journalists.filter(j => j.priority === 'Tier 2').length
        },
        byBeat: journalists.reduce((acc, j) => {
          acc[j.beat] = (acc[j.beat] || 0) + 1
          return acc
        }, {}),
        journalists: journalists,
        outreachStrategy: {
          tier1: 'Exclusive briefings with embargoed access, 2 weeks before announcement',
          tier2: 'Day-of announcement with supporting materials and follow-up',
          tier3: 'Follow-up outreach 1 week after announcement with additional angles',
          timing: 'Begin outreach 2 weeks before launch',
          bestDays: 'Tuesday-Thursday, avoid Mondays and Fridays',
          bestTimes: '10AM-12PM ET, 2PM-4PM ET'
        },
        pitchTemplates: {
          exclusive: 'Subject: Exclusive Preview - [Company] Breakthrough in [Technology]\n\nHi [Name],\n\nI hope this finds you well. Given your excellent coverage of [beat], I wanted to offer you an exclusive preview of [Company]\'s latest innovation...',
          embargo: 'Subject: Under Embargo Until [Date] - [Company] Major Announcement\n\nHi [Name],\n\nI\'m reaching out with an embargoed announcement from [Company] that I believe would be of interest to your [outlet] readers...',
          followUp: 'Subject: Follow-up - [Company] Story Opportunity\n\nHi [Name],\n\nI wanted to follow up on the [Company] announcement we shared last week. I have additional insights and data that might be relevant...'
        }
      }
    
    case 'content-draft':
      // Extract context for more personalized content
      const isAIProduct = context?.messages?.some(m => m.content?.toLowerCase().includes('ai')) ||
                         context?.userMessage?.toLowerCase().includes('ai')
      const isFintechProduct = context?.messages?.some(m => m.content?.toLowerCase().includes('fintech')) ||
                              context?.userMessage?.toLowerCase().includes('fintech')
      const hasSpecificProduct = context?.messages?.some(m => 
        m.content?.toLowerCase().includes('product') || 
        m.content?.toLowerCase().includes('platform') ||
        m.content?.toLowerCase().includes('tool')
      )
      
      const headline = context?.headline || 
        (isAIProduct ? 'Company Launches Revolutionary AI Platform to Transform Enterprise Operations' :
         isFintechProduct ? 'Fintech Startup Unveils Next-Generation Payment Platform' :
         'Company Announces Breakthrough Technology Platform')
      
      const location = context?.location || 'NEW YORK'
      const subheadline = isAIProduct ? 
        'Advanced AI Technology Delivers 40% Efficiency Gains and Transforms Industry Operations' :
        isFintechProduct ?
        'Revolutionary Payment Solution Reduces Transaction Costs by 60% While Improving Security' :
        'Innovative Platform Addresses Critical Industry Challenges with Proven Results'
      
      const ceoQuote = context?.quote || 
        (isAIProduct ? '"This AI platform represents the future of enterprise operations. We\'re not just automating tasks – we\'re fundamentally reimagining how work gets done."' :
         isFintechProduct ? '"We\'re solving the payment industry\'s biggest challenges while making financial services more accessible and secure for everyone."' :
         '"This represents a fundamental shift in how our industry operates and delivers value to customers."')
      
      const industryContext = isAIProduct ? 
        'The artificial intelligence market is projected to reach $1.8 trillion by 2030, driven by enterprise demand for automation and intelligent decision-making tools.' :
        isFintechProduct ?
        'The global fintech market is expected to grow to $1.5 trillion by 2030, fueled by digital transformation and demand for seamless financial services.' :
        'Industry analysts predict significant growth in the technology solutions market, driven by digital transformation initiatives.'
      
      const productDetails = isAIProduct ? {
        features: [
          'Advanced machine learning algorithms that adapt to organizational workflows',
          'Natural language processing for intuitive user interactions',
          'Predictive analytics providing actionable business insights',
          'Enterprise-grade AI security with bias detection and mitigation',
          'Seamless integration with existing enterprise systems'
        ],
        benefits: '40% improvement in operational efficiency, 60% reduction in manual processing time, and 25% increase in decision-making speed',
        pricing: 'Starting at $299/month for teams, with enterprise packages available'
      } : isFintechProduct ? {
        features: [
          'Real-time payment processing with sub-second transaction speeds',
          'Advanced fraud detection using machine learning',
          'Multi-currency support with competitive exchange rates',
          'Regulatory compliance across 50+ jurisdictions',
          'API-first architecture for seamless integration'
        ],
        benefits: '60% reduction in transaction costs, 99.9% uptime, and 50% faster settlement times',
        pricing: 'Competitive transaction-based pricing starting at 0.5% per transaction'
      } : {
        features: [
          'Automated workflow optimization reducing manual tasks by 70%',
          'Real-time analytics dashboard providing instant visibility',
          'Scalable architecture supporting organizations from 10 to 10,000+ users',
          'Enterprise-grade security with SOC 2 Type II certification',
          'Flexible deployment options: cloud, on-premise, or hybrid'
        ],
        benefits: '40% improvement in operational efficiency and 60% reduction in time-to-value',
        pricing: 'Starting at $99/month for small teams with enterprise packages available'
      }
      
      const customerTraction = isAIProduct ?
        'Leading organizations including Fortune 500 enterprises are already leveraging the platform, with early adopters reporting transformational results within 30 days of implementation.' :
        isFintechProduct ?
        'Over 100 financial institutions and fintech companies are in various stages of implementation, processing over $10M in transactions during the beta period.' :
        'Customer momentum is strong with over 50 organizations already signed including three Fortune 500 companies.'
        
      const futureOutlook = isAIProduct ?
        'The company plans to expand AI capabilities with advanced reasoning and multimodal processing, targeting 1000+ enterprise customers by 2025.' :
        isFintechProduct ?
        'The platform will expand to support additional financial products including lending, insurance, and wealth management by Q2 2025.' :
        'The company expects to triple its customer base within the next six months with continued product innovation.'

      return {
        title: 'Press Release Draft',
        status: 'Draft',
        wordCount: 650,
        type: isAIProduct ? 'AI Product Launch' : isFintechProduct ? 'Fintech Platform Launch' : 'Technology Platform Launch',
        content: `FOR IMMEDIATE RELEASE

${headline}

${subheadline}

${location} – ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${company} today announced the launch of its revolutionary platform that transforms how organizations approach their most pressing challenges. The solution, developed over two years of intensive research and customer collaboration, delivers measurable improvements in efficiency, cost savings, and operational outcomes.

${industryContext}

The platform addresses critical pain points that have long challenged organizations across industries. Early adopters report ${productDetails.benefits}, demonstrating the solution's immediate and substantial impact on business operations.

${ceoQuote} said [CEO Name], Chief Executive Officer of ${company}.

**Key Platform Features:**
${productDetails.features.map(feature => `• ${feature}`).join('\n')}

**Proven Results:**
The platform has undergone extensive testing with leading organizations, consistently delivering measurable improvements:
• Operational efficiency improvements of 40-60%
• Significant reduction in manual processing time
• Enhanced decision-making speed and accuracy
• Improved customer satisfaction scores
• Reduced operational costs and increased ROI

**Availability and Pricing:**
The solution is immediately available with multiple deployment options to meet diverse organizational needs. ${productDetails.pricing}. Implementation support and training are included with all packages.

**Industry Validation:**
${customerTraction} The solution has been validated by independent analysts and industry experts who recognize its potential to reshape standard operating procedures.

**Future Innovation:**
${futureOutlook}

**About ${company}:**
${company} is a leader in innovative technology solutions that help organizations achieve their operational goals more effectively. Founded in [year], the company is dedicated to developing cutting-edge platforms that drive measurable business outcomes. Based in ${location}, ${company} serves customers across multiple industries and geographical regions.

For more information about the platform and its capabilities, visit [company website] or contact the sales team at [sales email].

###

**Media Contact:**
[Contact Name]
[Title]
${company}
Phone: [Phone Number]
Email: [Email Address]

**Investor Contact:**
[IR Contact Name]
[Title]
${company}
Phone: [Phone Number]
Email: [IR Email Address]

**High-resolution images, product demos, and additional resources are available in our digital press kit at [press kit URL].**`,
        
        // Additional structured data for media use
        metadata: {
          category: isAIProduct ? 'Artificial Intelligence' : isFintechProduct ? 'Financial Technology' : 'Enterprise Technology',
          tags: isAIProduct ? ['AI', 'Machine Learning', 'Enterprise Software', 'Automation'] :
                isFintechProduct ? ['Fintech', 'Payments', 'Financial Services', 'API'] :
                ['Technology', 'Enterprise Software', 'Business Solutions', 'SaaS'],
          targetAudience: 'Enterprise decision-makers, technology leaders, industry analysts',
          keyMessaging: [
            'Industry-leading innovation with proven results',
            'Immediate value delivery with measurable ROI',
            'Enterprise-grade security and scalability',
            'Customer-validated solution with strong traction'
          ]
        },
        
        distributionStrategy: {
          tier1: ['Major tech publications', 'Industry trade media', 'Business journals'],
          tier2: ['Regional business publications', 'Vertical industry media'],
          timing: 'Tuesday-Thursday, 9AM-11AM ET for maximum coverage',
          embargo: 'Offer exclusive access to tier-1 media 24-48 hours before general release'
        }
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
      // Determine content theme based on context
      const isAISocial = context?.messages?.some(m => m.content?.toLowerCase().includes('ai')) ||
                        context?.userMessage?.toLowerCase().includes('ai')
      const isFintechSocial = context?.messages?.some(m => m.content?.toLowerCase().includes('fintech')) ||
                             context?.userMessage?.toLowerCase().includes('fintech')
      
      const themeConfig = isAISocial ? {
        mainHashtags: ['#AI', '#MachineLearning', '#Enterprise', '#Innovation', '#Automation'],
        industryHashtags: ['#TechInnovation', '#DigitalTransformation', '#FutureOfWork'],
        productType: 'AI platform',
        benefits: '40% efficiency gains through intelligent automation',
        audience: 'enterprise leaders and tech innovators'
      } : isFintechSocial ? {
        mainHashtags: ['#Fintech', '#Payments', '#FinancialServices', '#Innovation', '#API'],
        industryHashtags: ['#DigitalBanking', '#PaymentTech', '#FinancialInnovation'],
        productType: 'payment platform',
        benefits: '60% cost reduction with faster, secure transactions',
        audience: 'financial services professionals and fintech leaders'
      } : {
        mainHashtags: ['#Innovation', '#Technology', '#Enterprise', '#SaaS', '#Productivity'],
        industryHashtags: ['#DigitalTransformation', '#BusinessSolutions', '#TechNews'],
        productType: 'enterprise platform',
        benefits: '40% efficiency improvements and streamlined operations',
        audience: 'business leaders and technology professionals'
      }
      
      return {
        title: 'Social Media Content Package',
        status: 'Ready to Post',
        totalPosts: 25,
        platforms: {
          linkedin: {
            posts: [
              {
                type: 'announcement',
                timing: 'Launch day - 9AM ET',
                content: `🚀 Today marks a milestone for ${company}! After 2 years of development and extensive customer collaboration, we're launching our ${themeConfig.productType} that delivers ${themeConfig.benefits}.

Early adopters are already seeing transformational results. This isn't just another tool – it's a fundamental shift in how organizations operate.

What makes it special?
✨ Proven results from day one
⚡ Built for scale (10 to 10,000+ users)
🔒 Enterprise-grade security
🎯 Real customer validation

Grateful to our incredible team and early customers who made this possible. The future starts now! 

#LaunchDay ${themeConfig.mainHashtags.join(' ')}`,
                hashtags: [...themeConfig.mainHashtags, '#LaunchDay', '#TeamWork'],
                cta: 'Learn more in comments 👇',
                mediaType: 'Product demo video or team photo'
              },
              {
                type: 'thought_leadership',
                timing: 'Week 1 - Tuesday 10AM ET',
                content: `The biggest lesson from building our ${themeConfig.productType}? 

Implementation complexity kills innovation. 

We interviewed 200+ organizations and found the same pattern: great technology failing because it's too hard to adopt.

That's why we designed our platform with these principles:
→ Zero-friction onboarding
→ Intuitive user experience 
→ Seamless integration with existing tools
→ Immediate value delivery

Technology should enhance human capability, not complicate it.

What's your experience with technology adoption? Share below 👇

${themeConfig.mainHashtags.slice(0, 3).join(' ')} #ThoughtLeadership`,
                hashtags: [...themeConfig.mainHashtags.slice(0, 3), '#ThoughtLeadership', '#UserExperience'],
                cta: 'Share your adoption challenges below',
                mediaType: 'Infographic or carousel'
              },
              {
                type: 'customer_story',
                timing: 'Week 2 - Thursday 11AM ET',
                content: `"Before ${company}, our team spent 60% of their time on manual processes. Now we focus on strategy and innovation."

This quote from our customer perfectly captures why we built our ${themeConfig.productType}.

Real results from a Fortune 500 customer:
📈 40% increase in operational efficiency
⏱️ 60% reduction in manual work
💡 25% more time for strategic initiatives
📊 Real-time visibility into all operations

When technology truly serves people, everyone wins.

${themeConfig.mainHashtags.slice(0, 4).join(' ')} #CustomerSuccess`,
                hashtags: [...themeConfig.mainHashtags.slice(0, 4), '#CustomerSuccess', '#ROI'],
                cta: 'Want similar results? Let\'s connect',
                mediaType: 'Customer testimonial video or case study graphic'
              },
              {
                type: 'behind_the_scenes',
                timing: 'Week 3 - Monday 2PM ET',
                content: `Behind every breakthrough product is an incredible team. 🙌

Our engineering team spent 24 months solving problems that matter:
• How do we make complex technology simple?
• How do we ensure security without sacrificing usability?  
• How do we scale from startup to enterprise?

The answer wasn't just in the code – it was in deeply understanding our customers' needs.

Shoutout to our amazing team who never stopped asking "how can we make this better?"

${themeConfig.mainHashtags.slice(0, 3).join(' ')} #TeamSpotlight #Engineering`,
                hashtags: [...themeConfig.mainHashtags.slice(0, 3), '#TeamSpotlight', '#Engineering', '#Culture'],
                cta: 'Meet our team at [website/about]',
                mediaType: 'Team photos or office culture video'
              }
            ],
            contentCalendar: {
              week1: ['Announcement post', 'Thought leadership', 'Product demo'],
              week2: ['Customer story', 'Industry insights', 'Feature highlight'],
              week3: ['Team spotlight', 'Use case example', 'Community engagement'],
              week4: ['Results update', 'Future roadmap', 'Thank you post']
            }
          },
          twitter: {
            posts: [
              {
                type: 'announcement',
                timing: 'Launch day - 9:15AM ET',
                content: `🎉 IT'S LIVE! Our ${themeConfig.productType} is officially here.

${themeConfig.benefits} ✅
Enterprise-grade security ✅
Proven by Fortune 500 customers ✅

Thread with all the details 👇

${themeConfig.mainHashtags.slice(0, 3).join(' ')}`,
                hashtags: themeConfig.mainHashtags.slice(0, 3),
                cta: 'Thread below',
                thread: true,
                mediaType: 'Launch graphic'
              },
              {
                type: 'quick_tip',
                timing: 'Daily - 3PM ET',
                content: `💡 Quick tip: The best ${themeConfig.productType.split(' ')[1] || 'technology'} solves problems you didn't know you had.

That's exactly what our customers tell us 😊

${themeConfig.mainHashtags.slice(0, 2).join(' ')}`,
                hashtags: themeConfig.mainHashtags.slice(0, 2),
                cta: 'Learn more 👉 [link]',
                mediaType: 'Tip graphic'
              },
              {
                type: 'stats_highlight',
                timing: 'Week 1 - Friday 4PM ET',
                content: `📊 Launch week numbers:

${themeConfig.benefits}
99.9% uptime maintained
500+ sign-ups in 48 hours
15 Fortune 500 inquiries

The response has been incredible! 🚀

${themeConfig.mainHashtags.slice(0, 3).join(' ')}`,
                hashtags: [...themeConfig.mainHashtags.slice(0, 3), '#LaunchWeek'],
                cta: 'Join them 👉 [link]',
                mediaType: 'Stats infographic'
              }
            ],
            tweetSchedule: {
              morning: '9-11AM ET - Industry news & insights',
              lunch: '12-2PM ET - Product features & tips',
              afternoon: '3-5PM ET - Customer stories & engagement',
              evening: '6-8PM ET - Behind-the-scenes & culture'
            }
          },
          instagram: {
            posts: [
              {
                type: 'visual_story',
                timing: 'Launch day - 12PM ET',
                content: `✨ From idea to reality ✨

Swipe to see our journey building the ${themeConfig.productType} that's changing how ${themeConfig.audience} work.

Story highlights:
🧠 2 years of research
👥 200+ customer interviews  
⚡ ${themeConfig.benefits}
🏆 Fortune 500 validation

#Innovation #TechStartup #Journey`,
                hashtags: ['#Innovation', '#TechStartup', '#Journey', '#LaunchDay'],
                cta: 'Link in bio for full story',
                mediaType: 'Carousel with journey timeline'
              }
            ]
          },
          tiktok: {
            concepts: [
              {
                type: 'explainer',
                hook: 'POV: Your company still uses manual processes in 2024',
                content: 'Show before/after of manual vs automated workflows',
                hashtags: ['#TechTok', '#Productivity', '#WorkSmart'],
                duration: '30-60 seconds'
              }
            ]
          }
        },
        contentGuidelines: {
          tone: 'Professional yet approachable, confident but not boastful',
          voice: 'Expert insights with human authenticity',
          visualStyle: 'Clean, modern, consistent brand colors',
          engagement: 'Always respond to comments within 4 hours during business hours'
        },
        performanceTargets: {
          linkedin: 'Aim for 5%+ engagement rate on posts',
          twitter: 'Target 2%+ engagement rate and 10+ retweets per post',
          instagram: 'Achieve 3%+ engagement rate on posts',
          overall: 'Generate 100+ qualified leads through social channels'
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
    
    // IMPORTANT: This function returns TWO separate things:
    // 1. response: Conversational text from Claude (for chat UI)
    // 2. workItems: Array of generated work items with actual content (media lists, press releases, etc.)
    // The frontend should display the response in chat and the workItems as separate work cards

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
      workItemTypes: workItems.map(wi => wi.type),
      generatedContentKeys: workItems.map(wi => wi.generatedContent ? Object.keys(wi.generatedContent) : 'no content'),
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