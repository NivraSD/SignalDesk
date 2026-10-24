'use client'

// Readable view of Markdown drafts (from NIV and the content engine): headings, bold/italic,
// lists, quotes, dividers, links. No dependency; Studio's Edit mode still shows the raw text.
import React from 'react'

function inline(s: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /\*\*([^*]+)\*\*|\*([^*\n]+)\*|_([^_\n]+)_|\[([^\]]+)\]\((https?:[^)\s]+)\)|(https?:\/\/[^\s)]+)/g
  let last = 0, i = 0, m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index))
    const k = `${key}-${i++}`
    if (m[1]) out.push(<strong key={k}>{m[1]}</strong>)
    else if (m[2] || m[3]) out.push(<em key={k}>{m[2] || m[3]}</em>)
    else {
      const href = m[5] || m[6]
      out.push(<a key={k} href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--burnt-orange)' }}>{m[4] || href}</a>)
    }
    last = m.index + m[0].length
  }
  if (last < s.length) out.push(s.slice(last))
  return out
}

export default function MarkdownView({ text }: { text: string }) {
  const lines = (text || '').replace(/\r\n/g, '\n').split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const t = line.trim()
    if (!t) { i++; continue }
    const k = `b${i}`
    const h = t.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      const cls = level === 1 ? 'text-2xl font-semibold mt-2 mb-3' : level === 2 ? 'text-lg font-semibold mt-6 mb-2' : 'text-base font-semibold mt-4 mb-1.5'
      blocks.push(<div key={k} className={cls} style={{ color: 'var(--white)', fontFamily: 'var(--font-display)' }}>{inline(h[2], k)}</div>)
      i++; continue
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { blocks.push(<hr key={k} className="my-5" style={{ borderColor: 'var(--grey-800)' }} />); i++; continue }
    if (/^>\s?/.test(t)) {
      const q: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) { q.push(lines[i].trim().replace(/^>\s?/, '')); i++ }
      blocks.push(<blockquote key={k} className="border-l-2 pl-4 my-3 italic" style={{ borderColor: 'var(--burnt-orange)', color: 'var(--grey-300)' }}>{inline(q.join(' '), k)}</blockquote>)
      continue
    }
    if (/^([-*•]|\d+[.)])\s+/.test(t)) {
      const ordered = /^\d+[.)]/.test(t)
      const items: string[] = []
      while (i < lines.length && /^([-*•]|\d+[.)])\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^([-*•]|\d+[.)])\s+/, '')); i++ }
      const List = ordered ? 'ol' : 'ul'
      blocks.push(<List key={k} className={`${ordered ? 'list-decimal' : 'list-disc'} pl-6 my-3 space-y-1.5`}>{items.map((it, n) => <li key={n}>{inline(it, `${k}-${n}`)}</li>)}</List>)
      continue
    }
    const para: string[] = [t]
    i++
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|>|([-*•]|\d+[.)])\s+|-{3,}$)/.test(lines[i].trim())) { para.push(lines[i].trim()); i++ }
    blocks.push(<p key={k} className="my-3">{inline(para.join(' '), k)}</p>)
  }
  return <div style={{ color: 'var(--grey-200)', fontSize: '0.95rem', lineHeight: 1.8, fontFamily: 'var(--font-body)' }}>{blocks}</div>
}
