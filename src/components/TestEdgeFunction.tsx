'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestEdgeFunction() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testSimpleCall = async () => {
    setTesting(true)
    setError(null)
    setResult(null)

    try {
      // Try a simple hello world test first
      const { data, error: fnError } = await supabase.functions.invoke('hello-world', {
        body: { name: 'Test' }
      })

      if (fnError) {
        console.error('Hello world failed:', fnError)
        
        // Now try mcp-discovery with minimal params
        const { data: discoveryData, error: discoveryError } = await supabase.functions.invoke('mcp-discovery', {
          body: { 
            test: true // Just test if the function responds
          }
        })

        if (discoveryError) {
          setError(`Function error: ${discoveryError.message}`)
          console.error('Full error:', discoveryError)
        } else {
          setResult(discoveryData)
        }
      } else {
        setResult(data)
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Catch error:', err)
    } finally {
      setTesting(false)
    }
  }

  const testMcpDiscovery = async () => {
    setTesting(true)
    setError(null)
    setResult(null)

    try {
      // First log what we're sending
      const payload = { 
        tool: 'create_organization_profile',
        arguments: {
          organization_name: 'Tesla Motors',
          industry_hint: 'Electric Vehicles',
          save_to_persistence: false // Don't save for testing
        }
      }
      
      console.log('Sending payload:', payload)
      
      const { data, error: fnError } = await supabase.functions.invoke('mcp-discovery', {
        body: payload
      })

      if (fnError) {
        setError(`MCP Discovery error: ${fnError.message}`)
        console.error('MCP Discovery full error:', fnError)
      } else {
        setResult(data)
        console.log('MCP Discovery success:', data)
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Catch error:', err)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="fixed top-20 right-4 z-50 p-4 bg-gray-900 rounded-lg border border-gray-800 w-96">
      <h3 className="text-sm font-bold mb-2 text-cyan-400">Edge Function Test</h3>
      
      <div className="space-y-2">
        <button
          onClick={testSimpleCall}
          disabled={testing}
          className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded text-sm"
        >
          {testing ? 'Testing...' : 'Test Simple Call'}
        </button>
        
        <button
          onClick={testMcpDiscovery}
          disabled={testing}
          className="w-full px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded text-sm"
        >
          {testing ? 'Testing...' : 'Test MCP Discovery'}
        </button>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded">
          <p className="text-xs text-green-400">Success!</p>
          <pre className="text-xs mt-1 overflow-auto max-h-40">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}