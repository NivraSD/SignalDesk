'use client'

import React, { useState, useEffect } from 'react'
import { Building2, MapPin, Users, DollarSign, Calendar, Plus, Trash2, Save, Loader, CheckCircle, AlertCircle, X as CloseIcon, RefreshCw, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface LeadershipMember {
  name: string
  title: string
  email?: string
  linkedin?: string
}

interface StrategicGoal {
  goal: string
  timeframe: string
  priority: 'high' | 'medium' | 'low'
}

interface CompanyProfile {
  leadership?: LeadershipMember[]
  headquarters?: {
    address?: string
    city?: string
    state?: string
    country?: string
    zip?: string
  }
  company_size?: {
    employees?: string
    revenue_tier?: string
  }
  founded?: string
  parent_company?: string
  product_lines?: string[]
  key_markets?: string[]
  business_model?: string
  strategic_goals?: StrategicGoal[]
}

interface CompanyProfileTabProps {
  organizationId: string
  organizationName: string
}

export default function CompanyProfileTab({
  organizationId,
  organizationName
}: CompanyProfileTabProps) {
  const [profile, setProfile] = useState<CompanyProfile>({
    leadership: [],
    headquarters: {},
    company_size: {},
    product_lines: [],
    key_markets: [],
    strategic_goals: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // New item states
  const [newLeader, setNewLeader] = useState<LeadershipMember>({ name: '', title: '' })
  const [newProduct, setNewProduct] = useState('')
  const [newMarket, setNewMarket] = useState('')
  const [newGoal, setNewGoal] = useState<StrategicGoal>({ goal: '', timeframe: '', priority: 'medium' })

  useEffect(() => {
    if (organizationId) {
      loadProfile()
    }
  }, [organizationId])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use API route instead of client-side Supabase to avoid schema cache issues
      const response = await fetch(`/api/organizations/profile?id=${organizationId}`)

      if (!response.ok) {
        const text = await response.text()
        console.error('Failed to load profile:', response.status, text)
        setLoading(false)
        return
      }

      const data = await response.json()

      if (!response.ok || !data.success) {
        // If profile doesn't exist yet or error, use empty profile
        console.warn('Company profile not loaded, using empty profile')
        setLoading(false)
        return
      }

      if (data.organization?.company_profile) {
        const cp = data.organization.company_profile
        setProfile({
          leadership: cp.leadership || [],
          headquarters: cp.headquarters || {},
          company_size: cp.company_size || {},
          founded: cp.founded || '',
          parent_company: cp.parent_company || '',
          product_lines: cp.product_lines || [],
          key_markets: cp.key_markets || [],
          business_model: cp.business_model || '',
          strategic_goals: cp.strategic_goals || []
        })
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err)
      // Don't set error - just use empty profile
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)


      // Use API route instead of client-side Supabase to avoid schema cache issues
      const response = await fetch(`/api/organizations/profile?id=${organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_profile: profile })
      })


      if (!response.ok) {
        const text = await response.text()
        console.error('Response text:', text)
        throw new Error(`Failed to save profile: ${response.status} - ${text}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to save profile')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Failed to save profile:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const addLeader = () => {
    if (!newLeader.name || !newLeader.title) return
    setProfile(prev => ({
      ...prev,
      leadership: [...(prev.leadership || []), { ...newLeader }]
    }))
    setNewLeader({ name: '', title: '' })
  }

  const removeLeader = (index: number) => {
    setProfile(prev => ({
      ...prev,
      leadership: (prev.leadership || []).filter((_, i) => i !== index)
    }))
  }

  const addProduct = () => {
    if (!newProduct.trim()) return
    setProfile(prev => ({
      ...prev,
      product_lines: [...(prev.product_lines || []), newProduct.trim()]
    }))
    setNewProduct('')
  }

  const removeProduct = (index: number) => {
    setProfile(prev => ({
      ...prev,
      product_lines: (prev.product_lines || []).filter((_, i) => i !== index)
    }))
  }

  const addMarket = () => {
    if (!newMarket.trim()) return
    setProfile(prev => ({
      ...prev,
      key_markets: [...(prev.key_markets || []), newMarket.trim()]
    }))
    setNewMarket('')
  }

  const removeMarket = (index: number) => {
    setProfile(prev => ({
      ...prev,
      key_markets: (prev.key_markets || []).filter((_, i) => i !== index)
    }))
  }

  const addGoal = () => {
    if (!newGoal.goal.trim()) return
    setProfile(prev => ({
      ...prev,
      strategic_goals: [...(prev.strategic_goals || []), { ...newGoal }]
    }))
    setNewGoal({ goal: '', timeframe: '', priority: 'medium' })
  }

  const removeGoal = (index: number) => {
    setProfile(prev => ({
      ...prev,
      strategic_goals: (prev.strategic_goals || []).filter((_, i) => i !== index)
    }))
  }

  const generateFromSchema = async () => {
    try {
      setGenerating(true)
      setError(null)
      setSuccess(false)

      const response = await fetch(`/api/organizations/generate-profile?id=${organizationId}`, {
        method: 'POST'
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Failed to generate profile: ${text}`)
      }

      const data = await response.json()

      if (!data.success || !data.profile) {
        throw new Error(data.error || 'Failed to generate profile')
      }


      // Merge generated profile with existing data
      const mergedProfile = {
        leadership: data.profile.leadership || profile.leadership,
        headquarters: data.profile.headquarters || profile.headquarters,
        company_size: data.profile.company_size || profile.company_size,
        founded: data.profile.founded || profile.founded,
        parent_company: data.profile.parent_company || profile.parent_company,
        product_lines: data.profile.product_lines?.length ? data.profile.product_lines : profile.product_lines,
        key_markets: data.profile.key_markets?.length ? data.profile.key_markets : profile.key_markets,
        business_model: data.profile.business_model || profile.business_model,
        strategic_goals: data.profile.strategic_goals?.length ? data.profile.strategic_goals : profile.strategic_goals
      }

      setProfile(mergedProfile)

      // Auto-save after generating
      const saveResponse = await fetch(`/api/organizations/profile?id=${organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_profile: mergedProfile })
      })

      if (!saveResponse.ok) {
        const text = await saveResponse.text()
        console.error('Auto-save failed:', text)
        throw new Error(`Failed to save generated profile: ${text}`)
      }

      await saveResponse.json()

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Failed to generate profile:', err)
      setError(err.message)
    } finally {
      setGenerating(false)
    }
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
          <h3 className="text-lg font-medium text-white" style={{ fontFamily: 'var(--font-display)' }}>Company Profile</h3>
          <p className="text-sm" style={{ color: 'var(--grey-400)' }}>
            Essential company facts used in opportunities, content, and campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              generateFromSchema()
            }}
            disabled={generating}
            className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--grey-800)', color: 'var(--grey-300)', fontFamily: 'var(--font-display)' }}
          >
            {generating ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Generate from Schema
          </button>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--burnt-orange)', color: 'white', fontFamily: 'var(--font-display)' }}
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
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
            <span className="text-green-400">Profile saved successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leadership Team */}
      <div className="p-6 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" style={{ color: 'var(--burnt-orange)' }} />
          <h4 className="text-white font-medium" style={{ fontFamily: 'var(--font-display)' }}>Leadership Team</h4>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--grey-400)' }}>
          Add key executives and their actual titles. This prevents AI from making up fake roles.
        </p>

        <div className="space-y-3 mb-4">
          {(profile.leadership || []).map((leader, idx) => (
            <div key={idx} className="p-3 rounded-lg" style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-white font-medium">{leader.name}</div>
                  <div className="text-sm" style={{ color: 'var(--grey-400)' }}>{leader.title}</div>
                  {leader.email && <div className="text-xs mt-1" style={{ color: 'var(--grey-500)' }}>{leader.email}</div>}
                  {leader.linkedin && (
                    <a href={leader.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs mt-1 inline-block" style={{ color: 'var(--burnt-orange)' }}>
                      LinkedIn Profile
                    </a>
                  )}
                </div>
                <button
                  onClick={() => removeLeader(idx)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Name"
            value={newLeader.name}
            onChange={(e) => setNewLeader(prev => ({ ...prev, name: e.target.value }))}
            className="px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
            style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
          />
          <input
            type="text"
            placeholder="Title"
            value={newLeader.title}
            onChange={(e) => setNewLeader(prev => ({ ...prev, title: e.target.value }))}
            className="px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
            style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={newLeader.email || ''}
            onChange={(e) => setNewLeader(prev => ({ ...prev, email: e.target.value }))}
            className="px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
            style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
          />
          <input
            type="url"
            placeholder="LinkedIn URL (optional)"
            value={newLeader.linkedin || ''}
            onChange={(e) => setNewLeader(prev => ({ ...prev, linkedin: e.target.value }))}
            className="px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
            style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
          />
        </div>
        <button
          onClick={addLeader}
          disabled={!newLeader.name || !newLeader.title}
          className="mt-3 w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'var(--grey-800)', color: 'var(--grey-300)' }}
        >
          <Plus className="w-4 h-4" />
          Add Leader
        </button>
      </div>

      {/* Headquarters */}
      <div className="p-6 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5" style={{ color: 'var(--burnt-orange)' }} />
          <h4 className="text-white font-medium" style={{ fontFamily: 'var(--font-display)' }}>Headquarters</h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Address"
            value={profile.headquarters?.address || ''}
            onChange={(e) => setProfile(prev => ({
              ...prev,
              headquarters: { ...prev.headquarters, address: e.target.value }
            }))}
            className="px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
            style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
          />
          <input
            type="text"
            placeholder="City"
            value={profile.headquarters?.city || ''}
            onChange={(e) => setProfile(prev => ({
              ...prev,
              headquarters: { ...prev.headquarters, city: e.target.value }
            }))}
            className="px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
            style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
          />
          <input
            type="text"
            placeholder="State/Province"
            value={profile.headquarters?.state || ''}
            onChange={(e) => setProfile(prev => ({
              ...prev,
              headquarters: { ...prev.headquarters, state: e.target.value }
            }))}
            className="px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
            style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
          />
          <input
            type="text"
            placeholder="Country"
            value={profile.headquarters?.country || ''}
            onChange={(e) => setProfile(prev => ({
              ...prev,
              headquarters: { ...prev.headquarters, country: e.target.value }
            }))}
            className="px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
            style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
          />
        </div>
      </div>

      {/* Company Size & Details */}
      <div className="p-6 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5" style={{ color: 'var(--burnt-orange)' }} />
          <h4 className="text-white font-medium" style={{ fontFamily: 'var(--font-display)' }}>Company Details</h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--grey-400)' }}>Employee Count</label>
            <select
              value={profile.company_size?.employees || ''}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                company_size: { ...prev.company_size, employees: e.target.value }
              }))}
              className="w-full px-3 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
              style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
            >
              <option value="">Select range</option>
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">51-200</option>
              <option value="201-500">201-500</option>
              <option value="501-1000">501-1000</option>
              <option value="1001-5000">1001-5000</option>
              <option value="5000+">5000+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--grey-400)' }}>Revenue Tier</label>
            <select
              value={profile.company_size?.revenue_tier || ''}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                company_size: { ...prev.company_size, revenue_tier: e.target.value }
              }))}
              className="w-full px-3 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
              style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
            >
              <option value="">Select range</option>
              <option value="<$1M">&lt;$1M</option>
              <option value="$1M-$10M">$1M-$10M</option>
              <option value="$10M-$50M">$10M-$50M</option>
              <option value="$50M-$100M">$50M-$100M</option>
              <option value="$100M-$500M">$100M-$500M</option>
              <option value="$500M-$1B">$500M-$1B</option>
              <option value="$1B+">$1B+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--grey-400)' }}>Founded</label>
            <input
              type="text"
              placeholder="Year"
              value={profile.founded || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, founded: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
              style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--grey-400)' }}>Parent Company</label>
            <input
              type="text"
              placeholder="If applicable"
              value={profile.parent_company || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, parent_company: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
              style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm mb-1" style={{ color: 'var(--grey-400)' }}>Business Model</label>
            <input
              type="text"
              placeholder="e.g., B2B SaaS, Consumer marketplace, etc."
              value={profile.business_model || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, business_model: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
              style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
            />
          </div>
        </div>
      </div>

      {/* Product Lines */}
      <div className="p-6 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
        <h4 className="text-white font-medium mb-4" style={{ fontFamily: 'var(--font-display)' }}>Key Product Lines</h4>

        <div className="flex flex-wrap gap-2 mb-3">
          {(profile.product_lines || []).map((product, idx) => (
            <span key={idx} className="px-3 py-1 rounded-full text-sm text-white flex items-center gap-2" style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}>
              {product}
              <button onClick={() => removeProduct(idx)} className="hover:text-red-400" style={{ color: 'var(--grey-400)' }}>
                <CloseIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add product or service"
            value={newProduct}
            onChange={(e) => setNewProduct(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addProduct()}
            className="flex-1 px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
            style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
          />
          <button
            onClick={addProduct}
            disabled={!newProduct.trim()}
            className="px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--burnt-orange)', color: 'white' }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Markets */}
      <div className="p-6 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
        <h4 className="text-white font-medium mb-4" style={{ fontFamily: 'var(--font-display)' }}>Key Markets</h4>

        <div className="flex flex-wrap gap-2 mb-3">
          {(profile.key_markets || []).map((market, idx) => (
            <span key={idx} className="px-3 py-1 rounded-full text-sm text-white flex items-center gap-2" style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}>
              {market}
              <button onClick={() => removeMarket(idx)} className="hover:text-red-400" style={{ color: 'var(--grey-400)' }}>
                <CloseIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add geographic market"
            value={newMarket}
            onChange={(e) => setNewMarket(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addMarket()}
            className="flex-1 px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
            style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
          />
          <button
            onClick={addMarket}
            disabled={!newMarket.trim()}
            className="px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--burnt-orange)', color: 'white' }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Strategic Goals */}
      <div className="p-6 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5" style={{ color: 'var(--burnt-orange)' }} />
          <h4 className="text-white font-medium" style={{ fontFamily: 'var(--font-display)' }}>Strategic Goals</h4>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--grey-400)' }}>
          Define your organization's strategic goals. These will be used to generate more relevant opportunities and content.
        </p>

        <div className="space-y-3 mb-4">
          {(profile.strategic_goals || []).map((goal, idx) => (
            <div key={idx} className="p-3 rounded-lg" style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      goal.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      goal.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)]'
                    }`}>
                      {goal.priority}
                    </span>
                    {goal.timeframe && (
                      <span className="text-xs" style={{ color: 'var(--grey-500)' }}>{goal.timeframe}</span>
                    )}
                  </div>
                  <div className="text-white">{goal.goal}</div>
                </div>
                <button
                  onClick={() => removeGoal(idx)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input
                type="text"
                placeholder="Strategic goal (e.g., Expand into European markets)"
                value={newGoal.goal}
                onChange={(e) => setNewGoal(prev => ({ ...prev, goal: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
                style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
              />
            </div>
            <input
              type="text"
              placeholder="Timeframe (e.g., 2025 Q2-Q4)"
              value={newGoal.timeframe}
              onChange={(e) => setNewGoal(prev => ({ ...prev, timeframe: e.target.value }))}
              className="px-3 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
              style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
            />
            <select
              value={newGoal.priority}
              onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value as 'high' | 'medium' | 'low' }))}
              className="px-3 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
              style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
          <button
            onClick={addGoal}
            disabled={!newGoal.goal.trim()}
            className="w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--grey-800)', color: 'var(--grey-300)' }}
          >
            <Plus className="w-4 h-4" />
            Add Strategic Goal
          </button>
        </div>
      </div>
    </div>
  )
}
