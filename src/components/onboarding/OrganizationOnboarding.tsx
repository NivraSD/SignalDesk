import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Globe, Sparkles, Check, X, Plus, Trash2,
  ChevronRight, ChevronLeft, Upload, Loader, AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface DiscoveredItems {
  competitors: string[]
  topics: string[]
  stakeholders: {
    regulators: string[]
    influencers: string[]
    major_customers: string[]
  }
  industry: string
  sub_industry: string
  description: string
}

interface OrganizationOnboardingProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (organization: any) => void
}

export default function OrganizationOnboarding({
  isOpen,
  onClose,
  onComplete
}: OrganizationOnboardingProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Basic Info
  const [orgName, setOrgName] = useState('')
  const [website, setWebsite] = useState('')
  const [industry, setIndustry] = useState('')

  // Step 2-4: Discovery Results & Customization
  const [discovered, setDiscovered] = useState<DiscoveredItems | null>(null)
  const [fullProfile, setFullProfile] = useState<any>(null)
  const [selectedCompetitors, setSelectedCompetitors] = useState<Set<string>>(new Set())
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [selectedStakeholders, setSelectedStakeholders] = useState<Set<string>>(new Set())
  const [customCompetitors, setCustomCompetitors] = useState<string[]>([])
  const [customTopics, setCustomTopics] = useState<string[]>([])
  const [customStakeholders, setCustomStakeholders] = useState<string[]>([])
  const [newCompetitor, setNewCompetitor] = useState('')
  const [newTopic, setNewTopic] = useState('')
  const [newStakeholder, setNewStakeholder] = useState('')

  // Step 5: GEO Targets
  const [serviceLines, setServiceLines] = useState<string[]>([])
  const [geographicFocus, setGeographicFocus] = useState<string[]>([])
  const [industryVerticals, setIndustryVerticals] = useState<string[]>([])
  const [priorityQueries, setPriorityQueries] = useState<string[]>([])
  const [geoCompetitors, setGeoCompetitors] = useState<string[]>([])
  const [newServiceLine, setNewServiceLine] = useState('')
  const [newGeoFocus, setNewGeoFocus] = useState('')
  const [newIndustryVertical, setNewIndustryVertical] = useState('')
  const [newPriorityQuery, setNewPriorityQuery] = useState('')
  const [newGeoCompetitor, setNewGeoCompetitor] = useState('')

  // Step 5: Memory Vault
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  // Step 6: GEO Discovery Results (NEW)
  const [geoResults, setGeoResults] = useState<any>(null)
  const [geoDiscoveryStarted, setGeoDiscoveryStarted] = useState(false)
  const [showGeoResults, setShowGeoResults] = useState(false)

  // Step 7: Schema Generation Progress (Enhanced Pipeline)
  const [schemaProgress, setSchemaProgress] = useState({
    schemaDiscovery: 'pending', // pending, processing, completed, failed
    geoDiscovery: 'pending',
    websiteScraping: 'pending',
    entityExtraction: 'pending',
    entityEnrichment: 'pending',
    coverageDiscovery: 'pending',
    schemaSynthesis: 'pending',
    message: ''
  })
  const [schemaGenerationStarted, setSchemaGenerationStarted] = useState(false)
  const [createdOrganization, setCreatedOrganization] = useState<any>(null)

  const totalSteps = 7  // Added GEO discovery step
  const MAX_TOTAL_TARGETS = 20  // Hard limit: 15 from discovery + up to 5 custom

  // Helper function to calculate total targets
  const getTotalTargets = () => {
    const competitorCount = selectedCompetitors.size + customCompetitors.length
    const stakeholderCount = selectedStakeholders.size + customStakeholders.length
    return competitorCount + stakeholderCount
  }

  // Helper function to check if we can add more targets
  const canAddMoreTargets = () => {
    return getTotalTargets() < MAX_TOTAL_TARGETS
  }

  const handleBasicInfoSubmit = async () => {
    if (!orgName || !website) {
      setError('Organization name and website are required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🔍 Running MCP discovery...')

      const response = await fetch('/api/organizations/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_name: orgName,
          industry_hint: industry,
          website
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Discovery failed')
      }

      setDiscovered(data.discovered)
      setFullProfile(data.full_profile)

      // Pre-select all discovered items
      setSelectedCompetitors(new Set(data.discovered.competitors))
      setSelectedTopics(new Set(data.discovered.topics))
      // Pre-select stakeholders too (regulators, influencers, customers)
      const allStakeholders = [
        ...(data.discovered.stakeholders?.regulators || []),
        ...(data.discovered.stakeholders?.influencers || []),
        ...(data.discovered.stakeholders?.major_customers || [])
      ]
      setSelectedStakeholders(new Set(allStakeholders))

      console.log('✅ Discovery complete')
      setStep(2)
    } catch (err: any) {
      console.error('Discovery error:', err)
      setError(err.message || 'Failed to run discovery')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrganization = async () => {
    console.log('🚀 handleCreateOrganization CALLED - START OF FUNCTION')
    console.log('Organization details:', { orgName, website, industry })

    setLoading(true)
    setError(null)

    try {
      // 1. Create organization
      console.log('📝 Creating organization...')
      const orgResponse = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          url: website,
          industry: discovered?.industry || industry,
          description: discovered?.description
        })
      })

      const orgData = await orgResponse.json()

      if (!orgData.success) {
        const errorMsg = orgData.error || 'Failed to create organization'
        const details = orgData.details ? `\n\nDetails: ${JSON.stringify(orgData.details)}` : ''
        throw new Error(errorMsg + details)
      }

      const organization = orgData.organization

      if (!organization) {
        throw new Error('No organization data returned from API')
      }

      // 2. Save targets (topics removed - not effective)
      console.log('🎯 Saving targets...')
      const allCompetitors = [
        ...Array.from(selectedCompetitors),
        ...customCompetitors
      ]
      const allStakeholders = [
        ...Array.from(selectedStakeholders),
        ...customStakeholders
      ]

      const targets = [
        ...allCompetitors.map(name => ({
          name,
          type: 'competitor',
          priority: 'high',
          active: true
        })),
        // Topics removed - 0% monitoring effectiveness
        ...allStakeholders.map(name => ({
          name,
          type: 'influencer',
          priority: 'medium',
          active: true
        }))
      ]

      const targetsResponse = await fetch('/api/organizations/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organization.id,
          targets
        })
      })

      const targetsData = await targetsResponse.json()

      if (!targetsData.success) {
        console.warn('Failed to save targets:', targetsData.error)
      }

      // 3. Save org profile to mcp_discovery table
      if (fullProfile) {
        console.log('💾 Saving organization profile to mcp_discovery...')
        try {
          // Merge user's customized selections into the profile
          const customizedProfile = {
            ...fullProfile,
            organization_id: organization.id,
            organization_name: organization.name,
            competition: {
              ...fullProfile.competition,
              direct_competitors: allCompetitors
            }
            // Topics removed - not effective for monitoring
          }

          // Insert directly into mcp_discovery table
          const { error: profileError } = await supabase
            .from('mcp_discovery')
            .upsert({
              organization_id: organization.id,
              organization_name: organization.name,
              // Flatten the profile structure for database storage
              ...customizedProfile,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'organization_id'
            })

          if (profileError) {
            console.error('Failed to save profile to mcp_discovery:', profileError)
          } else {
            console.log('✅ Profile saved to mcp_discovery table')
          }
        } catch (profileError) {
          console.error('Error saving profile:', profileError)
          // Non-fatal - continue with onboarding
        }
      }

      // 4. Save GEO targets (if configured)
      if (serviceLines.length > 0 || geographicFocus.length > 0 || industryVerticals.length > 0 || priorityQueries.length > 0) {
        console.log('🎯 Saving GEO targets...')

        const geoTargetsResponse = await fetch('/api/organizations/geo-targets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: organization.id,
            service_lines: serviceLines,
            geographic_focus: geographicFocus,
            industry_verticals: industryVerticals,
            priority_queries: priorityQueries,
            geo_competitors: geoCompetitors.length > 0 ? geoCompetitors : Array.from(selectedCompetitors),
            active: true
          })
        })

        const geoTargetsData = await geoTargetsResponse.json()

        if (!geoTargetsData.success) {
          console.warn('Failed to save GEO targets:', geoTargetsData.error)
        } else {
          console.log('✅ GEO targets saved')
        }
      }

      // 5. Upload Memory Vault files (if any)
      if (uploadedFiles.length > 0) {
        console.log(`📤 Uploading ${uploadedFiles.length} files to Memory Vault...`)

        for (const file of uploadedFiles) {
          try {
            // Read file content
            const content = await file.text()

            // Call niv-memory-vault to index the content
            const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
            const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

            const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-memory-vault`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                content,
                content_type: 'template',
                organization_id: organization.id,
                metadata: {
                  filename: file.name,
                  uploaded_during_onboarding: true
                }
              })
            })

            if (!response.ok) {
              const errorData = await response.json()
              console.warn(`Failed to upload ${file.name}:`, errorData)
            } else {
              console.log(`✅ Uploaded ${file.name} to Memory Vault`)
            }
          } catch (err) {
            console.error(`Error uploading ${file.name}:`, err)
          }
        }
      }

      console.log('✅ Organization created successfully!', organization)

      // Store the organization for GEO discovery and schema generation
      setCreatedOrganization(organization)
      console.log('📝 Stored organization in state:', organization.id)

      // Turn off loading
      setLoading(false)

      // Move to Step 6: GEO Discovery
      setTimeout(() => {
        setStep(6)
        console.log('➡️ Moved to step 6 (GEO Discovery)')
      }, 0)
    } catch (err: any) {
      console.error('Create organization error:', err)
      setError(err.message || 'Failed to create organization')
      setLoading(false)
    }
  }

  const handleGeoDiscovery = async () => {
    setGeoDiscoveryStarted(true)

    const orgId = createdOrganization?.id
    const orgNameToUse = createdOrganization?.name || orgName

    if (!orgId) {
      console.error('❌ No organization ID available for GEO discovery')
      return
    }

    try {
      console.log('🎯 Running GEO Discovery...')

      // STEP 1: Generate intelligent queries using geo-query-discovery
      console.log('🔍 Generating queries...')
      const { data: queryData, error: queryError} = await supabase.functions.invoke('geo-query-discovery', {
        body: {
          organization_id: orgId,
          organization_name: orgNameToUse,
          industry: discovered?.industry || industry,
          competitors: Array.from(selectedCompetitors).concat(customCompetitors),
          mcp_profile: fullProfile  // Pass MCP discovery data for better query generation
        }
      })

      if (queryError || !queryData?.queries) {
        throw new Error('Failed to generate queries')
      }

      // Select 5 queries from each priority level for testing
      const queries = [
        ...(queryData.queries.critical || []).slice(0, 2),
        ...(queryData.queries.high || []).slice(0, 2),
        ...(queryData.queries.medium || []).slice(0, 1)
      ]

      console.log(`✅ Generated ${queries.length} queries for testing`)

      // STEP 2: Test all 4 platforms in PARALLEL
      console.log('🚀 Testing all platforms in parallel...')
      const testBody = {
        organization_name: orgNameToUse,
        queries
      }

      const [claudeResult, geminiResult, perplexityResult, chatgptResult] = await Promise.all([
        supabase.functions.invoke('geo-test-claude', { body: testBody }),
        supabase.functions.invoke('geo-test-gemini', { body: testBody }),
        supabase.functions.invoke('geo-test-perplexity', { body: testBody }),
        supabase.functions.invoke('geo-test-chatgpt', { body: testBody })
      ])

      // Check results
      const results = {
        claude: claudeResult.data,
        gemini: geminiResult.data,
        perplexity: perplexityResult.data,
        chatgpt: chatgptResult.data
      }

      console.log('✅ All platform tests complete:', {
        claude: `${results.claude?.mentions || 0}/${results.claude?.queries_tested || 0}`,
        gemini: `${results.gemini?.mentions || 0}/${results.gemini?.queries_tested || 0}`,
        perplexity: `${results.perplexity?.mentions || 0}/${results.perplexity?.queries_tested || 0}`,
        chatgpt: `${results.chatgpt?.mentions || 0}/${results.chatgpt?.queries_tested || 0}`
      })

      // STEP 3: Transform results for synthesis
      const transformedResults = []
      const queryMap = new Map(queries.map(q => [q.query, q]))

      for (const [platformName, platformData] of Object.entries(results)) {
        if (platformData?.signals && Array.isArray(platformData.signals)) {
          for (const signal of platformData.signals) {
            const originalQuery = queryMap.get(signal.data?.query)
            transformedResults.push({
              query: signal.data?.query || '',
              intent: originalQuery?.intent || 'unknown',
              priority: signal.priority || 'medium',
              platform: platformName as 'claude' | 'gemini' | 'chatgpt' | 'perplexity',
              response: '',
              brand_mentioned: signal.data?.mentioned || false,
              rank: signal.data?.position || undefined,
              context_quality: signal.data?.context ? 'strong' : undefined,
              competitors_mentioned: signal.data?.competitors_mentioned || []
            })
          }
        }
      }

      console.log(`🎯 Synthesizing ${transformedResults.length} test results...`)
      const { data: synthesisData, error: synthesisError } = await supabase.functions.invoke('geo-executive-synthesis', {
        body: {
          organization_id: orgId,
          organization_name: orgNameToUse,
          industry: discovered?.industry || industry,
          geo_results: transformedResults
        }
      })

      if (synthesisError) {
        throw new Error('Failed to synthesize results')
      }

      // Format results for display
      const geoData = {
        success: true,
        summary: {
          total_queries: queries.length,
          total_signals: transformedResults.length,
          claude_mentions: results.claude?.mentions || 0,
          gemini_mentions: results.gemini?.mentions || 0,
          perplexity_mentions: results.perplexity?.mentions || 0,
          chatgpt_mentions: results.chatgpt?.mentions || 0
        },
        synthesis: synthesisData?.synthesis
      }

      console.log('✅ GEO Discovery Complete:', geoData.summary)
      setGeoResults(geoData)
      setShowGeoResults(true)
    } catch (error) {
      console.error('GEO Discovery error:', error)
      setGeoResults({ error: 'GEO Discovery failed' })
    }
  }

  const handleSchemaGeneration = async () => {
    setSchemaGenerationStarted(true)
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const orgId = createdOrganization?.id
    const orgNameToUse = createdOrganization?.name || orgName

    if (!orgId) {
      console.error('❌ No organization ID available for schema generation')
      setSchemaProgress({
        ...schemaProgress,
        message: 'Organization not found. Please try again.'
      })
      return
    }

    try {
      console.log('🚀 Starting Schema Onboarding Pipeline...')

      // Call the orchestrator
      const orchestratorResponse = await fetch(`${SUPABASE_URL}/functions/v1/schema-onboarding-orchestrator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: orgId,
          organization_name: orgNameToUse,
          website_url: website,
          industry: discovered?.industry || industry,
          skip_geo_discovery: !!geoResults // Skip if we already ran it
        })
      })

      if (orchestratorResponse.ok) {
        const orchestratorData = await orchestratorResponse.json()
        console.log('✅ Schema Onboarding Pipeline Complete:', orchestratorData.summary)

        // Check if we actually got entity data
        const entitiesExtracted = orchestratorData.summary?.entities_extracted || 0
        const hasData = entitiesExtracted > 0

        // Mark all stages as completed
        setSchemaProgress({
          schemaDiscovery: 'completed',
          geoDiscovery: geoResults ? 'completed' : 'skipped',
          websiteScraping: 'completed',
          entityExtraction: 'completed',
          entityEnrichment: 'completed',
          coverageDiscovery: 'completed',
          schemaSynthesis: 'completed',
          message: hasData
            ? `Schema generated with ${entitiesExtracted} entities!`
            : 'Schema generated but no entities extracted - website may need manual review'
        })

        // Only auto-close if we have good data, otherwise let user review
        if (hasData) {
          setTimeout(() => {
            onComplete({
              id: createdOrganization.id,
              name: createdOrganization.name,
              industry: createdOrganization.industry,
              config: {}
            })

            resetForm()
            onClose()
          }, 3000)
        } else {
          // Show warning but don't auto-close
          console.warn('⚠️ Schema generated but no entities extracted')
        }
      } else {
        const errorText = await orchestratorResponse.text()
        console.error('Schema onboarding failed:', errorText)

        setSchemaProgress({
          ...schemaProgress,
          schemaSynthesis: 'failed',
          message: 'Schema generation failed. You can continue anyway.'
        })
      }
    } catch (error) {
      console.error('Schema generation error:', error)

      setSchemaProgress({
        ...schemaProgress,
        schemaSynthesis: 'failed',
        message: 'Schema generation failed. You can continue anyway.'
      })
    }
  }

  const resetForm = () => {
    setStep(1)
    setOrgName('')
    setWebsite('')
    setIndustry('')
    setDiscovered(null)
    setFullProfile(null)
    setSelectedCompetitors(new Set())
    setSelectedTopics(new Set())
    setCustomCompetitors([])
    setCustomTopics([])
    setNewCompetitor('')
    setNewTopic('')
    setUploadedFiles([])
    setGeoResults(null)
    setGeoDiscoveryStarted(false)
    setShowGeoResults(false)
    setSchemaProgress({
      schemaDiscovery: 'pending',
      geoDiscovery: 'pending',
      websiteScraping: 'pending',
      entityExtraction: 'pending',
      entityEnrichment: 'pending',
      coverageDiscovery: 'pending',
      schemaSynthesis: 'pending',
      message: ''
    })
    setSchemaGenerationStarted(false)
    setCreatedOrganization(null)
    setError(null)
  }

  const toggleCompetitor = (competitor: string) => {
    const newSelected = new Set(selectedCompetitors)
    if (newSelected.has(competitor)) {
      newSelected.delete(competitor)
      setSelectedCompetitors(newSelected)
    } else if (canAddMoreTargets()) {
      newSelected.add(competitor)
      setSelectedCompetitors(newSelected)
    } else {
      setError(`Maximum of ${MAX_TOTAL_TARGETS} total targets reached`)
      setTimeout(() => setError(null), 3000)
    }
  }

  const toggleTopic = (topic: string) => {
    const newSelected = new Set(selectedTopics)
    if (newSelected.has(topic)) {
      newSelected.delete(topic)
    } else {
      newSelected.add(topic)
    }
    setSelectedTopics(newSelected)
  }

  const addCustomCompetitor = () => {
    if (newCompetitor.trim() && canAddMoreTargets()) {
      setCustomCompetitors([...customCompetitors, newCompetitor.trim()])
      setNewCompetitor('')
    } else if (!canAddMoreTargets()) {
      setError(`Maximum of ${MAX_TOTAL_TARGETS} total targets reached`)
      setTimeout(() => setError(null), 3000)
    }
  }

  const addCustomTopic = () => {
    if (newTopic.trim()) {
      setCustomTopics([...customTopics, newTopic.trim()])
      setNewTopic('')
    }
  }

  const removeCustomCompetitor = (index: number) => {
    setCustomCompetitors(customCompetitors.filter((_, i) => i !== index))
  }

  const removeCustomTopic = (index: number) => {
    setCustomTopics(customTopics.filter((_, i) => i !== index))
  }

  const toggleStakeholder = (stakeholder: string) => {
    const newSelected = new Set(selectedStakeholders)
    if (newSelected.has(stakeholder)) {
      newSelected.delete(stakeholder)
      setSelectedStakeholders(newSelected)
    } else if (canAddMoreTargets()) {
      newSelected.add(stakeholder)
      setSelectedStakeholders(newSelected)
    } else {
      setError(`Maximum of ${MAX_TOTAL_TARGETS} total targets reached`)
      setTimeout(() => setError(null), 3000)
    }
  }

  const addCustomStakeholder = () => {
    if (newStakeholder.trim() && canAddMoreTargets()) {
      setCustomStakeholders([...customStakeholders, newStakeholder.trim()])
      setNewStakeholder('')
    } else if (!canAddMoreTargets()) {
      setError(`Maximum of ${MAX_TOTAL_TARGETS} total targets reached`)
      setTimeout(() => setError(null), 3000)
    }
  }

  const removeCustomStakeholder = (index: number) => {
    setCustomStakeholders(customStakeholders.filter((_, i) => i !== index))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Add New Organization</h2>
              <p className="text-sm text-gray-400 mt-1">
                Step {step} of {totalSteps}
              </p>
            </div>
            <button
              onClick={() => {
                resetForm()
                onClose()
              }}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Organization Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                      placeholder="e.g., Anthropic"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Website URL *
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Industry (optional)
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                    placeholder="e.g., Artificial Intelligence"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If not provided, we'll auto-detect the industry
                  </p>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-cyan-300 font-medium">
                        AI-Powered Discovery
                      </p>
                      <p className="text-xs text-cyan-400/70 mt-1">
                        We'll analyze your organization and discover competitors
                        and key stakeholders automatically
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Discovery Results - Competitors */}
            {step === 2 && discovered && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Discovered Competitors
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Select which competitors you'd like to monitor. You can add custom ones too.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {discovered.competitors.map((competitor) => (
                      <button
                        key={competitor}
                        onClick={() => toggleCompetitor(competitor)}
                        className={`px-4 py-3 rounded-lg border transition-all text-left ${
                          selectedCompetitors.has(competitor)
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{competitor}</span>
                          {selectedCompetitors.has(competitor) && (
                            <Check className="w-4 h-4 text-cyan-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Custom competitors */}
                  {customCompetitors.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {customCompetitors.map((competitor, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                        >
                          <span className="text-sm text-gray-300">{competitor}</span>
                          <button
                            onClick={() => removeCustomCompetitor(index)}
                            className="p-1 hover:bg-gray-700 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCompetitor}
                        onChange={(e) => setNewCompetitor(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCustomCompetitor()}
                        placeholder="Add custom competitor"
                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        onClick={addCustomCompetitor}
                        disabled={!newCompetitor.trim() || !canAddMoreTargets()}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
                        title={!canAddMoreTargets() ? `Maximum of ${MAX_TOTAL_TARGETS} targets reached` : ''}
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                    <p className={`text-xs mt-2 ${getTotalTargets() >= MAX_TOTAL_TARGETS ? 'text-amber-400' : 'text-gray-500'}`}>
                      {getTotalTargets()}/{MAX_TOTAL_TARGETS} targets selected
                      {getTotalTargets() >= MAX_TOTAL_TARGETS && ' (Maximum reached)'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Stakeholders (Topics removed - not effective) */}
            {step === 3 && discovered && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Key Stakeholders
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Select stakeholders to monitor. These include regulators, influencers, and major customers.
                  </p>

                  {/* Combine all stakeholder types from discovery */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      ...(discovered.stakeholders?.regulators || []),
                      ...(discovered.stakeholders?.influencers || []),
                      ...(discovered.stakeholders?.major_customers || [])
                    ].map((stakeholder) => (
                      <button
                        key={stakeholder}
                        onClick={() => toggleStakeholder(stakeholder)}
                        className={`px-4 py-3 rounded-lg border transition-all text-left ${
                          selectedStakeholders.has(stakeholder)
                            ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{stakeholder}</span>
                          {selectedStakeholders.has(stakeholder) && (
                            <Check className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Custom stakeholders */}
                  {customStakeholders.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {customStakeholders.map((stakeholder, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                        >
                          <span className="text-sm text-gray-300">{stakeholder}</span>
                          <button
                            onClick={() => removeCustomStakeholder(index)}
                            className="p-1 hover:bg-gray-700 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newStakeholder}
                      onChange={(e) => setNewStakeholder(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomStakeholder()}
                      placeholder="Add custom stakeholder"
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={addCustomStakeholder}
                      disabled={!newStakeholder.trim() || !canAddMoreTargets()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
                      title={!canAddMoreTargets() ? `Maximum of ${MAX_TOTAL_TARGETS} targets reached` : ''}
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-400">
                    <p className="font-medium text-gray-300 mb-2">Summary:</p>
                    <ul className="space-y-1">
                      <li>• {selectedCompetitors.size + customCompetitors.length} competitors selected</li>
                      <li>• {selectedStakeholders.size + customStakeholders.length} stakeholders selected</li>
                      <li className={getTotalTargets() >= MAX_TOTAL_TARGETS ? 'text-amber-400 font-medium' : ''}>
                        • Total targets: {getTotalTargets()}/{MAX_TOTAL_TARGETS}
                        {getTotalTargets() >= MAX_TOTAL_TARGETS && ' (Maximum reached)'}
                      </li>
                      <li>• Industry: {discovered.industry}</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: GEO Targets (Optional) */}
            {step === 4 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-xl font-semibold text-white">GEO Optimization Targets</h3>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Configure how you want to appear in AI platforms like Claude, ChatGPT, and Gemini. These targets will generate intelligent test queries specific to your positioning goals.
                  </p>
                  <p className="text-purple-400 text-xs mt-1">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Optional - Skip if you want to use general industry patterns
                  </p>
                </div>

                {/* Service Lines */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Service Lines / Specializations
                    <span className="text-gray-500 text-xs ml-2">(What you want to be found for)</span>
                  </label>
                  {serviceLines.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {serviceLines.map((line, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1 bg-cyan-900/30 border border-cyan-700 rounded-full text-sm text-cyan-300 flex items-center gap-2"
                        >
                          {line}
                          <button
                            onClick={() => setServiceLines(serviceLines.filter((_, i) => i !== idx))}
                            className="hover:bg-cyan-800 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newServiceLine}
                      onChange={(e) => setNewServiceLine(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newServiceLine.trim()) {
                          setServiceLines([...serviceLines, newServiceLine.trim()])
                          setNewServiceLine('')
                        }
                      }}
                      placeholder="e.g., Crisis Communications, Litigation PR, M&A Communications"
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={() => {
                        if (newServiceLine.trim()) {
                          setServiceLines([...serviceLines, newServiceLine.trim()])
                          setNewServiceLine('')
                        }
                      }}
                      disabled={!newServiceLine.trim()}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Geographic Focus */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Geographic Focus Areas
                    <span className="text-gray-500 text-xs ml-2">(Where you operate or want visibility)</span>
                  </label>
                  {geographicFocus.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {geographicFocus.map((geo, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1 bg-blue-900/30 border border-blue-700 rounded-full text-sm text-blue-300 flex items-center gap-2"
                        >
                          {geo}
                          <button
                            onClick={() => setGeographicFocus(geographicFocus.filter((_, i) => i !== idx))}
                            className="hover:bg-blue-800 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newGeoFocus}
                      onChange={(e) => setNewGeoFocus(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newGeoFocus.trim()) {
                          setGeographicFocus([...geographicFocus, newGeoFocus.trim()])
                          setNewGeoFocus('')
                        }
                      }}
                      placeholder="e.g., Middle East, GCC, Dubai, UAE, Saudi Arabia"
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        if (newGeoFocus.trim()) {
                          setGeographicFocus([...geographicFocus, newGeoFocus.trim()])
                          setNewGeoFocus('')
                        }
                      }}
                      disabled={!newGeoFocus.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Industry Verticals */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Industry Verticals
                    <span className="text-gray-500 text-xs ml-2">(Industries you serve)</span>
                  </label>
                  {industryVerticals.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {industryVerticals.map((vertical, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1 bg-green-900/30 border border-green-700 rounded-full text-sm text-green-300 flex items-center gap-2"
                        >
                          {vertical}
                          <button
                            onClick={() => setIndustryVerticals(industryVerticals.filter((_, i) => i !== idx))}
                            className="hover:bg-green-800 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newIndustryVertical}
                      onChange={(e) => setNewIndustryVertical(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newIndustryVertical.trim()) {
                          setIndustryVerticals([...industryVerticals, newIndustryVertical.trim()])
                          setNewIndustryVertical('')
                        }
                      }}
                      placeholder="e.g., Financial Services, Technology, Energy, Government"
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                    />
                    <button
                      onClick={() => {
                        if (newIndustryVertical.trim()) {
                          setIndustryVerticals([...industryVerticals, newIndustryVertical.trim()])
                          setNewIndustryVertical('')
                        }
                      }}
                      disabled={!newIndustryVertical.trim()}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Priority Queries */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority Queries
                    <span className="text-gray-500 text-xs ml-2">(Specific searches you want to rank for)</span>
                  </label>
                  {priorityQueries.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {priorityQueries.map((query, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2 bg-purple-900/30 border border-purple-700 rounded-lg text-sm text-purple-300 flex items-center justify-between"
                        >
                          <span>"{query}"</span>
                          <button
                            onClick={() => setPriorityQueries(priorityQueries.filter((_, i) => i !== idx))}
                            className="hover:bg-purple-800 rounded p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPriorityQuery}
                      onChange={(e) => setNewPriorityQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newPriorityQuery.trim()) {
                          setPriorityQueries([...priorityQueries, newPriorityQuery.trim()])
                          setNewPriorityQuery('')
                        }
                      }}
                      placeholder='e.g., "crisis PR agency Middle East", "litigation communications Dubai"'
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={() => {
                        if (newPriorityQuery.trim()) {
                          setPriorityQueries([...priorityQueries, newPriorityQuery.trim()])
                          setNewPriorityQuery('')
                        }
                      }}
                      disabled={!newPriorityQuery.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-400">
                    <p className="font-medium text-gray-300 mb-2">GEO Targets Summary:</p>
                    <ul className="space-y-1">
                      <li>• {serviceLines.length} service lines configured</li>
                      <li>• {geographicFocus.length} geographic regions</li>
                      <li>• {industryVerticals.length} industry verticals</li>
                      <li>• {priorityQueries.length} priority queries</li>
                      {(serviceLines.length > 0 || geographicFocus.length > 0) && (
                        <li className="text-cyan-400 mt-2">
                          ✓ Will generate ~{Math.min(30, (serviceLines.length * geographicFocus.length * 2) + priorityQueries.length)} intelligent test queries
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Memory Vault (Optional) */}
            {step === 5 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Memory Vault Assets (Optional)
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Upload brand guidelines, templates, or past campaigns to help NIV understand your brand voice
                  </p>

                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-gray-600 transition-colors">
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-sm text-gray-400 mb-2">
                      Drag and drop files here, or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      Supported: PDF, DOCX, TXT, MD
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.txt,.md"
                      onChange={(e) => {
                        if (e.target.files) {
                          setUploadedFiles(Array.from(e.target.files))
                        }
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg cursor-pointer transition-colors"
                    >
                      Choose Files
                    </label>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                              <Upload className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                              <p className="text-sm text-white font-medium">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
                            }}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-cyan-300 font-medium">
                        Skip this step if you prefer
                      </p>
                      <p className="text-xs text-cyan-400/70 mt-1">
                        You can always upload assets later from the Memory Vault module
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 6: GEO Discovery Results */}
            {step === 6 && (
              <motion.div
                key="step6-geo"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    GEO Discovery & AI Visibility Analysis
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Discover how your organization appears across AI platforms before generating your schema.
                  </p>

                  {!geoDiscoveryStarted && (
                    <div className="space-y-4">
                      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-cyan-300 font-medium">
                              AI Visibility Testing
                            </p>
                            <p className="text-xs text-cyan-400/70 mt-1">
                              We'll test how your organization appears in Claude, ChatGPT, Gemini, and Perplexity.
                              This helps identify gaps and opportunities before building your schema.
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleGeoDiscovery}
                        disabled={!createdOrganization}
                        className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Globe className="w-5 h-5" />
                        Run GEO Discovery
                      </button>

                      <button
                        onClick={() => {
                          setGeoResults({ skipped: true })
                          setStep(7)
                        }}
                        className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        Skip GEO Discovery
                      </button>
                    </div>
                  )}

                  {geoDiscoveryStarted && !showGeoResults && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                      <p className="text-gray-400">Running AI visibility tests across multiple platforms...</p>
                      <p className="text-xs text-gray-500 mt-2">This may take 30-40 seconds</p>
                    </div>
                  )}

                  {showGeoResults && geoResults && !geoResults.error && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                          <p className="text-xs text-gray-400 mb-1">Claude Mentions</p>
                          <p className="text-2xl font-bold text-white">{geoResults.summary?.claude_mentions || 0}</p>
                        </div>
                        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                          <p className="text-xs text-gray-400 mb-1">ChatGPT Mentions</p>
                          <p className="text-2xl font-bold text-white">{geoResults.summary?.chatgpt_mentions || 0}</p>
                        </div>
                        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                          <p className="text-xs text-gray-400 mb-1">Gemini Mentions</p>
                          <p className="text-2xl font-bold text-white">{geoResults.summary?.gemini_mentions || 0}</p>
                        </div>
                        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                          <p className="text-xs text-gray-400 mb-1">Perplexity Mentions</p>
                          <p className="text-2xl font-bold text-white">{geoResults.summary?.perplexity_mentions || 0}</p>
                        </div>
                      </div>

                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                        <p className="text-sm text-green-300 font-medium">
                          ✓ GEO Discovery Complete
                        </p>
                        <p className="text-xs text-green-400/70 mt-1">
                          Found {geoResults.summary?.total_signals || 0} intelligence signals.
                          These insights will inform your schema generation.
                        </p>
                      </div>

                      <button
                        onClick={() => setStep(7)}
                        className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        Continue to Schema Generation
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {geoResults?.error && (
                    <div className="space-y-4">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <p className="text-sm text-red-300 font-medium">
                          GEO Discovery Failed
                        </p>
                        <p className="text-xs text-red-400/70 mt-1">
                          Don't worry - you can still proceed with schema generation.
                        </p>
                      </div>

                      <button
                        onClick={() => setStep(7)}
                        className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                      >
                        Continue Anyway
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 7: Schema Generation Progress (Enhanced Pipeline) */}
            {step === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Building Your Optimal Schema
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Running our 6-stage GEO-optimized pipeline to create the best possible schema for AI visibility.
                  </p>

                  <div className="space-y-3">
                    {/* Stage 1: Website Scraping */}
                    <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        schemaProgress.websiteScraping === 'completed' ? 'bg-green-500/20' :
                        schemaProgress.websiteScraping === 'processing' ? 'bg-cyan-500/20' :
                        schemaProgress.websiteScraping === 'failed' ? 'bg-red-500/20' :
                        'bg-gray-700'
                      }`}>
                        {schemaProgress.websiteScraping === 'completed' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : schemaProgress.websiteScraping === 'processing' ? (
                          <Loader className="w-4 h-4 text-cyan-400 animate-spin" />
                        ) : schemaProgress.websiteScraping === 'failed' ? (
                          <X className="w-4 h-4 text-red-400" />
                        ) : (
                          <Globe className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Website Scraping</p>
                        <p className="text-xs text-gray-400">Collecting clean text from key pages</p>
                      </div>
                    </div>

                    {/* Stage 2: Entity Extraction */}
                    <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        schemaProgress.entityExtraction === 'completed' ? 'bg-green-500/20' :
                        schemaProgress.entityExtraction === 'processing' ? 'bg-cyan-500/20' :
                        schemaProgress.entityExtraction === 'failed' ? 'bg-red-500/20' :
                        'bg-gray-700'
                      }`}>
                        {schemaProgress.entityExtraction === 'completed' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : schemaProgress.entityExtraction === 'processing' ? (
                          <Loader className="w-4 h-4 text-cyan-400 animate-spin" />
                        ) : schemaProgress.entityExtraction === 'failed' ? (
                          <X className="w-4 h-4 text-red-400" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Entity Extraction</p>
                        <p className="text-xs text-gray-400">Identifying products, services, team, locations</p>
                      </div>
                    </div>

                    {/* Stage 3: Entity Enrichment */}
                    <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        schemaProgress.entityEnrichment === 'completed' ? 'bg-green-500/20' :
                        schemaProgress.entityEnrichment === 'processing' ? 'bg-cyan-500/20' :
                        schemaProgress.entityEnrichment === 'failed' ? 'bg-red-500/20' :
                        'bg-gray-700'
                      }`}>
                        {schemaProgress.entityEnrichment === 'completed' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : schemaProgress.entityEnrichment === 'processing' ? (
                          <Loader className="w-4 h-4 text-cyan-400 animate-spin" />
                        ) : schemaProgress.entityEnrichment === 'failed' ? (
                          <X className="w-4 h-4 text-red-400" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Entity Enrichment</p>
                        <p className="text-xs text-gray-400">Validating, deduplicating, and prioritizing</p>
                      </div>
                    </div>

                    {/* Stage 4: Coverage Discovery */}
                    <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        schemaProgress.coverageDiscovery === 'completed' ? 'bg-green-500/20' :
                        schemaProgress.coverageDiscovery === 'processing' ? 'bg-cyan-500/20' :
                        schemaProgress.coverageDiscovery === 'failed' ? 'bg-red-500/20' :
                        'bg-gray-700'
                      }`}>
                        {schemaProgress.coverageDiscovery === 'completed' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : schemaProgress.coverageDiscovery === 'processing' ? (
                          <Loader className="w-4 h-4 text-cyan-400 animate-spin" />
                        ) : schemaProgress.coverageDiscovery === 'failed' ? (
                          <X className="w-4 h-4 text-red-400" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Positive Coverage Discovery</p>
                        <p className="text-xs text-gray-400">Finding awards, achievements, recognition</p>
                      </div>
                    </div>

                    {/* Stage 5: Schema Synthesis */}
                    <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        schemaProgress.schemaSynthesis === 'completed' ? 'bg-green-500/20' :
                        schemaProgress.schemaSynthesis === 'processing' ? 'bg-cyan-500/20' :
                        schemaProgress.schemaSynthesis === 'failed' ? 'bg-red-500/20' :
                        'bg-gray-700'
                      }`}>
                        {schemaProgress.schemaSynthesis === 'completed' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : schemaProgress.schemaSynthesis === 'processing' ? (
                          <Loader className="w-4 h-4 text-cyan-400 animate-spin" />
                        ) : schemaProgress.schemaSynthesis === 'failed' ? (
                          <X className="w-4 h-4 text-red-400" />
                        ) : (
                          <Building2 className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Schema Synthesis</p>
                        <p className="text-xs text-gray-400">Generating optimal schema.org graph</p>
                      </div>
                    </div>
                  </div>

                  {schemaProgress.message && (
                    <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                      <p className="text-sm text-cyan-300">{schemaProgress.message}</p>
                    </div>
                  )}

                  {/* Show buttons if generation hasn't started or failed */}
                  <div className="mt-6 flex gap-3">
                    {!schemaGenerationStarted && (
                      <button
                        onClick={() => {
                          console.log('🚀 Starting schema onboarding pipeline')
                          handleSchemaGeneration()
                        }}
                        disabled={!createdOrganization}
                        className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-5 h-5" />
                        Start Pipeline
                      </button>
                    )}

                    {(schemaProgress.schemaSynthesis === 'failed' || !schemaGenerationStarted || (schemaProgress.schemaSynthesis === 'completed' && schemaProgress.message?.includes('no entities'))) && (
                      <button
                        onClick={() => {
                          if (createdOrganization) {
                            onComplete({
                              id: createdOrganization.id,
                              name: createdOrganization.name,
                              industry: createdOrganization.industry,
                              config: {}
                            })
                          }
                          resetForm()
                          onClose()
                        }}
                        disabled={!createdOrganization}
                        className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        {schemaProgress.schemaSynthesis === 'failed' || schemaProgress.message?.includes('no entities') ? 'Continue Anyway' : 'Skip Schema Generation'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-300">Error</p>
                <p className="text-xs text-red-400/70 mt-1">{error}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer - Hide on steps 6 and 7 (GEO Discovery & Schema Generation) */}
        {step !== 6 && step !== 7 && (
          <div className="px-8 py-4 border-t border-gray-700 bg-gray-800/50 flex items-center justify-between">
            <button
              onClick={() => {
                if (step > 1) setStep(step - 1)
              }}
              disabled={step === 1 || loading}
              className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-3">
              {step <= 5 ? (
              <button
                onClick={() => {
                  if (step === 1) {
                    handleBasicInfoSubmit()
                  } else if (step === 5) {
                    // Step 5 -> Create org and move to step 6
                    handleCreateOrganization()
                  } else {
                    setStep(step + 1)
                  }
                }}
                disabled={loading || (step === 1 && (!orgName || !website))}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    {step === 1 ? 'Discovering...' : step === 5 ? 'Creating...' : 'Loading...'}
                  </>
                ) : (
                  <>
                    {step === 1 ? 'Run Discovery' : 'Next'}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : null}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
