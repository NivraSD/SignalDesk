import { Home, PlusCircle, MessageCircle, Palette, Layers, History } from 'lucide-react'

interface BottomNavProps {
  active: string
  onNavigate: (path: string) => void
}

const tabs = [
  { id: '/', icon: Home, label: 'Home' },
  { id: '/journal', icon: PlusCircle, label: 'Add' },
  { id: '/chat', icon: MessageCircle, label: 'Chat' },
  { id: '/art', icon: Palette, label: 'Art' },
  { id: '/history', icon: History, label: 'History' },
]

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-stone-200 z-50 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.id || (tab.id !== '/' && active.startsWith(tab.id))
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                isActive ? 'text-stone-800' : 'text-stone-400'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
