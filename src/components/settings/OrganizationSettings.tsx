'use client'

import React, { useState, useEffect } from 'react'
import { X as CloseIcon, Building2, Target, Globe, Loader2, Save, AlertCircle, RefreshCw, CheckCircle, FileText, Copy, Users, Mic2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import TargetManagementTab from './TargetManagementTab'
import GeoTargetsTab from './GeoTargetsTab'
import CompanyProfileTab from './CompanyProfileTab'
import BrandVoiceTab from './BrandVoiceTab'

interface OrganizationSettingsProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  organizationName: string
  onUpdate?: () => void
}

type TabId = 'about' | 'profile' | 'voice' | 'intelligence' | 'geo'

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

      const payload = {
        id: organizationId,
        ...orgData
      }
      console.log('Sending to API:', payload)

      const response = await fetch('/api/organizations/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

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

        console.log('Updated global organization state:', updatedOrg)

        // Also update localStorage directly to persist immediately
        const stored = localStorage.getItem('signaldesk-v3-storage')
        if (stored) {
          const parsedStore = JSON.parse(stored)
          parsedStore.state.organization = updatedOrg
          localStorage.setItem('signaldesk-v3-storage', JSON.stringify(parsedStore))
          console.log('Updated localStorage with new organization data')
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

      console.log('Generating schema via API route...')

      // Call our API route which proxies the Edge Functions (avoids CORS issues)
      const response = await fetch(`/api/organizations/generate-schema?id=${organizationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_name: orgData.name,
          website: orgData.domain
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate schema')
      }

      const data = await response.json()
      console.log('Schema generated successfully:', data)

      setSuccess('Schema generated and saved successfully!')

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
    { id: 'voice' as TabId, name: 'Brand Voice', icon: Mic2 },
    { id: 'intelligence' as TabId, name: 'Intelligence Targets', icon: Target },
    { id: 'geo' as TabId, name: 'GEO Targets', icon: Globe }
  ]

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--charcoal)] border border-[var(--grey-800)] rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--grey-800)]">
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--burnt-orange)' }}
            >
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div
                className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--burnt-orange)] mb-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Settings
              </div>
              <h2
                className="text-[1.25rem] font-normal text-white"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {organizationName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--grey-800)] rounded-lg transition-colors"
          >
            <CloseIcon className="w-5 h-5 text-[var(--grey-400)]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--grey-800)] px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-[0.85rem] font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-[var(--burnt-orange)]'
                    : 'text-[var(--grey-500)] hover:text-[var(--grey-300)]'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeOrgTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: 'var(--burnt-orange)' }}
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
                <div
                  className="mb-4 p-4 rounded-lg flex items-start gap-3"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div
                  className="mb-4 p-4 rounded-lg flex items-start gap-3"
                  style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}
                >
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--burnt-orange)' }} />
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}
                    >
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={orgData.name}
                      onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                      placeholder="Enter organization name..."
                      className="w-full px-4 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
                      style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-700)' }}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}
                    >
                      Domain / Website URL
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={orgData.domain}
                      onChange={(e) => setOrgData({ ...orgData, domain: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
                      style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-700)' }}
                    />
                    <p className="text-xs mt-1.5" style={{ color: 'var(--grey-500)' }}>
                      Required for GEO schema extraction and intelligence monitoring
                    </p>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}
                    >
                      Industry
                    </label>
                    <input
                      type="text"
                      value={orgData.industry}
                      onChange={(e) => setOrgData({ ...orgData, industry: e.target.value })}
                      placeholder="e.g. Technology, Healthcare, Finance..."
                      className="w-full px-4 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
                      style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-700)' }}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}
                    >
                      Company Size
                    </label>
                    <select
                      value={orgData.size}
                      onChange={(e) => setOrgData({ ...orgData, size: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
                      style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-700)' }}
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
                  <div className="pt-6 border-t border-[var(--grey-800)]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3
                          className="text-sm font-medium text-white"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          AI Presence Architecture
                        </h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--grey-500)' }}>
                          Comprehensive schema.org optimization for maximum AI visibility
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {schemaData?.has_schema && (
                          <button
                            onClick={() => setShowSchemaViewer(!showSchemaViewer)}
                            className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                            style={{
                              background: 'var(--grey-800)',
                              color: 'var(--grey-300)',
                              fontFamily: 'var(--font-display)'
                            }}
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
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                          style={{
                            background: schemaData?.has_schema ? 'var(--burnt-orange-muted)' : 'var(--burnt-orange)',
                            color: schemaData?.has_schema ? 'var(--burnt-orange)' : 'white',
                            border: schemaData?.has_schema ? '1px solid var(--burnt-orange)' : 'none',
                            fontFamily: 'var(--font-display)'
                          }}
                        >
                          {schemaExtracting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
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
                        <div
                          className="p-4 rounded-lg"
                          style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}
                        >
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-green-400 mb-1">Schema Package Active</p>
                              <p className="text-sm mb-3" style={{ color: 'var(--grey-300)' }}>
                                Comprehensive AI-optimized schema with {schemaData.schema.intelligence?.fields?.length || 0} fields
                              </p>
                              <div className="grid grid-cols-3 gap-3 text-xs">
                                <div>
                                  <div style={{ color: 'var(--grey-500)' }} className="mb-1">Schema Type</div>
                                  <div className="text-white font-medium">{schemaData.schema.metadata?.schema_type || 'Organization'}</div>
                                </div>
                                <div>
                                  <div style={{ color: 'var(--grey-500)' }} className="mb-1">Generated By</div>
                                  <div className="text-white font-medium">{schemaData.schema.metadata?.generated_by === 'geo-schema-optimizer' ? 'AI Optimizer' : 'Extracted'}</div>
                                </div>
                                <div>
                                  <div style={{ color: 'var(--grey-500)' }} className="mb-1">Last Updated</div>
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
                          <div
                            className="p-4 rounded-lg"
                            style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-700)' }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4
                                className="text-sm font-medium"
                                style={{ color: 'var(--grey-300)', fontFamily: 'var(--font-display)' }}
                              >
                                Schema Preview
                              </h4>
                              <button
                                onClick={() => {
                                  const schemaContent = typeof schemaData.schema.content === 'string'
                                    ? schemaData.schema.content
                                    : JSON.stringify(schemaData.schema.content, null, 2)
                                  navigator.clipboard.writeText(schemaContent)
                                  setSuccess('Schema copied to clipboard!')
                                  setTimeout(() => setSuccess(null), 2000)
                                }}
                                className="text-xs flex items-center gap-1"
                                style={{ color: 'var(--burnt-orange)' }}
                              >
                                <Copy className="w-3 h-3" />
                                Copy JSON
                              </button>
                            </div>
                            <pre
                              className="text-xs overflow-x-auto max-h-96 overflow-y-auto"
                              style={{ color: 'var(--grey-400)' }}
                            >
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
                      <div
                        className="p-4 rounded-lg flex items-start gap-3"
                        style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }}
                      >
                        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm" style={{ color: 'var(--grey-300)' }}>
                          <p className="font-medium text-yellow-400 mb-1">No Schema Package</p>
                          <p>Click "Generate Schema" to create a comprehensive, AI-optimized schema package. Our system will analyze your industry and create strategic structured data that 70% of companies don't have.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[var(--grey-800)]">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{
                        background: 'var(--grey-800)',
                        color: 'var(--grey-300)',
                        fontFamily: 'var(--font-display)'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveOrganizationData}
                      disabled={saving || !orgData.name || !orgData.domain}
                      className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                      style={{
                        background: 'var(--burnt-orange)',
                        color: 'white',
                        fontFamily: 'var(--font-display)'
                      }}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
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

          {activeTab === 'voice' && (
            <BrandVoiceTab
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
