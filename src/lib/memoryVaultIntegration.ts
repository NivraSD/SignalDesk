import { supabase } from '@/lib/supabase/client'

export interface OrganizationProfile {
  id: string
  name: string
  industry: string
  description?: string
  website?: string
  keyPeople?: any[]
  positioning?: string
  targetAudiences?: string[]
}

export interface BrandGuidelines {
  voice?: string
  tone?: string
  keyMessages?: string[]
  doNotSay?: string[]
  stylePreferences?: any
}

export interface CampaignContext {
  sessionId: string
  campaignGoal?: string
  positioning?: string
  coreNarrative?: string
  keyMessages?: string[]
}

/**
 * Fetch organization profile from MemoryVault
 */
export async function getOrganizationProfile(orgId: string): Promise<OrganizationProfile | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (error) {
    console.error('Error fetching organization profile:', error)
    return null
  }

  return data as OrganizationProfile
}

/**
 * Fetch brand guidelines from MemoryVault
 * Returns null if brand guidelines don't exist - this is optional
 */
export async function getBrandGuidelines(orgId: string): Promise<BrandGuidelines | null> {
  // Brand guidelines are optional - return null for now
  // TODO: Implement when brand_guidelines table/columns are added
  return null
}

/**
 * Fetch campaign context from session
 */
export async function getCampaignContext(sessionId: string): Promise<CampaignContext | null> {
  const { data, error } = await supabase
    .from('campaign_builder_sessions')
    .select('id, campaign_goal')
    .eq('id', sessionId)
    .single()

  if (error) {
    console.warn('Error fetching campaign context:', error)
    return null
  }

  return {
    sessionId,
    campaignGoal: data.campaign_goal || undefined
  }
}

/**
 * Fetch previous generated content for context
 */
export async function getPreviousContent(sessionId: string, contentType?: string) {
  let query = supabase
    .from('campaign_execution_items')
    .select('*')
    .eq('session_id', sessionId)
    .eq('status', 'generated')
    .order('created_at', { ascending: false })
    .limit(5)

  if (contentType) {
    query = query.eq('content_type', contentType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching previous content:', error)
    return []
  }

  return data
}

/**
 * Build complete generation context
 */
export async function buildGenerationContext(
  sessionId: string,
  orgId: string,
  contentType: string
) {
  const [orgProfile, brandGuidelines, campaignContext, previousContent] = await Promise.all([
    getOrganizationProfile(orgId),
    getBrandGuidelines(orgId),
    getCampaignContext(sessionId),
    getPreviousContent(sessionId, contentType)
  ])

  return {
    orgProfile,
    brandGuidelines,
    campaignContext,
    previousContent
  }
}
