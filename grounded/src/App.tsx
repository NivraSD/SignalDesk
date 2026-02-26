import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AppShell from '@/components/shell/AppShell'
import LoginPage from '@/components/auth/LoginPage'
import HomePage from '@/components/home/HomePage'
import CheckInFlow from '@/components/checkin/CheckInFlow'
import FeedbackView from '@/components/feedback/FeedbackView'
import JournalPage from '@/components/journal/JournalPage'
import ChatPage from '@/components/chat/ChatPage'
import ArtPage from '@/components/art/ArtPage'
import VisionBoard from '@/components/vision/VisionBoard'
import ActivityBankManager from '@/components/activities/ActivityBankManager'
import CalendarPage from '@/components/calendar/CalendarPage'
import RemindersPage from '@/components/reminders/RemindersPage'
import HistoryPage from '@/components/history/HistoryPage'
import SettingsPage from '@/components/settings/SettingsPage'

function ProtectedRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/checkin" element={<CheckInFlow />} />
        <Route path="/feedback" element={<FeedbackView />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/art" element={<ArtPage />} />
        <Route path="/vision" element={<VisionBoard />} />
        <Route path="/activities" element={<ActivityBankManager />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-stone-400 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route
          path="/*"
          element={user ? <ProtectedRoutes /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}
