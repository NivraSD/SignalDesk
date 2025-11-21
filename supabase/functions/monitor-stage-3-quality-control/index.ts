// Monitor Stage 3: Quality Control Agent
// Pragmatic "good enough" assessment - only triggers re-search for CRITICAL gaps
// Prevents death loops with strict safety limits

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// "GOOD ENOUGH" QUALITY THRESHOLDS
const QUALITY_THRESHOLDS = {
  min_articles: 5,                // Must have at least 5 articles (not 50!)
  min_competitor_coverage: 0.4,   // 40% of top competitors covered (not 100%)
  min_stakeholder_coverage: 0.3,  // 30% of stakeholders (not 100%)
  min_strategic_questions: 0.5,   // 50% of key questions addressed (not 100%)
  recency_window_hours: 48,       // Articles within 48h is fine
};

// HARD SAFETY LIMITS (prevent death loops)
const SAFETY_LIMITS = {
  max_iterations: 1,              // Only 1 re-search allowed, period
  max_gap_queries: 5,             // Max 5 targeted queries for gaps
  min_articles_after_gap_fill: 3, // Gap-fill must add at least 3 articles or give up
  timeout_total_ms: 120000,       // 2 min total for QC stage
};

enum GapSeverity {
  ACCEPTABLE = 'acceptable',
  MINOR = 'minor',
  CRITICAL = 'critical'
}

interface QCRequest {
  articles: any[];
  organization_id: string;
  organization_name: string;
  iteration?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articles, organization_id, organization_name, iteration = 0 }: QCRequest = await req.json();

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 QUALITY CONTROL: ${organization_name}`);
    console.log(`   Articles to assess: ${articles?.length || 0}`);
    console.log(`   Iteration: ${iteration} (max: ${SAFETY_LIMITS.max_iterations})`);
    console.log(`${'='.repeat(80)}\n`);

    const startTime = Date.now();

    // SAFETY: If already did 1 iteration, ALWAYS proceed (prevent loops)
    if (iteration >= SAFETY_LIMITS.max_iterations) {
      console.log(`✅ Already completed ${iteration} iteration(s) - PROCEEDING without further checks`);
      return new Response(JSON.stringify({
        proceed: true,
        articles,
        decision: 'FORCED_PROCEED',
        reason: `Max iterations (${SAFETY_LIMITS.max_iterations}) reached`,
        assessment: { forced: true }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SAFETY: If no articles provided, can't assess
    if (!articles || articles.length === 0) {
      console.log(`⚠️ No articles provided to QC - PROCEEDING anyway`);
      return new Response(JSON.stringify({
        proceed: true,
        articles: [],
        decision: 'PROCEED',
        reason: 'No articles to assess',
        assessment: { total_articles: 0 }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 1: Load strategic context
    console.log('📋 Step 1: Loading strategic context...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('company_profile')
      .eq('id', organization_id)
      .single();

    if (orgError || !orgData) {
      console.log(`⚠️ Could not load company_profile - PROCEEDING anyway`);
      return new Response(JSON.stringify({
        proceed: true,
        articles,
        decision: 'PROCEED',
        reason: 'No company profile found',
        assessment: { no_profile: true }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const companyProfile = orgData.company_profile || {};

    // Step 2: Load intelligence targets
    console.log('🎯 Step 2: Loading intelligence targets...');
    const { data: targetsData } = await supabase
      .from('intelligence_targets')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('active', true);

    const targets = {
      competitors: (targetsData || []).filter(t => t.type === 'competitor'),
      stakeholders: (targetsData || []).filter(t => t.type === 'stakeholder' || t.type === 'influencer'),
      topics: (targetsData || []).filter(t => t.type === 'topic')
    };

    console.log(`   ✅ Loaded ${targets.competitors.length} competitors, ${targets.stakeholders.length} stakeholders, ${targets.topics.length} topics`);

    // Step 3: Assess quality
    console.log('\n🔬 Step 3: Assessing intelligence quality...');
    const assessment = assessQuality(articles, companyProfile, targets);

    console.log(`   📊 Assessment Results:`);
    console.log(`      - Total articles: ${assessment.total_articles}`);
    console.log(`      - Competitor coverage: ${(assessment.competitor_coverage_rate * 100).toFixed(0)}% (threshold: ${QUALITY_THRESHOLDS.min_competitor_coverage * 100}%)`);
    console.log(`      - Stakeholder coverage: ${(assessment.stakeholder_coverage_rate * 100).toFixed(0)}% (threshold: ${QUALITY_THRESHOLDS.min_stakeholder_coverage * 100}%)`);
    console.log(`      - Recent articles (48h): ${assessment.has_recent_articles ? 'YES' : 'NO'}`);
    console.log(`      - CRITICAL gaps: ${assessment.criticalGaps.length}`);
    console.log(`      - MINOR gaps: ${assessment.minorGaps.length}`);

    // Step 4: Log gaps
    if (assessment.criticalGaps.length > 0) {
      console.log(`\n❌ CRITICAL GAPS DETECTED:`);
      assessment.criticalGaps.forEach((gap, idx) => {
        console.log(`   ${idx + 1}. ${gap.type}: ${gap.message || JSON.stringify(gap)}`);
      });
    }

    if (assessment.minorGaps.length > 0) {
      console.log(`\n⚠️ MINOR GAPS (acceptable, will proceed):`);
      assessment.minorGaps.forEach((gap, idx) => {
        console.log(`   ${idx + 1}. ${gap.type}: ${gap.message || JSON.stringify(gap)}`);
      });
    }

    // Step 5: Decision
    if (assessment.decision === 'PROCEED') {
      console.log(`\n✅ QUALITY ASSESSMENT: GOOD ENOUGH - PROCEEDING`);
      console.log(`   Quality is acceptable for downstream processing`);

      return new Response(JSON.stringify({
        proceed: true,
        articles,
        decision: 'PROCEED',
        assessment,
        execution_time_ms: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 6: Generate gap-filling queries (CRITICAL gaps only)
    console.log(`\n🔧 Step 6: Generating gap-filling queries...`);
    const gapQueries = generateGapFillingQueries(assessment.criticalGaps, companyProfile, targets);

    console.log(`   Generated ${gapQueries.length} targeted queries for critical gaps`);
    gapQueries.forEach((q, idx) => {
      console.log(`   ${idx + 1}. "${q}"`);
    });

    if (gapQueries.length === 0) {
      console.log(`   ⚠️ Could not generate gap-filling queries - PROCEEDING anyway`);
      return new Response(JSON.stringify({
        proceed: true,
        articles,
        decision: 'PROCEED',
        reason: 'No gap queries generated',
        assessment,
        execution_time_ms: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 7: Trigger gap-filling search (ONE iteration only)
    console.log(`\n🔄 Step 7: Triggering gap-filling search (iteration ${iteration + 1})...`);

    try {
      // Call niv-source-direct-monitor with targeted queries
      const monitorResponse = await fetch(`${SUPABASE_URL}/functions/v1/niv-source-direct-monitor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id,
          organization_name,
          targeted_queries: gapQueries // Special parameter for gap-filling
        })
      });

      if (!monitorResponse.ok) {
        console.log(`   ⚠️ Gap-fill monitor failed - PROCEEDING with current articles`);
        return new Response(JSON.stringify({
          proceed: true,
          articles,
          decision: 'PROCEED',
          reason: 'Gap-fill search failed',
          assessment,
          execution_time_ms: Date.now() - startTime
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const monitorResult = await monitorResponse.json();
      const gapArticles = monitorResult.articles || [];

      console.log(`   📊 Gap-fill search returned: ${gapArticles.length} articles`);

      // SAFETY: If gap-fill found < 3 articles, don't bother with relevance filtering
      if (gapArticles.length < SAFETY_LIMITS.min_articles_after_gap_fill) {
        console.log(`   ⚠️ Gap-fill insufficient (< ${SAFETY_LIMITS.min_articles_after_gap_fill} articles) - PROCEEDING with original articles`);
        return new Response(JSON.stringify({
          proceed: true,
          articles,
          decision: 'PROCEED',
          reason: 'Insufficient gap-fill results',
          gap_articles_found: gapArticles.length,
          assessment,
          execution_time_ms: Date.now() - startTime
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Step 8: Run relevance filtering on gap articles
      console.log(`\n🤖 Step 8: Running relevance filter on gap articles...`);
      const relevanceResponse = await fetch(`${SUPABASE_URL}/functions/v1/monitor-stage-2-relevance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          articles: gapArticles,
          organization_id,
          organization_name,
          profile: companyProfile
        })
      });

      if (!relevanceResponse.ok) {
        console.log(`   ⚠️ Gap-fill relevance filtering failed - PROCEEDING with original articles`);
        return new Response(JSON.stringify({
          proceed: true,
          articles,
          decision: 'PROCEED',
          reason: 'Gap-fill relevance filtering failed',
          assessment,
          execution_time_ms: Date.now() - startTime
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const relevanceResult = await relevanceResponse.json();
      const relevantGapArticles = relevanceResult.relevant_articles || [];

      console.log(`   ✅ Relevance filter: ${gapArticles.length} → ${relevantGapArticles.length} relevant gap articles`);

      // Merge with original articles (deduplicate by URL)
      const seenUrls = new Set(articles.map(a => a.url).filter(Boolean));
      const newArticles = relevantGapArticles.filter(a => a.url && !seenUrls.has(a.url));
      const combinedArticles = [...articles, ...newArticles];

      console.log(`\n✅ GAP-FILLING COMPLETE:`);
      console.log(`   - Original articles: ${articles.length}`);
      console.log(`   - New gap articles: ${newArticles.length}`);
      console.log(`   - Combined total: ${combinedArticles.length}`);

      return new Response(JSON.stringify({
        proceed: true,
        articles: combinedArticles,
        decision: 'GAPS_FILLED',
        assessment,
        gap_fill_results: {
          queries_used: gapQueries,
          articles_found: gapArticles.length,
          articles_added: newArticles.length,
          iteration: iteration + 1
        },
        execution_time_ms: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (gapError: any) {
      console.error(`   ❌ Gap-filling error: ${gapError.message}`);
      console.log(`   PROCEEDING with original articles`);

      return new Response(JSON.stringify({
        proceed: true,
        articles,
        decision: 'PROCEED',
        reason: 'Gap-filling error',
        error: gapError.message,
        assessment,
        execution_time_ms: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('❌ Quality control error:', error);
    return new Response(JSON.stringify({
      proceed: true, // ALWAYS proceed on error
      articles: [],
      decision: 'PROCEED',
      reason: 'QC error - proceeding anyway',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Assess intelligence quality with "good enough" thresholds
 * Only flags CRITICAL gaps that justify re-search
 */
function assessQuality(articles: any[], companyProfile: any, targets: any) {
  const assessment = {
    total_articles: articles.length,
    competitor_coverage_rate: 0,
    stakeholder_coverage_rate: 0,
    strategic_question_coverage: 0,
    has_recent_articles: false
  };

  const criticalGaps: any[] = [];
  const minorGaps: any[] = [];

  // Check 1: Total articles (CRITICAL if < 5)
  if (articles.length < QUALITY_THRESHOLDS.min_articles) {
    criticalGaps.push({
      type: 'insufficient_articles',
      severity: GapSeverity.CRITICAL,
      message: `Only ${articles.length} articles found (minimum: ${QUALITY_THRESHOLDS.min_articles})`,
      current: articles.length,
      threshold: QUALITY_THRESHOLDS.min_articles
    });
  }

  // Check 2: Competitor coverage
  if (targets.competitors.length > 0) {
    const coveredCompetitors = targets.competitors.filter((comp: any) =>
      articles.some(article => mentionsEntity(article, comp.name))
    );
    assessment.competitor_coverage_rate = coveredCompetitors.length / targets.competitors.length;

    // CRITICAL: Zero coverage of top 3 competitors
    const top3Competitors = targets.competitors
      .filter((t: any) => t.priority === 'high')
      .slice(0, 3);

    if (top3Competitors.length > 0) {
      const top3Covered = top3Competitors.filter((comp: any) =>
        articles.some(article => mentionsEntity(article, comp.name))
      );

      if (top3Covered.length === 0) {
        criticalGaps.push({
          type: 'zero_top_competitor_coverage',
          severity: GapSeverity.CRITICAL,
          message: `No coverage of top 3 competitors: ${top3Competitors.map((c: any) => c.name).join(', ')}`,
          competitors_missing: top3Competitors.map((c: any) => c.name)
        });
      }
    }

    // MINOR: Low overall competitor coverage (< 40%)
    if (assessment.competitor_coverage_rate < QUALITY_THRESHOLDS.min_competitor_coverage) {
      minorGaps.push({
        type: 'low_competitor_coverage',
        severity: GapSeverity.MINOR,
        message: `Competitor coverage at ${(assessment.competitor_coverage_rate * 100).toFixed(0)}% (threshold: ${QUALITY_THRESHOLDS.min_competitor_coverage * 100}%)`,
        coverage: assessment.competitor_coverage_rate,
        threshold: QUALITY_THRESHOLDS.min_competitor_coverage
      });
    }
  }

  // Check 3: Stakeholder coverage (MINOR only, never critical)
  if (targets.stakeholders.length > 0) {
    const coveredStakeholders = targets.stakeholders.filter((sh: any) =>
      articles.some(article => mentionsEntity(article, sh.name))
    );
    assessment.stakeholder_coverage_rate = coveredStakeholders.length / targets.stakeholders.length;

    if (assessment.stakeholder_coverage_rate < QUALITY_THRESHOLDS.min_stakeholder_coverage) {
      minorGaps.push({
        type: 'low_stakeholder_coverage',
        severity: GapSeverity.MINOR,
        message: `Stakeholder coverage at ${(assessment.stakeholder_coverage_rate * 100).toFixed(0)}%`,
        coverage: assessment.stakeholder_coverage_rate
      });
    }
  }

  // Check 4: Recency (CRITICAL if no articles in 48h)
  const cutoffTime = Date.now() - (QUALITY_THRESHOLDS.recency_window_hours * 60 * 60 * 1000);
  assessment.has_recent_articles = articles.some(article => {
    const publishedDate = new Date(article.published_at || article.publishDate || 0);
    return publishedDate.getTime() >= cutoffTime;
  });

  if (!assessment.has_recent_articles && articles.length > 0) {
    criticalGaps.push({
      type: 'stale_intelligence',
      severity: GapSeverity.CRITICAL,
      message: `No articles from last ${QUALITY_THRESHOLDS.recency_window_hours} hours`,
      threshold_hours: QUALITY_THRESHOLDS.recency_window_hours
    });
  }

  // Decision: PROCEED if no critical gaps, SEARCH_GAPS if critical gaps found
  const decision = criticalGaps.length === 0 ? 'PROCEED' : 'SEARCH_GAPS';

  return {
    ...assessment,
    criticalGaps,
    minorGaps,
    decision
  };
}

/**
 * Check if article mentions entity (case-insensitive)
 */
function mentionsEntity(article: any, entityName: string): boolean {
  const text = `${article.title || ''} ${article.content || ''} ${article.description || ''}`.toLowerCase();
  return text.includes(entityName.toLowerCase());
}

/**
 * Generate targeted queries to fill CRITICAL gaps only
 */
function generateGapFillingQueries(criticalGaps: any[], companyProfile: any, targets: any): string[] {
  const queries: string[] = [];

  // Gap type 1: Zero top competitor coverage
  const competitorGap = criticalGaps.find(g => g.type === 'zero_top_competitor_coverage');
  if (competitorGap && competitorGap.competitors_missing) {
    // Simple, specific queries for each missing competitor
    competitorGap.competitors_missing.forEach((comp: string) => {
      queries.push(`${comp} news`);
    });
  }

  // Gap type 2: Insufficient articles - use top strategic question
  const articleGap = criticalGaps.find(g => g.type === 'insufficient_articles');
  if (articleGap) {
    const topQuestion = companyProfile.intelligence_context?.key_questions?.[0];
    if (topQuestion) {
      queries.push(topQuestion);
    } else if (companyProfile.industry) {
      // Fallback: industry news
      queries.push(`${companyProfile.industry} news`);
    }
  }

  // Gap type 3: Stale intelligence - search for recent news
  const recencyGap = criticalGaps.find(g => g.type === 'stale_intelligence');
  if (recencyGap && companyProfile.industry) {
    queries.push(`${companyProfile.industry} latest news today`);
  }

  // Cap at 5 queries max (SAFETY)
  return queries.slice(0, SAFETY_LIMITS.max_gap_queries);
}
