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

export default function AutoRechargeAggregators() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [aggregators, setAggregators] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  
  const { t } = useLanguage()
  const itemsPerPage = 20
  const apiFetch = useApi()
  const { toast } = useToast()

  useEffect(() => {
    const fetchAggregators = async () => {
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
          params.append("is_active", statusFilter === "active" ? "true" : "false")
        }

        if (sortField) {
          const prefix = sortDirection === "desc" ? "-" : ""
          params.append("ordering", `${prefix}${sortField}`)
        }

        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/auto-recharge/admin/aggregators/?${params.toString()}`
        const data = await apiFetch(endpoint)
        
        setAggregators(data.results || [])
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        setAggregators([])
        setTotalCount(0)
        setTotalPages(1)
        toast({
          title: t("autoRecharge.aggregators.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAggregators()
  }, [searchTerm, currentPage, statusFilter, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const startIndex = (currentPage - 1) * itemsPerPage

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t("autoRecharge.aggregators.search")}
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
            <SelectValue placeholder={t("autoRecharge.aggregators.filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("autoRecharge.aggregators.allStatus")}</SelectItem>
            <SelectItem value="active">{t("autoRecharge.aggregators.active")}</SelectItem>
            <SelectItem value="inactive">{t("autoRecharge.aggregators.inactive")}</SelectItem>
          </SelectContent>
        </Select>
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
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0 font-semibold">
                    {t("autoRecharge.aggregators.name")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>{t("autoRecharge.aggregators.code")}</TableHead>
                <TableHead>{t("autoRecharge.aggregators.description")}</TableHead>
                <TableHead>{t("autoRecharge.aggregators.status")}</TableHead>
                <TableHead>{t("autoRecharge.aggregators.totalTransactions")}</TableHead>
                <TableHead>{t("autoRecharge.aggregators.totalAmountProcessed")}</TableHead>
                <TableHead>{t("autoRecharge.aggregators.successRate")}</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("created_at")} className="h-auto p-0 font-semibold">
                    {t("autoRecharge.aggregators.createdAt")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aggregators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {t("autoRecharge.aggregators.noAggregators")}
                  </TableCell>
                </TableRow>
              ) : (
                aggregators.map((aggregator) => (
                  <TableRow key={aggregator.uid}>
                    <TableCell className="font-medium">{aggregator.name}</TableCell>
                    <TableCell>{aggregator.code}</TableCell>
                    <TableCell className="max-w-xs truncate">{aggregator.description || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={aggregator.is_active ? "default" : "secondary"}>
                        {aggregator.is_active ? t("autoRecharge.aggregators.active") : t("autoRecharge.aggregators.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell>{aggregator.total_transactions || 0}</TableCell>
                    <TableCell>{aggregator.total_amount_processed || "0.00"}</TableCell>
                    <TableCell>{aggregator.success_rate || "0.00"}%</TableCell>
                    <TableCell>
                      {aggregator.created_at ? new Date(aggregator.created_at).toLocaleString() : "-"}
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

