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
 * 1. Get results from niv-fireplexity-monitor (or firecrawl-observer)
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
    console.log(`   Source: ${use_firecrawl_observer ? 'firecrawl-observer' : 'niv-fireplexity-monitor'}`);
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

    const organizationUuid = organization_id || orgData?.id || organization_name;

    // Get organization profile for detectors
    let { data: profileData } = await supabase
      .from('organization_profiles')
      .select('profile_data')
      .eq('organization_name', organization_name)
      .single();

    // If no profile exists, run mcp-discovery first
    if (!profileData) {
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
        .from('organization_profiles')
        .select('profile_data')
        .eq('organization_name', organization_name)
        .single();

      profileData = newProfileData;
    }

    const profile = profileData?.profile_data || {};

    // ===== STEP 1: Get Search Results =====
    let searchResults = [];
    let alerts = [];

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
      console.log('\n📡 Step 1: Calling niv-fireplexity-monitor...');

      const searchResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/niv-fireplexity-monitor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({
            organization_id: organization_name,
            recency_window: time_window === '1hour' ? '30min' :
                           time_window === '6hours' ? '6hours' : '24hours',
            relevance_threshold: 60,
            route_to_opportunity_engine: false // We'll handle routing ourselves
          })
        }
      );

      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      console.log(`✅ Found ${searchData.results_found} results from search`);

      // Get the actual results from database
      const { data: monitoringData } = await supabase
        .from('fireplexity_monitoring')
        .select('results')
        .eq('organization_id', organization_name)
        .order('executed_at', { ascending: false })
        .limit(1)
        .single();

      searchResults = monitoringData?.results || [];

      // Get alerts if available
      const { data: alertsData } = await supabase
        .from('real_time_alerts')
        .select('*')
        .eq('organization_id', organization_name)
        .order('detected_at', { ascending: false })
        .limit(20);

      alerts = alertsData || [];
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

    // Take top 20 results for processing
    const topResults = searchResults.slice(0, 20);
    console.log(`\n🎯 Processing top ${topResults.length} results`);

    // ===== STEP 2: Route to Detectors IN PARALLEL =====
    console.log('\n⚡ Step 2: Routing to detectors in parallel...');

    const detectionPromises = [];

    // TRACK A: Opportunities
    if (route_to_opportunities) {
      console.log('   🎯 Routing to opportunity detector...');

      detectionPromises.push(
        fetch(`${SUPABASE_URL}/functions/v1/mcp-opportunity-detector`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({
            organization_id: organizationUuid,
            organization_name,
            search_results: topResults,
            alerts: alerts.filter(a => a.alert_type === 'opportunity'),
            profile
          })
        })
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            console.log(`   ✅ Opportunity detector: ${data.opportunities?.length || 0} opportunities`);
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

      const crisisAlerts = alerts.filter(a => a.alert_type === 'crisis');

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
                keywords: [organization_name, ...crisisAlerts.map(a => a.title).filter(Boolean)],
                sensitivity: 'high',
                timeWindow: time_window
              }
            })
          })
          .then(async res => {
            if (res.ok) {
              const data = await res.json();

              // Extract crisis signals from response
              const signalsDetected = data.signalsDetected || 0;
              const riskLevel = data.riskLevel || 0;
              const warningSignals = data.warningSignals || [];

              // Only create crisis events if risk level is high enough
              if (riskLevel >= 6) {
                await supabase.from('crisis_events').insert({
                  organization_id: organizationUuid,
                  title: `Crisis Alert: ${organization_name}`,
                  description: `Crisis signals detected: ${warningSignals.join(', ')}`,
                  severity: riskLevel >= 8 ? 'critical' : 'high',
                  crisis_type: 'intelligence_alert',
                  status: 'monitoring',
                  started_at: new Date().toISOString(),
                  trigger_source: 'real-time-alert-router',
                  trigger_data: {
                    alerts: crisisAlerts.map(a => ({ title: a.title, url: a.url })),
                    articles: topResults.slice(0, 3).map(r => ({ title: r.title, url: r.url })),
                    signals_detected: signalsDetected,
                    risk_level: riskLevel,
                    warning_signals: warningSignals
                  },
                  metadata: {
                    time_window,
                    detected_by: 'real-time-alert-router'
                  }
                });

                console.log(`   ✅ Crisis detector: High risk detected (level ${riskLevel})`);
                return { type: 'crises', data: { crises: [data], crises_count: 1 } };
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

    // TRACK C: Predictions
    if (route_to_predictions) {
      console.log('   🔮 Routing to prediction detector...');

      detectionPromises.push(
        fetch(`${SUPABASE_URL}/functions/v1/stakeholder-pattern-detector`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({
            organizationId: organizationUuid,
            runNow: true,
            recentArticles: topResults.slice(0, 10) // Give it context from recent articles
          })
        })
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            console.log(`   ✅ Prediction detector: ${data.predictions_generated || 0} predictions`);
            return { type: 'predictions', data };
          }
          console.warn(`   ⚠️ Prediction detector returned ${res.status}`);
          return { type: 'predictions', data: { predictions: [], predictions_generated: 0 } };
        })
        .catch(error => {
          console.error(`   ❌ Prediction detector error: ${error.message}`);
          return { type: 'predictions', data: { predictions: [], predictions_generated: 0 } };
        })
      );
    }

    // DON'T wait for detectors - they save to database themselves
    // Just fire them off and return immediately
    // Frontend will poll the database for results
    console.log(`\n🚀 Detectors running in background (${detectionPromises.length} total)`);

    // Fire and forget - detectors will save results to database
    Promise.all(detectionPromises).catch(err => {
      console.error('⚠️ Background detector error (non-blocking):', err);
    });

    // Return immediately with status
    const opportunityResult = { opportunities: [], status: route_to_opportunities ? 'processing' : 'disabled' };
    const crisisResult = { crises: [], crises_count: 0, status: route_to_crisis ? 'processing' : 'disabled' };
    const predictionResult = { predictions: [], predictions_generated: 0, status: route_to_predictions ? 'processing' : 'disabled' };

    const totalTime = Date.now() - startTime;
    console.log(`\n✅ Real-time alert routing complete in ${totalTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      time_window,
      execution_time_ms: totalTime,

      // Article stats
      articles_analyzed: topResults.length,
      total_articles_found: searchResults.length,

      // Results
      opportunities: opportunityResult.opportunities || [],
      opportunities_count: opportunityResult.opportunities?.length || 0,

      crises: crisisResult.crises || [],
      crises_count: crisisResult.crises_count || 0,
      critical_crises_count: crisisResult.crises?.filter(c =>
        c.severity === 'critical' || c.severity === 'high'
      ).length || 0,

      predictions: predictionResult.predictions || [],
      predictions_count: predictionResult.predictions_generated || 0,

      // Metadata
      source: use_firecrawl_observer ? 'firecrawl-observer' : 'niv-fireplexity-monitor',
      alerts_found: alerts.length
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
