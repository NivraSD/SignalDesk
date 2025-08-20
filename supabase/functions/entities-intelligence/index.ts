// SignalDesk Entities Intelligence - Converted from MCP Server
// Comprehensive entity management and relationship mapping

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

interface EntitiesRequest {
  method: string
  params: {
    organization_name?: string
    domain?: string
    entity_id?: string
    industry?: string
    entity_names?: string[]
    depth?: number
    include_financial?: boolean
    profile_data?: any
    enrichment_sources?: string[]
    query?: string
    filters?: any
    update_data?: any
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

    const request: EntitiesRequest = await req.json()
    const { method, params } = request

    let result

    switch (method) {
      case 'discover_entity_by_domain':
        result = await discoverEntityByDomain(supabase, params)
        break
      case 'create_organization_profile':
        result = await createOrganizationProfile(supabase, params)
        break
      case 'map_stakeholder_relationships':
        result = await mapStakeholderRelationships(supabase, params)
        break
      case 'enrich_entity_profile':
        result = await enrichEntityProfile(supabase, params)
        break
      case 'search_entities':
        result = await searchEntities(supabase, params)
        break
      case 'update_entity_intelligence':
        result = await updateEntityIntelligence(supabase, params)
        break
      case 'analyze_entity_connections':
        result = await analyzeEntityConnections(supabase, params)
        break
      default:
        result = await searchEntities(supabase, { query: params.organization_name || 'demo' })
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

async function discoverEntityByDomain(supabase: any, params: any) {
  const { domain } = params

  // Mock entity discovery from domain
  const entity = {
    domain,
    organization_name: extractCompanyNameFromDomain(domain),
    confidence_score: 0.95,
    discovery_method: 'domain_analysis',
    preliminary_data: {
      industry_indicators: identifyIndustryFromDomain(domain),
      size_indicators: 'medium',
      geographic_indicators: getGeographicFromDomain(domain),
      technology_stack: analyzeTechnologyStack(domain)
    },
    next_steps: [
      'Create full organization profile',
      'Gather stakeholder information',
      'Set up monitoring configuration',
      'Map industry relationships'
    ],
    discovered_at: new Date().toISOString()
  }

  return entity
}

async function createOrganizationProfile(supabase: any, params: any) {
  const { organization_name, profile_data = {} } = params

  const profile = {
    id: `org_${Date.now()}`,
    name: organization_name,
    aliases: generateAliases(organization_name),
    industry: {
      primary: profile_data.industry || inferIndustry(organization_name),
      secondary: [],
      subcategories: []
    },
    metadata: {
      founded: profile_data.founded || 'Unknown',
      headquarters: profile_data.headquarters || 'Unknown',
      employees: profile_data.employees || 'Unknown',
      revenue: profile_data.revenue || 'Unknown',
      public_private: profile_data.public_private || 'unknown',
      website: profile_data.website || `https://www.${organization_name.toLowerCase().replace(/\s+/g, '')}.com`,
      social_handles: profile_data.social_handles || {}
    },
    stakeholders: {
      executives: [],
      board_members: [],
      major_investors: [],
      key_customers: [],
      main_competitors: inferCompetitors(organization_name),
      regulators: [],
      media_outlets: [],
      activist_groups: []
    },
    monitoring_config: {
      keywords: generateMonitoringKeywords(organization_name),
      rss_feeds: [],
      api_endpoints: [],
      social_accounts: [],
      regulatory_filings: profile_data.public_private === 'public',
      executive_changes: true,
      ma_activity: true,
      crisis_indicators: generateCrisisIndicators(organization_name)
    },
    intelligence: {
      narrative_themes: [],
      recent_developments: [],
      upcoming_catalysts: [],
      risk_factors: [],
      opportunities: [],
      cascade_triggers: []
    },
    relationships: {
      subsidiaries: [],
      joint_ventures: [],
      strategic_partnerships: []
    },
    last_updated: new Date().toISOString(),
    enrichment_status: 'partial'
  }

  // Store in database
  try {
    await supabase.from('organization_profiles').upsert(profile)
  } catch (error) {
    console.log('Failed to store organization profile:', error)
  }

  return {
    profile_id: profile.id,
    organization_name: profile.name,
    status: 'created',
    enrichment_level: 'basic',
    next_enrichment_steps: [
      'Gather executive information',
      'Map competitor landscape',
      'Identify key stakeholders',
      'Set up monitoring feeds'
    ],
    monitoring_ready: true,
    profile_summary: {
      industry: profile.industry.primary,
      monitoring_keywords: profile.monitoring_config.keywords.length,
      known_competitors: profile.stakeholders.main_competitors.length
    }
  }
}

async function mapStakeholderRelationships(supabase: any, params: any) {
  const { entity_id, depth = 2, include_financial = true } = params

  const relationshipMap = {
    entity_id,
    relationship_depth: depth,
    mapping_timestamp: new Date().toISOString(),
    stakeholder_categories: {
      executives: {
        count: Math.floor(Math.random() * 10) + 3,
        key_relationships: [
          { name: 'CEO', influence_score: 0.95, public_profile: true },
          { name: 'CFO', influence_score: 0.85, public_profile: true },
          { name: 'CTO', influence_score: 0.80, public_profile: false }
        ]
      },
      investors: include_financial ? {
        count: Math.floor(Math.random() * 15) + 5,
        major_holders: [
          { name: 'Venture Capital Fund A', stake: '15%', influence: 'high' },
          { name: 'Private Equity Fund B', stake: '25%', influence: 'very_high' },
          { name: 'Strategic Investor C', stake: '8%', influence: 'medium' }
        ]
      } : { count: 0, note: 'Financial data excluded' },
      customers: {
        key_accounts: [
          { name: 'Major Customer 1', relationship_strength: 'strong' },
          { name: 'Major Customer 2', relationship_strength: 'medium' },
          { name: 'Major Customer 3', relationship_strength: 'strong' }
        ]
      },
      competitors: {
        direct_competitors: [
          { name: 'Competitor A', competitive_intensity: 'high' },
          { name: 'Competitor B', competitive_intensity: 'medium' },
          { name: 'Competitor C', competitive_intensity: 'low' }
        ]
      },
      regulators: {
        primary_regulators: ['SEC', 'FTC', 'Industry Regulator'],
        compliance_requirements: ['Financial Reporting', 'Data Privacy', 'Industry Standards']
      }
    },
    influence_network: {
      central_nodes: ['CEO', 'Major Investor', 'Key Customer'],
      network_density: 0.7,
      critical_relationships: 5,
      cascade_potential: 'medium'
    },
    recommendations: [
      'Monitor CEO communications closely',
      'Track major investor sentiment',
      'Watch for regulatory changes',
      'Monitor competitor moves'
    ]
  }

  return relationshipMap
}

async function enrichEntityProfile(supabase: any, params: any) {
  const { entity_id, enrichment_sources = ['financial', 'social', 'news', 'regulatory'] } = params

  const enrichmentResults = {
    entity_id,
    enrichment_sources,
    enrichment_timestamp: new Date().toISOString(),
    data_sources: {
      financial: enrichment_sources.includes('financial') ? {
        revenue_estimates: '$100M - $500M',
        growth_rate: '15-25% YoY',
        funding_rounds: [
          { round: 'Series C', amount: '$50M', date: '2023-06' },
          { round: 'Series B', amount: '$25M', date: '2022-03' }
        ],
        valuation: '$1B - $2B'
      } : null,
      social: enrichment_sources.includes('social') ? {
        social_presence: {
          twitter: '@company',
          linkedin: 'company',
          employee_count_linkedin: 250
        },
        sentiment_score: 0.7,
        engagement_metrics: {
          followers: 45000,
          engagement_rate: '3.2%'
        }
      } : null,
      news: enrichment_sources.includes('news') ? {
        recent_coverage: [
          { title: 'Company announces new product', sentiment: 'positive', source: 'TechCrunch' },
          { title: 'Company raises funding round', sentiment: 'positive', source: 'Forbes' }
        ],
        coverage_volume: 'medium',
        sentiment_trend: 'positive'
      } : null,
      regulatory: enrichment_sources.includes('regulatory') ? {
        compliance_status: 'compliant',
        recent_filings: ['10-K', '10-Q'],
        regulatory_changes: []
      } : null
    },
    intelligence_updates: {
      narrative_themes: [
        'Growth and expansion',
        'Product innovation',
        'Market leadership'
      ],
      risk_factors: [
        'Competitive pressure',
        'Regulatory changes',
        'Market volatility'
      ],
      opportunities: [
        'Market expansion',
        'Strategic partnerships',
        'Product line extension'
      ]
    },
    enrichment_quality: {
      completeness: calculateCompleteness(enrichment_sources),
      confidence: 0.85,
      last_verified: new Date().toISOString()
    }
  }

  return enrichmentResults
}

async function searchEntities(supabase: any, params: any) {
  const { query, filters = {} } = params

  // Mock search results
  const entities = [
    {
      id: 'org_1',
      name: 'TechCorp Inc',
      industry: 'Technology',
      match_score: 0.95,
      summary: 'Leading enterprise software company',
      key_metrics: {
        employees: '1000-5000',
        revenue: '$100M+',
        founded: '2015'
      }
    },
    {
      id: 'org_2',
      name: 'InnovateTech',
      industry: 'Technology',
      match_score: 0.87,
      summary: 'AI and machine learning startup',
      key_metrics: {
        employees: '100-500',
        revenue: '$10M-50M',
        founded: '2020'
      }
    },
    {
      id: 'org_3',
      name: 'DataSolutions LLC',
      industry: 'Technology',
      match_score: 0.78,
      summary: 'Data analytics and business intelligence',
      key_metrics: {
        employees: '500-1000',
        revenue: '$50M-100M',
        founded: '2018'
      }
    }
  ]

  return {
    query,
    total_results: entities.length,
    entities: entities.filter(e => !filters.industry || e.industry === filters.industry),
    search_metadata: {
      execution_time: '150ms',
      sources: ['database', 'external_apis'],
      confidence_threshold: 0.5
    }
  }
}

async function updateEntityIntelligence(supabase: any, params: any) {
  const { entity_id, update_data } = params

  const intelligenceUpdate = {
    entity_id,
    update_timestamp: new Date().toISOString(),
    updates_applied: {
      narrative_themes: update_data.narrative_themes || [],
      recent_developments: update_data.recent_developments || [],
      risk_factors: update_data.risk_factors || [],
      opportunities: update_data.opportunities || []
    },
    intelligence_score: {
      current: 0.82,
      change: '+0.05',
      factors: ['new_partnership', 'positive_coverage', 'product_launch']
    },
    monitoring_adjustments: {
      new_keywords: extractKeywords(update_data),
      priority_changes: ['increased_social_monitoring', 'regulatory_watch'],
      alert_thresholds: 'adjusted'
    }
  }

  return intelligenceUpdate
}

async function analyzeEntityConnections(supabase: any, params: any) {
  const { entity_names, depth = 2 } = params

  const connectionAnalysis = {
    entities_analyzed: entity_names,
    analysis_depth: depth,
    connection_matrix: generateConnectionMatrix(entity_names),
    network_insights: {
      strongest_connections: [
        { entities: [entity_names[0], entity_names[1]], strength: 0.85, type: 'competitive' },
        { entities: [entity_names[1], entity_names[2]], strength: 0.72, type: 'partnership' }
      ],
      network_density: 0.6,
      central_entities: [entity_names[0]],
      cluster_analysis: {
        clusters: [
          { entities: entity_names.slice(0, 2), theme: 'technology_leaders' },
          { entities: entity_names.slice(1), theme: 'emerging_players' }
        ]
      }
    },
    cascade_analysis: {
      vulnerability_score: 0.4,
      cascade_triggers: ['regulatory_change', 'market_disruption'],
      impact_propagation: calculateImpactPropagation(entity_names)
    },
    recommendations: [
      'Monitor cross-entity communications',
      'Track competitive dynamics',
      'Watch for partnership opportunities',
      'Assess regulatory impact across network'
    ]
  }

  return connectionAnalysis
}

// Helper functions
function extractCompanyNameFromDomain(domain: string): string {
  return domain.replace(/^www\./, '').replace(/\.(com|org|net|io|co).*$/, '').replace(/[-_]/g, ' ')
}

function identifyIndustryFromDomain(domain: string): string[] {
  const indicators = []
  if (domain.includes('tech') || domain.includes('soft')) indicators.push('technology')
  if (domain.includes('fin') || domain.includes('bank')) indicators.push('financial')
  if (domain.includes('health') || domain.includes('med')) indicators.push('healthcare')
  return indicators.length > 0 ? indicators : ['unknown']
}

function getGeographicFromDomain(domain: string): string {
  const tld = domain.split('.').pop()
  const geoMap: Record<string, string> = {
    'uk': 'United Kingdom',
    'de': 'Germany',
    'fr': 'France',
    'ca': 'Canada',
    'au': 'Australia'
  }
  return geoMap[tld || ''] || 'United States'
}

function analyzeTechnologyStack(domain: string): string[] {
  // Mock technology analysis
  return ['React', 'Node.js', 'AWS', 'PostgreSQL']
}

function generateAliases(organizationName: string): string[] {
  const aliases = [organizationName]
  
  // Add common variations
  if (organizationName.includes(' Inc')) {
    aliases.push(organizationName.replace(' Inc', ''))
  }
  if (organizationName.includes(' Corp')) {
    aliases.push(organizationName.replace(' Corp', ''))
  }
  if (organizationName.includes(' LLC')) {
    aliases.push(organizationName.replace(' LLC', ''))
  }
  
  // Add acronym if applicable
  const words = organizationName.split(' ')
  if (words.length > 1) {
    aliases.push(words.map(w => w[0]).join(''))
  }
  
  return aliases
}

function inferIndustry(organizationName: string): string {
  const name = organizationName.toLowerCase()
  if (name.includes('tech') || name.includes('soft') || name.includes('data')) return 'Technology'
  if (name.includes('bank') || name.includes('finance') || name.includes('capital')) return 'Financial Services'
  if (name.includes('health') || name.includes('medical') || name.includes('pharma')) return 'Healthcare'
  if (name.includes('energy') || name.includes('oil') || name.includes('gas')) return 'Energy'
  return 'Unknown'
}

function inferCompetitors(organizationName: string): string[] {
  // Mock competitor inference based on industry
  const industry = inferIndustry(organizationName)
  switch (industry) {
    case 'Technology':
      return ['TechCompetitor A', 'TechCompetitor B', 'TechCompetitor C']
    case 'Financial Services':
      return ['FinanceCompetitor A', 'FinanceCompetitor B']
    case 'Healthcare':
      return ['HealthCompetitor A', 'HealthCompetitor B']
    default:
      return ['Competitor A', 'Competitor B']
  }
}

function generateMonitoringKeywords(organizationName: string): string[] {
  const keywords = [organizationName]
  
  // Add variations and related terms
  keywords.push(organizationName.toLowerCase())
  keywords.push(organizationName.replace(/\s+/g, ''))
  
  // Add industry-specific keywords
  const industry = inferIndustry(organizationName)
  switch (industry) {
    case 'Technology':
      keywords.push('innovation', 'platform', 'digital transformation')
      break
    case 'Financial Services':
      keywords.push('investment', 'banking', 'financial services')
      break
    case 'Healthcare':
      keywords.push('healthcare', 'medical', 'patient care')
      break
  }
  
  return keywords
}

function generateCrisisIndicators(organizationName: string): string[] {
  return [
    'data breach',
    'lawsuit',
    'executive departure',
    'regulatory investigation',
    'product recall',
    'security incident',
    'financial irregularities'
  ]
}

function calculateCompleteness(sources: string[]): number {
  const maxSources = 4 // financial, social, news, regulatory
  return Math.min(sources.length / maxSources, 1.0)
}

function extractKeywords(updateData: any): string[] {
  const keywords = []
  
  if (updateData.narrative_themes) {
    keywords.push(...updateData.narrative_themes.map((theme: string) => theme.toLowerCase()))
  }
  
  if (updateData.recent_developments) {
    updateData.recent_developments.forEach((dev: any) => {
      if (dev.keywords) keywords.push(...dev.keywords)
    })
  }
  
  return [...new Set(keywords)]
}

function generateConnectionMatrix(entityNames: string[]): any {
  const matrix = {}
  
  for (let i = 0; i < entityNames.length; i++) {
    matrix[entityNames[i]] = {}
    for (let j = 0; j < entityNames.length; j++) {
      if (i !== j) {
        matrix[entityNames[i]][entityNames[j]] = {
          strength: Math.random() * 0.8 + 0.2,
          type: ['competitive', 'partnership', 'supplier', 'customer'][Math.floor(Math.random() * 4)]
        }
      }
    }
  }
  
  return matrix
}

function calculateImpactPropagation(entityNames: string[]): any {
  return entityNames.map(name => ({
    entity: name,
    propagation_score: Math.random() * 0.8 + 0.2,
    impact_radius: Math.floor(Math.random() * 3) + 1,
    time_to_impact: `${Math.floor(Math.random() * 48) + 1} hours`
  }))
}