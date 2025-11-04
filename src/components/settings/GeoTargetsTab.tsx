'use client'

import React, { useState, useEffect } from 'react'
import { Globe, Plus, X, Save, Loader, AlertCircle } from 'lucide-react'

interface GeoTargets {
  id?: string
  organization_id: string
  service_lines: string[]
  geographic_focus: string[]
  industry_verticals: string[]
  priority_queries: string[]
  geo_competitors: string[]
  query_types: string[]
  target_platforms: string[]
  positioning_goals: Record<string, string>
  negative_keywords: string[]
  target_article_links: string[] // URLs of articles to feature in schema
  active: boolean
}

interface GeoTargetsTabProps {
  organizationId: string
  organizationName: string
}

export default function GeoTargetsTab({
  organizationId,
  organizationName
}: GeoTargetsTabProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [geoTargets, setGeoTargets] = useState<GeoTargets>({
    organization_id: organizationId,
    service_lines: [],
    geographic_focus: [],
    industry_verticals: [],
    priority_queries: [],
    geo_competitors: [],
    query_types: ['comparison', 'competitive', 'transactional'],
    target_platforms: ['claude', 'gemini', 'chatgpt', 'perplexity'],
    positioning_goals: {},
    negative_keywords: [],
    target_article_links: [],
    active: true
  })

  const [newInputs, setNewInputs] = useState({
    service_line: '',
    geographic: '',
    industry: '',
    query: '',
    competitor: '',
    negative: '',
    positioning_key: '',
    positioning_value: '',
    article_link: ''
  })

  useEffect(() => {
    if (organizationId) {
      loadGeoTargets()
    }
  }, [organizationId])

  const loadGeoTargets = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/organizations/geo-targets?organization_id=${organizationId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load GEO targets')
      }

      if (data.geo_targets) {
        // Ensure all array fields are initialized to prevent .map() errors
        setGeoTargets({
          ...data.geo_targets,
          service_lines: data.geo_targets.service_lines || [],
          geographic_focus: data.geo_targets.geographic_focus || [],
          industry_verticals: data.geo_targets.industry_verticals || [],
          priority_queries: data.geo_targets.priority_queries || [],
          geo_competitors: data.geo_targets.geo_competitors || [],
          query_types: data.geo_targets.query_types || ['comparison', 'competitive', 'transactional'],
          target_platforms: data.geo_targets.target_platforms || ['claude', 'gemini', 'chatgpt', 'perplexity'],
          positioning_goals: data.geo_targets.positioning_goals || {},
          negative_keywords: data.geo_targets.negative_keywords || [],
          target_article_links: data.geo_targets.target_article_links || []
        })
      }
    } catch (err: any) {
      console.error('Failed to load GEO targets:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveGeoTargets = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/organizations/geo-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geoTargets)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save GEO targets')
      }

      setSuccess('GEO targets saved successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Failed to save GEO targets:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const addArrayItem = (field: keyof Pick<GeoTargets, 'service_lines' | 'geographic_focus' | 'industry_verticals' | 'priority_queries' | 'geo_competitors' | 'negative_keywords' | 'target_article_links'>, value: string) => {
    if (!value.trim()) return

    setGeoTargets(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }))

    // Clear input
    if (field === 'service_lines') setNewInputs(prev => ({ ...prev, service_line: '' }))
    if (field === 'geographic_focus') setNewInputs(prev => ({ ...prev, geographic: '' }))
    if (field === 'industry_verticals') setNewInputs(prev => ({ ...prev, industry: '' }))
    if (field === 'priority_queries') setNewInputs(prev => ({ ...prev, query: '' }))
    if (field === 'geo_competitors') setNewInputs(prev => ({ ...prev, competitor: '' }))
    if (field === 'negative_keywords') setNewInputs(prev => ({ ...prev, negative: '' }))
    if (field === 'target_article_links') setNewInputs(prev => ({ ...prev, article_link: '' }))
  }

  const removeArrayItem = (field: keyof Pick<GeoTargets, 'service_lines' | 'geographic_focus' | 'industry_verticals' | 'priority_queries' | 'geo_competitors' | 'negative_keywords' | 'target_article_links'>, index: number) => {
    setGeoTargets(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const addPositioningGoal = () => {
    if (!newInputs.positioning_key.trim() || !newInputs.positioning_value.trim()) return

    setGeoTargets(prev => ({
      ...prev,
      positioning_goals: {
        ...prev.positioning_goals,
        [newInputs.positioning_key.trim()]: newInputs.positioning_value.trim()
      }
    }))

    setNewInputs(prev => ({ ...prev, positioning_key: '', positioning_value: '' }))
  }

  const removePositioningGoal = (key: string) => {
    setGeoTargets(prev => {
      const newGoals = { ...prev.positioning_goals }
      delete newGoals[key]
      return {
        ...prev,
        positioning_goals: newGoals
      }
    })
  }

  const togglePlatform = (platform: string) => {
    setGeoTargets(prev => ({
      ...prev,
      target_platforms: prev.target_platforms.includes(platform)
        ? prev.target_platforms.filter(p => p !== platform)
        : [...prev.target_platforms, platform]
    }))
  }

  const toggleQueryType = (type: string) => {
    setGeoTargets(prev => ({
      ...prev,
      query_types: prev.query_types.includes(type)
        ? prev.query_types.filter(t => t !== type)
        : [...prev.query_types, type]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">GEO Optimization Targets</h3>
        <p className="text-sm text-gray-400">
          Configure what queries, positioning, and visibility goals matter for {organizationName}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Service Lines */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Service Lines / Specializations
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newInputs.service_line}
              onChange={(e) => setNewInputs({ ...newInputs, service_line: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addArrayItem('service_lines', newInputs.service_line)
                }
              }}
              placeholder="e.g., Crisis Communications"
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => addArrayItem('service_lines', newInputs.service_line)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {geoTargets.service_lines.map((item, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm flex items-center gap-2"
              >
                {item}
                <button
                  onClick={() => removeArrayItem('service_lines', idx)}
                  className="hover:text-blue-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Geographic Focus */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Geographic Focus Areas
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newInputs.geographic}
              onChange={(e) => setNewInputs({ ...newInputs, geographic: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addArrayItem('geographic_focus', newInputs.geographic)
                }
              }}
              placeholder="e.g., Middle East, UAE"
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => addArrayItem('geographic_focus', newInputs.geographic)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {geoTargets.geographic_focus.map((item, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm flex items-center gap-2"
              >
                {item}
                <button
                  onClick={() => removeArrayItem('geographic_focus', idx)}
                  className="hover:text-green-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Industry Verticals */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Industry Verticals
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newInputs.industry}
              onChange={(e) => setNewInputs({ ...newInputs, industry: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addArrayItem('industry_verticals', newInputs.industry)
                }
              }}
              placeholder="e.g., Financial Services"
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => addArrayItem('industry_verticals', newInputs.industry)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {geoTargets.industry_verticals.map((item, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm flex items-center gap-2"
              >
                {item}
                <button
                  onClick={() => removeArrayItem('industry_verticals', idx)}
                  className="hover:text-purple-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Priority Queries */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Priority Queries (High-Value Search Terms)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newInputs.query}
              onChange={(e) => setNewInputs({ ...newInputs, query: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addArrayItem('priority_queries', newInputs.query)
                }
              }}
              placeholder="e.g., crisis PR agency Middle East"
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => addArrayItem('priority_queries', newInputs.query)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {geoTargets.priority_queries.map((item, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm flex items-center gap-2"
              >
                {item}
                <button
                  onClick={() => removeArrayItem('priority_queries', idx)}
                  className="hover:text-yellow-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Target Article Links */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Target Article Links (Schema.org NewsArticles)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Add URLs of articles, press releases, or news coverage you want featured in your Schema.org markup. You can also add these later in the workspace.
          </p>
          <div className="flex gap-2 mb-2">
            <input
              type="url"
              value={newInputs.article_link}
              onChange={(e) => setNewInputs({ ...newInputs, article_link: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addArrayItem('target_article_links', newInputs.article_link)
                }
              }}
              placeholder="https://example.com/article-about-your-company"
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => addArrayItem('target_article_links', newInputs.article_link)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {geoTargets.target_article_links.map((item, idx) => (
              <div
                key={idx}
                className="p-2 px-3 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-sm flex items-center justify-between gap-2"
              >
                <span className="truncate flex-1">{item}</span>
                <button
                  onClick={() => removeArrayItem('target_article_links', idx)}
                  className="hover:text-blue-300 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* GEO Competitors */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            GEO Competitors (Benchmarking)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newInputs.competitor}
              onChange={(e) => setNewInputs({ ...newInputs, competitor: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addArrayItem('geo_competitors', newInputs.competitor)
                }
              }}
              placeholder="e.g., Brunswick, FTI Consulting"
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => addArrayItem('geo_competitors', newInputs.competitor)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {geoTargets.geo_competitors.map((item, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm flex items-center gap-2"
              >
                {item}
                <button
                  onClick={() => removeArrayItem('geo_competitors', idx)}
                  className="hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Target Platforms */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Target AI Platforms
          </label>
          <div className="flex flex-wrap gap-2">
            {['claude', 'gemini', 'chatgpt', 'perplexity'].map((platform) => (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  geoTargets.target_platforms.includes(platform)
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                }`}
              >
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Query Types */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Query Types to Focus On
          </label>
          <div className="flex flex-wrap gap-2">
            {['comparison', 'competitive', 'transactional', 'informational', 'research'].map((type) => (
              <button
                key={type}
                onClick={() => toggleQueryType(type)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  geoTargets.query_types.includes(type)
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Positioning Goals */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Positioning Goals
          </label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              value={newInputs.positioning_key}
              onChange={(e) => setNewInputs({ ...newInputs, positioning_key: e.target.value })}
              placeholder="Key (e.g., crisis_leadership)"
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              value={newInputs.positioning_value}
              onChange={(e) => setNewInputs({ ...newInputs, positioning_value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addPositioningGoal()
                }
              }}
              placeholder="Value (e.g., Leading crisis firm in ME)"
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={addPositioningGoal}
            className="mb-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Positioning Goal
          </button>
          <div className="space-y-2">
            {Object.entries(geoTargets.positioning_goals).map(([key, value]) => (
              <div
                key={key}
                className="p-3 bg-gray-800 border border-gray-700 rounded-lg flex items-start justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-blue-400">{key}</p>
                  <p className="text-sm text-gray-300">{value}</p>
                </div>
                <button
                  onClick={() => removePositioningGoal(key)}
                  className="text-gray-400 hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Negative Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Negative Keywords (Terms to Avoid)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newInputs.negative}
              onChange={(e) => setNewInputs({ ...newInputs, negative: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addArrayItem('negative_keywords', newInputs.negative)
                }
              }}
              placeholder="e.g., cheap, discount"
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => addArrayItem('negative_keywords', newInputs.negative)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {geoTargets.negative_keywords.map((item, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-gray-700/50 text-gray-400 border border-gray-600 rounded-lg text-sm flex items-center gap-2"
              >
                {item}
                <button
                  onClick={() => removeArrayItem('negative_keywords', idx)}
                  className="hover:text-gray-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={saveGeoTargets}
            disabled={saving}
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
                Save GEO Targets
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
