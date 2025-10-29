import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.16.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

interface Request {
  organization_name: string;
  organization_id?: string;
  time_window?: '1hour' | '6hours' | '24hours';
  route_to_opportunities?: boolean;
  route_to_crisis?: boolean; // Default: true (always check for crises)
  route_to_predictions?: boolean; // Default: true (generate stakeholder predictions)
}

/**
 * Real-Time Intelligence Orchestrator
 *
 * Intelligence-quality real-time monitoring using Claude AI
 * Reuses existing pipeline components in a faster configuration
 *
 * Flow:
 * 1. Fireplexity search (company-specific queries)
 * 2. Date filter + deduplication
 * 3. Claude assessment (filter noise, extract key facts)
 * 4. Event extraction (reuse monitoring-stage-2-enrichment)
 * 5. Real-time synthesis (focused breaking news brief)
 * 6a. Optional: Opportunity detection (detector → orchestrator-v2)
 * 6b. Optional: Crisis detection (mcp-crisis)
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const {
      organization_name,
      organization_id,
      time_window = '6hours',
      route_to_opportunities = false,
      route_to_crisis = true, // Default to true - crisis detection should always run
      route_to_predictions = true // Default to true - predictions should always run
    }: Request = await req.json();

    console.log('🚀 Real-Time Intelligence Orchestrator');
    console.log(`   Organization: ${organization_name}`);
    console.log(`   Time window: ${time_window}`);
    console.log(`   Opportunities: ${route_to_opportunities}`);
    console.log(`   Crisis detection: ${route_to_crisis}`);
    console.log(`   Predictions: ${route_to_predictions}`);

    const startTime = Date.now();

    // ===== STAGE 1: Fireplexity Search =====
    console.log('\n📡 Stage 1: Executing Fireplexity searches...');

    // Get organization profile from mcp-discovery
    const { data: profileData } = await supabase
      .from('organization_profiles')
      .select('profile_data')
      .eq('organization_name', organization_name)
      .single();

    if (!profileData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Organization profile not found. Please run mcp-discovery first.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const profile = profileData.profile_data;

    // Call niv-fireplexity-monitor-v2 for comprehensive monitoring of ALL intelligence targets
    // V2 uses Firecrawl and queries intelligence_targets table directly
    const searchResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/niv-fireplexity-monitor-v2`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          organization_id: organization_name,
          organization_name: organization_name,
          recency_window: time_window === '1hour' ? '1hour' :
                          time_window === '6hours' ? '6hours' : '24hours',
          max_results: 50,
          skip_deduplication: false
        })
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Fireplexity search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log(`✅ Found ${searchData.results_found} articles`);

    // Get the raw results from the search
    // Note: We need to get the actual article data, not just the summary
    const { data: monitoringData } = await supabase
      .from('fireplexity_monitoring')
      .select('results')
      .eq('organization_id', organization_name)
      .order('executed_at', { ascending: false })
      .limit(1)
      .single();

    const rawResults = monitoringData?.results || [];
    console.log(`📊 Retrieved ${rawResults.length} raw results from database`);

    if (rawResults.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No new articles found in time window',
        time_window,
        articles_analyzed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ===== STAGE 2: Date Filter & Deduplication =====
    console.log('\n📅 Stage 2: Filtering by date and deduplication...');

    const timeWindowMs = time_window === '1hour' ? 3600000 :
                         time_window === '6hours' ? 21600000 : 86400000;
    const cutoffTime = new Date(Date.now() - timeWindowMs);

    // Filter by actual publish date
    // If no date available, include it (assume recent for testing)
    const recentResults = rawResults.filter(r => {
      const publishDateStr = r.published || r.date || r.published_at;
      if (!publishDateStr) {
        return true; // Include articles without dates
      }
      const publishDate = new Date(publishDateStr);
      return publishDate > cutoffTime;
    });

    console.log(`   Recent (${time_window}): ${recentResults.length}/${rawResults.length}`);

    // Check against seen_articles table
    const articleUrls = recentResults.map(r => r.url).filter(Boolean);
    const { data: seenArticles } = await supabase
      .from('seen_articles')
      .select('url')
      .eq('organization_id', organization_name)
      .in('url', articleUrls)
      .gte('seen_at', cutoffTime.toISOString());

    const seenUrls = new Set(seenArticles?.map(s => s.url) || []);
    const newResults = recentResults.filter(r => !seenUrls.has(r.url));

    console.log(`   New articles: ${newResults.length} (${seenUrls.size} already seen)`);

    if (newResults.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No new articles since last check',
        time_window,
        articles_analyzed: recentResults.length,
        new_articles: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ===== STAGE 3: Claude Assessment & Filtering =====
    console.log(`\n🤖 Stage 3: Claude assessment of ${newResults.length} articles...`);

    const assessmentPrompt = `You are analyzing real-time breaking news for ${organization_name}.

TODAY'S DATE: ${new Date().toISOString().split('T')[0]}
TIME WINDOW: Last ${time_window}

ARTICLES FOUND (${newResults.length} total):
${newResults.map((a, i) => {
  const pubDate = new Date(a.published || a.date || a.published_at || 0);
  const hoursAgo = Math.round((Date.now() - pubDate.getTime()) / 3600000);
  return `${i+1}. "${a.title}" - ${a.source || 'Unknown'} (${hoursAgo}h ago)
   ${a.content?.substring(0, 200) || a.snippet?.substring(0, 200) || ''}...`;
}).join('\n\n')}

Tasks:
1. Which articles are TRULY breaking news relevant to ${organization_name}?
2. Filter out: old news resurfaced, spam, unrelated content, HTML garbage
3. For relevant articles, extract the key fact in 1 sentence
4. Categorize as: crisis, opportunity, competitive, regulatory, or general

Return JSON:
{
  "breaking_news": [
    {
      "index": 1,
      "relevance": "high|medium",
      "key_fact": "One sentence capturing the essence",
      "category": "crisis|opportunity|competitive|regulatory|general",
      "urgency": "immediate|this_week|informational",
      "confidence": 85
    }
  ],
  "noise": [2, 5, 8],
  "context": "Brief summary of what's happening overall (2-3 sentences)"
}`;

    const assessmentResponse = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: assessmentPrompt
      }]
    });

    const assessmentText = assessmentResponse.content[0].type === 'text'
      ? assessmentResponse.content[0].text
      : '{}';

    // Extract JSON from response (Claude sometimes adds preamble)
    let assessment;
    try {
      const jsonMatch = assessmentText.match(/\{[\s\S]*\}/);
      assessment = jsonMatch ? JSON.parse(jsonMatch[0]) : { breaking_news: [], context: '' };
    } catch (e) {
      console.warn('Failed to parse Claude assessment, using empty result');
      assessment = { breaking_news: [], context: '' };
    }

    console.log(`✅ Claude filtered to ${assessment.breaking_news?.length || 0} breaking news articles`);
    console.log(`   Context: ${assessment.context}`);

    const filteredArticles = assessment.breaking_news.map((bn: any) => {
      const article = newResults[bn.index - 1];
      return {
        ...article,
        // Ensure content is available for enrichment (use snippet/content as description)
        description: article.content || article.snippet || article.description || bn.key_fact,
        content: article.content || article.snippet || article.description,
        claude_assessment: {
          key_fact: bn.key_fact,
          category: bn.category,
          urgency: bn.urgency,
          confidence: bn.confidence
        }
      };
    });

    if (filteredArticles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No breaking news detected after assessment',
        time_window,
        articles_analyzed: newResults.length,
        filtered_articles: 0,
        context: assessment.context
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ===== STAGE 4: Event Extraction (Reuse Enrichment) =====
    console.log(`\n🔍 Stage 4: Extracting events from ${filteredArticles.length} articles...`);

    const enrichmentResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/monitoring-stage-2-enrichment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          articles: filteredArticles,
          profile,
          organization_name,
          coverage_report: {
            context: assessment.context,
            source: 'real-time-intelligence',
            time_window
          }
        })
      }
    );

    if (!enrichmentResponse.ok) {
      throw new Error(`Enrichment failed: ${enrichmentResponse.status}`);
    }

    const enrichedData = await enrichmentResponse.json();
    console.log(`✅ Extracted ${enrichedData.statistics?.total_events || 0} events`);

    // ===== STAGE 5: Real-Time Synthesis =====
    console.log('\n📝 Stage 5: Creating real-time intelligence brief...');

    const synthesisPrompt = `You are creating a REAL-TIME INTELLIGENCE BRIEF for ${organization_name}.

TIME WINDOW: Last ${time_window}
DATE: ${new Date().toISOString()}
CONTEXT: ${assessment.context}

ENRICHED INTELLIGENCE:
- ${enrichedData.statistics?.total_events || 0} events detected
- ${enrichedData.statistics?.total_companies || 0} entities mentioned
- ${filteredArticles.length} breaking news articles

EVENTS:
${(enrichedData.organized_intelligence?.events || enrichedData.extracted_data?.events || [])
  .map((e: any) => `- [${e.type}] ${e.entity}: ${e.description}`)
  .join('\n')}

Create a CONCISE real-time intelligence brief focused on actionable insights:

{
  "breaking_summary": "2-3 sentence summary of key developments in last ${time_window}",
  "critical_alerts": [
    {
      "title": "Action-oriented headline",
      "summary": "What happened and why it matters (2-3 sentences)",
      "source_urls": ["url1", "url2"],
      "category": "crisis|opportunity|competitive|regulatory",
      "urgency": "immediate|this_week|informational",
      "recommended_action": "Specific action to take",
      "time_to_act": "Timeline (e.g., 'Next 24 hours', 'This week')"
    }
  ],
  "watch_list": [
    {
      "item": "Topic or entity to monitor",
      "why": "Reason to watch (1 sentence)",
      "next_check": "When to check again (e.g., '6 hours', '24 hours')"
    }
  ],
  "context": "How these developments fit into broader trends (2-3 sentences)"
}`;

    const synthesisResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: synthesisPrompt
      }]
    });

    const synthesisText = synthesisResponse.content[0].type === 'text'
      ? synthesisResponse.content[0].text
      : '{}';

    // Extract JSON from response (Claude sometimes wraps in markdown)
    let synthesis;
    try {
      const cleanText = synthesisText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      synthesis = jsonMatch ? JSON.parse(jsonMatch[0]) : { breaking_summary: '', critical_alerts: [], watch_list: [] };
    } catch (e) {
      console.warn('Failed to parse synthesis, using empty result');
      synthesis = { breaking_summary: '', critical_alerts: [], watch_list: [] };
    }

    console.log(`✅ Generated ${synthesis.critical_alerts?.length || 0} critical alerts`);

    // ===== STAGE 6: Opportunity & Crisis Detection (Parallel Tracks) =====

    // Get organization UUID for opportunity/crisis/prediction routing
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', organization_name)
      .single();

    const organizationUuid = organization_id || orgData?.id || organization_name; // Use passed UUID, or lookup, or fallback to name

    let opportunityResult = null;
    let crisisResult = null;
    let predictionResult = null;

    // TRACK A: Opportunities (Optional)
    if (route_to_opportunities && enrichedData.organized_intelligence?.events?.length > 0) {
      console.log('\n🎯 Stage 6a: Detecting opportunities...');

      try {
        const detectorController = new AbortController();
        const detectorTimeout = setTimeout(() => detectorController.abort(), 30000); // 30s timeout

        const detectorResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/mcp-opportunity-detector-v2`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({
              organization_id: organizationUuid,  // Use UUID
              organization_name,
              enriched_data: enrichedData,
              profile
            }),
            signal: detectorController.signal
          }
        );

        clearTimeout(detectorTimeout);

        if (detectorResponse.ok) {
          const detectorData = await detectorResponse.json();
          console.log(`   Found ${detectorData.opportunities?.length || 0} opportunity signals`);

          if (detectorData.opportunities && detectorData.opportunities.length > 0) {
            // Call orchestrator-v2 to enhance
            const orchestratorController = new AbortController();
            const orchestratorTimeout = setTimeout(() => orchestratorController.abort(), 30000); // 30s timeout

            const orchestratorResponse = await fetch(
              `${SUPABASE_URL}/functions/v1/opportunity-orchestrator-v2`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${SUPABASE_KEY}`
                },
                body: JSON.stringify({
                  organization_id: organizationUuid,  // Use UUID
                  organization_name,
                  detected_opportunities: detectorData.opportunities,
                  enriched_data: enrichedData,
                  executive_synthesis: synthesis,
                  profile,
                  detection_config: {
                    min_score: 70,
                    max_opportunities: 10,
                    focus_areas: ['crisis', 'trending', 'competitive']
                  }
                }),
                signal: orchestratorController.signal
              }
            );

            clearTimeout(orchestratorTimeout);

            if (orchestratorResponse.ok) {
              opportunityResult = await orchestratorResponse.json();
              console.log(`   ✅ Generated ${opportunityResult.opportunities?.length || 0} opportunities`);
            } else {
              console.warn(`   ⚠️ Opportunity orchestrator returned ${orchestratorResponse.status}`);
            }
          }
        } else {
          console.warn(`   ⚠️ Opportunity detector returned ${detectorResponse.status}`);
        }
      } catch (error) {
        console.error('⚠️ Opportunity detection error:', error.message);
        if (error.name === 'AbortError') {
          console.warn('   ⏱️ Opportunity detection timed out, continuing...');
        }
      }
    } else if (route_to_opportunities) {
      console.log('\n🎯 Stage 6a: Skipping opportunity detection (no events extracted)');
    }

    // TRACK B: Crisis Detection (Runs by default)
    if (route_to_crisis) {
      const crisisEvents = (enrichedData.organized_intelligence?.events ||
                           enrichedData.extracted_data?.events || [])
        .filter((e: any) =>
          e.type === 'crisis' || e.type === 'regulatory' ||
          e.category === 'crisis' || e.severity === 'high' || e.severity === 'critical'
        );

      if (crisisEvents.length > 0) {
        console.log(`\n🚨 Stage 6b: Analyzing ${crisisEvents.length} potential crises...`);

        try {
          const crisisController = new AbortController();
          const crisisTimeout = setTimeout(() => crisisController.abort(), 30000); // 30s timeout

          const crisisResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/mcp-crisis`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`
              },
              body: JSON.stringify({
                method: 'tools/call',
                params: {
                  name: 'detect_crisis_signals',
                  arguments: {
                    events: crisisEvents,
                    organization: organization_name,
                    timeWindow: time_window,
                    sensitivity: 'high'
                  }
                }
              }),
              signal: crisisController.signal
            }
          );

          clearTimeout(crisisTimeout);

          if (crisisResponse.ok) {
            const crisisData = await crisisResponse.json();

            if (crisisData.content?.[0]?.type === 'text') {
              let crisisContent;
              try {
                const text = crisisData.content[0].text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                crisisContent = jsonMatch ? JSON.parse(jsonMatch[0]) : { crises: [] };
              } catch (e) {
                console.warn('Failed to parse crisis detection');
                crisisContent = { crises: [] };
              }

              if (crisisContent.crises && crisisContent.crises.length > 0) {
                console.log(`   Found ${crisisContent.crises.length} crisis signals`);

                // Assess severity for each
                const assessedCrises = [];
                for (const crisis of crisisContent.crises.slice(0, 5)) { // Limit to top 5
                  try {
                    const assessmentController = new AbortController();
                    const assessmentTimeout = setTimeout(() => assessmentController.abort(), 15000); // 15s per assessment

                    const assessmentResp = await fetch(
                      `${SUPABASE_URL}/functions/v1/mcp-crisis`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${SUPABASE_KEY}`
                        },
                        body: JSON.stringify({
                          method: 'tools/call',
                          params: {
                            name: 'assess_crisis_severity',
                            arguments: {
                              situation: crisis.description || crisis.title,
                              metrics: crisis.metrics || {},
                              stakeholdersAffected: crisis.stakeholders || []
                            }
                          }
                        }),
                        signal: assessmentController.signal
                      }
                    );

                    clearTimeout(assessmentTimeout);

                  if (assessmentResp.ok) {
                    const assessment = await assessmentResp.json();
                    if (assessment.content?.[0]?.type === 'text') {
                      let assessmentData;
                      try {
                        const text = assessment.content[0].text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
                        const jsonMatch = text.match(/\{[\s\S]*\}/);
                        assessmentData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
                      } catch (e) {
                        console.warn('Failed to parse crisis assessment');
                        assessmentData = {};
                      }
                      assessedCrises.push({
                        ...crisis,
                        severity_assessment: assessmentData.severity,
                        impact_assessment: assessmentData.impact,
                        recommended_response_timeframe: assessmentData.response_timeframe
                      });

                      // Save to crisis_events table (matching Crisis Command Center expectations)
                      await supabase.from('crisis_events').insert({
                        organization_id: organizationUuid,  // Use UUID
                        title: crisis.title || crisis.description?.substring(0, 100),
                        description: crisis.description,
                        severity: assessmentData.severityLevel || assessmentData.severity || 'medium',
                        crisis_type: crisis.type || 'intelligence_alert',
                        status: 'monitoring',  // Start as monitoring, can escalate to 'active'
                        started_at: new Date().toISOString(),
                        trigger_source: 'real-time-intelligence',
                        trigger_data: {
                          events: crisis.events || crisisEvents.slice(0, 3),
                          assessment: assessmentData,
                          response_timeframe: assessmentData.responseUrgency || assessmentData.response_timeframe,
                          key_risks: assessmentData.keyRisks || []
                        },
                        metadata: {
                          time_window,
                          detected_by: 'real-time-intelligence-orchestrator',
                          severity_score: assessmentData.severityScore,
                          escalation_risk: assessmentData.escalationRisk
                        }
                      });
                    }
                  } else {
                    console.warn(`   ⚠️ Crisis assessment returned ${assessmentResp.status}`);
                  }
                  } catch (assessError) {
                    console.error(`   ⚠️ Crisis assessment error: ${assessError.message}`);
                    if (assessError.name === 'AbortError') {
                      console.warn('   ⏱️ Crisis assessment timed out, skipping this crisis...');
                    }
                  }
                }

                crisisResult = {
                  crises_detected: assessedCrises.length,
                  critical_crises: assessedCrises.filter(c =>
                    c.severity_assessment === 'critical' || c.severity_assessment === 'high'
                  ).length,
                  crises: assessedCrises
                };

                console.log(`   ✅ Assessed ${crisisResult.crises_detected} crises (${crisisResult.critical_crises} critical/high)`);
              }
            }
          } else {
            console.warn(`   ⚠️ Crisis response returned ${crisisResponse.status}`);
          }
        } catch (error) {
          console.error('⚠️ Crisis detection error:', error.message);
          if (error.name === 'AbortError') {
            console.warn('   ⏱️ Crisis detection timed out, continuing...');
          }
        }
      } else {
        console.log('\n🚨 Stage 6b: No crisis events detected');
      }
    }

    // TRACK C: Stakeholder Predictions (Runs by default after intelligence brief is saved)
    if (route_to_predictions) {
      console.log('\n🔮 Stage 6c: Generating stakeholder predictions...');

      try {
        // Note: Prediction system requires intelligence brief to be saved first (uses events/entities)
        // We'll call it after saving, so marking it for execution
        predictionResult = { should_run: true };
      } catch (error) {
        console.error('⚠️ Prediction setup error:', error.message);
      }
    }

    // ===== STAGE 7: Save State & Return =====
    console.log('\n💾 Stage 7: Saving state...');

    // Save to seen_articles
    for (const article of filteredArticles) {
      if (article.url) {
        await supabase.from('seen_articles').upsert({
          organization_id: organization_name,
          url: article.url,
          title: article.title,
          seen_at: new Date().toISOString(),
          source: 'real-time-intelligence'
        }, {
          onConflict: 'organization_id,url,source'
        });
      }
    }

    // Save intelligence brief (with events and entities for prediction system)
    await supabase.from('real_time_intelligence_briefs').insert({
      organization_id: organizationUuid,  // Use UUID instead of name
      organization_name: organization_name,
      time_window,
      articles_analyzed: filteredArticles.length,
      events_detected: enrichedData.statistics?.total_events || 0,
      alerts_generated: synthesis.critical_alerts?.length || 0,
      synthesis: synthesis,
      breaking_summary: synthesis.breaking_summary,
      critical_alerts: synthesis.critical_alerts || [],
      events: enrichedData.organized_intelligence?.events || enrichedData.extracted_data?.events || [],
      entities: enrichedData.organized_intelligence?.entities || enrichedData.extracted_data?.entities || [],
      created_at: new Date().toISOString()
    });

    // STAGE 8: Generate Predictions (after intelligence brief is saved)
    if (predictionResult?.should_run) {
      console.log('\n🔮 Stage 8: Generating stakeholder predictions...');

      try {
        const predictionController = new AbortController();
        const predictionTimeout = setTimeout(() => predictionController.abort(), 30000); // 30s timeout

        const predictionResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/stakeholder-pattern-detector`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({
              organizationId: organizationUuid,
              runNow: true
            }),
            signal: predictionController.signal
          }
        );

        clearTimeout(predictionTimeout);

        if (predictionResponse.ok) {
          predictionResult = await predictionResponse.json();
          console.log(`   ✅ Generated ${predictionResult.predictions_generated || 0} stakeholder predictions`);
        } else {
          console.warn(`   ⚠️ Prediction generation returned ${predictionResponse.status}`);
          predictionResult = { predictions_generated: 0, predictions: [] };
        }
      } catch (error) {
        console.error('⚠️ Prediction generation error:', error.message);
        if (error.name === 'AbortError') {
          console.warn('   ⏱️ Prediction generation timed out, continuing...');
        }
        predictionResult = { predictions_generated: 0, predictions: [] };
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n✅ Real-time intelligence complete in ${totalTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      time_window,
      execution_time_ms: totalTime,

      // Article stats
      articles_analyzed: filteredArticles.length,
      new_articles: newResults.length,
      total_articles_found: rawResults.length,

      // Intelligence brief
      breaking_summary: synthesis.breaking_summary,
      critical_alerts: synthesis.critical_alerts || [],
      watch_list: synthesis.watch_list || [],
      context: synthesis.context,

      // Opportunity results
      opportunities: opportunityResult?.opportunities || [],
      opportunities_count: opportunityResult?.opportunities?.length || 0,

      // Crisis results
      crises: crisisResult?.crises || [],
      crises_count: crisisResult?.crises_detected || 0,
      critical_crises_count: crisisResult?.critical_crises || 0,

      // Prediction results
      predictions: predictionResult?.predictions || [],
      predictions_count: predictionResult?.predictions_generated || 0,

      // Metadata
      assessment_context: assessment.context,
      enriched_data_available: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Real-time intelligence orchestrator error:', error);
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
