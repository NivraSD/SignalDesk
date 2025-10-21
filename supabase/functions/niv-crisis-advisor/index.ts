import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CRISIS_SYSTEM_PROMPT = `You are an experienced crisis management expert providing immediate, actionable guidance during an active crisis.

CRISIS CONTEXT:
- Type: {crisis_type}
- Severity: {severity}
- Status: {status}
- Time Elapsed: {elapsed_time}
- Triggering Event: {trigger_event}

LOADED CRISIS PLAN:
{crisis_plan_content}

RECENT SOCIAL SIGNALS:
{recent_social_signals}

TEAM STATUS:
{team_status}

YOUR DIRECTIVE:
1. Provide ONE specific action to take right now
2. Reference the crisis plan section if applicable
3. Keep responses under 100 words
4. Be directive ("Do X") not exploratory ("You could...")
5. Include WHO should do it and WHEN

RESPONSE FORMAT:
ACTION: [Specific action]
WHO: [Person/role]
WHEN: [Timeframe]
WHY: [Brief rationale - 1 sentence]
PLAN REFERENCE: [Section if applicable]

EXAMPLES:
Bad: "You could consider reaching out to stakeholders or maybe drafting a statement..."
Good: "ACTION: Call crisis team lead (John Smith, 555-1234) immediately. WHO: You. WHEN: Next 5 minutes. WHY: Plan Section 2.1 requires team activation within 15 minutes of crisis declaration. PLAN REFERENCE: Section 2.1 - Crisis Team Activation"

Remember: ONE action, be directive, reference the plan.`

interface CrisisEvent {
  id: string
  organization_id: string
  crisis_type: string
  severity: string
  status: string
  title: string
  description?: string
  started_at: string
  resolved_at?: string
  duration_minutes?: number
  timeline: any[]
  decisions: any[]
  communications: any[]
  ai_interactions: any[]
  team_status: Record<string, any>
  tasks: any[]
  trigger_source?: string
  trigger_data?: any
  crisis_plan_id?: string
  social_signals: any[]
  media_coverage: any[]
  stakeholder_sentiment: Record<string, any>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

interface CrisisPlan {
  id: string
  organization_id: string
  title: string
  content_type: string
  content: any
  metadata: Record<string, any>
}

// Helper: Calculate elapsed time in human-readable format
function calculateElapsedTime(startedAt: string): string {
  const start = new Date(startedAt)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 60) {
    return `${diffMins} minutes`
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours} hours${mins > 0 ? ` ${mins} minutes` : ''}`
  } else {
    const days = Math.floor(diffMins / 1440)
    const hours = Math.floor((diffMins % 1440) / 60)
    return `${days} days${hours > 0 ? ` ${hours} hours` : ''}`
  }
}

// Helper: Format crisis plan for system prompt
function formatCrisisPlan(plan: CrisisPlan | null): string {
  if (!plan || !plan.content) {
    return 'No crisis plan loaded. Provide general crisis management guidance.'
  }

  const content = plan.content
  let formatted = `Crisis Plan: ${plan.title}\n\n`

  // Format key sections
  if (content.scenarios) {
    const relevantScenario = content.scenarios.find((s: any) =>
      s.type === content.crisis_type || s.title.toLowerCase().includes(content.crisis_type)
    )

    if (relevantScenario) {
      formatted += `CURRENT SCENARIO: ${relevantScenario.title}\n`
      formatted += `Severity: ${relevantScenario.severity}\n\n`

      if (relevantScenario.response_protocol) {
        formatted += `RESPONSE PROTOCOL:\n`
        const protocol = relevantScenario.response_protocol
        if (protocol.immediate_actions) {
          formatted += `- Immediate: ${protocol.immediate_actions.join(', ')}\n`
        }
        if (protocol.hour_1) {
          formatted += `- Hour 1: ${protocol.hour_1.join(', ')}\n`
        }
        if (protocol.hour_24) {
          formatted += `- First 24h: ${protocol.hour_24.join(', ')}\n`
        }
      }

      if (relevantScenario.team_roles) {
        formatted += `\nTEAM ROLES:\n`
        Object.entries(relevantScenario.team_roles).forEach(([role, contact]: [string, any]) => {
          formatted += `- ${role}: ${contact}\n`
        })
      }
    }
  }

  if (content.emergency_contacts) {
    formatted += `\nEMERGENCY CONTACTS:\n`
    content.emergency_contacts.slice(0, 5).forEach((contact: any) => {
      formatted += `- ${contact.name} (${contact.role}): ${contact.phone}\n`
    })
  }

  return formatted
}

// Helper: Format social signals
function formatSocialSignals(signals: any[]): string {
  if (!signals || signals.length === 0) {
    return 'No recent social signals detected.'
  }

  const recent = signals.slice(-5) // Last 5 signals
  let formatted = 'Recent Activity:\n'

  recent.forEach((signal: any) => {
    formatted += `- ${signal.platform || 'Social'}: ${signal.summary || signal.content?.substring(0, 100)}\n`
    if (signal.sentiment) {
      formatted += `  Sentiment: ${signal.sentiment}\n`
    }
  })

  return formatted
}

// Helper: Format team status
function formatTeamStatus(teamStatus: Record<string, any>): string {
  if (!teamStatus || Object.keys(teamStatus).length === 0) {
    return 'No team members currently assigned.'
  }

  let formatted = 'Team Status:\n'
  Object.entries(teamStatus).forEach(([userId, status]: [string, any]) => {
    formatted += `- ${status.role || 'Team Member'}: ${status.status || 'Unknown'}\n`
    if (status.contact) {
      formatted += `  Contact: ${status.contact}\n`
    }
  })

  return formatted
}

// Helper: Build conversation history for Claude
function buildConversationHistory(aiInteractions: any[]): any[] {
  const messages: any[] = []

  aiInteractions.forEach((interaction: any) => {
    messages.push({
      role: 'user',
      content: interaction.user_msg || interaction.message
    })
    messages.push({
      role: 'assistant',
      content: interaction.ai_response || interaction.response
    })
  })

  return messages
}

serve(async (req) => {
  try {
    const {
      crisis_event_id,
      message,
      organization_id
    } = await req.json()

    if (!crisis_event_id || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: crisis_event_id, message' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Load crisis event
    const { data: crisisEvent, error: crisisError } = await supabase
      .from('crisis_events')
      .select('*')
      .eq('id', crisis_event_id)
      .single<CrisisEvent>()

    if (crisisError || !crisisEvent) {
      return new Response(
        JSON.stringify({ error: 'Crisis event not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Load crisis plan if available
    let crisisPlan: CrisisPlan | null = null
    if (crisisEvent.crisis_plan_id) {
      const { data: planData } = await supabase
        .from('content_library')
        .select('*')
        .eq('id', crisisEvent.crisis_plan_id)
        .single<CrisisPlan>()

      crisisPlan = planData
    }

    // Build system prompt with context
    const systemPrompt = CRISIS_SYSTEM_PROMPT
      .replace('{crisis_type}', crisisEvent.crisis_type)
      .replace('{severity}', crisisEvent.severity)
      .replace('{status}', crisisEvent.status)
      .replace('{elapsed_time}', calculateElapsedTime(crisisEvent.started_at))
      .replace('{trigger_event}', crisisEvent.trigger_data?.summary || crisisEvent.title)
      .replace('{crisis_plan_content}', formatCrisisPlan(crisisPlan))
      .replace('{recent_social_signals}', formatSocialSignals(crisisEvent.social_signals))
      .replace('{team_status}', formatTeamStatus(crisisEvent.team_status))

    // Build conversation history
    const conversationHistory = buildConversationHistory(crisisEvent.ai_interactions || [])

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        temperature: 0.3, // Low temp for consistent crisis response
        system: systemPrompt,
        messages: [
          ...conversationHistory,
          { role: 'user', content: message }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Claude API error:', error)
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const aiResponse = await response.json()
    const content = aiResponse.content[0].text

    // Log interaction to crisis event
    const updatedInteractions = [
      ...(crisisEvent.ai_interactions || []),
      {
        time: new Date().toISOString(),
        user_msg: message,
        ai_response: content
      }
    ]

    await supabase
      .from('crisis_events')
      .update({ ai_interactions: updatedInteractions })
      .eq('id', crisis_event_id)

    // Also add to timeline
    const updatedTimeline = [
      ...(crisisEvent.timeline || []),
      {
        time: new Date().toISOString(),
        type: 'ai_interaction',
        content: `User: ${message}\nAI: ${content.substring(0, 200)}...`,
        actor: 'crisis-ai-advisor'
      }
    ]

    await supabase
      .from('crisis_events')
      .update({ timeline: updatedTimeline })
      .eq('id', crisis_event_id)

    // Return response
    return new Response(JSON.stringify({
      success: true,
      response: content,
      crisis_context: {
        type: crisisEvent.crisis_type,
        severity: crisisEvent.severity,
        status: crisisEvent.status,
        elapsed_time: calculateElapsedTime(crisisEvent.started_at)
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Crisis advisor error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
