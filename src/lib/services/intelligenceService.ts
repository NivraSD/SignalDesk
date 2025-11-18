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
      console.log('📋 organizationId parameter:', organizationId, 'Type:', typeof organizationId)

      // Fetch company profile from database to get product_lines and other key info
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('company_profile, settings')
        .eq('id', organizationId)
        .single()

      if (orgError) {
        console.error('Failed to load organization:', orgError)
      }

      const companyProfile = orgData?.company_profile || {}
      const website = companyProfile?.url || orgData?.settings?.url

      console.log('📋 Company profile loaded:', {
        hasProfile: !!companyProfile,
        productLines: companyProfile.product_lines?.length || 0,
        keyMarkets: companyProfile.key_markets?.length || 0,
        website
      })

      // Start with mcp-discovery - passing company profile data
      const payload = {
        tool: 'create_organization_profile',
        arguments: {
          organization_name: orgName,
          industry_hint: industry,
          website: website,
          product_lines: companyProfile.product_lines || [],
          key_markets: companyProfile.key_markets || [],
          business_model: companyProfile.business_model,
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

      // Parse MCP response format: { content: [{ type: "text", text: "..." }] }
      let profile = data?.profile
      if (!profile && data?.content?.[0]?.text) {
        try {
          const parsedContent = JSON.parse(data.content[0].text)
          profile = parsedContent.profile || parsedContent
        } catch (e) {
          console.warn('Failed to parse MCP response, using data as-is')
          profile = data
        }
      }

      console.log('✅ Profile extracted:', profile ? 'Yes' : 'No')

      // Use niv-fireplexity-monitor-v2 for Firecrawl-based monitoring (better than RSS)
      if (profile) {
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

        // Monitoring now handles relevance filtering internally via AI
        // Articles returned are already filtered by Claude based on intelligence_targets
        if (monitoringResponse.data?.articles) {
          console.log('📊 Monitoring returned', monitoringResponse.data.articles.length, 'AI-filtered articles')
          onProgress?.('monitor-stage-2-relevance', 'completed', {
            articles: monitoringResponse.data.articles,
            note: 'Filtered by monitoring function internally'
          })

          // Call enrichment directly with the already-filtered articles
          if (monitoringResponse.data?.articles?.length > 0) {
            // STEP 1: Call enrichment directly from frontend
            console.log('Starting monitoring-stage-2-enrichment directly')
            onProgress?.('monitoring-stage-2-enrichment', 'running')
            
            const enrichmentResponse = await supabase.functions.invoke('monitoring-stage-2-enrichment', {
              body: {
                articles: monitoringResponse.data.articles,
                profile: profile,
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
            console.log('Starting mcp-opportunity-detector-v2')
            onProgress?.('mcp-opportunity-detector', 'running')

            const opportunityDetectorResponse = await supabase.functions.invoke('mcp-opportunity-detector-v2', {
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
   * Run monitoring pipeline for an organization that has already completed onboarding
   * Skips mcp-discovery and starts directly with monitoring using saved intelligence targets
   * Pipeline flow:
   * 1. Load existing profile from database
   * 2. niv-fireplexity-monitor-v2 (uses saved intelligence targets)
   * 3. monitor-stage-2-relevance
   * 4. monitoring-stage-2-enrichment
   * 5. mcp-executive-synthesis
   * 6. mcp-opportunity-detector-v2
   */
  static async runMonitoringPipeline(
    organizationId: string,
    organizationName: string,
    onProgress?: (stage: string, status: 'running' | 'completed' | 'failed', data?: any) => void
  ) {
    try {
      console.log('🔄 Running monitoring pipeline for:', organizationName)

      // STEP 1: Load existing profile from database (don't re-run discovery)
      console.log('📥 Loading existing profile from database...')
      onProgress?.('load-profile', 'running')

      const { data: profileRecord, error: profileError } = await supabase
        .from('organization_profiles')
        .select('profile_data')
        .eq('organization_name', organizationName)
        .single()

      if (profileError || !profileRecord) {
        const errorMsg = `No profile found for ${organizationName} - please run onboarding first`
        console.error('❌', errorMsg)
        onProgress?.('load-profile', 'failed', { error: errorMsg })
        throw new Error(errorMsg)
      }

      const profile = profileRecord.profile_data
      console.log('✅ Profile loaded successfully')
      onProgress?.('load-profile', 'completed', { profile })

      // STEP 2: Start with niv-fireplexity-monitor-v2 (uses saved intelligence targets)
      console.log('Starting niv-fireplexity-monitor-v2 with 24-hour monitoring (Firecrawl-based with real-time accuracy)')
      onProgress?.('niv-fireplexity-monitor-v2', 'running')

      const monitoringResponse = await supabase.functions.invoke('niv-fireplexity-monitor-v2', {
        body: {
          organization_id: organizationId,
          organization_name: organizationName,
          recency_window: '24hours',
          max_results: 100,
          skip_deduplication: false
        }
      })

      if (monitoringResponse.error) {
        console.error('❌ Monitoring error:', monitoringResponse.error)
        onProgress?.('niv-fireplexity-monitor-v2', 'failed', monitoringResponse.error)
        throw new Error(`Monitoring failed: ${monitoringResponse.error.message || 'Unknown error'}`)
      }

      console.log('✅ niv-fireplexity-monitor-v2 completed')
      onProgress?.('niv-fireplexity-monitor-v2', 'completed', monitoringResponse.data)

      // STEP 3: monitor-stage-2-relevance
      if (monitoringResponse.data?.articles) {
        console.log('Starting monitor-stage-2-relevance')
        onProgress?.('monitor-stage-2-relevance', 'running')

        const relevanceResponse = await supabase.functions.invoke('monitor-stage-2-relevance', {
          body: {
            articles: monitoringResponse.data.articles,
            profile: profile,
            organization_name: organizationName,
            top_k: 300
          }
        })

        if (relevanceResponse.error) {
          console.error('❌ Relevance scoring error:', relevanceResponse.error)
          onProgress?.('monitor-stage-2-relevance', 'failed', relevanceResponse.error)
          throw new Error(`Relevance scoring failed: ${relevanceResponse.error.message || 'Unknown error'}`)
        }

        console.log('✅ monitor-stage-2-relevance completed')
        onProgress?.('monitor-stage-2-relevance', 'completed', relevanceResponse.data)

        // STEP 4: monitoring-stage-2-enrichment
        if (relevanceResponse.data?.findings) {
          console.log('Starting monitoring-stage-2-enrichment')
          onProgress?.('monitoring-stage-2-enrichment', 'running')

          const enrichmentResponse = await supabase.functions.invoke('monitoring-stage-2-enrichment', {
            body: {
              articles: relevanceResponse.data.findings || [],
              profile: profile,
              organization_name: organizationName,
              organization: { name: organizationName },
              articles_limit: 300
            }
          })

          if (enrichmentResponse.error) {
            console.error('❌ Enrichment error:', enrichmentResponse.error)
            onProgress?.('monitoring-stage-2-enrichment', 'failed', enrichmentResponse.error)
            throw new Error(`Enrichment failed: ${enrichmentResponse.error.message || 'Unknown error'}`)
          }

          console.log('✅ monitoring-stage-2-enrichment completed')
          onProgress?.('monitoring-stage-2-enrichment', 'completed', enrichmentResponse.data)

          // Format enriched data for synthesis
          const enrichedDataForSynthesis = {
            enriched_articles: enrichmentResponse.data.enriched_articles || enrichmentResponse.data.articles || [],
            knowledge_graph: enrichmentResponse.data.knowledge_graph || {},
            executive_summary: enrichmentResponse.data.executive_summary || {},
            organized_intelligence: enrichmentResponse.data.organized_intelligence || {},
            extracted_data: enrichmentResponse.data.extracted_data,
            statistics: enrichmentResponse.data.statistics,
            profile: enrichmentResponse.data.profile || profile,
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

          // STEP 5: mcp-executive-synthesis
          console.log('Starting mcp-executive-synthesis')
          onProgress?.('mcp-executive-synthesis', 'running')

          const synthesisResponse = await supabase.functions.invoke('mcp-executive-synthesis', {
            body: {
              method: 'tools/call',
              params: {
                name: 'synthesize_executive_intelligence',
                arguments: {
                  organization_id: organizationId,
                  organization: { name: organizationName },
                  organization_name: organizationName,
                  profile: profile,
                  enriched_data: enrichedDataForSynthesis,
                  synthesis_focus: 'all_consolidated'
                }
              }
            }
          })

          if (synthesisResponse.error) {
            console.error('❌ Executive synthesis error:', synthesisResponse.error)
            onProgress?.('mcp-executive-synthesis', 'failed', synthesisResponse.error)
            throw new Error(`Executive synthesis failed: ${synthesisResponse.error.message || 'Unknown error'}`)
          }

          console.log('✅ Executive synthesis completed')
          onProgress?.('mcp-executive-synthesis', 'completed', synthesisResponse.data)

          // STEP 6: mcp-opportunity-detector-v2
          console.log('Starting mcp-opportunity-detector-v2')
          onProgress?.('mcp-opportunity-detector', 'running')

          const opportunityDetectorResponse = await supabase.functions.invoke('mcp-opportunity-detector-v2', {
            body: {
              organization_id: organizationId,
              organization_name: organizationName,
              enriched_data: enrichedDataForSynthesis,
              executive_synthesis: synthesisResponse.data,
              profile: profile
            }
          })

          if (opportunityDetectorResponse.error) {
            console.error('❌ Opportunity detector error:', opportunityDetectorResponse.error)
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

          console.log('🎉 Monitoring pipeline completed successfully')

          return {
            pipelineRunId: `pipeline-${Date.now()}`,
            success: true,
            profile: profile,
            monitoringData: monitoringResponse.data,
            relevanceData: relevanceResponse.data,
            enrichmentData: enrichmentResponse.data,
            executiveSynthesis: synthesisData,
            synthesis: synthesisData,
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
          profile: profile,
          monitoringData: monitoringResponse.data,
          relevanceData: relevanceResponse.data
        }
      }

      return {
        pipelineRunId: `pipeline-${Date.now()}`,
        profile: profile,
        monitoringData: monitoringResponse.data
      }
    } catch (error: any) {
      console.error('❌ Monitoring pipeline failed:', error)
      throw new Error(`Monitoring pipeline error: ${error.message || 'Unknown error'}`)
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

    if (error) {
      console.error('Failed to get synthesis:', error)
      return null
    }

    // Return the first item if it exists, otherwise null
    return data && data.length > 0 ? data[0] : null
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