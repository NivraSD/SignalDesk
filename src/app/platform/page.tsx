'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Activity,
  Zap,
  Sparkles,
  Globe,
  Shield,
  Database,
  ArrowRight,
  Brain,
  Target,
  FileText,
  Users,
  TrendingUp,
  AlertTriangle,
  Search,
  Layers,
  MessageSquare,
  CheckCircle,
  Clock,
  BarChart3,
  Presentation,
  Image as ImageIcon,
  Video,
  Mail,
  Mic,
  BookOpen,
  RefreshCw,
  ExternalLink
} from 'lucide-react'

export default function PlatformPage() {
  const router = useRouter()

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
          padding: 180px 60px 80px;
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
          margin: 0 auto;
        }

        /* Sections */
        .platform-sections {
          padding: 60px 60px 120px;
        }

        .platform-section {
          max-width: 1400px;
          margin: 0 auto 140px;
        }

        .platform-section-header {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 40px;
        }

        .platform-section-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .platform-section-text {
          flex: 1;
        }

        .platform-section-tagline {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .platform-section-title {
          font-family: var(--font-serif);
          font-size: 2.2rem;
          font-weight: 400;
          color: var(--charcoal);
          margin-bottom: 8px;
        }

        .platform-section-headline {
          font-size: 1.05rem;
          color: var(--grey-500);
          max-width: 600px;
        }

        .platform-section-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: start;
        }

        .platform-section-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .platform-feature {
          display: flex;
          gap: 14px;
          padding: 16px 20px;
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
          width: 36px;
          height: 36px;
          border-radius: 8px;
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
          font-size: 0.9rem;
          color: var(--charcoal);
          margin-bottom: 2px;
        }

        .platform-feature-detail {
          font-size: 0.8rem;
          color: var(--grey-500);
          line-height: 1.4;
        }

        .platform-differentiator {
          padding: 20px 24px;
          background: var(--charcoal);
          border-radius: 12px;
          color: var(--white);
          font-size: 0.9rem;
          font-weight: 500;
          line-height: 1.6;
          margin-top: 20px;
        }

        .platform-differentiator::before {
          content: '→ ';
          color: var(--burnt-orange);
        }

        /* Visual Panels */
        .platform-visual {
          background: var(--charcoal);
          border-radius: 16px;
          overflow: hidden;
          min-height: 400px;
        }

        .platform-visual-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 20px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .platform-visual-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .platform-visual-dot.red { background: #ef4444; }
        .platform-visual-dot.yellow { background: #f59e0b; }
        .platform-visual-dot.green { background: #10b981; }

        .platform-visual-title {
          margin-left: auto;
          font-size: 0.75rem;
          color: var(--grey-400);
          letter-spacing: 0.5px;
        }

        .platform-visual-content {
          padding: 24px;
        }

        /* Intelligence Brief Mockup */
        .intel-brief {
          font-family: var(--font-sans);
        }

        .intel-brief-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .intel-brief-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--white);
        }

        .intel-brief-date {
          font-size: 0.75rem;
          color: var(--grey-400);
        }

        .intel-brief-section {
          margin-bottom: 20px;
        }

        .intel-brief-section-title {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--burnt-orange);
          margin-bottom: 10px;
        }

        .intel-brief-item {
          background: rgba(255,255,255,0.04);
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 8px;
          border-left: 3px solid;
        }

        .intel-brief-item.high { border-color: #ef4444; }
        .intel-brief-item.medium { border-color: #f59e0b; }
        .intel-brief-item.low { border-color: #10b981; }

        .intel-brief-item-title {
          font-size: 0.85rem;
          color: var(--white);
          font-weight: 500;
          margin-bottom: 4px;
        }

        .intel-brief-item-meta {
          font-size: 0.7rem;
          color: var(--grey-400);
        }

        /* Opportunity Card Mockup */
        .opp-card {
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          overflow: hidden;
        }

        .opp-card-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .opp-card-title {
          font-family: var(--font-serif);
          font-size: 1.2rem;
          color: var(--white);
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .opp-card-desc {
          font-size: 0.8rem;
          color: var(--grey-400);
          line-height: 1.5;
        }

        .opp-card-badges {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .opp-card-badge {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 100px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .opp-card-badge.high {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        .opp-card-badge.score {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .opp-card-score {
          position: absolute;
          top: 20px;
          right: 20px;
          font-family: var(--font-serif);
          font-size: 2.5rem;
          color: var(--burnt-orange);
          font-weight: 400;
        }

        .opp-card-body {
          padding: 20px;
        }

        .opp-card-section-title {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--grey-400);
          margin-bottom: 10px;
        }

        .opp-card-context {
          background: rgba(255,255,255,0.04);
          border-radius: 8px;
          padding: 14px;
        }

        .opp-card-context-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--white);
          margin-bottom: 6px;
        }

        .opp-card-context-text {
          font-size: 0.75rem;
          color: var(--grey-400);
          line-height: 1.5;
        }

        .opp-card-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
          padding: 12px;
          background: var(--burnt-orange);
          border-radius: 8px;
          color: var(--white);
          font-size: 0.85rem;
          font-weight: 600;
        }

        /* Content Types Grid */
        .content-types-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .content-type-card {
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          padding: 16px;
          text-align: center;
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s;
        }

        .content-type-card:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.12);
        }

        .content-type-icon {
          width: 40px;
          height: 40px;
          margin: 0 auto 10px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .content-type-label {
          font-size: 0.75rem;
          color: var(--grey-300);
          font-weight: 500;
        }

        /* Campaign Flow */
        .campaign-flow {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .campaign-stage {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .campaign-stage-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .campaign-stage-text {
          flex: 1;
        }

        .campaign-stage-title {
          font-size: 0.85rem;
          color: var(--white);
          font-weight: 600;
          margin-bottom: 2px;
        }

        .campaign-stage-desc {
          font-size: 0.7rem;
          color: var(--grey-400);
        }

        .campaign-stage-status {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 100px;
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        /* GEO Schema */
        .geo-schema {
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(255,255,255,0.08);
          font-family: 'SF Mono', 'Monaco', monospace;
          font-size: 0.7rem;
          color: var(--grey-300);
          line-height: 1.6;
        }

        .geo-schema-key {
          color: #60a5fa;
        }

        .geo-schema-string {
          color: #34d399;
        }

        .geo-schema-bracket {
          color: var(--grey-500);
        }

        .geo-llms {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .geo-llm {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 14px;
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .geo-llm-name {
          font-size: 0.7rem;
          color: var(--grey-300);
          font-weight: 500;
        }

        .geo-llm-score {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--burnt-orange);
        }

        /* Crisis Panel */
        .crisis-panel {
          background: linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.02) 100%);
          border-radius: 12px;
          padding: 24px;
          border: 1px solid rgba(239,68,68,0.2);
        }

        .crisis-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .crisis-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #34d399;
        }

        .crisis-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #34d399;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .crisis-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--white);
        }

        .crisis-scenarios {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .crisis-scenario {
          background: rgba(255,255,255,0.04);
          border-radius: 8px;
          padding: 12px;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .crisis-scenario-title {
          font-size: 0.75rem;
          color: var(--white);
          font-weight: 500;
          margin-bottom: 4px;
        }

        .crisis-scenario-status {
          font-size: 0.65rem;
          color: #34d399;
        }

        /* NIV Chat */
        .niv-chat {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .niv-messages {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px;
        }

        .niv-message {
          max-width: 85%;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.85rem;
          line-height: 1.5;
        }

        .niv-message.user {
          align-self: flex-end;
          background: var(--burnt-orange);
          color: var(--white);
          border-bottom-right-radius: 4px;
        }

        .niv-message.assistant {
          align-self: flex-start;
          background: rgba(255,255,255,0.08);
          color: var(--grey-200);
          border-bottom-left-radius: 4px;
        }

        .niv-input {
          display: flex;
          gap: 10px;
          padding: 16px 20px;
          background: rgba(255,255,255,0.03);
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        .niv-input-field {
          flex: 1;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 10px 14px;
          color: var(--white);
          font-size: 0.85rem;
        }

        .niv-input-field::placeholder {
          color: var(--grey-500);
        }

        .niv-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: var(--burnt-orange);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
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
          .platform-section-content {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .platform-visual {
            min-height: 350px;
          }
        }

        @media (max-width: 768px) {
          .platform-nav {
            padding: 16px 24px;
          }

          .platform-hero {
            padding: 140px 24px 60px;
          }

          .platform-sections {
            padding: 40px 24px 80px;
          }

          .platform-cta {
            padding: 60px 24px;
          }

          .content-types-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .crisis-scenarios {
            grid-template-columns: 1fr;
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
          NIV transforms scattered signals into strategic action. Monitor your landscape, detect opportunities, execute campaigns, and optimize for AI search — all in one platform.
        </p>
      </section>

      {/* Sections */}
      <div className="platform-sections">

        {/* Intelligence Hub */}
        <section className="platform-section">
          <div className="platform-section-header">
            <div className="platform-section-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              <Activity size={28} style={{ color: '#3b82f6' }} />
            </div>
            <div className="platform-section-text">
              <p className="platform-section-tagline" style={{ color: '#3b82f6' }}>MONITOR</p>
              <h2 className="platform-section-title">Intelligence Hub</h2>
              <p className="platform-section-headline">100+ sources synthesized into executive-ready briefings. Know what matters before it matters.</p>
            </div>
          </div>

          <div className="platform-section-content">
            <div className="platform-section-features">
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  <Globe size={18} style={{ color: '#3b82f6' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Multi-source surveillance</div>
                  <div className="platform-feature-detail">Industry news, competitors, stakeholders across premium and niche outlets</div>
                </div>
              </div>
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  <FileText size={18} style={{ color: '#3b82f6' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Executive synthesis</div>
                  <div className="platform-feature-detail">Daily briefings that cut through noise to what matters for YOUR organization</div>
                </div>
              </div>
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  <TrendingUp size={18} style={{ color: '#3b82f6' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Predictive signals</div>
                  <div className="platform-feature-detail">Pattern detection identifies emerging trends before they become obvious</div>
                </div>
              </div>
              <div className="platform-differentiator">
                Not just monitoring — it THINKS about what matters to your organization
              </div>
            </div>

            <div className="platform-visual">
              <div className="platform-visual-header">
                <div className="platform-visual-dot red" />
                <div className="platform-visual-dot yellow" />
                <div className="platform-visual-dot green" />
                <span className="platform-visual-title">Executive Intelligence Brief</span>
              </div>
              <div className="platform-visual-content">
                <div className="intel-brief">
                  <div className="intel-brief-header">
                    <span className="intel-brief-title">Daily Intelligence Report</span>
                    <span className="intel-brief-date">Dec 2, 2024</span>
                  </div>
                  <div className="intel-brief-section">
                    <div className="intel-brief-section-title">Priority Signals</div>
                    <div className="intel-brief-item high">
                      <div className="intel-brief-item-title">Competitor announces strategic pivot</div>
                      <div className="intel-brief-item-meta">HIGH PRIORITY • 3 sources • Action required</div>
                    </div>
                    <div className="intel-brief-item medium">
                      <div className="intel-brief-item-title">Industry regulation update pending</div>
                      <div className="intel-brief-item-meta">MEDIUM • 5 sources • Monitor closely</div>
                    </div>
                    <div className="intel-brief-item low">
                      <div className="intel-brief-item-title">Market sentiment shifting positive</div>
                      <div className="intel-brief-item-meta">OPPORTUNITY • 8 sources • Consider action</div>
                    </div>
                  </div>
                  <div className="intel-brief-section">
                    <div className="intel-brief-section-title">Stakeholder Activity</div>
                    <div className="intel-brief-item medium">
                      <div className="intel-brief-item-title">Key journalist covering your space</div>
                      <div className="intel-brief-item-meta">Bloomberg • 2 recent articles • Outreach suggested</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Opportunity Engine */}
        <section className="platform-section">
          <div className="platform-section-header">
            <div className="platform-section-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
              <Zap size={28} style={{ color: '#f59e0b' }} />
            </div>
            <div className="platform-section-text">
              <p className="platform-section-tagline" style={{ color: '#f59e0b' }}>DETECT</p>
              <h2 className="platform-section-title">Opportunity Engine</h2>
              <p className="platform-section-headline">AI identifies strategic moments and hands you ready-to-execute campaign blueprints.</p>
            </div>
          </div>

          <div className="platform-section-content">
            <div className="platform-section-features">
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                  <Target size={18} style={{ color: '#f59e0b' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Auto-generated opportunities</div>
                  <div className="platform-feature-detail">AI identifies strategic moments from your intelligence feed</div>
                </div>
              </div>
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                  <Layers size={18} style={{ color: '#f59e0b' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Full campaign blueprints</div>
                  <div className="platform-feature-detail">Complete execution plans with stakeholder targeting and content strategies</div>
                </div>
              </div>
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                  <Zap size={18} style={{ color: '#f59e0b' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">One-click activation</div>
                  <div className="platform-feature-detail">From opportunity detection to live campaign execution instantly</div>
                </div>
              </div>
              <div className="platform-differentiator">
                Other tools alert you. NIV hands you a ready-to-execute campaign.
              </div>
            </div>

            <div className="platform-visual">
              <div className="platform-visual-header">
                <div className="platform-visual-dot red" />
                <div className="platform-visual-dot yellow" />
                <div className="platform-visual-dot green" />
                <span className="platform-visual-title">Opportunity Engine</span>
              </div>
              <div className="platform-visual-content">
                <div className="opp-card" style={{ position: 'relative' }}>
                  <div className="opp-card-header">
                    <div className="opp-card-title">Market Positioning: Capitalize on Competitor Weakness</div>
                    <div className="opp-card-desc">Recent competitor missteps create perfect window for thought leadership positioning and market share capture.</div>
                    <div className="opp-card-badges">
                      <span className="opp-card-badge high">HIGH URGENCY</span>
                      <span className="opp-card-badge score">3 STAKEHOLDER GROUPS</span>
                    </div>
                    <div className="opp-card-score">88</div>
                  </div>
                  <div className="opp-card-body">
                    <div className="opp-card-section-title">Strategic Context</div>
                    <div className="opp-card-context">
                      <div className="opp-card-context-title">WHY NOW</div>
                      <div className="opp-card-context-text">Competitor's recent announcement creates 2-3 week window for counter-positioning. Market sentiment shifting in your favor.</div>
                    </div>
                    <div className="opp-card-cta">
                      <Zap size={16} />
                      Execute Campaign
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Studio */}
        <section className="platform-section">
          <div className="platform-section-header">
            <div className="platform-section-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <Sparkles size={28} style={{ color: '#8b5cf6' }} />
            </div>
            <div className="platform-section-text">
              <p className="platform-section-tagline" style={{ color: '#8b5cf6' }}>CREATE</p>
              <h2 className="platform-section-title">Studio</h2>
              <p className="platform-section-headline">40+ content types. Press releases to presentations. All informed by your intelligence.</p>
            </div>
          </div>

          <div className="platform-section-content">
            <div className="platform-section-features">
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <FileText size={18} style={{ color: '#8b5cf6' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">40+ content types</div>
                  <div className="platform-feature-detail">Press releases, bylines, social posts, talking points, media plans, and more</div>
                </div>
              </div>
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <Presentation size={18} style={{ color: '#8b5cf6' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Executive presentations</div>
                  <div className="platform-feature-detail">Board-ready decks generated with your data and strategic insights</div>
                </div>
              </div>
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <Video size={18} style={{ color: '#8b5cf6' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Visual generation</div>
                  <div className="platform-feature-detail">Images, videos, and presentations with AI-powered creation</div>
                </div>
              </div>
              <div className="platform-differentiator">
                Not templates — strategically-informed content that knows your voice
              </div>
            </div>

            <div className="platform-visual">
              <div className="platform-visual-header">
                <div className="platform-visual-dot red" />
                <div className="platform-visual-dot yellow" />
                <div className="platform-visual-dot green" />
                <span className="platform-visual-title">Content Types</span>
              </div>
              <div className="platform-visual-content">
                <div className="content-types-grid">
                  <div className="content-type-card">
                    <div className="content-type-icon" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                      <FileText size={20} style={{ color: '#3b82f6' }} />
                    </div>
                    <div className="content-type-label">Press Release</div>
                  </div>
                  <div className="content-type-card">
                    <div className="content-type-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
                      <Presentation size={20} style={{ color: '#8b5cf6' }} />
                    </div>
                    <div className="content-type-label">Presentation</div>
                  </div>
                  <div className="content-type-card">
                    <div className="content-type-icon" style={{ background: 'rgba(236, 72, 153, 0.15)' }}>
                      <MessageSquare size={20} style={{ color: '#ec4899' }} />
                    </div>
                    <div className="content-type-label">Social Post</div>
                  </div>
                  <div className="content-type-card">
                    <div className="content-type-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                      <Mail size={20} style={{ color: '#10b981' }} />
                    </div>
                    <div className="content-type-label">Media Pitch</div>
                  </div>
                  <div className="content-type-card">
                    <div className="content-type-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                      <BookOpen size={20} style={{ color: '#f59e0b' }} />
                    </div>
                    <div className="content-type-label">Byline Article</div>
                  </div>
                  <div className="content-type-card">
                    <div className="content-type-icon" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
                      <Mic size={20} style={{ color: '#ef4444' }} />
                    </div>
                    <div className="content-type-label">Talking Points</div>
                  </div>
                  <div className="content-type-card">
                    <div className="content-type-icon" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
                      <ImageIcon size={20} style={{ color: '#06b6d4' }} />
                    </div>
                    <div className="content-type-label">Image</div>
                  </div>
                  <div className="content-type-card">
                    <div className="content-type-icon" style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
                      <Video size={20} style={{ color: '#a855f7' }} />
                    </div>
                    <div className="content-type-label">Video</div>
                  </div>
                  <div className="content-type-card">
                    <div className="content-type-icon" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
                      <BarChart3 size={20} style={{ color: '#22c55e' }} />
                    </div>
                    <div className="content-type-label">Media Plan</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Campaign Builder */}
        <section className="platform-section">
          <div className="platform-section-header">
            <div className="platform-section-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <Target size={28} style={{ color: '#10b981' }} />
            </div>
            <div className="platform-section-text">
              <p className="platform-section-tagline" style={{ color: '#10b981' }}>ORCHESTRATE</p>
              <h2 className="platform-section-title">Campaign Builder</h2>
              <p className="platform-section-headline">VECTOR and GEO-VECTOR campaigns. From intent to execution with strategic refinement at every stage.</p>
            </div>
          </div>

          <div className="platform-section-content">
            <div className="platform-section-features">
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  <Target size={18} style={{ color: '#10b981' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">VECTOR campaigns</div>
                  <div className="platform-feature-detail">Multi-stage campaign planning: intent → research → positioning → blueprint → execution</div>
                </div>
              </div>
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  <Globe size={18} style={{ color: '#10b981' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">GEO-VECTOR campaigns</div>
                  <div className="platform-feature-detail">AI search optimization — own the narrative in ChatGPT, Gemini, and Perplexity</div>
                </div>
              </div>
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  <RefreshCw size={18} style={{ color: '#10b981' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Refinement loops</div>
                  <div className="platform-feature-detail">Iterate and improve at every stage — research, positioning, blueprint, execution</div>
                </div>
              </div>
              <div className="platform-differentiator">
                The only platform with native AI search optimization built into campaign planning
              </div>
            </div>

            <div className="platform-visual">
              <div className="platform-visual-header">
                <div className="platform-visual-dot red" />
                <div className="platform-visual-dot yellow" />
                <div className="platform-visual-dot green" />
                <span className="platform-visual-title">Campaign Flow</span>
              </div>
              <div className="platform-visual-content">
                <div className="campaign-flow">
                  <div className="campaign-stage">
                    <div className="campaign-stage-num" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>1</div>
                    <div className="campaign-stage-text">
                      <div className="campaign-stage-title">Intent Capture</div>
                      <div className="campaign-stage-desc">Define your campaign goal and objectives</div>
                    </div>
                    <span className="campaign-stage-status">COMPLETE</span>
                  </div>
                  <div className="campaign-stage">
                    <div className="campaign-stage-num" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>2</div>
                    <div className="campaign-stage-text">
                      <div className="campaign-stage-title">Strategic Research</div>
                      <div className="campaign-stage-desc">Stakeholder analysis, narrative landscape, channel intelligence</div>
                    </div>
                    <span className="campaign-stage-status">COMPLETE</span>
                  </div>
                  <div className="campaign-stage">
                    <div className="campaign-stage-num" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>3</div>
                    <div className="campaign-stage-text">
                      <div className="campaign-stage-title">Positioning Options</div>
                      <div className="campaign-stage-desc">Multiple strategic angles with strengths and risks</div>
                    </div>
                    <span className="campaign-stage-status">COMPLETE</span>
                  </div>
                  <div className="campaign-stage">
                    <div className="campaign-stage-num" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>4</div>
                    <div className="campaign-stage-text">
                      <div className="campaign-stage-title">Blueprint Generation</div>
                      <div className="campaign-stage-desc">Full campaign blueprint with stakeholder-specific tactics</div>
                    </div>
                    <span className="campaign-stage-status" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>IN PROGRESS</span>
                  </div>
                  <div className="campaign-stage">
                    <div className="campaign-stage-num" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--grey-400)' }}>5</div>
                    <div className="campaign-stage-text">
                      <div className="campaign-stage-title">Content Execution</div>
                      <div className="campaign-stage-desc">Generate all campaign content with one click</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GEO Intelligence */}
        <section className="platform-section">
          <div className="platform-section-header">
            <div className="platform-section-icon" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
              <Globe size={28} style={{ color: '#06b6d4' }} />
            </div>
            <div className="platform-section-text">
              <p className="platform-section-tagline" style={{ color: '#06b6d4' }}>OPTIMIZE</p>
              <h2 className="platform-section-title">GEO Intelligence</h2>
              <p className="platform-section-headline">Schema generation + PR credibility building. Own the AI search landscape.</p>
            </div>
          </div>

          <div className="platform-section-content">
            <div className="platform-section-features">
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                  <Layers size={18} style={{ color: '#06b6d4' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Schema engineering</div>
                  <div className="platform-feature-detail">Structure your narrative for AI model consumption and retrieval</div>
                </div>
              </div>
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                  <Search size={18} style={{ color: '#06b6d4' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">AI visibility tracking</div>
                  <div className="platform-feature-detail">See how ChatGPT, Gemini, Perplexity, and Claude perceive your brand</div>
                </div>
              </div>
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                  <Target size={18} style={{ color: '#06b6d4' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">PR-to-AI coordination</div>
                  <div className="platform-feature-detail">Every release optimized for LLM retrieval and citation</div>
                </div>
              </div>
              <div className="platform-differentiator">
                First platform combining AI schema generation with PR credibility-building to dominate AI search
              </div>
            </div>

            <div className="platform-visual">
              <div className="platform-visual-header">
                <div className="platform-visual-dot red" />
                <div className="platform-visual-dot yellow" />
                <div className="platform-visual-dot green" />
                <span className="platform-visual-title">GEO Schema</span>
              </div>
              <div className="platform-visual-content">
                <div className="geo-schema">
                  <span className="geo-schema-bracket">{'{'}</span><br/>
                  &nbsp;&nbsp;<span className="geo-schema-key">"@context"</span>: <span className="geo-schema-string">"https://schema.org"</span>,<br/>
                  &nbsp;&nbsp;<span className="geo-schema-key">"@type"</span>: <span className="geo-schema-string">"Organization"</span>,<br/>
                  &nbsp;&nbsp;<span className="geo-schema-key">"name"</span>: <span className="geo-schema-string">"Your Company"</span>,<br/>
                  &nbsp;&nbsp;<span className="geo-schema-key">"description"</span>: <span className="geo-schema-string">"Industry leader in..."</span>,<br/>
                  &nbsp;&nbsp;<span className="geo-schema-key">"expertise"</span>: [<span className="geo-schema-string">"Domain 1"</span>, <span className="geo-schema-string">"Domain 2"</span>],<br/>
                  &nbsp;&nbsp;<span className="geo-schema-key">"credentialEvidence"</span>: [...]<br/>
                  <span className="geo-schema-bracket">{'}'}</span>
                </div>
                <div className="geo-llms">
                  <div className="geo-llm">
                    <span className="geo-llm-name">ChatGPT</span>
                    <span className="geo-llm-score">78%</span>
                  </div>
                  <div className="geo-llm">
                    <span className="geo-llm-name">Gemini</span>
                    <span className="geo-llm-score">72%</span>
                  </div>
                  <div className="geo-llm">
                    <span className="geo-llm-name">Perplexity</span>
                    <span className="geo-llm-score">85%</span>
                  </div>
                  <div className="geo-llm">
                    <span className="geo-llm-name">Claude</span>
                    <span className="geo-llm-score">81%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Crisis Command */}
        <section className="platform-section">
          <div className="platform-section-header">
            <div className="platform-section-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <Shield size={28} style={{ color: '#ef4444' }} />
            </div>
            <div className="platform-section-text">
              <p className="platform-section-tagline" style={{ color: '#ef4444' }}>PROTECT</p>
              <h2 className="platform-section-title">Crisis Command</h2>
              <p className="platform-section-headline">AI-generated crisis plans. Real-time command center. Strategic guidance under pressure.</p>
            </div>
          </div>

          <div className="platform-section-content">
            <div className="platform-section-features">
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                  <FileText size={18} style={{ color: '#ef4444' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Crisis plan generator</div>
                  <div className="platform-feature-detail">Scenario-specific response playbooks generated by AI</div>
                </div>
              </div>
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                  <Activity size={18} style={{ color: '#ef4444' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Command center</div>
                  <div className="platform-feature-detail">Real-time coordination hub for crisis response</div>
                </div>
              </div>
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                  <Brain size={18} style={{ color: '#ef4444' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Crisis AI advisor</div>
                  <div className="platform-feature-detail">Strategic guidance from NIV when you need it most</div>
                </div>
              </div>
              <div className="platform-differentiator">
                Crisis prep + crisis response in one system — not two separate tools
              </div>
            </div>

            <div className="platform-visual">
              <div className="platform-visual-header">
                <div className="platform-visual-dot red" />
                <div className="platform-visual-dot yellow" />
                <div className="platform-visual-dot green" />
                <span className="platform-visual-title">Crisis Command Center</span>
              </div>
              <div className="platform-visual-content">
                <div className="crisis-panel">
                  <div className="crisis-header">
                    <Shield size={20} style={{ color: '#ef4444' }} />
                    <span className="crisis-title">Crisis Readiness Status</span>
                    <div className="crisis-status" style={{ marginLeft: 'auto' }}>
                      <div className="crisis-status-dot" />
                      PROTECTED
                    </div>
                  </div>
                  <div className="crisis-scenarios">
                    <div className="crisis-scenario">
                      <div className="crisis-scenario-title">Data Breach Protocol</div>
                      <div className="crisis-scenario-status">Playbook ready</div>
                    </div>
                    <div className="crisis-scenario">
                      <div className="crisis-scenario-title">Executive Crisis</div>
                      <div className="crisis-scenario-status">Playbook ready</div>
                    </div>
                    <div className="crisis-scenario">
                      <div className="crisis-scenario-title">Product Recall</div>
                      <div className="crisis-scenario-status">Playbook ready</div>
                    </div>
                    <div className="crisis-scenario">
                      <div className="crisis-scenario-title">Social Media Storm</div>
                      <div className="crisis-scenario-status">Playbook ready</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NIV Advisor */}
        <section className="platform-section">
          <div className="platform-section-header">
            <div className="platform-section-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <Brain size={28} style={{ color: '#8b5cf6' }} />
            </div>
            <div className="platform-section-text">
              <p className="platform-section-tagline" style={{ color: '#8b5cf6' }}>ADVISE</p>
              <h2 className="platform-section-title">NIV Advisor</h2>
              <p className="platform-section-headline">Your AI strategist. Research, strategy, content — all in one conversation.</p>
            </div>
          </div>

          <div className="platform-section-content">
            <div className="platform-section-features">
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <Search size={18} style={{ color: '#8b5cf6' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Strategic research</div>
                  <div className="platform-feature-detail">Ask NIV to research competitors, stakeholders, or market trends</div>
                </div>
              </div>
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <Target size={18} style={{ color: '#8b5cf6' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Strategy development</div>
                  <div className="platform-feature-detail">Collaborative strategy sessions with AI-powered insights</div>
                </div>
              </div>
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <Database size={18} style={{ color: '#8b5cf6' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Memory Vault integration</div>
                  <div className="platform-feature-detail">NIV learns from every interaction and your organizational history</div>
                </div>
              </div>
              <div className="platform-differentiator">
                The more you use NIV, the smarter it gets about YOUR organization
              </div>
            </div>

            <div className="platform-visual">
              <div className="platform-visual-header">
                <div className="platform-visual-dot red" />
                <div className="platform-visual-dot yellow" />
                <div className="platform-visual-dot green" />
                <span className="platform-visual-title">NIV Advisor</span>
              </div>
              <div className="niv-chat">
                <div className="niv-messages">
                  <div className="niv-message user">
                    Help me develop a thought leadership strategy for our CEO around AI governance
                  </div>
                  <div className="niv-message assistant">
                    Based on your intelligence feed and competitive positioning, I see a strong opportunity here. Let me outline three strategic angles for CEO thought leadership on AI governance...
                  </div>
                  <div className="niv-message user">
                    What media outlets should we target?
                  </div>
                  <div className="niv-message assistant">
                    Given your stakeholder map and the AI governance narrative landscape, I recommend a tiered approach: Tier 1 for credibility (WSJ, FT), Tier 2 for reach (TechCrunch, Wired), and industry-specific for depth...
                  </div>
                </div>
                <div className="niv-input">
                  <input type="text" className="niv-input-field" placeholder="Ask NIV anything..." />
                  <button className="niv-send-btn">
                    <ArrowRight size={18} style={{ color: 'white' }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Memory Vault */}
        <section className="platform-section">
          <div className="platform-section-header">
            <div className="platform-section-icon" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
              <Database size={28} style={{ color: '#ec4899' }} />
            </div>
            <div className="platform-section-text">
              <p className="platform-section-tagline" style={{ color: '#ec4899' }}>REMEMBER</p>
              <h2 className="platform-section-title">Memory Vault</h2>
              <p className="platform-section-headline">Semantic search. Organizational playbooks. The platform that learns.</p>
            </div>
          </div>

          <div className="platform-section-content">
            <div className="platform-section-features">
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
                  <Search size={18} style={{ color: '#ec4899' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Semantic search</div>
                  <div className="platform-feature-detail">Find anything by meaning, not just keywords — powered by embeddings</div>
                </div>
              </div>
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
                  <BookOpen size={18} style={{ color: '#ec4899' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Organizational playbook</div>
                  <div className="platform-feature-detail">Your strategies, frameworks, and approaches — refined over time</div>
                </div>
              </div>
              <div className="platform-feature">
                <div className="platform-feature-icon" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
                  <Layers size={18} style={{ color: '#ec4899' }} />
                </div>
                <div className="platform-feature-text">
                  <div className="platform-feature-label">Content fingerprinting</div>
                  <div className="platform-feature-detail">Never duplicate — always build on what works</div>
                </div>
              </div>
              <div className="platform-differentiator">
                The more you use it, the smarter it gets about YOUR organization
              </div>
            </div>

            <div className="platform-visual">
              <div className="platform-visual-header">
                <div className="platform-visual-dot red" />
                <div className="platform-visual-dot yellow" />
                <div className="platform-visual-dot green" />
                <span className="platform-visual-title">Memory Vault</span>
              </div>
              <div className="platform-visual-content">
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="Search by meaning..."
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        color: 'white',
                        fontSize: '0.9rem'
                      }}
                    />
                    <button style={{
                      background: 'var(--burnt-orange)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0 20px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}>
                      <Search size={18} style={{ color: 'white' }} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--grey-400)' }}>
                    1,247 items indexed • Semantic search enabled • Last sync: 2 min ago
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['Press Releases', 'Strategic Frameworks', 'Campaign Blueprints', 'Media Lists', 'Presentations'].map((folder, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      <Database size={16} style={{ color: '#ec4899' }} />
                      <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--grey-200)' }}>{folder}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--grey-500)' }}>{Math.floor(Math.random() * 200) + 50} items</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

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
