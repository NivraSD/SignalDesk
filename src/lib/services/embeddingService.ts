import { supabase } from '@/lib/supabase/client'

/**
 * Embedding Service
 *
 * Provides utilities for generating embeddings using Voyage AI's voyage-3-large model
 * for semantic search in the Memory Vault.
 */

export interface EmbeddingResult {
  embedding: number[]
  model: string
  dimensions: number
  usage: {
    total_tokens: number
  }
}

/**
 * Generate embedding for text using Voyage AI voyage-3-large
 *
 * @param text - The text to generate embedding for
 * @returns Promise with embedding vector (1024 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: { text }
    })

    if (error) {
      console.error('❌ Error generating embedding:', error)
      return null
    }

    if (!data?.embedding) {
      console.error('❌ No embedding returned from function')
      return null
    }

    console.log(`✅ Generated ${data.dimensions}D embedding using ${data.model}`)
    return data.embedding
  } catch (err) {
    console.error('❌ Exception generating embedding:', err)
    return null
  }
}

/**
 * Prepare text for embedding generation
 * Combines title and content in an optimal way for semantic search
 *
 * @param title - Content title
 * @param content - Content body (will be truncated to first 1000 chars)
 * @returns Formatted text for embedding
 */
export function prepareTextForEmbedding(title: string, content: string): string {
  // Use title + first 1000 chars of content for embedding
  // This captures the essence while staying within reasonable token limits
  const truncatedContent = content?.substring(0, 1000) || ''
  return `${title}\n\n${truncatedContent}`.trim()
}

/**
 * Save content to content_library with automatic embedding generation
 *
 * @param contentData - Content data to save (without embedding)
 * @returns Promise with saved content ID
 */
export async function saveContentWithEmbedding(contentData: {
  id?: string
  organization_id: string
  content_type: string
  title: string
  content: string
  folder?: string
  metadata?: any
}): Promise<string | null> {
  try {
    // Generate embedding
    const textForEmbedding = prepareTextForEmbedding(contentData.title, contentData.content)
    const embedding = await generateEmbedding(textForEmbedding)

    // Generate ID if not provided
    const contentId = contentData.id || crypto.randomUUID()

    // Save with embedding
    const { error } = await supabase.from('content_library').insert({
      ...contentData,
      id: contentId,
      embedding,
      embedding_model: 'voyage-3-large',
      embedding_updated_at: embedding ? new Date().toISOString() : null
    })

    if (error) {
      console.error('❌ Error saving content:', error)
      return null
    }

    console.log(`✅ Saved content with embedding: ${contentId}`)
    return contentId
  } catch (err) {
    console.error('❌ Exception saving content:', err)
    return null
  }
}

/**
 * Save opportunity with automatic embedding generation
 *
 * @param opportunityData - Opportunity data to save (without embedding)
 * @returns Promise with saved opportunity ID
 */
export async function saveOpportunityWithEmbedding(opportunityData: {
  id?: string
  organization_id: string
  title: string
  description: string
  urgency?: string
  score?: number
  metadata?: any
}): Promise<string | null> {
  try {
    // Generate embedding from title + description
    const textForEmbedding = `${opportunityData.title}\n\n${opportunityData.description || ''}`.trim()
    const embedding = await generateEmbedding(textForEmbedding)

    // Generate ID if not provided
    const opportunityId = opportunityData.id || crypto.randomUUID()

    // Save with embedding
    const { error } = await supabase.from('opportunities').insert({
      ...opportunityData,
      id: opportunityId,
      embedding,
      embedding_model: 'voyage-3-large',
      embedding_updated_at: embedding ? new Date().toISOString() : null
    })

    if (error) {
      console.error('❌ Error saving opportunity:', error)
      return null
    }

    console.log(`✅ Saved opportunity with embedding: ${opportunityId}`)
    return opportunityId
  } catch (err) {
    console.error('❌ Exception saving opportunity:', err)
    return null
  }
}

/**
 * Semantic search in content library
 * Uses vector similarity to find semantically similar content
 *
 * @param query - Search query
 * @param organizationId - Organization ID to filter by
 * @param limit - Maximum number of results (default 5)
 * @param threshold - Similarity threshold 0-1 (default 0.7)
 * @returns Promise with matching content
 */
export async function semanticSearchContent(
  query: string,
  organizationId: string,
  limit: number = 5,
  threshold: number = 0.7
): Promise<any[]> {
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query)
    if (!queryEmbedding) {
      console.error('❌ Could not generate query embedding')
      return []
    }

    // Call match_content RPC function
    const { data, error } = await supabase.rpc('match_content', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      org_id: organizationId
    })

    if (error) {
      console.error('❌ Error in semantic search:', error)
      return []
    }

    console.log(`🔍 Found ${data?.length || 0} semantically similar items`)
    return data || []
  } catch (err) {
    console.error('❌ Exception in semantic search:', err)
    return []
  }
}

/**
 * Semantic search in opportunities
 *
 * @param query - Search query
 * @param organizationId - Organization ID to filter by
 * @param limit - Maximum number of results (default 5)
 * @param threshold - Similarity threshold 0-1 (default 0.7)
 * @returns Promise with matching opportunities
 */
export async function semanticSearchOpportunities(
  query: string,
  organizationId: string,
  limit: number = 5,
  threshold: number = 0.7
): Promise<any[]> {
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query)
    if (!queryEmbedding) {
      console.error('❌ Could not generate query embedding')
      return []
    }

    // Call match_opportunities RPC function
    const { data, error } = await supabase.rpc('match_opportunities', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      org_id: organizationId
    })

    if (error) {
      console.error('❌ Error in semantic search:', error)
      return []
    }

    console.log(`🔍 Found ${data?.length || 0} semantically similar opportunities`)
    return data || []
  } catch (err) {
    console.error('❌ Exception in semantic search:', err)
    return []
  }
}
