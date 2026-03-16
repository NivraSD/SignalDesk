import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders, jsonResponse, errorResponse, handleCors } from '../_shared/cors.ts'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent'
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages'

interface ExecutionRequest {
  blueprintBase: any
  orchestrationStrategy: any
  organizationContext: {
    name: string
    industry: string
  }
}

async function callGemini(prompt: string, systemPrompt: string, apiKey: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45000)

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.5, maxOutputTokens: 6000 }
      }),
      signal: controller.signal
    })
    if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } finally {
    clearTimeout(timeout)
  }
}

async function callClaude(prompt: string, systemPrompt: string, apiKey: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45000)

  try {
    const res = await fetch(CLAUDE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 6000,
        temperature: 0.5,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    })
    if (!res.ok) throw new Error(`Claude error: ${res.status}`)
    const data = await res.json()
    return data.content?.[0]?.text || ''
  } finally {
    clearTimeout(timeout)
  }
}

serve(async (req: Request) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  try {
    const { blueprintBase, orchestrationStrategy, organizationContext } = await req.json() as ExecutionRequest

    console.log('⚙️ Execution Generator:', {
      pattern: blueprintBase.overview?.pattern,
      stakeholders: orchestrationStrategy.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans?.length || 0,
      org: organizationContext.name
    })

    const geminiKey = Deno.env.get('GOOGLE_AI_API_KEY') || Deno.env.get('GEMINI_API_KEY')
    const claudeKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!geminiKey && !claudeKey) {
      return errorResponse('No AI API key configured', 500)
    }

    // Count content pieces from VECTOR blueprint structure
    let totalContentPieces = 0
    let mediaOutreachCount = 0
    let socialPostCount = 0
    let thoughtLeadershipCount = 0

    const plans = orchestrationStrategy.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans || []

    plans.forEach((plan: any) => {
      plan.influenceLevers?.forEach((lever: any) => {
        const campaign = lever.campaign || {}
        mediaOutreachCount += campaign.mediaPitches?.length || 0
        socialPostCount += campaign.socialPosts?.length || 0
        thoughtLeadershipCount += campaign.thoughtLeadership?.length || 0
        totalContentPieces += (campaign.mediaPitches?.length || 0) +
                             (campaign.socialPosts?.length || 0) +
                             (campaign.thoughtLeadership?.length || 0) +
                             (campaign.additionalTactics?.length || 0)
      })
    })

    const systemPrompt = `You are an expert in VECTOR campaign execution and system-level measurement.

Generate Part 5: Execution Requirements & System-Level Success Metrics.

VECTOR campaigns measure success by:
- Convergence Score: stakeholders encounter message from multiple independent sources
- Narrative Ownership: % of search results/coverage we control
- Indirect Attribution: competitors/media adopting our framing
- Stakeholder Behavior Change: actual actions taken
- System State Achievement: narrative becomes "common knowledge"

Output ONLY valid JSON matching the schema requested.`

    const userPrompt = `# Campaign Overview
Pattern: ${blueprintBase.overview?.pattern || 'VECTOR'}
Duration: ${blueprintBase.overview?.duration || '12 weeks'}
Core Message: ${blueprintBase.messageArchitecture?.coreMessage || 'N/A'}
Organization: ${organizationContext.name} (${organizationContext.industry})
Primary Objective: ${blueprintBase.part1_goalFramework?.primaryObjective || 'N/A'}
Behavioral Goals: ${blueprintBase.part1_goalFramework?.behavioralGoals?.map((bg: any) => bg.desiredBehavior).join(', ') || 'N/A'}

# Content Workload
- Total content pieces: ${totalContentPieces}
- Media pitches: ${mediaOutreachCount}
- Social posts: ${socialPostCount}
- Thought leadership: ${thoughtLeadershipCount}
- Total stakeholders: ${plans.length}

Generate JSON with this structure:
{
  "part5_executionRequirements": {
    "teamBandwidth": {
      "roles": [{ "role": "string", "hoursPerWeek": number, "responsibilities": ["..."], "canBeOutsourced": boolean }],
      "totalHoursPerWeek": number,
      "minimumTeamSize": "string",
      "recommendedTeamSize": "string"
    },
    "budgetRequirements": {
      "essential": [{ "category": "string", "items": ["..."], "totalMonthly": number }],
      "optional": [{ "category": "string", "items": ["..."] }],
      "totalMinimumMonthly": number,
      "totalRecommendedMonthly": number
    },
    "toolsAndPlatforms": {
      "core": [{ "tool": "string", "purpose": "string", "cost": "string" }],
      "monitoring": [{ "tool": "string", "purpose": "string", "cost": "string" }]
    },
    "weeklyExecutionRhythm": {
      "monday": ["..."],
      "tuesdayThursday": ["..."],
      "friday": ["..."]
    },
    "systemLevelSuccessMetrics": {
      "convergenceScore": { "definition": "...", "measurement": ["..."], "why": "..." },
      "narrativeOwnership": { "definition": "...", "measurement": ["..."], "why": "..." },
      "indirectAttribution": { "definition": "...", "measurement": ["..."], "why": "..." },
      "stakeholderBehaviorChange": { "definition": "...", "measurement": ["..."], "why": "..." },
      "pillarPerformanceTracking": {
        "pillar1_owned": { "metrics": ["..."] },
        "pillar2_relationships": { "metrics": ["..."] },
        "pillar3_events": { "metrics": ["..."] },
        "pillar4_media": { "metrics": ["..."] }
      }
    },
    "adaptationStrategy": {
      "performanceReviewCadence": "string",
      "pivotTriggers": [{ "trigger": "string", "diagnosis": "string", "adaptations": ["..."] }],
      "resourceReallocation": { "ifBudgetConstrained": ["..."], "ifTimeConstrained": ["..."] }
    },
    "signaldeskAutomation": {
      "whatSignaldeskHandles": ["..."],
      "whatTeamExecutes": ["..."]
    }
  }
}

CRITICAL: Calculate realistic numbers based on the actual content inventory above. Return ONLY valid JSON.`

    let rawResponse: string
    try {
      rawResponse = geminiKey
        ? await callGemini(userPrompt, systemPrompt, geminiKey)
        : await callClaude(userPrompt, systemPrompt, claudeKey!)
    } catch (primaryErr) {
      console.error('Primary AI failed:', primaryErr)
      if (geminiKey && claudeKey) {
        rawResponse = await callClaude(userPrompt, systemPrompt, claudeKey)
      } else {
        throw primaryErr
      }
    }

    // Parse JSON
    let execution: any
    try {
      execution = JSON.parse(rawResponse)
    } catch {
      const fenceMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (fenceMatch) {
        execution = JSON.parse(fenceMatch[1].trim())
      } else {
        const braceStart = rawResponse.indexOf('{')
        const braceEnd = rawResponse.lastIndexOf('}')
        if (braceStart !== -1 && braceEnd > braceStart) {
          execution = JSON.parse(rawResponse.substring(braceStart, braceEnd + 1))
        } else {
          throw new Error('Failed to parse execution requirements as JSON')
        }
      }
    }

    console.log('✅ Execution requirements generated successfully')

    return jsonResponse(execution)

  } catch (error) {
    console.error('Execution generator error:', error)
    return errorResponse(error.message || 'Execution generator failed', 500)
  }
})
