import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut, User, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {/* Breadcrumb or page title can go here */}
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-az-mulberry text-white">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">{user?.displayName}</p>
            <p className="text-xs text-muted-foreground">{user?.role || 'Admin'}</p>
          </div>
        </div>

        <div className="sm:hidden flex h-8 w-8 items-center justify-center rounded-full bg-az-mulberry text-white">
          <User className="h-4 w-4" />
        </div>

        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
