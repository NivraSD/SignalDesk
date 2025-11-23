import { supabase } from '@/lib/supabase/client'
import type { IntelligenceReport, Opportunity, PipelineRun, ExecutiveSynthesis } from '@/lib/supabase/types'

export class IntelligenceService {
  /**
   * Start a new intelligence pipeline run (V5)
   * Pipeline flow:
   * 1. mcp-discovery (create company profile)
   * 2. article-selector (AI-powered relevance scoring from V5 batch scraper)
   * 3. target-intelligence-collector (save mentions)
   * 4. pattern-detector (detect patterns)
   * 5. connection-detector (find connections)
   * 6. monitoring-stage-2-enrichment (extract events/entities)
   * 7. mcp-executive-synthesis (generate executive summary)
   * 8. mcp-opportunity-detector-v2 (detect opportunities)
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
          organization_id: organizationId,
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

      // Use article-selector to query V5 batch scraper articles
      if (profile) {
        console.log('Starting article-selector (V5 batch scraper with AI relevance scoring)')
        onProgress?.('article-selector', 'running')

        const articleResponse = await supabase.functions.invoke('article-selector', {
          body: {
            organization_id: organizationId,
            organization_name: orgName
          }
        })

        if (articleResponse.error) {
          console.error('Article selection error:', articleResponse.error)
          onProgress?.('article-selector', 'failed', articleResponse.error)
          throw new Error(`Article selection failed: ${articleResponse.error.message || 'Unknown error'}`)
        }

        console.log('✅ article-selector completed')
        onProgress?.('article-selector', 'completed', articleResponse.data)

        const finalArticles = articleResponse.data?.articles || []
        console.log('📊 Article selector:', finalArticles.length, 'relevant articles selected (AI-scored)')

          // STEP 3.5: target-intelligence-collector (NEW: Save mentions to intelligence repository)
          if (finalArticles.length > 0) {
            console.log('Starting target-intelligence-collector')
            onProgress?.('target-intelligence-collector', 'running')

            const collectorResponse = await supabase.functions.invoke('target-intelligence-collector', {
              body: {
                articles: finalArticles,
                organization_id: organizationId,
                organization_name: orgName
              }
            })

            if (collectorResponse.error) {
              console.warn('⚠️ Target intelligence collection failed (non-blocking):', collectorResponse.error)
            } else {
              console.log(`✅ Saved ${collectorResponse.data?.mentions_saved || 0} target mentions to intelligence repository`)
              onProgress?.('target-intelligence-collector', 'completed', collectorResponse.data)

              // STEP 3.6: pattern-detector (NEW: Detect patterns and generate prediction signals)
              console.log('Starting pattern-detector')
              onProgress?.('pattern-detector', 'running')

              const patternResponse = await supabase.functions.invoke('pattern-detector', {
                body: {
                  organization_id: organizationId
                }
              })

              if (patternResponse.error) {
                console.warn('⚠️ Pattern detection failed (non-blocking):', patternResponse.error)
              } else {
                console.log(`✅ Generated ${patternResponse.data?.signals_generated || 0} prediction signals`)
                onProgress?.('pattern-detector', 'completed', patternResponse.data)

                // STEP 3.7: connection-detector (NEW: Find connections between entities based on industry)
                console.log('Starting connection-detector')
                onProgress?.('connection-detector', 'running')

                const connectionResponse = await supabase.functions.invoke('connection-detector', {
                  body: {
                    organization_id: organizationId
                  }
                })

                if (connectionResponse.error) {
                  console.warn('⚠️ Connection detection failed (non-blocking):', connectionResponse.error)
                } else {
                  console.log(`✅ Detected ${connectionResponse.data?.connections_detected || 0} connections, generated ${connectionResponse.data?.signals_generated || 0} connection signals`)
                  onProgress?.('connection-detector', 'completed', connectionResponse.data)
                }
              }
            }
          }

          // Call enrichment with filtered articles
          if (finalArticles.length > 0) {
            // STEP 4: Call enrichment with final articles (after relevance + QC)
            console.log('Starting monitoring-stage-2-enrichment with', finalArticles.length, 'final articles')
            onProgress?.('monitoring-stage-2-enrichment', 'running')

            const enrichmentResponse = await supabase.functions.invoke('monitoring-stage-2-enrichment', {
              body: {
                articles: finalArticles,
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
              articleSelectionData: articleResponse.data,
              enrichmentData: enrichmentResponse.data,
              executiveSynthesis: synthesisData,  // FIXED: Pass full object with nested .synthesis
              synthesis: synthesisData,  // FIXED: Pass full object with nested .synthesis
              opportunities: opportunities,
              statistics: {
                articlesSelected: articleResponse.data?.total_articles || 0,
                avgRelevanceScore: articleResponse.data?.avg_score || 0,
                eventsExtracted: enrichmentResponse.data?.extracted_data?.events?.length || 0,
                opportunitiesIdentified: opportunities.length || 0
              }
            }
          }
        }

      // Return discovery data if profile check completes
      return data
    } catch (error: any) {
      console.error('Failed to start pipeline:', error)
      throw new Error(`Pipeline error: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Run monitoring pipeline for an organization that has already completed onboarding (V5)
   * Skips mcp-discovery and starts directly with article selection from V5 batch scraper
   * Pipeline flow:
   * 1. Load existing profile from database
   * 2. article-selector (AI-powered relevance scoring from V5 batch scraper)
   * 3. target-intelligence-collector (save mentions)
   * 4. pattern-detector (detect patterns)
   * 5. connection-detector (find connections)
   * 6. monitoring-stage-2-enrichment (extract events/entities)
   * 7. mcp-executive-synthesis (generate executive summary)
   * 8. mcp-opportunity-detector-v2 (detect opportunities)
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

      // STEP 2: Use article-selector to query V5 batch scraper articles
      console.log('Starting article-selector (V5 batch scraper with AI relevance scoring)')
      onProgress?.('article-selector', 'running')

      const articleResponse = await supabase.functions.invoke('article-selector', {
        body: {
          organization_id: organizationId,
          organization_name: organizationName
        }
      })

      if (articleResponse.error) {
        console.error('❌ Article selection error:', articleResponse.error)
        onProgress?.('article-selector', 'failed', articleResponse.error)
        throw new Error(`Article selection failed: ${articleResponse.error.message || 'Unknown error'}`)
      }

      console.log('✅ article-selector completed')
      onProgress?.('article-selector', 'completed', articleResponse.data)

      const finalArticles = articleResponse.data?.articles || []
      console.log('📊 Article selector:', finalArticles.length, 'relevant articles selected (AI-scored)')

        // STEP 3.5: target-intelligence-collector (NEW: Save mentions to intelligence repository)
        if (finalArticles.length > 0) {
          console.log('Starting target-intelligence-collector')
          onProgress?.('target-intelligence-collector', 'running')

          const collectorResponse = await supabase.functions.invoke('target-intelligence-collector', {
            body: {
              articles: finalArticles,
              organization_id: organizationId,
              organization_name: organizationName
            }
          })

          if (collectorResponse.error) {
            console.warn('⚠️ Target intelligence collection failed (non-blocking):', collectorResponse.error)
            // Non-blocking - continue with pipeline even if this fails
          } else {
            console.log(`✅ Saved ${collectorResponse.data?.mentions_saved || 0} target mentions to intelligence repository`)
            onProgress?.('target-intelligence-collector', 'completed', collectorResponse.data)

            // STEP 3.6: pattern-detector (NEW: Detect patterns and generate prediction signals)
            console.log('Starting pattern-detector')
            onProgress?.('pattern-detector', 'running')

            const patternResponse = await supabase.functions.invoke('pattern-detector', {
              body: {
                organization_id: organizationId
              }
            })

            if (patternResponse.error) {
              console.warn('⚠️ Pattern detection failed (non-blocking):', patternResponse.error)
            } else {
              console.log(`✅ Generated ${patternResponse.data?.signals_generated || 0} prediction signals`)
              onProgress?.('pattern-detector', 'completed', patternResponse.data)

              // STEP 3.7: connection-detector (NEW: Find connections between entities based on industry)
              console.log('Starting connection-detector')
              onProgress?.('connection-detector', 'running')

              const connectionResponse = await supabase.functions.invoke('connection-detector', {
                body: {
                  organization_id: organizationId
                }
              })

              if (connectionResponse.error) {
                console.warn('⚠️ Connection detection failed (non-blocking):', connectionResponse.error)
              } else {
                console.log(`✅ Detected ${connectionResponse.data?.connections_detected || 0} connections, generated ${connectionResponse.data?.signals_generated || 0} connection signals`)
                onProgress?.('connection-detector', 'completed', connectionResponse.data)
              }
            }
          }
        }

        // STEP 4: monitoring-stage-2-enrichment
        if (finalArticles.length > 0) {
          console.log('Starting monitoring-stage-2-enrichment with', finalArticles.length, 'final articles')
          onProgress?.('monitoring-stage-2-enrichment', 'running')

          const enrichmentResponse = await supabase.functions.invoke('monitoring-stage-2-enrichment', {
            body: {
              articles: finalArticles,
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
            articleSelectionData: articleResponse.data,
            enrichmentData: enrichmentResponse.data,
            executiveSynthesis: synthesisData,
            synthesis: synthesisData,
            opportunities: opportunities,
            statistics: {
              articlesSelected: articleResponse.data?.total_articles || 0,
              avgRelevanceScore: articleResponse.data?.avg_score || 0,
              eventsExtracted: enrichmentResponse.data?.extracted_data?.events?.length || 0,
              opportunitiesIdentified: opportunities.length || 0
            }
          }
        }

      // Return minimal results if enrichment didn't run
      return {
        pipelineRunId: `pipeline-${Date.now()}`,
        profile: profile,
        articleSelectionData: articleResponse.data
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