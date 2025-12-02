'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createAuthClient } from '@/lib/supabase/auth-client'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createAuthClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data?.user?.identities?.length === 0) {
        setError('An account with this email already exists.')
      } else if (data?.session) {
        setSuccess('Account created successfully!')
        setTimeout(() => {
          router.push('/onboarding')
        }, 500)
      } else {
        setSuccess('Check your email to confirm your account!')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div className="grid-split">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center px-20 bg-white overflow-y-auto">
        <div className="max-w-[360px] py-12">
          {/* Logo */}
          <div className="mb-12">
            <Link href="/">
              <Logo variant="dark" size="md" />
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-3xl font-normal mb-2 headline-serif"
              style={{ color: 'var(--charcoal)' }}
            >
              Create your account
            </h1>
            <p className="text-sm" style={{ color: 'var(--grey-500)' }}>
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[var(--burnt-orange)] hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
              required
            />

            <Input
              label="Work email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
              hint="Must be at least 6 characters"
            />

            <Input
              label="Company name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Inc"
            />

            <label className="flex items-start gap-2 text-sm cursor-pointer" style={{ color: 'var(--grey-600)' }}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded accent-[var(--burnt-orange)]"
              />
              <span>
                I agree to the{' '}
                <Link href="#" className="text-[var(--burnt-orange)] hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#" className="text-[var(--burnt-orange)] hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {error && (
              <div className="p-3 rounded-lg bg-[var(--error-muted)] border border-[var(--error)] text-[var(--error)] text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-[var(--success-muted)] border border-[var(--success)] text-[var(--success)] text-sm">
                {success}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Create account
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-2">
              <div className="flex-1 h-px bg-[var(--grey-200)]" />
              <span className="text-xs" style={{ color: 'var(--grey-400)' }}>or continue with</span>
              <div className="flex-1 h-px bg-[var(--grey-200)]" />
            </div>

            {/* Social Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => handleOAuthSignIn('google')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => handleOAuthSignIn('github')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Brand */}
      <div
        className="relative flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'var(--charcoal)' }}
      >
        {/* Decorative Circles */}
        <div
          className="absolute rounded-full border opacity-10"
          style={{
            width: 400,
            height: 400,
            top: -100,
            right: -100,
            borderColor: 'var(--burnt-orange)'
          }}
        />
        <div
          className="absolute rounded-full border opacity-10"
          style={{
            width: 300,
            height: 300,
            bottom: -50,
            left: -50,
            borderColor: 'var(--burnt-orange)'
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center">
          {/* Large Logo */}
          <div className="mb-8">
            <svg width="120" height="72" viewBox="0 0 120 72">
              <path d="M15 0 H120 V72 H0 L15 0 Z" fill="#faf9f7" />
              <text
                x="60"
                y="48"
                textAnchor="middle"
                fontFamily="Space Grotesk, sans-serif"
                fontSize="32"
                fontWeight="700"
                fill="#1a1a1a"
                letterSpacing="-1"
              >
                NIV
              </text>
              <path d="M102 0 H120 V18 L102 0 Z" fill="#c75d3a" />
            </svg>
          </div>

          <h2
            className="text-4xl font-normal mb-4 headline-serif"
            style={{ color: 'var(--white)' }}
          >
            Seize <em style={{ color: 'var(--burnt-orange)', fontStyle: 'italic' }}>opportunities others miss</em>
          </h2>
          <p
            className="text-base max-w-[360px]"
            style={{ color: 'var(--grey-400)', lineHeight: 1.6 }}
          >
            Join teams who've transformed their strategic communications with AI-powered intelligence.
          </p>
        </div>
      </div>
    </div>
  )
}
