'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Brain,
  Target,
  TrendingUp,
  Rocket,
  Shield,
  Database,
  Sparkles,
  FileText,
  MessageCircle,
  LayoutDashboard,
  Settings
} from 'lucide-react'

interface SidebarItem {
  id: string
  label: string
  href: string
  icon: ReactNode
  badge?: string | number
}

interface SidebarSection {
  title: string
  items: SidebarItem[]
}

interface SidebarProps {
  sections?: SidebarSection[]
  header?: {
    label: string
    title: string
  }
}

const defaultSections: SidebarSection[] = [
  {
    title: 'Strategy',
    items: [
      { id: 'niv', label: 'NIV Advisor', href: '/dashboard/niv', icon: <Brain className="w-[18px] h-[18px]" /> },
      { id: 'intelligence', label: 'Intelligence', href: '/dashboard/intelligence', icon: <Sparkles className="w-[18px] h-[18px]" /> },
      { id: 'opportunities', label: 'Opportunities', href: '/dashboard/opportunities', icon: <Target className="w-[18px] h-[18px]" />, badge: 12 },
    ]
  },
  {
    title: 'Execution',
    items: [
      { id: 'campaigns', label: 'Campaigns', href: '/dashboard/campaigns', icon: <TrendingUp className="w-[18px] h-[18px]" /> },
      { id: 'content', label: 'Content', href: '/dashboard/content', icon: <FileText className="w-[18px] h-[18px]" /> },
      { id: 'execute', label: 'Execute', href: '/dashboard/execute', icon: <Rocket className="w-[18px] h-[18px]" /> },
    ]
  },
  {
    title: 'Management',
    items: [
      { id: 'crisis', label: 'Crisis Center', href: '/dashboard/crisis', icon: <Shield className="w-[18px] h-[18px]" /> },
      { id: 'memory', label: 'Memory Vault', href: '/dashboard/memory', icon: <Database className="w-[18px] h-[18px]" /> },
    ]
  }
]

export function Sidebar({ sections = defaultSections, header }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-[260px] bg-white border-r border-[var(--grey-200)] flex flex-col shrink-0 h-full">
      {/* Header */}
      {header && (
        <div className="px-5 py-5 border-b border-[var(--grey-200)]">
          <div
            className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--grey-500)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {header.label}
          </div>
          <div
            className="text-lg text-[var(--charcoal)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {header.title}
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {sections.map((section, sectionIndex) => (
          <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
            <div
              className="text-[0.65rem] uppercase tracking-[0.1em] text-[var(--grey-400)] mb-3 px-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {section.title}
            </div>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`
                      flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all
                      ${isActive
                        ? 'bg-[var(--grey-100)] text-[var(--charcoal)]'
                        : 'text-[var(--grey-600)] hover:bg-[var(--grey-100)] hover:text-[var(--charcoal)]'
                      }
                    `}
                  >
                    <span className={isActive ? 'opacity-100' : 'opacity-70'}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span
                        className="px-2 py-0.5 text-[0.7rem] font-medium rounded-full bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[var(--grey-200)]">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[var(--grey-600)] hover:bg-[var(--grey-100)] hover:text-[var(--charcoal)] transition-all"
        >
          <Settings className="w-[18px] h-[18px] opacity-70" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  )
}
