/**
 * Gamma Presentation Capture Utilities
 * Helper functions for searching and retrieving captured Gamma presentations
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface CapturedPresentation {
  id: string
  organization_id: string
  campaign_id: string | null
  gamma_id: string
  gamma_url: string
  gamma_edit_url: string | null
  title: string
  topic: string | null
  slide_count: number
  full_text: string | null
  slides: any
  pptx_url: string | null
  pdf_url: string | null
  format: 'presentation' | 'document' | 'social'
  generation_params: any
  credits_used: any
  created_at: string
  updated_at: string
}

/**
 * Search presentations by text query
 */
export async function searchPresentations(
  query: string,
  organizationId?: string,
  limit: number = 10
): Promise<CapturedPresentation[]> {
  try {
    const { data, error } = await supabase.rpc('search_presentations', {
      search_query: query,
      org_id: organizationId || null,
      max_results: limit
    })

    if (error) {
      console.error('Error searching presentations:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

/**
 * Get all presentations for a campaign
 */
export async function getCampaignPresentations(
  campaignId: string
): Promise<CapturedPresentation[]> {
  try {
    const { data, error } = await supabase
      .from('campaign_presentations')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching campaign presentations:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Fetch error:', error)
    return []
  }
}

/**
 * Get all presentations for an organization
 */
export async function getOrganizationPresentations(
  organizationId: string,
  limit: number = 50
): Promise<CapturedPresentation[]> {
  try {
    const { data, error } = await supabase
      .from('campaign_presentations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching organization presentations:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Fetch error:', error)
    return []
  }
}

/**
 * Get a single presentation by ID
 */
export async function getPresentation(
  presentationId: string
): Promise<CapturedPresentation | null> {
  try {
    const { data, error } = await supabase
      .from('campaign_presentations')
      .select('*')
      .eq('id', presentationId)
      .single()

    if (error) {
      console.error('Error fetching presentation:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Fetch error:', error)
    return null
  }
}

/**
 * Get a presentation by Gamma ID
 */
export async function getPresentationByGammaId(
  gammaId: string
): Promise<CapturedPresentation | null> {
  try {
    const { data, error } = await supabase
      .from('campaign_presentations')
      .select('*')
      .eq('gamma_id', gammaId)
      .single()

    if (error) {
      console.error('Error fetching presentation by Gamma ID:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Fetch error:', error)
    return null
  }
}

/**
 * Get relevant presentations for a topic (for NIV context)
 */
export async function getRelevantPresentationsForTopic(
  topic: string,
  organizationId: string,
  limit: number = 5
): Promise<Array<{
  title: string
  topic: string | null
  gamma_url: string
  relevantSlides: any[]
  created_at: string
}>> {
  try {
    // Search for presentations related to the topic
    const results = await searchPresentations(topic, organizationId, limit)

    // Transform into context format
    return results.map(p => ({
      title: p.title,
      topic: p.topic,
      gamma_url: p.gamma_url,
      relevantSlides: p.slides || [],
      created_at: p.created_at
    }))
  } catch (error) {
    console.error('Error getting relevant presentations:', error)
    return []
  }
}

/**
 * Delete a presentation
 */
export async function deletePresentation(
  presentationId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('campaign_presentations')
      .delete()
      .eq('id', presentationId)

    if (error) {
      console.error('Error deleting presentation:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Delete error:', error)
    return false
  }
}

/**
 * Update presentation metadata
 */
export async function updatePresentation(
  presentationId: string,
  updates: Partial<CapturedPresentation>
): Promise<CapturedPresentation | null> {
  try {
    const { data, error } = await supabase
      .from('campaign_presentations')
      .update(updates)
      .eq('id', presentationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating presentation:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Update error:', error)
    return null
  }
}

/**
 * Get presentation statistics for an organization
 */
export async function getPresentationStats(organizationId: string): Promise<{
  total: number
  byFormat: Record<string, number>
  totalSlides: number
  recentCount: number
}> {
  try {
    const { data, error } = await supabase
      .from('campaign_presentations')
      .select('format, slide_count, created_at')
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error fetching stats:', error)
      throw error
    }

    const presentations = data || []
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const stats = {
      total: presentations.length,
      byFormat: {} as Record<string, number>,
      totalSlides: 0,
      recentCount: 0
    }

    presentations.forEach(p => {
      // Count by format
      stats.byFormat[p.format] = (stats.byFormat[p.format] || 0) + 1

      // Total slides
      stats.totalSlides += p.slide_count || 0

      // Recent count
      if (new Date(p.created_at) > oneWeekAgo) {
        stats.recentCount++
      }
    })

    return stats
  } catch (error) {
    console.error('Stats error:', error)
    return {
      total: 0,
      byFormat: {},
      totalSlides: 0,
      recentCount: 0
    }
  }
}
