import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * POSITIVE COVERAGE COMPILER
 *
 * Analyzes raw articles from scraper using Claude to:
 * 1. Filter false positives (mentions that aren't actually positive)
 * 2. Extract actual achievements, awards, recognition
 * 3. Generate summaries for each piece of coverage
 * 4. Structure into NewsArticle schema format
 * 5. Save to intelligence_findings with high relevance scores
 *
 * Pattern: Similar to monitor-stage-2 enrichment
 */

interface CompilerRequest {
  organization_id: string
  organization_name: string
  articles: any[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      articles
    }: CompilerRequest = await req.json()

    if (!organization_id || !organization_name) {
      throw new Error('organization_id and organization_name required')
    }

    if (!articles || articles.length === 0) {
      console.log('⚠️  No articles to compile')
      return new Response(
        JSON.stringify({
          success: true,
          coverage_items: [],
          saved_count: 0,
          message: 'No articles to compile'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔨 Positive Coverage Compiler Starting:', {
      organization_name,
      articles_count: articles.length
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // STEP 0: Pre-filter malformed articles before Claude analysis
    console.log('🔍 Step 0: Pre-filtering malformed articles...')
    const validArticles = preFilterArticles(articles)
    console.log(`   ✓ Pre-filtered: ${articles.length} → ${validArticles.length} valid articles`)

    if (validArticles.length === 0) {
      console.log('⚠️  No valid articles after pre-filtering')
      return new Response(
        JSON.stringify({
          success: true,
          coverage_items: [],
          saved_count: 0,
          message: 'No valid articles after pre-filtering'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // STEP 1: Analyze articles with Claude
    console.log('🤖 Step 1: Analyzing articles with Claude...')
    const analysisPrompt = buildAnalysisPrompt(organization_name, validArticles)

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: analysisPrompt
        }]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', errorText)
      throw new Error(`Claude API error: ${claudeResponse.status}`)
    }

    const claudeResult = await claudeResponse.json()
    const analysisText = claudeResult.content[0].text

    // Parse Claude's analysis
    const analysis = parseClaudeAnalysis(analysisText)
    console.log(`   ✓ Claude analyzed ${analysis.coverage_items.length} positive items`)

    // STEP 2: Save to intelligence_findings
    console.log('💾 Step 2: Saving to intelligence_findings...')
    let savedCount = 0

    for (const item of analysis.coverage_items) {
      try {
        const { error } = await supabase
          .from('intelligence_findings')
          .insert({
            organization_id,
            title: item.title,
            url: item.url,
            content: item.summary,
            source: item.source || 'Web',
            relevance_score: 80, // High relevance for positive coverage
            sentiment_score: 0.9, // Very positive sentiment
            published_at: item.date || new Date().toISOString(),
            metadata: {
              coverage_type: item.type, // 'award', 'achievement', 'recognition', etc.
              search_query: item.search_query,
              outlet: item.outlet,
              compiled_by: 'positive-coverage-compiler',
              compiled_at: new Date().toISOString(),
              schema_ready: true // Ready for schema generation
            }
          })

        if (error) {
          console.error(`   ✗ Failed to save: ${item.title}`, error)
        } else {
          savedCount++
          console.log(`   ✓ Saved: ${item.title}`)
        }
      } catch (error) {
        console.error(`   ✗ Error saving item:`, error)
      }
    }

    console.log(`   ✓ Saved ${savedCount}/${analysis.coverage_items.length} items`)

    // STEP 3: Return structured coverage
    const summary = {
      articles_analyzed: articles.length,
      positive_items_found: analysis.coverage_items.length,
      items_saved: savedCount,
      coverage_types: analysis.coverage_items.reduce((acc: any, item: any) => {
        acc[item.type] = (acc[item.type] || 0) + 1
        return acc
      }, {}),
      reasoning: analysis.reasoning
    }

    console.log('✅ Positive Coverage Compiler Complete:', summary)

    return new Response(
      JSON.stringify({
        success: true,
        coverage_items: analysis.coverage_items,
        saved_count: savedCount,
        summary
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Positive Coverage Compiler Error:', error)
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
 * Build Claude analysis prompt
 */
function buildAnalysisPrompt(organizationName: string, articles: any[]): string {
  const articlesList = articles.map((article, idx) => {
    return `
Article ${idx + 1}:
Title: ${article.title || 'No title'}
URL: ${article.url || article.link || 'No URL'}
Source: ${article.source || article.domain || 'Unknown'}
Date: ${article.publishedAt || article.date || 'Unknown'}
Snippet: ${article.description || article.snippet || 'No snippet'}
Search Query: ${article.search_query || 'N/A'}
`
  }).join('\n---\n')

  return `You are analyzing search results to identify genuine positive coverage about "${organizationName}".

**YOUR TASK:**
Review these articles and identify which ones represent genuine positive coverage (awards, achievements, recognition, industry leadership, innovation, rankings, etc.).

**ARTICLES TO ANALYZE:**
${articlesList}

**CRITICAL DATA QUALITY FILTERS - EXCLUDE:**
1. **Malformed titles**: Articles with HTML tags, image markdown, social media buttons (FacebookXLinkedIn), or scraped UI elements
2. **Paywall/Ad copy**: Titles like "Get 100% ad-free experience", "Subscribe now", etc.
3. **Missing/invalid titles**: Articles without meaningful headlines or with generic placeholders
4. **Unrelated content**: Articles that merely mention the company in passing but are about something else entirely
5. **Negative coverage**: Articles about profit declines, failures, controversies (even if factual)
6. **Generic mentions**: Articles where the company is just listed among many others without specific achievements

**QUALITY STANDARDS - ONLY INCLUDE:**
1. **Clear, readable headlines**: Must be properly formatted article titles
2. **Genuine achievements**: Specific awards won, recognitions received, innovations launched
3. **Measurable accomplishments**: Rankings, certifications, partnerships, expansions
4. **Direct relevance**: Article must be primarily ABOUT ${organizationName}'s achievement
5. **Positive sentiment**: Must represent actual positive coverage, not just neutral mentions

**INSTRUCTIONS:**
1. **Apply strict filtering**: When in doubt, EXCLUDE the article
2. **Verify article quality**: Check that title, URL, and snippet are all properly formatted
3. **Confirm genuine achievement**: Must be a real, specific accomplishment (not generic praise)
4. **Generate factual summaries**: Write 1-2 sentence summaries based on actual achievement described
5. **Classify coverage type**: awards, achievement, recognition, industry_leadership, innovation, ranking, partnership

**OUTPUT FORMAT:**
Return a JSON object with this exact structure:
{
  "coverage_items": [
    {
      "title": "Full article title",
      "url": "Article URL",
      "source": "Publication name",
      "outlet": "Source outlet/domain",
      "date": "Publication date (ISO format if available)",
      "type": "award|achievement|recognition|industry_leadership|innovation|ranking|partnership",
      "summary": "1-2 sentence summary of the achievement/recognition",
      "search_query": "Original search query that found this"
    }
  ],
  "reasoning": "Brief explanation of filtering criteria and what was excluded"
}

**IMPORTANT:**
- **BE VERY STRICT**: Only include items that pass ALL quality checks above
- **Exclude malformed data**: Any article with HTML/markdown artifacts, UI elements, or paywall text must be excluded
- **Require genuine achievements**: Generic mentions or neutral news don't count
- **Factual summaries only**: Base summaries on specific accomplishments mentioned in the article
- **When in doubt, exclude it**: Better to have 0-2 high-quality items than 5 questionable ones
- **Empty result is OK**: If none of the articles represent genuine positive coverage, return empty array

Generate the analysis now:`
}

/**
 * Parse Claude's analysis response
 */
function parseClaudeAnalysis(response: string): any {
  try {
    // Try to find JSON in response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        coverage_items: parsed.coverage_items || [],
        reasoning: parsed.reasoning || 'No reasoning provided'
      }
    }

    // Fallback: no valid JSON found
    console.warn('Could not parse Claude response as JSON')
    return {
      coverage_items: [],
      reasoning: 'Failed to parse Claude response'
    }
  } catch (error) {
    console.error('Error parsing Claude response:', error)
    return {
      coverage_items: [],
      reasoning: 'Parse error'
    }
  }
}
