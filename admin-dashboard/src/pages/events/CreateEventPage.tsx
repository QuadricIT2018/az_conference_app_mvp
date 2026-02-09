import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import api from '@/config/api'
import { toast } from 'sonner'

interface Department {
  id: string
  name: string
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
]

export function CreateEventPage() {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    pwa_display_name: '',
    description: '',
    department_id: '',
    start_date: '',
    end_date: '',
    timezone: '',
    venue: '',
    location_map_url: '',
  })

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/admin/departments')
      setDepartments(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error('Event name is required')
      return
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error('Start and end dates are required')
      return
    }

    try {
      setLoading(true)

      const payload = {
        event_slug: generateSlug(formData.name),
        event_name: formData.name,
        pwa_name: formData.pwa_display_name || formData.name,
        event_description: formData.description || null,
        event_location: formData.venue || null,
        event_location_map_url: formData.location_map_url || null,
        event_start_date: formData.start_date,
        event_end_date: formData.end_date,
        department: formData.department_id || null,
        is_draft: true,
      }

      await api.post('/admin/events', payload)
      toast.success('Event created successfully')
      navigate('/events')
    } catch (error: any) {
      console.error('Failed to create event:', error)
      const message = error.response?.data?.error || 'Failed to create event'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/events')}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold font-heading text-az-graphite">
          Create New Event
        </h1>
      </div>

      {/* Form */}
      <Card className="p-8">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold font-heading mb-6 pb-4 border-b">
            Event Details
          </h2>

          <div className="space-y-6">
            {/* Event Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter event name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* PWA Display Name */}
            <div className="space-y-2">
              <Label htmlFor="pwa_display_name">PWA Display Name</Label>
              <Input
                id="pwa_display_name"
                name="pwa_display_name"
                placeholder="App name on home screen (defaults to event name)"
                value={formData.pwa_display_name}
                onChange={handleChange}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter event description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department_id">Department</Label>
              <Select
                id="department_id"
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
              >
                <option value="">Select a department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
              >
                <option value="">Select a timezone</option>
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="venue">Location</Label>
              <Input
                id="venue"
                name="venue"
                placeholder="Enter event location"
                value={formData.venue}
                onChange={handleChange}
              />
            </div>

            {/* Location Map URL */}
            <div className="space-y-2">
              <Label htmlFor="location_map_url">Location Map URL</Label>
              <p className="text-sm text-muted-foreground">Google Maps link for the event venue</p>
              <Input
                id="location_map_url"
                name="location_map_url"
                placeholder="https://maps.google.com/..."
                value={formData.location_map_url}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/events')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={loading}
            >
              <Save className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
