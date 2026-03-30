'use client'

import React, { useState } from 'react'
import { Copy, Check, Lightbulb, Sparkles, FileText, Zap, ChevronRight } from 'lucide-react'

// Quick start templates - simple one-click prompts for beginners
const QUICK_STARTS = [
  { label: 'Write a press release', icon: FileText },
  { label: 'Create social media posts', icon: Zap },
  { label: 'Draft an email campaign', icon: Sparkles },
]

const PROMPT_EXAMPLES = [
  {
    category: "Getting Started",
    description: "Simple prompts to help you begin",
    prompts: [
      {
        title: "Basic Press Release",
        prompt: "Write a press release announcing [your news here]",
        hint: "Replace [your news here] with your announcement"
      },
      {
        title: "Social Post",
        prompt: "Create a LinkedIn post about [topic] that highlights our expertise",
        hint: "Great for thought leadership"
      },
      {
        title: "Email Draft",
        prompt: "Write a professional email to [audience] about [subject]",
        hint: "Works for any business email"
      }
    ]
  },
  {
    category: "Media & PR",
    description: "For media outreach and press",
    prompts: [
      {
        title: "Media Plan",
        prompt: "Create a media plan for our Series B funding announcement of $50M led by Sequoia Capital"
      },
      {
        title: "Media Pitch",
        prompt: "Write a pitch to TechCrunch about our new AI product launch"
      },
      {
        title: "Crisis Response",
        prompt: "We need to respond to negative coverage about our data breach. Create crisis communications materials"
      }
    ]
  },
  {
    category: "Campaigns",
    description: "Multi-content projects",
    prompts: [
      {
        title: "Product Launch",
        prompt: "I need a complete content suite for launching our new AI-powered analytics platform targeting enterprise customers"
      },
      {
        title: "Social Campaign",
        prompt: "Create a month-long social media campaign for Women's History Month showcasing our female engineers"
      },
      {
        title: "Nurture Sequence",
        prompt: "Create a 5-email nurture sequence for enterprise prospects who downloaded our whitepaper"
      }
    ]
  },
  {
    category: "Executive",
    description: "Board and investor communications",
    prompts: [
      {
        title: "Board Presentation",
        prompt: "Package our annual strategic plan into a board presentation with key metrics and 2025 roadmap"
      },
      {
        title: "Investor Update",
        prompt: "Generate our Q4 earnings communications package with positive spin on 15% revenue growth but missed EPS"
      },
      {
        title: "Executive Statement",
        prompt: "Write a CEO statement on our commitment to AI ethics and responsible development"
      }
    ]
  }
]

interface ContentPromptsProps {
  onSelectPrompt?: (prompt: string) => void
}

export default function ContentPrompts({ onSelectPrompt }: ContentPromptsProps) {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<number>(0)

  const handlePromptClick = (prompt: string, key: string) => {
    if (onSelectPrompt) {
      onSelectPrompt(prompt)
    } else {
      navigator.clipboard.writeText(prompt)
      setCopiedIndex(key)
      setTimeout(() => setCopiedIndex(null), 2000)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--grey-200)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="w-4 h-4" style={{ color: 'var(--burnt-orange)' }} />
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-display)' }}
          >
            Prompt Templates
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--grey-500)' }}>
          Click any template to use it with NIV
        </p>
      </div>

      {/* Quick Start Section */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--grey-200)', background: 'var(--grey-100)' }}>
        <div
          className="text-[0.65rem] uppercase tracking-wider mb-2"
          style={{ color: 'var(--grey-500)', fontFamily: 'var(--font-display)' }}
        >
          Quick Start
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_STARTS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(item.label, `quick-${idx}`)}
              className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors hover:opacity-80"
              style={{
                background: 'var(--burnt-orange-muted)',
                color: 'var(--burnt-orange)',
                fontFamily: 'var(--font-display)'
              }}
            >
              <item.icon className="w-3 h-3" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Example Prompts */}
        <div className="p-4 space-y-3">
          {PROMPT_EXAMPLES.map((category, catIndex) => (
            <div
              key={catIndex}
              className="rounded-lg border overflow-hidden"
              style={{ borderColor: 'var(--grey-200)' }}
            >
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(expandedCategory === catIndex ? -1 : catIndex)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--grey-100)] transition-colors"
                style={{ background: expandedCategory === catIndex ? 'var(--grey-100)' : 'var(--white)' }}
              >
                <div>
                  <div
                    className="text-sm font-medium text-left"
                    style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-display)' }}
                  >
                    {category.category}
                  </div>
                  <div className="text-xs text-left" style={{ color: 'var(--grey-500)' }}>
                    {category.description}
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${expandedCategory === catIndex ? 'rotate-90' : ''}`}
                  style={{ color: 'var(--grey-400)' }}
                />
              </button>

              {/* Expanded Prompts */}
              {expandedCategory === catIndex && (
                <div className="border-t" style={{ borderColor: 'var(--grey-200)' }}>
                  {category.prompts.map((example, index) => {
                    const key = `${catIndex}-${index}`
                    const isMultiPart = example.prompt.toLowerCase().includes('plan') ||
                                       example.prompt.toLowerCase().includes('suite') ||
                                       example.prompt.toLowerCase().includes('campaign') ||
                                       example.prompt.toLowerCase().includes('sequence')

                    return (
                      <div
                        key={key}
                        onClick={() => handlePromptClick(example.prompt, key)}
                        className="px-4 py-3 cursor-pointer transition-colors group border-b last:border-b-0"
                        style={{
                          borderColor: 'var(--grey-100)',
                          background: 'var(--white)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--grey-50)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--white)'}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="text-sm font-medium"
                                style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-display)' }}
                              >
                                {example.title}
                              </span>
                              {isMultiPart && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[0.6rem] font-medium uppercase"
                                  style={{
                                    background: 'var(--burnt-orange-muted)',
                                    color: 'var(--burnt-orange)',
                                    fontFamily: 'var(--font-display)'
                                  }}
                                >
                                  Multi-part
                                </span>
                              )}
                            </div>
                            <p
                              className="text-xs leading-relaxed truncate"
                              style={{ color: 'var(--grey-600)' }}
                            >
                              {example.prompt}
                            </p>
                            {example.hint && (
                              <p
                                className="text-[0.65rem] mt-1 italic"
                                style={{ color: 'var(--grey-400)' }}
                              >
                                {example.hint}
                              </p>
                            )}
                          </div>
                          <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            {copiedIndex === key ? (
                              <Check className="w-4 h-4" style={{ color: 'var(--success)' }} />
                            ) : (
                              <Copy className="w-4 h-4" style={{ color: 'var(--grey-400)' }} />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="p-4 pt-0">
          <div
            className="p-4 rounded-lg"
            style={{ background: 'var(--grey-100)', border: '1px solid var(--grey-200)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" style={{ color: 'var(--burnt-orange)' }} />
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-display)' }}
              >
                Tips for Better Results
              </span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--burnt-orange)' }} />
                <span className="text-xs" style={{ color: 'var(--grey-600)' }}>
                  <strong>Be specific</strong> — Include names, numbers, and dates
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--burnt-orange)' }} />
                <span className="text-xs" style={{ color: 'var(--grey-600)' }}>
                  <strong>Give context</strong> — Tell NIV about your audience and goals
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--burnt-orange)' }} />
                <span className="text-xs" style={{ color: 'var(--grey-600)' }}>
                  <strong>Iterate freely</strong> — Say "make it shorter" or "add more urgency"
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--burnt-orange)' }} />
                <span className="text-xs" style={{ color: 'var(--grey-600)' }}>
                  <strong>Select content type first</strong> — NIV will tailor output to the format
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}