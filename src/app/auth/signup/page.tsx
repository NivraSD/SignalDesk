'use client'

import { AuthForm } from '@/components/auth/AuthForm'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--charcoal)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center mb-12 justify-center">
          <div className="px-8 py-3 flex items-center justify-center" style={{
            background: 'var(--mauve)',
            clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0% 100%)'
          }}>
            <span className="text-3xl font-light tracking-tight" style={{ color: 'var(--pearl)' }}>Nivria</span>
          </div>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2" style={{ color: 'var(--pearl)' }}>Create your account</h1>
          <p className="text-sm font-light" style={{ color: 'var(--pearl)', opacity: 0.7 }}>
            Start orchestrating influence across every platform.
          </p>
        </div>

        <AuthForm mode="signup" />
      </div>
    </div>
  )
}
