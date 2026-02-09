import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wifi, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import api from '@/config/api'
import { toast } from 'sonner'

interface WifiNetwork {
  title: string
  desc: string
  wifi_name: string
  wifi_password: string
}

interface WifiSectionProps {
  eventId: string
  initialWifi: unknown[]
}

const emptyNetwork: WifiNetwork = {
  title: '',
  desc: '',
  wifi_name: '',
  wifi_password: '',
}

export function WifiSection({ eventId, initialWifi }: WifiSectionProps) {
  const [networks, setNetworks] = useState<WifiNetwork[]>([])
  const [saving, setSaving] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(
    new Set()
  )

  useEffect(() => {
    const parsed = (initialWifi || []) as WifiNetwork[]
    setNetworks(parsed.length > 0 ? parsed : [])
  }, [initialWifi])

  const addNetwork = () => {
    setNetworks((prev) => [...prev, { ...emptyNetwork }])
  }

  const removeNetwork = (index: number) => {
    setNetworks((prev) => prev.filter((_, i) => i !== index))
    setVisiblePasswords((prev) => {
      const next = new Set<number>()
      prev.forEach((i) => {
        if (i < index) next.add(i)
        else if (i > index) next.add(i - 1)
      })
      return next
    })
  }

  const updateNetwork = (
    index: number,
    field: keyof WifiNetwork,
    value: string
  ) => {
    setNetworks((prev) =>
      prev.map((n, i) => {
        if (i !== index) return n
        const updated = { ...n, [field]: value }
        if (field === 'wifi_name') {
          updated.title = value
        }
        return updated
      })
    )
  }

  const togglePasswordVisibility = (index: number) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleSave = async () => {
    const validNetworks = networks.filter(
      (n) => n.wifi_name.trim() && n.wifi_password.trim()
    )

    try {
      setSaving(true)
      await api.patch(`/admin/events/${eventId}/wifi`, {
        wifi: validNetworks.map((n) => ({
          title: n.title || n.wifi_name,
          desc: n.desc || '',
          wifi_name: n.wifi_name,
          wifi_password: n.wifi_password,
        })),
      })
      toast.success('WiFi configuration saved')
    } catch {
      toast.error('Failed to save WiFi configuration')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold font-heading text-az-graphite">
          WiFi Configuration
        </h3>
        <button
          type="button"
          onClick={addNetwork}
          className="flex items-center gap-1.5 text-sm font-medium text-az-graphite hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Network
        </button>
      </div>

      {/* Networks */}
      {networks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-12">
          <Wifi className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No WiFi networks configured yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {networks.map((network, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 space-y-4"
            >
              {/* Network Name + Delete */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`wifi_name_${index}`}>
                    Network Name (SSID)
                  </Label>
                  <button
                    type="button"
                    onClick={() => removeNetwork(index)}
                    className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Input
                  id={`wifi_name_${index}`}
                  value={network.wifi_name}
                  onChange={(e) =>
                    updateNetwork(index, 'wifi_name', e.target.value)
                  }
                  placeholder="e.g. Conference_Guest"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor={`wifi_password_${index}`}>Password</Label>
                <div className="relative">
                  <Input
                    id={`wifi_password_${index}`}
                    type={visiblePasswords.has(index) ? 'text' : 'password'}
                    value={network.wifi_password}
                    onChange={(e) =>
                      updateNetwork(index, 'wifi_password', e.target.value)
                    }
                    placeholder="Network password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(index)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-az-graphite transition-colors"
                  >
                    {visiblePasswords.has(index) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Usage / Description */}
              <div className="space-y-2">
                <Label htmlFor={`wifi_desc_${index}`}>
                  Usage / Description
                </Label>
                <Input
                  id={`wifi_desc_${index}`}
                  value={network.desc}
                  onChange={(e) =>
                    updateNetwork(index, 'desc', e.target.value)
                  }
                  placeholder="e.g. For general attendees"
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
