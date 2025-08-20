// GitHub Intelligence MCP - Real API Integration
// Provides actual GitHub data instead of fallback responses

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GitHubRequest {
  method: string
  params: {
    organization?: {
      name: string
      industry?: string
    }
    keywords?: string[]
    stakeholder?: string
  }
}

const GITHUB_API_TOKEN = Deno.env.get('GITHUB_API_TOKEN')

async function callGitHubAPI(endpoint: string, options?: RequestInit) {
  if (!GITHUB_API_TOKEN) {
    throw new Error('GitHub API token not configured')
  }

  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GITHUB_API_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options?.headers
    }
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

async function gatherCompetitorIntelligence(params: any) {
  const insights = []
  
  try {
    // Search for company-specific repositories and organizations
    const competitors = params.keywords || [params.organization?.name || 'competitor']
    
    for (const competitor of competitors) {
      console.log(`🔍 Analyzing ${competitor} on GitHub`)
      
      // Look for the company's official GitHub organization
      try {
        const orgSearch = await callGitHubAPI(`/search/users?q=${encodeURIComponent(competitor)}+type:org`)
        
        for (const org of orgSearch.items?.slice(0, 3) || []) {
          // Get organization details
          const orgDetails = await callGitHubAPI(`/orgs/${org.login}`)
          
          // Get organization repositories (focused on product/business intelligence)
          const repos = await callGitHubAPI(`/orgs/${org.login}/repos?sort=updated&per_page=10`)
          
          insights.push({
            type: 'company_presence',
            title: `${competitor} GitHub Organization`,
            insight: `Official presence: ${org.login} - ${orgDetails.public_repos} public repositories, ${orgDetails.followers} followers`,
            relevance: orgDetails.public_repos > 5 ? 'high' : 'medium',
            actionable: true,
            suggestedAction: `Monitor ${org.login} for product announcements and technical direction`,
            source: 'GitHub Organizations',
            data: {
              organization: org.login,
              company: orgDetails.company || competitor,
              publicRepos: orgDetails.public_repos,
              followers: orgDetails.followers,
              blog: orgDetails.blog,
              location: orgDetails.location,
              description: orgDetails.description,
              topRepos: repos?.slice(0, 5).map(repo => ({
                name: repo.name,
                description: repo.description,
                language: repo.language,
                stars: repo.stargazers_count,
                lastUpdated: repo.updated_at
              })),
              url: orgDetails.html_url
            },
            timestamp: new Date().toISOString()
          })
        }
      } catch (error) {
        console.error(`Error searching for ${competitor} organization:`, error)
      }

      // Search for recent activity and announcements
      try {
        const recentQuery = `${encodeURIComponent(competitor)}+created:>${new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]}`
        const recentRepos = await callGitHubAPI(`/search/repositories?q=${recentQuery}&sort=created&order=desc&per_page=5`)
        
        for (const repo of recentRepos.items || []) {
          if (repo.owner.login.toLowerCase().includes(competitor.toLowerCase()) || 
              repo.name.toLowerCase().includes(competitor.toLowerCase())) {
            
            insights.push({
              type: 'recent_activity',
              title: `New Repository: ${repo.name}`,
              insight: `${competitor} created new repository: ${repo.description || repo.name}`,
              relevance: repo.stargazers_count > 10 ? 'high' : 'medium',
              actionable: true,
              suggestedAction: `Investigate new ${repo.name} project for competitive positioning`,
              source: 'GitHub Recent Activity',
              data: {
                repo: repo.full_name,
                description: repo.description,
                language: repo.language,
                created: repo.created_at,
                stars: repo.stargazers_count,
                isPrivate: repo.private,
                url: repo.html_url
              },
              timestamp: new Date().toISOString()
            })
          }
        }
      } catch (error) {
        console.error(`Error searching recent activity for ${competitor}:`, error)
      }
    }

    // Search for competitive technology trends in the industry
    if (params.organization?.industry) {
      try {
        const industryQuery = `${encodeURIComponent(params.organization.industry)}+stars:>100`
        const industryRepos = await callGitHubAPI(`/search/repositories?q=${industryQuery}&sort=updated&order=desc&per_page=5`)
        
        for (const repo of industryRepos.items || []) {
          insights.push({
            type: 'industry_trend',
            title: `Industry Technology: ${repo.name}`,
            insight: `Popular ${params.organization.industry} technology: ${repo.description || repo.name} (${repo.stargazers_count} stars)`,
            relevance: repo.stargazers_count > 1000 ? 'high' : 'medium',
            actionable: true,
            suggestedAction: `Evaluate ${repo.name} technology for strategic adoption or partnership`,
            source: 'GitHub Industry Trends',
            data: {
              repo: repo.full_name,
              description: repo.description,
              language: repo.language,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              owner: repo.owner.login,
              url: repo.html_url
            },
            timestamp: new Date().toISOString()
          })
        }
      } catch (error) {
        console.error(`Error searching industry trends:`, error)
      }
    }

  } catch (error) {
    console.error('GitHub competitive intelligence error:', error)
    throw new Error(`GitHub intelligence gathering failed: ${error.message}`)
  }

  return insights
}

async function gatherTalentIntelligence(params: any) {
  const insights = []
  
  try {
    // Search for key technical talent at competitor companies
    const competitors = params.keywords || [params.organization?.name || 'competitor']
    
    for (const competitor of competitors) {
      console.log(`👔 Analyzing talent at ${competitor}`)
      
      // Search for users who mention the competitor in their profile
      try {
        const talentQuery = `${encodeURIComponent(competitor)}+in:bio+followers:>50`
        const talentSearch = await callGitHubAPI(`/search/users?q=${talentQuery}&sort=followers&order=desc&per_page=10`)
        
        for (const user of talentSearch.items || []) {
          // Get user details
          const userDetail = await callGitHubAPI(`/users/${user.login}`)
          
          // Only include if they actually work at the competitor
          if (userDetail.company?.toLowerCase().includes(competitor.toLowerCase()) || 
              userDetail.bio?.toLowerCase().includes(competitor.toLowerCase())) {
            
            insights.push({
              type: 'talent',
              title: `Key Talent: ${userDetail.name || user.login}`,
              insight: `${competitor} employee: ${userDetail.bio || 'Technical professional'} - ${user.followers} followers, ${userDetail.public_repos} repos`,
              relevance: user.followers > 500 ? 'high' : 'medium',
              actionable: true,
              suggestedAction: `Monitor ${user.login} for industry insights and potential recruitment`,
              source: 'GitHub Talent Intelligence',
              data: {
                username: user.login,
                name: userDetail.name,
                company: userDetail.company,
                position: extractPosition(userDetail.bio),
                bio: userDetail.bio,
                followers: user.followers,
                publicRepos: userDetail.public_repos,
                location: userDetail.location,
                blog: userDetail.blog,
                expertise: inferExpertise(userDetail),
                url: user.html_url
              },
              timestamp: new Date().toISOString()
            })
          }
        }
      } catch (error) {
        console.error(`Error searching talent for ${competitor}:`, error)
      }
    }

    // Search for industry thought leaders and influential developers
    if (params.organization?.industry) {
      try {
        const industryQuery = `${encodeURIComponent(params.organization.industry)}+followers:>1000`
        const influencerSearch = await callGitHubAPI(`/search/users?q=${industryQuery}&sort=followers&order=desc&per_page=5`)
        
        for (const user of influencerSearch.items || []) {
          const userDetail = await callGitHubAPI(`/users/${user.login}`)
          
          insights.push({
            type: 'influencer',
            title: `Industry Influencer: ${userDetail.name || user.login}`,
            insight: `${params.organization.industry} thought leader: ${userDetail.bio || 'Industry expert'} - ${user.followers} followers`,
            relevance: user.followers > 5000 ? 'high' : 'medium',
            actionable: true,
            suggestedAction: `Engage with ${user.login} for thought leadership opportunities`,
            source: 'GitHub Industry Influencers',
            data: {
              username: user.login,
              name: userDetail.name,
              company: userDetail.company,
              bio: userDetail.bio,
              followers: user.followers,
              publicRepos: userDetail.public_repos,
              influence: calculateInfluence(userDetail, user.followers),
              url: user.html_url
            },
            timestamp: new Date().toISOString()
          })
        }
      } catch (error) {
        console.error(`Error searching industry influencers:`, error)
      }
    }

  } catch (error) {
    console.error('GitHub talent intelligence error:', error)
    throw new Error(`GitHub talent intelligence failed: ${error.message}`)
  }

  return insights
}

// Helper functions for talent analysis
function extractPosition(bio: string): string {
  if (!bio) return 'Not specified'
  
  const positions = ['ceo', 'cto', 'cfo', 'vp', 'director', 'lead', 'senior', 'principal', 'architect', 'engineer']
  const lowerBio = bio.toLowerCase()
  
  for (const position of positions) {
    if (lowerBio.includes(position)) {
      return position.charAt(0).toUpperCase() + position.slice(1)
    }
  }
  
  return 'Developer'
}

function inferExpertise(userDetail: any): string[] {
  const expertise = []
  const bio = (userDetail.bio || '').toLowerCase()
  
  if (bio.includes('ai') || bio.includes('machine learning') || bio.includes('ml')) expertise.push('AI/ML')
  if (bio.includes('cloud') || bio.includes('aws') || bio.includes('azure')) expertise.push('Cloud')
  if (bio.includes('frontend') || bio.includes('react') || bio.includes('vue')) expertise.push('Frontend')
  if (bio.includes('backend') || bio.includes('api') || bio.includes('server')) expertise.push('Backend')
  if (bio.includes('mobile') || bio.includes('ios') || bio.includes('android')) expertise.push('Mobile')
  if (bio.includes('security') || bio.includes('cybersecurity')) expertise.push('Security')
  if (bio.includes('data') || bio.includes('analytics') || bio.includes('datascience')) expertise.push('Data')
  
  return expertise.length > 0 ? expertise : ['General Development']
}

function calculateInfluence(userDetail: any, followers: number): string {
  if (followers > 10000) return 'Very High'
  if (followers > 5000) return 'High'
  if (followers > 1000) return 'Medium'
  return 'Low'
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const request: GitHubRequest = await req.json()
    const { method, params } = request

    console.log(`🔍 GitHub Intelligence: ${method} request for ${params.stakeholder}`)

    let data: any = {}

    switch (method) {
      case 'gather':
        // Comprehensive intelligence gathering
        const [competitive, talent] = await Promise.all([
          gatherCompetitorIntelligence(params),
          gatherTalentIntelligence(params)
        ])
        
        data = {
          insights: [...competitive, ...talent],
          totalInsights: competitive.length + talent.length,
          categories: ['competitive', 'talent', 'company_presence', 'industry_trend'],
          timestamp: new Date().toISOString()
        }
        break

      case 'competitive':
        const competitiveData = await gatherCompetitorIntelligence(params)
        data = {
          insights: competitiveData,
          totalInsights: competitiveData.length,
          focus: 'competitive_analysis',
          timestamp: new Date().toISOString()
        }
        break

      case 'talent':
        const talentData = await gatherTalentIntelligence(params)
        data = {
          insights: talentData,
          totalInsights: talentData.length,
          focus: 'talent_intelligence',
          timestamp: new Date().toISOString()
        }
        break

      default:
        throw new Error(`Unknown method: ${method}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        source: 'GitHub API',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ GitHub Intelligence error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        service: 'GitHub Intelligence MCP',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 503  // Service unavailable when API fails
      }
    )
  }
})