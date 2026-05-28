// evaluate-equilibrium
//
// Read recent alerts on an asset, and for each stakeholder with a defined
// equilibrium + ladder, decide where they sit RIGHT NOW (0 = equilibrium,
// 1-4 = drift levels). Returns reasoning + citations.
//
// Body: { asset_id, stakeholder_ids?: string[], lookback_days?: number }
//   stakeholder_ids — restrict to specific stakeholder rows; default: all on asset
//   lookback_days — default 14
//
// Returns: { updated: number, results: [{ id, name, prior_level, new_level, reasoning }] }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { jsonResponse, errorResponse, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY') || Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

async function callAI(prompt: string, maxTokens = 1500): Promise<{ text: string; model: string }> {
  if (GOOGLE_API_KEY) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens },
          }),
          signal: AbortSignal.timeout(40000),
        },
      );
      if (resp.ok) {
        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) return { text, model: 'gemini-2.5-flash' };
      }
    } catch (err: any) { console.warn(`Gemini failed: ${err.message}`); }
  }
  if (ANTHROPIC_API_KEY) {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(55000),
    });
    if (resp.ok) {
      const data = await resp.json();
      const text = data.content?.[0]?.text || '';
      return { text, model: 'claude-sonnet-4' };
    }
  }
  throw new Error('No AI model available');
}

function parseJSON(text: string): any {
  try { return JSON.parse(text); } catch {}
  const stripped = text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();
  try { return JSON.parse(stripped); } catch {}
  const m = stripped.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

async function evaluateOne(
  supabase: any,
  stakeholder: any,
  scenario: any,
  alerts: any[],
): Promise<{ id: string; name: string; prior_level: number; new_level: number; reasoning: string; evidence: any[]; model: string }> {
  const ladderBlock = (stakeholder.ladder || []).map((r: any) =>
    `LEVEL ${r.level} — ${r.label}: ${r.description}\nIndicators: ${(r.indicators || []).join(' · ') || '(none specified)'}\nTypical response: ${r.typical_response}`
  ).join('\n\n');

  const alertsBlock = alerts.length
    ? alerts.map((a, i) => `[A${i + 1}] ${a.title} (${a.source || '?'}, ${new Date(a.published_at).toISOString().slice(0, 10)})${a.summary ? ` — ${String(a.summary).substring(0, 250)}` : ''}`).join('\n')
    : '(no recent alerts)';

  const prompt = `You are evaluating where a single stakeholder sits on their personal escalation ladder, RIGHT NOW, given recent intel.

ASSET: ${scenario?.topic || scenario?.id}

STAKEHOLDER: ${stakeholder.stakeholder_name}${stakeholder.stakeholder_role ? ` — ${stakeholder.stakeholder_role}` : ''}

EQUILIBRIUM (what aligned looks like):
${stakeholder.equilibrium_state}

THEIR LADDER:
LEVEL 0 — At equilibrium: aligned with the equilibrium definition above. No observed drift.

${ladderBlock}

RECENT INTEL (cite by [A#]):
${alertsBlock}

PRIOR LEVEL (last evaluated): ${stakeholder.current_level} — ${stakeholder.current_level_reasoning || '(no prior reasoning)'}

YOUR JOB: Pick the SINGLE level (0-4) that best reflects where this stakeholder is right now based on the intel above. Be conservative — only move them up the ladder if there's a specific observed signal. Stale prior assessments don't count as evidence.

OUTPUT — STRICT JSON:
{
  "new_level": <0 | 1 | 2 | 3 | 4>,
  "reasoning": "<2-4 sentences explaining WHY this level. Reference specific [A#] citations. If you're moving them off equilibrium, name the indicator from their ladder that you matched. If no movement, say what would have to be true to push them up.>",
  "evidence": [{"type": "alert", "id": "A1", "label": "<short label of the article>"}],
  "delta_summary": "<one short sentence: 'No change from L0', 'Moved up from L1 to L2: <trigger>', 'Moved down from L3 to L1: <trigger>'>"
}

Output ONLY the JSON object.`;

  const { text, model } = await callAI(prompt, 1500);
  const parsed = parseJSON(text);
  if (!parsed || typeof parsed.new_level !== 'number') {
    throw new Error('AI returned invalid evaluation');
  }
  const new_level = Math.max(0, Math.min(4, Math.round(parsed.new_level)));
  return {
    id: stakeholder.id,
    name: stakeholder.stakeholder_name,
    prior_level: stakeholder.current_level || 0,
    new_level,
    reasoning: parsed.reasoning || parsed.delta_summary || '',
    evidence: Array.isArray(parsed.evidence) ? parsed.evidence.slice(0, 8) : [],
    model,
  };
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const body = await req.json();
    const { asset_id, stakeholder_ids, lookback_days = 14 } = body;
    if (!asset_id) return errorResponse('asset_id required', 400);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: scenario } = await supabase
      .from('lp_scenarios').select('*').eq('id', asset_id).single();
    if (!scenario) return errorResponse('Asset not found', 404);

    // Load stakeholders to evaluate (must have a ladder)
    let q = supabase
      .from('stakeholder_equilibrium')
      .select('*')
      .eq('asset_id', asset_id);
    if (Array.isArray(stakeholder_ids) && stakeholder_ids.length > 0) {
      q = q.in('id', stakeholder_ids);
    }
    const { data: stakeholders, error: sErr } = await q;
    if (sErr) return errorResponse(`Load stakeholders failed: ${sErr.message}`, 500);
    if (!stakeholders || stakeholders.length === 0) {
      return jsonResponse({ updated: 0, results: [] });
    }

    // Load recent alerts (shared across evaluations to save tokens)
    let alerts: any[] = [];
    if (scenario.organization_id) {
      const since = new Date(Date.now() - lookback_days * 86400000).toISOString();
      const { data } = await supabase
        .from('org_story_links')
        .select('title, summary, source, published_at')
        .eq('organization_id', scenario.organization_id)
        .gte('published_at', since)
        .order('published_at', { ascending: false })
        .limit(20);
      alerts = data || [];
    }

    // Run in parallel (each is a small LLM call, ~5-10s)
    const settled = await Promise.allSettled(
      stakeholders.filter(s => Array.isArray(s.ladder) && s.ladder.length > 0)
        .map(s => evaluateOne(supabase, s, scenario, alerts))
    );

    const results: any[] = [];
    const updates: Promise<any>[] = [];
    const now = new Date().toISOString();

    for (const r of settled) {
      if (r.status !== 'fulfilled') {
        console.error('eval failed:', r.reason);
        continue;
      }
      const v = r.value;
      results.push(v);
      updates.push(
        supabase
          .from('stakeholder_equilibrium')
          .update({
            current_level: v.new_level,
            current_level_reasoning: v.reasoning,
            current_level_updated_at: now,
            current_level_evidence: v.evidence,
          })
          .eq('id', v.id)
      );
    }
    await Promise.allSettled(updates);

    return jsonResponse({
      updated: results.length,
      results,
      evaluated_at: now,
      lookback_days,
    });
  } catch (err: any) {
    console.error('evaluate-equilibrium error:', err);
    return errorResponse(err.message || 'Internal error', 500);
  }
});
