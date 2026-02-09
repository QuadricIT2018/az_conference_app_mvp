import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/config/api'
import { formatTime, formatEventDateRange } from '@/lib/utils'
import { useEventSlug } from '@/contexts/EventContext'
import {
  Calendar,
  Bell,
  MapPin,
  Clock,
  Send,
  Map,
  BarChart3,
} from 'lucide-react'

interface EventData {
  id: number
  event_slug: string
  pwa_name: string
  pwa_logo_url: string | null
  event_name: string
  event_banner_url: string | null
  event_description: string
  event_location: string
  event_location_map_url: string | null
  event_start_date: string
  event_end_date: string
  event_venue_map_url: string | null
}

interface SessionData {
  id: number
  session_name: string
  session_description: string
  session_date: string
  session_start_time: string
  session_end_time: string
  session_tag: string | null
  session_location: string | null
  is_favourite?: boolean
}

interface UpdateData {
  id: number
  title: string
  description: string
  update_date_time: string
}

const DIRECTIONS_URL = 'https://maps.app.goo.gl/4DV3QoEvQUXgPcDcA'
const RESOURCES_URL = 'https://github.com/enterprises/AstraZeneca-EMS/sso?return_to=https%3A%2F%2Fgithub.com%2Fazu-ets%2Fcse-aws-comm-conf-app-solution%2Fpull%2F103'

function getUpNextSession(sessions: SessionData[] | undefined): SessionData | null {
  if (!sessions || sessions.length === 0) return null

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  // Find first session that hasn't ended yet
  const upcoming = sessions.find((s) => {
    if (s.session_date < todayStr) return false
    if (s.session_date > todayStr) return true
    // Same day — check if session hasn't ended
    const [h, m] = s.session_end_time.split(':').map(Number)
    const endMinutes = h * 60 + m
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    return endMinutes > nowMinutes
  })

  return upcoming || sessions[0]
}

export function HomePage() {
  const { eventSlug } = useEventSlug()

  const { data: event } = useQuery<EventData>({
    queryKey: ['event', eventSlug],
    queryFn: async () => {
      const res = await api.get(`/app/events/${eventSlug}`)
      return res.data.data
    },
    enabled: !!eventSlug,
  })

  const { data: sessions } = useQuery<SessionData[]>({
    queryKey: ['sessions', eventSlug],
    queryFn: async () => {
      const res = await api.get(`/app/events/${eventSlug}/sessions`)
      return res.data.data
    },
    enabled: !!eventSlug && !!event,
  })

  const { data: updates } = useQuery<UpdateData[]>({
    queryKey: ['updates', eventSlug],
    queryFn: async () => {
      const res = await api.get(`/app/events/${eventSlug}/updates`)
      return res.data.data
    },
    enabled: !!eventSlug && !!event,
  })

  const upNext = getUpNextSession(sessions)
  const eventDates =
    event?.event_start_date && event?.event_end_date
      ? formatEventDateRange(event.event_start_date, event.event_end_date)
      : ''

  return (
    <div className="overflow-x-hidden">
      {/* ========== WELCOME CARD ========== */}
      <div className="mx-4 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-black">
          <span className="inline-block bg-[#D4A017] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Welcome
          </span>
          <h1 className="mt-3 text-2xl font-bold font-heading text-black">
            {event?.pwa_name || event?.event_name || 'Conference'}
          </h1>
          <div className="mt-2 flex flex-col gap-1.5 text-sm text-black">
            {eventDates && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0 text-az-graphite" />
                <span>{eventDates}</span>
              </div>
            )}
            {event?.event_location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 text-az-graphite" />
                <span>{event.event_location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== SCROLLABLE CONTENT ========== */}
      <div className="px-4 mt-5 space-y-6 pb-8">
        {/* ---- UP NEXT SESSION ---- */}
        {upNext && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-black">
            <span className="text-[11px] font-bold text-az-mulberry uppercase tracking-wider">
              Up Next
            </span>
            <h2 className="mt-2 text-xl font-bold font-heading text-az-mulberry leading-tight">
              {upNext.session_name}
            </h2>
            <div className="mt-3 flex flex-col gap-1.5 text-sm text-black">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0 text-az-graphite" />
                <span className="text-xs text-black">
                  {formatTime(upNext.session_start_time)} -{' '}
                  {formatTime(upNext.session_end_time)}
                </span>
              </div>
              {upNext.session_location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-az-graphite" />
                  <span className="text-xs text-black">
                    {upNext.session_location}</span>
                </div>
              )}
            </div>
            <Link
              to="/agenda"
              className="mt-4 flex items-center justify-center w-full bg-az-mulberry text-white py-2.5 rounded-full font-semibold text-xs active:scale-[0.98] transition-transform"
            >
              View Session Details
            </Link>
          </div>
        )}

        {/* ---- QUICK ACTIONS ---- */}
        <div>
          <h2 className="text-lg font-bold font-heading text-black">
            Quick Actions
          </h2>
          <div className="mt-4 flex items-start justify-start gap-6 sm:gap-8">
            {/* Directions */}
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F3E8F0]">
                <Send className="h-6 w-6 text-az-mulberry" />
              </div>
              <span className="text-xs font-medium text-black">Directions</span>
            </a>

            {/* Venue Map */}
            <Link
              to="/venue"
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F3E8F0]">
                <Map className="h-6 w-6 text-az-mulberry" />
              </div>
              <span className="text-xs font-medium text-black">Venue Map</span>
            </Link>

            {/* Resources */}
            <a
              href={RESOURCES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F3E8F0]">
                <BarChart3 className="h-6 w-6 text-az-mulberry" />
              </div>
              <span className="text-xs font-medium text-black">Resources</span>
            </a>
          </div>
        </div>

        {/* ---- IMPORTANT UPDATES ---- */}
        <div>
          <h2 className="text-lg font-bold font-heading text-az-graphite">
            Important Updates
          </h2>
          <div className="mt-3">
            {updates && updates.length > 0 ? (
              <div className="space-y-3">
                {updates.slice(0, 3).map((update) => (
                  <Link
                    key={update.id}
                    to="/updates"
                    className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-semibold text-az-graphite text-sm">
                      {update.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {update.description}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl py-10 px-6 shadow-sm border border-gray-100 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <Bell className="h-7 w-7 text-gray-400" />
                </div>
                <p className="mt-4 font-semibold text-az-graphite text-sm">
                  No updates at this time
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Check back later for important announcements.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
