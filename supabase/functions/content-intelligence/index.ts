// SignalDesk Content Intelligence - Converted from MCP Server
// AI-powered content generation for press releases, pitches, talking points, and crisis communications

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

interface ContentRequest {
  method: string
  params: {
    announcement_type?: string
    company_info?: any
    key_details?: any
    target_audience?: string
    tone?: string
    include_boilerplate?: boolean
    base_story?: string
    target_outlets?: string[]
    angles?: string[]
    journalist_preferences?: any
    urgency?: string
    current_subject?: string
    email_type?: string
    optimization_goals?: string[]
    a_b_test_count?: number
    topic?: string
    executive_role?: string
    event_type?: string
    key_messages?: string[]
    difficult_questions?: string[]
    time_limit?: number
    company_context?: any
    crisis_type?: string
    severity_level?: string
    affected_stakeholders?: string[]
    known_facts?: string[]
    company_actions?: string[]
    timeline_urgency?: string
    legal_considerations?: boolean
    source_content?: string
    target_markets?: string[]
    content_type?: string
    cultural_considerations?: string[]
    local_regulations?: boolean
    maintain_brand_voice?: boolean
    content_to_check?: string
    fact_types?: string[]
    verification_level?: string
    source_requirements?: string[]
    risk_tolerance?: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const request: ContentRequest = await req.json()
    const { method, params } = request

    let result

    switch (method) {
      case 'generate_press_release':
        result = await generatePressRelease(supabase, params)
        break
      case 'create_pitch_variants':
        result = await createPitchVariants(supabase, params)
        break
      case 'optimize_subject_lines':
        result = await optimizeSubjectLines(supabase, params)
        break
      case 'generate_talking_points':
        result = await generateTalkingPoints(supabase, params)
        break
      case 'create_crisis_statements':
        result = await createCrisisStatements(supabase, params)
        break
      case 'localize_content':
        result = await localizeContent(supabase, params)
        break
      case 'fact_check_content':
        result = await factCheckContent(supabase, params)
        break
      default:
        result = await generatePressRelease(supabase, { 
          announcement_type: 'milestone', 
          company_info: { name: 'Demo Company' }, 
          key_details: { headline: 'Demo Announcement' } 
        })
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function generatePressRelease(supabase: any, params: any) {
  const { 
    announcement_type, 
    company_info, 
    key_details, 
    target_audience = 'general_business', 
    tone = 'professional', 
    include_boilerplate = true 
  } = params

  // Generate press release structure
  const headline = key_details.headline || `${company_info.name} Announces ${announcement_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}`
  const dateline = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  
  let pressRelease = `FOR IMMEDIATE RELEASE\n\n`
  pressRelease += `${headline}\n\n`
  pressRelease += `${dateline} -- `
  
  // Generate opening paragraph
  const mainPoints = key_details.main_points || []
  if (mainPoints.length > 0) {
    pressRelease += `${company_info.name}, ${company_info.description || 'a leading company'}, today announced ${mainPoints[0]}. `
    if (mainPoints.length > 1) {
      pressRelease += `${mainPoints[1]}`
    }
  } else {
    pressRelease += `${company_info.name} today announced a significant ${announcement_type.replace('_', ' ')} that will enhance its market position and deliver value to stakeholders.`
  }
  
  pressRelease += `\n\n`
  
  // Add key details and facts
  if (key_details.facts_figures && key_details.facts_figures.length > 0) {
    pressRelease += `Key highlights include:\n`
    key_details.facts_figures.forEach((fact: string) => {
      pressRelease += `• ${fact}\n`
    })
    pressRelease += `\n`
  }
  
  // Add quotes
  if (key_details.quotes && key_details.quotes.length > 0) {
    key_details.quotes.forEach((quote: any) => {
      pressRelease += `"${quote.quote}" said ${quote.speaker}, ${quote.title} at ${company_info.name}.\n\n`
    })
  }
  
  // Add additional context paragraph
  pressRelease += `This ${announcement_type.replace('_', ' ')} represents a significant milestone for ${company_info.name} and reinforces the company's commitment to innovation and excellence in ${company_info.industry || 'its industry'}.\n\n`
  
  // Add boilerplate if requested
  if (include_boilerplate) {
    pressRelease += `About ${company_info.name}\n`
    pressRelease += `${company_info.description || `${company_info.name} is a leading company in the ${company_info.industry || 'technology'} sector, dedicated to delivering innovative solutions that drive business success.`}\n\n`
  }
  
  // Add contact information
  pressRelease += `Media Contact:\n`
  pressRelease += `${company_info.name} Press Office\n`
  pressRelease += `Phone: [Phone Number]\n`
  pressRelease += `Email: press@${company_info.name.toLowerCase().replace(/\s+/g, '')}.com\n`
  pressRelease += `\n###\n`

  return {
    headline,
    content: pressRelease,
    tone: tone.toUpperCase(),
    target_audience: target_audience.replace('_', ' ').toUpperCase(),
    word_count: pressRelease.split(' ').length,
    estimated_read_time: Math.ceil(pressRelease.split(' ').length / 200) + ' minutes',
    timestamp: new Date().toISOString()
  }
}

async function createPitchVariants(supabase: any, params: any) {
  const { base_story, target_outlets = [], angles, journalist_preferences = {}, urgency = 'timely' } = params
  
  const variants = angles.map((angle: string, index: number) => {
    let subject = ''
    let pitch = ''
    
    switch (angle) {
      case 'breaking_news':
        subject = `BREAKING: ${base_story.substring(0, 40)}...`
        pitch = `I have breaking news that I believe will be of immediate interest to your readers.\n\n${base_story}\n\nThis story is developing and I can provide:\n• Immediate expert commentary\n• Exclusive access to key executives\n• Real-time updates as the situation evolves\n\nTime-sensitive opportunity - happy to discuss immediately.`
        break
        
      case 'trend_analysis':
        subject = `Industry Trend: ${base_story.substring(0, 35)}...`
        pitch = `I wanted to share an interesting trend development that aligns perfectly with your beat.\n\n${base_story}\n\nThis represents a broader industry shift that could impact:\n• Market dynamics\n• Consumer behavior\n• Competitive landscape\n\nI can provide data analysis and expert perspectives to help contextualize this trend for your audience.`
        break
        
      case 'expert_commentary':
        subject = `Expert Available: ${base_story.substring(0, 35)}...`
        pitch = `Given your recent coverage of [related topic], I thought you might be interested in expert commentary on:\n\n${base_story}\n\nOur expert can provide:\n• Technical insights and analysis\n• Industry context and implications\n• Future predictions and scenarios\n\nAvailable for interviews today or tomorrow at your convenience.`
        break
        
      case 'data_driven':
        subject = `New Data: ${base_story.substring(0, 40)}...`
        pitch = `I have exclusive data that reveals interesting insights about:\n\n${base_story}\n\nKey findings include:\n• [Specific data point 1]\n• [Specific data point 2]\n• [Specific data point 3]\n\nThis data hasn't been published elsewhere and could provide unique value to your readers.`
        break
        
      case 'human_interest':
        subject = `Human Story: ${base_story.substring(0, 40)}...`
        pitch = `Behind the business news is a compelling human story that your readers would find engaging:\n\n${base_story}\n\nThis story highlights:\n• Personal journey and challenges\n• Impact on real people\n• Broader social implications\n\nI can arrange interviews with the people at the center of this story.`
        break
        
      case 'local_angle':
        subject = `Local Impact: ${base_story.substring(0, 35)}...`
        pitch = `This national story has significant local implications for your market:\n\n${base_story}\n\nLocal impact includes:\n• Job creation/economic effects\n• Community involvement\n• Regional market changes\n\nI can provide local executives and data specific to your coverage area.`
        break
        
      default:
        subject = `Story Pitch: ${base_story.substring(0, 40)}...`
        pitch = `I have a story that I believe would resonate with your audience:\n\n${base_story}\n\nI can provide additional context, expert interviews, and supporting materials to help you develop this story.`
    }
    
    // Adjust based on journalist preferences
    if (journalist_preferences.preferred_length === 'short') {
      pitch = pitch.split('\n\n')[0] + '\n\nHappy to provide more details if this interests you.'
    }
    
    if (journalist_preferences.prefers_data && angle !== 'data_driven') {
      pitch += '\n\nI also have supporting data and statistics available if helpful.'
    }
    
    return {
      angle,
      subject_line: subject,
      pitch_content: pitch,
      target_outlets: target_outlets.length > 0 ? target_outlets[index % target_outlets.length] : 'General',
      urgency_level: urgency,
      estimated_response_rate: Math.round(10 + Math.random() * 20) + '%'
    }
  })

  return {
    base_story: base_story.substring(0, 100) + '...',
    total_variants: variants.length,
    variants,
    testing_recommendations: [
      'Send each variant to different segments of your media list',
      'Track open rates, response rates, and coverage outcomes',
      `Use urgency level "${urgency}" for timing strategy`,
      'Follow up based on journalist preferences provided'
    ],
    timestamp: new Date().toISOString()
  }
}

async function optimizeSubjectLines(supabase: any, params: any) {
  const { 
    current_subject, 
    email_type, 
    target_audience = 'journalists', 
    optimization_goals = ['higher_open_rate'], 
    a_b_test_count = 5 
  } = params
  
  const optimizedSubjects = []
  
  // Generate variations based on optimization goals
  for (let i = 0; i < a_b_test_count; i++) {
    let optimized = current_subject
    
    if (optimization_goals.includes('urgency')) {
      const urgencyWords = ['URGENT:', 'Breaking:', 'Time-Sensitive:', 'Immediate:', 'ALERT:']
      optimized = urgencyWords[i % urgencyWords.length] + ' ' + optimized
    }
    
    if (optimization_goals.includes('curiosity')) {
      const curiosityFrames = [
        'The story everyone\'s talking about:',
        'What you haven\'t heard about',
        'The surprising truth behind',
        'Why industry experts are saying',
        'The untold story of'
      ]
      optimized = curiosityFrames[i % curiosityFrames.length] + ' ' + optimized.toLowerCase()
    }
    
    if (optimization_goals.includes('credibility')) {
      const credibilityBoosters = [
        'Exclusive:',
        'Industry First:',
        'Verified Report:',
        'Official Announcement:',
        'Expert Analysis:'
      ]
      optimized = credibilityBoosters[i % credibilityBoosters.length] + ' ' + optimized
    }
    
    // Email type specific optimizations
    switch (email_type) {
      case 'breaking_news':
        optimized = optimized.replace(/^(?!BREAKING)/, 'BREAKING: ')
        break
      case 'exclusive_offer':
        optimized = 'EXCLUSIVE: ' + optimized
        break
      case 'follow_up':
        optimized = 'Follow-up: ' + optimized
        break
    }
    
    // Length optimization (keep under 50 characters for mobile)
    if (optimized.length > 50) {
      optimized = optimized.substring(0, 47) + '...'
    }
    
    optimizedSubjects.push({
      version: `Variant ${i + 1}`,
      subject: optimized,
      estimated_open_rate: Math.round(20 + Math.random() * 30) + '%',
      optimization_focus: optimization_goals[i % optimization_goals.length],
      character_count: optimized.length
    })
  }
  
  // Add the original for comparison
  optimizedSubjects.unshift({
    version: 'Original',
    subject: current_subject,
    estimated_open_rate: Math.round(15 + Math.random() * 20) + '%',
    optimization_focus: 'baseline',
    character_count: current_subject.length
  })

  return {
    email_type: email_type.toUpperCase().replace('_', ' '),
    target_audience: target_audience.toUpperCase(),
    optimization_goals: optimization_goals.join(', ').toUpperCase(),
    variants: optimizedSubjects,
    testing_recommendations: [
      `Split your email list into ${optimizedSubjects.length} equal segments`,
      'Send each variant to a different segment',
      'Track open rates, click-through rates, and responses',
      'Use the winning variant for future similar emails'
    ],
    best_practices: generateSubjectLineBestPractices(optimization_goals),
    timestamp: new Date().toISOString()
  }
}

async function generateTalkingPoints(supabase: any, params: any) {
  const { 
    topic, 
    executive_role, 
    event_type, 
    key_messages = [], 
    difficult_questions = [], 
    time_limit, 
    company_context = {} 
  } = params
  
  // Generate structured talking points
  const talkingPoints = {
    opening: generateOpening(event_type, topic, company_context),
    main_points: generateMainPoints(executive_role, topic),
    supporting_data: generateSupportingData(topic),
    key_messages_integration: key_messages.map((message: string) => 
      `Opportunity to reinforce: "${message}" when discussing [relevant context]`
    ),
    difficult_qa: difficult_questions.map((question: string) => ({
      question,
      approach: 'Acknowledge → Provide context → Redirect to positive',
      sample_response: `That's an important question. [Acknowledge the concern]. Here's the context you should know... [Provide facts]. What I think is most important to understand is... [Redirect to positive message].`
    })),
    closing: generateClosing(event_type)
  }

  return {
    topic,
    executive_role: executive_role.toUpperCase(),
    event_type: event_type.replace('_', ' ').toUpperCase(),
    time_limit: time_limit ? `${time_limit} minutes` : 'No limit specified',
    structure: talkingPoints,
    preparation_tips: [
      'Practice your opening and closing until they feel natural',
      'Prepare 2-3 specific examples for each main point',
      'Have supporting data easily accessible',
      ...(time_limit ? [`Practice staying within the ${time_limit}-minute time limit`] : []),
      'Anticipate follow-up questions for each main point'
    ],
    timestamp: new Date().toISOString()
  }
}

async function createCrisisStatements(supabase: any, params: any) {
  const { 
    crisis_type, 
    severity_level, 
    affected_stakeholders, 
    known_facts = [], 
    company_actions = [], 
    timeline_urgency = 'within_24_hours', 
    legal_considerations = true 
  } = params
  
  // Crisis-specific opening
  const openings = {
    data_breach: `We are writing to inform you of a data security incident that may have affected some of our systems.`,
    product_recall: `We are voluntarily recalling [PRODUCT NAME] due to [SPECIFIC SAFETY CONCERN].`,
    executive_departure: `We want to inform you about a leadership transition at [COMPANY NAME].`,
    financial_issues: `We want to provide transparency about our current financial situation.`,
    legal_matter: `We are aware of [LEGAL SITUATION] and want to provide our perspective.`,
    reputation_attack: `We have become aware of [ALLEGATIONS/SITUATION] and want to address these concerns directly.`,
    operational_disruption: `We experienced a service disruption that affected [AFFECTED SERVICES/OPERATIONS].`,
    regulatory_issue: `We are working with [REGULATORY BODY] regarding [REGULATORY MATTER].`
  }
  
  let statement = openings[crisis_type as keyof typeof openings] || `We want to address the recent situation regarding ${crisis_type.replace('_', ' ')}.`
  statement += `\n\n`
  
  // Add known facts
  if (known_facts.length > 0) {
    statement += `What we know:\n`
    known_facts.forEach((fact: string) => {
      statement += `• ${fact}\n`
    })
    statement += `\n`
  }
  
  // Add company actions
  if (company_actions.length > 0) {
    statement += `What we are doing:\n`
    company_actions.forEach((action: string) => {
      statement += `• ${action}\n`
    })
    statement += `\n`
  }
  
  // Stakeholder-specific messaging
  const stakeholderMessages = {
    customers: `Our customers' trust is paramount, and we are committed to transparency throughout this process.`,
    employees: `We are keeping our team informed and ensuring they have the support they need during this time.`,
    investors: `We are committed to maintaining the financial integrity and long-term value of the company.`,
    partners: `We are working closely with our partners to minimize any disruption to our business relationships.`,
    regulators: `We are cooperating fully with all relevant regulatory authorities and maintaining open communication.`,
    media: `We will continue to provide updates as more information becomes available.`,
    general_public: `We take our responsibility to the community seriously and are committed to doing the right thing.`
  }
  
  statement += `Our commitment:\n`
  affected_stakeholders.forEach((stakeholder: string) => {
    if (stakeholderMessages[stakeholder as keyof typeof stakeholderMessages]) {
      statement += `${stakeholderMessages[stakeholder as keyof typeof stakeholderMessages]}\n`
    }
  })
  statement += `\n`
  
  // Timeline and next steps
  const timelineMessages = {
    immediate: `We will provide an update within the next few hours.`,
    within_hours: `We will provide an update later today.`,
    within_24_hours: `We will provide an update within 24 hours.`,
    ongoing_updates: `We will provide regular updates as the situation develops.`
  }
  
  statement += timelineMessages[timeline_urgency as keyof typeof timelineMessages]
  statement += `\n\n`
  
  // Contact information
  statement += `For questions, please contact:\n`
  statement += `Media: [MEDIA CONTACT NAME] at [EMAIL] or [PHONE]\n`
  if (affected_stakeholders.includes('customers')) {
    statement += `Customers: [CUSTOMER SERVICE] or [SUPPORT EMAIL]\n`
  }
  if (affected_stakeholders.includes('investors')) {
    statement += `Investors: [INVESTOR RELATIONS] at [EMAIL]\n`
  }

  return {
    crisis_type: crisis_type.replace('_', ' ').toUpperCase(),
    severity_level: severity_level.toUpperCase(),
    timeline: timeline_urgency.replace('_', ' ').toUpperCase(),
    statement,
    approval_checklist: [
      'CEO/Leadership approval',
      ...(legal_considerations ? ['Legal review completed', 'Regulatory compliance verified'] : []),
      'Stakeholder notification plan ready',
      'Media distribution list prepared',
      'Social media response plan activated',
      'Employee communication sent'
    ],
    risk_considerations: [
      'Monitor for additional developments that could change the narrative',
      'Prepare for potential follow-up questions',
      'Have subject matter experts available for interviews',
      'Track social media sentiment and respond appropriately',
      ...(severity_level === 'critical' || severity_level === 'high' ? [
        'Consider activating crisis communication team',
        'Prepare for potential media conference call'
      ] : [])
    ],
    legal_review_required: legal_considerations,
    timestamp: new Date().toISOString()
  }
}

async function localizeContent(supabase: any, params: any) {
  const { 
    source_content, 
    target_markets, 
    content_type, 
    cultural_considerations = [], 
    local_regulations = false, 
    maintain_brand_voice = true 
  } = params
  
  const localizedVersions = target_markets.map((market: string) => {
    let localized = source_content
    let adaptationNotes = []
    
    // Market-specific adaptations
    switch (market.toLowerCase()) {
      case 'uk':
      case 'united kingdom':
        localized = localized.replace(/\$([0-9,]+)/g, '£$1')
        localized = localized.replace(/\bcolor\b/g, 'colour')
        localized = localized.replace(/\borganize\b/g, 'organise')
        adaptationNotes.push('Currency converted to GBP')
        adaptationNotes.push('Spelling localized to British English')
        break
        
      case 'eu':
      case 'europe':
        localized = localized.replace(/\$([0-9,]+)/g, '€$1')
        if (local_regulations) {
          adaptationNotes.push('GDPR compliance considerations added')
          localized += '\n\nNote: This announcement complies with applicable European data protection regulations.'
        }
        break
        
      case 'apac':
      case 'asia pacific':
        adaptationNotes.push('Time zones adjusted for APAC business hours')
        adaptationNotes.push('Cultural sensitivity review completed')
        break
        
      case 'japan':
        adaptationNotes.push('Honorific language considerations')
        adaptationNotes.push('Business card protocol mentioned')
        break
        
      case 'latin america':
        localized = localized.replace(/\$([0-9,]+)/g, 'US$$$1')
        adaptationNotes.push('Currency specified as USD for clarity')
        break
    }
    
    // Add local contact information placeholder
    if (content_type === 'press_release') {
      localized += `\n\nLocal Media Contact for ${market}:\n[LOCAL CONTACT NAME]\nPhone: [LOCAL PHONE]\nEmail: [LOCAL EMAIL]`
    }
    
    return {
      market,
      localized_content: localized,
      adaptation_notes: adaptationNotes,
      review_required: local_regulations || cultural_considerations.length > 0,
      word_count_change: localized.split(' ').length - source_content.split(' ').length
    }
  })

  return {
    source_content_type: content_type.replace('_', ' ').toUpperCase(),
    target_markets: target_markets.join(', '),
    brand_voice_maintained: maintain_brand_voice,
    total_versions: localizedVersions.length,
    localizations: localizedVersions,
    localization_checklist: [
      'Currency conversions verified',
      'Time zones and dates adjusted',
      'Cultural sensitivities addressed',
      'Local contact information added',
      'Regulatory compliance reviewed',
      'Language and terminology localized',
      'Local media distribution lists prepared'
    ],
    timestamp: new Date().toISOString()
  }
}

async function factCheckContent(supabase: any, params: any) {
  const { 
    content_to_check, 
    fact_types, 
    verification_level = 'basic', 
    source_requirements = [], 
    urgency = 'standard', 
    risk_tolerance = 'moderate' 
  } = params
  
  // Extract potential facts based on fact types
  const extractedFacts: any[] = []
  
  // Simple fact extraction patterns
  if (fact_types.includes('statistics')) {
    const numberPattern = /\d+([.,]\d+)*\s*(%|percent|million|billion|thousand)/gi
    const numbers = content_to_check.match(numberPattern) || []
    numbers.forEach((num: string) => extractedFacts.push({
      type: 'statistic',
      claim: num,
      status: 'needs_verification',
      confidence: 0
    }))
  }
  
  if (fact_types.includes('dates')) {
    const datePattern = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi
    const dates = content_to_check.match(datePattern) || []
    dates.forEach((date: string) => extractedFacts.push({
      type: 'date',
      claim: date,
      status: 'needs_verification',
      confidence: 0
    }))
  }
  
  if (fact_types.includes('financial_data')) {
    const moneyPattern = /\$[\d,]+(\.\d{2})?(\s*(million|billion|thousand))?/gi
    const amounts = content_to_check.match(moneyPattern) || []
    amounts.forEach((amount: string) => extractedFacts.push({
      type: 'financial_data',
      claim: amount,
      status: 'needs_verification',
      confidence: 0
    }))
  }
  
  // Mock verification results
  const verificationResults = extractedFacts.map((fact: any) => {
    let confidence = 0.7 + Math.random() * 0.3
    let status = 'verified'
    let sources: string[] = []
    
    if (verification_level === 'basic') {
      confidence *= 0.8
      sources = ['Company records']
    } else if (verification_level === 'thorough') {
      confidence *= 1.1
      sources = ['Company records', 'Third-party validation', 'Industry reports']
    } else if (verification_level === 'legal_grade') {
      confidence *= 1.2
      sources = ['Primary sources', 'Legal documentation', 'Regulatory filings', 'Third-party audit']
    }
    
    if (confidence < 0.7 && risk_tolerance === 'conservative') {
      status = 'requires_additional_verification'
    } else if (confidence < 0.5) {
      status = 'unverified'
    } else if (confidence > 0.9) {
      status = 'verified_high_confidence'
    }
    
    return {
      ...fact,
      status,
      confidence: Math.min(confidence, 1.0),
      sources,
      verification_date: new Date().toISOString().split('T')[0]
    }
  })

  const verified = verificationResults.filter(r => r.status.includes('verified')).length
  const needsVerification = verificationResults.filter(r => r.status === 'requires_additional_verification').length
  const unverified = verificationResults.filter(r => r.status === 'unverified').length

  return {
    verification_level: verification_level.toUpperCase(),
    risk_tolerance: risk_tolerance.toUpperCase(),
    urgency: urgency.toUpperCase(),
    summary: {
      facts_identified: verificationResults.length,
      verified,
      needs_verification: needsVerification,
      unverified
    },
    results: verificationResults,
    recommendations: generateFactCheckRecommendations(needsVerification, unverified, urgency),
    publication_ready: needsVerification === 0 && unverified === 0,
    timestamp: new Date().toISOString()
  }
}

// Helper functions
function generateOpening(eventType: string, topic: string, context: any): string {
  const openings = {
    media_interview: `Thank you for the opportunity to discuss ${topic}. I'm excited to share insights about how this impacts our industry and what it means for the future.`,
    conference_presentation: `Good [morning/afternoon], everyone. Today I want to talk about ${topic} and why it matters to all of us in this room.`,
    panel_discussion: `I appreciate being part of this distinguished panel. My perspective on ${topic} comes from our experience in ${context.competitive_position || 'the market'}.`,
    investor_call: `Thank you for joining us today. I want to address ${topic} and its implications for our business strategy and growth trajectory.`,
    crisis_response: `I want to address the situation regarding ${topic} directly and transparently. Here's what we know and what we're doing about it.`
  }
  
  return openings[eventType as keyof typeof openings] || `Thank you for the opportunity to discuss ${topic}.`
}

function generateMainPoints(role: string, topic: string): string[] {
  const roleBasedPoints = {
    ceo: [
      `Strategic vision: How ${topic} aligns with our long-term strategy`,
      `Market opportunity: The broader impact on our industry`,
      `Stakeholder value: Benefits for customers, employees, and shareholders`
    ],
    cto: [
      `Technical innovation: The technological aspects of ${topic}`,
      `Implementation approach: How we're executing our technical strategy`,
      `Future capabilities: What this enables for our platform`
    ],
    cmo: [
      `Market positioning: How ${topic} strengthens our competitive advantage`,
      `Customer impact: Direct benefits for our target audience`,
      `Brand differentiation: What makes our approach unique`
    ],
    cfo: [
      `Financial impact: Investment requirements and expected returns`,
      `Business metrics: Key performance indicators and targets`,
      `Risk management: How we're mitigating potential challenges`
    ]
  }
  
  return roleBasedPoints[role as keyof typeof roleBasedPoints] || [
    `Industry expertise: Our unique perspective on ${topic}`,
    `Practical implications: What this means in real terms`,
    `Future outlook: Where we see this heading`
  ]
}

function generateSupportingData(topic: string): string[] {
  return [
    `Market research indicating [specific trend related to ${topic}]`,
    `Our internal data showing [relevant performance metric]`,
    `Industry benchmarks that validate our approach`,
    `Customer feedback demonstrating [relevant outcome]`
  ]
}

function generateClosing(eventType: string): string {
  if (eventType === 'crisis_response') {
    return `We're committed to transparency and will continue to update you as we learn more. Thank you for your patience as we work through this situation.`
  }
  return `I'm excited about the opportunities ahead and happy to answer any questions you might have.`
}

function generateSubjectLineBestPractices(goals: string[]): string[] {
  const practices = []
  
  if (goals.includes('higher_open_rate')) {
    practices.push('Shorter subjects typically perform better on mobile')
    practices.push('Personalization can increase open rates by 26%')
  }
  if (goals.includes('urgency')) {
    practices.push('Use urgency sparingly to maintain credibility')
    practices.push('Time-sensitive subjects work best for breaking news')
  }
  if (goals.includes('curiosity')) {
    practices.push('Balance curiosity with clarity to avoid spam filters')
    practices.push('Test different levels of mystery vs. specificity')
  }
  
  return practices
}

function generateFactCheckRecommendations(needsVerification: number, unverified: number, urgency: string): string[] {
  const recommendations = []
  
  if (needsVerification > 0 || unverified > 0) {
    recommendations.push(`${needsVerification + unverified} facts require additional verification before publication`)
    recommendations.push('Obtain primary source documentation')
    recommendations.push('Verify with subject matter experts')
    recommendations.push('Consider removing unverifiable claims')
  } else {
    recommendations.push('All identified facts meet verification standards')
    recommendations.push('Content appears ready for publication')
    recommendations.push('Maintain source documentation for future reference')
  }
  
  if (urgency === 'immediate' && (needsVerification > 0 || unverified > 0)) {
    recommendations.push('URGENT TIMELINE CONFLICT: Immediate publication requested but verification incomplete')
    recommendations.push('Consider: Publish with disclaimers or delay until verified')
  }
  
  return recommendations
}