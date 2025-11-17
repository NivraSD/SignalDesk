'use client'

import { useState } from 'react'
import { createAuthClient } from '@/lib/supabase/auth-client'

type AuthMode = 'signin' | 'signup'

interface AuthFormProps {
  mode: AuthMode
  onSuccess?: () => void
}

export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

  const supabase = createAuthClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) throw error

        if (data?.user?.identities?.length === 0) {
          setMessage({
            type: 'error',
            text: 'An account with this email already exists.',
          })
        } else if (data?.session) {
          // Email confirmation is disabled, user is immediately logged in
          setMessage({
            type: 'success',
            text: 'Account created successfully!',
          })

          // Redirect to onboarding
          setTimeout(() => {
            window.location.href = '/onboarding'
          }, 500)
        } else {
          // Email confirmation is enabled, waiting for verification
          setMessage({
            type: 'success',
            text: 'Check your email to confirm your account!',
          })
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        setMessage({
          type: 'success',
          text: 'Signed in successfully!',
        })

        onSuccess?.()
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setMessage({
        type: 'error',
        text: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label htmlFor="fullName" className="block text-sm font-light mb-1" style={{ color: 'var(--pearl)', opacity: 0.9 }}>
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-white"
              style={{
                background: 'var(--charcoal-light)',
                borderColor: 'var(--border)'
              }}
              placeholder="John Doe"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-light mb-1" style={{ color: 'var(--pearl)', opacity: 0.9 }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-white"
            style={{
              background: 'var(--charcoal-light)',
              borderColor: 'var(--border)'
            }}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-light mb-1" style={{ color: 'var(--pearl)', opacity: 0.9 }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-white"
            style={{
              background: 'var(--charcoal-light)',
              borderColor: 'var(--border)'
            }}
            placeholder="••••••••"
          />
          {mode === 'signin' && (
            <div className="text-right mt-2">
              <a href="/auth/reset-password" className="text-sm" style={{ color: 'var(--mauve)' }}>
                Forgot password?
              </a>
            </div>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-lg ${
            message.type === 'error'
              ? 'bg-red-900/20 border border-red-700 text-red-300'
              : 'bg-green-900/20 border border-green-700 text-green-300'
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 disabled:cursor-not-allowed text-white font-light rounded-lg transition-colors"
          style={{
            background: loading ? 'var(--charcoal-light)' : 'var(--mauve)',
            opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? 'Loading...' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm" style={{ color: 'var(--pearl)', opacity: 0.7 }}>
        {mode === 'signup' ? (
          <>
            Already have an account?{' '}
            <a href="/auth/login" style={{ color: 'var(--mauve)' }}>
              Sign in
            </a>
          </>
        ) : (
          <>
            Don't have an account?{' '}
            <a href="/auth/signup" style={{ color: 'var(--mauve)' }}>
              Sign up
            </a>
          </>
        )}
      </div>
    </div>
  )
}
