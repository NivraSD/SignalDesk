'use client'

import React, { useState, useEffect } from 'react'
import { Mic2, Plus, X as CloseIcon, Save, Loader, CheckCircle, AlertCircle, Sparkles, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BrandVoice {
  // Sliders (0-100 scale)
  formality: number      // 0 = casual, 100 = formal
  technicality: number   // 0 = accessible, 100 = technical
  boldness: number       // 0 = conservative, 100 = bold

  // Adjectives that describe the brand
  adjectives: string[]

  // Reference companies/brands they want to sound like
  references: string[]

  // Things to avoid
  avoid: string[]

  // Free text notes
  notes: string
}

interface BrandVoiceTabProps {
  organizationId: string
  organizationName: string
}

const ADJECTIVE_OPTIONS = [
  'Authoritative', 'Friendly', 'Innovative', 'Trustworthy', 'Bold',
  'Understated', 'Technical', 'Human', 'Professional', 'Approachable',
  'Visionary', 'Reliable', 'Disruptive', 'Traditional', 'Modern',
  'Warm', 'Precise', 'Dynamic', 'Calm', 'Energetic'
]

const AVOID_SUGGESTIONS = [
  'Marketing speak', 'Buzzwords', 'Jargon', 'Exclamation points',
  'Emojis', 'Hyperbole', 'Passive voice', 'Long sentences',
  'Technical acronyms', 'Sales-y language', 'Clichés'
]

export default function BrandVoiceTab({
  organizationId,
  organizationName
}: BrandVoiceTabProps) {
  const [brandVoice, setBrandVoice] = useState<BrandVoice>({
    formality: 50,
    technicality: 50,
    boldness: 50,
    adjectives: [],
    references: [],
    avoid: [],
    notes: ''
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Input states
  const [newReference, setNewReference] = useState('')
  const [newAvoid, setNewAvoid] = useState('')

  useEffect(() => {
    if (organizationId) {
      loadBrandVoice()
    }
  }, [organizationId])

  const loadBrandVoice = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/organizations/profile?id=${organizationId}`)
      if (!response.ok) {
        setLoading(false)
        return
      }

      const data = await response.json()
      if (data.success && data.organization?.company_profile?.brand_voice) {
        const bv = data.organization.company_profile.brand_voice
        setBrandVoice({
          formality: bv.formality ?? 50,
          technicality: bv.technicality ?? 50,
          boldness: bv.boldness ?? 50,
          adjectives: bv.adjectives || [],
          references: bv.references || [],
          avoid: bv.avoid || [],
          notes: bv.notes || ''
        })
      }
    } catch (err: any) {
      console.error('Failed to load brand voice:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveBrandVoice = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Get current company_profile first
      const getResponse = await fetch(`/api/organizations/profile?id=${organizationId}`)
      const getData = await getResponse.json()
      const currentProfile = getData.organization?.company_profile || {}

      // Merge brand_voice into company_profile
      const updatedProfile = {
        ...currentProfile,
        brand_voice: brandVoice
      }

      const response = await fetch(`/api/organizations/profile?id=${organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_profile: updatedProfile })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Failed to save: ${text}`)
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Failed to save brand voice:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const analyzeFromWebsite = async () => {
    try {
      setAnalyzing(true)
      setError(null)

      // Call mcp-discovery to analyze website and suggest brand voice
      const response = await fetch('/api/organizations/analyze-brand-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze website')
      }

      const data = await response.json()
      if (data.success && data.brand_voice) {
        setBrandVoice(prev => ({
          ...prev,
          ...data.brand_voice
        }))
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err: any) {
      console.error('Failed to analyze brand voice:', err)
      setError('Could not analyze website. Please set brand voice manually.')
    } finally {
      setAnalyzing(false)
    }
  }

  const toggleAdjective = (adj: string) => {
    setBrandVoice(prev => ({
      ...prev,
      adjectives: prev.adjectives.includes(adj)
        ? prev.adjectives.filter(a => a !== adj)
        : [...prev.adjectives, adj].slice(0, 5) // Max 5
    }))
  }

  const addReference = () => {
    if (!newReference.trim()) return
    setBrandVoice(prev => ({
      ...prev,
      references: [...prev.references, newReference.trim()].slice(0, 5)
    }))
    setNewReference('')
  }

  const removeReference = (ref: string) => {
    setBrandVoice(prev => ({
      ...prev,
      references: prev.references.filter(r => r !== ref)
    }))
  }

  const toggleAvoid = (item: string) => {
    setBrandVoice(prev => ({
      ...prev,
      avoid: prev.avoid.includes(item)
        ? prev.avoid.filter(a => a !== item)
        : [...prev.avoid, item]
    }))
  }

  const addCustomAvoid = () => {
    if (!newAvoid.trim()) return
    setBrandVoice(prev => ({
      ...prev,
      avoid: [...prev.avoid, newAvoid.trim()]
    }))
    setNewAvoid('')
  }

  const removeAvoid = (item: string) => {
    setBrandVoice(prev => ({
      ...prev,
      avoid: prev.avoid.filter(a => a !== item)
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin" style={{ color: 'var(--burnt-orange)' }} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Brand Voice
          </h3>
          <p className="text-sm" style={{ color: 'var(--grey-400)' }}>
            Define how Niv should communicate for {organizationName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={analyzeFromWebsite}
            disabled={analyzing}
            className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--grey-800)', color: 'var(--grey-300)', fontFamily: 'var(--font-display)' }}
          >
            {analyzing ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Analyze Website
          </button>
          <button
            onClick={saveBrandVoice}
            disabled={saving}
            className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--burnt-orange)', color: 'white', fontFamily: 'var(--font-display)' }}
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400">Brand voice saved successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Spectrum Sliders */}
      <div className="p-6 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Mic2 className="w-5 h-5" style={{ color: 'var(--burnt-orange)' }} />
          <h4 className="text-white font-medium" style={{ fontFamily: 'var(--font-display)' }}>Voice Spectrum</h4>
        </div>
        <p className="text-sm mb-6" style={{ color: 'var(--grey-400)' }}>
          Adjust these sliders to define where your brand falls on each spectrum
        </p>

        <div className="space-y-6">
          {/* Formality Slider */}
          <div>
            <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--grey-400)' }}>
              <span>Casual</span>
              <span>Formal</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={brandVoice.formality}
              onChange={(e) => setBrandVoice(prev => ({ ...prev, formality: parseInt(e.target.value) }))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--burnt-orange) ${brandVoice.formality}%, var(--grey-700) ${brandVoice.formality}%)`
              }}
            />
          </div>

          {/* Technicality Slider */}
          <div>
            <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--grey-400)' }}>
              <span>Accessible</span>
              <span>Technical</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={brandVoice.technicality}
              onChange={(e) => setBrandVoice(prev => ({ ...prev, technicality: parseInt(e.target.value) }))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--burnt-orange) ${brandVoice.technicality}%, var(--grey-700) ${brandVoice.technicality}%)`
              }}
            />
          </div>

          {/* Boldness Slider */}
          <div>
            <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--grey-400)' }}>
              <span>Conservative</span>
              <span>Bold</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={brandVoice.boldness}
              onChange={(e) => setBrandVoice(prev => ({ ...prev, boldness: parseInt(e.target.value) }))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--burnt-orange) ${brandVoice.boldness}%, var(--grey-700) ${brandVoice.boldness}%)`
              }}
            />
          </div>
        </div>
      </div>

      {/* Brand Adjectives */}
      <div className="p-6 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
        <h4 className="text-white font-medium mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Brand Personality
        </h4>
        <p className="text-sm mb-4" style={{ color: 'var(--grey-400)' }}>
          Select up to 5 words that describe your brand personality
        </p>

        <div className="flex flex-wrap gap-2">
          {ADJECTIVE_OPTIONS.map((adj) => {
            const isSelected = brandVoice.adjectives.includes(adj)
            return (
              <button
                key={adj}
                onClick={() => toggleAdjective(adj)}
                disabled={!isSelected && brandVoice.adjectives.length >= 5}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  isSelected
                    ? 'bg-[var(--burnt-orange)] text-white'
                    : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:bg-[var(--grey-700)] disabled:opacity-50'
                }`}
              >
                {adj}
              </button>
            )
          })}
        </div>

        {brandVoice.adjectives.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--grey-800)]">
            <p className="text-xs mb-2" style={{ color: 'var(--grey-500)' }}>Selected ({brandVoice.adjectives.length}/5):</p>
            <div className="flex flex-wrap gap-2">
              {brandVoice.adjectives.map((adj) => (
                <span
                  key={adj}
                  className="px-3 py-1 rounded-full text-sm text-white flex items-center gap-2"
                  style={{ background: 'var(--burnt-orange)' }}
                >
                  {adj}
                  <button onClick={() => toggleAdjective(adj)} className="hover:text-red-200">
                    <CloseIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reference Companies */}
      <div className="p-6 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
        <h4 className="text-white font-medium mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Voice References
        </h4>
        <p className="text-sm mb-4" style={{ color: 'var(--grey-400)' }}>
          Companies or brands whose communication style you admire (e.g., "Anthropic", "Apple", "Stripe")
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {brandVoice.references.map((ref) => (
            <span
              key={ref}
              className="px-3 py-1 rounded-full text-sm text-white flex items-center gap-2"
              style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
            >
              {ref}
              <button onClick={() => removeReference(ref)} className="hover:text-red-400" style={{ color: 'var(--grey-400)' }}>
                <CloseIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a company..."
            value={newReference}
            onChange={(e) => setNewReference(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addReference()}
            className="flex-1 px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
            style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
          />
          <button
            onClick={addReference}
            disabled={!newReference.trim() || brandVoice.references.length >= 5}
            className="px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--burnt-orange)', color: 'white' }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Things to Avoid */}
      <div className="p-6 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
        <h4 className="text-white font-medium mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Things to Avoid
        </h4>
        <p className="text-sm mb-4" style={{ color: 'var(--grey-400)' }}>
          Select or add items Niv should avoid when creating content for you
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {AVOID_SUGGESTIONS.map((item) => {
            const isSelected = brandVoice.avoid.includes(item)
            return (
              <button
                key={item}
                onClick={() => toggleAvoid(item)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  isSelected
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:bg-[var(--grey-700)]'
                }`}
              >
                {item}
              </button>
            )
          })}
        </div>

        {/* Custom avoid items */}
        {brandVoice.avoid.filter(a => !AVOID_SUGGESTIONS.includes(a)).length > 0 && (
          <div className="mb-4">
            <p className="text-xs mb-2" style={{ color: 'var(--grey-500)' }}>Custom:</p>
            <div className="flex flex-wrap gap-2">
              {brandVoice.avoid.filter(a => !AVOID_SUGGESTIONS.includes(a)).map((item) => (
                <span
                  key={item}
                  className="px-3 py-1 rounded-full text-sm text-red-400 flex items-center gap-2"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                >
                  {item}
                  <button onClick={() => removeAvoid(item)} className="hover:text-red-300">
                    <CloseIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add custom item to avoid..."
            value={newAvoid}
            onChange={(e) => setNewAvoid(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomAvoid()}
            className="flex-1 px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
            style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
          />
          <button
            onClick={addCustomAvoid}
            disabled={!newAvoid.trim()}
            className="px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--grey-800)', color: 'var(--grey-300)' }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="p-6 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
        <h4 className="text-white font-medium mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Additional Guidelines
        </h4>
        <p className="text-sm mb-4" style={{ color: 'var(--grey-400)' }}>
          Any other notes about how content should be written for your brand
        </p>

        <textarea
          value={brandVoice.notes}
          onChange={(e) => setBrandVoice(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="e.g., Always lead with data, use Oxford commas, avoid first-person plural..."
          rows={4}
          className="w-full px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)] resize-none"
          style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
        />
      </div>
    </div>
  )
}
