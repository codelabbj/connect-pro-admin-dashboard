"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useApi } from "@/lib/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy, Eye, X, Edit, MoreHorizontal, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/components/providers/language-provider"
import { Loader } from "lucide-react"
import { formatApiDateTime } from "@/lib/utils";

interface MomoPayTransaction {
  uid: string
  amount: string
  amount_as_integer: number
  recipient_phone: string
  status: "pending" | "confirmed" | "cancelled" | "expired" | "failed"
  reference: string
  created_by: number
  fcm_notifications: any[]
  callback_url: string
  confirmed_at: string | null
  expires_at: string
  is_expired: boolean
  created_at: string
  updated_at: string
  payment_type?: string
  description?: string
  external_id?: string | null
  sms?: any[]
}

interface ApiResponse {
  count: number
  next: string | null
  previous: string | null
  results: MomoPayTransaction[]
}



export default function MomoPayTransactionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Chargement...</div>}>
      <MomoPayTransactionsContent />
    </Suspense>
  )
}

function MomoPayTransactionsContent() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [phoneFilter, setPhoneFilter] = useState("")
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [includeExpired, setIncludeExpired] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [transactions, setTransactions] = useState<MomoPayTransaction[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<"amount" | "recipient_phone" | "created_at" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const { toast } = useToast()
  const apiFetch = useApi()
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailTransaction, setDetailTransaction] = useState<MomoPayTransaction | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelTransaction, setCancelTransaction] = useState<MomoPayTransaction | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [updateTransaction, setUpdateTransaction] = useState<MomoPayTransaction | null>(null)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateForm, setUpdateForm] = useState({
    amount: "",
    recipient_phone: "",
    description: "",
    callback_url: ""
  })

  // Dropdown Modal actions
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [successReason, setSuccessReason] = useState("")
  const [successLoading, setSuccessLoading] = useState(false)
  const [successTransaction, setSuccessTransaction] = useState<any | null>(null)

  const [failedModalOpen, setFailedModalOpen] = useState(false)
  const [failedReason, setFailedReason] = useState("Tentative de relance après timeout")
  const [failedLoading, setFailedLoading] = useState(false)
  const [failedTransaction, setFailedTransaction] = useState<any | null>(null)

  const { t } = useLanguage()
  const itemsPerPage = 20


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
          params.append("reference", searchTerm)
        }
        if (statusFilter !== "all") {
          params.append("status", statusFilter)
        }
        if (phoneFilter.trim() !== "") {
          params.append("phone", phoneFilter)
        }
        if (paymentTypeFilter !== "all") {
          params.append("payment_type", paymentTypeFilter)
        }
        if (includeExpired) {
          params.append("include_expired", "true")
        }
        if (startDate) {
          params.append("created_at__gte", startDate)
        }
        if (endDate) {
          // Add one day to end date to include the entire end date
          const endDateObj = new Date(endDate)
          endDateObj.setDate(endDateObj.getDate() + 1)
          params.append("created_at__lt", endDateObj.toISOString().split('T')[0])
        }

        const orderingParam = sortField
          ? `&ordering=${(sortDirection === "asc" ? "" : "-")}${sortField}`
          : ""

        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/momo-pay-transactions/?${params.toString()}${orderingParam}`
        const data: ApiResponse = await apiFetch(endpoint)

        setTransactions(data.results || [])
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))

        toast({
          title: "Succès",
          description: "Transactions MoMo Pay chargées avec succès"
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        setTransactions([])
        setTotalCount(0)
        setTotalPages(1)
        toast({
          title: "Erreur de chargement",
          description: errorMessage,
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [searchTerm, currentPage, itemsPerPage, baseUrl, statusFilter, phoneFilter, paymentTypeFilter, startDate, endDate, includeExpired, sortField, sortDirection, toast, apiFetch])

  // After mount: initialize from URL params (safe for SSR)
  useEffect(() => {
    const ref = searchParams.get("reference")
    if (ref) setSearchTerm(ref)
    const uid = searchParams.get("uid")
    if (uid) {
      handleOpenDetail({ uid } as any)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startIndex = (currentPage - 1) * itemsPerPage

  const handleSort = (field: "amount" | "recipient_phone" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getStatusBadge = (status: string, isExpired: boolean) => {
    if (isExpired) {
      return <Badge variant="destructive">Expiré</Badge>
    }

    switch (status) {
      case "pending":
        return <Badge variant="secondary">En attente</Badge>
      case "confirmed":
        return <Badge variant="default">Confirmé</Badge>
      case "cancelled":
        return <Badge variant="outline">Annulé</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return formatApiDateTime(dateString)
  }

  const formatAmount = (amount: string) => {
    return `${parseFloat(amount).toLocaleString("fr-FR")} FCFA`
  }

  // Open transaction details
  const handleOpenDetail = async (transaction: MomoPayTransaction) => {
    setDetailModalOpen(true)
    setDetailTransaction(transaction)
    setDetailError("")
    setDetailLoading(true)

    try {
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/momo-pay-transactions/${transaction.uid}/`
      const detailedTransaction: MomoPayTransaction = await apiFetch(endpoint)
      setDetailTransaction(detailedTransaction)
      toast({
        title: "Détail chargé",
        description: "Détails de la transaction affichés avec succès"
      })
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setDetailError(errorMessage)
      toast({
        title: "Erreur de chargement",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setDetailModalOpen(false)
    setDetailTransaction(null)
    setDetailError("")
  }

  const openSuccessModal = (tx: any) => {
    setSuccessTransaction(tx)
    setSuccessReason("")
    setSuccessModalOpen(true)
  }

  const handleSuccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!successTransaction) return
    setSuccessLoading(true)
    try {
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/momo-pay-transactions/${successTransaction.uid}/success/`
      await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: (successReason.trim() || "Confirmation manuelle") }),
      })
      setSuccessModalOpen(false)
      window.location.reload()
    } catch (err: any) {
      toast({ title: t("common.error") || "Error", description: extractErrorMessages(err), variant: "destructive" })
    } finally {
      setSuccessLoading(false)
    }
  }

  const openFailedModal = (tx: any) => {
    setFailedTransaction(tx)
    setFailedReason("Tentative de relance après timeout")
    setFailedModalOpen(true)
  }

  const handleFailedSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!failedTransaction) return
    setFailedLoading(true)
    try {
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/momo-pay-transactions/${failedTransaction.uid}/failed/`
      await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: (failedReason.trim() || "Échec") }),
      })
      setFailedModalOpen(false)
      window.location.reload()
    } catch (err: any) {
      toast({ title: t("common.error") || "Error", description: extractErrorMessages(err), variant: "destructive" })
    } finally {
      setFailedLoading(false)
    }
  }

  // Cancel transaction
  const handleCancelTransaction = async () => {
    if (!cancelTransaction) return

    setCancelLoading(true)
    try {
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/momo-pay-transactions/${cancelTransaction.uid}/cancel/`
      await apiFetch(endpoint, { method: "POST" })
      // Success toast is automatically shown by useApi hook for non-GET requests

      setCancelModalOpen(false)
      setCancelTransaction(null)

      // Refresh the transactions list
      window.location.reload()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      toast({
        title: "Erreur d'annulation",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setCancelLoading(false)
    }
  }

  // Update transaction
  const handleOpenUpdate = (transaction: MomoPayTransaction) => {
    setUpdateTransaction(transaction)
    setUpdateForm({
      amount: transaction.amount,
      recipient_phone: transaction.recipient_phone,
      description: transaction.description || "",
      callback_url: transaction.callback_url
    })
    setUpdateModalOpen(true)
  }

  const handleUpdateTransaction = async () => {
    if (!updateTransaction) return

    setUpdateLoading(true)
    try {
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/momo-pay-transactions/${updateTransaction.uid}/`
      await apiFetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateForm)
      })

      toast({
        title: "Succès",
        description: "Transaction mise à jour avec succès"
      })

      setUpdateModalOpen(false)
      setUpdateTransaction(null)

      // Refresh the transactions list
      window.location.reload()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      toast({
        title: "Erreur de mise à jour",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setUpdateLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: `${label} copié !` })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>MoMo Pay Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search & Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par référence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Input
                placeholder="Filtrer par téléphone..."
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                className="w-full sm:w-48"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Type de paiement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                  <SelectItem value="card">Carte</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Switch
                  id="include-expired"
                  checked={includeExpired}
                  onCheckedChange={setIncludeExpired}
                />
                <label htmlFor="include-expired" className="text-sm font-medium">
                  Inclure les expirés
                </label>
              </div>
            </div>

            {/* Date Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex flex-col lg:flex-row gap-4 flex-1">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date de début
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
                    Date de fin
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
                  Effacer les dates
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Chargement...</div>
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
                    <TableHead>Référence</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("amount")} className="h-auto p-0 font-semibold">
                        Montant
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("recipient_phone")} className="h-auto p-0 font-semibold">
                        Téléphone destinataire
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Type de paiement</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("created_at")} className="h-auto p-0 font-semibold">
                        Date de création
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Date d'expiration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.uid}>
                      <TableCell className="font-mono text-sm">
                        {transaction.reference}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatAmount(transaction.amount)}
                      </TableCell>
                      <TableCell>{transaction.recipient_phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.payment_type || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status, transaction.is_expired)}
                      </TableCell>
                      <TableCell>{formatDate(transaction.created_at)}</TableCell>
                      <TableCell>{formatDate(transaction.expires_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDetail(transaction)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                          {transaction.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenUpdate(transaction)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Modifier
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setCancelTransaction(transaction)
                                  setCancelModalOpen(true)
                                }}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Annuler
                              </Button>
                            </>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {transaction.status === "pending" || transaction.status === "failed" ? (
                                <DropdownMenuItem onClick={() => openSuccessModal(transaction)}>
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  <span>Marquer comme Succès</span>
                                </DropdownMenuItem>
                              ) : null}
                              {transaction.status === "pending" || transaction.status === "confirmed" ? (
                                <DropdownMenuItem onClick={() => openFailedModal(transaction)}>
                                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                  <span>Marquer comme Échec</span>
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
              {`Résultats affichés : ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalCount)} sur ${totalCount}`}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
              <div className="text-sm">
                {`Page ${currentPage} sur ${totalPages}`}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("transactions.details")}</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader className="animate-spin h-8 w-8 text-blue-600" />
              <p className="text-slate-500">{t("common.loading")}</p>
            </div>
          ) : detailError ? (
            <ErrorDisplay
              error={detailError}
              variant="inline"
              showRetry={false}
              className="mb-4"
            />
          ) : detailTransaction ? (
            <div className="space-y-6 mt-4">
              {/* Identifiers */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 mb-3 tracking-wide uppercase">{t("common.identifiers")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                    <span className="text-slate-500">{t("common.uid")} :</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs font-medium">{detailTransaction.uid}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(detailTransaction.uid, "UID")}>
                        <Copy size={12} />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                    <span className="text-slate-500">{t("transactions.reference")} :</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs font-medium">{detailTransaction.reference}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(detailTransaction.reference, "Référence")}>
                        <Copy size={12} />
                      </Button>
                    </div>
                  </div>
                  {detailTransaction.external_id && (
                    <div className="flex justify-between items-center col-span-full bg-slate-50 p-2 rounded border-l-4 border-slate-300">
                      <span className="text-slate-500">{t("transactions.externalId")} :</span>
                      <span className="font-mono text-xs font-medium">{detailTransaction.external_id}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Financials */}
              <section className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-300 pb-2 mb-3 tracking-wide uppercase">{t("common.financials")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">{t("transactions.amount")} :</span>
                    <span className="text-lg font-bold text-slate-900">{formatAmount(detailTransaction.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">{t("transactions.recipientPhone")} :</span>
                    <span className="font-medium">{detailTransaction.recipient_phone}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-slate-200 mt-1">
                    <span className="text-slate-500">{t("transactions.type")} :</span>
                    <Badge variant="outline">{detailTransaction.payment_type || "N/A"}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-slate-200 mt-1">
                    <span className="text-slate-500">Amount (Int) :</span>
                    <span className="font-medium">{detailTransaction.amount_as_integer.toLocaleString()}</span>
                  </div>
                </div>
              </section>

              {/* Status & Meta */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 mb-3 tracking-wide uppercase">{t("common.statusAndMeta")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">{t("transactions.status")} :</span>
                    {getStatusBadge(detailTransaction.status, detailTransaction.is_expired)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">{t("transactions.createdAt")} :</span>
                    <span className="font-medium">{formatDate(detailTransaction.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">{t("transactions.completedAt")} :</span>
                    <span className="font-medium">{detailTransaction.confirmed_at ? formatDate(detailTransaction.confirmed_at) : "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Expires At :</span>
                    <span className="font-medium">{formatDate(detailTransaction.expires_at)}</span>
                  </div>
                </div>
                {detailTransaction.description && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded text-blue-800 text-sm italic">
                    <p className="font-semibold not-italic mb-1 text-xs uppercase opacity-70 italic">Description :</p>
                    {detailTransaction.description}
                  </div>
                )}
              </section>

              {/* System Messages */}
              {detailTransaction.sms && detailTransaction.sms.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 mb-3 tracking-wide uppercase">{t("common.messages")}</h3>
                  <div className="space-y-2">
                    {detailTransaction.sms.map((msg: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-[10px] leading-relaxed break-all">
                        <p className="font-sans font-semibold mb-1 text-xs uppercase opacity-70">SMS {idx + 1} ({msg.timestamp}):</p>
                        {msg.body || JSON.stringify(msg)}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Raw Response */}
              <section className="mt-6 border-t pt-6">
                <details className="group">
                  <summary className="flex items-center cursor-pointer text-sm font-semibold text-slate-900 tracking-wide uppercase list-none">
                    <span className="mr-2 transition-transform group-open:rotate-90">▶</span>
                    {t("common.rawResponse")}
                  </summary>
                  <div className="mt-4 p-4 bg-slate-900 rounded-lg overflow-x-auto">
                    <pre className="text-[10px] text-emerald-400 font-mono leading-relaxed">
                      {JSON.stringify(detailTransaction, null, 2)}
                    </pre>
                  </div>
                </details>
              </section>
            </div>
          ) : null}
          <DialogFooter className="mt-6 border-t pt-4">
            <Button variant="outline" onClick={handleCloseDetail} className="w-full">
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Transaction Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la transaction</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Êtes-vous sûr de vouloir annuler cette transaction ?</p>
            {cancelTransaction && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p><strong>Référence:</strong> {cancelTransaction.reference}</p>
                <p><strong>Montant:</strong> {formatAmount(cancelTransaction.amount)}</p>
                <p><strong>Téléphone:</strong> {cancelTransaction.recipient_phone}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelTransaction}
              disabled={cancelLoading}
            >
              {cancelLoading ? "Annulation..." : "Confirmer l'annulation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Transaction Modal */}
      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Montant</Label>
              <Input
                id="amount"
                type="number"
                value={updateForm.amount}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="recipient_phone">Téléphone destinataire</Label>
              <Input
                id="recipient_phone"
                value={updateForm.recipient_phone}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, recipient_phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={updateForm.description}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="callback_url">URL de callback</Label>
              <Input
                id="callback_url"
                value={updateForm.callback_url}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, callback_url: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleUpdateTransaction}
              disabled={updateLoading}
            >
              {updateLoading ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme Succès</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSuccessSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Raison</label>
              <Input
                value={successReason}
                onChange={(e) => setSuccessReason(e.target.value)}
                placeholder="Ex: Confirmation manuelle..."
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setSuccessModalOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={successLoading} className="bg-green-600 hover:bg-green-700 text-white">
                {successLoading ? "Traitement..." : "Confirmer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Failed Modal */}
      <Dialog open={failedModalOpen} onOpenChange={setFailedModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme Échec</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFailedSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Raison de l'échec</label>
              <Input
                value={failedReason}
                onChange={(e) => setFailedReason(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setFailedModalOpen(false)}>Annuler</Button>
              <Button type="submit" variant="destructive" disabled={failedLoading}>
                {failedLoading ? "Traitement..." : "Confirmer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
