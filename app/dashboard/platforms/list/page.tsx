"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, MoreHorizontal, Copy, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { useApi } from "@/lib/useApi"
import Link from "next/link"

export default function PlatformListPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [platforms, setPlatforms] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | false>(false)
  const [sortField, setSortField] = useState<"name" | "created_at" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const { t } = useLanguage()
  const itemsPerPage = 20
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const { toast } = useToast()
  const apiFetch = useApi()
  
  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [statsModalOpen, setStatsModalOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [platformStats, setPlatformStats] = useState<any | null>(null)
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null)

  // Fetch platforms from API
  useEffect(() => {
    const fetchPlatforms = async () => {
      setLoading(true)
      setError(false)
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: itemsPerPage.toString(),
          ordering: sortField ? `${sortDirection === "asc" ? "" : "-"}${sortField}` : "-created_at",
        })

        if (searchTerm.trim() !== "") {
          params.append("search", searchTerm)
        }

        if (statusFilter !== "all") {
          params.append("is_active", statusFilter === "active" ? "true" : "false")
        }

        if (startDate) {
          params.append("created_at__gte", startDate)
        }

        if (endDate) {
          const endDateObj = new Date(endDate)
          endDateObj.setDate(endDateObj.getDate() + 1)
          params.append("created_at__lt", endDateObj.toISOString().split('T')[0])
        }

        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/platforms/?${params.toString()}`
        const data = await apiFetch(endpoint)
        
        setPlatforms(data.results || [])
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
        
        toast({
          title: t("platforms.loadedSuccessfully") || "Platforms loaded",
          description: t("platforms.loadedSuccessfully") || "Platforms loaded successfully",
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        setPlatforms([])
        setTotalCount(0)
        setTotalPages(1)
        toast({
          title: t("platforms.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchPlatforms()
  }, [searchTerm, currentPage, statusFilter, startDate, endDate, sortField, sortDirection])

  const handleSort = (field: "name" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Fetch platform details
  const handleOpenDetail = async (platform: any) => {
    setDetailModalOpen(true)
    setDetailLoading(true)
    setSelectedPlatform(null)
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/platforms/${platform.uid}/`)
      setSelectedPlatform(data)
      // GET requests don't show success toasts automatically
    } catch (err: any) {
      toast({
        title: t("platforms.failedToLoadPlatform"),
        description: extractErrorMessages(err),
        variant: "destructive",
      })
    } finally {
      setDetailLoading(false)
    }
  }

  // Fetch platform statistics
  const handleOpenStats = async (platform: any) => {
    setStatsModalOpen(true)
    setStatsLoading(true)
    setPlatformStats(null)
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/platforms/${platform.uid}/stats/`)
      setPlatformStats(data)
      // GET requests don't show success toasts automatically
    } catch (err: any) {
      toast({
        title: t("platforms.failedToLoad") || "Failed to load platform statistics",
        description: extractErrorMessages(err),
        variant: "destructive",
      })
    } finally {
      setStatsLoading(false)
    }
  }

  // Toggle platform status
  const handleToggleStatus = async (platform: any) => {
    setTogglingStatus(platform.uid)
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/platforms/${platform.uid}/toggle_status/`, {
        method: "PATCH",
      })
      
      // Update the platform in the list
      setPlatforms(prev => prev.map(p => 
        p.uid === platform.uid 
          ? { ...p, is_active: data.is_active }
          : p
      ))
      // Success toast is automatically shown by useApi hook for non-GET requests
    } catch (err: any) {
      toast({
        title: t("platforms.failedToUpdatePlatformStatus"),
        description: extractErrorMessages(err),
        variant: "destructive",
      })
    } finally {
      setTogglingStatus(null)
    }
  }

  const startIndex = (currentPage - 1) * itemsPerPage

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("platforms.title")}</CardTitle>
          <Link href="/dashboard/platforms/create">
            <Button className="mt-2">{t("platforms.add")}</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t("platforms.search")}
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
                <SelectValue placeholder={t("platforms.filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("platforms.allStatus")}</SelectItem>
                <SelectItem value="active">{t("platforms.active")}</SelectItem>
                <SelectItem value="inactive">{t("platforms.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 flex-1">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("platforms.startDate")}
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
                  {t("platforms.endDate")}
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
                {t("platforms.clearDates")}
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">{t("platforms.loading") || t("common.loading")}</div>
            ) : error ? (
              <ErrorDisplay
                error={error}
                onRetry={() => {
                  setCurrentPage(1)
                  setError(false)
                }}
                variant="full"
                showDismiss={false}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>UID</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0 font-semibold">
                        {t("platforms.name")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>{t("platforms.externalId")}</TableHead>
                    <TableHead>{t("platforms.status")}</TableHead>
                    <TableHead>{t("platforms.minDeposit")}</TableHead>
                    <TableHead>{t("platforms.maxDeposit")}</TableHead>
                    <TableHead>{t("platforms.activePartners")}</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("created_at")} className="h-auto p-0 font-semibold">
                        {t("platforms.createdAt")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>{t("platforms.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platforms.map((platform) => (
                    <TableRow key={platform.uid}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {platform.uid}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => {
                              navigator.clipboard.writeText(platform.uid)
                              toast({ title: t("platforms.uidCopied") })
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{platform.name}</TableCell>
                      <TableCell>{platform.external_id}</TableCell>
                      <TableCell>
                        {platform.is_active ? (
                          <img src="/icon-yes.svg" alt="Active" className="h-4 w-4" />
                        ) : (
                          <img src="/icon-no.svg" alt="Inactive" className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell>{platform.min_deposit_amount}</TableCell>
                      <TableCell>{platform.max_deposit_amount}</TableCell>
                      <TableCell>{platform.active_partners_count || 0}</TableCell>
                      <TableCell>{platform.created_at ? platform.created_at.split("T")[0] : "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDetail(platform)}>
                              {t("platforms.viewQuickDetails")}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/dashboard/platforms/details/${platform.uid}`}>
                                {t("platforms.fullDetailsPage")}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenStats(platform)}>
                              <BarChart3 className="mr-2 h-4 w-4" />
                              {t("platforms.statistics")}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/dashboard/platforms/edit/${platform.uid}`}>
                                {t("platforms.editPlatform")}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(platform)}
                              disabled={togglingStatus === platform.uid}
                            >
                              {togglingStatus === platform.uid ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                  </svg>
                                  {t("platforms.toggling")}
                                </span>
                              ) : platform.is_active ? (
                                t("platforms.deactivate")
                              ) : (
                                t("platforms.activate")
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              {t("common.showing") || "Showing"}: {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalCount)} {t("common.of") || "of"} {totalCount}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("common.previous")}
              </Button>
              <div className="text-sm">
                {t("common.page") || "Page"} {currentPage} {t("common.of") || "of"} {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                {t("common.next")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("platforms.platformDetails")}</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="p-4 text-center">{t("platforms.loadingPlatformDetails")}</div>
          ) : selectedPlatform ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <strong>{t("platforms.name")}:</strong> {selectedPlatform.uid}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedPlatform.uid)
                        toast({ title: t("platforms.uidCopied") })
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div><strong>{t("platforms.name")}:</strong> {selectedPlatform.name}</div>
                  <div><strong>{t("platforms.externalId")}:</strong> {selectedPlatform.external_id}</div>
                  <div><strong>{t("platforms.status")}:</strong> {selectedPlatform.is_active ? t("platforms.active") : t("platforms.inactive")}</div>
                </div>
                <div className="space-y-2">
                  <div><strong>{t("platforms.minDeposit")}:</strong> {selectedPlatform.min_deposit_amount}</div>
                  <div><strong>{t("platforms.maxDeposit")}:</strong> {selectedPlatform.max_deposit_amount}</div>
                  <div><strong>{t("platforms.minimumWithdrawal")}:</strong> {selectedPlatform.min_withdrawal_amount}</div>
                  <div><strong>{t("platforms.maximumWithdrawal")}:</strong> {selectedPlatform.max_withdrawal_amount}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div><strong>{t("platforms.description")}:</strong> {selectedPlatform.description || t("platforms.noDescriptionProvided")}</div>
                <div><strong>{t("platforms.createdBy")}:</strong> {selectedPlatform.created_by_name || t("platforms.unknown")}</div>
                <div><strong>{t("platforms.createdAtLabel")}:</strong> {selectedPlatform.created_at ? new Date(selectedPlatform.created_at).toLocaleString() : t("platforms.unknown")}</div>
                <div><strong>{t("platforms.updatedAt")}:</strong> {selectedPlatform.updated_at ? new Date(selectedPlatform.updated_at).toLocaleString() : t("platforms.unknown")}</div>
                <div><strong>{t("platforms.activePartners")}:</strong> {selectedPlatform.active_partners_count || 0}</div>
                <div><strong>{t("platforms.totalTransactions")}:</strong> {selectedPlatform.total_transactions_count || 0}</div>
              </div>
            </div>
          ) : null}
          <DialogClose asChild>
            <Button className="mt-4 w-full">{t("common.close")}</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Platform Statistics Modal */}
      <Dialog open={statsModalOpen} onOpenChange={setStatsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("platforms.platformStatistics")}</DialogTitle>
          </DialogHeader>
          {statsLoading ? (
            <div className="p-4 text-center">{t("common.loading")}</div>
          ) : platformStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>{t("platforms.totalTransactions")}:</strong> {platformStats.total_transactions}</div>
                <div><strong>{t("platforms.successful")}:</strong> {platformStats.successful_transactions}</div>
                <div><strong>{t("platforms.failed")}:</strong> {platformStats.failed_transactions}</div>
                <div><strong>{t("platforms.pending")}:</strong> {platformStats.pending_transactions}</div>
              </div>
              <div className="space-y-2">
                <div><strong>{t("platforms.totalVolume")}:</strong> {platformStats.total_volume}</div>
                <div><strong>{t("platforms.totalCommissions")}:</strong> {platformStats.total_commissions}</div>
                <div><strong>{t("platforms.activePartners")}:</strong> {platformStats.active_partners}</div>
              </div>
            </div>
          ) : null}
          <DialogClose asChild>
            <Button className="mt-4 w-full">{t("common.close")}</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  )
}
