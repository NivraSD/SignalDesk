import { useLocation, useNavigate } from 'react-router-dom'
import { Settings, Bell, Info } from 'lucide-react'
import BottomNav from './BottomNav'
import { useEffect } from 'react'
import { useUserSetup } from '@/hooks/useAreas'
import { useActivities } from '@/hooks/useActivities'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { onboarded } = useUserSetup()
  useActivities() // keeps the person's activity list (used by check-ins and plans) loaded

  // Someone who hasn't done the first-run setup goes there first.
  useEffect(() => {
    if (onboarded === false) navigate('/welcome', { replace: true })
  }, [onboarded, navigate])

  return (
    <div className="min-h-[100dvh] bg-stone-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 px-4 pb-3 pt-safe-header sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1
            className="text-lg font-light text-stone-700 tracking-wide cursor-pointer"
            onClick={() => navigate('/')}
          >
            Grounded
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/about')}
              aria-label="How Grounded works"
              className="text-stone-400 hover:text-stone-600"
            >
              <Info size={18} />
            </button>
            <button
              onClick={() => navigate('/reminders')}
              className="text-stone-400 hover:text-stone-600"
            >
              <Bell size={18} />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="text-stone-400 hover:text-stone-600"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      {/* Chat sizes itself to the visible screen (it handles the nav/keyboard), so no reserved bottom space there. */}
      <main className={`max-w-lg mx-auto p-4 ${location.pathname === '/chat' ? 'pb-0' : 'pb-24'}`}>{children}</main>

      {/* Bottom Nav */}
      <BottomNav active={location.pathname} onNavigate={navigate} />
    </div>
  )
}
