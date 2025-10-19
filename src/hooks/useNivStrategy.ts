import { useState, useEffect, useCallback } from 'react'
import { NivStrategy, StoredStrategy, StrategyStorage } from '@/types/niv-strategy'

// Hook for managing NIV strategies
export function useNivStrategy() {
  const [strategies, setStrategies] = useState<StoredStrategy[]>([])
  const [currentStrategy, setCurrentStrategy] = useState<StoredStrategy | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const storage = new StrategyStorage()

  // Load strategies on mount
  useEffect(() => {
    loadStrategies()
  }, [])

  const loadStrategies = useCallback(() => {
    const stored = storage.getAll()
    setStrategies(stored)
  }, [])

  // Save a new strategy
  const saveStrategy = useCallback((strategy: NivStrategy): string => {
    const localId = storage.save(strategy)
    loadStrategies() // Refresh list
    return localId
  }, [])

  // Load a specific strategy
  const loadStrategy = useCallback((id: string) => {
    const strategy = storage.get(id)
    setCurrentStrategy(strategy)
    return strategy
  }, [])

  // Update existing strategy
  const updateStrategy = useCallback((id: string, updates: Partial<NivStrategy>): boolean => {
    const success = storage.update(id, updates)
    if (success) {
      loadStrategies() // Refresh list
      // If this is the current strategy, update it too
      if (currentStrategy && (currentStrategy.id === id || currentStrategy.localId === id)) {
        loadStrategy(id)
      }
    }
    return success
  }, [currentStrategy])

  // Delete strategy
  const deleteStrategy = useCallback((id: string): boolean => {
    const success = storage.delete(id)
    if (success) {
      loadStrategies() // Refresh list
      // Clear current if it was deleted
      if (currentStrategy && (currentStrategy.id === id || currentStrategy.localId === id)) {
        setCurrentStrategy(null)
      }
    }
    return success
  }, [currentStrategy])

  // Search strategies
  const searchStrategies = useCallback((query: string): StoredStrategy[] => {
    return storage.search(query)
  }, [])

  // Get recent strategies
  const getRecentStrategies = useCallback((limit?: number): StoredStrategy[] => {
    return storage.getRecent(limit)
  }, [])

  // Create strategy from NIV response
  const createStrategyFromResponse = useCallback((
    nivResponse: any,
    research: any,
    organizationId: string,
    organizationName: string
  ): NivStrategy => {
    const strategyId = `strategy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Extract strategy elements from NIV response
    const extractStrategy = () => {
      // Look for strategic elements in the response
      const responseText = typeof nivResponse === 'string' ? nivResponse : nivResponse.text || ''

      // Try to extract objective
      const objectiveMatch = responseText.match(/objective[:\s]+([^.\n]+)/i)
      const objective = objectiveMatch ? objectiveMatch[1].trim() : 'Strategy based on research findings'

      // Try to extract key messages
      const keyMessages: string[] = []
      const messagesMatch = responseText.match(/key messages?[:\s]+([^.\n]+)/i)
      if (messagesMatch) {
        keyMessages.push(...messagesMatch[1].split(',').map(m => m.trim()))
      }

      return {
        objective,
        approach: 'Based on current analysis',
        positioning: '',
        keyMessages,
        narratives: [],
        timeline: 'Immediate',
        urgencyLevel: 'medium' as const,
        rationale: 'Generated from NIV analysis'
      }
    }

    // Extract key findings from research
    const extractKeyFindings = () => {
      const findings: string[] = []

      if (research?.fireplexityData && Array.isArray(research.fireplexityData)) {
        research.fireplexityData.slice(0, 5).forEach((item: any) => {
          if (item.excerpt) {
            findings.push(item.excerpt.substring(0, 200))
          }
        })
      }

      return findings
    }

    const strategy: NivStrategy = {
      id: strategyId,
      title: `Strategy: ${new Date().toLocaleDateString()}`,
      created: new Date(),
      version: 1,

      research: {
        sources: research?.fireplexityData || [],
        keyFindings: extractKeyFindings(),
        gaps: [],
        confidence: 0.75,
        timestamp: new Date()
      },

      strategy: extractStrategy(),

      metadata: {
        organizationId,
        organizationName,
        createdBy: 'niv',
        status: 'draft',
        tags: []
      },

      workflows: {
        campaignIntelligence: { enabled: false },
        contentGeneration: { enabled: false },
        strategicPlanning: { enabled: false },
        mediaOutreach: { enabled: false }
      }
    }

    return strategy
  }, [])

  // Export/Import functions
  const exportStrategies = useCallback((): string => {
    return storage.export()
  }, [])

  const importStrategies = useCallback((json: string): boolean => {
    const success = storage.import(json)
    if (success) {
      loadStrategies() // Refresh list
    }
    return success
  }, [])

  return {
    // State
    strategies,
    currentStrategy,
    isLoading,

    // Actions
    saveStrategy,
    loadStrategy,
    updateStrategy,
    deleteStrategy,
    searchStrategies,
    getRecentStrategies,
    createStrategyFromResponse,
    exportStrategies,
    importStrategies,
    refresh: loadStrategies
  }
}