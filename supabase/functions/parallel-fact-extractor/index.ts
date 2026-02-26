// Parallel Fact Extractor
// Launches extract-target-facts for EACH org in parallel
// Ensures every org gets fully processed, not starved by high-similarity orgs

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const DEFAULT_MAX_PER_ORG = 30;  // Max matches to process per org
const MIN_SIMILARITY = 0.40;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const maxPerOrg = body.max_per_org || DEFAULT_MAX_PER_ORG;
    const specificOrgs = body.organization_ids;  // Optional: only process these orgs

    console.log('🚀 PARALLEL FACT EXTRACTOR');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Max per org: ${maxPerOrg}`);

    // Get all orgs with pending matches (facts_extracted = false or null)
    let query = supabase
      .from('target_article_matches')
      .select('organization_id')
      .or('facts_extracted.is.null,facts_extracted.eq.false')
      .gte('similarity_score', MIN_SIMILARITY);

    if (specificOrgs && specificOrgs.length > 0) {
      query = query.in('organization_id', specificOrgs);
    }

    const { data: matchData, error: matchError } = await query;

    if (matchError) {
      throw new Error(`Failed to get orgs: ${matchError.message}`);
    }

    // Get unique org IDs
    const uniqueOrgIds = [...new Set((matchData || []).map(m => m.organization_id))];
    console.log(`   Found ${uniqueOrgIds.length} orgs with pending matches\n`);

    if (uniqueOrgIds.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No orgs with pending matches',
        orgs_processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Launch extract-target-facts for EACH org in parallel
    const orgPromises = uniqueOrgIds.map((orgId, index) => {
      console.log(`   Launching extractor for org ${index + 1}/${uniqueOrgIds.length}: ${orgId}`);

      return fetch(`${SUPABASE_URL}/functions/v1/extract-target-facts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: orgId,
          max_matches: maxPerOrg
        })
      }).then(async (res) => {
        const data = await res.json().catch(() => ({ error: 'Parse error' }));
        return {
          org_id: orgId,
          status: res.status,
          facts_extracted: data.facts_extracted || 0,
          matches_processed: data.matches_processed || 0,
          success: data.success
        };
      }).catch((err) => {
        return { org_id: orgId, status: 500, error: err.message, success: false };
      });
    });

    // Wait for all orgs to complete
    const results = await Promise.all(orgPromises);

    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Aggregate stats
    let totalFacts = 0;
    let totalMatches = 0;
    let successfulOrgs = 0;
    let failedOrgs = 0;

    results.forEach((r: any) => {
      if (r.success) {
        successfulOrgs++;
        totalFacts += r.facts_extracted || 0;
        totalMatches += r.matches_processed || 0;
      } else {
        failedOrgs++;
      }
    });

    console.log('\n✅ PARALLEL FACT EXTRACTOR COMPLETE');
    console.log(`   Duration: ${duration}s`);
    console.log(`   Orgs processed: ${successfulOrgs}/${uniqueOrgIds.length}`);
    console.log(`   Total matches: ${totalMatches}`);
    console.log(`   Total facts: ${totalFacts}`);

    return new Response(JSON.stringify({
      success: true,
      duration_seconds: duration,
      orgs_launched: uniqueOrgIds.length,
      orgs_successful: successfulOrgs,
      orgs_failed: failedOrgs,
      total_matches_processed: totalMatches,
      total_facts_extracted: totalFacts,
      org_results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Parallel fact extractor error:', error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
