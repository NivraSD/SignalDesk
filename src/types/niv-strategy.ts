// NIV Strategy Types
// Comprehensive strategy structure that NIV generates

export interface NivStrategy {
  id: string
  title: string
  created: Date
  updated?: Date
  version: number

  // Research findings that informed this strategy
  research: {
    sources: ResearchSource[]
    keyFindings: string[]
    gaps: string[]
    confidence: number // 0-1 confidence score
    timestamp: Date
  }

  // Strategic framework
  strategy: {
    objective: string
    approach: string
    positioning: string
    keyMessages: string[]
    narratives: string[]
    timeline: string
    urgencyLevel: 'immediate' | 'high' | 'medium' | 'low'
    rationale: string
  }

  // Metadata
  metadata: {
    organizationId: string
    organizationName: string
    createdBy: 'niv'
    status: 'draft' | 'reviewed' | 'approved' | 'archived'
    tags: string[]
  }

  // Workflow orchestration preparation
  workflows?: {
    campaignIntelligence?: WorkflowConfig
    contentGeneration?: WorkflowConfig
    strategicPlanning?: WorkflowConfig
    mediaOutreach?: WorkflowConfig
  }
}

export interface ResearchSource {
  title: string
  url?: string
  publishedDate?: string
  excerpt: string
  relevance: number // 0-1
  source?: string
}

export interface WorkflowConfig {
  enabled: boolean
  priority?: 'high' | 'medium' | 'low'
  suggestedApproach?: string
  estimatedTime?: string
  dependencies?: string[]
}

// For localStorage persistence
export interface StoredStrategy extends NivStrategy {
  stored: Date
  localId: string
}

// Strategy storage service
export class StrategyStorage {
  private readonly STORAGE_KEY = 'niv-strategies'
  private readonly MAX_STRATEGIES = 50 // Limit localStorage usage

  // Save strategy to localStorage
  save(strategy: NivStrategy): string {
    const strategies = this.getAll()
    const localId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const storedStrategy: StoredStrategy = {
      ...strategy,
      stored: new Date(),
      localId
    }

    // Add to beginning of array (most recent first)
    strategies.unshift(storedStrategy)

    // Trim if too many strategies
    if (strategies.length > this.MAX_STRATEGIES) {
      strategies.pop()
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(strategies))
    return localId
  }

  // Retrieve strategy by ID
  get(id: string): StoredStrategy | null {
    const strategies = this.getAll()
    return strategies.find(s => s.id === id || s.localId === id) || null
  }

  // Get all strategies
  getAll(): StoredStrategy[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []

      const strategies = JSON.parse(stored)
      // Convert date strings back to Date objects
      return strategies.map((s: any) => ({
        ...s,
        created: new Date(s.created),
        updated: s.updated ? new Date(s.updated) : undefined,
        stored: new Date(s.stored),
        research: {
          ...s.research,
          timestamp: new Date(s.research.timestamp)
        }
      }))
    } catch (error) {
      console.error('Failed to parse stored strategies:', error)
      return []
    }
  }

  // Search strategies
  search(query: string): StoredStrategy[] {
    const strategies = this.getAll()
    const queryLower = query.toLowerCase()

    return strategies.filter(s =>
      s.title.toLowerCase().includes(queryLower) ||
      s.strategy.objective.toLowerCase().includes(queryLower) ||
      s.metadata.tags.some(tag => tag.toLowerCase().includes(queryLower))
    )
  }

  // Get recent strategies
  getRecent(limit: number = 10): StoredStrategy[] {
    return this.getAll().slice(0, limit)
  }

  // Update existing strategy
  update(id: string, updates: Partial<NivStrategy>): boolean {
    const strategies = this.getAll()
    const index = strategies.findIndex(s => s.id === id || s.localId === id)

    if (index === -1) return false

    strategies[index] = {
      ...strategies[index],
      ...updates,
      updated: new Date(),
      version: strategies[index].version + 1
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(strategies))
    return true
  }

  // Delete strategy
  delete(id: string): boolean {
    const strategies = this.getAll()
    const filtered = strategies.filter(s => s.id !== id && s.localId !== id)

    if (filtered.length === strategies.length) return false

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
    return true
  }

  // Clear all strategies
  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  // Export strategies (for backup)
  export(): string {
    return JSON.stringify(this.getAll(), null, 2)
  }

  // Import strategies (from backup)
  import(json: string): boolean {
    try {
      const strategies = JSON.parse(json)
      if (!Array.isArray(strategies)) return false

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(strategies))
      return true
    } catch {
      return false
    }
  }
}