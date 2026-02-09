import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Home, CalendarDays, MapPin, Heart, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/config/api'

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Schedule', href: '/agenda', icon: CalendarDays },
  { name: 'Venue', href: '/venue', icon: MapPin },
  { name: 'Favorites', href: '/favorites', icon: Heart },
  { name: 'Profile', href: '/profile', icon: User },
]

export function BottomNav() {
  const { data: favCount = 0 } = useQuery<number>({
    queryKey: ['favourites-count'],
    queryFn: async () => {
      const res = await api.get('/app/favourites')
      return (res.data.data || []).length
    },
    staleTime: 30_000,
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe-bottom">
      <div className="flex items-center justify-evenly h-16 w-full">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center min-w-[48px] min-h-[44px] transition-colors relative',
                isActive
                  ? 'text-az-mulberry'
                  : 'text-az-graphite active:text-az-graphite/70'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon
                    className={cn(
                      'h-6 w-6',
                      isActive && 'fill-az-mulberry/20'
                    )}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  {item.name === 'Favorites' && favCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-az-mulberry text-white text-[10px] font-bold px-1">
                      {favCount}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[11px] leading-tight mt-0.5',
                    isActive ? 'font-bold' : 'font-normal'
                  )}
                >
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
