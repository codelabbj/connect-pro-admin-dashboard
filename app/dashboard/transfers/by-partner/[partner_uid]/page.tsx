"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/components/providers/language-provider"
import { useApi } from "@/lib/useApi"
import { Search, ChevronLeft, ChevronRight, ArrowLeft, ArrowUpDown, Eye, MoreHorizontal } from "lucide-react"
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
import { useRouter } from "next/navigation"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function PartnerTransfersPage() {
  const params = useParams()
  const partnerUid = params.partner_uid as string
  const router = useRouter()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [transfers, setTransfers] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [partnerInfo, setPartnerInfo] = useState<any>(null)
  const { t } = useLanguage()
  const itemsPerPage = 20
  const apiFetch = useApi()
  const { toast } = useToast()
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null)

  // Fetch partner info
  const fetchPartnerInfo = async () => {
    try {
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/partners/${partnerUid}/`
      const data = await apiFetch(endpoint)
      setPartnerInfo(data)
    } catch (err: any) {
      console.error('Partner info fetch error:', err)
    }
  }

  // Fetch transfers from API
  const fetchTransfers = async () => {
    if (!partnerUid) return
    
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
      if (startDate) {
        params.append("created_at__gte", startDate)
      }
      if (endDate) {
        const endDateObj = new Date(endDate)
        endDateObj.setDate(endDateObj.getDate() + 1)
        params.append("created_at__lt", endDateObj.toISOString().split('T')[0])
      }
      
      const endpoint = `${baseUrl}api/payments/betting/admin/partner-transfers/by-partner/?partner_uid=${partnerUid}&${params.toString()}`
      const data = await apiFetch(endpoint)
      setTransfers(data.results || [])
      setTotalCount(data.count || 0)
      toast({
        title: t("transfers.success") || "Success",
        description: t("transfers.loadedSuccessfully") || "Transfers loaded successfully",
      })
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

  useEffect(() => {
    fetchPartnerInfo()
    fetchTransfers()
  }, [partnerUid])

  useEffect(() => {
    fetchTransfers()
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, startDate, endDate])

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage

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
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
        <h1 className="text-2xl font-bold">{t("transfers.partnerTransfers") || "Partner Transfers"}</h1>
          {partnerInfo && (
            <p className="text-muted-foreground">
              Transfers for {partnerInfo.display_name || `${partnerInfo.first_name} ${partnerInfo.last_name}`} ({partnerInfo.email})
            </p>
          )}
        </div>
      </div>

      {/* Partner Info Card */}
      {partnerInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Partner Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">UID</div>
                <div className="font-medium">{partnerInfo.uid}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{partnerInfo.email}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="font-medium">{partnerInfo.phone || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Account Balance</div>
                <div className="font-medium">{parseFloat(partnerInfo.account_balance || 0).toLocaleString()} FCFA</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("transfers.transferHistory") || "Transfer History"}</CardTitle>
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
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Fees</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No transfers found for this partner
                      </TableCell>
                    </TableRow>
                  ) : (
                    transfers.map((transfer) => {
                      const isSender = transfer.sender === partnerUid
                      const transferType = isSender ? "Sent" : "Received"
                      const counterParty = isSender ? transfer.receiver_name : transfer.sender_name
                      
                      return (
                        <TableRow key={transfer.uid}>
                          <TableCell>{transfer.reference || "-"}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className={`font-medium ${isSender ? 'text-red-600' : 'text-green-600'}`}>
                                {transferType}
                              </div>
                              <div className="text-sm text-muted-foreground">to {counterParty}</div>
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
                      )
                    })
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

