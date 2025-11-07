'use client'

import { useState } from 'react'
import { createAuthClient } from '@/lib/supabase/auth-client'

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
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-400">Enter your email to receive a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="you@example.com"
            />
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
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          <a href="/auth/login" className="text-blue-400 hover:text-blue-300">
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  )
}
