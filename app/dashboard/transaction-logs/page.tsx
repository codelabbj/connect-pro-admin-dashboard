"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function TransactionLogsListPage() {
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [logs, setLogs] = useState<any[]>([])
  const [count, setCount] = useState(0)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handleSearchSubmit = () => {
    setSearchTerm(searchInput.trim())
    setCurrentPage(1)
  }

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: pageSize.toString(),
        })
        if (searchTerm) params.append("search", searchTerm)
        if (startDate) params.append("created_at__gte", startDate)
        if (endDate) {
          // Add one day to end date to include the entire end date
          const endDateObj = new Date(endDate)
          endDateObj.setDate(endDateObj.getDate() + 1)
          params.append("created_at__lt", endDateObj.toISOString().split('T')[0])
        }
        if (sortField) params.append("ordering", `${sortDirection === "asc" ? "+" : "-"}${sortField}`)

        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/transaction-logs/?${params.toString()}`
        const data = await apiFetch(endpoint)

        // API shape example from user: { count, next, previous, results: [] }
        setLogs(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [])
        setCount(typeof data?.count === "number" ? data.count : (Array.isArray(data?.results) ? data.results.length : 0))

        toast({
          title: t("transactionLogs.success") || "Success",
          description: t("transactionLogs.loadedSuccessfully") || "Transaction logs loaded successfully",
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("transactionLogs.failedToLoad") || "Failed to load transaction logs"
        setError(errorMessage)
        setLogs([])
        setCount(0)
        toast({
          title: t("transactionLogs.failedToLoad") || "Failed to load",
          description: errorMessage,
          variant: "destructive",
        })
        console.error("Transaction logs fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [apiFetch, currentPage, pageSize, searchTerm, startDate, endDate, sortField, sortDirection, t])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg font-semibold">{t("common.loading")}</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("transactionLogs.list") || "Transaction Logs"}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and basic controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t("common.search")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchSubmit()
              }}
              onBlur={handleSearchSubmit}
              className="pl-10"
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={handleSearchSubmit}
            >
              {t("common.search")}
            </Button>
          </div>
        </div>
        
        {/* Date Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 flex-1">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("transactionLogs.startDate") || "Start Date"}
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
                {t("transactionLogs.endDate") || "End Date"}
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
              {t("transactionLogs.clearDates") || "Clear Dates"}
            </Button>
          </div>
        </div>

        {error ? (
          <ErrorDisplay
            error={error}
            onRetry={() => setError("")}
            variant="inline"
            className="mb-6"
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* We don't know the exact schema. Try to show common columns if present */}
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("created_at")} className="h-auto p-0 font-semibold">
                      {t("transactionLogs.createdAt") || "Created At"}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>{t("transactionLogs.transactionId") || "Transaction"}</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("status")} className="h-auto p-0 font-semibold">
                      {t("transactionLogs.status") || "Status"}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("amount")} className="h-auto p-0 font-semibold">
                      {t("transactionLogs.amount") || "Amount"}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>{t("transactionLogs.details") || "Details"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any, idx: number) => {
                  const createdAt = log?.created_at || log?.timestamp || "-"
                  const transactionId = log?.transaction_uid || log?.transaction || log?.uid || log?.id || "-"
                  const status = log?.status || log?.event || log?.level || "-"
                  const amount = log?.amount ?? log?.value ?? "-"

                  return (
                    <TableRow key={log?.uid || log?.id || idx}>
                      <TableCell>{typeof createdAt === "string" && createdAt.includes("T") ? createdAt.split("T")[0] : String(createdAt)}</TableCell>
                      <TableCell>{String(transactionId)}</TableCell>
                      <TableCell>{String(status)}</TableCell>
                      <TableCell>{String(amount)}</TableCell>
                      <TableCell>
                        {/* Show compact JSON details as a fallback */}
                        <pre className="max-w-[520px] whitespace-pre-wrap break-words text-xs opacity-80">{JSON.stringify(log, null, 2)}</pre>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                {t("common.page")} {currentPage} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
