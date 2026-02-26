import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

console.log("NIV FireSearch - Elite Research Engine with Query Decomposition & Answer Validation")

// IMPORTANT: Firecrawl API key
const FIRECRAWL_API_KEY = 'fc-3048810124b640eb99293880a4ab25d0'
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v2'

// Current date for time-aware research (updated: 2025-10-24)
const CURRENT_DATE = '2025-10-24'

interface SubQuestion {
  question: string
  priority: number // 1-3, where 1 is most important
  searchTerms: string[]
  answered: boolean
  retryCount: number
}

interface ValidatedAnswer {
  subQuestion: string
  answer: string
  confidence: number // 0-1
  sources: Array<{
    title: string
    url: string
    excerpt: string
    publishDate?: string
    relevance: number
  }>
}

interface ResearchResult {
  success: boolean
  query: string
  subQuestions: SubQuestion[]
  validatedAnswers: ValidatedAnswer[]
  synthesis: string
  followUpQuestions: string[]
  totalSources: number
  organizationContext?: any
  timestamp: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      query,
      organizationId = 'OpenAI',
      conversationId,
      timeframe = 'recent', // recent|current|week|month|year|all
      maxIterations = 0, // Skip retries entirely - with 0.3 threshold we should get answers on first pass
      streamProgress = false
    } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`🔬 NIV FireSearch initiated`)
    console.log(`📝 Query: "${query}"`)
    console.log(`🏢 Organization: ${organizationId}`)
    console.log(`⏰ Timeframe: ${timeframe}`)
    console.log(`📅 Current Date: ${CURRENT_DATE}`)

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get organization context from mcp-discovery
    const orgContext = await getOrganizationContext(organizationId, conversationId, supabase)

    if (orgContext) {
      console.log(`🎯 Organization: ${orgContext.organizationName}`)
      console.log(`🏭 Industry: ${orgContext.industry}`)
      console.log(`🌐 Priority domains: ${orgContext.priorityDomains.slice(0, 5).join(', ')}`)
    }

    // Parse timeframe into search parameters
    const timeParams = parseTimeframe(timeframe)
    console.log(`⏱️ Time filter: ${timeParams.description} (${timeParams.tbs || 'all time'})`)

    // Execute FireSearch research workflow
    const result = await executeFireSearch(
      query,
      orgContext,
      timeParams,
      maxIterations,
      supabase
    )

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ NIV FireSearch error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Main FireSearch workflow
async function executeFireSearch(
  query: string,
  orgContext: any,
  timeParams: any,
  maxIterations: number,
  supabase: any
): Promise<ResearchResult> {

  // STEP 1: Decompose query into focused sub-questions
  console.log('\n🧠 STEP 1: Decomposing query into sub-questions...')
  const subQuestions = await decomposeQuery(query, orgContext, timeParams)
  console.log(`✅ Created ${subQuestions.length} focused sub-questions`)
  subQuestions.forEach((sq, i) => {
    console.log(`   ${i + 1}. [P${sq.priority}] ${sq.question}`)
  })

  // STEP 2: Search each sub-question
  console.log('\n🔍 STEP 2: Searching for answers to each sub-question...')
  const allSearchResults = await searchSubQuestions(
    subQuestions,
    orgContext,
    timeParams
  )
  console.log(`📊 Collected ${allSearchResults.length} total search results`)

  // STEP 3: Validate which results actually answer the questions
  console.log('\n✅ STEP 3: Validating which sources answer each sub-question...')
  const validatedAnswers = await validateAnswers(
    subQuestions,
    allSearchResults,
    query
  )
  console.log(`✓ Validated ${validatedAnswers.length} answers`)
  validatedAnswers.forEach((va, i) => {
    console.log(`   ${i + 1}. ${va.subQuestion.substring(0, 60)}... (conf: ${va.confidence}, sources: ${va.sources.length})`)
  })

  // STEP 4: Retry unanswered questions with alternative search terms
  const unansweredQuestions = subQuestions.filter(sq => !sq.answered)

  if (unansweredQuestions.length > 0 && maxIterations > 0) {
    try {
      console.log(`\n🔄 STEP 4: Retrying ${unansweredQuestions.length} unanswered questions...`)

      for (const uq of unansweredQuestions) {
        if (uq.retryCount < maxIterations) {
          console.log(`   🔁 Retry ${uq.retryCount + 1}/${maxIterations}: "${uq.question.substring(0, 50)}..."`)

          // Generate alternative search terms
          const altSearchTerms = await generateAlternativeSearchTerms(uq.question, orgContext)
          const retryResults = await searchWithTerms(altSearchTerms, orgContext, timeParams)

          // Validate retry results
          const retryValidation = await validateAnswers([uq], retryResults, query)

          if (retryValidation.length > 0) {
            validatedAnswers.push(...retryValidation)
            uq.answered = true
            console.log(`   ✅ Found answer on retry!`)
          } else {
            uq.retryCount++
            console.log(`   ⚠️ Still no answer after retry ${uq.retryCount}`)
          }
        }
      }
    } catch (error) {
      console.error('⚠️ Retry step failed, continuing with current results:', error.message)
    }
  }

  // STEP 5: Synthesize all findings into coherent response
  let synthesis = { text: '' }
  try {
    console.log('\n📝 STEP 5: Synthesizing findings with citations...')
    synthesis = await synthesizeFindings(
      query,
      subQuestions,
      validatedAnswers,
      orgContext
    )
  } catch (error) {
    console.error('⚠️ Synthesis failed, using fallback:', error.message)
    // Fallback synthesis
    synthesis.text = `Based on ${validatedAnswers.length} validated sources:\n\n` +
      validatedAnswers.map((va, i) => `${i + 1}. ${va.answer}`).join('\n\n')
  }

  // STEP 6: Generate intelligent follow-up questions
  let followUpQuestions: string[] = []
  try {
    console.log('\n💡 STEP 6: Generating follow-up questions...')
    followUpQuestions = await generateFollowUps(
      query,
      validatedAnswers,
      unansweredQuestions
    )
  } catch (error) {
    console.error('⚠️ Follow-up generation failed, skipping:', error.message)
  }

  const totalSources = validatedAnswers.reduce((sum, va) => sum + va.sources.length, 0)

  console.log(`\n✅ FireSearch Complete!`)
  console.log(`   - Sub-questions: ${subQuestions.length}`)
  console.log(`   - Validated answers: ${validatedAnswers.length}`)
  console.log(`   - Total sources cited: ${totalSources}`)
  console.log(`   - Unanswered: ${unansweredQuestions.length}`)

  return {
    success: true,
    query,
    subQuestions,
    validatedAnswers,
    synthesis: synthesis.text,
    followUpQuestions,
    totalSources,
    organizationContext: orgContext ? {
      organization: orgContext.organizationName,
      industry: orgContext.industry,
      competitors: orgContext.directCompetitors?.slice(0, 5)
    } : null,
    timestamp: new Date().toISOString()
  }
}

// Decompose complex query into focused sub-questions using Claude
async function decomposeQuery(
  query: string,
  orgContext: any,
  timeParams: any
): Promise<SubQuestion[]> {

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

  const prompt = `You are an elite research strategist. Break down this complex research query into 3-5 focused sub-questions that, when answered together, would comprehensively address the original question.

ORIGINAL QUERY: "${query}"

CONTEXT:
- Organization: ${orgContext?.organizationName || 'General'}
- Industry: ${orgContext?.industry || 'General'}
- Timeframe: ${timeParams.description}
- Current Date: ${CURRENT_DATE}

REQUIREMENTS:
1. Each sub-question should be SPECIFIC and ANSWERABLE with factual sources
2. Sub-questions should cover different aspects (who, what, when, where, why, how, impact)
3. Prioritize sub-questions (1=most critical, 2=important, 3=supplementary)
4. For each sub-question, suggest 2-3 search terms that would find good sources
5. Consider the timeframe - if "recent" or "current", focus on latest developments

Return ONLY valid JSON in this format:
{
  "subQuestions": [
    {
      "question": "What specific regulations were passed?",
      "priority": 1,
      "searchTerms": ["AI regulation 2025", "AI Act passed", "FTC AI guidance"]
    }
  ]
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    const data = await response.json()
    const content = data.content[0].text

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed.subQuestions.map(sq => ({
        ...sq,
        answered: false,
        retryCount: 0
      }))
    }
  } catch (error) {
    console.error('Query decomposition error:', error)
  }

  // Fallback to simple decomposition
  return [{
    question: query,
    priority: 1,
    searchTerms: [query],
    answered: false,
    retryCount: 0
  }]
}

// Search for answers to all sub-questions
async function searchSubQuestions(
  subQuestions: SubQuestion[],
  orgContext: any,
  timeParams: any
): Promise<any[]> {

  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY') || FIRECRAWL_API_KEY
  const allResults = []

  // Search each sub-question in parallel
  const searchPromises = subQuestions.map(async (sq) => {
    const results = []

    // Try each search term for this sub-question
    for (const searchTerm of sq.searchTerms.slice(0, 2)) { // Limit to 2 terms per question
      try {
        const searchBody: any = {
          query: searchTerm,
          sources: ['web', 'news'],
          limit: 10,
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
            maxAge: timeParams.maxAge
          }
        }

        // Add time filter if specified
        if (timeParams.tbs) {
          searchBody.tbs = timeParams.tbs
        }

        // Add organization-specific domains if available
        if (orgContext?.priorityDomains?.length > 0) {
          searchBody.priorityDomains = orgContext.priorityDomains
        }

        const searchResponse = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(searchBody)
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          const webResults = searchData.data?.web || []
          const newsResults = searchData.data?.news || []

          results.push(...webResults.map(r => ({ ...r, sourceType: 'web', subQuestion: sq.question })))
          results.push(...newsResults.map(r => ({ ...r, sourceType: 'news', subQuestion: sq.question })))
        }
      } catch (error) {
        console.error(`Search error for "${searchTerm}":`, error.message)
      }
    }

    return results
  })

  const resultsArrays = await Promise.all(searchPromises)
  resultsArrays.forEach(results => allResults.push(...results))

  // Deduplicate by URL
  const uniqueResults = []
  const seenUrls = new Set()

  for (const result of allResults) {
    if (!seenUrls.has(result.url)) {
      seenUrls.add(result.url)
      uniqueResults.push(result)
    }
  }

  return uniqueResults
}

// Search with specific alternative terms
async function searchWithTerms(
  searchTerms: string[],
  orgContext: any,
  timeParams: any
): Promise<any[]> {

  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY') || FIRECRAWL_API_KEY
  const results = []

  for (const term of searchTerms.slice(0, 2)) {
    try {
      const searchBody: any = {
        query: term,
        sources: ['web', 'news'],
        limit: 8,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
          maxAge: timeParams.maxAge
        }
      }

      if (timeParams.tbs) {
        searchBody.tbs = timeParams.tbs
      }

      const searchResponse = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchBody)
      })

      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        const webResults = searchData.data?.web || []
        const newsResults = searchData.data?.news || []

        results.push(...webResults, ...newsResults)
      }
    } catch (error) {
      console.error(`Retry search error for "${term}":`, error.message)
    }
  }

  return results
}

// Validate which search results actually answer the sub-questions
async function validateAnswers(
  subQuestions: SubQuestion[],
  searchResults: any[],
  originalQuery: string
): Promise<ValidatedAnswer[]> {

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  const validatedAnswers: ValidatedAnswer[] = []

  // Process each sub-question
  for (const sq of subQuestions) {
    // Get relevant search results for this sub-question
    const relevantResults = searchResults.filter(r =>
      r.subQuestion === sq.question ||
      searchResults.indexOf(r) % subQuestions.length === subQuestions.indexOf(sq)
    ).slice(0, 8) // Limit to 8 results per question

    if (relevantResults.length === 0) continue

    // Prepare context for Claude to validate
    const resultsContext = relevantResults.map((r, idx) => {
      const content = r.markdown || r.content || ''
      return `[SOURCE ${idx + 1}]
Title: ${r.title || 'Untitled'}
URL: ${r.url}
Content: ${content.substring(0, 2000)}...
`
    }).join('\n\n')

    const prompt = `You are validating whether search results answer a specific research question.

SUB-QUESTION: "${sq.question}"

ORIGINAL QUERY CONTEXT: "${originalQuery}"

SEARCH RESULTS:
${resultsContext}

TASK: For EACH source, determine:
1. Does it contain information that answers the sub-question? (yes/no)
2. Confidence that it answers the question (0.0-1.0, where 0.3+ is acceptable)
3. Extract the specific excerpt that answers the question (1-2 sentences)

IMPORTANT: Be GENEROUS with confidence scores. If a source has ANY relevant information, give it at least 0.3-0.5.
Include sources with confidence >= 0.3

Return ONLY valid JSON in this format:
{
  "answer": "Brief synthesized answer to the sub-question based on valid sources",
  "sources": [
    {
      "sourceNumber": 1,
      "answersQuestion": true,
      "confidence": 0.85,
      "excerpt": "The specific text that answers the question",
      "relevance": 0.9
    }
  ]
}`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      })

      const data = await response.json()
      const content = data.content[0].text

      // Extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])

        // Filter only low+ confidence sources (lowered to 0.3 for speed and to avoid 0 results)
        const validSources = parsed.sources
          .filter(s => s.confidence >= 0.3)
          .map(s => {
            const originalResult = relevantResults[s.sourceNumber - 1]
            return {
              title: originalResult?.title || 'Untitled',
              url: originalResult?.url || '',
              excerpt: s.excerpt,
              publishDate: extractPublishDate(originalResult),
              relevance: s.relevance
            }
          })

        if (validSources.length > 0) {
          validatedAnswers.push({
            subQuestion: sq.question,
            answer: parsed.answer,
            confidence: Math.max(...parsed.sources.map(s => s.confidence)),
            sources: validSources
          })

          sq.answered = true
        }
      }
    } catch (error) {
      console.error(`Validation error for "${sq.question}":`, error.message)
    }
  }

  return validatedAnswers
}

// Generate alternative search terms for unanswered questions
async function generateAlternativeSearchTerms(
  question: string,
  orgContext: any
): Promise<string[]> {

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

  const prompt = `Generate 3 alternative search terms to find answers to this question:

QUESTION: "${question}"

CONTEXT: ${orgContext?.organizationName || 'General research'}

Return ONLY a JSON array of 3 search terms:
["alternative term 1", "alternative term 2", "alternative term 3"]`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    const data = await response.json()
    const content = data.content[0].text

    const jsonMatch = content.match(/\[[\s\S]*?\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('Alternative search terms generation error:', error)
  }

  // Fallback: simple variations
  return [
    question.replace('?', ''),
    question.split(' ').slice(0, 5).join(' '),
    question
  ]
}

// Synthesize all validated answers into coherent response with citations
async function synthesizeFindings(
  originalQuery: string,
  subQuestions: SubQuestion[],
  validatedAnswers: ValidatedAnswer[],
  orgContext: any
): Promise<{ text: string }> {

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

  // Prepare validated findings
  const findingsText = validatedAnswers.map((va, idx) => {
    const sourcesText = va.sources.map((s, sIdx) =>
      `   [${idx + 1}.${sIdx + 1}] ${s.title} - ${s.url}\n      "${s.excerpt}"`
    ).join('\n')

    return `SUB-QUESTION ${idx + 1}: ${va.subQuestion}
ANSWER: ${va.answer}
CONFIDENCE: ${va.confidence}
SOURCES:
${sourcesText}`
  }).join('\n\n')

  const unansweredText = subQuestions
    .filter(sq => !sq.answered)
    .map(sq => `- ${sq.question}`)
    .join('\n')

  const prompt = `You are synthesizing research findings into a comprehensive, well-cited response.

ORIGINAL QUERY: "${originalQuery}"

VALIDATED FINDINGS:
${findingsText}

${unansweredText ? `UNANSWERED QUESTIONS:\n${unansweredText}\n` : ''}

ORGANIZATION CONTEXT: ${orgContext?.organizationName || 'General'}
INDUSTRY: ${orgContext?.industry || 'General'}

TASK: Create a comprehensive synthesis that:
1. Directly answers the original query
2. Cites sources using [1.1], [1.2] notation matching the sources above
3. Organizes information logically by theme
4. Highlights key findings prominently
5. Notes any contradictions or limitations
6. Acknowledges unanswered aspects if any

Write in a clear, professional style. Be factual and cite frequently.

Return ONLY the synthesized response text (no JSON wrapper).`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    const data = await response.json()
    return { text: data.content[0].text }
  } catch (error) {
    console.error('Synthesis error:', error)

    // Fallback synthesis
    let fallback = `Based on research into "${originalQuery}":\n\n`
    validatedAnswers.forEach((va, idx) => {
      fallback += `${idx + 1}. ${va.answer}\n`
      fallback += `   Sources: ${va.sources.map(s => s.url).join(', ')}\n\n`
    })

    return { text: fallback }
  }
}

// Generate intelligent follow-up questions
async function generateFollowUps(
  originalQuery: string,
  validatedAnswers: ValidatedAnswer[],
  unansweredQuestions: SubQuestion[]
): Promise<string[]> {

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

  const answeredSummary = validatedAnswers.map(va =>
    `- ${va.subQuestion}: ${va.answer.substring(0, 100)}...`
  ).join('\n')

  const prompt = `Based on this research, generate 3-4 intelligent follow-up questions.

ORIGINAL QUERY: "${originalQuery}"

WHAT WE LEARNED:
${answeredSummary}

${unansweredQuestions.length > 0 ? `WHAT REMAINS UNANSWERED:\n${unansweredQuestions.map(q => `- ${q.question}`).join('\n')}` : ''}

Generate 3-4 follow-up questions that would:
1. Dive deeper into interesting findings
2. Explore implications or next steps
3. Address gaps in the research

Return ONLY a JSON array of questions:
["Question 1?", "Question 2?", "Question 3?"]`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    const data = await response.json()
    const content = data.content[0].text

    const jsonMatch = content.match(/\[[\s\S]*?\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('Follow-up generation error:', error)
  }

  return []
}

// Get organization context from mcp-discovery
async function getOrganizationContext(
  organizationId: string,
  conversationId: string | undefined,
  supabase: any
): Promise<any> {

  try {
    // First try to get from mcp_discovery table
    const { data: discovery, error } = await supabase
      .from('mcp_discovery')
      .select('*')
      .or(`organization_id.eq.${organizationId},organization_name.ilike.%${organizationId}%`)
      .single()

    if (discovery && !error) {
      // Extract priority domains
      const priorityDomains = []

      // Add news/media sources
      if (discovery.news_sources?.sources) {
        priorityDomains.push(...discovery.news_sources.sources.map(s => s.domain))
      }

      // Add competitor domains
      if (discovery.competition?.direct_competitors) {
        priorityDomains.push(...discovery.competition.direct_competitors.map(c => {
          try {
            const url = new URL(c.website || '')
            return url.hostname.replace('www.', '')
          } catch {
            return null
          }
        }).filter(Boolean))
      }

      return {
        organizationName: discovery.organization_name,
        industry: discovery.industry,
        directCompetitors: discovery.competition?.direct_competitors || [],
        priorityDomains: [...new Set(priorityDomains)], // Deduplicate
        fullProfile: discovery
      }
    }
  } catch (error) {
    console.error('Error fetching organization context:', error)
  }

  return null
}

// Parse timeframe into Firecrawl search parameters
function parseTimeframe(timeframe: string): any {
  const now = new Date(CURRENT_DATE)

  const timeframeMap = {
    'current': {
      tbs: 'qdr:d', // Past 24 hours
      maxAge: 86400000, // 1 day in ms
      description: 'past 24 hours (current/breaking)'
    },
    'recent': {
      tbs: 'qdr:d3', // Past 3 days
      maxAge: 259200000, // 3 days in ms
      description: 'past 3 days (recent developments)'
    },
    'week': {
      tbs: 'qdr:w', // Past week
      maxAge: 604800000, // 7 days in ms
      description: 'past week'
    },
    'twoweeks': {
      tbs: 'qdr:w2', // Past 2 weeks
      maxAge: 1209600000, // 14 days in ms
      description: 'past 2 weeks'
    },
    'month': {
      tbs: 'qdr:m', // Past month
      maxAge: 2592000000, // 30 days in ms
      description: 'past month'
    },
    'quarter': {
      tbs: 'qdr:m3', // Past 3 months
      maxAge: 7776000000, // 90 days in ms
      description: 'past 3 months'
    },
    'year': {
      tbs: 'qdr:y', // Past year
      maxAge: 31536000000, // 365 days in ms
      description: 'past year'
    },
    'all': {
      tbs: null,
      maxAge: null,
      description: 'all time'
    }
  }

  return timeframeMap[timeframe] || timeframeMap['recent']
}

// Helper: Extract publish date from search result
function extractPublishDate(result: any): string | null {
  if (!result) return null

  const content = result.markdown || result.content || ''

  // Look for date patterns
  const datePatterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
  ]

  for (const pattern of datePatterns) {
    const match = content.match(pattern)
    if (match) {
      try {
        const date = new Date(match[0])
        if (!isNaN(date.getTime())) {
          return date.toISOString()
        }
      } catch {}
    }
  }

  return null
}
