'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createAuthClient } from '@/lib/supabase/auth-client'
import { Brain, Target, Database, Sparkles, TrendingUp, Zap, Globe, ArrowUpRight } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createAuthClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        router.push('/dashboard')
      } else {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--charcoal)' }}>
        <div style={{ color: 'var(--white)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--charcoal)', color: 'var(--white)' }}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md" style={{
        background: 'rgba(26, 26, 26, 0.95)',
        borderBottom: '1px solid var(--grey-800)'
      }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Logo variant="dark" size="md" />
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/auth/login')}
                className="text-sm font-medium tracking-wide transition-colors"
                style={{ color: 'var(--grey-300)', fontFamily: 'var(--font-display)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--burnt-orange)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--grey-300)'}
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/auth/signup')}
                className="px-6 py-2.5 text-sm font-medium tracking-wide rounded-lg transition-colors"
                style={{
                  background: 'var(--burnt-orange)',
                  color: 'var(--white)',
                  fontFamily: 'var(--font-display)'
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-32 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <div
              className="mb-8 inline-block px-4 py-1.5 text-xs font-medium tracking-widest uppercase rounded"
              style={{
                border: '1px solid var(--burnt-orange)',
                color: 'var(--burnt-orange)',
                fontFamily: 'var(--font-display)'
              }}
            >
              Intelligence → Strategy → Execution
            </div>
            <h1
              className="text-5xl lg:text-6xl mb-8 font-normal leading-tight"
              style={{ color: 'var(--white)', fontFamily: 'var(--font-serif)' }}
            >
              Your <em style={{ color: 'var(--burnt-orange)', fontStyle: 'italic' }}>strategist</em><br />never sleeps
            </h1>
            <div className="w-16 h-0.5 mb-8" style={{ background: 'var(--burnt-orange)' }}></div>
            <p
              className="text-lg md:text-xl mb-12 max-w-2xl leading-relaxed"
              style={{ color: 'var(--grey-400)' }}
            >
              NIV is an autonomous operating system that orchestrates influence across human and machine—creating
              novel strategies, executing campaigns with one click, and learning from every interaction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/auth/signup')}
                className="group px-8 py-4 text-sm font-medium tracking-wide rounded-lg inline-flex items-center justify-center transition-colors"
                style={{
                  background: 'var(--burnt-orange)',
                  color: 'var(--white)',
                  fontFamily: 'var(--font-display)'
                }}
              >
                Start Creating
                <ArrowUpRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="px-8 py-4 text-sm font-medium tracking-wide rounded-lg transition-all inline-flex items-center justify-center"
                style={{
                  border: '1px solid var(--grey-700)',
                  color: 'var(--grey-300)',
                  fontFamily: 'var(--font-display)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--burnt-orange)'
                  e.currentTarget.style.background = 'var(--grey-900)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--grey-700)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                See It In Action
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="lg:col-span-4 mt-0 lg:mt-6">
            <div className="space-y-6">
              <div className="p-6 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
                <div className="text-4xl font-normal mb-2" style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-serif)' }}>24/7</div>
                <div className="text-sm" style={{ color: 'var(--grey-400)' }}>
                  Monitoring for risks and opportunities with action plans automatically generated
                </div>
              </div>
              <div className="p-6 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
                <div className="text-4xl font-normal mb-2" style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-serif)' }}>1-Click</div>
                <div className="text-sm" style={{ color: 'var(--grey-400)' }}>
                  Execute full campaigns—from strategy to content—with minimal effort
                </div>
              </div>
              <div className="p-6 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
                <div className="text-4xl font-normal mb-2" style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-serif)' }}>Learning</div>
                <div className="text-sm" style={{ color: 'var(--grey-400)' }}>
                  Leverages organizational context and continuously improves from every campaign
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32" style={{ background: 'var(--grey-900)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-5">
                <h2
                  className="text-3xl lg:text-4xl font-normal mb-4"
                  style={{ color: 'var(--white)', fontFamily: 'var(--font-serif)' }}
                >
                  Intelligence → Strategy → Execution
                </h2>
              </div>
              <div className="lg:col-span-7">
                <p className="text-lg" style={{ color: 'var(--grey-400)' }}>
                  A complete autonomous loop. NIV monitors, strategizes, creates, executes, and learns—all with minimal input from you.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: 'VECTOR Strategies', desc: 'Novel, data-driven campaign strategies created autonomously. Each one unique, optimized for maximum impact.' },
              { icon: Zap, title: 'One-Click Execution', desc: 'From strategy to fully-executed campaigns in seconds. Content, media lists, pitches—everything you need.' },
              { icon: Globe, title: 'Human-Machine Nexus', desc: 'Orchestrate influence across traditional PR, AI-powered channels, and emerging platforms.' },
              { icon: Brain, title: 'Autonomous Learning', desc: 'Continuous improvement from every campaign. NIV learns what works and adapts to your voice.' },
              { icon: Target, title: 'Intelligent Monitoring', desc: 'Always-on intelligence gathering across news, social, and emerging platforms.' },
              { icon: Database, title: 'Institutional Memory', desc: 'Every insight, strategy, and outcome preserved. Your knowledge evolves into a strategic asset.' },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-8 rounded-xl transition-colors"
                style={{ background: 'var(--charcoal)', border: '1px solid var(--grey-800)' }}
              >
                <feature.icon className="w-8 h-8 mb-6" style={{ color: 'var(--burnt-orange)' }} />
                <h3
                  className="text-xl font-medium mb-3"
                  style={{ color: 'var(--white)', fontFamily: 'var(--font-display)' }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--grey-400)' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-32 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-5">
            <h2
              className="text-3xl lg:text-4xl font-normal mb-6"
              style={{ color: 'var(--white)', fontFamily: 'var(--font-serif)' }}
            >
              Built for Strategic Leaders
            </h2>
            <div className="w-24 h-0.5 mb-6" style={{ background: 'var(--burnt-orange)' }}></div>
            <p className="text-sm" style={{ color: 'var(--grey-400)' }}>
              Trusted by those who create the future
            </p>
          </div>

          <div className="lg:col-span-7 space-y-8">
            <div className="p-8 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
              <Sparkles className="w-10 h-10 mb-4" style={{ color: 'var(--burnt-orange)' }} />
              <h3 className="text-2xl font-normal mb-3" style={{ color: 'var(--white)', fontFamily: 'var(--font-serif)' }}>Visionary Founders</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--grey-400)' }}>
                Launch and scale narratives with minimal resources. From stealth to category leadership,
                NIV executes the strategy you envision.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
                <TrendingUp className="w-10 h-10 mb-4" style={{ color: 'var(--burnt-orange)' }} />
                <h3 className="text-2xl font-normal mb-3" style={{ color: 'var(--white)', fontFamily: 'var(--font-serif)' }}>Communications Leaders</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--grey-400)' }}>
                  Multiply your team's impact. Execute sophisticated campaigns without expanding headcount.
                </p>
              </div>

              <div className="p-8 rounded-xl" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
                <Brain className="w-10 h-10 mb-4" style={{ color: 'var(--burnt-orange)' }} />
                <h3 className="text-2xl font-normal mb-3" style={{ color: 'var(--white)', fontFamily: 'var(--font-serif)' }}>Strategic Advisors</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--grey-400)' }}>
                  Deliver unprecedented value to clients. Novel strategies at a fraction of traditional timelines.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-32"
        style={{ background: 'var(--burnt-orange)' }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <h2
                className="text-3xl lg:text-4xl font-normal mb-6"
                style={{ color: 'var(--white)', fontFamily: 'var(--font-serif)' }}
              >
                Ready to Create Without Limits?
              </h2>
              <p className="text-lg mb-8" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Join visionaries using NIV to shape narratives across every platform—with minimal effort.
              </p>
              <button
                onClick={() => router.push('/auth/signup')}
                className="group px-8 py-4 text-sm font-medium tracking-wide rounded-lg inline-flex items-center"
                style={{
                  background: 'var(--white)',
                  color: 'var(--charcoal)',
                  fontFamily: 'var(--font-display)'
                }}
              >
                Start Creating Now
                <ArrowUpRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
              <p className="text-xs mt-4" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 max-w-7xl mx-auto px-6 lg:px-8" style={{ borderTop: '1px solid var(--grey-800)' }}>
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-5">
            <div className="mb-6">
              <Logo variant="dark" size="md" />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--grey-400)' }}>
              Autonomous operating system for visionary leaders.
            </p>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-medium mb-4 text-sm tracking-wider uppercase" style={{ color: 'var(--grey-300)', fontFamily: 'var(--font-display)' }}>Product</h4>
            <ul className="space-y-3 text-sm" style={{ color: 'var(--grey-400)' }}>
              <li><a href="#" className="hover:text-[var(--burnt-orange)] transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-[var(--burnt-orange)] transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-[var(--burnt-orange)] transition-colors">Use Cases</a></li>
              <li><a href="#" className="hover:text-[var(--burnt-orange)] transition-colors">Documentation</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-medium mb-4 text-sm tracking-wider uppercase" style={{ color: 'var(--grey-300)', fontFamily: 'var(--font-display)' }}>Company</h4>
            <ul className="space-y-3 text-sm" style={{ color: 'var(--grey-400)' }}>
              <li><a href="#" className="hover:text-[var(--burnt-orange)] transition-colors">About</a></li>
              <li><a href="#" className="hover:text-[var(--burnt-orange)] transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-[var(--burnt-orange)] transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-[var(--burnt-orange)] transition-colors">Contact</a></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-medium mb-4 text-sm tracking-wider uppercase" style={{ color: 'var(--grey-300)', fontFamily: 'var(--font-display)' }}>Legal</h4>
            <ul className="space-y-3 text-sm" style={{ color: 'var(--grey-400)' }}>
              <li><a href="#" className="hover:text-[var(--burnt-orange)] transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-[var(--burnt-orange)] transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-[var(--burnt-orange)] transition-colors">Security</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 text-xs" style={{ borderTop: '1px solid var(--grey-800)', color: 'var(--grey-500)' }}>
          <p>&copy; 2025 NIV. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
