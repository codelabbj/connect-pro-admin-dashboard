"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, MoreHorizontal, CopyIcon, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { useApi } from "@/lib/useApi"
import Link from "next/link"

export default function PermissionListPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [depositFilter, setDepositFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [permissions, setPermissions] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [sortField, setSortField] = useState<"partner_name" | "platform_name" | "created_at" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const { t } = useLanguage()
  const itemsPerPage = 20
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const { toast } = useToast()
  const apiFetch = useApi()
  
  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null)

  // Fetch permissions from API
  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: itemsPerPage.toString(),
        })

        if (searchTerm.trim() !== "") {
          params.append("search", searchTerm)
        }

        if (platformFilter !== "all") {
            params.append("platform", platformFilter)
        }

        if (statusFilter !== "all") {
          params.append("is_active", statusFilter === "active" ? "true" : "false")
        }

        if (depositFilter !== "all") {
          params.append("can_deposit", depositFilter === "true" ? "true" : "false")
        }

        if (startDate) {
          params.append("created_at__gte", startDate)
        }

        if (endDate) {
          const endDateObj = new Date(endDate)
          endDateObj.setDate(endDateObj.getDate() + 1)
          params.append("created_at__lt", endDateObj.toISOString().split('T')[0])
        }

        // Add sorting
        let ordering = ""
        if (sortField === "partner_name") {
          ordering = `${sortDirection === "asc" ? "" : "-"}partner_name`
        } else if (sortField === "platform_name") {
          ordering = `${sortDirection === "asc" ? "" : "-"}platform_name`
        } else if (sortField === "created_at") {
          ordering = `${sortDirection === "asc" ? "" : "-"}created_at`
        }
        
        if (ordering) {
          params.append("ordering", ordering)
        }

        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/permissions/?${params.toString()}`
        const data = await apiFetch(endpoint)
        
        setPermissions(data.results || [])
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
        
        toast({
          title: t("permissions.permissionsLoaded"),
          description: t("permissions.permissionsLoadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        setPermissions([])
        setTotalCount(0)
        setTotalPages(1)
        toast({
          title: t("permissions.failedToLoadPermissions"),
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchPermissions()
  }, [searchTerm, currentPage, platformFilter, statusFilter, depositFilter, startDate, endDate, sortField, sortDirection])

  // Fetch platforms for filter dropdown
  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const params = new URLSearchParams({
          page_size: "100",
          is_active: "true"
        })
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/platforms/?${params.toString()}`
        const data = await apiFetch(endpoint)
        setPlatforms(data.results || [])
      } catch (err) {
        console.warn("Could not fetch platforms:", err)
      }
    }
    fetchPlatforms()
  }, [])

  const handleSort = (field: "partner_name" | "platform_name" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Fetch permission details (same as the data in the list)
  const handleOpenDetail = (permission: any) => {
    setDetailModalOpen(true)
    setSelectedPermission(permission)
  }

  // Toggle permission status
  const handleToggleStatus = async (permission: any) => {
    setTogglingStatus(permission.uid)
    try {
      const payload = {
        can_deposit: permission.can_deposit,
        can_withdraw: permission.can_withdraw,
        is_active: !permission.is_active,
      }

      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/permissions/${permission.uid}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      // Update the permission in the list
      setPermissions(prev => prev.map(p => 
        p.uid === permission.uid 
          ? { ...p, is_active: data.is_active }
          : p
      ))
      
      toast({
        title: t("permissions.permissionStatusUpdated"),
        description: data.is_active ? t("permissions.permissionActivated") : t("permissions.permissionDeactivated"),
      })
    } catch (err: any) {
      toast({
        title: t("permissions.failedToUpdatePermissionStatus"),
        description: extractErrorMessages(err),
        variant: "destructive",
      })
    } finally {
      setTogglingStatus(null)
    }
  }

  const startIndex = (currentPage - 1) * itemsPerPage

  const getPermissionBadge = (canDeposit: boolean, canWithdraw: boolean) => {
    if (canDeposit && canWithdraw) {
      return <Badge variant="default">{t("permissions.fullAccess")}</Badge>
    } else if (canDeposit) {
      return <Badge variant="secondary">{t("permissions.depositOnly")}</Badge>
    } else if (canWithdraw) {
      return <Badge variant="outline">{t("permissions.withdrawOnly")}</Badge>
    } else {
      return <Badge variant="destructive">{t("permissions.noAccess")}</Badge>
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("permissions.list.title")}
          </CardTitle>
          <div className="flex gap-2 mt-2">
            <Link href="/dashboard/permissions/create">
              <Button>{t("permissions.list.grantPermission")}</Button>
            </Link>
            <Link href="/dashboard/permissions/partners-summary">
              <Button variant="outline">{t("permissions.partnersSummary")}</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t("permissions.list.search")}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t("permissions.list.filterByPlatform")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("permissions.list.allPlatforms")}</SelectItem>
                {platforms.map((platform) => (
                  <SelectItem key={platform.uid} value={platform.uid}>
                    {platform.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t("permissions.filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("permissions.allStatus")}</SelectItem>
                <SelectItem value="active">{t("common.active")}</SelectItem>
                <SelectItem value="inactive">{t("common.inactive")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={depositFilter} onValueChange={setDepositFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t("permissions.filterByDeposit")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("permissions.allAccess")}</SelectItem>
                <SelectItem value="true">{t("permissions.depositAllowed")}</SelectItem>
                <SelectItem value="false">{t("permissions.noDeposit")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 flex-1">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("common.startDate")}
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
                  {t("common.endDate")}
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
                {t("common.clearDates")}
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">{t("common.loading")}</div>
            ) : error ? (
              <ErrorDisplay
                error={error}
                onRetry={() => {
                  setCurrentPage(1)
                  setError("")
                }}
                variant="full"
                showDismiss={false}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.uid") || "UID"}</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("partner_name")} className="h-auto p-0 font-semibold">
                        {t("permissions.partner") || "Partner"}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("platform_name")} className="h-auto p-0 font-semibold">
                        {t("permissions.platform") || "Platform"}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>{t("permissions.accessLevel") || "Access Level"}</TableHead>
                    <TableHead>{t("permissions.status") || "Status"}</TableHead>
                    <TableHead>{t("permissions.depositLimits") || "Deposit Limits"}</TableHead>
                    <TableHead>{t("permissions.withdrawalLimits") || "Withdrawal Limits"}</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("created_at")} className="h-auto p-0 font-semibold">
                        {t("permissions.granted") || "Granted"}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>{t("common.actions") || "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.uid}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="px-1 py-0.5 bg-muted rounded text-xs">
                            {permission.uid.slice(0, 8)}...
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => {
                              navigator.clipboard.writeText(permission.uid)
                              toast({ title: t("common.uidCopied") || "UID copied!" })
                            }}
                          >
                            <CopyIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{permission.partner_name}</div>
                          <code className="text-xs text-muted-foreground">{permission.partner.slice(0, 8)}...</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{permission.platform_name}</div>
                          <code className="text-xs text-muted-foreground">{permission.platform_external_id.slice(0, 8)}...</code>
                        </div>
                      </TableCell>
                      <TableCell>{getPermissionBadge(permission.can_deposit, permission.can_withdraw)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {permission.is_active ? (
                            <img src="/icon-yes.svg" alt="Active" className="h-4 w-4" />
                          ) : (
                            <img src="/icon-no.svg" alt="Inactive" className="h-4 w-4" />
                          )}
                          <span className="text-sm">{permission.is_active ? t("common.active") : t("common.inactive")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{t("permissions.min")}: {permission.platform_min_deposit}</div>
                          <div>{t("permissions.max")}: {permission.platform_max_deposit}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{t("permissions.min")}: {permission.platform_min_withdrawal}</div>
                          <div>{t("permissions.max")}: {permission.platform_max_withdrawal}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{permission.created_at ? new Date(permission.created_at).toLocaleDateString() : "-"}</div>
                          <div className="text-xs text-muted-foreground">{t("permissions.by")} {permission.granted_by_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDetail(permission)}>
                              {t("permissions.viewDetails") || "View Details"}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/dashboard/permissions/edit/${permission.uid}`}>
                                {t("permissions.editPermission")}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(permission)}
                              disabled={togglingStatus === permission.uid}
                            >
                              {togglingStatus === permission.uid ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                  </svg>
                                  {t("common.toggling") || "Toggling..."}
                                </span>
                              ) : permission.is_active ? (
                                t("common.deactivate") || "Deactivate"
                              ) : (
                                t("common.activate") || "Activate"
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
              {t("common.showing")}: {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalCount)} {t("common.of")} {totalCount}
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
                {t("common.page")} {currentPage} {t("common.of")} {totalPages}
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

      {/* Permission Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("permissions.permissionDetails") || "Permission Details"}</DialogTitle>
          </DialogHeader>
          {selectedPermission ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <strong>{t("common.uid")}:</strong> {selectedPermission.uid}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedPermission.uid)
                        toast({ title: t("common.uidCopied") || "UID copied!" })
                      }}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div><strong>{t("permissions.partner")}:</strong> {selectedPermission.partner_name}</div>
                  <div><strong>{t("permissions.partnerId") || "Partner ID"}:</strong> {selectedPermission.partner}</div>
                  <div><strong>{t("permissions.platform")}:</strong> {selectedPermission.platform_name}</div>
                  <div><strong>{t("permissions.platformId") || "Platform ID"}:</strong> {selectedPermission.platform}</div>
                  <div><strong>{t("platforms.externalId")}:</strong> {selectedPermission.platform_external_id}</div>
                </div>
                <div className="space-y-2">
                  <div><strong>{t("permissions.canDepositLabel")}:</strong> {selectedPermission.can_deposit ? t("common.yes") : t("common.no")}</div>
                  <div><strong>{t("permissions.canWithdrawLabel")}:</strong> {selectedPermission.can_withdraw ? t("common.yes") : t("common.no")}</div>
                  <div><strong>{t("permissions.status")}:</strong> {selectedPermission.is_active ? t("common.active") : t("common.inactive")}</div>
                  <div><strong>{t("permissions.grantedBy") || "Granted by"}:</strong> {selectedPermission.granted_by_name}</div>
                  <div><strong>{t("platforms.createdAtLabel")}:</strong> {selectedPermission.created_at ? new Date(selectedPermission.created_at).toLocaleString() : t("platforms.unknown")}</div>
                  <div><strong>{t("platforms.updatedAt")}:</strong> {selectedPermission.updated_at ? new Date(selectedPermission.updated_at).toLocaleString() : t("platforms.unknown")}</div>
                </div>
              </div>
              <div className="space-y-2">
                <strong>{t("permissions.platformLimits")}:</strong>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>{t("permissions.depositLimits")}:</strong>
                    <div>{t("permissions.min")}: {selectedPermission.platform_min_deposit}</div>
                    <div>{t("permissions.max")}: {selectedPermission.platform_max_deposit}</div>
                  </div>
                  <div>
                    <strong>{t("permissions.withdrawalLimits")}:</strong>
                    <div>{t("permissions.min")}: {selectedPermission.platform_min_withdrawal}</div>
                    <div>{t("permissions.max")}: {selectedPermission.platform_max_withdrawal}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex justify-end mt-4">
            <Button onClick={() => setDetailModalOpen(false)}>
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
