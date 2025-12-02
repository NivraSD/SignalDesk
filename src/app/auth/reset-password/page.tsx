'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createAuthClient } from '@/lib/supabase/auth-client'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

  const supabase = createAuthClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Check your email for the password reset link!',
      })
      setEmail('')
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
              Reset password
            </h1>
            <p className="text-sm" style={{ color: 'var(--grey-500)' }}>
              Enter your email and we'll send you a reset link.
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
              Send reset link
            </Button>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-[var(--burnt-orange)] hover:underline"
              >
                Back to sign in
              </Link>
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
            We've got your <em style={{ color: 'var(--burnt-orange)', fontStyle: 'italic' }}>back</em>
          </h2>
          <p
            className="text-base max-w-[360px]"
            style={{ color: 'var(--grey-400)', lineHeight: 1.6 }}
          >
            Secure, simple password recovery. You'll be back to creating campaigns in no time.
          </p>
        </div>
      </div>
    </div>
  )
}
