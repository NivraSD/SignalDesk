import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CrisisScenarioRequest {
  organization_id: string
  organization_name: string
  enriched_data?: any // Optional: from recent monitoring
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organization_id, organization_name, enriched_data } = await req.json() as CrisisScenarioRequest

    console.log('🚨 Crisis Scenario Generator:', organization_name)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // STEP 1: Load organization profile
    const { data: profileData } = await supabase
      .from('organization_profiles')
      .select('profile_data')
      .eq('organization_name', organization_name)
      .single()

    const profile = profileData?.profile_data

    // STEP 2: Load intelligence targets (competitors, stakeholders, topics)
    const { data: targetsData } = await supabase
      .from('intelligence_targets')
      .select('*')
      .eq('organization_id', organization_id)

    const targets = {
      competitors: [] as string[],
      stakeholders: [] as string[],
      topics: [] as string[]
    }

    targetsData?.forEach((target: any) => {
      if (target.type === 'competitor' && target.name) {
        targets.competitors.push(target.name)
      } else if (target.type === 'stakeholder' && target.name) {
        targets.stakeholders.push(target.name)
      } else if (target.type === 'topic' && target.name) {
        targets.topics.push(target.name)
      }
    })

    console.log('📊 Intelligence context:', {
      competitors: targets.competitors.length,
      stakeholders: targets.stakeholders.length,
      topics: targets.topics.length,
      has_enriched_data: !!enriched_data
    })

    // STEP 3: Generate intelligent scenarios using Claude
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an intelligent crisis scenario planner. Generate realistic, organization-specific crisis scenarios based on:
- Actual competitors, stakeholders, and strategic topics being monitored
- Industry context and vulnerabilities
- Recent intelligence data (if available)

Your scenarios should be:
- SPECIFIC to this organization's context
- ACTIONABLE with clear trigger signals
- REALISTIC based on actual threats
- DIVERSE across different risk categories

Focus on 4 categories:
1. Competitor threats (2-3 scenarios) - General patterns but contextualized
2. Stakeholder risks (1-2 scenarios) - Specific to actual stakeholders
3. Topic-based crises (1-2 scenarios) - Based on strategic topics being monitored
4. Industry incidents (1 scenario) - Industry-specific operational risks`

    const userPrompt = `Generate 6-7 crisis scenarios for ${organization_name}.

# ORGANIZATION CONTEXT
**Industry:** ${profile?.industry || 'Unknown'}
**Business Model:** ${profile?.business_model || 'Unknown'}

# INTELLIGENCE TARGETS (What we're monitoring)

**Competitors (${targets.competitors.length}):**
${targets.competitors.slice(0, 10).map((c: string) => `- ${c}`).join('\n')}
${targets.competitors.length > 10 ? `... and ${targets.competitors.length - 10} more` : ''}

**Stakeholders (${targets.stakeholders.length}):**
${targets.stakeholders.map((s: string) => `- ${s}`).join('\n')}

**Strategic Topics (${targets.topics.length}):**
${targets.topics.map((t: string) => `- ${t}`).join('\n')}

${enriched_data ? `
# RECENT INTELLIGENCE
Recent events and trends from monitoring:
${JSON.stringify(enriched_data.executive_summary || enriched_data.organized_intelligence || {}, null, 2).substring(0, 2000)}
` : ''}

# SCENARIO REQUIREMENTS

Generate 6-7 scenarios following these categories:

1. **COMPETITOR THREATS (2-3 scenarios):**
   - Keep these general but contextual (don't name specific competitors)
   - Examples: "Major competitor launches aggressive pricing", "Competitor announces significant acquisition"
   - Use actual competitive landscape to make realistic

2. **STAKEHOLDER RISKS (1-2 scenarios):**
   - Be SPECIFIC - use actual stakeholder names from the list above
   - Examples: "Activist investor X launches ESG campaign", "Regulator Y announces new requirements"

3. **TOPIC-BASED CRISES (1-2 scenarios):**
   - Be SPECIFIC - use actual topics from the list above
   - Examples: "Supply chain disruption impacts key commodities", "Energy transition policy threatens investments"

4. **INDUSTRY INCIDENT (1 scenario):**
   - Industry-specific operational crisis based on their business
   - Examples: "Mining accident overseas", "Commodity price collapse", "Major contract loss"

# OUTPUT FORMAT (STRICT JSON)

Return ONLY valid JSON with this EXACT structure:

{
  "scenarios": [
    {
      "category": "competitor_threat",
      "title": "Major Competitor Launches Aggressive Market Expansion",
      "description": "A major competitor announces significant investment and expansion in our key markets",
      "trigger_signals": [
        "Competitor announces major funding round or acquisition",
        "Increased competitive pricing pressure detected",
        "Loss of key accounts to specific competitor"
      ],
      "severity": "high",
      "icon": "flame",
      "immediate_actions": [
        {
          "action": "Convene crisis response team within 2 hours",
          "owner": "Executive team",
          "timing": "0-2 hours"
        },
        {
          "action": "Analyze competitor announcement and strategic implications",
          "owner": "Strategy team",
          "timing": "2-6 hours"
        },
        {
          "action": "Prepare counter-positioning messaging",
          "owner": "Communications team",
          "timing": "6-12 hours"
        }
      ]
    }
  ]
}

Categories: "competitor_threat", "stakeholder_risk", "topic_crisis", "industry_incident"
Icons: "flame", "alert-triangle", "shield", "dollar-sign", "users", "activity", "target"
Severity: "critical", "high", "medium"

Generate 6-7 scenarios that cover all 4 categories. Use the organization's actual intelligence targets to make scenarios realistic and specific.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.8,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let jsonText = content.text.trim()

    // Clean JSON
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?|\n?```/g, '').trim()
    }

    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    jsonText = jsonText
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/'/g, '"')

    const scenarios = JSON.parse(jsonText)

    console.log(`✅ Generated ${scenarios.scenarios?.length || 0} intelligent crisis scenarios`)

    return new Response(
      JSON.stringify(scenarios),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Crisis scenario generator error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        scenarios: [] // Fallback to empty
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
