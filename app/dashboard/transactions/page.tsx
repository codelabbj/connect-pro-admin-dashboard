"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/components/providers/language-provider"
import { useApi } from "@/lib/useApi"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Pencil, Trash, MoreHorizontal } from "lucide-react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
// import { useWebSocket } from "@/components/providers/websocket-provider"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<"amount" | "date" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [transactions, setTransactions] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { t } = useLanguage()
  const itemsPerPage = 10
  const apiFetch = useApi()
  const { toast } = useToast()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState("")
  const [editTransaction, setEditTransaction] = useState<any | null>(null)
  const [deleteUid, setDeleteUid] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const router = useRouter()
  const [showEditConfirm, setShowEditConfirm] = useState(false)
  const [pendingEditPayload, setPendingEditPayload] = useState<any | null>(null)

  // Edit form state
  const [editForm, setEditForm] = useState({
    status: "",
    external_transaction_id: "",
    balance_before: "",
    balance_after: "",
    fees: "",
    confirmation_message: "",
    raw_sms: "",
    completed_at: "",
    error_message: "",
  })

  // Fetch transactions from API
  const fetchTransactions = async () => {
    setLoading(true)
    setError("")
    try {
      let endpoint = "";
      if (searchTerm.trim() !== "" || statusFilter !== "all" || typeFilter !== "all" || sortField || startDate || endDate) {
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
        if (typeFilter !== "all") {
          params.append("trans_type", typeFilter);
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
          const orderBy = sortField === "date" ? "created_at" : "amount";
          const prefix = sortDirection === "desc" ? "-" : "+";
          params.append("ordering", `${prefix}${orderBy}`);
          
        }
        endpoint = `${baseUrl}api/payments/transactions/?${params.toString()}`;
      } else {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: itemsPerPage.toString(),
        });
        endpoint = `${baseUrl}api/payments/transactions/?${params.toString()}`;
      }
      const data = await apiFetch(endpoint)
      setTransactions(data.results || [])
      setTotalCount(data.count || 0)
      toast({
        title: t("transactions.success"),
        description: t("transactions.loadedSuccessfully"),
      })
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("transactions.failedToLoad")
      setError(errorMessage)
      setTransactions([])
      setTotalCount(0)
      toast({
        title: t("transactions.failedToLoad"),
        description: errorMessage,
        variant: "destructive",
      })
      console.error('Transactions fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [currentPage, itemsPerPage, baseUrl, searchTerm, statusFilter, typeFilter, startDate, endDate, sortField, sortDirection])

  // Remove client-side filtering and sorting since it's now handled by the API
  const filteredAndSortedTransactions = transactions
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = filteredAndSortedTransactions

  const handleSort = (field: "amount" | "date") => {
    setCurrentPage(1)
    // Toggle direction if clicking the same field, else reset to desc
    setSortDirection((prevDir) => (sortField === field ? (prevDir === "desc" ? "asc" : "desc") : "desc"))
    setSortField(field)
  }

  
    const statusMap: Record<string, { label: string; color: string }> = {
      pending:      { label: "En attente", color: "#ffc107" },      // jaune
      sent_to_user: { label: "Envoyé", color: "#17a2b8" },          // bleu clair
      processing:   { label: "En cours", color: "#fd7e14" },        // orange
      completed:    { label: "Terminé", color: "#28a745" },         // vert foncé
      success:      { label: "Succès", color: "#20c997" },          // turquoise
      failed:       { label: "Échec", color: "#dc3545" },           // rouge
      cancelled:    { label: "Annulé", color: "#6c757d" },          // gris
      timeout:      { label: "Expiré", color: "#6f42c1" },          // violet
    };

    const getStatusBadge = (status: string) => {
      const info = statusMap[status] || { label: status, color: "#adb5bd" };
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
      );
    };
   

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      deposit: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      withdrawal: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      transfer: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    }
    return <Badge className={colors[type] || ""}>{t(`transactions.${type}`) || type}</Badge>
  }

  // Open edit modal and populate form
  const handleOpenEdit = (transaction: any) => {
    setEditTransaction(transaction)
    setEditForm({
      status: transaction.status || "",
      external_transaction_id: transaction.external_transaction_id || "",
      balance_before: transaction.balance_before || "",
      balance_after: transaction.balance_after || "",
      fees: transaction.fees || "",
      confirmation_message: transaction.confirmation_message || "",
      raw_sms: transaction.raw_sms || "",
      completed_at: transaction.completed_at || "",
      error_message: transaction.error_message || "",
    })
    setEditModalOpen(true)
    setEditError("")
  }
  // Handle edit form change
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }
  // Submit edit -> open confirm modal
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTransaction) return
    const payload = { ...editForm }
    setPendingEditPayload(payload)
    setShowEditConfirm(true)
  }

  // Confirm and send PATCH
  const confirmEditAndSend = async () => {
    if (!editTransaction || !pendingEditPayload) return
    setEditLoading(true)
    setEditError("")
    try {
      const endpoint = `${baseUrl}api/payments/transactions/${editTransaction.uid}/`
      await apiFetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingEditPayload),
      })
      toast({ title: t("transactions.editSuccess"), description: t("transactions.transactionUpdatedSuccessfully") })
      setShowEditConfirm(false)
      setPendingEditPayload(null)
      setEditModalOpen(false)
      setEditTransaction(null)
      setEditForm({
        status: "",
        external_transaction_id: "",
        balance_before: "",
        balance_after: "",
        fees: "",
        confirmation_message: "",
        raw_sms: "",
        completed_at: "",
        error_message: "",
      })
      setCurrentPage(1)
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const backendError = extractErrorMessages(err) || t("transactions.failedToEdit")
      setEditError(backendError)
      toast({ title: t("transactions.failedToEdit"), description: backendError, variant: "destructive" })
    } finally {
      setEditLoading(false)
    }
  }
  // Delete transaction
  const handleDelete = async () => {
    if (!deleteUid) return
    setLoading(true)
    setError("")
    try {
      const endpoint = `${baseUrl}api/payments/transactions/${deleteUid}/`
      await apiFetch(endpoint, { method: "DELETE" })
      toast({
        title: t("transactions.deleteSuccess"),
        description: t("transactions.transactionDeletedSuccessfully"),
      })
      setDeleteUid(null)
      // Refetch transactions
      setCurrentPage(1)
    } catch (err: any) {
      const backendError = err?.message || t("transactions.failedToDelete")
      setError(backendError)
      toast({
        title: t("transactions.failedToDelete"),
        description: backendError,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Listen for transaction_update WebSocket messages - COMMENTED OUT
  // const { lastMessage } = useWebSocket();
  // useEffect(() => {
  //   if (!lastMessage) return;
  //   try {
  //     const data = typeof lastMessage.data === "string" ? JSON.parse(lastMessage.data) : lastMessage.data;

  //     // Handle new transaction creation (per backend docs)
  //     if (data.type === "new_transaction" && data.event === "transaction_created" && data.transaction_data) {
  //       const newTx = data.transaction_data;
  //       // If user is on page 1, show it immediately on top; otherwise, just bump count
  //       setTransactions(prev => (currentPage === 1 ? [newTx, ...prev].slice(0, itemsPerPage) : prev));
  //       setTotalCount(prev => prev + 1);
  //       toast({
  //         title: t("transactions.created") || "Transaction created",
  //         description: data.message || `${t("transactions.transaction")} ${newTx.uid} ${t("transactions.createdSuccessfully") || "was created."}`,
  //       });
  //       return;
  //     }

  //     // Handle live transaction updates (existing behavior)
  //     if (data.type === "transaction_update" && data.transaction_uid) {
  //       setTransactions((prev) =>
  //         prev.map((tx) =>
  //           tx.uid === data.transaction_uid
  //             ? { ...tx, status: data.status, ...data.data }
  //             : tx
  //         )
  //       );
  //       toast({
  //         title: t("transactions.liveUpdate"),
  //         description: `${t("transactions.transaction")} ${data.transaction_uid} ${t("transactions.statusUpdated")}: ${data.status}`,
  //       });
  //       return;
  //     }

  //     // Optionally surface system events as informational toasts
  //     if (data.type === "system_event" && data.event === "system_event_created") {
  //       toast({
  //         title: t("transactions.systemEvent") || "System event",
  //         description: data.message || data?.event_data?.description || "",
  //       });
  //       return;
  //     }
  //   } catch (err) {
  //     // Optionally log or handle parse errors
  //   }
  // }, [lastMessage, t, toast, currentPage, itemsPerPage]);

  // Retry modal state
  const [retryModalOpen, setRetryModalOpen] = useState(false)
  const [retryReason, setRetryReason] = useState("")
  const [retryLoading, setRetryLoading] = useState(false)
  const [retryError, setRetryError] = useState("")
  const [retryTransaction, setRetryTransaction] = useState<any | null>(null)

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState("")
  const [cancelTransaction, setCancelTransaction] = useState<any | null>(null)

  // Mark as success modal state
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [successReason, setSuccessReason] = useState("")
  const [successLoading, setSuccessLoading] = useState(false)
  const [successError, setSuccessError] = useState("")
  const [successTransaction, setSuccessTransaction] = useState<any | null>(null)

  // Mark as failed modal state
  const [failedModalOpen, setFailedModalOpen] = useState(false)
  const [failedReason, setFailedReason] = useState("")
  const [failedLoading, setFailedLoading] = useState(false)
  const [failedError, setFailedError] = useState("")
  const [failedTransaction, setFailedTransaction] = useState<any | null>(null)

  // Extract a user uid from transaction, trying several likely fields
  const extractUserUid = (tx: any): string | null => {
    return tx?.user_uid || tx?.user_id || tx?.user?.uid || tx?.owner_uid || null
  }

  // Assign transaction to its user
  const handleAssign = async (tx: any) => {
    const userUid = extractUserUid(tx)
    if (!userUid) {
      toast({
        title: t("transactions.assignFailed") || "Assign failed",
        description: t("transactions.userIdMissing") || "User ID not found on this transaction.",
        variant: "destructive",
      })
      return
    }
    try {
      const endpoint = `${baseUrl}api/payments/transactions/${tx.uid}/assign/`
      await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_uid: userUid }),
      })
      toast({
        title: t("transactions.assignSuccess") || "Assigned",
        description: t("transactions.assignedSuccessfully") || "Transaction assigned successfully.",
      })
      // Refresh list
      setCurrentPage(1)
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("transactions.assignFailed") || "Failed to assign transaction"
      toast({ title: t("transactions.assignFailed") || "Assign failed", description: errorMessage, variant: "destructive" })
    }
  }

  // Open retry modal
  const openRetryModal = (tx: any) => {
    setRetryTransaction(tx)
    setRetryReason("")
    setRetryError("")
    setRetryModalOpen(true)
  }

  // Submit retry request
  const handleRetrySubmit = async () => {
    if (!retryTransaction) return
    if (!retryReason.trim()) {
      setRetryError(t("transactions.retryReasonRequired") || "Reason is required")
      return
    }
    setRetryLoading(true)
    setRetryError("")
    try {
      const endpoint = `${baseUrl}api/payments/transactions/${retryTransaction.uid}/retry/`
      await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: retryReason.trim() }),
      })
      toast({
        title: t("transactions.retryQueued") || "Retry queued",
        description: t("transactions.retryRequested") || "Retry request sent successfully.",
      })
      setRetryModalOpen(false)
      setRetryTransaction(null)
      setRetryReason("")
      // Refresh list
      setCurrentPage(1)
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("transactions.retryFailed") || "Failed to retry transaction"
      setRetryError(errorMessage)
      toast({ title: t("transactions.retryFailed") || "Retry failed", description: errorMessage, variant: "destructive" })
    } finally {
      setRetryLoading(false)
    }
  }

  // Open/submit cancel
  const openCancelModal = (tx: any) => {
    setCancelTransaction(tx)
    setCancelReason("")
    setCancelError("")
    setCancelModalOpen(true)
  }
  const handleCancelSubmit = async () => {
    if (!cancelTransaction) return
    if (!cancelReason.trim()) {
      setCancelError(t("transactions.cancelReasonRequired") || "Reason is required")
      return
    }
    setCancelLoading(true)
    setCancelError("")
    try {
      const endpoint = `${baseUrl}api/payments/transactions/${cancelTransaction.uid}/cancel/`
      await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      })
      toast({
        title: t("transactions.cancelQueued") || "Cancel queued",
        description: t("transactions.cancelRequested") || "Cancel request sent successfully.",
      })
      setCancelModalOpen(false)
      setCancelTransaction(null)
      setCancelReason("")
      setCurrentPage(1)
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("transactions.cancelFailed") || "Failed to cancel transaction"
      setCancelError(errorMessage)
      toast({ title: t("transactions.cancelFailed") || "Cancel failed", description: errorMessage, variant: "destructive" })
    } finally {
      setCancelLoading(false)
    }
  }

  // Open/submit success
  const openSuccessModal = (tx: any) => {
    setSuccessTransaction(tx)
    setSuccessReason("")
    setSuccessError("")
    setSuccessModalOpen(true)
  }
  const handleSuccessSubmit = async () => {
    if (!successTransaction) return
    if (!successReason.trim()) {
      setSuccessError(t("transactions.successReasonRequired") || "Reason is required")
      return
    }
    setSuccessLoading(true)
    setSuccessError("")
    try {
      const endpoint = `${baseUrl}api/payments/transactions/${successTransaction.uid}/success/`
      await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: successReason.trim() }),
      })
      toast({
        title: t("transactions.successQueued") || "Success queued",
        description: t("transactions.successRequested") || "Success update sent successfully.",
      })
      setSuccessModalOpen(false)
      setSuccessTransaction(null)
      setSuccessReason("")
      setCurrentPage(1)
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("transactions.successFailed") || "Failed to mark transaction as success"
      setSuccessError(errorMessage)
      toast({ title: t("transactions.successFailed") || "Mark as success failed", description: errorMessage, variant: "destructive" })
    } finally {
      setSuccessLoading(false)
    }
  }

  // Open/submit failed
  const openFailedModal = (tx: any) => {
    setFailedTransaction(tx)
    setFailedReason("")
    setFailedError("")
    setFailedModalOpen(true)
  }
  const handleFailedSubmit = async () => {
    if (!failedTransaction) return
    if (!failedReason.trim()) {
      setFailedError(t("transactions.failedReasonRequired") || "Reason is required")
      return
    }
    setFailedLoading(true)
    setFailedError("")
    try {
      const endpoint = `${baseUrl}api/payments/transactions/${failedTransaction.uid}/mark-failed/`
      await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: failedReason.trim() }),
      })
      toast({
        title: t("transactions.failedQueued") || "Failed queued",
        description: t("transactions.failedRequested") || "Failed update sent successfully.",
      })
      setFailedModalOpen(false)
      setFailedTransaction(null)
      setFailedReason("")
      setCurrentPage(1)
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("transactions.failedFailed") || "Failed to mark transaction as failed"
      setFailedError(errorMessage)
      toast({ title: t("transactions.failedFailed") || "Mark as failed failed", description: errorMessage, variant: "destructive" })
    } finally {
      setFailedLoading(false)
    }
  }

  if (false && loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg font-semibold">{t("common.loading")}</span>
      </div>
    )
  }

  if (false && error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={fetchTransactions}
        variant="full"
        showDismiss={false}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Create Transaction Button */}
      <div className="flex justify-end">
        {/* <Button onClick={() => setCreateModalOpen(true)} className="mb-4" variant="default">
          <Plus className="w-4 h-4 mr-2" />
          {t("transactions.createTransaction") || "Create Transaction"}
        </Button> */}
      </div>
      {/* Create Transaction Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("transactions.createTransaction") || "Create Transaction"}</DialogTitle>
            <DialogDescription>
              {t("transactions.chooseType") || "Choose transaction type"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 justify-center mt-4">
            <Button
              variant="outline"
              className="w-32"
              onClick={() => {
                setCreateModalOpen(false)
                router.push("/dashboard/transactions/deposit")
              }}
            >
              {t("transactions.deposit") || "Deposit"}
            </Button>
            <Button
              variant="outline"
              className="w-32"
              onClick={() => {
                setCreateModalOpen(false)
                router.push("/dashboard/transactions/withdraw")
              }}
            >
              {t("transactions.withdrawal") || "Withdraw"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
     
      <Card>
        <CardHeader>
          <CardTitle>{t("transactions.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
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
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder={t("transactions.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("transactions.allStatuses")}</SelectItem>
                <SelectItem value="completed">{t("transactions.completed")}</SelectItem>
                <SelectItem value="success">{t("transactions.success")}</SelectItem>
                <SelectItem value="pending">{t("transactions.pending")}</SelectItem>
                <SelectItem value="failed">{t("transactions.failed")}</SelectItem>
                <SelectItem value="sent_to_user">{t("transactions.sentToUser")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder={t("transactions.allTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("transactions.allTypes")}</SelectItem>
                <SelectItem value="deposit">{t("transactions.deposit")}</SelectItem>
                <SelectItem value="withdrawal">{t("transactions.withdrawal")}</SelectItem>
                <SelectItem value="transfer">{t("transactions.transfer")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 flex-1">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("transactions.startDate") || "Start Date"}
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
                  {t("transactions.endDate") || "End Date"}
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
                {t("transactions.clearDates") || "Clear Dates"}
              </Button>
            </div>
          </div>

          {/* Inline error display to avoid unmounting the page */}
          {error && (
            <div className="mb-4">
              <ErrorDisplay
                error={error}
                onRetry={fetchTransactions}
                variant="full"
                showDismiss={false}
              />
            </div>
          )}
          {/* Table */}
          <div className="rounded-md border min-h-[200px]">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">{t("common.loading")}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("transactions.reference")}</TableHead>
                    <TableHead>
                      <Button type="button" variant="ghost" onClick={() => handleSort("amount")} className="h-auto p-0 font-semibold">
                        {t("transactions.amount")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>{t("transactions.recipientName")}</TableHead>
                    <TableHead>{t("transactions.recipientPhone")}</TableHead>
                    <TableHead>{t("transactions.createdByName") || "Created By Name"}</TableHead>
                    <TableHead>{t("transactions.createdByEmail") || "Created By Email"}</TableHead>
                    <TableHead>{t("transactions.createdByPhone") || "Created By Phone"}</TableHead>
                    <TableHead>
                      <Button type="button" variant="ghost" onClick={() => handleSort("date")} className="h-auto p-0 font-semibold">
                        {t("transactions.date")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>{t("transactions.type")}</TableHead>
                    <TableHead>{t("transactions.network")}</TableHead>
                    <TableHead>{t("transactions.status")}</TableHead>
                    <TableHead>{t("transactions.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-muted-foreground">{t("transactions.noTransactionsFound")}</TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransactions.map((transaction) => (
                      <TableRow key={transaction.uid}>
                        <TableCell>{transaction.reference || "-"}</TableCell>
                        <TableCell className="font-medium">{parseFloat(transaction.amount).toLocaleString()} FCFA</TableCell>
                        <TableCell>{transaction.display_recipient_name || "-"}</TableCell>
                        <TableCell>{transaction.recipient_phone || "-"}</TableCell>
                        <TableCell>{transaction.created_by_name || "-"}</TableCell>
                        <TableCell>{transaction.created_by_email || "-"}</TableCell>
                        <TableCell>{transaction.created_by_phone || "-"}</TableCell>
                        <TableCell>{transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                        <TableCell>{transaction.network_name || "-"}</TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openRetryModal(transaction)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  {t("transactions.retry") || "Retry"}
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openCancelModal(transaction)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  {t("transactions.cancelAction") || "Cancel Transaction"}
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openSuccessModal(transaction)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  {t("transactions.markSuccess") || "Mark as Success"}
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openFailedModal(transaction)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  {t("transactions.markFailed") || "Mark as Failed"}
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={`/dashboard/transactions/${transaction.uid}/edit`} className="text-gray-600 hover:text-gray-700">
                                  <div className="flex items-center gap-2">
                                    <Pencil className="w-4 h-4" />
                                    {t("transactions.edit") || "Edit"}
                                  </div>
                                </a>
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
              {`${t("transactions.showingResults")}: ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalCount)} / ${totalCount}`}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("common.previous")}
              </Button>
              <div className="text-sm">
                {`${t("transactions.pageOf")}: ${currentPage}/${totalPages}`}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
              >
                {t("common.next")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Transaction Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("transactions.editTransaction")}</DialogTitle>
            <DialogDescription>{t("transactions.updateTransactionDetails")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <label>{t("transactions.status")}
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="completed">{t("transactions.completed")}</option>
                  <option value="success">{t("transactions.success")}</option>
                  <option value="pending">{t("transactions.pending")}</option>
                  <option value="failed">{t("transactions.failed")}</option>
                  <option value="sent_to_user">{t("transactions.sentToUser")}</option>
                </select>
              </label>
              <label>{t("transactions.externalTransactionId")}
                <Input name="external_transaction_id" value={editForm.external_transaction_id} onChange={handleEditChange} />
              </label>
              <label>{t("transactions.balanceBefore")}
                <Input name="balance_before" value={editForm.balance_before} onChange={handleEditChange} />
              </label>
              <label>{t("transactions.balanceAfter")}
                <Input name="balance_after" value={editForm.balance_after} onChange={handleEditChange} />
              </label>
              <label>{t("transactions.fees")}
                <Input name="fees" value={editForm.fees} onChange={handleEditChange} />
              </label>
              <label>{t("transactions.confirmationMessage")}
                <Input name="confirmation_message" value={editForm.confirmation_message} onChange={handleEditChange} />
              </label>
              <label>{t("transactions.rawSms")}
                <Input name="raw_sms" value={editForm.raw_sms} onChange={handleEditChange} />
              </label>
              <label>{t("transactions.completedAt")}
                <Input name="completed_at" value={editForm.completed_at} onChange={handleEditChange} type="datetime-local" />
              </label>
              <label>{t("transactions.errorMessage")}
                <Input name="error_message" value={editForm.error_message} onChange={handleEditChange} />
              </label>
            </div>
            {editError && (
              <ErrorDisplay
                error={editError}
                variant="inline"
                showRetry={false}
                className="mb-4"
              />
            )}
            <DialogFooter>
              <Button type="submit" disabled={editLoading}>{editLoading ? t("transactions.saving") : (t("transactions.reviewAndConfirm") || t("transactions.saveChanges"))}</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">{t("transactions.cancel")}</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Confirmation Modal */}
      <Dialog open={showEditConfirm} onOpenChange={setShowEditConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("transactions.confirmEditTitle") || t("transactions.reviewAndConfirm") || "Confirm Changes"}</DialogTitle>
            <DialogDescription>
              {t("transactions.reviewBeforeSaving") || "Please review the details below before saving changes."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">UID:</span><span className="font-medium">{editTransaction?.uid}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("transactions.status")}:</span><span className="font-medium">{pendingEditPayload?.status || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("transactions.externalTransactionId")}:</span><span className="font-medium">{pendingEditPayload?.external_transaction_id || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("transactions.fees")}:</span><span className="font-medium">{pendingEditPayload?.fees || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("transactions.completedAt")}:</span><span className="font-medium">{pendingEditPayload?.completed_at || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("transactions.errorMessage")}:</span><span className="font-medium">{pendingEditPayload?.error_message || "-"}</span></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditConfirm(false)} disabled={editLoading}>
              {t("transactions.cancel")}
            </Button>
            <Button onClick={confirmEditAndSend} disabled={editLoading}>
              {editLoading ? (t("transactions.saving") || "Saving...") : (t("transactions.submit") || "Submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retry Transaction Modal */}
      <Dialog open={retryModalOpen} onOpenChange={setRetryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("transactions.retryTransaction") || "Retry Transaction"}</DialogTitle>
            <DialogDescription>{t("transactions.enterRetryReason") || "Provide a reason for retrying this transaction."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              {t("transactions.reason") || "Reason"}
            </label>
            <Input
              placeholder={t("transactions.reasonPlaceholder") || "Tentative de relance après timeout"}
              value={retryReason}
              onChange={(e) => setRetryReason(e.target.value)}
            />
            {retryError && (
              <ErrorDisplay error={retryError} variant="inline" showRetry={false} className="mb-2" />
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleRetrySubmit} disabled={retryLoading}>
              {retryLoading ? (t("transactions.sending") || "Sending...") : (t("transactions.submit") || "Submit")}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">{t("transactions.cancel")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Transaction Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("transactions.cancelTransaction") || "Cancel Transaction"}</DialogTitle>
            <DialogDescription>{t("transactions.enterCancelReason") || "Provide a reason for cancelling this transaction."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              {t("transactions.reason") || "Reason"}
            </label>
            <Input
              placeholder={t("transactions.reasonPlaceholder") || "Tentative de relance après timeout"}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            {cancelError && (
              <ErrorDisplay error={cancelError} variant="inline" showRetry={false} className="mb-2" />
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCancelSubmit} disabled={cancelLoading}>
              {cancelLoading ? (t("transactions.sending") || "Sending...") : (t("transactions.submit") || "Submit")}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">{t("transactions.cancel")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Success Modal */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("transactions.successTransaction") || "Mark Transaction as Success"}</DialogTitle>
            <DialogDescription>{t("transactions.enterSuccessReason") || "Provide a reason for marking this transaction as success."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              {t("transactions.reason") || "Reason"}
            </label>
            <Input
              placeholder={t("transactions.reasonPlaceholder") || "Tentative de relance après timeout"}
              value={successReason}
              onChange={(e) => setSuccessReason(e.target.value)}
            />
            {successError && (
              <ErrorDisplay error={successError} variant="inline" showRetry={false} className="mb-2" />
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSuccessSubmit} disabled={successLoading}>
              {successLoading ? (t("transactions.sending") || "Sending...") : (t("transactions.submit") || "Submit")}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">{t("transactions.cancel")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Failed Modal */}
      <Dialog open={failedModalOpen} onOpenChange={setFailedModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("transactions.failedTransaction") || "Mark Transaction as Failed"}</DialogTitle>
            <DialogDescription>{t("transactions.enterFailedReason") || "Provide a reason for marking this transaction as failed."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              {t("transactions.reason") || "Reason"}
            </label>
            <Input
              placeholder={t("transactions.reasonPlaceholder") || "Tentative de relance après timeout"}
              value={failedReason}
              onChange={(e) => setFailedReason(e.target.value)}
            />
            {failedError && (
              <ErrorDisplay error={failedError} variant="inline" showRetry={false} className="mb-2" />
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleFailedSubmit} disabled={failedLoading}>
              {failedLoading ? (t("transactions.sending") || "Sending...") : (t("transactions.submit") || "Submit")}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">{t("transactions.cancel")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
