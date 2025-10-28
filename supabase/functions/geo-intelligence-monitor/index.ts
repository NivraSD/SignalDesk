import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * GEO INTELLIGENCE MONITOR
 *
 * Tests AI visibility across Claude and Gemini using organization-specific queries
 * from GEOIntelligenceRegistry. Extracts competitor schemas via Firecrawl.
 * Generates actionable GEO recommendations.
 *
 * Flow:
 * 1. Get organization details (name, industry, competitors)
 * 2. Generate industry-specific AI queries from GEOIntelligenceRegistry
 * 3. Test queries against Claude + Gemini
 * 4. Extract competitor schemas via Firecrawl
 * 5. Analyze gaps and generate recommendations
 * 6. Save intelligence signals to geo_intelligence table
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      industry
    } = await req.json()

    if (!organization_id || !organization_name) {
      throw new Error('organization_id and organization_name required')
    }

    console.log('🎯 GEO Intelligence Monitor Starting:', {
      organization_id,
      organization_name,
      industry,
      timestamp: new Date().toISOString()
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get organization details including competitors
    console.log('📊 Fetching organization profile...')
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organization_id)
      .single()

    if (orgError) {
      console.error('Organization fetch error:', orgError)
    }

    const orgIndustry = industry || org?.industry || 'technology'
    const orgCompetitors = org?.competitors || []

    console.log(`📈 Organization Industry: ${orgIndustry}`)
    console.log(`🏢 Competitors to monitor: ${orgCompetitors.length}`)

    // STEP 1: Use geo-query-discovery to generate intelligent queries
    console.log('🔍 Calling GEO Query Discovery for intelligent query generation...')
    let queries: any[] = []

    try {
      const queryDiscoveryResponse = await fetch(
        `${supabaseUrl}/functions/v1/geo-query-discovery`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            organization_id,
            organization_name,
            industry: orgIndustry,
            competitors: orgCompetitors
          })
        }
      )

      if (!queryDiscoveryResponse.ok) {
        throw new Error('Query discovery failed')
      }

      const queryDiscoveryData = await queryDiscoveryResponse.json()
      console.log(`✅ Query Discovery Complete: ${queryDiscoveryData.total_queries} queries generated`)

      // Get mix of high-priority queries for testing (limit to 10 for cost control)
      queries = [
        ...(queryDiscoveryData.queries?.critical || []).slice(0, 4),
        ...(queryDiscoveryData.queries?.high || []).slice(0, 4),
        ...(queryDiscoveryData.queries?.medium || []).slice(0, 2)
      ]
    } catch (error) {
      console.error('Query discovery failed, falling back to simple patterns:', error)
      // Fallback to simple pattern generation
      queries = generateIndustryQueries(orgIndustry, organization_name, orgCompetitors)
    }

    console.log(`🔍 Testing ${queries.length} queries`)

    const signals: any[] = []

    // TEST 1: Claude AI Visibility
    console.log('🤖 Testing Claude visibility...')
    const claudeResults = await testClaudeVisibility(queries, organization_name)
    signals.push(...claudeResults)

    // TEST 2: Gemini AI Visibility (via Vertex AI)
    console.log('🌟 Testing Gemini visibility...')
    const geminiResults = await testGeminiVisibility(queries, organization_name)
    signals.push(...geminiResults)

    // TEST 3: Competitor Schema Extraction (via Firecrawl)
    if (orgCompetitors.length > 0) {
      console.log('🔎 Extracting competitor schemas...')
      const schemaResults = await extractCompetitorSchemas(orgCompetitors.slice(0, 3)) // Top 3 competitors
      signals.push(...schemaResults)
    }

    // Save signals to database
    console.log(`💾 Saving ${signals.length} intelligence signals...`)

    const signalsToInsert = signals.map(signal => ({
      organization_id,
      signal_type: signal.type,
      platform: signal.platform,
      priority: signal.priority,
      data: signal.data,
      recommendation: signal.recommendation,
      created_at: new Date().toISOString()
    }))

    if (signalsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('geo_intelligence')
        .insert(signalsToInsert)

      if (insertError) {
        console.error('Failed to save signals:', insertError)
      } else {
        console.log('✅ Saved all signals to database')
      }
    }

    // Generate summary
    const summary = {
      total_queries: queries.length,
      total_signals: signals.length,
      claude_mentions: signals.filter(s => s.platform === 'claude' && s.data?.mentioned).length,
      gemini_mentions: signals.filter(s => s.platform === 'gemini' && s.data?.mentioned).length,
      schema_gaps: signals.filter(s => s.type === 'schema_gap').length,
      competitor_updates: signals.filter(s => s.type === 'competitor_update').length,
      critical_signals: signals.filter(s => s.priority === 'critical').length
    }

    console.log('📊 GEO Monitor Summary:', summary)

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        signals: signals.slice(0, 10), // Return top 10 signals
        queries_tested: queries.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('❌ GEO Monitor Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Generate industry-specific queries
 * This mirrors the GEOIntelligenceRegistry approach
 */
function generateIndustryQueries(
  industry: string,
  organizationName: string,
  competitors: string[]
): Array<{ query: string; intent: string; priority: string }> {
  // Industry-specific query patterns (simplified version of GEOIntelligenceRegistry)
  const industryPatterns: Record<string, any> = {
    technology: [
      { pattern: 'best [category] software', intent: 'comparison', priority: 'critical' },
      { pattern: 'alternatives to [competitor]', intent: 'competitive', priority: 'critical' },
      { pattern: '[product] vs [competitor]', intent: 'comparison', priority: 'high' }
    ],
    saas: [
      { pattern: 'best [category] software', intent: 'comparison', priority: 'critical' },
      { pattern: 'alternatives to [competitor]', intent: 'competitive', priority: 'critical' },
      { pattern: '[product] pricing', intent: 'transactional', priority: 'critical' }
    ],
    finance: [
      { pattern: 'best [service]', intent: 'comparison', priority: 'critical' },
      { pattern: '[service] comparison', intent: 'comparison', priority: 'high' }
    ],
    healthcare: [
      { pattern: 'best [specialty] near me', intent: 'local', priority: 'critical' },
      { pattern: '[service] cost', intent: 'informational', priority: 'high' }
    ],
    ecommerce: [
      { pattern: 'buy [product]', intent: 'transactional', priority: 'critical' },
      { pattern: '[product] reviews', intent: 'research', priority: 'critical' }
    ],
    // Default fallback
    default: [
      { pattern: 'best [category]', intent: 'comparison', priority: 'high' },
      { pattern: '[company] reviews', intent: 'research', priority: 'medium' }
    ]
  }

  const normalizedIndustry = industry.toLowerCase().replace(/[^a-z]/g, '')
  const patterns = industryPatterns[normalizedIndustry] || industryPatterns.default

  const queries: any[] = []

  // Generate queries from patterns
  patterns.forEach((pattern: any) => {
    // Replace placeholders
    let query = pattern.pattern
    query = query.replace('[product]', organizationName)
    query = query.replace('[company]', organizationName)
    query = query.replace('[service]', organizationName)
    query = query.replace('[category]', inferCategory(organizationName))

    queries.push({
      query,
      intent: pattern.intent,
      priority: pattern.priority
    })

    // Add competitor comparison queries
    if (competitors.length > 0 && pattern.pattern.includes('[competitor]')) {
      competitors.slice(0, 2).forEach(competitor => {
        const competitorQuery = pattern.pattern
          .replace('[competitor]', competitor)
          .replace('[product]', organizationName)

        queries.push({
          query: competitorQuery,
          intent: pattern.intent,
          priority: pattern.priority
        })
      })
    }
  })

  return queries.slice(0, 10) // Limit to 10 queries to avoid excessive API calls
}

/**
 * Test Claude visibility
 */
async function testClaudeVisibility(
  queries: any[],
  organizationName: string
): Promise<any[]> {
  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY')
  })

  const signals: any[] = []

  // Test first 5 queries to avoid excessive API costs
  for (const q of queries.slice(0, 5)) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `${q.query}\n\nPlease provide a comprehensive answer with specific product/service recommendations.`
        }]
      })

      const responseText = message.content[0].type === 'text'
        ? message.content[0].text
        : ''

      const mentioned = responseText.toLowerCase().includes(organizationName.toLowerCase())
      const position = extractMentionPosition(responseText, organizationName)

      if (mentioned) {
        signals.push({
          type: 'ai_visibility',
          platform: 'claude',
          priority: position <= 3 ? 'high' : 'medium',
          data: {
            query: q.query,
            mentioned: true,
            position,
            context: extractContext(responseText, organizationName),
            response_length: responseText.length
          },
          recommendation: {
            action: position > 3 ? 'improve_ranking' : 'maintain_visibility',
            reasoning: `Brand mentioned in position ${position} for query: "${q.query}"`
          }
        })
      } else {
        signals.push({
          type: 'visibility_gap',
          platform: 'claude',
          priority: q.priority === 'critical' ? 'critical' : 'high',
          data: {
            query: q.query,
            mentioned: false,
            competitors_mentioned: extractCompetitors(responseText)
          },
          recommendation: {
            action: 'improve_schema',
            reasoning: `Not mentioned for important query: "${q.query}". Consider schema optimization.`
          }
        })
      }

    } catch (error) {
      console.error('Claude API error:', error)
    }
  }

  return signals
}

/**
 * Test Gemini visibility (via Vertex AI)
 */
async function testGeminiVisibility(
  queries: any[],
  organizationName: string
): Promise<any[]> {
  const signals: any[] = []

  // Use same pattern as vertex-ai-visual function
  const GOOGLE_CLOUD_PROJECT_ID = 'sigdesk-1753801804417'
  const GOOGLE_CLOUD_REGION = 'us-central1'

  // Check if Vertex AI credentials are available
  const GOOGLE_SERVICE_ACCOUNT = Deno.env.get('GOOGLE_SERVICE_ACCOUNT')
  const GOOGLE_APPLICATION_CREDENTIALS = Deno.env.get('GOOGLE_APPLICATION_CREDENTIALS')
  const GOOGLE_ACCESS_TOKEN = Deno.env.get('GOOGLE_ACCESS_TOKEN')

  if (!GOOGLE_SERVICE_ACCOUNT && !GOOGLE_APPLICATION_CREDENTIALS && !GOOGLE_ACCESS_TOKEN) {
    console.log('⚠️  Vertex AI not configured, skipping Gemini tests')
    return signals
  }

  // Get access token (use same logic as vertex-ai-visual)
  let accessToken = GOOGLE_ACCESS_TOKEN

  if (!accessToken && GOOGLE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT)
      // For now, skip complex token generation - will use simpler approach
      console.log('⚠️  Service account detected but token generation not implemented, skipping Gemini')
      return signals
    } catch (e) {
      console.log('⚠️  Invalid service account JSON, skipping Gemini')
      return signals
    }
  }

  if (!accessToken && GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS)
      // Similar - skip for now
      console.log('⚠️  Credentials detected but token generation not implemented, skipping Gemini')
      return signals
    } catch (e) {
      // Maybe it's already a token
      if (GOOGLE_APPLICATION_CREDENTIALS.startsWith('ya29.')) {
        accessToken = GOOGLE_APPLICATION_CREDENTIALS
      }
    }
  }

  if (!accessToken) {
    console.log('⚠️  No valid access token found, skipping Gemini tests')
    return signals
  }

  // Test first 5 queries
  for (const q of queries.slice(0, 5)) {
    try {
      // Call Vertex AI Gemini API
      const response = await fetch(
        `https://${GOOGLE_CLOUD_REGION}-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT_ID}/locations/${GOOGLE_CLOUD_REGION}/publishers/google/models/gemini-pro:generateContent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: `${q.query}\n\nProvide comprehensive recommendations.` }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024
            }
          })
        }
      )

      if (!response.ok) {
        console.error('Gemini API error:', await response.text())
        continue
      }

      const data = await response.json()
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

      const mentioned = responseText.toLowerCase().includes(organizationName.toLowerCase())
      const position = extractMentionPosition(responseText, organizationName)

      if (mentioned) {
        signals.push({
          type: 'ai_visibility',
          platform: 'gemini',
          priority: position <= 3 ? 'high' : 'medium',
          data: {
            query: q.query,
            mentioned: true,
            position,
            context: extractContext(responseText, organizationName)
          },
          recommendation: {
            action: position > 3 ? 'improve_ranking' : 'maintain_visibility',
            reasoning: `Brand mentioned in position ${position} on Gemini`
          }
        })
      } else {
        signals.push({
          type: 'visibility_gap',
          platform: 'gemini',
          priority: q.priority === 'critical' ? 'critical' : 'high',
          data: {
            query: q.query,
            mentioned: false
          },
          recommendation: {
            action: 'improve_schema',
            reasoning: `Not visible on Gemini for: "${q.query}"`
          }
        })
      }

    } catch (error) {
      console.error('Gemini API error:', error)
    }
  }

  return signals
}

/**
 * Extract competitor schemas via Firecrawl
 */
async function extractCompetitorSchemas(competitorUrls: string[]): Promise<any[]> {
  const signals: any[] = []
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')

  if (!firecrawlApiKey) {
    console.log('⚠️  Firecrawl not configured, skipping schema extraction')
    return signals
  }

  for (const url of competitorUrls) {
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          formats: ['html'],
          onlyMainContent: false
        })
      })

      if (!response.ok) {
        console.error('Firecrawl error for', url, await response.text())
        continue
      }

      const data = await response.json()
      const html = data.data?.html || ''

      // Extract schema.org JSON-LD
      const schemas = extractSchemasFromHTML(html)

      if (schemas.length > 0) {
        signals.push({
          type: 'competitor_update',
          platform: 'firecrawl',
          priority: 'medium',
          data: {
            competitor_url: url,
            schemas_found: schemas.length,
            schema_types: schemas.map((s: any) => s['@type']),
            schemas: schemas
          },
          recommendation: {
            action: 'review_competitor_schemas',
            reasoning: `Competitor has ${schemas.length} schemas: ${schemas.map((s: any) => s['@type']).join(', ')}`
          }
        })
      }

    } catch (error) {
      console.error('Schema extraction error:', error)
    }
  }

  return signals
}

// Helper functions

function inferCategory(name: string): string {
  // Simple category inference
  if (name.toLowerCase().includes('crm')) return 'CRM'
  if (name.toLowerCase().includes('analytics')) return 'analytics'
  return 'software'
}

function extractMentionPosition(text: string, name: string): number {
  const sentences = text.split(/[.!?]+/)
  for (let i = 0; i < sentences.length; i++) {
    if (sentences[i].toLowerCase().includes(name.toLowerCase())) {
      return i + 1
    }
  }
  return 999
}

function extractContext(text: string, name: string): string {
  const sentences = text.split(/[.!?]+/)
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(name.toLowerCase())) {
      return sentence.trim()
    }
  }
  return ''
}

function extractCompetitors(text: string): string[] {
  // Simple competitor extraction (could be enhanced with NER)
  const competitors: string[] = []
  const commonCompetitors = ['Salesforce', 'HubSpot', 'Microsoft', 'Google', 'Amazon', 'Oracle']

  for (const comp of commonCompetitors) {
    if (text.includes(comp)) {
      competitors.push(comp)
    }
  }

  return competitors
}

function extractSchemasFromHTML(html: string): any[] {
  const schemas: any[] = []

  // Extract JSON-LD schemas
  const scriptMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gs)

  for (const match of scriptMatches) {
    try {
      const schema = JSON.parse(match[1])
      schemas.push(schema)
    } catch (e) {
      // Invalid JSON, skip
    }
  }

  return schemas
}
