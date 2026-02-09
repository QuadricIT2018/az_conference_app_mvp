import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react'
import api from '@/config/api'
import { toast } from 'sonner'

interface SessionType {
  id: string
  name: string
}

export function SessionTypesPage() {
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([])
  const [loading, setLoading] = useState(true)

  // Inline form state
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '' })

  useEffect(() => {
    fetchSessionTypes()
  }, [])

  const fetchSessionTypes = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/session-types')
      setSessionTypes(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch session types:', error)
      toast.error('Failed to load session types')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSessionType = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData({ name: '' })
  }

  const handleEditSessionType = (type: SessionType) => {
    setEditingId(type.id)
    setIsAdding(false)
    setFormData({ name: type.name })
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ name: '' })
  }

  const handleDeleteSessionType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session type?')) return

    try {
      await api.delete(`/admin/session-types/${id}`)
      toast.success('Session type deleted successfully')
      fetchSessionTypes()
    } catch (error) {
      console.error('Failed to delete session type:', error)
      toast.error('Failed to delete session type')
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Session type name is required')
      return
    }

    try {
      if (editingId) {
        await api.put(`/admin/session-types/${editingId}`, formData)
        toast.success('Session type updated successfully')
      } else {
        await api.post('/admin/session-types', formData)
        toast.success('Session type created successfully')
      }
      handleCancel()
      fetchSessionTypes()
    } catch (error) {
      console.error('Failed to save session type:', error)
      toast.error('Failed to save session type')
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
        <h1 className="text-3xl font-bold font-heading text-white">Session Types</h1>
        <p className="text-white/80 mt-1">
          Manage session types for your events
        </p>
      </div>

      {/* Summary Card */}
      <div className="max-w-md -mt-12 px-4">
        <Card className="p-6 bg-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-az-mulberry/10 rounded-full">
              <Layers className="h-6 w-6 text-az-mulberry" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total session types</p>
              <p className="text-3xl font-bold font-heading">{sessionTypes.length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </Card>
      </div>

      {/* All Session Types Section */}
      <div className="flex justify-between items-center mt-8">
        <h2 className="text-xl font-semibold font-heading">All Session Types</h2>
        <Button onClick={handleAddSessionType} className="gap-2" disabled={isAdding || editingId !== null}>
          <Plus className="h-4 w-4" />
          Add Session Type
        </Button>
      </div>

      {/* Session Types List */}
      <div className="space-y-3">
        {/* Inline Add Form */}
        {isAdding && (
          <Card className="p-4 bg-white shadow-md">
            <div className="flex items-center gap-4">
              {/* Session Type Icon */}
              <div className="p-2 bg-az-mulberry/10 rounded-full">
                <Layers className="h-5 w-5 text-az-mulberry" />
              </div>

              {/* Input Field */}
              <div className="flex-1">
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="Enter session type name"
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

        {/* Session Types List */}
        {sessionTypes.length === 0 && !isAdding ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No session types found.</p>
            <Button onClick={handleAddSessionType} className="mt-4">
              Create your first session type
            </Button>
          </Card>
        ) : (
          sessionTypes.map(type => (
            <Card key={type.id} className="p-4 bg-white hover:shadow-md transition-shadow">
              {editingId === type.id ? (
                /* Inline Edit Form */
                <div className="flex items-center gap-4">
                  {/* Session Type Icon */}
                  <div className="p-2 bg-az-mulberry/10 rounded-full">
                    <Layers className="h-5 w-5 text-az-mulberry" />
                  </div>

                  {/* Input Field */}
                  <div className="flex-1">
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ name: e.target.value })}
                      placeholder="Enter session type name"
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
                  {/* Session Type Icon */}
                  <div className="p-2 bg-az-mulberry/10 rounded-full">
                    <Layers className="h-5 w-5 text-az-mulberry" />
                  </div>

                  {/* Session Type Name */}
                  <div className="flex-1">
                    <p className="font-semibold text-az-graphite">{type.name}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditSessionType(type)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      disabled={isAdding || editingId !== null}
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteSessionType(type.id)}
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
