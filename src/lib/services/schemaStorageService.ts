import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Schema Storage Service
 *
 * Manages schema storage in Memory Vault (content_library table)
 * Schemas are stored with:
 * - content_type: 'schema'
 * - folder: 'Schemas/Active/', 'Schemas/{Platform}-Optimized/', etc.
 * - content: JSON schema
 * - metadata: { schema_type, platform_optimized, version }
 * - intelligence: GEO performance data
 */

export interface SchemaMetadata {
  schema_type: string // 'Organization', 'Product', 'FAQPage', etc.
  platform_optimized?: string // 'all', 'claude', 'gemini', 'chatgpt', 'perplexity'
  version?: number
  last_updated?: string
  created_by?: string
}

export interface SchemaIntelligence {
  schemaType: string
  fields: string[]
  lastTested?: string
  platforms?: {
    [platform: string]: {
      mentioned: boolean
      rank?: number
      performance_score?: number
    }
  }
  performance_history?: Array<{
    date: string
    platform: string
    mentioned: boolean
    rank?: number
  }>
}

export interface Schema {
  id?: string
  organization_id: string
  schema_type: string
  folder: string
  content: any // JSON schema content
  metadata: SchemaMetadata
  intelligence?: SchemaIntelligence
  salience?: number
  created_at?: string
  updated_at?: string
}

export class SchemaStorageService {
  private supabase = createClient(supabaseUrl, supabaseKey)

  /**
   * Get all schemas for an organization
   */
  async getSchemas(organizationId: string, options?: {
    schemaType?: string
    platform?: string
    folder?: string
  }): Promise<Schema[]> {
    try {
      let query = this.supabase
        .from('content_library')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('content_type', 'schema')
        .order('updated_at', { ascending: false })

      if (options?.schemaType) {
        query = query.eq('metadata->>schema_type', options.schemaType)
      }

      if (options?.platform) {
        query = query.eq('metadata->>platform_optimized', options.platform)
      }

      if (options?.folder) {
        query = query.ilike('folder', `${options.folder}%`)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching schemas:', error)
      throw error
    }
  }

  /**
   * Get a specific schema by ID
   */
  async getSchema(schemaId: string): Promise<Schema | null> {
    try {
      const { data, error } = await this.supabase
        .from('content_library')
        .select('*')
        .eq('id', schemaId)
        .eq('content_type', 'schema')
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching schema:', error)
      throw error
    }
  }

  /**
   * Save a new schema to Memory Vault
   */
  async saveSchema(schema: Schema): Promise<Schema> {
    try {
      const { data, error } = await this.supabase
        .from('content_library')
        .insert({
          organization_id: schema.organization_id,
          content_type: 'schema',
          folder: schema.folder || 'Schemas/Active/',
          content: schema.content,
          metadata: schema.metadata,
          intelligence: schema.intelligence || {},
          salience: schema.salience || 1.0
        })
        .select()
        .single()

      if (error) throw error

      console.log('✅ Schema saved to Memory Vault:', data.id)
      return data
    } catch (error) {
      console.error('Error saving schema:', error)
      throw error
    }
  }

  /**
   * Update an existing schema
   */
  async updateSchema(schemaId: string, updates: Partial<Schema>): Promise<Schema> {
    try {
      const updateData: any = {}

      if (updates.content) updateData.content = updates.content
      if (updates.metadata) updateData.metadata = updates.metadata
      if (updates.intelligence) updateData.intelligence = updates.intelligence
      if (updates.folder) updateData.folder = updates.folder
      if (updates.salience !== undefined) updateData.salience = updates.salience

      const { data, error } = await this.supabase
        .from('content_library')
        .update(updateData)
        .eq('id', schemaId)
        .eq('content_type', 'schema')
        .select()
        .single()

      if (error) throw error

      console.log('✅ Schema updated:', schemaId)
      return data
    } catch (error) {
      console.error('Error updating schema:', error)
      throw error
    }
  }

  /**
   * Delete a schema
   */
  async deleteSchema(schemaId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('content_library')
        .delete()
        .eq('id', schemaId)
        .eq('content_type', 'schema')

      if (error) throw error

      console.log('✅ Schema deleted:', schemaId)
    } catch (error) {
      console.error('Error deleting schema:', error)
      throw error
    }
  }

  /**
   * Apply a schema recommendation
   * Takes a recommendation and applies the changes to the schema
   */
  async applyRecommendation(
    organizationId: string,
    recommendation: any
  ): Promise<Schema> {
    try {
      console.log('🔧 Applying schema recommendation:', recommendation.title)

      // Find existing schema or create new one
      const schemas = await this.getSchemas(organizationId, {
        schemaType: recommendation.schema_type
      })

      let schema: Schema

      if (schemas.length > 0) {
        // Update existing schema
        schema = schemas[0]
        const updatedContent = this.applyChanges(schema.content, recommendation.changes)

        schema = await this.updateSchema(schema.id!, {
          content: updatedContent,
          metadata: {
            ...schema.metadata,
            version: (schema.metadata.version || 1) + 1,
            last_updated: new Date().toISOString()
          },
          intelligence: {
            ...schema.intelligence,
            lastRecommendationApplied: {
              title: recommendation.title,
              date: new Date().toISOString(),
              changes: recommendation.changes
            }
          } as any
        })
      } else {
        // Create new schema
        const newContent = this.buildSchemaFromRecommendation(recommendation)

        schema = await this.saveSchema({
          organization_id: organizationId,
          schema_type: recommendation.schema_type,
          folder: `Schemas/Active/`,
          content: newContent,
          metadata: {
            schema_type: recommendation.schema_type,
            platform_optimized: recommendation.platform || 'all',
            version: 1,
            created_by: 'geo_recommendation'
          },
          intelligence: {
            schemaType: recommendation.schema_type,
            fields: Object.keys(newContent),
            lastRecommendationApplied: {
              title: recommendation.title,
              date: new Date().toISOString(),
              changes: recommendation.changes
            }
          } as any
        })
      }

      console.log('✅ Recommendation applied to schema:', schema.id)
      return schema
    } catch (error) {
      console.error('Error applying recommendation:', error)
      throw error
    }
  }

  /**
   * Apply JSON changes to schema content
   */
  private applyChanges(content: any, changes: any): any {
    if (!changes || typeof changes !== 'object') {
      return content
    }

    const updated = { ...content }

    // Handle different types of changes
    if (changes.action === 'update' || changes.action === 'add') {
      if (changes.field && changes.value !== undefined) {
        updated[changes.field] = changes.value
      }
    } else if (changes.action === 'delete') {
      if (changes.field) {
        delete updated[changes.field]
      }
    } else if (Array.isArray(changes)) {
      // Handle array of changes
      changes.forEach((change: any) => {
        if (change.action === 'update' || change.action === 'add') {
          updated[change.field] = change.value
        } else if (change.action === 'delete') {
          delete updated[change.field]
        }
      })
    }

    return updated
  }

  /**
   * Build new schema from recommendation
   */
  private buildSchemaFromRecommendation(recommendation: any): any {
    const baseSchema: any = {
      '@context': 'https://schema.org',
      '@type': recommendation.schema_type
    }

    // Apply changes from recommendation
    if (recommendation.changes) {
      return this.applyChanges(baseSchema, recommendation.changes)
    }

    return baseSchema
  }

  /**
   * Track schema performance from GEO testing
   */
  async trackPerformance(
    schemaId: string,
    platform: string,
    query: string,
    result: {
      mentioned: boolean
      rank?: number
      sentiment?: string
      context_quality?: string
    }
  ): Promise<void> {
    try {
      const schema = await this.getSchema(schemaId)
      if (!schema) throw new Error('Schema not found')

      const intelligence = schema.intelligence || ({} as any)
      const platforms = intelligence.platforms || {}
      const performanceHistory = intelligence.performance_history || []

      // Update platform performance
      platforms[platform] = {
        mentioned: result.mentioned,
        rank: result.rank,
        performance_score: result.mentioned ? (result.rank ? 100 - result.rank * 10 : 80) : 0,
        last_tested: new Date().toISOString()
      }

      // Add to performance history
      performanceHistory.push({
        date: new Date().toISOString(),
        platform,
        query,
        mentioned: result.mentioned,
        rank: result.rank,
        sentiment: result.sentiment,
        context_quality: result.context_quality
      })

      // Keep only last 100 performance records
      const recentHistory = performanceHistory.slice(-100)

      await this.updateSchema(schemaId, {
        intelligence: {
          ...intelligence,
          platforms,
          performance_history: recentHistory,
          lastTested: new Date().toISOString()
        }
      })

      console.log('📊 Schema performance tracked:', { schemaId, platform, mentioned: result.mentioned })
    } catch (error) {
      console.error('Error tracking schema performance:', error)
      throw error
    }
  }
}

export const schemaStorage = new SchemaStorageService()
