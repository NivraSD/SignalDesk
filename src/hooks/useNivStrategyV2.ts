import { useState, useEffect, useCallback } from 'react'
import { NivStrategy, StoredStrategy, StrategyStorage } from '@/types/niv-strategy'
import { memoryVault } from '@/services/memory-vault'
import { DEFAULT_ORG_UUID } from '@/constants/organizations'
import { useAppStore } from '@/stores/useAppStore'

// Enhanced hook for managing NIV strategies with database integration
export function useNivStrategyV2() {
  const { organization } = useAppStore()
  const [strategies, setStrategies] = useState<StoredStrategy[]>([])
  const [currentStrategy, setCurrentStrategy] = useState<StoredStrategy | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [useDatabase, setUseDatabase] = useState(false)

  // Fallback localStorage storage
  const localStorage = new StrategyStorage()

  // Test database connection on mount
  useEffect(() => {
    const testDatabaseConnection = async () => {
      const isConnected = await memoryVault.testConnection()
      setUseDatabase(isConnected)

      if (isConnected) {
        console.log('✅ Memory Vault database connected')
      } else {
        console.log('⚠️ Memory Vault database unavailable, using localStorage')
      }
    }

    testDatabaseConnection()
    // Load localStorage strategies on initial mount
    const stored = localStorage.getAll()
    setStrategies(stored)
  }, [])

  const loadStrategies = useCallback(async (organizationId?: string) => {
    setIsLoading(true)

    try {
      // Use provided organizationId, or fall back to organization from store, or default
      let orgId = organizationId || organization?.id || DEFAULT_ORG_UUID

      // Handle legacy "1" organizationId and convert to default UUID
      if (orgId === '1') {
        orgId = DEFAULT_ORG_UUID
      }

      // Try database for any organizationId including wildcard
      if (useDatabase) {
        // If organizationId is '*', get all strategies
        const response = orgId === '*'
          ? await memoryVault.getRecentStrategies('') // Empty string to get all
          : await memoryVault.getRecentStrategies(orgId)
        if (response.success) {
          // Convert database format to StoredStrategy format
          const dbStrategies = response.data.map((item: any) => ({
            ...item,
            id: item.id,
            localId: item.id, // Use database ID as localId for compatibility
            stored: new Date(item.created_at),
            created: new Date(item.created_at),
            updated: item.updated_at ? new Date(item.updated_at) : undefined,
            research: {
              sources: item.research_sources || [],
              keyFindings: item.research_key_findings || [],
              gaps: item.research_gaps || [],
              confidence: item.research_confidence || 0.75,
              timestamp: new Date(item.research_timestamp || item.created_at)
            },
            strategy: {
              objective: item.strategy_objective || '',
              approach: item.strategy_approach || '',
              positioning: item.strategy_positioning || '',
              keyMessages: item.strategy_key_messages || [],
              narratives: item.strategy_narratives || [],
              timeline: item.strategy_timeline || '',
              urgencyLevel: item.strategy_urgency_level || 'medium',
              rationale: item.strategy_rationale || '',
              // Add the new structured fields from framework_data
              ...(item.framework_data ? {
                proof_points: item.framework_data.proof_points || [],
                content_needs: item.framework_data.content_needs || {},
                media_targets: item.framework_data.media_targets || {},
                timeline_execution: item.framework_data.timeline_execution || {},
                narrative: item.framework_data.full_strategy?.narrative || ''
              } : {})
            },
            metadata: {
              organizationId: item.organization_id,
              organizationName: organizationId, // We'll need to get this from context
              createdBy: item.created_by || 'niv',
              status: item.status || 'draft',
              tags: item.tags || []
            },
            workflows: {
              campaignIntelligence: item.workflow_campaign_intelligence || { enabled: false },
              contentGeneration: item.workflow_content_generation || { enabled: false },
              strategicPlanning: item.workflow_strategic_planning || { enabled: false },
              mediaOutreach: item.workflow_media_outreach || { enabled: false }
            }
          }))

          setStrategies(dbStrategies)
        } else {
          throw new Error(response.error || 'Failed to load strategies')
        }
      } else {
        // Fallback to localStorage
        const stored = localStorage.getAll()
        setStrategies(stored)
      }
    } catch (error) {
      console.error('Failed to load strategies:', error)
      // Fallback to localStorage on error
      const stored = localStorage.getAll()
      setStrategies(stored)
    } finally {
      setIsLoading(false)
    }
  }, [useDatabase, organization])

  // Save a new strategy
  const saveStrategy = useCallback(async (strategy: NivStrategy, organizationId?: string): Promise<string> => {
    setIsLoading(true)

    try {
      // Use provided organizationId, or fall back to organization from store, or default
      let orgId = organizationId || organization?.id || DEFAULT_ORG_UUID

      // Handle legacy "1" organizationId and convert to default UUID
      if (orgId === '1') {
        orgId = DEFAULT_ORG_UUID
      }

      if (useDatabase) {
        const response = await memoryVault.saveStrategy(strategy, orgId)
        if (response.success) {
          await loadStrategies(organizationId) // Refresh list
          return response.data.id
        } else {
          throw new Error(response.error || 'Failed to save strategy')
        }
      } else {
        // Fallback to localStorage
        const localId = localStorage.save(strategy)
        await loadStrategies(organizationId) // Refresh list
        return localId
      }
    } catch (error) {
      console.error('Failed to save strategy:', error)
      // Fallback to localStorage
      const localId = localStorage.save(strategy)
      // Only refresh if we have an organizationId
      if (organizationId) {
        await loadStrategies(organizationId)
      } else {
        const stored = localStorage.getAll()
        setStrategies(stored)
      }
      return localId
    } finally {
      setIsLoading(false)
    }
  }, [useDatabase, loadStrategies])

  // Load a specific strategy
  const loadStrategy = useCallback(async (id: string): Promise<StoredStrategy | null> => {
    setIsLoading(true)

    // Check if ID is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    try {
      if (useDatabase && isUUID) {
        const response = await memoryVault.getStrategy(id)
        if (response.success) {
          // Convert database format to StoredStrategy
          const dbStrategy = response.data
          const strategy: StoredStrategy = {
            ...dbStrategy,
            id: dbStrategy.id,
            localId: dbStrategy.id,
            stored: new Date(dbStrategy.created_at),
            created: new Date(dbStrategy.created_at),
            updated: dbStrategy.updated_at ? new Date(dbStrategy.updated_at) : undefined,
            research: {
              sources: dbStrategy.research_sources || [],
              keyFindings: dbStrategy.research_key_findings || [],
              gaps: dbStrategy.research_gaps || [],
              confidence: dbStrategy.research_confidence || 0.75,
              timestamp: new Date(dbStrategy.research_timestamp || dbStrategy.created_at)
            },
            strategy: {
              objective: dbStrategy.strategy_objective || '',
              approach: dbStrategy.strategy_approach || '',
              positioning: dbStrategy.strategy_positioning || '',
              keyMessages: dbStrategy.strategy_key_messages || [],
              narratives: dbStrategy.strategy_narratives || [],
              timeline: dbStrategy.strategy_timeline || '',
              urgencyLevel: dbStrategy.strategy_urgency_level || 'medium',
              rationale: dbStrategy.strategy_rationale || '',
              // Add the new structured fields from framework_data
              ...(dbStrategy.framework_data ? {
                proof_points: dbStrategy.framework_data.proof_points || [],
                content_needs: dbStrategy.framework_data.content_needs || {},
                media_targets: dbStrategy.framework_data.media_targets || {},
                timeline_execution: dbStrategy.framework_data.timeline_execution || {},
                narrative: dbStrategy.framework_data.full_strategy?.narrative || ''
              } : {})
            },
            metadata: {
              organizationId: dbStrategy.organization_id,
              organizationName: dbStrategy.organization_id, // We'll need to get this from context
              createdBy: dbStrategy.created_by || 'niv',
              status: dbStrategy.status || 'draft',
              tags: dbStrategy.tags || []
            },
            workflows: {
              campaignIntelligence: dbStrategy.workflow_campaign_intelligence || { enabled: false },
              contentGeneration: dbStrategy.workflow_content_generation || { enabled: false },
              strategicPlanning: dbStrategy.workflow_strategic_planning || { enabled: false },
              mediaOutreach: dbStrategy.workflow_media_outreach || { enabled: false }
            }
          }

          setCurrentStrategy(strategy)
          return strategy
        } else {
          throw new Error(response.error || 'Strategy not found')
        }
      } else {
        // Fallback to localStorage
        const strategy = localStorage.get(id)
        setCurrentStrategy(strategy)
        return strategy
      }
    } catch (error) {
      console.error('Failed to load strategy:', error)
      // Fallback to localStorage
      const strategy = localStorage.get(id)
      setCurrentStrategy(strategy)
      return strategy
    } finally {
      setIsLoading(false)
    }
  }, [useDatabase])

  // Update existing strategy
  const updateStrategy = useCallback(async (id: string, updates: Partial<NivStrategy>, organizationId?: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      if (useDatabase) {
        const response = await memoryVault.updateStrategy(id, updates)
        if (response.success) {
          await loadStrategies(organizationId) // Refresh list
          // If this is the current strategy, reload it
          if (currentStrategy && (currentStrategy.id === id || currentStrategy.localId === id)) {
            await loadStrategy(id)
          }
          return true
        } else {
          throw new Error(response.error || 'Failed to update strategy')
        }
      } else {
        // Fallback to localStorage
        const success = localStorage.update(id, updates)
        if (success) {
          await loadStrategies(organizationId) // Refresh list
          // If this is the current strategy, reload it
          if (currentStrategy && (currentStrategy.id === id || currentStrategy.localId === id)) {
            await loadStrategy(id)
          }
        }
        return success
      }
    } catch (error) {
      console.error('Failed to update strategy:', error)
      // Fallback to localStorage
      const success = localStorage.update(id, updates)
      if (success) {
        // Only refresh if we have an organizationId
      if (organizationId) {
        await loadStrategies(organizationId)
      } else {
        const stored = localStorage.getAll()
        setStrategies(stored)
      }
        if (currentStrategy && (currentStrategy.id === id || currentStrategy.localId === id)) {
          await loadStrategy(id)
        }
      }
      return success
    } finally {
      setIsLoading(false)
    }
  }, [useDatabase, currentStrategy, loadStrategies, loadStrategy])

  // Delete strategy
  const deleteStrategy = useCallback(async (id: string, organizationId?: string): Promise<boolean> => {
    setIsLoading(true)

    // Check if ID is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    try {
      if (useDatabase && isUUID) {
        const response = await memoryVault.deleteStrategy(id)
        if (response.success) {
          await loadStrategies(organizationId) // Refresh list
          // Clear current if it was deleted
          if (currentStrategy && (currentStrategy.id === id || currentStrategy.localId === id)) {
            setCurrentStrategy(null)
          }
          return true
        } else {
          throw new Error(response.error || 'Failed to delete strategy')
        }
      } else {
        // Fallback to localStorage
        const success = localStorage.delete(id)
        if (success) {
          await loadStrategies(organizationId) // Refresh list
          // Clear current if it was deleted
          if (currentStrategy && (currentStrategy.id === id || currentStrategy.localId === id)) {
            setCurrentStrategy(null)
          }
        }
        return success
      }
    } catch (error) {
      console.error('Failed to delete strategy:', error)
      // Fallback to localStorage
      const success = localStorage.delete(id)
      if (success) {
        // Only refresh if we have an organizationId
      if (organizationId) {
        await loadStrategies(organizationId)
      } else {
        const stored = localStorage.getAll()
        setStrategies(stored)
      }
        if (currentStrategy && (currentStrategy.id === id || currentStrategy.localId === id)) {
          setCurrentStrategy(null)
        }
      }
      return success
    } finally {
      setIsLoading(false)
    }
  }, [useDatabase, currentStrategy, loadStrategies])

  // Search strategies
  const searchStrategies = useCallback(async (query: string, organizationId?: string): Promise<StoredStrategy[]> => {
    if (useDatabase && organizationId) {
      try {
        const response = await memoryVault.searchStrategies(organizationId, query)
        if (response.success) {
          return response.data
        }
      } catch (error) {
        console.error('Database search failed:', error)
      }
    }

    // Fallback to localStorage search
    return localStorage.search(query)
  }, [useDatabase])

  // Get recent strategies
  const getRecentStrategies = useCallback(async (limit?: number, organizationId?: string): Promise<StoredStrategy[]> => {
    // Handle legacy "1" organizationId and convert to default UUID
    let orgId = organizationId
    if (organizationId === '1') {
      orgId = DEFAULT_ORG_UUID
    }

    if (useDatabase && orgId) {
      try {
        const response = await memoryVault.getRecentStrategies(orgId, limit)
        if (response.success) {
          return response.data
        }
      } catch (error) {
        console.error('Database recent fetch failed:', error)
      }
    }

    // Fallback to localStorage
    return localStorage.getRecent(limit)
  }, [useDatabase])

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
      // Check if we have a framework object
      if (nivResponse?.framework) {
        const framework = nivResponse.framework

        // Handle the new structured format
        return {
          objective: framework.strategy?.objective || 'Strategy based on research findings',
          approach: framework.strategy?.approach || 'Based on current analysis',
          positioning: framework.strategy?.positioning || '',
          keyMessages: framework.strategy?.keyMessages || [],
          narratives: framework.strategy?.narrative ? [framework.strategy.narrative] : [],
          timeline: framework.strategy?.timeline_execution?.immediate?.[0] || 'Immediate',
          urgencyLevel: (framework.strategy?.urgency || 'medium') as 'immediate' | 'high' | 'medium' | 'low',
          rationale: framework.strategy?.rationale || 'Generated from NIV analysis',

          // Store the new structured fields
          proof_points: framework.strategy?.proof_points || [],
          content_needs: framework.strategy?.content_needs || {},
          media_targets: framework.strategy?.media_targets || {},
          timeline_execution: framework.strategy?.timeline_execution || {}
        }
      }

      // Fallback to text extraction if no framework
      const responseText = typeof nivResponse === 'string' ? nivResponse : nivResponse.message || nivResponse.text || ''

      // Try to extract objective
      const objectiveMatch = responseText.match(/objective[:\\s]+([^.\\n]+)/i)
      const objective = objectiveMatch ? objectiveMatch[1].trim() : 'Strategy based on research findings'

      // Try to extract key messages
      const keyMessages: string[] = []
      const messagesMatch = responseText.match(/key messages?[:\\s]+([^.\\n]+)/i)
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

      // Check if we have findings in the framework intelligence section
      if (nivResponse?.framework?.intelligence?.key_findings) {
        findings.push(...nivResponse.framework.intelligence.key_findings)
      }

      // Also check for research.keyFindings
      if (nivResponse?.framework?.research?.keyFindings) {
        findings.push(...nivResponse.framework.research.keyFindings)
      }

      // Also check the research object passed in
      if (research?.keyFindings && Array.isArray(research.keyFindings)) {
        findings.push(...research.keyFindings)
      }

      // Also check fireplexity data
      if (research?.fireplexityData && Array.isArray(research.fireplexityData)) {
        research.fireplexityData.slice(0, 5).forEach((item: any) => {
          if (item.excerpt) {
            findings.push(item.excerpt.substring(0, 200))
          }
        })
      }

      return findings
    }

    // Generate a better title
    const strategyDetails = extractStrategy()
    const title = strategyDetails.objective ?
      `Strategy: ${strategyDetails.objective.substring(0, 50)}${strategyDetails.objective.length > 50 ? '...' : ''}` :
      `Strategy: ${new Date().toLocaleDateString()}`

    // Extract sources from the framework or research
    const extractSources = () => {
      // First check framework intelligence supporting data
      if (nivResponse?.framework?.intelligence?.supporting_data?.articles) {
        return nivResponse.framework.intelligence.supporting_data.articles
      }
      // Then check research object
      if (research?.articles && Array.isArray(research.articles)) {
        return research.articles
      }
      // Fallback to fireplexity data
      return research?.fireplexityData || []
    }

    const strategy: NivStrategy = {
      id: strategyId,
      title,
      created: new Date(),
      version: 1,

      research: {
        sources: extractSources(),
        keyFindings: extractKeyFindings(),
        gaps: nivResponse?.framework?.intelligence?.risk_factors || [],
        confidence: 0.75,
        timestamp: new Date()
      },

      strategy: strategyDetails,

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

  // Export/Import functions (localStorage only for now)
  const exportStrategies = useCallback(async (organizationId?: string): Promise<string> => {
    if (useDatabase && organizationId) {
      try {
        const response = await memoryVault.exportStrategies(organizationId)
        if (response.success) {
          return JSON.stringify(response.data, null, 2)
        }
      } catch (error) {
        console.error('Database export failed:', error)
      }
    }

    // Fallback to localStorage
    return localStorage.export()
  }, [useDatabase])

  const importStrategies = useCallback((json: string): boolean => {
    // For now, only localStorage import is supported
    const success = localStorage.import(json)
    if (success) {
      // Don't call loadStrategies here as we just loaded from localStorage
    }
    return success
  }, [loadStrategies])

  return {
    // State
    strategies,
    currentStrategy,
    isLoading,
    useDatabase, // Expose database status

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