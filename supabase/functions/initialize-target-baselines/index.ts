// Initialize Target Baselines - Backfills historical activity data for intelligence targets
// Run this once to populate baseline_metrics and activity_count from existing signals

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { organization_id } = await req.json();

    console.log(`🎯 Initializing Target Baselines`);
    console.log(`   Organization: ${organization_id || 'ALL'}`);

    // Get all intelligence targets (optionally filtered by org)
    let query = supabase
      .from('intelligence_targets')
      .select('id, name, target_type, organization_id, activity_count, baseline_metrics')
      .eq('is_active', true);

    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    }

    const { data: targets, error: targetsError } = await query;

    if (targetsError) {
      throw new Error(`Failed to load targets: ${targetsError.message}`);
    }

    console.log(`   Found ${targets?.length || 0} targets to process`);

    const results = {
      processed: 0,
      updated: 0,
      signals_linked: 0,
      errors: [] as string[]
    };

    for (const target of targets || []) {
      try {
        // Count signals that mention this target by name
        const { count: signalsByName } = await supabase
          .from('signals')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', target.organization_id)
          .or(`primary_target_name.ilike.%${target.name}%,related_target_names.cs.{${target.name}}`);

        // Count signals linked by FK
        const { count: signalsByFK } = await supabase
          .from('signals')
          .select('*', { count: 'exact', head: true })
          .eq('primary_target_id', target.id);

        // Count predictions mentioning this target
        const { count: predictionsCount } = await supabase
          .from('predictions')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', target.organization_id)
          .or(`title.ilike.%${target.name}%,description.ilike.%${target.name}%`);

        // Count connections mentioning this target
        const { count: connectionsCount } = await supabase
          .from('connection_signals')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', target.organization_id)
          .or(`primary_entity_name.ilike.%${target.name}%,signal_title.ilike.%${target.name}%`);

        // Get recent articles mentioning this target (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: recentArticles } = await supabase
          .from('enriched_articles')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', target.organization_id)
          .gte('published_at', thirtyDaysAgo.toISOString())
          .or(`title.ilike.%${target.name}%,summary.ilike.%${target.name}%`);

        const totalSignals = (signalsByName || 0) + (signalsByFK || 0);
        const totalActivity = totalSignals + (predictionsCount || 0) + (connectionsCount || 0);

        // Calculate baseline metrics
        const baselineMetrics = {
          signals_by_name: signalsByName || 0,
          signals_by_fk: signalsByFK || 0,
          predictions_count: predictionsCount || 0,
          connections_count: connectionsCount || 0,
          recent_articles_30d: recentArticles || 0,
          total_historical_activity: totalActivity,
          avg_monthly_activity: Math.round(totalActivity / 3), // Rough estimate
          baseline_calculated_at: new Date().toISOString(),
          activity_trend: recentArticles && recentArticles > (totalActivity / 3) ? 'increasing' : 'stable'
        };

        // Get most recent signal date
        const { data: recentSignal } = await supabase
          .from('signals')
          .select('detected_at, title')
          .eq('organization_id', target.organization_id)
          .or(`primary_target_name.ilike.%${target.name}%,primary_target_id.eq.${target.id}`)
          .order('detected_at', { ascending: false })
          .limit(1)
          .single();

        // Update the target with baseline data
        const { error: updateError } = await supabase
          .from('intelligence_targets')
          .update({
            activity_count: totalActivity,
            baseline_metrics: baselineMetrics,
            last_activity_at: recentSignal?.detected_at || null,
            last_activity_summary: recentSignal?.title ? `Signal: ${recentSignal.title.substring(0, 100)}` : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', target.id);

        if (updateError) {
          results.errors.push(`Failed to update ${target.name}: ${updateError.message}`);
        } else {
          results.updated++;
          results.signals_linked += totalSignals;
          console.log(`   ✅ ${target.name}: ${totalActivity} total activity (${signalsByName} by name, ${signalsByFK} by FK)`);
        }

        results.processed++;

      } catch (e: any) {
        results.errors.push(`Error processing ${target.name}: ${e.message}`);
        results.processed++;
      }
    }

    // Now try to link existing signals to targets by name matching
    console.log(`\n📊 Linking unlinked signals to targets...`);

    for (const target of targets || []) {
      // Find signals that mention this target but aren't linked by FK
      const { data: unlinkedSignals } = await supabase
        .from('signals')
        .select('id, title, primary_target_name')
        .eq('organization_id', target.organization_id)
        .is('primary_target_id', null)
        .ilike('primary_target_name', `%${target.name}%`);

      if (unlinkedSignals && unlinkedSignals.length > 0) {
        for (const signal of unlinkedSignals) {
          // Check if the name matches closely enough
          if (signal.primary_target_name?.toLowerCase().includes(target.name.toLowerCase())) {
            const { error } = await supabase
              .from('signals')
              .update({
                primary_target_id: target.id,
                primary_target_type: target.target_type
              })
              .eq('id', signal.id);

            if (!error) {
              console.log(`   🔗 Linked signal "${signal.title?.substring(0, 40)}..." to ${target.name}`);
            }
          }
        }
      }
    }

    console.log(`\n✅ Baseline Initialization Complete`);
    console.log(`   Processed: ${results.processed}`);
    console.log(`   Updated: ${results.updated}`);
    console.log(`   Signals linked: ${results.signals_linked}`);
    console.log(`   Errors: ${results.errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      ...results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Baseline initialization error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
