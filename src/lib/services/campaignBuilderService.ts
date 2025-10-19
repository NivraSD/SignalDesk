import { supabase } from '@/lib/supabase/client'

export interface CampaignResearchResult {
  sessionId: string
  success: boolean
  discoveryData?: any
  stakeholderData?: any
  narrativeData?: any
  channelData?: any
  historicalData?: any
  intelligenceBrief?: any
  statistics?: {
    toolCallsExecuted: number
    researchTime: number
    stakeholdersIdentified: number
    narrativesFound: number
    journalistsIdentified: number
  }
}

export class CampaignBuilderService {
  /**
   * Start campaign research pipeline
   * Pipeline flow:
   * 1. mcp-discovery (organization profile)
   * 2. Parallel MCP calls:
   *    - niv-fireplexity (stakeholder intelligence)
   *    - niv-fireplexity (narrative landscape)
   *    - journalist-registry (channel intelligence)
   *    - knowledge-library-registry (historical patterns)
   * 3. niv-campaign-research-synthesis (synthesize into CampaignIntelligenceBrief)
   */
  static async startResearchPipeline(
    sessionId: string,
    campaignGoal: string,
    orgId: string,
    organizationName: string,
    industryHint: string,
    onProgress?: (stage: string, status: 'running' | 'completed' | 'failed', data?: any) => void
  ): Promise<CampaignResearchResult> {
    try {
      console.log('🚀 Campaign Builder: Starting research pipeline')
      console.log('Session:', sessionId, 'Goal:', campaignGoal)

      const startTime = Date.now()

      // STEP 1: Organization Discovery
      console.log('📋 Step 1: Organization discovery...')
      onProgress?.('discovery', 'running')

      const discoveryResponse = await supabase.functions.invoke('mcp-discovery', {
        body: {
          tool: 'create_organization_profile',
          arguments: {
            organization_name: organizationName,
            industry_hint: industryHint,
            save_to_persistence: true
          }
        }
      })

      if (discoveryResponse.error) {
        console.error('Discovery failed:', discoveryResponse.error)
        onProgress?.('discovery', 'failed', discoveryResponse.error)
        throw new Error(`Discovery failed: ${discoveryResponse.error.message}`)
      }

      console.log('✅ Organization profile created')
      onProgress?.('discovery', 'completed', discoveryResponse.data)

      // STEP 2: Parallel MCP Intelligence Gathering
      console.log('🔍 Step 2: Gathering intelligence across dimensions...')
      onProgress?.('intelligence-gathering', 'running')

      const researchCalls = await Promise.allSettled([
        // Stakeholder Intelligence
        supabase.functions.invoke('niv-fireplexity', {
          body: {
            query: `${organizationName} stakeholders customers target audience`,
            timeWindow: '7d',
            maxResults: 10,
            organization: organizationName
          }
        }),

        // Narrative Environment
        supabase.functions.invoke('niv-fireplexity', {
          body: {
            query: `${industryHint} trends narrative 2025`,
            timeWindow: '7d',
            maxResults: 10,
            organization: organizationName
          }
        }),

        // Channel Intelligence - Journalists (don't pass tier to get all tiers)
        supabase.functions.invoke('journalist-registry', {
          body: {
            industry: industryHint.toLowerCase().replace(/\s+/g, '_'), // Normalize: "Artificial Intelligence" -> "artificial_intelligence"
            // Don't pass tier parameter to get both tier1 and tier2
            count: 10
          }
        }),

        // Historical Patterns
        supabase.functions.invoke('knowledge-library-registry', {
          body: {
            query: `${industryHint} successful campaigns case studies`,
            research_area: 'case_studies',
            limit: 10
          }
        })
      ])

      // Collect results
      const gatheredData: any = {
        discovery: discoveryResponse.data,
        stakeholder: null,
        narrative: null,
        channel: null,
        historical: null
      }

      researchCalls.forEach((result, idx) => {
        const types = ['stakeholder', 'narrative', 'channel', 'historical']
        if (result.status === 'fulfilled' && result.value.data) {
          gatheredData[types[idx]] = result.value.data
        } else if (result.status === 'rejected') {
          console.warn(`Research call ${types[idx]} failed:`, result.reason)
        }
      })

      console.log('✅ Intelligence gathered')
      console.log('Gathered data keys:', Object.keys(gatheredData))
      console.log('Discovery data?', !!gatheredData.discovery)
      console.log('Stakeholder data?', !!gatheredData.stakeholder)
      console.log('Narrative data?', !!gatheredData.narrative)
      console.log('Channel data?', !!gatheredData.channel)
      console.log('Historical data?', !!gatheredData.historical)
      onProgress?.('intelligence-gathering', 'completed', gatheredData)

      // STEP 3: Synthesize Intelligence Brief
      console.log('🧪 Step 3: Synthesizing intelligence brief...')
      onProgress?.('synthesis', 'running')

      const synthesisBody = {
        compiledResearch: gatheredData,
        campaignGoal,
        organizationContext: {
          name: organizationName,
          industry: industryHint
        }
      }

      console.log('Synthesis body size:', JSON.stringify(synthesisBody).length, 'bytes')

      const synthesisResponse = await supabase.functions.invoke('niv-campaign-research-synthesis', {
        body: synthesisBody
      })

      if (synthesisResponse.error) {
        console.error('Synthesis failed:', synthesisResponse.error)
        onProgress?.('synthesis', 'failed', synthesisResponse.error)
        throw new Error(`Synthesis failed: ${synthesisResponse.error.message}`)
      }

      console.log('✅ Synthesis complete')
      onProgress?.('synthesis', 'completed', synthesisResponse.data)

      const intelligenceBrief = synthesisResponse.data?.campaignIntelligenceBrief

      // STEP 4: Save to database
      console.log('💾 Saving research to database...')
      onProgress?.('saving', 'running')

      const { error: saveError } = await supabase
        .from('campaign_builder_sessions')
        .update({
          research_findings: intelligenceBrief,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (saveError) {
        console.error('Failed to save research:', saveError)
        onProgress?.('saving', 'failed', saveError)
        // Don't throw - we have the data even if save failed
      } else {
        console.log('✅ Research saved to database')
        onProgress?.('saving', 'completed')
      }

      const totalTime = Date.now() - startTime

      return {
        sessionId,
        success: true,
        discoveryData: discoveryResponse.data,
        stakeholderData: gatheredData.stakeholder,
        narrativeData: gatheredData.narrative,
        channelData: gatheredData.channel,
        historicalData: gatheredData.historical,
        intelligenceBrief,
        statistics: {
          toolCallsExecuted: 5, // discovery + 4 parallel calls
          researchTime: totalTime,
          stakeholdersIdentified: intelligenceBrief?.stakeholders?.length || 0,
          narrativesFound: intelligenceBrief?.narrativeLandscape?.narrativeVacuums?.length || 0,
          journalistsIdentified: intelligenceBrief?.channelIntelligence?.journalists?.length || 0
        }
      }

    } catch (error: any) {
      console.error('❌ Research pipeline error:', error)
      throw new Error(`Pipeline error: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Get a campaign session from the database
   */
  static async getSession(sessionId: string) {
    const { data, error } = await supabase
      .from('campaign_builder_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error) {
      console.error('Failed to get session:', error)
      return null
    }

    return data
  }

  /**
   * Create a new campaign session
   */
  static async createSession(
    orgId: string,
    campaignGoal: string,
    userId?: string
  ) {
    const { data, error } = await supabase
      .from('campaign_builder_sessions')
      .insert({
        org_id: orgId,
        user_id: userId,
        current_stage: 'intent',
        status: 'active',
        campaign_goal: campaignGoal,
        conversation_history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create session:', error)
      throw new Error(`Failed to create session: ${error.message}`)
    }

    return data
  }

  /**
   * Update session stage and data
   */
  static async updateSession(
    sessionId: string,
    updates: {
      currentStage?: string
      researchFindings?: any
      selectedPositioning?: any
      selectedApproach?: string
      blueprint?: any
      conversationHistory?: any[]
    }
  ) {
    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    }

    if (updates.currentStage) dbUpdates.current_stage = updates.currentStage
    if (updates.researchFindings) dbUpdates.research_findings = updates.researchFindings
    if (updates.selectedPositioning) dbUpdates.selected_positioning = updates.selectedPositioning
    if (updates.selectedApproach) dbUpdates.selected_approach = updates.selectedApproach
    if (updates.blueprint) dbUpdates.blueprint = updates.blueprint
    if (updates.conversationHistory) dbUpdates.conversation_history = updates.conversationHistory

    const { error } = await supabase
      .from('campaign_builder_sessions')
      .update(dbUpdates)
      .eq('id', sessionId)

    if (error) {
      console.error('Failed to update session:', error)
      throw new Error(`Failed to update session: ${error.message}`)
    }
  }
}
