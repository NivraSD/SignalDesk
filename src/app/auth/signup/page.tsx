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
