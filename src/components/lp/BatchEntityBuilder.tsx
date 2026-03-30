'use client'

import { useState, useMemo, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  ChevronRight,
  ChevronDown,
  Building2,
  Loader2,
  Check,
  X,
  Plus,
  Sparkles,
  Factory,
  Layers,
  Search,
  Users,
  Landmark,
  Newspaper,
  TreePine,
  Scale,
  Lightbulb,
  GraduationCap,
  Eye,
  Zap
} from 'lucide-react'

import { ENTITY_DATABASE, formatEntityName } from './entityDatabase'


// Get icon component
function getIcon(iconName: string) {
  switch (iconName) {
    case 'landmark': return Landmark
    case 'newspaper': return Newspaper
    case 'lightbulb': return Lightbulb
    case 'scale': return Scale
    case 'tree': return TreePine
    case 'users': return Users
    case 'graduation': return GraduationCap
    case 'building': return Building2
    default: return Factory
  }
}

interface EntityBuildStatus {
  name: string
  status: 'pending' | 'building' | 'success' | 'error'
  error?: string
}

export default function BatchEntityBuilder() {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set())
  const [buildStatuses, setBuildStatuses] = useState<Map<string, EntityBuildStatus>>(new Map())
  const [isBuilding, setIsBuilding] = useState(false)

  // AI search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Global profiles - entities already built
  const [globalProfiles, setGlobalProfiles] = useState<Set<string>>(new Set())
  const [loadingProfiles, setLoadingProfiles] = useState(false)

  // Profile viewer
  const [viewingProfile, setViewingProfile] = useState<any>(null)
  const [loadingProfileView, setLoadingProfileView] = useState(false)

  // Bulk builder state
  const [isBulkBuilding, setIsBulkBuilding] = useState(false)
  const [bulkBuildProgress, setBulkBuildProgress] = useState<{
    total: number
    successful: number
    failed: number
    status: 'idle' | 'running' | 'complete'
  }>({ total: 0, successful: 0, failed: 0, status: 'idle' })
  const [selectedBulkCategories, setSelectedBulkCategories] = useState<Set<string>>(new Set())

  // Get all groups
  const groups = useMemo(() => Object.keys(ENTITY_DATABASE).sort(), [])

  // Load all existing profiles on mount - check if profile exists regardless of org
  useEffect(() => {
    const loadAllProfiles = async () => {
      setLoadingProfiles(true)
      try {
        // Get all profiles - we just care if a profile exists for this entity
        const { data } = await supabase
          .from('lp_entity_profiles')
          .select('entity_name')

        if (data) {
          setGlobalProfiles(new Set(data.map(p => p.entity_name.toLowerCase())))
        }
      } catch (err) {
        console.error('Failed to load profiles:', err)
      } finally {
        setLoadingProfiles(false)
      }
    }

    loadAllProfiles()
  }, [])

  // Toggle group expansion
  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(group)) {
      newExpanded.delete(group)
    } else {
      newExpanded.add(group)
    }
    setExpandedGroups(newExpanded)
  }

  // Toggle entity selection
  const toggleEntity = (entity: string) => {
    const newSelected = new Set(selectedEntities)
    if (newSelected.has(entity)) {
      newSelected.delete(entity)
    } else {
      newSelected.add(entity)
    }
    setSelectedEntities(newSelected)
  }

  // Select all entities in a category
  const selectAllInCategory = (entities: string[]) => {
    const newSelected = new Set(selectedEntities)
    entities.forEach(e => newSelected.add(e))
    setSelectedEntities(newSelected)
  }

  // Clear all selections
  const clearSelection = () => {
    setSelectedEntities(new Set())
    setBuildStatuses(new Map())
  }

  // AI search for custom categories
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchResults([])

    try {
      const { data, error } = await supabase.functions.invoke('simple-ai-call', {
        body: {
          prompt: `List 15 notable ${searchQuery}. Return ONLY a valid JSON array of names, no explanation or other text. Example format: ["Name 1", "Name 2", "Name 3"]`,
          model: 'gemini'
        }
      })

      if (!error && data?.result) {
        const text = data.result
        // Try direct parse first
        try {
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed)) {
            setSearchResults(parsed.filter((n: any) => typeof n === 'string').slice(0, 15))
            return
          }
        } catch {}

        // Try to extract JSON array from text
        const match = text.match(/\[[\s\S]*?\]/)
        if (match) {
          const names = JSON.parse(match[0])
          setSearchResults(names.filter((n: any) => typeof n === 'string').slice(0, 15))
        }
      } else if (error) {
        console.error('Search error:', error)
      }
    } catch (err) {
      console.error('Search failed:', err)
    }

    setIsSearching(false)
  }

  // View an existing profile
  const viewDatabaseProfile = async (entityName: string) => {
    setLoadingProfileView(true)
    try {
      const { data } = await supabase
        .from('lp_entity_profiles')
        .select('*')
        .ilike('entity_name', entityName)
        .order('built_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setViewingProfile(data)
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoadingProfileView(false)
    }
  }

  // Build entity profiles
  const buildEntities = async () => {
    if (selectedEntities.size === 0) return

    setIsBuilding(true)
    const entities = Array.from(selectedEntities)

    // Initialize statuses
    const initialStatuses = new Map<string, EntityBuildStatus>()
    entities.forEach(name => {
      initialStatuses.set(name, { name, status: 'pending' })
    })
    setBuildStatuses(initialStatuses)

    // Process in batches of 3 to avoid rate limiting
    const batchSize = 3
    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize)

      await Promise.all(batch.map(async (entityName) => {
        // Update status to building
        setBuildStatuses(prev => {
          const newMap = new Map(prev)
          newMap.set(entityName, { name: entityName, status: 'building' })
          return newMap
        })

        try {
          const { data: result, error } = await supabase.functions.invoke('entity-context-manager', {
            body: {
              name: entityName,
              entity_type: 'company',
              force_refresh: false
            }
          })

          if (error) {
            throw new Error(error.message)
          }

          if (result?.success) {
            setBuildStatuses(prev => {
              const newMap = new Map(prev)
              newMap.set(entityName, { name: entityName, status: 'success' })
              return newMap
            })
          } else {
            throw new Error(result.error || 'Unknown error')
          }
        } catch (err: any) {
          setBuildStatuses(prev => {
            const newMap = new Map(prev)
            newMap.set(entityName, {
              name: entityName,
              status: 'error',
              error: err.message
            })
            return newMap
          })
        }
      }))

      // Small delay between batches
      if (i + batchSize < entities.length) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    // Refresh profiles to show newly built ones
    const { data: refreshed } = await supabase
      .from('lp_entity_profiles')
      .select('entity_name')
      
    if (refreshed) {
      setGlobalProfiles(new Set(refreshed.map(p => p.entity_name.toLowerCase())))
    }

    setIsBuilding(false)
  }

  // Bulk build all entities in selected categories
  const bulkBuildCategories = async () => {
    if (selectedBulkCategories.size === 0) return

    setIsBulkBuilding(true)
    setBulkBuildProgress({ total: 0, successful: 0, failed: 0, status: 'running' })

    try {
      // Call the bulk builder edge function
      const { data, error } = await supabase.functions.invoke('lp-bulk-profile-builder', {
        body: {
          organization_id: '00000000-0000-0000-0000-000000000000', // Default org for now
          categories: Array.from(selectedBulkCategories),
          batch_size: 3
        }
      })

      if (error) {
        console.error('Bulk build error:', error)
        setBulkBuildProgress(prev => ({ ...prev, status: 'complete' }))
      } else if (data?.summary) {
        setBulkBuildProgress({
          total: data.summary.total_processed,
          successful: data.summary.successful,
          failed: data.summary.failed,
          status: 'complete'
        })

        // Refresh the profiles list
        const { data: refreshed } = await supabase
          .from('lp_entity_profiles')
          .select('entity_name')
          
        if (refreshed) {
          setGlobalProfiles(new Set(refreshed.map(p => p.entity_name.toLowerCase())))
        }
      }
    } catch (err) {
      console.error('Bulk build failed:', err)
      setBulkBuildProgress(prev => ({ ...prev, status: 'complete' }))
    } finally {
      setIsBulkBuilding(false)
    }
  }

  // Toggle bulk category selection
  const toggleBulkCategory = (category: string) => {
    const newSelected = new Set(selectedBulkCategories)
    if (newSelected.has(category)) {
      newSelected.delete(category)
    } else {
      newSelected.add(category)
    }
    setSelectedBulkCategories(newSelected)
  }

  // Count successes/failures
  const successCount = Array.from(buildStatuses.values()).filter(s => s.status === 'success').length
  const errorCount = Array.from(buildStatuses.values()).filter(s => s.status === 'error').length

  // Category labels for display
  const categoryLabels: Record<string, string> = {
    us_government: 'US Government',
    us_congress: 'US Congress',
    state_governors: 'State Governors',
    international_leaders: 'International Leaders',
    tech_journalists: 'Tech Journalists',
    business_journalists: 'Business Journalists',
    media_outlets: 'Media Outlets',
    tech_executives: 'Tech Executives',
    tech_influencers: 'Tech Influencers',
    tech_advocacy: 'Tech Advocacy',
    environmental: 'Environmental',
    social_advocacy: 'Social Advocacy',
    think_tanks: 'Think Tanks',
    academic: 'Academic',
    technology: 'Technology',
    finance: 'Finance',
    healthcare: 'Healthcare',
    energy: 'Energy',
    automotive: 'Automotive',
    media_entertainment: 'Media & Entertainment',
    retail: 'Retail'
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="font-bold mb-2" style={{ fontSize: '1.375rem', color: '#111827' }}>Batch Entity Builder</h1>
        <p className="text-gray-600">
          Build LP entity profiles in bulk. Browse categories or search for any type of entity.
        </p>
      </div>

      {/* Bulk Builder Section */}
      <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Bulk Profile Builder
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Build all entity profiles in selected categories at once (uses Gemini 2.5 Flash)
            </p>
          </div>
          <button
            onClick={bulkBuildCategories}
            disabled={isBulkBuilding || selectedBulkCategories.size === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBulkBuilding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Building...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Build {selectedBulkCategories.size > 0 ? `${selectedBulkCategories.size} Categories` : 'Selected'}
              </>
            )}
          </button>
        </div>

        {/* Category checkboxes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
          {Object.keys(ENTITY_DATABASE).map(category => (
            <label
              key={category}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                selectedBulkCategories.has(category)
                  ? 'bg-purple-100 border-purple-300 text-purple-800'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-purple-200'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedBulkCategories.has(category)}
                onChange={() => toggleBulkCategory(category)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-xs font-medium truncate">
                {categoryLabels[category] || category.replace(/_/g, ' ')}
              </span>
            </label>
          ))}
        </div>

        {/* Bulk build progress */}
        {bulkBuildProgress.status !== 'idle' && (
          <div className="mt-3 p-3 bg-white rounded-lg border border-purple-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {bulkBuildProgress.status === 'running' ? 'Building profiles...' : 'Build complete'}
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" /> {bulkBuildProgress.successful}
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <X className="w-4 h-4" /> {bulkBuildProgress.failed}
                </span>
                <span className="text-gray-500">
                  Total: {bulkBuildProgress.total}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Search */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Any Category
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g., climate scientists, EU regulators, AI ethicists..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--burnt-orange)] focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Results for "{searchQuery}"</span>
              <button
                onClick={() => selectAllInCategory(searchResults)}
                className="text-xs text-[var(--burnt-orange)] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {searchResults.map(entity => {
                const hasExistingProfile = globalProfiles.has(entity.toLowerCase())
                return (
                  <button
                    key={entity}
                    onClick={() => hasExistingProfile ? viewDatabaseProfile(entity) : toggleEntity(entity)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                      selectedEntities.has(entity)
                        ? 'bg-[var(--burnt-orange)] border-[var(--burnt-orange)] text-white'
                        : hasExistingProfile
                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-[var(--burnt-orange)] hover:text-[var(--burnt-orange)]'
                    }`}
                  >
                    {hasExistingProfile && <Eye className="w-3 h-3 inline mr-1" />}
                    {entity}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selection summary */}
      <div className="mb-6 bg-[var(--burnt-orange)]/5 rounded-lg border border-[var(--burnt-orange)]/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--burnt-orange)]/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[var(--burnt-orange)]" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {selectedEntities.size} entities selected
            </div>
            <div className="text-sm text-gray-500">
              Click entities to add/remove from build queue
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedEntities.size > 0 && (
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          )}
          <button
            onClick={buildEntities}
            disabled={isBuilding || selectedEntities.size === 0}
            className="px-4 py-1.5 bg-[var(--burnt-orange)] text-white rounded-lg font-medium flex items-center gap-2 hover:bg-[var(--burnt-orange)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBuilding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Building...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Build Profiles
              </>
            )}
          </button>
        </div>
      </div>

      {/* Build progress */}
      {buildStatuses.size > 0 && (
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Build Progress</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <Check className="w-4 h-4" /> {successCount}
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <X className="w-4 h-4" /> {errorCount}
              </span>
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Array.from(buildStatuses.values()).map(status => (
              <div
                key={status.name}
                className="flex items-center justify-between py-1.5 px-2 rounded bg-gray-50"
              >
                <span className="text-sm text-gray-700">{status.name}</span>
                <span className="flex items-center gap-1">
                  {status.status === 'pending' && (
                    <span className="text-xs text-gray-400">Waiting</span>
                  )}
                  {status.status === 'building' && (
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--burnt-orange)]" />
                  )}
                  {status.status === 'success' && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                  {status.status === 'error' && (
                    <span className="flex items-center gap-1 text-red-600">
                      <X className="w-4 h-4" />
                      <span className="text-xs">{status.error}</span>
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entity browser */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Entity Database
          </h3>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {loadingProfiles ? (
              <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading profiles...</span>
            ) : (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-100 border border-green-300"></span>
                  Built ({globalProfiles.size})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-white border border-gray-200"></span>
                  Not built
                </span>
              </>
            )}
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {groups.map(group => {
            const isExpanded = expandedGroups.has(group)
            const groupData = ENTITY_DATABASE[group]
            const categories = Object.keys(groupData.categories)
            const IconComponent = getIcon(groupData.icon)

            return (
              <div key={group}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <IconComponent className="w-4 h-4 text-[var(--burnt-orange)]" />
                    <span className="font-medium text-gray-900">{formatEntityName(group)}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {categories.length} categories
                  </span>
                </button>

                {/* Categories */}
                {isExpanded && (
                  <div className="bg-gray-50/50 pl-8 pr-4 py-2 space-y-4">
                    {categories.map(category => {
                      const entities = groupData.categories[category]

                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              {formatEntityName(category)}
                            </span>
                            <button
                              onClick={() => selectAllInCategory(entities)}
                              className="text-xs text-[var(--burnt-orange)] hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Add all ({entities.length})
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {entities.map(entity => {
                              const isSelected = selectedEntities.has(entity)
                              const buildStatus = buildStatuses.get(entity)
                              const hasExistingProfile = globalProfiles.has(entity.toLowerCase())
                              const isBuilt = buildStatus?.status === 'success' || hasExistingProfile

                              return (
                                <button
                                  key={entity}
                                  onClick={() => isBuilt ? viewDatabaseProfile(entity) : toggleEntity(entity)}
                                  disabled={isBuilding && buildStatus?.status === 'building'}
                                  className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                                    buildStatus?.status === 'success'
                                      ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                                      : buildStatus?.status === 'error'
                                      ? 'bg-red-100 border-red-300 text-red-700'
                                      : buildStatus?.status === 'building'
                                      ? 'bg-[var(--burnt-orange)]/10 border-[var(--burnt-orange)]/30 text-[var(--burnt-orange)]'
                                      : isSelected
                                      ? 'bg-[var(--burnt-orange)] border-[var(--burnt-orange)] text-white'
                                      : hasExistingProfile
                                      ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                      : 'bg-white border-gray-200 text-gray-600 hover:border-[var(--burnt-orange)] hover:text-[var(--burnt-orange)]'
                                  }`}
                                >
                                  {buildStatus?.status === 'building' && (
                                    <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                                  )}
                                  {isBuilt && (
                                    <Eye className="w-3 h-3 inline mr-1" />
                                  )}
                                  {entity}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Profile Viewer Modal */}
      {(viewingProfile || loadingProfileView) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-[var(--burnt-orange)]/5 to-transparent">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {loadingProfileView ? 'Loading...' : viewingProfile?.entity_name}
                </h3>
                {viewingProfile && (
                  <span className="text-xs text-gray-500 capitalize">{viewingProfile.entity_type}</span>
                )}
              </div>
              <button
                onClick={() => { setViewingProfile(null); setLoadingProfileView(false); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingProfileView ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--burnt-orange)]" />
                </div>
              ) : viewingProfile?.profile && (
                <>
                  {/* Identity */}
                  {viewingProfile.profile.identity && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Identity</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                        <p><span className="font-medium">Core:</span> {viewingProfile.profile.identity.core_identity}</p>
                        {viewingProfile.profile.identity.market_position && (
                          <p><span className="font-medium">Market Position:</span> {viewingProfile.profile.identity.market_position}</p>
                        )}
                        {viewingProfile.profile.identity.key_differentiators?.length > 0 && (
                          <p><span className="font-medium">Differentiators:</span> {viewingProfile.profile.identity.key_differentiators.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Voice */}
                  {viewingProfile.profile.voice && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Voice & Communication</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                        <p><span className="font-medium">Tone:</span> {viewingProfile.profile.voice.tone}</p>
                        {viewingProfile.profile.voice.vocabulary?.length > 0 && (
                          <p><span className="font-medium">Vocabulary:</span> {viewingProfile.profile.voice.vocabulary.join(', ')}</p>
                        )}
                        {viewingProfile.profile.voice.taboo_topics?.length > 0 && (
                          <p><span className="font-medium text-red-600">Avoids:</span> {viewingProfile.profile.voice.taboo_topics.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Priorities */}
                  {viewingProfile.profile.priorities && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Priorities</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                        {viewingProfile.profile.priorities.stated?.length > 0 && (
                          <p><span className="font-medium">Stated:</span> {viewingProfile.profile.priorities.stated.join(', ')}</p>
                        )}
                        {viewingProfile.profile.priorities.revealed?.length > 0 && (
                          <p><span className="font-medium">Revealed:</span> {viewingProfile.profile.priorities.revealed.join(', ')}</p>
                        )}
                        {viewingProfile.profile.priorities.tension_points?.length > 0 && (
                          <p><span className="font-medium text-amber-600">Tensions:</span> {viewingProfile.profile.priorities.tension_points.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Vulnerabilities */}
                  {viewingProfile.profile.vulnerabilities && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Vulnerabilities</h4>
                      <div className="bg-red-50 rounded-lg p-4 space-y-2 text-sm">
                        {viewingProfile.profile.vulnerabilities.reputational?.length > 0 && (
                          <p><span className="font-medium">Reputational:</span> {viewingProfile.profile.vulnerabilities.reputational.join(', ')}</p>
                        )}
                        {viewingProfile.profile.vulnerabilities.operational?.length > 0 && (
                          <p><span className="font-medium">Operational:</span> {viewingProfile.profile.vulnerabilities.operational.join(', ')}</p>
                        )}
                        {viewingProfile.profile.vulnerabilities.strategic?.length > 0 && (
                          <p><span className="font-medium">Strategic:</span> {viewingProfile.profile.vulnerabilities.strategic.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Response Patterns */}
                  {viewingProfile.profile.response_patterns && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Response Patterns</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                        {viewingProfile.profile.response_patterns.to_competition && (
                          <p><span className="font-medium">To Competition:</span> {viewingProfile.profile.response_patterns.to_competition}</p>
                        )}
                        {viewingProfile.profile.response_patterns.to_criticism && (
                          <p><span className="font-medium">To Criticism:</span> {viewingProfile.profile.response_patterns.to_criticism}</p>
                        )}
                        {viewingProfile.profile.response_patterns.to_crisis && (
                          <p><span className="font-medium">To Crisis:</span> {viewingProfile.profile.response_patterns.to_crisis}</p>
                        )}
                        {viewingProfile.profile.response_patterns.to_opportunity && (
                          <p><span className="font-medium">To Opportunity:</span> {viewingProfile.profile.response_patterns.to_opportunity}</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
