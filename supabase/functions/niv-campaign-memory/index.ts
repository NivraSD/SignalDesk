import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY')

// Helper: Generate embedding using Voyage AI
async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!VOYAGE_API_KEY) return null
  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VOYAGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'voyage-3-large',
        input: text.substring(0, 8000),
        input_type: 'document'
      })
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error('❌ Embedding error:', error)
    return null
  }
}

interface SaveBlueprintRequest {
  blueprintId: string
  blueprint: any
  campaignType: 'PR_CAMPAIGN' | 'VECTOR_CAMPAIGN'
  orgId: string
  sessionData: {
    campaignGoal: string
    researchFindings: any
    selectedPositioning: any
  }
  metadata?: {
    industry?: string
    stakeholderGroups?: string[]
    timelineWeeks?: number
    pattern?: string
  }
}

interface SearchCampaignsRequest {
  orgId: string
  query?: string
  campaignType?: 'PR_CAMPAIGN' | 'VECTOR_CAMPAIGN'
  industry?: string
  pattern?: string
  limit?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    if (action === 'save-blueprint') {
      const body = await req.json() as SaveBlueprintRequest

      // Save to campaign_blueprints table
      const { data: blueprintData, error: blueprintError } = await supabaseClient
        .from('campaign_blueprints')
        .insert({
          id: body.blueprintId,
          session_id: body.sessionData ? null : body.blueprintId, // Link to session if available
          org_id: body.orgId,
          campaign_type: body.campaignType,
          pattern_used: body.metadata?.pattern || body.blueprint.overview?.pattern,
          positioning: body.sessionData?.selectedPositioning?.name || 'N/A',
          blueprint_data: body.blueprint,
          research_data: body.sessionData?.researchFindings || {},
          goal_category: categorizeGoal(body.sessionData?.campaignGoal || ''),
          industry: body.metadata?.industry,
          stakeholder_groups: body.metadata?.stakeholderGroups || extractStakeholderGroups(body.blueprint, body.campaignType),
          timeline_weeks: body.metadata?.timelineWeeks || estimateTimelineWeeks(body.blueprint),
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (blueprintError) {
        console.error('Blueprint save error:', blueprintError)
        throw blueprintError
      }

      // Save to Memory Vault (content_library) for retrieval
      const memorySummary = generateBlueprintSummary(body.blueprint, body.campaignType)

      await saveToMemoryVault(supabaseClient, {
        organization_id: body.orgId,
        content_type: 'campaign_blueprint',
        title: body.blueprint.overview?.campaignName || `${body.campaignType} Blueprint`,
        content: JSON.stringify({
          blueprintId: body.blueprintId,
          campaignType: body.campaignType,
          summary: memorySummary,
          blueprint: body.blueprint
        }),
        metadata: {
          campaign_type: body.campaignType,
          pattern: body.metadata?.pattern || body.blueprint.overview?.pattern,
          positioning: body.sessionData?.selectedPositioning?.name,
          industry: body.metadata?.industry,
          stakeholder_groups: body.metadata?.stakeholderGroups,
          timeline_weeks: body.metadata?.timelineWeeks,
          goal_category: categorizeGoal(body.sessionData?.campaignGoal || ''),
          success_indicators: extractSuccessMetrics(body.blueprint, body.campaignType)
        },
        tags: [
          'campaign_blueprint',
          body.campaignType,
          body.metadata?.pattern || 'standard',
          body.metadata?.industry || 'general'
        ].filter(Boolean),
        status: 'template'
      })

      // Extract and save learnings
      await saveCampaignLearnings(supabaseClient, body.orgId, body.blueprint, body.campaignType)

      return new Response(
        JSON.stringify({
          success: true,
          blueprintId: body.blueprintId,
          message: 'Blueprint saved to Memory Vault'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (action === 'save-content') {
      const body = await req.json()

      // Already saved to campaign_content, now save to Memory Vault
      await saveToMemoryVault(supabaseClient, {
        organization_id: body.orgId,
        content_type: body.contentType || 'campaign_content',
        title: body.title || `Campaign Content - ${body.type}`,
        content: body.content,
        metadata: {
          blueprint_id: body.blueprintId,
          campaign_type: body.campaignType,
          target_stakeholder: body.targetStakeholder,
          phase: body.phase,
          generation_context: body.generationContext
        },
        tags: [
          'campaign_content',
          body.type,
          body.phase,
          body.targetStakeholder
        ].filter(Boolean),
        status: 'saved'
      })

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Content saved to Memory Vault'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (action === 'search-campaigns') {
      const body = await req.json() as SearchCampaignsRequest

      let query = supabaseClient
        .from('content_library')
        .select('*')
        .eq('organization_id', body.orgId)
        .eq('content_type', 'campaign_blueprint')

      if (body.campaignType) {
        query = query.eq('metadata->>campaign_type', body.campaignType)
      }

      if (body.industry) {
        query = query.eq('metadata->>industry', body.industry)
      }

      if (body.pattern) {
        query = query.eq('metadata->>pattern', body.pattern)
      }

      if (body.query) {
        query = query.or(`title.ilike.%${body.query}%,content.ilike.%${body.query}%`)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(body.limit || 20)

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          campaigns: data,
          count: data?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (action === 'find-similar') {
      const body = await req.json()

      // Find similar campaigns based on goal, industry, stakeholder types
      const { data, error } = await supabaseClient
        .from('content_library')
        .select('*')
        .eq('organization_id', body.orgId)
        .eq('content_type', 'campaign_blueprint')
        .eq('metadata->>industry', body.industry)
        .contains('metadata->stakeholder_groups', body.stakeholderGroups || [])
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          similarCampaigns: data,
          count: data?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (action === 'get-learnings') {
      const { data, error } = await supabaseClient
        .from('content_library')
        .select('*')
        .eq('content_type', 'campaign_learning')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          learnings: data,
          count: data?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Campaign Memory error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function saveToMemoryVault(supabase: any, content: any) {
  const { error } = await supabase
    .from('content_library')
    .insert({
      organization_id: content.organization_id,
      content_type: content.content_type,
      title: content.title,
      content: content.content,
      metadata: content.metadata || {},
      tags: content.tags || [],
      status: content.status || 'saved',
      created_by: 'campaign-builder',
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Memory Vault save error:', error)
    throw error
  }
}

async function saveCampaignLearnings(supabase: any, orgId: string, blueprint: any, campaignType: string) {
  const learnings: any[] = []

  if (campaignType === 'VECTOR_CAMPAIGN' && blueprint.part2_stakeholderMapping?.groups) {
    // Extract stakeholder insights
    for (const group of blueprint.part2_stakeholderMapping.groups) {
      const title = `Stakeholder Insight: ${group.name}`
      const contentData = JSON.stringify({
        insight: `${group.name} values ${group.psychologicalProfile?.values?.join(', ')} and is influenced by ${group.informationDiet?.trustedVoices?.join(', ')}`,
        evidence: [
          `Current perception: ${group.currentPerception}`,
          `Target perception: ${group.targetPerception}`,
          `Decision triggers: ${group.decisionTriggers?.join(', ')}`
        ],
        stakeholder_type: group.name,
        psychological_profile: group.psychologicalProfile
      })

      // Generate embedding
      const text = `${title}\n\n${contentData}`.substring(0, 8000)
      const embedding = await generateEmbedding(text)

      learnings.push({
        organization_id: orgId,
        content_type: 'campaign_learning',
        title,
        content: contentData,
        metadata: {
          stakeholder_type: group.name,
          values: group.psychologicalProfile?.values,
          decision_triggers: group.decisionTriggers
        },
        tags: ['learning', 'stakeholder_insight', group.name.toLowerCase().replace(/\s+/g, '_')],
        status: 'saved',
        created_by: 'pattern-learning',
        embedding,
        embedding_model: 'voyage-3-large',
        embedding_updated_at: embedding ? new Date().toISOString() : null
      })
    }
  }

  if (learnings.length > 0) {
    await supabase.from('content_library').insert(learnings)
  }
}

function generateBlueprintSummary(blueprint: any, campaignType: string): string {
  if (campaignType === 'PR_CAMPAIGN') {
    return `PR Campaign: ${blueprint.overview?.campaignName || 'Untitled'}. ${blueprint.overview?.objective || 'N/A'}. Timeline: ${blueprint.overview?.duration || 'N/A'}. Targets ${blueprint.mediaTargeting?.tier1Outlets?.length || 0} tier-1 outlets.`
  } else {
    const stakeholderCount = blueprint.part2_stakeholderMapping?.groups?.length || 0
    const pattern = blueprint.overview?.pattern || 'STANDARD'
    return `VECTOR Campaign: ${blueprint.overview?.campaignName || 'Untitled'}. Pattern: ${pattern}. ${stakeholderCount} stakeholder groups across 4 sequential phases. ${blueprint.overview?.objective || 'N/A'}`
  }
}

function extractStakeholderGroups(blueprint: any, campaignType: string): string[] {
  if (campaignType === 'VECTOR_CAMPAIGN' && blueprint.part2_stakeholderMapping?.groups) {
    return blueprint.part2_stakeholderMapping.groups.map((g: any) => g.name)
  }
  return []
}

function extractSuccessMetrics(blueprint: any, campaignType: string): string[] {
  if (campaignType === 'PR_CAMPAIGN' && blueprint.successMetrics) {
    return Object.keys(blueprint.successMetrics)
  } else if (campaignType === 'VECTOR_CAMPAIGN' && blueprint.part1_goalFramework?.kpis) {
    return blueprint.part1_goalFramework.kpis
  }
  return []
}

function estimateTimelineWeeks(blueprint: any): number {
  const duration = blueprint.overview?.duration || ''
  const weekMatch = duration.match(/(\d+)/)
  return weekMatch ? parseInt(weekMatch[1]) : 8
}

function categorizeGoal(goal: string): string {
  const lower = goal.toLowerCase()
  if (lower.includes('launch') || lower.includes('announce')) return 'launch'
  if (lower.includes('crisis') || lower.includes('respond')) return 'crisis'
  if (lower.includes('awareness') || lower.includes('visibility')) return 'awareness'
  if (lower.includes('reputation') || lower.includes('trust')) return 'reputation'
  if (lower.includes('thought leadership')) return 'thought_leadership'
  return 'general'
}
