// Article Selector V5
// Fast article selection using pre-computed target matches
// Returns both target-grouped data AND V4-compatible flat articles array

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Source diversity settings (matching V4)
const MAX_PER_SOURCE = 15;  // Prevent any single source from dominating
const DEFAULT_HOURS_BACK = 18;  // 18 hours for daily scrapes

interface TargetMatch {
  target_id: string;
  target_name: string;
  target_type: string;
  priority: string;
  articles: Array<{
    id: string;
    title: string;
    description: string | null;
    url: string;
    source_name: string;
    published_at: string;
    similarity_score: number;
    signal_strength: string;
    signal_category: string;
  }>;
}

interface CrossTargetArticle {
  article_id: string;
  title: string;
  source_name: string;
  targets: Array<{
    target_id: string;
    target_name: string;
    similarity: number;
  }>;
}

// V4-compatible article format
interface V4Article {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source_name: string;
  published_at: string;
  relevance_score: number;
  matched_targets: string[];
  signal_strength: string;
  signal_category: string;
  is_priority_source?: boolean;  // From company profile priority sources
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organization_id;
    const organizationName = body.organization_name; // Optional, for V4 compat
    const hoursBack = body.hours_back || DEFAULT_HOURS_BACK;
    const minSignalStrength = body.min_signal_strength || 'weak'; // weak, moderate, strong
    const maxArticlesPerTarget = body.max_articles_per_target || 10;
    const includeConnections = body.include_connections !== false; // Default true

    if (!organizationId) {
      return new Response(JSON.stringify({
        error: 'organization_id is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📰 ARTICLE SELECTOR V5 (Pre-computed Matches)');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Organization: ${organizationId}`);
    console.log(`   Hours back: ${hoursBack}`);
    console.log(`   Min signal strength: ${minSignalStrength}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get organization details including company_profile for priority sources
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, industry, company_profile')
      .eq('id', organizationId)
      .single();

    const orgName = organizationName || org?.name || 'Unknown';
    const industry = org?.industry || 'default';
    const companyProfile = org?.company_profile || {};

    // Extract priority sources from company profile (set by mcp-discovery)
    const sourcePriorities = companyProfile.monitoring_config?.source_priorities || {};
    const criticalSources = new Set<string>(sourcePriorities.critical || []);
    const highPrioritySources = new Set<string>(sourcePriorities.high || []);
    const allPrioritySources = new Set<string>([...criticalSources, ...highPrioritySources]);

    if (allPrioritySources.size > 0) {
      console.log(`   Priority sources: ${criticalSources.size} critical, ${highPrioritySources.size} high`);
    }

    // Calculate time cutoff
    const sinceTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    // Get all targets for this org
    const { data: targets, error: targetError } = await supabase
      .from('intelligence_targets')
      .select('id, name, target_type, priority')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('priority');

    if (targetError) {
      throw new Error(`Failed to fetch targets: ${targetError.message}`);
    }

    // Build signal strength filter
    const strengthFilter = minSignalStrength === 'strong'
      ? ['strong']
      : minSignalStrength === 'moderate'
        ? ['strong', 'moderate']
        : ['strong', 'moderate', 'weak'];

    // Get matches grouped by target
    const targetMatches: TargetMatch[] = [];
    const articleMap = new Map<string, V4Article>(); // For deduplication
    const sourceDistribution: Record<string, number> = {};

    for (const target of targets || []) {
      const { data: matches, error: matchError } = await supabase
        .from('target_article_matches')
        .select(`
          similarity_score,
          signal_strength,
          signal_category,
          article:raw_articles(
            id, title, description, url, source_name, published_at
          )
        `)
        .eq('target_id', target.id)
        .gte('matched_at', sinceTime)
        .in('signal_strength', strengthFilter)
        .order('similarity_score', { ascending: false })
        .limit(maxArticlesPerTarget);

      if (matchError) {
        console.error(`Error fetching matches for ${target.name}:`, matchError.message);
        continue;
      }

      if (matches && matches.length > 0) {
        const articles = matches
          .filter(m => m.article) // Filter out any nulls
          .map(m => ({
            id: (m.article as any).id,
            title: (m.article as any).title,
            description: (m.article as any).description,
            url: (m.article as any).url,
            source_name: (m.article as any).source_name,
            published_at: (m.article as any).published_at,
            similarity_score: m.similarity_score,
            signal_strength: m.signal_strength,
            signal_category: m.signal_category
          }));

        // Build V4-compatible flat list with deduplication
        articles.forEach(a => {
          const existing = articleMap.get(a.id);
          if (existing) {
            // Article already seen - add this target to matched_targets
            if (!existing.matched_targets.includes(target.name)) {
              existing.matched_targets.push(target.name);
            }
            // Keep highest relevance score
            const newScore = Math.round(a.similarity_score * 100);
            if (newScore > existing.relevance_score) {
              existing.relevance_score = newScore;
              existing.signal_strength = a.signal_strength;
              existing.signal_category = a.signal_category;
            }
          } else {
            // New article
            articleMap.set(a.id, {
              id: a.id,
              title: a.title,
              description: a.description,
              url: a.url,
              source_name: a.source_name,
              published_at: a.published_at,
              relevance_score: Math.round(a.similarity_score * 100),
              matched_targets: [target.name],
              signal_strength: a.signal_strength,
              signal_category: a.signal_category,
              is_priority_source: allPrioritySources.has(a.source_name)
            });
            // Track source distribution
            sourceDistribution[a.source_name] = (sourceDistribution[a.source_name] || 0) + 1;
          }
        });

        targetMatches.push({
          target_id: target.id,
          target_name: target.name,
          target_type: target.target_type,
          priority: target.priority,
          articles
        });
      }
    }

    // Build V4-compatible articles array sorted by:
    // 1. Critical priority sources first
    // 2. High priority sources second
    // 3. Then by relevance score
    // Apply source diversity cap to prevent any single source from dominating
    const sortedArticles = Array.from(articleMap.values())
      .sort((a, b) => {
        // Priority source tier: critical=2, high=1, other=0
        const aPriority = criticalSources.has(a.source_name) ? 2 : highPrioritySources.has(a.source_name) ? 1 : 0;
        const bPriority = criticalSources.has(b.source_name) ? 2 : highPrioritySources.has(b.source_name) ? 1 : 0;

        // Sort by priority tier first, then by relevance score
        if (aPriority !== bPriority) {
          return bPriority - aPriority;  // Higher priority first
        }
        return b.relevance_score - a.relevance_score;
      });

    const sourceCount: Record<string, number> = {};
    const v4Articles = sortedArticles.filter(a => {
      const count = sourceCount[a.source_name] || 0;
      if (count >= MAX_PER_SOURCE) {
        return false;  // Skip - source already at max
      }
      sourceCount[a.source_name] = count + 1;
      return true;
    });

    // Recalculate source distribution after diversity cap
    const finalSourceDistribution: Record<string, number> = {};
    v4Articles.forEach(a => {
      finalSourceDistribution[a.source_name] = (finalSourceDistribution[a.source_name] || 0) + 1;
    });

    const skippedForDiversity = sortedArticles.length - v4Articles.length;
    if (skippedForDiversity > 0) {
      console.log(`   ⚖️ Source diversity: skipped ${skippedForDiversity} articles (max ${MAX_PER_SOURCE} per source)`);
    }

    // Get cross-target connections (articles matching multiple targets)
    let connections: CrossTargetArticle[] = [];

    if (includeConnections) {
      const { data: crossMatches, error: crossError } = await supabase.rpc(
        'find_cross_target_articles',
        {
          org_id: organizationId,
          min_targets: 2,
          since_time: sinceTime
        }
      );

      if (!crossError && crossMatches) {
        connections = crossMatches.map((c: any) => ({
          article_id: c.article_id,
          title: c.title,
          source_name: c.source_name,
          targets: c.targets
        }));
      }
    }

    // Get signal summary by target
    const { data: signalSummary, error: summaryError } = await supabase.rpc(
      'get_target_signal_summary',
      {
        org_id: organizationId,
        since_time: sinceTime
      }
    );

    const duration = Date.now() - startTime;
    const durationSeconds = Math.round(duration / 1000);

    // Count priority source articles
    const prioritySourceCount = v4Articles.filter(a => a.is_priority_source).length;

    console.log('📊 RESULTS:');
    console.log(`   Targets with signals: ${targetMatches.length}`);
    console.log(`   Total unique articles: ${v4Articles.length}`);
    console.log(`   From priority sources: ${prioritySourceCount}`);
    console.log(`   Cross-target connections: ${connections.length}`);
    console.log(`   Duration: ${duration}ms`);

    return new Response(JSON.stringify({
      // === V4-COMPATIBLE FIELDS (for downstream pipeline) ===
      success: true,
      organization_id: organizationId,
      organization_name: orgName,
      industry,
      total_articles: v4Articles.length,
      articles: v4Articles,  // Flat list for V4 compatibility
      sources: Object.keys(finalSourceDistribution),
      source_distribution: finalSourceDistribution,
      selected_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      selection_method: 'v5_embedding_match',

      // === V5-SPECIFIC FIELDS (target-organized data) ===
      time_range: {
        hours_back: hoursBack,
        since: sinceTime
      },
      summary: {
        targets_with_signals: targetMatches.length,
        total_targets: targets?.length || 0,
        unique_articles: v4Articles.length,
        from_priority_sources: prioritySourceCount,
        cross_target_connections: connections.length
      },
      target_signals: targetMatches,
      connections,
      signal_summary: summaryError ? null : signalSummary,
      duration_ms: duration
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
