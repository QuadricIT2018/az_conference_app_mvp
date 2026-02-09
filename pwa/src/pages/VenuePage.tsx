import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Document, Page, pdfjs } from 'react-pdf'
import api from '@/config/api'
import { useEventSlug } from '@/contexts/EventContext'
import { MapPin, ExternalLink, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface VenueMapInfo {
  title: string
  file_url: string
}

interface EventVenueData {
  id: number
  venue_maps: VenueMapInfo[]
  event_venue_map_url: string | null
}

function getPdfUrl(fileUrl: string): string {
  if (fileUrl.startsWith('http')) return fileUrl
  return fileUrl
}

export function VenuePage() {
  const { eventSlug } = useEventSlug()
  const [activeIndex, setActiveIndex] = useState(0)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const measure = () => setContainerWidth(node.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

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
  const pdfUrl = activeMap ? getPdfUrl(activeMap.file_url) : null

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset
      if (newPage < 1) return 1
      if (newPage > numPages) return numPages
      return newPage
    })
  }

  function handleZoomIn() {
    setScale(prev => Math.min(prev + 0.25, 3.0))
  }

  function handleZoomOut() {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

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

      {/* Custom PDF Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[40px] text-center">
            {pageNumber}/{numPages || 1}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ZoomOut className="h-5 w-5 text-gray-700" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ZoomIn className="h-5 w-5 text-gray-700" />
          </button>
          <button className="p-1 rounded hover:bg-gray-100">
            <Search className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Tabs — only show if multiple maps */}
      {maps.length > 1 && (
        <div className="flex gap-2 px-4 py-2 bg-white border-b border-gray-200 overflow-x-auto no-scrollbar">
          {maps.map((map, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveIndex(idx)
                setPageNumber(1)
                setScale(1.0)
              }}
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

      {/* PDF Viewer */}
      {pdfUrl && (
        <div ref={containerRef} className="flex-1 min-h-0 overflow-auto bg-gray-100">
          <div className="flex items-center justify-center min-h-full py-4">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-az-mulberry border-t-transparent" />
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <p className="font-semibold text-red-600">Failed to load PDF</p>
                  <p className="mt-1 text-sm text-gray-500">Please try again later.</p>
                </div>
              }
            >
              {containerWidth > 0 && (
                <Page
                  pageNumber={pageNumber}
                  width={containerWidth * scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-lg"
                />
              )}
            </Document>
          </div>
        </div>
      )}
    </div>
  )
}