import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Megaphone, Plus, Trash2, Link2 } from 'lucide-react'
import api from '@/config/api'
import { toast } from 'sonner'

interface UpdateData {
  id?: number
  title: string
  description: string
  links: string[]
  update_date_time: string
  created_at?: string
}

interface ImportantUpdatesSectionProps {
  eventId: string
}

export function ImportantUpdatesSection({
  eventId,
}: ImportantUpdatesSectionProps) {
  const [updates, setUpdates] = useState<UpdateData[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUpdates()
  }, [eventId])

  const fetchUpdates = async () => {
    try {
      const res = await api.get(`/admin/updates/event/${eventId}`)
      const data = (res.data.data || []).map((u: UpdateData) => ({
        id: u.id,
        title: u.title || '',
        description: u.description || '',
        links: u.links || [],
        update_date_time: u.update_date_time
          ? new Date(u.update_date_time).toISOString().slice(0, 16)
          : '',
        created_at: u.created_at,
      }))
      setUpdates(data)
    } catch {
      /* ignore */
    }
  }

  const addUpdate = () => {
    const now = new Date()
    setUpdates((prev) => [
      {
        title: '',
        description: '',
        links: [],
        update_date_time: now.toISOString().slice(0, 16),
        created_at: now.toISOString(),
      },
      ...prev,
    ])
  }

  const removeUpdate = async (index: number) => {
    const update = updates[index]
    if (update.id) {
      try {
        await api.delete(`/admin/updates/${update.id}`)
        toast.success('Update deleted')
      } catch {
        toast.error('Failed to delete update')
        return
      }
    }
    setUpdates((prev) => prev.filter((_, i) => i !== index))
  }

  const updateField = (
    index: number,
    field: keyof UpdateData,
    value: string | string[]
  ) => {
    setUpdates((prev) =>
      prev.map((u, i) => (i === index ? { ...u, [field]: value } : u))
    )
  }

  const addLink = (index: number) => {
    setUpdates((prev) =>
      prev.map((u, i) =>
        i === index ? { ...u, links: [...u.links, ''] } : u
      )
    )
  }

  const updateLink = (updateIndex: number, linkIndex: number, value: string) => {
    setUpdates((prev) =>
      prev.map((u, i) =>
        i === updateIndex
          ? {
              ...u,
              links: u.links.map((l, li) => (li === linkIndex ? value : l)),
            }
          : u
      )
    )
  }

  const removeLink = (updateIndex: number, linkIndex: number) => {
    setUpdates((prev) =>
      prev.map((u, i) =>
        i === updateIndex
          ? { ...u, links: u.links.filter((_, li) => li !== linkIndex) }
          : u
      )
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      for (const update of updates) {
        const payload = {
          title: update.title || 'Untitled Update',
          description: update.description || null,
          links: update.links.filter((l) => l.trim() !== ''),
          update_date_time: update.update_date_time,
        }

        if (update.id) {
          await api.put(`/admin/updates/${update.id}`, payload)
        } else {
          await api.post(`/admin/updates/event/${eventId}`, payload)
        }
      }

      toast.success('Updates saved')
      fetchUpdates()
    } catch {
      toast.error('Failed to save updates')
    } finally {
      setSaving(false)
    }
  }

  const formatPostedDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString()
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold font-heading text-az-graphite">
          Important Updates
        </h3>
        <button
          type="button"
          onClick={addUpdate}
          className="flex items-center gap-1.5 text-sm font-medium text-az-graphite hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          Post Update
        </button>
      </div>

      {/* Updates */}
      {updates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-12">
          <Megaphone className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No updates posted yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update, index) => (
            <div
              key={update.id ?? `new-${index}`}
              className="rounded-xl border border-gray-200 p-5 space-y-4"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Megaphone className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Posted on {formatPostedDate(update.created_at)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeUpdate(index)}
                  className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={update.title}
                  onChange={(e) => updateField(index, 'title', e.target.value)}
                  placeholder="Update title..."
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={update.description}
                  onChange={(e) =>
                    updateField(index, 'description', e.target.value)
                  }
                  placeholder="Type your announcement details here..."
                  rows={3}
                />
              </div>

              {/* Links */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Links</Label>
                  <button
                    type="button"
                    onClick={() => addLink(index)}
                    className="flex items-center gap-1 text-xs font-medium text-az-graphite hover:text-primary transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Add Link
                  </button>
                </div>
                {update.links.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No links added
                  </p>
                ) : (
                  <div className="space-y-2">
                    {update.links.map((link, linkIndex) => (
                      <div key={linkIndex} className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <Input
                          value={link}
                          onChange={(e) =>
                            updateLink(index, linkIndex, e.target.value)
                          }
                          placeholder="https://..."
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeLink(index, linkIndex)}
                          className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Update Date & Time */}
              <div className="space-y-2">
                <Label>Update Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={update.update_date_time}
                  onChange={(e) =>
                    updateField(index, 'update_date_time', e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t mt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
