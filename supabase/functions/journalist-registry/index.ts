import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Publication tier metadata for enriching journalist results
const OUTLET_METADATA: { [key: string]: any } = {
  "New York Times": { tier: "tier1", category: "elite", influence_score: 10, reach: "global" },
  "Bloomberg": { tier: "tier1", category: "elite", influence_score: 10, reach: "global" },
  "Wall Street Journal": { tier: "tier1", category: "elite", influence_score: 10, reach: "global" },
  "Washington Post": { tier: "tier1", category: "elite", influence_score: 10, reach: "global" },
  "The Verge": { tier: "tier1", category: "tech", influence_score: 9, reach: "global" },
  "TechCrunch": { tier: "tier1", category: "tech", influence_score: 9, reach: "global" },
  "Wired": { tier: "tier1", category: "tech", influence_score: 9, reach: "global" },
  "The Information": { tier: "tier1", category: "tech", influence_score: 9, reach: "global" },
  "Platformer": { tier: "tier1", category: "newsletter", influence_score: 8, reach: "global" },
  "Big Technology": { tier: "tier1", category: "newsletter", influence_score: 8, reach: "global" },
  "STAT News": { tier: "tier1", category: "vertical", influence_score: 9, reach: "national" },
  "CoinDesk": { tier: "tier1", category: "vertical", influence_score: 8, reach: "global" },
  "Axios": { tier: "tier1", category: "vertical", influence_score: 8, reach: "national" },
  "CNBC": { tier: "tier1", category: "business", influence_score: 9, reach: "global" },
  "Ars Technica": { tier: "tier1", category: "tech", influence_score: 8, reach: "global" },
  "MIT Tech Review": { tier: "tier1", category: "tech", influence_score: 9, reach: "global" },
  "Forbes": { tier: "tier1", category: "business", influence_score: 8, reach: "global" },
  "Fortune": { tier: "tier1", category: "business", influence_score: 8, reach: "global" },
  "Reuters": { tier: "tier1", category: "elite", influence_score: 10, reach: "global" },
  "Semafor": { tier: "tier1", category: "newsletter", influence_score: 8, reach: "global" },
  "Puck": { tier: "tier1", category: "newsletter", influence_score: 8, reach: "national" },
  "Vox": { tier: "tier1", category: "vertical", influence_score: 8, reach: "national" },
  "The Block": { tier: "tier1", category: "vertical", influence_score: 8, reach: "global" },
  "The Atlantic": { tier: "tier1", category: "elite", influence_score: 9, reach: "national" }
};

// Enrich journalists with outlet metadata
function enrichJournalists(journalists: any[]): any[] {
  return journalists.map(j => {
    const outletMeta = OUTLET_METADATA[j.outlet] || { tier: "tier2", category: "other", influence_score: 5, reach: "national" };
    return {
      ...j,
      outlet_metadata: outletMeta
    };
  });
}

interface JournalistQuery {
  industry?: string;
  beat?: string;
  outlet?: string;
  tier?: string;
  count?: number;
  search?: string;
}

interface GapAnalysis {
  hasGaps: boolean;
  currentCount: number;
  requestedCount: number;
  missingCount: number;
  suggestions: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      industry,
      beat,
      outlet,
      tier = 'tier1',
      count = 10,
      search,
      mode = 'query' // 'query' or 'gap-analysis'
    } = await req.json();

    console.log('📊 Journalist Registry Request:', { industry, beat, outlet, tier, count, search, mode });

    // Build query
    let query = supabaseClient
      .from('journalist_registry')
      .select('*');

    if (industry) {
      query = query.eq('industry', industry);
    }

    if (beat) {
      query = query.ilike('beat', `%${beat}%`);
    }

    if (outlet) {
      query = query.ilike('outlet', `%${outlet}%`);
    }

    if (tier) {
      query = query.eq('tier', tier);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,outlet.ilike.%${search}%,beat.ilike.%${search}%`);
    }

    const { data: journalists, error } = await query.limit(count);

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log(`✅ Found ${journalists?.length || 0} journalists`);

    // Enrich with outlet metadata
    const enrichedJournalists = enrichJournalists(journalists || []);

    // Gap analysis mode (similar to mcp-discovery)
    if (mode === 'gap-analysis') {
      const gapAnalysis = await analyzeJournalistGaps({
        journalists: enrichedJournalists,
        requestedCount: count,
        industry,
        beat,
        outlet
      });

      return new Response(
        JSON.stringify({
          success: true,
          journalists: enrichedJournalists,
          gapAnalysis,
          needsEnrichment: gapAnalysis.hasGaps
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Standard query mode
    return new Response(
      JSON.stringify({
        success: true,
        journalists: enrichedJournalists,
        count: enrichedJournalists.length,
        requestedCount: count
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Gap Analysis: Detect if we need to search web for more journalists
async function analyzeJournalistGaps(params: {
  journalists: any[];
  requestedCount: number;
  industry?: string;
  beat?: string;
  outlet?: string;
}): Promise<GapAnalysis> {
  const { journalists, requestedCount, industry, beat, outlet } = params;

  const currentCount = journalists.length;
  const missingCount = Math.max(0, requestedCount - currentCount);
  const hasGaps = currentCount < requestedCount;

  const suggestions: string[] = [];

  if (hasGaps) {
    console.log(`⚠️ Gap detected: Have ${currentCount}, need ${requestedCount}`);

    // Suggest strategies to fill gaps
    if (industry) {
      suggestions.push(`Search web for additional ${industry} journalists`);
      suggestions.push(`Look for freelance ${industry} reporters`);
    }

    if (beat) {
      suggestions.push(`Search for "${beat}" coverage across all outlets`);
      suggestions.push(`Check podcast hosts covering ${beat}`);
    }

    if (outlet) {
      suggestions.push(`Search ${outlet}'s masthead for more reporters`);
    }

    if (!industry && !beat && !outlet) {
      suggestions.push('Broaden search criteria to include tier2 journalists');
      suggestions.push('Search web for industry-specific publications');
    }

    // If we have SOME journalists, suggest related searches
    if (currentCount > 0) {
      const outlets = [...new Set(journalists.map(j => j.outlet))];
      const beats = [...new Set(journalists.map(j => j.beat))];

      suggestions.push(`Found journalists from: ${outlets.join(', ')}`);
      suggestions.push(`Covering beats: ${beats.join(', ')}`);
      suggestions.push('Consider searching these outlets for more reporters');
    }
  } else {
    console.log(`✅ No gaps: Have ${currentCount}, requested ${requestedCount}`);
  }

  return {
    hasGaps,
    currentCount,
    requestedCount,
    missingCount,
    suggestions
  };
}
