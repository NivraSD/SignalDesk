'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createAuthClient } from '@/lib/supabase/auth-client'
import { NivriaLogo } from '@/components/brand/NivriaWordmark'
import { AUTH_CSS as CSS } from '@/components/brand/authCss'

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
      const next = new URLSearchParams(window.location.search).get('next') || ''
      router.push(next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/onboarding')
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
          <div className="nv-auth-logo">
            <NivriaLogo size="md" href="/" />
          </div>

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
