import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/organizations/discover
 * Run MCP discovery for an organization to get competitors, topics, stakeholders
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { organization_name, organization_id, industry_hint, website, about_page, save_profile } = body

    if (!organization_name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Running MCP discovery for: ${organization_name}`)
    console.log(`   Save profile: ${save_profile ? 'YES' : 'NO'}`)

    // Call MCP discovery function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/mcp-discovery`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({
          tool: 'create_organization_profile',
          arguments: {
            organization_name,
            organization_id, // Pass org ID for saving
            industry_hint,
            website,
            about_page,
            save_to_persistence: save_profile || false // Save if requested
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('MCP discovery error:', error)
      return NextResponse.json(
        { error: 'Failed to run discovery' },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.success) {
      return NextResponse.json(
        { error: data.error || 'Discovery failed' },
        { status: 500 }
      )
    }

    const profile = data.profile

    // Extract discovered items for user customization
    // Combine topics from multiple sources (trending, market drivers/barriers, keywords)
    const allTopics = [
      ...(profile.trending?.hot_topics || []),
      ...(profile.market?.market_drivers || []),
      ...(profile.market?.market_barriers || []),
      ...(profile.market?.key_metrics || []),
      ...(profile.monitoring_config?.keywords || []).slice(0, 10) // Limit keywords
    ].filter((t, i, arr) => arr.indexOf(t) === i) // Dedupe

    const discoveredItems = {
      competitors: profile.competition?.direct_competitors || [],
      indirect_competitors: profile.competition?.indirect_competitors || [],
      emerging_threats: profile.competition?.emerging_threats || [],
      topics: allTopics,
      stakeholders: {
        regulators: profile.stakeholders?.regulators || [],
        key_analysts: profile.stakeholders?.key_analysts || [],
        activists: profile.stakeholders?.activists || [],
        influencers: profile.stakeholders?.influencers || [],
        major_customers: profile.stakeholders?.major_customers || [],
        major_investors: profile.stakeholders?.major_investors || [],
        key_partners: profile.stakeholders?.key_partners || [],
        key_suppliers: profile.stakeholders?.key_suppliers || []
      },
      industry: profile.industry,
      sub_industry: profile.sub_industry,
      description: profile.description
    }

    console.log(`✅ Discovery complete for ${organization_name}:`)
    console.log(`   - ${discoveredItems.competitors.length} competitors`)
    console.log(`   - ${discoveredItems.topics.length} topics`)
    console.log(`   - ${discoveredItems.stakeholders.regulators.length} regulators`)
    console.log(`   - ${discoveredItems.stakeholders.key_analysts.length} analysts`)
    console.log(`   - ${discoveredItems.stakeholders.activists.length} activists`)

    return NextResponse.json({
      success: true,
      discovered: discoveredItems,
      full_profile: profile // Include full profile for later saving
    })
  } catch (error: any) {
    console.error('Discovery API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
