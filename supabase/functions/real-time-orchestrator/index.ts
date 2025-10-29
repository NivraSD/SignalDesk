import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Use service role key for internal service-to-service calls
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://zskaxjtyuaqazydouifp.supabase.co';

// Helper function to call a stage with timeout
async function callStage(
  stageName: string, 
  url: string, 
  body: any
): Promise<any> {
  // NO TIMEOUT BULLSHIT - LET SUPABASE'S 60 SECOND LIMIT HANDLE IT
  try {
    console.log(`📞 Calling ${stageName}...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY
      },
      body: JSON.stringify(body)
      // NO SIGNAL, NO ABORT CONTROLLER, NO TIMEOUT
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ${stageName} failed:`, errorText);
      return { error: `${stageName} failed: ${response.status}`, details: errorText };
    }
    
    const result = await response.json();
    console.log(`✅ ${stageName} completed`);
    return result;
    
  } catch (error: any) {
    console.error(`❌ ${stageName} error:`, error.message);
    return { error: `${stageName} error: ${error.message}` };
  }
}

/**
 * Real-Time Orchestrator - Same as Real-Time Orchestrator but for Real-Time UI
 * 
 * Flow:
 * 1. Receive monitoring data (raw articles)
 * 2. Send to monitoring-stage-2-enrichment for event/entity extraction
 * 3. Send enriched data to real-time-synthesis for unified report
 * 4. Route synthesis + opportunities to opportunity engine
 */

serve(async (req) => {
  // Handle CORS preflight immediately
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Process the request WITHOUT artificial timeout
    // Supabase has a 60-second limit, let's use it fully
    const processingPromise = (async () => {
      try {
        console.log('🚀 Real-Time Orchestrator - Request received');
        const requestData = await req.json();
    console.log('📊 Request data keys:', Object.keys(requestData));
    
    const {
      organization_id,  // Extract the organization_id that's being sent!
      organization,
      organization_name,
      profile: initialProfile,
      monitoring_data,
      skip_enrichment = false,  // For testing with pre-enriched data
      skip_opportunity_engine = false,  // For testing without opportunity engine
      articles_limit = 200  // How many articles to process
    } = requestData;

    // Use let to allow reassignment
    let profile = initialProfile;
    
    // Handle both organization object and organization_name string
    if (!organization && !organization_name) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Organization data is required',
        service: 'Real-Time Orchestrator',
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const orgData = organization || { name: organization_name };
    const authorization = req.headers.get('Authorization') || '';
    
    console.log(`🎯 INTELLIGENCE ORCHESTRATOR V2: ${orgData.name || organization_name}`);
    console.log(`📊 Configuration:`, {
      has_profile: !!profile,
      has_monitoring_data: !!monitoring_data,
      articles_count: monitoring_data?.findings?.length || 0,
      articles_limit,
      skip_enrichment,
      skip_opportunity_engine
    });
    
    const startTime = Date.now();
    let enrichedData = null;
    let executiveSynthesis = null;
    let opportunityEngineResult = null;
    let coverageReport = null;
    let actualMonitoringData = monitoring_data; // Define at top level so it's accessible everywhere

    try {
      // CHECK: If enriched_data is provided, skip ALL preprocessing
      if (requestData.enriched_data) {
        enrichedData = requestData.enriched_data;
        console.log('✅ Using pre-enriched data from frontend, skipping monitoring/relevance/enrichment:', {
          has_enriched_articles: !!enrichedData.enriched_articles,
          has_knowledge_graph: !!enrichedData.knowledge_graph,
          has_executive_summary: !!enrichedData.executive_summary,
          statistics: enrichedData.statistics
        });
      } else {
        // Only do monitoring/relevance/enrichment if NOT provided with enriched_data

        // STEP 0: Get monitoring data from Monitor Stage 1 if not provided
        // actualMonitoringData already defined at top level
        actualMonitoringData = monitoring_data;

        if (!monitoring_data || !monitoring_data?.findings) {
        console.log('📡 Step 0: Fetching articles from Monitor Stage 1...');
        
        // First, get discovery profile if not provided
        let actualProfile = profile;
        if (!actualProfile) {
          console.log('   Getting discovery profile...');
          const discoveryResponse = await fetch(
            'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/mcp-discovery',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`
              },
              body: JSON.stringify({
                organization: orgData.name || organization_name
              })
            }
          );
          
          if (discoveryResponse.ok) {
            const discoveryResult = await discoveryResponse.json();
            actualProfile = discoveryResult.profile || discoveryResult;
            console.log('   ✅ Discovery profile obtained');
          }
        }
        
        // Now call Monitor Stage 1
        const monitorResponse = await fetch(
          'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/monitor-stage-1',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({
              organization_name: orgData.name || organization_name,
              profile: actualProfile
            })
          }
        );
        
        if (monitorResponse.ok) {
          const monitorResult = await monitorResponse.json();
          actualMonitoringData = {
            findings: monitorResult.articles || [],
            metadata: monitorResult.metadata,
            social_signals: monitorResult.social_signals || [],
            social_sentiment: monitorResult.social_sentiment
          };
          coverageReport = monitorResult.metadata?.coverage_report;
          console.log(`   ✅ Monitor Stage 1 complete: ${actualMonitoringData.findings.length} articles, ${monitorResult.social_signals?.length || 0} social signals`);
          if (coverageReport) {
            console.log(`   ✅ Coverage report obtained:`, coverageReport.context);
          }
          if (monitorResult.social_signals && monitorResult.social_signals.length > 0) {
            console.log(`   📱 Social signals collected: ${monitorResult.social_signals.length}`);
            if (monitorResult.social_sentiment) {
              console.log(`   💭 Social sentiment: ${monitorResult.social_sentiment.overall_sentiment}`);
            }
          }
        } else {
          console.error('   ❌ Monitor Stage 1 failed:', await monitorResponse.text());
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch monitoring data',
            details: 'Monitor Stage 1 did not return articles'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Update profile if we fetched it
        if (!profile) {
          profile = actualProfile;
        }
      }
      
      // STEP 1: Relevance Filtering (score and filter articles)
      let filteredMonitoringData = actualMonitoringData;
      
      if (!skip_enrichment && actualMonitoringData?.findings?.length > 0) {
        console.log('🎯 Step 1: Filtering articles by relevance...');
        const relevanceStart = Date.now();
        
        const relevanceResponse = await fetch(
          'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/monitor-stage-2-relevance',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({
              articles: actualMonitoringData.findings,
              profile,
              organization_name: orgData.name || organization_name,
              top_k: Math.min(25, articles_limit), // Reduced to 25 to prevent timeout
              coverage_report: coverageReport // Pass coverage report from Monitor Stage 1
            })
          }
        );
        
        if (relevanceResponse.ok) {
          const relevanceResult = await relevanceResponse.json();
          console.log(`✅ Relevance filtering complete in ${Date.now() - relevanceStart}ms:`, {
            input_articles: actualMonitoringData.findings.length,
            relevant_articles: relevanceResult.findings?.length || 0,
            high_relevance: relevanceResult.statistics?.score_distribution?.high || 0,
            medium_relevance: relevanceResult.statistics?.score_distribution?.medium || 0
          });
          
          // DEBUG: Check what we got from relevance
          const articlesWithFullContent = relevanceResult.findings?.filter(a => a.has_full_content) || [];
          const articlesWithExtraction = relevanceResult.findings?.filter(a => a.firecrawl_extracted) || [];
          
          // Check a sample article that actually has content, not just the first one
          const sampleScrapedArticle = articlesWithFullContent[0] || relevanceResult.findings?.[0];
          
          console.log('🔍 DEBUG - Articles from relevance:', {
            total: relevanceResult.findings?.length || 0,
            with_full_content: articlesWithFullContent.length,
            with_extraction: articlesWithExtraction.length,
            sample_article: sampleScrapedArticle ? {
              has_full_content: sampleScrapedArticle.has_full_content,
              content_length: sampleScrapedArticle.content_length,
              full_content_exists: !!sampleScrapedArticle.full_content,
              full_content_length: sampleScrapedArticle.full_content?.length || 0,
              firecrawl_extracted: !!sampleScrapedArticle.firecrawl_extracted,
              is_scraped_sample: !!sampleScrapedArticle.has_full_content
            } : null
          });
          
          // Extract coverage report from relevance metadata if present
          if (relevanceResult.metadata?.coverage_report) {
            coverageReport = relevanceResult.metadata.coverage_report;
            console.log('   📊 Coverage report passed through from relevance');
          }
          
          // Replace monitoring data with filtered articles
          filteredMonitoringData = {
            ...actualMonitoringData,
            findings: relevanceResult.findings || []
          };
        } else {
          console.warn('⚠️ Relevance filtering failed, using all articles');
        }
      }
      
      // STEP 2: Data Enrichment (extract events, entities, topics from RELEVANT articles)
      if (!skip_enrichment && filteredMonitoringData?.findings?.length > 0) {
        // DEBUG: Check what we're about to send to enrichment
        const checkArticles = filteredMonitoringData.findings || [];
        console.log('📊 Step 2: Enriching relevant articles...', {
          articles_to_enrich: checkArticles.length,
          with_full_content: checkArticles.filter(a => a.has_full_content).length,
          with_extraction: checkArticles.filter(a => a.firecrawl_extracted).length,
          sample_titles: checkArticles.slice(0, 3).map(a => a.title?.substring(0, 50))
        });
        const enrichmentStart = Date.now();
        
        const enrichmentResponse = await fetch(
          'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/monitoring-stage-2-enrichment',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_KEY}` // Use service role key for internal calls
            },
            body: JSON.stringify({
              articles: filteredMonitoringData.findings || [],  // Pass relevance-filtered articles
              profile,
              organization_name: orgData.name || organization_name,
              coverage_report: coverageReport  // Pass the coverage report from Monitor Stage 1
            })
          }
        );
        
        if (!enrichmentResponse.ok) {
          const errorText = await enrichmentResponse.text();
          console.error('❌ Enrichment failed:', errorText);
          throw new Error(`Enrichment failed: ${enrichmentResponse.status}`);
        }
        
        enrichedData = await enrichmentResponse.json();
        console.log(`✅ Enrichment complete in ${Date.now() - enrichmentStart}ms:`, {
          success: enrichedData.success,
          articles_processed: enrichedData.articles_processed,
          events_extracted: enrichedData.statistics?.total_events,
          entities_found: enrichedData.statistics?.total_companies,
          topics_identified: enrichedData.extracted_data?.topics?.trending?.length
        });
        
        // CRITICAL: Log the actual structure of enrichedData
        console.log('🔍 ENRICHED DATA STRUCTURE:', {
          topLevelKeys: Object.keys(enrichedData),
          hasEnrichedArticles: !!enrichedData.enriched_articles,
          enrichedArticlesCount: enrichedData.enriched_articles?.length || 0,
          hasKnowledgeGraph: !!enrichedData.knowledge_graph,
          hasExecutiveSummary: !!enrichedData.executive_summary,
          executiveSummaryKeys: enrichedData.executive_summary ? Object.keys(enrichedData.executive_summary) : [],
          immediateActionsCount: enrichedData.executive_summary?.immediate_actions?.length || 0,
          opportunitiesCount: enrichedData.executive_summary?.strategic_opportunities?.length || 0,
          threatsCount: enrichedData.executive_summary?.competitive_threats?.length || 0
        });
      } else {
        // Use monitoring data as-is if skipping enrichment
        enrichedData = {
          organization: orgData,
          profile,
          articles: filteredMonitoringData?.findings || monitoring_data?.findings || [],
          extracted_data: {},
          statistics: {}
        };
        console.log('⏭️ Skipping enrichment, using raw monitoring data');
      }
      } // Close the else block from line 119
      
      // STEP 3: Executive Synthesis - Split into TWO parallel calls to avoid timeout
      console.log('🧠 Step 3: Creating executive synthesis (parallel processing)...');
      const synthesisStart = Date.now();
      
      // Check minimum data thresholds - handle both old and new formats
      const eventCount = (() => {
        // New format: check executive summary
        if (enrichedData.executive_summary?.immediate_actions) {
          return enrichedData.executive_summary.immediate_actions.length +
                 (enrichedData.executive_summary.strategic_opportunities?.length || 0);
        }
        // Old format fallback
        if (enrichedData.extracted_data?.events) {
          return Object.values(enrichedData.extracted_data.events).flat().length;
        }
        return 0;
      })();
      
      const entityCount = (() => {
        // New format: check knowledge graph
        if (enrichedData.knowledge_graph?.entities?.companies) {
          return enrichedData.knowledge_graph.entities.companies.length;
        }
        // Old format fallback
        return enrichedData.extracted_data?.entities?.companies?.length || 0;
      })();
      
      const topicCount = (() => {
        // New format: check clusters
        if (enrichedData.knowledge_graph?.clusters) {
          return enrichedData.knowledge_graph.clusters.length;
        }
        // Old format fallback
        const topics = enrichedData.extracted_data?.topics;
        if (!topics) return 0;
        const allTopics = new Set([
          ...(topics.trending || []),
          ...(topics.emerging || []),
          ...(topics.all || [])
        ]);
        return allTopics.size || topics.trending?.length || 0;
      })();
      
      const articleCount = enrichedData.enriched_articles?.length || 
                          enrichedData.articles?.length || 0;
      
      // Minimum thresholds for meaningful analysis
      const MIN_EVENTS = 3;  // Lowered from 5 - 3 events can still be meaningful
      const MIN_ENTITIES = 5;
      const MIN_TOPICS = 3;
      const MIN_ARTICLES = 5;
      
      // We need EITHER good articles OR good events/entities - not necessarily all
      const hasEnoughArticles = articleCount >= MIN_ARTICLES;
      const hasEnoughEntities = entityCount >= MIN_ENTITIES;
      const hasEnoughEvents = eventCount >= MIN_EVENTS;
      
      // If we have articles and entities, that's enough for analysis even without many topics
      const hasSufficientData = hasEnoughArticles && (hasEnoughEntities || hasEnoughEvents);
      
      if (!hasSufficientData) {
        console.warn(`⚠️ Insufficient data for synthesis:`, {
          events: `${eventCount}/${MIN_EVENTS}`,
          entities: `${entityCount}/${MIN_ENTITIES}`,
          topics: `${topicCount}/${MIN_TOPICS}`,
          articles: `${articleCount}/${MIN_ARTICLES}`
        });
        
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient data for meaningful analysis',
          details: {
            events_found: eventCount,
            entities_found: entityCount,
            topics_found: topicCount,
            articles_found: articleCount,
            minimum_required: {
              events: MIN_EVENTS,
              entities: MIN_ENTITIES,
              topics: MIN_TOPICS,
              articles: MIN_ARTICLES
            }
          },
          message: 'Not enough intelligence data was gathered. Please try again or check your search parameters.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // LOG WHAT WE GOT FROM ENRICHMENT
      console.log('🔍 ENRICHMENT RESPONSE STRUCTURE:', {
        has_organized_intelligence: !!enrichedData.organized_intelligence,
        organized_events: enrichedData.organized_intelligence?.events?.length || 0,
        organized_entities: enrichedData.organized_intelligence?.entities?.length || 0,
        organized_quotes: enrichedData.organized_intelligence?.quotes?.length || 0,
        has_extracted_data: !!enrichedData.extracted_data,
        extracted_events: enrichedData.extracted_data?.events?.length || 0,
        extracted_entities: enrichedData.extracted_data?.entities?.length || 0,
        top_level_keys: Object.keys(enrichedData).slice(0, 10)
      });

      // Pass the new enriched data format to synthesis
      const enrichedDataForSynthesis = {
        // NEW FORMAT - from AI-powered enrichment
        enriched_articles: enrichedData.enriched_articles || enrichedData.articles || [],
        knowledge_graph: enrichedData.knowledge_graph || {},
        executive_summary: enrichedData.executive_summary || {},

        // CRITICAL: Include organized_intelligence which has the actual extracted data
        organized_intelligence: enrichedData.organized_intelligence || {},

        // Legacy format fallback for compatibility
        extracted_data: enrichedData.extracted_data,
        statistics: enrichedData.statistics,
        profile: enrichedData.profile || profile,
        
        // Metadata
        monitoring_data: {
          total_articles: articleCount,
          articles_processed: enrichedData.articles_processed || 0,
          deep_analyzed: enrichedData.statistics?.deep_analyzed || 0,
          events_extracted: eventCount,
          entities_found: entityCount,
          topics_found: topicCount
        }
      };
      
      // Log EXACTLY what enrichment sent us
      console.log('📥📥📥 ORCHESTRATOR RECEIVED FROM ENRICHMENT:');
      console.log('  - organized_intelligence:', !!enrichedData.organized_intelligence);
      console.log('  - extracted_data:', !!enrichedData.extracted_data);
      console.log('  - enriched_articles:', enrichedData.enriched_articles?.length || 0);
      console.log('  - executive_summary:', !!enrichedData.executive_summary);
      console.log('  - knowledge_graph:', !!enrichedData.knowledge_graph);

      // Log the actual data counts
      const orgIntel = enrichedData.organized_intelligence || {};
      const extData = enrichedData.extracted_data || {};
      console.log('📊 DATA COUNTS FROM ENRICHMENT:');
      console.log('  - Events:', orgIntel.events?.length || extData.events?.length || 0);
      console.log('  - Entities:', orgIntel.entities?.length || extData.entities?.length || 0);
      console.log('  - Quotes:', orgIntel.quotes?.length || extData.quotes?.length || 0);
      console.log('  - Metrics:', orgIntel.metrics?.length || extData.metrics?.length || 0);
      console.log('  - Topic Clusters:', orgIntel.topic_clusters?.length || extData.topic_clusters?.length || 0);

      // Log sample of actual events
      const events = orgIntel.events || extData.events || [];
      if (events.length > 0) {
        console.log('🎯 SAMPLE EVENT FROM ENRICHMENT:', JSON.stringify(events[0], null, 2));
      }

      // Log what we're packaging for synthesis
      console.log('📤📤📤 ORCHESTRATOR SENDING TO SYNTHESIS:', {
        organized_intelligence: !!enrichedDataForSynthesis.organized_intelligence,
        extracted_data: !!enrichedDataForSynthesis.extracted_data,
        enriched_articles: enrichedDataForSynthesis.enriched_articles?.length || 0,
        eventsCount: events.length,
        entitiesCount: orgIntel.entities?.length || extData.entities?.length || 0,
        quotesCount: orgIntel.quotes?.length || extData.quotes?.length || 0,
        metricsCount: orgIntel.metrics?.length || extData.metrics?.length || 0
      });

      console.log(`📊 Data quality check passed - Making synthesis calls with:`, {
        events: eventCount,
        entities: entityCount,
        topics: topicCount,
        articles: articleCount
      });
      
      // CRITICAL DEBUG - WHAT ARE WE ACTUALLY SENDING?
      console.log('🚨 ACTUAL DATA BEING SENT TO SYNTHESIS:', {
        has_enriched_articles: !!enrichedDataForSynthesis.enriched_articles,
        enriched_articles_count: enrichedDataForSynthesis.enriched_articles?.length || 0,
        has_knowledge_graph: !!enrichedDataForSynthesis.knowledge_graph,
        has_executive_summary: !!enrichedDataForSynthesis.executive_summary,
        executive_summary_keys: Object.keys(enrichedDataForSynthesis.executive_summary || {}),
        immediate_actions: enrichedDataForSynthesis.executive_summary?.immediate_actions?.length || 0,
        opportunities: enrichedDataForSynthesis.executive_summary?.strategic_opportunities?.length || 0,
        threats: enrichedDataForSynthesis.executive_summary?.competitive_threats?.length || 0,
        has_organized_intelligence: !!enrichedDataForSynthesis.organized_intelligence,
        organized_events: enrichedDataForSynthesis.organized_intelligence?.events?.length || 0,
        organized_entities: enrichedDataForSynthesis.organized_intelligence?.entities?.length || 0,
        organized_quotes: enrichedDataForSynthesis.organized_intelligence?.quotes?.length || 0,
        organized_metrics: enrichedDataForSynthesis.organized_intelligence?.metrics?.length || 0,
        has_extracted_data: !!enrichedDataForSynthesis.extracted_data,
        extracted_data_keys: Object.keys(enrichedDataForSynthesis.extracted_data || {})
      });
      
      // REAL-TIME SYNTHESIS - Simple call for UI display
      console.log('🎯 Calling real-time synthesis for UI...');
      const synthesisResponse = await callStage(
        'Real-Time Synthesis',
        'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/real-time-synthesis',
        {
          enriched_data: enrichedDataForSynthesis,
          organization_name: orgData.name || organization_name,
          time_window: requestData.time_window || '6hours',
          profile: profile
        }
      );
      
      // Process single synthesis response
      let synthesisResult = null;
      if (synthesisResponse.error) {
        console.error('❌ Synthesis failed:', synthesisResponse.error);
        // Don't throw - continue with null synthesis
        executiveSynthesis = null;
      } else if (synthesisResponse.content?.[0]?.type === 'error') {
        console.error('❌ Synthesis returned error:', synthesisResponse.content[0].message);
        executiveSynthesis = null;
      } else {
        synthesisResult = synthesisResponse;
        // Keep the full structure - frontend expects { synthesis: {...}, metadata: {...} }
        executiveSynthesis = synthesisResult;
      }
      
      // Parse the synthesis result - handle both MCP format and direct response
      if (synthesisResult && synthesisResult.content?.[0]?.type === 'text') {
        try {
          executiveSynthesis = JSON.parse(synthesisResult.content[0].text);
          console.log('📝 Parsed MCP synthesis response');
        } catch (e) {
          console.error('Failed to parse synthesis JSON:', e);
          executiveSynthesis = { synthesis: synthesisResult.content[0].text };
        }
      } else if (synthesisResult && !synthesisResult.error) {
        // Direct response from timeout wrapper
        executiveSynthesis = synthesisResult;
        console.log('📝 Using direct synthesis response');
      } else {
        executiveSynthesis = null;
        console.log('⚠️ No valid synthesis result');
      }
      
      console.log('✅ Synthesis complete - checking structure:', {
        hasSynthesis: !!executiveSynthesis,
        isObject: typeof executiveSynthesis === 'object',
        keys: executiveSynthesis ? Object.keys(executiveSynthesis).slice(0, 5) : 'null'
      });
      
      console.log(`✅ PR/Positioning synthesis complete in ${Date.now() - synthesisStart}ms`);
      
      // STEP 4: Opportunity Detection - Two-stage process
      if (!skip_opportunity_engine) {
        console.log('🎯 Step 4: Opportunity Detection - Finding actionable opportunities...');
        const opportunityStart = Date.now();
        
        try {
          // STAGE 1: Call MCP-Opportunity-Detector for signal-based detection
          console.log('📡 Stage 1: Detecting opportunity signals...');
          console.log('   Data being sent to opportunity detector:', {
            has_enriched_data: !!enrichedData,
            events_count: enrichedData?.extracted_data?.events?.length || 0,
            entities_count: enrichedData?.extracted_data?.entities?.length || 0,
            has_synthesis: !!executiveSynthesis,
            has_profile: !!profile
          });
          
          const detectorResponse = await callStage(
            'Opportunity Detector',
            'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/mcp-opportunity-detector-v2',
            {
              organization_id: orgData.name || organization_name || organization_id || '1',  // Use org name as unique ID
              organization_name: orgData.name || organization_name,
              enriched_data: enrichedData,
              executive_synthesis: executiveSynthesis, // Optional context
              profile: profile,
              social_signals: actualMonitoringData?.social_signals || []
              // Removed coverage_report - detector should work off enriched data
            }
          );

          console.log('🔍 Detector response check:', {
            has_opportunities: !!detectorResponse.opportunities,
            opportunities_count: detectorResponse.opportunities?.length || 0,
            has_error: !!detectorResponse.error,
            response_keys: Object.keys(detectorResponse || {})
          });

          let detectedOpportunities = [];
          // Check for opportunities even if there's an error (partial success)
          if (detectorResponse.opportunities && detectorResponse.opportunities.length > 0) {
            detectedOpportunities = detectorResponse.opportunities;
            console.log(`✅ Detected ${detectedOpportunities.length} opportunities from signals`);
          } else if (!detectorResponse.error) {
            // Fallback to old logic if no error
            const detectorResult = detectorResponse;
            detectedOpportunities = detectorResult.opportunities || [];
            console.log(`✅ Detected ${detectedOpportunities.length} opportunities from signals`);
          } else {
            console.log('⚠️ Opportunity detector returned error:', detectorResponse.error);
          }

          // STAGE 2: Call Opportunity-Orchestrator V2 to enhance into strategic playbooks
          // Continue even if detector had an error, as long as we have some opportunities
          if (detectedOpportunities.length > 0) {
            console.log('🎨 Stage 2: Transforming into strategic playbooks with V2...');
            const opportunityResponse = await fetch(
            'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/opportunity-orchestrator-v2',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`
              },
              body: JSON.stringify({
                organization_id: orgData.name || organization_name || organization_id || '1',
                organization_name: orgData.name || organization_name,
                
                // Pass detected opportunities for enhancement
                detected_opportunities: detectedOpportunities,
                
                // Pass enriched data for context
                enriched_data: enrichedData,
                
                // Pass synthesis for strategic context
                executive_synthesis: executiveSynthesis,
                
                profile: profile,
                
                // Removed coverage_report - orchestrator should work off enriched data
                
                // Detection config
                detection_config: {
                  min_score: 70,
                  max_opportunities: 10,
                  focus_areas: ['crisis', 'trending', 'competitive', 'regulatory', 'milestone']
                }
              })
            }
          );
          
          if (opportunityResponse.ok) {
            opportunityEngineResult = await opportunityResponse.json();
            console.log(`✅ Opportunity Detection complete in ${Date.now() - opportunityStart}ms:`, {
              success: opportunityEngineResult.success,
              total_opportunities: opportunityEngineResult.opportunities?.length || 0,
              high_urgency: opportunityEngineResult.summary?.high_urgency || 0,
              by_category: opportunityEngineResult.summary?.by_category || {},
              average_score: opportunityEngineResult.summary?.average_score || 0
            });
            
            // Log sample opportunity for debugging
            if (opportunityEngineResult.opportunities?.length > 0) {
              const sampleOpp = opportunityEngineResult.opportunities[0];
              console.log('💡 Sample enhanced opportunity:', {
                title: sampleOpp.title,
                urgency: sampleOpp.urgency,
                campaign_name: sampleOpp.campaign_name,
                creative_approach: sampleOpp.creative_approach?.substring(0, 50),
                has_playbook_campaign: !!sampleOpp.playbook?.campaign_name
              });

              // Update database with creative enhancements
              console.log('💾 Updating opportunities with creative enhancements...');
              try {
                const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
                const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

                // Update each opportunity with its creative fields
                for (const enhancedOpp of opportunityEngineResult.opportunities) {
                  // Find matching opportunity by title (since we don't have the ID)
                  // MUST use the EXACT same organization_id that detector uses!
                  const searchOrgId = orgData.name || organization_name || organization_id || '1';  // Match line 612 exactly!
                  console.log(`🔍 Looking for opportunity "${enhancedOpp.title}" with org_id: "${searchOrgId}"`);

                  const { data: existing } = await supabase
                    .from('opportunities')
                    .select('id, data')
                    .eq('organization_id', searchOrgId)
                    .eq('title', enhancedOpp.title)
                    .single();

                  if (existing) {
                    // Merge creative fields into existing data
                    const updatedData = {
                      ...existing.data,
                      campaign_name: enhancedOpp.campaign_name,
                      creative_approach: enhancedOpp.creative_approach,
                      playbook: {
                        ...existing.data?.playbook,
                        campaign_name: enhancedOpp.campaign_name,
                        creative_approach: enhancedOpp.creative_approach
                      }
                    };

                    const { error } = await supabase
                      .from('opportunities')
                      .update({ data: updatedData })
                      .eq('id', existing.id);

                    if (error) {
                      console.error('Error updating opportunity with creative fields:', error);
                    } else {
                      console.log(`✅ Updated opportunity "${enhancedOpp.title}" with campaign: "${enhancedOpp.campaign_name}"`);
                    }
                  } else {
                    console.log(`⚠️ Could not find opportunity "${enhancedOpp.title}" in database to update`);
                  }
                }
                console.log('✅ Creative enhancements saved to database');
              } catch (updateError) {
                console.error('Error updating opportunities:', updateError);
              }
            }
          } else {
            const errorText = await opportunityResponse.text();
            console.warn('⚠️ Opportunity engine call failed:', errorText);
          }
          } else {
            console.log('📊 No opportunities detected to enhance, skipping Stage 2');
          }
        } catch (oppError) {
          console.warn('⚠️ Opportunity engine error, continuing:', oppError.message);
        }
      } else {
        console.log('⏭️ Skipping opportunity engine as requested');
      }
      
      // STEP 4: Store intelligence in persistence (only if synthesis succeeded)
      if (executiveSynthesis) {
        console.log('💾 Step 4: Persisting intelligence...');
        try {
          const persistResponse = await fetch(
            'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}` // Use service role key for internal calls
              },
              body: JSON.stringify({
                action: 'save',
                organization_id: orgData.name,
                organization_name: orgData.name,
                stage: 'executive_synthesis',
                data_type: 'unified_intelligence',
                content: executiveSynthesis,
                metadata: {
                  articles_analyzed: enrichedData?.articles_processed || 0,
                  events_detected: enrichedData?.statistics?.total_events || 0,
                  opportunities_found: executiveSynthesis?.immediate_opportunities?.length || 0,
                  threats_identified: executiveSynthesis?.critical_threats?.length || 0,
                  timestamp: new Date().toISOString()
                }
              })
            }
          );
          
          if (persistResponse.ok) {
            console.log('✅ Intelligence persisted successfully');
          } else {
            console.warn('⚠️ Failed to persist intelligence');
          }
        } catch (persistError) {
          console.warn('⚠️ Persistence error:', persistError.message);
        }
      } else {
        console.log('⚠️ Skipping persistence - no synthesis to save');
      }
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ ORCHESTRATION COMPLETE in ${totalTime}ms`);
      
      // REMOVED broken database save - table doesn't exist
      
      // Return comprehensive results - wrap in try-catch to ensure response
      try {
        const responseData = {
        success: true,
        organization: orgData.name,
        timestamp: new Date().toISOString(),
        
        // Executive synthesis is the main output
        executive_synthesis: executiveSynthesis,
        
        // Include opportunity engine results if available
        opportunities: opportunityEngineResult?.opportunities || [],
        
        // Processing statistics
        statistics: {
          articles_analyzed: enrichedData?.articles_processed || 0,
          events_extracted: enrichedData?.statistics?.total_events || 0,
          entities_found: enrichedData?.statistics?.total_companies || 0,
          topics_identified: enrichedData?.extracted_data?.topics?.trending?.length || 0,
          immediate_opportunities: executiveSynthesis?.immediate_opportunities?.length || 
                                   executiveSynthesis?.synthesis?.breaking_developments?.length || 0,
          critical_threats: executiveSynthesis?.critical_threats?.length || 
                           executiveSynthesis?.synthesis?.regulatory_updates?.length || 0,
          processing_time_ms: totalTime
        },
        
        // Include enriched data for debugging
        enriched_data: enrichedData?.extracted_data || {},
        
        // Service metadata
        service: 'Real-Time Orchestrator',
        pipeline: {
          enrichment: !skip_enrichment,
          synthesis: true,
          opportunity_engine: !skip_opportunity_engine && !!opportunityEngineResult
        }
      };
        
        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (respError) {
        console.error('❌ Error building response:', respError);
        // Return a minimal but valid response
        return new Response(JSON.stringify({
          success: true,
          message: 'Processing complete but response formatting failed',
          organization: orgData?.name || organization_name,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
    } catch (error: any) {
      console.error('❌ Orchestration error:', error);
      
      // Return partial results if available
      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Orchestration failed',
        partial_results: {
          enriched_data: enrichedData?.extracted_data || null,
          executive_synthesis: executiveSynthesis || null,
          opportunities: opportunityEngineResult?.opportunities || []
        },
        service: 'Real-Time Orchestrator',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    } catch (error: any) {
      console.error('❌ Request processing error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Request processing failed',
        service: 'Real-Time Orchestrator',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    })();

    // Return the processing result directly without timeout race
    return processingPromise;
  } catch (error: any) {
    // Catch any error that happens outside the promise
    console.error('❌ Fatal orchestrator error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Fatal orchestrator error',
      service: 'Real-Time Orchestrator',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});// Force redeploy: 1757524184
// AGGRESSIVE EXTRACTION REDEPLOY: 2025-01-10 17:21 PST
