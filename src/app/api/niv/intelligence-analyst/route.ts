import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AnalystRequest {
  message: string
  history: ChatMessage[]
  context: {
    organization_name: string
    organization_id: string
    industry: string
    profile?: any
  }
}

const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

const SYSTEM_PROMPT = `You are a senior geopolitical intelligence analyst embedded within ${currentDate}'s briefing cycle. You serve as a real-time research assistant for strategic communications and public affairs professionals.

CRITICAL: Today's date is ${currentDate}. As of 2025-2026, the US President is Donald Trump (second term, inaugurated January 2025). Ensure all political references are current and accurate.

## Your Role
You provide rapid intelligence briefings, answer geopolitical questions, analyze developing situations, and help users understand complex dynamics. You have access to a real-time web search tool to find current information.

## Your Capabilities
1. **Quick Briefings**: Concise, analytical answers to geopolitical and industry questions
2. **Situational Analysis**: Break down complex situations with stakeholder mapping and scenario thinking
3. **Research**: Search for current developments, news, and data points
4. **Strategic Implications**: Connect events to the user's organization and industry

## Communication Style
- Lead with the answer, then provide context
- Be direct and analytical — no filler or hedging
- Name names, cite specifics, quantify where possible
- State confidence levels when making assessments
- Keep responses focused — 2-4 paragraphs for quick questions, more for complex analysis
- Use markdown formatting for readability

## Action Suggestions
When a topic warrants deeper analysis, suggest it naturally:
- If a topic is complex and has significant organizational implications, mention that a full intelligence report could be generated
- Format action suggestions as: **[ACTION:DEEP_REPORT]** followed by a brief description
- Only suggest deep reports when genuinely warranted — not for simple factual questions

## What You Are NOT
- You are not a general-purpose chatbot — stay focused on intelligence, geopolitics, and strategic analysis
- Do not provide legal advice or financial recommendations
- Do not speculate without flagging it as speculation`

// Tool definition for fireplexity search
const searchTool: Anthropic.Tool = {
  name: 'web_search',
  description: 'Search the web for current news, developments, and intelligence on geopolitical topics, industry events, regulatory changes, and more. Use this when you need current information to answer a question accurately.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'The search query. Be specific and include relevant context like dates, names, or locations.'
      },
      focus: {
        type: 'string',
        enum: ['geopolitical_intelligence', 'stakeholder_analysis', 'impact_assessment', 'news', 'regulatory'],
        description: 'The focus area for the search to help prioritize relevant results.'
      }
    },
    required: ['query']
  }
}

async function executeSearch(query: string, focus?: string): Promise<string> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_type: 'comprehensive',
        focus: focus || 'geopolitical_intelligence',
        max_results: 10,
        sources: ['web', 'news'],
        timeframe: '30d'
      })
    })

    if (!response.ok) {
      return `Search returned no results for: ${query}`
    }

    const data = await response.json()
    const answer = data.answer || data.results || ''
    const articles = data.articles || data.findings || []

    let result = ''
    if (answer) {
      result += typeof answer === 'string' ? answer : JSON.stringify(answer)
    }
    if (articles.length > 0) {
      result += '\n\nKey sources:\n'
      articles.slice(0, 5).forEach((a: any) => {
        result += `- ${a.title || a.headline || 'Source'}: ${a.summary || a.content?.substring(0, 200) || ''}\n`
      })
    }

    return result || `No relevant results found for: ${query}`
  } catch (err) {
    console.error('Search error:', err)
    return `Search unavailable. Answering from existing knowledge.`
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalystRequest = await request.json()
    const { message, history, context } = body

    const orgContext = context.profile
      ? `\n## Client Profile\nOrganization: ${context.organization_name}\nIndustry: ${context.industry}\nProfile: ${JSON.stringify(context.profile).substring(0, 1500)}`
      : `\n## Client Profile\nOrganization: ${context.organization_name}\nIndustry: ${context.industry}`

    const systemPrompt = SYSTEM_PROMPT + orgContext

    // Build messages
    const messages: Anthropic.MessageParam[] = []
    for (const msg of (history || []).slice(-20)) {
      messages.push({ role: msg.role, content: msg.content })
    }
    messages.push({ role: 'user', content: message })

    // Call Claude with tool use
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      tools: [searchTool],
      messages
    })

    // Handle tool use loop (max 3 iterations)
    let iterations = 0
    const toolMessages: Anthropic.MessageParam[] = [...messages]

    while (response.stop_reason === 'tool_use' && iterations < 3) {
      iterations++

      // Add assistant message with tool calls
      toolMessages.push({ role: 'assistant', content: response.content })

      // Process each tool use
      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const input = block.input as { query: string; focus?: string }
          const result = await executeSearch(input.query, input.focus)
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result
          })
        }
      }

      // Add tool results
      toolMessages.push({ role: 'user', content: toolResults })

      // Continue conversation
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        tools: [searchTool],
        messages: toolMessages
      })
    }

    // Extract final text response
    const textBlocks = response.content.filter(c => c.type === 'text')
    const responseText = textBlocks.map(c => c.type === 'text' ? c.text : '').join('\n\n')

    // Check if the response suggests a deep report
    const suggestsDeepReport = responseText.includes('[ACTION:DEEP_REPORT]')

    return NextResponse.json({
      response: responseText.replace(/\*\*\[ACTION:DEEP_REPORT\]\*\*/g, '').trim(),
      suggests_deep_report: suggestsDeepReport,
      search_used: iterations > 0,
      usage: response.usage
    })

  } catch (error) {
    console.error('Intelligence analyst error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
