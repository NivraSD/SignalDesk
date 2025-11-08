/**
 * Memory Vault API Client
 *
 * CRITICAL: This bypasses Supabase PostgREST cache issues by using the API endpoint
 * which uses SERVICE_ROLE_KEY on the server side.
 *
 * ALL components MUST use these functions instead of direct Supabase queries.
 */

export interface MemoryVaultQueryParams {
  organization_id?: string
  content_type?: string
  blueprint_id?: string
  limit?: number
  folder?: string
}

export interface MemoryVaultItem {
  id: string
  organization_id: string
  content_type: string
  title: string
  content: any
  metadata?: any
  tags?: string[]
  status?: string
  folder?: string
  created_at: string
  updated_at?: string
  salience_score?: number
  intelligence_status?: string
}

/**
 * Fetch content from Memory Vault
 * Uses API endpoint to bypass PostgREST cache
 */
export async function fetchMemoryVaultContent(
  params: MemoryVaultQueryParams = {}
): Promise<MemoryVaultItem[]> {
  try {
    const searchParams = new URLSearchParams()

    if (params.organization_id) searchParams.set('organization_id', params.organization_id)
    if (params.content_type) searchParams.set('type', params.content_type)
    if (params.blueprint_id) searchParams.set('blueprint_id', params.blueprint_id)
    if (params.limit) searchParams.set('limit', params.limit.toString())

    const response = await fetch(`/api/content-library/save?${searchParams.toString()}`)

    if (!response.ok) {
      console.error('❌ Memory Vault fetch error:', response.status, response.statusText)
      return []
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('❌ Memory Vault fetch error:', error)
    return []
  }
}

/**
 * Save content to Memory Vault
 * Uses API endpoint to bypass PostgREST cache
 */
export async function saveToMemoryVault(contentData: {
  organization_id?: string
  type: string
  title: string
  content: any
  metadata?: any
  folder?: string
  tags?: string[]
}): Promise<MemoryVaultItem | null> {
  try {
    const response = await fetch('/api/content-library/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: {
          type: contentData.type,
          title: contentData.title,
          content: contentData.content,
          organization_id: contentData.organization_id,
          metadata: contentData.metadata
        },
        folder: contentData.folder || 'Unsorted',
        metadata: contentData.metadata || {}
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Memory Vault save error:', errorData)
      return null
    }

    const result = await response.json()
    return result.data || null
  } catch (error) {
    console.error('❌ Memory Vault save error:', error)
    return null
  }
}

/**
 * Helper: Get content for a specific opportunity/blueprint
 */
export async function getOpportunityContent(
  organizationId: string,
  blueprintId: string
): Promise<MemoryVaultItem[]> {
  return fetchMemoryVaultContent({
    organization_id: organizationId,
    blueprint_id: blueprintId,
    limit: 100
  })
}

/**
 * Helper: Get schemas for an organization
 */
export async function getSchemas(organizationId: string): Promise<MemoryVaultItem[]> {
  return fetchMemoryVaultContent({
    organization_id: organizationId,
    content_type: 'schema',
    limit: 100
  })
}

/**
 * Helper: Get all content for an organization
 */
export async function getOrganizationContent(
  organizationId: string,
  limit: number = 500
): Promise<MemoryVaultItem[]> {
  return fetchMemoryVaultContent({
    organization_id: organizationId,
    limit
  })
}
