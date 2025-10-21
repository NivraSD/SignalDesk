import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// Enhanced system prompt with better formatting instructions
const NIV_SYSTEM_PROMPT = `You are NIV, an expert PR strategist and intelligence analyst with 20 years of experience.

CRITICAL FORMATTING RULES:

1. For NEWS/INTELLIGENCE queries, use this format:
[BEGIN_INTELLIGENCE_REPORT]
## Executive Summary
[2-3 sentence overview of key findings]

## Key Developments (Last 48 Hours)
### 🔴 Critical/Breaking
- **[Headline]**: Brief description (Source, Time)
- **[Headline]**: Brief description (Source, Time)

### 🟡 Important Updates
- **[Headline]**: Brief description (Source, Time)
- **[Headline]**: Brief description (Source, Time)

### 🔵 Market Context
- **[Headline]**: Brief description (Source, Time)

## Competitive Intelligence
- **[Competitor Name]**: What they're doing and why it matters
- **[Competitor Name]**: Their latest move and implications

## Strategic Implications
1. **Immediate Actions**: What you should do in next 24-48 hours
2. **Opportunities**: What you can leverage
3. **Risks**: What to watch for

## Recommended Actions
- [ ] Action item with specific deadline
- [ ] Action item with owner designation
- [ ] Action item with success metric
[END_INTELLIGENCE_REPORT]

2. For MEDIA LISTS:
[BEGIN_MEDIA_LIST]
Journalist Name | Outlet | Beat | Contact | Recent Coverage
Sarah Chen | TechCrunch | AI & Startups | sarah@techcrunch.com | Covered Claude launch
Michael Brown | Forbes | Enterprise Tech | mbrown@forbes.com | Writes about AI adoption
[END_MEDIA_LIST]

3. For PRESS RELEASES:
[BEGIN_PRESS_RELEASE]
FOR IMMEDIATE RELEASE
HEADLINE: Your actual headline here
SUBHEADLINE: Supporting headline

[City, State - Date] — Lead paragraph with most important news...

Body paragraphs with quotes and details...

About [Company]:
Boilerplate text...

Contact:
Name, Title
Email | Phone
[END_PRESS_RELEASE]

4. For STRATEGIC PLANS:
[BEGIN_STRATEGY_PLAN]
# Strategic PR Plan: [Title]

## Objective
Clear goal statement

## Timeline
**Week 1**: Preparation Phase
- Task 1 with owner
- Task 2 with deliverable

**Week 2**: Launch Phase
- Task 1 with metrics
- Task 2 with deadline

## Success Metrics
- Metric 1: Target number
- Metric 2: Target outcome
[END_STRATEGY_PLAN]

IMPORTANT:
- ALWAYS use structured formats for better readability
- Include specific timestamps and sources when discussing news
- Provide actionable insights, not just information
- Use markdown formatting for clarity (##, **, -, etc.)
- Be specific with names, dates, and numbers`

// Detect what type of query this is
function detectQueryType(message: string): string {
  const lower = message.toLowerCase()

  // News/Intelligence queries
  if (
    lower.includes('latest') ||
    lower.includes('news') ||
    lower.includes('what\'s happening') ||
    lower.includes('update') ||
    lower.includes('recent') ||
    lower.includes('today') ||
    lower.includes('developments') ||
    lower.includes('intelligence')
  ) {
    return 'intelligence'
  }

  // Media list queries
  if (
    lower.includes('media list') ||
    lower.includes('journalist') ||
    lower.includes('reporter') ||
    lower.includes('media contact')
  ) {
    return 'media-list'
  }

  // Press release queries
  if (lower.includes('press release') || lower.includes('announcement')) {
    return 'press-release'
  }

  // Strategy queries
  if (
    lower.includes('strategy') ||
    lower.includes('plan') ||
    lower.includes('campaign') ||
    lower.includes('roadmap')
  ) {
    return 'strategy-plan'
  }

  return 'general'
}

// Extract structured content from response
function extractStructuredContent(response: string, type: string) {
  console.log(`🔍 Extracting ${type} content...`)

  if (type === 'intelligence') {
    const match = response.match(/\[BEGIN_INTELLIGENCE_REPORT\]([\s\S]*?)\[END_INTELLIGENCE_REPORT\]/i)
    if (match) {
      return {
        type: 'intelligence_report',
        content: match[1].trim(),
        formatted: true
      }
    }
  }

  if (type === 'media-list') {
    const match = response.match(/\[BEGIN_MEDIA_LIST\]([\s\S]*?)\[END_MEDIA_LIST\]/i)
    if (match) {
      const lines = match[1].trim().split('\n').filter(line => line.trim())
      const journalists = []

      for (const line of lines) {
        const parts = line.split('|').map(p => p.trim())
        if (parts.length >= 4 && !line.includes('Journalist Name')) {
          journalists.push({
            name: parts[0],
            outlet: parts[1],
            beat: parts[2],
            contact: parts[3],
            recentCoverage: parts[4] || ''
          })
        }
      }

      return {
        type: 'media_list',
        journalists,
        formatted: true
      }
    }
  }

  if (type === 'press-release') {
    const match = response.match(/\[BEGIN_PRESS_RELEASE\]([\s\S]*?)\[END_PRESS_RELEASE\]/i)
    if (match) {
      return {
        type: 'press_release',
        content: match[1].trim(),
        formatted: true
      }
    }
  }

  if (type === 'strategy-plan') {
    const match = response.match(/\[BEGIN_STRATEGY_PLAN\]([\s\S]*?)\[END_STRATEGY_PLAN\]/i)
    if (match) {
      return {
        type: 'strategy_plan',
        content: match[1].trim(),
        formatted: true
      }
    }
  }

  // Fallback for unstructured content
  return {
    type: 'general',
    content: response,
    formatted: false
  }
}

// Search for relevant intelligence
async function searchForIntelligence(query: string, context: any) {
  console.log('🔍 Searching for intelligence...')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // First check for cached/saved searches
  const { data: savedSearches } = await supabase
    .from('fireplexity_searches')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  let searchResults = []

  if (savedSearches && savedSearches.length > 0) {
    console.log('📚 Using saved search data')
    const latestSearch = savedSearches[0]
    if (latestSearch.results?.articles) {
      searchResults = latestSearch.results.articles.slice(0, 10)
    }
  }

  // If no saved data, call niv-fireplexity
  if (searchResults.length === 0) {
    console.log('🌐 Calling niv-fireplexity for fresh search...')
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/niv-fireplexity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          query: query,
          timeWindow: '48h',
          context: context
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.articles) {
          searchResults = data.articles.slice(0, 10)
        }
      }
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  return searchResults
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, sessionId = 'default', context = {} } = await req.json()

    console.log('🤖 NIV Processing:', {
      message: message.substring(0, 100),
      sessionId
    })

    if (!message) {
      throw new Error('Message is required')
    }

    // Detect query type
    const queryType = detectQueryType(message)
    console.log(`📋 Query type detected: ${queryType}`)

    let enrichedContext = context
    let searchResults = []

    // For intelligence queries, get relevant data first
    if (queryType === 'intelligence') {
      searchResults = await searchForIntelligence(message, context)

      if (searchResults.length > 0) {
        // Format search results for Claude
        enrichedContext = {
          ...context,
          latestIntelligence: searchResults.map(article => ({
            title: article.title,
            description: article.description || article.summary,
            source: article.source?.name || 'Unknown',
            url: article.url,
            relevance: article.relevance_score || 50,
            competitors: article.competitive_entities || [],
            published: article.publishedAt || 'Recent'
          }))
        }

        console.log(`📊 Enriched context with ${searchResults.length} articles`)
      }
    }

    // Call Claude with enhanced prompt
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: NIV_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: queryType === 'intelligence' && enrichedContext.latestIntelligence
              ? `${message}\n\nHere's the latest intelligence data:\n${JSON.stringify(enrichedContext.latestIntelligence, null, 2)}\n\nPlease analyze this and provide a formatted intelligence report.`
              : message
          }
        ]
      }),
    })

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.text()
      throw new Error(`Claude API error: ${error}`)
    }

    const claudeData = await anthropicResponse.json()
    const responseText = claudeData.content[0].text

    // Extract structured content
    const structuredContent = extractStructuredContent(responseText, queryType)

    console.log('✅ NIV Response generated:', {
      type: structuredContent.type,
      formatted: structuredContent.formatted
    })

    // Return structured response
    return new Response(
      JSON.stringify({
        success: true,
        message: responseText,
        structured: structuredContent,
        queryType: queryType,
        hasIntelligence: searchResults.length > 0,
        sessionId: sessionId
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('❌ NIV Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})