'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function TestSupabase() {
  const [status, setStatus] = useState<'testing' | 'connected' | 'error'>('testing')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function testConnection() {
      try {
        // Test basic connection by checking if we can access the organizations table
        const { data, error } = await supabase
          .from('organizations')
          .select('count')
          .limit(1)

        if (error) {
          // If it's a permission error, that's actually good - means we're connected
          if (error.message.includes('permission') || error.message.includes('RLS')) {
            setStatus('connected')
            setMessage('Connected to Supabase (RLS active)')
          } else {
            throw error
          }
        } else {
          setStatus('connected')
          setMessage('Successfully connected to Supabase')
        }
      } catch (error: any) {
        setStatus('error')
        setMessage(`Connection failed: ${error.message}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gray-900 rounded-lg border border-gray-800 flex items-center gap-2">
      {status === 'testing' && (
        <>
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          <span className="text-sm text-gray-400">Testing Supabase connection...</span>
        </>
      )}
      {status === 'connected' && (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-400">{message}</span>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-400">{message}</span>
        </>
      )}
    </div>
  )
}