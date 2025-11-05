'use client'

import React, { useState, useEffect } from 'react'
import { Building2, MapPin, Users, DollarSign, Calendar, Plus, Trash2, Save, Loader, CheckCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface LeadershipMember {
  name: string
  title: string
  email?: string
  linkedin?: string
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
    key_markets: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // New item states
  const [newLeader, setNewLeader] = useState<LeadershipMember>({ name: '', title: '' })
  const [newProduct, setNewProduct] = useState('')
  const [newMarket, setNewMarket] = useState('')

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
      const response = await fetch(`/api/organizations/${organizationId}/profile`)
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
          business_model: cp.business_model || ''
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
      const response = await fetch(`/api/organizations/${organizationId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_profile: profile })
      })

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Company Profile</h3>
          <p className="text-sm text-gray-400">
            Essential company facts used in opportunities, content, and campaigns
          </p>
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium flex items-center gap-2"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Profile
        </button>
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
      <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-cyan-400" />
          <h4 className="text-white font-semibold">Leadership Team</h4>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Add key executives and their actual titles. This prevents AI from making up fake roles.
        </p>

        <div className="space-y-3 mb-4">
          {(profile.leadership || []).map((leader, idx) => (
            <div key={idx} className="p-3 bg-gray-800 border border-gray-700 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-white font-medium">{leader.name}</div>
                  <div className="text-sm text-gray-400">{leader.title}</div>
                  {leader.email && <div className="text-xs text-gray-500 mt-1">{leader.email}</div>}
                  {leader.linkedin && (
                    <a href={leader.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 mt-1 inline-block">
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
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            placeholder="Title"
            value={newLeader.title}
            onChange={(e) => setNewLeader(prev => ({ ...prev, title: e.target.value }))}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={newLeader.email || ''}
            onChange={(e) => setNewLeader(prev => ({ ...prev, email: e.target.value }))}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="url"
            placeholder="LinkedIn URL (optional)"
            value={newLeader.linkedin || ''}
            onChange={(e) => setNewLeader(prev => ({ ...prev, linkedin: e.target.value }))}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <button
          onClick={addLeader}
          disabled={!newLeader.name || !newLeader.title}
          className="mt-3 w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Leader
        </button>
      </div>

      {/* Headquarters */}
      <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-cyan-400" />
          <h4 className="text-white font-semibold">Headquarters</h4>
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
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            placeholder="City"
            value={profile.headquarters?.city || ''}
            onChange={(e) => setProfile(prev => ({
              ...prev,
              headquarters: { ...prev.headquarters, city: e.target.value }
            }))}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            placeholder="State/Province"
            value={profile.headquarters?.state || ''}
            onChange={(e) => setProfile(prev => ({
              ...prev,
              headquarters: { ...prev.headquarters, state: e.target.value }
            }))}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            placeholder="Country"
            value={profile.headquarters?.country || ''}
            onChange={(e) => setProfile(prev => ({
              ...prev,
              headquarters: { ...prev.headquarters, country: e.target.value }
            }))}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Company Size & Details */}
      <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-cyan-400" />
          <h4 className="text-white font-semibold">Company Details</h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Employee Count</label>
            <select
              value={profile.company_size?.employees || ''}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                company_size: { ...prev.company_size, employees: e.target.value }
              }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-cyan-500"
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
            <label className="block text-sm text-gray-400 mb-1">Revenue Tier</label>
            <select
              value={profile.company_size?.revenue_tier || ''}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                company_size: { ...prev.company_size, revenue_tier: e.target.value }
              }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-cyan-500"
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
            <label className="block text-sm text-gray-400 mb-1">Founded</label>
            <input
              type="text"
              placeholder="Year"
              value={profile.founded || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, founded: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Parent Company</label>
            <input
              type="text"
              placeholder="If applicable"
              value={profile.parent_company || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, parent_company: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Business Model</label>
            <input
              type="text"
              placeholder="e.g., B2B SaaS, Consumer marketplace, etc."
              value={profile.business_model || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, business_model: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Product Lines */}
      <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg">
        <h4 className="text-white font-semibold mb-4">Key Product Lines</h4>

        <div className="flex flex-wrap gap-2 mb-3">
          {(profile.product_lines || []).map((product, idx) => (
            <span key={idx} className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-sm text-white flex items-center gap-2">
              {product}
              <button onClick={() => removeProduct(idx)} className="text-gray-400 hover:text-red-400">
                <X className="w-3 h-3" />
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
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={addProduct}
            disabled={!newProduct.trim()}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Markets */}
      <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg">
        <h4 className="text-white font-semibold mb-4">Key Markets</h4>

        <div className="flex flex-wrap gap-2 mb-3">
          {(profile.key_markets || []).map((market, idx) => (
            <span key={idx} className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-sm text-white flex items-center gap-2">
              {market}
              <button onClick={() => removeMarket(idx)} className="text-gray-400 hover:text-red-400">
                <X className="w-3 h-3" />
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
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={addMarket}
            disabled={!newMarket.trim()}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
