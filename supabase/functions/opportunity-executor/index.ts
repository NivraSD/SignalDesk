// Opportunity Executor - Transform opportunities into ready-to-execute campaigns
// Generates media lists, content templates, and action plans

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// Media outlet profiles for targeting
const MEDIA_PROFILES = {
  tier1_business: {
    outlets: ['WSJ', 'Bloomberg', 'Financial Times', 'Reuters', 'CNBC'],
    focus: 'market impact, financial performance, industry leadership',
    prefers: 'exclusive data, CEO interviews, market analysis'
  },
  tier1_tech: {
    outlets: ['TechCrunch', 'The Verge', 'Wired', 'The Information', 'Ars Technica'],
    focus: 'innovation, disruption, product launches, technical details',
    prefers: 'product demos, founder stories, technical deep-dives'
  },
  tier1_general: {
    outlets: ['NYTimes', 'WashingtonPost', 'CNN', 'BBC', 'NPR'],
    focus: 'societal impact, human interest, regulatory issues',
    prefers: 'human stories, broad implications, expert commentary'
  },
  trade_publications: {
    outlets: ['Industry Week', 'Automotive News', 'Transport Topics'],
    focus: 'industry-specific developments, technical standards',
    prefers: 'industry data, technical specifications, insider perspectives'
  },
  regional_media: {
    outlets: ['Local newspapers', 'Regional TV', 'City business journals'],
    focus: 'local impact, jobs, community involvement',
    prefers: 'local angles, employment data, community benefits'
  }
}

// Journalist archetypes for personalization
const JOURNALIST_TYPES = {
  investigative: {
    interests: 'deep dives, accountability, systemic issues',
    pitch_style: 'data-heavy, document-backed, exclusive access'
  },
  breaking_news: {
    interests: 'speed, first to report, major developments',
    pitch_style: 'concise, immediate availability, clear news value'
  },
  feature_writer: {
    interests: 'narratives, profiles, trend pieces',
    pitch_style: 'compelling characters, unique angles, visual elements'
  },
  industry_analyst: {
    interests: 'market dynamics, competitive landscape, strategic moves',
    pitch_style: 'strategic implications, market data, expert insights'
  },
  tech_reporter: {
    interests: 'innovation, product details, technical achievements',
    pitch_style: 'technical differentiators, demos, engineering insights'
  }
}

async function generateExecutionPackage(opportunity: any, organization: any) {
  return {
    opportunity_summary: opportunity,
    media_strategy: await generateMediaStrategy(opportunity, organization),
    content_package: await generateContentPackage(opportunity, organization),
    talking_points: generateTalkingPoints(opportunity, organization),
    execution_timeline: generateTimeline(opportunity),
    success_metrics: defineSuccessMetrics(opportunity),
    risk_mitigation: identifyRisks(opportunity, organization)
  }
}

async function generateMediaStrategy(opportunity: any, organization: any) {
  const strategy = {
    primary_targets: [],
    secondary_targets: [],
    journalist_matches: [],
    pitch_angles: [],
    exclusive_options: []
  }
  
  // Match opportunity type to media tiers
  switch (opportunity.type) {
    case 'COMPETITOR_WEAKNESS':
      strategy.primary_targets = [
        {
          tier: 'tier1_business',
          outlets: MEDIA_PROFILES.tier1_business.outlets,
          angle: 'Industry leadership amid competitor challenges',
          timing: 'Immediate - within 6 hours'
        },
        {
          tier: 'trade_publications',
          outlets: MEDIA_PROFILES.trade_publications.outlets,
          angle: 'Technical/operational superiority',
          timing: 'Within 24 hours'
        }
      ]
      break
      
    case 'NARRATIVE_VACUUM':
      strategy.primary_targets = [
        {
          tier: 'tier1_general',
          outlets: MEDIA_PROFILES.tier1_general.outlets,
          angle: 'Thought leadership on emerging issue',
          timing: '48-hour exclusive window'
        }
      ]
      strategy.exclusive_options = [
        'Offer exclusive to single tier-1 outlet',
        'CEO byline in major publication',
        'Data exclusive with embargo'
      ]
      break
      
    case 'CASCADE_EFFECT':
      strategy.primary_targets = [
        {
          tier: 'regional_media',
          outlets: MEDIA_PROFILES.regional_media.outlets,
          angle: 'Local market implications',
          timing: 'Staggered by market over 1 week'
        }
      ]
      break
  }
  
  // Generate journalist matches based on recent coverage
  strategy.journalist_matches = await matchJournalists(opportunity, organization)
  
  // Create pitch angles
  strategy.pitch_angles = [
    {
      angle: 'data_driven',
      headline: `New Data: ${organization.name} Leads Industry in ${opportunity.context?.topic || 'Key Metric'}`,
      hook: 'Exclusive data reveals...'
    },
    {
      angle: 'human_interest',
      headline: `How ${organization.name} is Solving ${opportunity.context?.topic || 'Challenge'} for Millions`,
      hook: 'Real customer stories show...'
    },
    {
      angle: 'expert_commentary',
      headline: `${organization.name} CEO: Why ${opportunity.title} Changes Everything`,
      hook: 'Industry leader explains...'
    }
  ]
  
  return strategy
}

async function generateContentPackage(opportunity: any, organization: any) {
  const content = {
    press_release: await generatePressRelease(opportunity, organization),
    executive_statement: generateExecutiveStatement(opportunity, organization),
    social_media: generateSocialContent(opportunity, organization),
    email_templates: generateEmailTemplates(opportunity, organization),
    visual_assets: suggestVisualAssets(opportunity)
  }
  
  return content
}

async function generatePressRelease(opportunity: any, organization: any) {
  const prompt = `Write a press release for ${organization.name} about this opportunity:
${JSON.stringify(opportunity, null, 2)}

Make it:
- Newsworthy and immediate
- Include a strong quote from leadership
- Data-driven where possible
- Action-oriented
- 300-400 words

Return just the press release text.`

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
        max_tokens: 1000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const result = await response.json()
    return result.content[0].text
  } catch (error) {
    console.error('Press release generation error:', error)
    return generateFallbackPressRelease(opportunity, organization)
  }
}

function generateFallbackPressRelease(opportunity: any, organization: any) {
  return `FOR IMMEDIATE RELEASE

${organization.name} Responds to ${opportunity.title}

[City, Date] - ${organization.name} today announced its position regarding ${opportunity.description}.

"This represents a significant moment for our industry," said [Executive Name], [Title] at ${organization.name}. "We are uniquely positioned to lead through this transition."

Key Points:
- ${organization.name} has been preparing for this development
- The company's existing capabilities provide competitive advantage
- Immediate actions are being taken to capitalize on this opportunity

About ${organization.name}:
[Company boilerplate]

Contact:
[Media contact information]

###`
}

function generateExecutiveStatement(opportunity: any, organization: any) {
  const statements = {
    COMPETITOR_WEAKNESS: `"While others face transitions, ${organization.name} remains focused on delivering value to our customers. Our stable leadership and clear strategy position us to capture market share."`,
    
    NARRATIVE_VACUUM: `"${organization.name} has unique insights on ${opportunity.context?.topic || 'this emerging issue'}. We're ready to lead the industry conversation with data-driven solutions."`,
    
    CASCADE_EFFECT: `"We anticipated this development and have been preparing across all affected markets. ${organization.name} is ready to support our stakeholders through this transition."`,
    
    CRISIS_PREVENTION: `"${organization.name} takes a proactive approach to industry challenges. We're addressing this head-on with transparency and decisive action."`,
    
    ALLIANCE_OPENING: `"This presents an opportunity for meaningful collaboration. ${organization.name} is open to partnerships that drive industry progress."`
  }
  
  return statements[opportunity.type as keyof typeof statements] || 
    `"${organization.name} views this as an opportunity to demonstrate our industry leadership."`
}

function generateSocialContent(opportunity: any, organization: any) {
  return {
    twitter_thread: [
      `🚨 ${opportunity.title}`,
      `Here's what this means for the industry:`,
      `1. ${opportunity.description}`,
      `2. ${organization.name} is uniquely positioned because...`,
      `3. Our immediate actions:`,
      `Learn more: [link]`
    ],
    linkedin_post: `Industry Alert: ${opportunity.title}

${opportunity.description}

At ${organization.name}, we've been tracking this development and are ready to lead the industry response.

Key implications:
✓ Market dynamics shift
✓ New opportunities emerge
✓ ${organization.name}'s advantages become clear

Read our full analysis: [link]`,
    
    instagram_story: {
      slide1: `Breaking: ${opportunity.title}`,
      slide2: 'What this means for you',
      slide3: `How ${organization.name} is responding`,
      slide4: 'Swipe up for details'
    }
  }
}

function generateEmailTemplates(opportunity: any, organization: any) {
  return {
    journalist_pitch: {
      subject: `Exclusive: ${organization.name}'s Take on ${opportunity.title}`,
      body: `Hi [Name],

I saw your recent piece on [related topic] and thought you'd be interested in an exclusive angle on ${opportunity.title}.

${organization.name} has unique data showing:
- [Key insight 1]
- [Key insight 2]
- [Key insight 3]

Our CEO is available for an interview today to discuss the implications.

Can we set up a quick call?

Best,
[Your name]`
    },
    
    stakeholder_alert: {
      subject: `Important: ${opportunity.title} - ${organization.name} Response`,
      body: `Dear [Stakeholder],

We wanted to alert you to ${opportunity.title} and share ${organization.name}'s immediate response.

What happened: ${opportunity.description}

Our response:
1. [Action 1]
2. [Action 2]
3. [Action 3]

We're monitoring this situation closely and will keep you updated.

Best regards,
[Leadership]`
    },
    
    customer_communication: {
      subject: `${organization.name} Update: ${opportunity.title}`,
      body: `Dear Valued Customer,

${opportunity.description}

What this means for you:
- [Customer benefit 1]
- [Customer benefit 2]
- [Customer benefit 3]

${organization.name} is taking proactive steps to ensure continued excellent service.

Questions? Contact us at [support].

Thank you for your continued trust.

The ${organization.name} Team`
    }
  }
}

function generateTalkingPoints(opportunity: any, organization: any) {
  return {
    key_messages: [
      `${organization.name} has been preparing for this shift`,
      'Our unique capabilities position us to lead',
      'We are taking immediate action to capitalize on this opportunity'
    ],
    
    proof_points: [
      'Data point demonstrating leadership',
      'Customer success story',
      'Recent achievement that supports narrative'
    ],
    
    difficult_questions: [
      {
        question: 'Were you caught off guard by this development?',
        response: `Not at all. ${organization.name} has been tracking these indicators...`
      },
      {
        question: 'How does this affect your competitive position?',
        response: 'This actually strengthens our position because...'
      },
      {
        question: 'What specific actions are you taking?',
        response: 'We have a three-pronged approach: First...'
      }
    ],
    
    bridging_phrases: [
      'What is really important here is...',
      'The key thing to understand is...',
      'Looking at the bigger picture...'
    ]
  }
}

function generateTimeline(opportunity: any) {
  const timelines = {
    URGENT: {
      't_minus_0': 'Opportunity detected',
      't_plus_1h': 'Internal alignment',
      't_plus_2h': 'Content finalized',
      't_plus_3h': 'Media outreach begins',
      't_plus_6h': 'First coverage expected',
      't_plus_12h': 'Full campaign live',
      't_plus_24h': 'Impact assessment'
    },
    HIGH: {
      'day_0': 'Opportunity detected',
      'day_0_plus_4h': 'Strategy alignment',
      'day_1_morning': 'Content preparation',
      'day_1_afternoon': 'Stakeholder briefing',
      'day_2_morning': 'Media outreach',
      'day_2_afternoon': 'Campaign launch',
      'day_3': 'Momentum building'
    },
    MEDIUM: {
      'day_1': 'Opportunity analysis',
      'day_2': 'Strategy development',
      'day_3': 'Content creation',
      'day_4': 'Stakeholder alignment',
      'day_5': 'Soft launch',
      'day_7': 'Full campaign'
    }
  }
  
  return timelines[opportunity.urgency as keyof typeof timelines] || timelines.MEDIUM
}

function defineSuccessMetrics(opportunity: any) {
  return {
    immediate: [
      'Media mentions within 24 hours',
      'Sentiment analysis of coverage',
      'Share of voice vs competitors'
    ],
    short_term: [
      'Message penetration in target media',
      'Stakeholder engagement rates',
      'Social media amplification'
    ],
    long_term: [
      'Narrative ownership',
      'Thought leadership positioning',
      'Competitive advantage gained'
    ]
  }
}

function identifyRisks(opportunity: any, organization: any) {
  return {
    risks: [
      {
        risk: 'Competitor counter-narrative',
        likelihood: 'Medium',
        mitigation: 'Prepare defensive talking points'
      },
      {
        risk: 'Media skepticism',
        likelihood: 'Low',
        mitigation: 'Lead with data and third-party validation'
      },
      {
        risk: 'Internal misalignment',
        likelihood: 'Low',
        mitigation: 'Pre-brief all spokespeople'
      }
    ],
    contingency_plans: [
      'If questioned on X, pivot to Y',
      'If competitor responds, escalate to CEO statement',
      'If negative coverage, deploy customer testimonials'
    ]
  }
}

function suggestVisualAssets(opportunity: any) {
  return {
    infographic: `Data visualization showing ${organization.name}'s advantage`,
    chart: 'Comparison chart vs industry average',
    timeline: 'Visual timeline of developments',
    quote_card: 'Executive quote for social sharing',
    video: '30-second explainer for social media'
  }
}

async function matchJournalists(opportunity: any, organization: any) {
  // This would integrate with a journalist database
  // For now, return strategic matches
  return [
    {
      name: '[Journalist Name]',
      outlet: 'WSJ',
      beat: 'Industry coverage',
      recent_relevant: 'Wrote about similar topic last week',
      pitch_angle: 'Exclusive data on industry shift',
      relationship: 'Warm - quoted CEO last quarter'
    },
    {
      name: '[Journalist Name]',
      outlet: 'TechCrunch',
      beat: 'Innovation and disruption',
      recent_relevant: 'Covers competitive dynamics',
      pitch_angle: 'How tech is reshaping industry',
      relationship: 'Cold - first approach'
    },
    {
      name: '[Journalist Name]',
      outlet: 'Bloomberg',
      beat: 'Markets and finance',
      recent_relevant: 'Interested in market share shifts',
      pitch_angle: 'Financial implications of development',
      relationship: 'Warm - regular contact'
    }
  ]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { opportunity, organization } = await req.json()
    
    if (!opportunity || !organization?.name) {
      throw new Error('Opportunity and organization required')
    }
    
    // Generate complete execution package
    const executionPackage = await generateExecutionPackage(opportunity, organization)
    
    return new Response(
      JSON.stringify({
        success: true,
        organization: organization.name,
        opportunity: opportunity.title,
        urgency: opportunity.urgency,
        window: opportunity.window,
        execution_package: executionPackage,
        ready_to_execute: true,
        next_steps: [
          'Review and approve content',
          'Confirm spokesperson availability',
          'Green light for media outreach',
          'Launch campaign'
        ]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Execution package error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})