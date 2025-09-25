"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, MoreHorizontal, ArrowUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { useApi } from "@/lib/useApi"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Copy } from "lucide-react"

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [users, setUsers] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<"display_name" | "email" | "created_at" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const { t } = useLanguage()
  const itemsPerPage = 10
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  // Set default viewType to 'all' (was 'pending')
  const [viewType, setViewType] = useState("all") // 'pending' or 'all'
  const { toast } = useToast()
  const [activatingUid, setActivatingUid] = useState<string | null>(null)
  const [deactivatingUid, setDeactivatingUid] = useState<string | null>(null)
  const [selectedUids, setSelectedUids] = useState<string[]>([])
  const allSelected = users.length > 0 && users.every((u) => selectedUids.includes(u.uid))
  const someSelected = users.some((u) => selectedUids.includes(u.uid))
  const apiFetch = useApi();
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailUser, setDetailUser] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")
  
  // Add state for loading email/phone/partner verification
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [verifyingPartner, setVerifyingPartner] = useState(false);

  // Add state for confirmation modals
  const [confirmEmailToggle, setConfirmEmailToggle] = useState<null | boolean>(null);
  const [confirmPhoneToggle, setConfirmPhoneToggle] = useState<null | boolean>(null);
  const [confirmPartnerToggle, setConfirmPartnerToggle] = useState<null | boolean>(null);

  const [confirmActionUser, setConfirmActionUser] = useState<any | null>(null);
  const [confirmActionType, setConfirmActionType] = useState<"activate" | "deactivate" | null>(null);



  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        let endpoint = "";
        if (searchTerm.trim() !== "" || statusFilter !== "all" || sortField || startDate || endDate) {
          const params = new URLSearchParams({
            page: currentPage.toString(),
            page_size: itemsPerPage.toString(),
          });
          if (searchTerm.trim() !== "") {
            params.append("search", searchTerm);
          }
          if (statusFilter !== "all") {
            params.append("status", statusFilter);
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
          const orderingParam = sortField
            ? `&ordering=${(sortDirection === "asc" ? "+" : "-")}${(sortField === "display_name" ? "display_name" : sortField)}`
            : "";
          endpoint =
            viewType === "pending"
              ? `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/pending/?${params.toString()}${orderingParam}`
              : `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/?${params.toString()}${orderingParam}`;
        } else {
          const params = new URLSearchParams({
            page: currentPage.toString(),
            page_size: itemsPerPage.toString(),
          });
          endpoint =
            viewType === "pending"
              ? `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/pending/?${params.toString()}`
              : `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/?${params.toString()}`;
        }
        console.log("User API endpoint:", endpoint);
        const data = await apiFetch(endpoint);
        setUsers(data.users || []);
        setTotalCount(data.pagination?.total_count || 0);
        setTotalPages(data.pagination?.total_pages || 1);
        toast({
          title: t("users.success"),
          description: t("users.loadedSuccessfully"),
        });
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err);
        setError(errorMessage);
        setUsers([]);
        setTotalCount(0);
        setTotalPages(1);
        toast({
          title: t("users.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [searchTerm, currentPage, itemsPerPage, baseUrl, viewType, statusFilter, startDate, endDate, sortField, sortDirection]);

  const filteredUsers = users // Filtering is now handled by the API
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers // Already paginated by API

  const handleSort = (field: "display_name" | "email" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      pending: "outline",
    } as const

    return <Badge variant={variants[status as keyof typeof variants]}>{t(`users.${status}`)}</Badge>
  }

  // Activate user handler
  const handleActivate = async (user: any) => {
    if (!user.uid) return
    setActivatingUid(user.uid)
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${user.uid}/activate/`, {
        method: "PATCH",
      })
      toast({ title: t("users.activated"), description: data.message || t("users.userActivatedSuccessfully") })
      setUsers((prev) => prev.map((u) => (u.uid === user.uid ? { ...u, ...data.user } : u)))
    } catch (err: any) {
      toast({ title: t("users.activationFailed"), description: extractErrorMessages(err) || t("users.couldNotActivateUser"), variant: "destructive" })
    } finally {
      setActivatingUid(null)
    }
  }

  // Deactivate user handler
  const handleDeactivate = async (user: any) => {
    if (!user.uid) return
    setDeactivatingUid(user.uid)
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${user.uid}/deactivate/`, {
        method: "PATCH",
      })
      toast({ title: t("users.deactivated"), description: data.message || t("users.userDeactivatedSuccessfully") })
      setUsers((prev) => prev.map((u) => (u.uid === user.uid ? { ...u, ...data.user } : u)))
    } catch (err: any) {
      toast({ title: t("users.deactivationFailed"), description: extractErrorMessages(err) || t("users.couldNotDeactivateUser"), variant: "destructive" })
    } finally {
      setDeactivatingUid(null)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUids(Array.from(new Set([...selectedUids, ...paginatedUsers.map((u) => u.uid)])))
    } else {
      setSelectedUids(selectedUids.filter((uid) => !paginatedUsers.map((u) => u.uid).includes(uid)))
    }
  }

  const handleSelectRow = (uid: string, checked: boolean) => {
    setSelectedUids((prev) => checked ? [...prev, uid] : prev.filter((id) => id !== uid))
  }

  // Bulk action handler
  const handleBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    if (selectedUids.length === 0) return
    setLoading(true)
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/bulk-action/`, {
        method: "POST",
        body: JSON.stringify({ action, user_ids: selectedUids }),
      })
      toast({ title: t("users.bulkActionSuccess"), description: data.message || t("users.bulkActionCompleted") })
      setUsers((prev) => prev.map((u) => selectedUids.includes(u.uid) ? { ...u, ...data.user } : u))
      setSelectedUids([])
      setCurrentPage(1)
    } catch (err: any) {
      toast({ title: t("users.bulkActionFailed"), description: extractErrorMessages(err) || t("users.couldNotPerformBulkAction"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Fetch user details
  const handleOpenDetail = async (uid: string) => {
    setDetailModalOpen(true)
    setDetailLoading(true)
    setDetailError("")
    setDetailUser(null)
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${uid}/`)
      setDetailUser(data)
      toast({ title: t("users.detailLoaded"), description: t("users.userDetailLoadedSuccessfully") })
    } catch (err: any) {
      setDetailError(extractErrorMessages(err))
      toast({ title: t("users.detailFailed"), description: extractErrorMessages(err), variant: "destructive" })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setDetailModalOpen(false)
    setDetailUser(null)
    setDetailError("")
  }

  // Add handler for verifying email
  const handleVerifyEmail = async () => {
    if (!detailUser?.uid) return;
    setVerifyingEmail(true);
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_verified: true }),
      });
      setDetailUser((prev: any) => prev ? { ...prev, email_verified: true } : prev);
      toast({ title: t("users.emailVerified"), description: t("users.emailVerifiedSuccessfully") });
    } catch (err: any) {
      toast({ title: t("users.verificationFailed"), description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Add handler for verifying phone
  const handleVerifyPhone = async () => {
    if (!detailUser?.uid) return;
    setVerifyingPhone(true);
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_verified: true }),
      });
      setDetailUser((prev: any) => prev ? { ...prev, phone_verified: true } : prev);
      toast({ title: t("users.phoneVerified"), description: t("users.phoneVerifiedSuccessfully") });
    } catch (err: any) {
      toast({ title: t("users.verificationFailed"), description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingPhone(false);
    }
  };

  // Update handleVerifyEmail to handle both verify and unverify
  const handleToggleEmailVerified = async (verify: boolean) => {
    if (!detailUser?.uid) return;
    setVerifyingEmail(true);
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_verified: verify }),
      });
      setDetailUser((prev: any) => prev ? { ...prev, email_verified: verify } : prev);
      toast({ title: t("users.emailVerified"), description: verify ? t("users.emailVerifiedSuccessfully") : t("users.emailUnverifiedSuccessfully") });
    } catch (err: any) {
      toast({ title: t("users.verificationFailed"), description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Update handleVerifyPhone to handle both verify and unverify
  const handleTogglePhoneVerified = async (verify: boolean) => {
    if (!detailUser?.uid) return;
    setVerifyingPhone(true);
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_verified: verify }),
      });
      setDetailUser((prev: any) => prev ? { ...prev, phone_verified: verify } : prev);
      toast({ title: t("users.phoneVerified"), description: verify ? t("users.phoneVerifiedSuccessfully") : t("users.phoneUnverifiedSuccessfully") });
    } catch (err: any) {
      toast({ title: t("users.verificationFailed"), description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingPhone(false);
    }
  };

  // Add handler for toggling is_partner
  const handleTogglePartner = async (isPartner: boolean) => {
    if (!detailUser?.uid) return;
    setVerifyingPartner(true);
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_partner: isPartner }),
      });
      setDetailUser((prev: any) => prev ? { ...prev, is_partner: isPartner } : prev);
      toast({ title: t("users.partnerToggled"), description: isPartner ? t("users.partnerEnabledSuccessfully") : t("users.partnerDisabledSuccessfully") });
    } catch (err: any) {
      toast({ title: t("users.partnerToggleFailed"), description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingPartner(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("users.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* View Switcher */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t("users.search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={viewType} onValueChange={setViewType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t("users.viewType")}/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t("users.pendingUsers")}</SelectItem>
                <SelectItem value="all">{t("users.allUsers")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t("users.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("users.allStatuses")}</SelectItem>
                <SelectItem value="active">{t("users.active")}</SelectItem>
                <SelectItem value="inactive">{t("users.inactive")}</SelectItem>
                <SelectItem value="pending">{t("users.pending")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 flex-1">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("users.startDate") || "Start Date"}
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
                  {t("users.endDate") || "End Date"}
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
                {t("users.clearDates") || "Clear Dates"}
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center justify-between">
            <div className="flex-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={selectedUids.length === 0}>
                  Bulk Actions <MoreHorizontal className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkAction("activate")}>Activate</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("deactivate")}>Deactivate</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("delete")}>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                    <TableHead>
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>{t("users.uid")}</TableHead> {/* Add UID header */}
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("display_name")} className="h-auto p-0 font-semibold">
                        {t("users.name")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("email")} className="h-auto p-0 font-semibold">
                        {t("users.email")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>{t("users.phone")}</TableHead>
                    <TableHead>{t("users.status")}</TableHead>
                    <TableHead>{t("users.lastLogin")}</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("created_at")} className="h-auto p-0 font-semibold">
                        {t("users.createdAt")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                        <TableHead>{t("common.actions")}</TableHead>
                    <TableHead>{t("users.details")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.uid || user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUids.includes(user.uid)}
                          onCheckedChange={(checked) => handleSelectRow(user.uid, !!checked)}
                          aria-label={`Select user ${user.display_name || user.email}`}
                        />
                      </TableCell>
                      <TableCell>{user.uid}</TableCell> {/* Add UID cell */}
                      <TableCell className="font-medium">{user.display_name || `${user.first_name || ""} ${user.last_name || ""}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      {/* <TableCell>
                        {user.is_active ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deactivatingUid === user.uid}
                            onClick={() => handleDeactivate(user)}
                          >
                            {deactivatingUid === user.uid ? (
                              <span className="flex items-center"><svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>{t("users.deactivating")}</span>
                            ) : t("users.deactivate")}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={activatingUid === user.uid}
                            onClick={() => handleActivate(user)}
                          >
                            {activatingUid === user.uid ? (
                              <span className="flex items-center"><svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>{t("users.activating")}</span>
                            ) : t("users.activate")}
                          </Button>
                        )}
                      </TableCell> */}
                      <TableCell>
                        {user.is_active ? (
                          // <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-700 p-1">
                            <img src="/icon-yes.svg" alt="Active" className="h-4 w-4" />
                          // </span>
                        ) : (
                          // <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-700 p-1">
                            <img src="/icon-no.svg" alt="Active" className="h-4 w-4" />
                          // </span>
                        )}
                      </TableCell>
                      <TableCell>{user.last_login_at ? user.last_login_at.split("T")[0] : "-"}</TableCell>
                      <TableCell>{user.created_at ? user.created_at.split("T")[0] : "-"}</TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deactivatingUid === user.uid}
                            onClick={() => {
                              setConfirmActionUser(user);
                              setConfirmActionType("deactivate");
                            }}
                          >
                            {deactivatingUid === user.uid ? (
                              <span className="flex items-center">
                                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                {t("users.deactivating")}
                              </span>
                            ) : t("users.deactivate")}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={activatingUid === user.uid}
                            onClick={() => { 
                                  setConfirmActionUser(user);
                                  setConfirmActionType("activate");
                                }}
                              >
                            {activatingUid === user.uid ? (
                              <span className="flex items-center">
                                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                {t("users.activating")}
                              </span>
                            ) : t("users.activate")}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="secondary" onClick={() => handleOpenDetail(user.uid)}>
                          {t("users.details")}
                        </Button>
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
              {`${t("users.showingResults")}: ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalCount)} / ${totalCount}`}
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
                {`${t("users.pageOf")}: ${currentPage}/${totalPages}`}
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

      {/* User Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.details")}</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="p-4 text-center">{t("common.loading")}</div>
          ) : detailError ? (
            <ErrorDisplay
              error={detailError}
              variant="inline"
              showRetry={false}
              className="mb-4"
            />
          ) : detailUser ? (
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <b>{t("users.uid")}:</b> {detailUser.uid}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => {
                      navigator.clipboard.writeText(detailUser.uid);
                      toast({ title: t("users.copiedUid") || "UID copied!" });
                    }}
                    aria-label={t("users.copyUid") || "Copy UID"}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div><b>{t("users.name")}:</b> {detailUser.display_name || `${detailUser.first_name || ""} ${detailUser.last_name || ""}`}</div>
                <div><b>{t("users.email")}:</b> {detailUser.email}</div>
                <div><b>{t("users.phone")}:</b> {detailUser.phone}</div>
                <div><b>{t("users.status")}:</b> {detailUser.is_active ? t("users.active") : t("users.inactive")}</div>
                <div><b>{t("users.emailVerified")}:</b> {detailUser.email_verified ? t("common.yes") : t("common.no")}
  <Switch
    checked={detailUser.email_verified}
    disabled={detailLoading || verifyingEmail}
    onCheckedChange={() => setConfirmEmailToggle(!detailUser.email_verified)}
    className="ml-2"
  />
</div>
<div><b>{t("users.phoneVerified")}:</b> {detailUser.phone_verified ? t("common.yes") : t("common.no")}
  <Switch
    checked={detailUser.phone_verified}
    disabled={detailLoading || verifyingPhone}
    onCheckedChange={() => setConfirmPhoneToggle(!detailUser.phone_verified)}
    className="ml-2"
  />
</div>
                <div><b>{t("users.contactMethod")}:</b> {detailUser.contact_method}</div>
                <div><b>{t("users.isPartner") || "Partner"}:</b> {detailUser.is_partner ? t("common.yes") : t("common.no")}
                  <Switch
                    checked={detailUser.is_partner}
                    disabled={detailLoading || verifyingPartner}
                    onCheckedChange={() => setConfirmPartnerToggle(!detailUser.is_partner)}
                    className="ml-2"
                  />
                </div>
                <div><b>{t("users.createdAt")}:</b> {detailUser.created_at ? detailUser.created_at.split("T")[0] : "-"}</div>
                <div><b>{t("users.lastLogin")}:</b> {detailUser.last_login_at ? detailUser.last_login_at.split("T")[0] : "-"}</div>
            </div>
          ) : null}
          <DialogClose asChild>
            <Button className="mt-4 w-full">{t("common.close")}</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

  {/* Email Verification Confirmation Modal */}
      <Dialog open={confirmEmailToggle !== null} onOpenChange={(open) => { if (!open) setConfirmEmailToggle(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmEmailToggle ? t("users.verifyEmail") : t("users.unverifyEmail")}</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            {confirmEmailToggle
              ? t("users.confirmVerifyEmail")
              : t("users.confirmUnverifyEmail")}
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={async () => {
                await handleToggleEmailVerified(!!confirmEmailToggle);
                setConfirmEmailToggle(null);
              }}
              disabled={verifyingEmail}
            >
              {verifyingEmail ? t("users.verifying") : t("common.ok")}
            </Button>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setConfirmEmailToggle(null)}
              disabled={verifyingEmail}
            >
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

  {/* Phone Verification Confirmation Modal */}
      {/* Partner Toggle Confirmation Modal */}
      <Dialog open={confirmPartnerToggle !== null} onOpenChange={(open) => { if (!open) setConfirmPartnerToggle(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmPartnerToggle ? t("users.enablePartner") || "Enable Partner" : t("users.disablePartner") || "Disable Partner"}</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            {confirmPartnerToggle
              ? t("users.confirmEnablePartner") || "Are you sure you want to enable partner status?"
              : t("users.confirmDisablePartner") || "Are you sure you want to disable partner status?"}
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={async () => {
                await handleTogglePartner(!!confirmPartnerToggle);
                setConfirmPartnerToggle(null);
              }}
              disabled={verifyingPartner}
            >
              {verifyingPartner ? t("users.verifying") : t("common.ok")}
            </Button>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setConfirmPartnerToggle(null)}
              disabled={verifyingPartner}
            >
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={confirmPhoneToggle !== null} onOpenChange={(open) => { if (!open) setConfirmPhoneToggle(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmPhoneToggle ? t("users.verifyPhone") : t("users.unverifyPhone")}</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            {confirmPhoneToggle
              ? t("users.confirmVerifyPhone")
              : t("users.confirmUnverifyPhone")}
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={async () => {
                await handleTogglePhoneVerified(!!confirmPhoneToggle);
                setConfirmPhoneToggle(null);
              }}
              disabled={verifyingPhone}
            >
              {verifyingPhone ? t("users.verifying") : t("common.ok")}
            </Button>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setConfirmPhoneToggle(null)}
              disabled={verifyingPhone}
            >
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!confirmActionType} onOpenChange={(open) => { if (!open) { setConfirmActionType(null); setConfirmActionUser(null); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {confirmActionType === "activate"
              ? t("users.confirmActivateTitle") || "Activate User"
              : t("users.confirmDeactivateTitle") || "Deactivate User"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 text-center">
          {confirmActionType === "activate"
            ? t("users.confirmActivateText") || "Are you sure that you want to activate user?"
            : t("users.confirmDeactivateText") || "Are you sure that you want to deactivate user?"}
        </div>
        <DialogFooter>
          <Button
            className="w-full"
            onClick={async () => {
              if (confirmActionUser) {
                if (confirmActionType === "activate") {
                  await handleActivate(confirmActionUser);
                } else {
                  await handleDeactivate(confirmActionUser);
                }
              }
              setConfirmActionType(null);
              setConfirmActionUser(null);
            }}
            disabled={activatingUid === confirmActionUser?.uid || deactivatingUid === confirmActionUser?.uid}
          >
            {confirmActionType === "activate"
              ? t("users.activate")
              : t("users.deactivate")}
          </Button>
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => {
              setConfirmActionType(null);
              setConfirmActionUser(null);
            }}
            disabled={activatingUid === confirmActionUser?.uid || deactivatingUid === confirmActionUser?.uid}
          >
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
