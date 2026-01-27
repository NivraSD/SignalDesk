'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createAuthClient } from '@/lib/supabase/auth-client'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)
  const router = useRouter()

  const supabase = createAuthClient()

  useEffect(() => {
    // Listen for auth state changes - Supabase will automatically
    // process the recovery token from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Recovery token was valid, session is now active
        setSessionReady(true)
        setCheckingSession(false)
      } else if (event === 'SIGNED_IN' && session) {
        // Also handle if already signed in via recovery
        setSessionReady(true)
        setCheckingSession(false)
      }
    })

    // Also check if there's already a session (in case event already fired)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      }
      setCheckingSession(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match',
      })
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters',
      })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Password updated successfully! Redirecting...',
      })

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
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

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className="grid-split">
        <div className="flex flex-col justify-center items-center px-20 bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--burnt-orange)] mx-auto mb-4"></div>
            <p style={{ color: 'var(--grey-500)' }}>Verifying reset link...</p>
          </div>
        </div>
        <div style={{ background: 'var(--charcoal)' }} />
      </div>
    )
  }

  // Show error if no valid session
  if (!sessionReady) {
    return (
      <div className="grid-split">
        <div className="flex flex-col justify-center px-20 bg-white">
          <div className="max-w-[360px]">
            <div className="mb-12">
              <Link href="/">
                <Logo variant="dark" size="md" />
              </Link>
            </div>
            <div className="mb-8">
              <h1
                className="text-3xl font-normal mb-2 headline-serif"
                style={{ color: 'var(--charcoal)' }}
              >
                Link expired
              </h1>
              <p className="text-sm" style={{ color: 'var(--grey-500)' }}>
                This password reset link is invalid or has expired. Please request a new one.
              </p>
            </div>
            <Link href="/auth/reset-password">
              <Button variant="primary" size="lg" className="w-full">
                Request new link
              </Button>
            </Link>
          </div>
        </div>
        <div style={{ background: 'var(--charcoal)' }} />
      </div>
    )
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
              Update password
            </h1>
            <p className="text-sm" style={{ color: 'var(--grey-500)' }}>
              Enter your new password below.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              hint="Must be at least 6 characters"
            />

            <Input
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />

            {message && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  background: message.type === 'error' ? 'var(--error-muted)' : 'var(--success-muted)',
                  border: `1px solid ${message.type === 'error' ? 'var(--error)' : 'var(--success)'}`,
                  color: message.type === 'error' ? 'var(--error)' : 'var(--success)'
                }}
              >
                {message.text}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Update password
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
            Almost <em style={{ color: 'var(--burnt-orange)', fontStyle: 'italic' }}>there</em>
          </h2>
          <p
            className="text-base max-w-[360px]"
            style={{ color: 'var(--grey-400)', lineHeight: 1.6 }}
          >
            Set a strong password and get back to creating impactful campaigns.
          </p>
        </div>
      </div>
    </div>
  )
}
