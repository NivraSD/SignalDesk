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
      type: recommendation.type,
      changes: recommendation.changes
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Determine target schema type
    // If type is "update_field" or "add_field", always target the Organization schema
    // If type is "create_new", create the specified schema_type
    const targetSchemaType = (recommendation.type === 'update_field' || recommendation.type === 'add_field')
      ? 'Organization'
      : (recommendation.schema_type || 'Organization')

    console.log('🎯 Target schema type:', targetSchemaType, '(recommendation type:', recommendation.type, ')')

    // STEP 1: Try to fetch current schema from content_library
    const { data: schemaData, error: fetchError } = await supabase
      .from('content_library')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('content_type', 'schema')
      .eq('folder', 'Schemas/Active/')
      .eq('metadata->>schema_type', targetSchemaType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let updatedSchema: any
    let beforeSchema: any
    let schemaId: string
    let isNewSchema = false

    if (!schemaData || fetchError) {
      // Schema doesn't exist - CREATE NEW
      console.log(`📝 Schema not found for type "${targetSchemaType}", creating new schema...`)
      isNewSchema = true

      // Get organization details for schema
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name, metadata')
        .eq('id', organization_id)
        .single()

      // Create base schema structure based on type
      let baseSchema: any

      if (targetSchemaType === 'FAQPage') {
        // For FAQPage, the changes.value should contain the full FAQ structure
        const changes = recommendation.changes || {}
        if (typeof changes.value === 'string') {
          try {
            // If value is a JSON string, parse it
            baseSchema = JSON.parse(changes.value)
          } catch {
            // If parsing fails, create a minimal FAQPage
            baseSchema = {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              'mainEntity': []
            }
          }
        } else {
          // If value is already an object, use it
          baseSchema = changes.value || {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': []
          }
        }
        updatedSchema = baseSchema // Don't apply changes again, the value IS the schema
      } else {
        // For Organization and other types, create base and apply field changes
        baseSchema = {
          '@context': 'https://schema.org',
          '@type': targetSchemaType,
          'name': orgData?.name || 'Organization',
        }

        const changes = recommendation.changes || {}
        // Apply changes to base schema
        updatedSchema = applySchemaChange(baseSchema, changes)
      }

      beforeSchema = null
      console.log('🔧 Created new schema:', { type: targetSchemaType, isFullSchema: targetSchemaType === 'FAQPage' })
    } else {
      // Schema exists - UPDATE EXISTING
      console.log('📄 Current schema loaded:', schemaData.id)
      schemaId = schemaData.id

      // STEP 2: Apply changes to schema
      // Parse the schema content if it's a string
      const currentSchema = typeof schemaData.content === 'string'
        ? JSON.parse(schemaData.content)
        : schemaData.content
      const changes = recommendation.changes || {}
      beforeSchema = JSON.parse(JSON.stringify(currentSchema)) // Deep clone

      console.log('🔧 Applying change:', changes)

      // Apply the change based on action
      updatedSchema = applySchemaChange(currentSchema, changes)
    }

    // STEP 3: Validate the updated schema
    if (!updatedSchema['@context'] || !updatedSchema['@type']) {
      throw new Error('Invalid schema: missing @context or @type')
    }

    console.log('✅ Schema validated')

    // STEP 4: Save schema to content_library
    if (isNewSchema) {
      // Insert new schema
      const { data: newSchema, error: insertError } = await supabase
        .from('content_library')
        .insert({
          organization_id,
          content_type: 'schema',
          title: `${targetSchemaType} Schema`,
          content: JSON.stringify(updatedSchema),
          folder: 'Schemas/Active/',
          status: 'published',
          metadata: {
            version: 1,
            schema_type: targetSchemaType,
            last_updated: new Date().toISOString(),
            last_recommendation: recommendation.title,
            platform_optimized: 'all',
            original_recommendation_type: recommendation.type
          }
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Failed to create schema:', insertError)
        throw insertError
      }

      schemaId = newSchema.id
      console.log('💾 New schema created successfully:', schemaId)
    } else {
      // Update existing schema
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
    }

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
            schema_id: schemaId,
            change_applied: recommendation.changes,
            before_value: beforeSchema?.[recommendation.changes?.field],
            after_value: updatedSchema[recommendation.changes?.field]
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
            schema_id: schemaId,
            change_applied: recommendation.changes,
            before_value: beforeSchema?.[recommendation.changes?.field],
            after_value: updatedSchema[recommendation.changes?.field]
          }
        })

      console.log('✅ Recommendation created and marked as executed')
    }

    return new Response(
      JSON.stringify({
        success: true,
        schema_id: schemaId,
        schema_type: updatedSchema['@type'],
        is_new_schema: isNewSchema,
        change_applied: {
          field: recommendation.changes?.field,
          action: recommendation.changes?.action,
          before: beforeSchema?.[recommendation.changes?.field],
          after: updatedSchema[recommendation.changes?.field]
        },
        message: isNewSchema ? 'Schema created successfully' : 'Schema recommendation applied successfully'
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
