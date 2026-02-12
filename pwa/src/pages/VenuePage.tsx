import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/config/api'
import { useEventSlug } from '@/contexts/EventContext'
import { MapPin, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VenueMapInfo {
  title: string
  file_url: string
}

interface EventVenueData {
  id: number
  venue_maps: VenueMapInfo[]
  event_venue_map_url: string | null
}

function getGoogleViewerUrl(pdfUrl: string): string {
  return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`
}

export function VenuePage() {
  const { eventSlug } = useEventSlug()
  const [activeIndex, setActiveIndex] = useState(0)

  const { data: event, isLoading } = useQuery<EventVenueData>({
    queryKey: ['event', eventSlug],
    queryFn: async () => {
      const res = await api.get(`/app/events/${eventSlug}`)
      return res.data.data
    },
    enabled: !!eventSlug,
  })

  const maps: VenueMapInfo[] =
    event?.venue_maps && event.venue_maps.length > 0
      ? event.venue_maps
      : event?.event_venue_map_url
        ? [{ title: 'Venue Map', file_url: event.event_venue_map_url }]
        : []

  const activeMap = maps[activeIndex] || null
  const pdfUrl = activeMap ? activeMap.file_url : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-az-mulberry border-t-transparent" />
      </div>
    )
  }

  if (maps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <MapPin className="h-8 w-8 text-gray-400" />
        </div>
        <p className="mt-4 font-semibold text-az-graphite">No venue map available</p>
        <p className="mt-1 text-sm text-gray-500">
          The venue map will appear here once it's uploaded.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-x-hidden" style={{ height: 'calc(100vh - 90px - 64px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <h1 className="text-lg font-bold font-heading text-az-graphite">Venue Map</h1>
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-semibold text-az-mulberry active:opacity-70 transition-opacity"
          >
            Open PDF
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Tabs — only show if multiple maps */}
      {maps.length > 1 && (
        <div className="flex gap-2 px-4 py-2 bg-white border-b border-gray-200 overflow-x-auto no-scrollbar">
          {maps.map((map, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                idx === activeIndex
                  ? 'bg-az-mulberry text-white'
                  : 'bg-gray-100 text-az-graphite active:bg-gray-200'
              )}
            >
              {map.title}
            </button>
          ))}
        </div>
      )}

      {/* PDF Viewer via Google Docs Viewer */}
      {pdfUrl && (
        <div className="flex-1 min-h-0">
          <iframe
            key={pdfUrl}
            src={getGoogleViewerUrl(pdfUrl)}
            title={activeMap?.title || 'Venue Map'}
            className="w-full h-full border-0"
            allowFullScreen
          />
        </div>
      )}
    </div>
  )
}
