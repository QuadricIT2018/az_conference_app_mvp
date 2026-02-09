import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react'
import api from '@/config/api'
import { toast } from 'sonner'

interface SessionTag {
  id: string
  name: string
  color: string
}

export function SessionTagsPage() {
  const [tags, setTags] = useState<SessionTag[]>([])
  const [loading, setLoading] = useState(true)

  // Inline form state
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', color: '#8C0F61' })

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/tags')
      setTags(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch tags:', error)
      toast.error('Failed to load session tags')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData({ name: '', color: '#8C0F61' })
  }

  const handleEditTag = (tag: SessionTag) => {
    setEditingId(tag.id)
    setIsAdding(false)
    setFormData({ name: tag.name, color: tag.color || '#8C0F61' })
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ name: '', color: '#8C0F61' })
  }

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session tag?')) return

    try {
      await api.delete(`/admin/tags/${id}`)
      toast.success('Session tag deleted successfully')
      fetchTags()
    } catch (error) {
      console.error('Failed to delete tag:', error)
      toast.error('Failed to delete session tag')
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Tag name is required')
      return
    }

    try {
      if (editingId) {
        await api.put(`/admin/tags/${editingId}`, formData)
        toast.success('Session tag updated successfully')
      } else {
        await api.post('/admin/tags', formData)
        toast.success('Session tag created successfully')
      }
      handleCancel()
      fetchTags()
    } catch (error) {
      console.error('Failed to save tag:', error)
      toast.error('Failed to save session tag')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-az-mulberry border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-az-mulberry rounded-2xl p-8 pb-16">
        <h1 className="text-3xl font-bold font-heading text-white">Session Tags</h1>
        <p className="text-white/80 mt-1">
          Manage session categories for your events
        </p>
      </div>

      {/* Summary Card */}
      <div className="max-w-md -mt-12 px-4">
        <Card className="p-6 bg-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-az-mulberry/10 rounded-full">
              <Tag className="h-6 w-6 text-az-mulberry" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total session tags</p>
              <p className="text-3xl font-bold font-heading">{tags.length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </Card>
      </div>

      {/* All Session Tags Section */}
      <div className="flex justify-between items-center mt-8">
        <h2 className="text-xl font-semibold font-heading">All Session Tags</h2>
        <Button onClick={handleAddTag} className="gap-2" disabled={isAdding}>
          <Plus className="h-4 w-4" />
          Add Session Tag
        </Button>
      </div>

      {/* Session Tags List */}
      <div className="space-y-3">
        {/* Inline Add Form */}
        {isAdding && (
          <Card className="p-4 bg-white shadow-md">
            <div className="flex items-center gap-4">
              {/* Color Picker */}
              <div className="relative">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-10 h-10 rounded-full cursor-pointer border-0 p-0 overflow-hidden"
                  style={{
                    backgroundColor: formData.color,
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ backgroundColor: formData.color }}
                />
              </div>

              {/* Input Field */}
              <div className="flex-1">
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter session tag name"
                  className="border-gray-200"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') handleCancel()
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button onClick={handleSave} size="sm" className="gap-1.5">
                  <Check className="h-4 w-4" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm" className="gap-1.5">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Tags List */}
        {tags.length === 0 && !isAdding ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No session tags found.</p>
            <Button onClick={handleAddTag} className="mt-4">
              Create your first session tag
            </Button>
          </Card>
        ) : (
          tags.map(tag => (
            <Card key={tag.id} className="p-4 bg-white hover:shadow-md transition-shadow">
              {editingId === tag.id ? (
                /* Inline Edit Form */
                <div className="flex items-center gap-4">
                  {/* Color Picker */}
                  <div className="relative">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-10 h-10 rounded-full cursor-pointer border-0 p-0 overflow-hidden"
                      style={{
                        backgroundColor: formData.color,
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
                    />
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{ backgroundColor: formData.color }}
                    />
                  </div>

                  {/* Input Field */}
                  <div className="flex-1">
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter session tag name"
                      className="border-gray-200"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave()
                        if (e.key === 'Escape') handleCancel()
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button onClick={handleSave} size="sm" className="gap-1.5">
                      <Check className="h-4 w-4" />
                      Save
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm" className="gap-1.5">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* Display Mode */
                <div className="flex items-center gap-4">
                  {/* Tag Icon */}
                  <div
                    className="p-2 rounded-full"
                    style={{ backgroundColor: `${tag.color || '#8C0F61'}20` }}
                  >
                    <Tag
                      className="h-5 w-5"
                      style={{ color: tag.color || '#8C0F61' }}
                    />
                  </div>

                  {/* Tag Name */}
                  <div className="flex-1">
                    <p className="font-semibold text-az-graphite">{tag.name}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditTag(tag)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      disabled={isAdding || editingId !== null}
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={isAdding || editingId !== null}
                    >
                      <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
