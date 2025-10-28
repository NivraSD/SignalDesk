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
      // Use niv-fireplexity-monitor-v2 for Firecrawl-based monitoring (better than RSS)
      if (data?.profile) {
        console.log('Starting niv-fireplexity-monitor-v2 with 24-hour monitoring (Firecrawl-based with real-time accuracy)')
        onProgress?.('niv-fireplexity-monitor-v2', 'running')

        const monitoringResponse = await supabase.functions.invoke('niv-fireplexity-monitor-v2', {
          body: {
            organization_id: organizationId,
            organization_name: orgName,
            recency_window: '24hours',
            max_results: 100,
            skip_deduplication: false
          }
        })

        console.log('niv-fireplexity-monitor-v2 response:', monitoringResponse)
        onProgress?.('niv-fireplexity-monitor-v2', 'completed', monitoringResponse.data)

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

            // STEP 2: Format enriched data like orchestrator-v2 does (lines 456-480)
            const enrichedDataForSynthesis = {
              enriched_articles: enrichmentResponse.data.enriched_articles || enrichmentResponse.data.articles || [],
              knowledge_graph: enrichmentResponse.data.knowledge_graph || {},
              executive_summary: enrichmentResponse.data.executive_summary || {},
              organized_intelligence: enrichmentResponse.data.organized_intelligence || {},
              extracted_data: enrichmentResponse.data.extracted_data,
              statistics: enrichmentResponse.data.statistics,
              profile: enrichmentResponse.data.profile || data.profile,
              monitoring_data: {
                total_articles: enrichmentResponse.data.enriched_articles?.length || 0,
                articles_processed: enrichmentResponse.data.articles_processed || 0,
                deep_analyzed: enrichmentResponse.data.statistics?.deep_analyzed || 0
              }
            }

            console.log('📤 Formatted enriched data for synthesis:', {
              has_organized_intelligence: !!enrichedDataForSynthesis.organized_intelligence,
              organized_events: enrichedDataForSynthesis.organized_intelligence?.events?.length || 0,
              has_extracted_data: !!enrichedDataForSynthesis.extracted_data,
              extracted_events: enrichedDataForSynthesis.extracted_data?.events?.length || 0
            })

            // STEP 3: Call executive synthesis with properly formatted data
            console.log('Starting mcp-executive-synthesis')
            onProgress?.('mcp-executive-synthesis', 'running')

            const synthesisResponse = await supabase.functions.invoke('mcp-executive-synthesis', {
              body: {
                method: 'tools/call',
                params: {
                  name: 'synthesize_executive_intelligence',
                  arguments: {
                    organization_id: organizationId,
                    organization: { name: orgName },
                    organization_name: orgName,
                    profile: data.profile,
                    enriched_data: enrichedDataForSynthesis,  // Use formatted data
                    synthesis_focus: 'all_consolidated'
                  }
                }
              }
            })

            if (synthesisResponse.error) {
              console.error('Executive synthesis error:', synthesisResponse.error)
              onProgress?.('mcp-executive-synthesis', 'failed', synthesisResponse.error)
              throw new Error(`Executive synthesis failed: ${synthesisResponse.error.message || 'Unknown error'}`)
            }

            console.log('✅ Executive synthesis completed')
            onProgress?.('mcp-executive-synthesis', 'completed', synthesisResponse.data)

            // STEP 4: Call opportunity detector with formatted data
            console.log('Starting mcp-opportunity-detector')
            onProgress?.('mcp-opportunity-detector', 'running')

            const opportunityDetectorResponse = await supabase.functions.invoke('mcp-opportunity-detector', {
              body: {
                organization_id: organizationId,
                organization_name: orgName,
                enriched_data: enrichedDataForSynthesis,  // Use formatted data
                executive_synthesis: synthesisResponse.data,
                profile: data.profile
              }
            })

            if (opportunityDetectorResponse.error) {
              console.error('Opportunity detector error:', opportunityDetectorResponse.error)
              onProgress?.('mcp-opportunity-detector', 'failed', opportunityDetectorResponse.error)
            }

            const opportunities = opportunityDetectorResponse.data?.opportunitiesV2 || opportunityDetectorResponse.data?.opportunities || []
            console.log(`✅ Detected ${opportunities.length} opportunities`)
            onProgress?.('mcp-opportunity-detector', 'completed', opportunityDetectorResponse.data)

            // Unwrap MCP protocol format
            let synthesisData = synthesisResponse.data
            if (synthesisResponse.data?.content?.[0]?.text) {
              console.log('🔍 Detected MCP format, unwrapping...')
              try {
                synthesisData = JSON.parse(synthesisResponse.data.content[0].text)
                console.log('✅ MCP format unwrapped successfully')
              } catch (e) {
                console.error('❌ Failed to parse MCP text:', e)
              }
            }

            console.log('🔍 Final synthesisData:', synthesisData)
            console.log('🔍 synthesisData.synthesis:', synthesisData?.synthesis)

            return {
              pipelineRunId: `pipeline-${Date.now()}`,
              success: true,
              discoveryData: data,
              monitoringData: monitoringResponse.data,
              relevanceData: relevanceResponse.data,
              enrichmentData: enrichmentResponse.data,
              executiveSynthesis: synthesisData,  // FIXED: Pass full object with nested .synthesis
              synthesis: synthesisData,  // FIXED: Pass full object with nested .synthesis
              opportunities: opportunities,
              statistics: {
                articlesCollected: monitoringResponse.data?.metadata?.total_collected || 0,
                articlesRelevant: relevanceResponse.data?.statistics?.output_count || 0,
                eventsExtracted: enrichmentResponse.data?.extracted_data?.events?.length || 0,
                opportunitiesIdentified: opportunities.length || 0
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