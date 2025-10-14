"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ArrowUpDown, Plus, Edit, ToggleLeft, ToggleRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function DeviceAuthorizationsPage() {
  const [authorizations, setAuthorizations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortField, setSortField] = useState<"created_at" | "partner_name" | null>(null)
  const [sortDirection, setSortDirection] = useState<"+" | "-">("-")
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedAuthorization, setSelectedAuthorization] = useState<any>(null)
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    partner: "",
    origin_device: "",
    is_active: true,
    notes: ""
  })

  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchAuthorizations()
  }, [searchTerm, statusFilter, startDate, endDate, sortField, sortDirection])

  const fetchAuthorizations = async () => {
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
          params.append("is_active", statusFilter === "active" ? "true" : "false");
        }
        if (startDate) {
          params.append("created_at__gte", startDate);
        }
        if (endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setDate(endDateObj.getDate() + 1);
          params.append("created_at__lt", endDateObj.toISOString().split('T')[0]);
        }
        if (sortField) {
          params.append("ordering", `${sortDirection}${sortField}`);
        }
        const query = params.toString().replace(/ordering=%2B/g, "ordering=+");
        endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/device-authorizations/?${query}`;
      } else {
        const params = new URLSearchParams({
          page: "1",
          page_size: "100",
        });
        endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/device-authorizations/?${params.toString()}`;
      }
      
      const data = await apiFetch(endpoint)
      console.log('Device Authorizations API response:', data)
      setAuthorizations(Array.isArray(data) ? data : data.results || [])
      toast({
        title: t("deviceAuthorizations.success"),
        description: t("deviceAuthorizations.loadedSuccessfully"),
      })
    } catch (err: any) {
      console.log('Device Authorizations fetch error caught:', err)
      const errorMessage = extractErrorMessages(err) || t("deviceAuthorizations.failedToLoad")
      setError(errorMessage)
      setAuthorizations([])
      toast({
        title: t("deviceAuthorizations.failedToLoad"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: "created_at" | "partner_name") => {
    if (sortField === field) {
      setSortDirection(prev => prev === "+" ? "-" : "+")
      setSortField(field)
    } else {
      setSortField(field)
      setSortDirection("-")
    }
  }

  const handleCreate = async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`${baseUrl}api/payments/betting/admin/device-authorizations/`, {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      
      toast({
        title: t("deviceAuthorizations.success"),
        description: t("deviceAuthorizations.createdSuccessfully"),
      })
      
      setIsCreateDialogOpen(false)
      setFormData({ partner: "", origin_device: "", is_active: true, notes: "" })
      fetchAuthorizations()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("deviceAuthorizations.failedToCreate")
      toast({
        title: t("deviceAuthorizations.failedToCreate"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedAuthorization) return
    
    try {
      setLoading(true)
      const response = await apiFetch(`${baseUrl}api/payments/betting/admin/device-authorizations/${selectedAuthorization.uid}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_active: formData.is_active,
          notes: formData.notes
        })
      })
      
      toast({
        title: t("deviceAuthorizations.success"),
        description: t("deviceAuthorizations.updatedSuccessfully"),
      })
      
      setIsEditDialogOpen(false)
      setSelectedAuthorization(null)
      setFormData({ partner: "", origin_device: "", is_active: true, notes: "" })
      fetchAuthorizations()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("deviceAuthorizations.failedToUpdate")
      toast({
        title: t("deviceAuthorizations.failedToUpdate"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (authorization: any) => {
    try {
      setToggleLoading(authorization.uid)
      const response = await apiFetch(`${baseUrl}api/payments/betting/admin/device-authorizations/${authorization.uid}/toggle_active/`, {
        method: 'POST',
        body: JSON.stringify({
          is_active: !authorization.is_active,
          notes: authorization.notes || ""
        })
      })
      
      toast({
        title: t("deviceAuthorizations.success"),
        description: t("deviceAuthorizations.toggledSuccessfully"),
      })
      
      fetchAuthorizations()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("deviceAuthorizations.failedToToggle")
      toast({
        title: t("deviceAuthorizations.failedToToggle"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setToggleLoading(null)
    }
  }

  const openEditDialog = (authorization: any) => {
    setSelectedAuthorization(authorization)
    setFormData({
      partner: authorization.partner || "",
      origin_device: authorization.origin_device_uid || "",
      is_active: authorization.is_active,
      notes: authorization.notes || ""
    })
    setIsEditDialogOpen(true)
  }

  const filteredAuthorizations = authorizations

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{t("deviceAuthorizations.list") || "Device Authorizations"}</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("deviceAuthorizations.create") || "Create Authorization"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("deviceAuthorizations.create") || "Create Device Authorization"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="partner">{t("deviceAuthorizations.partner") || "Partner"}</Label>
                  <Input
                    id="partner"
                    value={formData.partner}
                    onChange={(e) => setFormData({ ...formData, partner: e.target.value })}
                    placeholder={t("deviceAuthorizations.partnerPlaceholder") || "Enter partner ID"}
                  />
                </div>
                <div>
                  <Label htmlFor="origin_device">{t("deviceAuthorizations.originDevice") || "Origin Device"}</Label>
                  <Input
                    id="origin_device"
                    value={formData.origin_device}
                    onChange={(e) => setFormData({ ...formData, origin_device: e.target.value })}
                    placeholder={t("deviceAuthorizations.originDevicePlaceholder") || "Enter device ID"}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <Label htmlFor="is_active">{t("deviceAuthorizations.isActive") || "Is Active"}</Label>
                </div>
                <div>
                  <Label htmlFor="notes">{t("deviceAuthorizations.notes") || "Notes"}</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t("deviceAuthorizations.notesPlaceholder") || "Enter notes"}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t("common.cancel") || "Cancel"}
                </Button>
                <Button onClick={handleCreate} disabled={loading}>
                  {loading ? t("common.loading") : t("common.create") || "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
              <SelectValue placeholder={t("deviceAuthorizations.status") || "Status"} />
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
                {t("deviceAuthorizations.startDate") || "Start Date"}
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
                {t("deviceAuthorizations.endDate") || "End Date"}
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
              {t("deviceAuthorizations.clearDates") || "Clear Dates"}
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
              fetchAuthorizations()
            }}
            variant="inline"
            className="mb-6"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("deviceAuthorizations.uid") || "UID"}</TableHead>
                <TableHead>
                  <Button type="button" variant="ghost" onClick={() => handleSort("partner_name")} className="h-auto p-0 font-semibold">
                    {t("deviceAuthorizations.partner") || "Partner"}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>{t("deviceAuthorizations.originDevice") || "Origin Device"}</TableHead>
                <TableHead>{t("deviceAuthorizations.status") || "Status"}</TableHead>
                <TableHead>
                  <Button type="button" variant="ghost" onClick={() => handleSort("created_at")} className="h-auto p-0 font-semibold">
                    {t("deviceAuthorizations.createdAt") || "Created At"}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>{t("deviceAuthorizations.notes") || "Notes"}</TableHead>
                <TableHead>{t("deviceAuthorizations.actions") || "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAuthorizations.map((authorization: any) => (
                <TableRow key={authorization.uid}>
                  <TableCell className="font-mono text-xs">{authorization.uid}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{authorization.partner_name}</div>
                      <div className="text-sm text-gray-500">ID: {authorization.partner}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{authorization.origin_device_display}</div>
                      <div className="text-sm text-gray-500 font-mono">{authorization.origin_device_uid}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={authorization.is_active ? "default" : "secondary"}>
                      {authorization.is_active ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(authorization.created_at).toLocaleString()}</TableCell>
                  <TableCell className="max-w-xs truncate">{authorization.notes || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(authorization)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(authorization)}
                        disabled={toggleLoading === authorization.uid}
                      >
                        {authorization.is_active ? (
                          <ToggleLeft className="h-4 w-4" />
                        ) : (
                          <ToggleRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("deviceAuthorizations.edit") || "Edit Device Authorization"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_is_active">{t("deviceAuthorizations.isActive") || "Is Active"}</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <Label htmlFor="edit_is_active">{formData.is_active ? t("common.active") : t("common.inactive")}</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="edit_notes">{t("deviceAuthorizations.notes") || "Notes"}</Label>
                <Textarea
                  id="edit_notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t("deviceAuthorizations.notesPlaceholder") || "Enter notes"}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t("common.cancel") || "Cancel"}
              </Button>
              <Button onClick={handleUpdate} disabled={loading}>
                {loading ? t("common.loading") : t("common.update") || "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
