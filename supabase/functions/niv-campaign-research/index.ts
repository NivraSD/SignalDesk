/**
 * NIV Campaign Research - Phase 1
 * Orchestrates 6 parallel research agents using existing MCP tools
 * Returns structured CampaignIntelligenceBrief
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface ResearchRequest {
  campaignGoal: string;
  organizationId: string;
  organizationContext: {
    name: string;
    industry: string;
  };
  refinementRequest?: string;
}

interface CampaignIntelligenceBrief {
  stakeholders: any[];
  narrativeLandscape: any;
  channelIntelligence: any;
  historicalInsights: any;
  competitiveMovements: any;
  organizationProfile: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      campaignGoal,
      organizationId,
      organizationContext,
      refinementRequest
    }: ResearchRequest = await req.json();

    // Provide default org context if missing
    const orgContext = organizationContext || { name: 'Unknown', industry: 'General' };

    console.log('🔬 NIV Campaign Research Starting');
    console.log(`   Goal: ${campaignGoal.substring(0, 100)}...`);
    console.log(`   Org: ${orgContext.name} (${orgContext.industry})`);
    if (refinementRequest) {
      console.log(`   Refinement: ${refinementRequest}`);
    }

    // Check cache first
    const cacheKey = `campaign_research_${organizationId}_${hashString(campaignGoal)}`;
    const cached = await getCachedResearch(cacheKey);

    if (cached && !refinementRequest) {
      console.log('✅ Returning cached research');
      return new Response(
        JSON.stringify({ ...cached, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Run 6 parallel research agents
    console.log('\n🤖 Launching 6 research agents in parallel...\n');

    const [
      orgProfile,
      stakeholderIntel,
      narrativeEnv,
      channelIntel,
      historicalPatterns,
      competitiveMovements
    ] = await Promise.all([
      runOrganizationContextAgent(orgContext),
      runStakeholderIntelligenceAgent(orgContext, campaignGoal, refinementRequest),
      runNarrativeEnvironmentAgent(orgContext, campaignGoal, refinementRequest),
      runChannelIntelligenceAgent(orgContext, refinementRequest),
      runHistoricalPatternAgent(campaignGoal, refinementRequest),
      runCompetitiveMovementAgent(orgContext, refinementRequest)
    ]);

    console.log('\n✅ All agents completed. Synthesizing findings...\n');

    // Synthesize into unified brief
    const brief: CampaignIntelligenceBrief = {
      organizationProfile: orgProfile,
      stakeholders: stakeholderIntel.stakeholders,
      narrativeLandscape: narrativeEnv,
      channelIntelligence: channelIntel,
      historicalInsights: historicalPatterns,
      competitiveMovements: competitiveMovements
    };

    // Cache the results (expire in 6 hours)
    await cacheResearch(cacheKey, brief, organizationId);

    console.log('📋 Research Brief Summary:');
    console.log(`   • ${brief.stakeholders.length} stakeholder groups identified`);
    console.log(`   • ${brief.competitiveMovements.recentMoves?.length || 0} competitive movements tracked`);
    console.log(`   • ${brief.channelIntelligence.journalists?.length || 0} journalist contacts found`);
    console.log(`   • ${brief.historicalInsights.relevantCaseStudies?.length || 0} relevant case studies`);

    return new Response(
      JSON.stringify({
        success: true,
        brief,
        cached: false,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Campaign Research Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// ==========================================
// Agent 1: Organization Context
// ==========================================
async function runOrganizationContextAgent(orgContext: any) {
  console.log('1️⃣  Organization Context Agent: Running mcp-discovery...');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-discovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        organization: orgContext.name,
        industry_hint: orgContext.industry
      })
    });

    if (!response.ok) {
      console.warn('   ⚠️  mcp-discovery failed, using basic profile');
      return createBasicOrgProfile(orgContext);
    }

    const data = await response.json();
    console.log('   ✓ Profile created with competitors and stakeholders');

    return data.profile || createBasicOrgProfile(orgContext);

  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return createBasicOrgProfile(orgContext);
  }
}

function createBasicOrgProfile(orgContext: any) {
  return {
    organization_name: orgContext.name,
    industry: orgContext.industry,
    competition: { direct_competitors: [], indirect_competitors: [] },
    stakeholders: { regulators: [], major_customers: [], major_investors: [] },
    monitoring_config: { keywords: [orgContext.name] }
  };
}

// ==========================================
// Agent 2: Stakeholder Intelligence
// ==========================================
async function runStakeholderIntelligenceAgent(orgContext: any, goal: string, refinement?: string) {
  console.log('2️⃣  Stakeholder Intelligence Agent: Analyzing stakeholders...');

  // Get org profile first to identify stakeholder groups
  const orgProfile = await runOrganizationContextAgent(orgContext);

  // Identify key stakeholder groups from goal + org profile
  const stakeholderGroups = identifyStakeholderGroups(goal, orgProfile);

  // For each stakeholder, gather recent activity via fireplexity
  const enrichedStakeholders = await Promise.all(
    stakeholderGroups.map(async (group) => {
      try {
        // Search for recent mentions of this stakeholder group
        const query = `${group.name} ${orgContext.name} ${orgContext.industry}`;

        const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({
            query,
            timeWindow: '48h',
            useCache: true
          })
        });

        if (response.ok) {
          const data = await response.json();
          group.recentActivity = data.articles?.slice(0, 5) || [];
        }
      } catch (err) {
        console.warn(`   ⚠️  Could not get recent activity for ${group.name}`);
      }

      return group;
    })
  );

  console.log(`   ✓ ${enrichedStakeholders.length} stakeholder groups profiled`);

  return { stakeholders: enrichedStakeholders };
}

function identifyStakeholderGroups(goal: string, orgProfile: any) {
  // Basic stakeholder identification (in production, use LLM here)
  const groups = [
    {
      name: 'Media & Journalists',
      priority: 'primary',
      psychology: {
        values: ['Newsworthiness', 'Exclusivity', 'Timeliness'],
        fears: ['Missing stories', 'Being scooped', 'Misinformation'],
        aspirations: ['Breaking news', 'Awards', 'Audience growth']
      },
      informationDiet: {
        primarySources: ['Press releases', 'Industry publications', 'Social media'],
        trustedVoices: ['Industry experts', 'Company executives'],
        consumptionPatterns: 'Real-time news monitoring, email pitches'
      },
      currentPerceptions: {
        ofOrganization: 'Neutral - seeking newsworthy angles',
        ofIndustry: orgProfile.industry
      }
    },
    {
      name: 'Industry Analysts',
      priority: 'secondary',
      psychology: {
        values: ['Data', 'Insights', 'Market trends'],
        fears: ['Inaccurate predictions', 'Missing disruptions'],
        aspirations: ['Thought leadership', 'Accurate forecasts']
      },
      informationDiet: {
        primarySources: ['Industry reports', 'Company briefings', 'Market data'],
        trustedVoices: ['C-level executives', 'Research firms'],
        consumptionPatterns: 'Quarterly briefings, deep-dive reports'
      }
    },
    {
      name: 'Customers',
      priority: 'primary',
      psychology: {
        values: ['Value', 'Reliability', 'Innovation'],
        fears: ['Poor quality', 'Wasted money', 'Switching costs'],
        aspirations: ['Best solution', 'Status', 'Efficiency']
      },
      informationDiet: {
        primarySources: ['Social media', 'Review sites', 'Word of mouth'],
        trustedVoices: ['Peer reviews', 'Influencers', 'Friends'],
        consumptionPatterns: 'Mobile-first, visual content'
      }
    }
  ];

  return groups;
}

// ==========================================
// Agent 3: Narrative Environment
// ==========================================
async function runNarrativeEnvironmentAgent(orgContext: any, goal: string, refinement?: string) {
  console.log('3️⃣  Narrative Environment Agent: Mapping discourse...');

  try {
    // Search for current narratives in the industry
    const query = refinement || `${orgContext.industry} trends narrative 2025`;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        query,
        timeWindow: '7d',
        useCache: true
      })
    });

    let articles = [];
    if (response.ok) {
      const data = await response.json();
      articles = data.articles || [];
    }

    // Get framing research from knowledge library
    const knowledgeResponse = await fetch(`${SUPABASE_URL}/functions/v1/knowledge-library-registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        research_area: 'framing_narrative',
        priority_filter: 'critical'
      })
    });

    let framingResearch = [];
    if (knowledgeResponse.ok) {
      const data = await knowledgeResponse.json();
      framingResearch = data.data?.foundational || [];
    }

    console.log(`   ✓ Mapped ${articles.length} recent narratives`);

    return {
      dominantNarratives: extractNarratives(articles),
      narrativeVacuums: identifyVacuums(articles, goal),
      competitivePositioning: [],
      culturalContext: `${orgContext.industry} industry in 2025`,
      framingResearch: framingResearch.slice(0, 3)
    };

  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return {
      dominantNarratives: [],
      narrativeVacuums: [],
      competitivePositioning: [],
      culturalContext: `${orgContext.industry} industry`
    };
  }
}

function extractNarratives(articles: any[]) {
  // Simple narrative extraction (in production, use LLM)
  return [
    'AI transformation accelerating across industries',
    'Sustainability becoming table stakes',
    'Customer experience as differentiator'
  ];
}

function identifyVacuums(articles: any[], goal: string) {
  return [
    'Practical implementation stories missing',
    'Mid-market perspective underrepresented',
    'Long-term impact analysis needed'
  ];
}

// ==========================================
// Agent 4: Channel Intelligence
// ==========================================
async function runChannelIntelligenceAgent(orgContext: any, refinement?: string) {
  console.log('4️⃣  Channel Intelligence Agent: Mapping channels...');

  try {
    // Get industry sources from master-source-registry
    const sourcesResponse = await fetch(`${SUPABASE_URL}/functions/v1/master-source-registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ industry: orgContext.industry })
    });

    let sources = { media: [], competitive: [], market: [] };
    if (sourcesResponse.ok) {
      const data = await sourcesResponse.json();
      sources = data.data || sources;
    }

    // Get tier-1 journalists from journalist-registry
    const journalistsResponse = await fetch(`${SUPABASE_URL}/functions/v1/journalist-registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        industry: orgContext.industry,
        tier: 'tier1',
        count: 20
      })
    });

    let journalists = [];
    if (journalistsResponse.ok) {
      const data = await journalistsResponse.json();
      journalists = data.journalists || [];
    }

    console.log(`   ✓ Found ${journalists.length} journalists, ${Object.keys(sources).length} source categories`);

    return {
      byStakeholder: mapChannelsToStakeholders(sources, journalists),
      sources: sources,
      journalists: journalists
    };

  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return {
      byStakeholder: [],
      sources: {},
      journalists: []
    };
  }
}

function mapChannelsToStakeholders(sources: any, journalists: any[]) {
  return [
    {
      stakeholder: 'Media & Journalists',
      channels: ['Email pitch', 'Press release', 'Media briefing'],
      trustLevels: { 'tier1_outlets': 'high', 'trade_publications': 'medium' },
      optimalTiming: 'Tuesday-Thursday, 9-11am ET'
    },
    {
      stakeholder: 'Industry Analysts',
      channels: ['Analyst briefing', 'Research portal', 'Executive access'],
      trustLevels: { 'gartner': 'high', 'forrester': 'high' },
      optimalTiming: 'Quarterly earnings + 2 weeks'
    },
    {
      stakeholder: 'Customers',
      channels: ['Social media', 'Email', 'Customer community', 'Product updates'],
      trustLevels: { 'peer_reviews': 'highest', 'brand_content': 'medium' },
      optimalTiming: 'Mobile: evenings, Desktop: work hours'
    }
  ];
}

// ==========================================
// Agent 5: Historical Pattern
// ==========================================
async function runHistoricalPatternAgent(goal: string, refinement?: string) {
  console.log('5️⃣  Historical Pattern Agent: Analyzing patterns...');

  try {
    // Get case studies from knowledge library
    const response = await fetch(`${SUPABASE_URL}/functions/v1/knowledge-library-registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        pattern: 'CASCADE', // Default pattern
        research_area: 'case_studies'
      })
    });

    let caseStudies = [];
    let patternKnowledge = [];

    if (response.ok) {
      const data = await response.json();
      caseStudies = data.data?.pattern_specific || [];
      patternKnowledge = data.data?.foundational || [];
    }

    console.log(`   ✓ Found ${caseStudies.length} case studies, ${patternKnowledge.length} research papers`);

    return {
      relevantCaseStudies: caseStudies.slice(0, 5),
      patternRecommendations: ['CASCADE', 'MIRROR', 'CHORUS'],
      successFactors: [
        'Clear stakeholder sequencing',
        'Authentic voices',
        'Timely execution',
        'Multi-channel coordination'
      ],
      riskFactors: [
        'Rushed timeline',
        'Inauthentic messaging',
        'Poor stakeholder research',
        'Single-channel dependence'
      ],
      foundationalResearch: patternKnowledge.slice(0, 3)
    };

  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return {
      relevantCaseStudies: [],
      patternRecommendations: ['CASCADE'],
      successFactors: [],
      riskFactors: []
    };
  }
}

// ==========================================
// Agent 6: Competitive Movement
// ==========================================
async function runCompetitiveMovementAgent(orgContext: any, refinement?: string) {
  console.log('6️⃣  Competitive Movement Agent: Tracking competitors...');

  try {
    // Get competitor list from org profile
    const orgProfile = await runOrganizationContextAgent(orgContext);
    const competitors = orgProfile.competition?.direct_competitors?.slice(0, 5) || [];

    if (competitors.length === 0) {
      console.log('   ⚠️  No competitors found');
      return { recentMoves: [], analysis: 'No competitive data available' };
    }

    // For each competitor, search recent news
    const competitiveMovements = await Promise.all(
      competitors.map(async (competitor: string) => {
        try {
          const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            },
            body: JSON.stringify({
              query: `${competitor} announcement launch ${orgContext.industry}`,
              timeWindow: '24h',
              useCache: true
            })
          });

          if (response.ok) {
            const data = await response.json();
            return {
              competitor,
              recentAnnouncements: data.articles?.slice(0, 3) || [],
              lastActivity: new Date().toISOString()
            };
          }
        } catch (err) {
          console.warn(`   ⚠️  Could not fetch data for ${competitor}`);
        }

        return { competitor, recentAnnouncements: [], lastActivity: null };
      })
    );

    console.log(`   ✓ Tracked ${competitors.length} competitors`);

    return {
      recentMoves: competitiveMovements,
      analysis: `Monitored ${competitors.length} direct competitors for recent strategic moves`,
      competitors: competitors
    };

  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return {
      recentMoves: [],
      analysis: 'Unable to track competitive movements',
      competitors: []
    };
  }
}

// ==========================================
// Utility Functions
// ==========================================

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

async function getCachedResearch(cacheKey: string) {
  try {
    const { data, error } = await supabase
      .from('campaign_research_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;

    return data.research_data;
  } catch {
    return null;
  }
}

async function cacheResearch(cacheKey: string, brief: any, orgId: string) {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 6); // 6 hour cache

    await supabase
      .from('campaign_research_cache')
      .upsert({
        cache_key: cacheKey,
        org_id: orgId,
        research_type: 'full_brief',
        research_data: brief,
        expires_at: expiresAt.toISOString()
      });
  } catch (err) {
    console.warn('⚠️  Could not cache research:', err.message);
  }
}
