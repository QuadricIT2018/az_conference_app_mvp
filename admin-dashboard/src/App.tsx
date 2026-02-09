import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { EventsPage, CreateEventPage, EventBuilderPage } from '@/pages/events'
import { DepartmentsPage } from '@/pages/departments'
import { SessionTagsPage } from '@/pages/tags'
import { SessionTypesPage } from '@/pages/session-types'
import { Toaster } from 'sonner'

// Placeholder pages - to be implemented
const SpeakersPage = () => (
  <div className="space-y-4">
    <h1 className="text-3xl font-bold font-heading">Speakers</h1>
    <p className="text-muted-foreground">Manage conference speakers</p>
  </div>
)

const TeamsPage = () => (
  <div className="space-y-4">
    <h1 className="text-3xl font-bold font-heading">Teams</h1>
    <p className="text-muted-foreground">Manage teams within departments</p>
  </div>
)

const AttendeesPage = () => (
  <div className="space-y-4">
    <h1 className="text-3xl font-bold font-heading">Attendees</h1>
    <p className="text-muted-foreground">View and manage conference attendees</p>
  </div>
)

const AdminsPage = () => (
  <div className="space-y-4">
    <h1 className="text-3xl font-bold font-heading">Admins</h1>
    <p className="text-muted-foreground">Manage admin users</p>
  </div>
)

const SettingsPage = () => (
  <div className="space-y-4">
    <h1 className="text-3xl font-bold font-heading">Settings</h1>
    <p className="text-muted-foreground">System settings and configuration</p>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/new" element={<CreateEventPage />} />
          <Route path="/events/:id" element={<EventsPage />} />
          <Route path="/events/:id/edit" element={<EventBuilderPage />} />
          <Route path="/speakers" element={<SpeakersPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/tags" element={<SessionTagsPage />} />
          <Route path="/session-types" element={<SessionTypesPage />} />
          <Route path="/attendees" element={<AttendeesPage />} />
          <Route path="/admins" element={<AdminsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

export default App
