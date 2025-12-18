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
    const { data: connectionSignals, error: connError } = await supabase
      .from('connection_signals')
      .select('*')
      .or('prediction_generated.is.null,prediction_generated.eq.false')
      .order('created_at', { ascending: false })
      .limit(MAX_CONNECTIONS_PER_RUN);

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
    const allSignals: Signal[] = [
      ...(signals || []).map((s: any) => ({ ...s, source_table: 'signals' as const })),
      ...convertedConnections
    ];

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

    for (const signal of allSignals) {
      try {
        // Skip mention types that aren't predictive
        if (signal.signal_type === 'mention') {
          console.log(`   Skipping ${signal.id}: mention signal type`);
          skipped++;
          continue;
        }

        console.log(`   Processing: ${signal.title.slice(0, 50)}...`);

        // Generate prediction using Claude
        const prediction = await generatePrediction(signal);

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
            signal_id: signal.id,
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

async function generatePrediction(signal: Signal): Promise<Prediction | null> {
  const prompt = `You are an intelligence analyst generating a VERIFIABLE PREDICTION from an intelligence signal.

SIGNAL DETAILS:
═══════════════
Type: ${signal.signal_type}${signal.signal_subtype ? ` / ${signal.signal_subtype}` : ''}
Title: ${signal.title}
Description: ${signal.description}
Target: ${signal.primary_target_name || 'N/A'} (${signal.primary_target_type || 'N/A'})
Confidence: ${signal.confidence_score}%
${signal.reasoning ? `Reasoning: ${signal.reasoning}` : ''}
${signal.business_implication ? `Business Implication: ${signal.business_implication}` : ''}

Evidence:
${JSON.stringify(signal.evidence, null, 2)}

TASK: Generate a specific, measurable prediction that can be validated.

RULES FOR GOOD PREDICTIONS:
1. SPECIFIC: "Company X will announce acquisition of Y" NOT "Company X might do something"
2. MEASURABLE: Must be verifiable through news/public information
3. TIME-BOUND: Include a realistic timeframe (7-90 days typically)
4. FALSIFIABLE: Must be possible to prove wrong
5. GROUNDED: Based on the evidence in the signal

EXAMPLES OF GOOD PREDICTIONS:
- "OpenAI will announce a new model release within 30 days"
- "Glencore will publish Chile expansion details within 45 days"
- "FTC will announce formal investigation within 60 days"
- "Company will respond to competitor announcement within 14 days"

EXAMPLES OF BAD PREDICTIONS (too vague):
- "OpenAI will continue growing"
- "Market conditions may change"
- "Company might face challenges"

Return a JSON object with your prediction:
{
  "predicted_outcome": "Specific, measurable prediction statement",
  "predicted_timeframe_days": 30,
  "predicted_confidence": 0.65,
  "prediction_reasoning": "Why you expect this outcome based on the evidence",
  "verification_criteria": ["What evidence would confirm this", "Another confirmation signal"],
  "refutation_criteria": ["What would prove this wrong", "Another refutation signal"]
}

If this signal is NOT suitable for prediction (e.g., just a mention, no actionable pattern), return:
{"skip": true, "reason": "Why this signal isn't predictive"}

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
