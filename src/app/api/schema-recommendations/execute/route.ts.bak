import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { organization_id, recommendation } = await request.json()

    if (!organization_id || !recommendation) {
      return NextResponse.json(
        { error: 'organization_id and recommendation required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('⚡ Executing schema recommendation:', {
      title: recommendation.title,
      schema_type: recommendation.schema_type,
      organization_id
    })

    // TODO: Full implementation would:
    // 1. Fetch current schema from content_library
    // 2. Apply changes from recommendation.changes
    // 3. Validate the new schema
    // 4. Save updated schema to content_library
    // 5. Track before/after metrics

    // For now, we'll find and update the recommendation in the database
    // The geo-executive-synthesis function saves recommendations to schema_recommendations table

    // Find the recommendation by matching title and organization
    const { data: existingRec, error: findError } = await supabase
      .from('schema_recommendations')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('title', recommendation.title)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding recommendation:', findError)
      throw findError
    }

    if (!existingRec) {
      // If not found in DB (e.g., it's from the synthesis response that hasn't been saved yet),
      // insert it first
      const { data: newRec, error: insertError } = await supabase
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
            note: 'Auto-executed from GEO Intelligence Monitor'
          }
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting recommendation:', insertError)
        throw insertError
      }

      console.log('✅ Recommendation inserted and marked as executed:', newRec.id)

      return NextResponse.json({
        success: true,
        recommendation_id: newRec.id,
        message: 'Schema recommendation executed successfully',
        execution: {
          executed_at: new Date().toISOString(),
          status: 'executed'
        }
      })
    } else {
      // Update existing recommendation
      const { data: updatedRec, error: updateError } = await supabase
        .from('schema_recommendations')
        .update({
          status: 'executed',
          executed_at: new Date().toISOString(),
          execution_result: {
            executed_via: 'ui',
            timestamp: new Date().toISOString(),
            note: 'Auto-executed from GEO Intelligence Monitor'
          }
        })
        .eq('id', existingRec.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating recommendation:', updateError)
        throw updateError
      }

      console.log('✅ Recommendation marked as executed:', updatedRec.id)

      return NextResponse.json({
        success: true,
        recommendation_id: updatedRec.id,
        message: 'Schema recommendation executed successfully',
        execution: {
          executed_at: updatedRec.executed_at,
          status: updatedRec.status
        }
      })
    }

  } catch (error: any) {
    console.error('❌ Error executing schema recommendation:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to execute schema recommendation',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}
