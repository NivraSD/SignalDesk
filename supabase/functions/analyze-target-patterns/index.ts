// Analyze Target Patterns
// Analyzes accumulated intelligence on targets to detect patterns and generate predictive signals
// Runs weekly or on-demand, creates signals from accumulated_context data

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

// Configuration
const MIN_FACTS_FOR_ANALYSIS = 2;  // Minimum facts needed to analyze a target
const MAX_TARGETS_PER_RUN = 20;    // Process up to 20 targets per run

interface AccumulatedContext {
  total_facts: number;
  facts_last_7d: number;
  facts_last_30d: number;
  last_fact_at: string | null;
  fact_type_distribution: Record<string, number>;
  sentiment: {
    current: number;
    trend: 'improving' | 'declining' | 'stable';
    history: { period: string; score: number }[];
  };
  geographic_activity: Record<string, {
    fact_count: number;
    recent_facts: number;
    dominant_type: string;
  }>;
  relationship_map: Record<string, {
    relationship_types: string[];
    mention_count: number;
    last_mentioned: string;
    sentiment_avg: number;
  }>;
  topic_clusters: Record<string, number>;
  recent_highlights: {
    date: string;
    summary: string;
    type: string;
    significance: number;
  }[];
  insights: {
    primary_activity: string;
    activity_level: 'high' | 'medium' | 'low';
    notable_shift: string | null;
    risk_indicators: string[];
  };
  last_analyzed_at: string;
}

interface Target {
  id: string;
  organization_id: string;
  name: string;
  target_type: string;
  priority: string;
  monitoring_context: string | null;
  accumulated_context: AccumulatedContext | null;
  baseline_metrics: Record<string, any> | null;
  fact_count: number;
}

interface PatternAnalysis {
  pattern_type: 'trajectory' | 'anomaly' | 'trend' | 'shift' | 'milestone';
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
  time_horizon: string;
  business_implication: string;
  recommended_action?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('🔮 ANALYZE TARGET PATTERNS');
  console.log(`   Time: ${new Date().toISOString()}`);

  try {
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organization_id;  // Optional: filter to specific org
    const targetId = body.target_id;              // Optional: analyze single target
    const maxTargets = body.max_targets || MAX_TARGETS_PER_RUN;
    const minFacts = body.min_facts || MIN_FACTS_FOR_ANALYSIS;

    // Build query for targets with enough accumulated context
    let query = supabase
      .from('intelligence_targets')
      .select('id, organization_id, name, target_type, priority, monitoring_context, accumulated_context, baseline_metrics, fact_count')
      .gte('fact_count', minFacts)
      .eq('is_active', true)
      .order('fact_count', { ascending: false })
      .limit(maxTargets);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    if (targetId) {
      query = query.eq('id', targetId);
    }

    const { data: targets, error: targetError } = await query;

    if (targetError) {
      throw new Error(`Failed to load targets: ${targetError.message}`);
    }

    if (!targets || targets.length === 0) {
      console.log('   No targets with sufficient data for pattern analysis');
      return new Response(JSON.stringify({
        success: true,
        targets_analyzed: 0,
        patterns_detected: 0,
        signals_created: 0,
        message: 'No targets meet minimum fact threshold'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`   Found ${targets.length} targets to analyze`);

    // Group targets by organization for efficient processing
    const targetsByOrg = new Map<string, Target[]>();
    for (const target of targets as Target[]) {
      const orgId = target.organization_id;
      if (!targetsByOrg.has(orgId)) {
        targetsByOrg.set(orgId, []);
      }
      targetsByOrg.get(orgId)!.push(target);
    }

    let totalPatternsDetected = 0;
    let signalsCreated = 0;
    let signalsUpdated = 0;  // Track deduplicated signals
    const errors: string[] = [];

    // Process each organization's targets
    for (const [orgId, orgTargets] of targetsByOrg) {
      // Get org context
      const { data: org } = await supabase
        .from('organizations')
        .select('name, industry, company_profile')
        .eq('id', orgId)
        .single();

      const orgContext = org
        ? `Organization: ${org.name}\nIndustry: ${org.industry || 'N/A'}\n${org.company_profile?.description ? `Description: ${org.company_profile.description}` : ''}`
        : '';

      console.log(`\n   Processing ${orgTargets.length} targets for org: ${org?.name || orgId}`);

      // Analyze each target
      for (const target of orgTargets) {
        if (!target.accumulated_context || target.accumulated_context.total_facts < minFacts) {
          console.log(`     Skipping ${target.name}: insufficient data`);
          continue;
        }

        try {
          console.log(`     Analyzing: ${target.name} (${target.fact_count} facts)`);

          const patterns = await analyzeTargetPatterns(target, orgContext);

          if (patterns.length > 0) {
            console.log(`       Found ${patterns.length} patterns`);
            totalPatternsDetected += patterns.length;

            // Save patterns as signals (with deduplication)
            for (const pattern of patterns) {
              // Check for similar existing signal
              const similarSignal = await findSimilarSignal(
                supabase,
                orgId,
                target.id,
                pattern.title,
                pattern.pattern_type
              );

              if (similarSignal) {
                // Update existing signal instead of creating duplicate
                const newConfidence = Math.min(95, similarSignal.confidence_score + 5);
                const newDetectionCount = (similarSignal.detection_count || 1) + 1;

                const { error: updateError } = await supabase
                  .from('signals')
                  .update({
                    confidence_score: newConfidence,
                    detection_count: newDetectionCount,
                    last_detected_at: new Date().toISOString(),
                    // Append new evidence to existing
                    evidence: {
                      ...similarSignal.evidence,
                      data_points: [
                        ...(similarSignal.evidence?.data_points || []),
                        ...pattern.evidence.slice(0, 2)  // Add up to 2 new evidence points
                      ].slice(-10)  // Keep last 10 evidence points
                    },
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', similarSignal.id);

                if (updateError) {
                  console.error(`       Failed to update signal: ${updateError.message}`);
                } else {
                  console.log(`       ↗ Strengthened existing signal: "${similarSignal.title.substring(0, 50)}..." (count: ${newDetectionCount})`);
                  signalsUpdated++;
                }
              } else {
                // Create new signal
                const signal = {
                  organization_id: orgId,
                  signal_type: 'pattern',
                  signal_subtype: `pattern_${pattern.pattern_type}`,
                  title: pattern.title,
                  description: pattern.description,
                  primary_target_id: target.id,
                  primary_target_name: target.name,
                  primary_target_type: target.target_type,
                  confidence_score: Math.round(pattern.confidence * 100),
                  significance_score: calculateSignificance(pattern, target),
                  urgency: determineUrgency(pattern),
                  impact_level: determineImpact(pattern, target),
                  evidence: {
                    data_points: pattern.evidence,
                    pattern_type: pattern.pattern_type,
                    time_horizon: pattern.time_horizon
                  },
                  reasoning: pattern.description,
                  pattern_data: {
                    pattern_type: pattern.pattern_type,
                    time_horizon: pattern.time_horizon,
                    accumulated_context_snapshot: {
                      total_facts: target.accumulated_context?.total_facts,
                      sentiment_current: target.accumulated_context?.sentiment?.current,
                      primary_activity: target.accumulated_context?.insights?.primary_activity
                    }
                  },
                  business_implication: pattern.business_implication,
                  suggested_action: pattern.recommended_action || null,
                  source_pipeline: 'analyze-target-patterns',
                  model_version: 'claude-sonnet-4',
                  detection_count: 1,
                  last_detected_at: new Date().toISOString(),
                  status: 'active'
                };

                const { error: signalError } = await supabase
                  .from('signals')
                  .insert(signal);

                if (signalError) {
                  console.error(`       Failed to save signal: ${signalError.message}`);
                  errors.push(`Signal save error for ${target.name}: ${signalError.message}`);
                } else {
                  signalsCreated++;
                }
              }
            }
          } else {
            console.log(`       No significant patterns detected`);
          }

          // Update target's last_analyzed timestamp in accumulated_context
          const updatedContext = {
            ...target.accumulated_context,
            last_analyzed_at: new Date().toISOString()
          };

          await supabase
            .from('intelligence_targets')
            .update({ accumulated_context: updatedContext })
            .eq('id', target.id);

        } catch (analysisError: any) {
          console.error(`     Analysis error for ${target.name}: ${analysisError.message}`);
          errors.push(`Analysis error for ${target.name}: ${analysisError.message}`);
        }
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    const summary = {
      success: true,
      targets_analyzed: targets.length,
      patterns_detected: totalPatternsDetected,
      signals_created: signalsCreated,
      signals_updated: signalsUpdated,
      duration_seconds: duration,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log(`\n📊 Pattern Analysis Complete:`);
    console.log(`   Targets analyzed: ${targets.length}`);
    console.log(`   Patterns detected: ${totalPatternsDetected}`);
    console.log(`   Signals created: ${signalsCreated}`);
    console.log(`   Signals strengthened: ${signalsUpdated}`);
    console.log(`   Duration: ${duration}s`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Pattern analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function analyzeTargetPatterns(
  target: Target,
  orgContext: string
): Promise<PatternAnalysis[]> {
  const ctx = target.accumulated_context!;
  const baseline = target.baseline_metrics;

  // Build the prompt with accumulated context data
  const prompt = `You are an intelligence analyst reviewing accumulated intelligence on "${target.name}".

ORGANIZATION CONTEXT:
${orgContext}

TARGET: ${target.name} (${target.target_type})
Priority: ${target.priority}
${target.monitoring_context ? `Monitoring Context: ${target.monitoring_context}` : ''}

ACCUMULATED INTELLIGENCE SUMMARY:
═══════════════════════════════════

Total Facts Collected: ${ctx.total_facts}
Facts Last 7 Days: ${ctx.facts_last_7d || 0}
Facts Last 30 Days: ${ctx.facts_last_30d || 0}
Last Fact: ${ctx.last_fact_at ? new Date(ctx.last_fact_at).toISOString().split('T')[0] : 'N/A'}

ACTIVITY BY TYPE:
${Object.entries(ctx.fact_type_distribution || {})
  .sort((a, b) => (b[1] as number) - (a[1] as number))
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n') || 'No activity recorded'}

SENTIMENT:
- Current: ${ctx.sentiment?.current?.toFixed(2) || 'N/A'} (-1 to 1 scale)
- Trend: ${ctx.sentiment?.trend || 'N/A'}
- Recent history: ${ctx.sentiment?.history?.slice(-5).map(h => `${h.period}: ${h.score.toFixed(2)}`).join(', ') || 'N/A'}

GEOGRAPHIC ACTIVITY:
${Object.entries(ctx.geographic_activity || {})
  .map(([region, data]: [string, any]) => `- ${region}: ${data.fact_count} facts, recent: ${data.recent_facts}`)
  .join('\n') || 'None tracked'}

KEY RELATIONSHIPS:
${Object.entries(ctx.relationship_map || {})
  .sort((a, b) => (b[1] as any).mention_count - (a[1] as any).mention_count)
  .slice(0, 10)
  .map(([entity, data]: [string, any]) => `- ${entity}: ${data.mention_count} mentions, types: ${data.relationship_types?.join(', ') || 'unknown'}`)
  .join('\n') || 'None detected'}

TOP TOPICS/ENTITIES:
${Object.entries(ctx.topic_clusters || {})
  .sort((a, b) => (b[1] as number) - (a[1] as number))
  .slice(0, 10)
  .map(([topic, count]) => `- ${topic}: ${count}`)
  .join('\n') || 'None'}

RECENT SIGNIFICANT EVENTS:
${ctx.recent_highlights?.map(h => `- [${h.date.split('T')[0]}] ${h.summary} (${h.type}, significance: ${h.significance})`).join('\n') || 'None recorded'}

CURRENT INSIGHTS:
- Primary Activity: ${ctx.insights?.primary_activity || 'Unknown'}
- Activity Level: ${ctx.insights?.activity_level || 'Unknown'}
- Risk Indicators: ${ctx.insights?.risk_indicators?.join(', ') || 'None'}

${baseline ? `
BASELINE COMPARISON (established ${baseline.established_at}):
- Normal activity: ${baseline.avg_facts_per_week} facts/week
- Normal sentiment: ${baseline.avg_sentiment}
- Current vs baseline: ${(ctx.facts_last_7d || 0) > (baseline.avg_facts_per_week || 0) * 1.5 ? 'ELEVATED ACTIVITY' : (ctx.facts_last_7d || 0) < (baseline.avg_facts_per_week || 1) * 0.5 ? 'REDUCED ACTIVITY' : 'Normal'}
` : 'No baseline established yet (need 30+ facts)'}

TASK: Generate PREDICTIVE, FORWARD-LOOKING intelligence about ${target.name}.

Your goal is NOT to summarize what happened. Your goal is to answer: "WHAT COULD HAPPEN NEXT?"

Look for NON-OBVIOUS patterns that suggest FUTURE events:
1. TRAJECTORY: Where is this target heading? What's their next logical move?
2. ANOMALIES: What unusual activity might signal something brewing beneath the surface?
3. TRENDS: What building momentum suggests an inflection point is coming?
4. SHIFTS: What recent changes could cascade into bigger disruptions?
5. MILESTONES: What recent events set up domino effects we should watch?

FOR EACH PATTERN, ANSWER:
- "So what?" - Why should we care about this pattern?
- "What's next?" - What does this pattern suggest will happen in 1-6 months?
- "What should we watch for?" - What early warning signs would confirm/deny this prediction?

Return 0-3 pattern analyses as JSON array:
[
  {
    "pattern_type": "trajectory|anomaly|trend|shift|milestone",
    "title": "Predictive headline: What could happen next (max 100 chars)",
    "description": "Connect the dots: Here's what we're seeing, and here's what it suggests is coming (2-3 sentences)",
    "evidence": ["Evidence point 1 that supports the prediction", "Evidence point 2"],
    "confidence": 0.7,
    "time_horizon": "1-month|3-months|6-months",
    "business_implication": "What this means for our organization and what we should prepare for",
    "recommended_action": "Specific proactive step to take now (not 'monitor closely')"
  }
]

QUALITY STANDARDS:

🚨 REJECT GENERIC INDUSTRY PATTERNS:
- BAD: "AI adoption is accelerating in healthcare" (generic industry trend everyone knows)
- BAD: "Cost reduction gaining momentum across the industry" (no specific actor, no specific threat)
- BAD: "Market validation for AI-powered solutions" (vague positive spin, not actionable)
- GOOD: "Anthropic is targeting healthcare with governance-focused AI that competes directly with our EMR integration" (specific competitor, specific move, specific threat)

🎯 SPECIFIC ENTITY + SPECIFIC ACTION:
- Every pattern MUST name a SPECIFIC entity doing a SPECIFIC thing
- BAD: "The industry is moving toward X" (who? what specifically?)
- GOOD: "[Company Name] just [specific action] which signals [specific implication for us]"

🔮 THREAT OR OPPORTUNITY - NOT VALIDATION:
- Don't tell them their market is "validated" - they already know their market exists
- Tell them WHO is threatening their position or WHERE the opportunity is
- BAD: "Growing demand validates our solution" (flattery, not intelligence)
- GOOD: "Epic just partnered with Microsoft on AI documentation - they're coming for our core use case"

⚡ ACTIONABLE IMPLICATIONS:
- BAD: "Monitor this trend closely" (useless advice)
- GOOD: "Brief sales team before Q2 - they need talking points on why we're different from [competitor]"

💡 THE "SO WHAT" TEST:
Ask: "If I told a busy executive this, would they say 'so what?' or 'we need to do something'?"
- If the pattern is something everyone already knows, DON'T report it
- If the pattern doesn't suggest a specific action, DON'T report it
- If the pattern is just good news about the market, DON'T report it

RULES:
- Only report patterns with REAL evidence from the data above
- If no meaningful PREDICTIVE insights about SPECIFIC ENTITIES exist, return []
- Prefer competitor/stakeholder patterns over generic topic patterns
- Be specific about WHO, WHAT, WHEN, and WHAT TO DO
- Confidence should reflect how much evidence supports the PREDICTION (0.5-0.85 range)

CRITICAL - WRITE FOR STRATEGIC DECISION-MAKERS:
- NEVER mention internal metrics or analysis process
- The title should name WHO is doing WHAT, not describe a vague trend
- Write like you're a trusted advisor warning about a specific competitive move
- Generic industry commentary is WORTHLESS - specific competitive intelligence is VALUABLE

Return ONLY the JSON array.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('       No patterns in response');
      return [];
    }

    const patterns: PatternAnalysis[] = JSON.parse(jsonMatch[0]);

    // Validate and filter patterns
    return patterns.filter(p => {
      if (!p.pattern_type || !p.title || !p.description) return false;
      if (!['trajectory', 'anomaly', 'trend', 'shift', 'milestone'].includes(p.pattern_type)) return false;
      if (!p.evidence || p.evidence.length === 0) return false;
      return true;
    }).map(p => ({
      ...p,
      confidence: Math.max(0.1, Math.min(0.95, p.confidence || 0.5)),
      time_horizon: p.time_horizon || '3-months'
    }));

  } catch (error: any) {
    console.error(`       Claude analysis error: ${error.message}`);
    return [];
  }
}

function calculateSignificance(pattern: PatternAnalysis, target: Target): number {
  let score = 50;  // Base score

  // Adjust based on pattern type
  const typeScores: Record<string, number> = {
    'milestone': 20,
    'shift': 15,
    'anomaly': 15,
    'trajectory': 10,
    'trend': 5
  };
  score += typeScores[pattern.pattern_type] || 0;

  // Adjust based on confidence
  score += Math.round(pattern.confidence * 20);

  // Adjust based on target priority
  const priorityBonus: Record<string, number> = {
    'critical': 15,
    'high': 10,
    'medium': 5,
    'low': 0
  };
  score += priorityBonus[target.priority] || 0;

  // Adjust based on time horizon (shorter = more urgent = higher score)
  if (pattern.time_horizon === '1-month') score += 10;
  else if (pattern.time_horizon === '3-months') score += 5;

  return Math.min(100, Math.max(0, score));
}

function determineUrgency(pattern: PatternAnalysis): string {
  // Valid values: immediate, near_term, monitoring
  if (pattern.pattern_type === 'anomaly' || pattern.pattern_type === 'milestone') {
    return pattern.confidence > 0.7 ? 'immediate' : 'near_term';
  }
  if (pattern.time_horizon === '1-month') {
    return 'near_term';
  }
  if (pattern.time_horizon === '3-months') {
    return 'near_term';
  }
  return 'monitoring';
}

function determineImpact(pattern: PatternAnalysis, target: Target): string {
  // High impact for critical/high priority targets
  if (['critical', 'high'].includes(target.priority)) {
    return pattern.confidence > 0.6 ? 'high' : 'medium';
  }
  // Medium impact for other targets with strong patterns
  if (pattern.confidence > 0.7) {
    return 'medium';
  }
  return 'low';
}

// ============================================================================
// Helper: Find similar existing signal to avoid duplicates
// ============================================================================
async function findSimilarSignal(
  supabase: any,
  orgId: string,
  targetId: string,
  newTitle: string,
  patternType: string
): Promise<any | null> {
  // Look for active signals from the same target in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: existingSignals, error } = await supabase
    .from('signals')
    .select('id, title, confidence_score, detection_count, evidence')
    .eq('organization_id', orgId)
    .eq('primary_target_id', targetId)
    .eq('signal_type', 'pattern')
    .eq('status', 'active')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !existingSignals || existingSignals.length === 0) {
    return null;
  }

  // Extract key terms from new title for comparison
  const newTerms = extractKeyTerms(newTitle);

  // Find the most similar signal
  let bestMatch: any = null;
  let bestScore = 0;

  // Key phrases that indicate same topic regardless of wording
  const keyPhrases = ['gen z', 'digital advertising', 'consumer behavior', 'ai integration',
    'ai-driven', 'fintech', 'banking disruption', 'advertising transformation',
    'agency transformation', 'consumer trust'];
  const newTitleLower = newTitle.toLowerCase();

  for (const signal of existingSignals) {
    const existingTerms = extractKeyTerms(signal.title);
    const similarity = calculateTermSimilarity(newTerms, existingTerms);
    const existingTitleLower = signal.title.toLowerCase();

    // Check 1: Term overlap >= 25%
    if (similarity > 0.25 && similarity > bestScore) {
      bestScore = similarity;
      bestMatch = signal;
    }

    // Check 2: Shared key phrase (topic match)
    for (const phrase of keyPhrases) {
      if (newTitleLower.includes(phrase) && existingTitleLower.includes(phrase)) {
        // Key phrase match - consider it a strong duplicate
        if (bestScore < 0.6) {
          bestScore = 0.6;
          bestMatch = signal;
        }
        break;
      }
    }
  }

  return bestMatch;
}

// Extract key terms from a title for comparison
function extractKeyTerms(title: string): Set<string> {
  // Common stop words to ignore
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'across', 'between', 'through', 'during', 'before', 'after', 'above',
    'below', 'into', 'out', 'off', 'over', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also',
    'driving', 'emerging', 'signals', 'indicating', 'shows', 'reveals',
    'accelerating', 'transformation', 'shift', 'trend', 'pattern'
  ]);

  const terms = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(term => term.length > 2 && !stopWords.has(term));

  return new Set(terms);
}

// Calculate Jaccard similarity between two term sets
function calculateTermSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}
