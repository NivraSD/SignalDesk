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
async function callAnthropic(messages: any[], maxTokens: number = 4000, model: string = 'claude-sonnet-4-20250514') {
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

/**
 * Format sources for Claude with full context
 * Shows: name, priority, and includes search query examples
 */
function formatSourcesForClaude(
  sources: any[],
  searchQueries: string[] = [],
  limit: number = 15
): string {
  if (!sources || sources.length === 0) {
    return '  (No sources in this category)';
  }

  const sourcesList = sources.slice(0, limit).map(s =>
    `  • ${s.name} [${s.priority}] - ${s.type.toUpperCase()} feed`
  ).join('\n');

  let result = sourcesList;

  // Add typical search queries if available
  if (searchQueries && searchQueries.length > 0) {
    result += `\n  Typical coverage: ${searchQueries.slice(0, 3).join(', ')}`;
  }

  return result;
}

/**
 * Extract category metadata (search queries, journalists, etc.)
 */
function extractCategoryMetadata(categoryData: any): any {
  return {
    searchQueries: categoryData.search_queries || [],
    trackUrls: categoryData.track_urls || [],
    keyJournalists: categoryData.key_journalists || [],
    podcasts: categoryData.podcasts || [],
    agencies: categoryData.agencies || [],
    complianceAreas: categoryData.compliance_areas || []
  };
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
        website: {
          type: "string",
          description: "Organization website URL for context and disambiguation"
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
  const { organization_name, industry_hint, website, save_to_persistence = true } = args;

  console.log(`🔍 Creating SMART organization profile for: ${organization_name}`);
  console.log(`   Industry hint: ${industry_hint || 'Auto-detect'}`);
  console.log(`   Website: ${website || 'Not provided'}`);

  // Debug: Check if API key is available
  const apiKeyCheck = ANTHROPIC_API_KEY || Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY');
  console.log(`   API Key available: ${apiKeyCheck ? 'Yes (length: ' + apiKeyCheck.length + ')' : 'No'}`);

  try {
    // STEP 0: Check for user-defined intelligence targets
    console.log('📋 Step 0: Checking for user-defined targets...');
    const userTargets = await fetchUserDefinedTargets(organization_name);

    // STEP 1: Get available data from registries
    console.log('📚 Step 1: Gathering available data from registries...');

    // Get industry competitors from our registry (merged with user targets)
    const industryData = await gatherIndustryData(organization_name, industry_hint, website, userTargets);

    // Build initial description from website for semantic source matching
    const websiteInfo = website ? await fetchWebsiteInfo(website) : null;
    const initialDescription = websiteInfo
      ? `${websiteInfo.title || organization_name}. ${websiteInfo.description || ''}`.substring(0, 500)
      : `${organization_name} operates in ${industryData.industry}`;

    console.log(`📝 Using description for source matching: ${initialDescription.substring(0, 150)}...`);

    // Get sources from master-source-registry with semantic matching
    const sourcesData = await gatherSourcesData(industryData.industry, organization_name, initialDescription);
    
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
    console.log(`   - ${profile.monitoring_config?.source_priorities?.total_sources || 0} priority sources configured`);
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

// Fetch website content to help identify the company
async function fetchWebsiteInfo(website: string) {
  if (!website) {
    return null;
  }

  try {
    console.log(`🌐 Fetching website info from: ${website}`);

    const response = await fetch(website, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SignalDesk/1.0; +https://signaldesk.com)'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      console.warn(`Failed to fetch website: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Extract key information using regex
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);

    // Extract first paragraph or h1 content
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const firstPMatch = html.match(/<p[^>]*>([^<]{50,500})<\/p>/i);

    const info = {
      title: titleMatch ? titleMatch[1].trim() : '',
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      keywords: keywordsMatch ? keywordsMatch[1].trim() : '',
      h1: h1Match ? h1Match[1].trim() : '',
      firstParagraph: firstPMatch ? firstPMatch[1].replace(/<[^>]+>/g, '').trim() : ''
    };

    console.log(`✅ Extracted website info:`, {
      title: info.title.substring(0, 100),
      description: info.description.substring(0, 100)
    });

    return info;
  } catch (error) {
    console.error('Failed to fetch website:', error);
    return null;
  }
}

// Fetch user-defined intelligence targets from database
async function fetchUserDefinedTargets(organization_name: string) {
  try {
    console.log(`📋 Checking for user-defined intelligence targets...`);

    const { data, error } = await supabase
      .from('intelligence_targets')
      .select('*')
      .eq('organization_name', organization_name)
      .eq('active', true);

    if (error) {
      console.log(`   ⚠️ Error fetching targets: ${error.message}`);
      return null;
    }

    if (!data || data.length === 0) {
      console.log(`   No existing targets found - will use full discovery`);
      return null;
    }

    // Organize targets by type
    const competitors = data.filter(t => t.type === 'competitor').map(t => t.name);
    const topics = data.filter(t => t.type === 'topic').map(t => t.name);
    const stakeholders = data.filter(t => t.type === 'stakeholder').map(t => t.name);
    const influencers = data.filter(t => t.type === 'influencer').map(t => t.name);

    console.log(`   ✅ Found user-defined targets:`);
    console.log(`      - Competitors: ${competitors.length}`);
    console.log(`      - Topics: ${topics.length}`);
    console.log(`      - Stakeholders: ${stakeholders.length}`);
    console.log(`      - Influencers: ${influencers.length}`);

    return {
      competitors,
      topics,
      stakeholders,
      influencers,
      total: data.length
    };
  } catch (error) {
    console.error(`   ❌ Failed to fetch targets:`, error);
    return null;
  }
}

// Gather industry data from our registries
async function gatherIndustryData(organization_name: string, industry_hint?: string, website?: string, userTargets?: any) {
  // First, try to detect the industry if not provided
  let industry = industry_hint;
  
  if (!industry) {
    // Fetch website info to help with detection
    const websiteInfo = website ? await fetchWebsiteInfo(website) : null;

    // Build context for Claude
    let detectionPrompt = `What industry is ${organization_name} in?`;

    if (websiteInfo) {
      detectionPrompt += `\n\nContext from their website (${website}):`;
      if (websiteInfo.title) detectionPrompt += `\n- Page title: ${websiteInfo.title}`;
      if (websiteInfo.description) detectionPrompt += `\n- Description: ${websiteInfo.description}`;
      if (websiteInfo.h1) detectionPrompt += `\n- Main heading: ${websiteInfo.h1}`;
      if (websiteInfo.firstParagraph) detectionPrompt += `\n- About: ${websiteInfo.firstParagraph}`;
      if (websiteInfo.keywords) detectionPrompt += `\n- Keywords: ${websiteInfo.keywords}`;
    }

    detectionPrompt += `\n\nIMPORTANT DISTINCTIONS:
- "Strategic communications firm" = public relations/PR industry (NOT telecommunications)
- "Communications services" in business context = PR/marketing/corporate communications
- "Telecommunications" = phone/internet carriers like AT&T, Verizon (infrastructure)
- "Marketing agency" = marketing/advertising industry
- "Consulting firm" = professional services/consulting
- "General trading company" or "Sogo Shosha" = trading industry

RESPOND WITH ONLY ONE OR TWO WORDS FROM THIS LIST (NO EXPLANATIONS):
- public-relations
- marketing
- telecommunications
- technology
- consulting
- finance
- healthcare
- retail
- automotive
- trading
- manufacturing
- energy
- transportation
- real-estate
- media

RESPOND WITH ONLY THE INDUSTRY NAME:`;

    console.log('🔍 Industry detection prompt:', detectionPrompt.substring(0, 300));

    // Use Claude Haiku for industry detection (follows instructions better, faster, cheaper)
    const detection = await callAnthropic([{
      role: 'user',
      content: detectionPrompt
    }], 10, 'claude-3-5-haiku-20241022');

    industry = detection.content[0].type === 'text' ? detection.content[0].text.trim() : 'technology';
    console.log(`✅ Detected industry: ${industry}`);
  }
  
  // Get competitors from our registry
  const subCategory = discoverSubCategory(organization_name, industry);
  const discoveredCompetitors = getIndustryCompetitors(industry, subCategory, 20); // Get more initially

  // Merge user-defined targets with discovered ones
  let finalCompetitors = [];
  let finalTopics = [];
  let finalStakeholders = [];

  if (userTargets) {
    // PRIORITIZE user targets - put them first
    finalCompetitors = [...new Set([...userTargets.competitors, ...discoveredCompetitors])];
    finalTopics = userTargets.topics || [];
    finalStakeholders = userTargets.stakeholders || [];

    console.log(`✅ Merged targets:`);
    console.log(`   - User competitors: ${userTargets.competitors.length}`);
    console.log(`   - Discovered competitors: ${discoveredCompetitors.length}`);
    console.log(`   - Total unique competitors: ${finalCompetitors.length}`);
  } else {
    // No user targets - use only discovered ones
    finalCompetitors = discoveredCompetitors;
  }

  return {
    industry,
    subCategory,
    competitors: finalCompetitors,
    topics: finalTopics,
    stakeholders: finalStakeholders,
    hasCompetitors: finalCompetitors.length > 0,
    userDefined: !!userTargets
  };
}

// Gather sources from master-source-registry with FULL DETAILS
async function gatherSourcesData(industry: string, organizationName?: string, companyDescription?: string) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/master-source-registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        industry,
        organization_name: organizationName,
        company_description: companyDescription
      })
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

    // Extract metadata for each category
    const competitiveMetadata = extractCategoryMetadata(sources.competitive || {});
    const mediaMetadata = extractCategoryMetadata(sources.media || {});
    const regulatoryMetadata = extractCategoryMetadata(sources.regulatory || {});
    const marketMetadata = extractCategoryMetadata(sources.market || {});

    return {
      competitive: extractSourceDetails(sources.competitive?.rss || []),
      media: extractSourceDetails(sources.media?.rss || []),
      regulatory: extractSourceDetails(sources.regulatory?.rss || []),
      market: extractSourceDetails(sources.market?.rss || []),
      forward: extractSourceDetails(sources.forward?.rss || []),
      specialized: extractSourceDetails(sources.specialized?.rss || []),

      // NEW: Include category metadata
      competitiveMetadata,
      mediaMetadata,
      regulatoryMetadata,
      marketMetadata,

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
      competitiveMetadata: { searchQueries: [], trackUrls: [], keyJournalists: [], podcasts: [], agencies: [], complianceAreas: [] },
      mediaMetadata: { searchQueries: [], trackUrls: [], keyJournalists: [], podcasts: [], agencies: [], complianceAreas: [] },
      regulatoryMetadata: { searchQueries: [], trackUrls: [], keyJournalists: [], podcasts: [], agencies: [], complianceAreas: [] },
      marketMetadata: { searchQueries: [], trackUrls: [], keyJournalists: [], podcasts: [], agencies: [], complianceAreas: [] },
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
You are creating a strategic intelligence profile for ${organization_name}.

🎯 YOUR MISSION: Identify what external factors could significantly impact THIS organization

Your goal is to create a profile of:
- Key competitors whose moves could affect ${organization_name}'s business, reputation, or strategic positioning
- Stakeholders (regulators, investors, partners) whose actions could materially impact operations
- Market dynamics and emerging threats that could change the competitive landscape
- Strategic opportunities and risks on the horizon

This is NOT about generic news monitoring. Every target you identify must answer:
"Why does ${organization_name} specifically need to know about this?"

CONTEXT:
- Organization: ${organization_name}
- Industry: ${industryData.industry} ${industryData.subCategory ? `(${industryData.subCategory})` : ''}
- Known Competitors: ${industryData.competitors.slice(0, 10).join(', ')}

⚠️ CRITICAL RULES FOR STAKEHOLDERS:
- Only include stakeholders whose activity DIRECTLY impacts ${organization_name}'s industry or operations
- Provide clear monitoring_context explaining WHY this matters to THIS specific organization
- Include relevance_filter to prevent noise from unrelated activity
- Example: For a PR firm, monitor "SEC communications regulations" NOT "SEC general enforcement"
- Example: For a trading company, monitor "commodity regulators" NOT "securities enforcement"

═══════════════════════════════════════════════════════════
🔍 AVAILABLE INTELLIGENCE SOURCES (Your Monitoring Tools)
═══════════════════════════════════════════════════════════

These are the ACTUAL RSS feeds, publications, and sources you have access to.
Your keywords and monitoring strategies MUST be optimized for these specific sources.

📰 COMPETITIVE INTELLIGENCE SOURCES (${sourcesData.competitive.length} feeds):
${formatSourcesForClaude(sourcesData.competitive, sourcesData.competitiveMetadata?.searchQueries, 20)}

📺 MEDIA SOURCES (${sourcesData.media.length} feeds):
${formatSourcesForClaude(sourcesData.media, sourcesData.mediaMetadata?.searchQueries, 20)}

⚖️ REGULATORY SOURCES (${sourcesData.regulatory.length} feeds):
${formatSourcesForClaude(sourcesData.regulatory, sourcesData.regulatoryMetadata?.searchQueries, 10)}

📊 MARKET ANALYSIS SOURCES (${sourcesData.market.length} feeds):
${formatSourcesForClaude(sourcesData.market, sourcesData.marketMetadata?.searchQueries, 10)}

🎯 CRITICAL PRIORITY SOURCES (Monitor these first):
${sourcesData.source_priorities.critical.slice(0, 15).join(', ')}

${sourcesData.competitiveMetadata?.keyJournalists?.length > 0 ? `
👤 KEY JOURNALISTS TO TRACK:
${sourcesData.competitiveMetadata.keyJournalists.slice(0, 10).join(', ')}
` : ''}

${sourcesData.regulatoryMetadata?.agencies?.length > 0 ? `
🏛️ REGULATORY AGENCIES:
${sourcesData.regulatoryMetadata.agencies.join(', ')}
` : ''}

═══════════════════════════════════════════════════════════
📋 YOUR MISSION
═══════════════════════════════════════════════════════════

Generate a monitoring profile with keywords that will ACTUALLY MATCH articles from these specific sources.

CRITICAL INSTRUCTIONS:

1. STUDY THE SOURCES ABOVE
   - Look at what each publication covers
   - Note the search queries that work for each category
   - Understand priority levels (critical = check first)

2. OPTIMIZE FOR SOURCE VOCABULARY
   Examples based on actual sources:

   ✅ For TechCrunch (covers: startup funding, product launches):
      Keywords: "${organization_name} raises", "${organization_name} Series",
                "${organization_name} launches", "${organization_name} unveils"

   ✅ For The Verge (covers: consumer tech, product reviews):
      Keywords: "${organization_name} review", "${organization_name} hands-on",
                "${organization_name} first look", "${organization_name} features"

   ✅ For Bloomberg/Reuters (covers: financial news, corporate):
      Keywords: "${organization_name} earnings", "${organization_name} revenue",
                "${organization_name} quarterly", "${organization_name} CEO"

   ❌ BAD (generic, won't match):
      Keywords: "company news", "business update", "market information"

3. CREATE SOURCE-SPECIFIC MONITORING
   - Critical sources get more keyword variations
   - Match the language each publication uses
   - Consider what makes headlines in each outlet

4. USE CATEGORY SEARCH PATTERNS
   The "Typical coverage" examples show what language these sources use.
   Mirror that language in your keywords.

═══════════════════════════════════════════════════════════

NOW, provide your COMPREHENSIVE profile in this JSON format:

{
  "industry": "Primary industry classification",
  "sub_industry": "Specific sub-industry or niche",
  "description": "2-3 sentences about the organization and its market position",

  "strategic_context": {
    "target_customers": "Who does this organization primarily serve? Examples: 'Enterprise B2B clients', 'Marketing teams at Fortune 500 companies', 'Consumer retail customers', 'Government agencies'",
    "brand_personality": "What's the brand tone/personality? Examples: 'Data-driven and analytical', 'Creative and innovative', 'Professional and traditional', 'Disruptive and bold', 'Practical and results-focused'",
    "strategic_priorities": ["2-3 current strategic focus areas based on recent company communications, product launches, or market positioning - e.g., 'AI-powered analytics', 'Global expansion', 'Sustainability initiatives'"]
  },

  "competition": {
    "direct_competitors": [
      "Competitor 1 Name",
      "Competitor 2 Name",
      "Competitor 3 Name",
      "List 10-15 major competitors - just company names as strings"
    ],
    "indirect_competitors": ["5-10 companies that could become competitors"],
    "emerging_threats": ["3-5 startups or new entrants to watch"],
    "competitive_dynamics": "2-3 sentences on key competitive factors in this market"
  },

  "stakeholders": {
    "regulators": ["3-5 regulatory body names that directly govern this industry - e.g., 'CFTC', 'SEC', 'FERC'"],
    "key_analysts": ["OPTIONAL: 2-3 specific analysts/journalists/thought leaders who significantly influence this org's industry - only include if there are prominent voices that matter. Format: 'Name - Affiliation'"],
    "activists": ["OPTIONAL: 1-2 activist groups or prominent critics if relevant to this org"],
    "major_customers": [],
    "major_investors": [],
    "key_partners": []
  },

  "monitoring_guidance": {
    "competitors": {
      "what_to_track": ["major deals and acquisitions", "strategic partnerships", "product launches", "market share shifts", "executive changes", "earnings and financial performance"],
      "why": "Competitive intelligence reveals market dynamics, strategic threats, and opportunities for ${organization_name} to differentiate or respond",
      "special_focus": {
        "Top Competitor Name": "Optional: specific aspect to watch for this competitor if relevant"
      }
    },
    "regulators": {
      "what_to_track": ["new regulations and policy changes", "enforcement actions in our sector", "compliance requirement updates", "public consultations and proposed rules"],
      "why": "Regulatory changes directly impact ${organization_name}'s operations, compliance costs, strategic options, and market access",
      "special_focus": {
        "Regulator Name": "Optional: specific regulatory area most relevant to ${organization_name}"
      }
    },
    "analysts": {
      "what_to_track": ["industry reports and forecasts", "public commentary on market trends", "coverage of key players and market dynamics"],
      "why": "Analyst perspectives shape investor sentiment, client decisions, and market narrative around ${organization_name}'s industry"
    }
  },
  
  "service_lines": [
    "Key service offering 1 (e.g., 'Crisis Communications', 'Cloud Infrastructure', 'Investment Banking')",
    "Key service offering 2",
    "Key service offering 3",
    "3-5 core services/products that define what the organization does"
  ],

  "market": {
    "market_size": "Current market size and growth rate",
    "key_metrics": ["3-5 metrics that matter in this industry"],
    "market_drivers": ["What drives growth in this market"],
    "market_barriers": ["What limits growth"],
    "geographic_focus": ["Key geographic markets"]
  },

  "forward_looking": {
    "technology_disruptions": ["Technologies that could disrupt"],
    "regulatory_horizon": ["Upcoming regulations to monitor"],
    "market_evolution": ["How the market might evolve"],
    "emerging_risks": ["Future risks to monitor"],
    "opportunity_areas": ["Growth opportunities"]
  },
  
  "monitoring_config": {
    "keywords": [
      "20-30 SPECIFIC keywords optimized for the sources above",
      "Use action verbs that match source headlines: 'launches', 'raises', 'unveils', 'announces'",
      "Include product-specific terms for consumer tech sources",
      "Include financial terms for business sources",
      "Include regulatory terms for compliance sources"
    ],

    "source_optimized_keywords": {
      "TechCrunch_style": ["List keywords that match TechCrunch headlines"],
      "Bloomberg_style": ["List keywords that match Bloomberg headlines"],
      "The_Verge_style": ["List keywords that match The Verge headlines"]
    },

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
      "Top_Competitor_Name": ["What specific aspects to monitor"]
    }
  }
}

${industry_hint ? `\nIndustry context: ${industry_hint}` : ''}
${industryData.competitors.length > 0 ? `\nKnown competitors: ${industryData.competitors.join(', ')}` : ''}

═══════════════════════════════════════════════════════════
📚 EXAMPLES OF GOOD PROFILES
═══════════════════════════════════════════════════════════

✅ GOOD Example (PR Firm):
{
  "competition": {
    "direct_competitors": ["Edelman", "Weber Shandwick", "FleishmanHillard", "Ketchum", "BCW", "Golin", "Porter Novelli", "Zeno Group", "5WPR", "ICR"]
  },
  "stakeholders": {
    "regulators": ["SEC", "FTC", "FCC"],
    "key_analysts": ["Paul Holmes - The Holmes Report", "Richard Edelman - Edelman Trust Barometer"],
    "activists": []
  },
  "monitoring_guidance": {
    "regulators": {
      "special_focus": {
        "SEC": "Communications and disclosure regulations only - NOT general securities enforcement"
      }
    }
  }
}

✅ GOOD Example (Trading Company like Mitsui):
{
  "competition": {
    "direct_competitors": ["Mitsubishi Corporation", "Sumitomo Corporation", "Itochu", "Marubeni", "Toyota Tsusho", "Sojitz", "Glencore", "Trafigura", "Vitol", "Noble Group", "Cargill", "Louis Dreyfus"]
  },
  "stakeholders": {
    "regulators": ["CFTC", "FERC", "DOE", "USDA"],
    "key_analysts": ["Ed Morse - Citigroup Energy", "Jeff Currie - Goldman Sachs Commodities"],
    "activists": []
  },
  "monitoring_guidance": {
    "regulators": {
      "special_focus": {
        "CFTC": "Commodity trading regulations, position limits, swap regulations - core to operations",
        "FERC": "Energy infrastructure and pipeline regulations",
        "DOE": "Energy policy and strategic reserves"
      }
    }
  }
}

REMEMBER:
- Return 10-15 competitors minimum (not 4)
- Use simple string arrays for all targets
- Put monitoring context in monitoring_guidance section
- Only use special_focus for exceptions (like "SEC only for comms regs")
- BE SPECIFIC with real names - real companies, real agencies, real people
`;

  const message = await callAnthropic([{
    role: 'user',
    content: analysisPrompt
  }], 8000, 'claude-sonnet-4-20250514'); // Increased from 4000 - need space for full profile with 10-15 competitors + stakeholders

  const claudeResponse = message.content[0];
  if (claudeResponse.type !== 'text') {
    throw new Error('Invalid Claude response');
  }

  console.log('Claude response:', claudeResponse.text.substring(0, 500));
  console.log(`Full response length: ${claudeResponse.text.length} characters`);

  const jsonMatch = claudeResponse.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Full Claude response:', claudeResponse.text);
    throw new Error('No valid JSON in Claude response');
  }

  const enhancedData = JSON.parse(jsonMatch[0]);

  console.log(`Parsed profile: ${enhancedData.competition?.direct_competitors?.length || 0} competitors, ${enhancedData.stakeholders?.regulators?.length || 0} regulators, ${enhancedData.stakeholders?.key_analysts?.length || 0} analysts, ${enhancedData.stakeholders?.activists?.length || 0} activists`);
  
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
        const regName = typeof reg === 'string' ? reg : reg.name;
        queries.regulatory_queries.push(`${regName} ${organization_name}`, `${regName} ${enhancedData.industry}`);
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
      ...enhancedData.competition.direct_competitors.slice(0, 5).map(c => {
        const name = typeof c === 'string' ? c : c.name;
        return name.toLowerCase();
      })
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
      const compName = typeof comp === 'string' ? comp : comp.name;
      priorities[compName] = [
        `${compName} product launches`,
        `${compName} executive changes`,
        `${compName} financial performance`,
        `${compName} strategic moves`
      ];
    });
    return priorities;
  };

  // Generate intelligence context for downstream stages
  // NEW ALLOCATION: 10 competitors, 5 stakeholders, 0 topics (proven effective)
  const generateIntelligenceContext = () => {
    // Handle both string arrays (old format) and object arrays (new format with monitoring_context)
    const extractNames = (items: any[]) => items.map(item => typeof item === 'string' ? item : item.name);

    const topCompetitors = extractNames((enhancedData.competition.direct_competitors || []).slice(0, 10));
    const topRegulators = extractNames((enhancedData.stakeholders?.regulators || []).slice(0, 6)); // Allow up to 6 regulators
    const topTopics = []; // Removed topics - 0% effectiveness in monitoring
    const keyStakeholders = extractNames([
      ...(enhancedData.stakeholders?.key_analysts || []).slice(0, 3), // Up to 3 analysts
      ...(enhancedData.stakeholders?.activists || []).slice(0, 2) // Up to 2 activists
      // Removed investors/customers/partners - less relevant for monitoring
    ].filter(Boolean));

    return {
      monitoring_prompt: `We are monitoring ${organization_name}, a ${enhancedData.industry} company${enhancedData.sub_industry ? ` specializing in ${enhancedData.sub_industry}` : ''}. Focus on:
        - Direct competitive movements from: ${topCompetitors.join(', ')}
        - Regulatory developments from: ${topRegulators.join(', ')}
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

      topics: [], // Topics removed - 0% monitoring effectiveness

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
  
  // NEW: Expand keywords for sources
  const baseKeywords = enhancedData.monitoring_config?.keywords || [];
  const expandedKeywords = expandKeywordsForSources(
    baseKeywords,
    organization_name,
    sourcesData
  );

  // Merge with existing data and add enhanced monitoring config
  return {
    ...enhancedData,
    competition: {
      ...enhancedData.competition,
      // Prioritize our registry competitors but add Claude's additions
      // LIMIT TO 10 for onboarding (out of 15 total target limit)
      direct_competitors: [...new Set([
        ...industryData.competitors.slice(0, 10),
        ...(enhancedData.competition.direct_competitors || [])
      ])].slice(0, 10)
    },

    // Enhanced monitoring configuration
    monitoring_config: {
      ...enhancedData.monitoring_config,
      keywords: expandedKeywords.all,  // NEW: Use expanded keywords
      keywords_by_source: expandedKeywords.bySourceType,  // NEW
      keywords_by_priority: expandedKeywords.byPriority,  // NEW
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

/**
 * Expand keywords based on source characteristics
 * Different sources require different keyword styles
 */
function expandKeywordsForSources(
  baseKeywords: string[],
  organizationName: string,
  sourcesData: any
): any {
  const expanded = {
    all: [...baseKeywords],
    bySourceType: {},
    byPriority: {
      critical: [],
      high: [],
      medium: []
    }
  };

  // Source-type specific expansions
  const sourceTypePatterns = {
    startup_tech: ['raises', 'Series', 'funding', 'launches', 'announces', 'unveils'],
    consumer_tech: ['review', 'hands-on', 'first look', 'features', 'vs', 'comparison'],
    financial_news: ['earnings', 'revenue', 'quarterly', 'Q1', 'Q2', 'Q3', 'Q4', 'guidance'],
    regulatory: ['investigation', 'settlement', 'fine', 'compliance', 'violation', 'approval'],
    market_analysis: ['market share', 'growth', 'forecast', 'trends', 'outlook']
  };

  // Categorize sources and generate appropriate keywords
  const allSources = [
    ...sourcesData.competitive,
    ...sourcesData.media,
    ...sourcesData.regulatory,
    ...sourcesData.market
  ];

  allSources.forEach(source => {
    const sourceKeywords = [];

    // Determine source type from name
    let sourceType = 'general';
    if (['TechCrunch', 'VentureBeat', 'Crunchbase'].includes(source.name)) {
      sourceType = 'startup_tech';
    } else if (['The Verge', 'Engadget', 'Ars Technica'].includes(source.name)) {
      sourceType = 'consumer_tech';
    } else if (['Bloomberg', 'Reuters', 'Wall Street Journal'].includes(source.name)) {
      sourceType = 'financial_news';
    } else if (source.name.includes('Regulatory') || source.name.includes('SEC') || source.name.includes('FDA')) {
      sourceType = 'regulatory';
    }

    // Generate keywords for this source type
    const patterns = sourceTypePatterns[sourceType] || [];
    patterns.forEach(pattern => {
      sourceKeywords.push(`${organizationName} ${pattern}`);
    });

    // Also add base keywords
    sourceKeywords.push(...baseKeywords);

    // Store by source name and priority
    expanded.bySourceType[source.name] = [...new Set(sourceKeywords)];
    expanded.byPriority[source.priority].push(...sourceKeywords);
  });

  // Deduplicate priority keywords
  Object.keys(expanded.byPriority).forEach(priority => {
    expanded.byPriority[priority] = [...new Set(expanded.byPriority[priority])];
  });

  return expanded;
}

// Fill any remaining gaps with web search
async function fillGapsWithWebSearch(profile: any, organization_name: string) {
  // DISABLED: Web scraping has been broken since Oct 2025 and returns garbage
  // Claude already knows major competitors for Fortune 500 companies
  // With proper industry context from master-source-registry, Claude generates accurate competitors
  console.log('   ℹ️ Web scraping disabled - relying on Claude with industry context');

  // Just ensure we don't have too many competitors for onboarding
  if (profile.competition.direct_competitors.length > 10) {
    profile.competition.direct_competitors = profile.competition.direct_competitors.slice(0, 10);
  }

  // Keep key stakeholder types for monitoring
  if (profile.stakeholders) {
    profile.stakeholders.regulators = (profile.stakeholders.regulators || []).slice(0, 6); // Up to 6 regulators
    profile.stakeholders.key_analysts = (profile.stakeholders.key_analysts || []).slice(0, 4); // Up to 4 analysts
    profile.stakeholders.activists = (profile.stakeholders.activists || []).slice(0, 3); // Up to 3 activists
    // Keep small numbers of other stakeholder types
    profile.stakeholders.major_investors = (profile.stakeholders.major_investors || []).slice(0, 2);
    profile.stakeholders.major_customers = (profile.stakeholders.major_customers || []).slice(0, 2);
    profile.stakeholders.key_partners = (profile.stakeholders.key_partners || []).slice(0, 2);
  }

  // Remove topics from trending - 0% monitoring effectiveness
  if (profile.trending) {
    profile.trending.hot_topics = [];
    profile.trending.emerging_technologies = [];
  }

  return profile;
}

// Structure the final profile for use by monitoring stages
function structureFinalProfile(profileData: any, organization_name: string) {
  const sources = profileData.sources || {};

  // Topics removed - 0% monitoring effectiveness
  // Keywords are in monitoring_config instead

  return {
    organization_name,
    organization: organization_name,
    industry: profileData.industry,
    sub_industry: profileData.sub_industry,
    description: profileData.description,
    service_lines: profileData.service_lines || [],
    strategic_context: profileData.strategic_context || {
      target_customers: '',
      brand_personality: '',
      strategic_priorities: []
    },

    // Topics removed - not effective for monitoring
    topics: [],
    
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
    
    // Trending tab (topics removed - 0% monitoring effectiveness)
    trending: {
      ...profileData.trending,
      sources: sources.specialized || [],
      monitoring_queries: []  // Topics removed - not effective for monitoring
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

// Generate monitoring keywords (topics removed - not effective)
function generateKeywords(organization_name: string, analysisData: any): string[] {
  const keywords = [
    organization_name,
    ...analysisData.monitoring_config?.keywords || [],
    ...analysisData.competition?.direct_competitors?.slice(0, 5) || []
    // Topics removed - 0% monitoring effectiveness
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