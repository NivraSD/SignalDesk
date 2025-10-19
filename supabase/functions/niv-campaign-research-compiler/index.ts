import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Campaign Research Compiler - Edge Function Version
 *
 * Takes gathered data and organizes it into structured categories
 * for the synthesis function to process.
 *
 * Pattern: Like Enrichment Stage - structures raw data without AI.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    console.log('🔧 Campaign Research Compiler - Organizing data');
    const { gatheredData, campaignGoal, organizationContext } = await req.json();

    if (!gatheredData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'gatheredData is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const startTime = Date.now();

    // COMPILE STAKEHOLDER DATA
    const compiledStakeholders = compileStakeholderData(gatheredData.stakeholder || []);

    // COMPILE NARRATIVE DATA
    const compiledNarratives = compileNarrativeData(gatheredData.narrative || []);

    // COMPILE CHANNEL DATA
    const compiledChannels = compileChannelData(gatheredData.channel || []);

    // COMPILE HISTORICAL DATA
    const compiledHistorical = compileHistoricalData(gatheredData.historical || []);

    const compiledResearch = {
      stakeholder: compiledStakeholders,
      narrative: compiledNarratives,
      channel: compiledChannels,
      historical: compiledHistorical,
      metadata: {
        campaignGoal,
        organizationContext,
        totalDataPoints:
          (compiledStakeholders.dataPoints || 0) +
          (compiledNarratives.dataPoints || 0) +
          (compiledChannels.dataPoints || 0) +
          (compiledHistorical.dataPoints || 0)
      }
    };

    const compilationTime = Date.now() - startTime;
    console.log(`✅ Data compiled in ${compilationTime}ms`);
    console.log(`📊 Total data points: ${compiledResearch.metadata.totalDataPoints}`);

    return new Response(JSON.stringify({
      success: true,
      compiledResearch,
      compilationTime,
      service: 'Campaign Research Compiler',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Research compilation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Research compilation failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Compile stakeholder research into structured format
function compileStakeholderData(results: any[]) {
  const compiled: any = {
    stakeholderGroups: [],
    competitorProfiles: [],
    industryContext: '',
    keyInsights: [],
    dataPoints: results.length
  };

  for (const result of results) {
    if (result.tool === 'mcp_discovery' && result.data) {
      // Extract stakeholder groups from discovery
      if (result.data.stakeholders) {
        compiled.stakeholderGroups.push(...(Array.isArray(result.data.stakeholders)
          ? result.data.stakeholders
          : Object.keys(result.data.stakeholders)));
      }
      if (result.data.competitors) {
        compiled.competitorProfiles.push(...result.data.competitors);
      }
      if (result.data.industry_context) {
        compiled.industryContext = result.data.industry_context;
      }
    }

    if (result.tool === 'niv_fireplexity' && result.data) {
      // Extract stakeholder mentions from search results
      if (result.data.results) {
        const mentions = extractStakeholderMentions(result.data.results);
        compiled.keyInsights.push(...mentions);
      }
    }

    if (result.tool === 'knowledge_library_registry' && result.data) {
      // Extract historical stakeholder patterns
      if (result.data.results) {
        const patterns = extractStakeholderPatterns(result.data.results);
        compiled.keyInsights.push(...patterns);
      }
    }
  }

  return compiled;
}

// Compile narrative research
function compileNarrativeData(results: any[]) {
  const compiled: any = {
    dominantNarratives: [],
    trendingTopics: [],
    competitorMessaging: [],
    mediaAngles: [],
    dataPoints: results.length
  };

  for (const result of results) {
    if (result.tool === 'niv_fireplexity' && result.data?.results) {
      // Extract narratives from recent content
      const narratives = extractNarratives(result.data.results);
      compiled.dominantNarratives.push(...narratives);

      const topics = extractTopics(result.data.results);
      compiled.trendingTopics.push(...topics);
    }

    if (result.tool === 'knowledge_library_registry' && result.data?.results) {
      // Extract successful narrative patterns
      const patterns = extractNarrativePatterns(result.data.results);
      compiled.mediaAngles.push(...patterns);
    }
  }

  return compiled;
}

// Compile channel research
function compileChannelData(results: any[]) {
  const compiled: any = {
    journalists: [],
    publications: [],
    channels: [],
    dataPoints: results.length
  };

  for (const result of results) {
    if (result.tool === 'journalist_registry' && result.data?.journalists) {
      compiled.journalists.push(...result.data.journalists);
    }

    if (result.tool === 'master_source_registry' && result.data?.sources) {
      compiled.publications.push(...result.data.sources);
    }
  }

  return compiled;
}

// Compile historical research
function compileHistoricalData(results: any[]) {
  const compiled: any = {
    successfulCampaigns: [],
    patternRecommendations: [],
    riskFactors: [],
    dataPoints: results.length
  };

  for (const result of results) {
    if (result.tool === 'knowledge_library_registry' && result.data?.results) {
      const campaigns = extractCampaigns(result.data.results);
      compiled.successfulCampaigns.push(...campaigns);

      const patterns = extractPatterns(result.data.results);
      compiled.patternRecommendations.push(...patterns);
    }

    if (result.tool === 'niv_fireplexity' && result.data?.results) {
      // Extract recent campaign examples
      const recentCampaigns = extractRecentCampaigns(result.data.results);
      compiled.successfulCampaigns.push(...recentCampaigns);
    }
  }

  return compiled;
}

// Helper extraction functions
function extractStakeholderMentions(results: any[]) {
  return results
    .filter((r: any) => r.content && (r.content.includes('stakeholder') || r.content.includes('audience')))
    .map((r: any) => ({
      insight: r.title || 'Stakeholder mention',
      source: r.url || 'web',
      relevance: 'stakeholder'
    }))
    .slice(0, 5);
}

function extractStakeholderPatterns(results: any[]) {
  return results
    .map((r: any) => ({
      pattern: r.title || r.description || 'Stakeholder pattern',
      source: 'knowledge_library'
    }))
    .slice(0, 3);
}

function extractNarratives(results: any[]) {
  return results
    .map((r: any) => r.title || r.description || 'Narrative')
    .filter(Boolean)
    .slice(0, 10);
}

function extractTopics(results: any[]) {
  const topics = new Set();
  results.forEach((r: any) => {
    if (r.topics) {
      r.topics.forEach((t: string) => topics.add(t));
    }
  });
  return Array.from(topics).slice(0, 10);
}

function extractNarrativePatterns(results: any[]) {
  return results
    .map((r: any) => r.title || r.description)
    .filter(Boolean)
    .slice(0, 5);
}

function extractCampaigns(results: any[]) {
  return results
    .filter((r: any) => r.type === 'case_study' || r.title?.includes('campaign'))
    .map((r: any) => ({
      campaign: r.title,
      description: r.description,
      source: 'knowledge_library'
    }))
    .slice(0, 5);
}

function extractPatterns(results: any[]) {
  return results
    .map((r: any) => r.title || r.description)
    .filter(Boolean)
    .slice(0, 5);
}

function extractRecentCampaigns(results: any[]) {
  return results
    .filter((r: any) => r.content?.includes('campaign') || r.title?.includes('campaign'))
    .map((r: any) => ({
      campaign: r.title,
      url: r.url,
      source: 'web'
    }))
    .slice(0, 3);
}
