import { useLocation, useNavigate } from 'react-router-dom'
import { Settings, Bell } from 'lucide-react'
import BottomNav from './BottomNav'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1
            className="text-lg font-light text-stone-700 tracking-wide cursor-pointer"
            onClick={() => navigate('/')}
          >
            Grounded
          </h1>
          <div className="flex items-center gap-3">
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
      <main className="max-w-lg mx-auto p-4 pb-24">{children}</main>

      {/* Bottom Nav */}
      <BottomNav active={location.pathname} onNavigate={navigate} />
    </div>
  )
}
