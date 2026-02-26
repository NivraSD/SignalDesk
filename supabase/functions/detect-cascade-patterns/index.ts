// Detect Cascade Patterns
// Matches current signals against known cascade patterns
// Creates alerts for expected follow-on events based on learned patterns

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
const MIN_PATTERN_CONFIDENCE = 0.5;
const LOOKBACK_HOURS = 48;

interface CascadePattern {
  id: string;
  pattern_name: string;
  pattern_description: string;
  pattern_type: string;
  trigger_signal_type: string;
  trigger_entity_types: string[];
  trigger_keywords: string[];
  cascade_steps: CascadeStep[];
  times_observed: number;
  accuracy_rate: number;
  confidence: number;
}

interface CascadeStep {
  step: number;
  delay_days: number;
  entity_type: string;
  action: string;
  description: string;
}

interface Signal {
  id: string;
  organization_id: string;
  signal_type: string;
  signal_subtype: string | null;
  title: string;
  description: string;
  primary_target_name: string | null;
  primary_target_type: string | null;
  evidence: any | null;
  reasoning: string | null;
  business_implication: string | null;
  created_at: string;
}

interface CascadeAlert {
  pattern_id: string;
  pattern_name: string;
  trigger_signal_id: string;
  expected_steps: {
    step: number;
    expected_date: string;
    entity_type: string;
    action: string;
    description: string;
  }[];
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('🌊 DETECT CASCADE PATTERNS');
  console.log(`   Time: ${new Date().toISOString()}`);

  try {
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organization_id;
    const lookbackHours = body.lookback_hours || LOOKBACK_HOURS;

    const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

    // Get active cascade patterns
    const { data: patterns, error: patternError } = await supabase
      .from('cascade_patterns')
      .select('*')
      .eq('is_active', true)
      .gte('confidence', MIN_PATTERN_CONFIDENCE)
      .order('confidence', { ascending: false });

    if (patternError) {
      throw new Error(`Failed to load patterns: ${patternError.message}`);
    }

    if (!patterns || patterns.length === 0) {
      console.log('   No active cascade patterns');
      return new Response(JSON.stringify({
        success: true,
        patterns_checked: 0,
        cascades_detected: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`   Loaded ${patterns.length} cascade patterns`);

    // Get recent signals (exclude cascade_alerts to prevent circular triggering)
    let signalQuery = supabase
      .from('signals')
      .select('id, organization_id, signal_type, signal_subtype, title, description, primary_target_name, primary_target_type, evidence, reasoning, business_implication, created_at')
      .gte('created_at', cutoffTime)
      .eq('status', 'active')
      .neq('signal_type', 'cascade_alert')  // Prevent cascade alerts from triggering on themselves
      .order('created_at', { ascending: false });

    if (organizationId) {
      signalQuery = signalQuery.eq('organization_id', organizationId);
    }

    const { data: signals, error: signalError } = await signalQuery;

    if (signalError) {
      throw new Error(`Failed to load signals: ${signalError.message}`);
    }

    if (!signals || signals.length === 0) {
      console.log('   No recent signals to check');
      return new Response(JSON.stringify({
        success: true,
        patterns_checked: patterns.length,
        signals_checked: 0,
        cascades_detected: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`   Checking ${signals.length} recent signals against patterns`);

    let cascadesDetected = 0;
    let alertsCreated = 0;
    const cascadeAlerts: CascadeAlert[] = [];

    // Check each signal against each pattern
    for (const signal of signals as Signal[]) {
      for (const pattern of patterns as CascadePattern[]) {
        const isMatch = checkPatternTrigger(signal, pattern);

        if (isMatch) {
          console.log(`   🎯 Pattern match: "${pattern.pattern_name}" triggered by "${signal.title.slice(0, 40)}..."`);

          // Check if we already have an alert for this signal+pattern combo
          const { data: existingAlert } = await supabase
            .from('signals')
            .select('id')
            .eq('signal_type', 'cascade_alert')
            .eq('organization_id', signal.organization_id)
            .contains('pattern_data', { trigger_signal_id: signal.id, cascade_pattern_id: pattern.id })
            .single();

          if (existingAlert) {
            console.log(`     Already have alert for this combination, skipping`);
            continue;
          }

          cascadesDetected++;

          // Generate expected cascade timeline
          const cascadeTimeline = generateCascadeTimeline(signal, pattern);
          cascadeAlerts.push(cascadeTimeline);

          // Create a cascade alert signal
          const alertSignal = await createCascadeAlert(supabase, signal, pattern, cascadeTimeline);
          if (alertSignal) {
            alertsCreated++;
          }
        }
      }
    }

    // Also check for cascade progressions (signals that match expected steps)
    const progressions = await checkCascadeProgressions(supabase, signals as Signal[]);

    const duration = Math.round((Date.now() - startTime) / 1000);

    const summary = {
      success: true,
      patterns_checked: patterns.length,
      signals_checked: signals.length,
      cascades_detected: cascadesDetected,
      alerts_created: alertsCreated,
      cascade_progressions: progressions,
      duration_seconds: duration
    };

    console.log(`\n📊 Cascade Detection Complete:`);
    console.log(`   Patterns checked: ${patterns.length}`);
    console.log(`   Signals checked: ${signals.length}`);
    console.log(`   Cascades detected: ${cascadesDetected}`);
    console.log(`   Alerts created: ${alertsCreated}`);
    console.log(`   Duration: ${duration}s`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Cascade detection error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function checkPatternTrigger(signal: Signal, pattern: CascadePattern): boolean {
  // 1. Check signal type match
  const signalType = signal.signal_subtype || signal.signal_type;
  const triggerType = pattern.trigger_signal_type.toLowerCase();

  // Allow partial matches (e.g., "pattern_regulatory" matches "regulatory")
  const typeMatch =
    signalType.toLowerCase().includes(triggerType) ||
    triggerType.includes(signalType.toLowerCase()) ||
    signal.signal_type.toLowerCase() === triggerType;

  if (!typeMatch) return false;

  // 2. Check entity type match (if specified)
  if (pattern.trigger_entity_types && pattern.trigger_entity_types.length > 0) {
    const targetType = (signal.primary_target_type || '').toLowerCase();
    const entityMatch = pattern.trigger_entity_types.some(
      et => targetType.includes(et.toLowerCase()) || et.toLowerCase().includes(targetType)
    );
    if (!entityMatch && targetType) return false;  // Only fail if we have a target type
  }

  // 3. Check keyword match (if specified)
  if (pattern.trigger_keywords && pattern.trigger_keywords.length > 0) {
    const searchText = `${signal.title} ${signal.description}`.toLowerCase();
    const keywordMatch = pattern.trigger_keywords.some(kw => searchText.includes(kw.toLowerCase()));
    if (!keywordMatch) return false;
  }

  return true;
}

function generateCascadeTimeline(signal: Signal, pattern: CascadePattern): CascadeAlert {
  const triggerDate = new Date(signal.created_at);

  const expectedSteps = (pattern.cascade_steps || []).map(step => ({
    step: step.step,
    expected_date: new Date(triggerDate.getTime() + step.delay_days * 24 * 60 * 60 * 1000).toISOString(),
    entity_type: step.entity_type,
    action: step.action,
    description: step.description
  }));

  return {
    pattern_id: pattern.id,
    pattern_name: pattern.pattern_name,
    trigger_signal_id: signal.id,
    expected_steps: expectedSteps,
    confidence: pattern.confidence
  };
}

async function createCascadeAlert(
  supabase: any,
  triggerSignal: Signal,
  pattern: CascadePattern,
  timeline: CascadeAlert
): Promise<boolean> {
  // Find the most imminent expected step
  const now = new Date();
  const upcomingSteps = timeline.expected_steps.filter(
    step => new Date(step.expected_date) > now
  );

  if (upcomingSteps.length === 0) return false;

  const nextStep = upcomingSteps[0];
  const daysUntil = Math.round(
    (new Date(nextStep.expected_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Build context from the trigger signal
  const triggerContext = triggerSignal.description || triggerSignal.title;
  const evidencePoints = triggerSignal.evidence?.data_points || [];
  const triggerReasoning = triggerSignal.reasoning || '';

  // Create a meaningful description that explains WHY this alert was triggered
  const description = `${pattern.pattern_description || pattern.pattern_name}: ${triggerContext.slice(0, 150)}${triggerContext.length > 150 ? '...' : ''}

Based on this trigger, we expect: ${nextStep.description} within ~${daysUntil} days.`;

  // Build comprehensive reasoning that includes the original evidence
  const reasoning = `TRIGGER: ${triggerSignal.title}

${triggerReasoning ? `WHY THIS MATTERS: ${triggerReasoning}\n\n` : ''}PATTERN HISTORY: This "${pattern.pattern_name}" cascade has been observed ${pattern.times_observed} time(s)${pattern.accuracy_rate ? ` with ${Math.round(pattern.accuracy_rate * 100)}% accuracy` : ''}.

EXPECTED NEXT: ${nextStep.description} (typically within ${nextStep.delay_days} days of trigger)`;

  const alertSignal = {
    organization_id: triggerSignal.organization_id,
    signal_type: 'cascade_alert',
    signal_subtype: pattern.pattern_type,
    title: `${pattern.pattern_name}: ${triggerSignal.primary_target_name || 'Alert'}`,
    description,
    primary_target_name: triggerSignal.primary_target_name,
    primary_target_type: triggerSignal.primary_target_type,
    confidence_score: Math.round(pattern.confidence * 100),
    significance_score: 70,
    urgency: daysUntil <= 7 ? 'near_term' : 'monitoring',
    impact_level: 'medium',
    evidence: {
      trigger_signal_title: triggerSignal.title,
      trigger_signal_id: triggerSignal.id,
      trigger_signal_description: triggerSignal.description,
      trigger_evidence: evidencePoints.slice(0, 5),  // Include up to 5 evidence points from trigger
      pattern_times_observed: pattern.times_observed,
      pattern_accuracy: pattern.accuracy_rate,
      expected_next_step: nextStep
    },
    pattern_data: {
      cascade_pattern_id: pattern.id,
      cascade_pattern_name: pattern.pattern_name,
      trigger_signal_id: triggerSignal.id,
      expected_timeline: timeline.expected_steps
    },
    reasoning,
    business_implication: triggerSignal.business_implication || `Monitor for ${nextStep.action} from ${nextStep.entity_type} entities.`,
    source_pipeline: 'detect-cascade-patterns',
    status: 'active'
  };

  const { error } = await supabase
    .from('signals')
    .insert(alertSignal);

  if (error) {
    console.error(`     Failed to create alert: ${error.message}`);
    return false;
  }

  return true;
}

async function checkCascadeProgressions(supabase: any, recentSignals: Signal[]): Promise<number> {
  // Look for existing cascade alerts and check if any steps have been fulfilled
  const { data: activeAlerts } = await supabase
    .from('signals')
    .select('id, pattern_data, organization_id')
    .eq('signal_type', 'cascade_alert')
    .eq('status', 'active');

  if (!activeAlerts || activeAlerts.length === 0) return 0;

  let progressions = 0;

  for (const alert of activeAlerts) {
    if (!alert.pattern_data?.expected_timeline) continue;

    const orgSignals = recentSignals.filter(s => s.organization_id === alert.organization_id);

    for (const expectedStep of alert.pattern_data.expected_timeline) {
      // Check if any recent signal matches this expected step
      const matchingSignal = orgSignals.find(s => {
        const signalText = `${s.title} ${s.description}`.toLowerCase();
        const actionKeywords = expectedStep.action.toLowerCase().split('_');
        return actionKeywords.some((kw: string) => signalText.includes(kw));
      });

      if (matchingSignal) {
        // Update the alert to note progression
        progressions++;
        console.log(`   📈 Cascade progression: Step "${expectedStep.action}" potentially fulfilled`);

        // Update cascade pattern stats
        await supabase
          .from('cascade_patterns')
          .update({
            times_observed: supabase.sql`times_observed + 1`,
            last_observed_at: new Date().toISOString()
          })
          .eq('id', alert.pattern_data.cascade_pattern_id);
      }
    }
  }

  return progressions;
}
