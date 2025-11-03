"use client"
import { useEffect, useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ArrowUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
// import { useWebSocket } from "@/components/providers/websocket-provider"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function DevicesListPage() {
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortField, setSortField] = useState<"name" | "is_online" | null>(null)
  const [sortDirection, setSortDirection] = useState<"+" | "-">("-")
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1)
  // const { lastMessage } = useWebSocket(); // Add this line

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true)
      setError("")
      try {
        let endpoint = "";
        if (searchTerm.trim() !== "" || statusFilter !== "all" || sortField || startDate || endDate) {
          const params = new URLSearchParams({
            page: "1",
            page_size: "100",
          });
          if (searchTerm.trim() !== "") {
            params.append("search", searchTerm);
          }
          if (statusFilter !== "all") {
            params.append("is_online", statusFilter === "active" ? "true" : "false");
          }
          if (startDate) {
            params.append("created_at__gte", startDate);
          }
          if (endDate) {
            // Add one day to end date to include the entire end date
            const endDateObj = new Date(endDate);
            endDateObj.setDate(endDateObj.getDate() + 1);
            params.append("created_at__lt", endDateObj.toISOString().split('T')[0]);
          }
          if (sortField) {
            params.append("ordering", `${sortDirection}${sortField}`);
          }
          const query = params.toString().replace(/ordering=%2B/g, "ordering=+");
          endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/stats/devices/?${query}`;
        } else {
          const params = new URLSearchParams({
            page: "1",
            page_size: "100",
          });
          endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/stats/devices/?${params.toString()}`;
        }
        // Test error handling - uncomment to test
        // throw new Error('{"detail":"Method \"GET\" not allowed."}')
        
        const data = await apiFetch(endpoint)
        console.log('Devices API response:', data)
        setDevices(Array.isArray(data) ? data : data.results || [])
        // GET requests don't show success toasts automatically
      } catch (err: any) {
        console.log('Devices fetch error caught:', err)
        const errorMessage = extractErrorMessages(err) || t("devices.failedToLoad")
        console.log('Extracted error message:', errorMessage)
        setError(errorMessage)
        setDevices([])
        toast({
          title: t("devices.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
        console.error('Devices fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDevices()
  }, [searchTerm, statusFilter, startDate, endDate, sortField, sortDirection])

  // Listen for device_status_update WebSocket messages - COMMENTED OUT
  // useEffect(() => {
  //   if (!lastMessage) return;
  //   try {
  //     const data = typeof lastMessage.data === "string" ? JSON.parse(lastMessage.data) : lastMessage.data;
  //     if (data.type === "device_status_update" && data.device_id) {
  //       setDevices((prev) =>
  //         prev.map((device) =>
  //           device.device_id === data.device_id
  //             ? { ...device, ...data.data }
  //             : device
  //         )
  //       );
  //       toast({
  //         title: t("devices.liveUpdate"),
  //         description: `${t("devices.deviceId")} ${data.device_id} ${t("devices.statusUpdated")}`,
  //       });
  //     }
  //   } catch (err) {
  //     // Optionally log or handle parse errors
  //   }
  // }, [lastMessage, t, toast]);

  // Remove client-side filtering since it's now handled by the API
  const filteredDevices = devices

  const handleSort = (field: "name" | "is_online") => {
    if (sortField === field) {
      setSortDirection(prev => prev === "+" ? "-" : "+")
      setSortField(field)
    } else {
      setSortField(field)
      setSortDirection("-")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("devices.list")}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t("common.search")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t("devices.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="active">{t("common.active")}</SelectItem>
              <SelectItem value="inactive">{t("common.inactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Date Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 flex-1">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("devices.startDate") || "Start Date"}
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full lg:w-48"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("devices.endDate") || "End Date"}
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full lg:w-48"
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setStartDate("")
                setEndDate("")
                setCurrentPage(1)
              }}
              className="h-10"
            >
              {t("devices.clearDates") || "Clear Dates"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">{t("common.loading")}</div>
        ) : error ? (
          <ErrorDisplay
            error={error}
            onRetry={() => {
              setError("")
              // This will trigger the useEffect to refetch
            }}
            variant="inline"
            className="mb-6"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("devices.deviceId")}</TableHead>
                <TableHead>
                  <Button type="button" variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0 font-semibold">
                    {t("devices.name")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button type="button" variant="ghost" onClick={() => handleSort("is_online")} className="h-auto p-0 font-semibold">
                    {t("devices.status")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Network</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Total Txns</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>{t("devices.lastSync")}</TableHead>
                <TableHead>{t("devices.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device: any) => (
                <TableRow key={device.device_id || device.uid || device.id}>
                  <TableCell>{device.device_id || device.uid}</TableCell>
                  <TableCell>{device.device_name || device.name || '-'}</TableCell>
                  <TableCell>{device.is_online ? 'Online' : 'Offline'}</TableCell>
                  <TableCell>{device.network_name || '-'}</TableCell>
                  <TableCell>{device.user_name || '-'}</TableCell>
                  <TableCell>{typeof device.total_transactions === 'number' ? device.total_transactions : (device.total_transactions ?? 0)}</TableCell>
                  <TableCell>{device.success_rate !== undefined && device.success_rate !== null ? `${device.success_rate}%` : '0.00%'}</TableCell>
                  <TableCell>{device.last_seen ? new Date(device.last_seen).toLocaleString() : '-'}</TableCell>
                  <TableCell>
                    {/* TODO: Add device actions like edit, delete, etc. */}
                    <span className="text-gray-500">{t("devices.noActionsAvailable")}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}