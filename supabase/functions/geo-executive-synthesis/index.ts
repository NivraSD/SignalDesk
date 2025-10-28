import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * GEO EXECUTIVE SYNTHESIS
 *
 * Transforms raw GEO monitoring results into executive-level insights
 * Similar to how executive-synthesis analyzes PR intelligence
 *
 * Input: Raw GEO test results (queries + AI responses)
 * Output: Executive synthesis with actionable recommendations
 */

interface GEOTestResult {
  query: string
  intent: string
  priority: string
  platform: 'claude' | 'gemini' | 'chatgpt' | 'perplexity'
  response: string
  brand_mentioned: boolean
  rank?: number
  context_quality?: 'strong' | 'medium' | 'weak'
  competitors_mentioned?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      industry,
      geo_results, // Raw results from geo-intelligence-monitor
      geo_targets // User's GEO targets if available
    } = await req.json()

    if (!organization_id || !organization_name || !geo_results) {
      throw new Error('organization_id, organization_name, and geo_results required')
    }

    console.log('📊 GEO Executive Synthesis Starting:', {
      organization: organization_name,
      industry,
      results_count: geo_results.length,
      timestamp: new Date().toISOString()
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Analyze results
    const analysis = analyzeGEOResults(geo_results, organization_name)

    console.log('📈 Analysis Complete:', {
      total_queries: analysis.total_queries,
      mention_rate: analysis.mention_rate,
      critical_gaps: analysis.critical_gaps.length,
      opportunities: analysis.opportunities.length
    })

    // Use Claude to generate executive-level insights
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')
    })

    const prompt = buildSynthesisPrompt({
      organizationName: organization_name,
      industry,
      analysis,
      geoTargets: geo_targets
    })

    console.log('🤖 Calling Claude for executive synthesis...')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : ''

    // Parse Claude's synthesis
    const synthesis = parseSynthesisResponse(responseText)

    console.log('✅ Synthesis Generated:', {
      key_findings: synthesis.key_findings?.length || 0,
      recommendations: synthesis.recommendations?.length || 0,
      critical_actions: synthesis.critical_actions?.length || 0
    })

    // Save schema recommendations to database
    if (synthesis.recommendations && synthesis.recommendations.length > 0) {
      console.log(`💾 Saving ${synthesis.recommendations.length} recommendations to database...`)

      for (const rec of synthesis.recommendations) {
        try {
          const { error } = await supabase
            .from('schema_recommendations')
            .insert({
              organization_id,
              schema_type: rec.schema_type || 'Organization',
              recommendation_type: rec.type || 'optimize_existing',
              priority: rec.priority || 'medium',
              source_platform: rec.platform || 'all',
              title: rec.title,
              description: rec.description,
              reasoning: rec.reasoning,
              expected_impact: rec.expected_impact,
              changes: rec.changes || {},
              auto_executable: rec.auto_executable || false,
              status: 'pending'
            })

          if (error) {
            console.error('Error saving recommendation:', error)
          } else {
            console.log(`  ✓ Saved: ${rec.title}`)
          }
        } catch (err) {
          console.error('Error saving recommendation:', err)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synthesis: {
          ...synthesis,
          raw_analysis: analysis,
          organization_name,
          industry,
          generated_at: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('❌ GEO Executive Synthesis Error:', error)
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
 * Analyze raw GEO results to extract key metrics and patterns
 */
function analyzeGEOResults(results: GEOTestResult[], organizationName: string) {
  const platforms = ['claude', 'gemini', 'chatgpt', 'perplexity']

  const analysis = {
    total_queries: results.length,
    queries_by_platform: {} as Record<string, number>,
    mentions_by_platform: {} as Record<string, number>,
    mention_rate: 0,
    avg_rank: 0,
    critical_gaps: [] as any[],
    opportunities: [] as any[],
    competitor_analysis: {} as Record<string, number>
  }

  // Initialize platform counters
  platforms.forEach(p => {
    analysis.queries_by_platform[p] = 0
    analysis.mentions_by_platform[p] = 0
  })

  let totalMentions = 0
  let totalRanks = 0
  let rankedMentions = 0

  // Analyze each result
  results.forEach(result => {
    const platform = result.platform
    analysis.queries_by_platform[platform] = (analysis.queries_by_platform[platform] || 0) + 1

    if (result.brand_mentioned) {
      totalMentions++
      analysis.mentions_by_platform[platform] = (analysis.mentions_by_platform[platform] || 0) + 1

      if (result.rank) {
        totalRanks += result.rank
        rankedMentions++
      }
    } else {
      // Track visibility gaps
      if (result.priority === 'critical' || result.priority === 'high') {
        analysis.critical_gaps.push({
          query: result.query,
          platform: result.platform,
          intent: result.intent,
          priority: result.priority,
          competitors_mentioned: result.competitors_mentioned || []
        })
      }
    }

    // Track competitor mentions
    if (result.competitors_mentioned && result.competitors_mentioned.length > 0) {
      result.competitors_mentioned.forEach(competitor => {
        analysis.competitor_analysis[competitor] = (analysis.competitor_analysis[competitor] || 0) + 1
      })
    }

    // Identify opportunities
    if (!result.brand_mentioned && result.context_quality === 'strong') {
      analysis.opportunities.push({
        query: result.query,
        platform: result.platform,
        intent: result.intent,
        why: 'Strong context but no brand mention - opportunity to optimize'
      })
    }
  })

  analysis.mention_rate = analysis.total_queries > 0
    ? Math.round((totalMentions / analysis.total_queries) * 100)
    : 0

  analysis.avg_rank = rankedMentions > 0
    ? Math.round(totalRanks / rankedMentions * 10) / 10
    : 0

  return analysis
}

/**
 * Build prompt for Claude to generate executive synthesis
 */
function buildSynthesisPrompt(context: {
  organizationName: string
  industry?: string
  analysis: any
  geoTargets?: any
}): string {
  const currentDate = new Date().toISOString().split('T')[0]

  return `You are a GEO (Generative Experience Optimization) strategist analyzing AI visibility for ${context.organizationName}.

CURRENT DATE: ${currentDate}

ORGANIZATION: ${context.organizationName}
INDUSTRY: ${context.industry || 'Not specified'}

GEO PERFORMANCE ANALYSIS:
- Total Queries Tested: ${context.analysis.total_queries}
- Overall Mention Rate: ${context.analysis.mention_rate}%
- Average Rank When Mentioned: ${context.analysis.avg_rank}
- Critical Visibility Gaps: ${context.analysis.critical_gaps.length}
- Opportunities Identified: ${context.analysis.opportunities.length}

PLATFORM BREAKDOWN:
${Object.entries(context.analysis.queries_by_platform).map(([platform, count]) => {
  const mentions = context.analysis.mentions_by_platform[platform] || 0
  const rate = count > 0 ? Math.round((mentions / (count as number)) * 100) : 0
  return `- ${platform.toUpperCase()}: ${mentions}/${count} queries (${rate}% mention rate)`
}).join('\n')}

CRITICAL GAPS (High-priority queries where brand was NOT mentioned):
${context.analysis.critical_gaps.slice(0, 5).map((gap: any) =>
  `- "${gap.query}" (${gap.platform}) - Competitors mentioned: ${gap.competitors_mentioned.join(', ') || 'none'}`
).join('\n')}

COMPETITOR VISIBILITY:
${Object.entries(context.analysis.competitor_analysis).slice(0, 5).map(([comp, count]) =>
  `- ${comp}: ${count} mentions`
).join('\n')}

${context.geoTargets ? `
ORGANIZATION'S GEO TARGETS:
- Service Lines: ${context.geoTargets.service_lines?.join(', ') || 'Not specified'}
- Geographic Focus: ${context.geoTargets.geographic_focus?.join(', ') || 'Not specified'}
- Priority Queries: ${context.geoTargets.priority_queries?.slice(0, 3).join(', ') || 'None configured'}
` : ''}

TASK:
Provide an executive-level synthesis of this GEO performance. Structure your response as JSON:

{
  "executive_summary": "2-3 sentence overview of AI visibility performance",
  "key_findings": [
    "Finding 1 with specific data",
    "Finding 2 with specific data",
    "Finding 3 with specific data"
  ],
  "critical_actions": [
    {
      "action": "Specific action to take",
      "priority": "critical|high|medium",
      "expected_impact": "What will improve",
      "platform": "claude|gemini|all"
    }
  ],
  "recommendations": [
    {
      "title": "Brief recommendation title",
      "description": "Detailed description of what to do",
      "schema_type": "Organization|Product|FAQPage|etc",
      "type": "update_field|add_field|create_new",
      "priority": "critical|high|medium",
      "platform": "claude|gemini|all",
      "reasoning": "Why this matters",
      "expected_impact": "What will improve",
      "changes": {"field": "description", "action": "add", "value": "suggested text"},
      "auto_executable": true|false
    }
  ],
  "competitive_insights": "Analysis of competitive positioning",
  "trend_analysis": "What patterns emerge from the data"
}

Focus on:
1. **Actionable insights** (what to do, not just what happened)
2. **Specific schema recommendations** (exact changes to make)
3. **Priority-based actions** (critical issues first)
4. **Platform-specific guidance** (what works where)

Generate the synthesis now:`
}

/**
 * Parse Claude's synthesis response
 */
function parseSynthesisResponse(response: string): any {
  try {
    // Try to find JSON in response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    // Fallback: return basic structure
    return {
      executive_summary: response.substring(0, 500),
      key_findings: [],
      critical_actions: [],
      recommendations: [],
      competitive_insights: '',
      trend_analysis: ''
    }
  } catch (error) {
    console.error('Error parsing synthesis response:', error)
    return {
      executive_summary: 'Error parsing synthesis',
      key_findings: [],
      critical_actions: [],
      recommendations: [],
      parse_error: error.message
    }
  }
}
