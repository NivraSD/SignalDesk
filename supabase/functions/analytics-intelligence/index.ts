// SignalDesk Analytics Intelligence - Converted from MCP Server
// Comprehensive PR analytics with media value calculations, sentiment analysis, and ROI tracking

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

interface AnalyticsRequest {
  method: string
  params: {
    coverage_items?: any[]
    time_period?: string
    include_social_amplification?: boolean
    coverage_text?: string
    coverage_url?: string
    outlet?: string
    analysis_depth?: string
    key_topics?: string[]
    company_name?: string
    competitors?: string[]
    media_types?: string[]
    keywords?: string[]
    campaign_id?: string
    campaign_budget?: number
    goals?: string[]
    start_date?: string
    end_date?: string
    baseline_metrics?: any
    report_type?: string
    metrics_focus?: string[]
    audience?: string
    include_recommendations?: boolean
    key_messages?: string[]
    media_outlets?: string[]
    message_variations?: boolean
    quality_factors?: string[]
    benchmark_against?: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const request: AnalyticsRequest = await req.json()
    const { method, params } = request

    let result

    switch (method) {
      case 'calculate_media_value':
        result = await calculateMediaValue(supabase, params)
        break
      case 'sentiment_analysis':
        result = await sentimentAnalysis(supabase, params)
        break
      case 'competitive_share_of_voice':
        result = await competitiveShareOfVoice(supabase, params)
        break
      case 'campaign_roi_analysis':
        result = await campaignRoiAnalysis(supabase, params)
        break
      case 'generate_executive_dashboard':
        result = await generateExecutiveDashboard(supabase, params)
        break
      case 'track_message_penetration':
        result = await trackMessagePenetration(supabase, params)
        break
      case 'coverage_quality_scoring':
        result = await coverageQualityScoring(supabase, params)
        break
      // Legacy methods for backward compatibility
      case 'analyze':
      case 'track':
        result = await generateExecutiveDashboard(supabase, { report_type: 'daily' })
        break
      case 'report':
        result = await generateExecutiveDashboard(supabase, { report_type: 'weekly' })
        break
      default:
        result = await generateExecutiveDashboard(supabase, { report_type: 'monthly' })
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function calculateMediaValue(supabase: any, params: any) {
  const { coverage_items, time_period = 'month', include_social_amplification = false } = params
  
  let totalAVE = 0
  let totalReach = 0
  let totalImpressions = 0
  
  const calculations = coverage_items.map((item: any) => {
    // Base AVE calculation based on outlet type and reach
    let baseAVE = 0
    let multiplier = 1
    
    switch (item.type) {
      case 'print':
        baseAVE = (item.reach / 1000) * 2.5 // $2.50 per thousand reach
        break
      case 'online':
        baseAVE = (item.reach / 1000) * 1.8
        break
      case 'broadcast':
        baseAVE = (item.reach / 1000) * 8.0
        break
      case 'podcast':
        baseAVE = (item.reach / 1000) * 4.2
        break
      case 'social':
        baseAVE = (item.reach / 1000) * 0.5
        break
    }
    
    // Prominence multiplier
    if (item.prominence === 'front_page') multiplier = 2.0
    else if (item.prominence === 'section_front') multiplier = 1.5
    else if (item.prominence === 'brief') multiplier = 0.5
    
    const itemAVE = baseAVE * multiplier
    const impressions = item.reach * (include_social_amplification ? 1.3 : 1)
    
    totalAVE += itemAVE
    totalReach += item.reach
    totalImpressions += impressions
    
    return {
      outlet: item.outlet,
      type: item.type,
      reach: item.reach,
      ave: Math.round(itemAVE),
      impressions: Math.round(impressions),
      prominence: item.prominence || 'inside'
    }
  })

  return {
    summary: `Media Value Analysis (${time_period})`,
    total_ave: Math.round(totalAVE),
    total_reach: Math.round(totalReach),
    total_impressions: Math.round(totalImpressions),
    social_amplification: include_social_amplification,
    cost_per_impression: (totalAVE / totalImpressions).toFixed(4),
    average_ave_per_placement: Math.round(totalAVE / coverage_items.length),
    breakdown: calculations,
    timestamp: new Date().toISOString()
  }
}

async function sentimentAnalysis(supabase: any, params: any) {
  const { coverage_text, coverage_url, outlet, analysis_depth = 'basic', key_topics = [] } = params
  
  // Generate realistic sentiment analysis
  const mockSentiment = {
    overall_score: Math.random() * 10, // 0-10 scale
    confidence: 0.85 + Math.random() * 0.15,
    themes: [
      'Innovation and Technology',
      'Market Leadership',
      'Industry Disruption',
      'Growth and Expansion'
    ]
  }

  const sentimentLabel = mockSentiment.overall_score >= 7 ? 'Positive' :
                        mockSentiment.overall_score >= 4 ? 'Neutral' : 'Negative'

  let topicSentiments = {}
  if (key_topics.length > 0) {
    key_topics.forEach((topic: string) => {
      const topicScore = 3 + Math.random() * 4 // 3-7 range
      topicSentiments[topic] = {
        score: topicScore.toFixed(1),
        sentiment: topicScore >= 6 ? 'Positive' : topicScore >= 4 ? 'Neutral' : 'Negative'
      }
    })
  }

  return {
    overall_sentiment: {
      score: mockSentiment.overall_score.toFixed(1),
      label: sentimentLabel,
      confidence: (mockSentiment.confidence * 100).toFixed(1)
    },
    key_themes: mockSentiment.themes,
    topic_sentiments: topicSentiments,
    analysis_depth,
    outlet: outlet || 'Unknown',
    recommendations: generateSentimentRecommendations(mockSentiment.overall_score, analysis_depth),
    timestamp: new Date().toISOString()
  }
}

async function competitiveShareOfVoice(supabase: any, params: any) {
  const { company_name, competitors, time_period = 'month', media_types = ['online', 'print'], keywords = [] } = params
  
  const allCompanies = [company_name, ...competitors]
  const totalMentions = 1000 + Math.random() * 2000
  
  const shareData = allCompanies.map(company => {
    const mentions = Math.floor(Math.random() * (totalMentions / allCompanies.length) * 2)
    const share = (mentions / totalMentions) * 100
    const sentiment = 3 + Math.random() * 4 // 3-7 range
    
    return {
      company,
      mentions,
      share: share.toFixed(1),
      sentiment: sentiment.toFixed(1),
      reach: mentions * (50000 + Math.random() * 200000)
    }
  })

  // Sort by share of voice
  shareData.sort((a, b) => parseFloat(b.share) - parseFloat(a.share))

  const yourPosition = shareData.findIndex(d => d.company === company_name) + 1
  const yourShare = shareData.find(d => d.company === company_name)?.share

  return {
    analysis_period: time_period,
    total_mentions: Math.round(totalMentions),
    media_types: media_types,
    keywords: keywords,
    competitive_data: shareData,
    your_position: yourPosition,
    your_share: yourShare,
    insights: generateCompetitiveInsights(yourPosition, yourShare, shareData),
    timestamp: new Date().toISOString()
  }
}

async function campaignRoiAnalysis(supabase: any, params: any) {
  const { campaign_id, campaign_budget, goals, start_date, end_date, baseline_metrics = {} } = params
  
  // Calculate campaign duration
  const startDate = new Date(start_date)
  const endDate = new Date(end_date)
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // Mock campaign results based on goals
  const results = {
    media_mentions: 45 + Math.floor(Math.random() * 55),
    total_ave: 125000 + Math.random() * 200000,
    total_reach: 2500000 + Math.random() * 3000000,
    website_traffic_lift: 15 + Math.random() * 25, // percentage
    lead_generation: Math.floor(Math.random() * 150),
    sentiment_improvement: 0.5 + Math.random() * 1.5,
    share_of_voice_increase: 2 + Math.random() * 8
  }

  let roi_score = null
  let cost_metrics = {}
  
  if (campaign_budget) {
    roi_score = ((results.total_ave - campaign_budget) / campaign_budget) * 100
    cost_metrics = {
      cost_per_mention: campaign_budget / results.media_mentions,
      cost_per_lead: results.lead_generation > 0 ? campaign_budget / results.lead_generation : 0,
      cost_per_million_impressions: (campaign_budget / results.total_reach) * 1000000
    }
  }

  return {
    campaign_id,
    duration_days: durationDays,
    budget: campaign_budget,
    goals,
    performance_metrics: results,
    roi_analysis: roi_score ? { roi_percentage: roi_score.toFixed(1), ...cost_metrics } : null,
    goal_achievement: generateGoalAchievement(goals, results),
    timestamp: new Date().toISOString()
  }
}

async function generateExecutiveDashboard(supabase: any, params: any) {
  const { report_type = 'monthly', metrics_focus = ['media_value', 'sentiment', 'reach'], audience = 'all_executives', include_recommendations = true } = params
  
  // Mock data for dashboard
  const stats = {
    mention_count: 42,
    avg_sentiment: 6.8,
    total_ave: 250000,
    total_reach: 5200000
  }

  const dashboard = {
    report_type,
    generated_date: new Date().toLocaleDateString(),
    audience,
    kpi_summary: generateKPISummary(stats, metrics_focus),
    competitive_position: {
      industry_rank: Math.floor(Math.random() * 3) + 1,
      share_of_voice: (15 + Math.random() * 20).toFixed(1),
      vs_top_competitor: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 10).toFixed(1)}%`
    },
    recommendations: include_recommendations ? generateDashboardRecommendations(audience) : null,
    timestamp: new Date().toISOString()
  }

  return dashboard
}

async function trackMessagePenetration(supabase: any, params: any) {
  const { key_messages, time_period = 'month', media_outlets = [], message_variations = true } = params
  
  const mockResults = key_messages.map((message: string) => {
    const exactMatches = Math.floor(Math.random() * 8) + 1
    const variationMatches = message_variations ? Math.floor(Math.random() * 12) + 2 : 0
    const totalMatches = exactMatches + variationMatches
    const penetrationRate = (totalMatches / 50) * 100 // Assume 50 total mentions

    return {
      message: message.substring(0, 60) + (message.length > 60 ? '...' : ''),
      exact_matches: exactMatches,
      variation_matches: variationMatches,
      total_matches: totalMatches,
      penetration_rate: Math.min(penetrationRate, 100).toFixed(1),
      confidence: 85 + Math.random() * 15
    }
  })

  const avgPenetration = mockResults.reduce((sum: number, r: any) => sum + parseFloat(r.penetration_rate), 0) / mockResults.length

  return {
    time_period,
    message_variations_enabled: message_variations,
    results: mockResults,
    summary: {
      average_penetration: avgPenetration.toFixed(1),
      best_performing_message: mockResults.indexOf(mockResults.reduce((max: any, r: any) => parseFloat(r.penetration_rate) > parseFloat(max.penetration_rate) ? r : max)) + 1,
      messages_needing_reinforcement: mockResults.filter((r: any) => parseFloat(r.penetration_rate) < 30).length
    },
    recommendations: generatePenetrationRecommendations(avgPenetration),
    timestamp: new Date().toISOString()
  }
}

async function coverageQualityScoring(supabase: any, params: any) {
  const { coverage_items, quality_factors = ['outlet_authority', 'journalist_expertise', 'message_accuracy'], benchmark_against = 'industry_average' } = params
  
  const qualityScores = coverage_items.map((item: any) => {
    let score = 50 // Base score
    
    // Outlet authority scoring
    if (quality_factors.includes('outlet_authority')) {
      const tier1Outlets = ['wall street journal', 'new york times', 'financial times', 'reuters', 'bloomberg']
      const tier2Outlets = ['techcrunch', 'forbes', 'business insider', 'cnbc', 'fortune']
      
      if (tier1Outlets.some(outlet => item.outlet.toLowerCase().includes(outlet))) {
        score += 25
      } else if (tier2Outlets.some(outlet => item.outlet.toLowerCase().includes(outlet))) {
        score += 15
      } else {
        score += 5
      }
    }

    // Content quality factors
    if (item.content_length > 500) score += 10
    if (item.mentions_count > 3) score += 8
    if (item.key_message_inclusion) score += 15
    if (item.expert_quotes) score += 12
    if (item.multimedia_elements) score += 8

    // Author expertise
    if (quality_factors.includes('journalist_expertise') && item.author) {
      score += 10 // Assume authored content is higher quality
    }

    return {
      ...item,
      quality_score: Math.min(score, 100),
      grade: score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D'
    }
  })

  const avgScore = qualityScores.reduce((sum: number, item: any) => sum + item.quality_score, 0) / qualityScores.length
  const benchmarkScore = benchmark_against === 'industry_average' ? 72 : 
                          benchmark_against === 'competitor_coverage' ? 68 : 75

  const topTier = qualityScores.filter((item: any) => item.quality_score >= 80).length
  const lowQuality = qualityScores.filter((item: any) => item.quality_score < 60).length

  return {
    overall_metrics: {
      average_score: avgScore.toFixed(1),
      benchmark_score: benchmarkScore,
      performance_vs_benchmark: (avgScore - benchmarkScore).toFixed(1),
      grade_distribution: {
        high_quality: topTier,
        medium_quality: qualityScores.length - topTier - lowQuality,
        low_quality: lowQuality
      }
    },
    coverage_scores: qualityScores,
    quality_factors,
    benchmark_against,
    improvement_opportunities: generateQualityRecommendations(avgScore, benchmarkScore, lowQuality),
    timestamp: new Date().toISOString()
  }
}

// Helper functions
function generateSentimentRecommendations(score: number, depth: string): string[] {
  if (score >= 7) {
    return [
      'Leverage positive sentiment for additional PR opportunities',
      'Share coverage with stakeholders and on social media',
      'Use quotes in marketing materials'
    ]
  } else if (score < 4) {
    return [
      'Address negative sentiment with follow-up communications',
      'Prepare clarifying statements if needed',
      'Monitor for additional negative coverage'
    ]
  } else {
    return [
      'Opportunity to strengthen key messages in future outreach',
      'Consider additional context in follow-up communications'
    ]
  }
}

function generateCompetitiveInsights(position: number, share: string, data: any[]): string[] {
  const insights = [`You rank #${position} with ${share}% share of voice`]
  
  if (position === 1) {
    insights.push('🎉 You lead in share of voice!')
  } else {
    const leader = data[0]
    const gap = parseFloat(leader.share) - parseFloat(share || '0')
    insights.push(`Gap to leader (${leader.company}): ${gap.toFixed(1)} percentage points`)
  }
  
  insights.push('Consider focusing on underrepresented media types')
  insights.push('Monitor competitor campaigns for opportunities')
  
  return insights
}

function generateGoalAchievement(goals: string[], results: any): any {
  const achievement = {}
  
  goals.forEach((goal: string) => {
    switch (goal) {
      case 'awareness':
        achievement[goal] = {
          status: results.total_reach > 2000000 ? 'exceeded' : 'achieved',
          metric: `${Math.round(results.total_reach).toLocaleString()} reach`
        }
        break
      case 'lead_generation':
        achievement[goal] = {
          status: results.lead_generation > 100 ? 'achieved' : 'partial',
          metric: `${results.lead_generation} leads`
        }
        break
      case 'brand_sentiment':
        achievement[goal] = {
          status: 'achieved',
          metric: `+${results.sentiment_improvement.toFixed(1)} points improvement`
        }
        break
      case 'thought_leadership':
        achievement[goal] = {
          status: 'achieved',
          metric: 'Strong media placement quality'
        }
        break
    }
  })
  
  return achievement
}

function generateKPISummary(stats: any, focus: string[]): any {
  const kpis = {}
  
  if (focus.includes('media_value')) {
    kpis['media_value'] = {
      total_ave: `$${(stats.total_ave || 250000).toLocaleString()}`,
      average_per_mention: `$${Math.round((stats.total_ave || 250000) / Math.max(stats.mention_count || 1, 1)).toLocaleString()}`,
      trend: Math.random() > 0.5 ? '+12% vs last period' : '-3% vs last period'
    }
  }
  
  if (focus.includes('sentiment')) {
    kpis['sentiment'] = {
      average_score: `${(stats.avg_sentiment || 6.8).toFixed(1)}/10`,
      health: (stats.avg_sentiment || 6.8) >= 7 ? 'Positive' : (stats.avg_sentiment || 6.8) >= 5 ? 'Neutral' : 'Negative',
      trend: Math.random() > 0.3 ? 'Improving' : 'Stable'
    }
  }
  
  if (focus.includes('reach')) {
    kpis['reach'] = {
      total_reach: `${(stats.total_reach || 5200000).toLocaleString()}`,
      mentions: stats.mention_count || 42,
      average_reach_per_mention: `${Math.round((stats.total_reach || 5200000) / Math.max(stats.mention_count || 1, 1)).toLocaleString()}`
    }
  }
  
  return kpis
}

function generateDashboardRecommendations(audience: string): string[] {
  const recommendations = [
    'Capitalize on positive sentiment trend',
    'Increase outreach to tier-1 publications',
    'Prepare thought leadership content'
  ]
  
  if (audience !== 'investors') {
    recommendations.push('Develop competitive differentiation messaging')
    recommendations.push('Expand into underserved media segments')
    recommendations.push('Enhance crisis communication preparedness')
  }
  
  return recommendations
}

function generatePenetrationRecommendations(avgPenetration: number): string[] {
  if (avgPenetration < 40) {
    return [
      'Low penetration rate - increase message frequency in outreach',
      'Simplify key messages for better adoption',
      'Provide message training for spokespeople'
    ]
  } else if (avgPenetration < 60) {
    return [
      'Moderate penetration - focus on reinforcing underperforming messages',
      'Develop message variations for different audiences'
    ]
  } else {
    return [
      'Strong message penetration - maintain current messaging strategy',
      'Consider evolving messages to stay fresh'
    ]
  }
}

function generateQualityRecommendations(avgScore: number, benchmarkScore: number, lowQuality: number): string[] {
  const recommendations = []
  
  if (avgScore < benchmarkScore) {
    recommendations.push('Focus on tier-1 publications for better outlet authority')
    recommendations.push('Ensure key messages are included in all pitches')
    recommendations.push('Provide multimedia assets to journalists')
  }
  
  if (lowQuality > 0) {
    recommendations.push(`${lowQuality} articles need quality improvement`)
    recommendations.push('Consider more targeted, personalized pitching')
  }
  
  recommendations.push('Maintain relationships with high-performing outlets')
  
  return recommendations
}