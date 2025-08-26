// Intelligence Persistence Layer - Save and retrieve data between pipeline stages
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { withCors, jsonResponse, errorResponse } from "../_shared/cors.ts"

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function saveIntelligenceData(data: any) {
  const { 
    organization_id, 
    organization_name,
    stage,
    data_type,
    content,
    metadata 
  } = data

  try {
    // Save to intelligence_findings table
    const { data: finding, error } = await supabase
      .from('intelligence_findings')
      .insert({
        actual_organization_id: organization_id || organization_name,
        organization_id: organization_id || organization_name,
        entity: metadata?.entity || stage,
        type: data_type || stage,
        title: content?.title || `${stage} data`,
        description: content?.description || JSON.stringify(content).substring(0, 500),
        source: metadata?.source || stage,
        url: content?.url || metadata?.url || '#',
        severity: metadata?.severity || 'medium',
        confidence_score: metadata?.confidence || 0.75,
        raw_data: content,
        metadata: metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving to intelligence_findings:', error)
      
      // Fallback: Save to a generic storage table if available
      const { data: fallback, error: fallbackError } = await supabase
        .from('organization_intelligence')
        .upsert({
          organization_name: organization_name,
          organization_id: organization_id,
          intelligence_history: supabase.sql`
            COALESCE(intelligence_history, '[]'::jsonb) || 
            ${JSON.stringify([{
              stage,
              data_type,
              content,
              metadata,
              timestamp: new Date().toISOString()
            }])}::jsonb
          `,
          last_scan: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'organization_name'
        })
        .select()
        .single()

      if (fallbackError) {
        console.error('Fallback save also failed:', fallbackError)
        throw fallbackError
      }

      return { success: true, id: fallback?.id, method: 'fallback' }
    }

    return { success: true, id: finding?.id, method: 'primary' }
  } catch (error) {
    console.error('Save failed:', error)
    throw error
  }
}

async function retrieveIntelligenceData(query: any) {
  const { 
    organization_id,
    organization_name,
    stage,
    data_type,
    limit = 50,
    since 
  } = query

  try {
    // Build query
    let dbQuery = supabase
      .from('intelligence_findings')
      .select('*')

    // Add filters
    if (organization_id || organization_name) {
      dbQuery = dbQuery.eq('actual_organization_id', organization_id || organization_name)
    }
    if (stage) {
      dbQuery = dbQuery.eq('entity', stage)
    }
    if (data_type) {
      dbQuery = dbQuery.eq('type', data_type)
    }
    if (since) {
      dbQuery = dbQuery.gte('created_at', since)
    }

    // Order and limit
    dbQuery = dbQuery
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data: findings, error } = await dbQuery

    if (error) {
      console.error('Error retrieving from intelligence_findings:', error)
      
      // Fallback: Try to get from organization_intelligence
      const { data: fallback, error: fallbackError } = await supabase
        .from('organization_intelligence')
        .select('intelligence_history')
        .eq('organization_name', organization_name || organization_id)
        .single()

      if (!fallbackError && fallback?.intelligence_history) {
        // Filter and format the history data
        const history = fallback.intelligence_history || []
        const filtered = history.filter((item: any) => {
          if (stage && item.stage !== stage) return false
          if (data_type && item.data_type !== data_type) return false
          if (since && new Date(item.timestamp) < new Date(since)) return false
          return true
        }).slice(0, limit)

        return { 
          success: true, 
          data: filtered,
          count: filtered.length,
          method: 'fallback'
        }
      }

      throw error
    }

    return { 
      success: true, 
      data: findings || [],
      count: findings?.length || 0,
      method: 'primary'
    }
  } catch (error) {
    console.error('Retrieve failed:', error)
    throw error
  }
}

async function saveOrganizationProfile(profile: any) {
  const {
    organization_name,
    industry,
    competitors,
    regulators,
    media,
    investors,
    analysts,
    activists,
    keywords,
    metadata
  } = profile

  try {
    // Save organization profile
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .upsert({
        name: organization_name,
        industry: industry || 'technology',
        description: metadata?.description || '',
        url: metadata?.url || '',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'name'
      })
      .select()
      .single()

    if (orgError) {
      console.error('Error saving organization:', orgError)
    }

    // Save competitors as intelligence targets
    if (competitors && competitors.length > 0) {
      for (const competitor of competitors) {
        const competitorName = competitor.name || competitor
        await supabase
          .from('intelligence_targets')
          .upsert({
            organization_id: organization_name,
            name: competitorName,
            type: 'competitor',
            priority: 'high',
            keywords: [competitorName.toLowerCase()],
            metadata: typeof competitor === 'object' ? competitor : {},
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'organization_id,name,type'
          })
      }
    }

    // Save other stakeholders as intelligence targets
    const stakeholderTypes = {
      regulators: 'regulator',
      media: 'media',
      investors: 'investor',
      analysts: 'analyst',
      activists: 'activist'
    }

    for (const [key, type] of Object.entries(stakeholderTypes)) {
      const stakeholders = profile[key]
      if (stakeholders && stakeholders.length > 0) {
        for (const stakeholder of stakeholders) {
          const name = stakeholder.name || stakeholder
          await supabase
            .from('intelligence_targets')
            .upsert({
              organization_id: organization_name,
              name: name,
              type: type,
              priority: 'medium',
              keywords: [name.toLowerCase()],
              metadata: typeof stakeholder === 'object' ? stakeholder : {},
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'organization_id,name,type'
            })
        }
      }
    }

    // Save to organization_intelligence for comprehensive tracking
    const { error: intelError } = await supabase
      .from('organization_intelligence')
      .upsert({
        organization_name: organization_name,
        organization_id: organization_name,
        industry: industry || 'technology',
        competitors: competitors || [],
        keywords: keywords || [],
        monitoring_config: {
          stakeholders: {
            regulators,
            media,
            investors,
            analysts,
            activists
          }
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_name'
      })

    if (intelError) {
      console.error('Error saving to organization_intelligence:', intelError)
    }

    return { success: true, organization: organization_name }
  } catch (error) {
    console.error('Save organization profile failed:', error)
    throw error
  }
}

serve(withCors(async (req) => {
  try {
    const { action, ...params } = await req.json()

    console.log(`📊 Intelligence Persistence - Action: ${action}`)
    console.log(`📊 Parameters:`, JSON.stringify(params).substring(0, 200))

    switch (action) {
      case 'save':
        const saveResult = await saveIntelligenceData(params)
        return jsonResponse({
          success: true,
          ...saveResult
        })

      case 'retrieve':
        const retrieveResult = await retrieveIntelligenceData(params)
        return jsonResponse({
          success: true,
          ...retrieveResult
        })

      case 'saveProfile':
        const profileResult = await saveOrganizationProfile(params)
        return jsonResponse({
          success: true,
          ...profileResult
        })

      case 'getTargets':
        // Get all intelligence targets for an organization
        const { data: targets, error } = await supabase
          .from('intelligence_targets')
          .select('*')
          .eq('organization_id', params.organization_id || params.organization_name)
          .eq('active', true)

        if (error) throw error

        // Group by type
        const grouped = targets?.reduce((acc: any, target: any) => {
          const type = target.type + 's'
          if (!acc[type]) acc[type] = []
          acc[type].push(target)
          return acc
        }, {}) || {}

        return jsonResponse({
          success: true,
          targets: grouped,
          count: targets?.length || 0
        })

      default:
        return errorResponse(`Unknown action: ${action}`, 400)
    }
  } catch (error) {
    console.error('Persistence error:', error)
    return errorResponse(
      error.message || 'Persistence operation failed',
      500,
      { error }
    )
  }
}))