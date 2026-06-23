'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createAuthClient } from '@/lib/supabase/auth-client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createAuthClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/onboarding')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="nv-auth">
      <style>{CSS}</style>
      <main className="nv-auth-main">
        <div className="nv-auth-card">
          <Link href="/" className="nv-auth-logo" aria-label="nivria — home">
            <span className="nv-inline-wordmark">
              n
              <span className="nv-logo-i" role="img" aria-label="i">
                <span className="nv-logo-i-line" aria-hidden="true" />
                <span className="nv-logo-i-top" aria-hidden="true" />
                <svg className="nv-logo-i-roots" viewBox="0 0 20 10" aria-hidden="true"><line x1="10" y1="0" x2="2" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><line x1="10" y1="0" x2="18" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="2" cy="9" r="1.7" fill="currentColor" /><circle cx="18" cy="9" r="1.7" fill="currentColor" /></svg>
              </span>
              vr
              <span className="nv-logo-i" role="img" aria-label="i">
                <span className="nv-logo-i-line" aria-hidden="true" />
                <span className="nv-logo-i-top" aria-hidden="true" />
                <svg className="nv-logo-i-roots" viewBox="0 0 20 10" aria-hidden="true"><line x1="10" y1="0" x2="2" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><line x1="10" y1="0" x2="18" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="2" cy="9" r="1.7" fill="currentColor" /><circle cx="18" cy="9" r="1.7" fill="currentColor" /></svg>
              </span>
              a
            </span>
          </Link>

          <header className="nv-auth-head">
            <h1 className="nv-auth-h">Welcome <em>back.</em></h1>
            <p className="nv-auth-sub">Sign in to your account.</p>
          </header>

          <form onSubmit={handleSubmit} className="nv-auth-form">
            <label className="nv-auth-field">
              <span className="nv-auth-label">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoComplete="email"
                className="nv-auth-input"
              />
            </label>

            <label className="nv-auth-field">
              <span className="nv-auth-label">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="nv-auth-input"
              />
            </label>

            <div className="nv-auth-row">
              <label className="nv-auth-check">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link href="/auth/reset-password" className="nv-auth-link">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="nv-auth-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="nv-auth-cta" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
              <svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden="true">
                <path d="M0 6h18.5M14 1l5 5-5 5" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

const CSS = `
.nv-auth {
  --bg: #0D0B08;
  --bg-2: #110F0B;
  --panel: #15130F;
  --panel-2: #1A1813;
  --ink: #F4ECD9;
  --ink-2: #D9CFB7;
  --ink-3: #A89E86;
  --ink-4: #6E6651;
  --rule: #2F2A20;
  --rule-soft: #211D16;
  --accent: #C9912E;
  --accent-deep: #8A6420;
  --iron: #8C2820;

  min-height: 100vh;
  color: var(--ink);
  font-family: var(--font-reader), 'Newsreader', Georgia, serif;
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1, "onum" 1;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
  font-size: 17px;
  line-height: 1.6;
  position: relative;
  isolation: isolate;

  background:
    radial-gradient(1100px 720px at 12% 8%,   rgba(201,145,46,.12), transparent 58%),
    radial-gradient(900px  640px at 88% 92%,  rgba(140,40,32,.06), transparent 62%),
    radial-gradient(800px  600px at 50% 50%,  rgba(201,145,46,.04), transparent 70%),
    var(--bg);
  background-attachment: fixed;
}
.nv-auth *, .nv-auth *::before, .nv-auth *::after { box-sizing: border-box; }
.nv-auth ::selection { background: rgba(201,145,46,.32); color: var(--ink); }
.nv-auth a { color: inherit; text-decoration: none; }

.nv-auth::before {
  content: '';
  position: fixed; inset: 0;
  pointer-events: none;
  z-index: -1;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='nvbg'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.88  0 0 0 0.045 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23nvbg)'/%3E%3C/svg%3E");
  opacity: 0.45;
  mix-blend-mode: overlay;
}

.nv-auth-main {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 24px;
}

.nv-auth-card {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Logo */
.nv-auth-logo {
  margin-bottom: 56px;
  display: inline-block;
  transition: opacity .2s ease;
}
.nv-auth-logo:hover { opacity: 0.85; }
.nv-inline-wordmark {
  font-family: var(--font-logo), 'DM Serif Display', serif;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--ink);
  font-size: 36px;
  display: inline-flex;
  align-items: baseline;
  border-bottom: 0.04em solid var(--accent);
  padding-bottom: 0.02em;
}
.nv-logo-i {
  display: inline-block;
  position: relative;
  width: 0.22em;
  height: 0.70em;
  vertical-align: baseline;
  margin: 0 0.04em;
  top: 0.08em;
}
.nv-logo-i-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: -0.05em;
  width: 3px;
  background: var(--accent);
  transform: translateX(-50%);
}
.nv-logo-i-top {
  position: absolute;
  left: 50%;
  top: -0.15em;
  width: 0.17em;
  height: 0.17em;
  background: var(--accent);
  border-radius: 50%;
  transform: translateX(-50%);
}
/* roots sit BELOW the gold ground line — line is the surface, V is underneath */
.nv-logo-i-roots {
  position: absolute;
  left: 50%;
  top: 100%;
  width: 0.55em;
  height: 0.28em;
  color: var(--accent);
  transform: translate(-50%, 0.02em);
  overflow: visible;
  display: block;
  pointer-events: none;
}

/* Header */
.nv-auth-head {
  text-align: center;
  margin-bottom: 40px;
}
.nv-auth-h {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 144, "SOFT" 0;
  font-weight: 600;
  font-size: clamp(36px, 4.6vw, 52px);
  line-height: 1.05;
  letter-spacing: -0.024em;
  color: var(--ink);
  margin: 0 0 12px;
}
.nv-auth-h em {
  color: var(--accent);
  font-variation-settings: "opsz" 144, "SOFT" 60;
  font-style: italic;
}
.nv-auth-sub {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 16px;
  color: var(--ink-3);
  margin: 0;
}

/* Form */
.nv-auth-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.nv-auth-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.nv-auth-label {
  font-family: var(--font-label), sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.nv-auth-input {
  font-family: var(--font-reader), serif;
  font-size: 16px;
  line-height: 1.5;
  color: var(--ink);
  background: var(--panel);
  border: 1px solid var(--rule);
  border-radius: 0;
  padding: 14px 16px;
  outline: none;
  transition: border-color .2s ease, background .2s ease;
}
.nv-auth-input::placeholder {
  color: var(--ink-4);
  font-style: italic;
}
.nv-auth-input:focus {
  border-color: var(--accent);
  background: var(--panel-2);
}

.nv-auth-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 4px;
}
.nv-auth-check {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-family: var(--font-reader), serif;
  font-size: 14px;
  color: var(--ink-3);
  cursor: pointer;
  user-select: none;
}
.nv-auth-check input[type="checkbox"] {
  appearance: none;
  width: 14px; height: 14px;
  border: 1px solid var(--rule);
  background: var(--panel);
  margin: 0;
  cursor: pointer;
  position: relative;
  transition: border-color .15s, background .15s;
}
.nv-auth-check input[type="checkbox"]:checked {
  background: var(--accent);
  border-color: var(--accent);
}
.nv-auth-check input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 3px; top: 0;
  width: 5px; height: 9px;
  border: solid var(--bg);
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}
.nv-auth-link {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 14px;
  color: var(--accent);
  border-bottom: 1px solid transparent;
  transition: border-color .2s ease;
}
.nv-auth-link:hover { border-bottom-color: var(--accent-deep); }

.nv-auth-error {
  padding: 12px 14px;
  border: 1px solid var(--iron);
  background: rgba(140,40,32,.10);
  color: var(--ink-2);
  font-family: var(--font-reader), serif;
  font-size: 14px;
  line-height: 1.45;
}

.nv-auth-cta {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 28px;
  border: 1px solid var(--accent);
  background: linear-gradient(180deg, rgba(201,145,46,.14), rgba(201,145,46,.05));
  color: var(--accent);
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-weight: 500;
  font-size: 17px;
  cursor: pointer;
  transition: background .25s ease, color .25s ease, transform .25s ease;
  box-shadow: 0 20px 50px -28px rgba(201,145,46,.45);
}
.nv-auth-cta:hover:not(:disabled) {
  background: var(--accent);
  color: var(--bg);
  transform: translateY(-1px);
}
.nv-auth-cta:hover:not(:disabled) svg { transform: translateX(3px); }
.nv-auth-cta svg { transition: transform .2s ease; }
.nv-auth-cta:disabled { opacity: 0.6; cursor: not-allowed; }

.nv-auth :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

@media (max-width: 520px) {
  .nv-auth-main { padding: 32px 18px; }
  .nv-auth-logo { margin-bottom: 36px; }
  .nv-inline-wordmark { font-size: 30px; }
  .nv-auth-head { margin-bottom: 28px; }
}
`
