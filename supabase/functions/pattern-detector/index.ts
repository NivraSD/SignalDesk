// Pattern Detector - Analyzes target_intelligence to detect meaningful patterns
// Generates prediction_signals when thresholds are met

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuration
const TIME_WINDOW_DAYS = 7;
const BASELINE_DAYS = 30;
const MOMENTUM_THRESHOLD = 3; // Activity must be 3x baseline
const MIN_MENTIONS_FOR_SIGNAL = 3; // Need at least 3 mentions

// Track prediction save errors for debugging
const predictionErrors: string[] = [];

// Helper: Save signal to predictions table for UI display
async function saveToPredictions(orgId: string, target: any, prediction: {
  title: string;
  description: string;
  confidence_score: number;
  impact_level: string;
  category: string;
  time_horizon: string;
  status: string;
}) {
  try {
    // Check for existing similar prediction to avoid duplicates
    const { data: existing, error: checkError } = await supabase
      .from('predictions')
      .select('id')
      .eq('organization_id', orgId)
      .eq('target_id', target.id)
      .eq('title', prediction.title)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error(`Check error for ${target.name}:`, checkError);
      predictionErrors.push(`Check: ${checkError.message}`);
    }

    if (existing) {
      console.log(`   ⏭️ Prediction already exists for ${target.name}, skipping`);
      return;
    }

    const insertData = {
      organization_id: orgId,
      target_id: target.id,
      target_name: target.name,
      target_type: target.type,
      title: prediction.title,
      description: prediction.description,
      confidence_score: prediction.confidence_score,
      impact_level: prediction.impact_level,
      category: prediction.category,
      time_horizon: prediction.time_horizon,
      status: prediction.status
    };

    console.log(`   📝 Inserting prediction:`, JSON.stringify(insertData).substring(0, 100));

    const { data, error } = await supabase
      .from('predictions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to save prediction for ${target.name}:`, error.message, error.details, error.hint);
      predictionErrors.push(`Insert ${target.name}: ${error.message} | ${error.details || ''} | ${error.hint || ''}`);
    } else {
      console.log(`   💡 Created prediction: ${prediction.title} (id: ${data?.id})`);
    }
  } catch (e: any) {
    console.error(`❌ Error saving prediction:`, e.message);
    predictionErrors.push(`Exception: ${e.message}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { organization_id } = await req.json();

    console.log(`🔍 Pattern Detector Starting for org: ${organization_id}`);

    const now = new Date();
    const windowStart = new Date(now.getTime() - TIME_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const baselineStart = new Date(now.getTime() - BASELINE_DAYS * 24 * 60 * 60 * 1000);

    // Load intelligence targets
    const { data: targets } = await supabase
      .from('intelligence_targets')
      .select('id, name, type')
      .eq('organization_id', organization_id);

    if (!targets || targets.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        signals_generated: 0,
        message: 'No targets to analyze'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`   Analyzing ${targets.length} targets`);

    const signalsGenerated = [];

    // Analyze each target
    for (const target of targets) {
      // Get recent mentions (last TIME_WINDOW_DAYS)
      const { data: recentMentions } = await supabase
        .from('target_intelligence')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('target_id', target.id)
        .gte('mention_date', windowStart.toISOString())
        .order('mention_date', { ascending: false });

      // Get baseline mentions (last BASELINE_DAYS for comparison)
      const { data: baselineMentions } = await supabase
        .from('target_intelligence')
        .select('mention_date')
        .eq('organization_id', organization_id)
        .eq('target_id', target.id)
        .gte('mention_date', baselineStart.toISOString())
        .lt('mention_date', windowStart.toISOString());

      const recentCount = recentMentions?.length || 0;
      const baselineCount = baselineMentions?.length || 0;

      // Skip if no recent activity
      if (recentCount < MIN_MENTIONS_FOR_SIGNAL) continue;

      // Calculate baseline average per TIME_WINDOW_DAYS
      const baselineAvg = (baselineCount / (BASELINE_DAYS - TIME_WINDOW_DAYS)) * TIME_WINDOW_DAYS;

      // === DETECT PATTERN 1: MOMENTUM ===
      if (baselineAvg > 0 && recentCount >= MOMENTUM_THRESHOLD * baselineAvg) {
        const momentumSignal = await detectMomentum(
          target,
          recentMentions!,
          recentCount,
          baselineAvg,
          organization_id
        );
        if (momentumSignal) signalsGenerated.push(momentumSignal);
      }

      // === DETECT PATTERN 2: SENTIMENT SHIFT ===
      if (recentCount >= 3) {
        const sentimentSignal = await detectSentimentShift(
          target,
          recentMentions!,
          organization_id
        );
        if (sentimentSignal) signalsGenerated.push(sentimentSignal);
      }

      // === DETECT PATTERN 3: CATEGORY CLUSTERING ===
      if (recentCount >= 4) {
        const clusterSignal = await detectCategoryClustering(
          target,
          recentMentions!,
          organization_id
        );
        if (clusterSignal) signalsGenerated.push(clusterSignal);
      }
    }

    console.log(`✅ Pattern Detection Complete: ${signalsGenerated.length} signals generated`);
    if (predictionErrors.length > 0) {
      console.log(`⚠️ Prediction save errors: ${predictionErrors.length}`);
      predictionErrors.forEach(e => console.log(`   - ${e}`));
    }

    return new Response(JSON.stringify({
      success: true,
      signals_generated: signalsGenerated.length,
      signals: signalsGenerated,
      prediction_errors: predictionErrors.length > 0 ? predictionErrors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Pattern Detector error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ============================================================================
// PATTERN 1: MOMENTUM DETECTION
// Detects when a target's mention frequency significantly exceeds baseline
// ============================================================================
async function detectMomentum(
  target: any,
  mentions: any[],
  currentCount: number,
  baselineAvg: number,
  orgId: string
) {
  const multiplier = currentCount / baselineAvg;
  const signalStrength = Math.min(100, Math.round((multiplier / MOMENTUM_THRESHOLD) * 50 + 50));

  // Sentiment distribution
  const sentiments = mentions.map(m => m.sentiment).filter(Boolean);
  const sentimentDist = {
    positive: sentiments.filter(s => s === 'positive').length,
    negative: sentiments.filter(s => s === 'negative').length,
    neutral: sentiments.filter(s => s === 'neutral').length,
    mixed: sentiments.filter(s => s === 'mixed').length
  };

  // Determine prediction type based on sentiment
  let predictionType = 'competitive_threat';
  const negativeRatio = sentimentDist.negative / sentiments.length;
  if (negativeRatio > 0.5) {
    predictionType = 'crisis_building';
  } else if (sentimentDist.positive > sentimentDist.negative) {
    predictionType = 'opportunity';
  }

  // Save signal
  const { data, error } = await supabase
    .from('prediction_signals')
    .insert({
      organization_id: orgId,
      target_id: target.id,
      target_name: target.name,
      target_type: target.type,
      signal_type: 'momentum',
      signal_strength: signalStrength,
      confidence_score: signalStrength,
      pattern_description: `${target.name} activity increased ${multiplier.toFixed(1)}x above baseline (${currentCount} mentions vs ${baselineAvg.toFixed(1)} avg)`,
      baseline_comparison: {
        previous_avg: baselineAvg,
        current_count: currentCount,
        multiplier: multiplier,
        timeframe: `${TIME_WINDOW_DAYS}days`
      },
      time_window_days: TIME_WINDOW_DAYS,
      supporting_article_ids: mentions.map(m => m.id),
      article_count: currentCount,
      first_mention: mentions[mentions.length - 1].mention_date,
      latest_mention: mentions[0].mention_date,
      sentiment_distribution: sentimentDist,
      sentiment_trend: negativeRatio > 0.5 ? 'declining' : 'stable',
      should_predict: signalStrength >= 70,
      prediction_type: predictionType,
      recommendation: signalStrength >= 70
        ? `High activity detected - ${predictionType.replace('_', ' ')} likely`
        : `Monitor closely - activity trending up`,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    console.error(`Failed to save momentum signal:`, error);
    return null;
  }

  // ALSO save to predictions table for UI display
  await saveToPredictions(orgId, target, {
    title: `${target.name}: Activity Surge Detected`,
    description: `${target.name} activity increased ${multiplier.toFixed(1)}x above baseline (${currentCount} mentions vs ${baselineAvg.toFixed(1)} avg). ${predictionType === 'competitive_threat' ? 'This could signal a major competitive move.' : predictionType === 'crisis_building' ? 'Negative sentiment suggests potential crisis.' : 'This could present an opportunity.'}`,
    confidence_score: signalStrength,
    impact_level: signalStrength >= 80 ? 'high' : signalStrength >= 60 ? 'medium' : 'low',
    category: predictionType === 'competitive_threat' ? 'competitor' : predictionType === 'crisis_building' ? 'risk' : 'market',
    time_horizon: '1-month',
    status: 'active'
  });

  console.log(`   📈 MOMENTUM signal: ${target.name} (${multiplier.toFixed(1)}x, strength: ${signalStrength})`);
  return data;
}

// ============================================================================
// PATTERN 2: SENTIMENT SHIFT DETECTION
// Detects significant changes in sentiment over time
// ============================================================================
async function detectSentimentShift(target: any, mentions: any[], orgId: string) {
  const sentiments = mentions.map(m => ({ date: m.mention_date, sentiment: m.sentiment })).filter(m => m.sentiment);

  if (sentiments.length < 3) return null;

  // Split into early/late periods
  const midpoint = Math.floor(sentiments.length / 2);
  const early = sentiments.slice(midpoint);
  const late = sentiments.slice(0, midpoint);

  const countSentiment = (items: any[], type: string) =>
    items.filter(i => i.sentiment === type).length;

  const earlyNeg = countSentiment(early, 'negative');
  const lateNeg = countSentiment(late, 'negative');
  const earlyPos = countSentiment(early, 'positive');
  const latePos = countSentiment(late, 'positive');

  // Detect significant shift
  const negativeShift = lateNeg > 0 && lateNeg > earlyNeg * 2;
  const positiveShift = latePos > 0 && latePos > earlyPos * 2;

  if (!negativeShift && !positiveShift) return null;

  const trend = negativeShift ? 'declining' : 'improving';
  const signalStrength = Math.min(100, Math.round(((lateNeg + latePos) / late.length) * 100));

  const { data, error } = await supabase
    .from('prediction_signals')
    .insert({
      organization_id: orgId,
      target_id: target.id,
      target_name: target.name,
      target_type: target.type,
      signal_type: 'sentiment_shift',
      signal_strength: signalStrength,
      confidence_score: signalStrength,
      pattern_description: `${target.name} sentiment shifting ${trend} (${negativeShift ? 'more negative' : 'more positive'} coverage)`,
      time_window_days: TIME_WINDOW_DAYS,
      supporting_article_ids: mentions.map(m => m.id),
      article_count: mentions.length,
      first_mention: mentions[mentions.length - 1].mention_date,
      latest_mention: mentions[0].mention_date,
      sentiment_trend: trend,
      should_predict: signalStrength >= 70 && negativeShift,
      prediction_type: negativeShift ? 'crisis_building' : 'opportunity',
      recommendation: negativeShift
        ? `Sentiment declining - potential reputation risk`
        : `Positive momentum building`,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    console.error(`Failed to save sentiment shift signal:`, error);
    return null;
  }

  // ALSO save to predictions table for UI display
  await saveToPredictions(orgId, target, {
    title: `${target.name}: ${trend === 'declining' ? 'Sentiment Declining' : 'Sentiment Improving'}`,
    description: `Sentiment for ${target.name} has shifted ${trend === 'declining' ? 'negatively' : 'positively'}. ${trend === 'declining' ? 'This may indicate emerging issues or negative press.' : 'This suggests improving perception or positive developments.'}`,
    confidence_score: signalStrength,
    impact_level: signalStrength >= 80 ? 'high' : signalStrength >= 60 ? 'medium' : 'low',
    category: trend === 'declining' ? 'risk' : 'trend',
    time_horizon: '1-month',
    status: 'active'
  });

  console.log(`   📊 SENTIMENT SHIFT signal: ${target.name} (${trend}, strength: ${signalStrength})`);
  return data;
}

// ============================================================================
// PATTERN 3: CATEGORY CLUSTERING DETECTION
// Detects when articles cluster around specific categories (e.g., multiple lawsuits)
// ============================================================================
async function detectCategoryClustering(target: any, mentions: any[], orgId: string) {
  const categories = mentions.map(m => m.category).filter(Boolean);
  if (categories.length < 4) return null;

  // Count category frequencies
  const catCounts: Record<string, number> = {};
  categories.forEach(cat => {
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });

  // Find dominant category
  const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  const [dominantCat, count] = sortedCats[0];

  // Only signal if one category dominates (>50% of mentions)
  const dominanceRatio = count / categories.length;
  if (dominanceRatio < 0.5) return null;

  const signalStrength = Math.min(100, Math.round(dominanceRatio * 100 + count * 10));

  // Determine prediction type
  const crisisCategories = ['crisis', 'legal', 'regulatory'];
  const predictionType = crisisCategories.includes(dominantCat) ? 'crisis_building' : 'market_shift';

  const { data, error } = await supabase
    .from('prediction_signals')
    .insert({
      organization_id: orgId,
      target_id: target.id,
      target_name: target.name,
      target_type: target.type,
      signal_type: 'category_clustering',
      signal_strength: signalStrength,
      confidence_score: signalStrength,
      pattern_description: `${target.name} showing ${count} ${dominantCat} events (${Math.round(dominanceRatio * 100)}% of recent activity)`,
      time_window_days: TIME_WINDOW_DAYS,
      supporting_article_ids: mentions.filter(m => m.category === dominantCat).map(m => m.id),
      article_count: count,
      first_mention: mentions[mentions.length - 1].mention_date,
      latest_mention: mentions[0].mention_date,
      category_distribution: catCounts,
      primary_category: dominantCat,
      should_predict: signalStrength >= 70,
      prediction_type: predictionType,
      recommendation: `Concentrated ${dominantCat} activity - ${predictionType.replace('_', ' ')} possible`,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    console.error(`Failed to save clustering signal:`, error);
    return null;
  }

  // ALSO save to predictions table for UI display
  await saveToPredictions(orgId, target, {
    title: `${target.name}: ${dominantCat.charAt(0).toUpperCase() + dominantCat.slice(1)} Activity Concentration`,
    description: `${target.name} showing ${count} ${dominantCat} events (${Math.round(dominanceRatio * 100)}% of recent activity). ${predictionType === 'crisis_building' ? 'This concentration may signal an emerging crisis or legal/regulatory issue.' : 'This pattern suggests significant market activity or strategic shift.'}`,
    confidence_score: signalStrength,
    impact_level: signalStrength >= 80 ? 'high' : signalStrength >= 60 ? 'medium' : 'low',
    category: predictionType === 'crisis_building' ? 'risk' : 'market',
    time_horizon: '1-month',
    status: 'active'
  });

  console.log(`   🎯 CLUSTERING signal: ${target.name} (${dominantCat} ${count}x, strength: ${signalStrength})`);
  return data;
}
