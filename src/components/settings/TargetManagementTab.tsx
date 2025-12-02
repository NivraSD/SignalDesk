'use client'

import React, { useState, useEffect } from 'react'
import { Target, Plus, X as CloseIcon, Save, Trash2, AlertCircle, CheckCircle, Loader, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface IntelligenceTarget {
  id: string
  organization_id: string
  name: string
  type: 'competitor' | 'topic' | 'keyword' | 'influencer' | 'stakeholder'
  priority: 'low' | 'medium' | 'high' | 'critical'
  threat_level?: number
  keywords?: string[]
  metadata?: any
  active: boolean
  created_at: string
  updated_at: string
  prediction_count?: number
}

interface TargetManagementTabProps {
  organizationId: string
  organizationName: string
}

export default function TargetManagementTab({
  organizationId,
  organizationName
}: TargetManagementTabProps) {
  const [targets, setTargets] = useState<IntelligenceTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newTarget, setNewTarget] = useState({
    name: '',
    type: 'competitor' as IntelligenceTarget['type'],
    priority: 'medium' as IntelligenceTarget['priority']
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [runningDiscovery, setRunningDiscovery] = useState(false)
  const [discoveredItems, setDiscoveredItems] = useState<any>(null)
  const [showDiscoveryResults, setShowDiscoveryResults] = useState(false)
  const [selectedDiscoveryItems, setSelectedDiscoveryItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (organizationId) {
      loadTargets()
    }
  }, [organizationId])

  const loadTargets = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/organizations/targets?organization_id=${organizationId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load targets')
      }

      // Fetch prediction counts
      const { supabase } = await import('@/lib/supabase/client')
      const targetsWithCounts = await Promise.all(
        (data.targets || []).map(async (target: IntelligenceTarget) => {
          const { count } = await supabase
            .from('predictions')
            .select('id', { count: 'exact', head: true })
            .eq('target_id', target.id)
            .eq('status', 'active')

          return {
            ...target,
            prediction_count: count || 0
          }
        })
      )

      setTargets(targetsWithCounts)
    } catch (err: any) {
      console.error('Failed to load targets:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addTarget = async () => {
    if (!newTarget.name.trim()) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/organizations/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          targets: [newTarget],
          append: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add target')
      }

      setNewTarget({ name: '', type: 'competitor', priority: 'medium' })
      setShowAddForm(false)
      await loadTargets()
    } catch (err: any) {
      console.error('Failed to add target:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateTargetPriority = async (targetId: string, newPriority: IntelligenceTarget['priority']) => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/organizations/targets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetId,
          priority: newPriority
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update priority')
      }

      await loadTargets()
    } catch (err: any) {
      console.error('Failed to update priority:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteTarget = async (targetId: string) => {
    if (!confirm('Are you sure you want to delete this target?')) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/organizations/targets?id=${targetId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete target')
      }

      await loadTargets()
    } catch (err: any) {
      console.error('Failed to delete target:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const runDiscovery = async () => {
    try {
      setRunningDiscovery(true)
      setError(null)

      const response = await fetch('/api/organizations/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_name: organizationName,
          organization_id: organizationId,
          industry_hint: '',
          save_profile: false // Don't save yet, let user customize first
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run discovery')
      }

      setDiscoveredItems(data.discovered)
      setSelectedDiscoveryItems(new Set())
      setShowDiscoveryResults(true)
    } catch (err: any) {
      console.error('Failed to run discovery:', err)
      setError(err.message)
    } finally {
      setRunningDiscovery(false)
    }
  }

  const toggleDiscoveryItem = (item: string) => {
    const newSelected = new Set(selectedDiscoveryItems)
    if (newSelected.has(item)) {
      newSelected.delete(item)
    } else {
      newSelected.add(item)
    }
    setSelectedDiscoveryItems(newSelected)
  }

  const selectAllDiscoveryItems = () => {
    const allItems = new Set<string>()

    if (discoveredItems?.competitors) {
      discoveredItems.competitors.forEach((comp: string) => {
        const exists = targets.some(t => t.name.toLowerCase() === comp.toLowerCase() && t.type === 'competitor')
        if (!exists) allItems.add(comp)
      })
    }

    if (discoveredItems?.topics) {
      discoveredItems.topics.forEach((topic: string) => {
        const exists = targets.some(t => t.name.toLowerCase() === topic.toLowerCase() && t.type === 'topic')
        if (!exists) allItems.add(topic)
      })
    }

    if (discoveredItems?.stakeholders) {
      const allStakeholders = [
        ...(discoveredItems.stakeholders.regulators || []),
        ...(discoveredItems.stakeholders.influencers || []),
        ...(discoveredItems.stakeholders.major_customers || [])
      ]
      allStakeholders.forEach((stakeholder: string) => {
        const exists = targets.some(t =>
          t.name.toLowerCase() === stakeholder.toLowerCase() &&
          (t.type === 'influencer' || t.type === 'stakeholder')
        )
        if (!exists) allItems.add(stakeholder)
      })
    }

    setSelectedDiscoveryItems(allItems)
  }

  const saveSelectedDiscoveryItems = async () => {
    try {
      setSaving(true)
      setError(null)

      console.log('🔵 Saving discovery: selected items =', selectedDiscoveryItems.size)
      const targetsToAdd: any[] = []

      if (discoveredItems.competitors) {
        discoveredItems.competitors.forEach((comp: string) => {
          if (selectedDiscoveryItems.has(comp)) {
            const exists = targets.some(t => t.name.toLowerCase() === comp.toLowerCase() && t.type === 'competitor')
            if (!exists) {
              targetsToAdd.push({ name: comp, type: 'competitor', priority: 'high' })
            }
          }
        })
      }

      if (discoveredItems.topics) {
        discoveredItems.topics.forEach((topic: string) => {
          if (selectedDiscoveryItems.has(topic)) {
            const exists = targets.some(t => t.name.toLowerCase() === topic.toLowerCase() && t.type === 'topic')
            if (!exists) {
              targetsToAdd.push({ name: topic, type: 'topic', priority: 'medium' })
            }
          }
        })
      }

      if (discoveredItems.stakeholders) {
        const allStakeholders = [
          ...(discoveredItems.stakeholders.regulators || []),
          ...(discoveredItems.stakeholders.influencers || []),
          ...(discoveredItems.stakeholders.major_customers || [])
        ]
        allStakeholders.forEach((stakeholder: string) => {
          if (selectedDiscoveryItems.has(stakeholder)) {
            const exists = targets.some(t =>
              t.name.toLowerCase() === stakeholder.toLowerCase() &&
              (t.type === 'influencer' || t.type === 'stakeholder')
            )
            if (!exists) {
              targetsToAdd.push({ name: stakeholder, type: 'stakeholder', priority: 'medium' })
            }
          }
        })
      }

      if (targetsToAdd.length > 0) {
        const response = await fetch('/api/organizations/targets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: organizationId,
            targets: targetsToAdd,
            append: true
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to add targets')
        }
      }

      // CRITICAL: Save the full profile (with sources, intelligence_context) to organizations.company_profile
      console.log('💾 Saving full discovery profile to company_profile...')
      const profileResponse = await fetch('/api/organizations/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_name: organizationName,
          organization_id: organizationId,
          industry_hint: '',
          save_profile: true // Save the full profile now
        })
      })

      if (!profileResponse.ok) {
        const profileError = await profileResponse.json()
        console.error('Failed to save profile:', profileError)
        // Don't fail the whole operation, just log the error
      } else {
        console.log('✅ Full profile saved successfully')
      }

      setShowDiscoveryResults(false)
      setSelectedDiscoveryItems(new Set())
      await loadTargets()
    } catch (err: any) {
      console.error('Failed to save discovery items:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'competitor': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'topic': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'keyword': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'influencer': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'stakeholder': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400'
      case 'high': return 'text-orange-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const groupedTargets = targets.reduce((acc, target) => {
    if (!acc[target.type]) acc[target.type] = []
    acc[target.type].push(target)
    return acc
  }, {} as Record<string, IntelligenceTarget[]>)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white" style={{ fontFamily: 'var(--font-display)' }}>Intelligence Targets</h3>
          <p className="text-sm" style={{ color: 'var(--grey-400)' }}>
            Monitor competitors, topics, keywords, influencers, and stakeholders
          </p>
        </div>
        <button
          onClick={runDiscovery}
          disabled={runningDiscovery || loading}
          className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          style={{ background: 'var(--burnt-orange)', color: 'white', fontFamily: 'var(--font-display)' }}
        >
          {runningDiscovery ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Discovering...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Run Discovery
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin" style={{ color: 'var(--burnt-orange)' }} />
        </div>
      ) : (
        <>
          {/* Add Target Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mb-6 w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              style={{ background: 'var(--burnt-orange-muted)', color: 'var(--burnt-orange)', border: '1px solid var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
            >
              <Plus className="w-5 h-5" />
              Add New Target
            </button>
          )}

          {/* Add Target Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-6 p-4 rounded-lg"
                style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}>Name</label>
                    <input
                      type="text"
                      value={newTarget.name}
                      onChange={(e) => setNewTarget({ ...newTarget, name: e.target.value })}
                      placeholder="Enter target name..."
                      className="w-full px-4 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
                      style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}>Type</label>
                      <select
                        value={newTarget.type}
                        onChange={(e) => setNewTarget({ ...newTarget, type: e.target.value as any })}
                        className="w-full px-4 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
                        style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
                      >
                        <option value="competitor">Competitor</option>
                        <option value="topic">Topic</option>
                        <option value="keyword">Keyword</option>
                        <option value="influencer">Influencer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}>Priority</label>
                      <select
                        value={newTarget.priority}
                        onChange={(e) => setNewTarget({ ...newTarget, priority: e.target.value as any })}
                        className="w-full px-4 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
                        style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addTarget}
                      disabled={saving || !newTarget.name.trim()}
                      className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ background: 'var(--burnt-orange)', color: 'white', fontFamily: 'var(--font-display)' }}
                    >
                      {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Add Target
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false)
                        setNewTarget({ name: '', type: 'competitor', priority: 'medium' })
                      }}
                      className="px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{ background: 'var(--grey-800)', color: 'var(--grey-300)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Targets List */}
          {targets.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--grey-700)' }} />
              <p className="mb-2" style={{ color: 'var(--grey-400)' }}>No targets yet</p>
              <p className="text-sm" style={{ color: 'var(--grey-500)' }}>Add targets to start monitoring</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTargets).map(([type, typeTargets]) => (
                <div key={type}>
                  <h3 className="text-lg font-medium text-white mb-3 capitalize flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                    <span className={`px-3 py-1 rounded-lg border text-sm ${getTypeColor(type)}`}>
                      {type}s
                    </span>
                    <span className="text-sm" style={{ color: 'var(--grey-500)' }}>({typeTargets.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {typeTargets.map((target) => (
                      <div
                        key={target.id}
                        className="p-4 rounded-lg transition-colors"
                        style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="text-white font-medium">{target.name}</h4>
                              <select
                                value={target.priority}
                                onChange={(e) => updateTargetPriority(target.id, e.target.value as IntelligenceTarget['priority'])}
                                disabled={saving}
                                className={`px-2 py-1 text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)] disabled:opacity-50 ${getPriorityColor(target.priority)}`}
                                style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
                              >
                                <option value="low" style={{ background: 'var(--grey-900)' }} className="text-gray-400">LOW</option>
                                <option value="medium" style={{ background: 'var(--grey-900)' }} className="text-yellow-400">MEDIUM</option>
                                <option value="high" style={{ background: 'var(--grey-900)' }} className="text-orange-400">HIGH</option>
                                <option value="critical" style={{ background: 'var(--grey-900)' }} className="text-red-400">CRITICAL</option>
                              </select>
                              {target.prediction_count !== undefined && target.prediction_count > 0 && (
                                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--burnt-orange-muted)', color: 'var(--burnt-orange)' }}>
                                  🔮 {target.prediction_count}
                                </span>
                              )}
                            </div>
                            <p className="text-sm mt-1" style={{ color: 'var(--grey-500)' }}>
                              Added {new Date(target.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteTarget(target.id)}
                            disabled={saving}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Discovery Results Modal */}
      <AnimatePresence>
        {showDiscoveryResults && discoveredItems && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowDiscoveryResults(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-xl w-full max-w-3xl max-h-[70vh] overflow-hidden flex flex-col"
              style={{ background: 'var(--charcoal)', border: '1px solid var(--grey-800)' }}
            >
              <div className="p-6" style={{ borderBottom: '1px solid var(--grey-800)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Discovery Results</h3>
                  <button
                    onClick={() => setShowDiscoveryResults(false)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: 'var(--grey-400)' }}
                  >
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllDiscoveryItems}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{ background: 'var(--burnt-orange-muted)', color: 'var(--burnt-orange)', border: '1px solid var(--burnt-orange)' }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedDiscoveryItems(new Set())}
                    disabled={selectedDiscoveryItems.size === 0}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{ background: 'var(--grey-800)', color: 'var(--grey-300)', border: '1px solid var(--grey-700)' }}
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Show competitors, topics, stakeholders similar to original */}
                {discoveredItems.competitors && discoveredItems.competitors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>Competitors ({discoveredItems.competitors.length})</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {discoveredItems.competitors.map((comp: string) => {
                        const exists = targets.some(t => t.name.toLowerCase() === comp.toLowerCase() && t.type === 'competitor')
                        const isSelected = selectedDiscoveryItems.has(comp)
                        return (
                          <button
                            key={comp}
                            onClick={() => !exists && toggleDiscoveryItem(comp)}
                            disabled={exists}
                            className={`p-2 rounded border text-sm ${
                              exists ? 'bg-[var(--grey-800)] border-[var(--grey-700)] text-[var(--grey-500)]' :
                              isSelected ? 'bg-red-500/20 border-red-500 text-red-300' :
                              'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20'
                            }`}
                          >
                            {comp}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {discoveredItems.topics && discoveredItems.topics.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>Topics ({discoveredItems.topics.length})</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {discoveredItems.topics.map((topic: string) => {
                        const exists = targets.some(t => t.name.toLowerCase() === topic.toLowerCase() && t.type === 'topic')
                        const isSelected = selectedDiscoveryItems.has(topic)
                        return (
                          <button
                            key={topic}
                            onClick={() => !exists && toggleDiscoveryItem(topic)}
                            disabled={exists}
                            className={`p-2 rounded border text-sm ${
                              exists ? 'bg-[var(--grey-800)] border-[var(--grey-700)] text-[var(--grey-500)]' :
                              isSelected ? 'bg-[var(--burnt-orange-muted)] border-[var(--burnt-orange)] text-[var(--burnt-orange)]' :
                              'bg-[var(--burnt-orange-muted)]/50 border-[var(--burnt-orange)]/30 text-[var(--burnt-orange)] hover:bg-[var(--burnt-orange-muted)]'
                            }`}
                          >
                            {topic}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {discoveredItems.stakeholders && (
                  <>
                    {discoveredItems.stakeholders.regulators && discoveredItems.stakeholders.regulators.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>Regulators ({discoveredItems.stakeholders.regulators.length})</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {discoveredItems.stakeholders.regulators.map((stakeholder: string) => {
                            const exists = targets.some(t =>
                              t.name.toLowerCase() === stakeholder.toLowerCase() &&
                              (t.type === 'stakeholder' || t.type === 'influencer')
                            )
                            const isSelected = selectedDiscoveryItems.has(stakeholder)
                            return (
                              <button
                                key={stakeholder}
                                onClick={() => !exists && toggleDiscoveryItem(stakeholder)}
                                disabled={exists}
                                className={`p-2 rounded border text-sm ${
                                  exists ? 'bg-[var(--grey-800)] border-[var(--grey-700)] text-[var(--grey-500)]' :
                                  isSelected ? 'bg-purple-500/20 border-purple-500 text-purple-300' :
                                  'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                                }`}
                              >
                                {stakeholder}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {discoveredItems.stakeholders.influencers && discoveredItems.stakeholders.influencers.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>Influencers ({discoveredItems.stakeholders.influencers.length})</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {discoveredItems.stakeholders.influencers.map((stakeholder: string) => {
                            const exists = targets.some(t =>
                              t.name.toLowerCase() === stakeholder.toLowerCase() &&
                              (t.type === 'stakeholder' || t.type === 'influencer')
                            )
                            const isSelected = selectedDiscoveryItems.has(stakeholder)
                            return (
                              <button
                                key={stakeholder}
                                onClick={() => !exists && toggleDiscoveryItem(stakeholder)}
                                disabled={exists}
                                className={`p-2 rounded border text-sm ${
                                  exists ? 'bg-[var(--grey-800)] border-[var(--grey-700)] text-[var(--grey-500)]' :
                                  isSelected ? 'bg-purple-500/20 border-purple-500 text-purple-300' :
                                  'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                                }`}
                              >
                                {stakeholder}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {discoveredItems.stakeholders.major_customers && discoveredItems.stakeholders.major_customers.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>Major Customers ({discoveredItems.stakeholders.major_customers.length})</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {discoveredItems.stakeholders.major_customers.map((stakeholder: string) => {
                            const exists = targets.some(t =>
                              t.name.toLowerCase() === stakeholder.toLowerCase() &&
                              (t.type === 'stakeholder' || t.type === 'influencer')
                            )
                            const isSelected = selectedDiscoveryItems.has(stakeholder)
                            return (
                              <button
                                key={stakeholder}
                                onClick={() => !exists && toggleDiscoveryItem(stakeholder)}
                                disabled={exists}
                                className={`p-2 rounded border text-sm ${
                                  exists ? 'bg-[var(--grey-800)] border-[var(--grey-700)] text-[var(--grey-500)]' :
                                  isSelected ? 'bg-purple-500/20 border-purple-500 text-purple-300' :
                                  'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                                }`}
                              >
                                {stakeholder}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="p-6 flex gap-3" style={{ borderTop: '1px solid var(--grey-800)' }}>
                <button
                  onClick={saveSelectedDiscoveryItems}
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'var(--burnt-orange)', color: 'white', fontFamily: 'var(--font-display)' }}
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : selectedDiscoveryItems.size > 0 ? (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Selected ({selectedDiscoveryItems.size})
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update Profile
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDiscoveryResults(false)}
                  className="px-4 py-2 rounded-lg font-medium"
                  style={{ background: 'var(--grey-800)', color: 'var(--grey-300)' }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
