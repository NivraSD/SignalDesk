// Campaign Execution Orchestrator - Multi-Vector Content Generation
// Handles both total-spectrum campaigns (CASCADE, MIRROR, etc.) and traditional campaigns

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Initialize Supabase client for database operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface ExecutionRequest {
  source: 'campaign' | 'opportunity' | 'framework'
  sourceId: string
  executionPlan: {
    type: 'multi_vector' | 'traditional'
    pattern?: string  // CASCADE, MIRROR, etc.
    vectors?: Array<{
      stakeholder_group: string
      message: string
      channel: string
      timing: string
      content_types: string[]
      concealment?: string
    }>
    contentTypes?: string[]  // For traditional execution
  }
  organizationId: string
  organizationContext?: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: ExecutionRequest = await req.json()
    console.log(`🚀 Campaign Execution Orchestrator: ${request.executionPlan.type} execution`)

    let results

    if (request.executionPlan.type === 'multi_vector') {
      results = await executeMultiVectorCampaign(request)
    } else {
      results = await executeTraditionalCampaign(request)
    }

    return new Response(
      JSON.stringify({
        success: true,
        execution: results,
        message: `${results.vectors_executed || results.content_generated} pieces generated successfully`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Execution orchestrator error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function executeMultiVectorCampaign(request: ExecutionRequest) {
  console.log(`🎯 Executing multi-vector ${request.executionPlan.pattern} campaign with PARALLEL orchestration`)

  const { vectors } = request.executionPlan

  if (!vectors || vectors.length === 0) {
    throw new Error('No vectors defined for multi-vector execution')
  }

  // Build array of all content generation tasks across all vectors
  const generationTasks: Array<{
    vector: string
    contentType: string
    promise: Promise<any>
  }> = []

  vectors.forEach(vector => {
    console.log(`📍 Queuing ${vector.stakeholder_group} vector with ${vector.content_types.length} content types`)

    vector.content_types.forEach(contentType => {
      generationTasks.push({
        vector: vector.stakeholder_group,
        contentType: contentType,
        promise: fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({
            message: vector.message,
            organizationContext: {
              conversationId: `vector-${vector.stakeholder_group}-${contentType}-${Date.now()}`,
              organizationId: request.organizationId
            },
            requestedContentType: contentType,
            autoExecute: true,
            saveFolder: `Campaigns/${request.executionPlan.pattern}/${vector.stakeholder_group}`,

            // Pass vector context for concealment
            campaignContext: {
              vector: vector.stakeholder_group,
              pattern: request.executionPlan.pattern,
              timing: vector.timing,
              channel: vector.channel,
              concealment: vector.concealment || 'unconnected_seed'
            }
          })
        }).then(r => r.json()).catch(err => ({ error: err.message }))
      })
    })
  })

  console.log(`🚀 Executing ${generationTasks.length} content pieces in PARALLEL`)

  // Execute all content generation in parallel using Promise.allSettled
  const taskResults = await Promise.allSettled(generationTasks.map(task => task.promise))

  // Process results and save to Memory Vault
  const results: any[] = []
  const failures: any[] = []
  const savedItems: any[] = []

  for (let idx = 0; idx < taskResults.length; idx++) {
    const result = taskResults[idx]
    const task = generationTasks[idx]
    const vector = vectors.find(v => v.stakeholder_group === task.vector)

    if (result.status === 'fulfilled' && !result.value.error) {
      const contentData = result.value

      results.push({
        vector: task.vector,
        content_type: task.contentType,
        content: contentData,
        scheduled_for: vector?.timing,
        concealment: vector?.concealment
      })

      // Save to Memory Vault (content_library)
      try {
        const { data: savedContent, error: saveError } = await supabase
          .from('content_library')
          .insert({
            organization_id: request.organizationId,
            content_type: task.contentType,
            title: `${request.executionPlan.pattern} Campaign - ${task.vector} - ${task.contentType}`,
            content: contentData.content || contentData,
            folder: `Campaigns/${request.executionPlan.pattern}/${task.vector}`,
            metadata: {
              campaign: request.executionPlan.pattern,
              vector: task.vector,
              timing: vector?.timing,
              concealment: vector?.concealment,
              autoGenerated: true,
              source: 'campaign-execution-orchestrator'
            },
            status: 'approved'
          })
          .select()
          .single()

        if (saveError) {
          console.error(`⚠️ Failed to save ${task.contentType} for ${task.vector}:`, saveError.message)
        } else {
          savedItems.push(savedContent)
          console.log(`✅ Generated and saved ${task.contentType} for ${task.vector} to Memory Vault`)
        }
      } catch (saveErr) {
        console.error(`⚠️ Database save error for ${task.contentType}:`, saveErr)
      }
    } else {
      const errorMessage = result.status === 'rejected' ? result.reason : result.value.error
      failures.push({
        vector: task.vector,
        content_type: task.contentType,
        error: errorMessage
      })
      console.error(`❌ Failed ${task.contentType} for ${task.vector}:`, errorMessage)
    }
  }

  // Calculate convergence date (4-6 weeks from first seed)
  const convergenceDate = new Date()
  convergenceDate.setDate(convergenceDate.getDate() + 42) // 6 weeks

  console.log(`✅ Parallel execution complete: ${results.length} successful, ${failures.length} failed, ${savedItems.length} saved to Memory Vault`)

  return {
    type: 'multi_vector',
    pattern: request.executionPlan.pattern,
    vectors_executed: vectors.length,
    content_pieces: results.length,
    saved_to_vault: savedItems.length,
    results: results,
    failures: failures.length > 0 ? failures : undefined,
    convergence_date: convergenceDate.toISOString(),
    message: `${results.length} pieces across ${vectors.length} vectors generated in parallel. ${savedItems.length} saved to Memory Vault. Seeds planted for ${request.executionPlan.pattern} campaign.`
  }
}

async function executeTraditionalCampaign(request: ExecutionRequest) {
  console.log(`📝 Executing traditional campaign with PARALLEL orchestration`)

  const contentTypes = request.executionPlan.contentTypes || ['press-release', 'social-post']

  // Build array of all content generation promises
  const generationPromises = contentTypes.map(contentType =>
    fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        message: `Generate ${contentType} for campaign`,
        organizationContext: {
          conversationId: `traditional-${contentType}-${Date.now()}`,
          organizationId: request.organizationId
        },
        requestedContentType: contentType,
        autoExecute: true,
        saveFolder: `Campaigns/Traditional`
      })
    }).then(r => r.json()).catch(err => ({ error: err.message }))
  )

  console.log(`🚀 Executing ${contentTypes.length} content pieces in PARALLEL`)

  // Execute all content generation in parallel
  const taskResults = await Promise.allSettled(generationPromises)

  // Process results and save to Memory Vault
  const results: any[] = []
  const failures: any[] = []
  const savedItems: any[] = []

  for (let idx = 0; idx < taskResults.length; idx++) {
    const result = taskResults[idx]
    const contentType = contentTypes[idx]

    if (result.status === 'fulfilled' && !result.value.error) {
      const contentData = result.value

      results.push({
        content_type: contentType,
        content: contentData
      })

      // Save to Memory Vault (content_library)
      try {
        const { data: savedContent, error: saveError } = await supabase
          .from('content_library')
          .insert({
            organization_id: request.organizationId,
            content_type: contentType,
            title: `Traditional Campaign - ${contentType}`,
            content: contentData.content || contentData,
            folder: `Campaigns/Traditional`,
            metadata: {
              campaign: 'traditional',
              autoGenerated: true,
              source: 'campaign-execution-orchestrator'
            },
            status: 'approved'
          })
          .select()
          .single()

        if (saveError) {
          console.error(`⚠️ Failed to save ${contentType}:`, saveError.message)
        } else {
          savedItems.push(savedContent)
          console.log(`✅ Generated and saved ${contentType} to Memory Vault`)
        }
      } catch (saveErr) {
        console.error(`⚠️ Database save error for ${contentType}:`, saveErr)
      }
    } else {
      const errorMessage = result.status === 'rejected' ? result.reason : result.value.error
      failures.push({
        content_type: contentType,
        error: errorMessage
      })
      console.error(`❌ Failed ${contentType}:`, errorMessage)
    }
  }

  console.log(`✅ Parallel execution complete: ${results.length} successful, ${failures.length} failed, ${savedItems.length} saved to Memory Vault`)

  return {
    type: 'traditional',
    content_generated: results.length,
    saved_to_vault: savedItems.length,
    results: results,
    failures: failures.length > 0 ? failures : undefined,
    message: `${results.length} traditional content pieces generated in parallel. ${savedItems.length} saved to Memory Vault.`
  }
}
