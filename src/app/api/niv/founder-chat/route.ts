import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

interface FounderTask {
  id: string
  title: string
  status: string
  priority: string
  category: string
  due_date?: string
}

interface LaunchMilestone {
  id: string
  name: string
  date: string
  status: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface FounderContext {
  company_name?: string
  company_description?: string
  launch_date?: string
  current_focus?: string
  goals?: string[]
  challenges?: string[]
}

interface FounderChatRequest {
  message: string
  context: {
    tasks: FounderTask[]
    milestones: LaunchMilestone[]
    founderContext?: FounderContext
    mode: string
  }
  history: ChatMessage[]
}

const FOUNDER_SYSTEM_PROMPT = `You are NIV, an AI assistant specifically designed to help solo founders launch their products. You have 25+ years of virtual experience in startups, product launches, and strategic communications.

## Your Role
You are a trusted advisor, co-pilot, and accountability partner for a founder preparing to launch. You know their tasks, milestones, and goals intimately. You help them:

1. **Stay Focused**: Help prioritize what matters most today
2. **Break Down Complexity**: Turn overwhelming goals into actionable tasks
3. **Create Content**: Draft pitch decks, investor updates, launch materials
4. **Research & Analyze**: Investigate markets, competitors, opportunities
5. **Stay Accountable**: Remind them of deadlines and commitments
6. **Provide Perspective**: Offer strategic advice from experience

## Your Personality
- Direct and efficient (founders are busy)
- Encouraging but realistic (no toxic positivity)
- Proactive (suggest what they might be missing)
- Strategic (always connect tasks to bigger goals)
- Empathetic (solo founding is hard, acknowledge the struggle)

## Current Context
You have access to the founder's current tasks and milestones. Use this context to provide relevant, personalized advice. Reference specific tasks and milestones when appropriate.

## Communication Style
- Keep responses concise unless detail is requested
- Use bullet points for actionable items
- Ask clarifying questions when needed
- Offer to help with specific next steps
- Don't repeat information they already know

## What You Can Help With
- Task breakdown and prioritization
- Drafting content (emails, pitches, posts, updates)
- Research on markets, competitors, trends
- Strategic planning and decision-making
- Milestone tracking and accountability
- Emotional support and perspective

Remember: You're not just an assistant, you're a co-founder AI. Act like it.`

export async function POST(request: NextRequest) {
  try {
    const body: FounderChatRequest = await request.json()
    const { message, context, history } = body

    // Build context string from tasks and milestones
    const contextString = buildContextString(context)

    // Build conversation messages
    const messages: Anthropic.MessageParam[] = []

    // Add history
    for (const msg of history || []) {
      messages.push({
        role: msg.role,
        content: msg.content
      })
    }

    // Add current message
    messages.push({
      role: 'user',
      content: `${contextString}\n\n${message}`
    })

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: FOUNDER_SYSTEM_PROMPT,
      messages
    })

    // Extract text response
    const textContent = response.content.find(c => c.type === 'text')
    const responseText = textContent ? textContent.text : 'I apologize, I was unable to generate a response.'

    return NextResponse.json({
      response: responseText,
      usage: response.usage
    })

  } catch (error) {
    console.error('Founder chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}

function buildContextString(context: FounderChatRequest['context']): string {
  const { tasks, milestones, founderContext } = context

  const parts: string[] = []

  // Founder Profile Context
  if (founderContext) {
    parts.push(`## Founder Profile`)
    if (founderContext.company_name) {
      parts.push(`Company: ${founderContext.company_name}`)
    }
    if (founderContext.company_description) {
      parts.push(`Description: ${founderContext.company_description}`)
    }
    if (founderContext.current_focus) {
      parts.push(`Current Focus: ${founderContext.current_focus}`)
    }
    if (founderContext.launch_date) {
      const launchDate = new Date(founderContext.launch_date)
      const daysUntil = Math.ceil((launchDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      parts.push(`Launch Date: ${launchDate.toLocaleDateString()} (${daysUntil} days away)`)
    }
    if (founderContext.goals && founderContext.goals.length > 0) {
      parts.push(`Goals: ${founderContext.goals.join(', ')}`)
    }
    if (founderContext.challenges && founderContext.challenges.length > 0) {
      parts.push(`Challenges: ${founderContext.challenges.join(', ')}`)
    }
  }

  // Tasks summary
  if (tasks && tasks.length > 0) {
    const openTasks = tasks.filter(t => t.status !== 'done')
    const criticalTasks = openTasks.filter(t => t.priority === 'critical' || t.priority === 'high')
    const inProgressTasks = openTasks.filter(t => t.status === 'in_progress')

    parts.push(`\n## Current Tasks`)
    parts.push(`- Open: ${openTasks.length} | High Priority: ${criticalTasks.length} | In Progress: ${inProgressTasks.length}`)

    if (criticalTasks.length > 0) {
      parts.push(`\nPriority Tasks:`)
      criticalTasks.slice(0, 5).forEach(t => {
        const dueStr = t.due_date ? ` (Due: ${new Date(t.due_date).toLocaleDateString()})` : ''
        parts.push(`- [${t.status}] ${t.title}${dueStr}`)
      })
    }

    if (inProgressTasks.length > 0 && inProgressTasks.length <= 3) {
      parts.push(`\nIn Progress:`)
      inProgressTasks.forEach(t => {
        parts.push(`- ${t.title}`)
      })
    }
  }

  // Milestones summary
  if (milestones && milestones.length > 0) {
    const upcoming = milestones.filter(m => m.status === 'upcoming')
    const today = new Date()

    if (upcoming.length > 0) {
      parts.push(`\n## Milestones`)
      upcoming.slice(0, 3).forEach(m => {
        const daysUntil = Math.ceil((new Date(m.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        parts.push(`- ${m.name}: ${daysUntil} days`)
      })
    }
  }

  return parts.length > 0 ? parts.join('\n') : ''
}
