'use client'

import { useRouter } from 'next/navigation'
import { AuthForm } from '@/components/auth/AuthForm'

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">SignalDesk</h1>
          <p className="text-gray-400">Welcome back! Sign in to continue.</p>
        </div>

        <AuthForm
          mode="signin"
          onSuccess={() => router.push('/dashboard')}
        />
      </div>
    </div>
  )
}
