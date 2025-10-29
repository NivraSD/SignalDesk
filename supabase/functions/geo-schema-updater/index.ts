import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * GEO SCHEMA UPDATER
 *
 * Applies schema recommendations to actual schemas in Memory Vault
 * Implements the schema changes specified in GEO recommendations
 *
 * Flow:
 * 1. Fetch current schema from content_library
 * 2. Apply changes from recommendation
 * 3. Validate the updated schema
 * 4. Save updated schema back to content_library
 * 5. Mark recommendation as executed
 * 6. Track before/after for metrics
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { organization_id, recommendation } = await req.json()

    if (!organization_id || !recommendation) {
      throw new Error('organization_id and recommendation required')
    }

    console.log('⚡ Applying schema recommendation:', {
      title: recommendation.title,
      schema_type: recommendation.schema_type,
      changes: recommendation.changes
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // STEP 1: Fetch current schema from content_library
    const { data: schemaData, error: fetchError } = await supabase
      .from('content_library')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('content_type', 'schema')
      .eq('folder', 'Schemas/Active/')
      .eq('metadata->>schema_type', recommendation.schema_type || 'Organization')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError) {
      console.error('Schema not found:', fetchError)
      throw new Error(`Schema not found for type: ${recommendation.schema_type || 'Organization'}`)
    }

    console.log('📄 Current schema loaded:', schemaData.id)

    // STEP 2: Apply changes to schema
    // Parse the schema content if it's a string
    const currentSchema = typeof schemaData.content === 'string'
      ? JSON.parse(schemaData.content)
      : schemaData.content
    const changes = recommendation.changes || {}
    const beforeSchema = JSON.parse(JSON.stringify(currentSchema)) // Deep clone

    console.log('🔧 Applying change:', changes)

    // Apply the change based on action
    const updatedSchema = applySchemaChange(currentSchema, changes)

    // STEP 3: Validate the updated schema
    if (!updatedSchema['@context'] || !updatedSchema['@type']) {
      throw new Error('Invalid schema: missing @context or @type')
    }

    console.log('✅ Schema validated')

    // STEP 4: Save updated schema back to content_library
    const { error: updateError } = await supabase
      .from('content_library')
      .update({
        content: JSON.stringify(updatedSchema), // Stringify to match database format
        metadata: {
          ...schemaData.metadata,
          last_updated: new Date().toISOString(),
          version: (schemaData.metadata?.version || 0) + 1,
          last_recommendation: recommendation.title
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', schemaData.id)

    if (updateError) {
      console.error('Failed to update schema:', updateError)
      throw updateError
    }

    console.log('💾 Schema updated successfully')

    // STEP 5: Mark recommendation as executed
    // Try to find and update the recommendation in the database
    const { data: existingRec } = await supabase
      .from('schema_recommendations')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('title', recommendation.title)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingRec) {
      await supabase
        .from('schema_recommendations')
        .update({
          status: 'executed',
          executed_at: new Date().toISOString(),
          execution_result: {
            executed_via: 'ui',
            timestamp: new Date().toISOString(),
            schema_id: schemaData.id,
            change_applied: changes,
            before_value: beforeSchema[changes.field],
            after_value: updatedSchema[changes.field]
          }
        })
        .eq('id', existingRec.id)

      console.log('✅ Recommendation marked as executed')
    } else {
      // Insert new recommendation record
      await supabase
        .from('schema_recommendations')
        .insert({
          organization_id,
          schema_type: recommendation.schema_type || 'Organization',
          recommendation_type: recommendation.type || 'optimize_existing',
          priority: recommendation.priority || 'medium',
          source_platform: recommendation.platform || 'all',
          title: recommendation.title,
          description: recommendation.description || '',
          reasoning: recommendation.reasoning || '',
          expected_impact: recommendation.expected_impact || '',
          changes: recommendation.changes || {},
          auto_executable: recommendation.auto_executable || false,
          status: 'executed',
          executed_at: new Date().toISOString(),
          execution_result: {
            executed_via: 'ui',
            timestamp: new Date().toISOString(),
            schema_id: schemaData.id,
            change_applied: changes,
            before_value: beforeSchema[changes.field],
            after_value: updatedSchema[changes.field]
          }
        })

      console.log('✅ Recommendation created and marked as executed')
    }

    return new Response(
      JSON.stringify({
        success: true,
        schema_id: schemaData.id,
        schema_type: updatedSchema['@type'],
        change_applied: {
          field: changes.field,
          action: changes.action,
          before: beforeSchema[changes.field],
          after: updatedSchema[changes.field]
        },
        message: 'Schema recommendation applied successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Schema Update Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Apply a single schema change based on the action type
 */
function applySchemaChange(schema: any, change: any): any {
  const { field, action, value } = change

  if (!field || !action) {
    console.warn('Invalid change object:', change)
    return schema
  }

  const updatedSchema = { ...schema }

  switch (action) {
    case 'add':
    case 'update':
      // Add or update a field
      updatedSchema[field] = value
      console.log(`  ✓ ${action} field "${field}" = ${JSON.stringify(value).substring(0, 50)}`)
      break

    case 'append':
      // Append to array field
      if (Array.isArray(updatedSchema[field])) {
        updatedSchema[field] = [...updatedSchema[field], value]
      } else {
        updatedSchema[field] = [value]
      }
      console.log(`  ✓ Appended to "${field}"`)
      break

    case 'remove':
      // Remove a field
      delete updatedSchema[field]
      console.log(`  ✓ Removed field "${field}"`)
      break

    default:
      console.warn(`Unknown action: ${action}`)
  }

  return updatedSchema
}
