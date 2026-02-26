// Campaign Performance Get
// Purpose: Get campaign performance metrics from attributions
// Trigger: Called when user views campaign analytics dashboard

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface PerformanceRequest {
  campaignId?: string
  organizationId: string
  contentId?: string // Optional: get performance for specific content
}

interface PerformanceMetrics {
  total_coverage: number
  high_confidence_matches: number
  total_reach: number
  avg_confidence: number
  sentiment_breakdown: {
    positive: number
    neutral: number
    negative: number
  }
  coverage_by_type: Record<string, number>
  top_outlets: Array<{outlet: string, count: number}>
  timeline: Array<any>
  verified_count: number
  pending_verification: number
}

serve(async (req) => {
  try {
    const {
      campaignId,
      organizationId,
      contentId
    }: PerformanceRequest = await req.json()

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    console.log('📊 Getting campaign performance...')
    console.log(`   Organization: ${organizationId}`)
    if (campaignId) console.log(`   Campaign: ${campaignId}`)
    if (contentId) console.log(`   Content: ${contentId}`)

    // Get attributions based on filters
    let query = supabase
      .from('campaign_attributions')
      .select(`
        *,
        fingerprint:campaign_fingerprints(
          key_phrases,
          content_type,
          expected_channels,
          content_id
        )
      `)
      .eq('organization_id', organizationId)
      .order('published_at', { ascending: false })

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    const { data: attributions, error } = await query

    if (error) {
      console.error('Error fetching attributions:', error)
      throw error
    }

    console.log(`   Found ${attributions?.length || 0} attributions`)

    // If filtering by contentId, filter the results
    let filteredAttributions = attributions || []
    if (contentId && attributions) {
      filteredAttributions = attributions.filter(
        a => a.fingerprint?.content_id === contentId
      )
      console.log(`   Filtered to ${filteredAttributions.length} for content ${contentId}`)
    }

    if (filteredAttributions.length === 0) {
      return new Response(
        JSON.stringify({
          campaignId,
          contentId,
          attributions: [],
          metrics: {
            total_coverage: 0,
            high_confidence_matches: 0,
            total_reach: 0,
            avg_confidence: 0,
            sentiment_breakdown: { positive: 0, neutral: 0, negative: 0 },
            coverage_by_type: {},
            top_outlets: [],
            timeline: [],
            verified_count: 0,
            pending_verification: 0
          }
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Calculate metrics
    const metrics: PerformanceMetrics = {
      total_coverage: filteredAttributions.length,
      high_confidence_matches: filteredAttributions.filter(a => a.confidence_score > 0.8).length,
      total_reach: filteredAttributions.reduce((sum, a) => sum + (a.estimated_reach || 0), 0),

      sentiment_breakdown: {
        positive: filteredAttributions.filter(a => a.sentiment === 'positive').length,
        neutral: filteredAttributions.filter(a => a.sentiment === 'neutral').length,
        negative: filteredAttributions.filter(a => a.sentiment === 'negative').length
      },

      coverage_by_type: groupBy(filteredAttributions, 'source_type'),
      top_outlets: getTopOutlets(filteredAttributions),

      timeline: buildTimeline(filteredAttributions),

      avg_confidence: filteredAttributions.length
        ? filteredAttributions.reduce((sum, a) => sum + a.confidence_score, 0) / filteredAttributions.length
        : 0,

      verified_count: filteredAttributions.filter(a => a.user_verified).length,
      pending_verification: filteredAttributions.filter(a =>
        !a.user_verified && a.confidence_score < 0.9
      ).length
    }

    console.log('✅ Performance metrics calculated')
    console.log(`   Coverage: ${metrics.total_coverage}`)
    console.log(`   Total reach: ${metrics.total_reach.toLocaleString()}`)
    console.log(`   Avg confidence: ${(metrics.avg_confidence * 100).toFixed(0)}%`)

    return new Response(
      JSON.stringify({
        campaignId,
        contentId,
        organizationId,
        attributions: filteredAttributions,
        metrics
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error in campaign-performance-get:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Performance fetch failed'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

function groupBy(arr: any[], key: string): Record<string, number> {
  return arr.reduce((acc, item) => {
    const group = item[key] || 'unknown'
    acc[group] = (acc[group] || 0) + 1
    return acc
  }, {})
}

function getTopOutlets(attributions: any[]): Array<{outlet: string, count: number, reach: number}> {
  const outlets = attributions
    .filter(a => a.source_outlet)
    .reduce((acc: any, a) => {
      const key = a.source_outlet
      if (!acc[key]) {
        acc[key] = { count: 0, reach: 0 }
      }
      acc[key].count++
      acc[key].reach += (a.estimated_reach || 0)
      return acc
    }, {})

  return Object.entries(outlets)
    .map(([outlet, data]: [string, any]) => ({
      outlet,
      count: data.count,
      reach: data.reach
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

function buildTimeline(attributions: any[]) {
  return attributions
    .filter(a => a.published_at)
    .map(a => ({
      date: a.published_at,
      outlet: a.source_outlet,
      type: a.source_type,
      confidence: a.confidence_score,
      reach: a.estimated_reach,
      title: a.content_title,
      url: a.source_url,
      sentiment: a.sentiment,
      match_type: a.match_type
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
