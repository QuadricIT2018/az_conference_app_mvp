import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Eye, Pencil, Trash2 } from 'lucide-react'

interface Event {
  id: number
  event_name: string
  event_slug: string
  pwa_name?: string
  event_description?: string
  event_location?: string
  event_start_date: string
  event_end_date: string
  is_draft: boolean
}

interface EventCardProps {
  event: Event
  onView: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const startDay = start.getDate()
  const endDay = end.getDate()
  const year = end.getFullYear()

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`
  }

  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
}

export function EventCard({ event, onView, onEdit, onDelete }: EventCardProps) {
  return (
    <Card className="p-6 bg-white">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold font-heading text-az-graphite">
          {event.event_name}
        </h3>
        <Badge variant={event.is_draft ? "muted" : "default"}>
          {event.is_draft ? 'Draft' : 'Published'}
        </Badge>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">{formatDateRange(event.event_start_date, event.event_end_date)}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{event.event_location || '—'}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(event.id)}
          className="gap-1.5"
        >
          <Eye className="h-4 w-4" />
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(event.id)}
          className="gap-1.5"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(event.id)}
          className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </Card>
  )
}
