'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Brain,
  Target,
  Palette,
  Layers,
  Globe,
  Shield,
  MessageSquare,
  Database,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  Mail,
  Megaphone,
  Check,
  Clock,
  Zap,
  Search,
  Folder,
  BookOpen,
  Hash,
  Presentation
} from 'lucide-react'

export default function PlatformCapabilities() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-3">
            {/* NIV Parallelogram Logo */}
            <svg width="80" height="48" viewBox="0 0 80 48">
              <path d="M10 0 H80 V48 H0 L10 0 Z" fill="#faf9f7" />
              <text
                x="40"
                y="33"
                textAnchor="middle"
                fontFamily="Space Grotesk, sans-serif"
                fontSize="22"
                fontWeight="700"
                fill="#1a1a1a"
                letterSpacing="-0.5"
              >
                NIV
              </text>
              <path d="M68 0 H80 V12 L68 0 Z" fill="#c75d3a" />
            </svg>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '24px', fontWeight: 200 }}>|</span>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '1px' }}>by nivria</span>
          </Link>
          <button
            onClick={() => router.push('/auth/signup')}
            className="px-5 py-2 bg-[#c75d3a] text-white text-sm font-medium rounded-lg hover:bg-[#e07b5a] transition-colors"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#c75d3a]/10 border border-[#c75d3a]/30 rounded-full mb-6">
            <span className="text-[#c75d3a] text-xs font-medium tracking-wider uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Platform Capabilities</span>
          </div>
          <h1 className="text-5xl md:text-6xl text-white mb-6 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            Strategic Communications,<br /><em className="text-[#c75d3a]">Automated</em>
          </h1>
          <p className="text-xl text-[#9e9e9e] max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
            From signal detection to campaign execution, NIV orchestrates your entire communications strategy with AI-powered precision.
          </p>
        </div>
      </section>

      {/* Section 1: Intelligence Hub */}
      <section className="py-24 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Intelligence Hub</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                Executive Intelligence Briefs
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                NIV continuously monitors market signals, competitor movements, and industry developments to deliver actionable executive briefings with strategic recommendations.
              </p>
              <ul className="space-y-3">
                {['Real-time signal analysis', 'Competitive intelligence', 'Strategic implications', 'Priority action items'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#bdbdbd]">
                    <div className="w-5 h-5 rounded-full bg-[#c75d3a]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#c75d3a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Intelligence Brief Mockup */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
              {/* Brief Header */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[#c75d3a] text-xs font-semibold tracking-[0.15em] uppercase mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Executive Intelligence Brief</div>
                    <div className="text-[#757575] text-sm">December 2, 2024 • 47 signals analyzed</div>
                  </div>
                  <div className="px-3 py-1 bg-[#c75d3a]/10 rounded-full">
                    <span className="text-[#c75d3a] text-xs font-medium">LIVE</span>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#c75d3a]"></div>
                  <span className="text-white text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>EXECUTIVE SUMMARY</span>
                </div>
                <p className="text-[#bdbdbd] leading-relaxed" style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}>
                  "Market conditions have shifted significantly this quarter with three major competitors announcing AI partnerships. Your positioning as an innovation leader creates a <span className="text-[#c75d3a]">72-hour window</span> to establish thought leadership before the narrative solidifies..."
                </p>
              </div>

              {/* Key Developments */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#c75d3a]"></div>
                  <span className="text-white text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>KEY DEVELOPMENTS</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded">COMPETITIVE</span>
                      <span className="text-[#757575] text-xs">TODAY</span>
                    </div>
                    <p className="text-[#e0e0e0] text-sm">TechRival announces Azure AI integration partnership</p>
                    <p className="text-[#757575] text-xs mt-1">Impact: Threatens market positioning</p>
                  </div>
                  <div className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded">INDUSTRY</span>
                      <span className="text-[#757575] text-xs">2 DAYS AGO</span>
                    </div>
                    <p className="text-[#e0e0e0] text-sm">New regulatory framework published for AI compliance</p>
                    <p className="text-[#757575] text-xs mt-1">Impact: Creates thought leadership opportunity</p>
                  </div>
                </div>
              </div>

              {/* Priority Signals Sidebar */}
              <div className="p-6 bg-[#212121]">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-[#c75d3a]" />
                  <span className="text-white text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>PRIORITY SIGNALS</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-red-400 text-xs font-semibold mb-1">IMMEDIATE THREATS</div>
                    <ul className="text-[#9e9e9e] text-sm space-y-1">
                      <li className="flex items-start gap-2"><span className="text-red-400">•</span>Competitor narrative gaining Tier-1 traction</li>
                      <li className="flex items-start gap-2"><span className="text-red-400">•</span>Key analyst shifting perspective</li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-[#c75d3a] text-xs font-semibold mb-1">OPPORTUNITIES</div>
                    <ul className="text-[#9e9e9e] text-sm space-y-1">
                      <li className="flex items-start gap-2"><span className="text-[#c75d3a]">•</span>Industry award nomination window open</li>
                      <li className="flex items-start gap-2"><span className="text-[#c75d3a]">•</span>Speaking slot available at TechConf</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Opportunity Engine */}
      <section className="py-24 px-6 bg-[#0d0d0d] border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Opportunity Card Mockup */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
              {/* Card Header */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 flex items-center justify-center">
                      <span className="text-green-400 text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>92</span>
                    </div>
                    <div>
                      <h3 className="text-white text-lg font-semibold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Partnership Response Strategy</h3>
                      <p className="text-[#9e9e9e] text-sm">Position as the established leader in enterprise AI before competitor narrative solidifies</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[#757575] text-xs">leadership</span>
                        <span className="text-[#757575] text-xs">•</span>
                        <span className="text-[#757575] text-xs">12 content items</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs font-semibold rounded border border-red-500/30">HIGH</span>
                    <span className="px-2 py-1 bg-[#c75d3a]/10 text-[#c75d3a] text-xs font-semibold rounded border border-[#c75d3a]/30">EXECUTED</span>
                  </div>
                </div>
              </div>

              {/* Strategic Context */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="text-white text-sm font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>STRATEGIC CONTEXT</div>

                <div className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e] mb-3">
                  <div className="text-[#757575] text-xs font-semibold mb-2">TRIGGER EVENTS</div>
                  <ul className="text-[#bdbdbd] text-sm space-y-1">
                    <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-[#c75d3a] mt-1 flex-shrink-0" />TechRival announces Azure AI integration</li>
                    <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-[#c75d3a] mt-1 flex-shrink-0" />Industry report shows 40% AI adoption increase</li>
                    <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-[#c75d3a] mt-1 flex-shrink-0" />Key analyst publishes competitive comparison</li>
                  </ul>
                </div>

                <div className="bg-[#c75d3a]/5 rounded-lg p-4 border border-[#c75d3a]/20">
                  <div className="text-[#c75d3a] text-xs font-semibold mb-2">WHY NOW</div>
                  <p className="text-[#bdbdbd] text-sm">72-hour window before competitor narrative becomes the default industry framing. Early movers will shape the conversation and capture media attention.</p>
                </div>
              </div>

              {/* Content to be Generated */}
              <div className="p-6 bg-[#212121]">
                <div className="text-white text-sm font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>CONTENT TO BE GENERATED</div>
                <div className="space-y-2">
                  {[
                    { icon: FileText, type: 'Press Release', target: 'Industry Analysts', timing: 'immediate', timingColor: 'text-[#c75d3a] bg-[#c75d3a]/10' },
                    { icon: Hash, type: 'Social Thread', target: 'Tech Community', timing: 'immediate', timingColor: 'text-[#c75d3a] bg-[#c75d3a]/10' },
                    { icon: Mail, type: 'Media Pitch', target: 'Tier-1 Journalists', timing: 'this_week', timingColor: 'text-[#757575] bg-[#3d3d3d]' },
                    { icon: BookOpen, type: 'Thought Leadership', target: 'Enterprise Buyers', timing: 'this_week', timingColor: 'text-[#757575] bg-[#3d3d3d]' },
                    { icon: Megaphone, type: 'Talking Points', target: 'Executive Team', timing: 'immediate', timingColor: 'text-[#c75d3a] bg-[#c75d3a]/10' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#2e2e2e]">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-[#c75d3a]" />
                        <span className="text-white text-sm">{item.type}</span>
                        <span className="text-[#757575] text-xs">→</span>
                        <span className="text-[#9e9e9e] text-sm">{item.target}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded ${item.timingColor}`}>{item.timing}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-3 bg-[#c75d3a] text-white font-semibold rounded-lg hover:bg-[#e07b5a] transition-colors flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  Execute Campaign - Generate All Content
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Opportunity Engine</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                One-Click Campaign Execution
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                NIV identifies strategic opportunities from market signals and creates complete execution plans. One click generates all campaign content—press releases, social posts, pitches, and more.
              </p>
              <ul className="space-y-3">
                {['Automatic opportunity scoring', 'Strategic context analysis', 'Multi-stakeholder campaign plans', 'Full content generation'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#bdbdbd]">
                    <div className="w-5 h-5 rounded-full bg-[#c75d3a]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#c75d3a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Studio */}
      <section className="py-24 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Studio</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                AI-Powered Content Creation
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                Generate any type of communications content with organizational context. From press releases to executive statements, NIV creates on-brand content informed by your Memory Vault.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Written', items: 'Press Release, Blog, Thought Leadership' },
                  { label: 'Social', items: 'LinkedIn, Twitter Thread, Instagram' },
                  { label: 'Executive', items: 'Statements, Board Decks, Investor Updates' },
                  { label: 'Media', items: 'Pitches, Media Lists, Interview Prep' },
                ].map((cat, i) => (
                  <div key={i} className="p-4 bg-[#1a1a1a] rounded-lg border border-[#2e2e2e]">
                    <div className="text-[#c75d3a] text-xs font-semibold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{cat.label}</div>
                    <div className="text-[#9e9e9e] text-sm">{cat.items}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Studio Content Examples Mockup */}
            <div className="space-y-4">
              {/* Press Release Example */}
              <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2e2e2e] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#c75d3a]" />
                    <span className="text-white text-sm font-medium">Press Release</span>
                  </div>
                  <span className="text-[#757575] text-xs">Generated</span>
                </div>
                <div className="p-5">
                  <div className="text-[#757575] text-xs tracking-wider mb-3">FOR IMMEDIATE RELEASE</div>
                  <h4 className="text-white text-lg font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Acme Corp Announces Industry-First AI Integration Platform, Transforming Enterprise Workflows
                  </h4>
                  <p className="text-[#9e9e9e] text-sm leading-relaxed mb-3">
                    <span className="text-[#bdbdbd]">SAN FRANCISCO – December 2, 2024</span> – Acme Corp, the leading provider of enterprise automation solutions, today announced the launch of AIFlow, a groundbreaking platform that seamlessly integrates artificial intelligence...
                  </p>
                  <p className="text-[#9e9e9e] text-sm leading-relaxed italic" style={{ fontFamily: 'Playfair Display, serif' }}>
                    "This represents a fundamental shift in how enterprises approach automation," said Jane Smith, CEO of Acme Corp. "We've spent two years developing technology that..."
                  </p>
                </div>
              </div>

              {/* Two Column: LinkedIn + Executive Statement */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#2e2e2e] flex items-center gap-2">
                    <Hash className="w-4 h-4 text-[#c75d3a]" />
                    <span className="text-white text-sm font-medium">LinkedIn Post</span>
                  </div>
                  <div className="p-4">
                    <p className="text-[#bdbdbd] text-sm leading-relaxed">
                      🚀 Excited to share that we've just launched AIFlow — transforming how enterprises work.
                      <br /><br />
                      After 18 months of development with Fortune 500 beta partners, we've proven that AI automation can deliver 40% efficiency gains...
                    </p>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#2e2e2e] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#c75d3a]" />
                    <span className="text-white text-sm font-medium">Executive Statement</span>
                  </div>
                  <div className="p-4">
                    <p className="text-[#bdbdbd] text-sm leading-relaxed italic" style={{ fontFamily: 'Playfair Display, serif' }}>
                      "Our commitment to innovation has never been stronger. Today marks a pivotal moment in our company's journey toward redefining what's possible..."
                    </p>
                    <p className="text-[#757575] text-xs mt-3">— Jane Smith, CEO</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Presentations */}
      <section className="py-24 px-6 bg-[#0d0d0d] border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Presentation className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Presentations</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                From Insight to <em className="text-[#c75d3a]">Presentation</em> in Minutes
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                Work with NIV to create beautiful, professional presentations on any topic. Whether it's a campaign blueprint, executive briefing, board deck, or strategic analysis—NIV transforms your ideas into polished, ready-to-present materials.
              </p>
              <ul className="space-y-3 mb-8">
                {['Campaign blueprints & strategies', 'Executive briefings & board decks', 'Competitive analyses & market reports', 'Crisis communication plans', 'Any custom topic you need'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#bdbdbd]">
                    <div className="w-5 h-5 rounded-full bg-[#c75d3a]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#c75d3a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              {/* How it works */}
              <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-6">
                <div className="text-white text-sm font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>HOW IT WORKS</div>
                <div className="space-y-4">
                  {[
                    { step: '1', title: 'Describe what you need', desc: 'Tell NIV what presentation you want to create' },
                    { step: '2', title: 'NIV researches & structures', desc: 'AI gathers insights and builds your narrative' },
                    { step: '3', title: 'Review & refine together', desc: 'Iterate with NIV until it\'s perfect' },
                    { step: '4', title: 'Export & present', desc: 'Download or present directly from NIV' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#c75d3a]/10 border border-[#c75d3a]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#c75d3a] text-sm font-bold">{item.step}</span>
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{item.title}</div>
                        <div className="text-[#757575] text-xs">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Presentation Visual Mockup */}
            <div className="space-y-4">
              {/* Main Presentation Slide */}
              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
                {/* Slide Header */}
                <div className="px-4 py-3 border-b border-[#2e2e2e] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Presentation className="w-4 h-4 text-[#c75d3a]" />
                    <span className="text-white text-sm font-medium">Campaign Blueprint</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#757575] text-xs">Slide 1 of 8</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#c75d3a]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#3d3d3d]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#3d3d3d]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#3d3d3d]"></div>
                    </div>
                  </div>
                </div>

                {/* Slide Content */}
                <div className="p-8 bg-gradient-to-br from-[#1a1a1a] to-[#212121]">
                  <div className="text-[#c75d3a] text-xs font-semibold tracking-[0.15em] uppercase mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>STRATEGIC BLUEPRINT</div>
                  <h3 className="text-white text-2xl font-semibold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                    AI Leadership <em className="text-[#c75d3a]">Positioning</em> Campaign
                  </h3>
                  <p className="text-[#9e9e9e] text-sm mb-6">Establish thought leadership in enterprise AI before competitor narratives solidify</p>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3d3d3d]">
                      <div className="text-[#c75d3a] text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>72hr</div>
                      <div className="text-[#757575] text-xs">Window</div>
                    </div>
                    <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3d3d3d]">
                      <div className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>23</div>
                      <div className="text-[#757575] text-xs">Content Pieces</div>
                    </div>
                    <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3d3d3d]">
                      <div className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>3</div>
                      <div className="text-[#757575] text-xs">Stakeholder Groups</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide Thumbnails */}
              <div className="grid grid-cols-4 gap-3">
                {/* Executive Summary */}
                <div className="bg-[#1a1a1a] rounded-lg border border-[#2e2e2e] p-2 cursor-pointer hover:border-[#c75d3a]/50 transition-colors">
                  <div className="bg-[#212121] rounded p-2 mb-2">
                    <div className="w-full h-1 bg-[#c75d3a]/40 rounded mb-1.5"></div>
                    <div className="w-3/4 h-0.5 bg-[#3d3d3d] rounded mb-1"></div>
                    <div className="w-full h-0.5 bg-[#3d3d3d] rounded mb-1"></div>
                    <div className="flex gap-1 mt-2">
                      <div className="flex-1 h-4 bg-[#2a2a2a] rounded"></div>
                      <div className="flex-1 h-4 bg-[#2a2a2a] rounded"></div>
                    </div>
                  </div>
                  <div className="text-[#9e9e9e] text-xs truncate">Executive Summary</div>
                </div>

                {/* Market Analysis */}
                <div className="bg-[#1a1a1a] rounded-lg border border-[#2e2e2e] p-2 cursor-pointer hover:border-[#c75d3a]/50 transition-colors">
                  <div className="bg-[#212121] rounded p-2 mb-2">
                    <div className="w-2/3 h-1 bg-[#c75d3a]/40 rounded mb-1.5"></div>
                    <div className="flex items-end gap-0.5 h-6 mt-1">
                      <div className="flex-1 bg-[#c75d3a]/30 rounded-t" style={{ height: '40%' }}></div>
                      <div className="flex-1 bg-[#c75d3a]/40 rounded-t" style={{ height: '60%' }}></div>
                      <div className="flex-1 bg-[#c75d3a]/50 rounded-t" style={{ height: '80%' }}></div>
                      <div className="flex-1 bg-[#c75d3a]/60 rounded-t" style={{ height: '100%' }}></div>
                    </div>
                  </div>
                  <div className="text-[#9e9e9e] text-xs truncate">Market Analysis</div>
                </div>

                {/* Strategic Approach */}
                <div className="bg-[#1a1a1a] rounded-lg border border-[#2e2e2e] p-2 cursor-pointer hover:border-[#c75d3a]/50 transition-colors">
                  <div className="bg-[#212121] rounded p-2 mb-2">
                    <div className="w-3/4 h-1 bg-[#c75d3a]/40 rounded mb-1.5"></div>
                    <div className="space-y-1 mt-1">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c75d3a]/50"></div>
                        <div className="flex-1 h-0.5 bg-[#3d3d3d] rounded"></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c75d3a]/50"></div>
                        <div className="flex-1 h-0.5 bg-[#3d3d3d] rounded"></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c75d3a]/50"></div>
                        <div className="flex-1 h-0.5 bg-[#3d3d3d] rounded"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[#9e9e9e] text-xs truncate">Strategic Approach</div>
                </div>

                {/* Timeline & KPIs */}
                <div className="bg-[#1a1a1a] rounded-lg border border-[#2e2e2e] p-2 cursor-pointer hover:border-[#c75d3a]/50 transition-colors">
                  <div className="bg-[#212121] rounded p-2 mb-2">
                    <div className="w-2/3 h-1 bg-[#c75d3a]/40 rounded mb-1.5"></div>
                    <div className="flex items-center gap-0.5 mt-2">
                      <div className="w-2 h-2 rounded-full bg-[#c75d3a]/50"></div>
                      <div className="flex-1 h-0.5 bg-[#3d3d3d]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#3d3d3d]"></div>
                      <div className="flex-1 h-0.5 bg-[#3d3d3d]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#3d3d3d]"></div>
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      <div className="flex-1 h-2 bg-[#2a2a2a] rounded text-center">
                        <span className="text-[4px] text-[#555]">Q1</span>
                      </div>
                      <div className="flex-1 h-2 bg-[#2a2a2a] rounded"></div>
                    </div>
                  </div>
                  <div className="text-[#9e9e9e] text-xs truncate">Timeline & KPIs</div>
                </div>
              </div>

              {/* NIV Chat Integration */}
              <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-4">
                <div className="flex items-start gap-3">
                  <svg width="32" height="32" viewBox="0 0 72 72" className="flex-shrink-0">
                    <rect width="72" height="72" rx="16" fill="#faf9f7" />
                    <text x="10" y="50" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="36" fill="#1a1a1a">NIV</text>
                    <polygon points="58,0 72,0 72,14" fill="#c75d3a" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-[#bdbdbd] text-sm mb-3">
                      I've created an 8-slide blueprint based on your AI partnership response strategy. Want me to add a competitive analysis section or adjust the timeline?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button className="px-3 py-1.5 bg-[#c75d3a] text-white text-xs rounded-lg">Add Competitive Analysis</button>
                      <button className="px-3 py-1.5 bg-[#3d3d3d] text-[#bdbdbd] text-xs rounded-lg">Adjust Timeline</button>
                      <button className="px-3 py-1.5 bg-[#3d3d3d] text-[#bdbdbd] text-xs rounded-lg">Export PDF</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: VECTOR Campaign Builder */}
      <section className="py-24 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-[#c75d3a]" />
              <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>VECTOR Campaign Builder</span>
            </div>
            <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Multi-Stakeholder Influence Orchestration
            </h2>
            <p className="text-[#9e9e9e] text-lg max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              VECTOR campaigns coordinate messaging across stakeholder groups through four strategic phases, leveraging psychological insights to maximize influence and narrative control.
            </p>
          </div>

          {/* VECTOR Matrix Mockup */}
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
            {/* Campaign Header */}
            <div className="p-6 border-b border-[#2e2e2e]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white text-xl font-semibold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>VECTOR CAMPAIGN: AI Leadership Positioning</h3>
                  <p className="text-[#757575] text-sm">23 content pieces • 3 stakeholder groups • 8-week timeline</p>
                </div>
                <div className="px-4 py-2 bg-[#c75d3a]/10 rounded-lg border border-[#c75d3a]/30">
                  <div className="text-[#c75d3a] text-xs font-semibold mb-0.5">PATTERN</div>
                  <div className="text-white text-sm font-medium">CASCADE</div>
                </div>
              </div>
              <p className="text-[#9e9e9e] text-sm mt-3 italic">"Influencer groups shift first, creating validation for mass adoption"</p>
            </div>

            {/* Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2e2e2e]">
                    <th className="p-4 text-left text-[#757575] text-xs font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>STAKEHOLDER</th>
                    <th className="p-4 text-center text-[#757575] text-xs font-semibold border-l border-[#2e2e2e]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      <div>AWARENESS</div>
                      <div className="text-[#555555] font-normal mt-1">Week 1-2</div>
                    </th>
                    <th className="p-4 text-center text-[#757575] text-xs font-semibold border-l border-[#2e2e2e]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      <div>CONSIDERATION</div>
                      <div className="text-[#555555] font-normal mt-1">Week 3-4</div>
                    </th>
                    <th className="p-4 text-center text-[#757575] text-xs font-semibold border-l border-[#2e2e2e]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      <div>CONVERSION</div>
                      <div className="text-[#555555] font-normal mt-1">Week 5-6</div>
                    </th>
                    <th className="p-4 text-center text-[#757575] text-xs font-semibold border-l border-[#2e2e2e]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      <div>ADVOCACY</div>
                      <div className="text-[#555555] font-normal mt-1">Week 7+</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: 'Industry Analysts',
                      bias: 'Authority bias, early-adopter identity',
                      cells: [
                        ['Thought leadership', 'Embargo briefings'],
                        ['Deep-dive briefings', '1:1 analyst calls'],
                        ['Case studies', 'Demo access'],
                        ['Speaking circuit', 'Quote inclusions']
                      ]
                    },
                    {
                      name: 'Enterprise Buyers',
                      bias: 'Loss aversion, social proof from analysts',
                      cells: [
                        ['PR coverage', 'LinkedIn campaign'],
                        ['Webinar series', 'White papers'],
                        ['ROI calculator', 'Free trial'],
                        ['Customer stories', 'Reference program']
                      ]
                    },
                    {
                      name: 'Tech Community',
                      bias: 'Technical credibility, innovation identity',
                      cells: [
                        ['Social threads', 'Reddit AMA'],
                        ['Technical blogs', 'API documentation'],
                        ['GitHub access', 'Beta program'],
                        ['Community champions', 'Open source']
                      ]
                    }
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-[#2e2e2e] last:border-b-0">
                      <td className="p-4">
                        <div className="text-white text-sm font-medium mb-1">{row.name}</div>
                        <div className="text-[#555555] text-xs">{row.bias}</div>
                      </td>
                      {row.cells.map((cell, j) => (
                        <td key={j} className="p-4 border-l border-[#2e2e2e]">
                          <ul className="space-y-1">
                            {cell.map((item, k) => (
                              <li key={k} className="text-[#9e9e9e] text-xs flex items-center gap-1">
                                <span className="text-[#c75d3a]">•</span> {item}
                              </li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Psychological Leverage Footer */}
            <div className="p-6 bg-[#212121] border-t border-[#2e2e2e]">
              <div className="text-white text-sm font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>PSYCHOLOGICAL LEVERAGE</div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-[#9e9e9e] text-sm"><span className="text-[#c75d3a]">Analysts:</span> Authority bias, early-adopter identity</div>
                <div className="text-[#9e9e9e] text-sm"><span className="text-[#c75d3a]">Buyers:</span> Loss aversion, social proof validation</div>
                <div className="text-[#9e9e9e] text-sm"><span className="text-[#c75d3a]">Community:</span> Technical credibility, innovation identity</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: GEO Intelligence */}
      <section className="py-24 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>GEO Intelligence</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                AI Platform Visibility
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                Optimize your organization's presence in AI-powered search and recommendation systems. GEO generates Schema.org structured data and tracks visibility across major AI platforms.
              </p>
              <ul className="space-y-3">
                {['Schema.org structured data generation', 'Multi-platform AI visibility tracking', 'Competitive visibility analysis', 'Optimization recommendations'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#bdbdbd]">
                    <div className="w-5 h-5 rounded-full bg-[#c75d3a]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#c75d3a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* GEO Mockup */}
            <div className="space-y-4">
              {/* Schema Preview */}
              <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2e2e2e] flex items-center justify-between">
                  <span className="text-white text-sm font-medium">Generated Schema</span>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 text-xs">Validated</span>
                  </div>
                </div>
                <div className="p-4 font-mono text-xs overflow-x-auto">
                  <pre className="text-[#9e9e9e]">
{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Acme Corp",
  "description": "Enterprise AI automation leader",
  "url": "https://acme.com",
  "founder": {
    "@type": "Person",
    "name": "Jane Smith",
    "jobTitle": "CEO"
  },
  "knowsAbout": [
    "Artificial Intelligence",
    "Enterprise Automation"
  ]
}
</script>`}
                  </pre>
                </div>
                <div className="px-4 py-3 bg-[#212121] border-t border-[#2e2e2e] flex items-center gap-4">
                  <span className="text-[#757575] text-xs">✓ 12 entities defined</span>
                  <span className="text-[#757575] text-xs">✓ Rich snippets eligible</span>
                </div>
              </div>

              {/* AI Platform Visibility */}
              <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-6">
                <div className="text-white text-sm font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI PLATFORM VISIBILITY</div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'ChatGPT', logo: '🤖', score: 72, trend: '+12%', color: 'text-green-400' },
                    { name: 'Gemini', logo: '✨', score: 58, trend: '+8%', color: 'text-green-400' },
                    { name: 'Perplexity', logo: '🔍', score: 84, trend: '+23%', color: 'text-green-400' },
                    { name: 'Claude', logo: '🧠', score: 45, trend: '-3%', color: 'text-red-400' },
                  ].map((platform, i) => (
                    <div key={i} className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{platform.logo}</span>
                          <span className="text-white text-sm font-medium">{platform.name}</span>
                        </div>
                        <span className={`text-xs ${platform.color}`}>{platform.trend} MTD</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[#3d3d3d] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#c75d3a] rounded-full"
                            style={{ width: `${platform.score}%` }}
                          ></div>
                        </div>
                        <span className="text-white text-sm font-semibold">{platform.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-[#2e2e2e]">
                  <div className="text-[#757575] text-xs mb-2">TOP QUERIES WHERE YOU APPEAR:</div>
                  <div className="space-y-1">
                    <div className="text-[#9e9e9e] text-sm">"best enterprise AI tools" — <span className="text-[#c75d3a]">Position #3</span></div>
                    <div className="text-[#9e9e9e] text-sm">"AI automation platforms" — <span className="text-[#c75d3a]">Position #5</span></div>
                    <div className="text-[#757575] text-sm">"machine learning for business" — <span className="text-red-400">Not ranking</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Crisis Command */}
      <section className="py-24 px-6 bg-[#0d0d0d] border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Crisis Mockup */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#c75d3a] rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Crisis Command</h3>
                      <p className="text-[#757575] text-sm">Readiness Dashboard</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#9e9e9e] text-sm">Overall Readiness</span>
                    <span className="text-white text-sm font-semibold">78%</span>
                  </div>
                  <div className="h-2 bg-[#3d3d3d] rounded-full overflow-hidden">
                    <div className="h-full bg-[#c75d3a] rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
              </div>

              {/* Crisis Scenarios */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="text-white text-sm font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>CRISIS SCENARIOS</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { severity: 'CRITICAL', color: 'red', title: 'Data Breach Response', desc: 'Unauthorized access to customer data detected', likelihood: 'HIGH' },
                    { severity: 'HIGH', color: 'orange', title: 'Executive Misconduct', desc: 'Allegations of improper conduct by senior leader', likelihood: 'MEDIUM' },
                    { severity: 'HIGH', color: 'orange', title: 'Product Safety Recall', desc: 'Product defect requiring public announcement', likelihood: 'LOW' },
                    { severity: 'MODERATE', color: 'yellow', title: 'Social Media Backlash', desc: 'Viral negative content threatening brand', likelihood: 'HIGH' },
                  ].map((scenario, i) => (
                    <div key={i} className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e] hover:border-[#c75d3a]/50 transition-colors cursor-pointer">
                      <div className={`text-xs font-semibold mb-2 ${
                        scenario.color === 'red' ? 'text-red-400' :
                        scenario.color === 'orange' ? 'text-[#c75d3a]' : 'text-yellow-400'
                      }`}>
                        {scenario.color === 'red' ? '🔴' : scenario.color === 'orange' ? '🟠' : '🟡'} {scenario.severity}
                      </div>
                      <h4 className="text-white text-sm font-medium mb-1">{scenario.title}</h4>
                      <p className="text-[#757575] text-xs mb-2">{scenario.desc}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[#555555] text-xs">Likelihood: {scenario.likelihood}</span>
                        <span className="text-[#c75d3a] text-xs">View →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Crisis Team */}
              <div className="p-6 bg-[#212121]">
                <div className="text-white text-sm font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>CRISIS TEAM READINESS</div>
                <div className="space-y-2">
                  {[
                    { role: 'Crisis Lead (CEO)', assigned: true },
                    { role: 'Comms Lead (VP Comms)', assigned: true },
                    { role: 'Legal Counsel', assigned: true },
                    { role: 'Technical Lead', assigned: false },
                    { role: 'HR Representative', assigned: false },
                  ].map((member, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-[#9e9e9e] text-sm">{member.role}</span>
                      {member.assigned ? (
                        <span className="text-green-400 text-xs flex items-center gap-1">
                          <Check className="w-3 h-3" /> Assigned
                        </span>
                      ) : (
                        <span className="text-[#757575] text-xs flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-yellow-400" /> Not Assigned
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Crisis Command</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                Crisis Readiness & Response
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                Pre-built crisis playbooks tailored to your organization. NIV generates comprehensive crisis plans with scenario-specific response protocols, stakeholder communications, and real-time AI guidance during active situations.
              </p>
              <ul className="space-y-3">
                {['AI-generated crisis plans', 'Scenario-specific playbooks', 'Team role assignments', 'Real-time crisis AI assistant'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#bdbdbd]">
                    <div className="w-5 h-5 rounded-full bg-[#c75d3a]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#c75d3a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: NIV Advisor */}
      <section className="py-24 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>NIV Advisor</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                Your AI Communications Partner
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                NIV is your always-available strategic advisor. Ask anything about your organization, get recommendations on opportunities, generate content, or navigate crisis situations—all with full organizational context.
              </p>
              <ul className="space-y-3">
                {['Organizational context awareness', 'Strategic recommendations', 'Any content type generation', 'Memory across conversations'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#bdbdbd]">
                    <div className="w-5 h-5 rounded-full bg-[#c75d3a]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#c75d3a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* NIV Chat Mockup */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
              {/* NIV Header with Badge */}
              <div className="p-6 border-b border-[#2e2e2e] flex items-center gap-4">
                {/* NIV Square Icon - Primary Icon (Light) */}
                <svg width="56" height="56" viewBox="0 0 72 72">
                  <rect width="72" height="72" rx="16" fill="#faf9f7" />
                  <text
                    x="10"
                    y="50"
                    fontFamily="Space Grotesk, sans-serif"
                    fontWeight="700"
                    fontSize="36"
                    fill="#1a1a1a"
                  >
                    NIV
                  </text>
                  <polygon points="58,0 72,0 72,14" fill="#c75d3a" />
                </svg>
                <div>
                  <h3 className="text-white text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>NIV Advisor</h3>
                  <p className="text-[#757575] text-sm">Neural Intelligence Vehicle</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="p-6 space-y-4 max-h-96">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-[#3d3d3d] rounded-2xl rounded-tr-md px-4 py-3 max-w-[80%]">
                    <p className="text-white text-sm">What opportunities should I prioritize this week?</p>
                  </div>
                </div>

                {/* NIV Response */}
                <div className="flex justify-start">
                  <div className="bg-[#212121] rounded-2xl rounded-tl-md px-4 py-3 max-w-[90%] border border-[#2e2e2e]">
                    <p className="text-[#bdbdbd] text-sm mb-4">Based on my analysis of 47 signals from the past 48 hours, I recommend prioritizing:</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-400 text-xs font-bold">92</span>
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">AI Partnership Response</div>
                          <div className="text-[#757575] text-xs">72-hour window before narrative solidifies</div>
                          <div className="text-[#c75d3a] text-xs mt-1">→ Execute now for maximum impact</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-yellow-400 text-xs font-bold">78</span>
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">Earnings Narrative Setup</div>
                          <div className="text-[#757575] text-xs">Q4 results release in 2 weeks</div>
                          <div className="text-[#9e9e9e] text-xs mt-1">→ Begin analyst briefings this week</div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[#bdbdbd] text-sm mb-3">Should I generate a campaign for the AI response?</p>

                    <div className="flex flex-wrap gap-2">
                      <button className="px-3 py-1.5 bg-[#c75d3a] text-white text-xs rounded-lg">Generate Campaign</button>
                      <button className="px-3 py-1.5 bg-[#3d3d3d] text-[#bdbdbd] text-xs rounded-lg">Show Details</button>
                      <button className="px-3 py-1.5 bg-[#3d3d3d] text-[#bdbdbd] text-xs rounded-lg">Other</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[#2e2e2e]">
                <div className="flex items-center gap-3 bg-[#212121] rounded-xl px-4 py-3 border border-[#2e2e2e]">
                  <MessageSquare className="w-5 h-5 text-[#555555]" />
                  <input
                    type="text"
                    placeholder="Ask NIV anything about your organization..."
                    className="flex-1 bg-transparent text-white text-sm placeholder-[#555555] outline-none"
                  />
                  <button className="px-4 py-1.5 bg-[#c75d3a] text-white text-xs rounded-lg">Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: Memory Vault */}
      <section className="py-24 px-6 bg-[#0d0d0d] border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Memory Vault Mockup */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="w-5 h-5 text-[#c75d3a]" />
                  <h3 className="text-white text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Memory Vault</h3>
                </div>
                <div className="flex items-center gap-3 bg-[#212121] rounded-xl px-4 py-3 border border-[#2e2e2e]">
                  <Search className="w-5 h-5 text-[#555555]" />
                  <input
                    type="text"
                    placeholder="Search your organizational knowledge..."
                    className="flex-1 bg-transparent text-white text-sm placeholder-[#555555] outline-none"
                  />
                </div>
                <div className="text-[#555555] text-xs mt-2">Semantic search powered by AI</div>
              </div>

              {/* Content */}
              <div className="flex">
                {/* Folders */}
                <div className="w-48 border-r border-[#2e2e2e] p-4">
                  <div className="text-[#757575] text-xs font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>FOLDERS</div>
                  <div className="space-y-1">
                    {[
                      { name: 'Campaigns', count: 12, expanded: true, children: ['Q4 Launch', 'AI Response'] },
                      { name: 'Intelligence', count: 24, expanded: false },
                      { name: 'Content', count: 89, expanded: false },
                      { name: 'Crisis Plans', count: 3, expanded: false },
                      { name: 'Org Profile', count: 1, expanded: false },
                    ].map((folder, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[#212121] cursor-pointer">
                          <Folder className="w-4 h-4 text-[#c75d3a]" />
                          <span className="text-[#bdbdbd] text-sm flex-1">{folder.name}</span>
                          <span className="text-[#555555] text-xs">{folder.count}</span>
                        </div>
                        {folder.expanded && folder.children && (
                          <div className="ml-6 space-y-1 mt-1">
                            {folder.children.map((child, j) => (
                              <div key={j} className="flex items-center gap-2 py-1 px-2 text-[#757575] text-xs hover:text-[#bdbdbd] cursor-pointer">
                                <span>└</span> {child}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Items */}
                <div className="flex-1 p-4">
                  <div className="text-[#757575] text-xs font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>RECENT & HIGH-SALIENCE</div>
                  <div className="space-y-2">
                    {[
                      { icon: FileText, title: 'AI Partnership Response Blueprint', type: 'campaign', time: '2 hours ago', score: 92 },
                      { icon: Brain, title: 'Executive Intelligence Brief', type: 'intelligence', time: 'today', meta: '47 signals' },
                      { icon: FileText, title: 'Q4 Launch Press Release', type: 'press-release', time: 'yesterday' },
                      { icon: Shield, title: 'Crisis Management Plan', type: 'crisis-plan', time: 'last week' },
                    ].map((item, i) => (
                      <div key={i} className="bg-[#212121] rounded-lg p-3 border border-[#2e2e2e] hover:border-[#c75d3a]/30 cursor-pointer transition-colors">
                        <div className="flex items-start gap-3">
                          <item.icon className="w-4 h-4 text-[#c75d3a] mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium truncate">{item.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[#c75d3a] text-xs">{item.type}</span>
                              <span className="text-[#555555] text-xs">•</span>
                              <span className="text-[#555555] text-xs">{item.time}</span>
                              {item.score && (
                                <>
                                  <span className="text-[#555555] text-xs">•</span>
                                  <span className="text-green-400 text-xs">Score: {item.score}</span>
                                </>
                              )}
                              {item.meta && (
                                <>
                                  <span className="text-[#555555] text-xs">•</span>
                                  <span className="text-[#555555] text-xs">{item.meta}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-[#212121] border-t border-[#2e2e2e]">
                <span className="text-[#555555] text-xs">234 items • 12 folders • 1.2GB</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Memory Vault</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                Organizational Intelligence
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                Everything NIV learns about your organization is stored and searchable. Campaigns, content, intelligence briefs, and crisis plans—all accessible through AI-powered semantic search.
              </p>
              <ul className="space-y-3">
                {['Semantic search with embeddings', 'Automatic content organization', 'Salience-based ranking', 'Content deduplication'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#bdbdbd]">
                    <div className="w-5 h-5 rounded-full bg-[#c75d3a]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#c75d3a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
            Ready to transform your <em className="text-[#c75d3a]">communications strategy</em>?
          </h2>
          <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            Join forward-thinking organizations using NIV to detect opportunities, execute campaigns, and stay ahead of the narrative.
          </p>
          <button
            onClick={() => router.push('/auth/signup')}
            className="px-8 py-4 bg-[#c75d3a] text-white text-lg font-medium rounded-xl hover:bg-[#e07b5a] transition-colors"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Get Started with NIV
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* NIV Square Icon - Footer size */}
            <svg width="24" height="24" viewBox="0 0 24 24">
              <rect width="24" height="24" rx="5" fill="#faf9f7" />
              <text
                x="3"
                y="17"
                fontFamily="Space Grotesk, sans-serif"
                fontSize="12"
                fontWeight="700"
                fill="#1a1a1a"
              >
                NIV
              </text>
              <polygon points="19,0 24,0 24,5" fill="#c75d3a" />
            </svg>
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>NIV by nivria</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-[#757575] text-sm hover:text-white transition-colors">Home</Link>
            <Link href="/auth/login" className="text-[#757575] text-sm hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
