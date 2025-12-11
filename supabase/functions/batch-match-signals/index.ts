// Batch Match Signals
// Matches embedded articles against embedded targets
// Stores matches in target_article_matches table

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Similarity thresholds - different by target type
// Lowered to allow more candidates through - Claude ranking handles quality
// Title-only sources like Bloomberg need lower thresholds to match
const THRESHOLD_BY_TYPE: Record<string, number> = {
  topic: 0.42,           // Topics are broad but Claude will filter
  keyword: 0.42,         // Keywords are broad too
  competitor: 0.35,      // Company names - lower for title-only matching
  stakeholder: 0.38,     // People/orgs
  influencer: 0.38,      // People
  regulator: 0.38,       // Regulatory bodies
  customer: 0.35,        // Company names
  partner: 0.35,         // Company names
  default: 0.38          // Default threshold
};

const STRONG_SIGNAL_THRESHOLD = 0.50;
const MODERATE_SIGNAL_THRESHOLD = 0.40;
const WEAK_SIGNAL_THRESHOLD = 0.32;

function getThresholdForTargetType(targetType: string): number {
  return THRESHOLD_BY_TYPE[targetType.toLowerCase()] || THRESHOLD_BY_TYPE.default;
}

interface Target {
  id: string;
  name: string;
  target_type: string;
  organization_id: string;
  embedding: number[];
}

interface ArticleMatch {
  id: string;
  title: string;
  source_name: string;
  similarity: number;
}

function classifySignalStrength(similarity: number): string {
  if (similarity >= STRONG_SIGNAL_THRESHOLD) return 'strong';
  if (similarity >= MODERATE_SIGNAL_THRESHOLD) return 'moderate';
  return 'weak';
}

function categorizeSignal(targetType: string, similarity: number): string {
  // Base category on target type
  const typeCategories: Record<string, string> = {
    competitor: 'competitive_intelligence',
    customer: 'customer_activity',
    prospect: 'prospect_activity',
    partner: 'partnership',
    industry_trend: 'market_trend',
    regulatory: 'regulatory',
    technology: 'technology',
    market: 'market_trend',
    person: 'key_person',
    executive: 'key_person'
  };

  return typeCategories[targetType.toLowerCase()] || 'general';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organization_id; // Optional: match only for specific org
    const hoursBack = body.hours_back || 24; // How far back to look for articles
    const maxArticlesPerTarget = body.max_articles || 50;
    const minSimilarity = body.min_similarity || WEAK_SIGNAL_THRESHOLD;

    console.log('🔗 BATCH MATCH SIGNALS');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Hours back: ${hoursBack}`);
    console.log(`   Max articles per target: ${maxArticlesPerTarget}`);
    console.log(`   Min similarity: ${minSimilarity}`);
    if (organizationId) {
      console.log(`   Organization: ${organizationId}`);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get all active targets with embeddings
    let targetQuery = supabase
      .from('intelligence_targets')
      .select('id, name, target_type, organization_id, embedding')
      .eq('is_active', true)
      .not('embedding', 'is', null);

    if (organizationId) {
      targetQuery = targetQuery.eq('organization_id', organizationId);
    }

    const { data: targets, error: targetError } = await targetQuery;

    if (targetError) {
      throw new Error(`Failed to fetch targets: ${targetError.message}`);
    }

    if (!targets || targets.length === 0) {
      console.log('   No embedded targets found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No embedded targets to match',
        targets_processed: 0,
        matches_created: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`   Found ${targets.length} targets with embeddings`);

    // Calculate the time cutoff
    const sinceTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    let totalMatches = 0;
    let totalNewMatches = 0;
    const targetResults: Array<{ target_id: string; name: string; matches: number; new_matches: number }> = [];

    // For each target, find matching articles using the SQL function
    for (const target of targets as Target[]) {
      try {
        // Use per-target-type threshold (topics need higher threshold than competitors)
        const targetThreshold = Math.max(minSimilarity, getThresholdForTargetType(target.target_type));

        // Use the match_articles_to_target SQL function
        const { data: matches, error: matchError } = await supabase.rpc(
          'match_articles_to_target',
          {
            target_embedding: target.embedding,
            similarity_threshold: targetThreshold,
            max_results: maxArticlesPerTarget,
            since_time: sinceTime
          }
        );

        if (matchError) {
          console.error(`   Error matching target ${target.name}: ${matchError.message}`);
          continue;
        }

        if (!matches || matches.length === 0) {
          targetResults.push({
            target_id: target.id,
            name: target.name,
            matches: 0,
            new_matches: 0
          });
          continue;
        }

        // Insert matches (using upsert to handle duplicates)
        const matchRecords = (matches as ArticleMatch[]).map(m => ({
          organization_id: target.organization_id,
          target_id: target.id,
          article_id: m.id,
          similarity_score: m.similarity,
          match_type: 'semantic',
          signal_strength: classifySignalStrength(m.similarity),
          signal_category: categorizeSignal(target.target_type, m.similarity),
          match_reason: `Semantic similarity: ${(m.similarity * 100).toFixed(1)}%`,
          matched_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        }));

        const { data: upsertResult, error: upsertError } = await supabase
          .from('target_article_matches')
          .upsert(matchRecords, {
            onConflict: 'target_id,article_id',
            ignoreDuplicates: false
          })
          .select('id');

        if (upsertError) {
          console.error(`   Error saving matches for ${target.name}: ${upsertError.message}`);
          continue;
        }

        const newMatchCount = upsertResult?.length || 0;
        totalMatches += matches.length;
        totalNewMatches += newMatchCount;

        targetResults.push({
          target_id: target.id,
          name: target.name,
          matches: matches.length,
          new_matches: newMatchCount
        });

        console.log(`   ${target.name}: ${matches.length} matches (${newMatchCount} new)`);
      } catch (err) {
        console.error(`   Error processing target ${target.name}:`, err);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('📊 RESULTS:');
    console.log(`   Targets processed: ${targets.length}`);
    console.log(`   Total matches: ${totalMatches}`);
    console.log(`   New matches: ${totalNewMatches}`);
    console.log(`   Duration: ${duration}s`);

    // Log job to embedding_jobs table
    await supabase.from('embedding_jobs').insert({
      job_type: 'matching',
      status: 'completed',
      items_total: targets.length,
      items_processed: targetResults.filter(r => r.matches > 0).length,
      items_failed: targetResults.filter(r => r.matches === 0).length,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      metadata: {
        hours_back: hoursBack,
        total_matches: totalMatches,
        new_matches: totalNewMatches,
        organization_id: organizationId || null
      }
    });

    return new Response(JSON.stringify({
      success: true,
      targets_processed: targets.length,
      total_matches: totalMatches,
      new_matches: totalNewMatches,
      duration_seconds: duration,
      target_results: targetResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
