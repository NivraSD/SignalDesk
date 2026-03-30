// Real-Time Intelligence Orchestrator V2
// Uses the PROVEN intelligence pipeline (monitor-stage-1 → monitor-stage-2-relevance → monitor-stage-2-enrichment)
// Adapted for real-time monitoring with crisis/opportunity detection

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organization_name, time_window, route_to_opportunities, route_to_crisis } = await req.json()

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  Real-Time Intelligence Orchestrator V2')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Organization: ${organization_name}`)
    console.log(`Time window: ${time_window}`)
    console.log(`Opportunities: ${route_to_opportunities !== false}`)
    console.log(`Crisis detection: ${route_to_crisis !== false}`)
    console.log()

    const startTime = Date.now()

    // ===== STAGE 0: Discovery (Get Organization Profile) =====
    console.log('🔍 Stage 0: Running mcp-discovery to get organization profile...')

    const profileResponse = await fetch(`${SUPABASE_URL}/functions/v1/mcp-discovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        organization: organization_name
      })
    })

    if (!profileResponse.ok) {
      throw new Error(`mcp-discovery failed: ${profileResponse.status}`)
    }

    const profileData = await profileResponse.json()
    const profile = profileData.profile || profileData

    if (!profile || !profile.organization_name) {
      throw new Error('Failed to get valid organization profile from mcp-discovery')
    }

    console.log(`✅ Stage 0 complete: Profile loaded for ${profile.organization_name || organization_name}`)
    console.log(`   Competitors: ${profile.competition?.direct_competitors?.length || 0}`)
    console.log(`   Keywords: ${profile.monitoring_config?.keywords?.length || 0}`)

    // ===== STAGE 1: Article Discovery & Filtering (Proven Pipeline) =====
    console.log('\n📡 Stage 1: Running monitor-stage-1 for fresh content...')

    const stage1Response = await fetch(`${SUPABASE_URL}/functions/v1/monitor-stage-1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        organization_name: organization_name,
        profile: profile
      })
    })

    if (!stage1Response.ok) {
      throw new Error(`monitor-stage-1 failed: ${stage1Response.status}`)
    }

    const stage1Data = await stage1Response.json()
    const articles = stage1Data.articles || stage1Data.results || []
    console.log(`✅ Stage 1 complete: ${articles.length} articles from last 48 hours`)
    console.log(`   Social signals: ${stage1Data.social_signals?.length || 0}`)

    // Apply additional time window filter for real-time monitoring
    let filteredResults = articles
    if (time_window !== '48hours') {
      const timeWindowMs = time_window === '1hour' ? 3600000 :
                           time_window === '6hours' ? 21600000 : 86400000
      const cutoffTime = new Date(Date.now() - timeWindowMs)

      filteredResults = filteredResults.filter((article: any) => {
        const publishDate = new Date(article.published_at || article.publishedAt || 0)
        return publishDate > cutoffTime
      })

      console.log(`   Filtered to last ${time_window}: ${filteredResults.length} articles`)
    }

    if (!filteredResults || filteredResults.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No new articles found in time window',
        time_window,
        articles_analyzed: 0,
        execution_time_ms: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ===== STAGE 2: Relevance Scoring & Full Content (Proven Pipeline) =====
    console.log('\n📊 Stage 2: Running monitor-stage-2-relevance for scoring and enrichment...')

    const stage2Response = await fetch(`${SUPABASE_URL}/functions/v1/monitor-stage-2-relevance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        articles: filteredResults,
        profile: profile || stage1Data.profile,
        organization_name: organization_name,
        top_k: 25, // Limit to 25 articles to prevent timeout
        coverage_report: stage1Data.metadata?.coverage_report // Pass coverage report from Monitor Stage 1
      })
    })

    if (!stage2Response.ok) {
      throw new Error(`monitor-stage-2-relevance failed: ${stage2Response.status}`)
    }

    const stage2Data = await stage2Response.json()
    console.log(`✅ Stage 2 complete: ${stage2Data.articles?.length || 0} articles with relevance scores`)
    console.log(`   Articles with full content: ${stage2Data.articles?.filter((a: any) => a.has_full_content).length || 0}`)

    // ===== STAGE 3: Intelligence Extraction (Proven Pipeline) =====
    console.log('\n🔍 Stage 3: Running monitor-stage-2-enrichment for intelligence extraction...')

    const stage3Response = await fetch(`${SUPABASE_URL}/functions/v1/monitoring-stage-2-enrichment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        organization_id: organization_name,
        articles: stage2Data.articles,
        profile: profile || stage1Data.profile
      })
    })

    if (!stage3Response.ok) {
      throw new Error(`monitoring-stage-2-enrichment failed: ${stage3Response.status}`)
    }

    const enrichedData = await stage3Response.json()
    console.log(`✅ Stage 3 complete: Intelligence extracted`)
    console.log(`   Events detected: ${enrichedData.statistics?.total_events || 0}`)
    console.log(`   Entities found: ${enrichedData.statistics?.total_companies || 0}`)

    // ===== STAGE 4: Real-Time Synthesis =====
    console.log('\n📝 Stage 4: Creating real-time intelligence brief...')

    const events = enrichedData.organized_intelligence?.events || enrichedData.extracted_data?.events || []
    const topArticles = stage2Data.articles
      ?.filter((a: any) => a.has_full_content)
      .sort((a: any, b: any) => (b.pr_relevance_score || 0) - (a.pr_relevance_score || 0))
      .slice(0, 10) || []

    const synthesisPrompt = `You are creating a REAL-TIME INTELLIGENCE BRIEF for ${organization_name}.

TIME WINDOW: Last ${time_window}
CURRENT DATE: ${new Date().toISOString().split('T')[0]}

INTELLIGENCE SUMMARY:
- ${events.length} events detected
- ${topArticles.length} high-priority articles with full content
- ${enrichedData.statistics?.total_companies || 0} entities mentioned

TOP EVENTS:
${events.slice(0, 10).map((e: any) =>
  `- [${e.type || 'event'}] ${e.entity || e.company}: ${e.description || e.event}`
).join('\n')}

TOP ARTICLES:
${topArticles.map((a: any, i: number) =>
  `${i + 1}. ${a.title}
   URL: ${a.url}
   Relevance: ${a.pr_relevance_score || 0}/100`
).join('\n\n')}

Create a CONCISE real-time intelligence brief with actionable insights.

Respond in JSON format:
{
  "breaking_summary": "2-3 sentence executive summary of key developments",
  "critical_alerts": [
    {
      "title": "Action-oriented headline",
      "summary": "What happened and why it matters (2-3 sentences)",
      "category": "crisis|opportunity|competitive|regulatory|general",
      "urgency": "immediate|this_week|informational",
      "recommended_action": "Specific action to take",
      "time_to_act": "Timeline for response",
      "source_urls": ["url1", "url2"]
    }
  ],
  "watch_list": [
    {
      "item": "Thing to monitor",
      "why": "Why it matters",
      "next_check": "When to check again"
    }
  ]
}`

    const anthropic = {
      messages: {
        create: async (params: any) => {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(params)
          })
          return response.json()
        }
      }
    }

    const synthesisResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: synthesisPrompt
      }]
    })

    const synthesisText = synthesisResponse.content[0].type === 'text'
      ? synthesisResponse.content[0].text
      : '{}'

    // Extract JSON from response (handle markdown wrapping)
    let synthesis
    try {
      const cleanText = synthesisText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
      synthesis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        breaking_summary: '',
        critical_alerts: [],
        watch_list: []
      }
    } catch (e) {
      console.warn('Failed to parse synthesis, using empty result')
      synthesis = { breaking_summary: '', critical_alerts: [], watch_list: [] }
    }

    console.log(`✅ Synthesis complete: ${synthesis.critical_alerts?.length || 0} critical alerts generated`)

    // ===== STAGE 5: Parallel Detection (Crisis & Opportunities) =====
    let opportunityResult = null
    let crisisResult = null

    const detectionPromises = []

    // Crisis detection
    if (route_to_crisis !== false && events.length > 0) {
      console.log('\n🚨 Stage 5a: Running crisis detection...')

      const crisisEvents = events.filter((e: any) =>
        e.type === 'crisis' ||
        e.type === 'regulatory' ||
        e.category === 'crisis' ||
        e.severity === 'high' ||
        (synthesis.critical_alerts || []).some((a: any) => a.urgency === 'immediate')
      )

      if (crisisEvents.length > 0) {
        detectionPromises.push(
          (async () => {
            try {
              const crisisResponse = await fetch(`${SUPABASE_URL}/functions/v1/mcp-crisis`, {
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
                })
              })

              if (crisisResponse.ok) {
                const crisisData = await crisisResponse.json()
                if (crisisData.content?.[0]?.type === 'text') {
                  let crisisContent
                  try {
                    const text = crisisData.content[0].text.replace(/```json\n?/g, '').replace(/```\n?/g, '')
                    const jsonMatch = text.match(/\{[\s\S]*\}/)
                    crisisContent = jsonMatch ? JSON.parse(jsonMatch[0]) : { crises: [] }
                  } catch (e) {
                    crisisContent = { crises: [] }
                  }

                  if (crisisContent.crises?.length > 0) {
                    console.log(`   Found ${crisisContent.crises.length} crisis signals`)
                    crisisResult = crisisContent.crises
                  }
                }
              }
            } catch (error) {
              console.error('Crisis detection error:', error)
            }
          })()
        )
      }
    }

    // Opportunity detection
    if (route_to_opportunities !== false && events.length > 0) {
      console.log('\n💡 Stage 5b: Running opportunity detection...')

      detectionPromises.push(
        (async () => {
          try {
            const detectorResponse = await fetch(`${SUPABASE_URL}/functions/v1/mcp-opportunity-detector`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`
              },
              body: JSON.stringify({
                organization_id: organization_name,
                organization_name,
                enriched_data: enrichedData,
                profile: profile || stage1Data.profile
              })
            })

            if (detectorResponse.ok) {
              const detectorData = await detectorResponse.json()

              if (detectorData.opportunities?.length > 0) {
                console.log(`   Detected ${detectorData.opportunities.length} opportunity signals`)

                // Route to orchestrator-v2 for creative enhancement
                const orchestratorResponse = await fetch(`${SUPABASE_URL}/functions/v1/opportunity-orchestrator-v2`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                  },
                  body: JSON.stringify({
                    organization_id: organization_name,
                    opportunities: detectorData.opportunities,
                    enriched_data: enrichedData,
                    profile: profile || stage1Data.profile
                  })
                })

                if (orchestratorResponse.ok) {
                  const orchestratorData = await orchestratorResponse.json()
                  console.log(`   Generated ${orchestratorData.opportunities?.length || 0} strategic playbooks`)
                  opportunityResult = orchestratorData.opportunities || []
                }
              }
            }
          } catch (error) {
            console.error('Opportunity detection error:', error)
          }
        })()
      )
    }

    // Wait for all detection to complete
    await Promise.all(detectionPromises)

    // ===== STAGE 6: Save & Return =====
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Save seen articles for deduplication
    const articleUrls = stage1Data.results.map((a: any) => ({
      organization_id: organization_name,
      url: a.url,
      title: a.title,
      source: a.source
    }))

    if (articleUrls.length > 0) {
      await supabase.from('seen_articles').upsert(articleUrls, {
        onConflict: 'organization_id,url,source',
        ignoreDuplicates: true
      })
    }

    // Save intelligence brief
    await supabase.from('real_time_intelligence_briefs').insert({
      organization_id: organization_name,
      time_window,
      articles_analyzed: stage2Data.articles?.length || 0,
      events_detected: events.length,
      alerts_generated: synthesis.critical_alerts?.length || 0,
      synthesis: synthesis
    })

    const executionTime = Date.now() - startTime
    console.log(`\n✅ Real-Time Intelligence Complete (${(executionTime / 1000).toFixed(1)}s)`)
    console.log(`   Articles: ${stage2Data.articles?.length || 0}`)
    console.log(`   Events: ${events.length}`)
    console.log(`   Alerts: ${synthesis.critical_alerts?.length || 0}`)
    console.log(`   Opportunities: ${opportunityResult?.length || 0}`)
    console.log(`   Crises: ${crisisResult?.length || 0}`)

    return new Response(JSON.stringify({
      success: true,
      time_window,
      execution_time_ms: executionTime,

      // Article stats
      articles_analyzed: stage2Data.articles?.length || 0,
      articles_with_full_content: stage2Data.articles?.filter((a: any) => a.has_full_content).length || 0,
      new_articles: stage1Data.stats?.articles_after_date_filter || 0,

      // Intelligence
      breaking_summary: synthesis.breaking_summary,
      critical_alerts: synthesis.critical_alerts || [],
      watch_list: synthesis.watch_list || [],

      // Opportunities
      opportunities: opportunityResult || [],
      opportunities_count: opportunityResult?.length || 0,

      // Crises
      crises: crisisResult || [],
      crises_count: crisisResult?.length || 0,
      critical_crises_count: crisisResult?.filter((c: any) =>
        c.severity === 'critical' || c.severity === 'high'
      ).length || 0,

      // Raw data for debugging
      events: events.slice(0, 20),
      top_articles: topArticles
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Real-time intelligence error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
