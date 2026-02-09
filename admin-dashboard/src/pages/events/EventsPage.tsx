import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { EventCard } from '@/components/events/EventCard'
import { Search, Download, Plus } from 'lucide-react'
import api from '@/config/api'
import { toast } from 'sonner'

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

interface Department {
  id: number
  name: string
}

export function EventsPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  useEffect(() => {
    fetchEvents()
    fetchDepartments()
  }, [statusFilter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      const response = await api.get(`/admin/events?${params.toString()}`)
      setEvents(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/admin/departments')
      setDepartments(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  const handleView = (id: number) => {
    navigate(`/events/${id}`)
  }

  const handleEdit = (id: number) => {
    navigate(`/events/${id}/edit`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      await api.delete(`/admin/events/${id}`)
      toast.success('Event deleted successfully')
      fetchEvents()
    } catch (error) {
      console.error('Failed to delete event:', error)
      toast.error('Failed to delete event')
    }
  }

  const handleExport = () => {
    const csvContent = events.map(e =>
      `${e.event_name},${e.event_start_date},${e.event_end_date},${e.event_location || ''},${e.is_draft ? 'Draft' : 'Published'}`
    ).join('\n')
    const header = 'Name,Start Date,End Date,Location,Status\n'
    const blob = new Blob([header + csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'events.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Events exported successfully')
  }

  // Filter events based on search query
  const filteredEvents = events.filter(event => {
    const searchLower = searchQuery.toLowerCase()
    if (!searchLower) return true
    return (
      (event.event_name?.toLowerCase().includes(searchLower)) ||
      (event.event_description?.toLowerCase().includes(searchLower)) ||
      (event.event_location?.toLowerCase().includes(searchLower)) ||
      (event.event_slug?.toLowerCase().includes(searchLower))
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-heading text-az-graphite">Events</h1>
          <p className="text-muted-foreground mt-1">
            Manage your conference sessions, workshops, and social gatherings.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => navigate('/events/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by name, description, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 rounded-full"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </Select>
        <Select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-48"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </Select>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-az-mulberry border-t-transparent" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No events found.</p>
          <Button onClick={() => navigate('/events/new')} className="mt-4">
            Create your first event
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
