"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function AutoRechargeTransactions() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [transactions, setTransactions] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  
  const { t } = useLanguage()
  const itemsPerPage = 20
  const apiFetch = useApi()
  const { toast } = useToast()

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

        if (startDate) {
          params.append("created_at__gte", startDate)
        }

        if (endDate) {
          const endDateObj = new Date(endDate)
          endDateObj.setDate(endDateObj.getDate() + 1)
          params.append("created_at__lt", endDateObj.toISOString().split('T')[0])
        }

        if (sortField) {
          const orderBy = sortField === "date" ? "created_at" : sortField
          const prefix = sortDirection === "desc" ? "-" : ""
          params.append("ordering", `${prefix}${orderBy}`)
        }

        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/auto-recharge/admin/transactions/?${params.toString()}`
        const data = await apiFetch(endpoint)
        
        setTransactions(data.transactions || [])
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        setTransactions([])
        setTotalCount(0)
        setTotalPages(1)
        toast({
          title: t("autoRecharge.transactions.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [searchTerm, currentPage, statusFilter, startDate, endDate, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { labelKey: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      completed: { labelKey: "autoRecharge.transactions.completed", variant: "default" },
      initiated: { labelKey: "autoRecharge.transactions.pending", variant: "secondary" },
      pending: { labelKey: "autoRecharge.transactions.pending", variant: "secondary" },
      failed: { labelKey: "autoRecharge.transactions.failed", variant: "destructive" },
    }
    const statusInfo = statusMap[status?.toLowerCase()] || { labelKey: "", variant: "outline" as const }
    const label = statusInfo.labelKey ? t(statusInfo.labelKey) : status
    return <Badge variant={statusInfo.variant}>{label}</Badge>
  }

  const startIndex = (currentPage - 1) * itemsPerPage

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t("autoRecharge.transactions.search")}
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
            <SelectValue placeholder={t("autoRecharge.transactions.filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("autoRecharge.transactions.allStatus")}</SelectItem>
            <SelectItem value="completed">{t("autoRecharge.transactions.completed")}</SelectItem>
            <SelectItem value="initiated">{t("autoRecharge.transactions.pending")}</SelectItem>
            <SelectItem value="pending">{t("autoRecharge.transactions.pending")}</SelectItem>
            <SelectItem value="failed">{t("autoRecharge.transactions.failed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col lg:flex-row gap-4 flex-1">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("autoRecharge.transactions.startDate")}
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
              {t("autoRecharge.transactions.endDate")}
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
            {t("autoRecharge.transactions.clearDates")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">{t("autoRecharge.loading")}</div>
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
                <TableHead>{t("autoRecharge.transactions.reference")}</TableHead>
                <TableHead>{t("autoRecharge.transactions.phone")}</TableHead>
                <TableHead>{t("autoRecharge.transactions.network")}</TableHead>
                <TableHead>{t("autoRecharge.transactions.aggregator")}</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("amount")} className="h-auto p-0 font-semibold">
                    {t("autoRecharge.transactions.amount")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>{t("autoRecharge.transactions.fees")}</TableHead>
                <TableHead>{t("autoRecharge.transactions.status")}</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("date")} className="h-auto p-0 font-semibold">
                    {t("autoRecharge.transactions.createdAt")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {t("autoRecharge.transactions.noTransactions")}
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.uid}>
                    <TableCell>{transaction.reference || "-"}</TableCell>
                    <TableCell>{transaction.phone_number || "-"}</TableCell>
                    <TableCell>{transaction.network?.nom || "-"}</TableCell>
                    <TableCell>{transaction.aggregator?.name || "-"}</TableCell>
                    <TableCell>{transaction.formatted_amount || "0 FCFA"}</TableCell>
                    <TableCell>{transaction.formatted_fees || "0 FCFA"}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>
                      {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {t("autoRecharge.transactions.showing")}: {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalCount)} {t("autoRecharge.transactions.of")} {totalCount}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("autoRecharge.transactions.previous")}
          </Button>
          <div className="text-sm">
            {t("autoRecharge.transactions.page")} {currentPage} {t("autoRecharge.transactions.of")} {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            {t("autoRecharge.transactions.next")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}

