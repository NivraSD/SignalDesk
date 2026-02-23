import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface RouterRequest {
  organization_id: string;
  organization_name: string;
  time_window?: '1hour' | '6hours' | '24hours';
  route_to_opportunities?: boolean;
  route_to_crisis?: boolean;
  route_to_predictions?: boolean;
  use_firecrawl_observer?: boolean; // If true, use firecrawl-observer results instead of search
}

/**
 * Real-Time Alert Router
 *
 * Simplified architecture:
 * 1. Get results from niv-fireplexity-monitor-v2 (or firecrawl-observer)
 * 2. Route to 3 detector functions IN PARALLEL
 * 3. Return counts to frontend
 *
 * No intermediate enrichment/synthesis needed - detectors are smart enough!
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const {
      organization_id,
      organization_name,
      time_window = '6hours',
      route_to_opportunities = false,
      route_to_crisis = true, // Default true - always check for crises
      route_to_predictions = true,
      use_firecrawl_observer = false
    }: RouterRequest = await req.json();

    console.log('🚀 Real-Time Alert Router');
    console.log(`   Organization: ${organization_name}`);
    console.log(`   Time window: ${time_window}`);
    console.log(`   Source: ${use_firecrawl_observer ? 'firecrawl-observer' : 'niv-fireplexity-monitor-v2'}`);
    console.log(`   Opportunities: ${route_to_opportunities}`);
    console.log(`   Crisis detection: ${route_to_crisis}`);
    console.log(`   Predictions: ${route_to_predictions}`);

    const startTime = Date.now();

    // Get organization UUID for database operations
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', organization_name)
      .single();

    // CRITICAL: Always use UUID, never fall back to name string
    const organizationUuid = organization_id || orgData?.id;
    if (!organizationUuid) {
      throw new Error(`Organization '${organization_name}' not found in database`);
    }

    // Get organization profile from organizations.company_profile (NOT organization_profiles)
    let { data: orgProfileData } = await supabase
      .from('organizations')
      .select('company_profile')
      .eq('id', organizationUuid)
      .single();

    // If no profile exists, run mcp-discovery first
    if (!orgProfileData || !orgProfileData.company_profile) {
      console.log('⚠️ No organization profile found. Running mcp-discovery first...');

      const discoveryResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/mcp-discovery`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({
            organization_name,
            organization_id: organizationUuid
          })
        }
      );

      if (!discoveryResponse.ok) {
        throw new Error(`Discovery failed: ${discoveryResponse.status}`);
      }

      const discoveryData = await discoveryResponse.json();
      console.log(`✅ Discovery completed for ${organization_name}`);

      // Fetch the profile again after discovery
      const { data: newProfileData } = await supabase
        .from('organizations')
        .select('company_profile')
        .eq('id', organizationUuid)
        .single();

      orgProfileData = newProfileData;
    }

    const profile = orgProfileData?.company_profile || {};

    // ===== STEP 1: Get Search Results =====
    let searchResults = [];

    if (use_firecrawl_observer) {
      console.log('\n📡 Step 1: Getting results from firecrawl-observer...');

      // Get latest firecrawl-observer results from database
      const { data: observerData } = await supabase
        .from('firecrawl_observer_results')
        .select('*')
        .eq('organization_id', organization_name)
        .order('created_at', { ascending: false })
        .limit(20); // Get top 20 most recent

      if (observerData && observerData.length > 0) {
        searchResults = observerData.map(r => ({
          title: r.title,
          content: r.content || r.summary,
          url: r.url,
          source: r.source,
          published_at: r.published_at,
          relevance_score: r.relevance_score || 80
        }));
        console.log(`✅ Found ${searchResults.length} results from firecrawl-observer`);
      } else {
        console.log('⚠️ No recent firecrawl-observer results found');
      }
    } else {
      console.log('\n📡 Step 1: Calling niv-fireplexity-monitor-v2 (Firecrawl + ALL intelligence targets)...');

      const searchResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/niv-fireplexity-monitor-v2`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({
            organization_id: organizationUuid,  // FIXED: Use UUID not name
            organization_name: organization_name,
            recency_window: time_window === '1hour' ? '1hour' :
                           time_window === '6hours' ? '6hours' : '24hours',
            max_results: 50,
            skip_deduplication: false
          })
        }
      );

      if (!searchResponse.ok) {
        throw new Error(`Monitor failed: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      console.log(`✅ Found ${searchData.total_articles || searchData.results_found} results from Firecrawl monitor (${searchData.metadata?.execution_time_ms || searchData.execution_time_ms}ms)`);

      // Articles are now returned directly in the response
      searchResults = searchData.articles || [];
    }

    if (searchResults.length === 0) {
      console.log('⚠️ No search results found');
      console.log('   This usually means:');
      console.log('   1. No recent articles match the organization');
      console.log('   2. mcp-discovery needs to be run to populate search keywords');
      console.log('   3. The organization profile may need better keywords/competitors');

      return new Response(JSON.stringify({
        success: true,
        message: 'No new articles found in time window. Consider running mcp-discovery to improve search targeting.',
        time_window,
        articles_analyzed: 0,
        opportunities_count: 0,
        crises_count: 0,
        predictions_count: 0,
        recommendations: [
          'Run mcp-discovery to populate organization profile with better search keywords',
          'Check that the organization profile has competitors and topics defined',
          'Try a longer time window (24hours instead of 6hours)'
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use all results from monitor (already filtered and scored)
    const topResults = searchResults;
    console.log(`\n🎯 Processing ${topResults.length} articles`);

    // ===== STEP 2: Route to Detectors IN PARALLEL =====
    console.log('\n⚡ Step 2: Routing to detectors in parallel...');

    const detectionPromises = [];

    // TRACK A: Opportunities
    if (route_to_opportunities) {
      console.log('   🎯 Routing to opportunity detector...');

      detectionPromises.push(
        fetch(`${SUPABASE_URL}/functions/v1/mcp-opportunity-detector-v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({
            organization_id: organizationUuid,
            organization_name,
            search_results: topResults,
            profile
          })
        })
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            console.log(`   ✅ Opportunity detector: ${data.opportunities?.length || 0} opportunities detected`);

            // If opportunities detected, send to orchestrator for playbook creation
            if (data.opportunities && data.opportunities.length > 0) {
              console.log(`   🎯 Sending ${data.opportunities.length} opportunities to orchestrator...`);

              try {
                const orchestratorResponse = await fetch(`${SUPABASE_URL}/functions/v1/opportunity-orchestrator-v2`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                  },
                  body: JSON.stringify({
                    organization_id: organizationUuid,
                    organization_name,
                    detected_opportunities: data.opportunities,
                    profile
                  })
                });

                if (orchestratorResponse.ok) {
                  const orchestratedData = await orchestratorResponse.json();
                  console.log(`   ✅ Orchestrator: ${orchestratedData.opportunities?.length || 0} executable opportunities created`);
                  return { type: 'opportunities', data: orchestratedData };
                } else {
                  console.warn(`   ⚠️ Orchestrator returned ${orchestratorResponse.status}, using detector results`);
                  return { type: 'opportunities', data };
                }
              } catch (orchError) {
                console.error(`   ❌ Orchestrator error: ${orchError.message}, using detector results`);
                return { type: 'opportunities', data };
              }
            }

            return { type: 'opportunities', data };
          }
          console.warn(`   ⚠️ Opportunity detector returned ${res.status}`);
          return { type: 'opportunities', data: { opportunities: [] } };
        })
        .catch(error => {
          console.error(`   ❌ Opportunity detector error: ${error.message}`);
          return { type: 'opportunities', data: { opportunities: [] } };
        })
      );
    }

    // TRACK B: Crisis Detection
    if (route_to_crisis) {
      console.log('   🚨 Routing to crisis detector...');

      // ALWAYS route to crisis detector - let AI decide if there's a crisis
      // Don't pre-filter based on keywords - that's too limiting
      detectionPromises.push(
          fetch(`${SUPABASE_URL}/functions/v1/mcp-crisis`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({
              tool: 'detect_crisis_signals',
              arguments: {
                sources: ['news', 'social'],
                keywords: [organization_name],
                sensitivity: 'high',
                timeWindow: time_window,
                articles: topResults, // Pass actual articles to analyze
                organization_name,
                organization_id: organizationUuid, // Required for mcp-crisis to save to crisis_events
                profile
              }
            })
          })
          .then(async res => {
            if (res.ok) {
              const data = await res.json();

              // Extract crisis signals from response
              const signalsDetected = data.signalsDetected || 0;
              const riskLevel = data.riskLevel || 0;

              // mcp-crisis handles saving to crisis_events table (if riskLevel >= 5)
              // We just report the results back
              if (riskLevel >= 5) {
                console.log(`   ✅ Crisis detector: Risk level ${riskLevel}/10 - ${data.crisis_action === 'created' ? 'new crisis event created' : data.crisis_action === 'updated' ? 'existing crisis updated' : 'signals detected'}`);
                return { type: 'crises', data: { crises: [data], crises_count: 1, crisis_event_id: data.crisis_event_id } };
              }

              console.log(`   ℹ️  Crisis detector: Low risk (level ${riskLevel})`);
              return { type: 'crises', data: { crises: [], crises_count: 0 } };
            }
            console.warn(`   ⚠️ Crisis detector returned ${res.status}`);
            return { type: 'crises', data: { crises: [], crises_count: 0 } };
          })
          .catch(error => {
            console.error(`   ❌ Crisis detector error: ${error.message}`);
            return { type: 'crises', data: { crises: [], crises_count: 0 } };
          })
        );
    }

    // TRACK C: Predictions (Real-Time Forward-Looking Analysis)
    if (route_to_predictions) {
      console.log('   🔮 Routing to real-time prediction generator...');

      detectionPromises.push(
        fetch(`${SUPABASE_URL}/functions/v1/real-time-prediction-generator`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({
            organization_id: organizationUuid,
            organization_name,
            articles: topResults, // All articles for context
            profile
          })
        })
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            console.log(`   ✅ Prediction generator: ${data.predictions_generated || 0} predictions (analyzing ${data.data_analyzed?.current_articles || 0} current + ${data.data_analyzed?.historical_articles || 0} historical articles)`);
            return { type: 'predictions', data };
          }
          console.warn(`   ⚠️ Prediction generator returned ${res.status}`);
          return { type: 'predictions', data: { predictions: [], predictions_generated: 0 } };
        })
        .catch(error => {
          console.error(`   ❌ Prediction generator error: ${error.message}`);
          return { type: 'predictions', data: { predictions: [], predictions_generated: 0 } };
        })
      );
    }

    // Fire detectors in background - they save to DB themselves
    console.log(`\n🚀 Running ${detectionPromises.length} detectors in parallel (fire-and-forget)...`);

    // Don't wait for detectors - let them run in background
    Promise.all(detectionPromises)
      .then(() => console.log(`✅ All detectors completed`))
      .catch(err => console.error('⚠️ Detector error:', err));

    const totalTime = Date.now() - startTime;
    console.log(`\n✅ Real-time alert routing complete in ${totalTime}ms`);
    console.log(`   📊 Detectors running in background. Results will be saved to database.`);

    return new Response(JSON.stringify({
      success: true,
      time_window,
      execution_time_ms: totalTime,

      // Article stats
      articles_analyzed: topResults.length,
      total_articles_found: searchResults.length,

      // Detectors are running in background
      detectors_running: detectionPromises.length,
      message: 'Detectors running in background. Results will be saved to database.',

      // Metadata
      source: use_firecrawl_observer ? 'firecrawl-observer' : 'niv-fireplexity-monitor (RSS)'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Real-time alert router error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
