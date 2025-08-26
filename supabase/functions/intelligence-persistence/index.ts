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
    // First, get or create the organization
    let orgId = organization_id;
    if (!orgId && organization_name) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', organization_name)
        .single()
      
      if (org) {
        orgId = org.id
      } else {
        // Create organization if it doesn't exist
        const { data: newOrg, error: createError } = await supabase
          .from('organizations')
          .insert({ name: organization_name })
          .select()
          .single()
        
        if (newOrg) {
          orgId = newOrg.id
        }
      }
    }

    // Save to intelligence_findings table
    const { data: finding, error } = await supabase
      .from('intelligence_findings')
      .insert({
        organization_id: orgId,
        title: content?.title || `${stage} data`,
        content: JSON.stringify(content),
        source: metadata?.source || stage,
        source_url: content?.url || metadata?.url || '#',
        relevance_score: metadata?.confidence ? Math.round(metadata.confidence * 100) : 75,
        sentiment: metadata?.sentiment || 'neutral',
        tags: [stage, data_type].filter(Boolean),
        metadata: { ...metadata, stage, data_type },
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving to intelligence_findings:', error)
      
      // Fallback: Save to a simpler key-value store
      const { data: fallback, error: fallbackError } = await supabase
        .from('stage_data')
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

// Create a simple storage table for organization profiles
async function ensureProfileTable() {
  // This table will be created if it doesn't exist
  const { error } = await supabase.rpc('create_profile_table_if_not_exists', {})
    .catch(() => ({ error: 'Table creation skipped' }))
  return !error
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
    // Use a simple JSON storage approach
    const profileData = {
      name: organization_name,
      industry: industry || 'technology',
      competitors: competitors || [],
      stakeholders: {
        regulators: regulators || [],
        media: media || [],
        investors: investors || [],
        analysts: analysts || [],
        activists: activists || []
      },
      keywords: keywords || [],
      metadata: metadata || {},
      updated_at: new Date().toISOString()
    }

    // First try to save to organizations table (which definitely exists)
    console.log(`Saving profile for ${organization_name} with ${competitors?.length || 0} competitors`)
    
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .upsert({
        name: organization_name,
        description: metadata?.description || '',
        settings: profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orgError && orgError.code !== '23505') { // 23505 is unique violation
      console.error('Error saving to organizations:', orgError)
      
      // If insert failed, try update
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          settings: profileData,
          updated_at: new Date().toISOString()
        })
        .eq('name', organization_name)
      
      if (updateError) {
        console.error('Update also failed:', updateError)
      } else {
        console.log('Successfully updated existing organization')
      }
    } else if (orgData) {
      console.log('Successfully saved organization profile')
    }

    // Also try to save to organization_profiles if it exists
    try {
      await supabase
        .from('organization_profiles')
        .upsert({
          organization_name: organization_name,
          profile_data: profileData,
          updated_at: new Date().toISOString()
        })
      console.log('Also saved to organization_profiles table')
    } catch (e) {
      // Table might not exist, that's ok
      console.log('organization_profiles table not available')
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

      case 'getProfile':
        // Get saved organization profile
        console.log('Getting profile for:', params.organization_name)
        
        // Try organizations table with settings FIRST (since we know it exists)
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('name', params.organization_name)
          .single()

        console.log('Organizations query result:', { 
          found: !!orgData, 
          hasSettings: !!orgData?.settings,
          error: orgError?.message 
        })

        if (orgData?.settings) {
          const profile = orgData.settings
          console.log(`Found profile with ${profile.competitors?.length || 0} competitors`)
          return jsonResponse({
            success: true,
            profile: profile,
            source: 'organizations'
          })
        }

        // Try organization_profiles as fallback
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('organization_profiles')
            .select('*')
            .eq('organization_name', params.organization_name)
            .single()

          if (profileData?.profile_data) {
            console.log('Found profile in organization_profiles')
            return jsonResponse({
              success: true,
              profile: profileData.profile_data,
              source: 'organization_profiles'
            })
          }
        } catch (e) {
          console.log('organization_profiles table not available')
        }

        // If nothing found, return empty profile structure
        console.log('No saved profile found, returning empty structure')
        return jsonResponse({
          success: true,
          profile: {
            name: params.organization_name,
            competitors: [],
            regulators: [],
            media: [],
            investors: [],
            analysts: [],
            activists: [],
            keywords: []
          },
          message: 'No saved profile found - using empty structure'
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