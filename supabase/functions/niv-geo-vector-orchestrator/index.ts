// GEO-VECTOR Blueprint Orchestrator
// Generates complete 12-week tactical plan for AI visibility optimization

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeoVectorRequest {
  geoResearchData?: any
  campaignGoal: string
  objective: 'drive_sales' | 'thought_leadership' | 'technical_adoption'
  selectedContentTypes: {
    automated: Array<{ id: string, label: string, citation_rate: number }>
    user_assisted: Array<{ id: string, label: string, citation_rate: number, time_per_week: number }>
  }
  constraints?: {
    time_per_week: number
    technical_capability: string
  }
  organizationName: string
  industry: string
  session_id?: string
  organization_id?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      geoResearchData,
      campaignGoal,
      objective,
      selectedContentTypes,
      constraints,
      organizationName,
      industry,
      session_id,
      organization_id
    } = await req.json() as GeoVectorRequest

    console.log('🎯 GEO-VECTOR Blueprint Generator:', {
      objective,
      automated_count: selectedContentTypes.automated.length,
      user_assisted_count: selectedContentTypes.user_assisted.length,
      organization: organizationName
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    // Build comprehensive context for Claude
    const context = {
      organization: {
        name: organizationName,
        industry,
        goal: campaignGoal
      },
      objective,
      selectedContent: selectedContentTypes,
      constraints: constraints || { time_per_week: 2, technical_capability: 'medium' },
      geoResearch: geoResearchData || {
        note: 'No GEO research provided, using general recommendations'
      }
    }

    const systemPrompt = `You are an expert in GEO-VECTOR campaign orchestration - optimizing content for AI platform visibility.

## Core Philosophy
GEO-VECTOR campaigns don't target humans - they engineer content that AI platforms cite and trust.
- Structured data first: Schemas have 75% citation rates
- High-authority sources: G2, documentation, case studies outperform blogs
- User-assisted quality: Best results come from SignalDesk-generated + user-reviewed content

## AI Platform Priorities

**ChatGPT (OpenAI GPT-4o):**
- Prioritizes: Structured data, authoritative sources, recent content
- Strong on: Product comparisons, how-to queries, technical documentation
- Weak on: Breaking news (no real-time search), highly opinionated content

**Claude (Anthropic):**
- Prioritizes: Long-form authoritative content, technical accuracy
- Strong on: Technical deep-dives, thoughtful analysis, ethical considerations
- Weak on: Product recommendations (cautious about endorsements)

**Perplexity (Sonar):**
- Prioritizes: Cited sources, factual data, diverse perspectives
- Strong on: Research queries, data-driven questions, comparisons
- Weak on: Subjective recommendations

**Gemini (Google):**
- Prioritizes: Structured data, Google-indexed content, authoritative domains
- Strong on: Factual queries, definitions, broad comparisons
- Weak on: Niche technical content

## Content Type Execution (ONLY use provided types)

For each content type provided in selectedContentTypes, you MUST specify:
1. **what_signaldesk_does**: Exactly what SignalDesk auto-generates
2. **user_action**: What user must do (be specific and actionable)
3. **deliverables**: Concrete outputs (schema JSON, blog drafts, templates, etc.)
4. **timeline**: Which week(s) to execute
5. **success_metric**: How to measure if it worked

### Content Type Details

**schema-optimization**:
- SignalDesk generates: Product, FAQ, Organization schemas (complete JSON-LD)
- User deploys: One script tag to website <head>
- Deliverables: Hosted endpoint + deployment script
- Impact: 75% citation rate, 2-4 weeks
- CRITICAL: This is ALWAYS priority #1 for ANY objective

**case-study**:
- SignalDesk generates: 3-5 customer success stories (1500 words each)
- User action: Review for accuracy, add customer quotes, publish
- Deliverables: Full blog-style case studies with metrics
- Impact: 55% citation, 2-4 weeks

**blog-post**:
- SignalDesk generates: 2-3 posts per week (800-1200 words)
- User action: Review, publish to blog, share on social
- Deliverables: SEO-optimized posts with target keywords
- Impact: 40-50% citation depending on topic

**comparison-copy** (G2/Capterra):
- SignalDesk generates: Profile description, feature list, review request templates
- User action: Copy-paste to profile, send review requests
- Deliverables: Complete profile copy + outreach templates
- Impact: 65% citation, 2-4 weeks

**doc-outline** (Documentation):
- SignalDesk generates: Structure, FAQs, use cases, comparison tables
- User action: Fill technical details, add code examples, publish
- Deliverables: Documentation framework (10-15 pages outlined)
- Impact: 70% citation, 2-4 weeks

**stackoverflow-answer**:
- SignalDesk generates: Weekly digest of relevant questions + suggested answers
- User action: Review answers, post from personal account
- Deliverables: Answer templates with code examples
- Impact: 70% citation, 1-2 weeks

**media-pitch**:
- SignalDesk generates: Journalist list (from 149+ database) + personalized pitches
- User action: Send pitches, follow up with journalists
- Deliverables: Pitch templates + media list + HARO response templates
- Impact: 55% citation (earned media), 2-8 weeks

**linkedin-post**:
- SignalDesk generates: 2-3 thought leadership posts per week
- User action: Post from executive account, engage with comments
- Deliverables: Ready-to-post LinkedIn content
- Impact: 40% citation, 1-2 weeks

**whitepaper**:
- SignalDesk generates: 10-15 page industry analysis (5000+ words)
- User action: Review, add company-specific data, publish with gated download
- Deliverables: Complete whitepaper with executive summary
- Impact: 60% citation, 4-8 weeks

**thought-leadership**:
- SignalDesk generates: Opinion pieces on industry trends
- User action: Review, publish to Medium/LinkedIn/blog
- Deliverables: 1500-word articles with unique perspective
- Impact: 35% citation, 2-4 weeks

**video-script**:
- SignalDesk generates: Video scripts (product demos, tutorials) with talking points
- User action: Record video (iPhone or professional), upload to YouTube
- Deliverables: Script, B-roll suggestions, thumbnail copy
- Impact: 45% citation, 2-4 weeks

## Blueprint Structure Requirements

Output ONLY valid JSON matching this EXACT structure:

{
  "type": "geo_vector",

  "strategicFoundation": {
    "primaryObjective": "Objective from input (drive_sales|thought_leadership|technical_adoption)",
    "targetQueries": ["query1", "query2", ...], // 5-10 queries where we want AI citations
    "aiPlatformPriorities": {
      "chatgpt": { "importance": "critical|high|medium|low", "rationale": "Why", "optimization_focus": "What to prioritize" },
      "claude": { "importance": "...", "rationale": "...", "optimization_focus": "..." },
      "perplexity": { "importance": "...", "rationale": "...", "optimization_focus": "..." },
      "gemini": { "importance": "...", "rationale": "...", "optimization_focus": "..." }
    },
    "successMetrics": ["metric1", "metric2", "metric3"] // Measurable outcomes
  },

  "geoSourceAnalysis": {
    "sourceImportance": {
      "schemas": {
        "priority": "critical|high|medium|low",
        "missing_schemas": ["Product", "FAQ", "Organization"],
        "opportunity_score": 90,
        "reasoning": "Why this matters for objective"
      },
      "comparison_sites": {
        "priority": "...",
        "current_presence": "none|basic|optimized",
        "opportunity_score": 85,
        "reasoning": "..."
      },
      "documentation": {
        "priority": "...",
        "current_presence": "...",
        "opportunity_score": 70,
        "reasoning": "..."
      }
      // Add more sources based on selected content types
    }
  },

  "threeTierTacticalPlan": {
    "automated": [
      {
        "content_type": "schema-optimization", // Must match selectedContentTypes.automated[].id
        "priority": 1, // 1 is highest
        "timeline": "Week 1",
        "what_signaldesk_does": "Specific description",
        "user_action": "Specific action required",
        "deliverables": {
          // Specific deliverables based on content type
        },
        "citation_rate": 75, // From selectedContentTypes
        "time_to_impact": "2-4 weeks",
        "execution_method": "one_click|generate_and_review|scheduled",
        "success_metric": "How to measure success"
      }
      // ... one entry for EACH automated content type
    ],
    "userAssisted": [
      {
        "content_type": "comparison-copy", // Must match selectedContentTypes.user_assisted[].id
        "priority": 1,
        "timeline": "Week 2",
        "what_signaldesk_does": [
          "Action 1",
          "Action 2"
        ],
        "user_action": [
          "Step 1",
          "Step 2"
        ],
        "deliverables": {
          // Specific deliverables
        },
        "citation_rate": 65,
        "time_to_impact": "2-4 weeks",
        "time_estimate": "X hours setup + Y hours/week",
        "success_metric": "How to measure"
      }
      // ... one entry for EACH user-assisted content type
    ]
  },

  "executionRoadmap": {
    "week1": {
      "automated": ["Task 1", "Task 2"],
      "user_assisted": ["Task 1", "Task 2"]
    },
    "week2": { "automated": [...], "user_assisted": [...] },
    "week3": { "automated": [...], "user_assisted": [...] },
    "week4": { "automated": [...], "user_assisted": [...] },
    "week5": { "automated": [...], "user_assisted": [...] },
    "week6": { "automated": [...], "user_assisted": [...] },
    "week7": { "automated": [...], "user_assisted": [...] },
    "week8": { "automated": [...], "user_assisted": [...] },
    "week9": { "automated": [...], "user_assisted": [...] },
    "week10": { "automated": [...], "user_assisted": [...] },
    "week11": { "automated": [...], "user_assisted": [...] },
    "week12": { "automated": [...], "user_assisted": [...] }
  },

  "resourceRequirements": {
    "automated_content": {
      "count": ${selectedContentTypes.automated.length},
      "effort": "Minimal (SignalDesk auto-generates)",
      "user_time": "Estimated review/publish time per week"
    },
    "user_assisted_content": {
      "count": ${selectedContentTypes.user_assisted.length},
      "effort": "Moderate|High",
      "breakdown": [
        { "type": "content_type", "time": "time estimate" }
      ]
    },
    "total_timeline": "12 weeks",
    "expected_impact": "Expected visibility increase based on avg citation rate",
    "budget_required": "$0 (all organic)",
    "tools_needed": ["tool1", "tool2"]
  }
}

## Critical Requirements

1. **Include ALL selected content types**: Every item in selectedContentTypes.automated and selectedContentTypes.user_assisted MUST appear in threeTierTacticalPlan
2. **Schema ALWAYS first**: If schema-optimization is in selectedContentTypes, it MUST be priority 1 in week 1
3. **Realistic timelines**: Spread content over 12 weeks, don't overload any single week
4. **Specific deliverables**: No vague descriptions - be concrete about what gets delivered
5. **Actionable user steps**: User should know exactly what to do after reading
6. **Match citation rates**: Use the citation_rate from selectedContentTypes
7. **Objective alignment**: All content should clearly serve the primary objective

Output ONLY the JSON blueprint, no other text.`

    const userPrompt = `Generate a complete GEO-VECTOR campaign blueprint for ${organizationName}.

**Campaign Goal:** ${campaignGoal}

**Primary Objective:** ${objective}

**Selected Content Types:**

AUTOMATED (SignalDesk generates, user deploys):
${selectedContentTypes.automated.map(ct => `- ${ct.label} (${ct.citation_rate}% citation)`).join('\n')}

USER-ASSISTED (SignalDesk provides content, user executes):
${selectedContentTypes.user_assisted.map(ct => `- ${ct.label} (${ct.citation_rate}% citation, ${ct.time_per_week}h/week)`).join('\n')}

**Constraints:**
- Time available: ${constraints?.time_per_week || 2} hours/week for user-assisted content
- Technical capability: ${constraints?.technical_capability || 'medium'}

**Organization Context:**
- Industry: ${industry}
- Goal: ${campaignGoal}

Generate a complete 12-week GEO-VECTOR blueprint that:
1. Prioritizes schemas first (if included)
2. Spreads content execution realistically over 12 weeks
3. Provides specific, actionable deliverables for each content type
4. Clearly separates what SignalDesk does vs what user does
5. Includes measurable success metrics
6. Creates a week-by-week execution roadmap

Output ONLY the JSON blueprint matching the structure above.`

    console.log('📤 Sending request to Claude...')
    console.log('Context size:', JSON.stringify(context).length, 'bytes')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    console.log('📥 Response received, length:', responseText.length)

    // Extract JSON from response (Claude sometimes adds markdown)
    let blueprintJson: any
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        blueprintJson = JSON.parse(jsonMatch[0])
      } else {
        blueprintJson = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError)
      console.error('Raw response:', responseText.substring(0, 500))
      throw new Error('Failed to parse blueprint JSON from Claude response')
    }

    // Validate blueprint structure
    if (!blueprintJson.type || blueprintJson.type !== 'geo_vector') {
      console.warn('Missing or incorrect blueprint type, adding...')
      blueprintJson.type = 'geo_vector'
    }

    if (!blueprintJson.strategicFoundation) {
      throw new Error('Invalid blueprint: missing strategicFoundation')
    }

    if (!blueprintJson.threeTierTacticalPlan) {
      throw new Error('Invalid blueprint: missing threeTierTacticalPlan')
    }

    console.log('✅ Blueprint generated:', {
      type: blueprintJson.type,
      automated_actions: blueprintJson.threeTierTacticalPlan?.automated?.length || 0,
      user_assisted_actions: blueprintJson.threeTierTacticalPlan?.userAssisted?.length || 0,
      weeks_planned: Object.keys(blueprintJson.executionRoadmap || {}).length
    })

    // Save to database if session_id provided
    if (session_id && organization_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { error: updateError } = await supabase
        .from('campaign_builder_sessions')
        .update({
          blueprint: blueprintJson,
          selected_objective: objective,
          selected_content_types: selectedContentTypes,
          current_stage: 'blueprint',
          updated_at: new Date().toISOString()
        })
        .eq('id', session_id)

      if (updateError) {
        console.error('Failed to save blueprint:', updateError)
        // Don't throw - we still have the blueprint
      } else {
        console.log('💾 Blueprint saved to database')
      }
    }

    return new Response(JSON.stringify({
      success: true,
      blueprint: blueprintJson,
      metadata: {
        automated_count: blueprintJson.threeTierTacticalPlan?.automated?.length || 0,
        user_assisted_count: blueprintJson.threeTierTacticalPlan?.userAssisted?.length || 0,
        expected_impact: blueprintJson.resourceRequirements?.expected_impact,
        timeline: '12 weeks'
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })

  } catch (error) {
    console.error('❌ GEO-VECTOR Blueprint error:', error)
    return new Response(JSON.stringify({
      error: error.message,
      details: error.toString()
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
})
