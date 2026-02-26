import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, BookOpen, MessageCircle, Palette, Clock } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/journal', icon: BookOpen, label: 'Journal' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/art', icon: Palette, label: 'Art' },
  { path: '/history', icon: Clock, label: 'History' },
]

export default function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 pb-safe z-50">
        <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  active ? 'text-stone-900' : 'text-stone-400'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
