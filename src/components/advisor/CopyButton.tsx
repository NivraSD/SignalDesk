'use client'

// Copy a NIV message as clean text (Markdown symbols removed, lists and citations kept).
import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function toPlainText(md: string) {
  return md
    .replace(/^#{1,4}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '$1 ($2)')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toPlainText(text))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked; nothing to do */
    }
  }
  return (
    <button onClick={copy} aria-label="Copy message" title="Copy" className="inline-flex items-center gap-1 text-[11px] text-[var(--grey-500)] hover:text-[var(--grey-300)]">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
