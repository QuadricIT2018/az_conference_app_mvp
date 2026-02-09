import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Plus, Trash2, Upload, ExternalLink } from 'lucide-react'
import api from '@/config/api'
import { toast } from 'sonner'

interface VenueMap {
  title: string
  file_url: string
}

interface LocalVenueMap {
  title: string
  file_url: string
  pendingFile: File | null
}

interface VenueMapsSectionProps {
  eventId: string
  initialMaps: unknown[]
}

export function VenueMapsSection({
  eventId,
  initialMaps,
}: VenueMapsSectionProps) {
  const [maps, setMaps] = useState<LocalVenueMap[]>([])
  const [saving, setSaving] = useState(false)
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const parsed = (initialMaps || []) as VenueMap[]
    setMaps(
      parsed.map((m) => ({
        title: m.title || '',
        file_url: m.file_url || '',
        pendingFile: null,
      }))
    )
  }, [initialMaps])

  const addMap = () => {
    setMaps((prev) => [...prev, { title: '', file_url: '', pendingFile: null }])
  }

  const removeMap = (index: number) => {
    setMaps((prev) => prev.filter((_, i) => i !== index))
  }

  const updateTitle = (index: number, value: string) => {
    setMaps((prev) =>
      prev.map((m, i) => (i === index ? { ...m, title: value } : m))
    )
  }

  const handleFileSelect = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setMaps((prev) =>
      prev.map((m, i) => (i === index ? { ...m, pendingFile: file } : m))
    )
  }

  const triggerFileInput = (index: number) => {
    fileInputRefs.current[index]?.click()
  }

  const getFileName = (map: LocalVenueMap): string | null => {
    if (map.pendingFile) return map.pendingFile.name
    if (map.file_url) {
      const parts = map.file_url.split('/')
      return parts[parts.length - 1]
    }
    return null
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Upload any pending files first
      const uploadedMaps: VenueMap[] = []

      for (const map of maps) {
        let fileUrl = map.file_url

        if (map.pendingFile) {
          const formData = new FormData()
          formData.append('file', map.pendingFile)

          const uploadRes = await api.post('/admin/upload/venue-map', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          fileUrl = uploadRes.data.data.file_url
        }

        if (fileUrl) {
          uploadedMaps.push({
            title: map.title || 'Venue Map',
            file_url: fileUrl,
          })
        }
      }

      await api.patch(`/admin/events/${eventId}/venue-maps`, {
        venue_maps: uploadedMaps,
      })

      // Update local state with resolved URLs
      setMaps(
        uploadedMaps.map((m) => ({
          title: m.title,
          file_url: m.file_url,
          pendingFile: null,
        }))
      )

      toast.success('Venue maps saved')
    } catch {
      toast.error('Failed to save venue maps')
    } finally {
      setSaving(false)
    }
  }

  const getPdfViewUrl = (map: LocalVenueMap): string | null => {
    if (map.pendingFile) return URL.createObjectURL(map.pendingFile)
    if (map.file_url) {
      // If file_url starts with http, use directly; otherwise prepend backend origin
      if (map.file_url.startsWith('http')) return map.file_url
      const backendPort = '3001'
      const origin = window.location.origin.replace(/:\d+$/, `:${backendPort}`)
      return `${origin}${map.file_url}`
    }
    return null
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold font-heading text-az-graphite">Venue Maps</h3>
        <button
          type="button"
          onClick={addMap}
          className="flex items-center gap-1.5 text-sm font-medium text-az-graphite hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Map
        </button>
      </div>

      {/* Maps */}
      {maps.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-12">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No venue maps configured yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {maps.map((map, index) => {
            const fileName = getFileName(map)
            const hasFile = !!map.file_url || !!map.pendingFile
            const viewUrl = getPdfViewUrl(map)

            return (
              <div
                key={index}
                className="grid grid-cols-2 gap-0 rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Left — PDF Preview Area */}
                <div className="flex flex-col items-center justify-center bg-gray-50/80 p-8 min-h-[220px]">
                  <FileText
                    className={`h-12 w-12 mb-3 ${hasFile ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  {hasFile && viewUrl ? (
                    <a
                      href={viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      View PDF
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No PDF uploaded
                    </p>
                  )}
                </div>

                {/* Right — Form Fields */}
                <div className="p-5 space-y-4">
                  {/* Map Title + Delete */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`map_title_${index}`}>Map Title</Label>
                      <button
                        type="button"
                        onClick={() => removeMap(index)}
                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Input
                      id={`map_title_${index}`}
                      value={map.title}
                      onChange={(e) => updateTitle(index, e.target.value)}
                      placeholder="e.g. Ground Floor"
                    />
                  </div>

                  {/* PDF File */}
                  <div className="space-y-2">
                    <Label>PDF File</Label>
                    <input
                      ref={(el) => {
                        fileInputRefs.current[index] = el
                      }}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => handleFileSelect(index, e)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => triggerFileInput(index)}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {hasFile ? 'Replace PDF' : 'Upload PDF'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Upload a PDF file (max 10MB). The file will be uploaded
                      when you click &quot;Save Changes&quot;.
                    </p>
                    {fileName && (
                      <p className="text-xs text-primary break-all">
                        Current: {fileName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
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
