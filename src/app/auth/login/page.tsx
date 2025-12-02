'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createAuthClient } from '@/lib/supabase/auth-client'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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
    <div className="grid-split">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center px-20 bg-white">
        <div className="max-w-[360px]">
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
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: 'var(--grey-500)' }}>
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-[var(--burnt-orange)] hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
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
              placeholder="Enter your password"
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--grey-600)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--burnt-orange)]"
                />
                Remember me
              </label>
              <Link
                href="/auth/reset-password"
                className="text-sm text-[var(--burnt-orange)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[var(--error-muted)] border border-[var(--error)] text-[var(--error)] text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Sign in
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
        <div className="relative z-10 text-center" style={{ marginTop: 120 }}>
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
            Your <em style={{ color: 'var(--burnt-orange)', fontStyle: 'italic' }}>strategist</em> never sleeps
          </h2>
          <p
            className="text-base max-w-[360px]"
            style={{ color: 'var(--grey-400)', lineHeight: 1.6 }}
          >
            Intelligence that compounds. Campaigns that resonate. Results that matter.
          </p>
        </div>
      </div>
    </div>
  )
}
