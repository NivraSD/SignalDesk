// Grounded "Laugh": fill-in-the-blank comic poems and "I got jokes" one-liners.
// The app is a setup machine: it builds a structure that leans somewhere; the person supplies
// the word. Nothing here grades, corrects, encourages, or explains. See the comedy spec (Oct 22, 2026).
//   POST { action: 'poem' }  -> { lines: string[] }            (blanks are "____")
//   POST { action: 'joke' }  -> { line, comedian?, source? }   (classic credited, or an original)
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { fetchCalendarEvents } from '../_shared/context.ts'
import { CLASSICS } from './classics.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MODEL = 'claude-opus-5-5'
const BLANK = '____'

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

const POEM_RULES = `You write short comic poems with blanks for one person to fill in. You are a setup machine, not a comedian: you build a structure that already leans somewhere, and the reader decides how far to push it. The laugh is theirs — their word, their nerve, their dumb rhyme.

How to build the poem:
1. Pick a lead word with no clean rhyme — a surname, a multi-syllable noun, a kitchen object, a place name — and put it at the end of line one. ("cat" is too easy; "spatula" or "Okonkwo" makes them hunt, and the hunt is the game.)
2. Write four or five lines of real build-up (limerick length by default). The reader needs a few lines of rhythm before the rhyme can trap them.
3. Use 2 to 4 blanks, written exactly as ${BLANK}. Blanks sit at rhyme positions: each blank ends a line that has to rhyme with a line already written (the first blank may sit mid-line when it's the steering wheel).
4. The first blank is a steering wheel: a category word (an object, a body part, an activity, a measurement) that picks the joke's axis. Write every later line so it stays grammatical whatever they choose — you never need to know which lane they picked.
5. Corner each later blank with syntax: the sentence already knows where it's going before they type. A cornered blank makes them complicit; a wide-open one asks them to be clever. Complicit is funnier.
6. The last blank is the punchline: the hardest rhyme and the longest line, plainer than the setup. A short line followed by an overlong one delays the rhyme and raises the tension.
7. Meter can limp; clumsy rhythm is part of the form. Forced rhymes, split rhymes ("orange"/"door-hinge"), misspellings and stunt rhymes are welcome.

Forms you can draw on (lift the technique, never the poems): clerihew (four lines AABB, a name ending line one, flat-footed rhymes), limerick (AABBA, punchline last — the Nantucket move, where the sentence leads them to a word they then have to say), Nash-style couplets (lines of wildly unequal length, rhymes reached by bending spelling), McWhirtle (a loose double dactyl with one line that is a single long absurd word — that line can be the blank), stunt rhymes.

Never:
- Never write the rude word yourself. The lean is yours; the word is theirs.
- Never explain the joke, add a title, or add any comment, encouragement or instructions.
- Never reuse a structure or lead word from the "already used" list.
- Never draw on anything sad, medical or private, and never on therapy, recovery, mental health, medication or wellness routines — this is not a wellness feature. Use only light, everyday details from their world (pets, people, places, chores, hobbies, today's errands), or none.

Style references (shape only — do not reuse these lines, lead words or punchlines):
My dentist, Dr. Okonkwo, / Once told me I should learn the ${BLANK}. / He said I should floss, / So I said he could floss my ${BLANK}.
There was a man on the stairs / Who was six ${BLANK} tall, and nobody cares. / He bent down to tie up his shoe, / And the ${BLANK} on the landing said, "${BLANK}."
I woke up and reached for the spatula, / Not sure what I'd do with that ${BLANK}. / The dog gave a look, / Like she'd read the whole book, / And I whispered, "Don't tell them, ${BLANK}."
I bought a spiralizer. / I had seen it on a video and thought, this is it, this is the year I become a person who is ${BLANK}. / It lives in a drawer. / I do not know what it is ${BLANK}.

Return the poem as lines, with blanks written exactly as ${BLANK}.`

const JOKE_RULES = `You write one original one-liner in the lineage of these styles (style is free to use; their actual jokes are not — never reuse or paraphrase a known joke):
- Steven Wright: a premise taken literally, one step too far. Flat delivery; the logic is the joke.
- Mitch Hedberg: a mundane object treated as a problem. A plain observation that turns out to be insane.
- Rodney Dangerfield: a complaint where the speaker is the butt. Setup, then a self-inflicted wound.

Aim it at the person's own world when you're given details (their dog, their city, their commute, today's calendar, the things they do); otherwise pick something everyday. One or two sentences. No explanation, no emoji, no quotation marks around it. Keep away from drugs, drinking, self-harm and death, and never joke about therapy, recovery, mental health, medication or wellness routines — this is not a wellness feature; pick everyday things. Never repeat anything in the "already used" list.`

function textOf(msg: Anthropic.Beta.BetaMessage): string {
  for (const b of msg.content) if (b.type === 'text') return b.text
  return ''
}

async function generate(system: string, user: string, schema: Record<string, unknown>) {
  // Structured output keeps the reply valid JSON; low effort suits short creative pieces.
  // Server-side fallback re-runs a declined request on a fallback model instead of failing.
  const msg = (await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema } },
    system,
    messages: [{ role: 'user', content: user }],
  } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming)) as Anthropic.Beta.BetaMessage
  if (msg.stop_reason === 'refusal') throw new Error('declined')
  return JSON.parse(textOf(msg))
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors
  if (req.method !== 'POST') return errorResponse('POST only', 405)

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  const body = await req.json().catch(() => ({}))
  // Server-side testing: a service-role token (already full access) may act as a user. The gateway
  // verifies the JWT signature before this runs (verify_jwt on), so its role claim can be trusted.
  const role = (() => {
    try { return JSON.parse(atob((token || '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role } catch { return null }
  })()
  const asUser = role === 'service_role' && typeof body.as_user === 'string' ? { id: body.as_user } : null
  const { data: { user } } = asUser ? { data: { user: asUser } } : token ? await admin.auth.getUser(token) : { data: { user: null } }
  if (!user) return errorResponse('Not signed in', 401)

  try {
    const { action } = body

    if (action === 'poem') {
      // Light details only: name, people and life-right-now from About you, activities, today's
      // calendar. Never the journal, check-in scores, or the harder About-you sections.
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
      const [settings, story, activities, calendar, used] = await Promise.all([
        admin.from('grounded_user_settings').select('display_name').eq('user_id', user.id).maybeSingle(),
        admin.from('grounded_user_story').select('section, content').eq('user_id', user.id).in('section', ['people', 'life']),
        admin.from('grounded_activities').select('name').eq('user_id', user.id).limit(40),
        fetchCalendarEvents(today, user.id).catch(() => ''),
        admin.from('grounded_laugh_history').select('content').eq('user_id', user.id).eq('kind', 'poem').order('created_at', { ascending: false }).limit(40),
      ])
      const world = [
        settings.data?.display_name ? `Their name: ${settings.data.display_name}` : '',
        ...(story.data || []).map((s: { section: string; content: string }) => `${s.section === 'people' ? 'People and pets in their life' : 'Their life right now'}: ${s.content.slice(0, 400)}`),
        activities.data?.length ? `Things they do: ${activities.data.map((a: { name: string }) => a.name).join(', ')}` : '',
        calendar ? `Today's calendar:\n${calendar.slice(0, 600)}` : '',
      ].filter(Boolean).join('\n')
      const usedFirstLines = (used.data || []).map((r: { content: string }) => r.content.split('\n')[0]).join('\n')
      const prompt = `${world ? `Details from their world you may use (lightly, optional):\n${world}\n\n` : ''}Already used (never repeat these lead words or structures):\n${usedFirstLines || '(none yet)'}\n\nWrite one new poem.`

      const schema = {
        type: 'object',
        properties: { lines: { type: 'array', items: { type: 'string' } } },
        required: ['lines'],
        additionalProperties: false,
      }
      let lines: string[] = []
      for (let attempt = 0; attempt < 2; attempt++) {
        const out = await generate(POEM_RULES, prompt, schema)
        lines = (out.lines || []).map((l: string) => l.replace(/_{3,}/g, BLANK).trim()).filter(Boolean)
        const blanks = lines.join('\n').split(BLANK).length - 1
        if (lines.length >= 3 && lines.length <= 9 && blanks >= 2 && blanks <= 4) break
        lines = []
      }
      if (!lines.length) return errorResponse('Could not write a poem just now. Try again.', 502)
      await admin.from('grounded_laugh_history').insert({ user_id: user.id, kind: 'poem', content: lines.join('\n') })
      return jsonResponse({ lines })
    }

    if (action === 'joke') {
      const { data: used } = await admin
        .from('grounded_laugh_history')
        .select('content, classic_id')
        .eq('user_id', user.id)
        .eq('kind', 'joke')
        .order('created_at', { ascending: false })
        .limit(200)
      const usedIds = new Set((used || []).map((r: { classic_id: string | null }) => r.classic_id).filter(Boolean))
      const unseen = CLASSICS.filter((c) => !usedIds.has(c.id))

      // Roughly half classics, half originals, so the next one is never predictable.
      if (unseen.length && Math.random() < 0.5) {
        const c = unseen[Math.floor(Math.random() * unseen.length)]
        await admin.from('grounded_laugh_history').insert({ user_id: user.id, kind: 'joke', content: c.line, classic_id: c.id })
        return jsonResponse({ line: c.line, comedian: c.comedian, source: c.source ?? null })
      }

      const [settings, story, activities] = await Promise.all([
        admin.from('grounded_user_settings').select('display_name').eq('user_id', user.id).maybeSingle(),
        admin.from('grounded_user_story').select('section, content').eq('user_id', user.id).in('section', ['people', 'life']),
        admin.from('grounded_activities').select('name').eq('user_id', user.id).limit(40),
      ])
      const world = [
        ...(story.data || []).map((s: { content: string }) => s.content.slice(0, 300)),
        activities.data?.length ? `Things they do: ${activities.data.map((a: { name: string }) => a.name).join(', ')}` : '',
      ].filter(Boolean).join('\n')
      const recent = (used || []).filter((r: { classic_id: string | null }) => !r.classic_id).slice(0, 40).map((r: { content: string }) => r.content).join('\n')
      const style = ['Steven Wright', 'Mitch Hedberg', 'Rodney Dangerfield'][Math.floor(Math.random() * 3)]
      const out = await generate(
        JOKE_RULES,
        `${world ? `Their world (optional):\n${world}\n\n` : ''}Already used:\n${recent || '(none yet)'}\n\nWrite one new one-liner in the ${style} shape.`,
        { type: 'object', properties: { line: { type: 'string' } }, required: ['line'], additionalProperties: false }
      )
      const line = String(out.line || '').trim()
      if (!line) return errorResponse('Nothing came to mind. Tap again.', 502)
      await admin.from('grounded_laugh_history').insert({ user_id: user.id, kind: 'joke', content: line })
      return jsonResponse({ line, comedian: null, source: null })
    }

    return errorResponse('Unknown action', 400)
  } catch (e) {
    console.error('grounded-laugh error:', e)
    return errorResponse('Something went wrong. Try again.', 500)
  }
})
