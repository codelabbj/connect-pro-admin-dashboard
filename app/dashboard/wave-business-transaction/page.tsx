"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
}

interface ApiResponse {
  count: number
  next: string | null
  previous: string | null
  results: WaveBusinessTransaction[]
}

export default function WaveBusinessPage() {
  const [searchTerm, setSearchTerm] = useState("")
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
  const handleOpenDetail = (transaction: WaveBusinessTransaction) => {
    setDetailModalOpen(true)
    setDetailTransaction(transaction)
    setDetailError("")
    // GET requests don't show success toasts automatically
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

      {/* Modal des détails de la transaction */}
      <Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la transaction</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="p-4 text-center">Chargement...</div>
          ) : detailError ? (
            <ErrorDisplay
              error={detailError}
              variant="inline"
              showRetry={false}
              className="mb-4"
            />
          ) : detailTransaction ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <div className="flex items-center gap-2">
                <b>UID :</b> 
                <span className="font-mono text-sm">{detailTransaction.uid}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => copyToClipboard(detailTransaction.uid, "UID")}
                  aria-label="Copier l'UID"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <b>Référence :</b> 
                <span className="font-mono text-sm">{detailTransaction.reference}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => copyToClipboard(detailTransaction.reference, "Référence")}
                  aria-label="Copier la référence"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div><b>Montant :</b> {formatAmount(detailTransaction.amount)}</div>
              <div><b>Montant (entier) :</b> {detailTransaction.amount_as_integer.toLocaleString("fr-FR")}</div>
              <div><b>Téléphone destinataire :</b> {detailTransaction.recipient_phone}</div>
              <div><b>Statut :</b> {getStatusBadge(detailTransaction.status, detailTransaction.is_expired)}</div>
              <div><b>Créé par :</b> {detailTransaction.created_by}</div>
              <div><b>URL de callback :</b> <span className="text-sm break-all">{detailTransaction.callback_url}</span></div>
              <div><b>Date de création :</b> {formatDate(detailTransaction.created_at)}</div>
              <div><b>Date de mise à jour :</b> {formatDate(detailTransaction.updated_at)}</div>
              <div><b>Date d'expiration :</b> {formatDate(detailTransaction.expires_at)}</div>
              <div><b>Date de confirmation :</b> {detailTransaction.confirmed_at ? formatDate(detailTransaction.confirmed_at) : "Non confirmé"}</div>
              <div><b>Expiré :</b> {detailTransaction.is_expired ? "Oui" : "Non"}</div>
              <div><b>Notifications FCM :</b> {detailTransaction.fcm_notifications.length} notification(s)</div>
            </div>
          ) : null}
          <DialogClose asChild>
            <Button className="mt-4 w-full">Fermer</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  )
}