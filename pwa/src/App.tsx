import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { EventProvider } from '@/contexts/EventContext'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SchedulePage } from '@/pages/SchedulePage'
import { FavoritesPage } from '@/pages/FavoritesPage'
import { VenuePage } from '@/pages/VenuePage'

const SpeakersPage = () => (
  <div className="px-4 pt-safe-top py-6">
    <h1 className="text-2xl font-bold font-heading">Speakers</h1>
    <p className="text-gray-500">Meet our speakers</p>
  </div>
)

const UpdatesPage = () => (
  <div className="px-4 pt-safe-top py-6">
    <h1 className="text-2xl font-bold font-heading">Updates</h1>
    <p className="text-gray-500">Latest announcements</p>
  </div>
)

const TeamPage = () => (
  <div className="px-4 pt-safe-top py-6">
    <h1 className="text-2xl font-bold font-heading">My Team</h1>
    <p className="text-gray-500">Your team members</p>
  </div>
)

// FavoritesPage imported from @/pages/FavoritesPage

function App() {
  return (
    <AuthProvider>
      <EventProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<MobileLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/agenda" element={<SchedulePage />} />
            <Route path="/speakers" element={<SpeakersPage />} />
            <Route path="/updates" element={<UpdatesPage />} />
            <Route path="/venue" element={<VenuePage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/team" element={<TeamPage />} />
          </Route>
        </Routes>
      </EventProvider>
    </AuthProvider>
  )
}

export default App
