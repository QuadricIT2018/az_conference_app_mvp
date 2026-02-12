import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { BottomNav } from './BottomNav'
import bannerImg from '@/assets/Team_USAZ_FINAL_Over_dark_desktop.jpg'

export function MobileLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-az-mulberry border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f2f1]">
      {/* Global Banner */}
      <div className="h-[90px] sm:h-40 lg:h-56 w-full overflow-hidden flex-shrink-0">
        <img
          src={bannerImg}
          alt="Event Banner"
          className="h-full w-full object-cover object-center"
        />
      </div>
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
