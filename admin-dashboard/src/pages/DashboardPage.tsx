import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, Mic2, Building2 } from 'lucide-react'
import api from '@/config/api'

export function DashboardPage() {
  const { data: events } = useQuery({
    queryKey: ['events-count'],
    queryFn: async () => {
      const res = await api.get('/admin/events?limit=1')
      return res.data.pagination?.total || 0
    },
  })

  const { data: speakers } = useQuery({
    queryKey: ['speakers-count'],
    queryFn: async () => {
      const res = await api.get('/admin/speakers?limit=1')
      return res.data.pagination?.total || 0
    },
  })

  const { data: attendees } = useQuery({
    queryKey: ['attendees-count'],
    queryFn: async () => {
      const res = await api.get('/admin/attendees?limit=1')
      return res.data.pagination?.total || 0
    },
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/admin/departments')
      return res.data.data?.length || 0
    },
  })

  const stats = [
    { name: 'Total Events', value: events ?? '-', icon: Calendar, color: 'bg-az-mulberry' },
    { name: 'Speakers', value: speakers ?? '-', icon: Mic2, color: 'bg-az-gold' },
    { name: 'Attendees', value: attendees ?? '-', icon: Users, color: 'bg-blue-500' },
    { name: 'Departments', value: departments ?? '-', icon: Building2, color: 'bg-green-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the Conference Management System</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <div className={`rounded-full p-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-heading">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity to display.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <a
              href="/events/new"
              className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted transition-colors"
            >
              <Calendar className="h-5 w-5 text-az-mulberry" />
              <span>Create New Event</span>
            </a>
            <a
              href="/speakers/new"
              className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted transition-colors"
            >
              <Mic2 className="h-5 w-5 text-az-gold" />
              <span>Add New Speaker</span>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
