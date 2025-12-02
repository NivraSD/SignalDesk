'use client'

import { useState, useEffect } from 'react'
import {
  Globe,
  AlertTriangle,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'
import IntelligenceSynthesisDisplay from '@/components/IntelligenceSynthesisDisplay'

export default function GeoIntelModule() {
  const { organization } = useAppStore()
  const [geoResults, setGeoResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState<string>('')
  const [scanError, setScanError] = useState<string | null>(null)

  // Load any existing GEO results from the latest synthesis
  useEffect(() => {
    if (organization?.id) {
      loadLatestGeoResults()
    }
  }, [organization?.id])

  const loadLatestGeoResults = async () => {
    setLoading(true)
    try {
      // Check if we have any recent GEO synthesis stored
      const { data, error } = await supabase
        .from('geo_intelligence')
        .select('*')
        .eq('organization_id', organization?.id)
        .eq('signal_type', 'geo_synthesis')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!error && data?.data) {
        setGeoResults(data.data)
      }
    } catch (error) {
      // No existing results, that's fine
      console.log('No existing GEO synthesis found')
    } finally {
      setLoading(false)
    }
  }

  const runGeoScan = async () => {
    if (!organization) return

    setIsScanning(true)
    setScanError(null)
    setScanProgress('Initializing GEO scan...')
    setGeoResults(null)

    try {
      console.log('🌍 Starting GEO Intelligence Monitor for', organization.name)

      // STEP 1: Generate strategic GEO queries
      setScanProgress('Step 1/3: Generating strategic queries...')
      const { data: queryData, error: queryError } = await supabase.functions.invoke('geo-query-discovery', {
        body: {
          organization_id: organization.id,
          organization_name: organization.name,
          industry: organization.industry
        }
      })

      if (queryError) {
        throw new Error(`Failed to generate GEO queries: ${queryError.message}`)
      }

      if (!queryData?.success) {
        throw new Error(queryData?.error || 'Failed to generate GEO queries')
      }

      const metaAnalysisPrompt = queryData.meta_analysis_prompt
      const queryScenarios = queryData.query_scenarios || []

      if (!metaAnalysisPrompt) {
        throw new Error('No meta-analysis prompt generated')
      }

      console.log(`✅ Generated meta-analysis prompt (${queryScenarios.length} scenarios)`)

      // STEP 2: Test all 4 platforms in PARALLEL
      setScanProgress('Step 2/3: Testing Claude, Gemini, Perplexity, ChatGPT...')

      const [claudeResults, geminiResults, perplexityResults, chatgptResults] = await Promise.all([
        supabase.functions.invoke('geo-test-claude', {
          body: {
            organization_id: organization.id,
            organization_name: organization.name,
            meta_analysis_prompt: metaAnalysisPrompt
          }
        }),
        supabase.functions.invoke('geo-test-gemini', {
          body: {
            organization_id: organization.id,
            organization_name: organization.name,
            meta_analysis_prompt: metaAnalysisPrompt
          }
        }),
        supabase.functions.invoke('geo-test-perplexity', {
          body: {
            organization_id: organization.id,
            organization_name: organization.name,
            meta_analysis_prompt: metaAnalysisPrompt
          }
        }),
        supabase.functions.invoke('geo-test-chatgpt', {
          body: {
            organization_id: organization.id,
            organization_name: organization.name,
            meta_analysis_prompt: metaAnalysisPrompt
          }
        })
      ])

      console.log('✓ All platforms tested')

      // Prepare platform meta-analysis data
      const platformAnalyses = {
        claude: {
          meta_analysis: claudeResults.data?.meta_analysis,
          sources: [],
          raw_response: claudeResults.data?.raw_response
        },
        gemini: {
          meta_analysis: geminiResults.data?.meta_analysis,
          sources: geminiResults.data?.sources || [],
          raw_response: geminiResults.data?.raw_response
        },
        perplexity: {
          meta_analysis: perplexityResults.data?.meta_analysis,
          sources: perplexityResults.data?.sources || [],
          raw_response: perplexityResults.data?.raw_response
        },
        chatgpt: {
          meta_analysis: chatgptResults.data?.meta_analysis,
          sources: [],
          raw_response: chatgptResults.data?.raw_response
        }
      }

      // STEP 3: Generate executive synthesis
      setScanProgress('Step 3/3: Generating executive synthesis...')

      const { data: synthesisData, error: synthesisError } = await supabase.functions.invoke('geo-executive-synthesis', {
        body: {
          organization_id: organization.id,
          organization_name: organization.name,
          industry: organization.industry,
          query_scenarios: queryScenarios,
          platform_analyses: platformAnalyses
        }
      })

      if (synthesisError) {
        console.warn('Synthesis error (non-blocking):', synthesisError)
      }

      console.log('✅ GEO monitor complete')

      // Construct final results object
      const monitorData = {
        success: true,
        summary: {
          total_scenarios: queryScenarios.length,
          platforms_tested: 4,
          synthesis_available: !!synthesisData?.synthesis
        },
        query_scenarios: queryScenarios,
        platform_analyses: platformAnalyses,
        synthesis: synthesisData?.synthesis || null,
        meta: {
          generated_at: new Date().toISOString(),
          scenarios_analyzed: queryScenarios.length,
          platforms_analyzed: 4
        }
      }

      setGeoResults(monitorData)
      setScanProgress('')
    } catch (error: any) {
      console.error('GEO scan failed:', error)
      setScanError(error.message || 'GEO scan failed')
      setScanProgress('')
    } finally {
      setIsScanning(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--charcoal)]">
        <div className="flex items-center gap-3 text-[var(--grey-400)]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading GEO Intelligence...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[var(--charcoal)]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[var(--grey-800)]">
        <div className="flex items-center justify-between">
          <div>
            <div
              className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--burnt-orange)] flex items-center gap-2 mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="w-1.5 h-1.5 bg-[var(--burnt-orange)] rounded-full" />
              GEO Intelligence
            </div>
            <h1
              className="text-[1.5rem] font-normal text-white"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Generative Experience Optimization
            </h1>
            <p className="text-[var(--grey-400)] text-sm mt-1">
              Monitor and optimize your visibility across AI platforms
            </p>
          </div>

          <button
            onClick={runGeoScan}
            disabled={isScanning}
            className="px-4 py-2.5 bg-[var(--burnt-orange)] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[var(--burnt-orange-light)] transition-colors disabled:opacity-50"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Run GEO Scan
              </>
            )}
          </button>
        </div>

        {/* Scan Progress */}
        {isScanning && scanProgress && (
          <div className="mt-4 p-4 bg-[var(--grey-800)] rounded-lg border border-[var(--grey-700)]">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--burnt-orange)]" />
              <div>
                <p className="text-white text-sm font-medium">{scanProgress}</p>
                <p className="text-[var(--grey-400)] text-xs mt-1">Testing AI visibility across Claude, Gemini, Perplexity, ChatGPT...</p>
              </div>
            </div>
          </div>
        )}

        {/* Scan Error */}
        {scanError && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm font-medium">GEO Scan Failed</p>
                <p className="text-[var(--grey-300)] text-xs mt-1">{scanError}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {geoResults?.synthesis ? (
          <IntelligenceSynthesisDisplay synthesis={geoResults} loading={false} />
        ) : (
          <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-12 text-center">
            <Globe className="w-16 h-16 mx-auto mb-4 text-[var(--grey-600)]" />
            <h3
              className="text-lg font-medium text-white mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              No GEO Intelligence Yet
            </h3>
            <p className="text-[var(--grey-400)] text-sm mb-6 max-w-md mx-auto">
              Run a GEO scan to discover how your organization appears in AI-generated responses and identify optimization opportunities.
            </p>
            <button
              onClick={runGeoScan}
              disabled={isScanning}
              className="px-5 py-2.5 bg-[var(--burnt-orange)] text-white rounded-lg text-sm font-medium inline-flex items-center gap-2 hover:bg-[var(--burnt-orange-light)] transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <RefreshCw className="w-4 h-4" />
              Start GEO Scan
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
