"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, MoreHorizontal, DollarSign, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/lib/useApi"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import Link from "next/link"
import { CopyIcon } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function BettingTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [commissionPaidFilter, setCommissionPaidFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [transactions, setTransactions] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [stats, setStats] = useState<any | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [platformsLoading, setPlatformsLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<"created_at" | "amount" | "partner_name" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  
  const itemsPerPage = 20
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const { toast } = useToast()
  const { t } = useLanguage()
  const apiFetch = useApi()
  
  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null)
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false)
  const [processingCancellation, setProcessingCancellation] = useState(false)
  const [cancellationNotes, setCancellationNotes] = useState("")

  // Fetch platforms for filtering
  useEffect(() => {
    const fetchPlatforms = async () => {
      setPlatformsLoading(true)
      try {
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/platforms/?is_active=true&page_size=100`
        const data = await apiFetch(endpoint)
        setPlatforms(data.results || [])
      } catch (err) {
        console.warn("Could not fetch platforms:", err)
      } finally {
        setPlatformsLoading(false)
      }
    }
    fetchPlatforms()
  }, [])

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
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

        if (statusFilter !== "all") {
          params.append("status", statusFilter)
        }

        if (transactionTypeFilter !== "all") {
          params.append("transaction_type", transactionTypeFilter)
        }

        if (platformFilter !== "all") {
          params.append("platform", platformFilter)
        }

        if (commissionPaidFilter !== "all") {
          params.append("commission_paid", commissionPaidFilter === "paid" ? "true" : "false")
        }

        // Add date filters
        if (startDate) {
          params.append("created_at__gte", `${startDate}T00:00:00Z`)
        }
        if (endDate) {
          params.append("created_at__lt", `${endDate}T23:59:59Z`)
        }

        // Get sorting
        let ordering = ""
        if (sortField === "amount") {
          ordering = `${sortDirection === "asc" ? "" : "-"}amount`
        } else if (sortField === "partner_name") {
          ordering = `${sortDirection === "asc" ? "" : "-"}partner_name`
        } else if (sortField === "created_at") {
          ordering = `${sortDirection === "asc" ? "" : "-"}created_at`
        } else {
          ordering = "-created_at" // default
        }
        
        params.append("ordering", ordering)

        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/transactions/?${params.toString()}`
        const data = await apiFetch(endpoint)
        
        setTransactions(data.results || [])
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
        
        toast({
          title: t("bettingTransactions.transactionsLoaded"),
          description: t("bettingTransactions.transactionsLoadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        setTransactions([])
        setTotalCount(0)
        setTotalPages(1)
        toast({
          title: t("bettingTransactions.failedToLoadTransactions"),
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [searchTerm, statusFilter, transactionTypeFilter, platformFilter, commissionPaidFilter, currentPage, startDate, endDate, sortField, sortDirection])

  // Fetch transaction statistics
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true)
      try {
        const params = new URLSearchParams()
        if (startDate) {
          params.append("date_from", startDate)
        }
        if (endDate) {
          params.append("date_to", endDate)
        }
        
        const queryString = params.size > 0 ? `?${params.toString()}` : ""
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/transactions/stats/${queryString}`
        const data = await apiFetch(endpoint)
        setStats(data)
      } catch (err) {
        console.warn("Could not fetch statistics:", err)
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [startDate, endDate])

  const handleSort = (field: "created_at" | "amount" | "partner_name") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Fetch transaction details
  const handleOpenDetail = async (transaction: any) => {
    setDetailModalOpen(true)
    setSelectedTransaction(transaction)
    
    try {
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/transactions/${transaction.uid}/`
      const detailedTransaction = await apiFetch(endpoint)
      setSelectedTransaction(detailedTransaction)
    } catch (err) {
      toast({
        title: t("common.warning"),
        description: t("bettingTransactions.couldNotLoadTransactionDetails") || "Could not load detailed transaction information",
        variant: "destructive",
      })
    }
  }

  // Process cancellation request
  const handleProcessCancellation = async () => {
    if (!selectedTransaction) return
    
    setProcessingCancellation(true)
    try {
      const payload = {
        admin_notes: cancellationNotes || "Cancellation approved by admin"
      }
      
      await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/transactions/${selectedTransaction.uid}/process_cancellation/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      toast({
        title: t("bettingTransactions.cancellationProcessed"),
        description: t("bettingTransactions.cancellationProcessedSuccessfully"),
      })
      
      // Refresh transactions
      setCancellationModalOpen(false)
      setCancellationNotes("")
      
      // Reload transactions to reflect changes
      window.location.reload() // Simple refresh for now
      
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      toast({
        title: t("bettingTransactions.cancellationFailed"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setProcessingCancellation(false)
    }
  }

  const startIndex = (currentPage - 1) * itemsPerPage

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      success: "default",
      failed: "destructive",
      pending: "outline",
      cancelled: "secondary",
      cancellation_requested: "secondary"
    }
    
    return <Badge variant={variants[status] || "outline"}>{status.replace(/_/g, " ").toUpperCase()}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "destructive" | "outline"> = {
      deposit: "default",
      withdraw: "destructive",
      withdrawal: "destructive"
    }
    
    return <Badge variant={variants[type] || "outline"}>{type.toUpperCase()}</Badge>
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t("bettingTransactions.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Statistics Cards */}
          {statsLoading ? (
            <div className="text-center py-4">{t("commissionPayments.loadingStatistics") || "Loading statistics..."}</div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm font-medium text-blue-600 mb-1">{t("bettingTransactions.totalTransactions")}</div>
                <div className="text-2xl font-bold text-blue-600">{stats.total_transactions}</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm font-medium text-green-600 mb-1">{t("bettingTransactions.successful")}</div>
                <div className="text-2xl font-bold text-green-600">{stats.successful_transactions}</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-sm font-medium text-red-600 mb-1">{t("bettingTransactions.failed")}</div>
                <div className="text-2xl font-bold text-red-600">{stats.failed_transactions}</div>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-sm font-medium text-orange-600 mb-1">{t("bettingTransactions.totalVolume")}</div>
                <div className="text-2xl font-bold text-orange-600">{stats.total_volume}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground mb-6">{t("commissionPayments.noStatisticsAvailable") || "No statistics available"}</div>
          )}

          {/* Search and Filter Controls */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t("bettingTransactions.search") || "Search transactions... (reference, partner, platform)"}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder={t("bettingTransactions.filterByStatus") || "Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("bettingTransactions.allStatus") || "All Statuses"}</SelectItem>
                  <SelectItem value="success">{t("bettingTransactions.successful") || "Success"}</SelectItem>
                  <SelectItem value="failed">{t("bettingTransactions.failed") || "Failed"}</SelectItem>
                  <SelectItem value="pending">{t("bettingTransactions.pending") || "Pending"}</SelectItem>
                  <SelectItem value="cancelled">{t("bettingTransactions.cancelled") || "Cancelled"}</SelectItem>
                  <SelectItem value="cancellation_requested">{t("bettingTransactions.cancellationRequested") || "Cancellation Requested"}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder={t("bettingTransactions.filterByType") || "Type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("bettingTransactions.allTypes") || "All Types"}</SelectItem>
                  <SelectItem value="deposit">{t("bettingTransactions.deposit") || "Deposit"}</SelectItem>
                  <SelectItem value="withdraw">{t("bettingTransactions.withdraw") || "Withdraw"}</SelectItem>
                  <SelectItem value="withdrawal">{t("bettingTransactions.withdrawal") || "Withdrawal"}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder={t("bettingTransactions.filterByPlatform") || "Platform"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("bettingTransactions.allPlatforms") || "All Platforms"}</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.uid} value={platform.uid}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={commissionPaidFilter} onValueChange={setCommissionPaidFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder={t("bettingTransactions.filterByCommission") || "Commission"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("bettingTransactions.allCommission") || "All"}</SelectItem>
                  <SelectItem value="paid">{t("bettingTransactions.paid") || "Paid"}</SelectItem>
                  <SelectItem value="unpaid">{t("bettingTransactions.unpaid") || "Unpaid"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{t("common.startDate")}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{t("common.endDate")}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Transactions Table */}
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
                     <TableHead>{t("bettingTransactions.uid")}</TableHead>
                    <TableHead>{t("bettingTransactions.reference")}</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("partner_name")} className="h-auto p-0 font-semibold">
                        {t("bettingTransactions.partner")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>{t("bettingTransactions.platform")}</TableHead>
                    <TableHead>{t("bettingTransactions.type")}</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("amount")} className="h-auto p-0 font-semibold">
                        {t("bettingTransactions.amount")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>{t("bettingTransactions.status")}</TableHead>
                    <TableHead>{t("bettingTransactions.commissionStatus")}</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("created_at")} className="h-auto p-0 font-semibold">
                        {t("bettingTransactions.createdAt")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>{t("bettingTransactions.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.uid}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="px-1 py-0.5 bg-muted rounded text-xs">
                            {transaction.uid.slice(0, 8)}...
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => {
                              navigator.clipboard.writeText(transaction.uid)
                              toast({ title: t("common.uidCopied") })
                            }}
                          >
                            <CopyIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{transaction.reference}</code>
                      </TableCell>
                      <TableCell className="font-medium">{transaction.partner_name}</TableCell>
                      <TableCell>{transaction.platform_name}</TableCell>
                      <TableCell>{getTypeBadge(transaction.transaction_type)}</TableCell>
                      <TableCell className="font-medium">{transaction.amount} XOF</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{transaction.commission_amount} XOF</span>
                          {!transaction.commission_paid && (
                            <Badge variant="outline" className="text-xs">{t("bettingTransactions.unpaid")}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDetail(transaction)}>
                              {t("bettingTransactions.viewDetails") || "View Details"}
                            </DropdownMenuItem>
                            {transaction.status === "cancellation_requested" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTransaction(transaction)
                                  setCancellationModalOpen(true)
                                }}
                                className="text-orange-600"
                              >
                                {t("bettingTransactions.processCancellation")}
                              </DropdownMenuItem>
                            )}
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
              {t("bettingTransactions.showing")}: {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalCount)} {t("bettingTransactions.of")} {totalCount}
            </div>
            <div className="text-sm">
              {t("bettingTransactions.page")} {currentPage} {t("bettingTransactions.of")} {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("bettingTransactions.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                {t("bettingTransactions.next")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("bettingTransactions.transactionDetailsTitle")}</DialogTitle>
          </DialogHeader>
          {selectedTransaction ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <strong>{t("common.uid")}:</strong> {selectedTransaction.uid}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedTransaction.uid)
                        toast({ title: t("common.uidCopied") })
                      }}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div><strong>{t("bettingTransactions.reference")}:</strong> {selectedTransaction.reference}</div>
                  <div><strong>{t("bettingTransactions.transactionType")}:</strong> {selectedTransaction.transaction_type?.toUpperCase()}</div>
                  <div><strong>{t("bettingTransactions.amount")}:</strong> {selectedTransaction.amount} XOF</div>
                  <div><strong>{t("bettingTransactions.status")}:</strong> {getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div className="space-y-2">
                  <div><strong>{t("bettingTransactions.partnerName")}:</strong> {selectedTransaction.partner_name}</div>
                  <div><strong>{t("bettingTransactions.platformName")}:</strong> {selectedTransaction.platform_name}</div>
                  <div><strong>{t("bettingTransactions.bettingUserId")}:</strong> {selectedTransaction.betting_user_id || t("bettingCommission.notApplicable")}</div>
                  <div><strong>{t("bettingTransactions.externalTransactionId")}:</strong> {selectedTransaction.external_transaction_id || t("bettingCommission.notApplicable")}</div>
                </div>
              </div>

              {/* Commission Information */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">{t("bettingTransactions.commissionInformation")}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><strong>{t("bettingTransactions.commissionRate")}:</strong> {selectedTransaction.commission_rate}%</div>
                  <div><strong>{t("bettingTransactions.commissionAmountDetail")}:</strong> {selectedTransaction.commission_amount} XOF</div>
                  <div><strong>{t("bettingTransactions.commissionPaid")}:</strong> {selectedTransaction.commission_paid ? t("common.yes") : t("common.no")}</div>
                  <div><strong>{t("bettingTransactions.paidAt")}:</strong> {selectedTransaction.commission_paid_at ? new Date(selectedTransaction.commission_paid_at).toLocaleString() : t("bettingTransactions.notPaid")}</div>
                </div>
              </div>

              {/* Partner Balance */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">{t("bettingTransactions.partnerBalanceImpact")}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><strong>{t("bettingTransactions.balanceBeforeDetail")}:</strong> {selectedTransaction.partner_balance_before} XOF</div>
                  <div><strong>{t("bettingTransactions.balanceAfterDetail")}:</strong> {selectedTransaction.partner_balance_after} XOF</div>
                </div>
              </div>

              {/* Timing Information */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">{t("bettingTransactions.transactionTimeline")}</h4>
                <div className="space-y-2">
                  <div><strong>{t("bettingTransactions.createdDetail")}:</strong> {selectedTransaction.created_at ? new Date(selectedTransaction.created_at).toLocaleString() : t("platforms.unknown")}</div>
                  <div><strong>{t("bettingTransactions.lastUpdatedDetail")}:</strong> {selectedTransaction.updated_at ? new Date(selectedTransaction.updated_at).toLocaleString() : t("platforms.unknown")}</div>
                  {selectedTransaction.cancellation_requested_at && (
                    <div><strong>{t("bettingTransactions.cancellationRequested")}:</strong> {new Date(selectedTransaction.cancellation_requested_at).toLocaleString()}</div>
                  )}
                  {selectedTransaction.cancelled_at && (
                    <div><strong>{t("bettingTransactions.cancelled")}:</strong> {new Date(selectedTransaction.cancelled_at).toLocaleString()}</div>
                  )}
                </div>
              </div>

              {/* External Response */}
              {selectedTransaction.external_response && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">{t("bettingTransactions.externalPlatformResponse")}</h4>
                  <div className="bg-muted p-3 rounded">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(selectedTransaction.external_response, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedTransaction.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">{t("bettingTransactions.notes")}</h4>
                  <div className="bg-muted p-3 rounded whitespace-pre-wrap">
                    {selectedTransaction.notes}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Cancellation Processing Modal */}
      <AlertDialog open={cancellationModalOpen} onOpenChange={setCancellationModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bettingTransactions.processTransactionCancellation")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bettingTransactions.cancellationApprovalDescription")?.replace("{reference}", selectedTransaction?.reference || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("bettingTransactions.adminNotesOptional")}</label>
              <textarea
                value={cancellationNotes}
                onChange={(e) => setCancellationNotes(e.target.value)}
                placeholder={t("bettingTransactions.cancellationNotesPlaceholder")}
                className="w-full p-2 border rounded mt-1"
                rows={3}
              />
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">{t("bettingTransactions.transactionInformation")}:</h4>
              <div className="text-sm text-red-800 dark:text-red-200 space-y-1">
                <div><strong>{t("bettingTransactions.amount")}:</strong> {selectedTransaction?.amount} XOF</div>
                <div><strong>{t("bettingTransactions.partnerName")}:</strong> {selectedTransaction?.partner_name}</div>
                <div><strong>{t("bettingTransactions.platformName")}:</strong> {selectedTransaction?.platform_name}</div>
                <div><strong>{t("bettingTransactions.commissionLoss")}:</strong> {selectedTransaction?.commission_amount} XOF</div>
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcessCancellation}
              disabled={processingCancellation}
              className="bg-red-600 hover:bg-red-700"
            >
              {processingCancellation ? t("bettingTransactions.processing") : t("bettingTransactions.approveCancellation")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
