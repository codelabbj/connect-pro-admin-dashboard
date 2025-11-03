"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/components/providers/language-provider"
import { useApi } from "@/lib/useApi"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Eye, MoreHorizontal } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function TransfersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [senderFilter, setSenderFilter] = useState("")
  const [receiverFilter, setReceiverFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<"amount" | "date" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [transfers, setTransfers] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [statistics, setStatistics] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState("")
  const { t } = useLanguage()
  const itemsPerPage = 20
  const apiFetch = useApi()
  const { toast } = useToast()
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null)

  // Fetch transfers from API
  const fetchTransfers = async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: itemsPerPage.toString(),
        ordering: "-created_at"
      })
      
      if (searchTerm.trim() !== "") {
        params.append("search", searchTerm)
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (senderFilter.trim() !== "") {
        params.append("sender", senderFilter)
      }
      if (receiverFilter.trim() !== "") {
        params.append("receiver", receiverFilter)
      }
      if (startDate) {
        params.append("created_at__gte", startDate)
      }
      if (endDate) {
        const endDateObj = new Date(endDate)
        endDateObj.setDate(endDateObj.getDate() + 1)
        params.append("created_at__lt", endDateObj.toISOString().split('T')[0])
      }
      
      const endpoint = `${baseUrl}api/payments/betting/admin/partner-transfers/?${params.toString()}`
      const data = await apiFetch(endpoint)
      setTransfers(data.results || [])
      setTotalCount(data.count || 0)
      // GET requests don't show success toasts automatically
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("transfers.failedToLoad") || "Failed to load transfers"
      setError(errorMessage)
      setTransfers([])
      setTotalCount(0)
      toast({
        title: t("transfers.failedToLoad") || "Failed to load transfers",
        description: errorMessage,
        variant: "destructive",
      })
      console.error('Transfers fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch statistics
  const fetchStatistics = async () => {
    setStatsLoading(true)
    setStatsError("")
    try {
      const params = new URLSearchParams()
      if (startDate) {
        params.append("created_at__gte", startDate)
      }
      if (endDate) {
        const endDateObj = new Date(endDate)
        endDateObj.setDate(endDateObj.getDate() + 1)
        params.append("created_at__lt", endDateObj.toISOString().split('T')[0])
      }
      
      const endpoint = `${baseUrl}api/payments/betting/admin/partner-transfers/statistics/?${params.toString()}`
      const data = await apiFetch(endpoint)
      setStatistics(data)
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("transfers.failedToLoadStats") || "Failed to load statistics"
      setStatsError(errorMessage)
      console.error('Statistics fetch error:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransfers()
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, senderFilter, receiverFilter, startDate, endDate, sortField, sortDirection])

  useEffect(() => {
    fetchStatistics()
  }, [startDate, endDate])

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage

  const handleSort = (field: "amount" | "date") => {
    setCurrentPage(1)
    setSortDirection((prevDir) => (sortField === field ? (prevDir === "desc" ? "asc" : "desc") : "desc"))
    setSortField(field)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: "En attente", color: "#ffc107" },
      completed: { label: "Terminé", color: "#28a745" },
      failed: { label: "Échec", color: "#dc3545" },
      cancelled: { label: "Annulé", color: "#6c757d" },
    }
    
    const info = statusMap[status] || { label: status, color: "#adb5bd" }
    return (
      <span
        style={{
          backgroundColor: info.color,
          color: "#fff",
          borderRadius: "0.375rem",
          padding: "0.25em 0.75em",
          fontWeight: 500,
          fontSize: "0.875rem",
          display: "inline-block",
        }}
      >
        {info.label}
      </span>
    )
  }

  const showTransferDetails = (transfer: any) => {
    setSelectedTransfer(transfer)
    setDetailModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Transfers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.global_stats?.total_transfers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.global_stats?.completed_transfers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseFloat(statistics.global_stats?.total_amount || 0).toLocaleString()} FCFA</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseFloat(statistics.global_stats?.average_amount || 0).toLocaleString()} FCFA</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("transfers.title") || "Partner Transfers"}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t("common.search") || "Search..."}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <Input
              placeholder="Sender ID"
              value={senderFilter}
              onChange={(e) => {
                setSenderFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full lg:w-48"
            />
            <Input
              placeholder="Receiver ID"
              value={receiverFilter}
              onChange={(e) => {
                setReceiverFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full lg:w-48"
            />
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

          {/* Error display */}
          {error && (
            <div className="mb-4">
              <ErrorDisplay
                error={error}
                onRetry={fetchTransfers}
                variant="full"
                showDismiss={false}
              />
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border min-h-[200px]">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">{t("common.loading") || "Loading..."}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>
                      <Button type="button" variant="ghost" onClick={() => handleSort("amount")} className="h-auto p-0 font-semibold">
                        Amount
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Fees</TableHead>
                    <TableHead>
                      <Button type="button" variant="ghost" onClick={() => handleSort("date")} className="h-auto p-0 font-semibold">
                        Created At
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No transfers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    transfers.map((transfer) => (
                      <TableRow key={transfer.uid}>
                        <TableCell>{transfer.reference || "-"}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{transfer.sender_name || "-"}</div>
                            <div className="text-sm text-muted-foreground">{transfer.sender_email || "-"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{transfer.receiver_name || "-"}</div>
                            <div className="text-sm text-muted-foreground">{transfer.receiver_email || "-"}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{parseFloat(transfer.amount).toLocaleString()} FCFA</TableCell>
                        <TableCell>{parseFloat(transfer.fees).toLocaleString()} FCFA</TableCell>
                        <TableCell>{transfer.created_at ? new Date(transfer.created_at).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => showTransferDetails(transfer)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalCount)} of {totalCount}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
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
                disabled={currentPage === totalPages || loading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              <div className="space-y-1">
                <div>Transfer Details</div>
                <div className="text-sm font-normal text-muted-foreground">
                  {selectedTransfer?.reference}
                </div>
              </div>
            </DialogTitle>
            <DialogDescription>
              Detailed information about this partner transfer
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransfer && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Sender Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sender Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div><strong>ID:</strong> {selectedTransfer.sender}</div>
                    <div><strong>Name:</strong> {selectedTransfer.sender_name}</div>
                    <div><strong>Email:</strong> {selectedTransfer.sender_email}</div>
                    <div><strong>Balance Before:</strong> {parseFloat(selectedTransfer.sender_balance_before).toLocaleString()} FCFA</div>
                    <div><strong>Balance After:</strong> {parseFloat(selectedTransfer.sender_balance_after).toLocaleString()} FCFA</div>
                  </div>
                </CardContent>
              </Card>

              {/* Receiver Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Receiver Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div><strong>ID:</strong> {selectedTransfer.receiver}</div>
                    <div><strong>Name:</strong> {selectedTransfer.receiver_name}</div>
                    <div><strong>Email:</strong> {selectedTransfer.receiver_email}</div>
                    <div><strong>Balance Before:</strong> {parseFloat(selectedTransfer.receiver_balance_before).toLocaleString()} FCFA</div>
                    <div><strong>Balance After:</strong> {parseFloat(selectedTransfer.receiver_balance_after).toLocaleString()} FCFA</div>
                  </div>
                </CardContent>
              </Card>

              {/* Transfer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transfer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div><strong>Transfer ID:</strong> {selectedTransfer.uid}</div>
                    <div><strong>Reference:</strong> {selectedTransfer.reference}</div>
                    <div><strong>Amount:</strong> {parseFloat(selectedTransfer.amount).toLocaleString()} FCFA</div>
                    <div><strong>Fees:</strong> {parseFloat(selectedTransfer.fees).toLocaleString()} FCFA</div>
                    <div><strong>Status:</strong> {getStatusBadge(selectedTransfer.status)}</div>
                    <div><strong>Description:</strong> {selectedTransfer.description || "-"}</div>
                    <div><strong>Created At:</strong> {selectedTransfer.created_at ? new Date(selectedTransfer.created_at).toLocaleString() : "-"}</div>
                    <div><strong>Completed At:</strong> {selectedTransfer.completed_at ? new Date(selectedTransfer.completed_at).toLocaleString() : "-"}</div>
                    {selectedTransfer.failed_reason && (
                      <div className="col-span-2">
                        <strong>Failed Reason:</strong> {selectedTransfer.failed_reason}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}