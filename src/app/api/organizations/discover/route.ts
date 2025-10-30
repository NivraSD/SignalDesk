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
    const { organization_name, industry_hint, website } = body

    if (!organization_name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Running MCP discovery for: ${organization_name}`)

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
            industry_hint,
            website,
            save_to_persistence: false // Don't save yet, let user customize first
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
    const discoveredItems = {
      competitors: profile.competition?.direct_competitors || [],
      topics: profile.trending?.hot_topics || [],
      stakeholders: {
        regulators: profile.stakeholders?.regulators || [],
        influencers: profile.stakeholders?.influencers || [],
        major_customers: profile.stakeholders?.major_customers || []
      },
      industry: profile.industry,
      sub_industry: profile.sub_industry,
      description: profile.description
    }

    console.log(`✅ Discovery complete for ${organization_name}:`)
    console.log(`   - ${discoveredItems.competitors.length} competitors`)
    console.log(`   - ${discoveredItems.topics.length} topics`)
    console.log(`   - ${discoveredItems.stakeholders.regulators.length} regulators`)

    // Search for positive coverage (awards, achievements, positive press)
    console.log(`🏆 Searching for positive coverage...`)
    let positiveCoverage: any[] = []

    try {
      const coverageSearches = [
        `${organization_name} awards`,
        `${organization_name} achievements`,
        `${organization_name} recognition`,
        `${organization_name} industry leader`
      ]

      for (const searchQuery of coverageSearches) {
        const searchResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/web-search`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            },
            body: JSON.stringify({
              query: searchQuery,
              max_results: 3
            })
          }
        )

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          if (searchData.success && searchData.results) {
            positiveCoverage.push(...searchData.results.map((r: any) => ({
              title: r.title,
              url: r.url,
              summary: r.snippet,
              source: r.source || 'Web',
              search_query: searchQuery
            })))
          }
        }
      }

      console.log(`✅ Found ${positiveCoverage.length} positive coverage items`)
    } catch (coverageError) {
      console.warn('Positive coverage search failed (non-blocking):', coverageError)
    }

    return NextResponse.json({
      success: true,
      discovered: discoveredItems,
      full_profile: profile, // Include full profile for later saving
      positive_coverage: positiveCoverage // Include positive coverage for schema generation
    })
  } catch (error: any) {
    console.error('Discovery API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
