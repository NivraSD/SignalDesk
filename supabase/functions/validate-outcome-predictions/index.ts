// Validate Outcome Predictions
// Searches for evidence that predictions came true or expired
// Closes the feedback loop for the learning system

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

// Configuration
const MAX_PREDICTIONS_PER_RUN = 50;
const SIMILARITY_THRESHOLD = 0.35;  // For semantic search
const MATCH_THRESHOLD = 0.6;  // Min score to consider a match

interface Prediction {
  id: string;
  signal_id: string;
  organization_id: string;
  target_id: string | null;
  predicted_outcome: string;
  predicted_timeframe_days: number;
  predicted_confidence: number;
  predicted_at: string;
  prediction_expires_at: string;
  prediction_evidence: any;
}

interface Article {
  id: string;
  title: string;
  description: string;
  content: string | null;
  published_at: string | null;
  source_name: string;
}

interface ValidationResult {
  outcome_occurred: 'yes' | 'no' | 'partial' | 'inconclusive';
  match_score: number;
  actual_outcome: string;
  evidence_summary: string;
  reasoning: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('🔍 VALIDATE OUTCOME PREDICTIONS');
  console.log(`   Time: ${new Date().toISOString()}`);

  try {
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organization_id;
    const maxPredictions = body.max_predictions || MAX_PREDICTIONS_PER_RUN;

    // Get predictions that need validation:
    // 1. Not yet validated AND
    // 2. Either past expiration OR at least 3 days old (give time for evidence to appear)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('signal_outcomes')
      .select('*')
      .is('validated_at', null)
      .or(`prediction_expires_at.lt.${new Date().toISOString()},predicted_at.lt.${threeDaysAgo}`)
      .order('predicted_at', { ascending: true })
      .limit(maxPredictions);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: predictions, error: predError } = await query;

    if (predError) {
      throw new Error(`Failed to load predictions: ${predError.message}`);
    }

    if (!predictions || predictions.length === 0) {
      console.log('   No predictions ready for validation');
      return new Response(JSON.stringify({
        success: true,
        predictions_checked: 0,
        validated: 0,
        accurate: 0,
        inaccurate: 0,
        inconclusive: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`   Found ${predictions.length} predictions to validate`);

    let validated = 0;
    let accurate = 0;
    let inaccurate = 0;
    let inconclusive = 0;
    let expired = 0;
    const errors: string[] = [];

    for (const prediction of predictions as Prediction[]) {
      try {
        console.log(`\n   Validating: ${prediction.predicted_outcome.slice(0, 60)}...`);

        // Search for evidence articles
        const evidenceArticles = await searchForEvidence(
          supabase,
          prediction.predicted_outcome,
          prediction.predicted_at,
          prediction.target_id
        );

        console.log(`     Found ${evidenceArticles.length} potential evidence articles`);

        const isExpired = new Date(prediction.prediction_expires_at) < new Date();

        if (evidenceArticles.length === 0) {
          if (isExpired) {
            // No evidence found and window closed - mark as expired
            console.log(`     ⏰ Expired: No evidence found within window`);

            await supabase
              .from('signal_outcomes')
              .update({
                was_accurate: false,
                false_positive: true,
                validated_by: 'expired',
                validated_at: new Date().toISOString(),
                validation_notes: 'No evidence found within prediction window'
              })
              .eq('id', prediction.id);

            expired++;
            inaccurate++;
            validated++;
          } else {
            console.log(`     ⏳ Still waiting: No evidence yet, window still open`);
          }
          continue;
        }

        // Use Claude to evaluate if evidence matches prediction
        const validation = await evaluateEvidence(prediction, evidenceArticles);

        if (!validation) {
          console.log(`     ❓ Could not evaluate evidence`);
          inconclusive++;
          continue;
        }

        // Update the prediction record
        const updateData: any = {
          actual_outcome: validation.actual_outcome,
          outcome_detected_at: evidenceArticles[0].published_at || new Date().toISOString(),
          outcome_article_ids: evidenceArticles.slice(0, 5).map(a => a.id),
          outcome_evidence: validation.evidence_summary,
          outcome_match: validation.match_score,
          validated_by: 'auto',
          validated_at: new Date().toISOString(),
          validation_notes: validation.reasoning
        };

        // Determine accuracy
        if (validation.outcome_occurred === 'yes' && validation.match_score >= MATCH_THRESHOLD) {
          updateData.was_accurate = true;
          updateData.false_positive = false;
          updateData.signal_to_outcome_days = Math.round(
            (new Date(evidenceArticles[0].published_at || Date.now()).getTime() - new Date(prediction.predicted_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          accurate++;
          console.log(`     ✅ ACCURATE: ${validation.actual_outcome.slice(0, 60)}...`);
        } else if (validation.outcome_occurred === 'partial') {
          updateData.was_accurate = validation.match_score >= 0.5;
          updateData.outcome_match = validation.match_score;
          if (validation.match_score >= 0.5) accurate++;
          else inaccurate++;
          console.log(`     🔶 PARTIAL (${Math.round(validation.match_score * 100)}%): ${validation.actual_outcome.slice(0, 60)}...`);
        } else if (validation.outcome_occurred === 'no' || isExpired) {
          updateData.was_accurate = false;
          updateData.false_positive = true;
          inaccurate++;
          console.log(`     ❌ INACCURATE: ${validation.reasoning.slice(0, 60)}...`);
        } else {
          // Inconclusive - don't mark as validated yet
          console.log(`     ❓ INCONCLUSIVE: ${validation.reasoning.slice(0, 60)}...`);
          inconclusive++;
          continue;
        }

        await supabase
          .from('signal_outcomes')
          .update(updateData)
          .eq('id', prediction.id);

        validated++;

        // Update signal accuracy if we have a result
        if (updateData.was_accurate !== undefined) {
          await updateSignalAccuracy(supabase, prediction);
        }

      } catch (err: any) {
        console.error(`     Error validating ${prediction.id}: ${err.message}`);
        errors.push(`${prediction.id}: ${err.message}`);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    const summary = {
      success: true,
      predictions_checked: predictions.length,
      validated,
      accurate,
      inaccurate,
      inconclusive,
      expired,
      duration_seconds: duration,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log(`\n📊 Validation Complete:`);
    console.log(`   Checked: ${predictions.length}`);
    console.log(`   Validated: ${validated}`);
    console.log(`   Accurate: ${accurate}`);
    console.log(`   Inaccurate: ${inaccurate}`);
    console.log(`   Inconclusive: ${inconclusive}`);
    console.log(`   Expired: ${expired}`);
    console.log(`   Duration: ${duration}s`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Validation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function searchForEvidence(
  supabase: any,
  predictionText: string,
  afterDate: string,
  targetId: string | null
): Promise<Article[]> {
  // Generate embedding for the prediction
  const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: predictionText
    })
  });

  if (!embeddingResponse.ok) {
    console.log('     Failed to generate embedding, falling back to text search');
    return fallbackTextSearch(supabase, predictionText, afterDate);
  }

  const embeddingData = await embeddingResponse.json();
  const embedding = embeddingData.data?.[0]?.embedding;

  if (!embedding) {
    return fallbackTextSearch(supabase, predictionText, afterDate);
  }

  // Search for similar articles using the embedding
  const { data: matches, error } = await supabase.rpc('match_articles', {
    query_embedding: embedding,
    match_threshold: SIMILARITY_THRESHOLD,
    match_count: 10,
    after_date: afterDate
  });

  if (error) {
    console.log(`     RPC error: ${error.message}, falling back to text search`);
    return fallbackTextSearch(supabase, predictionText, afterDate);
  }

  // Get full article details
  if (!matches || matches.length === 0) {
    return fallbackTextSearch(supabase, predictionText, afterDate);
  }

  const articleIds = matches.map((m: any) => m.id);
  const { data: articles } = await supabase
    .from('raw_articles')
    .select('id, title, description, content, published_at, source_name')
    .in('id', articleIds);

  return articles || [];
}

async function fallbackTextSearch(
  supabase: any,
  predictionText: string,
  afterDate: string
): Promise<Article[]> {
  // Extract key terms from prediction
  const terms = predictionText
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 3 && !['will', 'that', 'this', 'with', 'from', 'have', 'been', 'would', 'could', 'should', 'their', 'about', 'within', 'announce', 'expected'].includes(t))
    .slice(0, 5);

  if (terms.length === 0) return [];

  // Search for articles containing these terms
  const searchQuery = terms.join(' | ');

  const { data: articles } = await supabase
    .from('raw_articles')
    .select('id, title, description, content, published_at, source_name')
    .gte('scraped_at', afterDate)
    .or(`title.ilike.%${terms[0]}%,description.ilike.%${terms[0]}%`)
    .limit(20);

  return articles || [];
}

async function evaluateEvidence(
  prediction: Prediction,
  articles: Article[]
): Promise<ValidationResult | null> {
  const articleSummaries = articles.slice(0, 5).map(a => ({
    title: a.title,
    description: a.description?.slice(0, 500) || '',
    source: a.source_name,
    date: a.published_at
  }));

  const prompt = `You are validating whether a prediction came true based on news evidence.

PREDICTION:
═══════════
"${prediction.predicted_outcome}"
Made on: ${new Date(prediction.predicted_at).toISOString().split('T')[0]}
Window: ${prediction.predicted_timeframe_days} days
Confidence: ${Math.round(prediction.predicted_confidence * 100)}%

POTENTIAL EVIDENCE (articles found since prediction):
════════════════════════════════════════════════════
${articleSummaries.map((a, i) => `
[${i + 1}] ${a.title}
    Source: ${a.source} | Date: ${a.date?.split('T')[0] || 'Unknown'}
    ${a.description}
`).join('\n')}

TASK: Evaluate if this evidence confirms, refutes, or is inconclusive about the prediction.

Return a JSON object:
{
  "outcome_occurred": "yes|no|partial|inconclusive",
  "match_score": 0.75,
  "actual_outcome": "What actually happened according to the evidence",
  "evidence_summary": "Which articles support this and why",
  "reasoning": "Why you reached this conclusion"
}

SCORING GUIDE:
- yes + 0.8-1.0: Clear confirmation of the specific prediction
- yes + 0.6-0.8: Prediction confirmed but with some differences
- partial + 0.4-0.6: Related outcome but not exactly what was predicted
- no + 0.0-0.3: Evidence shows opposite or unrelated outcome
- inconclusive: Evidence doesn't clearly confirm or refute

Be STRICT - only mark "yes" if the evidence clearly shows the predicted outcome occurred.
Mark "partial" if something related happened but not exactly as predicted.
Mark "inconclusive" if articles are tangentially related but don't address the prediction.

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
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const result = JSON.parse(jsonMatch[0]);

    return {
      outcome_occurred: result.outcome_occurred,
      match_score: Math.max(0, Math.min(1, result.match_score || 0)),
      actual_outcome: result.actual_outcome || '',
      evidence_summary: result.evidence_summary || '',
      reasoning: result.reasoning || ''
    };

  } catch (error: any) {
    console.error(`     Claude evaluation error: ${error.message}`);
    return null;
  }
}

async function updateSignalAccuracy(supabase: any, prediction: Prediction) {
  // Update or create accuracy metrics for this target
  if (!prediction.target_id) return;

  const { data: existing } = await supabase
    .from('signal_accuracy_metrics')
    .select('*')
    .eq('target_id', prediction.target_id)
    .eq('signal_type', 'all')
    .single();

  if (existing) {
    // Update existing metrics
    const total = existing.total_predictions + 1;
    const accurate = existing.accurate_predictions + (prediction.was_accurate ? 1 : 0);

    await supabase
      .from('signal_accuracy_metrics')
      .update({
        total_predictions: total,
        accurate_predictions: accurate,
        accuracy_rate: accurate / total,
        computed_at: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    // Create new metrics
    await supabase
      .from('signal_accuracy_metrics')
      .insert({
        target_id: prediction.target_id,
        organization_id: prediction.organization_id,
        signal_type: 'all',
        total_predictions: 1,
        accurate_predictions: prediction.was_accurate ? 1 : 0,
        accuracy_rate: prediction.was_accurate ? 1 : 0
      });
  }
}
