import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Source Discovery Agent
 * Discovers new sources for monitoring based on stakeholder profiles
 * Converted from SourceDiscoveryAgent.js to Deno/Edge Function
 */

interface Stakeholder {
  name: string
  industry?: string
  locations?: string[]
  interests?: string[]
  competitors?: string[]
  [key: string]: any
}

interface Source {
  name: string
  url: string
  type: string
  platform?: string
  category?: string
  location?: string
  description: string
  extractionMethod: 'api' | 'rss' | 'scraping' | 'manual'
  valid?: boolean
  accessible?: boolean
  relevanceScore?: number
  lastValidated?: Date
}

class SourceDiscoveryAgent {
  private sourcePatterns = {
    forums: {
      patterns: ['forum', 'community', 'discussion', 'board'],
      platforms: ['Reddit', 'Discord', 'Slack', 'Discourse', 'phpBB']
    },
    news: {
      patterns: ['news', 'press', 'media', 'journal', 'times', 'post'],
      categories: ['industry', 'local', 'trade', 'financial']
    },
    professional: {
      patterns: ['association', 'society', 'institute', 'council', 'federation'],
      types: ['trade', 'professional', 'industry', 'regulatory']
    },
    government: {
      patterns: ['.gov', 'regulatory', 'commission', 'department', 'agency'],
      types: ['federal', 'state', 'municipal', 'international']
    },
    social: {
      platforms: ['LinkedIn', 'Twitter', 'Facebook', 'Instagram', 'TikTok'],
      contentTypes: ['posts', 'groups', 'hashtags', 'profiles']
    },
    alternative: {
      types: ['blogs', 'podcasts', 'youtube', 'substack', 'medium'],
      patterns: ['insights', 'analysis', 'opinion', 'review']
    }
  }

  async discoverNewSources(stakeholder: Stakeholder): Promise<Source[]> {
    // Generate source suggestions based on stakeholder profile
    const suggestions = await this.generateSourceSuggestions(stakeholder)

    // Validate and test each suggested source
    const validatedSources = await this.validateSources(suggestions, stakeholder)

    // Rank sources by relevance
    const rankedSources = this.rankSourcesByRelevance(validatedSources, stakeholder)

    return rankedSources
  }

  private async generateSourceSuggestions(stakeholder: Stakeholder): Promise<Source[]> {
    const suggestions: Source[] = []

    // Industry-specific forums
    suggestions.push(...this.generateForumSuggestions(stakeholder))

    // Local news sources
    if (stakeholder.locations && stakeholder.locations.length > 0) {
      suggestions.push(...this.generateLocalNewsSuggestions(stakeholder.locations))
    }

    // Professional associations
    suggestions.push(...this.generateProfessionalAssociations(stakeholder))

    // Niche communities
    suggestions.push(...this.generateNicheCommunities(stakeholder))

    // Government databases
    suggestions.push(...this.generateGovernmentSources(stakeholder))

    // Social media groups
    suggestions.push(...this.generateSocialGroups(stakeholder))

    // Alternative media
    suggestions.push(...this.generateAlternativeMedia(stakeholder))

    return suggestions
  }

  private generateForumSuggestions(stakeholder: Stakeholder): Source[] {
    const forums: Source[] = []
    const industry = stakeholder.industry?.toLowerCase() || ''

    // Reddit subreddits
    forums.push({
      name: `r/${industry}`,
      url: `https://reddit.com/r/${industry}`,
      type: 'forum',
      platform: 'Reddit',
      description: `${stakeholder.industry} community discussions`,
      extractionMethod: 'api'
    })

    // Industry-specific forums
    const industryForums: Record<string, Array<{name: string, url: string, focus: string}>> = {
      technology: [
        { name: 'Hacker News', url: 'https://news.ycombinator.com', focus: 'tech startups' },
        { name: 'Stack Overflow', url: 'https://stackoverflow.com', focus: 'developer community' },
        { name: 'Dev.to', url: 'https://dev.to', focus: 'developer articles' }
      ],
      finance: [
        { name: 'Wall Street Oasis', url: 'https://www.wallstreetoasis.com', focus: 'finance professionals' },
        { name: 'Bogleheads', url: 'https://www.bogleheads.org', focus: 'investment community' }
      ],
      healthcare: [
        { name: 'Medscape Forums', url: 'https://forums.medscape.com', focus: 'medical professionals' },
        { name: 'Healthcare IT News', url: 'https://www.healthcareitnews.com', focus: 'health tech' }
      ]
    }

    const relevantForums = industryForums[industry] || []
    relevantForums.forEach(forum => {
      forums.push({
        name: forum.name,
        url: forum.url,
        type: 'forum',
        platform: 'Web',
        description: forum.focus,
        extractionMethod: 'scraping'
      })
    })

    return forums
  }

  private generateLocalNewsSuggestions(locations: string[]): Source[] {
    const localNews: Source[] = []

    locations.forEach(location => {
      // Major city newspapers
      localNews.push({
        name: `${location} Times`,
        url: `https://www.google.com/search?q=${encodeURIComponent(location)}+newspaper`,
        type: 'news',
        category: 'local',
        location: location,
        description: `Local newspaper for ${location}`,
        extractionMethod: 'rss'
      })

      // Local business journals
      localNews.push({
        name: `${location} Business Journal`,
        url: `https://www.bizjournals.com/${location.toLowerCase()}`,
        type: 'news',
        category: 'business',
        location: location,
        description: `Business news for ${location}`,
        extractionMethod: 'scraping'
      })

      // Local TV news
      localNews.push({
        name: `${location} Local News`,
        url: `https://www.google.com/search?q=${encodeURIComponent(location)}+local+news`,
        type: 'news',
        category: 'broadcast',
        location: location,
        description: `Local TV news for ${location}`,
        extractionMethod: 'rss'
      })
    })

    return localNews
  }

  private generateProfessionalAssociations(stakeholder: Stakeholder): Source[] {
    const associations: Source[] = []
    const industry = stakeholder.industry?.toLowerCase() || ''

    const industryAssociations: Record<string, Array<{name: string, url: string, focus: string}>> = {
      technology: [
        { name: 'IEEE', url: 'https://www.ieee.org', focus: 'electrical engineering' },
        { name: 'ACM', url: 'https://www.acm.org', focus: 'computing machinery' },
        { name: 'CompTIA', url: 'https://www.comptia.org', focus: 'IT professionals' }
      ],
      finance: [
        { name: 'CFA Institute', url: 'https://www.cfainstitute.org', focus: 'financial analysts' },
        { name: 'FINRA', url: 'https://www.finra.org', focus: 'financial regulation' }
      ],
      healthcare: [
        { name: 'AMA', url: 'https://www.ama-assn.org', focus: 'medical association' },
        { name: 'HIMSS', url: 'https://www.himss.org', focus: 'health IT' }
      ]
    }

    const relevant = industryAssociations[industry] || []
    relevant.forEach(assoc => {
      associations.push({
        name: assoc.name,
        url: assoc.url,
        type: 'professional',
        category: 'association',
        description: assoc.focus,
        extractionMethod: 'scraping'
      })
    })

    return associations
  }

  private generateNicheCommunities(stakeholder: Stakeholder): Source[] {
    const communities: Source[] = []

    // Discord servers
    communities.push({
      name: `${stakeholder.industry} Discord`,
      url: 'https://discord.com',
      type: 'community',
      platform: 'Discord',
      description: `${stakeholder.industry} professionals community`,
      extractionMethod: 'manual'
    })

    // Slack communities
    communities.push({
      name: `${stakeholder.industry} Slack`,
      url: 'https://slack.com',
      type: 'community',
      platform: 'Slack',
      description: `${stakeholder.industry} workspace`,
      extractionMethod: 'api'
    })

    // LinkedIn groups
    communities.push({
      name: `${stakeholder.industry} Leaders`,
      url: `https://www.linkedin.com/search/results/groups/?keywords=${encodeURIComponent(stakeholder.industry || '')}`,
      type: 'community',
      platform: 'LinkedIn',
      description: 'Industry leaders and discussions',
      extractionMethod: 'scraping'
    })

    return communities
  }

  private generateGovernmentSources(stakeholder: Stakeholder): Source[] {
    const govSources: Source[] = []

    // Federal sources
    govSources.push({
      name: 'SEC EDGAR',
      url: 'https://www.sec.gov/edgar',
      type: 'government',
      category: 'regulatory',
      description: 'Securities filings',
      extractionMethod: 'api'
    })

    govSources.push({
      name: 'USPTO',
      url: 'https://www.uspto.gov',
      type: 'government',
      category: 'patents',
      description: 'Patent and trademark data',
      extractionMethod: 'api'
    })

    // Industry-specific regulators
    const regulators: Record<string, Array<{name: string, url: string}>> = {
      finance: [
        { name: 'FDIC', url: 'https://www.fdic.gov' },
        { name: 'Federal Reserve', url: 'https://www.federalreserve.gov' }
      ],
      healthcare: [
        { name: 'FDA', url: 'https://www.fda.gov' },
        { name: 'CMS', url: 'https://www.cms.gov' }
      ],
      technology: [
        { name: 'FCC', url: 'https://www.fcc.gov' },
        { name: 'NIST', url: 'https://www.nist.gov' }
      ]
    }

    const industryRegs = regulators[stakeholder.industry?.toLowerCase() || ''] || []
    industryRegs.forEach(reg => {
      govSources.push({
        name: reg.name,
        url: reg.url,
        type: 'government',
        category: 'regulatory',
        description: 'Industry regulator',
        extractionMethod: 'scraping'
      })
    })

    return govSources
  }

  private generateSocialGroups(stakeholder: Stakeholder): Source[] {
    const socialGroups: Source[] = []

    // Facebook groups
    socialGroups.push({
      name: `${stakeholder.industry} Professionals`,
      url: `https://www.facebook.com/search/groups/?q=${encodeURIComponent(stakeholder.industry || '')}`,
      type: 'social',
      platform: 'Facebook',
      description: 'Industry professionals group',
      extractionMethod: 'manual'
    })

    // Twitter/X lists
    socialGroups.push({
      name: `${stakeholder.industry} Influencers`,
      url: `https://twitter.com/search?q=${encodeURIComponent(stakeholder.industry || '')}`,
      type: 'social',
      platform: 'Twitter',
      description: 'Industry thought leaders',
      extractionMethod: 'api'
    })

    return socialGroups
  }

  private generateAlternativeMedia(stakeholder: Stakeholder): Source[] {
    const altMedia: Source[] = []

    // Podcasts
    altMedia.push({
      name: `${stakeholder.industry} Podcast Network`,
      url: 'https://podcasts.google.com',
      type: 'media',
      category: 'podcast',
      description: 'Industry podcasts',
      extractionMethod: 'rss'
    })

    // YouTube channels
    altMedia.push({
      name: `${stakeholder.industry} YouTube`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(stakeholder.industry || '')}`,
      type: 'media',
      category: 'video',
      description: 'Industry video content',
      extractionMethod: 'api'
    })

    // Substack newsletters
    altMedia.push({
      name: `${stakeholder.industry} Substacks`,
      url: `https://substack.com/search/${encodeURIComponent(stakeholder.industry || '')}`,
      type: 'media',
      category: 'newsletter',
      description: 'Industry newsletters',
      extractionMethod: 'rss'
    })

    return altMedia
  }

  private async validateSources(sources: Source[], stakeholder: Stakeholder): Promise<Source[]> {
    const validatedSources: Source[] = []

    for (const source of sources) {
      const validation = await this.testSourceAccess(source)
      if (validation.accessible) {
        const relevance = await this.scanForRelevance(source, stakeholder)
        validatedSources.push({
          ...source,
          valid: true,
          accessible: true,
          relevanceScore: relevance,
          lastValidated: new Date()
        })
      }
    }

    return validatedSources
  }

  private async testSourceAccess(source: Source): Promise<{accessible: boolean, responseTime: number, hasRSS: boolean, hasAPI: boolean}> {
    // Test if source is accessible
    // In production, this would make actual HTTP requests
    return {
      accessible: true,
      responseTime: Math.random() * 1000,
      hasRSS: source.extractionMethod === 'rss',
      hasAPI: source.extractionMethod === 'api'
    }
  }

  private async scanForRelevance(source: Source, stakeholder: Stakeholder): Promise<number> {
    // Calculate relevance score based on source type and stakeholder needs
    let relevanceScore = 0.5

    // Industry match
    if (source.description?.toLowerCase().includes(stakeholder.industry?.toLowerCase() || '')) {
      relevanceScore += 0.2
    }

    // Location match
    if (stakeholder.locations && source.location) {
      if (stakeholder.locations.includes(source.location)) {
        relevanceScore += 0.15
      }
    }

    // Source type priority
    const priorityTypes: Record<string, number> = {
      'regulatory': 0.15,
      'news': 0.1,
      'forum': 0.1,
      'professional': 0.1
    }

    relevanceScore += priorityTypes[source.type] || 0

    return Math.min(relevanceScore, 1.0)
  }

  private rankSourcesByRelevance(sources: Source[], stakeholder: Stakeholder): Source[] {
    return sources.sort((a, b) => {
      // Sort by relevance score
      if (b.relevanceScore !== a.relevanceScore) {
        return (b.relevanceScore || 0) - (a.relevanceScore || 0)
      }

      // Then by source type priority
      const typePriority: Record<string, number> = {
        'regulatory': 1,
        'news': 2,
        'professional': 3,
        'forum': 4,
        'social': 5,
        'media': 6
      }

      return (typePriority[a.type] || 99) - (typePriority[b.type] || 99)
    })
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      action = 'discover', // 'discover', 'validate', 'rank'
      stakeholder,
      sources,
      filters
    } = await req.json()

    const agent = new SourceDiscoveryAgent()

    let result: any

    switch(action) {
      case 'discover':
        // Discover new sources for stakeholder
        if (!stakeholder || !stakeholder.name) {
          throw new Error('Stakeholder with name is required')
        }
        result = await agent.discoverNewSources(stakeholder)
        break

      case 'validate':
        // Validate provided sources
        if (!sources || !Array.isArray(sources)) {
          throw new Error('Sources array is required for validation')
        }
        if (!stakeholder) {
          throw new Error('Stakeholder is required for validation')
        }
        result = await agent.validateSources(sources, stakeholder)
        break

      case 'rank':
        // Rank sources by relevance
        if (!sources || !Array.isArray(sources)) {
          throw new Error('Sources array is required for ranking')
        }
        if (!stakeholder) {
          throw new Error('Stakeholder is required for ranking')
        }
        result = agent.rankSourcesByRelevance(sources, stakeholder)
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        result,
        metadata: {
          timestamp: new Date().toISOString(),
          stakeholder: stakeholder?.name,
          sourceCount: Array.isArray(result) ? result.length : 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Source Discovery error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        result: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})