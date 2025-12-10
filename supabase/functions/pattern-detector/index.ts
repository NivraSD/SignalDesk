// Pattern Detector v3 - Intelligence-Target-Aware Predictions
// Loads intelligence_targets, uses priority weighting, links signals via FK, tracks activity

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface Article {
  title: string;
  description?: string;
  summary?: string;
  url: string;
  source: string;
  published_at?: string;
  relevance_score?: number;
}

interface IntelligenceTarget {
  id: string;
  name: string;
  target_type: string;
  priority: string;
  monitoring_keywords: string[];
  monitoring_context: string | null;
  accumulated_context: Record<string, any>;
  baseline_metrics: Record<string, any>;
  activity_count: number;
  last_activity_at: string | null;
}

interface Prediction {
  title: string;
  description: string;
  rationale: string;
  evidence: string[];
  confidence_score: number;
  impact_level: 'high' | 'medium' | 'low';
  category: 'competitive' | 'market' | 'crisis' | 'strategic' | 'regulatory' | 'technology' | 'partnership';
  time_horizon: '1-month' | '3-months' | '6-months';
  related_entities: string[];
  primary_target_name?: string; // The main target this prediction is about
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { organization_id, articles, company_profile } = await req.json();

    console.log(`🔮 Pattern Detector v3 - Intelligence-Target-Aware Analysis`);
    console.log(`   Organization: ${organization_id}`);
    console.log(`   Articles received: ${articles?.length || 0}`);

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        predictions_generated: 0,
        message: 'No articles to analyze'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Load org data if not provided
    let profile = company_profile;
    let orgName = '';
    if (!profile) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name, industry, company_profile')
        .eq('id', organization_id)
        .single();

      if (org) {
        profile = org.company_profile;
        orgName = org.name;
      }
    } else {
      orgName = profile.name || 'Unknown';
    }

    // Load intelligence targets from database
    const { data: intelligenceTargets, error: targetsError } = await supabase
      .from('intelligence_targets')
      .select('id, name, target_type, priority, monitoring_keywords, monitoring_context, accumulated_context, baseline_metrics, activity_count, last_activity_at')
      .eq('organization_id', organization_id)
      .eq('is_active', true);

    if (targetsError) {
      console.error('Error loading intelligence targets:', targetsError);
    }

    const targets: IntelligenceTarget[] = intelligenceTargets || [];
    console.log(`   Intelligence targets loaded: ${targets.length}`);

    // Log target breakdown by priority
    const criticalTargets = targets.filter(t => t.priority === 'critical');
    const highTargets = targets.filter(t => t.priority === 'high');
    console.log(`   Critical targets: ${criticalTargets.length}, High priority: ${highTargets.length}`);

    // Build company context for Claude (now includes intelligence targets)
    const companyContext = buildCompanyContext(profile, orgName, targets);

    // Build article summaries for Claude (limit to top 30 by relevance)
    const topArticles = articles
      .sort((a: Article, b: Article) => (b.relevance_score || 0) - (a.relevance_score || 0))
      .slice(0, 30);

    const articleSummaries = topArticles.map((a: Article, i: number) =>
      `[${i + 1}] "${a.title}" (${a.source}, ${a.published_at?.split('T')[0] || 'recent'})
      ${a.summary || a.description || ''}`
    ).join('\n\n');

    // Call Claude to analyze and generate predictions
    const predictions = await generatePredictionsWithClaude(
      companyContext,
      articleSummaries,
      topArticles,
      targets
    );

    console.log(`   Claude generated ${predictions.length} predictions`);

    // Save predictions to database with FK linkage and activity tracking
    let savedCount = 0;
    for (const pred of predictions) {
      const saved = await savePrediction(organization_id, pred, targets);
      if (saved) savedCount++;
    }

    console.log(`✅ Pattern Detection Complete: ${savedCount} predictions saved`);

    return new Response(JSON.stringify({
      success: true,
      predictions_generated: predictions.length,
      predictions_saved: savedCount,
      predictions: predictions,
      targets_used: targets.length
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

function buildCompanyContext(profile: any, orgName: string, targets: IntelligenceTarget[]): string {
  const parts = [`COMPANY: ${orgName}`];

  if (profile?.description) {
    parts.push(`ABOUT: ${profile.description}`);
  }

  if (profile?.service_lines?.length) {
    parts.push(`SERVICE LINES: ${profile.service_lines.join(', ')}`);
  }

  if (profile?.strategic_context?.target_customers) {
    parts.push(`TARGET CUSTOMERS: ${profile.strategic_context.target_customers}`);
  }

  if (profile?.intelligence_context?.key_questions?.length) {
    parts.push(`KEY QUESTIONS:\n${profile.intelligence_context.key_questions.map((q: string) => `- ${q}`).join('\n')}`);
  }

  // Build intelligence targets section with priority weighting
  if (targets.length > 0) {
    const competitors = targets.filter(t => t.target_type === 'competitor');
    const stakeholders = targets.filter(t => t.target_type === 'stakeholder' || t.target_type === 'influencer');
    const regulators = targets.filter(t => t.target_type === 'regulator');
    const customers = targets.filter(t => t.target_type === 'customer');
    const partners = targets.filter(t => t.target_type === 'partner');

    // Format targets with priority indicators
    const formatTargetList = (targetList: IntelligenceTarget[]) => {
      // Sort by priority: critical > high > medium > low
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return targetList
        .sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 3))
        .map(t => {
          const priorityFlag = t.priority === 'critical' ? '🔴' : t.priority === 'high' ? '🟠' : '';
          const activityNote = t.activity_count > 0 ? ` (${t.activity_count} prior signals)` : '';
          const keywords = t.monitoring_keywords?.length > 0 ? ` [watch for: ${t.monitoring_keywords.slice(0, 3).join(', ')}]` : '';
          return `${priorityFlag} ${t.name}${activityNote}${keywords}`.trim();
        })
        .join('\n  - ');
    };

    parts.push(`\n=== INTELLIGENCE TARGETS (prioritized) ===`);

    if (competitors.length > 0) {
      parts.push(`COMPETITORS TO MONITOR:\n  - ${formatTargetList(competitors)}`);
    }

    if (stakeholders.length > 0) {
      parts.push(`KEY STAKEHOLDERS/INFLUENCERS:\n  - ${formatTargetList(stakeholders)}`);
    }

    if (regulators.length > 0) {
      parts.push(`REGULATORY BODIES:\n  - ${formatTargetList(regulators)}`);
    }

    if (customers.length > 0) {
      parts.push(`KEY CUSTOMERS:\n  - ${formatTargetList(customers)}`);
    }

    if (partners.length > 0) {
      parts.push(`STRATEGIC PARTNERS:\n  - ${formatTargetList(partners)}`);
    }

    // Add baseline context for critical targets
    const criticalTargets = targets.filter(t => t.priority === 'critical');
    if (criticalTargets.length > 0) {
      const baselineContext = criticalTargets
        .filter(t => t.accumulated_context && Object.keys(t.accumulated_context).length > 0)
        .map(t => `${t.name}: ${JSON.stringify(t.accumulated_context).substring(0, 200)}`)
        .join('\n');

      if (baselineContext) {
        parts.push(`\nCRITICAL TARGET CONTEXT:\n${baselineContext}`);
      }
    }
  } else if (profile?.competition?.direct_competitors?.length) {
    // Fallback to company_profile if no intelligence targets
    parts.push(`COMPETITORS: ${profile.competition.direct_competitors.join(', ')}`);
  }

  return parts.join('\n\n');
}

async function generatePredictionsWithClaude(
  companyContext: string,
  articleSummaries: string,
  articles: Article[],
  targets: IntelligenceTarget[]
): Promise<Prediction[]> {

  // Build target names list for the prompt
  const targetNames = targets.map(t => t.name);
  const criticalTargetNames = targets.filter(t => t.priority === 'critical' || t.priority === 'high').map(t => t.name);

  const prompt = `You are a competitive intelligence analyst. Your ONLY job is to predict what SPECIFIC COMPANIES we are tracking will do next.

⚠️ CRITICAL CONSTRAINT: You may ONLY make predictions about these specific entities:
${targetNames.length > 0 ? targetNames.map(n => `• ${n}`).join('\n') : 'No targets specified'}

DO NOT make generic predictions about "the market" or "the industry".
DO NOT predict things about companies not in the list above.
If the articles don't mention any of our tracked targets, return an EMPTY ARRAY [].

${companyContext}

ARTICLES TO ANALYZE:
${articleSummaries}

YOUR TASK: Make 2-5 predictions about what the specific tracked companies above will do next.

${criticalTargetNames.length > 0 ? `
🔴 HIGH PRIORITY TARGETS (predictions about these matter most):
${criticalTargetNames.map(n => `   • ${n}`).join('\n')}
` : ''}

WHAT TO PREDICT:
- A tracked competitor's next strategic move based on signals in the news
- Leadership changes at tracked targets
- Market entries/exits by tracked competitors
- Partnership or M&A activity involving tracked targets
- How tracked regulators might act

PREDICTION TYPES:
- "competitive": What a tracked competitor will do next
- "regulatory": What a tracked regulator might do
- "partnership": Potential alliances involving tracked targets
- "strategic": Business moves by tracked targets
- "personnel": Executive changes at tracked targets
- "crisis": Potential problems for tracked targets

Return a JSON array (or empty [] if no tracked targets found in articles):
[
  {
    "title": "Prediction about [TRACKED TARGET NAME]",
    "description": "What will happen",
    "rationale": "Why we predict this based on the evidence",
    "evidence": ["Quote from article [X]"],
    "confidence_score": 75,
    "impact_level": "high|medium|low",
    "category": "competitive|regulatory|partnership|strategic|personnel|crisis",
    "time_horizon": "1-month|3-months|6-months",
    "related_entities": ["Other entities involved"],
    "primary_target_name": "EXACT name from targets list above"
  }
]

🚨 VALIDATION RULES:
1. "primary_target_name" MUST match exactly one of: ${targetNames.slice(0, 15).join(', ')}${targetNames.length > 15 ? '...' : ''}
2. If no articles mention our tracked targets, return []
3. "Gen Z", "AI", "the market" are NOT valid target names - use specific company/person names only

Return ONLY the JSON array, no other text.`;

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
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Claude API error: ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in Claude response');
      console.log('Response:', content.substring(0, 500));
      return [];
    }

    const predictions = JSON.parse(jsonMatch[0]);
    console.log(`   Parsed ${predictions.length} predictions from Claude`);

    // Validate and clean predictions
    return predictions.map((p: any) => ({
      title: p.title || 'Untitled Prediction',
      description: p.description || '',
      rationale: p.rationale || '',
      evidence: Array.isArray(p.evidence) ? p.evidence : [],
      confidence_score: Math.min(100, Math.max(0, p.confidence_score || 50)),
      impact_level: ['high', 'medium', 'low'].includes(p.impact_level) ? p.impact_level : 'medium',
      category: ['competitive', 'market', 'crisis', 'strategic', 'regulatory', 'technology', 'partnership'].includes(p.category) ? p.category : 'market',
      time_horizon: ['1-month', '3-months', '6-months'].includes(p.time_horizon) ? p.time_horizon : '3-months',
      related_entities: Array.isArray(p.related_entities) ? p.related_entities : [],
      primary_target_name: p.primary_target_name || null
    }));

  } catch (error: any) {
    console.error('Error calling Claude:', error.message);
    return [];
  }
}

async function savePrediction(orgId: string, prediction: Prediction, targets: IntelligenceTarget[]): Promise<boolean> {
  try {
    // Check for existing similar signal in unified table
    const { data: existingSignal } = await supabase
      .from('signals')
      .select('id')
      .eq('organization_id', orgId)
      .eq('signal_type', 'predictive')
      .eq('title', prediction.title)
      .single();

    if (existingSignal) {
      console.log(`   ⏭️ Signal already exists: ${prediction.title.substring(0, 50)}...`);
      return false;
    }

    // Look up the primary target by name to get the UUID
    let primaryTargetId: string | null = null;
    let primaryTargetType: string | null = null;
    const primaryTargetName = prediction.primary_target_name || prediction.related_entities[0] || null;

    if (primaryTargetName) {
      // Find matching target (case-insensitive)
      const matchedTarget = targets.find(t =>
        t.name.toLowerCase() === primaryTargetName.toLowerCase()
      );

      if (matchedTarget) {
        primaryTargetId = matchedTarget.id;
        primaryTargetType = matchedTarget.target_type;
        console.log(`   🎯 Linked to target: ${matchedTarget.name} (${matchedTarget.target_type}, priority: ${matchedTarget.priority})`);
      }
    }

    // Look up related target IDs
    const relatedTargetIds: string[] = [];
    for (const entityName of prediction.related_entities) {
      const matched = targets.find(t =>
        t.name.toLowerCase() === entityName.toLowerCase()
      );
      if (matched && matched.id !== primaryTargetId) {
        relatedTargetIds.push(matched.id);
      }
    }

    // Map time_horizon to urgency
    const urgencyMap: Record<string, string> = {
      '1-month': 'immediate',
      '3-months': 'near_term',
      '6-months': 'monitoring'
    };
    const urgency = urgencyMap[prediction.time_horizon] || 'near_term';

    // Map category to signal_subtype
    const subtypeMap: Record<string, string> = {
      'competitive': 'competitor_move',
      'market': 'market_shift',
      'crisis': 'crisis_emerging',
      'strategic': 'strategic_opportunity',
      'regulatory': 'regulatory_change',
      'technology': 'technology_shift',
      'partnership': 'partnership_opportunity'
    };
    const signalSubtype = subtypeMap[prediction.category] || prediction.category;

    // Save to unified signals table WITH FK linkage
    const { error: signalError } = await supabase
      .from('signals')
      .insert({
        organization_id: orgId,
        signal_type: 'predictive',
        signal_subtype: signalSubtype,
        title: prediction.title,
        description: prediction.description,
        // FK linkage to intelligence_targets
        primary_target_id: primaryTargetId,
        primary_target_name: primaryTargetName,
        primary_target_type: primaryTargetType,
        related_target_ids: relatedTargetIds.length > 0 ? relatedTargetIds : null,
        related_target_names: prediction.related_entities,
        confidence_score: prediction.confidence_score,
        significance_score: prediction.impact_level === 'high' ? 85 : prediction.impact_level === 'medium' ? 60 : 40,
        urgency: urgency,
        impact_level: prediction.impact_level,
        evidence: {
          data_points: prediction.evidence,
          rationale: prediction.rationale
        },
        reasoning: prediction.rationale,
        pattern_data: {
          category: prediction.category,
          time_horizon: prediction.time_horizon,
          related_entities: prediction.related_entities,
          primary_target_linked: !!primaryTargetId
        },
        business_implication: prediction.description,
        opportunity_type: prediction.category === 'strategic' || prediction.category === 'partnership' ? 'advisory' :
                          prediction.category === 'crisis' ? 'risk_mitigation' :
                          prediction.category === 'competitive' ? 'competitive_response' : 'advisory',
        detected_at: new Date().toISOString(),
        status: 'active',
        source_pipeline: 'pattern-detector-v3',
        model_version: 'claude-sonnet-4'
      });

    if (signalError) {
      console.error(`❌ Failed to save signal: ${signalError.message}`);
      return false;
    }

    // UPDATE ACTIVITY TRACKING on intelligence_targets
    if (primaryTargetId) {
      const { error: activityError } = await supabase
        .from('intelligence_targets')
        .update({
          activity_count: supabase.rpc('increment_activity_count', { target_id: primaryTargetId }) || 1,
          last_activity_at: new Date().toISOString(),
          last_activity_summary: `Prediction: ${prediction.title.substring(0, 100)}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', primaryTargetId);

      // Fallback if RPC doesn't exist - direct increment
      if (activityError) {
        // Get current count and increment
        const { data: currentTarget } = await supabase
          .from('intelligence_targets')
          .select('activity_count')
          .eq('id', primaryTargetId)
          .single();

        await supabase
          .from('intelligence_targets')
          .update({
            activity_count: (currentTarget?.activity_count || 0) + 1,
            last_activity_at: new Date().toISOString(),
            last_activity_summary: `Prediction: ${prediction.title.substring(0, 100)}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', primaryTargetId);
      }

      console.log(`   📊 Updated activity tracking for target: ${primaryTargetName}`);
    }

    // Update activity for related targets too
    for (const relatedId of relatedTargetIds) {
      const { data: relatedTarget } = await supabase
        .from('intelligence_targets')
        .select('activity_count, name')
        .eq('id', relatedId)
        .single();

      if (relatedTarget) {
        await supabase
          .from('intelligence_targets')
          .update({
            activity_count: (relatedTarget.activity_count || 0) + 1,
            last_activity_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', relatedId);
      }
    }

    // Also save to legacy predictions table for backward compatibility
    const fullDescription = `${prediction.description}\n\n**Rationale:** ${prediction.rationale}\n\n**Evidence:**\n${prediction.evidence.map(e => `• ${e}`).join('\n')}`;

    await supabase
      .from('predictions')
      .insert({
        organization_id: orgId,
        title: prediction.title,
        description: fullDescription,
        confidence_score: prediction.confidence_score,
        impact_level: prediction.impact_level,
        category: prediction.category,
        time_horizon: prediction.time_horizon,
        status: 'active',
        data: {
          rationale: prediction.rationale,
          evidence: prediction.evidence,
          related_entities: prediction.related_entities,
          primary_target_id: primaryTargetId,
          generated_by: 'pattern-detector-v3'
        }
      })
      .then(() => {})
      .catch(() => {});

    console.log(`   💡 Saved: ${prediction.title.substring(0, 60)}...`);
    return true;

  } catch (e: any) {
    console.error(`❌ Error saving prediction: ${e.message}`);
    return false;
  }
}
