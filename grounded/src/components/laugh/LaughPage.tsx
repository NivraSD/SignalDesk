import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import { getToday } from '@/lib/utils'

// Laugh: fill-in-the-blank poems and "I got jokes". The app sets things up; the word is yours.
// Nothing here grades, corrects, comments on, or encourages what you type.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const BLANK = '____'

async function call(action: 'poem' | 'joke') {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not signed in')
  const r = await fetch(`${SUPABASE_URL}/functions/v1/grounded-laugh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || 'Try again.')
  return j
}

interface Joke { line: string; comedian: string | null; source: string | null }

function useSaveToJournal() {
  const { userId } = useGroundedStore()
  return async (content: string) => {
    if (!userId) return false
    const { error } = await supabase.from('grounded_journal_entries').insert({
      user_id: userId,
      entry_type: 'thought',
      content,
      entry_date: getToday(),
      completed: false,
      added_to_calendar: false,
      on_schedule: false,
    })
    return !error
  }
}

function PoemCard() {
  const save = useSaveToJournal()
  const [lines, setLines] = useState<string[] | null>(null)
  const [words, setWords] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const blanks = lines ? lines.join('\n').split(BLANK).length - 1 : 0

  const another = async () => {
    setBusy(true)
    setError(null)
    try {
      const { lines } = await call('poem')
      setLines(lines)
      setWords([])
      setDone(false)
      setSaved(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Try again.')
    }
    setBusy(false)
  }

  const finished = () => {
    let i = 0
    return (lines || []).map((line) => line.split(BLANK).reduce((acc, part, j) => (j === 0 ? part : acc + (words[i++] || BLANK) + part), ''))
  }

  // Render each line with inline inputs where the blanks are.
  let k = 0
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
      <h3 className="text-xs text-stone-400 uppercase tracking-wide">Fill in the blanks</h3>

      {!lines && (
        <button onClick={another} disabled={busy} className="w-full py-2.5 bg-stone-700 text-white rounded-lg text-sm disabled:opacity-50">
          {busy ? '…' : 'Give me a poem'}
        </button>
      )}

      {lines && !done && (
        <div className="space-y-2 text-[15px] text-stone-700 leading-relaxed">
          {lines.map((line, li) => (
            <p key={li}>
              {line.split(BLANK).map((part, pi, arr) => {
                if (pi === arr.length - 1) return <span key={pi}>{part}</span>
                const idx = k++
                return (
                  <span key={pi}>
                    {part}
                    <input
                      value={words[idx] ?? ''}
                      onChange={(e) => setWords((w) => { const n = [...w]; n[idx] = e.target.value; return n })}
                      aria-label={`Blank ${idx + 1}`}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      size={Math.max(4, (words[idx] ?? '').length + 1)}
                      className="mx-0.5 px-1 border-b-2 border-stone-400 bg-stone-50 text-stone-900 focus:outline-none focus:border-stone-700"
                    />
                  </span>
                )
              })}
            </p>
          ))}
        </div>
      )}

      {lines && done && (
        <div className="space-y-1 text-[15px] text-stone-800 leading-relaxed">
          {finished().map((line, i) => <p key={i}>{line}</p>)}
        </div>
      )}

      {lines && (
        <div className="flex items-center justify-end gap-2">
          {!done ? (
            <button
              onClick={() => setDone(true)}
              disabled={words.filter((w) => w?.trim()).length < blanks}
              className="text-xs px-3 py-1.5 rounded-full bg-stone-700 text-white disabled:opacity-40"
            >
              Read it
            </button>
          ) : (
            <button
              onClick={async () => setSaved(await save(finished().join('\n')))}
              disabled={saved}
              className="text-xs px-3 py-1.5 rounded-full border border-stone-200 text-stone-600 disabled:opacity-50"
            >
              {saved ? 'Saved' : 'Save'}
            </button>
          )}
          <button onClick={another} disabled={busy} className="text-xs px-3 py-1.5 rounded-full border border-stone-200 text-stone-600 disabled:opacity-50">
            {busy ? '…' : 'Another'}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-stone-500">{error}</p>}
    </div>
  )
}

function JokesCard() {
  const save = useSaveToJournal()
  const [joke, setJoke] = useState<Joke | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [kept, setKept] = useState(false)

  const next = async () => {
    setBusy(true)
    setError(null)
    try {
      setJoke(await call('joke'))
      setKept(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Try again.')
    }
    setBusy(false)
  }

  const credit = joke?.comedian ? `${joke.comedian}${joke.source ? `, ${joke.source}` : ''}` : null

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
      <button onClick={next} disabled={busy} className="w-full py-2.5 bg-stone-700 text-white rounded-lg text-sm disabled:opacity-50">
        {busy ? '…' : 'I got jokes'}
      </button>

      {joke && (
        <div className="space-y-2">
          <p className="text-[15px] text-stone-800 leading-relaxed">{joke.line}</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-stone-400">{credit ? `— ${credit}` : ''}</span>
            <button
              onClick={async () => setKept(await save(credit ? `${joke.line} — ${credit}` : joke.line))}
              disabled={kept}
              className="flex-none text-xs px-3 py-1.5 rounded-full border border-stone-200 text-stone-600 disabled:opacity-50"
            >
              {kept ? 'Kept' : 'Keep'}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-stone-500">{error}</p>}
    </div>
  )
}

export default function LaughPage() {
  return (
    <div className="space-y-4">
      <PoemCard />
      <JokesCard />
    </div>
  )
}
