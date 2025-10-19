// Memory Vault Service - Database integration for NIV strategies
import { NivStrategy } from '@/types/niv-strategy'

const MEMORY_VAULT_URL = '/api/edge/niv-memory-vault'

interface MemoryVaultResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
}

export class MemoryVaultService {
  private baseUrl: string

  constructor() {
    // Use environment variable or default to local development
    this.baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/niv-memory-vault`
      : 'http://localhost:54321/functions/v1/niv-memory-vault'
  }

  private async makeRequest(
    method: string,
    params: URLSearchParams = new URLSearchParams(),
    body?: any
  ): Promise<MemoryVaultResponse> {
    try {
      const url = `${this.baseUrl}?${params.toString()}`

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
        }
      }

      if (body) {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(url, options)
      const result = await response.json()

      return result
    } catch (error: any) {
      console.error('MemoryVault request failed:', error)
      return {
        success: false,
        error: error.message || 'Network error'
      }
    }
  }

  // Save a new strategy
  async saveStrategy(strategy: NivStrategy, organizationId: string): Promise<MemoryVaultResponse> {
    const params = new URLSearchParams({ action: 'save' })

    // Flatten the nested structure to match database schema
    const flattenedStrategy = {
      organization_id: organizationId,
      title: strategy.title,
      version: strategy.version || 1,

      // Flatten research fields
      research_sources: strategy.research?.sources || [],
      research_key_findings: strategy.research?.keyFindings || [],
      research_gaps: strategy.research?.gaps || [],
      research_confidence: strategy.research?.confidence || 0.75,
      research_timestamp: strategy.research?.timestamp || new Date().toISOString(),

      // Flatten strategy fields
      strategy_objective: strategy.strategy?.objective,
      strategy_approach: strategy.strategy?.approach,
      strategy_positioning: strategy.strategy?.positioning,
      strategy_key_messages: strategy.strategy?.keyMessages || [],
      strategy_narratives: strategy.strategy?.narratives || [],
      strategy_timeline: strategy.strategy?.timeline,
      strategy_urgency_level: strategy.strategy?.urgencyLevel || 'medium',
      strategy_rationale: strategy.strategy?.rationale,

      // Flatten metadata
      created_by: strategy.metadata?.createdBy || 'niv',
      status: strategy.metadata?.status || 'draft',
      tags: strategy.metadata?.tags || [],

      // Flatten workflows
      workflow_campaign_intelligence: strategy.workflows?.campaignIntelligence || { enabled: false },
      workflow_content_generation: strategy.workflows?.contentGeneration || { enabled: false },
      workflow_strategic_planning: strategy.workflows?.strategicPlanning || { enabled: false },
      workflow_media_outreach: strategy.workflows?.mediaOutreach || { enabled: false },

      // Store the complete framework data including new structured fields
      framework_data: {
        proof_points: (strategy.strategy as any)?.proof_points || [],
        content_needs: (strategy.strategy as any)?.content_needs || {},
        media_targets: (strategy.strategy as any)?.media_targets || {},
        timeline_execution: (strategy.strategy as any)?.timeline_execution || {},
        // Store the full strategy object for future use
        full_strategy: strategy.strategy
      }
    }

    return this.makeRequest('POST', params, {
      strategy: flattenedStrategy
    })
  }

  // Get a strategy by ID
  async getStrategy(strategyId: string): Promise<MemoryVaultResponse> {
    const params = new URLSearchParams({
      action: 'get',
      id: strategyId
    })

    return this.makeRequest('GET', params)
  }

  // Get recent strategies for organization
  async getRecentStrategies(organizationId: string, limit: number = 10): Promise<MemoryVaultResponse> {
    const params = new URLSearchParams({
      action: 'recent',
      organizationId,
      limit: limit.toString()
    })

    return this.makeRequest('GET', params)
  }

  // Search strategies
  async searchStrategies(organizationId: string, query: string, limit: number = 10): Promise<MemoryVaultResponse> {
    const params = new URLSearchParams({
      action: 'search',
      organizationId,
      query,
      limit: limit.toString()
    })

    return this.makeRequest('GET', params)
  }

  // Update an existing strategy
  async updateStrategy(strategyId: string, updates: Partial<NivStrategy>): Promise<MemoryVaultResponse> {
    const params = new URLSearchParams({
      action: 'update',
      id: strategyId
    })

    return this.makeRequest('PUT', params, { updates })
  }

  // Delete a strategy
  async deleteStrategy(strategyId: string): Promise<MemoryVaultResponse> {
    const params = new URLSearchParams({
      action: 'delete',
      id: strategyId
    })

    return this.makeRequest('DELETE', params)
  }

  // Get strategy with execution history
  async getStrategyWithExecutions(strategyId: string): Promise<MemoryVaultResponse> {
    const params = new URLSearchParams({
      action: 'withExecutions',
      id: strategyId
    })

    return this.makeRequest('GET', params)
  }

  // Export strategies for backup
  async exportStrategies(organizationId: string): Promise<MemoryVaultResponse> {
    const params = new URLSearchParams({
      action: 'export',
      organizationId
    })

    return this.makeRequest('GET', params)
  }

  // Test connection to Memory Vault
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'OPTIONS', // Use OPTIONS to test CORS without auth requirements
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.ok || response.status === 204 // 204 is common for OPTIONS
    } catch {
      return false
    }
  }
}

// Singleton instance
export const memoryVault = new MemoryVaultService()