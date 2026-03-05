'use client'

import { useState } from 'react'
import { Download, Copy, Check, Database } from 'lucide-react'

interface SaveExportBarProps {
  title: string
  content: any
  organizationId: string
  reportId: string
  folder: string
  onSaved?: () => void
}

export function SaveExportBar({ title, content, organizationId, reportId, folder, onSaved }: SaveExportBarProps) {
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const getMarkdown = () => {
    if (typeof content === 'string') return content
    return `# ${title}\n\n${JSON.stringify(content, null, 2)}`
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getMarkdown())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([getMarkdown()], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSaveToVault = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/content-library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            type: 'intelligence_report',
            title,
            content: getMarkdown(),
            organization_id: organizationId,
            metadata: {
              public_affairs_report_id: reportId,
              section: title,
              source: 'public_affairs_engine'
            }
          },
          folder
        })
      })

      if (response.ok) {
        setSaved(true)
        onSaved?.()
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save to vault:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleSaveToVault}
        disabled={saving || saved}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
          saved
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-white hover:bg-[var(--grey-700)] border border-[var(--grey-700)]'
        }`}
        title="Save to Memory Vault"
      >
        {saved ? <Check className="w-3 h-3" /> : <Database className="w-3 h-3" />}
        {saving ? 'Saving...' : saved ? 'Saved' : 'Vault'}
      </button>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-white hover:bg-[var(--grey-700)] border border-[var(--grey-700)] transition-all"
        title="Copy as Markdown"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button
        onClick={handleDownload}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-white hover:bg-[var(--grey-700)] border border-[var(--grey-700)] transition-all"
        title="Download as Markdown"
      >
        <Download className="w-3 h-3" />
        .md
      </button>
    </div>
  )
}
