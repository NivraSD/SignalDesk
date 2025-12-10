// Intelligence Pipeline Simple
// Connects V5 batch scraper to existing intelligence pipeline
// Replaces niv-source-direct-monitor with article-selector

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, organization_name } = await req.json();

    console.log('🚀 INTELLIGENCE PIPELINE (V5 SIMPLE)');
    console.log(`   Organization: ${organization_name}`);
    console.log(`   Time: ${new Date().toISOString()}\n`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ================================================================
    // STEP 1: Get company profile from database
    // ================================================================
    console.log('📋 Step 1: Loading company profile...');

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organization_id)
      .single();

    if (orgError || !org) {
      throw new Error(`Failed to fetch organization: ${orgError?.message}`);
    }

    const profile = org.company_profile || {};
    console.log(`✅ Profile loaded (industry: ${org.industry})\n`);

    // ================================================================
    // STEP 2: Select articles from raw_articles (replaces monitor-stage-1)
    // ================================================================
    console.log('📰 Step 2: Selecting articles from V5 batch scraper...');

    // Use V5 embedding-based selector for semantic matching
    const articleResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/article-selector-v5`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id,
          organization_name: organization_name || org.name,
          hours_back: 24,
          min_signal_strength: 'weak'
        })
      }
    );

    if (!articleResponse.ok) {
      throw new Error(`Article selection failed: ${await articleResponse.text()}`);
    }

    const articleData = await articleResponse.json();
    console.log(`✅ Selected ${articleData.total_articles} articles from ${articleData.sources.length} sources\n`);

    // ================================================================
    // STEP 3: Enrich articles (extract events/entities with Claude)
    // ================================================================
    console.log('🔍 Step 3: Enriching articles...');

    const enrichmentResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/monitoring-stage-2-enrichment`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id,
          organization_name: organization_name || org.name,
          profile: {
            ...profile,
            organization: organization_name || org.name,
            industry: org.industry
          },
          articles: articleData.articles // Pass selected articles
        })
      }
    );

    if (!enrichmentResponse.ok) {
      throw new Error(`Enrichment failed: ${await enrichmentResponse.text()}`);
    }

    const enrichmentData = await enrichmentResponse.json();
    console.log(`✅ Enrichment complete\n`);

    // ================================================================
    // STEP 4: Executive synthesis
    // ================================================================
    console.log('📊 Step 4: Generating executive synthesis...');

    const synthesisResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/mcp-executive-synthesis`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: 'synthesize_executive_intelligence',
          arguments: {
            organization_id,
            organization_name: organization_name || org.name,
            enriched_data: enrichmentData
          }
        })
      }
    );

    if (!synthesisResponse.ok) {
      throw new Error(`Synthesis failed: ${await synthesisResponse.text()}`);
    }

    const synthesisData = await synthesisResponse.json();
    console.log(`✅ Synthesis complete\n`);

    // ================================================================
    // STEP 5: Opportunity detection
    // ================================================================
    console.log('💡 Step 5: Detecting opportunities...');

    const opportunityResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/mcp-opportunities`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: 'detect_opportunities',
          arguments: {
            organization_id,
            organization_name: organization_name || org.name,
            synthesis: synthesisData.content?.[0] || synthesisData,
            enriched_data: enrichmentData
          }
        })
      }
    );

    if (!opportunityResponse.ok) {
      throw new Error(`Opportunity detection failed: ${await opportunityResponse.text()}`);
    }

    const opportunityData = await opportunityResponse.json();
    console.log(`✅ Opportunities detected\n`);

    // ================================================================
    // FINAL RESPONSE
    // ================================================================
    console.log('=' .repeat(80));
    console.log('✅ PIPELINE COMPLETE');
    console.log('=' .repeat(80));

    const response = {
      success: true,
      organization_id,
      organization_name: organization_name || org.name,

      // Pipeline stages
      stages: {
        profile: {
          status: 'complete',
          industry: org.industry
        },
        articles: {
          status: 'complete',
          total: articleData.total_articles,
          sources: articleData.sources.length
        },
        enrichment: {
          status: 'complete'
        },
        synthesis: {
          status: 'complete'
        },
        opportunities: {
          status: 'complete'
        }
      },

      // Intelligence outputs
      executive_synthesis: synthesisData.content?.[0] || synthesisData,
      opportunities: opportunityData.content?.[0] || opportunityData,

      // Metadata
      processed_at: new Date().toISOString(),
      pipeline_version: 'v5_simple'
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Pipeline failed:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      pipeline_version: 'v5_simple'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
