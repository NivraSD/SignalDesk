import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface EmbeddingRequest {
  text: string
  model?: string
}

interface EmbeddingResponse {
  embedding: number[]
  model: string
  usage: {
    total_tokens: number
  }
}

/**
 * Generate embeddings using Voyage AI voyage-3-large model
 *
 * This function generates 1024-dimension vector embeddings for semantic search.
 * Used by Memory Vault to enable meaning-based search instead of keyword matching.
 *
 * Voyage-3-large is optimized for:
 * - High quality semantic understanding
 * - Long context (up to 32k tokens)
 * - Fast inference
 */
async function generateEmbedding(text: string, model: string = 'voyage-3-large'): Promise<EmbeddingResponse> {
  if (!VOYAGE_API_KEY) {
    throw new Error('VOYAGE_API_KEY environment variable is not set')
  }

  // Truncate text if too long (Voyage supports up to 32k tokens, ~120k chars)
  const maxChars = 100000 // Approximately 25k tokens (conservative)
  const truncatedText = text.length > maxChars ? text.substring(0, maxChars) : text

  console.log(`📊 Generating embedding for ${truncatedText.length} characters using ${model}`)

  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VOYAGE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: truncatedText,
      input_type: 'document' // Use 'document' for content to be stored, 'query' for search queries
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Voyage AI API error: ${error}`)
  }

  const data = await response.json()

  return {
    embedding: data.data[0].embedding,
    model: model,
    usage: {
      total_tokens: data.usage.total_tokens
    }
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { text, model }: EmbeddingRequest = await req.json()

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🔍 Embedding request received for ${text.length} characters`)

    const result = await generateEmbedding(text, model || 'voyage-3-large')

    console.log(`✅ Embedding generated: ${result.embedding.length} dimensions (voyage-3-large), ${result.usage.total_tokens} tokens`)

    return new Response(
      JSON.stringify({
        success: true,
        embedding: result.embedding,
        model: result.model,
        dimensions: result.embedding.length,
        usage: result.usage
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  } catch (error) {
    console.error('❌ Error generating embedding:', error)

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
