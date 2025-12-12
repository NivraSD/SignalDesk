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
  // Always handle CORS
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
      return new Response(
        JSON.stringify({
          error: 'organization_id and organization_name required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
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

    // FETCH ACTIVE SCHEMA for performance tracking
    console.log('📋 Fetching active schema...')
    let activeSchema: any = null
    try {
      const { data: schema } = await supabase
        .from('content_library')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('content_type', 'schema')
        .eq('folder', 'Schemas/Active/')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (schema) {
        activeSchema = schema
        console.log(`✅ Found active schema: ${schema.metadata?.schema_type || 'Unknown'}`)
      } else {
        console.log('⚠️  No active schema found - schema performance tracking disabled')
      }
    } catch (error) {
      console.log('⚠️  Could not fetch schema:', error)
    }

    const signals: any[] = []
    const platformPerformance: Record<string, any[]> = {
      claude: [],
      gemini: [],
      perplexity: [],
      chatgpt: []
    }

    // RUN META-ANALYSIS ACROSS ALL PLATFORMS (Single comprehensive query per platform)
    console.log('🚀 Running meta-analysis across all platforms (1 comprehensive query each)...')
    const [claudeResults, geminiResults, perplexityResults, chatgptResults] = await Promise.all([
      testClaudeMetaAnalysis(queries, organization_name, orgIndustry, org?.website),
      testGeminiMetaAnalysis(queries, organization_name, orgIndustry, org?.website),
      testPerplexityMetaAnalysis(queries, organization_name, orgIndustry, org?.website),
      testChatGPTMetaAnalysis(queries, organization_name, orgIndustry, org?.website)
    ])

    // Aggregate results
    signals.push(...claudeResults, ...geminiResults, ...perplexityResults, ...chatgptResults)
    platformPerformance.claude = claudeResults.filter(r => r.type === 'ai_visibility' || r.type === 'visibility_gap')
    platformPerformance.gemini = geminiResults.filter(r => r.type === 'ai_visibility' || r.type === 'visibility_gap')
    platformPerformance.perplexity = perplexityResults.filter(r => r.type === 'ai_visibility' || r.type === 'visibility_gap')
    platformPerformance.chatgpt = chatgptResults.filter(r => r.type === 'ai_visibility' || r.type === 'visibility_gap')

    // TEST 5: Competitor Schema Extraction (via Firecrawl)
    if (orgCompetitors.length > 0) {
      console.log('🔎 Extracting competitor schemas...')
      const schemaResults = await extractCompetitorSchemas(orgCompetitors.slice(0, 3)) // Top 3 competitors
      signals.push(...schemaResults)
    }

    // TRACK SCHEMA PERFORMANCE
    if (activeSchema) {
      console.log('📊 Updating schema performance data...')
      try {
        const intelligence = activeSchema.intelligence || {}
        const platforms = intelligence.platforms || {}
        const performanceHistory = intelligence.performance_history || []

        // Calculate performance for each platform
        for (const [platform, results] of Object.entries(platformPerformance)) {
          const mentionedCount = results.filter(r => r.data?.mentioned).length
          const totalTests = results.length

          if (totalTests > 0) {
            const avgRank = results
              .filter(r => r.data?.position && r.data.position < 999)
              .reduce((sum, r) => sum + (r.data.position || 0), 0) / (mentionedCount || 1)

            platforms[platform] = {
              mentioned: mentionedCount > 0,
              mention_rate: totalTests > 0 ? (mentionedCount / totalTests) * 100 : 0,
              avg_rank: avgRank || null,
              total_tests: totalTests,
              last_tested: new Date().toISOString()
            }

            // Add to performance history
            results.forEach(result => {
              performanceHistory.push({
                date: new Date().toISOString(),
                platform,
                query: result.data?.query || '',
                mentioned: result.data?.mentioned || false,
                rank: result.data?.position,
                context_quality: result.data?.mentioned ? 'strong' : 'weak'
              })
            })
          }
        }

        // Keep only last 100 performance records
        const recentHistory = performanceHistory.slice(-100)

        // Update schema with performance data
        const { error: schemaUpdateError } = await supabase
          .from('content_library')
          .update({
            intelligence: {
              ...intelligence,
              platforms,
              performance_history: recentHistory,
              lastTested: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', activeSchema.id)

        if (schemaUpdateError) {
          console.error('Failed to update schema performance:', schemaUpdateError)
        } else {
          console.log('✅ Schema performance updated successfully')

          // Log performance summary
          console.log('📊 Performance Summary:')
          Object.entries(platforms).forEach(([platform, perf]: [string, any]) => {
            console.log(`  ${platform}: ${perf.mention_rate.toFixed(1)}% mention rate, avg rank: ${perf.avg_rank?.toFixed(1) || 'N/A'}`)
          })
        }
      } catch (error) {
        console.error('Error tracking schema performance:', error)
      }
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

      // Skip synthesis if no results to analyze
      if (geoResults.length === 0) {
        console.log('⚠️  No GEO results to synthesize, skipping executive synthesis')
      } else {
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
 * Build comprehensive meta-analysis prompt
 */
function buildMetaAnalysisPrompt(
  organizationName: string,
  industry: string,
  website: string | undefined,
  queries: any[]
): string {
  const queryList = queries.slice(0, 10).map((q, idx) =>
    `${idx + 1}. "${q.query}" (${q.intent || 'informational'}, priority: ${q.priority || 'medium'})`
  ).join('\n')

  return `You are conducting a GEO (Generative Engine Optimization) visibility analysis for ${organizationName}, ${industry ? `a ${industry} company` : 'an organization'}.

CONTEXT:
- Organization: ${organizationName}
- Industry: ${industry || 'Not specified'}
${website ? `- Website: ${website}` : ''}

YOUR TASK:
Simulate what happens when potential clients search for services in this space. For each query scenario below, analyze ${organizationName}'s visibility and competitive positioning.

QUERY SCENARIOS TO ANALYZE:
${queryList}

Please provide your analysis in valid JSON format (no markdown, just JSON):

{
  "overall_visibility": "high|medium|low|none",
  "visibility_summary": "2-3 sentence assessment of ${organizationName}'s overall presence across these query types",

  "query_results": [
    {
      "query": "the query text",
      "organizations_mentioned": ["Org1", "Org2", "Org3"],
      "target_mentioned": true/false,
      "target_rank": 1-10 or null,
      "why_these_appeared": "Brief explanation of what made these organizations appear",
      "sources_cited": ["domain1.com", "domain2.com"],
      "what_target_needs": "Specific gap ${organizationName} should address"
    }
  ],

  "competitive_intelligence": {
    "dominant_competitors": ["Top 3-5 organizations that appear most frequently"],
    "success_factors": "What makes certain organizations appear consistently (schema, content, authority signals)",
    "industry_patterns": "Common characteristics of high-visibility firms in this space"
  },

  "recommendations": [
    {
      "priority": "critical|high|medium",
      "category": "schema|content|pr|technical",
      "action": "Specific action ${organizationName} should take",
      "reasoning": "Why this matters based on competitive analysis",
      "expected_impact": "How this would improve visibility"
    }
  ],

  "source_intelligence": {
    "most_cited_sources": ["Publications/sites you reference most"],
    "why_these_sources": "What makes these sources authoritative to you",
    "coverage_strategy": "Where ${organizationName} should get featured to improve visibility"
  }
}

CRITICAL: Be honest about ${organizationName}'s current visibility. If they don't appear, say so. Base recommendations on real competitive gaps you observe.`
}

/**
 * META-ANALYSIS: Test Claude with comprehensive single-query analysis
 */
async function testClaudeMetaAnalysis(
  queries: any[],
  organizationName: string,
  industry: string,
  website: string | undefined
): Promise<any[]> {
  console.log('🔮 Running Claude meta-analysis...')

  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY')
  })

  const signals: any[] = []

  try {
    const prompt = buildMetaAnalysisPrompt(organizationName, industry, website, queries)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : ''

    console.log('📝 Claude meta-analysis response length:', responseText.length)

    // Parse JSON response
    let analysis: any
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
        console.log('✅ Parsed Claude meta-analysis:', {
          overall_visibility: analysis.overall_visibility,
          query_results_count: analysis.query_results?.length || 0,
          recommendations_count: analysis.recommendations?.length || 0
        })
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('❌ Failed to parse Claude meta-analysis:', parseError)
      console.log('Raw response:', responseText.substring(0, 500))
      // Return empty results if parsing fails
      return signals
    }

    // Convert meta-analysis to signals format
    for (const queryResult of (analysis.query_results || [])) {
      if (queryResult.target_mentioned) {
        signals.push({
          type: 'ai_visibility',
          platform: 'claude',
          priority: queryResult.target_rank <= 3 ? 'high' : 'medium',
          data: {
            query: queryResult.query,
            mentioned: true,
            position: queryResult.target_rank || 999,
            context: queryResult.why_these_appeared,
            competitors_mentioned: queryResult.organizations_mentioned || [],
            meta_insights: {
              sources_cited: queryResult.sources_cited,
              what_target_needs: queryResult.what_target_needs
            }
          },
          recommendation: {
            action: queryResult.target_rank > 3 ? 'improve_ranking' : 'maintain_visibility',
            reasoning: `Ranked #${queryResult.target_rank}: ${queryResult.why_these_appeared}`
          }
        })
      } else {
        signals.push({
          type: 'visibility_gap',
          platform: 'claude',
          priority: 'high',
          data: {
            query: queryResult.query,
            mentioned: false,
            competitors_mentioned: queryResult.organizations_mentioned || [],
            meta_insights: {
              why_missing: queryResult.why_these_appeared,
              what_target_needs: queryResult.what_target_needs,
              sources_cited: queryResult.sources_cited
            }
          },
          recommendation: {
            action: 'improve_visibility',
            reasoning: queryResult.what_target_needs
          }
        })
      }
    }

    // Add competitive intelligence signal
    if (analysis.competitive_intelligence) {
      signals.push({
        type: 'competitive_intelligence',
        platform: 'claude',
        priority: 'medium',
        data: {
          dominant_competitors: analysis.competitive_intelligence.dominant_competitors,
          success_factors: analysis.competitive_intelligence.success_factors,
          industry_patterns: analysis.competitive_intelligence.industry_patterns
        }
      })
    }

    // Add source intelligence signal
    if (analysis.source_intelligence) {
      signals.push({
        type: 'source_intelligence',
        platform: 'claude',
        priority: 'medium',
        data: {
          most_cited_sources: analysis.source_intelligence.most_cited_sources,
          why_these_sources: analysis.source_intelligence.why_these_sources,
          coverage_strategy: analysis.source_intelligence.coverage_strategy
        }
      })
    }

    console.log(`✅ Claude meta-analysis complete: ${signals.length} signals generated`)

  } catch (error) {
    console.error('❌ Claude meta-analysis error:', error)
  }

  return signals
}

// Placeholder stubs for other platforms (to be implemented)
async function testGeminiMetaAnalysis(
  queries: any[],
  organizationName: string,
  industry: string,
  website: string | undefined
): Promise<any[]> {
  console.log(`🔮 Running Gemini meta-analysis for ${organizationName}`)
  console.log(`📋 Testing ${queries.length} queries: ${queries.slice(0, 5).map(q => q.query).join(' | ')}`)

  const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
  if (!GOOGLE_API_KEY) {
    console.log('⚠️ Google API key not found, skipping Gemini')
    return []
  }

  const signals: any[] = []

  try {
    // Use same meta-analysis prompt approach as Claude
    const prompt = buildMetaAnalysisPrompt(organizationName, industry, website, queries)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096
          },
          tools: [{ google_search: {} }]
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Gemini API error:', errorText)
      return []
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Extract grounding sources if available
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata
    const groundingSources = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      url: chunk.web?.uri || '',
      title: chunk.web?.title || ''
    })) || []

    console.log(`📚 Gemini grounding sources: ${groundingSources.length}`)
    if (groundingSources.length > 0) {
      console.log(`   Sources: ${groundingSources.slice(0, 3).map((s: any) => s.url).join(', ')}`)
    }

    // Parse JSON response (same as Claude)
    let analysis: any
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
        console.log('✅ Parsed Gemini meta-analysis:', {
          overall_visibility: analysis.overall_visibility,
          query_results_count: analysis.query_results?.length || 0,
          recommendations_count: analysis.recommendations?.length || 0
        })
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini meta-analysis:', parseError)
      console.log('Raw response preview:', responseText.substring(0, 500))
      return []
    }

    // Convert to signals (same structure as Claude)
    for (const queryResult of (analysis.query_results || [])) {
      if (queryResult.target_mentioned) {
        signals.push({
          type: 'ai_visibility',
          platform: 'gemini',
          priority: queryResult.target_rank <= 3 ? 'high' : 'medium',
          data: {
            query: queryResult.query,
            mentioned: true,
            position: queryResult.target_rank || 999,
            context: queryResult.why_these_appeared,
            competitors_mentioned: queryResult.organizations_mentioned || [],
            sources_cited: queryResult.sources_cited || groundingSources.map((s: any) => s.url),
            meta_insights: {
              what_target_needs: queryResult.what_target_needs
            }
          },
          recommendation: {
            action: queryResult.target_rank > 3 ? 'improve_ranking' : 'maintain_visibility',
            reasoning: `Ranked #${queryResult.target_rank}: ${queryResult.why_these_appeared}`
          }
        })
      } else {
        signals.push({
          type: 'visibility_gap',
          platform: 'gemini',
          priority: 'high',
          data: {
            query: queryResult.query,
            mentioned: false,
            competitors_mentioned: queryResult.organizations_mentioned || [],
            sources_cited: queryResult.sources_cited || groundingSources.map((s: any) => s.url),
            meta_insights: {
              why_missing: queryResult.why_these_appeared,
              what_target_needs: queryResult.what_target_needs
            }
          },
          recommendation: {
            action: 'improve_visibility',
            reasoning: queryResult.what_target_needs
          }
        })
      }
    }

    // Add competitive intelligence signal
    if (analysis.competitive_intelligence) {
      signals.push({
        type: 'competitive_intelligence',
        platform: 'gemini',
        priority: 'medium',
        data: {
          ...analysis.competitive_intelligence,
          grounding_sources: groundingSources
        }
      })
    }

    // Add source intelligence signal
    if (analysis.source_intelligence) {
      signals.push({
        type: 'source_intelligence',
        platform: 'gemini',
        priority: 'medium',
        data: {
          ...analysis.source_intelligence,
          grounding_sources: groundingSources
        }
      })
    }

    console.log(`✅ Gemini meta-analysis complete: ${signals.length} signals`)

  } catch (error) {
    console.error('❌ Gemini meta-analysis error:', error)
  }

  return signals
}

async function testPerplexityMetaAnalysis(
  queries: any[],
  organizationName: string,
  industry: string,
  website: string | undefined
): Promise<any[]> {
  console.log('⚠️ Perplexity meta-analysis not yet implemented, using fallback')
  return testPerplexityVisibility(queries, organizationName)
}

async function testChatGPTMetaAnalysis(
  queries: any[],
  organizationName: string,
  industry: string,
  website: string | undefined
): Promise<any[]> {
  console.log('⚠️ ChatGPT meta-analysis not yet implemented, using fallback')
  return testChatGPTVisibility(queries, organizationName)
}

/**
 * Test Claude visibility (OLD METHOD - kept for fallback)
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
  for (const q of queries.slice(0, 10)) {
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
  const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')

  if (!GOOGLE_API_KEY) {
    console.log('⚠️  Google API key not found, skipping Gemini tests')
    return signals
  }

  console.log('🌟 Using Direct Gemini API (simple API key authentication)')

  // Test first 5 queries
  for (const q of queries.slice(0, 10)) {
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
              google_search: {}
            }]
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Gemini API error for "${q.query}":`, errorText)
        continue
      }

      const data = await response.json()
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

      // EXTRACT GROUNDING SOURCES (the goldmine for PR!)
      // Check multiple possible locations for grounding data
      const candidate = data.candidates?.[0]
      const groundingMetadata = candidate?.groundingMetadata ||
                                candidate?.groundingChunks ||
                                data.groundingMetadata

      // Try different paths for sources
      let sources: any[] = []
      if (groundingMetadata?.groundingChunks) {
        sources = groundingMetadata.groundingChunks.map((chunk: any) => ({
          url: chunk.web?.uri || chunk.uri || '',
          title: chunk.web?.title || chunk.title || '',
          snippet: chunk.web?.snippet || chunk.snippet || ''
        }))
      } else if (groundingMetadata?.searchEntryPoint?.renderedContent) {
        // Alternative: rendered content from search
        console.log(`  📄 Gemini has searchEntryPoint but no chunks for "${q.query}"`)
      } else if (groundingMetadata?.webSearchQueries) {
        console.log(`  🔎 Gemini searched: ${groundingMetadata.webSearchQueries.join(', ')}`)
      }

      // Log raw grounding metadata structure for debugging
      if (sources.length === 0 && groundingMetadata) {
        console.log(`  🔍 Grounding metadata keys: ${Object.keys(groundingMetadata).join(', ')}`)
      }

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
  const testQueries = queries.slice(0, 10)

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
            search_recency_filter: 'month', // Only include articles from last 30 days
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
  // Enhanced competitor extraction
  const competitors: string[] = []

  // Look for company name patterns (Capitalized words, possibly with Inc, LLC, Corp)
  // Match patterns like "Acme Corp", "Widget Inc", "TechStart"
  const companyPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|LLC|Corp|Corporation|Limited|Ltd|Group|Partners|Ventures|Capital|Holdings|Technologies|Tech))?)\b/g
  const matches = text.match(companyPattern) || []

  // Filter out common words that aren't companies
  const stopWords = new Set(['The', 'This', 'That', 'These', 'Those', 'What', 'Which', 'When', 'Where', 'Who', 'Why', 'How', 'Many', 'Some', 'All', 'Most', 'Each', 'Every', 'Both', 'Few', 'More', 'Less', 'Other', 'Another', 'Such', 'No', 'Nor', 'Not', 'Only', 'Own', 'Same', 'So', 'Than', 'Too', 'Very', 'Can', 'Will', 'Just', 'Should', 'Now'])

  for (const match of matches) {
    // Skip single words that are likely not companies
    if (!match.includes(' ') && !match.match(/[A-Z]{2,}/)) {
      continue
    }
    // Skip stop words
    if (stopWords.has(match)) {
      continue
    }
    // Skip if already in list (case insensitive)
    if (competitors.some(c => c.toLowerCase() === match.toLowerCase())) {
      continue
    }
    competitors.push(match)
  }

  return competitors.slice(0, 10) // Return top 10 to avoid noise
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
