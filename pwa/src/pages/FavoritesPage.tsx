import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/config/api'
import { formatTime, cn } from '@/lib/utils'
import { ArrowLeft, Clock, MapPin, Heart, CalendarDays } from 'lucide-react'
import { SessionDetailModal } from '@/components/SessionDetailModal'
import type { SessionDetailData } from '@/components/SessionDetailModal'

/* ─── Types ─── */

interface FavSession {
  id: number
  session_name: string
  session_description: string | null
  session_date: string
  session_start_time: string
  session_end_time: string | null
  session_tag: string | null
  session_location: string | null
  timezone: string | null
  department: string | null
  event_slug: string
  event_name: string
}

/* ─── Tag colour map ─── */

const TAG_COLORS: Record<string, string> = {
  registration: 'bg-az-mulberry',
  'teambuilding/recognition': 'bg-[#16a34a]',
  teambuidling: 'bg-[#16a34a]',
  'teambuidling/recognition': 'bg-[#16a34a]',
  teambuilding: 'bg-[#16a34a]',
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

function formatLongDate(dateStr: string): string {
  const d = new Date(dateStr.substring(0, 10) + 'T12:00:00Z')
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function addOrdinal(dateStr: string): string {
  // Convert "Tuesday, March 17" → "Tuesday, March 17th"
  const match = dateStr.match(/(\d+)$/)
  if (!match) return dateStr
  const day = parseInt(match[1])
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th'
  return dateStr + suffix
}

/* ─── Main Component ─── */

export function FavoritesPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [detailSession, setDetailSession] = useState<SessionDetailData | null>(null)

  const { data: sessions = [], isLoading } = useQuery<FavSession[]>({
    queryKey: ['favourites'],
    queryFn: async () => {
      const res = await api.get('/app/favourites')
      return res.data.data || []
    },
  })

  // Group sessions by date
  const grouped = useMemo(() => {
    const map = new Map<string, FavSession[]>()
    sessions.forEach((s) => {
      const date = s.session_date.substring(0, 10)
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(s)
    })
    return Array.from(map.entries())
  }, [sessions])

  // Unfavourite mutation
  const unfavMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      await api.delete(`/app/favourites/${sessionId}`)
    },
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: ['favourites'] })
      const prev = queryClient.getQueryData<FavSession[]>(['favourites'])
      queryClient.setQueryData<FavSession[]>(['favourites'], (old) =>
        old?.filter((s) => s.id !== sessionId),
      )
      return { prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['favourites'], context.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favourites'] })
      // Also invalidate schedule sessions so heart state syncs
      queryClient.invalidateQueries({ queryKey: ['schedule-sessions'] })
    },
  })

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 -ml-1"
          >
            <ArrowLeft className="h-5 w-5 text-black" />
          </button>
          <h1 className="text-lg font-bold font-heading text-black">
            Favorites
          </h1>
        </div>
        <span className="text-xs font-semibold text-az-graphite border border-gray-300 rounded-lg px-3 py-1.5">
          {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'}
        </span>
      </div>

      {/* Content */}
      <div className="px-5 pt-4 pb-8 max-w-3xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-az-mulberry border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="mt-4 font-semibold text-az-graphite text-sm">
              No favorites yet
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Tap the heart icon on any session to save it here.
            </p>
          </div>
        ) : (
          grouped.map(([date, dateSessions]) => (
            <div key={date} className="mb-6">
              {/* Date header */}
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="h-5 w-5 text-az-graphite" strokeWidth={1.8} />
                <h2 className="text-base font-bold font-heading text-black">
                  {addOrdinal(formatLongDate(date))}
                </h2>
              </div>

              {/* Session cards for this date */}
              <div className="space-y-4">
                {dateSessions.map((session) => (
                  <FavCard
                    key={session.id}
                    session={session}
                    onUnfav={() => unfavMutation.mutate(session.id)}
                    onViewDetails={() =>
                      setDetailSession({
                        id: session.id,
                        session_name: session.session_name,
                        session_description: session.session_description,
                        session_date: session.session_date,
                        session_start_time: session.session_start_time,
                        session_end_time: session.session_end_time,
                        session_tag: session.session_tag,
                        session_location: session.session_location,
                        timezone: session.timezone,
                        is_favourite: true,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Session Detail Modal */}
      <SessionDetailModal
        session={detailSession}
        onClose={() => setDetailSession(null)}
      />
    </div>
  )
}

/* ─── Favorite Session Card ─── */

function FavCard({
  session,
  onUnfav,
  onViewDetails,
}: {
  session: FavSession
  onUnfav: () => void
  onViewDetails: () => void
}) {
  const tz = session.timezone ? ` (${session.timezone})` : ''
  const timeStr = session.session_end_time
    ? `${formatTime(session.session_start_time)} - ${formatTime(session.session_end_time)}${tz}`
    : `${formatTime(session.session_start_time)}${tz}`

  return (
    <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden">
      <div className="px-5 pt-4 pb-3">
        {/* Tag + Heart */}
        <div className="flex items-start justify-between">
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
          <button
            type="button"
            onClick={onUnfav}
            className="p-1 -m-1 ml-auto"
            aria-label="Remove from favorites"
          >
            <Heart className="h-5 w-5 fill-az-mulberry text-az-mulberry transition-colors" />
          </button>
        </div>

        {/* Name */}
        <h3 className="mt-2.5 text-[15px] font-bold font-heading text-black leading-snug">
          {session.session_name}
        </h3>

        {/* Time */}
        <div className="mt-2 flex items-center gap-1.5 text-sm text-az-graphite">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>{timeStr}</span>
        </div>

        {/* Location */}
        {session.session_location && (
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-az-graphite">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{session.session_location}</span>
          </div>
        )}
      </div>

      {/* Dashed Divider */}
      <div className="border-t border-dashed border-gray-300 mx-5" />

      {/* Action Button */}
      <div className="px-5 py-3">
        <button
          type="button"
          onClick={onViewDetails}
          className="w-full bg-az-mulberry text-white py-3 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
        >
          View Session Details
        </button>
      </div>
    </div>
  )
}
