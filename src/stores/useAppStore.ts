import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { IntelligenceService } from '@/lib/services/intelligenceService'

export type ModuleType = 'intelligence' | 'opportunities' | 'plan' | 'execute' | 'memoryvault'

interface User {
  id: string
  email: string
  name?: string
}

interface Organization {
  id: string
  name: string
  industry?: string
  config?: any
}

interface Framework {
  name: string
  industry: string
  [key: string]: any
}

interface IntelligenceData {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  stages: any[]
  finalIntelligence?: any
  createdAt: Date
}

interface Opportunity {
  id: string
  opportunity_id: string
  title: string
  description: string
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  confidence: number
  persona_name: string
  time_window: string
  expires_at: string
  action_items?: any[]
  status: 'new' | 'reviewed' | 'in_progress' | 'completed' | 'expired'
}

interface Campaign {
  id: string
  name: string
  opportunity_id?: string
  status: 'draft' | 'active' | 'completed'
  content: any
  createdAt: Date
}

interface AppState {
  // Auth & Org
  user: User | null
  organization: Organization | null
  framework: Framework | null

  // Modules
  intelligenceData: IntelligenceData | null
  opportunities: Opportunity[]
  activeCampaigns: Campaign[]

  // UI
  activeModule: ModuleType
  isLoading: boolean
  error: string | null
  
  // Canvas State (for infinite canvas UI)
  canvasComponents: Map<string, { x: number; y: number; width: number; height: number; minimized: boolean }>
  
  // Actions
  setUser: (user: User | null) => void
  setOrganization: (org: Organization | null) => void
  setFramework: (framework: Framework | null) => void
  loadIntelligence: () => Promise<void>
  executeOpportunity: (id: string) => Promise<void>
  switchModule: (module: ModuleType) => void
  setIntelligenceData: (data: IntelligenceData | null) => void
  setOpportunities: (opportunities: Opportunity[]) => void
  addCampaign: (campaign: Campaign) => void
  updateCanvasComponent: (id: string, state: any) => void
  setError: (error: string | null) => void
  clearError: () => void
}

// Helper to initialize default canvas components
const getDefaultCanvasComponents = () => new Map([
  ['intel-1', { x: 50, y: 50, width: 600, height: 500, minimized: false }],
  ['opp-1', { x: 700, y: 50, width: 450, height: 400, minimized: false }],
  ['exec-1', { x: 50, y: 580, width: 500, height: 350, minimized: false }]
])

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      organization: null,
      framework: null,
      intelligenceData: null,
      opportunities: [],
      activeCampaigns: [],
      activeModule: 'intelligence',
      isLoading: false,
      error: null,
      canvasComponents: getDefaultCanvasComponents(),

      // Actions
      setUser: (user: any) => set({ user }),

      setOrganization: (organization: Organization | null) => {
        const currentOrg = get().organization

        // Prevent unnecessary reloads if same org
        if (currentOrg?.id === organization?.id) {
          console.log('⚠️ Same organization selected, skipping reload')
          return
        }

        console.log(`🔄 Switching from ${currentOrg?.name || 'none'} to ${organization?.name || 'none'}`)

        // Clear all org-specific state
        set({
          organization,
          intelligenceData: null,
          opportunities: [],
          activeCampaigns: [],
          error: null
        })

        // Emit org-change event for components to listen to
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('organization-changed', {
            detail: {
              from: currentOrg,
              to: organization
            }
          }))
        }

        console.log(`✅ Organization switched to ${organization?.name}`)
      },

      setFramework: (framework: any) => set({ framework }),
      
      loadIntelligence: async () => {
        set({ isLoading: true, error: null })
        try {
          const org = get().organization
          if (!org) {
            throw new Error('No organization selected')
          }

          // Start the intelligence pipeline
          const pipelineData = await IntelligenceService.startPipeline(org.id)

          // Create initial intelligence data
          const intelligenceData: IntelligenceData = {
            id: pipelineData.pipelineRunId,
            status: 'running',
            stages: [],
            createdAt: new Date()
          }
          set({ intelligenceData })

          // IMPORTANT: Set opportunities from pipeline response (enhanced with creative fields)
          if (pipelineData.opportunities && pipelineData.opportunities.length > 0) {
            console.log(`✅ Setting ${pipelineData.opportunities.length} enhanced opportunities from pipeline`)
            set({ opportunities: pipelineData.opportunities as any })
          }

          // Subscribe to pipeline updates
          const unsubscribe = IntelligenceService.subscribeToPipelineUpdates(
            pipelineData.pipelineRunId,
            (pipelineRun) => {
              set((state) => ({
                intelligenceData: state.intelligenceData ? {
                  ...state.intelligenceData,
                  status: pipelineRun.status,
                  stages: pipelineRun.stages_completed || []
                } : null
              }))

              // If completed, fetch the synthesis
              if (pipelineRun.status === 'completed') {
                IntelligenceService.getLatestSynthesis(org.id).then(synthesis => {
                  if (synthesis) {
                    set((state) => ({
                      intelligenceData: state.intelligenceData ? {
                        ...state.intelligenceData,
                        finalIntelligence: synthesis
                      } : null
                    }))
                  }
                })

                // DON'T fetch opportunities from DB - they don't have creative fields
                // The enhanced opportunities should come from the pipeline response
                console.log('⚠️ Pipeline completed but opportunities should come from pipeline response, not DB')
              }
            }
          )

          // Store unsubscribe function for cleanup
          ;(window as any).__pipelineUnsubscribe = unsubscribe
        } catch (error: any) {
          console.error('Failed to load intelligence:', error)
          set({ error: error.message })
        } finally {
          set({ isLoading: false })
        }
      },
      
      executeOpportunity: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          // This will call the opportunity execution pipeline
          console.log('Executing opportunity:', id)
          // TODO: Implement actual execution
        } catch (error: any) {
          set({ error: error.message })
        } finally {
          set({ isLoading: false })
        }
      },
      
      switchModule: (module: ModuleType) => set({ activeModule: module }),
      setIntelligenceData: (data: IntelligenceData | null) => set({ intelligenceData: data }),
      setOpportunities: (opportunities: Opportunity[]) => set({ opportunities }),
      addCampaign: (campaign: Campaign) => set((state) => ({ 
        activeCampaigns: [...state.activeCampaigns, campaign] 
      })),
      
      updateCanvasComponent: (id: string, componentState: any) => set((state) => {
        // Ensure canvasComponents is a Map
        const currentComponents = state.canvasComponents instanceof Map 
          ? state.canvasComponents 
          : getDefaultCanvasComponents()
        
        const newComponents = new Map(currentComponents)
        newComponents.set(id, componentState)
        return { canvasComponents: newComponents }
      }),
      
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null })
    }),
    {
      name: 'signaldesk-v3-storage',
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        framework: state.framework,
        activeModule: state.activeModule,
        // Convert Map to array for storage
        canvasComponents: Array.from(state.canvasComponents.entries())
      }) as any,
      // Convert array back to Map when loading
      onRehydrateStorage: () => (state: any) => {
        if (state && state.canvasComponents && Array.isArray(state.canvasComponents)) {
          state.canvasComponents = new Map(state.canvasComponents)
        } else if (state) {
          state.canvasComponents = getDefaultCanvasComponents()
        }
      }
    }
  )
)