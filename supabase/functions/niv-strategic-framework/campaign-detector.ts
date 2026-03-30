// Enhanced Campaign Type Detection for NIV Strategic Framework
// Maps user queries to specific campaign types with rich metadata

export interface CampaignType {
  category: string
  type: string
  subType?: string
  confidence: number
  indicators: string[]
  components: string[]
  immediateActions: string[]
  strategicPlays: string[]
  metrics: string[]
}

// Keyword patterns for detecting campaign types
const CAMPAIGN_PATTERNS = {
  // Product Launch Patterns
  productLaunch: {
    b2bSaas: {
      patterns: ['saas', 'software launch', 'enterprise software', 'b2b launch', 'cloud platform', 'api launch', 'developer tool'],
      components: ['media-list', 'content-generator', 'demo-builder', 'integration-showcase'],
      immediateActions: [
        'Prepare technical documentation for media',
        'Schedule analyst briefings (Gartner, Forrester)',
        'Create demo environments for press',
        'Brief solution engineers for media demos'
      ],
      strategicPlays: [
        'Position in magic quadrants',
        'Secure lighthouse customers for testimonials',
        'Build developer community advocacy',
        'Create ROI calculator and business case tools'
      ],
      metrics: ['MRR growth', 'CAC payback', 'Trial-to-paid conversion', 'NPS score']
    },
    consumerTech: {
      patterns: ['consumer launch', 'gadget', 'device launch', 'app launch', 'consumer electronics', 'wearable'],
      components: ['influencer-network', 'unboxing-kit', 'retail-relations', 'review-management'],
      immediateActions: [
        'Send review units to key tech influencers',
        'Create unboxing experience materials',
        'Brief retail partners on launch timing',
        'Prepare day-one patch notes'
      ],
      strategicPlays: [
        'Dominate launch day news cycle',
        'Create viral unboxing moments',
        'Secure retail placement and visibility',
        'Build pre-order momentum'
      ],
      metrics: ['Pre-order numbers', 'Review scores', 'Social mentions', 'Retail sell-through']
    },
    medicalDevice: {
      patterns: ['medical device', 'fda approval', 'clinical', 'healthcare tech', 'medical technology', 'diagnostic tool'],
      components: ['regulatory-comms', 'clinical-evidence', 'kol-engagement', 'reimbursement-strategy'],
      immediateActions: [
        'Prepare FDA clearance announcement',
        'Brief key opinion leaders (KOLs)',
        'Create clinical evidence packages',
        'Develop provider education materials'
      ],
      strategicPlays: [
        'Lead with clinical evidence',
        'Build KOL advocacy network',
        'Navigate reimbursement pathways',
        'Create patient success stories'
      ],
      metrics: ['Clinical outcomes', 'Provider adoption', 'Reimbursement approvals', 'Patient satisfaction']
    },
    fintech: {
      patterns: ['fintech', 'payment', 'banking app', 'crypto', 'defi', 'investment platform', 'trading app'],
      components: ['trust-building', 'security-messaging', 'regulatory-compliance', 'partnership-showcase'],
      immediateActions: [
        'Emphasize security and compliance certifications',
        'Announce banking partner relationships',
        'Create trust signals and social proof',
        'Prepare regulatory FAQ materials'
      ],
      strategicPlays: [
        'Build trust through transparency',
        'Leverage partnership credibility',
        'Create financial literacy content',
        'Demonstrate regulatory compliance'
      ],
      metrics: ['AUM growth', 'Transaction volume', 'User acquisition cost', 'Trust scores']
    },
    cpg: {
      patterns: ['consumer product', 'cpg', 'retail launch', 'food product', 'beverage launch', 'packaged goods'],
      components: ['retail-relations', 'sampling-program', 'influencer-seeding', 'amazon-optimization'],
      immediateActions: [
        'Brief retail buyers on launch plans',
        'Launch sampling program',
        'Optimize Amazon listing',
        'Seed product with micro-influencers'
      ],
      strategicPlays: [
        'Win retail shelf space',
        'Drive trial through sampling',
        'Build Amazon reviews and rankings',
        'Create Instagram-worthy moments'
      ],
      metrics: ['Retail distribution points', 'Velocity/sell-through', 'Amazon BSR', 'Repeat purchase rate']
    }
  },

  // Brand & Reputation Patterns
  brandReputation: {
    repositioning: {
      patterns: ['rebrand', 'repositioning', 'brand refresh', 'new positioning', 'brand evolution', 'brand transformation'],
      components: ['perception-research', 'stakeholder-alignment', 'visual-identity', 'narrative-development'],
      immediateActions: [
        'Conduct stakeholder perception audit',
        'Develop repositioning narrative',
        'Create internal change management plan',
        'Prepare media rollout strategy'
      ],
      strategicPlays: [
        'Shift market perception systematically',
        'Align internal culture with new brand',
        'Create proof points for new positioning',
        'Build momentum through strategic reveals'
      ],
      metrics: ['Brand perception scores', 'Employee advocacy', 'Media sentiment', 'Customer retention']
    },
    thoughtLeadership: {
      patterns: ['thought leadership', 'executive visibility', 'industry expert', 'speaking opportunities', 'executive positioning'],
      components: ['executive-positioning', 'speaking-bureau', 'linkedin-optimization', 'byline-program'],
      immediateActions: [
        'Develop executive POV platform',
        'Identify speaking opportunities',
        'Create LinkedIn content calendar',
        'Pitch byline opportunities'
      ],
      strategicPlays: [
        'Establish domain expertise',
        'Build executive personal brand',
        'Create industry conversation leadership',
        'Drive business through thought leadership'
      ],
      metrics: ['Speaking engagements', 'LinkedIn engagement', 'Media mentions', 'Lead attribution']
    },
    esg: {
      patterns: ['esg', 'sustainability', 'climate', 'social impact', 'environmental', 'carbon neutral', 'net zero'],
      components: ['impact-measurement', 'stakeholder-reporting', 'rating-optimization', 'narrative-authenticity'],
      immediateActions: [
        'Audit current ESG performance',
        'Identify quick win improvements',
        'Develop impact measurement framework',
        'Create stakeholder communication plan'
      ],
      strategicPlays: [
        'Improve ESG ratings systematically',
        'Build authentic sustainability narrative',
        'Engage stakeholders on journey',
        'Create competitive differentiation through ESG'
      ],
      metrics: ['ESG ratings', 'Carbon footprint reduction', 'Diversity metrics', 'Stakeholder trust']
    },
    employerBrand: {
      patterns: ['employer brand', 'talent', 'recruitment', 'hiring', 'great place to work', 'company culture', 'employee experience'],
      components: ['culture-storytelling', 'employee-advocacy', 'campus-relations', 'glassdoor-optimization'],
      immediateActions: [
        'Activate employee ambassadors',
        'Optimize Glassdoor presence',
        'Create recruitment content',
        'Launch referral program enhancement'
      ],
      strategicPlays: [
        'Build authentic culture narrative',
        'Activate employee advocacy at scale',
        'Win talent through differentiation',
        'Create magnetic employer brand'
      ],
      metrics: ['Glassdoor rating', 'Quality of hire', 'Employee NPS', 'Recruitment efficiency']
    },
    crisis: {
      patterns: ['crisis', 'scandal', 'emergency', 'incident', 'breach', 'recall', 'controversy'],
      components: ['crisis-monitor', 'rapid-response', 'stakeholder-comms', 'reputation-recovery'],
      immediateActions: [
        'Activate crisis response team',
        'Issue holding statement',
        'Monitor media and social sentiment',
        'Brief legal and compliance teams'
      ],
      strategicPlays: [
        'Control the narrative',
        'Demonstrate accountability',
        'Rebuild trust systematically',
        'Turn crisis into opportunity'
      ],
      metrics: ['Sentiment recovery rate', 'Message penetration', 'Stakeholder trust', 'Business impact']
    }
  },

  // Marketing Campaign Patterns
  marketingCampaigns: {
    integrated: {
      patterns: ['integrated campaign', 'omnichannel', 'multi-channel', '360 campaign', 'full funnel'],
      components: ['channel-orchestration', 'creative-alignment', 'attribution-tracking', 'performance-optimization'],
      immediateActions: [
        'Align creative across channels',
        'Set up attribution tracking',
        'Brief channel teams',
        'Create performance dashboards'
      ],
      strategicPlays: [
        'Create consistent brand experience',
        'Optimize channel mix dynamically',
        'Drive full-funnel engagement',
        'Maximize marketing efficiency'
      ],
      metrics: ['Channel attribution', 'Customer acquisition cost', 'ROAS', 'Brand lift']
    },
    influencer: {
      patterns: ['influencer', 'creator', 'ambassador', 'social media campaign', 'ugc campaign', 'creator economy'],
      components: ['influencer-vetting', 'contract-management', 'content-approval', 'performance-tracking'],
      immediateActions: [
        'Identify and vet influencers',
        'Negotiate contracts and terms',
        'Create content guidelines',
        'Set up tracking systems'
      ],
      strategicPlays: [
        'Build authentic advocacy',
        'Scale through micro-influencers',
        'Create viral moments',
        'Drive commerce through creators'
      ],
      metrics: ['Engagement rate', 'Reach', 'Conversion rate', 'EMV (Earned Media Value)']
    },
    event: {
      patterns: ['event', 'conference', 'trade show', 'summit', 'launch event', 'roadshow', 'webinar series'],
      components: ['event-production', 'speaker-management', 'attendee-experience', 'content-capture'],
      immediateActions: [
        'Lock event venue and date',
        'Confirm keynote speakers',
        'Launch registration campaign',
        'Create event content plan'
      ],
      strategicPlays: [
        'Create memorable experiences',
        'Generate content for months',
        'Build community connections',
        'Drive pipeline through events'
      ],
      metrics: ['Registration numbers', 'Attendance rate', 'Lead generation', 'Post-event engagement']
    },
    partnership: {
      patterns: ['partnership', 'alliance', 'collaboration', 'joint venture', 'merger', 'acquisition', 'strategic alliance'],
      components: ['joint-messaging', 'stakeholder-alignment', 'integration-comms', 'value-demonstration'],
      immediateActions: [
        'Align on joint messaging',
        'Brief both partner teams',
        'Create announcement materials',
        'Plan coordinated launch'
      ],
      strategicPlays: [
        'Demonstrate 1+1=3 value',
        'Leverage partner credibility',
        'Create market disruption narrative',
        'Build ecosystem positioning'
      ],
      metrics: ['Joint pipeline', 'Cross-sell rate', 'Partner satisfaction', 'Market response']
    }
  },

  // Agency Service Patterns
  agencyServices: {
    proposal: {
      patterns: ['rfp', 'proposal', 'pitch', 'new business', 'agency selection', 'vendor selection'],
      components: ['case-studies', 'team-showcase', 'methodology-demo', 'pricing-strategy'],
      immediateActions: [
        'Analyze RFP requirements',
        'Assemble pitch team',
        'Gather relevant case studies',
        'Create customized solutions'
      ],
      strategicPlays: [
        'Demonstrate unique value',
        'Show cultural fit',
        'Prove ROI capability',
        'Win through insights'
      ],
      metrics: ['Win rate', 'Proposal efficiency', 'Client feedback', 'Contract value']
    },
    planning: {
      patterns: ['annual plan', 'quarterly plan', 'strategy development', 'roadmap', 'planning session'],
      components: ['objective-setting', 'budget-allocation', 'timeline-development', 'success-metrics'],
      immediateActions: [
        'Review past performance',
        'Set SMART objectives',
        'Allocate resources',
        'Create measurement framework'
      ],
      strategicPlays: [
        'Align with business objectives',
        'Build flexibility into plans',
        'Create early win opportunities',
        'Establish clear success metrics'
      ],
      metrics: ['Objective completion', 'Budget efficiency', 'Timeline adherence', 'ROI achievement']
    }
  }
}

// Detect campaign type from user query and conversation context
export function detectCampaignType(
  userQuery: string,
  conversationHistory: any[] = [],
  organizationContext?: any
): CampaignType {
  const query = userQuery.toLowerCase()
  const fullContext = conversationHistory.map(m => m.content?.toLowerCase() || '').join(' ') + ' ' + query

  let bestMatch: CampaignType = {
    category: 'Brand & Reputation',
    type: 'thought-leadership',
    confidence: 0.5,
    indicators: ['default'],
    components: ['thought-leadership', 'strategic-planner'],
    immediateActions: ['Develop strategic narrative', 'Align stakeholder messaging'],
    strategicPlays: ['Build thought leadership position', 'Create industry influence'],
    metrics: ['Share of voice', 'Message penetration', 'Stakeholder engagement']
  }

  let highestConfidence = 0.5

  // Check each pattern category
  for (const [categoryKey, categoryPatterns] of Object.entries(CAMPAIGN_PATTERNS)) {
    for (const [typeKey, typeData] of Object.entries(categoryPatterns)) {
      const matchedPatterns = typeData.patterns.filter(pattern =>
        fullContext.includes(pattern)
      )

      if (matchedPatterns.length > 0) {
        const confidence = Math.min(0.95, 0.6 + (matchedPatterns.length * 0.15))

        if (confidence > highestConfidence) {
          highestConfidence = confidence
          bestMatch = {
            category: formatCategoryName(categoryKey),
            type: typeKey,
            confidence,
            indicators: matchedPatterns,
            components: typeData.components,
            immediateActions: typeData.immediateActions,
            strategicPlays: typeData.strategicPlays,
            metrics: typeData.metrics
          }
        }
      }
    }
  }

  // Industry-specific adjustments
  if (organizationContext?.industry) {
    const industry = organizationContext.industry.toLowerCase()

    if (industry.includes('tech') || industry.includes('software')) {
      if (query.includes('launch')) {
        bestMatch.subType = 'b2b-saas'
      }
    } else if (industry.includes('health') || industry.includes('medical')) {
      if (query.includes('launch') || query.includes('announcement')) {
        bestMatch.subType = 'medical-device'
      }
    } else if (industry.includes('finance') || industry.includes('banking')) {
      if (query.includes('launch')) {
        bestMatch.subType = 'fintech'
      }
    }
  }

  return bestMatch
}

// Format category name for display
function formatCategoryName(key: string): string {
  const names: Record<string, string> = {
    productLaunch: 'Product Launch',
    brandReputation: 'Brand & Reputation',
    marketingCampaigns: 'Marketing Campaign',
    agencyServices: 'Agency Services'
  }
  return names[key] || 'Strategic Initiative'
}

// Build tactical elements based on campaign type
export function buildTacticalElements(campaignType: CampaignType) {
  return {
    campaign_elements: {
      media_outreach: generateMediaOutreach(campaignType),
      content_creation: generateContentPlan(campaignType),
      stakeholder_engagement: generateStakeholderPlan(campaignType)
    },
    immediate_actions: campaignType.immediateActions,
    week_one_priorities: generateWeekOnePriorities(campaignType),
    strategic_plays: campaignType.strategicPlays,
    success_metrics: campaignType.metrics
  }
}

// Generate media outreach plan based on campaign type
function generateMediaOutreach(campaignType: CampaignType): string[] {
  const baseOutreach = [
    'Tier 1 media exclusive briefings',
    'Trade publication deep dives'
  ]

  const typeSpecific: Record<string, string[]> = {
    'b2bSaas': ['Analyst briefings (Gartner, Forrester)', 'Technical media demonstrations'],
    'consumerTech': ['Tech reviewer early access', 'YouTube creator partnerships'],
    'medicalDevice': ['Medical journal placements', 'Healthcare trade media'],
    'fintech': ['Financial media exclusives', 'Fintech podcast tour'],
    'thoughtLeadership': ['Executive byline placements', 'Speaking opportunity pitches'],
    'crisis': ['Rapid response statements', 'Executive media availability'],
    'esg': ['Sustainability report launch', 'ESG media roundtables']
  }

  return [...baseOutreach, ...(typeSpecific[campaignType.type] || [])]
}

// Generate content plan based on campaign type (returns valid MCP content type IDs)
function generateContentPlan(campaignType: CampaignType): string[] {
  // Type-specific auto-executable content (using all 35 valid MCP content type IDs)
  const typeSpecific: Record<string, string[]> = {
    'b2bSaas': [
      'press-release',
      'blog-post',
      'thought-leadership',
      'case-study',
      'white-paper',
      'qa-document',
      'linkedin-article',
      'email',
      'media-pitch',
      'value-proposition',
      'competitive-positioning'
    ],
    'consumerTech': [
      'press-release',
      'blog-post',
      'social-post',
      'instagram-caption',
      'twitter-thread',
      'facebook-post',
      'media-pitch',
      'qa-document',
      'video',
      'infographic'
    ],
    'medicalDevice': [
      'press-release',
      'blog-post',
      'thought-leadership',
      'case-study',
      'white-paper',
      'executive-statement',
      'media-pitch',
      'qa-document',
      'linkedin-article'
    ],
    'fintech': [
      'press-release',
      'blog-post',
      'thought-leadership',
      'white-paper',
      'executive-statement',
      'investor-update',
      'media-pitch',
      'qa-document',
      'competitive-positioning'
    ],
    'thoughtLeadership': [
      'thought-leadership',
      'blog-post',
      'linkedin-article',
      'executive-statement',
      'white-paper',
      'twitter-thread',
      'newsletter',
      'podcast-pitch',
      'media-pitch'
    ],
    'crisis': [
      'executive-statement',
      'crisis-response',
      'apology-statement',
      'qa-document',
      'social-post',
      'email',
      'media-pitch',
      'board-presentation'
    ],
    'esg': [
      'press-release',
      'blog-post',
      'thought-leadership',
      'case-study',
      'white-paper',
      'social-post',
      'infographic',
      'investor-update',
      'media-pitch'
    ],
    'fundraising': [
      'press-release',
      'investor-update',
      'blog-post',
      'media-pitch',
      'thought-leadership',
      'social-post',
      'qa-document'
    ],
    'acquisition': [
      'press-release',
      'executive-statement',
      'investor-update',
      'blog-post',
      'media-pitch',
      'qa-document',
      'email'
    ],
    'rebrand': [
      'press-release',
      'brand-narrative',
      'messaging',
      'blog-post',
      'social-post',
      'email',
      'media-pitch',
      'qa-document'
    ]
  }

  // Default comprehensive content set for unknown types
  const defaultContent = [
    'press-release',
    'blog-post',
    'media-pitch',
    'social-post',
    'qa-document',
    'thought-leadership',
    'email'
  ]

  return typeSpecific[campaignType.type] || defaultContent
}

// Generate stakeholder engagement plan
function generateStakeholderPlan(campaignType: CampaignType): string[] {
  const baseEngagement = [
    'Internal team alignment',
    'Executive briefing'
  ]

  const typeSpecific: Record<string, string[]> = {
    'b2bSaas': ['Customer advisory board', 'Partner enablement', 'Developer community'],
    'consumerTech': ['Retail partner briefings', 'Influencer engagement', 'Community management'],
    'medicalDevice': ['KOL engagement', 'Provider training', 'Payer discussions'],
    'fintech': ['Regulatory briefings', 'Partner bank alignment', 'Investor updates'],
    'thoughtLeadership': ['Board alignment', 'Industry peer engagement', 'Academic partnerships'],
    'crisis': ['Regulator communication', 'Customer outreach', 'Employee town halls'],
    'esg': ['NGO partnerships', 'Investor relations', 'Community engagement']
  }

  return [...baseEngagement, ...(typeSpecific[campaignType.type] || [])]
}

// Generate week one priorities
function generateWeekOnePriorities(campaignType: CampaignType): string[] {
  const basePriorities = [
    'Finalize messaging framework',
    'Brief spokesperson team'
  ]

  const urgentByType: Record<string, string[]> = {
    'crisis': ['Issue initial response', 'Establish command center', 'Begin monitoring'],
    'launch': ['Lock embargo dates', 'Confirm launch partners', 'Finalize assets'],
    'thoughtLeadership': ['Develop POV platform', 'Identify opportunities', 'Create calendar'],
    'esg': ['Baseline current state', 'Set targets', 'Engage stakeholders']
  }

  return [...basePriorities, ...(urgentByType[campaignType.type] || ['Create detailed timeline', 'Assign responsibilities'])]
}