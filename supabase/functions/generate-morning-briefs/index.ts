// Generate Morning Briefs
// Runs the FULL intelligence pipeline for each org, caching the executive synthesis
// This enables truly instant dashboard loading at 8 AM EST
//
// Pipeline steps:
//   1. Get articles (from cached_briefs or fresh via article-selector-v5)
//   2. Relevance filter (monitor-stage-2-relevance)
//   3. Enrichment (monitoring-stage-2-enrichment)
//   4. Executive synthesis (mcp-executive-synthesis) - THE ACTUAL BRIEF
//
// Schedule: 12:50 UTC (7:50 AM EST) - after pre-generate-briefs

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CACHE_EXPIRY_HOURS = 4;
const MAX_ORGS_PER_RUN = 10; // Limit due to synthesis being expensive
const HOURS_BACK = 24;

interface OrgResult {
  org_id: string;
  org_name: string;
  success: boolean;
  article_count?: number;
  synthesis_cached?: boolean;
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
    const specificOrgId = body.organization_id;

    console.log('📋 GENERATE MORNING BRIEFS (Full Pipeline)');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Max orgs: ${maxOrgs}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get organizations with intelligence targets
    let orgsQuery = supabase
      .from('organizations')
      .select(`
        id,
        name,
        industry,
        company_profile,
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

    // Deduplicate
    const uniqueOrgs = Array.from(
      new Map((orgs || []).map(o => [o.id, o])).values()
    );

    console.log(`   Found ${uniqueOrgs.length} organizations`);

    // Check which orgs already have cached synthesis
    const cacheKey = `synthesis_${hoursBack}h`;
    const { data: existingCaches } = await supabase
      .from('cached_briefs')
      .select('organization_id')
      .eq('cache_type', 'executive_synthesis')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString());

    const cachedOrgIds = new Set((existingCaches || []).map(c => c.organization_id));

    const orgsToProcess = forceRefresh
      ? uniqueOrgs
      : uniqueOrgs.filter(o => !cachedOrgIds.has(o.id));

    console.log(`   Orgs needing synthesis: ${orgsToProcess.length}`);

    const results: OrgResult[] = [];

    for (const org of orgsToProcess) {
      const orgStartTime = Date.now();
      console.log(`\n   Processing: ${org.name}`);

      try {
        // Build company profile for pipeline
        const profile = org.company_profile || {};

        // STEP 1: Get articles (from cache or fresh)
        const articleCacheKey = `daily_${hoursBack}h`;
        const { data: cachedArticles } = await supabase
          .from('cached_briefs')
          .select('cached_data')
          .eq('organization_id', org.id)
          .eq('cache_type', 'article_selection')
          .eq('cache_key', articleCacheKey)
          .gt('expires_at', new Date().toISOString())
          .single();

        let articles: any[];

        if (cachedArticles?.cached_data?.articles) {
          articles = cachedArticles.cached_data.articles;
          console.log(`     Step 1: Using ${articles.length} cached articles`);
        } else {
          // Fetch fresh
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
                min_signal_strength: 'weak'
              })
            }
          );

          if (!selectorResponse.ok) {
            throw new Error(`Article selector failed: ${selectorResponse.status}`);
          }

          const selectorData = await selectorResponse.json();
          articles = selectorData.articles || [];
          console.log(`     Step 1: Selected ${articles.length} fresh articles`);
        }

        if (!articles.length) {
          console.log(`     Skipping - no articles`);
          results.push({
            org_id: org.id,
            org_name: org.name,
            success: true,
            article_count: 0,
            synthesis_cached: false
          });
          continue;
        }

        // STEP 2: Relevance filter
        const relevanceResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/monitor-stage-2-relevance`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              articles: articles,
              profile: profile,
              organization_name: org.name
            })
          }
        );

        if (!relevanceResponse.ok) {
          throw new Error(`Relevance filter failed: ${relevanceResponse.status}`);
        }

        const relevanceData = await relevanceResponse.json();
        const relevantArticles = relevanceData.relevant_articles || relevanceData.articles || articles;
        console.log(`     Step 2: Relevance ${articles.length} → ${relevantArticles.length}`);

        // STEP 3: Enrichment
        const enrichmentResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/monitoring-stage-2-enrichment`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              articles: relevantArticles,
              profile: profile,
              organization_name: org.name
            })
          }
        );

        if (!enrichmentResponse.ok) {
          throw new Error(`Enrichment failed: ${enrichmentResponse.status}`);
        }

        const enrichedData = await enrichmentResponse.json();
        console.log(`     Step 3: Enriched ${enrichedData.articles?.length || relevantArticles.length} articles`);

        // STEP 4: Executive Synthesis (THE ACTUAL BRIEF)
        // This is an MCP-style function that expects { method, params }
        const synthesisResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/mcp-executive-synthesis`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              method: 'tools/call',
              params: {
                name: 'synthesize_executive_intelligence',
                arguments: {
                  enriched_data: enrichedData,
                  profile: profile,
                  organization_name: org.name,
                  industry: org.industry
                }
              }
            })
          }
        );

        if (!synthesisResponse.ok) {
          const errorText = await synthesisResponse.text();
          throw new Error(`Synthesis failed: ${synthesisResponse.status} - ${errorText.slice(0, 200)}`);
        }

        // MCP response format: { content: [{ type: "text", text: "JSON string" }] }
        const synthesisResponseData = await synthesisResponse.json();
        let synthesisData;

        if (synthesisResponseData.content && synthesisResponseData.content[0]?.text) {
          // Parse the MCP-wrapped JSON response
          synthesisData = JSON.parse(synthesisResponseData.content[0].text);
        } else {
          // Fallback to direct response (if format changes)
          synthesisData = synthesisResponseData;
        }
        console.log(`     Step 4: Synthesis complete`);

        // Cache the full synthesis result
        const { error: upsertError } = await supabase
          .from('cached_briefs')
          .upsert({
            organization_id: org.id,
            cache_type: 'executive_synthesis',
            cache_key: cacheKey,
            cached_data: {
              synthesis: synthesisData,
              articles: relevantArticles,
              enriched_data: enrichedData,
              generated_at: new Date().toISOString()
            },
            article_count: relevantArticles.length,
            generation_time_ms: Date.now() - orgStartTime,
            generated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + CACHE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
          }, {
            onConflict: 'organization_id,cache_type,cache_key'
          });

        if (upsertError) {
          throw new Error(`Cache upsert failed: ${upsertError.message}`);
        }

        const orgDuration = Date.now() - orgStartTime;
        results.push({
          org_id: org.id,
          org_name: org.name,
          success: true,
          article_count: relevantArticles.length,
          synthesis_cached: true,
          duration_ms: orgDuration
        });

        console.log(`     ✅ Complete in ${orgDuration}ms`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          org_id: org.id,
          org_name: org.name,
          success: false,
          error: errorMessage
        });
        console.error(`     ❌ ${errorMessage}`);
      }
    }

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const synthesizedCount = results.filter(r => r.synthesis_cached).length;

    console.log('\n📊 MORNING BRIEFS COMPLETE:');
    console.log(`   Processed: ${results.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Briefs cached: ${synthesizedCount}`);
    console.log(`   Duration: ${totalDuration}ms`);

    return new Response(JSON.stringify({
      success: true,
      summary: {
        orgs_found: uniqueOrgs.length,
        orgs_already_cached: cachedOrgIds.size,
        orgs_processed: results.length,
        successful: successCount,
        briefs_cached: synthesizedCount,
        duration_ms: totalDuration
      },
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Generate briefs error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
