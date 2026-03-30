import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface BackfillRequest {
  table: 'content_library' | 'opportunities'
  batchSize?: number
  organizationId?: string
}

/**
 * Generate embedding using Voyage AI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  if (!VOYAGE_API_KEY) {
    throw new Error('VOYAGE_API_KEY not set')
  }

  const maxChars = 100000
  const truncatedText = text.length > maxChars ? text.substring(0, maxChars) : text

  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VOYAGE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'voyage-3-large',
      input: truncatedText,
      input_type: 'document'
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Voyage AI API error: ${error}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

/**
 * Backfill embeddings for content_library
 */
async function backfillContentLibrary(batchSize: number, organizationId?: string) {
  console.log('🔄 Starting content_library backfill...')

  let query = supabase
    .from('content_library')
    .select('id, title, content')
    .is('embedding', null)
    .limit(batchSize)

  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }

  const { data: items, error } = await query

  if (error) {
    throw new Error(`Failed to fetch content: ${error.message}`)
  }

  if (!items || items.length === 0) {
    console.log('✅ No content items need embeddings')
    return { processed: 0, message: 'All content items already have embeddings' }
  }

  console.log(`📋 Found ${items.length} items without embeddings`)

  let processed = 0
  let failed = 0

  for (const item of items) {
    try {
      // Generate text for embedding (title + first 500 chars of content)
      const textForEmbedding = `${item.title}\n${item.content?.substring(0, 500) || ''}`

      console.log(`🔨 Processing item ${item.id}: ${item.title}`)

      const embedding = await generateEmbedding(textForEmbedding)

      // Update the record
      const { error: updateError } = await supabase
        .from('content_library')
        .update({
          embedding,
          embedding_model: 'voyage-3-large',
          embedding_updated_at: new Date().toISOString()
        })
        .eq('id', item.id)

      if (updateError) {
        console.error(`❌ Failed to update ${item.id}:`, updateError)
        failed++
      } else {
        console.log(`✅ Updated ${item.id}`)
        processed++
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`❌ Error processing ${item.id}:`, error)
      failed++
    }
  }

  return {
    processed,
    failed,
    total: items.length,
    message: `Processed ${processed} items, ${failed} failed`
  }
}

/**
 * Backfill embeddings for opportunities
 */
async function backfillOpportunities(batchSize: number, organizationId?: string) {
  console.log('🔄 Starting opportunities backfill...')

  let query = supabase
    .from('opportunities')
    .select('id, title, description')
    .is('embedding', null)
    .limit(batchSize)

  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }

  const { data: items, error } = await query

  if (error) {
    throw new Error(`Failed to fetch opportunities: ${error.message}`)
  }

  if (!items || items.length === 0) {
    console.log('✅ No opportunities need embeddings')
    return { processed: 0, message: 'All opportunities already have embeddings' }
  }

  console.log(`📋 Found ${items.length} opportunities without embeddings`)

  let processed = 0
  let failed = 0

  for (const item of items) {
    try {
      // Generate text for embedding (title + description)
      const textForEmbedding = `${item.title}\n${item.description || ''}`

      console.log(`🔨 Processing opportunity ${item.id}: ${item.title}`)

      const embedding = await generateEmbedding(textForEmbedding)

      // Update the record
      const { error: updateError } = await supabase
        .from('opportunities')
        .update({
          embedding,
          embedding_model: 'voyage-3-large',
          embedding_updated_at: new Date().toISOString()
        })
        .eq('id', item.id)

      if (updateError) {
        console.error(`❌ Failed to update ${item.id}:`, updateError)
        failed++
      } else {
        console.log(`✅ Updated ${item.id}`)
        processed++
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`❌ Error processing ${item.id}:`, error)
      failed++
    }
  }

  return {
    processed,
    failed,
    total: items.length,
    message: `Processed ${processed} opportunities, ${failed} failed`
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { table, batchSize = 50, organizationId }: BackfillRequest = await req.json()

    if (!table || !['content_library', 'opportunities'].includes(table)) {
      return new Response(
        JSON.stringify({ error: 'table must be either "content_library" or "opportunities"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🚀 Starting backfill for ${table} (batch size: ${batchSize})`)

    let result
    if (table === 'content_library') {
      result = await backfillContentLibrary(batchSize, organizationId)
    } else {
      result = await backfillOpportunities(batchSize, organizationId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        table,
        ...result
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('❌ Backfill error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
