import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Building2,
  Users2,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  Check,
  X,
} from 'lucide-react'
import api from '@/config/api'
import { toast } from 'sonner'

interface Team {
  id: string
  name: string
  description?: string
  department_id: string
}

interface Department {
  id: string
  name: string
  description?: string
  teams?: Team[]
  team_count?: number
}

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())

  // Inline form state
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '' })
  const [formTeams, setFormTeams] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [deptResponse, teamResponse] = await Promise.all([
        api.get('/admin/departments'),
        api.get('/admin/teams'),
      ])

      const depts = deptResponse.data.data || []
      const allTeams = teamResponse.data.data || []

      const deptsWithTeams = depts.map((dept: Department) => ({
        ...dept,
        team_count: allTeams.filter((t: Team) => t.department_id === dept.id).length,
        teams: allTeams.filter((t: Team) => t.department_id === dept.id),
      }))

      setDepartments(deptsWithTeams)
      setTeams(allTeams)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (deptId: string) => {
    setExpandedDepts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(deptId)) {
        newSet.delete(deptId)
      } else {
        newSet.add(deptId)
      }
      return newSet
    })
  }

  const handleAddDepartment = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData({ name: '' })
    setFormTeams([])
  }

  const handleEditDepartment = (dept: Department) => {
    setEditingId(dept.id)
    setIsAdding(false)
    setFormData({ name: dept.name })
    setFormTeams(dept.teams?.map(t => t.name) || [])
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ name: '' })
    setFormTeams([])
  }

  const handleAddTeamField = () => {
    setFormTeams(prev => [...prev, ''])
  }

  const handleRemoveTeamField = (index: number) => {
    setFormTeams(prev => prev.filter((_, i) => i !== index))
  }

  const handleTeamNameChange = (index: number, value: string) => {
    setFormTeams(prev => prev.map((t, i) => (i === index ? value : t)))
  }

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return

    try {
      await api.delete(`/admin/departments/${id}`)
      toast.success('Department deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Failed to delete department:', error)
      toast.error('Failed to delete department')
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Department name is required')
      return
    }

    try {
      if (editingId) {
        await api.put(`/admin/departments/${editingId}`, {
          name: formData.name,
          teams: formTeams.filter(t => t.trim()),
        })
        toast.success('Department updated successfully')
      } else {
        await api.post('/admin/departments', {
          name: formData.name,
          teams: formTeams.filter(t => t.trim()),
        })
        toast.success('Department created successfully')
      }
      handleCancel()
      fetchData()
    } catch (error) {
      console.error('Failed to save department:', error)
      toast.error('Failed to save department')
    }
  }

  const totalTeams = teams.length

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-az-mulberry border-t-transparent" />
      </div>
    )
  }

  const InlineForm = () => (
    <Card className="p-6 bg-white shadow-md">
      {/* Department Name Input */}
      <Input
        value={formData.name}
        onChange={(e) => setFormData({ name: e.target.value })}
        placeholder="Enter department name"
        className="border-gray-200 mb-4"
        autoFocus
      />

      {/* Teams Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users2 className="h-4 w-4" />
            <span className="font-medium">Teams</span>
          </div>
          <button
            onClick={handleAddTeamField}
            className="flex items-center gap-1 text-sm text-az-mulberry hover:text-az-mulberry/80 font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Team
          </button>
        </div>

        {formTeams.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No teams added yet</p>
        ) : (
          <div className="space-y-2">
            {formTeams.map((teamName, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={teamName}
                  onChange={(e) => handleTeamNameChange(index, e.target.value)}
                  placeholder="Team name"
                  className="flex-1 border-gray-200"
                  autoFocus={index === formTeams.length - 1}
                />
                <button
                  onClick={() => handleRemoveTeamField(index)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        )}
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
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-az-mulberry rounded-2xl p-8 pb-16">
        <h1 className="text-3xl font-bold font-heading text-white">Departments</h1>
        <p className="text-white/80 mt-1">
          Manage departments and teams for your events
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 -mt-12 px-4">
        <Card className="p-6 bg-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-az-mulberry/10 rounded-full">
              <Building2 className="h-6 w-6 text-az-mulberry" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total departments</p>
              <p className="text-3xl font-bold font-heading">{departments.length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gray-100 rounded-full">
              <Users2 className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total teams</p>
              <p className="text-3xl font-bold font-heading">{totalTeams}</p>
              <p className="text-sm text-muted-foreground">Across all departments</p>
            </div>
          </div>
        </Card>
      </div>

      {/* All Departments Section */}
      <div className="flex justify-between items-center mt-8">
        <h2 className="text-xl font-semibold font-heading">All Departments</h2>
        <Button onClick={handleAddDepartment} className="gap-2" disabled={isAdding || editingId !== null}>
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Departments List */}
      <div className="space-y-3">
        {/* Inline Add Form */}
        {isAdding && <InlineForm />}

        {departments.length === 0 && !isAdding ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No departments found.</p>
            <Button onClick={handleAddDepartment} className="mt-4">
              Create your first department
            </Button>
          </Card>
        ) : (
          departments.map(dept => (
            <div key={dept.id}>
              {editingId === dept.id ? (
                /* Inline Edit Form */
                <InlineForm />
              ) : (
                <Card className="p-4 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    {/* Expand Arrow */}
                    {(dept.team_count ?? 0) > 0 ? (
                      <button
                        onClick={() => toggleExpand(dept.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {expandedDepts.has(dept.id) ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    ) : (
                      <div className="w-7" />
                    )}

                    {/* Department Icon */}
                    <div className="p-2 bg-az-mulberry/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-az-mulberry" />
                    </div>

                    {/* Department Info */}
                    <div className="flex-1">
                      <p className="font-semibold text-az-graphite">{dept.name}</p>
                      {(dept.team_count ?? 0) > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users2 className="h-3.5 w-3.5" />
                          <span>{dept.team_count} teams</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditDepartment(dept)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isAdding || editingId !== null}
                      >
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={isAdding || editingId !== null}
                      >
                        <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Expanded Teams */}
              {expandedDepts.has(dept.id) && dept.teams && dept.teams.length > 0 && editingId !== dept.id && (
                <div className="ml-12 mt-2 space-y-2">
                  {dept.teams.map(team => (
                    <Card key={team.id} className="p-3 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Users2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{team.name}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
