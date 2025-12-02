'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  Zap,
  Sparkles,
  Globe,
  Shield,
  Database,
  ArrowRight,
  ChevronRight,
  Brain,
  Target,
  FileText,
  Video,
  Image,
  Presentation,
  Users,
  TrendingUp,
  AlertTriangle,
  Search,
  Layers,
  RefreshCw
} from 'lucide-react'

export default function PlatformPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const capabilities = [
    {
      id: 'intelligence',
      icon: Activity,
      title: 'Intelligence Hub',
      tagline: 'MONITOR',
      headline: 'See everything. Miss nothing.',
      description: 'Multi-source surveillance across 100+ outlets. AI synthesizes industry news, competitor moves, and stakeholder signals into executive-ready briefings.',
      features: [
        { icon: Globe, label: '100+ sources monitored', detail: 'Industry news, competitors, stakeholders across premium and niche outlets' },
        { icon: FileText, label: 'Executive synthesis', detail: 'Daily briefings that cut through noise to what matters for YOUR organization' },
        { icon: TrendingUp, label: 'Predictive signals', detail: 'Pattern detection identifies emerging trends before they become obvious' },
        { icon: AlertTriangle, label: 'Emerging issues radar', detail: 'Early warning system for potential crises and market shifts' }
      ],
      differentiator: 'Not just monitoring — it THINKS about what matters to your organization',
      color: '#3b82f6'
    },
    {
      id: 'opportunities',
      icon: Zap,
      title: 'Opportunities Engine',
      tagline: 'DETECT',
      headline: 'From insight to action in one click.',
      description: 'AI identifies strategic moments and hands you ready-to-execute campaign blueprints. Not alerts — complete execution plans with stakeholder targeting and content strategies.',
      features: [
        { icon: Target, label: 'Auto-generated opportunities', detail: 'AI identifies strategic moments from your intelligence feed' },
        { icon: Layers, label: 'Full campaign blueprints', detail: 'Complete execution plans, not just alerts or suggestions' },
        { icon: Zap, label: 'One-click activation', detail: 'From opportunity to live campaign execution instantly' },
        { icon: TrendingUp, label: 'Confidence scoring', detail: 'Know which opportunities have highest ROI potential' }
      ],
      differentiator: 'Other tools alert you. NIV hands you a ready-to-execute campaign.',
      color: '#f59e0b'
    },
    {
      id: 'studio',
      icon: Sparkles,
      title: 'Studio',
      tagline: 'EXECUTE',
      headline: '40+ content types. One conversation.',
      description: 'NIV Assistant combines strategic research with content creation. Press releases, bylines, social campaigns, executive presentations — all informed by your intelligence and brand voice.',
      features: [
        { icon: Brain, label: 'NIV AI Assistant', detail: 'Strategic research and content creation in one conversation' },
        { icon: FileText, label: '40+ content types', detail: 'Press releases, bylines, social posts, talking points, and more' },
        { icon: Presentation, label: 'Executive presentations', detail: 'Board-ready decks generated with your data and insights' },
        { icon: Video, label: 'Visual generation', detail: 'Images, videos, and presentations with AI-powered creation' }
      ],
      differentiator: 'Not templates — strategically-informed content that knows your voice',
      color: '#8b5cf6'
    },
    {
      id: 'campaigns',
      icon: Target,
      title: 'Campaign Builder',
      tagline: 'ORCHESTRATE',
      headline: 'VECTOR and GEO-VECTOR campaigns.',
      description: 'Two powerful campaign frameworks. VECTOR for traditional PR orchestration. GEO-VECTOR for the new frontier: optimizing your narrative for AI search results.',
      features: [
        { icon: Target, label: 'VECTOR campaigns', detail: 'Traditional PR with modern orchestration and tracking' },
        { icon: Globe, label: 'GEO-VECTOR campaigns', detail: 'AI search optimization — own the narrative in ChatGPT and Perplexity' },
        { icon: Users, label: 'Stakeholder targeting', detail: 'Multi-audience campaigns with tailored messaging' },
        { icon: RefreshCw, label: 'Execution tracking', detail: 'Real-time progress monitoring across all campaign elements' }
      ],
      differentiator: 'The only platform with native AI search optimization built into PR campaigns',
      color: '#10b981'
    },
    {
      id: 'geo',
      icon: Globe,
      title: 'GEO Intelligence',
      tagline: 'OPTIMIZE',
      headline: 'Own the AI search landscape.',
      description: 'First platform combining AI schema generation with PR credibility-building. Structure your narrative for AI consumption while building the citations that make AI trust you.',
      features: [
        { icon: Layers, label: 'Schema engineering', detail: 'Structure your narrative for AI model consumption' },
        { icon: Search, label: 'AI visibility tracking', detail: 'See how AI models perceive and cite your brand' },
        { icon: Target, label: 'PR-to-AI coordination', detail: 'Every release optimized for LLM retrieval and citation' },
        { icon: TrendingUp, label: 'Competitive positioning', detail: 'Track your visibility vs competitors in AI answers' }
      ],
      differentiator: 'First platform combining AI schema generation with PR credibility-building to dominate AI search',
      color: '#06b6d4'
    },
    {
      id: 'crisis',
      icon: Shield,
      title: 'Crisis Command',
      tagline: 'PROTECT',
      headline: 'Prepared before. Protected during.',
      description: 'AI-generated crisis plans tailored to your scenarios. When crisis hits, the Command Center coordinates response with real-time guidance from Crisis Advisor.',
      features: [
        { icon: FileText, label: 'Crisis plan generator', detail: 'Scenario-specific response playbooks generated by AI' },
        { icon: Activity, label: 'Command center', detail: 'Real-time coordination hub for crisis response' },
        { icon: Brain, label: 'Crisis AI advisor', detail: 'Strategic guidance under pressure from NIV' },
        { icon: Users, label: 'Stakeholder messaging', detail: 'Pre-approved templates ready to deploy instantly' }
      ],
      differentiator: 'Crisis prep + crisis response in one system — not two separate tools',
      color: '#ef4444'
    },
    {
      id: 'vault',
      icon: Database,
      title: 'Memory Vault',
      tagline: 'REMEMBER',
      headline: 'The platform that learns.',
      description: 'Semantic search finds anything by meaning. Playbooks capture your strategies. Every interaction makes NIV smarter about your organization.',
      features: [
        { icon: Search, label: 'Semantic search', detail: 'Find anything by meaning, not just keywords' },
        { icon: FileText, label: 'Organizational playbook', detail: 'Your strategies and approaches, refined over time' },
        { icon: Layers, label: 'Content fingerprinting', detail: 'Never duplicate — always build on what works' },
        { icon: Brain, label: 'NIV learns', detail: 'Every interaction makes future output sharper and more relevant' }
      ],
      differentiator: 'The more you use it, the smarter it gets about YOUR organization',
      color: '#ec4899'
    }
  ]

  return (
    <div className="platform-container">
      <style jsx>{`
        .platform-container {
          width: 100%;
          min-height: 100vh;
          background: #faf9f7;
        }

        /* Navigation */
        .platform-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 24px 60px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(to bottom, #faf9f7 70%, transparent);
        }

        .platform-nav-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          cursor: pointer;
        }

        .platform-nav-links {
          display: flex;
          gap: 40px;
          align-items: center;
        }

        .platform-nav-link {
          color: var(--grey-600);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 400;
          transition: color 0.2s;
          cursor: pointer;
        }

        .platform-nav-link:hover {
          color: var(--charcoal);
        }

        .platform-nav-link.active {
          color: var(--burnt-orange);
        }

        .platform-nav-cta {
          color: var(--white);
          background: var(--charcoal);
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 12px 28px;
          border-radius: 6px;
          transition: background 0.2s;
          cursor: pointer;
          border: none;
        }

        .platform-nav-cta:hover {
          background: var(--burnt-orange);
        }

        /* Hero */
        .platform-hero {
          padding: 180px 60px 100px;
          text-align: center;
          max-width: 1000px;
          margin: 0 auto;
        }

        .platform-hero-tagline {
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 2px;
          color: var(--burnt-orange);
          margin-bottom: 24px;
          text-transform: uppercase;
        }

        .platform-hero-headline {
          font-family: var(--font-serif);
          font-size: clamp(2.8rem, 6vw, 4.5rem);
          font-weight: 400;
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: var(--charcoal);
          margin-bottom: 32px;
        }

        .platform-hero-headline .italic {
          font-style: italic;
          color: var(--burnt-orange);
        }

        .platform-hero-intro {
          font-size: 1.25rem;
          line-height: 1.7;
          color: var(--grey-600);
          max-width: 700px;
          margin: 0 auto 48px;
        }

        /* Loop Diagram */
        .platform-loop {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 40px;
        }

        .platform-loop-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--white);
          border: 1px solid var(--grey-200);
          border-radius: 100px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--grey-600);
          cursor: pointer;
          transition: all 0.2s;
        }

        .platform-loop-item:hover {
          border-color: var(--burnt-orange);
          color: var(--burnt-orange);
        }

        .platform-loop-arrow {
          color: var(--grey-300);
        }

        /* Sections */
        .platform-sections {
          padding: 0 60px 120px;
        }

        .platform-section {
          max-width: 1400px;
          margin: 0 auto 120px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .platform-section:nth-child(even) {
          direction: rtl;
        }

        .platform-section:nth-child(even) > * {
          direction: ltr;
        }

        .platform-section-content {
          padding: 40px 0;
        }

        .platform-section-tagline {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .platform-section-title {
          font-family: var(--font-serif);
          font-size: 2.5rem;
          font-weight: 400;
          color: var(--charcoal);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .platform-section-headline {
          font-size: 1.1rem;
          font-style: italic;
          color: var(--grey-500);
          margin-bottom: 24px;
        }

        .platform-section-desc {
          font-size: 1.05rem;
          line-height: 1.8;
          color: var(--grey-600);
          margin-bottom: 32px;
        }

        .platform-features {
          display: grid;
          gap: 16px;
          margin-bottom: 32px;
        }

        .platform-feature {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: var(--white);
          border: 1px solid var(--grey-200);
          border-radius: 12px;
          transition: all 0.2s;
        }

        .platform-feature:hover {
          border-color: var(--grey-300);
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }

        .platform-feature-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .platform-feature-text {
          flex: 1;
        }

        .platform-feature-label {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--charcoal);
          margin-bottom: 4px;
        }

        .platform-feature-detail {
          font-size: 0.85rem;
          color: var(--grey-500);
          line-height: 1.5;
        }

        .platform-differentiator {
          padding: 20px 24px;
          background: var(--charcoal);
          border-radius: 12px;
          color: var(--white);
          font-size: 0.95rem;
          font-weight: 500;
          line-height: 1.6;
        }

        .platform-differentiator::before {
          content: '→ ';
          color: var(--burnt-orange);
        }

        /* Preview Panel */
        .platform-preview {
          background: var(--charcoal);
          border-radius: 16px;
          padding: 32px;
          min-height: 500px;
          display: flex;
          flex-direction: column;
        }

        .platform-preview-header {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
        }

        .platform-preview-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--grey-600);
        }

        .platform-preview-dot.red { background: #ef4444; }
        .platform-preview-dot.yellow { background: #f59e0b; }
        .platform-preview-dot.green { background: #10b981; }

        .platform-preview-content {
          flex: 1;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .platform-preview-item {
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .platform-preview-label {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--grey-400);
          margin-bottom: 8px;
        }

        .platform-preview-value {
          font-size: 1.1rem;
          color: var(--white);
          font-weight: 500;
        }

        .platform-preview-bar {
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 8px;
        }

        .platform-preview-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        /* CTA Section */
        .platform-cta {
          background: var(--charcoal);
          padding: 100px 60px;
          text-align: center;
        }

        .platform-cta-headline {
          font-family: var(--font-serif);
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 400;
          color: var(--white);
          margin-bottom: 24px;
        }

        .platform-cta-headline .italic {
          font-style: italic;
          color: var(--burnt-orange);
        }

        .platform-cta-text {
          font-size: 1.1rem;
          color: var(--grey-400);
          margin-bottom: 40px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .platform-cta-button {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 18px 40px;
          background: var(--burnt-orange);
          color: var(--white);
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .platform-cta-button:hover {
          background: #b5522f;
          transform: translateY(-2px);
        }

        @media (max-width: 1024px) {
          .platform-section {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .platform-section:nth-child(even) {
            direction: ltr;
          }

          .platform-preview {
            min-height: 400px;
          }
        }

        @media (max-width: 768px) {
          .platform-nav {
            padding: 16px 24px;
          }

          .platform-nav-links {
            display: none;
          }

          .platform-hero {
            padding: 140px 24px 60px;
          }

          .platform-sections {
            padding: 0 24px 80px;
          }

          .platform-cta {
            padding: 60px 24px;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav className="platform-nav">
        <Link href="/" className="platform-nav-logo">
          <svg width="80" height="48" viewBox="0 0 80 48">
            <path d="M10 0 H80 V48 H0 L10 0 Z" fill="#1a1a1a" />
            <text x="40" y="33" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="22" fontWeight="700" fill="#faf9f7" letterSpacing="-0.5">NIV</text>
            <path d="M68 0 H80 V12 L68 0 Z" fill="#c75d3a" />
          </svg>
          <span style={{ color: 'var(--grey-400)', fontSize: '12px', letterSpacing: '1px', marginTop: '6px' }}>by nivria</span>
        </Link>

        <div className="platform-nav-links">
          <Link href="/platform" className="platform-nav-link active">Platform</Link>
          <Link href="/#capabilities" className="platform-nav-link">Solutions</Link>
          <Link href="/#about" className="platform-nav-link">About</Link>
        </div>

        <button onClick={() => router.push('/auth/signup')} className="platform-nav-cta">
          Get Started
        </button>
      </nav>

      {/* Hero */}
      <section className="platform-hero">
        <p className="platform-hero-tagline">Platform Capabilities</p>
        <h1 className="platform-hero-headline">
          The intelligence-to-action <span className="italic">loop</span>
        </h1>
        <p className="platform-hero-intro">
          NIV isn't six separate tools — it's one AI strategist that monitors, detects, executes, optimizes, protects, and learns. Each capability feeds the next.
        </p>

        <div className="platform-loop">
          {capabilities.map((cap, idx) => (
            <div key={cap.id}>
              <a href={`#${cap.id}`} className="platform-loop-item">
                <cap.icon size={16} style={{ color: cap.color }} />
                {cap.tagline}
              </a>
              {idx < capabilities.length - 1 && (
                <ChevronRight size={16} className="platform-loop-arrow" style={{ display: 'inline', margin: '0 4px' }} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Capability Sections */}
      <div className="platform-sections">
        {capabilities.map((cap, idx) => (
          <section key={cap.id} id={cap.id} className="platform-section">
            <div className="platform-section-content">
              <p className="platform-section-tagline" style={{ color: cap.color }}>{cap.tagline}</p>
              <h2 className="platform-section-title">
                <cap.icon size={32} style={{ color: cap.color }} />
                {cap.title}
              </h2>
              <p className="platform-section-headline">{cap.headline}</p>
              <p className="platform-section-desc">{cap.description}</p>

              <div className="platform-features">
                {cap.features.map((feature, fidx) => (
                  <div key={fidx} className="platform-feature">
                    <div className="platform-feature-icon" style={{ background: `${cap.color}15` }}>
                      <feature.icon size={20} style={{ color: cap.color }} />
                    </div>
                    <div className="platform-feature-text">
                      <div className="platform-feature-label">{feature.label}</div>
                      <div className="platform-feature-detail">{feature.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="platform-differentiator">
                {cap.differentiator}
              </div>
            </div>

            <div className="platform-preview">
              <div className="platform-preview-header">
                <div className="platform-preview-dot red" />
                <div className="platform-preview-dot yellow" />
                <div className="platform-preview-dot green" />
              </div>
              <div className="platform-preview-content">
                {cap.id === 'intelligence' && (
                  <>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Sources Monitored</div>
                      <div className="platform-preview-value">127 Active</div>
                      <div className="platform-preview-bar">
                        <div className="platform-preview-bar-fill" style={{ width: '85%', background: cap.color }} />
                      </div>
                    </div>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Today's Signals</div>
                      <div className="platform-preview-value">23 High Priority</div>
                    </div>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Executive Brief</div>
                      <div className="platform-preview-value">Ready for Review</div>
                    </div>
                  </>
                )}
                {cap.id === 'opportunities' && (
                  <>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Active Opportunities</div>
                      <div className="platform-preview-value">3 Ready to Execute</div>
                    </div>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Top Opportunity</div>
                      <div className="platform-preview-value" style={{ fontSize: '0.95rem' }}>Market positioning against competitor weakness</div>
                      <div className="platform-preview-bar">
                        <div className="platform-preview-bar-fill" style={{ width: '92%', background: cap.color }} />
                      </div>
                    </div>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Confidence Score</div>
                      <div className="platform-preview-value">92%</div>
                    </div>
                  </>
                )}
                {cap.id === 'studio' && (
                  <>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Content Types</div>
                      <div className="platform-preview-value">40+ Available</div>
                    </div>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Recent Generation</div>
                      <div className="platform-preview-value" style={{ fontSize: '0.95rem' }}>Press Release + Social Campaign</div>
                    </div>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">NIV Status</div>
                      <div className="platform-preview-value" style={{ color: '#10b981' }}>Ready to assist</div>
                    </div>
                  </>
                )}
                {cap.id === 'campaigns' && (
                  <>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Active Campaigns</div>
                      <div className="platform-preview-value">2 In Progress</div>
                    </div>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Campaign Type</div>
                      <div className="platform-preview-value">GEO-VECTOR</div>
                    </div>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Execution Progress</div>
                      <div className="platform-preview-value">68%</div>
                      <div className="platform-preview-bar">
                        <div className="platform-preview-bar-fill" style={{ width: '68%', background: cap.color }} />
                      </div>
                    </div>
                  </>
                )}
                {cap.id === 'geo' && (
                  <>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Schema Status</div>
                      <div className="platform-preview-value" style={{ color: '#10b981' }}>Optimized</div>
                    </div>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">AI Visibility Score</div>
                      <div className="platform-preview-value">78/100</div>
                      <div className="platform-preview-bar">
                        <div className="platform-preview-bar-fill" style={{ width: '78%', background: cap.color }} />
                      </div>
                    </div>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Competitor Gap</div>
                      <div className="platform-preview-value">+23 points ahead</div>
                    </div>
                  </>
                )}
                {cap.id === 'crisis' && (
                  <>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Crisis Readiness</div>
                      <div className="platform-preview-value" style={{ color: '#10b981' }}>Prepared</div>
                    </div>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Scenarios Covered</div>
                      <div className="platform-preview-value">12 Playbooks</div>
                    </div>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Response Time</div>
                      <div className="platform-preview-value">&lt; 15 minutes</div>
                    </div>
                  </>
                )}
                {cap.id === 'vault' && (
                  <>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Content Items</div>
                      <div className="platform-preview-value">1,247 Indexed</div>
                    </div>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">Search Type</div>
                      <div className="platform-preview-value">Semantic (AI-Powered)</div>
                    </div>
                    <div className="platform-preview-item">
                      <div className="platform-preview-label">NIV Learning</div>
                      <div className="platform-preview-value" style={{ color: '#10b981' }}>Active</div>
                      <div className="platform-preview-bar">
                        <div className="platform-preview-bar-fill" style={{ width: '100%', background: `linear-gradient(90deg, ${cap.color}, #8b5cf6)` }} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <section className="platform-cta">
        <h2 className="platform-cta-headline">
          Ready to close the <span className="italic">loop</span>?
        </h2>
        <p className="platform-cta-text">
          See how NIV transforms intelligence into action for your organization.
        </p>
        <button onClick={() => router.push('/auth/signup')} className="platform-cta-button">
          Start Free Trial
          <ArrowRight size={20} />
        </button>
      </section>
    </div>
  )
}
