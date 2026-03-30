// GEO-VECTOR Content Type Selection Algorithm
// Selects optimal 8-12 content types based on objective, industry, and constraints

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Content Type Definitions
interface ContentType {
  id: string
  label: string
  execute_tab_id: string
  citation_rate: number
  effort: 'low' | 'medium' | 'high'
  category: 'automated' | 'user_assisted'
  best_for: Array<'drive_sales' | 'thought_leadership' | 'technical_adoption'>
  requires?: {
    time_per_week?: number
    technical_capability?: 'low' | 'medium' | 'high'
    existing_presence?: string // 'g2_profile', 'youtube_channel', etc.
  }
}

// All available content types (from ExecuteTabProduction + custom GEO)
const CONTENT_TYPES: ContentType[] = [
  // Universal automated (always include)
  {
    id: 'schema-optimization',
    label: 'Schema.org Markup Optimization',
    execute_tab_id: 'custom',
    citation_rate: 75,
    effort: 'low',
    category: 'automated',
    best_for: ['drive_sales', 'thought_leadership', 'technical_adoption']
  },
  {
    id: 'blog-post',
    label: 'Blog Posts',
    execute_tab_id: 'blog-post',
    citation_rate: 40,
    effort: 'low',
    category: 'automated',
    best_for: ['drive_sales', 'thought_leadership', 'technical_adoption']
  },
  {
    id: 'press-release',
    label: 'Press Releases',
    execute_tab_id: 'press-release',
    citation_rate: 50,
    effort: 'low',
    category: 'automated',
    best_for: ['drive_sales', 'thought_leadership', 'technical_adoption']
  },

  // Drive sales specific
  {
    id: 'case-study',
    label: 'Case Studies',
    execute_tab_id: 'case-study',
    citation_rate: 55,
    effort: 'medium',
    category: 'automated',
    best_for: ['drive_sales', 'technical_adoption']
  },
  {
    id: 'faq-schema',
    label: 'FAQ Schema Markup',
    execute_tab_id: 'custom',
    citation_rate: 60,
    effort: 'low',
    category: 'automated',
    best_for: ['drive_sales', 'technical_adoption']
  },
  {
    id: 'value-proposition',
    label: 'Value Proposition',
    execute_tab_id: 'value-proposition',
    citation_rate: 40,
    effort: 'low',
    category: 'automated',
    best_for: ['drive_sales']
  },
  {
    id: 'competitive-positioning',
    label: 'Competitive Positioning',
    execute_tab_id: 'competitive-positioning',
    citation_rate: 45,
    effort: 'medium',
    category: 'automated',
    best_for: ['drive_sales']
  },
  {
    id: 'infographic',
    label: 'Infographics',
    execute_tab_id: 'infographic',
    citation_rate: 50,
    effort: 'medium',
    category: 'automated',
    best_for: ['drive_sales', 'technical_adoption']
  },
  {
    id: 'comparison-copy',
    label: 'G2/Capterra Profile Optimization',
    execute_tab_id: 'custom',
    citation_rate: 65,
    effort: 'medium',
    category: 'user_assisted',
    best_for: ['drive_sales'],
    requires: {
      time_per_week: 1,
      existing_presence: 'g2_profile'
    }
  },
  {
    id: 'doc-outline',
    label: 'Documentation Outlines',
    execute_tab_id: 'custom',
    citation_rate: 70,
    effort: 'high',
    category: 'user_assisted',
    best_for: ['drive_sales', 'technical_adoption'],
    requires: {
      time_per_week: 2,
      technical_capability: 'medium'
    }
  },

  // Thought leadership specific
  {
    id: 'thought-leadership',
    label: 'Thought Leadership Articles',
    execute_tab_id: 'thought-leadership',
    citation_rate: 35,
    effort: 'low',
    category: 'automated',
    best_for: ['thought_leadership']
  },
  {
    id: 'linkedin-post',
    label: 'LinkedIn Posts',
    execute_tab_id: 'linkedin-post',
    citation_rate: 40,
    effort: 'low',
    category: 'automated',
    best_for: ['thought_leadership']
  },
  {
    id: 'whitepaper',
    label: 'Whitepapers',
    execute_tab_id: 'whitepaper',
    citation_rate: 60,
    effort: 'medium',
    category: 'automated',
    best_for: ['thought_leadership', 'technical_adoption']
  },
  {
    id: 'executive-statement',
    label: 'Executive Statements',
    execute_tab_id: 'executive-statement',
    citation_rate: 45,
    effort: 'low',
    category: 'automated',
    best_for: ['thought_leadership']
  },
  {
    id: 'brand-narrative',
    label: 'Brand Narrative',
    execute_tab_id: 'brand-narrative',
    citation_rate: 30,
    effort: 'low',
    category: 'automated',
    best_for: ['thought_leadership']
  },
  {
    id: 'media-pitch',
    label: 'Media Outreach',
    execute_tab_id: 'media-pitch',
    citation_rate: 55,
    effort: 'high',
    category: 'user_assisted',
    best_for: ['thought_leadership'],
    requires: {
      time_per_week: 3
    }
  },
  {
    id: 'byline-article',
    label: 'Byline Articles',
    execute_tab_id: 'byline-article',
    citation_rate: 50,
    effort: 'high',
    category: 'user_assisted',
    best_for: ['thought_leadership'],
    requires: {
      time_per_week: 2
    }
  },
  {
    id: 'podcast-pitch',
    label: 'Podcast Pitches',
    execute_tab_id: 'podcast-pitch',
    citation_rate: 25,
    effort: 'high',
    category: 'user_assisted',
    best_for: ['thought_leadership'],
    requires: {
      time_per_week: 3
    }
  },
  {
    id: 'quora-answer',
    label: 'Quora Answers',
    execute_tab_id: 'custom',
    citation_rate: 30,
    effort: 'medium',
    category: 'user_assisted',
    best_for: ['thought_leadership'],
    requires: {
      time_per_week: 1
    }
  },

  // Technical adoption specific
  {
    id: 'technical-blog',
    label: 'Technical Blog Posts',
    execute_tab_id: 'blog-post',
    citation_rate: 50,
    effort: 'low',
    category: 'automated',
    best_for: ['technical_adoption']
  },
  {
    id: 'stackoverflow-answer',
    label: 'Stack Overflow Answers',
    execute_tab_id: 'custom',
    citation_rate: 70,
    effort: 'medium',
    category: 'user_assisted',
    best_for: ['technical_adoption'],
    requires: {
      time_per_week: 1,
      technical_capability: 'high'
    }
  },
  {
    id: 'video-script',
    label: 'Video Scripts',
    execute_tab_id: 'video-script',
    citation_rate: 45,
    effort: 'high',
    category: 'user_assisted',
    best_for: ['drive_sales', 'technical_adoption'],
    requires: {
      time_per_week: 2,
      existing_presence: 'youtube_channel'
    }
  },
  {
    id: 'github-docs',
    label: 'GitHub Documentation',
    execute_tab_id: 'custom',
    citation_rate: 65,
    effort: 'high',
    category: 'user_assisted',
    best_for: ['technical_adoption'],
    requires: {
      time_per_week: 2,
      technical_capability: 'high'
    }
  }
]

// Selection Input
interface SelectionInput {
  objective: 'drive_sales' | 'thought_leadership' | 'technical_adoption'
  industry: string
  constraints: {
    time_per_week: number
    budget: 'low' | 'medium' | 'high'
    technical_capability: 'low' | 'medium' | 'high'
  }
  current_presence: {
    has_g2_profile?: boolean
    has_technical_docs?: boolean
    has_blog?: boolean
    has_youtube?: boolean
    has_github?: boolean
  }
}

// Selection Output
interface SelectionOutput {
  automated: Array<{
    id: string
    label: string
    execute_tab_id: string
    citation_rate: number
    effort: string
    rationale: string
  }>
  user_assisted: Array<{
    id: string
    label: string
    execute_tab_id: string
    citation_rate: number
    effort: string
    time_per_week: number
    rationale: string
  }>
  total_count: number
  expected_impact: string
  time_investment: string
  recommendations: string[]
}

function selectContentTypes(input: SelectionInput): SelectionOutput {
  const selected: ContentType[] = []
  const recommendations: string[] = []

  // Step 1: Always include universal automated (schema, blog, press)
  const universal = CONTENT_TYPES.filter(ct =>
    ct.category === 'automated' &&
    ct.best_for.length === 3
  )
  selected.push(...universal)

  // Step 2: Add objective-specific automated content
  const objectiveAutomated = CONTENT_TYPES.filter(ct =>
    ct.category === 'automated' &&
    ct.best_for.includes(input.objective) &&
    !selected.includes(ct)
  )

  // Sort by citation rate and add top performers
  objectiveAutomated.sort((a, b) => b.citation_rate - a.citation_rate)
  selected.push(...objectiveAutomated.slice(0, 5)) // Add top 5

  // Step 3: Add user-assisted based on constraints
  const objectiveUserAssisted = CONTENT_TYPES.filter(ct =>
    ct.category === 'user_assisted' &&
    ct.best_for.includes(input.objective)
  )

  for (const ct of objectiveUserAssisted) {
    // Check time constraint
    if (ct.requires?.time_per_week && ct.requires.time_per_week > input.constraints.time_per_week) {
      recommendations.push(
        `Consider adding "${ct.label}" (${ct.citation_rate}% citation) if you can allocate ${ct.requires.time_per_week} hours/week`
      )
      continue
    }

    // Check technical capability
    if (ct.requires?.technical_capability) {
      const capabilityLevels = { low: 1, medium: 2, high: 3 }
      const required = capabilityLevels[ct.requires.technical_capability]
      const available = capabilityLevels[input.constraints.technical_capability]

      if (required > available) {
        recommendations.push(
          `"${ct.label}" requires ${ct.requires.technical_capability} technical capability`
        )
        continue
      }
    }

    // Check existing presence
    if (ct.requires?.existing_presence) {
      // Handle both 'g2_profile' and 'has_g2_profile' formats
      const presenceKey = ct.requires.existing_presence as string
      const hasKey = `has_${presenceKey}` as keyof typeof input.current_presence
      const directKey = presenceKey as keyof typeof input.current_presence

      const hasPresence = input.current_presence[hasKey] || input.current_presence[directKey]

      if (!hasPresence) {
        recommendations.push(
          `Create ${ct.requires.existing_presence.replace('_', ' ')} to enable "${ct.label}" (${ct.citation_rate}% citation)`
        )
        continue
      }
    }

    // All checks passed, add it
    selected.push(ct)
  }

  // Step 4: Cap at 12, prioritize by citation_rate × (1 / effort_multiplier)
  const effortMultiplier = { low: 1, medium: 1.5, high: 2 }
  selected.sort((a, b) => {
    const scoreA = a.citation_rate / effortMultiplier[a.effort]
    const scoreB = b.citation_rate / effortMultiplier[b.effort]
    return scoreB - scoreA
  })

  const final = selected.slice(0, 12)

  // Split into automated and user-assisted
  const automated = final.filter(ct => ct.category === 'automated')
  const userAssisted = final.filter(ct => ct.category === 'user_assisted')

  // Calculate expected impact
  const avgCitationRate = final.reduce((sum, ct) => sum + ct.citation_rate, 0) / final.length
  const weeks = input.objective === 'thought_leadership' ? 12 : input.objective === 'technical_adoption' ? 8 : 10
  const expectedImpact = `${Math.round(avgCitationRate * 0.6)}-${Math.round(avgCitationRate * 0.8)}% visibility increase in ${weeks} weeks`

  // Calculate time investment
  const userAssistedTime = userAssisted.reduce((sum, ct) => sum + (ct.requires?.time_per_week || 0), 0)
  const timeInvestment = userAssistedTime > 0
    ? `${userAssistedTime}-${userAssistedTime + 1} hours/week for user-assisted content`
    : 'Minimal time investment (mostly automated)'

  return {
    automated: automated.map(ct => ({
      id: ct.id,
      label: ct.label,
      execute_tab_id: ct.execute_tab_id,
      citation_rate: ct.citation_rate,
      effort: ct.effort,
      rationale: generateRationale(ct, input.objective)
    })),
    user_assisted: userAssisted.map(ct => ({
      id: ct.id,
      label: ct.label,
      execute_tab_id: ct.execute_tab_id,
      citation_rate: ct.citation_rate,
      effort: ct.effort,
      time_per_week: ct.requires?.time_per_week || 0,
      rationale: generateRationale(ct, input.objective)
    })),
    total_count: final.length,
    expected_impact: expectedImpact,
    time_investment: timeInvestment,
    recommendations
  }
}

function generateRationale(ct: ContentType, objective: string): string {
  const rationales: Record<string, string> = {
    'schema-optimization': 'Highest AI citation rate (75%). AI platforms prioritize structured data for factual answers.',
    'blog-post': 'Versatile content type with consistent citations. Essential for SEO and AI visibility.',
    'press-release': 'High credibility signals. Widely distributed and indexed by AI platforms.',
    'case-study': 'Strong social proof. AI platforms cite customer success stories when recommending products.',
    'faq-schema': 'Direct answers to common questions. AI platforms extract FAQ content for responses.',
    'value-proposition': 'Clarifies product positioning. Helps AI platforms understand what you do.',
    'competitive-positioning': 'Helps AI platforms make comparisons. Critical for "best X for Y" queries.',
    'infographic': 'Visual data representations. AI platforms cite statistics and data from infographics.',
    'comparison-copy': 'G2/Capterra profiles have 65% citation rate. Essential for product comparison queries.',
    'doc-outline': 'Technical documentation has 70% citation rate. Critical for how-to queries.',
    'thought-leadership': 'Establishes expertise. AI platforms cite thought leaders for trend analysis.',
    'linkedin-post': 'Professional platform with high AI indexing. Good for executive visibility.',
    'whitepaper': '60% citation for in-depth analysis. AI platforms prefer authoritative sources.',
    'executive-statement': 'Industry commentary from leadership. AI platforms cite for expert opinions.',
    'brand-narrative': 'Company story and mission. Helps AI platforms understand your organization.',
    'media-pitch': '55% citation for earned media. High-quality backlinks from publications.',
    'byline-article': 'Published in industry outlets. High authority signals for AI platforms.',
    'podcast-pitch': 'Audio content increasingly cited by AI. Long-form discussion format.',
    'quora-answer': 'Q&A format matches AI response style. Good for niche expertise queries.',
    'technical-blog': 'Higher citation rate (50%) for technical content. Developer-focused queries.',
    'stackoverflow-answer': '70% citation rate for technical questions. Essential for developer tools.',
    'video-script': 'Video content frequently cited by AI. Good for tutorials and demos.',
    'github-docs': '65% citation for open-source projects. Critical for developer adoption.'
  }

  return rationales[ct.id] || `Supports ${objective} objective with ${ct.citation_rate}% AI citation rate.`
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    })
  }

  try {
    const {
      objective,
      industry,
      constraints,
      current_presence,
      session_id,
      organization_id
    } = await req.json()

    console.log('🎯 Selecting content types:', {
      objective,
      industry,
      time_available: constraints?.time_per_week,
      session_id
    })

    // Validate input
    if (!objective || !['drive_sales', 'thought_leadership', 'technical_adoption'].includes(objective)) {
      throw new Error('Invalid objective. Must be: drive_sales, thought_leadership, or technical_adoption')
    }

    // Select content types
    const selection = selectContentTypes({
      objective,
      industry: industry || 'General',
      constraints: constraints || {
        time_per_week: 2,
        budget: 'medium',
        technical_capability: 'medium'
      },
      current_presence: current_presence || {}
    })

    console.log('✅ Content selection complete:', {
      automated_count: selection.automated.length,
      user_assisted_count: selection.user_assisted.length,
      total: selection.total_count,
      expected_impact: selection.expected_impact
    })

    // Store selection in database if session_id provided
    if (session_id && organization_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabase
        .from('geo_content_selections')
        .insert({
          session_id,
          organization_id,
          objective,
          industry,
          automated_types: selection.automated,
          user_assisted_types: selection.user_assisted,
          expected_impact: selection.expected_impact,
          time_investment: selection.time_investment,
          recommendations: selection.recommendations
        })
    }

    return new Response(JSON.stringify(selection), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('❌ Content selection error:', error)
    return new Response(JSON.stringify({
      error: error.message,
      details: error.toString()
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})
