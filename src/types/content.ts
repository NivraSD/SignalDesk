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