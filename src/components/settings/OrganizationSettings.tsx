'use client'

import React, { useState, useEffect } from 'react'
import { X as CloseIcon, Building2, Target, Globe, Loader, Save, AlertCircle, RefreshCw, CheckCircle, FileText, Copy, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import TargetManagementTab from './TargetManagementTab'
import GeoTargetsTab from './GeoTargetsTab'
import CompanyProfileTab from './CompanyProfileTab'

interface OrganizationSettingsProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  organizationName: string
  onUpdate?: () => void
}

type TabId = 'about' | 'profile' | 'intelligence' | 'geo'

export default function OrganizationSettings({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  onUpdate
}: OrganizationSettingsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('about')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // About tab form state
  const [orgData, setOrgData] = useState({
    name: '',
    domain: '',  // Using "domain" as the field name but will map to url
    industry: '',
    size: ''
  })

  // Schema extraction state
  const [schemaExtracting, setSchemaExtracting] = useState(false)
  const [schemaData, setSchemaData] = useState<any>(null)
  const [schemaLoading, setSchemaLoading] = useState(false)
  const [showSchemaViewer, setShowSchemaViewer] = useState(false)

  // Load organization data
  useEffect(() => {
    if (isOpen && organizationId) {
      loadOrganizationData()
      loadSchema()
    }
  }, [isOpen, organizationId])

  const loadOrganizationData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/organizations?id=${organizationId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load organization data')
      }

      if (data.organization) {
        setOrgData({
          name: data.organization.name || '',
          domain: data.organization.url || '',  // Map url to domain field
          industry: data.organization.industry || '',
          size: data.organization.size || ''
        })
      }
    } catch (err: any) {
      console.error('Failed to load organization data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveOrganizationData = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/organizations/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: organizationId,
          ...orgData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update organization')
      }

      setSuccess('Organization updated successfully')

      // Update global organization state with new data (use set directly to bypass ID check)
      const { useAppStore } = await import('@/stores/useAppStore')
      const currentOrg = useAppStore.getState().organization

      if (currentOrg?.id === organizationId && data.organization) {
        // Use set() directly to update without triggering setOrganization's ID check
        const updatedOrg = {
          ...currentOrg,
          name: data.organization.name,
          url: data.organization.url,
          domain: data.organization.url,
          industry: data.organization.industry,
          size: data.organization.size
        }

        useAppStore.setState({
          organization: updatedOrg
        })

        console.log('✅ Updated global organization state:', updatedOrg)

        // Also update localStorage directly to persist immediately
        const stored = localStorage.getItem('signaldesk-v3-storage')
        if (stored) {
          const parsedStore = JSON.parse(stored)
          parsedStore.state.organization = updatedOrg
          localStorage.setItem('signaldesk-v3-storage', JSON.stringify(parsedStore))
          console.log('✅ Updated localStorage with new organization data')
        }
      }

      // Call onUpdate callback to refresh parent state
      if (onUpdate) {
        onUpdate()
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Failed to update organization:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const loadSchema = async () => {
    try {
      setSchemaLoading(true)
      const response = await fetch(`/api/schema/extract?organization_id=${organizationId}`)
      const data = await response.json()

      if (response.ok) {
        setSchemaData(data)
      }
    } catch (err) {
      console.error('Failed to load schema:', err)
    } finally {
      setSchemaLoading(false)
    }
  }

  const extractSchema = async () => {
    setSchemaExtracting(true)
    setError(null)
    setSuccess(null)

    try {
      if (!orgData.domain) {
        setError('Please enter a website URL first')
        setSchemaExtracting(false)
        return
      }

      console.log('🎯 Generating schema via direct pipeline calls...')

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
      const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      // Step 1: Scrape website
      console.log('🌐 Step 1: Scraping website...')
      const scrapeResponse = await fetch(`${SUPABASE_URL}/functions/v1/website-entity-scraper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: organizationId,
          organization_name: orgData.name,
          website_url: orgData.domain
        })
      })

      if (!scrapeResponse.ok) {
        throw new Error(`Website scraping failed: ${await scrapeResponse.text()}`)
      }

      const scrapeData = await scrapeResponse.json()
      console.log(`✅ Scraped ${scrapeData.summary?.total_pages || 0} pages`)

      // Step 2: Extract entities
      console.log('🔍 Step 2: Extracting entities...')
      const extractResponse = await fetch(`${SUPABASE_URL}/functions/v1/entity-extractor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: organizationId,
          organization_name: orgData.name,
          scraped_pages: scrapeData.pages || []
        })
      })

      if (!extractResponse.ok) {
        throw new Error(`Entity extraction failed: ${await extractResponse.text()}`)
      }

      const extractData = await extractResponse.json()
      console.log(`✅ Extracted ${extractData.summary?.total_entities || 0} entities`)

      // Step 3: Enrich entities
      console.log('✨ Step 3: Enriching entities...')
      const enrichResponse = await fetch(`${SUPABASE_URL}/functions/v1/entity-enricher`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: organizationId,
          organization_name: orgData.name,
          entities: extractData.entities || {}
        })
      })

      if (!enrichResponse.ok) {
        throw new Error(`Entity enrichment failed: ${await enrichResponse.text()}`)
      }

      const enrichData = await enrichResponse.json()
      console.log(`✅ Enriched ${enrichData.summary?.total_entities || 0} entities`)

      // Step 4: Generate base schema
      console.log('📊 Step 4: Generating base schema...')
      const schemaResponse = await fetch(`${SUPABASE_URL}/functions/v1/schema-graph-generator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: organizationId,
          organization_name: orgData.name,
          industry: orgData.industry,
          url: orgData.domain,
          entities: enrichData.enriched_entities || {},
          coverage: []
        })
      })

      if (!schemaResponse.ok) {
        throw new Error(`Schema generation failed: ${await schemaResponse.text()}`)
      }

      const schemaData = await schemaResponse.json()
      console.log('✅ Base schema generated')

      // Step 5: Enhance schema with FAQs, awards, keywords
      // Claude will use its knowledge to add impressive context
      console.log('✨ Step 5: Enhancing schema with GEO optimizations...')
      const enhancerResponse = await fetch(`${SUPABASE_URL}/functions/v1/geo-schema-enhancer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: organizationId,
          organization_name: orgData.name,
          industry: orgData.industry,
          base_schema: schemaData.schema_graph,
          coverage_articles: [],
          entities: enrichData.enriched_entities || {}
        })
      })

      let finalSchema = schemaData.schema_graph // Default to base schema

      if (!enhancerResponse.ok) {
        console.warn('Schema enhancement failed (non-critical):', await enhancerResponse.text())
        // Continue with base schema
      } else {
        const enhancerData = await enhancerResponse.json()
        console.log('✅ Schema enhanced:', {
          faqs: enhancerData.summary?.faq_questions_added || 0,
          awards: enhancerData.enhancements_applied?.awards_count || 0,
          keywords: enhancerData.enhancements_applied?.keywords_count || 0
        })

        // Use enhanced schema if available
        if (enhancerData.enhanced_schema) {
          finalSchema = enhancerData.enhanced_schema
        }
      }

      // ALWAYS save the schema to Memory Vault (enhanced or base)
      console.log('💾 SCHEMA SAVE: Starting save to Memory Vault...')
      console.log('💾 SCHEMA SAVE: Organization ID:', organizationId)
      console.log('💾 SCHEMA SAVE: Schema size:', JSON.stringify(finalSchema).length, 'bytes')

      const savePayload = {
        content: {
          type: 'schema',
          title: `${orgData.name} - Complete Schema`,
          content: finalSchema,
          organization_id: organizationId,
          metadata: {
            organizationId,
            organizationName: orgData.name,
            url: orgData.domain,
            industry: orgData.industry,
            generatedAt: new Date().toISOString(),
            source: 'org_profile_extraction'
          }
        },
        metadata: {
          organizationId,
          title: `${orgData.name} - Complete Schema`
        },
        folder: 'Schemas/Active/'
      }

      console.log('💾 SCHEMA SAVE: Payload prepared, making API call...')

      const saveResponse = await fetch('/api/content-library/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(savePayload)
      })

      console.log('💾 SCHEMA SAVE: Response status:', saveResponse.status, saveResponse.statusText)

      if (saveResponse.ok) {
        const saveData = await saveResponse.json()
        console.log('✅ SCHEMA SAVE SUCCESS:', saveData)
        alert(`✅ Schema saved to Memory Vault! ID: ${saveData.id}`)
      } else {
        const errorText = await saveResponse.text()
        console.error('❌ SCHEMA SAVE FAILED:', errorText)
        alert(`❌ Failed to save schema: ${errorText}`)
        throw new Error(`Failed to save schema: ${errorText}`)
      }

      const result = schemaData
      console.log('✅ Complete schema generation finished')

      setSuccess(`Schema generated successfully!`)

      // Reload schema data
      await loadSchema()

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      console.error('Failed to generate schema:', err)
      setError(err.message || 'Failed to generate schema')
    } finally {
      setSchemaExtracting(false)
    }
  }

  const tabs = [
    { id: 'about' as TabId, name: 'About', icon: Building2 },
    { id: 'profile' as TabId, name: 'Company Profile', icon: Users },
    { id: 'intelligence' as TabId, name: 'Intelligence Targets', icon: Target },
    { id: 'geo' as TabId, name: 'GEO Targets', icon: Globe }
  ]

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Organization Settings</h2>
              <p className="text-sm text-gray-400">{organizationName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <CloseIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'about' && (
            <div className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-green-400 text-sm">{success}</p>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={orgData.name}
                      onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                      placeholder="Enter organization name..."
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Domain / Website URL
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={orgData.domain}
                      onChange={(e) => setOrgData({ ...orgData, domain: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required for GEO schema extraction and intelligence monitoring
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={orgData.industry}
                      onChange={(e) => setOrgData({ ...orgData, industry: e.target.value })}
                      placeholder="e.g. Technology, Healthcare, Finance..."
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Company Size
                    </label>
                    <select
                      value={orgData.size}
                      onChange={(e) => setOrgData({ ...orgData, size: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select size...</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1001-5000">1001-5000 employees</option>
                      <option value="5001+">5001+ employees</option>
                    </select>
                  </div>

                  {/* Schema.org Setup Section */}
                  <div className="pt-6 border-t border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-300">AI Presence Architecture</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Comprehensive schema.org optimization for maximum AI visibility
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {schemaData?.has_schema && (
                          <button
                            onClick={() => setShowSchemaViewer(!showSchemaViewer)}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                          >
                            <FileText className="w-4 h-4" />
                            {showSchemaViewer ? 'Hide' : 'View'} Schema
                          </button>
                        )}
                        <button
                          onClick={extractSchema}
                          disabled={schemaExtracting || !orgData.domain}
                          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${
                            schemaExtracting
                              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                              : schemaData?.has_schema
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {schemaExtracting ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              {schemaData?.has_schema ? 'Regenerate' : 'Generate Schema'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {schemaData?.has_schema && schemaData.schema && (
                      <div className="space-y-3">
                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-green-400 mb-1">Schema Package Active</p>
                              <p className="text-sm text-gray-300 mb-3">
                                Comprehensive AI-optimized schema with {schemaData.schema.intelligence?.fields?.length || 0} fields
                              </p>
                              <div className="grid grid-cols-3 gap-3 text-xs">
                                <div>
                                  <div className="text-gray-500 mb-1">Schema Type</div>
                                  <div className="text-white font-medium">{schemaData.schema.metadata?.schema_type || 'Organization'}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500 mb-1">Generated By</div>
                                  <div className="text-white font-medium">{schemaData.schema.metadata?.generated_by === 'geo-schema-optimizer' ? 'AI Optimizer' : 'Extracted'}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500 mb-1">Last Updated</div>
                                  <div className="text-white font-medium">
                                    {schemaData.schema.updated_at
                                      ? new Date(schemaData.schema.updated_at).toLocaleDateString()
                                      : 'N/A'
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {showSchemaViewer && (
                          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-medium text-gray-300">Schema Preview</h4>
                              <button
                                onClick={() => {
                                  const schemaContent = typeof schemaData.schema.content === 'string'
                                    ? schemaData.schema.content
                                    : JSON.stringify(schemaData.schema.content, null, 2)
                                  navigator.clipboard.writeText(schemaContent)
                                  setSuccess('Schema copied to clipboard!')
                                  setTimeout(() => setSuccess(null), 2000)
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                Copy JSON
                              </button>
                            </div>
                            <pre className="text-xs text-gray-400 overflow-x-auto max-h-96 overflow-y-auto">
                              {typeof schemaData.schema.content === 'string'
                                ? JSON.stringify(JSON.parse(schemaData.schema.content), null, 2)
                                : JSON.stringify(schemaData.schema.content, null, 2)
                              }
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {!schemaData?.has_schema && !schemaLoading && (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-300">
                          <p className="font-medium text-yellow-400 mb-1">No Schema Package</p>
                          <p>Click "Generate Schema" to create a comprehensive, AI-optimized schema package. Our system will analyze your industry and create strategic structured data that 70% of companies don't have.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveOrganizationData}
                      disabled={saving || !orgData.name || !orgData.domain}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <CompanyProfileTab
              organizationId={organizationId}
              organizationName={organizationName}
            />
          )}

          {activeTab === 'intelligence' && (
            <TargetManagementTab
              organizationId={organizationId}
              organizationName={organizationName}
            />
          )}

          {activeTab === 'geo' && (
            <GeoTargetsTab
              organizationId={organizationId}
              organizationName={organizationName}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
