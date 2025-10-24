import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, organizationId = 'OpenAI', maxIterations = 2 } = await req.json()

    console.log(`🧠 NIV Research Intelligent: "${query}"`)
    console.log(`📊 Max iterations: ${maxIterations}`)

    // STEP 1: Understand what we're researching and create initial search strategy
    const researchPlan = await analyzeResearchNeeds(query, organizationId)
    console.log(`✅ Research plan created:`)
    console.log(`   - Primary goal: ${researchPlan.goal}`)
    console.log(`   - Search queries: ${researchPlan.searchQueries.length}`)
    console.log(`   - Success criteria: ${researchPlan.successCriteria}`)

    // STEP 2: Execute searches iteratively with quality checks
    const allResults = []
    let iteration = 0
    let currentQueries = [...researchPlan.searchQueries]

    while (iteration < maxIterations && currentQueries.length > 0) {
      iteration++
      console.log(`\n🔍 Iteration ${iteration}/${maxIterations}`)

      // Execute current batch of searches
      const iterationResults = await executeSearchBatch(
        currentQueries,
        organizationId,
        iteration
      )

      allResults.push(...iterationResults)
      console.log(`   Found ${iterationResults.length} results this iteration`)

      // STEP 3: Evaluate quality and determine if we need follow-up searches
      const evaluation = await evaluateResults(
        allResults,
        researchPlan,
        query
      )

      console.log(`   Quality: ${evaluation.quality}`)
      console.log(`   Gaps: ${evaluation.gaps.join(', ') || 'none'}`)

      // If quality is good enough, stop
      if (evaluation.quality === 'sufficient' || evaluation.quality === 'excellent') {
        console.log(`   ✅ Research complete - quality sufficient`)
        break
      }

      // If quality is poor and we have iterations left, create follow-up searches
      if (iteration < maxIterations && evaluation.followUpQueries.length > 0) {
        console.log(`   🔄 Generating ${evaluation.followUpQueries.length} follow-up searches`)
        currentQueries = evaluation.followUpQueries
      } else {
        break
      }
    }

    // STEP 4: Consolidate, filter junk, and package for downstream
    console.log(`\n📦 Packaging ${allResults.length} total results...`)
    const packagedResults = await packageResults(allResults, researchPlan, query)

    console.log(`✅ Research complete:`)
    console.log(`   - Total searches: ${iteration * currentQueries.length}`)
    console.log(`   - Results found: ${packagedResults.results.length}`)
    console.log(`   - Quality: ${packagedResults.quality}`)

    return new Response(JSON.stringify({
      success: true,
      query,
      organizationId,
      iterations: iteration,
      results: packagedResults.results,
      summary: packagedResults.summary,
      keyFindings: packagedResults.keyFindings,
      quality: packagedResults.quality,
      gaps: packagedResults.gaps,
      metadata: {
        totalSearches: iteration,
        queriesUsed: researchPlan.searchQueries,
        researchGoal: researchPlan.goal
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

// Analyze what we need to research and create strategy
async function analyzeResearchNeeds(query: string, organizationId: string) {
  const prompt = `You are a research strategist analyzing what needs to be researched.

Query: "${query}"
Organization: ${organizationId}

Create a research plan:

1. What is the PRIMARY GOAL of this research?
2. What are 2-3 SIMPLE, DIRECT search queries that will find what we need?
   - Keep queries SHORT and NATURAL (e.g., "OpenAI agent builder", "Sora 2 launch")
   - For product launches, use: "[Product Name] [Version]" or "[Product Name] launch"
   - For companies, use: "[Company] [topic]"
   - DON'T add extra descriptive words that make queries too specific
   - Think like a person searching Google, not a research paper
3. What constitutes SUCCESS? (e.g., "Find 5+ articles about Sora 2 launch from past week")
4. What are potential GAPS we might encounter? (e.g., "Product too new, limited coverage")

Respond with JSON only:
{
  "goal": "brief statement of research objective",
  "searchQueries": [
    "specific search query 1",
    "specific search query 2",
    "specific search query 3"
  ],
  "successCriteria": "what defines sufficient results",
  "potentialGaps": ["potential gap 1", "potential gap 2"]
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const responseText = data.content[0].text

  // Extract JSON
  let jsonText = responseText.trim()
  const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) ||
                   jsonText.match(/```\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim()
  }

  return JSON.parse(jsonText)
}

// Execute a batch of searches via niv-fireplexity
async function executeSearchBatch(
  queries: string[],
  organizationId: string,
  iteration: number
) {
  const results = []

  // Execute searches in parallel for speed
  const searchPromises = queries.map(async (query) => {
    console.log(`   Searching: "${query.substring(0, 60)}..."`)

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({
          query,
          organizationId,
          searchMode: 'focused', // Use focused mode for speed
          useCache: iteration === 1 // Only use cache on first iteration
        })
      })

      if (!response.ok) {
        console.error(`   ❌ Search failed for: ${query}`)
        return []
      }

      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error(`   ❌ Search error for "${query}":`, error.message)
      return []
    }
  })

  const searchResults = await Promise.all(searchPromises)

  // Flatten and deduplicate
  const seen = new Set()
  searchResults.forEach(batch => {
    batch.forEach(result => {
      if (!seen.has(result.url)) {
        seen.add(result.url)
        results.push(result)
      }
    })
  })

  return results
}

// Evaluate quality of results and determine if follow-up needed
async function evaluateResults(
  results: any[],
  researchPlan: any,
  originalQuery: string
) {
  const prompt = `You are evaluating research results quality.

Original Query: "${originalQuery}"
Research Goal: ${researchPlan.goal}
Success Criteria: ${researchPlan.successCriteria}

Results Found: ${results.length}
Top Results:
${results.slice(0, 10).map((r, i) => `${i + 1}. ${r.title} (${r.source?.name})`).join('\n')}

Evaluate:
1. QUALITY: Are these results sufficient? (poor/partial/sufficient/excellent)
2. GAPS: What's missing or unclear?
3. FOLLOW-UP: What SIMPLE, DIRECT searches would help fill gaps? (only if quality is poor/partial)
   - Keep follow-up queries SHORT and NATURAL (2-4 words max)
   - Don't make them overly descriptive or academic
   - Examples: "Sora 2 pricing", "GPT-4 release date", "OpenAI news"

Respond with JSON only:
{
  "quality": "poor|partial|sufficient|excellent",
  "reasoning": "why this quality rating",
  "gaps": ["gap 1", "gap 2"],
  "followUpQueries": ["follow-up query 1", "follow-up query 2"]
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const responseText = data.content[0].text

  // Extract JSON
  let jsonText = responseText.trim()
  const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) ||
                   jsonText.match(/```\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim()
  }

  return JSON.parse(jsonText)
}

// Package results for downstream: filter junk, extract key findings
async function packageResults(
  results: any[],
  researchPlan: any,
  originalQuery: string
) {
  const prompt = `You are packaging research results for downstream use.

Original Query: "${originalQuery}"
Research Goal: ${researchPlan.goal}

Raw Results: ${results.length}

Filter and package these results:
1. Identify JUNK (navigation, ads, irrelevant content)
2. Extract KEY FINDINGS (5-10 most important insights)
3. Create SUMMARY (2-3 sentence overview of what was found)
4. Rate QUALITY (poor/partial/sufficient/excellent)
5. Note remaining GAPS

Results to analyze:
${results.slice(0, 15).map((r, i) =>
  `${i + 1}. ${r.title}\n   Source: ${r.source?.name}\n   Snippet: ${r.description?.substring(0, 100)}...`
).join('\n\n')}

Respond with JSON only:
{
  "quality": "poor|partial|sufficient|excellent",
  "summary": "2-3 sentence overview",
  "keyFindings": [
    "key finding 1",
    "key finding 2"
  ],
  "gaps": ["remaining gap 1"],
  "junkIndices": [0, 3, 7]
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const responseText = data.content[0].text

  // Extract JSON
  let jsonText = responseText.trim()
  const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) ||
                   jsonText.match(/```\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim()
  }

  const packaging = JSON.parse(jsonText)

  // Filter out junk results
  const junkSet = new Set(packaging.junkIndices || [])
  const filteredResults = results.filter((_, i) => !junkSet.has(i))

  return {
    results: filteredResults,
    summary: packaging.summary,
    keyFindings: packaging.keyFindings,
    quality: packaging.quality,
    gaps: packaging.gaps
  }
}
