import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { formatTime, cn } from '@/lib/utils'
import { Clock, MapPin, Heart } from 'lucide-react'

/* ─── Tag colour map (shared) ─── */

const TAG_COLORS: Record<string, string> = {
  registration: 'bg-[#8B7355]',
  'teambuilding/recognition': 'bg-[#D4860B]',
  teambuidling: 'bg-[#D4860B]',
  'teambuidling/recognition': 'bg-[#D4860B]',
  teambuilding: 'bg-[#D4860B]',
  'tumor team time': 'bg-[#16a34a]',
  meals: 'bg-[#D4860B]',
  wellness: 'bg-[#0891b2]',
  keynote: 'bg-az-mulberry',
  breakout: 'bg-[#7c3aed]',
  networking: 'bg-[#2563eb]',
  transport: 'bg-gray-500',
}

function getTagColor(tag: string | null): string {
  if (!tag) return 'bg-az-graphite'
  return TAG_COLORS[tag.toLowerCase()] || 'bg-az-graphite'
}

/* ─── Helpers ─── */

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr.substring(0, 10) + 'T12:00:00Z')
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/* ─── Types ─── */

export interface SessionDetailData {
  id: number
  session_name: string
  session_description: string | null
  session_date: string
  session_start_time: string
  session_end_time: string | null
  session_tag: string | null
  session_location: string | null
  timezone: string | null
  is_favourite: boolean
}

/* ─── Modal Component ─── */

export function SessionDetailModal({
  session,
  onClose,
}: {
  session: SessionDetailData | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  // Lock body scroll when modal is open
  useEffect(() => {
    if (session) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [session])

  // Toggle favourite
  const favMutation = useMutation({
    mutationFn: async ({ sessionId, isFav }: { sessionId: number; isFav: boolean }) => {
      if (isFav) {
        await api.delete(`/app/favourites/${sessionId}`)
      } else {
        await api.post(`/app/favourites/${sessionId}`)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['favourites'] })
      queryClient.invalidateQueries({ queryKey: ['favourites-count'] })
    },
  })

  if (!session) return null

  const tz = session.timezone ? ` (${session.timezone})` : ''
  const timeStr = session.session_end_time
    ? `${formatTime(session.session_start_time)} - ${formatTime(session.session_end_time)}${tz}`
    : `${formatTime(session.session_start_time)}${tz}`

  const isFav = session.is_favourite
  const handleToggleFav = () => {
    favMutation.mutate({ sessionId: session.id, isFav })
    // Optimistically update the local state
    session.is_favourite = !isFav
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal content — slides up from bottom */}
      <div className="relative mt-auto bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pt-3 pb-4">
          {/* Tag pill */}
          {session.session_tag && (
            <span
              className={cn(
                'inline-block text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider',
                getTagColor(session.session_tag),
              )}
            >
              {session.session_tag}
            </span>
          )}

          {/* Session name */}
          <h2 className="mt-3 text-xl font-bold font-heading text-black leading-tight">
            {session.session_name}
          </h2>

          {/* Time */}
          <div className="mt-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-az-graphite flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-black">{timeStr}</p>
              <p className="text-sm text-gray-500">
                {formatFullDate(session.session_date)}
              </p>
            </div>
          </div>

          {/* Location */}
          {session.session_location && (
            <div className="mt-3 flex items-start gap-3">
              <MapPin className="h-5 w-5 text-az-graphite flex-shrink-0 mt-0.5" />
              <p className="text-sm text-black">{session.session_location}</p>
            </div>
          )}

          {/* Divider */}
          {session.session_description && (
            <>
              <div className="border-t border-gray-200 my-5" />

              {/* Description */}
              <h3 className="text-base font-bold font-heading text-black">
                Description
              </h3>
              <p className="mt-2 text-sm text-az-graphite leading-relaxed">
                {session.session_description}
              </p>
            </>
          )}
        </div>

        {/* Bottom actions — fixed at bottom */}
        <div className="px-6 pb-8 pt-2 space-y-3 border-t border-gray-100">
          {/* Add/Remove Favorites */}
          <button
            type="button"
            onClick={handleToggleFav}
            disabled={favMutation.isPending}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-colors border-2',
              isFav
                ? 'border-az-mulberry bg-az-mulberry/5 text-az-mulberry'
                : 'border-az-mulberry/30 bg-white text-az-mulberry'
            )}
          >
            <Heart
              className={cn(
                'h-5 w-5',
                isFav ? 'fill-az-mulberry text-az-mulberry' : 'text-az-mulberry'
              )}
            />
            {isFav ? 'Remove from Favorites' : 'Add to Favorites'}
          </button>

          {/* Done */}
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-az-mulberry text-white py-3.5 rounded-xl text-sm font-bold active:scale-[0.98] transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
