#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Environment setup
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY');
}

if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY!);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY! });

// Master Source Registry - Industry-specific sources organized by purpose
const SOURCE_REGISTRY = {
  // Tier 1 - Always included mainstream sources
  tier1: {
    financial_media: [
      { name: 'Wall Street Journal', url: 'https://feeds.wsj.com/wsj/xml/rss/3_7014.xml', type: 'rss', priority: 'critical', tabs: ['stakeholders', 'market'] },
      { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', type: 'rss', priority: 'critical', tabs: ['stakeholders', 'market'] },
      { name: 'Bloomberg Markets', url: 'https://feeds.bloomberg.com/markets/news.rss', type: 'rss', priority: 'critical', tabs: ['market', 'stakeholders'] },
      { name: 'Financial Times', url: 'https://www.ft.com/rss/home', type: 'rss', priority: 'critical', tabs: ['market', 'stakeholders'] },
      { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', type: 'rss', priority: 'critical', tabs: ['market'] },
      { name: 'Forbes', url: 'https://www.forbes.com/real-time/feed2/', type: 'rss', priority: 'critical', tabs: ['market'] },
      { name: 'Business Insider', url: 'https://www.businessinsider.com/rss', type: 'rss', priority: 'high', tabs: ['market'] }
    ],
    press_releases: [
      { name: 'PR Newswire', url: 'https://www.prnewswire.com/rss/news-releases-list.rss', type: 'rss', priority: 'critical', tabs: ['stakeholders'] },
      { name: 'Business Wire', url: 'https://feed.businesswire.com/rss/home', type: 'rss', priority: 'critical', tabs: ['stakeholders'] },
      { name: 'Globe Newswire', url: 'https://www.globenewswire.com/RssFeed/', type: 'rss', priority: 'high', tabs: ['stakeholders'] }
    ],
    regulatory: [
      { name: 'SEC Press', url: 'https://www.sec.gov/rss/news/press-releases.xml', type: 'rss', priority: 'critical', tabs: ['stakeholders'] },
      { name: 'FTC News', url: 'https://www.ftc.gov/feeds/press-releases.xml', type: 'rss', priority: 'critical', tabs: ['stakeholders'] },
      { name: 'DOJ News', url: 'https://www.justice.gov/feeds/usdoj/news.xml', type: 'rss', priority: 'critical', tabs: ['stakeholders'] }
    ]
  },

  // Industry-specific sources
  industries: {
    technology: {
      competitive: [
        { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: 'rss', priority: 'critical', tabs: ['competition', 'trending'] },
        { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', type: 'rss', priority: 'critical', tabs: ['competition', 'trending'] },
        { name: 'Wired', url: 'https://www.wired.com/feed/rss', type: 'rss', priority: 'high', tabs: ['competition', 'forward_looking'] },
        { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', type: 'rss', priority: 'high', tabs: ['competition'] },
        { name: 'Engadget', url: 'https://www.engadget.com/rss.xml', type: 'rss', priority: 'high', tabs: ['competition'] }
      ],
      research: [
        { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', type: 'rss', priority: 'high', tabs: ['forward_looking'] },
        { name: 'IEEE Spectrum', url: 'https://spectrum.ieee.org/feeds/feed.rss', type: 'rss', priority: 'high', tabs: ['forward_looking'] }
      ],
      social_trending: [
        { name: 'Reddit Technology', url: 'https://www.reddit.com/r/technology/.rss', type: 'social', priority: 'medium', tabs: ['trending'] },
        { name: 'Hacker News', url: 'https://hnrss.org/frontpage', type: 'social', priority: 'high', tabs: ['trending'] }
      ]
    },
    finance: {
      competitive: [
        { name: 'American Banker', url: 'https://www.americanbanker.com/feed', type: 'rss', priority: 'critical', tabs: ['competition'] },
        { name: 'Banking Dive', url: 'https://www.bankingdive.com/feeds/news/', type: 'rss', priority: 'high', tabs: ['competition'] },
        { name: 'Finextra', url: 'https://www.finextra.com/rss/fxnews.xml', type: 'rss', priority: 'high', tabs: ['competition'] }
      ]
    },
    automotive: {
      competitive: [
        { name: 'Automotive News', url: 'https://www.autonews.com/feed', type: 'rss', priority: 'critical', tabs: ['competition'] },
        { name: 'Electrek', url: 'https://electrek.co/feed/', type: 'rss', priority: 'critical', tabs: ['competition', 'trending'] },
        { name: 'InsideEVs', url: 'https://insideevs.com/rss/news/', type: 'rss', priority: 'critical', tabs: ['competition'] },
        { name: 'Green Car Reports', url: 'https://www.greencarreports.com/rss', type: 'rss', priority: 'high', tabs: ['competition'] }
      ]
    }
  }
};

const TOOLS: Tool[] = [
  {
    name: "create_organization_profile",
    description: "Create a comprehensive 6-tab organization profile with source assignments for intelligence monitoring",
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
  },
  {
    name: "assign_sources_to_tabs",
    description: "Assign sources to specific tabs based on organization type and industry",
    inputSchema: {
      type: "object",
      properties: {
        organization_name: {
          type: "string",
          description: "Name of the organization"
        },
        industry: {
          type: "string",
          description: "Primary industry"
        },
        organization_type: {
          type: "string",
          enum: ["public", "private", "startup", "nonprofit"],
          description: "Type of organization"
        }
      },
      required: ["organization_name", "industry"]
    }
  }
];

const server = new Server(
  {
    name: "signaldesk-discovery",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Main tool handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "create_organization_profile":
        return await createOrganizationProfile(args);
      case "get_organization_profile":
        return await getOrganizationProfile(args);
      case "assign_sources_to_tabs":
        return await assignSourcesToTabs(args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error: any) {
    console.error(`Error in tool ${name}:`, error);
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error?.message || error}`);
  }
});

// Create comprehensive organization profile with 6-tab structure
async function createOrganizationProfile(args: any) {
  const { organization_name, industry_hint, save_to_persistence = true } = args;

  console.log(`🔍 Creating organization profile for: ${organization_name}`);
  console.log(`   Industry hint: ${industry_hint || 'Auto-detect'}`);

  try {
    // Step 1: Use Claude to analyze the organization
    const analysisPrompt = `
Analyze the organization "${organization_name}" and provide a comprehensive intelligence profile.

Return a JSON object with this exact structure:
{
  "organization": "${organization_name}",
  "industry": "detected_industry",
  "description": "brief description",
  "competition": {
    "direct_competitors": ["competitor1", "competitor2"],
    "indirect_competitors": ["indirect1", "indirect2"], 
    "emerging_threats": ["threat1", "threat2"],
    "competitive_advantages": ["advantage1", "advantage2"]
  },
  "stakeholders": {
    "executives": [{"name": "Name", "role": "Role"}],
    "investors": ["investor1", "investor2"],
    "partners": ["partner1", "partner2"],
    "regulators": ["regulator1", "regulator2"],
    "critics": ["critic1", "critic2"]
  },
  "market": {
    "market_position": "position", 
    "growth_drivers": ["driver1", "driver2"],
    "headwinds": ["headwind1", "headwind2"],
    "key_metrics": ["metric1", "metric2"],
    "upcoming_events": [{"event": "Event", "date": "2024", "importance": "high"}]
  },
  "trending": {
    "hot_topics": ["topic1", "topic2"],
    "viral_potential": ["potential1", "potential2"],
    "sentiment_drivers": ["driver1", "driver2"],
    "emerging_narratives": ["narrative1", "narrative2"]
  },
  "forward_looking": {
    "weak_signals": ["signal1", "signal2"],
    "opportunity_seeds": ["seed1", "seed2"],
    "technology_shifts": ["shift1", "shift2"],
    "regulatory_changes": ["change1", "change2"]
  }
}

${industry_hint ? `Consider that this organization is in the ${industry_hint} industry.` : ''}
Focus on factual, current information. Be specific with competitor names and real executives.
`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: analysisPrompt
      }]
    });

    const claudeResponse = message.content[0];
    if (claudeResponse.type !== 'text') {
      throw new Error('Invalid Claude response type');
    }

    // Parse Claude's JSON response
    const analysisText = claudeResponse.text;
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Claude response');
    }

    const analysisData = JSON.parse(jsonMatch[0]);
    console.log(`   ✅ Claude analysis complete for ${analysisData.industry} industry`);

    // Step 2: Assign sources to tabs based on industry and organization type
    const sourceAssignments = await assignSourcesToTabs({
      organization_name,
      industry: analysisData.industry,
      organization_type: 'public' // Default assumption
    });

    // Step 3: Build complete 6-tab profile
    const profile = {
      organization_name,
      organization: organization_name,
      industry: analysisData.industry,
      description: analysisData.description,
      
      // 6 Tab Structure with sources assigned
      competition: {
        ...analysisData.competition,
        sources: sourceAssignments.content.competition || [],
        monitoring_queries: generateMonitoringQueries(organization_name, 'competition', analysisData.competition)
      },
      stakeholders: {
        ...analysisData.stakeholders,
        sources: sourceAssignments.content.stakeholders || [],
        monitoring_queries: generateMonitoringQueries(organization_name, 'stakeholders', analysisData.stakeholders)
      },
      market: {
        ...analysisData.market,
        sources: sourceAssignments.content.market || [],
        monitoring_queries: generateMonitoringQueries(organization_name, 'market', analysisData.market)
      },
      trending: {
        ...analysisData.trending,
        sources: sourceAssignments.content.trending || [],
        monitoring_queries: generateMonitoringQueries(organization_name, 'trending', analysisData.trending)
      },
      forward_looking: {
        ...analysisData.forward_looking,
        sources: sourceAssignments.content.forward_looking || [],
        monitoring_queries: generateMonitoringQueries(organization_name, 'forward_looking', analysisData.forward_looking)
      },
      
      // Monitoring configuration
      monitoring_config: {
        keywords: generateKeywords(organization_name, analysisData),
        all_sources: sourceAssignments.content.all_sources || [],
        sources_by_category: sourceAssignments.content.sources_by_category || {},
        total_sources: sourceAssignments.content.total_sources || 0,
        rss_feeds: sourceAssignments.content.rss_feeds || [],
        monitoring_queries: generateMonitoringQueries(organization_name, 'general', analysisData)
      },

      metadata: {
        created_at: new Date().toISOString(),
        created_by: 'signaldesk-discovery-mcp',
        structure_version: '6-tab-v2-mcp',
        source_assignments: 'automated'
      }
    };

    // Step 4: Save to persistence if requested
    if (save_to_persistence) {
      console.log('💾 Saving profile to persistence...');
      
      const persistenceResult = await saveToPersistence(profile);
      if (!persistenceResult.success) {
        console.error('❌ Failed to save to persistence:', persistenceResult.error);
        // Still return the profile even if save failed
      } else {
        console.log('✅ Profile saved to persistence successfully');
      }
    }

    console.log(`🎯 Profile creation complete:`);
    console.log(`   - Industry: ${profile.industry}`);
    console.log(`   - Total sources: ${profile.monitoring_config.total_sources}`);
    console.log(`   - Competition sources: ${profile.competition.sources.length}`);
    console.log(`   - Stakeholder sources: ${profile.stakeholders.sources.length}`);
    console.log(`   - Keywords: ${profile.monitoring_config.keywords.length}`);

    return {
      content: [
        {
          type: "text",
          text: `✅ Organization profile created for ${organization_name}\n\n` +
                `Industry: ${profile.industry}\n` +
                `Total sources: ${profile.monitoring_config.total_sources}\n` +
                `Source distribution:\n` +
                `- Competition: ${profile.competition.sources.length} sources\n` +
                `- Stakeholders: ${profile.stakeholders.sources.length} sources\n` +
                `- Market: ${profile.market.sources.length} sources\n` +
                `- Trending: ${profile.trending.sources.length} sources\n` +
                `- Forward-looking: ${profile.forward_looking.sources.length} sources\n\n` +
                `${save_to_persistence ? '💾 Saved to persistence' : '📝 Not saved (save_to_persistence=false)'}`
        }
      ],
      profile,
      success: true
    };

  } catch (error: any) {
    console.error('❌ Profile creation failed:', error);
    throw new McpError(ErrorCode.InternalError, `Profile creation failed: ${error?.message || error}`);
  }
}

// Get existing organization profile
async function getOrganizationProfile(args: any) {
  const { organization_name } = args;

  try {
    console.log(`📖 Retrieving profile for: ${organization_name}`);

    // Fetch from Supabase persistence
    const { data, error } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('organization_name', organization_name)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return {
        content: [
          {
            type: "text", 
            text: `❌ No profile found for "${organization_name}". Use create_organization_profile to create one.`
          }
        ],
        success: false,
        error: 'Profile not found'
      };
    }

    console.log(`✅ Profile found for ${organization_name}`);

    return {
      content: [
        {
          type: "text",
          text: `✅ Profile retrieved for ${organization_name}\n\n` +
                `Industry: ${data.profile_data.industry}\n` +
                `Total sources: ${data.profile_data.monitoring_config?.total_sources || 0}\n` +
                `Last updated: ${data.updated_at}`
        }
      ],
      profile: data.profile_data,
      metadata: {
        updated_at: data.updated_at,
        created_at: data.created_at
      },
      success: true
    };

  } catch (error) {
    console.error('❌ Profile retrieval failed:', error);
    throw new McpError(ErrorCode.InternalError, `Profile retrieval failed: ${error.message}`);
  }
}

// Assign sources to tabs based on industry and organization characteristics
async function assignSourcesToTabs(args: any) {
  const { organization_name, industry, organization_type = 'public' } = args;

  console.log(`🎯 Assigning sources to tabs for ${organization_name} (${industry} industry)`);

  const assignments: {
    competition: any[];
    stakeholders: any[];  
    market: any[];
    trending: any[];
    forward_looking: any[];
    all_sources: any[];
    sources_by_category: any;
    rss_feeds: string[];
    total_sources: number;
  } = {
    competition: [],
    stakeholders: [],
    market: [],
    trending: [],
    forward_looking: [],
    all_sources: [],
    sources_by_category: {},
    rss_feeds: [],
    total_sources: 0
  };

  // Always include Tier 1 sources
  console.log('   📰 Adding Tier 1 mainstream sources...');
  
  // Financial media goes to stakeholders and market tabs
  SOURCE_REGISTRY.tier1.financial_media.forEach(source => {
    source.tabs.forEach(tab => {
      if (assignments[tab]) {
        assignments[tab].push({...source});
      }
    });
    assignments.all_sources.push({...source});
    if (source.type === 'rss') {
      assignments.rss_feeds.push(source.url);
    }
  });

  // Press releases go to stakeholders
  SOURCE_REGISTRY.tier1.press_releases.forEach(source => {
    assignments.stakeholders.push({...source});
    assignments.all_sources.push({...source});
    if (source.type === 'rss') {
      assignments.rss_feeds.push(source.url);
    }
  });

  // Regulatory sources go to stakeholders
  SOURCE_REGISTRY.tier1.regulatory.forEach(source => {
    assignments.stakeholders.push({...source});
    assignments.all_sources.push({...source});
    if (source.type === 'rss') {
      assignments.rss_feeds.push(source.url);
    }
  });

  // Add industry-specific sources
  const industryLower = industry.toLowerCase();
  let industryConfig = null;

  if (industryLower.includes('tech') || industryLower.includes('ai') || industryLower.includes('software')) {
    industryConfig = SOURCE_REGISTRY.industries.technology;
    console.log('   🖥️ Adding technology industry sources...');
  } else if (industryLower.includes('financ') || industryLower.includes('bank') || industryLower.includes('fintech')) {
    industryConfig = SOURCE_REGISTRY.industries.finance;
    console.log('   💰 Adding finance industry sources...');
  } else if (industryLower.includes('auto') || industryLower.includes('car') || industryLower.includes('vehicle')) {
    industryConfig = SOURCE_REGISTRY.industries.automotive;
    console.log('   🚗 Adding automotive industry sources...');
  }

  if (industryConfig) {
    Object.keys(industryConfig).forEach(category => {
      industryConfig[category].forEach(source => {
        source.tabs.forEach(tab => {
          if (assignments[tab]) {
            assignments[tab].push({...source});
          }
        });
        assignments.all_sources.push({...source});
        if (source.type === 'rss') {
          assignments.rss_feeds.push(source.url);
        }
      });
    });
  } else {
    console.log(`   ⚠️ No specific sources for ${industry} industry, using general sources`);
  }

  // Build sources by category for MCP routing
  assignments.sources_by_category = {
    competitive: assignments.competition,
    media: assignments.stakeholders,
    regulatory: assignments.stakeholders.filter(s => s.name.includes('SEC') || s.name.includes('FTC') || s.name.includes('DOJ')),
    market: assignments.market,
    forward: assignments.forward_looking,
    social: assignments.trending.filter(s => s.type === 'social')
  };

  // Remove duplicates and count
  assignments.rss_feeds = [...new Set(assignments.rss_feeds)];
  assignments.total_sources = assignments.all_sources.length;

  console.log(`   ✅ Source assignment complete:`);
  console.log(`      - Competition: ${assignments.competition.length} sources`);
  console.log(`      - Stakeholders: ${assignments.stakeholders.length} sources`);
  console.log(`      - Market: ${assignments.market.length} sources`);
  console.log(`      - Trending: ${assignments.trending.length} sources`);
  console.log(`      - Forward-looking: ${assignments.forward_looking.length} sources`);
  console.log(`      - Total: ${assignments.total_sources} sources`);
  console.log(`      - RSS feeds: ${assignments.rss_feeds.length}`);

  return {
    content: assignments,
    success: true
  };
}

// Generate monitoring keywords for each tab
function generateKeywords(organizationName: string, analysisData: any): string[] {
  const keywords = [organizationName];

  // Add competitors as keywords
  if (analysisData.competition?.direct_competitors) {
    keywords.push(...analysisData.competition.direct_competitors.slice(0, 3));
  }

  // Add key executives as keywords  
  if (analysisData.stakeholders?.executives) {
    analysisData.stakeholders.executives.slice(0, 2).forEach(exec => {
      if (exec.name) keywords.push(exec.name);
    });
  }

  // Add key products/topics
  if (analysisData.trending?.hot_topics) {
    keywords.push(...analysisData.trending.hot_topics.slice(0, 2));
  }

  // Industry-specific keywords
  const industry = analysisData.industry?.toLowerCase() || '';
  if (industry.includes('tech') || industry.includes('ai')) {
    keywords.push('artificial intelligence', 'AI', 'technology');
  } else if (industry.includes('auto')) {
    keywords.push('automotive', 'electric vehicle', 'EV');
  } else if (industry.includes('financ')) {
    keywords.push('financial services', 'banking', 'fintech');
  }

  return [...new Set(keywords)].slice(0, 15); // Limit to 15 unique keywords
}

// Generate monitoring queries for specific tabs
function generateMonitoringQueries(organizationName: string, tabType: string, tabData: any): string[] {
  const queries = [];

  switch (tabType) {
    case 'competition':
      queries.push(`"${organizationName}" competitor`);
      queries.push(`"${organizationName}" vs`);
      queries.push(`"${organizationName}" market share`);
      if (tabData?.direct_competitors) {
        tabData.direct_competitors.slice(0, 2).forEach(comp => {
          queries.push(`"${comp}" announcement`);
        });
      }
      break;

    case 'stakeholders':
      queries.push(`"${organizationName}" CEO`);
      queries.push(`"${organizationName}" executive`);
      queries.push(`"${organizationName}" investor`);
      queries.push(`"${organizationName}" regulatory`);
      break;

    case 'market':
      queries.push(`"${organizationName}" earnings`);
      queries.push(`"${organizationName}" revenue`);
      queries.push(`"${organizationName}" valuation`);
      queries.push(`"${organizationName}" market`);
      break;

    case 'trending':
      queries.push(`"${organizationName}" trending`);
      queries.push(`"${organizationName}" viral`);
      queries.push(`"${organizationName}" breaking`);
      queries.push(`"${organizationName}" announcement`);
      break;

    case 'forward_looking':
      queries.push(`"${organizationName}" roadmap`);
      queries.push(`"${organizationName}" future`);
      queries.push(`"${organizationName}" innovation`);
      queries.push(`"${organizationName}" research`);
      break;

    default:
      queries.push(`"${organizationName}"`);
  }

  return queries.slice(0, 6); // Limit queries per tab
}

// Save profile to Supabase persistence
async function saveToPersistence(profile: any): Promise<{success: boolean, error?: string}> {
  try {
    // Call the intelligence-persistence Edge Function
    const persistenceUrl = `${SUPABASE_URL}/functions/v1/intelligence-persistence`;
    
    const response = await fetch(persistenceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        action: 'saveProfile',
        organization_name: profile.organization_name,
        ...profile
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Persistence API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Unknown persistence error' };
    }

  } catch (error) {
    console.error('Persistence save error:', error);
    return { success: false, error: error.message };
  }
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SignalDesk Discovery MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});