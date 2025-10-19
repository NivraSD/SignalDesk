import { createClient } from '@supabase/supabase-js'

// Fireplexity Service - Self-hosted intelligent search
export class FireplexityService {
  private supabase: any
  private baseUrl: string

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.gJ5X9LQqR3oGxRv4NCA7l-gDL3EQlFqG0OWU-oYRJE0'

    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.baseUrl = `${supabaseUrl}/functions/v1`

    console.log('Fireplexity service initialized with URL:', this.baseUrl)
  }

  /**
   * Perform an intelligent search using Fireplexity
   */
  async search(query: string, options: {
    module?: string
    useCache?: boolean
    context?: any
  } = {}): Promise<FireplexityResponse> {
    console.log('🔍 Fireplexity search called with:', { query, options })

    try {
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwincm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.gJ5X9LQqR3oGxRv4NCA7l-gDL3EQlFqG0OWU-oYRJE0'

      const url = `${this.baseUrl}/niv-fireplexity`
      const payload = {
        query,
        module: options.module || 'general',
        useCache: options.useCache !== false, // Default to true
        context: options.context || {}
      }

      console.log('🚀 Fetching from:', url)
      console.log('📦 With payload:', payload)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify(payload)
      })

      console.log('📨 Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Response error:', errorText)
        throw new Error(`Fireplexity search failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Fireplexity response:', data)
      return data
    } catch (error) {
      console.error('❌ Fireplexity search error:', error)
      // Fallback to basic search
      return this.fallbackSearch(query)
    }
  }

  /**
   * Module-specific search methods
   */
  async searchForIntelligence(query: string, organization?: string) {
    return this.search(query, {
      module: 'intelligence',
      context: { organization }
    })
  }

  async searchForOpportunities(query: string, urgency?: string) {
    return this.search(query, {
      module: 'opportunities',
      context: { urgency }
    })
  }

  async searchForJournalists(query: string, topic?: string) {
    return this.search(query, {
      module: 'execute',
      context: { topic, type: 'journalist' }
    })
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(date?: Date): Promise<UsageStats> {
    const targetDate = date || new Date()
    const { data, error } = await this.supabase
      .rpc('get_fireplexity_daily_stats', { p_date: targetDate })

    if (error) {
      console.error('Failed to get usage stats:', error)
      return {
        totalQueries: 0,
        totalCost: 0,
        byModule: {},
        byStrategy: {}
      }
    }

    return {
      totalQueries: data.total_queries,
      totalCost: data.total_cost,
      byModule: data.by_module,
      byStrategy: data.by_strategy
    }
  }

  /**
   * Clear cache (for development)
   */
  async clearCache(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Cache clearing only allowed in development')
    }

    const { error } = await this.supabase
      .from('fireplexity_cache')
      .delete()
      .neq('cache_key', '') // Delete all

    if (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  /**
   * Fallback search when Fireplexity is unavailable
   */
  private async fallbackSearch(query: string): Promise<FireplexityResponse> {
    // Use existing pipeline data or return mock results
    return {
      mock: true,
      query,
      results: [],
      summary: 'Fireplexity is currently unavailable. Using fallback search.',
      timestamp: new Date().toISOString(),
      cached: false
    }
  }
}

// Types
export interface FireplexityResponse {
  results?: any[]
  sources?: any[]
  summary?: string
  timestamp: string
  cached: boolean
  cacheAge?: number
  strategy?: string
  mock?: boolean
  web?: any
  news?: any
  pipeline?: any
}

export interface UsageStats {
  totalQueries: number
  totalCost: number
  byModule: Record<string, number>
  byStrategy: Record<string, number>
}

// Singleton instance
let fireplexityInstance: FireplexityService | null = null

export function getFireplexity(): FireplexityService {
  if (!fireplexityInstance) {
    fireplexityInstance = new FireplexityService()
  }
  return fireplexityInstance
}