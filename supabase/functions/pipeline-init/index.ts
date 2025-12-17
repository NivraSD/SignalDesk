/**
 * Pipeline Init - Lightweight profile loader for the intelligence pipeline
 *
 * Purpose: Fast initialization that reads existing company_profile and ensures
 * intelligence_targets exist. Replaces heavy mcp-discovery for pipeline runs.
 *
 * What it does:
 * 1. Load company_profile from organizations table
 * 2. Check if intelligence_targets exist for the org
 * 3. If missing, generate targets from profile (quick Claude call)
 * 4. Return profile + target status for downstream functions
 *
 * Target time: <10 seconds (vs 80s for mcp-discovery)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Quick Claude call for target generation
async function callClaude(prompt: string, maxTokens: number = 2000): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022', // Fast model for simple extraction
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0]?.text || '';
}

// Generate intelligence targets from company profile
async function generateTargetsFromProfile(
  organizationId: string,
  profile: any
): Promise<{ created: number; skipped: number }> {
  const orgName = profile.name || profile.organization_name || 'Unknown';
  const industry = profile.industry || 'Technology';

  console.log(`🎯 Generating targets from profile for ${orgName}`);

  // Extract existing data from profile
  const productLines = (profile.product_lines || []).join(', ') || 'Not specified';
  const keyMarkets = (profile.key_markets || []).join(', ') || 'Not specified';
  const businessModel = profile.business_model || 'Not specified';
  const competitors = (profile.competitors || profile.competition?.direct_competitors || []).slice(0, 10).join(', ') || 'Not specified';
  const description = profile.description || '';
  const leadership = (profile.leadership || []).map((l: any) => `${l.name} (${l.title})`).join(', ') || '';

  // Build a focused prompt using existing profile data - emphasize DIVERSE types
  const prompt = `You are creating intelligence monitoring targets for a company. Generate a DIVERSE set of targets across ALL categories.

COMPANY: ${orgName}
INDUSTRY: ${industry}
DESCRIPTION: ${description}
PRODUCT LINES: ${productLines}
KEY MARKETS: ${keyMarkets}
BUSINESS MODEL: ${businessModel}
KNOWN COMPETITORS: ${competitors}
LEADERSHIP: ${leadership}

IMPORTANT: You MUST generate targets in EACH of these categories (minimum counts shown):

1. COMPETITORS (5-10): Direct competitors in the same space
2. TOPICS (10-15): Industry trends, technologies, and keywords that would appear in relevant news articles. Think about what news topics this company would want to monitor. Examples: "AI automation", "browser automation tools", "enterprise data pipelines", "Series A funding", etc.
3. STAKEHOLDERS (3-5): Target customer segments, partners, industry bodies
4. INFLUENCERS (3-5): Industry analysts, thought leaders, tech journalists who cover this space

Return JSON only - you MUST include all 4 target types:
{
  "targets": [
    {"name": "Target Name", "type": "competitor|topic|stakeholder|influencer", "priority": "high|medium|low"}
  ]
}

Generate 30-40 targets total with the distribution above. Topics should be phrases that would match news article headlines.`;

  try {
    const response = await callClaude(prompt, 2000);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON found in Claude response');
      return { created: 0, skipped: 0 };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const targets = parsed.targets || [];

    let created = 0;
    let skipped = 0;

    for (const target of targets) {
      const { error } = await supabase
        .from('intelligence_targets')
        .insert({
          organization_id: organizationId,
          name: target.name,
          type: target.type,
          target_type: target.type, // Both columns for compatibility
          priority: target.priority || 'medium',
          is_active: true,
        });

      if (error) {
        if (error.code === '23505') { // Duplicate
          skipped++;
        } else {
          console.warn(`Failed to create target "${target.name}":`, error.message);
        }
      } else {
        created++;
      }
    }

    console.log(`✅ Created ${created} targets, skipped ${skipped} duplicates`);
    return { created, skipped };

  } catch (e) {
    console.error('Target generation failed:', e);
    return { created: 0, skipped: 0 };
  }
}

// Trigger embedding generation for new targets
async function triggerEmbeddings(organizationId: string) {
  try {
    const { error } = await supabase.functions.invoke('batch-embed-targets', {
      body: { organization_id: organizationId }
    });
    if (error) {
      console.warn('Embedding trigger failed:', error);
    } else {
      console.log('🔄 Triggered target embedding generation');
    }
  } catch (e) {
    console.warn('Failed to trigger embeddings:', e);
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const {
      organization_id,
      organization_name,
      force_refresh = false, // Force regenerate targets even if they exist
      min_targets = 10, // Minimum targets required before regenerating
    } = body;

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: 'organization_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🚀 Pipeline init for org: ${organization_id}`);

    // Step 1: Load company profile
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, industry, company_profile, settings')
      .eq('id', organization_id)
      .single();

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: `Organization not found: ${orgError?.message}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profile = org.company_profile || {};
    const orgName = organization_name || org.name || 'Unknown';
    const industry = org.industry || profile.industry || 'Technology';

    console.log(`📋 Loaded profile for ${orgName} (${industry})`);
    console.log(`   Product lines: ${profile.product_lines?.length || 0}`);
    console.log(`   Key markets: ${profile.key_markets?.length || 0}`);
    console.log(`   Has competitors: ${!!(profile.competitors || profile.competition?.direct_competitors)}`);

    // Step 2: Check existing targets
    const { count: targetCount, error: countError } = await supabase
      .from('intelligence_targets')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organization_id)
      .eq('is_active', true);

    const existingTargets = targetCount || 0;
    console.log(`🎯 Existing targets: ${existingTargets}`);

    // Step 3: Generate targets if needed
    let targetGeneration = { created: 0, skipped: 0, triggered: false };

    if (force_refresh || existingTargets < min_targets) {
      console.log(`📝 Generating targets (force=${force_refresh}, existing=${existingTargets}, min=${min_targets})`);

      // Enrich profile with org name/industry if missing
      const enrichedProfile = {
        ...profile,
        name: orgName,
        organization_name: orgName,
        industry: industry,
      };

      targetGeneration = await generateTargetsFromProfile(organization_id, enrichedProfile);

      // Trigger embedding if we created new targets
      if (targetGeneration.created > 0) {
        await triggerEmbeddings(organization_id);
        targetGeneration.triggered = true;
      }
    }

    // Step 4: Get final target count by type
    const { data: targetStats } = await supabase
      .from('intelligence_targets')
      .select('type')
      .eq('organization_id', organization_id)
      .eq('is_active', true);

    const targetsByType = (targetStats || []).reduce((acc: Record<string, number>, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {});

    const duration = Date.now() - startTime;
    console.log(`✅ Pipeline init complete in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        organization_id,
        organization_name: orgName,
        industry,
        duration_ms: duration,
        profile: {
          has_profile: Object.keys(profile).length > 0,
          product_lines: profile.product_lines?.length || 0,
          key_markets: profile.key_markets?.length || 0,
          business_model: !!profile.business_model,
          brand_voice: !!profile.brand_voice,
          strategic_priorities: profile.strategic_priorities?.length || 0,
        },
        targets: {
          total: Object.values(targetsByType).reduce((a: number, b: number) => a + b, 0),
          by_type: targetsByType,
          generated: targetGeneration.created,
          skipped: targetGeneration.skipped,
          embeddings_triggered: targetGeneration.triggered,
        },
        // Return full profile for downstream functions
        company_profile: profile,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Pipeline init error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
