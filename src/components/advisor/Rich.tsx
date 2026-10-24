'use client'

import React from 'react'

// Minimal formatting for NIV's replies: paragraphs, **bold**, bullets, links.
export default function Rich({ text }: { text: string }) {
  const inline = (s: string, key: number) => {
    const parts: React.ReactNode[] = []
    // **bold** | [label](url) | bare URL | [Doc v2.0 §6.1, p2] citation
    const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:[^)\s]+)\)|(https?:\/\/[^\s)]+)|\[([^\]]*?(?:§|\bp\d|Slide \d|\bv\d)[^\]]*)\]/g
    let last = 0
    let m: RegExpExecArray | null
    let i = 0
    while ((m = re.exec(s))) {
      if (m.index > last) parts.push(s.slice(last, m.index))
      if (m[1]) parts.push(<strong key={`${key}-${i++}`} className="text-[var(--grey-100,#f5f5f4)]">{m[1]}</strong>)
      else if (m[5]) parts.push(
        <span key={`${key}-${i++}`} className="inline-block align-baseline mx-0.5 px-1.5 py-0 rounded border border-[var(--grey-700)] text-[10px] leading-4 text-[var(--grey-400)]" title={m[5]}>
          {m[5]}
        </span>
      )
      else {
        const href = m[3] || m[4]
        parts.push(
          <a key={`${key}-${i++}`} href={href} target="_blank" rel="noopener noreferrer" className="underline text-[var(--burnt-orange)] break-all">
            {m[2] || href.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}
          </a>
        )
      }
      last = m.index + m[0].length
    }
    if (last < s.length) parts.push(s.slice(last))
    return parts
  }
  const blocks = text.split(/\n{2,}/)
  return (
    <div className="space-y-2">
      {blocks.map((b, bi) => {
        const lines = b.split('\n')
        if (lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l))) {
          return (
            <ul key={bi} className="list-disc pl-4 space-y-1">
              {lines.map((l, li) => <li key={li}>{inline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ''), bi * 100 + li)}</li>)}
            </ul>
          )
        }
        if (/^#{1,4}\s/.test(b)) return <p key={bi} className="font-semibold text-[var(--grey-200,#e7e5e4)]">{inline(b.replace(/^#{1,4}\s/, ''), bi)}</p>
        return <p key={bi} className="whitespace-pre-wrap">{inline(b, bi)}</p>
      })}
    </div>
  )
}

