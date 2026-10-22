import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AppShell from '@/components/shell/AppShell'
import LoginPage from '@/components/auth/LoginPage'
import HomePage from '@/components/home/HomePage'
import CheckInFlow from '@/components/checkin/CheckInFlow'
import MorningCheckIn from '@/components/checkin/MorningCheckIn'
import ChatPage from '@/components/chat/ChatPage'
import JournalPage from '@/components/journal/JournalPage'
import HistoryPage from '@/components/history/HistoryPage'
import ActivityBankManager from '@/components/activities/ActivityBankManager'
import VisionBoard from '@/components/vision/VisionBoard'
import RemindersPage from '@/components/reminders/RemindersPage'
import CalendarPage from '@/components/calendar/CalendarPage'
import SettingsPage from '@/components/settings/SettingsPage'
import FeedbackView from '@/components/feedback/FeedbackView'
import OnOpenScreen from '@/components/open/OnOpenScreen'
import ArtPage from '@/components/art/ArtPage'
import WelcomePage from '@/components/welcome/WelcomePage'
import AboutYouPage from '@/components/you/AboutYouPage'
import AboutPage from '@/components/about/AboutPage'
import LaughPage from '@/components/laugh/LaughPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth()
  if (loading) return <div className="min-h-screen bg-stone-950" />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* /open is OUTSIDE AppShell — full-screen, no chrome */}
        <Route
          path="/open"
          element={
            <ProtectedRoute>
              <OnOpenScreen />
            </ProtectedRoute>
          }
        />

        {/* First run — full-screen, no chrome */}
        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <WelcomePage />
            </ProtectedRoute>
          }
        />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Everything else inside AppShell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell><HomePage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkin"
          element={
            <ProtectedRoute>
              <AppShell><CheckInFlow /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/morning"
          element={
            <ProtectedRoute>
              <AppShell><MorningCheckIn /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <AppShell><ChatPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal"
          element={
            <ProtectedRoute>
              <AppShell><JournalPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <AppShell><HistoryPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/activities"
          element={
            <ProtectedRoute>
              <AppShell><ActivityBankManager /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vision"
          element={
            <ProtectedRoute>
              <AppShell><VisionBoard /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reminders"
          element={
            <ProtectedRoute>
              <AppShell><RemindersPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <AppShell><CalendarPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppShell><SettingsPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <AppShell><FeedbackView /></AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/laugh"
          element={
            <ProtectedRoute>
              <AppShell><LaughPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <AppShell><AboutPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/you"
          element={
            <ProtectedRoute>
              <AppShell><AboutYouPage /></AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/art"
          element={
            <ProtectedRoute>
              <AppShell><ArtPage /></AppShell>
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
