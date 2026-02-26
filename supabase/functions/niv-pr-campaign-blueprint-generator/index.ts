import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PRBlueprintRequest {
  sessionId?: string
  researchData: any
  selectedPositioning: any
  campaignGoal: string
  organizationContext: {
    name: string
    industry: string
  }
}

interface PRCampaignBrief {
  // Campaign Overview
  campaignGoal: string
  organization: string
  industry: string
  positioning: string
  timeline: {
    launch_date: string
    duration: string
    urgency: 'immediate' | 'high' | 'medium' | 'low'
  }

  // Journalist/Media Intelligence
  targetMedia: {
    tier1_outlets: Array<{
      outlet: string
      journalist: string
      beat: string
      recent_coverage: string
      pitch_angle: string
    }>
    tier2_outlets: string[]
    regional_media: string[]
  }

  // Messaging Strategy
  messaging: {
    core_narrative: string
    key_messages: string[]
    proof_points: string[]
    hooks: string[]
    objection_handling: string[]
  }

  // Content Deliverables
  contentRequirements: Array<{
    type: string
    purpose: string
    targetAudience: string
    priority: 'high' | 'medium' | 'low'
    keyPoints: string[]
    specifications: {
      format: string
      length: string
      tone: string
    }
  }>

  // Research Context
  researchInsights: {
    competitive_landscape: string[]
    narrative_opportunities: string[]
    timing_considerations: string[]
    risk_factors: string[]
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json() as PRBlueprintRequest

    console.log('📰 PR Campaign Blueprint Generator starting:', {
      goal: payload.campaignGoal?.substring(0, 50),
      positioning: payload.selectedPositioning?.name,
      org: payload.organizationContext?.name,
      sessionId: payload.sessionId
    })

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    // Extract key information from research data
    const stakeholders = payload.researchData?.stakeholders || []
    const narrativeLandscape = payload.researchData?.narrativeLandscape || {}
    const channelIntelligence = payload.researchData?.channelIntelligence || {}
    const historicalInsights = payload.researchData?.historicalInsights || {}

    // Extract journalist and media information from research
    const journalistData = payload.researchData?.journalists || []
    const mediaOutlets = payload.researchData?.mediaOutlets || []

    // Build the prompt for Claude to generate PR brief
    const prompt = `You are a senior PR strategist with 20 years of experience. Generate a comprehensive PR campaign brief based on the provided research and positioning.

**CAMPAIGN GOAL:**
${payload.campaignGoal}

**ORGANIZATION:**
Name: ${payload.organizationContext.name}
Industry: ${payload.organizationContext.industry}

**POSITIONING:**
${payload.selectedPositioning?.name || 'Not specified'}
${payload.selectedPositioning?.description || ''}

**RESEARCH FINDINGS:**

**Stakeholders:**
${stakeholders.slice(0, 3).map((s: any) => `
- ${s.name}: ${s.description || 'Key stakeholder group'}
  Values: ${s.psychology?.values?.join(', ') || 'Not specified'}
  Information Sources: ${s.informationDiet?.primarySources?.join(', ') || 'Not specified'}
`).join('\n')}

**Narrative Landscape:**
- Dominant Narratives: ${narrativeLandscape.dominantNarratives?.join('; ') || 'Not specified'}
- Narrative Opportunities: ${narrativeLandscape.narrativeVacuums?.join('; ') || 'Not specified'}
- Competitive Positioning: ${narrativeLandscape.competitivePositioning?.join('; ') || 'Not specified'}

**Channel Intelligence:**
${channelIntelligence.byStakeholder?.slice(0, 3).map((c: any) => `
- ${c.stakeholder}: ${c.channels?.join(', ') || 'Not specified'}
`).join('\n')}

**Historical Insights:**
- Successful Patterns: ${historicalInsights.patternRecommendations?.join('; ') || 'Not specified'}
- Risk Factors: ${historicalInsights.riskFactors?.join('; ') || 'Not specified'}

**YOUR TASK:**

Generate a comprehensive PR campaign brief in the following JSON structure. Return ONLY valid JSON, no additional text.

{
  "campaignGoal": "Concise campaign objective (1 sentence)",
  "organization": "${payload.organizationContext.name}",
  "industry": "${payload.organizationContext.industry}",
  "positioning": "Positioning statement (1-2 sentences)",
  "timeline": {
    "launch_date": "YYYY-MM-DD format (suggest optimal launch date based on research)",
    "duration": "X weeks description",
    "urgency": "immediate|high|medium|low"
  },
  "targetMedia": {
    "tier1_outlets": [
      {
        "outlet": "Outlet name (e.g., Bloomberg, TechCrunch)",
        "journalist": "Journalist name or beat",
        "beat": "Coverage area",
        "recent_coverage": "Brief description of recent relevant coverage",
        "pitch_angle": "Specific angle for this outlet"
      }
      // Include 3-5 tier 1 outlets
    ],
    "tier2_outlets": ["List of 5-8 tier 2 outlet names"],
    "regional_media": ["List of 3-5 regional/trade publications"]
  },
  "messaging": {
    "core_narrative": "Overarching story (2-3 sentences, compelling and specific)",
    "key_messages": ["3-5 key messages that should appear in all content"],
    "proof_points": ["5-8 specific proof points, data, evidence"],
    "hooks": ["3-5 news hooks/angles that make this timely and relevant"],
    "objection_handling": ["3-5 potential objections and how to address them"]
  },
  "contentRequirements": [
    {
      "type": "press-release",
      "purpose": "Detailed purpose of this content piece",
      "targetAudience": "Who this is for",
      "priority": "high|medium|low",
      "keyPoints": ["Specific points to include"],
      "specifications": {
        "format": "press-release",
        "length": "500-700 words",
        "tone": "professional"
      }
    },
    {
      "type": "media-pitch",
      "purpose": "Tier 1 journalist outreach",
      "targetAudience": "Top-tier tech journalists",
      "priority": "high",
      "keyPoints": ["Exclusive angle", "Why now", "Why this matters"],
      "specifications": {
        "format": "email-pitch",
        "length": "250-350 words",
        "tone": "professional but personalized"
      }
    },
    {
      "type": "social-post",
      "purpose": "LinkedIn announcement",
      "targetAudience": "Professional network and industry stakeholders",
      "priority": "high",
      "keyPoints": ["Key achievement", "Impact", "Call to action"],
      "specifications": {
        "format": "linkedin-post",
        "platform": "LinkedIn",
        "length": "150-200 words",
        "tone": "professional and engaging"
      }
    },
    {
      "type": "social-post",
      "purpose": "Twitter thread announcement",
      "targetAudience": "Broader tech/industry community",
      "priority": "high",
      "keyPoints": ["Key hook", "Core value prop", "Call to action"],
      "specifications": {
        "format": "twitter-thread",
        "platform": "Twitter",
        "length": "5-7 tweets, 280 chars each",
        "tone": "conversational and engaging"
      }
    },
    {
      "type": "social-post",
      "purpose": "Instagram announcement",
      "targetAudience": "Visual-first audience and brand followers",
      "priority": "medium",
      "keyPoints": ["Visual hook", "Brand story", "Engagement prompt"],
      "specifications": {
        "format": "instagram-post",
        "platform": "Instagram",
        "length": "150-200 words caption",
        "tone": "authentic and visual"
      }
    },
    {
      "type": "qa-document",
      "purpose": "Internal Q&A for spokesperson preparation",
      "targetAudience": "Spokespeople and executives",
      "priority": "high",
      "keyPoints": ["Anticipated questions", "Approved responses", "Key talking points"],
      "specifications": {
        "format": "qa-document",
        "length": "10-15 Q&As",
        "tone": "clear and direct"
      }
    },
    {
      "type": "talking-points",
      "purpose": "Executive briefing document",
      "targetAudience": "C-suite and spokespeople",
      "priority": "medium",
      "keyPoints": ["Core messages", "Key stats", "Bridging phrases"],
      "specifications": {
        "format": "bullet-points",
        "length": "1-2 pages",
        "tone": "concise and clear"
      }
    }
    // Add 5-8 total content pieces
  ],
  "researchInsights": {
    "competitive_landscape": ["3-5 key competitive insights from research"],
    "narrative_opportunities": ["3-5 narrative gaps or opportunities identified"],
    "timing_considerations": ["2-3 timing factors to consider"],
    "risk_factors": ["2-3 potential risks to be aware of"]
  }
}

**REQUIREMENTS:**
1. Be specific - no generic platitudes
2. Base recommendations on the research provided
3. Ensure tier 1 outlets are appropriate for the industry and campaign goal
4. Make pitch angles specific to each outlet's coverage area
5. Ensure key messages are differentiated and compelling
6. Content requirements should be comprehensive but focused (5-8 pieces)
7. All dates should be realistic based on typical PR campaign timelines
8. MUST include social posts for LinkedIn, Twitter, AND Instagram (minimum one per platform)
9. Each social post must include "platform" field in specifications
10. Return ONLY the JSON object, nothing else`

    console.log('🤖 Calling Claude to generate PR brief...')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Claude API error:', response.status, errorText)
      throw new Error(`Claude API failed: ${response.status}`)
    }

    const data = await response.json()
    const briefText = data.content[0].text.trim()

    console.log('📄 Claude response received, parsing JSON...')

    // Extract JSON from response
    const jsonMatch = briefText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('❌ No JSON found in Claude response')
      console.error('Response preview:', briefText.substring(0, 500))
      throw new Error('Failed to parse PR brief from Claude response')
    }

    const prBrief: PRCampaignBrief = JSON.parse(jsonMatch[0])

    console.log('✅ PR Brief generated successfully')
    console.log(`   Goal: ${prBrief.campaignGoal}`)
    console.log(`   Tier 1 Outlets: ${prBrief.targetMedia.tier1_outlets.length}`)
    console.log(`   Key Messages: ${prBrief.messaging.key_messages.length}`)
    console.log(`   Content Pieces: ${prBrief.contentRequirements.length}`)

    // Save brief to database if sessionId provided
    if (payload.sessionId) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        await supabase
          .from('campaign_builder_sessions')
          .update({
            blueprint: prBrief,
            current_stage: 'blueprint',
            updated_at: new Date().toISOString()
          })
          .eq('id', payload.sessionId)

        console.log('💾 PR brief saved to session')
      } catch (dbError) {
        console.error('⚠️ Failed to save brief to database (non-critical):', dbError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        brief: prBrief,
        sessionId: payload.sessionId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ PR Blueprint Generator error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to generate PR campaign brief. Check edge function logs for details.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
