import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Globe, Sparkles, Check, X, Plus, Trash2,
  ChevronRight, ChevronLeft, ChevronDown, Upload, Loader, AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface DiscoveredItems {
  competitors: string[]
  topics: string[]
  stakeholders: {
    key_analysts?: string[]
    activists?: string[]
    regulators?: string[]
    influencers?: string[]
    major_customers?: string[]
    major_investors?: string[]
    key_partners?: string[]
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
  const [aboutPage, setAboutPage] = useState('')
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

  // Strategic Context
  const [targetCustomers, setTargetCustomers] = useState('')
  const [brandPersonality, setBrandPersonality] = useState('')
  const [strategicPriorities, setStrategicPriorities] = useState<string[]>([])
  const [newPriority, setNewPriority] = useState('')

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
    schemaSynthesis: 'pending',
    schemaEnhancement: 'pending', // Stage 7
    message: ''
  })
  const [schemaGenerationStarted, setSchemaGenerationStarted] = useState(false)
  const [createdOrganization, setCreatedOrganization] = useState<any>(null)
  const [existingSchemaData, setExistingSchemaData] = useState<any>(null)

  // Step 8: Optional Schema Enhancements
  const [showEnhancements, setShowEnhancements] = useState(false)
  const [awardsMedia, setAwardsMedia] = useState<Array<{ url: string; description: string }>>([])
  const [currentAwardUrl, setCurrentAwardUrl] = useState('')
  const [currentAwardDescription, setCurrentAwardDescription] = useState('')
  const [socialProfiles, setSocialProfiles] = useState({
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: ''
  })
  const [testimonials, setTestimonials] = useState('')
  const [productsPage, setProductsPage] = useState('')
  const [generatedSchemaData, setGeneratedSchemaData] = useState<any>(null)
  const [enhancementLoading, setEnhancementLoading] = useState(false)
  const [schemaSaved, setSchemaSaved] = useState(false) // Track if schema has been saved

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
    if (!orgName || !website || !aboutPage) {
      setError('Organization name, website, and about/capabilities page are required')
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
          website,
          about_page: aboutPage
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Discovery failed')
      }

      setDiscovered(data.discovered)
      setFullProfile(data.full_profile)

      // Populate strategic context from discovery
      if (data.full_profile?.strategic_context) {
        setTargetCustomers(data.full_profile.strategic_context.target_customers || '')
        setBrandPersonality(data.full_profile.strategic_context.brand_personality || '')
        setStrategicPriorities(data.full_profile.strategic_context.strategic_priorities || [])
      }

      // Pre-select ONLY competitors (users should review stakeholders for relevance)
      setSelectedCompetitors(new Set(data.discovered.competitors.map(c =>
        typeof c === 'string' ? c : c.name
      )))
      setSelectedTopics(new Set(data.discovered.topics))

      // DO NOT auto-select stakeholders - they need strategic review
      // Regulators especially can create noise if not properly scoped
      // Users will manually select which stakeholders are strategically relevant
      setSelectedStakeholders(new Set())

      // Pre-populate GEO service lines from MCP discovery
      if (data.full_profile?.service_lines && Array.isArray(data.full_profile.service_lines)) {
        setServiceLines(data.full_profile.service_lines)
        console.log('✅ Pre-populated GEO service lines from MCP:', data.full_profile.service_lines)
      }

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

      // 1.5. Populate company profile from discovery data
      console.log('📋 Populating company profile from discovery...')
      const companyProfile = {
        // Product lines from GEO service lines
        product_lines: serviceLines || [],
        // Key markets from GEO geographic focus
        key_markets: geographicFocus || [],
        // Business context from discovery
        business_model: discovered?.description ?
          (discovered.description.includes('B2B') ? 'B2B' :
           discovered.description.includes('B2C') ? 'B2C' :
           discovered.description.includes('SaaS') ? 'B2B SaaS' : '') : '',
        // Industry from discovery
        // Leadership, headquarters, size can be filled later in settings
        leadership: [],
        headquarters: {},
        company_size: {},
        founded: '',
        parent_company: ''
      }

      try {
        await fetch(`/api/organizations/profile?id=${organization.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_profile: companyProfile })
        })
        console.log('✅ Company profile initialized')
      } catch (err) {
        console.warn('⚠️ Failed to initialize company profile:', err)
        // Don't fail onboarding if this fails
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

      console.log(`   📊 Competitors: ${allCompetitors.length}`, allCompetitors)
      console.log(`   📊 Stakeholders: ${allStakeholders.length}`, allStakeholders)

      // Helper to find monitoring context from discovery data
      const findTargetContext = (name: string, type: 'competitor' | 'stakeholder') => {
        if (type === 'competitor') {
          const competitor = fullProfile?.competition?.direct_competitors?.find(
            (c: any) => (typeof c === 'string' ? c : c.name) === name
          )
          if (competitor && typeof competitor === 'object') {
            return {
              monitoring_context: competitor.monitoring_context,
              industry_context: competitor.industry_context,
              relevance_filter: competitor.relevance_filter
            }
          }
        } else {
          // Check all stakeholder types
          const stakeholderTypes = [
            'key_analysts',
            'activists',
            'regulators',
            'influencers',
            'major_customers',
            'major_investors',
            'key_partners'
          ]

          for (const type of stakeholderTypes) {
            const stakeholder = fullProfile?.stakeholders?.[type]?.find(
              (s: any) => (typeof s === 'string' ? s : s.name) === name
            )
            if (stakeholder && typeof stakeholder === 'object') {
              return {
                monitoring_context: stakeholder.monitoring_context,
                industry_context: stakeholder.industry_context,
                relevance_filter: stakeholder.relevance_filter
              }
            }
          }
        }
        return {}
      }

      const targets = [
        ...allCompetitors.map(name => ({
          name,
          type: 'competitor',
          priority: 'high',
          active: true,
          ...findTargetContext(name, 'competitor')
        })),
        // Topics removed - 0% monitoring effectiveness
        ...allStakeholders.map(name => ({
          name,
          type: 'stakeholder',
          priority: 'medium',
          active: true,
          ...findTargetContext(name, 'stakeholder')
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
        console.error('❌ Failed to save targets:', targetsData.error)
        console.error('   Response:', targetsData)
      } else {
        console.log(`✅ Successfully saved ${targetsData.count || 0} targets`)
      }

      // 3. Update strategic context in organization profile
      if (fullProfile && (targetCustomers || brandPersonality || strategicPriorities.length > 0)) {
        console.log('💾 Updating strategic context in profile...')
        try {
          const { error: profileError } = await supabase
            .from('organization_profiles')
            .update({
              profile_data: {
                ...fullProfile,
                strategic_context: {
                  target_customers: targetCustomers,
                  brand_personality: brandPersonality,
                  strategic_priorities: strategicPriorities
                }
              },
              updated_at: new Date().toISOString()
            })
            .eq('organization_name', orgName)

          if (profileError) {
            console.warn('Failed to update strategic context:', profileError)
          } else {
            console.log('✅ Strategic context saved to profile')
          }
        } catch (error) {
          console.warn('Error saving strategic context:', error)
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
      console.log('🎯 Running GEO Discovery with frontend orchestration...')

      // STEP 1: Generate strategic GEO queries
      console.log('📋 Step 1/3: Generating GEO queries...')
      const { data: queryData, error: queryError } = await supabase.functions.invoke('geo-query-discovery', {
        body: {
          organization_id: orgId,
          organization_name: orgNameToUse,
          industry: discovered?.industry || industry
        }
      })

      if (queryError) {
        console.error('Query generation error:', queryError)
        throw new Error(`Failed to generate GEO queries: ${queryError.message}`)
      }

      if (!queryData?.success) {
        console.error('Query generation failed:', queryData)
        throw new Error(queryData?.error || 'Failed to generate GEO queries')
      }

      // Extract meta-analysis prompt (NEW) or fall back to queries (backwards compatible)
      const metaAnalysisPrompt = queryData.meta_analysis_prompt
      const categorizedQueries = queryData.queries
      let queries: any[] = []

      // Flatten categorized structure into single array (for backwards compatibility)
      if (categorizedQueries) {
        if (Array.isArray(categorizedQueries)) {
          // Already a flat array
          queries = categorizedQueries
        } else if (typeof categorizedQueries === 'object') {
          // Categorized object - flatten by priority
          queries = [
            ...(categorizedQueries.critical || []),
            ...(categorizedQueries.high || []),
            ...(categorizedQueries.medium || [])
          ]
        }
      }

      if (!metaAnalysisPrompt && (!Array.isArray(queries) || queries.length === 0)) {
        console.error('Categorized queries:', categorizedQueries)
        throw new Error('No queries or meta-analysis prompt generated')
      }

      if (metaAnalysisPrompt) {
        console.log(`✅ Generated meta-analysis prompt (${topQueries?.length || 10} scenarios)`)
      } else {
        console.log(`✅ Generated ${queries.length} queries (fallback mode)`)
      }

      // STEP 2: Test all 4 platforms in PARALLEL with META-ANALYSIS
      console.log('🚀 Step 2/3: Testing all 4 platforms with meta-analysis (1 comprehensive call each)...')

      const [claudeResults, geminiResults, perplexityResults, chatgptResults] = await Promise.all([
        supabase.functions.invoke('geo-test-claude', {
          body: {
            organization_id: orgId,
            organization_name: orgNameToUse,
            meta_analysis_prompt: metaAnalysisPrompt,
            queries: metaAnalysisPrompt ? undefined : queries.slice(0, 10)  // Fallback
          }
        }),
        supabase.functions.invoke('geo-test-gemini', {
          body: {
            organization_id: orgId,
            organization_name: orgNameToUse,
            meta_analysis_prompt: metaAnalysisPrompt,
            queries: metaAnalysisPrompt ? undefined : queries.slice(0, 10)  // Fallback
          }
        }),
        supabase.functions.invoke('geo-test-perplexity', {
          body: {
            organization_id: orgId,
            organization_name: orgNameToUse,
            meta_analysis_prompt: metaAnalysisPrompt,
            queries: metaAnalysisPrompt ? undefined : queries.slice(0, 10)  // Fallback
          }
        }),
        supabase.functions.invoke('geo-test-chatgpt', {
          body: {
            organization_id: orgId,
            organization_name: orgNameToUse,
            meta_analysis_prompt: metaAnalysisPrompt,
            queries: metaAnalysisPrompt ? undefined : queries.slice(0, 10)  // Fallback
          }
        })
      ])

      console.log('   ✓ All platforms tested')

      // Check for errors but don't block on them
      if (claudeResults.error) console.warn('Claude error (non-blocking):', claudeResults.error)
      if (geminiResults.error) console.warn('Gemini error (non-blocking):', geminiResults.error)
      if (perplexityResults.error) console.warn('Perplexity error (non-blocking):', perplexityResults.error)
      if (chatgptResults.error) console.warn('ChatGPT error (non-blocking):', chatgptResults.error)

      // Combine all platform results
      const allSignals = [
        ...(claudeResults.data?.signals || []),
        ...(geminiResults.data?.signals || []),
        ...(perplexityResults.data?.signals || []),
        ...(chatgptResults.data?.signals || [])
      ]

      console.log(`✅ Collected ${allSignals.length} signals from 4 platforms`)

      // Transform signals to format expected by synthesis function
      const transformedResults = allSignals.map(signal => ({
        query: signal.data?.query || '',
        intent: signal.data?.intent || 'informational',
        priority: signal.priority || 'medium',
        platform: signal.platform,
        response: signal.data?.context || signal.data?.response || '',
        brand_mentioned: signal.data?.mentioned || false,
        rank: signal.data?.position || undefined,
        context_quality: signal.data?.context_quality || 'medium',
        competitors_mentioned: signal.data?.competitors_mentioned || [],
        sources: signal.data?.sources || [],  // Pass through source citations from Gemini/Perplexity
        source_domains: signal.data?.source_domains || []  // Pass through source domains
      }))

      // STEP 3: Generate executive synthesis
      console.log('📊 Step 3/3: Generating executive synthesis...')
      const { data: synthesisData, error: synthesisError } = await supabase.functions.invoke('geo-executive-synthesis', {
        body: {
          organization_id: orgId,
          organization_name: orgNameToUse,
          industry: industry || undefined,  // Pass industry for context
          geo_results: transformedResults
        }
      })

      if (synthesisError) {
        console.warn('Synthesis error (non-blocking):', synthesisError)
      }

      console.log('✅ GEO Discovery Complete:', {
        total_signals: allSignals.length,
        queries_tested: queries.length,
        platforms_tested: 4
      })

      // Count mentions by platform (combine both batches)
      const claudeSignals = [
        ...(claudeBatch1.data?.signals || []),
        ...(claudeBatch2.data?.signals || [])
      ]
      const geminiSignals = [
        ...(geminiBatch1.data?.signals || []),
        ...(geminiBatch2.data?.signals || [])
      ]
      const perplexitySignals = [
        ...(perplexityBatch1.data?.signals || []),
        ...(perplexityBatch2.data?.signals || [])
      ]
      const chatgptSignals = [
        ...(chatgptBatch1.data?.signals || []),
        ...(chatgptBatch2.data?.signals || [])
      ]

      // Format results for display
      const geoData = {
        success: true,
        summary: {
          total_queries: queries.length,
          total_signals: allSignals.length,
          claude_mentions: claudeSignals.filter((s: any) => s.type === 'ai_visibility').length,
          gemini_mentions: geminiSignals.filter((s: any) => s.type === 'ai_visibility').length,
          perplexity_mentions: perplexitySignals.filter((s: any) => s.type === 'ai_visibility').length,
          chatgpt_mentions: chatgptSignals.filter((s: any) => s.type === 'ai_visibility').length
        },
        synthesis: synthesisData?.synthesis || null
      }

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

      // Simulated progress updates (estimated timings)
      const progressSteps = [
        { stage: 'schemaDiscovery', delay: 2000, message: 'Checking for existing schema...' },
        { stage: 'websiteScraping', delay: 5000, message: 'Scraping website content...' },
        { stage: 'entityExtraction', delay: 8000, message: 'Extracting entities with AI...' },
        { stage: 'entityEnrichment', delay: 10000, message: 'Enriching and validating entities...' },
        { stage: 'schemaSynthesis', delay: 12000, message: 'Synthesizing schema.org graph...' },
        { stage: 'schemaEnhancement', delay: 15000, message: 'Generating FAQs and optimizations...' }
      ]

      // Start progress animation
      progressSteps.forEach(({ stage, delay, message }) => {
        setTimeout(() => {
          setSchemaProgress(prev => ({
            ...prev,
            [stage]: 'processing',
            message
          }))
        }, delay)
      })

      // Frontend-orchestrated pipeline (individual Edge Function calls)
      // This avoids Edge Function timeout issues by running each stage from the frontend

      // Step 1: Scrape website
      setSchemaProgress(prev => ({ ...prev, websiteScraping: 'processing', message: 'Scraping website content...' }))
      const scrapeResponse = await fetch(`${SUPABASE_URL}/functions/v1/website-entity-scraper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: orgId,
          organization_name: orgNameToUse,
          website_url: website
        })
      })

      if (!scrapeResponse.ok) {
        throw new Error(`Website scraping failed: ${await scrapeResponse.text()}`)
      }

      const scrapeData = await scrapeResponse.json()
      console.log(`✅ Scraped ${scrapeData.summary?.total_pages || 0} pages`)
      setSchemaProgress(prev => ({ ...prev, websiteScraping: 'completed' }))

      // Step 2: Extract entities
      setSchemaProgress(prev => ({ ...prev, entityExtraction: 'processing', message: 'Extracting entities with AI...' }))
      const extractResponse = await fetch(`${SUPABASE_URL}/functions/v1/entity-extractor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: orgId,
          organization_name: orgNameToUse,
          scraped_pages: scrapeData.pages || []
        })
      })

      if (!extractResponse.ok) {
        throw new Error(`Entity extraction failed: ${await extractResponse.text()}`)
      }

      const extractData = await extractResponse.json()
      console.log(`✅ Extracted ${extractData.summary?.total_entities || 0} entities`)
      setSchemaProgress(prev => ({ ...prev, entityExtraction: 'completed' }))

      // Step 3: Enrich entities
      setSchemaProgress(prev => ({ ...prev, entityEnrichment: 'processing', message: 'Enriching and validating entities...' }))
      const enrichResponse = await fetch(`${SUPABASE_URL}/functions/v1/entity-enricher`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: orgId,
          organization_name: orgNameToUse,
          entities: extractData.entities || {}
        })
      })

      if (!enrichResponse.ok) {
        throw new Error(`Entity enrichment failed: ${await enrichResponse.text()}`)
      }

      const enrichData = await enrichResponse.json()
      console.log(`✅ Enriched ${enrichData.summary?.total_entities || 0} entities`)
      setSchemaProgress(prev => ({ ...prev, entityEnrichment: 'completed' }))

      // Step 4: Generate base schema
      setSchemaProgress(prev => ({ ...prev, schemaSynthesis: 'processing', message: 'Synthesizing schema.org graph...' }))
      const schemaResponse = await fetch(`${SUPABASE_URL}/functions/v1/schema-graph-generator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: orgId,
          organization_name: orgNameToUse,
          industry: discovered?.industry || industry,
          url: website,
          entities: enrichData.enriched_entities || {},
          coverage: []
        })
      })

      if (!schemaResponse.ok) {
        throw new Error(`Schema generation failed: ${await schemaResponse.text()}`)
      }

      const schemaData = await schemaResponse.json()
      console.log('✅ Base schema generated')
      setSchemaProgress(prev => ({ ...prev, schemaSynthesis: 'completed' }))

      // Step 5: Enhance schema with FAQs and optimizations
      setSchemaProgress(prev => ({ ...prev, schemaEnhancement: 'processing', message: 'Generating FAQs and optimizations...' }))
      const enhancerResponse = await fetch(`${SUPABASE_URL}/functions/v1/geo-schema-enhancer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: orgId,
          organization_name: orgNameToUse,
          industry: discovered?.industry || industry,
          base_schema: schemaData.schema_graph,
          coverage_articles: [],
          entities: enrichData.enriched_entities || {}
        })
      })

      let finalSchema = schemaData.schema_graph // Default to base schema
      let faqCount = 0
      let awardCount = 0

      if (!enhancerResponse.ok) {
        console.warn('Schema enhancement failed (non-critical):', await enhancerResponse.text())
        setSchemaProgress(prev => ({ ...prev, schemaEnhancement: 'failed' }))
      } else {
        const enhancerData = await enhancerResponse.json()
        console.log('✅ Schema enhanced:', {
          faqs: enhancerData.summary?.faq_questions_added || 0,
          awards: enhancerData.enhancements_applied?.awards_count || 0,
          keywords: enhancerData.enhancements_applied?.keywords_count || 0
        })

        faqCount = enhancerData.summary?.faq_questions_added || 0
        awardCount = enhancerData.enhancements_applied?.awards_count || 0

        // Use enhanced schema if available
        if (enhancerData.enhanced_schema) {
          finalSchema = enhancerData.enhanced_schema
        }
        setSchemaProgress(prev => ({ ...prev, schemaEnhancement: 'completed' }))
      }

      // Step 6: Keep schema in local state (don't save yet - let user add enhancements)
      console.log('✅ Schema generated successfully - ready for optional enhancements')
      setGeneratedSchemaData(finalSchema)

      // Mark completion
      const entitiesExtracted = enrichData.summary?.total_entities || 0
      const hasData = entitiesExtracted > 0

      setSchemaProgress({
        schemaDiscovery: 'completed',
        geoDiscovery: geoResults ? 'completed' : 'skipped',
        websiteScraping: 'completed',
        entityExtraction: 'completed',
        entityEnrichment: 'completed',
        schemaSynthesis: 'completed',
        schemaEnhancement: enhancerResponse.ok ? 'completed' : 'failed',
        message: hasData
          ? `Schema generated with ${entitiesExtracted} entities, ${faqCount} FAQs, ${awardCount} awards!`
          : 'Schema generated but no entities extracted - website may need manual review'
      })

      if (!hasData) {
        console.warn('⚠️ Schema generated but no entities extracted')
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

  const saveSchemaToMemoryVault = async (schemaToSave: any) => {
    if (!createdOrganization?.id) {
      throw new Error('No organization ID available')
    }

    const orgId = createdOrganization.id
    const orgNameToUse = createdOrganization.name || orgName

    console.log('💾 Saving schema to Memory Vault...')
    const saveResponse = await fetch('/api/content-library/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: {
          type: 'schema',
          title: `${orgNameToUse} - Complete Schema`,
          content: schemaToSave,
          organization_id: orgId,
          metadata: {
            organizationId: orgId,
            organizationName: orgNameToUse,
            url: website,
            industry: industry,
            generatedAt: new Date().toISOString(),
            source: 'onboarding_pipeline'
          }
        },
        metadata: {
          organizationId: orgId,
          title: `${orgNameToUse} - Complete Schema`
        },
        folder: 'Schemas/Active/'
      })
    })

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text()
      throw new Error(`Failed to save schema: ${errorText}`)
    }

    const saveData = await saveResponse.json()
    console.log('✅ Schema saved to Memory Vault:', saveData)
    setSchemaSaved(true) // Mark as saved

    // Auto-generate company profile from schema
    console.log('📋 Auto-generating company profile from schema...')
    try {
      const profileResponse = await fetch(`/api/organizations/generate-profile?id=${orgId}`, {
        method: 'POST'
      })

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        console.log('✅ Company profile auto-generated:', profileData.profile)

        // Save the generated profile
        await fetch(`/api/organizations/profile?id=${orgId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_profile: profileData.profile })
        })
        console.log('✅ Company profile saved to organization')
      } else {
        console.warn('⚠️ Failed to auto-generate profile:', await profileResponse.text())
      }
    } catch (err) {
      console.error('❌ Profile auto-generation error:', err)
      // Don't fail if profile generation fails
    }

    return saveData
  }

  const handleSchemaEnhancement = async () => {
    if (!generatedSchemaData || !createdOrganization?.id) {
      console.error('❌ No schema data available for enhancement')
      return
    }

    // Check if any enhancements were provided
    const hasEnhancements =
      awardsMedia.length > 0 ||
      socialProfiles.linkedin ||
      socialProfiles.twitter ||
      socialProfiles.facebook ||
      socialProfiles.instagram ||
      testimonials.trim() ||
      productsPage.trim()

    if (!hasEnhancements) {
      alert('Please provide at least one enhancement before regenerating.')
      return
    }

    setEnhancementLoading(true)

    try {
      console.log('🎯 Enhancing schema with user-provided data...')

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
      const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const response = await fetch(`${SUPABASE_URL}/functions/v1/schema-enhancement-regenerator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          organization_id: createdOrganization.id,
          current_schema: generatedSchemaData,
          enhancements: {
            awards_media: awardsMedia.length > 0 ? awardsMedia : undefined,
            social_profiles: {
              linkedin: socialProfiles.linkedin || undefined,
              twitter: socialProfiles.twitter || undefined,
              facebook: socialProfiles.facebook || undefined,
              instagram: socialProfiles.instagram || undefined
            },
            testimonials: testimonials.trim() || undefined,
            products_page: productsPage.trim() || undefined
          }
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Enhancement failed')
      }

      console.log('✅ Schema enhanced successfully:', data.enhancements_applied)

      // Update the displayed schema
      setGeneratedSchemaData(data.enhanced_schema)

      // Save the enhanced schema to Memory Vault
      await saveSchemaToMemoryVault(data.enhanced_schema)

      // Show success message
      const stats = data.enhancements_applied
      const messages = []
      if (stats.awards_added > 0) messages.push(`${stats.awards_added} awards`)
      if (stats.social_profiles_added > 0) messages.push(`${stats.social_profiles_added} social profiles`)
      if (stats.reviews_added > 0) messages.push(`${stats.reviews_added} testimonials`)
      if (stats.products_with_pricing > 0) messages.push(`${stats.products_with_pricing} products with pricing`)

      alert(`✅ Schema enhanced successfully!\n\nAdded:\n- ${messages.join('\n- ')}`)

    } catch (error: any) {
      console.error('❌ Enhancement error:', error)
      alert(`Failed to enhance schema: ${error.message || 'Unknown error'}`)
    } finally {
      setEnhancementLoading(false)
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
      schemaSynthesis: 'pending',
      schemaEnhancement: 'pending',
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
                    About / Capabilities Page URL *
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="url"
                      value={aboutPage}
                      onChange={(e) => setAboutPage(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                      placeholder="https://example.com/about"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Link to your About, Capabilities, or Services page for better strategic context discovery
                  </p>
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
                    {discovered.competitors.map((competitor) => {
                      const name = typeof competitor === 'string' ? competitor : competitor.name
                      const context = typeof competitor === 'object' ? competitor.monitoring_context : null

                      return (
                        <button
                          key={name}
                          onClick={() => toggleCompetitor(name)}
                          className={`px-4 py-3 rounded-lg border transition-all text-left ${
                            selectedCompetitors.has(name)
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                              : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <span className="text-sm font-medium block mb-1">{name}</span>
                              {context && (
                                <span className="text-xs text-gray-400 block leading-relaxed">
                                  {context}
                                </span>
                              )}
                            </div>
                            {selectedCompetitors.has(name) && (
                              <Check className="w-4 h-4 text-cyan-400 ml-2 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      )
                    })}
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
                    Review stakeholders carefully. Only select those that are strategically relevant to your organization's narrative and reputation.
                  </p>

                  {/* Combine all stakeholder types from discovery */}
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    {[
                      ...(discovered.stakeholders?.key_analysts || []),
                      ...(discovered.stakeholders?.activists || []),
                      ...(discovered.stakeholders?.regulators || []),
                      ...(discovered.stakeholders?.influencers || []),
                      ...(discovered.stakeholders?.major_customers || []),
                      ...(discovered.stakeholders?.major_investors || []),
                      ...(discovered.stakeholders?.key_partners || [])
                    ].map((stakeholder) => {
                      const name = typeof stakeholder === 'string' ? stakeholder : stakeholder.name
                      const context = typeof stakeholder === 'object' ? stakeholder.monitoring_context : null

                      return (
                        <button
                          key={name}
                          onClick={() => toggleStakeholder(name)}
                          className={`px-4 py-3 rounded-lg border transition-all text-left ${
                            selectedStakeholders.has(name)
                              ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                              : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <span className="text-sm font-medium block mb-1">{name}</span>
                              {context && (
                                <span className="text-xs text-gray-400 block leading-relaxed">
                                  {context}
                                </span>
                              )}
                            </div>
                            {selectedStakeholders.has(name) && (
                              <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                            )}
                          </div>
                        </button>
                      )
                    })}
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

                {/* Strategic Context Section */}
                <div className="mt-8 pt-8 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Strategic Context
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Review and refine how we understand your organization. This helps generate more relevant opportunities.
                  </p>

                  <div className="space-y-4">
                    {/* Target Customers */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Target Customers
                      </label>
                      <input
                        type="text"
                        value={targetCustomers}
                        onChange={(e) => setTargetCustomers(e.target.value)}
                        placeholder="e.g., Marketing teams at Fortune 500 companies"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Who does your organization primarily serve?</p>
                    </div>

                    {/* Brand Personality */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Brand Personality
                      </label>
                      <input
                        type="text"
                        value={brandPersonality}
                        onChange={(e) => setBrandPersonality(e.target.value)}
                        placeholder="e.g., Data-driven and practical"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">What's your brand's tone and style?</p>
                    </div>

                    {/* Strategic Priorities */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Strategic Priorities
                      </label>
                      {strategicPriorities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {strategicPriorities.map((priority, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm text-blue-300"
                            >
                              <span>{priority}</span>
                              <button
                                onClick={() => setStrategicPriorities(strategicPriorities.filter((_, i) => i !== index))}
                                className="hover:text-blue-100"
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
                          value={newPriority}
                          onChange={(e) => setNewPriority(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newPriority.trim()) {
                              setStrategicPriorities([...strategicPriorities, newPriority.trim()])
                              setNewPriority('')
                            }
                          }}
                          placeholder="e.g., AI-powered analytics"
                          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => {
                            if (newPriority.trim()) {
                              setStrategicPriorities([...strategicPriorities, newPriority.trim()])
                              setNewPriority('')
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Current focus areas or strategic initiatives</p>
                    </div>
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
                      {/* AI Platform Visibility */}
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

                      {/* Competitive Intelligence */}
                      {geoResults.synthesis?.competitive_analysis && (
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                          <p className="text-sm font-medium text-purple-300 mb-2">🎯 Competitive Intelligence</p>
                          <p className="text-xs text-purple-200/80 mb-3">
                            {geoResults.synthesis.competitive_analysis.who_is_winning}
                          </p>
                          {geoResults.synthesis.competitive_analysis.success_patterns && (
                            <p className="text-xs text-purple-200/60">
                              <span className="font-medium">Success Patterns:</span> {geoResults.synthesis.competitive_analysis.success_patterns}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Source Strategy */}
                      {geoResults.synthesis?.source_strategy?.priority_publications && geoResults.synthesis.source_strategy.priority_publications.length > 0 && (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <p className="text-sm font-medium text-blue-300 mb-2">📚 Target Publications</p>
                          <p className="text-xs text-blue-200/80 mb-2">AI platforms cite these sources most frequently:</p>
                          <ul className="space-y-1">
                            {geoResults.synthesis.source_strategy.priority_publications.slice(0, 5).map((pub: string, idx: number) => (
                              <li key={idx} className="text-xs text-blue-200/70 flex items-start gap-2">
                                <span className="text-blue-400">•</span>
                                <span>{pub}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Schema Recommendations Preview */}
                      {geoResults.synthesis?.schema_recommendations && geoResults.synthesis.schema_recommendations.length > 0 && (
                        <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                          <p className="text-sm font-medium text-cyan-300 mb-2">🔧 Key Schema Recommendations</p>
                          <ul className="space-y-2">
                            {geoResults.synthesis.schema_recommendations.slice(0, 3).map((rec: any, idx: number) => (
                              <li key={idx} className="text-xs text-cyan-200/80">
                                <span className="font-medium text-cyan-300">{rec.title}:</span> {rec.reasoning?.substring(0, 100)}...
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

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
                    Running our 7-stage GEO-optimized pipeline to create the best possible schema for AI visibility.
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

                    {/* Stage 4: Schema Synthesis */}
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
                        <p className="text-xs text-gray-400">Building basic schema.org graph</p>
                      </div>
                    </div>

                    {/* Stage 6: GEO Enhancement */}
                    <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        schemaProgress.schemaEnhancement === 'completed' ? 'bg-green-500/20' :
                        schemaProgress.schemaEnhancement === 'processing' ? 'bg-cyan-500/20' :
                        schemaProgress.schemaEnhancement === 'failed' ? 'bg-red-500/20' :
                        'bg-gray-700'
                      }`}>
                        {schemaProgress.schemaEnhancement === 'completed' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : schemaProgress.schemaEnhancement === 'processing' ? (
                          <Loader className="w-4 h-4 text-cyan-400 animate-spin" />
                        ) : schemaProgress.schemaEnhancement === 'failed' ? (
                          <X className="w-4 h-4 text-red-400" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">GEO Enhancement</p>
                        <p className="text-xs text-gray-400">Adding FAQs, awards, compelling descriptions</p>
                      </div>
                    </div>
                  </div>

                  {schemaProgress.message && (
                    <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                      <p className="text-sm text-cyan-300">{schemaProgress.message}</p>
                    </div>
                  )}

                  {/* Show existing schema detection results */}
                  {existingSchemaData && schemaProgress.schemaDiscovery === 'completed' && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <p className="text-sm font-medium text-blue-300">
                          {existingSchemaData.has_existing_schema
                            ? '✓ Existing Schema Detected'
                            : '○ No Existing Schema Found'}
                        </p>
                      </div>
                      <p className="text-xs text-blue-400/70">
                        {existingSchemaData.has_existing_schema
                          ? `Your website already has a schema (version ${existingSchemaData.schema_version}). We'll enhance it with GEO optimizations.`
                          : 'Creating a brand new GEO-optimized schema.org markup from scratch.'}
                      </p>
                    </div>
                  )}

                  {/* Show generated schema preview */}
                  {generatedSchemaData && schemaProgress.schemaSynthesis === 'completed' && (
                    <div className="mt-4 space-y-3">
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Check className="w-4 h-4 text-green-400" />
                          <p className="text-sm font-medium text-green-300">
                            ✓ Schema Generated Successfully
                          </p>
                        </div>
                        <p className="text-xs text-green-400/70 mb-3">
                          Your GEO-optimized schema.org markup is ready for deployment
                        </p>

                        {/* Schema preview */}
                        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                          <p className="text-xs text-gray-400 mb-2 font-mono">Schema Preview:</p>
                          <div className="max-h-40 overflow-y-auto">
                            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                              {JSON.stringify(
                                JSON.parse(generatedSchemaData.content || '{}'),
                                null,
                                2
                              ).substring(0, 500)}...
                            </pre>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                          Full schema saved to Content Library → Schemas/Active/
                        </p>
                      </div>

                      {/* Optional Enhancements Section */}
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-medium text-blue-300">🎯 Enhance Your Schema (Optional)</p>
                            <p className="text-xs text-blue-400/70 mt-1">
                              Add more details to make your schema even more powerful
                            </p>
                          </div>
                          <button
                            onClick={() => setShowEnhancements(!showEnhancements)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            {showEnhancements ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </button>
                        </div>

                        {showEnhancements && (
                          <div className="space-y-4 mt-4">
                            {/* Awards/Media */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                📰 Awards/Media Highlights
                              </label>

                              {/* Display added awards */}
                              {awardsMedia.length > 0 && (
                                <div className="space-y-2 mb-3">
                                  {awardsMedia.map((award, index) => (
                                    <div key={index} className="flex items-start gap-2 p-2 bg-gray-800/50 rounded border border-gray-700">
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm text-white truncate">{award.description}</div>
                                        <a href={award.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 truncate block">
                                          {award.url}
                                        </a>
                                      </div>
                                      <button
                                        onClick={() => setAwardsMedia(awardsMedia.filter((_, i) => i !== index))}
                                        className="text-red-400 hover:text-red-300 flex-shrink-0"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add new award form */}
                              <div className="space-y-2">
                                <input
                                  type="url"
                                  value={currentAwardUrl}
                                  onChange={(e) => setCurrentAwardUrl(e.target.value)}
                                  placeholder="Award/Media URL (e.g., link to article or award page)"
                                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                                />
                                <input
                                  type="text"
                                  value={currentAwardDescription}
                                  onChange={(e) => setCurrentAwardDescription(e.target.value)}
                                  placeholder="Headline/Description (e.g., 'Best SaaS Product 2024 - TechCrunch')"
                                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                                />
                                <button
                                  onClick={() => {
                                    if (currentAwardUrl.trim() && currentAwardDescription.trim()) {
                                      setAwardsMedia([...awardsMedia, {
                                        url: currentAwardUrl.trim(),
                                        description: currentAwardDescription.trim()
                                      }])
                                      setCurrentAwardUrl('')
                                      setCurrentAwardDescription('')
                                    }
                                  }}
                                  disabled={!currentAwardUrl.trim() || !currentAwardDescription.trim()}
                                  className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 disabled:bg-gray-800 disabled:text-gray-600 text-blue-400 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Award/Media Mention
                                </button>
                              </div>
                            </div>

                            {/* Social Media */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                🔗 Social Media Profiles
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="url"
                                  value={socialProfiles.linkedin}
                                  onChange={(e) => setSocialProfiles({...socialProfiles, linkedin: e.target.value})}
                                  placeholder="LinkedIn URL"
                                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                                />
                                <input
                                  type="url"
                                  value={socialProfiles.twitter}
                                  onChange={(e) => setSocialProfiles({...socialProfiles, twitter: e.target.value})}
                                  placeholder="Twitter/X URL"
                                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                                />
                                <input
                                  type="url"
                                  value={socialProfiles.facebook}
                                  onChange={(e) => setSocialProfiles({...socialProfiles, facebook: e.target.value})}
                                  placeholder="Facebook URL"
                                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                                />
                                <input
                                  type="url"
                                  value={socialProfiles.instagram}
                                  onChange={(e) => setSocialProfiles({...socialProfiles, instagram: e.target.value})}
                                  placeholder="Instagram URL"
                                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                                />
                              </div>
                            </div>

                            {/* Testimonials */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                💬 Customer Testimonials
                              </label>
                              <textarea
                                value={testimonials}
                                onChange={(e) => setTestimonials(e.target.value)}
                                placeholder="Paste customer testimonials or review URLs (one per line)"
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                                rows={3}
                              />
                            </div>

                            {/* Products/Pricing Page */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                🛍️ Products/Pricing Page URL
                              </label>
                              <input
                                type="url"
                                value={productsPage}
                                onChange={(e) => setProductsPage(e.target.value)}
                                placeholder="https://example.com/products or /pricing"
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                              />
                              <p className="text-xs text-gray-500 mt-1">We'll extract product details and pricing if available</p>
                            </div>

                            <button
                              onClick={handleSchemaEnhancement}
                              disabled={enhancementLoading}
                              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                              {enhancementLoading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Enhancing Schema...
                                </>
                              ) : (
                                'Regenerate with Enhancements'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Show buttons if generation hasn't started or failed */}
                  <div className="mt-6 flex gap-3">
                    {!schemaGenerationStarted && (
                      <>
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
                          Skip Schema Generation
                        </button>
                      </>
                    )}

                    {/* Show completion button when schema generation completes successfully */}
                    {schemaProgress.schemaSynthesis === 'completed' && (
                      <button
                        onClick={async () => {
                          if (createdOrganization) {
                            // Save schema if it exists and hasn't been saved yet
                            if (generatedSchemaData && !schemaSaved) {
                              try {
                                console.log('💾 Saving schema before completing onboarding...')
                                await saveSchemaToMemoryVault(generatedSchemaData)
                              } catch (error) {
                                console.error('Failed to save schema:', error)
                                alert('Failed to save schema. Please try again or contact support.')
                                return
                              }
                            } else if (schemaSaved) {
                              console.log('✅ Schema already saved, skipping duplicate save')
                            }

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
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
                      >
                        <Check className="w-5 h-5" />
                        Complete Onboarding
                      </button>
                    )}

                    {/* Show "Continue Anyway" button if failed */}
                    {schemaProgress.schemaSynthesis === 'failed' && (
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
                        Continue Anyway
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
                disabled={loading || (step === 1 && (!orgName || !website || !aboutPage))}
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
