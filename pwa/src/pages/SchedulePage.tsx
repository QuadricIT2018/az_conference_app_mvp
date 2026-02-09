import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { formatTime, cn } from '@/lib/utils'
import { useEventSlug } from '@/contexts/EventContext'
import { Clock, MapPin, Heart } from 'lucide-react'
import { SessionDetailModal } from '@/components/SessionDetailModal'

/* ─── Types ─── */

interface EventData {
  id: number
  event_slug: string
  event_name: string
  event_start_date: string
  event_end_date: string
}

interface DayTab {
  day_number: number
  day_date: string
}

interface SessionData {
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
  is_generic: boolean
  department: string | null
  event_id: number
}

/* ─── Tag colour map ─── */

const TAG_COLORS: Record<string, string> = {
  registration: 'bg-[#8B7355]',
  'teambuilding/recognition': 'bg-[#D4860B]',
  teambuidling: 'bg-[#D4860B]',
  'teambuidling/recognition': 'bg-[#D4860B]',
  teambuilding: 'bg-[#D4860B]',
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

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00Z')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isTransportSession(session: SessionData): boolean {
  return (
    session.session_tag?.toLowerCase() === 'transport' ||
    session.session_name.toLowerCase().includes('transport')
  )
}

/* ─── Main Component ─── */

export function SchedulePage() {
  const { eventSlug, isLoading: slugLoading } = useEventSlug()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [detailSession, setDetailSession] = useState<SessionData | null>(null)

  // 1. Fetch event info
  const { data: event } = useQuery<EventData>({
    queryKey: ['event', eventSlug],
    queryFn: async () => {
      const res = await api.get(`/app/events/${eventSlug}`)
      return res.data.data
    },
    enabled: !!eventSlug,
  })

  // 2. Fetch stored event days from API
  const { data: apiDays } = useQuery<DayTab[]>({
    queryKey: ['event-days', eventSlug],
    queryFn: async () => {
      const res = await api.get(`/app/events/${eventSlug}/days`)
      return res.data.data
    },
    enabled: !!eventSlug && !!event,
  })

  // 3. Build day tabs
  const dayTabs = useMemo(() => {
    if (apiDays && apiDays.length > 0) {
      return apiDays.map((d) => ({
        day_number: d.day_number,
        day_date: d.day_date.substring(0, 10),
      }))
    }
    if (!event?.event_start_date || !event?.event_end_date) return []
    const startStr = event.event_start_date.substring(0, 10)
    const endStr = event.event_end_date.substring(0, 10)
    const start = new Date(startStr + 'T12:00:00Z')
    const end = new Date(endStr + 'T12:00:00Z')
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return []
    const tabs: DayTab[] = []
    let dayNum = 1
    const d = new Date(start)
    while (d <= end) {
      tabs.push({ day_number: dayNum, day_date: d.toISOString().split('T')[0] })
      dayNum++
      d.setUTCDate(d.getUTCDate() + 1)
    }
    return tabs
  }, [apiDays, event])

  // Set initial selected date
  if (dayTabs.length > 0 && !selectedDate) {
    setSelectedDate(dayTabs[0].day_date)
  }

  // 4. Fetch sessions for selected date
  const { data: sessions, isLoading } = useQuery<SessionData[]>({
    queryKey: ['schedule-sessions', eventSlug, selectedDate],
    queryFn: async () => {
      const res = await api.get(
        `/app/events/${eventSlug}/sessions?date=${selectedDate}`,
      )
      return res.data.data
    },
    enabled: !!eventSlug && !!selectedDate,
  })

  // 5. Fetch ALL sessions (no date filter) to extract user-specific departments
  const { data: allSessions = [] } = useQuery<SessionData[]>({
    queryKey: ['all-sessions', eventSlug],
    queryFn: async () => {
      const res = await api.get(`/app/events/${eventSlug}/sessions`)
      return res.data.data
    },
    enabled: !!eventSlug,
    staleTime: 5 * 60 * 1000,
  })

  // Toggle favourite
  const favMutation = useMutation({
    mutationFn: async ({
      sessionId,
      isFav,
    }: {
      sessionId: number
      isFav: boolean
    }) => {
      if (isFav) {
        await api.delete(`/app/favourites/${sessionId}`)
      } else {
        await api.post(`/app/favourites/${sessionId}`)
      }
    },
    onMutate: async ({ sessionId, isFav }) => {
      await queryClient.cancelQueries({
        queryKey: ['schedule-sessions', eventSlug, selectedDate],
      })
      const prev = queryClient.getQueryData<SessionData[]>([
        'schedule-sessions',
        eventSlug,
        selectedDate,
      ])
      queryClient.setQueryData<SessionData[]>(
        ['schedule-sessions', eventSlug, selectedDate],
        (old) =>
          old?.map((s) =>
            s.id === sessionId ? { ...s, is_favourite: !isFav } : s,
          ),
      )
      return { prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(
          ['schedule-sessions', eventSlug, selectedDate],
          context.prev,
        )
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['schedule-sessions', eventSlug, selectedDate],
      })
      queryClient.invalidateQueries({ queryKey: ['favourites-count'] })
      queryClient.invalidateQueries({ queryKey: ['favourites'] })
    },
  })

  // Sort sessions by start time
  const sorted = useMemo(
    () =>
      sessions
        ? [...sessions].sort((a, b) =>
            a.session_start_time.localeCompare(b.session_start_time),
          )
        : [],
    [sessions],
  )

  // Extract unique departments from user's visible sessions (across all dates)
  const departmentNames = useMemo(() => {
    const depts = new Set<string>()
    allSessions.forEach((s) => {
      if (!s.is_generic && s.department) depts.add(s.department)
    })
    return Array.from(depts).sort()
  }, [allSessions])

  // Apply department filter
  const filtered = selectedDept
    ? sorted.filter((s) => s.is_generic || s.department === selectedDept)
    : sorted

  if (slugLoading || !eventSlug) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-az-mulberry border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="overflow-x-hidden">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        {/* Date Tabs — evenly distributed full width */}
        <div className="flex justify-between border-b border-gray-300 px-4">
          {dayTabs.map((day) => {
            const dateStr = day.day_date
            const isActive = dateStr === selectedDate
            return (
              <button
                key={dateStr}
                onClick={() => {
                  setSelectedDate(dateStr)
                  setSelectedDept(null)
                }}
                className={cn(
                  'relative py-3 text-sm font-medium transition-colors flex-1 text-center',
                  isActive ? 'text-az-mulberry' : 'text-gray-500',
                )}
              >
                {formatShortDate(dateStr)}
                {isActive && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-[3px] bg-az-mulberry rounded-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* Department Filter Chips — flex-wrap, user departments only, no "ALL" */}
        {departmentNames.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 py-2.5 px-3 bg-white border-b border-gray-300">
            {departmentNames.map((dept) => {
              const isActive = selectedDept === dept
              return (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(isActive ? null : dept)}
                  className={cn(
                    'px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all',
                    isActive
                      ? 'bg-az-mulberry text-white'
                      : 'bg-[#E8D5E5] text-az-mulberry',
                  )}
                >
                  {dept}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Session Timeline ── */}
      <div className="px-4 pt-4 pb-20">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-az-mulberry border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <CalendarEmpty />
            <p className="mt-4 font-semibold text-az-graphite text-sm">
              No sessions for this day
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {selectedDept
                ? 'Try selecting a different department or day.'
                : 'Check another day for scheduled sessions.'}
            </p>
          </div>
        ) : (
          <div className="relative max-w-3xl mx-auto">
            {/* Continuous vertical timeline line */}
            {filtered.length > 0 && (
              <div
                className="absolute left-[65px] w-[2px] bg-gray-300"
                style={{
                  top: '20px',
                  bottom: isTransportSession(filtered[filtered.length - 1])
                    ? '0'
                    : '20px',
                }}
              />
            )}

            <div className="space-y-5">
              {filtered.map((session, idx) => {
                if (isTransportSession(session)) {
                  return <TransportCard key={session.id} session={session} />
                }
                return (
                  <TimelineEntry
                    key={session.id}
                    session={session}
                    isLast={idx === filtered.length - 1}
                    onToggleFav={() =>
                      favMutation.mutate({
                        sessionId: session.id,
                        isFav: session.is_favourite,
                      })
                    }
                    onViewDetails={() => setDetailSession(session)}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Session Detail Modal ── */}
      <SessionDetailModal
        session={detailSession}
        onClose={() => setDetailSession(null)}
      />
    </div>
  )
}

/* ─── Timeline Entry ─── */

function TimelineEntry({
  session,
  onToggleFav,
  onViewDetails,
}: {
  session: SessionData
  isLast?: boolean
  onToggleFav: () => void
  onViewDetails: () => void
}) {
  const tz = session.timezone ? ` (${session.timezone})` : ''
  const timeStr = session.session_end_time
    ? `${formatTime(session.session_start_time)} - ${formatTime(session.session_end_time)}${tz}`
    : `${formatTime(session.session_start_time)}${tz}`

  return (
    <div className="flex items-start relative">
      {/* Left: time — fixed 60px */}
      <div className="w-[60px] flex-shrink-0 text-right pr-2 pt-4">
        <span className="text-xs font-bold text-black leading-none">
          {formatTime(session.session_start_time)}
        </span>
      </div>

      {/* Center: dot on the timeline */}
      <div className="w-3 flex-shrink-0 flex justify-center pt-4 z-[1]">
        <div className="w-2.5 h-2.5 rounded-full bg-az-mulberry border-2 border-white shadow-sm" />
      </div>

      {/* Right: session card */}
      <div className="flex-1 min-w-0 pl-3">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-3.5">
            {/* Tag + Heart */}
            <div className="flex items-start justify-between gap-2">
              {session.session_tag && (
                <span
                  className={cn(
                    'inline-block text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider leading-relaxed',
                    getTagColor(session.session_tag),
                  )}
                >
                  {session.session_tag}
                </span>
              )}
              <button
                type="button"
                onClick={onToggleFav}
                className="p-1 -m-1 ml-auto flex-shrink-0"
                aria-label={
                  session.is_favourite
                    ? 'Remove from favorites'
                    : 'Add to favorites'
                }
              >
                <Heart
                  className={cn(
                    'h-5 w-5 transition-colors',
                    session.is_favourite
                      ? 'fill-az-mulberry text-az-mulberry'
                      : 'text-gray-400',
                  )}
                />
              </button>
            </div>

            {/* Name */}
            <h3 className="mt-2 text-[15px] font-bold text-black leading-snug">
              {session.session_name}
            </h3>

            {/* Time */}
            <div className="mt-2 flex items-center gap-1.5 text-xs text-az-graphite">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{timeStr}</span>
            </div>

            {/* Location */}
            {session.session_location && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-az-graphite">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{session.session_location}</span>
              </div>
            )}
          </div>

          {/* Dashed Divider */}
          <div className="border-t border-dashed border-gray-300 mx-3.5" />

          {/* Action Button */}
          <div className="p-3.5 pt-3">
            <button
              type="button"
              onClick={onViewDetails}
              className="w-full bg-az-mulberry text-white py-2.5 rounded-xl text-sm font-bold active:scale-[0.98] transition-transform"
            >
              View Session Details
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Transport Card ─── */

function TransportCard({ session }: { session: SessionData }) {
  const tz = session.timezone ? ` (${session.timezone})` : ''
  const timeStr = session.session_end_time
    ? `${formatTime(session.session_start_time)} - ${formatTime(session.session_end_time)}${tz}`
    : `${formatTime(session.session_start_time)}${tz}`

  return (
    <div className="flex items-center gap-2 py-3 pl-[78px]">
      <div className="flex-1 border-t-2 border-dashed border-gray-400" />
      <div className="text-center flex-shrink-0 px-1">
        <p className="text-xs font-semibold text-az-graphite">
          {session.session_name}
        </p>
        <p className="text-[11px] text-gray-500">{timeStr}</p>
      </div>
      <div className="flex-1 border-t-2 border-dashed border-gray-400" />
    </div>
  )
}

/* ─── Empty State Icon ─── */

function CalendarEmpty() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
      <svg
        className="h-7 w-7 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
        />
      </svg>
    </div>
  )
}
