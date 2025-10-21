/**
 * SignalDesk Discovery MCP Edge Function - ENHANCED VERSION
 * Creates COMPREHENSIVE organization profiles with:
 * - Competitors (from registry + Claude + web search)
 * - Sources (from master-source-registry)
 * - Stakeholders (customers, regulators, investors, activists)
 * - Trending topics and market dynamics
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { searchWebForCompetitors, fetchYahooFinanceCompetitors } from './external-data-fetcher.ts';
import { getIndustryCompetitors, discoverSubCategory } from './industry-competitors.ts';

// Environment setup
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// Don't throw error immediately - check when actually needed
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY');

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper function to call Anthropic API directly (matching working edge functions)
async function callAnthropic(messages: any[], maxTokens: number = 4000, model: string = 'claude-haiku-4-5-20251001') {
  // Check API key when actually making the call
  const apiKey = ANTHROPIC_API_KEY || Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY');

  if (!apiKey) {
    console.error('❌ No API key found - checked ANTHROPIC_API_KEY and CLAUDE_API_KEY');
    throw new Error('ANTHROPIC_API_KEY environment variable is missing');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Anthropic API error:', error);
    throw new Error(`Anthropic API failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data;
}

// Available MCP tools
const TOOLS = [
  {
    name: "create_organization_profile",
    description: "Create a comprehensive organization profile for intelligence monitoring",
    inputSchema: {
      type: "object",
      properties: {
        organization_name: {
          type: "string",
          description: "Name of the organization to profile"
        },
        industry_hint: {
          type: "string", 
          description: "Industry hint to help with source selection"
        },
        save_to_persistence: {
          type: "boolean",
          description: "Whether to save the profile to persistence (default: true)",
          default: true
        }
      },
      required: ["organization_name"]
    }
  },
  {
    name: "get_organization_profile",
    description: "Retrieve an existing organization profile from persistence",
    inputSchema: {
      type: "object",
      properties: {
        organization_name: {
          type: "string",
          description: "Name of the organization"
        }
      },
      required: ["organization_name"]
    }
  }
];

// Enhanced profile creation with intelligent gap filling
async function createOrganizationProfile(args: any) {
  const { organization_name, industry_hint, save_to_persistence = true } = args;

  console.log(`🔍 Creating SMART organization profile for: ${organization_name}`);
  console.log(`   Industry hint: ${industry_hint || 'Auto-detect'}`);

  // Debug: Check if API key is available
  const apiKeyCheck = ANTHROPIC_API_KEY || Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY');
  console.log(`   API Key available: ${apiKeyCheck ? 'Yes (length: ' + apiKeyCheck.length + ')' : 'No'}`);

  try {
    // STEP 1: Get available data from registries
    console.log('📚 Step 1: Gathering available data from registries...');
    
    // Get industry competitors from our registry
    const industryData = await gatherIndustryData(organization_name, industry_hint);
    
    // Get sources from master-source-registry
    const sourcesData = await gatherSourcesData(industryData.industry);
    
    // STEP 2: Use Claude to analyze gaps and create comprehensive profile
    console.log('🤖 Step 2: Using Claude to analyze gaps and enhance profile...');
    
    const enhancedProfile = await analyzeAndEnhanceProfile(
      organization_name,
      industryData,
      sourcesData,
      industry_hint
    );
    
    // STEP 3: Fill remaining gaps with web search if needed
    console.log('🌐 Step 3: Filling gaps with web search...');
    
    const completeProfile = await fillGapsWithWebSearch(enhancedProfile, organization_name);
    
    // STEP 4: Structure the final profile
    console.log('📋 Step 4: Structuring final profile...');
    
    const profile = structureFinalProfile(completeProfile, organization_name);
    
    // STEP 5: Save to persistence if requested
    if (save_to_persistence) {
      console.log('💾 Saving profile to persistence...');
      await saveProfile(profile);
    }

    // Log enhancement summary
    console.log(`✅ Profile creation complete for ${organization_name}`);
    console.log(`   - ${profile.competition?.direct_competitors?.length || 0} competitors identified`);
    console.log(`   - ${profile.monitoring_config?.search_queries?.competitor_queries?.length || 0} search queries generated`);
    console.log(`   - ${profile.sources?.source_priorities?.total_sources || 0} priority sources configured`);
    console.log(`   - ${Object.keys(profile.monitoring_config?.competitor_priorities || {}).length} competitor priorities set`);
    
    return {
      success: true,
      profile,
      content: JSON.stringify(profile, null, 2),
      enhancements: {
        search_queries: profile.monitoring_config?.search_queries?.competitor_queries?.length || 0,
        priority_sources: profile.sources?.source_priorities?.critical?.length || 0,
        content_patterns: Object.keys(profile.monitoring_config?.content_patterns || {}).length,
        competitor_focus: Object.keys(profile.monitoring_config?.competitor_priorities || {}).length
      }
    };

  } catch (error: any) {
    console.error('❌ Profile creation failed:', error);
    throw error;
  }
}

// Gather industry data from our registries
async function gatherIndustryData(organization_name: string, industry_hint?: string) {
  // First, try to detect the industry if not provided
  let industry = industry_hint;
  
  if (!industry) {
    // Use Claude to detect industry
    const detection = await callAnthropic([{
      role: 'user',
      content: `What industry is ${organization_name} in? Answer with just the industry name (e.g., "automotive", "technology", "healthcare").`
    }], 100, 'claude-haiku-4-5-20251001');
    
    industry = detection.content[0].type === 'text' ? detection.content[0].text.trim() : 'technology';
  }
  
  // Get competitors from our registry
  const subCategory = discoverSubCategory(organization_name, industry);
  const competitors = getIndustryCompetitors(industry, subCategory, 20); // Get more initially
  
  return {
    industry,
    subCategory,
    competitors,
    hasCompetitors: competitors.length > 0
  };
}

// Gather sources from master-source-registry with FULL DETAILS
async function gatherSourcesData(industry: string) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/master-source-registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ industry })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sources: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    // Handle the response structure from master-source-registry
    const sources = responseData.data || responseData;
    
    console.log('Master-source-registry response:', {
      hasData: !!responseData.data,
      totalSources: responseData.total_sources,
      categories: Object.keys(sources || {})
    });
    
    // Extract detailed source information including priorities
    const extractSourceDetails = (sourceList: any[]) => {
      if (!Array.isArray(sourceList)) return [];
      return sourceList.map(s => ({
        name: s.name,
        url: s.url,
        priority: s.priority || 'medium',
        type: s.type || 'rss',
        focus: s.focus || 'general'
      }));
    };
    
    // Create source priority map for monitoring stages
    const criticalSources = [];
    const highPrioritySources = [];
    
    // Aggregate all sources and identify critical ones
    Object.values(sources).forEach(category => {
      if (Array.isArray(category)) {
        category.forEach(source => {
          if (source.priority === 'critical') {
            criticalSources.push(source.name);
          } else if (source.priority === 'high') {
            highPrioritySources.push(source.name);
          }
        });
      }
    });
    
    return {
      competitive: extractSourceDetails(sources.competitive || []),
      media: extractSourceDetails(sources.media || []),
      regulatory: extractSourceDetails(sources.regulatory || []),
      market: extractSourceDetails(sources.market || []),
      forward: extractSourceDetails(sources.forward || []),
      specialized: extractSourceDetails(sources.specialized || []),
      
      // New: Source prioritization for monitoring
      source_priorities: {
        critical: criticalSources,
        high: highPrioritySources,
        total_sources: criticalSources.length + highPrioritySources.length
      },
      
      // New: Key journalists/outlets to track
      key_outlets: {
        must_monitor: criticalSources.slice(0, 10),
        should_monitor: highPrioritySources.slice(0, 10)
      },
      
      hasSources: Object.values(sources).some(s => Array.isArray(s) && s.length > 0)
    };
  } catch (error) {
    console.error('Failed to get sources:', error);
    return {
      competitive: [],
      media: [],
      regulatory: [],
      market: [],
      forward: [],
      specialized: [],
      source_priorities: { critical: [], high: [], total_sources: 0 },
      key_outlets: { must_monitor: [], should_monitor: [] },
      hasSources: false
    };
  }
}

// Use Claude to analyze what we have and what we need
async function analyzeAndEnhanceProfile(
  organization_name: string,
  industryData: any,
  sourcesData: any,
  industry_hint?: string
) {
  const analysisPrompt = `
You are creating a COMPREHENSIVE intelligence monitoring profile for ${organization_name}.

WHAT WE ALREADY HAVE:
- Industry: ${industryData.industry} ${industryData.subCategory ? `(${industryData.subCategory})` : ''}
- Competitors from registry: ${industryData.competitors.slice(0, 10).join(', ')}
- Sources available: 
  - Competitive sources: ${sourcesData.competitive.length}
  - Media sources: ${sourcesData.media.length}
  - Regulatory sources: ${sourcesData.regulatory.length}
  - Market sources: ${sourcesData.market.length}

YOUR TASK:
1. Identify what's MISSING for comprehensive intelligence monitoring
2. Fill gaps with specific names and entities
3. Focus on ACTIONABLE intelligence needs

Provide a COMPREHENSIVE profile with:

{
  "industry": "Primary industry classification",
  "sub_industry": "Specific sub-industry or niche",
  "description": "2-3 sentences about the organization and its market position",
  
  "competition": {
    "direct_competitors": ["List 10-15 SPECIFIC company names that directly compete"],
    "indirect_competitors": ["5-10 companies that could become competitors"],
    "emerging_threats": ["3-5 startups or new entrants to watch"],
    "competitive_dynamics": "Key competitive factors in this market"
  },
  
  "stakeholders": {
    "regulators": ["SPECIFIC regulatory bodies (e.g., SEC, FDA, EPA)"],
    "major_customers": ["Key customer segments or specific major customers"],
    "major_investors": ["Institutional investors, VCs, or major shareholders"],
    "partners": ["Key suppliers, distributors, or strategic partners"],
    "critics": ["Activist groups, analysts, or vocal critics"],
    "influencers": ["Industry analysts, thought leaders, journalists"]
  },
  
  "market": {
    "market_size": "Current market size and growth rate",
    "key_metrics": ["3-5 metrics that matter in this industry"],
    "market_drivers": ["What drives growth in this market"],
    "market_barriers": ["What limits growth"],
    "geographic_focus": ["Key geographic markets"]
  },
  
  "trending": {
    "hot_topics": ["5-7 current hot topics in the industry"],
    "emerging_technologies": ["Technologies disrupting the industry"],
    "regulatory_changes": ["Upcoming or recent regulatory changes"],
    "market_shifts": ["Recent changes in market dynamics"],
    "social_issues": ["ESG or social topics affecting the industry"]
  },
  
  "forward_looking": {
    "technology_disruptions": ["Technologies that could disrupt"],
    "regulatory_horizon": ["Upcoming regulations to monitor"],
    "market_evolution": ["How the market might evolve"],
    "emerging_risks": ["Future risks to monitor"],
    "opportunity_areas": ["Growth opportunities"]
  },
  
  "monitoring_config": {
    "keywords": ["15-20 specific keywords to monitor"],
    "crisis_indicators": ["Warning signs of problems"],
    "opportunity_indicators": ["Signs of opportunities"],
    "categories": ["Key news categories to track"],
    "priority_entities": ["Most important entities to track closely"],
    
    "search_queries": {
      "competitor_queries": ["Specific search queries for each competitor"],
      "regulatory_queries": ["Queries for regulatory monitoring"],
      "crisis_queries": ["Queries to detect crises early"],
      "opportunity_queries": ["Queries to find opportunities"]
    },
    
    "content_patterns": {
      "high_value_patterns": ["Patterns that indicate important news"],
      "noise_patterns": ["Patterns to filter out"],
      "crisis_patterns": ["Patterns indicating problems"],
      "opportunity_patterns": ["Patterns indicating opportunities"]
    },
    
    "competitor_priorities": {
      "For each competitor": ["What specific aspects to monitor"]
    }
  }
}

${industry_hint ? `Industry context: ${industry_hint}` : ''}
${industryData.competitors.length > 0 ? `Known competitors: ${industryData.competitors.join(', ')}` : ''}

BE SPECIFIC with names. Real companies, real regulators, real people. This is for actual intelligence monitoring.
`;

  const message = await callAnthropic([{
    role: 'user',
    content: analysisPrompt
  }], 4000, 'claude-haiku-4-5-20251001');

  const claudeResponse = message.content[0];
  if (claudeResponse.type !== 'text') {
    throw new Error('Invalid Claude response');
  }

  console.log('Claude response:', claudeResponse.text.substring(0, 500));

  const jsonMatch = claudeResponse.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Full Claude response:', claudeResponse.text);
    throw new Error('No valid JSON in Claude response');
  }

  const enhancedData = JSON.parse(jsonMatch[0]);
  
  // Generate optimized search queries for each competitor
  const generateSearchQueries = (competitors: string[]) => {
    const queries = {
      competitor_queries: [],
      regulatory_queries: [],
      crisis_queries: [],
      opportunity_queries: []
    };
    
    // Generate competitor-specific queries
    competitors.slice(0, 10).forEach(comp => {
      queries.competitor_queries.push(
        `${comp} announcement`,
        `${comp} ${enhancedData.industry}`,
        `${comp} vs ${organization_name}`
      );
    });
    
    // Add regulatory queries based on industry
    if (enhancedData.stakeholders?.regulators) {
      enhancedData.stakeholders.regulators.slice(0, 5).forEach(reg => {
        queries.regulatory_queries.push(`${reg} ${organization_name}`, `${reg} ${enhancedData.industry}`);
      });
    }
    
    // Crisis detection queries
    queries.crisis_queries = [
      `${organization_name} recall`,
      `${organization_name} lawsuit`,
      `${organization_name} investigation`,
      `${enhancedData.industry} crisis`
    ];
    
    // Opportunity queries
    queries.opportunity_queries = [
      `${organization_name} partnership`,
      `${organization_name} expansion`,
      `${enhancedData.industry} growth`,
      `${enhancedData.industry} investment`
    ];
    
    return queries;
  };
  
  // Generate content patterns for the industry
  const generateContentPatterns = () => ({
    high_value_patterns: [
      `${organization_name} announces`,
      'breaking:', 'exclusive:', 'first:', 'major',
      ...enhancedData.competition.direct_competitors.slice(0, 5).map(c => c.toLowerCase())
    ],
    noise_patterns: [
      'sponsored content', 'advertisement', 'promoted',
      'stock tip', 'buy now', 'limited time'
    ],
    crisis_patterns: [
      'recall', 'lawsuit', 'investigation', 'violation',
      'fine', 'penalty', 'scandal', 'breach'
    ],
    opportunity_patterns: [
      'partnership', 'acquisition', 'expansion', 'contract',
      'award', 'breakthrough', 'innovation', 'first'
    ]
  });
  
  // Generate competitor-specific monitoring priorities
  const generateCompetitorPriorities = () => {
    const priorities = {};
    enhancedData.competition.direct_competitors.slice(0, 10).forEach(comp => {
      priorities[comp] = [
        `${comp} product launches`,
        `${comp} executive changes`,
        `${comp} financial performance`,
        `${comp} strategic moves`
      ];
    });
    return priorities;
  };

  // Generate intelligence context for downstream stages
  const generateIntelligenceContext = () => {
    const topCompetitors = enhancedData.competition.direct_competitors.slice(0, 5);
    const topRegulators = enhancedData.stakeholders?.regulators?.slice(0, 3) || [];
    const topTopics = enhancedData.trending?.hot_topics?.slice(0, 5) || [];
    const keyStakeholders = [
      ...(enhancedData.stakeholders?.major_investors?.slice(0, 2) || []),
      ...(enhancedData.stakeholders?.influencers?.slice(0, 2) || [])
    ].filter(Boolean);

    return {
      monitoring_prompt: `We are monitoring ${organization_name}, a ${enhancedData.industry} company${enhancedData.sub_industry ? ` specializing in ${enhancedData.sub_industry}` : ''}. Focus on:
        - Direct competitive movements from: ${topCompetitors.join(', ')}
        - Regulatory developments from: ${topRegulators.join(', ')}
        - Market dynamics around: ${topTopics.join(', ')}
        - Key stakeholder actions from: ${keyStakeholders.join(', ')}

        We're looking for:
        - Product launches and strategic announcements
        - Leadership changes and organizational shifts
        - Financial performance and market positioning
        - Regulatory actions and compliance issues
        - Crisis events requiring immediate response
        - Partnership and M&A activity
        - Technology innovations and disruptions

        ${enhancedData.description || ''}`,

      relevance_criteria: {
        must_include: [
          'organization mentions',
          'direct competitor actions',
          'regulatory changes'
        ],
        should_include: [
          'market trends',
          'stakeholder movements',
          'technology updates',
          'financial indicators'
        ],
        scoring_weights: {
          organization_mention: 40,
          competitor_action: 30,
          regulatory_news: 25,
          market_signal: 15,
          stakeholder_mention: 10,
          technology_update: 10
        }
      },

      topics: [
        ...(enhancedData.trending?.hot_topics || []),
        ...(enhancedData.monitoring_config?.keywords || []),
        ...(enhancedData.trending?.emerging_technologies || [])
      ].filter(Boolean),

      extraction_focus: [
        'executive quotes and statements',
        'financial metrics and percentages',
        'product names and launches',
        'partnership announcements',
        'regulatory decisions',
        'market share data',
        'technology specifications',
        'crisis indicators',
        'strategic moves'
      ],

      synthesis_guidance: {
        key_questions: [
          `What moves are ${topCompetitors.slice(0, 3).join(', ')} making?`,
          `How is ${organization_name} positioned relative to competitors?`,
          `What regulatory changes affect the ${enhancedData.industry} industry?`,
          `What market opportunities are emerging?`,
          `What risks or threats are developing?`
        ],
        analysis_perspective: `Analyze from the perspective of ${organization_name}'s executive team making strategic decisions`,
        output_focus: 'Actionable intelligence for immediate strategic response'
      }
    };
  };
  
  // Merge with existing data and add enhanced monitoring config
  return {
    ...enhancedData,
    competition: {
      ...enhancedData.competition,
      // Prioritize our registry competitors but add Claude's additions
      direct_competitors: [...new Set([
        ...industryData.competitors.slice(0, 10),
        ...(enhancedData.competition.direct_competitors || [])
      ])].slice(0, 15)
    },

    // Enhanced monitoring configuration
    monitoring_config: {
      ...enhancedData.monitoring_config,
      search_queries: generateSearchQueries(enhancedData.competition.direct_competitors || []),
      content_patterns: generateContentPatterns(),
      competitor_priorities: generateCompetitorPriorities(),
      source_priorities: sourcesData.source_priorities,
      key_outlets: sourcesData.key_outlets
    },

    // Include full source data with priorities
    sources: sourcesData,

    // NEW: Add intelligence context for downstream stages
    intelligence_context: generateIntelligenceContext(),

    // Add intelligence guidance for next stages
    intelligence_guidance: {
      focus_areas: `Monitor ${sourcesData.source_priorities.critical.slice(0, 5).join(', ')} as critical sources`,
      coverage_expectations: `Expect strong coverage from ${sourcesData.source_priorities.total_sources} priority sources`,
      monitoring_strategy: 'Use search queries and content patterns to filter signal from noise'
    }
  };
}

// Fill any remaining gaps with web search
async function fillGapsWithWebSearch(profile: any, organization_name: string) {
  // Only search if we have few competitors
  if (profile.competition.direct_competitors.length < 5) {
    console.log('   🔍 Searching web for additional competitors...');
    
    const webCompetitors = await searchWebForCompetitors(organization_name);
    const yahooCompetitors = await fetchYahooFinanceCompetitors(organization_name);
    
    const allCompetitors = [...new Set([
      ...profile.competition.direct_competitors,
      ...webCompetitors,
      ...yahooCompetitors
    ])];
    
    profile.competition.direct_competitors = allCompetitors.slice(0, 15);
  }
  
  return profile;
}

// Structure the final profile for use by monitoring stages
function structureFinalProfile(profileData: any, organization_name: string) {
  const sources = profileData.sources || {};

  // Aggregate all topics for easy access
  const allTopics = [
    ...(profileData.trending?.hot_topics || []),
    ...(profileData.monitoring_config?.keywords || []),
    ...(profileData.trending?.emerging_technologies || []),
    ...(profileData.intelligence_context?.topics || [])
  ].filter(Boolean);
  const uniqueTopics = [...new Set(allTopics)];

  return {
    organization_name,
    organization: organization_name,
    industry: profileData.industry,
    sub_industry: profileData.sub_industry,
    description: profileData.description,

    // NEW: Top-level topics field for easy access
    topics: uniqueTopics,
    
    // Competition tab
    competition: {
      ...profileData.competition,
      sources: sources.competitive || [],
      monitoring_queries: [
        `${organization_name} vs competitor`,
        ...profileData.competition.direct_competitors.slice(0, 5).map(c => `${c} announcement`),
        `${profileData.industry} market share`,
        `${profileData.industry} competition`
      ]
    },
    
    // Stakeholders tab
    stakeholders: {
      ...profileData.stakeholders,
      sources: [...(sources.media || []), ...(sources.regulatory || [])],
      monitoring_queries: [
        `${organization_name} regulation`,
        `${organization_name} lawsuit`,
        `${organization_name} investor`,
        ...profileData.stakeholders.regulators.map(r => `${r} ${profileData.industry}`)
      ]
    },
    
    // Market tab
    market: {
      ...profileData.market,
      sources: sources.market || [],
      monitoring_queries: [
        `${profileData.industry} market size`,
        `${profileData.industry} growth`,
        `${profileData.industry} trends`,
        `${profileData.industry} forecast`
      ]
    },
    
    // Trending tab
    trending: {
      ...profileData.trending,
      sources: sources.specialized || [],
      monitoring_queries: profileData.trending.hot_topics.map(topic => 
        `${topic} ${profileData.industry}`
      )
    },
    
    // Forward looking tab
    forward_looking: {
      ...profileData.forward_looking,
      sources: sources.forward || [],
      monitoring_queries: [
        `${profileData.industry} future`,
        `${profileData.industry} 2025 predictions`,
        `${profileData.industry} disruption`,
        `${profileData.industry} innovation`
      ]
    },
    
    // Monitoring configuration
    monitoring_config: {
      ...profileData.monitoring_config,
      all_sources: Object.values(sources).flat(),
      sources_by_category: sources,
      rss_feeds: Object.values(sources).flat()
        .filter((s: any) => s.type === 'rss')
        .map((s: any) => s.url),
      total_sources: Object.values(sources).flat().length
    },

    // Pass through intelligence context for downstream stages
    intelligence_context: profileData.intelligence_context,
    intelligence_guidance: profileData.intelligence_guidance,

    metadata: {
      created_at: new Date().toISOString(),
      created_by: 'mcp-discovery-enhanced',
      version: 'smart-v2-with-context',
      has_competitors: profileData.competition.direct_competitors.length > 0,
      has_sources: Object.values(sources).some(s => Array.isArray(s) && s.length > 0),
      has_intelligence_context: !!profileData.intelligence_context
    }
  };
}

// Save profile to database
async function saveProfile(profile: any) {
  try {
    // Try with 'profile_data' column instead of 'profile'
    const { data, error } = await supabase
      .from('organization_profiles')
      .upsert({
        organization_name: profile.organization_name,
        profile_data: profile,  // Changed from 'profile' to 'profile_data'
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_name'
      });
      
    if (error) {
      console.error('Failed to save profile with profile_data column:', error);
      
      // If that fails, try with 'data' column
      const { data: data2, error: error2 } = await supabase
        .from('organization_profiles')
        .upsert({
          organization_name: profile.organization_name,
          data: profile,  // Try 'data' column
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'organization_name'
        });
        
      if (error2) {
        console.error('Failed to save profile with data column:', error2);
        console.log('⚠️ Profile save disabled - continuing without persistence');
      }
    }
  } catch (e) {
    console.error('Error saving profile:', e);
    console.log('⚠️ Continuing without saving profile to database');
  }
}

// Retrieve existing profile
async function getOrganizationProfile(args: any) {
  const { organization_name } = args;
  
  console.log(`📖 Retrieving profile for: ${organization_name}`);
  
  // Try to get profile with different possible column names
  const { data, error } = await supabase
    .from('organization_profiles')
    .select('*')  // Select all columns to see what exists
    .eq('organization_name', organization_name)
    .single();
    
  if (error || !data) {
    throw new Error(`No profile found for ${organization_name}`);
  }
  
  // Try different column names in order of likelihood
  const profileData = data.profile_data || data.data || data.profile;
  
  return {
    success: true,
    profile: profileData,
    content: JSON.stringify(profileData, null, 2)
  };
}

// Generate monitoring keywords
function generateKeywords(organization_name: string, analysisData: any): string[] {
  const keywords = [
    organization_name,
    ...analysisData.monitoring_config?.keywords || [],
    ...analysisData.competition?.direct_competitors?.slice(0, 5) || [],
    ...analysisData.trending?.hot_topics?.slice(0, 5) || []
  ];
  
  return [...new Set(keywords)];
}

// Handle HTTP requests
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    
    // Handle simple organization request (for pipeline integration)
    if (requestData.organization && !requestData.tool && !requestData.method) {
      const result = await createOrganizationProfile({ organization_name: requestData.organization });
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Handle direct tool calls
    if (requestData.tool === 'create_organization_profile') {
      const result = await createOrganizationProfile(requestData.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (requestData.tool === 'get_organization_profile') {
      const result = await getOrganizationProfile(requestData.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // MCP protocol handling
    if (requestData.method === 'tools/list') {
      return new Response(JSON.stringify({ tools: TOOLS }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (requestData.method === 'tools/call') {
      const { name, arguments: args } = requestData.params;
      
      let result;
      if (name === 'create_organization_profile') {
        result = await createOrganizationProfile(args);
      } else if (name === 'get_organization_profile') {
        result = await getOrganizationProfile(args);
      } else {
        throw new Error(`Unknown tool: ${name}`);
      }
      
      return new Response(JSON.stringify({
        content: [{
          type: "text",
          text: result.content
        }]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    throw new Error(`Unknown request type`);
    
  } catch (error: any) {
    console.error('MCP Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});