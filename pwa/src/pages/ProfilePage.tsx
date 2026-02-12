import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useEventSlug } from '@/contexts/EventContext'
import api from '@/config/api'
import { cn } from '@/lib/utils'
import { User, Check, ChevronDown, ChevronUp } from 'lucide-react'

interface Department {
  id: number
  name: string
}

function parseDepartmentValue(val: string | null | undefined): string[] {
  if (!val) return []
  if (val.toUpperCase() === 'ALL') return ['ALL']
  return val.split(',').map(d => d.trim()).filter(Boolean)
}

function serializeDepartments(selected: string[]): string {
  if (selected.includes('ALL')) return 'ALL'
  return selected.join(',')
}

export function ProfilePage() {
  const { user } = useAuth()
  const { eventSlug } = useEventSlug()
  const queryClient = useQueryClient()
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: event } = useQuery({
    queryKey: ['event', eventSlug],
    queryFn: async () => {
      const res = await api.get(`/app/events/${eventSlug}`)
      return res.data.data
    },
    enabled: !!eventSlug,
  })

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/app/departments')
      return res.data.data || []
    },
  })

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/app/profile')
      return res.data.data
    },
  })

  useEffect(() => {
    if (profile?.department) {
      setSelectedDepts(parseDepartmentValue(profile.department))
    }
  }, [profile])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDept = (deptName: string) => {
    setSaveSuccess(false)

    if (deptName === 'ALL') {
      // Toggle ALL: if already selected, deselect; otherwise select ALL exclusively
      setSelectedDepts(prev =>
        prev.includes('ALL') ? [] : ['ALL']
      )
      return
    }

    // Toggling a specific department
    setSelectedDepts(prev => {
      // Remove ALL if it was selected
      const withoutAll = prev.filter(d => d !== 'ALL')

      if (withoutAll.includes(deptName)) {
        return withoutAll.filter(d => d !== deptName)
      } else {
        return [...withoutAll, deptName]
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const departmentValue = selectedDepts.length > 0
        ? serializeDepartments(selectedDepts)
        : null
      await api.patch('/app/profile', { department: departmentValue })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      // Update stored user
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const parsed = JSON.parse(storedUser)
        parsed.department = departmentValue
        localStorage.setItem('user', JSON.stringify(parsed))
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  const displayEmail = profile?.email || user?.email || ''
  const eventName = event?.pwa_name || event?.event_name || 'ONX 2026'

  // Filter out "ALL" from the departments list (we add it manually as a special option)
  const deptOptions = departments.filter(d => d.name.toUpperCase() !== 'ALL')

  return (
    <div>
      {/* Profile content */}
      <div className="flex flex-col items-center pt-10 px-4 pb-8">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-[#f0f2f1] border-4 border-white flex items-center justify-center shadow-sm">
          <User className="h-12 w-12 text-az-graphite/50" strokeWidth={1.5} />
        </div>

        {/* Name & Role */}
        <h1 className="mt-4 text-2xl font-bold font-heading text-black text-center">
          {displayEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
        </h1>
        <p className="text-black text-sm mt-0.5">
          {eventName} Attendee
        </p>

        {/* Department Card */}
        <div className="w-full max-w-2xl mt-10 bg-white rounded-2xl border border-black px-6 py-6">
          <label className="text-xs font-bold tracking-wider text-black uppercase">
            Departments
          </label>

          {/* Dropdown Multi-Select */}
          <div ref={dropdownRef} className="relative mt-2">
            {/* Dropdown trigger */}
            <button
              type="button"
              onClick={() => setDropdownOpen(prev => !prev)}
              className="w-full flex items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-left transition-colors hover:border-gray-400"
            >
              <span className={cn(
                'truncate uppercase tracking-wide font-medium',
                selectedDepts.length === 0 ? 'text-gray-400' : 'text-black'
              )}>
                {selectedDepts.length === 0
                  ? 'Select departments'
                  : selectedDepts.join(', ')}
              </span>
              {dropdownOpen
                ? <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0 ml-2" />
                : <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0 ml-2" />}
            </button>

            {/* Dropdown list */}
            {dropdownOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-64 overflow-y-auto">
                {/* ALL option */}
                <button
                  type="button"
                  onClick={() => toggleDept('ALL')}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="uppercase tracking-wide font-medium text-black">ALL</span>
                  {selectedDepts.includes('ALL') && (
                    <Check className="h-4 w-4 text-black flex-shrink-0" />
                  )}
                </button>

                {/* Individual department options */}
                {deptOptions.map((dept) => {
                  const isSelected = selectedDepts.includes(dept.name)
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => toggleDept(dept.name)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="uppercase tracking-wide font-medium text-black">{dept.name}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-black flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-5 w-full rounded-2xl bg-az-mulberry py-3.5 text-sm font-bold text-white transition-colors hover:bg-az-mulberry/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        {/* Email Card */}
        <div className="w-full max-w-2xl mt-4 bg-white rounded-2xl border border-black px-6 py-5">
          <label className="text-xs text-black">
            Email
          </label>
          <p className="mt-1 text-[12.5px] text-[#0066cc] font-normal tracking-wide">
            {displayEmail}
          </p>
        </div>

        {/* Logout */}
        {/* <button
          onClick={logout}
          className="mt-6 text-sm text-red-500 font-medium hover:text-red-600 transition-colors"
        >
          Sign Out
        </button> */}
      </div>
    </div>
  )
}
