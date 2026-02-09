import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  FileText,
  CalendarDays,
  Wifi,
  Map,
  Send,
  Link2,
  Check,
  ImagePlus,
  Upload,
  X,
} from 'lucide-react'
import api from '@/config/api'
import { toast } from 'sonner'
import { SessionsSection } from '@/components/events/SessionsSection'
import { WifiSection } from '@/components/events/WifiSection'
import { VenueMapsSection } from '@/components/events/VenueMapsSection'
import { ImportantUpdatesSection } from '@/components/events/ImportantUpdatesSection'
import { QuickLinksSection } from '@/components/events/QuickLinksSection'

interface EventData {
  id: number
  event_name: string
  event_slug: string
  pwa_name: string
  pwa_logo_url: string | null
  event_banner_url: string | null
  event_description: string | null
  department: string | null
  event_location: string | null
  event_location_map_url: string | null
  event_start_date: string
  event_end_date: string
  event_venue_map_url: string | null
  event_app_url: string | null
  wifi: unknown[]
  venue_maps: unknown[]
  helpdesk: unknown[]
  event_banners: Record<string, { file_url: string; original_name: string }>
  quick_links: unknown[]
  is_draft: boolean
  manifest_url: string | null
  session_count?: number
  update_count?: number
}

interface Department {
  id: number
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

const sectionConfig = [
  { key: 'event-details', title: 'Event Details', icon: FileText },
  { key: 'sessions', title: 'Sessions & Schedule', icon: CalendarDays },
  { key: 'wifi', title: 'WiFi Information', icon: Wifi },
  { key: 'venue-maps', title: 'Venue Maps', icon: Map },
  { key: 'updates', title: 'Important Updates', icon: Send },
  { key: 'quick-links', title: 'Quick Links', icon: Link2 },
]

export function EventBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [departments, setDepartments] = useState<Department[]>([])
  const [timezone, setTimezone] = useState('')

  const [formData, setFormData] = useState({
    event_name: '',
    event_start_date: '',
    event_end_date: '',
    event_location: '',
    event_location_map_url: '',
    department: '',
    pwa_name: '',
    event_description: '',
  })

  useEffect(() => {
    fetchEvent()
    fetchDepartments()
  }, [id])

  useEffect(() => {
    if (event) {
      setFormData({
        event_name: event.event_name || '',
        event_start_date: event.event_start_date
          ? event.event_start_date.substring(0, 10)
          : '',
        event_end_date: event.event_end_date
          ? event.event_end_date.substring(0, 10)
          : '',
        event_location: event.event_location || '',
        event_location_map_url: event.event_location_map_url || '',
        department: event.department || '',
        pwa_name: event.pwa_name || '',
        event_description: event.event_description || '',
      })
    }
  }, [event])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/admin/events/${id}`)
      setEvent(res.data.data)
    } catch {
      toast.error('Failed to load event')
      navigate('/events')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments')
      setDepartments(res.data.data || [])
    } catch {
      console.error('Failed to fetch departments')
    }
  }

  const toggleSection = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveEventDetails = async () => {
    if (!formData.event_name) {
      toast.error('Event title is required')
      return
    }
    if (!formData.event_start_date || !formData.event_end_date) {
      toast.error('Start and end dates are required')
      return
    }

    try {
      setSaving(true)
      await api.put(`/admin/events/${id}`, {
        event_name: formData.event_name,
        pwa_name: formData.pwa_name || formData.event_name,
        event_description: formData.event_description || null,
        event_location: formData.event_location || null,
        event_location_map_url: formData.event_location_map_url || null,
        event_start_date: formData.event_start_date,
        event_end_date: formData.event_end_date,
        department: formData.department || null,
      })
      toast.success('Event details saved successfully')
      fetchEvent()
    } catch {
      toast.error('Failed to save event details')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!event) return
    try {
      setPublishing(true)
      await api.put(`/admin/events/${id}`, { is_draft: !event.is_draft })
      setEvent((prev) =>
        prev ? { ...prev, is_draft: !prev.is_draft } : prev
      )
      toast.success(event.is_draft ? 'Event published' : 'Event unpublished')
    } catch {
      toast.error('Failed to update event status')
    } finally {
      setPublishing(false)
    }
  }

  const hasEventDetails = !!(
    event?.event_name &&
    event?.event_start_date &&
    event?.event_end_date
  )

  const hasSessions = (event?.session_count ?? 0) > 0
  const hasWifi = (event?.wifi as unknown[])?.length > 0
  const hasVenueMaps = (event?.venue_maps as unknown[])?.length > 0
  const hasUpdates = (event?.update_count ?? 0) > 0
  const hasQuickLinks = (event?.quick_links as unknown[])?.length > 0

  const canPublish =
    hasEventDetails && hasSessions && hasVenueMaps

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!event) return null

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/events')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Event Builder
            </p>
            <h1 className="text-xl font-bold font-heading text-az-graphite">
              {event.event_name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              event.is_draft ? 'bg-amber-400' : 'bg-green-500'
            )}
          />
          <button
            onClick={handlePublish}
            disabled={publishing || (event.is_draft && !canPublish)}
            title={
              event.is_draft && !canPublish
                ? 'Complete all sections before publishing'
                : undefined
            }
            className="text-sm font-medium text-az-graphite hover:text-primary transition-colors disabled:opacity-50"
          >
            {publishing
              ? 'Updating...'
              : event.is_draft
                ? 'Publish Event'
                : 'Unpublish'}
          </button>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="divide-y">
        {sectionConfig.map((section) => {
          const isOpen = expanded.has(section.key)
          const hasCheck =
            (section.key === 'event-details' && hasEventDetails) ||
            (section.key === 'sessions' && hasSessions) ||
            (section.key === 'wifi' && hasWifi) ||
            (section.key === 'venue-maps' && hasVenueMaps) ||
            (section.key === 'updates' && hasUpdates) ||
            (section.key === 'quick-links' && hasQuickLinks)

          return (
            <div key={section.key}>
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(section.key)}
                className="flex items-center gap-4 w-full py-5 text-left"
              >
                <section.icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isOpen ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <span
                  className={cn(
                    'flex-1 font-semibold font-heading',
                    isOpen ? 'text-primary' : 'text-az-graphite'
                  )}
                >
                  {section.title}
                </span>
                {hasCheck && (
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              {/* Section Content */}
              <div
                className={cn(
                  'grid transition-all duration-200 ease-in-out',
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
              >
                <div className="overflow-hidden">
                  {section.key === 'event-details' ? (
                    <EventDetailsForm
                      eventId={id!}
                      formData={formData}
                      departments={departments}
                      timezone={timezone}
                      saving={saving}
                      eventBanners={event.event_banners || {}}
                      pwaLogoUrl={event.pwa_logo_url}
                      onChange={handleChange}
                      onTimezoneChange={setTimezone}
                      onSave={handleSaveEventDetails}
                      onRefresh={fetchEvent}
                    />
                  ) : section.key === 'sessions' ? (
                    <SessionsSection
                      eventId={id!}
                      eventStartDate={event.event_start_date}
                      eventEndDate={event.event_end_date}
                    />
                  ) : section.key === 'wifi' ? (
                    <WifiSection eventId={id!} initialWifi={event.wifi} />
                  ) : section.key === 'venue-maps' ? (
                    <VenueMapsSection
                      eventId={id!}
                      initialMaps={event.venue_maps || []}
                    />
                  ) : section.key === 'updates' ? (
                    <ImportantUpdatesSection eventId={id!} />
                  ) : section.key === 'quick-links' ? (
                    <QuickLinksSection
                      eventId={id!}
                      initialLinks={event.quick_links || []}
                    />
                  ) : (
                    <div className="pb-6 pl-9">
                      <p className="text-sm text-muted-foreground">
                        Configure {section.title.toLowerCase()} settings here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Event Details Form ─── */

type BannerSlot = 'mobile' | 'tablet' | 'desktop'

interface BannerEntry {
  file_url: string
  original_name: string
}

const BANNER_SLOTS: {
  key: BannerSlot
  label: string
  ratio: string
  size: string
}[] = [
  { key: 'mobile', label: 'Mobile Banner', ratio: '4:3', size: '375×281px' },
  { key: 'tablet', label: 'Tablet Banner', ratio: '3:2', size: '768×512px' },
  {
    key: 'desktop',
    label: 'Desktop Banner',
    ratio: '16:9',
    size: '1024×576px',
  },
]

interface EventDetailsFormProps {
  eventId: string
  formData: {
    event_name: string
    event_start_date: string
    event_end_date: string
    event_location: string
    event_location_map_url: string
    department: string
    pwa_name: string
    event_description: string
  }
  departments: Department[]
  timezone: string
  saving: boolean
  eventBanners: Record<string, BannerEntry>
  pwaLogoUrl: string | null
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void
  onTimezoneChange: (value: string) => void
  onSave: () => void
  onRefresh: () => void
}

function EventDetailsForm({
  eventId,
  formData,
  departments,
  timezone,
  saving,
  eventBanners,
  pwaLogoUrl,
  onChange,
  onTimezoneChange,
  onSave,
  onRefresh,
}: EventDetailsFormProps) {
  const [pendingBanners, setPendingBanners] = useState<
    Partial<Record<BannerSlot, File>>
  >({})
  const [removedBanners, setRemovedBanners] = useState<Set<BannerSlot>>(
    new Set()
  )
  const [pendingLogo, setPendingLogo] = useState<File | null>(null)
  const [logoRemoved, setLogoRemoved] = useState(false)
  const [uploading, setUploading] = useState(false)

  const bannerInputRefs = useRef<Partial<Record<BannerSlot, HTMLInputElement>>>(
    {}
  )
  const logoInputRef = useRef<HTMLInputElement | null>(null)

  const getBannerPreview = (slot: BannerSlot): string | null => {
    if (pendingBanners[slot]) return URL.createObjectURL(pendingBanners[slot]!)
    if (removedBanners.has(slot)) return null
    if (eventBanners[slot]?.file_url) return eventBanners[slot].file_url
    return null
  }

  const getLogoPreview = (): string | null => {
    if (pendingLogo) return URL.createObjectURL(pendingLogo)
    if (logoRemoved) return null
    if (pwaLogoUrl) return pwaLogoUrl
    return null
  }

  const handleBannerSelect = (
    slot: BannerSlot,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }
    setPendingBanners((prev) => ({ ...prev, [slot]: file }))
    setRemovedBanners((prev) => {
      const next = new Set(prev)
      next.delete(slot)
      return next
    })
  }

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }
    setPendingLogo(file)
    setLogoRemoved(false)
  }

  const removeBanner = (slot: BannerSlot) => {
    setPendingBanners((prev) => {
      const next = { ...prev }
      delete next[slot]
      return next
    })
    setRemovedBanners((prev) => new Set(prev).add(slot))
  }

  const removeLogo = () => {
    setPendingLogo(null)
    setLogoRemoved(true)
  }

  const handleSaveAll = async () => {
    try {
      setUploading(true)

      // 1. Upload pending banners
      const resolvedBanners: Record<string, BannerEntry> = {}

      for (const slot of BANNER_SLOTS) {
        if (removedBanners.has(slot.key)) continue
        if (pendingBanners[slot.key]) {
          const fd = new FormData()
          fd.append('file', pendingBanners[slot.key]!)
          const uploadRes = await api.post('/admin/upload/banner', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          resolvedBanners[slot.key] = {
            file_url: uploadRes.data.data.file_url,
            original_name: uploadRes.data.data.original_name,
          }
        } else if (eventBanners[slot.key]?.file_url) {
          resolvedBanners[slot.key] = eventBanners[slot.key]
        }
      }

      // 2. Upload pending logo
      let logoUrl = logoRemoved ? null : pwaLogoUrl
      if (pendingLogo) {
        const fd = new FormData()
        fd.append('file', pendingLogo)
        const uploadRes = await api.post('/admin/upload/logo', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        logoUrl = uploadRes.data.data.file_url
      }

      // 3. Save banners via PATCH
      await api.patch(`/admin/events/${eventId}/banners`, {
        event_banners: resolvedBanners,
      })

      // 4. Save logo via PATCH
      await api.patch(`/admin/events/${eventId}/logo`, {
        pwa_logo_url: logoUrl,
      })

      // 5. Clear pending state
      setPendingBanners({})
      setRemovedBanners(new Set())
      setPendingLogo(null)
      setLogoRemoved(false)

      // 6. Save regular event details
      onSave()

      // 7. Refresh to get updated data
      onRefresh()
    } catch {
      toast.error('Failed to save uploads')
    } finally {
      setUploading(false)
    }
  }

  const isSaving = saving || uploading

  return (
    <div className="pb-8 space-y-6">
      {/* Event Title */}
      <div className="space-y-2">
        <Label htmlFor="event_name">
          Event Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="event_name"
          name="event_name"
          value={formData.event_name}
          onChange={onChange}
          placeholder="Enter event title"
        />
      </div>

      {/* Event Banners */}
      <div className="space-y-3">
        <Label>Event Banners</Label>
        <p className="text-sm text-muted-foreground">
          Upload banners optimized for different devices. Each banner will be
          displayed based on the user&apos;s device.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {BANNER_SLOTS.map((slot) => {
            const preview = getBannerPreview(slot.key)
            return (
              <div key={slot.key} className="space-y-2">
                <span className="text-sm font-medium">{slot.label}</span>
                <input
                  ref={(el) => {
                    if (el) bannerInputRefs.current[slot.key] = el
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleBannerSelect(slot.key, e)}
                />
                {preview ? (
                  <div className="relative group rounded-lg overflow-hidden border">
                    <img
                      src={preview}
                      alt={slot.label}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          bannerInputRefs.current[slot.key]?.click()
                        }
                        className="p-1.5 bg-white rounded-full text-az-graphite hover:text-primary"
                      >
                        <Upload className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBanner(slot.key)}
                        className="p-1.5 bg-white rounded-full text-az-graphite hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() =>
                      bannerInputRefs.current[slot.key]?.click()
                    }
                    className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground mt-2">
                      {slot.ratio}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Recommended: {slot.size}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_start_date">
            Start Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="event_start_date"
            name="event_start_date"
            type="date"
            value={formData.event_start_date}
            onChange={onChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event_end_date">
            End Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="event_end_date"
            name="event_end_date"
            type="date"
            value={formData.event_end_date}
            onChange={onChange}
          />
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select
          id="timezone"
          value={timezone}
          onChange={(e) => onTimezoneChange(e.target.value)}
        >
          <option value="">Select timezone...</option>
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="event_location">Location</Label>
        <Input
          id="event_location"
          name="event_location"
          value={formData.event_location}
          onChange={onChange}
          placeholder="Enter event location"
        />
      </div>

      {/* Location Map URL */}
      <div className="space-y-2">
        <Label htmlFor="event_location_map_url">Location Map URL</Label>
        <p className="text-sm text-muted-foreground">
          Google Maps link for the event venue
        </p>
        <Input
          id="event_location_map_url"
          name="event_location_map_url"
          value={formData.event_location_map_url}
          onChange={onChange}
          placeholder="https://maps.google.com/..."
        />
      </div>

      {/* Department */}
      <div className="space-y-2">
        <Label htmlFor="department">
          Department <span className="text-red-500">*</span>
        </Label>
        <Select
          id="department"
          name="department"
          value={formData.department}
          onChange={onChange}
        >
          <option value="">Select a department</option>
          <option value="ALL">ALL</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </Select>
      </div>

      {/* PWA Display Name */}
      <div className="space-y-2">
        <Label htmlFor="pwa_name">PWA Display Name</Label>
        <Input
          id="pwa_name"
          name="pwa_name"
          value={formData.pwa_name}
          onChange={onChange}
          placeholder="App name on home screen"
        />
      </div>

      {/* PWA Logo */}
      <div className="space-y-3">
        <Label>PWA Logo</Label>
        <p className="text-sm text-muted-foreground">
          This logo appears on the home screen when users install the event
          app. Recommended: 512×512px, PNG format.
        </p>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoSelect}
        />
        {getLogoPreview() ? (
          <div className="relative group w-32 h-32 rounded-lg overflow-hidden border">
            <img
              src={getLogoPreview()!}
              alt="PWA Logo"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="p-1.5 bg-white rounded-full text-az-graphite hover:text-primary"
              >
                <Upload className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={removeLogo}
                className="p-1.5 bg-white rounded-full text-az-graphite hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => logoInputRef.current?.click()}
            className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground mt-2">Upload</span>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="event_description">Description</Label>
        <Textarea
          id="event_description"
          name="event_description"
          value={formData.event_description}
          onChange={onChange}
          placeholder="Brief description of the event..."
          rows={4}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSaveAll} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}