"use client"
import { useEffect, useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import Link from "next/link"
import { Search, ArrowUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"


const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function NetworkConfigListPage() {
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [networkFilter, setNetworkFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [networks, setNetworks] = useState<any[]>([])
  const [sortField, setSortField] = useState<"network_name" | "created_at" | null>(null)
  const [sortDirection, setSortDirection] = useState<"+" | "-">("-")
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchNetworkConfigs = async () => {
      setLoading(true)
      setError("")
      try {
        let endpoint = "";
        if (searchTerm.trim() !== "" || statusFilter !== "all" || networkFilter !== "all" || sortField || startDate || endDate) {
          const params = new URLSearchParams({
            page: "1",
            page_size: "100",
          });
          if (searchTerm.trim() !== "") {
            params.append("search", searchTerm);
          }
          if (statusFilter !== "all") {
            params.append("is_active", statusFilter === "active" ? "true" : "false");
          }
          if (networkFilter !== "all") {
            params.append("network", networkFilter);
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
            params.append("ordering", `${sortDirection === "+" ? "+" : "-"}${sortField}`);
          }
          // Keep '+' literal for ordering (avoid %2B)
          const query = params.toString().replace(/ordering=%2B/g, "ordering=+");
          endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/network-configs/?${query}`;
        } else {
          const params = new URLSearchParams({
            page: "1",
            page_size: "100",
          });
          endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/network-configs/?${params.toString()}`;
        }
        const data = await apiFetch(endpoint)
        setConfigs(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("networkConfig.success"),
          description: t("networkConfig.loadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("networkConfig.failedToLoad")
        setError(errorMessage)
        setConfigs([])
        toast({
          title: t("networkConfig.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
        console.error('Network config fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchNetworkConfigs()
  }, [searchTerm, statusFilter, networkFilter, startDate, endDate, sortField, sortDirection])

  // Fetch networks for filter
  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/networks/`)
        setNetworks(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("networkConfig.networksLoaded"),
          description: t("networkConfig.networksLoadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("networkConfig.failedToLoadNetworks")
        console.error('Networks fetch error:', err)
        setNetworks([])
        toast({
          title: t("networkConfig.networksFailedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
    fetchNetworks()
  }, [])

  // Remove client-side filtering since it's now handled by the API
  const filteredConfigs = configs

  const handleSort = (field: "network_name" | "created_at") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "+" ? "-" : "+"))
      setSortField(field)
    } else {
      setSortField(field)
      setSortDirection("-")
    }
  }

  const formatUssdCommands = (commands: any) => {
    if (!commands) return '-'
    return Object.entries(commands)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')
  }

  const formatSmsKeywords = (keywords: any) => {
    if (!keywords) return '-'
    return Object.entries(keywords)
      .map(([key, values]) => `${key}: ${Array.isArray(values) ? values.join(', ') : values}`)
      .join('; ')
  }

  const formatErrorKeywords = (keywords: string[]) => {
    if (!keywords || !Array.isArray(keywords)) return '-'
    return keywords.join(', ')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("networkConfig.list")}</CardTitle>
        <Link href="/dashboard/network-config/create">
          <Button className="mt-2">{t("networkConfig.add")}</Button>
        </Link>
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
              <SelectValue placeholder={t("networkConfig.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="active">{t("networkConfig.active")}</SelectItem>
              <SelectItem value="inactive">{t("networkConfig.inactive")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={networkFilter} onValueChange={setNetworkFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t("networkConfig.network")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {networks.map((network: any) => (
                <SelectItem key={network.uid} value={network.uid}>
                  {network.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Date Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 flex-1">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("networkConfig.startDate") || "Start Date"}
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
                {t("networkConfig.endDate") || "End Date"}
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
              {t("networkConfig.clearDates") || "Clear Dates"}
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
                <TableHead>
                  <Button type="button" variant="ghost" onClick={() => handleSort("network_name")} className="h-auto p-0 font-semibold">
                    {t("networkConfig.networkName")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>{t("networkConfig.status")}</TableHead>
                <TableHead>{t("networkConfig.ussdCommands")}</TableHead>
                <TableHead>{t("networkConfig.smsKeywords")}</TableHead>
                <TableHead>{t("networkConfig.errorKeywords")}</TableHead>
                <TableHead>{t("networkConfig.settings")}</TableHead>
                <TableHead>{t("networkConfig.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConfigs.map((config: any) => (
                <TableRow key={config.uid}>
                  <TableCell className="font-medium">{config.network_name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={config.is_active ? "default" : "secondary"}>
                      {config.is_active ? t("networkConfig.active") : t("networkConfig.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-xs text-gray-600 truncate" title={formatUssdCommands(config.ussd_commands)}>
                      {formatUssdCommands(config.ussd_commands)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-xs text-gray-600 truncate" title={formatSmsKeywords(config.sms_keywords)}>
                      {formatSmsKeywords(config.sms_keywords)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-xs text-gray-600 truncate" title={formatErrorKeywords(config.error_keywords)}>
                      {formatErrorKeywords(config.error_keywords)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-xs text-gray-600">
                      {config.custom_settings ? (
                        <div>
                          <div>{t("networkConfig.maxRetriesLabel")} {config.custom_settings.max_retries || '-'}</div>
                          <div>{t("networkConfig.timeoutLabel")} {config.custom_settings.timeout_seconds || '-'}s</div>
                          <div>{t("networkConfig.autoConfirmLabel")} {config.custom_settings.auto_confirm ? t("common.yes") : t("common.no")}</div>
                        </div>
                      ) : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/network-config/edit/${config.uid}`}>
                      <Button size="sm" variant="outline">{t("networkConfig.editButton")}</Button>
                    </Link>
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