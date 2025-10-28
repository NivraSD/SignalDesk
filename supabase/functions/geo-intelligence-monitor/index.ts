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

    // TEST 2: Gemini AI Visibility
    console.log('🌟 Testing Gemini visibility...')
    const geminiResults = await testGeminiVisibility(queries, organization_name)
    signals.push(...geminiResults)

    // TEST 3: Perplexity AI Visibility (Sonar model with sources)
    console.log('🔮 Testing Perplexity visibility...')
    const perplexityResults = await testPerplexityVisibility(queries, organization_name)
    signals.push(...perplexityResults)

    // TEST 4: ChatGPT AI Visibility (GPT-4o)
    console.log('💬 Testing ChatGPT visibility...')
    const chatgptResults = await testChatGPTVisibility(queries, organization_name)
    signals.push(...chatgptResults)

    // TEST 5: Competitor Schema Extraction (via Firecrawl)
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

    // STEP 4: Generate Executive Synthesis
    console.log('🎯 Generating executive synthesis from GEO results...')
    let synthesis = null

    try {
      // Convert signals to GEOTestResult format for synthesis
      const geoResults = signals
        .filter(s => s.type === 'ai_visibility' || s.type === 'visibility_gap')
        .map(signal => ({
          query: signal.data?.query || '',
          intent: 'unknown', // Could enhance this
          priority: signal.priority,
          platform: signal.platform,
          response: signal.data?.context || '',
          brand_mentioned: signal.data?.mentioned || false,
          rank: signal.data?.position,
          context_quality: signal.data?.mentioned ? 'strong' : 'weak',
          competitors_mentioned: []
        }))

      // Fetch geo_targets for context
      const { data: geoTargets } = await supabase
        .from('geo_targets')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('active', true)
        .single()

      const synthesisResponse = await fetch(
        `${supabaseUrl}/functions/v1/geo-executive-synthesis`,
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
            geo_results: geoResults,
            geo_targets: geoTargets
          })
        }
      )

      if (synthesisResponse.ok) {
        const synthesisData = await synthesisResponse.json()
        synthesis = synthesisData.synthesis
        console.log('✅ Executive synthesis generated')
      } else {
        console.error('Synthesis generation failed:', await synthesisResponse.text())
      }
    } catch (error) {
      console.error('Failed to generate synthesis:', error)
    }

    // Generate summary
    const summary = {
      total_queries: queries.length,
      total_signals: signals.length,
      claude_mentions: signals.filter(s => s.platform === 'claude' && s.data?.mentioned).length,
      gemini_mentions: signals.filter(s => s.platform === 'gemini' && s.data?.mentioned).length,
      perplexity_mentions: signals.filter(s => s.platform === 'perplexity' && s.data?.mentioned).length,
      chatgpt_mentions: signals.filter(s => s.platform === 'chatgpt' && s.data?.mentioned).length,
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
        queries_tested: queries.length,
        synthesis // Include executive synthesis
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
 * Test Gemini visibility (via Direct Gemini API)
 * Much simpler than Vertex AI - just uses API key!
 */
async function testGeminiVisibility(
  queries: any[],
  organizationName: string
): Promise<any[]> {
  const signals: any[] = []

  // Use Direct Gemini API (simpler than Vertex AI)
  const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY') || 'AIzaSyBwiqy6i_fB_-u82B0tmJiBLGkg_Zu3lvc'

  if (!GOOGLE_API_KEY) {
    console.log('⚠️  Google API key not found, skipping Gemini tests')
    return signals
  }

  console.log('🌟 Using Direct Gemini API (simple API key authentication)')

  // Test first 5 queries
  for (const q of queries.slice(0, 5)) {
    try {
      // Call Direct Gemini API (no OAuth needed!)
      // Use gemini-2.0-flash-001 (Gemini 2.0 Flash model)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: `${q.query}\n\nProvide comprehensive recommendations with sources.` }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024
            },
            // ENABLE SEARCH GROUNDING TO GET SOURCES!
            tools: [{
              googleSearchRetrieval: {
                dynamicRetrievalConfig: {
                  mode: 'MODE_DYNAMIC',
                  dynamicThreshold: 0.3
                }
              }
            }]
          })
        }
      )

      if (!response.ok) {
        console.error('Gemini API error:', await response.text())
        continue
      }

      const data = await response.json()
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

      // EXTRACT GROUNDING SOURCES (the goldmine for PR!)
      const groundingMetadata = data.candidates?.[0]?.groundingMetadata
      const sources = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        url: chunk.web?.uri || '',
        title: chunk.web?.title || '',
        snippet: chunk.web?.snippet || ''
      })) || []

      console.log(`  📚 Gemini cited ${sources.length} sources for "${q.query}"`)
      if (sources.length > 0) {
        console.log(`     Sources: ${sources.map((s: any) => s.url).join(', ')}`)
      }

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
            context: extractContext(responseText, organizationName),
            sources: sources,
            source_count: sources.length,
            source_domains: sources.map(s => new URL(s.url).hostname).filter(h => h)
          },
          recommendation: {
            action: position > 3 ? 'improve_ranking' : 'maintain_visibility',
            reasoning: `Brand mentioned in position ${position} on Gemini${sources.length > 0 ? `. Sources cited: ${sources.map(s => new URL(s.url).hostname).join(', ')}` : ''}`
          }
        })
      } else {
        signals.push({
          type: 'visibility_gap',
          platform: 'gemini',
          priority: q.priority === 'critical' ? 'critical' : 'high',
          data: {
            query: q.query,
            mentioned: false,
            sources: sources,
            source_count: sources.length,
            source_domains: sources.map(s => new URL(s.url).hostname).filter(h => h)
          },
          recommendation: {
            action: 'improve_schema',
            reasoning: `Not visible on Gemini for: "${q.query}"${sources.length > 0 ? `. Target these publications for PR: ${sources.slice(0, 3).map(s => new URL(s.url).hostname).join(', ')}` : ''}`
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
 * Test Perplexity AI Visibility (Sonar model with built-in sources)
 */
async function testPerplexityVisibility(queries: any[], organizationName: string): Promise<any[]> {
  const signals: any[] = []
  const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY')

  if (!PERPLEXITY_API_KEY) {
    console.log('⚠️  Perplexity not configured, skipping')
    return signals
  }

  // Test subset of queries (Perplexity is more expensive)
  const testQueries = queries.slice(0, 5)

  for (const q of testQueries) {
    try {
      console.log(`  🔮 Testing: "${q.query}"`)

      // Call Perplexity API (OpenAI-compatible format)
      // Using sonar model which provides citations
      const response = await fetch(
        'https://api.perplexity.ai/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
          },
          body: JSON.stringify({
            model: 'sonar', // or 'sonar-pro' for better quality
            messages: [{
              role: 'user',
              content: `${q.query}\n\nProvide a comprehensive answer with sources.`
            }],
            temperature: 0.7,
            max_tokens: 1024,
            return_citations: true, // Enable citations
            return_images: false
          })
        }
      )

      if (!response.ok) {
        console.error('Perplexity API error:', await response.text())
        continue
      }

      const data = await response.json()
      const responseText = data.choices?.[0]?.message?.content || ''

      // EXTRACT CITATIONS (Perplexity's killer feature!)
      const citations = data.citations || []
      const sources = citations.map((url: string) => {
        try {
          const urlObj = new URL(url)
          return {
            url: url,
            title: urlObj.hostname,
            snippet: ''
          }
        } catch {
          return { url, title: url, snippet: '' }
        }
      })

      console.log(`  📚 Perplexity cited ${sources.length} sources for "${q.query}"`)
      if (sources.length > 0) {
        console.log(`     Sources: ${sources.map((s: any) => s.url).join(', ')}`)
      }

      const mentioned = responseText.toLowerCase().includes(organizationName.toLowerCase())
      const position = extractMentionPosition(responseText, organizationName)

      if (mentioned) {
        signals.push({
          type: 'ai_visibility',
          platform: 'perplexity',
          priority: position <= 3 ? 'high' : 'medium',
          data: {
            query: q.query,
            mentioned: true,
            position,
            context: extractContext(responseText, organizationName),
            sources: sources,
            source_count: sources.length,
            source_domains: sources.map(s => {
              try {
                return new URL(s.url).hostname
              } catch {
                return s.url
              }
            }).filter(h => h)
          },
          recommendation: {
            action: position > 3 ? 'improve_ranking' : 'maintain_visibility',
            reasoning: `Brand mentioned in position ${position} on Perplexity${sources.length > 0 ? `. Sources cited: ${sources.slice(0, 3).map(s => new URL(s.url).hostname).join(', ')}` : ''}`
          }
        })
      } else {
        signals.push({
          type: 'visibility_gap',
          platform: 'perplexity',
          priority: q.priority === 'critical' ? 'critical' : 'high',
          data: {
            query: q.query,
            mentioned: false,
            sources: sources,
            source_count: sources.length,
            source_domains: sources.map(s => {
              try {
                return new URL(s.url).hostname
              } catch {
                return s.url
              }
            }).filter(h => h)
          },
          recommendation: {
            action: 'improve_schema',
            reasoning: `Not visible on Perplexity for: "${q.query}"${sources.length > 0 ? `. Target these publications for PR: ${sources.slice(0, 3).map(s => {
              try {
                return new URL(s.url).hostname
              } catch {
                return s.url
              }
            }).join(', ')}` : ''}`
          }
        })
      }

    } catch (error) {
      console.error('Perplexity API error:', error)
    }
  }

  return signals
}

/**
 * Test ChatGPT AI Visibility (GPT-4o)
 */
async function testChatGPTVisibility(queries: any[], organizationName: string): Promise<any[]> {
  const signals: any[] = []
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

  if (!OPENAI_API_KEY) {
    console.log('⚠️  OpenAI not configured, skipping ChatGPT testing')
    return signals
  }

  for (const q of queries) {
    try {
      console.log(`  💬 Testing: "${q.query}"`)

      // Call OpenAI API with GPT-4o
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{
              role: 'user',
              content: `${q.query}\n\nProvide a comprehensive answer.`
            }],
            temperature: 0.7,
            max_tokens: 1024
          })
        }
      )

      if (!response.ok) {
        console.error('OpenAI API error:', await response.text())
        continue
      }

      const data = await response.json()
      const responseText = data.choices?.[0]?.message?.content || ''

      // Note: ChatGPT API doesn't provide sources natively
      // Would need to use web search plugins/extensions which require special access

      const mentioned = responseText.toLowerCase().includes(organizationName.toLowerCase())
      const position = extractMentionPosition(responseText, organizationName)

      if (mentioned) {
        signals.push({
          type: 'ai_visibility',
          platform: 'chatgpt',
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
            reasoning: `Brand mentioned in position ${position} on ChatGPT (GPT-4o)`
          }
        })
      } else {
        signals.push({
          type: 'visibility_gap',
          platform: 'chatgpt',
          priority: q.priority === 'critical' ? 'critical' : 'high',
          data: {
            query: q.query,
            mentioned: false
          },
          recommendation: {
            action: 'improve_schema',
            reasoning: `Not visible on ChatGPT (GPT-4o) for: "${q.query}"`
          }
        })
      }

    } catch (error) {
      console.error('OpenAI API error:', error)
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
