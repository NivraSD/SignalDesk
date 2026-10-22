import { Link, useNavigate } from 'react-router-dom'
import { EFFECTIVE, PRIVACY, TERMS } from './legalText'

// Public pages (no sign-in needed): /privacy and /terms. Google and the app stores link here.
export default function LegalPage({ doc }: { doc: 'privacy' | 'terms' }) {
  const navigate = useNavigate()
  const sections = doc === 'privacy' ? PRIVACY : TERMS
  return (
    <div className="min-h-[100dvh] bg-stone-100 px-4 pt-safe-header pb-10">
      <div className="max-w-lg mx-auto space-y-5 pt-4">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} className="text-stone-500 text-sm">
          &larr; Back
        </button>
        <div className="text-center space-y-1">
          <h1 className="text-xl font-light text-stone-700">{doc === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}</h1>
          <p className="text-xs text-stone-400">Grounded · Effective {EFFECTIVE}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm divide-y divide-stone-100">
          {sections.map((s) => (
            <section key={s.title} className="p-4 space-y-1.5">
              <h2 className="text-sm font-medium text-stone-700">{s.title}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="text-sm text-stone-500 leading-relaxed">{p}</p>
              ))}
            </section>
          ))}
        </div>
        <p className="text-center text-xs text-stone-400">
          {doc === 'privacy' ? <Link to="/terms" className="underline">Terms of Use</Link> : <Link to="/privacy" className="underline">Privacy Policy</Link>}
        </p>
      </div>
    </div>
  )
}
