'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const PROMPT_EXAMPLES = [
  {
    category: "Media Plans & Campaigns",
    prompts: [
      {
        title: "Media Plan",
        prompt: "Create a media plan for our Series B funding announcement of $50M led by Sequoia Capital"
      },
      {
        title: "Product Launch",
        prompt: "I need a complete content suite for launching our new AI-powered analytics platform targeting enterprise customers"
      },
      {
        title: "Crisis Response",
        prompt: "We need to respond to negative coverage about our data breach. Create crisis communications materials"
      }
    ]
  },
  {
    category: "Strategic Content",
    prompts: [
      {
        title: "Thought Leadership",
        prompt: "Create a 3-part thought leadership series on the future of quantum computing in healthcare"
      },
      {
        title: "Investor Communications",
        prompt: "Generate our Q4 earnings communications package with positive spin on 15% revenue growth but missed EPS"
      },
      {
        title: "Board Presentation",
        prompt: "Package our annual strategic plan into a board presentation with key metrics and 2025 roadmap"
      }
    ]
  },
  {
    category: "Social & Digital",
    prompts: [
      {
        title: "Viral Response",
        prompt: "Our CEO's tweet about remote work went viral. Create follow-up content to maximize the momentum"
      },
      {
        title: "Social Campaign",
        prompt: "Create a month-long social media campaign for Women's History Month showcasing our female engineers"
      },
      {
        title: "Community Engagement",
        prompt: "Generate responses to the top 10 customer complaints on our social media this week"
      }
    ]
  },
  {
    category: "Announcements",
    prompts: [
      {
        title: "Partnership",
        prompt: "We're announcing a strategic partnership with Microsoft. Create all announcement materials"
      },
      {
        title: "Award Recognition",
        prompt: "We won 'Best AI Startup 2025'. Create content to maximize this recognition"
      },
      {
        title: "Event Promotion",
        prompt: "Create promotional content for our virtual AI Summit next month with 5000 expected attendees"
      }
    ]
  },
  {
    category: "Email & Sales",
    prompts: [
      {
        title: "Nurture Sequence",
        prompt: "Create a 5-email nurture sequence for enterprise prospects who downloaded our whitepaper"
      },
      {
        title: "Customer Story",
        prompt: "Turn our Tesla case study into multiple content pieces showcasing 40% efficiency improvement"
      }
    ]
  }
]

export default function ContentPrompts() {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null)

  const copyPrompt = (prompt: string, key: string) => {
    navigator.clipboard.writeText(prompt)
    setCopiedIndex(key)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="p-6 text-gray-300">
      <p className="text-sm text-gray-400 mb-6">
        Click any prompt to copy it, then paste into NIV chat. Prompts marked with 📋 will trigger multi-part project tracking.
      </p>

      <div className="space-y-6">
        {PROMPT_EXAMPLES.map((category, catIndex) => (
          <div key={catIndex}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {category.category}
            </h3>
            <div className="space-y-2">
              {category.prompts.map((example, index) => {
                const key = `${catIndex}-${index}`
                const isMultiPart = example.prompt.toLowerCase().includes('plan') ||
                                   example.prompt.toLowerCase().includes('suite') ||
                                   example.prompt.toLowerCase().includes('campaign')

                return (
                  <div
                    key={key}
                    onClick={() => copyPrompt(example.prompt, key)}
                    className="p-3 bg-gray-800 hover:bg-gray-750 rounded-lg cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-200">
                            {example.title}
                          </span>
                          {isMultiPart && (
                            <span className="text-xs text-purple-400" title="Multi-part project">
                              📋
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-mono">
                          "{example.prompt}"
                        </p>
                      </div>
                      <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedIndex === key ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-200 mb-2">Tips</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Include specific details like company names, metrics, and dates</li>
          <li>• Start with context, then ask for content generation</li>
          <li>• Use "add", "change", or "improve" to refine without losing context</li>
          <li>• NIV maintains conversation history for up to 30 messages</li>
        </ul>
      </div>
    </div>
  )
}