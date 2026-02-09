import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  Clock,
  MapPin,
  GripVertical,
  Plus,
  X,
  Pencil,
} from 'lucide-react'
import api from '@/config/api'
import { toast } from 'sonner'

/* ─── Types ─── */

interface SessionData {
  id: number
  event_id: number
  session_name: string
  session_description: string | null
  session_date: string
  session_start_time: string
  session_end_time: string | null
  session_tag: string | null
  session_location: string | null
  session_location_map_url: string | null
  session_venue_map_url: string | null
  is_generic: boolean
  department: string | null
  is_dept_generic: boolean
  team: string | null
  timezone: string | null
  has_topics: boolean
}

interface SessionTag {
  id: number
  name: string
}

interface Department {
  id: number
  name: string
}

interface Team {
  id: number
  name: string
  department_id: number
}

interface SessionsSectionProps {
  eventId: string
  eventStartDate: string
  eventEndDate: string
}

interface SessionFormData {
  session_name: string
  session_description: string
  session_tag: string
  session_start_time: string
  session_end_time: string
  is_generic: boolean
  department: string
  is_dept_generic: boolean
  team: string
  has_topics: boolean
  session_location: string
  session_location_map_url: string
  session_venue_map_url: string
  survey_url: string
  supporting_material_url: string
}

const emptyForm: SessionFormData = {
  session_name: '',
  session_description: '',
  session_tag: '',
  session_start_time: '',
  session_end_time: '',
  is_generic: true,
  department: '',
  is_dept_generic: true,
  team: '',
  has_topics: false,
  session_location: '',
  session_location_map_url: '',
  session_venue_map_url: '',
  survey_url: '',
  supporting_material_url: '',
}

/* ─── Helpers ─── */

function calcDuration(start: string, end: string | null): string {
  if (!end) return ''
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  if (mins <= 0) return ''
  return `${mins} min`
}

function formatTime(time: string): string {
  return time.substring(0, 5)
}

/* ─── Main Component ─── */

export function SessionsSection({
  eventId,
  eventStartDate,
  eventEndDate,
}: SessionsSectionProps) {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [tags, setTags] = useState<SessionTag[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [dayTabs, setDayTabs] = useState<
    { label: string; date: string; shortDate: string }[]
  >([])
  const [selectedDay, setSelectedDay] = useState('')
  const [loading, setLoading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<SessionFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Fetch stored event days from API
  useEffect(() => {
    fetchEventDays()
  }, [eventId])

  // Format "YYYY-MM-DD" → "Mar 16" without timezone conversion
  const formatShortDate = (dateStr: string) => {
    const [, m, d] = dateStr.split('-').map(Number)
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${months[m - 1]} ${d}`
  }

  // Build day tabs from start/end date strings using pure date math (no Date objects)
  const buildFallbackTabs = (startStr: string, endStr: string) => {
    const tabs: { label: string; date: string; shortDate: string }[] = []
    if (!startStr || !endStr) return tabs

    // Use UTC dates to avoid local timezone shifting
    const start = new Date(startStr + 'T12:00:00Z')
    const end = new Date(endStr + 'T12:00:00Z')
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return tabs

    let dayNum = 1
    const d = new Date(start)
    while (d <= end) {
      const iso = d.toISOString().split('T')[0]
      tabs.push({
        label: `DAY ${dayNum}`,
        date: iso,
        shortDate: formatShortDate(iso),
      })
      dayNum++
      d.setUTCDate(d.getUTCDate() + 1)
    }
    return tabs
  }

  const fetchEventDays = async () => {
    try {
      const res = await api.get(`/admin/events/${eventId}/days`)
      const days = (res.data.data || []) as {
        day_number: number
        day_date: string
      }[]

      if (days.length > 0) {
        const tabs = days.map((d) => {
          const dateStr = d.day_date.substring(0, 10)
          return {
            label: `DAY ${d.day_number}`,
            date: dateStr,
            shortDate: formatShortDate(dateStr),
          }
        })
        setDayTabs(tabs)
        if (!selectedDay) setSelectedDay(tabs[0].date)
      } else {
        const startStr = (eventStartDate || '').substring(0, 10)
        const endStr = (eventEndDate || '').substring(0, 10)
        const tabs = buildFallbackTabs(startStr, endStr)
        setDayTabs(tabs)
        if (tabs.length > 0 && !selectedDay) setSelectedDay(tabs[0].date)
      }
    } catch {
      const startStr = (eventStartDate || '').substring(0, 10)
      const endStr = (eventEndDate || '').substring(0, 10)
      const tabs = buildFallbackTabs(startStr, endStr)
      setDayTabs(tabs)
      if (tabs.length > 0 && !selectedDay) setSelectedDay(tabs[0].date)
    }
  }

  // Fetch sessions whenever selectedDay becomes truthy or changes
  useEffect(() => {
    if (!selectedDay) return
    fetchSessions()
  }, [eventId, selectedDay])

  // Fetch tags and departments once
  useEffect(() => {
    fetchTags()
    fetchDepartments()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const res = await api.get(
        `/admin/events/${eventId}/sessions?date=${selectedDay}`
      )
      setSessions(res.data.data || [])
    } catch {
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const res = await api.get('/admin/tags')
      setTags(res.data.data || [])
    } catch {
      // tags are optional
    }
  }

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments')
      setDepartments(res.data.data || [])
    } catch {
      // departments are optional
    }
  }

  const fetchTeams = async (departmentName: string) => {
    if (!departmentName) {
      setTeams([])
      return
    }
    const dept = departments.find((d) => d.name === departmentName)
    if (!dept) {
      setTeams([])
      return
    }
    try {
      const res = await api.get(`/admin/departments/${dept.id}/teams`)
      setTeams(res.data.data || [])
    } catch {
      setTeams([])
    }
  }

  // Fetch teams when department changes
  useEffect(() => {
    if (!formData.is_generic && formData.department) {
      fetchTeams(formData.department)
    } else {
      setTeams([])
    }
  }, [formData.department, formData.is_generic, departments])

  const openAddPanel = () => {
    setEditingId(null)
    setFormData(emptyForm)
    setPanelOpen(true)
  }

  const openEditPanel = (session: SessionData) => {
    setEditingId(session.id)
    setFormData({
      session_name: session.session_name,
      session_description: session.session_description || '',
      session_tag: session.session_tag || '',
      session_start_time: session.session_start_time
        ? session.session_start_time.substring(0, 5)
        : '',
      session_end_time: session.session_end_time
        ? session.session_end_time.substring(0, 5)
        : '',
      is_generic: session.is_generic,
      department: session.department || '',
      is_dept_generic: session.is_dept_generic,
      team: session.team || '',
      has_topics: session.has_topics,
      session_location: session.session_location || '',
      session_location_map_url: session.session_location_map_url || '',
      session_venue_map_url: session.session_venue_map_url || '',
      survey_url: (session as any).survey_url || '',
      supporting_material_url: (session as any).supporting_material_url || '',
    })
    setPanelOpen(true)
  }

  const closePanel = () => {
    setPanelOpen(false)
    setEditingId(null)
    setFormData(emptyForm)
  }

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const buildPayload = () => ({
    session_name: formData.session_name,
    session_description: formData.session_description || null,
    session_tag: formData.session_tag || null,
    session_start_time: formData.session_start_time,
    session_end_time: formData.session_end_time || null,
    is_generic: formData.is_generic,
    department: formData.is_generic ? null : formData.department || null,
    is_dept_generic: formData.is_generic ? true : formData.is_dept_generic,
    team:
      formData.is_generic || formData.is_dept_generic
        ? null
        : formData.team || null,
    has_topics: formData.has_topics,
    session_location: formData.session_location || null,
    session_location_map_url: formData.session_location_map_url || null,
    session_venue_map_url: formData.session_venue_map_url || null,
    survey_url: formData.survey_url || null,
    supporting_material_url: formData.supporting_material_url || null,
  })

  const handleCreate = async () => {
    if (!formData.session_name) {
      toast.error('Session name is required')
      return
    }
    if (!formData.session_start_time) {
      toast.error('Start time is required')
      return
    }

    try {
      setSaving(true)
      await api.post('/admin/sessions', {
        event_id: Number(eventId),
        session_date: selectedDay,
        ...buildPayload(),
      })
      toast.success('Session created')
      closePanel()
      fetchSessions()
    } catch {
      toast.error('Failed to create session')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    if (!formData.session_name) {
      toast.error('Session name is required')
      return
    }

    try {
      setSaving(true)
      await api.put(`/admin/sessions/${editingId}`, buildPayload())
      toast.success('Session updated')
      closePanel()
      fetchSessions()
    } catch {
      toast.error('Failed to update session')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (sessionId: number) => {
    if (!confirm('Delete this session?')) return
    try {
      await api.delete(`/admin/sessions/${sessionId}`)
      toast.success('Session deleted')
      if (editingId === sessionId) closePanel()
      fetchSessions()
    } catch {
      toast.error('Failed to delete session')
    }
  }

  // Sessions sorted by start time
  const daySessions = [...sessions].sort((a, b) =>
    a.session_start_time.localeCompare(b.session_start_time)
  )

  return (
    <div className="pb-8">
      {/* Day Tabs */}
      <div className="flex gap-2 mb-6">
        {dayTabs.map((tab) => (
          <button
            key={tab.date}
            onClick={() => setSelectedDay(tab.date)}
            className={cn(
              'px-4 py-2 rounded-lg text-center transition-colors',
              selectedDay === tab.date
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-az-graphite hover:bg-gray-200'
            )}
          >
            <span className="block text-[11px] font-bold uppercase">
              {tab.label}
            </span>
            <span className="block text-xs">{tab.shortDate}</span>
          </button>
        ))}
      </div>

      {/* Session Cards */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {daySessions.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">
              No sessions for this day. Add one below.
            </p>
          )}

          {daySessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onEdit={() => openEditPanel(session)}
              onDelete={() => handleDelete(session.id)}
            />
          ))}
        </div>
      )}

      {/* Add Session Button */}
      <button
        type="button"
        onClick={openAddPanel}
        className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Session
      </button>

      {/* Slide-over Panel */}
      <SessionPanel
        isOpen={panelOpen}
        isEdit={!!editingId}
        formData={formData}
        tags={tags}
        departments={departments}
        teams={teams}
        saving={saving}
        onChange={handleFormChange}
        onBoolChange={(name, value) =>
          setFormData((prev) => ({ ...prev, [name]: value }))
        }
        onSave={editingId ? handleUpdate : handleCreate}
        onClose={closePanel}
      />
    </div>
  )
}

/* ─── Session Card ─── */

function SessionCard({
  session,
  onEdit,
  onDelete,
}: {
  session: SessionData
  onEdit: () => void
  onDelete: () => void
}) {
  const duration = calcDuration(
    session.session_start_time,
    session.session_end_time
  )

  return (
    <div className="group relative flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 pl-3 border-l-4 border-l-amber-400 transition-shadow hover:shadow-sm">
      {/* Drag handle */}
      <div className="flex-shrink-0 pt-1 text-gray-300 cursor-grab">
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Tag + Time row */}
        <div className="flex items-center gap-3 flex-wrap">
          {session.session_tag && (
            <span className="inline-block bg-az-graphite text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {session.session_tag}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatTime(session.session_start_time)}</span>
            {duration && (
              <>
                <span className="mx-0.5">·</span>
                <span>{duration}</span>
              </>
            )}
          </div>
        </div>

        {/* Session name */}
        <h4 className="mt-2 font-bold font-heading text-az-graphite leading-tight">
          {session.session_name}
        </h4>

        {/* Location */}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          {session.session_location ? (
            <span>{session.session_location}</span>
          ) : (
            <span className="italic">No location set</span>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline uppercase tracking-wide"
        >
          <Pencil className="h-3 w-3" />
          Click to edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/* ─── Slide-over Panel ─── */

function SessionPanel({
  isOpen,
  isEdit,
  formData,
  tags,
  departments,
  teams,
  saving,
  onChange,
  onBoolChange,
  onSave,
  onClose,
}: {
  isOpen: boolean
  isEdit: boolean
  formData: SessionFormData
  tags: SessionTag[]
  departments: Department[]
  teams: Team[]
  saving: boolean
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void
  onBoolChange: (name: string, value: boolean) => void
  onSave: () => void
  onClose: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold font-heading text-az-graphite">
              {isEdit ? 'Edit Session' : 'Add Session'}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit
                ? 'Update session details and schedule'
                : 'Create a new session for this day'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-az-graphite transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Session Title */}
          <div className="space-y-2">
            <Label htmlFor="panel_session_name">Session Title</Label>
            <Input
              id="panel_session_name"
              name="session_name"
              value={formData.session_name}
              onChange={onChange}
              placeholder="e.g. Opening Keynote"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="panel_session_description">Description</Label>
            <Textarea
              id="panel_session_description"
              name="session_description"
              value={formData.session_description}
              onChange={onChange}
              placeholder="Add details about this session..."
              rows={3}
            />
          </div>

          {/* Session Tag */}
          <div className="space-y-2">
            <Label htmlFor="panel_session_tag">Session Tag</Label>
            <Select
              id="panel_session_tag"
              name="session_tag"
              value={formData.session_tag}
              onChange={onChange}
            >
              <option value="">Select a session tag</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.name}>
                  {tag.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Start Time / End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="panel_session_start_time">Start Time</Label>
              <Input
                id="panel_session_start_time"
                name="session_start_time"
                type="time"
                value={formData.session_start_time}
                onChange={onChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="panel_session_end_time">End Time</Label>
              <Input
                id="panel_session_end_time"
                name="session_end_time"
                type="time"
                value={formData.session_end_time}
                onChange={onChange}
              />
            </div>
          </div>

          {/* Department & Team Assignment */}
          <div className="space-y-4">
            <h3 className="font-bold font-heading text-az-graphite text-sm border-t pt-5">
              Department & Team Assignment
            </h3>

            {/* Generic session */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Generic session (Visible to all departments)
              </p>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_generic_radio"
                    checked={formData.is_generic}
                    onChange={() => onBoolChange('is_generic', true)}
                    className="h-4 w-4 text-primary accent-primary"
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_generic_radio"
                    checked={!formData.is_generic}
                    onChange={() => onBoolChange('is_generic', false)}
                    className="h-4 w-4 text-primary accent-primary"
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>

            {/* Department & Team — shown when is_generic is false */}
            {!formData.is_generic && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="panel_department">Department</Label>
                  <Select
                    id="panel_department"
                    name="department"
                    value={formData.department}
                    onChange={onChange}
                  >
                    <option value="">Select a department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Visible to all teams in this department?
                  </p>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="is_dept_generic_radio"
                        checked={formData.is_dept_generic}
                        onChange={() =>
                          onBoolChange('is_dept_generic', true)
                        }
                        className="h-4 w-4 text-primary accent-primary"
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="is_dept_generic_radio"
                        checked={!formData.is_dept_generic}
                        onChange={() =>
                          onBoolChange('is_dept_generic', false)
                        }
                        className="h-4 w-4 text-primary accent-primary"
                      />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>

                {/* Team — shown when is_dept_generic is false */}
                {!formData.is_dept_generic && (
                  <div className="space-y-2">
                    <Label htmlFor="panel_team">Team</Label>
                    <Select
                      id="panel_team"
                      name="team"
                      value={formData.team}
                      onChange={onChange}
                    >
                      <option value="">Select a team</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Has Topics */}
          <div className="space-y-2">
            <h3 className="font-bold font-heading text-az-graphite text-sm">
              Has Topics
            </h3>
            <p className="text-sm text-muted-foreground">
              Does this session have multiple topics?
            </p>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="has_topics_radio"
                  checked={!formData.has_topics}
                  onChange={() => onBoolChange('has_topics', false)}
                  className="h-4 w-4 text-primary accent-primary"
                />
                <span className="text-sm">No</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="has_topics_radio"
                  checked={formData.has_topics}
                  onChange={() => onBoolChange('has_topics', true)}
                  className="h-4 w-4 text-primary accent-primary"
                />
                <span className="text-sm">Yes</span>
              </label>
            </div>
          </div>

          {/* Room / Location */}
          <div className="space-y-2">
            <Label htmlFor="panel_session_location">Room / Location</Label>
            <Input
              id="panel_session_location"
              name="session_location"
              value={formData.session_location}
              onChange={onChange}
              placeholder="e.g. Grand Ballroom A"
            />
          </div>

          {/* Session Location Map URL */}
          <div className="space-y-2">
            <Label htmlFor="panel_session_location_map_url">
              Session Location Map URL
            </Label>
            <Input
              id="panel_session_location_map_url"
              name="session_location_map_url"
              value={formData.session_location_map_url}
              onChange={onChange}
              placeholder="https://maps.google.com/..."
            />
          </div>

          {/* Session Venue Map URL */}
          <div className="space-y-2">
            <Label htmlFor="panel_session_venue_map_url">
              Session Venue Map URL
            </Label>
            <Input
              id="panel_session_venue_map_url"
              name="session_venue_map_url"
              value={formData.session_venue_map_url}
              onChange={onChange}
              placeholder="https://example.com/venue-map.pdf"
            />
          </div>

          {/* Survey URL */}
          <div className="space-y-2">
            <Label htmlFor="panel_survey_url">Survey URL</Label>
            <Input
              id="panel_survey_url"
              name="survey_url"
              value={formData.survey_url}
              onChange={onChange}
              placeholder="https://forms.example.com/survey"
            />
          </div>

          {/* Supporting Material URL */}
          <div className="space-y-2">
            <Label htmlFor="panel_supporting_material_url">
              Supporting Material URL
            </Label>
            <Input
              id="panel_supporting_material_url"
              name="supporting_material_url"
              value={formData.supporting_material_url}
              onChange={onChange}
              placeholder="https://example.com/materials.pdf"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
