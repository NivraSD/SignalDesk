import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FireplexityMonitorRequest {
  organization_id: string
  organization_name?: string
  queries?: string[]
  check_interval?: string
  relevance_threshold?: number
  recency_window?: string
  route_to_opportunity_engine?: boolean  // NEW: Send high-priority alerts to opportunity engine
}

interface Alert {
  type: 'crisis' | 'opportunity' | 'volume_spike'
  severity: 'critical' | 'high' | 'medium' | 'low'
  source: string
  title: string
  url?: string
  content: string
  detected_at: Date
  keywords_matched?: string[]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      queries: customQueries,
      relevance_threshold = 70,
      recency_window = '30min',
      route_to_opportunity_engine = false
    }: FireplexityMonitorRequest = await req.json()

    console.log('🔍 Fireplexity Real-Time Monitor Starting:', {
      organization_id,
      recency_window,
      relevance_threshold
    })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Load config from organization_profiles (created by mcp-discovery)
    let config
    if (customQueries) {
      config = {
        organization_id,
        organization_name: organization_name || organization_id,
        fireplexity_queries: customQueries,
        crisis_keywords: DEFAULT_CRISIS_KEYWORDS,
        opportunity_keywords: DEFAULT_OPPORTUNITY_KEYWORDS
      }
    } else {
      // Try to get organization profile from mcp-discovery
      const { data: profileData, error: profileError } = await supabase
        .from('organization_profiles')
        .select('profile_data')
        .eq('organization_name', organization_id)
        .single()

      if (profileError || !profileData) {
        console.error('❌ No organization profile found for:', organization_id)
        return new Response(JSON.stringify({
          success: false,
          error: 'No organization profile found. Please run mcp-discovery first to create a profile.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const profile = profileData.profile_data

      // Build config from mcp-discovery profile
      // Use profile data to build company-specific breaking news queries
      config = {
        organization_id,
        organization_name: profile.organization_name,
        profile: profile,
        crisis_keywords: profile.monitoring_config?.crisis_indicators || DEFAULT_CRISIS_KEYWORDS,
        opportunity_keywords: profile.monitoring_config?.opportunity_indicators || DEFAULT_OPPORTUNITY_KEYWORDS,
        competitors: [
          ...(profile.competition?.direct_competitors || []),
          ...(profile.competition?.indirect_competitors || [])
        ].slice(0, 10),
        stakeholders: [
          ...(profile.stakeholders?.regulators || []),
          ...(profile.stakeholders?.major_investors || []),
          ...(profile.stakeholders?.key_executives || [])
        ].slice(0, 5)
      }
    }

    // Build company-specific breaking news queries
    // Similar to how monitor-stage-1 builds queries, but for real-time search
    let queries = buildCompanySpecificQueries(
      config.organization_name,
      config
    )

    // Limit to 10 queries max to stay under 150s timeout
    if (queries.length > 10) {
      console.log(`⚠️  Too many queries (${queries.length}). Limiting to 10 most important...`)
      queries = queries.slice(0, 10)
    }

    console.log(`📝 Executing ${queries.length} queries in batches...`)

    // Execute queries in parallel batches of 3
    const allResults = []
    const startTime = Date.now()
    const BATCH_SIZE = 3

    for (let i = 0; i < queries.length; i += BATCH_SIZE) {
      const batch = queries.slice(i, i + BATCH_SIZE)
      console.log(`\n🔄 Batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(queries.length/BATCH_SIZE)}: ${batch.length} queries`)

      const batchPromises = batch.map(async (query) => {
        try {
          console.log(`  🔎 "${query}"`)

          const response = await fetch(`${supabaseUrl}/functions/v1/niv-fireplexity`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              query,
              searchMode: 'focused',
              recency: recency_window
            })
          })

          if (!response.ok) {
            console.log(`  ⚠️ "${query}" failed: ${response.status}`)
            return []
          }

          const data = await response.json()

          if (data.results && data.results.length > 0) {
            console.log(`  ✅ "${query}": ${data.results.length} results`)
            return data.results.map((r: any) => ({
              ...r,
              query_used: query
            }))
          } else {
            console.log(`  ℹ️ "${query}": no results`)
            return []
          }

        } catch (error) {
          console.error(`  ❌ "${query}": ${error.message}`)
          return []
        }
      })

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises)
      allResults.push(...batchResults.flat())
    }

    const executionTime = Date.now() - startTime
    console.log(`\n⏱️  Total execution time: ${executionTime}ms`)

    // STAGE 1: Deduplicate results
    const deduplicated = deduplicateResults(allResults)
    console.log(`\n📊 Stage 1 - Deduplicated: ${allResults.length} → ${deduplicated.length} unique results`)

    // STAGE 2: Relevance scoring (filter out low-quality results)
    console.log(`\n🎯 Stage 2 - Relevance Scoring...`)
    const scoredResults = scoreRelevance(deduplicated, config, organization_id)
    const relevant = scoredResults.filter(r => r.relevance_score >= relevance_threshold)
    console.log(`   Relevant: ${relevant.length}/${deduplicated.length} (threshold: ${relevance_threshold})`)

    // STAGE 3: Only process top results (save API calls)
    const topResults = relevant.slice(0, 20) // Max 20 for enrichment
    console.log(`   Processing top ${topResults.length} results for alert detection`)

    // STAGE 4: AI Review - Detect real alerts from top results only
    console.log(`\n🤖 Stage 3 - AI Alert Detection...`)
    const alerts = await detectAlertsWithAI(topResults, config, organization_id)

    console.log(`🚨 Real alerts detected: ${alerts.length}/${topResults.length}`)

    // STAGE 5: Route high-priority alerts to opportunity engine (if requested)
    let opportunityEngineResult = null
    if (route_to_opportunity_engine && alerts.length > 0) {
      const criticalAlerts = alerts.filter(a =>
        a.severity === 'critical' || a.severity === 'high'
      )

      if (criticalAlerts.length > 0) {
        console.log(`\n🎯 Stage 4 - Routing ${criticalAlerts.length} high-priority alerts to opportunity engine...`)

        try {
          // Format alerts as articles for enrichment (matching monitor-stage-2-enrichment format)
          const alertArticles = criticalAlerts.map(alert => ({
            title: alert.title,
            content: alert.content,
            url: alert.url,
            source: 'fireplexity-realtime',
            published_at: alert.detected_at.toISOString(),
            relevance_score: alert.severity === 'critical' ? 100 : 85
          }))

          // Get profile if we have organization_id
          let profile = null
          if (config.organization_name) {
            const { data: profileData } = await supabase
              .from('organization_profiles')
              .select('profile_data')
              .eq('organization_name', config.organization_name)
              .single()

            if (profileData) {
              profile = profileData.profile_data
            }
          }

          // Call monitoring-stage-2-enrichment with same format as intelligence pipeline
          const enrichmentResponse = await fetch(
            `${supabaseUrl}/functions/v1/monitoring-stage-2-enrichment`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({
                articles: alertArticles,
                profile: profile,
                organization_name: config.organization_name || organization_id,
                coverage_report: {
                  context: 'Real-time alerts from Fireplexity monitor',
                  source: 'niv-fireplexity-monitor'
                }
              })
            }
          )

          if (enrichmentResponse.ok) {
            const enrichedData = await enrichmentResponse.json()
            console.log(`   ✅ Enrichment complete`)

            // Now call opportunity detector with enriched data
            const detectorResponse = await fetch(
              `${supabaseUrl}/functions/v1/mcp-opportunity-detector`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({
                  organization_id: organization_id,
                  organization_name: config.organization_name || organization_id,
                  enriched_data: enrichedData,
                  profile: profile
                })
              }
            )

            if (detectorResponse.ok) {
              opportunityEngineResult = await detectorResponse.json()
              console.log(`   ✅ Opportunity engine: ${opportunityEngineResult.opportunities?.length || 0} opportunities generated`)
            }
          }
        } catch (error) {
          console.error('   ⚠️ Opportunity engine routing failed:', error.message)
        }
      }
    }

    // Save monitoring results to database
    const { data: savedMonitoring, error: saveError } = await supabase
      .from('fireplexity_monitoring')
      .insert({
        organization_id,
        query: queries.join(', '),
        search_mode: 'focused',
        recency_window,
        results: relevant,
        results_count: relevant.length,
        relevance_threshold,
        relevant_results_count: relevant.length,
        alerts_triggered: alerts.length,
        crisis_keywords: config.crisis_keywords,
        opportunity_keywords: config.opportunity_keywords,
        executed_at: new Date().toISOString(),
        execution_time_ms: executionTime
      })
      .select()
      .single()

    if (saveError) {
      console.error('❌ Error saving monitoring results:', saveError)
    }

    // Save alerts to real_time_alerts table
    const savedAlertIds = []

    for (const alert of alerts) {
      const { data: savedAlert, error: alertError } = await supabase
        .from('real_time_alerts')
        .insert({
          organization_id,
          source: 'fireplexity',
          source_data: {
            query: alert.query_used,
            result: alert.result_data
          },
          alert_type: alert.type === 'volume_spike' ? 'info' : alert.type,
          severity: alert.severity,
          confidence: calculateConfidence(alert),
          title: alert.title,
          summary: alert.content.substring(0, 500),
          full_content: {
            content: alert.content,
            url: alert.url,
            keywords_matched: alert.keywords_matched
          },
          url: alert.url,
          detected_at: alert.detected_at.toISOString()
        })
        .select()
        .single()

      if (!alertError && savedAlert) {
        savedAlertIds.push(savedAlert.id)
      }
    }

    // Update monitoring record with alert IDs
    if (savedAlertIds.length > 0 && savedMonitoring) {
      await supabase
        .from('fireplexity_monitoring')
        .update({ alert_ids: savedAlertIds })
        .eq('id', savedMonitoring.id)
    }

    console.log('✅ Fireplexity monitoring complete\n')

    return new Response(JSON.stringify({
      success: true,
      results_found: relevant.length,
      alerts_triggered: alerts.length,
      opportunities_generated: opportunityEngineResult?.opportunities?.length || 0,
      execution_time_ms: executionTime,
      alerts: alerts.map(a => ({
        type: a.type,
        severity: a.severity,
        title: a.title
      })),
      opportunities: opportunityEngineResult?.opportunities || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Fireplexity monitor error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// ============================================
// Helper Functions
// ============================================

/**
 * Build company-specific breaking news queries from mcp-discovery profile
 * Similar to monitor-stage-1, but focused on real-time breaking news
 */
function buildCompanySpecificQueries(orgName: string, config: any): string[] {
  const queries = []

  // 1. COMPANY-SPECIFIC CRISIS QUERIES (highest priority)
  const crisisTerms = ['crisis', 'lawsuit', 'investigation', 'breach', 'recall', 'scandal']
  crisisTerms.forEach(term => {
    queries.push(`"${orgName}" ${term}`)
  })

  // 2. COMPETITOR BREAKING NEWS (monitor competitive intelligence)
  // Use actual company names, not "Company X competitor"
  const competitors = config.competitors || []
  competitors.slice(0, 3).forEach((competitor: string) => {
    queries.push(`"${competitor}" AND "${orgName}"`)
  })

  // 3. KEY STAKEHOLDER ACTIVITY (executives, investors, regulators)
  const stakeholders = config.stakeholders || []
  stakeholders.slice(0, 2).forEach((stakeholder: string) => {
    queries.push(`"${stakeholder}" AND "${orgName}"`)
  })

  // 4. GENERAL BREAKING NEWS (catch-all for major events)
  queries.push(`"${orgName}" breaking news`)

  console.log(`🔍 Built ${queries.length} company-specific queries for ${orgName}`)
  console.log('   Sample queries:', queries.slice(0, 3))

  return queries.slice(0, 15) // Limit to 15 queries (5 batches of 3)
}

function deduplicateResults(results: any[]): any[] {
  const seen = new Map()

  for (const result of results) {
    const url = result.url || result.link || ''

    if (!seen.has(url) || url === '') {
      seen.set(url || Math.random().toString(), result)
    }
  }

  return Array.from(seen.values())
}

function scoreRelevance(results: any[], config: any, organization_id: string): any[] {
  const crisisKeywords = config.crisis_keywords || DEFAULT_CRISIS_KEYWORDS
  const oppKeywords = config.opportunity_keywords || DEFAULT_OPPORTUNITY_KEYWORDS
  const competitors = config.competitors || []

  return results.map(result => {
    const title = (result.title || '').toLowerCase()
    const content = (result.content || result.snippet || '').toLowerCase()
    const combined = `${title} ${content}`

    let score = 0

    // Organization mentioned in title: +40 points
    if (title.includes(organization_id.toLowerCase())) {
      score += 40
    }

    // Organization in content: +20 points
    if (content.includes(organization_id.toLowerCase())) {
      score += 20
    }

    // Crisis keywords: +25 points
    const hasCrisis = crisisKeywords.some((kw: string) =>
      combined.includes(kw.toLowerCase())
    )
    if (hasCrisis) score += 25

    // Opportunity keywords: +20 points
    const hasOpp = oppKeywords.some((kw: string) =>
      combined.includes(kw.toLowerCase())
    )
    if (hasOpp) score += 20

    // Direct competitor in title: +30 points
    const competitorInTitle = competitors.some((comp: string) =>
      title.includes(comp.toLowerCase())
    )
    if (competitorInTitle) score += 30

    // Competitor in content: +15 points
    const competitorInContent = competitors.some((comp: string) =>
      content.includes(comp.toLowerCase())
    )
    if (competitorInContent && !competitorInTitle) score += 15

    return {
      ...result,
      relevance_score: score
    }
  })
}

async function detectAlertsWithAI(results: any[], config: any, organization_id: string): Promise<Alert[]> {
  if (results.length === 0) return []

  // Use simple keyword detection for now (AI review would be too slow)
  // But filter out obvious HTML/UI garbage
  return detectAlerts(results.filter(r => isRealArticle(r)), config)
}

function isRealArticle(result: any): boolean {
  const title = result.title || ''
  const content = result.content || result.snippet || ''

  // Filter out HTML/UI elements
  const garbagePatterns = [
    /^skip/i,
    /^enable/i,
    /navigation/i,
    /^login/i,
    /^register/i,
    /^new watches/i,
    /fortune 500$/i, // Just "Fortune 500" alone
    /opens? in (a )?new window/i,
    /^democracy dies/i,
    /^creative strategy/i,
    /trade directly/i,
    /contest:/i,
    /^market alerts$/i,
    /^hardwareindustry$/i,
    /^\d+\./,  // Just numbers like "2."
    /^see the archives$/i,
    /^today:/i,
    /^!\[/  // Markdown images
  ]

  // If title matches garbage patterns, filter it out
  if (garbagePatterns.some(pattern => pattern.test(title))) {
    return false
  }

  // Must have meaningful content (at least 50 chars)
  if (content.length < 50) {
    return false
  }

  // Must have title that's not just a fragment
  if (title.length < 15 && !title.match(/\w{3,}/)) {
    return false
  }

  return true
}

function detectAlerts(results: any[], config: any): Alert[] {
  const alerts: Alert[] = []

  // Crisis keyword detection
  const crisisKeywords = config.crisis_keywords || DEFAULT_CRISIS_KEYWORDS

  for (const result of results) {
    const content = (result.content || '').toLowerCase()
    const title = (result.title || '').toLowerCase()

    // Check crisis keywords
    const matchedCrisisKeywords = crisisKeywords.filter((kw: string) =>
      content.includes(kw.toLowerCase()) || title.includes(kw.toLowerCase())
    )

    if (matchedCrisisKeywords.length > 0) {
      const severity = determineCrisisSeverity(matchedCrisisKeywords, content, title)

      alerts.push({
        type: 'crisis',
        severity,
        source: 'fireplexity',
        title: result.title || 'Crisis Alert',
        url: result.url || result.link,
        content: result.content || result.snippet || '',
        detected_at: new Date(),
        keywords_matched: matchedCrisisKeywords,
        query_used: result.query_used,
        result_data: result
      } as any)

      continue // Don't check opportunity if it's a crisis
    }

    // Check opportunity keywords
    const oppKeywords = config.opportunity_keywords || DEFAULT_OPPORTUNITY_KEYWORDS

    const matchedOppKeywords = oppKeywords.filter((kw: string) =>
      content.includes(kw.toLowerCase()) || title.includes(kw.toLowerCase())
    )

    if (matchedOppKeywords.length > 0) {
      alerts.push({
        type: 'opportunity',
        severity: 'medium',
        source: 'fireplexity',
        title: result.title || 'Opportunity Alert',
        url: result.url || result.link,
        content: result.content || result.snippet || '',
        detected_at: new Date(),
        keywords_matched: matchedOppKeywords,
        query_used: result.query_used,
        result_data: result
      } as any)
    }
  }

  // Volume spike detection
  if (results.length > 10) {
    alerts.push({
      type: 'volume_spike',
      severity: 'high',
      source: 'fireplexity',
      title: `High volume: ${results.length} articles detected`,
      content: `Unusual volume of news coverage detected in monitoring window`,
      detected_at: new Date()
    } as any)
  }

  return alerts
}

function determineCrisisSeverity(
  keywords: string[],
  content: string,
  title: string
): 'critical' | 'high' | 'medium' | 'low' {
  // Critical crisis keywords
  const critical = ['death', 'deaths', 'killed', 'explosion', 'fire', 'hack', 'hacked', 'breach']
  if (keywords.some(kw => critical.includes(kw.toLowerCase()))) {
    return 'critical'
  }

  // High severity keywords
  const high = ['recall', 'lawsuit', 'investigation', 'fraud', 'scandal']
  if (keywords.some(kw => high.includes(kw.toLowerCase()))) {
    return 'high'
  }

  // Multiple crisis keywords = higher severity
  if (keywords.length >= 3) {
    return 'high'
  }

  if (keywords.length >= 2) {
    return 'medium'
  }

  return 'medium'
}

function calculateConfidence(alert: Alert): number {
  let confidence = 50 // Base confidence

  // More matched keywords = higher confidence
  if (alert.keywords_matched) {
    confidence += Math.min(30, alert.keywords_matched.length * 10)
  }

  // Longer content = more context = higher confidence
  if (alert.content && alert.content.length > 500) {
    confidence += 10
  }

  // Has URL = more reliable source
  if (alert.url) {
    confidence += 10
  }

  return Math.min(100, confidence)
}

// Default keywords
const DEFAULT_CRISIS_KEYWORDS = [
  'recall', 'lawsuit', 'investigation', 'breach', 'scandal',
  'fraud', 'death', 'injury', 'fire', 'explosion', 'leak',
  'hack', 'hacked', 'cybersecurity', 'ransomware', 'outage',
  'layoff', 'layoffs', 'bankruptcy', 'insolvent', 'crisis'
]

const DEFAULT_OPPORTUNITY_KEYWORDS = [
  'partnership', 'merger', 'acquisition', 'funding', 'investment',
  'expansion', 'launch', 'launches', 'winner', 'award',
  'growth', 'revenue', 'profit', 'profitable', 'breakthrough',
  'innovation', 'patent', 'approval', 'contract', 'deal'
]
