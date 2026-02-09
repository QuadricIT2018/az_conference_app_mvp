import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Link2, Plus, Trash2 } from 'lucide-react'
import api from '@/config/api'
import { toast } from 'sonner'

interface QuickLink {
  title: string
  url: string
}

interface QuickLinksSectionProps {
  eventId: string
  initialLinks: unknown[]
}

export function QuickLinksSection({
  eventId,
  initialLinks,
}: QuickLinksSectionProps) {
  const [links, setLinks] = useState<QuickLink[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const parsed = (initialLinks || []) as QuickLink[]
    setLinks(
      parsed.map((l) => ({
        title: l.title || '',
        url: l.url || '',
      }))
    )
  }, [initialLinks])

  const addLink = () => {
    setLinks((prev) => [...prev, { title: '', url: '' }])
  }

  const removeLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  const updateField = (
    index: number,
    field: keyof QuickLink,
    value: string
  ) => {
    setLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const payload = links
        .filter((l) => l.title.trim() || l.url.trim())
        .map((l) => ({
          title: l.title || 'Untitled Link',
          url: l.url,
        }))

      await api.patch(`/admin/events/${eventId}/quick-links`, {
        quick_links: payload,
      })

      toast.success('Quick links saved')
    } catch {
      toast.error('Failed to save quick links')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold font-heading text-az-graphite">
          Quick Links
        </h3>
        <button
          type="button"
          onClick={addLink}
          className="flex items-center gap-1.5 text-sm font-medium text-az-graphite hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Link
        </button>
      </div>

      {/* Links */}
      {links.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-12">
          <Link2 className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No quick links added yet.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Add links to important resources like agenda, venue map, or live
            stream.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {links.map((link, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 p-5 space-y-4"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Link {index + 1}</Badge>
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={link.title}
                  onChange={(e) => updateField(index, 'title', e.target.value)}
                  placeholder="e.g. Event Agenda"
                />
              </div>

              {/* URL */}
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={link.url}
                  onChange={(e) => updateField(index, 'url', e.target.value)}
                  placeholder="https://example.com/agenda"
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
