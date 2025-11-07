'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createAuthClient } from '@/lib/supabase/auth-client'
import { Brain, Target, Shield, Database, Sparkles, TrendingUp, Zap, Globe, AlertTriangle } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold">SignalDesk</span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/auth/login')}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/auth/signup')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-blue-900/30 border border-blue-700 rounded-full text-blue-300 text-sm">
            Intelligence-Driven Communications Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Transform Information Into Strategic Action
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto">
            SignalDesk empowers PR and communications teams with real-time intelligence monitoring,
            crisis detection, and AI-powered strategic planning.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => router.push('/auth/signup')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-lg transition-colors flex items-center justify-center"
            >
              Start Free Trial
              <Sparkles className="ml-2 w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium text-lg transition-colors"
            >
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Comprehensive Intelligence Suite</h2>
            <p className="text-xl text-gray-400">Everything you need to stay ahead of the story</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-600 transition-colors">
              <div className="w-12 h-12 bg-blue-900/30 border border-blue-700 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Intelligence Monitoring</h3>
              <p className="text-gray-400">
                Track news, social media, and regulatory changes in real-time. Get instant alerts
                on topics that matter to your organization.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-purple-600 transition-colors">
              <div className="w-12 h-12 bg-purple-900/30 border border-purple-700 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">GEO Intelligence</h3>
              <p className="text-gray-400">
                Monitor geographic-specific trends and events. Track regional sentiment and
                emerging patterns across different markets.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-red-600 transition-colors">
              <div className="w-12 h-12 bg-red-900/30 border border-red-700 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Crisis Management</h3>
              <p className="text-gray-400">
                Detect potential crises before they escalate. Automated alerts and response
                workflows to protect your reputation.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-green-600 transition-colors">
              <div className="w-12 h-12 bg-green-900/30 border border-green-700 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Opportunity Discovery</h3>
              <p className="text-gray-400">
                Find speaking opportunities, awards, and partnership possibilities. Never miss
                a chance to elevate your brand.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-yellow-600 transition-colors">
              <div className="w-12 h-12 bg-yellow-900/30 border border-yellow-700 rounded-lg flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Memory Vault</h3>
              <p className="text-gray-400">
                Centralized knowledge repository with semantic search. Access institutional
                memory and insights instantly.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-pink-600 transition-colors">
              <div className="w-12 h-12 bg-pink-900/30 border border-pink-700 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Strategic Planning</h3>
              <p className="text-gray-400">
                AI-powered strategic frameworks and campaign planning. Turn intelligence
                into actionable communication strategies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Built for Communications Professionals</h2>
            <p className="text-xl text-gray-400">Trusted by PR teams, communications directors, and crisis managers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-900/30 border border-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">PR Teams</h3>
              <p className="text-gray-400">
                Monitor media coverage, track journalist interests, and identify
                story opportunities in real-time.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-900/30 border border-purple-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Crisis Managers</h3>
              <p className="text-gray-400">
                Early warning system for potential issues. Rapid response protocols
                and stakeholder communication tools.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-pink-900/30 border border-pink-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Strategic Advisors</h3>
              <p className="text-gray-400">
                Data-driven insights for executive communications. Competitive
                intelligence and market positioning analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-y border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Communications Strategy?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join forward-thinking organizations using SignalDesk to stay ahead of the story.
          </p>
          <button
            onClick={() => router.push('/auth/signup')}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-lg transition-colors inline-flex items-center"
          >
            Start Your Free Trial
            <Sparkles className="ml-2 w-5 h-5" />
          </button>
          <p className="text-sm text-gray-500 mt-4">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="w-6 h-6 text-blue-500" />
                <span className="text-xl font-bold">SignalDesk</span>
              </div>
              <p className="text-gray-400 text-sm">
                Intelligence-driven communications platform for modern PR teams.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Use Cases</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 SignalDesk. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
