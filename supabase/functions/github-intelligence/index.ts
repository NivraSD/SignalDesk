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
    // Search for repositories in the same industry/space
    const searchQuery = params.keywords?.join(' ') || params.organization?.industry || 'tech'
    const repoSearch = await callGitHubAPI(`/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=10`)
    
    for (const repo of repoSearch.items || []) {
      // Get recent activity
      const commits = await callGitHubAPI(`/repos/${repo.full_name}/commits?per_page=5`)
      const issues = await callGitHubAPI(`/repos/${repo.full_name}/issues?state=open&per_page=5`)
      
      insights.push({
        type: 'competitive',
        title: `${repo.owner.login}/${repo.name}`,
        insight: `${repo.description || 'Repository activity'} - ${repo.stargazers_count} stars, ${commits?.length || 0} recent commits`,
        relevance: repo.stargazers_count > 1000 ? 'high' : 'medium',
        actionable: true,
        suggestedAction: `Monitor ${repo.name} for competitive insights`,
        source: 'GitHub API',
        data: {
          repo: repo.full_name,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          updated: repo.updated_at,
          recentCommits: commits?.length || 0,
          openIssues: issues?.length || 0,
          url: repo.html_url
        },
        timestamp: new Date().toISOString()
      })
    }

    // Get trending repositories
    const trendingSearch = await callGitHubAPI(`/search/repositories?q=created:>${new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0]}&sort=stars&order=desc&per_page=5`)
    
    for (const repo of trendingSearch.items || []) {
      insights.push({
        type: 'trend',
        title: `Trending: ${repo.name}`,
        insight: `New trending repository: ${repo.description || repo.name}`,
        relevance: 'medium',
        actionable: true,
        suggestedAction: 'Investigate trending technology for strategic opportunities',
        source: 'GitHub API',
        data: {
          repo: repo.full_name,
          stars: repo.stargazers_count,
          language: repo.language,
          created: repo.created_at,
          url: repo.html_url
        },
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('GitHub API error:', error)
    throw new Error(`GitHub intelligence gathering failed: ${error.message}`)
  }

  return insights
}

async function gatherDeveloperIntelligence(params: any) {
  const insights = []
  
  try {
    // Search for users/developers in the industry
    const searchQuery = params.keywords?.join(' ') || params.organization?.industry || 'developer'
    const userSearch = await callGitHubAPI(`/search/users?q=${encodeURIComponent(searchQuery)}&sort=followers&order=desc&per_page=10`)
    
    for (const user of userSearch.items || []) {
      // Get user details
      const userDetail = await callGitHubAPI(`/users/${user.login}`)
      
      // Get recent activity
      const events = await callGitHubAPI(`/users/${user.login}/events/public?per_page=5`)
      
      insights.push({
        type: 'developer',
        title: `Developer: ${user.login}`,
        insight: `${userDetail.name || user.login}: ${userDetail.bio || 'Active developer'} - ${user.followers} followers`,
        relevance: user.followers > 100 ? 'high' : 'medium',
        actionable: true,
        suggestedAction: `Consider engaging with ${user.login} for developer relations`,
        source: 'GitHub API',
        data: {
          username: user.login,
          name: userDetail.name,
          bio: userDetail.bio,
          followers: user.followers,
          publicRepos: userDetail.public_repos,
          company: userDetail.company,
          location: userDetail.location,
          blog: userDetail.blog,
          recentActivity: events?.length || 0,
          url: user.html_url
        },
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('GitHub API error:', error)
    throw new Error(`GitHub developer intelligence failed: ${error.message}`)
  }

  return insights
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
        const [competitive, developer] = await Promise.all([
          gatherCompetitorIntelligence(params),
          gatherDeveloperIntelligence(params)
        ])
        
        data = {
          insights: [...competitive, ...developer],
          totalInsights: competitive.length + developer.length,
          categories: ['competitive', 'developer', 'trend'],
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

      case 'developers':
        const developerData = await gatherDeveloperIntelligence(params)
        data = {
          insights: developerData,
          totalInsights: developerData.length,
          focus: 'developer_relations',
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