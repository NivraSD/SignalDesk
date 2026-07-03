'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { NivriaLogo } from '@/components/brand/NivriaWordmark'

// auto-hide header on scroll-down, reveal on scroll-up
function useHeaderVisible() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        if (y < 80) setVisible(true)
        else if (y > lastY + 4) setVisible(false)
        else if (y < lastY - 4) setVisible(true)
        lastY = y
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return visible
}

const EXPERIENCE = [
  {
    title: 'Saudi Arabia — Public Investment Fund (PIF)',
    body: 'Strategic communications for one of the world’s largest sovereign wealth funds through a period of intense global scrutiny and rapid expansion — spanning the fund’s anchor positions in the SoftBank Vision Fund and Blackstone’s infrastructure fund.',
  },
  {
    title: 'African LNG',
    body: 'Assessment of a major energy development after insurgent activity disrupted operations — ground-level evaluation in a volatile security environment, engagement around U.S. development financing, and the design of a sustained security- and stakeholder-monitoring framework.',
  },
  {
    title: 'Latin American critical minerals',
    body: 'Examination of one of Latin America’s most consequential and contested critical-mineral projects on behalf of an interested party, assessing the political, community, and legal dynamics that would determine its future.',
  },
  {
    title: 'NEOM',
    body: 'Engagement spanning sectors and regions of one of the largest greenfield development initiatives in the world — including the Discover NEOM global roadshow and the launch of the NEOM Investment Fund (NIF).',
  },
  {
    title: 'Industrial environmental crisis',
    body: 'Tightly coordinated strategy across legal, communications, and government-affairs tracks — engagement spanning state, local, and federal levels, from Washington, D.C. to Louisiana.',
  },
  {
    title: 'Foundations',
    body: 'Work with high-profile global foundations formulating and executing mission and strategic priorities amid competing stakeholder interests and public profile.',
  },
  {
    title: 'Combatting terrorism & extremism',
    body: 'Work confronting terrorism and extremism: a multi-country awareness campaign on a designated terror group’s exploitation of civilian airport infrastructure; international roundtables on extremism in the Balkans; and a communications strategy, developed at the request of foreign-policy experts, to support Kurdish information flow after the U.S. withdrawal from northern Syria.',
  },
  {
    title: 'Grain export labor dispute',
    body: 'A labor dispute that shut down grain shipments out of Washington State, a stoppage in a critical national export corridor, worked through to resolution and restored to flow.',
  },
  {
    title: 'Global cultural events',
    body: 'Production and positioning of some of the world’s largest live events, including major international music festivals operating at national scale. (Live Nation.)',
  },
  {
    title: 'Global convenings',
    body: 'Engagement across major global gatherings, on the producer, sponsor, and participant sides, including the Future Investment Initiative (FII), the Milken Institute Global Conference, and the World Economic Forum (WEF).',
  },
]


export default function FounderPage() {
  const visible = useHeaderVisible()
  return (
    <div className="nv-fnd">
      <style>{CSS}</style>

      <header className={`nv-fnd-hdr${visible ? '' : ' nv-fnd-hdr-hidden'}`}>
        <div className="nv-fnd-wrap nv-fnd-hdr-row">
          <NivriaLogo size="md" href="/" />
          <nav className="nv-fnd-nav">
            <a href="mailto:briefing@nivria.ai?subject=Briefing%20request" className="nv-fnd-nav-cta">Request a briefing</a>
            <Link href="/auth/login" className="nv-fnd-nav-link">Sign in</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="nv-fnd-hero">
          <div className="nv-fnd-wrap">
            <div className="nv-fnd-mark">Founder · nivria</div>
            <h1 className="nv-fnd-h1">
              Jonathan <em>Leibowitz.</em>
            </h1>
            <div className="nv-fnd-bio">
              <p>
                Jonathan founded nivria after departing his nearly fifteen-year career at <strong>KARV</strong>, a boutique strategic advisory and communications firm that manages high-stakes and specialized matters for clients such as sovereign wealth funds, multinational corporations, and governments. He was among the firm’s earliest employees, helping build a global practice in strategic communications and geopolitical intelligence spanning <em>more than sixty countries.</em>
              </p>
              <p>
                Over the course of his career, Jonathan saw firsthand the <em>fragility of complex ventures,</em> particularly in geopolitically contentious times. nivria exists to help those working on important, complex initiatives make better decisions and manage the <em>growing list of stakeholders</em> that matter.
              </p>
            </div>
          </div>
        </section>

        <section className="nv-fnd-exp">
          <div className="nv-fnd-wrap">
            <header className="nv-fnd-exp-head">
              <h2 className="nv-fnd-h2"><em>Experience.</em><sup className="nv-fnd-exp-star">*</sup></h2>
            </header>

            <ol className="nv-fnd-grid">
              {EXPERIENCE.map((e, i) => (
                <li key={i} className="nv-fnd-cell">
                  <div className="nv-fnd-cell-n">{String(i + 1).padStart(2, '0')}</div>
                  <h3 className="nv-fnd-cell-h">{e.title}</h3>
                  {Array.isArray(e.body)
                    ? e.body.map((p, j) => <p key={j} className="nv-fnd-cell-body">{p}</p>)
                    : <p className="nv-fnd-cell-body">{e.body}</p>}
                </li>
              ))}
            </ol>

            <p className="nv-fnd-exp-note">
              <span aria-hidden="true">*</span> A sampling from a career spanning strategic advisory, communications, live entertainment, marketing, and private charitable work, across advisory and communications firms, government and NGO initiatives, and independent work. Involvement varied by engagement.
            </p>
          </div>
        </section>

        <section className="nv-fnd-close">
          <div className="nv-fnd-wrap nv-fnd-close-wrap">
            <p className="nv-fnd-close-line">
              For the initiatives that <em>matter most.</em>
            </p>
            <a href="mailto:briefing@nivria.ai?subject=Briefing%20request" className="nv-fnd-cta">
              Request a briefing
              <svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden="true">
                <path d="M0 6h18.5M14 1l5 5-5 5" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </a>
            <a href="mailto:briefing@nivria.ai" className="nv-fnd-mail">briefing@nivria.ai</a>
          </div>
        </section>
      </main>

      <footer className="nv-fnd-foot">
        <div className="nv-fnd-wrap nv-fnd-foot-row">
          <NivriaLogo size="sm" href="/" />
          <span className="nv-fnd-foot-tag">For the evaluation and stewardship of complex ventures.</span>
          <Link href="/auth/login" className="nv-fnd-foot-sign">Sign in</Link>
        </div>
      </footer>
    </div>
  )
}

const CSS = `
.nv-fnd {
  --bg: #0D0B08;
  --bg-2: #110F0B;
  --panel: #15130F;
  --panel-2: #1A1813;
  --ink: #F4ECD9;
  --ink-2: #D9CFB7;
  --ink-3: #A89E86;
  --ink-4: #6E6651;
  --rule: #2F2A20;
  --rule-soft: #211D16;
  --accent: #C9912E;
  --accent-deep: #8A6420;

  min-height: 100vh;
  color: var(--ink);
  font-family: var(--font-reader), 'Newsreader', Georgia, serif;
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1, "onum" 1;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
  font-size: 17px;
  line-height: 1.6;
  position: relative;
  isolation: isolate;

  /* same spotlight bed as the homepage — five warm sources fixed to
     the viewport so they stay anchored while content scrolls past */
  background:
    radial-gradient(1600px 1000px at 8% 4%,    rgba(201,145,46,.20), transparent 60%),
    radial-gradient(1100px 760px  at 92% 32%,  rgba(201,145,46,.12), transparent 62%),
    radial-gradient(1100px 880px  at 14% 82%,  rgba(140,40,32,.10),  transparent 65%),
    radial-gradient(900px  720px  at 96% 96%,  rgba(201,145,46,.10), transparent 68%),
    radial-gradient(1200px 1000px at 50% 50%,  rgba(201,145,46,.04), transparent 70%),
    var(--bg);
  background-attachment: fixed;
}
.nv-fnd *, .nv-fnd *::before, .nv-fnd *::after { box-sizing: border-box; }
.nv-fnd ::selection { background: rgba(201,145,46,.32); color: var(--ink); }
.nv-fnd a { color: inherit; text-decoration: none; }
.nv-fnd em { font-style: italic; color: var(--accent); }
.nv-fnd strong { font-weight: 600; color: var(--ink); }

/* paper grain — fixed under content */
.nv-fnd::before {
  content: '';
  position: fixed; inset: 0;
  pointer-events: none;
  z-index: -1;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='nvbg'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.88  0 0 0 0.045 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23nvbg)'/%3E%3C/svg%3E");
  opacity: 0.45;
  mix-blend-mode: overlay;
}
/* soft vignette so edges feel deeper than centre */
.nv-fnd::after {
  content: '';
  position: fixed; inset: 0;
  pointer-events: none;
  z-index: -1;
  background: radial-gradient(1400px 900px at 50% 40%, transparent 0%, transparent 55%, rgba(0,0,0,0.45) 100%);
}

/* per-section gradient caps so sections have their own lighting cast */
.nv-fnd main > section:nth-of-type(odd) {
  background:
    radial-gradient(1000px 380px at 30% 0%, rgba(201,145,46,.08), transparent 70%),
    radial-gradient(800px 320px at 80% 100%, rgba(140,40,32,.04), transparent 70%);
}
.nv-fnd main > section:nth-of-type(even) {
  background:
    radial-gradient(1000px 380px at 70% 0%, rgba(201,145,46,.05), transparent 70%),
    radial-gradient(800px 320px at 20% 100%, rgba(201,145,46,.06), transparent 70%);
}

.nv-fnd-wrap { max-width: 1240px; margin: 0 auto; padding: 0 48px; }

/* ── HEADER ──────────────────────────────────────────────────────────── */
.nv-fnd-hdr {
  padding: 18px 0;
  border-bottom: 1px solid var(--rule-soft);
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(13, 11, 8, 0.75);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transform: translateY(0);
  transition: transform .35s cubic-bezier(.4, 0, .2, 1);
  will-change: transform;
}
.nv-fnd-hdr.nv-fnd-hdr-hidden { transform: translateY(-110%); }
.nv-fnd-hdr-row {
  display: flex; align-items: center; justify-content: space-between;
}
.nv-fnd-logo { display: inline-block; transition: opacity .2s; }
.nv-fnd-logo:hover { opacity: 0.85; }

/* full logo — wordmark beneath canopy chart + trunks (matches homepage md size) */
.nv-fnd-fulllogo {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: var(--accent);
  transition: opacity .2s ease;
  line-height: 1;
  width: 240px;
}
.nv-fnd-fulllogo:hover { opacity: 0.92; }
.nv-fulllogo-chart {
  display: block;
  width: 100%;
  height: 34px;
  margin-bottom: -2px;
  color: var(--accent);
  pointer-events: none;
}
.nv-fulllogo-chart svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.nv-fulllogo-text {
  font-family: var(--font-logo), 'DM Serif Display', serif;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--ink);
  font-size: 24px;
  display: inline-flex;
  align-items: baseline;
  border-bottom: 0.04em solid var(--accent);
  padding-bottom: 0.02em;
}
/* trunk (vertical line above each i) + trunktop (dot where trunk meets canopy) */
.nv-logo-i-trunk {
  position: absolute;
  left: 50%;
  bottom: -0.20em;
  width: 1.2px;
  height: 1.55em;
  background: var(--accent);
  transform: translateX(-50%);
}
.nv-logo-i-trunktop {
  position: absolute;
  left: 50%;
  bottom: 1.30em;
  width: 0.11em;
  height: 0.11em;
  background: var(--accent);
  border-radius: 50%;
  transform: translate(calc(-50% - 0.6px), 0);
}
.nv-inline-wordmark {
  font-family: var(--font-logo), 'DM Serif Display', serif;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--ink);
  font-size: 22px;
  display: inline-flex;
  align-items: baseline;
  border-bottom: 0.04em solid var(--accent);
  padding-bottom: 0.02em;
}
.nv-inline-wordmark-sm { font-size: 16px; }
.nv-logo-i {
  display: inline-block;
  position: relative;
  width: 0.22em;
  height: 0.70em;
  vertical-align: baseline;
  margin: 0 0.04em;
  top: 0.08em;
}
.nv-logo-i-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: -0.05em;
  width: 3px;
  background: var(--accent);
  transform: translateX(-50%);
}
/* literal "i" — kept in DOM so the wordmark reads "nivria" (copy-paste,
   SEO, screen readers, CSS-disabled). Visually hidden via sr-only. */
.nv-logo-i-text {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
.nv-logo-i-top {
  position: absolute;
  left: 50%; top: -0.15em;
  width: 0.17em; height: 0.17em;
  background: var(--accent);
  border-radius: 50%;
  transform: translateX(-50%);
}
/* roots sit BELOW the gold ground line — the line is the surface, V is underneath */
.nv-logo-i-roots {
  position: absolute;
  left: 50%;
  top: 100%;
  width: 0.55em;
  height: 0.28em;
  color: var(--accent);
  transform: translate(-50%, 0.02em);
  overflow: visible;
  display: block;
  pointer-events: none;
}

.nv-fnd-nav { display: flex; align-items: center; gap: 28px; }
.nv-fnd-nav-cta {
  font-family: var(--font-reader), serif; font-style: italic;
  font-size: 17px; color: var(--accent);
  border-bottom: 1px solid var(--accent-deep);
  padding-bottom: 2px;
  transition: color .2s, border-color .2s;
}
.nv-fnd-nav-cta:hover { color: var(--accent); border-color: var(--accent); }
.nv-fnd-nav-link {
  font-family: var(--font-reader), serif;
  font-size: 16.5px; color: var(--ink-3);
  transition: color .2s;
}
.nv-fnd-nav-link:hover { color: var(--ink); }

/* ── HERO ────────────────────────────────────────────────────────────── */
.nv-fnd-hero { padding: 88px 0 72px; }
.nv-fnd-mark {
  font-family: var(--font-label), sans-serif;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 24px;
}
.nv-fnd-h1 {
  font-family: var(--font-reader), 'Newsreader', serif;
  font-weight: 600;
  font-size: clamp(40px, 5vw, 72px);
  line-height: 1.05;
  letter-spacing: -0.020em;
  color: var(--ink);
  margin: 0 0 32px;
}
.nv-fnd-h1 em {
  color: var(--accent);
  font-style: normal;
  font-weight: inherit;
}
.nv-fnd-bio {
  font-family: var(--font-reader), serif;
  font-size: 20.5px;
  line-height: 1.6;
  color: var(--ink-2);
  max-width: 78ch;
}
.nv-fnd-bio p { margin: 0 0 22px; }
.nv-fnd-bio p:last-child { margin-bottom: 0; }
.nv-fnd-bio em { font-style: italic; color: var(--accent); font-weight: 600; }
.nv-fnd-bio strong { color: var(--ink); font-weight: 600; }

/* ── EXPERIENCE GRID ────────────────────────────────────────────────── */
.nv-fnd-exp {
  padding: 88px 0 96px;
  position: relative;
  border-top: 1px solid var(--rule-soft);
}
.nv-fnd-exp-head {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 56px;
  gap: 24px; flex-wrap: wrap;
}
.nv-fnd-h2 {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 144, "SOFT" 0;
  font-weight: 600;
  font-size: clamp(36px, 4.4vw, 60px);
  line-height: 1.05;
  letter-spacing: -0.022em;
  color: var(--ink);
  margin: 0;
}
.nv-fnd-h2 em {
  color: var(--accent);
  font-variation-settings: "opsz" 144, "SOFT" 60;
  font-style: italic;
}
.nv-fnd-exp-star {
  font-family: var(--font-reader), serif;
  font-style: normal;
  font-weight: 400;
  font-size: 0.35em;   /* small relative to the h2 */
  color: var(--accent);
  vertical-align: super;
  margin-left: 0.15em;
}
.nv-fnd-exp-note {
  margin: 48px 0 0;
  padding-top: 20px;
  border-top: 1px solid var(--rule-soft);
  font-family: var(--font-reader), serif; font-style: italic;
  font-size: 14px; color: var(--ink-3);
  max-width: 68ch; line-height: 1.55;
}
.nv-fnd-exp-note span[aria-hidden] {
  color: var(--accent);
  font-style: normal;
  margin-right: 2px;
}

.nv-fnd-grid {
  list-style: none; padding: 0; margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid var(--rule-soft);
  border-left: 1px solid var(--rule-soft);
}
.nv-fnd-cell {
  padding: 32px 36px 36px;
  border-right: 1px solid var(--rule-soft);
  border-bottom: 1px solid var(--rule-soft);
  position: relative;
  transition: background .25s ease;
}
.nv-fnd-cell:hover { background: rgba(201,145,46,.03); }
.nv-fnd-cell-n {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--accent);
  margin-bottom: 14px;
}
.nv-fnd-cell-h {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 60, "SOFT" 0;
  font-weight: 600;
  font-size: clamp(20px, 1.8vw, 24px);
  line-height: 1.18;
  letter-spacing: -0.012em;
  color: var(--ink);
  margin: 0 0 14px;
}
.nv-fnd-cell-body {
  font-family: var(--font-reader), serif;
  font-size: 16.5px;
  line-height: 1.6;
  color: var(--ink-2);
  margin: 0;
}

/* ── CLOSE ──────────────────────────────────────────────────────────── */
.nv-fnd-close {
  padding: 96px 0 120px;
  text-align: center;
  position: relative;
  background:
    radial-gradient(1200px 760px at 50% 50%, rgba(201,145,46,.12), transparent 65%);
}
.nv-fnd-close-wrap {
  display: flex; flex-direction: column; align-items: center; gap: 32px;
}
.nv-fnd-close-line {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 144, "SOFT" 0;
  font-weight: 500;
  font-size: clamp(28px, 3.6vw, 48px);
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin: 0;
}
.nv-fnd-close-line em {
  color: var(--accent);
  font-variation-settings: "opsz" 144, "SOFT" 60;
  font-style: italic;
}
.nv-fnd-cta {
  display: inline-flex; align-items: center; gap: 14px;
  padding: 18px 36px;
  border: 1px solid var(--accent);
  background: linear-gradient(180deg, rgba(201,145,46,.14), rgba(201,145,46,.05));
  color: var(--accent);
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-weight: 500;
  font-size: 17px;
  transition: background .25s ease, color .25s ease, transform .25s ease;
  box-shadow: 0 24px 60px -30px rgba(201,145,46,.45);
}
.nv-fnd-cta:hover { background: var(--accent); color: var(--bg); transform: translateY(-2px); }
.nv-fnd-cta svg { transition: transform .2s; }
.nv-fnd-cta:hover svg { transform: translateX(4px); }
.nv-fnd-mail {
  font-family: var(--font-reader), serif; font-style: italic;
  font-size: 15px; color: var(--ink-3);
  border-bottom: 1px solid transparent;
  transition: color .2s, border-color .2s;
}
.nv-fnd-mail:hover { color: var(--accent); border-bottom-color: var(--accent-deep); }

/* ── FOOTER ─────────────────────────────────────────────────────────── */
.nv-fnd-foot {
  border-top: 1px solid var(--rule);
  padding: 28px 0 32px;
  background: var(--bg-2);
}
.nv-fnd-foot-row {
  display: flex; align-items: center; justify-content: space-between; gap: 28px;
}
.nv-fnd-foot-tag {
  font-family: var(--font-reader), serif; font-style: italic;
  font-size: 13px; color: var(--ink-3);
}
.nv-fnd-foot-sign {
  font-family: var(--font-reader), serif;
  font-size: 13px; color: var(--ink-3);
  border-bottom: 1px solid transparent;
  transition: color .2s, border-color .2s;
}
.nv-fnd-foot-sign:hover { color: var(--accent); border-bottom-color: var(--accent-deep); }

.nv-fnd :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

@media (max-width: 820px) {
  .nv-fnd-wrap { padding: 0 22px; }
  .nv-fnd-grid { grid-template-columns: 1fr; }
  .nv-fnd-cell { padding: 26px 22px 30px; border-right: none !important; }
  .nv-fnd-hero { padding: 56px 0 48px; }
  .nv-fnd-exp { padding: 64px 0 72px; }
  .nv-fnd-foot-row { flex-direction: column; gap: 12px; text-align: center; }

  /* ── HEADER: shrink the shared logo, push it left, tighten the nav so
        "Request a briefing" + "Sign in" stay on one line. Mirrors the
        homepage's mobile header treatment in src/app/page.tsx. */
  .nv-fnd-hdr { padding: 12px 0; }
  .nv-fnd-hdr .nv-fnd-wrap { padding-left: 4px; padding-right: 14px; }
  .nv-fnd-hdr-row { gap: 10px; }
  .nivria-logo--md { --logo-font-size: 21px; }
  .nv-fnd-nav { gap: 12px; flex-wrap: wrap; justify-content: flex-end; }
  .nv-fnd-nav-cta { font-size: 13px; padding-bottom: 1px; }
  .nv-fnd-nav-link { font-size: 13px; }
}
`
