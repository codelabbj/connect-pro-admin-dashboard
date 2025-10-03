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
          title: "Permissions loaded",
          description: "Permissions loaded successfully",
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        setPermissions([])
        setTotalCount(0)
        setTotalPages(1)
        toast({
          title: "Failed to load permissions",
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
        title: "Permission status updated",
        description: `Permission ${data.is_active ? "activated" : "deactivated"}`,
      })
    } catch (err: any) {
      toast({
        title: "Failed to update permission status",
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
      return <Badge variant="default">Full Access</Badge>
    } else if (canDeposit) {
      return <Badge variant="secondary">Deposit Only</Badge>
    } else if (canWithdraw) {
      return <Badge variant="outline">Withdraw Only</Badge>
    } else {
      return <Badge variant="destructive">No Access</Badge>
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
              <Button variant="outline">Partners Summary</Button>
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
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={depositFilter} onValueChange={setDepositFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by deposit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Access</SelectItem>
                <SelectItem value="true">Deposit Allowed</SelectItem>
                <SelectItem value="false">No Deposit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 flex-1">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Date
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
                  End Date
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
                Clear Dates
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
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
                    <TableHead>UID</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("partner_name")} className="h-auto p-0 font-semibold">
                        Partner
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("platform_name")} className="h-auto p-0 font-semibold">
                        Platform
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deposit Limits</TableHead>
                    <TableHead>Withdrawal Limits</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("created_at")} className="h-auto p-0 font-semibold">
                        Granted
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
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
                              toast({ title: "UID copied!" })
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
                          <span className="text-sm">{permission.is_active ? "Active" : "Inactive"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Min: {permission.platform_min_deposit}</div>
                          <div>Max: {permission.platform_max_deposit}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Min: {permission.platform_min_withdrawal}</div>
                          <div>Max: {permission.platform_max_withdrawal}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{permission.created_at ? new Date(permission.created_at).toLocaleDateString() : "-"}</div>
                          <div className="text-xs text-muted-foreground">by {permission.granted_by_name}</div>
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
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/dashboard/permissions/edit/${permission.uid}`}>
                                Edit Permission
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
                                  Toggling...
                                </span>
                              ) : permission.is_active ? (
                                "Deactivate"
                              ) : (
                                "Activate"
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
              Showing: {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalCount)} of {totalCount}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
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
            <DialogTitle>Permission Details</DialogTitle>
          </DialogHeader>
          {selectedPermission ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <strong>UID:</strong> {selectedPermission.uid}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedPermission.uid)
                        toast({ title: "UID copied!" })
                      }}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div><strong>Partner:</strong> {selectedPermission.partner_name}</div>
                  <div><strong>Partner ID:</strong> {selectedPermission.partner}</div>
                  <div><strong>Platform:</strong> {selectedPermission.platform_name}</div>
                  <div><strong>Platform ID:</strong> {selectedPermission.platform}</div>
                  <div><strong>External ID:</strong> {selectedPermission.platform_external_id}</div>
                </div>
                <div className="space-y-2">
                  <div><strong>Can Deposit:</strong> {selectedPermission.can_deposit ? "Yes" : "No"}</div>
                  <div><strong>Can Withdraw:</strong> {selectedPermission.can_withdraw ? "Yes" : "No"}</div>
                  <div><strong>Status:</strong> {selectedPermission.is_active ? "Active" : "Inactive"}</div>
                  <div><strong>Granted by:</strong> {selectedPermission.granted_by_name}</div>
                  <div><strong>Created:</strong> {selectedPermission.created_at ? new Date(selectedPermission.created_at).toLocaleString() : "Unknown"}</div>
                  <div><strong>Updated:</strong> {selectedPermission.updated_at ? new Date(selectedPermission.updated_at).toLocaleString() : "Unknown"}</div>
                </div>
              </div>
              <div className="space-y-2">
                <strong>Platform Limits:</strong>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Deposit Limits:</strong>
                    <div>Min: {selectedPermission.platform_min_deposit}</div>
                    <div>Max: {selectedPermission.platform_max_deposit}</div>
                  </div>
                  <div>
                    <strong>Withdrawal Limits:</strong>
                    <div>Min: {selectedPermission.platform_min_withdrawal}</div>
                    <div>Max: {selectedPermission.platform_max_withdrawal}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex justify-end mt-4">
            <Button onClick={() => setDetailModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
