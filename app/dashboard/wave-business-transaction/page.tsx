"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useApi } from "@/lib/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/providers/language-provider"
import { Loader } from "lucide-react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

interface WaveBusinessTransaction {
  uid: string
  amount: string
  amount_as_integer: number
  recipient_phone: string
  status: "pending" | "confirmed" | "cancelled" | "expired"
  reference: string
  created_by: number
  fcm_notifications: any[]
  callback_url: string
  confirmed_at: string | null
  expires_at: string
  is_expired: boolean
  created_at: string
  updated_at: string
  external_id?: string | null
}

interface ApiResponse {
  count: number
  next: string | null
  previous: string | null
  results: WaveBusinessTransaction[]
}

export default function WaveBusinessPage() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("reference") || "")
  const [statusFilter, setStatusFilter] = useState("all")
  const [phoneFilter, setPhoneFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [includeExpired, setIncludeExpired] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [transactions, setTransactions] = useState<WaveBusinessTransaction[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<"amount" | "recipient_phone" | "created_at" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const { toast } = useToast()
  const apiFetch = useApi()
  const { t } = useLanguage()
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailTransaction, setDetailTransaction] = useState<WaveBusinessTransaction | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")
  const itemsPerPage = 20

  // Récupérer les transactions depuis l'API
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

        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/wave-business-transactions/?${params.toString()}${orderingParam}`
        const data: ApiResponse = await apiFetch(endpoint)

        setTransactions(data.results || [])
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))

        toast({
          title: "Succès",
          description: "Transactions Wave Business chargées avec succès"
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
  }, [searchTerm, currentPage, itemsPerPage, baseUrl, statusFilter, phoneFilter, startDate, endDate, includeExpired, sortField, sortDirection, toast, apiFetch])

  // Handle UID from searchParams
  useEffect(() => {
    const uid = searchParams.get("uid")
    if (uid) {
      handleOpenDetail({ uid } as any)
    }
  }, [searchParams])

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
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatAmount = (amount: string) => {
    return `${parseFloat(amount).toLocaleString("fr-FR")} FCFA`
  }

  // Ouvrir les détails d'une transaction
  const handleOpenDetail = async (transaction: WaveBusinessTransaction) => {
    setDetailModalOpen(true)
    setDetailTransaction(transaction)
    setDetailError("")
    setDetailLoading(true)

    try {
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/wave-business-transactions/${transaction.uid}/`
      const detailedTransaction: WaveBusinessTransaction = await apiFetch(endpoint)
      setDetailTransaction(detailedTransaction)
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: `${label} copié !` })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Transactions Wave Business</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Recherche & Filtres */}
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

          {/* Tableau */}
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
                        {getStatusBadge(transaction.status, transaction.is_expired)}
                      </TableCell>
                      <TableCell>{formatDate(transaction.created_at)}</TableCell>
                      <TableCell>{formatDate(transaction.expires_at)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDetail(transaction)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
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
              </section>

              {/* System Messages */}
              {detailTransaction.fcm_notifications && detailTransaction.fcm_notifications.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 mb-3 tracking-wide uppercase">{t("common.messages")}</h3>
                  <div className="space-y-2">
                    {detailTransaction.fcm_notifications.map((notif: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-[10px] leading-relaxed break-all">
                        <p className="font-sans font-semibold mb-1 text-xs uppercase opacity-70">Notification {idx + 1} ({notif.timestamp}):</p>
                        {notif.data?.original_body || JSON.stringify(notif.data)}
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
    </Dialog >
    </>
  )
}