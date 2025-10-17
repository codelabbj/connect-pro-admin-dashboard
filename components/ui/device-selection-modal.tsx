"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Check } from "lucide-react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

interface Device {
  device_id?: string
  uid?: string
  device_name?: string
  name?: string
  is_online?: boolean
  network_name?: string
  user_name?: string
  total_transactions?: number
  success_rate?: number
  last_seen?: string
}

interface DeviceSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (device: Device) => void
  selectedDeviceUid?: string
}

export function DeviceSelectionModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedDeviceUid 
}: DeviceSelectionModalProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])

  const apiFetch = useApi()
  const { t } = useLanguage()

  useEffect(() => {
    if (isOpen) {
      fetchDevices()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDevices(devices)
    } else {
      const filtered = devices.filter(device => {
        const deviceId = device.device_id || device.uid || ""
        const deviceName = device.device_name || device.name || ""
        return deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
               device.network_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               device.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
      })
      setFilteredDevices(filtered)
    }
  }, [searchTerm, devices])

  const fetchDevices = async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({
        page: "1",
        page_size: "100",
      })
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/stats/devices/?${params.toString()}`
      const data = await apiFetch(endpoint)
      
      // Handle both paginated and non-paginated responses
      const devicesData = data.results || data
      setDevices(Array.isArray(devicesData) ? devicesData : [])
    } catch (err: any) {
      console.error('Devices fetch error:', err)
      const errorMessage = extractErrorMessages(err) || "Failed to load devices"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (device: Device) => {
    onSelect(device)
    // Don't close automatically - let user complete the form
  }

  const formatDeviceDisplay = (device: Device) => {
    const deviceName = device.device_name || device.name
    if (deviceName) {
      return deviceName
    }
    const deviceId = device.device_id || device.uid
    return `Device ${deviceId?.slice(0, 8)}...`
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[80vh] w-[95vw] sm:w-full mx-4">
        <DialogHeader>
          <DialogTitle>{t("deviceAuthorizations.selectDevice") || "Select Device"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t("common.search") || "Search devices..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Error Display */}
          {error && (
            <ErrorDisplay
              error={error}
              onRetry={fetchDevices}
              variant="inline"
              className="mb-4"
            />
          )}

          {/* Devices List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                {t("common.loading") || "Loading devices..."}
              </div>
            ) : filteredDevices.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchTerm ? "No devices found matching your search." : "No devices available."}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDevices.map((device) => (
                  <div
                    key={device.uid}
                    className={`p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      selectedDeviceUid === device.uid ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => handleSelect(device)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{formatDeviceDisplay(device)}</div>
                        {device.network_name && (
                          <div className="text-sm text-gray-500 truncate">Network: {device.network_name}</div>
                        )}
                        {device.user_name && (
                          <div className="text-sm text-gray-500 truncate">User: {device.user_name}</div>
                        )}
                        <div className="text-sm text-gray-500">
                          Status: {device.is_online ? 'Online' : 'Offline'}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-1 truncate">
                          UID: {device.uid}
                        </div>
                      </div>
                      {selectedDeviceUid === device.uid && (
                        <Check className="h-5 w-5 text-blue-500 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button onClick={onClose} className="w-full sm:w-auto">
              {t("common.done") || "Done"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
