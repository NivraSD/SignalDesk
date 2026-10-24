// Dates and versions in free text, in the formats people actually write them.
// Every date is normalized to the ISO start of its period plus a precision, so "Q3 2026" doesn't
// pretend to be a specific day:
//   day      2026-07-01, 07/01/2026, 7/1/26, July 1, 2026, 1 July 2026, Jul 1 '26, Sept 30 (year inferred)
//   month    October 2026, Oct 2026, Oct. '26, 10/2026
//   quarter  Q3 2026, 3Q26, Q3 FY26, Q3'26
//   half     H1 2027, 1H27, H2 FY2026
//   year     FY2026, FY26, CY2026
export type Precision = 'day' | 'month' | 'quarter' | 'half' | 'year'
export type FoundDate = { text: string; date: string; precision: Precision; index: number }

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6,
  jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
}
const M = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?'

const pad = (n: number) => String(n).padStart(2, '0')
const year4 = (y: string) => (y.length === 2 ? 2000 + Number(y) : Number(y))
const valid = (y: number, m: number, d: number) => y >= 1990 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= new Date(Date.UTC(y, m, 0)).getUTCDate()
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`

export function findDates(text: string, defaultYear?: number): FoundDate[] {
  const out: FoundDate[] = []
  const taken: [number, number][] = []
  const add = (m: RegExpExecArray, date: string | null, precision: Precision) => {
    if (!date) return
    const s = m.index, e = m.index + m[0].length
    if (taken.some(([a, b]) => s < b && e > a)) return
    taken.push([s, e])
    out.push({ text: m[0].trim(), date, precision, index: s })
  }
  const run = (re: RegExp, fn: (m: RegExpExecArray) => [string | null, Precision]) => {
    for (const m of text.matchAll(re)) { const [d, p] = fn(m as RegExpExecArray); add(m as RegExpExecArray, d, p) }
  }
  // Most specific first.
  run(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (m) => [valid(+m[1], +m[2], +m[3]) ? iso(+m[1], +m[2], +m[3]) : null, 'day'])
  const yr = (y: string) => year4(y.replace("'", ''))
  run(new RegExp(`\\b${M}\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4}|'\\d{2})\\b`, 'gi'), (m) => {
    const mo = MONTHS[m[1].toLowerCase().replace('.', '')], d = +m[2], y = yr(m[3])
    return [valid(y, mo, d) ? iso(y, mo, d) : null, 'day']
  })
  run(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${M},?\\s+(\\d{4}|'\\d{2})\\b`, 'gi'), (m) => {
    const mo = MONTHS[m[2].toLowerCase().replace('.', '')], d = +m[1], y = yr(m[3])
    return [valid(y, mo, d) ? iso(y, mo, d) : null, 'day']
  })
  run(/\b(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})\b/g, (m) => {
    const mo = +m[1], d = +m[2], y = year4(m[3]) // US order (Nivria is US-based)
    return [valid(y, mo, d) ? iso(y, mo, d) : null, 'day']
  })
  run(/\b(?:Q([1-4])\s*(?:FY|CY)?\s*'?(\d{4}|\d{2})|([1-4])Q\s*'?(\d{2}|\d{4}))\b/gi, (m) => {
    const q = +(m[1] || m[3]), y = year4(m[2] || m[4])
    return [y >= 1990 && y <= 2100 ? iso(y, (q - 1) * 3 + 1, 1) : null, 'quarter']
  })
  run(/\b(?:H([12])\s*(?:FY|CY)?\s*'?(\d{4}|\d{2})|([12])H\s*'?(\d{2}|\d{4}))\b/gi, (m) => {
    const h = +(m[1] || m[3]), y = year4(m[2] || m[4])
    return [y >= 1990 && y <= 2100 ? iso(y, h === 1 ? 1 : 7, 1) : null, 'half']
  })
  run(new RegExp(`\\b${M}\\s+(\\d{4}|'\\d{2})\\b`, 'gi'), (m) => {
    const mo = MONTHS[m[1].toLowerCase().replace('.', '')], y = yr(m[2])
    return [y >= 1990 && y <= 2100 ? iso(y, mo, 1) : null, 'month']
  })
  run(/\b(\d{1,2})\/(\d{4})\b/g, (m) => [+m[1] >= 1 && +m[1] <= 12 ? iso(+m[2], +m[1], 1) : null, 'month'])
  run(/\b(?:FY|CY)\s*'?(\d{4}|\d{2})\b/gi, (m) => { const y = year4(m[1]); return [y >= 1990 && y <= 2100 ? iso(y, 1, 1) : null, 'year'] })
  if (defaultYear) {
    // "Sept 30" / "July 1" with no year: assume the document's year.
    run(new RegExp(`\\b${M}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?!,?\\s*'?\\d)`, 'gi'), (m) => {
      const mo = MONTHS[m[1].toLowerCase().replace('.', '')], d = +m[2]
      return [valid(defaultYear, mo, d) ? iso(defaultYear, mo, d) : null, 'day']
    })
  }
  return out.sort((a, b) => a.index - b.index)
}

// The document's own date: one introduced by "effective", "as of", "updated", "dated", "issued"…
// near the top; otherwise the first full date on the first page.
export function documentDate(text: string): FoundDate | null {
  const head = text.slice(0, 4000)
  const all = findDates(head)
  const cue = /(effective|as of|last (?:updated|revised)|updated|revised|dated|issued|approved|published|date)\b[^\n]{0,40}$/i
  const cued = all.find((d) => cue.test(head.slice(Math.max(0, d.index - 50), d.index)))
  return cued || all.find((d) => d.precision === 'day') || all[0] || null
}

// "v2.0", "Version 1.3", "Rev. 4", "Revision 2" → 2.0 / 1.3 / 4 / 2
export function parseVersion(text: string | null | undefined): number | null {
  if (!text) return null
  const m = String(text).match(/\b(?:v|ver\.?|version|rev\.?|revision)\s*(\d+(?:\.\d+)?)/i) || String(text).match(/^\s*(\d+(?:\.\d+)?)\s*$/)
  return m ? Number(m[1]) : null
}

// Only these document types are *revised* (a new version replaces the old). Board decks, investor
// updates, memos, research and precedent are separate periods/events and never supersede each other.
export const VERSIONED_TYPES = new Set(['policy', 'playbook', 'brand'])

// Groups versions of the same document: "Travel & Expense Policy (v1.3)" and
// "Travel and Expense Policy — 2026" both → "travel expense policy".
export function seriesKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\((?:[^)]*\b(?:v\d|version|rev|draft|superseded|updated|20\d\d)[^)]*)\)/g, ' ')
    .replace(/\b(?:v|ver\.?|version|rev\.?|revision)\s*\d+(?:\.\d+)*\b/g, ' ')
    .replace(/\b(?:19|20)\d\d\b|\b(?:q[1-4]|h[12]|fy\d{2,4})\b/g, ' ')
    .replace(/\b(?:draft|superseded|final|updated|new|current)\b/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/\band\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}
