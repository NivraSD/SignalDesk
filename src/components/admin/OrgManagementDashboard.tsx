'use client'

import React, { useState, useEffect } from 'react'
import { Building2, Target, Users, FileText, TrendingUp, Plus, Settings, Trash2, X, Loader, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

interface Organization {
  id: string
  name: string
  industry?: string
  url?: string
  created_at: string
  targetCount?: number
  contentCount?: number
  predictionCount?: number
}

interface OrgManagementDashboardProps {
  isOpen: boolean
  onClose: () => void
  onNewOrg: () => void
  onSelectOrg: (org: Organization) => void
  onManageTargets: (org: Organization) => void
  onDeleteOrg: (org: Organization) => void
}

export default function OrgManagementDashboard({
  isOpen,
  onClose,
  onNewOrg,
  onSelectOrg,
  onManageTargets,
  onDeleteOrg
}: OrgManagementDashboardProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadOrganizations()
    }
  }, [isOpen])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load organizations
      const response = await fetch('/api/organizations')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load organizations')
      }

      const orgs = data.organizations || []

      // Load stats for each organization
      const orgsWithStats = await Promise.all(
        orgs.map(async (org: Organization) => {
          try {
            // Get target count
            const targetsResponse = await fetch(`/api/organizations/targets?organization_id=${org.id}`)
            const targetsData = await targetsResponse.json()
            const targetCount = targetsData.targets?.length || 0

            // Get content count (from content_library)
            // Get prediction count (from predictions)
            // For now, we'll set these to 0 as they require more complex queries

            return {
              ...org,
              targetCount,
              contentCount: 0,
              predictionCount: 0
            }
          } catch (err) {
            console.error(`Failed to load stats for ${org.name}:`, err)
            return {
              ...org,
              targetCount: 0,
              contentCount: 0,
              predictionCount: 0
            }
          }
        })
      )

      setOrganizations(orgsWithStats)
    } catch (err: any) {
      console.error('Failed to load organizations:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Organization Management</h2>
              <p className="text-sm text-gray-400">{organizations.length} organizations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadOrganizations}
              disabled={loading}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* New Org Button */}
          <button
            onClick={() => {
              onClose()
              onNewOrg()
            }}
            className="mb-6 w-full px-4 py-3 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-400 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create New Organization
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadOrganizations}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No organizations yet</p>
              <p className="text-sm text-gray-500">Create your first organization to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="p-5 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                >
                  {/* Org Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{org.name}</h3>
                      {org.industry && (
                        <p className="text-sm text-gray-400">{org.industry}</p>
                      )}
                      {org.url && (
                        <a
                          href={org.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-violet-400 hover:text-violet-300 underline"
                        >
                          {org.url}
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => onDeleteOrg(org)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                      title="Delete organization"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-900 rounded-lg p-3 text-center">
                      <Target className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{org.targetCount}</p>
                      <p className="text-xs text-gray-500">Targets</p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3 text-center">
                      <FileText className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{org.contentCount}</p>
                      <p className="text-xs text-gray-500">Content</p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3 text-center">
                      <TrendingUp className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{org.predictionCount}</p>
                      <p className="text-xs text-gray-500">Predictions</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onClose()
                        onSelectOrg(org)
                      }}
                      className="flex-1 px-3 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm rounded-lg font-medium transition-colors"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => {
                        onClose()
                        onManageTargets(org)
                      }}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg font-medium transition-colors"
                      title="Manage targets"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Created date */}
                  <p className="text-xs text-gray-500 mt-3">
                    Created {new Date(org.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
