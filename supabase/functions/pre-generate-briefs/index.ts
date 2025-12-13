// Pre-Generate Briefs
// Runs before users wake up to pre-cache article selections for all active orgs
// This ensures dashboards load instantly at 8 AM EST
//
// Schedule: 12:40 UTC (7:40 AM EST) - after all pipeline steps complete

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CACHE_EXPIRY_HOURS = 4; // Cache valid for 4 hours
const MAX_ORGS_PER_RUN = 20; // Limit to prevent timeout
const HOURS_BACK = 24; // Default hours for article selection

interface OrgResult {
  org_id: string;
  org_name: string;
  success: boolean;
  article_count?: number;
  duration_ms?: number;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const maxOrgs = body.max_orgs || MAX_ORGS_PER_RUN;
    const hoursBack = body.hours_back || HOURS_BACK;
    const forceRefresh = body.force_refresh || false;
    const specificOrgId = body.organization_id; // Optional: only generate for specific org

    console.log('🔄 PRE-GENERATE BRIEFS');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Max orgs: ${maxOrgs}`);
    console.log(`   Hours back: ${hoursBack}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get active organizations with intelligence targets
    let orgsQuery = supabase
      .from('organizations')
      .select(`
        id,
        name,
        industry,
        intelligence_targets!inner(id)
      `)
      .limit(maxOrgs);

    if (specificOrgId) {
      orgsQuery = orgsQuery.eq('id', specificOrgId);
    }

    const { data: orgs, error: orgsError } = await orgsQuery;

    if (orgsError) {
      throw new Error(`Failed to fetch organizations: ${orgsError.message}`);
    }

    // Deduplicate orgs (inner join may cause duplicates)
    const uniqueOrgs = Array.from(
      new Map((orgs || []).map(o => [o.id, o])).values()
    );

    console.log(`   Found ${uniqueOrgs.length} active organizations`);

    // Check which orgs need refresh (no valid cache)
    const cacheKey = `daily_${hoursBack}h`;
    const { data: existingCaches } = await supabase
      .from('cached_briefs')
      .select('organization_id, generated_at, expires_at')
      .eq('cache_type', 'article_selection')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString());

    const cachedOrgIds = new Set((existingCaches || []).map(c => c.organization_id));

    const orgsToProcess = forceRefresh
      ? uniqueOrgs
      : uniqueOrgs.filter(o => !cachedOrgIds.has(o.id));

    console.log(`   Orgs needing refresh: ${orgsToProcess.length}`);

    const results: OrgResult[] = [];

    // Process each organization
    for (const org of orgsToProcess) {
      const orgStartTime = Date.now();
      console.log(`\n   Processing: ${org.name} (${org.id})`);

      try {
        // Call article-selector-v5 for this org
        const selectorResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/article-selector-v5`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              organization_id: org.id,
              organization_name: org.name,
              hours_back: hoursBack,
              min_signal_strength: 'weak',
              include_connections: true
            })
          }
        );

        if (!selectorResponse.ok) {
          const errorText = await selectorResponse.text();
          throw new Error(`Selector failed: ${selectorResponse.status} - ${errorText}`);
        }

        const selectorData = await selectorResponse.json();
        const orgDuration = Date.now() - orgStartTime;

        // Upsert to cached_briefs
        const { error: upsertError } = await supabase
          .from('cached_briefs')
          .upsert({
            organization_id: org.id,
            cache_type: 'article_selection',
            cache_key: cacheKey,
            cached_data: selectorData,
            article_count: selectorData.total_articles || 0,
            generation_time_ms: orgDuration,
            generated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + CACHE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
          }, {
            onConflict: 'organization_id,cache_type,cache_key'
          });

        if (upsertError) {
          throw new Error(`Cache upsert failed: ${upsertError.message}`);
        }

        results.push({
          org_id: org.id,
          org_name: org.name,
          success: true,
          article_count: selectorData.total_articles || 0,
          duration_ms: orgDuration
        });

        console.log(`   ✅ ${org.name}: ${selectorData.total_articles} articles in ${orgDuration}ms`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          org_id: org.id,
          org_name: org.name,
          success: false,
          error: errorMessage
        });
        console.error(`   ❌ ${org.name}: ${errorMessage}`);
      }
    }

    // Cleanup expired caches
    const { data: cleanupResult } = await supabase.rpc('cleanup_expired_caches');
    console.log(`\n   Cleaned up ${cleanupResult || 0} expired caches`);

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const totalArticles = results.reduce((sum, r) => sum + (r.article_count || 0), 0);

    console.log('\n📊 PRE-GENERATE COMPLETE:');
    console.log(`   Total orgs processed: ${results.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Total articles cached: ${totalArticles}`);
    console.log(`   Duration: ${totalDuration}ms`);

    return new Response(JSON.stringify({
      success: true,
      summary: {
        orgs_found: uniqueOrgs.length,
        orgs_already_cached: cachedOrgIds.size,
        orgs_processed: results.length,
        successful: successCount,
        failed: failCount,
        total_articles_cached: totalArticles,
        duration_ms: totalDuration
      },
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Pre-generate error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
