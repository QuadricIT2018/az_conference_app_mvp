import { createContext, useContext, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/config/api'

interface PublishedEvent {
  id: number
  event_slug: string
  pwa_name: string | null
  event_name: string
  event_start_date: string
  event_end_date: string
  event_location: string | null
}

interface EventContextType {
  eventSlug: string | null
  isLoading: boolean
}

const EventContext = createContext<EventContextType | undefined>(undefined)

export function EventProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery<PublishedEvent[]>({
    queryKey: ['published-events'],
    queryFn: async () => {
      const res = await api.get('/app/events')
      return res.data.data
    },
    staleTime: 5 * 60 * 1000,
  })

  const eventSlug = data && data.length > 0 ? data[0].event_slug : null

  return (
    <EventContext.Provider value={{ eventSlug, isLoading }}>
      {children}
    </EventContext.Provider>
  )
}

export function useEventSlug() {
  const context = useContext(EventContext)
  if (context === undefined) {
    throw new Error('useEventSlug must be used within an EventProvider')
  }
  return context
}
