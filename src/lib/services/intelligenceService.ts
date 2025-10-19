import { supabase } from '@/lib/supabase/client'
import type { IntelligenceReport, Opportunity, PipelineRun, ExecutiveSynthesis } from '@/lib/supabase/types'

export class IntelligenceService {
  /**
   * Start a new intelligence pipeline run
   * Pipeline flow:
   * 1. mcp-discovery
   * 2. monitoring-stage-1
   * 3. monitor-stage-2-relevance
   * 4. monitoring-stage-2-enrichment
   * 5. intelligence-orchestrator-v2
   * 6. mcp-executive-synthesis
   * 7. opportunity-orchestrator
   */
  static async startPipeline(
    organizationId: string, 
    organizationName?: string, 
    industryHint?: string,
    onProgress?: (stage: string, status: 'running' | 'completed' | 'failed', data?: any) => void
  ) {
    try {
      const orgName = organizationName || 'Tesla'
      const industry = industryHint || 'Electric Vehicles'
      
      console.log('🚨🚨🚨 CRITICAL TEST - THIS CODE IS RUNNING - VERSION 2 🚨🚨🚨')
      console.log('Starting pipeline for organization:', orgName, 'Industry:', industry)
      
      // Start with mcp-discovery - using the correct parameters from the function
      const payload = { 
        tool: 'create_organization_profile',
        arguments: {
          organization_name: orgName,
          industry_hint: industry,
          save_to_persistence: true
        }
      }
      
      console.log('Calling mcp-discovery with payload:', payload)
      onProgress?.('mcp-discovery', 'running')
      
      const { data, error } = await supabase.functions.invoke('mcp-discovery', {
        body: payload
      })

      if (error) {
        console.error('Edge function error:', error)
        console.error('Error response:', error)
        onProgress?.('mcp-discovery', 'failed', error)
        
        // Try to get more details about the error
        if ((error as any).context) {
          console.error('Error context:', (error as any).context)
        }
        throw error
      }
      
      console.log('Pipeline started successfully:', data)
      onProgress?.('mcp-discovery', 'completed', data)
      
      // mcp-discovery returns { profile, content, success }
      // monitor-stage-1 expects { organization_name, profile }
      if (data?.profile) {
        console.log('Starting monitor-stage-1 with profile')
        onProgress?.('monitor-stage-1', 'running')
        
        const monitoringResponse = await supabase.functions.invoke('monitor-stage-1', {
          body: {
            organization_name: orgName,
            profile: data.profile
          }
        })
        
        console.log('monitor-stage-1 response:', monitoringResponse)
        onProgress?.('monitor-stage-1', 'completed', monitoringResponse.data)
        
        // monitor-stage-1 returns { articles, metadata, success }
        // monitor-stage-2-relevance expects { articles, profile, organization_name, top_k }
        if (monitoringResponse.data?.articles) {
          console.log('Starting monitor-stage-2-relevance')
          onProgress?.('monitor-stage-2-relevance', 'running')
          
          const relevanceResponse = await supabase.functions.invoke('monitor-stage-2-relevance', {
            body: {
              articles: monitoringResponse.data.articles,
              profile: data.profile,
              organization_name: orgName,
              top_k: 300  // Increased from 100 to get more diverse content
            }
          })
          
          console.log('monitor-stage-2-relevance response:', relevanceResponse)
          onProgress?.('monitor-stage-2-relevance', 'completed', relevanceResponse.data)
          
          // NEW FLOW: Call enrichment directly, then pass enriched data to orchestrator
          if (relevanceResponse.data?.findings) {
            // STEP 1: Call enrichment directly from frontend
            console.log('Starting monitoring-stage-2-enrichment directly')
            onProgress?.('monitoring-stage-2-enrichment', 'running')
            
            const enrichmentResponse = await supabase.functions.invoke('monitoring-stage-2-enrichment', {
              body: {
                articles: relevanceResponse.data.findings || [],
                profile: data.profile,
                organization_name: orgName,
                organization: { name: orgName },
                articles_limit: 300
              }
            })
            
            console.log('monitoring-stage-2-enrichment response:', enrichmentResponse)
            
            if (enrichmentResponse.error) {
              console.error('Enrichment error:', enrichmentResponse.error)
              onProgress?.('monitoring-stage-2-enrichment', 'failed', enrichmentResponse.error)
              throw new Error(`Enrichment failed: ${enrichmentResponse.error.message || 'Unknown error'}`)
            }
            
            onProgress?.('monitoring-stage-2-enrichment', 'completed', enrichmentResponse.data)
            
            // STEP 2: Pass enriched data to orchestrator (skip internal enrichment)
            console.log('Starting intelligence-orchestrator-v2 with pre-enriched data')
            onProgress?.('intelligence-orchestrator-v2', 'running')
            
            console.log('Passing to orchestrator:', {
              hasProfile: !!data.profile,
              hasEnrichedData: !!enrichmentResponse.data,
              enrichedArticles: enrichmentResponse.data?.enriched_articles?.length || 0,
              events: enrichmentResponse.data?.extracted_data?.events?.length || 0,
              entities: enrichmentResponse.data?.extracted_data?.entities?.length || 0
            })
            
            const orchestratorResponse = await supabase.functions.invoke('intelligence-orchestrator-v2', {
              body: {
                organization_id: organizationId,
                organization: { name: orgName },
                organization_name: orgName,
                profile: data.profile,
                monitoring_data: {
                  findings: relevanceResponse.data.findings || monitoringResponse.data.articles || [],
                  total_articles: monitoringResponse.data.total_articles || monitoringResponse.data.articles?.length || 0,
                  metadata: monitoringResponse.data.metadata
                },
                // IMPORTANT: Pass enriched data and skip internal enrichment
                enriched_data: enrichmentResponse.data,
                skip_enrichment: true,
                skip_opportunity_engine: false,
                articles_limit: 300
              }
            })
              
              console.log('intelligence-orchestrator-v2 response:', orchestratorResponse)
              
              // Check for orchestrator errors but also check for partial results
              if (orchestratorResponse.error) {
                console.error('Orchestrator error:', orchestratorResponse.error)
                
                // Check if error response contains partial results
                const errorData = (orchestratorResponse.error as any)?.data || (orchestratorResponse.error as any)?.context?.body
                if (errorData?.partial_results) {
                  console.log('⚠️ Orchestrator failed but returned partial results:', errorData.partial_results)
                  onProgress?.('intelligence-orchestrator-v2', 'partial', errorData.partial_results)
                  
                  // Use partial results to continue
                  orchestratorResponse.data = {
                    ...errorData.partial_results,
                    success: false,
                    partial: true,
                    error: orchestratorResponse.error.message
                  }
                } else {
                  onProgress?.('intelligence-orchestrator-v2', 'failed', orchestratorResponse.error)
                  throw new Error(`Orchestrator failed: ${orchestratorResponse.error.message || 'Unknown error'}`)
                }
              }
              
              // Check if orchestrator returned insufficient data error
              if (orchestratorResponse.data?.success === false) {
                console.error('Orchestrator returned error:', orchestratorResponse.data)
                if (orchestratorResponse.data?.error?.includes('Insufficient data')) {
                  throw new Error('Not enough data found for analysis. Try a different search query or broaden your search.')
                }
                throw new Error(orchestratorResponse.data?.error || 'Orchestrator processing failed')
              }
              
              onProgress?.('intelligence-orchestrator-v2', 'completed', orchestratorResponse.data)
              
              // Check if synthesis timed out
              if (orchestratorResponse.data?.partial_results?.executive_synthesis === null) {
                console.error('⚠️ Executive synthesis timed out but pipeline continued')
                onProgress?.('mcp-executive-synthesis', 'failed', { timeout: true })
                console.log('Partial results available:', {
                  hasEnrichedData: !!orchestratorResponse.data?.partial_results?.enriched_data,
                  hasOpportunities: !!orchestratorResponse.data?.partial_results?.opportunities?.length
                })
              } else if (orchestratorResponse.data?.executive_synthesis) {
                onProgress?.('mcp-executive-synthesis', 'completed', orchestratorResponse.data.executive_synthesis)
              }
              
              // Check for opportunities
              if (orchestratorResponse.data?.opportunities?.length > 0) {
                onProgress?.('opportunity-orchestrator', 'completed', orchestratorResponse.data.opportunities)
              }
              
              // The orchestrator handles calling mcp-executive-synthesis internally
              // and also calls opportunity-orchestrator
              // It returns { executive_synthesis, opportunities, enriched_data, statistics }
              
              return {
                pipelineRunId: `pipeline-${Date.now()}`,
                success: true,
                discoveryData: data,
                monitoringData: monitoringResponse.data,
                relevanceData: relevanceResponse.data,
                enrichmentData: orchestratorResponse.data?.enriched_data, // Enrichment data is inside orchestrator response
                orchestratorData: orchestratorResponse.data,
                // Extract the key results for easy access
                // Check for both possible synthesis locations
                executiveSynthesis: orchestratorResponse.data?.executive_synthesis,
                synthesis: orchestratorResponse.data?.synthesis || orchestratorResponse.data?.executive_synthesis,
                opportunities: orchestratorResponse.data?.opportunities,
                statistics: {
                  articlesCollected: monitoringResponse.data?.metadata?.total_collected || 0,
                  articlesRelevant: relevanceResponse.data?.statistics?.output_count || 0,
                  eventsExtracted: orchestratorResponse.data?.enriched_data?.statistics?.total_events || 0,
                  opportunitiesIdentified: orchestratorResponse.data?.opportunities?.length || 0
                }
              }
            }
          
          // Return partial results if pipeline doesn't complete
          return {
            pipelineRunId: `pipeline-${Date.now()}`,
            discoveryData: data,
            monitoringData: monitoringResponse.data,
            relevanceData: relevanceResponse.data
          }
        }
        
        return {
          pipelineRunId: `pipeline-${Date.now()}`,
          discoveryData: data,
          monitoringData: monitoringResponse.data
        }
      }
      
      return data
    } catch (error: any) {
      console.error('Failed to start pipeline:', error)
      throw new Error(`Pipeline error: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Get the status of a pipeline run
   */
  static async getPipelineStatus(pipelineRunId: string): Promise<PipelineRun | null> {
    const { data, error } = await supabase
      .from('pipeline_runs')
      .select('*')
      .eq('id', pipelineRunId)
      .single()

    if (error) {
      console.error('Failed to get pipeline status:', error)
      return null
    }

    return data
  }

  /**
   * Get the latest executive synthesis for an organization
   */
  static async getLatestSynthesis(organizationId: string): Promise<ExecutiveSynthesis | null> {
    const { data, error } = await supabase
      .from('executive_synthesis')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Failed to get synthesis:', error)
      return null
    }

    return data
  }

  /**
   * Get opportunities for an organization
   */
  static async getOpportunities(organizationId: string): Promise<Opportunity[]> {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('organization_id', organizationId)
      .order('score', { ascending: false })

    if (error) {
      console.error('Failed to get opportunities:', error)
      return []
    }

    return data || []
  }

  /**
   * Subscribe to real-time pipeline updates
   */
  static subscribeToPipelineUpdates(
    pipelineRunId: string,
    onUpdate: (status: PipelineRun) => void
  ) {
    const subscription = supabase
      .channel(`pipeline-${pipelineRunId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pipeline_runs',
          filter: `id=eq.${pipelineRunId}`
        },
        (payload) => {
          onUpdate(payload.new as PipelineRun)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  /**
   * Get intelligence reports for a pipeline run
   */
  static async getIntelligenceReports(pipelineRunId: string): Promise<IntelligenceReport[]> {
    const { data, error } = await supabase
      .from('intelligence_reports')
      .select('*')
      .eq('pipeline_run_id', pipelineRunId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to get reports:', error)
      return []
    }

    return data || []
  }
}