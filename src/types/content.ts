// Content Generation Types

export type ContentType =
  | 'press-release'
  | 'crisis-response'
  | 'social-post'
  | 'media-pitch'
  | 'exec-statement'
  | 'qa-doc'
  | 'messaging'
  | 'thought-leadership'
  | 'presentation'
  | 'email'
  // Business Development
  | 'proposal'
  | 'market-research'
  | 'competitive-analysis'
  | 'partnership-brief'
  | 'strategic-recommendation'

export type ContentStatus = 'pending' | 'in-progress' | 'review' | 'approved' | 'completed' | 'published'
export type ContentPriority = 'urgent' | 'high' | 'medium' | 'low'
export type AudienceType =
  | 'investors'
  | 'customers'
  | 'employees'
  | 'media'
  | 'regulators'
  | 'partners'
  | 'general-public'
  | 'technical'
  | 'executives'
  | 'board'

export interface ContentItem {
  id: string
  title: string
  type: ContentType
  content?: string
  status: ContentStatus
  priority: ContentPriority
  frameworkId?: string
  audience?: AudienceType[]
  metadata?: {
    author?: string
    createdAt: Date
    updatedAt?: Date
    publishDate?: Date
    tone?: string
    wordCount?: number
    readingTime?: number
  }
  versions?: ContentVersion[]
  linkedAssets?: string[]
  tags?: string[]
}

export interface ContentVersion {
  id: string
  audience: AudienceType
  content: string
  adaptations: {
    tone: string
    language: 'technical' | 'casual' | 'formal' | 'conversational'
    emphasis: string[]
    omissions: string[]
    additions: string[]
  }
  metadata: {
    readingLevel: number
    technicalDepth: 'basic' | 'intermediate' | 'advanced'
    culturalContext?: string
  }
}

export interface OrchestrationSession {
  id: string
  frameworkId: string
  objective: string
  narrative: string
  proofPoints: string[]
  contentNeeds: any
  timeline: any
  status: 'active' | 'paused' | 'completed'
  createdAt: Date
  completedAt?: Date
  progress: {
    total: number
    completed: number
    inProgress: number
  }
}

export interface ContentTemplate {
  id: string
  name: string
  type: ContentType
  description?: string
  template: string
  placeholders: string[]
  guidelines?: string
  examples?: string[]
  tags?: string[]
}

export interface ContentGenerationRequest {
  type: ContentType
  context: {
    framework?: any
    organization?: any
    intelligence?: any
  }
  options: {
    tone?: string
    audience?: AudienceType[]
    wordCount?: number
    includeData?: boolean
    generateVariations?: boolean
  }
  prompt?: string
  template?: ContentTemplate
}

export interface ContentGenerationResponse {
  success: boolean
  content: string
  variations?: ContentVersion[]
  metadata?: {
    generationTime: number
    model: string
    tokensUsed: number
  }
  suggestions?: {
    improvements: string[]
    alternativesApproaches: string[]
    riskFactors: string[]
  }
}

// Content type configurations
export const CONTENT_TYPE_CONFIG: Record<ContentType, {
  label: string
  icon: string
  description: string
  defaultTone: string
  typicalLength: string
  guidelines: string
}> = {
  'press-release': {
    label: 'Press Release',
    icon: '📰',
    description: 'Professional press release following AP style',
    defaultTone: 'professional',
    typicalLength: '400-600 words',
    guidelines: 'Use inverted pyramid structure, include quotes, add boilerplate'
  },
  'crisis-response': {
    label: 'Crisis Response',
    icon: '🚨',
    description: 'Crisis statement with empathy and accountability',
    defaultTone: 'empathetic',
    typicalLength: '200-400 words',
    guidelines: 'Acknowledge situation, express empathy, outline actions, provide next steps'
  },
  'social-post': {
    label: 'Social Media Post',
    icon: '💬',
    description: 'Engaging social media content for multiple platforms',
    defaultTone: 'conversational',
    typicalLength: '50-280 characters',
    guidelines: 'Platform-specific formatting, include hashtags, optimize for engagement'
  },
  'media-pitch': {
    label: 'Media Pitch',
    icon: '📧',
    description: 'Compelling pitch to journalists',
    defaultTone: 'persuasive',
    typicalLength: '200-300 words',
    guidelines: 'Strong subject line, news hook, exclusive angle, clear call-to-action'
  },
  'exec-statement': {
    label: 'Executive Statement',
    icon: '💼',
    description: 'Executive voice with vision and authority',
    defaultTone: 'authoritative',
    typicalLength: '300-500 words',
    guidelines: 'Leadership perspective, strategic vision, inspiring tone'
  },
  'qa-doc': {
    label: 'Q&A Document',
    icon: '❓',
    description: 'Comprehensive Q&A anticipating stakeholder questions',
    defaultTone: 'informative',
    typicalLength: '1000-2000 words',
    guidelines: 'Anticipate tough questions, provide thorough answers, maintain consistency'
  },
  'messaging': {
    label: 'Messaging Framework',
    icon: '🎯',
    description: 'Strategic messaging with key points',
    defaultTone: 'strategic',
    typicalLength: '500-800 words',
    guidelines: 'Core message, supporting points, proof points, call-to-action'
  },
  'thought-leadership': {
    label: 'Thought Leadership',
    icon: '💡',
    description: 'Insightful article demonstrating expertise',
    defaultTone: 'insightful',
    typicalLength: '800-1200 words',
    guidelines: 'Unique perspective, data-driven insights, actionable takeaways'
  },
  'presentation': {
    label: 'Presentation Deck',
    icon: '📊',
    description: 'Visual presentation with clear narrative',
    defaultTone: 'engaging',
    typicalLength: '10-15 slides',
    guidelines: 'Clear storyline, visual hierarchy, one key point per slide'
  },
  'email': {
    label: 'Email Campaign',
    icon: '✉️',
    description: 'Email communication for various purposes',
    defaultTone: 'personal',
    typicalLength: '200-400 words',
    guidelines: 'Clear subject, personalization, single call-to-action, mobile-friendly'
  },
  'proposal': {
    label: 'Business Proposal',
    icon: '📋',
    description: 'Business development proposal with intelligent reference retrieval',
    defaultTone: 'professional',
    typicalLength: '2000-5000 words',
    guidelines: 'Executive summary, technical approach, team credentials, pricing, case studies. Use past proposals as reference when available.'
  },
  'market-research': {
    label: 'Market Research',
    icon: '📊',
    description: 'Market analysis and opportunity assessment',
    defaultTone: 'analytical',
    typicalLength: '1500-3000 words',
    guidelines: 'Market size, trends, competitive landscape, opportunities, data-driven recommendations'
  },
  'competitive-analysis': {
    label: 'Competitive Analysis',
    icon: '🎯',
    description: 'Detailed competitor analysis and positioning',
    defaultTone: 'analytical',
    typicalLength: '1000-2000 words',
    guidelines: 'Competitor profiles, SWOT analysis, positioning map, strategic recommendations'
  },
  'partnership-brief': {
    label: 'Partnership Brief',
    icon: '🤝',
    description: 'Partnership opportunity and framework',
    defaultTone: 'collaborative',
    typicalLength: '1000-1500 words',
    guidelines: 'Partnership rationale, mutual benefits, structure, terms, next steps'
  },
  'strategic-recommendation': {
    label: 'Strategic Recommendation',
    icon: '💡',
    description: 'Strategic guidance and tactical recommendations',
    defaultTone: 'strategic',
    typicalLength: '1500-2500 words',
    guidelines: 'Situation analysis, strategic options, recommended approach, implementation plan'
  }
}

// Audience profiles for content adaptation
export const AUDIENCE_PROFILES = {
  investors: {
    tone: 'professional',
    interests: ['ROI', 'growth', 'market position', 'financial metrics'],
    concerns: ['risk', 'competition', 'regulation', 'profitability'],
    languageStyle: 'formal',
    technicalDepth: 'intermediate'
  },
  customers: {
    tone: 'friendly',
    interests: ['benefits', 'features', 'value', 'support'],
    concerns: ['price', 'reliability', 'ease of use', 'security'],
    languageStyle: 'conversational',
    technicalDepth: 'basic'
  },
  employees: {
    tone: 'inclusive',
    interests: ['culture', 'growth', 'impact', 'benefits'],
    concerns: ['job security', 'workload', 'career development'],
    languageStyle: 'casual',
    technicalDepth: 'intermediate'
  },
  media: {
    tone: 'newsworthy',
    interests: ['story angle', 'exclusives', 'data', 'quotes'],
    concerns: ['accuracy', 'timeliness', 'relevance'],
    languageStyle: 'formal',
    technicalDepth: 'basic'
  },
  regulators: {
    tone: 'compliant',
    interests: ['compliance', 'standards', 'procedures', 'documentation'],
    concerns: ['violations', 'risk', 'public safety'],
    languageStyle: 'formal',
    technicalDepth: 'advanced'
  }
}

// ========================================
// BUSINESS DEVELOPMENT TYPES
// ========================================

export type ProposalType =
  | 'new_business'
  | 'renewal'
  | 'rfp_response'
  | 'unsolicited_pitch'
  | 'partnership'
  | 'other'

export type ProposalOutcome =
  | 'won'
  | 'lost'
  | 'pending'
  | 'no_decision'
  | 'unknown'

export type DealValueRange =
  | 'under_50k'
  | '50k_100k'
  | '100k_250k'
  | '250k_500k'
  | '500k_1m'
  | '1m_5m'
  | '5m_plus'
  | 'unknown'

export interface ProposalMetadata {
  // Identification
  clientName?: string
  industry: string
  sector?: string

  // Proposal details
  proposalType: ProposalType
  servicesOffered: string[]
  dealValueRange?: DealValueRange

  // Content structure
  proposalSections?: {
    executiveSummary?: string
    technicalApproach?: string
    teamCredentials?: string
    caseStudies?: string
    pricing?: string
    timeline?: string
    references?: string
    [key: string]: string | undefined
  }
  keyDifferentiators?: string[]

  // Outcome tracking
  outcome?: ProposalOutcome
  outcomeDate?: Date
  outcomeNotes?: string
  winProbability?: number // 0-100

  // Competitive intelligence
  competitiveLandscape?: {
    competitors?: string[]
    whyWeWon?: string
    whyWeLost?: string
  }
  clientRequirements?: Record<string, any>
  decisionCriteria?: Record<string, any>
  pricingStrategy?: string

  // Dates
  proposalDate?: Date
  submissionDeadline?: Date
  decisionDate?: Date

  // Team
  teamMembers?: string[]

  // References to other proposals
  referencedProposals?: string[] // IDs of proposals used as reference

  // File info
  filePath?: string
  fileType?: string
  fileSizeBytes?: number
}

export interface ProposalSearchCriteria {
  industry?: string
  sector?: string
  servicesOffered?: string[]
  outcomePreference?: 'won_only' | 'successful_and_pending' | 'all'
  recencyWeight?: number // 0-1, higher = prefer recent
  minWinRate?: number // Minimum win rate for similar proposals
  limit?: number
}

export interface ProposalSuggestion {
  proposalId: string
  title: string
  clientName: string
  industry: string
  sector?: string
  outcome: ProposalOutcome
  proposalDate: Date
  matchScore: number // 0-100
  matchReasons: string[] // ["Same industry", "Similar services", "Recent (2024)", "Won"]
  relevantSections: string[] // Which sections are most useful
  winRate?: number // Success rate for similar proposals
  keyDifferentiators?: string[]
}

export interface ProposalCreationRequest {
  // User's new proposal requirements
  clientName?: string
  industry: string
  sector?: string
  servicesOffered: string[]
  proposalType: ProposalType
  dealValueRange?: DealValueRange

  // User preferences for references
  useReferences: boolean // Auto-query Memory Vault?
  specificReferences?: string[] // User-specified proposal IDs
  sectionReferences?: {
    [section: string]: string[] // e.g., { "technicalApproach": ["proposal-123", "proposal-456"] }
  }

  // Additional context
  clientRequirements?: string
  competitiveContext?: string
  budgetConstraints?: string
  timeline?: string
  keyDifferentiators?: string[]

  // Generation options
  includeExecutiveSummary?: boolean
  includeTechnicalApproach?: boolean
  includeTeamCredentials?: boolean
  includeCaseStudies?: boolean
  includePricing?: boolean
  includeTimeline?: boolean
}

export interface ProposalFileUpload {
  file: File

  // Auto-extracted metadata (with confidence scores)
  extracted?: {
    clientName?: { value: string; confidence: number }
    industry?: { value: string; confidence: number }
    sector?: { value: string; confidence: number }
    servicesOffered?: { value: string[]; confidence: number }
    proposalSections?: { value: Record<string, string>; confidence: number }
    keyDifferentiators?: { value: string[]; confidence: number }
  }

  // User-provided metadata
  metadata: ProposalMetadata
}

export interface ProposalAnalytics {
  organizationId: string

  overallStats: {
    totalProposals: number
    winRate: number
    avgDealValue?: string
    avgDecisionTime?: number // days
  }

  byIndustry: Array<{
    industry: string
    proposals: number
    winRate: number
    avgDealSize?: string
  }>

  byProposalType: Array<{
    type: ProposalType
    winRate: number
    proposals: number
  }>

  topDifferentiators: Array<{
    differentiator: string
    timesUsed: number
    winRate: number
  }>

  trends: {
    winRateTrend: 'improving' | 'declining' | 'stable'
    recentWins: ProposalSuggestion[]
    recentLosses: ProposalSuggestion[]
  }

  insights: string[] // AI-generated insights
}