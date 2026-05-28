// draft-equilibrium
//
// Given (asset, stakeholder_name [+ optional context]), draft:
//   * equilibrium_state — markdown describing what aligned looks like
//   * ladder — 4-rung escalation array
//
// Pulls from: scenario, lp_entity_profiles (if matched by name), recent alerts.
// Persists to stakeholder_equilibrium (upsert by (asset_id, stakeholder_name)).
//
// Body: { asset_id, stakeholder_name, stakeholder_type?, stakeholder_role?,
//         influence_weight? }

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
            generationConfig: { temperature: 0.35, maxOutputTokens: maxTokens },
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

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const body = await req.json();
    const { asset_id, stakeholder_name, stakeholder_type, stakeholder_role, influence_weight } = body;
    if (!asset_id || !stakeholder_name) {
      return errorResponse('asset_id and stakeholder_name required', 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: scenario } = await supabase
      .from('lp_scenarios').select('*').eq('id', asset_id).single();

    // Try to match an existing entity profile by name + organization
    let profile: any = null;
    if (scenario?.organization_id) {
      const { data } = await supabase
        .from('lp_entity_profiles')
        .select('id, name, type, sentiment, position, role, latest_activity, accumulated_context')
        .eq('organization_id', scenario.organization_id)
        .ilike('name', `%${stakeholder_name}%`)
        .limit(1);
      profile = data?.[0] || null;
    }

    // Recent alerts on this asset's org (last 30 days)
    let recent_alerts: any[] = [];
    if (scenario?.organization_id) {
      const { data } = await supabase
        .from('org_story_links')
        .select('title, summary, source, published_at')
        .eq('organization_id', scenario.organization_id)
        .gte('published_at', new Date(Date.now() - 30 * 86400000).toISOString())
        .order('published_at', { ascending: false })
        .limit(12);
      recent_alerts = data || [];
    }

    const profileBlock = profile
      ? `EXISTING PROFILE:
- Name: ${profile.name}
- Type: ${profile.type || 'unknown'}
- Sentiment toward issue: ${profile.sentiment || 'unknown'}
- Stated position: ${profile.position || 'unknown'}
- Role: ${profile.role || 'unknown'}
- Latest activity: ${profile.latest_activity || '(none recorded)'}`
      : '(no existing entity profile — base equilibrium on stakeholder_name + general domain knowledge)';

    const alertsBlock = recent_alerts.length
      ? recent_alerts.map((a, i) => `[A${i + 1}] ${a.title} (${a.source || '?'}, ${new Date(a.published_at).toISOString().slice(0, 10)})${a.summary ? ` — ${String(a.summary).substring(0, 220)}` : ''}`).join('\n')
      : '(no recent alerts on the asset)';

    const prompt = `You are an analyst modeling a stakeholder as a control system. Your job is to define the EQUILIBRIUM STATE for a specific stakeholder on a specific asset, and a 4-rung LADDER of escalation showing what pushes them progressively further off equilibrium.

ASSET / PROJECT:
${scenario?.topic || asset_id}
Issue area: ${scenario?.issue_area || ''}
Summary: ${scenario?.scenario_data?.founding_summary || ''}

STAKEHOLDER:
Name: ${stakeholder_name}
Type: ${stakeholder_type || '(unknown — infer)'}
Role: ${stakeholder_role || '(unknown — infer)'}

${profileBlock}

RECENT ALERTS ON THE ASSET (cite as [A#] only if directly relevant):
${alertsBlock}

OUTPUT — STRICT JSON SCHEMA:

{
  "equilibrium_state": "<markdown paragraph (60-140 words) describing what 'aligned / non-disruptive' looks like for THIS stakeholder on THIS asset. Specific. Not generic. What do they need to BE TRUE in the world to remain at rest. Their interests, what they need to be seen doing, what they need to avoid. Should read like a definition, not a wish.>",

  "ladder": [
    {
      "level": 1,
      "label": "<short label, 2-4 words, e.g. 'Mild concern'>",
      "description": "<1-2 sentences — what their disposition looks like at this rung>",
      "indicators": ["<observable signal you could detect>", "<another>", "<another>"],
      "typical_response": "<one of: monitor | acknowledge | engage | de-escalate | full-mobilization>"
    },
    { "level": 2, "label": "<grumbling-equivalent>", ... },
    { "level": 3, "label": "<active resistance>", ... },
    { "level": 4, "label": "<deal-breaker>", ... }
  ],

  "suggested_influence_weight": <integer 1-10, how much this stakeholder matters for project health overall>
}

RULES:
- Each rung must escalate meaningfully from the previous — don't write 4 versions of the same thing
- Indicators must be OBSERVABLE (public statement, regulatory filing, leak, market movement). Not feelings.
- typical_response must match the rung's intensity. Level 1 = monitor. Level 4 = full-mobilization.
- Be specific to THIS stakeholder. A general's ladder differs from a community leader's ladder.
- Output ONLY the JSON object, no preamble, no code fences.`;

    const { text, model } = await callAI(prompt, 2500);
    const parsed = parseJSON(text);
    if (!parsed?.equilibrium_state || !Array.isArray(parsed?.ladder)) {
      return errorResponse('AI returned invalid format', 500);
    }

    // Normalize ladder to exactly 4 rungs in order
    const ladder = (parsed.ladder as any[])
      .slice(0, 4)
      .map((r, i) => ({
        level: i + 1,
        label: r.label || `Level ${i + 1}`,
        description: r.description || '',
        indicators: Array.isArray(r.indicators) ? r.indicators.slice(0, 6) : [],
        typical_response: r.typical_response || 'monitor',
      }));

    const upsertRow: any = {
      asset_id,
      stakeholder_name,
      stakeholder_type: stakeholder_type || profile?.type || null,
      stakeholder_role: stakeholder_role || profile?.role || null,
      entity_profile_id: profile?.id || null,
      influence_weight: influence_weight || parsed.suggested_influence_weight || 5,
      equilibrium_state: parsed.equilibrium_state,
      ladder,
      current_level: 0,
      current_level_reasoning: 'Initial draft — not yet evaluated against live signals.',
      current_level_updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('stakeholder_equilibrium')
      .select('id, edit_log')
      .eq('asset_id', asset_id)
      .eq('stakeholder_name', stakeholder_name)
      .maybeSingle();

    const newLogEntry = {
      ts: new Date().toISOString(),
      action: existing ? 're-drafted' : 'drafted',
      model,
    };

    let row;
    if (existing) {
      const { data, error } = await supabase
        .from('stakeholder_equilibrium')
        .update({
          ...upsertRow,
          edit_log: [...(existing.edit_log || []), newLogEntry].slice(-40),
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) return errorResponse(`Update failed: ${error.message}`, 500);
      row = data;
    } else {
      const { data, error } = await supabase
        .from('stakeholder_equilibrium')
        .insert({ ...upsertRow, edit_log: [newLogEntry] })
        .select()
        .single();
      if (error) return errorResponse(`Insert failed: ${error.message}`, 500);
      row = data;
    }

    return jsonResponse({ stakeholder: row, model });
  } catch (err: any) {
    console.error('draft-equilibrium error:', err);
    return errorResponse(err.message || 'Internal error', 500);
  }
});
