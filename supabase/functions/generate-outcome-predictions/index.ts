// Generate Outcome Predictions
// Takes recent signals and generates specific, measurable predictions that can be validated
// This is the first step in the learning feedback loop

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
const MAX_SIGNALS_PER_RUN = 30;
const MAX_CONNECTIONS_PER_RUN = 20;
const DEFAULT_PREDICTION_WINDOW_DAYS = 30;
const CONSOLIDATION_THRESHOLD = 3; // Consolidate if 3+ signals about same target
const MAX_PREDICTIONS_PER_TARGET = 2; // Max predictions per target after consolidation

interface OrgContext {
  name: string;
  industry: string | null;
}

// Cache for org lookups
const orgCache = new Map<string, OrgContext>();

// Helper to get org context
async function getOrgContext(supabase: any, orgId: string): Promise<OrgContext | null> {
  if (orgCache.has(orgId)) {
    return orgCache.get(orgId)!;
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('name, industry')
    .eq('id', orgId)
    .single();

  if (error || !data) {
    return null;
  }

  const ctx = { name: data.name, industry: data.industry };
  orgCache.set(orgId, ctx);
  return ctx;
}

// Helper to get target type for a signal
async function getTargetType(supabase: any, targetId: string | null, orgId: string, targetName: string | null): Promise<string | null> {
  if (!targetId && !targetName) return null;

  // Try by ID first
  if (targetId) {
    const { data } = await supabase
      .from('intelligence_targets')
      .select('target_type')
      .eq('id', targetId)
      .single();
    if (data?.target_type) return data.target_type;
  }

  // Fall back to name match within org
  if (targetName) {
    const { data } = await supabase
      .from('intelligence_targets')
      .select('target_type')
      .eq('organization_id', orgId)
      .ilike('name', targetName)
      .limit(1)
      .single();
    if (data?.target_type) return data.target_type;
  }

  return null;
}

interface Signal {
  id: string;
  organization_id: string;
  signal_type: string;
  signal_subtype: string | null;
  title: string;
  description: string;
  primary_target_id: string | null;
  primary_target_name: string | null;
  primary_target_type: string | null;
  confidence_score: number;
  evidence: any;
  reasoning: string | null;
  business_implication: string | null;
  created_at: string;
  source_table?: 'signals' | 'connection_signals';
}

interface ConnectionSignal {
  id: string;
  organization_id: string;
  signal_type: string;
  signal_title: string;
  signal_description: string;
  primary_entity_name: string | null;
  related_entities: any[];
  strength_score: number;
  confidence_score: number;
  pattern_data: any;
  prediction_generated: boolean;
  created_at: string;
}

interface Prediction {
  predicted_outcome: string;
  predicted_timeframe_days: number;
  predicted_confidence: number;
  prediction_reasoning: string;
  verification_criteria: string[];
  refutation_criteria: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('🎯 GENERATE OUTCOME PREDICTIONS');
  console.log(`   Time: ${new Date().toISOString()}`);

  try {
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organization_id;
    const maxSignals = body.max_signals || MAX_SIGNALS_PER_RUN;
    const hoursBack = body.hours_back || 48;

    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    // Get recent signals that don't have predictions yet
    let query = supabase
      .from('signals')
      .select(`
        id, organization_id, signal_type, signal_subtype, title, description,
        primary_target_id, primary_target_name, primary_target_type,
        confidence_score, evidence, reasoning, business_implication, created_at,
        has_prediction
      `)
      .gte('created_at', cutoffTime)
      .eq('status', 'active')
      .or('has_prediction.is.null,has_prediction.eq.false')
      .order('created_at', { ascending: false })
      .limit(maxSignals);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: signals, error: signalError } = await query;

    if (signalError) {
      throw new Error(`Failed to load signals: ${signalError.message}`);
    }

    // Also fetch connection_signals that don't have predictions
    // IMPORTANT: Filter by organization_id to avoid mixing signals from different orgs
    let connQuery = supabase
      .from('connection_signals')
      .select('*')
      .or('prediction_generated.is.null,prediction_generated.eq.false')
      .order('created_at', { ascending: false })
      .limit(MAX_CONNECTIONS_PER_RUN);

    if (organizationId) {
      connQuery = connQuery.eq('organization_id', organizationId);
    }

    const { data: connectionSignals, error: connError } = await connQuery;

    if (connError) {
      console.log(`   Warning: Failed to load connection_signals: ${connError.message}`);
    }

    // Convert connection_signals to Signal format
    const convertedConnections: Signal[] = (connectionSignals || []).map((conn: ConnectionSignal) => ({
      id: conn.id,
      organization_id: conn.organization_id,
      signal_type: 'connection',
      signal_subtype: conn.signal_type,
      title: conn.signal_title,
      description: conn.signal_description,
      primary_target_id: null,
      primary_target_name: conn.primary_entity_name,
      primary_target_type: 'entity',
      confidence_score: conn.confidence_score || conn.strength_score || 70,
      evidence: {
        related_entities: conn.related_entities,
        pattern_data: conn.pattern_data
      },
      reasoning: conn.pattern_data?.business_implication || null,
      business_implication: conn.pattern_data?.business_implication || null,
      created_at: conn.created_at,
      source_table: 'connection_signals' as const
    }));

    // Combine both sources
    const combinedSignals: Signal[] = [
      ...(signals || []).map((s: any) => ({ ...s, source_table: 'signals' as const })),
      ...convertedConnections
    ];

    // DIVERSITY: Ensure we pick signals from different targets, not just one dominant target
    // Group by target, then interleave to get variety
    const MAX_PER_TARGET = 1; // Max predictions per target to ensure diversity
    const targetGroups = new Map<string, Signal[]>();

    for (const signal of combinedSignals) {
      const targetKey = signal.primary_target_name || 'unknown';
      if (!targetGroups.has(targetKey)) {
        targetGroups.set(targetKey, []);
      }
      targetGroups.get(targetKey)!.push(signal);
    }

    // Interleave signals from different targets for diversity
    const allSignals: Signal[] = [];
    let hasMore = true;
    let round = 0;

    while (hasMore && allSignals.length < maxSignals) {
      hasMore = false;
      for (const [targetName, signals] of targetGroups) {
        if (round < signals.length && round < MAX_PER_TARGET) {
          allSignals.push(signals[round]);
          hasMore = true;
          if (allSignals.length >= maxSignals) break;
        }
      }
      round++;
    }

    console.log(`   Target diversity: ${targetGroups.size} different targets, max ${MAX_PER_TARGET} per target`);

    if (allSignals.length === 0) {
      console.log('   No signals needing predictions');
      return new Response(JSON.stringify({
        success: true,
        signals_processed: 0,
        predictions_created: 0,
        message: 'No new signals to process'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`   Found ${signals?.length || 0} signals + ${convertedConnections.length} connection_signals`);

    let predictionsCreated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // ========================================================================
    // CONSOLIDATION: Group signals by target to avoid redundant predictions
    // ========================================================================
    const signalsByTarget = new Map<string, Signal[]>();
    const orphanSignals: Signal[] = [];

    for (const signal of allSignals) {
      // Extract target key from primary_target_name OR from related entities
      let targetKey: string | null = null;

      if (signal.primary_target_name) {
        targetKey = signal.primary_target_name.toLowerCase().trim();
      } else if (signal.evidence?.related_entities?.length > 0) {
        // For connection signals, use first related entity as target
        const relatedEntity = signal.evidence.related_entities[0];
        if (typeof relatedEntity === 'string') {
          targetKey = relatedEntity.toLowerCase().trim();
        } else if (relatedEntity?.name) {
          targetKey = relatedEntity.name.toLowerCase().trim();
        }
      }

      if (targetKey) {
        const existing = signalsByTarget.get(targetKey) || [];
        existing.push(signal);
        signalsByTarget.set(targetKey, existing);
      } else {
        orphanSignals.push(signal);
      }
    }

    console.log(`   Grouped into ${signalsByTarget.size} targets + ${orphanSignals.length} ungrouped signals`);

    // Process grouped signals with consolidation
    for (const [targetKey, targetSignals] of signalsByTarget) {
      try {
        if (targetSignals.length >= CONSOLIDATION_THRESHOLD) {
          // CONSOLIDATION MODE: Multiple signals about same target -> consolidated prediction(s)
          console.log(`   🔄 Consolidating ${targetSignals.length} signals for target: ${targetKey}`);

          const orgContext = await getOrgContext(supabase, targetSignals[0].organization_id);
          const targetType = await getTargetType(supabase, targetSignals[0].primary_target_id, targetSignals[0].organization_id, targetSignals[0].primary_target_name);

          // Generate consolidated predictions (max 2)
          const consolidatedPredictions = await generateConsolidatedPredictions(
            targetSignals,
            targetKey,
            orgContext,
            targetType
          );

          for (const prediction of consolidatedPredictions) {
            // Use first signal as the "anchor" but reference all signal IDs
            const anchorSignal = targetSignals[0];

            const { error: insertError } = await supabase
              .from('signal_outcomes')
              .insert({
                signal_id: anchorSignal.source_table === 'connection_signals' ? null : anchorSignal.id,
                organization_id: anchorSignal.organization_id,
                target_id: anchorSignal.primary_target_id,
                predicted_outcome: prediction.predicted_outcome,
                predicted_timeframe_days: prediction.predicted_timeframe_days,
                predicted_confidence: prediction.predicted_confidence,
                prediction_reasoning: prediction.prediction_reasoning,
                prediction_evidence: JSON.stringify({
                  consolidated_from_signals: targetSignals.map(s => s.id),
                  signal_count: targetSignals.length,
                  signal_titles: targetSignals.map(s => s.title),
                  verification_criteria: prediction.verification_criteria,
                  refutation_criteria: prediction.refutation_criteria
                }),
                prediction_expires_at: new Date(
                  Date.now() + prediction.predicted_timeframe_days * 1.5 * 24 * 60 * 60 * 1000
                ).toISOString()
              });

            if (!insertError) {
              predictionsCreated++;
              console.log(`     ✅ Consolidated: ${prediction.predicted_outcome.slice(0, 60)}...`);
            } else {
              errors.push(`Save error for consolidated ${targetKey}: ${insertError.message}`);
            }
          }

          // Mark all signals as having predictions
          for (const signal of targetSignals) {
            if (signal.source_table === 'connection_signals') {
              await supabase
                .from('connection_signals')
                .update({ prediction_generated: true })
                .eq('id', signal.id);
            } else {
              await supabase
                .from('signals')
                .update({ has_prediction: true })
                .eq('id', signal.id);
            }
          }

        } else {
          // INDIVIDUAL MODE: Few signals, process normally
          for (const signal of targetSignals) {
            const result = await processIndividualSignal(signal, supabase, orgCache);
            if (result.created) predictionsCreated++;
            if (result.skipped) skipped++;
            if (result.error) errors.push(result.error);
          }
        }
      } catch (err: any) {
        console.error(`   Error processing target ${targetKey}: ${err.message}`);
        errors.push(`Target ${targetKey}: ${err.message}`);
      }
    }

    // Process orphan signals (no target identified)
    for (const signal of orphanSignals) {
      try {
        // Skip mention types that aren't predictive
        if (signal.signal_type === 'mention') {
          console.log(`   Skipping ${signal.id}: mention signal type`);
          skipped++;
          continue;
        }

        console.log(`   Processing: ${signal.title.slice(0, 50)}...`);

        // Get organization context for better predictions
        const orgContext = await getOrgContext(supabase, signal.organization_id);
        const targetType = await getTargetType(supabase, signal.primary_target_id, signal.organization_id, signal.primary_target_name);

        // Generate prediction using Claude
        const prediction = await generatePrediction(signal, orgContext, targetType);

        if (!prediction) {
          console.log(`     No prediction generated (signal may not be predictive)`);

          // Mark as processed so we don't retry - handle both tables
          if (signal.source_table === 'connection_signals') {
            await supabase
              .from('connection_signals')
              .update({ prediction_generated: true })
              .eq('id', signal.id);
          } else {
            await supabase
              .from('signals')
              .update({ has_prediction: true })
              .eq('id', signal.id);
          }

          skipped++;
          continue;
        }

        // Save the prediction
        const { error: insertError } = await supabase
          .from('signal_outcomes')
          .insert({
            signal_id: signal.source_table === 'connection_signals' ? null : signal.id,
            organization_id: signal.organization_id,
            target_id: signal.primary_target_id,
            predicted_outcome: prediction.predicted_outcome,
            predicted_timeframe_days: prediction.predicted_timeframe_days,
            predicted_confidence: prediction.predicted_confidence,
            prediction_reasoning: prediction.prediction_reasoning,
            prediction_evidence: JSON.stringify({
              original_signal_title: signal.title,
              signal_evidence: signal.evidence,
              verification_criteria: prediction.verification_criteria,
              refutation_criteria: prediction.refutation_criteria
            }),
            prediction_expires_at: new Date(
              Date.now() + prediction.predicted_timeframe_days * 1.5 * 24 * 60 * 60 * 1000
            ).toISOString()
          });

        if (insertError) {
          console.error(`     Failed to save prediction: ${insertError.message}`);
          errors.push(`Save error for signal ${signal.id}: ${insertError.message}`);
          continue;
        }

        // Mark signal as having a prediction - handle both tables
        if (signal.source_table === 'connection_signals') {
          await supabase
            .from('connection_signals')
            .update({ prediction_generated: true, prediction_id: signal.id })
            .eq('id', signal.id);
        } else {
          await supabase
            .from('signals')
            .update({ has_prediction: true })
            .eq('id', signal.id);
        }

        predictionsCreated++;
        console.log(`     ✅ Created prediction: ${prediction.predicted_outcome.slice(0, 60)}...`);

      } catch (err: any) {
        console.error(`     Error processing signal ${signal.id}: ${err.message}`);
        errors.push(`Process error for ${signal.id}: ${err.message}`);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    const summary = {
      success: true,
      signals_processed: signals?.length || 0,
      connection_signals_processed: convertedConnections.length,
      total_processed: allSignals.length,
      predictions_created: predictionsCreated,
      skipped,
      duration_seconds: duration,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log(`\n📊 Prediction Generation Complete:`);
    console.log(`   Signals processed: ${signals?.length || 0}`);
    console.log(`   Connection signals processed: ${convertedConnections.length}`);
    console.log(`   Predictions created: ${predictionsCreated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Duration: ${duration}s`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Prediction generation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function generatePrediction(signal: Signal, orgContext: OrgContext | null, targetType: string | null): Promise<Prediction | null> {
  // Build context about the relationship between org and target
  const orgName = orgContext?.name || 'the organization';
  const industry = orgContext?.industry || 'their industry';

  let targetRelationship = '';
  if (targetType && signal.primary_target_name) {
    const relationshipMap: Record<string, string> = {
      'competitor': `${signal.primary_target_name} is a COMPETITOR that ${orgName} is monitoring`,
      'regulator': `${signal.primary_target_name} is a REGULATOR that affects ${orgName}'s operations`,
      'influencer': `${signal.primary_target_name} is an INFLUENCER whose opinions matter to ${orgName}`,
      'topic': `${signal.primary_target_name} is a strategic TOPIC that ${orgName} tracks`,
      'partner': `${signal.primary_target_name} is a PARTNER of ${orgName}`,
      'customer': `${signal.primary_target_name} is a CUSTOMER segment for ${orgName}`,
    };
    targetRelationship = relationshipMap[targetType] || `${signal.primary_target_name} is being tracked by ${orgName}`;
  }

  const prompt = `You are an intelligence analyst generating a VERIFIABLE PREDICTION for ${orgName} (${industry}).

IMPORTANT CONTEXT:
═══════════════════
- You are generating predictions FOR ${orgName}, not about the general market
- ${targetRelationship || 'This signal relates to their strategic intelligence'}
- Predictions should be framed in terms of what ${orgName} should watch for or what will impact them

SIGNAL DETAILS:
═══════════════
Type: ${signal.signal_type}${signal.signal_subtype ? ` / ${signal.signal_subtype}` : ''}
Title: ${signal.title}
Description: ${signal.description}
Target: ${signal.primary_target_name || 'N/A'} (${targetType || signal.primary_target_type || 'N/A'})
Confidence: ${signal.confidence_score}%
${signal.reasoning ? `Reasoning: ${signal.reasoning}` : ''}
${signal.business_implication ? `Business Implication: ${signal.business_implication}` : ''}

Evidence:
${JSON.stringify(signal.evidence, null, 2)}

TASK: Generate a specific, measurable prediction that ${orgName} can use.

RULES FOR GOOD PREDICTIONS:
1. RELEVANT TO ${orgName.toUpperCase()}: Frame predictions as market events, competitor moves, or opportunities that matter to ${orgName}
2. SPECIFIC: "BCG will launch competing service in Q1" NOT "BCG might do something"
3. MEASURABLE: Must be verifiable through news/public information
4. TIME-BOUND: Include a realistic timeframe (7-90 days typically)
5. FALSIFIABLE: Must be possible to prove wrong
6. ACTIONABLE: ${orgName} can prepare or respond to this prediction

EXAMPLES FOR A CONSULTING FIRM TRACKING COMPETITORS:
- "BCG will announce expansion into [specific market] within 45 days, creating direct competition"
- "McKinsey will publish thought leadership on [topic] within 30 days that ${orgName} should respond to"
- "Deloitte will announce a major client win in [sector] within 60 days"
- "Regulatory announcement on [topic] will create new advisory opportunities within 45 days"

BAD PREDICTIONS (not useful to ${orgName}):
- "BCG will continue to exist" (not actionable)
- "Market conditions may change" (too vague)
- "Competition will increase" (not specific)

Return a JSON object with your prediction:
{
  "predicted_outcome": "Specific prediction framed for what ${orgName} should watch for",
  "predicted_timeframe_days": 30,
  "predicted_confidence": 0.65,
  "prediction_reasoning": "Why ${orgName} should expect this and how it affects them",
  "verification_criteria": ["What news/events would confirm this", "Another confirmation signal"],
  "refutation_criteria": ["What would prove this wrong", "Another refutation signal"]
}

If this signal is NOT suitable for prediction (e.g., just a mention, no actionable pattern), return:
{"skip": true, "reason": "Why this signal isn't predictive for ${orgName}"}

Return ONLY the JSON object.`;

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
        max_tokens: 1000,
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
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('       No JSON in response');
      return null;
    }

    const result = JSON.parse(jsonMatch[0]);

    // Check if Claude decided to skip
    if (result.skip) {
      console.log(`       Skipping: ${result.reason}`);
      return null;
    }

    // Validate required fields
    if (!result.predicted_outcome || !result.predicted_timeframe_days) {
      console.log('       Invalid prediction structure');
      return null;
    }

    return {
      predicted_outcome: result.predicted_outcome,
      predicted_timeframe_days: Math.max(7, Math.min(90, result.predicted_timeframe_days || DEFAULT_PREDICTION_WINDOW_DAYS)),
      predicted_confidence: Math.max(0.1, Math.min(0.95, result.predicted_confidence || 0.5)),
      prediction_reasoning: result.prediction_reasoning || '',
      verification_criteria: result.verification_criteria || [],
      refutation_criteria: result.refutation_criteria || []
    };

  } catch (error: any) {
    console.error(`       Claude prediction error: ${error.message}`);
    return null;
  }
}

// ============================================================================
// Helper: Process individual signal (for targets with <3 signals)
// ============================================================================
async function processIndividualSignal(
  signal: Signal,
  supabase: ReturnType<typeof createClient>,
  orgCache: Map<string, OrgContext>
): Promise<{ created: boolean; skipped: boolean; error?: string }> {
  try {
    // Skip mention types that aren't predictive
    if (signal.signal_type === 'mention') {
      console.log(`   Skipping ${signal.id}: mention signal type`);
      return { created: false, skipped: true };
    }

    console.log(`   Processing: ${signal.title.slice(0, 50)}...`);

    // Get org context (use cache if available)
    let orgContext = orgCache.get(signal.organization_id) || null;
    if (!orgContext) {
      const { data } = await supabase
        .from('organizations')
        .select('name, industry')
        .eq('id', signal.organization_id)
        .single();
      if (data) {
        orgContext = { name: data.name, industry: data.industry };
        orgCache.set(signal.organization_id, orgContext);
      }
    }

    // Get target type
    let targetType: string | null = null;
    if (signal.primary_target_id) {
      const { data } = await supabase
        .from('intelligence_targets')
        .select('target_type')
        .eq('id', signal.primary_target_id)
        .single();
      if (data?.target_type) targetType = data.target_type;
    }

    // Generate prediction
    const prediction = await generatePrediction(signal, orgContext, targetType);

    if (!prediction) {
      // Mark as processed so we don't retry
      if (signal.source_table === 'connection_signals') {
        await supabase
          .from('connection_signals')
          .update({ prediction_generated: true })
          .eq('id', signal.id);
      } else {
        await supabase
          .from('signals')
          .update({ has_prediction: true })
          .eq('id', signal.id);
      }
      return { created: false, skipped: true };
    }

    // Save the prediction
    const { error: insertError } = await supabase
      .from('signal_outcomes')
      .insert({
        signal_id: signal.source_table === 'connection_signals' ? null : signal.id,
        organization_id: signal.organization_id,
        target_id: signal.primary_target_id,
        predicted_outcome: prediction.predicted_outcome,
        predicted_timeframe_days: prediction.predicted_timeframe_days,
        predicted_confidence: prediction.predicted_confidence,
        prediction_reasoning: prediction.prediction_reasoning,
        prediction_evidence: JSON.stringify({
          original_signal_title: signal.title,
          signal_evidence: signal.evidence,
          verification_criteria: prediction.verification_criteria,
          refutation_criteria: prediction.refutation_criteria
        }),
        prediction_expires_at: new Date(
          Date.now() + prediction.predicted_timeframe_days * 1.5 * 24 * 60 * 60 * 1000
        ).toISOString()
      });

    if (insertError) {
      console.error(`     Failed to save prediction: ${insertError.message}`);
      return { created: false, skipped: false, error: `Save error for signal ${signal.id}: ${insertError.message}` };
    }

    // Mark signal as having a prediction
    if (signal.source_table === 'connection_signals') {
      await supabase
        .from('connection_signals')
        .update({ prediction_generated: true, prediction_id: signal.id })
        .eq('id', signal.id);
    } else {
      await supabase
        .from('signals')
        .update({ has_prediction: true })
        .eq('id', signal.id);
    }

    console.log(`     ✅ Created prediction: ${prediction.predicted_outcome.slice(0, 60)}...`);
    return { created: true, skipped: false };

  } catch (err: any) {
    console.error(`     Error processing signal ${signal.id}: ${err.message}`);
    return { created: false, skipped: false, error: `Process error for ${signal.id}: ${err.message}` };
  }
}

// ============================================================================
// Helper: Generate CONSOLIDATED predictions from multiple signals about same target
// ============================================================================
async function generateConsolidatedPredictions(
  signals: Signal[],
  targetName: string,
  orgContext: OrgContext | null,
  targetType: string | null
): Promise<Prediction[]> {
  const orgName = orgContext?.name || 'the organization';
  const industry = orgContext?.industry || 'their industry';

  let targetRelationship = '';
  if (targetType) {
    const relationshipMap: Record<string, string> = {
      'competitor': `${targetName} is a COMPETITOR that ${orgName} is monitoring`,
      'regulator': `${targetName} is a REGULATOR that affects ${orgName}'s operations`,
      'influencer': `${targetName} is an INFLUENCER whose opinions matter to ${orgName}`,
      'topic': `${targetName} is a strategic TOPIC that ${orgName} tracks`,
      'partner': `${targetName} is a PARTNER of ${orgName}`,
      'customer': `${targetName} is a CUSTOMER segment for ${orgName}`,
    };
    targetRelationship = relationshipMap[targetType] || `${targetName} is being tracked by ${orgName}`;
  }

  // Build combined evidence from all signals
  const signalSummaries = signals.map((s, i) => `
Signal ${i + 1}:
- Type: ${s.signal_type}${s.signal_subtype ? ` / ${s.signal_subtype}` : ''}
- Title: ${s.title}
- Description: ${s.description}
- Confidence: ${s.confidence_score}%
- Business Implication: ${s.business_implication || 'N/A'}
`).join('\n');

  const prompt = `You are an intelligence analyst generating CONSOLIDATED PREDICTIONS for ${orgName} (${industry}).

IMPORTANT CONTEXT:
═══════════════════
- You have ${signals.length} related signals all concerning: ${targetName}
- ${targetRelationship || 'This entity relates to their strategic intelligence'}
- Instead of ${signals.length} separate predictions, create 1-2 HIGH-QUALITY consolidated predictions

RELATED SIGNALS ABOUT ${targetName.toUpperCase()}:
═══════════════════════════════════════════════════
${signalSummaries}

TASK: Consolidate these ${signals.length} signals into 1-2 comprehensive predictions.

CONSOLIDATION RULES:
1. SYNTHESIZE: Combine related signals into a unified prediction
2. PRIORITIZE: Focus on the most impactful/actionable patterns
3. AVOID REDUNDANCY: Don't repeat the same prediction in different words
4. MAX 2 PREDICTIONS: Even if there are many signals, output at most 2 predictions

Return a JSON array with 1-2 predictions:
{
  "predictions": [
    {
      "predicted_outcome": "Consolidated prediction synthesizing the key pattern",
      "predicted_timeframe_days": 30,
      "predicted_confidence": 0.7,
      "prediction_reasoning": "Why this matters to ${orgName} - references multiple signals",
      "verification_criteria": ["What news/events would confirm this"],
      "refutation_criteria": ["What would prove this wrong"]
    }
  ]
}

If the signals don't contain enough predictive content, return:
{"predictions": [], "reason": "Why these signals aren't suitable for predictions"}

Return ONLY the JSON object.`;

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
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('       No JSON in consolidated response');
      return [];
    }

    const result = JSON.parse(jsonMatch[0]);

    if (!result.predictions || result.predictions.length === 0) {
      console.log(`       No consolidated predictions: ${result.reason || 'unknown'}`);
      return [];
    }

    // Validate and return predictions (max 2)
    return result.predictions.slice(0, MAX_PREDICTIONS_PER_TARGET).map((p: any) => ({
      predicted_outcome: p.predicted_outcome,
      predicted_timeframe_days: Math.max(7, Math.min(90, p.predicted_timeframe_days || DEFAULT_PREDICTION_WINDOW_DAYS)),
      predicted_confidence: Math.max(0.1, Math.min(0.95, p.predicted_confidence || 0.6)),
      prediction_reasoning: p.prediction_reasoning || '',
      verification_criteria: p.verification_criteria || [],
      refutation_criteria: p.refutation_criteria || []
    }));

  } catch (error: any) {
    console.error(`       Claude consolidation error: ${error.message}`);
    return [];
  }
}
