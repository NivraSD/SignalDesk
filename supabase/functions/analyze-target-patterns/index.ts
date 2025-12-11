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

            // Save patterns as signals
            for (const pattern of patterns) {
              const signal = {
                organization_id: orgId,
                signal_type: 'predictive',
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
      duration_seconds: duration,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log(`\n📊 Pattern Analysis Complete:`);
    console.log(`   Targets analyzed: ${targets.length}`);
    console.log(`   Patterns detected: ${totalPatternsDetected}`);
    console.log(`   Signals created: ${signalsCreated}`);
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

TASK: Identify meaningful patterns in this accumulated intelligence about ${target.name}.

Look for:
1. TRAJECTORY: Is the target expanding, contracting, pivoting? What direction are they moving?
2. ANOMALIES: Any unusual activity compared to recent patterns?
3. TRENDS: Consistent direction over time (sentiment shifts, geographic focus, activity type concentration)
4. SHIFTS: Recent changes from historical patterns
5. MILESTONES: Significant events that mark a turning point

Return 0-3 pattern analyses as JSON array:
[
  {
    "pattern_type": "trajectory|anomaly|trend|shift|milestone",
    "title": "Clear, specific title (max 100 chars)",
    "description": "What the pattern is and what it means (2-3 sentences)",
    "evidence": ["Specific data point 1", "Specific data point 2"],
    "confidence": 0.7,
    "time_horizon": "1-month|3-months|6-months",
    "business_implication": "What this means for our organization",
    "recommended_action": "Suggested response (optional)"
  }
]

RULES:
- Only report patterns with REAL evidence from the data above
- Be specific - cite actual numbers and facts from the summary
- If no meaningful patterns exist or data is too limited, return []
- Focus on actionable intelligence, not obvious observations
- Confidence should reflect how much data supports the pattern (0.5-0.9 range)

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
