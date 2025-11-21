// Monitor Stage 3: Quality Control Agent
// Pragmatic "good enough" assessment - only triggers re-search for CRITICAL gaps
// Prevents death loops with strict safety limits

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

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

    // Step 4.5: Use Claude to evaluate quality if assessment is borderline
    let decision = assessment.decision;

    if (assessment.needs_claude_evaluation && decision === 'PROCEED') {
      console.log(`\n🤖 Step 4.5: Using Claude to evaluate quality...`);
      const claudeEvaluation = await evaluateIntelligenceQuality(articles, assessment, targets, companyProfile);

      console.log(`   Claude says: ${claudeEvaluation.is_sufficient ? 'SUFFICIENT' : 'INSUFFICIENT'}`);
      console.log(`   Reasoning: ${claudeEvaluation.reasoning}`);

      if (!claudeEvaluation.is_sufficient) {
        console.log(`   🔄 Claude override: Changing decision from PROCEED to SEARCH_GAPS`);
        decision = 'SEARCH_GAPS';

        // Add Claude's gaps to critical gaps
        claudeEvaluation.critical_gaps.forEach(gap => {
          assessment.criticalGaps.push({
            type: 'claude_identified_gap',
            severity: GapSeverity.CRITICAL,
            message: gap,
            source: 'claude_evaluation'
          });
        });
      }

      // Add Claude evaluation to assessment
      assessment.claude_evaluation = claudeEvaluation;
    }

    // Step 5: Decision
    if (decision === 'PROCEED') {
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

    // Step 6: Generate gap context for mcp-discovery
    console.log(`\n🔧 Step 6: Creating gap context for mcp-discovery...`);
    const gapContext = generateGapContext(assessment.criticalGaps, companyProfile, targets, organizationName);

    console.log(`   Gap type: ${gapContext.gap_type}`);
    console.log(`   Missing entities: ${gapContext.missing_entities?.length || 0}`);
    console.log(`   Strategic focus: ${gapContext.strategic_focus || 'general coverage'}`);

    if (!gapContext.gap_type) {
      console.log(`   ⚠️ Could not determine gap type - PROCEEDING anyway`);
      return new Response(JSON.stringify({
        proceed: true,
        articles,
        decision: 'PROCEED',
        reason: 'No gap context generated',
        assessment,
        execution_time_ms: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 7: Use mcp-discovery to intelligently figure out how to fill gaps
    console.log(`\n🤖 Step 7: Calling mcp-discovery to determine gap-filling strategy...`);

    try {
      // Call mcp-discovery with gap context
      const discoveryResponse = await fetch(`${SUPABASE_URL}/functions/v1/mcp-discovery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id,
          organization_name: organizationName,
          industry_hint: companyProfile.industry,
          gap_filling_mode: true,
          gap_context: gapContext,
          save_to_persistence: false // Don't overwrite existing profile
        })
      });

      if (!discoveryResponse.ok) {
        console.log(`   ⚠️ mcp-discovery failed - PROCEEDING with current articles`);
        return new Response(JSON.stringify({
          proceed: true,
          articles,
          decision: 'PROCEED',
          reason: 'Gap-fill discovery failed',
          assessment,
          execution_time_ms: Date.now() - startTime
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const discoveryResult = await discoveryResponse.json();
      const enhancedProfile = discoveryResult.profile;

      if (!enhancedProfile) {
        console.log(`   ⚠️ No enhanced profile from mcp-discovery - PROCEEDING with current articles`);
        return new Response(JSON.stringify({
          proceed: true,
          articles,
          decision: 'PROCEED',
          reason: 'No enhanced profile returned',
          assessment,
          execution_time_ms: Date.now() - startTime
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`   ✅ Got enhanced profile from mcp-discovery`);
      console.log(`   Enhanced search queries: ${enhancedProfile.monitoring_config?.search_queries?.competitor_queries?.length || 0}`);

      // Step 8: Trigger gap-filling search with enhanced strategy
      console.log(`\n🔄 Step 8: Running targeted monitoring with enhanced strategy (iteration ${iteration + 1})...`);

      const monitorResponse = await fetch(`${SUPABASE_URL}/functions/v1/niv-source-direct-monitor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id,
          organization_name,
          profile: enhancedProfile, // Use enhanced profile from mcp-discovery
          gap_filling_mode: true // Signal this is a gap-filling run
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

      // Step 9: Run relevance filtering on gap articles
      console.log(`\n🤖 Step 9: Running relevance filter on gap articles...`);
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

  // Decision logic: Use both rule-based and qualitative assessment
  let decision = criticalGaps.length === 0 ? 'PROCEED' : 'SEARCH_GAPS';

  // OVERRIDE: If coverage is extremely poor (< 25% competitors AND 0% stakeholders), escalate to SEARCH_GAPS
  const extremelyPoorCoverage = (
    assessment.competitor_coverage_rate < 0.25 &&
    assessment.stakeholder_coverage_rate === 0 &&
    targets.competitors.length > 0 &&
    targets.stakeholders.length > 0
  );

  if (extremelyPoorCoverage) {
    console.log(`⚠️ OVERRIDING: Extremely poor coverage detected (${(assessment.competitor_coverage_rate * 100).toFixed(0)}% competitors, 0% stakeholders)`);
    decision = 'SEARCH_GAPS';
    criticalGaps.push({
      type: 'extremely_poor_coverage',
      severity: GapSeverity.CRITICAL,
      message: `Coverage is insufficient for meaningful analysis: ${(assessment.competitor_coverage_rate * 100).toFixed(0)}% competitors, 0% stakeholders`,
      coverage: {
        competitors: assessment.competitor_coverage_rate,
        stakeholders: assessment.stakeholder_coverage_rate
      }
    });
  }

  return {
    ...assessment,
    criticalGaps,
    minorGaps,
    decision,
    needs_claude_evaluation: extremelyPoorCoverage || minorGaps.length > 2
  };
}

/**
 * Use Claude to evaluate if intelligence quality is sufficient for an executive report
 */
async function evaluateIntelligenceQuality(
  articles: any[],
  assessment: any,
  targets: any,
  companyProfile: any
): Promise<{ is_sufficient: boolean, reasoning: string, critical_gaps: string[] }> {

  if (!ANTHROPIC_API_KEY) {
    console.log('⚠️ Claude evaluation skipped - no API key');
    return { is_sufficient: true, reasoning: 'Evaluation skipped', critical_gaps: [] };
  }

  try {
    // Sample articles for evaluation (first 10)
    const sampleArticles = articles.slice(0, 10).map(a => ({
      title: a.title,
      description: a.description || a.content?.substring(0, 200),
      source: a.source
    }));

    const prompt = `You are a QUALITY CONTROL ANALYST evaluating intelligence gathered for an executive report.

ORGANIZATION: ${companyProfile?.business_model || 'A company'}
INDUSTRY: ${companyProfile?.industry || 'Unknown'}

INTELLIGENCE TARGETS:
- ${targets.competitors.length} Competitors: ${targets.competitors.slice(0, 5).map((c: any) => c.name).join(', ')}${targets.competitors.length > 5 ? '...' : ''}
- ${targets.stakeholders.length} Stakeholders: ${targets.stakeholders.slice(0, 3).map((s: any) => s.name).join(', ')}${targets.stakeholders.length > 3 ? '...' : ''}

COVERAGE ACHIEVED:
- Total articles: ${assessment.total_articles}
- Competitor coverage: ${(assessment.competitor_coverage_rate * 100).toFixed(0)}% (${Math.floor(assessment.competitor_coverage_rate * targets.competitors.length)}/${targets.competitors.length})
- Stakeholder coverage: ${(assessment.stakeholder_coverage_rate * 100).toFixed(0)}% (${Math.floor(assessment.stakeholder_coverage_rate * targets.stakeholders.length)}/${targets.stakeholders.length})
- Recent articles: ${assessment.has_recent_articles ? 'YES' : 'NO'}

SAMPLE ARTICLES (first 10):
${sampleArticles.map((a, i) => `${i + 1}. ${a.title}\n   Source: ${a.source}\n   ${a.description}`).join('\n\n')}

YOUR TASK:
Evaluate if this intelligence is sufficient to write a MEANINGFUL executive report. Consider:

1. **Coverage Quality**: Do we have actual intelligence about key competitors/stakeholders, or just generic industry news?
2. **Actionability**: Can an executive make strategic decisions from this, or is it too sparse?
3. **Balance**: Is there enough breadth to understand the competitive landscape?
4. **Substance**: Are there real events/developments, or just filler?

CRITICAL STANDARDS:
- An executive report with 0% stakeholder coverage is NOT acceptable
- 20% competitor coverage means we're missing 80% of the competitive landscape
- Generic industry news without specific competitor intel is insufficient

Return ONLY this JSON format:
{
  "is_sufficient": true/false,
  "reasoning": "1-2 sentence explanation of why this is or isn't enough",
  "critical_gaps": ["gap 1", "gap 2"],
  "quality_score": 0-100
}

Be STRICT. If you wouldn't want to present this to an executive, mark it insufficient.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      console.error('❌ Claude evaluation failed:', response.statusText);
      return { is_sufficient: true, reasoning: 'Evaluation error', critical_gaps: [] };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '{}';

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ Failed to parse Claude evaluation');
      return { is_sufficient: true, reasoning: 'Parse error', critical_gaps: [] };
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    console.log('🤖 Claude Quality Evaluation:', evaluation);

    return {
      is_sufficient: evaluation.is_sufficient || false,
      reasoning: evaluation.reasoning || 'No reasoning provided',
      critical_gaps: evaluation.critical_gaps || []
    };

  } catch (error: any) {
    console.error('❌ Claude evaluation error:', error.message);
    return { is_sufficient: true, reasoning: 'Evaluation error', critical_gaps: [] };
  }
}

/**
 * Check if article mentions entity (case-insensitive)
 */
function mentionsEntity(article: any, entityName: string): boolean {
  const text = `${article.title || ''} ${article.content || ''} ${article.description || ''}`.toLowerCase();
  return text.includes(entityName.toLowerCase());
}

/**
 * Generate structured gap context for mcp-discovery to intelligently fill
 * Instead of simple queries, describe WHAT is missing so mcp-discovery can figure out HOW to find it
 */
function generateGapContext(criticalGaps: any[], companyProfile: any, targets: any, organizationName: string): any {
  const context: any = {
    organization_name: organizationName,
    industry: companyProfile.industry,
    gap_type: null,
    missing_entities: [],
    coverage_analysis: {},
    strategic_focus: null,
    priority_areas: []
  };

  // Analyze gap type 1: Zero top competitor coverage
  const competitorGap = criticalGaps.find(g => g.type === 'zero_top_competitor_coverage');
  if (competitorGap && competitorGap.competitors_missing) {
    context.gap_type = 'competitor_coverage';
    context.missing_entities = competitorGap.competitors_missing.map((name: string) => ({
      name,
      type: 'competitor',
      priority: 'high',
      reason: 'Top competitor with zero coverage'
    }));
    context.strategic_focus = `Find recent news and developments about these key competitors: ${competitorGap.competitors_missing.join(', ')}`;
    context.priority_areas = ['competitive_intelligence', 'market_movements', 'strategic_announcements'];
  }

  // Analyze gap type 2: Extremely poor coverage (from override)
  const poorCoverageGap = criticalGaps.find(g => g.type === 'extremely_poor_coverage');
  if (poorCoverageGap) {
    context.gap_type = 'comprehensive_coverage';

    // Find uncovered competitors
    const uncoveredCompetitors = targets.competitors
      .filter((t: any) => t.priority === 'high')
      .slice(0, 5);

    context.missing_entities.push(...uncoveredCompetitors.map((comp: any) => ({
      name: comp.name,
      type: 'competitor',
      priority: comp.priority,
      reason: 'High-priority competitor with insufficient coverage'
    })));

    // Add stakeholders
    const uncoveredStakeholders = targets.stakeholders.slice(0, 3);
    context.missing_entities.push(...uncoveredStakeholders.map((sh: any) => ({
      name: sh.name,
      type: 'stakeholder',
      priority: sh.priority || 'medium',
      reason: 'Stakeholder with no coverage'
    })));

    context.coverage_analysis = {
      competitor_coverage_rate: poorCoverageGap.coverage?.competitors || 0,
      stakeholder_coverage_rate: poorCoverageGap.coverage?.stakeholders || 0,
      severity: 'critical'
    };

    context.strategic_focus = `Achieve balanced coverage across key competitors and stakeholders for ${organizationName}`;
    context.priority_areas = ['competitive_landscape', 'stakeholder_activity', 'industry_dynamics'];
  }

  // Analyze gap type 3: Claude-identified gaps (use strategic questions)
  const claudeGaps = criticalGaps.filter(g => g.type === 'claude_identified_gap');
  if (claudeGaps.length > 0 && !context.gap_type) {
    context.gap_type = 'strategic_intelligence';

    const intelligenceContext = companyProfile.intelligence_context || {};
    const keyQuestions = intelligenceContext.key_questions || [];

    context.strategic_focus = keyQuestions[0] || `Comprehensive intelligence about ${organizationName}'s competitive landscape`;
    context.priority_areas = ['strategic_movements', 'market_opportunities', 'competitive_threats'];

    // Extract gaps from Claude's reasoning
    claudeGaps.forEach(gap => {
      if (gap.message) {
        context.missing_entities.push({
          type: 'strategic_area',
          description: gap.message,
          reason: 'Claude-identified critical gap'
        });
      }
    });
  }

  // Analyze gap type 4: Insufficient articles
  const articleGap = criticalGaps.find(g => g.type === 'insufficient_articles');
  if (articleGap && !context.gap_type) {
    context.gap_type = 'volume';
    context.strategic_focus = `Increase intelligence volume for ${organizationName}`;
    context.priority_areas = ['industry_news', 'competitive_intelligence', 'market_trends'];
  }

  // Analyze gap type 5: Stale intelligence
  const recencyGap = criticalGaps.find(g => g.type === 'stale_intelligence');
  if (recencyGap) {
    if (!context.gap_type) {
      context.gap_type = 'recency';
    }
    context.recency_requirement = 'last_24_hours';
    context.strategic_focus = `Find breaking news and recent developments in ${companyProfile.industry}`;
    if (!context.priority_areas.includes('breaking_news')) {
      context.priority_areas.push('breaking_news');
    }
  }

  return context;
}
