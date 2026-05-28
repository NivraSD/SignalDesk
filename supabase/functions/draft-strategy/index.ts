// draft-strategy
//
// Given a stakeholder_equilibrium row, draft the STRATEGY to move that
// stakeholder from their current drift level back toward equilibrium
// (or, at level 0, to hold them there).
//
// Reads: the equilibrium row (target + current level + ladder), the scenario,
// and the linked entity profile (situation + likely next move).
// Persists to stakeholder_equilibrium.strategy (+ strategy_updated_at).
//
// Body: { stakeholder_id } OR { asset_id, stakeholder_name }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { jsonResponse, errorResponse, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY') || Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

async function callAI(prompt: string, maxTokens = 2500): Promise<{ text: string; model: string }> {
  if (GOOGLE_API_KEY) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: maxTokens },
          }),
          signal: AbortSignal.timeout(50000),
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

const LEVEL_LABEL: Record<number, string> = {
  0: 'At equilibrium (aligned / non-disruptive)',
  1: 'Mild drift',
  2: 'Grumbling',
  3: 'Active resistance',
  4: 'Deal-breaker',
};

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const body = await req.json();
    const { stakeholder_id, asset_id, stakeholder_name } = body;
    if (!stakeholder_id && !(asset_id && stakeholder_name)) {
      return errorResponse('stakeholder_id (or asset_id + stakeholder_name) required', 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Load the equilibrium row
    let q = supabase.from('stakeholder_equilibrium').select('*');
    q = stakeholder_id ? q.eq('id', stakeholder_id) : q.eq('asset_id', asset_id).eq('stakeholder_name', stakeholder_name);
    const { data: sh, error: shErr } = await q.maybeSingle();
    if (shErr) return errorResponse(`Lookup failed: ${shErr.message}`, 500);
    if (!sh) return errorResponse('Stakeholder equilibrium row not found', 404);

    // Scenario context
    const { data: scenario } = await supabase
      .from('lp_scenarios').select('topic, issue_area, scenario_data').eq('id', sh.asset_id).single();

    // Linked entity profile (situation + forward signal)
    let situation = '', nextMove = '';
    if (sh.entity_profile_id) {
      const { data: ep } = await supabase
        .from('lp_entity_profiles')
        .select('current_situation, likely_next_move')
        .eq('id', sh.entity_profile_id)
        .maybeSingle();
      situation = ep?.current_situation || '';
      nextMove = ep?.likely_next_move || '';
    }

    const currentRung = (sh.ladder || []).find((r: any) => r.level === sh.current_level);
    const ladderBlock = (sh.ladder || []).length
      ? (sh.ladder as any[]).map(r => `  L${r.level} ${r.label}: ${r.description} (response: ${r.typical_response})`).join('\n')
      : '  (no ladder defined)';

    const prompt = `You are a senior strategist. For ONE stakeholder on ONE asset, write the strategy to move them from where they are now toward equilibrium (or, if already at equilibrium, to HOLD them there and pre-empt drift).

ASSET / PROJECT:
${scenario?.topic || sh.asset_id}
Issue area: ${scenario?.issue_area || ''}
Thesis: ${scenario?.scenario_data?.founding_summary || ''}

STAKEHOLDER:
Name: ${sh.stakeholder_name}
Type: ${sh.stakeholder_type || '(unknown)'} · Role: ${sh.stakeholder_role || '(unknown)'} · Influence: ${sh.influence_weight}/10

EQUILIBRIUM TARGET (what aligned looks like):
${sh.equilibrium_state || '(not yet defined)'}

CURRENT STATE:
Level: L${sh.current_level} — ${LEVEL_LABEL[sh.current_level] || ''}
${currentRung ? `Current rung: ${currentRung.label} — ${currentRung.description}` : ''}
Reasoning: ${sh.current_level_reasoning || '(none)'}
Situation: ${situation || '(none recorded)'}
Likely next move: ${nextMove || '(none recorded)'}

ESCALATION LADDER:
${ladderBlock}

OUTPUT — STRICT JSON SCHEMA:

{
  "objective": "<1 sentence — the concrete goal of engaging this stakeholder right now, given the gap between current level and equilibrium>",
  "moves": [
    {
      "action": "<imperative, specific action — what to actually do>",
      "rationale": "<why this move addresses THIS gap for THIS stakeholder>",
      "channel": "<how/where: e.g. direct meeting, op-ed, regulatory filing, coalition, back-channel>",
      "owner": "<who runs it: e.g. CEO, GR lead, comms, local liaison>",
      "timeframe": "<one of: immediate | 2-4 weeks | this quarter>",
      "priority": <integer 1-5, 1 = highest>
    }
  ]
}

RULES:
- 2-4 moves. Higher current level = more urgent, more direct moves. At L0, moves are light-touch maintenance.
- Moves must be specific to this stakeholder's interests and the ladder — not generic PR.
- Sequence matters: order moves by priority (1 first).
- Ground rationale in the equilibrium target and the observed situation.
- Output ONLY the JSON object, no preamble, no code fences.`;

    const { text, model } = await callAI(prompt, 2500);
    const parsed = parseJSON(text);
    if (!parsed?.objective || !Array.isArray(parsed?.moves)) {
      return errorResponse('AI returned invalid format', 500);
    }

    const moves = (parsed.moves as any[]).slice(0, 5).map((m, i) => ({
      action: m.action || '',
      rationale: m.rationale || '',
      channel: m.channel || '',
      owner: m.owner || '',
      timeframe: m.timeframe || 'this quarter',
      priority: typeof m.priority === 'number' ? m.priority : i + 1,
    })).sort((a, b) => a.priority - b.priority);

    const strategy = {
      objective: parsed.objective,
      moves,
      drafted_at: new Date().toISOString(),
      model,
    };

    const { data: row, error } = await supabase
      .from('stakeholder_equilibrium')
      .update({
        strategy,
        strategy_updated_at: new Date().toISOString(),
        edit_log: [...(sh.edit_log || []), { ts: new Date().toISOString(), action: 'strategy-drafted', model }].slice(-40),
      })
      .eq('id', sh.id)
      .select()
      .single();
    if (error) return errorResponse(`Update failed: ${error.message}`, 500);

    return jsonResponse({ stakeholder: row, model });
  } catch (err: any) {
    console.error('draft-strategy error:', err);
    return errorResponse(err.message || 'Internal error', 500);
  }
});
